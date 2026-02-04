using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Web;
using MagicFramework.Helpers;

namespace MagicFramework.Models
{
    public class Magic_Mmb_Users
    {
        public Guid Id { get; set; }
        public int UserID { get; set; }
        public string Name { get; set; }
        public DateTime? CreationDate { get; set; }
        public string Username { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string ApplicationName { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string PasswordQuestion { get; set; }
        public string PasswordAnswer { get; set; }
        public bool IsApproved { get; set; }
        public DateTime? LastActivityDate { get; set; }
        public DateTime? LastLoginDate { get; set; }
        public DateTime? LastPasswordChangedDate { get; set; }
        public bool? IsOnline { get; set; }
        public bool? IsLockedOut { get; set; }
        public DateTime? LastLockedOutDate { get; set; }
        public int? FailedPasswordAttemptCount { get; set; }
        public DateTime? FailedPasswordAttemptWindowStart { get; set; }
        public int? FailedPasswordAnswerAttemptCount { get; set; }
        public DateTime? FailedPasswordAnswerAttemptWindowStart { get; set; }
        public DateTime? LastModified { get; set; }
        public string Comment { get; set; }
        public String UserImg { get; set; }
        public int? Culture_ID { get; set; }
        public string CompanyName { get; set; }
        public string CompanyWebSite { get; set; }
        public string CompanyInfo { get; set; }
        public string Mobile { get; set; }
        public string PersonalwebSite { get; set; }
        public string Telephone { get; set; }
        public string UserSymbolImg { get; set; }
        public string MailProtocol { get; set; }
        public string MailServerURL { get; set; }
        public string MailPassword { get; set; }
        public string MailPort { get; set; }
        public bool MailSSL { get; set; }
        public string SMTPServerURL { get; set; }
        public string SMTPPassword { get; set; }
        public string SMTPPort { get; set; }
        public bool SMTPSSL { get; set; }
        public string GoogleCalendarMail { get; set; }
        public string SMTPAccountName { get; set; }
        public string MailAccountName { get; set; }

        public Magic_Mmb_Users(MagicFramework.Data.Magic_Mmb_Users A)
        {
            this.Id = A.Id;
            this.UserID = A.UserID;
            this.Name = A.Name;
            this.CreationDate = A.CreationDate;
            this.Username = A.Username;
            this.FirstName = A.FirstName;
            this.LastName = A.LastName;
            this.ApplicationName = A.ApplicationName;
            this.Email = A.Email;
            this.Password = A.Password;
            this.PasswordQuestion = A.PasswordQuestion;
            this.PasswordAnswer = A.PasswordAnswer;
            this.IsApproved = A.IsApproved;
            this.LastActivityDate = A.LastActivityDate;
            this.LastLoginDate = A.LastLoginDate;
            this.LastPasswordChangedDate = A.LastPasswordChangedDate;
            this.IsOnline = A.IsOnline;
            this.IsLockedOut = A.IsLockedOut;
            this.LastLockedOutDate = A.LastLockedOutDate;
            this.FailedPasswordAttemptCount = (int)(A.FailedPasswordAttemptCount ?? 0);
            this.FailedPasswordAttemptWindowStart = A.FailedPasswordAttemptWindowStart;
            this.FailedPasswordAnswerAttemptCount = (int)(A.FailedPasswordAnswerAttemptCount ?? 0);
            this.FailedPasswordAnswerAttemptWindowStart = A.FailedPasswordAnswerAttemptWindowStart;
            this.LastModified = A.LastModified;
            this.Comment = A.Comment;
            this.UserImg = A.UserImg;
            this.Culture_ID = A.Magic_Mmb_Users_Extensions.Culture_ID;
            this.CompanyInfo = A.Magic_Mmb_Users_Extensions.CompanyInfo;
            this.CompanyName = A.Magic_Mmb_Users_Extensions.CompanyName;
            this.CompanyWebSite = A.Magic_Mmb_Users_Extensions.CompanyWebSite;
            this.PersonalwebSite = A.Magic_Mmb_Users_Extensions.PersonalWebSite;
            this.Telephone = A.Magic_Mmb_Users_Extensions.Telephone;
            this.Mobile = A.Magic_Mmb_Users_Extensions.Mobile;
            this.UserSymbolImg = A.Magic_Mmb_Users_Extensions.UserSymbolImg;
        }

        public Magic_Mmb_Users(MagicFramework.Data.v_Magic_Mmb_UserExtended A)
        {
            this.Id = A.Id;
            this.UserID = A.UserID;
            this.Name = A.Name;
            this.CreationDate = A.CreationDate;
            this.Username = A.Username;
            this.FirstName = A.FirstName;
            this.LastName = A.LastName;
            this.ApplicationName = A.ApplicationName;
            this.Email = A.Email;
            this.Password = A.Password;
            this.PasswordQuestion = A.PasswordQuestion;
            this.PasswordAnswer = A.PasswordAnswer;
            this.IsApproved = A.IsApproved;
            this.LastActivityDate = A.LastActivityDate;
            this.LastLoginDate = A.LastLoginDate;
            this.LastPasswordChangedDate = A.LastPasswordChangedDate;
            this.IsOnline = A.IsOnline;
            this.IsLockedOut = A.IsLockedOut;
            this.LastLockedOutDate = A.LastLockedOutDate;
            this.FailedPasswordAttemptCount = (int)(A.FailedPasswordAttemptCount ?? 0);
            this.FailedPasswordAttemptWindowStart = A.FailedPasswordAttemptWindowStart;
            this.FailedPasswordAnswerAttemptCount = (int)(A.FailedPasswordAnswerAttemptCount ?? 0);
            this.FailedPasswordAnswerAttemptWindowStart = A.FailedPasswordAnswerAttemptWindowStart;
            this.LastModified = A.LastModified;
            this.Comment = A.Comment;
            this.UserImg = A.UserImg;
            this.Culture_ID = A.Culture_ID;
            this.CompanyInfo = A.CompanyInfo;
            this.CompanyName = A.CompanyName;
            this.CompanyWebSite = A.CompanyWebSite;
            this.PersonalwebSite = A.PersonalWebSite;
            this.Telephone = A.Telephone;
            this.Mobile = A.Mobile;
            this.UserSymbolImg = A.UserSymbolImg;
            this.MailAccountName = A.MailAccountName;
            try
            {
                this.MailPassword = StringCipher.Decrypt(A.MailPassword, "xyz");
            }
            catch { this.MailPassword = null; }

            this.MailPort = A.MailPort;
            this.MailProtocol = A.MailProtocol;
            this.MailSSL = A.MailSSL ?? true;
            this.MailServerURL = A.MailServerURL;
            try
            {
                this.SMTPPassword = StringCipher.Decrypt(A.SMTPPassword, "xyz");
            }
            catch
            {
                this.SMTPPassword = null;
            }
            this.SMTPPort = A.SMTPPort;
            this.SMTPServerURL = A.SMTPServerURL;
            this.SMTPSSL = A.SMTPSSL ?? true;
            this.GoogleCalendarMail = A.GoogleCalendarEmail;
            this.SMTPAccountName = A.SMTPAccountName;
        }
        public Magic_Mmb_Users(DataRow A)
        {
            this.Id = Guid.Parse(A[0].ToString());
            this.UserID = int.Parse(A[1].ToString());
            this.Name = A[2].ToString();
            this.CreationDate = DateTime.Parse(solveNullableDataRowsDateTime(A[3].ToString()));
            this.Username = A[4].ToString();
            this.FirstName = A[5].ToString();
            this.LastName = A[6].ToString();
            this.ApplicationName = A[7].ToString();
            this.Email = A[8].ToString();
            this.Password = A[9].ToString();
            this.PasswordQuestion = A[10].ToString();
            this.PasswordAnswer = A[11].ToString();
            this.IsApproved = bool.Parse(A[12].ToString());
            this.LastActivityDate = DateTime.Parse(solveNullableDataRowsDateTime(A[13].ToString()));
            this.LastLoginDate = DateTime.Parse(solveNullableDataRowsDateTime(A[14].ToString()));
            this.LastPasswordChangedDate = DateTime.Parse(solveNullableDataRowsDateTime(A[15].ToString()));
            this.IsOnline = bool.Parse(solveNullableDataRowsBool(A[16].ToString()));
            this.IsLockedOut = bool.Parse(solveNullableDataRowsBool(A[17].ToString())); ;
            this.LastLockedOutDate = DateTime.Parse(solveNullableDataRowsDateTime(A[18].ToString()));
            this.FailedPasswordAttemptCount = int.Parse(A[19].ToString() == "" ? "0" : A[19].ToString());
            this.FailedPasswordAttemptWindowStart = null;
            this.FailedPasswordAnswerAttemptCount = 0;
            this.FailedPasswordAnswerAttemptWindowStart = null;
            this.LastModified = null;
            this.Comment = A[24].ToString();
            this.UserImg = A[25].ToString();
            this.Culture_ID = int.Parse(A[26].ToString());
            this.CompanyInfo = A[26].ToString();
            this.CompanyName = A[27].ToString();
            this.CompanyWebSite = A[28].ToString();
            this.PersonalwebSite = A[29].ToString();
            this.Telephone = A[30].ToString();
            this.Mobile = A[31].ToString();
            this.UserSymbolImg = A[32].ToString();
        }

        private string solveNullableDataRowsDateTime(string date)
        {
            if (date == "")
                return DateTime.MinValue.ToString();
            else
                return
               date;
        }

        private string solveNullableDataRowsBool(string boolvalue)
        {
            if (boolvalue == "")
                return false.ToString();
            else
                return
               boolvalue;
        }

    }
}
