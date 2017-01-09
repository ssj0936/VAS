<?php
    ini_set("max_execution_time", 0);

    require_once("DBconfig.php");
    require_once("DBclass.php");
    require_once("function.php");
    $results = array();
    $db = new DB();

//    $color = '["all"]';
//    $cpu = '["all"]';
//    $rearCamera = '["all"]';
//    $frontCamera = '["all"]';
//    $data = '[{"model":"ZENFONE","devices":"ZENFONE","product":"ZENFONE","datatype":"product"}]';
//    $iso = 'TWN';
//    $permission = '{"":["AK","AT","AZ"],"HKG":["AK","AT","AX","AZ"],"IND":["AK","AT","AX","AZ"],"IDN":["AK","AT","AX","AZ"],"JPN":["AK","AT","AX","AZ"],"MYS":["AK","AT","AX","AZ"],"PHL":["AK","AT","AX","AZ"],"SGP":["AK","AT","AX","AZ"],"THA":["AK","AT","AX","AZ"],"VNM":["AK","AT","AX","AZ"],"BGD":["AK","AT","AX","AZ"],"MMR":["AK","AT","AX","AZ"],"KOR":["AK","AT","AX","AZ"],"KHM":["AK","AT","AX","AZ"]}';
//    $permission = '{}';
//    $exportFileType = 'Import';


    $color = $_POST['color'];
    $cpu = $_POST['cpu'];
    $rearCamera = $_POST['rearCamera'];
    $frontCamera = $_POST['frontCamera'];
    $data = $_POST['data'];
    $iso = $_POST['iso'];
    $permission = $_POST['permission'];
    $exportFileType = $_POST['exportFileType'];

    $stratTime = null;
    $endTime = null;
    if($data!="[]"){
        $dataObj = json_decode($data);
        $colorObj = json_decode($color);
        $cpuObj = json_decode($cpu);
        $rearCameraObj = json_decode($rearCamera);
        $frontCameraObj = json_decode($frontCamera);

        $permissionObj = json_decode($permission);
        $isFullPermission = (empty((array)$permissionObj));
        
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
        
        if($exportFileType == 'Import')
            $exportFileColumn = 'ABC_is_dis_not';
        else if($exportFileType == 'Export')
            $exportFileColumn = 'ABC_not_dis_is';
        
        //1.import/export ratio group by country
        $queryStr = "SELECT * FROM ("
                    ." select NAME_0,act_year"
                        .",act_mon"
                        .(($exportFileType == 'Import') ? (",case when (import+normal)=0 then '0.00' else FORMAT(import/(import+normal)*100,'N2') end 'ratio'") : (",case when (export+normal)=0 then '0.00' else FORMAT(export/(export+normal)*100,'N2') end 'ratio'"))
                    ."from("
                        ."SELECT NAME_0,act_year,act_mon"
                                .",CAST(sum(ABC_is_dis_not) AS DECIMAL(18,2)) import"
                                .",CAST(sum(ABC_not_dis_is) AS DECIMAL(18,2)) export"
                                .",CAST(sum(ABC_is_dis_is) AS DECIMAL(18,2)) normal"
                        ." FROM "
                              .$_DB['parallel']['name']." a1,"
                              .$_DB['parallel']['mapping']." a2,"
                              .$countryDataOnMap." geo" 
                              .(($isFullPermission) ? "" : ",(SELECT distinct product_id,model_name FROM $productIDTable) product")
                        ." where model IN ($str_in)"
                        ." AND country = '$iso'"
                        ." AND a1.MRRD_numcode = a2.numcode"
                        ." AND geo.iso = a1.country"
                        .(($isFullPermission) ? "" : " AND model = product.model_name AND $permissionResult")
                    ." group by NAME_0,act_year,act_mon"
                    ." )foo "
                    ." )goo "
                    ." WHERE ratio != '0.00'"
                    ." order by act_year,act_mon";
                                    
//		echo $queryStr."<br><br><br>";
		
		$db->query($queryStr);
        $countryFlowRatio = array();
        $recordFirst = true;
		while($row = $db->fetch_array())
		{
            $countryName = $row['NAME_0'];
            $year = $row['act_year'];
            $month = $row['act_mon'];
            $ratio = $row['ratio'];
         
            if($recordFirst){
                $recordFirst = false;
                $stratTime = ($year.'-'.$month);
            }
            $endTime = ($year.'-'.$month);
            
            $countryFlowRatio[$countryName][] = array('date' => ($year.'-'.$month), 'value'=>$ratio);
		}
        
        //2.import/export ratio group by model
        $queryStr = "SELECT * FROM ("
                    ." select act_year"
                        .",act_mon"
                        .",model"
                        .(($exportFileType == 'Import') ? ",case when (import+normal)=0 then '0.00' else FORMAT(import/(import+normal)*100,'N2') end 'ratio'" : ",case when (export+normal)=0 then '0.00' else FORMAT(export/(export+normal)*100,'N2') end 'ratio'")
                    ."from("
                        ."SELECT act_year,act_mon,model"
                                .",CAST(sum(ABC_is_dis_not) AS DECIMAL(18,2)) import"
                                .",CAST(sum(ABC_not_dis_is) AS DECIMAL(18,2)) export"
                                .",CAST(sum(ABC_is_dis_is) AS DECIMAL(18,2)) normal"
                        ." FROM "
                              .$_DB['parallel']['name']." a1,"
                              .$_DB['parallel']['mapping']." a2"
                              .(($isFullPermission) ? "" : ",(SELECT distinct product_id,model_name FROM $productIDTable) product")
                        ." where model IN ($str_in)"
                        ." AND country = '$iso'"
                        ." AND a1.MRRD_numcode = a2.numcode"
                        .(($isFullPermission) ? "" : " AND model = product.model_name AND $permissionResult")
                    ." group by act_year,act_mon,model"
                    ." )foo "
                    ." )goo "
                    ." WHERE ratio != '0.00'"
                    ." order by model,act_year,act_mon";
                                    
//		echo $queryStr."<br><br><br>";
		
		$db->query($queryStr);
        $modelFlowRatio = array();
		while($row = $db->fetch_array())
		{
            $model = $row['model'];
            $year = $row['act_year'];
            $month = $row['act_mon'];
            $ratio = $row['ratio'];
            
            $modelFlowRatio[$model][] = array('date' => ($year.'-'.$month), 'value'=>$ratio);
		}
        
        //3.import/export count group by model
        $queryStr = "SELECT * FROM("
                    ."SELECT act_year,act_mon,model"
                                .(($exportFileType == 'Import') ? ",sum(ABC_is_dis_not) count" : ",sum(ABC_not_dis_is) count")
                        ." FROM "
                              .$_DB['parallel']['name']." a1,"
                              .$_DB['parallel']['mapping']." a2"
                              .(($isFullPermission) ? "" : ",(SELECT distinct product_id,model_name FROM $productIDTable) product")
                        ." where model IN ($str_in)"
                        ." AND country = '$iso'"
                        ." AND a1.MRRD_numcode = a2.numcode"
                        .(($isFullPermission) ? "" : " AND model = product.model_name AND $permissionResult")
                    ." group by act_year,act_mon,model"
                    ." ) foo"
                    ." WHERE count !=0 "
                    ." order by model,act_year,act_mon";
                                    
//		echo $queryStr."<br><br><br>";
		
		$db->query($queryStr);
        $modelFlowCount = array();
		while($row = $db->fetch_array())
		{
            $model = $row['model'];
            $year = $row['act_year'];
            $month = $row['act_mon'];
            $count = $row['count'];
            
            $modelFlowCount[$model][] = array('date' => ($year.'-'.$month), 'value'=>$count);
		}
        
        //4.import/export count group by dist
        $queryStr = "SELECT * FROM("
                    ."SELECT act_year,act_mon,distributor_id"
                                .(($exportFileType == 'Import') ? ",sum(ABC_is_dis_not) count" : ",sum(ABC_not_dis_is) count")
                        ." FROM "
                              .$_DB['parallel']['name']." a1,"
                              .$_DB['parallel']['mapping']." a2"
                              .(($isFullPermission) ? "" : ",(SELECT distinct product_id,model_name FROM $productIDTable) product")
                        ." where model IN ($str_in)"
                        ." AND country = '$iso'"
                        ." AND a1.MRRD_numcode = a2.numcode"
                        .(($isFullPermission) ? "" : " AND model = product.model_name AND $permissionResult")
                    ." group by act_year,act_mon,distributor_id"
                    ." ) foo"
                    ." WHERE count !=0 "
                    ." order by distributor_id,act_year,act_mon";
                                    
//		echo $queryStr."<br><br><br>";
		
		$db->query($queryStr);
        $distFlowCount = array();
		while($row = $db->fetch_array())
		{
            $dist = $row['distributor_id'];
            $year = $row['act_year'];
            $month = $row['act_mon'];
            $count = $row['count'];
            
            $distFlowCount[$dist][] = array('date' => ($year.'-'.$month), 'value'=>$count);
		}
    }
    
    $results['countryFlowRatio'] = $countryFlowRatio;
    $results['modelFlowRatio'] = $modelFlowRatio;
    $results['modelFlowCount'] = $modelFlowCount;
    $results['distFlowCount'] = $distFlowCount;   
    $results['timeRange'] = array('start' => $stratTime, 'end' => $endTime);
    $json = json_encode($results,JSON_UNESCAPED_UNICODE);
    echo $json;
?>