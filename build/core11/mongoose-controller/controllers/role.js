"use strict";
// export Role
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
exports.RoleController = void 0;
const method_1 = require("../../decorators/method");
const controller_1 = __importDefault(require("../controller"));
const zod_1 = require("zod");
const parameters_1 = require("../../decorators/parameters");
const repository_1 = __importDefault(require("../repositories/language/repository"));
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
const readFile = (0, util_1.promisify)(fs_1.default.readFile);
class RoleController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.adminRepo = options.adminRepo;
        this.adminRepo.roleRepo = repo;
        this.actions = options.actions;
        this.langRepo = new repository_1.default();
    }
    async getActions(role, subPart, session) {
        try {
            let data = await this.repository.getActions(subPart, role);
            let langMap = {};
            if (session.language) {
                try {
                    let lang = await this.langRepo.findById(session.language);
                    if (lang === null || lang === void 0 ? void 0 : lang.filePath) {
                        var langJSON = JSON.parse((await readFile(lang.filePath)).toString("utf-8"));
                        langMap = langJSON.actions;
                    }
                    for (let i = 0; i < data.length; i++) {
                        data[i].action.title = langMap[`${data[i].action.url}&${data[i].action.method}`] || data[i].action.title;
                    }
                }
                catch (error) {
                    console.log(error);
                }
            }
            return {
                status: 200,
                data
            };
        }
        catch (error) {
            throw error;
        }
    }
    schemaTrnaslate(schema, path, value) {
        if (!path.includes(".")) {
            schema[path].persianName = value;
        }
        else {
            let paths = path.split(".");
            let first = paths.shift();
            schema[first]['sub'] = this.schemaTrnaslate(schema[first]['sub'], paths.join("."), value);
        }
        return schema;
    }
    async getSchemas(role, subPart, session) {
        try {
            let data = await this.repository.getSchemas(subPart, role);
            let langMap = {};
            if (session.language) {
                try {
                    let lang = await this.langRepo.findById(session.language);
                    if (lang === null || lang === void 0 ? void 0 : lang.filePath) {
                        var langJSON = JSON.parse((await readFile(lang.filePath)).toString("utf-8"));
                        langMap = langJSON.schemas;
                    }
                    for (let i = 0; i < data.length; i++) {
                        var schemaLang = langMap[data[i].collectionName];
                        for (const key in schemaLang) {
                            data[i].collectionSchema = this.schemaTrnaslate(data[i].collectionSchema, key, schemaLang[key]);
                        }
                    }
                }
                catch (error) {
                    console.log(error);
                }
            }
            return {
                status: 200,
                data
            };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async updateActions(role, subPart, actions) {
        try {
            return {
                status: 200,
                data: await this.repository.updateActions(subPart, role, actions)
            };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async updateSchemas(role, schema, subPart, fields) {
        try {
            return {
                status: 200,
                data: await this.repository.updateSchema(subPart, role, schema, fields)
            };
        }
        catch (error) {
            throw error;
        }
    }
    async merge(roles, role) {
        try {
            return {
                status: 200,
                data: await this.repository.merge(roles, role)
            };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async getSpecialPermission(subPart, role, session) {
        let data = this.actions[subPart];
        if (!data)
            return {
                status: 200,
                data: {}
            };
        let config = (await this.repository.getPermissionModuleAction(subPart, role)).config;
        let langMap = {};
        if (session.language) {
            try {
                let lang = await this.langRepo.findById(session.language);
                if (lang === null || lang === void 0 ? void 0 : lang.filePath) {
                    var langJSON = JSON.parse((await readFile(lang.filePath)).toString("utf-8"));
                    langMap = langJSON.moduleActions[subPart];
                }
            }
            catch (error) {
                console.log(error);
            }
        }
        for (let i = 0; i < data.length; i++) {
            if (config[data[i].name] != undefined)
                data[i].value = config[data[i].name];
            data[i].showTitle = langMap[data[i].name] || data[i].showTitle;
        }
        return {
            status: 200,
            data
        };
    }
    async setSpecialPermission(role, subPart, actions) {
        try {
            await this.repository.setPermissionModuleAction(subPart, role, actions);
            return {
                status: 200,
                data: {}
            };
        }
        catch (error) {
            throw error;
        }
    }
    async paginate(page, limit, admin, queryParam, query, options) {
        query = await this.searchHelper(queryParam);
        if (query == undefined) {
            query = {};
        }
        if (!(admin === null || admin === void 0 ? void 0 : admin.isSuperAdmin)) {
            var roles = await this.repository.getRoles((admin === null || admin === void 0 ? void 0 : admin.role) || "");
            if (!query['_id']) {
                query['_id'] = {};
            }
            query['_id']['$in'] = roles;
        }
        return super.paginate(page, limit, query);
    }
}
exports.RoleController = RoleController;
__decorate([
    (0, method_1.Get)("/actions"),
    __param(0, (0, parameters_1.Query)({
        destination: "role",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "subPart",
        schema: zod_1.z.string()
    })),
    __param(2, (0, parameters_1.Session)())
], RoleController.prototype, "getActions", null);
__decorate([
    (0, method_1.Get)("/schemas"),
    __param(0, (0, parameters_1.Query)({
        destination: "role",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "subPart",
        schema: zod_1.z.string()
    })),
    __param(2, (0, parameters_1.Session)())
], RoleController.prototype, "getSchemas", null);
__decorate([
    (0, method_1.Post)("/actions"),
    __param(0, (0, parameters_1.Body)({
        destination: "role",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "subPart",
        schema: zod_1.z.string()
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "actions",
        schema: zod_1.z.array(controller_1.default.id)
    }))
], RoleController.prototype, "updateActions", null);
__decorate([
    (0, method_1.Post)("/schemas"),
    __param(0, (0, parameters_1.Body)({
        destination: "role",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "schema",
        schema: controller_1.default.id
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "subPart",
        schema: zod_1.z.string()
    })),
    __param(3, (0, parameters_1.Body)({
        destination: "fields",
        schema: zod_1.z.array(zod_1.z.string())
    }))
], RoleController.prototype, "updateSchemas", null);
__decorate([
    (0, method_1.Post)("/merge"),
    __param(0, (0, parameters_1.Body)({
        destination: "roles",
        schema: zod_1.z.array(controller_1.default.id)
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "role",
        schema: zod_1.z.object({
            name: zod_1.z.string(),
            parent: controller_1.default.id.optional()
        })
    }))
], RoleController.prototype, "merge", null);
__decorate([
    (0, method_1.Get)("/special/permissions"),
    __param(0, (0, parameters_1.Query)({
        destination: "subPart",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "role",
        schema: controller_1.default.id
    })),
    __param(2, (0, parameters_1.Session)())
], RoleController.prototype, "getSpecialPermission", null);
__decorate([
    (0, method_1.Post)("/special/permissions"),
    __param(0, (0, parameters_1.Body)({
        destination: "role",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "subPart",
        schema: zod_1.z.string()
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "actions",
        schema: controller_1.default.search
    }))
], RoleController.prototype, "setSpecialPermission", null);
__decorate([
    __param(2, (0, parameters_1.Admin)()),
    __param(3, (0, parameters_1.Query)({
        // destination : "",
        schema: controller_1.default.search.optional()
    }))
], RoleController.prototype, "paginate", null);
