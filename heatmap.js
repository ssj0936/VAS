var mapObj = firstMap;

function removeHeatMap() {
    if (heatmapLayer) {
        mapObj.map.removeLayer(heatmapLayer);
        //heatmapLayer.onRemove();
    }
    unsetTooltip();
    mapObj.map.off("moveend");
    heatmapLayer = null;
    heatData = {max: '',data: []};
}


function addHeatMap(json) {
    if (heatmapLayer) {
        mapObj.map.removeLayer(heatmapLayer);
    }

    heatData.data = json[lifeZoneTime['week']][lifeZoneTime['time']];
    currentTime['week'] = lifeZoneTime['week'];
    currentTime['time'] = lifeZoneTime['time'];

    var cfg = {
        // radius should be small ONLY if scaleRadius is true (or small radius is intended)
        // if scaleRadius is false it will be the constant radius used in pixels
        "radius": zoomRadius,
        "maxOpacity": .85, 
        "minOpacity": .05,
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
        blur : .85,
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

    heatmapLayer.addTo(mapObj.map);
    heatmapLayer._heatmap.configure({
        onExtremaChange:function(data) {
            updateHeatLegend(data);
        },
    });

    setHeatLegend(heatmapLayer._heatmap.getData());
    setHeatTip();

    heatmapLayer.setData(heatData);
    mapObj.map.on('click',function(e){
        console.log(e.latlng);
    });

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
        var value = getValue(y,x);
        if(!value) {
            value = heatmapLayer._heatmap.getValueAt({
                x: x, 
                y: y
            });
        }
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
    mapObj.removeInfo();
    mapObj.removeLegend();
    gradientCfg = {};
    legendCanvas = document.createElement('canvas');
    legendCanvas.width = 100;
    legendCanvas.height = 10;

    mapObj.legend.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'legend_' + mapObj.mapName);
        var min = $('<span/>').attr({id:'min',style:'float:left'}).appendTo(div)[0];
        var max = $('<span/>').attr({id:'max',style:'float:right'}).appendTo(div)[0];
        var gradient = $('<img/>').attr({id:'gradient',style:'width:100%'}).appendTo(div)[0];

        return div;

    };

    mapObj.legend.addTo(mapObj.map);
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