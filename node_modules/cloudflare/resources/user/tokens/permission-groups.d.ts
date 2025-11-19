import { APIResource } from "../../../resource.js";
import * as Core from "../../../core.js";
import { SinglePage } from "../../../pagination.js";
export declare class PermissionGroups extends APIResource {
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
    list(options?: Core.RequestOptions): Core.PagePromise<PermissionGroupListResponsesSinglePage, PermissionGroupListResponse>;
}
export declare class PermissionGroupListResponsesSinglePage extends SinglePage<PermissionGroupListResponse> {
}
export interface PermissionGroupListResponse {
    /**
     * Public ID.
     */
    id?: string;
    /**
     * Permission Group Name
     */
    name?: string;
    /**
     * Resources to which the Permission Group is scoped
     */
    scopes?: Array<'com.cloudflare.api.account' | 'com.cloudflare.api.account.zone' | 'com.cloudflare.api.user' | 'com.cloudflare.edge.r2.bucket'>;
}
export declare namespace PermissionGroups {
    export { type PermissionGroupListResponse as PermissionGroupListResponse, PermissionGroupListResponsesSinglePage as PermissionGroupListResponsesSinglePage, };
}
//# sourceMappingURL=permission-groups.d.ts.map