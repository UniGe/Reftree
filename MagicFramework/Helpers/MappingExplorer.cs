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

namespace MagicFramework.Helpers
{   
    public static class MappingExplorer
    {
        private static Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());/// <summary>
        /// The mapping explorer class exploites all the mapping metadata of ORMs (EF, LinqToSql) in order to relate properties and database 
        /// </summary>
        public class Properties : PropertyMapping
        {
            public string tablename { get; set; }
            public string propname { get; set; }
            public string foreignkeydataSource { get; set; }
            public string foreignkeydataSourcevaluefield { get; set; }
            public string foreignkeydataSourcetextfield { get; set; }
            public bool hasrelation { get; set; }
        }
         public class TypeMapping
    {
        /// <summary>
        /// The type of the entity from the model
        /// </summary>
        public Type EntityType { get; set; }
 
        /// <summary>
        /// The table(s) that the entity is mapped to
        /// </summary>
        public List<TableMapping> TableMappings { get; set; }
    }
 
    /// <summary>
    /// Represents the mapping of an entity to a table in the database
    /// </summary>
    public class TableMapping
    {
        /// <summary>
        /// The name of the table the entity is mapped to
        /// </summary>
        public string TableName { get; set; }
        public string SchemaName { get; set; }
        public string BaseTable { get; set; }
        public string BaseEntity { get; set; }
        
 
        /// <summary>
        /// Details of the property-to-column mapping
        /// </summary>
        public List<PropertyMapping> PropertyMappings { get; set; }

        
    }
 
    /// <summary>
    /// Represents the mapping of a property to a column in the database
    /// </summary>
    public class PropertyMapping
    {
        /// <summary>
        /// The property from the entity type
        /// </summary>
        public PropertyInfo Property { get; set; }
        /// <summary>
        /// The column that property is mapped to
        /// </summary>
        public string ColumnName { get; set; }

        public bool isPrimary { get; set; }

        public string referencedTable { get; set; }

        public string renferencedTableColumnName { get; set; }

        public int? maxlength { get; set; }

        public bool nullable { get; set; }

        public string defaultvalue { get; set; }

        public string renferencedTableTextColumnName { get; set; }
    }

    public static string getFromTableTextField(string fromTable, List<TypeMapping> TypeMappings)
    {
        foreach (var i in TypeMappings)
        { 
            
            foreach (var y in i.TableMappings)
            if (y.TableName == fromTable)
                foreach (var x in y.PropertyMappings)
                {
                    if (x.Property.PropertyType.ToString() == "System.String")
                        return x.ColumnName;
                }
        }
        return null;
    }
    //public static System.Data.Entity.Core.Metadata.Edm.GlobalItem searchEFtype(System.Collections.Generic.IEnumerable<System.Data.Entity.Core.Metadata.Edm.GlobalItem> mytypes, string entityname)
    //{
    //    foreach (var item in mytypes)
    //    {
    //        var s = item.ToString().Split('.');
    //        if (s[s.Count() - 1] == entityname.Split('.')[entityname.Split('.').Count() - 1])
    //            return item;
    //    }
    //    return null;
    //}

    //public static List<MagicFramework.Helpers.MappingExplorer.Properties> GetEFDBFirstTableSpecs(DbContext db, string entityname)
    //{
    //    List<string> tableNameList = new List<string>();
    //    // use DBContext to get ObjectContext


    //    IObjectContextAdapter adapter = db as IObjectContextAdapter;
    //    var objectContext = adapter.ObjectContext;
    //    // i get all the EF meta data contained in the CSPACE
    //    var allTypes = objectContext.MetadataWorkspace.GetItems(System.Data.Entity.Core.Metadata.Edm.DataSpace.CSpace);
    //    // i filter my types
    //    var mytypes = from m in allTypes where m.BuiltInTypeKind == System.Data.Entity.Core.Metadata.Edm.BuiltInTypeKind.EntityType select m;
    //    // Hook-up my entity meta data
    //    var myentity = searchEFtype(mytypes,
    //                                entityname);

    //    List<MagicFramework.Helpers.MappingExplorer.Properties> plist = new List<MagicFramework.Helpers.MappingExplorer.Properties>();
    //    string primary = String.Empty;
    //    // loop over metadata properties of my class
    //    foreach (var prop in myentity.MetadataProperties)
    //    {

    //        bool iskey = (prop.GetType().GetProperty("Name").GetValue(prop).ToString() == "KeyMembers");
    //        bool ismember = (prop.GetType().GetProperty("Name").GetValue(prop).ToString() == "Members");

    //        if (iskey)
    //        {
    //            IEnumerable enumerable = prop.Value as IEnumerable;

    //            foreach (var val in enumerable)
    //            {

    //                var p = new MagicFramework.Helpers.MappingExplorer.Properties();
    //                p.propname = val.GetType().GetProperty("Name").GetValue(val).ToString();
    //                p.isPrimary = true;
    //                primary = p.propname;
    //                plist.Add(p);
    //            }
    //        }

    //        if (ismember)
    //        {
    //            IEnumerable enumerable = prop.Value as IEnumerable;

    //            foreach (var val in enumerable)
    //            {

    //                var p = new MagicFramework.Helpers.MappingExplorer.Properties();
    //                p.propname = val.GetType().GetProperty("Name").GetValue(val).ToString();
    //                if ((p.propname != primary) && (val.GetType().GetProperty("BuiltInTypeKind").GetValue(val).ToString() != "NavigationProperty"))
    //                    plist.Add(p);
    //                if (val.GetType().GetProperty("BuiltInTypeKind").GetValue(val).ToString() == "NavigationProperty")
    //                {

    //                    var dbres = context.Magic_GetForeignKeyDependencies(val.GetType().GetProperty("RelationshipType").GetValue(val).ToString().Split('.')[1]);
    //                    var data = dbres.FirstOrDefault();
    //                    if (data != null)
    //                        addforeignkeyinfo(plist,data.Referencing_Table,data.PK_Table,data.PK_Table,data.PK_Column,data.Description_Column);
    //                }
    //            }
    //        }
    //    }


    //    return plist;
    //}

    private static void addforeignkeyinfo(List<Properties> plist, string fromTable, string fromProperty, string toTable, string toProperty, string textField)
    {
        foreach (var prop in plist)
            if (prop.ColumnName == toProperty)
            {
                prop.renferencedTableTextColumnName = textField;
                prop.referencedTable = fromTable;
                prop.renferencedTableColumnName = fromProperty;
                break;
            }
    }

    public static void addforeignkeyinfo(List<TypeMapping> TypeMappings,string fromTable,string fromProperty,string toTable,string toProperty,string textField)
    {
        foreach (var t in TypeMappings)
        {
            foreach (var tm in t.TableMappings)
            {
                if (tm.TableName == toTable || tm.TableName == toTable + "Self")
                {
                    foreach (var prop in tm.PropertyMappings)
                        if (prop.ColumnName == toProperty)
                        {
                            prop.renferencedTableTextColumnName = textField;
                            prop.referencedTable = fromTable;
                            prop.renferencedTableColumnName = fromProperty;
                            break;
                        }
                    break;
                }
            }        
        }
    }
    public class EfMapping
    {
        /// <summary>
        /// Mapping information for each entity type in the model
        /// </summary>
        public List<TypeMapping> TypeMappings { get; set; }
        public List<String> InheritingEntityTypes { get; set; }
        /// <summary>
        /// Initializes an instance of the EfMapping class
        /// </summary>
        /// <param name="db">The context to get the mapping from</param>
        public EfMapping(DbContext db,string name)
        {
            bool isdbfirst = false;
            this.TypeMappings = new List<TypeMapping>();

            this.InheritingEntityTypes = new List<String>();
 
            var metadata = ((IObjectContextAdapter)db).ObjectContext.MetadataWorkspace;
 
            // Conceptual part of the model has info about the shape of our entity classes

            var conceptualContainer = metadata.GetItems<EntityType>(DataSpace.CSpace);
            //The input entity
            IList<EntityType> listofent = new List<EntityType>();
                var themainentity = conceptualContainer.Where(x => x.FullName == name).FirstOrDefault();

                if (themainentity == null)
                {
                    isdbfirst = true;
                    themainentity = conceptualContainer.Where(x => x.FullName.Split('.')[x.FullName.Split('.').Length-1] == name.Split('.')[name.Split('.').Length-1]).FirstOrDefault();
                }
          
                IList<string> navnames = new List<string>(); 
                
                var thenaventities = themainentity.NavigationProperties;
                foreach (var nav in thenaventities)
                {
                    navnames.Add(nav.TypeUsage.EdmType.ToString());
                }

                var thenavs = conceptualContainer.Where(x => navnames.Contains(x.FullName));

                
                if (themainentity.BaseType != null)
                {
                    var thebasename = themainentity.BaseType.FullName;
                    var thebase = conceptualContainer.Where(x => x.FullName == thebasename).FirstOrDefault();
                    if (thebase != null)
                    {
                        listofent.Add(thebase);
                        
                    }
                }

                listofent.Add(themainentity);
                
                foreach (var y in thenavs)
                    listofent.Add(y);
              

            
            ReadOnlyCollection<EntityType> thelistofentities = new ReadOnlyCollection<EntityType>(listofent);
           
            // Storage part of the model has info about the shape of our tables
            var storeContainer = metadata.GetItems<EntityContainer>(DataSpace.SSpace).Single();
 
            // Object part of the model that contains info about the actual CLR types
            var objectItemCollection = ((ObjectItemCollection)metadata.GetItemCollection(DataSpace.OSpace));
 
            // Mapping part of model is not public, so we need to write to xml and use 'LINQ to XML'
            var edmx = GetEdmx(db);
            // Loop thru each entity type in the model: only base objects will be processed
            foreach (var set in thelistofentities)
            {
                 var typeMapping = new TypeMapping
                {
                    TableMappings = new List<TableMapping>()
                };
                this.TypeMappings.Add(typeMapping);
 
                // Get the CLR type of the entity
                if (!isdbfirst)
                typeMapping.EntityType = metadata
                    .GetItems<EntityType>(DataSpace.OSpace)
                    .Select(e => objectItemCollection.GetClrType(e))
                    .Single(e => e.FullName == set.FullName);
                else
                    typeMapping.EntityType = metadata
                    .GetItems<EntityType>(DataSpace.OSpace)
                    .Select(e => objectItemCollection.GetClrType(e))
                    .Single(e => e.FullName.Split('.').Last() == set.FullName.Split('.').Last());
                // Get the mapping fragments for this type
                // (types may have mutliple fragments if 'Entity Splitting' is used)
                IEnumerable<XElement> mappingFragments = null;
                if (!isdbfirst)
                mappingFragments = edmx
                    .Descendants()
                    .Single(e =>
                        e.Name.LocalName == "EntityTypeMapping"
                        && (e.Attribute("TypeName").Value == set.FullName || e.Attribute("TypeName").Value == "IsTypeOf("+set.FullName+")"))
                    .Descendants()
                    .Where(e => e.Name.LocalName == "MappingFragment");
                else
                    mappingFragments = edmx
                    .Descendants()
                    .Single(e =>
                        e.Name.LocalName == "EntityTypeMapping"
                        && (e.Attribute("TypeName").Value.Split('.').Last() == set.FullName.Split('.').Last()))
                    .Descendants()
                    .Where(e => e.Name.LocalName == "MappingFragment");
                foreach (var mapping in mappingFragments)
                {
                    var tableMapping = new TableMapping
                    {
                        PropertyMappings = new List<PropertyMapping>()
                    };
                    typeMapping.TableMappings.Add(tableMapping);
 
                    // Find the table that this fragment maps to
                    var storeset = mapping.Attribute("StoreEntitySet").Value;
                    tableMapping.TableName = (string)storeContainer
                        .BaseEntitySets.OfType<EntitySet>()
                        .Single(s => s.Name == storeset)
                        .MetadataProperties["Table"].Value;

                    if (isdbfirst)
                        tableMapping.TableName = (string)storeContainer
                        .BaseEntitySets.OfType<EntitySet>()
                        .Single(s => s.Name == storeset)
                        .MetadataProperties["Name"].Value;

                    tableMapping.SchemaName = (string)storeContainer
                       .BaseEntitySets.OfType<EntitySet>()
                       .Single(s => s.Name == storeset)
                       .MetadataProperties["Schema"].Value;

                    if (set.BaseType !=null)
                    {
                        tableMapping.BaseEntity = set.BaseType.FullName;
                        this.InheritingEntityTypes.Add(set.FullName);
                    }
 
                    // Find the property-to-column mappings
                    var propertyMappings = mapping
                        .Descendants()
                        .Where(e => e.Name.LocalName == "ScalarProperty");

                    var entitystorageinfo = from m in objectItemCollection where m.BuiltInTypeKind == BuiltInTypeKind.EntityType && m.ToString() == set.FullName select m.MetadataProperties;
                    //Get the PK column
                    string pkcolval = String.Empty;
                    foreach (var t in entitystorageinfo)
                    {
                        foreach (var x in t)
                        {
                            if (x.Name == "KeyMembers")
                            {
                                var enumerator = x.Value as IEnumerable;
                                foreach (var field in enumerator)
                                    pkcolval = field.ToString();
                            }
                        }
                    }
                    foreach (var propertyMapping in propertyMappings)
                    {
                        // Find the property and column being mapped
                        var propertyName = propertyMapping.Attribute("Name").Value;
                        var columnName = propertyMapping.Attribute("ColumnName").Value;


                        var columnstorageinfo = storeContainer
                        .BaseEntitySets.OfType<EntitySet>()
                        .Single(s => s.Name == storeset);

                        bool nullable = true;
                        int? maxlength = null;
                        string defaultvalue = null;
                        //find the column db constraints 
                        foreach (var c in columnstorageinfo.ElementType.Properties)
                        {
                            if (c.Name == columnName)
                            {
                                nullable = c.Nullable;
                                maxlength = c.MaxLength;
                                try
                                {
                                    defaultvalue = c.DefaultValue.ToString();
                                }
                                catch {
                                    defaultvalue = null;
                                }
                                break;
                            }
                        }
                       

                        tableMapping.PropertyMappings.Add(new PropertyMapping
                        {
                            isPrimary =  pkcolval == columnName, 
                            Property = typeMapping.EntityType.GetProperty(propertyName),
                            ColumnName = columnName,
                            maxlength = maxlength,
                            nullable = nullable,
                            defaultvalue = defaultvalue
                          });
                    }
                }
                
                //Loop over inherited objects
            }
            //FK management

         //   foreach (var set in thelistofentities)
              foreach (var nav in themainentity.NavigationProperties)
                {
                string relname = nav.RelationshipType.Name.ToString();
                string fromTable = String.Empty;
                string fromProperty = String.Empty;
                string toTable = String.Empty;
                string toProperty = String.Empty;
                

                var assocsets = storeContainer
                    .BaseEntitySets.OfType<AssociationSet>();
                foreach (var y in assocsets)
                {
                    if (y.Name == relname)
                    {
                        fromTable = y.ElementType.Constraint.FromRole.ToString();
                        fromProperty = y.ElementType.Constraint.FromProperties.FirstOrDefault().ToString();
                        toTable = y.ElementType.Constraint.ToRole.ToString();
                        toProperty = y.ElementType.Constraint.ToProperties.FirstOrDefault().ToString();
                        addforeignkeyinfo(this.TypeMappings, fromTable, fromProperty, toTable, toProperty, getFromTableTextField(fromTable,TypeMappings));
                    }
                }



            }

            foreach (var entity in this.InheritingEntityTypes)
            { 
                var theentity = this.TypeMappings.Where(t=>t.EntityType.FullName == entity).FirstOrDefault();
                var theparentenity = theentity.TableMappings[0].BaseEntity;
                var theparent = this.TypeMappings.Where(t => t.EntityType.FullName == theparentenity).FirstOrDefault();
                TableMapping newt = new TableMapping();
                newt = theparent.TableMappings[0];
                theentity.TableMappings.Add(newt);
            }
        }

        
 
        private static XDocument GetEdmx(DbContext db)
        {
            XDocument doc;

            try
            {
                //Code First Scenario
                using (var memoryStream = new MemoryStream())
                {
                    using (var xmlWriter = XmlWriter.Create(
                        memoryStream, new XmlWriterSettings
                        {
                            Indent = true
                        }))
                    {
                        EdmxWriter.WriteEdmx(db, xmlWriter);
                    }

                    memoryStream.Position = 0;
                    doc = XDocument.Load(memoryStream);
                }
            }
            catch (Exception ) 
            {
                //TODO: look at the exception and detect DataBase First scenario
                //i assume it crashes cause it's a db first scenario

                XmlDocument edmxFile = new XmlDocument();
                edmxFile.Load(@"C:\PROJECTS\MagicSolution\Data\Model1.edmx");
                using (var nodeReader = new XmlNodeReader(edmxFile))
                {
                    nodeReader.MoveToContent();
                    doc = XDocument.Load(nodeReader);
                }
            }
            return doc;
        }

       

     }
    }


    
}