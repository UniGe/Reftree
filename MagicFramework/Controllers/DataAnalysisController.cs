using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Net;
using System.Net.Http;
using AttributeRouting.Web.Http;
using System.Linq.Dynamic;
using System.Configuration;
using System.Data;
using System.IO;
using System.Net.Http.Headers;
using System.Text;
using MagicFramework.Models;
using Newtonsoft.Json.Linq;
using MagicFramework.Helpers;
using System.Dynamic;
using MagicFramework.MemberShip.Filters;

namespace MagicFramework.Controllers
{
    [UnmanagedExceptionPostProcess]
    public class DataAnalysisController:ApiController
    {
        public const string authError = "BLK_GRAPH_OBJECT";
        public class PerdiodIndicatorValues
        {
            public double value { get; set; }
            public double percentValue { get; set; }
        }

        public class PerdiodChartValues
        {
            public int ID { get; set; }
            public string X { get; set; }
            public List<decimal> Partials { get; set; }
            public decimal Tot { get; set; }
            public decimal NumTot { get; set; }
            public string CustomParameter { get; set; }
        }


        [HttpPost]
        public Array PostChartConfigurations(dynamic data)
        {
            string usergrouplist = MagicFramework.UserVisibility.UserVisibiltyInfo.GetUserGroupVisibiltyChildrenSet();
            dynamic payload = new ExpandoObject();
            payload.userid = MagicFramework.Helpers.SessionHandler.IdUser;
            payload.UserGroupList = usergrouplist.Replace(',', '|');
            payload.UserGroupID = SessionHandler.UserVisibilityGroup;
            string json = Newtonsoft.Json.JsonConvert.SerializeObject(payload);
            var xml = MagicFramework.Helpers.JsonUtils.Json2Xml(json);
            var dbutils = new MagicFramework.Helpers.DatabaseCommandUtils();
            var  result =  MagicFramework.Helpers.DatabaseCommandUtils.GetResponseFromStoredProcedureWithXmlInput(xml, "dbo.Magic_GetDashBoardCharts");
            return result.Data;
        }

        [HttpPost]
        public IEnumerable<IGrouping<int, PerdiodChartValues>> PeriodCharts(dynamic data)
        {
            return getChartValues(data, new DatabaseCommandUtils(), SessionHandler.UserVisibilityGroup, SessionHandler.IdUser, MagicFramework.UserVisibility.UserVisibiltyInfo.GetUserGroupVisibiltyChildrenSet());
        }
        //private static Magic_Dashboard getDashboardData()
        //{
        //    var dbutils = new DatabaseCommandUtils();
        //    dynamic dataforrights = new ExpandoObject();
        //    dataforrights.applicationareaid = SessionHandler.CurrentModule;
        //    string dashboardStoredProcedureName = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).dashboardStoredProcedureName;
        //    dashboardStoredProcedureName = string.IsNullOrEmpty(dashboardStoredProcedureName) ? "dbo.DashBoardGetAllObjects" : dashboardStoredProcedureName;
        //    Magic_Dashboard dashboardData = new Magic_Dashboard(dbutils.GetDataSetFromStoredProcedure(dashboardStoredProcedureName, dataforrights));
        //    return dashboardData;
        //}
        public static IEnumerable<IGrouping<int, PerdiodChartValues>> getChartValues(dynamic data, DatabaseCommandUtils dbutils, int UserGroupID, int UserID, string UserGroupVisibiltyChildrenSet)
        {
            data.UserGroupList = UserGroupVisibiltyChildrenSet.Replace(',', '|');
            data.dateFrom = DateTime.ParseExact(data.dateFrom.ToString(), "yyyyMMdd", System.Globalization.CultureInfo.InvariantCulture);
            data.dateTo = DateTime.ParseExact(data.dateTo.ToString(), "yyyyMMdd", System.Globalization.CultureInfo.InvariantCulture);
            data.UserGroupID = UserGroupID;
            data.UserID = UserID;
            //commented for grid edit page regression ... 
            //string charts = data.chartIDs.ToString();
            //List<int> chartIds = charts.Split('|').Select(x => int.Parse(x)).ToList<int>();
            //Magic_Dashboard dashboardRightsData = getDashboardData();

            //if (!dashboardRightsData.canSeeCharts(chartIds))
            //    throw new ArgumentException(authError);

            var wrdbchecker = new WidgetRightsDBChecker(WIDGET_TYPE.CHART, dbutils.connection);
            if (!wrdbchecker.checkUserRigths(data.chartIDs.ToString()))
                throw new ArgumentException(authError);

            DatabaseCommandUtils.readresult dbres = dbutils.callStoredProcedurewithXMLInput(MagicFramework.Helpers.JsonUtils.Json2Xml(JObject.FromObject(data).ToString()), data.storedName.ToString());

            List<PerdiodChartValues> values = new List<PerdiodChartValues>();
            List<string> partialCols = new List<string>();

            foreach (DataColumn col in dbres.table.Columns)
            {
                if (col.ColumnName.StartsWith("Partial"))
                    partialCols.Add(col.ColumnName);
            }

            foreach (DataRow item in dbres.table.Rows)
            {
                string customParameter = null;
                try
                {
                    customParameter = item["customParam"].ToString();
                }
                catch
                { }

                decimal tot, numtot;
                List<decimal> partials = new List<decimal>();
                Decimal.TryParse(item["tot"] == null ? "0" : item["tot"].ToString(), out tot);
                Decimal.TryParse(item["numtot"] == null ? "0" : item["numtot"].ToString(), out numtot);

                foreach (string col in partialCols)
                {
                    decimal partial;
                    Decimal.TryParse(item[col] == null ? "0" : item[col].ToString(), out partial);
                    partials.Add(partial);

                }

                DateTime date;
                PerdiodChartValues toadd = new PerdiodChartValues
                {
                    ID = (int)item[0],
                    X = DateTime.TryParse(item[1].ToString(), out date) ? date.ToString("yyyy-MM-ddThh:mm:ss.mmm") : item[1].ToString(),
                    Partials = partials,
                    NumTot = numtot,
                    Tot = tot,
                    CustomParameter = customParameter
                };

                values.Add(toadd);
            }

            return values.GroupBy(x => x.ID);
        }
        [HttpPost]
        public Dictionary<int, PerdiodIndicatorValues> PeriodIndicators(dynamic data)
        {
            Dictionary<int, PerdiodIndicatorValues> result = new Dictionary<int, PerdiodIndicatorValues>();
            DatabaseCommandUtils dbutils = new DatabaseCommandUtils();

            data.UserGroupList = MagicFramework.UserVisibility.UserVisibiltyInfo.GetUserGroupVisibiltyChildrenSet().Replace(',', '|');
            data.dateFrom = DateTime.ParseExact(data.dateFrom.ToString(), "yyyyMMdd", System.Globalization.CultureInfo.InvariantCulture);
            data.dateTo = DateTime.ParseExact(data.dateTo.ToString(), "yyyyMMdd", System.Globalization.CultureInfo.InvariantCulture);
            data.UserGroupID = SessionHandler.UserVisibilityGroup;
            data.UserID = SessionHandler.IdUser;

            //string indicators = data.indicatorIDs.ToString();
            //List<int> indicatorIds = indicators.Split('|').Select(x => int.Parse(x)).ToList<int>();
            //Magic_Dashboard dashboardRightsData = getDashboardData();

            //if (!dashboardRightsData.canSeeIndicators(indicatorIds))
            //    throw new ArgumentException(authError);
            var wrdbchecker = new WidgetRightsDBChecker(WIDGET_TYPE.INDICATOR);
            if (!wrdbchecker.checkUserRigths(data.indicatorIDs.ToString()))
                throw new ArgumentException(authError);


            var dbres = dbutils.callStoredProcedurewithXMLInput(MagicFramework.Helpers.JsonUtils.Json2Xml(JObject.FromObject(data).ToString()), data.storedName.ToString());

            foreach (DataRow indicator in dbres.table.Rows)
            {
                result.Add((int)indicator["id"], new PerdiodIndicatorValues
                {
                    value = (double)indicator["value"],
                    percentValue = (double)indicator["percentValue"]
                });
            }

            return result;
        }

        #region Dashboard_v_1 Obsolete
        public class Indicator
        {
            public string IndicatorValue;
            public string IndicatorDescription;
            public string IndicatorHTMLClass;
            public string IndicatorDivColor;
        }

        public class ChartBaseInput
        {
            public string AnalysisType { get; set; }
            public string UserGroupList { get; set; }
            public DateTime DateFrom { get; set; }
            public DateTime DateTo { get; set; }
            public string AggrDimension { get; set; }
            public int UserID { get; set; }
            public int UserGroupID { get; set; }

        }

        public class ChartBaseOutput
        {
            public string X { get; set; }
            public decimal Partial1 { get; set; }
            public decimal Partial2 { get; set; }
            public decimal Partial3 { get; set; }
            public decimal Tot { get; set; }
            public decimal NumTot { get; set; }
            public string CustomParameter { get; set; } //e' un vaolre che puo' essere associato ad un certo "slice" per poterci costruire delle logiche ad esempio onclick
        }

        public class TimeChartBaseOutput
        {
            public DateTime X { get; set; }
            public decimal Partial1 { get; set; }
            public decimal Partial2 { get; set; }
            public decimal Partial3 { get; set; }
            public decimal Tot { get; set; }
            public decimal NumTot { get; set; }
            public string CustomParameter { get; set; } //e' un vaolre che puo' essere associato ad un certo "slice" per poterci costruire delle logiche ad esempio onclick
        }

        public class PerdiodIndicatorInput
        {
            public string UserGroupList { get; set; }
            public DateTime DateFrom { get; set; }
            public DateTime DateTo { get; set; }
            public int UserID { get; set; }
            public int UserGroupID { get; set; }

        }
        public class PerdiodIndicatorOutput
        {
            public DateTime DateFrom { get; set; }
            public DateTime DateTo { get; set; }
            public Indicator Indicator1 { get; set; }
            public Indicator Indicator2 { get; set; }
            public Indicator Indicator3 { get; set; }
            public Indicator Indicator4 { get; set; }
            public Indicator Indicator5 { get; set; }
            public Indicator Indicator6 { get; set; }
            public Indicator Indicator7 { get; set; }
            public Indicator Indicator8 { get; set; }
            public Indicator Indicator9 { get; set; }
            public Indicator Indicator10 { get; set; }
            public Indicator Indicator11 { get; set; }
            public Indicator Indicator12 { get; set; }
        }
        //get all elements of an entity
        [Obsolete]
        [HttpPost]
        public List<ChartBaseOutput> DataforBusinessObject(dynamic data)
        {
            string usergrouplist = MagicFramework.UserVisibility.UserVisibiltyInfo.GetUserGroupVisibiltyChildrenSet();
            string groupFilterField = ApplicationSettingsManager.GetVisibilityField();

            JObject obj = JObject.Parse(data.ToString());
            DateTime dateFrom = DateTime.ParseExact(obj["dst"].ToString(), "yyyyMMdd", System.Globalization.CultureInfo.InvariantCulture);
            DateTime dateTo = DateTime.ParseExact(obj["dend"].ToString(), "yyyyMMdd", System.Globalization.CultureInfo.InvariantCulture);
            
            String dimaggr = obj["aggrdim"].ToString();
            String analysisType = obj["analysisType"].ToString();

            var input = new ChartBaseInput();
            input.UserID = SessionHandler.IdUser;
            input.AggrDimension = dimaggr;
            input.AnalysisType = analysisType;
            input.DateFrom = dateFrom;
            input.DateTo = dateTo;
            input.UserGroupList = usergrouplist.Replace(',','|');
            input.UserGroupID = SessionHandler.UserVisibilityGroup;

            string json = Newtonsoft.Json.JsonConvert.SerializeObject(input);
            var xml = MagicFramework.Helpers.JsonUtils.Json2Xml(json);

            var dbutils = new MagicFramework.Helpers.DatabaseCommandUtils();

            var dbres  = dbutils.callStoredProcedurewithXMLInput(xml, "dbo.DashboardGetChartValues");

            var result = dbres.table.AsEnumerable().ToList();
      
            var dims = new List<ChartBaseOutput>();

            foreach (var item in result)
            {
                var toadd = new ChartBaseOutput();
                toadd.X = item[0].ToString();
                string Partial1 = null; 
                Partial1 = item[1].ToString();
                string Partial2 = null; 
                Partial2 = item[2].ToString();
                string Partial3 = null; 
                Partial3 = item[3].ToString();
                string Numtot = item[5].ToString();
                string Tot = item[4].ToString();
                string customParameter = null;
                try
                {
                    customParameter = item[6].ToString();
                }
                catch
                {}

                decimal partial1, partial2, partial3,numtot,tot;
                Decimal.TryParse(Partial1 == null ? "0" : Partial1 ,out partial1);
                Decimal.TryParse(Partial2 == null ? "0" : Partial2, out partial2);
                Decimal.TryParse(Partial3 == null ? "0" : Partial3, out partial3);
                Decimal.TryParse(Numtot == null ? "0" : Numtot, out numtot);
                Decimal.TryParse(Tot == null ? "0" : Tot, out tot);


                

                toadd.NumTot = numtot;
                toadd.Partial1 = partial1;
                toadd.Partial2 = partial2;
                toadd.Partial3 = partial3;
                toadd.Tot = tot;
                toadd.CustomParameter = customParameter;

                dims.Add(toadd);
            }


            return dims;

        }
        [Obsolete]
        [HttpPost]
        public List<TimeChartBaseOutput> timeDataforBusinessObject(dynamic data)
        {


            string usergrouplist = MagicFramework.UserVisibility.UserVisibiltyInfo.GetUserGroupVisibiltyChildrenSet();

            string groupFilterField = ApplicationSettingsManager.GetVisibilityField();

            JObject obj = JObject.Parse(data.ToString());

            DateTime dateFrom = DateTime.ParseExact(obj["dst"].ToString(), "yyyyMMdd", System.Globalization.CultureInfo.InvariantCulture);
            DateTime dateTo = DateTime.ParseExact(obj["dend"].ToString(), "yyyyMMdd", System.Globalization.CultureInfo.InvariantCulture);
            String dimaggr = obj["aggrdim"].ToString();
            String analysisType = obj["analysisType"].ToString();

            var input = new ChartBaseInput();
            input.AggrDimension = dimaggr;
            input.AnalysisType = analysisType;
            input.DateFrom = dateFrom;
            input.DateTo = dateTo;
            input.UserGroupList = usergrouplist.Replace(',', '|');
            input.UserID = SessionHandler.IdUser;
            input.UserGroupID = SessionHandler.UserVisibilityGroup;
            string json = Newtonsoft.Json.JsonConvert.SerializeObject(input);
            var xml = MagicFramework.Helpers.JsonUtils.Json2Xml(json);

            var dbutils = new MagicFramework.Helpers.DatabaseCommandUtils();

            var dbres = dbutils.callStoredProcedurewithXMLInput(xml, "dbo.DashboardGetChartValues");

            var result = dbres.table.AsEnumerable().ToList();

            var dims = new List<TimeChartBaseOutput>();
            foreach (var item in result)
                {
                    var toadd = new TimeChartBaseOutput();
                    toadd.X = Convert.ToDateTime(item[0].ToString());
                    string Partial1 = null;
                    Partial1 = item[1].ToString();
                    string Partial2 = null;
                    Partial2 = item[2].ToString();
                    string Partial3 = null;
                    Partial3 = item[3].ToString();
                    string Numtot = item[5].ToString();
                    string Tot = item[4].ToString();
                    string customParameter = null;
                    try
                    {
                        customParameter = item[6].ToString();
                    }
                    catch
                    { }
                    decimal partial1, partial2, partial3, numtot,tot;
                    Decimal.TryParse(Partial1 == null ? "0" : Partial1, out partial1);
                    Decimal.TryParse(Partial2 == null ? "0" : Partial2, out partial2);
                    Decimal.TryParse(Partial3 == null ? "0" : Partial3, out partial3);
                    Decimal.TryParse(Numtot == null ? "0" : Numtot, out numtot);
                    Decimal.TryParse(Tot == null ? "0" : Tot, out tot);

    

                    toadd.NumTot = numtot;
                    toadd.Partial1 = partial1;
                    toadd.Partial2 = partial2;
                    toadd.Partial3 = partial3;
                    toadd.Tot = tot;
                    toadd.CustomParameter = customParameter;

                    dims.Add(toadd);
                }
            

            var res = new Dictionary<DateTime, decimal[]>();


            foreach (var d in dims)
            {
                Decimal[] values =  {d.Tot, d.NumTot, d.Partial1, d.Partial2, d.Partial3};
                DateTime key = DateTime.Now;
                if (dimaggr == "weeks")
                {
                    int delta = DayOfWeek.Monday - d.X.DayOfWeek;
                    key = d.X.AddDays(delta);
                }
                if (dimaggr == "months")
                {
                    key = new DateTime(d.X.Year,d.X.Month,1);
 
                }
                if (dimaggr == "years")
                {
                    key = new DateTime(d.X.Year, 1, 1);

                }

                    if (res.ContainsKey(key))
                    {
                        res[key][0] = res[key][0] + values[0];
                        res[key][1] = res[key][1] + values[1];
                    }
                    else
                        res.Add(key, values);
                
            }

            dims.Clear();

            foreach (var x in res)
            {
                var ele = new TimeChartBaseOutput();
                ele.X = x.Key;
                ele.Tot = x.Value[0];
                ele.NumTot = x.Value[1];
                ele.Partial1 = x.Value[2];
                ele.Partial2 = x.Value[3];
                ele.Partial3 = x.Value[4];
                if (ele.Tot>0 || ele.NumTot>0 )
                    dims.Add(ele);
            }

            return dims;

        }
        [Obsolete]
        [HttpPost]
        public List<PerdiodIndicatorOutput> PostPeriodIndicators(dynamic data)
        {

            string usergrouplist = MagicFramework.UserVisibility.UserVisibiltyInfo.GetUserGroupVisibiltyChildrenSet();

            string groupFilterField = ApplicationSettingsManager.GetVisibilityField();

            JObject obj = JObject.Parse(data.ToString());

            DateTime dateFrom = DateTime.ParseExact(obj["dst"].ToString(), "yyyyMMdd", System.Globalization.CultureInfo.InvariantCulture);
            DateTime dateTo = DateTime.ParseExact(obj["dend"].ToString(), "yyyyMMdd", System.Globalization.CultureInfo.InvariantCulture);
            String qualfilter = obj["qualfilter"].ToString();

            var input = new PerdiodIndicatorInput();
            input.DateFrom = dateFrom;
            input.DateTo = dateTo;
            input.UserGroupList = usergrouplist.Replace(',','|');
            input.UserID = SessionHandler.IdUser;
            input.UserGroupID = SessionHandler.UserVisibilityGroup;

            string json = Newtonsoft.Json.JsonConvert.SerializeObject(input);
            var xml = MagicFramework.Helpers.JsonUtils.Json2Xml(json);

            var dbutils = new MagicFramework.Helpers.DatabaseCommandUtils();

            var dbres = dbutils.callStoredProcedurewithXMLInput(xml, "dbo.DashboardGetIndicators");

            var result = dbres.table.AsEnumerable().ToList();
            var dims = new List<PerdiodIndicatorOutput>();
         //  var resdb = _context.GetPeriodIndicators(usergrouplist.Replace(',','|'), dateFrom, dateTo, null);
            foreach (var item in result)
            {
                var toadd = new PerdiodIndicatorOutput();
                toadd.DateFrom = Convert.ToDateTime(item[0].ToString());
                toadd.DateTo = Convert.ToDateTime(item[1].ToString());
                toadd.Indicator1 = new Indicator();
                toadd.Indicator2 = new Indicator();
                toadd.Indicator3 = new Indicator();
                toadd.Indicator4 = new Indicator();
                toadd.Indicator5 = new Indicator();
                toadd.Indicator6 = new Indicator();
                toadd.Indicator7 = new Indicator();
                toadd.Indicator8 = new Indicator();
                toadd.Indicator9 = new Indicator();
                toadd.Indicator10 = new Indicator();
                toadd.Indicator11 = new Indicator();
                toadd.Indicator12 = new Indicator();
               
                toadd.Indicator1.IndicatorValue = item[2].ToString().Split('|')[0];
                toadd.Indicator1.IndicatorDescription = item[2].ToString().Split('|')[1];
                toadd.Indicator1.IndicatorHTMLClass = item[2].ToString().Split('|')[2];
                toadd.Indicator1.IndicatorDivColor = item[2].ToString().Split('|')[3];
                toadd.Indicator2.IndicatorValue = item[3].ToString().Split('|')[0];
                toadd.Indicator2.IndicatorDescription = item[3].ToString().Split('|')[1];
                toadd.Indicator2.IndicatorHTMLClass = item[3].ToString().Split('|')[2];
                toadd.Indicator2.IndicatorDivColor = item[3].ToString().Split('|')[3];
                toadd.Indicator3.IndicatorValue = item[4].ToString().Split('|')[0];
                toadd.Indicator3.IndicatorDescription = item[4].ToString().Split('|')[1];
                toadd.Indicator3.IndicatorHTMLClass = item[4].ToString().Split('|')[2];
                toadd.Indicator3.IndicatorDivColor = item[4].ToString().Split('|')[3];
                toadd.Indicator4.IndicatorValue = item[5].ToString().Split('|')[0];
                toadd.Indicator4.IndicatorDescription = item[5].ToString().Split('|')[1];
                toadd.Indicator4.IndicatorHTMLClass = item[5].ToString().Split('|')[2];
                toadd.Indicator4.IndicatorDivColor = item[5].ToString().Split('|')[3];
                toadd.Indicator5.IndicatorValue = item[6].ToString().Split('|')[0];
                toadd.Indicator5.IndicatorDescription = item[6].ToString().Split('|')[1];
                toadd.Indicator5.IndicatorHTMLClass = item[6].ToString().Split('|')[2];
                toadd.Indicator5.IndicatorDivColor = item[6].ToString().Split('|')[3];
                toadd.Indicator6.IndicatorValue = item[7].ToString().Split('|')[0];
                toadd.Indicator6.IndicatorDescription = item[7].ToString().Split('|')[1];
                toadd.Indicator6.IndicatorHTMLClass = item[7].ToString().Split('|')[2];
                toadd.Indicator6.IndicatorDivColor = item[7].ToString().Split('|')[3];
                toadd.Indicator7.IndicatorValue = item[8].ToString().Split('|')[0];
                toadd.Indicator7.IndicatorDescription = item[8].ToString().Split('|')[1];
                toadd.Indicator7.IndicatorHTMLClass = item[8].ToString().Split('|')[2];
                toadd.Indicator7.IndicatorDivColor = item[8].ToString().Split('|')[3];
                toadd.Indicator8.IndicatorValue = item[9].ToString().Split('|')[0];
                toadd.Indicator8.IndicatorDescription = item[9].ToString().Split('|')[1];
                toadd.Indicator8.IndicatorHTMLClass = item[9].ToString().Split('|')[2];
                toadd.Indicator8.IndicatorDivColor = item[9].ToString().Split('|')[3];
                toadd.Indicator9.IndicatorValue = item[10].ToString().Split('|')[0];
                toadd.Indicator9.IndicatorDescription = item[10].ToString().Split('|')[1];
                toadd.Indicator9.IndicatorHTMLClass = item[10].ToString().Split('|')[2];
                toadd.Indicator9.IndicatorDivColor = item[10].ToString().Split('|')[3];
                toadd.Indicator10.IndicatorValue = item[11].ToString().Split('|')[0];
                toadd.Indicator10.IndicatorDescription = item[11].ToString().Split('|')[1];
                toadd.Indicator10.IndicatorHTMLClass = item[11].ToString().Split('|')[2];
                toadd.Indicator10.IndicatorDivColor = item[11].ToString().Split('|')[3];
                toadd.Indicator11.IndicatorValue = item[12].ToString().Split('|')[0];
                toadd.Indicator11.IndicatorDescription = item[12].ToString().Split('|')[1];
                toadd.Indicator11.IndicatorHTMLClass = item[12].ToString().Split('|')[2];
                toadd.Indicator11.IndicatorDivColor = item[12].ToString().Split('|')[3];
                toadd.Indicator12.IndicatorValue = item[13].ToString().Split('|')[0];
                toadd.Indicator12.IndicatorDescription = item[13].ToString().Split('|')[1];
                toadd.Indicator12.IndicatorHTMLClass = item[13].ToString().Split('|')[2];
                toadd.Indicator12.IndicatorDivColor = item[13].ToString().Split('|')[3];

                dims.Add(toadd);
            }


            return dims;

        }
        #endregion

    }
}