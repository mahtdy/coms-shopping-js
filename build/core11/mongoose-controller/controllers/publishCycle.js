"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublishCycleController = void 0;
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/publishCycle/repository"));
const zod_1 = __importDefault(require("zod"));
const parameters_1 = require("../../decorators/parameters");
class PublishCycleController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
    }
    async paginate(page, limit, admin, queryParam, query, options) {
        query = await this.searchHelper(queryParam);
        if (query == undefined) {
            query = {};
        }
        return super.paginate(page, limit, query, options);
    }
}
exports.PublishCycleController = PublishCycleController;
__decorate([
    __param(2, (0, parameters_1.Admin)()),
    __param(3, (0, parameters_1.Query)({
        // destination : "",
        schema: controller_1.default.search.optional()
    }))
], PublishCycleController.prototype, "paginate", null);
const publishCycle = new PublishCycleController("/publish-cycle", new repository_1.default(), {
    insertSchema: zod_1.default.object({
        name: zod_1.default.string(),
        time: controller_1.default.time
    }),
    searchFilters: {
        name: ["eq", "reg"]
    }
});
exports.default = publishCycle;
