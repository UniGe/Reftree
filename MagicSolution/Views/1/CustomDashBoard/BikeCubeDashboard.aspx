<%@ Page Title="" Language="C#" MasterPageFile="~/Webarch.Master" AutoEventWireup="true" Inherits="MagicFramework.Helpers.PageBase" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder1" runat="server">
    <script>
        $("#spanbig").text("Dashboard");
        $("#appcontainer").empty();
        $("#appcontainer").append(' <div style="text-align:center;">\
                                                <img src="/Magic/Images/bikecube-logo.png">\
                                            </div>');
    </script>
</asp:Content>

