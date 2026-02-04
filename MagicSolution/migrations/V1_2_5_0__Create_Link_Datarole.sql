if not exists (select 1
               from Magic_TemplateDataRoles
               where MagicTemplateDataRole = 'link')

    insert into Magic_TemplateDataRoles
           (MagicTemplateDataRole)
    values ('link');