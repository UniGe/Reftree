if exists (select * from sys.objects where object_id = object_id (N'[dbo].[Magic_PushClientMailToQueue]') AND type in (N'P'))
   drop procedure [dbo].[Magic_PushClientMailToQueue]
go

set ansi_nulls off
go
set quoted_identifier off
go

CREATE PROCEDURE [dbo].[Magic_PushClientMailToQueue](@xmlInput xml)
AS
BEGIN
	--INSERT INTO DEB VALUES (@jsonTable);
	DECLARE @body nvarchar(max) = @xmlinput.value ('(/SQLP/P/@body)[1]', 'nvarchar(max)');
	declare @UserID as int = @xmlinput.value ('(/SQLP/SESSIONVARS/@iduser)[1]', 'int');
    declare @from_name as nvarchar(max) = @xmlinput.value ('(/SQLP/P/@from_name)[1]', 'nvarchar(max)');
    declare @to as nvarchar(100) = @xmlinput.value ('(/SQLP/P/@to)[1]', 'nvarchar(max)');
    declare @cc as nvarchar(100) = @xmlinput.value ('(/SQLP/P/@cc)[1]', 'nvarchar(max)');
	declare @ccn as nvarchar(100) = @xmlinput.value ('(/SQLP/P/@ccn)[1]', 'nvarchar(max)');
	declare @replyto as nvarchar(100) = @xmlinput.value ('(/SQLP/P/@replyto)[1]', 'nvarchar(max)');
	declare @subject as nvarchar(max) = @xmlinput.value ('(/SQLP/P/@subject)[1]', 'nvarchar(max)');
	declare @attachments as nvarchar(max) = @xmlinput.value ('(/SQLP/P/@attachments)[1]', 'nvarchar(max)');

BEGIN TRAN	
BEGIN TRY


	DECLARE @accountid int = (SELECT id FROM [dbo].[Magic_MailAccounts] WHERE IsDefault = 1)
	IF @accountid IS NOT null
	BEGIN
		INSERT INTO dbo.Magic_SystemEditedMessages
		(
			--Id - this column value is auto-generated
			dbo.Magic_SystemEditedMessages.OrigMessage_ID,
			dbo.Magic_SystemEditedMessages.User_ID,
			dbo.Magic_SystemEditedMessages.Code,
			dbo.Magic_SystemEditedMessages.[From],
			dbo.Magic_SystemEditedMessages.[To],
			dbo.Magic_SystemEditedMessages.cc,
			dbo.Magic_SystemEditedMessages.ccn,
			dbo.Magic_SystemEditedMessages.Subject,
			dbo.Magic_SystemEditedMessages.Body,
			dbo.Magic_SystemEditedMessages.IsHtml,
			dbo.Magic_SystemEditedMessages.CultureId,
			dbo.Magic_SystemEditedMessages.Attachments
		)
		SELECT null,
		@userId,
		null,
		@from_name,
		@to,
		@cc,
		@ccn,
		@Subject,
		@body,
		CAST(1 as bit),
		null,
		@attachments


		INSERT INTO dbo.Magic_MailQueue
		(
			dbo.Magic_MailQueue.dbo.Magic_MailQueue.send_to,
			dbo.Magic_MailQueue.send_attempts,
			dbo.Magic_MailQueue.edited_messages_id,
			dbo.Magic_MailQueue.dbo.Magic_MailQueue.mail_account_id,
			[reply_to]
		)
		VALUES
		(
			'',
			0, -- send_attempts - int
			SCOPE_IDENTITY(), -- edited_messages_id - int
			@accountid,
			@replyto
		)

		 
	END
	COMMIT
END TRY
	BEGIN CATCH
		ROLLBACK 
		DECLARE @error varchar(max) = ERROR_MESSAGE()
		RAISERROR(@error,16,1)
	END CATCH
END

GO