IF  OBJECT_ID (N'dbo.Magic_CheckFileDeletionPermission') IS NOT NULL
AND OBJECTPROPERTY (OBJECT_ID (N'dbo.Magic_CheckFileDeletionPermission'), N'IsProcedure') = 1
    DROP PROC dbo.Magic_CheckFileDeletionPermission;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO


CREATE PROCEDURE [dbo].[Magic_CheckFileDeletionPermission] @XmlInput XML
AS
    BEGIN
        DECLARE @iduser INT;
        DECLARE @FileName NVARCHAR(255);
        DECLARE @RequestPath NVARCHAR(MAX);
        DECLARE @RootDirForUpload NVARCHAR(MAX);
        DECLARE @AppPath NVARCHAR(MAX);
        DECLARE @MSSQLFileTable BIT;
        DECLARE @ApplicationInstanceName NVARCHAR(MAX);
        DECLARE @ApplicationDomain NVARCHAR(MAX);
        DECLARE @MagicDBCatalogue NVARCHAR(MAX);
        DECLARE @TargetDBCatalogue NVARCHAR(MAX);
        DECLARE @GridCode NVARCHAR(MAX);
        SET @GridCode = @XmlInput.value ('(/SQLP/P/@GridCode)[1]', 'nvarchar(max)');

        SET @iduser = @XmlInput.value ('(/SQLP/SESSIONVARS/@iduser)[1]', 'int');
        SET @FileName = @XmlInput.value ('(/SQLP/P/@FileName)[1]', 'nvarchar(255)');
        SET @RequestPath = @XmlInput.value ('(/SQLP/P/@RequestPath)[1]', 'nvarchar(max)');
        SET @RootDirForUpload = @XmlInput.value ('(/SQLP/SESSIONVARS/@Rootdirforupload)[1]', 'nvarchar(max)');
        SET @AppPath = @XmlInput.value ('(/SQLP/SESSIONVARS/@AppPath)[1]', 'nvarchar(max)');
        SET @MSSQLFileTable = @XmlInput.value ('(/SQLP/SESSIONVARS/@MSSQLFileTable)[1]', 'bit');
        SET @ApplicationInstanceName = @XmlInput.value (
                                                     '(/SQLP/SESSIONVARS/@ApplicationInstanceName)[1]', 'nvarchar(max)');
        SET @ApplicationDomain = @XmlInput.value ('(/SQLP/SESSIONVARS/@ApplicationDomain)[1]', 'nvarchar(max)');
        SET @MagicDBCatalogue = @XmlInput.value ('(/SQLP/SESSIONVARS/@MagicDBCatalogue)[1]', 'nvarchar(max)');
        SET @TargetDBCatalogue = @XmlInput.value ('(/SQLP/SESSIONVARS/@TargetDBCatalogue)[1]', 'nvarchar(max)');

        IF EXISTS (   SELECT 1
                      FROM dbo.Magic_Mmb_Users mb
                           LEFT JOIN dbo.Magic_Mmb_Users_Extensions mbe ON mbe.UserID = mb.UserID
                      WHERE mb.UserID = @iduser
                      AND   @RequestPath = '/app#/profile'
                      AND   @FileName IN ( mb.UserImg, mbe.UserSymbolImg ))
            BEGIN
                SELECT 1 AS HasPermission;
                RETURN;
            END;
        ELSE
            BEGIN
                SELECT 0 AS HasPermission;
            END;
    END;
