<?php
ini_set("max_execution_time", 0);
ini_set('memory_limit', '4095M');
require_once("DBconfig.php");
require_once("DBclass.php");
require_once("function.php");
$results = array();
$db = new DB();

//$start = new DateTime(null,new DateTimeZone('Asia/Taipei'));
//echo "<br>-----------<br>".$start->format('Y-m-d H:i:s')."<br>-----------<br>";

//$color = '["all"]';
//$cpu = '["all"]';
//$rearCamera = '["all"]';
//$frontCamera = '["all"]';
//$data = '[{"model":"ZENFONE","devices":"ZENFONE","product":"ZENFONE","datatype":"product"}]';
//$iso = '["TWN"]';
//$distBranch = '[{"dist":"ARSH","branch":"KARNATAKA"},{"dist":"ARSH","branch":"MUMBAI"},{"dist":"ARSH","branch":"RAJASTHAN"},{"dist":"ASIN-IN-C","branch":"MUMBAI"},{"dist":"ASIN-IN-C1","branch":"DELHI"},{"dist":"ASIN-IN-C1","branch":"KARNATAKA"},{"dist":"ASIN-IN-C1","branch":"MUMBAI"},{"dist":"ASIN-IN-C1","branch":"TAMIL_NADU"},{"dist":"ASIN-IN-C1","branch":"UP_UTTARANCHAL"}]';
//$onlineDist = '[]';
//$lifeZoneTime = '{"week":1,"time":1}';
//$permission = '{}';

$color = $_POST['color'];
$cpu = $_POST['cpu'];
$rearCamera = $_POST['rearCamera'];
$frontCamera = $_POST['frontCamera'];
$data = $_POST['data'];
$iso = $_POST['iso'];
$distBranch = $_POST['distBranch'];
$onlineDist = $_POST['onlineDist'];
$lifeZoneTime = $_POST['time'];
$permission = $_POST['permission'];

$lifeZoneTimeObj = json_decode($lifeZoneTime,true);
$dataObj = json_decode($data);

if(count($dataObj) != 0){
    $isoObj = json_decode($iso);
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

    $db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB['lifezone']['dbnameMarker_']);
    $str_in='';

    $sqlDeviceIn = getAllTargetPartNoSql($dataObj);

    $db->query($sqlDeviceIn);
    while($row = $db->fetch_array()){
        $str_in.="'".$row['product_id']."',";
    }
    $str_in = substr($str_in,0,-1);

    $deviceTable = $_DB['lifezone']['deviceTable'];
    $queryStr='';
    for($i=0;$i<count($isoObj);++$i){
        
        if(!$isFullPermission){
            $result = permissionCheck($isFullPermission,$permissionObj,$isoObj[$i]);
            if(!$result['queryable']) continue;
        }

        $tmpQueryStr="SELECT volume as count,lng,lat,week,time"
                    ." FROM "
                    .($isColorAll ? "" : "$colorMappingTable A2,")
                    .($isCpuAll ? "" : "$cpuMappingTable A3,")
                    .($isFrontCameraAll ? "" : "$frontCameraMappingTable A4,")
                    .($isRearCameraAll ? "" : "$rearCameraMappingTable A5,")
                    .(($isFullPermission || $result['isFullPermissionThisIso']) ? "" : "(SELECT distinct product_id,model_name FROM $productIDTable) product,")
                    ."$isoObj[$i] A1,"
                    ."$deviceTable device_model"

                    ." WHERE "
                    ." A1.mpp_numcode = device_model.mpp_numcode"
                    ." AND week = '".$lifeZoneTimeObj['week']."'"
                    ." AND time = '".$lifeZoneTimeObj['time']."'"
                    .($isAll?"":" AND device_model.pno IN(".$str_in.")")
                    .($isColorAll ? "" : " AND device_model.pno = A2.PART_NO AND A2.SPEC_DESC IN(".$color_in.")")
                    .($isCpuAll ? "" : " AND device_model.pno = A3.PART_NO AND A3.SPEC_DESC IN(".$cpu_in.")")
                    .($isFrontCameraAll ? "" : " AND device_model.pno = A4.PART_NO AND A4.SPEC_DESC IN(".$frontCamera_in.")")
                    .($isRearCameraAll ? "" : " AND device_model.pno = A5.PART_NO AND A5.SPEC_DESC IN(".$rearCamera_in.")")
                    .($isDistBranch ? " AND $distBranchStr " : "")
                    .($isOnlineDist ? " AND $onlineDistStr " : "")
                    .(($isFullPermission || $result['isFullPermissionThisIso']) ? "" : " AND device_model.model = product.model_name AND product.product_id IN (".$result['permissionProductIDStr'].")");

        if(strlen($queryStr)==0){
            $queryStr .= $tmpQueryStr;
        }
        else{
            $queryStr.=(" UNION ALL ".$tmpQueryStr);
        }
    }
    //echo $queryStr."<br>";

    //$queryStr = 'SELECT SUM(volume)as count,lng,lat,week,time FROM('.$queryStr.')foo GROUP BY lng,lat,week,time';

    $db->query($queryStr);
    $results[$lifeZoneTimeObj['week']][$lifeZoneTimeObj['time']] = array();
    while($row = $db->fetch_array())
    {
        $week = $row['week'];
        $time = $row['time'];
        $volume = $row['count'];
        $currentIndex = (isset($results[$week][$time])) ? count($results[$week][$time]) : 0;
        $results[$week][$time][$currentIndex]['lng'] = $row['lng'];
        $results[$week][$time][$currentIndex]['lat'] = $row['lat'];
        $results[$week][$time][$currentIndex]['count'] = $volume;
    }
}
else{
    $results[$lifeZoneTimeObj['week']][$lifeZoneTimeObj['time']] = array();
}
//print_r($results);
$json = json_encode($results);
echo $json;
//
//$end = new DateTime(null,new DateTimeZone('Asia/Taipei'));
//echo "<br>-----------<br>".$end->format('Y-m-d H:i:s')."<br>-----------<br>";
//
//$interval = $start->diff($end);
//echo $interval->format('%Y-%m-%d %H:%i:%s');
?>