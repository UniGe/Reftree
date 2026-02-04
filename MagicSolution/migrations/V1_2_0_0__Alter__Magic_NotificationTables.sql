IF NOT EXISTS(SELECT 1
	FROM INFORMATION_SCHEMA.COLUMNS AS c
	WHERE 
	c.TABLE_SCHEMA = N'dbo'
	AND c.TABLE_NAME = N'Magic_NotificationQueue'
	AND c.COLUMN_NAME = N'display_modal_unread')
begin
	ALTER TABLE dbo.Magic_NotificationQueue
	ADD display_modal_unread bit NOT NULL DEFAULT 0 ;
end 

GO


IF EXISTS (   SELECT 1
                  FROM INFORMATION_SCHEMA.TABLES AS t
                  WHERE t.TABLE_SCHEMA = N'dbo'
                  AND   t.TABLE_NAME = N'V_Magic_NotificationQueue'
                  AND   t.TABLE_TYPE = N'VIEW')
    DROP VIEW [dbo].V_Magic_NotificationQueue
GO

CREATE VIEW [dbo].[V_Magic_NotificationQueue] AS
SELECT q.[id]
      ,q.[creationDate]
      ,q.[user_id]
	  ,mmu.Username
      ,q.[notificationType_ID]
	  ,T.code AS notificationType
      ,q.[notified]
      ,q.[notified_at]
      ,q.[send_attempts]
      ,q.[last_attempt]
      ,q.[message]
      ,q.[error]
      ,q.[provider_ID]
      ,q.[mobile] 
	  ,p.[Code] AS providercode
	  ,p.[Description] AS providerdescription
	  ,p.[Server_url]
	  ,p.[Credential_user]
	  ,p.[Credential_pwd]
	  ,p.[License_key]
	  ,q.readByUser
	  ,q.can_reply
	  ,q.DocumentRepository_ID
	  ,q.function_filter
	  ,q.function_link
	  ,q.sender_user_id
	  ,d.DocumentJSONTags as tags
	  ,mmu2.Email + ' - ' +mmu2.Username as sender_user
	  ,dbo.Magic_GetGridMessageReceivers(q.DocumentRepository_ID) as ThreadMembers
	  ,q.display_modal_unread
	  ,CAST(CASE WHEN [message] like '%"type":"error"%' then 1 else 0 end as bit) as isAnError
	  FROM [dbo].[Magic_NotificationQueue] q 
	  LEFT JOIN dbo.Magic_Mmb_Users mmu
	  ON mmu.UserID = q.user_id
	  LEFT JOIN dbo.Magic_Mmb_Users mmu2
	  ON mmu2.UserID = q.sender_user_id
	  INNER JOIN [dbo].[Magic_NotificationTypes] T
	  ON T.id = q.[notificationType_ID]
	  LEFT JOIN [dbo].[Magic_NotificationProviders] p
	  ON p.id = q.provider_id
	  LEFT JOIN dbo.Magic_DocumentRepository d
	  on d.ID = q.DocumentRepository_ID

GO

