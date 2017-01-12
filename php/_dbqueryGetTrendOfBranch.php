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
    $permission = $_POST['permission'];

//    $color = '["all"]';
//    $cpu = '["all"]';
//    $rearCamera = '["all"]';
//    $frontCamera = '["all"]';
//    $dataset = 'activation';
//    $branch = '3';
//    $from = "2016-11-29";
//    $to = "2016-12-29";  
//    $iso ='["PHL"]';
//    $data = '[{"model":"ZENFONE","devices":"ZENFONE","product":"ZENFONE","datatype":"product"}]';
//    $permission = '{"":["AK","AT","AZ"],"HKG":["AK","AT","AX","AZ"],"IND":["AK","AT","AX","AZ"],"IDN":["AK","AT","AX","AZ"],"JPN":["AK","AT","AX","AZ"],"MYS":["AK","AT","AX","AZ"],"PHL":["AK","AT","AX","AZ"],"SGP":["AK","AT","AX","AZ"],"THA":["AK","AT","AX","AZ"],"VNM":["AK","AT","AX","AZ"],"BGD":["AK","AT","AX","AZ"],"MMR":["AK","AT","AX","AZ"],"KOR":["AK","AT","AX","AZ"],"KHM":["AK","AT","AX","AZ"]}';
//    $permission = '{}';

    
    $isoObj = json_decode($iso);
    
    $db->connect_db($_DB['host'], $_DB['username'], $_DB['password']);
    $sqlLevel = getBranchLocLevelSql($isoObj[0]);

    $db->query($sqlLevel);
    $row = $db->fetch_array();
    $level = intval($row['loc_level']);
    $present = $row['tam_spec'];
    $db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB[$dataset]['dbnameRegionL'.$level]);

    //get Tam Data
    $file = file('geojson/tam/'.$isoObj[0].'_branchTam.txt');
    $tam = array();
    $totalTam = 0;
    foreach($file as $val){
        $str = $val;
        $val = str_replace("\r", '', $val);
        $val = str_replace("\n", '', $val);
        $split = explode(',', $val);
//        echo $split[0]."/".$split[1]."<br>";
        $branchName = strtoupper($split[0]);
        if ($present == 'number') {
            $tam[$branchName] = intval($split[1]);
            $totalTam += intval($split[1]);
        } else if ($present == 'percent') {
            $tam[$branchName] = intval($split[1])/100;
        }
    }

    $dataObj = json_decode($data);
    $colorObj = json_decode($color);
    $cpuObj = json_decode($cpu);
    $rearCameraObj = json_decode($rearCamera);
    $frontCameraObj = json_decode($frontCamera);
    $permissionObj = json_decode($permission);

    $isAll = isAll($dataObj);
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
    
    $str_in='';
        
    $sqlDeviceIn = getAllTargetPartNoSql($dataObj);

    $db->query($sqlDeviceIn);
    while($row = $db->fetch_array()){
        $str_in.="'".$row['product_id']."',";
    }
    $str_in = substr($str_in,0,-1);
    
    $queryStr='';

    if(!$isFullPermission){
        $result = permissionCheck($isFullPermission,$permissionObj,$isoObj[0]);
        if(!$result['queryable']) continue;
    }

    switch($isoObj[0]){
        case 'IND':
            //Group by branch
            $queryStr.="SELECT date,count,branch,map_id"
                    ." FROM "
                    .($isColorAll ? "" : "$colorMappingTable A2,")
                    .($isCpuAll ? "" : "$cpuMappingTable A3,")
                    .($isFrontCameraAll ? "" : "$frontCameraMappingTable A4,")
                    .($isRearCameraAll ? "" : "$rearCameraMappingTable A5,")
                    .(($isFullPermission || $result['isFullPermissionThisIso']) ? "" : "(SELECT distinct product_id,model_name FROM $productIDTable) product,")
                    ."$isoObj[0] A1,"
                    ."$deviceTable device_model"

                    ." WHERE "
                    ."date BETWEEN '".$from."' AND '".$to."'"
                    ." AND A1.device = device_model.device_name"
                    .($isAll?"":" AND A1.product_id IN(".$str_in.")")
                    .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
                    .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
                    .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
                    .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
                    .(($isFullPermission || $result['isFullPermissionThisIso']) ? "" : " AND device_model.model_name = product.model_name AND product.product_id IN (".$result['permissionProductIDStr'].")");

            $queryStr = "SELECT sum(count) as count,branch,date"
                        ." from($queryStr)foo,$regionTam regionTam"
                        ." WHERE branch = branchName"
                        ." and foo.map_id = regionTam.mapid"
                        ." GROUP BY date,branch"
                        ." ORDER BY date";
            break;
            
        default:
            //Group by branch
            $queryStr.="SELECT date,count,map_id"
                    ." FROM "
                    .($isColorAll ? "" : "$colorMappingTable A2,")
                    .($isCpuAll ? "" : "$cpuMappingTable A3,")
                    .($isFrontCameraAll ? "" : "$frontCameraMappingTable A4,")
                    .($isRearCameraAll ? "" : "$rearCameraMappingTable A5,")
                    .(($isFullPermission || $result['isFullPermissionThisIso']) ? "" : "(SELECT distinct product_id,model_name FROM $productIDTable) product,")
                    ."$isoObj[0] A1,"
                    ."$deviceTable device_model"

                    ." WHERE "
                    ."date BETWEEN '".$from."' AND '".$to."'"
                    ." AND A1.device = device_model.device_name"
                    .($isAll?"":" AND A1.product_id IN(".$str_in.")")
                    .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
                    .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
                    .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
                    .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
                    .(($isFullPermission || $result['isFullPermissionThisIso']) ? "" : " AND device_model.model_name = product.model_name AND product.product_id IN (".$result['permissionProductIDStr'].")");

            $queryStr = "SELECT sum(count) as count,branchName as branch,date"
                        ." from($queryStr)foo,$regionTam regionTam"
                        ." WHERE foo.map_id = regionTam.mapid"
                        ." GROUP BY date,branchName"
                        ." ORDER BY date";
            break;
    }
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
    switch($isoObj[0]){
        case 'IND':
            //Group by Model
            $queryStr="SELECT model_name,date,SUM(count) AS count, branch"
                    ." FROM "
                    .($isColorAll ? "" : "$colorMappingTable A2,")
                    .($isCpuAll ? "" : "$cpuMappingTable A3,")
                    .($isFrontCameraAll ? "" : "$frontCameraMappingTable A4,")
                    .($isRearCameraAll ? "" : "$rearCameraMappingTable A5,")
                    ."$isoObj[0] A1,"
                    ."$deviceTable mapping"

                    ." WHERE"
                    ." date BETWEEN '$from' AND '$to'"
                    .($isAll?"":" AND A1.product_id IN(".$str_in.")")
                    ." AND A1.device = mapping.device_name "
                    .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
                    .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
                    .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
                    .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
                    ." GROUP BY date, model_name, branch ORDER BY date,model_name";
            break;
        
        default:
            //Group by Model
            $queryStr="SELECT model_name,date,SUM(count) AS count, branchName AS branch"
                    ." FROM "
                    .($isColorAll ? "" : "$colorMappingTable A2,")
                    .($isCpuAll ? "" : "$cpuMappingTable A3,")
                    .($isFrontCameraAll ? "" : "$frontCameraMappingTable A4,")
                    .($isRearCameraAll ? "" : "$rearCameraMappingTable A5,")
                    ."$isoObj[0] A1,"
                    ."$deviceTable mapping,"
                    ."$regionTam regionTam"


                    ." WHERE"
                    ." date BETWEEN '$from' AND '$to'"
                    .($isAll?"":" AND A1.product_id IN(".$str_in.")")
                    ." AND A1.device = mapping.device_name "
                    ." AND A1.map_id = regionTam.mapid "
                    .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
                    .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
                    .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
                    .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
                    ." GROUP BY date, model_name, branchName ORDER BY date,model_name";
            break;
    }
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
    switch($isoObj[0]){
            case 'IND':
                $queryStr="SELECT part_device.model_description as device,date,SUM(count) AS count,branch"
                        ." FROM "
                        .($isColorAll ? "" : "$colorMappingTable A2,")
                        .($isCpuAll ? "" : "$cpuMappingTable A3,")
                        .($isFrontCameraAll ? "" : "$frontCameraMappingTable A4,")
                        .($isRearCameraAll ? "" : "$rearCameraMappingTable A5,")
                        ."$isoObj[0] A1,"
                        ."$productDescriptionMapping part_device"
                        //."$deviceTable mapping"

                        ." WHERE"
                        ." date BETWEEN '$from' AND '$to'"
                        ." AND A1.product_id = part_device.product_id"
                        .($isAll?"":" AND A1.product_id IN(".$str_in.")")
            //            ." AND branch='$branch'"
                        //." AND A1.model = mapping.device_name "
                        .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
                        .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
                        .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
                        .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
                        ." GROUP BY date, part_device.model_description, branch ORDER BY date,part_device.model_description";
                break;
            
            default:
                $queryStr="SELECT part_device.model_description as device,date,SUM(count) AS count,branchName AS branch"
                        ." FROM "
                        .($isColorAll ? "" : "$colorMappingTable A2,")
                        .($isCpuAll ? "" : "$cpuMappingTable A3,")
                        .($isFrontCameraAll ? "" : "$frontCameraMappingTable A4,")
                        .($isRearCameraAll ? "" : "$rearCameraMappingTable A5,")
                        ."$isoObj[0] A1,"
                        ."$regionTam regionTam,"
                        //."$deviceTable mapping"
                        ."$productDescriptionMapping part_device"
                        //."$deviceTable mapping"

                        ." WHERE"
                        ." date BETWEEN '$from' AND '$to'"
                        ." AND A1.product_id = part_device.product_id"
                        .($isAll?"":" AND A1.product_id IN(".$str_in.")")
                        ." AND A1.map_id = regionTam.mapid "
            //            ." AND branch='$branch'"
                        //." AND A1.model = mapping.device_name "
                        .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN($color_in)")
                        .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN($cpu_in)")
                        .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN($frontCamera_in)")
                        .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN($rearCamera_in)")
                        ." GROUP BY date, part_device.model_description, branchName ORDER BY date,part_device.model_description";
                break;
    }
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
    $results['gapDevide'] = (($present == 'number') ? ($tam[$branch]/$totalTam):($tam[$branch]));
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