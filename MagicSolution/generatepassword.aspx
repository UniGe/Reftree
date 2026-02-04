<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="generatepassword.aspx.cs" Inherits="MagicSolution.generatepassword" %>

<!DOCTYPE html>
<!--[if IE 8]> <html lang="en" class="ie8 no-js"> <![endif]-->
<!--[if IE 9]> <html lang="en" class="ie9 no-js"> <![endif]-->
<!--[if !IE]><!-->
<html lang="en" class="no-js">
<!--<![endif]-->
<!-- BEGIN HEAD -->
<head id="Head1" runat="server">
    <meta charset="utf-8" />
    <title>Login Magic Solution</title>
    <link rel="icon" href="/favicon.ico" />
    <% if (userCameFrom != null && System.IO.File.Exists(templateDirectory + userCameFrom + "_header.html"))
        { %>
    <% Response.WriteFile(templateDirectory + userCameFrom + "_header.html"); %>
    <% }
    else
    { %>
    <!--#include file="Magic/HtmlTemplates/login/default_header.html"-->
    <% } %>
</head>


<body class="login">
    <!-- BEGIN LOGO -->
    <div class="logo container">
        <img id="applogopic" src="/" runat="server" />
        <span id="spansx" class="logoSx" runat="server">Magic</span> <span id="spandx" class="logoDx" runat="server">Solution</span>
    </div>
    <!-- END LOGO -->
    <!-- BEGIN LOGIN -->
    <div class="content container" style="padding-bottom: 25px; background: rgba(0,0,0,0.4);">

        <form id="form1" runat="server">
            <h3 class="form-title"><% Response.Write(base.FindTranslation("changepasswordTitle", "Change Password")); %></h3>
            <div id="divmessage" class="alert alert-success" runat="server" visible="false">
                <asp:Label ID="lbl_message" Visible="false" runat="server"></asp:Label><br />
            </div>
            <h4><asp:Label ID="newpassword" runat="server"><% Response.Write(base.FindTranslation("newpassword", "newpassword")); %></asp:Label></h4>
            <asp:TextBox ID="chg_password" TextMode="Password" runat="server" CssClass="form-control placeholder-no-fix"></asp:TextBox><br />
            <h4><asp:Label ID="newpasswordconfirm" runat="server"><% Response.Write(base.FindTranslation("newpasswordconfirm", "newpasswordconfirm")); %></asp:Label></h4>
            <asp:TextBox ID="chg_password_confirm" TextMode="Password" runat="server" CssClass="form-control placeholder-no-fix"></asp:TextBox><br />            
            <asp:CompareValidator id="validatepassword" CssClass="failureNotification" ControlToValidate="chg_password_confirm" ControlToCompare="chg_password" runat="server" Operator="Equal" ErrorMessage=""></asp:CompareValidator>                        
            <asp:Button ID="SubmitButton" runat="server" OnClick="but_submit_Click" Text="Cambia password" CssClass="btn blue pull-right" />
        </form>
    </div>
    <!-- END LOGIN -->
    <!-- BEGIN COPYRIGHT -->
    <div class="copyright footer-inner container">
        <span style="text-shadow: 1px 1px black;"><% Response.Write(DateTime.Now.Year); %> &copy; powered by </span><a href="http://www.ilosgroup.com" target="_blank">ILOS</a>
    </div>
    <!-- END COPYRIGHT -->
    <script>
        var delete_cookie = function (name) {
            document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        };

        jQuery(document).ready(function () {
            Metronic.init(); // init metronic core components
            Layout.init(); // init current layout
            QuickSidebar.init(); // init quick sidebar
            Demo.init(); // init demo features
            Login.init();
            function shuffleArray(array) {
                for (var i = array.length - 1; i > 0; i--) {
                    var j = Math.floor(Math.random() * (i + 1));
                    var temp = array[i];
                    array[i] = array[j];
                    array[j] = temp;
                }
                return array;
            }
            // init background slide images
            $.backstretch(shuffleArray([
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
            ]), {
                fade: 1000,
                duration: 8000
            }
         );
        });
    </script>

    <!-- END JAVASCRIPTS -->

</body>
</html>




