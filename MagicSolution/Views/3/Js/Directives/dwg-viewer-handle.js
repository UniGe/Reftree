define([
    "angular"
    , "angular-dxf-viewer"
], function (angular) {
    return angular
        .module("dxf", ["dxfViewer"])
        .controller(
        "dxfController",
        ["config", "$uibModal",
            function (config, $uibModal) {

                var self = this;


                var file = {};

                file = {
                    "files": [
                        {
                            "name": "635826573675032606_16125-01-01-I.zip",
                            "polylines": [
                                {
                                    "handles": [
                                        "2C340"
                                    ],
                                    "color": "#FF0000"
                                },
                                {
                                    "handles": [
                                        "2C333"
                                    ],
                                    "color": "#FFFF00"
                                }
                            ]
                        }
                    ]
                };

                self.name = file.files[0].name;
                self.polylines = file.files[0].polylines;


                self.openMaps = function () {
                    $uibModal.open({
                        templateUrl: window.includesVersion + self.objectList[0].mapFormTemplate, // loads the template
                        // template:'<easy-map  map-options="{zoom:20}" markers="t.mapMarkers"></easy-map>',
                        animation: true,
                        backdrop: true, // setting backdrop allows us to close the modal window on clicking outside the modal window
                        //windowClass: "modal-dialog-pdf", // windowClass - additional CSS class(es) to be added to a modal window template
                        //size: "lg",
                        //restrict: "AC",
                        keyboard: true,
                        scope: $scope,
                        controller: ("openMaps", ["$scope", "$uibModalInstance", function ($scope, $uibModalInstance) {

                            //$scope.jsnoSource = self.allObject;



                            $scope.cancel = function () {
                                $uibModalInstance.dismiss("cancel");
                            };
                        }]),
                    });

                }
                //angular.bootstrap($('#controller')[0], ["dxf"]);
            }
        ]
        );
    });

 