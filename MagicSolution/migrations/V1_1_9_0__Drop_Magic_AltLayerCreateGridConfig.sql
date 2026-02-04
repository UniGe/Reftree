IF  EXISTS(SELECT *
                  FROM INFORMATION_SCHEMA.ROUTINES AS t
                  WHERE t.ROUTINE_SCHEMA = N'dbo'
                  AND   t.ROUTINE_NAME = N'Magic_AltLayerCreateGridConfig')
		DROP PROCEDURE [dbo].Magic_AltLayerCreateGridConfig 
GO