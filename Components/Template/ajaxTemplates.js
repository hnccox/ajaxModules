'use strict';

import { default as ajax } from "/e107_plugins/ajaxDBQuery/client/js/ajaxDBQuery.js";
import { default as jsonSQL } from "/e107_plugins/jsonSQL/js/jsonSQL.js";

class ajaxTemplate {
	constructor(element, index, templateOptions = {}) {
		console.log("ajaxTemplate constructor");

		element.dataset.index = index;
		element.setAttribute("id", `ajaxTemplates[${index}]`);
		if (!element.dataset.key) { element.dataset.key = index }

		// while (element.firstChild) {
		// 	element.removeChild(element.firstChild);
		// }

		for (const [key, value] of Object.entries(templateOptions)) {
			this[key] = value;
		}

		this.index = index;
		this.element = element;

		this.colors = {};
		this.colors.consoleLog = '#FFFFFF';
		this.colors.consoleInfo = '#28a745';
		this.colors.consoleWarn = '#FFFF00';
		this.colors.consoleError = '#FF0000';
		this.colors.consoleSuccess = '#28a745';

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
		// Do we need to make a database query?

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

			let template = this.element;
			let method = "GET";
			let sql = {
				"url": template.dataset.url,
				"db": template.dataset.db,
				"query": JSON.parse(jsonSQL.query.replace(template.dataset.query, [":uid"], [i]))
			}
			ajax(method, sql, this.templateTabulate.bind(this));

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

		if (this.element.dataset.parent && origin !== this.element.dataset.parent) {
			let parent = document.querySelector(`[id='${this.element.dataset.parent}']`);
			console.log(`${this.element.id} -> ${parent.id}`);
			switch (parent?.dataset?.ajax) {
				case "map":
					window["ajaxMaps"][parent.dataset.index].eventReceiver(e, i, this.element.id);
					break;
				case "table":
					window["ajaxTables"][parent.dataset.index].eventReceiver(e, i, this.element.id);
					break;
				case "template":
					window["ajaxTemplates"][parent.dataset.index].eventReceiver(e, i, this.element.id);
					break;
				default:
					break;
			}
		}

		let childMaps = document.querySelectorAll(`[data-ajax='map'][data-parent='${this.element.id}']`);
		childMaps.forEach((map) => {
			if (map.id === origin) { return; }
			console.log(`${this.element.id} -> ${map.id}`);
			window["ajaxMaps"][map.dataset.index].eventReceiver(e, i, this.element.id);
		});

		let childTables = document.querySelectorAll(`[data-ajax='table'][data-parent='${this.element.id}']`);
		childTables.forEach((table) => {
			if (table.id === origin) { return; }
			console.log(`${this.element.id} -> ${table.id}`);
			window["ajaxTables"][table.dataset.index].eventReceiver(e, i, this.element.id);
		});

		let childTemplates = document.querySelectorAll(`[data-ajax='template'][data-parent='${this.element.id}']`);
		childTemplates.forEach((template) => {
			if (template.id === origin) { return; }
			console.log(`${this.element.id} -> ${template.id}`);
			window["ajaxTemplates"][template.dataset.index].eventReceiver(e, i, this.element.id);
		});

	}

	templateCreate() {
		console.info(`%ctemplateCreate: ${this.element.id}`, `color:${this.colors.consoleInfo}`);

		let self = this;
		let template = this.element;

		// let htmlRelativeUrl = this.element.dataset.htmlRelativeUrl;
		// let baseUrl = this.element.dataset.baseUrl;
		// const htmlUrl = new URL(htmlRelativeUrl, baseUrl).href;
		// let template = fetch(htmlUrl).then((response) => { response.text()});

		//console.log(template);

		if (!template.dataset.parent) {
			let method = "GET";
			let sql = {
				"url": template.dataset.url,
				"db": template.dataset.db,
				"query": JSON.parse(template.dataset.query)
			}
			ajax(method, sql, this.templateTabulate.bind(this));
		}

	}

	templateCallback(element) {
		console.info(`%ctemplateCallback`, `color:${this.colors.consoleWarn}`);
		if (this?._templateCallback?.functions) {
			let callbacks = this._templateCallback.functions;
			Object.keys(callbacks).forEach(function (value) {
				callbacks[value](element);
			})
		}
	}

	templateTabulate(response) {
		console.info(`%ctemplateTabulate`, `color:${this.colors.consoleInfo}`);
		if (response.type !== "success") return response;

		let self = this;
		let template = this.element;

		const obj = this.parseResponse?.(response) || response;
		const data = obj.data;
		const dataset = obj.dataset;
		const records = obj?.records || 1;
		const totalrecords = obj?.totalrecords || 1;

		Object.keys(dataset).forEach(function (key) {
			// Is our value a string or an object/array?
			var NodeList = self.element.querySelectorAll('[data-variable="' + key + '"]');
			NodeList.forEach(function (el) {

				[...el.attributes].forEach((attr) => {
					attr.value = attr.value.replace(':data-variable', dataset[key]);
				});

				if (el.hasAttribute('v-dateformat')) {
					var date = new Date(Date.parse(dataset[key]));
					switch (el.getAttribute('v-dateformat')) {
						case "dd-mm-yyyy":
							dataset[key] = ('0' + date.getDate()).slice(-2) + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + date.getFullYear();
							break;
						case "yyyy-mm-dd":
							dataset[key] = date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
							break;
						default:
							dataset[key] = ('0' + date.getDate()).slice(-2) + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + date.getFullYear();
					}
				}

				switch (el.tagName) {
					case "A":
						if (el.innerHTML === '') {
							el.textContent = dataset[key];
						}
						break;
					case "INPUT":
						el.value = dataset[key];
						break;
					default:
						el.textContent = dataset[key];
				}
			});

		});

		template.dataset.id = dataset[Object.keys(dataset)[0]];

		// TODO: undefined?
		this.obj = obj;
		this.templateCallback(template);

	}

}

// create new link tag
var link = document.createElement('link');

// set properties of link tag
link.href = '/e107_plugins/ajaxModules/Components/Template/ajaxTemplates.css';
link.rel = 'stylesheet';
link.type = 'text/css';
// link.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css';
// link.href = 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.1.3/js/bootstrap.min.js';
// link.href = 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.1.3/css/bootstrap.min.css';

// Loaded successfully
link.onload = function () {
	console.log('success');
};

// Loading failed
link.onerror = function () {
	console.log('error');
};

// append link element to html
document.body.appendChild(link);

export default ajaxTemplate;
