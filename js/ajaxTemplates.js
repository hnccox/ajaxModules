'use strict';

import { default as ajax } from "/e107_plugins/ajaxDBQuery/js/ajaxDBQuery.js";
import { default as storageHandler } from "/e107_plugins/storageHandler/js/storageHandler.js";

class ajaxTemplate {
	constructor(element, index, object = {}) {
		console.log("ajaxTemplate constructor");

		for (const [key, value] of Object.entries(object)) {
			this[key] = value;
		}

        //this.callbacks = callbacks;
        this.element = element;
        this.index = index;
        this.dataset = {};
        this.dataset.columns = element.dataset.columns;
        this.dataset.order_by = element.dataset.order_by;
        this.dataset.where = element.dataset.where;

		element.dataset.key = index;
		element.setAttribute("id", "Templates[" + index + "]");

		if (!element.dataset.master) {
			ajax(element, this.templateTabulate.bind(this));
		}

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
			Templates[template.dataset.key].eventReceiver(e, i);
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

			ajax(this.element, this.templateTabulate.bind(this));
			/*
			let slaveTables = document.querySelectorAll('[data-ajax="table"][data-master="' + this.element.id + '"]');
			slaveTables.forEach((table) => {
				ajax(table, Tables[table.dataset.index].tableTabulate.bind(Tables[table.dataset.index]);
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

		// TO DO: send "update" event to Receivers
		let slaveTables = document.querySelectorAll('[data-ajax="table"][data-master="' + this.element.id + '"]');
		slaveTables.forEach((table) => {
			table.dataset.where = this.element.dataset.where;
			ajax(table, Tables[table.dataset.index].tableTabulate.bind(Tables[table.dataset.index]));
		});

		if (this._templateCallback.functions) {
			let callbacks = this._templateCallback.functions;
			Object.keys(callbacks).forEach(function (value) {
				callbacks[value]();
			})
		}
	}

	templateTabulate(element, data) {
		console.log("templateTabulate");
		
		this.data = data;
        let self = this;

		let obj = JSON.parse(data);
		let totalrecords = obj["totalrecords"];  // Should always be "1"
		let dataset = obj[0];
		
		Object.keys(dataset).forEach(function (key) {
			var NodeList = self.element.querySelectorAll('[data-variable="' + key + '"]');
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

		element.dataset.id = dataset[Object.keys(dataset)[0]];

		// TODO: undefined?
		this.data = data;
		this.templateCallback(element);

	}
	
}

export default ajaxTemplate;
