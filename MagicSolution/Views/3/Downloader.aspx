<%@ Page Title="" Language="C#" MasterPageFile="~/Webarch.Master" AutoEventWireup="true" Inherits="MagicFramework.Helpers.PageBase" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder1" runat="server">
    <div id="downloadinfo___">
        <br />
        <h4></h4>
    </div>
    <script type="text/javascript">
        $("#spanbig").text("Downloads");
        const urlParams = new URLSearchParams(window.location.search);
        const DO_DOCFIL_DO_DOCUME_ID = urlParams.get('docid');
        const filename = urlParams.get('filename');
        $("#downloadinfo___ > h4").text("Downloading file:" + filename);
        var obj = {
            DO_DOCFIL_DO_DOCUME_ID: DO_DOCFIL_DO_DOCUME_ID,
            DO_DOCVER_LINK_FILE: JSON.stringify([{ name: filename }])
          };
          $.fileDownload('/api/Documentale/ViewFile/', {
            data: obj,
            httpMethod: 'POST'
          });
    </script>
</asp:Content>
