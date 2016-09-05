"use strict";
/*var tableService = "service_center_list";
var sublayerIndexService = 0;
var tableDealer = "dealerdb_p2";
var sublayerIndexDealer = 1;*/
var defaultProductList = ["Mobile Phone", "PadFone", "Tablet", "ZenFone", "ZenPad"];
/*
function cartoServiceLayerInit(map, sqlstr) {
    loading("ServiceLayer Loading");
    cartodb.createLayer(map, 'https://asuszenuiservice.cartodb.com/api/v2/viz/d4af6514-2194-11e6-af68-0e674067d321/viz.json')
        .addTo(map)
        .on('done', function (layer) {
            cartoServiceLayer = layer;
            console.log("addLayer");
            cartoServiceLayer.getSubLayer(sublayerIndexService).setSQL(sqlstr);
            serviceLayerInit = true;
            isServiceLayerShowing = true;
            loadingDismiss();
        }).on('error', function () {
            cartodb.log.log("some error occurred");
        });
}

function cartoDealerLayerInit(map, sqlstr) {
    loading("DealerLayer Loading");
    cartodb.createLayer(map, 'https://asuszenuiservice.cartodb.com/api/v2/viz/81ed2bb4-386d-11e6-9ea1-0e674067d321/viz.json')
        .addTo(map)
        .on('done', function (layer) {
            cartoDealerLayer = layer;
            console.log("addLayer");
            isDealerLayerShowing = true;
            dealerLayerInit = true;
            cartoDealerLayer.getSubLayer(sublayerIndexDealer).setSQL(sqlstr);
            loadingDismiss();
        }).on('error', function () {
            cartodb.log.log("some error occurred");
        });
}
*/


//function serviceMenuInit(){
//    var ul = jQuery('<ul/>').css({
//        "padding-left": "12px",
//    }).appendTo($("#serviceDropdown"));
//
//    var li  = jQuery('<li/>').attr("id","check_service_li").appendTo($(ul));
//    jQuery('<input/>', {
//        id: 'filter_service_'+"all",
//        type: 'checkbox',
//        value: "all",
//        name:"service",
//        class:"checkboxService",
//    }).appendTo($(li));
//    jQuery('<label/>',{
//        text: "all",
//        for:'filter_service_'+"all",
//    }).appendTo(li);
//
//    var allUl = jQuery('<ul/>').css({
//        "padding-left": "12px",
//        "-moz-column-count": "3",
//        "-webkit-column-count": "3",
//        "column-count": "3",
//    }).appendTo($(ul));
//
//    for(var i=0;i<allProduct.length;++i) {
//        var li  = jQuery('<li/>').appendTo($(allUl));
//
//        //continents
//        jQuery('<input/>', {
//            id: 'filter_service_'+allProduct[i],
//            type: 'checkbox',
//            value: allProduct[i],
//            name:"service",
//            class:"checkboxService",
//        })
//        .css('display', 'inline-block')
//        .appendTo($(li));
//        
//        jQuery('<label/>',{
//            text: allProduct[i],
//            for:'filter_service_'+allProduct[i],
//        }).appendTo(li);
//    }
//    
//        //listener setting
//    $("#serviceDropdown input").each(function(index) {
//        $(this).on("click", function(){
//            checkChild(this, ($(this).prop("checked") ? true : false));
//            checkParent(this);
//        });
//    });
//}

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
    isServiceLayerShowing=false;
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

//function dealerMenuInit(){
//    var ul = jQuery('<ul/>').css({
//        "padding-left": "12px",
//    }).appendTo($("#dealerDropdown"));
//
//    var li  = jQuery('<li/>').attr("id","check_dealer_li").appendTo($(ul));
//    jQuery('<input/>', {
//        id: 'filter_dealer_'+"all",
//        type: 'checkbox',
//        value: "all",
//        name:"dealer",
//        class:"checkboxDealer",
//    }).appendTo($(li));
//    jQuery('<label/>',{
//        text: "all",
//        for:'filter_dealer_'+"all",
//    }).appendTo(li);
//
//    var allUl = jQuery('<ul/>').css({
//        "padding-left": "12px",
//        "-moz-column-count": "3",
//        "-webkit-column-count": "3",
//        "column-count": "3",
//    }).appendTo($(ul));
//
//    for(var i=0;i<allDealerCountry.length;++i) {
//        var li  = jQuery('<li/>').appendTo($(allUl));
//
//        //continents
//        jQuery('<input/>', {
//            id: 'filter_dealer_'+allDealerCountry[i],
//            type: 'checkbox',
//            value: allDealerCountry[i],
//            name:"dealer",
//            class:"checkboxDealer",
//        })
//        .css('display', 'inline-block')
//        .appendTo($(li));
//        
//        jQuery('<label/>',{
//            text: allDealerCountry[i],
//            for: 'filter_dealer_'+allDealerCountry[i],
//        }).appendTo(li);
//    }
//    
//        //listener setting
//    $("#dealerDropdown input").each(function(index) {
//        $(this).on("click", function(){
//            checkChild(this, ($(this).prop("checked") ? true : false));
//            checkParent(this);
//        });
//    });
//}

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
    isDealerLayerShowing=false;
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
    if (!scTileIndex && !dealerTileIndex)return;
    pointTileLayer = getPointCanvasTile();
    pointTileLayer.addTo(firstMap.map);
    //Higher than region tile layer
    pointTileLayer.setZIndex(11);
}

//Return the tile layer with dealers and service centers
function getPointCanvasTile(){
    var pad = 0;
    return L.canvasTiles().params({
        debug: false,
        padding: 50
    }).drawing(function(canvasOverlay, params) {
        params.tilePoint.z = params.zoom;
        canvasArray.push(params);
        var ctx = params.canvas.getContext('2d');
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, params.canvas.width, params.canvas.height);
        
        
        if (dealerTileIndex) {
            var dealerTile = dealerTileIndex.getTile(params.tilePoint.z, params.tilePoint.x, params.tilePoint.y);
            drawPoint(ctx,dealerTile,dealerTileIndex.radius,pad,dealerTileIndex.color);
        }

        if (scTileIndex) {
            var scTile = scTileIndex.getTile(params.tilePoint.z, params.tilePoint.x, params.tilePoint.y);
            drawPoint(ctx,scTile,scTileIndex.radius,pad,scTileIndex.color);
        }
    });
};

//Draw point to canvas
function drawPoint(ctx,tile,radius,pad,color) {
    if (!tile)return;
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