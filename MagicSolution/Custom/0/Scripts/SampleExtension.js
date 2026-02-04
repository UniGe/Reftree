(function () {
    var extension = {};
    extension.curreDateTime = new Date().toString();
    extension.refreshDateTime = function (e) {
        var self = this; //controller scope
        self.curreDateTime = new Date().toString();
    }
    extension.submitForm = function (modelkey) {
        var self = this; //controller scope
        console.log(self[modelkey]);
    }
    define([], function () {
        return extension;
    });

})()