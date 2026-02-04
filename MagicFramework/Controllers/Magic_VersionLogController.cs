using MagicFramework.Helpers;
using MagicFramework.Helpers.Sql;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http;

namespace MagicFramework.Controllers
{
    public class Magic_VersionLogController : ApiController
    {
        private MFAPIGetQueries mfApi = new MFAPIGetQueries(DBConnectionManager.GetTargetConnection());

        [HttpPost]
        public Models.Response GetVersionLogsExceptForThisYear(dynamic data)
        {
            return mfApi.GetVersionLogsExceptForThisYear(data.Anno.Value);
        }

        [HttpPost]
        public Models.Response GetVersionLogForYear(dynamic data)
        {
            return mfApi.GetVersionDBs(data.AppInstance.Value, data.Year.ToString());
        }

    }
}