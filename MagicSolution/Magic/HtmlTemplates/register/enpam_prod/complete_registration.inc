<h3 class="form-title">Completa la registrazione</h3>
   <div class="form-group" style="width:100%;">
        <!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
        <asp:Label ID="CodiceFiscale_l" CssClass="control-label visible-ie8 visible-ie9" data-icon="u" runat="server" AssociatedControlID="CodiceFiscale">Codice Fiscale</asp:Label>
        <div>
        
          <asp:TextBox style="width:100%;" ID="CodiceFiscale" runat="server" placeholder="Codice Fiscale" CssClass="form-control placeholder-no-fix" autocomplete="on"></asp:TextBox>
        </div>
        <asp:RequiredFieldValidator ID="RequiredFieldValidator2" runat="server" ControlToValidate="CodiceFiscale"
					  CssClass="failureNotificationStar" ErrorMessage="CodiceFiscale obbligatorio" ToolTip="CodiceFiscale obbligatorio"
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