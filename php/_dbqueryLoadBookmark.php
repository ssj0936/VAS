<?php
//----------------------------
    ini_set("max_execution_time", 0);
    
    require_once("DBconfig.php");
    require_once("DBclass.php");
    $results = array();
    $tablename = "bookmark";
    $db = new DB();
    $db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB['dbnameBookmark']);
//----------------------------
    $username = $_GET['user'];
//    $username = 'Developer';
    $sql="SELECT bookmarkStr FROM \"".$tablename."\" WHERE username = '".$username."';";

    $db->query($sql);
    $row = $db->fetch_array();
    
    $db->close_db();
    
    echo ($row['bookmarkStr']);
    
?>