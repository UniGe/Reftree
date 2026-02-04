// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
// ----------------------------------------------------------------------------

namespace AppOwnsData.Services
{
    using Microsoft.Identity.Client;
    using System;
    using System.Configuration;
    using System.Linq;
    using System.Security;
    using System.Threading.Tasks;

    public class AadService
    {
        //TODO @IDEARE read this from database !!!
        private  string m_authorityUrl = "https://login.microsoftonline.com/organizations/";//ConfigurationManager.AppSettings["authorityUrl"];
     //   private  string m_tenant = "761de76f-3d5c-4174-917c-5ad4d06360cb"; //ConfigurationManager.AppSettings["tenant"];
        private  string[] m_scope = "https://analysis.windows.net/powerbi/api/.default".Split(';');//ConfigurationManager.AppSettings["scopeBase"].Split(';');
        public string powerBiURL { get; set; }
        private ConfigValidatorService m_validatorService;
        public AadService(ConfigValidatorService configValidatorService) { 
            this.m_validatorService = configValidatorService;
            this.powerBiURL = m_validatorService.PowerBiUrl;
        }
        /// <summary>
        /// Get Access token
        /// </summary>
        /// <returns>Access token</returns>
        public  async Task<string> GetAccessToken()
        {
            AuthenticationResult authenticationResult = null;
            if (m_validatorService.AuthenticationType.Equals("masteruser", StringComparison.InvariantCultureIgnoreCase))
            {
                IPublicClientApplication clientApp = PublicClientApplicationBuilder
                                                                    .Create(m_validatorService.ApplicationId)
                                                                    .WithAuthority(m_authorityUrl)
                                                                    .Build();
                var userAccounts = await clientApp.GetAccountsAsync();

                try
                {
                    authenticationResult = await clientApp.AcquireTokenSilent(m_scope, userAccounts.FirstOrDefault()).ExecuteAsync();
                }
                catch (MsalUiRequiredException)
                {
                    SecureString secureStringPassword = new SecureString();
                    foreach (var key in m_validatorService.Password)
                    {
                        secureStringPassword.AppendChar(key);
                    }
                    authenticationResult = await clientApp.AcquireTokenByUsernamePassword(m_scope, m_validatorService.Username, secureStringPassword).ExecuteAsync();
                }
            }

            // Service Principal auth is recommended by Microsoft to achieve App Owns Data Power BI embedding
            else if (m_validatorService.AuthenticationType.Equals("serviceprincipal", StringComparison.InvariantCultureIgnoreCase))
            {
                // For app only authentication, we need the specific tenant id in the authority url
                var tenantSpecificURL = m_authorityUrl.Replace("organizations", m_validatorService.Tenant);

                IConfidentialClientApplication clientApp = ConfidentialClientApplicationBuilder
                                                                                .Create(m_validatorService.ApplicationId)
                                                                                .WithClientSecret(m_validatorService.ApplicationSecret)
                                                                                .WithAuthority(tenantSpecificURL)
                                                                                .Build();

                authenticationResult = await clientApp.AcquireTokenForClient(m_scope).ExecuteAsync();
            }

            return authenticationResult.AccessToken;
        }
    }
}
