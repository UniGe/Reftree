using MagicFramework.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace MagicFramework.Controllers
{
    public class ChatDocumentController : ApiController
    {
        // POST api/<controller>
        [HttpPost]
        public void Post(MagicFramework.Helpers.DocumentLogFile data)
        {
            if (String.IsNullOrEmpty(data.File))
                return;
            Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
            data.TransmissionMode = "chat";
            try
            {
                data.DocumentTypeID = _context.Magic_DocumentRepositoryType.Where(t => t.Code.Equals("DC")).FirstOrDefault().ID;
            }
            catch
            {
                MFLog.LogInFile("DocumentRepositoryType for CHAT is missing in table.", MFLog.logtypes.WARN);
                data.DocumentTypeID = 0;
            }
            MagicFramework.Helpers.DocumentTraceManager.LogFile(data);
        }
    }
}