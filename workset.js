"use strict";

function init_() {
    loading("initializing...")

    //datePicker
    $("#from").datepicker().on("change", function (e) {
        $("#to").datepicker("option", "minDate", $(this).val());
        datePickerOnChange();
    });
    $("#from").datepicker('setDate', new Date());
    $("#to").datepicker().on("change", function (e) {
        $("#from").datepicker("option", "maxDate", $(this).val());
        datePickerOnChange();
    });
    $("#to").datepicker('setDate', new Date());

    $("#from_compare").datepicker();
    $("#from_compare").datepicker('setDate', new Date());
    $("#to_compare").datepicker();
    $("#to_compare").datepicker('setDate', new Date());

    //selector option init
    var URLs = "php/dbqueryInit.php";
    $.ajax({
        url: URLs,
        type: "GET",
        dataType: 'json',
        data: {
            account: account,
            isVIP: isVip,
        },
        success: function (json) {
            console.log(json);
            if(!json.isPass){
                window.location.href = '404.html';
            }
            
            permission = jQuery.extend({}, json.accountPermission);
            console.log(permission);
            isVIP = json.isVIP;
            
            productTopProductIDList = jQuery.extend({}, json.productToProductID);
//            console.log(productTopProductIDList);
            
            allDevicesList = jQuery.extend({}, json.allDevices);
            checkboxDeviceInit();
//                    console.log(allDevicesList);

            allLoc = jQuery.extend({}, json.allLoc);
            checkboxLocationInit();
            branchDistInit();

            filterDataNull();

            updateTime.activation = json.activationUpdateTime;
            updateTime.lifezone = json.lifezoneUpdateTime;

            //init is activation dataset
            setUpdateTime(updateTime.activation);

            //overview
            if(account == "Developer" || jQuery.inArray(account,administrator) != -1){
                overviewSetting();
            }else{
                $('li#info').remove();
            }
            
            loadingDismiss();
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert(xhr.status);
            alert(thrownError);
        }
    });

    setAccount(' '+account);
    
    ajaxLoadBookmark();

    //init
    resizeInit();
    //            btnAllTimeSetting();
    saveBookmarkBtnSetting();
    loadBookmarkBtnSetting();
    snapshotBtnSetting();
    dateBtnSetting();
    submitBtnSetting();
    buttonInit();
    timePeriodBtnSetting();
    //mapBtnSetting();
    compareCheckboxSetting();
    collapseBtnInit();
    serviceBtnSetting();
    dealerBtnSetting();
    helpBtnSetting();
    //custom init
    defaultDateSetting();
    updateReleaseNote();
    
    //map_container
    $('#mapContainer').css("height", '' + (window.innerHeight - $('#mapContainer').offset().top - 30) + 'px');
    //checkLocationInit();
}

//default setting to Last30Days
function defaultDateSetting() {
    var day = new Date();
    day.setDate(day.getDate() - 30);
    $("#from").datepicker("setDate", day);
    $("#to").datepicker("setDate", new Date());
    pressToggle(document.getElementById("btnLastThirty"));
}

function resizeInit() {
    $(window).resize(function () {
        //date dropdown re-position
        if ($("#dateDropdown").css("display") != "none") {
            var dateBtn = $("button.date");
            var pos = dateBtn.position();

            $("#dateDropdown").css({
                "left": '' + pos.left + 'px',
//                "top": '' + ((pos.top + dateBtn.height() + 2) + 'px'),
                "width": '' + dateBtn.width() - 8 + 'px',
                "z-index": '9px',
            });
        }

        //toggle reposition
        var selector = $(".filter_wrapper");
        var toggleBtn = $("#toggle");
        var pos = selector.offset();

        if (selector.is(":visible")) {
            toggleBtn.css({
                "left": '' + (pos.left + selector.width() + 5) + 'px',
                "top": '' + pos.top + 'px',
            });
        }

        //map container resize
        optMapSize();

        //info size
        if ($(".legend_" + firstMap.mapName).length > 0) {
            var maxHeight = $("#mapContainer").height() - ($(".legend_" + firstMap.mapName).outerHeight() + 150);
            $('#showModelCount_' + firstMap.mapName).css('max-height', (maxHeight > 0) ? '' + maxHeight + 'px' : '0px');
            //                    console.log('maxHeight change:'+maxHeight);
        }
        if ($(".legend_" + comparisonMap.mapName).length > 0) {
            var maxHeight = $("#mapContainer").height() - ($(".legend_" + comparisonMap.mapName).outerHeight() + 150);
            $('#showModelCount_' + comparisonMap.mapName).css('max-height', (maxHeight > 0) ? '' + maxHeight + 'px' : '0px');
            //                    console.log('maxHeight change:'+maxHeight);
        }
    });
}

function showFilterResult() {
    //text in date button
    var buttonStr = ($('button.btn_pressed').length == 0) ? "" : ("(" + $('button.btn_pressed').children('span').text() + ")");
    $('button.date').button('option', 'label', (isModeActive(MODE_COMPARISION)) ? "Date" : (firstMap.fromFormatStr + "~" + firstMap.toFormatStr + buttonStr));

    var spanDevice = $("#filterBarResults");
    for (var i = 0; i < observeTarget.length; ++i) {
        var devicebtn = jQuery('<button/>').appendTo(spanDevice);
        devicebtn.attr({
                "class": "devices",
                "product": observeTarget[i].product,
                "model": observeTarget[i].model,
                "devices": observeTarget[i].devices,
                "datatype": observeTarget[i].datatype,
            })
            .text(observeTarget[i].product + 
                    ((observeTarget[i].model == observeTarget[i].product) ? "" : ("/" + observeTarget[i].model)) +
                    ((observeTarget[i].devices == observeTarget[i].model) ? "" : ("/" + observeTarget[i].devices))
                 )
            .appendTo(spanDevice);

        devicebtn.click(function (product, model, devices, datatype) {
            return function () {
                if (isLoading()) return;

                //console.log($(this).attr('model'));
                setIsClickFromFilterResult(true);
                console.log("filter delete:"+ product + "/" + model + "/" + devices + "/" + datatype);
                for (var i = 0; i < observeTarget.length; ++i) {
                    if (observeTarget[i].product == product && observeTarget[i].model == model && observeTarget[i].devices == devices && observeTarget[i].datatype == datatype) {
                        observeTarget.splice(i, 1);
                        break;
                    }
                }
                console.log(observeTarget);

                needToLoadTwoModeSameTime = (isRegionMarkerSametime()) ? true : false;

                if (isModeActive(MODE_REGION)) {
                    submitRegion();
                }
                if (isModeActive(MODE_MARKER)) {
                    //loading("updating...");
                    submitMarker();
                }
                if (isModeActive(MODE_COMPARISION)) {
                    submitComparision();
                }
                if (isModeActive(MODE_GAP)) {
                    submitGap();
                }
                if (isModeActive(MODE_LIFEZONE)) {
                    submitHeatMap();
                }

                $(this).off();
                $(this).remove();
            }
        }(observeTarget[i].product, observeTarget[i].model, observeTarget[i].devices, observeTarget[i].datatype));
    }

    $("#filterBarResults .date").button({
        icons: {
            secondary: "ui-icon-carat-1-s",
        }
    });

    $("#filterBarResults .devices").button({
        icons: {
            secondary: "ui-icon-close",
        }
    });
    $(".ui-icon-close").css({
        'font-size': '12px',
        'width': '12px',
        'height': '12px',
        'color': 'gray',
    });

    if (document.getElementById("filterResult").style.display == "none") {
        $("#filterResult").show();
    }
}

function clearFilterResult() {
    document.getElementById("filterBarResults").innerHTML = "";
}

