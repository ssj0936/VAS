<?php
    ini_set('display_errors', 1); 
    error_reporting(E_ALL);
    ini_set("max_execution_time", 0);
    require_once("DBconfig.php");
    require_once("DBclass.php");

    $tablename = "[asus_visual_overlay].[dbo].[asus_product_dealer]";
    $db = new DB();
    $db->connect_db($_DB['host'], $_DB['username'], $_DB['password']);

    $country = $_GET['country'];
    $country = json_decode($country,true);
    
    $countryString = implode("','",$country);

    $string["type"] = "FeatureCollection";
    $string["features"] = array();

    $result = array();
    $key = 0;
    $db->query("SELECT name,lat,lng FROM ".$tablename." where country in ('".$countryString."');");
    while ($row = $db->fetch_array()) {
       $string["features"][$key]["type"] = "Feature";
       $string["features"][$key]["properties"]['name'] = $row['name'];
       $string["features"][$key]["geometry"]['type'] = 'Point';
       $string["features"][$key]["geometry"]['type'] = 'Point';
       $string["features"][$key]["geometry"]['coordinates'][0] = $row['lng'];
       $string["features"][$key]["geometry"]['coordinates'][1] = $row['lat'];
       //$result[$key]['name'] = $row['name'];
       //$result[$key]['lng'] = $row['lng'];
       //$result[$key]['lat'] = $row['lat'];
       $key++;
    }

    $json = json_encode($string);
    echo $json;

?>