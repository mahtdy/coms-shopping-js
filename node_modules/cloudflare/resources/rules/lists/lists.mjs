// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from "../../../resource.mjs";
import * as BulkOperationsAPI from "./bulk-operations.mjs";
import { BulkOperations } from "./bulk-operations.mjs";
import * as ItemsAPI from "./items.mjs";
import { Items, } from "./items.mjs";
export class Lists extends APIResource {
    constructor() {
        super(...arguments);
        this.bulkOperations = new BulkOperationsAPI.BulkOperations(this._client);
        this.items = new ItemsAPI.Items(this._client);
    }
    /**
     * Creates a new list of the specified type.
     *
     * @example
     * ```ts
     * const list = await client.rules.lists.create({
     *   account_id: '023e105f4ecef8ad9ca31a8372d0c353',
     *   kind: 'ip',
     *   name: 'list1',
     * });
     * ```
     */
    create(params, options) {
        const { account_id, ...body } = params;
        return this._client.post(`/accounts/${account_id}/rules/lists`, { body, ...options })._thenUnwrap((obj) => obj.result);
    }
    /**
     * Updates the description of a list.
     *
     * @example
     * ```ts
     * const list = await client.rules.lists.update(
     *   '2c0fc9fa937b11eaa1b71c4d701ab86e',
     *   { account_id: '023e105f4ecef8ad9ca31a8372d0c353' },
     * );
     * ```
     */
    update(listId, params, options) {
        const { account_id, ...body } = params;
        return this._client.put(`/accounts/${account_id}/rules/lists/${listId}`, {
            body,
            ...options,
        })._thenUnwrap((obj) => obj.result);
    }
    /**
     * Fetches all lists in the account.
     *
     * @example
     * ```ts
     * const lists = await client.rules.lists.list({
     *   account_id: '023e105f4ecef8ad9ca31a8372d0c353',
     * });
     * ```
     */
    list(params, options) {
        const { account_id } = params;
        return this._client.get(`/accounts/${account_id}/rules/lists`, options)._thenUnwrap((obj) => obj.result);
    }
    /**
     * Deletes a specific list and all its items.
     *
     * @example
     * ```ts
     * const list = await client.rules.lists.delete(
     *   '2c0fc9fa937b11eaa1b71c4d701ab86e',
     *   { account_id: '023e105f4ecef8ad9ca31a8372d0c353' },
     * );
     * ```
     */
    delete(listId, params, options) {
        const { account_id } = params;
        return this._client.delete(`/accounts/${account_id}/rules/lists/${listId}`, options)._thenUnwrap((obj) => obj.result);
    }
    /**
     * Fetches the details of a list.
     *
     * @example
     * ```ts
     * const list = await client.rules.lists.get(
     *   '2c0fc9fa937b11eaa1b71c4d701ab86e',
     *   { account_id: '023e105f4ecef8ad9ca31a8372d0c353' },
     * );
     * ```
     */
    get(listId, params, options) {
        const { account_id } = params;
        return this._client.get(`/accounts/${account_id}/rules/lists/${listId}`, options)._thenUnwrap((obj) => obj.result);
    }
}
Lists.BulkOperations = BulkOperations;
Lists.Items = Items;
//# sourceMappingURL=lists.mjs.map