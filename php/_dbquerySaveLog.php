<?php
    ini_set("max_execution_time", 0);
    require_once("DBconfig.php");
    require_once("DBclass.php");
    $results = array();
    $db = new DB();
    $db->connect_db($_DB['host'], $_DB['username'], $_DB['password']);
    

//    $date = 'Tue Sep 13 2016 11:11:36';
//    $username = 'Developer';
//    $filter_device = '[ZENFONE][T550KLC][ZB452KG][ZB551KL][ZC520TL][ASUS_Z010_CD]';
//	$filter_country = '[TWN]';
//    $filter_date = '[2016-8-14][2016-9-13]';
//    $filter_content = '{"observeTarget":[{"model":"ZENFONE","devices":"ZENFONE","product":"ZENFONE","datatype":"product"},{"model":"T550KLC","devices":"T550KLC","product":"ZENFONE-D","datatype":"model"},{"model":"ZB452KG","devices":"ZB452KG","product":"ZENFONE-D","datatype":"model"},{"model":"ZB551KL","devices":"ZB551KL","product":"ZENFONE-D","datatype":"model"},{"model":"ZC520TL","devices":"ZC520TL","product":"ZENFONE-D","datatype":"model"},{"model":"ZC550KL","devices":"ASUS_Z010_CD","product":"ZENFONE-D","datatype":"devices"}],"observeLoc":["TWN"],"observeSpec":{"cpu":["all"],"color":["all"],"rear_camera":["all"],"front_camera":["all"]}}';

    $date = $_POST['date'];
    $username = $_POST['username'];
	$filter_device = $_POST['filter_device'];
    $filter_model = $_POST['filter_model'];
    $filter_country = $_POST['filter_country'];
    $filter_date = $_POST['filter_date'];
    $filter_content = $_POST['filter_content'];
    $dataset = $_POST['dataset'];

    $query="insert into ".$logTable
        ."(date, username, filter_device, filter_model, filter_country, filter_date, filter_content, dataset) "
        ."values('$date', '$username', '$filter_device', '$filter_model', '$filter_country', '$filter_date', '$filter_content', '$dataset');";
    echo $query;
    $db->query($query);
    echo json_encode("done");

?>