using System;
using System.Collections.Generic;
using System.Data.Entity.Infrastructure;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using Newtonsoft.Json.Linq;
using System.Linq.Dynamic;
using MagicFramework.Helpers;

namespace MagicFramework.Controllers
{
    public class ObjectGeneratorController : ApiController
    {
        
        string vnamespace = System.Configuration.ConfigurationManager.AppSettings["namespace"];
        string folder = System.Configuration.ConfigurationManager.AppSettings["datafolder"];
        string visfield = ApplicationSettingsManager.GetVisibilityField();
        string outputdir = System.Configuration.ConfigurationManager.AppSettings["directoryoutput"];
        string outputdirmodel = System.Configuration.ConfigurationManager.AppSettings["directoryoutputmodel"];
        string datacontextname = System.Configuration.ConfigurationManager.AppSettings["datacontextname"];
        bool generategenericdatasource = ApplicationSettingsManager.GetGenerateGenericDs();
        string genericdatasourcecustomjson = ApplicationSettingsManager.GetDefaultCustomJsonParameter();

        [HttpPost]
        public HttpResponseMessage generateStandardPageFromClass(dynamic data)
        {
            HttpResponseMessage res = new HttpResponseMessage();
            try
            {
                JObject obj = JObject.Parse(data.ToString());
                bool generatefunction = (bool)obj["generatefunction"];
                string name = obj["name"].ToString();
                string message = MagicFramework.Helpers.StandardPageGenerator.generateStandardPageFromClass(name, generatefunction);
                res.StatusCode = HttpStatusCode.OK;
            }
            catch (Exception ex)
            {
                res.StatusCode = HttpStatusCode.InternalServerError;
                res.Content = new StringContent(string.Format("Standard Page generator from Class: {0}", ex.Message));

            }

            return res;
        }

        
        [HttpPost]
        public string generateStandardControllerFromClass(dynamic data)
        {
            string stdtemplate = System.IO.Path.Combine(System.Web.HttpRuntime.AppDomainAppPath, System.Configuration.ConfigurationManager.AppSettings["stdtemplatefile"]);
            JObject obj = JObject.Parse(data.ToString());
            string name = obj["entityname"].ToString();
            string res = MagicFramework.Helpers.ServerClassGenerator.generateStandardControllerFromClass(name, folder, vnamespace, outputdir, stdtemplate, datacontextname, visfield);
            return res;
        }

        [HttpPost]
        public HttpResponseMessage generateStandardPageFromTable(dynamic data)
        {
            HttpResponseMessage res = new HttpResponseMessage();
            try
            {
                JObject obj = JObject.Parse(data.ToString());
                string gridname = obj["name"].ToString();
                if (obj["gridname"]!=null)
                  gridname = obj["gridname"].ToString();
                string name = obj["name"].ToString();
                string maintable = obj["maintable"].ToString();
                string pk = obj["pk"].ToString();
                bool generatefunction = Convert.ToBoolean(obj["generatefunction"].ToString());
                string schema = obj["schema"].ToString();
                MagicFramework.Helpers.StandardPageGenerator.generateStandardPage(gridname,name, maintable, schema, outputdir, pk, generatefunction, generategenericdatasource, genericdatasourcecustomjson);

                res.StatusCode = HttpStatusCode.OK;
                res.Content = new StringContent("{ \"msg\": \"UI Components have been generated\"}");
            }
            catch (Exception ex) 
            {
                res.StatusCode = HttpStatusCode.InternalServerError;
                res.Content = new StringContent(string.Format("Standard Page generator from Table: {0}", ex.Message));                  
                     
            }
            
                return res;
        }

        //[HttpPost]
        //public HttpResponseMessage generateStandardPageFromTableNew(dynamic data)
        //{
        //    HttpResponseMessage res = new HttpResponseMessage();
        //    try
        //    {
        //        JObject obj = JObject.Parse(data.ToString());
        //        string name = obj["name"].ToString();
        //        string gridname = obj["name"].ToString();
        //        if (obj["gridname"] != null)
        //            gridname = obj["gridname"].ToString();
        //        string maintable = obj["maintable"].ToString();
        //        string schema = obj["schema"].ToString();
        //        string pk = obj["pk"].ToString();
        //        bool generatefunction = Convert.ToBoolean(obj["generatefunction"].ToString());
        //        string message = MagicFramework.Helpers.StandardPageGenerator.generateStandardPageNew(gridname, name, maintable, schema, outputdir, pk, generatefunction, generategenericdatasource, genericdatasourcecustomjson);
        //        res.StatusCode = HttpStatusCode.OK;
        //    }
        //    catch (Exception ex)
        //    {
        //        res.StatusCode = HttpStatusCode.InternalServerError;
        //        res.Content = new StringContent(string.Format("Standard Page generator from Table: {0}", ex.Message));

        //    }

        //    return res;
        //}

        
        [HttpPost]
        public string generateController(dynamic data)
        {
            JObject obj = JObject.Parse(data.ToString());
            string entityname = obj["entityname"].ToString();
            string pagingcol = obj["pagingcol"].ToString();
            string pagingcoltype = obj["pagingcoltype"].ToString();
            string dbschema = obj["dbschema"].ToString();
            string stdtemplate = System.IO.Path.Combine(System.Web.HttpRuntime.AppDomainAppPath, System.Configuration.ConfigurationManager.AppSettings["stdtemplatefile"]);
            string res = MagicFramework.Helpers.ServerClassGenerator.generateController(entityname, pagingcol, folder, vnamespace, outputdir, stdtemplate, datacontextname, pagingcoltype, dbschema);
            return res;
        }      
                

        [HttpPost]
        public string emptyControllerDir()
        {
            System.IO.DirectoryInfo directory = new System.IO.DirectoryInfo(outputdir);
            foreach (System.IO.FileInfo file in directory.GetFiles()) file.Delete();
            foreach (System.IO.DirectoryInfo subDirectory in directory.GetDirectories()) subDirectory.Delete(true);

            directory = new System.IO.DirectoryInfo(outputdirmodel);
            foreach (System.IO.FileInfo file in directory.GetFiles()) file.Delete();
            foreach (System.IO.DirectoryInfo subDirectory in directory.GetDirectories()) subDirectory.Delete(true);
            return "Directory is empty!!!";
        }

        [HttpPost]
        public string generateModel(dynamic data)
        { 
            JObject obj = JObject.Parse(data.ToString());
            string name = obj["name"].ToString();
            string res = MagicFramework.Helpers.ServerClassGenerator.generateModel(name, outputdirmodel, vnamespace, folder, visfield);
            return res;
        }      
       
    }
}