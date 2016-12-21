    <?php
    ini_set("max_execution_time", 0);

    require_once("DBconfig.php");
    require_once("DBclass.php");
    require_once("function.php");
    $db = new DB();

    $result = array();
    $quartileArray = array();
    $categoryList = array();


    $data = $_POST['data'];
    $iso = $_POST['iso'];
    $permission = $_POST['permission'];
    $view = $_POST['view'];
    $category = $_POST['category'];

    $repairDeviceTable = $_DB['repair']['dbnameDeviceCode'];

    $dataObj = json_decode($data);
    if(count($dataObj) != 0){
        $isoObj = json_decode($iso);
        $permissionObj = json_decode($permission);

        $isFullPermission = (empty((array)$permissionObj));
        $isAll = isAll($dataObj);

        $db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB['repair']['dbnameRegionTotal']);
        $str_in='';

        $sqlDeviceIn = getAllTargetDeviceSql($dataObj);

        $db->query($sqlDeviceIn);
        while($row = $db->fetch_array()){
            $str_in.="'".$row['device_name']."',";
        }
        $str_in = substr($str_in,0,-1);

        $queryStr='';
        for($i=0;$i<count($isoObj);++$i){
            
            if(!$isFullPermission){
                $result = permissionCheck($isFullPermission,$permissionObj,$isoObj[$i]);
                if(!$result['queryable']) continue;
            }

            $tmpQueryStr="SELECT A1.l2code as l2code,SUM(A1.total) as total"
                        ." FROM "
                        .(($isFullPermission || $result['isFullPermissionThisIso']) ? "" : "(SELECT distinct product_id,model_name FROM $productIDTable) product,")
                        ."$isoObj[$i] A1,"
                        ."asus_repair_mapping_a.dbo.model_productdevice_code device_model"

                        ." WHERE "
                        ." A1.mp_numcode = device_model.numcode"
                        .($isAll?"":" AND device_model.productdevice IN(".$str_in.")")
                        .(($isFullPermission || $result['isFullPermissionThisIso']) ? "" : " AND device_model.model_name = product.model_name AND product.product_id IN (".$result['permissionProductIDStr'].")")
                        ." GROUP BY l2code";

            if(strlen($queryStr)==0){
                $queryStr .= $tmpQueryStr;
            }
            else{
                $queryStr.=(" UNION ALL ".$tmpQueryStr);
            }
        }

        $results['total'] = array();
        $results['total']['category'] = array();
        $results['total']['totalCnt'] = 0;
        $results['total']['totalCFR'] = 0;
        $results['total']['quartile'] = array();
        $db->query($queryStr);
        while($row = $db->fetch_array())
        {
            $results[$row['l2code']]['totalCnt'] = $row['total'];
            $results[$row['l2code']]['totalCFR'] = 0.0;
            $results['total']['totalCnt'] += $row['total'];
        }

        if ($view == 'muc') {
            $db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB['repair']['dbnameRegionMuc']);
            $moduleCodeTable = $_DB['repair']['dbnameMucModuleCode'];
            $moduleCodeDatatableColumn = "muc_module_numcode";
            $moduleCodeMappingColumn = "muc_module";
        } else if ($view == 'lmd') {
            $db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB['repair']['dbnameRegionLmd']);
            $moduleCodeTable = $_DB['repair']['dbnameLmdModuleCode'];
            $moduleCodeDatatableColumn = "lmd_part_group_numcode";
            $moduleCodeMappingColumn = "lmd_part_group";
        }

        $queryStr='';
        for($i=0;$i<count($isoObj);++$i){
            
            if(!$isFullPermission){
                $result = permissionCheck($isFullPermission,$permissionObj,$isoObj[$i]);
                if(!$result['queryable']) continue;
            }

            $tmpQueryStr="SELECT A1.l2code as l2code,SUM(A1.count) as count,category_code.$moduleCodeMappingColumn as category"
                        ." FROM "
                        .(($isFullPermission || $result['isFullPermissionThisIso']) ? "" : "(SELECT distinct product_id,model_name FROM $productIDTable) product,")
                        ."$isoObj[$i] A1,"
                        ."$repairDeviceTable device_model,"
                        ."$moduleCodeTable category_code"
                        ." WHERE "
                        ." A1.mp_numcode = device_model.numcode"
                        .(($category == 1)?" AND A1.$moduleCodeDatatableColumn != 0":" AND A1.$moduleCodeDatatableColumn = $category")
                        ." AND A1.$moduleCodeDatatableColumn = category_code.numcode"
                        .($isAll?"":" AND device_model.productdevice IN(".$str_in.")")
                        .(($isFullPermission || $result['isFullPermissionThisIso']) ? "" : " AND device_model.model_name = product.model_name AND product.product_id IN (".$result['permissionProductIDStr'].")")
                        ."GROUP BY l2code, $moduleCodeMappingColumn";

            if(strlen($queryStr)==0){
                $queryStr .= $tmpQueryStr;
            }
            else{
                $queryStr.=(" UNION ALL ".$tmpQueryStr);
            }
        }

        $db->query($queryStr);

        while($row = $db->fetch_array())
        {
            if($category != 1 || $row['category'] != 'ALL'){
                $results[$row['l2code']]['category'][$row['category']] = $row['count']/$results[$row['l2code']]['totalCnt']*100;
                if (empty($results['total']['category'][$row['category']])) {
                    $results['total']['category'][$row['category']] = $row['count'];
                } else {
                    $results['total']['category'][$row['category']] += $row['count'];
                }
                $quartileArray[$row['category']][] = $results[$row['l2code']]['category'][$row['category']];
                $categoryList[$row['category']] = 1;
            }

            if($category == 1){
                if ($row['category'] == 'ALL') {
                    if (empty($results[$row['l2code']]['totalCFR'])) {
                        $results[$row['l2code']]['totalCFR'] = $row['count']/$results[$row['l2code']]['totalCnt']*100;
                    } else {
                        $results[$row['l2code']]['totalCFR'] += $row['count']/$results[$row['l2code']]['totalCnt']*100;
                    }
                }
            } else {
                if (empty($results[$row['l2code']]['totalCFR'])) {
                    $results[$row['l2code']]['totalCFR'] = $results[$row['l2code']]['category'][$row['category']];
                } else {
                    $results[$row['l2code']]['totalCFR'] += $results[$row['l2code']]['category'][$row['category']];
                }
            }



        }

        if (empty($results['total']['category'])) {
            $json = '[]';
            echo $json;
            return;
        }
        foreach ($results['total']['category'] as $key => $value) {
            if($key != 'totalCnt') { 
                $results['total']['category'][$key] = $value/$results['total']['totalCnt']*100;
                if (empty($results['total']['totalCFR'])) {
                     $results['total']['totalCFR'] = $results['total']['category'][$key];
                 } else {
                     $results['total']['totalCFR'] += $results['total']['category'][$key];
                 }
            }
        }

        if ($category == 1) {
            $results['total']['totalCFR'] = 0;
            foreach ($results as $key => $value) {
                if ($key != 'total') {
                    $results['total']['totalCFR'] += $value['totalCFR'];
                    $quartileArray['ALL'][] = $value['totalCFR'];
                }
            }
            $results['total']['totalCFR'] /= (count($results)-1);
        }

        foreach($quartileArray as $key => $value) {
            $results['total']['quartile'][$key] = quartile($quartileArray[$key]);
        }
        $results['category_list'] = array_keys($categoryList);
    }

    $json = json_encode($results);
    echo $json;


    function quartile($data) {
        $output = array();
        sort($data);
        $unique = array_values(array_unique($data));
        $length = count($unique);
        if ($length >4) {
            for($i = 1;$i <=3; $i++) {
                if (is_int($length*$i/4)) {
                    $output[$i-1] = ($unique[$length*$i/4] + $unique[$length*$i/4+1]) /2;
                } else {
                    $output[$i-1] = $unique[ceil($length*$i/4)];
                }
            }
            $output[3] = $unique[$length-1];
        } else {
            $output = array(0.5,1.0,1.5,2.0);
        }

        return $output;
    }
?>