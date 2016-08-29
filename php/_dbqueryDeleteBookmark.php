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
    //$index = '["1"]';
    $username = $_GET['user'];
    $index = $_GET['index'];
    
    $index_array = json_decode($index,true);
    $sql="SELECT bookmarkStr FROM \"".$tablename."\" WHERE username = '".$username."';";

    $db->query($sql);
    $row = $db->fetch_array();
    $bookmarkStr = $row['bookmarkStr'];
    $bookmarkObj = json_decode($bookmarkStr);
    $bookmarkObj_new =array();
	$newindex=0;
    foreach($bookmarkObj as $value){
        if(!in_array($value->index,$index_array)){
			$value->index=$newindex;
            $bookmarkObj_new[]=$value;
            $newindex++;
        }
    }
    
    $bookmarksJson = json_encode($bookmarkObj_new);
    //$bookmarksJson = mysql_real_escape_string($bookmarksJson);
    
    $query="update ".$tablename." set bookmarkStr = '".$bookmarksJson."'
            where username = '".$username."';";
    $db->query($query);
    $db->close_db();
    
    echo json_encode("done");
    
?>