using System;
using System.Collections.Generic;
using System.Text;
using System.Data;
using System.Data.SqlClient;
using System.Configuration;
using System.ComponentModel;
using System.Reflection;
using System.IO;
using System.Resources;
using MagicEventsManager.Resources;
using MagicEventsManager.DB;
using System.Linq;
using WinSCP;
using MagicEventsManager.Helpers;
using System.Security;
using MagicEventsManager.Logic;
using Ionic.Zip;
using System.Diagnostics;

namespace MagicEventsManager
{
    public class CommandState
    {
        public SqlCommand Command { get; set; }
        public int TrackingID { get; set; }
    }
    public class Broker
    {
        //Oggetto per la sincronizzazione
        //protected static object syncRoot = new object();

        //Contiene staticamente tutti i metodi presenti negli assembly 
        //contenuti nella directory dei plugin
        protected Dictionary<string, MethodInfo> MethodList;

        //Tipi di ritorno ammessi per i metodi da invocare
        protected List<Type> allowedReturnType;

        //Istanza statica della classe con lock per accesso univoco
        protected static Broker instance = new Broker();

        public static Broker Instance
        {
            get
            {
             //   lock (syncRoot)
             //   {
                    return instance;
             //   }
            }
        }

        Broker()
        {
            //Inizializza l'elenco dei tipi di ritorno consentiti
            allowedReturnType = new List<Type>();
            allowedReturnType.Add(typeof(void));
            allowedReturnType.Add(typeof(int));
            allowedReturnType.Add(typeof(string));
            allowedReturnType.Add(typeof(DataSet));
            allowedReturnType.Add(typeof(Exception));

            //Inizializza il contenitore degli assembly
            //Tutti gli assembly vengono caricati staticamente all'avvio del programma
            //Per aggiungere nuovi file nella cartella plugin e' necessario
            //riavviare l'applicazione
            MethodList = new Dictionary<string, MethodInfo>();
            loadAssembly();
        }

        //Carica tutti gli assembly presenti nella cartella pluing
        void loadAssembly()
        {
            if (!Directory.Exists(ConfigurationManager.AppSettings["PlugInPath"])) return;

            string[] vetFiles = Directory.GetFiles(ConfigurationManager.
                AppSettings["PlugInPath"], "*.dll", SearchOption.TopDirectoryOnly);

            foreach (string sFile in vetFiles)
            {
                try
                {
                    Assembly a = Assembly.LoadFile(sFile);

                    Type[] tVet = a.GetTypes();

                    foreach (Type t in tVet)
                    {
                        //Recupera solo i metodi public static
                        MethodInfo[] miVet = t.GetMethods(BindingFlags.Static |
                            BindingFlags.Public);

                        foreach (MethodInfo mi in miVet)
                        {
                            //Vengono scartati i metodi che hanno tipo di ritorno consentiti
                            if (!allowedReturnType.Contains(mi.ReturnType)) continue;

                            //Solo metodi che non hanno parametri
                            if (mi.GetParameters().Length != 0) continue;

                           // object[] attr = mi.GetCustomAttributes(typeof(TaskMethod), false);

                            //Filtra i metodi che hanno l'attributo TaskMethod
                          //  if (attr != null && attr.Length > 0)
                          //  {
                                string chiave = mi.DeclaringType.ToString() + "." + mi.Name;
                                MethodList.Add(mi.DeclaringType.ToString() + "." + mi.Name, mi);
                          //  }
                        }
                    }

                }
                catch (Exception)
                { }

            }

        }

        public object ExecuteMethod(string methodName, int eventID, string targetDBConnectionString, string magicDBConnectionString)
        {
            System.Text.RegularExpressions.Match match = new System.Text.RegularExpressions.Regex(@"^(.+\.dll);(.+)\.([^.]+)$").Match(methodName);
            MethodInfo mi;
            if (match.Success)
            {
                string assemblyPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "bin", match.Groups[1].Value);
                //D.t reflecting using bytes[] to avoid lock...
                Assembly dll = Assembly.Load(File.ReadAllBytes(assemblyPath));
                System.Type type = dll.GetType(match.Groups[2].Value);
                if (type == null)
                    throw new Exception(Error.ERR_MNF);
                mi = type.GetMethod(match.Groups[3].Value, BindingFlags.Public|BindingFlags.Static);
            } else
                mi = MethodList[methodName];

            //Se non trova il metodo lancia un'eccezione
            if (mi == null) throw new Exception(Error.ERR_MNF);

            return mi.Invoke(null, new object[] { eventID, targetDBConnectionString, magicDBConnectionString });
        }

        private SqlConnection openConnection(string connectionString)
        {
            //Crea l'oggetto connection
            SqlConnection sqlConn = new SqlConnection(connectionString);

            try
            {
                sqlConn.Open();
            }
            catch (Exception ex)
            {
                ex.ToString();
            }
            return sqlConn;
        }
        
        /// <summary>
        /// Esegue una query di select che restituisce un resultset
        /// </summary>
        /// <param name="query"></param>
        /// <returns></returns>
        public DataSet ExecuteQuery(string query, string connectionString)
        {
            //Apre la connessione
            SqlConnection sqlConn = openConnection(connectionString);

            //Esecuzione della query
            SqlDataAdapter da = new SqlDataAdapter(query, sqlConn);
            DataSet ds = new DataSet();
            da.Fill(ds);

            sqlConn.Close();

            return ds;
        }

        public int ExecuteNonQuery(string query, SqlParameter[] parameters, string connectionString)
        {
            int ret = -1;
            //Apre la connessione
            SqlConnection sqlConn = openConnection(connectionString);
            SqlCommand cmd = new SqlCommand();

            if (parameters != null)
            {
                foreach (SqlParameter param in parameters)
                    cmd.Parameters.Add(param);
            }

            cmd.CommandText = query;
            cmd.Connection = sqlConn;

            try
            {
                ret = cmd.ExecuteNonQuery();

            }
            catch (ArgumentException exAE)
            {
                throw new Exception("Errore nella lettura della Connection String: " + exAE.Message);
            }
            catch (Exception ex)
            {
                throw new Exception("Errore nell'esecuzione della query: " + ex.Message);
            }
            finally
            {
                if (cmd != null) cmd.Dispose();
                if (sqlConn.State == ConnectionState.Open) sqlConn.Close();
            }

            return ret;
        }

        /// <summary>
        /// Esegue una query che restituisce un numero
        /// </summary>
        /// <param name="query"></param>
        /// <returns></returns>
        public double ExecuteQueryScalar(string query, string connectionString)
        {
            double res = 0;

            //Apre la connessione
            SqlConnection sqlConn = openConnection(connectionString);

            //Esecuzione della query
            SqlCommand cmd = new SqlCommand(query, sqlConn);
            object obj = cmd.ExecuteScalar();
            if (obj != null)
                double.TryParse(obj.ToString(), out res);

            sqlConn.Close();

            return res;
        }

        /// <summary>
        /// Esegue una stored procedure che restituisce un resultset
        /// </summary>
        /// <param name="spName"></param>
        /// <returns></returns>
        public DataSet ExecuteStoredProcedure(string spName, string connectionString, int timeout)
        {
            //Apre la connessione
            SqlConnection sqlConn = openConnection(connectionString);

            //Esecuzione della query
            SqlCommand cmd = new SqlCommand(spName, sqlConn);
            cmd.CommandTimeout = timeout;
            cmd.CommandType = CommandType.StoredProcedure;

            SqlDataAdapter da = new SqlDataAdapter(cmd);
            DataSet ds = new DataSet();
            da.Fill(ds);

            sqlConn.Close();

            return ds;
        }

        /// <summary>
        /// Esegue una stored procedure che restituisce un numero
        /// </summary>
        /// <param name="query"></param>
        /// <returns></returns>
        public double ExecuteStoredProcedureScalar(string spName, string connectionString)
        {
            //Apre la connessione
            SqlConnection sqlConn = openConnection(connectionString);

            //Esecuzione della query
            SqlCommand cmd = new SqlCommand(spName, sqlConn);
            cmd.CommandType = CommandType.StoredProcedure;
            double res = (double)cmd.ExecuteScalar();

            sqlConn.Close();

            return res;
        }
        public void ExecuteStoredProcedureNonQueryAsync(string spName, SqlParameter[] parameters,string connectionString,int trackingId)
        {
            //int ret = -1;
            //Apre la connessione
            SqlConnection sqlConn = openConnection(connectionString);
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
                // Wrap SqlCommand and trackingID in CommandState
                CommandState state = new CommandState
                {
                    Command = cmd,
                    TrackingID = trackingId
                };
                AsyncCallback callback = new AsyncCallback(HandleCallback);
                cmd.BeginExecuteNonQuery(callback, state);

            }
            catch (ArgumentException exAE)
            {
                throw new Exception("MagicEvents-Error launching async: "+cmd.CommandText+ " " + exAE.Message);
            }
        
           
        }
        public object ExecuteFileImportToDatabase(string scriptName,string connectionString,int trackId)
        {
            try
            {
                var dsout = new DataSet();
                var t = new DataTable();
                dsout.Tables.Add(t);
                t.Columns.Add("ImportedFileName", typeof(String));
                t.Columns.Add("ImportedFileKey", typeof(String));
                DataSet ds = Utils.GetDataSet("SELECT * FROM dbo.Magic_FileImportSettings where Code = '" + scriptName + "'", connectionString);
                if (ds.Tables[0].Rows.Count == 0)
                    throw new Exception("MagicEvents-ExecuteFileImportToDatabase: scriptName not found in Magic_FileImportSettings (Code)");
                Magic_FileImportSetting fimp = new Magic_FileImportSetting(ds);
                string filename = (Path.GetFileName(fimp.FilePath) == null || Path.GetFileName(fimp.FilePath)=="") ? "*.*" : Path.GetFileName(fimp.FilePath);
                string directory = Path.GetDirectoryName(fimp.FilePath);
                DirectoryInfo Dir = new DirectoryInfo(directory);
                FileInfo[] FileList = Dir.GetFiles(filename, SearchOption.TopDirectoryOnly);
                string moveto = fimp.MoveImportedToPath;
                Directory.CreateDirectory(moveto);
                foreach (FileInfo fi in FileList )
                {
                   string key = fimp.ImportFile(fi.FullName, connectionString);
                   //if defined call the import stored procedure as an async batch ... Input will be the generated GUID 
                   if (!String.IsNullOrEmpty(fimp.DBInfo.ImportEndStoredProcedure)) 
                   {
                        SqlParameter p = new SqlParameter("FileImport_GUID",SqlDbType.NVarChar,4000);
                        p.Value = key;
                        p.Direction = ParameterDirection.Input;
                        this.ExecuteStoredProcedureNonQueryAsync(fimp.DBInfo.ImportEndStoredProcedure,new SqlParameter[] {p}, connectionString,trackId);
                   }
                   DataRow r = t.NewRow();
                   r["ImportedFileKey"] = key;
                   r["ImportedFileName"] = fi.FullName;
                   t.Rows.Add(r);
                   //move file to imported dir. If a file with the same name already exists i delete it first
                   if (File.Exists(Path.Combine(moveto, Path.GetFileName(fi.FullName))))
                       File.Delete(Path.Combine(moveto, Path.GetFileName(fi.FullName)));
                   File.Move(fi.FullName, Path.Combine(moveto, Path.GetFileName(fi.FullName)));
                 
                }
                return dsout;
            }
            catch (Exception ex)
            {
                return new Exception("MagicEvents-ExecuteFileImportToDatabase: " + ex.Message);
                
            }
        }
        public object ExecuteFtpRequest(string scriptName, MagicDBEntities context)
        {
            Magic_FTP_Settings ftp = (from e in context.Magic_FTP_Settings where e.Code.Equals(scriptName) select e).FirstOrDefault();
            if (ftp != null)
            {
                try
                {
                    bool isSslOrTls = false;
                    SessionOptions sessionOptions = new SessionOptions
                    {
                        FtpMode = ftp.Magic_FTP_Servers.Is_Passive ? FtpMode.Passive : FtpMode.Active,
                        HostName = ftp.Magic_FTP_Servers.Host_Name,
                        PortNumber = ftp.Magic_FTP_Servers.Port_Number,
                        Protocol = (Protocol)ftp.Magic_FTP_Servers.Magic_FTP_Protocols.Code,
                        Password = StringCipher.DecryptPassword(ftp.Magic_FTP_Servers.Password),
                        SshHostKeyFingerprint = ftp.Magic_FTP_Servers.Ssh_Host_Key_Fingerprint,
                        SshPrivateKeyPath = ftp.Magic_FTP_Servers.Ssh_Private_Key_Path,
                        TlsHostCertificateFingerprint = ftp.Magic_FTP_Servers.Tls_Host_Certificate_Fingerprint,
                        TlsClientCertificatePath = ftp.Magic_FTP_Servers.Tls_Client_Certificate_Path,
                        Timeout = new TimeSpan(0, 0, ftp.Magic_FTP_Servers.Timeout != null && ftp.Magic_FTP_Servers.Timeout > 0 ? ftp.Magic_FTP_Servers.Timeout ?? 15 : 15),
                        UserName = ftp.Magic_FTP_Servers.User_Name
                    };

                    //FTPS
                    if (sessionOptions.Protocol == Protocol.Ftp && ftp.Magic_FTP_Servers.Ftp_Encryption != null)
                    {
                        sessionOptions.FtpSecure = (FtpSecure)ftp.Magic_FTP_Servers.Magic_FTP_Encryptions.Code;
                        if ((FtpSecure)ftp.Magic_FTP_Servers.Magic_FTP_Encryptions.Code != FtpSecure.None)
                            isSslOrTls = true;
                    }
                    //WebdavSecure
                    else if (sessionOptions.Protocol == Protocol.Webdav && ftp.Magic_FTP_Servers.Ftp_Encryption != null)
                    {
                        isSslOrTls = true;
                        sessionOptions.WebdavSecure = true;
                        sessionOptions.WebdavRoot = ftp.Magic_FTP_Servers.Webdav_Root;
                    }

                    //unsecure SFTP or SCP
                    if (String.IsNullOrEmpty(sessionOptions.SshHostKeyFingerprint) && String.IsNullOrEmpty(sessionOptions.SshPrivateKeyPath) && (sessionOptions.Protocol == Protocol.Sftp || sessionOptions.Protocol == Protocol.Scp))
                        sessionOptions.GiveUpSecurityAndAcceptAnySshHostKey = true;
                    //unsecure FTPS or WebdavSecure (TLS/SSL)
                    else if (String.IsNullOrEmpty(sessionOptions.TlsHostCertificateFingerprint) && String.IsNullOrEmpty(sessionOptions.TlsClientCertificatePath) && isSslOrTls)
                        sessionOptions.GiveUpSecurityAndAcceptAnyTlsHostCertificate = true;

                    using (Session session = new Session())
                    {
                        // Connect
                        session.Open(sessionOptions);

                        TransferOperationResult transferResult;
                        TransferOptions transferOptions = new TransferOptions();
                        transferOptions.TransferMode = TransferMode.Binary;

                        // Upload/Download files
                        if (ftp.Magic_FTP_Transfer_Types.Is_Upload)
                            transferResult = session.PutFiles(ftp.Local_Path, ftp.Remote_Path, ftp.DeleteFiles, transferOptions);
                        else
                            transferResult = session.GetFiles(ftp.Remote_Path, ftp.Local_Path, ftp.DeleteFiles, transferOptions);
                        // Throw on any error
                        transferResult.Check();

                        // Print results
                        System.Data.DataSet ds = new System.Data.DataSet();
                        DataTable t = new DataTable();
                        ds.Tables.Add(t);

                        t.Columns.Add("fileName", typeof(String));
                        t.Columns.Add("Destination", typeof(String));
                        t.Columns.Add("Error", typeof(SessionRemoteException));

                        foreach (TransferEventArgs transfer in transferResult.Transfers)
                        {
                            if (!ftp.Magic_FTP_Transfer_Types.Is_Upload && ftp.ExtractArchiveFiles && transfer.Destination.ToLower().EndsWith(".zip"))
                            {
                                using (ZipFile zip = ZipFile.Read(transfer.Destination))
                                {
                                    foreach (ZipEntry e in zip)
                                    {
                                        e.Extract(ftp.Local_Path);

                                        DataRow row = t.NewRow();
                                        row["fileName"] = transfer.FileName;
                                        row["Destination"] = Path.Combine(ftp.Local_Path, e.FileName);
                                        row["Error"] = transfer.Error;
                                        t.Rows.Add(row);
                                    }
                                }

                                File.Delete(transfer.Destination);
                            }
                            else
                            {
                                DataRow row = t.NewRow();
                                row["fileName"] = transfer.FileName;
                                row["Destination"] = transfer.Destination;
                                row["Error"] = transfer.Error;
                                t.Rows.Add(row);
                            }
                        }
                        return ds;
                    }

                }
                catch (Exception e)
                {
                    return new Exception("Error during " + ftp.Magic_FTP_Servers.Magic_FTP_Protocols.Description + " request: " + e.Message);
                }
            }

            return new Exception("No Magic_FTP_Settings with Code '" + scriptName + "' found!"); ;
        }


        /// <summary>
        /// Gestisce la fine dell'  esecuzione della stored async: aggiorna il log di esecuzione dell' evento con eventuali errori o data di fine esecuzione....
        /// </summary>
        /// <param name="result"></param>
        private void HandleCallback(IAsyncResult result) 
        {
            // Retrieve the original command object, passed
            // to this procedure in the AsyncState property
            // of the IAsyncResult parameter.
            CommandState state = (CommandState)result.AsyncState;
            SqlCommand command = state.Command;
            SqlConnection conn = command.Connection; 
            var t = new Tracking(command.Connection.ConnectionString);
            int trackingID = state.TrackingID;  // Get the trackingID
            try
            {
                int rowCount = command.EndExecuteNonQuery(result);  
                t.updateEndTrack((int)trackingID);
                
            }
            catch (Exception ex)
            {
                t.updateEndTrack((int)trackingID,ex.Message);
                throw new Exception("MagicEvents-Problems during async call of:" + command.CommandText+". Exception says:"+ex.Message);
               
            }
            finally {
                if (conn != null)
                {
                    conn.Close();
                    conn.Dispose();
                }
                
            }
        }
    }
}
