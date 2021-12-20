
'use strict';

import { default as ajax } from "/e107_plugins/ajaxDBQuery/beta/js/ajaxDBQuery.js";
import { default as jsonSQL } from "/e107_plugins/jsonSQL/js/jsonSQL.js";

class ajaxTemplate {
	constructor(element, index, templateOptions = {}) {
		console.log("ajaxTemplate constructor");

		this.colors = {};
		this.colors.consoleLog = '#FFFFFF';
		this.colors.consoleInfo = '#28a745';
		this.colors.consoleWarn = '#FFFF00';
		this.colors.consoleError = '#FF0000';
		this.colors.consoleSuccess = '#28a745';

		while (element.firstChild) {
			element.removeChild(element.firstChild);
		}

		for (const [key, value] of Object.entries(templateOptions)) {
			this[key] = value;
		}

		//this.callbacks = callbacks;
		this.element = element;
		this.index = index;

		// this.dataset = {};
		// this.dataset.columns = element.dataset.columns;
		// this.dataset.order_by = element.dataset.order_by;
		// this.dataset.where = element.dataset.where;

		element.dataset.key = index;
		element.setAttribute("id", `ajaxTemplates[${index}]`);

		this.templateCreate();

	}

	get Dataset() {
		return this.element.dataset;
	}

	get Index() {
		return this.index;
	}

	get Data() {
		return JSON.parse(this.data);
	}

	eventReceiver(e, i, origin) {
		console.info(`%c${this.element.id} eventReceiver: %c${e.type}`, `color:${this.colors.consoleInfo}`, `color:#fff`);

		if (this.selectedDetail == i) {
			this.eventTransmitter(e, i, origin);
			return;
		}

		let self = this;

		const mouseover = () => {
			//console.log(i);
		}

		const mouseout = () => {
			//console.log(i);
		}

		const mousedown = () => {
			//console.log(i);
		}

		const mouseup = () => {
			//console.log(i);
		}

		const click = () => {
			//console.log(i);
			//element.dataset.columns = this.dataset.columns;
			//element.dataset.order_by = this.dataset.order_by;
			//this.element.dataset.where = this.dataset.where;
			//element.dataset.columns = element.dataset.columns.replace(":lat", lat).replace(":lng", lng);
			//element.dataset.order_by = element.dataset.order_by.replace(":lat", lat).replace(":lng", lng);
			//this.element.dataset.where = this.element.dataset.where.replace(":uid", i);

			// let query = null; //JSON.parse(this.element.dataset.query) || null;
			// let method = "GET";
			// let sql = {
			// 	"url": template.dataset.url,
			// 	"db": template.dataset.db,
			// 	"query": JSON.parse(template.dataset.query)
			// }
			// sql = jsonSQL.query.replace(sql, [":uid"], [i]);
			// ajax(method, sql, this.templateTabulate.bind(this));
			/*
			let slaveTables = document.querySelectorAll('[data-ajax="table"][data-master="' + this.element.id + '"]');
			slaveTables.forEach((table) => {
				ajax(table, ajaxTables[table.dataset.key].tableTabulate.bind(ajaxTables[table.dataset.key]);
			});
			*/
			this.selectedDetail = i;
			this.eventTransmitter(e, i, origin);
		}


		switch (e.type) {
			case "mouseover":
				mouseover();
				break;
			case "mouseout":
				mouseout();
				break;
			case "mousedown":
				mousedown();
				break;
			case "mouseup":
				mouseup();
				break;
			case "click":
				click();
				break;
			default:
				break;
		}
	}

	eventTransmitter(e, i, origin = this.element.id) {
		console.info(`%c${this.element.id} eventTransmitter: %c${e.type}`, `color:${this.colors.consoleInfo}`, `color:#fff`);

		/* 
			If event comes from parent -> send to children
			If event comes from child -> send to parent and (children - child)
		*/
	
		if (this.element.dataset.master && origin !== this.element.dataset.master) {
			let parent = document.querySelector(`[id='${this.element.dataset.master}']`);
			console.log(`${this.element.id} -> ${parent.id}`);
			switch(parent?.dataset?.ajax) {
				case "map":
					window["ajaxMaps"][parent.dataset.key].eventReceiver(e, i, this.element.id);
					break;
				case "table":
					window["ajaxTables"][parent.dataset.key].eventReceiver(e, i, this.element.id);
					break;
				case "template":
					window["ajaxTemplates"][parent.dataset.key].eventReceiver(e, i, this.element.id);
					break;
				default:
					break;
			}
		}

		let childMaps = document.querySelectorAll(`[data-ajax='map'][data-master='${this.element.id}']`);
		childMaps.forEach((map) => {
			if (map.id === origin) { return; }
			console.log(`${this.element.id} -> ${map.id}`);
			window["ajaxMaps"][map.dataset.key].eventReceiver(e, i, this.element.id);
		});
		
        let childTables = document.querySelectorAll(`[data-ajax='table'][data-master='${this.element.id}']`);
        childTables.forEach((table) => {
            if (table.id === origin) { return; }
			console.log(`${this.element.id} -> ${table.id}`);
            window["ajaxTables"][table.dataset.key].eventReceiver(e, i, this.element.id);
        });

        let childTemplates = document.querySelectorAll(`[data-ajax='template'][data-master='${this.element.id}']`);
        childTemplates.forEach((template) => {
            if (template.id === origin) { return; }
			console.log(`${this.element.id} -> ${template.id}`);
            window["ajaxTemplates"][template.dataset.key].eventReceiver(e, i, this.element.id);
        });

	}

	templateCreate() {
		console.info(`%ctemplateCreate`, `color:${this.colors.consoleInfo}`);

		let self = this;
		let template = this.element;

		// let htmlRelativeUrl = this.element.dataset.htmlRelativeUrl;
		// let baseUrl = this.element.dataset.baseUrl;
		// const htmlUrl = new URL(htmlRelativeUrl, baseUrl).href;
		// let template = fetch(htmlUrl).then((response) => { response.text()});

		//console.log(template);

		if (!template.dataset.master) {
			let method = "GET";
			let sql = {
				"url": template.dataset.url,
				"db": template.dataset.db,
				"query": JSON.parse(template.dataset.query)
			}
			ajax(method, sql, this.templateTabulate.bind(this));
		}

	}

	templateCallback() {
		console.info(`%ctemplateCallback`, `color:${this.colors.consoleWarn}`);
		if (this?._templateCallback?.functions) {
			let callbacks = this._templateCallback.functions;
			Object.keys(callbacks).forEach(function (value) {
				callbacks[value](element);
			})
		}
	}

	templateTabulate(response) {
		console.info(`%ctemplateTabulate`, `color:${this.colors.consoleWarn}`);
		if (response.type !== "success") return response;

		console.log("templateTabulate");
		console.log(response);

		let self = this;
		let template = this.element;

		const obj = this.parseResponse?.(response) || response;
		const data = obj.data;
		const dataset = obj.dataset;
		const records = obj?.records || 1;
		const totalrecords = obj?.totalrecords || 1;

		// console.log(data);
		// console.log(dataset);
		// console.log(records);
		// console.log(totalrecords);
		//const obj = response.data.dataset;
		// const records = obj["records"];
		// const totalrecords = obj["totalrecords"];
		// delete obj.records;
		// delete obj.totalrecords;

		// TODO: This isnt just for drilldate! Data can be in sub arrays!
		// function isJSON(str) {
		//     try {
		//         return (JSON.parse(str) && !!str);
		//     } catch (e) {
		//         return false;
		//     }
		// }
		Object.keys(dataset).forEach(function (key) {
			// Is our value a string or an object/array?
			var NodeList = self.element.querySelectorAll('[data-variable="' + key + '"]');
			//console.log(key, NodeList);
			NodeList.forEach(function (el) {
				if (el.tagName == "INPUT") {
					if (el.type == "date") {
						var date = new Date(Date.parse(dataset[key]));
						dataset[key] = date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
					}
					el.value = dataset[key];
				} else {
					if (key == "drilldate") {
						var date = new Date(Date.parse(dataset[key]));
						dataset[key] = ('0' + date.getDate()).slice(-2) + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + date.getFullYear();
					}
					el.innerHTML = dataset[key];
				}
			});

		});

		template.dataset.id = dataset[Object.keys(dataset)[0]];

		// TODO: undefined?
		this.obj = obj;
		this.templateCallback(template);

	}

}

export default ajaxTemplate;
