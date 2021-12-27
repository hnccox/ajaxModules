<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

function ajaxForm($sqlParams, $formParams) {

    $sqlParams = array_merge(
		array('db' => '', 'table' => '', 'columns' => '', 'offset' => '', 'limit' => ''), 
		$sqlParams
	);

    $formParams = array_merge(
		array('caption' => '', 'columnNames' => $sqlParams['columns'], 'preview' => 3, 'expanded' => false, 'href' => true, 'totalrecords' => true, 'add' => true),
		$formParams
	);

    $output = "";

    return $output;
}

return ajaxForm($sqlParams, $formParams);

?>