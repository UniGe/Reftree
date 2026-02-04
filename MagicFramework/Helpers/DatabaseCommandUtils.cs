using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using Devart.Data;
using Devart.Data.Oracle;
using System.Xml;
using System.Xml.Linq;
using System.Diagnostics;
using Newtonsoft.Json.Linq;
using System.Text.RegularExpressions;
using MagicFramework.Models;
using MagicFramework.MemberShip;
using System.Net.Http;
using System.Net;
using Newtonsoft.Json;

namespace MagicFramework.Helpers
{

    public class DatabaseCommandUtils
    {
        public const string DEFAULT_DB_SCHEMA = "dbo";

        string database = DBConnectionManager.GetRelationalDataBaseType();
        bool compressToXMLpars = ApplicationSettingsManager.GetCompressInputparameterstoXML();
        //Feature #6623 Gestione del timeout delle connessioni a sql dei comandi .Net
        public int sqlCommandTimeout = ConfigurationManager.AppSettings["SqlCommandTimeout"] == null ? 300 : int.Parse(ConfigurationManager.AppSettings["SqlCommandTimeout"].ToString());

     
        public string connection;
        public bool isundervisibility { get; set; }  //Indica se l'  entita'  su cui costruisco la query abbia il campo di visibilita' che rappresenta il gruppo di utenti che ha scritto il record
        public bool hasAttributeFilter { get; set; } //indica se l'  entita'  su cui costruisco la query abbia il campo per effettuare il filtro sulle proprieta'/Gruppi
        public string mergedScenario { get; set;  }

        public DatabaseCommandUtils()
        {
            connection = DBConnectionManager.GetTargetConnection();
        }

        public DatabaseCommandUtils(string tableName)
        {
            connection = DBConnectionManager.GetConnectionFor(tableName);
        }
        public bool CheckProcedureExists(string procedureName)
        {
            
            string schema = "dbo";
            string procedure = procedureName;
            if (procedureName.Contains("."))
            {
                schema = procedureName.Split('.')[0];
                procedure = procedureName.Split('.')[1];
            }
            if (ProcedureExists(DBConnectionManager.UnescapeObjectName(procedure), DBConnectionManager.UnescapeObjectName(schema)))
                return true;
            return false;
        }
        public bool CheckProceduresListExists(List<string> procedureNames)
        {
            bool isok = true;
            foreach (var s in procedureNames)
            {
                var sp = s.Split('.');
                bool exists = false;
                if (sp.Length > 1)
                    exists = this.ProcedureExists(DBConnectionManager.UnescapeObjectName(sp[1]), DBConnectionManager.UnescapeObjectName(sp[0]));
                else
                    exists = this.ProcedureExists(DBConnectionManager.UnescapeObjectName(sp[0]));

                if (!exists)
                {
                    isok = false;
                    break;
                }
            }
            return isok;
        }
        
        private bool ProcedureExists(string procedure, string schema = DEFAULT_DB_SCHEMA)
        {

            string sqlCommand = "IF EXISTS(select * FROM INFORMATION_SCHEMA.Routines where ROUTINE_SCHEMA = @schema and ROUTINE_NAME = @procedurename and ROUTINE_TYPE = 'PROCEDURE') SELECT CAST(1 as bit) as 'Exists' ELSE SELECT CAST(0 as BIT) as 'Exists'";

            DataTable resultTable = new DataTable();
            using (SqlConnection conn = new SqlConnection(DBConnectionManager.GetTargetConnection()))
            {
                using (SqlCommand cmd = new SqlCommand(sqlCommand, conn))
                {
                    cmd.Parameters.AddWithValue("@procedurename", procedure);
                    cmd.Parameters.AddWithValue("@schema", schema);
                    cmd.Connection.Open();
                    resultTable.Load(cmd.ExecuteReader());
                    cmd.Connection.Close();
                }
            }
            var result = resultTable.AsEnumerable().ToArray();
            if (result.Length > 0)
            {
                DataRow resultRow = result[0];
                if ((bool)resultRow["Exists"] == true)
                {
                    return true;
                }
                else
                {
                    return false;
                }
            }
            return false;
        }


        private bool TableExists(string table)
        {
            string sqlCommand = "IF EXISTS( SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = @table) SELECT CAST(1 as bit) as 'Exists' ELSE SELECT CAST(0 as BIT) as 'Exists'";

            DataTable resultTable = new DataTable();
            using (SqlConnection conn = new SqlConnection(DBConnectionManager.GetTargetConnection()))
            {
                using (SqlCommand cmd = new SqlCommand(sqlCommand, conn))
                {
                    cmd.Parameters.AddWithValue("@table", table);
                    cmd.Connection.Open();
                    resultTable.Load(cmd.ExecuteReader());
                    cmd.Connection.Close();
                }
            }
            var result = resultTable.AsEnumerable().ToArray();
            if (result.Length > 0)
            {
                DataRow resultRow = result[0];
                if ((bool)resultRow["Exists"] == true)
                {
                    return true;
                }
                else
                {
                    return false;
                }
            }
            return false;
        }
        private bool TableExists(string table, string schema = DEFAULT_DB_SCHEMA)
        {
            string sqlCommand = "IF EXISTS( SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = @table AND TABLE_SCHEMA = @schema) SELECT CAST(1 as bit) as 'Exists' ELSE SELECT CAST(0 as BIT) as 'Exists'";

            DataTable resultTable = new DataTable();
            using (SqlConnection conn = new SqlConnection(DBConnectionManager.GetTargetConnection()))
            {
                using (SqlCommand cmd = new SqlCommand(sqlCommand, conn))
                {
                    cmd.Parameters.AddWithValue("@table", table);
                    cmd.Parameters.AddWithValue("@schema", schema);
                    cmd.Connection.Open();
                    resultTable.Load(cmd.ExecuteReader());
                    cmd.Connection.Close();
                }
            }
            var result = resultTable.AsEnumerable().ToArray();
            if (result.Length > 0)
            {
                DataRow resultRow = result[0];
                if((bool)resultRow["Exists"] == true)
                {
                    return true;
                } else {
                    return false;
                }
            }
            return false;
        }

        public static string getUnescapedSchemaFromTableName(string tableName)
        {
            string schema = null;
        
            if (tableName.Contains("."))
            {
                schema = tableName.Split('.')[0];
                return DBConnectionManager.UnescapeObjectName(schema);
            }
            return schema;
        }
        public static string getUnescapedTableNameFromTableName(string tableName)
        {
            string tablename = tableName;

            if (tableName.Contains("."))
            {
                tablename = tableName.Split('.')[1];
            }
            return DBConnectionManager.UnescapeObjectName(tablename);
        }
        public bool CheckTableOrViewExists(string tableName)
        {
             
            string schema = "dbo";
            string table = tableName;
            if (tableName.Contains("."))
            {
                schema = tableName.Split('.')[0];
                table = tableName.Split('.')[1];
            }
            if (TableExists(DBConnectionManager.UnescapeObjectName(table), DBConnectionManager.UnescapeObjectName(schema)))
                return true;
            return false;
        }
        public bool CheckTableOrViewExists(string tableName,bool noSchema)
        {
            string table = tableName;
            if (TableExists(DBConnectionManager.UnescapeObjectName(table)))
                return true;
            return false;
        }

        public void CreateTable(string createSql)
        {   
            using (SqlConnection conn = new SqlConnection(DBConnectionManager.GetTargetConnection()))
            {
                using (SqlCommand cmd = new SqlCommand(createSql, conn))
                {
                    conn.Open();
                    cmd.ExecuteNonQuery();
                    cmd.Parameters.Clear();
                    cmd.Dispose();
                }
            }
        }

        public DatabaseCommandUtils(string entityname, string visibilityfield)
        {
            connection = DBConnectionManager.GetConnectionFor(entityname);
            //richiamo SP di check del campo di visibilita' e set della proprieta' isundervisibility
            if (database == "SqlServer")
            {

                using (SqlConnection PubsConn = new SqlConnection(connection))
                {
                    using (SqlCommand CMD = new SqlCommand
                      ("dbo.Magic_GetTableVisibilityStatus", PubsConn))
                    {

                        CMD.CommandType = CommandType.StoredProcedure;

                        SqlParameter tablename = CMD.Parameters.Add
                           ("@entityName", SqlDbType.VarChar);
                        tablename.Direction = ParameterDirection.Input;
                        SqlParameter tableschema = CMD.Parameters.Add
                          ("@schema", SqlDbType.VarChar);
                        tableschema.Direction = ParameterDirection.Input;
                        SqlParameter visfield = CMD.Parameters.Add
                          ("@visibilityfield", SqlDbType.VarChar);
                        visfield.Direction = ParameterDirection.Input;

                        tablename.Value = entityname.Split('.')[1];
                        tableschema.Value = entityname.Split('.')[0];
                        visfield.Value = visibilityfield;

                        SqlParameter visibilityflag = CMD.Parameters.Add
                            ("@isundervisbility", SqlDbType.Bit);
                        visibilityflag.Direction = ParameterDirection.Output;
                        //value read from web.config if null it's considered 30 (default) 
                        CMD.CommandTimeout = this.sqlCommandTimeout;
                        PubsConn.Open();

                        using (IDataReader reader = CMD.ExecuteReader())
                        {

                            this.isundervisibility = (bool)visibilityflag.Value;
                        }
                    }
                }
            }

            if (database == "Oracle")
            {

                using (OracleConnection PubsConn = new OracleConnection(connection))
                {
                    using (OracleCommand CMD = new OracleCommand
                     ("dbo.Magic_GetTableVisibilityStatus", PubsConn))
                    {
                        CMD.CommandType = CommandType.StoredProcedure;

                        OracleParameter tablename = CMD.Parameters.Add
                           ("entityName", OracleDbType.VarChar);
                        tablename.Direction = ParameterDirection.Input;
                        OracleParameter tableschema = CMD.Parameters.Add
                          ("schema", OracleDbType.VarChar);
                        tableschema.Direction = ParameterDirection.Input;
                        OracleParameter visfield = CMD.Parameters.Add
                          ("visibilityfield", OracleDbType.VarChar);
                        visfield.Direction = ParameterDirection.Input;

                        tablename.Value = entityname.Split('.')[1];
                        tableschema.Value = entityname.Split('.')[0];
                        visfield.Value = visibilityfield;

                        OracleParameter visibilityflag = CMD.Parameters.Add
                            ("isundervisbility", OracleDbType.Boolean);
                        visibilityflag.Direction = ParameterDirection.Output;



                        PubsConn.Open();

                        using (IDataReader reader = CMD.ExecuteReader())
                        {

                            this.isundervisibility = (bool)visibilityflag.Value;
                        }
                    }
                }
            }
        }
        public DatabaseCommandUtils(string entityname, string visibilityfield, string attributesGroupListfield)
        {
            connection = DBConnectionManager.GetConnectionFor(entityname);
            try
            {
                if (MFConfiguration.InstanceSettings().SQLEscapeClientInput)
                {
                    entityname = RequestParser.GetField(entityname);
                }
            }
            catch (Exception e)
            {
                MFLog.LogInFile("DatabaseCommmandUtils SQLEscapeClientInput error:" + e, MFLog.logtypes.ERROR);
                entityname = RequestParser.GetField(entityname);
            }
            // we do not need the following line here because the stored uses no dynamic sql
            // entityname = RequestParser.GetField(entityname);
            //richiamo SP di check del campo di visibilita' e set della proprieta' isundervisibility
            if (database == "SqlServer")
            {

                using (SqlConnection PubsConn = new SqlConnection(connection))
                {
                    using (SqlCommand CMD = new SqlCommand
                      ("dbo.Magic_GetTableVisibilityStatus", PubsConn))
                    {

                        CMD.CommandType = CommandType.StoredProcedure;

                        SqlParameter tablename = CMD.Parameters.Add
                           ("@entityName", SqlDbType.VarChar);
                        tablename.Direction = ParameterDirection.Input;
                        SqlParameter tableschema = CMD.Parameters.Add
                          ("@schema", SqlDbType.VarChar);
                        tableschema.Direction = ParameterDirection.Input;
                        SqlParameter visfield = CMD.Parameters.Add
                          ("@visibilityfield", SqlDbType.VarChar);
                        visfield.Direction = ParameterDirection.Input;
                        if (entityname.Split('.').Length > 1)
                        {
                            tablename.Value = entityname.Split('.')[1];
                            tableschema.Value = entityname.Split('.')[0];
                        }
                        else
                        {
                            tablename.Value = entityname;
                            tableschema.Value = DEFAULT_DB_SCHEMA;
                        }
                        visfield.Value = visibilityfield;

                        SqlParameter visibilityflag = CMD.Parameters.Add
                            ("@isundervisbility", SqlDbType.Bit);
                        visibilityflag.Direction = ParameterDirection.Output;

                        //value read from web.config if null it's considered 30 (default) 
                        CMD.CommandTimeout = this.sqlCommandTimeout;

                        PubsConn.Open();

                        using (IDataReader reader = CMD.ExecuteReader())
                        {

                            this.isundervisibility = (bool)visibilityflag.Value;
                        }

                        if (attributesGroupListfield != null)
                        {
                            visfield.Value = attributesGroupListfield;
                            using (IDataReader reader = CMD.ExecuteReader())
                            {

                                this.hasAttributeFilter = (bool)visibilityflag.Value;
                            }
                        }

                    }
                }
            }

            if (database == "Oracle")
            {

                using (OracleConnection PubsConn = new OracleConnection(connection))
                {
                    using (OracleCommand CMD = new OracleCommand
                     ("dbo.Magic_GetTableVisibilityStatus", PubsConn))
                    {
                        CMD.CommandType = CommandType.StoredProcedure;

                        OracleParameter tablename = CMD.Parameters.Add
                           ("entityName", OracleDbType.VarChar);
                        tablename.Direction = ParameterDirection.Input;
                        OracleParameter tableschema = CMD.Parameters.Add
                          ("schema", OracleDbType.VarChar);
                        tableschema.Direction = ParameterDirection.Input;
                        OracleParameter visfield = CMD.Parameters.Add
                          ("visibilityfield", OracleDbType.VarChar);
                        visfield.Direction = ParameterDirection.Input;

                        tablename.Value = entityname.Split('.')[1];
                        tableschema.Value = entityname.Split('.')[0];
                        visfield.Value = visibilityfield;

                        OracleParameter visibilityflag = CMD.Parameters.Add
                            ("isundervisbility", OracleDbType.Boolean);
                        visibilityflag.Direction = ParameterDirection.Output;



                        PubsConn.Open();

                        using (IDataReader reader = CMD.ExecuteReader())
                        {

                            this.isundervisibility = (bool)visibilityflag.Value;
                        }
                        if (attributesGroupListfield != null)
                        {
                            visfield.Value = attributesGroupListfield;
                            using (IDataReader reader = CMD.ExecuteReader())
                            {

                                this.hasAttributeFilter = (bool)visibilityflag.Value;
                            }
                        }
                    }
                }
            }
        }
        public DatabaseCommandUtils(bool noSession)
        {
        }
        public class CMDresult
        {
            public string errorId { get; set; }
            public string message { get; set; }
            public string pkValue { get; set; }
            public string msgType { get; set; }
            public bool isValidation { get; set; } = false;
			public DataSet DataSet { get; set; }
        }
        public class readresult
        {
            public DataTable table { get; set; }
            public int counter { get; set; }
            public readresult(DataTable t, int counter)
            {
                this.counter = counter;
                this.table = t;
            }

        }
        public class updateresult
        {

            public string errorId { get; set; }
            public string message { get; set; }
            public string pkValue { get; set; }
            public string commandname { get; set; }
            public string msgType { get; set; }
            public DataSet DataSet { get; set; }
            public bool isValidation { get; set; } = false;


			public updateresult(string pkVal, string errorId, string message, string commandname, string msgtype, DataSet dataSet = null, bool isValidation = false)
            {
                this.errorId = errorId;
                this.message = message;
                this.pkValue = pkVal;
                this.commandname = commandname;
                this.msgType = msgtype;
                this.DataSet = dataSet;
                this.isValidation = isValidation;
            }

            public updateresult(string pkVal, string errorId, string message, string commandname)
            {
                this.errorId = errorId;
                this.message = message;
                this.pkValue = pkVal;
                this.commandname = commandname;
            }

        }

        private void HandleCallback(IAsyncResult result)
        {
            // Retrieve the original command object, passed
            // to this procedure in the AsyncState property
            // of the IAsyncResult parameter.
            SqlCommand command = (SqlCommand)result.AsyncState;
            SqlConnection conn = command.Connection;
            try
            {
                int rowCount = command.EndExecuteNonQuery(result);
            }
            catch (Exception ex)
            {
                MFLog.LogInFile("DatabaseCommmandUtils problems handling:" + command.CommandText + ". Exception says:" + ex.Message, MFLog.logtypes.ERROR);
            }
            finally
            {
                if (conn != null)
                {
                    conn.Close();
                    conn.Dispose();
                }

            }
        }
        public void ExecuteStoredProcedureNonQueryAsync(string spName, SqlParameter[] parameters)
        {
            //int ret = -1;
            //Apre la connessione
            SqlConnection sqlConn = new SqlConnection(this.connection);
            SqlCommand cmd = new SqlCommand();

            if (parameters != null)
            {
                foreach (SqlParameter param in parameters)
                    cmd.Parameters.Add(param);
            }

            cmd.CommandText = spName;
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Connection = sqlConn;
            try
            {
                AsyncCallback callback = new AsyncCallback(HandleCallback);
                sqlConn.Open();
                cmd.BeginExecuteNonQuery(callback, cmd);

            }
            catch (ArgumentException exAE)
            {
                MFLog.LogInFile("DatabaseCommmandUtils Error launching async:" + cmd.CommandText + ". Exception says:" + exAE.Message, MFLog.logtypes.ERROR);
            }


        }
        public DataSet GetDataSet(string sqlCommand, string connectionString = null)
        {

            if (connectionString == null)
                connectionString = connection;

            DataSet ds = new DataSet();
            if (database.ToUpper() == "SQLSERVER")
            {
                using (SqlConnection conn = new SqlConnection(connectionString))
                {
                    using (SqlCommand cmd = new SqlCommand(sqlCommand, conn))
                    {
                        cmd.Connection.Open();
                        DataTable table = new DataTable();
                        //value read from web.config if null it's considered 30 (default) 
                        cmd.CommandTimeout = this.sqlCommandTimeout;
                        table.Load(cmd.ExecuteReader());
                        ds.Tables.Add(table);
                        cmd.Connection.Close();
                    }
                }
            }
            if (database.ToUpper() == "ORACLE")
            {
                using (OracleConnection conn = new OracleConnection(connectionString))
                {
                    using (OracleCommand cmd = new OracleCommand(sqlCommand, conn))
                    {
                        cmd.Connection.Open();
                        DataTable table = new DataTable();
                        cmd.CommandTimeout = this.sqlCommandTimeout;
                        table.Load(cmd.ExecuteReader());
                        ds.Tables.Add(table);
                        cmd.Connection.Close();
                    }
                }

            }
            return ds;
        }
        /// <summary>
        /// Calls a stored procedure with MF XML input and returns the whole dataSet without dynamic ordering, paging or filtering
        /// </summary>
        /// <param name="storedprocedure"></param>
        /// <param name="data">custom inputs which will be put in TAG P</param>
        /// <param name="connectionString">optional,default is the target db</param>
        /// <param name="whereCondition">optional,a where condition to be put in WHERE node of the XML</param>
        /// <returns></returns>
        public DataSet GetDataSetFromStoredProcedure(string storedprocedure, dynamic data, string connectionString = null, string whereCondition = null, int? idUser = null, int? idUserGroup = null)
        {
            DataSet tables = new DataSet();
            string error = String.Empty;

            string connection = connectionString;
            if (connection == null)
                connection = DBConnectionManager.GetConnectionFor(storedprocedure);

            using (SqlConnection con = new SqlConnection(connection))
            {
                using (SqlCommand cmd = new SqlCommand(storedprocedure, con))
                {
                    cmd.CommandTimeout = this.sqlCommandTimeout; //5 minutes by default , read by SqlCommandTimeout app setting in web.config if existing
                    cmd.CommandType = CommandType.StoredProcedure;
                    string infos = Newtonsoft.Json.JsonConvert.SerializeObject(data);
                    var xml = JsonUtils.Json2Xml(infos,
                        "read",
                        storedprocedure,
                        "0",
                        "0",
                        0,
                        1000000,
                        -1,
                        null,
                        whereCondition,
                        null,
                        -1,
                        null,
                        null,
                        null,
                        null,
                        idUser,
                        idUserGroup);
                    cmd.Parameters.Add("@XmlInput", SqlDbType.Xml).Value = xml.InnerXml;
                    SqlDataAdapter da = new SqlDataAdapter(); con.Open();
                    cmd.CommandTimeout = this.sqlCommandTimeout;
                    da.SelectCommand = cmd;
                    da.Fill(tables);
                    da.Dispose();
                }
            }
            return tables;
        }
        /// <summary>
        /// Dato un commandText e degli argomenti genera un comando di tipo TEXT (oracle o sql) con la formattazione se args != null ed esegue il commandtext passato (senza leggere i risultati)
        /// Usa la connection string che punta al DB dell' applicazione che chiama il metodo
        /// </summary>
        /// <param name="commandtext">comando, sono gestiti placeholder del tipo {arg}</param>
        /// <param name="args">lista di argomenti object per operare il format del comando</param>
        /// <returns>false if an error has occured, true otherwise</returns>
        public bool buildAndExecDirectCommandNonQuery(string commandtext, object[] args = null)
        {
            try
            {
                if (args != null)
                    commandtext = String.Format(commandtext, args);
                if (database.ToUpper() == "SQLSERVER")
                {
                    using (SqlConnection PubsConn = new SqlConnection(connection))
                    {
                        using (SqlCommand CMD = new SqlCommand
                          (commandtext, PubsConn))
                        {
                            CMD.CommandType = CommandType.Text;
                            CMD.CommandTimeout = this.sqlCommandTimeout;
                            PubsConn.Open();
                            this.setContextInfo(PubsConn);
                            CMD.ExecuteNonQuery();
                        }
                    }
                }
                if (database.ToUpper() == "ORACLE")
                {
                    using (OracleConnection PubsConn = new OracleConnection(connection))
                    {
                        using (OracleCommand CMD = new OracleCommand
                          (String.Format(commandtext, args), PubsConn))
                        {
                            CMD.CommandType = CommandType.Text;
                            PubsConn.Open();
                            CMD.ExecuteNonQuery();
                        }
                    }

                }
            }
            catch (Exception ex)
            {
                MFLog.LogInFile("buildAndExecDirectCommandNonQuery in DatabaseCommandUtils with error: " + ex.Message, MFLog.logtypes.ERROR);
                return false;
            }
            return true;
        }
        /// <summary>
        /// Dato un commandText e degli argomenti genera un comando di tipo TEXT (oracle o sql) con la formattazione se args != null ed esegue il commandtext passato (senza leggere i risultati)
        /// Usa la connection string che punta al DB dell' applicazione che chiama il metodo
        /// </summary>
        /// <param name="commandtext">comando, sono gestiti placeholder del tipo {arg}</param>
        /// <param name="args">lista di argomenti object per operare il format del comando</param>
        /// <returns>false if an error has occured, true otherwise</returns>
        public bool buildAndExecDirectCommandNonQuery(string connectionDb, string commandtext, object[] args = null)
        {
            try
            {
                if (args != null)
                    commandtext = String.Format(commandtext, args);
                if (database.ToUpper() == "SQLSERVER")
                {
                    using (SqlConnection PubsConn = new SqlConnection(connectionDb))
                    {
                        using (SqlCommand CMD = new SqlCommand
                          (commandtext, PubsConn))
                        {
                            CMD.CommandType = CommandType.Text;
                            PubsConn.Open();
                            CMD.CommandTimeout = this.sqlCommandTimeout;
                            this.setContextInfo(PubsConn);
                            CMD.ExecuteNonQuery();
                            PubsConn.Close();
                        }
                    }
                }
                if (database.ToUpper() == "ORACLE")
                {
                    using (OracleConnection PubsConn = new OracleConnection(connectionDb))
                    {
                        using (OracleCommand CMD = new OracleCommand
                          (commandtext, PubsConn))
                        {
                            CMD.CommandType = CommandType.Text;
                            PubsConn.Open();
                            CMD.ExecuteNonQuery();
                            PubsConn.Close();
                        }
                    }

                }
            }
            catch (Exception ex)
            {
                MFLog.LogInFile("buildAndExecDirectCommandNonQuery in DatabaseCommandUtils with error: " + ex.Message, MFLog.logtypes.ERROR);
                return false;
            }
            return true;
        }


        //DataFormat possible values : XML , JSON
        private string extractCommandDataFormat(string customobject, string operation, string standardcustomobject)
        {
            if (string.IsNullOrEmpty(customobject))
            {
                return "XML";
            }
            dynamic data = Newtonsoft.Json.JsonConvert.DeserializeObject<object>(customobject);//CustomJSONpar del datasource corrente
            if (operation == "export" || operation == "validation")
            {
                dynamic stddata = Newtonsoft.Json.JsonConvert.DeserializeObject<object>(standardcustomobject); //quello in MagicSolution.config
                if (data[operation] == null) //se l'export non e' esplicitato uso il web config come default per decidere se alimentare la sp con XML o JSON
                    if (stddata[operation] != null && stddata[operation].DataFormat != null)  // se lo trovo uso quello
                        return stddata[operation].DataFormat.ToString();
                    else operation = (operation == "export") ? "read" : "update"; //se non c'e' nessun tipo di setting considero il metodo di export = a quello di read
            }
            if (data[operation].DataFormat == null) // caso in cui non sia esplicitato il dataFormat uso come default il setting del web.config
            {
                data[operation].DataFormat = compressToXMLpars == true ? "XML" : "JSON";
            }
            return data[operation].DataFormat.ToString();
        }
        private bool isValidationSetUp(string customobject, string starndardcustomobject)
        {
            try
            {
                dynamic data = Newtonsoft.Json.JsonConvert.DeserializeObject<object>(customobject);
                dynamic stddata = Newtonsoft.Json.JsonConvert.DeserializeObject<object>(starndardcustomobject);
                if (data["validation"] != null || stddata["validation"] != null)
                    return true;
            }
            catch (Exception ex) {
                MFLog.LogInFile(ex);
            }
            return false;
        }
        private string extractCommandText(string customobject, string operation, string entitydefault)
        {
            if (string.IsNullOrEmpty(customobject))
            {
                return entitydefault;
            }
            dynamic data = Newtonsoft.Json.JsonConvert.DeserializeObject<object>(customobject);

            if (operation == "export" && data[operation] == null) // se non c'e' una configurazione esplicita per l' export uso i setting della read
                operation = "read";

            if (data[operation].Text == null) // caso in cui non sia esplicitato il text uso come default il FromTable della Grid
            {
                return entitydefault;
            }
            else
                return data[operation].Text.ToString();
        }
        private bool isStandardAutocompleteSelect(dynamic data, string operation)
        {
            if (operation != "export")
                if (data[operation].Definition.ToString() == "magic_autocompletestd")  //autocomplete std management
                    return true;
            return false;
        }
        private string extractCommand(string customobject, string operation, string standardcustomobject)
        {
            try
            {
                if (!string.IsNullOrEmpty(this.mergedScenario))
                {
                    //
                    var config = new MFConfiguration().GetAppSettings().MergedGrids;  // appConfig should be an instance of your Application class

                    switch (operation.ToLower())
                    {
                        case "read":
                            return config.read;
                        case "export":
                            return config.export;
                        case "create":
                            return config.create ;
                        case "update":
                            return config.update ;
                        case "delete":
                            return config.delete;
                    }
                }
            }
            catch (Exception ex)
            {
                MFLog.LogInFile($"The merged scenario {this.mergedScenario} did not correctly work. ${ex.ToString()}", MFLog.logtypes.ERROR);
            }


            if (string.IsNullOrEmpty(customobject))
            {
                return "dbo.Magic_XMLCommands_usp_sel_stmt";
            }
            dynamic data = Newtonsoft.Json.JsonConvert.DeserializeObject<object>(customobject);

            if (this.isStandardAutocompleteSelect(data,operation) == true)
            {
                 dynamic dataforautocomplete = Newtonsoft.Json.JsonConvert.DeserializeObject<object>(standardcustomobject);
                 return dataforautocomplete[operation].Definition.ToString();
            };
            if (operation == "export")
            {
                dynamic stddata = Newtonsoft.Json.JsonConvert.DeserializeObject<object>(standardcustomobject);

                if (data[operation] == null) //se non viene definito un metodo specifico cerco un metodo di export nel  config dell' istanza
                    if (stddata[operation] != null)  // se lo trovo uso quello
                        return stddata[operation].Definition.ToString();
                    else    //se non trovo nulla opero la lettura con l' oggetto definito in read
                        operation = "read";
            }
            return data[operation].Definition.ToString();
        }
        /// <summary>
        /// Gets the validation stored procedure if set in datasource or web.config
        /// </summary>
        /// <param name="customobject">the datasource CustomJSONParameter</param>
        /// <param name="standardcustomobject">the Custom JSON parameter from web.config</param>
        /// <returns></returns>
        private string extractValidationCommand(string customobject, string standardcustomobject)
        {
            try
            {
                string operation = "validation";
                dynamic data = Newtonsoft.Json.JsonConvert.DeserializeObject<object>(customobject);
                dynamic stddata = Newtonsoft.Json.JsonConvert.DeserializeObject<object>(standardcustomobject);
                if (data[operation] == null) //se non viene definito un metodo specifico cerco un metodo di export nel  config dell' istanza
                    if (stddata[operation] != null)  // se lo trovo uso quello
                        return stddata[operation].Definition.ToString();
                return data[operation].Definition.ToString();
            }
            catch
            {
                return null;
            }
        }

        public static Models.Response GetResponseFromStoredProcedureWithJsonInput(Newtonsoft.Json.Linq.JObject jObject, string commandname)
        {
            XmlDocument xml = MagicFramework.Helpers.JsonUtils.Json2Xml(jObject.ToString());
            return GetResponseFromStoredProcedureWithXmlInput(xml, commandname);
        }

        public static Models.Response GetResponseFromStoredProcedureWithXmlInput(XmlDocument xml, string commandname)
        {
            var handler = new MagicFramework.Helpers.DatabaseCommandUtils();
            var dbres = handler.callStoredProcedurewithXMLInput(xml, commandname);
            var result = dbres.table.AsEnumerable().ToArray();
            if (result.Length > 0)
                result = result.Take(1).ToArray();
            return new Models.Response(result, dbres.counter);
        }

        public readresult callStoredProcedurewithXMLInput(XmlDocument xml, string commandname)
        {
            try
            {
                DataTable table = new DataTable();
                int counter = 0;


                if (database == "SqlServer")
                {

                    using (SqlConnection PubsConn = new SqlConnection(connection))
                    {
                        using (SqlCommand CMD = new SqlCommand
                          (commandname, PubsConn))
                        {

                            CMD.CommandType = CommandType.StoredProcedure;

                            SqlParameter xmlinput = CMD.Parameters.Add
                              ("@xmlInput", SqlDbType.Xml);
                            xmlinput.Value = xml.InnerXml;

                            SqlParameter count = CMD.Parameters.Add
                                ("@count", SqlDbType.Int);
                            count.Direction = ParameterDirection.Output;
                            CMD.CommandTimeout = this.sqlCommandTimeout;
                            PubsConn.Open();
                            if (SessionHandler.CheckActiveSession())
                                this.setContextInfo(PubsConn, CMD);
                            using (IDataReader reader = CMD.ExecuteReader())
                            {
                                table.Load(reader);
                                counter = int.Parse(count.Value.ToString());
                            }
                        }
                    }
                }
                else if (database == "Oracle")
                {

                    using (OracleConnection PubsConn = new OracleConnection(connection))
                    {
                        using (OracleCommand CMD = new OracleCommand
                         (commandname, PubsConn))
                        {
                            CMD.CommandType = CommandType.StoredProcedure;
                            OracleParameter xmlinput = CMD.Parameters.Add
                               ("@xmlInput", OracleDbType.Xml);
                            xmlinput.Value = xml.InnerXml;


                            OracleParameter count = CMD.Parameters.Add
                                   ("count", SqlDbType.Int);
                            count.Direction = ParameterDirection.Output;
                            CMD.CommandTimeout = this.sqlCommandTimeout;
                            PubsConn.Open();


                            using (IDataReader reader = CMD.ExecuteReader())
                            {
                                table.Load(reader);
                                counter = int.Parse(count.Value.ToString());
                            }
                        }
                    }
                }

                return new readresult(table, counter);
            }
            catch (Exception ex)
            {
                string exceptionMessage = ex.Message;
                if (!SessionHandler.UserIsDeveloper)
                {
                   
                    bool managedException = HasManagedExceptionFormat(ex.Message);
                    if (managedException)
                    {
                        throw new System.ArgumentException(ex.Message);
                    }
                    else
                        exceptionMessage = "An error has occured";

                    MFLog.LogInFile(ex, MFLog.logtypes.ERROR);
                   
                }
                throw new System.ArgumentException(exceptionMessage);
            }


        }
        /// <summary>
        /// in caso di errId = -1 restituisce il msgtype = "WARN" in caso di warning ed il message corrispondente, in caso di errId = 0 viene interpretato come un OK, in altri casi come errore
        /// </summary>
        /// <param name="xml"></param>
        /// <param name="commandname"></param>
        /// <returns></returns>
        public updateresult callStoredProcedurewithXMLInputwithOutputPars(XmlDocument xml, string commandname)
        {
            //try
            //{
                DataTable table = new DataTable();
                String pk = String.Empty;
                String errorId = String.Empty;
                String message = String.Empty;

                if (database == "SqlServer")
                {

                    using (SqlConnection PubsConn = new SqlConnection(connection))
                    {
                        using (SqlCommand CMD = new SqlCommand
                          (commandname, PubsConn))
                        {

                            CMD.CommandType = CommandType.StoredProcedure;

                            SqlParameter xmlinput = CMD.Parameters.Add
                              ("@xmlInput", SqlDbType.Xml);
                            xmlinput.Value = xml.InnerXml;
                            SqlParameter output1 = CMD.Parameters.Add
                                ("@pkValueOut", SqlDbType.VarChar, 50);
                            output1.Direction = ParameterDirection.Output;
                            SqlParameter output2 = CMD.Parameters.Add
                                ("@msg", SqlDbType.VarChar, 4000);
                            output2.Direction = ParameterDirection.Output;
                            SqlParameter output3 = CMD.Parameters.Add
                                ("@errId", SqlDbType.Int);
                            output3.Direction = ParameterDirection.Output;
                            CMD.CommandTimeout = this.sqlCommandTimeout;
                            PubsConn.Open();
                            this.setContextInfo(PubsConn, CMD);
                            CMD.ExecuteNonQuery();
                            pk = output1.Value.ToString();
                            message = output2.Value.ToString();
                            errorId = output3.Value.ToString();
                        }
                    }
                }

                if (database == "Oracle")
                {

                    using (OracleConnection PubsConn = new OracleConnection(connection))
                    {
                        using (OracleCommand CMD = new OracleCommand
                         (commandname, PubsConn))
                        {
                            CMD.CommandType = CommandType.StoredProcedure;
                            OracleParameter xmlinput = CMD.Parameters.Add
                               ("@xmlInput", OracleDbType.Xml);
                            xmlinput.Value = xml.InnerXml;


                            OracleParameter output1 = CMD.Parameters.Add
                               ("@pkValueOut", OracleDbType.VarChar, 50);
                            output1.Direction = ParameterDirection.Output;
                            OracleParameter output2 = CMD.Parameters.Add
                                ("@msg", OracleDbType.VarChar, 4000);
                            output2.Direction = ParameterDirection.Output;
                            OracleParameter output3 = CMD.Parameters.Add
                                ("@errId", OracleDbType.Integer);
                            output3.Direction = ParameterDirection.Output;
                            CMD.CommandTimeout = this.sqlCommandTimeout;
                            PubsConn.Open();
                            CMD.ExecuteNonQuery();
                            pk = output1.Value.ToString();
                            message = output2.Value.ToString();
                            errorId = output3.Value.ToString();

                        }
                    }
                }

                if (errorId == "-1")
                    return new updateresult(pk, errorId, message, commandname, "WARN");

                CheckManagedException(errorId, message);

                return new updateresult(pk, errorId, message, commandname);
            //}
            //catch (Exception ex)
            //{
            //    MFLog.LogInFile(ex, MFLog.logtypes.ERROR);
            //    string exceptionMessage = ex.Message;
            //    if (!SessionHandler.UserIsDeveloper)
            //    {
            //        exceptionMessage = "An error has occured";
            //        MFLog.LogInFile(ex, MFLog.logtypes.ERROR);

            //    }
            //    throw new System.ArgumentException(exceptionMessage);
            //}


        }
        /// <summary>
        /// proveds ordering for standard autocomplete select
        /// </summary>
        /// <param name="commandname">must be Definition = magicautocomplete_std</param>
        /// <param name="columnlist">the key and descriptive field comma separated</param>
        /// <returns></returns>
        private string overrideStandardAutocompleteOrdering(string customobject,string operation,string columnlist,string orderby)
        {
            if (string.IsNullOrEmpty(customobject))
            {
                return orderby;
            }

            dynamic data = Newtonsoft.Json.JsonConvert.DeserializeObject<object>(customobject);
          
            if (this.isStandardAutocompleteSelect(data, operation) == true && orderby == "1" && !String.IsNullOrEmpty(columnlist))
            {
                var vet = columnlist.Split(',');
                if (vet.Count() > 1)
                    orderby = vet[1];
            };
            return orderby;

        }
        

        /// <summary>
        /// lancia un metodo/query sul DB (commandname) che deve tornare un ed un solo recordset ed il relativo counter di righe 
        /// </summary>
        /// <param name="entityname"></param>
        /// <param name="layer"></param>
        /// <param name="skip"></param>
        /// <param name="take"></param>
        /// <param name="commandname"></param>
        /// <param name="wherecondition"></param>
        /// <param name="orderby"></param>
        /// <param name="functionid"></param>
        /// <param name="columnlist"></param>
        /// <param name="isExport"> e' vero se la lettura e' finalizzata all'  export su file</param>
        /// <returns></returns>
        public readresult getGenericControllerReader(string entityname, int layer, int skip, int take, string commandname, string wherecondition, string orderby, int functionid, string columnlist, string jsonfilter, bool isExport, string pkname, string data, string[] groupBy = null, MagicFramework.Models.Aggregations[] aggregations = null)
        {
            try
            {
                //generic request for credential related tables
                bool isreserved = DBConnectionManager.IsCredentialInfo(entityname);
                if (isreserved == true)
                {
                    //asks the database if the user is authorized to browse credential infos. Default enabled users are developer and admin profiles.
                    SystemRightsChecker.checkSystemRights("selectCredentials");
                }

                DataTable table = new DataTable();
                int counter = 0;
                int userid = MagicFramework.Helpers.SessionHandler.IdUser;
                int businessunit = MagicFramework.Helpers.SessionHandler.UserVisibilityGroup;
                string listofBusinessObjectsAttributefilters = String.Empty;
                if (this.hasAttributeFilter && !String.IsNullOrEmpty(pkname)) // testo se esiste il campo con la lista dei gruppi esplosi e la pk deve essere definita nella griglia 
                {
                    listofBusinessObjectsAttributefilters = MagicFramework.UserVisibility.UserVisibiltyInfo.getGroupParentsTreeWithFilterProperty(businessunit.ToString());
                    if (listofBusinessObjectsAttributefilters != String.Empty)
                    {
                        string groupVisibilityField = ApplicationSettingsManager.GetVisibilityField();
                        string attributesGroupListField = ApplicationSettingsManager.GetBOAttributeGroupVisibilityField();
                        string businessObjectsVisibilitySolverFunction = ApplicationSettingsManager.GetBOAttributeVisibilitySolverFunction();
                        wherecondition = MagicFramework.UserVisibility.UserVisibiltyInfo.appendBusinessObjectAttributeFilterToWhereCondition(listofBusinessObjectsAttributefilters, attributesGroupListField, pkname, businessObjectsVisibilitySolverFunction, wherecondition, groupVisibilityField);
                    }
                }
                //filtro la visibilita' in OR sui gruppi di utenti solo se non ci sono sul ramo in esame filtri sulle proprieta' dei Business Objects (es. Proprieta' Asset = 'Fondo1')
                if (this.isundervisibility == true && String.IsNullOrEmpty(listofBusinessObjectsAttributefilters))
                    wherecondition = MagicFramework.UserVisibility.UserVisibiltyInfo.getWhereCondition(entityname.Split('.')[1], wherecondition);
                wherecondition = wherecondition.Replace("&&", "AND");
                wherecondition = wherecondition.Replace("||", "OR");
                string standardJsonParam = ApplicationSettingsManager.GetDefaultCustomJsonParameter();
                string operation = (isExport == false ? "read" : "export");
                string inputType = extractCommandDataFormat(commandname, operation, standardJsonParam);
                string cmdtext = extractCommandText(commandname, operation, entityname);
                orderby = overrideStandardAutocompleteOrdering(commandname, operation, columnlist, orderby);
                
                this.addMergedScenario(data);

                if (database == "SqlServer")
                {
                    using (SqlConnection PubsConn = new SqlConnection(connection))
                    {
                        using (SqlCommand CMD = new SqlCommand
                          (extractCommand(commandname,operation,standardJsonParam),PubsConn))
                        {
                            CMD.CommandType = CommandType.StoredProcedure;
                            //se il DataFormat nel CustomJSONParam non e' specificato uso il valore presente nel web.config
                            buildCommandInputforSelect(CMD, compressToXMLpars, inputType, "read", cmdtext, "0", layer, functionid, columnlist, wherecondition, orderby, jsonfilter, skip, take, data, groupBy, aggregations,pkname);

                            SqlParameter count = CMD.Parameters.Add
                                   ("@count", SqlDbType.Int);
                            count.Direction = ParameterDirection.Output;
                            CMD.CommandTimeout = this.sqlCommandTimeout;
                            PubsConn.Open();
                            this.setContextInfo(PubsConn,CMD);
                            using (IDataReader reader = CMD.ExecuteReader())
                            {
                                table.Load(reader);
                                try
                                {
                                    counter = int.Parse(count.Value.ToString());
                                }
                                catch (Exception ex)
                                {
                                    counter = 0;
                                    MFLog.LogInFile("Counter has not been returned from " + commandname + ":" + ex.Message, MFLog.logtypes.WARN);
                                }
                            }
                        }
                    }
                }

                if (database == "Oracle")
                {

                    using (OracleConnection PubsConn = new OracleConnection(connection))
                    {
                        using (OracleCommand CMD = new OracleCommand
                         (extractCommand(commandname, operation, standardJsonParam), PubsConn))
                        {
                            CMD.CommandType = CommandType.StoredProcedure;
                            //se il DataFormat nel CustomJSONParam non e' specificato uso il valore presente nel web.config
                            buildCommandInputforSelect(CMD, compressToXMLpars, inputType, "read", cmdtext, "0", layer, functionid, columnlist, wherecondition, orderby, jsonfilter, skip, take, data);

                            OracleParameter count = CMD.Parameters.Add
                                   ("@count", OracleDbType.Integer);
                            count.Direction = ParameterDirection.Output;

                            PubsConn.Open();
                            using (IDataReader reader = CMD.ExecuteReader())
                            {
                                table.Load(reader);
                                try
                                {
                                    counter = int.Parse(count.Value.ToString());
                                }
                                catch (Exception ex) {
                                    counter = 0;
                                    MFLog.LogInFile("Counter has not been returned from "+commandname+":" + ex.Message, MFLog.logtypes.WARN);
                                }
                            }
                        }
                    }
                }

                return new readresult(table, counter);
            }
            catch (Exception ex)
            {
                //throw new System.ArgumentException("getGenericControllerReader:: " + ex.Message);
                throw new System.ArgumentException(ex.Message);
            }
        }

        #region command builder
        private SqlCommand buildCommandInputforSelect(SqlCommand CMD, bool compressToXML, string inputType, string operation, string entityname, string id, int layer, int functionid, string columnlist, string wherecondition, string orderby, string jsonfilter, int skip, int take, string data, string[] groupBy, MagicFramework.Models.Aggregations[] aggregations,string pkname = "")
        {
            try
            {
                if (MFConfiguration.InstanceSettings().SQLEscapeClientInput)
                {
                    entityname = RequestParser.GetField(entityname);
                    pkname = string.IsNullOrEmpty(pkname) ? pkname : RequestParser.GetField(pkname);
                    groupBy = groupBy?.Select(g => RequestParser.GetField(g)).ToArray();
                    aggregations = RequestParser.SanitizeAggregations(aggregations);
                }
            }
            catch (Exception e)
            {
                MFLog.LogInFile("DatabaseCommmandUtils SQLEscapeClientInput error:" + e, MFLog.logtypes.ERROR);
                entityname = RequestParser.GetField(entityname);
                pkname = string.IsNullOrEmpty(pkname) ? pkname : RequestParser.GetField(pkname);
                groupBy = groupBy?.Select(g => RequestParser.GetField(g)).ToArray();
                aggregations = RequestParser.SanitizeAggregations(aggregations);
            }

            string dataToPost = data == null ? "{x:1}" : data;
            if (inputType == "XML") //default if not specified
            {
                var xml = JsonUtils.Json2Xml(dataToPost, operation, entityname, "0", "0", skip, take, layer, columnlist, wherecondition, orderby, functionid, jsonfilter, null, groupBy, aggregations,null,null,pkname);
                SqlParameter xmlinput = CMD.Parameters.Add
                   ("@xmlInput", SqlDbType.Xml);
                xmlinput.Value = xml.InnerXml;
            }
            else
                if (inputType == "XMLSTRING")
                {
                    string xmlstring = JsonUtils.Json2XmlString(dataToPost, operation, entityname, "0", "0", skip, take, layer, columnlist, wherecondition, orderby, functionid, jsonfilter, null);
                    SqlParameter xmlinput = CMD.Parameters.Add
                       ("@xmldata", SqlDbType.NText);
                    xmlinput.Value = xmlstring;
                }
                else
                {  //JSON
                    SqlParameter tablename = CMD.Parameters.Add
                                 ("@entityName", SqlDbType.VarChar);
                    SqlParameter funcid = CMD.Parameters.Add
                      ("@functionid", SqlDbType.Int);
                    tablename.Direction = ParameterDirection.Input;
                    SqlParameter userId = CMD.Parameters.Add
                      ("@userId", SqlDbType.Int);
                    userId.Direction = ParameterDirection.Input;
                    SqlParameter wherecond = CMD.Parameters.Add
                      ("@whereCondition", SqlDbType.VarChar, 4000);
                    wherecond.Direction = ParameterDirection.Input;
                    SqlParameter orderbylist = CMD.Parameters.Add
                       ("@orderBy", SqlDbType.VarChar, 4000);
                    orderbylist.Direction = ParameterDirection.Input;
                    SqlParameter businessun = CMD.Parameters.Add
                         ("@businessUnit", SqlDbType.Int);
                    businessun.Direction = ParameterDirection.Input;
                    SqlParameter collist = CMD.Parameters.Add
                       ("@columnlist", SqlDbType.VarChar, 4000);
                    collist.Direction = ParameterDirection.Input;
                    SqlParameter skiprow = CMD.Parameters.Add
                        ("@skip", SqlDbType.Int);
                    skiprow.Direction = ParameterDirection.Input;
                    SqlParameter takerow = CMD.Parameters.Add
                        ("@take", SqlDbType.Int);
                    takerow.Direction = ParameterDirection.Input;
                    SqlParameter layerid = CMD.Parameters.Add
                        ("@layerid", SqlDbType.Int);
                    layerid.Direction = ParameterDirection.Input;

                    tablename.Value = entityname;
                    funcid.Value = functionid;
                    userId.Value = MagicFramework.Helpers.SessionHandler.IdUser;
                    wherecond.Value = wherecondition;
                    orderbylist.Value = orderby;
                    businessun.Value = MagicFramework.Helpers.SessionHandler.UserVisibilityGroup;
                    columnlist = columnlist == null ? "*" : columnlist;
                    collist.Value = columnlist;
                    skiprow.Value = skip;
                    takerow.Value = take;
                    layerid.Value = layer;


                }
            return CMD;
        }

        private OracleCommand buildCommandInputforSelect(OracleCommand CMD, bool compressToXML, string inputType, string operation, string entityname, string id, int layer, int functionid, string columnlist, string wherecondition, string orderby, string jsonfilter, int skip, int take, string data)
        {
            if (inputType == "XML") //default if not specified
            {
                string dataToPost = data == null ? "{x:1}" : data;
                var xml = JsonUtils.Json2Xml(dataToPost, operation, entityname, "0", "0", skip, take, layer, columnlist, wherecondition, orderby, functionid, jsonfilter, null);
                OracleParameter xmlinput = CMD.Parameters.Add
                   ("@xmlInput", OracleDbType.Xml);
                xmlinput.Value = xml.InnerXml;

            }
            else
                if (inputType == "XMLSTRING")
                {
                    string xmlstring = JsonUtils.Json2XmlString("{x:1}", operation, entityname, "0", "0", skip, take, layer, columnlist, wherecondition, orderby, functionid, jsonfilter, null);
                    OracleParameter xmlinput = CMD.Parameters.Add
                       ("@xmldata", SqlDbType.NText);
                    xmlinput.Value = xmlstring;

                }
                else
                {  //JSON
                    OracleParameter tablename = CMD.Parameters.Add
                                 ("@entityName", SqlDbType.VarChar);
                    OracleParameter funcid = CMD.Parameters.Add
                      ("@functionid", OracleDbType.Integer);
                    tablename.Direction = ParameterDirection.Input;
                    OracleParameter userId = CMD.Parameters.Add
                      ("@userId", OracleDbType.Integer);
                    userId.Direction = ParameterDirection.Input;
                    OracleParameter wherecond = CMD.Parameters.Add
                      ("@whereCondition", OracleDbType.VarChar, 4000);
                    wherecond.Direction = ParameterDirection.Input;
                    OracleParameter orderbylist = CMD.Parameters.Add
                       ("@orderBy", OracleDbType.VarChar, 4000);
                    orderbylist.Direction = ParameterDirection.Input;
                    OracleParameter businessun = CMD.Parameters.Add
                         ("@businessUnit", OracleDbType.Integer);
                    businessun.Direction = ParameterDirection.Input;
                    OracleParameter collist = CMD.Parameters.Add
                       ("@columnlist", OracleDbType.VarChar, 4000);
                    collist.Direction = ParameterDirection.Input;
                    OracleParameter skiprow = CMD.Parameters.Add
                        ("@skip", OracleDbType.Integer);
                    skiprow.Direction = ParameterDirection.Input;
                    OracleParameter takerow = CMD.Parameters.Add
                        ("@take", OracleDbType.Integer);
                    takerow.Direction = ParameterDirection.Input;
                    OracleParameter layerid = CMD.Parameters.Add
                        ("@layerid", OracleDbType.Integer);
                    layerid.Direction = ParameterDirection.Input;

                    tablename.Value = entityname;
                    funcid.Value = functionid;
                    userId.Value = MagicFramework.Helpers.SessionHandler.IdUser;
                    wherecond.Value = wherecondition;
                    orderbylist.Value = orderby;
                    businessun.Value = MagicFramework.Helpers.SessionHandler.UserVisibilityGroup;
                    columnlist = columnlist == null ? "*" : columnlist;
                    collist.Value = columnlist;
                    skiprow.Value = skip;
                    takerow.Value = take;
                    layerid.Value = layer;


                }
            return CMD;
        }


        private SqlCommand buildCommandInput(SqlCommand CMD, bool compressToXML, string inputType, dynamic data, string operation, string entityname, string id, int layer, int functionid)
        {
            try
            {
                if (MFConfiguration.InstanceSettings().SQLEscapeClientInput)
                {
                    entityname = RequestParser.GetField(entityname);
                    if (!string.IsNullOrEmpty(id))
                        id = RequestParser.GetValue(id);
                }
            }
            catch (Exception e)
            {
                MFLog.LogInFile("DatabaseCommmandUtils SQLEscapeClientInput error:" + e, MFLog.logtypes.ERROR);
                //entityname = RequestParser.GetField(entityname);
                //id = RequestParser.GetValue(id);
            }

            string infos = Newtonsoft.Json.JsonConvert.SerializeObject(data);
            if (inputType == "XML") //default if not specified
            {

                data.cfgDataSourceCustomParam = "";

                dynamic model = null;

                if (data.cfgModel != null)
                    model = data.cfgModel;
                string wherecondition = null;
                try
                {
                    if (data.filter != null)
                    {
                        dynamic filterdata = data.filter;
                        Models.Request req = new Models.Request();
                        req.Model = Newtonsoft.Json.JsonConvert.SerializeObject(data.cfgModel);
                        req.filter = new Filters(filterdata);
                        RequestParser rp = new RequestParser(req);
                        wherecondition = rp.BuildWhereCondition(true);
                    }
                }
                catch (Exception ex) {
                    MFLog.LogInFile(ex.Message,MFLog.logtypes.ERROR);
                }

                var xml = JsonUtils.Json2Xml(infos, operation, entityname, id, id, 0, 0, layer, null, wherecondition, null, functionid, null, model);
                SqlParameter xmlinput = CMD.Parameters.Add
                   ("@xmlInput", SqlDbType.Xml);
                xmlinput.Value = xml.InnerXml;
            }
            else
                if (inputType == "XMLSTRING")
                {
                    data.cfgDataSourceCustomParam = "";
                    dynamic model = null;

                    if (data.cfgModel != null)
                        model = data.cfgModel;
                    string xmlstring = JsonUtils.Json2XmlString(infos, operation, entityname, id, id, 0, 0, layer, null, null, null, functionid, null, model);
                    SqlParameter xmlinput = CMD.Parameters.Add
                       ("@xmldata", SqlDbType.NText);
                    xmlinput.Value = xmlstring;

                }
                else
                {  //JSON
                    SqlParameter datafromclient = CMD.Parameters.Add
                       ("@data", SqlDbType.VarChar);
                    SqlParameter tablename = CMD.Parameters.Add
                       ("@entityName", SqlDbType.VarChar);
                    SqlParameter funcid = CMD.Parameters.Add
                      ("@functionid", SqlDbType.Int);
                    tablename.Direction = ParameterDirection.Input;
                    SqlParameter userId = CMD.Parameters.Add
                      ("@userId", SqlDbType.Int);
                    userId.Direction = ParameterDirection.Input;
                    SqlParameter businessun = CMD.Parameters.Add
                         ("@businessUnit", SqlDbType.Int);
                    businessun.Direction = ParameterDirection.Input;
                    SqlParameter layerid = CMD.Parameters.Add
                        ("@layerid", SqlDbType.Int);
                    SqlParameter objid = CMD.Parameters.Add
                        ("@id", SqlDbType.VarChar);
                    SqlParameter action = CMD.Parameters.Add
                        ("@action", SqlDbType.VarChar);

                    layerid.Direction = ParameterDirection.Input;
                    tablename.Value = entityname;
                    userId.Value = MagicFramework.Helpers.SessionHandler.IdUser;
                    businessun.Value = MagicFramework.Helpers.SessionHandler.UserVisibilityGroup;
                    funcid.Value = functionid;
                    layerid.Value = layer;
                    string clientdata = infos;
                    //metto il doppio apice al posto del singolo apice per mandare un parametro corretto a SQL 
                    clientdata = clientdata.Replace("'", "''");
                    datafromclient.Value = clientdata;
                    action.Value = operation;
                    objid.Value = id;
                }
            return CMD;
        }

        private CMDresult fillresult(CMDresult result, string output1, string pk)
        {
            if (String.IsNullOrEmpty(output1))
            {
                result.errorId = "0";
                result.message = "OK";
                result.pkValue = pk;
            }
            else
            {
                //setto ad  errore 
                result.errorId = "1";
                foreach (var x in XElement.Parse(output1).Descendants())
                {
                    if (x.Name.ToString() == "LEVEL")
                        if (x.Value.ToString() == "1") //e' solo  un warning rimetto l' errore a 0 
                        {
                            result.errorId = "0";
                            result.msgType = "WARN";
                            result.pkValue = pk;
                        }
                    result.message += x.Name.ToString() + " :: " + x.Value.ToString() + "\n";
                }
            }
            return result;
        }

        private void parsewarning(CMDresult result)
        {
            try
            { // expected { "type":"WARN\ERR\OK", "content":"message content" }
                dynamic msg = Newtonsoft.Json.JsonConvert.DeserializeObject(result.message);
                result.message = msg.content;
                result.msgType = msg.type;
                //per il client non e' un errore
                if (result.msgType == "WARN")
                {
                    result.errorId = "0";
                }

            }
            catch
            {

            }

        }

        private CMDresult execCommand(SqlCommand CMD, string inputType, SqlConnection PubsConn)
        {
            CMDresult result = new CMDresult();
            if (inputType == "XML" || inputType == null || inputType == "JSON")
            {
                SqlParameter output1 = CMD.Parameters.Add
                    ("@pkValueOut", SqlDbType.VarChar, 50);
                output1.Direction = ParameterDirection.Output;
                SqlParameter output2 = CMD.Parameters.Add
                    ("@msg", SqlDbType.VarChar, 4000);
                output2.Direction = ParameterDirection.Output;
                SqlParameter output3 = CMD.Parameters.Add
                    ("@errId", SqlDbType.Int);
                output3.Direction = ParameterDirection.Output;

                CMD.CommandTimeout = this.sqlCommandTimeout;
                
                PubsConn.Open();
                this.setContextInfo(PubsConn, CMD);

                DataSet dataset = new DataSet();
                SqlDataAdapter adapter = new SqlDataAdapter();
                adapter.SelectCommand = CMD;
                adapter.Fill(dataset);
                result.DataSet = dataset;

                result.errorId = output3.Value.ToString();
                result.message = output2.Value.ToString();
                result.pkValue = output1.Value.ToString();

                parsewarning(result);

            }
            else //metodi Biz Sharp XMLSTRING
            {
                SqlParameter output1 = CMD.Parameters.Add
                  ("@xmlout", SqlDbType.NVarChar, 4000);
                output1.Direction = ParameterDirection.Output;
                CMD.CommandTimeout = this.sqlCommandTimeout;
                PubsConn.Open();
                var retobj = CMD.ExecuteScalar();

                string pk = retobj == null ? "0" : retobj.ToString();
                result = fillresult(result, output1.Value.ToString(), pk);

            }

            return result;
        }


        private OracleCommand buildCommandInput(OracleCommand CMD, bool compressToXML, string inputType, dynamic data, string operation, string entityname, string id, int layer, int functionid)
        {
            string infos = Newtonsoft.Json.JsonConvert.SerializeObject(data);
            if (inputType == "XML") //default if not specified
            {
                data.cfgDataSourceCustomParam = "";

                dynamic model = null;

                if (data.cfgModel != null)
                    model = data.cfgModel;

                var xml = JsonUtils.Json2Xml(infos, operation, entityname, id, id, 0, 0, layer, null, null, null, functionid, null, model);
                OracleParameter xmlinput = CMD.Parameters.Add
                   ("@xmlInput", OracleDbType.Xml);
                xmlinput.Value = xml.InnerXml;
            }
            else
                if (inputType == "XMLSTRING")
                {


                    data.cfgDataSourceCustomParam = "";
                    dynamic model = null;

                    if (data.cfgModel != null)
                        model = data.cfgModel;

                    string xmlstring = JsonUtils.Json2XmlString(infos, operation, entityname, id, id, 0, 0, layer, null, null, null, functionid, null, model);
                    OracleParameter xmlinput = CMD.Parameters.Add
                       ("@xmldata", OracleDbType.NVarChar);
                    xmlinput.Value = xmlstring;

                }
                else
                {  //JSON
                    OracleParameter datafromclient = CMD.Parameters.Add
                       ("@data", OracleDbType.VarChar);
                    OracleParameter tablename = CMD.Parameters.Add
                       ("@entityName", OracleDbType.VarChar);
                    OracleParameter funcid = CMD.Parameters.Add
                      ("@functionid", OracleDbType.Integer);
                    tablename.Direction = ParameterDirection.Input;
                    OracleParameter userId = CMD.Parameters.Add
                      ("@userId", OracleDbType.Integer);
                    userId.Direction = ParameterDirection.Input;
                    OracleParameter businessun = CMD.Parameters.Add
                         ("@businessUnit", OracleDbType.Integer);
                    businessun.Direction = ParameterDirection.Input;
                    OracleParameter layerid = CMD.Parameters.Add
                        ("@layerid", OracleDbType.Integer);
                    OracleParameter objid = CMD.Parameters.Add
                        ("@id", OracleDbType.VarChar);
                    OracleParameter action = CMD.Parameters.Add
                        ("@action", OracleDbType.VarChar);

                    layerid.Direction = ParameterDirection.Input;
                    tablename.Value = entityname;
                    userId.Value = MagicFramework.Helpers.SessionHandler.IdUser;
                    businessun.Value = MagicFramework.Helpers.SessionHandler.UserVisibilityGroup;
                    funcid.Value = functionid;
                    layerid.Value = layer;
                    string clientdata = infos;
                    //metto il doppio apice al posto del singolo apice per mandare un parametro corretto a SQL 
                    clientdata = clientdata.Replace("'", "''");
                    datafromclient.Value = clientdata;
                    action.Value = operation;
                    objid.Value = id;
                }
            return CMD;
        }

        private CMDresult execCommand(OracleCommand CMD, string inputType, OracleConnection PubsConn)
        {
            CMDresult result = new CMDresult();
            if (inputType == "XML" || inputType == null || inputType == "JSON")
            {
                OracleParameter output1 = CMD.Parameters.Add
                    ("@pkValueOut", OracleDbType.VarChar, 50);
                output1.Direction = ParameterDirection.Output;
                OracleParameter output2 = CMD.Parameters.Add
                    ("@msg", OracleDbType.VarChar, 4000);
                output2.Direction = ParameterDirection.Output;
                OracleParameter output3 = CMD.Parameters.Add
                    ("@errId", OracleDbType.Integer);
                output3.Direction = ParameterDirection.Output;

                CMD.CommandTimeout = this.sqlCommandTimeout;
                PubsConn.Open();
                DataTable dt = new DataTable();
                dt.Load(CMD.ExecuteReader());
                result.errorId = output3.Value.ToString();
                result.message = output2.Value.ToString();
                result.pkValue = output1.Value.ToString();

                parsewarning(result);
            }
            else
            {
                OracleParameter output1 = CMD.Parameters.Add
                  ("@xmlout", OracleDbType.NVarChar, 4000);
                output1.Direction = ParameterDirection.Output;
                PubsConn.Open();
                var retobj = CMD.ExecuteScalar();
                string pk = retobj == null ? "0" : retobj.ToString();
                result = fillresult(result, output1.Value.ToString(), pk);
            }

            return result;
        }
        #endregion
        /// <summary>
        /// lancia la stored JSON che va dinamicamente ad inserire o ad aggiornare i dati JSON sulla corrispondente entity DB relazionale (Oracle o Sql server)
        /// </summary>
        /// <param name="entityname"></param>
        /// <param name="operation">create,update</param>
        public updateresult execUpdateInsertDirect(string entityname, string operation, dynamic data, string id)
        {
            CMDresult result = new CMDresult();
            string errorId = String.Empty;
            string message = String.Empty;
            string pk = String.Empty;
            string commandname = "dbo.Magic_Cmnds_ins_upd_del_stmt";
            try
            {
                if (database == "SqlServer")
                {

                    using (SqlConnection PubsConn = new SqlConnection(connection))
                    {
                        using (SqlCommand CMD = new SqlCommand
                          (commandname, PubsConn))
                        {
                            CMD.CommandType = CommandType.StoredProcedure;
                            buildCommandInput(CMD, compressToXMLpars, "JSON", data, operation, entityname, id, -1, -1);
                            result = execCommand(CMD, "JSON", PubsConn);
                        }
                    }
                }
                if (database == "Oracle")
                {

                    using (OracleConnection PubsConn = new OracleConnection(connection))
                    {
                        using (OracleCommand CMD = new OracleCommand
                         (commandname, PubsConn))
                        {
                            CMD.CommandType = CommandType.StoredProcedure;
                            buildCommandInput(CMD, compressToXMLpars, "JSON", data, operation, entityname, id, -1, -1);
                            result = execCommand(CMD, "JSON", PubsConn);
                        }
                    }
                }
                pk = result.pkValue;
                message = result.message;
                errorId = result.errorId;

                //se ci sono errori scateno l' eccezione
                if (errorId != "0")
                    throw new System.ArgumentException(message);

                return new updateresult(pk, errorId, message, commandname, result.msgType);
            }
            catch (Exception ex)
            {
                throw new System.ArgumentException(ex.Message);
            }
        }


        public CMDresult Validate(dynamic data)
        {
            if (database == "SqlServer")
            {
                string commandname = data.cfgDataSourceCustomParam;
                string operation = data.cfgoperation;
                string entityname = data.cfgEntityName;
                string pkname = data.cfgpkName;
                string id = operation != "customaction" ? data[pkname] : "0";
                int layer = 0;
                int.TryParse(data.cfglayerID.ToString(), out layer);
                int functionid = data.cfgfunctionID;
                string standardJsonParam = ApplicationSettingsManager.GetDefaultCustomJsonParameter();
                string inputType = extractCommandDataFormat(commandname, operation, standardJsonParam);
                using (SqlConnection PubsConn = new SqlConnection(connection))
                {
                    if (isValidationSetUp(commandname, standardJsonParam))
                        using (SqlCommand CMDVALIDATE = new SqlCommand
                          (extractValidationCommand(commandname, standardJsonParam), PubsConn))
                        {
                            string validationInputType = extractCommandDataFormat(commandname, "validation", standardJsonParam);
                            CMDVALIDATE.CommandType = CommandType.StoredProcedure;
                            //estrae il nome dell' entita' da passare alle stored che e' nel campo Text del JSON del CustomJsonParam del DataSource.
                            //Fa riferimento alla proprieta' Text dell' operazione di scrittura "originale", validation non ha un Text autonomo
                            string cmdtext = extractCommandText(commandname, operation, entityname);
                            buildCommandInput(CMDVALIDATE, compressToXMLpars, validationInputType, data, operation, cmdtext, id, layer, functionid);
							CMDresult res = execCommand(CMDVALIDATE, inputType, PubsConn);
                            res.isValidation = true;
                            return res;
                        }
                }
            }
            return new CMDresult();
        }
        public bool checkGridRights(string gridname, string operation, string entityname, string storedprocedure,dynamic data,out string message)
        {
            CMDresult result;
            string inputType = "XML";
            using (SqlConnection PubsConn = new SqlConnection(connection))
            {
                using (SqlCommand CMD = new SqlCommand(storedprocedure, PubsConn))
                {
                    CMD.CommandType = CommandType.StoredProcedure;
                    buildCommandInput(CMD, compressToXMLpars, inputType, data, operation, entityname, null,-1, -1);
                    result = execCommand(CMD, inputType, PubsConn);
                }
            }
            if (result.errorId != "0")
            {
                message = result.message;
                return false;
            }
            message = "";
            return true;
        }

        /// <summary>
        /// Lancia un metodo DB che deve tornare le 3 variabili output e il record modificato da visualizzare in griglia (se lanciato da griglia).
        /// </summary>
        /// <param name="data"></param>
        /// <returns></returns>
        public updateresult execUpdateInsertController(dynamic data)
        {
            try
            {
                string retval = String.Empty;

                string operation = data.cfgoperation;
                string commandname = data.cfgDataSourceCustomParam;
                string entityname = data.cfgEntityName;
                int functionid = data.cfgfunctionID;
                int userid = MagicFramework.Helpers.SessionHandler.IdUser;
                int layer = 0;
                int.TryParse(data.cfglayerID.ToString(), out layer);
                int businessunit = MagicFramework.Helpers.SessionHandler.UserVisibilityGroup;
                string errorId = String.Empty;
                string message = String.Empty;
                string pk = String.Empty;

                string pkname = data.cfgpkName;
                string id = String.Empty;
                if (operation != "customaction")
                {
                    id = data[pkname];
                }
                else
                    id = "0";

               
                string standardJsonParam = ApplicationSettingsManager.GetDefaultCustomJsonParameter();
                string inputType = extractCommandDataFormat(commandname, operation, standardJsonParam);
                CMDresult result = new CMDresult();

                this.addMergedScenarioDynamic(data);

                if (database == "SqlServer")
                {

                    result = Validate(data);

                    if (result.errorId == "0" && (result.msgType != "WARN" || data.__ignoreWarnings == true) || String.IsNullOrEmpty(result.errorId))
                        using (SqlConnection PubsConn = new SqlConnection(connection))
                        {
                            using (SqlCommand CMD = new SqlCommand(extractCommand(commandname, operation, standardJsonParam), PubsConn))
                            {
                                CMD.CommandType = CommandType.StoredProcedure;
                                //estrae il nome dell' entita' da passare alle stored che e' nel campo Text del JSON del CustomJsonParam del DataSource.
                                //Se non indicato prende l' entita' della FromTable della griglia
                                string cmdtext = extractCommandText(commandname, operation, entityname);
                                buildCommandInput(CMD, compressToXMLpars, inputType, data, operation, cmdtext, id, layer, functionid);
                                result = execCommand(CMD, inputType, PubsConn);
                            }
                        }
                }
                if (database == "Oracle")
                {

                    using (OracleConnection PubsConn = new OracleConnection(connection))
                    {
                        using (OracleCommand CMD = new OracleCommand(extractCommand(commandname, operation, standardJsonParam), PubsConn))
                        {
                            CMD.CommandType = CommandType.StoredProcedure;
                            //estrae il nome dell' entita' da passare alle stored che e' nel campo Text del JSON del CustomJsonParam del DataSource.
                            //Se non indicato prende l' entita' della FromTable della griglia
                            string cmdtext = extractCommandText(commandname, operation, entityname);
                            buildCommandInput(CMD, compressToXMLpars, inputType, data, operation, cmdtext, id, layer, functionid);
                            result = execCommand(CMD, inputType, PubsConn);
                        }
                    }
                }
                //delete file only if the stored exited with success (Bug #7000: tasto cancellazione generico su griglia)
                if ((result.errorId == "0" || String.IsNullOrEmpty(result.errorId)) && operation == "destroy")
                    MagicFramework.Controllers.MAGIC_SAVEFILEController.deleteFilesOfRow(data);
                pk = result.pkValue;
                message = result.message;
                errorId = result.errorId;
                
                CheckManagedException(errorId, message);

                Files.HandleLocation(result.DataSet, true);

                return new updateresult(pk, errorId, message, extractCommand(commandname, operation, standardJsonParam), result.msgType, result.DataSet, result.isValidation);
            }
            catch (Exception ex)
            {
                if (HasManagedExceptionFormat(ex.Message))
                    throw new System.ArgumentException(ex.Message);

                throw new System.ArgumentException(ex.ToString());
            }

        }
        public static bool HasManagedExceptionFormat(string message) {
            JObject o;
            bool ismanexc = false;
            if (message.StartsWith("{") && message.EndsWith("}"))
            {
                o = JObject.Parse(message);
                if (o["type"] != null && o["type"].ToString() == "MANAGED_EXCEPTION")
                {
                    ismanexc = true;
                    return ismanexc;
                }
            }
            return ismanexc;
        }
        public void CheckManagedException(string errorId, string message)
        {
            //se ci sono errori scateno l' eccezione - D.T 05/11/2020 with security modifcations we have to distinguish between a managed exception and a RAISED one
            if (errorId != "0")
            {
                JObject o = JObject.FromObject(new { type = "MANAGED_EXCEPTION", content = message });
                throw new System.ArgumentException(Newtonsoft.Json.JsonConvert.SerializeObject(o));
            }
        }

        private string GetHost()
        {
            try
            {
                return HttpContext.Current?.Request?.Url?.Host ?? "unknown";
            }
            catch
            {
                Debug.WriteLine("Host not available.");
                return "unknown";
            }
        }

        private string GetUserId()
        {
            try
            {
                var id = SessionHandler.IdUser;
                return id.ToString();
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"User not available: {ex.Message}");
                return "-1";
            }
        }

        private string GetAppInstanceName()
        {
            try
            {
                return ApplicationSettingsManager.GetAppInstanceName();
            }
            catch
            {
                Debug.WriteLine("Could not detect app instance name.");
                return "none";
            }
        }

        /// <summary>
        /// Usato in RefTree per popolare la CONTEXT_INFO di SQL server, richiamato da GENERICSQLCOMMAND e dall' interceptor del ContextEtension in Ref3.dll
        /// </summary>
        public void setContextInfo(SqlConnection connection, SqlCommand sqlCommand = null)
        {
            bool setCinfo = false;

            try
            {
                setCinfo = ApplicationSettingsManager.GetSetContextInfo();
            }
            catch
            {
                Debug.WriteLine("Issues reading setContextInfo");
            }

            if (!setCinfo) return;

            try
            {
                string host = GetHost();
                string userId = GetUserId();
                string appInstanceName = GetAppInstanceName();


                string applicationinfo = "{{ \"iduser\": {0}, \"name\":\"{1}\" }}";
                applicationinfo = String.Format(applicationinfo, userId, appInstanceName);


                if (database?.ToUpper() == "SQLSERVER")
                {
                    string dbscript = String.Format("DECLARE @temp AS VARBINARY(128); SET @temp = CAST('{0}' AS VARBINARY(128)); SET CONTEXT_INFO @temp;", applicationinfo);
                    using (SqlCommand CMD = new SqlCommand
                      (dbscript, connection))
                    {
                        CMD.CommandType = CommandType.Text;
                        CMD.ExecuteNonQuery();
                    }

                 
                    if (sqlCommand != null)
                    {
                        string xmlInputAsString = GetParameterValueAsString(sqlCommand, "@xmlInput");

                        if (!string.IsNullOrEmpty(xmlInputAsString))
                        {
                            string gridName = "";
                            try
                            {
                                gridName = GetGridNameFromXml(xmlInputAsString);
                            }
                            catch (Exception ex)
                            {
                                Debug.WriteLine($"Error getting gridname: {ex.Message}");
                            }

                            try
                            {
                                string sessionContextValue = JsonConvert.SerializeObject(JObject.FromObject(new
                                {
                                    gridName = gridName,
                                    command = sqlCommand.CommandText ?? "unknown",
                                    user = int.TryParse(userId, out var uid) ? uid : -1,
                                    appInstance = appInstanceName,
                                    url = host
                                }));

                                using (SqlCommand cmd = new SqlCommand("EXEC sp_set_session_context @key, @value", connection))
                                {
                                    cmd.Parameters.Add("@key", SqlDbType.VarChar, 128).Value = "reftree";
                                    cmd.Parameters.Add("@value", SqlDbType.Variant, 8000).Value = sessionContextValue;
                                    cmd.ExecuteNonQuery();
                                }
                            }
                            catch (Exception ex)
                            {
                                Debug.WriteLine("Failed to serialize session context or execute SQL: " + ex.Message);
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                MFLog.LogInFile("Error while updating context info: " + ex.Message, MFLog.logtypes.ERROR);
            }
        }


        private void addMergedScenario(string data) {
            try
            {
                dynamic mergedScenarioData_obj = Newtonsoft.Json.JsonConvert.DeserializeObject<object>(data);
                string mergedScenario = mergedScenarioData_obj.MergedScenario;
                this.mergedScenario = mergedScenario;
            }
            catch {
                this.mergedScenario = null;
            }

        }

        private void addMergedScenarioDynamic(dynamic data)
        {
            try
            {
                string mergedScenario = data.MergedScenario;
                this.mergedScenario = mergedScenario;
            }
            catch
            {
                this.mergedScenario = null;
            }

        }
        // Method to extract the Grid__Name__ attribute from the P node in the XML
        public static string GetGridNameFromXml(string xmlInput)
        {
            // Create an XmlDocument object
            XmlDocument doc = new XmlDocument();

            try
            {
                // Load the XML content from the string
                doc.LoadXml(xmlInput);

                // Find the first 'ACTION' node in the XML
                XmlNode aNode = doc.SelectSingleNode("//ACTION");

                // If the P node exists and contains the Grid__Name__ attribute
                if (aNode != null && aNode.Attributes["GRIDNAME"] != null)
                {
                    // Return the value of the GRIDNAME attribute
                    return aNode.Attributes["GRIDNAME"].Value;
                }
                else
                {
                    XmlNode pNode = doc.SelectSingleNode("//P");
                    return pNode.Attributes["cfgGridName"].Value;
                }
            }
            catch (XmlException ex)
            {
                Console.WriteLine($"Error parsing XML: {ex.Message}");
                return null;
            }
        }
        // Method to get the string value of a SqlParameter
        public static string GetParameterValueAsString(SqlCommand command, string parameterName)
        {
            if (command == null)
                return null;

            if (command.Parameters == null || command.Parameters.Count == 0)
                return null;

            // Check if the parameter exists in the SqlCommand's parameters collection
            if (command.Parameters.Contains(parameterName))
            {
                // Get the parameter value
                var parameterValue = command.Parameters[parameterName].Value;

                // Return the value as a string, or null if the value is DBNull
                return parameterValue != DBNull.Value ? parameterValue.ToString() : null;
            }
            else
            {
                // If the parameter is not found, return null or handle it accordingly
                return null;
            }
        }
    }
}