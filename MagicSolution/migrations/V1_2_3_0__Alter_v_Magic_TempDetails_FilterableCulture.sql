if exists (select 1
           from INFORMATION_SCHEMA.TABLES as t
           where t.TABLE_SCHEMA = N'dbo'
                 and t.TABLE_NAME = N'v_Magic_TempDetails_FilterableCulture'
                 and t.TABLE_TYPE = N'VIEW')
    drop view [dbo].[v_Magic_TempDetails_FilterableCulture];
go
IF NOT EXISTS(SELECT 1
	FROM INFORMATION_SCHEMA.COLUMNS AS c
	WHERE 
	c.TABLE_SCHEMA = N'dbo'
	AND c.TABLE_NAME = N'Magic_Columns'
	AND c.COLUMN_NAME = N'GridFilterExtension')
begin
	ALTER TABLE dbo.Magic_Columns
	ADD GridFilterExtension nvarchar(max) NULL;
end
go

create view [dbo].[v_Magic_TempDetails_FilterableCulture]
as
     select c.MagicTemplateDetailID
          , c.MagicTemplate_ID
          , c.MagicTemplateGroup_ID
          --, c.OrdinalPosition -- changed to show the position of the columns on the grid and not in the edit popup
		  , col.Columns_OrdinalPosition as OrdinalPosition
          , c.MagicDataRole_ID
          , c.MagicNullOptionLabel
          , c.MagicDataSourceValueField
          , c.MagicDataSourceTextField
          , c.MagicDataSource
          , c.MagicDataSourceType_ID
          , c.MagicDataSourceSchema
          , col.Columns_isFilterable as Detailisvisible
          , c.DetailInheritsFromColumn_ID
          , c.DetailonchangeFunctionName
          , c.DetailDOMID
          , c.DetailInheritsFromGroup_ID
          , c.SearchGrid_ID
          , c.SearchGridDescColumn_ID
          , c.CascadeColumn_ID
          , c.CascadeFilterCol_ID
          , c.MagicTemplateType
          , c.MagicTemplateGroupClass
          , c.MagicTemplateGroupLabel
          , c.ColumnName
          , c.Columns_label
          , c.MagicFormExtension
          , c.MagicGridName
          , c.SearchGridName
          , c.SearchGridDescColName
          , c.Magic_CultureID
          , c.Schema_defaultvalue
          , c.StringLength
          , c.Schema_Numeric_max
          , c.Schema_Numeric_min
          , c.Schema_Numeric_step
          , cast(0 as bit) as Schema_required
          , c.Schema_type
         -- , c.GroupOrdinalPosition -- changed to show the position of the columns on the grid and not in the edit popup, no need for tabs
          , null GroupOrdinalPosition
          , c.MagicTemplateDataRole
          , c.Layer_ID
          , c.Upload_SavePath
          , c.Upload_Multi
          , c.UploadAllowedFileExtensions
          , c.Schema_Format
          , c.TabGroupOrdinalPosition
          , c.TabGroupID
          , c.TabGroupColor
          , c.TabGroupDefaultLabel
          , col.Columns_isFilterable as Schema_editable
          , c.CultureColumns_label
          , c.CultureGroups_label
          , c.Magic_Language
          , c.Magic_CultureLanguage
          , c.TabGroupLabel
          , c.CascadeColumnName
          , c.CascadeFilterColumnName
          , col.GridFilterExtension
     from dbo.v_Magic_TempDetails_Culture as c
          inner join dbo.Magic_Columns as col on col.MagicColumnID = c.DetailInheritsFromColumn_ID
     where(c.MagicTemplateDataRole not in ('applicationupload', 'adminareaupload', 'business_object_selector') );
go



