using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models {

public class Magic_ColumnLabels{

public int ColumnLabelID {get;set;}
public int Magic_Column_ID {get;set;}
public int MagicGrid_ID {get;set;}
public int MagicCulture_ID {get;set;}
public string ColumnLabel {get;set;}

public Magic_ColumnLabels(MagicFramework.Data.Magic_ColumnLabels A) {
this.ColumnLabelID = A.ColumnLabelID;
this.Magic_Column_ID = A.Magic_Column_ID;
this.MagicGrid_ID = A.MagicGrid_ID;
this.MagicCulture_ID = A.MagicCulture_ID;
this.ColumnLabel = A.ColumnLabel;
}
}
}
