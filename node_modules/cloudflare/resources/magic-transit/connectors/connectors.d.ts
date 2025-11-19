import { APIResource } from "../../../resource.js";
import * as Core from "../../../core.js";
import * as EventsAPI from "./events/events.js";
import { EventGetParams, EventGetResponse, EventListParams, EventListResponse, Events } from "./events/events.js";
import * as SnapshotsAPI from "./snapshots/snapshots.js";
import { SnapshotGetParams, SnapshotGetResponse, SnapshotListParams, SnapshotListResponse, Snapshots } from "./snapshots/snapshots.js";
import { SinglePage } from "../../../pagination.js";
export declare class Connectors extends APIResource {
    events: EventsAPI.Events;
    snapshots: SnapshotsAPI.Snapshots;
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
    update(connectorId: string, params: ConnectorUpdateParams, options?: Core.RequestOptions): Core.APIPromise<ConnectorUpdateResponse>;
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
    list(params: ConnectorListParams, options?: Core.RequestOptions): Core.PagePromise<ConnectorListResponsesSinglePage, ConnectorListResponse>;
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
    edit(connectorId: string, params: ConnectorEditParams, options?: Core.RequestOptions): Core.APIPromise<ConnectorEditResponse>;
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
    get(connectorId: string, params: ConnectorGetParams, options?: Core.RequestOptions): Core.APIPromise<ConnectorGetResponse>;
}
export declare class ConnectorListResponsesSinglePage extends SinglePage<ConnectorListResponse> {
}
export interface ConnectorUpdateResponse {
    id: string;
    activated: boolean;
    interrupt_window_duration_hours: number;
    interrupt_window_hour_of_day: number;
    last_updated: string;
    notes: string;
    timezone: string;
    device?: ConnectorUpdateResponse.Device;
    last_heartbeat?: string;
    last_seen_version?: string;
}
export declare namespace ConnectorUpdateResponse {
    interface Device {
        id: string;
        serial_number?: string;
    }
}
export interface ConnectorListResponse {
    id: string;
    activated: boolean;
    interrupt_window_duration_hours: number;
    interrupt_window_hour_of_day: number;
    last_updated: string;
    notes: string;
    timezone: string;
    device?: ConnectorListResponse.Device;
    last_heartbeat?: string;
    last_seen_version?: string;
}
export declare namespace ConnectorListResponse {
    interface Device {
        id: string;
        serial_number?: string;
    }
}
export interface ConnectorEditResponse {
    id: string;
    activated: boolean;
    interrupt_window_duration_hours: number;
    interrupt_window_hour_of_day: number;
    last_updated: string;
    notes: string;
    timezone: string;
    device?: ConnectorEditResponse.Device;
    last_heartbeat?: string;
    last_seen_version?: string;
}
export declare namespace ConnectorEditResponse {
    interface Device {
        id: string;
        serial_number?: string;
    }
}
export interface ConnectorGetResponse {
    id: string;
    activated: boolean;
    interrupt_window_duration_hours: number;
    interrupt_window_hour_of_day: number;
    last_updated: string;
    notes: string;
    timezone: string;
    device?: ConnectorGetResponse.Device;
    last_heartbeat?: string;
    last_seen_version?: string;
}
export declare namespace ConnectorGetResponse {
    interface Device {
        id: string;
        serial_number?: string;
    }
}
export interface ConnectorUpdateParams {
    /**
     * Path param: Account identifier
     */
    account_id: string;
    /**
     * Body param:
     */
    activated?: boolean;
    /**
     * Body param:
     */
    interrupt_window_duration_hours?: number;
    /**
     * Body param:
     */
    interrupt_window_hour_of_day?: number;
    /**
     * Body param:
     */
    notes?: string;
    /**
     * Body param:
     */
    timezone?: string;
}
export interface ConnectorListParams {
    /**
     * Account identifier
     */
    account_id: string;
}
export interface ConnectorEditParams {
    /**
     * Path param: Account identifier
     */
    account_id: string;
    /**
     * Body param:
     */
    activated?: boolean;
    /**
     * Body param:
     */
    interrupt_window_duration_hours?: number;
    /**
     * Body param:
     */
    interrupt_window_hour_of_day?: number;
    /**
     * Body param:
     */
    notes?: string;
    /**
     * Body param:
     */
    timezone?: string;
}
export interface ConnectorGetParams {
    /**
     * Account identifier
     */
    account_id: string;
}
export declare namespace Connectors {
    export { type ConnectorUpdateResponse as ConnectorUpdateResponse, type ConnectorListResponse as ConnectorListResponse, type ConnectorEditResponse as ConnectorEditResponse, type ConnectorGetResponse as ConnectorGetResponse, ConnectorListResponsesSinglePage as ConnectorListResponsesSinglePage, type ConnectorUpdateParams as ConnectorUpdateParams, type ConnectorListParams as ConnectorListParams, type ConnectorEditParams as ConnectorEditParams, type ConnectorGetParams as ConnectorGetParams, };
    export { Events as Events, type EventListResponse as EventListResponse, type EventGetResponse as EventGetResponse, type EventListParams as EventListParams, type EventGetParams as EventGetParams, };
    export { Snapshots as Snapshots, type SnapshotListResponse as SnapshotListResponse, type SnapshotGetResponse as SnapshotGetResponse, type SnapshotListParams as SnapshotListParams, type SnapshotGetParams as SnapshotGetParams, };
}
//# sourceMappingURL=connectors.d.ts.map