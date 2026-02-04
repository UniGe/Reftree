/****** Object:  Table [dbo].[Magic_PDFFormSessionInput]    Script Date: 11/06/2021 12:02:28 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO
IF NOT EXISTS (   SELECT 1
                  FROM INFORMATION_SCHEMA.TABLES AS t
                  WHERE t.TABLE_SCHEMA = N'dbo'
                  AND   t.TABLE_NAME = N'Magic_PDFFormSessionInput'
                  AND   t.TABLE_TYPE = N'BASE TABLE')
BEGIN
	CREATE TABLE [dbo].[Magic_PDFFormSessionInput](
		[ID] [int] IDENTITY(1,1) NOT NULL,
		[OutputFileName] [nvarchar](1000) NOT NULL,
		[MoveToPath] [nvarchar](1000) NULL,
		[ModelPath] [nvarchar](1000) NOT NULL,
		[FillValues] [nvarchar](max) NOT NULL,
		[BO_ID] [int] NULL,
		[FillSession_ID] [int] NOT NULL,
	 CONSTRAINT [PK_Magic_PDFFormSessionInput_ID] PRIMARY KEY CLUSTERED 
	(
		[ID] ASC
	)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
	) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

	ALTER TABLE [dbo].[Magic_PDFFormSessionInput]  WITH CHECK ADD  CONSTRAINT [FK_Magic_PDFFormSessionInput_Magic_DocumentFillSessions_ID] FOREIGN KEY([FillSession_ID])
	REFERENCES [dbo].[Magic_DocumentFillSessions] ([ID])

	ALTER TABLE [dbo].[Magic_PDFFormSessionInput] CHECK CONSTRAINT [FK_Magic_PDFFormSessionInput_Magic_DocumentFillSessions_ID]
END