    <?php
    ini_set("max_execution_time", 0);
    ini_set('memory_limit', '3500M');
    require_once("DBconfig.php");
    require_once("DBclass.php");
    require_once("function.php");
    $results = array();
    $db = new DB();

//     $start = new DateTime(null,new DateTimeZone('Asia/Taipei'));
//     echo "<br>-----------<br>".$start->format('Y-m-d H:i:s')."<br>-----------<br>";
//    $from = "2016-10-31";
//    $to = "2016-11-30";    
//    $iso ='["IND"]';
//    $dataset = 'activation';
//    $data = '[{"model":"ZENFONE","devices":"ZENFONE","product":"ZENFONE","datatype":"product"}]';
//    $color = '["all"]';
//    $cpu = '["all"]';
//    $rearCamera = '["all"]';
//    $frontCamera = '["all"]';
//    $distBranch = '[{"dist":"KARNATAKA","branch":"FLIPKART"}]';
//    $distBranch = '[]';
//    $onlineDist = '[]';
//    $permission = '{"":["AK","AT","AZ"],"HKG":["AK","AT","AX","AZ"],"IND":["AK","AT","AX","AZ"],"IDN":["AK","AT","AX","AZ"],"JPN":["AK","AT","AX","AZ"],"MYS":["AK","AT","AX","AZ"],"PHL":["AK","AT","AX","AZ"],"SGP":["AK","AT","AX","AZ"],"THA":["AK","AT","AX","AZ"],"VNM":["AK","AT","AX","AZ"],"BGD":["AK","AT","AX","AZ"],"MMR":["AK","AT","AX","AZ"],"KOR":["AK","AT","AX","AZ"],"KHM":["AK","AT","AX","AZ"]}';
//    $permission = '{}';

    $dataset = $_POST['dataset'];
    $from = $_POST['from'];
    $to = $_POST['to'];
    $data = $_POST['data'];
    $iso = $_POST['iso'];
    $distBranch = $_POST['distBranch'];
    $onlineDist = $_POST['onlineDist'];
    $color = $_POST['color'];
    $cpu = $_POST['cpu'];
    $rearCamera = $_POST['rearCamera'];
    $frontCamera = $_POST['frontCamera'];
    $permission = $_POST['permission'];

    $db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB[$dataset]['dbnameMarker_']);
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
    
        $str_in='';
        
        $sqlDeviceIn = getAllTargetDeviceSql($dataObj);
        
        $db->query($sqlDeviceIn);
        while($row = $db->fetch_array()){
            $str_in.="'".$row['device_name']."',";
        }
        $str_in = substr($str_in,0,-1);
        
        $queryStr='';
        for($i=0;$i<count($isoObj);++$i){
            $iso = $isoObj[$i];
            
            if(!$isFullPermission){
                $result = permissionCheck($isFullPermission,$permissionObj,$isoObj[$i]);
                if(!$result['queryable']) continue;
            }
            
            $tmpQueryStr="SELECT count,lng,lat"
                        ." FROM "
                        .($isColorAll ? "" : "$colorMappingTable A2,")
                        .($isCpuAll ? "" : "$cpuMappingTable A3,")
                        .($isFrontCameraAll ? "" : "$frontCameraMappingTable A4,")
                        .($isRearCameraAll ? "" : "$rearCameraMappingTable A5,")
                        .(($isFullPermission || $result['isFullPermissionThisIso']) ? "" : "(SELECT distinct product_id,model_name FROM $productIDTable) product,")
                        .strtolower($iso)." A1,"
                        ."$deviceTable device_model"

                        ." WHERE "
                        ."date BETWEEN '".$from."' AND '".$to."'"
                        ." AND A1.device = device_model.device_name"
                        .($isAll?"":" AND device IN(".$str_in.")")
                        .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN(".$color_in.")")
                        .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN(".$cpu_in.")")
                        .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN(".$frontCamera_in.")")
                        .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN(".$rearCamera_in.")")
                        .($isDistBranch ? " AND $distBranchStr " : "")
                        .($isOnlineDist ? " AND $onlineDistStr " : "")
                        .(($isFullPermission || $result['isFullPermissionThisIso']) ? "" : " AND device_model.model_name = product.model_name AND product.product_id IN (".$result['permissionProductIDStr'].")");

            if(strlen($queryStr)==0){
                $queryStr .= $tmpQueryStr;
            }
            else{
                $queryStr.=(" UNION ALL ".$tmpQueryStr);
            }
        }

		$sql = 'SELECT SUM(count)as count,lng,lat FROM('.$queryStr.')foo GROUP BY lng,lat';
//echo $sql."<br><br>";
        $cnt=0;
        $db->query($sql);
        while($row = $db->fetch_array())
        {
            $results[] = array(
                'cnt' => ($row['count']),
                'lng' => ($row['lng']),
                'lat' => ($row['lat']),
            );
            $cnt+=$row['count'];
        }
    }
    $json = json_encode($results);
    echo $json;

//     $end = new DateTime(null,new DateTimeZone('Asia/Taipei'));
//     echo "<br>-----------<br>".$end->format('Y-m-d H:i:s')."<br>-----------<br>";
//
//    $interval = $start->diff($end);
//    echo $interval->format('%Y-%m-%d %H:%i:%s');

?>