using AppOwnsData.Services;
using MagicFramework.Helpers;
using Microsoft.Rest;
using Ref3.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;

namespace Ref3.Controllers
{
    public class PowerBIRefTreeController : ApiController
    {
        private string m_errorMessage;
        private ConfigValidatorService m_validatorService;
        public PowerBIRefTreeController()
        {
            this.m_validatorService= new ConfigValidatorService();
            m_errorMessage = m_validatorService.GetWebConfigErrors();
        }
        [HttpGet]
        public async Task<ReportEmbedConfig> EmbedReport(string workspaceId,string reportId,bool? disableEI = false)
        {
            if (!String.IsNullOrWhiteSpace(m_errorMessage))
            {
                MFLog.LogInFile($"PowerBI -- {m_errorMessage}",MFLog.logtypes.ERROR);
            }

            var wId = ConfigValidatorService.GetParamGuid(workspaceId);
            var rId = ConfigValidatorService.GetParamGuid(reportId);

            try
            {
                this.m_validatorService.UserId = SessionHandler.IdUser;
                this.m_validatorService.UserGroupVisibilityId = SessionHandler.UserVisibilityGroup;
                var embedService = new EmbedService(m_validatorService, (bool)disableEI);
                var embedResult = await embedService.GetEmbedParams(wId, rId);
                return embedResult;
            }
            catch (HttpOperationException exc)
            {
                m_errorMessage = string.Format("Status: {0} ({1})\r\nResponse: {2}\r\nRequestId: {3}", exc.Response.StatusCode, (int)exc.Response.StatusCode, exc.Response.Content, exc.Response.Headers["RequestId"].FirstOrDefault());
                MFLog.LogInFile($"PowerBI -- {m_errorMessage}", MFLog.logtypes.ERROR);
                return null;
            }
            catch (Exception ex)
            {
                MFLog.LogInFile($"PowerBI -- {ex.Message}", MFLog.logtypes.ERROR);
                return null;
            }
        }
    }
}
