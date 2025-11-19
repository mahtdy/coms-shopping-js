// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from "../../../resource.mjs";
import { V4PagePaginationArray } from "../../../pagination.mjs";
export class Operations extends APIResource {
    /**
     * Retrieves all operations from the schema. Operations that already exist in API
     * Shield Endpoint Management will be returned as full operations.
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const operationListResponse of client.apiGateway.userSchemas.operations.list(
     *   'f174e90a-fafe-4643-bbbc-4a0ed4fc8415',
     *   { zone_id: '023e105f4ecef8ad9ca31a8372d0c353' },
     * )) {
     *   // ...
     * }
     * ```
     */
    list(schemaId, params, options) {
        const { zone_id, ...query } = params;
        return this._client.getAPIList(`/zones/${zone_id}/api_gateway/user_schemas/${schemaId}/operations`, OperationListResponsesV4PagePaginationArray, { query, ...options });
    }
}
export class OperationListResponsesV4PagePaginationArray extends V4PagePaginationArray {
}
Operations.OperationListResponsesV4PagePaginationArray = OperationListResponsesV4PagePaginationArray;
//# sourceMappingURL=operations.mjs.map