using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Web;
using System.Web.Configuration;

namespace MagicFramework.Helpers
{
    public static class Files
    {
        private const string FILE_TABLE_NAME = "Magic_Files";
        private const string TRASH_FOLDER = "Deleted__MF";
        private const string DEFAULT_SUB_TRASH_FOLDER = "DefaultAppName";

        private const string COLUMN_FOLDER_PATH = "FileTargetFolderPath";
        private const string COLUMN_FILE_NAME = "FileName";
        private const string COLUMN_FILE_INFO = "FileInfo";
        private static string[] COLUMNS_REQUIRED = new string[]
        {
            COLUMN_FILE_NAME,
            COLUMN_FOLDER_PATH,
        };

        // Flag to ensure the log table is checked/created only once per application run.
        private static bool _logTableChecked = false;

        /// <summary>
        /// Copies the specified file into the trash folder.
        /// Logs the operation details including the calling method.
        /// </summary>
        /// <param name="filePath">The full path of the file to be copied into trash.</param>
        /// <param name="connectionString">The database connection string to be used for logging.</param>
        /// <param name="applicationName">
        /// The name of the application instance. If not provided or if its value is "-1", the name will be retrieved automatically.
        /// </param>
        /// <param name="destinationMovingPath">
        /// Optional: The destination path where the file is intended to be moved after copying to trash. This may be null.
        /// </param>
        /// <param name="callerMethod">Automatically populated with the calling method name.</param>
        public static void CopyInTrash(string filePath, string connectionString = null, string applicationName = null, string destinationMovingPath = null, [CallerMemberName] string callerMethod = null)
        {
            if ((WebConfigurationManager.AppSettings["disableCopyInTrash"] != null && WebConfigurationManager.AppSettings["disableCopyInTrash"].Equals("true")))
                return;
            try
            {
                if (string.IsNullOrEmpty(applicationName) || applicationName == "-1")
                {
                    try
                    {
                        applicationName = ApplicationSettingsManager.GetAppInstanceName();
                        if (applicationName == "-1") // Something went wrong (e.g., no session); use default folder.
                        {
                            applicationName = DEFAULT_SUB_TRASH_FOLDER;
                        }
                    }
                    catch (Exception ex)
                    {
                        Debug.WriteLine("Could not read app instance name: " + ex.Message);
                    }
                }
                string rootPath = ConfigurationManager.AppSettings["logpath"];
                string destinationTrashFolder = Path.Combine(rootPath, TRASH_FOLDER, applicationName);
                Directory.CreateDirectory(destinationTrashFolder);
                string destinationFilePath = Path.Combine(destinationTrashFolder, Path.GetFileName(filePath));

                System.IO.File.Copy(filePath, destinationFilePath, true);

                // Log successful copy to trash.
                LogFileOperation(connectionString, applicationName, "CopyInTrash", callerMethod,
                    Path.GetFileName(filePath), filePath, destinationFilePath, destinationMovingPath, "Success");
            }
            catch (Exception ex)
            {
                MFLog.LogInFile(ex);
                // Log the error.
                LogFileOperation(connectionString, applicationName, "CopyInTrash", callerMethod,
                    Path.GetFileName(filePath), filePath, string.Empty, destinationMovingPath, "Error", ex.Message);
            }
        }

        public static File Register(string fileName, string currentPath = null, string targetPath = null, string fileInfo = null, string connectionString = null, bool isCustomPath = false)
        {
            connectionString = connectionString ?? MFConfiguration.GetApplicationInstanceConfiguration().TargetDBconn;
            Sql.DBTools DBTool = new Sql.DBTools(connectionString);
            SqlTransaction transaction = DBTool.OpenTransaction("RegisterFile");

            string applicationName = null;

            try
            {
                applicationName = ApplicationSettingsManager.GetAppInstanceName();
            }
            catch (Exception e)
            {
                MFLog.LogInFile("Error retrieving applicationName in Register to save the delete file log in db: " + e.Message, MFLog.logtypes.ERROR);
            }

            try
            {
                var file = GetByName(fileName, DBTool.connection, transaction);
                if (file == null)
                {
                    file = new File
                    {
                        Name = fileName,
                        Path = currentPath,
                        TargetPath = targetPath,
                        Info = fileInfo,
                        CreatedAt = DateTime.Now,
                        IsCustomPath = isCustomPath,
                    };
                    file = CreateFile(file, DBTool.connection, transaction);
                }
                else
                {
                    var update = new Dictionary<string, object>();
                    if (!string.IsNullOrEmpty(fileInfo))
                    {
                        file.Info = fileInfo;
                        update["FileInfo"] = fileInfo;
                        UpdateByName(fileName, update, DBTool.connection, transaction);
                    }
                }
                if (string.IsNullOrEmpty(file.Path)
                    || string.IsNullOrEmpty(targetPath)
                    || string.Equals(file.Path, targetPath)
                    || file.IsCustomPath && !isCustomPath)
                {
                    transaction.Commit();
                    return file;
                }
                Directory.CreateDirectory(Path.GetDirectoryName(targetPath));

                // Before moving the file, copy it to trash (this call will also log the operation).
                CopyInTrash(file.Path, connectionString, applicationName, targetPath);

                System.IO.File.Move(file.Path, targetPath);
                file.Path = targetPath;
                UpdateByName(
                    fileName,
                    new Dictionary<string, object>
                    {
                        { "Path", targetPath },
                        { "IsCustomPath", isCustomPath },
                        { "TargetPath", targetPath },
                    },
                    DBTool.connection,
                    transaction
                );
                transaction.Commit();
                file.TargetPath = targetPath;
                file.IsCustomPath = isCustomPath;
                return file;
            }
            catch (Exception e)
            {
                transaction.Rollback();
                throw e;
            }
            finally
            {
                DBTool.connection.Close();
            }
        }

        public static void HandleLocation(DataSet dataSet, bool isCustomPath = false, string connectionString = null)
        {
            var table = DataSetContainsFileColumns(dataSet);
            if (table == null)
            {
                return;
            }

            foreach (DataRow row in table.Rows)
            {
                string fileName = row.Field<string>(COLUMN_FILE_NAME);
                string targetFolderPath = row.Field<string>(COLUMN_FOLDER_PATH);
                string fileInfo = null;
                if (table.Columns.Cast<DataColumn>().Any(d => d.ColumnName.Equals(COLUMN_FILE_INFO)))
                {
                    fileInfo = row.Field<string>(COLUMN_FILE_INFO);
                }
                string targetFilePath = Path.Combine(targetFolderPath, fileName);

                Register(fileName, null, targetFilePath, fileInfo, connectionString, isCustomPath);
            }
        }

        public static void HandleLocationWithPath(DataSet dataSet, bool isCustomPath = false, string connectionString = null, string currentPath = null)
        {
            var table = DataSetContainsFileColumns(dataSet);
            if (table == null)
            {
                return;
            }

            foreach (DataRow row in table.Rows)
            {
                string fileName = row.Field<string>(COLUMN_FILE_NAME);
                string targetFolderPath = row.Field<string>(COLUMN_FOLDER_PATH);
                string fileInfo = null;
                string currentPathDef = currentPath;

                if (table.Columns.Cast<DataColumn>().Any(d => d.ColumnName.Equals(COLUMN_FILE_INFO)))
                {
                    fileInfo = row.Field<string>(COLUMN_FILE_INFO);
                }
                string targetFilePath = Path.Combine(targetFolderPath, fileName);
                currentPathDef = Path.Combine(currentPath, fileName);

                Register(fileName, currentPathDef, targetFilePath, fileInfo, connectionString, isCustomPath);
            }
        }

        public static DataTable DataSetContainsFileColumns(DataSet dataSet)
        {
            foreach (DataTable table in dataSet.Tables)
            {
                int distinctRequiredColumns = table.Columns.Cast<DataColumn>()
                    .Where(c => COLUMNS_REQUIRED.Any(columnName => columnName.Equals(c.ColumnName)))
                    .Distinct()
                    .Count();
                if (distinctRequiredColumns != COLUMNS_REQUIRED.Length)
                {
                    continue;
                }

                return table;
            }
            return null;
        }

        public static File DeleteByName(string fileName, string connectionString = null, string applicationName = null)
        {
            var file = GetByName(fileName);

            if (file == null)
            {
                return file;
            }

            if (file.DeletedAt != null)
            {
                return file;
            }

            // Copy the file into trash and log this operation.
            CopyInTrash(file.Path, connectionString, applicationName);

            System.IO.File.Delete(file.Path);
            file.DeletedAt = DateTime.Now;
            UpdateByName(fileName, new Dictionary<string, object> { { "DeletedAt", file.DeletedAt } });
            return file;
        }

        public static void UpdateByName(string fileName, Dictionary<string, object> update, SqlConnection connection = null, SqlTransaction transaction = null)
        {
            var writer = new Sql.DBWriter(FILE_TABLE_NAME, update, fileName, "Name");
            SetConnection(writer, connection);
            writer.Write(transaction);
        }

        public static File GetByName(string fileName, SqlConnection connection = null, SqlTransaction transaction = null)
        {
            var query = new Sql.DBQuery("SELECT * FROM Magic_Files");
            query.AddWhereCondition("Name = @name", fileName);
            SetConnection(query, connection);
            var result = query.Execute(transaction);
            if (result == null)
            {
                return null;
            }
            return DeserializeDBFiles(result).FirstOrDefault();
        }

        public static IEnumerable<File> DeserializeDBFiles(DataTable dataTable)
        {
            return dataTable.AsEnumerable()
                .Select(row => new File
                {
                    ID = row.Field<int>("ID"),
                    Name = row.Field<string>("Name"),
                    Path = row.Field<string>("Path"),
                    TargetPath = row.Field<string>("Path"),
                    Info = row.Field<string>("Info"),
                    CreatedAt = row.Field<DateTime>("CreatedAt"),
                    DeletedAt = row.Field<DateTime?>("DeletedAt"),
                    IsCustomPath = row.Field<bool>("IsCustomPath"),
                });
        }

        private static void SetConnection(Sql.DBTools tool, SqlConnection connection)
        {
            if (connection == null)
            {
                tool.connectionString = MFConfiguration.GetApplicationInstanceConfiguration().TargetDBconn;
            }
            else
            {
                tool.connection = connection;
            }
        }

        public static File CreateFile(File file, SqlConnection connection = null, SqlTransaction transaction = null)
        {
            var writer = new Sql.DBWriter(FILE_TABLE_NAME, new Dictionary<string, object>
            {
                { "Name", file.Name },
                { "Path", file.Path },
                { "TargetPath", file.TargetPath },
                { "Info", file.Info },
                { "CreatedAt", file.CreatedAt },
                { "IsCustomPath", file.IsCustomPath },
            }, null, "ID");
            SetConnection(writer, connection);
            var id = writer.Write(transaction);
            file.ID = (int)id;
            return file;
        }

        /// <summary>
        /// Inserts an operation log entry into the Magic_FileOperationLogs table.
        /// </summary>
        /// <param name="connectionString">The database connection string used for logging.</param>
        /// <param name="applicationName">The name of the application instance.</param>
        /// <param name="operationType">The type of the operation (e.g. "CopyInTrash").</param>
        /// <param name="callerMethod">The name of the calling method.</param>
        /// <param name="fileName">The name of the file being processed.</param>
        /// <param name="sourcePath">The original file location.</param>
        /// <param name="destinationPath">The destination (trash) path.</param>
        /// <param name="destinationMovingPath">
        /// Optional: The path where the file is intended to be moved after copying to trash. Can be null.
        /// </param>
        /// <param name="status">"Success" or "Error".</param>
        /// <param name="additionalInfo">Any additional details (such as an error message).</param>
        private static void LogFileOperation(string connectionString, string applicationName, string operationType, string callerMethod, string fileName, string sourcePath, string destinationPath, string destinationMovingPath, string status, string additionalInfo = null)
        {
            try
            {
                // Ensure the log table exists (only once).
                if (!_logTableChecked)
                    EnsureLogTableExists(connectionString);

                using (SqlConnection connection = new SqlConnection(connectionString))
                {
                    connection.Open();
                    string sql = @"
                        INSERT INTO [dbo].[Magic_FileOperationLogs]
                        (OperationType, CallerMethod, FileName, SourcePath, DestinationPath, DestinationMovingPath, ApplicationName, Timestamp, Status, AdditionalInfo)
                        VALUES
                        (@OperationType, @CallerMethod, @FileName, @SourcePath, @DestinationPath, @DestinationMovingPath, @ApplicationName, @Timestamp, @Status, @AdditionalInfo)";
                    using (SqlCommand cmd = new SqlCommand(sql, connection))
                    {
                        cmd.Parameters.AddWithValue("@OperationType", operationType);
                        cmd.Parameters.AddWithValue("@CallerMethod", callerMethod ?? string.Empty);
                        cmd.Parameters.AddWithValue("@FileName", fileName ?? string.Empty);
                        cmd.Parameters.AddWithValue("@SourcePath", sourcePath ?? string.Empty);
                        cmd.Parameters.AddWithValue("@DestinationPath", destinationPath ?? string.Empty);
                        cmd.Parameters.AddWithValue("@DestinationMovingPath", destinationMovingPath ?? string.Empty);
                        cmd.Parameters.AddWithValue("@ApplicationName", applicationName);
                        cmd.Parameters.AddWithValue("@Timestamp", DateTime.Now);
                        cmd.Parameters.AddWithValue("@Status", status);
                        cmd.Parameters.AddWithValue("@AdditionalInfo", (object)additionalInfo ?? DBNull.Value);
                        cmd.ExecuteNonQuery();
                    }
                }
            }
            catch (Exception ex)
            {
                // Fallback to file-based logging if DB logging fails.
                MFLog.LogInFile(ex);
            }
        }

        /// <summary>
        /// Ensures that the Magic_FileOperationLogs table exists in the target database.
        /// If the table does not exist, it will be created with an additional column for DestinationMovingPath.
        /// </summary>
        /// <param name="connectionString">The database connection string used for logging.</param>
        private static void EnsureLogTableExists(string connectionString = null)
        {
            try
            {
                using (SqlConnection connection = new SqlConnection(connectionString))
                {
                    connection.Open();
                    string sql = @"
                        IF NOT EXISTS (SELECT * FROM sys.objects 
                                       WHERE object_id = OBJECT_ID(N'[dbo].[Magic_FileOperationLogs]') AND type in (N'U'))
                        BEGIN
                            CREATE TABLE [dbo].[Magic_FileOperationLogs](
                                [Id] INT IDENTITY(1,1) PRIMARY KEY,
                                [OperationType] NVARCHAR(50),
                                [CallerMethod] NVARCHAR(1024),
                                [FileName] NVARCHAR(max),
                                [SourcePath] NVARCHAR(max),
                                [DestinationPath] NVARCHAR(max),
                                [DestinationMovingPath] NVARCHAR(max),
                                [ApplicationName] NVARCHAR(255),
                                [Timestamp] DATETIME NOT NULL,
                                [Status] NVARCHAR(50),
                                [AdditionalInfo] NVARCHAR(MAX)
                            )
                        END";
                    using (SqlCommand command = new SqlCommand(sql, connection))
                    {
                        command.ExecuteNonQuery();
                    }
                }
            }
            catch (Exception ex)
            {
                MFLog.LogInFile(ex);
            }
            _logTableChecked = true;
        }

        public class File
        {
            public int ID { get; set; }
            public string Name { get; set; }
            public string Path { get; set; }
            public string TargetPath { get; set; }
            public string Info { get; set; }
            public DateTime CreatedAt { get; set; }
            public DateTime? DeletedAt { get; set; }
            public bool IsCustomPath { get; set; }
        }
    }
}
