ALTER TABLE [dbo].[Magic_Eve_Track] DROP CONSTRAINT [FK_Magic_Eve_Track_Magic_Eve_PlannedEvent]
GO

/****** Object:  Table [dbo].[Magic_Eve_Track]    Script Date: 11/10/2021 14:42:25 ******/
DROP TABLE [dbo].[Magic_Eve_Track]
GO

/****** Object:  Table [dbo].[Magic_Eve_Track]    Script Date: 11/10/2021 14:42:25 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[Magic_Eve_Track](
	[TrackID] [int] IDENTITY(1,1) NOT NULL,
	[PlannedEventID] [int] NULL,
	[tsExecutionStart] [datetime] NULL,
	[tsExecutionEnd] [datetime] NULL,
	[AlertMessage] [nvarchar](max) NULL,
	[DbMessage] [nvarchar](max) NULL,
 CONSTRAINT [PK_Magic_Eve_Track] PRIMARY KEY CLUSTERED 
(
	[TrackID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [dbo].[Magic_Eve_Track]  WITH CHECK ADD  CONSTRAINT [FK_Magic_Eve_Track_Magic_Eve_PlannedEvent] FOREIGN KEY([PlannedEventID])
REFERENCES [dbo].[Magic_Eve_PlannedEvent] ([IDPlannedEvent])
GO

ALTER TABLE [dbo].[Magic_Eve_Track] CHECK CONSTRAINT [FK_Magic_Eve_Track_Magic_Eve_PlannedEvent]
GO


