using MagicFramework.Helpers;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Data;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace MagicSolution
{
    public partial class SdiConfirm : System.Web.UI.Page
    {        

        protected void Page_Load(object sender, EventArgs e)
        {            
            DatabaseCommandUtils dbutils = new DatabaseCommandUtils();
            try
            {
                string id = "";
                string uniqueId = "";
                if (Request.QueryString["ID"] == null || Request.QueryString["UID"] == null)
                {
                    throw new Exception("Accesso negato");
                }
                else
                {
                    id = Request.QueryString["ID"];  // ricavare anche uniqueID, e passarlo alla stored
                    uniqueId = Request.QueryString["UID"];  // ricavare anche uniqueID, e passarlo alla stored
                }

                JObject json = JObject.FromObject(new { ID = id, UID = uniqueId });
                DataSet dbdata = dbutils.GetDataSetFromStoredProcedure("FatEle.GetDataForSDINumber", json, DBConnectionManager.GetTargetConnection(), null,0,0);

                try
                {
                    if (dbdata.Tables.Count > 0)
                    {
                        FullDescription.Text = dbdata.Tables[0].Rows[0]["FullDescription"].ToString();
                        Address.Text = dbdata.Tables[0].Rows[0]["Address"].ToString();
                        City.Text = dbdata.Tables[0].Rows[0]["City"].ToString();
                        Prov.Text = dbdata.Tables[0].Rows[0]["Province_abbr"].ToString();
                        PostalCode.Text = dbdata.Tables[0].Rows[0]["PostalCode"].ToString();
                        VatNumber.Text = dbdata.Tables[0].Rows[0]["VatNumber"].ToString();

                        if (dbdata.Tables[1].Rows[0]["CodiceDestinatario"].ToString() != "")
                        {
                            SDI.Text = dbdata.Tables[1].Rows[0]["CodiceDestinatario"].ToString();
                            SDI.Enabled = false;
                        }
                        if (dbdata.Tables[1].Rows[0]["PEC"].ToString() != "")
                        {
                            PEC.Text = dbdata.Tables[1].Rows[0]["PEC"].ToString();
                            PEC.Enabled = false;
                        }
                        if (dbdata.Tables[1].Rows[0]["CodiceDestinatario"].ToString() != "" && dbdata.Tables[1].Rows[0]["PEC"].ToString() != "")
                        {
                            Note.Enabled = false;
                            but_confirm.Enabled = false;
                        }
                    }
                }
                catch
                {
                    throw new Exception("Nessun dato trovato");
                }
            }
            catch (Exception ex)
            {

                ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('" + ex.Message + "')", true);
            }
        }
       

        protected void but_confirm_Click(object sender, EventArgs e)
        {
            try
            {
                if (String.IsNullOrEmpty(SDI.Text.ToString()) && String.IsNullOrEmpty(PEC.Text.ToString()))
                    throw new Exception("Inserire almeno un dato tra codice destinatario e PEC");
                //Response.Write(SDI.Text);
                DatabaseCommandUtils dbutils = new DatabaseCommandUtils();
                string id = Request.QueryString["ID"];  // ricavare anche uniqueID, e passarlo alla stored
                string uniqueId = Request.QueryString["UID"];  // ricavare anche uniqueID, e passarlo alla stored
                Dictionary<string, string> jsonPar = new Dictionary<string, string>();
                JObject data = new JObject();
                data["userID"] = SessionHandler.IdUser;
                data["ugvi"] = SessionHandler.UserVisibilityGroup;
                data["ID"] = id.ToString();
                data["uniqueID"] = uniqueId.ToString();
                data["SDI"] = SDI.Text.ToString();
                data["PEC"] = PEC.Text.ToString();
                data["Note"] = Note.Text.ToString();

                System.Xml.XmlDocument xml = MagicFramework.Helpers.JsonUtils.Json2Xml(data.ToString());
                dbutils.callStoredProcedurewithXMLInput(xml, "FatEle.SaveDataForCustomer");

                SDI.Enabled = false;
                PEC.Enabled = false;
                Note.Enabled = false;
                but_confirm.Enabled = false;
            }
            catch (Exception ex)
            {
                ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('" + ex.Message + "')", true);
            }
            ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('Dati inviati e salvati con successo')", true);
        }
    }
}