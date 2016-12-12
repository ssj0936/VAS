    <?php
    ini_set("max_execution_time", 0);

    require_once("DBconfig.php");
    require_once("DBclass.php");
    require_once("function.php");
    $result = array();
    $db = new DB();
    $tableStyle = 'border:1px solid black';

//    $color = '["all"]';
//    $cpu = '["all"]';
//    $rearCamera = '["all"]';
//    $frontCamera = '["all"]';
//    $dataset = 'activation';
//    $from = "2015-9-11";
//    $to = "2016-10-11";    
//    $iso ='["IND"]';
//    $data = '[{"model":"ZENFONE","devices":"ZENFONE","product":"ZENFONE","datatype":"product"}]';
//    $distBranch = '[]';
//    $groupBy = 'model';
//    $singleBranch = 'Nagpur_Raipur';
//    $singleBranch = null;

//    $color = '["all"]';
//    $cpu = '["all"]';
//    $rearCamera = '["all"]';
//    $frontCamera = '["all"]';
//    $dataset = 'activation';
//    $from = "2015-9-11";
//    $to = "2016-10-11";    
//    $iso ='["IDN"]';
//    $data = '[{"model":"ZENFONE","devices":"ZENFONE","product":"ZENFONE","datatype":"product"}]';
//    $distBranch = '[]';
//    $groupBy = 'branch';
//    $singleBranch = 'SOUTH_SUMATERA';
//    $singleBranch = null;
//

//    $color = '["all"]';
//    $cpu = '["all"]';
//    $rearCamera = '["all"]';
//    $frontCamera = '["all"]';
//    $dataset = 'activation';
//    $from = "2016-11-1";
//    $to = "2016-12-1";  
//    $iso ='["VNM"]';
//    $data = '[{"model":"ZENFONE","devices":"ZENFONE","product":"ZENFONE","datatype":"product"}]';
//    $permission = '{"":["AK","AT","AZ"],"HKG":["AK","AT","AX","AZ"],"IND":["AK","AT","AX","AZ"],"IDN":["AK","AT","AX","AZ"],"JPN":["AK","AT","AX","AZ"],"MYS":["AK","AT","AX","AZ"],"PHL":["AK","AT","AX","AZ"],"SGP":["AK","AT","AX","AZ"],"THA":["AK","AT","AX","AZ"],"VNM":["AK","AT","AX","AZ"],"BGD":["AK","AT","AX","AZ"],"MMR":["AK","AT","AX","AZ"],"KOR":["AK","AT","AX","AZ"],"KHM":["AK","AT","AX","AZ"]}';
//    $distBranch = '[]';
//    $groupBy = 'branch';
//    $singleBranch = null;

    $color = $_POST['color'];
    $cpu = $_POST['cpu'];
    $rearCamera = $_POST['rearCamera'];
    $frontCamera = $_POST['frontCamera'];
    $dataset = $_POST['dataset'];
    $from = $_POST['from'];
    $to = $_POST['to'];
    $data = $_POST['data'];
    $iso = $_POST['iso'];
    $distBranch = $_POST['distBranch'];
    $groupBy = $_POST['groupBy'];
    $singleBranch = $_POST['branch'];
    $permission = $_POST['permission'];

    if($data!="[]"){
        $isoObj = json_decode($iso);
        $dataObj = json_decode($data);
        $colorObj = json_decode($color);
        $cpuObj = json_decode($cpu);
        $rearCameraObj = json_decode($rearCamera);
        $frontCameraObj = json_decode($frontCamera);
        $distBranchObj = json_decode($distBranch);
        $permissionObj = json_decode($permission);
        
        $isDistBranch = (count($distBranchObj)!=0);
        $isFullPermission = (empty((array)$permissionObj));
        $distBranchStr = getSQLDistBranchStr($distBranchObj,false);
        
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
        
        //to know which level this country need to used
        $db->connect_db($_DB['host'], $_DB['username'], $_DB['password']);
        $getLevelQuery = "SELECT loc_level FROM $branchLocLevelTable WHERE iso='$isoObj[0]'";
        $db->query($getLevelQuery);
        $row = $db->fetch_array();
        $level = intval($row['loc_level']);
        
        
        $db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB[$dataset]['dbnameRegionL'.$level]);
        $str_in='';
		$sqlDeviceIn = getAllTargetDeviceSql($dataObj);
        
        $db->query($sqlDeviceIn);
        while($row = $db->fetch_array()){
            $str_in.="'".$row['device_name']."',";
        }
        $str_in = substr($str_in,0,-1);
		//echo $str_in;	
        //group by model_name
        
        if(!$isFullPermission){
            $permissionResult = permissionCheck($isFullPermission,$permissionObj,$isoObj[0]);
            if(!$permissionResult['queryable']) continue;
        }
        
        $queryStr = '';
        switch($isoObj[0]){
            case 'IND':
                $tableColumnNameListModel = array("Period","Model","Country","ASUS Branch","TAM Share<br>by Branch","Activation Share<br>by Branch"
                        ,"Activation q'ty<br>by Branch","GAP % by Branch<br>(TAM v.s Actvation)","ASUS Territory","Activation q'ty<br>by Territory"
                        ,"District","Activation q'ty<br>by District");
                $fromTableStr="SELECT device,branch,map_id,count"
                    ." FROM "
                    .($isColorAll ? "" : "$colorMappingTable A2,")
                    .($isCpuAll ? "" : "$cpuMappingTable A3,")
                    .($isFrontCameraAll ? "" : "$frontCameraMappingTable A4,")
                    .($isRearCameraAll ? "" : "$rearCameraMappingTable A5,")
                    .(($isFullPermission || $permissionResult['isFullPermissionThisIso']) ? "" : "(SELECT distinct product_id,model_name FROM $productIDTable) product,")
                    ."$isoObj[0] A1,"
                    ."$deviceTable device_model"

                    ." WHERE "
                    ."date BETWEEN '".$from."' AND '".$to."'"
                    ." AND A1.device = device_model.device_name"
                    .($isAll?"":" AND device IN(".$str_in.")")
                    .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN(".$color_in.")")
                    .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN(".$cpu_in.")")
                    .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN(".$frontCamera_in.")")
                    .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN(".$rearCamera_in.")")
                    .($isDistBranch ? " AND $distBranchStr " : "")
                    .(($isFullPermission || $permissionResult['isFullPermissionThisIso']) ? "" : " AND device_model.model_name = product.model_name AND product.product_id IN (".$permissionResult['permissionProductIDStr'].")");
                
                $fromTableStrGroupByModel ="(".$fromTableStr.")data,$deviceTable mapping";
//                echo $fromTableStr."<br>";


                if($groupBy == 'model'){
                    //2.get model name And sum group by model_name, branch, map_id
                    $queryStr = "SELECT sum(count)count,branch,model_name,map_id"
                        ." FROM ".$fromTableStrGroupByModel
                        ." WHERE data.device = mapping.device_name"
                        ." GROUP BY model_name, branch, map_id";

                    //3.get district name/branchName of 
                    $queryStr = "SELECT count,branch branchSell,model_name,map_id,name2,branchName branchActivate"
                        ." FROM ($queryStr)tmp,$regionTam regionTam"
                        ." WHERE tmp.map_id = regionTam.mapid"
                        ." AND branch = branchName"
                        ." ORDER BY model_name, branchSell, map_id";
                }
                else if($groupBy == 'branch'){
                    //2.get model name And sum group by model_name, branch, map_id
                    $queryStr = "SELECT sum(count)count,branch,map_id"
                        ." FROM ".$fromTableStrGroupByModel
                        ." WHERE data.device = mapping.device_name"
                        ." GROUP BY branch, map_id";

                    //3.get district name/branchName of 
                    $queryStr = "SELECT count,branch branchSell,map_id,name2,branchName branchActivate"
                        ." FROM ($queryStr)tmp,$regionTam regionTam"
                        ." WHERE tmp.map_id = regionTam.mapid"
                        ." AND branch = branchName"
                        ." ORDER BY branchSell, map_id";
                }
                break;
                
            case 'IDN':
            case 'VNM':
                if($isoObj[0] == 'VNM')
                    $tableColumnNameListModel = array("Period","Model","Country","ASUS Branch","TAM Share<br>by Branch","Activation Share<br>by Branch","Activation q'ty<br>by Branch","GAP % by Branch<br>(TAM v.s Actvation)","District","Activation q'ty<br>by District");
                else
                    $tableColumnNameListModel = array("Period","Model","Country","ASUS Branch","TAM Share<br>by Branch","Activation Share<br>by Branch"               ,"Activation q'ty<br>by Branch","GAP % by Branch<br>(TAM v.s Actvation)","Province","Activation q'ty<br>by Province","Regency","Activation q'ty<br>by Regency");
                
                $fromTableStr="SELECT device,map_id,count"
                    ." FROM "
                    .($isColorAll ? "" : "$colorMappingTable A2,")
                    .($isCpuAll ? "" : "$cpuMappingTable A3,")
                    .($isFrontCameraAll ? "" : "$frontCameraMappingTable A4,")
                    .($isRearCameraAll ? "" : "$rearCameraMappingTable A5,")
                    .(($isFullPermission || $permissionResult['isFullPermissionThisIso']) ? "" : "(SELECT distinct product_id,model_name FROM $productIDTable) product,")
                    ."$isoObj[0] A1,"
                    ."$deviceTable device_model"

                    ." WHERE "
                    ."date BETWEEN '".$from."' AND '".$to."'"
                    ." AND A1.device = device_model.device_name"
                    .($isAll?"":" AND device IN(".$str_in.")")
                    .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN(".$color_in.")")
                    .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN(".$cpu_in.")")
                    .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN(".$frontCamera_in.")")
                    .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN(".$rearCamera_in.")")
                    .($isDistBranch ? " AND $distBranchStr " : "")
                    .(($isFullPermission || $permissionResult['isFullPermissionThisIso']) ? "" : " AND device_model.model_name = product.model_name AND product.product_id IN (".$permissionResult['permissionProductIDStr'].")");
                
                $fromTableStrGroupByModel ="(".$fromTableStr.")data,$deviceTable mapping";
//                echo $fromTableStr."<br>";


                if($groupBy == 'model'){
                    //2.get model name And sum group by model_name, branch, map_id
                    $queryStr = "SELECT sum(count)count,branchName as branchSell,model_name,map_id,name2"
                        ." FROM $fromTableStrGroupByModel , $regionTam regionTam"
                        ." WHERE data.device = mapping.device_name"
                        ." AND data.map_id = regionTam.mapid"
                        ." AND regionTam.iso = '$isoObj[0]'"
                        ." GROUP BY model_name, branchName, map_id,name2";
                }
                else if($groupBy == 'branch'){
                    //2.get model name And sum group by model_name, branch, map_id
                    $queryStr = "SELECT sum(count)count,branchName as branchSell,map_id,name2"
                        ." FROM $fromTableStrGroupByModel , $regionTam regionTam"
                        ." WHERE data.device = mapping.device_name"
                        ." AND data.map_id = regionTam.mapid"
                        ." AND regionTam.iso = '$isoObj[0]'"
                        ." GROUP BY branchName, map_id,name2";
                }
                break;
        }
        //1.get all data first
		//--------------------------------------------------------------------------------
		
		$db->query($queryStr);
        $first = true;
        $start_date = null;
        $end_date = null;
		while($row = $db->fetch_array())
		{
			$result[($groupBy=='model')? $row['model_name'] : 'all'][$row['branchSell']][$row['name2']] = $row['count'];
		}
//        print_r($result);
        //create table
        $file = file('geojson/branchTerritoryDistTam/'.$isoObj[0].'_branchTerritoryDistTam.csv');
        
        if($level == 1){
            $tableColumnList = array('branchName','tamShareByBranch','activationShareBranch','activationSumBranch','gapBranch','districtName','activationOfDistrict');
            
            $data = array();
            foreach($file as $line){
                $str = $line;
                $line = str_replace("\r", '', $line);
                $line = str_replace("\n", '', $line);
                $split = explode(',', $line);

                $index = count($data);
                $data[$index]['branchName'] = trim($split[0]);
                $data[$index]['tamShareByBranch'] = trim($split[1]);
                $data[$index]['districtName'] = trim($split[2]);
            }

            $totalRows = 0;
            $finalData = array();
            foreach($result as $model => $datas){
                //create data column first
                $finalData[$model] = array();
                foreach($data as $index =>$array){
                    $finalData[$model][$index]['branchName'] = $data[$index]['branchName'];
                    $finalData[$model][$index]['tamShareByBranch'] = $data[$index]['tamShareByBranch'];
                    $finalData[$model][$index]['districtName'] = $data[$index]['districtName'];
                    $finalData[$model][$index]['activationOfDistrict'] = 0;
                }

                //fill in activation
                foreach($datas as $branch => $dataArray){
                    foreach($dataArray as $district => $cnt){
                        $found = false;
                        $_district = $district;
                        $_district = strtolower($_district);
                        $_district = str_replace(array("'",'"','-',','," ","(",")"),"",$_district);
                        for($i=0;$i<count($finalData[$model]);++$i){

                            $string = strtolower($finalData[$model][$i]['districtName']);
                            $string = str_replace(array("'",'"','-',','," ","(",")"),"",$string);
                            if($string == $_district){
                                $finalData[$model][$i]['activationOfDistrict'] = $cnt;
                                $found = true;
                                break;
                            }
                        }
                        if(!$found) echo "$branch/$district!!!!!!!!<br>";
                    }
                }

                //activation sum(group by branch/territory)
                $activationSum = array();
                $currentBranch = '';
                $currentBranchSum = 0;
                $activationAll = 0;
                for($i=0;$i<count($finalData[$model]);++$i){
                    $totalRows++;
                    $branch = $finalData[$model][$i]['branchName'];
                    $territory = $finalData[$model][$i]['districtName'];
                    $activation = $finalData[$model][$i]['activationOfDistrict'];

                    if($currentBranch!=$branch){
                        if($currentBranch!=''){
                            $activationSum[$currentBranch]['cnt'] = $currentBranchSum;
                            $currentBranchSum = 0;
                        }

                        $currentBranch = $branch;
                    }

                    $currentBranchSum+=$activation;
                    $activationAll+=$activation;

                    if($i==count($finalData[$model])-1){
                        if($currentBranch!=''){
                            $activationSum[$currentBranch]['cnt'] = $currentBranchSum;
                            $currentBranchSum = 0;
                        }
                    }
                }
    //            print_r($activationSum);

                for($i=0;$i<count($finalData[$model]);++$i){
                    $finalData[$model][$i]['activationSumBranch'] = $activationSum[$finalData[$model][$i]['branchName']]['cnt'];
                    $finalData[$model][$i]['activationShareBranch'] = percentage($activationSum[$finalData[$model][$i]['branchName']]['cnt'],$activationAll);
                    $finalData[$model][$i]['gapBranch'] = percentage(($finalData[$model][$i]['activationShareBranch'] / $finalData[$model][$i]['tamShareByBranch'])-1,1);
                }
                    
                //init
                $rowSpan = array();
                foreach($tableColumnList as $indexName){
                    $rowSpan[$indexName]['currentName']='';
                    $rowSpan[$indexName]['rowspanIndex']=0;
                }
                //row span
                for($i=0;$i<count($finalData[$model])+1;++$i){
                    $needToRowSpan = false;
                    foreach($tableColumnList as $indexName){
                        $name = isset($finalData[$model][$i]) ? $finalData[$model][$i][$indexName] : null;
                        if($rowSpan[$indexName]['currentName'] != $name || $i==count($finalData[$model]) || $needToRowSpan){

                            if($rowSpan[$indexName]['currentName']!=''){
                                $rowspanCnt = $i-$rowSpan[$indexName]['rowspanIndex'];
                                $finalData[$model][$rowSpan[$indexName]['rowspanIndex']][$indexName] 
                                    = "<td rowspan='$rowspanCnt' style ='$tableStyle'>".$finalData[$model][$rowSpan[$indexName]['rowspanIndex']][$indexName]."</td>";
                            }
                            $rowSpan[$indexName]['rowspanIndex'] = $i;
                            $rowSpan[$indexName]['currentName'] = ''.$name;
                            $needToRowSpan = true;
                        }
                        else{
                            $finalData[$model][$i][$indexName] = '';
                        }
                    }
                }
            }
        }
        //L2
        else{
            $tableColumnList = array('branchName','tamShareByBranch','activationShareBranch','activationSumBranch','gapBranch','territoryName','activationSumTerritory','districtName','activationOfDistrict');
            
            $data = array();
            foreach($file as $line){
                $str = $line;
                $line = str_replace("\r", '', $line);
                $line = str_replace("\n", '', $line);
                $split = explode(',', $line);

                $index = count($data);
                $data[$index]['branchName'] = trim($split[0]);
                $data[$index]['tamShareByBranch'] = trim($split[1]);
                $data[$index]['territoryName'] = trim($split[3]);
                $data[$index]['districtName'] = trim($split[5]);
            }

            $totalRows = 0;
            $finalData = array();
            foreach($result as $model => $datas){
                //create data column first
                $finalData[$model] = array();
                foreach($data as $index =>$array){
                    $finalData[$model][$index]['branchName'] = $data[$index]['branchName'];
                    $finalData[$model][$index]['tamShareByBranch'] = $data[$index]['tamShareByBranch'];
                    $finalData[$model][$index]['territoryName'] = $data[$index]['territoryName'];
                    $finalData[$model][$index]['districtName'] = $data[$index]['districtName'];
    //                $finalData[$model][$index]['activationOfDistrict'] = rand();
                    $finalData[$model][$index]['activationOfDistrict'] = 0;
                }

                //fill in activation
                foreach($datas as $branch => $dataArray){
                    foreach($dataArray as $district => $cnt){
                        $found = false;
                        $_district = $district;
                        $_district = strtolower($_district);
                        $_district = str_replace(array("'",'"','-',','," ","(",")"),"",$_district);
                        for($i=0;$i<count($finalData[$model]);++$i){

                            $string = strtolower($finalData[$model][$i]['districtName']);
                            $string = str_replace(array("'",'"','-',','," ","(",")"),"",$string);
                            if($string == $_district){
                                $finalData[$model][$i]['activationOfDistrict'] = $cnt;
                                $found = true;
                                break;
                            }
                        }
    //                    if(!$found) echo "$branch/$district!!!!!!!!<br>";
                    }
                }

                //activation sum(group by branch/territory)
                $activationSum = array();
                $currentBranch = '';
                $currentBranchSum = 0;
                $currentTerritory = '';
                $currentTerritorySum = 0;
                $activationAll = 0;
                for($i=0;$i<count($finalData[$model]);++$i){
                    $totalRows++;
                    $branch = $finalData[$model][$i]['branchName'];
                    $territory = $finalData[$model][$i]['territoryName'];
                    $activation = $finalData[$model][$i]['activationOfDistrict'];

                    if($currentBranch!=$branch || $currentTerritory!=$territory){
                        if($currentTerritory!=''){
                            $activationSum[$currentBranch][$currentTerritory] = $currentTerritorySum;
                            $currentTerritorySum = 0;
                        }

                        $currentTerritory = $territory;
                    }

                    if($currentBranch!=$branch){
                        if($currentBranch!=''){
                            $activationSum[$currentBranch]['cnt'] = $currentBranchSum;
                            $currentBranchSum = 0;
                        }

                        $currentBranch = $branch;
                    }

                    $currentBranchSum+=$activation;
                    $currentTerritorySum+=$activation;
                    $activationAll+=$activation;

                    if($i==count($finalData[$model])-1){
                        if($currentTerritory!=''){
                            $activationSum[$currentBranch][$currentTerritory] = $currentTerritorySum;
                            $currentTerritorySum = 0;
                        }
                        if($currentBranch!=''){
                            $activationSum[$currentBranch]['cnt'] = $currentBranchSum;
                            $currentBranchSum = 0;
                        }
                    }
                }
    //            print_r($activationSum);

                for($i=0;$i<count($finalData[$model]);++$i){
                    $finalData[$model][$i]['activationSumBranch'] = $activationSum[$finalData[$model][$i]['branchName']]['cnt'];
                    $finalData[$model][$i]['activationSumTerritory'] = $activationSum[$finalData[$model][$i]['branchName']][$finalData[$model][$i]['territoryName']];
                    $finalData[$model][$i]['activationShareBranch'] = percentage($activationSum[$finalData[$model][$i]['branchName']]['cnt'],$activationAll);
                    $finalData[$model][$i]['gapBranch'] = percentage(($finalData[$model][$i]['activationShareBranch'] / $finalData[$model][$i]['tamShareByBranch'])-1,1);
                }

                //for region Gap export
                if($singleBranch != null){
                    $needToDelete = array();
                    for($i=0;$i<count($finalData[$model]);++$i){
                        if(!isSame($finalData[$model][$i]['branchName'],$singleBranch)){
                            $needToDelete[] = $i;
                            $totalRows -- ;
                        }
                    }
                    //delete other branch data except the chosen one
                    $finalData[$model] = array_diff_key($finalData[$model], array_flip($needToDelete));
                    //re arrange array key
                    $finalData[$model] = array_values($finalData[$model]);
                }

                //init
                $rowSpan = array();
                foreach($tableColumnList as $indexName){
                    $rowSpan[$indexName]['currentName']='';
                    $rowSpan[$indexName]['rowspanIndex']=0;
                }
                //row span
                for($i=0;$i<count($finalData[$model])+1;++$i){
                    $needToRowSpan = false;
                    foreach($tableColumnList as $indexName){
                        $name = isset($finalData[$model][$i]) ? $finalData[$model][$i][$indexName] : null;
                        if($rowSpan[$indexName]['currentName'] != $name || $i==count($finalData[$model]) || $needToRowSpan){

                            if($rowSpan[$indexName]['currentName']!=''){
                                $rowspanCnt = $i-$rowSpan[$indexName]['rowspanIndex'];
                                $finalData[$model][$rowSpan[$indexName]['rowspanIndex']][$indexName] 
                                    = "<td rowspan='$rowspanCnt' style ='$tableStyle'>".$finalData[$model][$rowSpan[$indexName]['rowspanIndex']][$indexName]."</td>";
                            }
                            $rowSpan[$indexName]['rowspanIndex'] = $i;
                            $rowSpan[$indexName]['currentName'] = ''.$name;
                            $needToRowSpan = true;
                        }
                        else{
                            $finalData[$model][$i][$indexName] = '';
                        }
                    }
                }
            }
        }
        //group by branch:
        //need to get selected Model
        $allModelStr = '';
        if($groupBy!='model'){
            $query = getModel($str_in);
            $db->query($query);
            while($row = $db->fetch_array()){
               $allModelStr .= $row['model_name'].", ";
            }
            $allModelStr = substr($allModelStr,0,-2);
        }

        //creating table
        $tableStr = '';
        $tableStr .= "<table>";
        //title column
        $tableStr .= "<tr>";

        foreach($tableColumnNameListModel as $indexName){
            $tableStr .= "<th style ='$tableStyle'>".$indexName."</th>";
        }
        $tableStr .= "</tr>";

        $first = true;
        foreach($finalData as $model => $d){
            for($i=0;$i<count($finalData[$model]);++$i){
                $tableStr .= "<tr>";
                if($first){
                    $tableStr .="<td rowspan='$totalRows' style ='$tableStyle'>".$from.' ~ '.$to."</td>";
                    $first = false;
                }

                if($i==0){
                    //model display
                    $tableStr .= "<td rowspan='".count($finalData[$model])."' style ='$tableStyle'>".(($groupBy=='model')? $model : $allModelStr)."</td>";
                    //country display
                    $tableStr .= "<td rowspan='".count($finalData[$model])."' style ='$tableStyle'>".$isoObj[0]."</td>";
                }
                foreach($tableColumnList as $indexName){
                    $tableStr .= $finalData[$model][$i][$indexName];
                }
                $tableStr .= "</tr>";
            }
        }
        $tableStr .= "</table>";
    }
    echo $tableStr;
    
    function percentage($numerator , $denominator){
        return "".round(($numerator / $denominator) * 100,3)."%";
    }

    function isSame($a,$b){
        $a_ = strtolower($a);
        $a_ = str_replace(array("'",'"','-',','," ","(",")","\r","\n"),"",$a_);
        
        $b_ = strtolower($b);
        $b_ = str_replace(array("'",'"','-',','," ","(",")","\r","\n"),"",$b_);
        
        return $a_ == $b_;
    }
?>