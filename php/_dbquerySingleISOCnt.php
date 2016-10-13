    <?php
    ini_set("max_execution_time", 0);

    require_once("DBconfig.php");
    require_once("DBclass.php");
    require_once("function.php");
    $db = new DB();
    //$db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB['dbname']);
    $results = array();
    $resultsGroupByRegion = array();
    $resultsGroupByModel = array();
    $resultsGroupByDevice = array();
    $resultsGroupByDist = array();
    $resultsGroupByBranch = array();

    $color = $_POST['color'];
    $cpu = $_POST['cpu'];
    $rearCamera = $_POST['rearCamera'];
    $frontCamera = $_POST['frontCamera'];
    $dataset = $_POST['dataset'];
    $countryID = $_POST['countryID'];
    $from = $_POST['from'];
    $to = $_POST['to'];
    $data = $_POST['data'];
    $isL1 = $_POST['isL1'];
    $iso = $_POST['iso'];
    $distBranch = $_POST['distBranch'];
    $onlineDist = $_POST['onlineDist'];
//    
//    $color = '["all"]';
//    $cpu = '["all"]';
//    $rearCamera = '["all"]';
//    $frontCamera = '["all"]';
//    $dataset = 'activation';
//    $from = "2016-6-11";
//    $to = "2016-7-11";    
//    $countryID = 222175;
//    $data = '[{"model":"A501CG","devices":"A501CG","product":"ZENFONE","datatype":"model"}]';
//    $isL1 = 'false';
//    $iso = 'TWN';
//    $distBranch = '[{"dist":"FLIPKART","branch":"KARNATAKA"}]';
//    $onlineDist = '[]';
    
    $dataObj = json_decode($data);
    $colorObj = json_decode($color);
    $cpuObj = json_decode($cpu);
    $rearCameraObj = json_decode($rearCamera);
    $frontCameraObj = json_decode($frontCamera);
    $distBranchObj = json_decode($distBranch);
    $onlineDistObj = json_decode($onlineDist);
        
    $isDistBranch = (count($distBranchObj)!=0);
    $isOnlineDist = (count($onlineDistObj)!=0);
    $distBranchStr = getSQLDistBranchStr($distBranchObj,false);
    $onlineDistStr = getSQLOnlineDistStr($onlineDistObj,false);
    
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


    $DB='';
    if($isL1=="true"){
        $db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB[$dataset]['dbnameRegionL1']);
    }else if($isL1=="false"){
        $db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB[$dataset]['dbnameRegionL2']);
    }
    
    $str_in='';
        
    $sqlDeviceIn = getAllTargetDeviceSql($dataObj);

    $db->query($sqlDeviceIn);
    while($row = $db->fetch_array()){
        $str_in.="'".$row['device_name']."',";
    }
    $str_in = substr($str_in,0,-1);
    
    //Group by region
    $queryStr="SELECT date,SUM(count) AS count"
            ." FROM "
            .($isColorAll ? "" : "$colorMappingTable A2,")
            .($isCpuAll ? "" : "$cpuMappingTable A3,")
            .($isFrontCameraAll ? "" : "$frontCameraMappingTable A4,")
            .($isRearCameraAll ? "" : "$rearCameraMappingTable A5,")
            ."$iso A1"

            ." WHERE"
            ." date BETWEEN '$from' AND '$to'"
            .($isAll?"":" AND device IN($str_in)")
            ." AND map_id='$countryID'"
            .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
            .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
            .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
            .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
            .($isDistBranch ? " AND $distBranchStr " : "")
            .($isOnlineDist ? " AND $onlineDistStr " : "")
            ." GROUP BY date ORDER BY date";

//	echo "1:".$queryStr."<br>";
    $first = true;
    $start_date = null;
    $end_date = null;
    $db->query($queryStr);
    while($row = $db->fetch_array())
    {
       $resultsGroupByRegion[] = array(
          'date' => ($row['date']),
          'count' => ($row['count']),
       );
        
        if($first){
            $start_date = $row['date'];
            $first=false;
        }
        $end_date = $row['date'];
    }
    
    //Group by Model
    $queryStr="SELECT model_name,date,SUM(count) AS count"
            ." FROM "
            .($isColorAll ? "" : "$colorMappingTable A2,")
            .($isCpuAll ? "" : "$cpuMappingTable A3,")
            .($isFrontCameraAll ? "" : "$frontCameraMappingTable A4,")
            .($isRearCameraAll ? "" : "$rearCameraMappingTable A5,")
            ."$iso A1,"
            ."$deviceTable mapping"

            ." WHERE"
            ." date BETWEEN '$from' AND '$to'"
            .($isAll?"":" AND device IN($str_in)")
            ." AND map_id='$countryID'"
            ." AND A1.device = mapping.device_name "
            .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
            .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
            .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
            .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
            .($isDistBranch ? " AND $distBranchStr " : "")
            .($isOnlineDist ? " AND $onlineDistStr " : "")
            ." GROUP BY date, model_name ORDER BY date,model_name";
//    echo "2:".$queryStr."<br>";
    $db->query($queryStr);
    while($row = $db->fetch_array())
    {
        $resultsGroupByModel[$row['model_name']][] = array(
            //'model' => ($row['model_name']),
            'count' => ($row['count']),
            'date' => ($row['date'])
        );
    }

    //Group by Device
    $queryStr="SELECT device,date,SUM(count) AS count"
            ." FROM "
            .($isColorAll ? "" : "$colorMappingTable A2,")
            .($isCpuAll ? "" : "$cpuMappingTable A3,")
            .($isFrontCameraAll ? "" : "$frontCameraMappingTable A4,")
            .($isRearCameraAll ? "" : "$rearCameraMappingTable A5,")
            ."$iso A1"
            //."$deviceTable mapping"

            ." WHERE"
            ." date BETWEEN '$from' AND '$to'"
            .($isAll?"":" AND device IN($str_in)")
            ." AND map_id='$countryID'"
            //." AND A1.model = mapping.device_name "
            .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
            .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
            .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
            .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
            .($isDistBranch ? " AND $distBranchStr " : "")
            .($isOnlineDist ? " AND $onlineDistStr " : "")
            ." GROUP BY date, device ORDER BY date,device";
//    echo "3:".$queryStr."<br>";
    $db->query($queryStr);
    while($row = $db->fetch_array())
    {
        $resultsGroupByDevice[$row['device']][] = array(
            //'model' => ($row['model_name']),
            'count' => ($row['count']),
            'date' => ($row['date'])
        );
    }

    if($isDistBranch){
        //Group by Dist
        $queryStr="SELECT date,SUM(count) AS count,disti"
                ." FROM "
                .($isColorAll ? "" : "$colorMappingTable A2,")
                .($isCpuAll ? "" : "$cpuMappingTable A3,")
                .($isFrontCameraAll ? "" : "$frontCameraMappingTable A4,")
                .($isRearCameraAll ? "" : "$rearCameraMappingTable A5,")
                ."$iso A1"

                ." WHERE"
                ." date BETWEEN '$from' AND '$to'"
                .($isAll?"":" AND device IN($str_in)")
                ." AND map_id='$countryID'"
                .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
                .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
                .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
                .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
                .($isDistBranch ? " AND $distBranchStr " : "")
                .($isOnlineDist ? " AND $onlineDistStr " : "")
                ." GROUP BY date,disti ORDER BY date,disti;";

        $db->query($queryStr);
        while($row = $db->fetch_array())
        {
           $resultsGroupByDist[$row['disti']][] = array(
              'date' => ($row['date']),
              'count' => ($row['count']),
           );
        }
        
        //Group by Branch
        $queryStr="SELECT date,SUM(count) AS count,branch"
                ." FROM "
                .($isColorAll ? "" : "$colorMappingTable A2,")
                .($isCpuAll ? "" : "$cpuMappingTable A3,")
                .($isFrontCameraAll ? "" : "$frontCameraMappingTable A4,")
                .($isRearCameraAll ? "" : "$rearCameraMappingTable A5,")
                ."$iso A1"

                ." WHERE"
                ." date BETWEEN '$from' AND '$to'"
                .($isAll?"":" AND device IN($str_in)")
                ." AND map_id='$countryID'"
                .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
                .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
                .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
                .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
                .($isDistBranch ? " AND $distBranchStr " : "")
                .($isOnlineDist ? " AND $onlineDistStr " : "")
                ." GROUP BY date,branch ORDER BY date,branch;";

        $db->query($queryStr);
        while($row = $db->fetch_array())
        {
           $resultsGroupByBranch[$row['branch']][] = array(
              'date' => ($row['date']),
              'count' => ($row['count']),
           );
        }
    }
    $results['groupByRegionResults'] = $resultsGroupByRegion;
    $results['groupByModelResults'] = $resultsGroupByModel;
    $results['groupByDeviceResults'] = $resultsGroupByDevice;
    $results['groupByDistResults'] = $resultsGroupByDist;
    $results['groupByBranchResults'] = $resultsGroupByBranch;
    $results['start_time'] = $start_date;
    $results['end_time'] = $end_date;
    $json = json_encode($results);
    echo $json;
    //echo $cnt;
?>