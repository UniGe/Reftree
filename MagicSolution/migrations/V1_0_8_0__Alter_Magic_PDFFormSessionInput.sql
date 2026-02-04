IF NOT EXISTS(SELECT 1
	FROM INFORMATION_SCHEMA.COLUMNS AS c
	WHERE 
	c.TABLE_SCHEMA = N'dbo'
	AND c.TABLE_NAME = N'Magic_PDFFormSessionInput'
	AND c.COLUMN_NAME = N'MergeFileName')
begin
	ALTER TABLE dbo.Magic_PDFFormSessionInput
	ADD MergeFileName nvarchar(1000) NULL 
    CONSTRAINT MergeFileName_null DEFAULT NULL;
end 