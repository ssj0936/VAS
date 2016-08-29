"use strict";
var tableService = "service_center_list";
var sublayerIndexService = 0;
var tableDealer = "dealerdb_p2";
var sublayerIndexDealer = 1;
var defaultProductList = ["Mobile Phone", "PadFone", "Tablet", "ZenFone", "ZenPad"];

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

function serviceSubmit() {
    //    var length = $('input.checkboxService:checked').length;
    if (!$("button#service").hasClass("active")) {
        openService();
    } else {
        closeService();
    }
}

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

function openService() {
    var locationStr = '';
    for (var i = 0; i < observeLoc.length; ++i) {
        locationStr += "'" + observeLoc[i] + "'";

        if (i != observeLoc.length - 1)
            locationStr += ",";
    }
    var productStr = '';
    for (var i = 0; i < defaultProductList.length; ++i) {
        productStr += "products LIKE '%" + defaultProductList[i] + "%'";
        if (i != defaultProductList.length - 1)
            productStr += " OR ";
    }

    var sqlstr = 'SELECT *' + ' FROM ' + tableService + ' WHERE country IN (' + locationStr + ')' + " AND (" + productStr + ")";
    console.log(sqlstr);

    //layer is not init yet
    if (!serviceLayerInit) {
        cartoServiceLayerInit(firstMap.map, sqlstr);
    } else {
        cartoServiceLayer.getSubLayer(sublayerIndexService).setSQL(sqlstr);
        cartoServiceLayer.show();
    }

    if (!$("button#service").hasClass("active"))
        $("button#service").addClass("active");
}

function closeService() {
    if (firstMap.map.hasLayer(cartoServiceLayer)) {
        cartoServiceLayer.hide();
        //        console.log('closeService');
        isServiceLayerShowing = false;
        //        firstMap.map.removeLayer(cartoServiceLayer);
    }
    if ($("button#service").hasClass("active"))
        $("button#service").removeClass("active");
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

function closeDealer() {
    if (firstMap.map.hasLayer(cartoDealerLayer)) {
        cartoDealerLayer.hide();
        isDealerLayerShowing = false;
        //        firstMap.map.removeLayer(cartoDealerLayer);
    }
    if ($("button#dealer").hasClass("active"))
        $("button#dealer").removeClass("active");
}

function openDealer() {
    var locationStr = '';
    for (var i = 0; i < observeLocFullName.length; ++i) {
        locationStr += "'" + observeLocFullName[i] + "'";

        if (i != observeLocFullName.length - 1)
            locationStr += ",";
    }

    var sqlstr = 'SELECT *' + ' FROM ' + tableDealer + ' WHERE country IN (' + locationStr + ')';
    console.log(sqlstr);

    //need to init
    if (!dealerLayerInit) {
        cartoDealerLayerInit(firstMap.map, sqlstr);
    } else {
        cartoDealerLayer.getSubLayer(sublayerIndexDealer).setSQL(sqlstr);
        cartoDealerLayer.show();
    }
    if (!$("button#dealer").hasClass("active"))
        $("button#dealer").addClass("active");
}

function dealerSubmit() {
    //    var length = $('input.checkboxDealer:checked').length;
    if (!$("button#dealer").hasClass("active")) {
        openDealer();
    } else {
        closeDealer();
    }
}