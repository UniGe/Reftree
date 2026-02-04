using System;
using System.Data;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models
{
    public class Magic_Dashboard
    {
        public List<Tab> Tabs { get; set; }
        private DataTable TabContents { get; set; }
        public List<TabContentGroup> TabContentGroups { get; set; }
        private DataTable Charts { get; set; }
        private DataTable Indicators { get; set; }
        private DataTable Grids { get; set; }
        private DataTable HtmlTemplates { get; set; }

        public Magic_Dashboard(DataSet dataSet)
        {
            this.Tabs = new List<Tab>();
            this.TabContents = dataSet.Tables[1];
            this.TabContentGroups = new List<TabContentGroup>();
            this.Charts = dataSet.Tables[3];
            this.Indicators = dataSet.Tables[4];
            this.Grids = dataSet.Tables[5];
            this.HtmlTemplates = dataSet.Tables[6];

            foreach (DataRow TabContentGroup in dataSet.Tables[2].Rows)
            {
                this.TabContentGroups.Add(new TabContentGroup(TabContentGroup));
            }
            foreach (DataRow Tab in dataSet.Tables[0].Rows)
            {
                this.Tabs.Add(new Tab(Tab, this));
            }
        }
        public bool canSeeCharts(List<int> chartIDs) {
            List<int> visibleChartIds = new List<int>();
            foreach (DataRow chart in this.Charts.Rows)
            {
                visibleChartIds.Add(chart.Field<int>("ID"));
            }
            bool cansee = true;
            foreach (var ci in chartIDs)
            {
                if (visibleChartIds.IndexOf(ci) == -1)
                {
                    cansee = false;
                    break;
                }
            }
            return cansee;
        }
        public bool canSeeIndicators(List<int> indicatorIDs)
        {
            List<int> visibleIndicatorIds = new List<int>();
            foreach (DataRow indicator in this.Indicators.Rows)
            {
                visibleIndicatorIds.Add(indicator.Field<int>("ID"));
            }
            bool cansee = true;
            foreach (var ci in indicatorIDs)
            {
                if (visibleIndicatorIds.IndexOf(ci) == -1)
                {
                    cansee = false;
                    break;
                }
            }
            return cansee;
        }
        public class Tab
        {
            public int ID { get; set; }
            public string Code { get; set; }
            public string Label { get; set; }
            public int OrdinalPosition { get; set; }
            public string GridName { get; set; }
            public bool HideGlobalRangePicker { get; set; }
            public List<TabContent> TabContents { get; set; }
            public System.Guid? HelpGUID { get; set; }
            public Tab(DataRow Tab, Magic_Dashboard dashboard)
            {
                this.ID = (int)Tab["ID"];
                this.Code = (string)Tab["TabCode"];
                this.Label = (string)Tab["TabLabel"];
                this.OrdinalPosition = (Tab["TabOrdinalPosition"] is System.DBNull) ? 0 : (int)Tab["TabOrdinalPosition"];
                this.GridName = (Tab["GridName"] is System.DBNull) ? null : (string)Tab["GridName"];
                if (Tab.Table.Columns.Contains("HelpGUID"))
                {
                    this.HelpGUID = Tab["HelpGUID"] is System.DBNull ? null : (Guid?)Tab["HelpGUID"];
                }
                if (Tab.Table.Columns.Contains("HideGlobalRangePicker"))
                    this.HideGlobalRangePicker = (bool)Tab["HideGlobalRangePicker"];
                else
                    this.HideGlobalRangePicker = false;
                this.TabContents = new List<TabContent>();

                foreach (DataRow TabContent in dashboard.TabContents.AsEnumerable().Where(x => x["Tab_ID"].Equals(this.ID)))
                {
                    this.TabContents.Add(new TabContent(TabContent, dashboard));
                }
            }
        }

        public class TabContentGroup
        {
            public int ID { get; set; }
            public int Tab_ID { get; set; }
            public string Label { get; set; }
            public int OrdinalPosition { get; set; }
            public TabContentGroup(DataRow TabContentGroup)
            {
                this.ID = (int)TabContentGroup["ID"];
                this.Tab_ID = (int)TabContentGroup["Tab_ID"];
                this.Label = (string)TabContentGroup["GroupLabel"];
                this.OrdinalPosition = (TabContentGroup["OrdinalPosition"] is System.DBNull) ? 0 : (int)TabContentGroup["OrdinalPosition"];
            }
        }

        public class TabContent
        {
            public int ID { get; set; }
            public int Tab_ID { get; set; }
            public int OrdinalPosition { get; set; }
            public string BtstrpClmnClss { get; set; }
            public string ContentTypeCode { get; set; }
            public int? ContentGroup_ID { get; set; }
            public DataRow ContentObject { get; set; }
            public TabContent(DataRow TabContent, Magic_Dashboard dashboard)
            {
                this.ID = (int)TabContent["ID"];
                this.Tab_ID = (int)TabContent["Tab_ID"];
                this.OrdinalPosition = (TabContent["OrdinalPosition"] is System.DBNull) ? 0 : (int)TabContent["OrdinalPosition"];
                this.BtstrpClmnClss = (TabContent["BtstrpClmnClss"] is System.DBNull) ? "" : (string)TabContent["BtstrpClmnClss"];
                this.ContentTypeCode = (string)TabContent["ContentTypeCode"];
                this.ContentGroup_ID = (TabContent["ContentGroup_ID"] is System.DBNull) ? null : (int?)TabContent["ContentGroup_ID"];

                switch (ContentTypeCode)
                {
                    case "CHART":
                        this.ContentObject = dashboard.Charts.AsEnumerable().Where(x => x["TabContent_ID"].Equals(this.ID)).FirstOrDefault();
                        break;
                    case "INDICATOR":
                        this.ContentObject = dashboard.Indicators.AsEnumerable().Where(x => x["TabContent_ID"].Equals(this.ID)).FirstOrDefault();
                        break;
                    case "GRID":
                        this.ContentObject = dashboard.Grids.AsEnumerable().Where(x => x["TabContent_ID"].Equals(this.ID)).FirstOrDefault();
                        break;
                    case "CUSTOM":
                        this.ContentObject = dashboard.HtmlTemplates.AsEnumerable().Where(x => x["TabContent_ID"].Equals(this.ID)).FirstOrDefault();
                        break;
                }
            }
        }
    }
}