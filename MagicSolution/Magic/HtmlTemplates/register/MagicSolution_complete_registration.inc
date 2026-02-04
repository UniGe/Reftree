		<h3 class="form-title">INREGISTRARE UTILIZATOR NOU</h3>
    
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

	<div class="form-group">
      <!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
      <asp:Label ID="CnpLabel" CssClass="control-label visible-ie8 visible-ie9" data-icon="u" runat="server" AssociatedControlID="Cnp">Cnp</asp:Label>
      <div class="input-icon">
        <i class="icon-envelope"></i>
        <asp:TextBox ID="Cnp" runat="server" placeholder="Cnp" CssClass="form-control placeholder-no-fix" autocomplete="on"></asp:TextBox>
      </div>
      <asp:RequiredFieldValidator ID="RequiredFieldValidator3" runat="server" ControlToValidate="Cnp"
					CssClass="failureNotificationStar" ErrorMessage="Cnp is required." ToolTip="Cnp is required."
					ValidationGroup="RegisterValidationGroup">*</asp:RequiredFieldValidator>

    </div>

	<div class="form-group">
      <!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
      <asp:Label ID="DatanasteriiLabel" CssClass="control-label visible-ie8 visible-ie9" data-icon="u" runat="server" AssociatedControlID="Datanasterii">Data nasterii</asp:Label>
      <div class="input-icon">
        <i class="icon-envelope"></i>
        <asp:TextBox ID="Datanasterii" runat="server" placeholder="Datanasterii" CssClass="form-control placeholder-no-fix" autocomplete="on"></asp:TextBox>
      </div>
      <asp:RequiredFieldValidator ID="RequiredFieldValidator4" runat="server" ControlToValidate="Datanasterii"
					CssClass="failureNotificationStar" ErrorMessage="Datanasterii is required." ToolTip="Datanasterii is required."
					ValidationGroup="RegisterValidationGroup">*</asp:RequiredFieldValidator>

    </div>

	<div class="form-group">
      <!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
      <asp:Label ID="SexLabel" CssClass="control-label visible-ie8 visible-ie9" data-icon="u" runat="server" AssociatedControlID="Sex">Sex</asp:Label>
      <div class="input-icon">
        <i class="icon-envelope"></i>
        <asp:TextBox ID="Sex" runat="server" placeholder="Sex" CssClass="form-control placeholder-no-fix" autocomplete="on"></asp:TextBox>
      </div>
      <asp:RequiredFieldValidator ID="RequiredFieldValidator5" runat="server" ControlToValidate="Sex"
					CssClass="failureNotificationStar" ErrorMessage="Sex is required." ToolTip="Sex is required."
					ValidationGroup="RegisterValidationGroup">*</asp:RequiredFieldValidator>

	</div>

	<div class="form-group">
      <!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
      <asp:Label ID="TelefonLabel" CssClass="control-label visible-ie8 visible-ie9" data-icon="u" runat="server" AssociatedControlID="Telefon">Telefon</asp:Label>
      <div class="input-icon">
        <i class="icon-envelope"></i>
        <asp:TextBox ID="Telefon" runat="server" placeholder="Telefon" CssClass="form-control placeholder-no-fix" autocomplete="on"></asp:TextBox>
      </div>
      <asp:RequiredFieldValidator ID="RequiredFieldValidator6" runat="server" ControlToValidate="Telefon"
					CssClass="failureNotificationStar" ErrorMessage="Telefon is required." ToolTip="Telefon is required."
					ValidationGroup="RegisterValidationGroup">*</asp:RequiredFieldValidator>

	</div>

	<div class="form-group">
      <!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
      <asp:Label ID="TaraLabel" CssClass="control-label visible-ie8 visible-ie9" data-icon="u" runat="server" AssociatedControlID="Tara">Tara</asp:Label>
      <div class="input-icon">
        <i class="icon-envelope"></i>
        <asp:TextBox ID="Tara" runat="server" placeholder="Tara" CssClass="form-control placeholder-no-fix" autocomplete="on"></asp:TextBox>
      </div>
      <asp:RequiredFieldValidator ID="RequiredFieldValidator7" runat="server" ControlToValidate="Tara"
					CssClass="failureNotificationStar" ErrorMessage="Tara is required." ToolTip="Tara is required."
					ValidationGroup="RegisterValidationGroup">*</asp:RequiredFieldValidator>

	</div>

	<div class="form-group">
      <!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
      <asp:Label ID="AdresaderesedintaLabel" CssClass="control-label visible-ie8 visible-ie9" data-icon="u" runat="server" AssociatedControlID="Adresaderesedinta">Adresa de resedinta</asp:Label>
      <div class="input-icon">
        <i class="icon-envelope"></i>
        <asp:TextBox ID="Adresaderesedinta" runat="server" placeholder="Adresaderesedinta" CssClass="form-control placeholder-no-fix" autocomplete="on"></asp:TextBox>
      </div>
      <asp:RequiredFieldValidator ID="RequiredFieldValidator8" runat="server" ControlToValidate="Adresaderesedinta"
					CssClass="failureNotificationStar" ErrorMessage="Adresaderesedinta is required." ToolTip="Adresaderesedinta is required."
					ValidationGroup="RegisterValidationGroup">*</asp:RequiredFieldValidator>

	</div>

	<div class="form-group">
      <!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
      <asp:Label ID="TaraLabel" CssClass="control-label visible-ie8 visible-ie9" data-icon="u" runat="server" AssociatedControlID="Tara">Tara</asp:Label>
      <div class="input-icon">
        <i class="icon-envelope"></i>
        <asp:TextBox ID="Tara" runat="server" placeholder="Tara" CssClass="form-control placeholder-no-fix" autocomplete="on"></asp:TextBox>
      </div>
      <asp:RequiredFieldValidator ID="RequiredFieldValidator7" runat="server" ControlToValidate="Tara"
					CssClass="failureNotificationStar" ErrorMessage="Tara is required." ToolTip="Tara is required."
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