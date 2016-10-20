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
    
    
    
    $result['allDevices']=$allDevices;
    $result['allLoc']=$allLoc;
    $result['activationUpdateTime']=$_DB['activation']['updatetime'];
    $result['lifezoneUpdateTime']=$_DB['lifezone']['updatetime'];

    $json = json_encode($result);
    echo $json;

?>