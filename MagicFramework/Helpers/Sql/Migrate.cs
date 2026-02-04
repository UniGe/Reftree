using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Web;

namespace MagicFramework.Helpers.Sql
{
    public static class Migrate
    {
        private static Regex migrationRegex = new Regex(@"\d+_");

        public static void Do()
        {
            var configs = new MFConfiguration().LoadConfigurations();
            foreach (var appConfig in configs)
            {
                foreach (var instanceConfig in appConfig.Value.listOfInstances)
                {
                    if (!instanceConfig.DBMigrationActive)
                    {
                        continue;
                    }
                    try
                    {
                        var cnx = new SqlConnection(instanceConfig.TargetDBconn);
                        MigrateConnection(cnx, instanceConfig.appInstancename);
                        Seed(instanceConfig.TargetDBconn);
                        cnx = new SqlConnection(instanceConfig.MagicDBConnectionString);
                        MigrateConnection(cnx, instanceConfig.appInstancename);
                        Seed(instanceConfig.MagicDBConnectionString);
                    }
                    catch (Exception ex)
                    {
                        MFLog.LogInFile(instanceConfig.appInstancename + ": " + ex.ToString(), MFLog.logtypes.ERROR);
                    }
                }
            }
        }

        public static void MigrateConnection(System.Data.IDbConnection cnx, string instanceName)
        {
            var evolve = new Evolve.Evolve(cnx, msg => MFLog.LogInFile(instanceName + ": " + msg, MFLog.logtypes.INFO))
            {
                Locations = new[] { System.IO.Path.Combine(HttpContext.Current.Server.MapPath("~"), "migrations") },
                IsEraseDisabled = true,
            };

            evolve.Migrate();
        }

        public static void Seed(string connectionString)
        {
            string path = Path.Combine(HttpContext.Current.Server.MapPath("~"), "migrations/seeds");
            var files = Directory.GetFiles(path)
                .OrderBy(f => f);
            foreach (string fileName in files)
            {
                if (!migrationRegex.IsMatch(fileName))
                {
                    continue;
                }
                SeedFile(Path.Combine(path, fileName), connectionString);
            }
        }

        public static void SeedFile(string path, string connectionString)
        {
            string fileName = Path.GetFileName(path);
            var q = new DBQuery("SELECT * FROM dbo.changelog");
            q.connectionString = connectionString;
            q.AddWhereCondition("name = @name", fileName);
            var result = q.Execute();
            if (result != null && result.Rows.Count > 0)
            {
                return;
            }

            string script = File.ReadAllText(path);
            q = new DBQuery(script);
            q.connectionString = connectionString;
            SqlTransaction trans = q.OpenTransaction("SeedTransaction");
            try
            {
                q.ExecuteNonQuery(trans, 3600);

                DBWriter w = new DBWriter("dbo.changelog", new Dictionary<string, object> {
                    { "type", 2 },
                    { "description", "seeding file" },
                    { "name", fileName },
                    { "installed_by", "MF" },
                    { "installed_on", DateTime.Now },
                    { "success", true },
                    { "version", "0" },
                    { "checksum", "" },
                });
                w.connection = q.connection;
                w.Write(trans);

                trans.Commit();
            }
            catch (Exception e)
            {
                trans.Rollback();
                throw e;
            }
            finally
            {
                q.connection.Close();
            }
        }
    }
}