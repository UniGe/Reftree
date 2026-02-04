<%@ Page Title="" Language="C#" MasterPageFile="~/Webarch.Master" AutoEventWireup="true" Inherits="MagicFramework.Helpers.PageBase" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
    <script src="Js/CadViewer.js"></script>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder1" runat="server">
    <div style="height: 95vh; width: 95vw" id="controller" ng-controller="dxfController as d">
        <dxf-viewer
            ng-if="d.isReady"
            file-name="d.name"
            fill-polylines="d.polylines"
            mode="webgl"
            path-file-cad="d.RootForDxf"
        >
        </dxf-viewer>
    </div>
    <script>
        earlyRequire(function () {
            require([window.includesVersion + "/Custom/3/Scripts/config.js"], function () {
                requireConfigAndMore(
                    [
                        "angular"
                        , "angular-dxf-viewer"
                    ]
                    , function (angular) {
                        angular
                            .module("dxf", ["dxfViewer"])
                            .controller(
                                "dxfController",
                                [
                                    "$timeout"
                                    , function ($timeout) {
                                        var self = this;
                                        var file = {};
                                        self.isReady = false;
                                        window.location.search.split('&').forEach(function (get) {
                                            var index = get.indexOf('q')
                                            if (index === 0 || index === 1) {
                                                file = JSON.parse(decodeURIComponent(get.split('=')[1])).files[0];
                                            }
                                        });
                                        self.name = file.name;
                                        self.polylines = file.polylines;
                                        $.get('/api/DWG/GetConfig')
                                            .then(function (config) {
                                                $.extend(self, config);
                                                self.isReady = true;
                                                $timeout();
                                            });
                                    }
                                ]
                            );

                        angular.bootstrap($('#controller')[0], ["dxf"]);
                    }
                );
            });
        });
    </script>
</asp:Content>
