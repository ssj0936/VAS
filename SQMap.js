"use strict";
let SQDeviceIndex;
let SQCenterIndex;
let SQMarkerTileLayer;

let selectSQ;
let selectSiteId;

//set color,radius for different type node
let SQMarkerSetting = {
    'SC': {
        'radius':4,
        'color_unset':'BlueViolet',
        'color_set':'BlueViolet'
    },
    'activate_device': {
        'radius':1,
        'color_unset':"rgba(0, 136, 0, 0.5)",
        'color_set':"rgba(0, 136, 0, 1)"
    },
    'service_device': {
        'radius':2,
        'color_unset':"rgba(255, 0, 0, 0.5)",
        'color_set':"rgba(255, 0, 0, 1)"
    }
};

//remove marker layer
function removeSQMarker() {
    if (SQMarkerTileLayer) {
        firstMap.map.removeLayer(SQMarkerTileLayer);
    }
    SQDeviceIndex = null;
    SQCenterIndex = null;
    SQMarkerTileLayer = null;
    firstMap.map.off('mousemove', movePoint);
    firstMap.map.off('click',clickPoint);
}

function setSQMarker(data) {
    removeSQMarker();
    if (data.device.length == 0) {
        showToast("Empty Data In This Date Set");
        return;
    }
    initCFRCategory(data.category_list);
    SQDeviceIndex = geojsonvt(importToGeoJson(data.device,'device'), tileOptions);
    SQCenterIndex = geojsonvt(importToGeoJson(data.SC,'SC'), tileOptions);
    SQMarkerTileLayer = getSQMarkerCanvas();
    SQMarkerTileLayer.addTo(firstMap.map);
    SQMarkerTileLayer.setZIndex(11);

    //set service center click event
    firstMap.map.on('mousemove', movePoint);
    firstMap.map.on('click',clickPoint);
}

function importToGeoJson(dataSet,type) {
    let geoJson = {
        "type": "FeatureCollection",
        "features": [],
    };

    //set geojson
    for (var i in dataSet) {
        let property = {};
        if (type == 'SC') {
            property = {
                'address': dataSet[i].address,
                'type': type,
                'site_id': dataSet[i].site_id,
                'status': 'unset'
            }
        } else if (type == 'device') {
            let deviceType = dataSet[i].service == 'Y'? 'service_device' : 'activate_device';
            property = {
                'type': deviceType,
                'site_id': dataSet[i].site_id,
                'status': 'unset',
                'part': new Set(dataSet[i].part)
            }
        }
        let feature = {
                'type':'feature',
                'properties' : property,
                'geometry': {
                    'type': 'Point',
                    'coordinates': [dataSet[i].lng, dataSet[i].lat]
                }
        }
        geoJson.features.push(feature);
    }
    return geoJson;
}

function getSQMarkerCanvas() {
    return L.canvasTiles().params({
        debug: false,
        padding: 50
    }).drawing(function (canvasOverlay, params) {
        let bounds = params.bounds;
        params.tilePoint.z = params.zoom;
        canvasArray.push(params);

        let ctx = params.canvas.getContext('2d');
        ctx.strokeStyle = 'white';
        ctx.lineJoin = "round";
        ctx.clearRect(0, 0, params.canvas.width, params.canvas.height);

        paintFeature(ctx,[SQDeviceIndex,SQCenterIndex],params);
    });
};

function paintFeature(ctx,tileIndex,params) {
    let pad = 0;
    let ratio = 256/4096;
    for (let r = 0; r < tileIndex.length; r++) {
        let tile = tileIndex[r].getTile(params.tilePoint.z, params.tilePoint.x, params.tilePoint.y);
        if (!tile) {
            //console.log('tile empty');
            return;
        }
    
        let features = tile.features;
    
        for (let i = 0; i < features.length; i++) {
            let feature = features[i],
                type = feature.tags.type;

            //set overlap option : SC>device of selected SC> other device
            ctx.globalCompositeOperation = 'destination-over';
            if (feature.tags.type == 'SC')
                ctx.globalCompositeOperation = 'source-over';
            if (feature.tags.site_id == selectSiteId) {
                feature.tags.status = 'set';
                ctx.globalCompositeOperation = 'source-over';
            } else {
                feature.tags.status = 'unset';
            }

            //ignore non-selected category
            if (currentCategory != 'ALL' 
                && (feature.tags.type == 'service_device')
                && !feature.tags.part.has(currentCategory)) {
                continue;
            }

            //note: canvas arc only accept integer radius
            let radius = parseInt(SQMarkerSetting[type].radius) * parseInt(feature.tags.status == 'set'?2:1);

            ctx.fillStyle = feature.tags.status == 'set'?SQMarkerSetting[type].color_set:SQMarkerSetting[type].color_unset;
            ctx.beginPath();
    
            for (let j = 0; j < feature.geometry.length; j++) {
                let geom = feature.geometry[j];
                ctx.arc(geom[0] * ratio + pad, geom[1] * ratio + pad,radius, 0, 2 * Math.PI, false);
            }
    
            ctx.fill();
            if (feature.tags.type == 'SC')
                ctx.stroke();
        }
    }
}

//check if move on SC node and change detect area if node is selected
function selectPoint(tile,canvas,event) {
    if (!tile) return [];
    let select = tile.features.filter(function(feature) {
        let convertX = feature.geometry[0][0]/ 4096 * 256;
        let convertY = feature.geometry[0][1]/ 4096 * 256;
        convertX = convertX + canvas._leaflet_pos.x;
        convertY = convertY + canvas._leaflet_pos.y;
        let type = feature.tags.type;
        let targetRadius = parseInt(SQMarkerSetting[type].radius) * parseInt(feature.tags.status == 'set'?2:1);
        
        return  event.layerPoint.x > (convertX - targetRadius) && event.layerPoint.x < (convertX + targetRadius)
                && event.layerPoint.y > (convertY - targetRadius) && event.layerPoint.y < (convertY + targetRadius);
    });
    return select;
}

//get mouse position and change cursor if node can be selected
function movePoint(e) {
    if (SQCenterIndex) {
        let x = e.latlng.lng;
        let y = e.latlng.lat;
        let tileX = deg2num(y,x,firstMap.map.getZoom())[0];
        let tileY = deg2num(y,x,firstMap.map.getZoom())[1];
        let SQTile = SQCenterIndex.getTile(firstMap.map.getZoom(), tileX, tileY);
        let selectCanvas = canvasArray.filter(function(params) {
            return params.tilePoint.x == tileX && params.tilePoint.y == tileY
        });

        if((SQTile) && selectCanvas[0]) {
            selectSQ = selectPoint(SQTile,selectCanvas[0].canvas,e);
            if (selectSQ.length > 0){
                $(".leaflet-container").css("cursor", "pointer");
                return;
            }
        }
        $(".leaflet-container").css("cursor", "");
    }
}

//click event: change node status and record the site id
function clickPoint(e) {
    if (SQCenterIndex && selectSQ.length > 0) {
        for (let i = 0; i < selectSQ.length; i++) {
            if (selectSQ[i].tags.status == "unset") {
                //var popup = "<div class='pop'>Address:<br>" + selectSQ[0].tags.address +"</div>";
                selectSQ[i].tags.status = 'set'
                selectSiteId = selectSQ[i].tags.site_id;
                //firstMap.map.openPopup(popup, e.latlng);
            } else {
                selectSQ[i].tags.status = "unset"
                selectSiteId = -1;
            }
        }
        SQMarkerTileLayer.redraw();
    }
}

function rePaintSQMarker() {
    SQMarkerTileLayer.redraw();
}