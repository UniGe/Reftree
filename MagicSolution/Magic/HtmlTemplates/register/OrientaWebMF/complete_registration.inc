		<h3 class="form-title">#SubInsTitle#</h3>

<div class="form-inline">
  <div class="form-group">
    <!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
    <asp:Label ID="SexLabel" CssClass="control-label visible-ie8 visible-ie9" data-icon="u" runat="server" AssociatedControlID="Gender">#SubInsSex#</asp:Label>
    <div>
      <asp:DropDownList ID="Gender" runat="server" CssClass="form-control">
        <asp:ListItem Value="Male">#SubInSexM#</asp:ListItem>
        <asp:ListItem Value="Female">#SubInSexF#</asp:ListItem>
      </asp:DropDownList>
    </div>
  </div>
</div>

    <div class="form-inline">
		  <div class="form-group">
			  <!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
			  <asp:Label ID="FirstNameLabel" CssClass="control-label visible-ie8 visible-ie9" data-icon="u" runat="server" AssociatedControlID="FirstName">#SubInsName#</asp:Label>
			  <div>
				  <asp:TextBox ID="FirstName" runat="server" placeholder="#SubInsName#" CssClass="form-control placeholder-no-fix" autocomplete="on"></asp:TextBox>
			  </div>
			  <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="FirstName"
					  CssClass="failureNotificationStar" ErrorMessage="#SubInsName# is required." ToolTip="#SubInsName# is required."
					  ValidationGroup="RegisterValidationGroup">*</asp:RequiredFieldValidator>

		  </div>

      <div class="form-group">
        <!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
        <asp:Label ID="LastNameLabel" CssClass="control-label visible-ie8 visible-ie9" data-icon="u" runat="server" AssociatedControlID="LastName">#SubInsSurname#</asp:Label>
        <div>
        
          <asp:TextBox ID="LastName" runat="server" placeholder="#SubInsSurname#" CssClass="form-control placeholder-no-fix" autocomplete="on"></asp:TextBox>
        </div>
        <asp:RequiredFieldValidator ID="RequiredFieldValidator2" runat="server" ControlToValidate="LastName"
					  CssClass="failureNotificationStar" ErrorMessage="#SubInsSurname# is required." ToolTip="#SubInsSurname# is required."
					  ValidationGroup="RegisterValidationGroup">*</asp:RequiredFieldValidator>

      </div>
    </div>

<div class="form-inline">
	<div class="form-group">
      <!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
      <asp:Label ID="CnpLabel" CssClass="control-label visible-ie8 visible-ie9" data-icon="u" runat="server" AssociatedControlID="TaxCode">#SubInsTaxCode#</asp:Label>
      <div>
        
        <asp:TextBox ID="TaxCode" runat="server" placeholder="#SubInsTaxCode#" CssClass="form-control placeholder-no-fix" autocomplete="on"></asp:TextBox>
      </div>
      <asp:RequiredFieldValidator ID="RequiredFieldValidator3" runat="server" ControlToValidate="TaxCode"
					CssClass="failureNotificationStar" ErrorMessage="#SubInsTaxCode# is required." ToolTip="#SubInsTaxCode# is required."
					ValidationGroup="RegisterValidationGroup">*</asp:RequiredFieldValidator>

    </div>

  <div class="form-group">
    <!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
    <asp:Label ID="TelefonLabel" CssClass="control-label visible-ie8 visible-ie9" data-icon="u" runat="server" AssociatedControlID="Phone">#SubInsPhone#</asp:Label>
    <div>

      <asp:TextBox ID="Phone" runat="server" placeholder="#SubInsPhone#" CssClass="form-control placeholder-no-fix" autocomplete="on"></asp:TextBox>
    </div>
  </div>
</div>

<div class="form-inline">
  <div class="form-group">
    <!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
    <asp:Label ID="BirthDateLabel" CssClass="control-label visible-ie8 visible-ie9" data-icon="u" runat="server" AssociatedControlID="BirthDate">#SubInsBirthDate#</asp:Label>
    <div>

      <asp:TextBox ID="BirthDate" runat="server" placeholder="#SubInsBirthDate#" CssClass="form-control placeholder-no-fix" autocomplete="on"></asp:TextBox>
    </div>
  </div>
  
</div>
<div class="form-inline">
	<div class="form-group">
      <!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
      <asp:Label ID="TaraLabel" CssClass="control-label visible-ie8 visible-ie9" data-icon="u" runat="server" AssociatedControlID="Nation">#SubInsNation#</asp:Label>
      <div>
        
        <asp:TextBox ID="Nation" runat="server" placeholder="#SubInsNation#" CssClass="form-control placeholder-no-fix" autocomplete="on"></asp:TextBox>
      </div>
	</div>

	<div class="form-group">
      <!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
      <asp:Label ID="AdresaderesedintaLabel" CssClass="control-label visible-ie8 visible-ie9" data-icon="u" runat="server" AssociatedControlID="Address">#SubInsAddress#</asp:Label>
      <div>
        
        <asp:TextBox ID="Address" runat="server" placeholder="#SubInsAddress#" CssClass="form-control placeholder-no-fix" autocomplete="on"></asp:TextBox>
      </div>
	</div>
</div>
<div class="form-inline">
	<div class="form-group">
      <!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
      <asp:Label ID="JudetLabel" CssClass="control-label visible-ie8 visible-ie9" data-icon="u" runat="server" AssociatedControlID="Location">#SubInsLocation#</asp:Label>
      <div>
        
        <asp:TextBox ID="Location" runat="server" placeholder="#SubInsLocation#" CssClass="form-control placeholder-no-fix" autocomplete="on"></asp:TextBox>
      </div>
	</div>

	<div class="form-group">
      <!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
      <asp:Label ID="CodpostalLabel" CssClass="control-label visible-ie8 visible-ie9" data-icon="u" runat="server" AssociatedControlID="Zip">#SubInsZipCode#</asp:Label>
      <div>
        <asp:TextBox ID="Zip" runat="server" placeholder="#SubInsZipCode#" CssClass="form-control placeholder-no-fix" autocomplete="on"></asp:TextBox>
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
  var dateInput = $("#BirthDate");
  var datepicker = dateInput.kendoDatePicker({
  format: "dd/MM/yyyy",
  start: "decade",
  culture: culture
  }).data("kendoDatePicker");
  dateInput.click(function() {datepicker.open();});

  document.getElementById('BirthDate').readOnly = true;

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