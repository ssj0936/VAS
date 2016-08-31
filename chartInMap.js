"use strict";

var chartHeight = 400;
var filterInTrendIconWidth = 12;
var filterInTrendIconmarginright = 3;
var isTotalShowing = true;
var totalName = 'Total';
var totalDataset = null;

function createFunctionalBtn(){
    var container = jQuery('<div/>', {
        id: "functionalBtnContainer",
    }).append(
        jQuery('<button/>', {
            id: "btnExport",
        })
        .text('EXPORT')
        .click(function () {
            return exportFile(getActiveTrend(), true);
        })
        .button()
    ).append(
        jQuery('<button/>', {
            id: "btnTotalToggle",
        })
        .text('Hide Total')
        .click(function () {
            //hide
            if(isTotalShowing){
                removeTotalLine();
                $(this).button('option', 'label', 'Show Total');
                isTotalShowing = false;
            }
            //show
            else{
                addTotalLine();
                $(this).button('option', 'label', 'Hide Total');
                isTotalShowing = true;
            }
        })
        .button()
    )
    return container;
}

function resetTotalToggleBtn(){
    $('button#btnTotalToggle').button('option', 'label', 'Hide Total');
    isTotalShowing = true;
}

function updateRegionChart(json, displayname, displaynum) {
    if (json.groupByRegionResults.length == 0) return;

    var leftPopup = jQuery('<div/>', {
            id: 'leftPopupContainer',
        }).css({
            'display':'inline-block',
            'width': '15%',
            'height': '100%',
            'vertical-align':'top',
            'position': 'relative',
        }).appendTo($('#popupChartContainer'));

    var rightPopup = jQuery('<div/>', {
            id: 'rightPopupContainer',
        }).css({
            'display':'inline-block',
            'width': '84%',
            'height': '100%',
            'vertical-align':'top',
            'position': 'relative',
        }).appendTo($('#popupChartContainer'));
    
    //title container
    var title = jQuery('<div/>', {
            id: 'lineChartTitle',
        })
        .css({
            'top':'' + getWindowHeightPercentagePx(0.1) + 'px',
        })
        .appendTo(rightPopup);

    createFunctionalBtn().appendTo(title);

    //title content
    jQuery('<div/>', {
            id: "currentTrendTitle",
            class: 'w3-padding-4',
        })
        .css('text-align', 'left')
        .append(
            jQuery('<p/>')
            .text(displayname + " : " + displaynum)
            .css({
                'margin': '0px',
                'font-size': '42px',
                'text-align': 'left',
            })
        )
        .append(
            jQuery('<p/>', {
                'id': 'option'
            })
            .text("Trend by " + TREND_REGION)
            .css({
                'margin': '0px',
                'display': 'inline-block',
                'font-size': '42px',
            })
        )
        .append(
            jQuery('<span/>', {
                class: 'trendIconDowu',
            })
        )
        .click(
            function () {
                $('#trendOptionContainer').stop(true, true).slideToggle('medium');

                var icon = $('#currentTrendTitle span');
                if (icon.hasClass('trendIconDowu'))
                    icon.removeClass('trendIconDowu').addClass('trendIconUp');
                else
                    icon.removeClass('trendIconUp').addClass('trendIconDowu');
            }
        )
        .appendTo(title);

    //option
    var trendList = [TREND_MODEL, TREND_DEVICE, TREND_REGION];

    var optionContainer = jQuery('<div/>', {
            id: 'trendOptionContainer',
        })
        .appendTo(title).hide();

    for (var i in trendList) {
        jQuery('<div/>', {
                id: 'trendBy' + trendList[i],
                class: "w3-light-grey w3-hover-shadow w3-padding-4 w3-center",
            })
            .html('<h4>' + 'Trend by ' + trendList[i] + '</h4>')
            .appendTo(optionContainer)
            .click(function (activeTrend) {
                return function () {
                    if (getActiveTrend() == activeTrend) return;

                    //if trendcontainer hide, show it
                    if ($('#trendContainer').is(':hidden'))
                        $('#trendContainer').slideDown('medium');

                    //table remove
                    $('#table_wrapper').remove();
//                    disableScroll();

                    $('#trendContainer').css({
                        'opacity': 0
                    });

                    createsingleRegionChart(json, activeTrend, displayname);
                    $('#currentTrendTitle p#option').text("Trend by " + activeTrend);
                    $('#trendContainer').fadeTo(300, 1);

                    //menu close
                    $('#trendOptionContainer').stop(true, true).slideToggle('medium');
                }
            }(trendList[i]));
    }
    var filterDisplayer = createFilterDisplayer();
    filterDisplayer.appendTo(leftPopup);

    //chart
    createsingleRegionChart(json, TREND_REGION, displayname);

//    bodyHide();
    //title re-position
//    var top = title.offset().top;
//    title.css({
//        'top': '' + top + 'px',
//        'bottom': '',
//    });
}

function updateTrendChart(json) {

    //empty data set
    if (json.start_time == null && json.end_time == null) return;

    //chart
    var defaultTrendMode = TREND_MODEL;
    
    var leftPopup = jQuery('<div/>', {
            id: 'leftPopupContainer',
        }).css({
            'display':'inline-block',
            'width': '15%',
            'height': '100%',
            'vertical-align':'top',
            'position': 'relative',
        }).appendTo($('#popupChartContainer'));

    var rightPopup = jQuery('<div/>', {
            id: 'rightPopupContainer',
        }).css({
            'display':'inline-block',
            'width': '84%',
            'height': '100%',
            'vertical-align':'top',
            'position': 'relative',
        }).appendTo($('#popupChartContainer'));
    
    createTrendChart(json, defaultTrendMode);
    
    //title container
    var title = jQuery('<div/>', {
            id: 'lineChartTitle',
            //        class: "w3-center",
        })
        .css({
            'top':'' + getWindowHeightPercentagePx(0.1) + 'px',
        })
        .appendTo(rightPopup);

    createFunctionalBtn().appendTo(title);

    jQuery('<div/>', {
            id: "currentTrendTitle",
            class: 'w3-padding-4',
        })
        .append(
            jQuery('<p/>')
            .text("Trend by " + defaultTrendMode)
            .css({
                'margin': '0px',
                'display': 'inline-block',
                'font-size': '42px'
            })
        )
        .append(
            jQuery('<span/>', {
                class: 'trendIconDowu',
            })
        )
        .click(
            function () {
                $('#trendOptionContainer').stop(true, true).slideToggle('medium');

                var icon = $('#currentTrendTitle span');
                if (icon.hasClass('trendIconDowu'))
                    icon.removeClass('trendIconDowu').addClass('trendIconUp');
                else
                    icon.removeClass('trendIconUp').addClass('trendIconDowu');
            }
        )
        .appendTo(title);

    var trendList = [TREND_MODEL, TREND_DEVICE, TREND_COUNTRY];

    var optionContainer = jQuery('<div/>', {
            id: 'trendOptionContainer',
        })
        .appendTo(title).hide();

    for (var i in trendList) {
        jQuery('<div/>', {
                id: 'trendBy' + trendList[i],
                class: "w3-light-grey w3-hover-shadow w3-padding-4 w3-center",
            })
            .html('<h4>' + 'Trend by ' + trendList[i] + '</h4>')
            .appendTo(optionContainer)
            .click(function (activeTrend) {
                return function () {
                    if (getActiveTrend() == activeTrend) return;

                    //if trendcontainer hide, show it
                    if ($('#trendContainer').is(':hidden'))
                        $('#trendContainer').slideDown('medium');

                    //table remove
                    $('#table_wrapper').remove();
//                    disableScroll();

                    $('#trendContainer').css({
                        'opacity': 0
                    });

                    createTrendChart(json, activeTrend);
                    $('#currentTrendTitle p').text("Trend by " + activeTrend);
                    $('#trendContainer').fadeTo(300, 1);

                    //menu close
                    $('#trendOptionContainer').stop(true, true).slideToggle('medium');
                }
            }(trendList[i]));
    }
    var filterDisplayer = createFilterDisplayer();
    filterDisplayer.appendTo(leftPopup);

    //title re-position
    var top = title.offset().top;
    title.css({
        'top': '' + top + 'px',
        'bottom': '',
    });

    //resize document-size
//    bodyHide();
    console.log($('#popupChartContainer').outerHeight(true));
    
    //End
    loadingDismiss();
}

function bodyHide(){
    $('body').css({
        'height' : '0px',
        'overflow' : 'hidden',
    });
}

function bodyShow(){
    $('body').css({
        'height' : 'auto',
        'overflow' : 'auto',
    });
}

function exportFile(ReportTitle, ShowLabel) {
    var exportArray = [];
    for (var i in trendObj.labels) {
        var date = trendObj.labels[i];

        var Obj = {
            "date": date
        };
        for (var j in trendObj.datasets) {
            var label = trendObj.datasets[j].label;
            var countAtThatDay = trendObj.datasets[j].data[i];
            Obj[label] = countAtThatDay;
        }
        exportArray.push(Obj);
    }

    var arrData = exportArray;
    var CSV = '';
    //Set Report title in first row or line

    CSV += ReportTitle + '\r\n\n';

    //This condition will generate the Label/Header
    if (ShowLabel) {
        var row = "";
        for (var index in arrData[0]) {
            //Now convert each value to string and comma-seprated
            row += index + ',';
        }
        row = row.slice(0, -1);

        //append Label row with line break
        CSV += row + '\r\n';
    }

    for (var i = 0; i < arrData.length; i++) {
        var row = "";

        for (var index in arrData[i]) {
            row += '"' + arrData[i][index] + '",';
        }
        row.slice(0, row.length - 1);
        //add a line break after each row
        CSV += row + '\r\n';
    }

    if (CSV == '') {
        alert("Invalid data");
        return;
    }

    //Generate a file name
    var fileName = "MyReport_";
    fileName += ReportTitle.replace(/ /g, "_");

    //Initialize file format you want csv or xls
    var uri = 'data:text/csv;charset=utf-8,' + escape(CSV);


    // ------------------trigger-------------------------
    // Now the little tricky part.
    // you can use either>> window.open(uri);
    // but this will not work in some browsers
    // or you will not get the correct file extension

    //this trick will generate a temp <a /> tag
    var link = document.createElement("a");
    link.href = uri;

    //set the visibility hidden so it will not effect on your web-layout
    link.style = "visibility:hidden";
    link.download = fileName + ".csv";

    //this part will append the anchor tag and remove it after automatic click
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function createDeviceFilter(dataObj, container, titleContainer) {
    var ul = jQuery('<ul/>').appendTo(container);

    var li = jQuery('<li/>').attr("id", "check_device_li").appendTo($(ul));
    jQuery('<span/>', {
        class: 'ui-icon ui-icon-bullet',
    }).appendTo(li);
    
    jQuery('<label/>', {
        text: "All",
    }).appendTo(li);

    var productUl = jQuery('<ul/>').appendTo($(ul));
    //ui-icon-squaresmall-plus
    for (var productName in dataObj) {
        var isNoChildModel = (dataObj[productName] == null);
        var li = jQuery('<li/>').appendTo($(productUl));
        //all product
        //collapse icon
        if(!isNoChildModel){
            jQuery('<span />', {
                    class: "ui-icon ui-icon-circlesmall-plus",
                })
                .css({
                    'display': 'inline-block',
                    'font-size': '18px',
                    'height': ''+filterInTrendIconWidth+'px',
                    'width': ''+filterInTrendIconWidth+'px',
                    'margin-right': '3px',
                })
                .click(function () {
                    if ($(this).hasClass('ui-icon-circlesmall-plus')) {
                        $(this).removeClass("ui-icon-circlesmall-plus").addClass("ui-icon-circlesmall-minus");
                    } else {
                        $(this).removeClass("ui-icon-circlesmall-minus").addClass("ui-icon-circlesmall-plus");
                    }
                    $(this).parent().next('ul').slideToggle();
                })
                .appendTo(li)
        }else{
            li.css({
                'margin-left': ''+(filterInTrendIconWidth + filterInTrendIconmarginright)+'px',
            })
        }

        jQuery('<span/>', {
            class: 'ui-icon ui-icon-bullet',
        }).appendTo(li);
        
        jQuery('<label/>', {
            text: productName,
        }).appendTo(li);

        if(isNoChildModel) continue;
        
        var modelUl = jQuery('<ul/>').appendTo($(productUl)).hide();
        for(var modelName in dataObj[productName]){
            var isNoDeviceChild = (dataObj[productName][modelName] == null);
            
            var li = jQuery('<li/>').appendTo(modelUl);
            //all model
            //collapse icon
            if(!isNoDeviceChild){
                jQuery('<span />', {
                        class: "ui-icon ui-icon-circlesmall-plus",
                    })
                    .css({
                        'display': 'inline-block',
                        'font-size': '18px',
                        'height': ''+filterInTrendIconWidth+'px',
                        'width': ''+filterInTrendIconWidth+'px',
                        'margin-right': '3px',
                    })
                    .click(function () {
                        if ($(this).hasClass('ui-icon-circlesmall-plus')) {
                            $(this).removeClass("ui-icon-circlesmall-plus").addClass("ui-icon-circlesmall-minus");
                        } else {
                            $(this).removeClass("ui-icon-circlesmall-minus").addClass("ui-icon-circlesmall-plus");
                        }
                        $(this).parent().next('ul').slideToggle();
                    })
                    .appendTo(li);
            }else{
                li.css({
                    'margin-left': ''+(filterInTrendIconWidth + filterInTrendIconmarginright)+'px',
                })
            }

            jQuery('<span/>', {
                class: 'ui-icon ui-icon-bullet',
            }).appendTo(li);
            
            jQuery('<label/>', {
                text: modelName,
            }).appendTo(li);

            if(isNoDeviceChild) continue;
            //devices
            var deviceUl = jQuery('<ul/>').appendTo(modelUl).hide();
            for (var i = 0; i < dataObj[productName][modelName].length; ++i) {
                var li = jQuery('<li/>').appendTo(deviceUl);
                jQuery('<span/>', {
                    class: 'ui-icon ui-icon-bullet',
                }).appendTo(li);
                jQuery('<label/>', {
                    text: dataObj[productName][modelName][i],
                }).appendTo(li);
            }
        }
    }

    container.show();
    titleContainer.toggleClass('trendCollapsible-close trendCollapsible-open');
}

function createTwoLevelFilter(dataArray, container, titleContainer) {
    var ul = jQuery('<ul/>').appendTo(container);


    if (dataArray == observeLocFullName) {
        for (var i = 0; i < dataArray.length; ++i) {
            var li = jQuery('<li/>').appendTo($(ul));

            jQuery('<span/>', {
                class: 'ui-icon ui-icon-bullet',
            }).appendTo(li);

            jQuery('<label/>', {
                text: dataArray[i],
            }).appendTo(li);
        }

        container.show();
        titleContainer.toggleClass('trendCollapsible-close trendCollapsible-open');
    } else {
        if (dataArray[0] == 'all') {
            var li = jQuery('<li/>').appendTo(ul);

            jQuery('<span/>', {
                class: 'ui-icon ui-icon-bullet',
            }).appendTo(li);

            jQuery('<label/>', {
                text: "All",
            }).appendTo(li);
        } else {
            //            var allUl = jQuery('<ul/>').appendTo(ul);
            for (var i = 0; i < dataArray.length; ++i) {
                var li = jQuery('<li/>').appendTo(ul);

                jQuery('<span/>', {
                    class: 'ui-icon ui-icon-bullet',
                }).appendTo(li);

                jQuery('<label/>', {
                    text: dataArray[i],
                }).appendTo(li);
            }
            container.show();
            titleContainer.toggleClass('trendCollapsible-close trendCollapsible-open');
        }
    }
}

function addingContent(filterName, container, titleContainer) {
    //    console.log(container.get(0));

    switch (filterName) {
    case 'Device':
        console.log(observeTarget);
        var deviceObj = {};
        for (var j in observeTarget) {
            var targetObj = observeTarget[j];
            var dataType = targetObj.datatype;
            //top level
            var devices = targetObj.devices;
            //lower level
            var model = targetObj.model;
            var product = targetObj.product;

            if(dataType == 'devices'){
                if(deviceObj[product] == undefined){
                    deviceObj[product] = {};
                }
                
                if(deviceObj[product][model] == undefined){
                    deviceObj[product][model] = [];
                }

                deviceObj[product][model].push(devices);
            }
            else if(dataType == 'model'){
                if(deviceObj[product] == undefined){
                    deviceObj[product] = {};
                }
                
                if(deviceObj[product][model] == undefined){
                    deviceObj[product][model] = null;
                }
            }
            else if(dataType == 'product'){
                if(deviceObj[product] == undefined)
                    deviceObj[product]= null;
            }
        }
        console.log(deviceObj);
        createDeviceFilter(deviceObj, container, titleContainer);
        break;

    case 'Country':
        createTwoLevelFilter(observeLocFullName, container, titleContainer);
        break;
    case 'CPU':
        createTwoLevelFilter(observeSpec.cpu, container, titleContainer);
        break;
    case 'Color':
        createTwoLevelFilter(observeSpec.color, container, titleContainer);
        break;
    case 'RearCamera':
        createTwoLevelFilter(observeSpec.rear_camera, container, titleContainer);
        break;
    case 'FrontCamera':
        createTwoLevelFilter(observeSpec.front_camera, container, titleContainer);
        break;
    }
}

function createFilterDisplayer() {
    //filter content
    var container = jQuery('<div/>', {
        class: 'filter_wrapper panel',
    }).css({
        'position': 'absolute',
        'top': '' + getWindowHeightPercentagePx(0.15) + 'px',
        'right': '0px',
        'width': '90%',
        'border-radius': '5px',
        'z-index': 5,
    });

    var header = jQuery('<div/>', {
            class: 'panel-heading',
        })
        .text('Filter')
        .appendTo(container);

    var body = jQuery('<div/>', {
            class: 'panel-body',
        })
        .appendTo(container);

    //structure build for each filter
    for (var i in FilterList) {
        var filterName = FilterList[i];

        var $container = $('<div/>', {
                id: 'displayFilter_title_' + filterName,
                class: 'trendCollapsible-close',
            })
            .css({
                'border-top': (i != 0) ? ('solid black 1pt') : (''),
                'margin': '10px 5px 0px 5px',
                'margin-bottom': '5px',
                'padding-top': '8px',
            })
            .html(filterName + '<span></span>')
            .appendTo(body);

        var $content = $('<div/>', {
                id: 'displayFilter_content_' + filterName,
                class: 'selector',
                filterName: filterName,
            })
            .css({
                'max-height': '300px',
                'overflow': 'auto',
            })
            .appendTo(body).hide();

        $container.click(function ($content, $container) {
            return function () {
                //only one filter can be opend
//                $('div[id^="displayFilter_content_"]').each(function () {
//                    if ($(this).attr('id') != $content.attr('id')) {
//                        if ($('#displayFilter_title_' + $(this).attr('filterName')).hasClass('trendCollapsible-open')) {
//                            $(this).stop(true, true).slideUp('medium');
//                            $('#displayFilter_title_' + $(this).attr('filterName')).removeClass('trendCollapsible-open').addClass('trendCollapsible-close');
//                        }
//                    }
//                });

                $content.stop(true, true).slideToggle('medium');
                $container.toggleClass('trendCollapsible-close trendCollapsible-open');
            }
        }($content, $container));

        addingContent(filterName, $content, $container);
    }

    return container;
}

function showRegionChart(countryID, iso, displayname, displaynum, mapObj) {
    if (observeTarget.length > 0 && !mapObj.isEmpty) {
        loading("Creating Chart...");
        resetFilterStatus();
        scrollToTop();
        popupChartShow(true);
        ajaxRegionChart(countryID, iso, displayname, displaynum, mapObj);
    }
}

//function closeLineChart(){
//    popupChartClose();
//}

function popupChartShow(needToLockScroll) {
    document.getElementById('mapid').style.zIndex = -1;
    document.getElementById('mapidComparison').style.zIndex = -1;
    document.getElementById('toggle').style.zIndex = -1;
    $('.ui-widget').css('z-index', -1);

    $('#popupChartContainer').css({
        "min-height": screen.height,
        "opacity": 0.99,
        'z-index': 1,
        //set height to full document size to cover workset
//        'height': ''+getDocumentFullHeight()+'px',
//        'height': 'auto',
    });

    //<span class="ui-icon ui-icon-circle-close" style="font-size: 4em; color: rgb(127, 127, 127);"></span>
    //close btn
    jQuery('<span/>', {
            id: 'closeLineChart',
            class: 'ui-icon ui-icon-close',
        })
        .hover(
            function () {
                $(this).removeClass("ui-icon-close").addClass("ui-icon-circle-close");
            },
            function () {
                $(this).removeClass("ui-icon-circle-close").addClass("ui-icon-close");
            }
        )
        .appendTo($('#popupChartContainer'))
        .click(function () {
            popupChartClose(needToLockScroll);
        });
    bodyHide();
//    if (needToLockScroll)
//        disableScroll();

}

function popupChartClose(needToLockScroll) {
    document.getElementById('mapid').style.zIndex = 1;
    document.getElementById('mapidComparison').style.zIndex = 1;
    document.getElementById('toggle').style.zIndex = 1;
    $('.ui-widget').css('z-index', 1);
    $('#popupChartContainer').css({
        "min-height": '0px',
        "opacity": 0,
        'z-index': -1,
        //set height to 0 in order not to influence workset height
//        'height': '0px',
    });

    $('#popupChartContainer').empty();

    //for line chart
    chartDestroy(true);

    if (needToLockScroll) {
        enableScroll();
    }

    enableScroll();
    bodyShow();
    totalDataset = null;
}

function showTrend(mapObj) {
    if (observeTarget.length > 0 && !mapObj.isEmpty) {
        loading("Creating Chart...");
        //        resetFilterStatus();
        scrollToTop();
        popupChartShow(true);
        ajaxTrendChart(mapObj);
    }
}

function setTrendLable(json) {
    trendObj = new lineDataObj();

    var startDate = json.start_time;
    var endDate = json.end_time;
    var tmpDate = startDate;

    while (parseDate(tmpDate) < parseDate(endDate)) {
        trendObj.labels.push(tmpDate);

        var tomorrow = new Date(tmpDate);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tmpDate = parseDateToStr(tomorrow);

    }
    trendObj.labels.push(endDate);
}

function setTrendDataByModel(jsonObj) {
    //group by model
    trendObj.datasets.length = 0;
    var modelArray = Object.keys(jsonObj);
    for (var index in modelArray) {
        var modelName = modelArray[index];
        var modelData = jsonObj[modelName];

        var color = getRandomColor();
        var highlight = ColorLuminance(color, 0.5);
        var transparentColor = colorHexToRGBString(color, 0.2);
        var modelDataset = new lineDatasetsObj(modelName, transparentColor, color, highlight, false);

        var modelDataDateIndex = 0
        for (var i = 0; i < trendObj.labels.length; ++i) {
            if (modelDataDateIndex < modelData.length && trendObj.labels[i] == modelData[modelDataDateIndex].date) {
                modelDataset.data.push(modelData[modelDataDateIndex].count);
                ++modelDataDateIndex;
            } else {
                modelDataset.data.push(0);
            }
        }

        trendObj.datasets.push(modelDataset);
    }
}

function setTrendDataByCountry(jsonObj) {
    //group by country
    trendObj.datasets.length = 0;
    var countryArray = Object.keys(jsonObj);
    for (var index in countryArray) {
        var isoName = countryArray[index];
        var isoData = jsonObj[isoName];

        var color = getRandomColor();
        var highlight = ColorLuminance(color, 0.5);
        var transparentColor = colorHexToRGBString(color, 0.2);
        var isoDataset = new lineDatasetsObj(isoName, transparentColor, color, highlight, false);

        var isoDataDateIndex = 0
        for (var i = 0; i < trendObj.labels.length; ++i) {
            if (isoDataDateIndex < isoData.length && trendObj.labels[i] == isoData[isoDataDateIndex].date) {
                isoDataset.data.push(isoData[isoDataDateIndex].count);
                ++isoDataDateIndex;
            } else {
                isoDataset.data.push(0);
            }
        }
        trendObj.datasets.push(isoDataset);
    }
}

function setTrendDataByDevice(jsonObj) {
    //group by country
    trendObj.datasets.length = 0;
    var deviceArray = Object.keys(jsonObj);
    for (var index in deviceArray) {
        var deviceName = deviceArray[index];
        var deviceData = jsonObj[deviceName];

        var color = getRandomColor();
        var highlight = ColorLuminance(color, 0.5);
        var transparentColor = colorHexToRGBString(color, 0.2);
        var deviceDataset = new lineDatasetsObj(deviceName, transparentColor, color, highlight, false);

        var deviceDataDateIndex = 0
        for (var i = 0; i < trendObj.labels.length; ++i) {
            if (deviceDataDateIndex < deviceData.length && trendObj.labels[i] == deviceData[deviceDataDateIndex].date) {
                deviceDataset.data.push(deviceData[deviceDataDateIndex].count);
                ++deviceDataDateIndex;
            } else {
                deviceDataset.data.push(0);
            }
        }
        trendObj.datasets.push(deviceDataset);
    }
}

function setTrendDataByRegion(jsonObj, regionName) {
    trendObj.datasets.length = 0;

    var regionName = regionName;
    var regionData = jsonObj;

    var color = getRandomColor();
    var highlight = ColorLuminance(color, 0.5);
    var transparentColor = colorHexToRGBString(color, 0.2);
    var regionDataset = new lineDatasetsObj(regionName, transparentColor, color, highlight, false);

    var regionDataDateIndex = 0
    for (var i = 0; i < trendObj.labels.length; ++i) {
        if (regionDataDateIndex < regionData.length && trendObj.labels[i] == regionData[regionDataDateIndex].date) {
            regionDataset.data.push(regionData[regionDataDateIndex].count);
            ++regionDataDateIndex;
        } else {
            regionDataset.data.push(0);
        }
    }
    trendObj.datasets.push(regionDataset);
}

function addingTotalLine(totalJson) {
    var totalData = totalJson;

    //    console.log(totalData);
    var color = getRandomColor();
    var highlight = ColorLuminance(color, 0.5);
    var transparentColor = colorHexToRGBString(color, 0.2);
    totalDataset = new lineDatasetsObj(totalName, transparentColor, color, highlight, false);

    var totalDataDateIndex = 0
    for (var i = 0; i < trendObj.labels.length; ++i) {
        if (totalDataDateIndex < totalData.length && trendObj.labels[i] == totalData[totalDataDateIndex].date) {
            totalDataset.data.push(totalData[totalDataDateIndex].count);
            ++totalDataDateIndex;
        } else {
            totalDataset.data.push(0);
        }
    }
    //    console.log(totalDataset);
    trendObj.datasets.push(totalDataset);
}

function removeTotalLine(){
    var index = trendObj.datasets.indexOf(totalDataset);
    if (index > -1) {
        trendObj.datasets.splice(index, 1);
    }
    chartDestroy(false);
    createChartElement();
    updateColorInfo();
}

function addTotalLine(){
    trendObj.datasets.push(totalDataset);
    chartDestroy(false);
    createChartElement();
    updateColorInfo();
}

function setActiveTrend(trend) {
    activeTrend = trend;
}

function getActiveTrend(trend) {
    return activeTrend;
}

function createChartElement(){
    var node = document.createElement("canvas");
    node.className = "chart";
    node.id = 'trendChart';

    var container = document.createElement("div");
    $(container).css({
        "position": "absolute",
        "top": "" + getWindowHeightPercentagePx(0.25) + 'px',
        "left": "5%",
        "width": "80%",
        "overflow-x": "scroll",
        "overflow-y": "hidden",
        "display": "inline-block",
    }).attr('id', 'trendContainer');


    jQuery('<div/>', {
            id: 'trendColorInfo',
            class: "w3-light-grey",
        })
        .appendTo($("#rightPopupContainer"));

    container.appendChild(node);
    
    node.style.height = '' + chartHeight + 'px';
    node.style.width = (30 * trendObj.labels.length > 32500) ? ('32500px') : '' + (30 * trendObj.labels.length) + 'px';

//    document.getElementById("popupChartContainer").appendChild(container);
    $('#rightPopupContainer').append($(container));
    var ctx = node.getContext("2d");
    linechart = new Chart(ctx).Overlay(trendObj, newOptions);
}

function createsingleRegionChart(json, trendMode, regionName) {
    //data reset
    chartDestroy(true);
    resetTotalToggleBtn();
    //fetch data
    trendObj = new lineDataObj();
    setTrendLable(json);
    
    switch (trendMode) {
    case TREND_MODEL:
        setTrendDataByModel(json.groupByModelResults);
        addingTotalLine(json.groupByRegionResults);
        setActiveTrend(TREND_MODEL);
        break;

    case TREND_REGION:
        setTrendDataByRegion(json.groupByRegionResults, regionName);
        setActiveTrend(TREND_REGION);
        break;

    case TREND_DEVICE:
        setTrendDataByDevice(json.groupByDeviceResults);
        addingTotalLine(json.groupByRegionResults);
        setActiveTrend(TREND_DEVICE);
        break;
    }
    
    //create chart element
    createChartElement();

    updateColorInfo();
    loadingDismiss();
}

function chartDestroy(dataNeedToSetNull){
    //destroy old chart
    if(dataNeedToSetNull){
        if (trendObj != null) {
            trendObj = null;
        }
    }
    
    if (linechart != null) {
        linechart.destroy();
    }

    $('#trendContainer').remove();
    $('#trendColorInfo').remove();
}

function createTrendChart(json, trendMode) {
    //destroy old chart
    chartDestroy(true);
    resetTotalToggleBtn();
    
    trendObj = new lineDataObj();
    setTrendLable(json);

    switch (trendMode) {
    case TREND_MODEL:
        setTrendDataByModel(json.groupByModelResults);
        addingTotalLine(json.groupByDateResults);
        setActiveTrend(TREND_MODEL);
        break;

    case TREND_COUNTRY:
        setTrendDataByCountry(json.groupByCountryResults);
        addingTotalLine(json.groupByDateResults);
        setActiveTrend(TREND_COUNTRY);
        break;

    case TREND_DEVICE:
        setTrendDataByDevice(json.groupByDeviceResults);
        addingTotalLine(json.groupByDateResults);
        setActiveTrend(TREND_DEVICE);
        break;
    }
    createChartElement();

    updateColorInfo();
}

function updateColorInfo() {
    var infoDiv = $('#trendColorInfo');
    infoDiv.css({
        'width': '12%',
        'overflow-y': 'auto',
        'top': '' + getWindowHeightPercentagePx(0.15) + 'px',
    });

    var totalHeight = 0;
    for (var i in trendObj.datasets) {
        var dataset = trendObj.datasets[i];
        var color = dataset.pointColor;
        var name = dataset.label;

        var colorBlock = jQuery('<i/>').css({
            'background': color,
            'width': '18px',
            'height': '18px',
            'margin-right': '8px',
            'opacit': '0.7',
            'display': 'inline-block',
        });

        var colorName = jQuery('<p/>').css({
            'margin': '0px',
            'display': 'inline-block',
        }).text(name);

        var oneColorInfo = jQuery('<div/>')
            .append(colorBlock)
            .append(colorName)
            .appendTo(infoDiv);

        totalHeight += oneColorInfo.height();
    }

}

function createTable() {
    $('#table_wrapper').remove();

    // create table container
    var tableContainer = '<table id="table" class="table hover table-bordered" cellspacing="0" width="100%">' + '<thead>' + '<tr role="row">' + '<th>Date</th>';

    for (var i in trendObj.datasets) {
        var label = trendObj.datasets[i].label;
        tableContainer += '<th>' + label + '</th>';
    }

    tableContainer += '</tr>' + '</thead>' + '</table>';
    $("#popupChartContainer").append(tableContainer);

    //create data
    var data = [];
    for (var i = 0; i < trendObj.labels.length; ++i) {
        var oneDayData = [];
        oneDayData.push(trendObj.labels[i]);
        for (var j = 0; j < trendObj.datasets.length; ++j) {
            oneDayData.push(trendObj.datasets[j].data[i]);
        }
        data.push(oneDayData);
    }

    var table = $('table#table').DataTable({
        data: data,
        pageLength: -1,
        dom: 'Bfrtip',
        buttons: [
            'copy', 'csv', 'excel', 'pdf', 'print'
        ]
    });

    //table CSS
    $('#table_wrapper').css({
        "position": 'absolute',
        "padding-left": "5%",
        "padding-right": "5%",
        "top": '25%',
    });

    setActiveTrend(TREND_TABLE);
}