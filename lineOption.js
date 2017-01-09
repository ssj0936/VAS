var line_data = {
    labels: [],
    datasets: [
        {
            fillColor: "rgba(151,187,205,0.2)",
            strokeColor: "rgba(151,187,205,1)",
            pointColor: "rgba(151,187,205,1)",
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: "rgba(151,187,205,1)",
            data: []
        }
    ]
};

function lineDataObj() {
    this.labelsByDate = [];
    this.labelsByWeek = [];
    this.labelsByMonth = [];
    //default by date
    this.labels = null;

    this.datasets = [];
    this.yAxes = [{
        name: "rightAxis",
        scalePositionLeft: false,
        scaleFontColor: "#666"
     }, {
        name: "normal",
        scalePositionLeft: true,
        scaleFontColor: "#666"
     }];
}

function lineDatasetsObj(label, fillColor, pointColor, highlightColor, rightAxis) {
    //    this.label = label;
    //    this.type = 'line';
    //    this.yAxesGroup = (rightAxis ? 'rightAxis' : 'normal');
    //    this.fillColor = fillColor;
    ////    this.fillColor = "rgba(0,0,0,0)";
    //    this.strokeColor = pointColor;
    //    this.pointColor = pointColor;
    //    this.pointStrokeColor = "#fff";
    //    this.pointHighlightFill = "#fff";
    //    this.pointHighlightStroke = highlightColor;
    //    this.dataByDate = [];
    //    this.dataByWeek = [];
    //    this.dataByMonth = [];
    //    //default by date
    //    this.data = this.dataByDate;

    this.label = label;
    this.yAxesGroup = (rightAxis ? 'rightAxis' : 'normal');
    this.fill = false;
    this.lineTension = 0.1;
    this.backgroundColor = pointColor;
    this.borderColor = pointColor;
    this.borderCapStyle = 'butt';
    this.borderDash = [];
    this.borderDashOffset = 0.0;
    this.borderJoinStyle = 'miter';
    this.pointBorderColor = pointColor;
    this.pointBackgroundColor = "#fff";
    this.pointBorderWidth = 1;
    this.pointHoverRadius = 5;
    this.pointHoverBackgroundColor = pointColor;
    this.pointHoverBorderColor = "rgba(220,220,220,1)";
    this.pointHoverBorderWidth = 2;
    this.pointRadius = 1;
    this.pointHitRadius = 10;
    this.dataByDate = [];
    this.dataByWeek = [];
    this.dataByMonth = [];
    this.data = this.dataByDate;
    this.spanGaps = false;

}

//var options = {
//    pointDotRadius: 5,
//    bezierCurve: true,
//    scaleShowVerticalLines: false,
//    scaleGridLineColor: "black",
//
//    // Boolean - Whether to animate the chart
//    animation: false,
//
//    // Number - Number of animation steps
//    animationSteps: 5,
//
//    // String - Animation easing effect
//    // Possible effects are:
//    // [easeInOutQuart, linear, easeOutBounce, easeInBack, easeInOutQuad,
//    //  easeOutQuart, easeOutQuad, easeInOutBounce, easeOutSine, easeInOutCubic,
//    //  easeInExpo, easeInOutBack, easeInCirc, easeInOutElastic, easeOutBack,
//    //  easeInQuad, easeInOutExpo, easeInQuart, easeOutQuint, easeInOutCirc,
//    //  easeInSine, easeOutExpo, easeOutCirc, easeOutCubic, easeInQuint,
//    //  easeInElastic, easeInOutSine, easeInOutQuint, easeInBounce,
//    //  easeOutElastic, easeInCubic]
//    animationEasing: "easeOutQuart",
//
//    // Boolean - If we should show the scale at all
//    showScale: true,
//
//    // Boolean - If we want to override with a hard coded scale
//    scaleOverride: false,
//
//    // ** Required if scaleOverride is true **
//    // Number - The number of steps in a hard coded scale
//    scaleSteps: null,
//    // Number - The value jump in the hard coded scale
//    scaleStepWidth: null,
//    // Number - The scale starting value
//    scaleStartValue: null,
//
//    // String - Colour of the scale line
//    scaleLineColor: "rgba(0,0,0,.1)",
//
//    // Number - Pixel width of the scale line
//    scaleLineWidth: 1,
//
//    // Boolean - Whether to show labels on the scale
//    scaleShowLabels: true,
//
//    // Interpolated JS string - can access value
//    scaleLabel: "<%=value%>",
//
//    // Boolean - Whether the scale should stick to integers, not floats even if drawing space is there
//    scaleIntegersOnly: true,
//
//    // Boolean - Whether the scale should start at zero, or an order of magnitude down from the lowest value
//    scaleBeginAtZero: true,
//
//    // String - Scale label font declaration for the scale label
//    scaleFontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
//
//    // Number - Scale label font size in pixels
//    scaleFontSize: 14,
//
//    // String - Scale label font weight style
//    scaleFontStyle: "normal",
//
//    // String - Scale label font colour
//    scaleFontColor: "#666",
//
//    // Boolean - whether or not the chart should be responsive and resize when the browser does.
//    responsive: false,
//
//    // Boolean - whether to maintain the starting aspect ratio or not when responsive, if set to false, will take up entire container
//    maintainAspectRatio: true,
//
//    // Boolean - Determines whether to draw tooltips on the canvas or not
//    showTooltips: true,
//
//    // Function - Determines whether to execute the customTooltips function instead of drawing the built in tooltips (See [Advanced - External Tooltips](#advanced-usage-custom-tooltips))
//    customTooltips: false,
//
//    // Array - Array of string names to attach tooltip events
//    tooltipEvents: ["mousemove", "touchstart", "touchmove"],
//
//    // String - Tooltip background colour
//    tooltipFillColor: "rgba(0,0,0,0.8)",
//
//    // String - Tooltip label font declaration for the scale label
//    tooltipFontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
//
//    // Number - Tooltip label font size in pixels
//    tooltipFontSize: 14,
//
//    // String - Tooltip font weight style
//    tooltipFontStyle: "normal",
//
//    // String - Tooltip label font colour
//    tooltipFontColor: "#fff",
//
//    // String - Tooltip title font declaration for the scale label
//    tooltipTitleFontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
//
//    // Number - Tooltip title font size in pixels
//    tooltipTitleFontSize: 14,
//
//    // String - Tooltip title font weight style
//    tooltipTitleFontStyle: "normal",
//
//    // String - Tooltip title font colour
//    tooltipTitleFontColor: "#fff",
//
//    // Number - pixel width of padding around tooltip text
//    tooltipYPadding: 6,
//
//    // Number - pixel width of padding around tooltip text
//    tooltipXPadding: 6,
//
//    // Number - Size of the caret on the tooltip
//    tooltipCaretSize: 8,
//
//    // Number - Pixel radius of the tooltip border
//    tooltipCornerRadius: 6,
//
//    // Number - Pixel offset from point x to tooltip edge
//    tooltipXOffset: 10,
//
//    // String - Template string for single tooltips
//    tooltipTemplate: "<%if (datasetLabel ){%><%=datasetLabel %>: <%}%><%= value %>",
//
//    // String - Template string for multiple tooltips
//    multiTooltipTemplate: "<%if (datasetLabel ){%><%=datasetLabel %>: <%}%><%= value %>",
//
//    // Function - Will fire on animation progression.
//    onAnimationProgress: function () {},
//
//    // Function - Will fire on animation completion.
//    onAnimationComplete: function () {},
//
//    scaleShowGridLines: true,
//
//    populateSparseData: true,
//    overlayBars: false,
//    datasetFill: true,
//};

var newOptions = {
    animation: false,
    populateSparseData: true,
    overlayBars: false,
    datasetFill: true,
    responsive: true,
    maintainAspectRatio: false,
    showTooltips: true,
    //    // String - Template string for single tooltips
    //    tooltipTemplate: "<%if (datasetLabel ){%><%=datasetLabel %>: <%}%><%= value %>",
    //
    //    // String - Template string for multiple tooltips
    //    multiTooltipTemplate: "<%if (datasetLabel ){%><%=datasetLabel %>: <%}%><%= value %>",

    tooltipTemplate: function (label) {
        return '' + (label.datasetLabel) + ': ' + (label.value);
    },
    // String - Template string for multiple tooltips
    multiTooltipTemplate: function (label) {
        return '' + (label.datasetLabel) + ': ' + (label.value);
    },
}

var percentageOptions = {
    scaleBeginAtZero: false,
    animation: false,
    populateSparseData: true,
    overlayBars: false,
    datasetFill: true,
    responsive: true,
    maintainAspectRatio: false,
    showTooltips: true,

    scales: {
        yAxes: [{
            ticks: {
                // Create scientific notation labels
                callback: function (value, index, values) {
                    return value + ' %';
                }
            }
            }]
    },

    //    scaleLabel:function(label) { 
    //        return '' + label.value + ' %';
    //    },

    tooltips: {
        callbacks: {
            label: function (tooltipItem, data) {
                return data.datasets[tooltipItem.datasetIndex].label +': ' + tooltipItem.yLabel+ ' %';
//                return tooltipItem.yLabel + ' %';
            }
        }
    },

    //    multiTooltipTemplate: function (label) {
    //        return '' + (label.datasetLabel) + ': ' + label.value + ' %';
    //    },
}

var negOptions = {
    scaleBeginAtZero: false,
    animation: false,
    populateSparseData: true,
    overlayBars: false,
    datasetFill: true,
    responsive: true,
    maintainAspectRatio: false,
    showTooltips: true,

    scales: {
        yAxes: [{
            ticks: {
                // Create scientific notation labels
                callback: function (value, index, values) {
                    return (value * 100).toFixed(2) + ' %';
                }
            }
            }]
    },

    //    scaleLabel: function (label) {
    //        return '' + ((label.value) * 100).toFixed(2) + ' %';
    //    },

    tooltips: {
        callbacks: {
            label: function (tooltipItem, data) {
                return data.datasets[tooltipItem.datasetIndex].label +': ' + (tooltipItem.yLabel * 100).toFixed(2) + ' %';
            }
        }
    },
    //    tooltipTemplate: function (label) {
    //        return '' + (label.datasetLabel) + ': ' + ((label.value) * 100).toFixed(2) + ' %';
    //    },

//    multiTooltipTemplate: function (label) {
//        return '' + (label.datasetLabel) + ': ' + ((label.value) * 100).toFixed(2) + ' %';
//    },
}