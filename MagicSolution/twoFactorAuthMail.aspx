<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="twoFactorAuthMail.aspx.cs" Inherits="MagicSolution.syncTwoFactorAuthMail" %>

<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head id="Head1" runat="server">
    <title><% Response.Write(base.FindTranslation("createAuthCode", "Create Auth Code")); %></title>
    <link href="/Magic/Styles/local_fonts.css" rel="stylesheet" type="text/css" />
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <!--#include file="Magic/HtmlTemplates/login/default_header.html"-->
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
        if (config != null && config.LoginBGS != null && config.LoginBGS.Count > 0)
        {
            foreach (string bg in config.LoginBGS)
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
    <script type="text/javascript">
		window.onload = function () {
			var qrImage = document.getElementById('QRCode');
			if (qrImage) {
				var originalSrc = qrImage.src;
				// Decode the chl parameter to extract the secret correctly
				var chlMatch = /chl=([^&]+)/.exec(originalSrc);
				if (chlMatch) {
					var decodedChl = decodeURIComponent(chlMatch[1]);
					var secretMatch = /secret=([^&]+)/.exec(decodedChl);
					if (secretMatch) {
						var secret = secretMatch[1];
						var newSrc = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' +
							encodeURIComponent('otpauth://totp/RefTree?secret=' + secret + '&issuer=RefTree');
						qrImage.src = newSrc;
						qrImage.style.display = 'block'; // Make sure the image is visible
					}
				}
			}
		};
	</script>
</head>
<body class="login">
    <script>culture = '<% Response.Write(culturestring == null ? "it-IT" : culturestring); %>';</script>
    <form id="form1" runat="server">
        <div>
            <div class="login" style="background-color: transparent !important">
	            <div class="logo container">
                    <img id="applogopic" src="/" runat="server"/>
		            <span id="spansx" class="logoSx" runat="server"><% Response.Write(config.appLeftTitle); %></span> <span id="spandx" class="logoDx" runat="server"><% Response.Write(config.appRightTitle); %></span> 
	            </div>
	            <div class="content container" style="padding-bottom: 25px; background: rgba(0,0,0,0.4);">
                    <asp:placeholder id="content" runat="server" /> 
                    <asp:Label ID="CodeLabel" Visible="false" CssClass="control-label" runat="server" AssociatedControlID="Code"></asp:Label>
                    <asp:TextBox ID="Code" Visible="false" runat="server" CssClass="form-control placeholder-no-fix" placeholder="Code" autocomplete="off"></asp:TextBox>
                    <% if(message != null && error != true) {%>
                    <div class="alert alert-success" role="alert"><% Response.Write(message); %></div>
                    <% } %>
                    <% else if (message!=null){%>
                    <div class="alert alert-danger" role="alert"><% Response.Write(message); %></div>
                    <% } %>
                    <div class="form-actions">
                        
			            <asp:Button ID="Button" runat="server" CommandName="Submit" Text="Submit" ValidationGroup="RegisterValidationGroup" CssClass="btn blue pull-right" OnClick="Submit"/>
			            <%--<i class="m-icon-swapright m-icon-white"></i>--%>
                              
		            </div>
                </div>
            </div>
        </div>
    </form>
</body>
</html>
