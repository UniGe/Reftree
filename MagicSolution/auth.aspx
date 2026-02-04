<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="auth.aspx.cs" Inherits="MagicSolution.auth" %>

<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title></title>
</head>
<body>
    <form id="form1" runat="server">
    <div class="alert alert-warning">
        <% Response.Write(message); %>
    </div>
    </form>
    <script>
        if (location.hash) {
            var href = location.href;
            location.hash = '';
            location.href = href.replace('#', '?');
        }
    </script>
</body>
</html>
