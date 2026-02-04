IF NOT EXISTS (   SELECT 1
                  FROM INFORMATION_SCHEMA.TABLES AS t
                  WHERE t.TABLE_SCHEMA = N'dbo'
                  AND   t.TABLE_NAME = N'Magic_GridsRefreshHistory'
                  AND   t.TABLE_TYPE = N'BASE TABLE')
BEGIN
	CREATE TABLE [dbo].[Magic_GridsRefreshHistory](
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[RefreshedDate] [datetime] NOT NULL,
	[ModifiedUser_ID] [int] NOT NULL,
	[TargetDBName] [varchar](500) NOT NULL,
	[MagicGrid_ID] [int] NOT NULL,
	[ApplicationInstanceName] [varchar](500) NULL,
 CONSTRAINT [PK_Magic_GridsRefreshHistory_ID] PRIMARY KEY CLUSTERED 
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]


ALTER TABLE [dbo].[Magic_GridsRefreshHistory] ADD  DEFAULT (getdate()) FOR [RefreshedDate]


ALTER TABLE [dbo].[Magic_GridsRefreshHistory]  WITH CHECK ADD  CONSTRAINT [FK_Magic_GridsRefreshHistory_Magic_Grids_MagicGridID] FOREIGN KEY([MagicGrid_ID])
REFERENCES [dbo].[Magic_Grids] ([MagicGridID])


ALTER TABLE [dbo].[Magic_GridsRefreshHistory] CHECK CONSTRAINT [FK_Magic_GridsRefreshHistory_Magic_Grids_MagicGridID]

END

