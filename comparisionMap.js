"use strict";

function comparisionMapResize() {
    if (isModeActive(MODE_COMPARISION)) {
        $("#mapid").css("width", "49%");
        $("#mapidComparison").css("width", "49%");
    } else {
        $("#mapid").css("width", "100%");
        $("#mapidComparison").css("width", "100%");
        $("#mapidComparison").hide();
    }
    if (typeof firstMap.map != "undefined")
        firstMap.map.invalidateSize();
    if (typeof comparisonMap.map != "undefined")
        comparisonMap.map.invalidateSize();
}

function comparisionMapShrink() {
    $("#mapid").css("width", "100%");
    $("#mapidComparison").css("width", "100%");
    $("#mapidComparison").hide();
    if (typeof firstMap.map != "undefined")
        firstMap.map.invalidateSize();
    if (typeof comparisonMap.map != "undefined")
        comparisonMap.map.invalidateSize();
}