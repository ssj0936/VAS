function removeHeatMap() {
    if (heatmapLayer) {
        firstMap.map.removeLayer(heatmapLayer);
        //heatmapLayer.onRemove();
    }
    unsetTooltip();
    //firstMap.map.off("moveend");
    heatmapLayer = null;
    heatData = {max: '',data: []};
    $('div.heatTip').remove();
}

var heat
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
        "radius": 25,
        "maxOpacity": .85, 
        "minOpacity": .05,
        // scales the radius based on map zoom
        "scaleRadius": false, 
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
        blur : .4,
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
    /*var testdata  = [];
    for (var i in heatData.data) {
        testdata.push([heatData.data[i]['lat'],heatData.data[i]['lng'],heatData.data[i]['count']]);
    }
    heat = L.heatLayer(testdata, {radius: 25}).addTo(firstMap.map);*/
    heatmapLayer = new HeatmapOverlay(cfg);

    heatmapLayer.addTo(firstMap.map);
    heatmapLayer._heatmap.configure({
        onExtremaChange:function(data) {
            updateHeatLegend(data);
        },
    });

    setHeatLegend(heatmapLayer._heatmap.getData());
    setHeatTip();

    heatmapLayer.setData(heatData);
}

//update the heatmap
function changeHeatData(data) {
    heatData = {max: maxCap,data: data[lifeZoneTime['week']][lifeZoneTime['time']]};
    heatmapLayer.setData(heatData);
    maxCap = getMax();
    heatData.max = maxCap;
    heatmapLayer.setData(heatData);
    currentTime['week'] = lifeZoneTime['week'];
    currentTime['time'] = lifeZoneTime['time'];
}

//set tip to show count
function setHeatTip() {
    var demoWrapper = document.querySelector('#mapid');
    var heatTip;
    if ($('.heatTip').length ==0)
        heatTip = $('<div/>').attr('class','heatTip').appendTo(demoWrapper)[0];
    else
        heatTip = document.querySelector('.heatTip');


    function updateTooltip(x, y, value) {
        // + 15 for distance to cursor
        var transl = 'translate(' + (x + 15) + 'px, ' + (y + 15) + 'px)';
        heatTip.style.webkitTransform = transl;
        heatTip.innerHTML = value;
    }

    demoWrapper.onmousemove = function(ev) {
        var x = ev.layerX;
        var y = ev.layerY;

        // getValueAt gives us the value for a point p(x/y)
        var realValue = getValue(y,x);
 
        var heatValue = heatmapLayer._heatmap.getValueAt({
                x: x, 
                y: y
            });

        value = Math.max(realValue,heatValue);
        heatTip.style.display = 'block';
        updateTooltip(x, y, value);

    };
    // hide heatTip on mouseout
    demoWrapper.onmouseout = function() {
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
        var min = $('<span/>').attr({id:'min',style:'float:left'}).appendTo(div)[0];
        var max = $('<span/>').attr({id:'max',style:'float:right'}).appendTo(div)[0];
        var gradient = $('<img/>').attr({id:'gradient',style:'width:100%'}).appendTo(div)[0];

        return div;

    };

    firstMap.legend.addTo(firstMap.map);
}

function updateHeatLegend(data) {
    var legendCtx = legendCanvas.getContext('2d');
    $("span#min").html(data.min);
    $("span#max").html(heatmapLayer.getMax());


    if (data.gradient != gradientCfg) {
        gradientCfg = data.gradient;
        var gradient = legendCtx.createLinearGradient(0, 0, 100, 1);
        for (var key in gradientCfg) {
          gradient.addColorStop(key, gradientCfg[key]);
        }

        legendCtx.fillStyle = gradient;
        legendCtx.fillRect(0, 0, 100, 10);
        $('#gradient').attr('src',legendCanvas.toDataURL());
    }
}

function isDifferentTime() {
    if (currentTime['week'] != lifeZoneTime['week'] || currentTime['time'] != lifeZoneTime['time'])
        return true;
    return false;
}

function getValue(x,y) {
    var value;
    var radius = zoomRadius;
    var data = heatmapLayer._heatmap._store._data;
    
    if (data[x] && data[x][y]) {
      return data[x][y];
    } else {
      var values = [];
      // radial search for datapoints based on default radius
      for(var distance = 1; distance < radius; distance++) {
        var neighbors = distance * 2 +1;
        var startX = x - distance;
        var startY = y - distance;
    
        for(var i = 0; i < neighbors; i++) {
          for (var o = 0; o < neighbors; o++) {
            if ((i == 0 || i == neighbors-1) || (o == 0 || o == neighbors-1)) {
              if (data[startY+i] && data[startY+i][startX+o]) {
                values.push(data[startY+i][startX+o]);
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
        if(!$.isEmptyObject(currentData[i])) {
            for (var j in currentData[i]) {
                if((currentData[i][j])) {
                    max = Math.max(currentData[i][j],max);
                }
            }
        }
    } 
    return max;
}
/*
var heatIndex;
var heatTileLayer;
function heatPot(data) {
    var simplifyJson = {
        "type": "FeatureCollection",
        "features": []
    };
    for (var i in data) {
        var feature = {
            "type": "Feature",
            "properties": {
                "count": data[i]['count']
            },
            "geometry": {
                "type": "Point",
                "coordinates": [data[i]['lng'], data[i]['lat']]
            }
        };
        simplifyJson.features.push(feature);
    }
    heatIndex = geojsonvt(simplifyJson, tileOptions);
    heatTileLayer = this.getHeatCanvas();
    
    heatTileLayer.addTo(firstMap.map);
    heatTileLayer.setZIndex(10);
};

function getHeatCanvas() {
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
        //ctx.strokeStyle = 'white';
        ctx.lineJoin = "round";

        var tile = obj.heatIndex.getTile(params.tilePoint.z, params.tilePoint.x, params.tilePoint.y);
        if (!tile) {
            //console.log('tile empty');
            return;
        }

        ctx.clearRect(0, 0, params.canvas.width, params.canvas.height);

        var features = tile.features;

        for (var i = 0; i < features.length; i++) {
            var feature = features[i],
                type = feature.type;

            //style option
            if (feature.tags.count>100)
                ctx.fillStyle = 'red';
            else 
                ctx.fillStyle = 'green';
            ctx.beginPath();

            for (var j = 0; j < feature.geometry.length; j++) {
                var geom = feature.geometry[j];
                ratio = 256/4096;
                ctx.arc(geom[0] * ratio + pad, geom[1] * ratio + pad, 2, 0, 2 * Math.PI, false);
            }

            ctx.fill();
            //ctx.stroke();
        }
    });
};*/