SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

IF NOT EXISTS (   SELECT 1
                  FROM INFORMATION_SCHEMA.TABLES AS t
                  WHERE t.TABLE_SCHEMA = N'dbo'
                  AND   t.TABLE_NAME = N'Magic_Files'
                  AND   t.TABLE_TYPE = N'BASE TABLE')
    CREATE TABLE [dbo].[Magic_Files] ([ID] [INT] IDENTITY(1, 1) NOT NULL
                                    , [Name] [NVARCHAR](450) NOT NULL
                                    , [Path] [NVARCHAR](MAX) NOT NULL
                                    , [TargetPath] [NVARCHAR](MAX) NULL
                                    , [Info] [NVARCHAR](MAX) NULL
                                    , [CreatedAt] [DATETIME] NOT NULL
                                    , [DeletedAt] [DATETIME] NULL
                                    , [IsCustomPath] [BIT] NOT NULL
                                    ,
                                    UNIQUE (Name)
                                    , CONSTRAINT [PK_Magic_Files]
                                          PRIMARY KEY CLUSTERED ([ID] ASC)
                                          WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF
                                              , ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY];
GO
