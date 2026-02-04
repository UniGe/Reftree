GO
IF NOT EXISTS (   SELECT 1
                  FROM INFORMATION_SCHEMA.TABLES AS t
                  WHERE t.TABLE_SCHEMA = N'dbo'
                  AND   t.TABLE_NAME = N'Magic_App_ExtConnTypes'
                  AND   t.TABLE_TYPE = N'BASE TABLE')
BEGIN
	CREATE TABLE [dbo].Magic_App_ExtConnTypes(
		[ID] [int] IDENTITY(1,1) NOT NULL,
		[Code] [nvarchar](1000) NOT NULL,
	 CONSTRAINT [PK_Magic_App_ExtConnType_ID] PRIMARY KEY CLUSTERED 
	(
		[ID] ASC
	)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
	) ON [PRIMARY] 

END


GO

INSERT INTO dbo.Magic_App_ExtConnTypes(Code)
VALUES ('POWERBI')

GO
IF NOT EXISTS (   SELECT 1
                  FROM INFORMATION_SCHEMA.TABLES AS t
                  WHERE t.TABLE_SCHEMA = N'dbo'
                  AND   t.TABLE_NAME = N'Magic_App_ExtConnections'
                  AND   t.TABLE_TYPE = N'BASE TABLE')
BEGIN
	CREATE TABLE [dbo].Magic_App_ExtConnections(
		[ID] [int] IDENTITY(1,1) NOT NULL,
		[ApplicationInstanceName] [nvarchar](1000) NOT NULL,
		[ConfigData] [nvarchar](max) NOT NULL,
		[CreationDate] [datetime] NOT NULL DEFAULT getdate(),
		[ExtConnType_ID] int not null,
		
	 CONSTRAINT [PK_Magic_App_ExtConnections_ID] PRIMARY KEY CLUSTERED 
	(
		[ID] ASC
	)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
	) ON [PRIMARY] 
	 

END

GO

ALTER TABLE [dbo].Magic_App_ExtConnections  WITH CHECK ADD  CONSTRAINT [FK_Magic_App_ExtConnTypes_Conn] FOREIGN KEY([ExtConnType_ID])
REFERENCES Magic_App_ExtConnTypes ([ID])
GO


ALTER TABLE [dbo].Magic_App_ExtConnections CHECK CONSTRAINT [FK_Magic_App_ExtConnTypes_Conn]
GO