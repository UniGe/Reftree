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
    public class Magic_TreesController : ApiController
    {


        // the linq to sql context that provides the data access layer
        private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());

        //get all elements of an entity
        [HttpGet]
        public List<Models.TreeModelParser> GetAll()
        {
            string wherecondition = "1=1";

            // select from the database, skipping and taking the correct amount
            var resdb = (from e in _context.Magic_Trees
                          .Where(wherecondition)
                         select new Models.TreeModelParser(e)).ToList();

            return resdb;

        }

        //get a single object 
        [HttpGet]
        public List<Models.TreeModelParser> Get(int id)
        {
            var resobj = (from e in _context.Magic_Trees.Where(x => x.ID == id)
                          select new Models.TreeModelParser(e)).ToList();
            return resobj;
        }

        [HttpGet]
        public Models.TreeModelParser GetByName(string id)
        {
            var tp = new Models.TreeModelParser(id);
            return tp;
        }
    }
}