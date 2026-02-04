using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Data;
using System.Data.SqlClient;

namespace MagicFramework.Helpers.Sql
{
    public class DBQueries : DBTools
    {
        public List<DBQuery> queries = new List<DBQuery>();

        public void AddQuery(DBQuery query, string name = "")
        {
            query.name = name;
            queries.Add(query);
        }

        public List<DataTable> ExecuteQueries()
        {
            List<Task<SqlDataReader>> tasks = new List<Task<SqlDataReader>>();
            foreach(DBQuery query in queries)
            {
                tasks.Add(query.ExecuteAsync());
            }
            Task.WaitAll(tasks.ToArray());
            List<DataTable> res = new List<DataTable>();
            foreach(DBQuery query in queries)
            {
                query.WriteResult();
                res.Add(query.result);
            }
            return res;
        }

        public async Task<List<DataTable>> ExecuteQueriesAsync()
        {
            List<Task<DataTable>> tasks = new List<Task<DataTable>>();
            foreach (DBQuery query in queries)
            {
                tasks.Add(
                    query
                        .ExecuteAsync()
                        .ContinueWith(async (reader) =>
                        {
                            await query.WriteResultAsync();
                            return query.result;
                        })
                        .Unwrap()
                );
            }
            await Task.WhenAll(tasks);
            return tasks.Select(t => t.Result).ToList();
        }
    }
}
