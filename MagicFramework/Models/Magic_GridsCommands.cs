using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models {


public class Magic_GridsCommands{



public int MagicCommandID {get;set;}
public int? MagicFunction_ID {get;set;}
public int MagicGrid_ID {get;set;}
public string DomID {get;set;}
public string Class {get;set;}
public int? Location_ID {get;set;}
public string Text {get;set;}
public string ClickJSFunction {get;set;}
public int OrdinalPosition { get; set; }
public string StoredProcedure { get; set; }
public string JSONPayload { get; set; }
public int DataFormatType_ID { get; set; }
public int? CmdGroup_ID { get; set; }

//LocationID	LocationType
//1	            TOOLBAR
//2	            ROWHEAD
//3	            ROWTAIL
private static string defaultFunction(int location, string function)
{
    if ((location == 2 || location == 3) && function == null)
        return "genericRowButtonFunction";

    if ((location == 1) && (function == null))
        return "genericToolbarButtonFunction";

    return function;
}


      

  

public Magic_GridsCommands(Data.Magic_GridsCommands A) {
this.MagicCommandID = A.MagicCommandID;
this.MagicFunction_ID = (int)(A.MagicFunction_ID ?? 0);
this.MagicGrid_ID = A.MagicGrid_ID;
this.DomID = A.DomID;
this.Class = A.Class;
this.Location_ID = (int)(A.Location_ID ?? 0);
this.Text = A.Text;
this.ClickJSFunction = defaultFunction(A.Location_ID ?? 0,A.ClickJSFunction);
this.OrdinalPosition = (A.OrdinalPosition ?? 0);
this.StoredProcedure = A.StoredProcedure;
this.JSONPayload = A.JSONPayload;
//1	            XML
//2	            XMLSTRING (biz#like)
//3	            JSON
this.DataFormatType_ID =A.DataFormatType_ID == null ? 1 : (int)A.DataFormatType_ID;
this.CmdGroup_ID = (int)(A.CmdGroup_ID ?? 0);
}
}

}

