"use strict";

function saveBookmarkBtnSetting() {
    document.getElementById("savebookmark").onclick = function () {
        if (isLoading()) return;
        if (account == undefined) {
            showToast('This feature is not available for guest.');
            return;
        }

        if (observeTarget.length != 0) {

            var titleStr = '[';
            for (var i = 0; i < observeTarget.length; ++i) {
                titleStr += observeTarget[i].model + ", ";
            }
            titleStr += ']';
            $('#bookmark_title').val(titleStr);

            var descStr = '[';
            for (var i = 0; i < observeLoc.length; ++i) {
                descStr += observeLoc[i] + ", ";
            }
            descStr += ']';
            descStr += "[" + firstMap.fromFormatStr + " -> " + firstMap.toFormatStr + "]";
            $('#bookmark_description').val(descStr);

            $("#addBookmarkDialog").dialog({
                //if modal set true then only focus on dialog
                modal: true,
                resizable: false,
                title: 'Add new bookmark',
                width: 500,
                //animation
                show: {
                    effect: "blind",
                    duration: 100
                },
                buttons: {
                    Add: function () {
                        if ($('#bookmark_title').val() == '') {
                            showAlert("Title should not be empty!");
                        } else {
                            //call ajax function
                            addBookmark();
                            $(this).dialog('close');
                            $('#bookmark_title').val('');
                            $('#bookmark_description').val('');
                        }
                    },
                    Cancel: function () {
                        $(this).dialog('close');
                        $('#bookmark_title').val('');
                        $('#bookmark_description').val('');
                    }
                }
            });
            $("#addBookmarkDialog").dialog('open');
            //$("#addBookmarkDialog").css("z-index","9999");

            //            console.log(JSON.stringify(observeTarget));
            // console.log(fromFormatStr);
            // console.log(toFormatStr);
        } else {
            showToast("Empty Observation");
        }
    }
}

function addBookmark() {
    var stringifyObserveTarget = JSON.stringify(observeTarget);
    var stringifyObserveLoc = JSON.stringify(observeLoc);
    var stringifyObserveSpec = JSON.stringify(observeSpec);
    var firstMapTime = JSON.stringify({
        from: firstMap.fromFormatStr,
        to: firstMap.toFormatStr
    });
    var comparisonMapTime = JSON.stringify({
        from: comparisonMap.fromFormatStr,
        to: comparisonMap.toFormatStr
    });
    var activeMode = (isModeActive(MODE_COMPARISION) ? MODE_COMPARISION : MODE_REGION);
    var dataset = getDataset();
    // console.log("stringifyObserveTarget:"+stringifyObserveTarget);
    // console.log("stringifyObserveLoc:"+stringifyObserveLoc);
    //     console.log("stringifyObserveSpec:"+stringifyObserveSpec);
    // console.log("firstMapTime:"+firstMapTime);
    // console.log("comparisonMapTime:"+comparisonMapTime);
    //console.log("activeMode:"+activeMode);

    // ajax to save bookmark
    ajaxAddBookmark(stringifyObserveTarget, stringifyObserveLoc, stringifyObserveSpec, firstMapTime, comparisonMapTime, activeMode, dataset);
}

function loadBookmarkBtnSetting() {
    document.getElementById("bookmark").onclick = function () {
        if (isLoading()) return;
        if (account == undefined) {
            showToast('This feature is not available for guest.');
            return;
        }
        createBookmarkPopup();
    }
}

function bookmarkSubmit(index) {
    if (document.getElementById('workset').style.display = "none") {
        $("#workset").show();
        $("#homepage").hide();
        if (document.getElementById("mapid").childNodes.length == 0) {
            mapInit();
        }
    }
    enableControlPanel();

    closeService();
    closeDealer();

    resetIsClickFromFilterResult();


    closeBookmarkList();
    loading("Data loading...");
    var targetIndex;
    for (var i = 0; i < bookmarkList.length; ++i) {
        if (bookmarkList[i].index == index) {
            targetIndex = i;
            break;
        }
    }

    var bookmarkObj = bookmarkList[targetIndex];

    var devicesJson = JSON.parse(bookmarkObj.devicesJson);
    var locJson = JSON.parse(bookmarkObj.locJson);
    var specJson = JSON.parse(bookmarkObj.specJson);
    var firstMapTime = JSON.parse(bookmarkObj.firstMapTime);
    var comparisonMapTime = JSON.parse(bookmarkObj.comparisonMapTime);
    var activeMode = bookmarkObj.activeMode;
    var dataset = bookmarkObj.dataset;

    // console.log("devicesJson:");
    // console.log(devicesJson);
    // console.log("locJson:");
    // console.log(locJson);
    // console.log("firstMapTime:");
    // console.log(firstMapTime);
    // console.log("comparisonMapTime:");
    // console.log(comparisonMapTime);
    //console.log("activeMode:"+activeMode);

    //------------------------------
    //dateMenuHide();

    //filter data collection
    firstMap.fromFormatStr = firstMapTime.from;
    firstMap.toFormatStr = firstMapTime.to;

    //clone decided filter from tmpFilter
    observeTarget = devicesJson.slice();
    observeTargetTmp = devicesJson.slice();

    observeLoc = locJson.slice();
    observeLocTmp = locJson.slice();

    observeSpec = jQuery.extend({}, specJson);
    observeSpecTmp = jQuery.extend({}, specJson);

    //dataset setting
    $("#dataset button").removeClass("active");
    $("#" + dataset).addClass("active");
    setDataset(dataset);

    //--------filter----------------------------------------

    cleanFilterCheck();

    //device filter target check
    for (var i = 0; i < observeTarget.length; i++) {
        var $this = $("input[value='" + observeTarget[i].model + "'][datatype='" + observeTarget[i].datatype + "'][devices='" + observeTarget[i].devices + "']");
        $this.prop('checked', true);
        checkChild($this, ($this.prop("checked") ? true : false));
        checkParent($this);
    }
    //location filter target check
    observeLocFullNameTmp.length = 0;
    observeLocFullName.length = 0;
    for (var i = 0; i < observeLoc.length; i++) {
        $("input[iso='" + observeLoc[i] + "']").each(function () {
            $(this).prop('checked', true);
            observeLocFullNameTmp.push($(this).val());
            observeLocFullName.push($(this).val());
        });
    }
    
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
        if(isDistBranchFilterShowing)
            //data delete
            observeDistBranch.length = 0;
            //UI remove
            destroyDistBranchCheckBox();
    }
    
    //spec filter
    specDeviceTmp.length = 0;
    var checktarget = $("#check_device_li");
    updateSpecFilter(checktarget);
    ajaxGetDeviceSpec(specDeviceTmp, observeSpec);
    //-------------------------------------------------------

    modeReset();
    setModeOn(activeMode);

    $("#from").datepicker("setDate", new Date(firstMap.fromFormatStr));
    $("#to").datepicker("setDate", new Date(firstMap.toFormatStr));

    if (isModeActive(MODE_COMPARISION)) {
        if (!$("button#comparison").hasClass("active"))
            modeBtnPress($("button#comparison"));

        comparisonMap.fromFormatStr = comparisonMapTime.from;
        comparisonMap.toFormatStr = comparisonMapTime.to;
        $("#from_compare").datepicker("setDate", new Date(comparisonMap.fromFormatStr));
        $("#to_compare").datepicker("setDate", new Date(comparisonMap.toFormatStr));

        setCompareCheckbox(true);

        //map zoom in
        submitComparision();
        firstMap.zoomToSelectedLocation();
        comparisonMap.zoomToSelectedLocation();
    } else if (isModeActive(MODE_MARKER)) {
        if (!$("button#marker").hasClass("active"))
            modeBtnPress($("button#marker"));

        firstMap.zoomToSelectedLocation();
        submitMarker();
    } else if (isModeActive(MODE_REGION)) {
        if (!$("button#region").hasClass("active"))
            modeBtnPress($("button#region"));

        firstMap.zoomToSelectedLocation();
        submitRegion();
    }
    clearFilterResult();
    showFilterResult();
}

function closeBookmarkList() {
    $("#bookmarkList").dialog('close');
    $('#bookmark').removeClass('clicked');

    //need to unbind or 
    //linstener will be called multiple times
    $("#bookmarkList").unbind();
}

//change list to checkbox
function editBookmark() {
    if (bookmarkList) {
        var content = '';
        for (var i = 0; i < bookmarkList.length; ++i) {
            content += '<li><label for="' + bookmarkList[i].index + '">';
            content += '<input type = "checkbox" id="' + bookmarkList[i].index + '" class = "bk-edit-item">' + "<div style='display: inline;'>" + bookmarkList[i].title + " / " + bookmarkList[i].desc + "</div>";
            content += '</label></li>'

        }
        $('#bk-ul').html(content);
        //show the remove buttons
        $('.bk-list-btn').show();
    }
}

function submitRemoveBookmark() {
    var index = 0;
    var idOfBookmarkDel = [];
    $('.bk-edit-item').each(function () {
        if ($(this).prop("checked")) {
            idOfBookmarkDel.push($(this).attr("id"));
        }
        index++;
    });
    //update bookmark list here
    ajaxRemoveBookmark(idOfBookmarkDel);


    console.log(JSON.stringify(idOfBookmarkDel));
    closeBookmarkList();
}

function createBookmarkPopup() {
    var content = '';
    for (var i = 0; i < bookmarkList.length; ++i) {
        var bookmarkObj = bookmarkList[i];
        var index = bookmarkObj.index;
        var title = bookmarkObj.title;
        var desc = bookmarkObj.desc;

        content += '<li class ="bk-item" id="' + index + '" onclick="bookmarkSubmit(\'' + index + '\')">' + title + "<br>" + desc + '</li>';
        content += '</ul>'
    }
    $('#bk-ul').html(content);

    $("#bookmarkList").dialog({
        modal: false,
        resizable: false,
        title: 'Bookmarks',
        dialogClass: 'bk-list',
        draggable: false,
        position: {
            my: "left top",
            at: "left bottom",
            of: $('#bookmark')
        },
        width: 300,
        show: {
            effect: "blind",
            duration: 100
        },
        buttons: [
            {
                text: 'delete',
                class: 'bk-list-btn',
                click: function () {
                    submitRemoveBookmark();
                }
            }, {
                text: 'cancel',
                class: 'bk-list-btn',
                click: function () {
                    closeBookmarkList();
                }
            }
        ]
    }).bind('clickoutside', function (event) {
        //console.log("outside");
        //close the list if click outside
        if (!$(event.target).closest('.ui-dialog').length && !$(event.target).closest('#bookmark').length) {
            closeBookmarkList();
        }
    });

    //prevent top-right InfoDiv overlap
    $(".bk-list").css("z-index", "9999");

    if ($('#editBookmarkButton').length == 0) {
        //add the edit button
        $(".bk-list").children(".ui-dialog-titlebar").append("<span id='editBookmarkButton' class='ui-icon ui-icon-trash'></span>");
        $('#editBookmarkButton').click(function () {
            editBookmark();
            $('#editBookmarkButton').hide();
        });
    } else {
        $('#editBookmarkButton').show();
    }
    //hide the remove buttons if not in edit mode
    $('.bk-list-btn').hide();
    $("#bookmarkList").dialog('open');
}