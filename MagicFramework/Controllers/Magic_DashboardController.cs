using MagicFramework.Helpers;
using MagicFramework.Helpers.Sql;
using MagicFramework.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Data;
using System.Dynamic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web;
using System.Web.Http;

namespace MagicFramework.Controllers
{
    public class Magic_DashboardController : ApiController
    {
        private DatabaseCommandUtils dbutils = new DatabaseCommandUtils();
        #region
        //#region :new methods to replace querying data with MF.api.get()  
        private MFAPIGetQueries mfApi = new MFAPIGetQueries(DBConnectionManager.GetTargetConnection());

        [HttpPost]
        public Models.Response GetSpreadsheetByCode(dynamic data)
        {
            return mfApi.GetSpreadsheetByCode(data.Code.Value);
        }

        [HttpPost]
        public Models.Response GetChartData(dynamic data)
        {
            return mfApi.GetChart(data.guid.Value, data.id.Value);
        }

        [HttpPost]
        public Models.Response GetIndicator(dynamic data) {
            return mfApi.GetIndicator(data.id.Value, data.code.Value);
        }        
        
        [HttpPost]
        public Models.Response GetCustomHtml(dynamic data) {
            return mfApi.GetCustomHtml(data.id.Value);
        }

        [HttpGet]
        public Models.Response GetDashboardContentType() { 
            return mfApi.GetDashboardContentType();
        }

        [HttpPost]
        public Models.Response GetChartData(string guid, string id)
        {
            MFAPIGetQueries queries = new MFAPIGetQueries(DBConnectionManager.GetTargetConnection());
            return queries.GetChart(guid, id);
        }
        #endregion


        [HttpGet]
        public DashboardData getDashboardData()
        {
            string targetConnection = DBConnectionManager.GetTargetConnection();
            string magicConnection = DBConnectionManager.GetMagicConnection();
            DataSet dataSet = dbutils.GetDataSetFromStoredProcedure("dbo.DashBoardGetEditorObjects", new ExpandoObject(), targetConnection);
            List<DropdownValues> grids = null;

            if (targetConnection != magicConnection)
            {
                Data.MagicDBDataContext _context = new Data.MagicDBDataContext(magicConnection);
                grids = _context.Magic_Grids.Select(x => new DropdownValues { value = x.MagicGridID, label = x.MagicGridName }).ToList();
            }

            return new DashboardData(dataSet, grids);
        }

        [HttpPost]
        public List<Magic_DashBoardTabContent> saveDashboardData(dynamic Contents)
        {
            DataSet dataSet = dbutils.GetDataSetFromStoredProcedure("dbo.DashBoardSaveEditorObjects", Contents);

            if (dataSet.Tables[1].Rows.Count > 0)
            {
                BUILDFUNCTIONTREEController builder = new BUILDFUNCTIONTREEController();
                string baseUrl = @"/" + ApplicationSettingsManager.GetLandingPage();
                string name = "Dashboard";
                Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());

                //get dashboard function
                Data.Magic_Functions function = _context.Magic_Functions.Where(x => x.FunctionBaseUrl.Equals(baseUrl) && x.FunctionName.Equals(name)).FirstOrDefault();

                //create dashboard function if not exists
                if (function == null)
                {
                    function = new Data.Magic_Functions
                    {
                        FunctionName = name,
                        FunctionBaseUrl = baseUrl,
                        GUID = Guid.NewGuid(),
                        isSystemFunction = true
                    };
                    _context.Magic_Functions.InsertOnSubmit(function);
                    _context.SubmitChanges();
                    function = _context.Magic_Functions.Where(x => x.FunctionBaseUrl.Equals(baseUrl) && x.FunctionName.Equals(name)).FirstOrDefault();
                }

                //get FunctionsGrids of function
                List<Data.Magic_FunctionsGrids> FunctionsGrids = function.Magic_FunctionsGrids.ToList();
                foreach (DataRow grid in dataSet.Tables[1].AsEnumerable())
                {
                    Data.Magic_FunctionsGrids FunctionsGrid = FunctionsGrids.Where(x => x.MagicGrid_ID.Equals((int)grid["MagicGridID"])).FirstOrDefault();
                    //create functionGrid if not exists
                    if (FunctionsGrid == null)
                    {
                        FunctionsGrid = new Data.Magic_FunctionsGrids
                        {
                            MagicFunction_ID = function.FunctionID,
                            MagicGrid_ID = (int)grid["MagicGridID"],
                            isRoot = true
                        };
                        _context.Magic_FunctionsGrids.InsertOnSubmit(FunctionsGrid);
                    }
                    //delete functionGrid from list if exists
                    else
                    {
                        FunctionsGrids.Remove(FunctionsGrid);
                    }
                }

                if (FunctionsGrids.Count > 0)
                {
                    //delete functionGrids which are not in result
                    _context.Magic_FunctionsGrids.DeleteAllOnSubmit(FunctionsGrids);
                }

                //save changes
                _context.SubmitChanges();
                //refresh template list
                builder.RefreshFunctionTemplateList(function.FunctionID, "create", null);
            }


            return dataSet.Tables[0].AsEnumerable().Select(r => new Magic_DashBoardTabContent(r)).ToList();
        }

        public class DashboardData
        {
            public List<Magic_DashBoardTabs> tabs { get; set; }
            public List<Magic_DashBoardContentGroups> groups { get; set; }
            public List<Magic_DashBoardTabContent> contents { get; set; }
            public List<DropdownValues> contentTypes { get; set; }
            public Dictionary<int, List<DropdownValues>> contentObjects { get; set; }

            public DashboardData(DataSet dataSet, List<DropdownValues> grids)
            {
                this.tabs = dataSet.Tables[0].AsEnumerable().Select(r => new Magic_DashBoardTabs(r)).ToList();
                this.groups = dataSet.Tables[1].AsEnumerable().Select(r => new Magic_DashBoardContentGroups(r)).ToList();
                this.contents = dataSet.Tables[2].AsEnumerable().Select(r => new Magic_DashBoardTabContent(r)).ToList();
                this.contentTypes = dataSet.Tables[3].AsEnumerable().Select(r => new DropdownValues(r)).ToList();
                this.contentObjects = new Dictionary<int, List<DropdownValues>>();

                foreach (DropdownValues contentType in this.contentTypes)
                {
                    switch (contentType.label)
                    {
                        case "GRID":
                            if (grids != null)
                                contentObjects.Add(contentType.value, grids);
                            else
                                contentObjects.Add(contentType.value, dataSet.Tables[4].AsEnumerable().Select(r => new DropdownValues(r)).ToList());
                            break;
                        case "CHART":
                            contentObjects.Add(contentType.value, dataSet.Tables[5].AsEnumerable().Select(r => new DropdownValues(r)).ToList());
                            break;
                        case "INDICATOR":
                            contentObjects.Add(contentType.value, dataSet.Tables[6].AsEnumerable().Select(r => new DropdownValues(r)).ToList());
                            break;
                        case "CUSTOM":
                            contentObjects.Add(contentType.value, dataSet.Tables[7].AsEnumerable().Select(r => new DropdownValues(r)).ToList());
                            break;
                    }
                }
            }
        }

        public class Magic_DashBoardTabs
        {
            public int id { get; set; }
            public string code { get; set; }
            public bool active { get; set; }
            public int position { get; set; }
            public Guid? HelpGUID { get; set; }

            public Magic_DashBoardTabs(DataRow Tab)
            {
                this.id = (int)Tab["ID"];
                this.code = (string)Tab["Code"];
                if (Tab.Table.Columns.Contains("HelpGUID"))
                {
                    this.HelpGUID = Tab["HelpGUID"] is System.DBNull ? null : (Guid?)Tab["HelpGUID"];
                }
                this.active = (bool)Tab["Active"];
                this.position = (int)Tab["OrdinalPosition"];
            }
        }

        public class Magic_DashBoardContentGroups
        {
            public int id { get; set; }
            public int tabId { get; set; }
            public string code { get; set; }
            public int position { get; set; }
            public Magic_DashBoardContentGroups(DataRow Group)
            {
                this.id = (int)Group["ID"];
                this.tabId = (int)Group["DashBoardTab_ID"];
                this.code = (string)Group["Code"];
                this.position = (int)Group["OrdinalPosition"];
            }
        }

        public class Magic_DashBoardTabContent
        {
            public int id { get; set; }
            public int tabId { get; set; }
            public int contentTypeId { get; set; }
            public int contentObjectId { get; set; }
            public int position { get; set; }
            public string columnClass { get; set; }
            public int? groupId { get; set; }
            public bool active { get; set; }
            public Magic_DashBoardTabContent(DataRow Content)
            {
                this.id = (int)Content["ID"];
                this.tabId = (int)Content["Tab_ID"];
                this.contentTypeId = (int)Content["ContentType_ID"];
                this.contentObjectId = (int)Content["ContentObject_ID"];
                this.position = (int)Content["OrdinalPosition"];
                this.columnClass = (string)Content["BtstrpClmnClss"];
                this.groupId = (Content["ContentGroup_ID"] is System.DBNull) ? null : (int?)Content["ContentGroup_ID"];
                this.active = (bool)Content["Active"];
            }
        }

        public class DropdownValues
        {
            public int value { get; set; }
            public string label { get; set; }
            public DropdownValues() { }
            public DropdownValues(DataRow Value)
            {
                this.value = (int)Value["ID"];
                this.label = (string)Value["Description"];
            }
        }
    }
}
