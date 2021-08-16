'use strict';

import { default as ajax } from "/e107_plugins/ajaxDBQuery/js/ajaxDBQuery.js";
import { default as storageHandler } from "/e107_plugins/storageHandler/js/storageHandler.js";

class ajaxTable {
	constructor(element, index, object = {}) {
		console.log("ajaxTable constructor");
		
		for (const [key, value] of Object.entries(object)) {
			this[key] = value;
		}

		this.element = element;
		this.index = index;
		this.rows = {};
		this.selectedRows = {};
		
		element.dataset.index = index;
		element.setAttribute("id", "Tables[" + index + "]");

		// TODO: If table is slave, don't do ajax requests...
		// If we change the sort, use the sort of the master...
		// (No need to sort a map..., change the sort of the current dataset with javascript)
		// If we change the limit, use the limit of the master...

		if (element.getElementsByTagName("tbody").length == 0) {
			this.tableCreate(element, index);
		}

		if (!element.dataset.master) {
			ajax(element, this.tableTabulate.bind(this));
		}

	} // End of constructor

	get Dataset() {
		return this.element.dataset;
	}

	get Index() {
		return this.index;
	}

	get Data() {
		return JSON.parse(this.data);
	}

	eventReceiver(e, i) {
		console.log("eventReceiver");

		let self = this;

		if (this.element.querySelectorAll('tr[data-id="' + i + '"]')[0]) {
			var row = this.element.querySelectorAll('tr[data-id="' + i + '"]')[0];
		} else {
			return;
		}

		if (this.selectedRows[i]) {
			return;
		}

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
			this.eventTransmitter(e, i);
		}

		const selected = () => {
			if (Object.keys(self.selectedRows).length > 0) {
				Object.keys(self.selectedRows).forEach(function (key) {
					self.rows[key].style.backgroundColor = null;
					delete self.selectedRows[key];
				})
			}
			this.eventTransmitter(e, i);
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
			case "selected":
				selected();
				break;
			default:
				break;
		}

	}

	eventTransmitter(e, i) {
		// console.log("eventTransmitter");

		/*
		let masterMaps = document.getElementById(this.element.dataset.master);
		masterMaps.forEach((map) => {
			console.log(map.dataset.key);
			Maps[map.dataset.key].eventReceiver(e, i);
		})
		*/
		// TODO: slave table
		if (document.getElementById(this.element.dataset.master)) {
			var key = document.getElementById(this.element.dataset.master).dataset.key;
			Maps[key].eventReceiver(e, i);
		}
	}

	tableCallback(element) {
		console.log("tableCallback");

		if(this._tableCallback.functions) {
			let callbacks = this._tableCallback.functions;
			Object.keys(callbacks).forEach(function (value) {
				callbacks[value](element);
			})
		}

	}

	tableTabulate(element, data) {
		console.log("tableTabulate");

		let table = element;
		let tfoot = table.getElementsByClassName("table-footer")[0];
		let self = this;

		const obj = JSON.parse(data);
		const totalrecords = obj["totalrecords"];
		delete obj.totalrecords;

		// TODO: Sort object by property of object
		let tbody = table.getElementsByTagName("tbody")[0];
		let tbodies = table.querySelectorAll("tbody");
		tbodies.forEach((value, index) => {
			if (index !== 0) { table.removeChild(value) } else { value.innerText = '' }
		});

		var rowcount = 0;
		Object.keys(obj).forEach(function (k, v) {

			console.log(k, v);
			console.log(obj[k][Object.keys(obj[k])[0]]);
			
			if (v === parseInt(table.dataset.preview, 10)) {
				// Always show the first preview results (default 3), add new tbody after that
				tbody.insertAdjacentElement('afterend', document.createElement('tbody'));
				if (tbody.dataset.href == "1") {
					tbody = table.getElementsByTagName("tbody")[1];
					tbody.dataset.href = "1";
				} else {
					tbody = table.getElementsByTagName("tbody")[1];
				}

				if (table.getAttribute("aria-expanded") == "true") {
					tbody.classList.add("collapse", "in");
					tbody.setAttribute("aria-expanded", true)
				} else {
					tbody.classList.add("collapse");
				}

				tbody.setAttribute("style", "border-top:0px;");
				rowcount = 0;	// New tbody, start at 0 again
			}

			var row = tbody.insertRow(rowcount);
			var cellcount = 0;
			row.dataset.id = obj[k][Object.keys(obj[k])[0]];
			if (self.selectedRows[row.dataset.id]) {
				row.style.backgroundColor = "rgb(255, 205, 0)";
			}
			if (tbody.dataset.href == "1") {
				row.dataset.href = Object.keys(obj[k])[0] + ".php?" + Object.keys(obj[k])[0] + "=" + obj[k][Object.keys(obj[k])[0]];
			}

			// TODO: If slave table, do not redirect to another page...
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
				row.insertCell(cellcount).innerText = obj[k][e];
				cellcount++;
			})

			rowcount++;

		});

		table.getElementsByClassName("currentpage")[0].innerText = parseInt(table.dataset.offset, 10) + 1;
		table.dataset.totalrecords = totalrecords;
		var limit = Object.keys(obj).length - 1;
		switch (table.dataset.type) {
			case "slave":
				table.getElementsByClassName("totalrecords")[0].innerText = "Records listed: " + limit;
				break;
			case "relational":
				table.getElementsByClassName("totalrecords")[0].innerHTML = "<span class='pull-right' style='text-align:right'>Geografisch Instituut Utrecht</span>";
				break;
			default:
				table.getElementsByClassName("totalrecords")[0].innerText = "";
		}
		if (table.dataset.limit) {
			if (Math.ceil(parseInt(table.dataset.totalrecords, 10) / parseInt(table.dataset.limit, 10)) === 1) {
				table.getElementsByTagName("nav")[0].getElementsByTagName("ul")[0].lastElementChild.classList.add("disabled");
			}

			if (table.hasAttribute("aria-expanded")) {

				let nodes = table.getElementsByClassName("collapse");

				for (let node of nodes) {
					node.classList.add("in");
					node.setAttribute("aria-expanded", true);
				}

				let expandbutton = tfoot.getElementsByClassName("table-buttons")[0].getElementsByTagName("button")[0];
				expandbutton.classList.remove("btn-primary");
				expandbutton.classList.add("btn-secondary");
				expandbutton.firstElementChild.classList.remove("glyphicon-chevron-down");
				expandbutton.firstElementChild.classList.add("glyphicon-chevron-up");
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

		let totalpages = Math.ceil(parseInt(table.dataset.totalrecords, 10) / parseInt(table.dataset.limit, 10));
		switch (parseInt(table.dataset.offset, 10)) {
			case 0:
				table.getElementsByTagName("nav")[0].getElementsByTagName("ul")[0].firstElementChild.classList.add("disabled");
				if (parseInt(table.dataset.offset, 10) + 1 == totalpages) {
					table.getElementsByTagName("nav")[0].getElementsByTagName("ul")[0].lastElementChild.classList.add("disabled");
				} else {
					table.getElementsByTagName("nav")[0].getElementsByTagName("ul")[0].lastElementChild.classList.remove("disabled");
				}
				break;
			case parseInt(totalpages, 10) - 1:
				table.getElementsByTagName("nav")[0].getElementsByTagName("ul")[0].lastElementChild.classList.add("disabled");
				if (parseInt(table.dataset.offset, 10) !== 0) {
					table.getElementsByTagName("nav")[0].getElementsByTagName("ul")[0].firstElementChild.classList.remove("disabled");
				}
				break;
			default:
				table.getElementsByTagName("nav")[0].getElementsByTagName("ul")[0].firstElementChild.classList.remove("disabled");
				table.getElementsByTagName("nav")[0].getElementsByTagName("ul")[0].lastElementChild.classList.remove("disabled");
		}

		this.data = data;
		this.tableCallback(element);

	}

	tableCreate(element, index) {
		console.log("tableCreate");

		let self = this;
		let table = element;

		// TODO: Download
		const params = new URLSearchParams(window.location.search)

		let caption = table.getElementsByTagName("caption")[0];
		if (params.has("yeargroup")) {
			var button = document.createElement("button");
			button.classList.add("btn", "btn-default", "pull-right");
			var span = document.createElement("SPAN");
			span.classList.add("glyphicon", "glyphicon-save");
			span.setAttribute("aria-hidden", "true");
			button.appendChild(span);
			button.addEventListener("click", function () {
				self.exportData();
			});
			caption.appendChild(button);
		}

		if (table.dataset.columns.split(",").length !== table.dataset.columnnames.split(",").length) { return null; }
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
			sortASC.addEventListener("click", function () { Tables[index].tableSort(this); });
			sortASC.dataset.value = "ASC";
			sortASC.appendChild(document.createElement("SPAN"));
			sortASC.lastElementChild.appendChild(document.createTextNode("⇑"));
			var sortDESC = document.createElement("button");
			sortDESC.classList.add("btn", "btn-primary", "btn-xs");
			sortDESC.type = "submit";
			sortDESC.addEventListener("click", function () { Tables[index].tableSort(this); });
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

		if (!element.dataset.slave || element.dataset.slave != "1") {
			var tablebuttons = document.createElement("th");
			tablebuttons.classList.add("table-buttons");
			var div = document.createElement("div");
			div.classList.add("btn-group");
			var button = document.createElement("button");
			button.type = "button";
			button.classList.add("btn", "btn-primary", "btn-xs");
			button.dataset.toggle = "collapse";
			button.dataset.target = "";
			button.setAttribute("aria-expanded", true);
			button.setAttribute("aria-controls", "");
			button.addEventListener("click", function () { Tables[index].tableToggle(this) });
			var span = document.createElement("span");
			span.classList.add("glyphicon", "glyphicon-chevron-down");
			span.setAttribute("aria-hidden", true);
			button.appendChild(span);
			div.appendChild(button);
			var button = document.createElement("button");
			button.type = "button";
			button.classList.add("btn", "btn-default", "btn-xs", "dropdown-toggle");
			button.dataset.toggle = "dropdown";
			button.setAttribute("aria-expanded", false);
			button.setAttribute("aria-haspopup", true);
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
			var li = document.createElement("li");
			var a = document.createElement("a");
			a.href = "#";
			a.addEventListener("click", function () { Tables[index].tableLimit(this); return false; })
			a.innerText = "20";
			li.appendChild(a);
			ul.appendChild(li);
			var li = document.createElement("li");
			var a = document.createElement("a");
			a.href = "#";
			a.addEventListener("click", function () { Tables[index].tableLimit(this); return false; })
			a.innerText = "50";
			li.appendChild(a);
			ul.appendChild(li);
			var li = document.createElement("li");
			var a = document.createElement("a");
			a.href = "#";
			a.addEventListener("click", function () { Tables[index].tableLimit(this); return false; })
			a.innerText = "100";
			li.appendChild(a);
			ul.appendChild(li);
			div.appendChild(ul);
			tablebuttons.appendChild(div);
			tfoot.lastElementChild.appendChild(tablebuttons);
		}

		var totalrecords = document.createElement("th");
		totalrecords.classList.add("totalrecords");
		var cols;
		switch (element.dataset.type) {
			case "slave":
			case "relational":
				totalrecords.setAttribute("colspan", element.dataset.columns.split(",").length);
				cols = element.dataset.columns.split(",").length;
				break;
			default:
				cols = 3;
		}

		tfoot.lastElementChild.appendChild(totalrecords);

		for (var i = cols; i < columnArr.length; i++) {
			var node = document.createElement("th");
			if (!element.dataset.slave || element.dataset.slave != "1") {
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
			button.addEventListener("click", function () { Tables[index].tableAddData() });
			var span = document.createElement("span");
			span.classList.add("glyphicon", "glyphicon-plus");
			span.setAttribute("aria-hidden", "true");
			var textnode = document.createTextNode(" Add");
			button.appendChild(span);
			button.appendChild(textnode);
			tablebuttons.appendChild(button);
		} else {
			switch (element.dataset.type) {
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
		var ul = document.createElement("ul");
		ul.classList.add("pagination", "btn-group");
		var li = document.createElement("li");
		li.classList.add("disabled");
		var a = document.createElement("a");
		a.href = "#";
		a.dataset.nav = "prev";
		a.addEventListener("click", function () { Tables[index].tablePagination(this); return false; });
		var span = document.createElement("span");
		span.setAttribute("aria-hidden", "true");
		span.innerHTML = "&laquo;";
		a.appendChild(span);
		li.appendChild(a);
		ul.appendChild(li);
		var li = document.createElement("li");
		var span = document.createElement("span");
		span.type = "button";
		span.classList.add("currentpage");
		span.setAttribute("contenteditable", "true");
		span.innerText = "1";
		span.addEventListener("keydown", function (event) {
			// Number 13 is the "Enter" key on the keyboard
			if (event.key === "Enter") {
				// Cancel the default action, if needed
				event.preventDefault();
				// Trigger the function
				Tables[index].tablePagination(this);
			}
		});
		li.appendChild(span);
		ul.appendChild(li);
		var li = document.createElement("li");
		var a = document.createElement("a");
		a.href = "#";
		a.dataset.nav = "next";
		a.addEventListener("click", function () { Tables[index].tablePagination(this); return false; });
		var span = document.createElement("span");
		span.setAttribute("aria-hidden", "true");
		span.innerHTML = "&raquo;";
		a.appendChild(span);
		li.appendChild(a);
		ul.appendChild(li);
		nav.appendChild(ul);
		navigation.appendChild(nav);
		tfoot.lastElementChild.appendChild(navigation);
		table.appendChild(tfoot);

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

	exportDataAsXML(element, data) {
		console.log("exportDataAsXML");

		let obj = JSON.parse(data);
		if (obj.totalrecords == 0) { return; }
		delete obj.totalrecords;

		let dataObj = new Object();

		/*
		let slaveTables = document.querySelectorAll('[data-ajax="table"][data-master="' + this.element.id + '"]');
		slaveTables.forEach((table) => {
			Tables[table.dataset.key].eventReceiver(e, i);
		});
		*/

		var el = {};
		el.dataset = {};

		el.dataset.url = "//wikiwfs.geo.uu.nl/e107_plugins/ajaxDBQuery/ajaxDBQuery.php";
		el.dataset.db = "llg";

		switch (Tables[0].element.dataset.table) {
			case "llg_nl_boreholeheader":
				el.dataset.table = "llg_nl_boreholedata";
				break;
			case "llg_it_boreholeheader":
				el.dataset.table = "llg_it_boreholedata";
				break;
			default: el.dataset.table = "0";
		}
		// el.dataset.table = "llg_it_boreholedata"; //Tables[0].element.dataset.table;	// Master table index
		el.dataset.columns = "startdepth,depth,texture,organicmatter,plantremains,color,oxired,gravelcontent,median,calcium,ferro,groundwater,sample,soillayer,stratigraphy,remarks";
		el.dataset.where = "borehole=''";
		el.dataset.order_by = "startdepth";
		el.dataset.direction = "ASC";

		function asyncAJAX(prop) {

			return new Promise((resolve, reject) => {
				//let [k, v] = Object.entries(obj)[prop];
				var k = Object.keys(obj)[prop];
				var v = obj[Object.keys(obj)[prop]];
				var index = v[Object.keys(v)[0]];

				//console.log([k,v]);
				//console.log(k);
				//console.log(v);
				//console.log(index);

				dataObj[k] = {};
				dataObj[k].boreholeheader = {};
				dataObj[k].boreholedata = {};

				dataObj[k].boreholeheader = v;

				el.dataset.where = "borehole='" + index + "'";

				ajax(el, (element, data) => {
					let obj = JSON.parse(data);
					if (obj.totalrecords == 0) { reject(); return; }
					delete obj.totalrecords;
					dataObj[k].boreholedata = obj;
					resolve(dataObj[k]);
				});

			})
		}

		var createJSON = new Promise((resolve, reject) => {

			const promises = [];
			for (const prop in obj) {
				promises.push(asyncAJAX(prop));
			}

			Promise.all(promises)
				.then(obj => {
					resolve(obj)
				}, reason => {
					console.log(reason)
				}).catch(e => {
					console.log(e)
				});

		});

		createJSON.then(obj => {

			var XMLSchema = () => {
				const xhr = new XMLHttpRequest(),
					method = "GET",
					url = "https://wikiwfs.geo.uu.nl/LLG/XMLSchema/LLG2012DataSet.xsd";

				xhr.open(method, url, true);
				xhr.setRequestHeader('Content-Type', 'text/xml');
				xhr.overrideMimeType('application/xml');

				xhr.onreadystatechange = function () {
					if (this.readyState === XMLHttpRequest.DONE) {
						if (this.status == 200) {
							createXML(this.responseXML);
						} else {
							console.log(this.statusText)
						}
					}
				}

				xhr.send(null);
			}

			var createXML = (schema) => {

				var namespaceURI,
					qualifiedNameStr,
					documentType;
				namespaceURI = "";
				qualifiedNameStr = "";
				documentType = null;

				var XMLDocument = document.implementation.createDocument(namespaceURI, qualifiedNameStr, documentType);
				var LLG2012Dataset = XMLDocument.createElement("LLG2012Dataset");
				LLG2012Dataset.appendChild(XMLDocument.createTextNode("\n"));
				LLG2012Dataset.setAttribute("xmlns", "http://tempuri.org/LLG2012DataSet.xsd");
				LLG2012Dataset.appendChild(XMLDocument.importNode(schema.documentElement, true));

				var BoreholeHeader = XMLDocument.createElement("BoreholeHeader");
				var Borehole = XMLDocument.createElement("Borehole");
				var Name = XMLDocument.createElement("Name");
				var DrillDate = XMLDocument.createElement("DrillDate");
				var Xco = XMLDocument.createElement("Xco");
				var Yco = XMLDocument.createElement("Yco");
				var CoordZone = XMLDocument.createElement("CoordZone");
				var Elevation = XMLDocument.createElement("Elevation");
				var DrillDepth = XMLDocument.createElement("DrillDepth");
				var Geom = XMLDocument.createElement("Geom");
				var Geol = XMLDocument.createElement("Geol");
				var Soil = XMLDocument.createElement("Soil");
				var Veget = XMLDocument.createElement("Veget");
				var GroundWaterStep = XMLDocument.createElement("GroundWaterStep");
				var ExtraRemarks = XMLDocument.createElement("ExtraRemarks");

				var BoreholeData = XMLDocument.createElement("BoreholeData");
				var Depth = XMLDocument.createElement("Depth");
				var StartDepth = XMLDocument.createElement("StartDepth");
				var Texture = XMLDocument.createElement("Texture");
				var OrganicMatter = XMLDocument.createElement("OrganicMatter");
				var PlantRemains = XMLDocument.createElement("PlantRemains");
				var Color = XMLDocument.createElement("Color");
				var OxiRed = XMLDocument.createElement("OxiRed");
				var GravelContent = XMLDocument.createElement("GravelContent");
				var Median = XMLDocument.createElement("Median");
				var Calcium = XMLDocument.createElement("Calcium");
				var Ferro = XMLDocument.createElement("Ferro");
				var GroundWater = XMLDocument.createElement("GroundWater");
				var Sample = XMLDocument.createElement("Sample");
				var SoilLayer = XMLDocument.createElement("SoilLayer");
				var Stratigraphy = XMLDocument.createElement("Stratigraphy");
				var Remarks = XMLDocument.createElement("Remarks");

				var GroupIdentity = XMLDocument.createElement("GroupIdentity");
				var Year = XMLDocument.createElement("Year");
				var Group = XMLDocument.createElement("Group");
				var Names = XMLDocument.createElement("Names");
				var LLGType = XMLDocument.createElement("LLGType");

				Object.keys(obj).forEach(key => {
					// console.log(key);
					// console.log(obj[key]);  // value
					LLG2012Dataset.appendChild(XMLDocument.createTextNode("\n"))
					var BoreholeHeader = XMLDocument.createElement("BoreholeHeader")
					if (obj[key].boreholeheader.borehole) {
						BoreholeHeader.appendChild(XMLDocument.createTextNode("\n\t"))
						BoreholeHeader.appendChild(Borehole.cloneNode(true))
						BoreholeHeader.lastElementChild.appendChild(XMLDocument.createTextNode(obj[key].boreholeheader.borehole))
					}
					if (obj[key].boreholeheader.name) {
						BoreholeHeader.appendChild(XMLDocument.createTextNode("\n\t"))
						BoreholeHeader.appendChild(Name.cloneNode(true))
						BoreholeHeader.lastElementChild.appendChild(XMLDocument.createTextNode(obj[key].boreholeheader.name.substring(0, 20)))
					}
					if (obj[key].boreholeheader.drilldate) {
						BoreholeHeader.appendChild(XMLDocument.createTextNode("\n\t"))
						BoreholeHeader.appendChild(DrillDate.cloneNode(true))
						BoreholeHeader.lastElementChild.appendChild(XMLDocument.createTextNode(obj[key].boreholeheader.drilldate))
					}
					if (obj[key].boreholeheader.xco) {
						BoreholeHeader.appendChild(XMLDocument.createTextNode("\n\t"))
						BoreholeHeader.appendChild(Xco.cloneNode(true))
						BoreholeHeader.lastElementChild.appendChild(XMLDocument.createTextNode(obj[key].boreholeheader.xco))
					}
					if (obj[key].boreholeheader.yco) {
						BoreholeHeader.appendChild(XMLDocument.createTextNode("\n\t"))
						BoreholeHeader.appendChild(Yco.cloneNode(true))
						BoreholeHeader.lastElementChild.appendChild(XMLDocument.createTextNode(obj[key].boreholeheader.yco))
					}
					if (obj[key].boreholeheader.coordzone) {
						BoreholeHeader.appendChild(XMLDocument.createTextNode("\n\t"))
						BoreholeHeader.appendChild(CoordZone.cloneNode(true))
						BoreholeHeader.lastElementChild.appendChild(XMLDocument.createTextNode(obj[key].boreholeheader.coordzone))
					}
					if (obj[key].boreholeheader.elevation) {
						BoreholeHeader.appendChild(XMLDocument.createTextNode("\n\t"))
						BoreholeHeader.appendChild(Elevation.cloneNode(true))
						BoreholeHeader.lastElementChild.appendChild(XMLDocument.createTextNode(obj[key].boreholeheader.elevation))
					}
					if (obj[key].boreholeheader.drilldepth) {
						BoreholeHeader.appendChild(XMLDocument.createTextNode("\n\t"))
						BoreholeHeader.appendChild(DrillDepth.cloneNode(true))
						BoreholeHeader.lastElementChild.appendChild(XMLDocument.createTextNode(obj[key].boreholeheader.drilldepth))
					}
					if (obj[key].boreholeheader.geom) {
						BoreholeHeader.appendChild(XMLDocument.createTextNode("\n\t"))
						BoreholeHeader.appendChild(Geom.cloneNode(true))
						BoreholeHeader.lastElementChild.appendChild(XMLDocument.createTextNode(obj[key].boreholeheader.geom))
					}
					if (obj[key].boreholeheader.geol) {
						BoreholeHeader.appendChild(XMLDocument.createTextNode("\n\t"))
						BoreholeHeader.appendChild(Geol.cloneNode(true))
						BoreholeHeader.lastElementChild.appendChild(XMLDocument.createTextNode(obj[key].boreholeheader.geol))
					}
					if (obj[key].boreholeheader.soil) {
						BoreholeHeader.appendChild(XMLDocument.createTextNode("\n\t"))
						BoreholeHeader.appendChild(Soil.cloneNode(true))
						BoreholeHeader.lastElementChild.appendChild(XMLDocument.createTextNode(obj[key].boreholeheader.soil))
					}
					if (obj[key].boreholeheader.veget) {
						BoreholeHeader.appendChild(XMLDocument.createTextNode("\n\t"))
						BoreholeHeader.appendChild(Veget.cloneNode(true))
						BoreholeHeader.lastElementChild.appendChild(XMLDocument.createTextNode(obj[key].boreholeheader.veget))
					}
					if (obj[key].boreholeheader.groundwaterstep) {
						BoreholeHeader.appendChild(XMLDocument.createTextNode("\n\t"))
						BoreholeHeader.appendChild(GroundWaterStep.cloneNode(true))
						BoreholeHeader.lastElementChild.appendChild(XMLDocument.createTextNode(obj[key].boreholeheader.groundwaterstep))
					}
					if (obj[key].boreholeheader.extraremarks) {
						BoreholeHeader.appendChild(XMLDocument.createTextNode("\n\t"))
						BoreholeHeader.appendChild(ExtraRemarks.cloneNode(true))
						BoreholeHeader.lastElementChild.appendChild(XMLDocument.createTextNode(obj[key].boreholeheader.extraremarks))
					}

					Object.values(obj[key].boreholedata).forEach(value => {
						//console.log(value);
						//console.log(obj[key].boreholeheader.borehole);
						//console.log(obj[key].boreholedata);
						BoreholeHeader.appendChild(XMLDocument.createTextNode("\n\t"));
						var BoreholeData = XMLDocument.createElement("BoreholeData")
						if (obj[key].boreholeheader.borehole) {
							BoreholeData.appendChild(Borehole.cloneNode(true))
							BoreholeData.lastElementChild.appendChild(XMLDocument.createTextNode(obj[key].boreholeheader.borehole))
						}
						if (value.depth) {
							BoreholeData.appendChild(Depth.cloneNode(true))
							BoreholeData.lastElementChild.appendChild(XMLDocument.createTextNode(value.depth))
							BoreholeData.appendChild(StartDepth.cloneNode(true))
							BoreholeData.lastElementChild.appendChild(XMLDocument.createTextNode(value.startdepth))
						}
						if (value.texture) {
							BoreholeData.appendChild(Texture.cloneNode(true))
							BoreholeData.lastElementChild.appendChild(XMLDocument.createTextNode(value.texture))
						}
						if (value.organicmatter) {
							BoreholeData.appendChild(OrganicMatter.cloneNode(true))
							BoreholeData.lastElementChild.appendChild(XMLDocument.createTextNode(value.organicmatter))
						}
						if (value.plantremains) {
							BoreholeData.appendChild(PlantRemains.cloneNode(true))
							BoreholeData.lastElementChild.appendChild(XMLDocument.createTextNode(value.plantremains))
						}
						if (value.color) {
							BoreholeData.appendChild(Color.cloneNode(true))
							BoreholeData.lastElementChild.appendChild(XMLDocument.createTextNode(value.color))
						}
						if (value.oxired) {
							BoreholeData.appendChild(OxiRed.cloneNode(true))
							BoreholeData.lastElementChild.appendChild(XMLDocument.createTextNode(value.oxired))
						}
						if (value.gravelcontent) {
							BoreholeData.appendChild(GravelContent.cloneNode(true))
							BoreholeData.lastElementChild.appendChild(XMLDocument.createTextNode(value.gravelcontent))
						}
						if (value.median) {
							BoreholeData.appendChild(Median.cloneNode(true))
							BoreholeData.lastElementChild.appendChild(XMLDocument.createTextNode(value.median))
						}
						if (value.calcium) {
							BoreholeData.appendChild(Calcium.cloneNode(true))
							BoreholeData.lastElementChild.appendChild(XMLDocument.createTextNode(value.calcium))
						}
						if (value.ferro) {
							BoreholeData.appendChild(Ferro.cloneNode(true))
							BoreholeData.lastElementChild.appendChild(XMLDocument.createTextNode(value.ferro))
						}
						if (value.groundwater) {
							BoreholeData.appendChild(GroundWater.cloneNode(true))
							BoreholeData.lastElementChild.appendChild(XMLDocument.createTextNode(value.groundwater))
						}
						if (value.sample) {
							BoreholeData.appendChild(Sample.cloneNode(true))
							BoreholeData.lastElementChild.appendChild(XMLDocument.createTextNode(value.sample))
						}
						if (value.soillayer) {
							BoreholeData.appendChild(SoilLayer.cloneNode(true))
							BoreholeData.lastElementChild.appendChild(XMLDocument.createTextNode(value.soillayer))
						}
						if (value.stratigraphy) {
							BoreholeData.appendChild(Stratigraphy.cloneNode(true))
							BoreholeData.lastElementChild.appendChild(XMLDocument.createTextNode(value.stratigraphy))
						}
						if (value.remarks) {
							BoreholeData.appendChild(Remarks.cloneNode(true))
							BoreholeData.lastElementChild.appendChild(XMLDocument.createTextNode(value.remarks))
						}
						BoreholeHeader.appendChild(BoreholeData.cloneNode(true))

					})

					//console.log(Object.values(obj[key])[0]);
					//console.log(obj[key].boreholeheader);
					//console.log(Object.values(obj[key])[1]);
					//console.log(obj[key].boreholedata);
					BoreholeHeader.appendChild(XMLDocument.createTextNode("\n"))
					LLG2012Dataset.appendChild(BoreholeHeader.cloneNode(true))

				});

				var llgtype;
				switch (Tables[0].element.dataset.table) {
					case "llg_nl_boreholedata":
						llgtype = "0";
						break;
					case "llg_it_boreholedata":
						llgtype = "2";
						break;
					default: llgtype = "0";
				}
				GroupIdentity.appendChild(XMLDocument.createTextNode("\n\t"))
				GroupIdentity.appendChild(Year)
				GroupIdentity.lastElementChild.appendChild(XMLDocument.createTextNode("9999"))
				GroupIdentity.appendChild(XMLDocument.createTextNode("\n\t"))
				GroupIdentity.appendChild(Group)
				GroupIdentity.lastElementChild.appendChild(XMLDocument.createTextNode("99"))
				GroupIdentity.appendChild(XMLDocument.createTextNode("\n\t"))
				GroupIdentity.appendChild(Names)
				GroupIdentity.lastElementChild.appendChild(XMLDocument.createTextNode("collection"))
				GroupIdentity.appendChild(XMLDocument.createTextNode("\n\t"))
				GroupIdentity.appendChild(LLGType)
				GroupIdentity.lastElementChild.appendChild(XMLDocument.createTextNode(llgtype))
				GroupIdentity.appendChild(XMLDocument.createTextNode("\n"))

				LLG2012Dataset.appendChild(XMLDocument.createTextNode("\n"))
				LLG2012Dataset.appendChild(GroupIdentity)
				LLG2012Dataset.appendChild(XMLDocument.createTextNode("\n"))
				XMLDocument.appendChild(LLG2012Dataset)

				let file = new File(['<?xml version="1.0" standalone="yes"?>' + "\n" + (new XMLSerializer()).serializeToString(XMLDocument)], { type: 'text/xml' });
				let url = URL.createObjectURL(file);
				let elem = window.document.createElement('a');
				elem.href = url;
				//elem.download = "LLGData-" + element.getElementsByTagName("caption")[0].innerText.replace("Yeargroup: ", "yeargroup_") + ".xml";
				elem.download = element.getElementsByTagName("caption")[0].innerText.replace("Yeargroup: ", "") + ".xml";
				document.body.appendChild(elem);
				elem.click();
				document.body.removeChild(elem);
				URL.revokeObjectURL(url); //Releases the resources
			}

			XMLSchema();

		}, reason => {
			console.log(reason)
		}).catch(e => {
			console.log(e)
		});

	}
	
	tableLimit(element) {
		//console.log("tableLimit");

		let table = element.closest("table");
		let button = element.closest("th").getElementsByTagName("button")[1];
		button.getElementsByTagName("span")[0].innerText = element.innerText;

		if (table.dataset.limit !== element.innerText) {
			if (parseInt(table.dataset.limit, 10) >= parseInt(table.dataset.totalrecords) && parseInt(element.innerText, 10) >= parseInt(table.dataset.totalrecords)) {
				return null;
			}
			table.dataset.limit = element.innerText;
			table.dataset.offset = 0;
			table.getElementsByTagName("nav")[0].getElementsByTagName("ul")[0].firstElementChild.classList.add("disabled");
			table.getElementsByClassName("currentpage")[0].innerText = parseInt(table.dataset.offset, 10) + 1;
			table.getElementsByTagName("nav")[0].getElementsByTagName("ul")[0].lastElementChild.classList.remove("disabled");
			table.setAttribute("aria-expanded", true);

			ajax(table, this.tableTabulate.bind(this));
		}

	}

	tablePagination(element) {
		// console.log("tablePagination");

		let table = element.closest("table");
		let currentpage = parseInt(table.dataset.offset, 10) + 1;
		let totalpages = Math.ceil(parseInt(table.dataset.totalrecords, 10) / parseInt(table.dataset.limit, 10));

		if (totalpages == 1) { table.getElementsByClassName("currentpage")[0].innerText = totalpages; return; }

		if (element.dataset.nav == "next" && parseInt(table.dataset.offset, 10) + 1 < totalpages) {
			table.dataset.offset = parseInt(table.dataset.offset, 10) + 1;
		} else if (element.dataset.nav == "prev" && parseInt(table.dataset.offset, 10) + 1 > 1) {
			table.dataset.offset = parseInt(table.dataset.offset, 10) - 1;
		} else if (table.getElementsByClassName("currentpage")[0].innerText > totalpages) {
			if (parseInt(table.dataset.offset, 10) + 1 !== totalpages) {
				table.dataset.offset = parseInt(totalpages, 10) - 1 ;
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
			ajax(table, this.tableTabulate.bind(this));
		}
	}

	tableSort(element) {
		//console.log("tableSort");

		let table = element.closest("table");
		if (table.dataset.slave || table.dataset.slave == "1") {
			//TODO: sort on master
			return;
		}

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
			table.getElementsByTagName("nav")[0].getElementsByTagName("ul")[0].firstElementChild.classList.add("disabled");
			table.getElementsByClassName("currentpage")[0].innerText = parseInt(table.dataset.offset, 10) + 1;
			table.getElementsByTagName("nav")[0].getElementsByTagName("ul")[0].lastElementChild.classList.remove("disabled");

			ajax(table, this.tableTabulate.bind(this));

		}

	}

	tableToggle(element) {

		let table = element.closest("table");
		let nodes = table.getElementsByClassName("collapse");

		for (const node of nodes) {
			node.classList.toggle("in");
			node.toggleAttribute("aria-expanded");
		}

		element.classList.toggle("btn-primary");
		element.classList.toggle("btn-secondary");
		element.firstElementChild.classList.toggle("glyphicon-chevron-down");
		element.firstElementChild.classList.toggle("glyphicon-chevron-up");
		table.toggleAttribute("aria-expanded");

	}

}

export default ajaxTable;
