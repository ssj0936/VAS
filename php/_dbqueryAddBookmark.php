    <?php
    ini_set("max_execution_time", 0);
    require_once("DBconfig.php");
    require_once("DBclass.php");
    $results = array();
    $tablename = "bookmark";
    $db = new DB();
    $db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB['dbnameBookmark']);
    
	$username = $_GET['user'];
    $title = $_GET['title'];
    $desc = $_GET['desc'];
    
    $devicesJsonstring = $_GET['stringifyObserveTarget'];
    $locJsonstring = $_GET['stringifyObserveLoc'];
    $specJsonString = $_GET['stringifyObserveSpec'];
    $firstMapTime = $_GET['firstMapTime'];
    $comparisonMapTime = $_GET['comparisonMapTime'];
    $activeMode = $_GET['activeMode'];
    $dataset = $_GET['dataset'];
//    $username = 'Developer';
//     $activeMode = 'region';
//     $firstMapTime = '{"from":"2013-9-8","to":"2016-5-5"}';
//     $comparisonMapTime = '{"from":"2013-9-8","to":"2016-5-5"}';
//	 $devicesJsonstring = '[{"model":"all","devices":"all","datatype":"model"}]';
//    $dataset = 'activation';
    // $locJsonstring = '["TWN"]';
//     $devicesJsonstring = '[{"model":"Z00A","devices":"ZE551ML","datatype":"devices"},{"model":"Z008_1","devices":"ZE550ML","datatype":"devices"}]';
//     $locJsonstring = '["TWN","THA"]';
//     $specJsonString = '{"cpu":["all"],"color":["all"],"rear_camera":["all"],"front_camera":["all"]}';
//     $title = "title";
//     $desc = "desc";


    $sql="SELECT * FROM \"".$tablename."\" WHERE username = '".$username."';";
	//echo $sql;
    $db->query_num($sql);
	$count = $db->get_num_rows();
    $row = $db->fetch_array();
    
	
    $bookmarks = array();
    $query="";
    //new user in DB
    if($count==0){
        $query="insert into ".$tablename."(username,bookmarkStr) values('".$username."','".updateBookmark($bookmarks,0)."');";
    }else{
        
        $bookmarks = json_decode($row['bookmarkStr'],true);
        //print_r(json_decode($row['bookmarkStr']));
        $newIndex = count($bookmarks);
        //echo '$newIndex:'.$newIndex."<br>";
        $query="update ".$tablename." set bookmarkStr = '".updateBookmark($bookmarks,$newIndex)."'
            where username = '".$username."';";
        //echo $query;
    }
    
    //echo $query;
    $db->query($query);
    echo json_encode("done");
    // $json = json_encode($results);
    // echo $json;

    function updateBookmark($bookmarks ,$index) {
        $bookmarks[$index]['index'] = $index;
        $bookmarks[$index]['title'] = $GLOBALS['title'];
        $bookmarks[$index]['desc'] = $GLOBALS['desc'];
        
        $bookmarks[$index]['devicesJson'] = $GLOBALS['devicesJsonstring'];
        $bookmarks[$index]['locJson'] = $GLOBALS['locJsonstring'];
        $bookmarks[$index]['specJson'] = $GLOBALS['specJsonString'];
        $bookmarks[$index]['firstMapTime'] = $GLOBALS['firstMapTime'];
        $bookmarks[$index]['comparisonMapTime'] = $GLOBALS['comparisonMapTime'];
        $bookmarks[$index]['activeMode'] = $GLOBALS['activeMode'];
        $bookmarks[$index]['dataset'] = $GLOBALS['dataset'];
//        echo $GLOBALS['specJsonString'];
        // echo "1:".$bookmarks[$index]['json_string'] ."<br>";
        // echo "2:".json_decode(json_encode($bookmarks[$index]['json_string']))."<br>";
        
        //$bookmarks[$index]['model'] = json_decode(json_encode($GLOBALS['model']),true);
        // $bookmarks[$index]['from'] = $GLOBALS['from'];
        // $bookmarks[$index]['to'] = $GLOBALS['to'];
        $bookmarksJson = json_encode($bookmarks);
        //$bookmarksJson = mysql_real_escape_string($bookmarksJson);
        //$bookmarksJson = $bookmarks;
        return $bookmarksJson;
    }
    
    
?>