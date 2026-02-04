(function ($) {


    $.Viewer.prototype.r2sDwgService = function (options) {
        if (!this.r2sDwgServiceInstance) {
            options = options || {};
            options.viewer = this;
            this.r2sDwgServiceInstance = new $.r2sDwgService(options);
        } else {
            this.r2sDwgServiceInstance.refresh(options);
        }

    };


    $.r2sDwgService = function (options) {
        options = options || {};
        if (!options.viewer) {
            throw new Error("A viewer must be specified.");
        }
        this.viewer = options.viewer;
        this.urlService = options.urlService;
        this.Service;
       
       
    };


    $.r2sDwgService.prototype.CreateService = function () {
        this.Service = new tempuri.org.ITeighaService(this.urlService);
        this.Service.set_enableJsonp(true)
        return this.Service;
    }

    $.r2sDwgService.prototype.LoadByDwgFileName = (function (filename, layerList, ThumbMode) {

        var _r2sviewer = this.viewer.r2sDwgViewerInstance;
        data = '<data DwgFile="' + filename + '" UseCache="True" ThumbMode="' + ThumbMode + '"' + layerList + '></data>';

        this.Service.GenericDwgUtil(data, "RASTERIMG", function (result) {

              
                var robj = JSON.parse(result);

                _r2sviewer.LoadDraw(robj.DwgData);



            }, function (errorResult) {

            });


        


    });



}(OpenSeadragon));