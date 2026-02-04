using MagicFramework.Helpers;
using MagicFramework.Models;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Web.Http.Controllers;
using System.Web.Http.Filters;

namespace MagicFramework.MemberShip.Filters
{
    public class GridObjectsFilter: ActionFilterAttribute
    {
        private void checkDataSourcePar(string customPar)
        {
            try
            {
                Dictionary<string, customJSONParamOp> cp = Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<string, customJSONParamOp>>(customPar);
                List<string> storedProcedures = new List<string>();
  
                foreach (var k in cp.Keys)
                {
                    //custom actions are not supposed to call standard write stored procedures 
                    if (k == "customaction" && DBConnectionManager.IsGenericWriteStoredProcedure(RequestParser.GetField(cp[k].Definition)))
                        throw new ArgumentException("CUS_DENIED_");

                    storedProcedures.Add(RequestParser.GetField(cp[k].Definition));
                }

                var dbutils = new DatabaseCommandUtils();
                if (!dbutils.CheckProceduresListExists(storedProcedures))
                    throw new ArgumentException("NF_DENIED_");
            }
            catch (Exception ex) {
                if (ex.Message == "CUS_DENIED_" || ex.Message == "NF_DENIED_")
                    throw new ArgumentException(ex.Message);
                else
                    throw new ArgumentException("GEN_DENIED_");
            }
             
        }
        /// <summary>
        /// checks if the forbidden combination customPar using generic read method fromthe client is used
        /// </summary>
        /// <param name="data">request payload</param>
        /// <returns></returns>
        private bool readOrExportIsUsedWithGenericReadProcedureAndCustomParFromClient(JObject data)
        {
            string operation = "read";
            string dataSourceCustomParam = (data["DataSourceCustomParam"] != null && data["DataSourceCustomParam"].Type == JTokenType.String) ? data["DataSourceCustomParam"].ToString() : null;
            operation = getOperation(data);
            if (operation != "read" && operation!="export")
                return false;

            Dictionary<string, customJSONParamOp> cp = Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<string, customJSONParamOp>>(dataSourceCustomParam);
            if (!cp.ContainsKey(operation))
                throw new System.ArgumentException("RG_DENIED_");
            string readStoredProcedure = cp[operation].Definition;
            if (DBConnectionManager.IsGenericReadStoredProcedure(RequestParser.GetField(readStoredProcedure)))
                return true;
            return false;
        }
        private void checkGridRights(JObject data, DatabaseCommandUtils dbutils) {

            bool isauthorized = true;
            string storedprocedure = String.Empty;
            if (String.IsNullOrEmpty(ConfigurationManager.AppSettings["checkUserRightsStoredProcedure"]))
            {
                return;
            }
            else
            {
                storedprocedure = ConfigurationManager.AppSettings["checkUserRightsStoredProcedure"].ToString();
            }
            string gridname = getGridName(data);
            //skip this control if no grid is given...
            if (string.IsNullOrEmpty(gridname))
                return;
            //this control has to be made by master grid in case this is an alternative one
            gridname = Magic_Grids.GetMasterGridForApplication(gridname);
          
          
            string operation = getOperationReadWrite(data);
            string entityname = getEntityName(data);
            string message = string.Empty;
 
            isauthorized = dbutils.checkGridRights(gridname, operation, entityname, storedprocedure, data, out message);
            if (!isauthorized)
               throw new ArgumentException("SP_BLK:" + message);
         
            return;
        }
        private string getGridName(JObject data)
        {
            string gridName = (data["GridName"] != null && data["GridName"].Type == JTokenType.String) ? data["GridName"].ToString() : null;
            string cfgGridName = (data["cfgGridName"] != null && data["cfgGridName"].Type == JTokenType.String) ? data["cfgGridName"].ToString() : null;
            return gridName ?? cfgGridName;
        }
        private string getOperation(JObject data)
        {
            string operation = (data["operation"] != null && data["operation"].Type == JTokenType.String) ? data["operation"].ToString() : null;
            return operation;
        }
        private string getOperationReadWrite(JObject data)
        {
            string operation = (data["operation"] != null && data["operation"].Type == JTokenType.String) ? data["operation"].ToString() : null;
            string cfgoperation = (data["cfgoperation"] != null && data["cfgoperation"].Type == JTokenType.String) ? data["cfgoperation"].ToString() : null;
            return operation ?? cfgoperation;
        }
        private string getEntityName(JObject data)
        {
            string entityName = (data["EntityName"] != null && data["EntityName"].Type == JTokenType.String) ? data["EntityName"].ToString() : null;
            string cfgEntityName = (data["cfgEntityName"] != null && data["cfgEntityName"].Type == JTokenType.String) ? data["cfgEntityName"].ToString() : null;
            return entityName ?? cfgEntityName ?? "";
        }
        private string checkCallAndGetTableName(JObject data)
        {
            string entityName = (data["EntityName"] != null && data["EntityName"].Type == JTokenType.String) ? data["EntityName"].ToString() :null;
            string cfgEntityName = (data["cfgEntityName"] != null && data["cfgEntityName"].Type == JTokenType.String) ? data["cfgEntityName"].ToString() : null;
            string gridName = (data["GridName"] != null && data["GridName"].Type == JTokenType.String) ? data["GridName"].ToString() : null;
            string cfgGridName = (data["cfgGridName"] != null && data["cfgGridName"].Type == JTokenType.String) ? data["cfgGridName"].ToString() : null;
            string cfgDataSourceCustomParam = (data["cfgDataSourceCustomParam"] != null && data["cfgDataSourceCustomParam"].Type == JTokenType.String) ? data["cfgDataSourceCustomParam"].ToString() : null;
            string dataSourceCustomParam = (data["DataSourceCustomParam"] != null && data["DataSourceCustomParam"].Type == JTokenType.String) ? data["DataSourceCustomParam"].ToString() : null;
            string wizardCode = (data["wizardCode"] != null && data["wizardCode"].Type == JTokenType.String) ? data["wizardCode"].ToString() : null;

            //exception in for xml columns definition 
            if (gridName == "v_Magic_BOUserColumns" || cfgGridName == "v_Magic_BOUserColumns" 
                || gridName == "Magic_BOTypeGrids" || cfgGridName == "Magic_BOTypeGrids"
                || gridName == "V_MagicUserFieldsConfig" || cfgGridName == "V_MagicUserFieldsConfig" 
                || gridName == "Magic_BusinessObjectTypes" || cfgGridName == "Magic_BusinessObjectTypes")
                return "";

            //forbidden call types 
            if (!String.IsNullOrEmpty(gridName) && 
                (!String.IsNullOrEmpty(entityName) || !String.IsNullOrEmpty(cfgEntityName) 
                || !String.IsNullOrEmpty(cfgGridName) || !String.IsNullOrEmpty(cfgDataSourceCustomParam) || !String.IsNullOrEmpty(dataSourceCustomParam)))
                throw new System.ArgumentException("SYN_RE_DENIED_");
            if (!String.IsNullOrEmpty(cfgGridName) && 
                (!String.IsNullOrEmpty(entityName) || !String.IsNullOrEmpty(cfgEntityName)
                || !String.IsNullOrEmpty(gridName) || !String.IsNullOrEmpty(dataSourceCustomParam) || !String.IsNullOrEmpty(cfgDataSourceCustomParam)))
                throw new System.ArgumentException("SYN_RE_DENIED_");
            //if entity is passed in read then a datasorce custom param has to be provided by the client (grids don't need it) 
            if (!String.IsNullOrEmpty(entityName) &&
                (!String.IsNullOrEmpty(gridName) || !String.IsNullOrEmpty(cfgEntityName)
                || !String.IsNullOrEmpty(cfgGridName) || !String.IsNullOrEmpty(cfgDataSourceCustomParam) || String.IsNullOrEmpty(dataSourceCustomParam)))
                throw new System.ArgumentException("SYN_WR_DENIED_");
            if (!String.IsNullOrEmpty(cfgEntityName) &&
                (!String.IsNullOrEmpty(entityName) || !String.IsNullOrEmpty(cfgGridName)
                || !String.IsNullOrEmpty(gridName) || !String.IsNullOrEmpty(dataSourceCustomParam)))
                throw new System.ArgumentException("SYN_WR_DENIED_");
            //wizard is admitted only with custom stored procedure in cfgDataSourceCustomParam
            if (!String.IsNullOrEmpty(wizardCode) && (!String.IsNullOrEmpty(entityName) || !String.IsNullOrEmpty(cfgEntityName)
                || !String.IsNullOrEmpty(gridName) || !String.IsNullOrEmpty(cfgGridName)
                || !String.IsNullOrEmpty(dataSourceCustomParam) || String.IsNullOrEmpty(cfgDataSourceCustomParam)))
                throw new System.ArgumentException("WZ_WR_DENIED_");

            //check for the existance of all the definitions in dataSourceCustomParam (block them if they call system stored procedures...) 
            if (!String.IsNullOrEmpty(dataSourceCustomParam) || !String.IsNullOrEmpty(cfgDataSourceCustomParam))
            {
                string customPar = dataSourceCustomParam ?? cfgDataSourceCustomParam;
                checkDataSourcePar(customPar);
            }

            if (!String.IsNullOrEmpty(entityName))
                return entityName;
            else if (!String.IsNullOrEmpty(cfgEntityName))
                return cfgEntityName;
            //else if (!String.IsNullOrEmpty(table))
            //    return table;
            else if (String.IsNullOrEmpty(cfgGridName) && String.IsNullOrEmpty(gridName) && String.IsNullOrEmpty(wizardCode)) // none of the managed case has been specified
                throw new System.ArgumentException("NO_MAN_CASE_DENIED_");
            return "";
        }
        public override void OnActionExecuting(HttpActionContext actionContext)
        {
            var dbutils = new DatabaseCommandUtils();
            // pre-processing, read the payload
            JObject data;
            if (actionContext.ActionArguments.ContainsKey("request"))
                data = JObject.FromObject(actionContext.ActionArguments["request"]);
            else
                data = JObject.FromObject(actionContext.ActionArguments["data"]);

            //double checking grid's rights
            checkGridRights(data, dbutils);

            string tableName = checkCallAndGetTableName(data);
            if (String.IsNullOrEmpty(tableName)) //entity name not given skip checkings
                return;
            //the grids are the only object entitled to use the generic read stored procedure and they don't pass the customPar from the client so if it's passed 
            // read has to have a custom procedure 
            if (readOrExportIsUsedWithGenericReadProcedureAndCustomParFromClient(data))
                throw new System.ArgumentException("RG_DENIED_");
            if (DBConnectionManager.IsSystemTable(tableName) || 
                (!dbutils.CheckTableOrViewExists(tableName) && !dbutils.CheckProcedureExists(tableName)))
                throw new System.ArgumentException("NF_DENIED_");
            if (DBConnectionManager.IsMagicTable(tableName) && !SessionHandler.UserIsDeveloper)
                throw new System.ArgumentException("MAG_DENIED_");
            //if a the key checkUserRightsStoredProcedure is defined, the stored procedure in value will be used to check that the user has rights to perorm the action 
    
        }

       
        //user who is not a developer cannot read config tables or System tables

    }
}