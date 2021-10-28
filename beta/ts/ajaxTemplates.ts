
'use strict';

import { default as ajax } from "/e107_plugins/ajaxDBQuery/beta/js/ajaxDBQuery.js";

class ajaxTemplate {
	constructor(element, index, object = {}) {
		console.log("ajaxTemplate constructor");

		for (const [key, value] of Object.entries(object)) {
			this[key] = value;
		}

		//this.callbacks = callbacks;
		this.element = element;
		this.index = index;

		element.dataset.key = index;
		element.setAttribute("id", "ajaxTemplates[" + index + "]");

		if (!element.dataset.master) {
			let method = "GET";
			let sql = {
				"url": element.dataset.url,
				"db": element.dataset.db,
				"query": JSON.parse(element.dataset.query)
			}
			ajax(method, sql, this.templateTabulate.bind(this));

		}

		this.dataset = {};
		this.dataset.columns = element.dataset.columns;
		this.dataset.order_by = element.dataset.order_by;
		this.dataset.where = element.dataset.where;

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

	eventTransmitter(e, i) {
		/*
		console.log("TEMPLATE eventTransmitter");
		console.log(e.type);
		console.log(i);
		*/
		/*
		let slaveTemplates = document.querySelectorAll('[data-ajax="template"][data-master="' + this.element.id + '"]');
		slaveTemplates.forEach((template) => {
			ajaxTemplates[template.dataset.key].eventReceiver(e, i);
		});
		*/
	}

	eventReceiver(e, i) {
		console.log("eventReceiver");

		if (this.selectedDetail == i) {
			return;
		}

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
			this.selectedDetail = i;

			//element.dataset.columns = this.dataset.columns;
			//element.dataset.order_by = this.dataset.order_by;
			this.element.dataset.where = this.dataset.where;
			//element.dataset.columns = element.dataset.columns.replace(":lat", lat).replace(":lng", lng);
			//element.dataset.order_by = element.dataset.order_by.replace(":lat", lat).replace(":lng", lng);
			this.element.dataset.where = this.element.dataset.where.replace(":uid", i);

			let method = "GET";
			let sql = {
				"url": this.element.dataset.url,
				"db": this.element.dataset.db,
				"query": JSON.parse(this.element.dataset.query)
			}

			ajax(method, sql, this.templateTabulate.bind(this));
			/*
			let slaveTables = document.querySelectorAll('[data-ajax="table"][data-master="' + this.element.id + '"]');
			slaveTables.forEach((table) => {
				ajax(table, ajaxTables[table.dataset.index].tableTabulate.bind(ajaxTables[table.dataset.index]);
			});
			*/
			//this.eventTransmitter(e, i);
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

	templateCallback() {
		console.log("templateCallback");

		let data = this.data;

		// TO DO: send "update" event to Receivers
		console.log(this.element.id);
		let slaveTables = document.querySelectorAll('[data-ajax="table"][data-master="' + this.element.id + '"]');
		slaveTables.forEach((table) => {
			table.dataset.where = this.element.dataset.where;
			let method = "GET";
			let sql = {
				"url": table.dataset.url,
				"db": table.dataset.db,
				"query": JSON.parse(table.dataset.query)
			};
			ajax(method, sql, ajaxTables[table.dataset.index].tableTabulate.bind(ajaxTables[table.dataset.index]));
		});

		if (this._templateCallback.functions) {
			let callbacks = this._templateCallback.functions;
			Object.keys(callbacks).forEach(function (value) {
				callbacks[value](data);
			})
		}
	}

	templateTabulate(response) {
		console.log("templateTabulate");
		console.log(response);

		let template = this.element;
		let self = this;

		const obj = response.data.dataset;
		const records = obj["records"];
		const totalrecords = obj["totalrecords"];
		delete obj.records;
		delete obj.totalrecords;

		Object.keys(obj[0]).forEach(function (key) {
			var NodeList = self.element.querySelectorAll('[data-variable="' + key + '"]');
			NodeList.forEach(function (el) {
				if (el.tagName == "INPUT") {
					if (el.type == "date") {
						var date = new Date(Date.parse(obj[0][key]));
						obj[0][key] = date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
					}
					el.value = obj[0][key];
				} else {
					if (key == "drilldate") {
						var date = new Date(Date.parse(obj[0][key]));
						obj[0][key] = ('0' + date.getDate()).slice(-2) + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + date.getFullYear();
					}
					el.innerHTML = obj[0][key];
				}
			});

		});

		template.dataset.id = obj[0][Object.keys(obj[0])[0]];

		// TODO: undefined?
		this.data = obj;
		this.templateCallback(template);

	}

}

export default ajaxTemplate;
