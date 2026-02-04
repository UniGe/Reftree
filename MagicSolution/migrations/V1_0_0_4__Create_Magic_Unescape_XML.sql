if exists (select * from sys.objects where object_id = object_id (N'[dbo].[Magic_Unescape_XML]') AND type in (N'FN', N'IF', N'TF', N'FS', N'FT'))
   drop function [dbo].[Magic_Unescape_XML]
go

set ansi_nulls off
go
set quoted_identifier off
go

CREATE FUNCTION [dbo].[Magic_Unescape_XML]
(
    @escapedField nvarchar(MAX)
) 
RETURNS nvarchar(MAX)
AS
BEGIN
    RETURN REPLACE(REPLACE(@escapedField, '&lt','<'),'&gt','>')
END

GO