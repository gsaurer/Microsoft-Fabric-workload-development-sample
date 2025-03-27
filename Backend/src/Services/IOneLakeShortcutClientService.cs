// <copyright company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Boilerplate.Services
{

    public enum ShortcutConflictPolicy
    {
        Abort,
        GenerateUniqueName
    }

    /// <summary>
    /// Represents a service for interacting with OneLake Shortcut .
    /// </summary>
    public interface IOneLakeShortcutClientService
    {
       

        Task<Shortcut> CreateShortcut(string token, Guid workspaceId, Guid itemId, ShortcutConflictPolicy shortcutConflictPolicy, ShortcutCreateRequest createShortcutRequest);

        Task<Shortcut> GetShortcut(string token, Guid workspaceId, Guid itemId, string shortcutPath, string shortcutName);

        Task<List<Shortcut>> ListShortcuts(string token, Guid workspaceId, Guid itemId, string parentPath = null, string continuationToken = null);

        Task<bool> DeleteShortcut(string token, Guid workspaceId, Guid itemId, string shortcutPath, string shortcutName);


    }
}