"use strict";
//get observation target data maxDate and minDate
function ajaxGetDateBound() {
    loading("Calculating...");
    //console.log(getDataset());
    var URLs = "php/_dbqueryGetDate.php";
    $.ajax({
        url: URLs,
        type: "GET",
        data: {
            data: JSON.stringify(observeTargetTmp),
            dataset: getDataset(),
        },
        dataType: 'json',

        success: function (json) {
            //console.log(json);
            //clone
            var minData = json.minDate,
                maxData = json.maxDate;
            console.log("ajaxGetDateBound: minData:" + minData + "/maxData:" + maxData);
            //datepicker setting
            $("#from").datepicker("setDate", new Date(minData));
            $("#to").datepicker("setDate", new Date(maxData));
            onChangeTrigger();
            loadingDismiss();
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert("ajaxGetDateBound:" + xhr.status);
            alert(thrownError);
        }
    });
}

//fetch map value with regionJson existed
function ajaxFetchMapValue(hasComparison, isComparison) {
    var mapObj = (isComparison) ? comparisonMap : firstMap;
    //console.log("ajaxFetchMapValue "+((isComparison)?"comparisonMap":"firstMap")+" Start:"+getCurrentTime());
    //console.log(JSON.stringify(observeSpec.color));
//    console.log(JSON.stringify(observeTarget));
//    console.log(JSON.stringify(observeSpec.color));
//    console.log(JSON.stringify(observeSpec.cpu));
//    console.log(JSON.stringify(observeSpec.rear_camera));
//    console.log(JSON.stringify(observeSpec.front_camera));
    var URLs = "php/_dbqueryCntGroupByISO.php";
    $.ajax({
        url: URLs,
        data: {
            color: JSON.stringify(observeSpec.color),
            cpu: JSON.stringify(observeSpec.cpu),
            rearCamera: JSON.stringify(observeSpec.rear_camera),
            frontCamera: JSON.stringify(observeSpec.front_camera),
            iso: JSON.stringify(observeLoc),
            distBranch: JSON.stringify(observeDistBranch),
            data: JSON.stringify(observeTarget),
            from: mapObj.fromFormatStr,
            to: mapObj.toFormatStr,
            dataset: getDataset(),
        },
        type: "GET",
        dataType: 'json',

        success: function (json) {
            //clone
            console.log(((isComparison) ? "comparisonMap" : "firstMap") + "---JSON");
            //console.log(json);
            if (json.length == 0) {
                showToast("Empty Data During This Date Time Period");
                mapObj.isEmpty = true;
            } else {
                mapObj.isEmpty = false;
            }

            if (mapObj.countryMapping && mapObj.countryMapping.length != 0)
                mapObj.countryMapping.length = 0;
            mapObj.countryMapping = json.slice();
            //console.log(mapObj.countryMapping);

            //piechart
            //updateTrendChart(isComparison);
            //max count setting
            mapObj.setMaxMin();

            mapObj.updateMapProperties();
            mapObj.mapDataLoad();
            //updateMapPoly(isComparison);
            mapObj.updateLegend();
            mapObj.info.update();

            //free
            mapObj.countryMapping = null;
            //mapObj.jsonData=null;

            if (hasComparison) {
                comparisonMap.currentRegionIso = observeLoc.slice();
                ajaxFetchMapValue(false, !isComparison);
            } else {
                if (needToLoadTwoModeSameTime) {
                    loadingRegionFinish = true;

                    if (loadingRegionFinish && loadingMarkerFinish) {
                        needToLoadTwoModeSameTime = false;
                        loadingDismiss();
                        loadingRegionFinish = false;
                        loadingMarkerFinish = false;
                    }
                } else {
                    loadingDismiss();
                }
            }
            //console.log("ajaxFetchMapValue "+((isComparison)?"comparisonMap":"firstMap")+" End:"+getCurrentTime());

        },

        error: function (xhr, ajaxOptions, thrownError) {
            alert("ajaxFetchMapValue:" + xhr.status);
            alert(thrownError);
        }
    });
}

//fetch map value without regionJson existed
//need to query regionJson Data first 
//then fetch map value
function ajaxExtractMap(hasComparison, callback, args) {

    //method 1
    //extract from topojson file
    //REF : http://mapshaper.org/
    //http://blog.webkid.io/maps-with-leaflet-and-topojson/
    //---------------------------------------------------------------------------------------
    console.log("ajaxExtractMap Start:" + getCurrentTime());
    firstMap.cleanMap();
    if (hasComparison) {
        comparisonMap.cleanMap();
    }


    firstMap.currentRegionIso = observeLoc.slice();
    //console.log(JSON.stringify(observeLoc));

    firstMap.jsonData = {
        "type": "FeatureCollection",
        "features": [],
    };

    var urls = [];
    if (!isL1(firstMap)) {
        $.each(firstMap.currentRegionIso, function (index, loc) {
            urls.push("php/geojson/topo/l2/" + loc + ".json");
        });
    } else {
        $.each(firstMap.currentRegionIso, function (index, loc) {
            urls.push("php/geojson/topo/l1/" + loc + ".json");
        });
    }

    var jxhr = [];
    $.each(urls, function (i, url) {
        jxhr.push(
            $.getJSON(url, function (json) {
                for (var key in json.objects) {
                    //console.log(key);
                    //console.log(topojson.feature(json, json.objects[key]).features);
                    $.each(topojson.feature(json, json.objects[key]).features, function (index, regionjson) {
                        regionjson.properties["isComparison"] = false;
                        regionjson.properties["boundBox"] = boundInit(regionjson.geometry);
                        firstMap.jsonData.features.push(regionjson);
                    });
                }
            })
        );
    });

    $.when.apply($, jxhr).done(function () {
        if (hasComparison) {
            comparisonMap.jsonData = {
                "type": "FeatureCollection",
                "features": [],
            };
            comparisonMap.jsonData.features = JSON.parse(JSON.stringify(firstMap.jsonData.features));
            for (var i = 0; i < comparisonMap.jsonData.features.length; ++i) {
                comparisonMap.jsonData.features[i].properties.isComparison = true;
                comparisonMap.jsonData.features[i].properties.boundBox = boundInit(comparisonMap.jsonData.features[i].geometry);
            }
        }

        //ajaxFetchMapValue(hasComparison,false);
        if (callback) {
            //            console.log("callback");
            callback.apply(this, args);
        }
        console.log("ajaxExtractMap End:" + getCurrentTime());
    });
}

function ajaxGetMarker() {
    var mapObj = firstMap;
    console.log("ajaxGetMarker Start:" + getCurrentTime());
    var URLs = "php/_dbqueryGetMarker_.php";
    $.ajax({
        url: URLs,
        data: {
            color: JSON.stringify(observeSpec.color),
            cpu: JSON.stringify(observeSpec.cpu),
            rearCamera: JSON.stringify(observeSpec.rear_camera),
            frontCamera: JSON.stringify(observeSpec.front_camera),
            iso: JSON.stringify(observeLoc),
            distBranch: JSON.stringify(observeDistBranch),
            data: JSON.stringify(observeTarget),
            from: mapObj.fromFormatStr,
            to: mapObj.toFormatStr,
            dataset: getDataset(),
        },
        type: "GET",
        dataType: 'json',

        success: function (json) {
            //clone
            console.log("ajaxGetMarker End:" + getCurrentTime());
            if (json.length == 0) {
                showToast("Empty Data During This Date Time Period");
                mapObj.isEmpty = true;
                //return
            } else {
                mapObj.isEmpty = false;
            }

            console.log("addLayer Start:" + getCurrentTime());
            addPruneCluster(json);
            console.log("addLayer End:" + getCurrentTime());
            mapObj.info.update();
            if (needToLoadTwoModeSameTime) {
                loadingMarkerFinish = true;

                if (loadingRegionFinish && loadingMarkerFinish) {
                    needToLoadTwoModeSameTime = false;
                    loadingDismiss();
                    loadingRegionFinish = false;
                    loadingMarkerFinish = false;
                }
            } else {
                loadingDismiss();
            }
        },

        error: function (xhr, ajaxOptions, thrownError) {
            alert("ajaxGetMarker:" + xhr.status);
            alert(thrownError);
        }
    });
}

function ajaxAddBookmark(stringifyObserveTarget, stringifyObserveLoc, stringifyObserveSpec, firstMapTime, comparisonMapTime, activeMode, dataset) {
    $.ajax({
        type: 'GET',
        url: 'php/_dbqueryAddBookmark.php',
        data: {
            user: account,
            title: $('#bookmark_title').val(),
            desc: $('#bookmark_description').val(),
            stringifyObserveTarget: stringifyObserveTarget,
            stringifyObserveLoc: stringifyObserveLoc,
            stringifyObserveSpec: stringifyObserveSpec,
            firstMapTime: firstMapTime,
            comparisonMapTime: comparisonMapTime,
            activeMode: activeMode,
            dataset: dataset,
        },
        dataType: 'json',
        success: function (response) {
            console.log("bookmark Saved success");
            showToast("bookmark Saved");
            ajaxLoadBookmark();
        },
        //        error: function(jqXHR, textStatus, errorThrown) {},
    });
}

function ajaxLoadBookmark() {
    $.ajax({
        type: 'GET',
        url: 'php/_dbqueryLoadBookmark.php',
        data: {
            user: account,
        },
        dataType: 'json',
        success: function (json) {
            if (json) {
                bookmarkList = jQuery.extend(json, {});
//                console.log(bookmarkList);
                //createBookmarkPopup();
            }
        },
        //        error: function(jqXHR, textStatus, errorThrown) {},
    });
}

function ajaxRemoveBookmark(idOfBookmarkDel) {
    $.ajax({
        type: 'GET',
        url: 'php/_dbqueryDeleteBookmark.php',
        dataType: 'json',
        data: {
            user: account,
            index: JSON.stringify(idOfBookmarkDel),
        },
        success: function (json) {
            //            bookmarkList=[];
            ajaxLoadBookmark();
            //            console.log(bookmarkList);
            showToast("bookmark Deleted");
        },
        error: function (jqXHR, textStatus, errorThrown) {},
    });
}

function ajaxRegionChart(countryID, iso, displayname, displaynum, mapObj) {

    if (linechart != null) {
        linechart.destroy();
    }

    var URLs = "php/_dbquerySingleISOCnt.php";
    $.ajax({
        url: URLs,
        data: {
            dataset: getDataset(),
            color: JSON.stringify(observeSpec.color),
            cpu: JSON.stringify(observeSpec.cpu),
            rearCamera: JSON.stringify(observeSpec.rear_camera),
            frontCamera: JSON.stringify(observeSpec.front_camera),
            data: JSON.stringify(observeTarget),
            from: mapObj.fromFormatStr,
            to: mapObj.toFormatStr,
            countryID: countryID,
            isL1: isL1(firstMap),
            iso: iso,
            distBranch: JSON.stringify(observeDistBranch),
        },
        type: "GET",
        dataType: 'json',

        success: function (json) {
            //            console.log(json);
            //empty data set
            updateRegionChart(json, displayname, displaynum);
        },

        error: function (xhr, ajaxOptions, thrownError) {
            alert(xhr.status);
            alert(thrownError);
        }
    });
}

function ajaxTrendChart(mapObj) {
    var URLs = "php/_dbqueryGetTrend.php";
    $.get(URLs, {
            color: JSON.stringify(observeSpec.color),
            cpu: JSON.stringify(observeSpec.cpu),
            rearCamera: JSON.stringify(observeSpec.rear_camera),
            frontCamera: JSON.stringify(observeSpec.front_camera),
            iso: JSON.stringify(observeLoc),
            distBranch: JSON.stringify(observeDistBranch),
            data: JSON.stringify(observeTarget),
            from: mapObj.fromFormatStr,
            to: mapObj.toFormatStr,
            dataset: getDataset()
        },
        function (json) {
            //            console.log(json);
            updateTrendChart(json);
        },
        'json'
    );
}

function ajaxGetDeviceSpec(devices, checkOption) {
    if (specDeviceTmp.length == 0) {
        allSpec = {};
        checkboxSpecInit();
    } else {
        $.ajax({
            type: 'GET',
            url: 'php/_dbqueryGetDeviceSpec.php',
            dataType: 'json',
            data: {
                device_name: JSON.stringify(devices)
            },
            success: function (json) {
                allSpec = json;

                $.each(allSpec, function (name, spec) {
                    spec.sort;
                });
                checkboxSpecInit(checkOption);
            },
            error: function (jqXHR, textStatus, errorThrown) {},
        });
    }
}

function ajaxFetchTableValue(isComparison) {
    var mapObj = (isComparison) ? comparisonMap : firstMap;
    //console.log("ajaxFetchMapValue "+((isComparison)?"comparisonMap":"firstMap")+" Start:"+getCurrentTime());
    var URLs = "php/_dbqueryCntGroupByISO.php";
    return $.ajax({
        url: URLs,
        data: {
            color: JSON.stringify(observeSpec.color),
            cpu: JSON.stringify(observeSpec.cpu),
            rearCamera: JSON.stringify(observeSpec.rear_camera),
            frontCamera: JSON.stringify(observeSpec.front_camera),
            iso: JSON.stringify(observeLoc),
            data: JSON.stringify(observeTarget),
            from: mapObj.fromFormatStr,
            to: mapObj.toFormatStr,
            dataset: getDataset(),
        },
        type: "GET",
        dataType: 'json',

        success: function (json) {
            console.log("ajaxFetchTableValue start");
            $("#homepage").empty();

            popupChartShow(false);

            var tableContenr = '<table id="table" class="table hover table-bordered" cellspacing="0" width="100%">' + '<thead>' + '<tr role="row">' + '<th>Country</th>' + '<th>District/City</th>' + '<th>Number</th>' + '</tr>' + '</thead>' + '</table>';
            $("#popupChartContainer").append(tableContenr);

            for (var i = 0; i < json.length; ++i) {
                var countryID = json[i].countryID;
                json[i]['displayName'] = '';
                json[i]['iso'] = '';
                var find = mapObj.jsonData.features.filter(function (obj) {
                    return (obj.properties.OBJECTID == countryID)
                });
                if (find != false) {
                    json[i].iso = find[0].properties.ISO;

                    json[i].displayName = find[0].properties.NAME_2;
                    if (!isInArray(forcingName2List, find[0].properties.ISO) && (isL1(mapObj) || isInArray(forcingName1List, find[0].properties.ISO))) {
                        json[i].displayName = find[0].properties.NAME_1;
                    }
                }
                //post process
                json[i]['cnt'] = numToString(json[i]['cnt']);
            }
            console.log(json);
            var table = $('table#table').DataTable({
                data: json,
                columns: [
                    {
                        data: 'iso'
                    },
                    {
                        data: 'displayName'
                    },
                    {
                        data: 'cnt'
                    },
                    ],
                pageLength: -1,
                dom: 'Bfrtip',
                buttons: [
                        'copy', 'csv', 'excel', 'pdf', 'print'
                    ]
            });

            //adding all option
            //                jQuery('<option/>', {
            //                    value: -1,
            //                })
            //                .text("All")
            //                .appendTo($("select[name='table_length']"));

            $('#table_wrapper').css({
                "padding-left": "10%",
                "padding-right": "10%",
                "padding-top": "5%",
            });

            console.log("ajaxFetchTableValue end");
            loadingDismiss();
        },

        error: function (xhr, ajaxOptions, thrownError) {
            alert("ajaxFetchMapValue:" + xhr.status);
            alert(thrownError);
        }
    });
}

//Ajax to get dealer's geoJson of select countries
function ajaxGetDealer(){
    $.ajax({
        type:'GET',
        url: 'php/_dbqueryGetDealer.php',
        dataType: 'json',
        data: {
            country:JSON.stringify(observeLocFullName)
        },
        success: function(json){
            allDealer = json;
            json = null;
            dealerLayer();
        },
        error: function(jqXHR, textStatus, errorThrown) {},
    });

}

//Ajax to get SC's geoJson of select countries
function ajaxGetSC(){
    $.ajax({
        type:'GET',
        url: 'php/_dbqueryGetSC.php',
        dataType: 'json',
        data: {
            country:JSON.stringify(observeLoc),
            products:JSON.stringify(defaultProductList)
        },
        success: function(json){
            allSC = json;
            json = null;
            scLayer();
        },
        error: function(jqXHR, textStatus, errorThrown) {},
    });

}

function ajaxLoadBranchDist(){
    $.ajax({
        type:'GET',
        url: 'php/_dbqueryLoadDistBranch.php',
        dataType: 'json',
        success: function(json){
            
            //order by dist
            distBranch.length = 0;
            var currentDist = null;
            var branchList = [];
            var first = true;
            for(var i in json){
                var dist = json[i].dist;
                var branch = json[i].branch;
                
                if(dist != currentDist){
                    if(!first){
                        distBranch.push({dist:currentDist, branch:branchList.slice()});
                        branchList.length = 0;
                        currentDist = dist;
                    }else{
                        first = false;
                        currentDist = dist;
                    }
                }
                
                branchList.push(branch);
            }
            //last one
            distBranch.push({dist:currentDist, branch:branchList.slice()});
//            console.log(distBranch);
            
            //sort order by branch
            json.sort(function(a,b) {
                return (a.branch > b.branch) ? 1 : ((b.branch > a.branch) ? -1 : 
                       (a.dist > b.dist) ? 1 : ((b.dist > a.dist) ? -1 : 0));} ); 
            var currentBranch = null;
            var DistList = [];
            var first = true;
            for(var i in json){
                var dist = json[i].dist;
                var branch = json[i].branch;
                
                if(branch != currentBranch){
                    if(!first){
                        branchDist.push({branch:currentBranch, dist:DistList.slice()});
                        DistList.length = 0;
                        currentBranch = branch;
                    }else{
                        first = false;
                        currentBranch = branch;
                    }
                }
                
                DistList.push(dist);
            }
            //last one
            branchDist.push({branch:currentBranch, dist:DistList.slice()});
//            console.log(branchDist);
            createDistBranchCheckBox();
        },
    })
}

function ajaxGetBranchObject(callback){
    if(observeBranchName.length==0){
        allBranchObject=[];
        callback();
    }
    else{
        $.ajax({
            type:'GET',
            url: 'php/_dbqueryGetBranchObject.php',
            async: "false",
            dataType: 'json',
            data: { 
                branchName : JSON.stringify(observeBranchName)
            },
            success: function(json){
                allBranchObject = json.union;
                delete json.union;
                allHighlighBranch = json;
                json = null;
                callback();
            },
            error: function(jqXHR, textStatus, errorThrown) {},
        });
    }
}

function ajaxSaveLog(){
    //device filter
    var observeTargetStr = '';
    for(var i in observeTarget){
        var type = observeTarget[i].datatype;
        observeTargetStr += '['+observeTarget[i][type]+']';
    }
    
    //loc filter
    var observeLocStr = '';
    for(var i in observeLoc){
        observeLocStr += '['+observeLoc[i]+']';
    }
    
    //observation time
    var dateStr = '[' + firstMap.fromFormatStr + '][' + firstMap.toFormatStr + ']';
    
    //filter all content
    var filter_content = {
        observeTarget : observeTarget,
        observeLoc : observeLoc,
        observeSpec : observeSpec,
    };
    
    if(observeDistBranch.length > 0)
        filter_content['observeDistBranch'] = observeDistBranch;
    
    //current time
    var date = new Date();
    var dformat = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();

    $.ajax({
        type:'POST',
        url: 'php/_dbquerySaveLog.php',
        dataType: 'json',
        data: { 
            date : dformat,
            username : account,
            filter_device : observeTargetStr,
            filter_country : observeLocStr,
            filter_date : dateStr,
            filter_content : JSON.stringify(filter_content),
        },
        success: function(json){
            console.log("log saved");
        }
    });
}