using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Data.SqlClient;
using System.Data;
using System.Text.RegularExpressions;
using System.Collections;

namespace MagicFramework.Helpers.Sql
{
    public class DBQuery : DBTools
    {
        public string select { get; set; }
        public string orderBy { get; set; }
        private string groupBy { get; set; }
        public DataTable result { get; set; }
        public Task<SqlDataReader> reader { get; set; }
        public string name { get; set; }

        public DBQuery()
        {
        }

        public DBQuery(string select)
        {
            this.select = select;
        }

        public DBQuery(string select, string orderBy)
        {
            this.select = select;
            this.orderBy = orderBy;
        }

        public DataTable Execute(string query, Dictionary<string, object> parameters)
        {
            using (connection)
            {
                connection.Open();
                return GetDataTable(CreateCommand(query, parameters).ExecuteReaderAsync());
            }
        }

        public DataTable Execute(SqlTransaction transaction = null)
        {
            if (where == null)
                BuildQuery();
            UseTransaction(command, transaction);
            try
            {
                OpenConnection();
                return GetDataTable(command.ExecuteReaderAsync());
            }
            finally
            {
                CloseConnection(transaction);
            }
        }

        public void ExecuteNonQuery(SqlTransaction trans = null, int? commandTimout = null)
        {
            if (where == null)
                BuildQuery();
            OpenConnection();
            if (commandTimout != null)
            {
                command.CommandTimeout = (int)commandTimout;
            }
            UseTransaction(command, trans);
            try
            {
                command.ExecuteNonQuery();
            }
            finally
            {
                CloseConnection(trans);
            }
        }

        public Task<SqlDataReader> ExecuteAsync()
        {
            if (where == null)
                BuildQuery();
            connection.Open();
            return reader = command.ExecuteReaderAsync(CommandBehavior.CloseConnection);
        }

        public void WriteResult()
        {
            result = GetDataTable(reader);
        }

        public async Task WriteResultAsync()
        {
            result = await GetDataTableAsync(reader);
        }

        private SqlCommand CreateCommand(string query, Dictionary<string, object> parameters)
        {
            SqlCommand command = CreateCommand(query);
            foreach (var parameter in parameters)
            {
                command.Parameters.AddWithValue(parameter.Key, parameter.Value);
            }
            return command;
        }

        /// <summary>
        /// add a where condidtion
        /// </summary
        /// <param name="condition">query.AddWhereCondition("[ID] = @docId", documentId);
        /// OR delete.AddWhereCondition("purpose IN @purpose", purpose.ToList())</param>
        /// <param name="value"></param>
        /// <param name="linkup"></param>
        public void AddWhereCondition(string condition, object value = null, string linkup = "AND")
        {
            whereConditions.Value.Add(new Where { linkup = linkup, condition = condition, value = value });
            where = null;
        }

        /// <summary>
        /// adds a parametrized part right after the select statement
        /// !IMPORTANT note that you can only use this OR AddWhereCondition
        /// </summary>
        /// <param name="sql">sql with paramter @variables</param>
        /// <param name="values">if list containes a enumerable it will append values separated by comma. ex: "WHERE id IN @inCondition" and value is List with { 1, 2 } it results in WHERE id IN (@p1,@p2)</param>
        public void AddParameterizedPart(string sql, List<object> values)
        {
            int parameterNo = 0;
            int index = 0;
            where = "";
            List<ReplaceInfo> toHandle = new List<ReplaceInfo>();
            List<SqlParameter> parameters = new List<SqlParameter>();
            Regex parameterVariable = new Regex(@"@[\w]+");
            var match = parameterVariable.Match(sql);
            while (match.Success)
            {
                var enumerable = values[index] as IEnumerable;
                if (values[index].GetType() != typeof(string) && enumerable != null)
                {
                    string sqlParams = "(";
                    foreach (object value in enumerable)
                    {
                        string param = "@p" + parameterNo++;
                        parameters.Add(new SqlParameter(param, value));
                        sqlParams += param + ",";
                    }
                    toHandle.Add(new ReplaceInfo
                    {
                        Index = match.Index,
                        Length = match.Length,
                        Value = sqlParams.TrimEnd(',') + ")"
                    });
                }
                else
                {
                    parameters.Add(new SqlParameter(match.Groups[0].Value, values[index]));
                }
                match = match.NextMatch();
                index++;
            }
            if (toHandle.Count > 0)
            {
                toHandle.Reverse();
                foreach (var toReplace in toHandle)
                {
                    sql = sql.Substring(0, toReplace.Index) + toReplace.Value + sql.Substring(toReplace.Index + toReplace.Length);
                }
            }
            select += " " + sql;
            query = GetSQLString();
            command = CreateCommand(query);
            foreach (var parameter in parameters)
            {
                command.Parameters.Add(parameter);
            }
        }

        public void SetGroupBy(string groupByColumns)
        {
            this.groupBy = groupByColumns;
        }

        public void BuildQuery()
        {
            List<SqlParameter> parameters = new List<SqlParameter>();
            where = "";
            int iteration = -1;
            foreach (var condition in whereConditions.Value)
            {
                iteration++;
                if (where != "")
                {
                    where += " " + condition.linkup + " ";
                }
                if (condition.condition.ToLower().Contains(" in "))
                {
                    HandleInCondition(condition, parameters, iteration);
                }
                else
                {
                    if (condition.value != null)
                    {
                        parameters.Add(new SqlParameter(GetParameterVariableFromString(condition.condition), condition.value));
                    }
                    where += condition.condition;
                }
            }
            query = GetSQLString();
            command = CreateCommand(query);
            foreach (var parameter in parameters)
            {
                command.Parameters.Add(parameter);
            }
        }

        public string GetSQLString()
        {
            return select
               + (string.IsNullOrEmpty(where) ? "" : " WHERE " + where)
               + (string.IsNullOrEmpty(groupBy) ? "" : " GROUP BY " + groupBy)
               + (string.IsNullOrEmpty(orderBy) ? "" : " ORDER BY " + orderBy);
        }

        private void HandleInCondition(Where condition, List<SqlParameter> parameters, int iteration)
        {
            Type type = condition.value.GetType();
            List<string> values = null;
            if (type == typeof(string))
            {
                string stringValues = (string)condition.value;
                values = new List<string>(stringValues.Split(','));
            }
            else if (type == typeof(List<string>))
            {
                values = (List<string>)condition.value;
            }
            bool isString = false;
            int index = condition.condition.IndexOf("()");
            if (index == -1)
            {
                index = condition.condition.IndexOf("('')");
                condition.condition = condition.condition.Replace("('')", "()");
                isString = true;
            }
            string parameterList = "";
            int i = 0;
            if (index != -1 && values != null)
            {
                foreach (string value in values)
                {
                    string variable = "@inTag_" + iteration + "_" + i;
                    parameterList += variable;
                    if (index - 1 != values.Count)
                        parameterList += ",";
                    if (isString)
                    {
                        parameters.Add(new SqlParameter(variable, value));
                    }
                    else
                    {
                        parameters.Add(new SqlParameter(variable, int.Parse(value)));
                    }
                    i++;
                }
                where += condition.condition.Insert(index + 1, parameterList.Substring(0, parameterList.Length - 1));
            }
        }

        public static string GetParameterVariableFromString(string text)
        {
            Regex parameterVariable = new Regex(@"@[\w]+");
            return parameterVariable.Match(text).Groups[0].Value;
        }
    }
}

public class ReplaceInfo
{
    public int Index { get; set; }
    public int Length { get; set; }
    public string Value { get; set; }
}
