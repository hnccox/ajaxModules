
'use strict';

import { default as ajax } from "/e107_plugins/ajaxDBQuery/beta/js/ajaxDBQuery.js";
import { default as storageHandler } from "/e107_plugins/storageHandler/js/storageHandler.js";
import { default as jsonSQL } from "/e107_plugins/jsonSQL/js/jsonSQL.js";

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
    constructor(element, index, mapOptions = {}) {
        console.log("ajaxMap constructor");

        for (const [key, value] of Object.entries(mapOptions)) {
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
        element.setAttribute("id", "ajaxMaps[" + index + "]");

        // http://leafletjs.com/reference-1.1.0.html#class-constructor-hooks
        L.Map.addInitHook(function () {
            // Store a reference of the Leaflet map object on the map container,
            // so that it could be retrieved from DOM selection.
            // https://leafletjs.com/reference-1.3.4.html#map-getcontainer
            this.getContainer()._leaflet_map = this;
        });

        let mbAttr = 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
        let mbUrl = 'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiaG5jY294IiwiYSI6ImNrbTlxam8wdzE1N2gycGxhN3RiNHpmODkifQ.FQmxF3Bjsb8ElMnALjgO_A';

        let light = L.tileLayer(mbUrl, { id: "mapbox/light-v9", tileSize: 512, zoomOffset: -1, attribution: mbAttr }),
            dark = L.tileLayer(mbUrl, { id: "mapbox/dark-v10", tileSize: 512, zoomOffset: -1, attribution: mbAttr }),
            satellite = L.tileLayer(mbUrl, { id: "mapbox/satellite-v9", tileSize: 512, zoomOffset: -1, attribution: mbAttr });

        if (mapOptions._defaults) {
            var crs = mapOptions._defaults?.crs || L.CRS.EPSG3857,
                lat = mapOptions._defaults?.lat || 0,
                lng = mapOptions._defaults?.lng || 0,
                zoom = mapOptions._defaults?.zoom || 1,
                minZoom = mapOptions._defaults?.minZoom,
                maxZoom = mapOptions._defaults?.maxZoom;
        } else {
            var crs = L.CRS.EPSG3857,
                lat = 0,
                lng = 0,
                zoom = 1;
        }

        // TODO: make array of layers
        if (mapOptions._baseMaps) {
            var layers = [];
            switch (mapOptions._baseMaps?.layers) {
                case 'dark':
                    layers.push(dark);
                    break;
                default:
                    layers.push(light);
                    break;
            }
        } else {
            var layers = [light];
        }

        let map = L.map(element, {
            preferCanvas: false,
            attributionControl: true,
            zoomControl: true,
            closePopupOnClick: true,
            zoomSnap: 1,
            zoomDelta: 1,
            trackResize: true,
            boxZoom: true,
            doubleClickZoom: true,
            dragging: true,
            cursor: true,
            crs: crs,
            center: [lat, lng],
            zoom: zoom,
            minZoom: minZoom,
            maxZoom: maxZoom,
            layers: layers
        });

        let baseMaps = {
            "Grayscale": light,
            "Darkmode": dark,
            "Satellite": satellite
        };

        let markers = {};
        let selectedMarkers = {};
        let icon = L.icon({
            iconUrl: "img/markers/m1_30.png",
            iconSize: [10, 10], // size of the icon
        });
        let highlightIcon = L.icon({
            iconUrl: "img/markers/m1_30.png",
            iconSize: [15, 15], // size of the icon
        });
        let selectedIcon = L.icon({
            iconUrl: "img/markers/m1y_0.png",
            iconSize: [15, 15], // size of the icon
        });

        var overlayMaps = {};
        var overlayGroups = {};
        var _overlayGroups = {};
        for (let [key, value] of Object.entries(this._overlayMaps)) {
            let url = value.layerParams.url;
            let layerOptions = value.layerOptions;
            switch (value.layerType) {
                case "tileLayer.WMS":
                    overlayMaps[key] = L.tileLayer.wms(url, layerOptions);
                    break;
                case "tileLayer":
                    overlayMaps[key] = L.tileLayer(url, layerOptions);
                    break;
                case "markerLayer":
                    overlayGroups[key] = L.layerGroup();
                    _overlayGroups[key] = [];
                    _overlayGroups[key]["markerLayer"] = L.layerGroup();
                    _overlayGroups[key]["markers"] = {};
                    overlayGroups[key].addLayer(_overlayGroups[key]["markerLayer"]);
                    overlayMaps[key] = overlayGroups[key];
                    break;
                case "markerClusterGroup":
                    overlayGroups[key] = L.layerGroup();
                    _overlayGroups[key] = [];
                    _overlayGroups[key]["markerLayer"] = L.markerClusterGroup({
                        showCoverageOnHover: true,
                        zoomToBoundsOnClick: true,
                        spiderfyOnMaxZoom: false,
                        removeOutsideVisibleBounds: true,
                        animate: true,
                        animateAddingMarkers: false,
                        disableClusteringAtZoom: element.dataset.zoomlevel,
                        //maxClusterRadius: 80,
                        singleMarkerMode: false,
                        spiderLegPolylineOptions: {
                            weight: 1.5,
                            color: '#222',
                            opacity: 0.5
                        },
                        //spiderfyDistanceMultiplier: 1,
                        // iconCreateFunction: function (cluster) {
                        //     return L.divIcon({ html: '<div><span>' + cluster.getChildCount() + '</span></div>' });
                        // },
                        iconCreateFunction: function (e) {
                            var t = e.getChildCount(),
                                i = " marker-cluster-",
                                text = t,
                                size = 40;
                            if (t >= self._overlayMaps[key].layerParams.limit) {
                                var text = "&#128269;";
                                var size = 80;
                            }

                            return i += 10 > t ? "small" : 100 > t ? "medium" : self._overlayMaps[key].layerParams.limit > t ? "large" : "xxl", new L.DivIcon({
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
                    _overlayGroups[key]["markers"] = {};
                    overlayGroups[key].addLayer(_overlayGroups[key]["markerLayer"]);
                    overlayMaps[key] = overlayGroups[key]
                    break;
                case "heatLayer":
                    overlayGroups[key] = L.layerGroup();
                    _overlayGroups[key] = [];
                    _overlayGroups[key]["heatLayer"] = L.heatLayer([], {});
                    overlayGroups[key].addLayer(_overlayGroups[key]["heatLayer"]);
                    overlayMaps[key] = overlayGroups[key];
                    break;
                case "layerGroup":
                    overlayGroups[key] = L.layerGroup();
                    _overlayGroups[key] = [];
                    _overlayGroups[key]["heatLayer"] = L.heatLayer([], {});
                    _overlayGroups[key]["markerLayer"] = L.markerClusterGroup({
                        showCoverageOnHover: true,
                        zoomToBoundsOnClick: true,
                        spiderfyOnMaxZoom: false,
                        removeOutsideVisibleBounds: true,
                        animate: true,
                        animateAddingMarkers: false,
                        disableClusteringAtZoom: element.dataset.zoomlevel,
                        //maxClusterRadius: 80,
                        singleMarkerMode: false,
                        spiderLegPolylineOptions: {
                            weight: 1.5,
                            color: '#222',
                            opacity: 0.5
                        },
                        //spiderfyDistanceMultiplier: 1,
                        // iconCreateFunction: function (cluster) {
                        //     return L.divIcon({ html: '<div><span>' + cluster.getChildCount() + '</span></div>' });
                        // },
                        iconCreateFunction: function (e) {
                            var t = e.getChildCount(),
                                i = " marker-cluster-",
                                text = t,
                                size = 40;
                            if (t >= self._overlayMaps[key].layerParams.limit) {
                                var text = "&#128269;";
                                var size = 80;
                            }

                            return i += 10 > t ? "small" : 100 > t ? "medium" : self._overlayMaps[key].layerParams.limit > t ? "large" : "xxl", new L.DivIcon({
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
                    _overlayGroups[key]["markers"] = {};
                    overlayGroups[key].addLayer(_overlayGroups[key]["heatLayer"]);
                    overlayGroups[key].addLayer(_overlayGroups[key]["markerLayer"]);
                    overlayMaps[key] = overlayGroups[key]
                    break;
                default:
                    overlayMaps[key] = L.tileLayer(url, layerOptions);
            }

            // (overlayGroups[key]) ? overlayMaps[key] = overlayGroups[key] : null;
            if (value.layerParams.addToMap) {
                map.addLayer(overlayMaps[key]);
            }

        }
        // overlayMaps object structure:
        // overlayMaps = { layer: overlayGroups[layer], layer: overlayGroups[layer] }
        L.control.layers(baseMaps, overlayMaps).addTo(map);
        L.control.scale({ maxWidth: 200 }).addTo(map);

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

        var drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);

        var options = {
            position: "topleft",
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
                output += "( " + parseFloat(projCoord._northEast.lng - projCoord._southWest.lng).toFixed(0) + " x " + parseFloat(projCoord._northEast.lat - projCoord._southWest.lat).toFixed(0) + "m )";
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
        // console.log(element.dataset.query);
        // console.log(JSON.parse(element.dataset.query));
        // element.dataset.columns = element.dataset.columns.replace(":lat", lat).replace(":lng", lng);
        // element.dataset.order_by = element.dataset.order_by.replace(":lat", lat).replace(":lng", lng);
        // element.dataset.where = element.dataset.where.replace(":xmin", xmin).replace(":xmax", xmax).replace(":ymin", ymin).replace(":ymax", ymax);

        this.map = map;
        this.overlayMaps = overlayMaps;
        this.overlayGroups = overlayGroups;
        this._overlayGroups = _overlayGroups;
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
        div.style.position = "absolute";
        div.style.bottom = "0px";
        div.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
        div.style.width = "100vw";
        div.style.marginLeft = "-25%";
        div.style.marginRight = "-25%";
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
            this.exportData();
        });
        right.appendChild(button);
        div.appendChild(left);
        div.appendChild(center);
        div.appendChild(right);
        element.parentNode.parentNode.insertBefore(div, element.parentNode.nextElementSibling);

        // document.getElementById("mapinfo_bounds_ne").innerHTML = xmax + ", " + ymax;
        // document.getElementById("mapinfo_bounds_sw").innerHTML = xmin + ", " + ymin;

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

        var projCoordNE = proj4(fromProjection, toProjection).forward([xmax, ymax]);
        var projCoordSW = proj4(fromProjection, toProjection).forward([xmin, ymin]);

        document.getElementById("mapinfo_bounds_ne").innerHTML = parseFloat(projCoordNE[0].toFixed(0)) + ", " + parseFloat(projCoordNE[1].toFixed(0));
        document.getElementById("mapinfo_bounds_sw").innerHTML = parseFloat(projCoordSW[0].toFixed(0)) + ", " + parseFloat(projCoordSW[1].toFixed(0));

        // TODO: For each (hasLayer = true) then...
        Object.keys(overlayMaps).forEach(function (key) {
            if (map.hasLayer(overlayMaps[key]) && self._overlayMaps[key].layerType !== "TileLayer.WMS") {
                console.log(key)
                self.layerUpdate(key);
            }

            // if (map.hasLayer(overlayMaps[value])) {
            //     let method = "GET";
            //     let sql = {
            //         "url": self._overlayMaps[value]?.layerParams.url,
            //         "db": self._overlayMaps[value]?.layerParams.db,
            //         "query": JSON.parse(self._overlayMaps[value]?.layerParams.query)
            //     }
            //     ajax(method, sql, self.layerUpdate.bind(self));
            // } else {
            //     let method = "GET";
            //     let sql = {
            //         "url": self._overlayMaps[value]?.layerParams.url,
            //         "db": self._overlayMaps[value]?.layerParams.db,
            //         //"query": self._overlayMaps[value]?.layerParams.query
            //         "query": jsonSQL.query.replace(self._overlayMaps[value]?.layerParams.query, [":xmin",":xmax",":ymin",":ymax",":lat",":lng"], [xmin,xmax,ymin,ymax,lat,lng])
            //     }
            //     //console.log(sql);
            //     //console.log( jsonSQL.query.set(self._overlayMaps[value]?.layerParams.query) );

            //     // element.dataset.order_by = element.dataset.order_by.replace(":lat", lat).replace(":lng", lng);
            //     // element.dataset.where = element.dataset.where.replace(":xmin", xmin).replace(":xmax", xmax).replace(":ymin", ymin).replace(":ymax", ymax);

            //     // jsonSQL.query.replace(self._overlayMaps[value]?.layerParams.query, [":xmin",":xmax",":ymin",":ymax"], [xmin,xmax,ymin,ymax]);
            //     // Object.keys(sql.query).forEach(key => {
            //     //     for (const statement in sql.query[key]) {
            //     //         console.log(statement);
            //     //         switch (statement) {
            //     //             case "where":
            //     //                 where(statement);
            //     //                 break;
            //     //             case "limit":
            //     //                 limit(statement);
            //     //                 break;
            //     //             case "offset":
            //     //                 offset(statement);
            //     //                 break;
            //     //             case "order_by":
            //     //                 order_by(statement);
            //     //                 break;

            //     //         }
            //     //     }
            //     // });
            //     console.log("no markers");
            //     // ajax(method, sql, self.layerUpdate.bind(self));
            // }
        })

        var refresh;

        map.on('overlayadd', e => {
            //console.log(e);
            if (map.hasLayer(overlayMaps[e.name]) && self._overlayMaps[e.name].layerType !== "TileLayer.WMS") {
                let method = "GET";
                let sql = {
                    "url": self._overlayMaps[e.name]?.layerParams.url || null,
                    "db": self._overlayMaps[e.name]?.layerParams.db || null,
                    //"query": self._overlayMaps[value]?.layerParams.query
                    "query": jsonSQL.query.replace(self._overlayMaps[e.name]?.layerParams.query, [":xmin", ":xmax", ":ymin", ":ymax", ":lat", ":lng"], [xmin, xmax, ymin, ymax, lat, lng]) || null
                }
                ajax(method, sql, self.layerUpdate.bind(self));
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
            //console.log('dragging');
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

                // element.dataset.columns = this.dataset.columns;
                // element.dataset.order_by = this.dataset.order_by;
                // element.dataset.where = this.dataset.where;
                // element.dataset.columns = element.dataset.columns.replace(":lat", lat).replace(":lng", lng);
                // element.dataset.order_by = element.dataset.order_by.replace(":lat", lat).replace(":lng", lng);
                // element.dataset.where = element.dataset.where.replace(":xmin", xmin).replace(":xmax", xmax).replace(":ymin", ymin).replace(":ymax", ymax);

                // TODO: get ajax request for each layer which is true and add to array
                Object.keys(overlayMaps).forEach(function (key) {
                    if (map.hasLayer(overlayMaps[key]["markers"])) {
                        let method = "GET";
                        let sql = {
                            "url": map.dataset.url,
                            "db": map.dataset.db,
                            "query": JSON.parse(map.dataset.query)
                        }
                        ajax(method, sql, self.layerUpdate.bind(self));
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

                // element.dataset.columns = this.dataset.columns;
                // element.dataset.order_by = this.dataset.order_by;
                // element.dataset.where = this.dataset.where;
                // element.dataset.columns = element.dataset.columns.replace(":lat", lat).replace(":lng", lng);
                // element.dataset.order_by = element.dataset.order_by.replace(":lat", lat).replace(":lng", lng);
                // element.dataset.where = element.dataset.where.replace(":xmin", xmin).replace(":xmax", xmax).replace(":ymin", ymin).replace(":ymax", ymax);

                // TODO: get ajax request for each layer which is true and add to array
                Object.keys(overlayMaps).forEach(function (key) {
                    if (map.hasLayer(overlayMaps[key]["markers"])) {
                        let method = "GET";
                        let sql = {
                            "url": map.dataset.url,
                            "db": map.dataset.db,
                            "query": JSON.parse(map.dataset.query)
                        }
                        ajax(method, sql, self.layerUpdate.bind(self));
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
                Tables[table.dataset.index].tableTabulate(this.data);
            } else {
                table.previousElementSibling.style.display = "block";
                table.style.display = "none";

            }
        });

        if (this._mapCallback.functions) {
            let callbacks = this._mapCallback.functions;
            Object.keys(callbacks).forEach(function (value) {
                callbacks[value](element);
            })
        }
    }

    layerUpdate(layer) {
        console.log("layerUpdate");

        let self = this;

        function layerTabulate(response) {
            console.log("layerTabulate");
            if (response.type !== "success") return response;

            const obj = self._overlayMaps[layer].parseResponse(response);

            Object.values(obj).forEach(function (value) {
                var i = self._overlayMaps[layer].getUID(value);
                var coords = self._overlayMaps[layer].getLatLng(value);

                if (!self.overlayGroups[layer].hasLayer(self.markers[i])) {
                    // console.log("Marker is in view and wasn't added already...");
                    var marker = L.marker([coords.lat, coords.lng], { icon: self.icon });
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

                    self._overlayGroups[layer].markers[i] = marker;

                }

                for (let [key, marker] of Object.entries(self._overlayGroups[layer].markers)) {
                    if (self.map.getBounds().contains(marker.getLatLng())) {
                        self._overlayGroups[layer]["markerLayer"].addLayer(marker);
                        if (self.selectedMarkers[key]) {
                            marker.setIcon(self.selectedIcon);
                        }
                    } else {
                        self._overlayGroups[layer]["markerLayer"].removeLayer(marker);
                    }
                }


            })

        }

        console.log(this._overlayMaps[layer]?.layerType);

        if(this._overlayMaps[layer]?.layerType !== "tileLayer" 
            && this._overlayMaps[layer]?.layerType !== "tileLayer.WMS") {
            console.log(`Updating layer: ${layer}`);

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
    
            let method = "GET";
            let sql = {
                "url": self._overlayMaps[layer]?.layerParams.url || null,
                "db": self._overlayMaps[layer]?.layerParams.db || null,
                //"query": self._overlayMaps[value]?.layerParams.query
                "query": jsonSQL.query.replace(self._overlayMaps[layer]?.layerParams.query, [":xmin", ":xmax", ":ymin", ":ymax", ":lat", ":lng"], [xmin, xmax, ymin, ymax, lat, lng])
            }

            ajax(method, sql, layerTabulate);
        }
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
                let method = "GET";
                let sql = {
                    "url": map.dataset.url,
                    "db": map.dataset.db,
                    "query": JSON.parse(map.dataset.query)
                }
                ajax(method, sql, self.exportDataAsXML.bind(self));
            }
        }

    }

}

export default ajaxMap;

/*
(function () {

    window["ajaxMaps"] = [];

    document.addEventListener('DOMContentLoaded', () => {
        const maps = document.querySelectorAll('div[data-ajax="map"]');
        maps.forEach((element, key) => {
            window["ajaxMaps"][key] = new ajaxMap(element, key, mapOptions);
        })
    })
})();
*/