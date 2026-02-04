<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="login.aspx.cs" Inherits="MagicSolution.login" %>

<!DOCTYPE html>

<!--[if IE 8]> <html lang="en" class="ie8 no-js"> <![endif]-->
<!--[if IE 9]> <html lang="en" class="ie9 no-js"> <![endif]-->
<!--[if !IE]><!--> <html lang="en" class="no-js"> <!--<![endif]-->
<!-- BEGIN HEAD -->
<head id="Head1" runat="server">
    <meta charset="utf-8" />
    <title>Login Magic Solution</title>
    <link rel="icon" href="/favicon.ico" />
    <asp:Literal ID="HeaderContent" runat="server"></asp:Literal>
    <asp:PlaceHolder runat="server" ID="HeadPlaceholder"></asp:PlaceHolder>
    <script>
     let sw_Initialized = navigator.serviceWorker && navigator.serviceWorker.controller != null; 
        if ('serviceWorker' in navigator && typeof serviceWorkerUrlPathPrefix == "string") { //activate the sw only when synchCallsApiPrefix is injected from code behind in HeadPlaceholder
            //routing exception managed in global.asax.cs , will respond with api/InOutFile/GetServiceWorker to change the scope to root...
            navigator.serviceWorker.register((serviceWorkerUrlPathPrefix || '') + '/RefTreeServiceWorker', { scope: "/" }).then(function (registration) {
                    // Registration was successful
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    return navigator.serviceWorker.ready;
                }).then(function () {
                    if (!sw_Initialized)
                        window.location.reload(); //repeat the login load now that service worker is up and running 
                }).catch(function (error) {
                    // Registration or service worker initialization failed
                    console.error('ServiceWorker registration failed: ', error);
                });;
        }
    </script>
</head>


<body class="login">
    <!-- BEGIN LOGO -->
	<div class="logo container">
        <img id="applogopic" src="/" style="max-width: 100%;" runat="server"/>
		<span id="spansx" class="logoSx" runat="server">Magic</span> <span id="spandx" class="logoDx" runat="server">Solution</span> 
	</div>
	<!-- END LOGO -->
	<!-- BEGIN LOGIN -->
	<div class="content container" style="padding-bottom: 25px; background: rgba(0,0,0,0.4);">
		
        <form id="form1" runat="server">
			<h3 class="form-title"><% Response.Write(base.FindTranslation("loginTitle", "Login to your account")); %></h3>
            <% if(message != null) {%>
                <div class="alert alert-success" role="alert"><% Response.Write(message); %></div>
            <% } %>
			<div class="alert alert-error hide">
				<button class="close" data-dismiss="alert"></button>
				<span>Enter any username and password.</span>
			</div>
            <asp:HiddenField id="actualFragment" runat="server" />
            <asp:Login ID="LoginUser" runat="server" RememberMeSet="false" EnableViewState="true"
                RenderOuterTable="false" OnAuthenticate="Login_Validate">
                   
                <LayoutTemplate>
                    
                    <div class="form-group">
				        <asp:DropDownList AutoPostBack="false"  DataTextField="appInstancename" DataValueField="id" ID="dbdrop" runat="server" CssClass="form-control placeholder-no-fix" autocomplete="off" ></asp:DropDownList>
				    </div>
                    <div class="form-group">
				        <asp:DropDownList AutoPostBack="false" Visible="false" DataTextField="label" DataValueField="url" ID="RedirectDrop" runat="server" CssClass="form-control placeholder-no-fix" autocomplete="off" ></asp:DropDownList>
				    </div>
                    <div class="form-group">
				        <!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
                        <asp:Label ID="UserNameLabel" CssClass="control-label visible-ie8 visible-ie9" data-icon="u" runat="server" AssociatedControlID="UserName">Username</asp:Label>
				        <div class="input-icon">
					        <i class="icon-user"></i>
                            <asp:TextBox ID="UserName" runat="server" placeholder="Username/Email" CssClass="form-control placeholder-no-fix" autocomplete="off"></asp:TextBox>
				        </div>
                        <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="UserName"
                                CssClass="failureNotificationStar" ErrorMessage="Username is required." ToolTip="User Name is required."
                                ValidationGroup="LoginUserValidationGroup">*</asp:RequiredFieldValidator>
			        </div>
                    <div class="form-group">
                        <asp:Label ID="PasswordLabel" CssClass="control-label visible-ie8 visible-ie9" data-icon="p" runat="server" AssociatedControlID="Password">Password</asp:Label>
				        <div class="input-icon">
					        <i class="icon-lock"></i>
                            <asp:TextBox ID="Password" runat="server" CssClass="form-control placeholder-no-fix" TextMode="Password" placeholder="Password" autocomplete="off"></asp:TextBox>
				        </div>
                        <asp:RequiredFieldValidator ID="PasswordRequired" runat="server" ControlToValidate="Password"
                                CssClass="failureNotificationStar" ErrorMessage="Password is required." ToolTip="Password is required."
                                ValidationGroup="LoginUserValidationGroup">*</asp:RequiredFieldValidator>
			        </div>
                    
                    <span class="failureNotification">
                        <asp:Literal ID="FailureText" runat="server"></asp:Literal>
                        <asp:ValidationSummary ID="LoginUserValidationSummary" runat="server" CssClass="failureNotification"
                            ValidationGroup="LoginUserValidationGroup" />
                    </span>
                    
                    <div class="form-actions">
				        <label class="checkbox" style="margin-left:20px;">
                            <asp:CheckBox ID="RememberMe" runat="server"/>
                            <asp:Label ID="RememberMeLabel" runat="server" AssociatedControlID="RememberMe" CssClass="inline"><% Response.Write(base.FindTranslation("rememberMe", "Remember me")); %></asp:Label>
				        </label>
                        
                        <asp:Button ID="LoginButton" runat="server" CommandName="Login" Text="Login" ValidationGroup="LoginUserValidationGroup" CssClass="btn blue pull-right"/>
                        
			        </div>
                </LayoutTemplate>
            </asp:Login>

            <% if(registerButton) {

                   Response.Write(MagicSolution.auth.GetOAuthLinks(selectedconfig, base.FindTranslation("loginWith", "Login with"), Request));
                   
                   var uri = new Uri(Request.Url.ToString());
                   string url = "/register.aspx";
                   if (userCameFrom != null && !uri.Query.Contains("from") && applicationConfig.appSettings.listOfInstances.Count() != 1)
                   {
                       if(uri.Query.Contains("?"))
                           url += uri.Query + "&from=" + userCameFrom;
                       else
                           url += "?from=" + userCameFrom;
                   }
                   else
                        url += uri.Query;
                 %>
                <div class="form-actions">
                    <a style="color: white;" class="btn blue pull-right" target="_self" href="<% Response.Write(url); %>"><% Response.Write(base.FindTranslation("newAccount", "New? Create an account!")); %></a>
			    </div>
            <% } %>
            <!-- BEGIN RECOVERY PASSWORD -->
            <div class="forget-password" runat="server">
				<h4><% Response.Write(base.FindTranslation("forgotPw", "Forgot your password?")); %></h4>
				<p>
					<a id="RememberPwdAnchor" runat="server" onclick="$('#RecoveryBlock').show()" style="cursor: pointer; color: #fff;"><% Response.Write(base.FindTranslation("forgotPwRecover", "No worries, click here  to reset your password.")); %></a>
				</p>
			</div>

			<p id="RecoverText" runat="server" visible="false"></p>
            <div id="RecoveryBlock" class="form-inline" style="display: none">
			    <div class="form-group">
				    <div class="input-icon">
					    <i class="icon-envelope"></i>
                        <asp:TextBox ID="UserNameRecovery" runat="server" placeholder="Username/Email" autocomplete="off" CssClass="form-control placeholder-no-fix"></asp:TextBox>
					    <asp:RequiredFieldValidator ID="UserNameRequired" runat="server" ControlToValidate="UserNameRecovery"
                        CssClass="failureNotificationStar" ErrorMessage="User Name is required." ToolTip="User Name is required."
                        ValidationGroup="PasswordRecoveryValidationGroup">*</asp:RequiredFieldValidator>
				    </div>
                </div>
                <div class="form-group">
                    <asp:Button ID="SubmitButton" runat="server" onclick="SendRecoveryMail" Text="Submit" ValidationGroup="PasswordRecovery1" CssClass="btn blue pull-right"/>
			    </div>
                <span class="failureNotification">
                    <asp:Literal ID="FailureText" runat="server"></asp:Literal>
                    <asp:ValidationSummary ID="PasswordRecoveryValidationSummary" runat="server" CssClass="failureNotification"
                        ValidationGroup="PasswordRecoveryValidationGroup" />
                </span>
            </div>              
            <!-- END RECOVERY PASSWORD -->

		</form>
	</div>
	<!-- END LOGIN -->
	<!-- BEGIN COPYRIGHT -->
	<div class="copyright footer-inner container">
		<span style="text-shadow: 1px 1px black;"><% Response.Write(DateTime.Now.Year); %> &copy; powered by </span><a href="<% Response.Write(this.applicationConfig.appSettings.appInfo.link); %>" target="_blank"><% Response.Write(this.applicationConfig.appSettings.appInfo.author); %></a>
	</div>
    <!-- END COPYRIGHT -->
    <script>
        if (window.location.hash.match(/^#\/function/)) {
            window.localStorage.setItem("lastAppLocation", window.location.hash);
        }
    </script>
    <script>
        if (location.hash)
            $(location.hash).show();

        var delete_cookie = function (name) {
            document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        };
        jQuery(document).ready(function () {
			(function () {
				XMLHttpRequest.prototype.open = (function (open) {
					return function (method, url, async) {

						if (window.serviceWorkerUrlPathPrefix) {
							this.setRequestHeader('X-MagicSolution-Reftree', 'true');
						}
						open.apply(this, arguments);
					};
				})(XMLHttpRequest.prototype.open);
            })();

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
				"<%= ConfigurationManager.AppSettings["ServiceWorkerUrlPathPrefix"] ?? "" %>/Magic/HtmlTemplates/metronic_v3.1.3/assets/admin/pages/media/bg/1.jpg",
				"<%= ConfigurationManager.AppSettings["ServiceWorkerUrlPathPrefix"] ?? "" %>/Magic/HtmlTemplates/metronic_v3.1.3/assets/admin/pages/media/bg/2.jpg",
				"<%= ConfigurationManager.AppSettings["ServiceWorkerUrlPathPrefix"] ?? "" %>/Magic/HtmlTemplates/metronic_v3.1.3/assets/admin/pages/media/bg/3.jpg",
				"<%= ConfigurationManager.AppSettings["ServiceWorkerUrlPathPrefix"] ?? "" %>/Magic/HtmlTemplates/metronic_v3.1.3/assets/admin/pages/media/bg/4.jpg"
        <%}%>
            ]), {
                fade: 1000,
                duration: 8000
            }
         );

        var fragment = window.location.hash;
        if (fragment) {
            $formActualFragment = $('#actualFragment');
            $formActualFragment.val(fragment);
        }

        });

       



	</script>
	
	<!-- END JAVASCRIPTS -->

</body>
</html>




