using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Data;
using MagicFramework.Helpers;
using System.Text.RegularExpressions;

namespace MagicFramework.Controllers
{
   
    public class HelperController : ApiController
    {

        private class ResultInfo
        {
            public int resultCode;
            public string userMessage;
            public string moreInfo;
            public string developerMessage;
            public dynamic messagePayload;

            public ResultInfo()
            {

            }
        }
        private class ResultValidationPayLoad
        {

            public ResultInfo info;
            public bool valid;
            public ResultValidationPayLoad()
            {
                this.info = new ResultInfo();
            }
        } 
        
        private class ResultPayload
        {

            public ResultInfo info;
            public dynamic payload;
            public ResultPayload()
            {
                this.info = new ResultInfo();                
            }

        }   
        [HttpPost]
        public HttpResponseMessage CheckFiscalCode(dynamic data)
        {
            ResultPayload rpl = new ResultPayload();
            try
            {

                CodiceFiscale c = new CodiceFiscale();

                string luogoDiNascita = "";
                string cittaNascita = "";
                string statoNascita = "";

                if (data["POB"] != null)
                {
                    luogoDiNascita = data["POB"];
                }
                else
                {
                    DatabaseCommandUtils dbutils = new DatabaseCommandUtils();
                    DataTable table = null;

                    dynamic spData = new System.Dynamic.ExpandoObject();
                    //if (Utils.IsPropertyExist(data, "cityOfBirthId"))
                    if (data["cityOfBirthId"] != null)
                    {
                        spData.ID = data["cityOfBirthId"];
                        MagicFramework.Helpers.DatabaseCommandUtils.readresult res = dbutils.callStoredProcedurewithXMLInput(MagicFramework.Helpers.Utils.ConvertDynamicToXML(spData), "Custom.GetFiscalCodeForCity");
                        table = res.table;
                        cittaNascita = table.Rows[0]["FiscalCode"].ToString();
                    }
                    if (data["nationOfBirthId"] != null)
                    {
                        spData.ID = data["nationOfBirthId"];
                        MagicFramework.Helpers.DatabaseCommandUtils.readresult res = dbutils.callStoredProcedurewithXMLInput(MagicFramework.Helpers.Utils.ConvertDynamicToXML(spData), "Custom.GetFiscalCodeForNation");
                        table = res.table;
                        statoNascita = table.Rows[0]["FiscalCode"].ToString();
                    }

                    if (statoNascita.Equals("ITA") || String.IsNullOrWhiteSpace(statoNascita))
                        luogoDiNascita = cittaNascita;
                    else
                        luogoDiNascita = statoNascita;

                }

                string nome = data["name"];
                string cognome = data["surname"];
                string sesso = data["gender"];
                DateTime data_di_nascita = (data["DOB"] == null) ? DateTime.MinValue : data["DOB"];
                string fiscalCode = data["fiscalCode"];
                string calcFiscCode = c.calcola(nome, cognome, sesso, luogoDiNascita, data_di_nascita);

                rpl.info.resultCode = 0;
                rpl.payload = new {
                    calculatedFiscalCode = calcFiscCode,
                    valid = String.Equals(calcFiscCode, fiscalCode, StringComparison.OrdinalIgnoreCase)
                };
                return Request.CreateResponse(HttpStatusCode.OK, rpl);
            }
            catch (Exception e)
            {               
                rpl.info.resultCode = -1;
                rpl.info.userMessage = e.Message;
                rpl.info.developerMessage = e.Message;
                return Request.CreateResponse(HttpStatusCode.OK, rpl);
            }
        }

        public HttpResponseMessage CheckVATcode(dynamic data)
        {
            ResultValidationPayLoad rpl = new ResultValidationPayLoad();
            try
            {

                PartitaIVA c = new PartitaIVA();
               
                c.testedValue = data["VATcode"];

                PartitaIVA.ResultTypes result;

                result =c.check();
                rpl.valid = (result==PartitaIVA.ResultTypes.piOk);
                rpl.info.resultCode = (int)result;
                rpl.info.messagePayload = new List<string>(new string[] { c.testedValue });                
                switch (result)
                {
                    case PartitaIVA.ResultTypes.piOk:
                        rpl.info.userMessage = "@VATcodeOk";
                        break;
                    case PartitaIVA.ResultTypes.piInvalidFormat:
                        rpl.info.userMessage = "@VATcodeInvalidFormat";
                        break;

                    case PartitaIVA.ResultTypes.piNotCheckableCountry:
                        rpl.info.userMessage = "@VATcodeNotCheckableCountry";
                        break;
                }
                return Request.CreateResponse(HttpStatusCode.OK, rpl); 
            }
            catch (Exception e)
            {
                ResultValidationPayLoad epl = new ResultValidationPayLoad();
                rpl.valid = false;
                rpl.info.resultCode = -1;
                rpl.info.userMessage = "Errore in fase di validazione Partita IVA";
                rpl.info.developerMessage = e.Message;
                return Request.CreateResponse(HttpStatusCode.OK, rpl);
            }
        }

        public HttpResponseMessage CheckIBAN(dynamic data)
        {
            ResultValidationPayLoad rpl = new ResultValidationPayLoad();
            try
            {                
                BankAccount c = new BankAccount();
                string IBAN = data["IBAN"];
                bool isOk = c.validateIBAN(IBAN);
                rpl.valid = isOk;
                rpl.info.resultCode = (isOk) ? 0 : -1;
                rpl.info.userMessage = (isOk) ? "@IBANisOk" : "@IBANnotValid";           
                return Request.CreateResponse(HttpStatusCode.OK, rpl); 
            }
            catch (Exception e)
            {                
                rpl.valid = false;
                rpl.info.resultCode = -1;
                rpl.info.userMessage = "@IBANnotValid";
                rpl.info.developerMessage = e.Message;        
                return Request.CreateResponse(HttpStatusCode.OK, rpl); 
                //var resp = Request.CreateResponse(HttpStatusCode.InternalServerError, epl);
                //throw new HttpResponseException(resp);                
            }
        }
    }
}
