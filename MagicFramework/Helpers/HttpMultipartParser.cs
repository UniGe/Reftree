/// HttpUtils.HttpMultipartParser
/// 
/// Copyright (c) 2012 Lorenzo Polidori
/// 
/// This software is distributed under the terms of the MIT License reproduced below.
/// 
/// Permission is hereby granted, free of charge, to any person obtaining a copy of this software 
/// and associated documentation files (the "Software"), to deal in the Software without restriction, 
/// including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, 
/// and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, 
/// subject to the following conditions:
/// 
/// The above copyright notice and this permission notice shall be included in all copies or substantial 
/// portions of the Software.
/// 
/// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT 
/// NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
/// IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, 
/// WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE 
/// SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
/// 

///this file got hardly modified in order to be compatible with .net 4.5 and support multiple files in the multipart
///it is even a lot more comfortable to use

using System;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.Collections.Generic;

/// <summary>
/// HttpMultipartParser
/// Reads a multipart http data stream and returns the file name, content type and file content.
/// Also, it returns any additional form parameters in a Dictionary.
/// </summary>
namespace HttpUtils
{
    public class HttpMultipartParser
    {
        public HttpMultipartParser(Stream stream)
        {
            this.Parse(stream, Encoding.UTF8);
        }

        public HttpMultipartParser(Stream stream, Encoding encoding)
        {
            this.Parse(stream, encoding);
        }

        private void Parse(Stream stream, Encoding encoding)
        {
            this.Success = false;

            // Read the stream into a byte array
            var memoryStream = new MemoryStream();
            stream.CopyTo(memoryStream);
            byte[] data = memoryStream.ToArray();

            // Copy to a string for header parsing
            string content = encoding.GetString(data);

            // The first line should contain the delimiter
            int delimiterEndIndex = content.IndexOf("\r\n");

            if (delimiterEndIndex > -1)
            {
                string delimiter = content.Substring(0, content.IndexOf("\r\n"));

                string[] sections = content.Split(new string[] { delimiter }, StringSplitOptions.RemoveEmptyEntries);

                int lastIndex = 0;
                int startIndex, currOffset, position, endIndex, contentLength;
                byte[] delimiterBytes;
                byte[] fileData;

                foreach (string s in sections)
                {
                    if (s.Contains("Content-Disposition"))
                    {
                        // If we find "Content-Disposition", this is a valid multi-part section
                        // Now, look for the "name" parameter
                        Match nameMatch = new Regex(@"(?<=name\=\"")(.*?)(?=\"")").Match(s);
                        string name = nameMatch.Value.Trim().ToLower();

                        if (!string.IsNullOrWhiteSpace(name) && s.Contains("Content-Type"))
                        {
                            // Look for Content-Type
                            Regex re = new Regex(@"(?<=Content\-Type:)(.*?)(?=\r\n\r\n)");
                            Match contentTypeMatch = re.Match(s);

                            // Look for filename
                            re = new Regex(@"(?<=filename\=\"")(.*?)(?=\"")");
                            Match filenameMatch = re.Match(s);

                            // Did we find the required values?
                            if (contentTypeMatch.Success && filenameMatch.Success)
                            {
                                // Get the start & end indexes of the file contents
                                //startIndex = contentTypeMatch.Index + contentTypeMatch.Length + "\r\n\r\n".Length;
                                currOffset = 0;
                                startIndex = -1;
                                delimiterBytes = encoding.GetBytes(contentTypeMatch + "\r\n\r\n");
                                for (position = lastIndex; position < data.Length; position++)
                                {
                                    byte b = data[position];
                                    if (b == delimiterBytes[currOffset])
                                    {
                                        if (currOffset == delimiterBytes.Length - 1) { startIndex = position + 1; break; }
                                        currOffset++;
                                        continue;
                                    }

                                    // Fixup the offset to the byte after the beginning of the abortive sequence
                                    if (currOffset == 0) continue;
                                    position -= currOffset;
                                    currOffset = 0;
                                }

                                currOffset = 0;
                                endIndex = -1;
                                delimiterBytes = encoding.GetBytes("\r\n" + delimiter);
                                for (position = startIndex; position < data.Length; position++)
                                {
                                    byte b = data[position];
                                    if (b == delimiterBytes[currOffset])
                                    {
                                        if (currOffset == delimiterBytes.Length - 1) { endIndex = position - currOffset; break; }
                                        currOffset++;
                                        continue;
                                    }

                                    // Fixup the offset to the byte after the beginning of the abortive sequence
                                    if (currOffset == 0) continue;
                                    position -= currOffset;
                                    currOffset = 0;
                                }

                                if (endIndex == -1)
                                    continue;
                                contentLength = endIndex - startIndex;
                                lastIndex = endIndex;
                                // Extract the file contents from the byte array
                                fileData = new byte[contentLength];

                                Buffer.BlockCopy(data, startIndex, fileData, 0, contentLength);

                                this.FileContents.Add(name, new MultipartFile { ContentType = contentTypeMatch.Value.Trim(), Filename = filenameMatch.Value.Trim(), File = fileData });
                            }
                        }
                        else
                        {
                            // Get the start & end indexes of the file contents
                            startIndex = nameMatch.Index + nameMatch.Length + "\r\n\r\n".Length;
                            Parameters.Add(name, s.Substring(startIndex).TrimEnd(new char[] { '\r', '\n' }).Trim());
                        }
                    }
                }

                // If some data has been successfully received, set success to true
                if (FileContents != null || Parameters.Count != 0)
                    this.Success = true;
            }
        }

        public IDictionary<string, string> Parameters = new Dictionary<string, string>();
        public Dictionary<string, MultipartFile> FileContents = new Dictionary<string, MultipartFile>();

        public bool Success
        {
            get;
            private set;
        }

        public class MultipartFile
        {
            public string ContentType { set; get; }
            public string Filename { set; get; }
            public byte[] File { set; get; }
        }
    }
}