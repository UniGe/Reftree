using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Web;

namespace MagicFramework.Helpers
{
    public class Crypto
    {

        static byte[] s_aditionalEntropy = { 4, 5, 9, 6, 2 };

        public static string Protect(string data)
        {
            try
            {
                return Convert.ToBase64String(ProtectedData.Protect(Encoding.Unicode.GetBytes(data), s_aditionalEntropy, DataProtectionScope.LocalMachine));
            }
            catch (CryptographicException e)
            {
                return null;
            }
        }

        public static string Unprotect(string data)
        {
            try
            {
                return Encoding.Unicode.GetString(ProtectedData.Unprotect(Convert.FromBase64String(data), s_aditionalEntropy, DataProtectionScope.LocalMachine));
            }
            catch (CryptographicException e)
            {
                return null;
            }
        }

        public static string RandomString(int length, string alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
        {
            var outOfRange = Byte.MaxValue + 1 - (Byte.MaxValue + 1) % alphabet.Length;

            return string.Concat(
                Enumerable
                    .Repeat(0, Int32.MaxValue)
                    .Select(e => RandomByte())
                    .Where(randomByte => randomByte < outOfRange)
                    .Take(length)
                    .Select(randomByte => alphabet[randomByte % alphabet.Length])
            );
        }

        private static byte RandomByte()
        {
            using (var randomizationProvider = new RNGCryptoServiceProvider())
            {
                var randomBytes = new byte[1];
                randomizationProvider.GetBytes(randomBytes);
                return randomBytes.Single();
            }
        }

        public static HashAndSalt CreatePasswordHashAndSalt(string password, byte[] salt = null)
        {
            HashAlgorithm algorithm = new SHA256Managed();
            byte[] plainText = System.Text.Encoding.UTF8.GetBytes(password);
            if(salt == null)
                salt = 
                    Enumerable
                        .Repeat(0, 10)
                        .Select(r => RandomByte())
                        .ToArray();

            byte[] plainTextWithSaltBytes = new byte[plainText.Length + salt.Length];

            for (int i = 0; i < plainText.Length; i++)
            {
                plainTextWithSaltBytes[i] = plainText[i];
            }
            for (int i = 0; i < salt.Length; i++)
            {
                plainTextWithSaltBytes[plainText.Length + i] = salt[i];
            }

            return new HashAndSalt
            {
                hash = algorithm.ComputeHash(plainTextWithSaltBytes),
                salt = salt,
            };
        }

        public static bool CheckPassword(string password, HashAndSalt reference)
        {
            var attemptHash = CreatePasswordHashAndSalt(password, reference.salt);
            return reference.hash.Length == attemptHash.hash.Length && !reference.hash.Where((t, i) => t != attemptHash.hash[i]).Any();
        }

        public class HashAndSalt
        {
            public byte[] hash { get; set; }
            public byte[] salt { get; set; }
        }

        /// <summary>
        /// Encrypt a byte array using AES 128
        /// </summary>
        /// <param name="bytesToCrypt">byte array that need to be encrypted</param>
        /// <param name="key">128 bit key</param>
        /// <returns>Encrypted array</returns>
        public static byte[] AESCBCEncryptByteArray(byte[] bytesToCrypt, byte[] key)
        {
            using (MemoryStream ms = new MemoryStream())
            {
                using (AesManaged cryptor = new AesManaged())
                {
                    cryptor.Mode = CipherMode.CBC;
                    cryptor.Padding = PaddingMode.PKCS7;
                    cryptor.KeySize = 128;
                    cryptor.BlockSize = 128;

                    //We use the random generated iv created by AesManaged
                    byte[] iv = cryptor.IV;

                    using (CryptoStream cs = new CryptoStream(ms, cryptor.CreateEncryptor(key, iv), CryptoStreamMode.Write))
                    {
                        cs.Write(bytesToCrypt, 0, bytesToCrypt.Length);
                    }
                    byte[] encryptedContent = ms.ToArray();

                    //Create new byte array that should contain both unencrypted iv and encrypted data
                    byte[] result = new byte[iv.Length + encryptedContent.Length];

                    //copy our 2 array into one
                    System.Buffer.BlockCopy(iv, 0, result, 0, iv.Length);
                    System.Buffer.BlockCopy(encryptedContent, 0, result, iv.Length, encryptedContent.Length);

                    return result;
                }
            }
        }

        /// <summary>
        /// Decrypt a byte array using AES 128
        /// https://stackoverflow.com/questions/29701401/encrypt-string-with-bouncy-castle-aes-cbc-pkcs7
        /// </summary>
        /// <param name="key">key in bytes</param>
        /// <param name="bytesToDecrypt">the encrypted bytes</param>
        /// <returns>decrypted bytes</returns>
        public static byte[] AESCBCDecryptByteArray(byte[] bytesToDecrypt, byte[] key)
        {
            byte[] iv = new byte[16]; //initial vector is 16 bytes
            byte[] encryptedContent = new byte[bytesToDecrypt.Length - 16]; //the rest should be encryptedcontent

            //Copy data to byte array
            System.Buffer.BlockCopy(bytesToDecrypt, 0, iv, 0, iv.Length);
            System.Buffer.BlockCopy(bytesToDecrypt, iv.Length, encryptedContent, 0, encryptedContent.Length);

            using (MemoryStream ms = new MemoryStream())
            {
                using (AesManaged cryptor = new AesManaged())
                {
                    cryptor.Mode = CipherMode.CBC;
                    cryptor.Padding = PaddingMode.PKCS7;
                    cryptor.KeySize = 128;
                    cryptor.BlockSize = 128;

                    using (CryptoStream cs = new CryptoStream(ms, cryptor.CreateDecryptor(key, iv), CryptoStreamMode.Write))
                    {
                        cs.Write(encryptedContent, 0, encryptedContent.Length);

                    }
                    return ms.ToArray();
                }
            }
        }
    }
}