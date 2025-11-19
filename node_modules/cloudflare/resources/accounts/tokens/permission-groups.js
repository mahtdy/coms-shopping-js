"use strict";
// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionGroupGetResponsesSinglePage = exports.PermissionGroupListResponsesSinglePage = exports.PermissionGroups = void 0;
const resource_1 = require("../../../resource.js");
const pagination_1 = require("../../../pagination.js");
class PermissionGroups extends resource_1.APIResource {
    /**
     * Find all available permission groups for Account Owned API Tokens
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const permissionGroupListResponse of client.accounts.tokens.permissionGroups.list(
     *   { account_id: '023e105f4ecef8ad9ca31a8372d0c353' },
     * )) {
     *   // ...
     * }
     * ```
     */
    list(params, options) {
        const { account_id } = params;
        return this._client.getAPIList(`/accounts/${account_id}/tokens/permission_groups`, PermissionGroupListResponsesSinglePage, options);
    }
    /**
     * Find all available permission groups for Account Owned API Tokens
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const permissionGroupGetResponse of client.accounts.tokens.permissionGroups.get(
     *   { account_id: '023e105f4ecef8ad9ca31a8372d0c353' },
     * )) {
     *   // ...
     * }
     * ```
     */
    get(params, options) {
        const { account_id } = params;
        return this._client.getAPIList(`/accounts/${account_id}/tokens/permission_groups`, PermissionGroupGetResponsesSinglePage, options);
    }
}
exports.PermissionGroups = PermissionGroups;
class PermissionGroupListResponsesSinglePage extends pagination_1.SinglePage {
}
exports.PermissionGroupListResponsesSinglePage = PermissionGroupListResponsesSinglePage;
class PermissionGroupGetResponsesSinglePage extends pagination_1.SinglePage {
}
exports.PermissionGroupGetResponsesSinglePage = PermissionGroupGetResponsesSinglePage;
PermissionGroups.PermissionGroupListResponsesSinglePage = PermissionGroupListResponsesSinglePage;
PermissionGroups.PermissionGroupGetResponsesSinglePage = PermissionGroupGetResponsesSinglePage;
//# sourceMappingURL=permission-groups.js.map