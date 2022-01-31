'use strict';

import { default as ajax } from "/e107_plugins/ajaxDBQuery/client/js/ajaxDBQuery.js";

class ajaxForm {
	constructor(element, index, formOptions = {}) {
		console.log("ajaxForm constructor");

		element.dataset.key = index;
		element.setAttribute("id", "Forms[" + index + "]");

		while (element.firstChild) {
			element.removeChild(element.firstChild);
		}

		for (const [key, value] of Object.entries(formOptions)) {
			this[key] = value;
		}

		this.index = index;
		this.element = element;

		this.formCreate();

		this.colors = {};
		this.colors.consoleLog = '#FFFFFF';
		this.colors.consoleInfo = '#28a745';
		this.colors.consoleWarn = '#FFFF00';
		this.colors.consoleError = '#FF0000';
		this.colors.consoleSuccess = '#28a745';
		
	}

	get Index() {
		return this.index;
	}

	get Data() {
		return JSON.parse(this.data);
	}

	get Query() {
		return JSON.parse(this.query);
	}

	get Dataset() {
		return this.element.dataset;
	}

	eventReceiver(e, i, origin) {
		console.info(`%c${this.element.id} eventReceiver: %c${e.type}`, `color:${this.colors.consoleInfo}`, `color:#fff`);

		if (this.selectedForm == i) {
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

	}

	formCallback() {
		console.log("formCallback");

		// TO DO: send "update" event to Receivers
		// let slaveTables = document.querySelectorAll('[data-ajax="table"][data-master="' + this.element.id + '"]');
		// slaveTables.forEach((table) => {
		//     table.dataset.where = this.element.dataset.where;
		//     ajax(table, "GET", Tables[table.dataset.index].tableTabulate.bind(Tables[table.dataset.index]));
		// });

		if (this._formCallback.functions) {
			let callbacks = this._formCallback.functions;
			Object.keys(callbacks).forEach(function (value) {
				callbacks[value]();
			})
		}
	}

	formTabulate(response) {

		console.log("tableTabulate");

		this.data = response.data;
		let self = this;

		const obj = response.data.dataset;
		const records = obj["records"];
		const totalrecords = obj["totalrecords"];  // Should always be "1"
		delete obj.records;
		delete obj.totalrecords;

		console.log(obj[0]);
		// If has releaseCandidate, we must query THAT table..

		Object.keys(obj[0]).forEach(function (key) {
			var elements = document.querySelectorAll(`[data-variable=${key}]`);
			for (let element of elements) {
				if (element instanceof HTMLInputElement) {
					if (element.type === 'checkbox' && obj[0][key]) {
						element.checked = true;
					}
					element.value = obj[0][key];
				} else {
					element.innerText = obj[0][key];
				}

			}
		});

		// let button = document.createElement("button");
		// button.classList.add("btn", "btn-primary");
		// button.innerText = "Submit";
		// button.type = "submit";
		// this.element.appendChild(button);

		// element.lastElementChild.addEventListener('click', () => {

		//     const elementList = document.querySelectorAll("input[data-variable]");
		//     var query = "SET ";
		//     elementList.forEach((element) => {
		//         if (element.value != storageHandler.storage.local.get(element.dataset.variable)) {
		//             if (element.innerText != "false" && storageHandler.storage.local.get(element.dataset.variable) != "false") {
		//                 console.log(element.dataset.variable + ": " + element.value + "!=" + storageHandler.storage.local.get(element.dataset.variable));
		//                 query = query + element.dataset.variable + "=" + element.value + ", ";
		//             }
		//         }
		//     });

		//     console.log(query.replace(/,\s*$/, ""));
		//     // Update the RC table!
		//     // Set releaseCandidate column boolean to true!

		//     // Time to submit the changed variables!
		//     // var xhr = new XMLHttpRequest();
		//     // xhr.open("UPDATE", yourUrl, true);
		//     // xhr.setRequestHeader('Content-Type', 'application/json');
		//     // xhr.send(JSON.stringify({
		//     // 	value: value
		//     // }));

		// })


		// element.dataset.id = dataset[Object.keys(dataset)[0]];
		// // TODO: undefined?
		// this.data = data;
		// this.formCallback(element);

	}

	formCreate() {
		console.log("formCreate");

		let self = this;

		let method = "GET";
		let sql = {
			"url": this.element.dataset.url,
			"db": this.element.dataset.db,
			"query": {
				0: {
					"select": {
						"columns": {
							0: "c.column_name",
							1: "c.is_nullable",
							2: "c.ordinal_position",
							3: "c.character_maximum_length",
							4: "c.udt_name",
							5: "c.is_updatable",
							6: "t.constraint_name",
							7: "t.constraint_type"
						},
						"from": {
							"table": "information_schema.columns",
							"as": "c"
						}
					}
				},
				1: {
					"left_outer_join": {
						"table": "information_schema.key_column_usage",
						"as": "k",
						"on": {
							0: "k.table_name = c.table_name",
							1: "k.column_name = c.column_name"
						}
					}
				},
				2: {
					"left_outer_join": {
						"table": "information_schema.table_constraints",
						"as": "t",
						"on": {
							0: "k.table_name = t.table_name",
							1: "k.constraint_name = t.constraint_name"
						}
					}
				},
				3: {
					"where": {
						0: {
							"identifier": "c.table_name",
							"value": this.element.dataset.table
						}
					}
				}
			}
		};

		ajax(method, sql, (response) => {

			let obj = response.data.dataset;
			let records = obj["records"];
			let totalrecords = obj["totalrecords"];
			delete obj.records;
			delete obj.totalrecords;

			var columnsArr;
			(self.element.dataset.columns == "*") ? columnsArr = ["*"] : columnsArr = self.element.dataset.columns.split(",");

			Object.keys(obj).forEach(function (key) {
				if (columnsArr.includes(obj[key]["column_name"]) || columnsArr[0] == "*") {

					let row = document.createElement("div");
					//row.classList.add("form-group", "row");
					row.classList.add("d-flex", "align-items-center", "form-group", "row");

					let label = document.createElement("label");
					label.classList.add("col-sm-4", "col-form-label")
					label.htmlFor = obj[key]["column_name"];
					label.innerText = obj[key]["column_name"];

					let INPUT = document.createElement("div");
					INPUT.classList.add("col-md-4");
					switch (obj[key]["udt_name"]) {
						case "bool":

							var el = document.createElement("input");
							el.classList.add("form-check-input");
							el.type = "checkbox";
							break;
						case "int2":
							var el = document.createElement("input");
							el.type = "number";
							break;
						case "int4":
							var el = document.createElement("input");
							el.type = "number";
							break;
						case "float4":
							var el = document.createElement("input");
							el.type = "number";
							el.step = "any";
							break;
						case "float8":
							var el = document.createElement("input");
							el.type = "number";
							el.step = "any";
							break;
						case "varchar":
							var el = document.createElement("input");
							el.type = "text";
							break;
						case "text":
							var el = document.createElement("textarea");
							break;
						case "datetime":
							var el = document.createElement("input");
							el.type = "date";
							break;
					}
					if (obj[key]["constraint_type"] == "PRIMARY KEY") {
						el.disabled = true;
					}
					INPUT.appendChild(el);
					INPUT.firstElementChild.classList.add("form-control");
					INPUT.firstElementChild.id = obj[key]["column_name"];
					INPUT.firstElementChild.name = obj[key]["column_name"];
					//INPUT.firstElementChild.value = obj[key]["column_name"];
					INPUT.firstElementChild.placeholder = obj[key]["column_name"];
					INPUT.firstElementChild.dataset.variable = obj[key]["column_name"];

					let DEFAULT = document.createElement("div");
					DEFAULT.classList.add("col-md-4");
					DEFAULT.appendChild(document.createElement("span"));
					DEFAULT.firstElementChild.innerText = obj[key]["column_name"];
					DEFAULT.firstElementChild.dataset.variable = obj[key]["column_name"];

					row.append(label, INPUT, DEFAULT);
					self.element.appendChild(row);

				}

			});


			let sql = {
				"url": this.element.dataset.url,
				"db": this.element.dataset.db,
				"query": JSON.parse(this.element.dataset.query)
			}
			// for (const property in dataset) {
			//     for (const element in dataset[property]) {
			//         console.log(`${element}: ${dataset[property][element]}`);
			//     }

			// }

			// let form = {
			//     "url": element.dataset.url,
			//     "db": element.dataset.db,
			//     "query": {
			//         0: {
			//             "select": {
			//                 "columns": {
			//                     0: "c.name",
			//                     1: "t.Name",
			//                     2: "c.max_length",
			//                     3: "c.precision",
			//                     4: "c.scale",
			//                     5: "c.is_nullable",c14_cat
			//                     6: "ISNULL(i.is_primary_key, 0)"
			//                 },
			//                 "from": {
			//                     "table": "INFORMATION_SCHEMA.COLUMNS",
			//                     "as": "c"
			//                 }
			//             }
			//         },
			//         1: {
			//             "inner_join": {
			//                 "table": "INFORMATION_SCHEMA.TABLE_CONSTRAINTS",
			//                 "as": "t",
			//                 "on": {
			//                     0: "c.user_type_id = t.user_type_id"
			//                 }
			//             }
			//         },
			//         2: {
			//             "left_outer_join": {
			//                 "table": "sys.index_columns",
			//                 "as": "ic",
			//                 "on": {
			//                     0: "ic.object_id = c.object_id",
			//                     1: "ic.column_id = c.column_id"
			//                 }
			//             }
			//         },
			//         3: {
			//             "left_outer_join": {
			//                 "table": "sys.indexes",
			//                 "as": "i",
			//                 "on": {
			//                     0: "ic.object_id = i.object_id",
			//                     1: "ic.index_id = i.index_id"
			//                 }
			//             }
			//         },
			//         4: {
			//             "where": {
			//                 0: {
			//                     "identifier": "c.object_id",
			//                     "value": "OBJECT_ID("+element.dataset.table+")"
			//                 }
			//             }
			//         }

			//     }
			// }
			/*
						"table": "INFORMATION_SCHEMA.COLUMNS c",
						"columns": "c.name, t.Name, c.max_length, c.precision, c.scale, c.is_nullable, ISNULL(i.is_primary_key, 0)",
						"inner_join": "INFORMATION_SCHEMA.CONSTRAINTS t ON c.user_type_id = t.user_type_id LEFT OUTER JOIN sys.index_columns ic ON ic.object_id = c.object_id AND ic.column_id = c.column_id LEFT OUTER JOIN sys.indexes i ON ic.object_id = i.object_id AND ic.index_id = i.index_id",
						"where": "c.object_id = OBJECT_ID('" + element.dataset.table + "')"
			*/

			ajax("GET", sql, self.formTabulate.bind(self));
			// if (action !== "create") {
			//     ajax("GET", element, this.formTabulate.bind(this));
			// }
		})

	}

	formCreateElement(HTMLInputElement) {
		switch (HTMLInputElement) {
			case "":
				break;
			default:
				"";
		}
	}
}

export default ajaxForm;

var object = {
	"0":
	{
		"table_catalog": "rmdelta",
		"table_schema": "public",
		"table_name": "cb_cat_clone",
		"column_name": "id",
		"ordinal_position": 1,
		"column_default": null,
		"is_nullable": "YES",
		"data_type": "integer",
		"character_maximum_length": null,
		"character_octet_length": null,
		"numeric_precision": 32,
		"numeric_precision_radix": 2,
		"numeric_scale": 0,
		"datetime_precision": null,
		"interval_type": null,
		"interval_precision": null,
		"character_set_catalog": null,
		"character_set_schema": null,
		"character_set_name": null,
		"collation_catalog": null,
		"collation_schema": null,
		"collation_name": null,
		"domain_catalog": null,
		"domain_schema": null,
		"domain_name": null,
		"udt_catalog": "rmdelta",
		"udt_schema": "pg_catalog",
		"udt_name": "int4",
		"scope_catalog": null,
		"scope_schema": null,
		"scope_name": null,
		"maximum_cardinality": null,
		"dtd_identifier": "1",
		"is_self_referencing": "NO",
		"is_identity": "NO",
		"identity_generation": null,
		"identity_start": null,
		"identity_increment": null,
		"identity_maximum": null,
		"identity_minimum": null,
		"identity_cycle": "NO",
		"is_generated": "NEVER",
		"generation_expression": null,
		"is_updatable": "YES"
	}
};