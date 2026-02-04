
ALTER procedure [dbo].[RefreshMagicTemplates] 
@templateid int,
@templatelayoutid int,
@templatetypeID int,
@refgridid int,
@TableName varchar(100),
@schema varchar(100) = 'dbo'

as

DECLARE @targetDBname varchar(200) = (SELECT [dbo].[uf_parseSchema] (@Schema,0,1))
SET @schema = (SELECT [dbo].[uf_parseSchema] (@Schema,1,0))
--creazione sinonimi
exec dbo.Magic_build_infoschema_syn @targetDBname

DECLARE @tempsql nvarchar(1000)

SELECT TOP 1 * INTO #INFORMATION_SCHEMA_COLUMNS FROM INFORMATION_SCHEMA.COLUMNS c 
DELETE #INFORMATION_SCHEMA_COLUMNS

SELECT TOP 1 * INTO #INFORMATION_SCHEMA_REFERENTIAL_CONSTRAINTS FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc 
DELETE #INFORMATION_SCHEMA_REFERENTIAL_CONSTRAINTS

SELECT TOP 1 * INTO #INFORMATION_SCHEMA_TABLE_CONSTRAINTS FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc  
DELETE #INFORMATION_SCHEMA_TABLE_CONSTRAINTS

SELECT TOP 1 * INTO #INFORMATION_SCHEMA_KEY_COLUMN_USAGE FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu  
DELETE #INFORMATION_SCHEMA_KEY_COLUMN_USAGE


set @tempsql='INSERT INTO #INFORMATION_SCHEMA_COLUMNS
SELECT * FROM '+@targetDBname + '_INFORMATION_SCHEMA_COLUMNS'
EXECUTE sp_executesql @tempsql

set @tempsql='INSERT INTO #INFORMATION_SCHEMA_REFERENTIAL_CONSTRAINTS
SELECT * FROM '+@targetDBname + '_INFORMATION_SCHEMA_REFERENTIAL_CONSTRAINTS'
EXECUTE sp_executesql @tempsql

set @tempsql='INSERT INTO #INFORMATION_SCHEMA_TABLE_CONSTRAINTS
SELECT * FROM '+@targetDBname + '_INFORMATION_SCHEMA_TABLE_CONSTRAINTS'
EXECUTE sp_executesql @tempsql

set @tempsql='INSERT INTO #INFORMATION_SCHEMA_KEY_COLUMN_USAGE
SELECT * FROM '+@targetDBname + '_INFORMATION_SCHEMA_KEY_COLUMN_USAGE'
EXECUTE sp_executesql @tempsql

-- Marco 18/03/2016
delete from #INFORMATION_SCHEMA_KEY_COLUMN_USAGE
where COLUMN_NAME in (SELECT columnName 
FROM dbo.Magic_ColsToExcludeOnBuild)
-- Fine Marco 18/03/2016

declare @groupid int
DECLARE @templisnew bit = 0

DELETE [dbo].[Magic_TemplateScriptsBuffer] where [Magic_Template_ID] = @templateid


set @groupid = (select top 1 MagicTemplateGroupID
                  from dbo.Magic_TemplateGroups
                  where MagicTemplate_ID = @templateid
                    and MagicTemplateGroupContent_ID = (
                                                        select MagicTemplateGroupContentID
                                                          from dbo.Magic_TemplateGroupContent
                                                          where MagicTemplateGroupContentType = 'FIELDLABELLIST'));  --by default i link all the label fileds to the last tab  

if @templatetypeID = (select MagicTemplateTypeID
                        from dbo.Magic_TemplateTypes
                        where MagicTemplateType = 'POPUPEDITOR')
    begin

        set @groupid = (select top 1 MagicTemplateGroupID
                          from dbo.Magic_TemplateGroups
                          where MagicTemplate_ID = @templateid
                            and MagicTemplateGroupContent_ID = (
                                                                select MagicTemplateGroupContentID
                                                                  from dbo.Magic_TemplateGroupContent
                                                                  where MagicTemplateGroupContentType = 'FIELDEDITLIST'));  --by default i link all the label fileds to the last tab  

        if isnull(@groupid, -1) <> -1
            BEGIN

			IF ((SELECT count(0) FROM dbo.Magic_TemplateDetails mtd WHERE mtd.MagicTemplate_ID = @templateid) = 0) 
				SET @templisnew = 1;

                insert into dbo.Magic_TemplateDetails([MagicTemplate_ID]
													   ,[MagicTemplateGroup_ID]
													   ,[OrdinalPosition]
													   ,[MagicDataRole_ID]
													   ,[MagicNullOptionLabel]
													   ,[MagicDataSourceValueField]
													   ,[MagicDataSourceTextField]
													   ,[MagicDataSource]
													   ,[Detailisvisible]
													   ,[DetailInheritsFromColumn_ID]
													   ,[DetailonchangeFunctionName]
													   ,[DetailDOMID]
													   )
                select @templateid, 
                       @groupid, 
                       C.ORDINAL_POSITION,
                       --row_number() over (order by c.COLUMN_NAME) ,
					   [dbo].[Magic_GetDataRoleByDataType](DATA_TYPE,fk.PK_Table)  as dataroleid, 
                       'N/A' as nulloption, 
                       case isnull(fk.PK_Table, '')
                           when '' then null
                           else fk.PK_Column
                       end as datasourcevaluefield, 
                       case isnull(fk.PK_Table, '')
                           when '' then null
                           else(
                               SELECT TOP 1 CC.COLUMN_NAME  FROM #INFORMATION_SCHEMA_COLUMNS AS CC
								WHERE CC.TABLE_NAME = fk.PK_Table 
								GROUP BY CC.COLUMN_NAME,CC.CHARACTER_MAXIMUM_LENGTH
								HAVING CC.CHARACTER_MAXIMUM_LENGTH = MAX(CC.CHARACTER_MAXIMUM_LENGTH)
								ORDER BY CC.CHARACTER_MAXIMUM_LENGTH DESC)
                       end as datasourcetextfield, 
                       fk.PK_Table + 'ds' as datasource, 
					   -- se e' la prima volta che scrivo i detail @templisnew = 1 metto a visibile tutto cio' che non e' PK, altrimenti aggiungo come non visibile
					   	 case   @templisnew when 1 then 
													case isnull(cu.COLUMN_NAME,'0') WHEN '0' then 1 ELSE 0 end
											else 0
					     end, --is visible	 
                       mc.MagicColumnID as InheritsFromColumn, 
                       null, 
                       fk.PK_Table + 'dd' as DetailDOMID
                  from
                       #INFORMATION_SCHEMA_COLUMNS c left join(
                                                              select distinct i2.COLUMN_NAME
                                                                from
                                                                     #INFORMATION_SCHEMA_TABLE_CONSTRAINTS i1 
																	 inner join #INFORMATION_SCHEMA_KEY_COLUMN_USAGE i2
                                                                     on i1.CONSTRAINT_NAME = i2.CONSTRAINT_NAME
                                                                    and i1.TABLE_NAME = i2.TABLE_NAME and i1.TABLE_SCHEMA = i2.TABLE_SCHEMA
                                                                where i1.CONSTRAINT_TYPE = 'PRIMARY KEY'
                                                                  and i1.TABLE_NAME = @TableName and i1.TABLE_SCHEMA=@schema and i2.TABLE_SCHEMA = @schema)cu
                       on cu.COLUMN_NAME = c.COLUMN_NAME
                                                    left join(
                                                              select K_Table = FK.TABLE_NAME, 
                                                                     FK_Column = CU.COLUMN_NAME, 
                                                                     PK_Table = PK.TABLE_NAME, 
                                                                     PK_Column = PT.COLUMN_NAME, 
                                                                     Constraint_Name = C.CONSTRAINT_NAME
                                                                from
                                                                     #INFORMATION_SCHEMA_REFERENTIAL_CONSTRAINTS C 
																	 inner join #INFORMATION_SCHEMA_TABLE_CONSTRAINTS FK
                                                                     on C.CONSTRAINT_NAME = FK.CONSTRAINT_NAME
                                                                     inner join #INFORMATION_SCHEMA_TABLE_CONSTRAINTS PK
                                                                     on C.UNIQUE_CONSTRAINT_NAME = PK.CONSTRAINT_NAME
                                                                     inner join #INFORMATION_SCHEMA_KEY_COLUMN_USAGE CU
                                                                     on C.CONSTRAINT_NAME = CU.CONSTRAINT_NAME
                                                              inner join(
                                                              select i1.TABLE_NAME, 
                                                                     i2.COLUMN_NAME
                                                                from
                                                                     #INFORMATION_SCHEMA_TABLE_CONSTRAINTS i1 
																	 inner join #INFORMATION_SCHEMA_KEY_COLUMN_USAGE i2
                                                                     on i1.CONSTRAINT_NAME = i2.CONSTRAINT_NAME
                                                                where i1.CONSTRAINT_TYPE = 'PRIMARY KEY')PT
                                                                     on PT.TABLE_NAME = PK.TABLE_NAME)fk
                       on c.TABLE_NAME = fk.k_table
                      and c.COLUMN_NAME = fk.FK_Column
                                                    inner join(
                                                               select MagicColumnID, 
                                                                      ColumnName
                                                                 from dbo.Magic_Columns
                                                                 where MagicGrid_ID = @refgridid)mc
                       on mc.ColumnName = c.COLUMN_NAME
                                                    left join dbo.Magic_TemplateDetails det
                       on det.DetailInheritsFromColumn_ID = mc.MagicColumnID
                      and det.MagicTemplate_ID = @templateid
                  where c.TABLE_NAME = @TableName and c.TABLE_SCHEMA = @schema
                    and isnull(det.MagicTemplateDetailID, -1) = -1
            end;

			--Aggiorno le FK delle viste se non ancora trovate

			DECLARE  @table TABLE (detid int, datasource varchar(100), valuefield varchar(100), textfield varchar(100)) 

			INSERT INTO @table (detid,valuefield,textfield,datasource)
			SELECT td.MagicTemplateDetailID,ug.FKVALUE,ug.FKTEXT,ug.FKTABLE 
			FROM dbo.USF_GETCOLINFOEX(@TableName) ug
			INNER join
			(SELECT MagicTemplateDetailID,DetailInheritsFromColumn_ID,c.ColumnName FROM dbo.Magic_TemplateDetails t 
			inner JOIN dbo.Magic_Columns c ON t.DetailInheritsFromColumn_ID = c.MagicColumnID
			 WHERE MagicDataSource is null and MagicDataSourceTextField is null and MagicDataSourceValueField is null) td
			 ON td.ColumnName = ug.NAME COLLATE SQL_Latin1_General_CP1_CI_AS
			 WHERE ug.ISFK = 1 AND ug.ISPK = 0

			 DECLARE @dropdatarole int

			 SELECT @dropdatarole = mtdr.MagicTemplateDataRoleID FROM dbo.Magic_TemplateDataRoles mtdr WHERE mtdr.MagicTemplateDataRole = 'dropdownlist'

	        declare @searchgriddatarole int;

			select @searchgriddatarole = mtdr.MagicTemplateDataRoleID
			from dbo.Magic_TemplateDataRoles mtdr
			where mtdr.MagicTemplateDataRole = 'searchgrid';

			declare @searchgrid_acdatarole int;

			select @searchgrid_acdatarole = mtdr.MagicTemplateDataRoleID
			from dbo.Magic_TemplateDataRoles mtdr
			where mtdr.MagicTemplateDataRole = 'searchgrid_autocomplete';

			update mtd
				set mtd.MagicDataSource = t.datasource
				  , mtd.MagicDataSourceTextField = t.textfield
				  , mtd.MagicDataSourceValueField = t.valuefield
				  , mtd.MagicDataRole_ID = @dropdatarole
				  , mtd.DetailDOMID = t.datasource + 'dd'
			from dbo.Magic_TemplateDetails mtd
				 inner join @table t on t.detid = mtd.MagicTemplateDetailID
			where mtd.MagicDataRole_ID not in (@searchgriddatarole, @searchgrid_acdatarole);
			
    end;

if @templatetypeID = (select MagicTemplateTypeID
                        from dbo.Magic_TemplateTypes
                        where MagicTemplateType = 'NAVIGATION')
or @templatetypeID = (select MagicTemplateTypeID
                        from dbo.Magic_TemplateTypes
                        where MagicTemplateType = 'NAVIGATIONPARTIAL')
    begin

        if isnull(@groupid, -1) <> -1
            begin
                insert into dbo.Magic_TemplateDetails([MagicTemplate_ID]
													   ,[MagicTemplateGroup_ID]
													   ,[OrdinalPosition]
													   ,[MagicDataRole_ID]
													   ,[MagicNullOptionLabel]
													   ,[MagicDataSourceValueField]
													   ,[MagicDataSourceTextField]
													   ,[MagicDataSource]
													   ,[Detailisvisible]
													   ,[DetailInheritsFromColumn_ID]
													   ,[DetailonchangeFunctionName]
													   ,[DetailDOMID]
													   )
                select @templateid, 
                       @groupid, 
                       C.ORDINAL_POSITION,
                       --row_number() over (order by c.COLUMN_NAME) ,
                       (
                        select MagicTemplateDataRoleID
                          from dbo.Magic_TemplateDataRoles
                          where MagicTemplateDataRole = 'labelfield')dataroleid, 
                       'N/A' as nulloption, 
                       c.COLUMN_NAME as datasourcevaluefield, 
                       null as datasourcetextfield, 
                       null as datasourceId, 
                       1 as isvsibile, 
                       mc.MagicColumnID as InheritsFromColumn, 
                       null, 
                       null
                  from
                       #INFORMATION_SCHEMA_COLUMNS c left join(
                                                              select distinct i2.COLUMN_NAME
                                                                from
                                                                     #INFORMATION_SCHEMA_TABLE_CONSTRAINTS i1 
																	 inner join #INFORMATION_SCHEMA_KEY_COLUMN_USAGE i2
                                                                     on i1.CONSTRAINT_NAME = i2.CONSTRAINT_NAME
                                                                    and i1.TABLE_NAME = i2.TABLE_NAME and i1.TABLE_SCHEMA = i2.TABLE_SCHEMA
                                                                where i1.CONSTRAINT_TYPE = 'PRIMARY KEY'
                                                                  and i1.TABLE_NAME = @TableName and i1.TABLE_SCHEMA=@schema and i2.TABLE_SCHEMA = @schema)cu
                       on cu.COLUMN_NAME = c.COLUMN_NAME
                                                    left join(
                                                              select K_Table = FK.TABLE_NAME, 
                                                                     FK_Column = CU.COLUMN_NAME, 
                                                                     PK_Table = PK.TABLE_NAME, 
                                                                     PK_Column = PT.COLUMN_NAME, 
                                                                     Constraint_Name = C.CONSTRAINT_NAME
                                                                from
                                                                     #INFORMATION_SCHEMA_REFERENTIAL_CONSTRAINTS C 
																	 inner join #INFORMATION_SCHEMA_TABLE_CONSTRAINTS FK
                                                                     on C.CONSTRAINT_NAME = FK.CONSTRAINT_NAME
                                                                     inner join #INFORMATION_SCHEMA_TABLE_CONSTRAINTS PK
                                                                     on C.UNIQUE_CONSTRAINT_NAME = PK.CONSTRAINT_NAME
                                                                     inner join #INFORMATION_SCHEMA_KEY_COLUMN_USAGE CU
                                                                     on C.CONSTRAINT_NAME = CU.CONSTRAINT_NAME
                                                                     inner join(
                                                              select i1.TABLE_NAME, 
                                                                     i2.COLUMN_NAME
                                                                from
                                                                     #INFORMATION_SCHEMA_TABLE_CONSTRAINTS i1 
																	 inner join #INFORMATION_SCHEMA_KEY_COLUMN_USAGE i2
                                                                     on i1.CONSTRAINT_NAME = i2.CONSTRAINT_NAME
                                                                where i1.CONSTRAINT_TYPE = 'PRIMARY KEY')PT
                                                                     on PT.TABLE_NAME = PK.TABLE_NAME)fk
                       on c.TABLE_NAME = fk.k_table
                      and c.COLUMN_NAME = fk.FK_Column
                                                    inner join(
                                                               select MagicColumnID, 
                                                                      ColumnName
                                                                 from dbo.Magic_Columns
                                                                 where MagicGrid_ID = @refgridid)mc
                       on mc.ColumnName = c.COLUMN_NAME
                                                    left join dbo.Magic_TemplateDetails det
                       on det.DetailInheritsFromColumn_ID = mc.MagicColumnID
                      and det.MagicTemplate_ID = @templateid
                  where c.TABLE_NAME = @TableName and c.TABLE_SCHEMA = @schema
                    and isnull(det.MagicTemplateDetailID, -1) = -1
            end;

    end;
