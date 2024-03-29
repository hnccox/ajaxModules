<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

function ajaxMenu($sqlParams, $menuParams) {

    $sqlParams = array_merge(
		array('db' => '', 'table' => '', 'columns' => '', 'offset' => '', 'limit' => ''), 
		$sqlParams
	);

    $menuParams = array_merge(
		array('caption' => '', 'columnNames' => $sqlParams['columns'], 'preview' => 3, 'expanded' => false, 'href' => true, 'totalrecords' => true, 'add' => true),
		$menuParams
	);

    $output = "";

    return $output;
}

return ajaxMenu($sqlParams, $menuParams);

?>