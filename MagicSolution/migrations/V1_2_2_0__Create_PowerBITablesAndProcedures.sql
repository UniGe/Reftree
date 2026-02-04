

if not exists (select 1
               from INFORMATION_SCHEMA.TABLES as t
               where t.TABLE_SCHEMA = N'dbo'
                     and t.TABLE_NAME = N'Magic_PowerBIReport'
                     and t.TABLE_TYPE = N'BASE TABLE')
begin

    create table [dbo].[Magic_PowerBIWorkspace] (
                 [ID]                  [int] identity(1, 1) not null,
                 [Code]                [nvarchar](50) null,
                 [Description]         [nvarchar](max) null,
                 [PowerBI_workspaceId] [nvarchar](max) null,
                 [Note]                [varchar](max) null,
                 [ModifiedUser_ID]     [int] null,
                 [ModifiedDate]        [datetime] null,
                 constraint [PK_Magic_PowerBIWorkspace] primary key clustered([ID] asc)
                 with(pad_index = off, statistics_norecompute = off, ignore_dup_key = off, allow_row_locks = on, allow_page_locks = on) on [PRIMARY])
    on [PRIMARY] textimage_on [PRIMARY];

    alter table [dbo].[Magic_PowerBIWorkspace]
    add constraint [DF_Magic_PowerBIWorkspace_ModifiedDate] default(getdate()) for [ModifiedDate];

end;

go

if not exists (select 1
               from INFORMATION_SCHEMA.TABLES as t
               where t.TABLE_SCHEMA = N'dbo'
                     and t.TABLE_NAME = N'Magic_PowerBIReport'
                     and t.TABLE_TYPE = N'BASE TABLE')
begin

    create table [dbo].[Magic_PowerBIReport] (
                 [ID]                        [int] identity(1, 1) not null,
                 [Code]                      [nvarchar](50) null,
                 [Description]               [varchar](max) null,
                 [PowerBI_reportId]          [nvarchar](max) null,
                 [FilterData]                [bit] not null,
                 [Note]                      [nvarchar](max) null,
                 [Magic_PowerBIWorkspace_ID] [int] null,
                 [ModifiedUser_ID]           [int] null,
                 [ModifiedDate]              [datetime] null,
                 constraint [PK_Magic_PowerBIReport] primary key clustered([ID] asc)
                 with(pad_index = off, statistics_norecompute = off, ignore_dup_key = off, allow_row_locks = on, allow_page_locks = on) on [PRIMARY])
    on [PRIMARY] textimage_on [PRIMARY];

    alter table [dbo].[Magic_PowerBIReport]
    add constraint [DF_Magic_PowerBIReport_FilterData] default((0)) for [FilterData];

    alter table [dbo].[Magic_PowerBIReport]
    with check
    add constraint [FK_Magic_PowerBIReport_Magic_PowerBIWorkspace] foreign key([Magic_PowerBIWorkspace_ID]) references [dbo].[Magic_PowerBIWorkspace]([ID]);
    alter table [dbo].[Magic_PowerBIReport] check constraint [FK_Magic_PowerBIReport_Magic_PowerBIWorkspace];

end;
go

if not exists (select 1
               from INFORMATION_SCHEMA.TABLES as t
               where t.TABLE_SCHEMA = N'dbo'
                     and t.TABLE_NAME = N'M_PowerBIReport_User'
                     and t.TABLE_TYPE = N'BASE TABLE')
begin

    create table [dbo].[M_PowerBIReport_User] (
                 [ID]                     [int] identity(1, 1) not null,
                 [Magic_PowerBIReport_ID] [int] null,
                 [Magic_Mmb_UserID]       [int] null,
                 constraint [PK_M_PowerBIReport_User] primary key clustered([ID] asc)
                 with(pad_index = off, statistics_norecompute = off, ignore_dup_key = off, allow_row_locks = on, allow_page_locks = on) on [PRIMARY])
    on [PRIMARY];

    alter table [dbo].[M_PowerBIReport_User]
    with check
    add constraint [FK_M_PowerBIReport_User_Magic_PowerBIReport] foreign key([Magic_PowerBIReport_ID]) references [dbo].[Magic_PowerBIReport]([ID]);

    alter table [dbo].[M_PowerBIReport_User] check constraint [FK_M_PowerBIReport_User_Magic_PowerBIReport];

end;
go

if not exists (select 1
               from INFORMATION_SCHEMA.TABLES as t
               where t.TABLE_SCHEMA = N'dbo'
                     and t.TABLE_NAME = N'M_PowerBIWorkspace_User'
                     and t.TABLE_TYPE = N'BASE TABLE')
begin

    create table [dbo].[M_PowerBIWorkspace_User] (
                 [ID]                        [int] identity(1, 1) not null,
                 [Magic_PowerBIWorkspace_ID] [int] null,
                 [Magic_Mmb_UserID]          [int] null,
                 [ViewFullWorkspace]         [bit] not null,
                 constraint [PK_M_PowerBIWorkspace_User] primary key clustered([ID] asc)
                 with(pad_index = off, statistics_norecompute = off, ignore_dup_key = off, allow_row_locks = on, allow_page_locks = on) on [PRIMARY])
    on [PRIMARY];

    alter table [dbo].[M_PowerBIWorkspace_User]
    add constraint [DF_M_PowerBIWorkspace_User_ViewFullWorkspace] default((0)) for [ViewFullWorkspace];

    alter table [dbo].[M_PowerBIWorkspace_User]
    with check
    add constraint [FK_M_PowerBIWorkspace_User_Magic_PowerBIWorkspace] foreign key([Magic_PowerBIWorkspace_ID]) references [dbo].[Magic_PowerBIWorkspace]([ID]);

    alter table [dbo].[M_PowerBIWorkspace_User] check constraint [FK_M_PowerBIWorkspace_User_Magic_PowerBIWorkspace];
end;
go

if exists (select 1
           from INFORMATION_SCHEMA.TABLES as t
           where t.TABLE_SCHEMA = N'dbo'
                 and t.TABLE_NAME = N'VM_PowerBIReport_User'
                 and t.TABLE_TYPE = N'VIEW')
    drop view [dbo].[VM_PowerBIReport_User];
go

create view [dbo].[VM_PowerBIReport_User]
as
     select ws.ID Magic_PowerBIReport_ID
          , mmu.UserID UserID
          , mmu.Username
          , concat(isnull(mmu.FirstName, ''), ' ', isnull(mmu.LastName, '')) as UserFullDescription
          , case
                when mpu.ID is null then cast(0 as bit)
                else cast(1 as bit)
            end Associated
          , mpu.ID
     from dbo.Magic_PowerBIReport ws
          cross join dbo.Magic_Mmb_Users mmu
     left join dbo.M_PowerBIReport_User mpu on mpu.Magic_PowerBIReport_ID = ws.id
                                               and mpu.Magic_Mmb_UserID = mmu.UserID;
go

if exists (select 1
           from INFORMATION_SCHEMA.TABLES as t
           where t.TABLE_SCHEMA = N'dbo'
                 and t.TABLE_NAME = N'VM_PowerBIWorkspace_User'
                 and t.TABLE_TYPE = N'VIEW')
    drop view [dbo].[VM_PowerBIWorkspace_User];
go

create view [dbo].[VM_PowerBIWorkspace_User]
as
     select ws.ID Magic_PowerBIWorkspace_ID
          , mmu.UserID UserID
          , mmu.Username
          , concat(isnull(mmu.FirstName, ''), ' ', isnull(mmu.LastName, '')) as UserFullDescription
          , case
                when mpu.ID is null then cast(0 as bit)
                else cast(1 as bit)
            end Associated
          , mpu.ID
          , mpu.ViewFullWorkspace
     from dbo.Magic_PowerBIWorkspace ws
          cross join dbo.Magic_Mmb_Users mmu
     left join dbo.M_PowerBIWorkspace_User mpu on mpu.Magic_PowerBIWorkspace_ID = ws.id
                                                  and mpu.Magic_Mmb_UserID = mmu.UserID;
go

if exists (select *
           from sys.objects
           where object_id = object_id(N'[dbo].[Magic_GetPowerBI_GUIDs]')
                 and type in (N'P') )
    drop procedure [dbo].[Magic_GetPowerBI_GUIDs];
go

create procedure [dbo].[Magic_GetPowerBI_GUIDs] (
                 @xmlinput xml)
as
begin

    declare @idUser as int = @xmlinput.value ('(/SQLP/SESSIONVARS/@iduser)[1]', 'int');
    declare @visibilityid as int = @xmlinput.value ('(/SQLP/SESSIONVARS/@idbusinessunit)[1]', 'int');
    declare @workspace_ID int = @xmlinput.value ('(/SQLP/P/@workspace_ID)[1]', 'int');
    declare @report_ID int = @xmlinput.value ('(/SQLP/P/@report_ID)[1]', 'int');

    select wp.PowerBI_workspaceId as workspaceId
         , r.PowerBI_reportId as reportId
         , r.FilterData
    from Magic_PowerBIWorkspace wp
         inner join Magic_PowerBIReport r on r.Magic_PowerBIWorkspace_ID = wp.ID
    where r.ID = @report_ID
          and wp.ID = @workspace_ID;

end;

go

--

if exists (select *
           from sys.objects
           where object_id = object_id(N'[dbo].[usp_getPowerBI_Reports_drop]')
                 and type in (N'P') )
    drop procedure [dbo].[usp_getPowerBI_Reports_drop];
go

create procedure [dbo].[usp_getPowerBI_Reports_drop] (
                 @xmlInput xml)
as
begin

    if(exists (select *
               from INFORMATION_SCHEMA.ROUTINES
               where ROUTINE_NAME = 'usp_getPowerBI_Reports_drop'
                     and ROUTINE_SCHEMA = 'CUSTOM') )
    begin
        declare @sql  nvarchar(max)
              , @pars nvarchar(max);
        set @sql = N'Exec CUSTOM.usp_getPowerBI_Reports_drop  @xmlInput ';

        set @pars = N'@xmlInput as xml';

        execute sp_executesql @sql
                            , @pars
                            , @xmlInput = @xmlInput;
        return;

    end;

    declare @userId as int = @xmlInput.value ('(/SQLP/SESSIONVARS/@iduser)[1]', 'int');
    declare @isDeveloper bit;

    if exists (select 1
               from Magic_Mmb_UsersProfiles up
                    inner join Magic_Mmb_Profiles mmbp on mmbp.ProfileID = up.Profile_ID
               where up.User_ID = 7
                     and mmbp.ProfileName = 'Developer')
    begin
        set @isDeveloper = 1;
    end;

    declare @Workspace_ID as int = @xmlInput.value ('(/SQLP/P/@Workspace_ID)[1]', 'int');
    declare @tab table (
                       ID          nvarchar(20),
                       Description nvarchar(200));

    insert into @tab
    select distinct
           mpr.id
         , description
    from Magic_PowerBIReport mpr
         left join M_PowerBIReport_User mpru on mpru.Magic_PowerBIReport_ID = mpr.ID
    where @Workspace_ID = Magic_PowerBIWorkspace_ID
          and (mpru.Magic_Mmb_UserID = @userId
               or @isDeveloper = 1);

    select *
    from @tab;

    return;
end;
go

if exists (select *
           from sys.objects
           where object_id = object_id(N'[dbo].[usp_getPowerBI_Workspaces_drop]')
                 and type in (N'P') )
    drop procedure [dbo].[usp_getPowerBI_Workspaces_drop];
go

create procedure [dbo].[usp_getPowerBI_Workspaces_drop] (
                 @xmlInput xml)
as
begin

    if(exists (select *
               from INFORMATION_SCHEMA.ROUTINES
               where ROUTINE_NAME = 'usp_getPowerBI_Workspaces_drop'
                     and ROUTINE_SCHEMA = 'CUSTOM') )
    begin
        declare @sql  nvarchar(max)
              , @pars nvarchar(max);
        set @sql = N'Exec CUSTOM.usp_getPowerBI_Workspaces_drop  @xmlInput ';

        set @pars = N'@xmlInput as xml';

        execute sp_executesql @sql
                            , @pars
                            , @xmlInput = @xmlInput;
        return;

    end;

    declare @userId as int = @xmlInput.value ('(/SQLP/SESSIONVARS/@iduser)[1]', 'int');
    declare @isDeveloper bit;

    if exists (select 1
               from Magic_Mmb_UsersProfiles up
                    inner join Magic_Mmb_Profiles mmbp on mmbp.ProfileID = up.Profile_ID
               where up.User_ID = 7
                     and mmbp.ProfileName = 'Developer')
    begin
        set @isDeveloper = 1;
    end;

    declare @tab table (
                       ID          nvarchar(20),
                       Description nvarchar(200));

    insert into @tab
    select distinct
           mpm.id
         , description
    from Magic_PowerBIWorkspace mpm
         left join M_PowerBIWorkspace_User on Magic_PowerBIWorkspace_ID = mpm.ID
    where Magic_Mmb_UserID = @userId
          or @isDeveloper = 1;

    select *
    from @tab;

    return;
end;
go

if exists (select *
           from sys.objects
           where object_id = object_id(N'[dbo].[usp_powerbiworkspace_dml]')
                 and type in (N'P') )
    drop procedure [dbo].[usp_powerbiworkspace_dml];
go

create procedure [dbo].[usp_powerbiworkspace_dml] (
                 @xmlInput as   xml,
                 @PKValueOut as varchar(50) output,
                 @msg as        varchar(4000) output,
                 @errId      int output)
as
begin

    declare @actionType as varchar(50) = @xmlInput.value ('(/SQLP/ACTION/@TYPE)[1]', 'varchar(50)');
    declare @rootDirTmpUploads as varchar(500) = @xmlInput.value ('(/SQLP/SESSIONVARS/@Rootdirforupload)[1]', 'varchar(500)');
    declare @rootDirUploads as varchar(500) = @xmlInput.value ('(/SQLP/SESSIONVARS/@Rootdirforcustomer)[1]', 'varchar(500)');
    declare @UserGroupVisibility_ID as int = @xmlInput.value ('(/SQLP/SESSIONVARS/@idbusinessunit)[1]', 'int');
    declare @userId as int = @xmlInput.value ('(/SQLP/SESSIONVARS/@iduser)[1]', 'int');
    declare @ID as int = @xmlInput.value ('(/SQLP/P/@ID)[1]', 'int');
    declare @Code as nvarchar(50) = dbo.uf_replace_to_null (@xmlInput.value ('(/SQLP/P/@Code)[1]', 'nvarchar(50)') );
    declare @Description as nvarchar(max) = dbo.uf_replace_to_null (@xmlInput.value ('(/SQLP/P/@Description)[1]', 'nvarchar(max)') );
    declare @PowerBI_workspaceId as nvarchar(max) = dbo.uf_replace_to_null (@xmlInput.value ('(/SQLP/P/@PowerBI_workspaceId)[1]', 'nvarchar(max)') );
    declare @Note as varchar(max) = dbo.uf_replace_to_null (@xmlInput.value ('(/SQLP/P/@Note)[1]', 'varchar(max)') );
    declare @ModifiedUser_ID as int = dbo.uf_replace_to_null (@xmlInput.value ('(/SQLP/P/@ModifiedUser_ID)[1]', 'int') );
    declare @ModifiedDate as datetime = dbo.uf_replace_to_null (@xmlInput.value ('(/SQLP/P/@ModifiedDate)[1]', 'varchar(50)') );
    set @ModifiedDate = getdate();
    set @ModifiedUser_ID = @userId;

    if(exists (select *
               from INFORMATION_SCHEMA.ROUTINES
               where ROUTINE_NAME = 'usp_powerbiworkspace_dml'
                     and ROUTINE_SCHEMA = 'CUSTOM') )
    begin
        declare @sql  nvarchar(max)
              , @pars nvarchar(max);
        set @sql = N'Exec CUSTOM.usp_powerbiworkspace_dml  @xmlInput ';

        set @pars = N'@xmlInput as xml';

        execute sp_executesql @sql
                            , @pars
                            , @xmlInput = @xmlInput;
        return;

    end;

    -- Business Logic Script
    begin tran;
    begin try
        if @actionType = 'create'
           and @ID = 0
        begin
            insert into dbo.Magic_PowerBIWorkspace
                   (Code
                  , Description
                  , PowerBI_workspaceId
                  , Note
                  , ModifiedUser_ID
                  , ModifiedDate)
            values (@Code
                  , @Description
                  , @PowerBI_workspaceId
                  , @Note
                  , @ModifiedUser_ID
                  , @ModifiedDate);
            set @PKValueOut = cast(scope_identity() as varchar(13));
        end;

        if @actionType = 'update'
        begin
            update dbo.Magic_PowerBIWorkspace
                set Code = @Code
                  , Description = @Description
                  , PowerBI_workspaceId = @PowerBI_workspaceId
                  , Note = @Note
                  , ModifiedUser_ID = @ModifiedUser_ID
                  , ModifiedDate = @ModifiedDate
            where ID = @ID;
        end;

        if @actionType = 'destroy'
        begin
            delete dbo.Magic_PowerBIWorkspace
            where ID = @ID;
        end;

        commit tran;
        select @errId = 0
             , @msg = dbo.uf_ret_msg_content (@userId, '0');
    end try
    begin catch
        set @msg = error_message();
        set @msg = REPLACE(@msg, '"', '');
        select @errId = 200001
             , @msg = '{"type":"ERR","content":"' + @msg + '"}';
        rollback tran;
    end catch;
end;
go

if exists (select *
           from sys.objects
           where object_id = object_id(N'[dbo].[usp_VM_PowerBIReport_User_dml]')
                 and type in (N'P') )
    drop procedure [dbo].[usp_VM_PowerBIReport_User_dml];
go

create procedure [dbo].[usp_VM_PowerBIReport_User_dml] (
                 @xmlInput as   xml,
                 @PKValueOut as varchar(50) output,
                 @msg as        varchar(4000) output,
                 @errId      int output)
as
begin

/*******************************************************************************
   ** Version: 1.0
   ** Name: vm_usp_vm_document_referent_dml	
   ** Schema: Accounting
   ** Desc:   The procedure is automatically generated by the engine
   **
   ** Table:   
   **
   ** Auth:	the Engine
   ** Date: 22/12/2016
   *******************************************************************************
   ** Change History
   *******************************************************************************
   ** Date:               Author:         Description:
   **
**********************************************************************************/

    declare @actionType as varchar(50) = @xmlInput.value ('(/SQLP/ACTION/@TYPE)[1]', 'varchar(50)');
    declare @rootDirTmpUploads as varchar(500) = @xmlInput.value ('(/SQLP/SESSIONVARS/@Rootdirforupload)[1]', 'varchar(500)');
    declare @rootDirUploads as varchar(500) = @xmlInput.value ('(/SQLP/SESSIONVARS/@Rootdirforcustomer)[1]', 'varchar(500)');
    declare @UserGroupVisibility_ID as int = @xmlInput.value ('(/SQLP/SESSIONVARS/@idbusinessunit)[1]', 'int');
    declare @ID as int = dbo.uf_replace_to_null (@xmlInput.value ('(/SQLP/P/@ID)[1]', 'int') );
    declare @PowerBIReport_ID as int = @xmlInput.value ('(/SQLP/P/@Magic_PowerBIReport_ID)[1]', 'int');
    declare @UserID as int = @xmlInput.value ('(/SQLP/P/@UserID)[1]', 'int');
    declare @Associated as bit = @xmlInput.value ('(/SQLP/P/@Associated)[1]', 'bit');
    --ViewFullReport
    -- Business Logic Script
    begin tran;
    begin try

        if @Associated = 0
        begin
            delete from M_PowerBIReport_User
            where Magic_PowerBIReport_ID = @PowerBIReport_ID
                  and Magic_Mmb_UserID = @UserID;
        end;
            else
            if not exists (select 1
                           from M_PowerBIReport_User
                           where Magic_PowerBIReport_ID = @PowerBIReport_ID
                                 and Magic_Mmb_UserID = @UserID)
            begin
                insert into M_PowerBIReport_User
                       (Magic_PowerBIReport_ID
                      , Magic_Mmb_UserID)
                values (@PowerBIReport_ID
                      , @UserID);
            end;

        commit tran;
        select @errId = 0
             , @msg = dbo.uf_ret_msg_content (@userId, '0');
    end try
    begin catch
        set @msg = error_message();
        select @errId = 200001
             , @msg = '{"type":"ERR","content":"' + @msg + '"}';
        rollback tran;
    end catch;
end;
go

if exists (select *
           from sys.objects
           where object_id = object_id(N'[dbo].[usp_VM_PowerBIWorkspace_User_dml]')
                 and type in (N'P') )
    drop procedure [dbo].[usp_VM_PowerBIWorkspace_User_dml];
go

create procedure [dbo].[usp_VM_PowerBIWorkspace_User_dml] (
                 @xmlInput as   xml,
                 @PKValueOut as varchar(50) output,
                 @msg as        varchar(4000) output,
                 @errId      int output)
as
begin

/*******************************************************************************
   ** Version: 1.0
   ** Name: vm_usp_vm_document_referent_dml	
   ** Schema: Accounting
   ** Desc:   The procedure is automatically generated by the engine
   **
   ** Table:   
   **
   ** Auth:	the Engine
   ** Date: 22/12/2016
   *******************************************************************************
   ** Change History
   *******************************************************************************
   ** Date:               Author:         Description:
   **
**********************************************************************************/

    declare @actionType as varchar(50) = @xmlInput.value ('(/SQLP/ACTION/@TYPE)[1]', 'varchar(50)');
    declare @rootDirTmpUploads as varchar(500) = @xmlInput.value ('(/SQLP/SESSIONVARS/@Rootdirforupload)[1]', 'varchar(500)');
    declare @rootDirUploads as varchar(500) = @xmlInput.value ('(/SQLP/SESSIONVARS/@Rootdirforcustomer)[1]', 'varchar(500)');
    declare @UserGroupVisibility_ID as int = @xmlInput.value ('(/SQLP/SESSIONVARS/@idbusinessunit)[1]', 'int');
    declare @ID as int = dbo.uf_replace_to_null (@xmlInput.value ('(/SQLP/P/@ID)[1]', 'int') );
    declare @PowerBIWorkspace_ID as int = @xmlInput.value ('(/SQLP/P/@Magic_PowerBIWorkspace_ID)[1]', 'int');
    declare @UserID as int = @xmlInput.value ('(/SQLP/P/@UserID)[1]', 'int');
    declare @Associated as bit = @xmlInput.value ('(/SQLP/P/@Associated)[1]', 'bit');
    --ViewFullWorkspace
    declare @ViewFullWorkspace as bit = @xmlInput.value ('(/SQLP/P/@ViewFullWorkspace)[1]', 'bit');

    -- Business Logic Script
    begin tran;
    begin try

        if @Associated = 0
        begin
            delete from M_PowerBIWorkspace_User
            where Magic_PowerBIWorkspace_ID = @PowerBIWorkspace_ID
                  and Magic_Mmb_UserID = @UserID;
        end;
            else
            if exists (select 1
                       from M_PowerBIWorkspace_User
                       where Magic_PowerBIWorkspace_ID = @PowerBIWorkspace_ID
                             and Magic_Mmb_UserID = @UserID)
            begin
                update M_PowerBIWorkspace_User
                    set ViewFullWorkspace = @ViewFullWorkspace
                where Magic_PowerBIWorkspace_ID = @PowerBIWorkspace_ID
                      and Magic_Mmb_UserID = @UserID;
            end;
                else
            begin
                insert into M_PowerBIWorkspace_User
                       (Magic_PowerBIWorkspace_ID
                      , Magic_Mmb_UserID
                      , ViewFullWorkspace)
                values (@PowerBIWorkspace_ID
                      , @UserID
                      , @ViewFullWorkspace);
            end;

        commit tran;
        select @errId = 0
             , @msg = dbo.uf_ret_msg_content (@userId, '0');
    end try
    begin catch
        set @msg = error_message();
        select @errId = 200001
             , @msg = '{"type":"ERR","content":"' + @msg + '"}';
        rollback tran;
    end catch;
end;
go

