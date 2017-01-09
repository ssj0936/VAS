"use strict";

var trendParallel = (function (mapObj) {
    var TREND_COUNTRY_RATIO = 'trend_country_ratio',
        TREND_MODEL_RATIO = 'trend_model_ratio',
        TREND_MODEL_COUNT = 'trend_model_count',
        TREND_DISTI_COUNT = 'trend_disti_count';

    var TREND_COUNTRY_RATIO_DISPLAY = 'rate by Country',
        TREND_MODEL_RATIO_DISPLAY = 'rate by Model',
        TREND_MODEL_COUNT_DISPLAY = 'by Model',
        TREND_DISTI_COUNT_DISPLAY = 'by Disti';

    var FILE_EXPORT_TYPE_IMPORT = 'Import',
        FILE_EXPORT_TYPE_EXPORT = 'Export';
    
    var trendList = [TREND_COUNTRY_RATIO, TREND_MODEL_RATIO, TREND_MODEL_COUNT, TREND_DISTI_COUNT];
    var trendNameList = [TREND_COUNTRY_RATIO_DISPLAY, TREND_MODEL_RATIO_DISPLAY, TREND_MODEL_COUNT_DISPLAY, TREND_DISTI_COUNT_DISPLAY];
    var defaultTrendMode = trendList[0];
    var defaultTrendModeName = trendNameList[0];

    var activeTrend = defaultTrendMode;

    var rightPopupContainerWidthP = 0.84;
    var trendContainerWidthP = 0.8;

    function showChart(iso) {
        if (observeTarget.length > 0 && !mapObj.isEmpty) {
            //            loading("Creating Chart...");
            resetFilterStatus();
            scrollToTop();
            popupChartShow(true);
            if(isModeActive(MODE_PARALLEL_IMPORT))
                ajaxParallelChart(iso,FILE_EXPORT_TYPE_IMPORT);
            else if(isModeActive(MODE_PARALLEL_EXPORT))
                ajaxParallelChart(iso,MODE_PARALLEL_EXPORT);
        }
    }

    function _createFunctionalBtn() {
        var container = jQuery('<div/>', {
                id: "functionalBtnContainer",
            })
            //export Btn
            .append(
                jQuery('<button/>', {
                    id: "btnExport",
                    class: "trendFunctionBtn",
                })
                .text('EXPORT FILE')
                .click(function () {
                    if(_getActiveTrend() == TREND_COUNTRY_RATIO || _getActiveTrend() == TREND_MODEL_RATIO )
                        return exportFile(_getActiveTrend(), true);
                    else
                        return exportFile(_getActiveTrend(), false);
                })
                .button()
            )

        return container;
    }

    function updateParallelChart(json, iso) {
        if (json.countryFlowRatio.length == 0) return;
        
        if (linechart != null) {
            linechart.destroy();
        }

        var container = jQuery('<div/>', {
            class: 'container',
        }).css({
            'height': '100%',
            'width': '100%',
        }).appendTo($('#popupChartContainer'));

        var row = jQuery('<div/>', {
            class: 'row',
        }).css({
            'height': '100%',
        }).appendTo(container);

        var leftPopup = jQuery('<div/>', {
            id: 'leftPopupContainer',
            class:'col-xs-2',
        }).css({
            'display': 'inline-block',
//            'width': '15%',
            'height': '100%',
            'vertical-align': 'top',
            'position': 'relative',
            'background-color': '#EEE',
        }).appendTo(row);

        var rightPopup = jQuery('<div/>', {
            id: 'rightPopupContainer',
            class:'col-xs-10',
        }).css({
            'display': 'inline-block',
//            'width': '' + rightPopupContainerWidthP * 100 + '%',
            'height': '100%',
            'vertical-align': 'top',
            'position': 'relative',
        }).appendTo(row);

        //title container
        var title = jQuery('<div/>', {
                id: 'lineChartTitle',
            })
            .css({
                'top': '' + getWindowHeightPercentagePx(0.1) + 'px',
            })
            .appendTo(rightPopup);

        _createFunctionalBtn().appendTo(title);

        var parallelMode = isModeActive(MODE_PARALLEL_IMPORT) ? 'Import' : 'Export';
        //title content
        jQuery('<div/>', {
                id: "currentTrendTitle",
                class: 'w3-padding-4',
            })
            .css('text-align', 'left')
            .append(
                jQuery('<p/>', {
                    'id': 'option'
                })
                .text(parallelMode + ' ' + defaultTrendModeName)
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
        var optionContainer = jQuery('<div/>', {
                id: 'trendOptionContainer',
            })
            .appendTo(title).hide();

        for (var i in trendList) {
            var parallelMode = isModeActive(MODE_PARALLEL_IMPORT) ? 'Import' : 'Export';

            jQuery('<div/>', {
                    id: 'trendByParallel' + trendList[i],
                    class: "w3-light-grey w3-hover-shadow w3-padding-4 w3-center",
                })
                .html('<h4>' + parallelMode + ' ' + trendNameList[i] + '</h4>')
                .appendTo(optionContainer)
                .click(function (index) {
                    return function () {
                        if (_getActiveTrend() == trendList[index]) {
                            //menu close
                            $('#trendOptionContainer').stop(true, true).slideToggle('medium');
                            return;
                        }

                        _setActiveTrend(trendList[index]);
                        //if trendcontainer hide, show it
                        if ($('#trendContainer').is(':hidden'))
                            $('#trendContainer').slideDown('medium');

                        //table remove
                        $('#table_wrapper').remove();

                        $('#trendContainer').css({
                            'opacity': 0
                        });

                        createChart(json, trendList[index]);
                        
                        $('#currentTrendTitle p#option').text(parallelMode + ' ' + trendNameList[index]);
                        $('#trendContainer').fadeTo(300, 1);

                        //menu close
                        $('#trendOptionContainer').stop(true, true).slideToggle('medium');
                    }
                }(i));
        }
        var filterDisplayer = createFilterResult();
        filterDisplayer.appendTo(leftPopup);

        //chart
        createChart(json, defaultTrendMode);
    }

    function createChart(json, trendMode) {
        //data reset
        chartDestroy(true);
        //fetch data
        trendObj = new lineDataObj();
        setTrendLable(json);


        switch (trendMode) {
            case TREND_COUNTRY_RATIO:
                setTrendData(json.countryFlowRatio);
                createChartElement(percentageOptions);
                break;

            case TREND_MODEL_RATIO:
                setTrendData(json.modelFlowRatio);
                createChartElement(percentageOptions);
                break;

            case TREND_MODEL_COUNT:
                setTrendData(json.modelFlowCount);
                createChartElement();
                break;

            case TREND_DISTI_COUNT:
                setTrendData(json.distFlowCount);
                createChartElement();
                break;
        }
        
        _setActiveTrend(trendMode);
        //updateColorInfo();
        loadingDismiss();
    }

    function setTrendLable(json) {
        var startDate = json.timeRange.start + '-1';
        var endDate = json.timeRange.end + '-1';
        var tmpDate = startDate;
        //label by month
        while (parseDate(tmpDate) < parseDate(endDate)) {
            var date = new Date(tmpDate);
            var label = date.getFullYear() + '-' + (date.getMonth() + 1);
            trendObj.labelsByMonth.push(label);

            var nextMonth = new Date(tmpDate);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            tmpDate = parseDateToStr(nextMonth);

        }
        var date = new Date(endDate);
        var label = date.getFullYear() + '-' + (date.getMonth() + 1);
        trendObj.labelsByMonth.push(label);

        trendObj.labels = trendObj.labelsByMonth;
        trendObj.labels.push("");
    }

    function setTrendData(jsonObj) {
        //clean
        trendObj.datasets.length = 0;


        var jsonArray = Object.keys(jsonObj);
        for (var index in jsonArray) {
            var name = jsonArray[index];
            var data = jsonObj[name];

            var color = getRandomColor();
            var highlight = ColorLuminance(color, 0.5);
            var transparentColor = colorHexToRGBString(color, 0.2);
            var dataset = new lineDatasetsObj(name, transparentColor, color, highlight, false);

            //second 
            //group by month
            var currentM = null;
            var currentY = null;
            var sumInThatMonth = 0;
            var first = true;

            for (var i = 0; i < trendObj.labelsByMonth.length; ++i) {
                var date = trendObj.labelsByMonth[i];

                var find = data.filter(function (obj) {
                    return obj.date == date;
                });
                if (find == false) {
                    dataset.dataByMonth.push(0);
                } else {
                    dataset.dataByMonth.push(find[0].value);
                }
            }
            
            dataset.data = dataset.dataByMonth;
            trendObj.datasets.push(dataset);
        }
    }

    function createChartElement(opt) {
        var node = document.createElement("canvas");
        node.className = "chart";
        node.id = 'trendChart';

        var container = jQuery('<div/>', {
            class: 'customScrollBar',
        });
        container.css({
            "position": "absolute",
            "top": "" + getWindowHeightPercentagePx(0.3) + 'px',
            "left": "2%",
            "width": "" + trendContainerWidthP * 100 + "%",
            'border': '10px solid rgba(255,255,255,0)',
            "overflow-y": "hidden",
            "display": "inline-block",
            //hide first
            "opacity": "0",
        }).attr('id', 'trendContainer');

//        jQuery('<div/>', {
//                id: 'trendColorInfo',
//                class: "w3-light-grey customScrollBar",
//            })
//            .appendTo($("#rightPopupContainer"));

        container.append($(node));

        //width cal
        var labelCount = trendObj.labels.length;
        var tmpSpacing = (trendContainerWidthR - axisWidth) / (labelCount + 1);
        var spacing = (tmpSpacing < chartSpacing) ? chartSpacing : tmpSpacing;

        node.style.height = '' + chartHeight + 'px';
        node.style.width = (axisWidth + spacing * trendObj.labels.length > 32500) ? ('32500px') : '' + (axisWidth + spacing * trendObj.labels.length) + 'px';

        $('#rightPopupContainer').append(container);
        var ctx = node.getContext("2d");
        linechart = new Chart(ctx, {
            type: 'line',
            data: trendObj,
            options: ( opt ? opt : newOptions)
        });

        //show node info
        node.onclick = function(evt)
        {
            $('#loginHistoryContainer').remove();

            var str = '';
            var activePoints = linechart.getElementsAtEvent(evt);
            console.log(activePoints);
            for(var i in activePoints){
                var datasetLabel = activePoints[i].datasetLabel;
                var value = activePoints[i].value;
                
                str += '['+datasetLabel+':'+value+']';
            }
            console.log(str);
        }
        //show up
        container.animate({
            opacity: 1,
        }, 'slow');
    }

    function exportFile(ReportTitle, addPercentageMark) {
        console.log(trendObj.datasets);
        
        var style = 'style="border:1px solid black"';
        var exportArray = [];
        for (var i in trendObj.labels) {
            var date = trendObj.labels[i];
            if(date == '') continue;

            var Obj = {
                "date": date
            };
            for (var j in trendObj.datasets) {
                var label = trendObj.datasets[j].label;
                var countAtThatDay = trendObj.datasets[j].data[i] 
                                        + (addPercentageMark ? " %": "");
                Obj[label] = countAtThatDay;
            }
            exportArray.push(Obj);
        }
        console.log(exportArray);
        var arrData = exportArray;
        var HTMLTableStr = '';
        //Set Report title in first row or line

        HTMLTableStr += '<table>';
        HTMLTableStr += '<tr><td>' + ReportTitle + '</td></tr>';
        var row = "";
        for (var index in arrData[0]) {
            //Now convert each value to string and comma-seprated
            row += '<td '+style+'>'+index + '</td>';
        }
        row = '<tr>'+row+'</tr>';

        //append Label row with line break
        HTMLTableStr += row;

        for (var i = 0; i < arrData.length; i++) {
            var row = "";

            for (var index in arrData[i]) {
                row += '<td '+style+'>' + arrData[i][index] + '</td>';
            }
            row = '<tr>'+row+'</tr>';
            //add a line break after each row
            HTMLTableStr += row;
        }
        HTMLTableStr += '</table>';

        if (HTMLTableStr == '') {
            alert("Invalid data");
            return;
        }
        
        var blob = new Blob([HTMLTableStr], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8,%EF%BB%BF"
        });
        var fileName = "MyReport_";
        fileName += ReportTitle.replace(/ /g, "_") + '.xls';
        saveAs(blob, fileName);
    }
    
    function chartDestroy(dataNeedToSetNull) {
        //destroy old chart
        if (dataNeedToSetNull) {
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

    function _getActiveTrend() {
        return activeTrend;
    }

    function _setActiveTrend(mode) {
        activeTrend = mode;
    }

    function parallelReportExportDialogShow(){

        if(getFunction() != FUNC_PARALLEL) return;

        var exportTypeDialogDiv = ($('#exportTypeDialogDiv').length == 0) ? 
            (jQuery('<div/>',{id:'exportTypeDialogDiv'}).html('<b>Select export type:</b>').appendTo($('#popupChartContainer'))) :
            ($('#exportTypeDialogDiv'));
        exportTypeDialogDiv.dialog({
            modal: true,
            resizable: false,
            width: 500,
            show: {
                effect: "blind",
                duration: 100
            },
            buttons: {
                'Parallel Import': function () {
                    console.log('Parallel Import');
                    ajaxParallelExport(FILE_EXPORT_TYPE_IMPORT);
                    $(this).dialog('close');
                },
                'Parallel Export': function () {
                    console.log('Parallel Export');
                    ajaxParallelExport(FILE_EXPORT_TYPE_EXPORT);
                    $(this).dialog('close');
                },
            }
        });
        exportTypeDialogDiv.dialog('open');
    }

    var module = {
        showChart: showChart,
        updateParallelChart: updateParallelChart,
        parallelReportExport:parallelReportExportDialogShow,
    };

    return module;

}(firstMap));