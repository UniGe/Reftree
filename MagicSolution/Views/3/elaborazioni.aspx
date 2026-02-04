<%@ Page Title="" Language="C#" MasterPageFile="~/Webarch.Master" AutoEventWireup="true" Inherits="MagicFramework.Helpers.PageBase" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
    <script src="Js/monitor.js"></script>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder1" runat="server">

    <script type="text/x-kendo-template" id="template">
        <div class="toolbar">                  
            <button type="button" class="k-button" onclick="new_elab();return false;"> #=getObjectText("create") # </button>   
        </div>
    </script>
    <%--
    <div id="tabstripcontainer" class="k-content" style="background-color: transparent;">
    </div>

    <div id="gridtitle">
        <p class="gridtitle">Elaborazioni attive</p>
    </div>   
    <div id="popupwindow" class="k-popup-edit-form k-window-content k-content">
    </div>--%>
    <style scoped>
        .k-tabstrip-items .k-state-active,
        .k-ie7 .k-tabstrip-items .k-state-active .k-loading
        {
            background-color: #ffffff;
            background-image: none;
            background-image: none, -webkit-linear-gradient(top, none);
            background-image: none, -moz-linear-gradient(top, none);
            background-image: none, -o-linear-gradient(top, none);
            background-image: none, linear-gradient(to bottom, none);
            border-color: #3a84fe;
        }
    </style>

    <script>
    $(document).ready(function () {
        loadscript();
    });
    </script>    
</asp:Content>
