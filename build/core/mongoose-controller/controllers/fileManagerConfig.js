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
exports.FileManagerConfigController = void 0;
const repository_1 = __importDefault(require("../repositories/fileManagerConfig/repository"));
const controller_1 = __importDefault(require("../controller"));
const mongoose_1 = require("mongoose");
const zod_1 = require("zod");
const parameters_1 = require("../../decorators/parameters");
const method_1 = require("../../decorators/method");
const fileManager_1 = __importDefault(require("../../services/fileManager"));
const ftp_1 = require("../../services/cdn/ftp");
const objectStorage_1 = require("../../services/cdn/objectStorage");
const repository_2 = require("../repositories/cdnTransfer/repository");
const repository_3 = __importDefault(require("../repositories/fileUses/repository"));
const repository_4 = __importDefault(require("../repositories/domainVideoConfig/repository"));
const repository_5 = __importDefault(require("../repositories/domainImageConfig/repository"));
class FileManagerConfigController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        if (!options) {
            options = {};
        }
        if (!options.insertSchema) {
            options.insertSchema = zod_1.z.object({
                title: zod_1.z.string(),
                type: zod_1.z.enum(["ftp", "objectStorage"]),
                hostUrl: zod_1.z.string().url(),
                config: zod_1.z.any(),
                isDefault: zod_1.z.boolean().default(false),
                isDefaultContent: zod_1.z.boolean().default(false),
                totalSize: zod_1.z.coerce.number().positive(),
                usedSize: zod_1.z.coerce.number(),
                maxSize: zod_1.z.coerce.number().int().min(0).default(100),
                filesInfo: zod_1.z.any(),
                isBackup: zod_1.z.boolean().default(false),
                status: zod_1.z.boolean().default(false)
            });
        }
        super(baseRoute, repo, options);
        this.cdnTransferRepo = new repository_2.CDN_TransferRepository();
        this.fileUsesRepo = new repository_3.default();
        this.cdn = new fileManager_1.default();
        this.domainImageRepo = new repository_5.default();
        this.domainVideoRepo = new repository_4.default();
    }
    ;
    async create(data) {
        var _a, _b;
        data.totalSize *= 1000;
        data.usedSize *= 1000;
        // if (data.isBackup) {
        //     if (data.isDefault)
        //         return {
        //             status: 400,
        //             message: "سرور بکاپ امکان تنظیم به عنوان سرور فایل پیش‌فرض را ندارد "
        //         }
        //     var conf = data.config
        //     delete data.config
        // }
        var resp = await super.create(data);
        if ((resp === null || resp === void 0 ? void 0 : resp.status) == 200) {
            if ((_a = resp.data) === null || _a === void 0 ? void 0 : _a.isDefault)
                await this.repository.updateOne({
                    isDefault: true,
                    _id: {
                        $ne: (_b = resp.data) === null || _b === void 0 ? void 0 : _b._id
                    }
                }, {
                    $set: {
                        isDefault: false
                    }
                });
        }
        return resp;
    }
    paginate(page, limit, query, options, ...params) {
        return super.paginate(1, 100, query, options);
    }
    async getDefault() {
        try {
            var document = await this.repository.findOne({
                isDefault: true
            });
        }
        catch (error) {
            throw error;
        }
        if (document == null) {
            return {
                status: 404,
                message: "یافت نشد"
            };
        }
        var doc = JSON.parse(JSON.stringify(document));
        delete doc["config"];
        return {
            status: 200,
            data: doc,
            message: "موفق"
        };
    }
    async editById(id, data) {
        try {
            var cdnConf = await this.repository.findOne({
                _id: id,
                isBackup: true
            });
            if (cdnConf != null) {
                if (data.isDefault == true)
                    return {
                        status: 400,
                        message: "سرور بکاپ امکان تنظیم به عنوان سرور فایل پیش‌فرض را ندارد "
                    };
                // var config = data.config
                // delete data.config
            }
        }
        catch (error) {
            throw error;
        }
        var resp = await super.editById(new mongoose_1.Types.ObjectId(id), {
            $set: data
        });
        if ((resp === null || resp === void 0 ? void 0 : resp.status) == 200) {
            if (data.isDefault)
                await this.repository.updateOne({
                    isDefault: true,
                    _id: {
                        $ne: id
                    }
                }, {
                    $set: {
                        isDefault: false
                    }
                });
        }
        return resp;
    }
    async delete(id) {
        try {
            if (await this.repository.isExists({
                _id: id,
                isDefault: true
            })) {
                return {
                    status: 400,
                    message: "کانفیگ پیشفرض قابل حذف نیست"
                };
            }
            if (await this.repository.isExists({
                _id: id,
                isInternal: true
            })) {
                return {
                    status: 400,
                    message: "کانفیگ داخلی قابل حذف نیست"
                };
            }
        }
        catch (error) {
            throw error;
        }
        var resp = await super.delete(new mongoose_1.Types.ObjectId(id));
        return resp;
    }
    async testServer(config) {
        try {
            // var config = await this.repository.findById(new Types.ObjectId(id))
            if (config == null) {
                return {
                    status: 404,
                    message: "موردی یافت نشد"
                };
            }
            this.cdn.initFromConfig(config);
            let r = await this.cdn.test();
            return {
                status: 200,
                data: true,
                // da
                message: "موفق"
            };
        }
        catch (error) {
            return {
                status: 200,
                data: false,
                // da
                message: error.toString()
            };
            // throw error
        }
    }
    async validateCDN(id) {
        try {
            let imageConfigs = await this.domainImageRepo.findAll({
                "upload-path.fileManager": id
            });
            let videoConfigs = await this.domainVideoRepo.findAll({
                $or: [
                    {
                        "upload-path.fileManager": id
                    },
                    {
                        "save-path.fileManager": id
                    },
                    {
                        "save-paths.fileManager": id
                    }
                ]
            });
            return {
                data: {
                    ok: imageConfigs.length == 0 && videoConfigs.length == 0,
                    imageConfigs,
                    videoConfigs
                }
            };
        }
        catch (error) {
            throw error;
        }
    }
    async startBackup(backupID, cdnID, removeAll) {
        try {
            let backup = await this.repository.findById(backupID);
            let cdn = await this.repository.findById(cdnID);
            if (backup == null || cdn == null) {
                return {
                    status: 400,
                    message: "سرور بکاپ نامعتبر"
                };
            }
            if (backup.mirrorCDN) {
                return {
                    status: 400,
                    message: "این سرور قبلا برای سرور دیگر رزرو شده است"
                };
            }
            if (backup.backups && backup.backups.length > 0) {
                return {
                    status: 400,
                    message: "این سرور ب عنوان سرور بکاپ حذف استفاده میشود"
                };
            }
            let CDNSize = cdn.totalSize;
            let backupSize = backup.totalSize;
            if (removeAll == false || backup.used) {
                backupSize -= backup.usedSize;
            }
            console.log(CDNSize, backupSize);
            if (CDNSize > backupSize) {
                return {
                    status: 400,
                    message: "سایز سرور بک آپ کمتر از سرور اصلی می‌باشد"
                };
            }
            try {
                await this.repository.updateOne({
                    _id: backupID
                }, {
                    $set: {
                        mirrorCDN: cdn,
                        used: true,
                        transfered: 0
                    }
                });
            }
            catch (error) {
            }
            this.moveFiles(cdnID, backup, true, removeAll);
            return {
                status: 200
            };
        }
        catch (error) {
            console.log("error", error);
            throw error;
        }
    }
    async startMove(to, cdnID, removeAll) {
        try {
            let backup = await this.repository.findById(to);
            let cdn = await this.repository.findById(cdnID);
            console.log(cdn);
            if (backup == null || cdn == null) {
                return {
                    status: 400,
                    message: "سرور بکاپ نامعتبر"
                };
            }
            let CDNSize = cdn.usedSize;
            let backupSize = backup.totalSize;
            if (removeAll == false || backup.used) {
                backupSize -= backup.usedSize;
            }
            if (CDNSize > backupSize) {
                return {
                    status: 400,
                    message: "سایز سرور بک آپ کمتر از سرور اصلی می‌باشد"
                };
            }
            this.moveFiles(cdnID, backup, true, removeAll);
            return {
                status: 200
            };
        }
        catch (error) {
            console.log("error", error);
            throw error;
        }
    }
    async resetBackup(name) {
        return this.editOne({
            title: name
        }, {
            $set: {
                filesInfo: {},
                usedSize: 0,
                used: false
            },
            $unset: {
                mirrorCDN: 1
            }
        });
    }
    async getRunningTransfers() {
        try {
            let running = await this.cdnTransferRepo.findAll({
                status: "running"
            });
            let result = [];
            for (let i = 0; i < running.length; i++) {
                let from = await this.repository.findById(running[i].from);
                let to = await this.repository.findById(running[i].to);
                let total = 0;
                for (const key in from === null || from === void 0 ? void 0 : from.filesInfo) {
                    total += from['filesInfo'][key]['count'];
                }
                let uploaded = (to === null || to === void 0 ? void 0 : to.transfered) || 0;
                let p = Math.round((uploaded / total) * 10000) / 100;
                if (p > 100) {
                    p = 100;
                    uploaded = total;
                }
                result.push({
                    id: running[i]._id,
                    from: from === null || from === void 0 ? void 0 : from.title,
                    to: to === null || to === void 0 ? void 0 : to.title,
                    status: running[i].status,
                    "total": total,
                    "uploaded": uploaded,
                    "percentage": p
                });
            }
            return {
                status: 200,
                data: result
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getTransferStatus(transferId) {
        try {
            let transferInfo = await this.cdnTransferRepo.findById(transferId);
            if (transferInfo == null) {
                return {
                    status: 404,
                    message: "عملیات یافت نشد"
                };
            }
            let from = await this.repository.findById(transferInfo.from);
            let to = await this.repository.findById(transferInfo.to);
            let total = 0;
            for (const key in from === null || from === void 0 ? void 0 : from.filesInfo) {
                total += from['filesInfo'][key]['count'];
            }
            let uploaded = (to === null || to === void 0 ? void 0 : to.transfered) || 0;
            let p = Math.round((uploaded / total) * 10000) / 100;
            if (p > 100) {
                p = 100;
                uploaded = total;
            }
            console.log(uploaded, total);
            const data = {
                status: transferInfo.status,
                from: from === null || from === void 0 ? void 0 : from.title,
                to: to === null || to === void 0 ? void 0 : to.title,
                "total": total,
                "uploaded": uploaded,
                "percentage": p
            };
            return {
                status: 200,
                data
            };
        }
        catch (error) {
            throw error;
        }
    }
    async moveFiles(cdnID, backupConf, isBackup, removeAll) {
        try {
            var cdn_transfer = await this.cdnTransferRepo.insert({
                from: cdnID,
                to: backupConf._id,
                isBackup
            });
        }
        catch (error) {
            await this.repository.updateOne({
                _id: cdnID
            }, {
                $set: {
                    readonly: false
                }
            });
            await this.repository.updateOne({
                _id: backupConf._id
            }, {
                $unset: {
                    used: 1,
                    mirrorCDN: 1
                }
            });
            return;
        }
        try {
            let cdn = new fileManager_1.default(cdnID);
            await cdn.init();
            await this.repository.updateOne({
                _id: cdnID
            }, {
                $set: {
                    readonly: true
                }
            });
            console.log("backupConf", backupConf);
            var backUpCDN;
            if (backupConf.type == "ftp") {
                backUpCDN = new ftp_1.FTP(backupConf.config.url, backupConf.config.user, backupConf.config.pass, backupConf.hostUrl, backupConf._id);
            }
            else {
                backUpCDN = new objectStorage_1.S3(backupConf.config.accessKey, backupConf.config.secretKey, backupConf.config.serviceUrl, backupConf.config.bucket, backupConf.hostUrl, backupConf._id);
            }
            if (removeAll) {
                let hostUrl = backupConf['hostUrl'];
                let isExists = await this.fileUsesRepo.isExists({
                    file: {
                        $regex: new RegExp(hostUrl)
                    }
                });
                if (!isExists) {
                    let mirrorCDN = new fileManager_1.default(backupConf._id);
                    await mirrorCDN.init();
                    await mirrorCDN.removeAll();
                }
            }
            await cdn.backup("", backUpCDN);
            await this.repository.updateOne({
                _id: cdnID
            }, {
                $set: {
                    readonly: false
                }
            });
            await this.cdnTransferRepo.updateOne({
                _id: cdn_transfer._id
            }, {
                $set: {
                    finishedAt: new Date(),
                    status: "success"
                }
            });
        }
        catch (error) {
            console.log(error);
            await this.repository.updateOne({
                _id: cdnID
            }, {
                $set: {
                    readonly: false
                }
            });
            await this.repository.updateOne({
                _id: backupConf._id
            }, {
                $unset: {
                    used: 1,
                    mirrorCDN: 1
                }
            });
            let err = typeof error.toJSON == "function" ? error.toJSON() : error;
            await this.cdnTransferRepo.updateOne({
                _id: cdn_transfer._id
            }, {
                $set: {
                    finishedAt: new Date(),
                    status: "faild",
                    err
                }
            });
        }
    }
    makeUniform(files, cdn, directory) {
        var _a, _b;
        var results = [];
        if (cdn.type == "ftp") {
            for (let i = 0; i < files.length; i++) {
                if (files[i].name.endsWith(".") || files[i].name.includes("---thumbnail")) {
                    continue;
                }
                var id = files[i].type == "d" ? directory + files[i].name + "/" : directory + files[i].name;
                if (files[i].path) {
                    id = files[i].path;
                    id += files[i].type == "d" && !files[i].path.endsWith("/") ? "/" : "";
                }
                if (files[i].type == "d") {
                    var subFolders = (_a = files[i].sub) === null || _a === void 0 ? void 0 : _a.filter((f) => {
                        return f.type == "d" && !f.name.endsWith(".");
                    }).length;
                    var subFiles = (_b = files[i].sub) === null || _b === void 0 ? void 0 : _b.filter((f) => {
                        return f.type != "d" && !f.name.endsWith(".") && !f.name.includes("---thumbnail");
                    }).length;
                }
                results.push({
                    id,
                    type: files[i].type == "d" ? "dir" : "file",
                    name: files[i].name,
                    size: files[i].size,
                    date: files[i].date,
                    path: files[i].path,
                    subFolders,
                    subFiles
                });
            }
        }
        else {
            for (let i = 0; i < files.length; i++) {
                if (files[i].name && (files[i].name.includes("---thumbnail"))) {
                    continue;
                }
                var names = (files[i].prefix || files[i].name).split("/");
                // var name = files[i].prefix || files[i].name
                var name = files[i].prefix ? names[names.length - 2] : names[names.length - 1];
                var id = files[i].prefix ? directory + name + "/" : directory + name;
                if (files[i].path) {
                    id = files[i].path;
                    id += files[i].prefix && !files[i].path.endsWith("/") ? "/" : "";
                }
                if (files[i].prefix != undefined) {
                    var subFolders = files[i].sub.filter((f) => {
                        return f.prefix != undefined;
                    }).length;
                    var subFiles = files[i].sub.filter((f) => {
                        return f.prefix == undefined && !f.name.includes("---thumbnail");
                    }).length;
                }
                results.push({
                    id,
                    type: files[i].prefix ? "dir" : "file",
                    name,
                    size: files[i].size,
                    date: files[i].lastModified,
                    path: files[i].path,
                    subFolders,
                    subFiles
                });
            }
        }
        return results;
    }
    initApis() {
        super.initApis();
        this.addRouteWithMeta("", "put", this.editById.bind(this), {
            "1": {
                index: 0,
                source: "query",
                destination: "id",
                schema: controller_1.default.id
            },
            "2": {
                index: 1,
                source: "body",
                schema: this.insertSchema
            }
        });
        this.addRouteWithMeta("", "get", this.findById.bind(this), {
            "1": {
                index: 0,
                source: "query",
                destination: "id",
                schema: controller_1.default.id
            }
        });
        this.addRouteWithMeta("/default", "get", this.getDefault.bind(this), {});
    }
}
exports.FileManagerConfigController = FileManagerConfigController;
__decorate([
    (0, method_1.Post)("/test"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            type: zod_1.z.enum(["ftp", "objectStorage"]),
            config: zod_1.z.any(),
        })
    }))
], FileManagerConfigController.prototype, "testServer", null);
__decorate([
    (0, method_1.Get)("/validate"),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    }))
], FileManagerConfigController.prototype, "validateCDN", null);
__decorate([
    (0, method_1.Post)("/backup/start"),
    __param(0, (0, parameters_1.Body)({
        schema: controller_1.default.id,
        destination: "backup"
    })),
    __param(1, (0, parameters_1.Body)({
        schema: controller_1.default.id,
        destination: "cdn"
    })),
    __param(2, (0, parameters_1.Body)({
        schema: zod_1.z.boolean(),
        destination: "removeAll"
    }))
], FileManagerConfigController.prototype, "startBackup", null);
__decorate([
    (0, method_1.Post)("/move/start"),
    __param(0, (0, parameters_1.Body)({
        schema: controller_1.default.id,
        destination: "to"
    })),
    __param(1, (0, parameters_1.Body)({
        schema: controller_1.default.id,
        destination: "cdn"
    })),
    __param(2, (0, parameters_1.Body)({
        schema: zod_1.z.boolean(),
        destination: "removeAll"
    }))
], FileManagerConfigController.prototype, "startMove", null);
__decorate([
    (0, method_1.Post)("/backup/reset"),
    __param(0, (0, parameters_1.Body)({
        destination: "name",
        schema: zod_1.z.string()
    }))
], FileManagerConfigController.prototype, "resetBackup", null);
__decorate([
    (0, method_1.Get)("/transfer/runnings")
], FileManagerConfigController.prototype, "getRunningTransfers", null);
__decorate([
    (0, method_1.Get)("/transfer/status"),
    __param(0, (0, parameters_1.Query)({
        destination: "transferId",
        schema: controller_1.default.id
    }))
], FileManagerConfigController.prototype, "getTransferStatus", null);
var fileManager = new FileManagerConfigController("/fileManagerConfig", new repository_1.default(), {});
exports.default = fileManager;
