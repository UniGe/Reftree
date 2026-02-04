using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Configuration;
using System.Configuration.Provider;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Web;
using System.Web.Configuration;
using System.Web.Hosting;
using System.Web.Security;
using MagicFramework.Helpers;
using Newtonsoft.Json.Linq;

namespace MagicFramework.MemberShip
{
    public class EFMembershipProvider : MembershipProvider
    {


        #region members
        //private const int newPasswordLength = 8;
        private string applicationName;

        private bool enablePasswordReset;
        private bool enablePasswordRetrieval;
        private MachineKeySection machineKey; // Used when determining encryption key values.
        private int maxInvalidPasswordAttempts;
        private int minRequiredNonAlphanumericCharacters;
        private int minRequiredPasswordLength;
        private int passwordAttemptWindow;
        private MembershipPasswordFormat passwordFormat;
        private string passwordStrengthRegularExpression;
        private bool requiresQuestionAndAnswer;
        private bool requiresUniqueEmail;
        #endregion

        #region properties
        /// <summary>
        /// Indicates whether the membership provider is configured to allow users to retrieve their passwords.
        /// </summary>
        /// <returns>
        /// true if the membership provider is configured to support password retrieval; otherwise, false. The default is false.
        /// </returns>
        public override bool EnablePasswordRetrieval
        {
            get { return enablePasswordRetrieval; }
        }

        /// <summary>
        /// Indicates whether the membership provider is configured to allow users to reset their passwords.
        /// </summary>
        /// <returns>
        /// true if the membership provider supports password reset; otherwise, false. The default is true.
        /// </returns>
        public override bool EnablePasswordReset
        {
            get { return enablePasswordReset; }
        }

        /// <summary>
        /// Gets a value indicating whether the membership provider is configured to require the user to answer a password question for password reset and retrieval.
        /// </summary>
        /// <returns>
        /// true if a password answer is required for password reset and retrieval; otherwise, false. The default is true.
        /// </returns>
        public override bool RequiresQuestionAndAnswer
        {
            get { return requiresQuestionAndAnswer; }
        }

        /// <summary>
        /// The name of the application using the custom membership provider.
        /// </summary>
        /// <returns>
        /// The name of the application using the custom membership provider.
        /// </returns>
        public override string ApplicationName { get; set; }

        /// <summary>
        /// Gets the number of invalid password or password-answer attempts allowed before the membership user is locked out.
        /// </summary>
        /// <returns>
        /// The number of invalid password or password-answer attempts allowed before the membership user is locked out.
        /// </returns>
        public override int MaxInvalidPasswordAttempts
        {
            get { return maxInvalidPasswordAttempts; }
        }

        /// <summary>
        /// Gets the number of minutes in which a maximum number of invalid password or password-answer attempts are allowed before the membership user is locked out.
        /// </summary>
        /// <returns>
        /// The number of minutes in which a maximum number of invalid password or password-answer attempts are allowed before the membership user is locked out.
        /// </returns>
        public override int PasswordAttemptWindow
        {
            get { return passwordAttemptWindow; }
        }

        /// <summary>
        /// Gets a value indicating whether the membership provider is configured to require a unique e-mail address for each user name.
        /// </summary>
        /// <returns>
        /// true if the membership provider requires a unique e-mail address; otherwise, false. The default is true.
        /// </returns>
        public override bool RequiresUniqueEmail
        {
            get { return requiresUniqueEmail; }
        }

        /// <summary>
        /// Gets a value indicating the format for storing passwords in the membership data store.
        /// </summary>
        /// <returns>
        /// One of the <see cref="T:System.Web.Security.MembershipPasswordFormat" /> values indicating the format for storing passwords in the data store.
        /// </returns>
        public override MembershipPasswordFormat PasswordFormat
        {
            get { return passwordFormat; }
        }

        /// <summary>
        /// Gets the minimum length required for a password.
        /// </summary>
        /// <returns>
        /// The minimum length required for a password. 
        /// </returns>
        public override int MinRequiredPasswordLength
        {
            get { return minRequiredPasswordLength; }
        }

        /// <summary>
        /// Gets the minimum number of special characters that must be present in a valid password.
        /// </summary>
        /// <returns>
        /// The minimum number of special characters that must be present in a valid password.
        /// </returns>
        public override int MinRequiredNonAlphanumericCharacters
        {
            get { return minRequiredNonAlphanumericCharacters; }
        }

        /// <summary>
        /// Gets the regular expression used to evaluate a password.
        /// </summary>
        /// <returns>
        /// A regular expression used to evaluate a password.
        /// </returns>
        public override string PasswordStrengthRegularExpression
        {
            get { return passwordStrengthRegularExpression; }
        }

        public string ConnectionString { get; set; }
        #endregion

        #region public methods
        public static string encodeHMACSHA1Pwd(string password)
        {
            Configuration cfg = WebConfigurationManager.OpenWebConfiguration(HostingEnvironment.ApplicationVirtualPath);
            var mKey = (MachineKeySection)cfg.GetSection("system.web/machineKey");
            HMACSHA1 hash = new HMACSHA1 { Key = HexToByte(mKey.ValidationKey) };
            return Convert.ToBase64String(hash.ComputeHash(Encoding.Unicode.GetBytes(password)));
        }
        /// <summary>
        /// Initialize this membership provider. Loads the configuration settings.
        /// </summary>
        /// <param name="name">membership provider name</param>
        /// <param name="config">configuration</param>
        public override void Initialize(string name, NameValueCollection config)
        {
            if (HttpContext.Current.Request.Url.AbsolutePath.Contains("signalr"))
                return;

            // Initialize values from web.config.
            if (config == null) throw new ArgumentNullException("config");

            if (String.IsNullOrEmpty(name)) name = "EFMembershipProvider";

            if (String.IsNullOrEmpty(config["description"]))
            {
                config.Remove("description");
                config.Add("description", "Smart-Soft EF Membership Provider");
            }

            // Initialize the abstract base class.
            base.Initialize(name, config);

            //     applicationName = ApplicationSettingsManager.GetAppInstanceName();  //GetConfigValue(config["applicationName"], HostingEnvironment.ApplicationVirtualPath);
            this.applicationName = name;
            this.ApplicationName = name;
            maxInvalidPasswordAttempts = Convert.ToInt32(GetConfigValue(config["maxInvalidPasswordAttempts"], "5"));
            passwordAttemptWindow = Convert.ToInt32(GetConfigValue(config["passwordAttemptWindow"], "10"));
            minRequiredNonAlphanumericCharacters = Convert.ToInt32(GetConfigValue(config["minRequiredNonAlphanumericCharacters"], "1"));
            minRequiredPasswordLength = Convert.ToInt32(GetConfigValue(config["minRequiredPasswordLength"], "7"));
            passwordStrengthRegularExpression = Convert.ToString(GetConfigValue(config["passwordStrengthRegularExpression"], ""));
            enablePasswordReset = Convert.ToBoolean(GetConfigValue(config["enablePasswordReset"], "true"));
            enablePasswordRetrieval = Convert.ToBoolean(GetConfigValue(config["enablePasswordRetrieval"], "true"));
            requiresQuestionAndAnswer = Convert.ToBoolean(GetConfigValue(config["requiresQuestionAndAnswer"], "false"));
            requiresUniqueEmail = true;//Convert.ToBoolean(GetConfigValue(config["requiresUniqueEmail"], "true"));
            this.ValidatingPassword += new MembershipValidatePasswordEventHandler(OnValidatePassword);


            string temp_format = config["passwordFormat"] ?? "Hashed";

            switch (temp_format)
            {
                case "Hashed":
                    passwordFormat = MembershipPasswordFormat.Hashed;
                    break;
                case "Encrypted":
                    passwordFormat = MembershipPasswordFormat.Encrypted;
                    break;
                case "Clear":
                    passwordFormat = MembershipPasswordFormat.Clear;
                    break;
                default:
                    throw new ProviderException("Password format not supported.");
            }

            // Initialize SqlConnection.
            //ConnectionStringSettings ConnectionStringSettings = ConfigurationManager.ConnectionStrings[config["connectionStringName"]];
            //if (ConnectionStringSettings == null || ConnectionStringSettings.ConnectionString.Trim() == "")
            //{
            //    throw new ProviderException("Connection string cannot be blank.");
            //}
            //ConnectionString = ConnectionStringSettings.ConnectionString;


            if (DBConnectionManager.GetTargetConnection() == "" || DBConnectionManager.GetTargetConnection() == null)
            {
                throw new ProviderException("Connection string cannot be blank.");
            }

            this.ConnectionString = DBConnectionManager.GetTargetConnection();
            // Get encryption and decryption key information from the configuration.
            Configuration cfg = WebConfigurationManager.OpenWebConfiguration(HostingEnvironment.ApplicationVirtualPath);
            machineKey = (MachineKeySection)cfg.GetSection("system.web/machineKey");

            if (machineKey.ValidationKey.Contains("AutoGenerate"))
                if (PasswordFormat != MembershipPasswordFormat.Clear) throw new ProviderException("Hashed or Encrypted passwords are not supported with auto-generated keys.");
        }


        /// <summary>
        /// Assign a Culture to a User
        /// </summary>
        /// <param name="UserID">The user ID of the user.</param>
        /// <param name="CultureID">The culture to be assigned.</param>
        public void SetUserCultureAndOwner(int userid, int cultureid)
        {
            Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
            IQueryable<Data.Magic_Mmb_Users_Extensions> usersextensions = from u in context.Magic_Mmb_Users_Extensions
                                                                          where u.UserID == userid
                                                                          select u;

            if (usersextensions.Count() == 0)
            {
                Data.Magic_Mmb_Users_Extensions Ext = new Data.Magic_Mmb_Users_Extensions
                {
                    UserID = userid,
                    Culture_ID = cultureid,
                    //i set the creator's visibility group as the owner of the new user
                    CreatorUserGroupVisibility_ID = MagicFramework.Helpers.SessionHandler.UserVisibilityGroup

                };
                context.Magic_Mmb_Users_Extensions.InsertOnSubmit(Ext);
                context.SubmitChanges();
            }
            else
            {
                Data.Magic_Mmb_Users_Extensions ext = usersextensions.First();
                ext.Culture_ID = cultureid;
                context.SubmitChanges();
            }
        }
        public void OnValidatePassword(object sender,
                              ValidatePasswordEventArgs args)
        {
            //D.T 20/2/2018: the validation must be explicitly set to true in  magicframework's config file in order to avoid breaking changes
            if (!ApplicationSettingsManager.getMembershipProviderPasswordValidation())
                return;
            string customPasswordRuleMessage = ApplicationSettingsManager.getMembershipProviderPasswordNotValidMessage();
            string error = String.Empty;
            if (!String.IsNullOrEmpty(this.passwordStrengthRegularExpression))
            {
                System.Text.RegularExpressions.Regex r = new System.Text.RegularExpressions.Regex(this.passwordStrengthRegularExpression);
                if (!r.IsMatch(args.Password))
                    if (String.IsNullOrEmpty(customPasswordRuleMessage))
                        error = "La password non soddisfa i requisiti di sicurezza. Contatta l'amministratore di sistema per maggiori dettagli";
                    else
                        error = customPasswordRuleMessage;
            }
            if (String.IsNullOrEmpty(args.Password))
                error = "Password cannot be null";
            if (String.IsNullOrEmpty(error))
            {
                string regex = @"(?=^[!@#$%\^&*()_\-+=\[{\]};:<>|\.\/?a-zA-Z\d]{" + this.MinRequiredPasswordLength.ToString() + @",}$)(?=([!@#$%\^&*()_\-+=\[{\]};:<>|\.\/?a-zA-Z\d]*\W+){" + this.MinRequiredNonAlphanumericCharacters.ToString() + @",})[!@#$%\^&*()_\-+=\[{\]};:<>|\.\/?a-zA-Z\d]*$";
                System.Text.RegularExpressions.Regex r = new System.Text.RegularExpressions.Regex(regex);
                if (!r.IsMatch(args.Password))
                    error = "La password non soddisfa i requisiti di sicurezza. Deve essere più lunga di " + this.MinRequiredPasswordLength.ToString() + " caratteri e contenere almeno " + this.minRequiredNonAlphanumericCharacters.ToString() + " caratteri speciali";
            }
            if (!String.IsNullOrEmpty(error))
            {
                args.FailureInformation =
                 new MembershipPasswordException(error);
                args.Cancel = true;

            }
        }
        /// <summary>
        /// Adds a new membership user to the data source.
        /// </summary>
        /// <returns>A <see cref="T:System.Web.Security.MembershipUser" /> object populated with the information for the newly created user.</returns>
        /// <param name="username">The user name for the new user.</param>
        /// <param name="password">The password for the new user.</param>
        /// <param name="email">The e-mail address for the new user.</param>
        /// <param name="passwordQuestion">The password question for the new user.</param>
        /// <param name="passwordAnswer">The password answer for the new user</param>
        /// <param name="isApproved">Whether or not the new user is approved to be validated.</param>
        /// <param name="providerUserKey">The unique identifier from the membership data source for the user.</param>
        /// <param name="status">A <see cref="T:System.Web.Security.MembershipCreateStatus" /> enumeration value indicating whether the user was created successfully.</param>
        public override MembershipUser CreateUser(string username, string password, string email,
                                                  string passwordQuestion, string passwordAnswer, bool isApproved,
                                                  object providerUserKey, out MembershipCreateStatus status)
        {
            // Validate username/password
            ValidatePasswordEventArgs args = new ValidatePasswordEventArgs(username, password, true);
            OnValidatingPassword(args);
            if (args.Cancel)
            {
                status = MembershipCreateStatus.InvalidPassword;
                if (args.FailureInformation != null)
                    throw args.FailureInformation;
                return null;
            }

            if (!string.IsNullOrEmpty(email) && !Utils.IsValidEmail(email))
            {
                status = MembershipCreateStatus.InvalidEmail;
                return null;
            }

            if (RequiresUniqueEmail && GetUserNameByEmail(email) != "")
            {
                status = MembershipCreateStatus.DuplicateEmail;
                return null;
            }

            // Check whether user with passed username already exists
            MembershipUser u = GetUser(username, false);

            if (u == null)
            {
                DateTime createDate = DateTime.Now;

                if (providerUserKey == null) providerUserKey = Guid.NewGuid();
                else
                {
                    if (!(providerUserKey is Guid))
                    {
                        status = MembershipCreateStatus.InvalidProviderUserKey;
                        return null;
                    }
                }

                Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
                Data.Magic_Mmb_Users user = new Data.Magic_Mmb_Users
                {
                    Id = (Guid)providerUserKey,
                    Username = username,
                    ApplicationName = applicationName,
                    Email = email,
                    Password = EncodePassword(password),
                    PasswordQuestion = passwordQuestion,
                    PasswordAnswer = passwordAnswer,
                    IsApproved = isApproved,
                    LastActivityDate = createDate,
                    LastLoginDate = DateTime.Now,
                    LastPasswordChangedDate = createDate,
                    CreationDate = createDate,
                    IsOnline = false,
                    IsLockedOut = false,
                    LastLockedOutDate = createDate,
                    FailedPasswordAttemptCount = 0,
                    FailedPasswordAttemptWindowStart = createDate,
                    FailedPasswordAnswerAttemptCount = 0,
                    FailedPasswordAnswerAttemptWindowStart = createDate
                };

                try
                {
                    //context.AddToUser(user);
                    //context.SubmitChanges();
                    context.Magic_Mmb_Users.InsertOnSubmit(user);
                    context.SubmitChanges();
                    status = MembershipCreateStatus.Success;
                }
                catch
                {
                    status = MembershipCreateStatus.UserRejected;
                }

                return GetUser(username, false);
            }
            status = MembershipCreateStatus.DuplicateUserName;

            return null;
        }

        public class CreateUserData
        {
            public string Username { get; set; } //required
            public string Password { get; set; } //required
            public string Email { get; set; } //required
            public int? CultureId { get; set; }
            public string Name { get; set; }
            public string Firstname { get; set; }
            public string Lastname { get; set; }
            public string UserImg { get; set; }
            public string SocialId { get; set; }
            public string SocialProvider { get; set; }
            public string SocialEmail { get; set; }
            public bool? UserIsApproved { get; set; }
        }

        public static string GetUniqueUserName(string name)
        {
            Random rand = new Random();
            string newUsername = name;
            string currentapplication = ApplicationSettingsManager.GetAppInstanceName();
            EFMembershipProvider member = (MagicFramework.MemberShip.EFMembershipProvider)Membership.Providers[currentapplication];
            while (member.GetUser(newUsername, false) != null)
            {
                newUsername = name + "-" + rand.Next(1, 1000);
            }
            return newUsername;
        }

        public static string ValidateCreateUserData(CreateUserData userData)
        {
            if (string.IsNullOrEmpty(userData.Username) || (string.IsNullOrEmpty(userData.Password) && (string.IsNullOrEmpty(userData.SocialId) || string.IsNullOrEmpty(userData.SocialProvider))) || string.IsNullOrEmpty(userData.Email))
            {
                return "Required value not given. (Username, Password or Email)";
            }
            if (Utils.IsValidEmail(userData.Username))
            {
                return "Username can not be an email address";
            }
            if (!Utils.IsValidEmail(userData.Email))
            {
                return "Email is not valid";
            }
            return "";
        }

        public static Data.v_Magic_Mmb_UserExtended CreateUser(CreateUserData userData, out string errorMessage)
        {
            try
            {
                errorMessage = ValidateCreateUserData(userData);
                if (errorMessage != "")
                {
                    return null;
                }
                string currentapplication = ApplicationSettingsManager.GetAppInstanceName();
                EFMembershipProvider member = (MagicFramework.MemberShip.EFMembershipProvider)Membership.Providers[currentapplication];
                MembershipCreateStatus stato = new MembershipCreateStatus();
                var instanceConfig = MFConfiguration.GetApplicationInstanceConfiguration();
                MembershipUser User = member.CreateUser(userData.Username, userData.Password, userData.Email, null, null, userData.UserIsApproved ?? instanceConfig.UserApproval == null, null, out stato);

                if (stato.ToString() != MembershipCreateStatus.Success.ToString())
                {
                    errorMessage = stato.ToString();
                    return null;
                }

                // var connectionString = DBConnectionManager.GetTargetEntityConnectionString();
                Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());

                Data.Magic_Mmb_Users user = (from _user in _context.Magic_Mmb_Users
                                             where _user.Id == (Guid)User.ProviderUserKey
                                             select _user).FirstOrDefault();
                user.FirstName = userData.Firstname;
                user.LastName = userData.Lastname;
                user.Name = userData.Name;
                user.UserImg = userData.UserImg;

                if (!string.IsNullOrEmpty(userData.SocialProvider) && !string.IsNullOrEmpty(userData.SocialId))
                {
                    Data.Magic_Mmb_UsersOAuth oa = new Data.Magic_Mmb_UsersOAuth();
                    oa.ProviderName = userData.SocialProvider;
                    oa.UserSocialId = userData.SocialId;
                    oa.UserSocialEmail = userData.SocialEmail;
                    oa.Magic_Mmb_Users = user;
                    _context.Magic_Mmb_UsersOAuth.InsertOnSubmit(oa);
                }

                _context.SubmitChanges();

                member.SetUserCultureAndOwner(user.UserID, userData.CultureId ?? 76);

                errorMessage = "";
                return (from e in _context.v_Magic_Mmb_UserExtended
                            .Where(_ => _.UserID.Equals(user.UserID))
                        select e).FirstOrDefault();
            }
            catch (Exception e)
            {
                errorMessage = e.Message;
                return null;
            }
        }

        /// <summary>
        /// Processes a request to update the password question and answer for a membership user.
        /// </summary>
        /// <returns>true if the password question and answer are updated successfully; otherwise, false.</returns>
        /// <param name="username">The user to change the password question and answer for.</param>
        /// <param name="password">The password for the specified user.</param>
        /// <param name="newPasswordQuestion">The new password question for the specified user.</param>
        /// <param name="newPasswordAnswer">The new password answer for the specified user.</param>
        public override bool ChangePasswordQuestionAndAnswer(string username, string password,
                                                             string newPasswordQuestion, string newPasswordAnswer)
        {
            //check if user is authenticated
            if (!ValidateUser(username, password)) return false;

            Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
            IQueryable<Data.Magic_Mmb_Users> users = from u in context.Magic_Mmb_Users
                                                     where u.Username == username && u.ApplicationName == applicationName
                                                     select u;

            if (users.Count() != 1) throw new ProviderException("Change password question and answer failed. No unique user found.");

            Data.Magic_Mmb_Users user = users.First();
            user.PasswordAnswer = EncodePassword(newPasswordAnswer);
            user.PasswordQuestion = newPasswordQuestion;

            try
            {
                //context.SubmitChanges();
                context.SubmitChanges();
                return true;
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Gets the password for the specified user name from the data source.
        /// </summary>
        /// <returns>The password for the specified user name.</returns>
        /// <param name="username">The user to retrieve the password for.</param>
        /// <param name="answer">The password answer for the user.</param>
        public override string GetPassword(string username, string answer)
        {
            if (!EnablePasswordRetrieval) throw new ProviderException("Password Retrieval Not Enabled.");

            string password = string.Empty;
            //Data.MagicDBDataContext context = new Data.MagicDBDataContext(MagicFramework.Helpers.SessionHandler.MagicDBConnectionString);
            Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
            IQueryable<Data.Magic_Mmb_Users> users = from u in context.Magic_Mmb_Users
                                                     where u.Username == username && u.ApplicationName == applicationName
                                                     select u;

            if (users.Count() != 1) throw new ProviderException("Get password failed. No unique user found.");

            Data.Magic_Mmb_Users user = users.First();
            if (user != null)
            {
                if (Convert.ToBoolean(user.IsLockedOut)) throw new MembershipPasswordException("The supplied user is locked out.");
            }
            else throw new MembershipPasswordException("The supplied user name is not found.");

            if (RequiresQuestionAndAnswer && !CheckPassword(answer, user.PasswordAnswer))
            {
                UpdateFailureCount(username, "passwordAnswer");
                throw new MembershipPasswordException("Incorrect password answer.");
            }

            if (PasswordFormat == MembershipPasswordFormat.Encrypted) password = UnEncodePassword(user.Password);

            if (PasswordFormat == MembershipPasswordFormat.Hashed)
            {
                //throw new ProviderException("Cannot retrieve Hashed passwords.");                    
                //password = this.ResetPassword(username, null);
                //Restituisco il GUID dell'utente per resettare la password
                password = user.Id.ToString();
            }

            return password;
        }

        /// <summary>
        /// Processes a request to update the password for a membership user.
        /// </summary>
        /// <returns>true if the password was updated successfully; otherwise, false.</returns>
        /// <param name="username">The user to update the password for.</param>
        /// <param name="oldPassword">The current password for the specified user.</param>
        /// <param name="newPassword">The new password for the specified user.</param>
        public override bool ChangePassword(string username, string oldPassword, string newPassword)
        {
            //check if user is authenticated
            if (!ValidateUser(username, oldPassword)) return false;

            if (newPassword == oldPassword)
            {
                throw new MembershipPasswordException("Your new password must be different from the old one");
            }

            ChangePassword(username, newPassword);
            return true;
        }

        public Data.Magic_Mmb_Users ChangePassword(string username, string newPassword)
        {
            //notify that password is going to change
            ValidatePasswordEventArgs args = new ValidatePasswordEventArgs(username, newPassword, true);
            OnValidatingPassword(args);

            if (args.Cancel)
            {
                if (args.FailureInformation != null) throw args.FailureInformation;
                throw new MembershipPasswordException("Cambio password annullato a causa del fallimento della validazione della nuova password.");
            }
            Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
            //Data.MagicDBDataContext context = new Data.MagicDBDataContext(MagicFramework.Helpers.SessionHandler.MagicDBConnectionString);
            IQueryable<Data.Magic_Mmb_Users> users = from u in context.Magic_Mmb_Users
                                                     where u.Username == username && u.ApplicationName == applicationName
                                                     select u;

            if (users.Count() != 1) throw new ProviderException("Change password failed. No unique user found.");

            Data.Magic_Mmb_Users user = users.First();

            if (ConfigurationManager.AppSettings["numOfLastPasswordsToValidate"] != null)
            {
                int numOfLastPasswordsToValidateByEuropeanGDPR = 10;
                int numOfLastPasswordsToValidate = ConfigurationManager.AppSettings["numOfLastPasswordsToValidate"] != null ? Int32.Parse(ConfigurationManager.AppSettings["numOfLastPasswordsToValidate"]) : numOfLastPasswordsToValidateByEuropeanGDPR;

                user.Password = CheckLastPasswords(EncodePassword(newPassword), user.UserID, numOfLastPasswordsToValidate);
            }
            else
            {
                if (ApplicationSettingsManager.getLogToDatabase())
                {
                    bool canDoIt = MFLog.LogChangePasswordAttemptToDataBase(username, HttpContext.Current.Request.UserHostAddress.ToString());
                    if (!canDoIt)
                    {
                        throw new MembershipPasswordException("Too many attempts");
                    }
                }
                user.Password = EncodePassword(newPassword);
            }
            user.LastPasswordChangedDate = DateTime.Now;

            // Check if multiple account update is enabled
            var config = MFConfiguration.GetApplicationInstanceConfiguration();
            if (config.sameEmailMultipleAccountsUpdatePassword)
            {
                try
                {
                    // Create dynamic object for SP input
                    dynamic input = new System.Dynamic.ExpandoObject();
                    input.iduser = user.UserID;
                    input.Username = user.Username;
                    input.Password = user.Password;  // Already encoded password
                    input.Email = user.Email;
                    input.LastPasswordChangedDate = user.LastPasswordChangedDate;

                    // Convert to XML
                    string json = Newtonsoft.Json.JsonConvert.SerializeObject(input);
                    var xml = MagicFramework.Helpers.JsonUtils.Json2Xml(json);

                    // Call the stored procedure
                    var dbutils = new MagicFramework.Helpers.DatabaseCommandUtils();
                    var dbres = dbutils.callStoredProcedurewithXMLInput(xml, "Custom.Magic_Sanitize_Accounts");
                }
                catch (Exception ex)
                {
                    //MembershipPasswordException
                    MFLog.LogInFile(ex, MFLog.logtypes.ERROR);
                    throw new MembershipPasswordException(ex.Message);
                }
            }
            else {
                // if this is not the case, the transaction is handled by the stored procedure
                context.SubmitChanges();
            }
            if (ConfigurationManager.AppSettings["numOfLastPasswordsToValidate"] != null) { 
                InsertIntoLastPasswords(EncodePassword(newPassword), user.UserID);
            }

            return user;
        }

        private string CheckLastPasswords(string newPassword, int UserID, int numberOfLastPasswordsToValidate = 10)
        {
            string lastPasswordsTableName = "Magic_Mmb_UsersPasswords";
            DatabaseCommandUtils dbUtils = new DatabaseCommandUtils();
            if (!dbUtils.CheckTableOrViewExists(lastPasswordsTableName))
            {
                string createLastPasswordsTableSql = "CREATE TABLE [dbo].[Magic_Mmb_UsersPasswords]( [ID] [int] IDENTITY(1,1) NOT NULL, [UserID] [int] NOT NULL, [Password] [nvarchar](100) NOT NULL, [CreationDate] [datetime] NOT NULL, CONSTRAINT[PK_Magic_Mmb_UsersPasswords] PRIMARY KEY CLUSTERED([ID] ASC) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]) ON[PRIMARY]  ALTER TABLE [dbo].[Magic_Mmb_UsersPasswords] ADD CONSTRAINT[DF_Magic_Mmb_UsersPasswords_CreationDate] DEFAULT(getdate()) FOR[CreationDate]  ALTER TABLE [dbo].[Magic_Mmb_UsersPasswords] WITH CHECK ADD CONSTRAINT[FK_Magic_Mmb_Users_Magic_Mmb_UsersPasswords] FOREIGN KEY([UserID]) REFERENCES[dbo].[Magic_Mmb_Users] ([UserID])  ALTER TABLE [dbo].[Magic_Mmb_UsersPasswords] CHECK CONSTRAINT[FK_Magic_Mmb_Users_Magic_Mmb_UsersPasswords]";
                dbUtils.CreateTable(createLastPasswordsTableSql);
            }

            string sqlCommand = "SELECT TOP(" + numberOfLastPasswordsToValidate + ") * FROM dbo.Magic_Mmb_UsersPasswords WHERE UserID = @uid ORDER BY CreationDate DESC";
            DataTable table = new DataTable();
            using (SqlConnection conn = new SqlConnection(DBConnectionManager.GetTargetConnection()))
            {
                using (SqlCommand cmd = new SqlCommand(sqlCommand, conn))
                {
                    cmd.Parameters.AddWithValue("@uid", UserID);
                    cmd.Connection.Open();
                    table.Load(cmd.ExecuteReader());
                    cmd.Connection.Close();
                }
            }
            var result = table.AsEnumerable().ToArray();
            if (result.Length > 0)
            {
                foreach (var row in result)
                {
                    string lastPassword = row["Password"].ToString();
                    if (lastPassword == newPassword)
                    {
                        throw new MembershipPasswordException("Hai già utilizzato questa password in precedenza. La nuova password deve essere diversa dalle ultime " + numberOfLastPasswordsToValidate + " password utilizzate.");
                    }
                }
            }
            return newPassword;
        }

        private void InsertIntoLastPasswords(string password, int userID)
        {
            string sqlCommand = "INSERT INTO [dbo].[Magic_Mmb_UsersPasswords] ([UserID], [Password]) VALUES (@uid,@pw)";

            using (SqlConnection conn = new SqlConnection(DBConnectionManager.GetTargetConnection()))
            {
                using (SqlCommand cmd = new SqlCommand(sqlCommand, conn))
                {
                    conn.Open();
                    cmd.Parameters.AddWithValue("@uid", userID);
                    cmd.Parameters.AddWithValue("@pw", password);
                    cmd.ExecuteNonQuery();
                    cmd.Parameters.Clear();
                    cmd.Dispose();
                }
            }
        }

        public bool AccountIsExpired(int userID)
        {
            DataTable table = new DataTable();
            string sqlCommand = "SELECT * FROM [dbo].[Magic_Mmb_Users_Extensions] WHERE [UserID] = @userIDParam";

            using (SqlConnection conn = new SqlConnection(DBConnectionManager.GetTargetConnection()))
            {
                using (SqlCommand cmd = new SqlCommand(sqlCommand, conn))
                {
                    cmd.Parameters.AddWithValue("@userIDParam", userID);
                    cmd.Connection.Open();
                    table.Load(cmd.ExecuteReader());
                    cmd.Connection.Close();
                }
            }
            if (table.Rows.Count > 0)
            {
                DataRow row = table.Rows[0];
                if (!row.Table.Columns.Contains("DueDate") || (row.Table.Columns.Contains("DueDate") && row.IsNull("DueDate")))
                {
                    return false;           //no column present -> password valid
                } else
                {
                    DateTime dueDate = row.Field<DateTime>("DueDate");
                    if (dueDate < DateTime.Now)
                    {
                        return true;        //password is expired
                    } else
                    {
                        return false;
                    }
                }
            }
            else
            {
                return false;
            }
        }

        /// <summary>
        /// Resets a user's password to a new, automatically generated password.
        /// </summary>
        /// <returns>The new password for the specified user.</returns>
        /// <param name="username">The user to reset the password for.</param>
        /// <param name="answer">The password answer for the specified user.</param>
        public override string ResetPassword(string username, string answer)
        {
            if (!EnablePasswordReset) throw new NotSupportedException("Password reset is not enabled.");

            if (answer == null && RequiresQuestionAndAnswer)
            {
                UpdateFailureCount(username, "passwordAnswer");
                throw new ProviderException("Password answer required for password reset.");
            }

            string newPassword = Membership.GeneratePassword(MinRequiredPasswordLength, MinRequiredNonAlphanumericCharacters);

            //the reset password won't be checked if a custom rule has been set
            if (String.IsNullOrEmpty(this.PasswordStrengthRegularExpression))
            {
                ValidatePasswordEventArgs args = new ValidatePasswordEventArgs(username, newPassword, true);
                OnValidatingPassword(args);

                if (args.Cancel)
                {
                    if (args.FailureInformation != null) throw args.FailureInformation;
                    throw new MembershipPasswordException("Reset password canceled due to password validation failure.");
                }
            }
            Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
            //Data.MagicDBDataContext context = new Data.MagicDBDataContext(MagicFramework.Helpers.SessionHandler.MagicDBConnectionString);
            IQueryable<Data.Magic_Mmb_Users> users = from u in context.Magic_Mmb_Users
                                                     where u.Username == username && u.ApplicationName == applicationName
                                                     select u;

            if (users.Count() != 1) throw new ProviderException("Reset password failed. No unique user found.");

            Data.Magic_Mmb_Users user = users.First();
            if (user != null)
            {
                if (Convert.ToBoolean(user.IsLockedOut)) throw new MembershipPasswordException("The supplied user is locked out.");
            }
            else
            {
                throw new MembershipPasswordException("The supplied user name is not found.");
            }

            if (RequiresQuestionAndAnswer && !CheckPassword(answer, user.PasswordAnswer))
            {
                UpdateFailureCount(username, "passwordAnswer");
                throw new MembershipPasswordException("Incorrect password answer.");
            }

            try
            {
                user.Password = EncodePassword(newPassword);
                user.LastPasswordChangedDate = DateTime.Now;

                context.SubmitChanges();
                return newPassword;
            }
            catch
            {
                throw new MembershipPasswordException("User not found, or user is locked out. Password not Reset.");
            }
        }

        /// <summary>
        /// Updates information about a user in the data source.
        /// </summary>
        /// <param name="membershipUser">A <see cref="T:System.Web.Security.MembershipUser" /> object that represents the user to update and the updated information for the user.</param>
        public override void UpdateUser(MembershipUser membershipUser)
        {
            Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
            IQueryable<Data.Magic_Mmb_Users> users = from u in context.Magic_Mmb_Users
                                                     where u.Username == membershipUser.UserName && u.ApplicationName == applicationName
                                                     select u;

            if (users.Count() != 1) throw new ProviderException("Update user failed. No unique user found.");

            Data.Magic_Mmb_Users user = users.First();
            if (user == null) return;

            user.Email = user.Email;
            user.Comment = user.Comment;
            user.IsApproved = user.IsApproved;
            context.SubmitChanges();
        }

        public Data.Magic_Mmb_Users GetUser(string usernameOrEmail)
        {
            return GetUser(usernameOrEmail, new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection()));
        }

        public Data.Magic_Mmb_Users GetUser(string usernameOrEmail, Data.MagicDBDataContext context)
        {
            bool isEmail = Utils.IsValidEmail(usernameOrEmail);

            IQueryable<Data.Magic_Mmb_Users> users;
            if (!isEmail)
            {
                users = from u in context.Magic_Mmb_Users
                        where u.Username == usernameOrEmail && u.ApplicationName == this.ApplicationName && u.IsLockedOut == false //&& u.IsApproved == true
                        select u;
            }
            else
            {
                users = from u in context.Magic_Mmb_Users
                        where u.Email == usernameOrEmail && u.ApplicationName == this.ApplicationName && u.IsLockedOut == false //&& u.IsApproved == true
                        select u;
            }

            return users.FirstOrDefault();
        }


        public bool isUserLockedOut(string usernameOrEmail)
        {
            Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
            bool isEmail = Utils.IsValidEmail(usernameOrEmail);
            IQueryable<Data.Magic_Mmb_Users> users;
            if (!isEmail)
            {
                users = from u in context.Magic_Mmb_Users
                        where u.Username == usernameOrEmail && u.ApplicationName == this.ApplicationName //&& u.IsApproved == true
                        select u;
            }
            else
            {
                users = from u in context.Magic_Mmb_Users
                        where u.Email == usernameOrEmail && u.ApplicationName == this.ApplicationName //&& u.IsApproved == true
                        select u;
            }
            Data.Magic_Mmb_Users user= users.FirstOrDefault();
            return user != null? user.IsLockedOut ?? false: false;
        }

        /// <summary>
        /// Verifies that the specified user name and password exist in the data source.
        /// </summary>
        /// <returns>true if the specified username and password are valid; otherwise, false.</returns>
        /// <param name="username">The name of the user to validate.</param>
        /// <param name="password">The password for the specified user.</param>
        public override bool ValidateUser(string usernameOrEmail, string password)
        {
            Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
            Data.Magic_Mmb_Users user = GetUser(usernameOrEmail, context);

            if (user == null) return false;

            bool isValid = false;

            if (CheckPassword(password, user.Password))
            {
                if (AccountIsExpired(user.UserID))
                {
                    UpdateFailureCount(user.Username, "accountExpired");
                } else
                {
                    isValid = true;
                    SetUserInfosSession(user, context);
                }
            }
            else
            {
                UpdateFailureCount(user.Username, "password");
            }

            return isValid;
        }

        public static void ActivateChatAndNotifications(MFConfiguration.ApplicationInstanceConfiguration config, string username)
        {
            if (System.Configuration.ConfigurationManager.AppSettings["chatActive"].Equals("true"))
            {
                MagicHub.AddLoggedSessionId(SessionHandler.SessionID, config.appInstancename);
                ChatServer CS = new ChatServer(System.Web.HttpContext.Current.Request.Url.Authority, config.appInstancename);
                CS.Login(username);
            }
        }

        public static void SetConfigSessionAttributes(MFConfiguration.ApplicationInstanceConfiguration config, HttpRequest request)
        {
            SessionHandler.ApplicationInstanceId = config.id;
            SessionHandler.ApplicationInstanceName = config.appInstancename;
            SessionHandler.CustomFolderName = config.customFolderName != null ? config.customFolderName : config.id;
            SessionHandler.ApplicationDomainURL = request.Url.Authority;
            SessionHandler.PowerBiServiceUrl = config.PowerBiServiceUrl != null ? config.PowerBiServiceUrl : "";
            SessionHandler.PowerBiServiceApiKey = config.PowerBiServiceApiKey != null ? config.PowerBiServiceApiKey : "";
            SessionHandler.PowerBiFilterTable = config.PowerBiFilterTable != null ? config.PowerBiFilterTable : "";
        }
        /// <summary>
        /// Runs VisibilityQueries Without using databasecommandutils 
        /// </summary>
        private DataTable RunVisibilityQueries(string param, string connectionString, string queryCode)
        {

            JObject o = JObject.FromObject(new { parameter = param, querycode = queryCode });

            string json = Newtonsoft.Json.JsonConvert.SerializeObject(o);
            var xml = MagicFramework.Helpers.JsonUtils.Json2Xml(json);
            DataTable table = new DataTable();
            int counter = 0;
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                using (SqlCommand CMD = new SqlCommand
                              ("dbo.Magic_SolveVsbltyQueries", conn))
                {
                    CMD.CommandType = CommandType.StoredProcedure;
                    SqlParameter xmlinput = CMD.Parameters.Add
                      ("@xmlInput", SqlDbType.Xml);
                    xmlinput.Value = xml.InnerXml;
                    SqlParameter count = CMD.Parameters.Add
                        ("@count", SqlDbType.Int);
                    count.Direction = ParameterDirection.Output;
                    conn.Open();
                    using (IDataReader reader = CMD.ExecuteReader())
                    {
                        table.Load(reader);
                        counter = int.Parse(count.Value.ToString());
                    }
                }
            }
            return table;

        }

        private Dictionary<int, string> getVisibilityGroups(int userid, string connectionString)
        {
            Dictionary<int, string> list = new Dictionary<int, string>();
            DataTable table = RunVisibilityQueries(userid.ToString(), connectionString, "GROUPSFROMUSERS");

            //0 = ID del gruppo
            foreach (DataRow r in table.Rows)
            {
                list[(int)r[0]] = r.Table.Columns.Count > 7 ? r[7].ToString() : null;
            };

            return list;
        }
        private Dictionary<int, KeyValuePair<int, int>> getUserVisibiltyAndNetworkOwners(List<int> groupids, string connectionString)
        {
            DataTable table = RunVisibilityQueries(String.Join(",", groupids), connectionString, "GROUPSET");
            Dictionary<int, KeyValuePair<int, int>> result = new Dictionary<int, KeyValuePair<int, int>>();
            foreach (DataRow ug in table.Rows)
            {   //0 = a.ID,1= a.Network_ID,2= a.BusinessObject_ID,3= a.ParentGroup_ID,4 = a.Codice,5 = a.Descrizione,6 = b.BusinessObject_ID as NetworkBusinessObject,7 = a.AssignedGroupCode
                if (!result.ContainsKey((int.Parse(ug[1].ToString()))))
                {
                    result.Add((int.Parse(ug[1].ToString())), new KeyValuePair<int, int>((int)(ug[6].ToString() == "" ? -1 : int.Parse(ug[6].ToString())), (int)(ug[2].ToString() == "" ? -1 : int.Parse(ug[2].ToString()))));
                }
            }
            return result;
        }
        private string getUserApplicationProfile(int userid, string connectionString)
        {
            string profiles = String.Empty;
            DataTable result = RunVisibilityQueries(userid.ToString(), connectionString, "USERPROFILES");
            foreach (DataRow pr in result.Rows)
            {
                //ID | Codice | puo' schedulare risorse(dashboard) separati da ;
                profiles += pr[0].ToString() + "|" + pr[1].ToString() + "|" + pr[2].ToString() + ";";
            }
            return profiles;
        }
        private string getUserCompanyRoles(int userid, string connectionString)
        {
            string companyroles = String.Empty;
            DataTable result = RunVisibilityQueries(userid.ToString(), connectionString, "USERCOMPANYROLES");
            foreach (DataRow cr in result.Rows)
            {
                //ID | Codice | ProfileScheduleRights puo' schedulare risorse(dashboard) separati da ;
                companyroles += cr[0].ToString() + "|" + cr[1].ToString() + "|" + cr[2].ToString() + ";";
            }
            return companyroles;
        }

        /// <summary>
        /// Sets userInfoSession without using databasecommandutils which requires a session
        /// </summary>
        /// <param name="user"></param>
        /// <param name="context"></param>
        /// <param name="connectionString"></param>
        /// <param name="isLogin"></param>
        public void SetUserInfosSession(Data.Magic_Mmb_Users user, Data.MagicDBDataContext context, bool isLogin = true)
        {
            if (isLogin)
            {
                user.LastLoginDate = DateTime.Now;
                context.SubmitChanges();
            }
            string connectionString = context.Connection.ConnectionString;
            MagicFramework.Helpers.SessionHandler.IdUser = user.UserID;
            SessionHandler.Username = user.Username;
            MagicFramework.Helpers.SessionHandler.UserFirstName = user.FirstName ?? "";
            MagicFramework.Helpers.SessionHandler.UserLastName = user.LastName ?? "";
            MagicFramework.Helpers.SessionHandler.LoginTimestamp = ((Int32)(DateTime.UtcNow.Subtract(new DateTime(1970, 1, 1))).TotalSeconds).ToString();
            MagicFramework.Helpers.SessionHandler.UserCulture = (int)user.Magic_Mmb_Users_Extensions.Culture_ID;
            MagicFramework.Helpers.SessionHandler.UserCultureCode = (from e in context.Magic_Cultures.Where(w => w.Magic_CultureID == (int)user.Magic_Mmb_Users_Extensions.Culture_ID) select e.Magic_CultureLanguage).FirstOrDefault().ToString();
            MagicFramework.Helpers.SessionHandler.UserIsDeveloper = user.Magic_Mmb_UsersProfiles.Where(x => x.Magic_Mmb_Profiles.ProfileName.ToLower() == "developer").Count() == 0 ? false : true;
            SessionHandler.UserIsApproved = user.IsApproved;
            Dictionary<int, string> UserGroupVisibilities = getVisibilityGroups(user.UserID, connectionString);
            var group = UserGroupVisibilities.FirstOrDefault();
            int? DefaultUserGroupVisibility_ID = user.Magic_Mmb_Users_Extensions.DefaultUserGroupVisibility_ID;
            if (DefaultUserGroupVisibility_ID != null && UserGroupVisibilities.ContainsKey(DefaultUserGroupVisibility_ID ?? 0))
                group = UserGroupVisibilities.Where(x => x.Key.Equals(DefaultUserGroupVisibility_ID)).FirstOrDefault();
            MagicFramework.Helpers.SessionHandler.UserVisibilityGroup = group.Key;
            MagicFramework.Helpers.SessionHandler.userGroupLogo = group.Value;
            MagicFramework.Helpers.CacheHandler.UserLastChangedPassword(user.UserID, user.LastPasswordChangedDate);

            //Vado a Salvare network ed owners di gruppo e Network
            List<int> groups = new List<int>();
            groups.Add(group.Key);
            var dict = getUserVisibiltyAndNetworkOwners(groups, connectionString).FirstOrDefault();
            MagicFramework.Helpers.SessionHandler.UserVisibilityNetwork = dict.Key;
            MagicFramework.Helpers.SessionHandler.UserVisibilityNetworkOwner = dict.Value.Key;
            MagicFramework.Helpers.SessionHandler.UserVisibilityGroupOwner = dict.Value.Value;

            string profiles = getUserApplicationProfile(user.UserID, connectionString);
            string companyroles = getUserCompanyRoles(user.UserID, connectionString);

            MagicFramework.Helpers.SessionHandler.UserApplicationProfiles = profiles;
            MagicFramework.Helpers.SessionHandler.UserCompanyRoles = companyroles;
        }



        /// <summary>
        ///  Clears a lock so that the membership user can be validated.
        /// </summary>
        /// <returns>true if the membership user was successfully unlocked; otherwise, false.</returns>
        /// <param name="userName">The membership user whose lock status you want to clear.</param>
        public override bool UnlockUser(string userName)
        {
            try
            {
                Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
                IQueryable<Data.Magic_Mmb_Users> users = from u in context.Magic_Mmb_Users
                                                         where u.Username == userName && u.ApplicationName == applicationName
                                                         select u;

                if (users.Count() != 1) return false;
                Data.Magic_Mmb_Users user = users.First();
                if (user == null) return false;

                user.IsLockedOut = false;
                user.LastLockedOutDate = DateTime.Now;
                context.SubmitChanges();
                return true;
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Gets user information from the data source based on the unique identifier for the membership user. Provides an option to update the last-activity date/time stamp for the user.
        /// </summary>
        /// <returns>A <see cref="T:System.Web.Security.MembershipUser" /> object populated with the specified user's information from the data source.</returns>
        /// <param name="providerUserKey">The unique identifier for the membership user to get information for.</param>
        /// <param name="userIsOnline">true to update the last-activity date/time stamp for the user; false to return user information without updating the last-activity date/time stamp for the user.</param>
        public override MembershipUser GetUser(object providerUserKey, bool userIsOnline)
        {
            MembershipUser membershipUser = null;

            Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());

            IQueryable<Data.Magic_Mmb_Users> users = from u in context.Magic_Mmb_Users
                                                     where u.Id == (Guid)providerUserKey && u.ApplicationName == applicationName
                                                     select u;

            if (users.Count() == 1)
            {
                Data.Magic_Mmb_Users user = users.First();
                if (user != null)
                {
                    membershipUser = GetMembershipUserFromPersitentObject(user);

                    if (userIsOnline)
                    {
                        user.LastActivityDate = DateTime.Now;
                        context.SubmitChanges();
                    }
                }
            }

            return membershipUser;
        }

        /// <summary>
        /// Gets information from the data source for a user. Provides an option to update the last-activity date/time stamp for the user.
        /// </summary>
        /// <returns>A <see cref="T:System.Web.Security.MembershipUser" /> object populated with the specified user's information from the data source.</returns>
        /// <param name="username">The name of the user to get information for.</param>
        /// <param name="userIsOnline">true to update the last-activity date/time stamp for the user; false to return user information without updating the last-activity date/time stamp for the user.</param>
        public override MembershipUser GetUser(string username, bool userIsOnline)
        {
            MembershipUser membershipUser = null;

            Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
            IQueryable<Data.Magic_Mmb_Users> users = from u in context.Magic_Mmb_Users
                                                     where u.Username == username && u.ApplicationName == applicationName
                                                     select u;

            if (users.Count() == 1)
            {
                Data.Magic_Mmb_Users user = users.First();
                if (user != null)
                {
                    membershipUser = GetMembershipUserFromPersitentObject(user);

                    if (userIsOnline)
                    {
                        user.LastActivityDate = DateTime.Now;
                        context.SubmitChanges();
                    }
                }
            }

            return membershipUser;
        }

        /// <summary>
        /// Gets the user name associated with the specified e-mail address.
        /// </summary>
        /// <returns>The user name associated with the specified e-mail address. If no match is found, return null.</returns>
        /// <param name="email">The e-mail address to search for.</param>
        public override string GetUserNameByEmail(string email)
        {
            try
            {
                Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
                IQueryable<Data.Magic_Mmb_Users> users = from u in context.Magic_Mmb_Users
                                                         where u.Email == email && u.ApplicationName == applicationName
                                                         select u;

                if (users.Count() != 1) return string.Empty;

                Data.Magic_Mmb_Users user = users.First();
                return user != null ? user.Username : string.Empty;
            }
            catch
            {
                return string.Empty;
            }
        }

        /// <summary>
        /// Removes a user from the membership data source. 
        /// </summary>
        /// <returns>true if the user was successfully deleted; otherwise, false.</returns>
        /// <param name="username">The name of the user to delete.</param>
        /// <param name="deleteAllRelatedData">true to delete data related to the user from the database; false to leave data related to the user in the database.</param>
        public override bool DeleteUser(string username, bool deleteAllRelatedData)
        {
            try
            {
                Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
                IQueryable<Data.Magic_Mmb_Users> users = from u in context.Magic_Mmb_Users
                                                         where u.Username == username && u.ApplicationName == applicationName
                                                         select u;

                if (users.Count() != 1) return false;

                Data.Magic_Mmb_Users user = users.First();
                //context.DeleteObject(user);
                context.Magic_Mmb_Users.DeleteOnSubmit(user);
                context.SubmitChanges();

                if (deleteAllRelatedData)
                {
                    // TODO: delete user related data
                }
                return true;
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Gets a collection of all the users in the data source in pages of data.
        /// </summary>
        /// <returns>
        /// A <see cref="T:System.Web.Security.MembershipUserCollection" /> collection that contains a page of <paramref name="pageSize" /><see cref="T:System.Web.Security.MembershipUser" /> objects beginning at the page specified by <paramref name="pageIndex" />.
        /// </returns>
        /// <param name="pageIndex">The index of the page of results to return. <paramref name="pageIndex" /> is zero-based.</param>
        /// <param name="pageSize">The size of the page of results to return.</param>
        /// <param name="totalRecords">The total number of matched users.</param>
        public override MembershipUserCollection GetAllUsers(int pageIndex, int pageSize, out int totalRecords)
        {
            MembershipUserCollection users = new MembershipUserCollection();

            //retrieve all users for the current application name from the database
            Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());

            totalRecords = (from u in context.Magic_Mmb_Users
                            where u.ApplicationName == applicationName
                            select u).Distinct().Count();
            if (totalRecords <= 0) return users;

            IQueryable<Data.Magic_Mmb_Users> efUsers = (from u in context.Magic_Mmb_Users
                                                        where u.ApplicationName == applicationName
                                                        orderby u.Username
                                                        select u).Skip(pageIndex * pageSize).Take(pageSize);

            foreach (Data.Magic_Mmb_Users user in efUsers)
            {
                users.Add(GetMembershipUserFromPersitentObject(user));
            }

            return users;
        }

        /// <summary>
        /// Gets the number of users currently accessing the application.
        /// </summary>
        /// <returns>The number of users currently accessing the application.</returns>
        public override int GetNumberOfUsersOnline()
        {
            TimeSpan onlineSpan = new TimeSpan(0, Membership.UserIsOnlineTimeWindow, 0);
            DateTime compareTime = DateTime.Now.Subtract(onlineSpan);

            Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());

            return (from u in context.Magic_Mmb_Users
                    where u.ApplicationName == applicationName && u.LastActivityDate > compareTime
                    select u).Distinct().Count();
        }

        /// <summary>
        /// Gets a collection of membership users where the user name contains the specified user name to match.
        /// </summary>
        /// <returns>
        /// A <see cref="T:System.Web.Security.MembershipUserCollection" /> collection that contains a page of <paramref name="pageSize" /><see cref="T:System.Web.Security.MembershipUser" /> objects beginning at the page specified by <paramref name="pageIndex" />.
        /// </returns>
        /// <param name="usernameToMatch">The user name to search for.</param>
        /// <param name="pageIndex">The index of the page of results to return. <paramref name="pageIndex" /> is zero-based.</param>
        /// <param name="pageSize">The size of the page of results to return.</param>
        /// <param name="totalRecords">The total number of matched users.</param>
        public override MembershipUserCollection FindUsersByName(string usernameToMatch, int pageIndex, int pageSize, out int totalRecords)
        {
            MembershipUserCollection membershipUsers = new MembershipUserCollection();
            Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
            IQueryable<Data.Magic_Mmb_Users> users = from u in context.Magic_Mmb_Users
                                                     where u.Username.Contains(usernameToMatch) && u.ApplicationName == applicationName
                                                     orderby u.Username
                                                     select u;

            totalRecords = users.Count();
            if (users.Count() <= 0) return membershipUsers;

            foreach (Data.Magic_Mmb_Users user in users.Skip(pageIndex * pageSize).Take(pageSize))
            {
                membershipUsers.Add(GetMembershipUserFromPersitentObject(user));
            }

            return membershipUsers;
        }

        /// <summary>
        /// Gets a collection of membership users where the e-mail address contains the specified e-mail address to match.
        /// </summary>
        /// <returns>
        /// A <see cref="T:System.Web.Security.MembershipUserCollection" /> collection that contains a page of <paramref name="pageSize" /><see cref="T:System.Web.Security.MembershipUser" /> objects beginning at the page specified by <paramref name="pageIndex" />.
        /// </returns>
        /// <param name="emailToMatch">The e-mail address to search for.</param>
        /// <param name="pageIndex">The index of the page of results to return. <paramref name="pageIndex" /> is zero-based.</param>
        /// <param name="pageSize">The size of the page of results to return.</param>
        /// <param name="totalRecords">The total number of matched users.</param>
        public override MembershipUserCollection FindUsersByEmail(string emailToMatch, int pageIndex, int pageSize, out int totalRecords)
        {
            MembershipUserCollection membershipUsers = new MembershipUserCollection();
            Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
            IQueryable<Data.Magic_Mmb_Users> users = from u in context.Magic_Mmb_Users
                                                     where u.Email.Contains(emailToMatch) && u.ApplicationName == applicationName
                                                     select u;

            totalRecords = users.Count();
            if (users.Count() <= 0) return membershipUsers;

            foreach (Data.Magic_Mmb_Users user in users.Skip(pageIndex * pageSize).Take(pageSize))
            {
                membershipUsers.Add(GetMembershipUserFromPersitentObject(user));
            }

            return membershipUsers;
        }

        #endregion

        #region private methods
        /// <summary>
        /// A helper function that takes the current persistent user and creates a MembershiUser from the values.
        /// </summary>
        /// <param name="user">user object containing the user data retrieved from database</param>
        /// <returns>membership user object</returns>
        private MembershipUser GetMembershipUserFromPersitentObject(MagicFramework.Data.Magic_Mmb_Users user)
        {
            return new MembershipUser(Name,
                                      user.Username,
                                      user.Id,
                                      user.Email,
                                      user.PasswordQuestion,
                                      user.Comment,
                                      user.IsApproved,
                                      Convert.ToBoolean(user.IsLockedOut),
                                      Convert.ToDateTime(user.CreationDate),
                                      Convert.ToDateTime(user.LastLoginDate),
                                      Convert.ToDateTime(user.LastActivityDate),
                                      Convert.ToDateTime(user.LastPasswordChangedDate),
                                      Convert.ToDateTime(user.LastLockedOutDate));
        }

        /// <summary>
        /// A helper method that performs the checks and updates associated with password failure tracking.
        /// </summary>
        public void UpdateFailureCount(string username, string failureType)
        {
            Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
            IQueryable<Data.Magic_Mmb_Users> users = from u in context.Magic_Mmb_Users
                                                     where u.Username == username && u.ApplicationName == applicationName
                                                     select u;

            if (users.Count() != 1) throw new ProviderException("Update failure count failed. No unique user found.");

            Data.Magic_Mmb_Users user = users.First();

            DateTime windowStart = new DateTime();
            int failureCount = 0;

            if (failureType == "password")
            {
                failureCount = Convert.ToInt32(user.FailedPasswordAttemptCount);
                windowStart = Convert.ToDateTime(user.FailedPasswordAttemptWindowStart);
            }

            if (failureType == "passwordAnswer")
            {
                failureCount = Convert.ToInt32(user.FailedPasswordAnswerAttemptCount);
                windowStart = Convert.ToDateTime(user.FailedPasswordAnswerAttemptWindowStart);
            }

            DateTime windowEnd = windowStart.AddMinutes(PasswordAttemptWindow);

            if (failureCount == 0 || DateTime.Now > windowEnd)
            {
                // First password failure or outside of PasswordAttemptWindow. 
                // Start a new password failure count from 1 and a new window starting now.
                if (failureType == "password")
                {
                    user.FailedPasswordAttemptCount = 1;
                    user.FailedPasswordAttemptWindowStart = DateTime.Now;
                }
                if (failureType == "passwordAnswer")
                {
                    user.FailedPasswordAnswerAttemptCount = 1;
                    user.FailedPasswordAnswerAttemptWindowStart = DateTime.Now;
                }

                try
                {
                    context.SubmitChanges();
                }
                catch
                {
                    throw new ProviderException("Unable to update failure count and window start.");
                }
            }
            else
            {
                if (failureCount++ >= MaxInvalidPasswordAttempts)
                {
                    // Max password attempts have exceeded the failure threshold. Lock out the user.
                    user.IsLockedOut = true;
                    user.LastLockedOutDate = DateTime.Now;

                    try
                    {
                        context.SubmitChanges();
                    }
                    catch
                    {
                        throw new ProviderException("Unable to lock out user.");
                    }
                }
                else
                {
                    // Max password attempts have not exceeded the failure threshold. Update
                    // the failure counts. Leave the window the same.
                    if (failureType == "password")
                    {
                        user.FailedPasswordAttemptCount = failureCount;
                    }
                    if (failureType == "passwordAnswer")
                    {
                        user.FailedPasswordAnswerAttemptCount = failureCount;
                    }

                    try
                    {
                        context.SubmitChanges();
                    }
                    catch
                    {
                        throw new ProviderException("Unable to update failure count.");
                    }
                }
            }
        }

        /// <summary>
        /// Compares password values based on the MembershipPasswordFormat.
        /// </summary>
        /// <param name="password">password</param>
        /// <param name="dbpassword">database password</param>
        /// <returns>whether the passwords are identical</returns>
        public bool CheckPassword(string password, string dbpassword)
        {
            string pass1 = password;
            string pass2 = dbpassword;

            switch (PasswordFormat)
            {
                case MembershipPasswordFormat.Encrypted:
                    pass2 = UnEncodePassword(dbpassword);
                    break;
                case MembershipPasswordFormat.Hashed:
                    pass1 = EncodePassword(password);
                    break;
                default:
                    break;
            }

            return pass1 == pass2;
        }

        /// <summary>
        /// Encrypts, Hashes, or leaves the password clear based on the PasswordFormat.
        /// </summary>
        /// <param name="password"></param>
        /// <returns></returns>
        private string EncodePassword(string password)
        {
            string encodedPassword = password;

            switch (PasswordFormat)
            {
                case MembershipPasswordFormat.Clear:
                    break;
                case MembershipPasswordFormat.Encrypted:
                    encodedPassword = Convert.ToBase64String(EncryptPassword(Encoding.Unicode.GetBytes(password)));
                    break;
                case MembershipPasswordFormat.Hashed:
                    HMACSHA1 hash = new HMACSHA1 { Key = HexToByte(machineKey.ValidationKey) };
                    encodedPassword = Convert.ToBase64String(hash.ComputeHash(Encoding.Unicode.GetBytes(password)));
                    break;
                default:
                    throw new ProviderException("Unsupported password format.");
            }

            return encodedPassword;
        }

        public PasswordInfo RandomPassword()
        {
            string randomPassword = Crypto.RandomString(20);
            return new PasswordInfo
            {
                Password = randomPassword,
                PasswordHash = EncodePassword(randomPassword),
            };
        }

        /// <summary>
        /// Decrypts or leaves the password clear based on the PasswordFormat.
        /// </summary>
        /// <param name="encodedPassword"></param>
        /// <returns></returns>
        private string UnEncodePassword(string encodedPassword)
        {
            string password = encodedPassword;

            switch (PasswordFormat)
            {
                case MembershipPasswordFormat.Clear:
                    break;
                case MembershipPasswordFormat.Encrypted:
                    password = Encoding.Unicode.GetString(DecryptPassword(Convert.FromBase64String(password)));
                    break;
                case MembershipPasswordFormat.Hashed:
                    throw new ProviderException("Cannot unencode a hashed password.");
                default:
                    throw new ProviderException("Unsupported password format.");
            }

            return password;
        }

        /// <summary>
        /// Converts a hexadecimal string to a byte array. Used to convert encryption key values from the configuration.
        /// </summary>
        /// <param name="hexString"></param>
        /// <returns></returns>
        private static byte[] HexToByte(string hexString)
        {
            byte[] returnBytes = new byte[hexString.Length / 2];
            for (int i = 0; i < returnBytes.Length; i++)
            {
                returnBytes[i] = Convert.ToByte(hexString.Substring(i * 2, 2), 16);
            }
            return returnBytes;
        }

        /// <summary>
        /// A helper function to retrieve config values from the configuration file.
        /// </summary>
        /// <param name="configValue"></param>
        /// <param name="defaultValue"></param>
        /// <returns></returns>
        private static string GetConfigValue(string configValue, string defaultValue)
        {
            return String.IsNullOrEmpty(configValue) ? defaultValue : configValue;
        }
        #endregion

        public class PasswordInfo
        {
            public string Password { get; set; }
            public string PasswordHash { get; set; }
        }
    }
}
