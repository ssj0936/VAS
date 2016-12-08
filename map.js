"use strict";
var colorPattern = [50000, 5000, 500, 50];

function MapObject(mapname) {
    this.mapName = mapname;
    this.map = undefined;
    this.layer = undefined;
    this.countryMapping = [];
    this.jsonData = undefined;
    this.currentRegionIso = [];
    this.info = L.control();
    this.legend = L.control({
        position: 'bottomright'
    });
    this.max = 0;
    this.min = 0;
    this.totalCnt = 0;
    this.modelCnt = undefined;
    this.fromFormatStr = undefined;
    this.toFormatStr = undefined;
    this.toFormatStrShow = undefined;
    this.tileIndex = undefined;
    this.tileLayer = undefined;
    this.highlightLayer = undefined;
    this.isEmpty = false;
    
    this.snapshotBtn;
    this.hasSnapshotBtn = true;
    //marker
    this.pruneCluster = new PruneClusterForLeaflet();

    this.mapInit = function (containerID) {
        console.log("init map:" + this.mapName);
        //map
        if (typeof this.map == "undefined") {
            this.map = L.map(containerID, {
                layers: L.tileLayer("https://api.tiles.mapbox.com/v4/mapbox.light/{z}/{x}/{y}.png?access_token=" + token),
                minZoom : 2
            });
            this.setInfo();
            this.setHighlightFeature();
            L.control.scale().addTo(this.map);

            //marker
            this.map.addLayer(this.pruneCluster);
            PruneCluster.Cluster.ENABLE_MARKERS_LIST = true;

            new L.Control.GeoSearch({
                provider: new L.GeoSearch.Provider.Google(),
                showMarker: false,
            }).addTo(this.map, true);
            
            var mapobj = this;
            this.snapshotBtn = L.easyButton('<img src="img/snapshot.png" style="width: 20px;">', function(btn, map){
//                $('#drawMap').remove();
                sessionStorage.patternIndex = firstMap.getColorPattern();
                sessionStorage.colorPattern = JSON.stringify(colorPattern);
                sessionStorage.zoom = mapobj.map.getZoom();
                window.open('popup.html');
//                console.log(firstMap.map.getZoom());
                //alert("QQ");
                //helloPopup.setLatLng(map.getCenter()).openOn(map);
            }).addTo( this.map ); // probably just `map`
        }
    };

    this.setMaxMin = function () {
        this.max = (this.countryMapping.length != 0) ? (this.countryMapping[0].cnt) : 0;
        this.min = (this.countryMapping.length != 0) ? (this.countryMapping[this.countryMapping.length - 1].cnt) : 0;
    };

    this.cleanMap = function () {
        this.removePolygonMap();
        this.removeLegend();
    };

    this.removePolygonMap = function () {
        if (this.map.hasLayer(this.tileLayer)) {
            this.map.removeLayer(this.tileLayer);
            this.tileLayer = null;
            this.tileIndex = null;
            if (this.highlight) {
                if (this.map.hasLayer(this.highlight)) {
                    this.map.removeLayer(this.highlight);
                }
                this.highlight = null;
            }
        }
        setIsClickFromFilterResult(false);
    };

    this.updateMapProperties = function () {
        console.log(this.mapName + " updateMapProperties()");
        var mapObj = this;
        this.totalCnt = 0;
        this.modelCnt = {};
        for (var i = 0; i < this.jsonData.features.length; ++i) {
            var countryID = this.jsonData.features[i].properties.OBJECTID;

            //delete place not owned by any branch
            if (getFunction() == FUNC_GAP) {
                if($.inArray(countryID,allBranchObject) == -1) {
                    this.jsonData.features.splice(i, 1);
                    isMapModified = true;
                    i--;
                    continue;
                }
            }

            var find = this.countryMapping.filter(function (obj) {
                return obj.countryID == countryID
            });
            if (find == false) {
                this.jsonData.features[i].properties.activationCnt = 0;
                this.jsonData.features[i].properties.models = [];
            } else {
                this.jsonData.features[i].properties.activationCnt = find[0].cnt;
                this.jsonData.features[i].properties.models = find[0].models;
                this.totalCnt += find[0].cnt;
                $.each(find[0].models, function (k, e) {
                    if (!mapObj.modelCnt[k]) {
                        mapObj.modelCnt[k] = e;
                    } else {
                        mapObj.modelCnt[k] += e;
                    }
                });
            }
        }
//        check
//        for(var i = 0; i < this.countryMapping.length; ++i){
//            var id = this.countryMapping[i].countryID;
//            var cnt = this.countryMapping[i].cnt;
//            var find = this.jsonData.features.filter(function (obj) {
//                return obj.properties.OBJECTID == id;
//            });
//            
//            if(find == false)
//                console.log('countryID:' + id + '/' + cnt + " not found");
//        }
    };

    this.mapDataLoad = function () {
        console.log(this.mapName + " mapDataLoad()");
        //remove it if it already exist
        this.removePolygonMap();
        //then re-adding

        this.tileIndex = geojsonvt(this.jsonData, tileOptions);
        this.tileLayer = this.getCanvasTile();

        this.tileLayer.addTo(this.map);
        this.tileLayer.setZIndex(10);
    };

    this.getCanvasTile = function () {
        var pad = 0;
        var obj = this;
        return L.canvasTiles().params({
            debug: false,
            padding: 50
        }).drawing(function (canvasOverlay, params) {
            var bounds = params.bounds;
            params.tilePoint.z = params.zoom;

            var ctx = params.canvas.getContext('2d');
            ctx.globalCompositeOperation = 'destination-over';
            ctx.strokeStyle = 'white';
            ctx.lineJoin = "round";

            var tile = obj.tileIndex.getTile(params.tilePoint.z, params.tilePoint.x, params.tilePoint.y);
            if (!tile) {
                //console.log('tile empty');
                return;
            }

            ctx.clearRect(0, 0, params.canvas.width, params.canvas.height);

            var features = tile.features;
//            console.log(allHighlighBranch);

            for (var i = 0; i < features.length; i++) {
                var feature = features[i],
                    type = feature.type;

                //style option
                ctx.fillStyle = colorHexToRGBString(obj.getColor(feature.tags.activationCnt) , 0.5);
                //if gap mode fill gap color
                if (getFunction() == FUNC_GAP) {
                    var fillBranch;
                    $.each(allHighlighBranch,function (branch,object) {
                        if($.inArray(feature.tags.OBJECTID,object) != -1) {
                            fillBranch = branch;
                            return false;
                        }
                    });
//                    console.log(fillBranch);
                    if (allBranchGap && fillBranch && allBranchGap[fillBranch]) {
                        ctx.fillStyle = colorHexToRGBString(obj.getGapColor(allBranchGap[fillBranch].total) , 0.5);
                    } else if (typeof fillbranch == 'undefined') {
                        ctx.fillStyle = colorHexToRGBString(obj.getColor(0) , 0.5);
                    }
                }

//                console.log("allBranchObject:"+allBranchObject);
//                console.log("getFunction():"+getFunction());
                if (allBranchObject.length > 0 && getFunction() != FUNC_GAP) {
                    // if not in gap mode and some branch has been selected, use another stroke
                    if ($.inArray(feature.tags.OBJECTID,allBranchObject) != -1) {
                        ctx.globalCompositeOperation = 'source-over';
                        ctx.strokeStyle = "#66CC00";
                        ctx.lineWidth = 2;
                    } else {
                        ctx.globalCompositeOperation = 'destination-over';
                        ctx.strokeStyle = "white";
                        ctx.lineWidth = 1;
                    }
                }
                ctx.beginPath();

                for (var j = 0; j < feature.geometry.length; j++) {
                    var geom = feature.geometry[j];

                    if (type === 1) {
                        ctx.arc(geom[0] * ratio + pad, geom[1] * ratio + pad, 2, 0, 2 * Math.PI, false);
                        continue;
                    }

                    for (var k = 0; k < geom.length; k++) {
                        var p = geom[k];
                        var extent = 4096;

                        var x = p[0] / extent * 256;
                        var y = p[1] / extent * 256;
                        if (k) ctx.lineTo(x + pad, y + pad);
                        else ctx.moveTo(x + pad, y + pad);
                    }
                }

                if (type === 3 || type === 1) ctx.fill();
                ctx.stroke();
            }
        });
    };

    this.updateLegend = function () {
        console.log(this.mapName + " updateLegend()");
        this.removeLegend();
        this.setLegend();
    };

    this.removeLegend = function () {
        if ($(".legend_" + this.mapName).length != 0) {
            console.log(this.mapName + " removeLegend()");
            this.map.removeControl(this.legend);

            this.legend = null;
            this.legend = L.control({
                position: 'bottomright'
            });
        }
    };

    this.setLegend = function () {
        var leveltype = this.mapName;
        if (observeTarget.length == 0 || this.countryMapping.length == 0) return;
        var obj = this;
        this.legend.onAdd = function (mymap) {
            var patternIndex = obj.getColorPattern();

            var div = L.DomUtil.create('div', 'legend_' + leveltype),
                grades = [0, colorPattern[patternIndex] / 5 * 1, colorPattern[patternIndex] / 5 * 2, colorPattern[patternIndex] / 5 * 3, colorPattern[patternIndex] / 5 * 4, colorPattern[patternIndex]],
                labels = [];

            // loop through our density intervals and generate a label with a colored square for each interval
            if (getFunction() != FUNC_GAP) {
                div.innerHTML += '<div><i level="level0_' + leveltype + '" style="background:' + obj.getColor(0) + '"></i> 0</div> ';
                for (var i = 0; i < grades.length - 1; i++) {
                    div.innerHTML +=
                        '<div><i level="level' + (i + 1) + '_' + leveltype + '" style="background:' + obj.getColor((grades[i] + 1)) + '"></i> ' +
                        numToString(grades[i]) + '&ndash;' + numToString(grades[i + 1]) + '</div>';
                }
                div.innerHTML += '<div><i level="level6_' + leveltype + '" style="background:' + obj.getColor((colorPattern[patternIndex] + 1)) + '"></i> ' + numToString(colorPattern[patternIndex]) + "+" + "</div>";
                return div;
            } else {
                // in gap mode, change legend style
                grades = [-0.4, -0.2, 0, 0.2];
                div.innerHTML += '<div><i level="level0_' + leveltype + '" style="background:' + obj.getGapColor(-99) + '"></i>< -40%</div> ';
                for (var i = 0; i < grades.length - 1; i++) {
                    div.innerHTML +=
                        '<div><i level="level' + (i + 1) + '_' + leveltype + '" style="background:' + obj.getGapColor(grades[i]) + '"></i>' +
                        numToString(grades[i]*100) + '% &ndash; ' + numToString(grades[i + 1]*100) + '%</div>';
                }
                div.innerHTML += '<div><i level="level6_' + leveltype + '" style="background:' + obj.getGapColor(99) + '"></i>>= 20%</div>';
                return div;
            }
        };
        this.legend.addTo(this.map);
        //if not in gap mode, can highlight the label on legend
        if (getFunction() != FUNC_GAP)
            this.legendColorHoverSetting();
    };

    this.removeInfo = function () {
        if ($(".info_" + this.mapName).length != 0) {
            this.map.removeControl(this.info);
            this.info = null;
        }
    }

    this.setInfo = function () {
        var mapObj = this;
        this.info = L.control();
        this.info.onAdd = function (mymap) {
            //remove all listener
            $(this._div).off();

            this._div = L.DomUtil.create('div', 'info_' + mapObj.mapName); // create a div with a class "info"
            this._div.addEventListener('mousedown',
                function (evt) {
                    evt.stopPropagation();
                }
            );
            this._div.addEventListener('mouseover',
                function (evt) {
                    mapObj.map.scrollWheelZoom.disable();
                }
            );
            this._div.addEventListener('mouseout',
                function (evt) {
                    mapObj.map.scrollWheelZoom.enable();
                }
            );
            this.update();
            return this._div;
        };
        // method that we will use to update the control based on feature properties passed
        this.info.update = function (props) {
            var timeStr = (mapObj.fromFormatStr == undefined) ? "" : ('<normalH4>'+ (getFunction() == FUNC_GAP?"GAP":"Activation count") + '</normalH4>' + '<normalH4>' + mapObj.fromFormatStr + " ~ " + mapObj.toFormatStr + '</normalH4>');
            var btnPieChartStr = "<button id='showPieChart_" + mapObj.mapName + "' onclick='showTrend(" + mapObj.mapName + ")'>Show trend</button>";
            var modelStr = "<div id='showModelCount_" + mapObj.mapName + "' class='customScrollBar'><table class = 'model_table'>";
            var totalStr = "<table class = 'model_table'>";
            if (getFunction() == FUNC_GAP) {
                // gap info
                currentPointingBranch = (props == undefined)?(currentPointingBranch):props;
//                console.log(currentPointingBranch);
                this._div.innerHTML = timeStr + this.updateGap(props)/* + ((props)?btnPieChartStr:'')*/;
            } else {
                if (props) {
                    var displayName = props.NAME_2;
                    if (!isInArray(forcingName2List, props.ISO) && (isL1(mapObj) || isInArray(forcingName1List, props.ISO))) {
                        displayName = props.NAME_1;
                    }
                    if (!$.isEmptyObject(props.models)) {
                        var liStr = '';
                        $.each(props.models, function (k, e) {
                            liStr += "<tr><td>" + k + " </td><td class = 'model_table_count'> " + numToString(e) + "</td></tr>";
                        });
                        modelStr += liStr;
                    }
                } else {
                    if (!$.isEmptyObject(mapObj.modelCnt)) {
                        var liStr = '';
                        $.each(mapObj.modelCnt, function (k, e) {
                            liStr += "<tr><td>" + k + " </td><td class = 'model_table_count'> " + numToString(e) + "</td></tr>";
                        });
                        modelStr += liStr;
                    }
                }
                modelStr += "</table></div>";
                totalStr += (props) ? ("<tr><td>" + displayName + " </td><td class = 'model_table_count'> " + numToString(parseInt(props.activationCnt)) + "</td></tr>") : ("<tr><td>" + 'Total' + " </td><td class = 'model_table_count'> " + numToString(parseInt(mapObj.totalCnt)) + "</td></tr>");
                totalStr += "</table>";
                this._div.innerHTML = timeStr + ('<div class="infoDiv">' + modelStr + totalStr + '</div>') + (btnPieChartStr);
            }

            if ($(".legend_" + mapObj.mapName).length > 0) {
                var maxHeight = $("#mapContainer").height() - ($(".legend_" + mapObj.mapName).outerHeight() + 150);
                $('#showModelCount_' + mapObj.mapName).css('max-height', (maxHeight > 0) ? '' + maxHeight + 'px' : '0px');
                //                console.log('maxHeight change:'+maxHeight);
            }
            //no need to display info all the time
            if (!isModeActive(MODE_REGION) && !isModeActive(MODE_COMPARISION) && getFunction() != FUNC_GAP)
                $('#showModelCount_' + mapObj.mapName).hide();

            if (observeTarget.length == 0) {
                //                console.log(observeTarget);
                $('.infoDiv').hide();
            }
        };
        this.info.updateGap = function (branch) {
            var modelStr = "<div id='showModelCount_" + mapObj.mapName + "' class='customScrollBar'><table class = 'model_table'>";
            var totalStr = "<table class = 'model_table'>";
            var infoContent = '';
            if (branch) {
                var displayName = branch;
                if (!$.isEmptyObject(allBranchGap[branch])) {
                    var liStr = '';
                    $.each(allBranchGap[branch], function (k, e) {
                        if (k != 'total') { 
                            liStr += "<tr><td>" + k + " </td><td class = 'model_table_count'> " + numToString(e*100) + "%</td></tr>";
                        }
                    });
                    modelStr += liStr;
                }
            } else {
                if (!$.isEmptyObject(allBranchGap)) {
                    var liStr = '';
                    $.each(allBranchGap, function (k, e) {
                        liStr += "<tr><td>" + k + " </td><td class = 'model_table_count'> " + numToString(e.total*100) + "%</td></tr>";
                    });
                    modelStr += liStr;
                }
            }
            modelStr += "</table></div>";
            
            if(branch){
                totalStr += "<tr>";
                totalStr += "<td>" + displayName + " </td>";
                if(allBranchGap[branch]){
                    totalStr += "<td class = 'model_table_count'> " + numToString(parseInt(allBranchGap[branch].total*100)) + "%</td>";
                }
                totalStr+="</tr>";
            }
            totalStr += "</table>";
            
            if (branch) {
                infoContent = ('<div class="infoDiv">' + modelStr + totalStr + '</div>');
            }
            else {
                infoContent = ('<div class="infoDiv">' + modelStr + '</div>');
            }
            return infoContent;
        }
        this.info.addTo(mapObj.map);
    };

    //set mouse event:move and click feature
    this.setHighlightFeature = function () {
        var mapObj = this;
        var selectDealer;

        this.map.off('mousemove');
        this.map.off('click');
        this.map.off('zoomstart');
        this.map.on('mousemove', function (e) {
            if (dealerTileIndex || scTileIndex) {
                var x = e.latlng.lng;
                var y = e.latlng.lat;
                var tileX = deg2num(y,x,mapObj.map.getZoom())[0];
                var tileY = deg2num(y,x,mapObj.map.getZoom())[1];

                var selectCanvas = canvasArray.filter(function(params) {
                    return params.tilePoint.x == tileX && params.tilePoint.y == tileY
                });

                if (dealerTileIndex)
                    var dealerTile = dealerTileIndex.getTile(mapObj.map.getZoom(), tileX, tileY);
                if (scTileIndex)
                    var scTile = scTileIndex.getTile(mapObj.map.getZoom(), tileX, tileY);


                if((dealerTile || scTile) && selectCanvas[0]) {
                        selectDealer = selectPoint(scTile,selectCanvas[0].canvas,scTileIndex,e);
                        selectDealer = (selectDealer.length > 0)?selectDealer:selectPoint(dealerTile,selectCanvas[0].canvas,dealerTileIndex,e);

                    if (selectDealer.length > 0){
                        $(".leaflet-container").css("cursor", "pointer");
                        isPointPopup = true;
                        return;
                    }
                }
                $(".leaflet-container").css("cursor", "");
            }
            isPointPopup = false;
        });
        this.map.on('click',clickPoint);

        this.map.on('mousemove', function (e) {
            //no need to enable high light feature if observation target is not exist
            if (!isHighlightNeeded()) return;

            var x = e.latlng.lng;
            var y = e.latlng.lat;

            //pre-filter on bound box
            var find = mapObj.jsonData.features.filter(
                function (obj) {
                    return obj.properties.boundBox[0][0] < x && obj.properties.boundBox[1][0] > x && obj.properties.boundBox[0][1] < y && obj.properties.boundBox[1][1] > y
                });
            //find mouse location in which region
            var layerJson = leafletPip.pointInLayer([x, y], find, true);
            var simplifyJson = {
                "type": "Feature",
                "properties": {},
                "geometry": {
                    "type": "MultiPolygon",
                    "coordinates": []
                }
            };

            if (!layerJson) {
                if (preLayerJson != -1) {
                    if (mapObj.highlight) {
                        mapObj.map.removeLayer(mapObj.highlight)
                    }
                    preLayerJson = -1;
                    simplifyJson = null;
                    //clean info

                    mapObj.info.update();

                }
            } else if (layerJson.properties.OBJECTID != preLayerJson) {
                if (mapObj.highlight) {
                    mapObj.map.removeLayer(mapObj.highlight)
                }

                var torance = 1 / (Math.pow(mapObj.map.getZoom(), 3) + 1);
                if (layerJson.geometry.type == 'MultiPolygon') {
                    for (var k = 0; k < layerJson.geometry.coordinates.length; k++) {
                        simplifyJson.geometry.coordinates[k] = [];
                        for (var i = 0; i < layerJson.geometry.coordinates[k].length; i++) {
                            simplifyJson.geometry.coordinates[k].push(simplifyGeometry(layerJson.geometry.coordinates[k][i], torance));
                        }
                    }
                } else {
                    simplifyJson.geometry.type = 'Polygon';
                    for (var k = 0; k < layerJson.geometry.coordinates.length; k++) {
                        simplifyJson.geometry.coordinates.push(simplifyGeometry(layerJson.geometry.coordinates[k], torance));
                    }
                }
                if(allHighlighBranch && getFunction() == FUNC_GAP) {
                    // highlight branch region
                    var branchLayer = mapObj.getHighlightBranchLayer(layerJson);
                    simplifyJson = (branchLayer != null)?branchLayer:simplifyJson;
                }
                //construct highlight layer
                mapObj.highlight = new L.geoJson(simplifyJson, {
                        style: {
                            color: '#AAA',
                            weight: 5,
                            fillOpacity: 0.3,
                            opacity: 1,
                            fillColor: '#AAA'
                        }
                    })
                    .on('click', function (e) {
                        //set popup
                        if (!isPointPopup) {
                            if(getFunction() == FUNC_GAP){
                                if(currentPointingBranch == null) return;
                                
                                var displayName = currentPointingBranch;
                                var functionname = "showGapTrend(" + mapObj.mapName + ",'" + currentPointingBranch + "')";
//                                console.log("showGapTrend(" + mapObj.mapName + ",'" + currentPointingBranch + "')");
                                var buttonHTML = "<button class ='showChart' onclick ="+functionname+">Show trend</button>";
                                var popup = "<div class='pop'>" + displayName + buttonHTML+ "</div>";
//                                console.log(popup);
                                mapObj.map.openPopup(popup, e.latlng);

                                //zoom to location
                                mapObj.zoomToFeature(e);
                            }
                            else{
                                var displayName = (layerJson.properties.NAME_2 == "") ? layerJson.properties.NAME_1 : layerJson.properties.NAME_2;
                                //                        console.log(displayName);
                                if (!isInArray(forcingName2List, layerJson.properties.ISO) && (isL1(mapObj) || isInArray(forcingName1List, layerJson.properties.ISO))) {
                                    layerJson.properties.NAME_1;
                                }

//                                console.log(layerJson);
//                                console.log(e);
                                var displayNum = numToString(parseInt(layerJson.properties.activationCnt));
                                var buttonHTML = "<button class ='showChart' " + "onclick =showRegionChart(" + layerJson.properties.OBJECTID + ",'" + layerJson.properties.ISO + "','" + displayName.replace(/\s+/g, "_") + "','" + displayNum + "'," + mapObj.mapName + ")>Show trend</button>";
                                var popup = "<div class='pop'>" + displayName + ":" + displayNum + ((layerJson.properties.activationCnt == 0) ? "" : buttonHTML) + "</div>";
                                mapObj.map.openPopup(popup, e.latlng);

                                //zoom to location
                                mapObj.zoomToFeature(e);
                            }
                        } else {
                            clickPoint(e);
                        }
                    })
                    .addTo(mapObj.map);
                //$('.leaflet-overlay-pane svg').css( "pointer-events", "none" );
                //update the info
                if (simplifyJson.branch && getFunction() == FUNC_GAP) {
                    mapObj.info.update(simplifyJson.branch);
                } else {
                    mapObj.info.update(layerJson.properties);
                }
                preLayerJson = layerJson.properties.OBJECTID;
                simplifyJson = null;
            }
        });
        this.map.on('zoomstart', function (e) {canvasArray = [];});

        function clickPoint(e) {
            if ((dealerTileIndex || scTileIndex) && selectDealer.length > 0) {
                var popup = "<div class='pop'>Name:<br>" + selectDealer[0].tags.name +"</div>";
                mapObj.map.openPopup(popup, e.latlng);
            }
        }

        function selectPoint(tile,canvas,index,event) {
            if (!tile) return [];
            var select = tile.features.filter(function(dealer) {
                var convertX = dealer.geometry[0][0]/ 4096 * 256;
                var convertY = dealer.geometry[0][1]/ 4096 * 256;
                convertX = convertX + canvas._leaflet_pos.x;
                convertY = convertY + canvas._leaflet_pos.y;
                
                return event.layerPoint.x > (convertX - index.radius) && event.layerPoint.x < (convertX + index.radius)
                        && event.layerPoint.y > (convertY - index.radius) && event.layerPoint.y < (convertY + index.radius);
            });
            return select;
        }
    };

    this.zoomToFeature = function (e) {
        this.map.fitBounds(e.target.getBounds());
    };

    this.legendColorHoverSetting = function () {
        var mapObj = this;
        var leveltype = this.mapName;
        var highlight;
        var simplifyJson = {
            "type": "FeatureCollection",
            "features": []
        };

        $(".legend_" + leveltype + " i").hover(function () {
            //console.log($( this ).attr("level"));
            //console.log($("."+$( this ).attr("level")).length);
            if (highlight) {
                mapObj.map.removeLayer(highlight)
            }
            var level = $(this).attr("level")[5];

            simplifyJson.features = [];

            var find = mapObj.jsonData.features.filter(
                function (obj) {
                    var d = obj.properties.activationCnt;
                    var patternIndex = mapObj.getColorPattern();
                    if (level == 6) {
                        return d > colorPattern[patternIndex];
                    } else if (level == 0) {
                        return d == 0;
                    } else {
                        return d > colorPattern[patternIndex] * (level - 1) / 5 && d <= colorPattern[patternIndex] * level / 5;
                    }
                });
            var torance = 1 / (Math.pow(mapObj.map.getZoom(), 3) + 1);
            for (var i = 0; i < find.length; i++) {
                simplifyJson.features[i] = {
                    "type": "Feature",
                    "geometry": {
                        "type": "MultiPolygon",
                        "coordinates": []
                    }
                };

                if (find[i].geometry.type == 'MultiPolygon') {
                    for (var k = 0; k < find[i].geometry.coordinates.length; k++) {
                        simplifyJson.features[i].geometry.coordinates[k] = [];
                        for (var j = 0; j < find[i].geometry.coordinates[k].length; j++) {
                            simplifyJson.features[i].geometry.coordinates[k].push(simplifyGeometry(find[i].geometry.coordinates[k][j], torance));
                        }
                    }
                } else {
                    simplifyJson.features[i].geometry.type = 'Polygon';
                    for (var k = 0; k < find[i].geometry.coordinates.length; k++) {
                        simplifyJson.features[i].geometry.coordinates.push(simplifyGeometry(find[i].geometry.coordinates[k], torance));
                    }
                }
            }
            highlight = new L.geoJson(simplifyJson, {
                style: {
                    color: '#AAA',
                    weight: 5,
                    fillOpacity: 0.1,
                    opacity: 1
                }
            }).addTo(mapObj.map);
        }, function () {
            if (highlight) {
                mapObj.map.removeLayer(highlight);
                simplifyJson.features = [];
                highlight = null;
            }
        });
    };

    this.getColorPattern = function () {
        var max = parseInt(this.max);
        for (var i = 0; i < colorPattern.length; ++i) {
            if (max > colorPattern[i])
                return i;
        }
        return (colorPattern.length) - 1;
    };

    this.getColor = function (d) {
        var patternIndex = this.getColorPattern();

        return d > colorPattern[patternIndex] ? '#800026' :
            d > colorPattern[patternIndex] / 5 * 4 ? '#BD0026' :
            d > colorPattern[patternIndex] / 5 * 3 ? '#E31A1C' :
            d > colorPattern[patternIndex] / 5 * 2 ? '#FD8D3C' :
            d > colorPattern[patternIndex] / 5 * 1 ? '#FEB24C' :
            d == 0 ? '#FFFFFF' :
            '#FED976';
    };

    this.getGapColor = function (d) {
        return d >= 0.2 ? '#FF0000' :
            d >= 0 ? '#FF8800' :
            d >= -0.2 ? '#77FF00' :
            d >= -0.4 ? '#00FFCC' :
            '#0000FF';
    }

    this.hideLegend = function () {
        if ($(".legend_" + this.mapName).length != 0) {
            //console.log("firstMap hideLegend()");
            $(".legend_firstMap").hide();
        }
    };

    this.showLegend = function () {
        //console.log("firstMap showLegend()");
        $(".legend_" + this.mapName).show();
    };

    this.zoomToSelectedLocation = function () {
        var mapObj = this;
        //zoom in 
        if (observeLoc.length >= 1) {
            var targetIso = observeLoc[0];
            //var datatype =  selected.attr("datatype");

            if (typeof targetIso !== 'undefined') {
                //whole world
                if (targetIso == "world") {
                    this.map.fitWorld({
                        reset: true
                    }).zoomIn();
                }
                //country
                else {
                    var find = world_region.features.filter(function (obj) {
                        return (obj.properties.ISO_A3 == targetIso)
                    });
                    if (find != false) {
                        var n_boundary = boundaryInOneArray(find[0].geometry.coordinates);
                        var leafletBounds = L.latLngBounds(n_boundary);
                        this.map.fitBounds(leafletBounds);
                    }
                }
            }
        }
    };

    this.getHighlightBranchLayer = function (hoverLayer) {
        var mapObj = this;
        var highlightGeojson;
        var branchName;
        var branchObjectID;
        var highlightGeojsonArray;
        $.each(allHighlighBranch,function(branch,array) {
            if($.inArray(hoverLayer.properties.OBJECTID,array) != -1) {
                branchObjectID = array;
                branchName = branch;
                return false;
            }
        });

        if (branchObjectID) {
            highlightGeojsonArray = mapObj.jsonData.features.filter(function(feature) {
                return $.inArray(feature.properties.OBJECTID, branchObjectID) != -1;
            });

            if (highlightGeojsonArray.length > 0) {
                highlightGeojson = {
                    "type" : "FeatureCollection",
                    "features" : []
                }
                $.each(highlightGeojsonArray,function(index,feature) {
                    var torance = 1 / (Math.pow(mapObj.map.getZoom(), 3) + 1);
                    highlightGeojson.features[index] = {
                        "type": "Feature",
                        "properties": {},
                        "geometry": {
                            "type": "MultiPolygon",
                            "coordinates": []
                        }
                    };
                    if (feature.geometry.type == 'MultiPolygon') {
                        for (var k = 0; k < feature.geometry.coordinates.length; k++) {
                            highlightGeojson.features[index].geometry.coordinates[k] = [];
                            for (var i = 0; i < feature.geometry.coordinates[k].length; i++) {
                                highlightGeojson.features[index].geometry.coordinates[k].push(simplifyGeometry(feature.geometry.coordinates[k][i], torance));
                            }
                        }
                    } else {
                        highlightGeojson.features[index].geometry.type = 'Polygon';
                        for (var k = 0; k < feature.geometry.coordinates.length; k++) {
                            highlightGeojson.features[index].geometry.coordinates.push(simplifyGeometry(feature.geometry.coordinates[k], torance));
                        }
                    }
                });
            }
        }
        if (highlightGeojson) {
            highlightGeojson['branch'] = branchName;
        }
        return highlightGeojson;
    };
    
    this.removeSnapshot = function(){
        this.map.removeControl(this.snapshotBtn);
        this.hasSnapshotBtn = false;
    }
    
    this.addSnapshot = function(){
        firstMap.snapshotBtn.addTo(firstMap.map);
        firstMap.hasSnapshotBtn = true;
    }
}

function mapInit() {
    firstMap.mapInit("mapid");
}

function mapComparisionInit() {
    comparisonMap.mapInit("mapidComparison");
}