<?php
ini_set("max_execution_time", 0);
ini_set('memory_limit', '4095M');
require_once("DBconfig.php");
require_once("DBclass.php");
require_once("function.php");
$results = array();
$db = new DB();
$db->connect_db($_DB['host'], $_DB['username'], $_DB['password']);
//overview
$dataset = $_GET['dataset'];
//$dataset = 'activation';

    //1. today login user and count
    $date = date('Y-m-d', time());
//    echo $date;
    $sql = "SELECT distinct username FROM $logTable WHERE date = '$date' AND dataset = '$dataset'";
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
      WHERE dataset = '$dataset'
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
      WHERE dataset = '$dataset'
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
      WHERE dataset = '$dataset'
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
    $observationModelFinal = array();
    foreach($observationModel as $key=>$val){
        $observationModelFinal[] = ["displayName" => $key,"count" => $val];
    }
    //4. observation target - country/rare-camera/front-camera/cpu/color
    $sql = "SELECT count(filter_content)count,filter_content
      FROM $logTable
      WHERE dataset = '$dataset'
      group by filter_content";

//echo $sql;
    $db->query($sql);

    $observationCountry = array();
    $observationCpu = array();
    $observationColor = array();
    $observationRearCamera = array();
    $observationFrontCamera = array();

    $observationCountry['_All'] = 0;
    $observationCpu['_All'] = 0;
    $observationColor['_All'] = 0;
    $observationRearCamera['_All'] = 0;
    $observationFrontCamera['_All'] = 0;
    while($row = $db->fetch_array()){
        $count = $row['count'];
        $line = $row['filter_content'];
        $obj = json_decode($line);
//        print_r(json_decode($line));

        //country
        $cnt = 0;
        if(isset($obj->observeLoc)){
            foreach($obj->observeLoc as $val){
                $observationCountry['_All'] += $count;
                if(isset($observationCountry[$val]))
                    $observationCountry[$val] += $count;
                else
                    $observationCountry[$val] = $count;
            }
        }

        //Color
        if(isset($obj->observeSpec->color)){
            foreach($obj->observeSpec->color as $val){
                $observationColor['_All'] += $count;
                if(isset($observationColor[$val]))
                    $observationColor[$val] += $count;
                else
                    $observationColor[$val] = $count;
            }
        }

        //Cpu
        if(isset($obj->observeSpec->cpu)){
            foreach($obj->observeSpec->cpu as $val){
                $observationCpu['_All'] += $count;
                if(isset($observationCpu[$val]))
                    $observationCpu[$val] += $count;
                else
                    $observationCpu[$val] = $count;
            }
        }

        //rear_camera
        if(isset($obj->observeSpec->rear_camera)){
            foreach($obj->observeSpec->rear_camera as $val){
                $observationRearCamera['_All'] += $count;
                if(isset($observationRearCamera[$val]))
                    $observationRearCamera[$val] += $count;
                else
                    $observationRearCamera[$val] = $count;
            }
        }

        //front_camera
        if(isset($obj->observeSpec->front_camera)){
            foreach($obj->observeSpec->front_camera as $val){
                $observationFrontCamera['_All'] += $count;
                if(isset($observationFrontCamera[$val]))
                    $observationFrontCamera[$val] += $count;
                else
                    $observationFrontCamera[$val] = $count;
            }
        }
    }
    arsort($observationCountry);
    $observationCountryFinal = array();
    foreach($observationCountry as $key=>$val){
        $observationCountryFinal[] = ["displayName" => $key,"count" => $val];
    }
    
    arsort($observationColor);
    $observationColorFinal = array();
    foreach($observationColor as $key=>$val){
        $observationColorFinal[] = ["displayName" => $key,"count" => $val];
    }

    arsort($observationCpu);
    $observationCpuFinal = array();
    foreach($observationCpu as $key=>$val){
        $observationCpuFinal[] = ["displayName" => $key,"count" => $val];
    }

    arsort($observationRearCamera);
    $observationRearCameraFinal = array();
    foreach($observationRearCamera as $key=>$val){
        $observationRearCameraFinal[] = ["displayName" => $key,"count" => $val];
    }

    arsort($observationFrontCamera);
    $observationFrontCameraFinal = array();
    foreach($observationFrontCamera as $key=>$val){
        $observationFrontCameraFinal[] = ["displayName" => $key,"count" => $val];
    }
    
    //5.allCount
    $sql = "SELECT count(*)count FROM $logTable WHERE dataset = '$dataset'";
    $db->query($sql);

    $allCount;
    while($row = $db->fetch_array()){
        $allCount = $row['count'];
    }

    //6.dau
    $dau = array();
    $sql = "SELECT count(distinct username) count,date
        FROM $logTable
        WHERE dataset = '$dataset'
        group by date
        order by date";
    $db->query($sql);

    while($row = $db->fetch_array()){
        $dau[] = ["date" => $row['date'],"count" => $row['count']];
    }
 


    //data process
    $result['todayUserCount'] = $todayUserCount;
    $result['todayUserArray'] = $todayUserArray;
    $result['topTenUserArray'] = $topTenUserArray;
    $result['usercountEachDay'] = $usercountEachDay;
    $result['observationModel'] = $observationModelFinal;

    $result['observationCountry'] = $observationCountryFinal;
    $result['observationColor'] = $observationColorFinal;
    $result['observationCpu'] = $observationCpuFinal;
    $result['observationRearCamera'] = $observationRearCameraFinal;
    $result['observationFrontCamera'] = $observationFrontCameraFinal;
    $result['allUserCount'] = $allUserCount;
    $result['allCount'] = $allCount;
    $result['dau'] = $dau;

echo json_encode($result);
?>