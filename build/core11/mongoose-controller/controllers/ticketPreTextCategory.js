"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketPreTextCategoryController = void 0;
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/ticketPreTextCategory/repository"));
const zod_1 = require("zod");
class TicketPreTextCategoryController extends controller_1.default {
    initApis() {
        super.initApis();
        this.addRouteWithMeta("/search", "get", this.search.bind(this), controller_1.default.searcheMeta);
    }
}
exports.TicketPreTextCategoryController = TicketPreTextCategoryController;
var ticketPreTextCategory = new TicketPreTextCategoryController("/ticketPreTextCategory", new repository_1.default(), {
    insertSchema: zod_1.z.object({
        title: zod_1.z.string()
    }),
    searchFilters: {
        title: ["eq", "reg"]
    }
});
exports.default = ticketPreTextCategory;
