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
exports.EmailTemplateController = void 0;
const controller_1 = __importDefault(require("../controller"));
const parameters_1 = require("../../decorators/parameters");
const zod_1 = require("zod");
const repository_1 = __importDefault(require("../repositories/emailTemplate/repository"));
const method_1 = require("../../decorators/method");
class EmailTemplateController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        if (!options) {
            options = {};
        }
        if (!options.insertSchema) {
            options.insertSchema = zod_1.z.object({
                title: zod_1.z.string(),
                inputs: zod_1.z.array(zod_1.z.string()),
                text: zod_1.z.string(),
                defaultEmailConfig: controller_1.default.id,
                defaultSmsConfig: controller_1.default.id.optional(),
                isHTML: controller_1.default.id.optional(),
                module: zod_1.z.string(),
                status: zod_1.z.enum(["waiting", "active", "inactive"]).default("waiting"),
                apiCreator: controller_1.default.id.optional()
            });
        }
        super(baseRoute, repo, options);
    }
    ;
    create(data, admin) {
        data.adminCreator = admin._id;
        return super.create(data);
    }
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
        updateData['$set']['isHTML'] = data.isHTML;
        if (data.disableDefaultConfig == true) {
            updateData["$unset"] = {
                defaultSmsConfig: 1
            };
        }
        else if (data.defaultEmailConfig) {
            updateData["$set"]["defaultEmailConfig"] = data.defaultEmailConfig;
        }
        return this.editById(id, updateData);
    }
    async confirmTemplate(id) {
        var template = await this.repository.findById(id);
        if (template == null)
            return {
                status: 404,
                message: "قالب یافت نشد"
            };
        return this.editById(id, {
            $set: {
                status: "active"
            }
        });
    }
    async rejectTemplate(id) {
        return this.editById(id, {
            $set: {
                status: "inactive"
            }
        });
    }
    initApis() {
        this.addRouteWithMeta("", "post", this.create.bind(this), {
            "1": {
                index: 0,
                source: "body",
                schema: this.insertSchema
            }
        });
        this.addRouteWithMeta("s", "get", this.paginate.bind(this), {
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
        });
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
        this.addRoute("s/search/list", "get", this.getSearchList.bind(this));
    }
}
exports.EmailTemplateController = EmailTemplateController;
__decorate([
    __param(1, (0, parameters_1.Admin)())
], EmailTemplateController.prototype, "create", null);
__decorate([
    (0, method_1.Put)(""),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            text: zod_1.z.string().optional(),
            defaultEmailConfig: controller_1.default.id.optional(),
            disableDefaultConfig: zod_1.z.boolean().optional(),
            isHTML: zod_1.z.boolean().optional()
        })
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    }))
], EmailTemplateController.prototype, "editTemplate", null);
__decorate([
    (0, method_1.Post)("/confirm"),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    }))
], EmailTemplateController.prototype, "confirmTemplate", null);
__decorate([
    (0, method_1.Post)("/reject"),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    }))
], EmailTemplateController.prototype, "rejectTemplate", null);
var emailTemplate = new EmailTemplateController("/emailTemplate", new repository_1.default(), {
    searchFilters: {
        status: ["list", "eq"],
        isCore: ["eq"],
        module: ["eq"]
    },
    insertSchema: zod_1.z.object({
        title: zod_1.z.string(),
        inputs: zod_1.z.array(zod_1.z.string()),
        text: zod_1.z.string(),
        isHTML: zod_1.z.boolean().default(false),
        defaultEmailConfig: controller_1.default.id.optional(),
        module: zod_1.z.string().optional(),
        status: zod_1.z.enum(["waiting", "active", "inactive"]),
        isCore: zod_1.z.boolean().default(true),
        // adminCreator : 
    })
});
exports.default = emailTemplate;
