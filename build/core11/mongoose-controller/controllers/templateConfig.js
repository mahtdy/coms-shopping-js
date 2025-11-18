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
exports.TemplateConfigController = void 0;
const parameters_1 = require("../../decorators/parameters");
const method_1 = require("../../decorators/method");
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/templateConfig/repository"));
const zod_1 = require("zod");
class TemplateConfigController extends controller_1.default {
    async updateConfig(id, imageConfig) {
        return this.editById(id, {
            $set: {
                imageConfig
            }
        });
    }
}
exports.TemplateConfigController = TemplateConfigController;
__decorate([
    (0, method_1.Put)("/image-config", {}),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        schema: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string(),
            resolotion: zod_1.z.object({
                h: zod_1.z.coerce.number().positive().default(150),
                w: zod_1.z.coerce.number().positive().default(150),
            }),
            compersionConfig: zod_1.z.any()
        }))
    }))
], TemplateConfigController.prototype, "updateConfig", null);
const templateConfig = new TemplateConfigController("/template-config", new repository_1.default(), {
    insertSchema: zod_1.z.object({
        template: controller_1.default.id,
        language: controller_1.default.id.optional(),
        type: zod_1.z.enum(["general", "gallery", "video", "podcast", "category_faq", "increamental"]),
        imageConfig: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string(),
            resolotion: zod_1.z.object({
                h: zod_1.z.coerce.number().positive().default(150),
                w: zod_1.z.coerce.number().positive().default(150),
            }),
            compersionConfig: zod_1.z.any()
        }))
    })
});
exports.default = templateConfig;
