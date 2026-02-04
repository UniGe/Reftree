// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
// ----------------------------------------------------------------------------

namespace Ref3.Models
{
    using Microsoft.PowerBI.Api.Models;
    using System.Collections.Generic;

    public class ReportEmbedConfig
    {
        // Report to be embedded
        public List<EmbedReport> EmbedReports { get; set; }

        // Embed Token for the Power BI report
        public EmbedToken EmbedToken { get; set; }
    }
}