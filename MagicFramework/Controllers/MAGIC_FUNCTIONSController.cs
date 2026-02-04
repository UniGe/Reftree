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
using MagicFramework.MemberShip;


namespace MagicFramework.Controllers
{
    public class Magic_FunctionsController :ApiController
    {

        private const string genericError = "An error occured";
      // the linq to sql context that provides the data access layer
        private Data.MagicDBDataContext _context = new DBConnectionManagerBuilder(DBConnectionManager.GetMagicConnection())._magidbcontext;
      //get all elements of an entity
	[HttpGet]
        public List<Models.Magic_Functions> GetAll()
        {
            bool isSystem = ApplicationSettingsManager.GetWorkOnSystemSettings();
 
            var resdb = (from e in _context.Magic_Functions
                          .Where(e => e.isSystemFunction == isSystem)
                          orderby e.FunctionName ascending
                          select new Models.Magic_Functions(e)).ToList();

            return resdb;

        }
    public class FuncFK {
        public int FunctionID { get; set; }
        public string FunctionName { get; set; }
    }
    [HttpGet]
    public List<FuncFK> GetAllFK()
    {
        List<FuncFK> listfk = new List<FuncFK>();
        bool isSystem = ApplicationSettingsManager.GetWorkOnSystemSettings();

        var resdb = (from e in _context.Magic_Functions
                      .Where(e => e.isSystemFunction == isSystem)
                     orderby e.FunctionName ascending
                     select e).ToList();

        foreach (var r in resdb)
        { 
            FuncFK f = new FuncFK();
            f.FunctionID = r.FunctionID;
            f.FunctionName = r.FunctionName;
            listfk.Add(f);
        }

        return listfk;
    }
    

    [HttpGet]
    public List<int> GetFirst()
    {
        bool isSystem = ApplicationSettingsManager.GetWorkOnSystemSettings();
 

        // select from the database, skipping and taking the correct amount
        var resdb = (from e in _context.Magic_Functions
                     where e.isSystemFunction == isSystem
                     orderby e.FunctionName ascending
                      select e.FunctionID 
                      ).FirstOrDefault();

        List<int> list = new List<int>();
        list.Add(resdb);
        return list;

    }

    public static string buildFunctionCacheKey(int id)
    {
        return Helpers.CacheHandler.Functions + id.ToString() + "_" + MagicFramework.Helpers.SessionHandler.UserCulture.ToString();
    }
	//get a single object 
	[HttpGet]
    public List<Models.Magic_Functions> Get(string id)
    {

            try
            {
                Guid functionGUID;
                int functionID;
                if (Guid.TryParseExact(id, "D", out functionGUID))
                    functionID = Models.Magic_Functions.GetIDFromGUID(functionGUID);
                else if (!int.TryParse(id, out functionID))
                    throw new Exception("No GUID nor ID passed.");

                try
                {
                    if (ApplicationSettingsManager.getLogToDatabase() == true)
                        MFLog.LogToDatabase(MFLog.dblogevents.REQUESTEDFUNCTION, functionGUID.ToString(), HttpContext.Current.Request.UserHostAddress.ToString());
                }
                catch (Exception ex)
                {
                    MFLog.LogInFile("Problems while tracking function request: " + ex.Message, MFLog.logtypes.ERROR);
                }
                string cachekey = buildFunctionCacheKey(functionID);
                if (HttpContext.Current.Cache[cachekey] != null)
                {
                    string jsonserializedfunction = HttpContext.Current.Cache[cachekey].ToString();
                    var obj = Newtonsoft.Json.JsonConvert.DeserializeObject<Object>(jsonserializedfunction);
                    Models.Magic_Functions mf = new Models.Magic_Functions(obj);
                    List<Models.Magic_Functions> mflist = new List<Models.Magic_Functions>();
                    mflist.Add(mf);
                    return mflist;
                }
                else
                {
                    if (_context == null)
                    {
                        SessionHandler.CheckAbortSessionAndRedirect();
                        return null;
                    }

                    var resobj = (from e in _context.Magic_Functions.Where(x => x.FunctionID == functionID)
                                  select new Models.Magic_Functions(e)).ToList();
                    //look for a set of labels (description,name,help) which is specific for a curent application instance
                    var appLayer = new Models.ApplicationLayer();
                    int? altlayer_ID = appLayer.GetAlternativeLayerIdForThisAppInstanceName();
                    var labels = (from e in _context.Magic_FunctionsLabels where e.Function_ID == resobj.FirstOrDefault().FunctionID 
                                  && e.Magic_Culture_ID == SessionHandler.UserCulture 
                                  && object.Equals(e.Layer_ID,altlayer_ID)
                                  select e).FirstOrDefault();

                    if (labels != null)
                    {
                        resobj.FirstOrDefault().FunctionDescription = labels.FunctionDescription;
                        resobj.FirstOrDefault().FunctionHelp = labels.FunctionHelp;
                        //resobj.FirstOrDefault().FunctionName = labels.FunctionName;
                        resobj.FirstOrDefault().FunctionNameDescription = labels.FunctionName;//non cambio il function name ma solo un campo descrittivo
                    }

                    HttpContext.Current.Cache[cachekey] = Newtonsoft.Json.JsonConvert.SerializeObject(resobj);

                    return resobj;
                }
            }
            catch (Exception ex) {
                MFLog.LogInFile(ex, MFLog.logtypes.ERROR);
                throw new System.ArgumentException(genericError);
            }
    }


        //The grid will call this method in read mode
     
      [HttpPost]
      public Models.Response Select(Models.Request request)
      {
            try
            {
                bool isSystem = ApplicationSettingsManager.GetWorkOnSystemSettings();

                Helpers.RequestParser rp = new Helpers.RequestParser(request);

                string order = "FunctionName";
                String wherecondition = "1=1";
                if (request.filter != null)
                    wherecondition = rp.BuildWhereCondition(typeof(Models.Magic_Functions));


                if (request.sort != null && request.sort.Count > 0)
                    order = rp.BuildOrderConditionForEF();

                var dbres = (from e in _context.Magic_Functions
                                                   .Where(wherecondition)
                                                   .Where(e => e.isSystemFunction == isSystem)
                                                   .OrderBy(order.ToString())
                                                   .Skip(request.skip)
                                                   .Take(request.take)
                             select new Models.Magic_Functions(e)).ToArray();


                return new Models.Response(dbres, _context.Magic_Functions.Where(wherecondition).Where(e => e.isSystemFunction == isSystem).Count());
            }
            catch (Exception ex) {
                MFLog.LogInFile(ex, MFLog.logtypes.ERROR);
                throw new System.ArgumentException(genericError);
            }
     
      }
          //The grid will call this method in update mode
      [HttpPost]
      public HttpResponseMessage PostU(int id,dynamic data)
      {         
          // create a response message to send back
          var response = new HttpResponseMessage();
        
                try
              {
                  SystemRightsChecker.checkSystemRights();
                  // select the item from the database where the id
                  
                  var entityupdate = (from e in _context.Magic_Functions
                                      where e.FunctionID == id
                                      select e).FirstOrDefault();

                  int layerid = data.Layer_ID == null ? 0 : data.Layer_ID;

                  if (entityupdate != null)
                  {
                      //se il layer di una funzione cambia dovro' svuotare i suoi buffer sia lato griglia che eventuali lato template
                      if ((entityupdate.Layer_ID ?? 0) != layerid)
                      {
                          _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(entityupdate.Magic_TemplateScriptsBuffer);
                          MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);
                          MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Functions);

                      }

                     var updID =  _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "UPDATE", Helpers.SessionHandler.UserVisibilityGroup, "Magic_Functions",false);
                     response.StatusCode = HttpStatusCode.OK;
                     _context.SubmitChanges();
                      //Svuoto la cache dei menu perche' se cambia la modalita' di run (da aspx a # o viceversa il menu va rifatto)
                     MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.MenuUserID);
                     MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Functions);
                      
                  }
                  else
                  {
                       response.StatusCode = HttpStatusCode.InternalServerError;
                      response.Content = new StringContent(string.Format("The item with id Magic_Functions was not found in the database", id.ToString()));
                  }
              }
              catch (Exception ex)
              {
                response.StatusCode = HttpStatusCode.InternalServerError;
                MFLog.LogInFile(ex, MFLog.logtypes.ERROR);
                response.Content = new StringContent(string.Format("The database updated failed: Magic_Functions"));
              }
       
          // return the HTTP Response.
          return response;
      }


      //The grid will call this method in insert mode
   
      [HttpPost]
      public Models.Response PostI(dynamic data)
      {
            try
            {
                bool isSystem = ApplicationSettingsManager.GetWorkOnSystemSettings();

                int id = -1;
                data.isSystemFunction = isSystem;
                var insID = _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "INSERT", Helpers.SessionHandler.UserVisibilityGroup, "Magic_Functions", false);
                int inserted = -1;
                foreach (var item in insID)
                {
                    inserted = int.Parse(item.modID.ToString());
                }
                //inserisco in cache la funzione appena creata per la culture dell' utente
                var dbres = (from e in _context.Magic_Functions
                                                .Where("FunctionID == " + inserted.ToString())
                             select new Models.Magic_Functions(e)).ToArray();

                var labels = (from e in _context.Magic_FunctionsLabels where e.Function_ID == dbres.FirstOrDefault().FunctionID && e.Magic_Culture_ID == MagicFramework.Helpers.SessionHandler.UserCulture select e).FirstOrDefault();

                if (labels != null)
                {
                    dbres.FirstOrDefault().FunctionDescription = labels.FunctionDescription;
                    dbres.FirstOrDefault().FunctionHelp = labels.FunctionHelp;
                    dbres.FirstOrDefault().FunctionNameDescription = labels.FunctionName;//non cambio il function name ma solo un campo descrittivo
                }
                string cachekey = buildFunctionCacheKey(inserted);
                HttpContext.Current.Cache[cachekey] = Newtonsoft.Json.JsonConvert.SerializeObject(dbres);

                // return the HTTP Response.
                return new Models.Response(dbres, dbres.Length);
            }
            catch (Exception ex)
            {
                MFLog.LogInFile(ex, MFLog.logtypes.ERROR);
                throw new System.ArgumentException(genericError);
            }
 
      }

      [HttpPost]
      public HttpResponseMessage PostD(int id)
      {
          // create a response message to send back
          var response = new HttpResponseMessage();

          try
          {
              SystemRightsChecker.checkSystemRights();
              // select the item from the database where the id

              var entitytodestroy = (from e in _context.Magic_Functions
                                     where e.FunctionID == id
                                     select e).FirstOrDefault();

              if (entitytodestroy != null)
              {
                  _context.Magic_Functions.DeleteOnSubmit(entitytodestroy);
                  _context.SubmitChanges();
                  response.StatusCode = HttpStatusCode.OK;
                  MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Functions);
              }
              else
              {
                  response.StatusCode = HttpStatusCode.InternalServerError;
                  response.Content = new StringContent(string.Format("The item with id {0} in Magic_Functions was not found in the database", id.ToString()));
              }
          }
          catch (Exception ex)
          {
              response.StatusCode = HttpStatusCode.InternalServerError;
                MFLog.LogInFile(ex, MFLog.logtypes.ERROR);
              response.Content = new StringContent(string.Format("Magic_Functions:The database delete failed"));
          }

          // return the HTTP Response.
          return response;
      }

      [HttpPost]
      public HttpResponseMessage GetByName(Models.KeyValue kv)
      {
          if (kv.value == null)
              return new HttpResponseMessage
              {
                  StatusCode = HttpStatusCode.OK,
                  Content = new StringContent("[]")
              };
          try
          {
              var functions = from f in _context.Magic_Functions
                              where f.FunctionName.Contains(kv.value)
                              select new { id = f.FunctionID, name = f.FunctionName };
              return new HttpResponseMessage
              {
                  StatusCode = HttpStatusCode.OK,
                  Content = new StringContent(Newtonsoft.Json.JsonConvert.SerializeObject(functions))
              };
          }
          catch { }
          return new HttpResponseMessage
          {
              StatusCode = HttpStatusCode.InternalServerError
          };
      }

        [HttpGet]
        public HttpResponseMessage GetIDFromGUID(string id)
        {
            HttpResponseMessage res = new HttpResponseMessage();
            res.StatusCode = HttpStatusCode.OK;
            try
            {
                res.Content = new StringContent(Models.Magic_Functions.GetIDFromGUID(id).ToString());
            }
            catch (Exception e)
            {
                res.Content = new StringContent("-1");
            }
            return res;
        }
                
    }
}