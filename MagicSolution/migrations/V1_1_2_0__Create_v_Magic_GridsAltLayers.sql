IF  EXISTS(SELECT 1
                  FROM INFORMATION_SCHEMA.TABLES AS t
                  WHERE t.TABLE_SCHEMA = N'dbo'
                  AND   t.TABLE_NAME = N'v_Magic_GridsAltLayers'
                  AND   t.TABLE_TYPE = N'VIEW')
		DROP VIEW [dbo].[v_Magic_GridsAltLayers] 
GO

CREATE VIEW [dbo].[v_Magic_GridsAltLayers] as
SELECT alt.[ID], alt.[MagicGrid_ID], alt.[Layer_ID], alt.[CreationDate], alt.[ModifiedUser_ID], alt.[Active], alt.[MasterGrid_ID],
	al.LayerDescription,
	g.MagicGridName as AlternativeGridName,
	g2.MagicGridName as MasterGridName,
	u.Name as ModifiedBy
from[dbo].[Magic_GridsAltLayers] alt
inner join dbo.Magic_Grids g
on g.MagicGridID = alt.[MagicGrid_ID]
inner join dbo.Magic_Grids g2
on g2.MagicGridID = alt.[MasterGrid_ID]
inner join dbo.Magic_ApplicationLayers al
on al.LayerID = alt.Layer_ID
inner join dbo.Magic_Mmb_Users u
on u.UserID = alt.ModifiedUser_ID

GO

UPDATE [dbo].[Magic_AppLayersTypes]
set Code = 'RELALTDATA', Description = 'MASTER - ALTERNATIVE GRIDS'
where Code = 'FUNCTION'

GO