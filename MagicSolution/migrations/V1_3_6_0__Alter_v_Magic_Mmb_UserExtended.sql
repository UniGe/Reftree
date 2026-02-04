IF OBJECT_ID(N'dbo.v_Magic_Mmb_UserExtended') IS NOT NULL
   AND OBJECTPROPERTY(OBJECT_ID(N'dbo.v_Magic_Mmb_UserExtended'), N'IsView') = 1
    DROP VIEW dbo.v_Magic_Mmb_UserExtended;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

CREATE VIEW [dbo].[v_Magic_Mmb_UserExtended]
AS
SELECT u.[Id],
       u.[UserID],
       u.Name,
       u.CreationDate,
       u.Username,
       u.FirstName,
       u.LastName,
       u.ApplicationName,
       u.Email,
       u.Password,
       u.PasswordQuestion,
       u.PasswordAnswer,
       u.IsApproved,
       u.LastActivityDate,
       u.LastLoginDate,
       u.LastPasswordChangedDate,
       u.IsOnline,
       u.IsLockedOut,
       u.LastLockedOutDate,
       u.FailedPasswordAttemptCount,
       u.FailedPasswordAttemptWindowStart,
       u.FailedPasswordAnswerAttemptCount,
       u.FailedPasswordAnswerAttemptWindowStart,
       u.LastModified,
       u.Comment,
       u.UserImg,
       e.Culture_ID,
       e.CreatorUserGroupVisibility_ID,
       e.UserSymbolImg,
       e.PersonalWebSite,
       e.Mobile,
       e.Telephone,
       e.CompanyName,
       e.CompanyWebSite,
       e.CompanyInfo,
       e.MailProtocol,
       e.MailServerURL,
       e.MailPort,
       e.MailSSL,
       e.MailPassword,
       e.SMTPServerURL,
       e.SMTPPort,
       e.SMTPSSL,
       e.SMTPPassword,
       e.GoogleCalendarEmail,
       e.SMTPAccountName,
       e.MailAccountName,
       ISNULL(u.FirstName + ' ' + u.LastName + ' mailto:' + u.Email, u.Username + ' mailto:' + u.Email) AS UserDescription,
       e.DueDate
--,COALESCE(mmup2.DefaultModule_ID,mmpm.Module_ID,0) AS DefaultModule_ID
FROM [dbo].[Magic_Mmb_Users] u
    INNER JOIN [dbo].[Magic_Mmb_Users_Extensions] e
        ON e.UserID = u.UserID;
GO