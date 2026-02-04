# MimeDetect

[![NuGet](https://img.shields.io/nuget/dt/Winista.MimeDetect.svg)](https://www.nuget.org/packages/Winista.MimeDetect) 
[![NuGet](https://img.shields.io/nuget/vpre/Winista.MimeDetect.svg)](https://www.nuget.org/packages/Winista.MimeDetect)

MimeDetect is a library that used to identify MIME content type by analysing the file binary header with optional file extension. For .NET Framework version package has fallback into urlmon.dll (Windows systems only).

This package is part of nonexisting project Winista.

### Install with nuget

```
Install-Package Winista.MimeDetect
```

## Install with .NET CLI
```
dotnet add package Winista.MimeDetect
```

# How to use

```csharp
   //init
   var mimeTypes = new MimeTypes();
   
   //usage by filepath
   var mimeType1 = mimeTypes.GetMimeTypeFromFile(filePath);
   
   //usage by bytearray
   var mimeType2 = mimeTypes.GetMimeTypeFromFile(bytes);

```
