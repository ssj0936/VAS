<?php
set_time_limit(0);
ini_set('memory_limit', '2G'); // or you could use 1G

require_once("DBconfig.php");
require_once("DBclass.php");

$db = new DB();
$db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB['dbnameService']);
$tablenameLoc = $countryDataOnMap;

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
    
    $isFound=false;
    for($i=0;$i<count($results->features);++$i){
        $iso =  $results->features[$i]->properties->ISO_A3;
        $name = $results->features[$i]->properties->NAME;
        if($allLoc[$j]!=$iso) {
            continue;
        }
        $isFound=true;
        $geometry = &$results->features[$i]->geometry;
        $coordinates = &$results->features[$i]->geometry->coordinates;
        
        lowerprecise($coordinates);
        //minimize the boundary of country to 4 points
//        $bounds =array();
//        loopAllCoor($coordinates,$bounds);
//
//        $coordinates = array();
//        $coordinates[] = array($bounds['xMin'],$bounds['yMax']);
//        $coordinates[] = array($bounds['xMax'],$bounds['yMax']);
//        $coordinates[] = array($bounds['xMax'],$bounds['yMin']);
//        $coordinates[] = array($bounds['xMin'],$bounds['yMin']);
        
        $jsonStr = '{"type":"Feature","properties":{';
        $jsonStr.='"ISO_A3":"'.$iso.'","NAME":"'.$name.'"},';
        $jsonStr.='"geometry":'.json_encode($geometry).'}';
            
        if($j!=count($allLoc)-1){
            fwrite($handle,$jsonStr.",\n");
        }else{
            //$currentIso=$iso;
            fwrite($handle,$jsonStr."\n");
        }
    }
    echo $allLoc[$j]."is".(($isFound)?" Found\r\n":"NOT FOUND\r\n");
}

fwrite($handle,"]\n};\n");
fclose($handle);



function loopAllCoor($coordinateArr, &$bounds) {
    //not coordinateArr
    if (!is_numeric($coordinateArr[0])) {
        foreach($coordinateArr as $arr){
            loopAllCoor($arr, $bounds);
        }
    } else {
        $longitude = $coordinateArr[0];
        $latitude = $coordinateArr[1];

        $bounds['xMin'] = !isset($bounds['xMin']) ? $longitude : 
            ($bounds['xMin'] < $longitude ? $bounds['xMin'] : $longitude);
        
        $bounds['xMax'] = !isset($bounds['xMax']) ? $longitude : 
            ($bounds['xMax'] > $longitude ? $bounds['xMax'] : $longitude);
        
        $bounds['yMin'] = !isset($bounds['yMin']) ? $latitude : 
            ($bounds['yMin'] < $latitude ? $bounds['yMin'] : $latitude);
        
        $bounds['yMax'] = !isset($bounds['yMax']) ? $latitude : 
            ($bounds['yMax'] > $latitude ? $bounds['yMax'] : $latitude);
    }
}

function lowerprecise(&$array){
    if(is_numeric($array[0])){
        $array[0] = (float)number_format((float) $array[0], 3, '.', '');
        $array[1] = (float)number_format((float) $array[1], 3, '.', '');
        //print_r($array);
    }
    else{
        foreach($array as &$value){
            lowerprecise($value);
        }
    }
}
?>