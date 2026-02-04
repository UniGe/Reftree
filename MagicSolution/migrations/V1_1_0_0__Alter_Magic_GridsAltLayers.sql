

IF EXISTS (   SELECT 1
                  FROM INFORMATION_SCHEMA.TABLES AS t
                  WHERE t.TABLE_SCHEMA = N'dbo'
                  AND   t.TABLE_NAME = N'Magic_GridsAltLayers'
                  AND   t.TABLE_TYPE = N'BASE TABLE')
    DROP TABLE [dbo].[Magic_GridsAltLayers]
GO

IF NOT EXISTS (   SELECT 1
                  FROM INFORMATION_SCHEMA.TABLES AS t
                  WHERE t.TABLE_SCHEMA = N'dbo'
                  AND   t.TABLE_NAME = N'Magic_GridsAltLayers'
                  AND   t.TABLE_TYPE = N'BASE TABLE')
BEGIN
CREATE TABLE [dbo].[Magic_GridsAltLayers](
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[MagicGrid_ID] [int] NOT NULL,
	[Layer_ID] [int] NOT NULL,
	[CreationDate] [datetime] NOT NULL,
	[ModifiedUser_ID] [int] NOT NULL,
	[Active] [bit] NOT NULL,
	[MasterGrid_ID] [int] NOT NULL,
 CONSTRAINT [PK_Magic_GridsAltLayers_ID] PRIMARY KEY CLUSTERED 
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]


ALTER TABLE [dbo].[Magic_GridsAltLayers] ADD  DEFAULT (getdate()) FOR [CreationDate]


ALTER TABLE [dbo].[Magic_GridsAltLayers] ADD  DEFAULT ((0)) FOR [Active]


ALTER TABLE [dbo].[Magic_GridsAltLayers]  WITH CHECK ADD  CONSTRAINT [FK_Magic_GridsAltLayers_Magic_ApplicationLayers_LayerID] FOREIGN KEY([Layer_ID])
REFERENCES [dbo].[Magic_ApplicationLayers] ([LayerID])


ALTER TABLE [dbo].[Magic_GridsAltLayers] CHECK CONSTRAINT [FK_Magic_GridsAltLayers_Magic_ApplicationLayers_LayerID]


ALTER TABLE [dbo].[Magic_GridsAltLayers]  WITH CHECK ADD  CONSTRAINT [FK_Magic_GridsAltLayers_Magic_Grids_MagicGridID] FOREIGN KEY([MagicGrid_ID])
REFERENCES [dbo].[Magic_Grids] ([MagicGridID])
ON DELETE CASCADE


ALTER TABLE [dbo].[Magic_GridsAltLayers] CHECK CONSTRAINT [FK_Magic_GridsAltLayers_Magic_Grids_MagicGridID]


ALTER TABLE [dbo].[Magic_GridsAltLayers]  WITH CHECK ADD  CONSTRAINT [FK_Magic_GridsAltLayers_Master_Grids_MagicGridID] FOREIGN KEY([MasterGrid_ID])
REFERENCES [dbo].[Magic_Grids] ([MagicGridID])


ALTER TABLE [dbo].[Magic_GridsAltLayers] CHECK CONSTRAINT [FK_Magic_GridsAltLayers_Master_Grids_MagicGridID]

END

