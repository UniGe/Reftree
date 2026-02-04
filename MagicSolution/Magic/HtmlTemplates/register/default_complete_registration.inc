		<h3 class="form-title">Complete Registration</h3>
    
		<div class="form-group">
			<!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
			<asp:Label ID="FirstNameLabel" CssClass="control-label visible-ie8 visible-ie9" data-icon="u" runat="server" AssociatedControlID="FirstName">FirstName</asp:Label>
			<div class="input-icon">
				<i class="icon-envelope"></i>
				<asp:TextBox ID="FirstName" runat="server" placeholder="FirstName" CssClass="form-control placeholder-no-fix" autocomplete="on"></asp:TextBox>
			</div>
			<asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="FirstName"
					CssClass="failureNotificationStar" ErrorMessage="FirstName is required." ToolTip="FirstName is required."
					ValidationGroup="RegisterValidationGroup">*</asp:RequiredFieldValidator>

		</div>

    <div class="form-group">
      <!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
      <asp:Label ID="LastNameLabel" CssClass="control-label visible-ie8 visible-ie9" data-icon="u" runat="server" AssociatedControlID="LastName">LastName</asp:Label>
      <div class="input-icon">
        <i class="icon-envelope"></i>
        <asp:TextBox ID="LastName" runat="server" placeholder="LastName" CssClass="form-control placeholder-no-fix" autocomplete="on"></asp:TextBox>
      </div>
      <asp:RequiredFieldValidator ID="RequiredFieldValidator2" runat="server" ControlToValidate="LastName"
					CssClass="failureNotificationStar" ErrorMessage="LastName is required." ToolTip="LastName is required."
					ValidationGroup="RegisterValidationGroup">*</asp:RequiredFieldValidator>

    </div>

		<span class="failureNotification">
			<asp:Literal ID="FailureText" runat="server"></asp:Literal>
			<asp:ValidationSummary ID="RegisterValidationSummary" runat="server" CssClass="failureNotification"
				ValidationGroup="RegisterValidationGroup" />
		</span>

<script>
jQuery(document).ready(function () {
            // init background slide images
            $.backstretch([
             "/Magic/HtmlTemplates/metronic_v3.1.3/assets/admin/pages/media/bg/1.jpg",
             "/Magic/HtmlTemplates/metronic_v3.1.3/assets/admin/pages/media/bg/2.jpg",
             "/Magic/HtmlTemplates/metronic_v3.1.3/assets/admin/pages/media/bg/3.jpg",
             "/Magic/HtmlTemplates/metronic_v3.1.3/assets/admin/pages/media/bg/4.jpg"
            ], {
                fade: 1000,
                duration: 8000
            }
         );
        });

</script>