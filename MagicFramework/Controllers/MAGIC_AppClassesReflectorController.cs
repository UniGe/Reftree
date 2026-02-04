


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
using System.Reflection;
using MagicFramework.Helpers;


namespace MagicFramework.Controllers
{
    public class MAGIC_AppClassesReflectorController : ApiController
    {

      
      // the linq to sql context that provides the data access layer
        private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
      private Type[] GetTypesInNamespace(Assembly assembly, string nameSpace)
      {
          return assembly.GetTypes().Where(t => String.Equals(t.Namespace, nameSpace, StringComparison.Ordinal)).ToArray();
      }

      public class classesdef
      {
          public bool selected { get; set; }
          public bool generatefunction { get; set; }
          public string classname { get; set; }
          public string assemblyname { get; set; }
          public string basetype { get; set; }
          public string refnamespace {get;set;}
          
          
      }

      [HttpGet]
      public List<string> GetNamespaces()
      {
          HashSet<string> ret = new HashSet<string>();

          string defaultdll = System.Configuration.ConfigurationManager.AppSettings["defaultobjectmodeldll"];
          Assembly targetassembly = System.Reflection.Assembly.LoadFile(defaultdll);

          Type[] typelist = targetassembly.GetTypes().ToArray();

          foreach (var x in typelist)
              ret.Add(x.Namespace);
          
          return ret.ToList();
      }
      
    
      [HttpPost]
      public Models.Response Select(Models.Request request)
      {
           try {
          Helpers.RequestParser rp = new Helpers.RequestParser(request);


      //    Type[] typelist = GetTypesInNamespace(Assembly.GetExecutingAssembly(), "MagicFramework.Data");
          string defaultdll = System.Configuration.ConfigurationManager.AppSettings["defaultobjectmodeldll"];
              Assembly targetassembly = System.Reflection.Assembly.LoadFile(defaultdll);

              Type[] typelist = targetassembly.GetTypes().ToArray();

              List<classesdef> deflist = new List<classesdef>();
              foreach (var t in typelist)
              {
                  classesdef cd = new classesdef();
                  cd.basetype = t.BaseType.Name;
                  cd.assemblyname = t.AssemblyQualifiedName;
                  cd.classname = t.FullName;
                  cd.selected = false;
                  cd.generatefunction = false;
                  cd.refnamespace = t.Namespace;

                  deflist.Add(cd);
              }
          
          return new Models.Response(deflist.ToArray(), typelist.Count()); 
           }
     catch (Exception ex) 
           {
                return new MagicFramework.Models.Response(ex.Message); 
           }
      }

                
    }
}