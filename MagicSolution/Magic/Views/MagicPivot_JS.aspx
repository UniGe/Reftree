<%@ Page Title="" MasterPageFile="~/Webarch.Master" Inherits="MagicFramework.Helpers.PageBase" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
    
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder1" runat="server">

    <div id="navbar-controller" ng-controller="MultiTabPivotController as c" class="ng-cloak">
        <magic-pivot pivot-codes="c.pivotCodes"></magic-pivot>
    </div>

    <script>

        function getQsPar(parname) {
            qd = {};
            location.search.substr(1).split("&").forEach(function (item) {
                (item.split("=")[0] in qd) ? qd[item.split("=")[0]].push(item.split("=")[1]) : qd[item.split("=")[0]] = [item.split("=")[1]]
            })
            return qd[parname];
        }

         $(document).ready(function () {
            getFuncTitleAndDescrAfterRedirect(); //title of the function
            $("#appcontainer").one("requireLoaded", function () {
                  requireConfigAndMore(["angular-devExpress-globalized"], function () {
                        require(["angular", "angular-magic-pivot"], function (angular) {
                                angular
                                    .module("magicPivot")
                                    .controller("MultiTabPivotController", [
                                        function () {
                                            this.pivotCodes = getQsPar("CODE");
                                        }
                                    ]);

                                angular.bootstrap($("#navbar-controller")[0], ["magicPivot"]);
                            });
                    });
                
            });
        });
 
    </script>
</asp:Content>
