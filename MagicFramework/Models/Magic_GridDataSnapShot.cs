using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using MagicFramework.Helpers;

namespace MagicFramework.Models
{
    public class Magic_GridDataSnapShot
    {
        private String SnapShot { get; set; }
        private string MagicGridName { get; set; }
        private string Action {get;set;}
        private string PK_value { get; set; }
        private bool enabled { get; set; }
        public Magic_GridDataSnapShot(dynamic snapShot)
        {
            this.SnapShot = Newtonsoft.Json.JsonConvert.SerializeObject(snapShot.cfgsnapShotData);
            this.MagicGridName = snapShot["cfgGridName"];
            this.Action = snapShot["cfgoperation"];
            if (snapShot["cfgpkName"] != null)
                this.PK_value = snapShot[snapShot["cfgpkName"].ToString()];
            else
                this.PK_value = "";
            this.enabled = snapShot["cfgsnapShot"] == null ? false : bool.Parse(snapShot["cfgsnapShot"].ToString());
        }
        public void InsertSnapShot()
        {
            //check if grid extension is enabledmfor grid
            if (!this.enabled)
                return;
            var dbutils = new Helpers.DatabaseCommandUtils();
            string query = @"INSERT INTO [dbo].[Magic_GridDataSnapShot]
                                                       ([Pk_Value]
                                                       ,[SnapShot]
                                                       ,[MagicGridName]
                                                       ,[Action]
                                                       ,[User_ID])
                                                 VALUES
                                                       ('{0}'
                                                       ,'{1}'
                                                       ,'{2}'
                                                       ,'{3}'
                                                       ,{4})";
            query = String.Format(query, this.PK_value, String.IsNullOrEmpty(this.SnapShot) ? "" : this.SnapShot.Replace("'", "''"), this.MagicGridName, this.Action, SessionHandler.IdUser);
            try
            {
                dbutils.buildAndExecDirectCommandNonQuery(query);
            }
            catch (Exception ex){
                MFLog.LogInFile(ex, MFLog.logtypes.ERROR);
            }
        }

    }
}