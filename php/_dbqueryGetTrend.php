    <?php
    ini_set("max_execution_time", 0);

    require_once("DBconfig.php");
    require_once("DBclass.php");
    require_once("function.php");
    $resultsGroupByModel = array();
    $resultsGroupByDevice = array();
    $resultsGroupByCountry = array();
    $resultsGroupByDate = array();
    $resultsGroupByDist = array();
    $resultsGroupByBranch = array();
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

//    $color = '["all"]';
//    $cpu = '["all"]';
//    $rearCamera = '["all"]';
//    $frontCamera = '["all"]';
//    $dataset = 'activation';
//    $from = "2016-7-9";
//    $to = "2016-8-3";    
//    $iso ='["IND"]';
//    $data = '[{"model":"A501CG","devices":"A501CG","product":"ZENFONE","datatype":"model"}]';
//    $distBranch = '[{"dist":"FLIPKART","branch":"KARNATAKA"}]';
//    $onlineDist = '[]';

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
    $permission = $_POST['permission'];

//    $color = '["all"]';
//    $cpu = '["all"]';
//    $rearCamera = '["all"]';
//    $frontCamera = '["all"]';
//    $dataset = 'activation';
//    $from = "2016-12-7";
//    $to = "2016-12-9";    
//    $iso ='["IDN"]';
//    $data = '[{"model":"ZE552KL","devices":"ZE552KL","product":"ZENFONE","datatype":"model"}]';
//    $distBranch = '[]';
//    $onlineDist = '[]';
//    $permission = '{}';
    
    if($data!="[]"){
        $isoObj = json_decode($iso);
        $dataObj = json_decode($data);
        $colorObj = json_decode($color);
        $cpuObj = json_decode($cpu);
        $rearCameraObj = json_decode($rearCamera);
        $frontCameraObj = json_decode($frontCamera);
        $distBranchObj = json_decode($distBranch);
        $onlineDistObj = json_decode($onlineDist);
        $permissionObj = json_decode($permission);
        
        $isDistBranch = (count($distBranchObj)!=0);
        $isOnlineDist = (count($onlineDistObj)!=0);
        $isFullPermission = (empty((array)$permissionObj));
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
        $sqlDeviceIn = getAllTargetPartNoSql($dataObj);

        $db->query($sqlDeviceIn);
        while($row = $db->fetch_array()){
            $str_in.="'".$row['part_no']."',";
        }
        $str_in = substr($str_in,0,-1);
		//echo $str_in;	
        //group by model_name
		//--------------------------------------------------------------------------------
		$fromTableStr='';
		for($i=0;$i<count($isoObj);++$i){
            
            if(!$isFullPermission){
                $result = permissionCheck($isFullPermission,$permissionObj,$isoObj[$i]);
                if(!$result['queryable']) continue;
            }
            
            $tmpFromTableStr="SELECT part_device.model_description as device,part_device.device_name as name,count,date"
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
                        ." AND A1.product_id = part_device.part_no"
                        .($isAll?"":" AND A1.product_id IN(".$str_in.")")
                        .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN(".$color_in.")")
                        .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN(".$cpu_in.")")
                        .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN(".$frontCamera_in.")")
                        .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN(".$rearCamera_in.")")
                        .($isDistBranch ? " AND $distBranchStr " : "")
                        .($isOnlineDist ? " AND $onlineDistStr " : "")
                        .(($isFullPermission || $result['isFullPermissionThisIso']) ? "" : " AND device_model.model_name = product.model_name AND product.product_id IN (".$result['permissionProductIDStr'].")");
			
            if(strlen($fromTableStr)==0){
                $fromTableStr .= $tmpFromTableStr;
            }
            else{
                $fromTableStr.=(" UNION ALL ".$tmpFromTableStr);
            }
		}
		$fromTableStrGroupByModel ="(".$fromTableStr.")data,$deviceTable mapping";
//		echo $fromTableStr."<br>";
		
		$queryStr = "SELECT sum(count)count,date,model_name FROM ".$fromTableStrGroupByModel." WHERE data.name = mapping.device_name GROUP BY date, model_name ORDER BY date,model_name;";
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
        $queryStr = "SELECT sum(count)count,date,device FROM ".$fromTableStrGroupByDevice." GROUP BY date, device ORDER BY date,device;";
        $db->query($queryStr);
        while($row = $db->fetch_array())
        {
            $resultsGroupByDevice[$row['device']][] = array(
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
                        .($isAll?"":" AND A1.product_id IN(".$str_in.")")
                        .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN(".$color_in.")")
                        .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN(".$cpu_in.")")
                        .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN(".$frontCamera_in.")")
                        .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN(".$rearCamera_in.")")
                        .($isDistBranch ? " AND $distBranchStr " : "")
                        .($isOnlineDist ? " AND $onlineDistStr " : "")
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
        
        //group by dist/branch
        if($isDistBranch){
            //group by dist
            //--------------------------------------------------------------------------------
            $fromTableStr='';
            for($i=0;$i<count($isoObj);++$i){

                $fromTableStr.="SELECT part_device.model_description as device,part_device.device_name as name,count,date, disti"
                            ." FROM "
                            .($isColorAll ? "" : "$colorMappingTable A2,")
                            .($isCpuAll ? "" : "$cpuMappingTable A3,")
                            .($isFrontCameraAll ? "" : "$frontCameraMappingTable A4,")
                            .($isRearCameraAll ? "" : "$rearCameraMappingTable A5,")
                            ."$isoObj[$i] A1,"
                            ."$productDescriptionMapping part_device"

                            ." WHERE "
                            ."date BETWEEN '".$from."' AND '".$to."'"
                            ." AND A1.product_id = part_device.part_no"
                            .($isAll?"":" AND A1.product_id IN(".$str_in.")")
                            .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN(".$color_in.")")
                            .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN(".$cpu_in.")")
                            .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN(".$frontCamera_in.")")
                            .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN(".$rearCamera_in.")")
                            .($isDistBranch ? " AND $distBranchStr " : "")
                            .($isOnlineDist ? " AND $onlineDistStr " : "");
                if($i != count($isoObj)-1)
                    $fromTableStr.=" UNION ALL ";
            }
            $fromTableStrGroupByDist ="(".$fromTableStr.")data,$deviceTable mapping";
            //echo $fromTableStr."<br>";

            $queryStr = "SELECT sum(count)count,date,disti FROM ".$fromTableStrGroupByDist." WHERE data.name = mapping.device_name GROUP BY date, disti ORDER BY date,disti;";
//    		echo $queryStr."<br><br><br>";

            $db->query($queryStr);
            while($row = $db->fetch_array())
            {
                $resultsGroupByDist[$row['disti']][] = array(
                    'count' => ($row['count']),
                    'date' => ($row['date'])
                );
            }
            
            //group by branch
            //--------------------------------------------------------------------------------
            $fromTableStr='';
            for($i=0;$i<count($isoObj);++$i){

                $fromTableStr.="SELECT part_device.model_description as device,part_device.device_name as name,count,date,branch"
                            ." FROM "
                            .($isColorAll ? "" : "$colorMappingTable A2,")
                            .($isCpuAll ? "" : "$cpuMappingTable A3,")
                            .($isFrontCameraAll ? "" : "$frontCameraMappingTable A4,")
                            .($isRearCameraAll ? "" : "$rearCameraMappingTable A5,")
                            ."$isoObj[$i] A1,"
                            ."$productDescriptionMapping part_device"

                            ." WHERE "
                            ."date BETWEEN '".$from."' AND '".$to."'"
                            ." AND A1.product_id = part_device.part_no"
                            .($isAll?"":" AND A1.product_id IN(".$str_in.")")
                            .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN(".$color_in.")")
                            .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN(".$cpu_in.")")
                            .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN(".$frontCamera_in.")")
                            .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN(".$rearCamera_in.")")
                            .($isDistBranch ? " AND $distBranchStr " : "")
                            .($isOnlineDist ? " AND $onlineDistStr " : "");
                if($i != count($isoObj)-1)
                    $fromTableStr.=" UNION ALL ";
            }
            $fromTableStrGroupByBranch ="(".$fromTableStr.")data,$deviceTable mapping";
            //echo $fromTableStr."<br>";

            $queryStr = "SELECT sum(count)count,date,branch FROM ".$fromTableStrGroupByBranch." WHERE data.name = mapping.device_name GROUP BY date, branch ORDER BY date,branch;";
    //		echo $queryStr."<br><br><br>";

            $db->query($queryStr);
            while($row = $db->fetch_array())
            {
                $resultsGroupByBranch[$row['branch']][] = array(
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
    $return['groupByDistResults'] = $resultsGroupByDist;
    $return['groupByBranchResults'] = $resultsGroupByBranch;
    $return['start_time'] = $start_date;
    $return['end_time'] = $end_date;
    $json = json_encode($return);
    echo $json;

//     $now = new DateTime(null,new DateTimeZone('Asia/Taipei'));
//     echo "<br>-----------<br>".$now->format('Y-m-d H:i:s')."<br>-----------<br>";

?>