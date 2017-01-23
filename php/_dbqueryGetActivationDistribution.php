<?php
    ini_set("max_execution_time", 0);

    require_once("DBconfig.php");
    require_once("DBclass.php");
    require_once("function.php");
    $results = array();
    $distributedByModel = array();
    $distributedByDevice = array();
    $distributedByRegion = array();
    
    $db = new DB();

    $MODE_ACTIVATION_DISTRIBUTED_BY_MODEL = "activationDistributedByModel";
    $MODE_ACTIVATION_DISTRIBUTED_BY_DEVICE = "activationDistributedByDevice";
    $MODE_ACTIVATION_DISTRIBUTED_BY_REGION = "activationDistributedByRegion";

    $MODE_ACTIVATION_DISTRIBUTED_LEVEL_COUNTRY = "activationDistributedLevelCountry";
    $MODE_ACTIVATION_DISTRIBUTED_LEVEL_BRANCH = "activationDistributedLevelBranch";
    $MODE_ACTIVATION_DISTRIBUTED_LEVEL_L1 = "activationDistributedLevelL1";
    $MODE_ACTIVATION_DISTRIBUTED_LEVEL_L2 = "activationDistributedLevelL2";

//    $color = '["all"]';
//    $cpu = '["all"]';
//    $rearCamera = '["all"]';
//    $frontCamera = '["all"]';
//    $from = "2016-12-19";
//    $to = "2017-1-18";    
//    $iso ='["IND"]';
//    $data = '[{"model":"ZENFONE","devices":"ZENFONE","product":"ZENFONE","datatype":"product"}]';
//    $permission = '{"":["AK","AT","AZ"],"HKG":["AK","AT","AX","AZ"],"IND":["AK","AT","AX","AZ"],"IDN":["AK","AT","AX","AZ"],"JPN":["AK","AT","AX","AZ"],"MYS":["AK","AT","AX","AZ"],"PHL":["AK","AT","AX","AZ"],"SGP":["AK","AT","AX","AZ"],"THA":["AK","AT","AX","AZ"],"VNM":["AK","AT","AX","AZ"],"BGD":["AK","AT","AX","AZ"],"MMR":["AK","AT","AX","AZ"],"KOR":["AK","AT","AX","AZ"],"KHM":["AK","AT","AX","AZ"]}';
//    $permission = '{}';
//    $distributedBy = $MODE_ACTIVATION_DISTRIBUTED_BY_REGION;
//    $distributedLevel = $MODE_ACTIVATION_DISTRIBUTED_LEVEL_L2;


    $color = $_POST['color'];
    $cpu = $_POST['cpu'];
    $rearCamera = $_POST['rearCamera'];
    $frontCamera = $_POST['frontCamera'];
    $from = $_POST['from'];
    $to = $_POST['to'];
    $data = $_POST['data'];
    $iso = $_POST['iso'];
    $permission = $_POST['permission'];
    $distributedBy = $_POST['distributedBy'];
    $distributedLevel = $_POST['distributedLevel'];

    if($data!="[]"){
        $isoObj = json_decode($iso);
        $dataObj = json_decode($data);
        $colorObj = json_decode($color);
        $cpuObj = json_decode($cpu);
        $rearCameraObj = json_decode($rearCamera);
        $frontCameraObj = json_decode($frontCamera);
        $permissionObj = json_decode($permission);

        $isFullPermission = (empty((array)$permissionObj));

        $isAll = isAll($dataObj);
        
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
		$str_in='';
        
        $sqlDeviceIn = getAllTargetPartNoSql($dataObj);

        $db->query($sqlDeviceIn);
        while($row = $db->fetch_array()){
            $str_in.="'".$row['product_id']."',";
        }
        $str_in = substr($str_in,0,-1);
//        echo $str_in."<br>";
        switch($distributedBy){
            case $MODE_ACTIVATION_DISTRIBUTED_BY_MODEL:
            case $MODE_ACTIVATION_DISTRIBUTED_BY_DEVICE:
                
                if($distributedBy == $MODE_ACTIVATION_DISTRIBUTED_BY_MODEL)
                    $selectColumn = 'device_model.model_name';
                else if($distributedBy == $MODE_ACTIVATION_DISTRIBUTED_BY_DEVICE)
                    $selectColumn = 'part_device.model_description device';
                
                $db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB['activation']['dbnameRegionL1']);
                $fromTableStr='';
                $declareQuery = "set nocount on;DECLARE @result TABLE (name nvarchar(50),count int);INSERT INTO @result ";
                for($i=0;$i<count($isoObj);++$i){

                    if(!$isFullPermission){
                        $result = permissionCheck($isFullPermission,$permissionObj,$isoObj[$i]);
                        if(!$result['queryable']) continue;
                    }

                    $tmpfromTableStr="SELECT $selectColumn,count"
                        ." FROM "
                        .($isColorAll ? "" : "$colorMappingTable A2,")
                        .($isCpuAll ? "" : "$cpuMappingTable A3,")
                        .($isFrontCameraAll ? "" : "$frontCameraMappingTable A4,")
                        .($isRearCameraAll ? "" : "$rearCameraMappingTable A5,")
                        .(($isFullPermission || $result['isFullPermissionThisIso']) ? "" : "(SELECT distinct product_id,model_name FROM $productIDTable) product,")
                        ."$isoObj[$i] A1,"
                        ."$deviceTable device_model,"
                        ."$productDescriptionMapping part_device"

                        ." WHERE "
                        ."date BETWEEN '".$from."' AND '".$to."'"
                        ." AND A1.device = device_model.device_name"
                        ." AND A1.product_id = part_device.product_id"
                        .($isAll?"":" AND A1.product_id IN(".$str_in.")")
                        .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN(".$color_in.")")
                        .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN(".$cpu_in.")")
                        .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN(".$frontCamera_in.")")
                        .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN(".$rearCamera_in.")")
                        .(($isFullPermission || $result['isFullPermissionThisIso']) ? "" : " AND device_model.model_name = product.model_name AND product.product_id IN (".$result['permissionProductIDStr'].")");

                    if(strlen($fromTableStr)==0){
                        $fromTableStr .= $tmpfromTableStr;
                    }
                    else{
                        $fromTableStr.=(" UNION ALL ".$tmpfromTableStr);
                    }
                }
                $declareQuery =$declareQuery . $fromTableStr;

                $queryStr = $declareQuery
                    ."SELECT name,count,FORMAT(((CAST(count AS DECIMAL(18,2))) / (CAST(total AS DECIMAL(18,2))))*100,'N2')percentage 
                    FROM(
                        SELECT name
                            ,sum(count)count
                            ,(select sum(count) from @result)total 
                        FROM @result 
                        GROUP BY name
                    )goo 
                    ORDER BY count DESC;";
//                echo $queryStr;
                break;

            case $MODE_ACTIVATION_DISTRIBUTED_BY_REGION:

                switch($distributedLevel){
                    //multi country
                    case $MODE_ACTIVATION_DISTRIBUTED_LEVEL_COUNTRY:
                        $db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB['activation']['dbnameRegionL1']);
                        $fromTableStr='';
                        $declareQuery = "set nocount on;DECLARE @result TABLE (name nvarchar(50),count int);INSERT INTO @result ";
                        for($i=0;$i<count($isoObj);++$i){

                            if(!$isFullPermission){
                                $result = permissionCheck($isFullPermission,$permissionObj,$isoObj[$i]);
                                if(!$result['queryable']) continue;
                            }

                            $tmpfromTableStr="SELECT country='$isoObj[$i]',count"
                                ." FROM "
                                .($isColorAll ? "" : "$colorMappingTable A2,")
                                .($isCpuAll ? "" : "$cpuMappingTable A3,")
                                .($isFrontCameraAll ? "" : "$frontCameraMappingTable A4,")
                                .($isRearCameraAll ? "" : "$rearCameraMappingTable A5,")
                                .(($isFullPermission || $result['isFullPermissionThisIso']) ? "" : "(SELECT distinct product_id,model_name FROM $productIDTable) product,")
                                ."$isoObj[$i] A1,"
                                ."$deviceTable device_model"

                                ." WHERE "
                                ."date BETWEEN '".$from."' AND '".$to."'"
                                ." AND A1.device = device_model.device_name"
                                .($isAll?"":" AND A1.product_id IN(".$str_in.")")
                                .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN(".$color_in.")")
                                .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN(".$cpu_in.")")
                                .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN(".$frontCamera_in.")")
                                .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN(".$rearCamera_in.")")
                                .(($isFullPermission || $result['isFullPermissionThisIso']) ? "" : " AND device_model.model_name = product.model_name AND product.product_id IN (".$result['permissionProductIDStr'].")");

                            if(strlen($fromTableStr)==0){
                                $fromTableStr .= $tmpfromTableStr;
                            }
                            else{
                                $fromTableStr.=(" UNION ALL ".$tmpfromTableStr);
                            }
                        }
                        $declareQuery =$declareQuery . $fromTableStr;

                        $queryStr = $declareQuery
                            ."SELECT name,count,FORMAT(((CAST(count AS DECIMAL(18,2))) / (CAST(total AS DECIMAL(18,2))))*100,'N2')percentage 
                            FROM(
                                SELECT name
                                    ,sum(count)count
                                    ,(select sum(count) from @result)total 
                                FROM @result 
                                GROUP BY name
                            )goo 
                            ORDER BY count DESC;";
                        break;
                        
                    case $MODE_ACTIVATION_DISTRIBUTED_LEVEL_L1:
                    case $MODE_ACTIVATION_DISTRIBUTED_LEVEL_L2:
                    case $MODE_ACTIVATION_DISTRIBUTED_LEVEL_BRANCH:
                        
                        if($distributedLevel == $MODE_ACTIVATION_DISTRIBUTED_LEVEL_L1){
                            $db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB['activation']['dbnameRegionL1']);
                            $selectColumn = "(SELECT name FROM $nameToMapidL1 where mapid = map_id)";
                        }
                        else if($distributedLevel == $MODE_ACTIVATION_DISTRIBUTED_LEVEL_L2){
                            $db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB['activation']['dbnameRegionL2']);
                            $selectColumn = "(SELECT name FROM $nameToMapidL2 where mapid = map_id)";
                        }
                        else if($distributedLevel == $MODE_ACTIVATION_DISTRIBUTED_LEVEL_BRANCH){
                            $db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB['activation']['dbnameRegionL2']);
                            $selectColumn = 'branch';
                        }
//                        echo $selectColumn;
                        $fromTableStr='';
                        $declareQuery = "set nocount on;DECLARE @result TABLE (name nvarchar(50),count int);INSERT INTO @result ";
                        for($i=0;$i<count($isoObj);++$i){

                            if(!$isFullPermission){
                                $result = permissionCheck($isFullPermission,$permissionObj,$isoObj[$i]);
                                if(!$result['queryable']) continue;
                            }

                            $tmpfromTableStr="SELECT $selectColumn,count"
                                ." FROM "
                                .($isColorAll ? "" : "$colorMappingTable A2,")
                                .($isCpuAll ? "" : "$cpuMappingTable A3,")
                                .($isFrontCameraAll ? "" : "$frontCameraMappingTable A4,")
                                .($isRearCameraAll ? "" : "$rearCameraMappingTable A5,")
                                .(($isFullPermission || $result['isFullPermissionThisIso']) ? "" : "(SELECT distinct product_id,model_name FROM $productIDTable) product,")
                                ."$isoObj[$i] A1,"
                                ."$deviceTable device_model"

                                ." WHERE "
                                ."date BETWEEN '".$from."' AND '".$to."'"
                                ." AND A1.device = device_model.device_name"
                                .($isAll?"":" AND A1.product_id IN(".$str_in.")")
                                .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN(".$color_in.")")
                                .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN(".$cpu_in.")")
                                .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN(".$frontCamera_in.")")
                                .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN(".$rearCamera_in.")")
                                .(($isFullPermission || $result['isFullPermissionThisIso']) ? "" : " AND device_model.model_name = product.model_name AND product.product_id IN (".$result['permissionProductIDStr'].")");

                            if(strlen($fromTableStr)==0){
                                $fromTableStr .= $tmpfromTableStr;
                            }
                            else{
                                $fromTableStr.=(" UNION ALL ".$tmpfromTableStr);
                            }
                        }
                        $declareQuery =$declareQuery . $fromTableStr;

                        $queryStr = $declareQuery
                            ."SELECT name,count,FORMAT(((CAST(count AS DECIMAL(18,2))) / (CAST(total AS DECIMAL(18,2))))*100,'N2')percentage 
                            FROM(
                                SELECT name
                                    ,sum(count)count
                                    ,(select sum(count) from @result)total 
                                FROM @result 
                                GROUP BY name
                            )goo 
                            ORDER BY count DESC;";
//                        echo $queryStr;
                        break;
                }
                break;       
        }
        $db->query($queryStr);
        while($row = $db->fetch_array())
        {
            $results[] = array('name'=>$row['name'], 'count'=>$row['count'], 'percentage'=>$row['percentage']);
//            $results[$row['name']] = array('count'=>$row['count'],'percentage'=>$row['percentage']);
        }
    }    
    $json = json_encode($results);
    echo $json;

?>