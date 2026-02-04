using MagicFramework.Controllers.ActionFilters;
using MagicFramework.Helpers;
using MagicFramework.Models;
using Ref3.Helpers.Sql;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web;
using System.Web.Http;

namespace Ref3.Controllers
{
    [ExceptionFilter]
    public class MF_APIController : ApiController
    {
        private ReftreeAPIGetQueries queries = new ReftreeAPIGetQueries(DBConnectionManager.GetTargetConnection());

        [HttpGet]
        public Response GetACCPAT_AccessPaths()
        {
            return queries.GetACCPAT_AccessPaths();
        }

        [HttpPost]
        public Response GetDocumentRelations(dynamic data)
        {
            return queries.GetDocumentRelations(data.DO_DOCREL_DO_DOCUME_ID.Value, data.DO_DOCREL_ID_RECORD);
        }
        
        [HttpPost]
        public Response GetIdCeiVir(dynamic data)
        {
            return queries.GetIdCeiVir(data.AS_ASSET_CODE.Value);
        }
        
        [HttpPost]
        public Response GetIdCeiWebgis(dynamic data)
        {
            return queries.GetIdCeiWebgis(data.AS_ASSET_CODE.Value);
        }

        [HttpPost]
        public Response GetTypeModel(dynamic data)
        {
            return queries.GetTypeModel(data.PS_TIPMOD_CODE.Value);
        }

        [HttpPost]
        public Response GetAsInterv(dynamic data)
        {            
            return queries.GetAsInterv(data.FP_INTELE_ID.Value);
        }

        [HttpPost]
        public Response GetAssetElements(dynamic data)
        {
            return queries.GetAssetElements(data.FC_ASSELE_ID.Value);
        }

        [HttpPost]
        public Response GetMagic_Cal_Wkf_OutStatuses(dynamic data)
        {
            return queries.GetMagic_Cal_Wkf_OutStatuses(data.taskId.Value);
        }

        [HttpGet]
        public Response GetEX_V_MODEXC_User()
        {
            int uID = SessionHandler.IdUser;
            return queries.GetEX_V_MODEXC_User(uID);
        }

        [HttpPost]
        public Response GetJO_EXEORD_execution_order(dynamic data)
        {
            return queries.GetJO_EXEORD_execution_order(data.JO_EXEORD_JO_TIPJOB_ID.Value);
        }

        [HttpPost]
        public Response GetDO_TIPDOC_document_type(dynamic data)
        {
            return queries.GetDO_TIPDOC_document_type(data.DO_TIPDOC_ID.Value);
        }

        [HttpPost]
        public Response GetPRW_VI_PRICEU_L(dynamic data)
        {
            var a = (Newtonsoft.Json.Linq.JObject) data;
            if (a.Count > 1) { 
                return queries.GetPRW_VI_PRICEU_L(data.TK_PRICEU_ID.Value, data.TK_WORORD_ID.Value);            
            }
            else
            {
                return queries.GetPRW_VI_PRICEU_L(data.TK_PRICEU_ID.Value);
            }
        }

        [HttpPost]
        public Response GetFP_V_DFAULT(dynamic data)
        {
            return queries.GetFP_V_DFAULT(data.FP_DFAULT_FP_TFAULT_ID.Value);
        }

        [HttpPost]
        public Response GetFP_V_MATFAU(dynamic data)
        {
            return queries.GetFP_V_MATFAU(data.FP_TFAULT_ID.Value);
        }
        
        [HttpPost]
        public Response GetFP_V_RELCAU(dynamic data)
        {
            return queries.GetFP_V_RELCAU(data.FP_RELCAU_FP_TFAULT_ID.Value);
        }
        [HttpPost]
        public Response GetFP_V_TFAULT(dynamic data)
        {
            return queries.GetFP_V_TFAULT(data.FP_TFAULT_ID.Value);
        }

        [HttpGet]
        public Response GetAS_TIPSTR_type_structure() {
            return queries.GetAS_TIPSTR_type_structure();
        }

    }
}