IF NOT EXISTS (   SELECT 1
                  FROM INFORMATION_SCHEMA.TABLES AS t
                  WHERE t.TABLE_SCHEMA = N'dbo'
                  AND   t.TABLE_NAME = N'Magic_ObjectLabelsAltLayer'
                  AND   t.TABLE_TYPE = N'BASE TABLE')
BEGIN

CREATE TABLE [dbo].[Magic_ObjectLabelsAltLayer](
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[LabelTable] [varchar](300) NOT NULL,
	[Label_ID] [int] NOT NULL,
	[Layer_ID] [int] NOT NULL,
	[LayerLabel] [nvarchar](max) NOT NULL,
 CONSTRAINT [PK_Magic_ObjectLabelsAltLayer_ID] PRIMARY KEY CLUSTERED 
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]


ALTER TABLE [dbo].[Magic_ObjectLabelsAltLayer]  WITH CHECK ADD  CONSTRAINT [FK_Magic_ObjectLabelsAltLayer_Magic_ApplicationLayers_LayerID] FOREIGN KEY([Layer_ID])
REFERENCES [dbo].[Magic_ApplicationLayers] ([LayerID])


ALTER TABLE [dbo].[Magic_ObjectLabelsAltLayer] CHECK CONSTRAINT [FK_Magic_ObjectLabelsAltLayer_Magic_ApplicationLayers_LayerID]

END