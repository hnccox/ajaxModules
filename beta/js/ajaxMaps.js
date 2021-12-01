
'use strict';

import { default as ajax } from "/e107_plugins/ajaxDBQuery/beta/js/ajaxDBQuery.js";
import { default as ajaxTable } from "/e107_plugins/ajaxTemplates/beta/js/ajaxTables.js";
import { default as ajaxTemplate } from "/e107_plugins/ajaxTemplates/beta/js/ajaxTemplates.js";
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

        this.colors = {};
        this.colors.consoleInfo = '#28a745';
        this.colors.consoleWarn = '#28a745';
        this.colors.consoleLog = '#28a745';
        this.colors.consoleError = '#28a745';

        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }

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
        element.setAttribute("id", `ajaxMaps[${index}]`);

        (window.getComputedStyle(document.querySelector('.d-none.d-md-block')).display == 'none') ? this.onMobile = true : this.onMobile = false;

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
        //var _overlayMaps = {};
        var overlayGroups = {};
        var _overlayGroups = {};
        for (let [key, value] of Object.entries(this._overlayMaps)) {

            let url = value.layerParams.url;
            let layerOptions = value.layerOptions;

            if (value.layerParams.cacheReturn == true && storageHandler.storage.session.get(key)) {
                storageHandler.storage.session.remove(key);
            }

            switch (value.layerType) {
                case "tileLayer.WMS":
                    overlayMaps[key] = L.tileLayer.wms(url, layerOptions);
                    break;
                case "tileLayer":
                    overlayMaps[key] = L.tileLayer(url, layerOptions);
                    break;
                case "markerLayer":
                    overlayGroups[key] = L.layerGroup();
                    _overlayGroups[key] = {};
                    _overlayGroups[key].icons = {};
                    _overlayGroups[key].icons.icon = L.icon({
                        iconUrl: value.icons.icon.iconUrl,
                        iconSize: value.icons.icon.iconSize
                    });
                    _overlayGroups[key].icons.highlightIcon = L.icon({
                        iconUrl: value.icons.highlightIcon.iconUrl,
                        iconSize: value.icons.highlightIcon.iconSize
                    });
                    _overlayGroups[key].icons.selectedIcon = L.icon({
                        iconUrl: value.icons.selectedIcon.iconUrl,
                        iconSize: value.icons.selectedIcon.iconSize
                    });
                    _overlayGroups[key].markers = {};
                    _overlayGroups[key]["markerLayer"] = L.layerGroup();
                    overlayGroups[key].addLayer(_overlayGroups[key]["markerLayer"]);
                    overlayMaps[key] = overlayGroups[key];
                    break;
                case "markerClusterGroup":
                    overlayGroups[key] = L.layerGroup();
                    _overlayGroups[key] = {};
                    _overlayGroups[key].icons = {};
                    _overlayGroups[key].icons.icon = L.icon({
                        iconUrl: value.icons.icon.iconUrl,
                        iconSize: value.icons.icon.iconSize
                    });
                    _overlayGroups[key].icons.highlightIcon = L.icon({
                        iconUrl: value.icons.highlightIcon.iconUrl,
                        iconSize: value.icons.highlightIcon.iconSize
                    });
                    _overlayGroups[key].icons.selectedIcon = L.icon({
                        iconUrl: value.icons.selectedIcon.iconUrl,
                        iconSize: value.icons.selectedIcon.iconSize
                    });
                    _overlayGroups[key].markers = {};
                    _overlayGroups[key]["markerLayer"] = L.markerClusterGroup({
                        showCoverageOnHover: true,
                        zoomToBoundsOnClick: true,
                        spiderfyOnMaxZoom: false,
                        removeOutsideVisibleBounds: true,
                        animate: true,
                        animateAddingMarkers: false,
                        disableClusteringAtZoom: value.layerParams.disableClusteringAtZoom || 14,
                        maxClusterRadius: value.layerParams.maxClusterRadius || 80,
                        singleMarkerMode: false,
                        spiderLegPolylineOptions: {
                            weight: 1.5,
                            color: '#222',
                            opacity: 0.5
                        },
                        spiderfyDistanceMultiplier: 1,
                        // iconCreateFunction: function (cluster) {
                        //     return L.divIcon({ html: '<div><span>' + cluster.getChildCount() + '</span></div>' });
                        // },
                        iconCreateFunction: function (e) {
                            var t = e.getChildCount(),
                                i = " marker-cluster-",
                                layer = key.replace(/\s+/g, '-').toLowerCase(),
                                text = t,
                                size = 40;
                            if (t >= value.layerParams.limit) {
                                var text = "&#128269;";
                                var size = 80;
                            }
                            return i += 10 > t ? "small" : 100 > t ? "medium" : value.layerParams.limit > t ? "large" : "xxl", new L.DivIcon({
                                html: `<div><span>${text}</span></div>`, className: `marker-cluster marker-cluster-${layer} ${i}`, iconSize: new L.Point(size, size)
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
                        clusterPane: 'markerPane',
                    });
                    overlayGroups[key].addLayer(_overlayGroups[key]["markerLayer"]);
                    overlayMaps[key] = overlayGroups[key]
                    break;
                case "heatLayer":
                    overlayGroups[key] = L.layerGroup();
                    _overlayGroups[key] = {};
                    _overlayGroups[key]["heatLayer"] = L.heatLayer([], {});
                    overlayGroups[key].addLayer(_overlayGroups[key]["heatLayer"]);
                    overlayMaps[key] = overlayGroups[key];
                    break;
                case "layerGroup":
                    overlayGroups[key] = L.layerGroup();
                    _overlayGroups[key] = {};
                    _overlayGroups[key].icons = {};
                    _overlayGroups[key].icons.icon = L.icon({
                        iconUrl: value.icons.icon.iconUrl,
                        iconSize: value.icons.icon.iconSize
                    });
                    _overlayGroups[key].icons.highlightIcon = L.icon({
                        iconUrl: value.icons.highlightIcon.iconUrl,
                        iconSize: value.icons.highlightIcon.iconSize
                    });
                    _overlayGroups[key].icons.selectedIcon = L.icon({
                        iconUrl: value.icons.selectedIcon.iconUrl,
                        iconSize: value.icons.selectedIcon.iconSize
                    });
                    _overlayGroups[key].markers = {};
                    _overlayGroups[key]["heatLayer"] = L.heatLayer([], {});
                    _overlayGroups[key]["markerLayer"] = L.markerClusterGroup({
                        showCoverageOnHover: true,
                        zoomToBoundsOnClick: true,
                        spiderfyOnMaxZoom: false,
                        removeOutsideVisibleBounds: true,
                        animate: true,
                        animateAddingMarkers: false,
                        disableClusteringAtZoom: value.layerParams.zoomlevel,
                        maxClusterRadius: 80,
                        //polygonOptions: '',
                        singleMarkerMode: true,
                        spiderLegPolylineOptions: {
                            weight: 1.5,
                            color: '#222',
                            opacity: 0.5
                        },
                        spiderfyDistanceMultiplier: 1,
                        // iconCreateFunction: function (cluster) {
                        //     return L.divIcon({ html: '<div><span>' + cluster.getChildCount() + '</span></div>' });
                        // },
                        iconCreateFunction: function (e) {
                            var t = e.getChildCount(),
                                i = " marker-cluster-",
                                text = t,
                                size = 40;
                            if (t >= value.layerParams.limit) {
                                // TODO: if limit < totalrecords..
                                text = "&#128269;";
                                size = 80;
                            }

                            return i += 10 > t ? "small" : 100 > t ? "medium" : value.layerParams.limit > t ? "large" : "xxl", new L.DivIcon({
                                html: `<div><span>${text}</span></div>`, className: `marker-cluster ${i}`, iconSize: new L.Point(size, size)
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
                        clusterPane: 'markerPane',
                    });
                    overlayGroups[key].addLayer(_overlayGroups[key]["heatLayer"]);
                    overlayGroups[key].addLayer(_overlayGroups[key]["markerLayer"]);
                    overlayMaps[key] = overlayGroups[key]
                    break;
                default:
                    overlayMaps[key] = L.tileLayer(url, layerOptions);
            }

            // (overlayGroups[key]) ? overlayMaps[key] = overlayGroups[key] : null;
            if (value.layerParams.addToMap) {
                overlayMaps[key].addTo(map);
            }

        }
        // overlayMaps object structure:
        // overlayMaps = { layer: overlayGroups[layer], layer: overlayGroups[layer] }
        L.control.layers(baseMaps, overlayMaps).addTo(map);
        L.control.scale({ position: 'bottomleft', maxWidth: 200 }).addTo(map);
        L.control.locate({
            /** Position of the control */
            position: 'topright',
            /** The layer that the user's location should be drawn on. By default creates a new layer. */
            layer: undefined,
            /**
             * Automatically sets the map view (zoom and pan) to the user's location as it updates.
             * While the map is following the user's location, the control is in the `following` state,
             * which changes the style of the control and the circle marker.
             *
             * Possible values:
             *  - false: never updates the map view when location changes.
             *  - 'once': set the view when the location is first determined
             *  - 'always': always updates the map view when location changes.
             *              The map view follows the user's location.
             *  - 'untilPan': like 'always', except stops updating the
             *                view if the user has manually panned the map.
             *                The map view follows the user's location until she pans.
             *  - 'untilPanOrZoom': (default) like 'always', except stops updating the
             *                view if the user has manually panned the map.
             *                The map view follows the user's location until she pans.
             */
            setView: 'untilPanOrZoom',
            /** Smooth pan and zoom to the location of the marker. Only works in Leaflet 1.0+. */
            flyTo: true,
            /** Keep the current map zoom level when setting the view and only pan. */
            keepCurrentZoomLevel: false,
            /** After activating the plugin by clicking on the icon, zoom to the selected zoom level, even when keepCurrentZoomLevel is true. Set to 'false' to disable this feature. */
            initialZoomLevel: false,
            /**
             * The user location can be inside and outside the current view when the user clicks on the
             * control that is already active. Both cases can be configures separately.
             * Possible values are:
             *  - 'setView': zoom and pan to the current location
             *  - 'stop': stop locating and remove the location marker
             */
            clickBehavior: {
                inView: 'stop',
                outOfView: 'setView',
                inViewNotFollowing: 'setView'
            },
            /**
             * If set, save the map bounds just before centering to the user's
             * location. When control is disabled, set the view back to the
             * bounds that were saved.
             */
            returnToPrevBounds: false,
            /**
             * Keep a cache of the location after the user deactivates the control. If set to false, the user has to wait
             * until the locate API returns a new location before they see where they are again.
             */
            cacheLocation: true,
            /** If set and supported then show the compass heading */
            showCompass: true,
            /** If set, a circle that shows the location accuracy is drawn. */
            drawCircle: true,
            /** If set, the marker at the users' location is drawn. */
            drawMarker: true,
            /** The class to be used to create the marker. For example L.CircleMarker or L.Marker */
            // markerClass: LocationMarker,
            /** The class us be used to create the compass bearing arrow */
            // compassClass: Compassmarker,
            /** Accuracy circle style properties. NOTE these styles should match the css animations styles */
            circleStyle: {
                className: 'leaflet-control-locate-circle',
                color: '#136AEC',
                fillColor: '#136AEC',
                fillOpacity: 0.15,
                weight: 0
            },
            /** Inner marker style properties. Only works if your marker class supports `setStyle`. */
            markerStyle: {
                className: 'leaflet-control-locate-marker',
                color: '#fff',
                fillColor: '#2A93EE',
                fillOpacity: 1,
                weight: 3,
                opacity: 1,
                radius: 9
            },
            /** Compass */
            compassStyle: {
                fillColor: '#2A93EE',
                fillOpacity: 1,
                weight: 0,
                color: '#fff',
                opacity: 1,
                radius: 9, // How far is the arrow is from the center of of the marker
                width: 9, // Width of the arrow
                depth: 6  // Length of the arrow
            },
            /**
             * Changes to accuracy circle and inner marker while following.
             * It is only necessary to provide the properties that should change.
             */
            followCircleStyle: {},
            followMarkerStyle: {
                // color: '#FFA500',
                // fillColor: '#FFB000'
            },
            followCompassStyle: {},
            /** The CSS class for the icon. For example fa-location-arrow or fa-map-marker */
            icon: 'leaflet-control-locate-location-arrow',
            iconLoading: 'leaflet-control-locate-spinner',
            /** The element to be created for icons. For example span or i */
            iconElementTag: 'span',
            /** The element to be created for the text. For example small or span */
            textElementTag: 'small',
            /** Padding around the accuracy circle. */
            circlePadding: [0, 0],
            /** Use metric units. */
            metric: true,
            /**
             * This callback can be used in case you would like to override button creation behavior.
             * This is useful for DOM manipulation frameworks such as angular etc.
             * This function should return an object with HtmlElement for the button (link property) and the icon (icon property).
             */
            createButtonCallback(container, options) {
                const link = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single', container);
                link.title = options.strings.title;
                link.role = 'button';
                link.href = '#';
                const icon = L.DomUtil.create(options.iconElementTag, options.icon, link);

                if (options.strings.text !== undefined) {
                    const text = L.DomUtil.create(options.textElementTag, 'leaflet-locate-text', link);
                    text.textContent = options.strings.text;
                    link.classList.add('leaflet-locate-text-active');
                    link.parentNode.style.display = "flex";
                    if (options.icon.length > 0) {
                        icon.classList.add('leaflet-locate-icon');
                    }
                }

                return { link, icon };
            },
            /**
             * This callback can be used to override the viewport tracking
             * This function should return a LatLngBounds object.
             *
             * For example to extend the viewport to ensure that a particular LatLng is visible:
             *
             * getLocationBounds: function(locationEvent) {
             *    return locationEvent.bounds.extend([-33.873085, 151.219273]);
             * },
             */
            getLocationBounds(locationEvent) {
                return locationEvent.bounds;
            },
            /** This event is called in case of any location error that is not a time out error. */
            onLocationError(err, control) {
                alert(err.message);
            },
            /**
             * This event is called when the user's location is outside the bounds set on the map.
             * The event is called repeatedly when the location changes.
             */
            onLocationOutsideMapBounds(control) {
                control.stop();
                alert(control.options.strings.outsideMapBoundsMsg);
            },
            /** Display a pop-up when the user click on the inner marker. */
            showPopup: true,
            strings: {
                title: "Show me where I am",
                text: "",
                metersUnit: "meters",
                feetUnit: "feet",
                popup: "You are within {distance} {unit} from this point",
                outsideMapBoundsMsg: "You seem located outside the boundaries of the map"
            },
            /** The default options passed to leaflets locate method. */
            locationOptions: {
                watch: true,
                setView: false,
                maxZoom: Infinity,
                timeout: 10000,
                maximumAge: 0,
                enableHighAccuracy: true
            },
            initialize(options) {
                // set default options if nothing is set (merge one step deep)
                for (const i in options) {
                    if (typeof this.options[i] === 'object') {
                        L.extend(this.options[i], options[i]);
                    } else {
                        this.options[i] = options[i];
                    }
                }

                // extend the follow marker style and circle from the normal style
                this.options.followMarkerStyle = L.extend({}, this.options.markerStyle, this.options.followMarkerStyle);
                this.options.followCircleStyle = L.extend({}, this.options.circleStyle, this.options.followCircleStyle);
                this.options.followCompassStyle = L.extend({}, this.options.compassStyle, this.options.followCompassStyle);
            },
        }).addTo(map);

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
                                // markers[marker.properties.id].setIcon(selectedIcon);
                                marker.setIcon(marker.selectedIcon);
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

        if (!element.dataset.zoom) { element.dataset.zoom = 7 }

        this.map = map;
        this.map.zoom, this.map.center, this.map.bounds;
        this.overlayMaps = overlayMaps;
        this.overlayGroups = overlayGroups;
        this._overlayGroups = _overlayGroups;
        this.markers = markers;
        this.icon = icon;
        this.highlightIcon = highlightIcon;
        this.selectedIcon = selectedIcon;
        this.selectedMarkers = selectedMarkers;
        this.drawnItems = drawnItems;
        let self = this;

        // var div = document.createElement("div");
        // div.classList.add("row");
        // div.style.position = "absolute";
        // div.style.bottom = "0px";
        // div.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
        // div.style.width = "100vw";
        // div.style.marginLeft = "-25%";
        // div.style.marginRight = "-25%";
        // div.style.fontSize = "11px";

        // var left = document.createElement("div");
        // left.classList.add("col-xs-6");
        // var output = document.createElement("output");
        // output.setAttribute("id", "mapinfocoordinates");
        // output.style.display = "inline-grid";
        // output.style.padding = "0";
        // output.style.fontSize = "inherit";
        // left.appendChild(output);
        // left.appendChild(document.createElement("BR"));

        // var span = document.createElement("SPAN");
        // span.innerText = "SW(Xmin,Ymin): ";
        // left.appendChild(span);
        // var output = document.createElement("output");
        // output.setAttribute("id", "mapinfo_bounds_sw");
        // output.style.display = "inline-grid";
        // output.style.padding = "0";
        // output.style.fontSize = "inherit";
        // left.appendChild(output);
        // left.appendChild(document.createElement("BR"));

        // var span = document.createElement("SPAN");
        // span.innerText = "NE(Xmax,Ymax): ";
        // left.appendChild(span);
        // var output = document.createElement("output");
        // output.setAttribute("id", "mapinfo_bounds_ne");
        // output.style.display = "inline-grid";
        // output.style.padding = "0";
        // output.style.fontSize = "inherit";
        // left.appendChild(output);

        // var center = document.createElement("div");
        // center.classList.add("col-xs-4");
        // center.appendChild(document.createElement("BR"));
        // var span = document.createElement("SPAN");
        // span.setAttribute("id", "totalrecords");
        // span.innerText = "# Features in map view: ";
        // center.appendChild(span);

        // var right = document.createElement("div");
        // right.classList.add("col-xs-2");
        // right.style.margin = "3px 0px";
        // var button = document.createElement("button");
        // button.classList.add("btn", "btn-default", "pull-right");
        // var span = document.createElement("SPAN");
        // span.classList.add("glyphicon", "glyphicon-save");
        // span.setAttribute("aria-hidden", "true");
        // button.appendChild(span);
        // button.addEventListener("click", function () {
        //     this.exportData();
        // });
        // right.appendChild(button);
        // div.appendChild(left);
        // div.appendChild(center);
        // div.appendChild(right);
        // element.parentNode.parentNode.insertBefore(div, element.parentNode.nextElementSibling);

        // var bounds = map.getBounds();
        // var center = map.getCenter();
        // var lat, lng, xmin, ymin, xmax, ymax, srid;
        // lat = center.lat;
        // lng = center.lng;
        // xmin = bounds._southWest.lng;
        // ymin = bounds._southWest.lat;
        // xmax = bounds._northEast.lng;
        // ymax = bounds._northEast.lat;
        // srid = 4326;

        // document.getElementById("mapinfo_bounds_ne").innerHTML = xmax + ", " + ymax;
        // document.getElementById("mapinfo_bounds_sw").innerHTML = xmin + ", " + ymin;

        // var fromProjection = 'EPSG:4326';
        // switch (element.dataset.table) {
        //     case "llg_it_geom":
        //         var toProjection = 'EPSG:25833';
        //         break;
        //     case "llg_nl_geom":
        //     case "c14_geom":
        //         var toProjection = 'EPSG:28992';
        //         break;
        // }

        // if (document.querySelector("mapinfocoordinates")) {

        //     var projCoordNE = proj4(fromProjection, toProjection).forward([xmax, ymax]);
        //     var projCoordSW = proj4(fromProjection, toProjection).forward([xmin, ymin]);

        //     document.getElementById("mapinfo_bounds_ne").innerHTML = parseFloat(projCoordNE[0].toFixed(0)) + ", " + parseFloat(projCoordNE[1].toFixed(0));
        //     document.getElementById("mapinfo_bounds_sw").innerHTML = parseFloat(projCoordSW[0].toFixed(0)) + ", " + parseFloat(projCoordSW[1].toFixed(0));

        // }

        // TODO: For each (hasLayer = true) then...
        Object.keys(overlayMaps).forEach(function (layer) {
            if (map.hasLayer(overlayMaps[layer]) && self._overlayMaps[layer].layerType !== "TileLayer.WMS") {
                self.layerUpdate(layer);

                if (self._overlayGroups[layer]?.["markerLayer"]) {
                    self.tableCreate(layer);
                }
            }
        })

        var refresh;
        map.on('overlayadd', e => {
            console.info(`%coverlayadd`, `color:${this.colors.consoleInfo}`)
            if (map.hasLayer(overlayMaps[e.name]) && self._overlayMaps[e.name].layerType !== "TileLayer.WMS") {
                if (_overlayGroups[e.name]?.["markerLayer"]) {
                    self.layerUpdate(e.name, self.tableCreate(e.name));
                } else {
                    self.layerUpdate(e.name);
                }
            }
        })
        map.on('overlayremove', e => {
            console.info(`%coverlayremove`, `color:${this.colors.consoleInfo}`)
            var startTime = performance.now()
            if (!map.hasLayer(overlayMaps[e.name]) && self._overlayMaps[e.name].layerType !== "TileLayer.WMS") {
                if (self._overlayMaps[e.name].layerParams.cacheReturn == true && storageHandler.storage.session.get(e.name)) {
                    storageHandler.storage.session.remove(e.name);
                }
                if (document.getElementById(this.element.id).parentElement.querySelector('nav')) {
                    var tableTabs = document.getElementById(self.element.id).parentElement.querySelector('nav').firstElementChild.children;
                    var tablePanes = document.getElementById(self.element.id).parentElement.querySelector('div.tab-content').children;
                    for (var i = 0; i < tableTabs.length; i++) {
                        if (!map.hasLayer(overlayMaps[tableTabs[i].innerText])) {
                            var tableTab = tableTabs[i];
                            var tablePane = tablePanes[i];
                            // Check if current tab was the active tab..
                            if (tableTab.classList.contains('active')) {
                                tableTabs[0].firstElementChild.classList.add('active');
                            }
                            if (tablePane.classList.contains('show', 'active')) {
                                tablePanes[0].classList.add('show', 'active');
                            }
                            document.getElementById(self.element.id).parentElement.querySelector('nav').firstElementChild.removeChild(tableTab);
                            document.getElementById(self.element.id).parentElement.querySelector('div.tab-content').removeChild(tablePane);
                            delete window["ajaxTables"][tablePane.querySelector('table').dataset.index];
                        }
                    }
                    var x = tableTabs.length;
                    if (x == 0) {
                        var nav = document.getElementById(self.element.id).parentElement.querySelector('nav');
                        var div = document.getElementById(self.element.id).parentElement.querySelector('div.tab-content');
                        document.getElementById(self.element.id).style.height = "100%";
                        document.getElementById(self.element.id).parentElement.removeChild(nav);
                        document.getElementById(self.element.id).parentElement.removeChild(div);
                    }

                }
                if (document.getElementById('div-templateContent')) {
                    var templates = document.getElementById('div-templateContent').children;
                    for (var i = 1; i < templates.length; i++) {
                        if (!map.hasLayer(overlayMaps[templates[i].dataset.layer])) {
                            var template = templates[i];
                            if (template.classList.contains('show', 'active')) {
                                templates[1].classList.add('show', 'active');
                            }
                            document.getElementById('div-templateContent').removeChild(template);
                            delete window["ajaxTemplates"][template.dataset.layer]
                        }
                    }
                    var x = templates.length;
                    if (x == 1) {
                        var templateContainer = document.getElementById('div-templateContent');
                        document.getElementById(self.element.id).parentElement.removeChild(templateContainer);
                    }
                }
            }
            var endTime = performance.now()
            console.log(`Call to layerremove took ${endTime - startTime} milliseconds`)
        })
        map.on('layeradd', e => {
            console.info(`%clayeradd`, `color:${this.colors.consoleInfo}`)
        })
        map.on('layerremove', e => {
            console.info(`%clayerremove`, `color:${this.colors.consoleInfo}`)
        })
        map.on('dragstart', e => {
            console.info(`%cdragstar`, `color:${this.colors.consoleInfo}`)
            clearTimeout(refresh);
        })
        map.on('drag', e => {
            console.info(`%cdragging`, `color:${this.colors.consoleInfo}`)
        })
        map.on('dragend', e => {
            console.info(`%cdragend`, `color:${this.colors.consoleInfo}`)
            this.map.center = map.getCenter();
            if (this.map.location) {
                if (!this.map.center) {
                    var center = this.map.getCenter();
                    this.map.center = center;
                    var lat, lng;
                    lat = center.lat;
                    lng = center.lng;
                }
                if (!this.map.bounds || !this.map.boundsBox) {

                    var bounds = this.map.getBounds();
                    this.map.bounds = bounds;
                    var boundsBox = bounds.pad(-0.1);
                    this.map.boundsBox = boundsBox;

                    var boundsRect = new L.Rectangle([boundsBox._southWest, boundsBox._northEast], {
                        id: 'boundsRect',
                        color: 'red',
                        weight: 3,
                        opacity: 0.5,
                        fillOpacity: 0.1,
                        smoothFactor: 1
                    })
                    this.map.boundsRect = boundsRect;
                    boundsRect.addTo(drawnItems);

                    // Get initial layerUpdate
                    refresh = setTimeout(() => {
                        Object.keys(overlayMaps).forEach(function (key) {
                            if (map.hasLayer(overlayMaps[key])) {
                                self.layerUpdate(key);
                            }
                        })
                    }, 1000);
                }
                if (!this.map.boundsBox.contains(this.map.center)) {
                    console.info(`%coutOfBounds`, `color:${this.colors.consoleInfo}`)

                    // Get new layerUpdate
                    refresh = setTimeout(() => {
                        Object.keys(overlayMaps).forEach(function (key) {
                            if (map.hasLayer(overlayMaps[key])) {
                                self.layerUpdate(key);
                            }
                        })
                    }, 1000);
                }
            } else {
                refresh = setTimeout(() => {
                    Object.keys(overlayMaps).forEach(function (key) {
                        if (map.hasLayer(overlayMaps[key])) {
                            self.layerUpdate(key);
                        }
                    })
                }, 1000);
            }
        })
        map.on('zoomstart', e => {
            console.info(`%czoomstart`, `color:${this.colors.consoleInfo}`)
            clearTimeout(refresh);
        })
        map.on('zoom', e => {
            console.info(`%czooming`, `color:${this.colors.consoleInfo}`)
        })
        map.on('zoomend', e => {
            console.info(`%czoomend: ${map.getZoom()}`, `color:${this.colors.consoleInfo}`)
            // TODO: Disable zoomend layerUpdate unless we moved outside the margins within our original bounds
            if (this.map.location && !(this.map.zoom > map.getZoom())) {
                if (!this.map.center) {
                    var center = this.map.getCenter();
                    this.map.center = center;
                    var lat, lng;
                    lat = center.lat;
                    lng = center.lng;
                }
                if (!this.map.bounds || !this.map.boundsBox) {

                    var bounds = this.map.getBounds();
                    this.map.bounds = bounds;
                    var boundsBox = bounds.pad(-0.1);
                    this.map.boundsBox = boundsBox;

                    var boundsRect = new L.Rectangle([boundsBox._southWest, boundsBox._northEast], {
                        id: 'boundsRect',
                        color: 'red',
                        weight: 3,
                        opacity: 0.5,
                        fillOpacity: 0.1,
                        smoothFactor: 1
                    })
                    this.map.boundsRect = boundsRect;
                    boundsRect.addTo(drawnItems);

                    // Get initial layerUpdate
                    refresh = setTimeout(() => {
                        Object.keys(overlayMaps).forEach(function (key) {
                            if (map.hasLayer(overlayMaps[key])) {
                                self.layerUpdate(key);
                            }
                        })
                    }, 1000);
                }
                if (!this.map.boundsBox.contains(this.map.location)) {
                    console.info(`%coutOfBounds`, `color:${this.colors.consoleInfo}`)

                    // TODO: Static map: If center position is outside of bounds, recenter and redraw
                    // TODO: Static pos: If center position is outside of bounds, recenter and redraw
                    var center = this.map.getCenter();
                    this.map.center = center;

                    var lat, lng;
                    lat = center.lat;
                    lng = center.lng;

                    var bounds = this.map.getBounds();
                    this.map.bounds = bounds;
                    var boundsBox = bounds.pad(-0.1);
                    this.map.boundsBox = boundsBox;

                    this.drawnItems.removeLayer(this.map.boundsRect);
                    var boundsRect = new L.Rectangle([boundsBox._southWest, boundsBox._northEast], {
                        id: 'boundsRect',
                        color: 'red',
                        weight: 3,
                        opacity: 0.5,
                        fillOpacity: 0.1,
                        smoothFactor: 1
                    })
                    this.map.boundsRect = boundsRect;
                    boundsRect.addTo(drawnItems);

                    // Get new layerUpdate
                    Object.keys(overlayMaps).forEach(function (key) {
                        if (map.hasLayer(overlayMaps[key])) {
                            self.layerUpdate(key);
                        }
                    })

                }
            } else {

                refresh = setTimeout(() => {
                    Object.keys(overlayMaps).forEach(function (key) {
                        if (map.hasLayer(overlayMaps[key])) {
                            // TODO: ReAdd if back within zoomlevels!
                            // if((currentZoom >= self._overlayMaps[key]?.layerParams?.minZoom) && (currentZoom <= self._overlayMaps[key]?.layerParams?.maxZoom)) {
                            //     console.log("SHOW ON MAP")
                            // } else {
                            //     map.removeLayer(overlayMaps[key]);
                            // }
                            self.layerUpdate(key);
                        }
                    })
                }, 1000);
            }
            this.map.zoom = map.getZoom();
        })
        map.on('mousemove', e => {
            console.info(`%cmousemove`, `color:${this.colors.consoleInfo}`)
            //var projCoord = proj4(fromProjection, toProjection).forward([e.latlng.lng, e.latlng.lat]);

            //document.getElementById("mapinfocoordinates").innerHTML = e.latlng;
            // if (document.querySelector("mapinfocoordinates")) {
            //     document.getElementById("mapinfocoordinates").innerHTML = "XY(" + parseFloat(projCoord[0].toFixed(0)) + ", " + parseFloat(projCoord[1].toFixed(0)) + ")";
            // }
            //console.log("(" + parseFloat(projCoord[0].toFixed(0)) + ", " + parseFloat(projCoord[1].toFixed(0)) + ")");

        })
        var geolocation_position, geolocation_accuracy;
        map.on('locationfound', e => {
            console.info(`%clocationfound`, `color:${this.colors.consoleInfo}`)
            //console.log(e.target._locateOptions.setView);
            this.map.location = e.latlng;
            var radius = e.accuracy;
            (geolocation_position) ? map.removeLayer(geolocation_position) : geolocation_position = null; // L.marker(e.latlng).addTo(map).bindPopup("You are within " + radius + " meters from this point").openPopup();
            (geolocation_accuracy) ? map.removeLayer(geolocation_accuracy) : geolocation_accuracy = L.circle(e.latlng, radius).addTo(map);

            // TODO: Disable zoomend layerUpdate unless we moved outside the margins within our original bounds

        })
        map.on('locationerror', e => {
            console.info(`%clocationerror`, `color:${this.colors.consoleInfo}`)
            alert(e.message)
        })
        map.on('locateactivate', e => {
            alert('Activate Live Location')
            this.map.location = true;
        })
        map.on('locatedeactivate', e => {
            alert('Deactivate Live Location')
            this.map.location = false;
            this.map.boundsBox = false;
            this.drawnItems.removeLayer(this.map.boundsRect);
        })
        // Object started
        map.on(L.Draw.Event.DRAWSTART, function (event) {

            Object.values(selectedMarkers).forEach(function (marker) {
                if (selectedMarkers[marker.properties.id]) {
                    marker.setIcon(marker.properties.icon);
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
                if (map.hasLayer(self._overlayGroups[key]?.markerLayer)) {
                    self._overlayGroups[key].markerLayer.eachLayer(function (marker) {
                        if (layer.contains(marker.getLatLng())) {
                            //markers[marker.properties.id].setIcon(selectedIcon);
                            marker.setIcon(marker.properties.selectedIcon);
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
                    if (map.hasLayer(self._overlayGroups[key]?.markerLayer)) {
                        self._overlayGroups[key].markerLayer.eachLayer(function (marker) {
                            if (layer.contains(marker.getLatLng())) {
                                //markers[marker.properties.id].setIcon(selectedIcon);
                                marker.setIcon(marker.properties.selectedIcon);
                                selectedMarkers[marker.properties.id] = marker;
                            } else if (selectedMarkers[marker.properties.id]) {
                                //markers[marker.properties.id].setIcon(icon);
                                marker.setIcon(marker.properties.icon);
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
                selectedMarkers[marker.properties.id].setIcon(marker.properties.icon);
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
        return JSON.parse(this._overlayMaps[layer].dataset);
    }

    returnDataset(layer) {
        return JSON.stringify(this._overlayMaps[layer].dataset);
    }

    eventReceiver(e, i) {
        console.info(`%c${this.element.id} eventReceiver`, `color:${this.colors.consoleInfo}`);
        // console.log(e);
        // console.log(i);

        if (this.selectedMarkers[i]) {
            this.eventTransmitter(e, i);
            return;
        }

        let self = this;
        var layer = document.querySelector(`[id='${e.origin}']`).dataset.layer;
        var marker = self._overlayGroups[layer].markers[i];

        const mouseover = () => {
            marker.setIcon(marker.properties.highlightIcon);
        }
        const mouseout = () => {
            marker.setIcon(marker.properties.icon);
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
                    self.selectedMarkers[key].setIcon(self.selectedMarkers[key].properties.icon);
                    delete self.selectedMarkers[key];
                })
            }
            marker.setIcon(marker.properties.selectedIcon);
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
        console.info(`%c${this.element.id} eventTransmitter`, `color:${this.colors.consoleInfo}`);
        // TODO: Get layer in which event is transmitted from!
        // TODO: We need the target layer, even if it comes from child..
        //if (!e.target.properties.layer) { return; }
        if (!e.origin) { e.origin = this.element.id }

        // TODO: Check if fullscreen and event is click and #div-templateContent and mobile or desktop
        if (e.type == 'click' && this.element.parentElement.classList.contains('fullscreen') && document.querySelector('#div-templateContent')) {
            if (this.onMobile && e.origin === this.element.id) {
                // Click must come from map
                document.querySelector('#div-templateContent').scrollIntoView();
            } else {
                // Click must come from table
                document.querySelector('#div-templateContent').scrollIntoView();
            }
            // Correct template comes into view ('show', 'active')
            if (!document.querySelector('#div-templateContent').querySelector('iframe')) {
                var iframe = document.createElement('iframe');
                iframe.width = "100%";
                iframe.height = "96%";
                iframe.id = `${e.origin}-${i}`;
                iframe.src = "https://data-dev.neotomadb.org/" + i;
                iframe.style.position = 'absolute';
                iframe.style.top = '4%';
                iframe.style.left = '0';
                document.querySelector('#div-templateContent').appendChild(iframe);
            } else {
                document.querySelector('#div-templateContent').querySelector('iframe').src = "https://data-dev.neotomadb.org/" + i;
            }

        }

        // let slaveTemplates = document.querySelectorAll('[data-ajax="template"][data-master="' + this.element.id + '"]');
        let slaveTemplates = document.querySelectorAll(`[data-ajax='template'][data-master='${this.element.id}']`);
        slaveTemplates.forEach((template) => {
            if (template.id === e.origin) { return; }
            window["ajaxTemplates"][template.dataset.key].eventReceiver(e, i);
        });

        // let slaveTables = document.querySelectorAll('[data-ajax="table"][data-master="' + this.element.id + '"]');
        let slaveTables = document.querySelectorAll(`[data-ajax='table'][data-master='${this.element.id}']`);
        slaveTables.forEach((table) => {
            if (table.id === e.origin) { return; }
            window["ajaxTables"][table.dataset.index].eventReceiver(e, i);
        });

    }

    mapCreate(element, index) {
    }

    mapCallback(element) {
        console.log("mapCallback");

        document.getElementById("totalrecords").innerHTML = `# Features in map view: <b>${this.Data.totalrecords}</b>`;

        // let slaveTables = document.querySelectorAll(`[data-ajax='table'][data-master='${this.element.id}'][data-layer='${layer}']`);
        // slaveTables.forEach((table) => {
        //     if (this.map.getZoom() >= parseInt(this.element.dataset.zoomlevel, 10) /*|| self.getData().totalrecords <= self.getDataset().limit */) {
        //         table.previousElementSibling.style.display = "none";
        //         table.style.display = "table";
        //         window["ajaxTables"][parseInt(table.dataset.index, 10)].tableTabulate(this.data);
        //     } else {
        //         table.previousElementSibling.style.display = "block";
        //         table.style.display = "none";

        //     }
        // });

        if (this?._mapCallback?.functions) {
            let callbacks = this._mapCallback.functions;
            Object.keys(callbacks).forEach(function (value) {
                callbacks[value](element);
            })
        }
    }

    layerUpdate(layer, callback) {
        console.info("%clayerUpdate", "color: #28a745");
        if (storageHandler.storage.session.get(layer)) {
            return;
        }

        let self = this;

        function layerTabulate(response) {
            console.log("%clayerTabulate", "color:yellow");
            if (response.type !== "success") return response;

            var startTime = performance.now()
            const obj = self._overlayMaps[layer].parseResponse?.(response) || response;
            //const obj = this.parseResponse?.(response) || response;
            const data = obj.data;
            const dataset = obj.dataset;
            const records = obj?.records || 0;
            const totalrecords = obj?.totalrecords || 0;
            var endTime = performance.now()
            console.log(`Call to parseResponse took ${endTime - startTime} milliseconds`)

            var icon = self._overlayGroups[layer].icons.icon;
            var highlightIcon = self._overlayGroups[layer].icons.highlightIcon;
            var selectedIcon = self._overlayGroups[layer].icons.selectedIcon;
            var layerId = self.overlayMaps[layer]._leaflet_id;

            /*
            var startTime = performance.now()
            self._overlayGroups[layer]["markerLayer"].clearLayers();    // Takes too long!
            var endTime = performance.now()
            console.log(`Call to clearLayers took ${endTime - startTime} milliseconds`)
            */

            var startTime = performance.now()
            Object.values(dataset).forEach(function (value) {
                var i = self._overlayMaps[layer].getUID(value);

                if (!self._overlayGroups[layer]["markerLayer"].hasLayer(self._overlayGroups[layer].markers[i])) { // Every time?
                    //console.info(`%cMarker ${i} is in view but wasn't added already...`, "color: #ffc107");
                    var coords = self._overlayMaps[layer].getLatLng(value);
                    var marker = L.marker([coords.lat, coords.lng], { icon: icon });
                    marker.properties = {};
                    marker.properties.id = i;
                    marker.properties.layer = layer;
                    marker.properties.layerId = layerId;
                    marker.properties.icon = icon;
                    marker.properties.highlightIcon = highlightIcon
                    marker.properties.selectedIcon = selectedIcon;

                    marker.addEventListener('mouseover', (e) => {
                        if (Object.keys(self.selectedMarkers).length > 0) {
                            if (!self.selectedMarkers[i]) {
                                marker.setIcon(marker.properties.highlightIcon);
                            }
                        } else {
                            marker.setIcon(marker.properties.highlightIcon);
                        }
                        self.eventTransmitter(e, i);
                    });
                    marker.addEventListener('mouseout', (e) => {
                        if (Object.keys(self.selectedMarkers).length > 0) {
                            if (!self.selectedMarkers[i]) {
                                marker.setIcon(marker.properties.icon);
                            }
                        } else {
                            marker.setIcon(marker.properties.icon);
                        }
                        self.eventTransmitter(e, i);
                    });
                    marker.addEventListener('mousedown', (e) => {
                        if (Object.keys(self.selectedMarkers).length > 0) {
                            if (!self.selectedMarkers[i]) {
                                Object.values(self.selectedMarkers).forEach(function (marker) {
                                    marker.setIcon(marker.properties.icon);
                                })
                                marker.setIcon(marker.properties.selectedIcon);
                            }
                        } else {
                            marker.setIcon(marker.properties.selectedIcon);
                        }
                        self.eventTransmitter(e, i);
                    });
                    marker.addEventListener('mouseup', (e) => {
                        if (Object.keys(self.selectedMarkers).length > 0) {
                            if (!self.selectedMarkers[i]) {
                                Object.values(self.selectedMarkers).forEach(function (marker) {
                                    marker.setIcon(marker.properties.icon);
                                })
                                marker.setIcon(marker.properties.selectedIcon);
                            }
                        } else {
                            marker.setIcon(marker.properties.selectedIcon);
                        }
                        self.eventTransmitter(e, i);
                    });
                    marker.addEventListener('click', (e) => {
                        if (Object.keys(self.selectedMarkers).length > 0) {
                            if (!self.selectedMarkers[i]) {
                                Object.values(self.selectedMarkers).forEach(function (marker) {
                                    marker.setIcon(marker.properties.icon);
                                    delete self.selectedMarkers[marker.properties.id];
                                });
                                marker.setIcon(marker.properties.selectedIcon);
                            }
                        } else {
                            marker.setIcon(marker.properties.selectedIcon);
                        }
                        self.selectedMarkers[i] = marker;
                        self.eventTransmitter(e, i);
                    });

                    self._overlayGroups[layer].markers[i] = marker;

                    if (bounds.contains(marker.getLatLng())) {
                        self._overlayGroups[layer]["markerLayer"].addLayer(marker);
                        if (self.selectedMarkers[i]) {
                            marker.setIcon(marker.properties.selectedIcon);
                        }
                    } else {
                        self._overlayGroups[layer]["markerLayer"].removeLayer(marker);
                    }

                } // else {
                //     console.info(`%cMarker ${i} is in view and was added already...`, "color: #28a745");
                // }
            })
            var endTime = performance.now()
            console.log(`Call to iterate Object took ${endTime - startTime} milliseconds`)

            // var startTime = performance.now()
            // for (let [key, marker] of Object.entries(self._overlayGroups[layer].markers)) {
            //     // self._overlayGroups[layer]["markerLayer"].addLayer(marker);
            //     // if (self.selectedMarkers[key]) {
            //     //     marker.setIcon(marker.properties.selectedIcon);
            //     // }
            //     // TODO: Taking too long for each marker...
            //     // Maybe remove ALL markers and add marker within bounds..
            //     // if (bounds.contains(marker.getLatLng())) {
            //     //     self._overlayGroups[layer]["markerLayer"].addLayer(marker);
            //     //     if (self.selectedMarkers[key]) {
            //     //         marker.setIcon(marker.properties.selectedIcon);
            //     //     }
            //     // } else {
            //     //     self._overlayGroups[layer]["markerLayer"].removeLayer(marker);
            //     // }
            // }
            // var endTime = performance.now()
            // console.log(`Call to doSomething took ${endTime - startTime} milliseconds`)

            if (self._overlayMaps[layer]?.layerParams.cacheReturn == true) {
                storageHandler.storage.session.set(layer, 'cached');
            }

            if (document.querySelector(`[data-ajax='table'][data-master='${self.element.id}'][data-layer='${layer}']`)) {
                let table = document.querySelector(`[data-ajax='table'][data-master='${self.element.id}'][data-layer='${layer}']`);
                window["ajaxTables"][table.dataset.index].tableTabulate(obj);
            }

            self._overlayMaps[layer].dataset = obj;

        }

        if (this._overlayMaps[layer]?.layerType !== "tileLayer"
            && this._overlayMaps[layer]?.layerType !== "tileLayer.WMS") {
            console.info(`%cUpdating layer: ${layer}`, "color: #28a745");

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

        if (callback) {
            callback(layer);
        }
    }

    templateCreate(layer) {

    }

    tableCreate(layer) {

        let self = this;

        var container = document.getElementById(self.element.id).parentElement;

        if (this.onMobile) {
            // Mobile screen size
            if (!container.querySelector('#div-templateContent')) {
                var div = document.createElement('div');
                div.classList.add('container-fluid');
                div.id = "div-templateContent";
                div.style.position = 'absolute';
                div.style.top = '100vh';
                div.style.left = '0';
                div.style.height = '100vh';
                div.style.backgroundColor = 'inherit';
                container.appendChild(div);
                var button = document.createElement('button');
                button.type = 'button';
                button.classList.add('btn-close', 'mt-3', 'pull-left');
                button.setAttribute('aria-label', 'Close');
                button.addEventListener("click", function () {
                    // document.querySelector(`[id='${self.element.id}']`).scrollIntoView();
                    window.scrollTo({
                        top: '56px',
                        behavior: 'smooth'
                    });
                })
                div.appendChild(button);
            }

            var template = document.createElement('div');
            template.dataset.ajax = 'template';
            template.dataset.master = `${self.element.id}`;
            template.dataset.layer = layer;
            template.classList.add('show', 'active');

            var templates = container.querySelector('#div-templateContent').childNodes;
            templates.forEach(template => {
                template.classList.remove('show', 'active');
            })
            container.querySelector('#div-templateContent').appendChild(template); // Remove on layerremove

            var element = container.querySelector('#div-templateContent').lastElementChild;
            window["ajaxTemplates"][layer] = new ajaxTemplate(element, layer);


        } else {

            document.getElementById(self.element.id).style.height = "calc(60vh - 56px)";
            document.querySelector('.leaflet-bottom.leaflet-left').style.bottom = "56px";

            if (!container.querySelector('nav')) {
                var nav = document.createElement('nav');
                nav.style.position = 'absolute';
                nav.style.top = 'auto';
                nav.style.right = 'auto';
                nav.style.bottom = '40vh';
                nav.style.left = 'auto';
                nav.style.zIndex = '999';
                var ul = document.createElement('ul');
                ul.classList.add('nav', 'nav-tabs');
                ul.id = "nav-tab";
                ul.setAttribute('role', 'tablist');
                nav.appendChild(ul);
                container.appendChild(nav);
            }

            if (!container.querySelector('div.tab-content')) {
                var div = document.createElement('div');
                div.classList.add('tab-content', 'bg-white');
                div.id = "nav-tabContent";
                div.style.position = 'absolute';
                div.style.top = '60vh';
                div.style.right = '0';
                div.style.bottom = '0';
                div.style.left = '0';
                div.style.height = '40vh';
                div.style.flexGrow = '1';
                div.style.zIndex = '999';
                container.appendChild(div);
            }

            // Create new tab element
            var li = document.createElement('li');
            li.classList.add('nav-item');
            li.setAttribute('role', 'presentation');
            var button = document.createElement('button');
            button.classList.add('nav-link', 'link-dark', 'bg-light', 'pull-left', 'active');
            button.id = `nav-${self.overlayMaps[layer]._leaflet_id}-tab`;
            button.dataset.bsToggle = "tab";
            button.dataset.bsTarget = `#nav-${self.overlayMaps[layer]._leaflet_id}`;
            button.type = "button";
            button.setAttribute('role', 'tab');
            button.setAttribute('aria-controls', `nav-${self.overlayMaps[layer]._leaflet_id}`);
            button.setAttribute('aria-selected', 'true');
            button.style.marginTop = '0.3em';
            button.style.marginRight = '-0.9em';
            button.innerText = layer;
            var close = document.createElement('button');
            close.classList.add('btn-close', 'btn-xxs');
            close.setAttribute('aria-label', 'Close');
            close.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                var tableTabs = document.getElementById(self.element.id).parentElement.querySelector('nav').firstElementChild.children;
                var tablePanes = document.getElementById(self.element.id).parentElement.querySelector('div.tab-content').children;
                for (var i = 0; i < tableTabs.length; i++) {
                    if (tableTabs[i].firstElementChild.innerText == e.target.parentElement.firstElementChild.innerText) {   // We keep the layer obviously..
                        var tableTab = tableTabs[i];
                        var tablePane = tablePanes[i];
                        // Check if current tab was the active tab..
                        if (tableTab.classList.contains('active')) {
                            tableTabs[0].firstElementChild.classList.add('active');
                        }
                        if (tablePane.classList.contains('show', 'active')) {
                            tablePanes[0].classList.add('show', 'active');
                        }
                        document.getElementById(self.element.id).parentElement.querySelector('nav').firstElementChild.removeChild(tableTab);
                        document.getElementById(self.element.id).parentElement.querySelector('div.tab-content').removeChild(tablePane);
                        delete window["ajaxTables"][tablePane.querySelector('table').dataset.index];
                    }
                }
                var x = tableTabs.length;
                if (x == 0) {
                    var nav = document.getElementById(self.element.id).parentElement.querySelector('nav');
                    var div = document.getElementById(self.element.id).parentElement.querySelector('div.tab-content');
                    document.getElementById(self.element.id).style.height = "100%";
                    document.getElementById(self.element.id).parentElement.removeChild(nav);
                    document.getElementById(self.element.id).parentElement.removeChild(div);
                }
            })
            li.append(button, close);

            var tabs = container.querySelector('nav').firstElementChild.childNodes;
            tabs.forEach(tab => {
                tab.firstElementChild.classList.remove('active');
            })
            container.querySelector('nav').firstElementChild.appendChild(li);

            // Create new tab-pane element
            var div = document.createElement('div');
            div.classList.add('tab-pane', 'fade', 'show', 'active');
            div.id = `nav-${self.overlayMaps[layer]._leaflet_id}`;
            div.setAttribute('role', 'tabpanel');
            div.setAttribute('aria-labelledby', `nav-${self.overlayMaps[layer]._leaflet_id}-tab`);
            div.style.height = "inherit";
            var tableContainer = document.createElement('div');
            tableContainer.classList.add('table-scrollable');
            tableContainer.style.margin = "0";
            tableContainer.style.height = "100%";
            tableContainer.style.overflowY = "scroll";
            div.appendChild(tableContainer);

            var tabpanes = container.querySelector('div.tab-content').childNodes;
            tabpanes.forEach(tabpane => {
                tabpane.classList.remove('show', 'active');
            })
            container.querySelector('#nav-tabContent').appendChild(div);

            // Create new table
            var table = document.createElement('table');
            var caption = document.createElement('caption');
            caption.innerText = layer;
            caption.style.marginTop = "0";
            caption.style.marginRight = "0";
            caption.style.marginBottom = "0";
            caption.style.marginLeft = "0";
            caption.style.fontSize = "2em";
            caption.style.color = "black";
            caption.style.backgroundColor = "transparent";
            //table.appendChild(caption);
            table.classList.add('ajaxTable', 'table-hover');
            table.dataset.ajax = "table";
            table.dataset.master = self.element.id;
            table.dataset.layer = layer;
            table.dataset.layerId = self.overlayMaps[layer]._leaflet_id;
            table.dataset.query = JSON.stringify(self._overlayMaps[layer].layerParams.query);
            table.dataset.columns = self._overlayMaps[layer].layerParams.columns;
            table.dataset.columnnames = self._overlayMaps[layer].layerParams.columns;
            table.dataset.limit = 500;
            table.dataset.href = false;
            table.dataset.events = "mouseover,mouseout,mousedown,mouseup,click";
            // table.dataset.columns = "labidnr,longitude,latitude,xy,geom,xco,yco";
            // table.dataset.columnnames = "labidnr,longitude,latitude,xy,geom,xco,yco";
            container.querySelector(`#nav-${self.overlayMaps[layer]._leaflet_id}`).firstElementChild.appendChild(table);

            // TODO: parseResponse depends per layer
            // var tableOptions = {
            //     parseResponse: self._overlayMaps[layer].parseResponse,
            //     getUID: self._overlayMaps[layer].getUID,
            //     getLatLng: self._overlayMaps[layer].getLatLng,
            //     _tableCallback: {
            //         functions: {}
            //     }
            // }

            var element = container.querySelector(`#nav-${self.overlayMaps[layer]._leaflet_id}`).lastElementChild.lastElementChild;
            window["ajaxTables"][layer] = new ajaxTable(element, layer);

            // TODO
            if (!container.querySelector('#div-templateContent')) {
                var div = document.createElement('div');
                div.classList.add('container-fluid');
                div.id = "div-templateContent";
                div.style.position = 'absolute';
                div.style.top = '0';
                div.style.left = '100%';
                div.style.width = '100vw';
                div.style.height = '100vh';
                div.style.backgroundColor = 'inherit';
                container.appendChild(div);
                var button = document.createElement('button');
                button.type = 'button';
                button.classList.add('btn-close', 'mt-3', 'pull-left');
                button.setAttribute('aria-label', 'Close');
                button.addEventListener("click", function () {
                    document.querySelector(`[id='${self.element.id}']`).scrollIntoView();
                })
                div.appendChild(button);
            }

            var template = document.createElement('div');
            template.dataset.ajax = 'template';
            template.dataset.master = `${self.element.id}`;
            template.dataset.layer = layer;
            template.classList.add('show', 'active');

            var templates = container.querySelector('#div-templateContent').childNodes;
            templates.forEach(template => {
                template.classList.remove('show', 'active');
            })
            container.querySelector('#div-templateContent').appendChild(template); // Remove on layerremove

            var element = container.querySelector('#div-templateContent').lastElementChild;
            window["ajaxTemplates"][layer] = new ajaxTemplate(element, layer);

        }
    }

    exportData() {
        console.debug(`exportData`);
        // TODO: For each datapoint in map, asyncAJAX slave element
        // For each datapoint in slave element, asyncAJAX slave element
        // etc...
        let self = this;
        let element = this.element;

        if (Object.keys(self.drawnItems._layers).length > 0) {

            Object.values(self.drawnItems._layers).forEach(function (layer) {
                Object.values(self.markers).forEach(function (marker) {
                    if (layer.contains(marker.getLatLng())) {
                        //self.markers[marker.properties.id].setIcon(self.selectedIcon);
                        marker.setIcon(marker.properties.selectedIcon);
                        self.selectedMarkers[marker.properties.id] = marker;
                    } else if (self.selectedMarkers[marker.properties.id]) {
                        // self.markers[marker.properties.id].setIcon(self.icon);
                        marker.setIcon(marker.properties.icon);
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
