"use strict";

function removeMarkerMap() {
    //console.log("removeMarkerMap");
    if (firstMap.pruneCluster) {
        //firstMap.map.removeLayer(pruneCluster);
        firstMap.pruneCluster.RemoveMarkers();
        firstMap.pruneCluster.ProcessView();
    }
    setIsClickFromFilterResult(false);
}

function addPruneCluster(json) {
    //console.log(json);
    if (firstMap.pruneCluster) {
        //firstMap.map.removeLayer(pruneCluster);
        firstMap.pruneCluster.RemoveMarkers();
    }
    //pruneCluster = new PruneClusterForLeaflet();
    var totalCount = 0;
    for (var i = 0; i < json.length; ++i) {
        var count = parseInt(json[i].cnt);
        firstMap.pruneCluster.RegisterMarker(new PruneCluster.Marker(json[i].lat, json[i].lng, count));
        totalCount += count;
    }
    //move below section to PruneCluster src code.
    /*
    pruneCluster.BuildLeafletCluster = function(cluster, position) {
        var m = new L.Marker(position, {
            icon: pruneCluster.BuildLeafletClusterIcon(cluster)
        });

        m.on('click', function() {
        console.log("click");
        // Compute the  cluster bounds (it's slow : O(n))
            var markersArea = pruneCluster.Cluster.FindMarkersInArea(cluster.bounds);
            var b = pruneCluster.Cluster.ComputeBounds(markersArea);

            if (b) {
                var bounds = new L.LatLngBounds(
                new L.LatLng(b.minLat, b.maxLng),
                new L.LatLng(b.maxLat, b.minLng));

                var zoomLevelBefore = pruneCluster._map.getZoom();
                var zoomLevelAfter = pruneCluster._map.getBoundsZoom(bounds, false, new L.Point(20, 20, null));

                // If the zoom level doesn't change
                if (zoomLevelAfter === zoomLevelBefore) {
                // Send an event for the LeafletSpiderfier
                pruneCluster._map.fire('overlappingmarkers', {
                cluster: pruneCluster,
                markers: markersArea,
                center: m.getLatLng(),
                marker: m
                });

                pruneCluster._map.setView(position, zoomLevelAfter);
                }
                else {
                    pruneCluster._map.fitBounds(bounds);
                }
                
                if(showing_polygon){
                    firstMap.map.removeLayer(showing_polygon);
                }
            }
        });

        m.on('mouseover', function() {
            //console.log("mouseover");
            var markers = cluster.GetClusterMarkers() ;
            var polygon_array = [];
            for(var i=0;i<markers.length;++i){
                polygon_array.push(new Object({lat:markers[i].position.lat, lng:markers[i].position.lng}));
            }
            
            if(showing_polygon){
                firstMap.map.removeLayer(showing_polygon);
            }
            
            var polygon = L.polygon(QuickHull.getConvexHull(polygon_array));
            showing_polygon = polygon;
            showing_polygon.addTo(firstMap.map);
        });
        
        m.on('mouseout', function() {
            //console.log("mouseout");
            if(showing_polygon){
                firstMap.map.removeLayer(showing_polygon);
            }
        });

        return m;
    };*/
    firstMap.totalCnt = totalCount;
    firstMap.pruneCluster.ProcessView();

}