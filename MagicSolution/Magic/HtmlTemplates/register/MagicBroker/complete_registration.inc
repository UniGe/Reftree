<style>
  .login .content .form-control {
  background-color: #fff;
  width: 196px;
  }
</style>		




<h3 class="form-title">Completa la registrazione</h3>

<div class="form-inline">
  <div class="form-group">
    <!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
    <asp:Label ID="FirstNameLabel" CssClass="control-label visible-ie8 visible-ie9" data-icon="u" runat="server" AssociatedControlID="FirstName">Nome</asp:Label>
    <div>
      <asp:TextBox ID="FirstName" runat="server" placeholder="Nome" CssClass="form-control placeholder-no-fix" autocomplete="on"></asp:TextBox>
    </div>
    <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="FirstName"
        CssClass="failureNotificationStar" ErrorMessage="Nome é obbligatorio." ToolTip="Nome é obbligatorio."
        ValidationGroup="RegisterValidationGroup">*</asp:RequiredFieldValidator>

  </div>

  <div class="form-group">
    <!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
    <asp:Label ID="LastNameLabel" CssClass="control-label visible-ie8 visible-ie9" data-icon="u" runat="server" AssociatedControlID="LastName">Cognome</asp:Label>
    <div>

      <asp:TextBox ID="LastName" runat="server" placeholder="Cognome" CssClass="form-control placeholder-no-fix" autocomplete="on"></asp:TextBox>
    </div>
    <asp:RequiredFieldValidator ID="RequiredFieldValidator2" runat="server" ControlToValidate="LastName"
        CssClass="failureNotificationStar" ErrorMessage="Cognome é obbligatorio." ToolTip="Cognome é obbligatorio."
        ValidationGroup="RegisterValidationGroup">*</asp:RequiredFieldValidator>

  </div>
</div>

  <div class="form-group">
    <!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
    <asp:Label ID="SezioneRUILabel" CssClass="control-label" runat="server" AssociatedControlID="SezioneRUI">Sezione RUI</asp:Label>
    <div>
      <asp:DropDownList ID="SezioneRUI" runat="server" CssClass="form-control" style="width: 395px; margin-bottom: -10px;">
        <asp:ListItem Value="10">A - Agenti</asp:ListItem>
        <asp:ListItem Value="11">B - Broker</asp:ListItem>
        <asp:ListItem Value="12">C - Produttori diretti</asp:ListItem>
        <asp:ListItem Value="13">E - Collaboratori sezioni A,B,D</asp:ListItem>
        <asp:ListItem Value="16">D - Banche, Intermediari Finanziari, SIM, Poste</asp:ListItem>
      </asp:DropDownList>
    </div>
    <asp:RequiredFieldValidator ID="RequiredFieldValidator5" runat="server" ControlToValidate="SezioneRUI"
        CssClass="failureNotificationStar" ErrorMessage="Sezione RUI é obbligatorio." ToolTip="Sezione RUI é obbligatorio."
        ValidationGroup="RegisterValidationGroup">*</asp:RequiredFieldValidator>

  </div>

<div class="form-inline">
	<div class="form-group">
      <!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
      <asp:Label ID="CodiceRUILabel" CssClass="control-label visible-ie8 visible-ie9" data-icon="u" runat="server" AssociatedControlID="CodiceRUI">Codice RUI</asp:Label>
      <div>
        
        <asp:TextBox ID="CodiceRUI" runat="server" placeholder="Codice RUI" CssClass="form-control placeholder-no-fix" autocomplete="on"></asp:TextBox>
      </div>
      <asp:RequiredFieldValidator ID="RequiredFieldValidator3" runat="server" ControlToValidate="CodiceRUI"
					CssClass="failureNotificationStar" ErrorMessage="Codice RUI é obbligatorio." ToolTip="Codice RUI é obbligatorio."
					ValidationGroup="RegisterValidationGroup">*</asp:RequiredFieldValidator>

    </div>

  <div class="form-group">
    <!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
    <asp:Label ID="PIVALabel" CssClass="control-label visible-ie8 visible-ie9" data-icon="u" runat="server" AssociatedControlID="PIVA">Codice fiscale / PIVA</asp:Label>
    <div>

      <asp:TextBox ID="PIVA" runat="server" placeholder="Codice fiscale / PIVA" CssClass="form-control placeholder-no-fix" autocomplete="on"></asp:TextBox>
    </div>

  </div>
</div>


  <div class="form-group">
    <!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
    <asp:Label ID="RagioneSocialeLabel" CssClass="control-label visible-ie8 visible-ie9" data-icon="u" runat="server" AssociatedControlID="RagioneSociale">Ragione sociale/denominazione attività</asp:Label>
    <div>

      <asp:TextBox ID="RagioneSociale" runat="server" placeholder="Ragione sociale/denominazione attività" CssClass="form-control placeholder-no-fix" style="width: 395px; margin-bottom: -10px;" autocomplete="on"></asp:TextBox>
    </div>

  </div>

<div class="form-inline">
	<div class="form-group">
      <!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
      <asp:Label ID="TelefonoLabel" CssClass="control-label visible-ie8 visible-ie9" data-icon="u" runat="server" AssociatedControlID="Telefono">Telefono</asp:Label>
      <div>
        
        <asp:TextBox ID="Telefono" runat="server" placeholder="Telefono" CssClass="form-control placeholder-no-fix" autocomplete="on"></asp:TextBox>
      </div>

	</div>

	<div class="form-group">
      <!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
      <asp:Label ID="FotoURLLabel" CssClass="control-label visible-ie8 visible-ie9" data-icon="u" runat="server" AssociatedControlID="FotoURL">Foto</asp:Label>
      <div>
        
        <asp:TextBox ID="FotoURL" runat="server" placeholder="Foto" CssClass="form-control placeholder-no-fix" autocomplete="on"></asp:TextBox>
      </div>

	</div>
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
<style>
  .login .content{
  width: 456px;
  }
  .form-inline{
  margin-bottom: 5px;
  }
  .input-icon .k-widget {
  width: 195px;
  margin: 0;
  padding: 0;
  background-color: transparent !important;
  }

  .form-control[disabled], .form-control[readonly], fieldset[disabled] .form-control {
  cursor: pointer;
  }
</style>