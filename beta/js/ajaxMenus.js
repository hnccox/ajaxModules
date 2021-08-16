'use strict';

import { default as ajax } from "/e107_plugins/ajaxDBQuery/beta/js/ajaxDBQuery.js";
import { default as storageHandler } from "/e107_plugins/storageHandler/js/storageHandler.js";

class ajaxMenu {
    constructor(element, index, object = {}) {
        console.log("ajaxMenu constructor");

        for (const [key, value] of Object.entries(object)) {
            this[key] = value;
        }

        this.element = element;
        this.index = index;

        element.dataset.key = index;
        element.setAttribute("id", "Menus[" + index + "]");

        let method = "GET";
        let sql = {
            "url": element.dataset.url,
            "db": element.dataset.db,
            "query": {
                "select": {
                    "columns": {
                        0: "id",
                        1: "name",
                        2: "displayname"
                    },
                    "from": {
                        "table": element.dataset.table
                    }
                },
                "order_by": {
                    "identifier": "id",
                    "direction": "ASC"
                },
                "limit": 100,
                "offset": 0
            }
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
        console.log("menuTabulate");
        // TO DO: Decouple function from data!

        let self = this;
        let menu = this.element;

        const obj = JSON.parse(response.data);
        const totalrecords = obj["totalrecords"];
        delete obj.totalrecords;

        var node = document.createElement("UL");
        node.style.listStyleType = "none";
        menu.appendChild(node);

        Object.keys(obj).forEach(function (key) {
            if (parseInt(obj[key].id, 10) % 10 == 0) {
                menu.lastElementChild.appendChild(document.createElement("BR"));
                var node = document.createElement("LI");
                var textnode = document.createTextNode(obj[key].displayname);
                node.appendChild(textnode);
                node.style.fontSize = "2rem";
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
                        table.dataset.where = "systemgrp BETWEEN " + obj[key].id + " AND " + parseInt(obj[key].id + 9, 10);
                        let method = "GET";
                        let sql = {
                            "url": table.dataset.url,
                            "db": table.dataset.db,
                            "query": JSON.parse(table.dataset.query)
                        }
                        sql.query.offset = table.dataset.offset;
                        sql.query.where[0].identifier = "systemgrp";
                        delete sql.query.where[0].value;
                        sql.query.where[0].between[0] = parseInt(obj[key].id, 10);
                        sql.query.where[0].between[1] = parseInt(obj[key].id, 10) + 9;
                        ajax(method, sql, Tables[index].tableTabulate.bind(Tables[index]));
                    });
                };
                menu.lastElementChild.appendChild(node);
            } else {
                if (parseInt(obj[key].id, 10) % 10 == 1) {
                    var node = document.createElement("UL");
                    menu.lastElementChild.lastElementChild.appendChild(node);
                }
                var node = document.createElement("LI");
                var textnode = document.createTextNode(obj[key].displayname);
                node.appendChild(textnode);
                node.style.fontSize = "1.5rem";
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
                        table.dataset.where = "systemgrp=" + obj[key].id;
                        let method = "GET";
                        let sql = {
                            "url": table.dataset.url,
                            "db": table.dataset.db,
                            "query": JSON.parse(table.dataset.query)
                        }
                        sql.query.offset = table.dataset.offset;
                        sql.query.where[0].identifier = "systemgrp";
                        delete sql.query.where[0].between;
                        sql.query.where[0].value = parseInt(obj[key].id, 10);
                        ajax(method, sql, Tables[index].tableTabulate.bind(Tables[index]));
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
