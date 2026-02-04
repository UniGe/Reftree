GO
IF NOT EXISTS(Select * from Magic_TemplateDataRoles where MagicTemplateDataRole='searchgrid_multiselect')
BEGIN
INSERT INTO Magic_TemplateDataRoles (MagicTemplateDataRole) Values ('searchgrid_multiselect')
END