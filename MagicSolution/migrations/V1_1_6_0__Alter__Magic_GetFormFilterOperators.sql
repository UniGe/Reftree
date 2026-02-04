if exists (select * from sys.objects where object_id = object_id (N'[dbo].[Magic_GetFormFilterOperators]') AND type in (N'P'))
   drop procedure [dbo].[Magic_GetFormFilterOperators]
go

--declare @p1 xml
--set @p1=convert(xml,N'<SQLP><P UserID=7 .... campi del record editato  ></P><FKRESOLUTION userid="7" usergroup="1" valuefield="Magic_CultureID" textfield="Magic_LanguageDescription"/></SQLP>')
-- usata nella funzione di configurazione dei template details
--D.T: fixed problem with [] by IDEARE 04/02/2021

CREATE PROCEDURE [dbo].[Magic_GetFormFilterOperators] (@xmlInput xml,@count int output)
AS


declare @userid as varchar(30) = @xmlInput.value('(/SQLP/FKRESOLUTION/@userid)[1]','varchar(30)');
--declare @usergroupid as varchar(30) = @xmlInput.value('(/SQLP/FKRESOLUTION/@usergroup)[1]','varchar(30)');
declare @valuefield as varchar(100) = @xmlInput.value('(/SQLP/FKRESOLUTION/@valuefield)[1]','varchar(100)');
declare @textfield as varchar(100) = @xmlInput.value('(/SQLP/FKRESOLUTION/@textfield)[1]','varchar(100)'); 
declare @cultureid int = (select Culture_ID from Magic_Mmb_Users_Extensions where UserID=@userid)
declare @operators nvarchar(2000)

SET @valuefield = REPLACE(REPLACE(@valuefield,'[',''),']','')
--PRINT @valuefield
select @operators = Operators  
FROM 
Magic_FormFilterOperators 
where Schema_type = @valuefield



declare @sqlstmnt nvarchar(maX) = '
select string as operator 
into 
#temp 
FROM 
dbo.fnParseStringOneSeparator('''+@operators+''','','');


select operator as '+@valuefield+' ,  Label as [Description] 
FROM Magic_FormFilterTranslation 
where Culture_ID = '+CONVERT(NVARCHAR(10),@cultureid)+' and Operator in (select operator from #temp);'

EXEC sys.sp_executesql @sqlstmnt

set @count = @@rowcount

RETURN
