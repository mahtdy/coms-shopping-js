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
exports.SmsTemplateController = void 0;
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/smsTemplate/repository"));
const parameters_1 = require("../../decorators/parameters");
const zod_1 = require("zod");
const smsMessager_1 = __importDefault(require("../../messaging/smsMessager"));
const method_1 = require("../../../core/decorators/method");
class SmsTemplateController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        if (!options) {
            options = {};
        }
        if (!options.insertSchema) {
            options.insertSchema = zod_1.z.object({
                title: zod_1.z.string(),
                inputs: zod_1.z.array(zod_1.z.string()),
                text: zod_1.z.string(),
                id: zod_1.z.coerce.number().int().positive().optional(),
                sendOTP: zod_1.z.boolean().optional(),
                defaultSmsConfig: controller_1.default.id.optional(),
                module: zod_1.z.string().optional(),
                status: zod_1.z.enum(["waiting", "active", "inactive"]).default("waiting"),
                apiCreator: controller_1.default.id.optional()
                // isCore: z.boolean()
            });
        }
        super(baseRoute, repo, options);
    }
    ;
    async editTemplate(data, id) {
        try {
            var template = await this.repository.findById(id, {
                fromDb: true
            });
        }
        catch (error) {
            throw error;
        }
        if (template == null) {
            return {
                status: 404,
                message: "موردی یافت نشد"
            };
        }
        // var updateData: UpdateQuery<SmsTemplate> = {}
        var updateData = {
            $set: {}
        };
        if (data.text) {
            updateData["$set"]["text"] = data.text;
        }
        if (data.sendOTP == true) {
            updateData["$set"]["sendOTP"] = true;
            updateData["$unset"] = {
                defaultSmsConfig: 1
            };
        }
        if (data.sendOTP == false) {
            updateData["$set"]["sendOTP"] = false;
        }
        if (data.disableDefaultConfig == true) {
            updateData["$unset"] = {
                defaultSmsConfig: 1
            };
        }
        else if (data.defaultSmsConfig) {
            updateData["$set"]["defaultSmsConfig"] = data.defaultSmsConfig;
        }
        return this.editById(id, updateData);
    }
    async checkTemplateStatus(id) {
        try {
            var status = await smsMessager_1.default.getTemplateStatus(id);
        }
        catch (error) {
            throw error;
        }
        if (status == 500) {
            return {
                status: 500,
                message: "خطای داخلی"
            };
        }
        return {
            status: 200,
            data: { status }
        };
    }
    async confirmTemplate(id) {
        var template = await this.repository.findById(id);
        if (template == null)
            return {
                status: 404,
                message: "قالب یافت نشد"
            };
        try {
            return {
                status: 200,
                data: await this.repository.confirmTemplate(id)
            };
        }
        catch (error) {
            return {
                status: 400,
                message: error
            };
        }
    }
    async rejectTemplate(id) {
        return this.editById(id, {
            $set: {
                status: "rejected"
            }
        });
    }
    // async check
    initApis() {
        this.addRouteWithMeta("", "post", this.create.bind(this), {
            "1": {
                index: 0,
                source: "body",
                schema: this.insertSchema
            }
        });
        this.addRouteWithMeta("s", "get", this.search.bind(this), {
            "1": {
                index: 0,
                source: "query",
                destination: "page",
                schema: controller_1.default.page
            },
            "2": {
                index: 1,
                source: "query",
                destination: "limit",
                schema: controller_1.default.limit
            },
            '3': {
                index: 2,
                source: "query",
                schema: controller_1.default.search
            }
        }),
            this.addRoute("s/search/list", "get", this.getSearchList.bind(this)),
            this.addRouteWithMeta("", "get", this.findById.bind(this), {
                "1": {
                    index: 0,
                    source: "query",
                    destination: "id",
                    schema: controller_1.default.id
                },
            });
        this.addRouteWithMeta("", "delete", this.delete.bind(this), {
            "1": {
                index: 0,
                source: "query",
                destination: "id",
                schema: controller_1.default.id
            },
        });
        this.addRoute("", "put", this.editTemplate.bind(this));
        this.addRoute("/status", "get", this.checkTemplateStatus.bind(this));
    }
}
exports.SmsTemplateController = SmsTemplateController;
__decorate([
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            text: zod_1.z.string().optional(),
            defaultSmsConfig: controller_1.default.id.optional(),
            disableDefaultConfig: zod_1.z.boolean().optional(),
            sendOTP: zod_1.z.boolean().optional()
        })
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    }))
], SmsTemplateController.prototype, "editTemplate", null);
__decorate([
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: zod_1.z.coerce.number().int().positive()
    }))
], SmsTemplateController.prototype, "checkTemplateStatus", null);
__decorate([
    (0, method_1.Post)("/confirm"),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    }))
], SmsTemplateController.prototype, "confirmTemplate", null);
__decorate([
    (0, method_1.Post)("/reject"),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    }))
], SmsTemplateController.prototype, "rejectTemplate", null);
var smsTemplate = new SmsTemplateController("/smsTemplate", new repository_1.default(), {
    searchFilters: {
        status: ["list", "eq"],
        isCore: ["eq"],
        module: ["eq"]
    }
});
exports.default = smsTemplate;
