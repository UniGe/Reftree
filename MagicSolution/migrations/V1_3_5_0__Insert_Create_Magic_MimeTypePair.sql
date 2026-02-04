-- Check if the table exists, if not, create it
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Magic_MimeTypePairs]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Magic_MimeTypePairs] (
        [ID] INT IDENTITY(1,1) PRIMARY KEY,
        [DetectedMimeType] NVARCHAR(255) NOT NULL,
        [FileExtension] NVARCHAR(10) NOT NULL,
        [IsActive] BIT NOT NULL CONSTRAINT [DF_Magic_MimeTypePairs_IsActive] DEFAULT (0),
        [InsertionDate] DATETIME2 NOT NULL CONSTRAINT [DF_Magic_MimeTypePairs_InsertionDate] DEFAULT (GETDATE()),
        [LastCheckDate] DATETIME2 NULL,
        CONSTRAINT [UQ_Magic_MimeTypePairs_MimeType_Extension] UNIQUE ([DetectedMimeType], [FileExtension])
    )
END
GO

-- Create or alter the stored procedure
CREATE OR ALTER PROCEDURE [dbo].[Magic_CheckOrInsertMimeTypePair]
    @DetectedMimeType NVARCHAR(255),
    @FileExtension NVARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @IsActive BIT
    DECLARE @ID INT

    IF NOT EXISTS (SELECT 1 FROM [dbo].[Magic_MimeTypePairs] 
                   WHERE DetectedMimeType = @DetectedMimeType AND FileExtension = @FileExtension)
    BEGIN
        INSERT INTO [dbo].[Magic_MimeTypePairs] (DetectedMimeType, FileExtension, IsActive, InsertionDate)
        VALUES (@DetectedMimeType, @FileExtension, 0, GETDATE())

        SET @ID = SCOPE_IDENTITY()
        SET @IsActive = 0
    END
    ELSE
    BEGIN
        SELECT @ID = ID, @IsActive = IsActive
        FROM [dbo].[Magic_MimeTypePairs]
        WHERE DetectedMimeType = @DetectedMimeType AND FileExtension = @FileExtension

        IF @IsActive = 0
        BEGIN
            UPDATE [dbo].[Magic_MimeTypePairs]
            SET LastCheckDate = GETDATE()
            WHERE ID = @ID
        END
    END

    SELECT @ID AS ID, @IsActive AS IsActive
END