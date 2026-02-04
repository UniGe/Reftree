using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models {

public class Magic_Calendar_TaskStatus{

public int taskStatusID { get; set; }
public string Description {get;set;}
public string Color {get;set;}
public string Code { get; set; }

public Magic_Calendar_TaskStatus(Data.Magic_Calendar_TaskStatus A)
{
this.taskStatusID = A.taskStatusID;
this.Description = A.Description;
this.Color = A.Color;
this.Code = A.Code;
}
}
}
