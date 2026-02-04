using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;


namespace MagicFramework.Models {

public class v_Magic_Grids{

public int MagicGrid_ID {get;set;}
public string MagicGridName {get;set;}
public string MagicGridEntity {get;set;}
public string MagicGridModel {get;set;}
public string MagicGridColumns {get;set;}
public string MagicGridTransport {get;set;}
public string MagicGridColumnsCommand {get;set;}
public string Sortable {get;set;}
public string Groupable {get;set;}
public string Editable {get;set;}
public bool? Exportable { get; set; }
public string Toolbar {get;set;}
public string Name {get;set;}
public string ObjRead {get;set;}
public string ObjUpdate {get;set;}
public string ObjCreate {get;set;}
public string ObjDestroy {get;set;}
public string ObjParameterMap {get;set;}
public string ObjComplete {get;set;}
public string Filter {get;set;}
public string OrderByFieldName { get; set; }
public string DetailTemplate { get; set; }
public string DetailInitJSFunction { get; set; }
public string EditJSFunction { get; set; }
public string EditableTemplate { get; set; }
public int? MagicDataSourceID { get; set; }
public string CustomJSONParam { get; set; }
public int? EditTemplate_ID { get; set; }
public int? NavigationTemplate_ID { get; set; }
public string FromClass { get; set; }
public string FromTable { get; set; }
public bool? isSystemGrid { get; set; }
public string ToolbarCmdToAdd { get; set; }
public string HeadRowCmdToAdd { get; set; }
public string TailRowCmdToAdd { get; set; }
public int EditFormColumnNum { get; set; }
public string Selectable { get; set; }
public int? PageSize { get; set; }
public Guid? GUID { get; set; }
public bool? ShowHistory {get;set;}
public bool? QueryForActions {get;set;}
public string MasterEntityName { get; set; }
public string DocRepositoryBOType { get; set; }
public string MagicGridExtension { get; set; }
public Guid? HelpGUID { get; set; }

        public v_Magic_Grids()
{ 
}

public v_Magic_Grids(MagicFramework.Data.v_Magic_Grids A) {
this.MagicGrid_ID = A.MagicGridID;
this.MagicGridName = A.MagicGridName;
this.MagicGridEntity = A.MagicGridEntity;
this.MagicGridModel = A.MagicGridModel;
this.MagicGridColumns = A.MagicGridColumns;
this.MagicGridTransport = A.MagicGridTransport;
this.MagicGridColumnsCommand = A.MagicGridColumnsCommand;
this.Sortable = A.Sortable;
this.Groupable = A.Groupable;
this.Editable = A.Editable;
this.Exportable = A.Exportable;
this.Toolbar = A.Toolbar;
this.Name = A.Name;
this.ObjRead = A.ObjRead;
this.ObjUpdate = A.ObjUpdate;
this.ObjCreate = A.ObjCreate;
this.ObjDestroy = A.ObjDestroy;
this.ObjParameterMap = A.ObjParameterMap;
this.ObjComplete = A.ObjComplete;
this.Filter = A.Filter;
this.DetailTemplate = A.DetailTemplate;
this.DetailInitJSFunction = A.DetailInitJSFunction;
this.EditJSFunction = A.EditJSFunction;
this.EditableTemplate = A.EditableTemplate;
this.MagicDataSourceID = A.MagicDataSource_ID;
this.CustomJSONParam = A.CustomJSONParam;
this.EditTemplate_ID = A.EditTemplate_ID;
this.NavigationTemplate_ID = A.NavigationTemplate_ID;
this.FromClass = A.FromClass;
this.FromTable = A.FromTable;
this.isSystemGrid = A.isSystemGrid;
this.EditFormColumnNum = A.EditFormColumnNum ?? 1;
this.OrderByFieldName = A.OrderByFieldName;
this.Selectable = A.Selectable;
this.PageSize = A.PageSize;
this.GUID = A.GUID;
this.ShowHistory = A.ShowHistory;
this.QueryForActions = A.QueryForActions;
this.MasterEntityName = A.MasterEntityName;
this.DocRepositoryBOType = A.DocRepositoryBOType;
this.MagicGridExtension = A.MagicGridExtension;
            this.HelpGUID = A.HelpGUID;
}
public v_Magic_Grids(string json)
{
    
    var result = Newtonsoft.Json.JsonConvert.DeserializeObject<Models.v_Magic_Grids>(json);

    this.MagicGrid_ID = result.MagicGrid_ID;
    this.MagicGridName = result.MagicGridName;
    this.MagicGridEntity = result.MagicGridEntity;
    this.MagicGridModel = result.MagicGridModel;
    this.MagicGridColumns = result.MagicGridColumns;
    this.MagicGridTransport = result.MagicGridTransport;
    this.MagicGridColumnsCommand = result.MagicGridColumnsCommand;
    this.Sortable = result.Sortable;
    this.Groupable = result.Groupable;
    this.Editable = result.Editable;
    this.Exportable = result.Exportable;
    this.Toolbar = result.Toolbar;
    this.Name = result.Name;
    this.ObjRead = result.ObjRead;
    this.ObjUpdate = result.ObjUpdate;
    this.ObjCreate = result.ObjCreate;
    this.ObjDestroy = result.ObjDestroy;
    this.ObjParameterMap = result.ObjParameterMap;
    this.ObjComplete = result.ObjComplete;
    this.Filter = result.Filter;
    this.DetailTemplate = result.DetailTemplate;
    this.DetailInitJSFunction = result.DetailInitJSFunction;
    this.EditJSFunction = result.EditJSFunction;
    this.EditableTemplate = result.EditableTemplate;
    this.MagicDataSourceID = result.MagicDataSourceID;
    this.CustomJSONParam = result.CustomJSONParam;
    this.isSystemGrid = result.isSystemGrid;
    this.FromTable = result.FromTable;
    this.FromClass = result.FromClass;
    this.EditTemplate_ID = result.EditTemplate_ID;
    this.NavigationTemplate_ID = result.NavigationTemplate_ID;
    this.ToolbarCmdToAdd = result.ToolbarCmdToAdd;
    this.HeadRowCmdToAdd = result.HeadRowCmdToAdd;
    this.TailRowCmdToAdd = result.TailRowCmdToAdd;
    this.EditFormColumnNum = result.EditFormColumnNum;
    this.OrderByFieldName = result.OrderByFieldName;
    this.Selectable = result.Selectable;
    this.PageSize = result.PageSize;
    this.GUID = result.GUID;
    this.ShowHistory = result.ShowHistory;
    this.QueryForActions = result.QueryForActions;
    this.MasterEntityName = result.MasterEntityName;
    this.DocRepositoryBOType = result.DocRepositoryBOType;
    this.MagicGridExtension = result.MagicGridExtension;
            this.HelpGUID = result.HelpGUID;
}
}
}
