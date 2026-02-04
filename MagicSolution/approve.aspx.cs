using MagicFramework.Data;
using MagicFramework.Helpers;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Net;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace MagicSolution
{
    public partial class approve : MagicFramework.Helpers.PageBase
    {
        protected string content = "";
        //MFConfiguration.ApplicationInstanceConfiguration selectedconfig;

        protected void Page_Load(object sender, EventArgs e)
        {
            int cultureId = SessionHandler.UserCulture;
            try {
                if (selectedconfig.UserApproval != null && !string.IsNullOrEmpty(selectedconfig.UserApproval.contentStoredProcedure))
                {
                    JObject data = new JObject();
                    data["userID"] = SessionHandler.IdUser;
                    data["cultureID"] = cultureId;
                    System.Xml.XmlDocument xml = MagicFramework.Helpers.JsonUtils.Json2Xml(data.ToString());
                    using (SqlConnection connection = new SqlConnection(DBConnectionManager.GetTargetConnection()))
                    {
                        using (SqlCommand CMD = new SqlCommand(selectedconfig.UserApproval.contentStoredProcedure, connection))
                        {
                            CMD.CommandType = System.Data.CommandType.StoredProcedure;
                            SqlParameter xmlinput = CMD.Parameters.Add("@xmlInput", SqlDbType.Xml);
                            xmlinput.Value = xml.InnerXml;
                            SqlParameter output2 = CMD.Parameters.Add("@content", SqlDbType.NVarChar, -1);
                            output2.Direction = ParameterDirection.Output;

                            connection.Open();
                            CMD.ExecuteNonQuery();
                            content = output2.Value.ToString();
                        }
                    }
                }
                else
                {
                    var connectionString = DBConnectionManager.GetTargetEntityConnectionString();
                    var context = new MagicDBEntities(connectionString);
                    var messages = context.Magic_SystemMessages.Where(m => m.Code.Equals("APPROV")).ToList();
                    var message = messages.Where(m => m.CultureId == cultureId).FirstOrDefault()
                                ?? messages.Where(m => m.CultureId == MFConfiguration.DefaultCultureId).FirstOrDefault()
                                ?? messages.FirstOrDefault();
                    if (message != null)
                        content = message.Body;
                }
            }
            catch (Exception ex)
            {
                MFLog.LogInFile("approve.aspx: " + ex.Message, MFLog.logtypes.ERROR);
            }
            if(string.IsNullOrEmpty(content))
                content = "User is not approved!";
        }

        new protected void page_PreInit(object s, EventArgs e)
        {
            MFConfiguration applicationConfig = new MFConfiguration(Request.Url.Authority);
            selectedconfig = applicationConfig.GetApplicationInstanceByID(Request.Url.Authority, SessionHandler.ApplicationInstanceId);
            if (Request.HttpMethod == "POST")
            {
                Response.ClearHeaders();
                Response.ClearContent();
                Response.StatusCode = (int)HttpStatusCode.NotAcceptable;
                if (selectedconfig.UserApproval != null && !string.IsNullOrEmpty(selectedconfig.UserApproval.approveUserStoredProcedure))
                {
                    try
                    {
                        JObject data = new JObject();
                        foreach(var key in Request.Form.AllKeys)
                        {
                            data[key] = Request.Form[key];
                        }
                        data["userID"] = SessionHandler.IdUser;
                        System.Xml.XmlDocument xml = MagicFramework.Helpers.JsonUtils.Json2Xml(data.ToString());
                        var res = new MagicFramework.Helpers.DatabaseCommandUtils().callStoredProcedurewithXMLInput(xml, selectedconfig.UserApproval.approveUserStoredProcedure);
                        if (res.counter == 1)
                        {
                            SessionHandler.UserIsApproved = true;
                            Response.StatusCode = (int)HttpStatusCode.OK;
                        }
                    }
                    catch (Exception ex)
                    {
                        Response.Write(ex.Message);
                        Response.End();
                    }
                }
                Response.Write(selectedconfig.appMainURL);
                Response.End();
            }
            if (SessionHandler.UserIsApproved)
                Response.Redirect(selectedconfig.appMainURL);
        }
    }
}