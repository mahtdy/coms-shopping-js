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
exports.LinkTagController = void 0;
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/linkTag/repository"));
const cache_1 = __importDefault(require("../../cache"));
const zod_1 = require("zod");
const parameters_1 = require("../../decorators/parameters");
const method_1 = require("../../decorators/method");
class LinkTagController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
    }
    async getTagLink(tags) {
        try {
            return {
                status: 200,
                data: await this.repository.getLinksByTags(tags)
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getLinkByTag(link) {
        try {
            return this.findOne({
                link
            });
        }
        catch (error) {
            throw error;
        }
    }
}
exports.LinkTagController = LinkTagController;
__decorate([
    (0, method_1.Get)("/tags"),
    __param(0, (0, parameters_1.Query)({
        destination: "tags",
        schema: zod_1.z.array(zod_1.z.string())
    }))
], LinkTagController.prototype, "getTagLink", null);
__decorate([
    (0, method_1.Get)("/by-id"),
    __param(0, (0, parameters_1.Query)({
        destination: "link",
        schema: controller_1.default.id
    }))
], LinkTagController.prototype, "getLinkByTag", null);
var linktag = new LinkTagController("/linktag", new repository_1.default({
    cacheService: new cache_1.default("linktag")
}), {
    insertSchema: zod_1.z.object({
        link: controller_1.default.id
    })
});
// log.addRouteWithMeta("es/search", "get" , log.search.bind(log),BaseController.searcheMeta)
exports.default = linktag;
