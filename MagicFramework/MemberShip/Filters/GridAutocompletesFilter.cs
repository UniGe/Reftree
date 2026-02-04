using MagicFramework.Helpers;
using MagicFramework.Models;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Web.Http.Controllers;
using System.Web.Http.Filters;

namespace MagicFramework.MemberShip.Filters
{
    public class GridAutocompletesFilter : ActionFilterAttribute
    {
        private bool existsAutocompleteWithThisConfig(string gridName, string entityName, string storedProcedure)
        {
            string sql = @"select td.MagicTemplateDetailID 
                            FROM dbo.Magic_Grids g
                            inner join dbo.Magic_Templates t
                            on t.MagicTemplateName = g.EditableTemplate
                            inner join dbo.Magic_TemplateDetails td
                            on td.MagicTemplate_ID = t.MagicTemplateID
                            inner join Magic_TemplateDataRoles dr
                            on dr.[MagicTemplateDataRoleID] = td.[MagicDataRole_ID]
                            where g.MagicGridName = @gridname and td.DetailIsVisible = 1
                            and MagicDataSource = @entity and isnull(MagicDataSourceSchema,'') = @schema
                            and dr.[MagicTemplateDataRole] like '%autocomplete'";

            string entity = !String.IsNullOrEmpty(entityName) ? entityName  : storedProcedure;
            string[] s = entity.Split('.');
            string schema = String.Empty;
            if (s.Length > 1)
            {
                entity = s[1];
                schema = s[0];
            }

            DataSet ds = new DataSet();
            using (SqlConnection conn = new SqlConnection(DBConnectionManager.GetMagicConnection()))
            {
                using (SqlCommand command = new SqlCommand(sql, conn))
                {
                    var GRIDNAME = new SqlParameter("@gridname", SqlDbType.VarChar,-1);
                    GRIDNAME.Value = gridName;
                    var ENTITY = new SqlParameter("@entity", SqlDbType.VarChar,-1);
                    ENTITY.Value = entity;
                    var SCHEMA = new SqlParameter("@schema", SqlDbType.VarChar);
                    SCHEMA.Value = schema;

                    command.Parameters.Add(GRIDNAME);
                    command.Parameters.Add(ENTITY);
                    command.Parameters.Add(SCHEMA);

                    SqlDataAdapter da = new SqlDataAdapter(); conn.Open();
                    da.SelectCommand = command;
                    da.Fill(ds);
                    da.Dispose();
                }
            }
            if (ds.Tables[0].Rows.Count > 0)
                return true;
            return false;
        }
        private string getDataSourceParRead(string customPar)
        {
            try
            {

                if (String.IsNullOrEmpty(customPar))
                    return "";
                Dictionary<string, customJSONParamOp> cp = Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<string, customJSONParamOp>>(customPar);
                return cp["read"].Definition;
            }
            catch (Exception ex)
            {
                throw new System.ArgumentException("_DENIED_");
            }

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

            string gridName = data["GridName"].ToString();
            string entityName = data["EntityName"].ToString();
            string customParam = data["DataSourceCustomParam"] != null ? data["DataSourceCustomParam"].ToString() : null;
            string storedProcedure = getDataSourceParRead(customParam);
            if (!existsAutocompleteWithThisConfig(gridName,entityName,storedProcedure))
                throw new System.ArgumentException("_DENIED_");
            if (DBConnectionManager.IsSystemTable(entityName) || 
                (!dbutils.CheckTableOrViewExists(entityName) && !dbutils.CheckProcedureExists(entityName)))
                throw new System.ArgumentException("_DENIED_");
            if (DBConnectionManager.IsMagicTable(entityName) && !SessionHandler.UserIsDeveloper)
                throw new System.ArgumentException("_DENIED_");

        }
    }
}