using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using MagicFramework.Helpers;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace MagicFramework.Controllers
{
    public class UserConfigController : ApiController
    {

       
        //add all as id to get the whole config file or a defined string for getting a partial config
        [HttpGet]
        public HttpResponseMessage GetUserConfig(string id)
        {
            HttpResponseMessage res = new HttpResponseMessage { StatusCode = HttpStatusCode.InternalServerError };
            try
            {
                UserConfigHandler uch = new UserConfigHandler();
                var config = uch.GetUserConfig();
                if(config == null)
                {
                    res.StatusCode = HttpStatusCode.NotFound;
                    return res;
                }
                string content;
                switch (id) {
                    case "grid":
                        content = JsonConvert.SerializeObject(config.gridConfigs, Formatting.None,
                            new JsonSerializerSettings
                            {
                                NullValueHandling = NullValueHandling.Ignore
                            }); 
                        break;
                    case "calendar":
                        content = JsonConvert.SerializeObject(config.calendarConfig, Formatting.None,
                            new JsonSerializerSettings
                            {
                                NullValueHandling = NullValueHandling.Ignore
                            });
                        break;
                    case "pivot":
                        content = JsonConvert.SerializeObject(config.pivotConfig, Formatting.None,
                            new JsonSerializerSettings
                            {
                                NullValueHandling = NullValueHandling.Ignore
                            });
                        break;
                    case "all":
                        content =JsonConvert.SerializeObject(config, Formatting.None,
                            new JsonSerializerSettings
                            {
                                NullValueHandling = NullValueHandling.Ignore
                            }); 
                        break;
                    default:
                        content = null;
                        if (config.more != null)
                                content = JsonConvert.SerializeObject(config.more[id], Formatting.None,
                                    new JsonSerializerSettings
                                    {
                                        NullValueHandling = NullValueHandling.Ignore
                                    }); 
                        break;
                }
                res.Content = new StringContent(content);
                res.StatusCode = HttpStatusCode.OK;
            }
            catch (Exception e)
            {
                res.Content = new StringContent(e.Message);
            }
            return res;
        }

        [HttpPost]
        public HttpResponseMessage PostUserGridConfig([FromBody]string value, string type = "grid")
        {
            return PostConfig(value, type);
        }

        public class UserGridSettingPayload { 
            public string gridKey { get; set; }
            public string gridSettings { get; set; }
        }

        /*created for the new client reftree 2*/
        [HttpPost]
        public HttpResponseMessage SetUserGridConfig([FromBody] UserGridSettingPayload data)
        {
            HttpResponseMessage res = new HttpResponseMessage { StatusCode = HttpStatusCode.OK };
            try
            {
                UserConfigHandler uch = new UserConfigHandler();
                uch.SetUserConfig(UserConfigHandler.ConfigType.GridConfig, data.gridSettings, data.gridKey);
            }
            catch (Exception ex) { 
                res.StatusCode = HttpStatusCode.BadRequest; 
                MFLog.LogInFile(ex);
                res.Content = new StringContent($"SetUserConfig error");
            }
            return res;
        }

        [HttpPost]
        public HttpResponseMessage PostConfig([FromBody]string value, string type = "grid")
        {
            dynamic document = Newtonsoft.Json.JsonConvert.DeserializeObject<dynamic>(value);
            HttpResponseMessage res = new HttpResponseMessage { StatusCode = HttpStatusCode.InternalServerError };
            try
            {
                UserConfigHandler uch = new UserConfigHandler();
                switch (type)
                {
                    case "grid":
                        uch.SetUserConfig(UserConfigHandler.ConfigType.GridConfig, Newtonsoft.Json.JsonConvert.SerializeObject(document["value"]), document["key"].ToString());
                        break;
                    case "calendar":
                        uch.SetUserConfig(UserConfigHandler.ConfigType.CalendarConfig, value);
                        break;
                    case "pivot":
                        uch.SetUserConfig(UserConfigHandler.ConfigType.PivotConfig, value);
                        break;
                    default:
                        uch.SetUserConfig(UserConfigHandler.ConfigType.More, value);
                        break;
                }
                res.StatusCode = HttpStatusCode.OK;
            }
            catch (Exception e)
            {
                res.Content = new StringContent(e.Message);
            }
            return res;
        }

        [HttpGet]
        public HttpResponseMessage DeleteUserGridConfig(string id)
        {
            HttpResponseMessage res = new HttpResponseMessage { StatusCode = HttpStatusCode.InternalServerError };
            try
            {
                UserConfigHandler uch = new UserConfigHandler();
                bool found = uch.DeleteUserConfig(UserConfigHandler.ConfigType.GridConfig, id);
                res.StatusCode = HttpStatusCode.OK;
                res.Content = new StringContent(found.ToString());
            }
            catch (Exception e)
            {
                res.Content = new StringContent(e.Message);
            }
            return res;
        }
        
        [HttpGet]
        public HttpResponseMessage RemoveAsGridConfigDefault(string gridKey, string settingsName)
        {
            HttpResponseMessage res = new HttpResponseMessage { StatusCode = HttpStatusCode.InternalServerError };
            try
            {
                UserConfigHandler uch = new UserConfigHandler();
                var config = uch.SetUserConfigDefaultToFalse(gridKey, settingsName);

                if (config == null)
                {
                    res.StatusCode = HttpStatusCode.NotFound;
                    return res;
                }

                string content = JsonConvert.SerializeObject(config.gridConfigs, Formatting.None,
                            new JsonSerializerSettings
                            {
                                NullValueHandling = NullValueHandling.Ignore
                            });
                
                res.Content = new StringContent(content);
                res.StatusCode = HttpStatusCode.OK;
            }
            catch (Exception e)
            {
                res.Content = new StringContent(e.Message);
            }
            return res;
        }

        [HttpGet]
        public HttpResponseMessage SetAsGridConfigDefault(string gridKey, string settingsName)
        {
            HttpResponseMessage res = new HttpResponseMessage { StatusCode = HttpStatusCode.InternalServerError };
            try
            {
                //will set config's isDefaultSetting to TRUE (all others to FALSE)
                UserConfigHandler uch = new UserConfigHandler();
                var config = uch.SetUserConfigDefaultToTrue(gridKey, settingsName);

                if (config == null)
                {
                    res.StatusCode = HttpStatusCode.NotFound;
                    return res;
                }

                string content = JsonConvert.SerializeObject(config.gridConfigs, Formatting.None,
                            new JsonSerializerSettings
                            {
                                NullValueHandling = NullValueHandling.Ignore
                            });

                res.Content = new StringContent(content);
                res.StatusCode = HttpStatusCode.OK;
            }
            catch (Exception e)
            {
                res.Content = new StringContent(e.Message);
            }
            return res;
        }

        //public string GetGrid(string id)
        //{
        //    MongoConfigHandler mch = new MongoConfigHandler();
        //    BsonDocument doc = mch.GetDocumentByName(id, "grids");
        //    return doc.ToJson(new MongoDB.Bson.IO.JsonWriterSettings { OutputMode = MongoDB.Bson.IO.JsonOutputMode.Strict });
        //}

        //public void InsertGrid([FromBody]string value)
        //{
        //    MongoConfigHandler mch = new MongoConfigHandler();
        //    mch.InsertDocument(value, "grids");
        //}

        //[HttpPost]
        //public HttpResponseMessage SaveGridOverwrite(MongoConfigHandler.GridOverwrite overwrite)
        //{
        //    //add check to make sure there are no overwrites for the same grid and application
        //    //warn if overwrites for this grid and app already exist
        //    //we always pref a dedicated overwrite over a general (used_for_all_applications = true)
        //    //then we pref the most recent
        //    HttpResponseMessage res = new HttpResponseMessage();
        //    try {
        //        overwrite.modified_by = SessionHandler.Username;
        //        overwrite.modified_at = DateTime.Now;
        //        overwrite.used_for_all_applications = overwrite.for_application_names.Count == 0;
        //        overwrite.original = MongoConnector.StringToBsonDocument(overwrite.original.ToString());
        //        overwrite.diff = MongoConnector.StringToBsonDocument(overwrite.diff.ToString());
        //        overwrite.overwrite = MongoConnector.StringToBsonDocument(overwrite.overwrite.ToString());
        //        new MongoConfigHandler().SaveGridOverwrite(overwrite);
        //        if (overwrite.used_for_all_applications == true || overwrite.for_application_names.Contains(SessionHandler.ApplicationInstanceName))
        //        {
        //            CacheHandler.EmptyCacheForPrefix(CacheHandler.Grids + "Name:" + overwrite.grid_name);
        //        }
        //        res.Content = new StringContent(overwrite.Id.ToString());
        //        res.StatusCode = HttpStatusCode.OK;
        //    }
        //    catch (Exception e)
        //    {
        //        res.StatusCode = HttpStatusCode.InternalServerError;
        //        res.Content = new StringContent(e.Message);
        //    }
        //    return res;
        //}

        //[HttpGet]
        //public HttpResponseMessage SearchGridOverwrite(string id)
        //{
        //    HttpResponseMessage res = new HttpResponseMessage();
        //    try
        //    {
        //        res.Content = new StringContent(new MongoConfigHandler().SearchGridOverwrites(id).ToJson(new MongoDB.Bson.IO.JsonWriterSettings { OutputMode = MongoDB.Bson.IO.JsonOutputMode.Strict }));
        //        res.StatusCode = HttpStatusCode.OK;
        //    }
        //    catch (Exception e)
        //    {
        //        res.StatusCode = HttpStatusCode.InternalServerError;
        //        res.Content = new StringContent(e.Message);
        //    }
        //    return res;
        //}

        //[HttpGet]
        //public HttpResponseMessage GetGridOverwriteByGridName(string id)
        //{
        //    HttpResponseMessage res = new HttpResponseMessage();
        //    try
        //    {
        //        res.Content = new StringContent(new MongoConfigHandler().GetGridOverwritesByGridName(id).ToJson(new MongoDB.Bson.IO.JsonWriterSettings { OutputMode = MongoDB.Bson.IO.JsonOutputMode.Strict }));
        //        res.StatusCode = HttpStatusCode.OK;
        //    }
        //    catch (Exception e)
        //    {
        //        res.StatusCode = HttpStatusCode.InternalServerError;
        //        res.Content = new StringContent(e.Message);
        //    }
        //    return res;
        //}

        //[HttpPost]
        //public HttpResponseMessage GridOverwriteList(Models.Kendo.GridRequest request)
        //{
        //    HttpResponseMessage res = new HttpResponseMessage();
        //    try
        //    {
        //        res.Content = new StringContent(new MongoConfigHandler().QueryCollection(MongoConfigHandler.DocumentType.GridOverWrite, request).ToJson(new MongoDB.Bson.IO.JsonWriterSettings { OutputMode = MongoDB.Bson.IO.JsonOutputMode.Strict }));
        //        res.StatusCode = HttpStatusCode.OK;
        //    }
        //    catch (Exception e)
        //    {
        //        res.StatusCode = HttpStatusCode.InternalServerError;
        //        res.Content = new StringContent(e.Message);
        //    }
        //    return res;
        //}

        //[HttpGet]
        //public HttpResponseMessage GetOverwrittenGridObject(string id)
        //{
        //    HttpResponseMessage res = new HttpResponseMessage();
        //    res.StatusCode = HttpStatusCode.InternalServerError;
        //    try
        //    {
        //        JObject content = new JObject();
        //        Data.MagicDBDataContext configDB = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
        //        var overwrite = new MongoConfigHandler().GetGridOverwriteById(id);
        //        var buffer = configDB.Magic_TemplateScriptsBuffer.Where(b => b.Magic_Grids.MagicGridName == overwrite["grid_name"].ToString() && b.Magic_Cultures.Magic_CultureLanguage == overwrite["culture"].ToString()).FirstOrDefault();
        //        if(buffer == null)
        //        {
        //            res.Content = new StringContent("Magic_TemplateScriptsBuffer for grid with name " + overwrite["grid_name"].ToString() + " not found.");
        //            return res;
        //        }
        //        content["overwrite"] = new JRaw(MongoConfigHandler.OverwriteGridObject(buffer.Magic_Script, overwrite["overwrite"].ToJson(), false));
        //        content["original"] = new JRaw(overwrite["original"].ToJson());
        //        content["diff"] = new JRaw(overwrite["diff"].ToJson());
        //        content["gridID"] = buffer.Magic_Grid_ID;
        //        content["cultureID"] = buffer.Magic_Culture_ID;
        //        content["for_application_names"] = new JRaw(overwrite["for_application_names"].ToJson());
        //        res.Content = new StringContent(content.ToString());
        //        res.StatusCode = HttpStatusCode.OK;
        //    }
        //    catch (Exception e)
        //    {
        //        res.Content = new StringContent(e.ToString());
        //    }
        //    return res;
        //}

        //[HttpDelete]
        //public HttpResponseMessage DeleteGridOverwrite(string id)
        //{
        //    HttpResponseMessage res = new HttpResponseMessage();
        //    try
        //    {
        //        var db = new MongoConfigHandler();
        //        var overwrite = db.GetGridOverwriteById(id);
        //        db.DeleteFromCollectionById(MongoConfigHandler.DocumentType.GridOverWrite, id);
        //        if (overwrite != null)
        //            CacheHandler.EmptyCacheForPrefix(CacheHandler.Grids + "Name:" + overwrite["grid_name"].ToString());
        //        res.StatusCode = HttpStatusCode.OK;
        //    }
        //    catch (Exception e)
        //    {
        //        res.StatusCode = HttpStatusCode.InternalServerError;
        //        res.Content = new StringContent(e.Message);
        //    }
        //    return res;
        //}

        //[HttpGet]
        //public HttpResponseMessage ApplicationInstances()
        //{
        //    var res = new HttpResponseMessage();
        //    var config = new MFConfiguration().GetAppSettings();
        //    var appInstances = config.listOfInstances
        //        .OrderBy(i => i.appInstancename)
        //        .Select(i => new {
        //            applicationName = i.appInstancename
        //        });
        //    res.StatusCode = HttpStatusCode.OK;
        //    res.Content = new StringContent(Newtonsoft.Json.JsonConvert.SerializeObject(appInstances));
        //    return res;
        //}
    }
}