    <?php
    ini_set("max_execution_time", 0);
    ini_set('memory_limit', '3500M');
    require_once("DBconfig.php");
    require_once("DBclass.php");
    require_once("function.php");
    $results = array();
    $db = new DB();

//     $start = new DateTime(null,new DateTimeZone('Asia/Taipei'));
//     echo "<br>-----------<br>".$start->format('Y-m-d H:i:s')."<br>-----------<br>";
//    $color = '["all"]';
//    $color = '["black"]';
//    $from = "2016-7-9";
//    $to = "2016-8-1";
//    $iso ='["TWN"]';
//    $data = '[{"model":"all","devices":"all","datatype":"model"}]';
//    $dataset = 'activation';
//    $data = '[{"model":"ZE520KL","devices":"ZE520KL","datatype":"model"},{"model":"ZE552KL","devices":"ZE552KL","datatype":"model"}]';

    $dataset = $_GET['dataset'];
    $from = $_GET['from'];
    $to = $_GET['to'];
    $data = $_GET['data'];
    $iso = $_GET['iso'];
    $color = $_GET['color'];
    $cpu = $_GET['cpu'];
    $rearCamera = $_GET['rearCamera'];
    $frontCamera = $_GET['frontCamera'];

    $db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB[$dataset]['dbnameMarker_']);
    if($data!="[]"){
        $isoObj = json_decode($iso);
        $dataObj = json_decode($data);
        $colorObj = json_decode($color);
        $cpuObj = json_decode($cpu);
        $rearCameraObj = json_decode($rearCamera);
        $frontCameraObj = json_decode($frontCamera);

        $isAll = isAll($dataObj);
        
        //color
        $isColorAll=isAll($colorObj);
        $color_in=getSQLInStr($colorObj);
        
        //CPU
        $isCpuAll=isAll($cpuObj);
        $cpu_in=getSQLInStr($cpuObj);
        
        //FrontCamera
        $isFrontCameraAll=isAll($frontCameraObj);
        $frontCamera_in=getSQLInStr($frontCameraObj);
        
        //RearCamera
        $isRearCameraAll=isAll($rearCameraObj);
        $rearCamera_in=getSQLInStr($rearCameraObj);
    
        $str_in='';
        
        $sqlDeviceIn = getAllTargetDeviceSql($dataObj);
        
        $db->query($sqlDeviceIn);
        while($row = $db->fetch_array()){
            $str_in.="'".$row['device_name']."',";
        }
        $str_in = substr($str_in,0,-1);
        
        $queryStr='';
        for($i=0;$i<count($isoObj);++$i){
            $iso = $isoObj[$i];
            
            $queryStr.="SELECT count,lng,lat"
                        ." FROM "
                        .($isColorAll ? "" : "$colorMappingTable A2,")
                        .($isCpuAll ? "" : "$cpuMappingTable A3,")
                        .($isFrontCameraAll ? "" : "$frontCameraMappingTable A4,")
                        .($isRearCameraAll ? "" : "$rearCameraMappingTable A5,")
                        .strtolower($iso)." A1"

                        ." WHERE "
                        ."date BETWEEN '".$from."' AND '".$to."'"
                        .($isAll?"":" AND model IN(".$str_in.")")
                        .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN(".$color_in.")")
                        .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN(".$cpu_in.")")
                        .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN(".$frontCamera_in.")")
                        .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN(".$rearCamera_in.")");

            if($i != count($isoObj)-1){
                $queryStr .= " UNION ALL ";
            }
        }

		$sql = 'SELECT SUM(count)as count,lng,lat FROM('.$queryStr.')foo GROUP BY lng,lat';
//echo $sql."<br><br>";
        $cnt=0;
        $db->query($sql);
        while($row = $db->fetch_array())
        {
            $results[] = array(
                'cnt' => ($row['count']),
                'lng' => ($row['lng']),
                'lat' => ($row['lat']),
            );
            $cnt+=$row['count'];
        }
    }
    $json = json_encode($results);
    echo $json;

//     $end = new DateTime(null,new DateTimeZone('Asia/Taipei'));
//     echo "<br>-----------<br>".$end->format('Y-m-d H:i:s')."<br>-----------<br>";
//
//    $interval = $start->diff($end);
//    echo $interval->format('%Y-%m-%d %H:%i:%s');

?>