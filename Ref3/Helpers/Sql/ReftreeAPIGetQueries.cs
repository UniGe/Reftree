using MagicFramework.Models;
using System;
using System.Collections.Generic;

namespace Ref3.Helpers.Sql
{
    public class ReftreeAPIGetQueries : MagicFramework.Helpers.Sql.MFAPIGetQueries
    {

        public ReftreeAPIGetQueries(string conn) 
                : base(conn)
        {
        }

        public Response GetACCPAT_AccessPaths() {
            string tableName = "Custom.ACCPAT_AccessPath";
            List<KeyValuePair<string, string>> inParams = new List<KeyValuePair<string, string>>();
            inParams.Add(new KeyValuePair<string, string>("ACCPAT_TYPE", "TEMAT"));
            inParams.Add(new KeyValuePair<string, string>("ACCPAT_TYPE", "GEO"));
            inParams.Add(new KeyValuePair<string, string>("ACCPAT_TYPE", "3d"));
            return ExecuteQuery(tableName, inParams: inParams);
        }

        internal Response GetDocumentRelations(string DO_DOCREL_DO_DOCUME_ID, dynamic DO_DOCREL_ID_RECORD)
        {
            string tableName = "core.DO_DOCREL_document_relation";
            Dictionary<string, string> where = new Dictionary<string, string>();
            where.Add("DO_DOCREL_TABLE_NAME", "AS_ASSET_asset");
            if (!String.IsNullOrEmpty(DO_DOCREL_DO_DOCUME_ID))
            {
                where.Add("DO_DOCREL_DO_DOCUME_ID", DO_DOCREL_DO_DOCUME_ID);
            }
            List<KeyValuePair<string, string>> inParams = null;
            if(DO_DOCREL_ID_RECORD != null || DO_DOCREL_ID_RECORD.Length > 0)
            {
                inParams = new List<KeyValuePair<string, string>>();
                foreach (string id in DO_DOCREL_ID_RECORD)
                {
                    inParams.Add(new KeyValuePair<string, string>("DO_DOCREL_ID_RECORD", id));
                }
            }
            return ExecuteQuery(tableName, where: where, inParams: inParams);
        }

        internal Response GetMagic_Cal_Wkf_OutStatuses(string taskId)
        {
            string tableName = "dbo.v_Magic_Cal_Wkf_OutStatuses";
            Dictionary<string, string> where = new Dictionary<string, string>();
            if (!String.IsNullOrEmpty(taskId))
            {
                where.Add("taskId", taskId);
            }
            return ExecuteQuery(tableName, where: where, order: "5");
        }

        internal Response GetJO_EXEORD_execution_order(string JO_EXEORD_JO_TIPJOB_ID)
        {
            string tableName = "core.JO_EXEORD_execution_order";
            Dictionary<string, string> where = new Dictionary<string, string>();
            if (!String.IsNullOrEmpty(JO_EXEORD_JO_TIPJOB_ID))
            {
                where.Add("JO_EXEORD_JO_TIPJOB_ID", JO_EXEORD_JO_TIPJOB_ID);
            }
            return ExecuteQuery(tableName, where: where, order: "JO_EXEORD_ORDINE");
        }

        internal Response GetPRW_VI_PRICEU_L(string TK_PRICEU_ID, string TK_WORORD_ID = null)
        {
            string tableName = "core.PRW_VI_PRICEU_L";
            Dictionary<string, string> where = new Dictionary<string, string>();
            if (!String.IsNullOrEmpty(TK_PRICEU_ID))
            {
                where.Add("TK_PRICEU_ID", TK_PRICEU_ID);
            }
            if (!String.IsNullOrEmpty(TK_WORORD_ID))
            {
                where.Add("TK_WORORD_ID", TK_WORORD_ID);
            }
            return ExecuteQuery(tableName, where: where, order: "1");
        }

        internal Response GetFP_V_DFAULT(string FP_DFAULT_FP_TFAULT_ID)
        {
            string tableName = "core.FP_V_DFAULT";
            Dictionary<string, string> where = new Dictionary<string, string>();
            if (!String.IsNullOrEmpty(FP_DFAULT_FP_TFAULT_ID))
            {
                where.Add("FP_DFAULT_FP_TFAULT_ID", FP_DFAULT_FP_TFAULT_ID);
            }
            return ExecuteQuery(tableName, where: where, order: "FP_DFAULT_DESCRIPTION");
        }

        internal Response GetAS_TIPSTR_type_structure()
        {
            string tableName = "core.AS_TIPSTR_type_structure";            
            return ExecuteQuery(tableName, order: "AS_TIPSTR_DESCRIPTION");
        }

        internal Response GetFP_V_MATFAU(string FP_TFAULT_ID)
        {
            string tableName = "core.FP_V_MATFAU";
            Dictionary<string, string> where = new Dictionary<string, string>();
            if (!String.IsNullOrEmpty(FP_TFAULT_ID))
            {
                where.Add("FP_TFAULT_ID", FP_TFAULT_ID);
            }
            return ExecuteQuery(tableName, where: where, order: "Checked DESC,FP_ELEMAT_DESCRIPTION");
        }

        internal Response GetFP_V_RELCAU(string FP_RELCAU_FP_TFAULT_ID)
        {
            string tableName = "core.FP_V_RELCAU";
            Dictionary<string, string> where = new Dictionary<string, string>();
            if (!String.IsNullOrEmpty(FP_RELCAU_FP_TFAULT_ID))
            {
                where.Add("FP_RELCAU_FP_TFAULT_ID", FP_RELCAU_FP_TFAULT_ID);
            }
            return ExecuteQuery(tableName, where: where, order: "FP_CAUFAU_DESCRIPTION");
        }

        internal Response GetFP_V_TFAULT(string FP_TFAULT_ID)
        {
            string tableName = "core.FP_V_TFAULT";
            Dictionary<string, string> where = new Dictionary<string, string>();
            if (!String.IsNullOrEmpty(FP_TFAULT_ID))
            {
                where.Add("FP_TFAULT_ID", FP_TFAULT_ID);
            }
            return ExecuteQuery(tableName, where: where, order: "FP_TFAULT_DESCRIPTION");
        }

        internal Response GetDO_TIPDOC_document_type(string DO_TIPDOC_ID)
        {
            string tableName = "core.DO_TIPDOC_document_type";
            Dictionary<string, string> where = new Dictionary<string, string>();
            if (!String.IsNullOrEmpty(DO_TIPDOC_ID))
            {
                where.Add("DO_TIPDOC_ID", DO_TIPDOC_ID);
            }
            return ExecuteQuery(tableName, where: where, order: "DO_TIPDOC_DESCRIPTION");
        }

        internal Response GetEX_V_MODEXC_User(int uID)
        {
            string id = uID.ToString();
            string tableName = "core.EX_V_MODEXC_Users";
            Dictionary<string, string> where = new Dictionary<string, string>();
            if (!String.IsNullOrEmpty(id))
            {
                where.Add("UserID", id);
            }
            return ExecuteQuery(tableName, where: where, order: "EX_MODEXC_DESCRIPTION");
        }

        internal Response GetPlAssets(string PL_ASSET_ID)
        {
            string tableName = "core.PL_V_ASSET_LIST";
            Dictionary<string, string> where = new Dictionary<string, string>();
            if (!String.IsNullOrEmpty(PL_ASSET_ID))
            {
                where.Add("PL_ASSET_ID", PL_ASSET_ID);
            }
            return ExecuteQuery(tableName, where: where, order: "PL_ASSET_DESCRIPTION");
        }
        internal Response GetFcAssele_asset_elements(string FC_ASSELE_ID)
        {
            string tableName = "core.FC_ASSELE_asset_elements";
            Dictionary<string, string> where = new Dictionary<string, string>();
            if (!String.IsNullOrEmpty(FC_ASSELE_ID))
            {
                where.Add("FC_ASSELE_ID", FC_ASSELE_ID);
            }
            return ExecuteQuery(tableName, where: where, order: "1");
        }

        internal Response GetFcSpeele_asset_elements(string FC_SPEELE_FC_TIPELE_ID)
        {
            string tableName = "core.FC_SPEELE_specific_elements";
            Dictionary<string, string> where = new Dictionary<string, string>();
            if (!String.IsNullOrEmpty(FC_SPEELE_FC_TIPELE_ID))
            {
                where.Add("FC_SPEELE_FC_TIPELE_ID", FC_SPEELE_FC_TIPELE_ID);
            }
            return ExecuteQuery(tableName, where: where, order: "1");            
        }


        internal Response GetAsAsset_assetExtended(string AS_ASSET_ID)
        {
            string tableName = "core.AS_V_ASSET_assetExtended";
            Dictionary<string, string> where = new Dictionary<string, string>();
            if (!String.IsNullOrEmpty(AS_ASSET_ID))
            {
                where.Add("AS_ASSET_ID", AS_ASSET_ID);
            }
            return ExecuteQuery(tableName, where: where, order: "AS_ASSET_DESCRIZIONE");
        }
        
        internal Response GetAssetElements(string FC_ASSELE_ID)
        {
            string tableName = "core.FC_ASSELE_asset_elements";
            Dictionary<string, string> where = new Dictionary<string, string>();
            if (!String.IsNullOrEmpty(FC_ASSELE_ID))
            {
                where.Add("FC_ASSELE_ID", FC_ASSELE_ID);
            }
            return ExecuteQuery(tableName, where: where);
        }

        internal Response GetAsInterv(string FP_INTELE_ID)
        {
            string tableName = "core.AS_V_FP_INTERV";
            Dictionary<string, string> where = new Dictionary<string, string>();
            if (!String.IsNullOrEmpty(FP_INTELE_ID))
            {
                where.Add("FP_INTELE_ID", FP_INTELE_ID);
            }
            return ExecuteQuery(tableName, where: where, order: "1");
        }

        internal Response GetAsAssetsByLocationIDs(dynamic locationIDs)
        {
            string tableName = "core.AS_ASSET_asset";
            Dictionary<string, string> where = new Dictionary<string, string>();
            string condition = " AND AS_ASSET_ID_PADRE IS NULL";
            
            List<KeyValuePair<string, string>> inParams = null;
            if (locationIDs != null || locationIDs.Length > 0)
            {
                inParams = new List<KeyValuePair<string, string>>();
                foreach (string id in locationIDs)
                {
                    inParams.Add(new KeyValuePair<string, string>("AS_ASSET_LOCATION_ID", id));
                }
            }
            return ExecuteQuery(tableName, where: where, inParams: inParams, staticCondition: condition);
        }

        internal Response GetAsAssetLocation(string LOCATION_ID)
        {
            string tableName = "core.LOCATION";
            Dictionary<string, string> where = new Dictionary<string, string>();
            if (!String.IsNullOrEmpty(LOCATION_ID))
            {
                where.Add("LOCATION_ID", LOCATION_ID);
            }
            return ExecuteQuery(tableName, where: where);
        }

        internal Response GetAsAssetByDescription(string AS_ASSET_DESCRIZIONE)
        {
            string tableName = "core.AS_ASSET_asset";
            string op = "LIKE";
            AS_ASSET_DESCRIZIONE = "%" + AS_ASSET_DESCRIZIONE + "%";
            Dictionary<string, string> where = new Dictionary<string, string>();
            if (!String.IsNullOrEmpty(AS_ASSET_DESCRIZIONE))
            {
                where.Add("AS_ASSET_DESCRIZIONE", AS_ASSET_DESCRIZIONE);
            }
            return ExecuteQuery(tableName, where: where, op: op, order: "AS_ASSET_DESCRIZIONE");
        }

        internal Response GetAsAssetImagesCdpSdk(string AS_ASSET_ID)
        {
            string tableName = "custom.AS_V_ASSET_IMG_CDP_SDK";
            Dictionary<string, string> where = new Dictionary<string, string>();
            if (!String.IsNullOrEmpty(AS_ASSET_ID))
            {
                where.Add("AS_ASSET_ID", AS_ASSET_ID);
            }
            return ExecuteQuery(tableName, where: where);
        }

        internal Response GetIdCeiWebgis(string AS_ASSET_CODE)
        {
            string tableName = "custom.ID_CEI_WEBGIS";
            Dictionary<string, string> where = new Dictionary<string, string>();
            if (!String.IsNullOrEmpty(AS_ASSET_CODE))
            {
                where.Add("ID_CEIIMMOBILI", AS_ASSET_CODE);
            }
            return ExecuteQuery(tableName, where: where);
        } //use one for this and following method

        internal Response GetIdCeiVir(string AS_ASSET_CODE)
        {
            string tableName = "custom.ID_CEI_VIR";
            Dictionary<string, string> where = new Dictionary<string, string>();
            if (!String.IsNullOrEmpty(AS_ASSET_CODE))
            {
                where.Add("ID_CEIIMMOBILI", AS_ASSET_CODE);
            }
            return ExecuteQuery(tableName, where: where);
        }

        internal Response GetAsAssetImages(string AS_ASSET_ID)
        {
            string tableName = "core.AS_V_ASSET_IMG_GALLERY";
            Dictionary<string, string> where = new Dictionary<string, string>();
            if (!String.IsNullOrEmpty(AS_ASSET_ID))
            {
                where.Add("AS_ASSET_ID", AS_ASSET_ID);
            }
            return ExecuteQuery(tableName, where: where);
        }

        internal Response GetAsAsset(string AS_ASSET_ID)
        {
            string tableName = "core.AS_ASSET_asset";
            Dictionary<string, string> where = new Dictionary<string, string>();
            if (!String.IsNullOrEmpty(AS_ASSET_ID))
            {
                where.Add("AS_ASSET_ID", AS_ASSET_ID);
            }
            return ExecuteQuery(tableName, where: where);
        }

        internal Response GetTypeModel(string PS_TIPMOD_CODE)
        {
            string tableName = "core.PS_TIPMOD_type_model";
            Dictionary<string, string> where = new Dictionary<string, string>();
            if (!String.IsNullOrEmpty(PS_TIPMOD_CODE))
            {
                where.Add("PS_TIPMOD_CODE", PS_TIPMOD_CODE);
            }
            return ExecuteQuery(tableName, where: where, order: "PS_TIPMOD_ID");
        }
    }
}