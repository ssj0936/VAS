<?php
    ini_set("max_execution_time", 0);

    require_once("DBconfig.php");
    require_once("DBclass.php");
    require_once("function.php");
    $results = array();
    $db = new DB();
    $resultByModule = array();
    $resultByModel = array();
    $resultByDevice = array();
    $resultByCountry = array();
    $startTime = '';
    $endTime = '';

//    $color = '["all"]';
//    $cpu = '["all"]';
//    $rearCamera = '["all"]';
//    $frontCamera = '["all"]';
//    $data = '[{"model":"ZENFONE","devices":"ZENFONE","product":"ZENFONE","datatype":"product"}]';
//    $iso = 'TWN';
//    $countryID = 222164;
//    $permission = '{"":["AK","AT","AZ"],"HKG":["AK","AT","AX","AZ"],"IND":["AK","AT","AX","AZ"],"IDN":["AK","AT","AX","AZ"],"JPN":["AK","AT","AX","AZ"],"MYS":["AK","AT","AX","AZ"],"PHL":["AK","AT","AX","AZ"],"SGP":["AK","AT","AX","AZ"],"THA":["AK","AT","AX","AZ"],"VNM":["AK","AT","AX","AZ"],"BGD":["AK","AT","AX","AZ"],"MMR":["AK","AT","AX","AZ"],"KOR":["AK","AT","AX","AZ"],"KHM":["AK","AT","AX","AZ"]}';
//    $permission = '{}';
//    $repairCategory = 'LCD COVER';
//    $repairView = 'lmd';
//    $repairCategory = 'ALL';
//    $repairView = 'lmd';

    $color = $_POST['color'];
    $cpu = $_POST['cpu'];
    $rearCamera = $_POST['rearCamera'];
    $frontCamera = $_POST['frontCamera'];
    $data = $_POST['data'];
    $iso = $_POST['iso'];
    $countryID = $_POST['countryID'];
    $permission = $_POST['permission'];
    $repairCategory = $_POST['repairCategory'];
    $repairView = $_POST['repairView'];

    $stratTime = null;
    $endTime = null;
    if($data!="[]"){
        $dataObj = json_decode($data);
        $colorObj = json_decode($color);
        $cpuObj = json_decode($cpu);
        $rearCameraObj = json_decode($rearCamera);
        $frontCameraObj = json_decode($frontCamera);

        $permissionObj = json_decode($permission);
        $isFullPermission = (empty((array)$permissionObj));
        
        //color
        $isColorAll=isAll($colorObj);
        $color_in=getSQLInStr($colorObj);
        
        //CPU
        $isCpuAll=isAll($cpuObj);
        $cpu_in=getSQLInStr($cpuObj);
        
        //FrontCamera
        $isFrontCameraAll=isAll($frontCameraObj);
        $frontCamera_in=getSQLInStr($frontCameraObj);
        
        //RearCamera
        $isRearCameraAll=isAll($rearCameraObj);
        $rearCamera_in=getSQLInStr($rearCameraObj);
    
        $db->connect_db($_DB['host'], $_DB['username'], $_DB['password']);
        
        $sqlDeviceIn = getAllTargetDeviceSql($dataObj);
        $db->query($sqlDeviceIn);
        $str_in = '';
        while($row = $db->fetch_array()){
            $str_in.="'".$row['device_name']."',";
        }
        $str_in = substr($str_in,0,-1);
            
        if(!$isFullPermission){
            $result = permissionCheck($isFullPermission,$permissionObj,$iso);
            if(!$result['queryable']) continue;
        }
        
        //
        $deviceTable = $_DB['repair']['dbnameDeviceCode'];
        if ($repairView == 'muc') {
            $db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB['repair']['dbnameRegionMuc']);
            $moduleCodeTable = $_DB['repair']['dbnameMucModuleCode'];
            $moduleCodeDatatableColumn = "muc_module_numcode";
            $moduleCodeMappingColumn = "muc_module";
        } else if ($repairView == 'lmd') {
            $db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB['repair']['dbnameRegionLmd']);
            $moduleCodeTable = $_DB['repair']['dbnameLmdModuleCode'];
            $moduleCodeDatatableColumn = "lmd_part_group_numcode";
            $moduleCodeMappingColumn = "lmd_part_group";
        }
        
        //get start time/end time
        $query = "
            SELECT DISTINCT shipping_year,shipping_mon
            FROM $iso
            ORDER BY shipping_year,shipping_mon;";
        $db->query($query);
        
        $first = true;
        while($row = $db->fetch_array()){
            $shippingYear = $row['shipping_year'];
            $shippingMon = $row['shipping_mon'];

            if($first){
                $startTime = $shippingYear.'-'.$shippingMon;
                $first = false;
            }
            $endTime = $shippingYear.'-'.$shippingMon;
        }
        
        if($repairCategory == 'ALL'){
            //by module
            $query = "
                set nocount on;DECLARE @topFive TABLE (part nvarchar(10));

                INSERT INTO @topFive
                SELECT $moduleCodeMappingColumn
                FROM(
                    SELECT TOP 5 $moduleCodeMappingColumn,sum(count) partSum
                    FROM $iso data 
                        ,$moduleCodeTable part_mapping 
                        ,$deviceTable device_mapping
                    WHERE data.$moduleCodeDatatableColumn = part_mapping.numcode
                    AND data.mp_numcode = device_mapping.numcode
                    AND $moduleCodeMappingColumn NOT IN ( 'ALL' ,'unrepair')
                    group by $moduleCodeMappingColumn
                    order by partSum DESC
                )list
                
                SELECT $moduleCodeMappingColumn
                    ,foo.shipping_year
                    ,foo.shipping_mon
                    ,FORMAT(((CAST(partSum AS DECIMAL(18,2))) / (CAST(total AS DECIMAL(18,2))))*100,'N4') ratio
                FROM
                (
                    SELECT $moduleCodeMappingColumn,shipping_year
                        ,shipping_mon
                        ,sum(count) partSum

                    FROM $iso data 
                        ,$moduleCodeTable part_mapping 
                        ,$deviceTable device_mapping"
                .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : ",(SELECT distinct product_id,model_name FROM $productIDTable) product ")
                    ."WHERE data.$moduleCodeDatatableColumn = part_mapping.numcode
                    AND data.mp_numcode = device_mapping.numcode
                    AND device_mapping.productdevice IN($str_in)"
                    .(($countryID == 'null') ? "" :" AND data.l2code = $countryID")
                    .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
                    .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
                    .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
                    .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
                    .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : " AND product.model_name = device_mapping.model AND product.product_id IN (".$result['permissionProductIDStr'].") ")
                    ."AND $moduleCodeMappingColumn IN (SELECT * FROM @topFive)
                    group by shipping_year,shipping_mon,$moduleCodeMappingColumn
                )foo,
                (
                    SELECT shipping_year
                        ,shipping_mon
                        ,sum(count) total
                    FROM $iso data 
                        ,$moduleCodeTable part_mapping 
                        ,$deviceTable device_mapping"
                .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : ",(SELECT distinct product_id,model_name FROM $productIDTable) product ")
                    ."WHERE data.$moduleCodeDatatableColumn = part_mapping.numcode
                    AND data.mp_numcode = device_mapping.numcode
                    AND device_mapping.productdevice IN($str_in)"
                    .(($countryID == 'null') ? "" :" AND data.l2code = $countryID")
                    .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
                    .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
                    .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
                    .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
                    .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : " AND product.model_name = device_mapping.model AND product.product_id IN (".$result['permissionProductIDStr'].") ")
                    ."AND $moduleCodeMappingColumn IN ( 'ALL' ,'unrepair')
                    group by shipping_year,shipping_mon
                )goo
                where foo.shipping_year = goo.shipping_year
                and foo.shipping_mon = goo.shipping_mon

                union all

                SELECT foo.$moduleCodeMappingColumn
                    ,foo.shipping_year
                    ,foo.shipping_mon
                    ,FORMAT(((CAST(partSum AS DECIMAL(18,2))) / (CAST(total AS DECIMAL(18,2))))*100,'N4') ratio
                FROM
                (
                    SELECT $moduleCodeMappingColumn = 'The Rest'
                        ,shipping_year
                        ,shipping_mon
                        ,sum(count) partSum

                    FROM $iso data 
                        ,$moduleCodeTable part_mapping 
                        ,$deviceTable device_mapping"
                .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : ",(SELECT distinct product_id,model_name FROM $productIDTable) product ")
                    ."WHERE data.$moduleCodeDatatableColumn = part_mapping.numcode
                    AND data.mp_numcode = device_mapping.numcode
                    AND device_mapping.productdevice IN($str_in)"
                    .(($countryID == 'null') ? "" :" AND data.l2code = $countryID")
                    .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
                    .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
                    .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
                    .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
                    .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : " AND product.model_name = device_mapping.model AND product.product_id IN (".$result['permissionProductIDStr'].") ")
                    ."AND $moduleCodeMappingColumn NOT IN (SELECT * FROM @topFive)
                    AND $moduleCodeMappingColumn NOT IN ('ALL' ,'unrepair')
                    group by shipping_year,shipping_mon
                )foo,
                (
                    SELECT $moduleCodeMappingColumn = 'The Rest'
                        ,shipping_year
                        ,shipping_mon
                        ,sum(count) total
                    FROM $iso data 
                        ,$moduleCodeTable part_mapping 
                        ,$deviceTable device_mapping"
                .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : ",(SELECT distinct product_id,model_name FROM $productIDTable) product ")
                    ."WHERE data.$moduleCodeDatatableColumn = part_mapping.numcode
                    AND data.mp_numcode = device_mapping.numcode
                    AND device_mapping.productdevice IN($str_in)"
                    .(($countryID == 'null') ? "" :" AND data.l2code = $countryID")
                    .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
                    .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
                    .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
                    .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
                    .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : " AND product.model_name = device_mapping.model AND product.product_id IN (".$result['permissionProductIDStr'].") ")
                    ."AND $moduleCodeMappingColumn NOT IN (SELECT * FROM @topFive)
                    AND $moduleCodeMappingColumn IN ( 'ALL' ,'unrepair')
                    group by shipping_year,shipping_mon
                )goo
                where foo.shipping_year = goo.shipping_year
                and foo.shipping_mon = goo.shipping_mon

                union all

                SELECT foo.$moduleCodeMappingColumn
                    ,foo.shipping_year
                    ,foo.shipping_mon
                    ,FORMAT(((CAST(partSum AS DECIMAL(18,2))) / (CAST(total AS DECIMAL(18,2))))*100,'N4') ratio
                FROM
                (
                    SELECT $moduleCodeMappingColumn = 'All'
                        ,shipping_year
                        ,shipping_mon
                        ,sum(count) partSum

                    FROM $iso data 
                        ,$moduleCodeTable part_mapping 
                        ,$deviceTable device_mapping"
                .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : ",(SELECT distinct product_id,model_name FROM $productIDTable) product ")
                    ."WHERE data.$moduleCodeDatatableColumn = part_mapping.numcode
                    AND data.mp_numcode = device_mapping.numcode
                    AND device_mapping.productdevice IN($str_in)"
                    .(($countryID == 'null') ? "" :" AND data.l2code = $countryID")
                    .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
                    .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
                    .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
                    .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
                    .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : " AND product.model_name = device_mapping.model AND product.product_id IN (".$result['permissionProductIDStr'].") ")
                    ."AND $moduleCodeMappingColumn ='ALL'
                    group by shipping_year,shipping_mon
                )foo,
                (
                    SELECT $moduleCodeMappingColumn = 'All'
                        ,shipping_year
                        ,shipping_mon
                        ,sum(count) total
                    FROM $iso data 
                        ,$moduleCodeTable part_mapping 
                        ,$deviceTable device_mapping"
                .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : ",(SELECT distinct product_id,model_name FROM $productIDTable) product ")
                    ."WHERE data.$moduleCodeDatatableColumn = part_mapping.numcode
                    AND data.mp_numcode = device_mapping.numcode
                    AND device_mapping.productdevice IN($str_in)"
                    .(($countryID == 'null') ? "" :" AND data.l2code = $countryID")
                    .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
                    .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
                    .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
                    .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
                    .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : " AND product.model_name = device_mapping.model AND product.product_id IN (".$result['permissionProductIDStr'].") ")
                    ."AND $moduleCodeMappingColumn IN ( 'ALL' ,'unrepair')
                    group by shipping_year,shipping_mon
                )goo
                where foo.shipping_year = goo.shipping_year
                and foo.shipping_mon = goo.shipping_mon

                order by $moduleCodeMappingColumn,foo.shipping_year,foo.shipping_mon;";
//            echo $query;
            $db->query($query);
            while($row = $db->fetch_array()){
                $module = $row[$moduleCodeMappingColumn];
                $shippingYear = $row['shipping_year'];
                $shippingMon = $row['shipping_mon'];
                $ratio = $row['ratio'];
                
                $resultByModule[$module][$shippingYear.'-'.$shippingMon] = $ratio;
            }

            //------------------------------------------------------------------------
            //by model
            $deviceQuery ="
                SELECT distinct model
                FROM $iso data 
                        ,$moduleCodeTable part_mapping 
                        ,$deviceTable device_mapping"
                .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : ",(SELECT distinct product_id,model_name FROM $productIDTable) product ")
                    ."WHERE data.$moduleCodeDatatableColumn = part_mapping.numcode
                    AND data.mp_numcode = device_mapping.numcode
                    AND device_mapping.productdevice IN($str_in)"
                    .(($countryID == 'null') ? "" :" AND data.l2code = $countryID")
                    .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
                    .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
                    .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
                    .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
                    .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : " AND product.model_name = device_mapping.model AND product.product_id IN (".$result['permissionProductIDStr'].") ")
                    ."AND $moduleCodeMappingColumn = 'ALL'
            ";
            $query = "
                SELECT foo.model
                    ,foo.shipping_year
                    ,foo.shipping_mon
                    ,FORMAT(((CAST(partSum AS DECIMAL(18,2))) / (CAST(total AS DECIMAL(18,2))))*100,'N4') ratio
                FROM
                (
                    SELECT model
                        ,shipping_year
                        ,shipping_mon
                        ,sum(count) partSum

                    FROM $iso data 
                        ,$moduleCodeTable part_mapping 
                        ,$deviceTable device_mapping"
                .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : ",(SELECT distinct product_id,model_name FROM $productIDTable) product ")
                    ."WHERE data.$moduleCodeDatatableColumn = part_mapping.numcode
                    AND data.mp_numcode = device_mapping.numcode
                    AND device_mapping.productdevice IN($str_in)"
                    .(($countryID == 'null') ? "" :" AND data.l2code = $countryID")
                    .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
                    .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
                    .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
                    .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
                    .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : " AND product.model_name = device_mapping.model AND product.product_id IN (".$result['permissionProductIDStr'].") ")
                    ."AND model IN ($deviceQuery)
                    AND $moduleCodeMappingColumn = 'ALL'
                    group by shipping_year,shipping_mon,model
                )foo,
                (
                    SELECT model
                        ,shipping_year
                        ,shipping_mon
                        ,sum(count) total
                    FROM $iso data 
                        ,$moduleCodeTable part_mapping 
                        ,$deviceTable device_mapping"
                .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : ",(SELECT distinct product_id,model_name FROM $productIDTable) product ")
                    ."WHERE data.$moduleCodeDatatableColumn = part_mapping.numcode
                    AND data.mp_numcode = device_mapping.numcode
                    AND device_mapping.productdevice IN($str_in)"
                    .(($countryID == 'null') ? "" :" AND data.l2code = $countryID")
                    .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
                    .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
                    .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
                    .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
                    .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : " AND product.model_name = device_mapping.model AND product.product_id IN (".$result['permissionProductIDStr'].") ")
                    ."AND model IN ($deviceQuery)
                    AND $moduleCodeMappingColumn IN ( 'ALL' ,'unrepair')
                    group by shipping_year,shipping_mon,model
                )goo
                where foo.shipping_year = goo.shipping_year
                and foo.shipping_mon = goo.shipping_mon
                and foo.model = goo.model
                order by model,shipping_year,shipping_mon;";
//            echo $query;
            $db->query($query);
            while($row = $db->fetch_array()){
                $model = $row['model'];
                $shippingYear = $row['shipping_year'];
                $shippingMon = $row['shipping_mon'];
                $ratio = $row['ratio'];
                
                $resultByModel[$model][$shippingYear.'-'.$shippingMon] = $ratio;
            }
            
            //------------------------------------------------------------------------
            //by device
            $query = "
                set nocount on;DECLARE @topFive TABLE (device nvarchar(50), ratio nvarchar(10))

                INSERT INTO @topFive
                SELECT TOP 5 foo.productdevice,FORMAT(((CAST(partSum AS DECIMAL(18,2)))/(CAST(total AS DECIMAL(18,2))))*100,'N4') ratio
                FROM
                (
                    SELECT productdevice
                        ,sum(count) partSum

                    FROM $iso data 
                        ,$moduleCodeTable part_mapping 
                        ,$deviceTable device_mapping"
                .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : ",(SELECT distinct product_id,model_name FROM $productIDTable) product ")
                    ."WHERE data.$moduleCodeDatatableColumn = part_mapping.numcode
                    AND data.mp_numcode = device_mapping.numcode
                    AND device_mapping.productdevice IN($str_in)"
                    .(($countryID == 'null') ? "" :" AND data.l2code = $countryID")
                    .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
                    .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
                    .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
                    .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
                    .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : " AND product.model_name = device_mapping.model AND product.product_id IN (".$result['permissionProductIDStr'].") ")
                    ."AND $moduleCodeMappingColumn = 'ALL'
                    group by productdevice
                )foo,
                (
                    SELECT productdevice
                    ,sum(count) total
                    FROM $iso data 
                        ,$moduleCodeTable part_mapping 
                        ,$deviceTable device_mapping"
                .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : ",(SELECT distinct product_id,model_name FROM $productIDTable) product ")
                    ."WHERE data.$moduleCodeDatatableColumn = part_mapping.numcode
                    AND data.mp_numcode = device_mapping.numcode
                    AND device_mapping.productdevice IN($str_in)"
                    .(($countryID == 'null') ? "" :" AND data.l2code = $countryID")
                    .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
                    .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
                    .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
                    .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
                    .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : " AND product.model_name = device_mapping.model AND product.product_id IN (".$result['permissionProductIDStr'].") ")
                    ."AND $moduleCodeMappingColumn IN ( 'ALL' ,'unrepair')
                    group by productdevice
                )goo
                where foo.productdevice = goo.productdevice
                order by ratio DESC

                SELECT foo.productdevice
                    ,foo.shipping_year
                    ,foo.shipping_mon
                    ,FORMAT(((CAST(partSum AS DECIMAL(18,2))) / (CAST(total AS DECIMAL(18,2))))*100,'N4') ratio
                FROM
                (
                    SELECT productdevice = 'The Rest'
                        ,shipping_year
                        ,shipping_mon
                        ,sum(count) partSum

                    FROM $iso data 
                        ,$moduleCodeTable part_mapping 
                        ,$deviceTable device_mapping"
                .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : ",(SELECT distinct product_id,model_name FROM $productIDTable) product ")
                    ."WHERE data.$moduleCodeDatatableColumn = part_mapping.numcode
                    AND data.mp_numcode = device_mapping.numcode
                    AND device_mapping.productdevice IN($str_in)"
                    .(($countryID == 'null') ? "" :" AND data.l2code = $countryID")
                    .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
                    .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
                    .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
                    .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
                    .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : " AND product.model_name = device_mapping.model AND product.product_id IN (".$result['permissionProductIDStr'].") ")
                    ."AND productdevice NOT IN (SELECT device FROM @topFive)
                    AND $moduleCodeMappingColumn = 'ALL'
                    group by shipping_year,shipping_mon
                )foo,
                (
                    SELECT productdevice = 'The Rest'
                        ,shipping_year
                        ,shipping_mon
                        ,sum(count) total
                    FROM $iso data 
                        ,$moduleCodeTable part_mapping 
                        ,$deviceTable device_mapping"
                .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : ",(SELECT distinct product_id,model_name FROM $productIDTable) product ")
                    ."WHERE data.$moduleCodeDatatableColumn = part_mapping.numcode
                    AND data.mp_numcode = device_mapping.numcode
                    AND device_mapping.productdevice IN($str_in)"
                    .(($countryID == 'null') ? "" :" AND data.l2code = $countryID")
                    .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
                    .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
                    .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
                    .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
                    .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : " AND product.model_name = device_mapping.model AND product.product_id IN (".$result['permissionProductIDStr'].") ")
                    ."AND productdevice NOT IN (SELECT device FROM @topFive)
                    AND $moduleCodeMappingColumn IN ( 'ALL' ,'unrepair')
                    group by shipping_year,shipping_mon
                )goo
                where foo.shipping_year = goo.shipping_year
                and foo.shipping_mon = goo.shipping_mon

                union all

                SELECT foo.productdevice
                    ,foo.shipping_year
                    ,foo.shipping_mon
                    ,FORMAT(((CAST(partSum AS DECIMAL(18,2))) / (CAST(total AS DECIMAL(18,2))))*100,'N4') ratio
                FROM
                (
                    SELECT productdevice
                        ,shipping_year
                        ,shipping_mon
                        ,sum(count) partSum

                    FROM $iso data 
                        ,$moduleCodeTable part_mapping 
                        ,$deviceTable device_mapping"
                .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : ",(SELECT distinct product_id,model_name FROM $productIDTable) product ")
                    ."WHERE data.$moduleCodeDatatableColumn = part_mapping.numcode
                    AND data.mp_numcode = device_mapping.numcode
                    AND device_mapping.productdevice IN($str_in)"
                    .(($countryID == 'null') ? "" :" AND data.l2code = $countryID")
                    .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
                    .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
                    .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
                    .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
                    .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : " AND product.model_name = device_mapping.model AND product.product_id IN (".$result['permissionProductIDStr'].") ")
                    ."AND productdevice IN (SELECT device FROM @topFive)
                    AND $moduleCodeMappingColumn = 'ALL'
                    group by shipping_year,shipping_mon,productdevice
                )foo,
                (
                    SELECT productdevice
                        ,shipping_year
                        ,shipping_mon
                        ,sum(count) total
                    FROM $iso data 
                        ,$moduleCodeTable part_mapping 
                        ,$deviceTable device_mapping"
                .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : ",(SELECT distinct product_id,model_name FROM $productIDTable) product ")
                    ."WHERE data.$moduleCodeDatatableColumn = part_mapping.numcode
                    AND data.mp_numcode = device_mapping.numcode
                    AND device_mapping.productdevice IN($str_in)"
                    .(($countryID == 'null') ? "" :" AND data.l2code = $countryID")
                    .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
                    .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
                    .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
                    .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
                    .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : " AND product.model_name = device_mapping.model AND product.product_id IN (".$result['permissionProductIDStr'].") ")
                    ."AND productdevice IN (SELECT device FROM @topFive)
                    AND $moduleCodeMappingColumn IN ( 'ALL' ,'unrepair')
                    group by shipping_year,shipping_mon,productdevice
                )goo
                where foo.shipping_year = goo.shipping_year
                and foo.shipping_mon = goo.shipping_mon
                and foo.productdevice = goo.productdevice

                union all

                SELECT foo.productdevice
                    ,foo.shipping_year
                    ,foo.shipping_mon
                    ,FORMAT(((CAST(partSum AS DECIMAL(18,2))) / (CAST(total AS DECIMAL(18,2))))*100,'N4') ratio
                FROM
                (
                    SELECT productdevice = 'All'
                        ,shipping_year
                        ,shipping_mon
                        ,sum(count) partSum

                    FROM $iso data 
                        ,$moduleCodeTable part_mapping 
                        ,$deviceTable device_mapping"
                .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : ",(SELECT distinct product_id,model_name FROM $productIDTable) product ")
                    ."WHERE data.$moduleCodeDatatableColumn = part_mapping.numcode
                    AND data.mp_numcode = device_mapping.numcode
                    AND device_mapping.productdevice IN($str_in)"
                    .(($countryID == 'null') ? "" :" AND data.l2code = $countryID")
                    .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
                    .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
                    .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
                    .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
                    .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : " AND product.model_name = device_mapping.model AND product.product_id IN (".$result['permissionProductIDStr'].") ")
                    ."AND $moduleCodeMappingColumn = 'ALL'
                    group by shipping_year,shipping_mon
                )foo,
                (
                    SELECT productdevice = 'All'
                        ,shipping_year
                        ,shipping_mon
                        ,sum(count) total
                    FROM $iso data 
                        ,$moduleCodeTable part_mapping 
                        ,$deviceTable device_mapping"
                .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : ",(SELECT distinct product_id,model_name FROM $productIDTable) product ")
                    ."WHERE data.$moduleCodeDatatableColumn = part_mapping.numcode
                    AND data.mp_numcode = device_mapping.numcode
                    AND device_mapping.productdevice IN($str_in)"
                    .(($countryID == 'null') ? "" :" AND data.l2code = $countryID")
                    .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
                    .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
                    .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
                    .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
                    .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : " AND product.model_name = device_mapping.model AND product.product_id IN (".$result['permissionProductIDStr'].") ")
                    ."AND $moduleCodeMappingColumn IN ( 'ALL' ,'unrepair')
                    group by shipping_year,shipping_mon
                )goo
                where foo.shipping_year = goo.shipping_year
                and foo.shipping_mon = goo.shipping_mon

                order by productdevice,shipping_year,shipping_mon";
            $db->query($query);
            while($row = $db->fetch_array()){
                $device = $row['productdevice'];
                $shippingYear = $row['shipping_year'];
                $shippingMon = $row['shipping_mon'];
                $ratio = $row['ratio'];
                
                $resultByDevice[$device][$shippingYear.'-'.$shippingMon] = $ratio;
            }
            
            //country
            $query = "
                SELECT foo.shipping_year
                    ,foo.shipping_mon
                    ,FORMAT(((CAST(partSum AS DECIMAL(18,2)))/(CAST(total AS DECIMAL(18,2))))*100,'N4') ratio
                FROM
                (
                    SELECT shipping_year
                        ,shipping_mon
                        ,sum(count) partSum

                    FROM $iso data 
                        ,$moduleCodeTable part_mapping 
                        ,$deviceTable device_mapping"
                
                .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : ",(SELECT distinct product_id,model_name FROM $productIDTable) product ")
                    
                    ."WHERE data.$moduleCodeDatatableColumn = part_mapping.numcode
                    AND data.mp_numcode = device_mapping.numcode
                    AND device_mapping.productdevice IN($str_in)"
                    .(($countryID == 'null') ? "" :" AND data.l2code = $countryID")
                    .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
                    .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
                    .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
                    .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
                    .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : " AND product.model_name = device_mapping.model AND product.product_id IN (".$result['permissionProductIDStr'].") ")
                    ."AND $moduleCodeMappingColumn = 'ALL'
                    group by shipping_year,shipping_mon
                )foo,
                (
                    SELECT shipping_year
                        ,shipping_mon
                        ,sum(count) total
                    FROM $iso data 
                        ,$moduleCodeTable part_mapping 
                        ,$deviceTable device_mapping"
                .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : ",(SELECT distinct product_id,model_name FROM $productIDTable) product ")
                    ."WHERE data.$moduleCodeDatatableColumn = part_mapping.numcode
                    AND data.mp_numcode = device_mapping.numcode
                    AND device_mapping.productdevice IN($str_in)"
                    .(($countryID == 'null') ? "" :" AND data.l2code = $countryID")
                    .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
                    .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
                    .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
                    .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
                    .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : " AND product.model_name = device_mapping.model AND product.product_id IN (".$result['permissionProductIDStr'].") ")
                    ."and $moduleCodeMappingColumn IN ( 'ALL' ,'unrepair')
                    group by shipping_year,shipping_mon
                )goo

                where foo.shipping_year = goo.shipping_year
                and foo.shipping_mon = goo.shipping_mon
                order by foo.shipping_year,foo.shipping_mon";
            $db->query($query);
            while($row = $db->fetch_array()){
                $shippingYear = $row['shipping_year'];
                $shippingMon = $row['shipping_mon'];
                $ratio = $row['ratio'];
                
                $resultByCountry[$iso][$shippingYear.'-'.$shippingMon] = $ratio;
            }
        }
        
        //single part
        else{
            //by model
            $query = "
                SELECT model
                    ,foo.shipping_year
                    ,foo.shipping_mon
                    ,FORMAT(((CAST(partSum AS DECIMAL(18,2)))/(CAST(total AS DECIMAL(18,2))))*100,'N4') ratio
                FROM
                (
                    SELECT model,shipping_year
                        ,shipping_mon
                        ,sum(count) partSum

                    FROM $iso data 
                        ,$moduleCodeTable part_mapping 
                        ,$deviceTable device_mapping"
                .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : ",(SELECT distinct product_id,model_name FROM $productIDTable) product ")
                    ."WHERE data.$moduleCodeDatatableColumn = part_mapping.numcode
                    AND data.mp_numcode = device_mapping.numcode
                    AND device_mapping.productdevice IN($str_in)"
                    .(($countryID == 'null') ? "" :" AND data.l2code = $countryID")
                    .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
                    .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
                    .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
                    .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
                    .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : " AND product.model_name = device_mapping.model AND product.product_id IN (".$result['permissionProductIDStr'].") ")
                    ."AND $moduleCodeMappingColumn = '$repairCategory'
                    group by shipping_year,shipping_mon,model
                )foo,
                (
                    SELECT shipping_year
                        ,shipping_mon
                        ,sum(count) total
                    FROM $iso data 
                        ,$moduleCodeTable part_mapping 
                        ,$deviceTable device_mapping"
                .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : ",(SELECT distinct product_id,model_name FROM $productIDTable) product ")
                    ."WHERE data.$moduleCodeDatatableColumn = part_mapping.numcode
                    AND data.mp_numcode = device_mapping.numcode
                    AND device_mapping.productdevice IN($str_in)"
                    .(($countryID == 'null') ? "" :" AND data.l2code = $countryID")
                    .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
                    .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
                    .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
                    .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
                    .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : " AND product.model_name = device_mapping.model AND product.product_id IN (".$result['permissionProductIDStr'].") ")
                    ."and $moduleCodeMappingColumn IN ( 'ALL' ,'unrepair')
                    group by shipping_year,shipping_mon
                )goo

                where foo.shipping_year = goo.shipping_year
                and foo.shipping_mon = goo.shipping_mon
                order by model,foo.shipping_year,foo.shipping_mon";
//            echo $query;
            $db->query($query);
            while($row = $db->fetch_array()){
                $model = $row['model'];
                $shippingYear = $row['shipping_year'];
                $shippingMon = $row['shipping_mon'];
                $ratio = $row['ratio'];
                
                $resultByModel[$model][$shippingYear.'-'.$shippingMon] = $ratio;
            }
            
            //by device
            $query = "
                SELECT productdevice
                    ,foo.shipping_year
                    ,foo.shipping_mon
                    ,FORMAT(((CAST(partSum AS DECIMAL(18,2)))/(CAST(total AS DECIMAL(18,2))))*100,'N4') ratio
                FROM
                (
                    SELECT productdevice,shipping_year
                        ,shipping_mon
                        ,sum(count) partSum

                   FROM $iso data 
                        ,$moduleCodeTable part_mapping 
                        ,$deviceTable device_mapping"
                .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : ",(SELECT distinct product_id,model_name FROM $productIDTable) product ")
                    ."WHERE data.$moduleCodeDatatableColumn = part_mapping.numcode
                    AND data.mp_numcode = device_mapping.numcode
                    AND device_mapping.productdevice IN($str_in)"
                    .(($countryID == 'null') ? "" :" AND data.l2code = $countryID")
                    .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
                    .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
                    .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
                    .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
                    .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : " AND product.model_name = device_mapping.model AND product.product_id IN (".$result['permissionProductIDStr'].") ")
                    ."AND $moduleCodeMappingColumn = '$repairCategory'
                    group by shipping_year,shipping_mon,productdevice
                )foo,
                (
                    SELECT shipping_year
                        ,shipping_mon
                        ,sum(count) total
                    FROM $iso data 
                        ,$moduleCodeTable part_mapping 
                        ,$deviceTable device_mapping"
                .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : ",(SELECT distinct product_id,model_name FROM $productIDTable) product ")
                    ."WHERE data.$moduleCodeDatatableColumn = part_mapping.numcode
                    AND data.mp_numcode = device_mapping.numcode
                    AND device_mapping.productdevice IN($str_in)"
                    .(($countryID == 'null') ? "" :" AND data.l2code = $countryID")
                    .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
                    .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
                    .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
                    .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
                    .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : " AND product.model_name = device_mapping.model AND product.product_id IN (".$result['permissionProductIDStr'].") ")
                    ."and $moduleCodeMappingColumn IN ( 'ALL' ,'unrepair')
                    group by shipping_year,shipping_mon
                )goo

                where foo.shipping_year = goo.shipping_year
                and foo.shipping_mon = goo.shipping_mon
                order by productdevice,foo.shipping_year,foo.shipping_mon";

            $db->query($query);
            while($row = $db->fetch_array()){
                $device = $row['productdevice'];
                $shippingYear = $row['shipping_year'];
                $shippingMon = $row['shipping_mon'];
                $ratio = $row['ratio'];
                
                $resultByDevice[$device][$shippingYear.'-'.$shippingMon] = $ratio;
            }
            
            //by country
            $query = "
                SELECT foo.shipping_year
                    ,foo.shipping_mon
                    ,FORMAT(((CAST(partSum AS DECIMAL(18,2)))/(CAST(total AS DECIMAL(18,2))))*100,'N4') ratio
                FROM
                (
                    SELECT shipping_year
                        ,shipping_mon
                        ,sum(count) partSum

                    FROM $iso data 
                        ,$moduleCodeTable part_mapping 
                        ,$deviceTable device_mapping"
                        .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : ",(SELECT distinct product_id,model_name FROM $productIDTable) product ")
                    ."WHERE data.$moduleCodeDatatableColumn = part_mapping.numcode
                    AND data.mp_numcode = device_mapping.numcode
                    AND device_mapping.productdevice IN($str_in)"
                    .(($countryID == 'null') ? "" :" AND data.l2code = $countryID")
                    .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
                    .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
                    .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
                    .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
                    .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : " AND product.model_name = device_mapping.model AND product.product_id IN (".$result['permissionProductIDStr'].") ")
                    ."AND $moduleCodeMappingColumn = '$repairCategory'
                    group by shipping_year,shipping_mon
                )foo,
                (
                    SELECT shipping_year
                        ,shipping_mon
                        ,sum(count) total
                    FROM $iso data 
                        ,$moduleCodeTable part_mapping 
                        ,$deviceTable device_mapping"
                        .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : ",(SELECT distinct product_id,model_name FROM $productIDTable) product ")
                    ."WHERE data.$moduleCodeDatatableColumn = part_mapping.numcode
                    AND data.mp_numcode = device_mapping.numcode
                    AND device_mapping.productdevice IN($str_in)"
                    .(($countryID == 'null') ? "" :" AND data.l2code = $countryID")
                    .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
                    .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
                    .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
                    .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
                    .(($isFullPermission || $result['isFullPermissionThisIso']) ? " " : " AND product.model_name = device_mapping.model AND product.product_id IN (".$result['permissionProductIDStr'].") ")
                    ."and $moduleCodeMappingColumn IN ( 'ALL' ,'unrepair')
                    group by shipping_year,shipping_mon
                )goo

                where foo.shipping_year = goo.shipping_year
                and foo.shipping_mon = goo.shipping_mon
                order by foo.shipping_year,foo.shipping_mon";

            $db->query($query);
            while($row = $db->fetch_array()){
                $shippingYear = $row['shipping_year'];
                $shippingMon = $row['shipping_mon'];
                $ratio = $row['ratio'];
                
                $resultByCountry[$iso][$shippingYear.'-'.$shippingMon] = $ratio;
            }
            
        }
    }

    $results['resultByModule'] = $resultByModule;
    $results['resultByModel'] = $resultByModel;
    $results['resultByDevice'] = $resultByDevice;
    $results['resultByCountry'] = $resultByCountry;
    $results['timeRange']=array('start'=>$startTime,'end'=>$endTime);
    $json = json_encode($results);
    echo $json;
?>