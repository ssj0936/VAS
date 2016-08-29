<?php

class DB 
{
    var $_dbConn = 0;
    var $_queryResource = 0;
    
    function DB()
    {
        //do nothing
    }
    
    function connect_db($host, $user, $pwd, $dbname)
    {
		$connectionInfo = array( "Database"=>$dbname, "UID"=>$user, "PWD"=>$pwd, "ReturnDatesAsStrings"=> true, "CharacterSet" => "UTF-8");
        $dbConn = sqlsrv_connect( $host, $connectionInfo);
		//mysql_connect($host, $user, $pwd);
        if (! $dbConn)
            die ("MySQL Connect Error");
        //mysql_query("SET NAMES utf8");
        // if (! mysql_select_db($dbname, $dbConn))
            // die ("MySQL Select DB Error");
        $this->_dbConn = $dbConn;
        return true;
    }

    
    function query($sql)
    {
		
        if (! $queryResource = sqlsrv_query($this->_dbConn, $sql))
            die ("MySQL Query Error");
        $this->_queryResource = $queryResource;
        return $queryResource;        
    }
    
	function query_num($sql)
    {
		$params = array();
		$options =  array( "Scrollable" => SQLSRV_CURSOR_KEYSET );
        if (! $queryResource = sqlsrv_query($this->_dbConn, $sql, $params, $options	))
            die ("MySQL Query Error");
        $this->_queryResource = $queryResource;
        return $queryResource;        
    }
	
    /** Get array return by MySQL */
    function fetch_array()
    {
        return sqlsrv_fetch_array($this->_queryResource, SQLSRV_FETCH_ASSOC);
    }
    
    function get_num_rows()
    {
        return sqlsrv_num_rows($this->_queryResource);
    }

    /** Get the cuurent id */    
    function get_insert_id()
    {
        return mysql_insert_id($this->_dbConn);
    } 
    
    function close_db(){
        return sqlsrv_close($this->_dbConn);
    }
}

	function sqlsrvfyTableName($tablename){
		return '"'.$tablename.'"';
	}
?>