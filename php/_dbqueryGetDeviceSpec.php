<?php
    ini_set('display_errors', 1); 
    error_reporting(E_ALL);
    ini_set("max_execution_time", 0);
    require_once("DBconfig.php");
    require_once("DBclass.php");
    require_once("function.php");

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
        $str_in='';
        $deviceName = json_decode($deviceName,true);
        $sqlDeviceIn = getDevicenameToPartNoSql($deviceName);

        $db->query($sqlDeviceIn);
        while($row = $db->fetch_array()){
            $str_in.="'".$row['part_no']."',";
        }
        $str_in = substr($str_in,0,-1);
        $deviceString = implode("','",$deviceName);

        $result = array();
        for ($i = 0; $i < count($tablename); $i++) {
            $queryStr = "SELECT distinct SPEC_DESC"
                        ." FROM [asus_spec_mapping].[dbo].[product_".$tablename[$i]."_mapping_".getCurrentDb('activation')."]"
                        ." where PART_NO in (".$str_in.")"
                        ."ORDER BY SPEC_DESC ;";

            $db->query($queryStr);
            $specUnion = array();
            while ($row = $db->fetch_array()) {
                $tmp = array($row['SPEC_DESC']);
                $specUnion = array_unique(array_merge($specUnion,$tmp));
            }
            foreach($specUnion as $value) {
                $result[$tablename[$i]][] = $value;
            }
            if (empty($result[$tablename[$i]])) {
                $result[$tablename[$i]]= array();
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