using MagicFramework.Helpers;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Xml;

namespace MagicFramework.Models
{
    public enum ProcessType
    {
        BOMQ,
        CLASH
    }

    
    /// <summary>
    /// Used to bulk the Bill of materials into the database
    /// </summary>
    public class MaterialBulkUnit
    {
        public DateTime BulkDate { get; set; }
        public string GUID { get; set; }
        public string Name { get; set; }
        public string QuantitiesJSON { get; set; }
        public int ModifiedUser_ID { get; set; }
        public string globalId { get; set; }
        public string poid { get; set; }
        public string filename { get; set; }
        public string IfcType { get; set; }
    }

    public class BimProcess
    {
        public string poid { get; }
        public ProcessType type { get;  }

        public static Helpers.DatabaseCommandUtils.updateresult callStoredProcedurewithXMLInputwithOutputPars(XmlDocument xml, string commandname, string connection)
        {
            try
            {
                DataTable table = new DataTable();
                String pk = String.Empty;
                String errorId = String.Empty;
                String message = String.Empty;
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

                        PubsConn.Open();
                        CMD.ExecuteNonQuery();
                        pk = output1.Value.ToString();
                        message = output2.Value.ToString();
                        errorId = output3.Value.ToString();

                        if (errorId != "0" && errorId != "-1")
                            throw new System.ArgumentException(message);
                        if (errorId == "-1")
                            return new Helpers.DatabaseCommandUtils.updateresult(pk, errorId, message, commandname, "WARN");

                        return new Helpers.DatabaseCommandUtils.updateresult(pk, errorId, message, commandname);
                    }
                }
            }
            catch (Exception ex)
            {
                throw new System.ArgumentException(ex.Message);
            }
        }
        public static void BIMLongProcessNotifier(dynamic data, string connection,string logfile)
        {
            XmlDocument xml = Utils.ConvertDynamicToXML(data);
            try
            {
                DatabaseCommandUtils.updateresult result = callStoredProcedurewithXMLInputwithOutputPars(xml, "BIM.usp_LongProcessNotifier", connection);
                if (result.errorId != "0")
                    MFLog.LogInFile(result.message, MFLog.logtypes.ERROR, logfile);
            }
            catch (Exception e)
            {
                MFLog.LogInFile(e.Message, MFLog.logtypes.ERROR);
            }
        }
        static string getLogFile(string file)
        {
            return Path.Combine(ApplicationSettingsManager.GetDirectoryForLog(), "BIM", file + ".log");
        }
        static string getPythonExec()
        {
            return @"C:\Python27\python.exe";
        }
        static string getPythonScriptArgs(string pythonscript,string path,string output_suffix)
        {
            return pythonscript + " " + path + " " + output_suffix;
        }
        public BimProcess(ProcessType type, string poid)
        {
            this.poid = poid;
            this.type = type;
        }
        public  void createBOM(JObject obj, PythonHandler py)
        {
            string logfile = obj["log_file"].ToString();
            string stdOutput = py.ExecuteSynch();
            MFLog.LogInFile(stdOutput, MFLog.logtypes.INFO, logfile);

            string output_file = obj["path"].ToString() + obj["output_suffix"].ToString();
            string poid = obj["poid"].ToString();
            string filecontent = File.ReadAllText(output_file);
            string connectionString = obj["connectionString"].ToString();
            int userId =int.Parse(obj["userid"].ToString());

            List<MaterialBulkUnit> bunits = new List<MaterialBulkUnit>();
            try
            {
                DateTime bulkdate = DateTime.Now;
                var guid = Guid.NewGuid();
                dynamic output_bom = Newtonsoft.Json.JsonConvert.DeserializeObject(filecontent);
                foreach (var o in output_bom)
                {
                    var mat = new MaterialBulkUnit();
                    mat.BulkDate = bulkdate;
                    mat.GUID = guid.ToString();
                    mat.globalId = o.GlobalId.ToString();
                    mat.IfcType = o.Type.ToString();
                    mat.Name = o.Name.ToString();
                    mat.ModifiedUser_ID = userId;
                    mat.poid = poid;
                    mat.QuantitiesJSON = o.Quantities.ToString();
                    mat.filename = obj["file"].ToString(); //the file which generated this data 
                    bunits.Add(mat);
                }
                DBBulkCopyUtils.ExecBulkCopyList(bunits, "SKU.BillOfMaterials_History", connectionString);
                JObject input = JObject.FromObject(new
                {
                    guid = guid.ToString(),
                    id = obj["process_id"].ToString(),
                    processType = ProcessType.BOMQ.ToString()
                });
                XmlDocument xmlInput = Utils.ConvertDynamicToXML(input);
                DatabaseCommandUtils.updateresult result = BimProcess.callStoredProcedurewithXMLInputwithOutputPars(xmlInput, "BIM.usp_BOM_Update", connectionString);
                if (result.errorId != "0")
                    throw new System.ArgumentException(result.message);
                BIMLongProcessNotifier(input, connectionString, logfile);
            }
            catch (Exception ex)
            {
                MFLog.LogInFile(ex.Message, MFLog.logtypes.ERROR, logfile);
            }
        }
        public void StartBimProcess(string file,string path)
        {
            var dbutils = new DatabaseCommandUtils();
            DataSet ds = dbutils.GetDataSet("SELECT ID FROM BIM.Projects where bimServerProjectId ='" + this.poid + "'", DBConnectionManager.GetTargetConnection());
            int Project_ID = int.Parse(ds.Tables[0].Rows[0]["ID"].ToString());
            DataSet ds2 = dbutils.GetDataSet("SELECT ID,ScriptName,text_file_output_suffix FROM BIM.ProcessTypes where Code ='" + this.type.ToString() + "'", DBConnectionManager.GetTargetConnection());
            int Type_ID  = int.Parse(ds.Tables[0].Rows[0]["ID"].ToString());

            DataSet ds3 = dbutils.GetDataSet(@"SELECT ID FROM BIM.ProjectsProcesses
                        where ProcessType_ID =" + Type_ID.ToString() + " AND Project_ID = " + Project_ID.ToString()  +
                        " AND EndDate is null", DBConnectionManager.GetTargetConnection());
            int id = 0;
            if (ds3.Tables[0].Rows.Count>0)
                id = int.Parse(ds3.Tables[0].Rows[0]["ID"].ToString());
            //Generate a new Process and Get the ID 
            if (id == 0)
            {
                DataSet ds4 = dbutils.GetDataSet("INSERT INTO BIM.ProjectsProcesses (ProcessType_ID,Project_ID,ModifiedUser_ID) VALUES (" + Type_ID + "," + Project_ID + ","+SessionHandler.IdUser.ToString()+");SELECT SCOPE_IDENTITY() as ID;", DBConnectionManager.GetTargetConnection());
                id = int.Parse(ds4.Tables[0].Rows[0]["ID"].ToString());
            }
            else
                throw new System.ArgumentException("A process of type " + this.type.ToString() + "is already running");
   
            string runningPythonScript = ds2.Tables[0].Rows[0]["ScriptName"].ToString();
            string output_suffix = ds2.Tables[0].Rows[0]["text_file_output_suffix"].ToString();
            string log_file = getLogFile(file);
            string pythonscript = Path.Combine(HttpContext.Current.Server.MapPath("~"), runningPythonScript);
            PythonHandler py = new PythonHandler(getPythonExec(), getPythonScriptArgs(pythonscript,path,output_suffix), path);
            JObject executionContext = JObject.FromObject(new
            {
                file = file,
                path = path,
                log_file = log_file,
                poid = poid,
                connectionString = DBConnectionManager.GetTargetConnection(),
                output_suffix = output_suffix,
                process_id = id,
                userid = SessionHandler.IdUser
            });
            Task task = new Task(() => createBOM(executionContext,py) );
            task.Start();
           
            
           
        }

    }
}