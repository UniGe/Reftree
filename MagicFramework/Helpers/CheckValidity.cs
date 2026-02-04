using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web;

namespace MagicFramework.Helpers
{

    public class CodiceFiscale
    {
        private const string VOCALI = "AEIOU";
        /// <summary>
        /// toglie dalla stringa eventuali caratteri non letterali
        /// e la separa in vocali e consonanti (tutto maiuscolo) 
        /// </summary>
        /// <param name="input">stringa da elaborare
        /// <param name="consonanti">consonanti in ordine
        /// <param name="vocali">vocali in ordine
        private void isolaLettere(string input, out string consonanti, out string vocali)
        {
            vocali = "";
            consonanti = "";

            for (int i = 0; i < input.Length; i++)
            {
                if (char.IsLetter(Convert.ToChar(input.Substring(i, 1))))
                {
                    if (VOCALI.Contains(input.Substring(i, 1).ToUpper()))
                    {
                        vocali = vocali + input.Substring(i, 1).ToUpper();
                    }
                    else
                    {
                        consonanti = consonanti + input.Substring(i, 1).ToUpper();
                    }
                }
            }

        }

        /// <summary>
        /// Date le 2 stringhe consonanti e vocali restituisce 
        /// il codice fiscale del cognome
        /// </summary>
        /// <param name="consonanti">consonanti in ordine
        /// <param name="vocali">vocali in ordine
        /// <returns>lettere del codice fiscale relative al cognome</returns>
        private string trovaCodCognome(string consonanti, string vocali)
        {
            if (consonanti.Length + vocali.Length == 2)
            {
                string Cognome3 = (consonanti + vocali + "X").ToUpper();
                return Cognome3;
            }

            if (consonanti.Length + vocali.Length == 3)
            {
                string Cognome4 = (consonanti + vocali).ToUpper();
                return Cognome4;
            }


            if (consonanti.Length > 3)
            {
                string nome = (consonanti.Substring(0, 3)).ToUpper();
                return nome;
            }

            if (consonanti.Length == 3)
            {
                string nome2 = consonanti.ToUpper();
                return nome2;
            }

            if (consonanti.Length <= 3)
            {
                string nome2 = (consonanti + vocali.Substring(0, 1)).ToUpper();
                return nome2;
            }
            return vocali;
        }

        /// <summary>
        /// Date le 2 stringhe consonanti e vocali restituisce 
        /// il codice fiscale del nome
        /// </summary>
        /// <param name="consonanti">consonanti in orine
        /// <param name="vocali">vocali in ordine
        /// <returns>lettere del codice fiscale relative al nome</returns>
        private string trovaCodNome(string consonanti, string vocali)
        {
            if (consonanti.Length + vocali.Length == 2)
            {
                string Cognome3 = (consonanti + vocali + "X").ToUpper();
                return Cognome3;
            }

            if (consonanti.Length + vocali.Length == 3)
            {
                string Cognome4 = (consonanti + vocali).ToUpper();
                return Cognome4;
            }


            if (consonanti.Length > 3)
            {
                string nome = (consonanti.Substring(0, 1) + consonanti.Substring(2, 2)).ToUpper();
                return nome;
            }

            if (consonanti.Length < 3)
            {
                string nome2 = (consonanti + vocali.Substring(0, 1)).ToUpper();
                return nome2;
            }

            if (consonanti.Length == 3)
            {
                string nome2 = consonanti.ToUpper();
                return nome2;
            }
            return "NESSUN VALORE";
        }

        private string trovaDataSesso(DateTime data_di_nascita, string sesso)
        {

            string result= data_di_nascita.Year.ToString().Substring(2, 2);
            string s_tmp = "ABCDEHLMPRST";
            result += s_tmp[data_di_nascita.Month - 1];
            if (sesso == "M")
                result += data_di_nascita.Day.ToString("00");
            else
            {
                int giorno = data_di_nascita.Day + 40;
                result += giorno.ToString("00");
            }
            return result;

        }

        private char TrovaCodFinale(string CodFisc)
        {
            int[] arrayDispari = { 1, 0, 5, 7, 9, 13, 15, 17, 19, 21, 2, 4, 18, 20, 11, 3, 6, 8, 12, 14, 16, 10, 22, 25, 24, 23 };
            int totale = 0;
            byte[] arrayCodice = new byte[15];


            arrayCodice = Encoding.ASCII.GetBytes(CodFisc.ToUpper());

            for (int i = 0; i < CodFisc.Length; i++)
            {
                if ((i + 1) % 2 == 0)
                {
                    if (char.IsLetter(CodFisc, i))
                        totale += arrayCodice[i] - (byte)'A';
                    else
                        totale += arrayCodice[i] - (byte)'0';
                }
                else
                {
                    if (char.IsLetter(CodFisc, i))
                        totale += arrayDispari[(arrayCodice[i] - (byte)'A')];
                    else
                        totale += arrayDispari[(arrayCodice[i] - (byte)'0')];
                }
            }

            totale %= 26;

            char lettera = (char)(totale + 'A');

            return lettera;
        }

        public string calcola(string nome, string cognome, string sesso, string comune, DateTime data_di_nascita)
        {
            string StringCognomeCons, StringCognomeVoc;
            string StringNomeCons, StringNomeVoc;

            if (String.IsNullOrEmpty(nome) || String.IsNullOrEmpty(cognome) || String.IsNullOrEmpty(sesso) || String.IsNullOrEmpty(comune) || data_di_nascita == DateTime.MinValue)
                throw new Exception("Impossibile calcolare il codice fiscale: i campi obbligatori non sono compilati");

            isolaLettere(cognome, out StringCognomeCons, out StringCognomeVoc);
            isolaLettere(nome, out StringNomeCons, out StringNomeVoc);

            string CodiceFiscale = trovaCodCognome(StringCognomeCons, StringCognomeVoc) +
                                   trovaCodNome(StringNomeCons, StringNomeVoc) +
                                   trovaDataSesso(data_di_nascita,sesso) + comune;

            return CodiceFiscale + TrovaCodFinale(CodiceFiscale);
        }



    }

    public class BankAccount
    {

        // Source code from https://www.codeproject.com/Tips/775696/IBAN-Validator
        public bool validateIBAN(string bankAccount)
        {
            bankAccount = bankAccount.ToUpper(); //IN ORDER TO COPE WITH THE REGEX BELOW
            if (String.IsNullOrEmpty(bankAccount))
                return false;
            else if (System.Text.RegularExpressions.Regex.IsMatch(bankAccount, "^[A-Z0-9]"))
            {
                bankAccount = bankAccount.Replace(" ", String.Empty);
                string bank =
                bankAccount.Substring(4, bankAccount.Length - 4) + bankAccount.Substring(0, 4);
                int asciiShift = 55;
                StringBuilder sb = new StringBuilder();
                foreach (char c in bank)
                {
                    int v;
                    if (Char.IsLetter(c)) v = c - asciiShift;
                    else v = int.Parse(c.ToString());
                    sb.Append(v);
                }
                string checkSumString = sb.ToString();
                int checksum = int.Parse(checkSumString.Substring(0, 1));
                for (int i = 1; i < checkSumString.Length; i++)
                {
                    int v = int.Parse(checkSumString.Substring(i, 1));
                    checksum *= 10;
                    checksum += v;
                    checksum %= 97;
                }
                return checksum == 1;
            }
            else
                return false;
        }
    }




    public class PartitaIVA
    {

        protected string _defCountry="IT";

        protected string _country;
        protected string _vatcode;

        public enum ResultTypes { piOk=0, piInvalidFormat=-1,piNotCheckableCountry=-2 };

        public string testedValue
        {
            get
            {
                return _country+_vatcode;
            }
            set
            {

                _country = "";
                _vatcode = "";
                String _testedValue = value.ToUpper();

                if (_testedValue.Length>2)
                {
                    if (Char.IsDigit(_testedValue,0) && Char.IsDigit(_testedValue, 1)) {
                        _testedValue = _defCountry + _testedValue;
                    }
                    _country = _testedValue.Substring(0, 2);
                    _vatcode = _testedValue.Substring(2, _testedValue.Length - 2);
                }
                else
                {
                    _vatcode = _testedValue;
                }
            }
        }

        protected ResultTypes checkIT()
        {
            ResultTypes result=ResultTypes.piInvalidFormat;
            String paramPI = _vatcode.Trim();
            try
            {
                if (paramPI.Length == 11)
                {
                    int tot = 0;
                    int dispari = 0;

                    for (int i = 0; i < 10; i += 2)
                        dispari += int.Parse(paramPI.Substring(i, 1));

                    for (int i = 1; i < 10; i += 2)
                    {
                        tot = (int.Parse(paramPI.Substring(i, 1))) * 2;
                        tot = (tot / 10) + (tot % 10);
                        dispari += tot;
                    }

                    int controllo = int.Parse(paramPI.Substring(10, 1));

                    if (((dispari % 10) == 0 && (controllo == 0)) || ((10 - (dispari % 10)) == controllo))
                        result=ResultTypes.piOk;
                }

            }
            catch
            {
                result = ResultTypes.piInvalidFormat;
            }
            return result;
        }

        public ResultTypes check()
        {
            if (_country.Equals(""))
                return ResultTypes.piInvalidFormat;
            else if (_country.Equals("IT"))
                return checkIT();
            else
                return ResultTypes.piNotCheckableCountry;
        }
        
    }
    

    public class CheckValidity
    {
        public bool valid { get; set; }
        public string correctvalue { get; set; }
        public string message { get; set; }
        public string line1 { get; set; }
        public string line2 { get; set; }        
        public DateTime date { get; set; }

        public CheckValidity()
        { 
        
        }

        public void CheckPIVAValidity(string PIVA, string country, bool checkdigitcheck, bool euservicecheck) 
        {
            if (checkdigitcheck)
            {
                PartitaIva_LocalCheck(PIVA);
            }

            if ((this.valid)  && (euservicecheck))
            {                 
                PartitaIVA_EuCheck(country, PIVA);
            }
        }

        /// <summary>
        /// Controllo della sola validità formale della Partita Iva (lunghezza, checkdigit)
        /// </summary>
        /// <returns>
        /// true se la Partita Iva è corretta
        /// </returns>
        private void PartitaIva_LocalCheck(string paramPI)
        {
            paramPI = paramPI.Trim();
            try
            {
                if (paramPI.Length == 11)
                {
                    int tot = 0;
                    int dispari = 0;

                    for (int i = 0; i < 10; i += 2)
                        dispari += int.Parse(paramPI.Substring(i, 1));

                    for (int i = 1; i < 10; i += 2)
                    {
                        tot = (int.Parse(paramPI.Substring(i, 1))) * 2;
                        tot = (tot / 10) + (tot % 10);
                        dispari += tot;
                    }

                    int controllo = int.Parse(paramPI.Substring(10, 1));

                    if (((dispari % 10) == 0 && (controllo == 0)) || ((10 - (dispari % 10)) == controllo))
                    {
                        this.valid = true;
                        this.message = "Il numero di partita IVA è formalmente corretto";
                    }
                    else
                    {
                        this.valid = false;
                        this.message = "Il numero di partita IVA non risulta essere formalmente corretto";
                    }
                }
                else
                {
                    this.valid = false;
                    this.message = "Il numero di partita IVA non risulta essere formalmente corretto";
                }
            }
            catch (Exception e)
            {
                Console.Write(e.InnerException);
                this.message = e.Message;
                this.valid = false;
            }
        }

        /// <summary>
        /// Controllo validità da Web Service Eu
        /// </summary>
        /// <returns>
        /// true se la Partita Iva è corretta
        /// </returns>
        private void PartitaIVA_EuCheck(string countryCode, string vatNumber)
        {
            try
            {
                eu.europa.ec.checkVatService cs = new eu.europa.ec.checkVatService();
                bool valid;
                string name;
                string address;
                DateTime dt = cs.checkVat(ref countryCode, ref vatNumber, out valid, out name, out address);
                this.valid = valid;
                this.date = dt;
                this.line1 = name;
                this.line2 = address;

                if (valid)
                {
                    
                    string r = " e risulta esssere la società {0} ubicata in {1}";
                    r = string.Format(r, name, address);
                    this.message += r;
                }
                else 
                {
                    this.message = ". Non è stato possibile verificare l'esistenza della società nell'anagrafica dell'Unione Europea";
                }
            }
            catch (Exception ex)
            {

            }

        }
        
        /// <summary>
        /// Controllo codice fiscale con algoritmo locale (no web service)
        /// </summary>
        /// <returns>
        /// true se il codice fiscale è corretto
        /// </returns>
        private static string CodiceFiscale_LocalCheck(string nome, string cognome, string sesso, string comune, DateTime data_di_nascita)
        {
            nome = nome.ToUpper();
            cognome = cognome.ToUpper();
            nome = nome.Replace(" ", "");
            nome = nome.Replace("'", "");
            cognome = cognome.Replace(" ", "");
            cognome = cognome.Replace("'", "");

            CodiceFiscale cf = new CodiceFiscale();
            return cf.calcola(nome, cognome,sesso, comune,data_di_nascita);

        }

        public void CheckCodFisValidity(bool personafisica, string nome, string cognome, string sesso, DateTime? datanascita, string comunenascita, string statoesteronascita, string codiceattuale)
        {
            this.valid = false;
            if (personafisica)   // || (tipopersona == "I"))  per ditta individuale accettiamo il codice fiscale da 16 senza check in quanto non chiediamo data nascita
            {
                if ((nome == "") || (cognome == ""))
                {
                    this.message = "Nome e cognome obbligatori";
                }

                if (datanascita == null)
                {
                    this.message = "Data di nascita obbligatoria";
                }

                string comune = "";

                if ((comunenascita == null) && (statoesteronascita == null))
                {
                    this.message = "Comune di nascita o stato estero di nascita obbligatorio";
                }
                else if ((comunenascita != null) && (statoesteronascita != null))
                {
                    this.message = "Comune di nascita e stato estero di nascita non compatibili";
                }
                else if (comunenascita != null)
                {
                    comune = comunenascita.ToString();
                }
                else if (statoesteronascita != null)
                {
                    comune = statoesteronascita.ToString();
                }

                if (this.message == null)
                {
                    this.correctvalue = CodiceFiscale_LocalCheck(nome, cognome, sesso, (string)comune, (DateTime)datanascita);
                    if (this.correctvalue != codiceattuale)
                        this.message = string.Format("Attenzione! Il codice fiscale calcolato dal sistema è {0}", this.correctvalue);
                    else
                        this.valid = true;
                }
            }
            else
            {
                if ((codiceattuale == "") || (codiceattuale == null))
                {
                    this.message = "Impossibile calcolare il codice fiscale per le società";
                }
                else if (codiceattuale.ToString().Length == 11)
                {
                    try
                    {
                        this.CheckPIVAValidity(codiceattuale.ToString(), "IT", true, false);
                    }
                    catch (Exception ex)
                    {
                        MagicFramework.Helpers.MFLog.LogInFile(ex.InnerException.InnerException.Message, MFLog.logtypes.ERROR);
                    }

                    if (this.valid)
                    {
                        this.message = "Il codice fiscale è corretto";
                    }
                    else
                    {
                        this.message = "Il codice fiscale non è corretto";
                    }
                }
                else if (codiceattuale.ToString().Length == 16)
                {
                    this.message = "Il codice fiscale è corretto";
                    this.valid = true;
                }
                else
                {
                    this.message = "Il codice fiscale non è corretto";
                }
            }
        }


    }

}