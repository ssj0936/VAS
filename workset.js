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

    //Lifezone slider - weekday
    $('#lifezoneWeekDaySlider').slider({
        min:1,
        max:7,
        change: function( event, ui ) {
            var dayTime = weekdayConvert(ui.value);
            lifeZoneTime.week = ui.value;
            if (isDifferentTime() && !$.isEmptyObject(heatmapLayer)) {
                ajaxGetHeatMap();
            }
        } 
    }).each(function() {
        var opt = $(this).data().uiSlider.options;
        var vals = opt.max - opt.min;
        for (var i = opt.min; i <= opt.max; i++) {
            var weekday = weekdayConvert(i);

            var el = $('<label>'+weekday+'</label>').css('left',((i-1)/vals*100)+'%');
            $( "#lifezoneWeekDaySlider" ).append(el);
        }
    });

    //Lifezone slider - dayofPart
    var slider = $('#lifezonePartOfDaySlider').slider({
        range: true,
        min: 1,
        max: 4,
        values: [1,2],
        create:function(event, ui){
            //hide handler
            $(this).children("span.ui-slider-handle").hide();
        },
        slide: function( event, ui ) {
            //set bound
            if(ui.values[ 0 ] > 3 || ui.values[ 1 ] < 2){
                return false;
            }

            //move another handler
            var startTime = partOfDayConvert(ui.values[ 0 ]);
            var endTime = partOfDayConvert(ui.values[ 1 ]);
            if(slider.children(".ui-slider-handle").first().hasClass('ui-state-active')){
                slider.slider('values', 1, ui.values[0]+1, true );
            }
            if(slider.children(".ui-slider-handle").last().hasClass('ui-state-active')){
                slider.slider('values', 0, ui.values[1]-1, true );
            }
        },
        stop:function( event, ui ){
            //get value
//            console.log(ui.values[ 0 ]+'-'+ui.values[ 1 ]);
            lifeZoneTime.time = ui.values[ 0 ];
            if (isDifferentTime() && !$.isEmptyObject(heatmapLayer)) {
                ajaxGetHeatMap();
            }
        }
    }).each(function() {
        var opt = $(this).data().uiSlider.options;
        var vals = opt.max - opt.min;
        for (var i = opt.min; i <= opt.max; i++) {
            var partOfDay = partOfDayConvert(i);

            var el = $('<label>'+partOfDay+'</label>').css('left',((i-1)/vals*100)+'%');
            $( "#lifezonePartOfDaySlider" ).append(el);
        }
    });

    //map_container
    $('#mapContainer').css("height", '' + (window.innerHeight - $('#mapContainer').offset().top - 30) + 'px');
    //selector option init
    var URLs = "php/dbqueryInit.php";
    $.ajax({
        url: URLs,
        type: "GET",
        dataType: 'json',
        data: {
            dataset: getDataset(),
        },
        success: function (json) {
//                    console.log(json);
            allDevicesList = jQuery.extend({}, json.allDevices);
            checkboxDeviceInit();
//                    console.log(allDevicesList);

            allLoc = jQuery.extend({}, json.allLoc);
            checkboxLocationInit();

            filterDataNull();

            updateTime.activation = json.activationUpdateTime;
            updateTime.lifezone = json.lifezoneUpdateTime;

            //init is activation dataset
            setUpdateTime(updateTime.activation);

            //overview
            if(account == "Developer" || jQuery.inArray(account,administrator) != -1){
                overviewInit(json);
            }else{
                $('button#info').remove();
            }
            
            loadingDismiss();
        },
    });

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
    //custom init
    defaultDateSetting();
    updateReleaseNote();
    
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
            var pos = dateBtn.offset();

            $("#dateDropdown").css({
                "left": '' + pos.left + 'px',
                "top": '' + ((pos.top + dateBtn.height() + 2) + 'px'),
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
            });
        }

        //map container resize
        $('#mapContainer').css("height", '' + (window.innerHeight - $('#mapContainer').offset().top - 30) + 'px');

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

