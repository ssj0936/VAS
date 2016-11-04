"use strict";

function buttonInit() {
    $("#databtn button,#mode button,#overlay button,#filterResult button,button.date").button();
    //$('#dataset').buttonset();
    
    $( "#dataset" ).selectmenu({
        width: '100px',
        change: function( event, data ) {
            //not allow switching while loading
            if (isLoading()) return;
            var dataSet = data.item.value;
            activeDatasetTmp = dataSet;
            var updatetime = updateTime.dataSet;
            switch(dataSet){
                    case "activation":
                        //hide date button
                        $('#databtn').show('medium');
                        //control panel switch
                        $('#activationControlPanel').show("medium");
                        $('#lifezoneControlPanel').hide();
                        break;
                    case "lifezone":
                        //hide date button
                        $('#databtn').hide();
                        //control panel switch
                        $('#lifezoneControlPanel').show("medium");
                        $('#activationControlPanel').hide();
                        break;
            }
            //setDataset(dataSet);
            //setUpdateTime(updatetime);
        }
     });
    
    //branch / Dist
    $('#locset').buttonset();

    $('.locset').each(function () {
        $(this).click(function ($this) {
            return function () {
                if(!$this.hasClass('active'))
                {
                    $('.locset').removeClass('active');
                    $this.addClass('active');

                    cleanDistBranchFilter();
                    switch($this.attr('id')){
                        case 'branch':
                            $('#distToBranch').stop(true,true).fadeOut('medium');
                            $('#onlineDist').stop(true,true).fadeOut('medium');
                            $('#branchToDist').stop(true,true).fadeIn('medium');
                            break;
                        case 'dist':
                            $('#branchToDist').stop(true,true).fadeOut('medium');
                            $('#onlineDist').stop(true,true).fadeOut('medium');
                            $('#distToBranch').stop(true,true).fadeIn('medium');
                            break;
                        case 'online':
                            $('#branchToDist').stop(true,true).fadeOut('medium');
                            $('#distToBranch').stop(true,true).fadeOut('medium');
                            $('#onlineDist').stop(true,true).fadeIn('medium');
                            break;
                    }
                }
            }
        }($(this)));

    });

    $(".control_panel_btn_area button").css({
        width: '100px'
    })

    $("#mode button,#overlay button").attr("disabled", "disabled");

    $("button.date").button({
        icons: {
            secondary: "ui-icon-carat-1-s",
        }
    }).css({
        width: '260px'
    });

    var modeBtns = $("#mode button");
    modeBtns.click(function () {
        if (isLoading()) return;

        if ($(this).attr("id") == "table") {
            if (!$(this).hasClass('active')) {
                if(isModeActive(MODE_GAP))
                    gapReportExportDialogShow();
                else
                    showTable();
                return;
            }
        }
        
        if ($(this).attr("id") == "printTest") {
            $('#drawMap').remove();
            sessionStorage.patternIndex = firstMap.getColorPattern();
            sessionStorage.colorPattern = JSON.stringify(colorPattern);
            window.open('popup.html');
        }

        var isCurrentButtonSet = (isModeActive(MODE_REGION) || isModeActive(MODE_MARKER)) ? true : false;
        var isTargetButtonSet = ($(this).attr("id") == 'region' || $(this).attr("id") == 'marker') ? true : false;
        
        //click the same btn
        if ((!isCurrentButtonSet && !isTargetButtonSet) && $(this).hasClass("active")) return;
        if ($(this).attr("id") == 'comparison' && comparisonMap.fromFormatStr == undefined && comparisonMap.toFormatStr == undefined) {
            showAlert("plz select comparison Data...");
            return;
        }
        
        var pressedTarget = $(this);
        //buttonset switch
        if (isCurrentButtonSet && isTargetButtonSet) {
            if (pressedTarget.hasClass("active")) {
                pressedTarget.removeClass("active");
                unactiveModeBtn($(this));
            } else {
                pressedTarget.addClass("active");
                activeModeBtn($(this));
            }
        }
        //buttonset -> unbuttonset
        else if (isCurrentButtonSet && !isTargetButtonSet) {
            modeBtns.removeClass("active");
            modeBtns.each(function () {
                if ($(this).attr("id") != pressedTarget.attr("id")) {
                    unactiveModeBtn($(this));
                }
            });

            $(this).addClass("active");
            activeModeBtn($(this));
        }
        //unbuttonset -> buttonset
        else if (!isCurrentButtonSet && isTargetButtonSet) {
            modeBtns.removeClass("active");
            modeBtns.each(function () {
                if ($(this).attr("id") != pressedTarget.attr("id")) {
                    unactiveModeBtn($(this));
                }
            });

            $(this).addClass("active");
            activeModeBtn($(this));
        }
    });

    $("#activation").addClass("active");
    setDataset(DATA_ACTIVATION);
}

function unactiveModeBtn($this) {
    switch ($this.attr("id")) {
    case "region":
        //console.log("region");
        firstMap.removePolygonMap();
        setModeOff(MODE_REGION);
        firstMap.info.update();
        firstMap.map.removeControl(firstMap.snapshotBtn);
        if (isModeActive(MODE_MARKER)) {
            firstMap.hideLegend();
        }
        break;
    case "marker":
        //console.log("marker");
        removeMarkerMap();
        firstMap.showLegend();
        setModeOff(MODE_MARKER);
        //resetIsClickFromFilterResult();
        break;
    case "comparison":
        //console.log("comparison");
        setCompareCheckbox(false);
        comparisionMapShrink();
        setModeOff(MODE_COMPARISION);
        //console.log("unactiveModeBtn_comparison");
        break;
    case "gap":
        //change table button text
        $('#table').button('option','label','Table');
    
        firstMap.removePolygonMap();
        cleanBranch();
        setModeOff(MODE_GAP);
        break;
    }
}

function activeModeBtn($this) {
    switch ($this.attr("id")) {
    case "region":
        firstMap.snapshotBtn.addTo(firstMap.map);
        setModeOn(MODE_REGION);
        submitRegion();
        break;
    case "marker":
        setModeOn(MODE_MARKER);
        if (!isRegionMarkerSametime())
            firstMap.hideLegend();
        submitMarker();
        break;
    case "comparison":
        setModeOn(MODE_COMPARISION);
        if (comparisonMap.fromFormatStr == undefined && comparisonMap.toFormatStr == undefined) {
            showAlert("please select comparison Data...");
        } else {
            submitComparision();
        }
        break;
    case "gap":
        //change table button text
        $('#table').button('option','label','Export');

        setModeOn(MODE_GAP);
        submitGap();
        break;
    }
}

function timePeriodBtnSetting() {
    document.getElementById("btnToday").onclick = function () {
        onDatepickerMaxMinReset();
        var today = new Date();

        $("#from").datepicker("setDate", today);

        today.setDate(today.getDate() + 1);
        $("#to").datepicker("setDate", today);

        onChangeTrigger();
        pressToggle(this);
    }

    document.getElementById("btnYesterday").onclick = function () {
        onDatepickerMaxMinReset();
        var day = new Date();
        day.setDate(day.getDate() - 1);

        $("#from").datepicker("setDate", day);
        $("#to").datepicker("setDate", new Date());
        onChangeTrigger();
        pressToggle(this);
    }

    document.getElementById("btnLastSeven").onclick = function () {
        onDatepickerMaxMinReset();
        var day = new Date();
        day.setDate(day.getDate() - 7);
        $("#from").datepicker("setDate", day);
        $("#to").datepicker("setDate", new Date());
        onChangeTrigger();
        pressToggle(this);
    }

    document.getElementById("btnLastThirty").onclick = function () {
        onDatepickerMaxMinReset();
        var day = new Date();
        day.setDate(day.getDate() - 30);
        $("#from").datepicker("setDate", day);
        $("#to").datepicker("setDate", new Date());
        onChangeTrigger();
        pressToggle(this);
    }

    document.getElementById("btnThisMonth").onclick = function () {
        onDatepickerMaxMinReset();
        var day = new Date();

        var mm = day.getMonth() + 1;
        var yyyy = day.getFullYear();

        if (mm < 10) {
            mm = '0' + mm;
        }

        var fromDate = new Date(yyyy + '-' + mm + '-01');
        var toDate = new Date(yyyy + '-' + mm + '-01');
        toDate.setMonth(toDate.getMonth() + 1);
        toDate.setDate(toDate.getDate() - 1);

        $("#from").datepicker("setDate", fromDate);
        $("#to").datepicker("setDate", toDate);
        onChangeTrigger();
        pressToggle(this);
    }

    document.getElementById("btnLastMonth").onclick = function () {
        onDatepickerMaxMinReset();
        var day = new Date();

        var mm = day.getMonth() + 1;
        var yyyy = day.getFullYear();

        //back shift one month
        if (mm < 1) {
            mm = 12;
            --yyyy;
        } else {
            --mm;
        }

        if (mm < 10) {
            mm = '0' + mm;
        }

        var fromDate = new Date(yyyy + '-' + mm + '-01');
        var toDate = new Date(yyyy + '-' + mm + '-01');
        toDate.setMonth(toDate.getMonth() + 1);
        toDate.setDate(toDate.getDate() - 1);

        $("#from").datepicker("setDate", fromDate);
        $("#to").datepicker("setDate", toDate);
        onChangeTrigger();
        pressToggle(this);
    }
}

function btnAllTimeSetting() {
    document.getElementById("btnAllTime").onclick = function () {
        //console.log(observeTargetTmp);
        ajaxGetDateBound();
        pressToggle(this);
    }
}

function snapshotBtnSetting() {
    /*document.getElementById("snapshot").onclick = function(){
        html2canvas(document.body, {
            onrendered: function(canvas) {
                document.body.appendChild(canvas);
            }
        });
    }*/
}



function dealerBtnSetting() {
    document.getElementById("dealer").onclick = function () {
            if (isLoading()) return;
            dealerSubmit();
        }
}

function serviceBtnSetting() {
    $('button#service').click(function () {
        if (isLoading()) return;

        serviceSubmit();
    });
}

function dateBtnSetting() {
    var dropdown = $("#dateDropdown");
    $("button.date").click(function () {
        if (isLoading()) return;

        if (dropdown.css("display") == "none") {
            dateMenuShow();
        } else {
            dateMenuHide();
        }
    });

    $(document.body).click(function (e) {
        //console.log(e.target);
        //click target is not dropdown menu
        if ((!$("#dateDropdown").is(e.target) && $("#dateDropdown").has(e.target).length === 0)) {
            //click target is not date button & datepicker is not showing
            if ((!$("button.date").is(e.target) && $("button.date").has(e.target).length === 0) && ($("#ui-datepicker-div").is(':hidden'))) {
                //if menu is showing, hide it
                if (!$('#dateDropdown').is(':hidden')) {
                    $('#dateDropdown').fadeOut(300);
                    //console.log("need to hide");
                }
            }
        }
    });
}

function dateMenuShow() {
    var dateBtn = $("button.date");
    var dropdown = $("#dateDropdown");
    var pos = dateBtn.position();

    dropdown.css({
        "left": '' + pos.left + 'px',
//        "top": '' + (pos.top + dateBtn.height() + 2) + 'px',
        "width": '' + dateBtn.width() - 8 + 'px',
        "z-index": 9999,
    });
    dropdown.fadeIn(300);
}

function dateMenuHide() {
    $('#dateDropdown').fadeOut(300);
}

function mapBtnSetting() {
    document.getElementById("map").onclick = function () {
        $("#workset").show();
        $("#homepage").hide();
        $("#homepage").empty();
        if (document.getElementById("mapid").childNodes.length == 0) {
            mapInit();
        }
    }
}

function compareCheckboxSetting() {
    $("input#compare").on("click", function () {
        $("#date_selection_zone_2").slideToggle();
    });
}

function setCompareCheckbox(setCheck) {
    if (setCheck) {
        $("input#compare").prop("checked", true);
        $("#date_selection_zone_2").show();
    } else {
        $("input#compare").prop("checked", false);
        $("#date_selection_zone_2").hide();
    }
}

function submitBtnSetting() {
    $(".submit").click(function () {
        if (isLoading()) return;

        //var selected = $("#locationFilter input[type='checkbox']:checked");
        if (observeTargetTmp.length == 0) {
            showAlert("Please select a observation Target");
        } else if ($("#locationFilter input[type='checkbox']:checked").length == 0) {
            showAlert("Please select a observation Location");
        } else {
            resetIsClickFromFilterResult();
            //UI display change
            dateMenuHide();
            if (document.getElementById('workset').style.display == "none") {
                $("#workset").show();
                $("#homepage").hide();
                $("#homepage").empty();
                if (document.getElementById("mapid").childNodes.length == 0) {
                    mapInit();
                }
            }
            enableControlPanel();

            //need to clean old setting
            if(getDataset()!=null && activeDatasetTmp != null && getDataset() != activeDatasetTmp){
                console.log(activeDatasetTmp);
                switch(getDataset()){
                    //switch from activation
                    case DATA_ACTIVATION:
                        //un-pressed every mode btn
                        $("#mode button.active").each(function(){
                            console.log($(this).attr('id'));
                            unactiveModeBtn($(this));
                            $(this).removeClass('active');
                        });
                        //close overlay
                        closeDealer();
                        closeService();
                        break;
                    //switch from lifezone
                    case DATA_LIFEZONE:
                        if(isModeActive(MODE_LIFEZONE)){
                            removeHeatMap();
                            setModeOff(MODE_LIFEZONE);
                            console.log('lifezone off');
                        }
                        break;
                }
                setDataset(activeDatasetTmp);
                console.log('diff');
            }
            
            //clone decided filter from tmpFilter
            //then clear tmp filter
            observeTarget = observeTargetTmp.slice();
            console.log("observeTarget:");
            console.log(observeTarget);

            observeTargetDeviceOnly = observeTargetDeviceOnlyTmp.slice();

            observeLoc = observeLocTmp.slice();
            console.log("observeLoc:");
            console.log(observeLoc);

            observeLocFullName = observeLocFullNameTmp.slice();
            console.log("observeLocFullName:");
            console.log(observeLocFullName);

            observeSpec = jQuery.extend({}, observeSpecTmp);
            console.log("observeSpec:");
            console.log(observeSpec);

            filterRecordClean();
            filterRecord();

            saveLog();
            
            switch(getDataset()){
                case DATA_ACTIVATION:
                    //filter data collection
                    var from = $("#from").datepicker("getDate");
                    var to = $("#to").datepicker("getDate");
                    //console.log(from);

                    firstMap.fromFormatStr = (from.getFullYear() + "-" + (from.getMonth() + 1) + "-" + from.getDate());
                    firstMap.toFormatStr = (to.getFullYear() + "-" + (to.getMonth() + 1) + "-" + to.getDate());

                    //default mode = region
                    if ($("#mode button#gap").hasClass("active")) {
                        if(!isGapButtonCanShow){
                            setModeOn(MODE_REGION);
                            modeBtnPress($("button#region"));
                            filterRecordClean();
                            filterRecord();
                        }else{
                            submitGap();
                        }
                    }
                    if ($("#mode button#comparison").hasClass("active") || $("#compare").prop("checked")) {
                        if (!$("button#comparison").hasClass("active"))
                            modeBtnPress($("button#comparison"));
                        //$("button#comparison").toggleClass("active");

                        needToLoadTwoModeSameTime = (isRegionMarkerSametime()) ? true : false;
                        console.log("needToLoadTwoModeSameTime:" + needToLoadTwoModeSameTime);

                        var from = $("#from_compare").datepicker("getDate");
                        var to = $("#to_compare").datepicker("getDate");
                        comparisonMap.fromFormatStr = (from.getFullYear() + "-" + (from.getMonth() + 1) + "-" + from.getDate());
                        comparisonMap.toFormatStr = (to.getFullYear() + "-" + (to.getMonth() + 1) + "-" + to.getDate());

                        submitComparision();
                        //map zoom in
                        firstMap.zoomToSelectedLocation();
                        comparisonMap.zoomToSelectedLocation();

                        //console.log("compareFromFormatStr:"+compareFromFormatStr+"/"+"compareToFormatStr:"+compareToFormatStr);
                    }
                    if ($("#mode button.active").length == 0 || $("button#region").hasClass("active")) {
                        setModeOn(MODE_REGION);
                        if (!$("button#region").hasClass("active"))
                            modeBtnPress($("button#region"));
                        //$("button#region").toggleClass("active");

                        needToLoadTwoModeSameTime = (isRegionMarkerSametime()) ? true : false;
                        console.log("needToLoadTwoModeSameTime:" + needToLoadTwoModeSameTime);

                        comparisonMap.fromFormatStr = undefined;
                        comparisonMap.toFormatStr = undefined;

                        firstMap.zoomToSelectedLocation();
                        submitRegion();
                    }
                    if ($("button#marker").hasClass("active")) {
                        if (!$("button#marker").hasClass("active"))
                            modeBtnPress($("button#marker"));
                        //$("button#marker").toggleClass("active");

                        needToLoadTwoModeSameTime = (isRegionMarkerSametime()) ? true : false;
                        console.log("needToLoadTwoModeSameTime:" + needToLoadTwoModeSameTime);

                        comparisonMap.fromFormatStr = undefined;
                        comparisonMap.toFormatStr = undefined;

                        firstMap.zoomToSelectedLocation();
                        submitMarker();
                    }
                    //button class reset

                    if (isServiceLayerShowing) {
                        openService();
                    }

                    if (isDealerLayerShowing) {
                        openDealer();
                    }
                    
                    //reset time section button
                    $("#timeSection button").each(function () {
                        $(this).removeClass("btn_pressed").addClass("btn_unpressed");
                    });
                    
                    //decide whether need to show dist/branch filter or not
                    if(isGapButtonCanShow && !isDistBranchSelected){
                        $('button#gap').show();
                    }else{
                        $('button#gap').hide();
                    }
                    break;
                case DATA_LIFEZONE:
                    firstMap.zoomToSelectedLocation();
                    submitHeatMap();
                    break;
            }
            
            clearFilterResult();
            showFilterResult();
        }
    });
}

function modeBtnPress($this) {
    $(".mode.active").each(function () {
        unactiveModeBtn($(this));
    });
    $(".mode.active").removeClass("active");

    $this.addClass("active");
}

function submitGap(){
    loading("Data loading...");
    observeBranchName = ['all'];
    ajaxGetGapData(function() {
        ajaxGetBranchObject (function() {
            ajaxFetchMapValue(false,false);
        });
    });
}

function submitRegion() {
    loading("Data loading...");
    if (observeTarget.length == 0) {
        firstMap.info.update();
        //initMapProperties();
        firstMap.cleanMap();
        //removePolygonMap(false);
        loadingDismiss();
        //enableResultBtn();
    } else {
        ajaxGetBranchObject(function(){
            //same world region, no need to re-fetch/*
            if (JSON.stringify(firstMap.currentRegionIso) == JSON.stringify(observeLoc) && !isMapModified) {
                console.log("same world region");
                if (observeTarget.length != 0) {
                    ajaxFetchMapValue(false, false);
                } else {
                    loadingDismiss();
                }
            } else {
                console.log("diff world region");
                ajaxExtractMap(false, ajaxFetchMapValue, [false, false]);
            }
        });
    }
    //button class reset
    $("#timeSection button").each(function () {
        $(this).removeClass("btn_pressed").addClass("btn_unpressed");
    });
}

function submitMarker() {
    loading("Data loading...");
    ajaxGetMarker();

    firstMap.info.update();

    //button class reset
    $("#timeSection button").each(function () {
        $(this).removeClass("btn_pressed").addClass("btn_unpressed");
    });
}

function submitComparision() {
    loading("Data loading...");
    if (!$("#mapidComparison").is(":visible"))
        $("#mapidComparison").show();

    comparisionMapResize();
    mapInit();
    mapComparisionInit();
    if (observeTarget.length == 0) {
        firstMap.info.update();
        comparisonMap.info.update();
        
        firstMap.cleanMap();
        comparisonMap.cleanMap();

        loadingDismiss();
        enableResultBtn();
    } else {
        if (JSON.stringify(firstMap.currentRegionIso) == JSON.stringify(observeLoc) && JSON.stringify(comparisonMap.currentRegionIso) == JSON.stringify(observeLoc)) {
            console.log("same world region");
            if (observeTarget.length != 0) {
                ajaxFetchMapValue(true, false);
            } else {
                firstMap.info.update();
                comparisonMap.info.update();
                firstMap.cleanMap();
                comparisonMap.cleanMap();
                loadingDismiss();
            }
        } else {
            console.log("diff world region");
            ajaxExtractMap(true, ajaxFetchMapValue, [true, false]);
        }
    }
    //button class reset
    $("#timeSection button").each(function () {
        $(this).removeClass("btn_pressed").addClass("btn_unpressed");
    });
}

function submitHeatMap(){
    setModeOn(MODE_LIFEZONE);
    ajaxGetHeatMap();
}

function collapseBtnInit() {
    var selector = $(".filter_wrapper");
    var toggleBtn = $("#toggle");
    var toggleBtnIcon = $("#toggle #toggleIcon");
    var rightSideArea = $("#rightSideArea");
    var pos = selector.offset();
    var toggleBtnLeft = pos.left + selector.width() + 5;
    var toggleBtnTop = pos.top;
    toggleBtn.css({
        "left": '' + toggleBtnLeft + 'px',
        "top": ''+toggleBtnTop + 'px',
    });

    toggleBtn.click(function () {
        toggleBtn.hide();
        //collapse
        if (selector.is(":visible")) {
            toggleBtnIcon.removeClass("ui-icon-carat-1-w").addClass("ui-icon-carat-1-e");
            selector.hide("slide", {
                direction: "left"
            }, 300, function () {
                $('#selector').hide();
                
                //togglebtn pos update
                toggleBtn.css({
                    "left": '0px',
                    "top": ''+toggleBtnTop + 'px',
                });
                toggleBtn.fadeIn();

                //layout update
                rightSideArea.animate({
                    width: "99%"
                }, 200, "linear", function () {
                    comparisionMapResize();
                });
            });
        }
        //show up
        else {
            $('#selector').show();
            rightSideArea.css("width", "80%");
            toggleBtnIcon.removeClass("ui-icon-carat-1-e").addClass("ui-icon-carat-1-w");
            selector.show("slide", {
                direction: "left"
            }, 300, function () {
                //togglebtn pos update
                toggleBtn.css({
                    "left": '' + toggleBtnLeft + 'px',
                    "top": ''+toggleBtnTop + 'px',
                });
                toggleBtn.fadeIn();

                //layout update
                comparisionMapResize();
            });

        }
    });
}

function showTable() {
    loading("Creating Table...");
    if (JSON.stringify(firstMap.currentRegionIso) == JSON.stringify(observeLoc)) {
        console.log("same region");
        ajaxFetchTableValue(false);
    } else {
        console.log("diff region");
        ajaxExtractMap(false, ajaxFetchTableValue, [false]);
    }
}

function closeTable() {
    $("#workset").show();
    $("#homepage").hide();
    $("#homepage").empty();
}

function enableControlPanel() {
    $("#control_Panel button").removeAttr("disabled");
}