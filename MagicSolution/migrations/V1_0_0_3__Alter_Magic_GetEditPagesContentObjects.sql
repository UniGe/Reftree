GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


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

SELECT * FROM [dbo].[Magic_Gantt]

SELECT *
  FROM [dbo].[Magic_HtmlTemplates]

END
