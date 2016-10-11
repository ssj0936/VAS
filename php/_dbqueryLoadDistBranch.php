<?php
    ini_set("max_execution_time", 0);

    require_once("DBconfig.php");
    require_once("DBclass.php");
    require_once("function.php");
    $results = array();
    $db = new DB();
    $db->connect_db($_DB['host'], $_DB['username'], $_DB['password']);

    $sql = "SELECT distinct [distributor_id],[branchname] 
        FROM $distBranchMapping 
        where Channel_or_Online = 'Channel Disti'
        ORDER BY distributor_id";
    $db->query($sql);
    while($row = $db->fetch_array()){
        $result = array();
        $result['dist'] = $row['distributor_id'];
        $result['branch'] = $row['branchname'];
        
        $results['channel'][] = $result;
    }

    $sql = "SELECT distinct [Online_Dist_name],[distributor_id]
        FROM [dudududadada].[dbo].[channel_disti_branch_mappping]
        where Channel_or_Online = 'Online Disti' 
        ORDER BY Online_Dist_name";
    $db->query($sql);
    while($row = $db->fetch_array()){
        $result = array();
        $result['online_dist'] = $row['Online_Dist_name'];
        $result['dist'] = $row['distributor_id'];
        
        
        $results['online'][] = $result;
    }

    $json = json_encode($results);
    echo $json;
?>