// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from "../../../resource.mjs";
import { SinglePage } from "../../../pagination.mjs";
export class PermissionGroups extends APIResource {
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
export class PermissionGroupListResponsesSinglePage extends SinglePage {
}
export class PermissionGroupGetResponsesSinglePage extends SinglePage {
}
PermissionGroups.PermissionGroupListResponsesSinglePage = PermissionGroupListResponsesSinglePage;
PermissionGroups.PermissionGroupGetResponsesSinglePage = PermissionGroupGetResponsesSinglePage;
//# sourceMappingURL=permission-groups.mjs.map