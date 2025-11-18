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
exports.BackLinkController = void 0;
const parameters_1 = require("../../decorators/parameters");
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/backlink/repository"));
const zod_1 = require("zod");
const articleProccessing_1 = __importDefault(require("../../services/articleProccessing"));
class BackLinkController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
    }
    async testURL(id) {
        try {
            var backLink = await this.repository.findById(id);
            if (backLink == null) {
                return {
                    status: 404,
                    message: "یافت نشد"
                };
            }
            return {
                status: 200,
                data: await articleProccessing_1.default.testBackLink(backLink === null || backLink === void 0 ? void 0 : backLink.url, backLink === null || backLink === void 0 ? void 0 : backLink.links)
            };
        }
        catch (error) {
            throw error;
        }
    }
    initApis() {
        super.initApis();
        this.addRoute("/test", "get", this.testURL.bind(this));
    }
}
exports.BackLinkController = BackLinkController;
__decorate([
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    }))
], BackLinkController.prototype, "testURL", null);
var backlink = new BackLinkController("/backlink", new repository_1.default(), {
    insertSchema: zod_1.z.object({
        url: zod_1.z.string(),
        pageAuthority: zod_1.z.number().optional(),
        domainAuthority: zod_1.z.number().optional(),
        spamScore: zod_1.z.number().optional(),
        inboundLinks: zod_1.z.array(zod_1.z.string()).optional(),
        links: zod_1.z.array(zod_1.z.object({
            url: zod_1.z.string(),
            text: zod_1.z.string(),
        })),
    })
});
exports.default = backlink;
