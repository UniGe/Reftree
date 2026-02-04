var activeHelp = {};

function help(helpObject, identifier) {
    if (!identifier) identifier = "onlyIslandInTheOcean";
    if (identifier in activeHelp) {
        activeHelp[identifier].destroy();
        delete activeHelp[identifier];
    }
    var HelP = new Help(helpObject, identifier);
    HelP.initHelp();
    activeHelp[identifier] = HelP;
}

function initCustomHelp(id, identifier) {
    getCustomHelpObject(id, function (helpObject) { if (null != helpObject) help(helpObject, identifier) });
}

function getCustomHelpObject(id, callback) {
    $.ajax({
        url: "/api/Help/GetHelpObject",
        type: "POST",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: JSON.stringify({
            type: "custom",
            id: id
        }),
        success: function (res) {
            callback(res);
        },
        error: function () {
            callback(null);
        }
    });
}

function Help(helpObject) {
    var self = this;
    self.help = helpObject;
    self.support = helpObject.support;
    self.notFoundElements = [];
    self.routine = null;
    self.processInterval = 3000;
    self.effectTime = 500;
    self.for = helpObject.usedFor;
    self.remindObject = {};
    self.tooltips = [];

    self.initHelp = function () {
        self.prepare(self.start);
    }

    self.prepare = function (callback) {
        if (self.checkForRemindXTimes()) {
            var data = { list: Object.keys(self.remindObject) };
                $.ajax({
                    url: '/api/Help/GotAlreadyHelpFor', type: 'POST', data: JSON.stringify(data), contentType: "application/json; charset=utf-8",
                    success: function (res) {
                        res = JSON.parse(res);
                        self.setRemindCounters(res);
                        callback();
                    },
                    error: function () {
                        callback();
                    }
                });
        }
        else callback();
    }

    self.setRemindCounters = function (alreadyReminded)
    {
        for (var i = 0; i < alreadyReminded.length; i++) {
            self.remindObject[alreadyReminded[i].advice_id].remindedXTimes = alreadyReminded[i].remindedXTimes;
        }
    }

    self.checkForRemindXTimes = function () {
        var found = false;
        for (var s in self.support) {
            for (var a in self.support[s]) {
                if (self.support[s][a].remindXTimes != null) {
                    self.remindObject[self.support[s][a].Id] = { max: self.support[s][a].remindXTimes };
                    found = true;
                }
            }
        }
        return found;
    }

    self.start = function () {
        for (var i = 0; i < self.support.length; i++) {
            self.showAdvice(i, 0);
        }
    }

    self.showAdvice = function (sequenceIndex, adviceIndex){
        var callNext = null;
        if (adviceIndex + 1 != self.support[sequenceIndex].length)
            callNext = function () { self.showAdvice(sequenceIndex, adviceIndex + 1); if (this.options) { this.options.hide = null; this._events.hide = []; } };
        var adviceObject = self.prepareTooltip(sequenceIndex, adviceIndex, callNext);
        var $el = $(adviceObject.selector);
        if ($el.length > 0) {
            if(adviceIndex > 0)
                setTimeout(function () { self.addTooltip(adviceObject) }, self.effectTime);
            else
                self.addTooltip(adviceObject);
        }
        if ($el.length === 0 || adviceObject.config.keepOnChecking) {
            self.notFoundElements.push(adviceObject);
            if (self.routine == null)
                self.startRoutine();
        }
    }

    self.getAdviceText = function (advice) {
        var searchFor = culture;
        var translation = null;
        for(var i = 0; i < 2; i++){
            $.each(advice.translations, function (k, v) {
                if (v.culture == searchFor) {
                    translation = v.text;
                    return false;
                }
            });
            if (translation != null) break;
            searchFor = searchFor.substring(0, 2);
        }
        return translation || (advice.translations.length > 0 ? advice.translations[0].text : '');
    }

    self.prepareTooltip = function (sequenceIndex, adviceIndex, callNext) {
        var advice = self.support[sequenceIndex][adviceIndex];
        var defaults = {
            position: 'top',
            autoHide: false,
            hide: callNext,
            showOn: 'mouseenter',
            show: function () { self.gotHelp(advice) },
            autoplay: false,
            keepOnChecking: false,
            duration: 0,
            animation: {
                open: {
                    effects: 'fade:in',
                    duration: self.effectTime
                },
                close: {
                    effects: 'fade:out',
                    duration: self.effectTime
                }
            },
            remindXTimes: null,
            width: "Infinity"
        };
        if (self.support[sequenceIndex].length > 1) {
            defaults.showOn = 'click';
        }
        defaults = overwriteDefaults(defaults, advice);
        var config = {
            content: self.getAdviceText(advice),
            callNext: callNext
        };
        if (defaults.hide == null)
            delete defaults.hide;
        config = mergeObjects(defaults, config);
        return { selector: advice.selector, config: config, Id: advice.Id }
    }

    self.addTooltip = function (adviceObject) {
        if (adviceObject.Id in self.remindObject) {
            if (self.remindObject[adviceObject.Id].remindedXTimes) {
                if (adviceObject.config.remindXTimes <= self.remindObject[adviceObject.Id].remindedXTimes) {
                    if (adviceObject.config.callNext != null) {
                        adviceObject.config.callNext();
                    }
                    return;
                }
            }
        }

        var config = adviceObject.config;
        var $el = $(adviceObject.selector);
        $el.data('helpToolTip', true);
        var tooltip = $el.kendoTooltip(config).data("kendoTooltip");
        if (config.autoplay) {
            tooltip.show();
            if (config.duration != 0) {
                setTimeout(function () {
                    tooltip.hide();
                }, config.duration);
            }
        }
        self.tooltips.push(tooltip);
    };

    self.destroy = function () {
        self.endRoutine();
        $.each(self.tooltips, function (k, v) {
            if (v.element.length > 0)
                $(v.element[0]).removeData("kendoTooltip");
            if (v.popup && v.popup.element.length > 0)
                $(v.popup.element[0]).remove();
        });
    }

    self.startRoutine = function () {
        self.routine = setInterval(self.process, self.processInterval);
    }

    self.endRoutine = function () {
        if (self.routine != null) {
            clearInterval(self.routine);
            self.routine = null;
        }
    }

    self.process = function () {
        for (var i = 0; i < self.notFoundElements.length; i++) {
            var $el = $(self.notFoundElements[i].selector);
            if ($el.length > 0) {
                if (!$el.data('helpToolTip')) {
                    $el.data('helpToolTip', true);
                    (function (config) {
                        setTimeout(function () {
                            self.addTooltip(config);
                        }, 1000);
                    })(self.notFoundElements[i]);
                    
                }
                if (self.notFoundElements[i].config.keepOnChecking !== true) {
                    self.notFoundElements.splice(i, 1);
                }
            }
        }
        if (self.notFoundElements.length == 0)
            self.endRoutine();
    }

    self.gotHelp = function (advice) {
        if (advice.Id in self.remindObject && !self.remindObject[advice.Id].count) {
            self.remindObject[advice.Id].count = true;
            var data = {array : [advice.Id]};
            $.ajax({
                url: '/api/Help/GotHelpFor', type: 'POST', data: JSON.stringify(data), contentType: "application/json; charset=utf-8",
                success: function (res) {
                    self.remindObject[advice.Id].count = 1;
                }
            });
        }
    }
}

function overwriteDefaults(defaults, values) {
    for (var k in defaults) {
        if (defaults.hasOwnProperty(k) && values.hasOwnProperty(k)) {
            if(values[k] != null)
                defaults[k] = values[k];
        }
    }
    return defaults;
}

function mergeObjects(obj1, obj2) {
    for (var k in obj2) {
        if (obj2.hasOwnProperty(k))
            obj1[k] = obj2[k];
    }
    return obj1;
}

function HelpDesigner(selector) {
    var $container = $(selector);

    var include = '<div ng-controller="HelpDesignerController as h" ng-include="\'' + window.includesVersion + '/Magic/Views/Templates/HelpDesigner.html\'" onload="h.init()"></div>';
    $container.html(include);

    initAngularController($container, "HelpDesignerController");
}