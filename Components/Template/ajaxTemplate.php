<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

function ajaxTemplate($sqlParams, $templateParams, $templateProps = []) {

	$sqlParams = array_merge(
		array('offset' => 0, 'limit' => 1), 
		$sqlParams
	);

	$templateParams = array_merge(
		array('template' => ''),
		$templateParams
	);

	$templateProps = array_merge(
		array('class' => 'template', 'style' => '', 'height' => '100%', 'width' => '100%'),
		$templateProps
	);

	$url = ($templateParams['template'] !== '' ? $templateParams['template'] : basename(substr($_SERVER["SCRIPT_NAME"],strrpos($_SERVER["SCRIPT_NAME"],"/") + 1 ), '.php').'.Template.html' );  
	$lines_array = file($url);
	$lines_string = implode('', $lines_array);

	$output = '
	<div class="'.$templateProps['class'].'" style="'.$templateProps['style'].'"
		data-ajax="template" 
		data-parent=\''.$templateParams['parent'].'\'
		data-url=\''.$sqlParams['url'].'\' 
		data-db=\''.$sqlParams['db'].'\' 
		data-table=\''.$sqlParams['table'].'\'
		data-columns=\''.$sqlParams['columns'].'\'
		data-limit=\''.$sqlParams['limit'].'\'
		data-offset=\''.$sqlParams['offset'].'\'
		data-query=\''.$sqlParams['query'].'\'>
		'.$lines_string.'
	</div>';

	return $output;

}

return ajaxTemplate($sqlParams, $templateParams, $templateProps);

?>