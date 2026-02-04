IF  EXISTS(SELECT *
                  FROM INFORMATION_SCHEMA.TABLES AS t
                  WHERE t.TABLE_SCHEMA = N'dbo'
                  AND   t.TABLE_NAME = N'Magic_ObjectLabelsAltLayer'
                  AND   t.TABLE_TYPE = N'BASE TABLE')
		DROP TABLE [dbo].Magic_ObjectLabelsAltLayer 
GO
