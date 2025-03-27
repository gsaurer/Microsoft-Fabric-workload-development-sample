using Boilerplate.Constants;
using Fabric_Extension_BE_Boilerplate.Contracts.OneLakeAPI;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;

namespace Boilerplate.Services
{
    public class OneLakeShortcutClientService : IOneLakeShortcutClientService
    {
        private readonly ILogger<OneLakeShortcutClientService> _logger;
        private readonly IConfiguration _configuration;
        private readonly IHttpClientService _httpClientService;
        private readonly HttpClient _httpClient;

        public OneLakeShortcutClientService(
            IConfigurationService configuration,
            IHttpClientService httpClientService,
            ILogger<OneLakeShortcutClientService> logger)
        {
            _logger = logger;
            _configuration = configuration.GetConfiguration();
            _httpClientService = httpClientService;
        }

        public async Task<Shortcut> CreateShortcut(string token, Guid workspaceId, Guid itemId, ShortcutConflictPolicy shortcutConflictPolicy, ShortcutCreateRequest createShortcutRequest)
        {
            var body = JsonConvert.SerializeObject(createShortcutRequest);
            var content = new StringContent(body, Encoding.UTF8, "application/json");

            var response = await _httpClientService.PostAsync($"{EnvironmentConstants.FabricApiBaseUrl}/v1/workspaces/{workspaceId}/items/{itemId}/shortcuts?shortcutConflictPolicy={shortcutConflictPolicy}", 
                content, token);
            //var response = await _httpClient.PostAsJsonAsync($"/v1/workspaces/{workspaceId}/items/{itemId}/shortcuts?shortcutConflictPolicy={shortcutConflictPolicy}", 
            //   createShortcutRequest);
            response.EnsureSuccessStatusCode();
            var responseContent = await response.Content.ReadAsStringAsync();
            var retVal = JsonConvert.DeserializeObject<Shortcut>(responseContent);
            return retVal;
        }

        public async Task<Shortcut> GetShortcut(string token, Guid workspaceId, Guid itemId, string shortcutPath, string shortcutName)
        {

            var url = $"{EnvironmentConstants.FabricApiBaseUrl}/v1/workspaces/{workspaceId}/items/{itemId}/shortcuts/{shortcutPath}/{shortcutName}";
            var response = await _httpClientService.GetAsync(url, token);
            response.EnsureSuccessStatusCode();
            var content = await response.Content.ReadAsStringAsync();
            var retVal = JsonConvert.DeserializeObject<Shortcut>(content);
            return retVal;
        }

        public async Task<List<Shortcut>> ListShortcuts(string token, Guid workspaceId, Guid itemId, string parentPath = null, string continuationToken = null)
        {
            var uri = $"/workspaces/{workspaceId}/items/{itemId}/shortcuts";
            if (!string.IsNullOrEmpty(parentPath))
            {
                uri += $"?parentPath={parentPath}";
            }
            if (!string.IsNullOrEmpty(continuationToken))
            {
                uri += (string.IsNullOrEmpty(parentPath) ? "?" : "&") + $"continuationToken={continuationToken}";
            }

            var response = await _httpClient.GetAsync(uri);
            response.EnsureSuccessStatusCode();
            var content = await response.Content.ReadAsStringAsync();
            var retVal = JsonConvert.DeserializeObject<List<Shortcut>>(content);
            return retVal;
        }

        public async Task<bool> DeleteShortcut(string token, Guid workspaceId, Guid itemId, string shortcutPath, string shortcutName)
        {
            var response = await _httpClient.DeleteAsync($"/workspaces/{workspaceId}/items/{itemId}/shortcuts/{shortcutPath}/{shortcutName}");
            response.EnsureSuccessStatusCode();
            return true;
        }
    }
}