import { APIResource } from "../../../resource.js";
import * as Core from "../../../core.js";
import * as CustomAPI from "./profiles/custom.js";
import { SinglePage } from "../../../pagination.js";
export declare class Entries extends APIResource {
    /**
     * Creates a DLP custom entry.
     *
     * @example
     * ```ts
     * const entry = await client.zeroTrust.dlp.entries.create({
     *   account_id: 'account_id',
     *   enabled: true,
     *   name: 'name',
     *   pattern: { regex: 'regex' },
     *   profile_id: '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e',
     * });
     * ```
     */
    create(params: EntryCreateParams, options?: Core.RequestOptions): Core.APIPromise<EntryCreateResponse>;
    /**
     * Updates a DLP entry.
     *
     * @example
     * ```ts
     * const entry = await client.zeroTrust.dlp.entries.update(
     *   '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e',
     *   {
     *     account_id: 'account_id',
     *     name: 'name',
     *     pattern: { regex: 'regex' },
     *     type: 'custom',
     *   },
     * );
     * ```
     */
    update(entryId: string, params: EntryUpdateParams, options?: Core.RequestOptions): Core.APIPromise<EntryUpdateResponse>;
    /**
     * Lists all DLP entries in an account.
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const entryListResponse of client.zeroTrust.dlp.entries.list(
     *   { account_id: 'account_id' },
     * )) {
     *   // ...
     * }
     * ```
     */
    list(params: EntryListParams, options?: Core.RequestOptions): Core.PagePromise<EntryListResponsesSinglePage, EntryListResponse>;
    /**
     * Deletes a DLP custom entry.
     *
     * @example
     * ```ts
     * const entry = await client.zeroTrust.dlp.entries.delete(
     *   '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e',
     *   { account_id: 'account_id' },
     * );
     * ```
     */
    delete(entryId: string, params: EntryDeleteParams, options?: Core.RequestOptions): Core.APIPromise<EntryDeleteResponse | null>;
    /**
     * Fetches a DLP entry by ID.
     *
     * @example
     * ```ts
     * const entry = await client.zeroTrust.dlp.entries.get(
     *   '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e',
     *   { account_id: 'account_id' },
     * );
     * ```
     */
    get(entryId: string, params: EntryGetParams, options?: Core.RequestOptions): Core.APIPromise<EntryGetResponse>;
}
export declare class EntryListResponsesSinglePage extends SinglePage<EntryListResponse> {
}
export interface EntryCreateResponse {
    id: string;
    created_at: string;
    enabled: boolean;
    name: string;
    pattern: CustomAPI.Pattern;
    updated_at: string;
    profile_id?: string | null;
}
export type EntryUpdateResponse = EntryUpdateResponse.CustomEntry | EntryUpdateResponse.PredefinedEntry | EntryUpdateResponse.IntegrationEntry | EntryUpdateResponse.ExactDataEntry | EntryUpdateResponse.DocumentTemplateEntry | EntryUpdateResponse.WordListEntry;
export declare namespace EntryUpdateResponse {
    interface CustomEntry {
        id: string;
        created_at: string;
        enabled: boolean;
        name: string;
        pattern: CustomAPI.Pattern;
        type: 'custom';
        updated_at: string;
        profile_id?: string | null;
    }
    interface PredefinedEntry {
        id: string;
        confidence: PredefinedEntry.Confidence;
        enabled: boolean;
        name: string;
        type: 'predefined';
        profile_id?: string | null;
    }
    namespace PredefinedEntry {
        interface Confidence {
            /**
             * Indicates whether this entry has AI remote service validation.
             */
            ai_context_available: boolean;
            /**
             * Indicates whether this entry has any form of validation that is not an AI remote
             * service.
             */
            available: boolean;
        }
    }
    interface IntegrationEntry {
        id: string;
        created_at: string;
        enabled: boolean;
        name: string;
        type: 'integration';
        updated_at: string;
        profile_id?: string | null;
    }
    interface ExactDataEntry {
        id: string;
        /**
         * Only applies to custom word lists. Determines if the words should be matched in
         * a case-sensitive manner Cannot be set to false if secret is true
         */
        case_sensitive: boolean;
        created_at: string;
        enabled: boolean;
        name: string;
        secret: boolean;
        type: 'exact_data';
        updated_at: string;
    }
    interface DocumentTemplateEntry {
        id: string;
        created_at: string;
        enabled: boolean;
        name: string;
        type: 'document_template';
        updated_at: string;
    }
    interface WordListEntry {
        id: string;
        created_at: string;
        enabled: boolean;
        name: string;
        type: 'word_list';
        updated_at: string;
        word_list: unknown;
        profile_id?: string | null;
    }
}
export type EntryListResponse = EntryListResponse.CustomEntry | EntryListResponse.PredefinedEntry | EntryListResponse.IntegrationEntry | EntryListResponse.ExactDataEntry | EntryListResponse.DocumentTemplateEntry | EntryListResponse.WordListEntry;
export declare namespace EntryListResponse {
    interface CustomEntry {
        id: string;
        created_at: string;
        enabled: boolean;
        name: string;
        pattern: CustomAPI.Pattern;
        type: 'custom';
        updated_at: string;
        profile_id?: string | null;
    }
    interface PredefinedEntry {
        id: string;
        confidence: PredefinedEntry.Confidence;
        enabled: boolean;
        name: string;
        type: 'predefined';
        profile_id?: string | null;
    }
    namespace PredefinedEntry {
        interface Confidence {
            /**
             * Indicates whether this entry has AI remote service validation.
             */
            ai_context_available: boolean;
            /**
             * Indicates whether this entry has any form of validation that is not an AI remote
             * service.
             */
            available: boolean;
        }
    }
    interface IntegrationEntry {
        id: string;
        created_at: string;
        enabled: boolean;
        name: string;
        type: 'integration';
        updated_at: string;
        profile_id?: string | null;
    }
    interface ExactDataEntry {
        id: string;
        /**
         * Only applies to custom word lists. Determines if the words should be matched in
         * a case-sensitive manner Cannot be set to false if secret is true
         */
        case_sensitive: boolean;
        created_at: string;
        enabled: boolean;
        name: string;
        secret: boolean;
        type: 'exact_data';
        updated_at: string;
    }
    interface DocumentTemplateEntry {
        id: string;
        created_at: string;
        enabled: boolean;
        name: string;
        type: 'document_template';
        updated_at: string;
    }
    interface WordListEntry {
        id: string;
        created_at: string;
        enabled: boolean;
        name: string;
        type: 'word_list';
        updated_at: string;
        word_list: unknown;
        profile_id?: string | null;
    }
}
export type EntryDeleteResponse = unknown;
export type EntryGetResponse = EntryGetResponse.CustomEntry | EntryGetResponse.PredefinedEntry | EntryGetResponse.IntegrationEntry | EntryGetResponse.ExactDataEntry | EntryGetResponse.DocumentTemplateEntry | EntryGetResponse.WordListEntry;
export declare namespace EntryGetResponse {
    interface CustomEntry {
        id: string;
        created_at: string;
        enabled: boolean;
        name: string;
        pattern: CustomAPI.Pattern;
        type: 'custom';
        updated_at: string;
        profile_id?: string | null;
    }
    interface PredefinedEntry {
        id: string;
        confidence: PredefinedEntry.Confidence;
        enabled: boolean;
        name: string;
        type: 'predefined';
        profile_id?: string | null;
    }
    namespace PredefinedEntry {
        interface Confidence {
            /**
             * Indicates whether this entry has AI remote service validation.
             */
            ai_context_available: boolean;
            /**
             * Indicates whether this entry has any form of validation that is not an AI remote
             * service.
             */
            available: boolean;
        }
    }
    interface IntegrationEntry {
        id: string;
        created_at: string;
        enabled: boolean;
        name: string;
        type: 'integration';
        updated_at: string;
        profile_id?: string | null;
    }
    interface ExactDataEntry {
        id: string;
        /**
         * Only applies to custom word lists. Determines if the words should be matched in
         * a case-sensitive manner Cannot be set to false if secret is true
         */
        case_sensitive: boolean;
        created_at: string;
        enabled: boolean;
        name: string;
        secret: boolean;
        type: 'exact_data';
        updated_at: string;
    }
    interface DocumentTemplateEntry {
        id: string;
        created_at: string;
        enabled: boolean;
        name: string;
        type: 'document_template';
        updated_at: string;
    }
    interface WordListEntry {
        id: string;
        created_at: string;
        enabled: boolean;
        name: string;
        type: 'word_list';
        updated_at: string;
        word_list: unknown;
        profile_id?: string | null;
    }
}
export interface EntryCreateParams {
    /**
     * Path param:
     */
    account_id: string;
    /**
     * Body param:
     */
    enabled: boolean;
    /**
     * Body param:
     */
    name: string;
    /**
     * Body param:
     */
    pattern: CustomAPI.PatternParam;
    /**
     * Body param:
     */
    profile_id: string;
}
export type EntryUpdateParams = EntryUpdateParams.Variant0 | EntryUpdateParams.Variant1 | EntryUpdateParams.Variant2;
export declare namespace EntryUpdateParams {
    interface Variant0 {
        /**
         * Path param:
         */
        account_id: string;
        /**
         * Body param:
         */
        name: string;
        /**
         * Body param:
         */
        pattern: CustomAPI.PatternParam;
        /**
         * Body param:
         */
        type: 'custom';
        /**
         * Body param:
         */
        enabled?: boolean;
    }
    interface Variant1 {
        /**
         * Path param:
         */
        account_id: string;
        /**
         * Body param:
         */
        type: 'predefined';
        /**
         * Body param:
         */
        enabled?: boolean;
    }
    interface Variant2 {
        /**
         * Path param:
         */
        account_id: string;
        /**
         * Body param:
         */
        type: 'integration';
        /**
         * Body param:
         */
        enabled?: boolean;
    }
}
export interface EntryListParams {
    account_id: string;
}
export interface EntryDeleteParams {
    account_id: string;
}
export interface EntryGetParams {
    account_id: string;
}
export declare namespace Entries {
    export { type EntryCreateResponse as EntryCreateResponse, type EntryUpdateResponse as EntryUpdateResponse, type EntryListResponse as EntryListResponse, type EntryDeleteResponse as EntryDeleteResponse, type EntryGetResponse as EntryGetResponse, EntryListResponsesSinglePage as EntryListResponsesSinglePage, type EntryCreateParams as EntryCreateParams, type EntryUpdateParams as EntryUpdateParams, type EntryListParams as EntryListParams, type EntryDeleteParams as EntryDeleteParams, type EntryGetParams as EntryGetParams, };
}
//# sourceMappingURL=entries.d.ts.map