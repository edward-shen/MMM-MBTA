Module.register("MMM-MBTA", {
    defaults: {
        apikey: "",
        updateInterval: 20, // In seconds
        baseUrl: "https://realtime.mbta.com/developer/api/v2/",
        stations: [ "Northeastern University Station" ],
        doAnimation: true,
        animationSpeed: 1000,
        formatETA: true,
        showMinutesOnly: false,
        showOnly: [ ],
        maxEntries: 8,
        maxTime: 0,
        showArrivalTime: false,
        showETATime: true,
        fade: true,
        fadePoint: 0.25, // Start on 1/4th of the list.
    },
    
    getStyles: function() {
        return ["font-awesome.css"];
    },
    
    getHeader: function() {
        return this.data.header + " " + this.config.stations[0];
    },
    
    getScripts: function () {
        return ["moment.js"];
    },
    
    start: function() {
        // API abuse prevention
        if (this.config.updateInterval < 10) {
            this.config.updateInterval = 10;
        }
        
        this.loaded = false;
        // Dictionary sincerely stolen from https://github.com/mbtaviz/mbtaviz.github.io/
        // and green line dictionary data taken from https://github.com/mbtaviz/green-line-release/
        // TODO: Get from external file
        var stationDict = {"Airport":"place-aport","Aquarium":"place-aqucl","Beachmont":"place-bmmnl","Bowdoin":"place-bomnl","Government Center":"place-gover","Maverick":"place-mvbcl","Orient Heights":"place-orhte","Revere Beach":"place-rbmnl","Suffolk Downs":"place-sdmnl","Wonderland":"place-wondl","Wood Island":"place-wimnl","Back Bay":"place-bbsta","Chinatown":"place-chncl","Community College":"place-ccmnl","Forest Hills":"place-forhl","Green Street":"place-grnst","Haymarket":"place-haecl","Jackson Square":"place-jaksn","Malden Center ":"place-mlmnl","Mass Ave":"place-masta","North Station":"place-north","Oak Grove":"place-ogmnl","Roxbury Crossing":"place-rcmnl","Ruggles":"place-rugg","Stony Brook":"place-sbmnl","Sullivan Square":"place-sull","Tufts Medical Center":"place-tumnl","Wellington ":"place-welln","State Street":"place-state","Alewife":"place-alfcl","Andrew Square":"place-andrw","Ashmont":"place-asmnl","Braintree":"place-brntn","Broadway":"place-brdwy","Central Square":"place-cntsq","Charles MGH":"place-chmnl","Davis Square":"place-davis","Fields Corner":"place-fldcr","Harvard":"place-harsq","JFK/U Mass":"place-jfk","Kendall Square":"place-knncl","North Quincy":"place-nqncy","Park Street":"place-pktrm","Porter Square":"place-portr","Quincy Adams":"place-qamnl","Quincy Center":"place-qnctr","Savin Hill":"place-shmnl","Shawmut":"place-smmnl","South Station":"place-sstat","Wollaston":"place-wlsta","Downtown Crossing":"place-dwnxg","Lechmere Station":"place-lech","Science Park Station":"place-spmnl","North Station":"place-north","Haymarket Station":"place-haecl","Government Center Station":"place-gover","Park Street":"place-pktrm","Boylston Street Station":"place-boyls","Arlington Station":"place-armnl","Copley Station":"place-coecl","Prudential Station":"place-prmnl","Symphony Station":"place-symcl","Northeastern University Station":"place-nuniv","Museum of Fine Arts Station":"place-mfa","Longwood Medical Area Station":"place-lngmd","Brigham Circle Station":"place-brmnl","Fenwood Road Station":"place-fenwd","Mission Park Station":"place-mispk","Riverway Station":"place-rvrwy","Back of the Hill Station":"place-bckhl","Heath Street Station":"place-hsmnl","Hynes Convention Center":"place-hymnl","Kenmore Station":"place-kencl","Fenway Station":"place-fenwy","Longwood Station":"place-longw","Brookline Village Station":"place-bvmnl","Brookline Hills Station":"place-brkhl","Beaconsfield Station":"place-bcnfd","Reservoir Station":"place-rsmnl","Chestnut Hill Station":"place-chhil","Newton Centre Station":"place-newto","Newton Highlands Station":"place-newtn","Eliot Station":"place-eliot","Waban Station":"place-waban","Woodland Station":"place-woodl","Riverside Station":"place-river","Saint Mary Street Station":"place-smary","Hawes Street Station":"place-hwsst","Kent Street Station":"place-kntst","Saint Paul Street":"place-stpul","Coolidge Corner Station":"place-cool" ,"Summit Avenue Station":"place-sumav","Brandon Hall Station":"place-bndhl","Fairbanks Street Station":"place-fbkst","Washington Square Station":"place-bcnwa","Tappan Street Station":"place-tapst","Dean Road Station":"place-denrd","Englewood Avenue Station":"place-engav","Cleveland Circle Station":"place-clmnl","Blandford Street Station":"place-bland","Boston University East Station":"place-buest","Boston University Central Station":"place-bucen","Boston University West Station":"place-buwst","Saint Paul Street":"place-stplb","Pleasant Street Station":"place-plsgr","Babcock Street Station":"place-babck","Packards Corner Station":"place-brico","Harvard Avenue Station":"place-harvd","Griggs Street Station":"place-grigg","Allston Street Station":"place-alsgr","Warren Street Station":"place-wrnst","Washington Street Station":"place-wascm","Sutherland Road Station":"place-sthld","Chiswick Road Station":"place-chswk","Chestnut Hill Avenue Station":"place-chill","South Street Station":"place-sougr","Boston College Station":"place-lake"};
        
        
        // Convert colloquial names to stop ids
        this.stations = [];
        for (let i = 0; i < this.config.stations.length; i++) {
            this.stations[i] = stationDict[this.config.stations[i]];
        }
        
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
        
        
    },
    
    getDom: function() {
        var wrapper = document.createElement("div");
        var returnWrapper = false;
        
        if (!this.loaded) {
            wrapper.innerHTML += "LOADING";
            wrapper.className = "dimmed light small";
            returnWrapper = true;
        }
        
        
        // Check if an API key is in the config
        if (this.config.apikey === "") {
            if (wrapper.innerHTML !== "") {
                wrapper.innerHTML += "<br/>";
            }
            wrapper.innerHTML += "Please set a MBTA api key! This module won't load otherwise!";
            wrapper.className = "dimmed light small";
            return wrapper; // Do not continue updating
        } else if (this.config.apikey === "wX9NwuHnZU2ToO7GmGR9uw") {
            if (wrapper.innerHTML !== "") {
                wrapper.innerHTML += "<br/>";
            }
            wrapper.innerHTML += "Warning! You are using a dev api key!";
            wrapper.className = "dimmed light small";
            returnWrapper = true;
        }
    
        /*-----------------------------------------*/
        
        var table = document.createElement("table");

        
        table.className = "small";
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
            symbolCell.style.cssText = "padding-right: 10px";
            row.appendChild(symbolCell);
            
            // Description
            var descCell = document.createElement("td");
            descCell.innerHTML = this.stationData[i].tripSign;
            descCell.className = "align-left bright";
            row.appendChild(descCell);
    
            // ETA
            if (this.config.showETATime) {
                var preAwayCell = document.createElement("td");
                var preAwayTime = parseInt(this.stationData[i].preAway);
                if (preAwayTime < 10) { // Better to display single digits as "now"
                    preAwayCell.innerHTML = "Now";
                } else {
                    var minutes = Math.floor(preAwayTime / 60);
                    var seconds = preAwayTime % 60;
                    
                    if (this.config.showMinutesOnly) {
                        if (minutes === 0){
                            preAwayCell.innerHTML = "< 1";
                        } else {
                            preAwayCell.innerHTML = minutes;
                        }
                    } else if (this.config.formatETA) { // Parses the time away into MM:SS
                        // Padding so we don't get something like 4:3 minutes...
                        if (seconds < 10) {
                            // lol what even is type casting
                            seconds = "0" + seconds;
                        }
                        
                        preAwayCell.innerHTML = minutes + ":" + seconds;
                    } else {
                        preAwayCell.innerHTML = seconds;
                    }
                }
                row.appendChild(preAwayCell);
            }
            
            if (this.config.showArrivalTime) {
                // Arrival time
                var arrTimeCell = document.createElement("td");
                if (config.timeFormat === 24) {
                    arrTimeCell.innerHTML = moment(parseInt(this.stationData[i].preDt) * 1000).format("H:mm");
                } else {
                    arrTimeCell.innerHTML = moment(parseInt(this.stationData[i].preDt) * 1000).format("h:mm");
                }
                row.appendChild(arrTimeCell);
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
        
        // Don't start the update loop on first init
        if (!this.loaded) {
            this.scheduleUpdate();
        }
        
        if (returnWrapper) {
            var div = document.createElement("div");
            div.appendChild(wrapper);
            div.appendChild(table);
            return div;
        }
        
        return table;
    },
    
    notificationReceived: function(notification, payload, sender) {
        if (notification === "DOM_OBJECTS_CREATED") {
            Log.log(this.name + " received a system notification: " + notification);
            this.fetchData(true);
            Log.log("updating dom");
        }
        
    },
    
    // Note to self: This is called by getDom(), which this eventually calls...
    // Shouldn't be a problem... right? 
    scheduleUpdate: function(amt) {
        var interval;
        if (amt !== undefined) {
            interval = amt;
        } else {
            interval = this.config.updateInterval;
        }
        
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
        for (let stop in this.stations) {
            var url = this.formUrl(this.stations[stop]);
            var MBTARequest = new XMLHttpRequest();
            MBTARequest.open("GET", url, true);
            
            var self = this;
            MBTARequest.onreadystatechange = function() {
                if (this.readyState === 4) {
                    if (this.status === 200) {
                        self.processData(JSON.parse(this.response), updateDomAfter);
                    }
                }
            };
            
            MBTARequest.send();
        }
    },
    
    // Gets API URL based off user settings
    formUrl: function(stopId) {
        var url = this.config.baseUrl;
        
        // query goes here
        url += "predictionsbystop";
        
        url += "?api_key=" + this.config.apikey; 
        url += "&format=json";
        url += "&stop=" + stopId;
        
        return url;
    },
    
    processData: function(data, updateDomAfter) {
        /* Nice little list of everything we have
        Each element in this array is an entry on our displayed table.
        Format should be
        {"routeType": int,
         "dirName": string,
         "tripName": string,
         "tripSign": string,
         "preDt": int,
         "preAway": int}
         */
         
        this.stationData = [ ]; // clear all data.
        
        // Please, if you know how to simplify this and make this readable, I would love you forever.
        var curDir;
        var rawData = [ ];
        for (let mode = 0; mode < data["mode"].length; mode++) {
            curDir = data["mode"][mode];
            var routeType = curDir.route_type;
            
            curDir = curDir["route"][0]["direction"];
            for (let direction = 0; direction < curDir.length; direction++) {
                var dirName = curDir[direction].direction_name;
                
                for (let trip = 0; trip < curDir[direction]["trip"].length; trip++) {
                    var tripName = curDir[direction]["trip"][trip].trip_name,
                        tripSign = curDir[direction]["trip"][trip].trip_headsign,
                        preDt = curDir[direction]["trip"][trip].pre_dt;
                        preAway = curDir[direction]["trip"][trip].pre_away;
                    rawData.push({
                        // Note all values are strings. I'd really like to not worry about
                        // loose js casting.
                        routeType: routeType,
                        dirName: dirName,
                        tripName: tripName,
                        tripSign: tripSign,
                        preDt: preDt,
                        preAway: preAway
                    });
                }
            }
        }
        
        // Filters out items
        // This simply doesn't run when the param is empty.
        var self = this;
        for (let i = 0; i < this.filterModes.length; i++) {
            var temp = rawData.filter(function(obj) {
                return (obj.routeType === self.filterModes[i]);
            });
            
            // For some reason a for-each loop won't work.
            for (let x = 0; x < temp.length; x++) {
                this.stationData.push(temp[x]);
            }
        }
        
        if (this.filterModes.length === 0) {
            this.stationData = rawData;
        }
        
        // Sorts them according to ETA time
        this.stationData.sort(function(a, b) {
            return a.preDt - b.preDt;
        });
        
        // Shortens the array
        if (this.stationData.length > this.config.maxEntries) {
            this.stationData.length = this.config.maxEntries;
        }
        
        this.loaded = true;
        
        Log.log("Finsihed processing data");
        
        if (updateDomAfter) {
            this.updateDom();
        }
    },
});
