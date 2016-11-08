var topParameterList = ['country', 'model', 'cpu', 'rear_camera', 'front_camera', 'color'];
var topParameterDataSrc = ['observationCountry', 'observationModel', 'observationCpu', 'observationRearCamera', 'observationFrontCamera', 'observationColor'];

var overviewGroupByMode = ['By Day', 'By Week', 'By Month'],
    overviewDefaultGroupBy = overviewGroupByMode[0];

var overviewContainerWidthR = $(window).width() * 0.80 * 0.45 - 20;

var dauDateRangeMax, dauDateRangeMin;
var overviewDatebtn, au, overviewGroupBy;

function overviewInit() {
    $('li#info').click(function () {
        popupChartShow(true);
        overviewElementCreate();
        //btn setting
        $('#overviewDatebtn button').button({
            create: function (event, ui) {
                $('#overviewDatebtn').show();
            }
        });

        $("button.overviewDate").button({
            icons: {
                secondary: "ui-icon-carat-1-s",
            }
        }).css({
            width: '200px'
        });
        
        
        $.ajax({
            url: 'php/_dbqueryGetOverview.php',
            type: "GET",
            dataType: 'json',

            success: function (json) {
                overviewDateBtnInit();
                
                //display text init
                dauDateRangeMax = json.usercountEachDay[json.usercountEachDay.length - 1].date;
                dauDateRangeMin = json.usercountEachDay[0].date;
                var dataRange = dauDateRangeMin + '~' + dauDateRangeMax;
                $('button.overviewDate').button('option', 'label', dataRange);
                
                overviewInitTop(json);
                overviewInitCenterLeft(json);
                overviewInitCenterCenter(json);
                overviewInitCenterRight(json);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("_dbqueryGetOverview:" + xhr.status);
                alert(thrownError);
            }
        });
        
    });
}

function overviewElementCreate() {
    var container = $('#popupChartContainer')
        .append('<div id="overview" style="height:100%"><div class="container" style="height: 100%;"><div id="overviewTop"></div><div id="overviewCenter"><div class="row " style="height: 100%;"><div class="overviewCenter col-xs-3" style="height: 100%;" id="overviewCenterLeft"><div id="todayLogin"></div><div id="divider"></div><div id="topTenLogin"></div></div><div class="col-xs-3" style="height: 100%;"><div class="overviewCenter" id="overviewCenterCenter"></div></div><div class="col-xs-6" style="height: 100%;"><div class="overviewCenter" id="overviewCenterRight"><div id="overviewDatebtn" style="display:none;"><label style="margin-right: 5px;"><b>Date Range</b></label><button class="overviewDate jqueryUIButton">Date</button><div id="overviewDateDropdown" class="selector"><div id="overviewTimeSection"><button class="btn_unpressed" id="overviewBtnToday">Today</button><button class="btn_unpressed" id="overviewBtnYesterday">Yesterday</button><button class="btn_unpressed" id="overviewBtnLastSeven">Last 7 Days</button><button class="btn_unpressed" id="overviewBtnLastThirty">Last 30 Days</button><button class="btn_unpressed" id="overviewBtnThisMonth">This Month</button><button class="btn_unpressed" id="overviewBtnLastMonth">Last Month</button></div><p style="margin-left:3%"><b>Custom date range</b></p><div><input value="From Time" type="text" id="overviewFrom" name="from" />-<input value="To Time" type="text" id="overviewTo" name="to" /></div><div style="display: block;"><button class="overviewSubmit jqueryUIButton">Apply</button></div></div></div></div></div></div></div></div></div>');


}

function overviewDateBtnInit(json) {
    //dropdown setting
    var dropdown = $("#overviewDateDropdown");
    $("button.overviewDate").click(function () {
        if (isLoading()) return;

        if (dropdown.css("display") == "none") {
            overviewDateMenuShow();
        } else {
            overviewDateMenuHide();
        }
    });

    $(document.body).click(function (e) {
        //click target is not dropdown menu
        if ((!$("#overviewDateDropdown").is(e.target) && $("#overviewDateDropdown").has(e.target).length === 0)) {
            //click target is not date button & datepicker is not showing
            if ((!$("button.overviewDate").is(e.target) && $("button.overviewDate").has(e.target).length === 0) && ($("#ui-datepicker-div").is(':hidden'))) {
                //if menu is showing, hide it
                if (!$('#overviewDateDropdown').is(':hidden')) {
                    $('#overviewDateDropdown').fadeOut(300);
                }
            }
        }
    });

    //time period setting
    overviewTimePeriodBtnSetting();

    //date picker setting
    //datePicker
    $("#overviewFrom").datepicker().on("change", function (e) {
        $("#overviewTo").datepicker("option", "minDate", $(this).val());
        overviewDateBtnTextUpdate();
    });
    $("#overviewFrom").datepicker('setDate', new Date());

    $("#overviewTo").datepicker().on("change", function (e) {
        $("#overviewFrom").datepicker("option", "maxDate", $(this).val());
        overviewDateBtnTextUpdate();
    });
    $("#overviewTo").datepicker('setDate', new Date());

    //default date setting
    $("#overviewFrom").datepicker("setDate", new Date(dauDateRangeMin));
    $("#overviewTo").datepicker("setDate", new Date(dauDateRangeMax));

    //submit setting
    overviewSubmitSetting();
}

function overviewTimePeriodBtnSetting() {
    var $from = $("#overviewFrom");
    var $to = $("#overviewTo");

    $('#overviewBtnToday').click(function () {
        $("#overviewFrom").datepicker("option", "maxDate", null);
        $("#overviewTo").datepicker("option", "minDate", null);

        var today = new Date();
        $("#overviewFrom").datepicker("setDate", today).trigger("change");
        today.setDate(today.getDate() + 1);
        $("#overviewTo").datepicker("setDate", today).trigger("change");

        pressToggle(this);
        overviewDateBtnTextUpdate();
    });

    $('#overviewBtnYesterday').click(function () {
        $("#overviewFrom").datepicker("option", "maxDate", null);
        $("#overviewTo").datepicker("option", "minDate", null);

        var day = new Date();
        day.setDate(day.getDate() - 1);

        $("#overviewFrom").datepicker("setDate", day).trigger("change");
        $("#overviewTo").datepicker("setDate", new Date()).trigger("change");
        pressToggle(this);
        overviewDateBtnTextUpdate();
    });

    $('#overviewBtnLastSeven').click(function () {
        $("#overviewFrom").datepicker("option", "maxDate", null);
        $("#overviewTo").datepicker("option", "minDate", null);
        var day = new Date();
        day.setDate(day.getDate() - 7);
        $("#overviewFrom").datepicker("setDate", day);
        $("#overviewTo").datepicker("setDate", new Date());
        pressToggle(this);
        overviewDateBtnTextUpdate();
    });

    $('#overviewBtnLastThirty').click(function () {
        $("#overviewFrom").datepicker("option", "maxDate", null);
        $("#overviewTo").datepicker("option", "minDate", null);
        var day = new Date();
        day.setDate(day.getDate() - 30);
        $("#overviewFrom").datepicker("setDate", day).trigger("change");
        $("#overviewTo").datepicker("setDate", new Date()).trigger("change");
        //        $from.trigger("change");
        //        $to.trigger("change");
        pressToggle(this);
        overviewDateBtnTextUpdate();
    });

    $('#overviewBtnThisMonth').click(function () {
        $("#overviewFrom").datepicker("option", "maxDate", null);
        $("#overviewTo").datepicker("option", "minDate", null);
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

        $("#overviewFrom").datepicker("setDate", fromDate).trigger("change");
        $("#overviewTo").datepicker("setDate", toDate).trigger("change");
        pressToggle(this);
        overviewDateBtnTextUpdate();
    });

    $('#overviewBtnLastMonth').click(function () {
        $("#overviewFrom").datepicker("option", "maxDate", null);
        $("#overviewTo").datepicker("option", "minDate", null);
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

        $("#overviewFrom").datepicker("setDate", fromDate).trigger("change");
        $("#overviewTo").datepicker("setDate", toDate).trigger("change");
        pressToggle(this);
        overviewDateBtnTextUpdate();
    })
}

function overviewDateMenuShow() {
    var dateBtn = $("button.overviewDate");
    var dropdown = $("#overviewDateDropdown");
    var pos = dateBtn.position();

    dropdown.css({
        "left": '' + pos.left + 'px',
        //        "top": '' + (pos.top + dateBtn.height() + 2) + 'px',
        "width": '' + dateBtn.width() - 8 + 'px',
        "z-index": 9999,
    });
    dropdown.fadeIn(300);
}

function overviewDateMenuHide() {
    $('#overviewDateDropdown').fadeOut(300);
}

function overviewDateBtnTextUpdate() {
    var from = $("#overviewFrom").datepicker("getDate");
    var to = $("#overviewTo").datepicker("getDate");
    //console.log(from);
    var text = (from.getFullYear() + "-" + (from.getMonth() + 1) + "-" + from.getDate()) + '~' + (to.getFullYear() + "-" + (to.getMonth() + 1) + "-" + to.getDate());
    $('button.overviewDate').button('option', 'label', text);
}

function overviewSubmitSetting() {
    $('button.overviewSubmit').click(function () {
        //dismiss menu
        $('#overviewDateDropdown').fadeOut(300);
        //load
        loading("Creating chart");

        var from = $("#overviewFrom").datepicker("getDate");
        var newFrom = (from.getFullYear() + "-" + (from.getMonth() + 1) + "-" + from.getDate());
        var to = $("#overviewTo").datepicker("getDate");
        var newTo = (to.getFullYear() + "-" + (to.getMonth() + 1) + "-" + to.getDate());
        console.log(newFrom);
        console.log(newTo);
        var URLs = "php/_dbqueryGetLogUserCount.php";
        $.ajax({
            url: URLs,
            type: "GET",
            data: {
                start: newFrom,
                end: newTo,
            },
            dataType: 'json',

            success: function (json) {

                //out of range
                if (parseDate(newTo) < parseDate(dauDateRangeMin) || parseDate(newFrom) > parseDate(dauDateRangeMax)) {
                    chartDestroy(false);
                    console.log('out of range');
                } else {
                    createDauChart(json);
                }
                $('#overviewTimePeriodSelect').val(overviewDefaultGroupBy);
                $('#overviewTimePeriodSelect').selectmenu("refresh");
                $('#auLabel').text('DAU: ' + getAu());

                loadingDismiss();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("GetLogUserCount:" + xhr.status);
                alert(thrownError);
                loadingDismiss();
            }
        });
    });
}

function overviewInitTop(json) {
    var allUserCount = json.allUserCount;
    var allConsultationCount = json.allCount;
    var consultationPerEachUser = Math.round(allConsultationCount / allUserCount);

    $('#overviewTop')
        .html('<b>Total user count:</b> ' + allUserCount + '　　' + '<b>Total consultation count:</b> ' + allConsultationCount + '　　' + '<b>Average consultation count per user:</b> ' + consultationPerEachUser);
}

function overviewInitCenterLeft(json) {
    //todayLogin
    var container = $('#todayLogin');
    container.empty();
    container.addClass('w3-card-2 w3-light-grey w3-round-small card-padding');

    var title = jQuery('<div/>', {
            class: 'centerLeftTitle overviewTitle',
        })
        .text('Today login count')
        .appendTo(container);

    var list = jQuery('<div/>', {
            class: 'overviewList',
        })
        .css({
            'max-height': '400px',
            'margin-top': '10px',
        })
        .appendTo(container);

    if (json.todayUserArray.length == 0) {
        jQuery('<p/>')
            /*.css({
                        'list-style-type': 'none',
                    })*/
            .text('no login user yet today.').appendTo(list);
    } else {
        for (var i in json.todayUserArray) {
            var accountName = json.todayUserArray[i];
            jQuery('<li/>').css({
                'list-style-type': 'none',
            }).text(accountName).appendTo(list);
        }
    }
    //topTenLogin
    var container = $('#topTenLogin');
    container.empty();
    container.addClass('w3-card-2 w3-light-grey w3-round-small card-padding');

    var title = jQuery('<div/>', {
            class: 'centerLeftTitle overviewTitle',
        })
        .text('Active user Top 10')
        .appendTo(container);

    var tableContainer = jQuery('<div/>', {
            class: 'customScrollBar',
        })
        .css({
            'margin-top': '10px',
            'max-height': '85%',
        })
        .appendTo(container);

    var table = jQuery('<table/>').css({
        'width': '90%',
//        'margin': '10px auto',
    }).appendTo(tableContainer);
    for (var i in json.topTenUserArray) {
        var accountName = json.topTenUserArray[i].username;
        var count = json.topTenUserArray[i].count;
        jQuery('<tr/>')
            .append(
                jQuery('<td/>').text(accountName)
            ).append(
                jQuery('<td/>')
                .text(count)
                .css({
                    'text-align': 'right',
                })
            ).appendTo(table);
    }
}

function overviewInitCenterCenter(json) {
    var selectedIndex = 0;

    var container = $('#overviewCenterCenter');
    container.empty();
    container.addClass('w3-card-2 w3-light-grey card-padding w3-round-small');

    var title = jQuery('<div/>', {
            class: 'centerCenterTitle',
        })
        .css({
            'margin-bottom': '10px',
        })
        .appendTo(container);

    jQuery('<label/>', {
            class: 'overviewTitle'
        })
        .text('Top consultation parameter')
        .css('margin-right', '5px')
        .appendTo(title);


    var selector = jQuery('<select/>').appendTo(title);
    for (var i in topParameterList) {
        var value = topParameterList[i];
        jQuery('<option/>', {
            value: value,
        }).text(value).appendTo(selector);
    }
    selector.children('option[value="' + topParameterList[selectedIndex] + '"]').attr('selected', 'selected');

    var contentContainer = jQuery('<div/>', {
            class: 'centerCenterContent customScrollBar',
        })
        .appendTo(container);

    var table = overviewTopParameterTable(topParameterList[selectedIndex], json);
    table.appendTo(contentContainer);

    //jqueryUI selector setting
    selector.selectmenu({
        width: '80px',
        change: function (event, data) {
            //not allow switching while loading
            if (isLoading()) return;
            contentContainer.hide();

            var parameter = data.item.value;
            var table = overviewTopParameterTable(parameter, json);
            contentContainer.empty();
            table.appendTo(contentContainer);
            contentContainer.fadeIn(300);
        }
    }) /*.css('vertical-align','middle')*/ ;
}

function overviewTopParameterTable(parameter, json) {

    var dataSrc = topParameterDataSrc[topParameterList.indexOf(parameter)];

    var table = jQuery('<table/>')
        .css({
            'width': '90%',
            'margin': 'auto',
        });
    for (var i in json[dataSrc]) {
        var name = json[dataSrc][i].displayName;
        if (name == "_All") continue;

        var count = json[dataSrc][i].count;
        var percentage = '' + ((count / json[dataSrc][0].count) * 100).toFixed(2) + '%';
        jQuery('<tr/>')
            .append(
                jQuery('<td/>').text(name)
            ).append(
                jQuery('<td/>').text(percentage)
            ).append(
                jQuery('<td/>')
                .text(count)
                .css({
                    'text-align': 'right',
                })
            ).appendTo(table);
    }

    return table;
}

function overviewInitCenterRight(json) {
    var container = $('#overviewCenterRight');
    //container.empty();
    container.addClass('w3-card-2 w3-light-grey card-padding w3-round-small');

    var title = jQuery('<div/>', {
        class: 'centerRightTitle'
    }).css('height', '10%').appendTo(container);

    jQuery('<label/>', {
            class: 'overviewTitle'
        })
        .text('User count group:')
        .css('margin-right', '5px')
        .appendTo(title);

    var selector = jQuery('<select/>', {
        id: 'overviewTimePeriodSelect'
    }).appendTo(title);
    for (var i in groupByMode) {
        var value = groupByMode[i];
        jQuery('<option/>', {
            value: value,
        }).text(value).appendTo(selector);
    }

    //DAU calculation
    var dau = jQuery('<label/>', {
            class: 'overviewTitle',
            id: 'auLabel'
        })
        .css('margin-right', '5px')
        .appendTo(
            jQuery('<div/>').appendTo(title)
        );

    //jqueryUI selector setting
    selector.selectmenu({
        width: '100px',
        change: function (event, data) {
            //not allow switching while loading
            overviewGroupBy = data.item.value;
            overviewGroupByChange(overviewGroupBy);
            chartDestroy(false);
            createDauChartElement();
            switch (overviewGroupBy) {
            case 'By Day':
                dau.text('DAU: ' + getAu());
                break;

            case 'By Month':
                dau.text('MAU: ' + getAu());
                break;

            case 'By Week':
                dau.text('WAU: ' + getAu());
                break;
            }
        }
    }) /*.css('vertical-align','middle')*/ ;

    createDauChart(json);
    dau.text('DAU: ' + getAu());
}

function createDauChart(json) {
    dauChartDestroy();

    trendObj = new lineDataObj();
    setDauLable(json);
    setDauData(json);
    overviewGroupByChange(overviewDefaultGroupBy);
    createDauChartElement();
    //    updateColorInfo();
}

function setDauLable(json) {
    var dataSrc = json.dau;
    trendObj = new lineDataObj();

    //LABEL SETTING
    //======================================================
    var startDate = dataSrc[0].date;
    var endDate = dataSrc[dataSrc.length - 1].date;
    var tmpDate = startDate;

    //label by date
    while (parseDate(tmpDate) < parseDate(endDate)) {
        trendObj.labelsByDate.push(tmpDate);

        var tomorrow = new Date(tmpDate);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tmpDate = parseDateToStr(tomorrow);

    }
    trendObj.labelsByDate.push(endDate);

    //label by month
    var currentM = null;
    var currentY = null;
    for (var i in trendObj.labelsByDate) {
        var date = trendObj.labelsByDate[i];
        var d = new Date(date);
        var year = d.getFullYear();
        var month = d.getMonth() + 1;

        if (currentM != month || currentY != year) {
            trendObj.labelsByMonth.push(year + '-' + month);
            currentM = month;
            currentY = year;
        }
    }

    //label by week
    var currentW = null;
    var currentY = null;
    for (var i in trendObj.labelsByDate) {
        var date = trendObj.labelsByDate[i];
        var d = new Date(date);
        var year = d.getFullYear();
        var week = d.getWeek();

        if (currentW != week || currentY != year) {
            trendObj.labelsByWeek.push(year + '- W' + week);
            currentW = week;
            currentY = year;
        }
    }
    //    overviewGroupByChange(overviewDefaultGroupBy);
}

function setDauData(json) {
    var dataSrc = json.dau;

    //clean
    trendObj.datasets.length = 0;

    var color = getRandomColor();
    var highlight = ColorLuminance(color, 0.5);
    var transparentColor = colorHexToRGBString(color, 0.2);
    var dataset = new lineDatasetsObj('', transparentColor, color, highlight, false);

    //first
    //handle the data group by date 
    var DateIndex = 0
    for (var i = 0; i < trendObj.labelsByDate.length; ++i) {

        var find = dataSrc.filter(function (obj) {
            return obj.date == trendObj.labelsByDate[i]
        });
        if (find == false) {
            dataset.dataByDate.push(0);
        } else {
            dataset.dataByDate.push(find[0].count);
        }
    }

    //second 
    //group by month
    var currentM = null;
    var currentY = null;
    var sumInThatMonth = 0;
    var first = true;

    for (var i = 0; i < trendObj.labelsByDate.length; ++i) {
        var date = trendObj.labelsByDate[i];
        var cnt = dataset.dataByDate[i];

        var d = new Date(date);
        var year = d.getFullYear();
        var month = d.getMonth() + 1;

        if (currentM != month || currentY != year) {
            if (first) {
                first = false;
            } else {
                dataset.dataByMonth.push(sumInThatMonth);
                sumInThatMonth = 0;
            }
            currentM = month;
            currentY = year;
        }

        sumInThatMonth += cnt;
    }
    //last one
    dataset.dataByMonth.push(sumInThatMonth);


    //thrid 
    //group by week
    var currentW = null;
    var currentY = null;
    var sumInThatWeek = 0;
    var first = true;

    for (var i = 0; i < trendObj.labelsByDate.length; ++i) {
        var date = trendObj.labelsByDate[i];
        var cnt = dataset.dataByDate[i];

        var d = new Date(date);
        var year = d.getFullYear();
        var week = d.getWeek();

        if (currentW != week || currentY != year) {
            if (first) {
                first = false;
            } else {
                dataset.dataByWeek.push(sumInThatWeek);
                sumInThatWeek = 0;
            }
            currentW = week;
            currentY = year;
        }

        sumInThatWeek += cnt;
    }
    //last one
    dataset.dataByWeek.push(sumInThatWeek);

    trendObj.datasets.push(dataset);
    console.log(trendObj);
}

function createDauChartElement(c) {
    var node = document.createElement("canvas");
    node.className = "chart";
    node.id = 'trendChart';

    var container = jQuery('<div/>', {
        class: 'customScrollBar',
    });
    //    var container = document.createElement("div");
    container.css({
        'border': '10px solid rgba(255,255,255,0)',
        "overflow-y": "hidden",
        //        "display": "inline-block",
        //hide first
        "opacity": "0",
    }).attr('id', 'trendContainer');

    container.append($(node));

    //width cal
    var labelCount = trendObj.labels.length;
    var tmpSpacing = (overviewContainerWidthR - axisWidth) / (labelCount + 1);
    var spacing = (tmpSpacing < chartSpacing) ? chartSpacing : tmpSpacing;

    node.style.height = '300px';
    node.style.width = (axisWidth + spacing * trendObj.labels.length > 32500) ? ('32500px') : '' + (axisWidth + spacing * trendObj.labels.length) + 'px';

    $("#overviewCenterRight").append(container);
    var ctx = node.getContext("2d");
    linechart = new Chart(ctx).Overlay(trendObj, newOptions);

    node.onclick = function(evt)
    {   
        var activePoints = linechart.getPointsAtEvent(evt);
        console.log(activePoints[0].label);
    }
    //show up
    container.animate({
        opacity: 1,
    }, 'slow');
}

function dauChartDestroy() {
    if (trendObj != null) {
        trendObj = null;
    }

    if (linechart != null) {
        linechart.destroy();
    }

    $('#trendContainer').remove();
}

function auCalculation() {
    var sum = 0;
    for (var i in trendObj.datasets[0].data) {
        sum += trendObj.datasets[0].data[i];
    }
    au = (sum / (trendObj.labels.length)).toFixed(2);
}

function getAu() {
    return au;
}

function overviewGroupByChange(chanegTo) {
    switch (chanegTo) {
    case 'By Day':
        trendObj.labels = trendObj.labelsByDate.slice();
        trendObj.datasets[0].data = trendObj.datasets[0].dataByDate;
        break;
    case 'By Month':
        trendObj.labels = trendObj.labelsByMonth.slice();
        trendObj.datasets[0].data = trendObj.datasets[0].dataByMonth;
        break;
    case 'By Week':
        trendObj.labels = trendObj.labelsByWeek.slice();
        trendObj.datasets[0].data = trendObj.datasets[0].dataByWeek;
        break;
    }
    auCalculation();

    trendObj.labels.push("");
}