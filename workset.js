"use strict";

function init_() {
    loading("initializing...")

    //account isVIP init
    isVip = isVIP();
//    console.log('account:'+account);
//    console.log('isVip:'+isVip);
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
//            console.log(json);
            if(!isVip && !json.isPass){
                noPermissionShow();
                //window.location.href = '404.html';
            }
            
            isVip = json.isVIP;
            permission = jQuery.extend({}, json.accountPermission);
            console.log(permission);
            console.log('ispass:'+json.isPass);
            console.log('isVIP:'+isVip);
            
            
            productTopProductIDList = jQuery.extend({}, json.productToProductID);
//            console.log(productTopProductIDList);
            
            allDevicesList = jQuery.extend({}, json.allDevices);
            checkboxDeviceInit();
//                    console.log(allDevicesList);

            allLoc = jQuery.extend(true,{}, json.allLoc);
//            console.log(allLoc);
            
            //check is Gap mode need to hide
            gapLoc = jQuery.extend(true,{}, json.allLoc);
            for(var terrority in gapLoc){
                for(var country in gapLoc[terrority]){
                    if(!isInArray(countryGapModeSupported,gapLoc[terrority][country][0])){
                        delete gapLoc[terrority][country];
                    }
                }
                
                if(Object.keys(gapLoc[terrority]).length == 0)
                    delete gapLoc[terrority];
            }
            if(Object.keys(gapLoc).length == 0)
                isNeedToHideGap = true;

            //check is distBranch mode need to hide
            distBranchLoc = jQuery.extend(true,{}, json.allLoc);
            for(var terrority in distBranchLoc){
                for(var country in distBranchLoc[terrority]){
                    if(!isInArray(countryNeedToShowDistBranch,distBranchLoc[terrority][country][0])){
                        delete distBranchLoc[terrority][country];
                    }
                }
                
                if(Object.keys(distBranchLoc[terrority]).length == 0)
                    delete distBranchLoc[terrority];
            }
            if(Object.keys(distBranchLoc).length == 0)
                isNeedToHideDistBranch = true;

            //if is needed, hide it
            if(isNeedToHideGap)
                $('#dataset option[value="gap"]').remove();

            if(isNeedToHideDistBranch)
                $('#dataset option[value="distBranch"]').remove();
            
            
            checkboxLocationInit(allLoc);
            branchDistInit();

            filterDataNull();

            updateTime.activation = json.activationUpdateTime;
            updateTime.lifezone = json.lifezoneUpdateTime;

            datepickerSetting();
            defaultDateSetting();
            
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
    updateReleaseNote();
    
    //map_container
    $('#mapContainer').css("height", '' + (window.innerHeight - $('#mapContainer').offset().top - 30) + 'px');
    //checkLocationInit();
}

function datepickerSetting(){
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
    
    $("#to").datepicker("option", "maxDate", new Date(getUpdateTime()));
    $("#from").datepicker("option", "maxDate", new Date(getUpdateTime()));

    $("#from_compare").datepicker();
    $("#from_compare").datepicker('setDate', new Date());
    $("#to_compare").datepicker();
    $("#to_compare").datepicker('setDate', new Date());
}

//default setting to Last30Days
function defaultDateSetting() {
    var day = new Date(getUpdateTime());
    day.setDate(day.getDate() - 30);
    $("#from").datepicker("setDate", day);
    $("#to").datepicker("setDate", new Date(getUpdateTime()));
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
                if (getFunction() == FUNC_GAP) {
                    submitGap();
                }
                if (getFunction() == FUNC_LIFEZONE) {
                    submitHeatMap();
                }
                if (getFunction() == FUNC_ACTIVATION_TABLE){
                    $(tableContainer).empty();
                    showTable();
                }
                if (getFunction() == FUNC_QC) {
                    if (isModeActive(MODE_QC_REGION))
                        submitSQRegion();
                    if (isModeActive(MODE_QC_MARKER))
                        submitSQMarker();
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

function noPermissionShow(){
    $('body').empty();
    
    var container = jQuery('<div/>').appendTo('body');
    var img = jQuery('<img/>',{
           src: 'img/Lock.png',
        }).css({
            'display':'block',
            'margin':'auto',
            'width':'15%',
        }).appendTo(container);
    
    var text = jQuery('<p/>',{
        'class':'text-info',
    })
    .css({
        'font-size':'18px',
        'text-align': 'center',
        'font-weight': 'bold',
    })
    .text('Permission Deny')
    .appendTo(container);
    
    container.css({
        'margin-top':'10%'
//        'position': 'absolute',
//        'top': '50%',
//        'left': '50%',
//        'width': ''+container.outerWidth()+'px',
//        'height': ''+container.outerHeight()+'px',
//        'margin-top':'' + (-1*(container.outerHeight()/2)) + 'px',
//        'margin-left':'' + (-1*(container.outerWidth()/2)) + 'px',
    })
}