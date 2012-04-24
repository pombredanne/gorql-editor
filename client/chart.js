/*jslint vars: false, browser: true, nomen: true */
/*global QBA: true, _, $, alert, DV */

// Copyright 2012 Yaco Sistemas S.L.
//
// Developed by Yaco Sistemas <ablanco@yaco.es>
//
// Licensed under the EUPL, Version 1.1 or – as soon they
// will be approved by the European Commission - subsequent
// versions of the EUPL (the "Licence");
// You may not use this work except in compliance with the
// Licence.
// You may obtain a copy of the Licence at:
//
// http://joinup.ec.europa.eu/software/page/eupl
//
// Unless required by applicable law or agreed to in
// writing, software distributed under the Licence is
// distributed on an "AS IS" basis,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
// express or implied.
// See the Licence for the specific language governing
// permissions and limitations under the Licence.

if (typeof QBA === 'undefined') {
    window.QBA = {};
}

QBA.chart = {};

QBA.chart.getUrl = function () {
    "use strict";
    var query = QBA.theQuery.toSPARQL();
    return QBA.preview.viewer + "/viewer/?query=" + encodeURIComponent(query);
};

QBA.chart.openViewerData = function () {
    "use strict";
    var url = QBA.chart.getUrl();
    window.open(url, "_blank");
};

QBA.chart.openViewerChartAndData = function () {
    "use strict";
    var url = QBA.chart.getUrl(),
        radio = _.find($("input[name=chart_type]"), function (radio) { return radio.checked; }),
        params;

    try {
        params = QBA.chart.getChartParams(radio.value);
    } catch (err) {
        alert(err);
    }

    url += "&chart=" + radio.value;
    _.each(_.keys(params), function (key) {
        url += "&" + key + "=" + params[key];
    });

    window.open(url, "_blank");
};

QBA.chart.fillFormWithDefaultValues = function (chart) {
    "use strict";
    if (typeof DV.defaults === "undefined") {
        return;
    }

    var defaults = DV.defaults[chart],
        params;

    if (typeof defaults === "undefined") {
        return;
    }

    params = $("#step5 #" + chart + "Params div.parameter input");

    _.each(params, function (input) {
        var name = $(input).attr("name").split('-')[1];
        if (defaults.hasOwnProperty(name) && $(input).val() === "") {
            $(input).val(defaults[name]);
        }
    });

    params = $("#step5 #" + chart + "Params div.parameter select");

    _.each(params, function (select) {
        var name = $(select).attr("name").split('-')[1];
        if (defaults.hasOwnProperty(name) && $(select).val() === "") {
            $(select).val(defaults[name]);
        }
    });
};

QBA.chart.getChartParams = function (chart, ignoreRequire) {
    "use strict";
    var params = $("#step5 #" + chart + "Params div.parameter input"),
        result = {},
        options,
        aux;

    options = _.map(params, function (p) {
        p = $(p);
        var value = p.val();
        if (p.attr("type") === "checkbox") {
            value = p.is(":checked");
        }
        if (!ignoreRequire && p.is(".required")) {
            if (value === "") {
                throw "Required field is missing";
            }
        }
        return {
            key: p.attr("name").split('-')[1],
            value: value
        };
    });

    params = $("#step5 #" + chart + "Params div.parameter select");
    aux = _.map(params, function (p) {
        p = $(p);
        var value = p.val(),
            indexes = value.split('-'),
            idxAux = 0,
            idx,
            categories,
            field;

        if (indexes.length === 3) {
            indexes = [
                parseInt(indexes[0], 10),
                parseInt(indexes[1], 10),
                parseInt(indexes[2], 10)
            ];
            categories = QBA.theQuery.getCategoriesWithCheckedCollections();

            // Generate variable name for field
            _.each(categories, function (category, idxCat) {
                _.each(category.getCheckedCollections(), function (collection, idxCol) {
                    _.each(collection.getCheckedFields(), function (f, idxFie) {
                        if (idxCat === indexes[0] && idxCol === indexes[1] && idxFie === indexes[2]) {
                            idx = idxAux;
                            field = f;
                        }
                        idxAux += 1;
                    });
                });
            });

            value = "?" + field.get("name").split(":")[1] + idx + "Vble";
        }

        return {
            key: p.attr("name").split('-')[1],
            value: value
        };
    });

    options = options.concat(aux);

    _.each(options, function (opt) {
        if (opt.value !== "") {
            result[opt.key] = opt.value;
        }
    });

    return result;
};

QBA.chart.updateChartModel = function () {
    "use strict";
    var type = $("#step5 input[type=radio]:checked").val(),
        params = QBA.chart.getChartParams(type, true),
        paramList = new QBA.models.ChartParameterList();

    _.each(_.keys(params), function (key) {
        paramList.add(new QBA.models.ChartParameter({
            name: key,
            value: params[key]
        }));
    });

    QBA.theChart.set({
        type: type,
        paramList: paramList
    });
};

QBA.chart.loadChartModel = function () {
    "use strict";
    var type = QBA.theChart.get("type"),
        radio;

    if (type !== "") {
        radio = $("#step5 input[type=radio][value=" + type + "]");
        radio.attr("checked", true);
        radio.trigger("change");
        QBA.theChart.get("paramList").each(function (param) {
            var name = type + "-" + param.get("name") + "-param",
                input = $("#step5 #" + type + "Params div.parameter input[name=" + name + "]");

            if (input.attr("type") === "checkbox") {
                input.attr("checked", param.get("value"));
            } else {
                input.val(param.get("value"));
            }
            $("#step5 #" + type + "Params div.parameter select[name=" + name + "]").val(param.get("value"));
        });
    }
};