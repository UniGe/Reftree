IF NOT EXISTS(SELECT 1
	FROM INFORMATION_SCHEMA.COLUMNS AS c
	WHERE 
	c.TABLE_SCHEMA = N'dbo'
	AND c.TABLE_NAME = N'Magic_Help'
	AND c.COLUMN_NAME = N'GUID')
BEGIN
	
	ALTER TABLE dbo.Magic_Help
		ADD GUID uniqueidentifier
			NOT NULL
			DEFAULT NEWID()
			UNIQUE;

	ALTER TABLE dbo.Magic_Grids
		ADD HelpGUID uniqueidentifier
			NULL;

	ALTER TABLE dbo.Magic_Functions
		ADD HelpGUID uniqueidentifier
			NULL;

	ALTER TABLE dbo.Magic_DashBoardTabs
		ADD HelpGUID uniqueidentifier
			NULL;

END
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER VIEW [dbo].[v_Magic_Grids]
		AS
		SELECT     dbo.Magic_Grids.MagicGridID, dbo.Magic_Grids.MagicGridName, dbo.Magic_Grids.MagicGridEntity, dbo.Magic_Grids.MagicGridModel, 
							  dbo.Magic_Grids.MagicGridColumns, dbo.Magic_Grids.MagicGridTransport, dbo.Magic_Grids.MagicGridColumnsCommand, dbo.Magic_Grids.Sortable, 
							  dbo.Magic_Grids.Groupable, dbo.Magic_Grids.Editable, dbo.Magic_Grids.Exportable, dbo.Magic_Grids.Toolbar, dbo.Magic_DataSource.Name, dbo.Magic_DataSource.ObjRead, 
							  dbo.Magic_DataSource.ObjUpdate, dbo.Magic_DataSource.ObjCreate, dbo.Magic_DataSource.ObjDestroy, dbo.Magic_DataSource.ObjParameterMap, 
							  dbo.Magic_DataSource.ObjComplete, dbo.Magic_DataSource.Filter,dbo.Magic_DataSource.OrderByFieldName,dbo.Magic_Grids.[DetailTemplate],dbo.Magic_Grids.[EditableTemplate],
							  dbo.Magic_Grids.DetailInitJSFunction,dbo.Magic_Grids.EditJSFunction,dbo.Magic_Grids.MagicDataSource_ID,dbo.Magic_DataSource.CustomJSONParam,
							  dbo.Magic_Grids.FromClass,dbo.Magic_Grids.FromTable,dbo.Magic_Grids.isSystemGrid, t1.MagicTemplateID as EditTemplate_ID,t2.MagicTemplateID as NavigationTemplate_ID,
							  dbo.Magic_Grids.EditFormColumnNum,dbo.Magic_Grids.Selectable,coalesce(dbo.Magic_Grids.PageSize, 10) as PageSize,
							  dbo.Magic_Grids.GUID,
							  dbo.Magic_Grids.HelpGUID,
							  gha.[ShowHistory],gha.[QueryForActions],gha.[MasterEntityName],gha.DocRepositoryBOType,dbo.Magic_grids.MagicGridExtension
		FROM         dbo.Magic_Grids LEFT OUTER JOIN
							  dbo.Magic_DataSource ON dbo.Magic_Grids.MagicDataSource_ID = dbo.Magic_DataSource.MagicDataSourceID
							  LEFT OUTER JOIN dbo.Magic_Templates t1
							  on t1.[MagicTemplateName] = dbo.Magic_Grids.[EditableTemplate]
							  LEFT OUTER JOIN dbo.Magic_Templates t2
							  on t2.[MagicTemplateName] = dbo.Magic_Grids.[DetailTemplate]
							  LEFT OUTER JOIN [dbo].[Magic_GridsHistActSettings] gha
							  on gha.MagicGrid_ID = dbo.Magic_Grids.MagicGridID;
GO

ALTER Procedure [dbo].[DashBoardGetAllObjects](@xmlInput xml)
as
declare @userid  as int = @xmlInput.value('(/SQLP/SESSIONVARS/@iduser)[1]','int');
declare @culture_ID  as int = (SELECT mmue.Culture_ID FROM dbo.Magic_Mmb_Users_Extensions mmue WHERE mmue.UserID = @userid);
DECLARE @profiles AS TABLE (id int) 

INSERT INTO @profiles --profili dell' utente
SELECT dbo.Magic_mmb_UsersProfiles.Profile_ID 
FROM dbo.Magic_mmb_UsersProfiles WHERE [User_ID] = @userid


PRINT CONVERT(VARCHAR(20),@userid)

PRINT CONVERT(VARCHAR(20),@culture_ID)


SELECT
DISTINCT mdbt.ID,
mdbt.Code AS TabCode,
ml.Label AS TabLabel,
mdbt.OrdinalPosition AS TabOrdinalPosition,
mdbt.MagicGridName AS GridName,
mdbt.HideGlobalRangePicker AS HideGlobalRangePicker,
mdbt.HelpGUID
INTO #tmptabs
FROM dbo.Magic_DashBoardTabs mdbt
INNER JOIN dbo.Magic_DashBoardTabContent mdbtc ON mdbtc.Tab_ID = mdbt.ID
INNER JOIN dbo.Magic_Labels ml ON ml.Label_ID = mdbt.Magic_Labels_Label_ID
WHERE ml.Culture_ID = @culture_ID
AND mdbt.Active = 1 AND mdbt.User_ID IS null
ORDER BY mdbt.OrdinalPosition

INSERT INTO #tmptabs
(
    dbo.#tmptabs.ID,
    dbo.#tmptabs.TabCode,
    dbo.#tmptabs.TabLabel,
    dbo.#tmptabs.TabOrdinalPosition,
    dbo.#tmptabs.GridName,
    dbo.#tmptabs.HideGlobalRangePicker
)
SELECT mdbt.ID,
mdbt.Code AS TabCode,
ml.Label AS TabLabel,
mdbt.OrdinalPosition AS TabOrdinalPosition,
mdbt.MagicGridName AS GridName,
mdbt.HideGlobalRangePicker AS HideGlobalRangePicker
FROM dbo.Magic_DashBoardTabs mdbt  
INNER JOIN dbo.Magic_Labels ml ON ml.Label_ID = mdbt.Magic_Labels_Label_ID
WHERE ml.Culture_ID = @culture_ID and mdbt.User_ID = @userid

 
SELECT * FROM #tmptabs t 
WHERE t.ID NOT IN 
(SELECT DashBoardTab_ID FROM dbo.Magic_Mmb_ProfilesDshTabExc mmpdte INNER JOIN @profiles p ON p.id = mmpdte.Profile_ID)
ORDER BY t.TabOrdinalPosition

-- includes overrides + 10000000 to avoid equal IDs with standard content
SELECT * FROM (
SELECT
isnull(mdbuc.ID+10000000,mdbtc.ID) AS ID ,
mdbtc.ContentType_ID,
mdbtc.ContentObject_ID,
mdbtc.Tab_ID,
isnull(mdbuc.OrdinalPosition,mdbtc.OrdinalPosition) AS OrdinalPosition,
isnull(mdbuc.BtstrpClmnClss,mdbtc.BtstrpClmnClss) AS BtstrpClmnClss,
mdbtc.ContentGroup_ID,
mdbct.Code AS ContentTypeCode
FROM #tmptabs t
INNER JOIN dbo.Magic_DashBoardTabContent mdbtc ON mdbtc.Tab_ID = t.ID
LEFT JOIN dbo.Magic_DashBoardUserCustom mdbuc ON mdbuc.TabContent_ID = mdbtc.ID AND @userid = mdbuc.User_ID AND mdbuc.Tab_ID = mdbtc.Tab_ID AND mdbuc.Active = 1 --Override User
INNER JOIN dbo.Magic_DashBoardContentType mdbct ON mdbct.ID = mdbtc.ContentType_ID
--ORDER BY mdbtc.OrdinalPosition
UNION  -- Items added by the user to the dashboard Tab as customizations (not in TabContent) 
SELECT
mdbuc.ID+10000000 AS ID ,
mdbuc.ContentType_ID,
mdbuc.ContentObject_ID,
mdbuc.Tab_ID,
isnull(mdbuc.OrdinalPosition,0) AS OrdinalPosition,
isnull(mdbuc.BtstrpClmnClss,'col-md-4') AS BtstrpClmnClss,
null ContentGroup_ID,
mdbct.Code AS ContentTypeCode
FROM #tmptabs t
INNER JOIN dbo.Magic_DashBoardUserCustom mdbuc ON   mdbuc.Tab_ID = t.ID --Override User
INNER JOIN dbo.Magic_DashBoardContentType mdbct ON mdbct.ID = mdbuc.ContentType_ID
WHERE @userid = mdbuc.User_ID AND mdbuc.TabContent_ID IS NULL AND mdbuc.Active = 1 ) a 
ORDER BY a.OrdinalPosition
--ORDER BY mdbuc.OrdinalPosition

SELECT
DISTINCT mdbcg.ID,
mdbtc.Tab_ID,
ml.Label AS GroupLabel,
mdbcg.OrdinalPosition
FROM #tmptabs t
INNER JOIN dbo.Magic_DashBoardTabContent mdbtc ON mdbtc.Tab_ID = t.ID
INNER JOIN dbo.Magic_DashBoardContentGroups mdbcg ON mdbcg.ID = mdbtc.ContentGroup_ID AND mdbcg.DashBoardTab_ID = t.ID
INNER JOIN dbo.Magic_Labels ml ON ml.Label_ID = mdbcg.Magic_Labels_Label_ID
WHERE ml.Culture_ID = @culture_ID

SELECT
isnull(mdbuc.ID+10000000,mdbtc.ID) AS TabContent_ID,
mdc.ID, 
mdc.ChartType_ID, 
mdc.AggregationDim, 
mdc.AnalysisType, 
mdc.GraphRowNumber, 
null as GraphContainer, 
isnull(mdbtc.OrdinalPosition, mdbuc.OrdinalPosition) AS OrdinalPosition,
isnull(ml.Label, mdc.Description) Description,  
mdc.IconClass, 
mdc.AggregationDimensionIsDate, 
mdc.PartialLabels, 
isnull(mdc.YAxisMeasurementUnit,'') AS YAxisMeasurementUnit, 
mdc.FunctionGUID, 
mdc.FunctionFilter,
mg.MagicGridName,
mf.FunctionID,
mdc.ChartExtension,
mdbct2.ChartType,
mdbct.ObjectLoadSP
FROM #tmptabs t
INNER JOIN dbo.Magic_DashBoardTabContent mdbtc ON mdbtc.Tab_ID = t.ID
LEFT JOIN dbo.Magic_DashBoardUserCustom mdbuc ON mdbuc.TabContent_ID is not null AND mdbuc.TabContent_ID = mdbtc.ID AND @userid = mdbuc.User_ID AND mdbuc.Tab_ID = mdbtc.Tab_ID --Override User
INNER JOIN dbo.Magic_DashBoardContentType mdbct ON mdbct.ID = mdbtc.ContentType_ID
INNER JOIN dbo.Magic_DashboardCharts mdc ON mdc.ID = mdbtc.ContentObject_ID
INNER JOIN dbo.Magic_DashBoardChartTypes mdbct2 ON mdbct2.ID = mdc.ChartType_ID
LEFT JOIN dbo.Magic_Functions mf ON mdc.FunctionGUID = mf.[GUID]
LEFT JOIN dbo.Magic_FunctionsGrids mfg ON mf.FunctionID = mfg.MagicFunction_ID
LEFT JOIN dbo.Magic_Grids mg ON mfg.MagicGrid_ID = mg.MagicGridID
LEFT JOIN dbo.Magic_Mmb_ProfilesDshbrdExcptns mmpde
ON mmpde.ContentObject_ID = mdbtc.ContentObject_ID AND mmpde.ContentType_ID = mdbtc.ContentType_ID  and mmpde.Profile_ID in (select id from @profiles)
left JOIN dbo.Magic_Labels ml ON ml.Label_ID = mdc.Magic_Labels_Label_ID and ml.Culture_ID = @culture_ID
WHERE mdbct.Code = 'CHART' AND ISNULL(mdbuc.Active,mdc.Active) = 1 AND mmpde.ID IS null
UNION 
SELECT --Charts which are only present in the Customization
mdbuc.ID+10000000 AS TabContent_ID,
mdc.ID, 
mdc.ChartType_ID, 
mdc.AggregationDim, 
mdc.AnalysisType, 
mdc.GraphRowNumber, 
null as GraphContainer, 
mdbuc.OrdinalPosition AS OrdinalPosition,
isnull(ml.Label, mdc.Description) Description, 
mdc.IconClass, 
mdc.AggregationDimensionIsDate, 
mdc.PartialLabels, 
isnull(mdc.YAxisMeasurementUnit,'') AS YAxisMeasurementUnit, 
mdc.FunctionGUID, 
mdc.FunctionFilter,
mg.MagicGridName,
mf.FunctionID,
mdc.ChartExtension,
mdbct2.ChartType,
mdbct.ObjectLoadSP
FROM #tmptabs t
INNER  JOIN dbo.Magic_DashBoardUserCustom mdbuc ON    mdbuc.Tab_ID = t.ID --Override User
INNER JOIN dbo.Magic_DashBoardContentType mdbct ON mdbct.ID = mdbuc.ContentType_ID
INNER JOIN dbo.Magic_DashboardCharts mdc ON mdc.ID = mdbuc.ContentObject_ID
INNER JOIN dbo.Magic_DashBoardChartTypes mdbct2 ON mdbct2.ID = mdc.ChartType_ID
LEFT JOIN dbo.Magic_Functions mf ON mdc.FunctionGUID = mf.[GUID]
LEFT JOIN dbo.Magic_FunctionsGrids mfg ON mf.FunctionID = mfg.MagicFunction_ID
LEFT JOIN dbo.Magic_Grids mg ON mfg.MagicGrid_ID = mg.MagicGridID
LEFT JOIN dbo.Magic_Mmb_ProfilesDshbrdExcptns mmpde
ON mmpde.ContentObject_ID = mdbuc.ContentObject_ID AND mmpde.ContentType_ID = mdbuc.ContentType_ID and mmpde.Profile_ID in (select id from @profiles)
left JOIN dbo.Magic_Labels ml ON ml.Label_ID = mdc.Magic_Labels_Label_ID and ml.Culture_ID = @culture_ID
WHERE mdbct.Code = 'CHART' AND mdbuc.Active = 1 AND mmpde.ID IS null AND  mdbuc.TabContent_ID IS NULL AND @userid = mdbuc.User_ID 



SELECT
isnull(mdbuc.ID+10000000,mdbtc.ID) AS TabContent_ID, 
mdbi.ID, 
mdbi.Code, 
isnull(ml.Label, mdbi.Description) Description, 
mdbi.IconClass, 
mdbi.Color, 
mdbi.FunctionGUID, 
mdbi.FunctionFilter,
mg.MagicGridName,
mf.FunctionID,
mdbi.MeasurementUnit,
mdbct.ObjectLoadSP,
mdbi.SubValuesLoadSP
FROM #tmptabs t
INNER JOIN dbo.Magic_DashBoardTabContent mdbtc ON mdbtc.Tab_ID = t.ID
LEFT JOIN dbo.Magic_DashBoardUserCustom mdbuc ON mdbuc.TabContent_ID = mdbtc.ID AND @userid = mdbuc.User_ID AND mdbuc.Tab_ID = mdbtc.Tab_ID AND mdbuc.TabContent_ID IS NOT NULL--Override User
INNER JOIN dbo.Magic_DashBoardContentType mdbct ON mdbct.ID = mdbtc.ContentType_ID
INNER JOIN dbo.Magic_DashBoardIndicators mdbi  ON mdbi.ID = mdbtc.ContentObject_ID
LEFT JOIN dbo.Magic_Functions mf ON mdbi.FunctionGUID = mf.[GUID]
LEFT JOIN dbo.Magic_FunctionsGrids mfg ON mf.FunctionID = mfg.MagicFunction_ID
LEFT JOIN dbo.Magic_Grids mg ON mfg.MagicGrid_ID = mg.MagicGridID
LEFT JOIN dbo.Magic_Mmb_ProfilesDshbrdExcptns mmpde
ON mmpde.ContentObject_ID = mdbtc.ContentObject_ID AND mmpde.ContentType_ID = mdbtc.ContentType_ID and mmpde.Profile_ID in (select id from @profiles)
left JOIN dbo.Magic_Labels ml ON ml.Label_ID = mdbi.Magic_Labels_Label_ID and ml.Culture_ID = @culture_ID
WHERE mdbct.Code = 'INDICATOR' AND ISNULL(mdbuc.Active,mdbtc.Active) = 1 AND mmpde.ID IS null
UNION 
SELECT
mdbuc.ID+10000000 AS TabContent_ID, 
mdbi.ID, 
mdbi.Code, 
isnull(ml.Label, mdbi.Description) Description, 
mdbi.IconClass, 
mdbi.Color, 
mdbi.FunctionGUID, 
mdbi.FunctionFilter,
mg.MagicGridName,
mf.FunctionID,
mdbi.MeasurementUnit,
mdbct.ObjectLoadSP,
mdbi.SubValuesLoadSP
FROM #tmptabs t
INNER  JOIN dbo.Magic_DashBoardUserCustom mdbuc ON    mdbuc.Tab_ID = t.ID --Override User
INNER JOIN dbo.Magic_DashBoardContentType mdbct ON mdbct.ID = mdbuc.ContentType_ID
INNER JOIN dbo.Magic_DashBoardIndicators mdbi  ON mdbi.ID = mdbuc.ContentObject_ID
LEFT JOIN dbo.Magic_Functions mf ON mdbi.FunctionGUID = mf.[GUID]
LEFT JOIN dbo.Magic_FunctionsGrids mfg ON mf.FunctionID = mfg.MagicFunction_ID
LEFT JOIN dbo.Magic_Grids mg ON mfg.MagicGrid_ID = mg.MagicGridID
LEFT JOIN dbo.Magic_Mmb_ProfilesDshbrdExcptns mmpde
ON mmpde.ContentObject_ID = mdbuc.ContentObject_ID AND mmpde.ContentType_ID = mdbuc.ContentType_ID and mmpde.Profile_ID in (select id from @profiles)
left JOIN dbo.Magic_Labels ml ON ml.Label_ID = mdbi.Magic_Labels_Label_ID and ml.Culture_ID = @culture_ID
WHERE mdbct.Code = 'INDICATOR' AND mdbuc.Active = 1 AND mmpde.ID IS NULL AND mdbuc.TabContent_ID IS NULL AND mdbuc.User_ID = @userid 


SELECT
isnull(mdbuc.ID+10000000,mdbtc.ID) AS TabContent_ID, 
mdbtc.MagicGridName
FROM #tmptabs t
INNER JOIN dbo.Magic_DashBoardTabContent mdbtc ON mdbtc.Tab_ID = t.ID
LEFT JOIN dbo.Magic_DashBoardUserCustom mdbuc ON mdbuc.TabContent_ID = mdbtc.ID AND @userid = mdbuc.User_ID AND mdbuc.Tab_ID = mdbtc.Tab_ID AND mdbuc.TabContent_ID IS NOT null--Override User
INNER JOIN dbo.Magic_DashBoardContentType mdbct ON mdbct.ID = mdbtc.ContentType_ID
--INNER JOIN dbo.Magic_Grids mg ON mg.MagicGridID = mdbtc.ContentObject_ID
LEFT JOIN dbo.Magic_Mmb_ProfilesGridExcptns mmpge
ON mmpge.MagicGrid_ID = mdbtc.ContentObject_ID AND mmpge.isVisible = 0 AND mmpge.Profile_ID in (select id from @profiles)
WHERE mdbct.Code = 'GRID' AND ISNULL(mdbuc.Active,mdbtc.Active) = 1 AND mmpge.id IS NULL
UNION
SELECT mdbuc.ID+10000000 AS TabContent_ID, 
mg.MagicGridName
FROM #tmptabs t
INNER JOIN dbo.Magic_DashBoardUserCustom mdbuc  ON mdbuc.Tab_ID = t.ID
INNER JOIN dbo.Magic_DashBoardContentType mdbct ON mdbct.ID = mdbuc.ContentType_ID
INNER JOIN dbo.Magic_Grids mg ON mg.MagicGridID = mdbuc.ContentObject_ID
LEFT JOIN dbo.Magic_Mmb_ProfilesGridExcptns mmpge
ON mmpge.MagicGrid_ID = mg.MagicGridID AND mmpge.isVisible = 0 AND mmpge.Profile_ID in (select id from @profiles)
WHERE mdbct.Code = 'GRID' AND mdbuc.Active = 1 AND mmpge.id IS NULL AND mdbuc.User_ID = @userid AND mdbuc.TabContent_ID IS NULL  

SELECT
isnull(mdbuc.ID+10000000,mdbtc.ID) AS TabContent_ID, 
mht.ID,
mht.HtmlUrl,
mht.HtmlContent
FROM #tmptabs t
INNER JOIN dbo.Magic_DashBoardTabContent mdbtc ON mdbtc.Tab_ID = t.ID
LEFT JOIN dbo.Magic_DashBoardUserCustom mdbuc ON mdbuc.TabContent_ID = mdbtc.ID AND @userid = mdbuc.User_ID AND mdbuc.Tab_ID = mdbtc.Tab_ID AND mdbuc.TabContent_ID IS NOT NULL --Override User
INNER JOIN dbo.Magic_DashBoardContentType mdbct ON mdbct.ID = mdbtc.ContentType_ID
INNER JOIN dbo.Magic_HtmlTemplates mht ON mht.ID = mdbtc.ContentObject_ID
LEFT JOIN dbo.Magic_Mmb_ProfilesDshbrdExcptns mmpde
ON mmpde.ContentObject_ID = mdbtc.ContentObject_ID AND mmpde.ContentType_ID = mdbtc.ContentType_ID AND  mmpde.Profile_ID in (select id from @profiles)
WHERE mdbct.Code = 'CUSTOM' AND ISNULL(mdbuc.Active,mdbtc.Active) = 1 AND mmpde.id IS null
UNION
SELECT
mdbuc.ID+10000000 AS TabContent_ID, 
mht.ID,
mht.HtmlUrl,
mht.HtmlContent
FROM #tmptabs t
INNER JOIN dbo.Magic_DashBoardUserCustom mdbuc ON mdbuc.Tab_ID =t.ID --Override User
INNER JOIN dbo.Magic_DashBoardContentType mdbct ON mdbct.ID = mdbuc.ContentType_ID
INNER JOIN dbo.Magic_HtmlTemplates mht ON mht.ID = mdbuc.ContentObject_ID
LEFT JOIN dbo.Magic_Mmb_ProfilesDshbrdExcptns mmpde
ON mmpde.ContentObject_ID = mdbuc.ContentObject_ID AND mmpde.ContentType_ID = mdbuc.ContentType_ID AND  mmpde.Profile_ID in (select id from @profiles)
WHERE mdbct.Code = 'CUSTOM' AND mdbuc.Active = 1 AND mdbuc.TabContent_ID IS NULL AND mdbuc.User_ID = @userid AND mmpde.id IS null


GO

IF EXISTS (
	SELECT 1
		FROM INFORMATION_SCHEMA.VIEWS
		WHERE
			TABLE_NAME = 'HelpObjects'
			AND TABLE_SCHEMA = 'dbo'
)
   DROP VIEW dbo.HelpObjects
GO

CREATE VIEW dbo.HelpObjects  
AS  
 
SELECT
	Code AS Name,
	'DashBoardTab' AS Type,
	HelpGUID,
	ID
	FROM dbo.Magic_DashBoardTabs

UNION ALL  

SELECT
	FunctionName AS Name,
	'Function' AS Type,
	HelpGUID,
	FunctionID AS ID
	FROM dbo.Magic_Functions

UNION ALL  

SELECT
	MagicGridName AS Name,
	'Grid' AS Type,
	HelpGUID,
	MagicGridID AS ID
	FROM dbo.Magic_Grids

GO