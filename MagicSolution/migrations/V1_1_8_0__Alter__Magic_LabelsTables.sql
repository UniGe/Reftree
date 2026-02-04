IF NOT EXISTS(SELECT 1
	FROM INFORMATION_SCHEMA.COLUMNS AS c
	WHERE 
	c.TABLE_SCHEMA = N'dbo'
	AND c.TABLE_NAME = N'Magic_FunctionsLabels'
	AND c.COLUMN_NAME = N'Layer_ID')
begin
	ALTER TABLE dbo.Magic_FunctionsLabels
	ADD Layer_ID int NULL ;

	ALTER TABLE [dbo].[Magic_FunctionsLabels] ADD CONSTRAINT [FK_Magic_FunctionsLabels_Magic_ApplicationLayers_LayerID] FOREIGN KEY ([Layer_ID]) REFERENCES [dbo].[Magic_ApplicationLayers] ([LayerID])
end 

GO

IF NOT EXISTS(SELECT 1
	FROM INFORMATION_SCHEMA.COLUMNS AS c
	WHERE 
	c.TABLE_SCHEMA = N'dbo'
	AND c.TABLE_NAME = N'Magic_Mmb_MenuLabels'
	AND c.COLUMN_NAME = N'Layer_ID')
begin
	ALTER TABLE dbo.Magic_Mmb_MenuLabels
	ADD Layer_ID int NULL ;
    

	ALTER TABLE [dbo].[Magic_Mmb_MenuLabels] ADD CONSTRAINT [FK_Magic_Mmb_MenuLabels_Magic_ApplicationLayers_LayerID] FOREIGN KEY ([Layer_ID]) REFERENCES [dbo].[Magic_ApplicationLayers] ([LayerID])

end 

GO


IF NOT EXISTS(SELECT 1
	FROM INFORMATION_SCHEMA.COLUMNS AS c
	WHERE 
	c.TABLE_SCHEMA = N'dbo'
	AND c.TABLE_NAME = N'Magic_Mmb_ModuleLabels'
	AND c.COLUMN_NAME = N'Layer_ID')
begin
	ALTER TABLE dbo.Magic_Mmb_ModuleLabels
	ADD Layer_ID int NULL ;

	ALTER TABLE [dbo].Magic_Mmb_ModuleLabels ADD CONSTRAINT  [FK_Magic_Mmb_ModuleLabels_Magic_ApplicationLayers_LayerID] FOREIGN KEY ([Layer_ID]) REFERENCES [dbo].[Magic_ApplicationLayers] ([LayerID])

end 
GO


IF EXISTS (   SELECT 1
                  FROM INFORMATION_SCHEMA.TABLES AS t
                  WHERE t.TABLE_SCHEMA = N'dbo'
                  AND   t.TABLE_NAME = N'v_Magic_FunctionLabels'
                  AND   t.TABLE_TYPE = N'VIEW')
    DROP VIEW [dbo].[v_Magic_FunctionLabels]
GO

CREATE VIEW [dbo].[v_Magic_FunctionLabels]
AS
SELECT ROW_NUMBER() OVER(ORDER BY FID DESC) AS ID, a.FID as FunctionID, a.FName as FunctionName, a.FDescription as FunctionDescription, a.FHelp as FunctionHelp, a.FCultureID as FunctionCultureID, a.FNameTrans as FunctionNameTrans, a.FDescriptionTrans as FunctionDescriptionTrans, a.FHelpTrans as FunctionHelpTrans,a.Layer_ID,a.[Label_ID]
	FROM
	(
	    Select mFunc.FunctionID as FID, mFunc.FunctionName as FName, mFunc.FunctionDescription as FDescription, mFunc.FunctionHelp as FHelp, mFunc.Magic_CultureID as FCultureID, mFuncLab.FunctionName as FNameTrans, mFuncLab.FunctionDescription as FDescriptionTrans, mFuncLab.FunctionHelp as FHelpTrans,mFuncLab.FunctionLabel_ID as [Label_ID],mFunc.Layer_ID_ as Layer_ID
		FROM 
			(Select * from [dbo].[Magic_Functions] cross join [dbo].[Magic_ManagedCultures] 
				cross join (SELECT al.LayerID as Layer_ID_ from dbo.Magic_ApplicationLayers al
				inner join dbo.Magic_AppLayersTypes alt
				on alt.ID = al.LayerType_ID
				and alt.Code = 'RELALTDATA' UNION select null as Layer_ID_ ) b
				) mFunc
			left join [dbo].[Magic_FunctionsLabels] mFuncLab on mFunc.FunctionID = mFuncLab.Function_ID and mFunc.Magic_CultureID = mFuncLab.Magic_Culture_ID
	) a

GO

IF EXISTS (   SELECT 1
                  FROM INFORMATION_SCHEMA.TABLES AS t
                  WHERE t.TABLE_SCHEMA = N'dbo'
                  AND   t.TABLE_NAME = N'v_Magic_UIComponentsLabels'
                  AND   t.TABLE_TYPE = N'VIEW')
    DROP VIEW [dbo].v_Magic_UIComponentsLabels
GO


CREATE view [dbo].[v_Magic_UIComponentsLabels] as


SELECT ROW_NUMBER() OVER(ORDER BY ObjectType DESC) AS ID,a.ContainerType , a.Container, a.ObjectType ,a.ObjectID, a.defaultlabel,CAST(a.Magic_CultureID as int) as Magic_CultureID , a.translation,a.Layer_ID,a.MenuLabelID as Label_ID
FROM
(
Select 'Module' as ContainerType, modu.ModuleName as Container,'Menu' as ObjectType, menu.MenuID as ObjectID, menu.MenuLabel as defaultlabel, menu.Magic_CultureID, menul.Menulabel as translation,menul.Layer_ID,menul.MenuLabelID
from 
(select * from [dbo].[Magic_Mmb_Menus]  a CROSS JOIN [dbo].[Magic_ManagedCultures] b) menu
inner join [dbo].[Magic_Mmb_Modules] modu on modu.ModuleID = menu.Module_ID
left join [dbo].[Magic_Mmb_MenuLabels] menul on menu.MenuID = menul.Menu_ID and menu.Magic_CultureID = menul.Magic_Culture_ID

UNION

Select 'Application' as ContainerType, 'Application' as Container,'Module' as ObjectType, module.ModuleID as ID,module.ModuleName as defaultlabel,module.Magic_CultureID,modulel.ModuleLabel as translation,modulel.Layer_ID,modulel.ModuleLabel_ID as Label_ID
from 
(select * from [dbo].[Magic_Mmb_Modules] a CROSS JOIN [dbo].[Magic_ManagedCultures] b) module
left join [dbo].[Magic_Mmb_ModuleLabels] modulel on module.ModuleID = modulel.Module_ID and module.Magic_CultureID = modulel.Magic_Culture_ID

UNION

Select 'Grids' as ContainerType, grids.MagicGridName as Container, 'Column' as ObjectType,columns.MagicColumnID as ID, columns.ColumnName as defaultlabel, columns.Magic_CultureID as Magic_CultureID, columnl.ColumnLabel as translation, null as Layer_ID,null as Label_ID
from
(select * from [dbo].[Magic_Columns] a CROSS JOIN [dbo].[Magic_ManagedCultures] b) columns
inner join [dbo].[Magic_Grids] grids on grids.MagicGridID = columns.MagicGrid_ID
left join [dbo].[Magic_ColumnLabels] columnl on columns.MagicColumnID = columnl.Magic_Column_ID and columns.Magic_CultureID = columnl.MagicCulture_ID

UNION

Select 'MagicTemplateName' as ContainerType, templates.MagicTemplateName,'Tab' as ObjectType, tgroups.MagicTemplateGroupID as ID, tgroups.MagicTemplateGroupLabel as defaultlabel, tgroups.Magic_CultureID as Magic_Culture_ID, tgroupsl.MagicTemplateGroupLabel as translation, null as Layer_ID,null as Label_ID
from
(select * from [dbo].[Magic_TemplateGroups] a CROSS JOIN [dbo].[Magic_ManagedCultures] b) tgroups
inner join [dbo].[Magic_Templates] templates on templates.MagicTemplateID = tgroups.MagicTemplate_ID
left join [dbo].[Magic_TemplateGroupLabels] tgroupsl on tgroups.MagicTemplateGroupID = tgroupsl.MagicTemplateGroup_ID and tgroups.Magic_CultureID = tgroupsl.MagicCulture_ID

UNION

Select 'MagicTemplateName' as ContainerType, templates.MagicTemplateName,'TabGroup' as ObjectType, tgroups.MagicTemplateTabGroupID as ID, tgroups.MagicTemplateTabGroupLabel as defaultlabel, tgroups.Magic_CultureID as Magic_Culture_ID, tgroupsl.MagicTemplateTabGroupLabel as translation, null as Layer_ID,null as Label_ID
from
(select * from [dbo].[Magic_TemplateTabGroups] a CROSS JOIN [dbo].[Magic_ManagedCultures] b) tgroups
inner join [dbo].[Magic_Templates] templates on templates.MagicTemplateID = tgroups.MagicTemplate_ID
left join [dbo].[Magic_TemplateTabGroupLabels] tgroupsl on tgroups.MagicTemplateTabGroupID = tgroupsl.MagicTemplateTabGroup_ID and tgroups.Magic_CultureID = tgroupsl.MagicCulture_ID
) a


GO
IF EXISTS (  SELECT 1
                  FROM INFORMATION_SCHEMA.ROUTINES AS t
                  WHERE t.ROUTINE_NAME = N'getManagedCulturesFunctions'
                  AND   t.ROUTINE_SCHEMA = N'dbo'
                  AND   t.ROUTiNE_TYPE = N'FUNCTION')
    DROP FUNCTION [dbo].getManagedCulturesFunctions
GO
--D.T 08/02/2022 added layer management
CREATE FUNCTION [dbo].[getManagedCulturesFunctions] (@isSystemFunction bit)
RETURNS @managedCulturesFunctions TABLE (
ID int,
FunctionID int,
FunctionName nvarchar(max),
FunctionDescription nvarchar(max),
FunctionHelp nvarchar(max),
FunctionCultureID int,
FunctionNameTrans nvarchar(max),
FunctionDescriptionTrans nvarchar(max),
FunctionHelpTrans nvarchar(max),
Layer_ID int,
[Label_ID] int
)

AS
  BEGIN 
  declare @layers TABLE (Layer_ID_ int) 

	insert into @layers(Layer_ID_)
	SELECT al.LayerID from dbo.Magic_ApplicationLayers al
	inner join dbo.Magic_AppLayersTypes alt
	on alt.ID = al.LayerType_ID
	and alt.Code = 'RELALTDATA' --Master-detail 

	insert into @layers(Layer_ID_)
	values (null) --standard translation

	INSERT INTO @managedCulturesFunctions
	SELECT ROW_NUMBER() OVER(ORDER BY FID DESC) AS ID, a.FID as FunctionID, a.FName as FunctionName, a.FDescription as FunctionDescription, a.FHelp as FunctionHelp, a.FCultureID as FunctionCultureID, a.FNameTrans as FunctionNameTrans, a.FDescriptionTrans as FunctionDescriptionTrans, a.FHelpTrans as FunctionHelpTrans,a.Layer_ID as Layer_ID,a.FunctionLabel_ID as [Label_ID]
	FROM
	(
	    Select mFunc.FunctionID as FID, mFunc.FunctionName as FName, mFunc.FunctionDescription as FDescription, mFunc.FunctionHelp as FHelp, mFunc.Magic_CultureID as FCultureID, mFuncLab.FunctionName as FNameTrans, mFuncLab.FunctionDescription as FDescriptionTrans, mFuncLab.FunctionHelp as FHelpTrans,mFunc.Layer_ID_ as Layer_ID,mFuncLab.FunctionLabel_ID
		FROM 
			(Select * from [dbo].[Magic_Functions] cross join [dbo].[Magic_ManagedCultures] CROSS JOIN @layers l  WHERE dbo.Magic_Functions.isSystemFunction = @isSystemFunction) mFunc
			left join [dbo].[Magic_FunctionsLabels] mFuncLab on mFunc.FunctionID = mFuncLab.Function_ID and mFunc.Magic_CultureID = mFuncLab.Magic_Culture_ID and isnull(mFunc.Layer_ID_,0) = isnull(mFuncLab.Layer_ID,0)
	) a

   RETURN
END

GO

IF EXISTS (  SELECT 1
                  FROM INFORMATION_SCHEMA.ROUTINES AS t
                  WHERE t.ROUTINE_NAME = N'Magic_GetModMenuLabels'
                  AND   t.ROUTINE_SCHEMA = N'dbo'
                  AND   t.ROUTiNE_TYPE = N'FUNCTION')
    DROP FUNCTION [dbo].Magic_GetModMenuLabels
GO

--07/02/2022 added Layer_ID to manage labels by layer
CREATE FUNCTION [dbo].[Magic_GetModMenuLabels]
(@isSystem bit)
RETURNS @tabella TABLE  
(
ID [bigint], [ContainerType]  nvarchar(max),[Container] [nvarchar](max),[ObjectType] nvarchar(max),[ObjectID] int,defaultlabel nvarchar(max),[Magic_CultureID] int ,translation nvarchar(max),Layer_ID int,Label_ID int
)
AS
begin

declare @layers TABLE (Layer_ID int) 

insert into @layers(Layer_ID)
SELECT al.LayerID from dbo.Magic_ApplicationLayers al
inner join dbo.Magic_AppLayersTypes alt
on alt.ID = al.LayerType_ID
and alt.Code = 'RELALTDATA' --Master-detail 


insert into @layers(Layer_ID)
values (null) --standard translation



insert into @tabella
SELECT ROW_NUMBER() OVER(ORDER BY ObjectType DESC) AS ID,a.ContainerType , a.Container, a.ObjectType ,a.ObjectID, a.defaultlabel,CAST(a.Magic_CultureID as int) as Magic_CultureID , a.translation,Layer_ID,LabelID
FROM
(
Select 'Module' as ContainerType, modu.ModuleName as Container,'Type::Menu | Module::'+modu.ModuleName as ObjectType, menu.MenuID as ObjectID, menu.MenuLabel as defaultlabel, menu.Magic_CultureID, menul.Menulabel as translation,menu.Layer_ID,menul.MenuLabelID as LabelID 
from 
(select * from [dbo].[Magic_Mmb_Menus]  a CROSS JOIN [dbo].[Magic_ManagedCultures] b CROSS JOIN @layers l) menu
inner join [dbo].[Magic_Mmb_Modules] modu on modu.ModuleID = menu.Module_ID
left join [dbo].[Magic_Mmb_MenuLabels] menul on menu.MenuID = menul.Menu_ID and menu.Magic_CultureID = menul.Magic_Culture_ID and isnull(menul.Layer_ID,0) = isnull(menu.Layer_ID,0)

UNION

Select 'Application' as ContainerType, 'Application' as Container,'Type::Module | Application' as ObjectType, module.ModuleID as ID,module.ModuleName as defaultlabel,module.Magic_CultureID,modulel.ModuleLabel as translation,module.Layer_ID,modulel.ModuleLabel_ID as LabelID
from 
(select * from [dbo].[Magic_Mmb_Modules] a CROSS JOIN [dbo].[Magic_ManagedCultures] b CROSS JOIN @layers l) module
left join [dbo].[Magic_Mmb_ModuleLabels] modulel on module.ModuleID = modulel.Module_ID and module.Magic_CultureID = modulel.Magic_Culture_ID and isnull(module.Layer_ID,0) = isnull(modulel.Layer_ID,0)

) a
   RETURN
END  


GO
