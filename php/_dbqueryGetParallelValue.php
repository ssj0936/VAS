<?php
    ini_set("max_execution_time", 0);

    require_once("DBconfig.php");
    require_once("DBclass.php");
    require_once("function.php");
    $results = array();
    $db = new DB();
    

//    $now = new DateTime(null,new DateTimeZone('Asia/Taipei'));
//    echo "<br>-----------<br>".$now->format('Y-m-d H:i:s')."<br>-----------<br>";
//    $color = '["all"]';
//    $cpu = '["all"]';
//    $rearCamera = '["all"]';
//    $frontCamera = '["all"]';
//    $data = '[{"model":"ZENFONE","devices":"ZENFONE","product":"ZENFONE","datatype":"product"}]';
//$permission = '{"":["AK","AT","AZ"],"HKG":["AK","AT","AX","AZ"],"IND":["AK","AT","AX","AZ"],"IDN":["AK","AT","AX","AZ"],"JPN":["AK","AT","AX","AZ"],"MYS":["AK","AT","AX","AZ"],"PHL":["AK","AT","AX","AZ"],"SGP":["AK","AT","AX","AZ"],"THA":["AK","AT","AX","AZ"],"VNM":["AK","AT","AX","AZ"],"BGD":["AK","AT","AX","AZ"],"MMR":["AK","AT","AX","AZ"],"KOR":["AK","AT","AX","AZ"],"KHM":["AK","AT","AX","AZ"]}';
//$permission = '{}';


    $color = $_POST['color'];
    $cpu = $_POST['cpu'];
    $rearCamera = $_POST['rearCamera'];
    $frontCamera = $_POST['frontCamera'];
    $data = $_POST['data'];
    $permission = $_POST['permission'];

    if($data!="[]"){
        $dataObj = json_decode($data);
        $colorObj = json_decode($color);
        $cpuObj = json_decode($cpu);
        $rearCameraObj = json_decode($rearCamera);
        $frontCameraObj = json_decode($frontCamera);

        $permissionObj = json_decode($permission);
        $isFullPermission = (empty((array)$permissionObj));

//        $isAll = isAll($dataObj);
        
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
    
        $db->connect_db($_DB['host'], $_DB['username'], $_DB['password']);
        
		$sqlDeviceIn = getAllTargetModelSql($dataObj);
        $str_in = '';
        $db->query($sqlDeviceIn);
        while($row = $db->fetch_array()){
            $str_in.="'".$row['model_name']."',";
        }
        $str_in = substr($str_in,0,-1);
        
        if(!$isFullPermission){
            $permissionResult = allPermissionCheck($permissionObj);
            //if(!$result['queryable']) continue;
        }
        
		$queryStr = "("
                        ."select country"
                            .",model"
                            .",case when (import+normal)=0 then '0.00' else FORMAT(import/(import+normal)*100,'N2') end 'importRatio'"
                            .",case when (export+normal)=0 then '0.00' else FORMAT(export/(export+normal)*100,'N2') end 'exportRatio'"
                        ."from("
                            ."SELECT country"
                                    .",a2.model"
                                    .",CAST(sum(ABC_is_dis_not) AS DECIMAL(18,2)) import"
                                    .",CAST(sum(ABC_not_dis_is) AS DECIMAL(18,2)) export"
                                    .",CAST(sum(ABC_is_dis_is) AS DECIMAL(18,2)) normal"
                            ." FROM "
                                .$_DB['parallel']['name']." a1,"
                                .$_DB['parallel']['mapping']." a2"
                                .(($isFullPermission) ? "" : ",(SELECT distinct product_id,model_name FROM $productIDTable) product")
                            ." where model IN ($str_in)"
                            ." AND a1.MRRD_numcode = a2.numcode"
                            .(($isFullPermission) ? "" : " AND model = product.model_name AND $permissionResult")
                            ." group by country,a2.model"
                        .")foo"

                        ." union all"
                        
                        ." select country"
                            .",'all' model"
                            .",case when (import+normal)=0 then '0.00' else FORMAT(import/(import+normal)*100,'N2') end 'importRatio'"
                            .",case when (export+normal)=0 then '0.00' else FORMAT(export/(export+normal)*100,'N2') end 'exportRatio'"
                        ."from("
                            ."SELECT country"
                                    .",CAST(sum(ABC_is_dis_not) AS DECIMAL(18,2)) import"
                                    .",CAST(sum(ABC_not_dis_is) AS DECIMAL(18,2)) export"
                                    .",CAST(sum(ABC_is_dis_is) AS DECIMAL(18,2)) normal"
                            ." FROM "
                                  .$_DB['parallel']['name']." a1,"
                                  .$_DB['parallel']['mapping']." a2"
                                  .(($isFullPermission) ? "" : ",(SELECT distinct product_id,model_name FROM $productIDTable) product")
                            ." where model IN ($str_in)"
                            ." AND a1.MRRD_numcode = a2.numcode"
                            .(($isFullPermission) ? "" : " AND model = product.model_name AND $permissionResult")
                            ." group by country"
                       .")goo"
                  .")order by country,model";
                                    
//		echo $queryStr."<br><br><br>";
		
		$db->query($queryStr);
		while($row = $db->fetch_array())
		{
            $iso = $row['country'];
            $model = $row['model'];
            $importRatio = $row['importRatio'];
            $exportRatio = $row['exportRatio'];
            
            //total
            if($model == 'all'){
                $results[$iso]['total'] = array('importRatio'=>$importRatio.'%','exportRatio'=>$exportRatio.'%');
            }
            //single model
            else{
                $results[$iso]['models'][$model] = array('importRatio'=>$importRatio.'%','exportRatio'=>$exportRatio.'%');
            }
		}
    }
    
    $json = json_encode($results,JSON_UNESCAPED_UNICODE);
    echo $json;

//     $now = new DateTime(null,new DateTimeZone('Asia/Taipei'));
//     echo "<br>-----------<br>".$now->format('Y-m-d H:i:s')."<br>-----------<br>";

?>