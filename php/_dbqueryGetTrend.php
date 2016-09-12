    <?php
    ini_set("max_execution_time", 0);

    require_once("DBconfig.php");
    require_once("DBclass.php");
    require_once("function.php");
    $resultsGroupByModel = array();
    $resultsGroupByDevice = array();
    $resultsGroupByCountry = array();
    $resultsGroupByDate = array();
    $distinctModel = array();
    $db = new DB();
    

//    $now = new DateTime(null,new DateTimeZone('Asia/Taipei'));
//    echo "<br>-----------<br>".$now->format('Y-m-d H:i:s')."<br>-----------<br>";
//    $color = '["all"]';
//    $cpu = '["all"]';
//    $rearCamera = '["all"]';
//    $frontCamera = '["all"]';
//    $dataset = 'activation';
//    $from = "2016-7-9";
//    $to = "2016-8-3";    
//    $iso ='["TWN"]';
//    $data = '[{"model":"all","devices":"all","datatype":"model"}]';
//    $data = '[{"model":"ZE520KL","devices":"ZE520KL","product":"ZENFONE","datatype":"model"},{"model":"ZE552KL","devices":"ZE552KL","product":"ZENFONE","datatype":"model"}]';
    $color = $_GET['color'];
    $cpu = $_GET['cpu'];
    $rearCamera = $_GET['rearCamera'];
    $frontCamera = $_GET['frontCamera'];
    $dataset = $_GET['dataset'];
    $from = $_GET['from'];
    $to = $_GET['to'];
    $data = $_GET['data'];
    $iso = $_GET['iso'];
    $distBranch = $_GET['distBranch'];

    if($data!="[]"){
        $isoObj = json_decode($iso);
        $dataObj = json_decode($data);
        $colorObj = json_decode($color);
        $cpuObj = json_decode($cpu);
        $rearCameraObj = json_decode($rearCamera);
        $frontCameraObj = json_decode($frontCamera);
        $distBranchObj = json_decode($distBranch);
        
        $isDistBranch = (count($distBranchObj)!=0);
        $distBranchStr = getSQLDistBranchStr($distBranchObj,false);
        
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
        
        $db->query($sqlDeviceIn);
        while($row = $db->fetch_array()){
            $str_in.="'".$row['device_name']."',";
        }
        $str_in = substr($str_in,0,-1);
		//echo $str_in;	
        //group by model_name
		//--------------------------------------------------------------------------------
		$fromTableStr='';
		for($i=0;$i<count($isoObj);++$i){
            
            $fromTableStr.="SELECT model,count,date"
                        ." FROM "
                        .($isColorAll ? "" : "$colorMappingTable A2,")
                        .($isCpuAll ? "" : "$cpuMappingTable A3,")
                        .($isFrontCameraAll ? "" : "$frontCameraMappingTable A4,")
                        .($isRearCameraAll ? "" : "$rearCameraMappingTable A5,")
                        ."$isoObj[$i] A1"

                        ." WHERE "
                        ."date BETWEEN '".$from."' AND '".$to."'"
                        .($isAll?"":" AND model IN(".$str_in.")")
                        .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN(".$color_in.")")
                        .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN(".$cpu_in.")")
                        .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN(".$frontCamera_in.")")
                        .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN(".$rearCamera_in.")")
                        .($isDistBranch ? " AND $distBranchStr " : "");
			if($i != count($isoObj)-1)
				$fromTableStr.=" UNION ALL ";
		}
		$fromTableStrGroupByModel ="(".$fromTableStr.")data,$deviceTable mapping";
		//echo $fromTableStr."<br>";
		
		$queryStr = "SELECT sum(count)count,date,model_name FROM ".$fromTableStrGroupByModel." WHERE data.model = mapping.device_name GROUP BY date, model_name ORDER BY date,model_name;";
//		echo $queryStr."<br><br><br>";
		
		$db->query($queryStr);
        $first = true;
        $start_date = null;
        $end_date = null;
		while($row = $db->fetch_array())
		{
			$resultsGroupByModel[$row['model_name']][] = array(
				//'model' => ($row['model_name']),
				'count' => ($row['count']),
                'date' => ($row['date'])
			);
            if($first){
                $start_date = $row['date'];
                $first=false;
            }
            $end_date = $row['date'];
		}
        //group by devices
        //--------------------------------------------------------------------------------
        $fromTableStrGroupByDevice ="(".$fromTableStr.")data";
        $queryStr = "SELECT sum(count)count,date,model FROM ".$fromTableStrGroupByDevice." GROUP BY date, model ORDER BY date,model;";
        $db->query($queryStr);
        while($row = $db->fetch_array())
        {
            $resultsGroupByDevice[$row['model']][] = array(
                'count' => ($row['count']),
                'date' => ($row['date'])
            );
        }
        //group by date
        //--------------------------------------------------------------------------------
        $fromTableStrGroupByDate ="(".$fromTableStr.")data";
        $queryStr = "SELECT sum(count)count,date FROM ".$fromTableStrGroupByDate." GROUP BY date ORDER BY date;";
        $db->query($queryStr);
        while($row = $db->fetch_array())
        {
            $resultsGroupByDate[] = array(
                'count' => ($row['count']),
                'date' => ($row['date'])
            );
        }
        //group By Country
        //--------------------------------------------------------------------------------
        $queryStr='';
        for($i=0;$i<count($isoObj);++$i){
            $queryStr="SELECT sum(count)count,date"
                        ." FROM "
                        .($isColorAll ? "" : "$colorMappingTable A2,")
                        .($isCpuAll ? "" : "$cpuMappingTable A3,")
                        .($isFrontCameraAll ? "" : "$frontCameraMappingTable A4,")
                        .($isRearCameraAll ? "" : "$rearCameraMappingTable A5,")
                        ."$isoObj[$i] A1"

                        ." WHERE "
                        ."date BETWEEN '".$from."' AND '".$to."'"
                        .($isAll?"":" AND model IN(".$str_in.")")
                        .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN(".$color_in.")")
                        .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN(".$cpu_in.")")
                        .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN(".$frontCamera_in.")")
                        .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN(".$rearCamera_in.")")
                        .($isDistBranch ? " AND $distBranchStr " : "")
                        .'GROUP BY date ORDER BY date';
            $db->query($queryStr);
            while($row = $db->fetch_array())
            {
                $resultsGroupByCountry[$isoObj[$i]][] = array(
                    'count' => ($row['count']),
                    'date' => ($row['date'])
                );
            }
        }
    }
    $return = Array();
    $return['groupByDateResults'] = $resultsGroupByDate;
	$return['groupByModelResults'] = $resultsGroupByModel;
    $return['groupByDeviceResults'] = $resultsGroupByDevice;
    $return['groupByCountryResults'] = $resultsGroupByCountry;
    $return['start_time'] = $start_date;
    $return['end_time'] = $end_date;
    $json = json_encode($return);
    echo $json;

//     $now = new DateTime(null,new DateTimeZone('Asia/Taipei'));
//     echo "<br>-----------<br>".$now->format('Y-m-d H:i:s')."<br>-----------<br>";
	
	// function sqlsrvfyTableName($tablename){
		// return '['.$GLOBALS['_DB']['dbname'].'].[dbo].['.$tablename.']';
	// }

?>