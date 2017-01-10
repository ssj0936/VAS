"use strict";
/*var tableService = "service_center_list";
var sublayerIndexService = 0;
var tableDealer = "dealerdb_p2";
var sublayerIndexDealer = 1;*/
var defaultProductList = ["Mobile Phone", "PadFone", "Tablet", "ZenFone", "ZenPad"];

function serviceSubmit() {
    if (!$("button#service").hasClass("active")) {
        openService();
    } else {
        closeService();
    }
}

function openService() {
    loading("ServiceLayer Loading");
    ajaxGetSC();
    if (!$("button#service").hasClass("active"))
        $("button#service").addClass("active");
}

function closeService() {
    scTileIndex = null;
    isServiceLayerShowing = false;
    updatePointTileLayer();

    if ($("button#service").hasClass("active"))
        $("button#service").removeClass("active");
}

function scLayer() {
    scTileIndex = geojsonvt(allSC, tileOptions);
    scTileIndex.radius = 4;
    scTileIndex.color = 'blue';
    updatePointTileLayer();
    allSC = [];
    loadingDismiss();
    isServiceLayerShowing = true;
}

function dealerSubmit() {
    if (!$("button#dealer").hasClass("active")) {
        openDealer();
    } else {
        closeDealer();
    }
}

function openDealer() {
    loading("DealerLayer Loading");
    ajaxGetDealer();

    if (!$("button#dealer").hasClass("active"))
        $("button#dealer").addClass("active");
}

function closeDealer() {
    dealerTileIndex = null;
    isDealerLayerShowing = false;
    updatePointTileLayer();

    if ($("button#dealer").hasClass("active"))
        $("button#dealer").removeClass("active");
}

function dealerLayer() {
    dealerTileIndex = geojsonvt(allDealer, tileOptions);
    dealerTileIndex.radius = 3;
    dealerTileIndex.color = 'green';
    updatePointTileLayer();
    allDealer = [];
    loadingDismiss();
    isDealerLayerShowing = true;
}

//Update the dealer and service tile layer
function updatePointTileLayer() {
    if (pointTileLayer) {
        firstMap.map.removeLayer(pointTileLayer);
    }
    //Only remove dealer and service center
    if (!scTileIndex && !dealerTileIndex) return;
    pointTileLayer = getPointCanvasTile();
    pointTileLayer.addTo(firstMap.map);
    //Higher than region tile layer
    pointTileLayer.setZIndex(11);
}

//Return the tile layer with dealers and service centers
function getPointCanvasTile() {
    var pad = 0;
    return L.canvasTiles().params({
        debug: false,
        padding: 50
    }).drawing(function (canvasOverlay, params) {
        params.tilePoint.z = params.zoom;
        canvasArray.push(params);
        var ctx = params.canvas.getContext('2d');
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, params.canvas.width, params.canvas.height);


        if (dealerTileIndex) {
            var dealerTile = dealerTileIndex.getTile(params.tilePoint.z, params.tilePoint.x, params.tilePoint.y);
            drawPoint(ctx, dealerTile, dealerTileIndex.radius, pad, dealerTileIndex.color);
        }

        if (scTileIndex) {
            var scTile = scTileIndex.getTile(params.tilePoint.z, params.tilePoint.x, params.tilePoint.y);
            drawPoint(ctx, scTile, scTileIndex.radius, pad, scTileIndex.color);
        }
    });
};

//Draw point to canvas
function drawPoint(ctx, tile, radius, pad, color) {
    if (!tile) return;
    var features = tile.features;
    ctx.strokeStyle = 'white';

    for (var i = 0; i < features.length; i++) {
        var feature = features[i],
            type = feature.type;

        //style option
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = color;
        ctx.beginPath();

        for (var j = 0; j < feature.geometry.length; j++) {
            var geom = feature.geometry[j];
            ctx.arc((geom[0] / 4096 * 256) + pad, (geom[1] / 4096 * 256) + pad, radius, 0, 2 * Math.PI, false);
        }

        ctx.fill();
        ctx.stroke();
    }
}