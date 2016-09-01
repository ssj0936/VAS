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
    this.labels =null;
    
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
    this.label = label;
    this.type = 'line';
    this.yAxesGroup = (rightAxis ? 'rightAxis' : 'normal');
    this.fillColor = fillColor;
    this.strokeColor = pointColor;
    this.pointColor = pointColor;
    this.pointStrokeColor = "#fff";
    this.pointHighlightFill = "#fff";
    this.pointHighlightStroke = highlightColor;
    this.dataByDate = [];
    this.dataByWeek = [];
    this.dataByMonth = [];
    //default by date
    this.data = this.dataByDate;
}
//
//Chart.types.Line.extend({
//    name: "Line2Y",
//    getScale: function(data) {
//        var startPoint = this.options.scaleFontSize;
//        var endPoint = this.chart.height - (this.options.scaleFontSize * 1.5) - 5;
//        return Chart.helpers.calculateScaleRange(
//            data,
//            endPoint - startPoint,
//            this.options.scaleFontSize,
//            this.options.scaleBeginAtZero,
//            this.options.scaleIntegersOnly);
//    },
//    initialize: function (data) {
//        var y2datasetLabels = [];
//        var y2data = [];
//        var y1data = [];
//        data.datasets.forEach(function (dataset, i) {
//            if (dataset.y2axis == true) {
//                y2datasetLabels.push(dataset.label);
//                y2data = y2data.concat(dataset.data);
//            } else {
//                y1data = y1data.concat(dataset.data);
//            }
//        });
//        
//        // use the helper function to get the scale for both datasets
//        var y1Scale = this.getScale(y1data);
//        this.y2Scale = this.getScale(y2data);
//        var normalizingFactor = y1Scale.max / this.y2Scale.max;
//
//        // update y2 datasets
//        data.datasets.forEach(function(dataset) {
//            if (y2datasetLabels.indexOf(dataset.label) !== -1) {
//                dataset.data.forEach(function (e, j) {
//                    dataset.data[j] = e * normalizingFactor;
//                })
//            }
//        })
//
//        // denormalize tooltip for y2 datasets
//        this.options.multiTooltipTemplate = function (d) {
//            if (y2datasetLabels.indexOf(d.datasetLabel) !== -1) 
//                return Math.round(d.value / normalizingFactor, 6);
//            else 
//                return d.value;
//        }
//
//        Chart.types.Line.prototype.initialize.apply(this, arguments);
//    },
//    draw: function () {
//        this.scale.xScalePaddingRight = this.scale.xScalePaddingLeft;
//        Chart.types.Line.prototype.draw.apply(this, arguments);
//
//        this.chart.ctx.textAlign = 'left';
//        this.chart.ctx.textBaseline = "middle";
//        this.chart.ctx.fillStyle = "#666";
//        var yStep = (this.scale.endPoint - this.scale.startPoint) / this.y2Scale.steps
//        for (var i = 0, y = this.scale.endPoint, label = this.y2Scale.min; 
//             i <= this.y2Scale.steps; 
//             i++) {
//                this.chart.ctx.fillText(label, this.chart.width - this.scale.xScalePaddingRight + 10, y);
//                y -= yStep;
//                label += this.y2Scale.stepValue
//        }
//    }
//});

var options = {
    pointDotRadius: 5,
    bezierCurve: true,
    scaleShowVerticalLines: false,
    scaleGridLineColor: "black",

    // Boolean - Whether to animate the chart
    animation: false,

    // Number - Number of animation steps
    animationSteps: 5,

    // String - Animation easing effect
    // Possible effects are:
    // [easeInOutQuart, linear, easeOutBounce, easeInBack, easeInOutQuad,
    //  easeOutQuart, easeOutQuad, easeInOutBounce, easeOutSine, easeInOutCubic,
    //  easeInExpo, easeInOutBack, easeInCirc, easeInOutElastic, easeOutBack,
    //  easeInQuad, easeInOutExpo, easeInQuart, easeOutQuint, easeInOutCirc,
    //  easeInSine, easeOutExpo, easeOutCirc, easeOutCubic, easeInQuint,
    //  easeInElastic, easeInOutSine, easeInOutQuint, easeInBounce,
    //  easeOutElastic, easeInCubic]
    animationEasing: "easeOutQuart",

    // Boolean - If we should show the scale at all
    showScale: true,

    // Boolean - If we want to override with a hard coded scale
    scaleOverride: false,

    // ** Required if scaleOverride is true **
    // Number - The number of steps in a hard coded scale
    scaleSteps: null,
    // Number - The value jump in the hard coded scale
    scaleStepWidth: null,
    // Number - The scale starting value
    scaleStartValue: null,

    // String - Colour of the scale line
    scaleLineColor: "rgba(0,0,0,.1)",

    // Number - Pixel width of the scale line
    scaleLineWidth: 1,

    // Boolean - Whether to show labels on the scale
    scaleShowLabels: true,

    // Interpolated JS string - can access value
    scaleLabel: "<%=value%>",

    // Boolean - Whether the scale should stick to integers, not floats even if drawing space is there
    scaleIntegersOnly: true,

    // Boolean - Whether the scale should start at zero, or an order of magnitude down from the lowest value
    scaleBeginAtZero: true,

    // String - Scale label font declaration for the scale label
    scaleFontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",

    // Number - Scale label font size in pixels
    scaleFontSize: 14,

    // String - Scale label font weight style
    scaleFontStyle: "normal",

    // String - Scale label font colour
    scaleFontColor: "#666",

    // Boolean - whether or not the chart should be responsive and resize when the browser does.
    responsive: false,

    // Boolean - whether to maintain the starting aspect ratio or not when responsive, if set to false, will take up entire container
    maintainAspectRatio: true,

    // Boolean - Determines whether to draw tooltips on the canvas or not
    showTooltips: true,

    // Function - Determines whether to execute the customTooltips function instead of drawing the built in tooltips (See [Advanced - External Tooltips](#advanced-usage-custom-tooltips))
    customTooltips: false,

    // Array - Array of string names to attach tooltip events
    tooltipEvents: ["mousemove", "touchstart", "touchmove"],

    // String - Tooltip background colour
    tooltipFillColor: "rgba(0,0,0,0.8)",

    // String - Tooltip label font declaration for the scale label
    tooltipFontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",

    // Number - Tooltip label font size in pixels
    tooltipFontSize: 14,

    // String - Tooltip font weight style
    tooltipFontStyle: "normal",

    // String - Tooltip label font colour
    tooltipFontColor: "#fff",

    // String - Tooltip title font declaration for the scale label
    tooltipTitleFontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",

    // Number - Tooltip title font size in pixels
    tooltipTitleFontSize: 14,

    // String - Tooltip title font weight style
    tooltipTitleFontStyle: "normal",

    // String - Tooltip title font colour
    tooltipTitleFontColor: "#fff",

    // Number - pixel width of padding around tooltip text
    tooltipYPadding: 6,

    // Number - pixel width of padding around tooltip text
    tooltipXPadding: 6,

    // Number - Size of the caret on the tooltip
    tooltipCaretSize: 8,

    // Number - Pixel radius of the tooltip border
    tooltipCornerRadius: 6,

    // Number - Pixel offset from point x to tooltip edge
    tooltipXOffset: 10,

    // String - Template string for single tooltips
    tooltipTemplate: "<%if (datasetLabel ){%><%=datasetLabel %>: <%}%><%= value %>",

    // String - Template string for multiple tooltips
    multiTooltipTemplate: "<%if (datasetLabel ){%><%=datasetLabel %>: <%}%><%= value %>",

    // Function - Will fire on animation progression.
    onAnimationProgress: function () {},

    // Function - Will fire on animation completion.
    onAnimationComplete: function () {},

    scaleShowGridLines: true,

    populateSparseData: true,
    overlayBars: false,
    datasetFill: true,
};

var newOptions = {
    animation: false,
    populateSparseData: true,
    overlayBars: false,
    datasetFill: true,

    showTooltips: true,
    // String - Template string for single tooltips
    tooltipTemplate: "<%if (datasetLabel ){%><%=datasetLabel %>: <%}%><%= value %>",

    // String - Template string for multiple tooltips
    multiTooltipTemplate: "<%if (datasetLabel ){%><%=datasetLabel %>: <%}%><%= value %>",
}