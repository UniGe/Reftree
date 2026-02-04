using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models {

public class v_Magic_ColumnGridName{

public string MagicGridName {get;set;}
public int MagicGridID {get;set;}
public string ColumnName {get;set;}
public int MagicColumnID {get;set;}

public v_Magic_ColumnGridName(MagicFramework.Data.v_Magic_ColumnGridName A) {
this.MagicGridName = A.MagicGridName;
this.MagicGridID = A.MagicGridID;
this.ColumnName = A.ColumnName;
this.MagicColumnID = A.MagicColumnID;
}
}
}
