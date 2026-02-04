using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models {

public class Magic_FunctionsGrids{

public int ID {get;set;}
public int? MagicFunction_ID {get;set;}
public string EditTemplateOverride {get;set;}
public string DetailTemplateOverride {get;set;}
public int? MagicGrid_ID {get;set;}
public bool? isRoot { get; set; }
public int? MagicDataSource_ID { get; set; }
public string Groupable { get; set; }
public string Sortable { get; set; }
public string CommandColumn { get; set; }
public string Toolbar { get; set; }
public string AppendToDiv { get; set; }
public string Editable { get; set; }
public string FunctionGridTitle { get; set; }

public int? OrdinalPosition { get; set; }

public Magic_FunctionsGrids(MagicFramework.Data.Magic_FunctionsGrids A)
{
this.ID = A.ID;
this.MagicFunction_ID = (int)(A.MagicFunction_ID ?? 0);
this.EditTemplateOverride = A.EditTemplateOverride;
this.DetailTemplateOverride = A.DetailTemplateOverride;
this.MagicGrid_ID = (int)(A.MagicGrid_ID ?? 0);
this.isRoot = A.isRoot;
this.MagicDataSource_ID = (int)(A.MagicDataSource_ID ?? 0);
this.Groupable = A.Groupable;
this.Sortable = A.Sortable;
this.CommandColumn = A.CommandColumn;
this.Toolbar = A.Toolbar;
this.Editable = A.Editable;
this.AppendToDiv = A.AppendToDiv;
this.FunctionGridTitle = A.FunctionGridTitle;
this.OrdinalPosition = A.OrdinalPosition;
}
}
}
