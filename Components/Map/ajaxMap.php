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
		array('coords' => ["52.0907", "5.1214"], 'zoom' => 7, 'min-zoom' => 3, 'max-zoom' => 13, 'zoomlevel' => 13),
		$mapParams
	);

	$mapProps = array_merge(
		array('class' => 'map', 'style' => '', 'height' => '100%', 'width' => '100%'),
		$mapProps
	);

    $output = '
	<div class="'.$mapProps['type'].'" style="width:'.$mapProps['width'].';height:'.$mapProps['height'].';">
		<div class="leaflet map"
			data-type="parent"
			data-ajax="map"
			data-lat="52.0907"
			data-lng="5.1214"
			data-zoom="7"   
			data-min-zoom="7"
			data-max-zoom="12"
			data-zoomlevel="13">
		</div>
	</div>';

    return $output;
}

return ajaxMap($sqlParams, $mapParams, $mapProps);

?>