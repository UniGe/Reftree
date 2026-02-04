using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using MagicFramework.Helpers;
using System.Web.Http.ModelBinding;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace MagicFramework.Controllers
{
    public class HelpController : ApiController
    {

        public class ListOfThings
        {
            public string[] array { get; set; }
            public List<string> list { get; set; }
        }

        public class Filter
        {
            public List<Models.Kendo.Filter> filters { get; set; }
            public int page { get; set; }
        }

        public class GetHelpObjectPost
        {
            public string type { get; set; }
            public string id { get; set; }
        }

     //   private MongoHelpHandler mhh = new MongoHelpHandler();
        private HelpHandler hh = new HelpHandler();

        [HttpPost]
        public HttpResponseMessage Post(dynamic h)
        {
            HttpResponseMessage r = new HttpResponseMessage { StatusCode = HttpStatusCode.InternalServerError };
            if (!SessionHandler.UserIsDeveloper)
            {
                r.Content = new StringContent("not authorized");
                r.StatusCode = HttpStatusCode.Unauthorized;
                return r;
            }
            try
            {
                h = this.hh.SaveHelpObject(h);
                r.Content = new StringContent(JsonConvert.SerializeObject(h, new JsonSerializerSettings { NullValueHandling = NullValueHandling.Ignore }));
                r.StatusCode = HttpStatusCode.OK;
                if (h.usedFor.type == "function")
                    MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Functions + h.usedFor.id + "_");
                if (h.targets != null)
                {
                    foreach (var token in ((JArray)h.targets))
                    {
                        string type = (string)token["Type"];
                        switch (type)
                        {
                            case "Function":
                                MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Functions + (string)token["ID"] + "_");
                                break;
                            case "Grid":
                                string gridName = (string)token["Name"];
                                Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
                                var buffers = _context.Magic_Grids.Where(g => gridName.Equals(g.MagicGridName))
                                   .FirstOrDefault()
                                   .Magic_TemplateScriptsBuffer;
                                _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(buffers);
                                _context.SubmitChanges();
                                MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids + "Name:" + gridName + "_FunctionID:");
                                break;
                        }
                    }
                }

            }
            catch (Exception e)
            {
                r.Content = new StringContent("Error");
                MFLog.LogInFile("MagicFramework.Controllers.HelpController: Application: " + h.application_name + " Id: " + h.usedFor.id + " Type: " + h.usedFor.type + " Message: " + e.Message, MFLog.logtypes.ERROR);
            }
            return r;
        }

        [HttpDelete]
        public HttpResponseMessage Delete(string id)
        {
            HttpResponseMessage r = new HttpResponseMessage { StatusCode = HttpStatusCode.OK };
            try
            {
                this.hh.DeleteHelpObject(id);
            }
            catch
            {
                r.StatusCode = HttpStatusCode.InternalServerError;
            }
            return r;
        }

        [HttpGet]
        public HttpResponseMessage HelpTargets(string helpGUID = null, bool isHelpGUIDNotNull = false, string name = null)
        {
            string response = JsonConvert.SerializeObject(this.hh.GetHelpTarget(helpGUID, isHelpGUIDNotNull, name));
            return new HttpResponseMessage { StatusCode = HttpStatusCode.OK, Content = new StringContent(response) };
        }

        [HttpPost]
        public HttpResponseMessage GotHelpFor(ListOfThings l)
        {
            this.hh.GotHelpFor(SessionHandler.Username, l.array.First());
            return new HttpResponseMessage { StatusCode = HttpStatusCode.OK };
        }

        [HttpPost]
        public HttpResponseMessage GotAlreadyHelpFor(ListOfThings l)
        {
            string response = JsonConvert.SerializeObject(this.hh.GotAlreadyHelpFor(SessionHandler.Username, l.list));
            return new HttpResponseMessage { StatusCode = HttpStatusCode.OK, Content = new StringContent(response) };
        }

        [HttpPost]
        public HttpResponseMessage GetHelpObjects(string type = "tooltip")
        {
            if (type.Equals("modal"))
            {
                string data = JsonConvert.SerializeObject(hh.GetAllModalHelpObjects());
                return new HttpResponseMessage { StatusCode = HttpStatusCode.OK, Content = new StringContent(data) };
            }
            string response = JsonConvert.SerializeObject(this.hh.GetAllTooltipHelpObjects(), new JsonSerializerSettings { NullValueHandling = NullValueHandling.Ignore });
            return new HttpResponseMessage { StatusCode = HttpStatusCode.OK, Content = new StringContent(response) };
        }

        [HttpPost]
        public HttpResponseMessage GetHelpObject(GetHelpObjectPost search)
        {
            string response = JsonConvert.SerializeObject(this.hh.GetHelpObject(search.type, search.id), new JsonSerializerSettings { NullValueHandling = NullValueHandling.Ignore });
            return new HttpResponseMessage { StatusCode = HttpStatusCode.OK, Content = new StringContent(response) };
        }

        [HttpGet]
        public HttpResponseMessage GetHelpObject(string guid)
        {
            string response = JsonConvert.SerializeObject(this.hh.GetModalHelpObject(guid), new JsonSerializerSettings { NullValueHandling = NullValueHandling.Ignore });
            return new HttpResponseMessage { StatusCode = HttpStatusCode.OK, Content = new StringContent(response) };
        }
      
    }
}