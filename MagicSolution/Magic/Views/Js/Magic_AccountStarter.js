function loadscript()
{
    requireConfig(function () {
        require(['angular', window.includesVersion + '/Magic/Views/Js/Controllers/PersonalDataController.js'], function (angular) {
            var include = '<div ng-controller="PersonalDataController as c" ng-include="\'' + window.includesVersion + '/Magic/Views/Templates/PersonalData.html\'"></div>';
            var $el = $('#appcontainer');
            $el.html(include);
            angular.bootstrap($el.find('div')[0], ['PersonalData']);
        });
    });
}