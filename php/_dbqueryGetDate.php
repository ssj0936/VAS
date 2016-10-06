
<!--IT's NO USE CURRENTLY-->

<?php


    ini_set("max_execution_time", 0);

    require_once("DBconfig.php");
    require_once("DBclass.php");

//    $now = new DateTime(null,new DateTimeZone('Asia/Taipei'));
//    echo "<br>-----------<br>".$now->format('Y-m-d H:i:s')."<br>-----------<br>";

    $results=array();
    $minDate='';
    $maxDate='';
    
    $db = new DB();
    $db->connect_db($_DB['host'], $_DB['username'], $_DB['password']);
    
//    $data='[{"model":"K01Q","devices":"FE375CL","datatype":"devices"},{"model":"K00Z","devices":"ME175CG","datatype":"devices"}]';
//    $data='[{"model":"all","devices":"all","datatype":"model"}';
//    $dataset = 'activation';
    $data = $_GET['data'];
    $dataset = $_GET['dataset'];
    //$db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB[$dataset]['dbnameRegionL1']);
    
    $tablearray=array();
    $db->query("SELECT TABLE_NAME FROM ".$_DB[$dataset]['dbnameRegionL1'].".INFORMATION_SCHEMA.TABLES");
    while($row = $db->fetch_array()){
        $tablearray[]=$row['TABLE_NAME'];
    }

    $str_in='';
    $dataObj = json_decode($data);
    for($i=0;$i<count($dataObj);++$i){
        $model = $dataObj[$i]->model;
        $devices = $dataObj[$i]->devices;
        $datatype = $dataObj[$i]->datatype;

        if($datatype == "model"){
            $db->query("SELECT device_name FROM $deviceTable ".(($devices=="all")?(""):("WHERE model_name='".$model."'")));
            while($row = $db->fetch_array()){
                $str_in.="'".$row['device_name']."'";
                $str_in.=',';
            }
        }else if($datatype == "devices"){
            $str_in.="'".$model."'";
            $str_in.=',';
        }
    }
    $str_in = substr($str_in,0,-1);
    /*
    $fromTableStr='(';
    for($i=0;$i<count($tablearray);++$i){
        $fromTableStr.="SELECT MAX(date)as max , MIN(date)as min FROM ".sqlsrvfyTableName($tablearray[$i])." WHERE model IN(".$str_in.")";
        
        if($i != count($tablearray)-1)
            $fromTableStr .= " UNION ALL ";
    }
    $fromTableStr .=')foo';
    $query ="SELECT MAX(max)as all_max , MIN(min)as all_min FROM ".$fromTableStr.";";
    */
    $query ="SELECT MAX(end_date)as all_max , MIN(start_date)as all_min FROM ".$_DB[$dataset]['deviceTable']." WHERE device_name IN(".$str_in.");";
    //echo $query;
    $db->query($query);
    $row = $db->fetch_array();
    //print_r($row);
    $minDate=$row['all_min'];
    $maxDate=$row['all_max'];

    if($minDate!='' && $maxDate!=''){
        $results['minDate']=$minDate;
        $results['maxDate']=$maxDate;
    }
	
    $db->close_db();
    $json = json_encode($results);
    echo $json;
	
//     $now_ = new DateTime(null,new DateTimeZone('Asia/Taipei'));
//     echo "<br>-----------<br>".$now_->format('Y-m-d H:i:s')."<br>-----------<br>";
	
?>