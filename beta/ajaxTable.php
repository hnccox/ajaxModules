<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

function createAjaxTable($sqlParams, $tableParams) {

	$sqlParams = array_merge(
		array('inner_join' => '', 'order_by' => '', 'direction' => '', 'offset' => 1, 'limit' => 20), 
		$sqlParams
	);

	$tableParams = array_merge(
		array('caption' => '', 'columnNames' => $sqlParams['columns'], 'preview' => 3, 'expanded' => false, 'href' => true, 'totalrecords' => true, 'add' => true),
		$tableParams
	);

	if( count(explode(",", $sqlParams['columns'])) !== count(explode(",", $tableParams['columnNames'])) ) { return null; }
	$columnArr = explode(",", $sqlParams['columns']);
	$columnNamesArr = explode(",", $tableParams['columnNames']);
	if( $sqlParams['order_by'] == '' ) { $sqlParams['order_by'] = $columnArr[0]; }
	($tableParams['expanded'] === true) ? ($aria_expanded = "aria-expanded") : ($aria_expanded = "");

	$output =  '<table class="table table-hover" data-ajax="table" data-url="'.$sqlParams['url'].'" data-db="'.$sqlParams['db'].'" data-table="'.$sqlParams['table'].'" data-columns="'.$sqlParams['columns'].'" data-inner_join="'.$sqlParams['inner_join'].'" data-where="'.$sqlParams['where'].'" data-order_by="'.$sqlParams['order_by'].'" data-direction="'.$sqlParams['direction'].'" data-page="'.$sqlParams['offset'].'" data-limit="'.$sqlParams['limit'].'" data-columnnames="'.$tableParams['columnNames'].'" data-preview="'.$tableParams['preview'].'" data-href="'.$tableParams['href'].'" data-add="'.$tableParams['add'].'" '.$aria_expanded.'>
				<caption>'.$tableParams['caption'].'</caption>
				<thead>
					<tr>';
	for($i = 0; $i < count($columnArr); $i++) {
			$output .= '<th data-column="'.$columnArr[$i].'">
							<button class="btn btn-primary btn-xs" type="submit" data-value="&uArr;" onclick="this.tableSort(this);"><span>&uArr;</span></button>
							<button class="btn btn-primary btn-xs" type="submit" data-value="&dArr;" onclick="this.tableSort(this);"><span>&dArr;</span></button>
							<span>'.$columnNamesArr[$i].'</span>
						</th>';
	}
		$output .= '</tr>
				</thead>';
	($tableParams['href'] === false) ? ($output .= '<tbody data-href="false"></tbody>') : ($output .= '<tbody></tbody>');
	if($sqlParams['limit'] == null) {
		$output .= '
				<tfoot class="table-footer">
					<tr>
						<th></th>';
		if($tableParams['totalrecords'] == true) {
			$output .= '<th class="totalrecords"></th>';
		} else { $output .= '<th>...</th>'; }	
		for($i = 3; $i < count($columnArr); $i++) {
			$output .= '<th>...</th>';
		}
		if($tableParams['add'] == true) {
			$output .= '<th class="table-buttons">
							<button type="button" class="btn btn-primary btn-xs" onclick="tableAddData;">
								<span class="glyphicon glyphicon-plus" aria-hidden="true"></span> Add
							</button>
						</th>';
		} else { $output .= '<th>...</th>'; }
		$output .= '</tr>
				</tfoot>
				</table>';		
	} else {
		$output .= '
				<tfoot class="table-footer">
					<tr>
						<th class="table-buttons">
							<div class="btn-group">
								<button type="button" class="btn btn-primary btn-xs" data-toggle="collapse" data-target="" aria-expanded="true" aria-controls="" onclick="tableToggle(this);">
									<span class="glyphicon glyphicon-chevron-down" aria-hidden="true"></span>
								</button>
								<button type="button" class="btn btn-default btn-xs dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
									<span>'.$sqlParams['limit'].'</span> <span class="caret"></span>
									<span class="sr-only">Toggle Dropdown</span>
								</button>
								<ul class="dropdown-menu" style="min-width:unset">
									<li><a href="#" onclick="tableLimit(this);return false;">20</a></li>
									<li><a href="#" onclick="tableLimit(this);return false;">50</a></li>
									<li><a href="#" onclick="tableLimit(this);return false;">100</a></li>
								</ul>
							</div>
						</th>'; 
		if($tableParams['totalrecords'] == true) {
			$output .= '<th class="totalrecords"></th>';
		} else { $output .= '<th>...</th>'; }					
		for($i = 3; $i < count($columnArr); $i++) {
			$output .= '<th>...</th>';
		}
		if($tableParams['add'] == true) {
			$output .= '<th class="table-buttons">
							<button type="button" class="btn btn-primary btn-xs" onclick="tableAddData;">
								<span class="glyphicon glyphicon-plus" aria-hidden="true"></span> Add
							</button>
						</th>';
		} else { $output .= '<th>...</th>'; }
		$output .= '</tr>
					<tr class="navigation collapse">
						<th colspan="'.count($columnArr).'">
							<nav aria-label="Page navigation" class="text-center">
								<ul class="pagination btn-group">
									<li class="disabled"><a href="#" data-nav="prev" onclick="tablePagination(this);return false;"><span aria-hidden="true">&laquo;</span></a></li>
									<li class="">
										<span type="button" class="currentpage" contenteditable="true">1</span>
									</li>
									<li class=""><a href="#" data-nav="next" onclick="tablePagination(this);return false;"><span aria-hidden="true">&raquo;</span></a></li>
								</ul>
							</nav>
						</th>
					</tr>
				</tfoot>
				</table>';
	}
	
	return $output;
}

?>