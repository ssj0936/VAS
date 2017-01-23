"use strict";

var activationDistribution = (function () {

    var trendObj = null;

    var rightPopupContainerWidthP = 0.84;
    var trendContainerWidthP = 0.8;
    var chartHeight = 600;
    var chartSpacing = 60;

    function barData() {
        this.labels = [];

        this.data = [];
        this.percentageData = [];

        this.datasets = [
            {
                type: 'line',
                label: 'Accumulation Percentage',
                fill: false,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255,99,132,1)',
                borderWidth: 1,
                data: this.percentageData,
                yAxisID: 'y-axis-2'
            }, {
                type: 'bar',
                label: 'Activation Count',
                fill: false,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                data: this.data,
                yAxisID: 'y-axis-1'
            }
        ];

        this.addData = function (data, percentageData) {
            this.data.push(data);
            this.percentageData.push(percentageData);
        }
    }

    function createChart(json) {
        //        console.log(json);
        //data reset
        chartDestroy(true);
        //fetch data
        trendObj = new barData();
        setTrendLable(json);
        setTrendData(json);
        createChartElement();
        loadingDismiss();
    }

    function setTrendLable(json) {
        trendObj.labels = [];
        for (var i in json) {
            var count = json[i].count;
            var name = json[i].name;
            var percentage = json[i].percentage;

            trendObj.labels.push(name);
        }
        trendObj.labels.push("");
    }

    function setTrendData(json) {
        //clean
        //        trendObj.datasets.length = 0;
        var percentageSum = 0;
        for (var i in json) {
            var count = json[i].count;
            var name = json[i].name;
            var percentage = json[i].percentage;

            percentageSum += parseFloat(percentage);
            if (i == json.length - 1 || percentageSum > 100)
                percentageSum = 100.00;

            trendObj.addData(count, percentageSum);
        }
    }

    function createChartElement(opt) {
        trendObjOriginal = jQuery.extend(true, {}, trendObj);

        var node = document.createElement("canvas");
        node.className = "chart";
        node.id = 'trendChart';

        //width cal
        var labelCount = trendObj.labels.length;
        var tmpSpacing = (trendContainerWidthR - axisWidth) / (labelCount + 1);
        var spacing = (tmpSpacing < chartSpacing) ? chartSpacing : tmpSpacing;

        var container = jQuery('<div/>', {
                class: 'customScrollBar',
            })
            .css({
                "position": "absolute",
                "left": "2%",
                "width": "100%",
                'border': '10px solid rgba(255,255,255,0)',
                "overflow-y": "hidden",
                "display": "inline-block",
                //hide first
                "opacity": "0",
            })
            .attr('id', 'trendContainer')
            .append(jQuery('<div/>', {
                    id: "chartSide",
                    class: "customScrollBar",
                })
                .css({
                    'width': '80%',
                    'display': 'inline-block',
                    'vertical-align': 'top',
                    //'overflow': 'auto',
                })
                .append(
                    jQuery('<div/>', {
                        id: "chartBody"
                    })
                    .css({
                        width: '' + (axisWidth + spacing * trendObj.labels.length) + 'px',
                    })
                    .append(node))


            )
            .append(jQuery('<div/>', {
                    id: "legendSide",
                    class: 'customScrollBar',
                })
                .css({
                    'width': '20%',
                    'height': '' + chartHeight + 'px',
                    'display': 'inline-block',
                    'vertical-align': 'top'
                })
            );

        node.style.height = '' + chartHeight + 'px';
        node.style.width = (axisWidth + spacing * trendObj.labels.length > 32500) ? ('32500px') : '' + (axisWidth + spacing * trendObj.labels.length) + 'px';

        $('#tableContainer').append(container);
        var ctx = node.getContext("2d");
        linechart = new Chart(ctx, {
            type: 'bar',
            data: trendObj,
            options: barchartOptions
        });

        //seperate legend
        var legend = linechart.generateLegend();
        $('#legendSide').html(legend);
        $('#legendSide li').click(function () {

            var needToShow;
            var target = $(this).text();
            if ($(this).css('text-decoration') == 'line-through') {
                needToShow = true;
                $(this).css({
                    'text-decoration': 'none',
                    'opacity': '1',
                });
            } else if ($(this).css('text-decoration') == 'none') {
                needToShow = false;
                $(this).css({
                    'text-decoration': 'line-through',
                    'opacity': '0.3',
                });
            }

            if (needToShow) {
                for (var i in trendObjOriginal.datasets) {
                    if (trendObjOriginal.datasets[i].label == target) {
                        trendObj.datasets.push(trendObjOriginal.datasets[i]);
                        break;
                    }
                }
            } else {
                for (var i in trendObj.datasets) {
                    if (trendObj.datasets[i].label == target) {
                        trendObj.datasets.splice(i, 1);
                        break;
                    }
                }
            }
            //ensure line always on top
            trendObj.datasets.sort(
                function (x, y) {
                    if (x.type == 'line') return -1
                    else return 1;
                }
            );

            linechart.update();
        });
        //show up
        container.animate({
            opacity: 1,
        }, 'slow');
    }

    function chartDestroy() {
        //destroy old chart
        if (trendObj != null) {
            trendObj = null;
        }

        if (linechart != null) {
            linechart.destroy();
        }

        $('#trendContainer').remove();
        $('#trendColorInfo').remove();
    }

    var module = {
        showChart: createChart,
        chartDestroy: chartDestroy,
    };

    return module;

}());