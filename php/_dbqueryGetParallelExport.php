<?php
    ini_set("max_execution_time", 0);

    require_once("DBconfig.php");
    require_once("DBclass.php");
    require_once("function.php");
    $results = array();
    $db = new DB();
    
    $tableStyle = 'border:1px solid black';
//    $color = '["all"]';
//    $cpu = '["all"]';
//    $rearCamera = '["all"]';
//    $frontCamera = '["all"]';
//    $data = '[{"model":"ZENFONE","devices":"ZENFONE","product":"ZENFONE","datatype":"product"}]';
//    $iso = '["IND","TWN"]';
//    $permission = '{"":["AK","AT","AZ"],"HKG":["AK","AT","AX","AZ"],"IND":["AK","AT","AX","AZ"],"IDN":["AK","AT","AX","AZ"],"JPN":["AK","AT","AX","AZ"],"MYS":["AK","AT","AX","AZ"],"PHL":["AK","AT","AX","AZ"],"SGP":["AK","AT","AX","AZ"],"THA":["AK","AT","AX","AZ"],"VNM":["AK","AT","AX","AZ"],"BGD":["AK","AT","AX","AZ"],"MMR":["AK","AT","AX","AZ"],"KOR":["AK","AT","AX","AZ"],"KHM":["AK","AT","AX","AZ"]}';
//    $permission = '{}';
//    $exportFileType = 'Export';


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
        $isoObj = json_decode($iso);
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
        
        $isoIn = "'".implode("','",$isoObj)."'";
            
        if(!$isFullPermission){
            $permissionResult = allPermissionCheck($permissionObj);
            //if(!$result['queryable']) continue;
        }

        
        if($exportFileType == 'Import'){
            $queryStr = "SELECT (select NAME_0 FROM $countryDataOnMap where iso = country)country
                            ,act_year
                            ,act_mon
                            ,model
                            ,(select NAME_0 FROM $countryDataOnMap where iso = dist_country)dist_country
                            ,distributor_id
                            ,shipping_year
                            ,shipping_mon
                            ,sum(ABC_is_dis_not) count"
                    ." FROM "
                        .$_DB['parallel']['name']." a1,"
                        .$_DB['parallel']['mapping']." a2"
                        .(($isFullPermission) ? "" : ",(SELECT distinct product_id,model_name FROM $productIDTable) product")
                    ." WHERE model IN ($str_in) "
                    ." AND country IN ($isoIn) "
                    ." AND a1.MD_numcode = a2.numcode"
                    ." AND ABC_is_dis_not != 0"
                    .(($isFullPermission) ? "" : " AND model = product.model_name AND $permissionResult")
                    ." group by country,model,act_year,act_mon,dist_country,distributor_id,shipping_year,shipping_mon"
                    ." order by country,count DESC";
            
            $db->query($queryStr);
            $tableStr = '';
            $tableStr.= '<table>';
            $tableStr.= "<tr>
                <td style ='$tableStyle'>Country</td>
                <td style ='$tableStyle'>Activation Time</td>
                <td style ='$tableStyle'>Model</td>
                <td style ='$tableStyle'>Country-Disti</td>
                <td style ='$tableStyle'>$exportFileType From</td>
                <td style ='$tableStyle'>Shipping Month</td>
                <td style ='$tableStyle'>Parallel $exportFileType Number</td>
                </tr>";
            while($row = $db->fetch_array())
            {
                $str = "<tr>";
                $str .= "<td style ='$tableStyle'>".$row['country']."</td>";
                $str .= "<td style ='$tableStyle'>".(string)($row['act_year'].'-'.$row['act_mon'])."</td>";
                $str .= "<td style ='$tableStyle'>".$row['model']."</td>";
                $str .= "<td style ='$tableStyle'>".$row['dist_country'].'_'.$row['distributor_id']."</td>";
                $str .= "<td style ='$tableStyle'>".$row['dist_country']."</td>";
                $str .= "<td style ='$tableStyle'>".(string)($row['act_year'].'-'.$row['act_mon'])."</td>";
                $str .= "<td style ='$tableStyle'>".$row['count']."</td>";
                $str .= "</tr>";
                $tableStr .=$str;
            }
            $tableStr.= '</table>';
        }else if($exportFileType == 'Export'){
            $queryStr = '';
            
            for($i = 0;$i<count($isoObj);++$i){
                $country = $isoObj[$i];
                $queryStr .= "SELECT (select NAME_0 FROM $countryDataOnMap where iso = dist_country)dist_country
                            ,act_year
                            ,act_mon
                            ,model
                            ,distributor_id
                            ,(select NAME_0 FROM $countryDataOnMap where iso = country)country
                            ,shipping_year
                            ,shipping_mon
                            ,sum(ABC_is_dis_not) count"
                    ." FROM "
                        .$_DB['parallel']['name']." a1,"
                        .$_DB['parallel']['mapping']." a2"
                        .(($isFullPermission) ? "" : ",(SELECT distinct product_id,model_name FROM $productIDTable) product")
                    ." WHERE model IN ($str_in) "
                    ." AND country != '$country'"
                    ." AND dist_country = '$country'"
                    ." AND a1.MD_numcode = a2.numcode"
                    ." AND ABC_is_dis_not != 0"
                    .(($isFullPermission) ? "" : " AND model = product.model_name AND $permissionResult")
                    ." group by country,model,act_year,act_mon,dist_country,distributor_id,shipping_year,shipping_mon";
                
                if($i != count($isoObj)-1){
                    $queryStr .= ' UNION ALL ';
                }
            }
            $queryStr .= " order by dist_country,count DESC";

            $db->query($queryStr);
            $tableStr = '';
            $tableStr.= '<table>';
            $tableStr.= "<tr>
                <td style ='$tableStyle'>Country</td>
                <td style ='$tableStyle'>Activation Time</td>
                <td style ='$tableStyle'>Model</td>
                <td style ='$tableStyle'>Country-Disti</td>
                <td style ='$tableStyle'>$exportFileType To</td>
                <td style ='$tableStyle'>Shipping Month</td>
                <td style ='$tableStyle'>Parallel $exportFileType Number</td>
                </tr>";
            while($row = $db->fetch_array())
            {
                $str = "<tr>";
                $str .= "<td style ='$tableStyle'>".$row['dist_country']."</td>";
                $str .= "<td style ='$tableStyle'>".(string)($row['act_year'].'-'.$row['act_mon'])."</td>";
                $str .= "<td style ='$tableStyle'>".$row['model']."</td>";
                $str .= "<td style ='$tableStyle'>".$row['dist_country'].'_'.$row['distributor_id']."</td>";
                $str .= "<td style ='$tableStyle'>".$row['country']."</td>";
                $str .= "<td style ='$tableStyle'>".(string)($row['act_year'].'-'.$row['act_mon'])."</td>";
                $str .= "<td style ='$tableStyle'>".$row['count']."</td>";
                $str .= "</tr>";
                $tableStr .=$str;
            }
            $tableStr.= '</table>';
        }
    }
    echo $tableStr;
?>