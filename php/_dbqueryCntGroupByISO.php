    <?php
    ini_set("max_execution_time", 0);

    require_once("DBconfig.php");
    require_once("DBclass.php");
    require_once("function.php");
    $results = array();
    $db = new DB();
    

//    $now = new DateTime(null,new DateTimeZone('Asia/Taipei'));
//    echo "<br>-----------<br>".$now->format('Y-m-d H:i:s')."<br>-----------<br>";
//    $color = '["Black","BLACK"]';
//    $color = '["all"]';
//    $cpu = '["all"]';
//    $rearCamera = '["all"]';
//    $frontCamera = '["all"]';
//    $dataset = 'activation';
//    $from = "2016-7-9";
//    $to = "2016-8-3";    
//    $iso ='["IND"]';
//    $data = '[{"model":"all","devices":"all","datatype":"model"}]';
//    $data = '[{"model":"ZE520KL","devices":"ZE520KL","product":"ZENFONE","datatype":"model"},{"model":"ZE552KL","devices":"ZE552KL","product":"ZENFONE","datatype":"model"}]';
//$data = '[{"model":"ZE520KL","devices":"ZE520KL","product":"ZENFONE","datatype":"model"},{"model":"ZE552KL","devices":"ZE552KL","product":"ZENFONE","datatype":"model"},{"model":"ZENFONE-D","devices":"ZENFONE-D","product":"ZENFONE-D","datatype":"product"}]';
//$color = '["Aqua Blue (IMR)","BLACK","BLUE","Gold (IMR)","RED","WHITE","black","blue","Orange","white","White; ABS","White;ABS","Black","Gold","White","GOLD","Golden","Red","Silver","SILVER BLUE","Yellow","Glacier Silver","Titanium Gray","Unknown"]';
//$cpu = '["MTK MT6580; Quad-Core CPUs; 1.3GHz","Qualcomm Snapdragon410 MSM8916; Quad-core CPU; 1.0 GHz","Qualcomm Snapdragon410 MSM8916; Quad-core CPUs;  1.2 GHz","MTK MT6737T; Quad-Core CPUs","MTK MT6737V/C; Quad-Core CPUs; 1.25G","Qualcomm Snapdragon200 MSM8212; Quad-core CPUs; 1.2GHz","Qualcomm Snapdragon625 MSM8953; octa-core CPUs; 2.0 GHz","Unknown"] ';
//$rearCamera = '["13 Mega Pixel","8 Mega Pixel","5 Mega Pixel","Unknown"]';
//$frontCamera = '["0.3 Mega Pixel","2 Mega Pixel","8 Mega Pixel","Unknown"]';
//$dataset = 'lifezone';
//$from = "2015-8-15";
//$to = "2016-9-14";    
//$iso ='["IND"]';
//$data = '[{"model":"A501CG","devices":"A501CG","product":"ZENFONE","datatype":"model"}]';
//$distBranch = '[{"dist":"FLIPKART","branch":"KARNATAKA"}]';



    $color = $_POST['color'];
    $cpu = $_POST['cpu'];
    $rearCamera = $_POST['rearCamera'];
    $frontCamera = $_POST['frontCamera'];
    $dataset = $_POST['dataset'];
    $from = $_POST['from'];
    $to = $_POST['to'];
    $data = $_POST['data'];
    $iso = $_POST['iso'];
    $distBranch = $_POST['distBranch'];
    $onlineDist = $_POST['onlineDist'];

    $countryArray = array();

    if($data!="[]"){
        $isoObj = json_decode($iso);
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
    
		if(count($isoObj)==1){
			$db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB[$dataset]['dbnameRegionL2']);
		}else{
			$db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB[$dataset]['dbnameRegionL1']);
		}
		$str_in='';
        
        $sqlDeviceIn = getAllTargetDeviceSql($dataObj);
//        echo $sqlDeviceIn;
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
                        .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN(".$rearCamera_in.")")
                        .($isDistBranch ? " AND $distBranchStr " : "")
                        .($isOnlineDist ? " AND $onlineDistStr " : "");

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
    foreach($countryArray as $country_id => $countryData) {
        arsort($countryData['models']);
        $results[] = array(
                'countryID' => ($country_id),
                'cnt' => ($countryData['count']),
                'models' => ($countryData['models'])
            );
    }
    $json = json_encode($results);
    echo $json;

//     $now = new DateTime(null,new DateTimeZone('Asia/Taipei'));
//     echo "<br>-----------<br>".$now->format('Y-m-d H:i:s')."<br>-----------<br>";
	
	// function sqlsrvfyTableName($tablename){
		// return '['.$GLOBALS['_DB']['dbname'].'].[dbo].['.$tablename.']';
	// }

?>