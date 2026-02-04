GO
ALTER TABLE Magic_MMB_Users
ALTER COLUMN Email nvarchar(320)  NOT NULL
GO

ALTER TABLE Magic_MMB_Users
ALTER COLUMN LastName nvarchar(100)   NULL
GO

ALTER TABLE Magic_MMB_Users
ALTER COLUMN FirstName nvarchar(100)   NULL
GO
ALTER TABLE Magic_MMB_Users
ALTER COLUMN Name nvarchar(500)   NULL
GO

ALTER TABLE Magic_MMB_Users
ALTER COLUMN Name nvarchar(500)   NULL
GO

ALTER TABLE Magic_MMB_Users
ALTER COLUMN [Username]  nvarchar(320)   NULL
GO

ALTER VIEW [dbo].[v_Magic_Mmb_UserExtended] as
SELECT u.[Id]
      ,u.[UserID]
      ,u.[Name]
      ,u.[CreationDate]
      ,u.[Username]
      ,u.[FirstName]
      ,u.[LastName]
      ,u.[ApplicationName]
      ,u.[Email]
      ,u.[Password]
      ,u.[PasswordQuestion]
      ,u.[PasswordAnswer]
      ,u.[IsApproved]
      ,u.[LastActivityDate]
      ,u.[LastLoginDate]
      ,u.[LastPasswordChangedDate]
      ,u.[IsOnline]
      ,u.[IsLockedOut]
      ,u.[LastLockedOutDate]
      ,u.[FailedPasswordAttemptCount]
      ,u.[FailedPasswordAttemptWindowStart]
      ,u.[FailedPasswordAnswerAttemptCount]
      ,u.[FailedPasswordAnswerAttemptWindowStart]
      ,u.[LastModified]
      ,u.[Comment]
      ,u.[UserImg]
	  ,e.[Culture_ID]
	  ,e.[CreatorUserGroupVisibility_ID]
	  ,e.[UserSymbolImg]
	  ,e.[PersonalWebSite]
	  ,e.[Mobile]
	  ,e.[Telephone]
	  ,e.[CompanyName]
	  ,e.[CompanyWebSite]
	  ,e.[CompanyInfo]
	  ,e.[MailProtocol]
	  ,e.[MailServerURL]
	  ,e.[MailPort]
	  ,e.[MailSSL]
	  ,e.[MailPassword]
	  ,e.[SMTPServerURL]
	  ,e.[SMTPPort]
	  ,e.[SMTPSSL]
	  ,e.[SMTPPassword]
	  ,e.GoogleCalendarEmail
	  ,e.SMTPAccountName
	  , e.MailAccountName
	  ,isnull(u.FirstName +' '+ u.LastName+' mailto:'+u.Email,username + ' mailto:' +u.Email) as UserDescription
	  --,COALESCE(mmup2.DefaultModule_ID,mmpm.Module_ID,0) AS DefaultModule_ID
  FROM [dbo].[Magic_Mmb_Users] u
  inner join [dbo].[Magic_Mmb_Users_Extensions] e
  on e.UserID = u.UserID
GO


ALTER VIEW [dbo].[v_Magic_Mmb_UsersProfiles]
AS
SELECT     0 AS Checked, dbo.Magic_Mmb_UsersProfiles.ID, dbo.Magic_Mmb_Profiles.ProfileID, dbo.Magic_Mmb_Profiles.ProfileName, dbo.Magic_Mmb_Users.UserID, 
                      dbo.Magic_Mmb_Users.Name, dbo.Magic_Mmb_Users.Username, dbo.Magic_Mmb_Users.FirstName, dbo.Magic_Mmb_Users.LastName
FROM         dbo.Magic_Mmb_UsersProfiles INNER JOIN
                      dbo.Magic_Mmb_Users ON dbo.Magic_Mmb_UsersProfiles.User_ID = dbo.Magic_Mmb_Users.UserID INNER JOIN
                      dbo.Magic_Mmb_Profiles ON dbo.Magic_Mmb_UsersProfiles.Profile_ID = dbo.Magic_Mmb_Profiles.ProfileID