<?php
	ini_set('display_errors', 1); 
	error_reporting(E_ALL);


    ini_set("max_execution_time", 0);
	//echo "123";
    require_once("DBconfig.php");
    require_once("DBclass.php");

    $tablenameLoc = $countryDataOnMap;
    $tablenameProduct="product_list";
	$tablenameDealerCountry="dealer_country";
    $db = new DB();
    $db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB['dbnameService']);
    
    $account = $_GET['account'];
    $isVIP = (($_GET['isVIP']=='true')?true:false);
//    $account = 'TH_CHENG';
//    $isVIP = false;

    $permission;
    $permissionProductId = array();
    $permissionLoc = array();
    $permissionPair = array();
    $permissionProductIdStr;
    $permissionLocStr;
    $permissionResult = array();
    $productToProductID = array();

    $isPass = false;
    if(!$isVIP){
        //account permission
        $context = stream_context_create(array('ssl' => array('verify_peer' => false, 'allow_self_signed' => true)));
        try{
            $client = new SoapClient($soapUrl,array('stream_context' => $context, 'trace'=>true,'exceptions'=>true));
            $permission = $client->getBISReportPermission(
                array("objRequest" => 
                    array('Account' => $Account,
                         'Password' => $Password,
                         'SendID' => $SendID,
                         'ReceiveID' => $ReceiveID,
                         'Report_ID' => $Report_ID,
                         'AD_Account' => $account)
                )
            );
            //permission allow
            if($permission -> getBISReportPermissionResult -> ReturnCode == '0.0'
              && isset($permission -> getBISReportPermissionResult -> OutputDataList -> OutputData)
              && count($permission -> getBISReportPermissionResult -> OutputDataList -> OutputData)!=0){
                $isPass = true;
                
                //different format of permission data
                //1.array 
                if(is_array($permission -> getBISReportPermissionResult -> OutputDataList -> OutputData)){
                    foreach($permission -> getBISReportPermissionResult -> OutputDataList -> OutputData as $value){
                        $permissionProductId[] = $value->Product_ID;
                        $permissionLoc[] = $value->Country;
                        $permissionPair[] = ['country' => $value->Country, 'productID' => $value->Product_ID];

                        if(!isset($permissionResult[$value->Country]) || !in_array($value->Product_ID,$permissionResult[$value->Country]))
                            $permissionResult[$value->Country][] = $value->Product_ID;
                    }
                }
                //2.single object
                else{
                    $value = $permission -> getBISReportPermissionResult -> OutputDataList -> OutputData;
                    $permissionProductId[] = $value->Product_ID;
                    $permissionLoc[] = $value->Country;
                    $permissionPair[] = ['country' => $value->Country, 'productID' => $value->Product_ID];

                    if(!isset($permissionResult[$value->Country]) || !in_array($value->Product_ID,$permissionResult[$value->Country]))
                        $permissionResult[$value->Country][] = $value->Product_ID;
                }
                
                //equal VIP
                if(in_array(['country' => '', 'productID' => '' ],$permissionPair)){
                    $isVIP = true;
                }
                else{
                    $permissionProductId = array_unique($permissionProductId);
                    $permissionLoc = array_unique($permissionLoc);
                    $permissionProductIdStr = "'".implode("','",$permissionProductId)."'";
                    $permissionLocStr = "'".implode("','",$permissionLoc)."'";

                    //get isoA2 from permission api,but we need to switch it to isoA3
                    if($permissionLocStr != "''"){
                        $query = "SELECT iso,isoa2
                                    FROM $tablenameLoc
                                    WHERE isoa2 IN($permissionLocStr)";
                        $db->query($query);

                        while($row = $db->fetch_array()){
                            $permissionResult[$row['iso']] = $permissionResult[$row['isoa2']];
                            unset($permissionResult[$row['isoa2']]);
                        }
                        //delete un-converted item
                    }
                }
                
                foreach($permissionResult as $key => $val){
                    if(strlen($key) == 2)
                        unset($permissionResult[$key]);
                    else
                        sort($permissionResult[$key]);
                }
            }
        }
        catch (Exception $e) 
        {
            $isPass = false;
        }
    }
    //-----------------------------------fake data test-----------------------------------
//    if($account == 'JONAS_TSAI'){
//        $permissionResult = array(
////            'IND' => array('NT','AT','AZ'),
////            'IDN' => array('AZ','AT'),
////            'TWN' => array('NT','AX'),
////            'VNM' => array('AZ','AX'),
////            'BGD' => array('','AX','AZ')
//            'IND' => array('NK','AT','AZ'),
//            'IDN' => array('AZ','AT'),
//            'TWN' => array('NK','AX'),
//            'JPN' => array('NP','AX')
//        ) ;
//        $permissionProductId = array('NK','NP','AT','AZ','AX');
//        $permissionLoc = array('IN','ID','TW','JP');
//        $permissionProductIdStr = "'".implode("','",$permissionProductId)."'";
//        $permissionLocStr = "'".implode("','",$permissionLoc)."'";
//        $isPass = true;
//        $isVIP = false;
//    }
    //-----------------------------------fake data test-----------------------------------

    $allDevices = array();
    $allLoc = array();
    $allCategory = array();
    
    if(!$isPass && !$isVIP){
    }
    else{    
        $currentSeries = '';
        $currentProduct = '';
        
        $query = '';
        //device
        
        $query = "SELECT distinct A1.product_ID,A4.model_description device_name,A2.model_name,PRODUCT product
                    FROM (SELECT distinct product_ID,model_name FROM $productIdMapping) A1,$deviceTable A2,$productNameModelMapping A3,$productDescriptionMapping A4
                    where A2.model_name = A3.MODEL
                    and A1.model_name = A2.model_name
                    and A2.device_name = A4.device_name"
                    .((in_array('',$permissionProductId) || $isVIP) ? '' :" and A1.product_ID IN ($permissionProductIdStr)")
                    ." ORDER BY PRODUCT,A2.model_name,device_name;";

        $db->query($query);

        while($row = $db->fetch_array()){
            //device part
            if($currentProduct=='' || $currentProduct != $row['product']){
                $currentProduct = $row['product'];
                $allDevices[$currentProduct] = array();
            }

            if($currentSeries=='' || $currentSeries != $row['model_name']){
                $currentSeries = $row['model_name'];
                $allDevices[$currentProduct][$currentSeries]=array();
            }
            $allDevices[$currentProduct][$currentSeries][] = $row['device_name'];
            
            //product -> productID mapping
            if(!isset($productToProductID[$currentProduct]))
                $productToProductID[$currentProduct] = $row['product_ID'];
        }

        //loc
        if($isVIP){
            $query = "SELECT DISTINCT * 
                    FROM $tablenameLoc 
                    ORDER BY Terrority,NAME_0;";
        }else if($isPass && !$isVIP){
            $query = "SELECT DISTINCT * 
                    FROM $tablenameLoc "
                    .(in_array('',$permissionLoc) ? '' :" WHERE isoa2 IN($permissionLocStr) ")
                    ." ORDER BY Terrority,NAME_0;";
        }
        $db->query($query);
        while($row = $db->fetch_array()){
            $countryName = $row['NAME_0'];
            $terrority = $row['Terrority'];
            $allLoc[$terrority][$countryName][] = $row['iso'];
        }

    }

    $allEmpty = true;
    foreach($permissionResult as &$productArr){
//        for($i=0;$i<count($productArr);++$i){
        for($i=count($productArr)-1;$i>=0;--$i){
            if(!in_array($productArr[$i],$productToProductID) && $productArr[$i] != ''){
                unset($productArr[$i]);
            }
        }
        $productArr = array_values($productArr);
        
        if(count($productArr) != 0)
            $allEmpty = false;
    }
//    echo '<br><br>';
//    print_r($permissionResult);

    $result['allDevices']=$allDevices;
    $result['allLoc']=$allLoc;
    $result['activationUpdateTime']=$_DB['activation']['updatetime'];
    $result['lifezoneUpdateTime']=$_DB['lifezone']['updatetime'];
    $result['isPass']= ($allEmpty ||(!$isPass && !$isVIP))? false :true ;
    $result['isVIP']= $isVIP;
    $result['accountPermission']= $permissionResult ;
    $result['productToProductID']= $productToProductID ;

    $json = json_encode($result);
    echo $json;

?>