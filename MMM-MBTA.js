Module.register("MMM-MBTA", {
    defaults: {
        apikey: "",
        updateInterval: 120, // In seconds
        baseUrl: "https://api-v3.mbta.com/",
        stations: [ "Northeastern University" ],
        direction: "",
        predictedTimes: true,  // false - scheduled times may not work yet
        doAnimation: false,
        animationSpeed: 1000,
        formatETA: true,
        showMinutesOnly: false,
        showOnly: [ ],
        maxEntries: 8,
        maxTime: 0,
        showArrivalTime: false,
        showDepartTime: false,
        showETATime: true,
        fade: true,
        fadePoint: 0.25, // Start on 1/4th of the list.
        showFullName: false,
        colorIcons: false,
        showAlerts: false,  // works but styling needs help
        hideEmptyAlerts: false,
        flipDirection: false,  // if set to true, it will flip direction filter flag,
        flipHour: 12,
        directionFlipped: false,
        noETAToBack: false,
        showDirection: false,
    },

    getStyles: function() {
        return ["font-awesome.css", "MMM-MBTA.css"];
    },

    getHeader: function() {
        return this.data.header + " " + this.config.stations[0];
    },

    getScripts: function () {
        return ["moment.js", "https://code.jquery.com/jquery-3.3.1.min.js"];
    },

    start: function() {
        // API abuse prevention
        this.config.fadePoint = Math.max(this.config.fadePoint, 0);
        this.config.updateInterval = Math.max(this.config.updateInterval, 120);

        this.loaded = false;
        this.getStations = fetch(url)
                    .then(res => res.json())
                    .then(data => {
                        // Map attributes.name to id
                        const stopMap = {};
                        for (const stop of data.data) {
                            if (stop.attributes && stop.attributes.name && stop.id) {
                                stopMap[stop.attributes.name] = stop.id;
                            }
                        }
                        return stopMap;
                    })
                    .then(stationDict => this.config.stations.map(friendlyName => stationDict[friendlyName]));

        this.stationData = [];
        this.filterModes = [];
        this.setTransportationModeFilter();
        this.filterDirection = ["0", "1"];
        this.directionFlipped = false; 
    
        switch (this.config.direction) {
            case "Southbound":
            case "Westbound":
            case "Outbound":
                this.filterDirection = ["0"];
                break;
            case "Northbound":
            case "Eastbound":
            case "Inbound":
                this.filterDirection = ["1"];
                break;
        }
    },

    setTransportationModeFilter: function() {
        if (this.config.showOnly.includes("Subway")) {
            // Light rail and subway are synonymous in Boston
            this.filterModes.push("0");
            this.filterModes.push("1");
        }
        if (this.config.showOnly.includes("Train")) {
            this.filterModes.push("2");
        }
        if (this.config.showOnly.includes("Bus")) {
            this.filterModes.push("3");
        }
        if (this.config.showOnly.includes("Ferry")) {
            this.filterModes.push("4");
        }
    },

    getDom: function() {
        var wrapper = document.createElement("div");

        // Check if an API key is in the config
        if (!this.config.apikey) {
            if (wrapper.innerHTML !== "") {
                wrapper.innerHTML += "<br/>";
            }
            wrapper.innerHTML += "Please set a MBTA api key! MMM-MBTA won't work otherwise!";
            wrapper.className = "dimmed light small";
            return wrapper;
        }

        if (!this.loaded) {
            wrapper.innerHTML += "LOADING";
            wrapper.className = "dimmed light small";
        }

        var table = document.createElement("table");
        table.className = "small";

        // When there are no predictions
        if (!this.stationData.length) {
            var row = document.createElement("tr");
            table.appendChild(row);

            // Icon
            var symbolCell = document.createElement("td");
            symbolCell.className = "fa fa-times-circle";
            symbolCell.style.cssText = "padding-right: 10px";
            if (this.config.colorIcons) {
                    symbolCell.className += " red";
                }
            row.appendChild(symbolCell);

            var descCell = document.createElement("td");
            descCell.innerHTML = "Nothing coming soon...";
            descCell.className = "align-left bright";
            row.appendChild(descCell);
        } else {
            for (let station of this.stationData) {
                var row = document.createElement("tr");
                table.appendChild(row);
                let symbolCell = this.getIconDom(station.routeType, station.routeId);
                row.appendChild(symbolCell);

                // Description
                var descCell = document.createElement("td");
                var direction = "";
                switch (station.directionId) {
                    case "0":
                        direction = " Out";
                        break;
                    case "1":
                        direction = " In";
                        break;
                }

                //TODO: logic to display stopName for Commuter Rail
                // T
                descCell.innerHTML = station.tripSign + direction;
                // CR
                //descCell.innerHTML = this.stationData[i].stopName + direction;
                
                //Change routeId to public route name
                if ($.isNumeric(station.routeId)) {
                    switch (station.routeId) {
                        case "741":
                            descCell.innerHTML += " | SL1";
                            break;
                        case "742":
                            descCell.innerHTML += " | SL2";
                            break;
                        case "751":
                            descCell.innerHTML += " | SL4";
                            break;
                        case "749":
                            descCell.innerHTML += " | SL5";
                            break;
                        case "701":
                            descCell.innerHTML += " | CT1";
                            break;
                        case "747":
                            descCell.innerHTML += " | CT2";
                            break;
                        case "708":
                            descCell.innerHTML += " | CT3";
                            break;
                        default:
                            descCell.innerHTML += " | " + station.routeId;
                    }
                }
                descCell.className = "align-left bright";
                row.appendChild(descCell);

                // ETA
                if (this.config.showETATime) {
                    var preETACell = document.createElement("td");
                    var preETATime = station.preETA;
                    if (!preETATime) {
                        preETACell.innerHTML = "No ETA"
                    } else if (preETATime < 10) { // Better to display single digits as "now"
                        preETACell.innerHTML = "Now";
                    } else {
                        var minutes = Math.floor(preETATime / 60);
                        var seconds = preETATime % 60;

                        if (this.config.showMinutesOnly) {
                            if (!minutes) {
                                preETACell.innerHTML = "No ETA"
                            } else if (minutes === 0) {
                                preETACell.innerHTML = "< 1 min";
                            } else if (minutes === 1) {
                                preETACell.innerHTML = "1 min"
                            } else {
                                preETACell.innerHTML = minutes + " mins";
                            }
                        } else if (this.config.formatETA) { // Parses the time away into MM:SS
                            // Padding so we don't get something like 4:3 minutes...
                            if (seconds < 10) {
                                // lol what even is type casting
                                seconds = "0" + seconds;
                            }
                            preETACell.innerHTML = minutes + ":" + seconds;
                        } else {
                            preETACell.innerHTML = seconds;
                        }
                    }
                    row.appendChild(preETACell);
                }

                // Arrival time
                if (this.config.showArrivalTime) {
                    var arrTimeCell = document.createElement("td");
                    if (!station.preArr) {
                        arrTimeCell.innerHTML = "No arrival";
                    } else {
                        if (config.timeFormat === 24) {
                            arrTimeCell.innerHTML = moment.unix(station.preArr).format("H:mm");
                        } else {
                            arrTimeCell.innerHTML = moment.unix(station.preArr).format("h:mm");
                        }
                    }
                    row.appendChild(arrTimeCell);
                }

                // Departure time
                if (this.config.showDepartTime) {
                    var depTimeCell = document.createElement("td");
                    if (!station.preDt) {
                        depTimeCell.innerHTML = "No depart";
                    } else {
                        if (config.timeFormat === 24) {
                            depTimeCell.innerHTML = moment.unix(station.preDt).format("H:mm");
                        } else {
                            depTimeCell.innerHTML = moment.unix(station.preDt).format("h:mm");
                        }
                    }
                    row.appendChild(depTimeCell);
                }
            }

            var startingPoint = this.stationData.length * this.config.fadePoint;
            var steps = this.stationData.length - startingPoint;
            for (let i = 0; i < this.stationData.length; i++) {
                // Stolen from default modules to ensure style is identical. Thanks MichMich <3
                if (this.config.fade && this.config.fadePoint < 1) {
                    if (i >= startingPoint) {
                        var currentStep = i - startingPoint;
                        table.rows[i].style.opacity = 1 - (1 / steps * currentStep);
                    }
                }
            }
        };

        wrapper.appendChild(table);

        // Don't start the update loop on first init
        if (this.loaded) {
            this.scheduleUpdate();
        }

        // Alerts
        let uniqueAlerts = new Set();

        for (let i = 0; i < this.stationData.length; i++) {
            for (let j = 0; j < this.stationData[i].alerts.length; j++) {
                uniqueAlerts.add(this.stationData[i].alerts[j]);
            }
        }

        if (this.config.showAlerts) {
            var showEmptyAlerts = uniqueAlerts.size === 0 && this.config.hideEmptyAlerts === false;
            var hasAlerts = uniqueAlerts.size > 0;

            if (showEmptyAlerts || hasAlerts) {
                var alertHeader = document.createElement("header");
                alertHeader.className = "module-header alerts-header";
                alertHeader.innerHTML = "Alerts";
                wrapper.appendChild(alertHeader);

                var alertsDiv = document.createElement("div");
                alertsDiv.className = "alerts small";

                if (showEmptyAlerts) {
                    var alertsWrapper = document.createElement("div");
                    alertsWrapper.className = "alerts-wrapper";
                    alertsDiv.appendChild(alertsWrapper);

                    var alertDiv = document.createElement("div");
                    alertDiv.innerHTML = "No alerts";
                    alertDiv.className = "light small alert";
                    alertsWrapper.appendChild(alertDiv);
                }

                if (hasAlerts) {
                    var charCount = Array.from(uniqueAlerts).join(' ').length;
                    var alertsWrapper = document.createElement("div");
                    alertsWrapper.className = "alerts-wrapper animate";
                    alertsWrapper.style.setProperty("--char-count", charCount);
                    alertsDiv.appendChild(alertsWrapper);

                    for (let alert of uniqueAlerts) {
                        var alertDiv = document.createElement("div");
                        alertDiv.innerHTML = alert;
                        alertDiv.className = "light small alert";
                        alertsWrapper.appendChild(alertDiv);
                    }
                }

                wrapper.appendChild(alertsDiv);
            }

        }
        return wrapper;
    },

    // Returns the DOM for the icon beside the incoming transportation.
    getIconDom: function(routeType, routeId) {
        // Icon
        var symbolCell = document.createElement("td");

        // https://api-v3.mbta.com/docs/swagger/index.html#/Route/ApiWeb_RouteController_show
        switch (routeType) {
            case "0": // Light Rail
            case "1": // Heavy Rail
                symbolCell.className = "fa fa-subway";
                break;
            case "2": // Commuter Rail
                symbolCell.className = "fa fa-train";
                break;
            case "3": // Bus
                symbolCell.className = "fa fa-bus";
                break;
            case "4": // Ferry
                symbolCell.className = "fa fa-ship";
                break;
            default:
                symbolCell.className = "fa fa-question-circle-o";
        }

        // Color Icons
        if (this.config.colorIcons) {
            switch (routeId) {
                case "Red":
                case "Mattapan":
                    symbolCell.className += " red";
                    break;
                case "Blue":
                    symbolCell.className += " blue";
                    break;
                case "Orange":
                    symbolCell.className += " orange";
                    break;
                case "Green-B":
                case "Green-C":
                case "Green-D":
                case "Green-E":
                    symbolCell.className += " green";
                    break;
                case "Boat-F1":
                case "Boat-F4":
                    symbolCell.className += " green";
                    break;
            }

            if (routeId.includes("CR-")) {
                symbolCell.className += " commuter"
            }

            if ($.isNumeric(routeId)) {
                symbolCell.className += " bus"
            }
        }

        symbolCell.style.cssText = "padding-right: 10px";

        return symbolCell;
    },

    notificationReceived: function(notification) {
        if (notification === "DOM_OBJECTS_CREATED") {
            Log.log(this.name + " received a system notification: " + notification);
            this.fetchData(true);
        }
    },

    scheduleUpdate: function(amt) {
        var interval = amt || this.config.updateInterval;

        var self = this;
        setTimeout(function() {
            self.fetchData();
            if (self.config.doAnimation) {
                self.updateDom(self.config.animationSpeed);
            } else {
                self.updateDom();
            }
        }, interval * 1000);
    },

    // params: updateDomAfter: boolean, whether or not to call updateDom() after processing data.
    fetchData: function(updateDomAfter) {
        this.getStations.then(stations => {
            for (let stop in stations) {
                var url = this.formUrl(stations[stop]);
                var MBTARequest = new XMLHttpRequest();
                MBTARequest.open("GET", url, true);

                var self = this;
                MBTARequest.onreadystatechange = function() {
                    if (this.readyState === 4) {
                        if (this.status === 200) {
                            self.loopData(JSON.parse(this.response), updateDomAfter);
                        }
                    }
                };
                MBTARequest.send();
            }
        });
    },

    // Gets API URL based off user settings
    formUrl: function(stopId) {
        var url = this.config.baseUrl;

        if (this.config.predictedTimes) {
            url += "predictions";
        } else {
            url += "schedules";
        }

        url += "?api_key=" + this.config.apikey;
        url += "&filter[stop]=" + stopId;
        url += "&include=stop,route,trip,alerts&sort=arrival_time";

        // Gets (maxEntries + 10) schedules or all schedules up to 5 hours from now, whichever is lower
        // Page and time limits necessary because otherwise "schedules" endpoint gets every single schedule
        if (!this.config.predictedTimes) {
            url += "&page[limit]=" + (this.config.maxEntries + 10) + '"';
            url += "&filter[min_time]=" + moment().format("HH:mm");
            url += "&filter[max_time]=" + moment().add(5, 'h').format("HH:mm");
        }
        return url;
    },

    fetchRoute: function(data, pred, routeId, tripId, alertIds, rawData) {
        var deferredPromise = $.Deferred();

        var routeUrl = this.getEndpointURL("routes",routeId);
        var routeRequest = new XMLHttpRequest();
        routeRequest.open("GET", routeUrl, true);

        var self = this;
        routeRequest.onreadystatechange = function() {
            if (this.readyState === 4) {
                if (this.status === 200) {
                    self.fetchTrip(data, pred, JSON.parse(this.response), tripId, alertIds, rawData, deferredPromise)
                } else if (this.status === 404) {
                    self.fetchTrip(data, pred, "Unavailable", tripId, alertIds, rawData, deferredPromise);
                }
            }
        };
        routeRequest.send();

        return deferredPromise;
    },

    fetchTrip: function(data, pred, routeParse, tripId, alertIds, rawData, promise) {
        var tripUrl = this.getEndpointURL("trips", tripId);
        var tripRequest = new XMLHttpRequest();
        tripRequest.open("GET", tripUrl, true);

        var self = this;
        tripRequest.onreadystatechange = function() {
            if (this.readyState === 4) {
                if (this.status === 200) {
                    self.fetchAlerts(data, pred, routeParse, JSON.parse(this.response), alertIds, rawData, promise);
                } else if (this.status === 404) {
                    self.fetchAlerts(data, pred, routeParse, "Unavailable", alertIds, rawData, promise);
                }
            }
        };
        tripRequest.send();
    },

    fetchAlerts: function(data, pred, routeParse, tripParse, alertIds, rawData, promise) {
        var alertPromises = [];
        var self = this;
        alertIds.forEach(function(alert) {
            var alertPromise = $.Deferred();
            alertPromises.push(alertPromise);

            var alertId = alert.id

            var alertUrl = self.getEndpointURL("alerts", alertId);
            var alertRequest = new XMLHttpRequest();
            alertRequest.open("GET", alertUrl, true);

            alertRequest.onreadystatechange = function() {
                if (this.readyState === 4) {
                    if (this.status === 200) {
                        alertPromise.resolve(JSON.parse(this.response));
                    } else if (this.status === 404) {
                        alertPromise.resolve("Unavailable");
                    }
                }
            };
            alertRequest.send();
        });

        $.when(...alertPromises).then(function(...alertsParse) {
            self.processData(data, pred, routeParse, tripParse, alertsParse, rawData);
            promise.resolve();
        });
    },

    getEndpointURL: function(detail, id) {
        return this.config.baseUrl + detail + '/' + id + "?api_key=" + this.config.apikey;
    },

    loopData: function(data, updateDomAfter) {
        this.stationData = []; // clear all data.
        var rawData = [];
        var promises = [];

        if (data.data.length === 0) {
            this.loaded = true;
            if (updateDomAfter) {
                this.updateDom();
            }
        } else {
            for (let pred = 0; pred < data["data"].length; pred++) {
                routeId = data.data[pred].relationships.route.data.id;
                tripId = data.data[pred].relationships.trip.data.id;
                alertIds = data.data[pred].relationships.alerts.data;

                promises.push(this.fetchRoute(data, pred, routeId, tripId, alertIds, rawData));
            }

            var that = this;
            $.when(...promises).then(function() {
                that.cleanData(rawData, updateDomAfter);
            });
        }
    },

    // updateDomAfter: immediately call updateDom() if true
    processData: function(data, pred, routeParse, tripParse, alertsParse, rawData) {
        /* Each element in this array is an entry on our displayed table:
        {"routeType": string,
         "routeId": string,
         "tripSign": string,
         "directionId": string,
         "alerts": array,
         "preDt": int,
         "preArr": int,
         "preETA": int
        } */

        let alertsArray = [];
        for (let alert of alertsParse) {
            if (alert.data) {
                alertsArray.push(alert.data.attributes.header);
            }
        }

        let routeType = routeParse.data.attributes.type.toString();
        let routeId = routeParse.data.id;

        let tripSign = tripParse.data.attributes.headsign || "Name Unavailable";
        let directionId = tripParse.data.attributes.direction_id.toString() || "Direction Unavailable";

        let preDt = parseInt(moment(data.data[pred].attributes.departure_time).format("X"));
        let preArr = parseInt(moment(data.data[pred].attributes.arrival_time).format("X"));
        let preETA = moment(data.data[pred].attributes.arrival_time || data.data[pred].attributes.departure_time).diff(moment(), 'seconds') - 30; //Better safe than sorry?
        let stopName = data.data[pred].relationships.stop.data.id;

        let parsedData = {
            routeType: routeType,
            routeId: routeId,
            tripSign: tripSign,
            directionId: directionId,
            alerts: alertsArray,
            preDt: preDt,
            preArr: preArr,
            preETA: preETA,
            stopName: stopName
        };

        rawData.push(parsedData);
    },

    cleanData: function(rawData, updateDomAfter) {
        if (!this.filterModes.length) {
            this.stationData = rawData;
        } else {
            this.stationData = rawData.filter(obj => this.filterModes.includes(obj.routeType));
        }

        // Sorts them according to ETA time
        this.stationData.sort((a, b) => {
            if (this.config.noETAToBack) {
                if (!a.preETA) {
                    return 1;
                }
                
                if (!b.preETA) {
                    return -1;
                }
            }
            return a.preETA - b.preETA;
        });

        if (this.config.flipDirection && this.config.direction.length > 0) {
            // after flipTime, invert direction 
            var flipTime = moment().toDate();
            flipTime.setHours(this.config.flipHour);
            flipTime.setMinutes(0);

            if (moment().isSameOrAfter(flipTime)) {
                if (!this.directionFlipped) {
                    this.filterDirection[0] = (1 - this.filterDirection[0]).toString();
                    this.directionFlipped = true;
                }
            } else {
                this.directionFlipped = false;
            }
        }

        // Applies directional filter
        if (this.filterDirection.length > 0) {
            this.stationData = this.stationData.filter(obj => this.filterDirection.includes(obj.directionId));
        }

        // Remove trips beyond maxTime
        if (this.config.maxTime !== 0) {
            this.stationData = this.stationData.filter(obj => (obj.preETA <= this.config.maxTime * 60));
        }

        // Shortens the array
        this.stationData.length = Math.min(this.stationData.length, this.config.maxEntries);

        this.loaded = true;
        if (updateDomAfter) {
            this.updateDom();
        }
    }
});
