<%@ Page Title="" Language="C#" AutoEventWireup="true" Inherits="MagicSolution.Views._3.PowerBiHost" CodeBehind="PowerBIHost.aspx.cs" %>

<html>
<head>
    <title>Power BI Embedded Reftree</title>
    <script src="https://code.jquery.com/jquery-3.6.3.min.js" integrity="sha256-pvPw+upLPUjgMXY0G+8O0xUf+/Im1MZjXxxgOcBQBXU=" crossorigin="anonymous"></script>
    <script src="Js/powerbi-client/dist/powerbi.min.js"></script>

</head>
<body>
    <div id="embedContainer"></div>
    <script type="text/javascript">
        const params = new Proxy(new URLSearchParams(window.location.search), {
            get: (searchParams, prop) => searchParams.get(prop),
        });
        // Get the value of "some_key" in eg "https://example.com/?some_key=some_value"
        let reportId = params.reportId; 
        let workspaceId = params.workspaceId;
        let disableEI = params.disableEI || false;

        $.get("/api/PowerBIRefTree/EmbedReport", { reportId, workspaceId, disableEI }).then((result) => {
            console.log(result);
            // Get a reference to the embedded report HTML element
            const reportContainer = $('#embedContainer')[0];

            // Read embed application token from Model
            const accessToken = result.EmbedToken.token;

            // You can embed different reports as per your need by changing the index
            // Read embed URL from Model
            const embedUrl = result.EmbedReports[0].EmbedUrl;

            // Read report Id from Model
            const embedReportId = result.EmbedReports[0].ReportId;

            // Use the token expiry to regenerate Embed token for seamless end user experience
            // Refer https://aka.ms/RefreshEmbedToken
            const tokenExpiry = result.EmbedToken.Expiration;

            // Get models. models contains enums that can be used.
            const models = window['powerbi-client'].models;

            // Embed configuration used to describe the what and how to embed.
            // This object is used when calling powerbi.embed.
            // This also includes settings and options such as filters.
            // You can find more information at https://github.com/Microsoft/PowerBI-JavaScript/wiki/Embed-Configuration-Details.
            const config = {
                type: 'report',
                tokenType: models.TokenType.Embed,
                accessToken: accessToken,
                embedUrl: embedUrl,
                id: embedReportId,
                permissions: models.Permissions.All,
                settings: {
                    // Enable this setting to remove gray shoulders from embedded report
                    // background: models.BackgroundType.Transparent,
                    filterPaneEnabled: true,
                    navContentPaneEnabled: true
                }
            };

            // Embed the report and display it within the div container.
            const report = powerbi.embed(reportContainer, config);
        });
    </script>
  
</body>
</html>


