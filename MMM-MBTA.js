Module.register("MMM-MBTA", {
    defaults: {
        apikey: "",
        updateInterval: 10, // In seconds
        baseUrl: "https://api-v3.mbta.com/",
        stations: [ "Northeastern University" ],
        direction: [ ],
        predictedTimes: true,
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
        showAlerts: false,
        hideEmptyAlerts: false
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
        if (this.config.updateInterval < 10) {
            this.config.updateInterval = 10;
        }

        this.loaded = false;
        var directionDict = {"Southbound": "0", "Northbound": "1", "Westbound": "0", "Eastbound": "1", "Outbound": "0", "Inbound": "1"};

        this.getStations = fetch('modules/MMM-MBTA/stations-formatted.json')
            .then(res => res.json())
            .then(stationDict => this.config.stations.map(friendlyName => stationDict[friendlyName]));

        this.stationData = []; // Clear station data
        this.filterModes = [];

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
        if (this.config.showOnly.includes("Cable car")) {
            this.filterModes.push("5");
        }

        this.filterDirection = [];

        switch (this.config.direction) {
            case "Southbound":
            case "Westbound":
            case "Outbound":
                this.filterDirection.push("0");
                break;
            case "Northbound":
            case "Eastbound":
            case "Inbound":
                this.filterDirection.push("1");
                break;
        }
    },

    getDom: function() {
        var wrapper = document.createElement("div");

        if (!this.loaded) {
            wrapper.innerHTML += "LOADING";
            wrapper.className = "dimmed light small";
        }

        // Check if an API key is in the config
        if (this.config.apikey === "") {
            if (wrapper.innerHTML !== "") {
                wrapper.innerHTML += "<br/>";
            }
            wrapper.innerHTML += "Please set a MBTA api key! This module won't load otherwise!";
            wrapper.className = "dimmed light small";
            return wrapper; // Do not continue updating
        }

        /*-----------------------------------------*/

        var table = document.createElement("table");
        table.className = "small";

        // When there are no predictions
        if (this.stationData.length === 0) {
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
            descCell.innerHTML = "No vehicles are scheduled";
            descCell.className = "align-left bright";
            row.appendChild(descCell);
        } else {
            for (let i = 0; i < this.stationData.length; i++) {
                var row = document.createElement("tr");
                table.appendChild(row);

                // Icon
                var symbolCell = document.createElement("td");
                switch (this.stationData[i].routeType) {
                    case "0": // Tram/Streetcar/Light Rail case. We'll use the same icon.
                    case "1":
                        symbolCell.className = "fa fa-subway";
                        break;
                    case "2":
                        symbolCell.className = "fa fa-train";
                        break;
                    case "3":
                        symbolCell.className = "fa fa-bus";
                        break;
                    case "4":
                        symbolCell.className = "fa fa-ship";
                        break;
                    case "5": // Suppose to be a cable car but there's no FA icon, so we'll just use the train icon
                        symbolCell.className = "fa fa-train";
                        break;
                    case "6": // Gondola case
                        // There shouldn't be a gondola in Boston.
                    case "7": // Funicular case
                        // There shouldn't be a funicular in Boston.
                    default:
                        symbolCell.className = "fa fa-question-circle-o";
                }

                // Color Icons
                if (this.config.colorIcons) {
                    switch (this.stationData[i].routeId) {
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

                    if (this.stationData[i].routeId.includes("CR-")) {
                        symbolCell.className += " commuter"
                    }

                    if ($.isNumeric(this.stationData[i].routeId)) {
                        symbolCell.className += " bus"
                    }
                }

                symbolCell.style.cssText = "padding-right: 10px";
                row.appendChild(symbolCell);

                // Description
                var descCell = document.createElement("td");
                descCell.innerHTML = this.stationData[i].tripSign;

                //Change routeId to public route name
                if ($.isNumeric(this.stationData[i].routeId)) {
                    switch (this.stationData[i].routeId) {
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
                            descCell.innerHTML += " | " + routeId;
                    }
                }
                descCell.className = "align-left bright";
                row.appendChild(descCell);

                // ETA
                if (this.config.showETATime) {
                    var preETACell = document.createElement("td");
                    var preETATime = this.stationData[i].preETA;

                    if (preETATime == null) {
                        preETACell.innerHTML = "No ETA"
                    } else if (preETATime < 10) { // Better to display single digits as "now"
                        preETACell.innerHTML = "Now";
                    } else {
                        var minutes = Math.floor(preETATime / 60);
                        var seconds = preETATime % 60;

                        if (this.config.showMinutesOnly) {
                            if (minutes == null) {
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
                    if (!this.stationData[i].preArr) {
                        arrTimeCell.innerHTML = "No arrival";
                    } else {
                        if (config.timeFormat === 24) {
                            arrTimeCell.innerHTML = moment.unix(this.stationData[i].preArr).format("H:mm");
                        } else {
                            arrTimeCell.innerHTML = moment.unix(this.stationData[i].preArr).format("h:mm");
                        }
                    }
                    row.appendChild(arrTimeCell);
                }

                // Departure time
                if (this.config.showDepartTime) {
                    var depTimeCell = document.createElement("td");
                    if (!this.stationData[i].preDt) {
                        depTimeCell.innerHTML = "No depart";
                    } else {
                        if (config.timeFormat === 24) {
                            depTimeCell.innerHTML = moment.unix(this.stationData[i].preDt).format("H:mm");
                        } else {
                            depTimeCell.innerHTML = moment.unix(this.stationData[i].preDt).format("h:mm");
                        }
                    }
                    row.appendChild(depTimeCell);
                }

                // Stolen from default modules to ensure style is identical. Thanks MichMich <3
                if (this.config.fade && this.config.fadePoint < 1) {
                    if (this.config.fadePoint < 0) {
                        this.config.fadePoint = 0;
                    }
                    var startingPoint = this.stationData.length * this.config.fadePoint;
                    var steps = this.stationData.length - startingPoint;
                    if (i >= startingPoint) {
                        var currentStep = i - startingPoint;
                        row.style.opacity = 1 - (1 / steps * currentStep);
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
            if (uniqueAlerts.size === 0 && this.config.hideEmptyAlerts === false) {
                var alertHeader = document.createElement("header");
                alertHeader.className = "module-header alerts";
                alertHeader.innerHTML = "Alerts";
                wrapper.appendChild(alertHeader);

                var alertTable = document.createElement("table");
                alertTable.className = "small";

                var row = document.createElement("tr");
                alertTable.appendChild(row);
                alertTable.style.cssText = "width: inherit";

                var alertCell = document.createElement("td");
                alertCell.innerHTML = "No alerts";
                alertCell.className = "light small";
                row.appendChild(alertCell);

                wrapper.appendChild(alertTable);
            } else if (uniqueAlerts.size > 0) {
                var alertHeader = document.createElement("header");
                alertHeader.className = "module-header alerts";
                alertHeader.innerHTML = "Alerts";
                wrapper.appendChild(alertHeader);

                var alertTable = document.createElement("table");
                alertTable.className = "small";

                for (let alert of uniqueAlerts) {
                    var alertText = alert;

                    var row = document.createElement("tr");
                    alertTable.appendChild(row);
                    alertTable.style.cssText = "width: inherit";

                    var alertCell = document.createElement("td");
                    alertCell.innerHTML = alertText;
                    alertCell.className = "light small alert";
                    row.appendChild(alertCell);
                }
                wrapper.appendChild(alertTable);
            }
        }
        return wrapper;
    },

    notificationReceived: function(notification, payload, sender) {
        if (notification === "DOM_OBJECTS_CREATED") {
            Log.log(this.name + " received a system notification: " + notification);
            this.fetchData(true);
            Log.log("updating dom");
        }
    },

    scheduleUpdate: function(amt) {
        var interval = (amt !== undefined) ? amt : this.config.updateInterval;

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

        // Gets (maxEntries + 10) schedules or all schedules up to 3 hours from now, whichever is lower
        // Page and time limits necessary because otherwise "schedules" endpoint gets every single schedule
        if (!this.config.predictedTimes) {
            url += "&page[limit]=" + (maxEntries + 10) + '"';
            url += "&filter[min_time]=" + moment().format("HH:mm");
            url += "&filter[max_time]=" + moment().add(3, 'h').format("HH:mm");
        }
        return url;
    },

    fetchRoute: function(data, updateDomAfter, pred, routeId, tripId, alertIds, rawData) {
        var deferredPromise = $.Deferred();

        var routeUrl = this.detailsUrl("routes",routeId);
        var routeRequest = new XMLHttpRequest();
        routeRequest.open("GET", routeUrl, true);

        var self = this;
        routeRequest.onreadystatechange = function() {
            if (this.readyState === 4) {
                if (this.status === 200) {
                    self.fetchTrip(data, updateDomAfter, pred, JSON.parse(this.response), tripId, alertIds, rawData, deferredPromise)
                } else if (this.status === 404) {
                    self.fetchTrip(data, updateDomAfter, pred, "Unavailable", tripId, alertIds, rawData, deferredPromise);
                }
            }
        };
        routeRequest.send();

        return deferredPromise;
    },

    fetchTrip: function(data, updateDomAfter, pred, routeParse, tripId, alertId, rawData, promise) {
        var tripUrl = this.detailsUrl("trips",tripId);
        var tripRequest = new XMLHttpRequest();
        tripRequest.open("GET", tripUrl, true);

        var self = this;
        tripRequest.onreadystatechange = function() {
            if (this.readyState === 4) {
                if (this.status === 200) {
                    self.fetchAlerts(data, updateDomAfter, pred, routeParse, JSON.parse(this.response), alertIds, rawData, promise);
                } else if (this.status === 404) {
                    self.fetchAlerts(data, updateDomAfter, pred, routeParse, "Unavailable", alertIds, rawData, promise);
                }
            }
        };
        tripRequest.send();
    },

    fetchAlerts: function(data, updateDomAfter, pred, routeParse, tripParse, alertIds, rawData, promise) {
        var alertPromises = [];
        var self = this;
        alertIds.forEach(function(alert) {
            var alertPromise = $.Deferred();
            alertPromises.push(alertPromise);

            var alertId = alert.id

            var alertUrl = self.detailsUrl("alerts", alertId);
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
            self.processData(data, updateDomAfter, pred, routeParse, tripParse, alertsParse, rawData);
            promise.resolve();
        });
    },

    detailsUrl: function(detail,id) {
        var url = this.config.baseUrl;
        url += detail + '/';
        url += id;
        url += "?api_key=" + this.config.apikey;

        return url;
    },

    loopData: function(data, updateDomAfter) {
        this.stationData = [ ]; // clear all data.
        var rawData = [ ];
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

                promises.push(this.fetchRoute(data, updateDomAfter, pred, routeId, tripId, alertIds, rawData));
            }

            var that = this;
            $.when(...promises).then(function() {
                that.cleanData(data, rawData, updateDomAfter);
            });
        }
    },

    // updateDomAfter: immediatelly call updateDom() if true
    processData: function(data, updateDomAfter, pred, routeParse, tripParse, alertsParse, rawData) {
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

        alertsArray = [];
        for (let alert of alertsParse) {
            if (alert.data) {
                alertsArray.push(alert.data.attributes.header);
            }
        };
        routeType = routeParse.data.attributes.type.toString();
        routeId = routeParse.data.id;
        if (tripParse.data) {
            tripSign = tripParse.data.attributes.headsign;
            directionId = tripParse.data.attributes.direction_id.toString();
        } else {
            tripSign = "Name unavailable"
            directionId = "Direction unavailable"
        }
        preDt = parseInt(moment(data.data[pred].attributes.departure_time).format("X"));
        preArr = parseInt(moment(data.data[pred].attributes.arrival_time).format("X"));
        preETA = moment(data.data[pred].attributes.arrival_time).diff(moment(), 'seconds') - 30; //Better safe than sorry?

        rawData.push({
            routeType: routeType,
            routeId: routeId,
            tripSign: tripSign,
            directionId: directionId,
            alerts: alertsArray,
            preDt: preDt,
            preArr: preArr,
            preETA: preETA
        });
    },

    cleanData: function(data, rawData, updateDomAfter) {
        // Filters out items
        // This simply doesn't run when the param is empty.
        var self = this;
        for (let i = 0; i < this.filterModes.length; i++) {
            var temp = rawData.filter(obj => (obj.routeType === self.filterModes[i]));

            // For some reason a for-each loop won't work.
            for (let x = 0; x < temp.length; x++) {
                this.stationData.push(temp[x]);
            }
        }

        if (this.filterModes.length === 0) {
            this.stationData = rawData;
        }

        // Sorts them according to ETA time
        this.stationData.sort((a,b) => (a.preETA - b.preETA));

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
