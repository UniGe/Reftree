using MagicFramework.Helpers;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Web;

namespace MagicFramework.Models
{
    public class ApplicationLayer
    {
        private string applicationName {get;set;}
        public ApplicationLayer() {
            this.applicationName = ApplicationSettingsManager.GetAppInstanceName();
        }
        public int? GetAlternativeLayerIdForThisAppInstanceName() {
            int? layerId = null;
            var dbUtils = new DatabaseCommandUtils(DBConnectionManager.GetMagicConnection());
            DataSet ds = dbUtils.GetDataSet(@"SELECT Layer_ID FROM dbo.Magic_AppNamesAltLayers 
                                                where ApplicationInstanceName = '" + this.applicationName + "' and Active = 1;");
            if (ds.Tables[0].Rows.Count > 0)
            {
                layerId = ds.Tables[0].Rows[0].Field<int?>("Layer_ID");
            }
            return layerId;
        }
    }
} 