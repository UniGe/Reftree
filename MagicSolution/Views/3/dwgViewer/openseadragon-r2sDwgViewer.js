


(function ($) {


   
    $.Viewer.prototype.r2sDwgViewer = function (options) {
        if (!this.r2sDwgViewerInstance) {
                         options = options || {}; 
                         options.viewer = this; 
                         this.r2sDwgViewerInstance = new $.r2sDwgViewer(options);
                     } else { 
            this.r2sDwgViewerInstance.refresh(options);
                     } 

    };


 
    $.r2sDwgViewer = function (options) {
        options = options || {};
        if (!options.viewer) {
            throw new Error("A viewer must be specified.");
        }

    
      
        this.viewer = options.viewer;
   
        this.getViewer = function () {return this.viewer };
       
        this.dictPath = [];
        this.Service;
        this.currentViewMode = "stardardMode";
        this.datapath = "";
        this.vData;
        this.isTemat;
        this.geoData;
        this.currentDwgData;
     
        this.moverlay;
      

        this.viewer.addHandler('open', function (event) {
         
            var appath = event.eventSource.r2sDwgViewerInstance.currentDwgData.OutputPath + '/gd.json'

            var gdatapath = encodeURI(appath);


                jQuery.ajax({
                    type: 'GET',
                    url: gdatapath,
                    dataType: 'json',
                    error: function (xhr, error) {
                        console.debug(xhr); console.debug(error);
                    },
                    success: function (rData) {
                        event.eventSource.r2sDwgViewerInstance.geoData = rData;
                        event.eventSource.raiseEvent('geoDataLoaded');
                    }

                });
            
        });
       
    };

    $.r2sDwgViewer.prototype.LoadTemat = function (data) {

        for (var t in data) {
            temat = data[t];

            var id = temat.id;
            var color = temat.color;
            
            for (var h in temat.handles)
            {
                var hdl = temat.handles[h];

                var gg = "#" + hdl;

                jQuery(gg).attr("fill", color).css({ opacity: 0.5 });

            }
        }

    }


    $.r2sDwgViewer.prototype.LoadVData = function () {      
        window.$('svg').remove();
        //this.moverlay = mviewer.svgOverlay(true);

        var dwgRatio = 1;
        this.moverlay = this.viewer.svgOverlay(true);

        dwgRatio = this.geoData.RetGeo.ImgScale;

       
            var ImgMarginX = 0;
            var ImgMarginY = 0;

         
            for (var g in this.geoData.RetGeo.Ge) {

                if (this.geoData.RetGeo.Ge[g]['l'] == "UI-Rilevazione Funzionale") {
                    var gd = this.geoData.RetGeo.Ge[g]

                    var dd = this.geoData.RetGeo.Ge[g]['h'];

                    var polyPs = this.getPolyPoints(gd.c, ImgMarginX, ImgMarginY, dwgRatio);
                    // var ol = this.mViewer.svgOverlay(true);
                    var path = this.addPath(this.moverlay, polyPs,dd);

                  

                    var pview = this.viewer;

                   path.dblclick(function () {
                        pview.raiseEvent('areaClick', jQuery(this).attr("handle"));
                    });

                }
            }

       
        
        }


    $.r2sDwgViewer.prototype.UnloadVData = function () {
        var gnode = this.moverlay.node();

        for (i = gnode.childNodes.length - 1; i >= 0 ; i--) {
            gnode.childNodes[i].remove();
        }

        // $(gnode).empty();
    }


 

    $.r2sDwgViewer.prototype.LoadDraw = function (data) {

            this.currentDwgData = data;
            var sourcejson = encodeURI(data.OutputPath + '/source.json');
           this.viewer.open(sourcejson);

           this.viewer.raiseEvent('drawLoaded');

        //$(window).resize(function () {
        //    if (mViewer != null) {
               
        //        if (moverlay != null) {
        //            moverlay.resize();
        //        }
        //    }

        //});
    }

    

    $.r2sDwgViewer.prototype.addPath = function (moverlay, pointString,handle) {



        var svgNS = 'http://www.w3.org/2000/svg';
        var path = document.createElementNS(svgNS,'path');
      
        moverlay._node.appendChild(path);

        var retpa = jQuery(path).attr("id",handle).attr("handle",handle).attr("d", pointString).attr('fill', "#FFFFFF").css({ opacity: 0 });


        return retpa;
          
    }


    $.r2sDwgViewer.prototype.getPolyPoints = function (coordinates, xMargin, YMargin, dwgscale) {
        var ret = "";
        var flag = 0;
        for (var i in coordinates) {
            var p = coordinates[i];
            var lng0 = this.viewer.viewport.imageToViewportCoordinates(new OpenSeadragon.Point((p.x * dwgscale) + xMargin, ((p.y * dwgscale) + YMargin)));

            if (flag == 0) {
                ret += "M ";
                flag = 1;
            }
            else {
                ret += " L ";
            }

            ret += lng0.x + ' ' + (lng0.y);
        };

        return ret;
    }
  

   
    /* jshint ignore:start */
    $.r2sDwgViewer.version = {
        versionStr: '1.0.0',
        major: 1,
        minor: 0,
        revision: 0
    };
    /* jshint ignore:end */



}(OpenSeadragon));

