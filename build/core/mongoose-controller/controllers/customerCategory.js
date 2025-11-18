"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerCategoryController = void 0;
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/customerCategory/repository"));
const zod_1 = require("zod");
class CustomerCategoryController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
    }
    initApis() {
        super.initApis();
        this.addRouteWithMeta(this.baseRoute + "s/search", "get", this.search.bind(this), controller_1.default.searcheMeta);
        this.addRoute("s/search/list", "get", this.getSearchList.bind(this));
    }
}
exports.CustomerCategoryController = CustomerCategoryController;
var customerCategory = new CustomerCategoryController("/customerCategory", new repository_1.default({}), {
    insertSchema: zod_1.z.object({
        title: zod_1.z.string(),
        isBasic: zod_1.z.boolean().default(false)
    }),
    searchFilters: {
        title: ["eq", "reg"]
    }
});
exports.default = customerCategory;
