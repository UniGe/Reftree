using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Reflection;
using System.Data.Entity.Infrastructure;
using System.Collections.ObjectModel;
using System.Text.RegularExpressions;
using System.Collections;
using System.Xml.Linq;
using System.Xml;
using System.Data.Entity;
using System.Data.Entity.Core.Metadata.Edm;
using MongoDB.Bson;

namespace MagicFramework.Helpers
{
    public static class StandardPageGenerator
    {
        enum schema_types
        { 
            DATE,
            NUMBER,
            STRING,
            BOOLEAN,
            EMAIL,
            URL
        }
        enum db_types
        {
            BIGINT,
            BOOL,
            BIT,
            DATE,
            DATETIME,
            DATETIME2,
            DECIMAL,
            INT,
            NVARCHAR,
            VARCHAR,
            TEXT,
            NTEXT,
            SMALLDATETIME,
            SMALLINT,
            TIME
        }
        
        enum data_roles
        { 
            CHECKBOX,
            DATETIMEPICKER,
            DATEPICKER,
            TEXT,
            DROPDOWNLIST,
            NUMBER
        }

        private static string convertDBEnumTypeToLowerString(db_types t)
        {
            return t.ToString().ToLower();
        }
        private static string convertSchemaEnumTypeToLowerString(schema_types t)
        {
            return t.ToString().ToLower();
        }
        private static string convertDataRoleToLowerString(data_roles t)
        {
            return t.ToString().ToLower();
        }
        
        private static Dictionary<string, string> DataRolefromDBType
        {
            get {
                var datarolefromSchemaType = new Dictionary<string, string>();
                datarolefromSchemaType.Add(convertDBEnumTypeToLowerString(db_types.BIGINT), convertDataRoleToLowerString(data_roles.NUMBER));
                datarolefromSchemaType.Add(convertDBEnumTypeToLowerString(db_types.BIT), convertDataRoleToLowerString(data_roles.CHECKBOX));
                datarolefromSchemaType.Add(convertDBEnumTypeToLowerString(db_types.BOOL), convertDataRoleToLowerString(data_roles.CHECKBOX));
                datarolefromSchemaType.Add(convertDBEnumTypeToLowerString(db_types.DATE), convertDataRoleToLowerString(data_roles.DATEPICKER));
                datarolefromSchemaType.Add(convertDBEnumTypeToLowerString(db_types.DATETIME), convertDataRoleToLowerString(data_roles.DATETIMEPICKER));
                datarolefromSchemaType.Add(convertDBEnumTypeToLowerString(db_types.DATETIME2), convertDataRoleToLowerString(data_roles.DATETIMEPICKER));
                datarolefromSchemaType.Add(convertDBEnumTypeToLowerString(db_types.DECIMAL), convertDataRoleToLowerString(data_roles.NUMBER));
                datarolefromSchemaType.Add(convertDBEnumTypeToLowerString(db_types.INT), convertDataRoleToLowerString(data_roles.NUMBER));
                datarolefromSchemaType.Add(convertDBEnumTypeToLowerString(db_types.NTEXT), convertDataRoleToLowerString(data_roles.TEXT));
                datarolefromSchemaType.Add(convertDBEnumTypeToLowerString(db_types.NVARCHAR), convertDataRoleToLowerString(data_roles.TEXT));
                datarolefromSchemaType.Add(convertDBEnumTypeToLowerString(db_types.SMALLDATETIME), convertDataRoleToLowerString(data_roles.DATEPICKER));
                datarolefromSchemaType.Add(convertDBEnumTypeToLowerString(db_types.SMALLINT), convertDataRoleToLowerString(data_roles.NUMBER));
                datarolefromSchemaType.Add(convertDBEnumTypeToLowerString(db_types.TEXT), convertDataRoleToLowerString(data_roles.TEXT));
                datarolefromSchemaType.Add(convertDBEnumTypeToLowerString(db_types.TIME), convertDataRoleToLowerString(data_roles.DATETIMEPICKER));
                datarolefromSchemaType.Add(convertDBEnumTypeToLowerString(db_types.VARCHAR), convertDataRoleToLowerString(data_roles.TEXT));
                return datarolefromSchemaType;
            }
        
        }
        private static Dictionary<string, string> SchemafromDBType
        {
            get {
                 var schemafromDBType = new Dictionary<string,string>();
                 schemafromDBType.Add(convertDBEnumTypeToLowerString(db_types.BIGINT),convertSchemaEnumTypeToLowerString(schema_types.NUMBER));
                 schemafromDBType.Add(convertDBEnumTypeToLowerString(db_types.BIT),convertSchemaEnumTypeToLowerString(schema_types.BOOLEAN));
                 schemafromDBType.Add(convertDBEnumTypeToLowerString(db_types.BOOL), convertSchemaEnumTypeToLowerString(schema_types.BOOLEAN));
                 schemafromDBType.Add(convertDBEnumTypeToLowerString(db_types.DATE),convertSchemaEnumTypeToLowerString(schema_types.DATE));
                 schemafromDBType.Add(convertDBEnumTypeToLowerString(db_types.DATETIME),convertSchemaEnumTypeToLowerString(schema_types.DATE));
                 schemafromDBType.Add(convertDBEnumTypeToLowerString(db_types.DATETIME2),convertSchemaEnumTypeToLowerString(schema_types.DATE));
                 schemafromDBType.Add(convertDBEnumTypeToLowerString(db_types.DECIMAL),convertSchemaEnumTypeToLowerString(schema_types.NUMBER));
                 schemafromDBType.Add(convertDBEnumTypeToLowerString(db_types.INT),convertSchemaEnumTypeToLowerString(schema_types.NUMBER));
                 schemafromDBType.Add(convertDBEnumTypeToLowerString(db_types.NTEXT),convertSchemaEnumTypeToLowerString(schema_types.STRING));
                 schemafromDBType.Add(convertDBEnumTypeToLowerString(db_types.NVARCHAR),convertSchemaEnumTypeToLowerString(schema_types.STRING));
                 schemafromDBType.Add(convertDBEnumTypeToLowerString(db_types.SMALLDATETIME),convertSchemaEnumTypeToLowerString(schema_types.DATE));
                 schemafromDBType.Add(convertDBEnumTypeToLowerString(db_types.SMALLINT),convertSchemaEnumTypeToLowerString(schema_types.NUMBER));
                 schemafromDBType.Add(convertDBEnumTypeToLowerString(db_types.TEXT),convertSchemaEnumTypeToLowerString(schema_types.STRING));
                 schemafromDBType.Add(convertDBEnumTypeToLowerString(db_types.TIME),convertSchemaEnumTypeToLowerString(schema_types.DATE));
                 schemafromDBType.Add(convertDBEnumTypeToLowerString(db_types.VARCHAR),convertSchemaEnumTypeToLowerString(schema_types.STRING));
                return schemafromDBType;
                
            }
        }

        private static Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
        public static bool IsPrimitiveType(Type fieldType)
        {
            return fieldType.IsPrimitive || fieldType.Namespace.Equals("System");
        }
        public static bool DetectForeignKey(string fieldname)
        {
            //iterate through properties of non-primitive types and hookup the property (non-collection) whose 1st filed is equal to fieldname
            return true;
        }
        public static string getColumnUItype(string datatype)
        {
            return SchemafromDBType[datatype.ToLower()] == "string" ? null : SchemafromDBType[datatype.ToLower()];
        }
        public static string getColumnDBtype(string datatype)
        {

            if ((datatype.ToLower() == "datetime") || (datatype.ToLower() == "date"))
                return "datetime";
            if ((datatype.ToLower() == "decimal"))
                return "decimal";
            if ((datatype.ToLower() == "int") || (datatype.ToLower() == "int16") || (datatype.ToLower() == "int32") || (datatype.ToLower() == "int64"))
                return "int";
            if ((datatype.ToLower() == "bool") || (datatype.ToLower() == "boolean"))
                return "bit";
            return "varchar";
        }
        public static string getColumnformat(string columnname, string datatype)
        {
            if (datatype.ToLower() == "money")
                return "0:c2";
            return null;
        }
        public static string getColumnattributes(string columnname, string datatype)
        {
            if (datatype.ToLower().Contains("date"))
                return "style:\"text-align:text-align:center;\"";
            return null;
        }

        public static string GetColumntemplate(string columnname, string datatype)
        {
            if ((datatype.ToLower() == "bool") || (datatype.ToLower() == "bit"))
                return "'<input type=\"checkbox\" #= " + columnname + " ? \"checked=checked\" : \"\" # disabled=\"disabled\" ></input>'";
            if (datatype.ToLower().Contains("date"))
                return "function(dataItem) {       return  kendo.toString(dataItem." + columnname + ",\"d\") ;     }";
            return null;
        }


        public static string getPropertyType(PropertyInfo prop)
        {

            if ((prop.PropertyType == typeof(DateTime?)) || (prop.PropertyType == typeof(DateTime)))
            {
                return "datetime";
            }
            if ((prop.PropertyType == typeof(Decimal?)) || (prop.PropertyType == typeof(Decimal)))
            {
                return "decimal";
            }
            if ((prop.PropertyType == typeof(Int32?)) || (prop.PropertyType == typeof(Int32)) ||
                (prop.PropertyType == typeof(Int64?)) || (prop.PropertyType == typeof(Int64)) ||
                (prop.PropertyType == typeof(Int16?)) || (prop.PropertyType == typeof(Int16)))
            {
                return "int";
            }
            if ((prop.PropertyType == typeof(Boolean?)) || (prop.PropertyType == typeof(Boolean)))
            {
                return "bool";
            }


            return "string";
        }



        private static void addforeignkeyinfo(Data.Magic_GetForeignKeyDependenciesResult data, List<MagicFramework.Helpers.MappingExplorer.Properties> plist)
        {
            foreach (var p in plist)
            {
                if (p.propname == data.FK_Column)
                {
                    p.hasrelation = true;
                    p.foreignkeydataSource = data.PK_Table + "ds";
                    p.foreignkeydataSourcevaluefield = data.PK_Column;
                    p.foreignkeydataSourcetextfield = data.Description_Column;
                }
            }
        }

        public static MagicFramework.Helpers.MappingExplorer.Properties getClassDBproperties(string name, List<MagicFramework.Helpers.MappingExplorer.Properties> props)
        {
            foreach (var p in props)
                if (p.propname == name)
                    return p;
            return null;
        }


        public static string generateStandardPageFromClass(string name, bool generatefunction)
        {
            try
            {

                string defaultdll = System.Configuration.ConfigurationManager.AppSettings["defaultobjectmodeldll"];
                string entitymodelclass = System.Configuration.ConfigurationManager.AppSettings["datacontexttosearch"];
                string isORM = System.Configuration.ConfigurationManager.AppSettings["objectmodelgeneratedbyORM"];

                Assembly targetassembly = System.Reflection.Assembly.LoadFile(defaultdll);
                Type t = targetassembly.GetType(name);
                List<MagicFramework.Helpers.MappingExplorer.Properties> classdbproperties = new List<MagicFramework.Helpers.MappingExplorer.Properties>();
                HashSet<string> insertedcolumn = new HashSet<string>();

                // Get the schema informations exploiting Entity Framework metadata
                if (isORM != "false" && isORM == "EntityFramework")
                {
                    var db = (DbContext)Activator.CreateInstance(targetassembly.GetType(entitymodelclass));

                    // Get all the model meta-data given the context
                    var mappingInfo = new MagicFramework.Helpers.MappingExplorer.EfMapping(db, name);
                    //Get theinfo for the given entity name (name parameter)
                    var entitymappingInfo = mappingInfo.TypeMappings.Where(tm => tm.EntityType.FullName == name).FirstOrDefault();

                    foreach (var e in entitymappingInfo.TableMappings)
                    {
                        string tablename = e.TableName;
                        foreach (var property in e.PropertyMappings)
                        {
                            MagicFramework.Helpers.MappingExplorer.Properties map = new MagicFramework.Helpers.MappingExplorer.Properties();
                            map.ColumnName = property.ColumnName;
                            map.foreignkeydataSource = property.referencedTable == null ? null : property.referencedTable + "ds";
                            map.foreignkeydataSourcevaluefield = property.referencedTable == null ? null : property.renferencedTableColumnName;
                            //TODO function to hook up the first string field of the referenced table
                            map.foreignkeydataSourcetextfield = property.referencedTable == null ? null : property.renferencedTableTextColumnName;
                            map.hasrelation = property.referencedTable == null ? false : true;
                            map.isPrimary = property.isPrimary;
                            map.maxlength = property.maxlength;
                            map.nullable = property.nullable;
                            map.defaultvalue = property.defaultvalue;
                            map.tablename = tablename;
                            map.propname = property.Property == null ? null : property.Property.Name;
                            if (!insertedcolumn.Contains(map.ColumnName))
                                classdbproperties.Add(map);
                            insertedcolumn.Add(map.ColumnName);

                        }
                    }

                }

                bool gridisnew = false;

                var grid = (from e in context.Magic_Grids where e.FromClass == t.Name select e).FirstOrDefault();

                if (grid == null)
                {
                    gridisnew = true;
                    Data.Magic_Grids g = new Data.Magic_Grids();
                    g.MagicGridName = t.Name + "_standardgrid";
                    g.Editable = "popup";
                    g.DetailInitJSFunction = "true";
                    g.EditJSFunction = "true";
                    g.DetailTemplate = t.Name + "_standardnavigation";
                    g.EditableTemplate = t.Name + "_standardedit";
                    g.Groupable = "true";
                    g.Sortable = "true";
                    g.MagicGridColumnsCommand = "{ command: [{ name: \"edit\", text: \"\" }, { name: \"destroy\", text: \"\"}], title: \"&nbsp;\", width: \"85px\" },";
                    g.MagicGridEntity = t.Name;
                    g.FromClass = t.Name;
                    g.isSystemGrid = false;
                    Data.Magic_DataSource mds = (from e in context.Magic_DataSource where e.Name == t.Name select e).FirstOrDefault();
                    bool dsisnew = false;
                    if (mds == null)
                    {
                        mds = new Data.Magic_DataSource();
                        dsisnew = true;
                    }
                    mds.ObjRead = String.Format("{{ url: \"/api/{0}/Select\", type: \"POST\", contentType: \"application/json\" }}", t.Name);
                    mds.ObjUpdate = String.Format("{{ url: function (e) {{ return \"/api/{0}/PostU/\" + e.{1} }}, type: \"POST\", contentType: \"application/json\"}}", t.Name, t.GetProperties().FirstOrDefault().Name);
                    mds.ObjCreate = String.Format("{{ url: function (e) {{ return \"/api/{0}/PostI/\" }}, type: \"POST\", contentType: \"application/json\" }}", t.Name);
                    mds.ObjDestroy = String.Format("{{ url: function (e) {{ return \"/api/{0}/PostD/\" + e.{1} }}, type: \"POST\" }}", t.Name, t.GetProperties().FirstOrDefault().Name);
                    mds.Name = t.Name;
                    if (dsisnew)
                        context.Magic_DataSource.InsertOnSubmit(mds);
                    g.Magic_DataSource = mds;
                    grid = g;
                }

                var detailtemplate = (from e in context.Magic_Templates where e.Magic_TemplateTypes.MagicTemplateType == "NAVIGATION" && e.FromClass == t.Name select e).FirstOrDefault();

                Data.Magic_Templates ted;
                Data.Magic_TemplateGroups tgd;
                if (detailtemplate == null)
                {
                    ted = new Data.Magic_Templates();   // Creation of the edit template as a tabstrip
                    ted.MagicTemplateName = t.Name + "_standardnavigation";
                    ted.MagicTemplateType_ID = (from e in context.Magic_TemplateTypes where e.MagicTemplateType == "NAVIGATION" select e).FirstOrDefault().MagicTemplateTypeID;
                    ted.MagicTemplateLayout_ID = (from e in context.Magic_TemplateLayouts where e.Layout == "TABSTRIP" select e).FirstOrDefault().MagicTemplateLayoutID;
                    ted.FromClass = t.Name;
                    ted.isSystemTemplate = false;
                    var mtg1 = new Data.Magic_TemplateGroups();
                    mtg1.Groupisvisible = true;
                    mtg1.Magic_TemplateGroupContent = (from e in context.Magic_TemplateGroupContent where e.MagicTemplateGroupContentType == "FIELDLABELLIST" select e).FirstOrDefault();
                    mtg1.MagicTemplateGroupLabel = "Data";
                    ted.Magic_TemplateGroups = new System.Data.Linq.EntitySet<Data.Magic_TemplateGroups>();
                    ted.Magic_TemplateGroups.Add(mtg1);
                    tgd = mtg1;

                }
                else { ted = detailtemplate; }


                var edittemplate = (from e in context.Magic_Templates where e.Magic_TemplateTypes.MagicTemplateType == "POPUPEDITOR" && e.FromClass == t.Name select e).FirstOrDefault();

                Data.Magic_Templates te;
                Data.Magic_TemplateGroups tg;
                if (edittemplate == null)
                {
                    te = new Data.Magic_Templates();   // Creation of the edit template as a tabstrip
                    te.MagicTemplateName = t.Name + "_standardedit";
                    te.MagicTemplateType_ID = (from e in context.Magic_TemplateTypes where e.MagicTemplateType == "POPUPEDITOR" select e).FirstOrDefault().MagicTemplateTypeID;
                    te.MagicTemplateLayout_ID = (from e in context.Magic_TemplateLayouts where e.Layout == "TABSTRIP" select e).FirstOrDefault().MagicTemplateLayoutID;
                    te.FromClass = t.Name;
                    te.isSystemTemplate = false;
                    var mtg = new Data.Magic_TemplateGroups();
                    mtg.Groupisvisible = true;
                    mtg.Magic_TemplateGroupContent = (from e in context.Magic_TemplateGroupContent where e.MagicTemplateGroupContentType == "FIELDEDITLIST" select e).FirstOrDefault();
                    mtg.MagicTemplateGroupLabel = "Data";
                    te.Magic_TemplateGroups = new System.Data.Linq.EntitySet<Data.Magic_TemplateGroups>();
                    te.Magic_TemplateGroups.Add(mtg);
                    tg = mtg;

                }
                else
                {
                    te = edittemplate;
                    //get the fieldedit list tab
                    tg = te.Magic_TemplateGroups.Where(x => x.Magic_TemplateGroupContent.MagicTemplateGroupContentType == "FIELDEDITLIST").FirstOrDefault();
                    if (tg == null)  // i add a FIELDEDITLIST tab if not existing
                    {
                        tg = new Data.Magic_TemplateGroups();
                        tg.Groupisvisible = true;
                        tg.Magic_TemplateGroupContent = (from e in context.Magic_TemplateGroupContent where e.MagicTemplateGroupContentType == "FIELDEDITLIST" select e).FirstOrDefault();
                        tg.MagicTemplateGroupLabel = "Data";
                        if (te.Magic_TemplateGroups == null)
                            te.Magic_TemplateGroups = new System.Data.Linq.EntitySet<Data.Magic_TemplateGroups>();
                        te.Magic_TemplateGroups.Add(tg);
                    }
                }

                foreach (PropertyInfo prop in t.GetProperties())
                {
                    if (IsPrimitiveType(prop.PropertyType))
                    {
                        string fieldname = prop.Name;
                        if (gridisnew)
                        {
                            var column = new Data.Magic_Columns();
                            fillcolumn(classdbproperties, fieldname, prop, grid, column);
                            var det = new Data.Magic_TemplateDetails();
                            filltempplatedetail(classdbproperties, fieldname, prop, det);
                            context.Magic_Columns.InsertOnSubmit(column);
                            det.Magic_TemplateGroups = tg;
                            det.Magic_Templates = te;
                            det.Magic_Columns = column;
                            context.Magic_TemplateDetails.InsertOnSubmit(det);
                            if (grid.Magic_Columns == null)
                                grid.Magic_Columns = new System.Data.Linq.EntitySet<Data.Magic_Columns>();
                            grid.Magic_Columns.Add(column);
                        }
                        else
                        {

                            var col = (from e in context.Magic_Columns where e.MagicGrid_ID == grid.MagicGridID && e.ColumnName == fieldname select e).FirstOrDefault();
                            if (col == null)
                            {
                                var column = new Data.Magic_Columns();
                                fillcolumn(classdbproperties, fieldname, prop, grid, column);
                                var det = new Data.Magic_TemplateDetails();
                                filltempplatedetail(classdbproperties, fieldname, prop, det);

                                context.Magic_Columns.InsertOnSubmit(column);
                                det.Magic_TemplateGroups = tg;
                                det.Magic_Templates = te;
                                det.Magic_Columns = column;
                                context.Magic_TemplateDetails.InsertOnSubmit(det);
                                if (grid.Magic_Columns == null)
                                    grid.Magic_Columns = new System.Data.Linq.EntitySet<Data.Magic_Columns>();
                                grid.Magic_Columns.Add(column);

                            }
                            else
                            {

                                fillcolumn(classdbproperties, fieldname, prop, grid, col);
                                var dettemp = col.Magic_TemplateDetails != null ? col.Magic_TemplateDetails.Where(x => x.Magic_Templates.MagicTemplateID == te.MagicTemplateID).FirstOrDefault() : null;
                                if (dettemp != null)
                                    filltempplatedetail(classdbproperties, fieldname, prop, dettemp);

                            }

                        }

                    }

                }


                if (!gridisnew)
                    foreach (var c in grid.Magic_Columns)
                        if (t.GetProperties().Where(x => x.Name == c.ColumnName).Count() == 0)
                        {
                            //TODO verificare che ci siano tutti i cascade a partire dalla colonna su DB
                            context.Magic_Columns.DeleteOnSubmit(c);
                        }
                context.SubmitChanges();

                if (generatefunction)
                {
                    var function = (from e in context.Magic_Functions where e.FromClass == name.Split('.').Last() select e).FirstOrDefault();
                    if (function == null)
                    {
                        Data.Magic_Functions newf = new Data.Magic_Functions();
                        newf.FunctionBaseUrl = "#";
                        newf.FunctionDescription = "Function for " + name;
                        newf.FunctionName = name;
                        newf.FromClass = name.Split('.').Last();
                        newf.isSystemFunction = false;
                        var mf = new Data.Magic_FunctionsGrids();
                        newf.Magic_FunctionsGrids = new System.Data.Linq.EntitySet<Data.Magic_FunctionsGrids>();
                        mf.Magic_Grids = grid;
                        newf.Magic_FunctionsGrids.Add(mf);
                        newf.Magic_FunctionsTemplates = new System.Data.Linq.EntitySet<Data.Magic_FunctionsTemplates>();
                        var nt = new Data.Magic_FunctionsTemplates();
                        nt.Magic_Templates = te;
                        var ntd = new Data.Magic_FunctionsTemplates();
                        ntd.Magic_Templates = ted;
                        newf.Magic_FunctionsTemplates.Add(nt);
                        newf.Magic_FunctionsTemplates.Add(ntd);
                        context.Magic_Functions.InsertOnSubmit(newf);
                        context.SubmitChanges();
                    }
                }


            }
            catch (Exception e)
            {
                return "Error: " + name + " " + e.Message;
            }
            return "Standard Function Components for " + name + " have been generated";
        }

        private static void fillcolumn(List<MagicFramework.Helpers.MappingExplorer.Properties> classdbproperties, string fieldname, PropertyInfo prop, Data.Magic_Grids grid, Data.Magic_Columns column)
        {
            var dbprop = getClassDBproperties(prop.Name, classdbproperties);
            string type = dbprop != null ? (dbprop.hasrelation == true ? "int" : null) : null;
            // solve the type
            if (type == null)
                type = getPropertyType(prop);

            column.ColumnName = fieldname;
            column.Columns_label = fieldname;
            column.Columns_template = GetColumntemplate(prop.Name, type);
            column.Columns_visibleingrid = true;
            column.DataType = getColumnDBtype(type);
            column.Isprimary = (dbprop == null) ? 0 : (dbprop.isPrimary == true ? 1 : 0);
            column.Schema_editable = true;
            column.Schema_attributes = getColumnattributes(fieldname, type);
            column.Schema_Format = getColumnformat(fieldname, type);
            column.Schema_type = getColumnUItype(type);
            column.FK_Column = dbprop != null ? (dbprop.hasrelation == true ? fieldname : null) : null;
            column.PK_Table = dbprop != null ? (dbprop.foreignkeydataSource != null ? dbprop.foreignkeydataSource.Substring(0, dbprop.foreignkeydataSource.Length - 2) : null) : null;
            column.PK_Column = dbprop != null ? dbprop.foreignkeydataSourcevaluefield : null;
            column.StringLength = dbprop.maxlength;
            column.Schema_nullable = dbprop.nullable == true ? "true" : "false";



        }
        private static void filltempplatedetail(List<MagicFramework.Helpers.MappingExplorer.Properties> classdbproperties, string fieldname, PropertyInfo prop, Data.Magic_TemplateDetails det)
        {
            var dbprop = getClassDBproperties(fieldname, classdbproperties);
            string type = dbprop != null ? (dbprop.hasrelation == true ? "int" : null) : null;
            // solve the type
            if (type == null)
                type = getPropertyType(prop);

            det.Detailisvisible = true;
            det.MagicNullOptionLabel = "N/A";
            det.MagicDataSource = dbprop != null ? (dbprop.foreignkeydataSource != null ? dbprop.foreignkeydataSource : null) : null;
            det.MagicDataSourceTextField = dbprop != null ? dbprop.foreignkeydataSourcetextfield : null;
            det.MagicDataSourceValueField = dbprop != null ? dbprop.foreignkeydataSourcevaluefield : null;
            det.DetailDOMID = dbprop != null ? (dbprop.foreignkeydataSource != null ? dbprop.foreignkeydataSource.Substring(0, dbprop.foreignkeydataSource.Length - 2) + "dd" : null) : null;
            Data.Magic_TemplateDataRoles datarole = getTemplateDataRole(type, dbprop);
            det.Magic_TemplateDataRoles = datarole;


        }

        public static int getTemplateDataRole(string dbtype,string joinTable)
        {
            if (dbtype == null)
                dbtype = "varchar";
            
            if (joinTable!=null)
                    return (from e in context.Magic_TemplateDataRoles where e.MagicTemplateDataRole == "dropdownlist" select e).FirstOrDefault().MagicTemplateDataRoleID;

            string datarolecode =  DataRolefromDBType[dbtype];

            int datarole = (from e in context.Magic_TemplateDataRoles where e.MagicTemplateDataRole == datarolecode select e).FirstOrDefault().MagicTemplateDataRoleID;

            return datarole;

        }

        private static Data.Magic_TemplateDataRoles getTemplateDataRole(string type, MagicFramework.Helpers.MappingExplorer.Properties prop)
        {

            if ((type.ToLower() == "string"))
                return (from e in context.Magic_TemplateDataRoles where e.MagicTemplateDataRole == "text" select e).FirstOrDefault();

            if ((type.ToLower() == "datetime") || (type.ToLower() == "date"))
                return (from e in context.Magic_TemplateDataRoles where e.MagicTemplateDataRole == "datetimepicker" select e).FirstOrDefault();

            if ((type.ToLower() == "decimal") || (type.ToLower() == "int") || (type.ToLower() == "int16") || (type.ToLower() == "int32") || (type.ToLower() == "int64") || (type.ToLower() == "float"))
                if (prop.hasrelation)
                    return (from e in context.Magic_TemplateDataRoles where e.MagicTemplateDataRole == "dropdownlist" select e).FirstOrDefault();
                else
                    return (from e in context.Magic_TemplateDataRoles where e.MagicTemplateDataRole == "number" select e).FirstOrDefault();
            if ((type.ToLower() == "bool") || (type.ToLower() == "boolean"))
                return (from e in context.Magic_TemplateDataRoles where e.MagicTemplateDataRole == "checkbox" select e).FirstOrDefault();
            return null;
        }
      

        public static void generateStandardPage(string gridname,string entityname, string maintable, string schema, string outputdir, string pk, bool generatefunction, bool generategenericdatasource, string genericdatasourcecustomjson)
        {
            try
            {
                context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
                bool issystem = ApplicationSettingsManager.GetWorkOnSystemSettings();
                string catalog = DBConnectionManager.getTargetDBName(); //passo anche il nome del DB es. MagicDB.dbo in modo da poter far riferimento all' INFORMATION SCHEMA giusto in fase di creazione
                context.BuildStandardPageDB(gridname,entityname, maintable, catalog+"."+schema, generatefunction,issystem);
                // impongo l' uso del controller generico
                if (generategenericdatasource)
                {
                    var datasource = (from e in context.Magic_DataSource where e.Name == gridname select e).FirstOrDefault();
                    if (datasource != null)
                    {
                        string controllerapi = "GENERICSQLCOMMAND";
                        datasource.ObjRead = String.Format("{{ url: \"/api/{0}/Select\", type: \"POST\", contentType: \"application/json\" }}", controllerapi);
                        datasource.ObjUpdate = String.Format("{{ url: function (e) {{ return \"/api/{0}/PostU/\" + e.{1} }}, type: \"POST\", contentType: \"application/json\"}}", controllerapi, pk);
                        datasource.ObjCreate = String.Format("{{ url: function (e) {{ return \"/api/{0}/PostI/\" }}, type: \"POST\", contentType: \"application/json\" }}", controllerapi);
                        datasource.ObjDestroy = String.Format("{{ url: function (e) {{ return \"/api/{0}/PostD/\" + e.{1} }}, type: \"POST\", contentType: \"application/json\"  }}", controllerapi, pk);
                        datasource.CustomJSONParam = genericdatasourcecustomjson;
                        context.SubmitChanges();
                    }

                }
            }
            catch (Exception e)
            {
                Directory.CreateDirectory(outputdir);
                System.IO.File.AppendAllText(outputdir + "genlog.txt", "ERROR - Standard Function components for " + entityname + " have not been generated due to " + e.Message + " \n");
                throw new System.ArgumentException(e.Message);
            }
            return;
        }

        //public static string generateStandardPageNew(string gridname, string entityname, string maintable, string schema, string outputdir, string pk, bool generatefunction, bool generategenericdatasource, string genericdatasourcecustomjson)
        //{
        //    try
        //    {
        //        //bool issystem = ApplicationSettingsManager.GetWorkOnSystemSettings();
        //        //context.BuildStandardPageDB(entityname, maintable, schema, generatefunction, issystem);
        //        Data.ConfigMFContainer _context = DBConnectionManager.GetTargetConnection() != null ? new Data.ConfigMFContainer(DBConnectionManager.GetMagicConnection()) : new Data.ConfigMFContainer();
        //        var columns = _context.Magic_GetColumns(entityname, maintable, schema);
        //        BsonDocument doc = new BsonDocument();
        //        doc["name"] = gridname;
        //        doc["FromTable"] = schema + "." + maintable;
        //        doc["data"] = new BsonDocument();
        //        BsonDocument model = new BsonDocument();
        //        BsonDocument fields = new BsonDocument();
        //        BsonDocument columnInfo = new BsonDocument();
        //        BsonArray kendoColumns = new BsonArray();
        //        BsonArray editableColumns = new BsonArray();
        //        foreach(var c in columns.ToList()){
        //            BsonDocument column = new BsonDocument();
        //            BsonDocument info = new BsonDocument();
        //            BsonDocument editableColumn = new BsonDocument();
        //            editableColumn["columnName"] = c.COLUMN_NAME;
        //            editableColumn["visible"] = new BsonDocument { {"_overwriteBy", "functionID"}, {"default", true} };
        //            editableColumn["optionLabel"] = new BsonDocument { { "_overwriteBy", "cultureID" }, { "default", c.COLUMN_NAME } };
        //            column["field"] = c.COLUMN_NAME;
        //            column["title"] = new  BsonDocument{
        //                {"default", c.COLUMN_NAME},
        //                {"_overwriteBy", "cultureID"}
        //            };
        //            column["filterable"] = true;
        //            column["sortable"] = true;
        //            if(c.isprimary == 1)
        //                model.Add("id", c.COLUMN_NAME);
        //            fields.Add(c.COLUMN_NAME, new BsonDocument());
        //            fields[c.COLUMN_NAME]["editable"] = false;
        //            if ((c.schematype != null) && (c.FK_Column == null))
        //                fields[c.COLUMN_NAME]["type"] = c.schematype;
        //            else if(c.schematype == null)
        //                fields[c.COLUMN_NAME]["type"] = "string";
        //            if (c.DATA_TYPE != null)
        //            {
        //                fields[c.COLUMN_NAME]["databasetype"] = c.DATA_TYPE;
        //                string type;
        //                switch (c.DATA_TYPE)
        //                {
        //                    case ("bit"): type = "checkbox"; break;
        //                    case ("int"):
        //                        if (c.PK_Table == null)
        //                            type = "number";
        //                        else
        //                            type = "dropdownlist";
        //                        break;
        //                    case ("money"):
        //                    case ("decimal"): type = "number"; break;
        //                    case ("datetime"): type = "datetimepicker"; break;
        //                    default: type = "text"; break;
        //                }
        //                editableColumn["dataRole"] = type;
        //            }
        //            if (c.nullable != null && c.nullable.Equals("false") && (c.isprimary == 0))
        //                fields[c.COLUMN_NAME]["nullable"] = c.nullable.ToLower();
        //            if(c.COLUMN_DEFAULT != null && (c.isprimary == 0))
        //                fields[c.COLUMN_NAME]["defaultValue"] = c.COLUMN_DEFAULT;
        //            if(c.validation != null && (c.isprimary == 0))
        //                fields[c.COLUMN_NAME]["validation"] = c.validation;
        //            if (c.FK_Column != null)
        //                column["MagicDataSourceValueField"] = c.datasourcevaluefield;
        //            if (c.PK_Table != null)
        //                column["MagicDataSource"] = c.datasource;
        //            if (c.PK_Column != null)
        //                column["MagicDataSourceTextField"] = c.datasourcetextfield;
        //            if(c.CHARACTER_MAXIMUM_LENGTH != null)
        //                info["StringLength"] = c.CHARACTER_MAXIMUM_LENGTH;
        //            if (c.NUMERIC_PRECISION != null)
        //                info["NumericPrecision"] = c.NUMERIC_PRECISION;
        //            if (c.NUMERIC_PRECISION_RADIX != null)
        //                info["NumericPrecisionRadix"] = c.NUMERIC_PRECISION_RADIX;
        //            if (c.DATETIME_PRECISION != null)
        //                info["DatetimePrecision"] = c.DATETIME_PRECISION;
        //            if (info.ElementCount > 0)
        //                columnInfo[c.COLUMN_NAME] = info;
        //            kendoColumns.Add(column);
        //            editableColumns.Add(editableColumn);
        //        }
        //        model.Add("fields", fields);
        //        doc["data"]["columns"] = kendoColumns;
        //        doc["data"]["dataSource"] = new BsonDocument {
        //            {"schema", new BsonDocument{
        //                {"model", model}
        //            }}
        //        };
        //        if (generategenericdatasource)
        //        {
        //            BsonDocument transport = new BsonDocument();
        //            //var datasource = (from e in context.Magic_DataSource where e.Name == entityname select e).FirstOrDefault();
        //            //if (datasource != null)
        //            //{
        //            string controllerapi = "GENERICSQLCOMMAND";
        //            transport["read"]// = String.Format("{{ url: \"/api/{0}/Select\", type: \"POST\", contentType: \"application/json\" }}", controllerapi);
        //            = new BsonDocument {
        //                {"url", "/api/" + controllerapi + "/Select"},
        //                {"type", "POST"},
        //                {"contentType", "application/json"}
        //            };
        //            transport["update"]// = String.Format("{{ url: function (e) {{ return \"/api/{0}/PostU/\" + e.{1} }}, type: \"POST\", contentType: \"application/json\"}}", controllerapi, pk);
        //                = new BsonDocument {
        //                {"url", "function (e) { return \"/api/" + controllerapi + "/PostU/\" + e." + pk},
        //                {"type", "POST"},
        //                {"contentType", "application/json"}
        //            };
        //            transport["create"]// = String.Format("{{ url: function (e) {{ return \"/api/{0}/PostI/\" }}, type: \"POST\", contentType: \"application/json\" }}", controllerapi);
        //                = new BsonDocument {
        //                {"url", "/api/" + controllerapi + "/PostI/"},
        //                {"type", "POST"},
        //                {"contentType", "application/json"}
        //            };
        //            transport["destroy"]// = String.Format("{{ url: function (e) {{ return \"/api/{0}/PostD/\" + e.{1} }}, type: \"POST\", contentType: \"application/json\"  }}", controllerapi, pk);
        //                = new BsonDocument {
        //                {"url", "function (e) { return \"/api/" + controllerapi + "/PostD/\" + e." + pk},
        //                {"type", "POST"},
        //                {"contentType", "application/json"}
        //            };
        //            try
        //            {
        //                transport["custom"] = MongoDB.Bson.Serialization.BsonSerializer.Deserialize<BsonDocument>(genericdatasourcecustomjson);
        //            }
        //            catch { }
        //            //}
        //            doc["data"]["dataSource"]["transport"] = new BsonDocument {
        //                {"default", transport},
        //                {"_overwriteBy", "layerID"}
        //            };
        //        }
        //        doc["data"]["gridcode"] = entityname;
        //        doc["data"]["selectable"] = false;
        //        doc["data"]["editablecolumnnumber"] = "";
        //        doc["data"]["groupable"] = new BsonDocument {
        //            {"default", false},
        //            {"_overwriteBy", "functionID"}
        //        };
        //        doc["data"]["sortable"] = new BsonDocument {
        //            {"default", true},
        //            {"_overwriteBy", "functionID"}
        //        };
        //        doc["data"]["editable"] = new BsonDocument {
        //            {"default", false},
        //            {"_overwriteBy", "functionID"}
        //        };
        //        doc["data"]["toolbar"] = new BsonDocument {
        //            {"_overwriteBy", "functionID"}
        //        };
        //        doc["columnInfo"] = columnInfo;
        //        doc["data"]["detailTemplateName"] = new BsonDocument {
        //            {"_overwriteBy", "functionID"},
        //            {"default", gridname + "_standardnavigation"}
        //        };
        //        doc["data"]["detailTemplate"] = new BsonDocument {
        //            {"_overwriteBy", "functionID"}
        //        };
        //        doc["data"]["editableName"] = new BsonDocument {
        //            {"_overwriteBy", "functionID"},
        //            {"default", gridname + "_standardedit"}
        //        };
        //        doc["data"]["editable"] = new BsonDocument {
        //            {"_overwriteBy", "functionID"},
        //            {"default", new BsonArray {editableColumns}}
        //        };
        //        doc["data"]["MagicGridColumnsCommand"] = new BsonDocument {
        //            {"_overwriteBy", "functionID"}
        //        };
        //        MongoConfigHandler mch = new MongoConfigHandler();
        //        mch.InsertDocument(doc, "grids");
        //    }
        //    catch (Exception e)
        //    {
        //        //System.IO.File.AppendAllText(outputdir + "genlog.txt", "ERROR - Standard Function components for " + entityname + " have not been generated due to " + e.Message + " \n");
        //        return "Error: " + entityname + " " + e.Message;
        //    }
        //    return "Standard Function Components for " + entityname + " have been generated";
        //}
    }
}



