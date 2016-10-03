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
//    $data = '[{"model":"ZENFONE","devices":"ZENFONE","product":"ZENFONE","datatype":"product"}]';
//    $from = "2014-8-31";
//    $to = "2016-9-30";    
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
            
            $fromTableStr.="SELECT branch,count,device_model.model_name model_name"
                        ." FROM "
                        .($isColorAll ? "" : "$colorMappingTable A2,")
                        .($isCpuAll ? "" : "$cpuMappingTable A3,")
                        .($isFrontCameraAll ? "" : "$frontCameraMappingTable A4,")
                        .($isRearCameraAll ? "" : "$rearCameraMappingTable A5,")
                        ."$isoObj[$i] A1,"
                        ."$deviceTable device_model"

                        ." WHERE "
                        ." date BETWEEN '".$from."' AND '".$to."'"
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
		
		$queryStr = "SELECT branch,SUM(count) AS count,model_name FROM ".$fromTableStr." GROUP BY branch,model_name ORDER BY count DESC;";
//		echo $queryStr."<br><br><br>";
		
		$db->query($queryStr);
		while($row = $db->fetch_array())
		{
            if($row['branch'] == '') continue;
            
            $countryArray[$row['branch']]['models'][$row['model_name']] = $row['count'];
            if (empty($countryArray[$row['branch']]['count'])) {
                $countryArray[$row['branch']]['count'] = $row['count'];
            } else {
                $countryArray[$row['branch']]['count'] += $row['count'];
            }
		}
    }
    $results['total'] = array();
    $results['total']['total'] = 0;
    foreach($countryArray as $branch => $countryData) {
        arsort($countryData['models']);
        $branchName = strtoupper($branch);
        $results[$branchName] = array(
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
    

    //3.get tam of each branch and whole country
    $file = file('geojson/branchTam.txt');
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
//    print_r($tam);
//    echo $totalTam."<br><br>";

    //combine all data
    $result = array();
    foreach($results as $branchName => $dataArr){
        if($branchName == 'total') continue;
        
        $result[$branchName]['total'] = $dataArr['cnt'];
        foreach($dataArr['models'] as $modelName => $modelVal){
            $result[$branchName][$modelName] = $modelVal;
        }
    }

    //tam cal
    $tamResult = array();
    foreach($result as $branchName => $modelsArr){
        foreach($modelsArr as $modelname => $modelCnt){
            if(!isset($tam[$branchName])) continue;
            
            $tam_ = ($results['total'][$modelname] == 0) ? -1 :(($modelCnt/$results['total'][$modelname])/($tam[$branchName]/$totalTam))-1;
            $tamResult[$branchName][$modelname] = round($tam_,4);
        }
    }
    ksort($tamResult);
    

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