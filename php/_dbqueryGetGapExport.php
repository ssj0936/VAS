    <?php
    ini_set("max_execution_time", 0);

    require_once("DBconfig.php");
    require_once("DBclass.php");
    require_once("function.php");
    $result = array();
    $db = new DB();

    $tableColumnList = array('branchName','tamShareByBranch','tamOfBranch','activationShareBranch','activationSumBranch','gapBranch','territoryName','tamOfTerritory','activationSumTerritory','districtName','tamOfDistrict','activationOfDistrict');
    $tableStyle = 'border:1px solid black';
//    $color = '["all"]';
//    $cpu = '["all"]';
//    $rearCamera = '["all"]';
//    $frontCamera = '["all"]';
//    $dataset = 'activation';
//    $from = "2015-7-9";
//    $to = "2016-8-3";    
//    $iso ='["IND"]';
//    $data = '[{"model":"A501CG","devices":"A501CG","product":"ZENFONE","datatype":"model"},{"model":"A450CG","devices":"A450CG","product":"ZENFONE","datatype":"model"}]';
//    $distBranch = '[{"dist":"FLIPKART","branch":"KARNATAKA"}]';
//    $groupBy = 'model';

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

    if($data!="[]"){
        $isoObj = json_decode($iso);
        $dataObj = json_decode($data);
        $colorObj = json_decode($color);
        $cpuObj = json_decode($cpu);
        $rearCameraObj = json_decode($rearCamera);
        $frontCameraObj = json_decode($frontCamera);
        $distBranchObj = json_decode($distBranch);
        
        $isDistBranch = (count($distBranchObj)!=0);
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
    
		if(count($isoObj)==1){
			$db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB[$dataset]['dbnameRegionL2']);
		}else{
			$db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB[$dataset]['dbnameRegionL1']);
		}
        
        $str_in='';
		$sqlDeviceIn = getAllTargetDeviceSql($dataObj);
        
        $db->query($sqlDeviceIn);
        while($row = $db->fetch_array()){
            $str_in.="'".$row['device_name']."',";
        }
        $str_in = substr($str_in,0,-1);
		//echo $str_in;	
        //group by model_name
		//--------------------------------------------------------------------------------
		$fromTableStr='';
		for($i=0;$i<count($isoObj);++$i){
            
            $fromTableStr.="SELECT model,branch,country_id,count"
                        ." FROM "
                        .($isColorAll ? "" : "$colorMappingTable A2,")
                        .($isCpuAll ? "" : "$cpuMappingTable A3,")
                        .($isFrontCameraAll ? "" : "$frontCameraMappingTable A4,")
                        .($isRearCameraAll ? "" : "$rearCameraMappingTable A5,")
                        ."$isoObj[$i] A1"

                        ." WHERE "
                        ."date BETWEEN '".$from."' AND '".$to."'"
                        .($isAll?"":" AND model IN(".$str_in.")")
                        .($isColorAll ? "" : " AND A1.product_id = A2.PART_NO AND A2.SPEC_DESC IN(".$color_in.")")
                        .($isCpuAll ? "" : " AND A1.product_id = A3.PART_NO AND A3.SPEC_DESC IN(".$cpu_in.")")
                        .($isFrontCameraAll ? "" : " AND A1.product_id = A4.PART_NO AND A4.SPEC_DESC IN(".$frontCamera_in.")")
                        .($isRearCameraAll ? "" : " AND A1.product_id = A5.PART_NO AND A5.SPEC_DESC IN(".$rearCamera_in.")")
                        .($isDistBranch ? " AND $distBranchStr " : "");
			if($i != count($isoObj)-1)
				$fromTableStr.=" UNION ALL ";
		}
		$fromTableStrGroupByModel ="(".$fromTableStr.")data,$deviceTable mapping";
//		echo $fromTableStr."<br>";
		
        $queryStr = '';
        if($groupBy == 'model'){
            $queryStr = "SELECT sum(count)count,branch,model_name,country_id"
                ." FROM ".$fromTableStrGroupByModel
                ." WHERE data.model = mapping.device_name"
                ." GROUP BY model_name, branch, country_id";

            $queryStr = "SELECT count,branch,model_name,country_id,name2,tam"
                ." FROM ($queryStr)tmp,$regionTam regionTam"
                ." WHERE tmp.country_id = regionTam.mapid"
                ." ORDER BY model_name, branch, country_id";
        }
        else if($groupBy == 'branch'){
            $queryStr = "SELECT sum(count)count,branch,country_id"
                ." FROM ".$fromTableStrGroupByModel
                ." WHERE data.model = mapping.device_name"
                ." GROUP BY branch, country_id";

            $queryStr = "SELECT count,branch,country_id,name2,tam"
                ." FROM ($queryStr)tmp,$regionTam regionTam"
                ." WHERE tmp.country_id = regionTam.mapid"
                ." ORDER BY branch, country_id";
        }
//		echo $queryStr."<br><br><br>";
		
		$db->query($queryStr);
        $first = true;
        $start_date = null;
        $end_date = null;
		while($row = $db->fetch_array())
		{
			$result[($groupBy=='model')? $row['model_name'] : 'all'][$row['branch']][$row['name2']] = $row['count'];
		}
//        print_r($result);
        //create table
        $file = file('branchTerritoryDistTam.csv');
        $data = array();
        foreach($file as $line){
            $str = $line;
            $line = str_replace("\r", '', $line);
            $line = str_replace("\n", '', $line);
            $split = explode(',', $line);

            $index = count($data);
            $data[$index]['branchName'] = trim($split[0]);
            $data[$index]['tamShareByBranch'] = trim($split[1]);
            $data[$index]['tamOfBranch'] = trim($split[2]);
            $data[$index]['territoryName'] = trim($split[3]);
            $data[$index]['tamOfTerritory'] = trim($split[4]);
            $data[$index]['districtName'] = trim($split[5]);
            $data[$index]['tamOfDistrict'] = trim($split[6]);
        }

        $finalData = array();
        foreach($result as $model => $datas){
            //create data column first
            $finalData[$model] = array();
            foreach($data as $index =>$array){
                $finalData[$model][$index]['branchName'] = $data[$index]['branchName'];
                $finalData[$model][$index]['tamShareByBranch'] = $data[$index]['tamShareByBranch'];
                $finalData[$model][$index]['tamOfBranch'] = $data[$index]['tamOfBranch'];
                $finalData[$model][$index]['territoryName'] = $data[$index]['territoryName'];
                $finalData[$model][$index]['tamOfTerritory'] = $data[$index]['tamOfTerritory'];
                $finalData[$model][$index]['districtName'] = $data[$index]['districtName'];
                $finalData[$model][$index]['tamOfDistrict'] = $data[$index]['tamOfDistrict'];
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
//        print_r($dataObj);
        $allModelStr='';
        foreach($dataObj as $obj){
            $allModelStr .= '['.$obj->model.']';
        }
//        echo $allModelStr;
        
        $tableStr = '';
        $tableStr .= "<table>";
        //title column
        $tableStr .= "<tr>";
        
        $tableStr .= "<th style ='$tableStyle'>model</th>";
        foreach($tableColumnList as $indexName){
            $tableStr .= "<th style ='$tableStyle'>".$indexName."</th>";
        }
        $tableStr .= "</tr>";

        foreach($finalData as $model => $d){
            for($i=0;$i<count($finalData[$model]);++$i){
                $tableStr .= "<tr>";
                
                if($i==0){
                    $tableStr .= "<td rowspan='".count($finalData[$model])."' style ='$tableStyle'>".(($groupBy=='model')? $model : $allModelStr)."</td>";
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
        return "".round(($numerator / $denominator) * 100)."%";
    }
?>