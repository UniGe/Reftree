using MagicFramework.Helpers;
using MagicFramework.Helpers.Sql;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http;

namespace MagicFramework.Controllers
{
    public class Magic_ActionsController : ApiController
    {        
        private MFAPIGetQueries mfApi = new MFAPIGetQueries(DBConnectionManager.GetTargetConnection());
        
        [HttpPost]
        public Models.Response GetCalendarTask_v(dynamic data)
        {
            return mfApi.GetCalendarTask_v(data.taskId.Value.ToString());
        }
        [HttpPost]
        public Models.Response GetCalendarTask(dynamic data)
        {
            return mfApi.GetCalendarTask(data.taskId.Value.ToString());
        }
        [HttpGet]
        public Models.Response GetCalendarTaskTypes()
        {
            return mfApi.GetCalendarTaskTypes();
        }
        
    }
}