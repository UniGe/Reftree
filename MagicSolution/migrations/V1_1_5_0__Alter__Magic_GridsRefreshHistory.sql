IF NOT EXISTS(SELECT 1
	FROM INFORMATION_SCHEMA.COLUMNS AS c
	WHERE 
	c.TABLE_SCHEMA = N'dbo'
	AND c.TABLE_NAME = N'Magic_GridsRefreshHistory'
	AND c.COLUMN_NAME = N'ModifiedUsername')
begin
	ALTER TABLE dbo.Magic_GridsRefreshHistory
	ADD ModifiedUsername varchar(1000) NULL 
    CONSTRAINT ModifiedUsername DEFAULT NULL;
end 