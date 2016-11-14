<?php
    ini_set('display_errors', 1); 
    error_reporting(E_ALL);
    ini_set("max_execution_time", 0);
    require_once("DBconfig.php");
    require_once("DBclass.php");

    $tablename = $branchObjectIDMapping;
    $db = new DB();
    $db->connect_db($_DB['host'], $_DB['username'], $_DB['password']);

    $branchName = $_GET['branchName'];
    $iso = $_GET['iso'];

    $isoObj = json_decode($iso);

    $result = array();
    if($branchName != '[]') {
        $branchName = json_decode($branchName,true);
        $branchString = implode("','",$branchName);

        $db->query(
            "SELECT Loc_BranchName,object_id"
            ." FROM $tablename"
            .(($branchString == 'all') ? "" : " where Loc_BranchName in ('".$branchString."')")
            ." WHERE iso = '$isoObj[0]';"
        );
        $objectUnion = array();
        while ($row = $db->fetch_array()) {
            $tmp = json_decode($row['object_id'],true);
            $branchName = strtoupper($row['Loc_BranchName']);
            $result[$branchName] = $tmp;
            $objectUnion = array_unique(array_merge($objectUnion,$tmp));
        }
        foreach($objectUnion as $value) {
            $result['union'][] = $value;
        }

    }
    $json = json_encode($result);
    echo $json;

?>