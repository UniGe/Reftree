using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Web;

namespace MagicFramework.Helpers
{
    public static class ServerClassGenerator
    {



        public static string generateModel(string name, string outputdir, string vnamespace, string folder, string visfield)
        {
            Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
            System.IO.DirectoryInfo directory = new System.IO.DirectoryInfo(outputdir);



            String body = "using System;\n";
            body += "using System.Collections.Generic;\n";
            body += "using System.Linq;\n";
            body += "using System.Web;\n\n";

            body += "namespace " + vnamespace + ".Models {\n\n";

            body += "public class " + name + "{\n\n";

            var propslist = context.BuildModelClassPoperties(name);

            foreach (var prop in propslist)
            {
                body += prop.Column1 + "\n";
            }


            body += "\npublic " + name + "(" + vnamespace + "." + folder + "." + name + " A) {\n";

            var constructor = context.BuildModelClassConstructor(name);

            foreach (var cons in constructor)
            {
                body += cons.Column1 + "\n";
            }

            body += "}\n}\n}\n";

            System.IO.File.WriteAllText(directory.FullName + name + ".cs", body);
            return "Model " + name + " has been generated";
        }
        /// <summary>
        /// Generates the controller for the given entity (view or table)
        /// </summary>
        /// <param name="entityname"></param>
        /// <param name="pagingcol">the primary key</param>
        /// <param name="visibilitycol"></param>
        /// <param name="folder"></param>
        /// <param name="visfield"></param>
        /// <param name="vnamespace"></param>
        /// <param name="outputdir"></param>
        /// <param name="stdtemplate"></param>
        /// <param name="novistemplate"></param>
        /// <param name="datacontextname"></param>
        /// <param name="pagingcoltype">he primary key type</param>
        /// <returns></returns>
        public static string generateController(string entityname, string pagingcol, string folder, string vnamespace, string outputdir, string stdtemplate, string datacontextname, string pagingcoltype, string dbschema)
        {

            Dictionary<string, string> types = new Dictionary<string, string>();

            types.Add("varchar", "string");
            types.Add("nvarchar", "string");
            types.Add("int", "int");
            types.Add("text", "string");
            types.Add("ntext", "string");
            types.Add("bigint", "long");
            types.Add("tinyint", "byte");

            var name = entityname;

            System.IO.DirectoryInfo directory = new System.IO.DirectoryInfo(outputdir);

            if (pagingcol == null)
                System.IO.File.AppendAllText(outputdir + "genlog.txt", "WARN - Controller " + name + " has not been generated due to null primary key in table \n");

            string template = String.Empty;
            try
            {
                // unique template
                template = stdtemplate;

                using (StreamReader sr = new StreamReader(template))
                {
                    String line = sr.ReadToEnd();

                    line = String.Format(line, name, vnamespace, folder, datacontextname, pagingcol, name, types[pagingcoltype.ToLower()], dbschema);
                    System.IO.File.WriteAllText(directory.FullName + name.ToUpper() + "Controller.cs", line);
                }
            }
            catch (Exception e)
            {
                System.IO.File.AppendAllText(outputdir + "genlog.txt", "ERROR - Controller " + name + " has not been generated due to " + e.Message + " \n");
                throw new Exception("Error for: "+ entityname + "," + e.Message);
            }
            return "Controller " + entityname + " has been generated";
        }



        /// <summary>
        /// Generates the controller for the given class
        /// </summary>
        /// <param name="entityname"></param>
        /// <param name="pagingcol">the primary key</param>
        /// <param name="visibilitycol"></param>
        /// <param name="folder"></param>
        /// <param name="visfield"></param>
        /// <param name="vnamespace"></param>
        /// <param name="outputdir"></param>
        /// <param name="stdtemplate"></param>
        /// <param name="novistemplate"></param>
        /// <param name="datacontextname"></param>
        /// <param name="pagingcoltype">the primary key type</param>
        /// <returns></returns>
        public static string generateStandardControllerFromClass(string entityname, string folder, string vnamespace, string outputdir, string stdtemplate, string datacontextname, string visfield)
        {

            string primarykey = String.Empty;
            string primarykeytype = String.Empty;
            string visibilitycol = String.Empty;

            string defaultdll = System.Configuration.ConfigurationManager.AppSettings["defaultobjectmodeldll"];
            string entitymodelclass = System.Configuration.ConfigurationManager.AppSettings["datacontexttosearch"];
            string isORM = System.Configuration.ConfigurationManager.AppSettings["objectmodelgeneratedbyORM"];

            Assembly targetassembly = System.Reflection.Assembly.LoadFile(defaultdll);
            Type t = targetassembly.GetType(entityname);
            List<MagicFramework.Helpers.MappingExplorer.Properties> classdbproperties = new List<MagicFramework.Helpers.MappingExplorer.Properties>();
            HashSet<string> insertedcolumn = new HashSet<string>();

            // Get the schema informations exploiting Entity Framework metadata
            if (isORM != "false" && isORM == "EntityFramework")
            {
                var db = (DbContext)Activator.CreateInstance(targetassembly.GetType(entitymodelclass));

                // Get all the model meta-data given the context
                var mappingInfo = new MagicFramework.Helpers.MappingExplorer.EfMapping(db, entityname);
                //Get theinfo for the given entity name (name parameter)
                var entitymappingInfo = mappingInfo.TypeMappings.Where(tm => tm.EntityType.FullName == entityname).FirstOrDefault();

                foreach (var tb in entitymappingInfo.TableMappings)
                {
                    foreach (var p in tb.PropertyMappings)
                    {
                        if (primarykey == String.Empty)
                        {
                            if (p.isPrimary)
                            {
                                primarykey = p.ColumnName;
                                primarykeytype = p.Property.PropertyType.ToString();
                                break;
                            }
                        }
                        else
                        {
                            break;
                        }
                    }
                    foreach (var p in tb.PropertyMappings)
                    {
                        if (visibilitycol == String.Empty)
                        {
                            if (p.ColumnName == visfield)
                            {
                                visibilitycol = p.ColumnName;
                                break;
                            }
                        }
                        else
                        {
                            break;
                        }
                    }
                }

            }

            System.IO.DirectoryInfo directory = new System.IO.DirectoryInfo(outputdir);

            if (primarykey == null)
                System.IO.File.AppendAllText(outputdir + "genlog.txt", "WARN - Controller " + entityname + " has not been generated due to null primary key in table \n");


            string template = String.Empty;
            try
            {
                // unique template
                template = stdtemplate;

                using (StreamReader sr = new StreamReader(template))
                {
                    String line = sr.ReadToEnd();

                    line = String.Format(line, entityname.Split('.').Last(), vnamespace, folder, datacontextname, primarykey, entityname.Split('.').Last(), primarykeytype);
                    System.IO.File.WriteAllText(directory.FullName + (entityname.Split('.').Last()).ToUpper() + "Controller.cs", line);
                }
            }
            catch (Exception e)
            {
                System.IO.File.AppendAllText(outputdir + "genlog.txt", "ERROR - Controller " + entityname + " has not been generated due to " + e.Message + " \n");
                return "Error: " + entityname + " " + e.Message;
            }
            return "Controller " + entityname + " has been generated";
        }
    }
}