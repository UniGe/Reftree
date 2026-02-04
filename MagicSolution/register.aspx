<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="register.aspx.cs" Inherits="MagicSolution.register" %>

<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head id="Head1" runat="server">
    <title><% Response.Write(base.FindTranslation("register", "Register")); %></title>
    <link href="/Magic/Styles/local_fonts.css" rel="stylesheet" type="text/css" />
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
        <% if (userCameFrom != null && System.IO.File.Exists(templateDirectory + selectedconfig.appInstancename + "\\header.html"))
           { %>
            <% Response.WriteFile(templateDirectory + selectedconfig.appInstancename + "\\header.html"); %>
        <% } else { %>
            <!--#include file="Magic/HtmlTemplates/login/default_header.html"-->
        <% } %>
    <script type="text/javascript">
        function shuffleArray(array) {
            for (var i = array.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var temp = array[i];
                array[i] = array[j];
                array[j] = temp;
            }
            return array;
        };
        var bgImages = [
        <%
        if (selectedconfig != null && selectedconfig.LoginBGS != null && selectedconfig.LoginBGS.Count > 0)
        {
            foreach (string bg in selectedconfig.LoginBGS)
            {
                Response.Write("\"" + bg + "\",");
            }
        }
        else
        {%>
             "/Magic/HtmlTemplates/metronic_v3.1.3/assets/admin/pages/media/bg/1.jpg",
             "/Magic/HtmlTemplates/metronic_v3.1.3/assets/admin/pages/media/bg/2.jpg",
             "/Magic/HtmlTemplates/metronic_v3.1.3/assets/admin/pages/media/bg/3.jpg",
             "/Magic/HtmlTemplates/metronic_v3.1.3/assets/admin/pages/media/bg/4.jpg"
        <%}%>
        ];
    </script>
</head>
<body class="login">
    <script>culture = '<% Response.Write(culturestring == null ? "it-IT" : culturestring); %>';</script>
    <form id="form1" runat="server">
        <div>
            <div class="login" style="background-color: transparent !important">
	            <div class="logo container">
                    <img id="applogopic" src="/" runat="server"/>
		            <span id="spansx" class="logoSx" runat="server"><% Response.Write(selectedconfig.appLeftTitle); %></span> <span id="spandx" class="logoDx" runat="server"><% Response.Write(selectedconfig.appRightTitle); %></span> 
	            </div>
	            <div class="content container" style="padding-bottom: 25px; background: rgba(0,0,0,0.4);">
                    <asp:placeholder id="content" runat="server" />
                    <% if(message != null && error!=true) {%>
                    <div class="alert alert-success" role="alert"><% Response.Write(message); %></div>
                    <% } %>
                    <% else if (message!=null){%>
                    <div class="alert alert-danger" role="alert"><% Response.Write(message); %></div>
                    <% } %>
                    <div class="form-actions">
                        
			            <asp:Button ID="RegisterButton" runat="server" CommandName="Submit" Text="Submit" ValidationGroup="RegisterValidationGroup" CssClass="btn blue pull-right" OnClick="Submit"/>
			            <%--<i class="m-icon-swapright m-icon-white"></i>--%>
                              
		            </div>
                   <% Response.Write(MagicSolution.auth.GetOAuthLinks(selectedconfig, base.FindTranslation("registerWith", "Register with"), Request)); %>
                </div>
            </div>
        </div>
    </form>
</body>
</html>
