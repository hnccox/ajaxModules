'use strict'

import { default as ajaxMap } from "/e107_plugins/ajaxModules/Components/Map/ajaxMaps.js";
import { default as ajaxTable } from "/e107_plugins/ajaxModules/Components/Table/ajaxTables.js";
import { default as ajaxTemplate } from "/e107_plugins/ajaxModules/Components/Template/ajaxTemplates.js";
import { default as ajaxForm } from "/e107_plugins/ajaxModules/Components/Form/ajaxForms.js";
import { default as ajaxMenu } from "/e107_plugins/ajaxModules/Components/Menu/ajaxMenus.js";

(function () {

	window["ajaxMaps"] = [];
	window["ajaxTables"] = [];
	window["ajaxTemplates"] = [];
	window["ajaxForms"] = [];
	window["ajaxMenus"] = [];

	if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
		var layer = "dark";
	} else {
		var layer = "light";
	}

	document.addEventListener('DOMContentLoaded', () => {

		const maps = document.querySelectorAll('div[data-ajax="map"]');
		maps.forEach((element, key) => {
			var mapOptions = {
				_defaults: {
					lat: parseFloat(element.dataset.lat, 10),
					lng: parseFloat(element.dataset.lng, 10),
					zoom: parseInt(element.dataset.zoom, 10),
					geolocation: true,
					// minZoom: parseInt(element.dataset.minZoom, 10),
					// maxZoom: parseInt(element.dataset.maxZoom, 10)
				},
				_baseMaps: {
					layers: layer
				},
				_mapCallback: {
					functions: {}
				}
			}
			window["ajaxMaps"][key] = new ajaxMap(element, key, mapOptions);
		})

		const tables = document.querySelectorAll('table[data-ajax="table"]');
		tables.forEach((element, key) => {
			var tableOptions = {
				parseResponse: function (response) {
					const type = response.type;
					const data = response.data;
					const dataset = response.data.dataset;
					const records = data.records;
					const totalrecords = data.totalrecords;
					return { type, data, dataset, records, totalrecords };
				},
				_tableCallback: {
					functions: {}
				}
			}
			window["ajaxTables"][key] = new ajaxTable(element, key, tableOptions);
		})

		const templates = document.querySelectorAll('div[data-ajax="template"]');
		templates.forEach((element, key) => {
			var templateOptions = {
				parseResponse: function (response) {
					const type = response.type;
					const data = response.data;
					const dataset = response.data.dataset[0];
					const records = data.records;
					const totalrecords = data.totalrecords;
					return { type, data, dataset, records, totalrecords };
				},
				_templateCallback: {
					functions: {}
				}
			}
			window["ajaxTemplates"][key] = new ajaxTemplate(element, key, templateOptions);
		})

		const forms = document.querySelectorAll('div[data-ajax="form"]');
		forms.forEach((element, key) => {
			var formOptions = {
				parseResponse: function (response) {
					const type = response.type;
					const data = response.data;
					const dataset = response.data.dataset[0];
					const records = data.records;
					const totalrecords = data.totalrecords;
					return { type, data, dataset, records, totalrecords };
				},
				_formCallback: {
					functions: {}
				}
			}
			window["ajaxForms"][key] = new ajaxForm(element, key, formOptions);
		})

		const menus = document.querySelectorAll('div[data-ajax="menu"]');
		menus.forEach((element, key) => {
			var menuOptions = {
				parseResponse: function (response) {
					const type = response.type;
					const data = response.data;
					const dataset = response.data.dataset;
					const records = data.records;
					const totalrecords = data.totalrecords;
					return { type, data, dataset, records, totalrecords };
				},
				_menuCallback: {
					functions: {}
				}
			}
			window["ajaxMenus"][key] = new ajaxMenu(element, key, menuOptions);
		})
	});

})();