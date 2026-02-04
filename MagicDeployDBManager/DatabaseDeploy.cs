using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Reflection;
using System.Web;
using MagicDeployDBManager.Helpers;


namespace MagicDeployDBManager
{
    public class DatabaseDeploy
    {
        public class ImportOptions
        {
            public int? ImportID { get; set; }
            public bool ImportSQL { get; set; }
            public bool ImportHelp { get; set; }
            public bool ImportOverwrites { get; set; }
            public bool DeleteMismatch { get; set; }
            public string ImportMenu { get; set; }
            public bool ImportWithIdentityInsert { get; set; }
        }

        private int deployId { get; set; }
        private string source { get; set; }
        private string destination { get; set; }
        private bool system { get; set; }
        private string version { get; set; }
        private string deploySchema = "DEPLOY";
        private string deployTablePrefix = "DEP_";
        private string alias = "xyz";
        private string applicationName;
        private string sourcecrypted { get; set; }

        private MagicMongoPort mongoPort;

        /// <summary>
        /// costruttore
        /// </summary>
        /// <param name="sourceConnection">connessione a db origine</param>
        /// <param name="destinationConnection">connessione a db dest</param>
        /// <param name="deployID">ID della tabella Magic_Deploys sul source</param>
        /// <param name="iSsystem">indica se il source e' un DB di sistema(MagicDB)</param>
        /// <param name="MFversion">versione dll di MagicFramework</param>
        public DatabaseDeploy(string sourceConnection , string destinationConnection, int deployID, bool iSsystem, string MFversion,
            string mongoStartConnectionstring,
            string mongoDestinationConnectionstring,
            string startApplicationName,
            string destinationApplicationName,
            string destinationMongoDBName,
            string startMongoDBName)
        {
            this.source = sourceConnection;  //target e' riferito alle tabelle del sistema da cui faccio li deploy, quello che istanzia questa classe
            this.destination = destinationConnection;
            this.system = iSsystem;
            this.deployId = deployID;
            this.version = MFversion;
            this.sourcecrypted = offuscatepwd();
            this.applicationName = startApplicationName;
            if(!string.IsNullOrEmpty(mongoDestinationConnectionstring))
                mongoPort = new MagicMongoPort(mongoStartConnectionstring, mongoDestinationConnectionstring, startApplicationName, destinationApplicationName, destinationMongoDBName, startMongoDBName);
        }
        /// <summary>
        /// Costruttore per il lancio da console application
        /// </summary>
        /// <param name="sourceConnection"></param>
        /// <param name="destinationConnection"></param>
        /// <param name="iSsystem"></param>
        /// <param name="MFversion"></param>
        public DatabaseDeploy(string sourceConnection, string destinationConnection, bool iSsystem,int deployID = 0)
        {
            this.source = sourceConnection;  //target e' riferito alle tabelle del sistema da cui faccio li deploy, quello che istanzia questa classe
            this.destination = destinationConnection;
            this.system = iSsystem;
            this.deployId = deployId;
            this.version = "CMD";
            this.sourcecrypted = offuscatepwd();
        }

        private string offuscatepwd()
        {
            List<string> res = new List<string>();
            List<string> connstringComponents = this.source.Split(';').ToList();
            foreach (var s in connstringComponents)
            {
                //escludo le credenziali del source dai dati che mando sul target
                if (s.ToUpper().Contains("PASSWORD") == false && s.ToUpper().Contains("USER")==false)
                    res.Add(s);
            }

            return String.Join(";", res);
        }

        private void rebuildDeployTablesAtDestination()
        {
            try
            {
                using (SqlConnection conn = new SqlConnection(this.destination))
                {
                    conn.Open();
                    // 1.  create a command object identifying the stored procedure
                    using (SqlCommand cmd = new SqlCommand("DEPLOY.Magic_TargetRebuildStagingTables", conn))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.ExecuteNonQuery();
                    }
                   
                }
            }
            catch (Exception ex)
            {
                throw new System.ArgumentException("rebuildDeployTablesAtDestination:: " + ex.Message);
            }
        }
    
        private void UpdateSourceFunctionGUID()
        {

            try
            {
                using (SqlConnection conn = new SqlConnection(this.source))
                {
                    conn.Open();
                    // 1.  create a command object identifying the stored procedure
                    using (SqlCommand cmd = new SqlCommand("DEPLOY.Magic_SourceCreateGUIDs", conn))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.ExecuteNonQuery();
                    }

                }
           
            }
            catch (Exception ex)
            {
                throw new System.ArgumentException("UpdateSourceFunctionGUID::" + ex.Message);
            }

        }

       
        private void setExportStatus(string status,string error)
        {
            try
            {
                using (SqlConnection conn = new SqlConnection(this.source))
                {
                    conn.Open();
                    // 1.  create a command object identifying the stored procedure
                    using (SqlCommand cmd = new SqlCommand("DEPLOY.Magic_SourceInitExport", conn))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        SqlParameter par = new SqlParameter("magicframeworkversion", SqlDbType.VarChar);
                        par.Direction = ParameterDirection.Input;
                        par.Value = this.version;

                        SqlParameter par2 = new SqlParameter("sourceDBConnString", SqlDbType.VarChar);
                        par2.Direction = ParameterDirection.Input;
                        par2.Value = this.source;

                        SqlParameter par3 = new SqlParameter("destDBConnString", SqlDbType.VarChar);
                        par3.Direction = ParameterDirection.Input;
                        par3.Value = this.destination;

                        SqlParameter par4 = new SqlParameter("depID", SqlDbType.Int);
                        par4.Direction = ParameterDirection.Input;
                        par4.Value = this.deployId;

                        SqlParameter par5 = new SqlParameter("status", SqlDbType.VarChar);
                        par5.Direction = ParameterDirection.Input;
                        par5.Value = status;


                        SqlParameter par6 = new SqlParameter("error", SqlDbType.VarChar);
                        par6.Direction = ParameterDirection.Input;
                        par6.Value = error == null ? "" : error;

                        cmd.Parameters.Add(par4);
                        cmd.Parameters.Add(par);
                        cmd.Parameters.Add(par2);
                        cmd.Parameters.Add(par3);
                        cmd.Parameters.Add(par5);
                        cmd.Parameters.Add(par6);
                        cmd.ExecuteNonQuery();
                    }

                }

            }
            catch (Exception ex) { throw new System.ArgumentException("initDeploy:: " + ex.Message); }

        }
        /// <summary>
        /// Risolve eventuali problemi di ordering delle colonne tra ambiente source e destinazione
        /// </summary>
        /// <param name="tablename">nome tabella</param>
        /// <returns></returns>
        private string getDestinationOrderedColumnList(string tablename,string schema)
        {
            var dst = DAL.GetDataSet("SELECT COLUMN_NAME from INFORMATION_SCHEMA.COLUMNS where TABLE_SCHEMA = '" + schema + "' AND TABLE_NAME = '" + tablename + "' ORDER BY ORDINAL_POSITION", this.destination);
            List<string> cols = new List<string>();

            var dstrows = dst.Tables[0].Rows;

            foreach (DataRow r in dstrows)
            {
                cols.Add(r["COLUMN_NAME"].ToString());
            }

            return this.alias + "." + String.Join("," + this.alias + ".", cols) + ",getdate() as copydate,'"+this.sourcecrypted + "' as source";
        }
        /// <summary>
        /// Genera la where per fare in modo che se il flag system e' a true devo trasferire solo funzioni, griglie e template di sistema (caso export MagicDB).
        /// Se system = false allora faccio l' export di tutti i dati. 
        /// </summary>
        /// <param name="collist">lista delle colonne del grid di configurazione da esportare</param>
        /// <returns></returns>
        private string buildSystemCondition(string collist)
        {
            List<string> cols = collist.Split(',').ToList();
            if (this.system == true)
            {
                if (cols.Contains(this.alias+".isSystemGrid"))
                    return " WHERE ("+this.alias+".isSystemGrid=1)";
                if (cols.Contains(this.alias+".isSystemFunction"))
                    return " WHERE (" + this.alias + ".isSystemFunction=1)";
                if (cols.Contains(this.alias+".isSystemTemplate"))
                    return " WHERE (" + this.alias + ".isSystemTemplate=1)";
            }
            return "";
        }
        
        /// <summary>
        /// Query builder per l' estrazione dei dati da source
        /// </summary>
        /// <param name="exportquery"></param>
        /// <param name="t"></param>
        /// <returns></returns>
        private string createQuery(string exportquery,string t,string s)
        {
            //prendo il nome e l' ordine dei campi dalla tabella di destinazione in modo che il bulk copy non dia problemi
            var collist = getDestinationOrderedColumnList(t,s);
            string syswherecondition = buildSystemCondition(collist);
            string query = String.Empty;
            if (!String.IsNullOrEmpty(exportquery) && !String.IsNullOrWhiteSpace(exportquery))
                query = String.Format(exportquery, getDestinationOrderedColumnList(t,s),this.deployId.ToString(),this.destination);
            else
                query = "SELECT " + collist + " FROM " + s +"." + t +" "+this.alias+" "+syswherecondition;

            return query;
        }
        /// <summary>
        /// Copia la lista di tabelle di configurazione da trasferire da source a dest 
        /// </summary>
        private void ExecuteCopyTableListToDestination()
        {
            var dataset = DAL.GetDataSet("SELECT ID,TABLE_NAME,ExportQuery,TABLE_SCHEMA,readOnly,InsertionOrder FROM [DEPLOY].[Magic_Deploy_ConfigTables]", this.source);
            //cancello SOLO le tabelle che stanno della Magic_Deploy_ConfigTables sia in source che in dest
            List<string> tablestodelete = new List<string>();
            string todelete = String.Empty;
            foreach (DataRow r in dataset.Tables[0].Rows)
            {
                if (r["TABLE_NAME"]!=null)
                    tablestodelete.Add("'"+r["TABLE_NAME"].ToString()+"'");
            }
            todelete = String.Join(",", tablestodelete);
            //cancello la tabella DEPLOY.Magic_Deploy_ConfigTables da destination
            DAL.buildAndExecDirectCommandNonQuery(this.destination, "DELETE DEPLOY.Magic_Deploy_ConfigTables WHERE TABLE_NAME in (" + todelete + ")", new object[0]);

                SqlBulkCopy sbc = new SqlBulkCopy(this.destination);
                sbc.DestinationTableName = "DEPLOY.Magic_Deploy_ConfigTables";
                sbc.WriteToServer(dataset.Tables[0]);
                sbc.Close();
        }


        private void ExecuteBulkCopyToDestination()
        {
            var dataset =  DAL.GetDataSet("SELECT TABLE_NAME,ExportQuery,TABLE_SCHEMA FROM [DEPLOY].[Magic_Deploy_ConfigTables]", this.source);
            var tablestocopy = dataset.Tables[0].Rows;
        
            foreach (DataRow tab in tablestocopy)
            {
                string t = tab["TABLE_NAME"].ToString();
                string s = tab["TABLE_SCHEMA"].ToString();
                if (s == "")
                    s = "dbo";
                var dst = DAL.GetDataSet(createQuery(tab["ExportQuery"].ToString(), t, s), this.source);
                SqlBulkCopy sbc = new SqlBulkCopy(this.destination,SqlBulkCopyOptions.KeepIdentity);
                
                sbc.DestinationTableName = buildTableCompleteName(t);
                sbc.BulkCopyTimeout = 300; //limitemax durata del bulk copy 5 minuti
                sbc.WriteToServer(dst.Tables[0]);
                sbc.Close();
            }
        }

        private string buildTableCompleteName(string sourcetable)
        {
            return this.deploySchema + "." + this.deployTablePrefix + sourcetable;
        }

        public void CopyTableToDestination()
        {
            try
            {
                this.ExecuteCopyTableListToDestination();
                //cancello tutte le tabelle di "copia" dei dati di configurazione nel sistema target
                this.rebuildDeployTablesAtDestination();
                //Guardo se nel sistema source mancano dei GUID per le funzioni, Griglie e template e li creo prima di fare l' export
                this.UpdateSourceFunctionGUID();
                //Inizializzo l'export  su Source
                this.setExportStatus("INPROG", null);
                //ricreo e copio con BULKCOPY una copia dei dati di configurazione su destinazione
                this.ExecuteBulkCopyToDestination();

                if (mongoPort != null)
                {
                    mongoPort.ExportHelp();
                    mongoPort.ExportGridOverwrites();
                }

                this.setExportStatus("END", null);
                this.AddInfoToImportTable();
            }
            catch (Exception ex)
            {
                this.setExportStatus("FAIL", ex.Message);
                throw new ArgumentException(ex.Message);
            }
        }

        public void AddInfoToImportTable()
        {
            var db = new SqlConnection(this.destination);
            string sqlIns = "INSERT INTO [DEPLOY].[Magic_Deploy_Imports] (Created, MFVersion, SourceName) VALUES (@Created, @MFVersion, @SourceName)";
            db.Open();
            try
            {
                SqlCommand cmdIns = new SqlCommand(sqlIns, db);
                cmdIns.Parameters.AddWithValue("@Created", DateTime.Now);
                cmdIns.Parameters.AddWithValue("@MFVersion", this.version);
                cmdIns.Parameters.AddWithValue("@SourceName", this.applicationName);
                cmdIns.ExecuteNonQuery();

                cmdIns.Parameters.Clear();
                //cmdIns.CommandText = "SELECT @@IDENTITY";

                // Get the last inserted id.
                //int insertID = Convert.ToInt32(cmdIns.ExecuteScalar());

                cmdIns.Dispose();
                cmdIns = null;
            }
            catch (Exception ex)
            {
                throw new Exception(ex.ToString(), ex);
            }
            finally
            {
                db.Close();
            }
        }

        public static void Import(string destinationSQLConnectionString, string mongoTargetConnectionString, string destinationApplicationName, string mongoDestinationDbName, ImportOptions importOptions, string importStoredProcedureWithAppend,string importStoredProcedurePreserveIds)
        {
            if (importOptions.ImportSQL == true)
            {
                //se voglio allineare completamente gli ambienti uso una stored altrimenti un' altra (prese da config)
                string importStoredProcedure = importOptions.ImportWithIdentityInsert == true ? importStoredProcedurePreserveIds : importStoredProcedureWithAppend;
                DAL.buildAndExecDirectCommandNonQuery(destinationSQLConnectionString, "EXEC " + importStoredProcedure + " {0}", new string[] { importOptions.ImportMenu });
                if (importOptions.ImportID!=null)
                    DAL.buildAndExecDirectCommandNonQuery(destinationSQLConnectionString, "UPDATE DEPLOY.Magic_Deploy_Imports set ImportDate = getdate(), ImportedSQL = 1 where Id = {0}", new string[] { importOptions.ImportID.ToString() });
            }
            //Commented cause mongo is not exported anymore since version 41
             //var functionIdMapping = DAL.GetDataSet("SELECT sf.FunctionID as sourceId, mf.FunctionID as id FROM [DEPLOY].DEP_Magic_Functions sf INNER JOIN dbo.Magic_Functions mf ON sf.GUID = mf.GUID", destinationSQLConnectionString).Tables[0].Rows;
             //if (!String.IsNullOrEmpty(destinationApplicationName) && !String.IsNullOrEmpty(destinationApplicationName) && (importOptions.ImportHelp || importOptions.ImportOverwrites == true))
             //{
             //    var port = new MagicMongoPort(true, mongoTargetConnectionString, destinationApplicationName, mongoDestinationDbName);
             //    if (importOptions.ImportHelp == true)
             //    {
             //        port.ImportHelp(functionIdMapping,importOptions.DeleteMismatch);
             //        if (importOptions.ImportID != null)
             //            DAL.buildAndExecDirectCommandNonQuery(destinationSQLConnectionString, "UPDATE DEPLOY.Magic_Deploy_Imports set ImportDate = getdate(), ImportedHelp = 1 where Id = {0}", new string[] { importOptions.ImportID.ToString() });
             //    }
             //    if (importOptions.ImportOverwrites == true)
             //    {
             //        port.ImportGridOverwrites();
             //        if (importOptions.ImportID != null)
             //            DAL.buildAndExecDirectCommandNonQuery(destinationSQLConnectionString, "UPDATE DEPLOY.Magic_Deploy_Imports set ImportDate = getdate(), ImportedOverrides = 1 where Id = {0}", new string[] { importOptions.ImportID.ToString() });
             //    }
             //}
        }
    }
}