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
exports.FileManagerPermissionController = void 0;
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/fileManagerPermission/repository"));
const cache_1 = __importDefault(require("../../cache"));
const zod_1 = require("zod");
const method_1 = require("../../decorators/method");
const parameters_1 = require("../../decorators/parameters");
const repository_2 = __importDefault(require("../repositories/system/repository"));
class FileManagerPermissionController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.systemConfRepo = new repository_2.default();
    }
    async getCurrentPermission(path, admin, session) {
        let fileManager = session["fileManager"];
        if (!fileManager) {
            return {
                status: 500,
                message: "سرور فایل تنظیم نشده است"
            };
        }
        try {
            var data = await this.repository.findOne({
                admin: admin._id,
                cdn: fileManager._id,
                "pathsPermission.path": path
            }, {
                projection: {
                    "pathsPermission.$": 1
                }
            });
            return {
                status: 200,
                data: (data === null || data === void 0 ? void 0 : data.pathsPermission[0]) || {}
            };
        }
        catch (error) {
            throw error;
        }
    }
    getConfigs(path, cdn, admin) {
    }
    async editPermission(body) {
        try {
            let isExists = await this.repository.isExists({
                admin: body.admin,
                cdn: body.cdn
            });
            if (!isExists) {
                return this.create(body);
            }
            isExists = await this.repository.isExists({
                admin: body.admin,
                cdn: body.cdn,
                "pathsPermission.path": body.pathsPermission.path
            });
            if (isExists) {
                return this.editOne({
                    admin: body.admin,
                    cdn: body.cdn,
                    "pathsPermission.path": body.pathsPermission.path
                }, {
                    $set: {
                        size: body.size,
                        "pathsPermission.$": body.pathsPermission
                    }
                }, {
                    ok: true
                });
            }
            return this.editOne({
                admin: body.admin,
                cdn: body.cdn
            }, {
                $set: {
                    size: body.size,
                },
                $push: {
                    "pathsPermission": body.pathsPermission
                }
            }, {
                ok: true
            });
        }
        catch (error) {
            throw error;
        }
    }
    async getPermission(admin, cdn) {
        return this.findOne({
            admin,
            cdn
        });
    }
    async getPermissionByPath(admin, cdn, path) {
        try {
            var data = await this.repository.findOne({
                admin: admin,
                cdn: cdn,
                "pathsPermission.path": path
            }, {
                projection: {
                    "pathsPermission.$": 1
                }
            });
            if (data == null) {
                return {
                    status: 404
                };
            }
            return {
                status: 200,
                data: (data === null || data === void 0 ? void 0 : data.pathsPermission[0]) || {}
            };
        }
        catch (error) {
            throw error;
        }
    }
    async disable(admin, cdn, path) {
        if (path == "") {
            path = "/";
        }
        let isExists = await this.repository.isExists({
            admin: admin,
            cdn: cdn,
            "pathsPermission.path": path
        });
        if (!isExists) {
            return this.editOne({
                admin: admin,
                cdn: cdn,
            }, {
                $push: {
                    pathsPermission: {
                        path,
                        allowedActions: [],
                        showType: [],
                        uploadTypes: [],
                        recurcive: true,
                        status: false
                    }
                }
            });
        }
        return this.editOne({
            admin: admin,
            cdn: cdn,
            "pathsPermission.path": path
        }, {
            $set: {
                "pathsPermission.$.status": false
            }
        }, {
            ok: true
        });
    }
    async enable(admin, cdn, path) {
        if (path == "") {
            path = "/";
        }
        let isExists = await this.repository.isExists({
            admin: admin,
            cdn: cdn,
            "pathsPermission.path": path
        });
        if (!isExists) {
            return this.editOne({
                admin: admin,
                cdn: cdn,
            }, {
                $push: {
                    pathsPermission: {
                        path,
                        allowedActions: [],
                        showType: [],
                        uploadTypes: [],
                        recurcive: true,
                        status: true
                    }
                }
            });
        }
        return this.editOne({
            admin: admin,
            cdn: cdn,
            "pathsPermission.path": path
        }, {
            $set: {
                "pathsPermission.$.status": true
            }
        }, {
            ok: true
        });
    }
    async deletePath(admin, cdn, path) {
        try {
            return this.editOne({
                admin,
                cdn
            }, {
                $pull: {
                    "pathsPermission": {
                        path
                    }
                }
            }, {
                ok: true
            });
        }
        catch (error) {
            throw error;
        }
    }
    async addExtName(type, ext) {
        try {
            let conf = await this.systemConfRepo.getConfigValue("cdn_" + type);
            if (conf == undefined) {
                conf = [];
                await this.systemConfRepo.insert({
                    key: "cdn_" + type,
                    value: [],
                    type: "Array"
                });
            }
            if (!conf.includes(ext)) {
                conf.push(ext);
            }
            await this.systemConfRepo.updateOne({
                key: "cdn_" + type
            }, {
                $set: {
                    value: conf
                }
            });
            return {
                status: 200
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getExtName() {
        try {
            let showConf = await this.systemConfRepo.getConfigValue("cdn_" + "show");
            if (showConf == undefined) {
                showConf = [];
            }
            let uploadConf = await this.systemConfRepo.getConfigValue("cdn_" + "upload");
            if (uploadConf == undefined) {
                uploadConf = [];
            }
            return {
                status: 200,
                data: {
                    uploadConf,
                    showConf
                }
            };
        }
        catch (error) {
            throw error;
        }
    }
    initApis() {
    }
}
exports.FileManagerPermissionController = FileManagerPermissionController;
__decorate([
    (0, method_1.Get)("/current"),
    __param(0, (0, parameters_1.Query)({
        destination: "path",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Admin)()),
    __param(2, (0, parameters_1.Session)())
], FileManagerPermissionController.prototype, "getCurrentPermission", null);
__decorate([
    (0, method_1.Get)("/configs"),
    __param(0, (0, parameters_1.Query)({
        destination: "path",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "cdn",
        schema: controller_1.default.id
    })),
    __param(2, (0, parameters_1.Query)({
        destination: "admin",
        schema: controller_1.default.id
    }))
], FileManagerPermissionController.prototype, "getConfigs", null);
__decorate([
    (0, method_1.Post)(""),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            admin: controller_1.default.id,
            cdn: controller_1.default.id,
            pathsPermission: zod_1.z.object({
                path: zod_1.z.string(),
                allowedActions: zod_1.z.array(zod_1.z.enum([
                    'zip',
                    'unzip',
                    'view',
                    'copy',
                    'delete',
                    'upload',
                    'rename',
                    'directory',
                    'delete-directory',
                    'rename-directory',
                    'move',
                    'permission'
                ])),
                showType: zod_1.z.array(zod_1.z.string()).optional(),
                uploadTypes: zod_1.z.array(zod_1.z.string()).optional(),
                recurcive: zod_1.z.boolean().default(true),
                status: zod_1.z.boolean().default(true)
            }),
            size: zod_1.z.number().positive().default(0)
        })
    }))
], FileManagerPermissionController.prototype, "editPermission", null);
__decorate([
    (0, method_1.Get)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "admin",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "cdn",
        schema: controller_1.default.id
    }))
], FileManagerPermissionController.prototype, "getPermission", null);
__decorate([
    (0, method_1.Get)("/by-path"),
    __param(0, (0, parameters_1.Query)({
        destination: "admin",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "cdn",
        schema: controller_1.default.id
    })),
    __param(2, (0, parameters_1.Query)({
        destination: "path",
        schema: zod_1.z.string()
    }))
], FileManagerPermissionController.prototype, "getPermissionByPath", null);
__decorate([
    (0, method_1.Post)("/disable"),
    __param(0, (0, parameters_1.Body)({
        destination: "admin",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "cdn",
        schema: controller_1.default.id
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "path",
        schema: zod_1.z.string().default("")
    }))
], FileManagerPermissionController.prototype, "disable", null);
__decorate([
    (0, method_1.Post)("/enable"),
    __param(0, (0, parameters_1.Body)({
        destination: "admin",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "cdn",
        schema: controller_1.default.id
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "path",
        schema: zod_1.z.string().default("")
    }))
], FileManagerPermissionController.prototype, "enable", null);
__decorate([
    (0, method_1.Post)("/delete"),
    __param(0, (0, parameters_1.Body)({
        destination: "admin",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "cdn",
        schema: controller_1.default.id
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "path",
        schema: zod_1.z.string()
    }))
], FileManagerPermissionController.prototype, "deletePath", null);
__decorate([
    (0, method_1.Post)("/ext"),
    __param(0, (0, parameters_1.Body)({
        destination: "type",
        schema: zod_1.z.enum(["show", "upload"])
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "ext",
        schema: zod_1.z.string()
    }))
], FileManagerPermissionController.prototype, "addExtName", null);
__decorate([
    (0, method_1.Get)("/ext")
], FileManagerPermissionController.prototype, "getExtName", null);
var fileManagerPermission = new FileManagerPermissionController("/fileManagerPermission", new repository_1.default({
    cacheService: new cache_1.default("fileManagerPermission")
}), {
    insertSchema: zod_1.z.object({
        admin: controller_1.default.id,
        cdn: controller_1.default.id,
        path: zod_1.z.string(),
        allowedActions: zod_1.z.enum([
            'zip',
            'unzip',
            'view',
            'copy',
            'delete',
            'upload',
            'rename',
            'directory',
            'delete-directory',
            'rename-directory',
            'move'
        ])
    })
});
// log.addRouteWithMeta("es/search", "get" , log.search.bind(log),BaseController.searcheMeta)
exports.default = fileManagerPermission;
