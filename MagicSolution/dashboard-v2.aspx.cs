using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.HtmlControls;
using MagicFramework.Helpers;
using System.IO;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using System.Dynamic;
using System.Data;
using MagicFramework.Models;
using System.Text.RegularExpressions;
using MagicFramework.Controllers;

namespace MagicSolution
{
    public partial class dashboard_v2 : MagicFramework.Helpers.PageBase
    {
        private string basePath;
        private string masterPageName;

        protected void Page_Load(object sender, EventArgs e)
        {
            basePath = Utils.GetBasePath();
            masterPageName = Regex.Match(ApplicationSettingsManager.GetMasterPage(), @"[a-zA-Z]+").Groups[0].Value.ToLower();

            string dashboardStoredProcedureName = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).dashboardStoredProcedureName;
            dashboardStoredProcedureName = string.IsNullOrEmpty(dashboardStoredProcedureName) ? "dbo.DashBoardGetAllObjects" : dashboardStoredProcedureName;
            DatabaseCommandUtils dbutils = new DatabaseCommandUtils();
            dynamic data = new ExpandoObject();
            data.applicationareaid = SessionHandler.CurrentModule;
            Magic_Dashboard dashboardData = new Magic_Dashboard(dbutils.GetDataSetFromStoredProcedure(dashboardStoredProcedureName, data));

            if (dashboardData.Tabs.Count > 0 && dashboardTabs != null)
            {
                int i = 0;
                HtmlGenericControl tabList = new HtmlGenericControl(HtmlControlTypes.ul);
                HtmlGenericControl tabContent = new HtmlGenericControl(HtmlControlTypes.div);
                tabList.Attributes.Add("class", "nav nav-pills");
                tabContent.Attributes.Add("class", "tab-content");


                // ------------ add container for dashboard menu
                bool showDashboardModuleMenu = ApplicationSettingsManager.showDashBoardTabMenu();
                Magic_Mmb_ModulesController modulesController = new Magic_Mmb_ModulesController();
                var appAreas = modulesController.GetAllApplicationAreas();
                bool atLeastOneAreaIsVisible = false;
                foreach(var area in appAreas)
                {
                    if(area.IsHidden == false)
                    {
                        atLeastOneAreaIsVisible = true;
                    }
                }

                if (showDashboardModuleMenu && appAreas.Count > 0 && atLeastOneAreaIsVisible)
                {
                    string menuId = "dashboard-tab-menu";
                    HtmlGenericControl menuTabElement = new HtmlGenericControl(HtmlControlTypes.li);
                    HtmlGenericControl menuTabContent = new HtmlGenericControl(HtmlControlTypes.div);
                
                    menuTabContent.Attributes.Add("id", menuId);
                    menuTabContent.Attributes.Add("class", "tab-pane row active");
                    menuTabElement.Attributes.Add("class", "active");
                    menuTabElement.InnerHtml = string.Format("<a data-toggle='tab' href='#{0}'>{1}</a>", menuId, "HOME");

                    tabList.Controls.Add(menuTabElement);
                    tabContent.Controls.Add(menuTabContent);
                    i++;
                }
                // ------------


                foreach (Magic_Dashboard.Tab tab in dashboardData.Tabs.OrderBy(x => x.OrdinalPosition))
                {
                    HtmlGenericControl tabElement = new HtmlGenericControl(HtmlControlTypes.li);
                    HtmlGenericControl content = new HtmlGenericControl(HtmlControlTypes.div);
                    string htmlId = "dashboard-tab-" + tab.ID;
                    content.Attributes.Add("id", htmlId);
                    content.Attributes.Add("class", "tab-pane row" + (i == 0 ? " active" : ""));
                    if (i == 0)
                        tabElement.Attributes.Add("class", "active");
                    if (!String.IsNullOrEmpty(tab.GridName))
                        content.Attributes.Add("data-grid-name", tab.GridName);
                    if (tab.HelpGUID != null)
                        content.Attributes.Add("data-help-guid", tab.HelpGUID.ToString());
                    content.Attributes.Add("data-hide-global-range-picker", tab.HideGlobalRangePicker.ToString().ToLower());

                    //Add User Customizations in dashboard
                    string customizationAnchors = String.Empty;
                    if (ApplicationSettingsManager.GetDashboardIsCustomizable())
                        customizationAnchors = " <span title='Add content' class='fa fa-plus customizationSpan' onclick='addUserCustomization(this);'></span> <span title='Clone this tab' class='fa fa-clone customizationSpan' onclick='cloneTabUserCustomization(this);'></span> <span title='Clear customizations' onclick='deleteUserCustomizations(this);' href='javascript:;' class='fa fa-user-times customizationSpan'></span>";
                    tabElement.InnerHtml = string.Format("<a data-toggle='tab' href='#{0}'>{1}{2}</a>", htmlId, tab.Label,customizationAnchors);
                    
                    //add tab content groups with contents
                    foreach (Magic_Dashboard.TabContentGroup TabContentGroup in dashboardData.TabContentGroups.Where(x => x.Tab_ID.Equals(tab.ID)).OrderBy(x => x.OrdinalPosition))
                    {
                        HtmlGenericControl groupContainer = new HtmlGenericControl(HtmlControlTypes.div);
                        HtmlGenericControl groupBody = new HtmlGenericControl(HtmlControlTypes.div);
                        HtmlGenericControl groupBodyWrapper = new HtmlGenericControl(HtmlControlTypes.div);
                        string groupId = "content-group-" + TabContentGroup.ID;
                        //string tabId = "content-tab-" + TabContentGroup.ID;

                        groupContainer.Attributes.Add("class", "panel panel-default col-md-12");
                        //groupContainer.Attributes.Add("id", tabId);
                        groupContainer.InnerHtml = "<div class='panel-heading' role='tab'><a data-toggle='collapse' href='#" + groupId + "'><h3 class='panel-title'>" + TabContentGroup.Label + "</h3></a></div>";

                        groupBodyWrapper.Attributes.Add("id", groupId);
                        groupBodyWrapper.Attributes.Add("class", "panel-collapse collapse in");
                        groupBodyWrapper.Attributes.Add("role", "tabpanel");
                        //groupBodyWrapper.Attributes.Add("aria-labelledby", groupId);

                        groupBody.Attributes.Add("class", "panel-body row");
                        foreach (Magic_Dashboard.TabContent TabContent in tab.TabContents.Where(x => x.ContentGroup_ID.Equals(TabContentGroup.ID) && x.Tab_ID.Equals(tab.ID) && x.ContentObject != null).OrderBy(x => x.OrdinalPosition))
                        {
                            groupBody.Controls.Add(getContentElement(TabContent));
                        }
                        groupBodyWrapper.Controls.Add(groupBody);
                        groupContainer.Controls.Add(groupBodyWrapper);
                        content.Controls.Add(groupContainer);
                    }

                    //add contents without tab content group
                    foreach (Magic_Dashboard.TabContent TabContent in tab.TabContents.Where(x => x.ContentGroup_ID == null && x.ContentObject != null).OrderBy(x => x.OrdinalPosition))
                    {

                        content.Controls.Add(getContentElement(TabContent));
                    }

                    if (content.Controls.Count > 0)
                    {
                        i++;
                        tabList.Controls.Add(tabElement);
                        tabContent.Controls.Add(content);
                    }
                }
                if (tabList.Controls.Count > 1)
                    dashboardTabs.Controls.Add(tabList);
                dashboardTabs.Controls.Add(tabContent);
            }
            //TODO insert here the call to SISENSE ENDPOINT if the config file has been set-up
        }

        private HtmlGenericControl getContentElement(Magic_Dashboard.TabContent TabContent)
        {
            HtmlGenericControl contentElement = new HtmlGenericControl(HtmlControlTypes.div);
            contentElement.Attributes.Add("class", TabContent.BtstrpClmnClss);
            contentElement.Attributes.Add("ordinalPosition", TabContent.OrdinalPosition.ToString());
            contentElement.Attributes.Add("btstrpclmnclss", TabContent.BtstrpClmnClss.ToString());
            string htmlId = "dashboard-tab-content-" + TabContent.ID;
            switch (TabContent.ContentTypeCode)
            {
                case "GRID":
                    HtmlGenericControl content = new HtmlGenericControl(HtmlControlTypes.div);
                    content.Attributes.Add("id", htmlId);
                    content.Attributes.Add("data-content", 
                        JObject.FromObject(new 
                        { type = "GRID", gridName = TabContent.ContentObject["MagicGridName"] }).ToString(Formatting.None));
                    contentElement.Controls.Add(content);
                    break;
                case "INDICATOR":
                    contentElement.Attributes.Add("id", htmlId);
                    contentElement.Attributes.Add("data-content", JObject.FromObject(new {
                        indicatorId = TabContent.ContentObject["ID"],
                        type = "INDICATOR",
                        description = TabContent.ContentObject["Description"],
                        iconClass = TabContent.ContentObject["IconClass"],
                        color = TabContent.ContentObject["Color"],
                        functionGUID = TabContent.ContentObject["FunctionGUID"],
                        functionID = TabContent.ContentObject["FunctionID"],
                        gridName = TabContent.ContentObject["MagicGridName"],
                        functionFilter = TabContent.ContentObject["FunctionFilter"],
                        measurementUnit = TabContent.ContentObject["MeasurementUnit"],
                        objectLoadSP = TabContent.ContentObject["ObjectLoadSP"],
                        subValuesLoadSp = TabContent.ContentObject["SubValuesLoadSP"]
                    }).ToString(Formatting.None));
                    contentElement.Attributes.Add("ng-controller", "DashboardIndicatorController as dic");
                    contentElement.Attributes.Add("ng-include", "'/Magic/Views/Templates/HtmlTemplates/" + masterPageName + "-indicator.html'");
                    contentElement.Attributes.Add("onload", "dic.onload()");
                    break;
                case "CHART":
                    contentElement.Attributes.Add("id", htmlId);
                    contentElement.Attributes.Add("data-content", JObject.FromObject(new {
                        chartId = TabContent.ContentObject["ID"],
                        type = "CHART",
                        description = TabContent.ContentObject["Description"],
                        aggregationDim = TabContent.ContentObject["AggregationDim"],
                        isDate = TabContent.ContentObject["AggregationDimensionIsDate"],
                        analysisType = TabContent.ContentObject["AnalysisType"],
                        chartType = TabContent.ContentObject["ChartType"],
                        graphRowNumber = TabContent.ContentObject["GraphRowNumber"],
                        partialLabels = TabContent.ContentObject["PartialLabels"],
                        yMeasureUnit = TabContent.ContentObject["YAxisMeasurementUnit"],
                        functionGUID = TabContent.ContentObject["FunctionGUID"],
                        functionID = TabContent.ContentObject["FunctionID"],
                        gridName = TabContent.ContentObject["MagicGridName"],
                        functionFilter = TabContent.ContentObject["FunctionFilter"],
                        objectLoadSP = TabContent.ContentObject["ObjectLoadSP"],
                        extension = TabContent.ContentObject["ChartExtension"]
                    }).ToString(Formatting.None));
                    contentElement.InnerHtml = string.Format(File.ReadAllText(basePath + @"Magic\Views\Templates\HtmlTemplates\" + masterPageName + "-chart.html"), TabContent.ContentObject["Description"], TabContent.ContentObject["IconClass"]);
                    break;
                case "CUSTOM":
                    contentElement.Attributes.Add("id", htmlId);
                    
                    string path = basePath + @"Views\" + SessionHandler.ApplicationInstanceId + @"\Templates\HtmlTemplates";
                    string HtmlUrl = (TabContent.ContentObject["HtmlUrl"] is System.DBNull) ? string.Empty : (string)TabContent.ContentObject["HtmlUrl"];
                    string HtmlContent = (TabContent.ContentObject["HtmlContent"] is System.DBNull) ? string.Empty : (string)TabContent.ContentObject["HtmlContent"];

                    if (!string.IsNullOrEmpty(HtmlUrl) && File.Exists(Path.Combine(path, HtmlUrl)))
                        contentElement.InnerHtml = File.ReadAllText(Path.Combine(path, HtmlUrl));
                    else if (!string.IsNullOrEmpty(HtmlContent))
                        contentElement.InnerHtml = HtmlContent;

                    if (!contentElement.InnerHtml.Contains("ng-controller"))
                    {
                        contentElement.Attributes.Add("data-content", JObject.FromObject(new
                        {
                            type = "CUSTOM",
                        }).ToString(Formatting.None));
                        contentElement.Attributes.Add("ng-controller", "FormOptionsController as foc");
                    }
                    break;
            }

            return contentElement;
        }
    }
}