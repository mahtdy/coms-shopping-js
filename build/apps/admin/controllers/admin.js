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
exports.adminRepo = exports.AdminController = void 0;
const repository_1 = __importDefault(require("../../../core/mongoose-controller/repositories/admin/repository"));
const login_1 = require("../login");
const controller_1 = __importDefault(require("../../../core/mongoose-controller/controller"));
const zod_1 = require("zod");
const method_1 = require("../../../core/decorators/method");
const parameters_1 = require("../../../core/decorators/parameters");
const random_1 = __importDefault(require("../../../core/random"));
const smsMessager_1 = __importDefault(require("../../../core/messaging/smsMessager"));
const role_1 = require("./role");
class AdminController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.actions = options.actions;
    }
    async getActions(admin, subPart) {
        try {
            return {
                status: 200,
                data: await this.repository.getActions(subPart, admin),
            };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async getSchemas(admin, subPart) {
        try {
            return {
                status: 200,
                data: await this.repository.getSchemas(subPart, admin),
            };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async updateActions(admin, subPart, actions) {
        try {
            return {
                status: 200,
                data: await this.repository.updateActions(subPart, admin, actions),
            };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async updateSchemas(admin, schema, subPart, fields) {
        try {
            return {
                status: 200,
                data: await this.repository.updateSchema(subPart, admin, schema, fields),
            };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async getSpecialPermission(subPart, admin) {
        let data = this.actions[subPart];
        if (!data)
            return {
                status: 404,
            };
        let config = (await this.repository.getPermissionModuleAction(subPart, admin)).config;
        for (let i = 0; i < data.length; i++) {
            if (config[data[i].name] != undefined) {
                data[i].value = config[data[i].name].value;
                data[i].fixedData = config[data[i].name].fixedData;
            }
        }
        return {
            status: 200,
            data,
        };
    }
    async getCurrentSpecialPermission(subPart, admin) {
        let data = this.actions[subPart];
        if (!data)
            return {
                status: 404,
            };
        let config = (await this.repository.getPermissionModuleAction(subPart, admin._id)).config;
        for (let i = 0; i < data.length; i++) {
            if (config[data[i].name] != undefined)
                data[i].value = config[data[i].name];
        }
        return {
            status: 200,
            data,
        };
    }
    async setSpecialPermission(admin, subPart, actions) {
        try {
            await this.repository.setPermissionModuleAction(subPart, admin, actions);
            return {
                status: 200,
                data: {},
            };
        }
        catch (error) {
            throw error;
        }
    }
    async create(data, adminInfo, admin) {
        try {
            var password = random_1.default.generateHashStr(8);
            data.password = password;
            var resp = await super.create(data);
            var adminId = admin || adminInfo._id;
            this.repository.updateOne({
                _id: adminId,
            }, {
                $addToSet: {
                    admins: resp.data._id,
                },
            });
            smsMessager_1.default.send({
                receptor: data.phoneNumber,
                template: "adminAdded",
                parameters: {
                    password,
                },
            });
            return resp;
        }
        catch (error) {
            throw error;
        }
    }
    async adminPaginate(page, limit, admin, query, options) {
        if (query == undefined) {
            query = {};
            query["_id"] = {
                $ne: admin === null || admin === void 0 ? void 0 : admin._id,
            };
        }
        if (!(admin === null || admin === void 0 ? void 0 : admin.isSuperAdmin)) {
            var admins = await this.repository.getAdminLists((admin === null || admin === void 0 ? void 0 : admin._id) || "");
            query["_id"]["$in"] = admins;
        }
        return super.adminPaginate(page, limit, admin, query);
    }
}
exports.AdminController = AdminController;
__decorate([
    (0, method_1.Get)("/actions"),
    __param(0, (0, parameters_1.Query)({
        destination: "admin",
        schema: controller_1.default.id,
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "subPart",
        schema: zod_1.z.string(),
    }))
], AdminController.prototype, "getActions", null);
__decorate([
    (0, method_1.Get)("/schemas"),
    __param(0, (0, parameters_1.Query)({
        destination: "admin",
        schema: controller_1.default.id,
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "subPart",
        schema: zod_1.z.string(),
    }))
], AdminController.prototype, "getSchemas", null);
__decorate([
    (0, method_1.Post)("/actions"),
    __param(0, (0, parameters_1.Body)({
        destination: "admin",
        schema: controller_1.default.id,
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "subPart",
        schema: zod_1.z.string(),
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "actions",
        schema: zod_1.z.array(controller_1.default.id),
    }))
], AdminController.prototype, "updateActions", null);
__decorate([
    (0, method_1.Post)("/schemas"),
    __param(0, (0, parameters_1.Body)({
        destination: "admin",
        schema: controller_1.default.id,
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "schema",
        schema: controller_1.default.id,
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "subPart",
        schema: zod_1.z.string(),
    })),
    __param(3, (0, parameters_1.Body)({
        destination: "fields",
        schema: zod_1.z.array(zod_1.z.string()),
    }))
], AdminController.prototype, "updateSchemas", null);
__decorate([
    (0, method_1.Get)("/special/permissions"),
    __param(0, (0, parameters_1.Query)({
        destination: "subPart",
        schema: zod_1.z.string(),
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "admin",
        schema: controller_1.default.id,
    }))
], AdminController.prototype, "getSpecialPermission", null);
__decorate([
    (0, method_1.Get)("/special/permissions/current"),
    __param(0, (0, parameters_1.Query)({
        destination: "subPart",
        schema: zod_1.z.string(),
    })),
    __param(1, (0, parameters_1.Admin)())
], AdminController.prototype, "getCurrentSpecialPermission", null);
__decorate([
    (0, method_1.Post)("/special/permissions"),
    __param(0, (0, parameters_1.Body)({
        destination: "admin",
        schema: controller_1.default.id,
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "subPart",
        schema: zod_1.z.string(),
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "actions",
        schema: controller_1.default.search,
    }))
], AdminController.prototype, "setSpecialPermission", null);
__decorate([
    __param(1, (0, parameters_1.Admin)()),
    __param(2, (0, parameters_1.Query)({
        destination: "admin",
        schema: controller_1.default.id.optional(),
    }))
], AdminController.prototype, "create", null);
__decorate([
    __param(2, (0, parameters_1.Admin)())
], AdminController.prototype, "adminPaginate", null);
exports.adminRepo = new repository_1.default({
    model: login_1.AdminModel,
});
exports.adminRepo.setPopulation([
    {
        path: "role",
    },
]);
const admins = new AdminController("/admin", exports.adminRepo, {
    insertSchema: zod_1.z.object({
        isSuperAdmin: zod_1.z.boolean().default(false),
        role: controller_1.default.id.optional(),
        name: zod_1.z.string(),
        familyName: zod_1.z.string(),
        email: controller_1.default.email,
        phoneNumber: controller_1.default.phone,
        userName: zod_1.z.string(),
        validIPList: zod_1.z.array(controller_1.default.ip),
        towFactorLogIn: zod_1.z.boolean(),
        changePassword: zod_1.z.boolean().default(false),
        address: zod_1.z.any().optional(),
        department: controller_1.default.id.optional(),
    }),
    paginationConfig: {
        fields: {
            name: {
                type: "string",
                en_title: "name",
                fa_title: "نام",
                sortOrderKey: false,
                filters: ["reg"],
                isAutoComplate: false,
                isOptional: false,
            },
            familyName: {
                type: "string",
                en_title: "familyName",
                fa_title: "نام خانوادگی",
                sortOrderKey: false,
                filters: ["reg"],
                isAutoComplate: false,
                isOptional: false,
            },
            role: {
                type: "string",
                en_title: "role",
                fa_title: "نقش",
                isOptional: true,
                object_value: ["name"],
                target_func: "v1",
                sortOrderKey: false,
            },
            email: {
                type: "string",
                en_title: "email",
                fa_title: "ایمیل",
                sortOrderKey: false,
                filters: ["reg"],
                isAutoComplate: false,
                isOptional: false,
            },
            isEmailRegistered: {
                type: "boolean",
                en_title: "isEmailRegistered",
                fa_title: "وضعیت تایید ایمیل",
                sortOrderKey: false,
                filters: ["eq"],
                isAutoComplate: false,
                isOptional: true,
            },
            phoneNumber: {
                type: "string",
                en_title: "phoneNumber",
                fa_title: "شماره تلفن",
                sortOrderKey: false,
                filters: ["reg"],
                isAutoComplate: false,
                isOptional: false,
            },
            phoneRegistered: {
                type: "boolean",
                en_title: "phoneRegistered",
                fa_title: "وضعیت تایید موبایل",
                sortOrderKey: false,
                filters: ["eq"],
                isAutoComplate: false,
                isOptional: true,
            },
            userName: {
                type: "string",
                en_title: "userName",
                fa_title: "نام کاربری",
                sortOrderKey: false,
                filters: ["reg"],
                isAutoComplate: false,
                isOptional: true,
            },
            passwordLastChange: {
                type: "date",
                en_title: "passwordLastChange",
                fa_title: "تاریخ آخرین تغییر رمز",
                sortOrderKey: false,
                filters: ["gte", "lte"],
                isAutoComplate: false,
                isOptional: true,
            },
            createAt: {
                type: "date",
                en_title: "createAt",
                fa_title: "تاریخ ثبت",
                sortOrderKey: false,
                filters: ["gte", "lte"],
                isAutoComplate: false,
                isOptional: true,
            },
            lastLogIn: {
                type: "date",
                en_title: "lastLogIn",
                fa_title: "آخرین ورود",
                sortOrderKey: false,
                filters: ["gte", "lte"],
                isAutoComplate: false,
                isOptional: true,
            },
            towFactorLogIn: {
                type: "boolean",
                en_title: "towFactorLogIn",
                fa_title: "ورود دومرحله ای فعال",
                sortOrderKey: false,
                filters: ["gte", "lte"],
                isAutoComplate: false,
                isOptional: true,
            },
            towFactorEnable: {
                type: "boolean",
                en_title: "towFactorEnable",
                fa_title: "آخرین ورود",
                sortOrderKey: false,
                filters: ["eq"],
                isAutoComplate: false,
                isOptional: true,
            },
        },
        paginationUrl: "/admines",
        searchUrl: "/admines",
        auto_search_url: "/admines?",
        auto_search_key: "name$reg",
        auto_search_title: "نام مدیر",
        auto_filter_name: "name",
        auto_search_submit: "_id$list",
        auto_filter_idKey: "_id",
        serverType: "",
        tableLabel: "admins",
        actions: [
            {
                api: "",
                type: "setting",
                route: "/panel/permission/file-manager-permission/$_id",
                queryName: "adminid",
            },
            {
                api: "",
                type: "insert",
                route: "/panel/permission/newadmin",
                queryName: "adminid",
                text: "ادمین جدید",
            },
            {
                api: "",
                type: "edit_modal",
                route: "/panel/permission/newadmin",
                queryName: "",
            },
        ],
    },
    actions: role_1.actions,
    collectionName: "admin",
    adminRepo: exports.adminRepo,
});
exports.default = admins;
