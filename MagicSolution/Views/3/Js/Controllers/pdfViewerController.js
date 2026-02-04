define([
	"angular",
	"pdfjs-dist/build/pdf",
//	"pdfjs-dist/build/pdf.worker",
    "angular-kendo",
    "angular-filter",
	"angular-ui-bootstrap",

], function (angular, pdfjsLib) {//,pdfworker) {
    return angular
        .module("pdfViewer", [
            "kendo.directives",
            "angular.filter",
            "ui.bootstrap",
        ])
        .controller("pdfViewerController", [
            "config",
            "$uibModal",
            "$http",
            function (config, $uibModal, $http) {
                pdfjsLib.GlobalWorkerOptions.workerSrc = (window.serviceWorkerUrlPathPrefix ?? '') + "/Magic/v/" + window.applicationVersion + "/Scripts/3rd-party/pdfjs/pdf.worker.min.js"; //pdfworker;
                var self = this;

                self.baseUrl = "/api/MAGIC_SAVEFILE/GetFile?path=";
                self.fileUrl = config.pathFileComplete ? self.baseUrl + config.pathFileComplete : ""; //encodeURIComponent(config.pathFileComplete);
                self.pdf = null;
                self.viewer = null;
                self.zoomText = 100;
                self.reftreeServiceCode = config.reftreeServiceCode ? config.reftreeServiceCode : "";

                
                self.initialState = {
                    pdfDoc: null,
                    currentPage: 1,
                    pageCount: 0,
                    zoom: 1,
                };

                self.getBlobFromUrl = function (Url) {
                    var promise = $.Deferred();
                    var req = new XMLHttpRequest;
                    req.open('GET', Url);
                    req.responseType = 'blob';

                    req.onload = function fileLoaded(e) {
                        self.fileUrl = this.response;
                        promise.resolve(this.response);
                    };

                    req.send();
                    return promise.promise();
                }


                self.onInit = function init() {
                    if (jQuery.isEmptyObject(self.fileUrl) || self.fileUrl == "") {
                        config.ready();
                        kendoConsole.log("File non impostato", true);
                        return
                    }

                    if (!pdfjsLib.isPdfFile(self.fileUrl)) {
                        if (config.downloadNotPdf) {
                            kendoConsole.log("File non in formato PDF, download avviato.", false);
                            $.fileDownload(self.fileUrl);
                            config.close();
                            return;
                        }
                        
                        config.ready();
                        kendoConsole.log("File non in formato PDF", true);
                        config.close();
                        return
                    }
                    self.onLoadPdf();
                    config.ready();

                    //test del file passato come blobl
                    //self.getBlobFromUrl(self.fileUrl).then(function (blob) {                         
                    //    self.onLoadPdf();
                    //    config.ready();
                    //});
                    
                    $uibModal.open({
                        templateUrl: window.includesVersion + '/Views/3/Templates/pdfViewer.html', //sTemplate, // loads the template
                        animation: true,
                        backdrop: false, // setting backdrop allows us to close the modal window on clicking outside the modal window
                        windowClass: "laybloPdf-window", // windowClass - additional CSS class(es) to be added to a modal window template
                        //size: "lg",
                        //restrict: "AC",
                        keyboard: true,
                        //scope: $scope,
                        controller: ("pdfViewerController", ["$scope", "$uibModalInstance", function ($scope, $uibModalInstance) {
                            $scope.zoomText = self.initialState.zoom * 100 + '%'

                            $scope.onZoomIn = function onZoomIn(bIn) {
                                if (bIn) {
                                    if (self.initialState.zoom + 0.25 > 5) {
                                        self.initialState.zoom = 5;
                                    } else {

                                        $scope.zoomText = parseInt($scope.zoomText) + 25 + '%';
                                        self.initialState.zoom += 0.25;
                                    }

                                } else {
                                    if (self.initialState.zoom - 0.25 > 0) {
                                        self.initialState.zoom -= 0.25;
                                        $scope.zoomText = parseInt($scope.zoomText) - 25 + '%';
                                    }
                                }

                                self.onLoadPdf();
                            }

                            $scope.changeZoom = function () {
                                if (isNaN(parseInt($scope.zoomText))) {
                                    $scope.zoomText = '25%';
                                } else {
                                    if (parseInt($scope.zoomText) < 25) {
                                        $scope.zoomText = '25%'
                                    } else {
                                        if (parseInt($scope.zoomText) > 500) {
                                            $scope.zoomText = '500%'
                                        } else {
                                            $scope.zoomText = parseInt($scope.zoomText) + '%'
                                        }
                                    }
                                }

                                self.initialState.zoom = parseInt($scope.zoomText) / 100
                                self.onLoadPdf();
                            }

                            $scope.onCloseModal = function () {
                                $uibModalInstance.dismiss("cancel");
                            };

                            $scope.downloadPdf = function downloadPdf() {                           
                                var a = $("<a style='display: none;'/>");
                                var url = self.fileUrl instanceof Blob ? window.URL.createObjectURL(self.fileUrl) : self.fileUrl
                                a.attr("href", url);
                                //a.attr("download", "doc.pdf");
                                $("body").append(a);
                                a[0].click();
                                window.URL.revokeObjectURL(url);
                                a.remove();
                            }
                        }])
                    });
                }

                self.onLoadPdf = function onLoadPdf() {
                    doModal(true);




                    pdfjsLib.getDocument(self.fileUrl instanceof Blob ? window.URL.createObjectURL(self.fileUrl) : self.fileUrl).promise.then(function (pdf) {
                         
                        self.initialState.pdfDoc = pdf;
                        self.initialState.pdfDoc.numPages = pdf.numPages;

                        viewer = document.getElementById('pdf-viewer');
                        $(viewer).empty();

                        for (page = 1; page <= pdf.numPages; page++) {
                            canvas = document.createElement("canvas");
                            canvas.className = 'pdf-page-canvas';

                            $(canvas).bind('contextmenu', function (e) {
                                return false;
                            });

                            $('#contentofmodal').bind('contextmenu', function (e) {
                                return false;
                            });

                            viewer.appendChild(canvas);

                            self.renderPage(page, canvas);
                        }

                        doModal();


                    }).catch(function (ex) {
                        doModal();
                        kendoConsole.log(ex.message, true);
                    });
 
                    
                }
                 
                self.renderPage = function renderPage(pageNumber, canvas) {
                    self.initialState.pdfDoc.getPage(pageNumber).then(function (page) {
                        viewport = page.getViewport({ scale: self.initialState.zoom });
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;
                        page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport });
                    });
                }

                

            }
        ])
});