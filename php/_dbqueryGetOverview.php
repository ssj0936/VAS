<?php
ini_set("max_execution_time", 0);
ini_set('memory_limit', '4095M');
require_once("DBconfig.php");
require_once("DBclass.php");
require_once("function.php");
$results = array();
$db = new DB();
$db->connect_db($_DB['host'], $_DB['username'], $_DB['password']);

//1. today login user and count
$date = date('Y-m-d', time());
echo $date;
$sql = "SELECT distinct username FROM $logTable WHERE date = '$date'";
$db->query($sql);

$todayUserCount = 0;
$todayUserArray = array();
while($row = $db->fetch_array()){
    $todayUserArray[] = $row['username'];
    ++$todayUserCount;
}

//2. most active user top 10
$sql = "SELECT count(username)count,username
  FROM $logTable
  group by username
  order by count Desc";
$db->query($sql);

$allUserCount = 0;
$topTenUserArray = array();
while($row = $db->fetch_array()){
    if($allUserCount<10)
        $topTenUserArray[] = ["username" => $row['username'],"count" => $row['count']];

    $allUserCount++;
}

//3. user count everyday
$sql = "SELECT count(date)count,date
  FROM $logTable
  group by date
  order by date";
$db->query($sql);

$usercountEachDay = array();
while($row = $db->fetch_array()){
    $usercountEachDay[] = ["date" => $row['date'],"count" => $row['count']];
}

//4. observation target - model
$sql = "SELECT count(filter_model)count,filter_model
  FROM $logTable
  group by filter_model";
$db->query($sql);

$observationModel = array();
while($row = $db->fetch_array()){
    $count = $row['count'];
    $line = $row['filter_model'];
    preg_match_all('/\[(.*?)\]/',$line,$match);
    
    foreach($match[1] as $val){
        if(isset($observationModel[$val]))
            $observationModel[$val] += $count;
        else
            $observationModel[$val] = $count;
    }
}
arsort($observationModel);

//4. observation target - country/rare-camera/front-camera/cpu/color
$sql = "SELECT count(filter_content)count,filter_content
  FROM $logTable
  group by filter_content";
$db->query($sql);

$observationCountry = array();
$observationCpu = array();
$observationColor = array();
$observationRearCamera = array();
$observationFrontCamera = array();

$observationCountry['All'] = 0;
$observationCpu['All'] = 0;
$observationColor['All'] = 0;
$observationRearCamera['All'] = 0;
$observationFrontCamera['All'] = 0;
while($row = $db->fetch_array()){
    $count = $row['count'];
    $line = $row['filter_content'];
    $obj = json_decode($line);
//    print_r(json_decode($line));
    
    //country
    $cnt = 0;
    foreach($obj->observeLoc as $val){
        $observationCountry['All'] += $count;
        if(isset($observationCountry[$val]))
            $observationCountry[$val] += $count;
        else
            $observationCountry[$val] = $count;
    }
    
    //Color
    foreach($obj->observeSpec->color as $val){
        $observationColor['All'] += $count;
        if(isset($observationColor[$val]))
            $observationColor[$val] += $count;
        else
            $observationColor[$val] = $count;
    }
    
    //Cpu
    foreach($obj->observeSpec->cpu as $val){
        $observationCpu['All'] += $count;
        if(isset($observationCpu[$val]))
            $observationCpu[$val] += $count;
        else
            $observationCpu[$val] = $count;
    }
    
    //rear_camera
    foreach($obj->observeSpec->rear_camera as $val){
        $observationRearCamera['All'] += $count;
        if(isset($observationRearCamera[$val]))
            $observationRearCamera[$val] += $count;
        else
            $observationRearCamera[$val] = $count;
    }
    
    //front_camera
    foreach($obj->observeSpec->front_camera as $val){
        $observationFrontCamera['All'] += $count;
        if(isset($observationFrontCamera[$val]))
            $observationFrontCamera[$val] += $count;
        else
            $observationFrontCamera[$val] = $count;
    }
}
arsort($observationCountry);
arsort($observationColor);
arsort($observationCpu);
arsort($observationRearCamera);
arsort($observationFrontCamera);
  
//5.allCount
$sql = "SELECT count(*)count FROM $logTable";
$db->query($sql);

$allCount;
while($row = $db->fetch_array()){
    $allCount = $row['count'];
}

//data process
$result['todayUserCount'] = $todayUserCount;
$result['todayUserArray'] = $todayUserArray;
$result['topTenUserArray'] = $topTenUserArray;
$result['usercountEachDay'] = $usercountEachDay;
$result['observationModel'] = $observationModel;

$result['observationCountry'] = $observationCountry;
$result['observationColor'] = $observationColor;
$result['observationCpu'] = $observationCpu;
$result['observationRearCamera'] = $observationRearCamera;
$result['observationFrontCamera'] = $observationFrontCamera;
$result['allUserCount'] = $allUserCount;
$result['allCount'] = $allCount;

echo json_encode($result);
?>