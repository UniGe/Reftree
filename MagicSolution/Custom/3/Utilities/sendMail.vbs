Option Explicit

Dim xmlFilePath, xmlDoc, mailSubject, mailBody, mailFrom, mailTo, mailCC, mailBCC, mailAttachments
Dim smtpServer, smtpPort, smtpUser, smtpPass, smtpSSL
Dim objEmail, attachmentNode, attachmentContent, attachmentName, attachmentType, tempAttachmentPaths
Dim tempAttachmentPath, tempFile, nodes, node

' SMTP server configuration - CHANGE CONFIGURATION FOR YOUR MAIL SERVER
smtpServer = "subdomain.domain.it"
smtpPort = 465 ' Change this if necessary
smtpUser = "email@subdomain.domain.it"
smtpPass = "password"
smtpSSL = True ' Change this if necessary
mailFrom = "XXXX"


' Get the XML file path from the argument
xmlFilePath = WScript.Arguments.Item(0)

' Initialize the array to hold paths of temporary files
Set tempAttachmentPaths = CreateObject("Scripting.Dictionary")

' Load the XML document
Set xmlDoc = CreateObject("Microsoft.XMLDOM")
xmlDoc.async = False
xmlDoc.load(xmlFilePath)

If xmlDoc.parseError.errorCode <> 0 Then
    WScript.Echo "Error loading XML file: " & xmlDoc.parseError.reason
    CleanUp()
    WScript.Quit 1
End If

' Extract email details from the XML
mailSubject = xmlDoc.selectSingleNode("//SerializableMailMessage/Subject").Text
mailBody = xmlDoc.selectSingleNode("//SerializableMailMessage/Body").Text

' Extract multiple email addresses
mailTo = JoinArray(GetNodeValues(xmlDoc, "//SerializableMailMessage/To/string"), ";")
mailCC = JoinArray(GetNodeValues(xmlDoc, "//SerializableMailMessage/Cc/string"), ";")
mailBCC = JoinArray(GetNodeValues(xmlDoc, "//SerializableMailMessage/Bcc/string"), ";")

' Extract attachment details
Set mailAttachments = xmlDoc.selectNodes("//SerializableMailMessage/Attachments/SerializableAttachment")




' Create the email object
Set objEmail = CreateObject("CDO.Message")

' Configure the SMTP server
With objEmail.Configuration.Fields
    .Item("http://schemas.microsoft.com/cdo/configuration/sendusing") = 2
    .Item("http://schemas.microsoft.com/cdo/configuration/smtpserver") = smtpServer
    .Item("http://schemas.microsoft.com/cdo/configuration/smtpserverport") = smtpPort
    .Item("http://schemas.microsoft.com/cdo/configuration/smtpauthenticate") = 1
    .Item("http://schemas.microsoft.com/cdo/configuration/sendusername") = smtpUser
    .Item("http://schemas.microsoft.com/cdo/configuration/sendpassword") = smtpPass
    .Item("http://schemas.microsoft.com/cdo/configuration/smtpusessl") = smtpSSL
    .Update
End With

' Set the email properties
objEmail.From = mailFrom
objEmail.To = mailTo
objEmail.CC = mailCC
objEmail.BCC = mailBCC
objEmail.Subject = mailSubject
objEmail.HTMLBody = mailBody

' Attach files
For Each attachmentNode In mailAttachments
    attachmentName = attachmentNode.selectSingleNode("Name").Text
    attachmentContent = attachmentNode.selectSingleNode("Content").Text
    attachmentType = attachmentNode.selectSingleNode("ContentType").Text
    
    ' Save the attachment content to a temporary file
    tempAttachmentPath = GetTempFilePath(attachmentName)
    Set tempFile = CreateObject("ADODB.Stream")
    tempFile.Type = 1 ' adTypeBinary
    tempFile.Open
    tempFile.Write Base64Decode(attachmentContent)
    tempFile.SaveToFile tempAttachmentPath, 2 ' adSaveCreateOverWrite
    tempFile.Close
    
    ' Store the path of the temporary file
    tempAttachmentPaths.Add tempAttachmentPath, tempAttachmentPath
    
    ' Attach the file to the email
    objEmail.AddAttachment tempAttachmentPath
Next

' Send the email
On Error Resume Next
objEmail.Send
If Err.Number <> 0 Then
    WScript.Echo "Error sending email: " & Err.Description
    CleanUp()
    WScript.Quit 1
End If

WScript.Echo "Email sent successfully"
CleanUp()
WScript.Quit 0

Function GetTempFilePath(fileName)
    Dim fso, tempFolder, tempFilePath
    Set fso = CreateObject("Scripting.FileSystemObject")
    tempFolder = fso.GetSpecialFolder(2) ' Temporary folder
    tempFilePath = fso.BuildPath(tempFolder, fileName)
    GetTempFilePath = tempFilePath
End Function

Function Base64Decode(encodedText)
    Dim xml, node
    Set xml = CreateObject("MSXML2.DOMDocument")
    Set node = xml.createElement("base64")
    node.DataType = "bin.base64"
    node.Text = encodedText
    Base64Decode = node.nodeTypedValue
End Function

Function GetNodeValues(doc, xpath)
    Dim nodes, node, values, i
    Set nodes = doc.selectNodes(xpath)
    If nodes.length = 0 Then
        GetNodeValues = Array()
        Exit Function
    End If
    ReDim values(nodes.length - 1)
    For i = 0 To nodes.length - 1
        values(i) = nodes.item(i).Text
    Next
    GetNodeValues = values
End Function

Function JoinArray(arr, delimiter)
    Dim result, i
    result = ""
    If UBound(arr) < 0 Then
        JoinArray = result
        Exit Function
    End If
    For i = 0 To UBound(arr)
        If i > 0 Then result = result & delimiter
        result = result & arr(i)
    Next
    JoinArray = result
End Function

Sub CleanUp()
    Dim fso, key
    Set fso = CreateObject("Scripting.FileSystemObject")
    For Each key In tempAttachmentPaths.Keys
        If fso.FileExists(tempAttachmentPaths(key)) Then
            fso.DeleteFile(tempAttachmentPaths(key))
        End If
    Next
End Sub