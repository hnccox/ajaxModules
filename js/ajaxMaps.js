'use strict';

import { default as ajax } from "/e107_plugins/ajaxDBQuery/js/ajaxDBQuery.js";
import { default as storageHandler } from "/e107_plugins/storageHandler/js/storageHandler.js";

proj4.defs([
    [
        'EPSG:4326',
        '+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees'],
    [
        'EPSG:28992',
        '+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +towgs84=565.417,50.3319,465.552,-0.398957,0.343988,-1.8774,4.0725 +units=m +no_defs'],
    [
        'EPSG:28992 / RD New',
        '+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +towgs84=565.417,50.3319,465.552,-0.398957,0.343988,-1.8774,4.0725 +units=m +no_defs'],
    [
        'EPSG:25833',
        '+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'],
    [
        'EPSG:25833 / UTM zone 33N',
        '+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'],
]);

class ajaxMap {
    constructor(element, index, object = {}) {
        console.log("ajaxMap constructor");

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
        element.setAttribute("id", "Maps[" + index + "]");

        let mbAttr = 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
        let mbUrl = 'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiaG5jY294IiwiYSI6ImNrbTlxam8wdzE1N2gycGxhN3RiNHpmODkifQ.FQmxF3Bjsb8ElMnALjgO_A';

        let light = L.tileLayer(mbUrl, { id: 'mapbox/light-v9', tileSize: 512, zoomOffset: -1, attribution: mbAttr }),
            dark = L.tileLayer(mbUrl, { id: 'mapbox/dark-v10', tileSize: 512, zoomOffset: -1, attribution: mbAttr }),
            satellite = L.tileLayer(mbUrl, { id: 'mapbox/satellite-v9', tileSize: 512, zoomOffset: -1, attribution: mbAttr });

        let map = L.map(element, {
            center: [parseFloat(element.dataset.lat), parseFloat(element.dataset.lng)],
            zoom: parseInt(element.dataset.zoom, 10),
            cursor: true,
            layers: [light]
        });

        let baseMaps = {
            "Grayscale": light,
            "Darkmode": dark,
            "Satellite": satellite
        };

        let markers = {};
        let selectedMarkers = {};

        let icon = L.icon({
            iconUrl: 'img/markers/m1_30.png',
            iconSize: [10, 10], // size of the icon
        });

        let highlightIcon = L.icon({
            iconUrl: 'img/markers/m1_30.png',
            iconSize: [15, 15], // size of the icon
        });

        let selectedIcon = L.icon({
            iconUrl: 'img/markers/m1y_0.png',
            iconSize: [15, 15], // size of the icon
        });

        // TODO: For each overlaymaps...
        let overlayMaps = JSON.parse(element.dataset.overlaymaps);

        Object.keys(overlayMaps).forEach(function (value) {
            overlayMaps[value] = [];
            overlayMaps[value]["heat"] = L.heatLayer([], {});
            //overlayMaps[value] = L.layerGroup();
            //overlayMaps[value] = L.conditionalMarkers([], {maxMarkers: 300});

            overlayMaps[value]["markers"] = L.markerClusterGroup({
                showCoverageOnHover: true,
                zoomToBoundsOnClick: true,
                spiderfyOnMaxZoom: false,
                removeOutsideVisibleBounds: true,
                animate: true,
                animateAddingMarkers: false,
                disableClusteringAtZoom: element.dataset.zoomlevel,
                //maxClusterRadius: 80,'
                singleMarkerMode: false,
                spiderLegPolylineOptions: {
                    weight: 1.5,
                    color: '#222',
                    opacity: 0.5
                },

                //spiderfyDistanceMultiplier: 1,

                iconCreateFunction: function (cluster) {
                    return L.divIcon({ html: '<div><span>' + cluster.getChildCount() + '</span></div>' });
                },

                iconCreateFunction: function (e) {
                    var t = e.getChildCount(),
                        i = " marker-cluster-",
                        text = t,
                        size = 40;
                    if (t >= self.element.dataset.limit) {
                        var text = "&#128269;";
                        var size = 80;
                    }

                    return i += 10 > t ? "small" : 100 > t ? "medium" : self.element.dataset.limit > t ? "large" : "xxl", new L.DivIcon({
                        html: "<div><span>" + text + "</span></div>", className: "marker-cluster" + i, iconSize: new L.Point(size, size)
                    })
                },

                spiderfyShapePositions: function (count, centerPt) {
                    var distanceFromCenter = 35,
                        markerDistance = 45,
                        lineLength = markerDistance * (count - 1),
                        lineStart = centerPt.y - lineLength / 2,
                        res = [],
                        i;

                    res.length = count;

                    for (i = count - 1; i >= 0; i--) {
                        res[i] = new Point(centerPt.x + distanceFromCenter, lineStart + markerDistance * i);
                    }

                    return res;
                },

                //clusterPane: '',
            });

        });

        let overlayGroups = {};
        overlayGroups["boreholes"] = L.layerGroup();
        if (map.getZoom() < parseInt(element.dataset.zoomlevel, 10)) {
            overlayMaps[Object.keys(overlayMaps)[0]]["heat"].addTo(overlayGroups["boreholes"])
        }
        overlayMaps[Object.keys(overlayMaps)[0]]["markers"].addTo(overlayGroups["boreholes"])
        overlayGroups["boreholes"].addTo(map);

        L.control.layers(baseMaps, { "Boreholes": overlayGroups["boreholes"] }).addTo(map);

        L.control.scale({maxWidth: 200}).addTo(map);

        // http://leafletjs.com/reference-1.1.0.html#class-constructor-hooks
        L.Map.addInitHook(function () {
            // Store a reference of the Leaflet map object on the map container,
            // so that it could be retrieved from DOM selection.
            // https://leafletjs.com/reference-1.3.4.html#map-getcontainer
            this.getContainer()._leaflet_map = this;
        });

        var drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);

        /*
        var heat = L.heatLayer([
            [52.5, 5.45, 0.2], // lat, lng, intensity
            [52.45, 5.50, 0.2],
        ], {radius: 25}).addTo(map);

        var latlng = [52.3, 5.48, 0.2];
        heat.addLatLng(latlng);
        */

        var options = {
            position: 'topleft',
            draw: {
                polyline: false,
                polygon: false,
                circle: false,
                rectangle: {
                    shapeOptions: {
                        clickable: false
                    }
                },
                marker: false,
                circlemarker: false
            },
            edit: {
                featureGroup: drawnItems, //REQUIRED!!
                remove: true
            }
        };

        L.Polyline.include({
            contains: function () { return; }
        });

        L.Polygon.include({
            contains: function (latLng) {
                return turf.inside(new L.Marker(latLng).toGeoJSON(), this.toGeoJSON());
            }
        });

        L.Rectangle.include({
            contains: function (latLng) {
                return this.getBounds().contains(latLng);
            }
        });

        L.Circle.include({
            contains: function (latLng) {
                return this.getLatLng().distanceTo(latLng) < this.getRadius();
            }
        });

        L.CircleMarker.include({
            contains: function () {
                return this.getLatLng();
            }
        });

        var drawControl = new L.Control.Draw(options);
        map.addControl(drawControl);

        // Truncate value based on number of decimals
        var _round = function (num, len) {
            return Math.round(num * (Math.pow(10, len))) / (Math.pow(10, len));
        };
        // Helper method to format LatLng object (x.xxxxxx, y.yyyyyy)
        var strLatLng = function (latlng) {
            return "(" + _round(latlng.lat, 6) + ", " + _round(latlng.lng, 6) + ")";
        };

        // Generate popup content based on layer type
        // - Returns HTML string, or null if unknown object
        var getPopupContent = function (layer) {
            // Marker - add lat/long
            if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
                return strLatLng(layer.getLatLng());
                // Circle - lat/long, radius
            } else if (layer instanceof L.Circle) {
                var center = layer.getLatLng(),
                    radius = layer.getRadius();
                return "Center: " + strLatLng(center) + "<br />"
                    + "Radius: " + _round(radius, 2) + " m";
                // Rectangle/Polygon - area
            } else if (layer instanceof L.Polygon) {
                var latlngs = layer._defaultShape ? layer._defaultShape() : layer.getLatLngs(),
                    area = L.GeometryUtil.geodesicArea(latlngs);

                var bounds = layer.getBounds();
                var xmin, ymin, xmax, ymax, srid;
                xmin = bounds._southWest.lng;
                ymin = bounds._southWest.lat;
                xmax = bounds._northEast.lng;
                ymax = bounds._northEast.lat;
                srid = 4326;

                var fromProjection = 'EPSG:4326';
                switch (element.dataset.table) {
                    case "llg_it_geom":
                        var toProjection = 'EPSG:25833';
                        break;
                    case "llg_nl_geom":
                    case "c14_geom":
                        var toProjection = 'EPSG:28992';
                        break;
                }

                var projCoordSW = Object.assign({}, proj4(fromProjection, toProjection).forward([xmin, ymin]));
                var projCoordNE = Object.assign({}, proj4(fromProjection, toProjection).forward([xmax, ymax]));

                var projCoord = { 
                    '_southWest': {
                        'lat': projCoordSW[1],
                        'lng': projCoordSW[0]
                    },
                    '_northEast': {
                        'lat': projCoordNE[1],
                        'lng': projCoordNE[0]
                    }
                };

                Object.keys(overlayMaps).forEach(function (key) {
                    if (map.hasLayer(overlayMaps[key]["markers"])) {
                        overlayMaps[key]["markers"].eachLayer(function (marker) {
                            if (layer.contains(marker.getLatLng())) {
                                markers[marker.properties.id].setIcon(selectedIcon);
                                selectedMarkers[marker.properties.id] = marker;
                            }
                        })
                    }
                })

                var output = "Area: " + L.GeometryUtil.readableArea(area, true);
                    output += "<br>";
                    output += "( "+ parseFloat(projCoord._northEast.lng - projCoord._southWest.lng).toFixed(0) + " x " + parseFloat(projCoord._northEast.lat - projCoord._southWest.lat).toFixed(0) + "m )";
                    output += "<br>";
                    output += "<br>";
                    output += "# Features selected: " + Object.keys(selectedMarkers).length;
                    output += "<br>";
                    output += "<br>";
                    output += "SW(Xmin,Ymin): " + parseFloat(projCoord._southWest.lng.toFixed(0)) + ", " + parseFloat(projCoord._southWest.lat.toFixed(0));
                    output += "<br>";
                    output += "NE(Xmax,Ymax): " + parseFloat(projCoord._northEast.lng.toFixed(0)) + ", " + parseFloat(projCoord._northEast.lat.toFixed(0));
                return output;

                //return L.GeometryUtil.readableArea(area, true);
                // return "Area: " + L.GeometryUtil.readableArea(area, true) + "<br>" + layer.getBounds()._southWest + "<br>" + layer.getBounds()._northEast;
                // Polyline - distance
            } else if (layer instanceof L.Polyline) {
                var latlngs = layer._defaultShape ? layer._defaultShape() : layer.getLatLngs(),
                    distance = 0;
                if (latlngs.length < 2) {
                    return "Distance: N/A";
                } else {
                    for (var i = 0; i < latlngs.length - 1; i++) {
                        distance += latlngs[i].distanceTo(latlngs[i + 1]);
                    }
                    return "Distance: " + _round(distance, 2) + " m";
                }
            }
            return null;
        };

        var bounds = map.getBounds();
        var center = map.getCenter();
        var lat, lng, xmin, ymin, xmax, ymax, srid;
        lat = center.lat;
        lng = center.lng;
        xmin = bounds._southWest.lng;
        ymin = bounds._southWest.lat;
        xmax = bounds._northEast.lng;
        ymax = bounds._northEast.lat;
        srid = 4326;

        if (!element.dataset.zoom) { element.dataset.zoom = 7 }
        element.dataset.columns = element.dataset.columns.replace(":lat", lat).replace(":lng", lng);
        element.dataset.order_by = element.dataset.order_by.replace(":lat", lat).replace(":lng", lng);
        element.dataset.where = element.dataset.where.replace(":xmin", xmin).replace(":xmax", xmax).replace(":ymin", ymin).replace(":ymax", ymax);

        this.map = map;
        this.overlayMaps = overlayMaps;
        this.overlayGroups = overlayGroups;
        this.bounds = map.getBounds();
        this.markers = markers;
        this.icon = icon;
        this.highlightIcon = highlightIcon;
        this.selectedIcon = selectedIcon;
        this.selectedMarkers = selectedMarkers;
        this.drawnItems = drawnItems;
        let self = this;

        var div = document.createElement("div");
        div.classList.add("row");
        div.style.fontSize = "11px";
        var left = document.createElement("div");
        left.classList.add("col-xs-6");
        var output = document.createElement("output");
        output.setAttribute("id", "mapinfocoordinates");
        output.style.display = "inline-grid";
        output.style.padding = "0";
        output.style.fontSize = "inherit";
        left.appendChild(output);
        left.appendChild(document.createElement("BR"));

        var span = document.createElement("SPAN");
        span.innerText = "SW(Xmin,Ymin): ";
        left.appendChild(span);
        var output = document.createElement("output");
        output.setAttribute("id", "mapinfo_bounds_sw");
        output.style.display = "inline-grid";
        output.style.padding = "0";
        output.style.fontSize = "inherit";
        left.appendChild(output);

        left.appendChild(document.createElement("BR"));

        var span = document.createElement("SPAN");
        span.innerText = "NE(Xmax,Ymax): ";
        left.appendChild(span);
        var output = document.createElement("output");
        output.setAttribute("id", "mapinfo_bounds_ne");
        output.style.display = "inline-grid";
        output.style.padding = "0";
        output.style.fontSize = "inherit";
        left.appendChild(output);

        var center = document.createElement("div");
        center.classList.add("col-xs-4");
        center.appendChild(document.createElement("BR"));
        var span = document.createElement("SPAN");
        span.setAttribute("id", "totalrecords");
        span.innerText = "# Features in map view: ";
        center.appendChild(span);

        var right = document.createElement("div");
        right.classList.add("col-xs-2");
        right.style.margin = "3px 0px";
        var button = document.createElement("button");
        button.classList.add("btn", "btn-default", "pull-right");
        var span = document.createElement("SPAN");
        span.classList.add("glyphicon", "glyphicon-save");
        span.setAttribute("aria-hidden", "true");
        button.appendChild(span);
        button.addEventListener("click", function () {
            Maps[element.dataset.key].exportData();
        });
        right.appendChild(button);
        div.appendChild(left);
        div.appendChild(center);
        div.appendChild(right);
        element.parentNode.parentNode.insertBefore(div, element.parentNode.nextElementSibling);

        var fromProjection = 'EPSG:4326';
        switch (element.dataset.table) {
            case "llg_it_geom":
                var toProjection = 'EPSG:25833';
                break;
            case "llg_nl_geom":
            case "c14_geom":
                var toProjection = 'EPSG:28992';
                break;
        }

        //document.getElementById("mapinfo_bounds_ne").innerHTML = xmax + ", " + ymax;
        //document.getElementById("mapinfo_bounds_sw").innerHTML = xmin + ", " + ymin;

        var projCoordNE = proj4(fromProjection, toProjection).forward([xmax, ymax]);
        var projCoordSW = proj4(fromProjection, toProjection).forward([xmin, ymin]);

        document.getElementById("mapinfo_bounds_ne").innerHTML = parseFloat(projCoordNE[0].toFixed(0)) + ", " + parseFloat(projCoordNE[1].toFixed(0));
        document.getElementById("mapinfo_bounds_sw").innerHTML = parseFloat(projCoordSW[0].toFixed(0)) + ", " + parseFloat(projCoordSW[1].toFixed(0));

        // TODO: For each (hasLayer = true) then...
        Object.keys(overlayMaps).forEach(function (value) {
            if (map.hasLayer(overlayMaps[value]["markers"])) {
                ajax(element, self.layerUpdate.bind(self));
            }
        })

        var refresh;

        map.on('overlayadd', e => {
            if (map.hasLayer(overlayMaps[e.name]["markers"])) {
                ajax(element, this.layerUpdate.bind(this));
            }
        })
        map.on('layeradd', e => {
            //console.log(e);
        })
        map.on('layerremove', e => {
            //console.log(e);
        })
        map.on('dragstart', e => {
            clearTimeout(refresh);
        })
        map.on('drag', e => {
            console.log('dragging');
        })
        map.on('dragend', e => {
            refresh = setTimeout(() => {

                var bounds = this.map.getBounds();
                var center = this.map.getCenter();
                var lat, lng, xmin, ymin, xmax, ymax, srid;
                lat = center.lat;
                lng = center.lng;
                xmin = bounds._southWest.lng;
                ymin = bounds._southWest.lat;
                xmax = bounds._northEast.lng;
                ymax = bounds._northEast.lat;
                srid = 4326;

                //element.dataset.columns = this.dataset.columns;
                element.dataset.order_by = this.dataset.order_by;
                element.dataset.where = this.dataset.where;
                //element.dataset.columns = element.dataset.columns.replace(":lat", lat).replace(":lng", lng);
                element.dataset.order_by = element.dataset.order_by.replace(":lat", lat).replace(":lng", lng);
                element.dataset.where = element.dataset.where.replace(":xmin", xmin).replace(":xmax", xmax).replace(":ymin", ymin).replace(":ymax", ymax);

                // TODO: get ajax request for each layer which is true and add to array
                Object.keys(overlayMaps).forEach(function (value) {
                    if (map.hasLayer(overlayMaps[value]["markers"])) {
                        ajax(element, self.layerUpdate.bind(self));
                    }
                })

                // document.getElementById("mapinfo_bounds_ne").innerHTML = xmax + ", " + ymax;
                // document.getElementById("mapinfo_bounds_sw").innerHTML = xmin + ", " + ymin;

                var projCoordNE = proj4(fromProjection, toProjection).forward([xmax, ymax]);
                var projCoordSW = proj4(fromProjection, toProjection).forward([xmin, ymin]);

                document.getElementById("mapinfo_bounds_ne").innerHTML = parseFloat(projCoordNE[0].toFixed(0)) + ", " + parseFloat(projCoordNE[1].toFixed(0));
                document.getElementById("mapinfo_bounds_sw").innerHTML = parseFloat(projCoordSW[0].toFixed(0)) + ", " + parseFloat(projCoordSW[1].toFixed(0));

            }, 200);
        })
        map.on('zoomstart', e => {
            clearTimeout(refresh);
        })
        map.on('zoom', e => {
            console.log('zooming');
        })
        map.on('zoomend', e => {
            refresh = setTimeout(() => {

                var bounds = this.map.getBounds();
                var center = this.map.getCenter();
                var lat, lng, xmin, ymin, xmax, ymax, srid;
                lat = center.lat;
                lng = center.lng;
                xmin = bounds._southWest.lng;
                ymin = bounds._southWest.lat;
                xmax = bounds._northEast.lng;
                ymax = bounds._northEast.lat;
                srid = 4326;

                element.dataset.columns = this.dataset.columns;
                element.dataset.order_by = this.dataset.order_by;
                element.dataset.where = this.dataset.where;
                element.dataset.columns = element.dataset.columns.replace(":lat", lat).replace(":lng", lng);
                element.dataset.order_by = element.dataset.order_by.replace(":lat", lat).replace(":lng", lng);
                element.dataset.where = element.dataset.where.replace(":xmin", xmin).replace(":xmax", xmax).replace(":ymin", ymin).replace(":ymax", ymax);

                // TODO: get ajax request for each layer which is true and add to array
                Object.keys(overlayMaps).forEach(function (value) {
                    if (map.hasLayer(overlayMaps[value]["markers"])) {
                        ajax(element, self.layerUpdate.bind(self));
                    }
                })

                //document.getElementById("mapinfo_bounds_ne").innerHTML = xmax + ", " + ymax;
                //document.getElementById("mapinfo_bounds_sw").innerHTML = xmin + ", " + ymin;

                var projCoordNE = proj4(fromProjection, toProjection).forward([xmax, ymax]);
                var projCoordSW = proj4(fromProjection, toProjection).forward([xmin, ymin]);

                document.getElementById("mapinfo_bounds_ne").innerHTML = parseFloat(projCoordNE[0].toFixed(0)) + ", " + parseFloat(projCoordNE[1].toFixed(0));
                document.getElementById("mapinfo_bounds_sw").innerHTML = parseFloat(projCoordSW[0].toFixed(0)) + ", " + parseFloat(projCoordSW[1].toFixed(0));

            }, 200);
        })
        map.on('mousemove', e => {
            var projCoord = proj4(fromProjection, toProjection).forward([e.latlng.lng, e.latlng.lat]);

            //document.getElementById("mapinfocoordinates").innerHTML = e.latlng;
            document.getElementById("mapinfocoordinates").innerHTML = "XY(" + parseFloat(projCoord[0].toFixed(0)) + ", " + parseFloat(projCoord[1].toFixed(0)) + ")";

        })

        // Object started
        map.on(L.Draw.Event.DRAWSTART, function (event) {

            Object.values(markers).forEach(function (marker) {
                if (selectedMarkers[marker.properties.id]) {
                    marker.setIcon(icon);
                    delete selectedMarkers[marker.properties.id];
                }
            })

            drawnItems.eachLayer(function (layer) {
                drawnItems.removeLayer(layer);
            })

        })

        // Object created - bind popup to layer, add to feature group
        map.on(L.Draw.Event.CREATED, function (event) {
            var layer = event.layer;
            var content = getPopupContent(layer);
            if (content !== null) {
                layer.bindPopup(content);
            }
            drawnItems.addLayer(layer);

            Object.keys(overlayMaps).forEach(function (key) {
                if (map.hasLayer(overlayMaps[key]["markers"])) {
                    overlayMaps[key]["markers"].eachLayer(function (marker) {
                        if (layer.contains(marker.getLatLng())) {
                            markers[marker.properties.id].setIcon(selectedIcon);
                            selectedMarkers[marker.properties.id] = marker;
                        }
                    })
                }
            })
        })

        // Object(s) edited - update popups
        map.on(L.Draw.Event.EDITED, function (event) {
            var layers = event.layers,
                content = null;
            layers.eachLayer(function (layer) {
                content = getPopupContent(layer);
                if (content !== null) {
                    layer.setPopupContent(content);
                }

                Object.keys(overlayMaps).forEach(function (key) {
                    if (map.hasLayer(overlayMaps[key]["markers"])) {
                        overlayMaps[key]["markers"].eachLayer(function (marker) {
                            if (layer.contains(marker.getLatLng())) {
                                markers[marker.properties.id].setIcon(selectedIcon);
                                selectedMarkers[marker.properties.id] = marker;
                            } else if (selectedMarkers[marker.properties.id]) {
                                markers[marker.properties.id].setIcon(icon);
                                delete selectedMarkers[marker.properties.id];
                            }
                        })
                    }
                })

            });
        })

        // Object(s) deleted - saved
        map.on(L.Draw.Event.DELETED, function (event) {
            Object.values(selectedMarkers).forEach(function (marker) {
                markers[marker.properties.id].setIcon(icon);
                delete selectedMarkers[marker.properties.id];
            });
        })

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

        var marker = this.markers[i];
        if (this.selectedMarkers[i]) {
            this.eventTransmitter(e, i);
            return;
        }

        const mouseover = () => {
            marker.setIcon(this.highlightIcon);
        }

        const mouseout = () => {
            marker.setIcon(this.icon);
        }

        const mousedown = () => {
            //marker.setIcon(this.selectedIcon);
        }

        const mouseup = () => {
            //marker.setIcon(this.selectedIcon);
        }

        const click = () => {
            if (Object.keys(self.selectedMarkers).length > 0) {
                Object.keys(self.selectedMarkers).forEach(function (key) {
                    self.markers[key].setIcon(self.icon);
                    delete self.selectedMarkers[key];
                })
            }
            marker.setIcon(this.selectedIcon);
            this.selectedMarkers[i] = marker;
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
            default:
                break;
        }
    }

    eventTransmitter(e, i) {
        console.log("eventTransmitter");

        let slaveTemplates = document.querySelectorAll('[data-ajax="template"][data-master="' + this.element.id + '"]');
        slaveTemplates.forEach((template) => {
            Templates[template.dataset.key].eventReceiver(e, i);
        });

        let slaveTables = document.querySelectorAll('[data-ajax="table"][data-master="' + this.element.id + '"]');
        slaveTables.forEach((table) => {
            Tables[table.dataset.index].eventReceiver(e, i);
        });

    }

    mapCallback(element) {
        console.log("mapCallback");

        document.getElementById("totalrecords").innerHTML = "# Features in map view: <b>" + this.Data.totalrecords + "</b>";

        let slaveTables = document.querySelectorAll('[data-ajax="table"][data-master="' + this.element.id + '"]');
        slaveTables.forEach((table) => {
            if (this.map.getZoom() >= parseInt(this.element.dataset.zoomlevel, 10) /*|| self.getData().totalrecords <= self.getDataset().limit */) {
                table.previousElementSibling.style.display = "none";
                table.style.display = "table";
                Tables[table.dataset.index].tableTabulate(table, this.data);
            } else {
                table.previousElementSibling.style.display = "block";
                table.style.display = "none";

            }
        });

        if(this._mapCallback.functions) {
			let callbacks = this._mapCallback.functions;
			Object.keys(callbacks).forEach(function (value) {
				callbacks[value](element);
			})
		}
    }

    layerUpdate(element, data) {
        console.log("layerUpdate");

        let self = this;

        let obj = JSON.parse(data);
        delete obj.totalrecords;

        Object.keys(obj).forEach(function (value) {
            var i = Object.entries(obj[value])[0][1];

            if (!self.overlayMaps[Object.keys(self.overlayMaps)[0]]["markers"].hasLayer(self.markers[i])) {
                // console.log("Marker is in view and wasn't added already...");
                var marker = L.marker([obj[value].latitude, obj[value].longitude], { icon: self.icon });
                marker.properties = {};
                marker.properties.id = i;

                marker.addEventListener('mouseover', (e) => {
                    if (Object.keys(self.selectedMarkers).length > 0) {
                        if (!self.selectedMarkers[i]) {
                            marker.setIcon(self.highlightIcon);
                        }
                    } else {
                        marker.setIcon(self.highlightIcon);
                    }
                    self.eventTransmitter(e, i);
                });
                marker.addEventListener('mouseout', (e) => {
                    if (Object.keys(self.selectedMarkers).length > 0) {
                        if (!self.selectedMarkers[i]) {
                            marker.setIcon(self.icon);
                        }
                    } else {
                        marker.setIcon(self.icon);
                    }
                    self.eventTransmitter(e, i);
                });
                marker.addEventListener('mousedown', (e) => {
                    if (Object.keys(self.selectedMarkers).length > 0) {
                        if (!self.selectedMarkers[i]) {
                            Object.values(self.selectedMarkers).forEach(function (marker) {
                                marker.setIcon(self.icon);
                            })
                            marker.setIcon(self.selectedIcon);
                        }
                    } else {
                        marker.setIcon(self.selectedIcon);
                    }
                    self.eventTransmitter(e, i);
                });
                marker.addEventListener('mouseup', (e) => {
                    if (Object.keys(self.selectedMarkers).length > 0) {
                        if (!self.selectedMarkers[i]) {
                            Object.values(self.selectedMarkers).forEach(function (marker) {
                                marker.setIcon(self.icon);
                            })
                            marker.setIcon(self.selectedIcon);
                        }
                    } else {
                        marker.setIcon(self.selectedIcon);
                    }
                    self.eventTransmitter(e, i);
                });
                marker.addEventListener('click', (e) => {
                    if (Object.keys(self.selectedMarkers).length > 0) {
                        if (!self.selectedMarkers[i]) {
                            Object.keys(self.selectedMarkers).forEach(function (marker) {
                                self.selectedMarkers[marker].setIcon(self.icon);
                                delete self.selectedMarkers[marker];
                            });
                            marker.setIcon(self.selectedIcon);
                        }
                    } else {
                        marker.setIcon(self.selectedIcon);
                    }
                    self.selectedMarkers[i] = marker;
                    self.eventTransmitter(e, i);
                });

                self.markers[i] = marker;

            }
        })

        if ((self.map.getZoom() >= parseInt(element.dataset.zoomlevel, 10) + 1)) {
            if (self.map.hasLayer(self.overlayMaps[Object.keys(self.overlayMaps)[0]]["heat"])) {
                self.map.removeLayer(self.overlayMaps[Object.keys(self.overlayMaps)[0]]["heat"]);
            }
        } else {
            if (!self.map.hasLayer(self.overlayMaps[Object.keys(self.overlayMaps)[0]]["heat"])) {
                self.map.addLayer(self.overlayMaps[Object.keys(self.overlayMaps)[0]]["heat"]);
            }

            var heat = [];
            for (let [key, marker] of Object.entries(self.markers)) {
                if (self.map.getBounds().contains(marker.getLatLng())) {
                    var arr = [marker.getLatLng().lat, marker.getLatLng().lng, 0.4];
                    heat.push(arr);
                }
            }
            self.overlayMaps[Object.keys(self.overlayMaps)[0]]["heat"].setLatLngs(heat);
        }

        // TODO: Remove ALL markers before adding back the returned ones...?
        // Otherwise, some markers are placed on map from memory, but are outside the 1000 returned limit and don't show up in the slavetable
        for (let [key, marker] of Object.entries(self.markers)) {
            if (self.map.getBounds().contains(marker.getLatLng())) {
                self.overlayMaps[Object.keys(self.overlayMaps)[0]]["markers"].addLayer(marker);
                if (self.selectedMarkers[key]) {
                    marker.setIcon(self.selectedIcon);
                }
            } else {
                self.overlayMaps[Object.keys(self.overlayMaps)[0]]["markers"].removeLayer(marker);
            }
        }

        /*
        // TODO: Fix selectedMarkers as Object
        Object.values(self.markers).forEach(function (marker) {
            console.log(marker._leaflet_id);
            // TODO: Add maximum layers...
            // Remove ALL markers and re-add to maximum of limit...
            if (self.map.getBounds().contains(marker.getLatLng())) {
                self.overlayMaps[Object.keys(self.overlayMaps)[0]].addLayer(marker);
                if ((Object.keys(self.selectedMarkers).length > 0) && (self.selectedMarkers[marker._leaflet_id].getLatLng().lat == marker.getLatLng().lat && self.selectedMarkers[marker._leaflet_id].getLatLng().lng == marker.getLatLng().lng)) {
                    marker.setIcon(self.selectedIcon);
                    self.selectedMarkers[marker._leaflet_id] = marker;
                }
            } else {
                self.overlayMaps[Object.keys(self.overlayMaps)[0]].removeLayer(marker);
                //if ((Object.keys(self.selectedMarkers).length > 0) || (self.selectedMarkers.getLatLng().lat !== self.markers[value].getLatLng().lat || self.selectedMarkers.getLatLng().lng !== self.markers[value].getLatLng().lng)) {
                //delete self.markers.marker; // Can't delete the marker which is selected from array, in case we pan back into view...
                //}

            }
        })
        */

        this.data = data;
        this.mapCallback(element, data);

    }

    mapCreate(element, index) {
    }

    exportData() {
        console.log("exportData");
        // TODO: For each datapoint in map, asyncAJAX slave element
        // For each datapoint in slave element, asyncAJAX slave element
        // etc...
        let self = this;
        let element = this.element;

        if (Object.keys(self.drawnItems._layers).length > 0) {

            Object.values(self.drawnItems._layers).forEach(function (layer) {
                Object.values(self.markers).forEach(function (marker) {
                    if (layer.contains(marker.getLatLng())) {
                        self.markers[marker.properties.id].setIcon(self.selectedIcon);
                        self.selectedMarkers[marker.properties.id] = marker;
                    } else if (self.selectedMarkers[marker.properties.id]) {
                        self.markers[marker.properties.id].setIcon(self.icon);
                        delete self.selectedMarkers[marker.properties.id];
                    }
                })
            })

            var selectedrecords = Object.keys(self.selectedMarkers).length;
            var bounds = self.drawnItems.getBounds();
            var xmin, ymin, xmax, ymax, srid;
            xmin = bounds._southWest.lng;
            ymin = bounds._southWest.lat;
            xmax = bounds._northEast.lng;
            ymax = bounds._northEast.lat;
            srid = 4326;

            element.dataset.columns = self.dataset.columns;
            element.dataset.order_by = self.dataset.order_by;
            element.dataset.where = self.dataset.where;
            element.dataset.columns = "*";
            element.dataset.order_by = "";
            element.dataset.where = element.dataset.where.replace(":xmin", xmin).replace(":xmax", xmax).replace(":ymin", ymin).replace(":ymax", ymax);

        } else {

            var selectedrecords = self.Data.totalrecords;
            var bounds = self.map.getBounds();
            var xmin, ymin, xmax, ymax, srid;
            xmin = bounds._southWest.lng;
            ymin = bounds._southWest.lat;
            xmax = bounds._northEast.lng;
            ymax = bounds._northEast.lat;
            srid = 4326;

            element.dataset.columns = self.dataset.columns;
            element.dataset.order_by = self.dataset.order_by;
            element.dataset.where = self.dataset.where;
            element.dataset.columns = "*";
            element.dataset.order_by = "";
            element.dataset.where = element.dataset.where.replace(":xmin", xmin).replace(":xmax", xmax).replace(":ymin", ymin).replace(":ymax", ymax);

        }

        // TODO: initialization export function
        var text;
        if (selectedrecords > parseInt(self.element.dataset.limit, 10)) {
            text = "Download limit exceeded!";
            text += "\n\n";
            text += "Number of records in view: " + selectedrecords;
            text += "\n";
            text += "Maximum records allowed: " + parseInt(self.element.dataset.limit, 10);
            text += "  ";
            text += "(Reduce selection of records)";
            alert(text);
        } else {
            text = "Confirm to download LLG data";
            text += "\n\n";
            text += "Number of records: " + selectedrecords;
            text += "\n";
            text += "Download format: XML[LLG2012]";
            text += "\n";
            text += "Filename: " + "LLGData-" + document.getElementById("mapinfo_bounds_ne").innerHTML.replace(", ", "_") + "-" + document.getElementById("mapinfo_bounds_sw").innerHTML.replace(", ", "_") + ".xml";
            var bool = confirm(text);
            if (bool == true) {
                ajax(element, self.exportDataAsXML.bind(self));
            }
        }

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
            Tables[table.dataset.index].eventReceiver(e, i);
        });
        */

        var el = {};
        el.dataset = {};

        el.dataset.url = "//wikiwfs.geo.uu.nl/e107_plugins/ajaxDBQuery/ajaxDBQuery.php";
        el.dataset.db = "llg";
        el.dataset.table = Tables[1].element.dataset.table; // TODO: This should be a variable..
        el.dataset.columns = "startdepth,depth,texture,organicmatter,plantremains,color,oxired,gravelcontent,median,calcium,ferro,groundwater,sample,soillayer,stratigraphy,remarks";
        el.dataset.where = "borehole=':uid'";
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
                switch (Tables[1].element.dataset.table) {
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
                elem.download = "LLGData-" + document.getElementById("mapinfo_bounds_sw").innerHTML.replace(", ", "_") + "-" + document.getElementById("mapinfo_bounds_ne").innerHTML.replace(", ", "_") + ".xml";
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

}

export default ajaxMap;

/*
(function () {

    window.Maps = [];

    document.addEventListener('DOMContentLoaded', () => {
        const maps = document.querySelectorAll('.map[data-ajax="map"]');
        maps.forEach((element, key) => {
            Maps[key] = new ajaxMap(element, key);
        })
    })
})();
*/