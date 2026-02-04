using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Dynamic;
using System.Linq;
using System.Web;
using MagicFramework.Helpers;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;
using static MagicFramework.Helpers.RequestParser;

namespace MagicFramework.Models
{

    public class Magic_Grids
    {

        public int MagicGridID { get; set; }
        public int? MagicDataSource_ID { get; set; }
        public string MagicGridName { get; set; }
        public string MagicGridEntity { get; set; }
        public string MagicGridModel { get; set; }
        public string MagicGridColumns { get; set; }
        public string MagicGridTransport { get; set; }
        public string MagicGridColumnsCommand { get; set; }
        public string Sortable { get; set; }
        public string Groupable { get; set; }
        public string Editable { get; set; }
        public bool? Exportable { get; set; }
        public string Toolbar { get; set; }
        public string DetailTemplate { get; set; }
        public string DetailInitJSFunction { get; set; }
        public string EditJSFunction { get; set; }
        public string EditableTemplate { get; set; }
        public string FromTable { get; set; }
        public string FromClass { get; set; }
        public int EditFormColumnNum { get; set; }
        public string Selectable { get; set; }
        public int PageSize { get; set; }
        public bool FullExport { get; set; }
        public string MagicGridExtension { get; set; }

        public Magic_Grids(MagicFramework.Data.Magic_Grids A)
        {
            this.MagicGridID = A.MagicGridID;
            this.MagicDataSource_ID = (int)(A.MagicDataSource_ID ?? 0);
            this.MagicGridName = A.MagicGridName;
            this.MagicGridEntity = A.MagicGridEntity;
            this.MagicGridModel = A.MagicGridModel;
            this.MagicGridColumns = A.MagicGridColumns;
            this.MagicGridTransport = A.MagicGridTransport;
            this.MagicGridColumnsCommand = A.MagicGridColumnsCommand;
            this.Sortable = A.Sortable;
            this.Groupable = A.Groupable;
            this.Editable = A.Editable;
            this.Exportable = A.Exportable;
            this.Toolbar = A.Toolbar;
            this.DetailTemplate = A.DetailTemplate;
            this.DetailInitJSFunction = A.DetailInitJSFunction;
            this.EditJSFunction = A.EditJSFunction;
            this.EditableTemplate = A.EditableTemplate;
            this.FromTable = A.FromTable;
            this.FromClass = A.FromClass;
            this.EditFormColumnNum = A.EditFormColumnNum ?? 1;
            this.Selectable = A.Selectable;
            this.PageSize = A.PageSize;
            this.FullExport = A.FullExport ?? false;
            this.MagicGridExtension = A.MagicGridExtension;
        }

        public static int GetIDFromGUID(string GUID)
        {
            Guid g = new Guid(GUID);
            Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
            return context.Magic_Grids.Where(f => f.GUID == g).FirstOrDefault().MagicGridID;
        }
        public static string GetGridNameFromID(int ID)
        {
            Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
            return context.Magic_Grids.Where(f => f.MagicGridID == ID).FirstOrDefault().MagicGridName;
        }
        public static Guid? GetGUIDFromID(int ID)
        {
            Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
            return context.Magic_Grids.Where(f => f.MagicGridID == ID).FirstOrDefault().GUID;
        }
        public static int GetIDFromName(string Name)
        {
            Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
            return context.Magic_Grids.Where(f => f.MagicGridName == Name).FirstOrDefault().MagicGridID;
        }
        public static Guid? GetGUIDFromGridName(string gridName)
        {
            Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
            return context.Magic_Grids.Where(f => f.MagicGridName == gridName).FirstOrDefault().GUID;
        }
        /// <summary>
        /// adds user fields and creates new property ReplacementOf in case masterGridName has a value
        /// </summary>
        /// <param name="gridName">The requested grid</param>
        /// <param name="gridObj">the configguration</param>
        /// <param name="masterGridName">optional parameter which contains the name of the master grid base on layers</param>
        /// <returns></returns>
        public static string AddGridUserFields(string gridName, dynamic gridObj,string masterGridName = null)
        {
            try
            {
                var dbutils = new DatabaseCommandUtils();
                dynamic data = new ExpandoObject();
                data.gridName = gridName;
            
                string storedName = MFConfiguration.GetApplicationInstanceConfiguration().GridUserFieldsStored ?? "USERFIELDS.Magic_GetGridUserColumns";
                DataSet ds = dbutils.GetDataSetFromStoredProcedure(storedName, data);
                dynamic userFields = new ExpandoObject();
                if (ds.Tables[0].Rows.Count > 0)
                {
                    HashSet<string> dataroles = new HashSet<string>();
                    userFields.fields = Utils.NewtonsoftRecursiveMerge(
                        (JObject)Newtonsoft.Json.JsonConvert.DeserializeObject(ds.Tables[0].Rows[0]["GridExtension"].ToString()),
                        (JObject)Newtonsoft.Json.JsonConvert.DeserializeObject(ds.Tables[0].Rows[0]["DeveloperGridExtension"].ToString())
                    );
                    foreach (var k in userFields.fields)
                    {
                        dataroles.Add(k.Value["dataRole"].ToString());
                    }
                    var dataRoleHtmlContents = new TemplateContainerBuilder(true).GetTemplateListContent(dataroles.ToList());
                    userFields.dataRolesHtml = JObject.FromObject(dataRoleHtmlContents);
                }
                //Look up for CFG field containers  (set by developers)
                if (ds.Tables.Count > 1)
                {
                    if (ds.Tables[1].Rows.Count > 0)
                    {
                        //field - container
                        foreach (System.Data.DataRow r in ds.Tables[1].Rows)
                            userFields.fields[r["field"].ToString()].containerColumn = r["container"].ToString();
                    }
                }

                gridObj.userFields = JObject.FromObject(userFields);
                //get the overwrites from The target database 
                string columnOverwrites = Magic_Grids.GetColumnsOverwriteConfiguration(gridName);
                if (!String.IsNullOrEmpty(columnOverwrites))
                    gridObj.overwrittenColumns = columnOverwrites;

                if (!String.IsNullOrEmpty(masterGridName))
                    gridObj.MasterGridName = masterGridName;


                return Newtonsoft.Json.JsonConvert.SerializeObject(gridObj);
            }
            catch (Exception ex)
            {
                MFLog.LogInFile("USERFIELDS LOAD ERROR:" + ex.Message, MFLog.logtypes.ERROR);
                return Newtonsoft.Json.JsonConvert.SerializeObject(gridObj);
            }
        }
        public static bool GetGridHasLayer(string gridName, int layerid)
        {
            //look at cache 
            string cachekey = MagicFramework.Helpers.CacheHandler.LayerGrids;

            if (HttpContext.Current.Cache[cachekey] == null)
            {
                var dbutils = new DatabaseCommandUtils();
                //grids with layers
                DataSet ds = dbutils.GetDataSet(@"SELECT DISTINCT mg.MagicGridName ,mc.Layer_ID
                                            FROM dbo.Magic_Grids mg 
                                            INNER JOIN dbo.Magic_Columns mc
                                            ON mc.MagicGrid_ID = mg.MagicGridID
                                            INNER JOIN dbo.Magic_ApplicationLayers mal ON mal.LayerID = mc.Layer_ID
                                            INNER JOIN dbo.Magic_AppLayersTypes malt ON malt.ID = mal.LayerType_ID
                                            WHERE mc.Layer_ID IS not NULL AND malt.Code = 'RELDATA'", DBConnectionManager.GetMagicConnection());

                Dictionary<int, List<string>> dict = new Dictionary<int, List<string>>();
                if (ds.Tables.Count > 0)
                {
                    foreach (DataRow dr in ds.Tables[0].Rows)
                    {
                        if (!dict.ContainsKey(int.Parse(dr["Layer_ID"].ToString())))
                            dict.Add(int.Parse(dr["Layer_ID"].ToString()), new List<string>());
                        dict[int.Parse(dr["Layer_ID"].ToString())].Add(dr["MagicGridName"].ToString());
                    }
                }
                HttpContext.Current.Cache.Insert(cachekey, dict);
            }
            Dictionary<int, List<string>> allLayers = HttpContext.Current.Cache[cachekey] as Dictionary<int, List<string>>;
            if (allLayers.ContainsKey(layerid))
            {
                List<string> gridForLayer = allLayers[layerid];
                if (gridForLayer.Contains(gridName))
                    return true;
            }
            return false;

        }
        public static void DeleteTemplateScritpsBuffersOnChangeTemplateGroup(int templateGroupId)
        {
            List<int> grids = new List<int>();
            Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
            var template = (from e in context.Magic_TemplateGroups where e.MagicTemplateGroupID == templateGroupId select e.Magic_Templates).FirstOrDefault();
            if (template != null)
                grids = (from e in context.Magic_Grids where e.EditableTemplate == template.MagicTemplateName || e.DetailTemplate == template.MagicTemplateName select e.MagicGridID).ToList();
            foreach (var gridid in grids)
            {
                var grid = context.Magic_Grids.Where(f => f.MagicGridID == gridid).FirstOrDefault();
                if (grid != null)
                {
                    var templatemodified = (from e in context.Magic_TemplateScriptsBuffer where e.Magic_Templates.MagicTemplateName == grid.EditableTemplate || e.Magic_Templates.MagicTemplateName == grid.DetailTemplate select e).ToList();
                    context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(templatemodified);
                }
            }
            context.SubmitChanges();
        }
        public static void DeleteTemplateScritpsBuffersOnChangeTabGroup(int templateTabGroupId)
        {
            Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
            var templategroup = (from e in context.Magic_TemplateGroups where e.MagicTemplateTabGroup_ID == templateTabGroupId select e).FirstOrDefault();
            if (templategroup != null)
            {
                var grids = (from e in context.Magic_Grids where e.EditableTemplate == templategroup.Magic_Templates.MagicTemplateName || e.DetailTemplate == templategroup.Magic_Templates.MagicTemplateName select e.MagicGridID).ToList();
                foreach (var gridid in grids)
                {
                    var grid = context.Magic_Grids.Where(f => f.MagicGridID == gridid).FirstOrDefault();
                    if (grid != null)
                    {
                        var templatemodified = (from e in context.Magic_TemplateScriptsBuffer where e.Magic_Templates.MagicTemplateName == grid.EditableTemplate || e.Magic_Templates.MagicTemplateName == grid.DetailTemplate select e).ToList();
                        context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(templatemodified);
                    }
                }
                context.SubmitChanges();
            }
        }
        public static void DeleteScriptBuffers(int id)
        {
            Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
            var grid = context.Magic_Grids.Where(f => f.MagicGridID == id).FirstOrDefault();
            if (grid != null)
            {
                context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(grid.Magic_TemplateScriptsBuffer);
                context.SubmitChanges();
            }
        }
        public static void DeleteTemplatesScriptBuffers(int id)
        {
            Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
            var grid = context.Magic_Grids.Where(f => f.MagicGridID == id).FirstOrDefault();
            if (grid != null)
            {
                var templatemodified = (from e in context.Magic_TemplateScriptsBuffer where e.Magic_Templates.MagicTemplateName == grid.EditableTemplate || e.Magic_Templates.MagicTemplateName == grid.DetailTemplate select e).ToList();
                context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(templatemodified);
                context.SubmitChanges();
            }
        }
        /// <summary>
        /// Returns the alternative gridname for the given master grid in the layer of the current application. 
        /// </summary>
        /// <param name="gridName"></param>
        /// <returns></returns>
        public static string GetMasterGridForApplication(string gridName) {
            DataTable dt = GetMasterGridForApplicationInstanceNameAndAltGridName(gridName);
            if (dt.Rows.Count == 0)
                return gridName;
            DataRow dr = dt.Rows[0];
            return dr.Field<string>("MagicGridName");

        }
        /// <summary>
        /// used to display the app names while refreshing a grid
        /// </summary>
        /// <param name="gridName">the grid to search as "alternative" for the app names</param>
        /// <returns>list of magic application instance names configured</returns>
        public static List<string> GetApplicationsAndLayersForAlternativeGrid(string gridName) {
            string appInstance = ApplicationSettingsManager.GetAppInstanceName();
            DataSet ds = new DataSet();
            List<string> appNames = new List<string>();
            string sqlCommand = @"SELECT alt.* from Magic_GridsAltLayers galt
                                inner join dbo.Magic_grids g
                                on g.MagicGridID = galt.MasterGrid_ID
                                inner join dbo.Magic_Grids g2
                                on g2.MagicGridID = galt.MagicGrid_ID
                                inner join Magic_AppNamesAltLayers alt
                                on alt.Layer_ID = galt.Layer_ID 
		                        WHERE g2.MagicGridName = @gridName;";
            using (SqlConnection conn = new SqlConnection(DBConnectionManager.GetMagicConnection()))
            {
                using (SqlCommand cmd = new SqlCommand(sqlCommand, conn))
                {
                    cmd.Parameters.Add("@gridName", SqlDbType.VarChar).Value = gridName;
                    SqlDataAdapter da = new SqlDataAdapter();
                    conn.Open();
                    da.SelectCommand = cmd;
                    da.Fill(ds);
                    da.Dispose();
                }
            }

            foreach (DataRow dr in ds.Tables[0].Rows)
            {
                appNames.Add(dr.Field<string>("ApplicationInstanceName"));
            }

            return appNames;
        }
        /// <summary>
        /// Returns the alternative gridname for the given master grid in the layer of the current application. 
        /// </summary>
        /// <param name="gridName"></param>
        /// <returns></returns>
        public static string GetAltenativeGridForApplication(string gridName)
        {
            DataTable dt = GetAltLayerGridForApplicationInstanceNameAndMasterGridName(gridName);
            if (dt.Rows.Count == 0)
                return null;
            DataRow dr = dt.Rows[0];
            return dr.Field<string>("MagicGridName");

        }
        
        private static DataTable GetMasterGridForApplicationInstanceNameAndAltGridName(string gridName)
        {
            string appInstance = ApplicationSettingsManager.GetAppInstanceName();
            DataSet ds = new DataSet();
            string sqlCommand = @"SELECT g.* from Magic_GridsAltLayers galt
                                inner join dbo.Magic_grids g
                                on g.MagicGridID = galt.MasterGrid_ID
                                inner join dbo.Magic_Grids g2
                                on g2.MagicGridID = galt.MagicGrid_ID
                                inner join Magic_AppNamesAltLayers alt
                                on alt.Layer_ID = galt.Layer_ID 
		                        WHERE g.MagicGridName = @gridName and alt.ApplicationInstanceName = @appName and galt.Active = 1 and alt.Active = 1;";
            using (SqlConnection conn = new SqlConnection(DBConnectionManager.GetMagicConnection()))
            {
                using (SqlCommand cmd = new SqlCommand(sqlCommand, conn))
                {
                    cmd.Parameters.Add("@gridName", SqlDbType.VarChar).Value = gridName;
                    cmd.Parameters.Add("@appName", SqlDbType.VarChar).Value = appInstance;
                    SqlDataAdapter da = new SqlDataAdapter();
                    conn.Open();
                    da.SelectCommand = cmd;
                    da.Fill(ds);
                    da.Dispose();
                }
            }

            return ds.Tables[0];
        }
        private static DataTable GetAltLayerGridForApplicationInstanceNameAndMasterGridName(string gridName) {
            string appInstance = ApplicationSettingsManager.GetAppInstanceName();
            DataSet ds = new DataSet();
            string sqlCommand = @"SELECT g2.* from Magic_GridsAltLayers galt
                                inner join dbo.Magic_grids g
                                on g.MagicGridID = galt.MasterGrid_ID
                                inner join dbo.Magic_Grids g2
                                on g2.MagicGridID = galt.MagicGrid_ID
                                inner join Magic_AppNamesAltLayers alt
                                on alt.Layer_ID = galt.Layer_ID 
		                        WHERE g.MagicGridName = @gridName and alt.ApplicationInstanceName = @appName and galt.Active = 1 and alt.Active = 1;";
            using (SqlConnection conn = new SqlConnection(DBConnectionManager.GetMagicConnection()))
            {
                using (SqlCommand cmd = new SqlCommand(sqlCommand, conn))
                {
                    cmd.Parameters.Add("@gridName", SqlDbType.VarChar).Value = gridName;
                    cmd.Parameters.Add("@appName", SqlDbType.VarChar).Value = appInstance;
                    SqlDataAdapter da = new SqlDataAdapter();
                    conn.Open();
                    da.SelectCommand = cmd;
                    da.Fill(ds);
                    da.Dispose();
                }
            }

            return ds.Tables[0];
        }
        public static void InsertRefreshHistory(int gridId,string targetDB,string targetAppInstanceName)
        {
            string sqlCommand = @"INSERT INTO Magic_GridsRefreshHistory(ModifiedUser_ID,TargetDBName,MagicGrid_ID,ApplicationInstanceName,ModifiedUsername) VALUES (@userid,@targetdb,@gridid,@appname,@username);";
            using (SqlConnection conn = new SqlConnection(DBConnectionManager.GetMagicConnection()))
            {
                using (SqlCommand cmd = new SqlCommand(sqlCommand, conn))
                {
                    cmd.Parameters.Add("@gridid", SqlDbType.Int).Value = gridId;
                    cmd.Parameters.Add("@appname", SqlDbType.VarChar).Value = targetAppInstanceName;
                    cmd.Parameters.Add("@userid", SqlDbType.Int).Value = SessionHandler.IdUser;
                    cmd.Parameters.Add("@targetdb", SqlDbType.VarChar).Value = targetDB;
                    cmd.Parameters.Add("@username", SqlDbType.VarChar).Value = SessionHandler.Username;

                    conn.Open();
                    cmd.ExecuteNonQuery();
                }
            }

            return;
        }
        #region editpages
        public static DataRow GetEditPage(string code)
        {
            //grids with layers
            DataSet ds = new DataSet();
            string sqlCommand = @"SELECT ep.*,g.MagicGridName, g.GUID as MagicGridGUID
		                        FROM dbo.Magic_EditPages ep
                                inner join dbo.Magic_grids g
                                on g.MagicGridID = ep.MagicGrid_ID
		                        WHERE [code] = @code";
            using (SqlConnection conn = new SqlConnection(DBConnectionManager.GetMagicConnection()))
            {
                using (SqlCommand cmd = new SqlCommand(sqlCommand, conn))
                {
                    cmd.Parameters.Add("@code", SqlDbType.VarChar).Value = code;
                    SqlDataAdapter da = new SqlDataAdapter();
                    conn.Open();
                    da.SelectCommand = cmd;
                    da.Fill(ds);
                    da.Dispose();
                }
            }

            DataRow dr = ds.Tables[0].Rows[0];
            return dr;
        }

        #endregion

        #region editforms
        public static DataTable GetEditFormData(string magicgridname)
        {
            DataSet ds = new DataSet();
            
            string sqlCmd = @"SELECT *
                                FROM [dbo].[Magic_Columns] 
                                INNER JOIN [dbo].[Magic_Grids] ON [MagicGridID]=[MagicGrid_ID]
                                WHERE [MagicGridName] = @magicgridname";

            using (SqlConnection conn = new SqlConnection(DBConnectionManager.GetMagicConnection()))
            {
                using (SqlCommand cmd = new SqlCommand(sqlCmd, conn))
                {
                    cmd.Parameters.Add("@magicgridname", SqlDbType.VarChar).Value = magicgridname;
                    SqlDataAdapter da = new SqlDataAdapter();
                    conn.Open();
                    da.SelectCommand = cmd;
                    da.Fill(ds);
                    da.Dispose();
                }
            }
            DataTable dt = ds.Tables[0];
            return dt;
        }
        public static DataTable GetGridLayoutData(int magicGridId)
        {
            DataSet ds = new DataSet();

            string sqlCmd = "SELECT * FROM [dbo].[v_Magic_Grids] WHERE [MagicGridID] = @magicgridid";

            using (SqlConnection conn = new SqlConnection(DBConnectionManager.GetMagicConnection()))
            {
                using (SqlCommand cmd = new SqlCommand(sqlCmd, conn))
                {
                    cmd.Parameters.Add("@magicgridid", SqlDbType.Int).Value = magicGridId;
                    SqlDataAdapter da = new SqlDataAdapter();
                    conn.Open();
                    da.SelectCommand = cmd;
                    da.Fill(ds);
                    da.Dispose();
                }
            }
            DataTable dt = ds.Tables[0];
            return dt;
        }

        public static int UpdateEditFormData(int magicgridid, string fieldname, string magicformextension)
        {            
            string sqlCmd = @"UPDATE [dbo].[Magic_Columns] SET [MagicFormExtension] = @mfextension WHERE [MagicGrid_ID] = @magicgridid AND [ColumnName] = @fieldname";

            using (SqlConnection conn = new SqlConnection(DBConnectionManager.GetMagicConnection()))
            {
                using (SqlCommand cmd = new SqlCommand(sqlCmd, conn))
                {
                    cmd.Parameters.Add("@magicgridid", SqlDbType.Int).Value = magicgridid;
                    cmd.Parameters.Add("@mfextension", SqlDbType.VarChar).Value = magicformextension;
                    cmd.Parameters.Add("@fieldname", SqlDbType.VarChar).Value = fieldname;
                    conn.Open();
                    cmd.ExecuteNonQuery();
                    conn.Close();
                }
            }
            return 1;
        }

        public static int InsertColumnsOverwriteConfiguration(string gridname, string overwriteConfiguration, int isActive, int userID) {
            string tableName = "[dbo].Magic_GridColumnOverwrites";
            string sqlCmd = @"INSERT INTO " + tableName
                                + " ([MagicGridName],[ColumnsConfiguration],[IsActive],[ModifiedUser_ID])"
                                + " VALUES (@magicgridname , @configuration, @active, @modfied_user_id)";

            using (SqlConnection conn = new SqlConnection(DBConnectionManager.GetTargetConnection()))
            {
                using (SqlCommand cmd = new SqlCommand(sqlCmd, conn))
                {
                    cmd.Parameters.Add("@magicgridname", SqlDbType.VarChar).Value =  gridname;
                    cmd.Parameters.Add("@configuration", SqlDbType.VarChar).Value = overwriteConfiguration;
                    cmd.Parameters.Add("@active", SqlDbType.Int).Value = isActive;
                    cmd.Parameters.Add("@modfied_user_id", SqlDbType.VarChar).Value = userID;
                    conn.Open();
                    cmd.ExecuteNonQuery();
                    conn.Close();
                }
            }

            return 1;
        }
        public static int UpdateColumnsOverwriteConfiguration(string gridname, string overwriteConfiguration, int isActive, int userID)
        {
            string tableName = "[dbo].Magic_GridColumnOverwrites";
            string sqlCmd = @"UPDATE " + tableName
                                + " SET [ColumnsConfiguration] = @configuration"
                                + " ,[IsActive] = @active"
                                + " ,[ModifiedUser_ID] = @modfied_user_id"
                                + " WHERE [MagicGridName] = @magicgridname";
            //WHERE gridname
            using (SqlConnection conn = new SqlConnection(DBConnectionManager.GetTargetConnection()))
            {
                using (SqlCommand cmd = new SqlCommand(sqlCmd, conn))
                {
                    cmd.Parameters.Add("@magicgridname", SqlDbType.VarChar).Value = gridname;
                    cmd.Parameters.Add("@configuration", SqlDbType.VarChar).Value = overwriteConfiguration;
                    cmd.Parameters.Add("@active", SqlDbType.Int).Value = isActive;
                    cmd.Parameters.Add("@modfied_user_id", SqlDbType.Int).Value = userID;
                    conn.Open();
                    cmd.ExecuteNonQuery();
                    conn.Close();
                }
            }
            return 1;
        }

        public static DataTable GetColumnsOverwriteConfigurations()
        {
            DataSet ds = new DataSet();
            string tableName = "[dbo].Magic_GridColumnOverwrites";
            string sqlCmd = "SELECT [dbo].[Magic_Grids].MagicGridID," + tableName+".* FROM " + tableName + " LEFT JOIN [dbo].[Magic_Grids] ON [dbo].[Magic_Grids].MagicGridName = "+tableName+".MagicGridName";

            using (SqlConnection conn = new SqlConnection(DBConnectionManager.GetTargetConnection()))
            {
                using (SqlCommand cmd = new SqlCommand(sqlCmd, conn))
                {
                    SqlDataAdapter da = new SqlDataAdapter();
                    conn.Open();
                    da.SelectCommand = cmd;
                    da.Fill(ds);
                    da.Dispose();
                }
            }
            DataTable dt = ds.Tables[0];
            return dt;
        }
        public static string GetColumnsOverwriteConfiguration(string gridname)
        {
            string tableName = "[dbo].Magic_GridColumnOverwrites";
            string sqlCmd = "SELECT ColumnsConfiguration FROM " + tableName + " WHERE MagicGridName = @gridname AND IsActive = 1";
            string configuration = String.Empty;
            using (SqlConnection conn = new SqlConnection(DBConnectionManager.GetTargetConnection()))
            {
                using (SqlCommand cmd = new SqlCommand(sqlCmd, conn))
                {
                    cmd.Parameters.Add("@gridname", SqlDbType.VarChar).Value = gridname;
                    
                    conn.Open();
                    var objRes = cmd.ExecuteScalar();
                    configuration = objRes == null ? String.Empty : objRes.ToString();
                    
                }
            }
            return configuration;
        }
        #endregion

        #region Magic Grid Builder
        /// <summary>
        /// sets the value of layer id while creating the grid cols and models 
        /// </summary>
        /// <returns></returns>
        internal static int setLayerId(string gridname, dynamic data)
        {
            int? layerid = 0;
            if (data.layerid != null)
                layerid = data.layerid;
            if (ApplicationSettingsManager.GetApplicationLayerId() != null)
                layerid = ApplicationSettingsManager.GetApplicationLayerId();
            if (GetGridHasLayer(gridname, (int)layerid))
                return (int)layerid;
            else
                return 0;
        }

        internal static string BuildGridCommands(string gridname, int? functionid, string position)
        {
            Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
            var commands = (from e in _context.Magic_GridsCommands where e.Magic_Grids.MagicGridName == gridname && e.Magic_GridsCmdLocations.LocationType == position select e);
            var specificFunctionCommands = commands.Where(x => x.MagicFunction_ID == functionid);

            if (specificFunctionCommands.Count() == 0)
                commands = commands.Where(x => x.MagicFunction_ID == null);
            else
                commands = specificFunctionCommands;

            var commandList = new List<string>();
            foreach (var command in commands.OrderBy(l => (l.Magic_GridsCmdGroups != null) ? l.Magic_GridsCmdGroups.OrdinalPosition : l.OrdinalPosition).ThenBy(l => l.OrdinalPosition))
            {
                dynamic data = new System.Dynamic.ExpandoObject();
                data.text = command.Text;
                data.jsonpayload = command.JSONPayload;
                data.storedprocedure = command.StoredProcedure;
                data.classname = command.Class == null ? "" : command.Class;
                data.domid = command.DomID == null ? "" : command.DomID;
                data.storedproceduredataformat = command.Magic_GridsCmdDataFormatType == null ? "XML" : command.Magic_GridsCmdDataFormatType.FormatType;

                if (command.Magic_GridsCmdGroups != null)
                {
                    data.groupText = command.Magic_GridsCmdGroups.Text;
                    data.groupPosition = command.Magic_GridsCmdGroups.OrdinalPosition;
                    data.groupIconSpan = command.Magic_GridsCmdGroups.IconSpan;
                }

                if (String.IsNullOrEmpty(command.ClickJSFunction))
                    data.clickjsfunct = position == "TOOLBAR" ? "genericToolbarButtonFunction" : "genericRowButtonFunction";
                else
                    data.clickjsfunct = command.ClickJSFunction;

                commandList.Add(JsonConvert.SerializeObject(data));
            }

            return commandList.Count() > 0 ? "[" + String.Join(",", commandList) + "]" : null;
        }

        internal static string BuildModel(List<Data.v_Magic_Mmb_GridColumns> Result, List<Data.Magic_ColumnsFunctionOverrides> coloverrides)
        {
            string schematemplate = "[ {{  id : \"{0}\" , fields : {{ {1} }} }}  ]";
            //TODO: Verificare funzionamento in caso di PK multiple
            string pkcolumn = "";

            string res = String.Empty;

            List<string> items = new List<string>();
            foreach (var linedata in Result.Where(x => x.ColumnName != "VirtualColumn"))
            {
                string res1 = String.Empty;
                res1 += linedata.ColumnName + ": ";

                if (linedata.Schema_fulldefinition == null)
                {
                    bool? editableoverride = coloverrides.Where(x => x.Magic_Columns.ColumnName == linedata.ColumnName).Select(y => y.isEditable).FirstOrDefault();
                    if (editableoverride == null)
                        editableoverride = linedata.Schema_editable;

                    //editable : false for primary keys
                    res1 += "{editable:" + editableoverride.ToString().ToLower();

                    if (linedata.Isprimary == 1)
                        pkcolumn = linedata.ColumnName;

                    if ((linedata.Schema_type != null) && (linedata.FK_Column == null))
                        res1 += ",type: " + Helpers.Utils.SurroundWithDoubleQuotes(linedata.Schema_type);
                    if (linedata.Schema_type == null)
                        res1 += ",type:\"string\"";

                    if (linedata.DataType != null)
                        res1 += ",databasetype:" + Helpers.Utils.SurroundWithDoubleQuotes(linedata.DataType);

                    if ((linedata.Schema_nullable == "false") && (linedata.Isprimary == 0))
                        res1 += ",nullable:" + linedata.Schema_nullable.ToString().ToLower();

                    if (linedata.MagicTemplateDataRole != null)
                    {
                        res1 += ",dataRole:\"" + linedata.MagicTemplateDataRole.ToString().ToLower() + "\"";

                        if (linedata.MagicTemplateDataRole == "dropdownlist" || linedata.MagicTemplateDataRole == "multiselect" || linedata.MagicTemplateDataRole.Contains("searchgrid") || linedata.MagicTemplateDataRole.Contains("autocomplete") || linedata.MagicTemplateDataRole == "business_object_selector")
                        {
                            Newtonsoft.Json.Linq.JObject dataSourceInfo = Newtonsoft.Json.Linq.JObject.FromObject(new
                            {
                                dsValueField = linedata.MagicDataSourceValueField,
                                dsTextField = linedata.MagicDataSourceTextField,
                                dataSource = linedata.MagicDataSource,
                                dsTypeId = linedata.MagicDataSourceType_ID,
                                dsSchema = linedata.MagicDataSourceSchema,
                                cascadeColumn = linedata.Cascade_ColumnName,
                                cascadeFilterColumn = linedata.Cascade_FilterColumnName
                            });
                            if (linedata.MagicTemplateDataRole.Contains("searchgrid"))
                            {
                                dataSourceInfo.Add("searchGridName", linedata.SearchGridName);
                                dataSourceInfo.Add("searchGridColumnDesc", linedata.SearchGridColumnDesc);
                            }
                            res1 += ",dataSourceInfo:" + dataSourceInfo.ToString();
                        }
                        else if (linedata.MagicTemplateDataRole.Contains("upload"))
                        {
                            Newtonsoft.Json.Linq.JObject uploadInfo = Newtonsoft.Json.Linq.JObject.FromObject(new
                            {
                                savePath = !string.IsNullOrEmpty(linedata.Upload_SavePath) ? linedata.Upload_SavePath.ToString().Replace("\\", "/") : "",
                                fileExtensions = !string.IsNullOrEmpty(linedata.UploadAllowedFileExtensions) ? "." + linedata.UploadAllowedFileExtensions.Replace("@", ",.") : "",
                                isMulti = linedata.Upload_Multi,
                                adminUpload = linedata.MagicTemplateDataRole == "adminareaupload"
                            });
                            res1 += ",uploadInfo:" + uploadInfo.ToString();
                        }
                    }

                    if ((linedata.Schema_validation != null) && (linedata.Isprimary == 0))
                        res1 += ",validation: " + linedata.Schema_validation;
                    else
                    {// se lo script di validazione e' nullo lo compongo guardando i valori dei singoli campi
                        if ((linedata.Schema_validation == null) && (linedata.Isprimary == 0) && ((linedata.StringLength != null) || (linedata.Schema_Numeric_step != null) || (linedata.Schema_Numeric_min != null) || (linedata.Schema_Numeric_max != null) || (linedata.Schema_required != null)))
                        {
                            List<String> validationfields = new List<string>();
                            var validationtemplate = ",validation:{{ {0}  }}";
                            if ((linedata.StringLength != null) && (linedata.DataType != "number") && (linedata.DataType != "boolean") && (linedata.DataType != "date"))
                                validationfields.Add("maxlength:" + linedata.StringLength.ToString());
                            if (linedata.Schema_Numeric_min != null)
                                validationfields.Add("min:" + linedata.Schema_Numeric_min.ToString());
                            if (linedata.Schema_Numeric_max != null)
                                validationfields.Add("max:" + linedata.Schema_Numeric_max.ToString());
                            if (linedata.Schema_Numeric_step != null)
                            {
                                int step = Decimal.ToInt32(linedata.Schema_Numeric_step ?? 1);
                                validationfields.Add("step:" + step.ToString());
                            }
                            if (linedata.Schema_required != null)
                                if ((bool)linedata.Schema_required)
                                    validationfields.Add("required:true");
                            var content = String.Join(",", validationfields);
                            res1 += String.Format(validationtemplate, content);
                        }
                    }
                    string defaultValue = String.Empty;
                    if (linedata.Schema_defaultvalue != null)
                    {
                        char[] trimch = new char[2];
                        trimch[0] = ')';
                        trimch[1] = '(';
                        string defval = linedata.Schema_defaultvalue.Trim(trimch);
                        if (linedata.Schema_type == "boolean")
                        {
                            defaultValue = (defval == "1") ? "true" : "false";
                        }
                        else if (linedata.Schema_type == "number")
                        {
                            int defaultInt; decimal defaultDecimal;
                            if (int.TryParse(linedata.Schema_defaultvalue, out defaultInt) || decimal.TryParse(linedata.Schema_defaultvalue, out defaultDecimal) || (defval == "null"))
                                defaultValue = defval;
                            else
                                defaultValue = null;
                        }
                        else defaultValue = (defval == "null") ? defval : Helpers.Utils.SurroundWithDoubleQuotes(HttpUtility.JavaScriptStringEncode(defval));
                        if (!string.IsNullOrEmpty(defaultValue))
                            res1 += ",defaultValue:" + defaultValue;
                    }
                    if (linedata.ContainerColumn_ID != null)
                        res1 += ",containerColumn:" + Helpers.Utils.SurroundWithDoubleQuotes(linedata.ContainerColumnName);
                    if (linedata.Layer_ID != 0)
                        res1 += ",Layer_ID:" + linedata.Layer_ID.ToString();

                    res1 += "}";
                }
                else
                {
                    res1 = linedata.Schema_fulldefinition;
                }
                items.Add(res1);
            }

            res = string.Format(schematemplate, pkcolumn, string.Join(",", items.ToArray()));

            return res.Replace("\n", String.Empty).Replace("\r", String.Empty);
        }
        internal static string addCommaToCommandsIfItDoesNotEndWith(string command)
        {
            if (String.IsNullOrEmpty(command))
                return command;
            if (!command.TrimEnd().EndsWith(","))
                return command + ",";
            return command;
        }
        internal static string BuildColumns(List<Data.v_Magic_Mmb_GridColumns> Result, Dictionary<string, string> lab, string command, int functionLayer_ID, List<Data.Magic_ColumnsFunctionOverrides> coloverrides, bool? showlayeronly)
        {

            string Columnstemplate = "[ {0} {1} ]";
            string Commmandtemplate = addCommaToCommandsIfItDoesNotEndWith(command == null ? Result[0].MagicGridColumnsCommand : command);

            string res = String.Empty;
            List<string> items = new List<string>();
            Models.GridModelParser gp = new Models.GridModelParser();
            //ottiene la lista dei layer a partire da quello passato come parametro sfruttando il ParentLayer_ID di Magic_ApplicationLayers
            List<int> layerlist = gp.getParentLayerList(functionLayer_ID);

            //prendo le colonne del layer di default (0) e di quello relativo alla funzione che richiede la griglia se showlayeronly = false, altrimenti mostro solo quelle di layer
            foreach (var linedata in Result.Where(x => ((x.Layer_ID == 0 || layerlist.Contains(x.Layer_ID)) && showlayeronly == false)
                      || (layerlist.Contains(x.Layer_ID) && showlayeronly == true))
                      .OrderBy(x => x.Columns_OrdinalPosition))
            {

                int overrides = coloverrides.Where(x => x.Magic_Columns.ColumnName == linedata.ColumnName).Count();

                bool? visible = linedata.Columns_visibleingrid;
                if (overrides > 0)
                    visible = (coloverrides.Where(x => x.Magic_Columns.ColumnName == linedata.ColumnName && x.isVisible == true).Select(y => (y.isVisible))).FirstOrDefault();

                //se c'e' un override devo comportarmi secondo l' override. se i valori sono non specificati vengono considerati falsi.
                if (visible == null || visible == false)
                    visible = false;
                else visible = true;

                if ((bool)visible)
                {
                    string res1 = String.Empty;
                    res1 += "field: " + Helpers.Utils.SurroundWithDoubleQuotes(linedata.ColumnName) + ",";


                    if (lab.ContainsKey(linedata.ColumnName))
                        res1 += "title: " + Helpers.Utils.SurroundWithDoubleQuotes(lab[linedata.ColumnName]) + ",";
                    else
                        if (linedata.Columns_label != null)
                        res1 += "title: " + Helpers.Utils.SurroundWithDoubleQuotes(linedata.Columns_label) + ",";

                    if (linedata.Columns_template != null)
                        res1 += "template:" + linedata.Columns_template + ",";

                    if (linedata.Columns_EditorFunction != null)
                        res1 += "editor:" + linedata.Columns_EditorFunction + ",";

                    if (linedata.Columns_width != null)
                        res1 += "width: " + linedata.Columns_width.ToString() + ",";

                    if (linedata.Schema_Format != null)
                        res1 += "format: " + Helpers.Utils.SurroundWithDoubleQuotes("{" + linedata.Schema_Format + "}") + ",";

                    if (linedata.Schema_attributes != null)
                        res1 += "attributes: " + Helpers.Utils.SurrondWithBraces(linedata.Schema_attributes) + ",";

                    bool? filterable = (coloverrides.Where(x => x.Magic_Columns.ColumnName == linedata.ColumnName && x.isFilterable == true).Select(y => (y.isFilterable))).FirstOrDefault();
                    bool? sortable = (coloverrides.Where(x => x.Magic_Columns.ColumnName == linedata.ColumnName && x.isVisible == true).Select(y => (y.isSortable))).FirstOrDefault();

                    if (overrides > 0 && (filterable == null))
                        filterable = false;


                    if (overrides > 0 && (sortable == null))
                        sortable = false;

                    if (overrides == 0)
                        filterable = linedata.Columns_isFilterable;
                    if (overrides == 0)
                        sortable = linedata.Columns_isSortable;

                    if (filterable != null)
                        res1 += "filterable: " + (filterable == true ? "true" : "false") + ",";

                    if (sortable != null)
                        res1 += "sortable: " + (sortable == true ? "true" : "false") + ",";

                    res1 = Helpers.Utils.SurrondWithBraces(res1.TrimEnd(','));

                    items.Add(res1);
                }
            }

            res = string.Format(Columnstemplate, Commmandtemplate, string.Join(",", items.ToArray()));

            return res;
        }
        internal static void ManageOverrideProperties(List<Models.v_Magic_Grids> resobj, Data.Magic_FunctionsGrids overriddengrid)
        {
            if (overriddengrid != null)
            {
                resobj[0].DetailTemplate = overriddengrid.DetailTemplateOverride == null ? resobj[0].DetailTemplate : overriddengrid.DetailTemplateOverride;
                resobj[0].EditableTemplate = overriddengrid.EditTemplateOverride == null ? resobj[0].EditableTemplate : overriddengrid.EditTemplateOverride;
                resobj[0].Groupable = overriddengrid.Groupable == null ? resobj[0].Groupable : overriddengrid.Groupable;
                resobj[0].Sortable = overriddengrid.Sortable == null ? resobj[0].Sortable : overriddengrid.Sortable;
                resobj[0].Toolbar = overriddengrid.Toolbar == null ? resobj[0].Toolbar : overriddengrid.Toolbar;
                resobj[0].Editable = overriddengrid.Editable == null ? resobj[0].Editable : overriddengrid.Editable;
                resobj[0].MagicGridColumnsCommand = overriddengrid.CommandColumn == null ? resobj[0].MagicGridColumnsCommand : overriddengrid.CommandColumn;
                resobj[0].MagicDataSourceID = overriddengrid.MagicDataSource_ID == null ? resobj[0].MagicDataSourceID : overriddengrid.MagicDataSource_ID;
                if (overriddengrid.Magic_DataSource != null && resobj[0].MagicGridTransport == null)
                {
                    resobj[0].Filter = overriddengrid.Magic_DataSource.Filter;
                    resobj[0].OrderByFieldName = overriddengrid.Magic_DataSource.OrderByFieldName;
                    resobj[0].CustomJSONParam = overriddengrid.Magic_DataSource.CustomJSONParam;

                }
            }

        }
        internal static string BuildTransport(List<Models.v_Magic_Grids> resobj, Data.Magic_FunctionsGrids overriddengrid)
        {
            string transport = "[{{ read: {0}, update: {1}, create: {2}, destroy: {3}, parameterMap: function (options, operation) {{ if (operation != \"destroy\") {{ return kendo.stringify(options); }} return options;  }} }}]";
            transport = string.Format(transport, resobj[0].ObjRead, resobj[0].ObjUpdate, resobj[0].ObjCreate, resobj[0].ObjDestroy);
            if (overriddengrid != null)
            {
                if (overriddengrid.Magic_DataSource != null)
                {
                    transport = "[{{ read: {0}, update: {1}, create: {2}, destroy: {3}, parameterMap: function (options, operation) {{ if (operation != \"destroy\") {{ return kendo.stringify(options); }} return options;  }} }}]";
                    transport = string.Format(transport, overriddengrid.Magic_DataSource.ObjRead == null ? resobj[0].ObjRead : overriddengrid.Magic_DataSource.ObjRead, overriddengrid.Magic_DataSource.ObjUpdate == null ? resobj[0].ObjUpdate : overriddengrid.Magic_DataSource.ObjUpdate, overriddengrid.Magic_DataSource.ObjCreate == null ? resobj[0].ObjCreate : overriddengrid.Magic_DataSource.ObjCreate, overriddengrid.Magic_DataSource.ObjDestroy == null ? resobj[0].ObjDestroy : overriddengrid.Magic_DataSource.ObjDestroy);
                }
            }
            return transport;
        }
        internal static void ManageLayerDataSource(List<Models.v_Magic_Grids> resobj, int? layerid, Data.MagicDBDataContext _context)
        {
            string gridname = resobj[0].MagicGridName;
            if (layerid != 0)
            {
                var ds = (from e in _context.Magic_DataSource where e.CoreGrid_ID == resobj[0].MagicGrid_ID && (e.Layer_ID ?? 0) == layerid select e).FirstOrDefault();
                if (ds != null)
                {
                    resobj[0].MagicDataSourceID = ds.MagicDataSourceID;
                    resobj[0].ObjCreate = ds.ObjCreate;
                    resobj[0].ObjDestroy = ds.ObjDestroy;
                    resobj[0].ObjRead = ds.ObjRead;
                    resobj[0].ObjUpdate = ds.ObjUpdate;
                    resobj[0].CustomJSONParam = ds.CustomJSONParam;
                    resobj[0].Filter = ds.Filter;
                    resobj[0].OrderByFieldName = ds.OrderByFieldName;
                }
                string layersource = (from e in _context.Magic_Columns where e.Magic_Grids.MagicGridName == gridname && e.Layer_ID == layerid && e.Magic_ApplicationLayers.Magic_AppLayersTypes.Code == "RELDATA" select e.LayerSourceEntityName).FirstOrDefault();
                resobj[0].FromTable = layersource != null ? layersource : resobj[0].FromTable;

            }
        }
        internal static void BuildCommands(List<Models.v_Magic_Grids> resobj, string gridname, int? functionid)
        {
            //retrieve TOOLBAR commands 
            resobj[0].ToolbarCmdToAdd = Models.Magic_Grids.BuildGridCommands(gridname, functionid, "TOOLBAR");
            //retrieve ROWHEAD commands 
            resobj[0].HeadRowCmdToAdd = Models.Magic_Grids.BuildGridCommands(gridname, functionid, "ROWHEAD");
            //retrieve ROWTAIL commands 
            resobj[0].TailRowCmdToAdd = Models.Magic_Grids.BuildGridCommands(gridname, functionid, "ROWTAIL");
        }
        //gets the grid definition from cache, if a grid for a specific function is not found it gets the general definition
        internal static string getGridFromCache(string gridname, string functionid, string layerid) {
            string gridObj;
            string gridKey = CacheHandler.getGridKey(gridname, functionid, layerid);
            if (HttpContext.Current.Cache[gridKey] != null)
                gridObj = HttpContext.Current.Cache[gridKey].ToString();
            else
            {
                gridKey = CacheHandler.getGridKey(gridname, "-1", layerid);
                if (HttpContext.Current.Cache[gridKey] != null)
                    gridObj = HttpContext.Current.Cache[gridKey].ToString();
                else //fallback on buffer and fill cache
                    gridObj = getGridFromBuffer(gridname, int.Parse(layerid), int.Parse(functionid));
            }
            return Models.Magic_Grids.AddGridUserFields(gridname, Newtonsoft.Json.JsonConvert.DeserializeObject(gridObj));
        }
        public static ModelFieldInfo GetXmlFieldDefinitionFromModel(dynamic model,string fieldName,string gridName)
        {
            ModelFieldInfo mif = null;
            if (model == null)
                return mif;

            dynamic gd = new ExpandoObject();

            AddGridUserFields(gridName, gd);

            if (gd.userFields != null)
            {
                List<String> xmlColumns = new List<string>();
                foreach (Newtonsoft.Json.Linq.JProperty column in model.fields)
                {
                    if (column.Value["databasetype"] != null && column.Value["databasetype"].ToString().Equals("xml"))
                        xmlColumns.Add(column.Name);
                }
                if (xmlColumns.Count > 0 && gd.userFields.fields!=null)
                {
                    foreach (JProperty field in gd.userFields.fields)
                    {
                        if (field.Name != fieldName)
                            continue;
                        //default container column if not specified...
                        if (field.Value["containerColumn"] == null)
                            field.Value["containerColumn"] = xmlColumns.Last();
                        mif = new ModelFieldInfo(true, field.Value["type"].ToString(), field.Value["databasetype"].ToString(), field.Value["containerColumn"].ToString());
                        break;
                    }

                }
            }
            return mif;
            
        }
        public static void addGridPropertiesForCreateUpdatedDeleteOperations(dynamic data)
        {
            string gridname = data.cfgGridName.ToString();
            string functionid = data.cfgfunctionID.ToString();
            string layerid = data.cfglayerID.ToString();
            
            if (String.IsNullOrEmpty(layerid))
                layerid = "0";
            string gridDefinition = getGridFromCache(gridname, functionid, layerid);
            JObject gd = Newtonsoft.Json.JsonConvert.DeserializeObject<JObject>(gridDefinition);
            string model_ = gd["MagicGridModel"].ToString();
            if (!string.IsNullOrEmpty(model_))
            {
                data.cfgModel = Newtonsoft.Json.JsonConvert.DeserializeObject<dynamic>(model_)[0];
                if (gd["userFields"] != null)
                {
                    List<String> xmlColumns = new List<string>();
                    foreach (Newtonsoft.Json.Linq.JProperty column in data.cfgModel.fields)
                    {
                        if (column.Value["databasetype"] != null && column.Value["databasetype"].ToString().Equals("xml"))
                            xmlColumns.Add(column.Name);
                    }
                    if (xmlColumns.Count > 0  && gd["userFields"].HasValues)
                    {
                        dynamic ufields = Newtonsoft.Json.JsonConvert.DeserializeObject<dynamic>(gd["userFields"].ToString());
                        foreach (JProperty field in ufields.fields)
                        {
                            //default container column if not specified...
                            if (field.Value["containerColumn"] == null)
                                field.Value["containerColumn"] = xmlColumns.Last();
                            data.cfgModel.fields.Add(field);
                        }
                    }
                }
            }
            else
                data.cfgModel = null;
            data.cfgEntityName = gd["FromTable"] != null ? gd["FromTable"].ToString() : null;
            data.cfgDataSourceCustomParam = gd["CustomJSONParam"].ToString();
            if (data.cfgModel["id"]!=null)
                data.cfgpkName = data.cfgModel["id"].ToString();
            if (gd["MagicGridExtension"] != null && gd["MagicGridExtension"].ToString() != String.Empty)
            {
                data.MagicGridExtension = JObject.Parse((string)gd["MagicGridExtension"]);
            }
        }

        internal static Response GetGridsByName(string magicgridname)
        {         
            DataSet ds = new DataSet();

            string sqlCmd = @"SELECT *
                                FROM [dbo].[Magic_Grids] 
                                WHERE [MagicGridName] LIKE '%'+@magicgridname+'%'
                                OR MagicGridEntity LIKE '%'+@magicgridname+'%' ";

            using (SqlConnection conn = new SqlConnection(DBConnectionManager.GetMagicConnection()))
            {
                using (SqlCommand cmd = new SqlCommand(sqlCmd, conn))
                {
                    cmd.Parameters.Add("@magicgridname", SqlDbType.VarChar).Value = magicgridname;
                    SqlDataAdapter da = new SqlDataAdapter();
                    conn.Open();
                    da.SelectCommand = cmd;
                    da.Fill(ds);
                    da.Dispose();
                }
            }
            DataTable dt = ds.Tables[0];

            var result = dt.AsEnumerable().ToArray();
            if (result.Length > 0)
                result = result.Take(1).ToArray();
            return new Models.Response(result, result.Length);             
        }

        /// <summary>
        /// gets definition of grid from db buffer. if not found for the given function fallbacks on funtion = null case
        /// </summary>
        /// <param name="gridname"></param>
        /// <param name="layerid"></param>
        /// <param name="functionid"></param>
        /// <returns></returns>
        public static string getGridFromBuffer(string gridname, int layerid, int functionid)
        {
            Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
            var jsonGrid = (from e in _context.Magic_TemplateScriptsBuffer
                               where e.Magic_Grids.MagicGridName == gridname
                                       && e.Magic_Culture_ID == SessionHandler.UserCulture
                                       && e.Magic_Layer_ID == layerid
                               select e)
                    .Where(d => d.Magic_Function_ID == functionid)
                    .FirstOrDefault();

            if (jsonGrid == null)
                jsonGrid = (from e in _context.Magic_TemplateScriptsBuffer
                            where e.Magic_Grids.MagicGridName == gridname
                                    && e.Magic_Culture_ID == SessionHandler.UserCulture
                                    && e.Magic_Layer_ID == layerid
                            select e)
                    .Where(d => d.Magic_Function_ID == null)
                    .FirstOrDefault();



            if (jsonGrid != null)
            {
                string cachekey = MagicFramework.Helpers.CacheHandler.getGridKey(gridname, functionid.ToString(), layerid.ToString());
                HttpContext.Current.Cache.Insert(cachekey, jsonGrid.Magic_Script);

                return jsonGrid.Magic_Script;
            }
            return null;
        }
        public static string getSelectAllSP(string gridname) {
            string selectAllSP = String.Empty;
            Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
            string extension = _context.Magic_Grids.Where(x => x.MagicGridName == gridname).Select(y => y.MagicGridExtension).FirstOrDefault();
            if (!String.IsNullOrEmpty(extension))
            {
                dynamic extensionObj = Newtonsoft.Json.JsonConvert.DeserializeObject(extension);
                selectAllSP = extensionObj["selectAllSP"].ToString();
            }
            return selectAllSP;
        }
        #endregion

        #region newclientAPI
        public static DataTable GetNavigationTabs(string GUID) {
            
            DataSet ds = new DataSet();

            string sqlCommand = @"SELECT 
                               g.MagicGridName as ParentRowGridName
	                           ,[MagicTemplateGroupLabel] as TabLabel
                              ,tt.[OrdinalPosition]    as TabOrdinalPosition
                              ,[Groupisvisible] as TabIsVisible
                              ,[BindedGrid_ID] as TabInnerGrid_ID 
                              ,[BindedGridFilter] as TabInnerGridFilter
                              ,[BindedGridHideFilterCol] as TabInnerGridHideFilterCols
                              ,[BindedGridRelType_ID] as TabInnerGridRelationshipType
	                          ,reltyp.Code as RelType
                              ,[BindedGridName] as TabInnerGridName 
                              ,[IsVisibleInPopUp] as TabIsVisibleInParentGridEdit
                              ,tt.[GUID]   as TabGUID
	                          ,[MagicTemplateTabGroup_ID] as Group_ID
                              ,tg.[OrdinalPosition] as GroupOrdinalPosition
	                          ,tg.[Color] as GroupBackgroundColor
	                          ,tg.[MagicTemplateTabGroupLabel] as GroupLabel
                              FROM [dbo].[v_Magic_Grid_NavigationTabs] tt
                              left join [dbo].[Magic_TemplateTabGroups] tg
                              on tg.[MagicTemplateTabGroupID] = tt.[MagicTemplateTabGroup_ID]
                              left join [dbo].[Magic_TemplateGrpGridRelType] reltyp
                              on reltyp.[ID] = [BindedGridRelType_ID]
                              inner join dbo.Magic_Templates t
                              on t.MagicTemplateID = tt.[MagicTemplate_ID]
                              inner join dbo.Magic_Grids g
                              on g.DetailTemplate = t.MagicTemplateName
                              where MagicTemplateGroupContent_ID = 1 and g.GUID =  @guid 
                              and tt.[Groupisvisible] = 1";

            using (SqlConnection conn = new SqlConnection(DBConnectionManager.GetMagicConnection()))
            {
                using (SqlCommand cmd = new SqlCommand(sqlCommand, conn))
                {
                    cmd.Parameters.Add("@guid", SqlDbType.VarChar).Value = GUID;
                    SqlDataAdapter da = new SqlDataAdapter();
                    conn.Open();
                    da.SelectCommand = cmd;
                    da.Fill(ds);
                    da.Dispose();
                }
            }

            return ds.Tables[0];

        }
        #endregion
    }

    public class MagicGridExtension
    {
        public F2FileColumns[] F2FileColumns { get; set; }
    }

    public class F2FileColumns
    {
        public string F1Column { get; set; }
        public string F2Column { get; set; }
    }

}
