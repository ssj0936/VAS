<?php
    ini_set('display_errors', 1); 
    error_reporting(E_ALL);
    ini_set("max_execution_time", 0);
    require_once("DBconfig.php");
    require_once("DBclass.php");

    $tablename = array(
            "cpu",
            "front_camera",
            "rear_camera",
            "color",
            );
    $db = new DB();
    $db->connect_db($_DB['host'], $_DB['username'], $_DB['password']);

    $deviceName =$_GET['device_name'];
    if($deviceName != '[]') {
        $deviceName = json_decode($deviceName,true);
        $deviceString = implode("','",$deviceName);

        $result = array();
        for ($i = 0; $i < count($tablename); $i++) {
            $db->query(
                "SELECT SPEC_DESC"
                ." FROM [asus_spec_mapping].[dbo].[device_".$tablename[$i]."_mapping_".getCurrentDb('activation')."]"
                ." where device_name in ('".$deviceString."')"
                ."ORDER BY SPEC_DESC ;"
            );
            $specUnion = array();
            while ($row = $db->fetch_array()) {
                $tmp = json_decode($row['SPEC_DESC'],true);
                $specUnion = array_unique(array_merge($specUnion,$tmp));
            }
            foreach($specUnion as $value) {
                $result[$tablename[$i]][] = $value;
            }
        }
    } else {
        for ($i = 0; $i < count($tablename); $i++) {
                $result[$tablename[$i]]=array();
        }
    }

    $json = json_encode($result);
    echo $json;

?>