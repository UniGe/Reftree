<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="wfReftreeProcess.aspx.cs" Inherits="MagicSolution.wfReftreeProcess" %>

<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head id="Head1" runat="server">
    <meta charset="utf-8" />
<title>Loading...</title>
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<meta content="" name="description" />
<meta content="" name="author" />
     <script>
         (function () {
             XMLHttpRequest.prototype.open = (function (open) {
                 return function (method, url, async) {
                     open.apply(this, arguments);
                     if (window.serviceWorkerUrlPathPrefix) {
                         this.setRequestHeader('X-MagicSolution-Reftree', 'true');
                     }
                 };
             })(XMLHttpRequest.prototype.open);
         })();
     </script>
    <link href="/Magic/Styles/local_fonts.css" rel="stylesheet" type="text/css" />
    <link href="/Magic/kendo/2016.1.226/Styles/kendo.common.min.css" rel="stylesheet" />
    <link href="/Magic/kendo/2016.1.226/styles/kendo.rtl.min.css" rel="stylesheet" />
    <link href="/Magic/kendo/2016.1.226/styles/kendo.bootstrap.min.css" rel="stylesheet" />    
    <link href="/Magic/kendo/2016.1.226/styles/kendo.bootstrap.mobile.min.css" rel="stylesheet" />
    <link href="/Magic/kendo/2016.1.226/styles/kendo.mobile.all.min.css" rel="stylesheet" />
    <link href="/Magic/kendo/2016.1.226/Styles/kendo.dataviz.min.css" rel="stylesheet" />
    <link href="/Magic/kendo/2016.1.226/Styles/kendo.dataviz.bootstrap.min.css" rel="stylesheet" />
    <link href="/Magic/Styles/3rd-party/font-awesome.min.css" rel="stylesheet" />
    <link href="/Magic/Styles/3rd-party/select.css" rel="stylesheet"/>
    <link href="/Magic/Styles/kendo.ilos.css" rel="stylesheet"/>
    <!-- BEGINWEBARCH -->
    <link href="/Magic/HtmlTemplates/webarch/assets/plugins/fullcalendar/fullcalendar.css" rel="stylesheet" type="text/css" media="screen" />
    <link href="/Magic/HtmlTemplates/webarch/assets/plugins/gritter/css/jquery.gritter.css" rel="stylesheet" type="text/css" />
    <link href="/Magic/HtmlTemplates/webarch/assets/plugins/jquery-slider/css/jquery.sidr.light.css" rel="stylesheet" type="text/css" media="screen" />
    <link href="/Magic/HtmlTemplates/webarch/assets/plugins/bootstrap-select2/select2.css" rel="stylesheet" type="text/css" media="screen" />
    <link href="/Magic/HtmlTemplates/webarch/assets/plugins/boostrapv3/css/bootstrap.min.css" rel="stylesheet" type="text/css" />
    <link href="/Magic/HtmlTemplates/webarch/assets/plugins/boostrapv3/css/bootstrap-theme.min.css" rel="stylesheet" type="text/css" />
    <link href="/Magic/HtmlTemplates/webarch/assets/plugins/simple-line-icons/simple-line-icons.min.css" rel="stylesheet" type="text/css"/>
    <link href="/Magic/HtmlTemplates/webarch/assets/css/animate.min.css" rel="stylesheet" type="text/css" />
    <link href="/Magic/HtmlTemplates/webarch/assets/css/style.css" rel="stylesheet" type="text/css" />
    <link href="/Magic/HtmlTemplates/webarch/assets/css/responsive.css" rel="stylesheet" type="text/css" />
    <link href="/localstyles/webarch/style/css/custom-icon-set.css" rel="stylesheet" type="text/css" />
    <link href="/Magic/HtmlTemplates/webarch/assets/css/Webarch-ilos.css" rel="stylesheet" />
    <link href="/Magic/HtmlTemplates/webarch/Assets/css/custom.css" rel="stylesheet" type="text/css" />
    <script src="/Magic/DevExtreme/Lib/js/jquery-2.2.3.min.js" type="text/javascript"></script>
    <script src="/Magic/HtmlTemplates/webarch/assets/plugins/jquery-ui/jquery-ui-1.10.1.custom.min.js" type="text/javascript"></script>
    <script src="/Magic/HtmlTemplates/webarch/assets/plugins/boostrapv3/js/bootstrap.min.js" type="text/javascript"></script>
    <script src="/Magic/HtmlTemplates/webarch/assets/plugins/breakpoints.js" type="text/javascript"></script>
    <script src="/Magic/HtmlTemplates/webarch/assets/plugins/jquery-unveil/jquery.unveil.min.js" type="text/javascript"></script>
    <script src="/Magic/HtmlTemplates/webarch/assets/plugins/jquery-block-ui/jqueryblockui.js" type="text/javascript"></script>
    <script src="/Magic/HtmlTemplates/webarch/assets/plugins/jquery-slimscroll/jquery.slimscroll.min.js" type="text/javascript"></script>
    <script src="/Magic/HtmlTemplates/webarch/assets/plugins/jquery-slider/jquery.sidr.min.js" type="text/javascript"></script>
    <script src="/Magic/HtmlTemplates/webarch/assets/plugins/jquery-numberAnimate/jquery.animateNumbers.js" type="text/javascript"></script>
    <script src="/Magic/HtmlTemplates/webarch/assets/plugins/bootstrap-datepicker/js/bootstrap-datepicker.js" type="text/javascript"></script>
    <script src="/Magic/HtmlTemplates/webarch/assets/plugins/bootstrap-select2/select2.min.js" type="text/javascript"></script>
    <script src="/Magic/HtmlTemplates/webarch/assets/plugins/jquery-slider/jquery.sidr.min.js" type="text/javascript"></script>
    <script src="/Magic/HtmlTemplates/webarch/assets/plugins/jquery-sparkline/jquery-sparkline.js"></script>
    <script src="/Magic/HtmlTemplates/webarch/assets/plugins/skycons/skycons.js"></script>
    <script src="/Magic/HtmlTemplates/webarch/assets/js/chat.js" type="text/javascript"></script>
    <!--BEGIN MAGIC JAVASCRIPTS-->
    <script src="/Magic/kendo/2016.1.226/js/jszip.min.js" ></script>
    <script src="/Magic/kendo/2016.1.226/js/kendo.all.min.js"></script>
    <script src="/Magic/kendo/2016.1.226/js/kendo.timezones.min.js" ></script>
    <script src="/Magic/Scripts/console.js"></script>
    <script src="/Magic/Scripts/MenuDataManager.js"></script>
    <script src="/Magic/Scripts/WebArch.js"></script>
    <script src="/Magic/Scripts/Labels.js"></script>
    <script src="/Custom/AppLabels.js"></script>
    <script src="/Magic/Scripts/Validations.js"></script>
    <script src="/Magic/Scripts/MagicUtils.js"></script>
    <script src="/Magic/Scripts/BOUsersManager.js"></script>
    <script src="/Magic/Scripts/MagicScheduler.js"></script>
    <script src="/Magic/kendo/2016.1.226/js/cultures/kendo.culture.it-IT.min.js"></script>
    <script src="/Magic/kendo/2016.1.226/js/cultures/kendo.culture.de-DE.min.js"></script>
    <script src="/Magic/Scripts/jquery.ui.touch-punch.min.js"></script>
    <script src="/Magic/Scripts/jquery.fileDownload.js"></script>
    <script src="/Magic/Scripts/jquery.signalR-2.2.0.min.js"></script>
    <script src="/Magic/Scripts/ChartUtils.js"></script>
    <script src="/Magic/Scripts/chat.js"></script>
    <script src="/Magic/Scripts/BOSelector.js"></script>
    <script src="/Magic/Scripts/MagicVisibilityTreeBuilder.js"></script>
    <script src="/Custom/AdminAreaCustomizations.js"></script>
    <script src="/Custom/dispatchers.js"></script>
    <script src="/Custom/pushnotifications.js"></script>
    <script src="/Magic/Scripts/mail.js"></script>
    <script src="/Magic/Scripts/help.js"></script>
 
</head>
<body>
<div id="container">
    <div class="row">
        <div class="col-md-12">        
            <div id="appcontainer">
                <form id="form1" runat="server">
                </form>
            </div>
           <div id="wndmodalContainer" class="modal fade">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal">×</button>
                            <h4 class="modal-title">...</h4>
                        </div>
                        <div id="contentofmodal" class="modal-body">
                        </div>
                        <div class="modal-footer">
                            <a id="executesave" href="javascript:void(0)" type="button" class="btn btn-primary" aria-label="save">
                                Salva
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
 
    <%-- <script>
         var serviceWorkerUrlPathPrefix = '<%= ConfigurationManager.AppSettings["ServiceWorkerUrlPathPrefix"] %>';
         window.serviceWorkerUrlPathPrefix = serviceWorkerUrlPathPrefix;
         if (typeof gotRequirejs === 'undefined') {
             window.name = "NG_DEFER_BOOTSTRAP!";
             let requirePath = (serviceWorkerUrlPathPrefix ?? '') + window.includesVersion + "/Magic/v/" + window.applicationVersion + "/Scripts/require.js"
             $.getScript(requirePath)
                 .done(function () {
                     gotRequirejs = true;
                     require([(serviceWorkerUrlPathPrefix ?? '') + window.includesVersion + '/Magic/HtmlTemplates/webarch/assets/js/core.js']);
                     requireConfig(function () {
                         require(["main", (serviceWorkerUrlPathPrefix ?? '') + window.includesVersion + '/Custom/' + window.ApplicationCustomFolder + '/Scripts/main.js']);
                     });
                     launchEarlyRequires();
                 });
         }
     </script>--%>



     <script>

         function closeme() {
             window.close();
         }

         var template = 'webarch';

         var serviceWorkerUrlPathPrefix = '<%= ConfigurationManager.AppSettings["ServiceWorkerUrlPathPrefix"] %>';
         window.serviceWorkerUrlPathPrefix = serviceWorkerUrlPathPrefix;
         if (typeof gotRequirejs === 'undefined') {
             window.name = "NG_DEFER_BOOTSTRAP!";
             let requirePath = (serviceWorkerUrlPathPrefix ?? '') + window.includesVersion + "/Magic/v/" + window.applicationVersion + "/Scripts/require.js"
             $.getScript(requirePath)
                 .done(function () {
                     gotRequirejs = true;
                     require([(serviceWorkerUrlPathPrefix ?? '') + window.includesVersion + '/Magic/HtmlTemplates/webarch/assets/js/core.js']);
                     requireConfig(function () {
                         require(["main", (serviceWorkerUrlPathPrefix ?? '') + window.includesVersion + '/Custom/' + window.ApplicationCustomFolder + '/Scripts/main.js']);
                     });
                     launchEarlyRequires();
                 });
         }

         $(document).ready(function () {
             let requirePath = (window.serviceWorkerUrlPathPrefix ?? '') + window.includesVersion + "/Magic/v/" + window.applicationVersion + "/Scripts/require.js";
             let searchParams = new URLSearchParams(window.location.search);
             let config = { guidid: searchParams.get('guidid') }

             $.getScript(requirePath)
                 .done(function () {
                     gotRequirejs = true;

                     requireConfig(function () {

                         //require([window.includesVersion + "/Custom/3/Scripts/config.js"], function () {
                            

                         //});
                         require(['angular', window.includesVersion + '/Views/3/Js/Controllers/ReftreeWfController.js'], function (angular, app) {

                             if (config && app)
                                 app.value("config", config);

                             var include = '<div ng-controller="ReftreeWfController as rw" ng-include="\'' + window.includesVersion + '/Views/3/Templates/ReftreeWf.html\'"></div>';
                             var $el = $('#appcontainer');
                             $el.html(include);
                             angular.bootstrap($el.find('div')[0], ['ReftreeWf']);
                              
                         });
                         
                     });
                 });
         });
     </script>

         
</body>
</html>
