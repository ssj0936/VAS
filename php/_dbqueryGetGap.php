    <?php
    ini_set("max_execution_time", 0);

    require_once("DBconfig.php");
    require_once("DBclass.php");
    require_once("function.php");
    $results = array();
    $db = new DB();
    

//    $now = new DateTime(null,new DateTimeZone('Asia/Taipei'));
//    echo "<br>-----------<br>".$now->format('Y-m-d H:i:s')."<br>-----------<br>";
//    $color = '["all"]';
//    $cpu = '["all"]';
//    $rearCamera = '["all"]';
//    $frontCamera = '["all"]';
//    $dataset = 'activation';
//    $data = '[{"model":"ZE520KL","devices":"ZE520KL","product":"ZENFONE","datatype":"model"},{"model":"ZE552KL","devices":"ZE552KL","product":"ZENFONE","datatype":"model"}]';
//    $from = "2015-8-15";
//    $to = "2016-9-14";    
//    $iso ='["IND"]';

    $color = $_GET['color'];
    $cpu = $_GET['cpu'];
    $rearCamera = $_GET['rearCamera'];
    $frontCamera = $_GET['frontCamera'];
    $dataset = $_GET['dataset'];
    $from = $_GET['from'];
    $to = $_GET['to'];
    $data = $_GET['data'];
    $iso = $_GET['iso'];

    $countryArray = array();

    if($data != "[]"){
        
        //1.get count of each object
        $isoObj = json_decode($iso);
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
            
		$fromTableStr='';
		for($i=0;$i<count($isoObj);++$i){
            
            $fromTableStr.="SELECT country_id,count,device_model.model_name model_name"
                        ." FROM "
                        .($isColorAll ? "" : "$colorMappingTable A2,")
                        .($isCpuAll ? "" : "$cpuMappingTable A3,")
                        .($isFrontCameraAll ? "" : "$frontCameraMappingTable A4,")
                        .($isRearCameraAll ? "" : "$rearCameraMappingTable A5,")
                        ."$isoObj[$i] A1,"
                        ."$deviceTable device_model"

                        ." WHERE "
                        ."date BETWEEN '".$from."' AND '".$to."'"
                        ." AND A1.model = device_model.device_name"
                        .($isAll?"":" AND model IN(".$str_in.")")
                        .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN(".$color_in.")")
                        .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN(".$cpu_in.")")
                        .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN(".$frontCamera_in.")")
                        .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN(".$rearCamera_in.")");

			if($i != count($isoObj)-1)
				$fromTableStr.=" UNION ALL ";
		}
		$fromTableStr ="(".$fromTableStr.")foo";
		//echo $fromTableStr."<br>";
		
		$queryStr = "SELECT country_id,SUM(count) AS count,model_name FROM ".$fromTableStr." GROUP BY country_id,model_name ORDER BY count DESC;";
//		echo $queryStr."<br><br><br>";
		
		$db->query($queryStr);
		while($row = $db->fetch_array())
		{
            $countryArray[$row['country_id']]['models'][$row['model_name']] = $row['count'];
            if (empty($countryArray[$row['country_id']]['count'])) {
                $countryArray[$row['country_id']]['count'] = $row['count'];
            } else {
                $countryArray[$row['country_id']]['count'] += $row['count'];
            }
		}
    }
    $results['total'] = array();
    $results['total']['total'] = 0;
    foreach($countryArray as $country_id => $countryData) {
        arsort($countryData['models']);
        $results[$country_id] = array(
                'cnt' => ($countryData['count']),
                'models' => ($countryData['models'])
            );
        
        foreach($countryData['models'] as $modelName => $modelCnt){
            if(isset($results['total'][$modelName])){
                $results['total'][$modelName] += $modelCnt;
            }else{
                $results['total'][$modelName] = $modelCnt;
            }
            
            $results['total']['total'] += $modelCnt;
        }
    }

    //2.get object branch mapping
    $db->query("SELECT * from $branchObjectIDMapping ");
    $objectBranchMapping = array();
    while($row = $db->fetch_array()){
        
        $objids = json_decode($row['object_id']);
        foreach($objids as $val){
            if(!isset($objectBranchMapping[$val]))
                $objectBranchMapping[$val] = $row['Loc_BranchName'];
            else
                $objectBranchMapping[$val] .= '/'.$row['Loc_BranchName'];
        }
    }
    

    //3.get tam of each branch and whole country
    $file = file('geojson/branchTam.txt');
    $tam = array();
    $totalTam = 0;
    foreach($file as $val){
        $str = $val;
        $val = str_replace("\r", '', $val);
        $val = str_replace("\n", '', $val);
        $split = explode(',', $val);
        
        $tam[$split[0]] = intval($split[1]);
        $totalTam += intval($split[1]);
    }
//    print_r($tam);


//    foreach($results as $key => $val){
//        $objID = $key;
//        if(!isset($objectBranchMapping[$key]))
//            echo $key.",";
//    }

    //combine all data
    $result = array();
    foreach($objectBranchMapping as $key => $val){
        $objectID = $key;
        $branch = $val;
        
        if(isset($results[$objectID])){
            $modelArr = $results[$objectID]['models'];
            foreach ($modelArr as $modelName => $modelVal){
                if(!isset($result[$branch][$modelName]))
                    $result[$branch][$modelName] = $modelVal;
                else
                    $result[$branch][$modelName] += $modelVal;
            }

            if(!isset($result[$branch]['total']))
                $result[$branch]['total'] = $results[$objectID]['cnt'];
            else
                $result[$branch]['total'] += $results[$objectID]['cnt'];
        }
    }

    //tam cal
    $tamResult = array();
    foreach($result as $branchName => $modelsCnt){
        foreach($modelsCnt as $modelname => $modelCnt){
            $tam_ = (($modelCnt/$results['total']['total'])/($tam[$branchName]/$totalTam))-1;
            $tamResult[$branchName][$modelname] = round($tam_,4);
        }
    }
    

//    $json = json_encode($results);
//    echo $json."<br><br><br>";
//
//    $json = json_encode($result);
//    echo $json."<br><br><br>";   

    $json = json_encode($tamResult);
    echo $json;   


//     $now = new DateTime(null,new DateTimeZone('Asia/Taipei'));
//     echo "<br>-----------<br>".$now->format('Y-m-d H:i:s')."<br>-----------<br>";
	
	// function sqlsrvfyTableName($tablename){
		// return '['.$GLOBALS['_DB']['dbname'].'].[dbo].['.$tablename.']';
	// }

?>