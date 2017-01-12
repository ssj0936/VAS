<?php   
require_once("DBconfig.php");

function isAll($dataObj){
    //for device
    if(is_object($dataObj))
        return (count($dataObj)==1 && $dataObj[0]->datatype == "all");
    //for loc, spec ...etc
    else
        return (count($dataObj)==1 && $dataObj[0]=="all") || $dataObj == null;
}

function arrayConvertToInstr($array){
    $strIn = '';
    for($i=0;$i<count($array);++$i){
        $strIn.="'".$array[$i]."',";
    }
    $strIn = substr($strIn,0,-1);
    return $strIn;
}

function getAllTargetDeviceSql($dataObj){
    $deviceTable = $GLOBALS['deviceTable'];
    $productNameModelMapping = $GLOBALS['productNameModelMapping'];
    
    $deviceArray=array();
    $modelArray=array();
    $productArray=array();

    for($i=0;$i<count($dataObj);++$i){
        $product = $dataObj[$i]->product;
        $model = $dataObj[$i]->model;
        $devices = $dataObj[$i]->devices;
        $datatype = $dataObj[$i]->datatype;

        switch($datatype){
            case "devices":
                $deviceArray[] = $devices;
                break;
            case "model":
                $modelArray[] = $model;
                break;
            case "product":
                $productArray[] = $product;
                break;
        }
    }

    $sqlDeviceIn = "SELECT device_name "
            ."FROM $deviceTable A1, $productNameModelMapping A2 "
            ."WHERE A1.model_name = A2.MODEL ";

    if((count($deviceArray)!=0) || (count($modelArray)!=0) || (count($productArray)!=0)){
        $orArray = array();
        
        if(count($deviceArray)!=0)
            $orArray[] = "device_name in (".arrayConvertToInstr($deviceArray).")";
        if(count($modelArray)!=0)
            $orArray[] = "model_name in (".arrayConvertToInstr($modelArray).")";
        if(count($productArray)!=0)
            $orArray[] = "PRODUCT in (".arrayConvertToInstr($productArray).")";
        $sqlDeviceIn .= 'AND';
        $sqlDeviceIn .= '(';
        $sqlDeviceIn .= implode(" OR ",$orArray);
        $sqlDeviceIn .= ')';
    }

    return $sqlDeviceIn;
}

function getAllTargetModelSql($dataObj){
    $deviceTable = $GLOBALS['deviceTable'];
    $productNameModelMapping = $GLOBALS['productNameModelMapping'];
    $productDescriptionMapping = $GLOBALS['productDescriptionMapping'];
    
    $deviceArray=array();
    $modelArray=array();
    $productArray=array();

    for($i=0;$i<count($dataObj);++$i){
        $product = $dataObj[$i]->product;
        $model = $dataObj[$i]->model;
        $devices = $dataObj[$i]->devices;
        $datatype = $dataObj[$i]->datatype;

        switch($datatype){
            case "devices":
                $deviceArray[] = $devices;
                break;
            case "model":
                $modelArray[] = $model;
                break;
            case "product":
                $productArray[] = $product;
                break;
        }
    }

    $sqlDeviceIn = "SELECT distinct(model_name) "
            ."FROM $deviceTable A1, $productNameModelMapping A2, $productDescriptionMapping A3 "
            ."WHERE A1.model_name = A2.MODEL and A1.device_name = A3.device_name ";

    if((count($deviceArray)!=0) || (count($modelArray)!=0) || (count($productArray)!=0)){
        $orArray = array();
        
        if(count($deviceArray)!=0)
            $orArray[] = "A3.model_description in (".arrayConvertToInstr($deviceArray).")";
        if(count($modelArray)!=0)
            $orArray[] = "model_name in (".arrayConvertToInstr($modelArray).")";
        if(count($productArray)!=0)
            $orArray[] = "PRODUCT in (".arrayConvertToInstr($productArray).")";
        $sqlDeviceIn .= 'AND';
        $sqlDeviceIn .= '(';
        $sqlDeviceIn .= implode(" OR ",$orArray);
        $sqlDeviceIn .= ')';
    }

    return $sqlDeviceIn;
}

function getAllTargetPartNoSql($dataObj) {
    $deviceTable = $GLOBALS['deviceTable'];
    $productNameModelMapping = $GLOBALS['productNameModelMapping'];
    $productDescriptionMapping = $GLOBALS['productDescriptionMapping'];
    
    $deviceArray=array();
    $modelArray=array();
    $productArray=array();

    for($i=0;$i<count($dataObj);++$i){
        $product = $dataObj[$i]->product;
        $model = $dataObj[$i]->model;
        $devices = $dataObj[$i]->devices;
        $datatype = $dataObj[$i]->datatype;

        switch($datatype){
            case "devices":
                $deviceArray[] = $devices;
                break;
            case "model":
                $modelArray[] = $model;
                break;
            case "product":
                $productArray[] = $product;
                break;
        }
    }

    $sqlDeviceIn = "SELECT A3.part_no "
            ."FROM $deviceTable A1, $productNameModelMapping A2, $productDescriptionMapping A3 "
            ."WHERE A1.model_name = A2.MODEL and A1.device_name = A3.device_name ";

    if((count($deviceArray)!=0) || (count($modelArray)!=0) || (count($productArray)!=0)){
        $orArray = array();
        
        if(count($deviceArray)!=0)
            $orArray[] = "A3.model_description in (".arrayConvertToInstr($deviceArray).")";
        if(count($modelArray)!=0)
            $orArray[] = "A1.model_name in (".arrayConvertToInstr($modelArray).")";
        if(count($productArray)!=0)
            $orArray[] = "A2.PRODUCT in (".arrayConvertToInstr($productArray).")";
        $sqlDeviceIn .= 'AND';
        $sqlDeviceIn .= '(';
        $sqlDeviceIn .= implode(" OR ",$orArray);
        $sqlDeviceIn .= ')';
    }

    return $sqlDeviceIn;
}

function getDevicenameToPartNoSql($devices){
    $deviceTable = $GLOBALS['deviceTable'];
    $productNameModelMapping = $GLOBALS['productNameModelMapping'];
    $productDescriptionMapping = $GLOBALS['productDescriptionMapping'];
    
    $deviceArray=$devices;

    $sqlDeviceIn = "SELECT A3.part_no "
            ."FROM $deviceTable A1, $productNameModelMapping A2, $productDescriptionMapping A3 "
            ."WHERE A1.model_name = A2.MODEL and A1.device_name = A3.device_name ";
    if(count($deviceArray)!=0)
        $sqlDeviceIn .= " AND A3.model_description in (".arrayConvertToInstr($deviceArray).")";


    return $sqlDeviceIn;
}

function getBranchLocLevelSql($iso){
    $branchLocLevelTable = $GLOBALS['branchLocLevelTable'];

    $sqlLevel = "SELECT loc_level,tam_spec"
            ." FROM $branchLocLevelTable A1 "
            ." WHERE iso = '".$iso."'";

    return $sqlLevel;
}

function getSQLInStr($dataArray){
//    print_r($dataArray) ;
//    echo "<br>";
    $SQLInStr='';
    for($i=0;$i<count($dataArray);++$i){
        $SQLInStr .= "'".$dataArray[$i]."' Collate Latin1_General_CS_AS";

        if($i != count($dataArray)-1)
            $SQLInStr .=",";
    }
    return $SQLInStr;
}

function getSQLDistBranchStr($distBranchObj,$ismarker){
    $distBranch = '';
    if(count($distBranchObj) > 0){
        $distBranch .= '(';

        for($i=0 ; $i<count($distBranchObj) ; ++$i){
            $dist = $distBranchObj[$i]->dist;
            $branch = $distBranchObj[$i]->branch;
            $distBranch .= "(disti = '$dist' AND branch = '$branch') ";
            if($i != count($distBranchObj)-1)
                $distBranch .= "OR ";
        }

        $distBranch .= ')';
    }
    return $distBranch;
}

function getSQLOnlineDistStr($onlineDistObj,$ismarker){
    $onlineDist = '';
    if(count($onlineDistObj) > 0){
        $onlineDist .= '(';

        for($i=0 ; $i<count($onlineDistObj) ; ++$i){
            $dist = $onlineDistObj[$i];
            $onlineDist .= "(disti = '$dist') ";
            
            if($i != count($onlineDistObj)-1)
                $onlineDist .= "OR ";
        }
        $onlineDist .= ')';
    }
    return $onlineDist;
}

function getModel($inStr){
    $query = 'SELECT distinct model_name'
        ." FROM ".$GLOBALS['deviceTable']
        ." WHERE device_name in ($inStr)";
    return $query;
}

function lowerprecise($number){
    return (float)number_format((float) $number, 3, '.', '');
}

//return array($queryable,$isFullPermissionThisIso,$permissionProductIDStr)
function permissionCheck($isFullPermission,$permissionObj,$iso){
    $isFullPermissionThisIso = false;
    $queryable = true;
    $permissionProductIDStr = '';
    if(!$isFullPermission){
        if( !isset($permissionObj -> $iso) && !isset($permissionObj -> _empty_)){
            $queryable = false;
            return array("queryable" => $queryable 
                         , "isFullPermissionThisIso" => false
                         , "permissionProductIDStr" =>null);
        }
        else{
            $tmpArr = array();
            if(isset($permissionObj -> _empty_)){
                $tmpArr = array_merge($tmpArr,$permissionObj -> _empty_);
            }
            if(isset($permissionObj -> $iso)){
                $tmpArr = array_merge($tmpArr,$permissionObj -> $iso);
            }
            $tmpArr = array_unique ($tmpArr);

            if(in_array('',$tmpArr)){
                $isFullPermissionThisIso = true;
                return array("queryable" => $queryable 
                             , "isFullPermissionThisIso" => $isFullPermissionThisIso
                             , "permissionProductIDStr" =>null);
            }
            else {
                $permissionProductIDStr = implode("','", $tmpArr);
                $permissionProductIDStr = "'".$permissionProductIDStr."'";
                return array("queryable" => $queryable
                             , "isFullPermissionThisIso" => $isFullPermissionThisIso
                             , "permissionProductIDStr" =>$permissionProductIDStr);
            }
        }
    }
}

//return array($queryable,$isFullPermissionThisIso,$permissionProductIDStr)

 //((country='ALB' and product_id in ('AX')) OR (product_id in ('AX')))
function allPermissionCheck($permissionObj){
    
    $queryArr = array();
    
    foreach($permissionObj as $key => $val){
        
        //means 
        if(in_array('',$val)){
            $queryArr[] = "(country='$key')";
        }
        else{
            if($key == '_empty_'){
                $queryArr[] = "(product_id IN ('".implode("','", $val)."'))";
            }else{
                $queryArr[] = "(country='$key' AND product_id IN ('".implode("','", $val)."'))";
            }
        }
    }
    
    return('('.implode(' OR ',$queryArr).')');
}
?>