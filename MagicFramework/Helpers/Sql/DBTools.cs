using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MagicFramework.Helpers.Sql
{
    public class DBTools
    {
        public class Where
        {
            public string condition { get; set; }
            public object value { get; set; }
            public string linkup { get; set; }
        }

        public DBTools() { }

        public DBTools(string connectionString)
        {
            this.connectionString = connectionString;
        }

        private string _connectionString;
        public string connectionString
        {
            get
            {
                return _connectionString;
            }
            set
            {
                _connection = null;
                _connectionString = value;
            }
        }
        protected SqlConnection _connection;
        public SqlConnection connection
        {
            set { _connection = value; }
            get
            {
                return CreateConnectionIfNull();
            }
        }
        protected string query;
        protected string where;
        protected SqlCommand command;
        protected Lazy<List<Where>> whereConditions = new Lazy<List<Where>>(() => new List<Where>());
        public bool IsKeepConnectionOpen = false;
        public int CommandTimoutSeconds = -1;
        protected void SetDefaultConnectionString()
        {
            connectionString = MagicFramework.Helpers.MFConfiguration.GetApplicationInstanceConfiguration().TargetDBconn;
        }

        protected SqlConnection CreateConnectionIfNull()
        {
            if (_connection == null)
            {
                if (string.IsNullOrEmpty(connectionString))
                    SetDefaultConnectionString();
                _connection = new SqlConnection(connectionString);
            }
            return _connection;
        }

        protected void OpenConnection()
        {
            if (connection.State != ConnectionState.Open)
            {
                connection.Open();
            }
        }

        protected SqlCommand CreateCommand(string query)
        {
            command = new SqlCommand(query, connection);
            if (CommandTimoutSeconds > -1)
            {
                command.CommandTimeout = CommandTimoutSeconds;
            }
            return command;
        }

        protected void UseTransaction(SqlCommand command, SqlTransaction transaction)
        {
            if (transaction != null)
            {
                command.Transaction = transaction;
            }
        }

        protected void CloseConnection(SqlTransaction transaction)
        {
            if (transaction == null && !IsKeepConnectionOpen)
            {
                connection.Close();
            }
        }

        public SqlTransaction OpenTransaction(string transactionName)
        {
            OpenConnection();
            return connection.BeginTransaction(transactionName);
        }

        public static DataTable GetDataTable(Task<SqlDataReader> dataReader)
        {
            var dt = new DataTable();
            dataReader.Wait();
            dt.Load(dataReader.Result);
            var data = dt.AsEnumerable().FirstOrDefault();
            if (data != null)
                return data.Table;
            return null;
        }

        public static async Task<DataTable> GetDataTableAsync(Task<SqlDataReader> dataReader)
        {
            var dt = new DataTable();
            dt.Load(await dataReader);
            var data = dt.AsEnumerable().FirstOrDefault();
            if (data != null)
                return data.Table;
            return null;
        }
    }
}
