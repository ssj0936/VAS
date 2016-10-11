"use strict";

var countryNeedToShowDistBranch = ['IND'];

function checkChild(el, check) {
    var nextUl = $(el).parent().next("ul");
    //console.log(nextUl);
    if (nextUl.length > 0) {
        //console.log("checkChild");
        $("li input", nextUl).prop("checked", check);
        $("li input", nextUl).each(function () {
            checkChild($(this), check);
        });
    }
    //deepest
    else {
        return;
    }
}

function checkParent(el) {

    //check
    //check all sib is checked or not
    if ($(el).prop("checked")) {
        //find latest ul from target
        var upperUl = $(el).parentsUntil("ul").parent();
        var isAllChecked = true;
        $("li input", upperUl).each(function () {
            if (!$(this).prop("checked")) {
                isAllChecked = false;
            }
        });
        if (isAllChecked) {
            $("input", upperUl.prev("li")).prop("checked", true);
            checkParent($("input", upperUl.prev("li"))[0]);
        }
    } else {
        var upperUl = $(el).parentsUntil("ul").parent();
        var isAllChecked = true;
        $("li input", upperUl).each(function () {
            if (!$(this).prop("checked")) {
                isAllChecked = false;
            }
        });
        if (!isAllChecked) {
            $("input", upperUl.prev("li")).prop("checked", false);
            checkParent($("input", upperUl.prev("li"))[0]);
        }
    }
}

function checkboxDeviceInit() {
    var ul = jQuery('<ul/>').appendTo($("#deviceFilter"));

    var li = jQuery('<li/>').attr("id", "check_device_li").appendTo($(ul));
    jQuery('<input/>', {
        id: 'filter_device_' + "all",
        type: 'checkbox',
        value: "all",
        datatype: "all",
        'data-productName':"all",
        'data-modelName':"all",
        'data-devicesName':"all",
        name: "devicesList",
    }).appendTo($(li));
    jQuery('<label/>', {
        text: "All",
        for: 'filter_device_' + "all",
    }).appendTo(li);

    var productUl = jQuery('<ul/>').appendTo($(ul));
    //ui-icon-squaresmall-plus
    for (var productName in allDevicesList) {
        var li = jQuery('<li/>').appendTo($(productUl));
        //all product
        //collapse icon
        jQuery('<span />', {
                class: "ui-icon ui-icon-circlesmall-plus",
            })
            .css({
                'display': 'inline-block',
                'font-size': '18px',
                'height': '12px',
                'width': '12px',
                'margin-right': '3px',
            })
            .click(function () {
                if ($(this).hasClass('ui-icon-circlesmall-plus')) {
                    $(this).removeClass("ui-icon-circlesmall-plus").addClass("ui-icon-circlesmall-minus");
                } else {
                    $(this).removeClass("ui-icon-circlesmall-minus").addClass("ui-icon-circlesmall-plus");
                }
                $(this).parent().next('ul').slideToggle();
            })
            .appendTo(li);

        jQuery('<input/>', {
            id: 'filter_device_' + productName,
            type: 'checkbox',
            value: productName,
            datatype: "product",
            devices: productName,
            'data-productName':productName,
            'data-modelName':productName,
            'data-devicesName':productName,
            name: "devicesList",
        }).css('display', 'inline-block').appendTo($(li));

        jQuery('<label/>', {
            text: productName,
            for: 'filter_device_' + productName,
        }).appendTo(li);

        var modelUl = jQuery('<ul/>').appendTo($(productUl)).hide();

        for(var modelName in allDevicesList[productName]){
            var li = jQuery('<li/>').appendTo(modelUl);
            //all product
            //collapse icon
            jQuery('<span />', {
                    class: "ui-icon ui-icon-circlesmall-plus",
                })
                .css({
                    'display': 'inline-block',
                    'font-size': '18px',
                    'height': '12px',
                    'width': '12px',
                    'margin-right': '3px',
                })
                .click(function () {
                    if ($(this).hasClass('ui-icon-circlesmall-plus')) {
                        $(this).removeClass("ui-icon-circlesmall-plus").addClass("ui-icon-circlesmall-minus");
                    } else {
                        $(this).removeClass("ui-icon-circlesmall-minus").addClass("ui-icon-circlesmall-plus");
                    }
                    $(this).parent().next('ul').slideToggle();
                })
                .appendTo(li);

            jQuery('<input/>', {
                id: 'filter_device_' + modelName,
                type: 'checkbox',
                value: modelName,
                datatype: "model",
                'data-productName':productName,
                'data-modelName':modelName,
                'data-devicesName':modelName,
                name: "devicesList",
            }).css('display', 'inline-block').appendTo($(li));

            jQuery('<label/>', {
                text: modelName,
                for: 'filter_device_' + modelName,
            }).appendTo(li);

            var deviceUl = jQuery('<ul/>').appendTo(modelUl).hide();
            //model
            for (var i = 0; i < allDevicesList[productName][modelName].length; ++i) {
                var li = jQuery('<li/>').appendTo(deviceUl);
                jQuery('<input/>', {
                    id: 'filter_device_' + allDevicesList[productName][modelName][i],
                    type: 'checkbox',
                    value: allDevicesList[productName][modelName][i],
                    datatype: "devices",
                    'data-productName':productName,
                    'data-modelName':modelName,
                    'data-devicesName':allDevicesList[productName][modelName][i],
                    name: "devicesList",
                }).appendTo($(li));
                jQuery('<label/>', {
                    text: allDevicesList[productName][modelName][i],
                    for: 'filter_device_' + allDevicesList[productName][modelName][i],
                }).appendTo(li);
            }
        }
    }

    //listener setting
    $("#deviceFilter input").each(function (index) {
        $(this).on("click", function () {
            checkChild(this, ($(this).prop("checked") ? true : false));
            checkParent(this);

            observeTargetTmp.length = 0;
            specDeviceTmp.length = 0;
            observeTargetDeviceOnlyTmp.length = 0;
            var checktarget = $("#check_device_li");
            checkDevicePush(checktarget);
//            console.log(observeTargetTmp);
            updateSpecFilter(checktarget);
//            console.log(specDeviceTmp);
            ajaxGetDeviceSpec(specDeviceTmp);
            disableSubmit();
        });
    });
}

function checkboxLocationInit() {
    var worldList = [];
    //console.log(allLoc);

    var ul = jQuery('<ul/>').appendTo($("#locationFilter"));

    var li = jQuery('<li/>').attr("id", "check_location_li").appendTo($(ul));
    jQuery('<input/>', {
        id: 'filter_location_' + "world",
        type: 'checkbox',
        value: "world",
        name: "loc",
        iso: "world",
        disabled: "true",
    }).appendTo($(li));
    jQuery('<label/>', {
        text: "World",
        for: 'filter_location_' + "world",
    }).appendTo(li);

    var allUl = jQuery('<ul/>').appendTo($(ul));

    for (var terrorityName in allLoc) {
        //work around
        if(terrorityName == "CHINA")
            continue;
        
        var li = jQuery('<li/>').attr("class", "filter_country").appendTo($(allUl));
        jQuery('<span />', {
            class: "ui-icon ui-icon-circlesmall-plus",
        })
        .css({
            'display': 'inline-block',
            'font-size': '18px',
            'height': '12px',
            'width': '12px',
            'margin-right': '3px',
        })
        .click(function () {
            if ($(this).hasClass('ui-icon-circlesmall-plus')) {
                $(this).removeClass("ui-icon-circlesmall-plus").addClass("ui-icon-circlesmall-minus");
            } else {
                $(this).removeClass("ui-icon-circlesmall-minus").addClass("ui-icon-circlesmall-plus");
            }
            $(this).parent().next('ul').slideToggle();
        })
        .appendTo(li);

            //continents
            jQuery('<input/>', {
                    id: 'filter_location_' + terrorityName,
                    type: 'checkbox',
                    datatype: "terrority",
                    name: "loc",
                })
                .css('display', 'inline-block')
                .appendTo($(li));

            jQuery('<label/>', {
                text: terrorityName,
                for: 'filter_location_' + terrorityName
            }).appendTo(li);
        
    
        var terrorityUl = jQuery('<ul/>').appendTo($(allUl)).hide();
    
        for(var countryName in allLoc[terrorityName]){
            var li = jQuery('<li/>').attr("class", "filter_country").appendTo($(terrorityUl));

            //continents
            jQuery('<input/>', {
                    id: 'filter_location_' + countryName,
                    type: 'checkbox',
                    value: countryName,
                    datatype: "country",
                    iso: allLoc[terrorityName][countryName][0],
                    name: "loc",
                    inActivation: allLoc[terrorityName][countryName][1],
                    inLifezone: allLoc[terrorityName][countryName][2],
                })
                .css('display', 'inline-block')
                .appendTo($(li));

            jQuery('<label/>', {
                text: countryName,
                for: 'filter_location_' + countryName,
            }).appendTo(li);
        }
    }

    //listener setting
    $("#locationFilter input").each(function (index) {
        $(this).on("click", function () {

            checkChild(this, ($(this).prop("checked") ? true : false));
            checkParent(this);
            
            if (getDataset() == DATA_LIFEZONE) {
                var locStr = '';
                $('input:checked[name="loc"][datatype="country"][inLifezone="0"]').each(function(){
                    locStr += $(this).val()+', ';
                    $(this).prop('checked', false);
                    checkParent(this);
                });
                
                if(locStr != '')
                    showAlert("cannot choose this location<br>because <b>" + locStr + "</b> is not in the dataset [<b>Lifezone</b>]");
            }

            observeLocTmp.length = 0;
            observeLocFullNameTmp.length = 0;
            checkLocPush();
//            console.log(JSON.stringify(observeLocTmp));
            
            var needToShowDistBranch = false;
            for(var i in observeLocTmp){
                if(countryNeedToShowDistBranch.indexOf(observeLocTmp[i]) != -1){
                    needToShowDistBranch = true;
                    break;
                }
            }

            //create dist branch filter
            if(needToShowDistBranch && observeLocTmp.length == 1){
                if(!isDistBranchFilterShowing){
                    isDistBranchFilterShowing = true;
                    //filter show up
                    $('#section_branch_dist').stop(true,true).fadeIn('medium');
                    $('#section_branch_dist').collapsible('open');
                    
                    ajaxLoadBranchDist();
                }
            }else{
                if(isDistBranchFilterShowing)
                    //data delete
                    observeDistBranch.length = 0;
                    //UI remove
                    destroyDistBranchCheckBox();
            }
        });
    });
}

function checkboxSpecInit(checkOption) {
    $('.hardware_filter').each(
        function (key, e) {
            var hardware = e.id.substring(8);
            observeSpecTmp[hardware] = [];
            if ($.isEmptyObject(allSpec)) {
                var specArray = [];
            } else {
                var specArray = allSpec[hardware];
            }

            if (!$(e).collapsible('collapsed') && specArray.length == 0) {
                $(e).collapsible('close');
            }
            //$(".specFilter").empty();
            $($(".specFilter")[key]).empty();
            var ul = jQuery('<ul/>').appendTo($($(".specFilter")[key]));
            if (specArray.length > 0) {
                var li = jQuery('<li/>').attr("id", "check_" + hardware + "_li").appendTo($(ul));
                jQuery('<input/>', {
                    id: 'filter_' + hardware + '_' + "all",
                    type: 'checkbox',
                    value: "all",
                    name: hardware,
                    class: "checkbox" + hardware,
                }).hide().appendTo($(li)).fadeIn(300);
                jQuery('<label/>', {
                    text: "All",
                    for: 'filter_' + hardware + '_' + "all",
                }).hide().appendTo(li).fadeIn(300);
            }
            var allUl = jQuery('<ul/>').appendTo($(ul));

            for (var i = 0; i < specArray.length; ++i) {
                var li = jQuery('<li/>').appendTo($(allUl));

                //continents
                jQuery('<input/>', {
                        id: 'filter_' + hardware + '_' + specArray[i],
                        type: 'checkbox',
                        value: specArray[i],
                        name: hardware,
                        class: "checkbox" + hardware,
                    })
                    .css('display', 'inline-block')
                    .hide().appendTo($(li)).fadeIn(300);

                jQuery('<label/>', {
                    text: specArray[i],
                    for: 'filter_' + hardware + '_' + specArray[i],
                }).hide().appendTo(li).fadeIn(300);
            }

            //listener setting
            $('#' + $(".specFilter")[key].id + ' input').each(function (index) {
                $(this).on("click", function () {
                    checkChild(this, ($(this).prop("checked") ? true : false));
                    checkParent(this);

                    observeSpecTmp[hardware].length = 0;
                    var checktarget = $("#check_" + hardware + "_li");
                    checkSpecPush(checktarget, hardware);
                });
            });

            //if check option exist, then apply it
            //or default movement is checking 'all' option for all filter
            if (!checkOption) {
                $("#filter_" + hardware + "_all").trigger('click');
            } else {
                for (var i in checkOption[hardware]) {
                    var id = checkOption[hardware][i];
                    var checkThis = $("#filter_" + hardware + "_" + id).get(0);
                    $(checkThis).prop('checked', true);
                    checkChild(checkThis, ($(checkThis).prop("checked") ? true : false));
                    checkParent(checkThis);
                }
                var checktarget = $("#check_" + hardware + "_li");
                checkSpecPush(checktarget, hardware);
            }
            enableSubmit();
        }
    );
}

function createDistBranchCheckBox(){

    //dist -> branch
    var container = $('#distToBranch');
    
    var ul = jQuery('<ul/>').appendTo(container);
    var li = jQuery('<li/>').attr("id", "filter_distBranch_li").appendTo(ul);
    jQuery('<input/>', {
        id: 'filter_distBranch_' + "all",
        type: 'checkbox',
        value: 'all',
        'data-dist':'all',
        'data-branch':'all',
        'data-isDeepestLevel':false,
        name: "distBranch",
    }).appendTo($(li));
    jQuery('<label/>', {
        text: "All",
        for: 'filter_distBranch_' + "all",
    }).appendTo(li);

    var distUl = jQuery('<ul/>').appendTo(ul);
    
    
    for(var i in distBranch){
        var dist = distBranch[i].dist;
        var branchList = distBranch[i].branch;
        
        var li = jQuery('<li/>').appendTo(distUl);
        //all product
        //collapse icon
        jQuery('<span />', {
                class: "ui-icon ui-icon-circlesmall-plus",
            })
            .css({
                'display': 'inline-block',
                'font-size': '18px',
                'height': '12px',
                'width': '12px',
                'margin-right': '3px',
            })
            .click(function () {
                if ($(this).hasClass('ui-icon-circlesmall-plus')) {
                    $(this).removeClass("ui-icon-circlesmall-plus").addClass("ui-icon-circlesmall-minus");
                } else {
                    $(this).removeClass("ui-icon-circlesmall-minus").addClass("ui-icon-circlesmall-plus");
                }
                $(this).parent().next('ul').slideToggle();
            })
            .appendTo(li)

        jQuery('<input/>', {
            id: 'filter_distBranch_' + dist,
            type: 'checkbox',
            value: dist,
            'data-dist':dist,
            'data-branch':dist,
            'data-isDeepestLevel':false,
            name: "distBranch",
        }).css('display', 'inline-block').appendTo($(li));

        jQuery('<label/>', {
            text: dist,
            for: 'filter_distBranch_' + dist,
        }).appendTo(li);

        var branchUl = jQuery('<ul/>').appendTo(distUl).hide();

        for(var index in branchList){
            var branchName = branchList[index]
            var li = jQuery('<li/>').appendTo(branchUl);
            jQuery('<input/>', {
                id: 'filter_distBranch_' + dist + '_' + branchName,
                type: 'checkbox',
                value: branchName,
                'data-dist':dist,
                'data-branch':branchName,
                'data-isDeepestLevel':true,
                name: "distBranch",
            }).css('display', 'inline-block').appendTo($(li));

            jQuery('<label/>', {
                text: branchName,
                for: 'filter_distBranch_' + dist + '_' + branchName,
            }).appendTo(li);
        }
    }
    
    //branch -> dist
    var container = $('#branchToDist');
    
    var ul = jQuery('<ul/>').appendTo(container);
    var li = jQuery('<li/>').attr("id", "filter_branchDist_li").appendTo(ul);
    jQuery('<input/>', {
        id: 'filter_branchDist' + "all",
        type: 'checkbox',
        value: 'all',
        'data-dist':'all',
        'data-branch':'all',
        'data-isDeepestLevel':false,
        name: "branchDist",
    }).appendTo($(li));
    jQuery('<label/>', {
        text: "All",
        for: 'filter_branchDist' + "all",
    }).appendTo(li);

    var branchUl = jQuery('<ul/>').appendTo(ul);
    
    for(var i in branchDist){
        var distList = branchDist[i].dist;
        var branch = branchDist[i].branch;
        
        var li = jQuery('<li/>').appendTo(branchUl);
        //all product
        //collapse icon
        jQuery('<span />', {
                class: "ui-icon ui-icon-circlesmall-plus",
            })
            .css({
                'display': 'inline-block',
                'font-size': '18px',
                'height': '12px',
                'width': '12px',
                'margin-right': '3px',
            })
            .click(function () {
                if ($(this).hasClass('ui-icon-circlesmall-plus')) {
                    $(this).removeClass("ui-icon-circlesmall-plus").addClass("ui-icon-circlesmall-minus");
                } else {
                    $(this).removeClass("ui-icon-circlesmall-minus").addClass("ui-icon-circlesmall-plus");
                }
                $(this).parent().next('ul').slideToggle();
            })
            .appendTo(li)

        jQuery('<input/>', {
            id: 'filter_branchDist' + branch,
            type: 'checkbox',
            value: branch,
            'data-dist':branch,
            'data-branch':branch,
            'data-isDeepestLevel':false,
            name: "branchDist",
        }).css('display', 'inline-block').appendTo($(li));

        jQuery('<label/>', {
            text: branch,
            for: 'filter_branchDist' + branch,
        }).appendTo(li);

        var distUl = jQuery('<ul/>').appendTo(branchUl).hide();

        for(var index in distList){
            var distName = distList[index]
            var li = jQuery('<li/>').appendTo(distUl);
            jQuery('<input/>', {
                id: 'filter_branchDist' + branch + '_' + distName,
                type: 'checkbox',
                value: distName,
                'data-dist':distName,
                'data-branch':branch,
                'data-isDeepestLevel':true,
                name: "branchDist",
            }).css('display', 'inline-block').appendTo($(li));

            jQuery('<label/>', {
                text: distName,
                for: 'filter_branchDist' + branch + '_' + distName,
            }).appendTo(li);
        }
    }

    //online -> dist
    var container = $('#onlineDist');
    
    var ul = jQuery('<ul/>').appendTo(container);
    var li = jQuery('<li/>').attr("id", "filter_onlineDist_li").appendTo(ul);
    jQuery('<input/>', {
        id: 'filter_onlineDist_' + "all",
        type: 'checkbox',
        value: 'all',
        'data-online':'all',
        'data-dist':'all',
        'data-isDeepestLevel':false,
        name: "onlineDist",
    }).appendTo($(li));
    jQuery('<label/>', {
        text: "All",
        for: 'filter_onlineDist_' + "all",
    }).appendTo(li);

    var onlineUl = jQuery('<ul/>').appendTo(ul);
    
    
    for(var i in onlineDist){
        var online = onlineDist[i].online_dist;
        var distList = onlineDist[i].dist;
        
        var li = jQuery('<li/>').appendTo(onlineUl);
        //all product
        //collapse icon
        jQuery('<span />', {
                class: "ui-icon ui-icon-circlesmall-plus",
            })
            .css({
                'display': 'inline-block',
                'font-size': '18px',
                'height': '12px',
                'width': '12px',
                'margin-right': '3px',
            })
            .click(function () {
                if ($(this).hasClass('ui-icon-circlesmall-plus')) {
                    $(this).removeClass("ui-icon-circlesmall-plus").addClass("ui-icon-circlesmall-minus");
                } else {
                    $(this).removeClass("ui-icon-circlesmall-minus").addClass("ui-icon-circlesmall-plus");
                }
                $(this).parent().next('ul').slideToggle();
            })
            .appendTo(li)

        jQuery('<input/>', {
            id: 'filter_onlineDist_' + online,
            type: 'checkbox',
            value: online,
            'data-online':online,
            'data-dist':online,
            'data-isDeepestLevel':false,
            name: "onlineDist",
        }).css('display', 'inline-block').appendTo($(li));

        jQuery('<label/>', {
            text: online,
            for: 'filter_onlineDist_' + online,
        }).appendTo(li);

        var distUl = jQuery('<ul/>').appendTo(onlineUl).hide();

        for(var index in distList){
            var distName = distList[index]
            var li = jQuery('<li/>').appendTo(distUl);
            jQuery('<input/>', {
                id: 'filter_onlineDist_' + online + '_' + distName,
                type: 'checkbox',
                value: distName,
                'data-online':online,
                'data-dist':distName,
                'data-isDeepestLevel':true,
                name: "onlineDist",
            }).css('display', 'inline-block').appendTo($(li));

            jQuery('<label/>', {
                text: distName,
                for: 'filter_onlineDist_' + online + '_' + distName,
            }).appendTo(li);
        }
    }

    $("#branchDistFilter input").each(function () {
        $(this).on("click", function () {
            checkChild(this, ($(this).prop("checked") ? true : false));
            checkParent(this);
        });
    });
    
}

function filterRecord(){
    //dist branch
    observeDistBranch.length = 0;
    var isOnlineDist = false;
    $('input:checked[data-isdeepestlevel=true]').each(function(){
        if ($(this)[0].hasAttribute('data-branch')) {
            observeDistBranch.push({
                dist : $(this).attr('data-dist'),
                branch: $(this).attr('data-branch'),
            });
        } else if ($(this)[0].hasAttribute('data-online')) {
            isOnlineDist = true;
        }
    });

    //whether Gap button can show(no branch/dist selected & only one country be select & country in the list)
    isGapButtonCanShow = (observeDistBranch.length == 0 && !isOnlineDist && observeLoc.length == 1 && $.inArray(observeLoc[0], countryNeedToShowDistBranch) != -1) ? true : false;
    //whether any branch/dist be selected
    isDistBranchSelected = (observeDistBranch.length > 0) ? true : false;

    //get selected branch
    observeBranchName.length = 0;
    var observeBranchNameTmp = [];
    $('input:checked[name="branchDist"], input:checked[name="distBranch"]').each(function(){
        observeBranchNameTmp.push($(this).attr('data-branch'));
    });
    observeBranchName = observeBranchNameTmp.filter(
        function(value, index, self) { 
            return self.indexOf(value) === index;
        }
    );

    observeDistName.length = 0;
    $('input:checked[name="onlineDist"]').each(function(){
        observeDistName.push($(this).attr('data-dist'));
    });
}

function filterRecordClean(){
    //dist branch
    observeDistBranch.length = 0;
    observeBranchName.length = 0;
    observeDistName.length = 0;
}

function destroyDistBranchCheckBox(){
    
    //clean
    $('#distToBranch').empty();
    $('#distToBranch').hide();
    $('#branchToDist').empty();
    $('#branchToDist').hide();
    $('#onlineDist').empty();
    $('#onlineDist').hide();
    distBranch.length = 0;
    branchDist.length = 0;
    onlineDist.length = 0;
    
    
    $('#locset button').removeClass('active');
    
    //filter show up
    if(!$('#section_branch_dist').collapsible('collapsed'))
        $('#section_branch_dist').collapsible('close');
    $('#section_branch_dist').stop(true,true).fadeOut('medium');
    
    isDistBranchFilterShowing = false;
}

function checkDevicePush(el) {
    if ($("input", el).prop("checked")) {
        observeTargetTmp.push({
            model: $("input", el).attr("data-modelName"),
            devices: $("input", el).val(),
            product: $("input", el).attr("data-productName"),
            datatype: $("input", el).attr("datatype"),
        });
    } else {
        el.next("ul").children("li").each(function () {
            checkDevicePush($(this));
        })
    }
}

function checkLocPush() {
    $('input:checked[name="loc"][datatype="country"]').each(function(){
        observeLocTmp.push($(this).attr("iso"));
        observeLocFullNameTmp.push($(this).val());
    });
}

function checkSpecPush(el, hardware) {
    if ($("input", el).prop("checked")) {
        observeSpecTmp[hardware].push($("input", el).attr("value"));
    } else {
        el.next("ul").children("li").each(function () {
            checkSpecPush($(this), hardware);
        })
    }
}


function updateSpecFilter(el) {
    $('input:checked[name="devicesList"][datatype="devices"]').each(function(){
        specDeviceTmp.push($(this).val());
        
        observeTargetDeviceOnlyTmp.push({
            model: $(this).attr("data-modelName"),
            devices: $(this).val(),
            product: $(this).attr("data-productName"),
            datatype: $(this).attr("datatype"),
        });
    });
}

function getFilterModel(){
    var model = [];
    $('input:checked[name="devicesList"][datatype="devices"]').each(function(){
        model.push($(this).attr("data-modelName"));
    });
    
    return model.filter(
        function(value, index, self) { 
            return self.indexOf(value) === index;
        }
    );
}


function resetFilterStatus() {
    $('.hardware_filter').each(
        function (key, e) {
            if (!$(e).collapsible('collapsed')) {
                $(e).collapsible('close');
            }
        }
    );
}

function cleanFilterCheck() {
    $("input[name='devicesList']").prop('checked', false);
    $("input[name='loc']").prop('checked', false);
    $("input[name='cpu']").prop('checked', false);
    $("input[name='color']").prop('checked', false);
    $("input[name='rear_camera']").prop('checked', false);
    $("input[name='front_camera']").prop('checked', false);
}

function cleanLocFilter() {
    $("input[datatype='country']").prop('checked', false);
    observeLocTmp.length = 0;
    observeLocFullNameTmp.length = 0;
}

function cleanDistBranchFilter() {
    $("input[name='distBranch']").prop('checked', false);
    $("input[name='branchDist']").prop('checked', false);
    $("input[name='onlineDist']").prop('checked', false);
}