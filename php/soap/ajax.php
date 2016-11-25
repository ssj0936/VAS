<?php
    try{
		$Account = $_POST['Account'];
		$Password = $_POST['Password'];
		$SendID = $_POST['SendID'];
		$ReceiveID = $_POST['ReceiveID'];
		$Report_ID = $_POST['Report_ID'];
		$AD_Account = $_POST['AD_Account'];

        $url = "https://b2c.asus.com/iis/B2B_WebService/BISReport_Service.asmx?WSDL";
		$context = stream_context_create(array('ssl' => array('verify_peer' => false, 'allow_self_signed' => true)));
        $client = new SoapClient($url,array('stream_context' => $context, 'trace'=>true,'exceptions'=>true));
        $result = $client->getBISReportPermission(
            array("objRequest" => 
//                 array('Account' => 'BIS_AMAXAPP',
//                      'Password' => 'Q7@dAu1Z',
//                      'SendID' => 'BIS_AMAXAPP',
//                      'ReceiveID' => 'ASUS',
//                      'Report_ID' => 'R0001',
//                      'AD_Account' => 'JONAS_TSAI')
				 array('Account' => $Account,
                     'Password' => $Password,
                     'SendID' => $SendID,
                     'ReceiveID' => $ReceiveID,
                     'Report_ID' => $Report_ID,
                     'AD_Account' => $AD_Account)
            )
        );
//        print_r($result);
        $json = json_encode($result);
        echo $json;
    }
    catch (Exception $e) 
    { 
        echo 'Caught exception: ',  $e->getMessage(), "\n"; 
    } 
?>