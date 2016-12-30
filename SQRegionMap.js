let SQRegionIndex;
let SQRegionTileLayer;
let totalRecord;


function removeSQRegion() {
    if (SQRegionTileLayer) {
        firstMap.map.removeLayer(SQRegionTileLayer);
    }
    if (firstMap.highlight) {
        firstMap.map.removeLayer(firstMap.highlight);
    }
    SQRegionIndex = null;
    SQRegionTileLayer = null;
    totalRecord = null;
    firstMap.removeLegend();
    firstMap.removeInfo();
    unsetHighlightFeature();
}

function setSQRegion(data) {
    if (SQRegionTileLayer) {
        firstMap.map.removeLayer(SQRegionTileLayer);
    }

    if (data.length == 0) {
        showToast("Empty Data In This Date Set");
        return;
    }

    totalRecord = data.total;
    initCFRCategory(data.category_list);
    updateMapProperties(data);
    SQRegionIndex = geojsonvt(firstMap.jsonData, tileOptions);
    SQRegionTileLayer = getSQRegionCanvas();
    SQRegionTileLayer.addTo(firstMap.map);
    SQRegionTileLayer.setZIndex(10);
    setHighlightFeature();
    setSQLegend(currentCategory);
    setSQInfo();

}

function getSQRegionCanvas() {
    let pad = 0;
    let obj = firstMap;
    return L.canvasTiles().params({
        debug: false,
        padding: 50
    }).drawing(function (canvasOverlay, params) {
        let bounds = params.bounds;
        params.tilePoint.z = params.zoom;

        let ctx = params.canvas.getContext('2d');
        ctx.globalCompositeOperation = 'destination-over';
        ctx.strokeStyle = 'white';
        ctx.lineJoin = "round";

        let tile = SQRegionIndex.getTile(params.tilePoint.z, params.tilePoint.x, params.tilePoint.y);
        if (!tile) {
            return;
        }

        ctx.clearRect(0, 0, params.canvas.width, params.canvas.height);

        let features = tile.features;

        for (let i = 0; i < features.length; i++) {
            let feature = features[i],
                type = feature.type;


            if (currentCategory == 'ALL')
                ctx.fillStyle = colorHexToRGBString(getColor(feature.tags.totalCFR) , 0.5);
            else 
                ctx.fillStyle = colorHexToRGBString(getColor((feature.tags.category[currentCategory])?feature.tags.category[currentCategory]:0) , 0.5);
            ctx.globalCompositeOperation = 'destination-over';
            ctx.strokeStyle = "white";
            ctx.lineWidth = 1;

            ctx.beginPath();

            for (let j = 0; j < feature.geometry.length; j++) {
                let geom = feature.geometry[j];

                for (let k = 0; k < geom.length; k++) {
                    let p = geom[k];
                    let extent = 4096;

                    let x = p[0] / extent * 256;
                    let y = p[1] / extent * 256;
                    if (k) ctx.lineTo(x + pad, y + pad);
                    else ctx.moveTo(x + pad, y + pad);
                }
            }

            ctx.fill();
            ctx.stroke();
        }
    });
}

function updateMapProperties(data) {
    let mapObj = firstMap;
    for (let i = 0; i < mapObj.jsonData.features.length; ++i) {
        if(data[mapObj.jsonData.features[i].properties.OBJECTID] != undefined) {
            let l2QcData = data[mapObj.jsonData.features[i].properties.OBJECTID];
            mapObj.jsonData.features[i].properties.totalCFR = l2QcData.totalCFR;
            mapObj.jsonData.features[i].properties.category = l2QcData.category;
        }
    }
}

function setSQLegend(category) {
    let obj = firstMap;
    let leveltype = firstMap.mapName;
    obj.removeLegend();
    if (observeTarget.length == 0) return;

    firstMap.legend.onAdd = function (mymap) {

        let div = L.DomUtil.create('div', 'legend_' + leveltype),
            grades = [0, totalRecord.quartile[category][0], totalRecord.quartile[category][1], totalRecord.quartile[category][2], totalRecord.quartile[category][3]];

        // loop through our density intervals and generate a label with a colored square for each interval
        div.innerHTML += '<div><i level="level0_' + leveltype + '" style="background:' + getColor(0) + '"></i> 0</div> ';
        for (let i = 0; i < grades.length - 1; i++) {
            div.innerHTML +=
                '<div><i level="level' + (i + 1) + '_' + leveltype + '" style="background:' + getColor((grades[i]+0.0000000001)) + '"></i> ' +
                numToString(grades[i].toFixed(1)) + '&ndash;' + numToString(grades[i + 1].toFixed(1)) + '</div>';
        }
        div.innerHTML += '<div><i level="level6_' + leveltype + '" style="background:' + getColor(grades[grades.length - 1]) + '"></i> ' + numToString(grades[grades.length - 1].toFixed(1)) + "+" + "</div>";
        return div;
    };
    firstMap.legend.addTo(firstMap.map);
}

function setSQInfo() {
    let mapObj = firstMap;
    mapObj.removeInfo();
    mapObj.info = L.control();
    mapObj.info.onAdd = function (mymap) {
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
    mapObj.info.update = function (props) {
        let timeStr = (mapObj.fromFormatStr == undefined) ? "" : ('<normalH4>'+ "CFR" + '</normalH4>' + '<normalH4>' + mapObj.fromFormatStr + " ~ " + mapObj.toFormatStr + '</normalH4>');
        let btnPieChartStr = "<button id='showPieChart_" + mapObj.mapName + "' onclick='showTrend(" + mapObj.mapName + ")'>Show trend</button>";
        let modelStr = "<div id='showModelCount_" + mapObj.mapName + "' class='customScrollBar'><table class = 'model_table'>";
        let totalStr = "<table class = 'model_table'>";
        let liStr = '';
        let sortArray = [];

        if (props) {
            var displayName = props.NAME_2;
            if (!isInArray(forcingName2List, props.ISO) && (isL1(mapObj) || isInArray(forcingName1List, props.ISO))) {
                displayName = props.NAME_1;
            }
            if (!$.isEmptyObject(props.category)) {
                if (currentCategory =='ALL') {
                    $.each(props.category, function (k, e) {
                        sortArray.push([k,e]);
                    });
                } else {
                    if (props.category[currentCategory])
                        sortArray.push([currentCategory,props.category[currentCategory]]);
                }
            }
        } else {
            if (!$.isEmptyObject(totalRecord.category)) {
                if (currentCategory =='ALL') {
                    $.each(totalRecord.category, function (k, e) {
                        sortArray.push([k,e]);
                    });
                } else {
                    if (totalRecord.category[currentCategory])
                        sortArray.push([currentCategory,totalRecord.category[currentCategory]]);
                }
            }
        }

        //select top 5
        sortArray.sort((a, b) => b[1] - a[1]);
        for (let i = 0;i < (sortArray.length>5?5:sortArray.length); i++) {
            liStr += "<tr><td>" + sortArray[i][0] + " </td><td class = 'model_table_count'> " + numToString(sortArray[i][1].toFixed(2)) + "%</td></tr>";
        };
        modelStr += liStr;
        modelStr += "</table></div>";
        if (currentCategory == 'ALL')
            totalStr += (props) ? ("<tr><td>" + displayName + " </td><td class = 'model_table_count'> " + ((props.totalCFR)?numToString(props.totalCFR.toFixed(2)):0) + "%</td></tr>") : ("<tr><td>" + 'Total' + " </td><td class = 'model_table_count'> " + numToString(totalRecord.totalCFR.toFixed(2)) + "%</td></tr>");
        totalStr += "</table>";
        this._div.innerHTML = timeStr + ('<div class="infoDiv">' + modelStr + totalStr + '</div>') + (btnPieChartStr);


        if ($(".legend_" + mapObj.mapName).length > 0) {
            let maxHeight = $("#mapContainer").height() - ($(".legend_" + mapObj.mapName).outerHeight() + 150);
            $('#showModelCount_' + mapObj.mapName).css('max-height', (maxHeight > 0) ? '' + maxHeight + 'px' : '0px');
        }


        if (observeTarget.length == 0) {
            $('.infoDiv').hide();
        }
    };
    firstMap.info.addTo(mapObj.map);
}

function setHighlightFeature() {
    var mapObj = firstMap;

    mapObj.map.off('mousemove',highlightFunc);
    mapObj.map.on('mousemove', highlightFunc);
};

function unsetHighlightFeature() {
    var mapObj = firstMap;

    mapObj.map.off('mousemove',highlightFunc);
}

function getColor(d) {
    if (d) {
        return d >= totalRecord.quartile[currentCategory][3] ? '#800026' :
            d > totalRecord.quartile[currentCategory][3] ? '#BD0026' :
            d > totalRecord.quartile[currentCategory][2] ? '#E31A1C' :
            d > totalRecord.quartile[currentCategory][1] ? '#FD8D3C' :
            d > totalRecord.quartile[currentCategory][0] ? '#FEB24C' :
            d == 0 ? '#FFFFFF' :
            '#FED976';
    } else {
        return '#FFFFFF';
    }
}

function highlightFunc (e) {
    let mapObj = firstMap;
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
        if (previousMapID != -1) {
            if (mapObj.highlight) {
                mapObj.map.removeLayer(mapObj.highlight)
            }
            previousMapID = -1;
            simplifyJson = null;
            //clean info

            mapObj.info.update();

        }
    } else if (layerJson.properties.OBJECTID != previousMapID) {
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
                if (!isSCPosition()) {
                    var displayName = (layerJson.properties.NAME_2 == "") ? layerJson.properties.NAME_1 : layerJson.properties.NAME_2;

                    if (!isInArray(forcingName2List, layerJson.properties.ISO) && (isL1(mapObj) || isInArray(forcingName1List, layerJson.properties.ISO))) {
                        displayName = layerJson.properties.NAME_1;
                    }

                    var displayNum = layerJson.properties.totalCFR ? numToString(layerJson.properties.totalCFR.toFixed(2)) : 0;
                    var buttonHTML = "<button class ='showChart' " + "onclick =showRegionChart(" + layerJson.properties.OBJECTID + ",'" + layerJson.properties.ISO + "','" + displayName.replace(/\s+/g, "_") + "','" + displayNum + "'," + mapObj.mapName + ")>Show trend</button>";
                    var popup = "<div class='pop'>" + displayName + ":" + displayNum + '% ' + ((displayNum == 0) ? "" : buttonHTML) + "</div>";
                    mapObj.map.openPopup(popup, e.latlng);

                    //zoom to location
                    mapObj.zoomToFeature(e);
                } else {
                    clickPoint(e);
                }
            })
            .addTo(mapObj.map);

        mapObj.info.update(layerJson.properties);

        previousMapID = layerJson.properties.OBJECTID;
        simplifyJson = null;
    }
}

function rePaintSQRegion() {
    SQRegionTileLayer.redraw();
    setSQLegend(currentCategory);
    setSQInfo();
}