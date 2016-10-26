<?php
	ini_set('display_errors', 1); 
	error_reporting(E_ALL);


    ini_set("max_execution_time", 0);
	//echo "123";
    require_once("DBconfig.php");
    require_once("DBclass.php");

    $tablenameLoc = $countryDataOnMap;
    $tablenameProduct="product_list";
	$tablenameDealerCountry="dealer_country";
    $db = new DB();
    $db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB['dbnameService']);
    
    $allDevices=array();
  
    $currentSeries = '';
    $currentProduct = '';
    $currentSeriesDevices = array();
    $db->query("SELECT PRODUCT product,model_name,device_name "
                ."FROM ".$deviceTable." A1,".$productNameModelMapping." A2 "
                ."where A1.model_name = A2.MODEL "
                ."ORDER BY PRODUCT,model_name,device_name;");

    while($row = $db->fetch_array()){
        if($currentProduct=='' || $currentProduct != $row['product']){
            $currentProduct = $row['product'];
            $allDevices[$currentProduct] = array();
        }
        
        if($currentSeries=='' || $currentSeries != $row['model_name']){
            $currentSeries = $row['model_name'];
            $allDevices[$currentProduct][$currentSeries]=array();
        }
        $allDevices[$currentProduct][$currentSeries][] = $row['device_name'];
    }

    $allLoc=array();
    $db->query("SELECT DISTINCT * FROM ".$tablenameLoc." ORDER BY Terrority,NAME_0;");
    while($row = $db->fetch_array()){
        $countryName = $row['NAME_0'];
        $terrority = $row['Terrority'];
        $allLoc[$terrority][$countryName][] = $row['iso'];
    }
    
    //overview

    //1. today login user and count
    $date = date('Y-m-d', time());
//    echo $date;
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
    $observationModelFinal = array();
    foreach($observationModel as $key=>$val){
        $observationModelFinal[] = ["displayName" => $key,"count" => $val];
    }
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

    $observationCountry['_All'] = 0;
    $observationCpu['_All'] = 0;
    $observationColor['_All'] = 0;
    $observationRearCamera['_All'] = 0;
    $observationFrontCamera['_All'] = 0;
    while($row = $db->fetch_array()){
        $count = $row['count'];
        $line = $row['filter_content'];
        $obj = json_decode($line);
    //    print_r(json_decode($line));

        //country
        $cnt = 0;
        foreach($obj->observeLoc as $val){
            $observationCountry['_All'] += $count;
            if(isset($observationCountry[$val]))
                $observationCountry[$val] += $count;
            else
                $observationCountry[$val] = $count;
        }

        //Color
        foreach($obj->observeSpec->color as $val){
            $observationColor['_All'] += $count;
            if(isset($observationColor[$val]))
                $observationColor[$val] += $count;
            else
                $observationColor[$val] = $count;
        }

        //Cpu
        foreach($obj->observeSpec->cpu as $val){
            $observationCpu['_All'] += $count;
            if(isset($observationCpu[$val]))
                $observationCpu[$val] += $count;
            else
                $observationCpu[$val] = $count;
        }

        //rear_camera
        foreach($obj->observeSpec->rear_camera as $val){
            $observationRearCamera['_All'] += $count;
            if(isset($observationRearCamera[$val]))
                $observationRearCamera[$val] += $count;
            else
                $observationRearCamera[$val] = $count;
        }

        //front_camera
        foreach($obj->observeSpec->front_camera as $val){
            $observationFrontCamera['_All'] += $count;
            if(isset($observationFrontCamera[$val]))
                $observationFrontCamera[$val] += $count;
            else
                $observationFrontCamera[$val] = $count;
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
    $sql = "SELECT count(*)count FROM $logTable";
    $db->query($sql);

    $allCount;
    while($row = $db->fetch_array()){
        $allCount = $row['count'];
    }

    //6.dau
    $dau = array();
    $sql = "SELECT count(distinct username) count,date
        FROM $logTable
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
    
    
    $result['allDevices']=$allDevices;
    $result['allLoc']=$allLoc;
    $result['activationUpdateTime']=$_DB['activation']['updatetime'];
    $result['lifezoneUpdateTime']=$_DB['lifezone']['updatetime'];

    $json = json_encode($result);
    echo $json;

?>