    <?php
    ini_set("max_execution_time", 0);
    ini_set('memory_limit', '3500M');
    require_once("DBconfig.php");
    require_once("DBclass.php");
    require_once("function.php");
    $db = new DB();

    $data = $_POST['data'];
    $iso = $_POST['iso'];
    $permission = $_POST['permission'];
    $view = $_POST['view'];
    $category = $_POST['category'];



    if ($view == 'muc') {
        $moduleCodeTable = $_DB['repair']['dbnameMucModuleCode'];
        $moduleEncodeTable = $_DB['repair']['dbnameMucModuleEnode'];
        $moduleEncodeMappingColumn = "muc_module_numcode";
        $moduleCodeMappingColumn = "muc_module";
        $moduleCodeDatatableColumn = "muc_module_encode";
    } else if ($view == 'lmd') {
        $moduleCodeTable = $_DB['repair']['dbnameLmdModuleCode'];
        $moduleEncodeTable = $_DB['repair']['dbnameLmdModuleEnode'];
        $moduleEncodeMappingColumn = "lmd_part_group_numcode";
        $moduleCodeMappingColumn = "lmd_part_group";
        $moduleCodeDatatableColumn = "lmd_part_group_encode";
    }

    $repairDeviceTable = $_DB['repair']['dbnameDeviceCode'];
    $dataObj = json_decode($data);
    if(count($dataObj) != 0) {
        $isoObj = json_decode($iso);
        $permissionObj = json_decode($permission);

        $isFullPermission = (empty((array)$permissionObj));
        $isAll = isAll($dataObj);

        $result['SC'] = array();
        $categoryList = array();

        $db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], "SQ_map");
        $queryStr = "SELECT [site_id],[country],[address],[lat],[lng] FROM [SQ_map].[dbo].[service_center_loc]";
        $db->query($queryStr);
        $key = 0;
        while($row = $db->fetch_array()) {
            $result['SC'][$key]['address'] = $row['address'];
            $result['SC'][$key]['site_id'] = $row['site_id'];
            $result['SC'][$key]['lng'] = $row['lng'];
            $result['SC'][$key]['lat'] = $row['lat'];
            $key++;
        }

        $db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB['repair']['dbnameMarkerCategory']);
        $str_in='';

        $sqlDeviceIn = getAllTargetDeviceSql($dataObj);
        $db->query($sqlDeviceIn);
        while($row = $db->fetch_array()){
            $str_in.="'".$row['device_name']."',";
        }
        $str_in = substr($str_in,0,-1);

        $queryStr='';

        $unRepairStr = "select  distinct tblA.encode 
                        from $moduleEncodeTable tblA 
                        where
                            tblA.$moduleEncodeMappingColumn = '[0]'";

//get non-repair device
        for($i=0;$i<count($isoObj);++$i){
            
            if(!$isFullPermission){
                $result = permissionCheck($isFullPermission,$permissionObj,$isoObj[$i]);
                if(!$result['queryable']) continue;
            }

            $tmpQueryStr="SELECT A1.longitude as lng, A1.latitude as lat"
                        ." FROM "
                        .(($isFullPermission || $result['isFullPermissionThisIso']) ? "" : "(SELECT distinct product_id,model_name FROM $productIDTable) product,")
                        ."$isoObj[$i] A1,"
                        ."$repairDeviceTable device_model"

                        ." WHERE "
                        ." A1.mp_numcode = device_model.numcode"
                        .($isAll?"":" AND device_model.productdevice IN(".$str_in.")")
                        ." AND A1.$moduleCodeDatatableColumn = ($unRepairStr)"
                        .(($isFullPermission || $result['isFullPermissionThisIso']) ? "" : " AND device_model.model_name = product.model_name AND product.product_id IN (".$result['permissionProductIDStr'].")");

            if(strlen($queryStr)==0){
                $queryStr .= $tmpQueryStr;
            }
            else{
                $queryStr.=(" UNION ALL ".$tmpQueryStr);
            }
        }

        $db->query($queryStr);
        $result['device']= array();
        $key = 0;
        while($row = $db->fetch_array())
        {
            $result['device'][$key]['site_id'] = 0;
            $result['device'][$key]['service'] = "N";
            $result['device'][$key]['part'] = json_decode('[0]');
            $result['device'][$key]['lng'] = $row['lng'];
            $result['device'][$key]['lat'] = $row['lat'];
            $key++;
        }


        $categoryStr = "select  distinct tblA.encode 
                        from $moduleEncodeTable tblA 
                            , (SELECT [numcode] from $moduleCodeTable) tblB 
                        where
                            (tblA.$moduleEncodeMappingColumn like '[[]' +CONVERT(NVARCHAR(200),tblB.numcode)+',%'
                            OR tblA.$moduleEncodeMappingColumn like '%,' +CONVERT(NVARCHAR(200),tblB.numcode)+',%'
                            OR tblA.$moduleEncodeMappingColumn like '%,'+CONVERT(NVARCHAR(200),tblB.numcode)+']'
                            OR tblA.$moduleEncodeMappingColumn = '['+CONVERT(NVARCHAR(200),tblB.numcode)+']')
                        and tblB.numcode = $category";
        $queryStr = '';
        for($i=0;$i<count($isoObj);++$i){
            
            if(!$isFullPermission){
                $result = permissionCheck($isFullPermission,$permissionObj,$isoObj[$i]);
                if(!$result['queryable']) continue;
            }

            $tmpQueryStr="SELECT A1.longitude as lng, A1.latitude as lat, A1.site_id, encode_table.$moduleEncodeMappingColumn"
                        ." FROM "
                        .(($isFullPermission || $result['isFullPermissionThisIso']) ? "" : "(SELECT distinct product_id,model_name FROM $productIDTable) product,")
                        ."$isoObj[$i] A1,"
                        ."$repairDeviceTable device_model,"
                        ."$moduleEncodeTable encode_table"

                        ." WHERE "
                        ." A1.mp_numcode = device_model.numcode"
                        ." AND A1.$moduleCodeDatatableColumn = encode_table.encode"
                        .($isAll?"":" AND device_model.productdevice IN(".$str_in.")")
                        .(($category ==1 )?" AND A1.$moduleCodeDatatableColumn NOT IN ($unRepairStr)":" AND A1.$moduleCodeDatatableColumn IN ($categoryStr)")
                        .(($isFullPermission || $result['isFullPermissionThisIso']) ? "" : " AND device_model.model_name = product.model_name AND product.product_id IN (".$result['permissionProductIDStr'].")");

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
            foreach (json_decode($row[$moduleEncodeMappingColumn]) as $tmp => $value) {
                $categoryList[$value] = 1;
            }

            $result['device'][$key]['site_id'] = json_decode($row['site_id'],true);
            $result['device'][$key]['service'] = "Y";
            $result['device'][$key]['part'] = json_decode($row[$moduleEncodeMappingColumn]);
            $result['device'][$key]['lng'] = $row['lng'];
            $result['device'][$key]['lat'] = $row['lat'];
            $key++;
        }


        $result['category_list'] = array();
        if (count($categoryList) > 0) {
            $tmpQueryStr = implode(',',array_keys($categoryList));
            $queryStr = "SELECT numcode,$moduleCodeMappingColumn
                        FROM $moduleCodeTable
                        WHERE numcode IN ($tmpQueryStr)";
    
            $db->query($queryStr);
            while($row = $db->fetch_array()) {
                $result['category_list'][] = $row[$moduleCodeMappingColumn];
                $categoryMapping[$row['numcode']] = $row[$moduleCodeMappingColumn];
            }
            $categoryMapping[0] = 'unrepair';
            foreach ($result['device'] as $key => $device) {
                foreach ($device['part'] as $index => $code) {
                    $result['device'][$key]['part'][$index] = $categoryMapping[$code];
                }
            }
        }

    }
    $json = json_encode($result);
    echo $json;

?>