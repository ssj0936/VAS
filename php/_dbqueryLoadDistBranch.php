<?php
    ini_set("max_execution_time", 0);

    require_once("DBconfig.php");
    require_once("DBclass.php");
    require_once("function.php");
    $results = array();
    $db = new DB();
    $db->connect_db($_DB['host'], $_DB['username'], $_DB['password']);

    $sql = "SELECT * FROM $distBranchMapping ORDER BY distributor_id";
    $db->query($sql);
    while($row = $db->fetch_array()){
        $result = array();
        $result['dist'] = $row['distributor_id'];
        $result['branch'] = $row['branchname'];
        
        $results[] = $result;
    }

    $json = json_encode($results);
    echo $json;
?>