var leafletPip = {
    pointInLayer: function(p, json, first) {
        if (p instanceof L.LatLng) 
            p = [p.lng, p.lat];
        var results = [];

        $.each(json,function(k,l) {
            if (first && results.length) return;
            if (isPoly(l) && pointInPolygon({
                type: 'Point',
                coordinates: p
            }, l.geometry)) {
                results.push(l);
            }
        });

        return results[0];
    }
};

function isPoly(l) {
    // Leaflet >= 1.0
    return l.geometry && l.geometry.type &&
        ['Polygon', 'MultiPolygon'].indexOf(l.geometry.type) !== -1;
}

// Bounding Box

function boundingBoxAroundPolyCoords (coords) {
    var xAll = [], yAll = []

    for (var i = 0; i < coords[0].length; i++) {
      xAll.push(coords[0][i][1])
      yAll.push(coords[0][i][0])
    }

    xAll = xAll.sort(function (a,b) { return a - b })
    yAll = yAll.sort(function (a,b) { return a - b })

    return [ [xAll[0], yAll[0]], [xAll[xAll.length - 1], yAll[yAll.length - 1]] ]
  }

function pointInBoundingBox(point, bounds) {
    return !(point.coordinates[1] < bounds[0][0] || point.coordinates[1] > bounds[1][0] || point.coordinates[0] < bounds[0][1] || point.coordinates[0] > bounds[1][1]) 
  }

  // Point in Polygon
  // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html#Listing the Vertices

function pnpoly (x,y,coords) {
    var vert = [ [0,0] ]

    for (var i = 0; i < coords.length; i++) {
      for (var j = 0; j < coords[i].length; j++) {
        vert.push(coords[i][j])
      }
      vert.push(coords[i][0])
      vert.push([0,0])
    }

    var inside = false
    for (var i = 0, j = vert.length - 1; i < vert.length; j = i++) {
      if (((vert[i][0] > y) != (vert[j][0] > y)) && (x < (vert[j][1] - vert[i][1]) * (y - vert[i][0]) / (vert[j][0] - vert[i][0]) + vert[i][1])) inside = !inside
    }

    return inside
  }

function pointInPolygon(p, poly) {
    var coords = (poly.type == "Polygon") ? [ poly.coordinates ] : poly.coordinates

    var insideBox = false
    for (var i = 0; i < coords.length; i++) {
      if (pointInBoundingBox(p, boundingBoxAroundPolyCoords(coords[i]))) insideBox = true
    }
    if (!insideBox) return false
    
        
    var insidePoly = false
    for (var i = 0; i < coords.length; i++) {
      if (pnpoly(p.coordinates[1], p.coordinates[0], coords[i])) insidePoly = true
    }
    return insidePoly
  }


//custom funtion:initial bound box for specific layer
function boundInit(poly) {
    var coords = (poly.type == "Polygon") ? [ poly.coordinates ] : poly.coordinates

    var result = [];
    var xAll = [];
    var yAll = [];

    for (var i = 0; i < coords.length; i++) {
      yAll.push(boundingBoxAroundPolyCoords(coords[i])[0][0]);
      xAll.push(boundingBoxAroundPolyCoords(coords[i])[0][1]);
      yAll.push(boundingBoxAroundPolyCoords(coords[i])[1][0]);
      xAll.push(boundingBoxAroundPolyCoords(coords[i])[1][1]);
    }
    xAll = xAll.sort(function (a,b) { return a - b });
    yAll = yAll.sort(function (a,b) { return a - b });

    return [ [xAll[0], yAll[0]], [xAll[xAll.length - 1], yAll[yAll.length - 1]] ];
}