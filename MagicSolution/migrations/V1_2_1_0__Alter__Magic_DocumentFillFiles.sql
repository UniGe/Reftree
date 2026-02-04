IF NOT EXISTS(SELECT 1
	FROM INFORMATION_SCHEMA.COLUMNS AS c
	WHERE 
	c.TABLE_SCHEMA = N'dbo'
	AND c.TABLE_NAME = N'Magic_DocumentFillSessions'
	AND c.COLUMN_NAME = N'BO_TableName')
begin
	ALTER TABLE dbo.Magic_DocumentFillSessions
	ADD BO_TableName nvarchar(200) NULL 
    CONSTRAINT BO_TableName_null DEFAULT NULL;	
end