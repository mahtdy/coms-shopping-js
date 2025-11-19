// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from "../../../resource.mjs";
export class SchemaValidation extends APIResource {
    /**
     * Updates operation-level schema validation settings on the zone
     *
     * @example
     * ```ts
     * const schemaValidation =
     *   await client.apiGateway.operations.schemaValidation.update(
     *     'f174e90a-fafe-4643-bbbc-4a0ed4fc8415',
     *     { zone_id: '023e105f4ecef8ad9ca31a8372d0c353' },
     *   );
     * ```
     */
    update(operationId, params, options) {
        const { zone_id, ...body } = params;
        return this._client.put(`/zones/${zone_id}/api_gateway/operations/${operationId}/schema_validation`, {
            body,
            ...options,
        });
    }
    /**
     * Updates multiple operation-level schema validation settings on the zone
     *
     * @example
     * ```ts
     * const settingsMultipleRequest =
     *   await client.apiGateway.operations.schemaValidation.edit({
     *     zone_id: '023e105f4ecef8ad9ca31a8372d0c353',
     *     settings_multiple_request: {
     *       '3818d821-5901-4147-a474-f5f5aec1d54e': {},
     *       'b17c8043-99a0-4202-b7d9-8f7cdbee02cd': {},
     *     },
     *   });
     * ```
     */
    edit(params, options) {
        const { zone_id, settings_multiple_request } = params;
        return this._client.patch(`/zones/${zone_id}/api_gateway/operations/schema_validation`, {
            body: settings_multiple_request,
            ...options,
        })._thenUnwrap((obj) => obj.result);
    }
    /**
     * Retrieves operation-level schema validation settings on the zone
     *
     * @example
     * ```ts
     * const schemaValidation =
     *   await client.apiGateway.operations.schemaValidation.get(
     *     'f174e90a-fafe-4643-bbbc-4a0ed4fc8415',
     *     { zone_id: '023e105f4ecef8ad9ca31a8372d0c353' },
     *   );
     * ```
     */
    get(operationId, params, options) {
        const { zone_id } = params;
        return this._client.get(`/zones/${zone_id}/api_gateway/operations/${operationId}/schema_validation`, options);
    }
}
//# sourceMappingURL=schema-validation.mjs.map