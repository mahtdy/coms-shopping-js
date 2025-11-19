// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from "../../../resource.mjs";
import * as EventsAPI from "./events/events.mjs";
import { Events, } from "./events/events.mjs";
import * as SnapshotsAPI from "./snapshots/snapshots.mjs";
import { Snapshots, } from "./snapshots/snapshots.mjs";
import { SinglePage } from "../../../pagination.mjs";
export class Connectors extends APIResource {
    constructor() {
        super(...arguments);
        this.events = new EventsAPI.Events(this._client);
        this.snapshots = new SnapshotsAPI.Snapshots(this._client);
    }
    /**
     * Replace Connector
     *
     * @example
     * ```ts
     * const connector =
     *   await client.magicTransit.connectors.update(
     *     'connector_id',
     *     { account_id: '023e105f4ecef8ad9ca31a8372d0c353' },
     *   );
     * ```
     */
    update(connectorId, params, options) {
        const { account_id, ...body } = params;
        return this._client.put(`/accounts/${account_id}/magic/connectors/${connectorId}`, {
            body,
            ...options,
        })._thenUnwrap((obj) => obj.result);
    }
    /**
     * List Connectors
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const connectorListResponse of client.magicTransit.connectors.list(
     *   { account_id: '023e105f4ecef8ad9ca31a8372d0c353' },
     * )) {
     *   // ...
     * }
     * ```
     */
    list(params, options) {
        const { account_id } = params;
        return this._client.getAPIList(`/accounts/${account_id}/magic/connectors`, ConnectorListResponsesSinglePage, options);
    }
    /**
     * Update Connector
     *
     * @example
     * ```ts
     * const response = await client.magicTransit.connectors.edit(
     *   'connector_id',
     *   { account_id: '023e105f4ecef8ad9ca31a8372d0c353' },
     * );
     * ```
     */
    edit(connectorId, params, options) {
        const { account_id, ...body } = params;
        return this._client.patch(`/accounts/${account_id}/magic/connectors/${connectorId}`, {
            body,
            ...options,
        })._thenUnwrap((obj) => obj.result);
    }
    /**
     * Fetch Connector
     *
     * @example
     * ```ts
     * const connector = await client.magicTransit.connectors.get(
     *   'connector_id',
     *   { account_id: '023e105f4ecef8ad9ca31a8372d0c353' },
     * );
     * ```
     */
    get(connectorId, params, options) {
        const { account_id } = params;
        return this._client.get(`/accounts/${account_id}/magic/connectors/${connectorId}`, options)._thenUnwrap((obj) => obj.result);
    }
}
export class ConnectorListResponsesSinglePage extends SinglePage {
}
Connectors.ConnectorListResponsesSinglePage = ConnectorListResponsesSinglePage;
Connectors.Events = Events;
Connectors.Snapshots = Snapshots;
//# sourceMappingURL=connectors.mjs.map