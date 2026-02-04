using MagicFramework.Helpers;
using Newtonsoft.Json.Linq;
using System;
using System.Data;
using System.Data.SqlClient;
using System.Web.Http.Controllers;
using System.Web.Http.Filters;

namespace MagicFramework.MemberShip.Filters
{

    public class FKSystemObjectFilter : ActionFilterAttribute
    {
        
        private bool existsFKInTargetDefinedDataSources(string entityName, string schema, string valuefield, string textfield) {
            try { 
                string spname = ApplicationSettingsManager.GetTargetAuthDatasourceSP();
                if (String.IsNullOrEmpty(spname))
                    return false;
                DatabaseCommandUtils dbutils = new DatabaseCommandUtils();
                JObject o = JObject.Parse("{}");
            
                DataSet ds = dbutils.GetDataSetFromStoredProcedure(spname, o);
                bool found = false;
                foreach (DataRow dr in ds.Tables[0].Rows)
                {
                    //has to include schema
                    string entityWithSchema = dr.Field<string>("MagicDataSource");
                    string entity = entityWithSchema.Split('.')[1];
                    string schema_ = entityWithSchema.Split('.')[0];
                    string value = dr.Field<string>("MagicDataSourceValueField");
                    string text = dr.Field<string>("MagicDataSourceTextField");
                    string inputSchema = String.IsNullOrEmpty(schema) ? "dbo" : schema;
                    if (entity == entityName && valuefield == value && text == textfield && schema_ == inputSchema)
                    {
                        found = true;
                        break;
                    }
                }
                return found;
            }
            catch (Exception ex) {
                MFLog.LogInFile("FKSystemObjectFilter::existsFKInTargetDefinedDataSources:" + ex.Message,MFLog.logtypes.ERROR);
                return false;
            };

        }
        private bool existsFKInWizardConfig(string entityName, string schema, string valuefield, string textfield)
        {
            string sql = @"SELECT [ID]
                          FROM [dbo].[Magic_Wizards] where [Settings] like  '%' + @param + '%'";

            string param = "\"MagicDataSourceType_ID\":2,\"MagicDataSource\":\"{0}{1}\",\"MagicDataSourceValueField\":\"{2}\",\"MagicDataSourceTextField\":\"{3}\"";


            DataSet ds = new DataSet();
            using (SqlConnection conn = new SqlConnection(DBConnectionManager.GetTargetConnection()))
            {
                using (SqlCommand command = new SqlCommand(sql, conn))
                {
                    var PARAM = new SqlParameter("@param", SqlDbType.VarChar, -1);
                    if (!String.IsNullOrEmpty(schema))
                        schema = schema + ".";
                    PARAM.Value = String.Format(param,schema,entityName,valuefield,textfield);
                    command.Parameters.Add(PARAM);

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
        private bool existsFKWithThisConfig(string entityName,string schema,string valuefield,string textfield)
        {
            string sql = @"select td.MagicTemplateDetailID 
                            from dbo.Magic_TemplateDetails td
                            inner join dbo.Magic_Columns c
                            on c.MagicColumnID = td.DetailInheritsFromColumn_ID
                            left join dbo.Magic_DatasourceType dt
                            on dt.ID = td.MagicDataSourceType_ID
                            where (td.DetailIsVisible = 1 OR c.Columns_IsFilterable = 1) 
                            and (MagicDataSource = @entity OR MagicDataSource = @entity+'ds') and  isnull(MagicDataSourceSchema,'') = @schema
                            and td.MagicDataSourceValueField = @valuefield and td.MagicDataSourceTextField = @textfield  
                            and (dt.Code = 'TAB' OR td.MagicDataSourceType_ID is null)";

            
           
            DataSet ds = new DataSet();
            using (SqlConnection conn = new SqlConnection(DBConnectionManager.GetMagicConnection()))
            {
                using (SqlCommand command = new SqlCommand(sql, conn))
                {
                    var ENTITY = new SqlParameter("@entity", SqlDbType.VarChar,-1);
                    ENTITY.Value = entityName;
                    var SCHEMA = new SqlParameter("@schema", SqlDbType.VarChar);
                    SCHEMA.Value = schema;
                    var VALUEFIELD = new SqlParameter("@valuefield", SqlDbType.VarChar, -1);
                    VALUEFIELD.Value = valuefield;
                    var TEXTFIELD = new SqlParameter("@textfield", SqlDbType.VarChar, -1);
                    TEXTFIELD.Value = textfield;


                    command.Parameters.Add(ENTITY);
                    command.Parameters.Add(SCHEMA);
                    command.Parameters.Add(VALUEFIELD);
                    command.Parameters.Add(TEXTFIELD);


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
        public override void OnActionExecuting(HttpActionContext actionContext)
        {
            var dbutils = new DatabaseCommandUtils();
            // pre-processing, read the payload
            JObject data = JObject.FromObject(actionContext.ActionArguments["data"]);
            string tablename = data["tablename"].ToString();
            string schema = (data["schema"] != null && data["schema"].Type == JTokenType.String) ? data["schema"].ToString() : String.Empty;
            string schemaWithinTable = DatabaseCommandUtils.getUnescapedSchemaFromTableName(tablename);
            if (!String.IsNullOrEmpty(schemaWithinTable))
            {
                schema = schemaWithinTable;
                tablename = DatabaseCommandUtils.getUnescapedTableNameFromTableName(tablename);
            }

            string valuefield = data["valuefield"].ToString();
            string textfield = data["textfield"].ToString();
            bool itExists = String.IsNullOrEmpty(schema) ? dbutils.CheckTableOrViewExists(tablename, true) : dbutils.CheckTableOrViewExists(schema + "." + tablename);
            if (DBConnectionManager.IsSystemTable(tablename) || !itExists)
                throw new System.ArgumentException("NF_DENIED_FK");
            if (DBConnectionManager.IsMagicTable(tablename) && !SessionHandler.UserIsDeveloper)
                throw new System.ArgumentException("MAG_DENIED_FK");
            if (!DBConnectionManager.IsMagicTable(tablename))
            {
                bool existsAsConfiguration = existsFKWithThisConfig(tablename, schema, valuefield, textfield);
                if (!existsAsConfiguration)
                    existsAsConfiguration = existsFKInWizardConfig(tablename, schema, valuefield, textfield);
                if (!existsAsConfiguration)
                    existsAsConfiguration = existsFKInTargetDefinedDataSources(tablename, schema, valuefield, textfield);
                if (!existsAsConfiguration)
                    throw new System.ArgumentException("UND_DENIED_FK");
                
            }
        }


    }

}