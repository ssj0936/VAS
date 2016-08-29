<?php
set_time_limit(0);
ini_set('memory_limit', '2G'); // or you could use 1G

require_once("DBconfig.php");
require_once("DBclass.php");

$db = new DB();
$db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB['dbnameService']);
$tablenameLoc = "[asus_visual_overlay].[dbo].[geojson]";

$allLoc=array();
$db->query("SELECT DISTINCT * FROM ".$tablenameLoc." ORDER BY NAME_0;");
while($row = $db->fetch_array()){
    $allLoc[] = $row['iso'];
}

//-----------------------
$dir = "..\\";
$filename = 'world_country_sorted';
$contents = file_get_contents($dir.$filename.".js");
$results = json_decode($contents); 

$handle = fopen($filename."_minn.js",'w+');
$str = 'var world_region={'."\n".
        '"type": "FeatureCollection",'."\n".
        '"crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },'."\n".
        '"features": ['."\n";
fwrite($handle,$str);

for($j=0;$j<count($allLoc);++$j){
//foreach($allLoc as $key=>$value){
    
    $isFound=false;
    for($i=0;$i<count($results->features);++$i){
        $iso =  $results->features[$i]->properties->ISO_A3;

        if($allLoc[$j]!=$iso) {
            //echo $iso." NOT FOUND...<br>";
            continue;
        }
        $isFound=true;
        //echo $iso." processing...<br>";
        // print_r($geometry->coordinates);
        $geometry = &$results->features[$i]->geometry;
        // echo "===================<br>";
        //lowerprecise($geometry->coordinates);
        // print_r($geometry->coordinates);
        // break;
        
        $jsonStr = '{"type":"Feature","properties":{';
        $jsonStr.='"ISO_A3":'.'"'.$iso.'"},';
        $jsonStr.='"geometry":'.json_encode($geometry).'}';
            
        if($j!=count($allLoc)-1){
            fwrite($handle,$jsonStr.",\n");
        }else{
            //$currentIso=$iso;
            fwrite($handle,$jsonStr."\n");
        }
    }
    echo $allLoc[$j]."is".(($isFound)?" Found<br>":"NOT FOUND<br>");
}

fwrite($handle,"]\n};\n");
fclose($handle);
?>