define(["angular","dwgviewer"], function (angular) {
    angular
        .module("dwgViewer", [])
        .directive("dwgViewer",
            function () {
                return {
                    restrict: "E",
                    scope: {},
                    bindToController: {
                        options: "=",
                        onClick: "&",
                        id: "@",
                        files: "=",
                        reload: "=",
                        filekey: "="
                    },
                    template: '<div id={{dwg.options.id}} class="dwg-map" options="dwg.options"></div>',
                    controllerAs: "dwg",
                    controller: [
                        "$scope",
                        function ($scope) {
                            var self = this;
                            self.initialized = false;
                          $.getScript(self.options.serviceUrlInterface, function () {

                              self.dwgviewer = OpenSeadragon({
                                  id: self.options.id,
                                  prefixUrl: "Views/3/dwgViewer/r2sdwgviewerimages/",
                                  debugMode: false,
                                  animationTime: 0,
                                  gestureSettingsMouse: { clickToZoom: false }
                              })

                              //inizializzo il visualizzatore dwg
                              self.dwgviewer.r2sDwgViewer({

                              });
                              //inizializzo il componente che si occupa delle chiamate al servizio passando l'url del servizio
                              self.dwgviewer.r2sDwgService({
                                  urlService: self.options.serviceUrl
                              });
                              // creo l'istanza del servizio
                              self.dwgviewer.r2sDwgServiceInstance.CreateService();
                              //carico il disegno specificando il nome del file
                              if (self.getFile())
                                self.dwgviewer.r2sDwgServiceInstance.LoadByDwgFileName(self.getFile(), "", "False");
                              // evento che indica che sono stati caricati i dati vettoriali
                              self.dwgviewer.addHandler('geoDataLoaded', function (event) {
                                  //json di esempio per l'evidenziazione delle aree
                                  //var temat = {
                                  //    "tdata": [
                                  //{ "id": "1", "color": "#009900", "handles": ["ADCB"] }
                                  //    ]
                                  //}
                                  //carico i poligoni 
                                  self.dwgviewer.r2sDwgViewerInstance.LoadVData();
                                  //passo i tematismi per l'evidenziazione
                                  self.dwgviewer.r2sDwgViewerInstance.LoadTemat(self.getThemesOfFile(self.getFile()));
                              });
                              if (self.options.onClick)
                                self.dwgviewer.addHandler('areaClick', function (event) {
                                    self.options.onClick(event);
                              });
                          }).fail(function (jqxhr, settings, exception) {
                              kendoConsole.log("Remote serviceUrlInterface: " + self.options.serviceUrlInterface + " is not responding!!!")
                              console.log(exception);
                          });
                          self.getFile = function () {
                              if (!self.files)
                                  return;
                              if (!self.filekey)   //return first
                                  return Object.keys(self.files)[0];

                              return self.filekey; 
                          }
                          self.getThemesOfFile = function (filename)
                          {
                              if (self.files[self.getFile()])
                               return self.files[self.getFile()]["tdata"];
                          }
                          self.options.ready();
                          self.loadFilesAndThemes = function () {
                              var firstfile = self.getFile();
                              self.dwgviewer.r2sDwgServiceInstance.LoadByDwgFileName(firstfile, "", "False");
                          }
                          $scope.$watch("dwg.files", function () {
                              console.log("files", self.files);
                              self.reloadContent();
                          });
                          $scope.$watch("dwg.filekey", function () {
                              console.log("filekey", self.filekey);
                              self.reloadContent();
                          });
                          self.reloadContent = function () {
                              if (self.files && Object.keys(self.files).length && self.dwgviewer) {
                                  if (self.reload) {
                                      self.dwgviewer.r2sDwgServiceInstance.LoadByDwgFileName(self.getFile(), "", "False");
                                      self.initialized = true;
                                      return; //event geoDataLoaded will fire
                                  }
                                  //passo i tematismi per l'evidenziazione
                                  self.dwgviewer.r2sDwgViewerInstance.LoadVData();
                                  self.dwgviewer.r2sDwgViewerInstance.LoadTemat(self.getThemesOfFile(self.getFile()));
                              }
                              if (self.dwgviewer && !Object.keys(self.files).length && self.initialized)//emption...
                                  //self.dwgviewer.r2sDwgViewerInstance.LoadVData();
                                  self.dwgviewer.r2sDwgViewerInstance.ClearTemat();
                          }
                        }
                    ]
                }
            });
});