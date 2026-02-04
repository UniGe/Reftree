<%@ Page Title="" Language="C#" MasterPageFile="~/Webarch.Master" AutoEventWireup="true" CodeBehind="approve.aspx.cs" Inherits="MagicSolution.approve" %>
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
    margin: 3% 15%;
    overflow-y: auto;
    height: 90%;
    padding: 50px;
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
<div id="form-popover">
    <div class="content">
        <form>
            <% Response.Write(content); %>
            <div style="height: 50px"></div>
                <button id="submit" class="btn btn-default">Ok</button>
                <span id="failureNotification" class="label label-danger" style="display: none;">Default</span>
            <div style="height: 50px"></div>
        </form>
    </div>
</div>
<script>
    $(document).ready(function () {
        var el = $('#form-popover');
        var content = el.find(".content");
        var validator = content.kendoValidator().data("kendoValidator");

        $('#submit').click(function (e) {
            $('#failureNotification').hide();
            if (validator.validate()) {
                var data = $('#form-popover .content input, #form-popover .content select').serializeArray();
                $.ajax(
                    {
                        url: 'approve.aspx',
                        type: 'POST',
                        data: data,
                        success: function (res) {
                            window.location.href = res;
                        },
                        error: function (error) {
                            $('#failureNotification').html('Verificare il form').show();
                        }
                    }
                );
            }
            else {
                $('#failureNotification').html('Verificare il form').show();
            }
            e.preventDefault();
        });
    });
</script>
</asp:Content>
