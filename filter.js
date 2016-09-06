"use strict";

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
            .appendTo(li)

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
                .appendTo(li)

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
    for (var name in allLoc) {
        worldList.push({
            name: name,
            iso: allLoc[name][0],
            inActivation: allLoc[name][1],
            inLifezone: allLoc[name][2]
        });
    }

    //console.log(worldList);
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

    for (var i = 0; i < worldList.length; ++i) {
        var li = jQuery('<li/>').attr("class", "filter_country").appendTo($(allUl));

        //continents
        jQuery('<input/>', {
                id: 'filter_location_' + worldList[i].name,
                type: 'checkbox',
                value: worldList[i].name,
                datatype: "country",
                iso: worldList[i].iso,
                name: "loc",
                inActivation: worldList[i].inActivation,
                inLifezone: worldList[i].inLifezone,
            })
            .css('display', 'inline-block')
            .appendTo($(li));

        jQuery('<label/>', {
            text: worldList[i].name,
            for: 'filter_location_' + worldList[i].name,
        }).appendTo(li);
    }

    //listener setting
    $("#locationFilter input").each(function (index) {
        $(this).on("click", function () {
            if (getDataset() == DATA_LIFEZONE && $(this).prop("checked") && $(this).attr('inLifezone') == 0) {
                showAlert("cannot choose this location<br>because <b>" + $(this).val() + "</b> is not in the dataset [<b>Lifezone</b>]");
                $(this).prop('checked', false);
            }



            checkChild(this, ($(this).prop("checked") ? true : false));
            checkParent(this);

            observeLocTmp.length = 0;
            observeLocFullNameTmp.length = 0;
            var checktarget = $("#check_location_li");
            checkLocPush(checktarget);
            //console.log(JSON.stringify(observeTargetTmp));
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

function checkLocPush(el) {
    if ($("input", el).prop("checked")) {
        observeLocTmp.push($("input", el).attr("iso"));
        observeLocFullNameTmp.push($("input", el).val());
    } else {
        el.next("ul").children("li").each(function () {
            checkLocPush($(this));
        })
    }
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
    //loop to deepest level
    if ($("input", el).attr("datatype") == 'devices') {
        if ($("input", el).prop("checked")) {
            specDeviceTmp.push(
                $("input", el).val()
            );
            //used for filter in trend
            observeTargetDeviceOnlyTmp.push({
                model: $("input", el).attr("data-modelName"),
                devices: $("input", el).val(),
                product: $("input", el).attr("data-productName"),
                datatype: $("input", el).attr("datatype"),
            });
        }
    } else {
        el.next("ul").children("li").each(function () {
            updateSpecFilter($(this));
        })
    }
}

//function getCurrentFilterTitle() {
//    var obj = {
//        Devices: [],
//        ISO: observeLoc,
//        Color: observeSpec.color,
//        CPU: observeSpec.cpu,
//        RearCamera: observeSpec.rear_camera,
//        FrontCamera: observeSpec.front_camera,
//    }
//
//    for (var i in observeTarget) {
//        if (observeTarget[i].datatype == "model")
//            obj.Devices.push(observeTarget[i].devices);
//        else
//            obj.Devices.push(observeTarget[i].model + '(' + observeTarget[i].devices + ')');
//    }
//
//    return obj;
//}

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