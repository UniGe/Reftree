using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using MagicFramework.Controllers;
using MagicFramework.Helpers;

namespace MagicFramework.Models {

    public class Magic_Templates
    {

        public int MagicTemplateID { get; set; }
        public string MagicTemplateName { get; set; }
        public string MagicTemplateScript { get; set; }
        public int? MagicTemplateLayout_ID { get; set; }
        public int? MagicTemplateType_ID { get; set; }
        public int? BaseGrid_ID { get; set; }
        public string BaseCUDTable { get; set; }

        public Magic_Templates(MagicFramework.Data.Magic_Templates A)
        {
            this.MagicTemplateID = A.MagicTemplateID;
            this.MagicTemplateName = A.MagicTemplateName;
            this.MagicTemplateScript = A.MagicTemplateScript;
            this.MagicTemplateLayout_ID = (int)(A.MagicTemplateLayout_ID ?? 0);
            this.MagicTemplateType_ID = (int)(A.MagicTemplateType_ID ?? 0);
            this.BaseGrid_ID = (int)(A.BaseGrid_ID ?? 0);
            this.BaseCUDTable = A.BaseCUDTable;
        }
        /// <summary>
        /// updates all the templates references in the application functions, assuring that all the templates of the navigation grids are recursively loaded into functions
        /// </summary>
        public void rebuildalltemplatefunctions()
        {
            Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());

            bool isSystem = ApplicationSettingsManager.GetWorkOnSystemSettings();

            var functions = (from e in _context.Magic_FunctionsTemplates
                             where e.Magic_Functions.isSystemFunction == isSystem && e.MagicTemplate_ID == this.MagicTemplateID
                             select e.MagicFunction_ID).Distinct();
            var builder = new BUILDFUNCTIONTREEController();

            foreach (var f in functions)
            {
                var json = builder.RefreshFunctionTemplateList((int)f, "create", null);
            }
        }
    }
}
