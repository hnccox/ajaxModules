'use strict';

import { default as ajax } from "/e107_plugins/ajaxDBQuery/beta/js/ajaxDBQuery.js";
import { default as storageHandler } from "/e107_plugins/storageHandler/js/storageHandler.js";
import { default as jsonSQL } from "/e107_plugins/jsonSQL/js/jsonSQL.js";

class ajaxMenu {
    constructor(element, index, object = {}) {
        console.log("ajaxMenu constructor");

        element.dataset.key = index;
        element.setAttribute("id", "ajaxMenus[" + index + "]");

        while (element.firstChild) {
			element.removeChild(element.firstChild);
		}

        for (const [key, value] of Object.entries(object)) {
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
        
        let method = "GET";
        let sql = {
            "url": element.dataset.url,
            "db": element.dataset.db,
            "query": JSON.parse(element.dataset.query)
        }
        ajax(method, sql, this.menuTabulate.bind(this));
    }

    get Dataset() {
        return this.element.dataset;
    }

    get Index() {
        return this.index;
    }

    get Data() {
        return this.data;
    }

    menuCallback(element) {
        console.log("menuCallback");

        if (this._menuCallback.functions) {
            let callbacks = this._menuCallback.functions;
            Object.keys(callbacks).forEach(function (value) {
                callbacks[value](element);
            })
        }

    }

    menuTabulate(response) {
        if(response.type !== "success") return response;

        console.log("menuTabulate");
        console.log(response);
        // TO DO: Decouple function from data!

        let self = this;
        let menu = this.element;

		const data = response.data;
		const obj = response.data.dataset;
		const records = data["records"];
		const totalrecords = data["totalrecords"];
		delete data.records;
		delete data.totalrecords;

        var node = document.createElement("UL");
        //node.style.listStyleType = "none";
        node.classList.add("list-unstyled");
        menu.appendChild(node);

        Object.keys(obj).forEach(function (key) {
            if (parseInt(obj[key].id, 10) % 10 == 0) {
                //menu.lastElementChild.appendChild(document.createElement("BR"));
                var node = document.createElement("LI");
                var textnode = document.createTextNode(obj[key].displayname);
                node.appendChild(textnode);
                //node.style.fontSize = "2em";
                node.setAttribute("data-systemgrp", obj[key].id);
                node.onclick = function (e) {
                    e.stopPropagation();
                    var elements = this.closest('div[data-ajax="menu"]').querySelectorAll(".active");
                    for (let elem of elements) {
                        elem.classList.remove("active");
                    }
                    this.classList.add("active");
                    let slaveTables = document.querySelectorAll('[data-ajax="table"]');
                    slaveTables.forEach((table, index) => {

                        let title = table.firstElementChild;
                        title.innerHTML = obj[key].displayname;
                        table.dataset.offset = 0;
                        //table.dataset.where = "systemgrp BETWEEN " + obj[key].id + " AND " + parseInt(obj[key].id + 9, 10);
                        let method = "GET";
                        let sql = {
                            "url": table.dataset.url,
                            "db": table.dataset.db,
                            "query": JSON.parse(table.dataset.query)
                        }
                        // Object.keys(sql.query).forEach((i) => {
                        //     if(Object.keys(sql.query[i])[0] == "where") {
                        //         sql.query[i].where[0]["identifier"] = "systemgrp";
                        //         delete sql.query[i].where[0].value;
                        //         sql.query[i].where[0]["between"][0] = parseInt(obj[key].id, 10);
                        //         sql.query[i].where[0]["between"][1] = parseInt(obj[key].id, 10) + 9;
                        //     }
                        // })
                        for (const [i] of Object.keys(sql.query)) {
                            switch(Object.keys(sql.query[i])[0]) {
                                case "where":
                                    sql.query[i].where[0]["identifier"] = "systemgrp";
                                    delete sql.query[i].where[0].value;
                                    sql.query[i].where[0]["between"] = {};
                                    sql.query[i].where[0]["between"][0] = parseInt(obj[key].id, 10);
                                    sql.query[i].where[0]["between"][1] = parseInt(obj[key].id, 10) + 9;
                                    break;
                                case "offset":
                                    sql.query[i].offset = 0;
                                    break;
                            }
                            // if(Object.keys(sql.query[i])[0] == "where") {
                            //     sql.query[i].where[0]["identifier"] = "systemgrp";
                            //     delete sql.query[i].where[0].value;
                            //     sql.query[i].where[0]["between"] = {};
                            //     sql.query[i].where[0]["between"][0] = parseInt(obj[key].id, 10);
                            //     sql.query[i].where[0]["between"][1] = parseInt(obj[key].id, 10) + 9;
                            // }
                        }
                        table.dataset.query = JSON.stringify(sql.query);
                        ajax(method, sql, ajaxTables[index].tableTabulate.bind(ajaxTables[index]));
                    });
                };
                menu.lastElementChild.appendChild(node);
            } else {
                if (parseInt(obj[key].id, 10) % 10 == 1) {
                    var node = document.createElement("UL");
                    //node.style.listStyleType = "none";
                    //node.classList.add("list-unstyled");
                    menu.lastElementChild.lastElementChild.appendChild(node);
                }
                var node = document.createElement("LI");
                var textnode = document.createTextNode(obj[key].displayname);
                node.appendChild(textnode);
                //node.style.fontSize = "1.5em";
                node.setAttribute("data-systemgrp", obj[key].id);
                node.onclick = function (e) {
                    e.stopPropagation();

                    var elements = this.closest('div[data-ajax="menu"]').querySelectorAll(".active");
                    for (let elem of elements) {
                        elem.classList.remove("active");
                    }
                    this.classList.add("active");

                    let slaveTables = document.querySelectorAll('[data-ajax="table"]');
                    slaveTables.forEach((table, index) => {
                        let title = table.firstElementChild;
                        title.innerHTML = obj[key].displayname;
                        table.dataset.offset = 0;
                        //table.dataset.where = "systemgrp=" + obj[key].id;

                        let method = "GET";
                        let sql = {
                            "url": table.dataset.url,
                            "db": table.dataset.db,
                            "query": JSON.parse(table.dataset.query)
                        }
                        // Object.keys(sql.query).forEach((i) => {
                        //     if(Object.keys(sql.query[i])[0] == "where") {
                        //         sql.query[i].where[0]["identifier"] = "systemgrp";
                        //         delete sql.query[i].where[0]["between"];
                        //         sql.query[i].where[0]["value"] = parseInt(obj[key].id, 10);
                        //     }
                        // })
                        for (const [i] of Object.keys(sql.query)) {
                            
                            switch(Object.keys(sql.query[i])[0]) {
                                case "where":
                                    sql.query[i].where[0]["identifier"] = "systemgrp";
                                    delete sql.query[i].where[0]["between"];
                                    sql.query[i].where[0]["value"] = parseInt(obj[key].id, 10);
                                    break;
                                case "offset":
                                    sql.query[i].offset = 0;
                                    break;
                            }
                        }
                        table.dataset.query = JSON.stringify(sql.query);
                        ajax(method, sql, ajaxTables[index].tableTabulate.bind(ajaxTables[index]));

                    });
                };
                menu.lastElementChild.lastElementChild.lastElementChild.appendChild(node);
            }
        });

        menu.firstElementChild.getElementsByTagName("LI")[0].classList.add("active");

        this.menuCallback(menu);

    }
}

export default ajaxMenu;
