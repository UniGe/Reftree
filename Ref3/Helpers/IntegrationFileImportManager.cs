using MagicFramework.Helpers;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace Ref3.Helpers
{
    public class IntegrationFileImportManager
    {
        const string apiname = "/api/Integration/Import";
        private string InterfaceName { get; set; }
        private string Content { get; set; }
        private MFConfiguration.ApplicationInstanceConfiguration Config { get; set; }
        public IntegrationFileImportManager(string interfeceName, MFConfiguration.ApplicationInstanceConfiguration config,string content)
        {
            this.InterfaceName = interfeceName;
            this.Config = config;
            this.Content = content;
        }
        private string createFileImport(int importSettingID,string tablename)
        {
            string guid = Guid.NewGuid().ToString();
            string sql = @"INSERT INTO dbo.Magic_FileImports(GUID,TableName,ImportSettings_ID,OrigFilePath,Flag_Error) 
                            VALUES (@guid,@tablename,@id,@apiname,0)";
            using (SqlConnection conn = new SqlConnection(this.Config.TargetDBconn))
            {
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.Add(new SqlParameter("@guid", guid));
                    cmd.Parameters.Add(new SqlParameter("@id", importSettingID));
                    cmd.Parameters.Add(new SqlParameter("@tablename", tablename));
                    cmd.Parameters.Add(new SqlParameter("@apiname", apiname));
                    cmd.Connection.Open();
                    cmd.ExecuteNonQuery();
                }
            }
            return guid;
        }
        private void insertIntoTargetTable(string guid, string tablename)
        {
            string sql = string.Format(@"INSERT INTO {0}(FileImport_GUID,Content) 
                            VALUES (@guid,@content)",tablename);
            using (SqlConnection conn = new SqlConnection(this.Config.TargetDBconn))
            {
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.Add(new SqlParameter("@guid", guid));
                    var CONTENT = new SqlParameter("@content", SqlDbType.NVarChar,-1);
                    CONTENT.Value = Content;
                    cmd.Parameters.Add(CONTENT);
                    cmd.Connection.Open();
                    cmd.ExecuteNonQuery();
                }
            }
        }
        private void runStoredProcedure(string guid, string storedprocedure)
        {
            using (SqlConnection conn = new SqlConnection(this.Config.TargetDBconn))
            {
                using (SqlCommand cmd = new SqlCommand(storedprocedure,conn))
                {
                    cmd.Connection = conn;
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.Add(new SqlParameter("@guid", guid));
                    cmd.Connection.Open();
                    cmd.CommandTimeout = 3600; //1h of max execution time...
                    cmd.ExecuteNonQuery();
                }
            }
        }
        
        public void import()
        {
            string connectionString = Config.TargetDBconn;
            DataSet ds = new DataSet();
            string sql = @"SELECT TOP 1 [ID]
                                      ,[FilePath]
                                      ,[TextFileSeparator]
                                      ,[ExcelSheetNumber]
                                      ,[SkipRows]
                                      ,[TakeRows]
                                      ,[Code]
                                      ,[ImportEndStoredProcedure]
                                      ,[ImportTablePrefix]
                                      ,[ImportTableColumnPrefix]
                                      ,[FileHasHeaderRow]
                                      ,[MoveImportedToPath]
                                      ,[CreateTable]
                                  FROM [dbo].[Magic_FileImportSettings] where Code = @code";
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Connection.Open();
                    var CODE = new SqlParameter("@code", SqlDbType.VarChar);
                    CODE.Value = InterfaceName;
                    cmd.Parameters.Add(CODE);
                    DataTable table = new DataTable();
                    table.Load(cmd.ExecuteReader());
                    ds.Tables.Add(table);
                    cmd.Connection.Close();
                }
            }
           
            if (ds.Tables[0].Rows.Count == 0)
                throw new ArgumentException("Interface is not defined in Import settings");

            DataRow fis = ds.Tables[0].Rows[0];
            string tableName = fis["ImportTablePrefix"].ToString();
            string importStoredProcedure = fis["ImportEndStoredProcedure"].ToString();
            int ID = int.Parse(fis["ID"].ToString());
            string guid  = this.createFileImport(ID, tableName);
            insertIntoTargetTable(guid, tableName);
            if (!String.IsNullOrEmpty(importStoredProcedure))
                Task.Run( () =>  runStoredProcedure(guid,importStoredProcedure));
        }
    }
}