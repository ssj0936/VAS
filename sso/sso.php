<?php

$a = session_id();
echo $a."\n";

//var_dump($_GET);
var_dump($_COOKIE);
if (empty($_GET["SSO_KEY"]))
{
//RedirectURL請以UrlEncode方式Encode後再傳遞, 避免此URL中帶有特殊符號&, 造成SSO Verify導回時參數被截斷了
$strRedirectURL = urlencode ("http://localhost/sso/sso.php");
header("Location: http://sso.asus.com.tw:82/SSOVerify/?AP_KEY=".$a."&R_URL=".$strRedirectURL."&R_ER_URL="."http://www.google.com");
echo "nope";
}
else
{
//假設SSO Verify確認完後導回原AP頁面, 此時已取得SSO_KEY, 可連線到Oracle OEMDB的SSO_VERIFY_INFO查詢工號, SQL語法如下, Table Schema如後
$strSQL = "select * from framework.SSO_VERIFY_INFO where AP_KEY='".$a."' and SSO_KEY='".$_GET["SSO_KEY"]."'";
echo "not null";
}
exit;
?>