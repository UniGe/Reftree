using System.Drawing;
using System.Drawing.Imaging;
using System.IO;

namespace MagicFramework.Helpers
{
    public class CompressImage
    {
        public static byte[] Compress(byte[] data)
        {
            var jpgEncoder = GetEncoder(ImageFormat.Jpeg);
            using (var inStream = new MemoryStream(data))
            using (var outStream = new MemoryStream())
            {
                var image = Image.FromStream(inStream);

                // if we aren't able to retrieve our encoder
                // we should just save the current image and
                // return to prevent any exceptions from happening
                if (jpgEncoder == null)
                {
                    image.Save(outStream, ImageFormat.Jpeg);
                }
                else
                {
                    var qualityEncoder = Encoder.Quality;
                    var encoderParameters = new EncoderParameters(1);
                    encoderParameters.Param[0] = new EncoderParameter(qualityEncoder, 50L);
                    image.Save(outStream, jpgEncoder, encoderParameters);
                }

                return outStream.ToArray();
            }
        }

        private static ImageCodecInfo GetEncoder(ImageFormat format)
        {
            var codecs = ImageCodecInfo.GetImageDecoders();
            foreach (var codec in codecs)
            {
                if (codec.FormatID == format.Guid)
                {
                    return codec;
                }
            }

            return null;
        }
    }
}