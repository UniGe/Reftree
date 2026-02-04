<%@ Page Title="" Language="C#" MasterPageFile="~/Metronic_v3.1.3.Master" AutoEventWireup="true" Inherits="MagicFramework.Helpers.PageBase" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder1" runat="server">
<script>
    $.getScript(window.includesVersion + "/Magic/v/" + window.applicationVersion + "/Scripts/dashboard.js")
        .done(function () {
            $("#schedulerlink").hide();
            $("#maillink").hide();
            $("#spanbig").text("Dashboard");
            $("#appcontainer").empty();
            $("#appcontainer").append(' <div style="text-align:center;">\
                                                <img src="/Magic/Images/kiba-logo.png">\
                                            </div>');
           
        }); //end of document ready
</script>
</asp:Content>

