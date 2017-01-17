function removeHeatMap() {
    if (heatmapLayer) {
        firstMap.map.removeLayer(heatmapLayer);
        //heatmapLayer.onRemove();
    }
    unsetTooltip();
    //firstMap.map.off("moveend");
    heatmapLayer = null;
    heatData = {
        max: maxCap,
        data: []
    };
    $('div.heatTip').remove();
}

function addHeatMap(json) {
    if (heatmapLayer) {
        firstMap.map.removeLayer(heatmapLayer);
    }

    heatData.data = json[lifeZoneTime['week']][lifeZoneTime['time']];
    currentTime['week'] = lifeZoneTime['week'];
    currentTime['time'] = lifeZoneTime['time'];
    //heatPot(json[lifeZoneTime['week']][lifeZoneTime['time']]);
    var cfg = {
        // radius should be small ONLY if scaleRadius is true (or small radius is intended)
        // if scaleRadius is false it will be the constant radius used in pixels
        "radius": 20,
        "maxOpacity": .85,
        "minOpacity": .01,
        // scales the radius based on map zoom
        "scaleRadius": true,
        // if set to false the heatmap uses the global maximum for colorization
        // if activated: uses the data maximum within the current map boundaries 
        //   (there will always be a red spot with useLocalExtremas true)
        "useLocalExtrema": true,
        // which field name in your data represents the latitude - default "lat"
        latField: 'lat',
        // which field name in your data represents the longitude - default "lng"
        lngField: 'lng',
        // which field name in your data represents the data value - default "value"
        valueField: 'count',
        blur: .2,
        gradient: {
            '.15': '#FF00FF',
            '.3': '#0000FF',
            '.45': '#00FFFF',
            '.6': '#00FF00',
            '.75': '#FFFF00',
            '.9': '#FFCC00',
            '1': '#FF0000'
        }
    };

    heatmapLayer = new HeatmapOverlay(cfg);

    heatmapLayer.addTo(firstMap.map);
    heatmapLayer._heatmap.configure({
        onExtremaChange: function (data) {
            updateHeatLegend(data);
        },
    });

    setHeatLegend(heatmapLayer._heatmap.getData());
    setHeatTip();

    heatmapLayer.setData(heatData);
}

//update the heatmap
function changeHeatData(data) {
    heatData = {
        max: maxCap,
        data: data[lifeZoneTime['week']][lifeZoneTime['time']]
    };
    heatmapLayer.setData(heatData);
    heatmapLayer.setData(heatData);
    currentTime['week'] = lifeZoneTime['week'];
    currentTime['time'] = lifeZoneTime['time'];
}

//set tip to show count
function setHeatTip() {
    var demoWrapper = document.querySelector('#mapid');
    var heatTip;
    if ($('.heatTip').length == 0)
        heatTip = $('<div/>').attr('class', 'heatTip').appendTo(demoWrapper)[0];
    else
        heatTip = document.querySelector('.heatTip');


    function updateTooltip(x, y, value) {
        // + 15 for distance to cursor
        var transl = 'translate(' + (x + 15) + 'px, ' + (y + 15) + 'px)';
        heatTip.style.webkitTransform = transl;
        heatTip.innerHTML = value;
    }

    demoWrapper.onmousemove = function (ev) {
        var x = ev.layerX;
        var y = ev.layerY;

        // getValueAt gives us the value for a point p(x/y)
        var realValue = getValue(y, x);

        var heatValue = 0;
        heatValue = heatmapLayer._heatmap.getValueAt({
            x: x,
            y: y
        });

        value = Math.max(realValue, heatValue);
        heatTip.style.display = 'block';
        updateTooltip(x, y, value);

    };
    // hide heatTip on mouseout
    demoWrapper.onmouseout = function () {
        heatTip.style.display = 'none';
    };
}

function unsetTooltip() {
    var demoWrapper = document.querySelector('#mapid');
    demoWrapper.onmousemove = null;
    demoWrapper.onmouseout = null;
}

function setHeatLegend(data) {
    firstMap.removeInfo();
    firstMap.removeLegend();
    gradientCfg = {};
    legendCanvas = document.createElement('canvas');
    legendCanvas.width = 100;
    legendCanvas.height = 10;

    firstMap.legend.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'legend_' + firstMap.mapName);
        var min = $('<span/>').attr({
            id: 'min',
            style: 'float:left'
        }).appendTo(div)[0];
        var max = $('<span/>').attr({
            id: 'max',
            style: 'float:right'
        }).appendTo(div)[0];
        var gradient = $('<img/>').attr({
            id: 'gradient',
            style: 'width:100%'
        }).appendTo(div)[0];

        return div;

    };

    firstMap.legend.addTo(firstMap.map);
}

function updateHeatLegend(data) {
    var legendCtx = legendCanvas.getContext('2d');
    $("span#min").html(data.min);
    $("span#max").html(getMax());


    if (data.gradient != gradientCfg) {
        gradientCfg = data.gradient;
        var gradient = legendCtx.createLinearGradient(0, 0, 100, 1);
        for (var key in gradientCfg) {
            gradient.addColorStop(key, gradientCfg[key]);
        }

        legendCtx.fillStyle = gradient;
        legendCtx.fillRect(0, 0, 100, 10);
        $('#gradient').attr('src', legendCanvas.toDataURL());
    }
}

function isDifferentTime() {
    if (currentTime['week'] != lifeZoneTime['week'] || currentTime['time'] != lifeZoneTime['time'])
        return true;
    return false;
}

function getValue(x, y) {
    var value;
    var radius = zoomRadius;
    var data = heatmapLayer._heatmap._store._data;

    if (data[x] && data[x][y]) {
        return data[x][y];
    } else {
        var values = [];
        // radial search for datapoints based on default radius
        for (var distance = 1; distance < radius; distance++) {
            var neighbors = distance * 2 + 1;
            var startX = x - distance;
            var startY = y - distance;

            for (var i = 0; i < neighbors; i++) {
                for (var o = 0; o < neighbors; o++) {
                    if ((i == 0 || i == neighbors - 1) || (o == 0 || o == neighbors - 1)) {
                        if (data[startY + i] && data[startY + i][startX + o]) {
                            values.push(data[startY + i][startX + o]);
                        }
                    } else {
                        continue;
                    }
                }
            }
        }
        if (values.length > 0) {
            return Math.max.apply(Math, values);
        }
    }
    return false;
}

function getMax() {
    var currentData = heatmapLayer._heatmap._store._data;
    var max = 0;
    for (var i in currentData) {
        if (!$.isEmptyObject(currentData[i])) {
            for (var j in currentData[i]) {
                if ((currentData[i][j])) {
                    max = Math.max(currentData[i][j], max);
                }
            }
        }
    }
    return max;
}

let gradientObj = {
    ".01": "#ff00ff",
    ".02": "#f100ff",
    ".03": "#e400ff",
    ".04": "#d600ff",
    ".05": "#c900ff",
    ".06": "#bb00ff",
    ".07": "#ae00ff",
    ".08": "#a100ff",
    ".09": "#9300ff",
    ".10": "#8600ff",
    ".11": "#7800ff",
    ".12": "#6b00ff",
    ".13": "#5d00ff",
    ".14": "#5000ff",
    ".15": "#4300ff",
    ".16": "#3500ff",
    ".17": "#2800ff",
    ".18": "#1a00ff",
    ".19": "#0d00ff",
    ".20": "#0000ff",
    ".21": "#0000ff",
    ".22": "#000dff",
    ".23": "#001aff",
    ".24": "#0028ff",
    ".25": "#0035ff",
    ".26": "#0043ff",
    ".27": "#0050ff",
    ".28": "#005dff",
    ".29": "#006bff",
    ".30": "#0078ff",
    ".31": "#0086ff",
    ".32": "#0093ff",
    ".33": "#00a1ff",
    ".34": "#00aeff",
    ".35": "#00bbff",
    ".36": "#00c9ff",
    ".37": "#00d6ff",
    ".38": "#00e4ff",
    ".39": "#00f1ff",
    ".40": "#00ffff",
    ".41": "#00ffff",
    ".42": "#00fff1",
    ".43": "#00ffe4",
    ".44": "#00ffd6",
    ".45": "#00ffc9",
    ".46": "#00ffbb",
    ".47": "#00ffae",
    ".48": "#00ffa1",
    ".49": "#00ff93",
    ".50": "#00ff86",
    ".51": "#00ff78",
    ".52": "#00ff6b",
    ".53": "#00ff5d",
    ".54": "#00ff50",
    ".55": "#00ff43",
    ".56": "#00ff35",
    ".57": "#00ff28",
    ".58": "#00ff1a",
    ".59": "#00ff0d",
    ".60": "#00ff00",
    ".61": "#00ff00",
    ".62": "#0dff00",
    ".63": "#1aff00",
    ".64": "#28ff00",
    ".65": "#35ff00",
    ".66": "#43ff00",
    ".67": "#50ff00",
    ".68": "#5dff00",
    ".69": "#6bff00",
    ".70": "#78ff00",
    ".71": "#86ff00",
    ".72": "#93ff00",
    ".73": "#a1ff00",
    ".74": "#aeff00",
    ".75": "#bbff00",
    ".76": "#c9ff00",
    ".77": "#d6ff00",
    ".78": "#e4ff00",
    ".79": "#f1ff00",
    ".80": "#ffff00",
    ".81": "#ffff00",
    ".82": "#fff100",
    ".83": "#ffe400",
    ".84": "#ffd600",
    ".85": "#ffc900",
    ".86": "#ffbb00",
    ".87": "#ffae00",
    ".88": "#ffa100",
    ".89": "#ff9300",
    ".90": "#ff8600",
    ".91": "#ff7800",
    ".92": "#ff6b00",
    ".93": "#ff5d00",
    ".94": "#ff5000",
    ".95": "#ff4300",
    ".96": "#ff3500",
    ".97": "#ff2800",
    ".98": "#ff1a00",
    ".99": "#ff0d00",
    "1": "#ff0000"
}