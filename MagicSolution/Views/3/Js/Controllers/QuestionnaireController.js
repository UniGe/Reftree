define(['angular', 'bootstrap-decorator', 'angular-schema-form-datetimepicker'], function (angular) {
     angular
    .module('Questionnaire', ['schemaForm', 'schemaForm-datepicker', 'schemaForm-timepicker', 'schemaForm-datetimepicker'])
    .controller('QuestionnaireController', ['$http', '$scope', '$filter', '$timeout', function ($http, $scope, $filter, $timeout) {
        var self = this;
        self.errors = [];
        self.complete = false;
        self.hasNext = false;
        self.hasPrev = false;
        self.currentPage = 0;
        self.$questions;
        self.questions = {};
        self.questionsLength = 0;
        self.questionsOrder = {};
        self.schema = {
            "type": "object",
            "required": [],
            "properties": {
            }
        };
        self.form = [];
        self.$form = {};
        self.model = {};

        self.labels = {
            savelb: getObjectText('save'),
            previouslb: getObjectText('previous'),
            nextlb: getObjectText('next')
        };

        var dateConvert = {};
        self.parseQuestions = function ($xml, readonly) {
            var regEx = /\([^\)]+\)/;
            $xml.find('DOMANDA').each(function (k, v) {
                var $v = $(v);
                var id = $v.attr('ID');
                var titleMap = [];
                var group = $v.find('GRUPPO').text(), position = $v.find('ORDINE').text();
                if (!(group in self.questions)) {
                    self.questions[group] = [];
                    self.questions[group].push({type: 'help', position : 0, helpvalue: "<h2>"+group+"</h2>"});
                    self.questionsLength++;
                    self.questionsOrder[group] = position;
                }
                if (self.questionsOrder[group] > position)
                    self.questionsOrder[group] = position;
                formItem = { key: id, position: position };
                self.schema.properties[id] = {
                    title: $v.find('LABEL').text(),
                };
                var type = $v.find('TIPODATO').text();
                if (type == "bit") {
                    self.schema.properties[id].type = "boolean";
                    formItem.type = "checkbox";
                }
                else if (type == "date") {
                    if (readonly) {
                        self.schema.properties[id].type = "string";
                    }
                    else {
                        self.schema.properties[id].type = "object";
                        formItem.type = "datepicker";
                        formItem.dateOptions = {
                            dateType: "date"
                        };
                    }
                    dateConvert[id] = "fullDate";
                }
                else if (type == "time") {
                    if (readonly) {
                        self.schema.properties[id].type = "string";
                    }
                    else {
                        self.schema.properties[id].type = "object";
                        formItem.type = "timepicker";
                        formItem.timeOptions = {
                            timeType: "date"
                        };
                    }
                    dateConvert[id] = "mediumTime";
                }
                else if (type.match(/date/)) {
                    if (readonly) {
                        self.schema.properties[id].type = "string";
                    }
                    else {
                        self.schema.properties[id].type = "object";
                        formItem.type = "datetimepicker";
                        formItem.options = {
                            dateType: "iso",
                            timeType: "iso",
                        };
                    }
                    dateConvert[id] = "medium";
                }
                else
                    self.schema.properties[id].type = regEx.test(type) ? 'string' : 'number';
                if ($v.find('CAMPONOTE').text() == 1) {
                    self.schema.properties[id + "_note"] = {
                        title: "Note",
                        type: "string"
                    };
                    self.questions[group].push({ key: id + "_note", type: "textarea", position: position });
                    if ($v.find('NOTE').length > 0)
                        self.model[id + "_note"] = $v.find('NOTE').text();
                }
                if ($v.find('OBBLIGATORIA').text() == "1")
                    self.schema.required.push(id);
                if ($v.find('RISPOSTE RISPOSTA').length > 0) {
                    if ($v.find('MULTI').text() == "1") {
                        self.schema.properties[id]["items"] = {};
                        self.schema.properties[id]["items"]["enum"] = [];
                        self.schema.properties[id]["items"]["type"] = self.schema.properties[id]["type"];
                        self.schema.properties[id]["type"] = 'array';
                        formItem["type"] = "checkboxes";
                    }
                    else {
                        self.schema.properties[id]["enum"] = [];
                        self.schema.properties[id]["type"] = 'string';
                        formItem["type"] = "select";
                    }
                    $v.find('RISPOSTE RISPOSTA').each(function (kk, vv) {
                        var $vv = $(vv);
                        if (self.schema.properties[id]["items"])
                            self.schema.properties[id]["items"]["enum"].push($vv.attr("ID"));
                        else
                            self.schema.properties[id]["enum"].push($vv.attr("ID"));
                        titleMap.push({ value: $vv.attr("ID"), name: $vv.text() });
                    });
                }
                if (titleMap.length > 0)
                formItem["titleMap"] = titleMap;
                if ($v.find('RISPOSTE_DATE RISPOSTA').length > 0) {
                    var risposta = "";
                    if (self.schema.properties[id]["type"] === 'array') {
                        risposta = [];
                        $v.find('RISPOSTE_DATE RISPOSTA').each(function (k, v) {
                            risposta.push(v.textContent);
                        });
                    }
                    else {
                        risposta = $v.find('RISPOSTE_DATE RISPOSTA')[0].textContent;
                    }
                    if (id in dateConvert) {
                        risposta = $filter("date")(risposta, dateConvert[id]);
                    }
                    self.model[id] = risposta;
                }
                self.questions[group].push(formItem);
            });
            angular.forEach(self.questions, function (v, k) {
                self.questions[k] = $filter('orderBy')(v, ["+position", "+key"]);
            });
            self.questionsOrder = $filter('orderBy')(self.questionsOrder, "+");
            var realOrder = [];
            angular.forEach(self.questionsOrder, function (v, k) {
                realOrder.push(k);
                self.errors.push(true);
            });
            self.questionsOrder = realOrder;
        };

        self.showQuestion = function (groupNo) {
            self.validate(function () {
                var group = -1;
                switch (groupNo) {
                    case "+":
                        group = self.currentPage + 1;
                        break;
                    case "-":
                        group = self.currentPage - 1;
                        break;
                    default:
                        if (!isNaN(groupNo))
                            group = groupNo;
                        break;
                }
                if (group < self.questionsOrder.length && group > -1) {
                    self.form = self.questions[self.questionsOrder[group]];
                    $scope.$broadcast('schemaFormRedraw');
                    self.currentPage = group
                    self.hasNext = group < self.questionsOrder.length - 1;
                    self.hasPrev = group > 0;
                }
            });
        };

        self.showReportl = function () { };

        self.getXML = function () {
            self.$questions.find('FORM').attr('taskId', self.taskId);
            self.$questions.find('DOMANDA').each(function (k, v) {
                var $v = $(v), id = $v.attr('ID');
                $v.html("");
                if (id in self.model) {
                    if (typeof self.model[id] == 'object') {
                        if (id in dateConvert) {
                            $v.html('<RISPOSTE><RISPOSTA>' + toTimeZoneLessString(self.model[id]) + '</RISPOSTA></RISPOSTE>');
                        }
                        else {
                            var xml = "<RISPOSTE>";
                            $.each(self.model[id], function (k, v) {
                                xml += '<RISPOSTA>' + v + '</RISPOSTA>';
                            });
                            xml += '</RISPOSTE>';
                            $v.html(xml);
                        }
                    }
                    else
                        $v.html('<RISPOSTE><RISPOSTA>'+self.model[id]+'</RISPOSTA></RISPOSTE>');
                }
                if((id + "_note") in self.model)
                    $v.html($v.html() + "<NOTE>" + self.model[id + "_note"] + "</NOTE>");
            });
            //regex in order to uppercase all HTMLtags, ie doesn't deliver them in upper case
            return $('<div>').append(self.$questions.find('FORM').eq(0).clone()).html().replace(/(<\/?)([a-z_]+)([^>]*>)/g, function ($0, $1, $2, $3) { return $1 + $2.toUpperCase() + $3 });
        };

        self.submit = function () {
            self.validate(function () {
                if (!self.complete)
                    return;
                var xml = self.getXML();
                var attribute = ' taskId="' + self.taskId+'" ';
                if (self.outerInput)
                    attribute = ' ' + self.submitTaskField + '="' + self.taskId + '" ';
                $http.post("/api/WORKFLOWS/SaveActivityReport", "=<SQLP"+attribute+">"+xml+"</SQLP>", { headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' } })
                .then(function (res) {
                    kendoConsole.log(res.data, false);
                    if ($("#wndmodalContainer").is(':visible'))
                        $("#wndmodalContainer").modal('toggle');
                    if (self.$grid)
                    {   
                        self.$grid.data("kendoGrid").dataSource.read();
                    }
                }, function (er) { kendoConsole.log(er.data, true) });
            });
        };

        self.validate = function (callback) {
            $scope.$broadcast('schemaFormValidate');
            $timeout(function () {
                if (self.$form.$valid) {
                    var complete = true;
                    self.errors[self.currentPage] = false;
                    angular.forEach(self.errors, function (v, k) {
                        if (v == true)
                            complete = false;
                    });
                    self.complete = complete;
                }
                else {
                    self.errors[self.currentPage] = true;
                    self.complete = false;
                }
                if (callback !== undefined) {
                    callback();
                }
            }, 10);
        };
        
        self.addEventListeners = function () {
            if (self.readonly)
                return;
            $('#questionnaire').on('change', 'input, textarea, select', function () {
                self.validate(); self.cacheModel();
            });
            $('#questionnaire').on('focusout', '.form-control-date, .form-control-time', function () {
                self.validate(); self.cacheModel();
            });
        };

        self.cacheModel = function () {
            setTimeout(function () {
                sessionStorage.setItem(self.cacheKey, JSON.stringify(self.model));
            }, 20);
        };

        self.getModelFromCache = function (readonly) {
            var model = sessionStorage.getItem(self.cacheKey);
            self.model = model ? JSON.parse(model) : self.model;
            if(!readonly)
                $.each(dateConvert, function (key, v) {
                    if (self.model[key])
                        self.model[key] = new Date(self.model[key]);
                });
            //else {
            //    $.each(dateConvert, function (key, v) {
            //        self.model[key] = $filter("date")(self.model[key], dateConvert[key]);
            //    });
            //}
        };

        self.readOnly = function () {
            $.each(self.schema.properties, function (k, v) {
                self.schema.properties[k]["readonly"] = true;
            });
        };

        //init
        (function ($xml, key, taskId, outerInput,$grid) {
            self.taskId = taskId;
            if (outerInput) {
                self.submitTaskField = Object.keys(outerInput)[0];
                self.outerInput = outerInput;
            }
            self.readonly = false;
            if (!self.taskId)
                self.readonly = true;
            self.$questions = $xml;
            self.cacheKey = key;
            self.parseQuestions($xml, self.readonly);
            if (self.readonly) {
                self.readOnly();
            }
            else
                self.getModelFromCache(self.readonly);
            self.showQuestion(0);
            self.$grid = $grid;
        })($xml, key, taskId,outerInput,$grid);

        $scope.$on('sf-render-finished', function (event, data) {
            $timeout(self.validate, 10);
        });

    }])

    return function (x, tId, activityid,outerInp,JQgrid) {
        $xml = x;
        outerInput = null;
        if (outerInp) //the input object is not the standard taskid , activityid object
        {
            tId = outerInp[Object.keys(outerInp)[0]];
            activityid = outerInp[Object.keys(outerInp)[1]];
            outerInput = outerInp;
        }
        key = tId + "_" + activityid;
        taskId = tId;
        $grid = JQgrid;
    };
});