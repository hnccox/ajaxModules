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
		array('coords' => ["52.0907", "5.1214"], 'zoom' => 7, 'minZoom' => 3, 'maxZoom' => 13, 'zoomLevel' => 13),
		$mapParams
	);

	$mapProps = array_merge(
		array('class' => 'square', 'style' => '', 'height' => '100%', 'width' => '100%'),
		$mapProps
	);

    $output = '
	<div class="'.$mapProps['class'].'" style="width:'.$mapProps['width'].';height:'.$mapProps['height'].';">
		<div class="leaflet map"
			data-ajax="map"
			data-lat="'.$mapParams['coords'][0].'"
			data-lng="'.$mapParams['coords'][1].'"
			data-zoom="'.$mapParams['zoom'].'"   
			data-min-zoom="'.$mapParams['minZoom'].'"
			data-max-zoom="'.$mapParams['maxZoom'].'"
			data-zoomlevel="'.$mapParams['zoomLevel'].'">
		</div>
	</div>';

    return $output;
}

return ajaxMap($sqlParams, $mapParams, $mapProps);

?>