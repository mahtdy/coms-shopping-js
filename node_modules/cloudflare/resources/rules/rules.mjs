// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from "../../resource.mjs";
import * as ListsAPI from "./lists/lists.mjs";
import { Lists, } from "./lists/lists.mjs";
export class Rules extends APIResource {
    constructor() {
        super(...arguments);
        this.lists = new ListsAPI.Lists(this._client);
    }
}
Rules.Lists = Lists;
//# sourceMappingURL=rules.mjs.map