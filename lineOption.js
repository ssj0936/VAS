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

function option() {
    //    this.animation = true;
    this.populateSparseData = true;
    this.overlayBars = false;
    this.datasetFill = true;
    this.responsive = true;
    this.maintainAspectRatio = false;
    this.showTooltips = true;
    this.legend = {
        position: 'right',
        display: false,
        fullWidth: false,
    };
    //    this.responsiveAnimationDuration = 300;
}

var newOptions = new option();
newOptions.scales = {
    yAxes: [{
        ticks: {
            callback: function (value) {
                return value.toFixed(2);
            }
        }
      }]
};


var percentageOptions = new option();
percentageOptions.scales = {
    yAxes: [{
        ticks: {
            // Create scientific notation labels
            callback: function (value) {
                return '' + value.toFixed(2) + ' %';
            }
        }
            }]
};
percentageOptions.tooltips = {
    callbacks: {
        label: function (tooltipItem, data) {
            return data.datasets[tooltipItem.datasetIndex].label + ': ' + tooltipItem.yLabel + ' %';
        }
    }
};


var negOptions = new option();
negOptions.scales = {
    yAxes: [{
        ticks: {
            // Create scientific notation labels
            callback: function (value) {
                return (value * 100).toFixed(2) + ' %';
            }
        }
            }]
};

negOptions.tooltips = {
    callbacks: {
        label: function (tooltipItem, data) {
            return data.datasets[tooltipItem.datasetIndex].label + ': ' + (tooltipItem.yLabel * 100).toFixed(2) + ' %';
        }
    }
};


var barchartOptions = new option();
barchartOptions.tooltips = {
    mode: 'label'
};
//barchartOptions.responsive = true;
//barchartOptions.maintainAspectRatio = false;
barchartOptions.scales = {
    xAxes: [
        {
            display: true,
            gridLines: {
                display: true
            },
            labels: {
                show: true,
            }
        }
    ],
    yAxes: [
        {
            type: "linear",
            display: true,
            position: "left",
            id: "y-axis-1",
            gridLines: {
                display: false
            },
            labels: {
                show: true,
            }
        }, {
            type: "linear",
            display: true,
            position: "right",
            id: "y-axis-2",
            gridLines: {
                display: false
            },
            labels: {
                show: true,
            },
            ticks: {
                callback: function (value) {
                    return '' + value.toFixed(2) + ' %';
                }
            }
        }
    ]
};