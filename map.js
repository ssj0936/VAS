"use strict";
var colorPattern = [50000, 5000, 500, 50];
var parallelGrade = [];
var gapGrade = [-0.4, -0.2, 0, 0.2];

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
    this.hasSnapshotBtn = false;
    //marker
    this.pruneCluster = new PruneClusterForLeaflet();

    this.mapInit = function (containerID) {
        console.log("init map:" + this.mapName);
        //map
        if (typeof this.map == "undefined") {
            this.map = L.map(containerID, {
                layers: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"),
                minZoom: 2
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
            this.snapshotBtn = L.easyButton('<img src="img/snapshot.png" style="width: 20px;">', function (btn, map) {
                //                $('#drawMap').remove();
                sessionStorage.patternIndex = firstMap.getColorPattern();
                sessionStorage.colorPattern = JSON.stringify(colorPattern);
                sessionStorage.zoom = mapobj.map.getZoom();
                window.open('popup.html');
                //                console.log(firstMap.map.getZoom());
                //alert("QQ");
                //helloPopup.setLatLng(map.getCenter()).openOn(map);
            }); // probably just `map`
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
                if ($.inArray(countryID, allBranchObject) == -1) {
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
    };

    this.updateParallelMapProperties = function () {
        for (var i = 0; i < this.jsonData.features.length; ++i) {
            var iso = this.jsonData.features[i].properties.ISO_A3;

            var data = this.countryMapping[iso];

            if (!data) {
                this.jsonData.features[i].properties.importRatio = '0%';
                this.jsonData.features[i].properties.exportRatio = '0%';
                this.jsonData.features[i].properties.models = [];
            } else {
                this.jsonData.features[i].properties.importRatio = data.total.importRatio;
                this.jsonData.features[i].properties.exportRatio = data.total.exportRatio;
                this.jsonData.features[i].properties.models = data.models;
            }
        }
        this.setParallelMaxMin();
    };

    this.setParallelMaxMin = function () {
        var parallelMode = isModeActive(MODE_PARALLEL_IMPORT) ? 'importRatio' : 'exportRatio';
        //        console.log(this.countryMapping);
        var allValue = [];
        for (var i in this.countryMapping) {
            allValue.push(parseFloat(((this.countryMapping)[i].total)[parallelMode]));
        }
        //sort from small to big
        allValue.sort(function (a, b) {
            return a - b
        });
        //update parallelGrade
        var levelSpacing = allValue.length / 4;
        parallelGrade = [allValue[0]
                            , allValue[parseInt(levelSpacing)]
                            , allValue[parseInt(levelSpacing * 2)]
                            , allValue[parseInt(levelSpacing * 3)]
                            , allValue[allValue.length - 1]];

        //uniqufy the array of grade
        //preventing two same level
        parallelGrade = parallelGrade.filter(function (item, index, inputArray) {
            return inputArray.indexOf(item) == index;
        });
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
            for (var i = 0; i < features.length; i++) {
                var feature = features[i],
                    type = feature.type;

                //fillStyle setting
                switch (getFunction()) {
                case FUNC_GAP:
                    var fillBranch;
                    $.each(allHighlighBranch, function (branch, object) {
                        if ($.inArray(feature.tags.OBJECTID, object) != -1) {
                            fillBranch = branch;
                            return false;
                        }
                    });

                    if (allBranchGap && fillBranch && allBranchGap[fillBranch]) {
                        ctx.fillStyle = colorHexToRGBString(obj.getGapColor(allBranchGap[fillBranch].total), 0.5);
                    } else if (typeof fillbranch == 'undefined') {
                        ctx.fillStyle = colorHexToRGBString(obj.getColor(0), 0.5);
                    }
                    break;

                case FUNC_DISTBRANCH:
                    // if not in gap mode and some branch has been selected, use another stroke
                    if ($.inArray(feature.tags.OBJECTID, allBranchObject) != -1) {
                        ctx.globalCompositeOperation = 'source-over';
                        ctx.strokeStyle = "#66CC00";
                        ctx.lineWidth = 2;
                    } else {
                        ctx.globalCompositeOperation = 'destination-over';
                        ctx.strokeStyle = "white";
                        ctx.lineWidth = 1;
                    }
                    ctx.fillStyle = colorHexToRGBString(obj.getColor(feature.tags.activationCnt), 0.5);
                    break;

                case FUNC_PARALLEL:
                    var targetRatio = isModeActive(MODE_PARALLEL_IMPORT) ? feature.tags.importRatio : feature.tags.exportRatio;
                    ctx.strokeStyle = "white";
                    ctx.lineWidth = 2;
                    ctx.fillStyle = colorHexToRGBString(obj.getParallelColor(parseFloat(targetRatio)), 0.5);
                    break;

                default:
                    ctx.fillStyle = colorHexToRGBString(obj.getColor(feature.tags.activationCnt), 0.5);
                    break;
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
            var div = L.DomUtil.create('div', 'legend_' + leveltype);

            switch (getFunction()) {
            case FUNC_GAP:
                var grades = gapGrade;
                div.innerHTML += '<div><i level="level0_' + leveltype + '" style="background:' + obj.getGapColor(-99) + '"></i>< -40%</div> ';
                for (var i = 0; i < grades.length - 1; i++) {
                    div.innerHTML +=
                        '<div><i level="level' + (i + 1) + '_' + leveltype + '" style="background:' + obj.getGapColor(grades[i]) + '"></i>' +
                        numToString(grades[i] * 100) + '% &ndash; ' + numToString(grades[i + 1] * 100) + '%</div>';
                }
                div.innerHTML += '<div><i level="level6_' + leveltype + '" style="background:' + obj.getGapColor(99) + '"></i>>= 20%</div>';
                break;

            case FUNC_PARALLEL:
                var grades = parallelGrade;

                //                div.innerHTML += '<div><i level="level0_' + leveltype + '" style="background:' + obj.getParallelColor((grades[0])-1) + '"></i> ' + numToString(grades[0]) + ' %</div> ';
                //                console.log(grades);
                for (var i = 0; i < grades.length - 1; i++) {
                    //                    console.log(grades[i]);
                    div.innerHTML +=
                        '<div><i level="level' + (i + 1) + '_' + leveltype + '" style="background:' + obj.getParallelColor((grades[i])) + '"></i> ' +
                        numToString(grades[i]) + ' % &ndash;' + numToString(grades[i + 1]) + ' % </div>';
                }
                //                div.innerHTML += '<div><i level="level6_' + leveltype + '" style="background:' + obj.getParallelColor((grades[grades.length - 1] + 1)) + '"></i> ' + numToString(grades[grades.length - 1]) + " %" + "</div>";
                break;

            default:
                var patternIndex = obj.getColorPattern();
                var grades = [0, colorPattern[patternIndex] / 5 * 1, colorPattern[patternIndex] / 5 * 2, colorPattern[patternIndex] / 5 * 3, colorPattern[patternIndex] / 5 * 4, colorPattern[patternIndex]];

                div.innerHTML += '<div><i level="level0_' + leveltype + '" style="background:' + obj.getColor(0) + '"></i> 0</div> ';
                for (var i = 0; i < grades.length - 1; i++) {
                    div.innerHTML +=
                        '<div><i level="level' + (i + 1) + '_' + leveltype + '" style="background:' + obj.getColor((grades[i] + 1)) + '"></i> ' +
                        numToString(grades[i]) + '&ndash;' + numToString(grades[i + 1]) + '</div>';
                }
                div.innerHTML += '<div><i level="level6_' + leveltype + '" style="background:' + obj.getColor((colorPattern[patternIndex] + 1)) + '"></i> ' + numToString(colorPattern[patternIndex]) + "+" + "</div>";
                break;
            }
            return div;
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
            switch (getFunction()) {
            case FUNC_GAP:
                var timeStr = (mapObj.fromFormatStr == undefined) ? "" : ('<normalH4>GAP</normalH4>' + '<normalH4>' + mapObj.fromFormatStr + " ~ " + mapObj.toFormatStr + '</normalH4>');
                currentPointingBranch = (props == undefined) ? (currentPointingBranch) : props;

                var modelStr = "<div id='showModelCount_" + mapObj.mapName + "' class='customScrollBar'><table class = 'model_table'>",
                    totalStr = "<table class = 'model_table'>",
                    infoContent = '',
                    branch = props;

                if (branch) {
                    var displayName = branch;

                    //model display
                    if (!$.isEmptyObject(allBranchGap[branch])) {
                        var liStr = '';
                        $.each(allBranchGap[branch], function (k, e) {
                            if (k != 'total') {
                                liStr += "<tr><td>" + k + " </td><td class = 'model_table_count'> " + numToString(e * 100) + "%</td></tr>";
                            }
                        });
                        modelStr += liStr;
                    }

                    //total display
                    totalStr += "<tr>";
                    totalStr += "<td>" + displayName + " </td>";
                    if (allBranchGap[branch]) {
                        totalStr += "<td class = 'model_table_count'> " + numToString(parseInt(allBranchGap[branch].total * 100)) + "%</td>";
                    }
                    totalStr += "</tr>";

                } else {
                    if (!$.isEmptyObject(allBranchGap)) {
                        var liStr = '';
                        $.each(allBranchGap, function (k, e) {
                            liStr += "<tr><td>" + k + " </td><td class = 'model_table_count'> " + numToString(e.total * 100) + "%</td></tr>";
                        });
                        modelStr += liStr;
                    }
                }
                modelStr += "</table></div>";
                totalStr += "</table>";

                if (branch) {
                    infoContent = ('<div class="infoDiv">' + modelStr + totalStr + '</div>');
                } else {
                    infoContent = ('<div class="infoDiv">' + modelStr + '</div>');
                }
                this._div.innerHTML = timeStr + infoContent;

                break;

            case FUNC_PARALLEL:
                //                    console.log("isModeActive(MODE_PARALLEL_IMPORT):"+isModeActive(MODE_PARALLEL_IMPORT));
                var targetRatio = isModeActive(MODE_PARALLEL_IMPORT) ? 'importRatio' : 'exportRatio';
                var timeStr = (mapObj.fromFormatStr == undefined) ? "" : ('<normalH4>' + (isModeActive(MODE_PARALLEL_IMPORT) ? 'Import' : 'Export') + '</normalH4>');
                var modelStr = "<div id='showModelCount_" + mapObj.mapName + "' class='customScrollBar'><table class = 'model_table'>";
                var totalStr = "<table class = 'model_table'>";

                //pointing on country region
                if (props) {
                    //                        console.log(props);
                    //                        var displayName = props.ISO_A3;
                    var displayName = props.NAME;

                    if (!$.isEmptyObject(props.models)) {
                        var countryModelData = [];
                        $.each(props.models, function (k, e) {
                            var model = k;
                            countryModelData.push({
                                model: model,
                                ratio: e[targetRatio]
                            })
                        });
                        countryModelData.sort(function (a, b) {
                            return parseFloat(b.ratio) - parseFloat(a.ratio)
                        });

                        var liStr = '';

                        for (var i in countryModelData) {
                            liStr += "<tr><td>" + countryModelData[i].model + " </td><td class = 'model_table_count'> " + countryModelData[i].ratio + "</td></tr>";
                        }
                        modelStr += liStr;
                    }
                    modelStr += "</table></div>";
                    totalStr += ("<tr><td>" + displayName + " </td><td class = 'model_table_count'> " + props[targetRatio] + "</td></tr>");
                    totalStr += "</table>";
                    this._div.innerHTML = timeStr + ('<div class="infoDiv">' + modelStr + totalStr + '</div>');
                }
                //pointing on no where
                else {
                    var liStr = '';
                    var allCountryData = [];
                    for (var i in mapObj.jsonData.features) {
                        var data = mapObj.jsonData.features[i].properties;

                        var iso = data.NAME;
                        allCountryData.push({
                            iso: iso,
                            ratio: data[targetRatio]
                        })
                    }
                    allCountryData.sort(function (a, b) {
                        return parseFloat(b.ratio) - parseFloat(a.ratio)
                    });
                    for (var i in allCountryData) {
                        liStr += "<tr><td>" + allCountryData[i].iso + " </td><td class = 'model_table_count'> " + allCountryData[i].ratio + "</td></tr>";
                    }

                    //                        console.log(liStr);
                    modelStr += liStr;

                    this._div.innerHTML = timeStr + ('<div class="infoDiv">' + modelStr + '</div>');
                }



                break;

            default:
                var timeStr = (mapObj.fromFormatStr == undefined) ? "" : ('<normalH4>Activation count</normalH4>' + '<normalH4>' + mapObj.fromFormatStr + " ~ " + mapObj.toFormatStr + '</normalH4>');
                var btnShowTrend = "<button id='showPieChart_" + mapObj.mapName + "' onclick='showTrend(" + mapObj.mapName + ")'>Show trend</button>";
                var modelStr = "<div id='showModelCount_" + mapObj.mapName + "' class='customScrollBar'><table class = 'model_table'>";
                var totalStr = "<table class = 'model_table'>";

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
                this._div.innerHTML = timeStr + ('<div class="infoDiv">' + modelStr + totalStr + '</div>') + (btnShowTrend);

                break;
            }

            //set max-height
            if ($(".legend_" + mapObj.mapName).length > 0) {
                var maxHeight = $("#mapContainer").height() - ($(".legend_" + mapObj.mapName).outerHeight() + 150);
                $('#showModelCount_' + mapObj.mapName).css('max-height', (maxHeight > 0) ? '' + maxHeight + 'px' : '0px');
            }
            //no need to display info all the time
            if (!(isModeActive(MODE_REGION) || isModeActive(MODE_COMPARISION) || getFunction() == FUNC_GAP || getFunction() == FUNC_PARALLEL))
                $('#showModelCount_' + mapObj.mapName).hide();

            if (observeTarget.length == 0) {
                $('.infoDiv').hide();
            }
        };

        this.info.addTo(mapObj.map);
    };

    //set mouse event:move and click feature
    this.setHighlightFeature = function () {
        var mapObj = this;
        var selectDealer;

        this.map.off('mousemove');
        this.map.off('click');
        this.map.off('zoomstart');

        //      [20161222 ndealer and service function is disable for now]
        //        this.map.on('mousemove', function (e) {
        //            if (dealerTileIndex || scTileIndex) {
        //                var x = e.latlng.lng;
        //                var y = e.latlng.lat;
        //                var tileX = deg2num(y,x,mapObj.map.getZoom())[0];
        //                var tileY = deg2num(y,x,mapObj.map.getZoom())[1];
        //
        //                var selectCanvas = canvasArray.filter(function(params) {
        //                    return params.tilePoint.x == tileX && params.tilePoint.y == tileY
        //                });
        //
        //                if (dealerTileIndex)
        //                    var dealerTile = dealerTileIndex.getTile(mapObj.map.getZoom(), tileX, tileY);
        //                if (scTileIndex)
        //                    var scTile = scTileIndex.getTile(mapObj.map.getZoom(), tileX, tileY);
        //
        //
        //                if((dealerTile || scTile) && selectCanvas[0]) {
        //                        selectDealer = selectPoint(scTile,selectCanvas[0].canvas,scTileIndex,e);
        //                        selectDealer = (selectDealer.length > 0)?selectDealer:selectPoint(dealerTile,selectCanvas[0].canvas,dealerTileIndex,e);
        //
        //                    if (selectDealer.length > 0){
        //                        $(".leaflet-container").css("cursor", "pointer");
        //                        isPointPopup = true;
        //                        return;
        //                    }
        //                }
        //                $(".leaflet-container").css("cursor", "");
        //            }
        //            isPointPopup = false;
        //        });
        this.map.on('click', clickPoint);

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
                switch (getFunction()) {
                case FUNC_PARALLEL:
                    if (previousISO != 'nan') {
                        previousISO = 'nan';
                    }
                    break;
                default:
                    if (previousMapID != -1) {
                        previousMapID = -1;
                    }
                    break;
                }
                if (mapObj.map.hasLayer(mapObj.highlight)) {
                    mapObj.map.removeLayer(mapObj.highlight)
                    simplifyJson = null;
                    //clean info
                    mapObj.info.update();
                }
            } else {

                if (getFunction() != FUNC_ACTIVATION && getFunction() != FUNC_GAP && getFunction() != FUNC_DISTBRANCH && getFunction() != FUNC_PARALLEL && getFunction() != FUNC_QC) return;

                if (!(getFunction() == FUNC_PARALLEL && layerJson.properties.ISO_A3 != previousISO) && !(getFunction() != FUNC_PARALLEL && layerJson.properties.OBJECTID != previousMapID)) return;

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
                if (allHighlighBranch && getFunction() == FUNC_GAP) {
                    // highlight branch region
                    var branchLayer = mapObj.getHighlightBranchLayer(layerJson);
                    simplifyJson = (branchLayer != null) ? branchLayer : simplifyJson;
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
                        //                        if (!isPointPopup) {
                        switch (getFunction()) {
                        case FUNC_GAP:
                            if (currentPointingBranch == null) return;

                            var displayName = currentPointingBranch;
                            var functionname = "showGapTrend(" + mapObj.mapName + ",'" + currentPointingBranch + "')";
                            var buttonHTML = "<button class ='showChart' onclick =" + functionname + ">Show trend</button>";
                            var popup = "<div class='pop'>" + displayName + buttonHTML + "</div>";

                            mapObj.map.openPopup(popup, e.latlng);

                            //zoom to location
                            mapObj.zoomToFeature(e);
                            break;

                        case FUNC_PARALLEL:
                            //                                    console.log(layerJson.properties);
                            var iso = layerJson.properties.ISO_A3;
                            var displayName = layerJson.properties.NAME;

                            var targetRatio = isModeActive(MODE_PARALLEL_IMPORT) ? 'importRatio' : 'exportRatio';
                            var targetRatioText = isModeActive(MODE_PARALLEL_IMPORT) ? 'Import rate of ' : 'Export rate of ';

                            var displayNum = layerJson.properties[targetRatio];
                            var buttonHTML = "<button class ='showChart' " + "onclick =trendParallel.showChart('" + iso + "','" + displayName + "')>Show trend</button>";
                            var popup = "<div class='pop'>" + targetRatioText + displayName + " : " + displayNum + ((layerJson.properties.activationCnt == 0) ? "" : buttonHTML) + "</div>";
                            mapObj.map.openPopup(popup, e.latlng);
                            mapObj.zoomToFeature(e);

                            break;

                        case FUNC_QC:
                            var displayName = (layerJson.properties.NAME_2 == "") ? layerJson.properties.NAME_1 : layerJson.properties.NAME_2;
                            if (!isInArray(forcingName2List, layerJson.properties.ISO) && (isL1(mapObj) || isInArray(forcingName1List, layerJson.properties.ISO))) {
                                displayName = layerJson.properties.NAME_1;
                            }
                            var displayNum = numToString(parseInt(layerJson.properties.activationCnt));
                            var buttonHTML = "<button class ='showChart' " + "onclick =trendQC.showChart(" + layerJson.properties.OBJECTID + ",'" + layerJson.properties.ISO + "','" + displayName.replace(/\s+/g, "_") + "','" + displayNum + "'," + mapObj.mapName + ")>Show trend</button>";
                            var popup = "<div class='pop'>" + displayName + ":" + displayNum + ((layerJson.properties.activationCnt == 0) ? "" : buttonHTML) + "</div>";
                            mapObj.map.openPopup(popup, e.latlng);

                            //zoom to location
                            mapObj.zoomToFeature(e);
                            break;

                        default:
                            var displayName = (layerJson.properties.NAME_2 == "") ? layerJson.properties.NAME_1 : layerJson.properties.NAME_2;
                            if (!isInArray(forcingName2List, layerJson.properties.ISO) && (isL1(mapObj) || isInArray(forcingName1List, layerJson.properties.ISO))) {
                                displayName = layerJson.properties.NAME_1;
                            }
                            var displayNum = numToString(parseInt(layerJson.properties.activationCnt));
                            var buttonHTML = "<button class ='showChart' " + "onclick =showRegionChart(" + layerJson.properties.OBJECTID + ",'" + layerJson.properties.ISO + "','" + displayName.replace(/\s+/g, "_") + "','" + displayNum + "'," + mapObj.mapName + ")>Show trend</button>";
                            var popup = "<div class='pop'>" + displayName + ":" + displayNum + ((layerJson.properties.activationCnt == 0) ? "" : buttonHTML) + "</div>";
                            mapObj.map.openPopup(popup, e.latlng);

                            //zoom to location
                            mapObj.zoomToFeature(e);
                            break;
                        }

                        //                        } else {
                        //                            clickPoint(e);
                        //                        }
                    })
                    .addTo(mapObj.map);
                //$('.leaflet-overlay-pane svg').css( "pointer-events", "none" );
                //update the info
                if (simplifyJson.branch && getFunction() == FUNC_GAP) {
                    mapObj.info.update(simplifyJson.branch);
                } else {
                    mapObj.info.update(layerJson.properties);
                }
                previousMapID = layerJson.properties.OBJECTID;
                previousISO = layerJson.properties.ISO_A3;
                simplifyJson = null;
            }
        });
        this.map.on('zoomstart', function (e) {
            canvasArray = [];
        });

        //        function clickPoint(e) {
        //            if ((dealerTileIndex || scTileIndex) && selectDealer.length > 0) {
        //                var popup = "<div class='pop'>Name:<br>" + selectDealer[0].tags.name +"</div>";
        //                mapObj.map.openPopup(popup, e.latlng);
        //            }
        //        }

        function selectPoint(tile, canvas, index, event) {
            if (!tile) return [];
            var select = tile.features.filter(function (dealer) {
                var convertX = dealer.geometry[0][0] / 4096 * 256;
                var convertY = dealer.geometry[0][1] / 4096 * 256;
                convertX = convertX + canvas._leaflet_pos.x;
                convertY = convertY + canvas._leaflet_pos.y;

                return event.layerPoint.x > (convertX - index.radius) && event.layerPoint.x < (convertX + index.radius) && event.layerPoint.y > (convertY - index.radius) && event.layerPoint.y < (convertY + index.radius);
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

    this.getParallelColor = function (d) {
        return (d <= parallelGrade[4] && d >= parallelGrade[3]) ? '#FF8800' :
            (d <= parallelGrade[3] && d >= parallelGrade[2]) ? '#77FF00' :
            (d <= parallelGrade[2] && d >= parallelGrade[1]) ? '#00FFCC' :
            '#0000FF';
    }

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
    };

    this.zoomFitTheWorld = function () {
        this.map.fitWorld({
            reset: true
        }).zoomIn();
    }

    this.getHighlightBranchLayer = function (hoverLayer) {
        var mapObj = this;
        var highlightGeojson;
        var branchName;
        var branchObjectID;
        var highlightGeojsonArray;
        $.each(allHighlighBranch, function (branch, array) {
            if ($.inArray(hoverLayer.properties.OBJECTID, array) != -1) {
                branchObjectID = array;
                branchName = branch;
                return false;
            }
        });

        if (branchObjectID) {
            highlightGeojsonArray = mapObj.jsonData.features.filter(function (feature) {
                return $.inArray(feature.properties.OBJECTID, branchObjectID) != -1;
            });

            if (highlightGeojsonArray.length > 0) {
                highlightGeojson = {
                    "type": "FeatureCollection",
                    "features": []
                }
                $.each(highlightGeojsonArray, function (index, feature) {
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

    this.removeSnapshot = function () {
        this.map.removeControl(this.snapshotBtn);
        this.hasSnapshotBtn = false;
    }

    this.addSnapshot = function () {
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