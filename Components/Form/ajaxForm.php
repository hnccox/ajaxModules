<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

function ajaxForm($sqlParams, $formParams, $formProps = []) {

    $sqlParams = array_merge(
		array('db' => '', 'table' => '', 'columns' => '*', 'offset' => 0, 'limit' => 1), 
		$sqlParams
	);

    $formParams = array_merge(
		array('caption' => '', 'columnNames' => $sqlParams['columns'], 'preview' => 3, 'expanded' => false, 'href' => true, 'totalrecords' => true, 'add' => true),
		$formParams
	);

	$formProps = array_merge(
		array('method' => '', 'class' => 'form form-hover', 'style' => '', 'height' => '100%', 'width' => '100%'),
		$formProps
	);

    $output = '
	<div class="'.$formProps['class'].'" style="width:'.$formProps['width'].';height:'.$formProps['height'].';">
		<form method="'.$formProps['method'].'" style="'.$formProps['style'].'"
			data-ajax="form"
			data-url=\''.$sqlParams['url'].'\' 
			data-db=\''.$sqlParams['db'].'\' 
			data-table=\''.$sqlParams['table'].'\'
			data-columns=\''.$sqlParams['columns'].'\'
			data-limit=\''.$sqlParams['limit'].'\'
			data-offset=\''.$sqlParams['offset'].'\'
			data-query=\''.$sqlParams['query'].'\'>
		</form>
	</div>';

    return $output;
}

return ajaxForm($sqlParams, $formParams, $formProps);

?>