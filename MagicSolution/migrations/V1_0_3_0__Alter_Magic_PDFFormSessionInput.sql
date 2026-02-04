GO
IF  EXISTS(SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Magic_PDFFormSessionInput]') AND type in (N'U'))
ALTER TABLE[dbo].[Magic_PDFFormSessionInput] DROP CONSTRAINT[FK_Magic_PDFFormSessionInput_Magic_DocumentFillSessions_ID]
GO

/****** Object:  Table [dbo].[Magic_PDFFormSessionInput]    Script Date: 11.08.2021 14:13:38 ******/
IF  EXISTS(SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Magic_PDFFormSessionInput]') AND type in (N'U'))
DROP TABLE[dbo].[Magic_PDFFormSessionInput]
GO

/****** Object:  Table [dbo].[Magic_PDFFormSessionInput]    Script Date: 11.08.2021 14:13:38 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE[dbo].[Magic_PDFFormSessionInput](
	[ID][int] IDENTITY(1, 1) NOT NULL,
	[OutputFileName][nvarchar](1000) NOT NULL,
	[MoveToPath][nvarchar](1000) NULL,
	[ModelPath][nvarchar](1000) NOT NULL,
	[FillValues][nvarchar](max) NOT NULL,
	[DocumentFillSession_ID][int] NOT NULL,
	[BO_ID][int] NULL,
	[Culture_ID][int] NULL,
	[CreationDate][datetime] NOT NULL,
	[ProcessedDate][datetime] NULL,
	CONSTRAINT[PK_Magic_PDFFormSessionInput_ID] PRIMARY KEY CLUSTERED
	(
		[ID] ASC
	)WITH(PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON[PRIMARY]
) ON[PRIMARY] TEXTIMAGE_ON[PRIMARY]
GO

ALTER TABLE[dbo].[Magic_PDFFormSessionInput]  WITH CHECK ADD  CONSTRAINT[FK_Magic_PDFFormSessionInput_Magic_DocumentFillSessions_ID] FOREIGN KEY([DocumentFillSession_ID])
REFERENCES[dbo].[Magic_DocumentFillSessions]([ID])
GO

ALTER TABLE[dbo].[Magic_PDFFormSessionInput] CHECK CONSTRAINT[FK_Magic_PDFFormSessionInput_Magic_DocumentFillSessions_ID]
GO