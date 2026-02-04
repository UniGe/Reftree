using MagicFramework.Models;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Reflection;
using System.Text.RegularExpressions;
using System.Web;

namespace MagicFramework.Helpers
{
    public class RequestParser
    {
        private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
        public Models.Request req { get; set; }
        public dynamic DataModel { get; set; }
        public Dictionary<string, string> dBTypesDefaults = new Dictionary<string, string>();

        public RequestParser(Models.Request req)
        {
            this.req = req;
            //loads from cache customJSONParam, entityName and model
            if (!String.IsNullOrEmpty(req.GridName))
                this.enrichGridRequests();
            //tipi di cui devo specificare la dimensione nei casi di xmlfield.value()
            dBTypesDefaults.Add("varchar", "varchar(max)");
            dBTypesDefaults.Add("nvarchar", "nvarchar(max)");
            dBTypesDefaults.Add("char", "char(max)");
            dBTypesDefaults.Add("nchar", "nchar(max)");
            dBTypesDefaults.Add("decimal", "decimal(18,10)");
        }
        /// <summary>
        /// Used to check sql injections from api get (closed parenthesis without matching open parenthesis)
        /// </summary>
        /// <param name="where">the api where parameter</param>
        public static void CheckWhereConditionFromClient(string where)
        {
            List<char> previousParenthesis = new List<char>();
            if (!String.IsNullOrEmpty(where) && !String.IsNullOrWhiteSpace(where))
            {
                foreach (char c in where)
                {
                    char lastparenthesis = previousParenthesis.Count > 0 ? previousParenthesis.Last() : '|';
                    if (c == ')' && lastparenthesis != '(')
                        throw new System.ArgumentException("Invalid where condition");
                    else
                        if (c == ')' && lastparenthesis == '(')
                        previousParenthesis.RemoveAt(previousParenthesis.Count - 1);
                    else
                            if (c == '(')
                        previousParenthesis.Add('(');
                }
            }
        }
        public String BuildGroupCondition()
        {
            string groupby = String.Empty;

            // parse request order parameters 
            if (req.group != null && req.group.Count > 0)
            {
                List<string> groups = new List<string>();
                req.group.ForEach(x =>
                {
                    string fieldplaceholder = x.field;
                    ModelFieldInfo fieldmodelinfo = extractFieldInfoFromModel(x.field,this.req.GridName);
                    if (fieldmodelinfo != null)
                    {
                        if (fieldmodelinfo.isxml)
                            fieldplaceholder = buildXMLColumnSyntax(fieldmodelinfo.containerColumn, fieldmodelinfo.databasetype, x.field);
                        else if (fieldmodelinfo.databasetype.ToLower().Equals("xml"))
                            fieldplaceholder = buildXmlFieldSyntax(x.field);
                    }

                    groups.Add(string.Format("{0}", fieldplaceholder));
                });

                groupby = string.Join(",", groups.ToArray());
            }


            return groupby;

        }
        public String BuildOrderCondition()
        {

            string order = String.Empty;

            // parse request order parameters 
            if (req.sort != null && req.sort.Count > 0)
            {
                List<string> sorts = new List<string>();
                req.sort.ForEach(x =>
                {
                    string fieldplaceholder;
                    if (MFConfiguration.InstanceSettings().SQLEscapeClientInput)
                    {
                        fieldplaceholder = GetField(x.field);
                    }
                    else
                    {
                        fieldplaceholder = x.field;
                    }
                    ModelFieldInfo fieldmodelinfo = extractFieldInfoFromModel(x.field,req.GridName);
                    if (fieldmodelinfo != null)
                    {
                        if (fieldmodelinfo.isxml)
                            fieldplaceholder = buildXMLColumnSyntax(fieldmodelinfo.containerColumn, fieldmodelinfo.databasetype, x.field);
                        else if (fieldmodelinfo.databasetype.ToLower().Equals("xml"))
                            fieldplaceholder = buildXmlFieldSyntax(x.field);
                    }

                    sorts.Add(string.Format("{0} {1}", fieldplaceholder, GetSortDirection(x.dir)));
                });

                order = string.Join(",", sorts.ToArray());
            }

            return order;
        }
        /// <summary>
        /// Build order condition without escaping (EF does not need it) 
        /// </summary>
        /// <returns></returns>
        public String BuildOrderConditionForEF()
        {

            string order = String.Empty;

            // parse request order parameters 
            if (req.sort != null && req.sort.Count > 0)
            {
                List<string> sorts = new List<string>();
                req.sort.ForEach(x =>
                {
                    string fieldplaceholder;
                    fieldplaceholder = GetField(x.field);
                    fieldplaceholder = x.field;
                    
                    ModelFieldInfo fieldmodelinfo = extractFieldInfoFromModel(x.field,req.GridName);
                    if (fieldmodelinfo != null)
                    {
                        if (fieldmodelinfo.isxml)
                            fieldplaceholder = buildXMLColumnSyntax(fieldmodelinfo.containerColumn, fieldmodelinfo.databasetype, x.field);
                        else if (fieldmodelinfo.databasetype.ToLower().Equals("xml"))
                            fieldplaceholder = buildXmlFieldSyntax(x.field);
                    }

                    sorts.Add(string.Format("{0} {1}", fieldplaceholder, GetSortDirection(x.dir)));
                });

                order = string.Join(",", sorts.ToArray());
            }

            return order;
        }
        /// <summary>
        /// Look up for parts of the condition which are outside the '' with forbidden names 
        /// </summary>
        /// <param name="wherecondition"></param>
        /// <returns></returns>
        public static bool checkWhereConditionForSQLInjectionReservedWords(string wherecondition)
        {

            Regex r = new Regex("\'(.*?)\'");
            //check all the parts which are not string values in the where condition
            string whereconditionlower = wherecondition.ToLower();
            whereconditionlower = r.Replace(whereconditionlower, "");

            if (whereconditionlower.Contains(" delete ") || whereconditionlower.Replace(" ", "").Contains(";delete")
                || whereconditionlower.Contains(" select ") || whereconditionlower.Replace(" ", "").Contains(";select")
                || whereconditionlower.Contains(" update ") || whereconditionlower.Replace(" ", "").Contains(";update")
                || whereconditionlower.Contains(" insert ") || whereconditionlower.Replace(" ", "").Contains(";insert")
                || whereconditionlower.Contains(" truncate ") || whereconditionlower.Replace(" ", "").Contains(";truncate")
                || whereconditionlower.Contains(" alter ") || whereconditionlower.Replace(" ", "").Contains(";alter")
                || whereconditionlower.Contains(" create ") || whereconditionlower.Replace(" ", "").Contains(";create")
                || whereconditionlower.Contains(" drop ") || whereconditionlower.Replace(" ", "").Contains(";drop")
                || whereconditionlower.Contains(" exec ") || whereconditionlower.Replace(" ", "").Contains(";exec")
                || whereconditionlower.Contains(" execute ") || whereconditionlower.Replace(" ", "").Contains(";execute")
                || whereconditionlower.Contains(" union ")
                || whereconditionlower.Replace(" ", "").Contains("/*") //D.T Aizoon SQL Injection using comments...
                || whereconditionlower.Replace(" ", "").Contains("*/")
                || whereconditionlower.Replace(" ", "").Contains("--")
               )
                return true;

            return false;
        }
        //A seconda dell' override cambia il metodo ricorsivo richiamato (vedi commenti della recurinfilters).Richiedono presenza di Object Model 
        public String BuildWhereCondition(Type entityType)
        {
            var filter = req.filter;
            string wherecondition = String.Empty;
            if (!(filter.filters == null && filter.Operator == null && filter.value == null))
                wherecondition += recurinfilters(entityType, filter);
            else
                wherecondition = "1=1";
            wherecondition += BuildDocumentSearchWhereCondition();

            if (checkWhereConditionForSQLInjectionReservedWords(wherecondition))
                throw new System.ArgumentException("Illegal Sql Injected");

            return wherecondition;
        }

        public String BuildWhereCondition(Type entityType, string property)
        {
            var filter = req.filter;
            string wherecondition = String.Empty;
            wherecondition += recurinfilters(entityType, filter, property);
            wherecondition += BuildDocumentSearchWhereCondition();
            if (checkWhereConditionForSQLInjectionReservedWords(wherecondition))
                throw new System.ArgumentException("Illegal Sql Injected");
            return wherecondition;
        }
        public String BuildWhereCondition(Type entityType, bool tsqlsyntax)
        {
            var filter = req.filter;
            string wherecondition = String.Empty;
            wherecondition += recurinfilters(entityType, filter, tsqlsyntax);
            wherecondition += BuildDocumentSearchWhereCondition();
            if (checkWhereConditionForSQLInjectionReservedWords(wherecondition))
                throw new System.ArgumentException("Illegal Sql Injected");
            return wherecondition;
        }
        /// <summary>
        /// Costruzione della where deducendo i tipi dei campi dal filtro stesso. Non richiede l' object model per funzionare
        /// </summary>
        /// <param name="tsqlsyntax"></param>
        /// <returns></returns>
        public String BuildWhereCondition(bool tsqlsyntax)
        {
            var filter = req.filter;
            string wherecondition = String.Empty;
            wherecondition += recurinfilters(filter, tsqlsyntax);
            wherecondition += BuildDocumentSearchWhereCondition();
            return wherecondition;
        }

        public String BuildDocumentSearchWhereCondition()
        {
            if (ApplicationSettingsManager.getMSSQLFileTable() && req.DocumentSearch != null && req.DocumentSearch.Count() > 0)
            {
                bool hasDocumentSearch = false;
                List<string> conditions = new List<string>();
                foreach (KeyValuePair<string, MagicFramework.Models.DocumentSearch> search in req.DocumentSearch)
                {
                    if (!string.IsNullOrEmpty(search.Value.SearchText))
                    {
                        hasDocumentSearch = true;
                        var docsQuery = new Sql.DBQuery("SELECT name FROM dbo.Magic_DocumentStore");
                        docsQuery.AddWhereCondition("FREETEXT (file_stream, @searchText)", search.Value.SearchText);
                        if (!string.IsNullOrEmpty(search.Value.SavePath))
                            docsQuery.AddWhereCondition("file_stream.GetFileNamespacePath(1) LIKE FileTableRootPath('dbo.Magic_DocumentStore') + @savePath", "\\" + MagicFramework.Controllers.MAGIC_SAVEFILEController.SanitizeDirectory(search.Value.SavePath) + "\\%");
                        System.Data.DataTable documents = docsQuery.Execute();

                        if (documents != null && documents.Rows.Count > 0)
                        {
                            foreach (System.Data.DataRow document in documents.Rows)
                                conditions.Add(String.Format("{0} LIKE '%{1}%'", search.Key, document["name"]));
                        }
                    }
                }

                //files found
                if (conditions.Count > 0)
                    return " AND (" + String.Join(" OR ", conditions) + ")";
                //no files found, but hasDocumentSearch, so add breaking condition to get empty result
                else if (hasDocumentSearch)
                    return " AND 1=2";
            }

            return "";
        }

        //Questo override estrae dal filtro una ben precisa proprieta'
        public string recurinfilters(Type entityType, Models.Filters filter, string propertytoget)
        {
            string retvalue = String.Empty;
            castToFilterArray(filter);
            // parse request filter parameters 
            if (filter != null && filter.filters.Count > 0)
            {
                List<string> filters = new List<string>();
                filter.filters.ForEach(x =>
                {
                    if (x.filters != null)
                    {
                        filters.Add(recurinfilters(entityType, x, propertytoget));
                        var filtersclear = filters.Where(y => y != "");
                        retvalue += string.Join(",", filtersclear.ToArray());
                    }
                    else
                    {
                        if ((x.field != null) && (x.field == propertytoget))
                        {
                            var property = entityType.GetProperty(x.field);
                            if ((typeof(int).IsAssignableFrom(property.PropertyType)) || (typeof(int?).IsAssignableFrom(property.PropertyType)))
                                filters.Add(int.Parse(x.value).ToString());

                            if ((typeof(decimal?).IsAssignableFrom(property.PropertyType)) || (typeof(decimal).IsAssignableFrom(property.PropertyType)))
                            {
                                var cultureinfo = CultureInfo.CreateSpecificCulture("en-GB");
                                decimal number;
                                NumberStyles style = NumberStyles.AllowDecimalPoint | NumberStyles.AllowThousands;
                                Decimal.TryParse(x.value, style, cultureinfo, out number);
                                filters.Add(number.ToString());
                            }

                            if ((typeof(bool).IsAssignableFrom(property.PropertyType)) || (typeof(bool?).IsAssignableFrom(property.PropertyType)))
                                filters.Add(x.value.ToString());


                            if (typeof(String).IsAssignableFrom(property.PropertyType))
                            {
                                filters.Add(x.value.ToString());

                            }
                            if ((typeof(DateTime?).IsAssignableFrom(property.PropertyType)) || (typeof(DateTime).IsAssignableFrom(property.PropertyType)))
                                filters.Add(x.value.ToString());
                        }
                    }
                });

                retvalue = string.Join(",", filters.Where(j => j != "").ToArray());
            }
            return retvalue;
        }
        //Questo override restituisce la where da appendere a LINQ
        public String recurinfilters(Type entityType, Models.Filters filter)
        {
            string wherecondition = String.Empty;
            String oplogic = filter.logic;
            castToFilterArray(filter);
            // parse request filter parameters 
            if (filter != null && filter.filters.Count > 0)
            {
                List<string> filters = new List<string>();
                filter.filters.ForEach(x =>
                {
                    if (x.filters != null)
                    {
                        filters.Add("(" + recurinfilters(entityType, x) + ")");
                        wherecondition += string.Join(" " + oplogic + " ", filters.ToArray());
                    }
                    else
                    {
                        if (x.field != null)
                        {
                            var property = entityType.GetProperty(x.field);
                            if (x.value == null || x.Operator.Contains("null"))
                            {
                                filters.Add(string.Format("{0} {1} {2}", x.field, this.SolveNullOperator(x.Operator), "NULL"));
                            }
                            else
                            if (typeof(int?).IsAssignableFrom(property.PropertyType) || (typeof(decimal?).IsAssignableFrom(property.PropertyType)))
                            {
                              //manage UI boolean which is an integer model side
                              if (x.value == null || x.value == "N/A")
                                    filters.Add(string.Format("{0} {1} {2}", x.field, this.SolveNullOperator(x.Operator), "NULL"));
                                else
                                    if (x.value.ToUpper() == "TRUE")
                                    filters.Add(string.Format("{0} {1}({2})", x.field, this.SolveOperatorNumericAndDate(x.Operator), 1));
                                else
                                        if (x.value.ToUpper() == "FALSE")
                                    filters.Add(string.Format("{0} {1}({2})", x.field, this.SolveOperatorNumericAndDate(x.Operator), 0));
                                else
                                    filters.Add(string.Format("{0} {1}({2})", x.field, this.SolveOperatorNumericAndDate(x.Operator), int.Parse(x.value)));

                            }
                            else if (typeof(decimal).IsAssignableFrom(property.PropertyType))
                            {
                                var cultureinfo = CultureInfo.CreateSpecificCulture("en-GB");
                                decimal number;
                                NumberStyles style = NumberStyles.AllowDecimalPoint | NumberStyles.AllowThousands;
                                Decimal.TryParse(x.value, style, cultureinfo, out number);
                                filters.Add(string.Format("{0} {1}({2})", x.field, this.SolveOperatorNumericAndDate(x.Operator), number));
                            }

                            else if ((typeof(bool).IsAssignableFrom(property.PropertyType)) || (typeof(bool?).IsAssignableFrom(property.PropertyType)))
                                filters.Add(string.Format("{0} {1}({2})", x.field, this.SolveOperatorNumericAndDate(x.Operator), x.value));


                            else if (typeof(String).IsAssignableFrom(property.PropertyType))
                            {
                                if (this.SolveOperatorString(x.Operator) == "NotEquals")
                                    filters.Add(string.Format("{0} != (\"{2}\")", x.field, this.SolveOperatorString(x.Operator), x.value.ToString()));
                                else filters.Add(string.Format("{0}.{1} (\"{2}\")", x.field, this.SolveOperatorString(x.Operator), x.value.ToString()));

                            }
                            else if ((typeof(DateTime?).IsAssignableFrom(property.PropertyType)) || (typeof(DateTime).IsAssignableFrom(property.PropertyType)))
                            {
                                DateTime dt = DateTime.Parse(x.value);
                                String Operator = this.SolveOperatorNumericAndDate(x.Operator);

                              //DateTime(dt.Year, dt.Month, dt.Day); e' il formato da passare per le date
                              if (Operator.Equals(" == "))
                                {
                                    filters.Add(string.Format("({0} >= DateTime({1},{2},{3},00,00,00) and {0} <= DateTime({1},{2},{3},23,59,59))", x.field, dt.Year.ToString(), dt.Month.ToString(), dt.Day.ToString()));
                                }
                                else
                                {
                                    String time = Operator.Equals(" <= ") || Operator.Equals(" > ") ? "23,59,59" : "00,00,00";
                                    filters.Add(string.Format("{0} {1} DateTime({2},{3},{4},{5})", x.field, Operator, dt.Year.ToString(), dt.Month.ToString(), dt.Day.ToString(), time));
                                }
                            }


                        }
                    }
                });

                wherecondition = string.Join(" " + oplogic + " ", filters.ToArray());
            }

            return wherecondition;
        }
        /// <summary>
        /// When the object does not expose a model i populate the type variable using reflection
        /// </summary>
        /// <param name="type">the type from the model</param>
        /// <param name="property">the reflected propertyInfo</param>
        /// <returns></returns>
        private string defaultTypeWhenNumber(string type, PropertyInfo property)
        {
            if (String.IsNullOrEmpty(type) && ((typeof(int).IsAssignableFrom(property.PropertyType)) || (typeof(int?).IsAssignableFrom(property.PropertyType))))
                return "number";
            return type;
        }

        //questo override fornisce una where che puo' essere usata direttamente in SQL Server o Oracle e altri db 
        public String recurinfilters(Type entityType, Models.Filters filter, bool tsqlsyntax)
        {
            string wherecondition = String.Empty;
            String oplogic = filter.logic;
            castToFilterArray(filter);
            // parse request filter parameters 
            if (filter != null && filter.filters.Count > 0)
            {
                List<string> filters = new List<string>();
                filter.filters.ForEach(x =>
                {
                    if (x.filters != null)
                    {
                        filters.Add("(" + recurinfilters(entityType, x, true) + ")");
                        wherecondition += string.Join(" " + oplogic + " ", filters.ToArray());
                    }
                    else
                    {
                        if (x.field != null)
                        {
                            var property = entityType.GetProperty(x.field);
                            var modelinfo = extractFieldInfoFromModel(x.field,req.GridName);

                            string type = String.Empty;

                            if (modelinfo != null)
                                type = modelinfo.type == null ? "string" : modelinfo.type;
                            //default numbers when model is null (e.g. in calendar)
                            type = defaultTypeWhenNumber(type, property);

                            if (x.Operator.Contains("null"))
                            {
                                if (x.Operator == "isnull")
                                    filters.Add(string.Format("{0} IS NULL", x.field));
                                else
                                    filters.Add(string.Format("{0} IS NOT NULL", x.field));
                            }
                            else
                            {
                                if (((typeof(int).IsAssignableFrom(property.PropertyType)) || (typeof(int?).IsAssignableFrom(property.PropertyType))) && (type == "number" || type == null))
                                    if (x.Operator == "eq")
                                    {
                                        if (x.value == null)
                                            filters.Add(string.Format("{0} IS NULL", x.field));
                                        else
                                            filters.Add(string.Format("{0} = ({2})", x.field, null, int.Parse(x.value)));
                                    }
                                    else
                                        filters.Add(string.Format("{0} {1}({2})", x.field, this.SolveOperatorNumericAndDate(x.Operator), int.Parse(x.value)));

                                if (((typeof(decimal?).IsAssignableFrom(property.PropertyType)) || (typeof(decimal).IsAssignableFrom(property.PropertyType))) && (type == "number" || type == null))
                                {
                                    var cultureinfo = CultureInfo.CreateSpecificCulture("en-GB");
                                    decimal number;
                                    NumberStyles style = NumberStyles.AllowDecimalPoint | NumberStyles.AllowThousands;
                                    Decimal.TryParse(x.value, style, cultureinfo, out number);
                                    if (x.Operator == "eq")
                                        filters.Add(string.Format("{0} = ({2})", x.field, null, number));
                                    else
                                        filters.Add(string.Format("{0} {1}({2})", x.field, this.SolveOperatorNumericAndDate(x.Operator), number));
                                }

                                if ((typeof(bool).IsAssignableFrom(property.PropertyType)) || (typeof(bool?).IsAssignableFrom(property.PropertyType)))
                                    filters.Add(string.Format("{0} = {2}", x.field, null, x.value == "True" ? 1 : 0));


                                if (typeof(String).IsAssignableFrom(property.PropertyType))
                                {
                                    if (x.Operator == "neq")
                                        filters.Add(string.Format("{0} <> ('{2}')", x.field, null, x.value.ToString()));
                                    if (x.Operator == "eq")
                                        filters.Add(string.Format("{0} = ('{2}')", x.field, null, x.value.ToString()));
                                    if (x.Operator == "contains")
                                        filters.Add(string.Format("{0} like ('%{2}%')", x.field, null, x.value.ToString()));
                                    if (x.Operator == "doesnotcontain")
                                        filters.Add(string.Format("{0} not like ('%{2}%')", x.field, null, x.value.ToString()));
                                    if (x.Operator == "startswith")
                                        filters.Add(string.Format("{0}  like ('{2}%')", x.field, null, x.value.ToString()));
                                    if (x.Operator == "endswith")
                                        filters.Add(string.Format("{0}  like ('%{2}')", x.field, null, x.value.ToString()));


                                }
                                if ((typeof(DateTime?).IsAssignableFrom(property.PropertyType)) || (typeof(DateTime).IsAssignableFrom(property.PropertyType)))
                                    filters.Add(this.generateDateSqlFilter(x.value, x.Operator, x.field));
                                //filters.Add(string.Format("{0} {1} ('{2}')", x.field, this.SolveOperatorNumericAndDate(x.Operator), x.value));
                            }
                        }
                    }
                });

                wherecondition = string.Join(" " + oplogic + " ", filters.ToArray());
            }
            return wherecondition;
        }
        public String buildXMLColumnSyntax(string ContainerColumn, string databasetypetoken, string field)
        {
            //clienti_xml.value('(/ROOT/COMUNE)[1]', 'varchar(200)' )
            //TODO integrare il caso ORACLE 
            if (MFConfiguration.InstanceSettings().SQLEscapeClientInput)
            {
                return GetField(ContainerColumn) + ".value('(/" + ContainerColumn + "/" + field + ")[1]','" + databasetypetoken + "')";
            }
            return ContainerColumn + ".value('(/" + ContainerColumn + "/" + field + ")[1]','" + databasetypetoken + "')";
        }

        private string buildXmlFieldSyntax(string field)
        {
            //TODO integrare il caso ORACLE 
            if (MFConfiguration.InstanceSettings().SQLEscapeClientInput)
            {
                return GetField(field) + ".value('.','varchar(max)')";
            }
            return field + ".value('.','varchar(max)')";
        }

        public class ModelFieldInfo
        {
            public bool isxml { get; set; }
            public string type { get; set; }
            public string databasetype { get; set; }
            public string containerColumn { get; set; }
            public ModelFieldInfo(bool isxml, string type, string databasetype, string containerColumn)
            {
                this.isxml = isxml;
                this.type = type;
                this.databasetype = databasetype;
                this.containerColumn = containerColumn;
            }
        }
        public ModelFieldInfo extractFieldInfoFromModel(string field,string gridName)
        {
            bool isxml = false;
            //dynamic modeldata = Newtonsoft.Json.JsonConvert.DeserializeObject<object>(model);
            dynamic modeldata = this.DataModel;
            if (modeldata == null)
                return null;
            var fieldmodelinfo = modeldata[0].fields[field];
            if (fieldmodelinfo == null)
            {
                //look in xml fields definition 
                fieldmodelinfo = Magic_Grids.GetXmlFieldDefinitionFromModel(modeldata[0], field, gridName);
                if (fieldmodelinfo == null)
                    return null;
            }
            string containerColumn = null;
            if (fieldmodelinfo.containerColumn != null) //questa column e' parte di una colonna di tipo XML
            {
                containerColumn = fieldmodelinfo.containerColumn.ToString();
                isxml = true;
            }
            string type = fieldmodelinfo.type; //schema type
            string databasetypetoken = fieldmodelinfo.databasetype;
            if (databasetypetoken != null)
                if (this.dBTypesDefaults.ContainsKey(databasetypetoken))
                    databasetypetoken = this.dBTypesDefaults[databasetypetoken];
            return new ModelFieldInfo(isxml, type, databasetypetoken, containerColumn);
        }
        private void castToFilterArray(Models.Filters filter)
        {
            if (filter != null && filter.filters == null)
            {
                filter.logic = "AND";
                filter.filters = new List<Models.Filters>();
                filter.filters.Add(new Models.Filters());
                filter.filters[0].field = filter.field;
                filter.filters[0].Operator = filter.Operator;
                filter.filters[0].value = filter.value;

            }
        }

        public static string GetLogic(string userInput)
        {
            if (userInput != null && userInput.ToLower().Contains("or"))
            {
                return "OR";
            }
            return "AND";
        }

        public static string GetSortDirection(string userInput)
        {
            if (userInput != null && userInput.ToLower().Contains("desc"))
            {
                return "DESC";
            }
            return "ASC";
        }

        public static string GetField(string userInput)
        {
            string[] segments = userInput.Split('.');
            string field = "";
            foreach (string s in segments)
            {
                string escaped = s
                    .Replace("[", "")
                    .Replace("]", "");
                field += "[" + escaped + "].";
            }
            return field.TrimEnd('.');
        }

        public static string GetValue(string userInput)
        {
            return userInput.Replace("'", "''");
        }

        public static string GetAggregationFunction(string userInput)
        {
            switch (userInput?.ToUpper())
            {
                case "APPROX_COUNT_DISTINCT":
                case "AVG":
                case "CHECKSUM_AGG":
                case "COUNT":
                case "COUNT_BIG":
                case "GROUPING":
                case "GROUPING_ID":
                case "MAX":
                case "MIN":
                case "STDEV":
                case "STDEVP":
                case "STRING_AGG":
                case "SUM":
                case "VAR":
                case "VARP":
                    return userInput;
                default:
                    return "COUNT";
            }
        }

        public static Aggregations[] SanitizeAggregations(Aggregations[] aggregations)
        {
            return aggregations?.Select((Aggregations a) =>
            {
                a.column = GetField(a.column);
                a.functions = a.functions?.Select(f => GetAggregationFunction(f)).ToArray();
                return a;
            }).ToArray();
        }

        //questo override fornisce una where che puo' essere usata direttamente in SQL Server o Oracle e altri db 
        public String recurinfilters(Models.Filters filter, bool tsqlsyntax)
        {
            string wherecondition = String.Empty;
            String oplogic = GetLogic(filter.logic);
            // parse request filter parameters 
            castToFilterArray(filter);
            if (filter != null && filter.filters.Count > 0)
            {
                List<string> filters = new List<string>();
                filter.filters.ForEach(x =>
                {
                    if (x.filters != null)
                    {
                        filters.Add("(" + recurinfilters(x, true) + ")");
                        wherecondition += string.Join(" " + oplogic + " ", filters.ToArray());
                    }
                    else
                    {
                        if (x.field != null)
                        {
                            string fieldplaceholder = x.field;
                            var type = String.Empty;
                            //Ottengo l' oggetto corrispondente al Modello della Grid in modo da sapere i type e se sono campi XML (TODO capire se gestire altri formati complessi in futuro) 
                            ModelFieldInfo fieldmodelinfo = extractFieldInfoFromModel(x.field,req.GridName);
                            if (fieldmodelinfo == null && this.DataModel != null)
                                throw new System.ArgumentException("Detected condition for non existing field. eg. 1=1 case");
                            if (fieldmodelinfo != null)
                            {
                                type = String.IsNullOrEmpty(fieldmodelinfo.type) ? "string" : fieldmodelinfo.type;
                                if (fieldmodelinfo.isxml)
                                    fieldplaceholder = buildXMLColumnSyntax(fieldmodelinfo.containerColumn, fieldmodelinfo.databasetype, x.field);
                                else if (fieldmodelinfo.databasetype.ToLower().Equals("xml"))
                                    fieldplaceholder = buildXmlFieldSyntax(x.field);
                                else
                                {
                                    fieldplaceholder = GetField(fieldplaceholder);
                                }
                            }
                            else
                            {
                                fieldplaceholder = GetField(fieldplaceholder);
                            }
                            if (x.value == null || x.Operator.Contains("null"))
                            {

                                if (x.Operator == "eq" || x.Operator == "isnull")
                                    filters.Add(string.Format("{0} is null", fieldplaceholder));
                                else
                                    filters.Add(string.Format("{0} is not null", fieldplaceholder));
                            }
                            else
                            {
                                string escapedValue = GetValue(x.value); //escape ' char
                                switch (x.Operator)
                                {

                                    case "contains":
                                        filters.Add(string.Format("{0} like ('%{2}%')", fieldplaceholder, null, escapedValue));
                                        break;
                                    case "doesnotcontain":
                                        filters.Add(string.Format("{0} not like ('%{2}%')", fieldplaceholder, null, escapedValue));
                                        break;
                                    case "startswith":
                                        filters.Add(string.Format("{0} like ('{2}%')", fieldplaceholder, null, escapedValue));
                                        break;
                                    case "endswith":
                                        filters.Add(string.Format("{0} like ('%{2}')", fieldplaceholder, null, escapedValue));
                                        break;
                                    default:
                                        decimal decimaltest = 0;
                                        long integerTest = 0;
                                        bool booltest = false;
                                        DateTime datetimetest;
                                        if (Decimal.TryParse(x.value, out decimaltest) && type == "number")
                                        {
                                            var cultureinfo = CultureInfo.CreateSpecificCulture("en-GB");
                                            decimal number;
                                            NumberStyles style = NumberStyles.Number;
                                            Decimal.TryParse(x.value, style, cultureinfo, out number);
                                            if (x.Operator == "eq")
                                                filters.Add(string.Format("{0} = ({2})", fieldplaceholder, null, number.ToString().Replace(",", ".")));
                                            else
                                                filters.Add(string.Format("{0} {1}({2})", fieldplaceholder, this.SolveOperatorNumericAndDateSQL(x.Operator), number.ToString().Replace(",", ".")));
                                        }
                                        else if (long.TryParse(x.value, out integerTest) && type == "number")
                                        {
                                            if (x.Operator == "eq")
                                                filters.Add(string.Format("{0} = ({2})", fieldplaceholder, null, int.Parse(x.value)));
                                            else
                                                filters.Add(string.Format("{0} {1}({2})", fieldplaceholder, this.SolveOperatorNumericAndDateSQL(x.Operator), int.Parse(x.value)));
                                        }
                                        else if (Boolean.TryParse(x.value, out booltest))
                                        {
                                            if (x.Operator == "neq")
                                                filters.Add(string.Format("{0} <> {2}", fieldplaceholder, null, x.value.ToLower() == "true" ? 1 : 0));
                                            else
                                                filters.Add(string.Format("{0} = {2}", fieldplaceholder, null, x.value.ToLower() == "true" ? 1 : 0));
                                        }
                                        else if (DateTime.TryParse(x.value, out datetimetest) && type=="date")
                                        {
                                            filters.Add(this.generateDateSqlFilter(x.value, x.Operator, fieldplaceholder));
                                        }
                                        else
                                        {

                                            filters.Add(String.Format("{0} {1} ('{2}')", fieldplaceholder, SolveOperatorNumericAndDateSQL(x.Operator), escapedValue));
                                        }
                                        break;
                                }
                            }
                        }
                    }
                });
                wherecondition = string.Join(" " + oplogic + " ", filters.ToArray().Distinct());
            }
            return wherecondition;
        }
        private string generateDateSqlFilter(string Value, string op, string field)
        {
            DateTime dt = DateTime.Parse(Value);
            string valueAsISO = dt.ToString("yyyyMMdd"); //was dt.ToString("yyyy-MM-dd")
            String Operator = this.SolveOperatorNumericAndDate(op);
            String filter = string.Empty;

            if (Operator.Equals(" == "))
            {
                filter = string.Format("({0} >= '{1} 00:00:00' AND {0} <= '{1} 23:59:59')", field, valueAsISO);
            }
            else if (Operator.Equals(" != "))
            {
                filter = string.Format("({0} < '{1} 00:00:00' OR {0} > '{1} 23:59:59' OR {0} is NULL)", field, valueAsISO);
            }
            else
            {
                String time = Operator.Equals(" <= ") || Operator.Equals(" > ") ? "23:59:59" : "00:00:00";
                filter = string.Format("{0} {1} '{2} {3}'", field, Operator, valueAsISO, time);
            }

            return filter;
        }

        // list of linq managed operators
        public enum StringFilterOperations
        {
            Equals,
            NotEquals,
            Greater,
            GreaterOrEquals,
            LessThan,
            LessThanOrEquals,
            StartsWith,
            EndsWith,
            Contains,
            NotContains,
        }
        private string SolveNullOperator(string theOperator)
        {
            switch (theOperator)
            {
                //equal ==
                case "isnull":
                case "eq":
                case "==":
                case "isequalto":
                case "equals":
                case "equalto":
                case "equal":
                    return " = ";
                //not equal !=
                case "isnotnull":
                case "neq":
                case "!=":
                case "isnotequalto":
                case "notequals":
                case "notequalto":
                case "notequal":
                case "ne":
                    return " != ";
                default:
                    return " IS ";
            }
        }

        public string SolveOperatorNumericAndDate(string theOperator)
        {
            switch (theOperator)
            {
                //equal ==
                case "eq":
                case "==":
                case "isequalto":
                case "equals":
                case "equalto":
                case "equal":
                    return " == ";
                //not equal !=
                case "neq":
                case "!=":
                case "isnotequalto":
                case "notequals":
                case "notequalto":
                case "notequal":
                case "ne":
                    return " != ";
                // Greater
                case "gt":
                case ">":
                case "isgreaterthan":
                case "greaterthan":
                case "greater":
                    return " > ";
                // Greater or equal
                case "gte":
                case ">=":
                case "isgreaterthanorequalto":
                case "greaterthanequal":
                case "ge":
                    return " >= ";
                // Less
                case "lt":
                case "<":
                case "islessthan":
                case "lessthan":
                case "less":
                    return " < ";
                // Less or equal
                case "lte":
                case "<=":
                case "islessthanorequalto":
                case "lessthanequal":
                case "le":
                    return " <= ";
                default:
                    return " == ";

            }
        }
        public string SolveOperatorNumericAndDateSQL(string theOperator)
        {
            switch (theOperator)
            {
                //equal ==
                case "eq":
                case "==":
                case "isequalto":
                case "equals":
                case "equalto":
                case "equal":
                    return " = ";
                //not equal !=
                case "neq":
                case "!=":
                case "isnotequalto":
                case "notequals":
                case "notequalto":
                case "notequal":
                case "ne":
                    return " <> ";
                // Greater
                case "gt":
                case ">":
                case "isgreaterthan":
                case "greaterthan":
                case "greater":
                    return " > ";
                // Greater or equal
                case "gte":
                case ">=":
                case "isgreaterthanorequalto":
                case "greaterthanequal":
                case "ge":
                    return " >= ";
                // Less
                case "lt":
                case "<":
                case "islessthan":
                case "lessthan":
                case "less":
                    return " < ";
                // Less or equal
                case "lte":
                case "<=":
                case "islessthanorequalto":
                case "lessthanequal":
                case "le":
                    return " <= ";
                default:
                    return " = ";

            }
        }
        public String SolveOperatorString(string theOperator)
        {
            switch (theOperator)
            {
                //equal ==
                case "eq":
                case "==":
                case "isequalto":
                case "equals":
                case "equalto":
                case "equal":
                    return StringFilterOperations.Equals.ToString();
                //not equal !=
                case "neq":
                case "!=":
                case "isnotequalto":
                case "notequals":
                case "notequalto":
                case "notequal":
                case "ne":
                    return StringFilterOperations.NotEquals.ToString(); ;
                // Greater
                case "gt":
                case ">":
                case "isgreaterthan":
                case "greaterthan":
                case "greater":
                    return StringFilterOperations.Greater.ToString();
                // Greater or equal
                case "gte":
                case ">=":
                case "isgreaterthanorequalto":
                case "greaterthanequal":
                case "ge":
                    return StringFilterOperations.GreaterOrEquals.ToString();
                // Less
                case "lt":
                case "<":
                case "islessthan":
                case "lessthan":
                case "less":
                    return StringFilterOperations.LessThan.ToString();
                // Less or equal
                case "lte":
                case "<=":
                case "islessthanorequalto":
                case "lessthanequal":
                case "le":
                    return StringFilterOperations.LessThanOrEquals.ToString();
                case "startswith":
                    return StringFilterOperations.StartsWith.ToString();

                case "endswith":
                    return StringFilterOperations.EndsWith.ToString();
                //string.Contains()
                case "contains":
                    return StringFilterOperations.Contains.ToString();
                case "doesnotcontain":
                    return StringFilterOperations.NotContains.ToString();
                default:
                    return StringFilterOperations.Contains.ToString();

            }
        }




        public string BuildColumnList()
        {
            if (MFConfiguration.InstanceSettings().SQLEscapeClientInput)
            {
                return String.Join(",", req.Columns?.Select(c => GetField(c)));
            }
            return String.Join(",", req.Columns);
        }

        public void enrichGridRequests()
        {
            string gridDefinition = Magic_Grids.getGridFromCache(this.req.GridName, this.req.functionID.ToString(), this.req.layerID.ToString());
            JObject gd = Newtonsoft.Json.JsonConvert.DeserializeObject<JObject>(gridDefinition);
            req.Model = gd["MagicGridModel"].ToString();
            this.DataModel = Newtonsoft.Json.JsonConvert.DeserializeObject<object>(req.Model);
            req.EntityName = gd["FromTable"] != null ? gd["FromTable"].ToString() : null;
            req.DataSourceCustomParam = gd["CustomJSONParam"].ToString();
            try
            {
                if (String.IsNullOrEmpty(req.data))
                    return;
                dynamic data = Newtonsoft.Json.JsonConvert.DeserializeObject(req.data);
                if (data["user_has_selected_all"] != null && bool.Parse(data["user_has_selected_all"].ToString()))
                {
                    dynamic ds = Newtonsoft.Json.JsonConvert.DeserializeObject(req.DataSourceCustomParam);
                    string selectAllSp = Magic_Grids.getSelectAllSP(this.req.GridName);
                    if (!String.IsNullOrEmpty(selectAllSp))
                    {
                        ds["read"].Definition = selectAllSp;
                        req.DataSourceCustomParam = Newtonsoft.Json.JsonConvert.SerializeObject(ds);
                    }
                }

            }
            catch (Exception ex) {
                MFLog.LogInFile("Enrichment, see exception below",MFLog.logtypes.ERROR);
                MFLog.LogInFile(ex,MFLog.logtypes.ERROR);
            }
        }
    }

    public class RequestExtensions
    {
        System.Web.HttpRequest request = HttpContext.Current.Request;
        public bool IsLocalUrl(string url)
        {
            if (string.IsNullOrEmpty(url))
            {
                return false;
            }

            Uri absoluteUri;
            if (Uri.TryCreate(url, UriKind.Absolute, out absoluteUri))
            {
                return String.Equals(request.Url.Host, absoluteUri.Host,
                            StringComparison.OrdinalIgnoreCase);
            }
            else
            {
                bool isLocal = !url.StartsWith("http:", StringComparison.OrdinalIgnoreCase)
                    && !url.StartsWith("https:", StringComparison.OrdinalIgnoreCase)
                    && Uri.IsWellFormedUriString(url, UriKind.Relative);
                return isLocal;
            }
        }
    }
}