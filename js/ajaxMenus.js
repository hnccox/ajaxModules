'use strict';

import { default as ajax } from "/e107_plugins/ajaxDBQuery/js/ajaxDBQuery.js";
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

        ajax(element, this.menuTabulate.bind(this));
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

        if(this._menuCallback.functions) {
			let callbacks = this._menuCallback.functions;
			Object.keys(callbacks).forEach(function (value) {
				callbacks[value](element);
			})
		}

    }

    menuTabulate(element, data) {
        console.log("menuTabulate");
        // TO DO: Decouple function from data!
        let menu = element;
        let obj = JSON.parse(data);
        let { totalrecords, ...dataset } = obj;

        var node = document.createElement("UL");
        node.style.listStyleType = "none";
        menu.appendChild(node);

        Object.keys(dataset).forEach(function (key) {
            if (parseInt(dataset[key].id, 10) % 10 == 0) {
                menu.lastElementChild.appendChild(document.createElement("BR"));
                var node = document.createElement("LI");
                var textnode = document.createTextNode(dataset[key].displayname);
                node.appendChild(textnode);
                node.style.fontSize = "2rem";
                node.setAttribute("data-systemgrp", dataset[key].id);
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
                        title.innerHTML = dataset[key].displayname;
                        table.dataset.offset = "0";
                        table.dataset.where = "systemgrp BETWEEN " + dataset[key].id + " AND " + parseInt(dataset[key].id + 9, 10);
                        ajax(table, Tables[index].tableTabulate.bind(Tables[index]));
                    });
                };
                menu.lastElementChild.appendChild(node);
            } else {
                if (parseInt(dataset[key].id, 10) % 10 == 1) {
                    var node = document.createElement("UL");
                    menu.lastElementChild.lastElementChild.appendChild(node);
                }
                var node = document.createElement("LI");
                var textnode = document.createTextNode(dataset[key].displayname);
                node.appendChild(textnode);
                node.style.fontSize = "1.5rem";
                node.setAttribute("data-systemgrp", dataset[key].id);
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
                        title.innerHTML = dataset[key].displayname;
                        table.dataset.offset = "0";
                        table.dataset.where = "systemgrp=" + dataset[key].id;
                        ajax(table, Tables[index].tableTabulate.bind(Tables[index]));
                    });
                };
                menu.lastElementChild.lastElementChild.lastElementChild.appendChild(node);
            }
        });

        menu.firstElementChild.getElementsByTagName("LI")[0].classList.add("active");
        this.menuCallback(element);

    }
}

export default ajaxMenu;
