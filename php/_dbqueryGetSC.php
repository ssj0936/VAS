<?php
    ini_set('display_errors', 1); 
    error_reporting(E_ALL);
    ini_set("max_execution_time", 0);
    require_once("DBconfig.php");
    require_once("DBclass.php");

    $tablename = "[asus_visual_overlay].[dbo].[asus_product_service]";
    $db = new DB();
    $db->connect_db($_DB['host'], $_DB['username'], $_DB['password']);

    $country = $_GET['country'];
    $country = json_decode($country,true);
    $products = $_GET['products'];
    $products = json_decode($products,true);
    
    $countryString = implode("','",$country);

    $productStr = '';
    for ($i = 0; $i < count($products); $i++) {
        $productStr .= "products LIKE '%" . $products[$i] . "%'";
        if ($i != count($products) - 1)
           $productStr .= " OR ";
    }

    $string["type"] = "FeatureCollection";
    $string["features"] = array();

    $result = array();
    $key = 0;
    $db->query("SELECT SC_NAME,GPS_Lat,GPS_Lng,PRODUCTS FROM ".$tablename." where country in ('".$countryString."') AND (".$productStr.");");
    while ($row = $db->fetch_array()) {
       $string["features"][$key]["type"] = "Feature";
       $string["features"][$key]["properties"]['name'] = $row['SC_NAME'];
       $string["features"][$key]["properties"]['products'] = $row['PRODUCTS'];
       $string["features"][$key]["geometry"]['type'] = 'Point';
       $string["features"][$key]["geometry"]['coordinates'][0] = $row['GPS_Lng'];
       $string["features"][$key]["geometry"]['coordinates'][1] = $row['GPS_Lat'];
       $key++;
    }

    $json = json_encode($string);
    echo $json;

?>