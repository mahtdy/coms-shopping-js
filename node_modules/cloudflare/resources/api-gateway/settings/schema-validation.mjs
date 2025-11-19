// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from "../../../resource.mjs";
export class SchemaValidation extends APIResource {
    /**
     * Updates zone level schema validation settings on the zone
     *
     * @example
     * ```ts
     * const settings =
     *   await client.apiGateway.settings.schemaValidation.update({
     *     zone_id: '023e105f4ecef8ad9ca31a8372d0c353',
     *     validation_default_mitigation_action: 'block',
     *   });
     * ```
     */
    update(params, options) {
        const { zone_id, ...body } = params;
        return this._client.put(`/zones/${zone_id}/api_gateway/settings/schema_validation`, { body, ...options });
    }
    /**
     * Updates zone level schema validation settings on the zone
     *
     * @example
     * ```ts
     * const settings =
     *   await client.apiGateway.settings.schemaValidation.edit({
     *     zone_id: '023e105f4ecef8ad9ca31a8372d0c353',
     *   });
     * ```
     */
    edit(params, options) {
        const { zone_id, ...body } = params;
        return this._client.patch(`/zones/${zone_id}/api_gateway/settings/schema_validation`, {
            body,
            ...options,
        });
    }
    /**
     * Retrieves zone level schema validation settings currently set on the zone
     *
     * @example
     * ```ts
     * const settings =
     *   await client.apiGateway.settings.schemaValidation.get({
     *     zone_id: '023e105f4ecef8ad9ca31a8372d0c353',
     *   });
     * ```
     */
    get(params, options) {
        const { zone_id } = params;
        return this._client.get(`/zones/${zone_id}/api_gateway/settings/schema_validation`, options);
    }
}
//# sourceMappingURL=schema-validation.mjs.map