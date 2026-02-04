
		<h3 class="form-title">Registrazione utente</h3>

		<div class="form-group">
			<!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
			<asp:Label ID="EmailLabel" CssClass="control-label visible-ie8 visible-ie9" data-icon="u" runat="server" AssociatedControlID="Email">Username</asp:Label>
			<div class="input-icon">
				<i class="icon-envelope"></i>
				<asp:TextBox ID="Email" runat="server" placeholder="Email" CssClass="form-control placeholder-no-fix" autocomplete="on"></asp:TextBox>
			</div>
			<asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="Email"
					CssClass="failureNotificationStar" ErrorMessage="Email is required." ToolTip="Email is required."
					ValidationGroup="RegisterValidationGroup">*</asp:RequiredFieldValidator>
			<asp:RegularExpressionValidator 
				ControlToValidate="Email"
				ValidationExpression="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
				EnableClientScript="true"
				ErrorMessage="Email not valid!"
				ToolTip="Email not valid!"
				ValidationGroup="RegisterValidationGroup"
				CssClass="failureNotificationStar"
				runat="server" />
		</div>

		<div class="form-group">
			<asp:Label ID="PasswordLabel" CssClass="control-label visible-ie8 visible-ie9" data-icon="p" runat="server" AssociatedControlID="Password">Password</asp:Label>
			<div class="input-icon">
				<i class="icon-lock"></i>
				<asp:TextBox ID="Password" runat="server" CssClass="form-control placeholder-no-fix" TextMode="Password" placeholder="Password" autocomplete="off"></asp:TextBox>
			</div>
			<asp:RequiredFieldValidator ID="PasswordRequired" runat="server" ControlToValidate="Password"
					CssClass="failureNotificationStar" ErrorMessage="Password is required." ToolTip="Password is required."
					ValidationGroup="RegisterValidationGroup">*</asp:RequiredFieldValidator>
		</div>

		<div class="form-group">
			<asp:Label ID="RePasswordLabel" CssClass="control-label visible-ie8 visible-ie9" data-icon="p" runat="server" AssociatedControlID="RePassword">Repeat Password</asp:Label>
			<div class="input-icon">
				<i class="icon-lock"></i>
				<asp:TextBox ID="RePassword" runat="server" CssClass="form-control placeholder-no-fix" TextMode="Password" placeholder="Password" autocomplete="off"></asp:TextBox>
			</div>
			<asp:CompareValidator ID="PasswordMatch" runat="server" ControlToValidate="Password" ControlToCompare="RePassword"
					CssClass="failureNotificationStar" ErrorMessage="Password does not match." ToolTip="Password does not match."
					ValidationGroup="RegisterValidationGroup">*</asp:CompareValidator>
		</div>

		<span class="failureNotification">
			<asp:Literal ID="FailureText" runat="server"></asp:Literal>
			<asp:ValidationSummary ID="RegisterValidationSummary" runat="server" CssClass="failureNotification"
				ValidationGroup="RegisterValidationGroup" />
		</span>

<script>
  jQuery(document).ready(function () {
  // init background slide images
  $.backstretch(shuffleArray(bgImages), {
  fade: 1000,
  duration: 8000
  }
  );
  });

</script>