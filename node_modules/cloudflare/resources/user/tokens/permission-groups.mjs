// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from "../../../resource.mjs";
import { SinglePage } from "../../../pagination.mjs";
export class PermissionGroups extends APIResource {
    /**
     * Find all available permission groups for API Tokens
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const permissionGroupListResponse of client.user.tokens.permissionGroups.list()) {
     *   // ...
     * }
     * ```
     */
    list(options) {
        return this._client.getAPIList('/user/tokens/permission_groups', PermissionGroupListResponsesSinglePage, options);
    }
}
export class PermissionGroupListResponsesSinglePage extends SinglePage {
}
PermissionGroups.PermissionGroupListResponsesSinglePage = PermissionGroupListResponsesSinglePage;
//# sourceMappingURL=permission-groups.mjs.map