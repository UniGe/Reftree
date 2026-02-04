<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="SdiConfirm.aspx.cs" Inherits="MagicSolution.SdiConfirm" %>

<%@ Import Namespace="MagicFramework.Helpers" %>
<%@ Import Namespace="Newtonsoft.Json.Linq" %>
<%@ Import Namespace="System" %>
<%@ Import Namespace="System.Data" %>

<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" style="height: 100%;">
<head id="Head">    
    <title>Inserimento dati SDI</title>
    <style>
        input[type=text] {
            width: 80%;
            margin: 8px 0;
            display: inline-block;
            border: 1px solid #ccc;
            border-radius: 4px;
            box-sizing: border-box;
            background-color: #f9f9f9;
        }

        #Title {
            color: #000000;
            font-family: Arial;
            font-size: 16px;
            text-align: center;
            justify-content: center;
        }

        tr {
            border: none;
        }

        div {
            border: none;
        }

        h2 {
            color: red;
        }
    </style>
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
</head>
<body style="height: 100%; background-color: #f9f9f9;">
    <form id="form1" runat="server">
        <table style="table-layout: fixed; width: 100%; height: 100%; background-color: #f9f9f9; margin-top: 20px">
            <tbody>
                <tr>
                    <td style="width: 30%;"></td>
                    <td style="width: 35%; border: initial">
                        <table class="table table-striped" style="width: 100%; border: none; border-color: lightgrey;">         
                            <tr>
                                <td colspan="4" style="align-content: center; text-align:center;">
                                    <img src="https://intranet.ilosgroup.com/Magic/Images/prime_4_360.png" id="applogopic" style="max-width: 100%;" />
                                </td>
                            </tr>
                            <tr>
                               <td colspan="4" style="align-content: center;">
                                    <br />
                                        <p id="Title" style="font-weight: bold;">
                                            Vi chiediamo la cortesia di indicarci il codice destinatario per inviarVi le fatture elettroniche attraverso lo SDI o,
                                                    in alternativa, il Vostro indirizzo di posta elettronica certificata (PEC).
                                        </p>
                                    <br />
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <label>
                                        Ragione sociale
                                    </label>
                                </td>
                                <td>
                                    <asp:Label ID="FullDescription" runat="server" Width="200px" />
                                </td>
                                <td>
                                    <label>
                                        Indirizzo
                                    </label>
                                </td>
                                <td>
                                    <asp:Label ID="Address" runat="server" Enabled="false"></asp:Label>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <label>
                                        Localit&agrave;
                                    </label>
                                </td>
                                <td>
                                    <asp:Label ID="City" runat="server" Enabled="false"></asp:Label>
                                </td>
                                <td>
                                    <label>
                                        CAP
                                    </label>
                                </td>
                                <td>
                                    <asp:Label ID="PostalCode" runat="server" Enabled="false"></asp:Label>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <label>
                                        Provincia
                                    </label>
                                </td>
                                <td>
                                    <asp:Label ID="Prov" runat="server" Enabled="false"></asp:Label>
                                </td>
                                <td>
                                    <label>
                                        Partita IVA
                                    </label>
                                </td>
                                <td>
                                    <asp:Label ID="VatNumber" runat="server" Enabled="false"></asp:Label>
                                </td>
                            </tr>
                            <tr>
                                <td colspan="4">
                                    <label>
                                        Codice destinatario SDI
                                    </label>
                                </td>
                            </tr>
                            <tr>
                                <td colspan="4">
                                    <asp:TextBox ID="SDI" runat="server" Style="width: 25%; background-color: white; border-color: lightgrey;" MaxLength="7"></asp:TextBox>                                                                        
                                    <asp:RegularExpressionValidator Display="Dynamic" ControlToValidate="SDI" ID="LengthValidator" ValidationExpression="^[\s\S]{7,}$" runat="server" ErrorMessage="Il codice SDI per i soggetti privati ha una lunghezza 7 caratteri" ForeColor="Red"></asp:RegularExpressionValidator>
                                </td>
                            </tr>
                            <tr>
                                <td colspan="4">
                                    <label>
                                        PEC
                                    </label>
                                </td>
                            </tr>
                            <tr>
                                <td colspan="4">
                                    <asp:TextBox ID="PEC" runat="server" Style="width: 25%; background-color: white; border-color: lightgrey;"></asp:TextBox>
                                    <asp:RegularExpressionValidator Display="Dynamic" runat="server" ControlToValidate="PEC" ValidationExpression="\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*" ErrorMessage="Indirizzo PEC non valido" ForeColor="Red"></asp:RegularExpressionValidator>
                                </td>
                            </tr>
                            <tr>
                                <td colspan="4">
                                    <b>
                                        <p>Note</p>
                                    </b>
                                    <asp:TextBox mode="multiline" Height="66" Columns="50" TextMode="MultiLine" ID="Note" runat="server"></asp:TextBox>
                                </td>
                            </tr>
                            <tr>
                                <td colspan="4" style="padding-right: 0px;">
                                    <asp:Button ID="but_confirm" CssClass="btn btn-2 btn-2i" Text="Salva" runat="server" OnClick="but_confirm_Click" />
                                </td>
                            </tr>                            
                        </table>
                    </td>
                    <td style="width: 30%;"></td>
                </tr>
            </tbody>
        </table>
    </form>
</body>
</html>



