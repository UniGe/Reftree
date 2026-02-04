using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Net;
using System.Net.Http;
using AttributeRouting.Web.Http;
using System.Linq.Dynamic;
using System.Configuration;
using MagicFramework.Helpers;


namespace MagicFramework.Controllers
{
    public class Magic_ENTITIESController : ApiController
    {


        // the linq to sql context that provides the data access layer
        private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
        [HttpGet]
        public List<Models.Magic_Enitities> GetAll()
        {

      
            //string order = "";
          
            var dbres = (from e in _context.GetTables(ApplicationSettingsManager.GetVisibilityField())
                         select e).ToList();

            var res = new List<Models.Magic_Enitities>();
            foreach (var x in dbres)
            {
                var ent = new Models.Magic_Enitities();
                ent.Checked = false;
                ent.pagingcolumn = x.pagingcolumn;
                ent.TABLE_CATALOG = x.TABLE_CATALOG;
                ent.TABLE_NAME = x.TABLE_SCHEMA +"."+x.TABLE_NAME;
                ent.TABLE_SCHEMA = x.TABLE_SCHEMA;
                ent.TABLE_TYPE = x.TABLE_TYPE;
                ent.visibilityfield = x.visibilityfield;
                ent.MAIN_TABLE = x.MAIN_TABLE;
                ent.DATA_TYPE = x.DATA_TYPE;
                ent.GenerateFunction = false;
                res.Add(ent);
            }

            return res;

        }
        [HttpPost]
        public Models.Response Select(Models.Request request)
        {

            Helpers.RequestParser rp = new Helpers.RequestParser(request);

            string order = "";
            String wherecondition = "1=1";
            if (request.filter != null)
                wherecondition = rp.BuildWhereCondition(typeof(Models.Magic_Enitities));


            if (request.sort != null && request.sort.Count > 0)
                order = rp.BuildOrderCondition();

            var dbres = (from e in _context.GetTables(ApplicationSettingsManager.GetVisibilityField())
                         select e).ToList();

            var res = new List<Models.Magic_Enitities>();
            foreach (var x in dbres)
            {
                var ent = new Models.Magic_Enitities();
                ent.Checked = false;
                ent.pagingcolumn = x.pagingcolumn;
                ent.TABLE_CATALOG = x.TABLE_CATALOG;
                ent.TABLE_NAME = x.TABLE_NAME;
                ent.TABLE_SCHEMA = x.TABLE_SCHEMA;
                ent.TABLE_TYPE = x.TABLE_TYPE;
                ent.visibilityfield = x.visibilityfield;
                ent.MAIN_TABLE = x.MAIN_TABLE;
                ent.DATA_TYPE = x.DATA_TYPE;
                ent.GenerateFunction = false;
                res.Add(ent);
            }

            return new Models.Response(res.ToArray(), res.Count());

        }


    }
}