"use strict";

var isFunctionSelectorInit = false;

function buttonInit() {
    //control panel button init
    $("#databtn button,#filterResult button,button.date").button();

    //    $('li#account').click(function(){
    //        showAlert(getFunction());
    //    });

    //dataset selector init
    $("#dataset").selectmenu({
        width: '102%',
        disabled: true,
        create: function (event, ui) {
            isFunctionSelectorInit = true;
        },
        change: function (event, data) {
            //not allow switching while loading
            if (isLoading())
                return false;

            var dataSet = data.item.value;
            activeFunctionTmp = dataSet;

            controlPanelDisplayRefresh(dataSet);
            switch (dataSet) {
            case FUNC_GAP:
                if (isDistBranchFilterShowing) {
                    //data delete
                    observeDistBranch.length = 0;
                    //UI remove
                    destroyDistBranchCheckBox();
                }
                checkboxLocationInit(gapLoc);

                break;

            case FUNC_DISTBRANCH:
                var needToShowDistBranch = false;
                for (var i in observeLocTmp) {
                    if (countryNeedToShowDistBranch.indexOf(observeLocTmp[i]) != -1) {
                        needToShowDistBranch = true;
                        break;
                    }
                }
                //create dist branch filter
                if (needToShowDistBranch && observeLocTmp.length == 1) {
                    if (!isDistBranchFilterShowing) {
                        isDistBranchFilterShowing = true;
                        //filter show up
                        $('#section_branch_dist').stop(true, true).fadeIn('medium');
                        $('#section_branch_dist').collapsible('open');

                        ajaxLoadBranchDist();
                    }
                } else {
                    if (isDistBranchFilterShowing) {
                        //data delete
                        observeDistBranch.length = 0;
                        //UI remove
                        destroyDistBranchCheckBox();
                    }
                }
                checkboxLocationInit(distBranchLoc);
                break;

            default:
                if (isDistBranchFilterShowing) {
                    //data delete
                    observeDistBranch.length = 0;
                    //UI remove
                    destroyDistBranchCheckBox();
                }
                checkboxLocationInit(allLoc);

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
        "left": '' + ($('#section_more').position().left + $('.filter_wrapper').width()) + 'px',
        "top": '' + $('#section_more').position().top + 'px',
        "width": '' + $('.filter_wrapper').width() + 'px',
    });
    $('#section_more').click(function () {
        var target = $('#moreFilterContainer');

        if (target.is(':visible')) {
            target.hide();
        } else {
            $('#moreFilterContainer').css({
                "left": '' + ($('#section_more').position().left + $('.filter_wrapper').width()) + 'px',
                "top": '' + $('#section_more').position().top + 'px',
                "width": '' + $('.filter_wrapper').width() + 'px',
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
    parallelControlPanelInit();
    activationTrendControlPanelInit();
    activationDistributedControlPanelInit();
}

function controlPanelDisplayRefresh(dataset) {
    //hide all first
    $('.controlPanel').hide();
    $('.model-plus').show();

    switch (dataset) {
    case FUNC_PARALLEL:
        //hide date button
        $('#dateContainer').hide();
        //control panel switch
        $('.control_panel_right').show();
        $('#parallelControlPanel').show("medium");
        $('#filterCountryContainer').show('medium');
        collapseDeviceDescription();
        recheckDeviceCheckbox();
        break;

    case FUNC_ACTIVATION:
        //show date button
        $('#dateContainer').show('medium');
        //control panel switch
        $('.control_panel_right').hide();
        $('#activationControlPanel').show("medium");
        $('#filterCountryContainer').show('medium');

        break;
    case FUNC_LIFEZONE:
        //hide date button
        $('#dateContainer').hide();
        //control panel switch
        $('.control_panel_right').hide();
        $('#lifezoneControlPanel').show("medium");
        $('#filterCountryContainer').show('medium');

        break;
    case FUNC_QC:
        //hide date button
        $('#dateContainer').hide();
        //control panel switch
        clearControlPanel();
        $('.control_panel_right').hide();
        $('#qcControlPanel').show("medium");
        $('#filterCountryContainer').show('medium');
        collapseDeviceDescription();
        recheckDeviceCheckbox();

        break;

    case FUNC_ACTIVATION_TABLE:
        //show date button
        $('#dateContainer').show('medium');
        //control panel switch
        $('.control_panel_right').hide();
        $('#filterCountryContainer').show('medium');

        break;

    case FUNC_DISTBRANCH:
        //show date button
        $('#dateContainer').show('medium');
        //control panel switch
        clearControlPanel();
        $('.control_panel_right').hide();
        $('#activationControlPanel').show("medium");
        $('#filterCountryContainer').show('medium');

        break;

    case FUNC_GAP:
        //show date button
        $('#dateContainer').show('medium');
        //control panel switch
        clearControlPanel();
        $('.control_panel_right').show('medium');
        $('#filterCountryContainer').show('medium');

        break;

    case FUNC_ACTIVATION_TREND:
        //show date button
        $('#dateContainer').show('medium');
        //control panel switch
        clearControlPanel();
        $('.control_panel_right').show('medium');
        $('#activationTrendControlPanel').show("medium");
        $('#filterCountryContainer').show('medium');

        break;

    case FUNC_ACTIVATION_DISTRIBUTION:
        //show date button
        $('#dateContainer').show('medium');
        //control panel switch
        clearControlPanel();
        $('.control_panel_right').hide();
        $('#activationDistributionControlPanel').show("medium");
        $('#filterCountryContainer').show('medium');

        break;
    }
}

function clearControlPanel() {
    $('.controlPanel').find('button').removeClass('active');
    lifezoneButtonsetRefresh();
    actiationControlPanelRefresh();
}

function rightControlPanelInit() {
    $("button.rightPanelButton#export").button();
    $("button.rightPanelButton#export").click(function () {
        if (getFunction() == FUNC_GAP)
            gapReportExportDialogShow();
        else if (getFunction() == FUNC_PARALLEL)
            trendParallel.parallelReportExport();
    });
}

function qcControlPanelInit() {
    $("#qcControlPanel button").button();
    $("#qcMode button").css({
        width: '100px'
    });
    $("#qcView button").css({
        width: '130px'
    });

    $("#qcCategory").selectmenu({
        width: '100px',
        change: function (event, data) {
            currentCategory = data.item.value;
            rePaintCFR();
        }
    });

    //qcMode
    $('#qcMode button').click(function () {
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
    $('#qcView button').click(function () {
        if (isLoading()) return;
        radioButtonClick($('#qcView'), $(this));
        currentView = $(this).attr('data-value');
        if (isModeActive(MODE_QC_REGION)) {
            submitSQRegion($(this).attr('data-value'));
        }
        if (isModeActive(MODE_QC_MARKER)) {
            submitSQMarker($(this).attr('data-value'));
        }
    });

    disableQCControl();
}

function lifezoneControlPanelInit() {
    //lifezone time button setting
    $('div#lifezoneWeekDayBtnset button').click(function () {
        if (isLoading()) return;

        radioButtonClick($('div#lifezoneWeekDayBtnset'), $(this));

        lifeZoneTime.week = $(this).attr('data-value');
        if (isDifferentTime() && !$.isEmptyObject(heatmapLayer)) {
            ajaxGetHeatMap();
        }
    });

    $('div#lifezonePartOfDayBtnset button').click(function () {
        if (isLoading()) return;

        radioButtonClick($('div#lifezonePartOfDayBtnset'), $(this));

        lifeZoneTime.time = $(this).attr('data-value');
        if (isDifferentTime() && !$.isEmptyObject(heatmapLayer)) {
            ajaxGetHeatMap();
        }
    });

    $('div#lifezoneWeekDayBtnset').buttonset();
    $('div#lifezonePartOfDayBtnset').buttonset();

    $('div#lifezoneWeekDayBtnset').buttonset("disable");
    $('div#lifezonePartOfDayBtnset').buttonset("disable");

    lifezoneButtonsetRefresh();

}

function activationTrendControlPanelInit() {
    $('#activationTrendControlPanel button').css({
        width: '70px'
    });

    $('div#activationTrendBy button').click(function () {
        if (isLoading()) return;
        if ($(this).hasClass('active') && currentTrendBy == $(this).attr('id')) return;

        radioButtonClick($('div#activationTrendBy'), $(this));
        currentTrendBy = $(this).attr('id');

        if (currentTrendBy == MODE_ACTIVATION_TREND_BY_REGION) {
            $('#activationTrendRight').show('medium');
        } else {
            $('#activationTrendRight').hide('medium');
        }

        console.log(currentTrendBy + '/' + currentTrendLevel + '/' + currentTrendTimescale);
    });

    $('div#activationTrendLevel button').click(function () {
        if (isLoading()) return;
        if ($(this).hasClass('active') && currentTrendLevel == $(this).attr('id')) return;
        currentTrendLevel = $(this).attr('id');

        radioButtonClick($('div#activationTrendLevel'), $(this));
        console.log(currentTrendBy + '/' + currentTrendLevel + '/' + currentTrendTimescale);
    });

    $('div#activationTrendTimeScale button').click(function () {
        if (isLoading()) return;
        if ($(this).hasClass('active') && currentTrendTimescale == $(this).attr('id')) return;
        currentTrendTimescale = $(this).attr('id');

        radioButtonClick($('div#activationTrendTimeScale'), $(this));
        console.log(currentTrendBy + '/' + currentTrendLevel + '/' + currentTrendTimescale);
    });

    $('div#activationTrendBy').buttonset();
    $('div#activationTrendLevel').buttonset();
    $('div#activationTrendTimeScale').buttonset();

    $('div#activationTrendBy').buttonset("disable");
    $('div#activationTrendLevel').buttonset("disable");
    $('div#activationTrendTimeScale').buttonset("disable");

    $("#showSelector").selectmenu({
        width: '100px',
        change: function (event, data) {
            var currentValue = data.item.value;
            showAlert(currentValue);
        }
    });
}

function activationDistributedControlPanelInit() {
    $('#activationDistributionControlPanel button').css({
        width: '70px'
    });

    $('div#activationDistributedBy button').click(function () {
        if (isLoading()) return;
        if ($(this).hasClass('active') && currentDistributedBy == $(this).attr('id')) return;

        radioButtonClick($('div#activationDistributedBy'), $(this));
        currentDistributedBy = $(this).attr('id');


        if (currentDistributedBy == MODE_ACTIVATION_DISTRIBUTED_BY_REGION) {
            $('#activationDistributedRight').show('medium');
        } else {
            $('#activationDistributedRight').hide('medium');
            submitActivateDistribution();
        }
        //        submitActivateDistribution();
    });

    $('div#activationDistributedLevel button').click(function () {
        if (isLoading()) return;
        if ($(this).hasClass('active') && currentDistributedLevel == $(this).attr('id')) return;

        radioButtonClick($('div#activationDistributedLevel'), $(this));
        currentDistributedLevel = $(this).attr('id');

        submitActivateDistribution();
    });


    $('div#activationDistributedBy').buttonset();
    $('div#activationDistributedLevel').buttonset();
    $('div#activationDistributedBy').buttonset("disable");
    $('div#activationDistributedLevel').buttonset("disable");
}

function lifezoneButtonsetValueReset() {
    lifeZoneTime.time = 1;
    lifeZoneTime.week = 1;
}

function lifezoneButtonsetRefresh() {
    $('div#lifezoneWeekDayBtnset button').removeClass('active');
    $('div#lifezonePartOfDayBtnset button').removeClass('active');

    $('div#lifezoneWeekDayBtnset button[data-value="' + lifeZoneTime.week + '"]').addClass('active');
    $('div#lifezonePartOfDayBtnset button[data-value="' + lifeZoneTime.time + '"]').addClass('active');
}

function parallelControlPanelInit() {
    $('#parallelControlPanel button').button();
    $("#activationControlPanel button").css({
        width: '100px'
    });

    //disable first
    disableParallelControl();

    var parallelModeBtns = $("#parallelMode button");

    parallelModeBtns.click(function () {
        if (isLoading()) return;

        radioButtonClick($("#parallelMode"), $(this));
        //reset all
        $("#parallelMode button").each(function () {
            setModeOff($(this).attr('id'));
        });
        //set pressed item
        setModeOn($(this).attr('id'));

        if (firstMap.map)
            firstMap.map.closePopup();
        if (comparisonMap.map)
            comparisonMap.map.closePopup();

        //data reset
        loading('Data loading');
        firstMap.setParallelMaxMin();
        firstMap.mapDataLoad();
        firstMap.updateLegend();
        firstMap.info.update();
        loadingDismiss();

    });

}

function actiationControlPanelInit() {
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

function actiationControlPanelRefresh() {
    $("#mode button").removeClass("active");

    var modeList = [MODE_MARKER, /*MODE_COMPARISION*/ , MODE_REGION, /*MODE_GAP*/ ];
    for (var i in modeList) {
        var mode = modeList[i];

        if (isModeActive(mode)) {
            $("#mode button#" + mode).addClass("active");
        }
    }

}

function radioButtonClick($buttonset, $this) {
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
        if (firstMap.hasSnapshotBtn) {
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
        $('#table').button('option', 'label', 'Table');

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
        if (!firstMap.hasSnapshotBtn) {
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
    $('#dealer').click(function () {
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
        } else if ($("#locationFilter input[type='checkbox']:checked").length == 0 && isNeedCheckCountry()) {
            showAlert("Please select a observation Location");
        } else if (activeFunctionTmp == FUNC_QC && $("#locationFilter input[type='checkbox'][datatype='country']:checked").length > 1) {
            showAlert("Only allows of 1 country checked in CFR function");
        } else {
            resetIsClickFromFilterResult();
            //UI display change
            dateMenuHide();
            //init
            if (document.getElementById('workset').style.display == "none" && activeFunctionTmp != FUNC_ACTIVATION_TABLE && activeFunctionTmp != FUNC_ACTIVATION_DISTRIBUTION) {
                $("#workset").show();
                $("#homepage").hide();
                $("#homepage").empty();
                if (document.getElementById("mapid").childNodes.length == 0) {
                    mapInit();
                }
            } else if (activeFunctionTmp == FUNC_ACTIVATION_TABLE || activeFunctionTmp == FUNC_ACTIVATION_DISTRIBUTION) {
                $("#homepage").hide();
                $("#homepage").empty();
            }

            //if change dataset
            //need to clean old setting
            if (getFunction() != null && activeFunctionTmp != null && getFunction() != activeFunctionTmp) {
                console.log('switch to ' + activeFunctionTmp);
                switch (getFunction()) {

                case FUNC_ACTIVATION_TREND:
                    $('#activationTrendBy button').removeClass('active');
                    $('#activationTrendLevel button').removeClass('active');
                    $('#activationTrendTimeScale button').removeClass('active');

                    $('#activationTrendRight').hide();
                    currentTrendBy = defaultTrendBy;
                    currentTrendLevel = defaultTrendLevel;
                    currentTrendTimescale = defaultTrendTimescale;

                    disableActivationTrendControl();
                    break;

                case FUNC_ACTIVATION_DISTRIBUTION:
                    $('#activationDistributedLeft button').removeClass('active');
                    $('#activationDistributedRight button').removeClass('active');
                    $('#activationDistributedRight').hide();
                    currentDistributedLevel = defaultDistributedLevel;
                    currentDistributedBy = defaultDistributedBy;
                    activationDistribution.chartDestroy();
                    disableActivationDistributionControl();
                    break;

                case FUNC_PARALLEL:
                    //console.log("region");
                    firstMap.removePolygonMap();
                    $('#parallelMode button').removeClass('active');
                    setModeOff(MODE_PARALLEL_EXPORT);
                    setModeOff(MODE_PARALLEL_IMPORT);
                    //                        firstMap.info.update();
                    if (firstMap.hasSnapshotBtn) {
                        firstMap.removeSnapshot();
                    }
                    disableParallelControl();
                    break;

                case FUNC_DISTBRANCH:
                case FUNC_ACTIVATION:
                    console.log('switch from ' + FUNC_ACTIVATION);
                    //un-pressed every mode btn
                    $("#mode button.active").each(function () {
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
                    console.log('switch from ' + FUNC_LIFEZONE);
                    removeHeatMap();
                    disableLifezoneControl();
                    firstMap.addSnapshot();
                    break;
                case FUNC_ACTIVATION_TABLE:
                    console.log('switch from ' + FUNC_ACTIVATION_TABLE);
                    $('#tableContainer').empty();
                    break;

                case FUNC_GAP:
                    console.log('switch from ' + FUNC_GAP);
                    //change table button text
                    firstMap.currentRegionIso = [];
                    firstMap.removePolygonMap();
                    cleanBranch();
                    break;
                case FUNC_QC:
                    //reset
                    currentView = DEFAULT_VIEW;

                    console.log('switch from ' + FUNC_QC);
                    //reset view button
                    $('#qcView button').removeClass('active');


                    //change table button text
                    firstMap.currentRegionIso = [];
                    firstMap.removePolygonMap();
                    if (isModeActive(MODE_QC_MARKER)) {
                        removeSQMarker();
                        setModeOff(MODE_QC_MARKER);
                    }

                    if (isModeActive(MODE_QC_REGION)) {
                        removeSQRegion();
                        setModeOff(MODE_QC_REGION);
                    }

                    removeSQMarker();
                    removeSQRegion();
                    disableQCControl();
                    mapInit();
                    break;
                }
                needToForceExtractMap = true;
                setFunction(activeFunctionTmp);
                console.log('diff');
            }

            //need to close popup
            if (firstMap.map)
                firstMap.map.closePopup();
            if (comparisonMap.map)
                comparisonMap.map.closePopup();

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
            switch (getFunction()) {
            case FUNC_ACTIVATION:
            case FUNC_DISTBRANCH:

                if (getFunction() == FUNC_DISTBRANCH && $('input[name="branchDist"]:checked').length == 0 && $('input[name="distBranch"]:checked').length == 0 && $('input[name="onlineDist"]:checked').length == 0) {
                    showAlert('plz check any dist/branch');
                    break;
                }

                $('#tableContainer').hide();
                $('#workset').show('medium');

                enableModeAndOverlay();

                if ($("#mode button.active").length == 0 || $("button#region").hasClass("active")) {
                    setModeOn(MODE_REGION);
                    if (!$("button#region").hasClass("active"))
                        modeBtnPress($("button#region"));

                    if (!firstMap.hasSnapshotBtn) {
                        firstMap.addSnapshot();
                    }

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
                if (!isGapButtonCanShow) {
                    showAlert('GAP mode only supported in single selected country');
                    return;
                }

                $('#tableContainer').hide();
                $('#workset').show('medium');
                submitGap();
                firstMap.zoomToSelectedLocation();
                break;

            case FUNC_QC:
                enableQCControl();

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
                if (!$('#qcView button[data-value="' + currentView + '"]').hasClass("active"))
                    $('#qcView button[data-value="' + currentView + '"]').addClass("active");

                needToLoadTwoModeSameTime = (isRegionMarkerSametime()) ? true : false;
                console.log("needToLoadTwoModeSameTime:" + needToLoadTwoModeSameTime);
                firstMap.zoomToSelectedLocation();
                setInitialZoom(firstMap.map.getZoom());
                break;

            case FUNC_PARALLEL:
                enableParallelControl();
                $('#tableContainer').hide();
                $('#workset').show('medium');

                //first time launching
                if (!isModeActive(MODE_PARALLEL_IMPORT) && !isModeActive(MODE_PARALLEL_EXPORT)) {
                    setModeOn(MODE_PARALLEL_IMPORT);
                    $('button#' + MODE_PARALLEL_IMPORT).addClass('active');
                }

                submitParallel();
                break;

            case FUNC_ACTIVATION_DISTRIBUTION:
                enableActivationDistributionControl();

                if (!$('button#' + currentDistributedBy).hasClass('active'))
                    $('button#' + currentDistributedBy).addClass('active');
                if (currentDistributedBy == MODE_ACTIVATION_DISTRIBUTED_BY_REGION && !$('button#' + currentDistributedLevel).hasClass('active'))
                    $('button#' + currentDistributedLevel).addClass('active');

                $(tableContainer).empty();
                //hide map
                $('#workset').hide();
                $('#tableContainer').show('medium');
                submitActivateDistribution();
                break;

            case FUNC_ACTIVATION_TREND:
                enableActivationTrendControl();

                if (!$('button#' + currentTrendBy).hasClass('active'))
                    $('button#' + currentTrendBy).addClass('active');
                if (!$('button#' + currentTrendTimescale).hasClass('active'))
                    $('button#' + currentTrendTimescale).addClass('active');
                if (currentTrendBy == MODE_ACTIVATION_TREND_BY_REGION && !$('button#' + currentTrendLevel).hasClass('active'))
                    $('button#' + currentTrendLevel).addClass('active');


                $(tableContainer).empty();
                //hide map
                $('#workset').hide();
                $('#tableContainer').show('medium');
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

function submitActivateDistribution() {
    loading("Data loading...");
    ajaxGetActivationDistribution();
    //button class reset
    $("#timeSection button").each(function () {
        $(this).removeClass("btn_pressed").addClass("btn_unpressed");
    });
}

function submitActivateTrend() {
    ajaxGetActivationTrend();
    //button class reset
    $("#timeSection button").each(function () {
        $(this).removeClass("btn_pressed").addClass("btn_unpressed");
    });
}

function submitGap() {
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

    if (JSON.stringify(firstMap.currentRegionIso) == JSON.stringify(observeLoc) && !needToForceExtractMap) {
        console.log("same world region");
        ajaxGetGapData(function () {
            ajaxGetBranchObject(function () {
                ajaxFetchMapValue(false, false);
            });
        });
    } else {
        console.log("diff world region");
        ajaxExtractMap(false, function () {
            ajaxGetGapData(function () {
                ajaxGetBranchObject(function () {
                    ajaxFetchMapValue(false, false);
                });
            });
        }, [false, false]);
    }
    needToForceExtractMap = false;
}

function submitParallel() {
    loading("Data loading...");

    if (observeTarget.length == 0) {
        firstMap.info.update();
        firstMap.cleanMap();
        loadingDismiss();
    } else {
        if (JSON.stringify(firstMap.currentRegionIso) == JSON.stringify(observeLoc) && !needToForceExtractMap) {
            console.log("same world region");
            ajaxFetchParallelValue();
        } else {
            console.log("diff world region");
            ajaxExtractParallelMap(ajaxFetchParallelValue);
        }
        needToForceExtractMap = false;
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
        ajaxGetBranchObject(function () {
            //same world region, no need to re-fetch/*
            if (JSON.stringify(firstMap.currentRegionIso) == JSON.stringify(observeLoc) && !isMapModified && !needToForceExtractMap) {
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
        needToForceExtractMap = false;
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

function submitHeatMap() {
    ajaxGetHeatMap();
}

function submitSQRegion() {
    setModeOn(MODE_QC_REGION);
    if (observeTarget.length == 0) {
        firstMap.info.update();
        removeSQRegion();
        loadingDismiss();
    } else {
        //same world region, no need to re-fetch/*
        if (JSON.stringify(firstMap.currentRegionIso) == JSON.stringify(observeLoc) && !isMapModified && !needToForceExtractMap) {
            console.log("same world region");
            if (observeTarget.length != 0) {
                ajaxGetSQRegion();
            } else {
                loadingDismiss();
            }
        } else {
            console.log("diff world region");
            ajaxExtractMap(false, ajaxGetSQRegion);
        }
        needToForceExtractMap = false;
    }
}

function submitSQMarker(view) {
    setModeOn(MODE_QC_MARKER);
    ajaxGetSQMarker();
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
        "top": '' + toggleBtnTop + 'px',
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
                    "top": '' + toggleBtnTop + 'px',
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
                    "top": '' + toggleBtnTop + 'px',
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
    toggleTopBtn.click(function () {
        toggleTopBtnIcon.toggleClass("glyphicon-menu-up").toggleClass("glyphicon-menu-down");
        //collaspe
        if (toggleTopBtnIcon.hasClass('glyphicon-menu-down')) {
            controlPanelTop.stop(true, true).slideUp("medium",
                function () {
                    optMapSize();
                    comparisionMapResize();
                });
        }
        //show up
        else {
            controlPanelTop.stop(true, true).slideDown("medium", function () {
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
    $("#mode button").attr("disabled", true);
    $("#overlay button").attr("disabled", true);
}

function enableModeAndOverlay() {
    //    console.log('enable activation');
    $("#mode button").removeAttr("disabled");
    $("#overlay button").removeAttr("disabled");
}

function disableLifezoneControl() {
    //    console.log('disable lifezone');
    $('div#lifezoneWeekDayBtnset').buttonset("disable");
    $('div#lifezonePartOfDayBtnset').buttonset("disable");
}

function enableLifezoneControl() {
    //    console.log('enable lifezone');
    $('div#lifezoneWeekDayBtnset').buttonset("enable");
    $('div#lifezonePartOfDayBtnset').buttonset("enable");
}

function disableActivationDistributionControl() {
    //    console.log('disable lifezone');
    $('div#activationDistributedBy').buttonset("disable");
    $('div#activationDistributedLevel').buttonset("disable");
}

function enableActivationDistributionControl() {
    //    console.log('enable lifezone');
    $('div#activationDistributedBy').buttonset("enable");
    $('div#activationDistributedLevel').buttonset("enable");
}

function enableActivationTrendControl() {
    $('div#activationTrendBy').buttonset("enable");
    $('div#activationTrendLevel').buttonset("enable");
    $('div#activationTrendTimeScale').buttonset("enable");
}

function disableActivationTrendControl() {
    $('div#activationTrendBy').buttonset("disable");
    $('div#activationTrendLevel').buttonset("disable");
    $('div#activationTrendTimeScale').buttonset("disable");
}

function disableParallelControl() {
    //    console.log('disable activation');
    $("#parallelMode button").attr("disabled", true);
}

function enableParallelControl() {
    //    console.log('enable activation');
    $("#parallelMode button").removeAttr("disabled");
}

function disableQCControl() {
    //    console.log('disable activation');
    $("#qcControlPanel button").attr("disabled", true);
    $("#qcCategory").selectmenu("disable");

}

function enableQCControl() {
    //    console.log('enable activation');
    $("#qcControlPanel button").removeAttr("disabled");
    $("#qcCategory").selectmenu("enable");
}

//return current mode whether need check country or not
function isNeedCheckCountry() {
    return $('#filterCountryContainer').is(':visible')
}

function helpBtnSetting() {
    $('li#help').click(function () {
        window.open("https://asus-my.sharepoint.com/personal/ian_tseng_asus_com/_layouts/15/guestaccess.aspx?guestaccesstoken=BU2IOjBOaDRC1SYG3Zbl8oleTaILoQ%2bJ2dqLlFxSDRU%3d&docid=06088da14c0af498f9fdda46073db83d9&rev=1");
    });
}