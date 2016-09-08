<?php   
require_once("DBconfig.php");

function isAll($dataObj){
    //for device
    if(is_object($dataObj))
        return (count($dataObj)==1 && $dataObj[0]->datatype == "all");
    //for loc, spec ...etc
    else
        return (count($dataObj)==1 && $dataObj[0]=="all");
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

function getSQLDistBranchStr($distBranchObj){
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
?>