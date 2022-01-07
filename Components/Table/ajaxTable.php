<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

function ajaxTable($sqlParams, $tableParams, $tableProps = []) {

	$sqlParams = array_merge(
		array('direction' => '', 'offset' => 1, 'limit' => 20), 
		$sqlParams
	);

	$tableParams = array_merge(
		array('caption' => '', 'columnNames' => $sqlParams['columns'], 'preview' => 3, 'expanded' => false, 'href' => true, 'totalrecords' => true, 'add' => true),
		$tableParams
	);

	$tableProps = array_merge(
		array('class' => 'table table-hover', 'style' => ''),
		$tableProps
	);

	$output = '
	<div>
		<table class="'.$tableProps['class'].'" style="'.$tableProps['style'].'"
			data-ajax="table"
			data-parent=\''.$sqlParams['parent'].'\'
			data-url=\''.$sqlParams['url'].'\' 
			data-db=\''.$sqlParams['db'].'\' 
			data-table=\''.$sqlParams['table'].'\'
			data-columns=\''.$sqlParams['columns'].'\'
			data-query=\''.$sqlParams['query'].'\'
			data-limit=\''.$sqlParams['limit'].'\'
			data-page=\''.$sqlParams['offset'].'\'
			data-caption=\''.$tableParams['caption'].'\'
			data-columnnames=\''.$tableParams['columnNames'].'\'
			data-columnsortable=\''.$tableParams['columnSortable'].'\'
			data-preview=\''.$tableParams['preview'].'\'
			data-href=\''.$tableParams['href'].'\'
			data-totalrecords=\''.$tableParams['totalrecords'].'\'
			data-add=\''.$tableParams['add'].'\'
			'.$tableParams['expanded'].'>
			<caption>'.$tableParams['caption'].'</caption>
		</table>
	</div>';

	return $output;
}

return ajaxTable($sqlParams, $tableParams, $tableProps)

?>