using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using OAuth2;
using OAuth2.Client;
using OAuth2.Configuration;
using OAuth2.Infrastructure;

namespace MagicFramework.Helpers
{
    public class MagicAuthorizationRoot : AuthorizationRoot
    {
        private readonly IRequestFactory _requestFactory;
        private readonly MagicOAuth2ConfigurationSection _configurationSection;

        public MagicAuthorizationRoot(MFConfiguration.ApplicationInstanceConfiguration selectedconfig, string baseUrl)
        {
            _requestFactory = new RequestFactory();
            _configurationSection = new MagicOAuth2ConfigurationSection(selectedconfig, baseUrl);
        }

        public override IEnumerable<IClient> Clients
        {
            get
            {
                var types = this.GetClientTypes().ToList();
                Func<IClientConfiguration, Type> getType =
                    configuration => types.FirstOrDefault(x => x.Name == configuration.ClientTypeName);

                return
                    _configurationSection.services
                                        .Where(configuration => configuration.Value.IsEnabled)
                                        .Select(configuration => new { configuration.Value, type = getType(configuration.Value)})
                                        .Where(o => o.type != null)
                                        .Select(o => (IClient)Activator.CreateInstance(o.type, _requestFactory, o.Value));
            }
        }

        protected override IEnumerable<Type> GetClientTypes()
        {
            List<Type> clients = AppDomain.CurrentDomain.GetAssemblies().Where(s => s.FullName.Contains("OAuth2")).SelectMany(s => s.GetTypes()).Where(p => typeof(IClient).IsAssignableFrom(p)).ToList();
            clients.Add(typeof (MagicTwitterClient));
            return clients;
        }
    }

    public class MagicOAuth2ConfigurationSection : IOAuth2Configuration
    {
        public Dictionary<string, IClientConfiguration> services = new Dictionary<string, IClientConfiguration>();
        public MagicOAuth2ConfigurationSection(MFConfiguration.ApplicationInstanceConfiguration selectedconfig, string baseUrl)
        {
            foreach (MagicFramework.Helpers.MFConfiguration.OAuth2Client client in selectedconfig.OAuth2Clients)
            {
                services.Add(client.clientType, new OAuthClientConfig
                {
                    ClientTypeName = client.clientType,
                    IsEnabled = client.enabled,
                    ClientId = client.clientId,
                    ClientSecret = client.clientSecret,
                    ClientPublic = client.ClientPublic,
                    Scope = client.scope,
                    RedirectUri = baseUrl + "/auth.aspx"
                });
            }
        }

        /// <summary>
        /// Returns settings for service client with given name.
        /// </summary>
        public new IClientConfiguration this[string clientTypeName]
        {
            get { return this.services[clientTypeName]; }
        }
    }

    public class OAuthClientConfig : IClientConfiguration
    {

        public string ClientTypeName { get; set; }

        public bool IsEnabled { get; set; }

        public string ClientId { get; set; }

        public string ClientSecret { get; set; }

        public string ClientPublic { get; set; }

        public string Scope { get; set; }

        public string RedirectUri { get; set; }
    }

    public class MagicTwitterClient : OAuth2.Client.Impl.TwitterClient
    {
        public MagicTwitterClient(IRequestFactory factory, IClientConfiguration configuration)
            : base(factory, configuration)
        {
        }

        protected override void BeforeGetUserInfo(BeforeAfterRequestArgs args)
        {
            args.Request.AddParameter("include_email", "true");
        }

        protected override OAuth2.Models.UserInfo ParseUserInfo(string content)
        {
            Newtonsoft.Json.Linq.JObject response = Newtonsoft.Json.Linq.JObject.Parse(content);

            string name = response["name"].ToString();
            var index = name.IndexOf(' ');

            string firstName;
            string lastName;
            if (index == -1)
            {
                firstName = name;
                lastName = null;
            }
            else
            {
                firstName = name.Substring(0, index);
                lastName = name.Substring(index + 1);
            }
            var avatarUri = response["profile_image_url"].ToString();
            return new OAuth2.Models.UserInfo
            {
                Id = response["id"].ToString(),
                Email = response["email"].ToString(),
                FirstName = firstName,
                LastName = lastName,
                AvatarUri =
                {
                    Small = avatarUri.Replace("normal", "mini"),
                    Normal = avatarUri,
                    Large = avatarUri.Replace("normal", "bigger")
                }
            };
        }
    }
}
