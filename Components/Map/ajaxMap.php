<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

function ajaxMap($sqlParams, $mapParams, $mapProps = []) {

    $sqlParams = array_merge(
		array('db' => '', 'table' => '', 'columns' => '', 'offset' => '', 'limit' => ''), 
		$sqlParams
	);

    $mapParams = array_merge(
		array('caption' => '', 'columnNames' => $sqlParams['columns'], 'preview' => 3, 'expanded' => false, 'href' => true, 'totalrecords' => true, 'add' => true),
		$mapParams
	);

	$mapProps = array_merge(
		array('class' => 'map', 'style' => ''),
		$mapProps
	);

    $output = '';

    return $output;
}

return ajaxMap($sqlParams, $mapParams, $mapProps);

?>