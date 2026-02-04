using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Configuration;
using System.Security.Cryptography;
using System.IO;
using System.Data;
using System.Data.SqlClient;

namespace MigrateBizSharpUsersPwds
{
    class Program
    {

        private static byte[] rgb_KEY_192 = new Byte[]{42, 16, 93, 156, 78, 4, 218, 32,
            15, 167, 44, 80, 26, 250, 155, 112,
            2, 94, 11, 204, 119, 35, 184, 197};
        private static byte[] rgb_IV_192 = new Byte[] {55, 103, 246, 79, 36, 99, 167, 3, 
            42, 5, 62, 83, 184, 7, 209, 13, 
            145, 23, 200, 58, 173, 10, 121, 222};

        private static string valk = "C50B3C89CB21F4F1422FF158A5B42D0E8DB8CB5CDA1742572A487D9401E3400267682B202B746511891C1BAF47F8D25C07F6C39A104696DB51F17C529AD3CABE";

        //'TRIPLE DES decryption
        private static string DecryptTripleDES(string value, byte[] rgbKEY, byte[] rgbIV)
        {
            string ret = string.Empty;
            if (!string.IsNullOrEmpty(value))
            {
                TripleDESCryptoServiceProvider cryptoProvider = new TripleDESCryptoServiceProvider();

                //'convert from string to byte array
                Byte[] buffer = Convert.FromBase64String(value);
                MemoryStream ms = new MemoryStream(buffer);
                CryptoStream cs = new CryptoStream(ms, cryptoProvider.CreateDecryptor(rgbKEY, rgbIV),
                        CryptoStreamMode.Read);
                StreamReader sr = new StreamReader(cs);

                ret = sr.ReadToEnd();
            }
            return ret;

        }

        private static byte[] HexToByte(string hexString)
        {
            byte[] returnBytes = new byte[hexString.Length / 2];
            for (int i = 0; i < returnBytes.Length; i++)
            {
                returnBytes[i] = Convert.ToByte(hexString.Substring(i * 2, 2), 16);
            }
            return returnBytes;
        }
        public static DataSet GetDataSet(string sqlCommand, string connectionString)
        {

            DataSet ds = new DataSet();
      
                using (SqlCommand cmd = new SqlCommand(
                    sqlCommand, new SqlConnection(connectionString)))
                {
                    cmd.Connection.Open();
                    DataTable table = new DataTable();
                    table.Load(cmd.ExecuteReader());
                    ds.Tables.Add(table);
                    cmd.Connection.Close();
                }
   

            

            return ds;
        }

        public static void runSP(string stored, string connectionString)
        {
            using (SqlCommand cmd = new SqlCommand(
                       stored, new SqlConnection(connectionString)))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Connection.Open();
                cmd.ExecuteNonQuery();
                cmd.Connection.Close();
            }
            
        }

        public static void updateUser(string connectionString,string username,string encoded)
        {
            using (SqlCommand cmd = new SqlCommand(
                "UPDATE dbo.Magic_mmb_users set Password='" + encoded+"' where Username='"+username+"'", new SqlConnection(connectionString)))
            {
                cmd.Connection.Open();
                cmd.ExecuteNonQuery();
                cmd.Connection.Close();
            }
        
        }
        static void Main(string[] args)
        {
            if (args.Length > 0)
            {
                if (args[0].ToUpper() == "BIZ")
                {
                    UpdateBizSharpUser();                    
                    return;
                }                    
            }
            // ** aggiornamento utenti Ref (migrati con script manuale)**
            UpdateRefUser();
        }

        static void UpdateBizSharpUser()
        {
            // ** aggioramento utenti CSU
            //get degli utenti Biz# 
            //allineamento degli utenti 
            // DB 19/10/2015 disabilito perchè modificata per prime e lanciata a mano
            //runSP("dbo.MIGRA_UTENTI_RIS_MF", ConfigurationManager.ConnectionStrings["bizdb"].ToString());

            //get degli utenti
            var bizUsersds = GetDataSet(ConfigurationManager.AppSettings["usersQuery"].ToString(), ConfigurationManager.ConnectionStrings["bizdb"].ToString());
            //cambio delle password
            foreach (DataRow row in bizUsersds.Tables[0].Rows)
            {
                if (row["UTENTI_PASS"] != null)
                {

                    string clearpwd = row["UTENTI_PASS"].ToString();
                    try
                    {
                        clearpwd = DecryptTripleDES(row["UTENTI_PASS"].ToString(), rgb_KEY_192, rgb_IV_192);
                    }
                    catch
                    {
                        Console.WriteLine("Password for user " + row["UTENTI_USER"].ToString() + " is clear!!!");
                    }
                    HMACSHA1 hash = new HMACSHA1 { Key = HexToByte(valk) };
                    string encodedPassword = Convert.ToBase64String(hash.ComputeHash(Encoding.Unicode.GetBytes(clearpwd)));
                    updateUser(ConfigurationManager.ConnectionStrings["magicdb"].ToString(), row["UTENTI_USER"].ToString(), encodedPassword);
                }
            }
        }

        static void UpdateRefUser()
        {

            //get degli utenti
            var bizUsersds = GetDataSet(ConfigurationManager.AppSettings["RefUsersQuery"].ToString(), ConfigurationManager.ConnectionStrings["Ref"].ToString());
            //cambio delle password
            foreach (DataRow row in bizUsersds.Tables[0].Rows)
            {              
                HMACSHA1 hash = new HMACSHA1 { Key = HexToByte(valk) };
                string encodedPassword = Convert.ToBase64String(hash.ComputeHash(Encoding.Unicode.GetBytes(row["Password"].ToString())));
                updateUser(ConfigurationManager.ConnectionStrings["Ref"].ToString(), row["Username"].ToString(), encodedPassword);             
            }
           
        }
    }
}
