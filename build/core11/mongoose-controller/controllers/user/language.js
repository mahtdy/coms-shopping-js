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
exports.LanguageController = void 0;
const controller_1 = __importDefault(require("../../controller"));
const repository_1 = __importDefault(require("../../repositories/language/repository"));
const method_1 = require("../../../decorators/method");
const parameters_1 = require("../../../decorators/parameters");
const repository_2 = __importDefault(require("../../repositories/languageComment/repository"));
class LanguageController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.languageCommentRepo = new repository_2.default();
    }
    // @Get("s/")
    async paginate(page, limit, query, options, ...params) {
        if (query == undefined) {
            query = {};
        }
        return super.paginate(page, limit, query, options);
    }
    findById(id, queryInfo) {
        return super.findById(id);
    }
    async getLanguageCommentConf(id) {
        try {
            return {
                data: await this.languageCommentRepo.findOne({
                    language: id
                })
            };
        }
        catch (error) {
            throw error;
        }
    }
    initApis() {
        this.addRouteWithMeta("s", "get", this.paginate.bind(this), Object.assign(controller_1.default.paginateMeta, { absolute: false }));
    }
}
exports.LanguageController = LanguageController;
__decorate([
    (0, method_1.Get)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    }))
], LanguageController.prototype, "findById", null);
__decorate([
    (0, method_1.Get)("/comment/config"),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    }))
], LanguageController.prototype, "getLanguageCommentConf", null);
const language = new LanguageController("/language", new repository_1.default(), {});
exports.default = language;
