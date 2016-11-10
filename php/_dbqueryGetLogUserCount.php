<?php
	ini_set('display_errors', 1); 
	error_reporting(E_ALL);


    ini_set("max_execution_time", 0);
	//echo "123";
    require_once("DBconfig.php");
    require_once("DBclass.php");
//    $start = '2016-9-30';
//    $end = '2016-10-2';
    $start = $_GET['start'];
    $end = $_GET['end'];
    $dataset = $_GET['dataset'];

    $db = new DB();
    $db->connect_db($_DB['host'], $_DB['username'], $_DB['password']);

    $dau = array();
    $sql = "SELECT count(distinct username) count,date
        FROM $logTable
        WHERE date BETWEEN '$start' and '$end'
        AND dataset = '$dataset'
        group by date
        order by date";
//echo $sql;
    $db->query($sql);

    while($row = $db->fetch_array()){
        $dau[] = ["date" => $row['date'],"count" => $row['count']];
    }

    $result = array();
    $result['dau'] = $dau;
    $json = json_encode($result);
    echo $json;
?>