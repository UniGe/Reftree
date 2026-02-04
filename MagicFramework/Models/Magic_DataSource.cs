using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models {


    public class customJSONParamOp {
        public string DataFormat { get; set; }
        public string Definition { get; set; }
        public string Type { get; set; }
    }

public class Magic_DataSource{

public int MagicDataSourceID {get;set;}
public string Name {get;set;}
public string ObjRead {get;set;}
public string ObjUpdate {get;set;}
public string ObjCreate {get;set;}
public string ObjDestroy {get;set;}
public string ObjParameterMap {get;set;}
public string ObjComplete {get;set;}
public string Filter {get;set;}
public int? CoreGrid_ID { get; set; }
public int? Layer_ID { get; set; }
public string CustomJSONParam { get; set; }
public string OrderByFieldName {get;set;}


public Magic_DataSource(MagicFramework.Data.Magic_DataSource A) {
this.MagicDataSourceID = A.MagicDataSourceID;
this.Name = A.Name;
this.ObjRead = A.ObjRead;
this.ObjUpdate = A.ObjUpdate;
this.ObjCreate = A.ObjCreate;
this.ObjDestroy = A.ObjDestroy;
this.ObjParameterMap = A.ObjParameterMap;
this.ObjComplete = A.ObjComplete;
this.Filter = A.Filter;
this.CoreGrid_ID = A.CoreGrid_ID;
this.Layer_ID = (int)(A.Layer_ID ?? 0);
this.CustomJSONParam = A.CustomJSONParam;
this.OrderByFieldName = A.OrderByFieldName;

}
}
}
