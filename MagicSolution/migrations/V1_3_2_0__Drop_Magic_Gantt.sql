begin tran;
begin try


IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Magic_Gantt]') AND type in (N'U'))
BEGIN
	DELETE FROM [dbo].[Magic_Gantt];
	DROP TABLE [dbo].[Magic_Gantt];
END


IF EXISTS (SELECT 1 FROM sys.procedures WHERE name = 'Magic_GetEditPagesContentObjects')
BEGIN
    EXEC dbo.sp_executesql @statement = N'
ALTER PROCEDURE [dbo].[Magic_GetEditPagesContentObjects](@xmlInput xml) 
AS
	BEGIN
		SET NOCOUNT ON;

		SELECT c.[GUID], c.[Description] ,ct.ChartType
		FROM dbo.Magic_DashboardCharts c
		inner join Magic_DashBoardChartTypes ct
		on ct.ID = c.ChartType_ID

	
	SELECT [Code]
			,[Description]
		FROM [dbo].[Magic_DashBoardIndicators]

	SELECT *
		FROM [dbo].[Magic_HtmlTemplates]

END
'
END


IF NOT EXISTS (SELECT 1 FROM sys.procedures WHERE name = 'Magic_GetEditPagesContentObjects')
BEGIN
    EXEC dbo.sp_executesql @statement = N'
CREATE PROCEDURE [dbo].[Magic_GetEditPagesContentObjects](@xmlInput xml) 
AS
BEGIN
	SET NOCOUNT ON;

	SELECT c.[GUID], c.[Description] ,ct.ChartType
	FROM dbo.Magic_DashboardCharts c
	inner join Magic_DashBoardChartTypes ct
	on ct.ID = c.ChartType_ID

	
	SELECT [Code]
		  ,[Description]
	  FROM [dbo].[Magic_DashBoardIndicators]

	SELECT *
	  FROM [dbo].[Magic_HtmlTemplates]

END
'
END


IF EXISTS (SELECT 1 FROM sys.procedures WHERE name = 'LoadBryntumGanttData')
BEGIN

DROP PROCEDURE [CUSTOM].[LoadBryntumGanttData];

END


IF EXISTS (SELECT 1 FROM sys.procedures WHERE name = 'SaveBryntumGanttData')
BEGIN

DROP PROCEDURE [CUSTOM].[SaveBryntumGanttData];

END


commit tran;
return;
end try
begin catch
    declare @msg nvarchar(max) = error_message();
    rollback tran;
    raiserror(@msg, 16, 1);
end catch;