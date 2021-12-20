'use strict';

import { default as ajax } from "/e107_plugins/ajaxDBQuery/beta/js/ajaxDBQuery.js";
import { default as storageHandler } from "/e107_plugins/storageHandler/js/storageHandler.js";
import { default as jsonSQL } from "/e107_plugins/jsonSQL/js/jsonSQL.js";

class ajaxTable {
	constructor(element, index, tableOptions = {}) {
		console.log("ajaxTable constructor");

		element.dataset.key = index;
		element.setAttribute("id", `ajaxTables[${index}]`);

		while (element.firstChild) {
			element.removeChild(element.firstChild);
		}

		for (const [key, value] of Object.entries(tableOptions)) {
			this[key] = value;
		}

		this.index = index;
		this.element = element;
		this.rows = {};
		this.selectedRows = {};

		this.colors = {};
		this.colors.consoleLog = '#FFFFFF';
		this.colors.consoleInfo = '#28a745';
		this.colors.consoleWarn = '#FFFF00';
		this.colors.consoleError = '#FF0000';
		this.colors.consoleSuccess = '#28a745';

		this.tableCreate();

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

		if (!this.element.querySelector('tr[data-id="' + i + '"]') || this.selectedRows[i]) {
			this.eventTransmitter(e, i, origin);
			return;
		}

		let self = this;
		var row = this.element.querySelector('tr[data-id="' + i + '"]');

		const mouseover = () => {
			//console.log(i);
			row.style.backgroundColor = "#f5f5f5";
		}

		const mouseout = () => {
			//console.log(i);
			row.style.backgroundColor = null;
		}

		const mousedown = () => {
			//console.log(i);
			row.style.backgroundColor = "rgb(255, 205, 0)";
		}

		const mouseup = () => {
			//console.log(i);
			row.style.backgroundColor = "rgb(255, 205, 0)";
		}

		const click = () => {
			//console.log(i);
			if (Object.keys(self.selectedRows).length > 0) {
				Object.keys(self.selectedRows).forEach(function (key) {
					self.rows[key].style.backgroundColor = null;
					delete self.selectedRows[key];
				})
			}

			row.style.backgroundColor = "rgb(255, 205, 0)";
			row.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
			this.selectedRows[i] = row;
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
			switch(parent.dataset.ajax) {
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

	tableCreate() {
		console.info("%ctableCreate", "color: #28a745");

		let self = this;
		let table = this.element;

		// TODO: Download
		const params = new URLSearchParams(window.location.search)

		if (table.dataset.caption) {
			let caption = document.createElement('caption');
			caption.innerText = table.dataset.caption;
			table.appendChild(caption);
		}

		if (!table.dataset.limit) { table.dataset.limit = 20 }
		if (!table.dataset.offset) { table.dataset.offset = 0 }
		// if (params.has("yeargroup")) {
		// 	var button = document.createElement("button");
		// 	button.classList.add("btn", "btn-default", "pull-right");
		// 	var span = document.createElement("SPAN");
		// 	span.classList.add("glyphicon", "glyphicon-save");
		// 	span.setAttribute("aria-hidden", "true");
		// 	button.appendChild(span);
		// 	button.addEventListener("click", function () {
		// 		self.exportData();
		// 	});
		// 	caption.appendChild(button);
		// }

		if (table.dataset.columns.split(",").length !== table.dataset.columnnames.split(",").length) { console.error('%cError: columnNames.length != columns.length', 'color:red'); return null; }
		let columnArr = table.dataset.columns.split(",");
		let columnNamesArr = table.dataset.columnnames.split(",");

		if (table.dataset.order_by === '') { table.dataset.order_by = columnArr[0]; }
		if (!table.dataset.events) { table.dataset.events = "click" }

		let thead = document.createElement("thead");
		thead.classList.add("table-header");
		thead.appendChild(document.createElement("tr"));
		let tbody = document.createElement("tbody");
		tbody.dataset.href = table.dataset.href;
		let tfoot = document.createElement("tfoot");
		tfoot.classList.add("table-footer");
		tfoot.appendChild(document.createElement("tr"));

		for (var i = 0; i < columnArr.length; i++) {
			var node = document.createElement("th");
			node.setAttribute("data-column", columnArr[i]);
			var sortASC = document.createElement("button");
			sortASC.classList.add("btn", "btn-primary", "btn-xs");
			sortASC.type = "submit";
			sortASC.addEventListener("click", function () { window["ajaxTables"][self.index].tableSort(this); });
			sortASC.dataset.value = "ASC";
			sortASC.appendChild(document.createElement("SPAN"));
			sortASC.lastElementChild.appendChild(document.createTextNode("⇑"));
			var sortDESC = document.createElement("button");
			sortDESC.classList.add("btn", "btn-primary", "btn-xs");
			sortDESC.type = "submit";
			sortDESC.addEventListener("click", function () { window["ajaxTables"][self.index].tableSort(this); });
			sortDESC.dataset.value = "DESC";
			sortDESC.appendChild(document.createElement("SPAN"));
			sortDESC.lastElementChild.appendChild(document.createTextNode("⇓"));
			var textnode = document.createElement("span");
			textnode.appendChild(document.createTextNode(columnNamesArr[i]));
			node.append(document.createTextNode(" "), sortASC, sortDESC, document.createTextNode(" "), textnode, document.createTextNode(" "));
			thead.lastElementChild.appendChild(node);
		}

		table.appendChild(thead);
		table.appendChild(tbody);

		if (!table.dataset.slave || table.dataset.slave != "1") {
			var tablebuttons = document.createElement("th");
			tablebuttons.classList.add("table-buttons");
			var div = document.createElement("div");
			div.classList.add("btn-group", "btn-group-xs");
			var button = document.createElement("button");
			button.type = "button";
			button.classList.add("btn", "btn-primary", "btn-xs");
			button.dataset.toggle = "collapse";
			button.dataset.target = "";
			button.setAttribute("aria-expanded", true);
			button.setAttribute("aria-controls", "");
			button.addEventListener("click", function () { window["ajaxTables"][self.index].tableToggle(this) });
			var span = document.createElement("span");
			span.classList.add("fa", "fa-chevron-down");
			span.setAttribute("aria-hidden", true);
			button.appendChild(span);
			div.appendChild(button);
			var button = document.createElement("button");
			button.type = "button";
			button.id = "dropdownMenuTable";
			button.classList.add("btn", "btn-default", "btn-xs", "btn-outline-secondary", "dropdown-toggle");
			button.dataset.bsToggle = "dropdown";
			button.setAttribute("aria-expanded", false);
			//button.setAttribute("aria-haspopup", true);
			var span = document.createElement("span");
			span.innerText = "20";
			button.appendChild(span);
			button.appendChild(document.createTextNode(" "));
			var span = document.createElement("span");
			span.classList.add("caret");
			button.appendChild(span);
			var span = document.createElement("span");
			span.classList.add("sr-only");
			span.innerText = "Toggle Dropdown";
			button.appendChild(span);
			div.appendChild(button);
			var ul = document.createElement("ul");
			ul.classList.add("dropdown-menu");
			ul.style.minWidth = "unset";
			ul.setAttribute("aria-labelledby", "dropdownMenuTable");
			var li = document.createElement("li");
			var button = document.createElement("button");
			button.classList.add("dropdown-item");
			button.addEventListener("click", function () { window["ajaxTables"][self.index].tableLimit(this); return false; })
			button.innerText = "20";
			li.appendChild(button);
			ul.appendChild(li);
			var li = document.createElement("li");
			var button = document.createElement("button");
			button.classList.add("dropdown-item");
			button.addEventListener("click", function () { window["ajaxTables"][self.index].tableLimit(this); return false; })
			button.innerText = "50";
			li.appendChild(button);
			ul.appendChild(li);
			var li = document.createElement("li");
			var button = document.createElement("button");
			button.classList.add("dropdown-item");
			button.addEventListener("click", function () { window["ajaxTables"][self.index].tableLimit(this); return false; })
			button.innerText = "100";
			li.appendChild(button);
			ul.appendChild(li);
			div.appendChild(ul);
			tablebuttons.appendChild(div);
			tfoot.lastElementChild.appendChild(tablebuttons);
		}

		var totalrecords = document.createElement("th");
		totalrecords.classList.add("totalrecords");
		var cols;
		switch (table.dataset.type) {
			case "slave":
			case "relational":
				totalrecords.setAttribute("colspan", table.dataset.columns.split(",").length);
				cols = table.dataset.columns.split(",").length;
				break;
			default:
				cols = 3;
		}

		tfoot.lastElementChild.appendChild(totalrecords);

		for (var i = cols; i < columnArr.length; i++) {
			var node = document.createElement("th");
			if (!table.dataset.slave || table.dataset.slave != "1") {
				node.innerText = "...";
			}
			tfoot.lastElementChild.appendChild(node);
		}

		var tablebuttons = document.createElement("th");
		tablebuttons.classList.add("table-buttons");
		if (table.dataset.add == true) {
			var button = document.createElement("button");
			button.type = "button";
			button.classList.add("btn", "btn-primary", "btn-xs");
			button.addEventListener("click", function () { window["ajaxTables"][self.index].tableAddData() });
			var span = document.createElement("span");
			span.classList.add("glyphicon", "glyphicon-plus");
			span.setAttribute("aria-hidden", "true");
			var textnode = document.createTextNode(" Add");
			button.appendChild(span);
			button.appendChild(textnode);
			tablebuttons.appendChild(button);
		} else {
			switch (table.dataset.type) {
				case "slave":
				case "relational":
					break;
				default:
					var textnode = document.createTextNode("...");
					tablebuttons.appendChild(textnode);
			}
		}
		tfoot.lastElementChild.appendChild(tablebuttons);

		tfoot.appendChild(document.createElement("tr"));
		tfoot.lastElementChild.classList.add("navigation", "collapse");
		var navigation = document.createElement("th");
		navigation.colSpan = table.dataset.columns.split(',').length;
		var nav = document.createElement("nav");
		nav.classList.add("text-center");
		nav.setAttribute("aria-label", "Page navigation");
		var div = document.createElement("div");
		div.classList.add("pagination", "btn-group");
		// var li = document.createElement("li");
		// li.classList.add("disabled");
		var button = document.createElement("button");
		//a.href = "?page="+parseInt(this.element.dataset.offset, 10) - 1;
		button.type = "button";
		button.title = "Previous";
		button.dataset.nav = "prev";
		button.classList.add("btn", "btn-default", "disabled");
		button.addEventListener("click", function () { window["ajaxTables"][self.index].tablePagination(this); return false; });
		var span = document.createElement("span");
		span.setAttribute("aria-hidden", "true");
		//span.innerHTML = "&laquo;";
		span.innerHTML = "<i class=\"fa fa-chevron-left\"></i>";
		button.appendChild(span);
		//li.appendChild(button);
		div.appendChild(button);
		//var li = document.createElement("li");
		// var button = document.createElement("button");
		// button.type = "button";
		// button.classList.add("btn", "btn-default");
		var span = document.createElement("span");
		span.type = "button";
		span.classList.add("btn", "btn-default", "currentpage");
		span.setAttribute("contenteditable", "true");
		span.innerText = "1";
		//button.appendChild(span);
		div.appendChild(span);
		//ul.appendChild(li);
		//var li = document.createElement("li");
		var button = document.createElement("button");
		//a.href = "?page="+parseInt(this.element.dataset.offset, 10) + 1;
		button.type = "button";
		button.title = "Next";
		button.dataset.nav = "next";
		button.classList.add("btn", "btn-default");
		button.addEventListener("click", function () { window["ajaxTables"][self.index].tablePagination(this); return false; });
		var span = document.createElement("span");
		span.setAttribute("aria-hidden", "true");
		//span.innerHTML = "&raquo;";
		span.innerHTML = "<i class=\"fa fa-chevron-right\"></i>";
		button.appendChild(span);
		div.appendChild(button);
		//ul.appendChild(li);
		nav.appendChild(div);
		navigation.appendChild(nav);
		tfoot.lastElementChild.appendChild(navigation);
		table.appendChild(tfoot);

		if (table.dataset.limit) {
			table.getElementsByClassName("currentpage")[0].addEventListener("keydown", function (event) {
				// Number 13 is the "Enter" key on the keyboard
				if (event.key === "Enter") {
					// Cancel the default action, if needed
					event.preventDefault();
					// Trigger the function
					window["ajaxTables"][self.index].tablePagination(table);
				}
			});
		}

		if (!table.dataset.master) {
			let method = "GET";
			let sql = {
				"url": table.dataset.url,
				"db": table.dataset.db,
				"query": JSON.parse(table.dataset.query)
			}
			ajax(method, sql, this.tableTabulate.bind(this));
		}

	}

	tableCallback(element) {
		console.info(`%ctableCallback`, `color:${this.colors.consoleWarn}`);
		if (this?._tableCallback?.functions) {
			let callbacks = this._tableCallback.functions;
			Object.keys(callbacks).forEach(function (value) {
				callbacks[value](element);
			})
		}
	}

	tableTabulate(response) {
		console.info(`%ctableTabulate`, `color:${this.colors.consoleInfo}`);
		if (response.type !== "success") return response;
		// window.history.pushState({page: this.element.dataset.offset + 1}, "", "?page="+(parseInt(this.element.dataset.offset, 10) + 1));

		let self = this;
		let table = this.element;
		let tfoot = table.getElementsByClassName("table-footer")[0];

		const obj = this?.parseResponse?.(response) || response;
		const data = obj.data;
		const dataset = obj.dataset;
		const records = obj?.records || 0;
		const totalrecords = obj?.totalrecords || 0;

		// TODO: Sort object by property of object
		let tbody = table.getElementsByTagName("tbody")[0];
		let tbodies = table.querySelectorAll("tbody");
		tbodies.forEach((value, index) => {
			if (index !== 0) { table.removeChild(value) } else { value.innerText = '' }
		});

		var rowcount = 0;
		Object.keys(dataset).forEach(function (key) {
			if (parseInt(key, 10) === parseInt(table.dataset.preview, 10)) {
				// Always show the first preview results (default 3), add new tbody after that
				tbody.insertAdjacentElement('afterend', document.createElement('tbody'));
				if (tbody.dataset.href == "1") {
					tbody = table.getElementsByTagName("tbody")[1];
					tbody.dataset.href = "1";
				} else {
					tbody = table.getElementsByTagName("tbody")[1];
				}

				if (table.getAttribute("aria-expanded") == "true") {
					tbody.classList.add("collapse", "show");
					tbody.setAttribute("aria-expanded", true)
				} else {
					tbody.classList.add("collapse");
				}

				tbody.setAttribute("style", "border-top:0px;");
				rowcount = 0;	// New tbody, start at 0 again
			}

			var row = tbody.insertRow(rowcount);
			var cellcount = 0;
			row.dataset.id = dataset[key][Object.keys(dataset[key])[0]];
			if (self.selectedRows[row.dataset.id]) {
				row.style.backgroundColor = "rgb(255, 205, 0)";
			}
			if (tbody.dataset.href == "1") {
				row.dataset.href = Object.keys(dataset[key])[0] + ".php?" + Object.keys(dataset[key])[0] + "=" + dataset[key][Object.keys(dataset[key])[0]];
			}

			// TODO: If slave table, do not redirect to another page...
			// FIXME: Do we need to evaluate the event array for each row? No!
			table.dataset.events.split(",").forEach((value) => {
				switch (value) {
					case "mouseover":
						row.addEventListener('mouseover', (e) => {
							if (Object.keys(self.selectedRows).length > 0) {
								if (!self.selectedRows[row.dataset.id]) {
									row.style.backgroundColor = "#f5f5f5";
								}
							} else {
								row.style.backgroundColor = "#f5f5f5";
							}
							self.eventTransmitter(e, row.dataset.id);
						});
						break;
					case "mouseout":
						row.addEventListener('mouseout', (e) => {
							if (Object.keys(self.selectedRows).length > 0) {
								if (!self.selectedRows[row.dataset.id]) {
									row.style.backgroundColor = null;
								}
							} else {
								row.style.backgroundColor = null;
							}
							self.eventTransmitter(e, row.dataset.id);
						});
						break;
					case "mousedown":
						row.addEventListener('mousedown', (e) => {
							if (Object.keys(self.selectedRows).length > 0) {
								if (!self.selectedRows[row.dataset.id]) {
									Object.values(self.selectedRows).forEach(function (row) {
										row.style.backgroundColor = null;
									})
									row.style.backgroundColor = "rgb(255, 205, 0)";
								}
							} else {
								row.style.backgroundColor = "rgb(255, 205, 0)";
							}
							self.eventTransmitter(e, row.dataset.id);
						});
						break;
					case "mouseup":
						row.addEventListener('mouseup', (e) => {
							if (Object.keys(self.selectedRows).length > 0) {
								if (!self.selectedRows[row.dataset.id]) {
									Object.values(self.selectedRows).forEach(function (row) {
										row.style.backgroundColor = null;
									})
									row.style.backgroundColor = "rgb(255, 205, 0)";
								}
							} else {
								row.style.backgroundColor = "rgb(255, 205, 0)";
							}
							self.eventTransmitter(e, row.dataset.id);
						});
						break;
					case "click":
						row.addEventListener('click', (e) => {
							if (row.dataset.href) {
								window.location.href = row.dataset.href;
							} else {
								if (Object.keys(self.selectedRows).length > 0) {
									if (!self.selectedRows[row.dataset.id]) {
										Object.keys(self.selectedRows).forEach(function (key) {
											self.selectedRows[key].style.backgroundColor = null;
											delete self.selectedRows[key];
										});
										row.style.backgroundColor = "rgb(255, 205, 0)";
									}
								} else {
									row.style.backgroundColor = "rgb(255, 205, 0)";
								}
								self.selectedRows[row.dataset.id] = row;
								self.eventTransmitter(e, row.dataset.id);
							}
						});
						break;
				}
			})

			self.rows[row.dataset.id] = row;

			// TODO: Only extract the data for which there are columns
			table.dataset.columns.split(",").forEach((e) => {
				row.insertCell(cellcount).innerText = dataset[key][e];
				cellcount++;
			})
			/*
			Object.keys(obj[k]).forEach(key => {
				row.insertCell(cellcount).innerText = obj[k][key];
				cellcount++;
			});
			*/
			rowcount++;

		});

		table.getElementsByClassName("currentpage")[0].innerText = parseInt(table.dataset.offset, 10) + 1;
		table.dataset.totalrecords = totalrecords;
		var limit = Object.keys(dataset).length || 0;
		switch (table.dataset.type) {
			case "slave":
				table.getElementsByClassName("totalrecords")[0].innerText = `Records listed: ${limit}`;
				break;
			case "relational":
				table.getElementsByClassName("totalrecords")[0].innerHTML = "<span class='pull-right' style='text-align:right'>Geografisch Instituut Utrecht</span>";
				break;
			default:
				table.getElementsByClassName("totalrecords")[0].innerText = `Total records: ${totalrecords}`;
		}
		if (table.dataset.limit) {
			if (Math.floor(parseInt(table.dataset.totalrecords, 10) / parseInt(table.dataset.limit, 10)) === 0) {
				table.getElementsByTagName("nav")[0].getElementsByTagName("div")[0].lastElementChild.classList.add("disabled");
			}

			if (table.hasAttribute("aria-expanded")) {

				let nodes = table.getElementsByClassName("collapse");

				for (let node of nodes) {
					node.classList.add("show");
					node.setAttribute("aria-expanded", true);
				}

				let expandbutton = tfoot.getElementsByClassName("table-buttons")[0].getElementsByTagName("button")[0];
				expandbutton.classList.remove("btn-primary");
				expandbutton.classList.add("btn-secondary");
				expandbutton.firstElementChild.classList.remove("fa-chevron-down");
				expandbutton.firstElementChild.classList.add("fa-chevron-up");
			}

			let limitbutton = tfoot.getElementsByClassName("table-buttons")[0].getElementsByTagName("button")[1];
			limitbutton.getElementsByTagName("span")[0].innerText = table.dataset.limit;

			let navigation = tfoot.getElementsByClassName("navigation")[0];
			if (parseInt(table.dataset.limit) > totalrecords) {
				navigation.classList.add("hidden");
			} else {
				navigation.classList.remove("hidden");
			}
		}

		let totalpages = Math.floor(parseInt(table.dataset.totalrecords, 10) / parseInt(table.dataset.limit, 10)) + 1;
		switch (parseInt(table.dataset.offset, 10)) {
			case 0:
				table.getElementsByTagName("nav")[0].getElementsByTagName("div")[0].firstElementChild.classList.add("disabled");
				if (parseInt(table.dataset.offset, 10) + 1 == totalpages) {
					table.getElementsByTagName("nav")[0].getElementsByTagName("div")[0].lastElementChild.classList.add("disabled");
				} else {
					table.getElementsByTagName("nav")[0].getElementsByTagName("div")[0].lastElementChild.classList.remove("disabled");
				}
				break;
			case parseInt(totalpages, 10) - 1:
				table.getElementsByTagName("nav")[0].getElementsByTagName("div")[0].lastElementChild.classList.add("disabled");
				if (parseInt(table.dataset.offset, 10) !== 0) {
					table.getElementsByTagName("nav")[0].getElementsByTagName("div")[0].firstElementChild.classList.remove("disabled");
				}
				break;
			default:
				table.getElementsByTagName("nav")[0].getElementsByTagName("div")[0].firstElementChild.classList.remove("disabled");
				table.getElementsByTagName("nav")[0].getElementsByTagName("div")[0].lastElementChild.classList.remove("disabled");
		}

		this.obj = obj;
		this.tableCallback(table);

	}

	tableLimit(element) {
		console.log("%ctableLimit", "color:green");
		let table = element.closest("table");
		let button = element.closest("th").getElementsByTagName("button")[1];
		button.getElementsByTagName("span")[0].innerText = element.innerText;

		if (parseInt(table.dataset.limit, 10) !== parseInt(element.innerText, 10)) {
			if (parseInt(table.dataset.limit, 10) >= parseInt(table.dataset.totalrecords) && parseInt(element.innerText, 10) >= parseInt(table.dataset.totalrecords)) {
				return null;
			}
			table.dataset.limit = element.innerText;
			// table.dataset.offset = 0;
			// table.getElementsByTagName("nav")[0].getElementsByTagName("div")[0].firstElementChild.classList.add("disabled");
			// table.getElementsByClassName("currentpage")[0].innerText = parseInt(table.dataset.offset, 10) + 1;
			// table.getElementsByTagName("nav")[0].getElementsByTagName("div")[0].lastElementChild.classList.remove("disabled");
			// table.setAttribute("aria-expanded", true);

			let method = "GET";
			let sql = {
				"url": table.dataset.url,
				"db": table.dataset.db,
				"query": JSON.parse(table.dataset.query)
			}
			Object.keys(sql.query).forEach((key) => {
				switch (Object.keys(sql.query[key])[0]) {
					case "limit":
						sql.query[key].limit = parseInt(table.dataset.limit, 10);
						break;
				}
			})
			table.dataset.query = JSON.stringify(sql.query);
			ajax(method, sql, this.tableTabulate.bind(this));
		}

	}

	tablePagination(element) {
		console.log("%ctablePagination", "color:green");
		let table = element.closest("table");
		let currentpage = parseInt(table.dataset.offset, 10) + 1;
		let totalpages = Math.floor(parseInt(table.dataset.totalrecords, 10) / parseInt(table.dataset.limit, 10)) + 1;

		console.log(`totalpages: ${totalpages}`);

		if (totalpages == 1) { table.getElementsByClassName("currentpage")[0].innerText = totalpages; return; }

		if (element.dataset.nav == "next" && parseInt(table.dataset.offset, 10) + 1 < parseInt(totalpages, 10)) {
			table.dataset.offset = parseInt(table.dataset.offset, 10) + 1;
		} else if (element.dataset.nav == "prev" && parseInt(table.dataset.offset, 10) + 1 > 1) {
			table.dataset.offset = parseInt(table.dataset.offset, 10) - 1;
		} else if (parseInt(table.getElementsByClassName("currentpage")[0].innerText, 10) > parseInt(totalpages, 10)) {
			if (parseInt(table.dataset.offset, 10) + 1 !== parseInt(totalpages, 10)) {
				table.dataset.offset = parseInt(totalpages, 10) - 1;
			}
			table.getElementsByClassName("currentpage")[0].innerText = totalpages;
		} else if (table.getElementsByClassName("currentpage")[0].innerText < 1) {
			if (parseInt(table.dataset.offset, 10) + 1 !== 1) {
				table.dataset.offset = 0;
			}
			table.getElementsByClassName("currentpage")[0].innerText = 1;
		} else {
			table.dataset.offset = parseInt(table.getElementsByClassName("currentpage")[0].innerText, 10) - 1;
		}

		if (currentpage !== parseInt(table.dataset.offset, 10) + 1) {
			let method = "GET";
			let sql = {
				"url": table.dataset.url,
				"db": table.dataset.db,
				"query": JSON.parse(table.dataset.query)
			}
			Object.keys(sql.query).forEach((key) => {
				switch (Object.keys(sql.query[key])[0]) {
					case "offset":
						sql.query[key].offset = parseInt(table.dataset.offset, 10) * parseInt(table.dataset.limit, 10);
						break;
				}
			})
			table.dataset.query = JSON.stringify(sql.query);
			console.log(`Query order by: ${sql.query[Object.keys(sql.query).length - 3]["order_by"][0]["identifier"]}`);
			console.log(`Query limit: ${sql.query[Object.keys(sql.query).length - 2]["limit"]}`);
			console.log(`Query offset: ${sql.query[Object.keys(sql.query).length - 1]["offset"]}`);
			ajax(method, sql, this.tableTabulate.bind(this));
		}
	}

	tableSort(element) {
		console.log("%ctableSort", "color:green");
		let table = element.closest("table");

		if (table.dataset.slave || table.dataset.slave == "1") {
			//TODO: sort on master
			return;
		}
		console.log(table.dataset.direction, element.dataset.value)

		if (table.dataset.order_by !== element.parentNode.dataset.column || table.dataset.direction !== element.dataset.value) {

			table.dataset.order_by = element.parentNode.dataset.column;
			switch (element.dataset.value) {
				case '⇓':
				case 'DESC':
				case 'desc':
					table.dataset.direction = 'DESC';
					break;
				case '⇑':
				case 'ASC':
				case 'asc':
					table.dataset.direction = 'ASC'
					break;
				default: table.dataset.direction = 'DESC';
			}
			table.dataset.offset = 0;
			table.getElementsByTagName("nav")[0].getElementsByTagName("div")[0].firstElementChild.classList.add("disabled");
			table.getElementsByClassName("currentpage")[0].innerText = parseInt(table.dataset.offset, 10) + 1;
			table.getElementsByTagName("nav")[0].getElementsByTagName("div")[0].lastElementChild.classList.remove("disabled");

			let method = "GET";
			let sql = {
				"url": table.dataset.url,
				"db": table.dataset.db,
				"query": JSON.parse(table.dataset.query)
			}
			Object.keys(sql.query).forEach((key) => {
				switch (Object.keys(sql.query[key])[0]) {
					case "order_by":
						sql.query[key].order_by[0].identifier = table.dataset.order_by;
						sql.query[key].order_by[0].direction = table.dataset.direction;
						break;
					case "offset":
						sql.query[key].offset = table.dataset.offset;
				}
			})
			table.dataset.query = JSON.stringify(sql.query);
			ajax(method, sql, this.tableTabulate.bind(this));

		}

	}

	tableToggle(element) {
		console.log("%ctableToggle", "color:green");
		let table = element.closest("table");
		let nodes = table.getElementsByClassName("collapse");

		for (const node of nodes) {
			node.classList.toggle("show");
			node.toggleAttribute("aria-expanded");
		}

		element.classList.toggle("btn-primary");
		element.classList.toggle("btn-secondary");
		element.firstElementChild.classList.toggle("fa-chevron-down");
		element.firstElementChild.classList.toggle("fa-chevron-up");
		table.toggleAttribute("aria-expanded");

	}

	exportData() {
		console.log("exportData");
		// TODO: For each datapoint in map, asyncAJAX slave element
		// For each datapoint in slave element, asyncAJAX slave element
		// etc...
		let self = this;
		let element = this.element;

		element.dataset.columns = "*";
		ajax(element, self.exportDataAsXML.bind(self));
	}
}

export default ajaxTable;
