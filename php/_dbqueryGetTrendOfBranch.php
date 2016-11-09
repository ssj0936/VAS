    <?php
    ini_set("max_execution_time", 0);

    require_once("DBconfig.php");
    require_once("DBclass.php");
    require_once("function.php");
    $db = new DB();
    //$db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB['dbname']);
    $results = array();
    $resultsGroupByModel = array();
    $resultsGroupByDevice = array();
    $resultsGroupByBranch = array();

    

    $color = $_POST['color'];
    $cpu = $_POST['cpu'];
    $rearCamera = $_POST['rearCamera'];
    $frontCamera = $_POST['frontCamera'];
    $dataset = $_POST['dataset'];
    $branch = strtoupper($_POST['branch']);
    $from = $_POST['from'];
    $to = $_POST['to'];
    $data = $_POST['data'];
    $iso = $_POST['iso'];
    
//    $color = '["all"]';
//    $cpu = '["all"]';
//    $rearCamera = '["all"]';
//    $frontCamera = '["all"]';
//    $dataset = 'activation';
//    $data = '[{"model":"ZE520KL","devices":"ZE520KL","product":"ZENFONE","datatype":"model"},{"model":"ZE552KL","devices":"ZE552KL","product":"ZENFONE","datatype":"model"}]';
//    $from = "2015-8-15";
//    $to = "2016-9-14";    
//    $iso ='IND';
//    $branch = 'PUNJAB';
    
    //get Tam Data
    $file = file('geojson/tam/'.$iso.'_branchTam.txt');
    $tam = array();
    $totalTam = 0;
    foreach($file as $val){
        $str = $val;
        $val = str_replace("\r", '', $val);
        $val = str_replace("\n", '', $val);
        $split = explode(',', $val);
        
        $branchName = strtoupper($split[0]);
        $tam[$branchName] = intval($split[1]);
        $totalTam += intval($split[1]);
    }

    $dataObj = json_decode($data);
    $colorObj = json_decode($color);
    $cpuObj = json_decode($cpu);
    $rearCameraObj = json_decode($rearCamera);
    $frontCameraObj = json_decode($frontCamera);
    
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

    $db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB[$dataset]['dbnameRegionL2']);
    
    $str_in='';
        
    $sqlDeviceIn = getAllTargetDeviceSql($dataObj);

    $db->query($sqlDeviceIn);
    while($row = $db->fetch_array()){
        $str_in.="'".$row['device_name']."',";
    }
    $str_in = substr($str_in,0,-1);
    
    //Group by branch
    $queryStr="SELECT date,count,branch,map_id"
            ." FROM "
            .($isColorAll ? "" : "$colorMappingTable A2,")
            .($isCpuAll ? "" : "$cpuMappingTable A3,")
            .($isFrontCameraAll ? "" : "$frontCameraMappingTable A4,")
            .($isRearCameraAll ? "" : "$rearCameraMappingTable A5,")
            ."$iso A1"

            ." WHERE"
            ." date BETWEEN '$from' AND '$to'"
            .($isAll?"":" AND device IN($str_in)")
//            ." AND branch='$branch'"
            .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
            .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
            .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
            .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)");
    
    $queryStr = "SELECT sum(count) as count,branch,date"
                ." from($queryStr)foo,$regionTam regionTam"
                ." WHERE branch = branchName"
                ." and foo.map_id = regionTam.mapid"
                ." GROUP BY date,branch"
                ." ORDER BY date";
	
//    echo "1:".$queryStr."<br>";
    $first = true;
    $start_date = null;
    $end_date = null;
    $db->query($queryStr);
    $total = 0;
    while($row = $db->fetch_array())
    {
        $total+=$row['count'];
        
//        if($row['branch'] != $branch) continue;
        
        $isTargetBranch = false;
       $resultsGroupByBranch[$branch][] = array(
          'date' => ($row['date']),
          'count' => ($row['count']),
          'isTargetBranch' => (isSame($row['branch'] ,$branch)) ? true : false,
       );
        
        if($first){
            $start_date = $row['date'];
            $first=false;
        }
        $end_date = $row['date'];
    }

//    for($i=0; $i<count($resultsGroupByBranch); ++$i){
//        $tam_ = (($resultsGroupByBranch[$i]['count']/$total)/($tam[$branch]/$totalTam))-1;
//        $resultsGroupByBranch[$i]['count'] = round($tam_,4);
//    }
    
    //Group by Model
    $queryStr="SELECT model_name,date,SUM(count) AS count, branch"
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
//            ." AND branch='$branch'"
            ." AND A1.device = mapping.device_name "
            .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
            .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
            .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
            .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
            ." GROUP BY date, model_name, branch ORDER BY date,model_name";
//    echo "2:".$queryStr."<br>";
    $db->query($queryStr);
    $totalModel = array();
    while($row = $db->fetch_array())
    {
        if(!isset($totalModel[$row['model_name']]))
            $totalModel[$row['model_name']] = 0;
        $totalModel[$row['model_name']] += $row['count'];
        
//        if($row['branch'] != $branch) continue;
        
        $resultsGroupByModel[$row['model_name']][] = array(
            //'model' => ($row['model_name']),
            'count' => ($row['count']),
            'date' => ($row['date']),
            'isTargetBranch' => (isSame($row['branch'] ,$branch)) ? true : false,
        );
    }

//    foreach($resultsGroupByModel as $model => $dataArr){  
//        for($i=0; $i<count($dataArr); ++$i){
//            $tam_ = (($resultsGroupByModel[$model][$i]['count']/$totalModel[$model])/($tam[$branch]/$totalTam))-1;
//            $resultsGroupByModel[$model][$i]['count'] = round($tam_,4);
//        }
//    }

    //Group by Device
    $queryStr="SELECT device,date,SUM(count) AS count,branch"
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
//            ." AND branch='$branch'"
            //." AND A1.model = mapping.device_name "
            .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
            .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
            .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
            .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
            ." GROUP BY date, device, branch ORDER BY date,device";
//    echo "3:".$queryStr."<br>";
    $db->query($queryStr);
    $totalDevice = array();
    while($row = $db->fetch_array())
    {
        if(!isset($totalDevice[$row['device']]))
            $totalDevice[$row['device']] = 0;
        $totalDevice[$row['device']] += $row['count'];
        
//        if($row['branch'] != $branch) continue;
        
        $resultsGroupByDevice[$row['device']][] = array(
            //'model' => ($row['device_name']),
            'count' => ($row['count']),
            'date' => ($row['date']),
            'isTargetBranch' => (isSame($row['branch'] ,$branch)) ? true : false,
        );
    }

//    foreach($resultsGroupByDevice as $device => $dataArr){  
//        for($i=0; $i<count($dataArr); ++$i){
//            $tam_ = (($resultsGroupByDevice[$device][$i]['count']/$totalDevice[$device])/($tam[$branch]/$totalTam))-1;
//            $resultsGroupByDevice[$device][$i]['count'] = round($tam_,4);
//        }
//    }

    $results['groupByBranchResults'] = $resultsGroupByBranch;
    $results['groupByModelResults'] = $resultsGroupByModel;
    $results['groupByDeviceResults'] = $resultsGroupByDevice;
    $results['gapDevide'] = $tam[$branch]/$totalTam;
    $results['start_time'] = $start_date;
    $results['end_time'] = $end_date;
    $json = json_encode($results);
    echo $json;
    //echo $cnt;

    function isSame($a,$b){
        $_a = $a;
        $_a = strtolower($_a);
        $_a = str_replace(array("'",'"','-',','," ","(",")"),"",$_a);
        
        $_b = $b;
        $_b = strtolower($_b);
        $_b = str_replace(array("'",'"','-',','," ","(",")"),"",$_b);
        
        return ($_a == $_b);
    }
?>