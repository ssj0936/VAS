"use strict";

function buttonInit() {
    //control panel button init
    $("#databtn button,#filterResult button,button.date").button();
    
//    $('li#account').click(function(){
//        showAlert(getFunction());
//    });
    
    //dataset selector init
    $( "#dataset" ).selectmenu({
        width: '102%',
        change: function( event, data ) {
            //not allow switching while loading
            if (isLoading()) return;
            var dataSet = data.item.value;
            activeFunctionTmp = dataSet;
//            var updatetime = updateTime.dataSet;
            switch(dataSet){
                    case "activation":
                        //show date button
                        $('#dateContainer').show('medium');
                        //control panel switch
                        $('.controlPanel').hide();
                        $('.control_panel_right').hide();
                        $('#activationControlPanel').show("medium");
                    
                        if(isDistBranchFilterShowing){
                            //data delete
                            observeDistBranch.length = 0;
                            //UI remove
                            destroyDistBranchCheckBox();
                        }
                        checkboxLocationInit(allLoc);
                        break;
                    case "lifezone":
                        //hide date button
                        $('#dateContainer').hide();
                        //control panel switch
                        $('.controlPanel').hide();
                        $('.control_panel_right').hide();
                        $('#lifezoneControlPanel').show("medium");
                    
                        if(isDistBranchFilterShowing){
                            //data delete
                            observeDistBranch.length = 0;
                            //UI remove
                            destroyDistBranchCheckBox();
                        }
                        checkboxLocationInit(allLoc);
                        
                        break;
                    case "qc":
                        //hide date button
                        $('#dateContainer').hide();
                        //control panel switch
                        clearControlPanel();
                        $('.controlPanel').hide();
                        $('.control_panel_right').hide();
                        $('#qcControlPanel').show("medium");
                    
                        if(isDistBranchFilterShowing){
                            //data delete
                            observeDistBranch.length = 0;
                            //UI remove
                            destroyDistBranchCheckBox();
                        }
                        break;

                    case "activationTable":
                        //show date button
                        $('#dateContainer').show('medium');
                        //control panel switch
                        $('.controlPanel').hide();
                        $('.control_panel_right').hide();
                    
                        if(isDistBranchFilterShowing){
                            //data delete
                            observeDistBranch.length = 0;
                            //UI remove
                            destroyDistBranchCheckBox();
                        }
                        checkboxLocationInit(allLoc);
                        break;
                    
                case "distBranch":
                        //show date button
                        $('#dateContainer').show('medium');
                        //control panel switch
                        clearControlPanel();
                        $('.controlPanel').hide();
                        $('.control_panel_right').hide();
                        $('#activationControlPanel').show("medium");
                        
                        var needToShowDistBranch = false;
                        for(var i in observeLocTmp){
                            if(countryNeedToShowDistBranch.indexOf(observeLocTmp[i]) != -1){
                                needToShowDistBranch = true;
                                break;
                            }
                        }
                        //create dist branch filter
                        if(needToShowDistBranch && observeLocTmp.length == 1){
                            if(!isDistBranchFilterShowing){
                                isDistBranchFilterShowing = true;
                                //filter show up
                                $('#section_branch_dist').stop(true,true).fadeIn('medium');
                                $('#section_branch_dist').collapsible('open');

                                ajaxLoadBranchDist();
                            }
                        }else{
                            if(isDistBranchFilterShowing){
                                //data delete
                                observeDistBranch.length = 0;
                                //UI remove
                                destroyDistBranchCheckBox();
                            }
                        }
                        checkboxLocationInit(distBranchLoc);
                        break;
                    
                case "gap":
                        //show date button
                        $('#dateContainer').show('medium');
                        //control panel switch
                        clearControlPanel();
                        $('.controlPanel').hide();
                        $('.control_panel_right').show('medium');
                        
                        if(isDistBranchFilterShowing){
                            //data delete
                            observeDistBranch.length = 0;
                            //UI remove
                            destroyDistBranchCheckBox();
                        }
                        checkboxLocationInit(gapLoc);
                        break;
            }
        }
     });

    //date button 
    $("button.date").button({
        icons: {
            secondary: "ui-icon-carat-1-s",
        }
    }).css({
        width: '100%',
//        width: '260px'
    });
    
    //section_more
    $('#moreFilterContainer').css({
        "left" : ''+($('#section_more').position().left + $('.filter_wrapper').width()) + 'px',
        "top" : '' + $('#section_more').position().top + 'px',
        "width" : '' + $('.filter_wrapper').width() + 'px',
    });
    $('#section_more').click(function(){
        var target = $('#moreFilterContainer');
        
        if(target.is(':visible')){
            target.hide();
        }else{
            $('#moreFilterContainer').css({
                "left" : ''+($('#section_more').position().left + $('.filter_wrapper').width()) + 'px',
                "top" : '' + $('#section_more').position().top + 'px',
                "width" : '' + $('.filter_wrapper').width() + 'px',
            });
            
            $('#moreFilterContainer').fadeIn('medium');
        }
    });
    
    $(document.body).click(function (e) {
        //console.log(e.target);
        //click target is not dropdown menu
        if ((!$("#moreFilterContainer").is(e.target) && $("#moreFilterContainer").has(e.target).length === 0)) {
            //click target is not date button & datepicker is not showing
            if (!$("#section_more").is(e.target) && $("#section_more").has(e.target).length === 0) {
                //if menu is showing, hide it
                if (!$('#moreFilterContainer').is(':hidden')) {
                    $('#moreFilterContainer').fadeOut(300);
                    //console.log("need to hide");
                }
            }
        }
    });
    
    actiationControlPanelInit();
    lifezoneControlPanelInit();
    qcControlPanelInit();
    rightControlPanelInit();
}

function clearControlPanel(){
    $('.controlPanel').find('button').removeClass('active');
    lifezoneButtonsetRefresh();
    actiationControlPanelRefresh();
}

function rightControlPanelInit(){
    $("button.rightPanelButton ").button();
    $("button.rightPanelButton").click(gapReportExportDialogShow);
}

function qcControlPanelInit(){
    $("#qcControlPanel button").button();
    $("#qcControlPanel button").css({
        width: '100px'
    });
    
    $( "#qcCategory" ).selectmenu({
        width: '100px',
        change: function( event, data ) {
            currentCategory = data.item.value;
            rePaintCFR();
        }
    });
    
    //qcMode
    $('#qcMode button').click(function(){
        if (isLoading()) return;

        var pressedTarget = $(this);
        //buttonset switch

        if (pressedTarget.hasClass("active")) {
            pressedTarget.removeClass("active");
            unactiveModeBtn($(this));
        } else {
            pressedTarget.addClass("active");
            activeModeBtn($(this));
        }
    });
    
    //qcView
    $('#qcView button').click(function(){
        if (isLoading()) return;
        radioButtonClick($('#qcView'),$(this));
        if (isModeActive(MODE_QC_REGION)) {
            submitSQRegion($(this).attr('data-value'));
        }
        if (isModeActive(MODE_QC_MARKER)) {
            submitSQMarker($(this).attr('data-value'));
        }
    });
}

function lifezoneControlPanelInit(){
    //lifezone time button setting
    $('div#lifezoneWeekDayBtnset button').click(function(){
        if (isLoading()) return;
        
        radioButtonClick($('div#lifezoneWeekDayBtnset'),$(this));
        
        lifeZoneTime.week = $(this).attr('data-value');
        if (isDifferentTime() && !$.isEmptyObject(heatmapLayer)) {
            ajaxGetHeatMap();
        }
    });
    
    $('div#lifezonePartOfDayBtnset button').click(function(){
        if (isLoading()) return;
        
        radioButtonClick($('div#lifezonePartOfDayBtnset'),$(this));
        
        lifeZoneTime.time = $(this).attr('data-value');
        if (isDifferentTime() && !$.isEmptyObject(heatmapLayer)) {
            ajaxGetHeatMap();
        }
    });
    
    $('div#lifezoneWeekDayBtnset').buttonset();
    $('div#lifezonePartOfDayBtnset').buttonset();
    
    $('div#lifezoneWeekDayBtnset').buttonset( "disable" );
    $('div#lifezonePartOfDayBtnset').buttonset( "disable" );
    
    lifezoneButtonsetRefresh();
    
}

function lifezoneButtonsetValueReset(){
    lifeZoneTime.time = 1;
    lifeZoneTime.week = 1;
}

function lifezoneButtonsetRefresh(){
    $('div#lifezoneWeekDayBtnset button').removeClass('active');
    $('div#lifezonePartOfDayBtnset button').removeClass('active');
    
    $('div#lifezoneWeekDayBtnset button[data-value="'+lifeZoneTime.week+'"]').addClass('active');
    $('div#lifezonePartOfDayBtnset button[data-value="'+lifeZoneTime.time+'"]').addClass('active');
}

function actiationControlPanelInit(){
    //button init
    $("#activationControlPanel button").button();
    $("#activationControlPanel button").css({
        width: '100px'
    });
    
    //disable first
    $("#mode button,#overlay button").attr("disabled", "disabled");
    
    //activation mode btn setting
    var modeBtns = $("#mode button");
    modeBtns.click(function () {
        if (isLoading()) return;

        //table button
//        if ($(this).attr("id") == "table") {
//            if (!$(this).hasClass('active')) {
//                if(getFunction() == FUNC_GAP)
//                    gapReportExportDialogShow();
//                else
//                    showTable();
//                return;
//            }
//        }
        
        //if comparison date doesnt set in comparison mode
        if ($(this).attr("id") == 'comparison' && comparisonMap.fromFormatStr == undefined && comparisonMap.toFormatStr == undefined) {
            showAlert("plz select comparison Data...");
            return;
        }
        
        //check ehwther clicking the same btn or not
        var isCurrentButtonSet = (isModeActive(MODE_REGION) || isModeActive(MODE_MARKER)) ? true : false;
        var isTargetButtonSet = ($(this).attr("id") == 'region' || $(this).attr("id") == 'marker') ? true : false;
        if ((!isCurrentButtonSet && !isTargetButtonSet) && $(this).hasClass("active")) return;
        
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
    
    //init mode
    $("#activation").addClass("active");
    setFunction(FUNC_ACTIVATION);
}

function actiationControlPanelRefresh(){
    $("#mode button").removeClass("active");
    
    var modeList = [MODE_MARKER,/*MODE_COMPARISION*/,MODE_REGION,/*MODE_GAP*/];
    for(var i in modeList){
        var mode = modeList[i];
        
        if(isModeActive(mode)){
            $("#mode button#"+mode).addClass("active");
        }
    }
    
}

function radioButtonClick($buttonset,$this){
    $buttonset.children('button').removeClass('active');
    $this.addClass('active');
}

function unactiveModeBtn($this) {
    switch ($this.attr("id")) {
        case "region":
            //console.log("region");
            firstMap.removePolygonMap();
            setModeOff(MODE_REGION);
            firstMap.info.update();
            if(firstMap.hasSnapshotBtn){
                firstMap.removeSnapshot();
            }
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
            break;
        case "qcRegion":
            removeSQRegion();
            setModeOff(MODE_QC_REGION);
            break;
        case "qcMarker":
            removeSQMarker();
            setModeOff(MODE_QC_MARKER);
            break;
    }
}

function activeModeBtn($this) {
    switch ($this.attr("id")) {
        case "region":
            if(!firstMap.hasSnapshotBtn){
                firstMap.addSnapshot();
            }
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
            submitGap();
            break;
        case "qcRegion":
            submitSQRegion();
            break;
        case "qcMarker":
            submitSQMarker();
            break;
    }
}

function timePeriodBtnSetting() {
//    document.getElementById("btnToday").onclick = function () {
//        onDatepickerMaxMinReset();
//        var today = new Date();
//
//        $("#from").datepicker("setDate", today);
//
//        today.setDate(today.getDate() + 1);
//        $("#to").datepicker("setDate", today);
//
//        onChangeTrigger();
//        pressToggle(this);
//    }
//
//    document.getElementById("btnYesterday").onclick = function () {
//        onDatepickerMaxMinReset();
//        var day = new Date();
//        day.setDate(day.getDate() - 1);
//
//        $("#from").datepicker("setDate", day);
//        $("#to").datepicker("setDate", new Date());
//        onChangeTrigger();
//        pressToggle(this);
//    }

    document.getElementById("btnLastSeven").onclick = function () {
        onDatepickerMaxMinReset();
        var day = new Date(getUpdateTime());
        day.setDate(day.getDate() - 7);
        $("#from").datepicker("setDate", day);
        $("#to").datepicker("setDate", new Date(getUpdateTime()));
        onChangeTrigger();
        pressToggle(this);
    }

    document.getElementById("btnLastThirty").onclick = function () {
        onDatepickerMaxMinReset();
        var day = new Date(getUpdateTime());
        day.setDate(day.getDate() - 30);
        $("#from").datepicker("setDate", day);
        $("#to").datepicker("setDate", new Date(getUpdateTime()));
        onChangeTrigger();
        pressToggle(this);
    }

//    document.getElementById("btnThisMonth").onclick = function () {
//        onDatepickerMaxMinReset();
//        var day = new Date();
//
//        var mm = day.getMonth() + 1;
//        var yyyy = day.getFullYear();
//
//        if (mm < 10) {
//            mm = '0' + mm;
//        }
//
//        var fromDate = new Date(yyyy + '-' + mm + '-01');
//        var toDate = new Date(yyyy + '-' + mm + '-01');
//        toDate.setMonth(toDate.getMonth() + 1);
//        toDate.setDate(toDate.getDate() - 1);
//
//        $("#from").datepicker("setDate", fromDate);
//        $("#to").datepicker("setDate", toDate);
//        onChangeTrigger();
//        pressToggle(this);
//    }
//
//    document.getElementById("btnLastMonth").onclick = function () {
//        onDatepickerMaxMinReset();
//        var day = new Date();
//
//        var mm = day.getMonth() + 1;
//        var yyyy = day.getFullYear();
//
//        //back shift one month
//        if (mm < 1) {
//            mm = 12;
//            --yyyy;
//        } else {
//            --mm;
//        }
//
//        if (mm < 10) {
//            mm = '0' + mm;
//        }
//
//        var fromDate = new Date(yyyy + '-' + mm + '-01');
//        var toDate = new Date(yyyy + '-' + mm + '-01');
//        toDate.setMonth(toDate.getMonth() + 1);
//        toDate.setDate(toDate.getDate() - 1);
//
//        $("#from").datepicker("setDate", fromDate);
//        $("#to").datepicker("setDate", toDate);
//        onChangeTrigger();
//        pressToggle(this);
//    }
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
    $('#dealer').click(function(){
        if (isLoading()) return;
        dealerSubmit();
    });
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
    
    $('button#dateOK').click(dateMenuHide);

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
//        "width": '250px',
        "z-index": 9999,
    });
    dropdown.fadeIn(300);
}

function dateMenuHide() {
    console.log('11111111');
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
    $("#submit").click(function () {
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
            //init
            if (document.getElementById('workset').style.display == "none") {
                $("#workset").show();
                $("#homepage").hide();
                $("#homepage").empty();
                if (document.getElementById("mapid").childNodes.length == 0) {
                    mapInit();
                }
//                enableControlPanel();
            }
            
            //if change dataset
            //need to clean old setting
            if(getFunction() != null && activeFunctionTmp != null && getFunction() != activeFunctionTmp){
                console.log('switch to '+activeFunctionTmp);
                switch(getFunction()){
                    //switch from activation
                    case FUNC_DISTBRANCH:
                    case FUNC_ACTIVATION:
                        console.log('switch from '+FUNC_ACTIVATION);
                        //un-pressed every mode btn
                        $("#mode button.active").each(function(){
                            console.log($(this).attr('id'));
                            unactiveModeBtn($(this));
                            $(this).removeClass('active');
                        });
                        firstMap.currentRegionIso = [];
                        disableModeAndOverlay();
                        //close overlay
                        closeDealer();
                        closeService();
                        break;
                    //switch from lifezone
                    case FUNC_LIFEZONE:
                        console.log('switch from '+FUNC_LIFEZONE);
                        removeHeatMap();
                        disableLifezoneControl();
//                            enableModeAndOverlay();

                        firstMap.addSnapshot();
                        break;
                    case FUNC_ACTIVATION_TABLE:
                        console.log('switch from '+FUNC_ACTIVATION_TABLE);
                        $('#tableContainer').empty();
                        break;
                        
                    case FUNC_GAP:
                        console.log('switch from '+FUNC_GAP);
                        //change table button text
                        $('#table').button('option','label','Table');
                        firstMap.currentRegionIso = [];
                        firstMap.removePolygonMap();
                        cleanBranch();
                        break;
                    case FUNC_QC:
                        console.log('switch from '+FUNC_QC);
                        //change table button text
                        $('#table').button('option','label','Table');
                        firstMap.currentRegionIso = [];
                        firstMap.removePolygonMap();
                        removeSQMarker();
                        removeSQRegion();
                        mapInit();
                        break;
                }
                setFunction(activeFunctionTmp);
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

            //filter data collection
            var from = $("#from").datepicker("getDate");
            var to = $("#to").datepicker("getDate");
            //console.log(from);

            firstMap.fromFormatStr = (from.getFullYear() + "-" + (from.getMonth() + 1) + "-" + from.getDate());
            firstMap.toFormatStr = (to.getFullYear() + "-" + (to.getMonth() + 1) + "-" + to.getDate());
            
            saveLog();
//            console.log(getFunction());
            switch(getFunction()){
                case FUNC_ACTIVATION:
                case FUNC_DISTBRANCH:
                    
                    if(getFunction() == FUNC_DISTBRANCH 
                      && $('input[name="branchDist"]:checked').length == 0
                      && $('input[name="distBranch"]:checked').length == 0
                      && $('input[name="onlineDist"]:checked').length == 0){
                        showAlert('plz check any dist/branch');
                        break;
                    }
                    
                    $('#tableContainer').hide();
                    $('#workset').show('medium');
                    
//                    if(getFunction() == FUNC_ACTIVATION)
                        enableModeAndOverlay();

                    //default mode = region
//                    if ($("#mode button#gap").hasClass("active")) {
//                        if(!isGapButtonCanShow){
//                            setModeOn(MODE_REGION);
//                            modeBtnPress($("button#region"));
//                            filterRecordClean();
//                            filterRecord();
//                        }else{
//                            submitGap();
//                            firstMap.zoomToSelectedLocation();
//                        }
//                    }
//                    if ($("#mode button#comparison").hasClass("active") || $("#compare").prop("checked")) {
//                        if (!$("button#comparison").hasClass("active"))
//                            modeBtnPress($("button#comparison"));
//                        //$("button#comparison").toggleClass("active");
//
//                        needToLoadTwoModeSameTime = (isRegionMarkerSametime()) ? true : false;
//                        console.log("needToLoadTwoModeSameTime:" + needToLoadTwoModeSameTime);
//
//                        var from = $("#from_compare").datepicker("getDate");
//                        var to = $("#to_compare").datepicker("getDate");
//                        comparisonMap.fromFormatStr = (from.getFullYear() + "-" + (from.getMonth() + 1) + "-" + from.getDate());
//                        comparisonMap.toFormatStr = (to.getFullYear() + "-" + (to.getMonth() + 1) + "-" + to.getDate());
//
//                        submitComparision();
//                        //map zoom in
//                        firstMap.zoomToSelectedLocation();
//                        comparisonMap.zoomToSelectedLocation();
//
//                        //console.log("compareFromFormatStr:"+compareFromFormatStr+"/"+"compareToFormatStr:"+compareToFormatStr);
//                    }
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
//                    if(isGapButtonCanShow && !isDistBranchSelected){
//                        $('button#gap').show();
//                    }else{
//                        $('button#gap').hide();
//                    }
                    break;
                case FUNC_LIFEZONE:
                    enableLifezoneControl();
                    
                    $('#tableContainer').hide();
                    $('#workset').show('medium');
                    firstMap.zoomToSelectedLocation();
                    submitHeatMap();
                    break;
                    
                case FUNC_ACTIVATION_TABLE:
                    //clear the content
                    $(tableContainer).empty();
                    
                    //hide map
                    $('#workset').hide();
                    $('#tableContainer').show('medium');
                    
                    showTable();
                    
                    break;
                    
                case FUNC_GAP:
                    if(!isGapButtonCanShow){
                        showAlert('GAP mode only supported in single selected country');
                        return;
                    }
                    
                    $('#tableContainer').hide();
                    $('#workset').show('medium');
                    submitGap();
                    firstMap.zoomToSelectedLocation();
                    break;

                case FUNC_QC:
                    $('#tableContainer').hide();
                    $('#workset').show('medium');
                    if ($("#qcMode button.active").length == 0 || $("button#qcRegion").hasClass("active")) {
                        setModeOn(MODE_QC_REGION);
                        if (!$("button#qcRegion").hasClass("active"))
                            modeBtnPress($("button#qcRegion"));

                        submitSQRegion();
                    }
                    if ($("button#qcMarker").hasClass("active")) {
                        if (!$("button#qcMarker").hasClass("active"))
                            modeBtnPress($("button#qcMarker"));

                        submitSQMarker();
                    }
                    $("button#qcMucModule").addClass("active");
                    needToLoadTwoModeSameTime = (isRegionMarkerSametime()) ? true : false;
                    console.log("needToLoadTwoModeSameTime:" + needToLoadTwoModeSameTime);
                    firstMap.zoomToSelectedLocation();
                    break;
            }
            //text in date button
            var buttonStr = ($('button.btn_pressed').length == 0) ? "" : ("<br>(" + $('button.btn_pressed').children('span').text() + ")");
            $('button.date').button('option', 'label', (isModeActive(MODE_COMPARISION)) ? "Date" : (firstMap.fromFormatStr + "~<br>" + firstMap.toFormatStr + buttonStr));
            
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
    
//    console.log(firstMap.currentRegionIso);
//    console.log(observeLoc);
//    console.log(isMapModified);
    
    //button class reset
    $("#timeSection button").each(function () {
        $(this).removeClass("btn_pressed").addClass("btn_unpressed");
    });
    
    if (observeTarget.length == 0) {
        firstMap.info.update();
        firstMap.removePolygonMap();
        cleanBranch();
        loadingDismiss();
        return;
    }
    
    if (JSON.stringify(firstMap.currentRegionIso) == JSON.stringify(observeLoc)) {
        console.log("same world region");
        ajaxGetGapData(function() {
            ajaxGetBranchObject (function() {
                ajaxFetchMapValue(false,false);
            });
        });
    } else {
        console.log("diff world region");
        ajaxExtractMap(false, function(){
                ajaxGetGapData(function() {
                    ajaxGetBranchObject (function() {
                        ajaxFetchMapValue(false,false);
                    });
                });
            }, [false, false]);
    }
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
        if (JSON.stringify(firstMap.currentRegionIso) == JSON.stringify(observeLoc) 
            && JSON.stringify(comparisonMap.currentRegionIso) == JSON.stringify(observeLoc)) {
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
    ajaxGetHeatMap();
}

function submitSQRegion(view){
    setModeOn(MODE_QC_REGION);
    if (observeTarget.length == 0) {
        firstMap.info.update();
        firstMap.cleanMap();
        loadingDismiss();
    } else {
        //same world region, no need to re-fetch/*
        if (JSON.stringify(firstMap.currentRegionIso) == JSON.stringify(observeLoc) && !isMapModified) {
            console.log("same world region");
            if (observeTarget.length != 0) {
                ajaxGetSQRegion(view);
            } else {
                loadingDismiss();
            }
        } else {
            console.log("diff world region");
            ajaxExtractMap(false, ajaxGetSQRegion, view);
        }
    }
}

function submitSQMarker(view){
    setModeOn(MODE_QC_MARKER);
    ajaxGetSQMarker(view);
}
function collapseBtnInit() {
    // left side filter toggle
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
                rightSideArea.removeClass('col-xs-10').addClass('col-xs-12');
                comparisionMapResize();
//                rightSideArea.animate({
//                    width: "99%"
//                }, 200, "linear", function () {
//                    comparisionMapResize();
//                });
            });
        }
        //show up
        else {
            $('#selector').show();
            rightSideArea.removeClass('col-xs-12').addClass('col-xs-10');
//            rightSideArea.css("width", "80%");
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
    
    // up side filter toggle
    var toggleTopBtn = $('li#toggleControlPanel');
    var toggleTopBtnIcon = $('span#toggleControlPanelIcon')
    var controlPanelTop = $('div#control_Panel');
    toggleTopBtn.click(function(){
        toggleTopBtnIcon.toggleClass("glyphicon-menu-up").toggleClass("glyphicon-menu-down");
        //collaspe
        if(toggleTopBtnIcon.hasClass('glyphicon-menu-down')){
            controlPanelTop.stop(true,true).slideUp("medium",function(){
                optMapSize();
                comparisionMapResize();
            });
        }
        //show up
        else{
            controlPanelTop.stop(true,true).slideDown("medium",function(){
                optMapSize();
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
        ajaxFetchTableValue(true);
    }
}

function enableControlPanel() {
//    console.log('enable ControlPanel');
    $("#control_Panel button").removeAttr("disabled");
}

function disableModeAndOverlay() {
//    console.log('disable activation');
    $("#mode button").attr("disabled",true);
    $("#overlay button").attr("disabled",true);
}

function enableModeAndOverlay() {
//    console.log('enable activation');
    $("#mode button").removeAttr("disabled");
    $("#overlay button").removeAttr("disabled");
}

function disableLifezoneControl() {
//    console.log('disable lifezone');
    $('div#lifezoneWeekDayBtnset').buttonset( "disable" );
    $('div#lifezonePartOfDayBtnset').buttonset( "disable" );
}

function enableLifezoneControl() {
//    console.log('enable lifezone');
    $('div#lifezoneWeekDayBtnset').buttonset( "enable" );
    $('div#lifezonePartOfDayBtnset').buttonset( "enable" );
}

function helpBtnSetting() {
    $('li#help').click(function () {
        window.open("https://asus-my.sharepoint.com/personal/ian_tseng_asus_com/_layouts/15/guestaccess.aspx?guestaccesstoken=BU2IOjBOaDRC1SYG3Zbl8oleTaILoQ%2bJ2dqLlFxSDRU%3d&docid=06088da14c0af498f9fdda46073db83d9&rev=1");
    });
}