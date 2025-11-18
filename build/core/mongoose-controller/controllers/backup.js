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
exports.BackupController = void 0;
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/backup/repository"));
const cache_1 = __importDefault(require("../../cache"));
const zod_1 = require("zod");
const repository_2 = __importDefault(require("../repositories/fileManagerConfig/repository"));
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
const method_1 = require("../../decorators/method");
const parameters_1 = require("../../decorators/parameters");
const process_1 = require("process");
const random_1 = __importDefault(require("../../random"));
const smsMessager_1 = __importDefault(require("../../messaging/smsMessager"));
const speakeasy_1 = require("speakeasy");
const fileManager_1 = require("../../services/fileManager");
const path_1 = require("path");
class BackupController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.fileManagerRepo = new repository_2.default();
        this.population = [{
                path: "cdn",
                select: ["title"]
            }];
    }
    async create(doc) {
        try {
            let cdn = await this.fileManagerRepo.findOne({
                isBackup: true,
                status: true,
                _id: {
                    $eq: doc.cdn
                },
                mirrorCDN: {
                    $exists: false
                }
            });
            if (cdn == null) {
                return {
                    status: 400,
                    message: "سرور فایل وارد شده نامعتبر است"
                };
            }
        }
        catch (error) {
            throw error;
        }
        return await super.create(doc);
    }
    async getValidCdns() {
        try {
            let cdns = await this.fileManagerRepo.findAll({
                status: true,
                isBackup: true,
                mirrorCDN: {
                    $exists: false
                }
            }, {
                projection: {
                    title: 1,
                    type: 1
                }
            });
            return {
                data: cdns,
                status: 200
            };
        }
        catch (error) {
            throw error;
        }
    }
    async find(id, queryInfo) {
        return super.findOne({
            _id: id
        }, {
            population: [{
                    path: "cdn",
                    select: ["title"]
                }]
        });
    }
    paginate(page, limit, query, options, ...params) {
        if (options == undefined) {
            options = {};
        }
        options.population = [{
                path: "cdn",
                select: ["title"]
            }];
        return super.paginate(page, limit, query, options);
    }
    async update(id, data) {
        try {
            let validate = this.validateBackup(data);
            if (validate == false) {
                return {
                    status: 400,
                    message: "اطلاعات وارد شده کامل نیست"
                };
            }
            let cdn = await this.fileManagerRepo.findOne({
                isBackup: true,
                status: true,
                _id: {
                    $eq: data.cdn
                },
                mirrorCDN: {
                    $exists: false
                }
            });
            if (cdn == null) {
                return {
                    status: 400,
                    message: "سرور فایل وارد شده نامعتبر است"
                };
            }
            return this.editById(id, {
                $set: data
            });
        }
        catch (error) {
            throw error;
        }
    }
    validateBackup(data) {
        if (data.periodType == "hourly") {
            let periodConfig = data.periodConfig;
            if ((periodConfig === null || periodConfig === void 0 ? void 0 : periodConfig.hourly) == undefined || periodConfig.hourly.length == 0) {
                return false;
            }
        }
        else if (data.periodType == "daily") {
            let periodConfig = data.periodConfig;
            if ((periodConfig === null || periodConfig === void 0 ? void 0 : periodConfig.hour) == undefined || periodConfig.minute == undefined) {
                return false;
            }
        }
        else if (data.periodType == "weekly") {
            let periodConfig = data.periodConfig;
            if ((periodConfig === null || periodConfig === void 0 ? void 0 : periodConfig.weekDays) == undefined || periodConfig.weekDays.length == 0) {
                return false;
            }
        }
        else {
            let periodConfig = data.periodConfig;
            if ((periodConfig === null || periodConfig === void 0 ? void 0 : periodConfig.monthly) == undefined || periodConfig.monthly.length == 0) {
                return false;
            }
        }
        return true;
    }
    async getBackUpServers() {
        try {
            var readFile = (0, util_1.promisify)(fs_1.default.readFile);
            return {
                data: JSON.parse(await readFile("./back_up.json", "utf8")),
                status: 200
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getLogs(backupId) {
        try {
            let backups = await this.repository.backupLogRepo.findAll({
                backupId,
                isDelete: false
            }, {
                sort: {
                    _id: -1
                }
            });
            return {
                status: 200,
                data: backups
            };
        }
        catch (error) {
            throw error;
        }
    }
    async restore(logId, code, session, admin) {
        try {
            if (session["totp_backup"] == undefined) {
                return {
                    status: 403,
                };
            }
            if (session["totp_backup"] == "sms") {
                if (code != session["totp_backup_random"]
                    || new Date > session["totp_backup_expire"]) {
                    return {
                        status: 403
                    };
                }
            }
            else if (session["totp_backup"] == "totp") {
                let isVerified = speakeasy_1.totp.verify({
                    secret: admin.towFactorTocken || "",
                    encoding: "ascii",
                    token: code
                });
                if (!isVerified) {
                    return {
                        status: 403,
                    };
                }
            }
            const log = await this.repository.getLog(logId);
            // console.log(log, logId)
            if (log == null) {
                return {
                    status: 404,
                    message: "not found"
                };
            }
            let cdnConfig = await this.fileManagerRepo.findById(log.cdn);
            if (cdnConfig == null) {
                return {
                    status: 404,
                    message: "cdn found"
                };
            }
            let finalFile = await this.repository.download(log.files, cdnConfig);
            if (finalFile) {
                let current = await this.repository.backupAndReplaceData(finalFile, "temp/");
                await fileManager_1.DiskFileManager.move(current.path, "src/uploads/tmp/");
                const rand = random_1.default.generateHashStr(25);
                await fileManager_1.DiskFileManager.rename("src/uploads/tmp/" + (0, path_1.basename)(current.path), `src/uploads/tmp/${rand}.zip`);
                return {
                    status: 200,
                    data: `/uploads/tmp/${rand}.zip`,
                };
            }
            return {
                status: 200
            };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async downloadBackup(logId, code, session, admin) {
        try {
            if (session["totp_backup"] == undefined) {
                return {
                    status: 403,
                };
            }
            if (session["totp_backup"] == "sms") {
                if (code != session["totp_backup_random"]
                    || new Date > session["totp_backup_expire"]) {
                    return {
                        status: 403
                    };
                }
            }
            else if (session["totp_backup"] == "totp") {
                let isVerified = speakeasy_1.totp.verify({
                    secret: admin.towFactorTocken || "",
                    encoding: "ascii",
                    token: code
                });
                if (!isVerified) {
                    return {
                        status: 403,
                    };
                }
            }
            const log = await this.repository.getLog(logId);
            if (log == null) {
                return {
                    status: 404,
                    message: "not found"
                };
            }
            let cdnConfig = await this.fileManagerRepo.findById(log.cdn);
            if (cdnConfig == null) {
                return {
                    status: 404,
                    message: "cdn found"
                };
            }
            let finalFile = await this.repository.download(log.files, cdnConfig);
            return {
                status: 200,
                isFilePath: true,
                data: (0, process_1.cwd)() + "/" + finalFile,
                responseHeader: {
                    "Content-Type": "application/zip"
                },
            };
        }
        catch (error) {
            throw error;
        }
    }
    async verifyRestore(admin, session) {
        try {
            // console.log( admin)
            if (admin.towFactorTocken) {
                session["totp_backup"] = "totp";
                return {
                    status: 200,
                    data: {
                        type: "totp",
                    },
                    session
                };
            }
            else {
                let random = random_1.default.randomNumber();
                let result = await smsMessager_1.default.send({
                    template: "verifyBackup",
                    parameters: {
                        random
                    },
                    receptor: admin.phoneNumber
                });
                if (result) {
                    session["totp_backup"] = "sms";
                    session["totp_backup_expire"] = new Date(Date.now() + (1000 * 120));
                    session["totp_backup_random"] = random;
                    return {
                        status: 200,
                        data: {
                            type: "sms"
                        },
                        session
                    };
                }
                else {
                    return {
                        status: 500
                        // session
                    };
                }
            }
        }
        catch (error) {
        }
        return {
            status: 200
        };
    }
    initApis() {
        super.initApis();
        this.addRoute("/cdns", "get", this.getBackUpServers.bind(this));
    }
}
exports.BackupController = BackupController;
__decorate([
    (0, method_1.Get)("/cdn/valids")
], BackupController.prototype, "getValidCdns", null);
__decorate([
    (0, method_1.Get)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    }))
], BackupController.prototype, "find", null);
__decorate([
    (0, method_1.Put)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            cdn: controller_1.default.id.optional(),
            path: zod_1.z.string(),
            backupType: zod_1.z.enum(["source", "database", "full"]),
            dbConfig: zod_1.z.object({
                type: zod_1.z.enum(["mongodb", "postgresql"]),
                host: zod_1.z.string(),
                port: zod_1.z.coerce.number().positive().int(),
                username: zod_1.z.string(),
                password: zod_1.z.string(),
                database: zod_1.z.string(),
                auth_db: zod_1.z.string().optional()
            }).optional(),
            isInternalDB: zod_1.z.boolean().default(true),
            periodType: zod_1.z.enum(["hourly", "daily", "weekly", "monthly", "custom"]),
            periodConfig: controller_1.default.search,
            deletionSchedule: zod_1.z.coerce.number().int().positive().default(10),
        })
    }))
], BackupController.prototype, "update", null);
__decorate([
    (0, method_1.Get)("/logs"),
    __param(0, (0, parameters_1.Query)({
        destination: "backup",
        schema: controller_1.default.id
    }))
], BackupController.prototype, "getLogs", null);
__decorate([
    (0, method_1.Post)("/restore"),
    __param(0, (0, parameters_1.Body)({
        destination: "logId",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "code",
        schema: zod_1.z.string().default("12345")
    })),
    __param(2, (0, parameters_1.Session)()),
    __param(3, (0, parameters_1.Admin)())
], BackupController.prototype, "restore", null);
__decorate([
    (0, method_1.Get)("/download", {
        apiDoc: {
            "responses": {
                "200": {
                    "description": "A zip file containing data",
                    "content": {
                        "application/zip": {
                            "schema": {
                                "type": "string",
                                "format": "binary"
                            }
                        }
                    }
                }
            }
        }
    }),
    __param(0, (0, parameters_1.Query)({
        destination: "logId",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "code",
        schema: zod_1.z.string().default("12345")
    })),
    __param(2, (0, parameters_1.Session)()),
    __param(3, (0, parameters_1.Admin)())
], BackupController.prototype, "downloadBackup", null);
__decorate([
    (0, method_1.Post)("/verify"),
    __param(0, (0, parameters_1.Admin)()),
    __param(1, (0, parameters_1.Session)())
], BackupController.prototype, "verifyRestore", null);
var backup = new BackupController("/backup", new repository_1.default({
    cacheService: new cache_1.default("backup")
}), {
    insertSchema: zod_1.z.object({
        cdn: controller_1.default.id.optional(),
        path: zod_1.z.string(),
        backupType: zod_1.z.enum(["source", "database", "full"]),
        dbConfig: zod_1.z.object({
            type: zod_1.z.enum(["mongodb", "postgresql"]),
            host: zod_1.z.string(),
            port: zod_1.z.coerce.number().positive().int(),
            username: zod_1.z.string(),
            password: zod_1.z.string(),
            database: zod_1.z.string(),
            auth_db: zod_1.z.string().optional()
        }).optional(),
        isInternalDB: zod_1.z.boolean().default(true),
        periodType: zod_1.z.enum(["hourly", "daily", "weekly", "monthly", "custom"]),
        periodConfig: zod_1.z.object({
            hour: zod_1.z.coerce.number().int().min(0).max(23).optional(),
            minute: zod_1.z.coerce.number().int().min(0).max(59).optional(),
            hourly: zod_1.z.array(zod_1.z.object({
                hour: zod_1.z.coerce.number().int().min(0).max(23).optional(),
                minute: zod_1.z.coerce.number().int().min(0).max(59).optional(),
            })).optional(),
            weekDays: zod_1.z.array(zod_1.z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"])).optional(),
            monthly: zod_1.z.array(zod_1.z.object({
                month: zod_1.z.coerce.number().int().min(1).max(11),
                day: zod_1.z.coerce.number().int().min(1).max(31)
            })).optional()
        }),
        deletionSchedule: zod_1.z.coerce.number().int().positive().default(10),
    })
});
exports.default = backup;
