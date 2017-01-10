var legendColor = ['#a34a64', '#ce4a64', '#e85c5d', '#faac73', '#fbc67f', '#fbe19c', '#FFFFFF'];
var legendColorBlockWidth = 18,
    legendColorBlockGap = 5,
    legendWidth = 150,
    legendHeight = 190,
    legendTopPadding = 20;

function getBoundingBox(data) {
    var bounds = {},
        coords, point, latitude, longitude;

    // We want to use the 「features」 key of the FeatureCollection (see above)
    data = data.features;
    for (var i = 0; i < data.length; i++) {
        var coordArray = data[i].geometry.coordinates;
        loopAllCoor(coordArray, bounds);
    }

    // Returns an object that contains the bounds of this GeoJSON
    // data. The keys of this object describe a box formed by the
    // northwest (xMin, yMin) and southeast (xMax, yMax) coordinates.
    return bounds;
}

function loopAllCoor(coordinateArr, bounds) {
    //not coordinateArr
    if (!$.isNumeric(coordinateArr[0])) {
        for (var i in coordinateArr) {
            loopAllCoor(coordinateArr[i], bounds);
        }
    } else {
        var longitude = coordinateArr[0];
        var latitude = coordinateArr[1];

        bounds.xMin = bounds.xMin < longitude ? bounds.xMin : longitude;
        bounds.xMax = bounds.xMax > longitude ? bounds.xMax : longitude;
        bounds.yMin = bounds.yMin < latitude ? bounds.yMin : latitude;
        bounds.yMax = bounds.yMax > latitude ? bounds.yMax : latitude;
    }
}

function draw(bounds, data, scale, needLegend) {
    var context;
    // Get the drawing context from our <canvas> and
    // set the fill to determine what color our map will be.

    var canvas = document.createElement("canvas");
    canvas.id = 'drawMap';


    var boundMax = Conv.ll2m(bounds.xMax, bounds.yMax);
    var boundMin = Conv.ll2m(bounds.xMin, bounds.yMin);

    var width = ((Math.abs(boundMax.x - boundMin.x)) * scale) + 200;
    var height = (Math.abs(boundMax.y - boundMin.y)) * scale;

    canvas.setAttribute('height', '' + height + 'px');
    canvas.setAttribute('width', '' + width + 'px');
    var mapCanvas = document.getElementById('mapCanvas');
    mapCanvas.appendChild(canvas);

    context = canvas.getContext('2d');

    data = data.features;
    var coundProjection = Conv.ll2m(bounds.xMin, bounds.yMax);
    for (var i = 0; i < data.length; i++) {
        var coordArray = data[i].geometry.coordinates;
        var color = colorHexToRGBString(getColor(data[i].properties.activationCnt), 0.8);
        getEveryCoord(coordArray, context, scale, bounds, coundProjection, color);
    }
    if (needLegend)
        legendDraw(context, height, width)
}

function legendDraw(context, height, width) {
    context.beginPath();
    context.rect(width - (legendWidth + 10), height - (legendHeight + 10), legendWidth, legendHeight);
    context.closePath();
    context.fillStyle = '#EEE';
    context.fill();

    var grades = [colorPattern[patternIndex], colorPattern[patternIndex] / 5 * 4, colorPattern[patternIndex] / 5 * 3, colorPattern[patternIndex] / 5 * 2, colorPattern[patternIndex] / 5 * 1, 0];
    for (var i = 0; i < legendColor.length; ++i) {
        var color = legendColor[i];
        context.beginPath();
        context.rect(width - (legendWidth + 10) + 10, height - (legendHeight + 10) + legendTopPadding + (i * (legendColorBlockGap + legendColorBlockWidth)), legendColorBlockWidth, legendColorBlockWidth);
        context.closePath();
        context.fillStyle = color;
        context.fill();
        context.beginPath();
        context.font = '14pt Calibri';
        context.fillStyle = 'black';
        var str;
        if (i == 0)
            str = grades[i] + '+';
        else if (i == legendColor.length - 1)
            str = '0';
        else
            str = '' + grades[i - 1] + ' - ' + grades[i];

        context.fillText(str, width - (legendWidth + 10) + 10 + legendColorBlockWidth + 10, height - (legendHeight + 10) + legendTopPadding + (i * (legendColorBlockGap + legendColorBlockWidth) + 15));

        context.fill();
        context.closePath();
    }
}

function getEveryCoord(coordinateArr, context, scale, bounds, coundProjection, color) {
    //not coordinateArr
    if (!$.isNumeric(coordinateArr[0][0])) {
        for (var i in coordinateArr) {
            getEveryCoord(coordinateArr[i], context, scale, bounds, coundProjection, color);
        }
    } else {
        context.fillStyle = color;
        context.beginPath();
        for (var j in coordinateArr) {
            var longitude = coordinateArr[j][0];
            var latitude = coordinateArr[j][1];
            //            console.log(longitude+'//'+latitude);
            var point = Conv.ll2m(longitude, latitude);
            point.x = (point.x - coundProjection.x) * scale;
            point.y = (coundProjection.y - point.y) * scale;
            // If this is the first coordinate in a shape, start a new path
            if (j == 0) {
                context.moveTo(point.x, point.y);
            } else {
                context.lineTo(point.x, point.y);
            }
        }
        context.closePath();
        context.fill();
        context.strokeStyle = "#CCC";
        context.lineWidth = 0.5;
        context.stroke();

    }
}

function getColor(d) {
    return d > colorPattern[patternIndex] ? legendColor[0] :
        d > colorPattern[patternIndex] / 5 * 4 ? legendColor[1] :
        d > colorPattern[patternIndex] / 5 * 3 ? legendColor[2] :
        d > colorPattern[patternIndex] / 5 * 2 ? legendColor[3] :
        d > colorPattern[patternIndex] / 5 * 1 ? legendColor[4] :
        d == 0 ? legendColor[6] :
        legendColor[5];
};

function isCanvasOversize(width, height) {
    return (width > 32767 || height > 32767 || (width * height) > 268435456);
}

var Conv = ({
    r_major: 6378137.0, //Equatorial Radius, WGS84
    r_minor: 6356752.314245179, //defined as constant
    f: 298.257223563, //1/f=(a-b)/a , a=r_major, b=r_minor
    deg2rad: function (d) {
        var r = d * (Math.PI / 180.0);
        return r;
    },
    rad2deg: function (r) {
        var d = r / (Math.PI / 180.0);
        return d;
    },
    ll2m: function (lon, lat) //lat lon to mercator
        {
            //lat, lon in rad
            var x = this.r_major * this.deg2rad(lon);

            if (lat > 89.5) lat = 89.5;
            if (lat < -89.5) lat = -89.5;


            var temp = this.r_minor / this.r_major;
            var es = 1.0 - (temp * temp);
            var eccent = Math.sqrt(es);

            var phi = this.deg2rad(lat);

            var sinphi = Math.sin(phi);

            var con = eccent * sinphi;
            var com = .5 * eccent;
            var con2 = Math.pow((1.0 - con) / (1.0 + con), com);
            var ts = Math.tan(.5 * (Math.PI * 0.5 - phi)) / con2;
            var y = 0 - this.r_major * Math.log(ts);
            var ret = {
                'x': x,
                'y': y
            };
            return ret;
        },
    m2ll: function (x, y) //mercator to lat lon
        {
            var lon = this.rad2deg((x / this.r_major));

            var temp = this.r_minor / this.r_major;
            var e = Math.sqrt(1.0 - (temp * temp));
            var lat = this.rad2deg(this.pj_phi2(Math.exp(0 - (y / this.r_major)), e));

            var ret = {
                'lon': lon,
                'lat': lat
            };
            return ret;
        },
    pj_phi2: function (ts, e) {
        var N_ITER = 15;
        var HALFPI = Math.PI / 2;


        var TOL = 0.0000000001;
        var eccnth, Phi, con, dphi;
        var i;
        var eccnth = .5 * e;
        Phi = HALFPI - 2. * Math.atan(ts);
        i = N_ITER;
        do {
            con = e * Math.sin(Phi);
            dphi = HALFPI - 2. * Math.atan(ts * Math.pow((1. - con) / (1. + con), eccnth)) - Phi;
            Phi += dphi;

        }
        while (Math.abs(dphi) > TOL && --i);
        return Phi;
    }
});