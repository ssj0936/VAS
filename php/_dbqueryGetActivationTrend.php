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

    $MODE_ACTIVATION_TREND_BY_MODEL = "activationTrendByModel";
    $MODE_ACTIVATION_TREND_BY_DEVICE = "activationTrendByDevice";
    $MODE_ACTIVATION_TREND_BY_REGION = "activationTrendByRegion";

    $MODE_ACTIVATION_TREND_LEVEL_COUNTRY = "activationTrendLevelCountry";
    $MODE_ACTIVATION_TREND_LEVEL_BRANCH = "activationTrendLevelBranch";
    $MODE_ACTIVATION_TREND_LEVEL_L1 = "activationTrendLevelL1";
    $MODE_ACTIVATION_TREND_LEVEL_L2 = "activationTrendLevelL2";

    $MODE_ACTIVATION_TREND_TIMESCALE_DAY = "activationTrendTimescaleDay";
    $MODE_ACTIVATION_TREND_TIMESCALE_WEEK = "activationTrendTimescaleWeek";
    $MODE_ACTIVATION_TREND_TIMESCALE_MONTH = "activationTrendTimescaleMonth";

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
//    $trendBy = $MODE_ACTIVATION_TREND_BY_REGION;
//    $trendLevel = $MODE_ACTIVATION_TREND_LEVEL_BRANCH;
//    $trendTime = $MODE_ACTIVATION_TREND_TIMESCALE_DAY;
    $color = $_POST['color'];
    $cpu = $_POST['cpu'];
    $rearCamera = $_POST['rearCamera'];
    $frontCamera = $_POST['frontCamera'];
    $from = $_POST['from'];
    $to = $_POST['to'];
    $data = $_POST['data'];
    $iso = $_POST['iso'];
    $permission = $_POST['permission'];
    $trendBy = $_POST['trendBy'];
    $trendLevel = $_POST['trendLevel'];
    $trendTime = $_POST['trendTime'];

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

        
        $timeColumn ='';
        switch($trendTime){
            case $MODE_ACTIVATION_TREND_TIMESCALE_DAY:
                $timeColumn = 'date date';
                break;
            case $MODE_ACTIVATION_TREND_TIMESCALE_WEEK:
                $timeColumn = "CONCAT(DATEPART(Year,date),'-',DATEPART(Week,date)) date";
                break;
            case $MODE_ACTIVATION_TREND_TIMESCALE_MONTH:
                $timeColumn = "CONCAT(DATEPART(Year,date),'-',DATEPART(Month,date)) date";
                break;
        }
        
        switch($trendBy){
            case $MODE_ACTIVATION_TREND_BY_MODEL:
            case $MODE_ACTIVATION_TREND_BY_DEVICE:
                $db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB['activation']['dbnameRegionL1']);
                if($trendBy == $MODE_ACTIVATION_TREND_BY_MODEL)
                    $selectColumn = 'device_model.model_name';
                else
                    $selectColumn = 'part_device.model_description';
//                echo $timeColumn."<br><br>";
                $fromTableStr='';
                $declareQuery = "set nocount on;DECLARE @result TABLE (name nvarchar(50),count int,date nvarchar(50));INSERT INTO @result ";
                for($i=0;$i<count($isoObj);++$i){

                    if(!$isFullPermission){
                        $result = permissionCheck($isFullPermission,$permissionObj,$isoObj[$i]);
                        if(!$result['queryable']) continue;
                    }
                    
                    $tmpfromTableStr="SELECT $selectColumn name,sum(count)count,$timeColumn"
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
                        .(($isFullPermission || $result['isFullPermissionThisIso']) ? "" : " AND device_model.model_name = product.model_name AND product.product_id IN (".$result['permissionProductIDStr'].")")
                        ." GROUP BY $selectColumn,date";

                    if(strlen($fromTableStr)==0){
                        $fromTableStr .= $tmpfromTableStr;
                    }
                    else{
                        $fromTableStr.=(" UNION ALL ".$tmpfromTableStr);
                    }
                    
                }

                $declareQuery .=$fromTableStr;
                $queryStr = $declareQuery
                    ." SELECT foo.name,foo.count,foo.date,rank
                    FROM(
                        SELECT name,sum(count)count,date date 
                        FROM @result
                        GROUP BY name,date
                    )foo,
                    (
                        SELECT name,count,RANK() OVER (ORDER BY count DESC)rank
                        FROM(
                            SELECT name,sum(count)count
                            FROM @result
                            GROUP BY name
                        )tmp
                    )goo
                    where foo.name = goo.name
                    order by rank,foo.date";
//                $queryStr = $fromTableStr;
//                echo $queryStr;
                break;

            case $MODE_ACTIVATION_TREND_BY_REGION:

                switch($trendLevel){
                    //multi country
                    case $MODE_ACTIVATION_TREND_LEVEL_COUNTRY:
                        $db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB['activation']['dbnameRegionL1']);
                        $fromTableStr='';
                        $declareQuery = "set nocount on;DECLARE @result TABLE (name nvarchar(50),count int,date nvarchar(50));INSERT INTO @result ";
                        for($i=0;$i<count($isoObj);++$i){

                            if(!$isFullPermission){
                                $result = permissionCheck($isFullPermission,$permissionObj,$isoObj[$i]);
                                if(!$result['queryable']) continue;
                            }

                            $tmpfromTableStr="SELECT name=(SELECT NAME_0 from $countryDataOnMap where iso= '$isoObj[$i]'),sum(count)count,$timeColumn"
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
                                .(($isFullPermission || $result['isFullPermissionThisIso']) ? "" : " AND device_model.model_name = product.model_name AND product.product_id IN (".$result['permissionProductIDStr'].")")
                                ." GROUP BY date";

                            if(strlen($fromTableStr)==0){
                                $fromTableStr .= $tmpfromTableStr;
                            }
                            else{
                                $fromTableStr.=(" UNION ALL ".$tmpfromTableStr);
                            }

                        }

                        $declareQuery .=$fromTableStr;
                        $queryStr = $declareQuery
                            ." SELECT foo.name,foo.count,foo.date,rank
                            FROM(
                                SELECT name,sum(count)count,date date 
                                FROM @result
                                GROUP BY name,date
                            )foo,
                            (
                                SELECT name,count,RANK() OVER (ORDER BY count DESC)rank
                                FROM(
                                    SELECT name,sum(count)count
                                    FROM @result
                                    GROUP BY name
                                )tmp
                            )goo
                            where foo.name = goo.name
                            order by rank,foo.date";
        //                $queryStr = $fromTableStr;
//                        echo $queryStr;
                        break;
                        
                    case $MODE_ACTIVATION_TREND_LEVEL_L1:
                    case $MODE_ACTIVATION_TREND_LEVEL_L2:
                    case $MODE_ACTIVATION_TREND_LEVEL_BRANCH:
                        
                        if($trendLevel == $MODE_ACTIVATION_TREND_LEVEL_L1){
                            $db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB['activation']['dbnameRegionL1']);
                            $selectColumn = "(SELECT name FROM $nameToMapidL1 where mapid = map_id)";
                            $groupByColumn = 'map_id';
                        }
                        else if($trendLevel == $MODE_ACTIVATION_TREND_LEVEL_L2){
                            $db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB['activation']['dbnameRegionL2']);
                            $selectColumn = "(SELECT name FROM $nameToMapidL2 where mapid = map_id)";
                            $groupByColumn = 'map_id';
                        }
                        else if($trendLevel == $MODE_ACTIVATION_TREND_LEVEL_BRANCH){
                            $db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB['activation']['dbnameRegionL2']);
                            $selectColumn = 'branch';
                            $groupByColumn = 'branch';
                        }
//                        echo $selectColumn;
                        $fromTableStr='';
                        $declareQuery = "set nocount on;DECLARE @result TABLE (name nvarchar(50),count int,date nvarchar(50));INSERT INTO @result ";
                        for($i=0;$i<count($isoObj);++$i){

                            if(!$isFullPermission){
                                $result = permissionCheck($isFullPermission,$permissionObj,$isoObj[$i]);
                                if(!$result['queryable']) continue;
                            }

                            $tmpfromTableStr="SELECT $selectColumn name,sum(count)count,$timeColumn"
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
                                .(($isFullPermission || $result['isFullPermissionThisIso']) ? "" : " AND device_model.model_name = product.model_name AND product.product_id IN (".$result['permissionProductIDStr'].")")
                                ." GROUP BY $groupByColumn, date";

                            if(strlen($fromTableStr)==0){
                                $fromTableStr .= $tmpfromTableStr;
                            }
                            else{
                                $fromTableStr.=(" UNION ALL ".$tmpfromTableStr);
                            }

                        }

                        $declareQuery .=$fromTableStr;
                        $queryStr = $declareQuery
                            ." SELECT foo.name,foo.count,foo.date,rank
                            FROM(
                                SELECT name,sum(count)count,date date 
                                FROM @result
                                GROUP BY name,date
                            )foo,
                            (
                                SELECT name,count,RANK() OVER (ORDER BY count DESC)rank
                                FROM(
                                    SELECT name,sum(count)count
                                    FROM @result
                                    GROUP BY name
                                )tmp
                            )goo
                            where foo.name = goo.name
                            order by rank,foo.date";
        //                $queryStr = $fromTableStr;
//                        echo $queryStr;
                        break;
                }
                break;       
        }
        $db->query($queryStr);
        while($row = $db->fetch_array())
        {
            $results[] = array('name'=>$row['name'], 'date'=>$row['date'], 'count'=>$row['count'],'rank'=>$row['rank']);
//            $results[$row['name']] = array('count'=>$row['count'],'percentage'=>$row['percentage']);
        }
    }    
    $json = json_encode($results);
    echo $json;

?>