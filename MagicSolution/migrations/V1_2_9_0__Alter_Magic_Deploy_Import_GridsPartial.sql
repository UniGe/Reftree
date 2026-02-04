GO
/****** Object:  StoredProcedure [DEPLOY].[Magic_Deploy_Import_GridsPartial]    Script Date: 07/09/2023 15:33:52 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*D.T 07/09/2023 - added selected alignment as in mail with luca angelino 31/8/2023*/
ALTER procedure [DEPLOY].[Magic_Deploy_Import_GridsPartial] (
                @xmlInput xml)
as
begin
    declare @USERCOLS int = 10000000;

    begin tran;

    begin try

        select e.query ('.') .value ('(//MagicGridID)[1]', 'int') as MagicGridID
        into #selectedgrids
        from @xmlInput.nodes ('//modelselement') M(e);

        declare @imported int = (select count(0)
                                 from #selectedgrids);

        select distinct
               MagicTemplateID
        into #selectedtemplates
        from DEPLOY.DEP_Magic_Templates
        where [BaseGrid_ID] in (select MagicGridID
                                from #selectedgrids);

        ----add the searchgrids in scope
        --insert into #selectedgrids 
        --select SearchGrid_ID 
        --from DEPLOY.DEP_Magic_TemplateDetails dtd
        --left join #selectedgrids g
        --on g.MagicGridID = dtd.SearchGrid_ID	
        --where MagicTemplate_ID in
        -- (	select MagicTemplateID 
        --from #selectedtemplates) and g.MagicGridID is null and dtd.SearchGrid_ID is not null
        ----add the binded grids in scope
        --insert into #selectedgrids 
        --select BindedGrid_ID
        --from DEPLOY.DEP_Magic_TemplateGroups dtd
        --left join #selectedgrids g
        --on g.MagicGridID = dtd.BindedGrid_ID	
        --where MagicTemplate_ID in
        -- (select MagicTemplateID 
        --  from #selectedtemplates) 
        --  and g.MagicGridID is null and dtd.BindedGrid_ID is not null
        --  declare @related int =   (select count(0) from #selectedgrids) - @imported
        --aggiorno se gia' presente il datasource della griglia in esame
        update ds
            set ds.CoreGrid_ID = depds.CoreGrid_ID
              , ds.CustomJSONParam = depds.CustomJSONParam
              , ds.Filter = depds.Filter
              , ds.Layer_ID = depds.Layer_ID
              , ds.ObjComplete = depds.ObjComplete
              , ds.ObjCreate = depds.ObjCreate
              , ds.ObjDestroy = depds.ObjDestroy
              , ds.ObjParameterMap = depds.ObjParameterMap
              , ds.ObjRead = depds.ObjRead
              , ds.ObjUpdate = depds.ObjUpdate
              , ds.OrderByFieldName = depds.OrderByFieldName
        from dbo.Magic_DataSource ds
             inner join DEPLOY.DEP_Magic_DataSource depds on ds.Name = depds.Name
        where depds.MagicDataSourceID in (select MagicDataSource_ID
                                          from DEPLOY.DEP_Magic_Grids
                                          where MagicGridID in (select MagicGridID
                                                                from #selectedgrids) );

        declare @maxDsNonCustom_ID int;
        select @maxDsNonCustom_ID = max(MagicDataSourceID)
        from Magic_DataSource
        where MagicDataSourceID < @USERCOLS;

        set identity_insert dbo.Magic_DataSource on;
        insert into dbo.Magic_DataSource
               (MagicDataSourceID
              , dbo.Magic_DataSource.Name
              , dbo.Magic_DataSource.ObjRead
              , dbo.Magic_DataSource.ObjUpdate
              , dbo.Magic_DataSource.ObjCreate
              , dbo.Magic_DataSource.ObjDestroy
              , dbo.Magic_DataSource.ObjParameterMap
              , dbo.Magic_DataSource.ObjComplete
              , dbo.Magic_DataSource.Filter
              , dbo.Magic_DataSource.CustomJSONParam
              , dbo.Magic_DataSource.Layer_ID
              , dbo.Magic_DataSource.CoreGrid_ID
              , dbo.Magic_DataSource.OrderByFieldName)
        select row_number() over(
               order by depds.MagicDataSourceID) + @maxDsNonCustom_ID
             , depds.[Name]
             , depds.[ObjRead]
             , depds.[ObjUpdate]
             , depds.[ObjCreate]
             , depds.[ObjDestroy]
             , depds.[ObjParameterMap]
             , depds.[ObjComplete]
             , depds.[Filter]
             , depds.[CustomJSONParam]
             , null
             , null
             , depds.[OrderByFieldName]
        from DEPLOY.[DEP_Magic_DataSource] depds
             left join dbo.Magic_DataSource ds on ds.Name = depds.Name
        where ds.MagicDataSourceID is null
              and depds.MagicDataSourceID in (select MagicDataSource_ID
                                              from DEPLOY.DEP_Magic_Grids
                                              where MagicGridID in (select MagicGridID
                                                                    from #selectedgrids) );
        set identity_insert dbo.Magic_DataSource off;

        update t
            set t.MagicDataSource_ID = coalesce(ds.MagicDataSourceID, t.MagicDataSource_ID)
              , t.MagicGridName = s.MagicGridName
              , t.MagicGridEntity = s.MagicGridEntity
              , t.MagicGridModel = s.MagicGridModel
              , t.MagicGridColumns = s.MagicGridColumns
              , t.MagicGridTransport = s.MagicGridTransport
              , t.MagicGridColumnsCommand = s.MagicGridColumnsCommand
              , t.Sortable = s.Sortable
              , t.Groupable = s.Groupable
              , t.Editable = s.Editable
              , t.Toolbar = s.Toolbar
              , t.DetailTemplate = s.DetailTemplate
              , t.EditableTemplate = s.EditableTemplate
              , t.DetailInitJSFunction = s.DetailInitJSFunction
              , t.EditJSFunction = s.EditJSFunction
              , t.FromClass = s.FromClass
              , t.fromTable = s.fromTable
              , t.isSystemGrid = s.isSystemGrid
              , t.PageSize = s.PageSize
              , t.FullExport = s.FullExport
              , t.MagicGridExtension = s.MagicGridExtension
              , t.EditFormColumnNum = s.EditFormColumnNum
			  , T.Selectable=s.Selectable  --LA 31/08
        from DEPLOY.DEP_Magic_Grids s
             inner join dbo.Magic_Grids t on s.GUID = t.GUID
        inner join #selectedgrids sg on sg.MagicGridID = s.MagicGridID
        left join DEPLOY.DEP_Magic_DataSource depds on s.MagicDataSource_ID = depds.MagicDataSourceID
        left join dbo.Magic_DataSource ds on ds.Name = depds.Name;

        print '--aggiornate griglie intersecate';

        declare @nextMaxGridNonCustom_ID int;
        select @nextMaxGridNonCustom_ID = max(MagicGridID)
        from Magic_Grids
        where MagicGridID < @USERCOLS;

        set identity_insert dbo.Magic_Grids on;

        insert into dbo.Magic_Grids
               (MagicGridID
              , MagicDataSource_ID
              , MagicGridName
              , MagicGridEntity
              , MagicGridModel
              , MagicGridColumns
              , MagicGridTransport
              , MagicGridColumnsCommand
              , Sortable
              , Groupable
              , Editable
              , Toolbar
              , Selectable
              , DetailTemplate
              , EditableTemplate
              , DetailInitJSFunction
              , EditJSFunction
              , FromClass
              , fromTable
              , isSystemGrid
              , PageSize
              , GUID
              , FullExport
              , MagicGridExtension
              , EditFormColumnNum)
        select row_number() over(
               order by s.MagicGridID) + @nextMaxGridNonCustom_ID
             , ds.MagicDataSourceID
             , s.MagicGridName
             , s.MagicGridEntity
             , s.MagicGridModel
             , s.MagicGridColumns
             , s.MagicGridTransport
             , s.MagicGridColumnsCommand
             , s.Sortable
             , s.Groupable
             , s.Editable
             , s.Toolbar
             , s.Selectable
             , s.DetailTemplate
             , s.EditableTemplate
             , s.DetailInitJSFunction
             , s.EditJSFunction
             , s.FromClass
             , s.fromTable
             , s.isSystemGrid
             , s.PageSize
             , s.GUID
             , s.FullExport
             , s.MagicGridExtension
             , s.EditFormColumnNum
        from DEPLOY.DEP_Magic_Grids s
             inner join #selectedgrids sg on sg.MagicGridID = s.MagicGridID
        left join dbo.Magic_Grids t on t.GUID = s.GUID
                                       and t.GUID is not null
        left join DEPLOY.DEP_Magic_DataSource depds on s.MagicDataSource_ID = depds.MagicDataSourceID
        left join dbo.Magic_DataSource ds on ds.Name = depds.Name
        where isnull(t.MagicGridID, -1) = -1
              and s.MagicGridID in (select MagicGridID
                                    from #selectedgrids);
        set identity_insert dbo.Magic_Grids off;

        print '--inserite griglie nuove';

        -- sono gli ID delle griglie di cui fare il full export nei 2 ambienti. Griglie selezionate
        declare @fullExportGrids table (
                                       Sourceid int,
                                       Targetid int);
        insert into @fullExportGrids
        select distinct
               depg.MagicGridID
             , g.MagicGridID
        from dbo.Magic_Grids g
             inner join (select GUID
                              , depg.MagicGridID
                         from DEPLOY.DEP_Magic_Grids depg
                              inner join #selectedgrids sg on sg.MagicGridID = depg.MagicGridID
                         where exists (select *
                                       from DEPLOY.DEP_Magic_Columns
                                       where MagicGrid_ID = depg.MagicGridID) ) depg --include anche le search
                        on depg.GUID = g.GUID;

        declare @allGrids table (
                                Sourceid int,
                                Targetid int);

        insert into @allGrids
               (Sourceid
              , Targetid)
        select distinct
               depg.MagicGridID
             , g.MagicGridID
        from dbo.Magic_Grids g
             inner join DEPLOY.DEP_Magic_Grids depg on depg.GUID = g.GUID;

        update t
            set t.MagicTemplateName = s.MagicTemplateName
              , t.MagicTemplateScript = s.MagicTemplateScript
              , t.MagicTemplateLayout_ID = s.MagicTemplateLayout_ID
              , t.MagicTemplateType_ID = s.MagicTemplateType_ID
              , t.BaseCUDTable = s.BaseCUDTable
              , t.FromClass = s.FromClass
              , t.fromTable = s.fromTable
              , t.isSystemTemplate = s.isSystemTemplate
              , t.BaseGrid_ID = feg.Targetid
        from dbo.Magic_Templates t
             inner join DEPLOY.DEP_Magic_Templates s on s.GUID = t.GUID
        inner join @fullExportGrids feg on feg.Sourceid = s.BaseGrid_ID;

        print '--aggiornati templates';

        declare @nextMaxTemplateNonCustom_ID int;
        select @nextMaxTemplateNonCustom_ID = max(MagicTemplateID)
        from Magic_Templates
        where MagicTemplateID < @USERCOLS;

        set identity_insert dbo.Magic_Templates on;

        insert into dbo.Magic_Templates
               (MagicTemplateID
              , MagicTemplateName
              , MagicTemplateScript
              , MagicTemplateLayout_ID
              , MagicTemplateType_ID
              , FromClass
              , fromTable
              , isSystemTemplate
              , BaseCUDTable
              , BaseGrid_ID
              , GUID)
        select row_number() over(
               order by s.MagicTemplateID) + @nextMaxTemplateNonCustom_ID
             , s.MagicTemplateName
             , s.MagicTemplateScript
             , s.MagicTemplateLayout_ID
             , s.MagicTemplateType_ID
             , s.FromClass
             , s.fromTable
             , s.isSystemTemplate
             , s.BaseCUDTable
             , feg.Targetid
             , s.GUID
        from DEPLOY.DEP_Magic_Templates s
             inner join @fullExportGrids feg on feg.Sourceid = isnull(s.BaseGrid_ID, -1)
        left join dbo.Magic_Templates t on s.GUID = t.GUID
                                           and t.GUID is not null
        where isnull(t.MagicTemplateID, -1) = -1;

        set identity_insert dbo.Magic_Templates off;

        print '--inseriti templates';
        --cancello tutte le associazioni delle funzioni condivise tra source e target		
        delete dbo.Magic_TemplateScriptsBuffer
        where Magic_Grid_ID in (select tf.MagicGridID
                                from DEPLOY.DEP_Magic_Grids t
                                     inner join dbo.Magic_Grids tf on tf.GUID = t.GUID
                                inner join #selectedgrids sg on sg.MagicGridID = t.MagicGridID);

        delete dbo.Magic_TemplateScriptsBuffer
        where Magic_Template_ID in (select sf.MagicTemplateID
                                    from DEPLOY.DEP_Magic_Templates t
                                         inner join dbo.Magic_Templates sf on sf.GUID = t.GUID
                                    where t.BaseGrid_ID in (select MagicGridID
                                                            from #selectedgrids) );

        --Gestione Histoy ed actions
        delete [dbo].[Magic_GridsHistActSettings]
        where [dbo].[Magic_GridsHistActSettings].MagicGrid_ID in (select feg.Targetid
                                                                  from @fullExportGrids feg);

        declare @nextMaxGhasNonCustom_ID int;
        select @nextMaxGhasNonCustom_ID = max(ID)
        from Magic_GridsHistActSettings
        where ID < @USERCOLS;

        set identity_insert [dbo].[Magic_GridsHistActSettings] on;
        insert into [dbo].[Magic_GridsHistActSettings]
               (ID
              , [MagicGrid_ID]
              , [ShowHistory]
              , [DocRepositoryBOType]
              , [QueryForActions]
              , [MasterEntityName])
        select row_number() over(
               order by gas.ID) + @nextMaxGhasNonCustom_ID
             , feg.Targetid as [MagicGrid_ID]
             , gas.[ShowHistory]
             , gas.[DocRepositoryBOType]
             , gas.[QueryForActions]
             , gas.[MasterEntityName]
        from DEPLOY.DEP_Magic_GridsHistActSettings gas
             inner join @fullExportGrids feg on gas.[MagicGrid_ID] = feg.Sourceid;
        set identity_insert [dbo].[Magic_GridsHistActSettings] off;

        delete g
        from dbo.Magic_TemplateGroups g
        where not exists (select *
                          from dbo.Magic_TemplateDetails mtd
                          where mtd.MagicTemplateGroup_ID = g.MagicTemplateGroupID)
              and BindedGrid_ID is null
              and g.TemplateToAppendName is null;

        print 'cancellati template groups corrotti';

        -- cancello i comandi delle griglie full export
        delete dbo.Magic_GridsCommands
        where MagicGrid_ID in (select feg.Targetid
                               from @fullExportGrids feg);
        delete dbo.Magic_GridsCmdGroups
        where dbo.Magic_GridsCmdGroups.MagicGrid_ID in (select feg.Targetid
                                                        from @fullExportGrids feg);

        -- li ricreo col set identity: se posso inserisco col medesimo ID 
        declare @insertIDS table (
                                 id     int,
                                 gridid int);

        insert into @insertIDS
        select dmgcg.MagicCmdGroupID
             , feg.Targetid
        from DEPLOY.DEP_Magic_GridsCmdGroups dmgcg
             inner join @fullExportGrids feg on feg.Sourceid = dmgcg.MagicGrid_ID
        left join dbo.Magic_GridsCmdGroups mgcg on mgcg.MagicCmdGroupID = dmgcg.MagicCmdGroupID
        where mgcg.MagicCmdGroupID is null;

        declare @oldnewcmdgrps table (
                                     Sourceid int,
                                     Targetid int);

        set identity_insert dbo.Magic_GridsCmdGroups on;
        insert into dbo.Magic_GridsCmdGroups
               (MagicCmdGroupID -- this column value is auto-generated
              , dbo.Magic_GridsCmdGroups.Code
              , dbo.Magic_GridsCmdGroups.Text
              , dbo.Magic_GridsCmdGroups.IconSpan
              , dbo.Magic_GridsCmdGroups.OrdinalPosition
              , dbo.Magic_GridsCmdGroups.MagicGrid_ID)
        output Inserted.MagicCmdGroupID
             , Inserted.MagicCmdGroupID
               into @oldnewcmdgrps
        select dmgcg.MagicCmdGroupID
             , dmgcg.Code
             , dmgcg.Text
             , dmgcg.IconSpan
             , dmgcg.OrdinalPosition
             , ii.gridid as MagicGrid_ID
        from DEPLOY.DEP_Magic_GridsCmdGroups dmgcg
             inner join @insertIDS ii on ii.id = dmgcg.MagicCmdGroupID;

        set identity_insert dbo.Magic_GridsCmdGroups off;

        select dmgcg.MagicCmdGroupID
             , row_number() over(
               order by dmgcg.MagicCmdGroupID) as rn
        into #oldcmndgrps
        from DEPLOY.DEP_Magic_GridsCmdGroups dmgcg
             inner join @fullExportGrids feg on feg.Sourceid = dmgcg.MagicGrid_ID
        where dmgcg.MagicCmdGroupID not in (select id
                                            from @insertIDS)
        order by dmgcg.MagicCmdGroupID;

        declare @maxid int = (select max(MagicCmdGroupID)
                              from dbo.Magic_GridsCmdGroups
                              where MagicCmdGroupID < @USERCOLS);

        set identity_insert dbo.Magic_GridsCmdGroups on;

        --inserisco i Groups che non ho
        insert into dbo.Magic_GridsCmdGroups
               (MagicCmdGroupID -- this column value is auto-generated
              , dbo.Magic_GridsCmdGroups.Code
              , dbo.Magic_GridsCmdGroups.Text
              , dbo.Magic_GridsCmdGroups.IconSpan
              , dbo.Magic_GridsCmdGroups.OrdinalPosition
              , dbo.Magic_GridsCmdGroups.MagicGrid_ID)
        select --dmgcg.MagicCmdGroupID, 
        row_number() over(
        order by dmgcg.MagicCmdGroupID) + @maxid
      , dmgcg.Code
      , dmgcg.Text
      , dmgcg.IconSpan
      , dmgcg.OrdinalPosition
      , feg.Targetid as MagicGrid_ID
        from DEPLOY.DEP_Magic_GridsCmdGroups dmgcg
             inner join @fullExportGrids feg on feg.Sourceid = dmgcg.MagicGrid_ID
        where dmgcg.MagicCmdGroupID not in (select id
                                            from @insertIDS)
        order by dmgcg.MagicCmdGroupID;
        set identity_insert dbo.Magic_GridsCmdGroups off;

        select dbo.Magic_GridsCmdGroups.MagicCmdGroupID
             , row_number() over(
               order by dbo.Magic_GridsCmdGroups.MagicCmdGroupID) as rn
        into #newcmndgrps
        from dbo.Magic_GridsCmdGroups
        where dbo.Magic_GridsCmdGroups.MagicCmdGroupID > @maxid
              and dbo.Magic_GridsCmdGroups.MagicCmdGroupID < @USERCOLS;
        --and dbo.Magic_GridsCmdGroups.MagicCmdGroupID < @USERCOLS  --OM 10/20/2020:  added filter to add the Magic_GridsCmdGroups not as custom 
        --and not get the ones > @UserCols
        -- commands
        insert into @oldnewcmdgrps
               (Sourceid
              , Targetid)
        select n.MagicCmdGroupID
             , n2.MagicCmdGroupID
        from #newcmndgrps n
             inner join #oldcmndgrps n2 on n.rn = n2.rn;

        --delete @insertIDS;
        --insert into @insertIDS  -- tutti gli id "liberi"
        --select dmgc.MagicCommandID
        --     , feg.Targetid
        --from DEPLOY.DEP_Magic_GridsCommands dmgc
        --     inner join @fullExportGrids feg on feg.Sourceid = dmgc.MagicGrid_ID
        --left join dbo.Magic_GridsCommands mgc on mgc.MagicCommandID = dmgc.MagicCommandID
        --where mgc.MagicCommandID is null;		
        set identity_insert dbo.Magic_GridsCommands on;
        --insert into dbo.Magic_GridsCommands
        --       (MagicCommandID -- this column value is auto-generated
        --      , dbo.Magic_GridsCommands.MagicFunction_ID
        --      , dbo.Magic_GridsCommands.MagicGrid_ID
        --      , dbo.Magic_GridsCommands.DomID
        --      , dbo.Magic_GridsCommands.Class
        --      , dbo.Magic_GridsCommands.Location_ID
        --      , dbo.Magic_GridsCommands.Text
        --      , dbo.Magic_GridsCommands.ClickJSFunction
        --      , dbo.Magic_GridsCommands.OrdinalPosition
        --      , dbo.Magic_GridsCommands.JSONPayload
        --      , dbo.Magic_GridsCommands.StoredProcedure
        --      , dbo.Magic_GridsCommands.DataFormatType_ID
        --      , dbo.Magic_GridsCommands.CmdGroup_ID)
        --select distinct
        --       dmgc.MagicCommandID
        --     , dmgc.MagicFunction_ID
        --     , feg.Targetid
        --     , dmgc.DomID
        --     , dmgc.Class
        --     , dmgc.Location_ID
        --     , dmgc.Text
        --     , dmgc.ClickJSFunction
        --     , dmgc.OrdinalPosition
        --     , dmgc.JSONPayload
        --     , dmgc.StoredProcedure
        --     , dmgc.DataFormatType_ID
        --     , o.Targetid as CmdGroup_ID
        --from DEPLOY.DEP_Magic_GridsCommands dmgc
        --     inner join @fullExportGrids feg on feg.Sourceid = dmgc.MagicGrid_ID
        --left join @oldnewcmdgrps o on o.Sourceid = dmgc.CmdGroup_ID
        --where dmgc.MagicCommandID in (select id
        --                              from @insertIDS);
        declare @MaxMGCNonCustom_ID int = (select max(MagicCommandID)
                                           from dbo.Magic_GridsCommands
                                           where MagicCommandID < @USERCOLS);

        insert into dbo.Magic_GridsCommands
               (MagicCommandID -- this column value is auto-generated
              , dbo.Magic_GridsCommands.MagicFunction_ID
              , dbo.Magic_GridsCommands.MagicGrid_ID
              , dbo.Magic_GridsCommands.DomID
              , dbo.Magic_GridsCommands.Class
              , dbo.Magic_GridsCommands.Location_ID
              , dbo.Magic_GridsCommands.Text
              , dbo.Magic_GridsCommands.ClickJSFunction
              , dbo.Magic_GridsCommands.OrdinalPosition
              , dbo.Magic_GridsCommands.JSONPayload
              , dbo.Magic_GridsCommands.StoredProcedure
              , dbo.Magic_GridsCommands.DataFormatType_ID
              , dbo.Magic_GridsCommands.CmdGroup_ID)
        select --dmgc.MagicCommandID, 
        row_number() over(
        order by dmgc.MagicCommandID) + @MaxMGCNonCustom_ID
      , dmgc.MagicFunction_ID
      , feg.Targetid
      , dmgc.DomID
      , dmgc.Class
      , dmgc.Location_ID
      , dmgc.Text
      , dmgc.ClickJSFunction
      , dmgc.OrdinalPosition
      , dmgc.JSONPayload
      , dmgc.StoredProcedure
      , dmgc.DataFormatType_ID
      , o.Targetid as CmdGroup_ID
        from DEPLOY.DEP_Magic_GridsCommands dmgc
             inner join @fullExportGrids feg on feg.Sourceid = dmgc.MagicGrid_ID
        left join @oldnewcmdgrps o on o.Sourceid = dmgc.CmdGroup_ID;

        --where dmgc.MagicCommandID not in (select id
        --                                  from @insertIDS);
        set identity_insert dbo.Magic_GridsCommands off;

        --DECLARE @columnsToUpdate Table (sourcecolumnid int,targetcolumnid int) 
        declare @columnsToInsert table (
                                       sourcecolumnid int);

        -- colonne da inserire dal source 	
        insert into @columnsToInsert
        select distinct
               dc.MagicColumnID
        from DEPLOY.DEP_Magic_Columns dc
             left join dbo.Magic_Columns mc on mc.GUID = dc.GUID
        where mc.MagicColumnID is null
              and dc.MagicGrid_ID in (select MagicGridID
                                      from #selectedgrids);

        --aggiornamenti ed inserimenti 
        --aggiungo data roles creati nel source ma non nel target
        insert into dbo.Magic_TemplateDataRoles
               ([MagicTemplateDataRole])
        select deprole.[MagicTemplateDataRole]
        from DEPLOY.DEP_Magic_TemplateDataRoles deprole
             left join dbo.Magic_TemplateDataRoles rol on rol.MagicTemplateDataRole = deprole.MagicTemplateDataRole
        where rol.[MagicTemplateDataRoleID] is null;

        --queste sono le colonne che posso inserire imponendo l'id 
        declare @columnpreserveid table (
                                        sourcecolumnid int);

        insert into @columnpreserveid
        select cti.sourcecolumnid
        from @columnsToInsert cti
             left join dbo.Magic_Columns mc on cti.sourcecolumnid = mc.MagicColumnID
        where mc.MagicColumnID is null;

        print 'inserimento colonne con set identity_insert on';
        set identity_insert dbo.Magic_Columns on;

        insert into dbo.Magic_Columns
               (MagicColumnID -- this column value is auto-generated
              , dbo.Magic_Columns.MagicGrid_ID
              , dbo.Magic_Columns.ColumnName
              , dbo.Magic_Columns.DataType
              , dbo.Magic_Columns.StringLength
              , dbo.Magic_Columns.NumericPrecision
              , dbo.Magic_Columns.NumericPrecisionRadix
              , dbo.Magic_Columns.DatetimePrecision
              , dbo.Magic_Columns.Isprimary
              , dbo.Magic_Columns.FK_Column
              , dbo.Magic_Columns.PK_Table
              , dbo.Magic_Columns.PK_Column
              , dbo.Magic_Columns.Schema_editable
              , dbo.Magic_Columns.Schema_type
              , dbo.Magic_Columns.Schema_nullable
              , dbo.Magic_Columns.Schema_validation
              , dbo.Magic_Columns.Schema_defaultvalue
              , dbo.Magic_Columns.Schema_fulldefinition
              , dbo.Magic_Columns.Columns_visibleingrid
              , dbo.Magic_Columns.Columns_OrdinalPosition
              , dbo.Magic_Columns.Columns_template
              , dbo.Magic_Columns.Columns_label
              , dbo.Magic_Columns.Columns_width
              , dbo.Magic_Columns.Schema_Numeric_min
              , dbo.Magic_Columns.Schema_Numeric_max
              , dbo.Magic_Columns.Schema_Numeric_step
              , dbo.Magic_Columns.Schema_Format
              , dbo.Magic_Columns.Schema_required
              , dbo.Magic_Columns.Schema_attributes
              , dbo.Magic_Columns.Layer_ID
              , dbo.Magic_Columns.LayerSourceEntityName
              , dbo.Magic_Columns.Columns_isFilterable
              , dbo.Magic_Columns.Columns_isSortable
              , dbo.Magic_Columns.ContainerColumn_ID
              , dbo.Magic_Columns.Columns_EditorFunction
              , dbo.Magic_Columns.UploadAllowedFileExtensions
              , dbo.Magic_Columns.Upload_SavePath
              , dbo.Magic_Columns.Upload_Multi
              , GUID)
        select dmc.MagicColumnID
             , feg.Targetid as MagicGrid_ID
             , dmc.ColumnName
             , dmc.DataType
             , dmc.StringLength
             , dmc.NumericPrecision
             , dmc.NumericPrecisionRadix
             , dmc.DatetimePrecision
             , dmc.Isprimary
             , dmc.FK_Column
             , dmc.PK_Table
             , dmc.PK_Column
             , dmc.Schema_editable
             , dmc.Schema_type
             , dmc.Schema_nullable
             , dmc.Schema_validation
             , dmc.Schema_defaultvalue
             , dmc.Schema_fulldefinition
             , dmc.Columns_visibleingrid
             , dmc.Columns_OrdinalPosition
             , dmc.Columns_template
             , dmc.Columns_label
             , dmc.Columns_width
             , dmc.Schema_Numeric_min
             , dmc.Schema_Numeric_max
             , dmc.Schema_Numeric_step
             , dmc.Schema_Format
             , dmc.Schema_required
             , dmc.Schema_attributes
             , null
             , dmc.LayerSourceEntityName
             , dmc.Columns_isFilterable
             , dmc.Columns_isSortable
             , null
             , dmc.Columns_EditorFunction
             , dmc.UploadAllowedFileExtensions
             , dmc.Upload_SavePath
             , dmc.Upload_Multi
             , dmc.[GUID]
        from DEPLOY.DEP_Magic_Columns dmc
             inner join @columnpreserveid p on p.sourcecolumnid = dmc.MagicColumnID
        inner join @fullExportGrids feg on feg.Sourceid = dmc.MagicGrid_ID;

        --inserisco rispetto alla max ID colonna < @USERCOLS
        declare @currmaxcol int = (select max(MagicColumnID)
                                   from dbo.Magic_Columns
                                   where MagicColumnID < @USERCOLS);

        print 'inserimento colonne con nuovi ids';

        insert into dbo.Magic_Columns
               (dbo.Magic_Columns.MagicColumnID
              , dbo.Magic_Columns.MagicGrid_ID
              , dbo.Magic_Columns.ColumnName
              , dbo.Magic_Columns.DataType
              , dbo.Magic_Columns.StringLength
              , dbo.Magic_Columns.NumericPrecision
              , dbo.Magic_Columns.NumericPrecisionRadix
              , dbo.Magic_Columns.DatetimePrecision
              , dbo.Magic_Columns.Isprimary
              , dbo.Magic_Columns.FK_Column
              , dbo.Magic_Columns.PK_Table
              , dbo.Magic_Columns.PK_Column
              , dbo.Magic_Columns.Schema_editable
              , dbo.Magic_Columns.Schema_type
              , dbo.Magic_Columns.Schema_nullable
              , dbo.Magic_Columns.Schema_validation
              , dbo.Magic_Columns.Schema_defaultvalue
              , dbo.Magic_Columns.Schema_fulldefinition
              , dbo.Magic_Columns.Columns_visibleingrid
              , dbo.Magic_Columns.Columns_OrdinalPosition
              , dbo.Magic_Columns.Columns_template
              , dbo.Magic_Columns.Columns_label
              , dbo.Magic_Columns.Columns_width
              , dbo.Magic_Columns.Schema_Numeric_min
              , dbo.Magic_Columns.Schema_Numeric_max
              , dbo.Magic_Columns.Schema_Numeric_step
              , dbo.Magic_Columns.Schema_Format
              , dbo.Magic_Columns.Schema_required
              , dbo.Magic_Columns.Schema_attributes
              , dbo.Magic_Columns.Layer_ID
              , dbo.Magic_Columns.LayerSourceEntityName
              , dbo.Magic_Columns.Columns_isFilterable
              , dbo.Magic_Columns.Columns_isSortable
              , dbo.Magic_Columns.ContainerColumn_ID
              , dbo.Magic_Columns.Columns_EditorFunction
              , dbo.Magic_Columns.UploadAllowedFileExtensions
              , dbo.Magic_Columns.Upload_SavePath
              , dbo.Magic_Columns.Upload_Multi
              , GUID)
        select row_number() over(
               order by dmc.MagicColumnID) + @currmaxcol
             , feg.Targetid as MagicGrid_ID
             , dmc.ColumnName
             , dmc.DataType
             , dmc.StringLength
             , dmc.NumericPrecision
             , dmc.NumericPrecisionRadix
             , dmc.DatetimePrecision
             , dmc.Isprimary
             , dmc.FK_Column
             , dmc.PK_Table
             , dmc.PK_Column
             , dmc.Schema_editable
             , dmc.Schema_type
             , dmc.Schema_nullable
             , dmc.Schema_validation
             , dmc.Schema_defaultvalue
             , dmc.Schema_fulldefinition
             , dmc.Columns_visibleingrid
             , dmc.Columns_OrdinalPosition
             , dmc.Columns_template
             , dmc.Columns_label
             , dmc.Columns_width
             , dmc.Schema_Numeric_min
             , dmc.Schema_Numeric_max
             , dmc.Schema_Numeric_step
             , dmc.Schema_Format
             , dmc.Schema_required
             , dmc.Schema_attributes
             , null
             , dmc.LayerSourceEntityName
             , dmc.Columns_isFilterable
             , dmc.Columns_isSortable
             , null
             , dmc.Columns_EditorFunction
             , dmc.UploadAllowedFileExtensions
             , dmc.Upload_SavePath
             , dmc.Upload_Multi
             , dmc.[GUID]
        from DEPLOY.DEP_Magic_Columns dmc
             inner join @columnsToInsert cti on cti.sourcecolumnid = dmc.[MagicColumnID]
        left join @columnpreserveid p on p.sourcecolumnid = dmc.MagicColumnID
        inner join @fullExportGrids feg on feg.Sourceid = dmc.MagicGrid_ID
        where p.sourcecolumnid is null
        order by dmc.MagicColumnID;

        set identity_insert dbo.Magic_Columns off;

        declare @columnmatchid table (
                                     sourcecolumnid int,
                                     targetcolumnid int);

        insert into @columnmatchid
        select dmc.MagicColumnID
             , mc.MagicColumnID
        from dbo.Magic_Columns mc
             inner join DEPLOY.DEP_Magic_Columns dmc on mc.[GUID] = dmc.[GUID]
        where dmc.MagicGrid_ID in (select MagicGridID
                                   from #selectedgrids);

        --update columns
        update col
            set Schema_editable = dmc.Schema_editable
              , Schema_Format = dmc.Schema_Format
              , Schema_required = dmc.Schema_required
              , Schema_attributes = dmc.Schema_attributes
              , Schema_nullable = dmc.Schema_nullable
              , Schema_fulldefinition = dmc.Schema_fulldefinition
              , Schema_type = dmc.Schema_type
              , Schema_validation = dmc.Schema_validation
              , UploadAllowedFileExtensions = dmc.UploadAllowedFileExtensions
              , Upload_SavePath = dmc.Upload_SavePath
              , Upload_Multi = dmc.Upload_Multi
              , DataType = dmc.DataType
              , StringLength = dmc.StringLength
              , Columns_OrdinalPosition = dmc.Columns_OrdinalPosition
              , Columns_isSortable = dmc.Columns_isSortable
              , Columns_isFilterable = dmc.Columns_isFilterable
              , Columns_EditorFunction = dmc.Columns_EditorFunction
              , Columns_width = dmc.Columns_width
              , Columns_template = dmc.Columns_template
              , Columns_label = dmc.Columns_label
              , Isprimary = dmc.Isprimary
              , MagicFormExtension = dmc.MagicFormExtension
        from @columnmatchid
             inner join DEPLOY.DEP_Magic_Columns dmc on sourcecolumnid = dmc.MagicColumnID
        inner join Magic_Columns col on targetcolumnid = col.MagicColumnID;

        --vado a impostare le relazioni padre figlio tra le colonne
        select mc2.MagicColumnID as id
             , mc.MagicColumnID as contid
        into #containercols
        from DEPLOY.DEP_Magic_Columns dmc2
             inner join DEPLOY.DEP_Magic_Columns C on C.MagicColumnID = dmc2.ContainerColumn_ID
        inner join dbo.Magic_Columns mc on mc.[GUID] = C.[GUID]
        inner join dbo.Magic_Columns mc2 on mc2.[GUID] = dmc2.[GUID]
        where dmc2.ContainerColumn_ID is not null
              and dmc2.MagicGrid_ID in (select MagicGridID
                                        from #selectedgrids);

        update mc
            set mc.ContainerColumn_ID = c.contid
        from dbo.Magic_Columns mc
             inner join #containercols c on mc.MagicColumnID = c.id;

        print 'DELETE col labels';
        delete dbo.Magic_ColumnLabels
        where dbo.Magic_ColumnLabels.Magic_Column_ID in (select ci.targetcolumnid
                                                         from @columnmatchid ci);
        declare @MaxCLNonCustom_ID int;
        select @MaxCLNonCustom_ID = max(ColumnLabelID)
        from Magic_ColumnLabels
        where ColumnLabelID < @USERCOLS;
        set identity_insert dbo.Magic_ColumnLabels on;

        insert into dbo.Magic_ColumnLabels
               (ColumnLabelID -- this column value is auto-generated
              , dbo.Magic_ColumnLabels.Magic_Column_ID
              , dbo.Magic_ColumnLabels.MagicGrid_ID
              , dbo.Magic_ColumnLabels.MagicCulture_ID
              , dbo.Magic_ColumnLabels.ColumnLabel)
        select row_number() over(
               order by mcl.ColumnLabelID) + @MaxCLNonCustom_ID
             , ci.targetcolumnid
             , feg.Targetid
             , mcl.MagicCulture_ID
             , mcl.ColumnLabel
        from DEPLOY.DEP_Magic_ColumnLabels mcl
             inner join @columnmatchid ci on ci.sourcecolumnid = mcl.Magic_Column_ID
        inner join @fullExportGrids feg on feg.Sourceid = mcl.MagicGrid_ID;
        set identity_insert dbo.Magic_ColumnLabels off;

        --Gestione template Groups (tabs di navigazione e tab di popup)
        declare @temptabgrouptodelete table (
                                            Targetid int);
        declare @temptabgrouptoupdate table (
                                            Sourceid     int,
                                            Targetid     int,
                                            sourcetempid int,
                                            targettempid int);
        declare @temptabgrouptoinsert table (
                                            Sourceid int);

        declare @tempgrouptodelete table (
                                         Targetid int);
        declare @tempgrouptoupdate table (
                                         Sourceid     int,
                                         Targetid     int,
                                         sourcetempid int,
                                         targettempid int);
        declare @tempgrouptoinsert table (
                                         Sourceid int);

        --gruppi di Tabs da cancellare: sono quelli relativi alle griglie inviate in export
        insert into @temptabgrouptodelete
               (Targetid)
        select mttg.MagicTemplateTabGroupID
        from dbo.Magic_TemplateTabGroups mttg
             left outer join DEPLOY.DEP_Magic_TemplateTabGroups dmttg on mttg.[GUID] = dmttg.[GUID]
        where dmttg.[MagicTemplateTabGroupID] is null
              and mttg.[MagicTemplateTabGroupID] in (select mttg.MagicTemplateTabGroupID
                                                     from dbo.Magic_Grids g
                                                          inner join dbo.Magic_Templates mt on mt.MagicTemplateName = g.EditableTemplate
                                                                                               or mt.MagicTemplateName = g.DetailTemplate
                                                     inner join [dbo].[Magic_TemplateTabGroups] mttg on mttg.MagicTemplate_ID = mt.MagicTemplateID
                                                     inner join @fullExportGrids feg on feg.Targetid = g.MagicGridID);

        --gruppi da cancellare: sono quelli relativi alle griglie inviate in export
        insert into @tempgrouptodelete
               (Targetid)
        select mtg.MagicTemplateGroupID
        from dbo.Magic_TemplateGroups mtg
             left outer join DEPLOY.DEP_Magic_TemplateGroups dmtg on mtg.[GUID] = dmtg.[GUID]
        where dmtg.MagicTemplateGroupID is null
              and mtg.MagicTemplateGroupID in (select mtg.MagicTemplateGroupID
                                               from dbo.Magic_Grids g
                                                    inner join dbo.Magic_Templates mt on mt.MagicTemplateName = g.EditableTemplate
                                                                                         or mt.MagicTemplateName = g.DetailTemplate
                                               inner join dbo.Magic_TemplateGroups mtg on mtg.MagicTemplate_ID = mt.MagicTemplateID
                                               inner join @fullExportGrids feg on feg.Targetid = g.MagicGridID);

        insert into @temptabgrouptoupdate
               (Sourceid
              , Targetid
              , sourcetempid
              , targettempid)
        select dmttg.[MagicTemplateTabGroupID]
             , mttg.[MagicTemplateTabGroupID]
             , dmttg.MagicTemplate_ID
             , mttg.MagicTemplate_ID
        from dbo.Magic_TemplateTabGroups mttg
             inner join DEPLOY.DEP_Magic_TemplateTabGroups dmttg on mttg.GUID = dmttg.GUID
                                                                    and dmttg.[MagicTemplate_ID] in(select MagicTemplateID
                                                                                                    from #selectedtemplates);

        insert into @tempgrouptoupdate
               (Sourceid
              , Targetid
              , sourcetempid
              , targettempid)
        select dmtg.MagicTemplateGroupID
             , mtg.MagicTemplateGroupID
             , dmtg.MagicTemplate_ID
             , mtg.MagicTemplate_ID
        from dbo.Magic_TemplateGroups mtg
             inner join DEPLOY.DEP_Magic_TemplateGroups dmtg on mtg.GUID = dmtg.GUID
                                                                and mtg.[MagicTemplate_ID] in(select MagicTemplateID
                                                                                              from #selectedtemplates);

        insert into @temptabgrouptoinsert
               (Sourceid)
        select g.MagicTemplateTabGroupID
        from DEPLOY.DEP_Magic_TemplateTabGroups g
             left join dbo.Magic_TemplateTabGroups gg on gg.GUID = g.GUID
        where gg.[MagicTemplateTabGroupID] is null
              and g.[MagicTemplate_ID] in (select MagicTemplateID
                                           from #selectedtemplates);

        insert into @tempgrouptoinsert
               (Sourceid)
        select g.MagicTemplateGroupID
        from DEPLOY.DEP_Magic_TemplateGroups g
             left join dbo.Magic_TemplateGroups gg on gg.GUID = g.GUID
        where gg.[MagicTemplateGroupID] is null
              and g.[MagicTemplate_ID] in (select MagicTemplateID
                                           from #selectedtemplates);

        --cascade sul labels e overrides
        delete from dbo.Magic_TemplateGroups
        where dbo.Magic_TemplateGroups.MagicTemplateGroupID in (select t.Targetid
                                                                from @tempgrouptodelete t)
              and dbo.Magic_TemplateGroups.MagicTemplateGroupID not in (select mtd.MagicTemplateGroup_ID
                                                                        from dbo.Magic_TemplateDetails mtd
                                                                        where mtd.DetailInheritsFromColumn_ID >= @USERCOLS); --non cancello i TABS su cui stanno i CAMpi USE
        update mttg
            set mttg.MagicTemplateTabGroupLabel = mttg.MagicTemplateTabGroupLabel
              , mttg.Color = mttg.Color
              , mttg.OrdinalPosition = mttg.OrdinalPosition
        from dbo.Magic_TemplateTabGroups mttg
             inner join @temptabgrouptoupdate t on t.Targetid = mttg.MagicTemplateTabGroupID
        inner join DEPLOY.DEP_Magic_TemplateTabGroups dmttg on dmttg.MagicTemplateTabGroupID = t.Sourceid;

        insert into dbo.Magic_TemplateTabGroups
               (
        --MagicTemplateTabGroupID - this column value is auto-generated
        dbo.Magic_TemplateTabGroups.MagicTemplate_ID
      , dbo.Magic_TemplateTabGroups.MagicTemplateTabGroupLabel
      , dbo.Magic_TemplateTabGroups.Color
      , dbo.Magic_TemplateTabGroups.OrdinalPosition
      , dbo.Magic_TemplateTabGroups.GUID)
        select mt2.MagicTemplateID
             , dmttg.MagicTemplateTabGroupLabel
             , dmttg.Color
             , dmttg.OrdinalPosition
             , dmttg.GUID
        from DEPLOY.DEP_Magic_TemplateTabGroups dmttg
             inner join @temptabgrouptoinsert t on t.Sourceid = dmttg.[MagicTemplateTabGroupID]
        inner join DEPLOY.DEP_Magic_Templates mt on mt.MagicTemplateID = dmttg.MagicTemplate_ID
        inner join dbo.Magic_Templates mt2 on mt2.GUID = mt.GUID;

        declare @templatetabgroupsmatchid table (
                                                Sourceid         int,
                                                Targetid         int,
                                                sourcetemplateid int,
                                                targettemplateid int);

        insert into @templatetabgroupsmatchid
        select g.MagicTemplateTabGroupID
             , mtg.MagicTemplateTabGroupID
             , g.MagicTemplate_ID
             , mtg.MagicTemplate_ID
        from dbo.Magic_TemplateTabGroups mtg
             inner join DEPLOY.DEP_Magic_TemplateTabGroups g on g.GUID = mtg.GUID
        where g.[MagicTemplate_ID] in (select MagicTemplateID
                                       from #selectedtemplates);

        update mtg
            set -- mtg.MagicTemplate_ID = t.targettempid,
        mtg.MagicTemplateTabGroup_ID = ttg.Targetid
      , mtg.MagicTemplateGroupLabel = mtg2.MagicTemplateGroupLabel
      , mtg.OrdinalPosition = mtg2.OrdinalPosition
      , mtg.MagicTemplateGroupContent_ID = mtg2.MagicTemplateGroupContent_ID
      , mtg.MagicTemplateGroupClass = mtg2.MagicTemplateGroupClass
      , mtg.MagicTemplateGroupDOMID = mtg2.MagicTemplateGroupDOMID
      , mtg.Groupisvisible = mtg2.Groupisvisible
      , mtg.BindedGrid_ID = iif((feg.Targetid is not null), feg.Targetid, mtg.BindedGrid_ID)
      , mtg.BindedGridFilter = mtg2.BindedGridFilter
      , mtg.BindedGridRelType_ID = mtg2.BindedGridRelType_ID
      , mtg.BindedGridHideFilterCol = mtg2.BindedGridHideFilterCol
      , mtg.IsVisibleInPopUp = mtg2.IsVisibleInPopUp
        from dbo.Magic_TemplateGroups mtg
             inner join @tempgrouptoupdate t on t.Targetid = mtg.MagicTemplateGroupID
        inner join DEPLOY.DEP_Magic_TemplateGroups mtg2 on mtg2.MagicTemplateGroupID = t.Sourceid
        left join @allGrids feg on feg.Sourceid = mtg2.BindedGrid_ID
        left join @templatetabgroupsmatchid ttg on ttg.Sourceid = mtg2.[MagicTemplateTabGroup_ID];

        declare @nextMaxTGNonCustom_ID int;
        select @nextMaxTGNonCustom_ID = max(MagicTemplateGroupID)
        from Magic_TemplateGroups
        where MagicTemplateGroupID < @USERCOLS;
        set identity_insert dbo.Magic_TemplateGroups on;

        insert into dbo.Magic_TemplateGroups
               (MagicTemplateGroupID -- this column value is auto-generated
              , dbo.Magic_TemplateGroups.MagicTemplate_ID
              , dbo.Magic_TemplateGroups.MagicTemplateGroupLabel
              , dbo.Magic_TemplateGroups.OrdinalPosition
              , dbo.Magic_TemplateGroups.MagicTemplateGroupContent_ID
              , dbo.Magic_TemplateGroups.MagicTemplateGroupClass
              , dbo.Magic_TemplateGroups.MagicTemplateGroupDOMID
              , dbo.Magic_TemplateGroups.Groupisvisible
              , dbo.Magic_TemplateGroups.BindedGrid_ID
              , dbo.Magic_TemplateGroups.BindedGridFilter
              , dbo.Magic_TemplateGroups.BindedGridRelType_ID
              , dbo.Magic_TemplateGroups.BindedGridHideFilterCol
              , dbo.Magic_TemplateGroups.IsVisibleInPopUp
              , GUID)
        select row_number() over(
               order by mtg.MagicTemplateGroupID) + @nextMaxTGNonCustom_ID
             , mt2.MagicTemplateID
             , mtg.MagicTemplateGroupLabel
             , mtg.OrdinalPosition
             , mtg.MagicTemplateGroupContent_ID
             , mtg.MagicTemplateGroupClass
             , mtg.MagicTemplateGroupDOMID
             , mtg.Groupisvisible
             , feg.Targetid
             , mtg.BindedGridFilter
             , mtg.BindedGridRelType_ID
             , mtg.BindedGridHideFilterCol
             , mtg.IsVisibleInPopUp
             , mtg.GUID
        from DEPLOY.DEP_Magic_TemplateGroups mtg
             inner join @tempgrouptoinsert t on t.Sourceid = mtg.MagicTemplateGroupID
        inner join DEPLOY.DEP_Magic_Templates mt on mt.MagicTemplateID = mtg.MagicTemplate_ID
        inner join dbo.Magic_Templates mt2 on mt2.GUID = mt.GUID
        left join @allGrids feg on feg.Sourceid = mtg.BindedGrid_ID;
        set identity_insert dbo.Magic_TemplateGroups off;

        delete from dbo.Magic_TemplateTabGroups
        where dbo.Magic_TemplateTabGroups.MagicTemplateTabGroupID in (select t.Targetid
                                                                      from @temptabgrouptodelete t);

        declare @templategroupsmatchid table (
                                             Sourceid         int,
                                             Targetid         int,
                                             sourcetemplateid int,
                                             targettemplateid int);

        insert into @templategroupsmatchid
        select g.MagicTemplateGroupID
             , mtg.MagicTemplateGroupID
             , g.MagicTemplate_ID
             , mtg.MagicTemplate_ID
        from dbo.Magic_TemplateGroups mtg
             inner join DEPLOY.DEP_Magic_TemplateGroups g on g.GUID = mtg.GUID
        where g.[MagicTemplate_ID] in (select MagicTemplateID
                                       from #selectedtemplates);

        --Template  Group Labels
        delete mtgl
        from dbo.Magic_TemplateGroupLabels mtgl
             inner join @templategroupsmatchid t on t.Targetid = mtgl.MagicTemplateGroup_ID
        left join DEPLOY.DEP_Magic_TemplateGroupLabels mtgl2 on mtgl2.MagicTemplateGroup_ID = t.Sourceid
                                                                and mtgl2.MagicCulture_ID = mtgl.MagicCulture_ID
        where mtgl2.MagicTemplateGroup_ID is null;

        update mtgl
            set mtgl.MagicTemplateGroupLabel = mtgl2.MagicTemplateGroupLabel
        from dbo.Magic_TemplateGroupLabels mtgl
             inner join @tempgrouptoupdate t on t.Targetid = mtgl.MagicTemplateGroup_ID
        inner join DEPLOY.DEP_Magic_TemplateGroupLabels mtgl2 on mtgl2.MagicTemplateGroup_ID = t.Sourceid
                                                                 and mtgl2.MagicCulture_ID = mtgl.MagicCulture_ID;

        --Template Tab Group Labels
        delete mtgl
        from dbo.Magic_TemplateTabGroupLabels mtgl
             inner join @templatetabgroupsmatchid t on t.Targetid = mtgl.MagicTemplateTabGroup_ID
        left join DEPLOY.DEP_Magic_TemplateTabGroupLabels mtgl2 on mtgl2.MagicTemplateTabGroup_ID = t.Sourceid
                                                                   and mtgl2.MagicCulture_ID = mtgl.MagicCulture_ID
        where mtgl2.MagicTemplateTabGroup_ID is null;

        update mtgl
            set mtgl.MagicTemplateTabGroupLabel = mtgl2.MagicTemplateTabGroupLabel
        from dbo.Magic_TemplateTabGroupLabels mtgl
             inner join @templatetabgroupsmatchid t on t.Targetid = mtgl.MagicTemplateTabGroup_ID
        inner join DEPLOY.DEP_Magic_TemplateTabGroupLabels mtgl2 on mtgl2.MagicTemplateTabGroup_ID = t.Sourceid
                                                                    and mtgl2.MagicCulture_ID = mtgl.MagicCulture_ID;

        insert into dbo.Magic_TemplateGroupLabels
               (
        --TemplateGroupLabelID - this column value is auto-generated
        [MagicTemplateGroup_ID]
      , MagicTemplate_ID
      , MagicTemplateGroupLabel
      , MagicCulture_ID)
        select mid.Targetid
             , mid.targettemplateid
             , mtgl.MagicTemplateGroupLabel
             , mtgl.MagicCulture_ID
        from DEPLOY.DEP_Magic_TemplateGroupLabels mtgl
             inner join @templategroupsmatchid mid on mid.Sourceid = mtgl.[MagicTemplateGroup_ID]
        left join dbo.Magic_TemplateGroupLabels mtgl2 on mtgl2.[MagicTemplateGroup_ID] = mid.Targetid
                                                         and mtgl2.MagicCulture_ID = mtgl.MagicCulture_ID
        where mtgl2.[TemplateGroupLabelID] is null;

        insert into dbo.Magic_TemplateTabGroupLabels
               (
        --TemplateGroupLabelID - this column value is auto-generated
        [MagicTemplateTabGroup_ID]
      , MagicTemplate_ID
      , MagicTemplateTabGroupLabel
      , MagicCulture_ID)
        select mid.Targetid
             , mid.targettemplateid
             , mtgl.MagicTemplateTabGroupLabel
             , mtgl.MagicCulture_ID
        from DEPLOY.DEP_Magic_TemplateTabGroupLabels mtgl
             inner join @templatetabgroupsmatchid mid on mid.Sourceid = mtgl.[MagicTemplateTabGroup_ID]
        left join dbo.Magic_TemplateTabGroupLabels mtgl2 on mtgl2.[MagicTemplateTabGroup_ID] = mid.Targetid
                                                            and mtgl2.MagicCulture_ID = mtgl.MagicCulture_ID
        where mtgl2.[TemplateTabGroupLabelID] is null;

        update mtd2
            set
        --mtd2.MagicTemplate_ID = t.targettemplateid, 
        mtd2.MagicTemplateGroup_ID = t.Targetid
      , mtd2.OrdinalPosition = mtd.OrdinalPosition
      , mtd2.MagicDataRole_ID = mtdr2.MagicTemplateDataRoleID
      , mtd2.MagicNullOptionLabel = mtd.MagicNullOptionLabel
      , mtd2.MagicDataSourceValueField = mtd.MagicDataSourceValueField
      , mtd2.MagicDataSourceTextField = mtd.MagicDataSourceTextField
      , mtd2.MagicDataSource = mtd.MagicDataSource
      , mtd2.MagicDataSourceType_ID = mtd.MagicDataSourceType_ID
      , mtd2.MagicDataSourceSchema = mtd.MagicDataSourceSchema
      , mtd2.Detailisvisible = mtd.Detailisvisible
      , mtd2.DetailInheritsFromColumn_ID = ci.targetcolumnid
      , mtd2.DetailonchangeFunctionName = mtd.DetailonchangeFunctionName
      , mtd2.DetailDOMID = mtd.DetailDOMID
      , mtd2.DetailInheritsFromGroup_ID = t2.Targetid
      , mtd2.SearchGrid_ID = feg.Targetid
      , mtd2.SearchGridDescColumn_ID = ci2.targetcolumnid
      , mtd2.CascadeColumn_ID = ci3.targetcolumnid
      , mtd2.CascadeFilterCol_ID = ci4.targetcolumnid
        from DEPLOY.DEP_Magic_TemplateDetails mtd
             inner join @templategroupsmatchid t on t.Sourceid = mtd.MagicTemplateGroup_ID
        left join DEPLOY.DEP_Magic_TemplateDataRoles mtdr on mtdr.MagicTemplateDataRoleID = mtd.MagicDataRole_ID
        left join dbo.Magic_TemplateDataRoles mtdr2 on mtdr2.MagicTemplateDataRole = mtdr.MagicTemplateDataRole
        inner join @columnmatchid ci on ci.sourcecolumnid = mtd.DetailInheritsFromColumn_ID
        inner join dbo.Magic_TemplateDetails mtd2 on mtd2.DetailInheritsFromColumn_ID = ci.targetcolumnid
        left join @templategroupsmatchid t2 on t2.Sourceid = mtd.DetailInheritsFromGroup_ID
        left join @fullExportGrids feg on feg.Sourceid = mtd.SearchGrid_ID
        left join @columnmatchid ci2 on ci2.sourcecolumnid = mtd.SearchGridDescColumn_ID
        left join @columnmatchid ci3 on ci3.sourcecolumnid = mtd.CascadeColumn_ID
        left join @columnmatchid ci4 on ci4.sourcecolumnid = mtd.CascadeFilterCol_ID;

        declare @nextMaxMTDNonCustom_ID int;
        select @nextMaxMTDNonCustom_ID = max(MagicTemplateDetailID)
        from Magic_TemplateDetails
        where MagicTemplateDetailID < @USERCOLS;
        set identity_insert dbo.Magic_TemplateDetails on;

        insert into dbo.Magic_TemplateDetails
               (MagicTemplateDetailID -- this column value is auto-generated
              , dbo.Magic_TemplateDetails.MagicTemplate_ID
              , dbo.Magic_TemplateDetails.MagicTemplateGroup_ID
              , dbo.Magic_TemplateDetails.OrdinalPosition
              , dbo.Magic_TemplateDetails.MagicDataRole_ID
              , dbo.Magic_TemplateDetails.MagicNullOptionLabel
              , dbo.Magic_TemplateDetails.MagicDataSourceValueField
              , dbo.Magic_TemplateDetails.MagicDataSourceTextField
              , dbo.Magic_TemplateDetails.MagicDataSource
              , dbo.Magic_TemplateDetails.MagicDataSourceType_ID
              , dbo.Magic_TemplateDetails.MagicDataSourceSchema
              , dbo.Magic_TemplateDetails.Detailisvisible
              , dbo.Magic_TemplateDetails.DetailInheritsFromColumn_ID
              , dbo.Magic_TemplateDetails.DetailonchangeFunctionName
              , dbo.Magic_TemplateDetails.DetailDOMID
              , dbo.Magic_TemplateDetails.DetailInheritsFromGroup_ID
              , dbo.Magic_TemplateDetails.SearchGrid_ID
              , dbo.Magic_TemplateDetails.SearchGridDescColumn_ID
              , dbo.Magic_TemplateDetails.CascadeColumn_ID
              , dbo.Magic_TemplateDetails.CascadeFilterCol_ID)
        select row_number() over(
               order by mtd.MagicTemplateDetailID) + @nextMaxMTDNonCustom_ID
             , t.targettemplateid as MagicTemplate_ID
             , t.Targetid as MagicTemplateGroup_ID
             , mtd.OrdinalPosition
             , mtdr2.MagicTemplateDataRoleID
             , mtd.MagicNullOptionLabel
             , mtd.MagicDataSourceValueField
             , mtd.MagicDataSourceTextField
             , mtd.MagicDataSource
             , mtd.MagicDataSourceType_ID
             , mtd.MagicDataSourceSchema
             , mtd.Detailisvisible
             , ci.targetcolumnid as DetailInheritsFromColumn_ID
             , mtd.DetailonchangeFunctionName
             , mtd.DetailDOMID
             , t2.Targetid as DetailInheritsFromGroup_ID
             , feg.Targetid as SearchGrid_ID
             , ci2.targetcolumnid as SearchGridDescColumn_ID
             , ci3.targetcolumnid as CascadeColumn_ID
             , ci4.targetcolumnid as CascadeFilterCol_ID
        from DEPLOY.DEP_Magic_TemplateDetails mtd
             left join DEPLOY.DEP_Magic_TemplateDataRoles mtdr on mtdr.MagicTemplateDataRoleID = mtd.MagicDataRole_ID
        left join dbo.Magic_TemplateDataRoles mtdr2 on mtdr2.MagicTemplateDataRole = mtdr.MagicTemplateDataRole
        inner join @columnmatchid ci on ci.sourcecolumnid = mtd.DetailInheritsFromColumn_ID
        left join dbo.Magic_TemplateDetails mtd2 on mtd2.DetailInheritsFromColumn_ID = ci.targetcolumnid
        inner join @templategroupsmatchid t on t.Sourceid = mtd.MagicTemplateGroup_ID
        left join @templategroupsmatchid t2 on t2.Sourceid = mtd.DetailInheritsFromGroup_ID
        left join @fullExportGrids feg on feg.Sourceid = mtd.SearchGrid_ID
        left join @columnmatchid ci2 on ci2.sourcecolumnid = mtd.SearchGridDescColumn_ID
        left join @columnmatchid ci3 on ci3.sourcecolumnid = mtd.CascadeColumn_ID
        left join @columnmatchid ci4 on ci4.sourcecolumnid = mtd.CascadeFilterCol_ID
        where mtd2.MagicTemplateDetailID is null;
        set identity_insert dbo.Magic_TemplateDetails off;

        --aggiornamento delle SearchGrid gia' esistenti fuori dalla selezione
        update tdt
            set tdt.SearchGrid_ID = g.MagicGridID
              , tdt.[SearchGridDescColumn_ID] = mctsearchgridcolumn.MagicColumnID
        from DEPLOY.DEP_Magic_TemplateDetails td
             inner join DEPLOY.DEP_Magic_Columns mc on mc.MagicColumnID = td.DetailInheritsFromColumn_ID
        inner join DEPLOY.DEP_Magic_Columns mcsearchgridcolumn on mcsearchgridcolumn.MagicColumnID = td.[SearchGridDescColumn_ID]
        inner join dbo.Magic_Columns mctsearchgridcolumn on mcsearchgridcolumn.GUID = mctsearchgridcolumn.GUID
        inner join dbo.Magic_Columns mct on mct.GUID = mc.GUID
        inner join dbo.Magic_TemplateDetails tdt on tdt.DetailInheritsFromColumn_ID = mct.MagicColumnID
        inner join DEPLOY.DEP_Magic_Grids mg on mg.MagicGridID = td.SearchGrid_ID
        inner join dbo.Magic_Grids g on g.GUID = mg.GUID
        inner join DEPLOY.DEP_Magic_Templates t on t.MagicTemplateID = td.MagicTemplate_ID
        inner join DEPLOY.DEP_Magic_Grids mg2 on mg2.MagicGridID = t.BaseGrid_ID
        inner join @fullExportGrids feg on feg.Sourceid = mg2.MagicGridID
        where(td.SearchGrid_ID is not null
              and tdt.SearchGrid_ID is null)
             or (td.[SearchGridDescColumn_ID] is not null
                 and tdt.[SearchGridDescColumn_ID] is null);

        --aggiornamento delle SearchGrid gia' esistenti fuori dalla selezione
        update tdt
            set tdt.CascadeColumn_ID = mctcascade.MagicColumnID
              , tdt.CascadeFilterCol_ID = mctcascadecol.MagicColumnID
        from DEPLOY.DEP_Magic_TemplateDetails td
             inner join DEPLOY.DEP_Magic_Columns mc on mc.MagicColumnID = td.DetailInheritsFromColumn_ID
        inner join DEPLOY.DEP_Magic_Columns mccascade on mccascade.MagicColumnID = td.[CascadeColumn_ID]
        inner join dbo.Magic_Columns mctcascade on mccascade.GUID = mctcascade.GUID
        inner join DEPLOY.DEP_Magic_Columns mccascadecol on mccascadecol.MagicColumnID = td.[CascadeFilterCol_ID]
        inner join dbo.Magic_Columns mctcascadecol on mccascadecol.GUID = mctcascadecol.GUID
        inner join dbo.Magic_Columns mct on mct.GUID = mc.GUID
        inner join dbo.Magic_TemplateDetails tdt on tdt.DetailInheritsFromColumn_ID = mct.MagicColumnID
        inner join DEPLOY.DEP_Magic_Templates t on t.MagicTemplateID = td.MagicTemplate_ID
        inner join DEPLOY.DEP_Magic_Grids mg2 on mg2.MagicGridID = t.BaseGrid_ID
        inner join @fullExportGrids feg on feg.Sourceid = mg2.MagicGridID
        where(td.CascadeColumn_ID is not null
              and tdt.CascadeColumn_ID is null);

        --GESTIONE DEI TemplateGroup per i Campi utente che referenziano templateGRoups da cancellare
        declare @templateDetailsUSE table (
                                          templateid int,
                                          detailid   int,
                                          layerid    int);

        insert into @templateDetailsUSE
        select mtd.MagicTemplate_ID
             , mtd.MagicTemplateDetailID
             , mc.Layer_ID
        from dbo.Magic_TemplateDetails mtd
             inner join dbo.Magic_Columns mc on mc.MagicColumnID = mtd.DetailInheritsFromColumn_ID
        where mtd.DetailInheritsFromColumn_ID >= @USERCOLS
              and mtd.MagicTemplateGroup_ID in (select t.Targetid
                                                from @tempgrouptodelete t)
              and mc.Layer_ID is not null;

        select mtd.MagicTemplate_ID
             , mc.Layer_ID
             , max(mtd.MagicTemplateGroup_ID) as MagicTemplateGroup_ID
        into #temptempls
        from dbo.Magic_TemplateDetails mtd
             inner join dbo.Magic_Columns mc on mc.MagicColumnID = mtd.DetailInheritsFromColumn_ID
        where mtd.DetailInheritsFromColumn_ID < @USERCOLS
              and mc.Layer_ID is not null
        group by mtd.MagicTemplate_ID
               , mc.Layer_ID;

        update mtd
            set mtd.MagicTemplateGroup_ID = t.MagicTemplateGroup_ID
        from dbo.Magic_TemplateDetails mtd
             inner join dbo.Magic_Columns mc on mc.MagicColumnID = mtd.DetailInheritsFromColumn_ID
        inner join #temptempls t on t.MagicTemplate_ID = mtd.MagicTemplate_ID
                                    and t.Layer_ID = mc.Layer_ID
        inner join @templateDetailsUSE tdu on mtd.MagicTemplate_ID = tdu.templateid
                                              and tdu.detailid = mtd.MagicTemplateDetailID
                                              and tdu.layerid = t.Layer_ID;

        --rifaccio la delete per eliminare i tab non referenziati
        delete g
        from dbo.Magic_TemplateGroups g
        where not exists (select *
                          from dbo.Magic_TemplateDetails mtd
                          where mtd.MagicTemplateGroup_ID = g.MagicTemplateGroupID)
              and BindedGrid_ID is null
              and g.TemplateToAppendName is null;

        --SELECT @xmlInput
        select convert(varchar(30), @imported) + ' grids processed' as result;

        commit;
    end try
    begin catch
        rollback tran;
        declare @ErrorMessage nvarchar(4000);
        declare @ErrorSeverity int;
        declare @ErrorState int;

        select @ErrorMessage = error_message()
             , @ErrorSeverity = error_severity()
             , @ErrorState = error_state();
        -- Use RAISERROR inside the CATCH block to return 
        -- error information about the original error that 
        -- caused execution to jump to the CATCH block.
        raiserror(@ErrorMessage, -- Message text.
        @ErrorSeverity, -- Severity.
        @ErrorState -- State.
        );

        --rollback;
    end catch;

end;
