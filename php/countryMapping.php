<?php
    ini_set("max_execution_time", 0);

    require_once("DBconfig.php");
    require_once("DBclass.php");

    $file = file("../world_country_sorted.js");

    $table = Array();
    $cnt=0;
    for($i=0;$i<count($file);++$i){
        $str = substr($file[$i],0,2000);
        if(preg_match('/"NAME":"(.+?)".*"ISO_A2":"(.+?)".*"ISO_A3":"(.+?)"/',$str,$match)){
            //print_r($match);
            $table[$cnt]['name']=$match[1];
            $table[$cnt]['isoa2']=$match[2];
            $table[$cnt]['isoa3']=$match[3];
            ++$cnt;
//            $str = substr($file[$i],0,-1);
//            $str = str_replace("\r",'',$str);
//            $str = str_replace("\n",'',$str);
//            $obj = json_decode($str);
//            var_dump($obj);
//            echo $file[$i];
        }
    }

    foreach($table as $value){
        echo $value['name']."/".$value['isoa2']."/".$value['isoa3']."<br>";
    }
?>