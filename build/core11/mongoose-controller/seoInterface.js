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
const parameters_1 = require("../decorators/parameters");
const plugin_1 = require("../plugin");
const config_1 = __importDefault(require("../services/config"));
const controller_1 = require("./basePage/controller");
const controller_2 = __importDefault(require("./controller"));
const repository_1 = __importDefault(require("./repositories/content/repository"));
const zod_1 = require("zod");
class SeoInterface extends plugin_1.Plugin {
    constructor() {
        super();
        this.contentRepo = new repository_1.default();
    }
    async init() {
        return true;
    }
    serve() {
        return [
            {
                execs: this.addUrl.bind(this),
                method: "post",
                route: "/seo/url",
                meta: Reflect.getMetadata("addUrl", this)
            },
            {
                execs: this.deleteUrl.bind(this),
                method: "delete",
                route: "/seo/url",
                meta: Reflect.getMetadata("deleteUrl", this)
            },
            {
                execs: this.updateUrl.bind(this),
                method: "put",
                route: "/seo/url",
                meta: Reflect.getMetadata("updateUrl", this)
            }
        ];
    }
    async addUrl(seo, config) {
        seo.type = config.type;
        seo.language = config.language;
        seo.category = config.category;
        try {
            var seoConfig = config_1.default.getConfig("seoConfig");
            var configData = seoConfig[config.type];
            return {
                data: await this.contentRepo.insert(seo, {
                    category: config.category,
                    language: config.language,
                    type: config.type,
                    customFunc: configData['functions']['1']
                }),
                status: 200
            };
        }
        catch (error) {
            throw error;
        }
    }
    async deleteUrl(id, config) {
        try {
            return {
                data: await this.contentRepo.findOneAndDelete({
                    id: id,
                    type: config.type
                }),
                status: 200
            };
        }
        catch (error) {
            throw error;
        }
    }
    async updateUrl(id, seo, config) {
        console.log(id, config);
        try {
            var seoConfig = config_1.default.getConfig("seoConfig");
            var configData = seoConfig[config.type];
            return {
                status: 200,
                data: await this.contentRepo.editContent({
                    _id: id,
                    type: config.type,
                }, {
                    $set: seo
                }, {
                    category: config.category,
                    language: config.language,
                    type: config.type,
                    customFunc: configData['functions']['1']
                })
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getSeo() {
    }
}
exports.default = SeoInterface;
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "seo",
        schema: controller_1.seoSchema
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "config",
        schema: zod_1.z.object({
            category: controller_2.default.id,
            language: controller_2.default.id,
            type: zod_1.z.string()
        })
    }))
], SeoInterface.prototype, "addUrl", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "config",
        schema: zod_1.z.object({
            category: controller_2.default.id,
            language: controller_2.default.id,
            type: zod_1.z.string()
        })
    }))
], SeoInterface.prototype, "deleteUrl", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "seo",
        schema: zod_1.z.any()
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "config",
        schema: zod_1.z.object({
            category: controller_2.default.id,
            language: controller_2.default.id,
            type: zod_1.z.string()
        })
    }))
], SeoInterface.prototype, "updateUrl", null);
