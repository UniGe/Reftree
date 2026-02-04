using MagicFramework.Helpers;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web;

namespace MagicFramework.Models
{
    public enum WIDGET_TYPE {
        CUSTOM,
        CHART,
        INDICATOR
    }
    public class WidgetRightsDBChecker
    {
        private string _connectionString { get; set; }
        private WIDGET_TYPE widgetType { get; set; }

        private string checkSP = ConfigurationManager.AppSettings["checkUserRightsChartWidgetsStoredProcedure"];
        public WidgetRightsDBChecker(WIDGET_TYPE wt, string connectioString = null) {
            this._connectionString = string.IsNullOrEmpty(connectioString) ? DBConnectionManager.GetTargetConnection() : connectioString;
            this.widgetType = wt;
        }
        public bool isConfigured() {
            bool isConfigured = false;
            if (!String.IsNullOrEmpty(checkSP))
                isConfigured = true;
            return isConfigured;
        }
        public bool checkUserRigths(string requestedObjects)
        {
            DataSet tables = new DataSet();
            List<int> authorized = new List<int>();
            if (!isConfigured())
                return true;
            using (SqlConnection PubsConn = new SqlConnection(this._connectionString))
            {
                using (SqlCommand CMD = new SqlCommand
                    (checkSP, PubsConn))
                {
                    CMD.CommandType = CommandType.StoredProcedure;
                    CMD.Parameters.Add(new SqlParameter("@userId", SessionHandler.IdUser));
                    CMD.Parameters.Add(new SqlParameter("@idsObject", requestedObjects));
                    CMD.Parameters.Add(new SqlParameter("@objectType", this.widgetType.ToString()));
                    SqlDataAdapter da = new SqlDataAdapter(); PubsConn.Open();
                    da.SelectCommand = CMD;
                    da.Fill(tables);
                    da.Dispose();
                }
            }

            foreach (DataRow dr in tables.Tables[0].Rows)
            {
                authorized.Add(dr.Field<int>("id"));
            }
            var countOfRequested = requestedObjects.Split('|').Length;
            if (authorized.Count == countOfRequested)
                return true;

            return false;

        }
    }
}