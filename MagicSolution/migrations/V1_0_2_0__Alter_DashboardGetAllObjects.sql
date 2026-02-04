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