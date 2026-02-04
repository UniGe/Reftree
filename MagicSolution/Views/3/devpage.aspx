<%@ Page Title="" Language="C#" MasterPageFile="~/Webarch.Master" AutoEventWireup="true" Inherits="MagicFramework.Helpers.PageBase" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
    <script src="Js/CadViewer.js"></script>
<%--    <script src="Js/GeoCad.js"></-->--%>

</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder1" runat="server">
    <div id="grid"></div>
    <div>
        <script>
            loadscript();
        </script>
      <iframe class="cadviewer" src="http://caddem.idearespa.com/slcadviewer/CadViewer.aspx?DwgPath=http://caddem.idearespa.com/slcadviewer/cad/100005p0.dwg&h=1F7CC;1F7CD&Z=1"></iframe>
    </div>
</asp:Content>
