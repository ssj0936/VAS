<?php
    ini_set('display_errors', 1); 
    error_reporting(E_ALL);
    ini_set("max_execution_time", 0);
    require_once("DBconfig.php");
    require_once("DBclass.php");

    $dataset = $_GET['dataset'];
    $startDate = $_GET['startTime'];
    $endDate = $_GET['endTime'];

    $tablename = $branchObjectIDMapping;
    $db = new DB();
    $db->connect_db($_DB['host'], $_DB['username'], $_DB['password']);

    $sql = "SELECT distinct(username) 
        FROM $logTable 
        WHERE date between '$startDate' and '$endDate'
        and dataset = '$dataset'";
    $db->query($sql);

    $userArray = array();
    while($row = $db->fetch_array()){
        $userArray[] = $row['username'];
    }

    $json = json_encode($userArray);
    echo $json;

?>