using MagicFramework.Models;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Text.RegularExpressions;

namespace MagicFramework.Helpers.Sql
{
    public class MFAPIGetQueries
    {
        private string connectionString;

        public MFAPIGetQueries(string conn)
        {
            connectionString = conn;
        }

        internal Response GetChart(string guid, string id)
        {
            string tableName = "dbo.V_Magic_DashboardCharts";
            Dictionary<string, string> where = new Dictionary<string, string>();

            if (!String.IsNullOrEmpty(guid)) //first check for GUID
            {
                where.Add("guid", guid);
            }
            else if (!String.IsNullOrEmpty(id))
            {
                where.Add("id", id);
            }
            return ExecuteQuery(tableName, where: where);
        }

        internal Response GetSpreadsheetByCode(string Code)
        {
            string tableName = "dbo.Magic_SpreadSheet";
            string order = "Code";
            Dictionary<string, string> where = new Dictionary<string, string>();
            if (!String.IsNullOrEmpty(Code))
            {
                where.Add("Code", Code);
            }
            return ExecuteQuery(tableName, where: where, order: order);
        }

        internal Response GetCustomHtml(string id)
        {
            string tableName = "dbo.Magic_HtmlTemplates";
            Dictionary<string, string> where = new Dictionary<string, string>();

            if (!String.IsNullOrEmpty(id))
            {
                where.Add("id", id);
            }
            return ExecuteQuery(tableName, where: where);
        }

        internal Response GetActionTaskType(string ActivityID)
        {
            string tableName = "dbo.v_Magic_ActTaskType";
            Dictionary<string, string> where = new Dictionary<string, string>();

            if (!String.IsNullOrEmpty(ActivityID))
            {
                where.Add("ActivityID", ActivityID);
            }
            return ExecuteQuery(tableName, where: where);
        }

        internal Response GetDocumentRepository(string BusinessObjectType, string BusinessObject_ID, string TransmissionMode)
        {
            var userGroupVisibilityID = MagicFramework.Helpers.SessionHandler.UserVisibilityGroup;
            var userID = MagicFramework.Helpers.SessionHandler.IdUser;
            string tableName = "dbo.Magic_DocumentRepository";
            Dictionary<string, string> where = new Dictionary<string, string>();
            
            if (!String.IsNullOrEmpty(BusinessObjectType))
            {
                where.Add("BusinessObjectType", BusinessObjectType);
            }
            if (!String.IsNullOrEmpty(BusinessObject_ID))
            {
                where.Add("BusinessObject_ID", BusinessObject_ID);
            }
            if (!String.IsNullOrEmpty(TransmissionMode))
            {
                where.Add("TransmissionMode", TransmissionMode);
            }
            string staticCondition = " AND (UserGroupVisibility_ID="+userGroupVisibilityID+" AND IsPublic=1 OR CreatorUser_ID="+userID+ " AND IsPublic=0)";
            staticCondition += " AND DocumentType_ID is not null";
            return ExecuteQuery(tableName, where: where, order: "InsertionDate DESC", staticCondition: staticCondition);
        }

        internal Response GetSystemMessages(dynamic templateCodes)
        {
            string tableName = "dbo.Magic_SystemMessages";
            string order = "1"; 
            List<KeyValuePair<string, string>> inParams = new List<KeyValuePair<string, string>>();

            foreach (string code in templateCodes)
            {
                inParams.Add(new KeyValuePair<string, string>("Code", code));
            }
            return ExecuteQuery(tableName, order: order, inParams: inParams);
        }

        internal Response GetWorkflowPrecedences(string table, string Workflow_ID)
        {
            string tableName = "dbo.v_Magic_WorkflowPrecedences";
            Dictionary<string, string> where = new Dictionary<string, string>();
            string order = "1";

            if (!String.IsNullOrEmpty(table))
            {
                tableName = table;
            }
            if (!String.IsNullOrEmpty(Workflow_ID))
            {
                where.Add("Workflow_ID", Workflow_ID);
            }
            return ExecuteQuery(tableName, where: where, order: order);
        }

        internal Response GetTempDetails_Culture(string table, string MagicGridName)
        {
            Dictionary<string, string> where = new Dictionary<string, string>();
            string order = "GroupOrdinalPosition, OrdinalPosition";
            if (!String.IsNullOrEmpty(MagicGridName))
            {
                where.Add("MagicGridName", MagicGridName);
            }
   
            where.Add("Detailisvisible", "1");
            where.Add("Magic_CultureID", SessionHandler.UserCulture.ToString());
            return ExecuteQuery(table, where: where, order: order);
        }

        internal Response GetWorkflows()
        {
            string tableName = "dbo.Magic_WorkFlow";
            return ExecuteQuery(tableName, order: "Code");
        }

        internal Response GetDocumentRepositoryType(string Description)
        {
            string tableName = "dbo.Magic_DocumentRepositoryType";
            Dictionary<string, string> where = new Dictionary<string, string>();
            if (!String.IsNullOrEmpty(Description))
            {
                where.Add("Description", Description);
            }
            return ExecuteQuery(tableName, where: where, order: "Description");
        }

        internal Response GetBusinessObjectTypes(dynamic IDs)
        {
            string tableName = "dbo.v_Magic_BusinessObjectTypes";
            string order = "Description";
            Dictionary<string, string> where = new Dictionary<string, string>();
            List<KeyValuePair<string, string>> inParams = new List<KeyValuePair<string, string>>();
            
            foreach (string id in IDs)
            {
                inParams.Add(new KeyValuePair<string, string>("ID", id));
            }
            
            where.Add("Active", "1");
            where.Add("VisibleForBOSelector", "1");
            return ExecuteQuery(tableName, order:order, inParams: inParams);
        }

        internal Response GetVersionLogsExceptForThisYear(string Anno)
        {
            string tableName = "dbo.v_Magic_VersionLog_Years";
            string alternativeView = ApplicationSettingsManager.GetVersionLogYearsAlternativeView();
            if (!String.IsNullOrEmpty(alternativeView))
                tableName = alternativeView;

            string order = "Anno desc";
            string op = "!=";
            Dictionary<string, string> where = new Dictionary<string, string>();

            if (!String.IsNullOrEmpty(Anno))
            {
                where.Add("Anno", Anno);
            }
            return ExecuteQuery(tableName, where: where, order: order, op: op);
        }

        internal Response GetWizard(string Code)
        {
            string tableName = "dbo.Magic_Wizards";
            Dictionary<string, string> where = new Dictionary<string, string>();
            if (!String.IsNullOrEmpty(Code))
            {
                where.Add("Code", Code);
            }
            return ExecuteQuery(tableName, where: where);
        }

        internal Response GetColumns(string MagicGrid_ID)
        {
            string tableName = "dbo.Magic_Columns";
            Dictionary<string, string> where = new Dictionary<string, string>();
            if (!String.IsNullOrEmpty(MagicGrid_ID))
            {
                where.Add("MagicGrid_ID", MagicGrid_ID);
            }
            return ExecuteQuery(tableName, where: where);
        }

        internal Response GetDocumentRepositoryTags(string Name)
        {
            string tableName = "dbo.Magic_DocumentRepositoryTags";
            string op = "LIKE";
            Name = "%" + Name + "%";
            Dictionary<string, string> where = new Dictionary<string, string>();
            if (!String.IsNullOrEmpty(Name))
            {
                where.Add("Name", Name);
            }
            return ExecuteQuery(tableName, where: where, op: op);
        }

        internal Response GetPivots(dynamic Codes)
        {
            string tableName = "dbo.Magic_Pivot";
            List<KeyValuePair<string, string>> inParams = new List<KeyValuePair<string, string>>(); 
            foreach (string code in Codes) {
                inParams.Add(new KeyValuePair<string, string>("Code", code));                
            }
            return ExecuteQuery(tableName, inParams: inParams);
        }

        internal Response GetTemplateDataRoles()
        {
            string tableName = "dbo.Magic_TemplateDataRoles";
            return ExecuteQuery(tableName, order: "MagicTemplateDataRole");
        }

        internal Response GetCalendarTaskTypes()
        {
            string tableName = "dbo.Magic_Calendar_TaskTypes";
            return ExecuteQuery(tableName, order: "Description");
        }

        internal Response GetCalendarTask_v(string taskId)
        {
            string tableName = "dbo.v_Magic_Calendar";
            Dictionary<string, string> where = new Dictionary<string, string>();
            if (!String.IsNullOrEmpty(taskId))
            {
                where.Add("taskId", taskId);
            }
            return ExecuteQuery(tableName, where: where);
        }

        internal Response GetCalendarTask(string taskId)
        {
            string tableName = "dbo.Magic_Calendar";
            Dictionary<string, string> where = new Dictionary<string, string>();
            if (!String.IsNullOrEmpty(taskId))
            {
                where.Add("taskId", taskId);
            }
            return ExecuteQuery(tableName, where: where);
        }

        internal Response GetDashboardContentType()
        {
            string tableName = "dbo.Magic_DashBoardContentType";
            return ExecuteQuery(tableName, order: "Code");
        }

        internal Response GetUserColumnDataTypes(string OnlyForDeveloper)
        {
            string tableName = "USERFIELDS.Magic_UserColumnDataTypes";
            Dictionary<string, string> where = new Dictionary<string, string>();
            if (!String.IsNullOrEmpty(OnlyForDeveloper) && OnlyForDeveloper != "true")
            {
                where.Add("OnlyForDeveloper", OnlyForDeveloper);
            }
            return ExecuteQuery(tableName, where: where, order: "ID");
        }

        internal Response GetUserVirtualTables()
        {
            string tableName = "USERFIELDS.Magic_UserVirtualTables";
            return ExecuteQuery(tableName, order: "ID");
        }

        internal Response GetBOTypeGridUserTabs(string BOType_ID)
        {
            string tableName = "USERFIELDS.Magic_BOTypeGridUserTabs";
            Dictionary<string, string> where = new Dictionary<string, string>();
            if (!String.IsNullOrEmpty(BOType_ID))
            {
                where.Add("BOType_ID", BOType_ID);
            }
            return ExecuteQuery(tableName, where: where, order: "iOrder");
        }

        internal Response GetIndicator(string id, string code)
        {
            string tableName = "dbo.Magic_DashBoardIndicators";
            Dictionary<string, string> where = new Dictionary<string, string>();


            if (!String.IsNullOrEmpty(code)) //first check code
            {
                where.Add("code", code);
            }
            else 
            if (!String.IsNullOrEmpty(id))
            {
                where.Add("id", id);
            }
            
            return ExecuteQuery(tableName, where: where);
        }

        internal Response GetImportableGrids()
        {
            string tableName = "DEPLOY.DEP_Magic_Grids";
            return ExecuteQuery(tableName, order: "MagicGridID desc");
        }

        internal Response GetVersionDBs(string AppInstance, string Year) //#specialcase
        {
            string tableName = "dbo.v_Magic_VersionDB";
            string versionLogAlternativeView = ApplicationSettingsManager.GetVersionLogAlternativeView();
            if (!String.IsNullOrEmpty(versionLogAlternativeView))
                tableName = versionLogAlternativeView;

            string sqlCommand = "SELECT * FROM " + tableName;
            string where = "WHERE ";
            string order = "ORDER BY version desc, iOrder asc,id asc";
            if (!String.IsNullOrEmpty(AppInstance))
            {
                AppInstance = "%" + AppInstance + "%";
                where += "(([AppInstance] is null or [AppInstance] like @AppInstance) and [Year]=@year)";
            }
            else
            {
                where += "([AppInstance] is null and [Year] = @year)";
            }

            sqlCommand += " " + where + " " + order;
            DataTable table = new DataTable();
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                using (SqlCommand cmd = new SqlCommand(sqlCommand, conn))
                {
                    if (!String.IsNullOrEmpty(AppInstance))
                    {
                        cmd.Parameters.AddWithValue("@AppInstance", AppInstance);
                        cmd.Parameters.AddWithValue("@year", Year);
                    }
                    else
                    {
                        cmd.Parameters.AddWithValue("@year", Year);
                    }
                    cmd.Connection.Open();
                    table.Load(cmd.ExecuteReader());
                    cmd.Connection.Close();
                }
            }
            var result = table.AsEnumerable().ToArray();
            if (result.Length > 0)
                result = result.Take(1).ToArray();
            return new Models.Response(result, result.Length);
        }
        public Response ExecuteQuery(string tableName, Dictionary<string, string> where = null, string order = null, string op = null, List<KeyValuePair<string, string>> inParams = null, string staticCondition = null)
        {
            bool whereKeyWordAlreadyWritten = false;
            DataTable table = new DataTable();
            string sqlCommand = "SELECT * FROM " + tableName;

            if(inParams != null && inParams.Count>0)
            {
                sqlCommand += GetParamaterizedWhereInCondition(inParams);
                whereKeyWordAlreadyWritten = true;
            }

            if(where != null && where.Count>0)
            {
                sqlCommand += GetParamaterizedWhereCondition(where, whereKeyWordAlreadyWritten);
            }
            if(op != null)
            {
                sqlCommand = GetOperatorQuery(sqlCommand, op);
            }            
            if (staticCondition != null)
            {
                sqlCommand += staticCondition;
            }
            if (order != null)
            {
                sqlCommand += GetOrderCondition(order);
            }
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                using (SqlCommand cmd = new SqlCommand(sqlCommand, conn))
                {
                    if(where != null)
                    {
                        AddWhereParamsToQuery(where, cmd);
                    }
                    if (inParams != null)
                    {
                        AddWhereInParamsToQuery(inParams, cmd);
                    }
                    
                    cmd.Connection.Open();
                    table.Load(cmd.ExecuteReader());
                    cmd.Connection.Close();
                }
            }
            var result = table.AsEnumerable().ToArray();
            if (result.Length > 0)
                result = result.Take(1).ToArray();
            return new Models.Response(result, result.Length);
        }

        private void AddWhereParamsToQuery(Dictionary<string, string> where, SqlCommand query)
        {
            foreach (KeyValuePair<string, string> param in where)
            {
                query.Parameters.AddWithValue("@" + param.Key, param.Value);
            }
        }

        private void AddWhereInParamsToQuery(List<KeyValuePair<string, string>> inParams, SqlCommand query)
        {
            int i = 0;
            foreach (KeyValuePair<string, string> param in inParams)
            {
                query.Parameters.AddWithValue("@"+ param.Key + i, param.Value);
                i++;
            }
        }
        
        private string GetParamaterizedWhereCondition(Dictionary<string, string> whereParams, bool whereAlreadyWritten)
        {
            string where;
            int i = 0;
            if (!whereAlreadyWritten)
            {
                where = " WHERE ";
            }
            else 
            {
                where = " AND ";
            }
            foreach (KeyValuePair<string, string> param in whereParams)
            {
                where += param.Key + " = @" + param.Key;
                if (whereParams.Count > 1 && i < (whereParams.Count - 1))
                {
                    where += " AND ";
                }
                i++;
            }
            return where;
        }

        private string GetParamaterizedWhereInCondition(List<KeyValuePair<string, string>> inParams)
        {
            int i = 0;
            string whereIn = " WHERE " + inParams.First().Key+" IN (";
            foreach (KeyValuePair<string,string> param in inParams)
            {
                whereIn += " @" + param.Key + i;
                if (inParams.Count > 1 && i < (inParams.Count - 1))
                {
                    whereIn += ", ";
                }
                i++;
            }
            whereIn += ")";
            return whereIn;
        }

        private string GetOperatorQuery(string input, string op)
        {
            return Regex.Replace(input, @"=+", " "+op+" ");
        }

        private string GetOrderCondition(string order)
        {
            return " ORDER BY " + order;
        }
    }
}