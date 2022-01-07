<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

function ajaxTable($sqlParams, $templateParams, $templateProps = []) {

	$sqlParams = array_merge(
		array('direction' => '', 'offset' => 0, 'limit' => 1), 
		$sqlParams
	);

	$templateParams = array_merge(
		array('caption' => '', 'columnNames' => $sqlParams['columns'], 'preview' => 3, 'expanded' => false, 'href' => true, 'totalrecords' => true, 'add' => true),
		$templateParams
	);

	$templateProps = array_merge(
		array('class' => 'template', 'style' => ''),
		$templateProps
	);

	$output = '
		<div class="'.$templateProps['class'].'" style="'.$templateProps['style'].'"
			data-ajax="template" 
			data-parent=\''.$sqlParams['parent'].'\'
			data-url=\''.$sqlParams['url'].'\' 
			data-db=\''.$sqlParams['db'].'\' 
			data-table=\''.$sqlParams['table'].'\'
			data-columns=\''.$sqlParams['columns'].'\'
			data-query=\''.$sqlParams['query'].'\'
			data-limit=\''.$sqlParams['limit'].'\'
			data-page=\''.$sqlParams['offset'].'\'
			data-columnnames=\''.$templateParams['columnNames'].'\'
			data-columnsortable=\''.$templateParams['columnSortable'].'\'
			data-preview=\''.$templateParams['preview'].'\'
			data-href=\''.$templateParams['href'].'\'
			data-totalrecords=\''.$templateParams['totalrecords'].'\'
			data-add=\''.$templateParams['add'].'\'
			'.$templateParams['expanded'].'>
		</div>';

	return $output;

}

return ajaxTemplate($sqlParams, $templateParams, $templateProps);

?>