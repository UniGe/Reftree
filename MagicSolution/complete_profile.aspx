<%@ Page Title="" Language="C#" MasterPageFile="~/Webarch.Master" AutoEventWireup="true" CodeBehind="complete_profile.aspx.cs" Inherits="MagicSolution.complete_profile" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder1" runat="server">
<style>
  .login .content .form-control {
      background-color: #fff;
      width: 196px;
  }

  #form-popover .form-group > div {
      position: relative;
  }

  #form-popover .form-group > div .k-tooltip {
      position: absolute;
      top: -27px;
      display: block;
      left: 0px;
  }

  #form-popover{
    background: rgba(0,0,0,.7);
    display: table-cell;
    height: 100%;
    left: 0;
    position: fixed;
    top: 0;
    vertical-align: middle;
    width: 100%;
    z-index: 999999999;
  }

  #form-popover .content{
    background-color: white;
    margin-top: 200px;
    padding-left: 30px;
    overflow-y: auto;
  }

  .form-actions{
      background-color: transparent;
  }
  .login .content{
    width: 456px;
      max-width: 100%;
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
<div id="form-popover" class="login" style="display: none;">
    <div class="content container">
    <h3 class="form-title">Completa la registrazione</h3>

    <div class="form-inline">
      <div class="form-group">
        <!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
        <label class="control-label visible-ie8 visible-ie9">Nome</label>
        <div>
          <input type="text" name="FirstName" class="form-control placeholder-no-fix" autocomplete="on" required validationMessage="Il Nome é obbligatorio" />
        </div>

      </div>

      <div class="form-group">
        <!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
        <label class="control-label visible-ie8 visible-ie9">Cognome</label>
        <div>

          <input type="text" name="LastName" class="form-control placeholder-no-fix" autocomplete="on" required validationMessage="Il Cogome é obbligatorio" />
        </div>

      </div>
    </div>

      <div class="form-group">
        <!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
        <label class="control-label">Sezione RUI</label>
        <div>
          <select name="SezioneRUI" class="form-control" style="width: 395px; margin-bottom: -10px;">
            <option Value="10">A - Agenti</option>
            <option Value="11">B - Broker</option>
            <option Value="12">C - Produttori diretti</option>
            <option Value="13">E - Collaboratori sezioni A,B,D</option>
            <option Value="16">D - Banche, Intermediari Finanziari, SIM, Poste</option>
          </select>
        </div>
      </div>

    <div class="form-inline">
	    <div class="form-group">
          <!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
          <label class="control-label visible-ie8 visible-ie9">Codice RUI</label>
          <div>
        
            <input type="text" name="CodiceRUI" class="form-control placeholder-no-fix" autocomplete="on" required validationMessage="Il Codice RUI é obbligatorio" />
          </div>
        </div>

      <div class="form-group">
        <!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
        <label class="control-label visible-ie8 visible-ie9">Codice fiscale / PIVA</label>
        <div>

          <input type="text" name="PIVA" class="form-control placeholder-no-fix" autocomplete="on">
        </div>

      </div>
    </div>


      <div class="form-group">
        <!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
        <label class="control-label visible-ie8 visible-ie9">Ragione sociale/denominazione attività</label>
        <div>

          <input type="text" name="RagioneSociale" class="form-control placeholder-no-fix" style="width: 395px; margin-bottom: -10px;" autocomplete="on" />
        </div>

      </div>

    <div class="form-inline">
	    <div class="form-group">
          <!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
          <label class="control-label visible-ie8 visible-ie9">Telefono</label>
          <div>
        
            <input type="text" name="Telefono" class="form-control placeholder-no-fix" autocomplete="on" />
          </div>

	    </div>

	   <!-- <div class="form-group">
          <asp:Label ID="FotoURLLabel" CssClass="control-label visible-ie8 visible-ie9" runat="server" AssociatedControlID="FotoURL">Foto</asp:Label>
          <div>
        
            <asp:TextBox ID="FotoURL" runat="server" CssClass="form-control placeholder-no-fix" autocomplete="on"></asp:TextBox>
          </div>

	    </div>-->
    </div>

		    <span class="failureNotification">
			    
		    </span>

        <div class="form-actions">
                        
	        <input type="submit" id="CompleteRegisterButton" value="Submit" class="btn blue pull-right" />
	        <%--<i class="m-icon-swapright m-icon-white"></i>--%>
            
        </div>
    </div>
</div>
<script>
    $(document).ready(function () {
        var el = $('#form-popover');
        var html = el[0].outerHTML;
        el.remove();
        $('body').css('overflow', 'hidden').prepend(html);
        var content = el.find(".content");
        el.show();
        centerPopover(content);
        $(window).resize(function () { centerPopover(content); });

        var validator = content.kendoValidator().data("kendoValidator");

        $('#CompleteRegisterButton').click(function () {
            if (validator.validate()) {
                $('.failureNotification').html('');
                var data = $('#form-popover .content input, #form-popover .content select').serializeArray();
                $.ajax(
                    {
                        url: 'complete_profile.aspx/Submit',
                        type: 'POST',
                        data: data,
                        success: function (res) {
                            var errorMessage = 'Error';
                            try {
                                var data = JSON.parse(res);
                            }
                            catch (err) {
                                $('.failureNotification').html(errorMessage);
                                return;
                            }

                            if (data.action == "redirect") {
                                googleAnalytics('set', 'page', '/successful-registration');
                                googleAnalytics('send', 'pageview');
                                fbq('track', 'CompleteRegistration');
                                window.location.replace(data.link);
                            }
                            else {
                                if (data.action = 'showMessage') {
                                    errorMessage = data.message;
                                }
                                $('.failureNotification').html(errorMessage);
                            }

                        },
                        error: function () { $('.failureNotification').html('Server Error'); }
                    }
                );
            }
            else {
                $('.failureNotification').html('Verificare il form');
            }
            
        });

        function centerPopover($el) {
            var marginTop = (window.innerHeight - $el.height()) / 2;
            var marginSide = (window.outerWidth - $el.width(true)) / 2;
            $el.css({
                "margin-top": Math.max(marginTop, 0),
                "margin-left": marginSide,
                "max-height": window.innerHeight
            });
        }

    });
</script>
</asp:Content>
