// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from "../resource.mjs";
export class BrandProtection extends APIResource {
    /**
     * Submit suspicious URL for scanning.
     *
     * @example
     * ```ts
     * const submit = await client.brandProtection.submit({
     *   account_id: '023e105f4ecef8ad9ca31a8372d0c353',
     * });
     * ```
     */
    submit(params, options) {
        const { account_id, ...body } = params;
        return this._client.post(`/accounts/${account_id}/brand-protection/submit`, {
            body,
            ...options,
        })._thenUnwrap((obj) => obj.result);
    }
    /**
     * Gets phishing details about a URL.
     *
     * @example
     * ```ts
     * const info = await client.brandProtection.urlInfo({
     *   account_id: '023e105f4ecef8ad9ca31a8372d0c353',
     * });
     * ```
     */
    urlInfo(params, options) {
        const { account_id, ...query } = params;
        return this._client.get(`/accounts/${account_id}/brand-protection/url-info`, {
            query,
            ...options,
        })._thenUnwrap((obj) => obj.result);
    }
}
//# sourceMappingURL=brand-protection.mjs.map