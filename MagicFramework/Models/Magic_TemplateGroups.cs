using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Web;
using MagicFramework.Helpers;

namespace MagicFramework.Models
{

    public class Magic_TemplateGroups
    {

        public int MagicTemplateGroupID { get; set; }
        public int? MagicTemplate_ID { get; set; }
        public string MagicTemplateGroupLabel { get; set; }
        public int? OrdinalPosition { get; set; }
        public int? MagicTemplateGroupContent_ID { get; set; }
        public string MagicTemplateGroupClass { get; set; }
        public string MagicTemplateGroupDOMID { get; set; }
        public bool? Groupisvisible { get; set; }
        public int? BindedGrid_ID { get; set; }
        public string BindedGridFilter { get; set; }
        public int? BindedGridRelType_ID { get; set; }
        public bool? BindedGridHideFilterCol { get; set; }
        public int? ExtMagicDataSource_ID { get; set; }
        public string TemplateToAppendName { get; set; }
        public bool? IsVisibleInPopUp { get; set; }
        public int? MagicTemplateTabGroup_ID { get; set; }

        public Magic_TemplateGroups(MagicFramework.Data.Magic_TemplateGroups A)
        {
            this.MagicTemplateGroupID = A.MagicTemplateGroupID;
            this.MagicTemplate_ID = (int)(A.MagicTemplate_ID ?? 0);
            this.MagicTemplateGroupLabel = A.MagicTemplateGroupLabel;
            this.OrdinalPosition = (int)(A.OrdinalPosition ?? 0);
            this.MagicTemplateGroupContent_ID = (int)(A.MagicTemplateGroupContent_ID ?? 0);
            this.MagicTemplateGroupClass = A.MagicTemplateGroupClass;
            this.MagicTemplateGroupDOMID = A.MagicTemplateGroupDOMID;
            this.Groupisvisible = A.Groupisvisible;
            this.BindedGrid_ID = (int)(A.BindedGrid_ID ?? 0);
            this.BindedGridFilter = A.BindedGridFilter;
            this.BindedGridHideFilterCol = A.BindedGridHideFilterCol;
            this.ExtMagicDataSource_ID = (int)(A.ExtMagicDataSource_ID ?? 0);
            this.TemplateToAppendName = A.TemplateToAppendName;
            this.IsVisibleInPopUp = A.IsVisibleInPopUp;
            this.BindedGridRelType_ID = (int)(A.BindedGridRelType_ID ?? 0);
            this.MagicTemplateTabGroup_ID = (int)(A.MagicTemplateTabGroup_ID ?? 0);
        }
        public static Guid? GetGUIDFromID(int ID)
        {
            Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
            return context.Magic_TemplateGroups.Where(f => f.MagicTemplateGroupID == ID).FirstOrDefault().GUID;
        }
        public static List<int> GetLayerRestrictions(Guid guid)
        {
            List<int> restrictions = new List<int>();
            var dbutils = new DatabaseCommandUtils();
            DataSet ds = dbutils.GetDataSet(String.Format("SELECT mtgl.Layer_ID FROM dbo.Magic_TemplateGroupLayers mtgl WHERE mtgl.TemplateGroupGUID = convert(uniqueidentifier,'{0}')", guid.ToString()), DBConnectionManager.GetMagicConnection());
            foreach (DataRow dr in ds.Tables[0].Rows)
            {
                restrictions.Add(int.Parse(dr["Layer_ID"].ToString()));
            }
            return restrictions;
        }
    }
}
