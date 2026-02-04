if EXISTS(SELECT * FROM INFORMATION_SchEMA.ROUTINES WHERE ROUTINE_NAME = 'Magic_AltLayerRefreshGridAndTemplates')
	DROP PROCEDURE [dbo].[Magic_AltLayerRefreshGridAndTemplates]
if EXISTS(SELECT * FROM INFORMATION_SchEMA.ROUTINES WHERE ROUTINE_NAME = 'Magic_DeleteLayer_dml')
	DROP PROCEDURE [dbo].[Magic_DeleteLayer_dml]
if EXISTS(SELECT * FROM INFORMATION_SchEMA.ROUTINES WHERE ROUTINE_NAME = 'Magic_DeleteLayerForGrid')
	DROP PROCEDURE [dbo].[Magic_DeleteLayerForGrid]
if EXISTS(SELECT * FROM INFORMATION_SchEMA.ROUTINES WHERE ROUTINE_NAME = 'Magic_RefreshLayerOverrides')
	DROP PROCEDURE [dbo].[Magic_RefreshLayerOverrides]