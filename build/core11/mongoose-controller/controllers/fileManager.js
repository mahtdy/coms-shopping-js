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
exports.FileManager = void 0;
const fileManager_1 = __importDefault(require("../../services/fileManager"));
const repository_1 = __importDefault(require("../repositories/fileManagerConfig/repository"));
// import upload from "../../middlewares/upload"
const path_1 = __importDefault(require("path"));
const repository_2 = __importDefault(require("../repositories/fileManagerPermission/repository"));
const repository_3 = __importDefault(require("../repositories/adminCdnPermission/repository"));
const repository_4 = __importDefault(require("../repositories/fileUses/repository"));
const repository_5 = __importDefault(require("../repositories/backup/repository"));
const parameters_1 = require("../../decorators/parameters");
const controller_1 = __importDefault(require("../../controller"));
const controller_2 = __importDefault(require("../controller"));
const zod_1 = require("zod");
const method_1 = require("../../decorators/method");
const redis_cache_1 = __importDefault(require("../../redis-cache"));
const random_1 = __importDefault(require("../../random"));
const repository_6 = __importDefault(require("../repositories/cdnOperations/repository"));
const repository_7 = __importDefault(require("../repositories/cdnLockedPath/repository"));
const repository_8 = __importDefault(require("../repositories/backupFile/repository"));
const cache = new redis_cache_1.default("file_managing");
const cdn_LockedPathRepository = new repository_7.default();
cdn_LockedPathRepository.clearProccesses();
async function validatePathOperationIsPossiblle(index) {
    return (target, propertyKey, propertyDescriptor) => {
        const originalMethod = propertyDescriptor.value;
        propertyDescriptor.value = async function (...args) {
            let files = args[index];
            let type = typeof files;
            let self = this;
            try {
                // self.cdn_LockedPathRepository.
                if (type == "string") {
                    await cdn_LockedPathRepository.addPath(self.cdn.CDN_id, files);
                }
                else {
                    let q = [];
                    for (let i = 0; i < files.length; i++) {
                        q.push(...getQueryForOperations(files[i]));
                    }
                    // await cdn_LockedPathRepository.isExists(self.cdn.CDN_id as string, files)
                }
                var result = await originalMethod.apply(this, args);
            }
            catch (error) {
                throw error;
            }
            return result;
        };
        return propertyDescriptor;
    };
}
function getQueryForOperations(dir) {
    // let ors = []
    var qq = {};
    var paths = [];
    if (dir.split("/").length > 2) {
        var dirs = dir.split("/");
        paths.push("/");
        for (let i = 0; i < dirs.length; i++) {
            var q = "";
            for (let j = 0; j < i; j++) {
                q += dirs[j] + "/";
            }
            if (q != "") {
                paths.push(q);
            }
        }
    }
    else {
        paths.push("/");
        paths.push(dir);
    }
    return paths;
}
class FileManager extends controller_1.default {
    constructor(baseRoute) {
        super(baseRoute);
        this.fileManagerRepo = new repository_1.default();
        this.cdn = new fileManager_1.default();
        this.fileManagerPermission = new repository_2.default();
        this.fileManagerAdminRepo = new repository_3.default();
        this.fileUsesRepo = new repository_4.default();
        this.cdnOperationRepo = new repository_6.default();
        this.cdn_LockedPathRepository = new repository_7.default();
        this.backupFileRepo = new repository_8.default();
        this.backupRepo = new repository_5.default();
        this.verifyUpload = () => { };
        // console.log(this.getQueryForOperations("0000/content/2131/screenshot from 2024-04-14 10-59-13.png"))
        this.initApis();
    }
    async validatePathOperationIsPossiblle(files) {
        let type = typeof files;
        try {
            let q = [];
            if (type == "string") {
                q = getQueryForOperations(files);
            }
            else {
                for (let i = 0; i < files.length; i++) {
                    q.push(...getQueryForOperations(files[i]));
                }
            }
            return await cdn_LockedPathRepository.isExists({
                cdn: this.cdn.CDN_id,
                paths: q
            });
        }
        catch (error) {
            throw error;
        }
    }
    ;
    async checkFileManager(session) {
        var fileManager = session["fileManager"];
        if (!fileManager) {
            return {
                status: 400,
                message: "درخواست نامعتبر",
                data: { setId: false }
            };
        }
        return await this.doCheckFileManager(fileManager._id || fileManager.id);
    }
    async checkOtherFileManager(cdn) {
        try {
            return await this.doCheckFileManager(cdn);
        }
        catch (error) {
            throw error;
        }
    }
    async doCheckFileManager(id) {
        try {
            var isExists = await new repository_5.default().isExists({
                cdn: id,
                status: 'inProccess'
            });
            if (isExists) {
                return {
                    message: "این  سرور فایل فعلا در دسترس نیست",
                    status: 400
                };
            }
            return {
                next: true
            };
        }
        catch (error) {
            throw error;
        }
    }
    async view(directory, sort, page, limit, admin, session) {
        var _a;
        try {
            var files = await this.cdn.getFiles(directory);
            var fileManager = session["fileManager"];
            var config;
            let showType;
            if (!admin.isSuperAdmin) {
                let or = this.getPathQuery(directory, "view");
                if (or['$or']) {
                    for (let i = 0; i < or['$or'].length; i++) {
                        let q = or['$or'][i];
                        config = await this.fileManagerPermission.findOne(Object.assign({
                            admin: admin._id,
                            cdn: fileManager._id
                        }, q), {
                            projection: {
                                "pathsPermission.$": 1
                            }
                        });
                        if (config === null || config === void 0 ? void 0 : config.pathsPermission[0]) {
                            if (((_a = config === null || config === void 0 ? void 0 : config.pathsPermission[0].showType) === null || _a === void 0 ? void 0 : _a.length) == 0) {
                                showType = ['xxxx'];
                            }
                            else {
                                showType = config === null || config === void 0 ? void 0 : config.pathsPermission[0].showType;
                            }
                            break;
                        }
                    }
                }
                // console.log(or)
            }
            files = this.makeUniform(files, showType, directory);
            files = files.filter((file) => file.name != "");
            return {
                status: 200,
                data: this.trimAndSort(files, page, limit, sort)
            };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async validatePath(paths) {
        try {
            return {
                status: 200,
                data: await this.cdn.isPathExists(paths)
            };
        }
        catch (error) {
            throw error;
        }
    }
    getPermission(rights) {
        var user_p = rights['user'];
        var userNumber = 0;
        if (user_p.includes("r")) {
            userNumber += 4;
        }
        if (user_p.includes("w")) {
            userNumber += 2;
        }
        if (user_p.includes("x")) {
            userNumber += 1;
        }
        var group_p = rights['group'];
        var groupNumber = 0;
        if (group_p.includes("r")) {
            groupNumber += 4;
        }
        if (group_p.includes("w")) {
            groupNumber += 2;
        }
        if (group_p.includes("x")) {
            groupNumber += 1;
        }
        var public_p = rights['other'];
        var publicNumber = 0;
        if (public_p.includes("r")) {
            publicNumber += 4;
        }
        if (public_p.includes("w")) {
            publicNumber += 2;
        }
        if (public_p.includes("x")) {
            publicNumber += 1;
        }
        return userNumber.toString() + groupNumber.toString() + publicNumber.toString();
    }
    makeUniform(files, allowedTypes = [], directory) {
        var _a, _b, _c, _d;
        // console.log("files" , files)
        var results = [];
        if (this.cdn.type == "ftp") {
            for (let i = 0; i < files.length; i++) {
                if (files[i].name.endsWith(".") || files[i].name.includes("---thumbnail")) {
                    continue;
                }
                if (files[i].type != "d" && (allowedTypes === null || allowedTypes === void 0 ? void 0 : allowedTypes.length) && (allowedTypes === null || allowedTypes === void 0 ? void 0 : allowedTypes.length) > 0 && !allowedTypes.includes(path_1.default.extname(files[i].name).substring(1))) {
                    continue;
                }
                var id = files[i].type == "d" ? directory + files[i].name + "/" : directory + files[i].name;
                if (files[i].path) {
                    id = files[i].path;
                    id += files[i].type == "d" && !files[i].path.endsWith("/") ? "/" : "";
                }
                if (id == "recycle_bin/") {
                    continue;
                }
                if (files[i].type == "d") {
                    var subFolders = (_a = files[i].sub) === null || _a === void 0 ? void 0 : _a.filter((f) => {
                        return f.type == "d" && !f.name.endsWith(".");
                    }).length;
                    var subFiles = (_b = files[i].sub) === null || _b === void 0 ? void 0 : _b.filter((f) => {
                        var _a, _b;
                        return f.type != "d" && !((_a = f.name) === null || _a === void 0 ? void 0 : _a.endsWith(".")) && !((_b = f.name) === null || _b === void 0 ? void 0 : _b.includes("---thumbnail"));
                    }).length;
                }
                results.push({
                    id,
                    type: files[i].type == "d" ? "dir" : "file",
                    name: files[i].name,
                    size: files[i].size,
                    date: files[i].date,
                    path: files[i].path,
                    permission: this.getPermission(files[i].rights),
                    subFolders,
                    subFiles
                });
            }
        }
        else {
            for (let i = 0; i < files.length; i++) {
                if (!files[i].prefix && (allowedTypes === null || allowedTypes === void 0 ? void 0 : allowedTypes.length) && (allowedTypes === null || allowedTypes === void 0 ? void 0 : allowedTypes.length) > 0 && !allowedTypes.includes(path_1.default.extname(files[i].name).substring(1))) {
                    continue;
                }
                if (files[i].name && (files[i].name.includes("---thumbnail"))) {
                    continue;
                }
                var names = (files[i].prefix || files[i].name).split("/");
                // var name = files[i].prefix || files[i].name
                var name = files[i].prefix ? names[names.length - 2] : names[names.length - 1];
                var id = files[i].prefix ? directory + name + "/" : directory + name;
                if (id == "recycle_bin/") {
                    continue;
                }
                if (files[i].path) {
                    id = files[i].path;
                    id += files[i].prefix && !files[i].path.endsWith("/") ? "/" : "";
                }
                if (files[i].prefix != undefined) {
                    var subFolders = ((_c = files[i].sub) === null || _c === void 0 ? void 0 : _c.filter((f) => {
                        return f.prefix != undefined;
                    }).length) || 0;
                    var subFiles = ((_d = files[i].sub) === null || _d === void 0 ? void 0 : _d.filter((f) => {
                        return f.prefix == undefined && !f.name.includes("---thumbnail");
                    }).length) || 0;
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
        // console.log("result" ,results)
        return results;
    }
    trimAndSort(data, page, limit, sort) {
        if (sort == 'default') {
            // console.log("files" , files)
            data.sort(function (a, b) {
                // console
                return b.type == 'dir' && a.type == 'file' ? 1 : -1;
            });
        }
        if (sort.includes("size")) {
            let sortInfo = sort.split(":");
            let folders = data.filter((a) => {
                return a.type == "dir";
            });
            let files = data.filter((a) => {
                return a.type == "file";
            });
            if (sortInfo[sortInfo.length - 1] == "-1") {
                files.sort(function (a, b) {
                    return b.size > a.size ? 1 : -1;
                });
            }
            else {
                files.sort(function (a, b) {
                    return b.size < a.size ? 1 : -1;
                });
            }
            data = folders;
            data.push(...files);
        }
        if (sort.includes("name")) {
            let sortInfo = sort.split(":");
            let folders = data.filter((a) => {
                return a.type == "dir";
            });
            let files = data.filter((a) => {
                return a.type == "file";
            });
            if (sortInfo[sortInfo.length - 1] == "-1") {
                files.sort(function (a, b) {
                    return a.name.localeCompare(b.name);
                });
                folders.sort(function (a, b) {
                    return a.name.localeCompare(b.name);
                });
            }
            else {
                files.sort(function (a, b) {
                    return b.name.localeCompare(a.name);
                });
                folders.sort(function (a, b) {
                    return b.name.localeCompare(a.name);
                });
            }
            data = folders;
            data.push(...files);
        }
        if (sort.includes("date")) {
            let sortInfo = sort.split(":");
            let folders = data.filter((a) => {
                return a.type == "dir";
            });
            let files = data.filter((a) => {
                return a.type == "file";
            });
            if (sortInfo[sortInfo.length - 1] == "-1") {
                files.sort(function (a, b) {
                    return new Date(b.date) > new Date(a.date) ? 1 : -1;
                });
                folders.sort(function (a, b) {
                    return new Date(b.date) > new Date(a.date) ? 1 : -1;
                });
            }
            else {
                files.sort(function (a, b) {
                    return new Date(a.date) > new Date(b.date) ? 1 : -1;
                });
                folders.sort(function (a, b) {
                    return new Date(a.date) > new Date(b.date) ? 1 : -1;
                });
            }
            data = folders;
            data.push(...files);
        }
        return data.slice(((page - 1) * limit), page * limit);
    }
    async directory(directory, name) {
        try {
            var date = new Date();
            await this.cdn.createDirectory(directory, name);
            return {
                status: 200,
                data: {
                    date,
                    id: directory + name + "/",
                    name: name,
                    size: 0,
                    type: "dir"
                }
            };
        }
        catch (error) {
            throw error;
        }
    }
    async restore(p) {
        try {
            return {
                status: 200,
                data: await this.cdn.restore(p)
            };
        }
        catch (error) {
            throw error;
        }
    }
    // @Post("/restore/many")
    async restoreMany(files, admin) {
        var _a;
        try {
            // ret
            let allFiles = 0;
            var code = random_1.default.generateHashStr(32);
            for (let i = 0; i < files.length; i++) {
                allFiles += files[i].endsWith("/") && this.cdn.type != "ftp" ? ((_a = (await this.cdn.getFolderAllFiles(files[i]))) === null || _a === void 0 ? void 0 : _a.length) || 0 : 1;
            }
            console.log("allfiles", allFiles);
            let operation = await this.cdnOperationRepo.insert({
                operation: "restore",
                cdn: this.cdn.CDN_id || "",
                type: this.cdn.type,
                code,
                admin: admin._id,
                status: "running",
                info: {
                    files
                }
            });
            await cache.set(code, {
                allFiles,
                uploaded: 0,
                percentage: 0
            });
            this.cdn.restoreMany(files, code);
            return {
                status: 200,
                data: code
            };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    // @Post("/recycle/empty")
    async emptyRecycle() {
        try {
            return {
                status: 200,
                data: await this.cdn.deleteRecycle()
            };
        }
        catch (error) {
            throw error;
        }
    }
    async deleteFromTrash(p) {
        try {
            return {
                status: 200,
                data: this.cdn.deleteFromTrash(p)
            };
        }
        catch (error) {
            throw error;
        }
    }
    async deleteManyFromTrash(files, admin) {
        var _a;
        try {
            let allFiles = 0;
            var code = random_1.default.generateHashStr(32);
            // console.log(this.cdn.type, this.cdn.cdn)
            for (let i = 0; i < files.length; i++) {
                allFiles += files[i].endsWith("/") && this.cdn.type != "ftp" ? ((_a = (await this.cdn.getFolderAllFiles(files[i]))) === null || _a === void 0 ? void 0 : _a.length) || 0 : 1;
            }
            // console.log("allfiles", allFiles)
            let operation = await this.cdnOperationRepo.insert({
                operation: "hard-delete",
                cdn: this.cdn.CDN_id || "",
                type: this.cdn.type,
                code,
                admin: admin._id,
                status: "running",
                info: { files }
            });
            await cache.set(code, {
                allFiles,
                uploaded: 0,
                percentage: 0
            });
            this.cdn.deleteManyFromTrash(files, code);
            return {
                status: 200,
                data: code
            };
        }
        catch (error) {
            throw error;
        }
    }
    async checkStorage(size) {
        try {
            // console.log(this.cdn)
            let conf = await this.fileManagerRepo.findById(this.cdn.CDN_id || "");
            // console.log("conf", conf)
            let totalSize = (conf === null || conf === void 0 ? void 0 : conf.totalSize) || 1;
            let usedSize = (conf === null || conf === void 0 ? void 0 : conf.usedSize) || 0;
            // console.log(usedSize, totalSize, (usedSize + size) / totalSize) 
            if (((usedSize + size) / totalSize) > 0.95) {
                if (((usedSize + size) / totalSize) > 0.95) {
                    return {
                        status: 400,
                        data: {}
                    };
                }
            }
            return {
                status: 200,
                data: {}
            };
        }
        catch (error) {
            throw error;
        }
    }
    async abortFile(p) {
        try {
            let data = await cache.get(p);
            await cache.set("stop_" + p, "stop");
            return {
                status: 200,
                data
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getTaskStatus(code) {
        try {
            let data = await cache.get(code);
            if (data != null)
                data = JSON.parse(data);
            if (data != null && data.failed == true) {
                return {
                    status: 500,
                    data
                };
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
    async getTasksStatus(codes) {
        try {
            let data = [];
            for (let i = 0; i < codes.length; i++) {
                // let d = c
                let status = {
                    code: codes[i]
                };
                let d = await cache.get(codes[i]);
                status['info'] = d;
                if (d != null) {
                    status['info'] = JSON.parse(d);
                }
                data.push(status);
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
    async setTaskChecked(tasks) {
        try {
            await this.cdnOperationRepo.updateMany({
                _id: {
                    $in: tasks
                }
            }, {
                $set: {
                    checked: true
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async getRunningTask(admin) {
        try {
            let query = {
                $or: [
                    {
                        status: "running"
                    },
                    {
                        checked: false
                    }
                ]
            };
            if (!admin.isSuperAdmin) {
                query['admin'] = admin._id;
            }
            let tasks = await this.cdnOperationRepo.findAll(query);
            return {
                status: 200,
                data: tasks
            };
        }
        catch (error) {
            throw error;
        }
    }
    async restoreFromBackup(files, rename, admin) {
        var _a;
        if (files.length == 0) {
            return {
                status: 400,
                message: "فایلی انتخاب نشده است"
            };
        }
        for (let i = 0; i < files.length; i++) {
            let file = await this.backupFileRepo.findOne({
                backFile: files[i]
            });
            if (file == null) {
                return {
                    status: 404,
                    message: "فایل یافت نشد"
                };
            }
        }
        let codes = [];
        let info = [];
        for (let i = 0; i < files.length; i++) {
            let allFiles = 0;
            let toCdn = "";
            var code = random_1.default.generateHashStr(32);
            codes.push(code);
            let file = await this.backupFileRepo.findOne({
                backFile: files[i]
            });
            if (file == null) {
                return {
                    status: 404,
                    message: "فایل یافت نشد"
                };
            }
            toCdn = file.cdn;
            allFiles += files[i].endsWith("/") ? ((_a = (await this.cdn.getFolderAllFiles(files[i]))) === null || _a === void 0 ? void 0 : _a.length) || 0 : 1;
            let fileName = file.cdnFile;
            let name = "";
            if (fileName.endsWith("/")) {
                name = path_1.default.basename(fileName);
                name += "/";
            }
            else {
                name = path_1.default.basename(fileName);
            }
            let directory = fileName.slice(0, name.length * -1);
            console.log(this.cdn);
            let operation = await this.cdnOperationRepo.insert({
                operation: "backup-restore",
                cdn: this.cdn.CDN_id || "",
                toCdn,
                code,
                admin: admin._id,
                status: "running",
                type: this.cdn.type,
                info: {
                    files: files[i],
                    directory
                }
            });
            await cache.set(code, {
                allFiles,
                downloaded: 0,
                percentage: 0
            });
            info.push({
                files: [files[i]],
                cdn: file.cdn,
                directory: directory,
                rename,
                cacheStr: code
            });
        }
        // console.log("before move")
        this.restoreBackups(info);
        return {
            status: 200,
            data: codes
        };
    }
    async restoreBackups(info) {
        try {
            for (let i = 0; i < info.length; i++) {
                await this.cdn.restoreToOther(info[i].files, info[i].cdn, info[i].directory, {
                    rename: info[i].rename,
                    cacheStr: info[i].cacheStr
                });
            }
        }
        catch (error) {
        }
    }
    // @Post("/backup/validate")
    async validateBackup(files, session) {
        try {
            var fileManager = session["fileManager"];
            let backupFiles = await this.backupFileRepo.findAll({
                backFile: {
                    $in: files
                },
                backCDN: fileManager._id || fileManager.id
            });
            if (backupFiles.length != files.length) {
                return {
                    status: 404,
                    message: "not found"
                };
            }
            let data = [];
            for (let i = 0; i < backupFiles.length; i++) {
                let file = backupFiles[i].cdnFile;
                let name = "";
                if (file.endsWith("/")) {
                    name = path_1.default.basename(file);
                    name += "/";
                }
                else {
                    name = path_1.default.basename(file);
                }
                let dest = file.slice(0, name.length * -1);
                let r = await this.cdn.validateToCopy([file], dest, backupFiles[i].cdn.toString());
                data.push(...r);
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
    async downloadFolder(directory, admin, code) {
        var _a, _b;
        try {
            if (code == undefined) {
                code = random_1.default.generateHashStr(32);
            }
            let files = await ((_a = this.cdn) === null || _a === void 0 ? void 0 : _a.getFolderAllFiles(directory));
            // console.log("files", files?.length)
            await cache.set(code, JSON.stringify({
                allFiles: files === null || files === void 0 ? void 0 : files.length,
                downloaded: 0,
                percentage: 0
            }));
            let operation = await this.cdnOperationRepo.insert({
                operation: "download-folder",
                cdn: this.cdn.CDN_id || "",
                code,
                admin: admin._id,
                status: "running",
                info: {
                    files: [directory]
                }
            });
            (_b = this.cdn) === null || _b === void 0 ? void 0 : _b.downloadAndZipFolder(directory, code);
            return {
                status: 200,
                data: code
            };
        }
        catch (error) {
            throw error;
        }
    }
    async validateToCopy(files, dest, id) {
        try {
            // console.log("files", files)
            return {
                status: 200,
                data: await this.cdn.validateToCopy(files, dest, id)
            };
        }
        catch (error) {
            throw error;
        }
    }
    async findFolders(directory, admin, session) {
        var _a;
        try {
            var folders = (_a = (await this.cdn.findFolder(directory))) === null || _a === void 0 ? void 0 : _a.folders;
            if (!admin.isSuperAdmin) {
                var allowed = await this.fileManagerPermission.findOne({
                    admin: admin._id,
                    cdn: session["fileManager"]["_id"],
                    "pathsPermission.allowedActions": "view",
                    "pathsPermission.status": true
                });
                folders = this.filterFolders((allowed === null || allowed === void 0 ? void 0 : allowed.pathsPermission) || [], folders || [], "");
            }
            folders = folders === null || folders === void 0 ? void 0 : folders.filter((folder) => folder.name != "");
            if (directory == "") {
                let c = (folders === null || folders === void 0 ? void 0 : folders.length) || 0;
                for (let i = 0; i < folders.length; i++) {
                    // console.log("ff", (folders as any)[i].name, (folders as any)[i].name == "recycle_bin")
                    if (folders[i].name == "recycle_bin") {
                        var recycle = folders[i];
                        folders === null || folders === void 0 ? void 0 : folders.splice(i, 1);
                    }
                }
                let data = [{
                        name: "root",
                        id: directory,
                        children: folders
                    }];
                // console.log(recycle)
                if (recycle) {
                    data.push(recycle);
                }
                return {
                    status: 200,
                    data
                };
            }
            return {
                status: 200,
                data: folders
            };
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Handles file uploads to the specified directory.
     *
     * @param {string} directory - The directory to upload the files to.
     * @param {string} rename - A flag indicating whether to rename files if a file with the same name already exists.
     * @param {any[]} files - The files to be uploaded.
     * @param {boolean} uploadWithState - A flag indicating whether to upload files with their state.
     * @returns {Promise<Response>} - A promise that resolves to an Response object containing the status and data.
     * @throws {Error} - If an error occurs during the upload process.
     */
    async upload(directory, rename, files, uploadWithState) {
        try {
            var paths = [];
            for (let i = 0; i < files.length; i++) {
                paths.push({
                    path: files[i].path,
                    destination: directory + path_1.default.basename(files[i].path)
                });
            }
            if (uploadWithState) {
                let result = await this.cdn.uploadWithState(paths[0].path, paths[0].destination, true);
                // console.log("result" ,result)
                return {
                    status: 200,
                    data: result
                };
            }
            else {
                var result = await this.cdn.uploadMany(paths, {
                    rename: rename == "true",
                });
                return {
                    status: 200,
                    data: result
                };
            }
        }
        catch (error) {
            throw error;
        }
    }
    async setFileManager(id, session) {
        try {
            if (id) {
                var fileManager = await this.fileManagerRepo.findById(id);
            }
            else {
                var fileManager = await this.fileManagerRepo.getDefault();
            }
            if (fileManager == null) {
                return {
                    status: 500
                };
            }
            session["fileManager"] = fileManager;
            return {
                status: 200,
                data: { ok: true },
                session
            };
        }
        catch (error) {
            throw error;
        }
    }
    async init(session, id) {
        try {
            var fileManager = session["fileManager"];
            // console.log(fileManager)
            if (!fileManager) {
                return {
                    status: 400,
                    data: { setId: false }
                };
            }
            if (id) {
                this.cdn.CDN_id = id;
                await this.cdn.init(true);
            }
            else
                this.cdn.initFromConfig({
                    type: fileManager.type,
                    config: fileManager.config,
                    hostUrl: fileManager.hostUrl,
                    id: fileManager._id || fileManager.id
                });
        }
        catch (error) {
            throw error;
        }
        return {
            next: true
        };
    }
    filterFolders(allowed, folders, root = "") {
        var _a;
        for (let i = 0; i < folders.length; i++) {
            if (this.checkFolderAccess(allowed, root + folders[i].name + "/")) {
                folders[i].access = true;
            }
            else if (((_a = folders[i].children) === null || _a === void 0 ? void 0 : _a.length) > 0) {
                folders[i].access = false;
                folders[i].children = this.filterFolders(allowed, folders[i].children, root + folders[i].name + "/");
            }
            else {
                folders[i].access = false;
            }
        }
        return folders;
    }
    checkFolderAccess(allowed, path) {
        var index = -1;
        allowed.findIndex(function (item, i) {
            if (item.path == path) {
                index = i;
                return i;
            }
        });
        return index != -1;
    }
    async copy(files, directory, rename, admin) {
        var _a;
        try {
            let allFiles = 0;
            var code = random_1.default.generateHashStr(32);
            for (let i = 0; i < files.length; i++) {
                allFiles += files[i].endsWith("/") ? ((_a = (await this.cdn.getFolderAllFiles(files[i]))) === null || _a === void 0 ? void 0 : _a.length) || 0 : 1;
            }
            let operation = await this.cdnOperationRepo.insert({
                operation: "copy",
                cdn: this.cdn.CDN_id || "",
                code,
                admin: admin._id,
                status: "running",
                type: this.cdn.type,
                info: {
                    files,
                    directory
                }
            });
            await cache.set(code, {
                allFiles,
                uploaded: 0,
                percentage: 0
            });
            this.cdn.copy(files, directory, {
                rename,
                isConnected: false,
                cacheStr: code
            });
            return {
                status: 200,
                data: code
            };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async search(term, directory, searchType, nested, admin) {
        try {
            var files = await this.cdn.search(term, directory, {
                nested,
                searchType
            });
            var config;
            if (!admin.isSuperAdmin) {
                config = await this.fileManagerAdminRepo.findOne({
                    admin: admin._id
                });
            }
            return {
                status: 200,
                data: this.makeUniform(files, config === null || config === void 0 ? void 0 : config.showType, directory)
            };
        }
        catch (error) {
            console.log("error kiri", error);
            throw error;
        }
    }
    async zip(files, name, directory, rename, admin) {
        var _a;
        try {
            let allFiles = 0;
            var code = random_1.default.generateHashStr(32);
            for (let i = 0; i < files.length; i++) {
                allFiles += files[i].endsWith("/") ? ((_a = (await this.cdn.getFolderAllFiles(files[i]))) === null || _a === void 0 ? void 0 : _a.length) || 0 : 1;
            }
            await cache.set(code, JSON.stringify({
                allFiles,
                downloaded: 0,
                percentage: 0
            }));
            let operation = await this.cdnOperationRepo.insert({
                operation: "zip",
                cdn: this.cdn.CDN_id || "",
                code,
                admin: admin._id,
                status: "running",
                info: {
                    files,
                    directory,
                    name
                }
            });
            this.cdn.zip(files, name, directory, {
                rename,
                cacheStr: code
            });
            return {
                status: 200,
                data: code
            };
        }
        catch (error) {
            throw error;
        }
    }
    async unzip(file, directory, files, rename, admin, code) {
        try {
            if (code == undefined) {
                code = random_1.default.generateHashStr(32);
            }
            console.log(code);
            let operation = await this.cdnOperationRepo.insert({
                operation: "unzip",
                cdn: this.cdn.CDN_id || "",
                code,
                admin: admin._id,
                status: "running",
                info: {
                    file,
                    files,
                    directory
                }
            });
            this.cdn.unzip(file, directory, {
                isConnected: false,
                files,
                rename,
                cacheStr: code
            });
            return {
                status: 200,
                data: code
            };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async getZipFileInfo(file) {
        try {
            return {
                status: 200,
                data: [{
                        name: "root",
                        id: "",
                        children: await this.cdn.getZipFileInfo(file)
                    }]
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getCurentCdn(session) {
        try {
            var fileManager = session["fileManager"];
            if (!fileManager) {
                return {
                    status: 404
                };
            }
            return {
                status: 200,
                data: fileManager
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getUploadConfig(admin) {
        try {
            var config = await this.fileManagerAdminRepo.findOne({
                admin: admin._id
            });
            if (config == null) {
                return {
                    status: 200,
                    data: {
                        size: 1.5,
                        uploadTypes: []
                    }
                };
            }
            return {
                status: 200,
                data: {
                    size: 1.5,
                    uploadTypes: config.uploadTypes
                }
            };
        }
        catch (error) {
            throw error;
        }
    }
    async deleteFiles(moveToHidden, files, admin) {
        var _a, _b;
        try {
            let allFiles = 0;
            var code = random_1.default.generateHashStr(32);
            for (let i = 0; i < files.length; i++) {
                allFiles += files[i].endsWith("/") && this.cdn.type != "ftp" ? ((_a = (await this.cdn.getFolderAllFiles(files[i]))) === null || _a === void 0 ? void 0 : _a.length) || 0 : 1;
            }
            let operation = await this.cdnOperationRepo.insert({
                operation: "delete",
                cdn: this.cdn.CDN_id || "",
                moveToHidden,
                type: this.cdn.type,
                code,
                admin: admin._id,
                status: "running",
                info: {
                    files,
                    moveToHidden
                }
            });
            await cache.set(code, {
                allFiles,
                uploaded: 0,
                percentage: 0
            });
            (_b = this.cdn) === null || _b === void 0 ? void 0 : _b.removeFiles(files, moveToHidden, code);
            return {
                status: 200,
                data: code
            };
        }
        catch (error) {
            throw error;
        }
    }
    async rename(file, name, admin) {
        var _a;
        var code = random_1.default.generateHashStr(32);
        // var allFiles = file.endsWith("/") ? (await this.cdn.getFolderAllFiles(file))?.length || 0 : 1
        var allFiles = file.endsWith("/") && this.cdn.type != "ftp" ? ((_a = (await this.cdn.getFolderAllFiles(file))) === null || _a === void 0 ? void 0 : _a.length) || 0 : 1;
        let operation = await this.cdnOperationRepo.insert({
            operation: "rename",
            cdn: this.cdn.CDN_id || "",
            type: this.cdn.type,
            code,
            admin: admin._id,
            status: "running",
            info: {
                file,
                name
            }
        });
        await cache.set(code, {
            allFiles,
            uploaded: 0,
            percentage: 0
        });
        if (file.endsWith("/")) {
            file = file.substring(0, file.length - 1);
        }
        this.cdn.rename(file, name, {
            cacheStr: code
        });
        try {
            return {
                status: 200,
                data: code
            };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async getOne(path) {
        try {
            return {
                status: 200,
                data: {}
            };
        }
        catch (error) {
            throw error;
        }
    }
    async move(files, directory, rename, admin) {
        var _a;
        try {
            let allFiles = 0;
            var code = random_1.default.generateHashStr(32);
            for (let i = 0; i < files.length; i++) {
                allFiles += files[i].endsWith("/") && this.cdn.type != "ftp" ? ((_a = (await this.cdn.getFolderAllFiles(files[i]))) === null || _a === void 0 ? void 0 : _a.length) || 0 : 1;
            }
            let operation = await this.cdnOperationRepo.insert({
                operation: "move",
                cdn: this.cdn.CDN_id || "",
                type: this.cdn.type,
                code,
                admin: admin._id,
                status: "running",
                info: {
                    files,
                    directory
                }
            });
            await cache.set(code, {
                allFiles,
                uploaded: 0,
                percentage: 0
            });
            this.cdn.move(files, directory, {
                isConnected: false,
                rename,
                cacheStr: code
            });
            return {
                status: 200,
                data: code
            };
        }
        catch (error) {
            throw error;
        }
    }
    async copyToOther(files, cdn, directory, rename, admin) {
        var _a;
        try {
            let allFiles = 0;
            var code = random_1.default.generateHashStr(32);
            for (let i = 0; i < files.length; i++) {
                allFiles += files[i].endsWith("/") ? ((_a = (await this.cdn.getFolderAllFiles(files[i]))) === null || _a === void 0 ? void 0 : _a.length) || 0 : 1;
            }
            let operation = await this.cdnOperationRepo.insert({
                operation: "copyToOther",
                cdn: this.cdn.CDN_id || "",
                toCdn: cdn,
                code,
                admin: admin._id,
                status: "running",
                type: this.cdn.type,
                info: {
                    files,
                    directory
                }
            });
            await cache.set(code, {
                allFiles,
                downloaded: 0,
                percentage: 0
            });
            this.cdn.copyToOther(files, cdn, directory, false, {
                rename,
                cacheStr: code
            });
            return {
                status: 200,
                data: code
            };
        }
        catch (error) {
            throw error;
        }
    }
    async checkOperationPossibile(files) {
    }
    async moveToOther(files, cdn, directory, rename, admin) {
        var _a;
        try {
            let allFiles = 0;
            var code = random_1.default.generateHashStr(32);
            for (let i = 0; i < files.length; i++) {
                allFiles += files[i].endsWith("/") ? ((_a = (await this.cdn.getFolderAllFiles(files[i]))) === null || _a === void 0 ? void 0 : _a.length) || 0 : 1;
            }
            let operation = await this.cdnOperationRepo.insert({
                operation: "moveToOther",
                cdn: this.cdn.CDN_id || "",
                toCdn: cdn,
                code,
                admin: admin._id,
                status: "running",
                type: this.cdn.type,
                info: {
                    files,
                    directory
                }
            });
            await cache.set(code, {
                allFiles,
                downloaded: 0,
                percentage: 0
            });
            console.log("before move");
            this.cdn.moveToOther(files, cdn, directory, {
                rename,
                cacheStr: code
            });
            return {
                status: 200,
                data: code
            };
        }
        catch (error) {
            throw error;
        }
    }
    async setPermission(file, permission, recursive) {
        try {
            return {
                status: 200,
                data: await this.cdn.setPermission(file, permission, {
                    recursive
                })
            };
        }
        catch (error) {
            throw error;
        }
    }
    async restConctection() {
        try {
            return {
                status: 200,
                data: await this.cdn.reset()
            };
        }
        catch (error) {
            throw error;
        }
    }
    async checkPermit(dir, accessType, extraQuery = {}) {
        if (dir == "") {
            dir = "/";
        }
        let exactExists = await this.fileManagerPermission.isExists(Object.assign({
            pathsPermission: {
                $elemMatch: {
                    "path": dir,
                    "allowedActions": accessType,
                    "status": true
                }
            }
        }, extraQuery));
        if (exactExists) {
            return exactExists;
        }
        // console.log("fileManagerPermission", this.getPathQuery(dir, accessType))
        return await this.fileManagerPermission.isExists(Object.assign(this.getPathQuery(dir, accessType), extraQuery));
        // return {}
    }
    async getCurrentPermission(path, admin, session) {
        // console.log(path)
        if (path != "" && !path.endsWith("/")) {
            path = path + "/";
        }
        let fileManager = session["fileManager"];
        if (!fileManager) {
            return {
                status: 500,
                message: "سرور فایل تنظیم نشده است"
            };
        }
        let fileManagerConfig = await this.fileManagerRepo.findById(fileManager._id);
        let size = Math.min((fileManagerConfig === null || fileManagerConfig === void 0 ? void 0 : fileManagerConfig.maxSize) || 1000, admin.maxSize || 1000);
        try {
            let or = this.getPathQuery(path, "upload");
            if (or['$or']) {
                for (let i = 0; i < or['$or'].length; i++) {
                    let q = or['$or'][i];
                    var config = await this.fileManagerPermission.findOne(Object.assign({
                        admin: admin._id,
                        cdn: fileManager._id
                    }, q), {
                        projection: {
                            "pathsPermission.$": 1,
                            size: 1
                        }
                    });
                    if (config === null || config === void 0 ? void 0 : config.pathsPermission[0]) {
                        // console.log(config)
                        let data = config === null || config === void 0 ? void 0 : config.pathsPermission[0];
                        data["size"] = Math.min(size || 600000, config.size);
                        return {
                            status: 200,
                            data
                        };
                    }
                }
            }
            return {
                status: 400
            };
        }
        catch (error) {
            throw error;
        }
    }
    async checkReadonly(accessType, cdn) {
        try {
            if (accessType == "view") {
                return false;
            }
            let exists = await this.fileManagerRepo.isExists({
                _id: cdn,
                readonly: true
            });
            return exists;
        }
        catch (error) {
            throw error;
        }
    }
    checkPathIsLocked(access) {
        // return
        return async (session, body, query) => {
            // console.log("checkPathIsLocked", access, body, query)
            let files = [];
            let toFiles = [];
            let toCdn = "";
            if (['unzip', 'rename'].includes(access)) {
                files.push(body.file);
            }
            if (["copy", "zip", "move", "copyToOther", "moveToOther", "delete"].includes(access)) {
                files.push(...body.files);
            }
            if (["restore", "hard-delete"].includes(access)) {
                files.push(...body.paths);
            }
            if (["copy", "move", "unzip", "zip", "download-folder"].includes(access)) {
                files.push(body.directory);
            }
            if (["copyToOther", "moveToOther"].includes(access)) {
                toFiles.push(body.directory);
                toCdn = body.cdn;
            }
            if (toFiles.length > 0) {
                let queryPaths = [];
                for (let i = 0; i < toFiles.length; i++) {
                    let queryPath = this.getQueryForOperations(toFiles[i]);
                    if (!toFiles[i].endsWith("/")) {
                        queryPath.push(toFiles[i]);
                    }
                    for (let j = 0; j < queryPath.length; j++) {
                        if (!queryPaths.includes(queryPath[j])) {
                            queryPaths.push(queryPath[j]);
                        }
                    }
                }
                let isExists = await this.cdn_LockedPathRepository.isExists({
                    cdn: toCdn,
                    paths: {
                        $in: queryPaths
                    }
                });
                if (isExists) {
                    var operation;
                    try {
                        operation = await this.cdnOperationRepo.findOne({
                            toCdn,
                            $or: [
                                {
                                    "info.files": {
                                        $in: queryPaths
                                    }
                                },
                                {
                                    "info.directory": {
                                        $in: queryPaths
                                    }
                                },
                                {
                                    "info.name": {
                                        $in: queryPaths
                                    }
                                },
                                {
                                    "info.file": {
                                        $in: queryPaths
                                    }
                                },
                            ]
                        }, {}, [{
                                path: "cdn",
                                select: ['title']
                            }, {
                                path: "toCdn",
                                select: ['title']
                            }]);
                    }
                    catch (error) {
                    }
                    return {
                        status: 401,
                        data: {
                            pathLocked: true,
                            operation
                        }
                    };
                }
            }
            let queryPaths = [];
            for (let i = 0; i < files.length; i++) {
                let queryPath = this.getQueryForOperations(files[i]);
                if (!files[i].endsWith("/")) {
                    queryPath.push(files[i]);
                }
                for (let j = 0; j < queryPath.length; j++) {
                    if (!queryPaths.includes(queryPath[j])) {
                        queryPaths.push(queryPath[j]);
                    }
                }
            }
            var fileManager = session["fileManager"];
            let cdn = fileManager._id;
            let isExists = await this.cdn_LockedPathRepository.isExists({
                cdn,
                paths: {
                    $in: queryPaths
                }
            });
            if (isExists) {
                var operation;
                try {
                    operation = await this.cdnOperationRepo.findOne({
                        cdn,
                        $or: [
                            {
                                "info.files": {
                                    $in: queryPaths
                                }
                            },
                            {
                                "info.directory": {
                                    $in: queryPaths
                                }
                            },
                            {
                                "info.name": {
                                    $in: queryPaths
                                }
                            },
                            {
                                "info.file": {
                                    $in: queryPaths
                                }
                            },
                        ]
                    }, {}, [{
                            path: "cdn",
                            select: ['title']
                        }, {
                            path: "toCdn",
                            select: ['title']
                        }]);
                }
                catch (error) {
                }
                return {
                    status: 401,
                    data: {
                        pathLocked: true,
                        operation
                    }
                };
            }
            return {
                next: true
            };
        };
    }
    async makeThumbNail(file) {
        try {
            this.cdn.makeThumbNail(file);
            console.log("file", file);
            return {};
        }
        catch (error) {
            throw error;
        }
    }
    checkAccess(accessType, filesAddress) {
        return async (session, body, query) => {
            try {
                var admin = session['admin'];
                if (!admin) {
                    return {
                        status: 401
                    };
                }
                var fileManager = session["fileManager"];
                if (!fileManager) {
                    return {
                        status: 400,
                    };
                }
                let readonly = await this.checkReadonly(accessType, fileManager._id);
                if (readonly) {
                    return {
                        status: 400,
                        data: {
                            readonly
                        },
                        message: "این سرور فایل در حال حاضر فقط خواندنی است "
                    };
                }
                let isBackup = await this.fileManagerRepo.isExists({
                    isBackup: true,
                    _id: fileManager._id
                });
                if (isBackup && accessType != "view") {
                    return {
                        status: 400,
                        data: {
                            backup: true
                        },
                        message: "عملیات در سرور بک آپ غیر مجاز"
                    };
                }
                if (admin.isSuperAdmin) {
                    return {
                        next: true
                    };
                }
                if (!['move', 'delete', 'copy', 'zip', 'unzip'].includes(accessType)) {
                    try {
                        let dir = accessType == "upload" ? query.directory : body.directory;
                        var isExists = await this.checkPermit(dir, accessType, {
                            admin: admin._id,
                            cdn: fileManager._id
                        });
                        if (!isExists)
                            return {
                                status: 401
                            };
                        return {
                            next: true
                        };
                    }
                    catch (error) {
                        throw error;
                    }
                }
                else if (accessType == 'delete') {
                    var files = body.files;
                    for (let i = 0; i < files.length; i++) {
                        var dirs = files[i].split("/");
                        dirs = dirs.slice(0, -1);
                        var dir = dirs.length > 0 ? dirs.join("/") + "/" : "";
                        var isExists = await this.checkPermit(dir, accessType, {
                            admin: admin._id,
                            cdn: fileManager._id
                        });
                        if (!isExists)
                            return {
                                status: 401
                            };
                    }
                    return {
                        next: true
                    };
                }
                else if (accessType == 'unzip') {
                    var isExists = await this.checkPermit(body.file, "view", {
                        admin: admin._id,
                        cdn: fileManager._id
                    });
                    if (!isExists)
                        return {
                            status: 401
                        };
                    isExists = await this.checkPermit(body.directory, accessType, {
                        admin: admin._id,
                        cdn: fileManager._id
                    });
                    if (!isExists)
                        return {
                            status: 401
                        };
                    return {
                        next: true
                    };
                }
                else {
                    var files = body.files;
                    for (let i = 0; i < files.length; i++) {
                        var dirs = files[i].split("/");
                        dirs = dirs.slice(0, -1);
                        var dir = dirs.length > 0 ? dirs.join("/") + "/" : "";
                        var isExists = await this.checkPermit(dir, "view", {
                            admin: admin._id,
                            cdn: fileManager._id
                        });
                        if (!isExists)
                            return {
                                status: 401
                            };
                        isExists = await this.checkPermit(body.directory, accessType, {
                            admin: admin._id,
                            cdn: fileManager._id
                        });
                        if (!isExists)
                            return {
                                status: 401
                            };
                    }
                    console.log("ok");
                    return {
                        next: true
                    };
                }
            }
            catch (error) {
                // console.log("error" ,error)
                throw error;
            }
        };
    }
    checkCanDelete(key) {
        return async (body) => {
            var files = typeof body[key] == "string" ? [body[key]] : body[key];
            var urls = [];
            var querys = [];
            for (let i = 0; i < files.length; i++) {
                var url = this.makeFileQuery(files[i]);
                urls.push(url);
                querys.push({
                    file: {
                        $regex: url
                    }
                });
            }
            var fileUses = await this.fileUsesRepo.findOne({
                $or: querys
            });
            if (fileUses != null) {
                return {
                    status: 401,
                    data: { access: false }
                };
            }
            return {
                next: true
            };
        };
    }
    makeFileQuery(file) {
        return this.cdn.getDefaultUrl() + file;
    }
    getPathQuery(dir, accessType) {
        let ors = [];
        var qq = {};
        if (dir.split("/").length > 2) {
            var dirs = dir.split("/");
            var paths = [];
            ors.push({
                pathsPermission: {
                    $elemMatch: {
                        "path": "/",
                        "allowedActions": accessType,
                        "status": true,
                        recurcive: true
                    }
                }
            });
            for (let i = 0; i < dirs.length; i++) {
                var q = "";
                for (let j = 0; j < i; j++) {
                    q += dirs[j] + "/";
                }
                if (q != "") {
                    ors.push({
                        pathsPermission: {
                            $elemMatch: {
                                "path": q,
                                "allowedActions": accessType,
                                "status": true,
                                recurcive: true
                            }
                        }
                    });
                }
            }
        }
        else {
            ors = [
                {
                    pathsPermission: {
                        $elemMatch: {
                            "path": "/",
                            "allowedActions": accessType,
                            "status": true,
                            recurcive: true
                        }
                    }
                },
                {
                    pathsPermission: {
                        $elemMatch: {
                            "path": dir,
                            "allowedActions": accessType,
                            "status": true,
                            recurcive: true
                        }
                    }
                },
            ];
        }
        ors = ors.reverse();
        qq = {
            $or: ors
        };
        return qq;
    }
    getQueryForOperations(dir) {
        // let ors = []
        var qq = {};
        var paths = [];
        if (dir.split("/").length > 2) {
            var dirs = dir.split("/");
            paths.push("/");
            for (let i = 0; i < dirs.length; i++) {
                var q = "";
                for (let j = 0; j < i; j++) {
                    q += dirs[j] + "/";
                }
                if (q != "") {
                    paths.push(q);
                }
            }
        }
        else {
            paths.push("/");
            paths.push(dir);
            if (dir.includes("/")) {
                paths.push(dir.split("/")[0] + "/");
            }
        }
        return paths;
    }
    getCheckAccsess(accessType) {
        return [
            {
                func: this.init.bind(this),
            },
            {
                func: this.checkAccess(accessType),
                meta: {
                    params: {
                        "1": {
                            index: 0,
                            source: "session",
                        },
                        "2": {
                            index: 1,
                            source: "body"
                        },
                        "3": {
                            index: 2,
                            source: "query"
                        }
                    }
                }
            },
        ];
    }
    initApis() {
        // @Post(")
        this.addRoute("/restore/many", "post", this.restoreMany.bind(this), {
            preExecs: [
                {
                    func: this.init.bind(this)
                },
                {
                    func: this.checkPathIsLocked("restore"),
                    meta: {
                        params: {
                            "1": {
                                index: 0,
                                source: "session",
                            },
                            "2": {
                                index: 1,
                                source: "body"
                            },
                            "3": {
                                index: 2,
                                source: "query"
                            }
                        }
                    }
                },
            ]
        });
        this.addRoute("/hard-delete/many", "post", this.deleteManyFromTrash.bind(this), {
            preExecs: [
                {
                    func: this.init.bind(this)
                },
                {
                    func: this.checkPathIsLocked("hard-delete"),
                    meta: {
                        params: {
                            "1": {
                                index: 0,
                                source: "session",
                            },
                            "2": {
                                index: 1,
                                source: "body"
                            },
                            "3": {
                                index: 2,
                                source: "query"
                            }
                        }
                    }
                },
            ]
        });
        this.addRoute("/storage", "post", this.checkStorage.bind(this), {
            preExecs: [
                {
                    func: this.init.bind(this),
                },
            ],
        });
        this.addRoute("/copy/validate", "post", this.validateToCopy.bind(this), {
            preExecs: [{
                    func: this.init.bind(this)
                }]
        });
        this.addRoute("/set", "post", this.setFileManager.bind(this));
        this.addRoute("/current", "get", this.getCurentCdn.bind(this));
        this.addRoute("/view", "post", this.view.bind(this), { preExecs: this.getCheckAccsess("view") });
        this.addRoute("/download-folder", "post", this.downloadFolder.bind(this), {
            preExecs: [
                {
                    func: this.checkAccess("view"),
                    meta: {
                        params: {
                            "1": {
                                index: 0,
                                source: "session",
                            },
                            "2": {
                                index: 1,
                                source: "body"
                            }
                        }
                    }
                },
                {
                    func: this.checkPathIsLocked("download-folder"),
                    meta: {
                        params: {
                            "1": {
                                index: 0,
                                source: "session",
                            },
                            "2": {
                                index: 1,
                                source: "body"
                            },
                            "3": {
                                index: 2,
                                source: "query"
                            }
                        }
                    }
                },
            ]
        });
        this.addRoute("/recycle/empty", "post", this.emptyRecycle.bind(this), { preExecs: this.getCheckAccsess("view") });
        this.addRoute("/folders", "post", this.findFolders.bind(this), {
            preExecs: [
                {
                    func: this.init.bind(this)
                }
            ]
        });
        this.addRoute("/directory", "post", this.directory.bind(this), {
            preExecs: [
                {
                    func: this.checkFileManager.bind(this),
                },
                {
                    func: this.checkAccess("directory"),
                    meta: {
                        params: {
                            "1": {
                                index: 0,
                                source: "session",
                            },
                            "2": {
                                index: 1,
                                source: "body"
                            }
                        }
                    }
                },
                {
                    func: this.init.bind(this),
                }
            ]
        });
        this.addRoute("/permission", "post", this.setPermission.bind(this), {
            preExecs: [
                {
                    func: this.checkFileManager.bind(this),
                },
                {
                    func: this.checkAccess("directory"),
                    meta: {
                        params: {
                            "1": {
                                index: 0,
                                source: "session",
                            },
                            "2": {
                                index: 1,
                                source: "body"
                            }
                        }
                    }
                },
                {
                    func: this.init.bind(this),
                }
            ]
        });
        this.addRoute("/search", "post", this.search.bind(this), { preExecs: this.getCheckAccsess("view") });
        this.addRoute("/zip", "post", this.zip.bind(this), {
            preExecs: [
                {
                    func: this.checkFileManager.bind(this),
                },
                {
                    func: this.checkAccess("zip"),
                    meta: {
                        params: {
                            "1": {
                                index: 0,
                                source: "session",
                            },
                            "2": {
                                index: 1,
                                source: "body"
                            }
                        }
                    }
                },
                {
                    func: this.checkPathIsLocked("zip"),
                    meta: {
                        params: {
                            "1": {
                                index: 0,
                                source: "session",
                            },
                            "2": {
                                index: 1,
                                source: "body"
                            },
                            "3": {
                                index: 2,
                                source: "query"
                            }
                        }
                    }
                },
                {
                    func: this.init.bind(this),
                }
            ]
        });
        this.addRoute("/unzip/info", "post", this.getZipFileInfo.bind(this), { preExecs: this.getCheckAccsess("view") });
        this.addRoute("/unzip", "post", this.unzip.bind(this), {
            preExecs: [
                {
                    func: this.checkFileManager.bind(this),
                },
                {
                    func: this.checkAccess("unzip"),
                    meta: {
                        params: {
                            "1": {
                                index: 0,
                                source: "session",
                            },
                            "2": {
                                index: 1,
                                source: "body"
                            }
                        }
                    }
                },
                {
                    func: this.checkPathIsLocked("unzip"),
                    meta: {
                        params: {
                            "1": {
                                index: 0,
                                source: "session",
                            },
                            "2": {
                                index: 1,
                                source: "body"
                            },
                            "3": {
                                index: 2,
                                source: "query"
                            }
                        }
                    }
                },
                {
                    func: this.init.bind(this),
                }
            ]
        });
        this.addRoute("/copy", "post", this.copy.bind(this), {
            preExecs: [
                {
                    func: this.checkFileManager.bind(this),
                },
                {
                    func: this.checkAccess("copy"),
                    meta: {
                        params: {
                            "1": {
                                index: 0,
                                source: "session",
                            },
                            "2": {
                                index: 1,
                                source: "body"
                            }
                        }
                    }
                },
                {
                    func: this.checkPathIsLocked("copy"),
                    meta: {
                        params: {
                            "1": {
                                index: 0,
                                source: "session",
                            },
                            "2": {
                                index: 1,
                                source: "body"
                            },
                            "3": {
                                index: 2,
                                source: "query"
                            }
                        }
                    }
                },
                {
                    func: this.init.bind(this),
                }
            ]
        });
        this.addRoute("/copy/other", "post", this.copyToOther.bind(this), {
            preExecs: [
                {
                    func: this.checkOtherFileManager.bind(this),
                },
                {
                    func: this.checkAccess("copy"),
                    meta: {
                        params: {
                            "1": {
                                index: 0,
                                source: "session",
                            },
                            "2": {
                                index: 1,
                                source: "body"
                            }
                        }
                    }
                },
                {
                    func: this.checkPathIsLocked("copyToOther"),
                    meta: {
                        params: {
                            "1": {
                                index: 0,
                                source: "session",
                            },
                            "2": {
                                index: 1,
                                source: "body"
                            },
                            "3": {
                                index: 2,
                                source: "query"
                            }
                        }
                    }
                },
                {
                    func: this.init.bind(this),
                }
            ]
        });
        this.addRoute("/delete", "post", this.deleteFiles.bind(this), {
            preExecs: [
                {
                    func: this.checkFileManager.bind(this),
                },
                {
                    func: this.checkAccess("delete"),
                    meta: {
                        params: {
                            "1": {
                                index: 0,
                                source: "session",
                            },
                            "2": {
                                index: 1,
                                source: "body"
                            }
                        }
                    }
                },
                {
                    func: this.init.bind(this),
                },
                {
                    func: this.checkPathIsLocked("delete"),
                    meta: {
                        params: {
                            "1": {
                                index: 0,
                                source: "session",
                            },
                            "2": {
                                index: 1,
                                source: "body"
                            },
                            "3": {
                                index: 2,
                                source: "query"
                            }
                        }
                    }
                },
                {
                    func: this.checkCanDelete('files'),
                    meta: {
                        params: {
                            "1": {
                                index: 0,
                                source: "body"
                            }
                        }
                    }
                }
            ]
        });
        this.addRoute("/thumbnail", "post", this.makeThumbNail.bind(this), {
            preExecs: [{
                    func: this.init.bind(this),
                }]
        });
        this.addRoute("/rename", "post", this.rename.bind(this), {
            preExecs: [
                {
                    func: this.checkFileManager.bind(this),
                },
                {
                    func: this.checkAccess("rename"),
                    meta: {
                        params: {
                            "1": {
                                index: 0,
                                source: "session",
                            },
                            "2": {
                                index: 1,
                                source: "body"
                            }
                        }
                    }
                },
                {
                    func: this.init.bind(this),
                },
                {
                    func: this.checkPathIsLocked("rename"),
                    meta: {
                        params: {
                            "1": {
                                index: 0,
                                source: "session",
                            },
                            "2": {
                                index: 1,
                                source: "body"
                            },
                            "3": {
                                index: 2,
                                source: "query"
                            }
                        }
                    }
                },
                {
                    func: this.checkCanDelete('file'),
                    meta: {
                        params: {
                            "1": {
                                index: 0,
                                source: "body"
                            }
                        }
                    }
                }
            ]
        });
        this.addRoute("/move", "post", this.move.bind(this), {
            preExecs: [
                {
                    func: this.checkFileManager.bind(this),
                },
                {
                    func: this.checkAccess("move"),
                    meta: {
                        params: {
                            "1": {
                                index: 0,
                                source: "session",
                            },
                            "2": {
                                index: 1,
                                source: "body"
                            }
                        }
                    }
                },
                {
                    func: this.init.bind(this),
                },
                {
                    func: this.checkPathIsLocked("move"),
                    meta: {
                        params: {
                            "1": {
                                index: 0,
                                source: "session",
                            },
                            "2": {
                                index: 1,
                                source: "body"
                            },
                            "3": {
                                index: 2,
                                source: "query"
                            }
                        }
                    }
                },
                {
                    func: this.checkCanDelete('files'),
                    meta: {
                        params: {
                            "1": {
                                index: 0,
                                source: "body"
                            }
                        }
                    }
                }
            ]
        });
        this.addRoute("/move/other", "post", this.moveToOther.bind(this), {
            preExecs: [
                {
                    func: this.checkOtherFileManager.bind(this),
                },
                {
                    func: this.checkAccess("copy"),
                    meta: {
                        params: {
                            "1": {
                                index: 0,
                                source: "session",
                            },
                            "2": {
                                index: 1,
                                source: "body"
                            }
                        }
                    }
                },
                {
                    func: this.init.bind(this),
                },
                {
                    func: this.checkPathIsLocked("moveToOther"),
                    meta: {
                        params: {
                            "1": {
                                index: 0,
                                source: "session",
                            },
                            "2": {
                                index: 1,
                                source: "body"
                            },
                            "3": {
                                index: 2,
                                source: "query"
                            }
                        }
                    }
                },
                {
                    func: this.checkCanDelete('files'),
                    meta: {
                        params: {
                            "1": {
                                index: 0,
                                source: "body"
                            }
                        }
                    }
                }
            ]
        });
        this.addRoute("/path/exists", "post", this.validatePath.bind(this), {
            preExecs: [{
                    func: this.init.bind(this),
                }]
        });
        this.addRoute("/path/exists", "post", this.validatePath.bind(this), {
            preExecs: [{
                    func: this.init.bind(this),
                }]
        });
        this.addRoute("/backup/restore", "post", this.restoreFromBackup.bind(this), {
            preExecs: [{
                    func: this.init.bind(this),
                }]
        });
        this.addRoute("/backup/validate", "post", this.validateBackup.bind(this), {
            preExecs: [{
                    func: this.init.bind(this),
                }]
        });
        this.addRoute("/reset", "post", this.restConctection.bind(this));
    }
}
exports.FileManager = FileManager;
__decorate([
    __param(0, (0, parameters_1.Session)())
], FileManager.prototype, "checkFileManager", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "cdn",
        schema: controller_2.default.id
    }))
], FileManager.prototype, "checkOtherFileManager", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "directory",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "sort",
        schema: zod_1.z.string().default('default')
    })),
    __param(2, (0, parameters_1.Query)({
        destination: "page",
        schema: controller_2.default.page.default(1)
    })),
    __param(3, (0, parameters_1.Query)({
        destination: "limit",
        schema: controller_2.default.limit.default(30)
    })),
    __param(4, (0, parameters_1.Admin)()),
    __param(5, (0, parameters_1.Session)())
], FileManager.prototype, "view", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "paths",
        schema: zod_1.z.array(zod_1.z.string())
    }))
], FileManager.prototype, "validatePath", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "directory",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "name",
        schema: zod_1.z.string()
    }))
], FileManager.prototype, "directory", null);
__decorate([
    (0, method_1.Post)("/restore", {}),
    __param(0, (0, parameters_1.Body)({
        destination: "path",
        schema: zod_1.z.string()
    }))
], FileManager.prototype, "restore", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "paths",
        schema: zod_1.z.array(zod_1.z.string())
    })),
    __param(1, (0, parameters_1.Admin)())
], FileManager.prototype, "restoreMany", null);
__decorate([
    (0, method_1.Post)("/hard-delete"),
    __param(0, (0, parameters_1.Body)({
        destination: "path",
        schema: zod_1.z.string()
    }))
], FileManager.prototype, "deleteFromTrash", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "paths",
        schema: zod_1.z.array(zod_1.z.string())
    })),
    __param(1, (0, parameters_1.Admin)())
], FileManager.prototype, "deleteManyFromTrash", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "size",
        schema: zod_1.z.number().int().positive()
    }))
], FileManager.prototype, "checkStorage", null);
__decorate([
    (0, method_1.Post)("/abort"),
    __param(0, (0, parameters_1.Body)({
        destination: "hash",
        schema: zod_1.z.string()
    }))
], FileManager.prototype, "abortFile", null);
__decorate([
    (0, method_1.Get)("/tasks/status"),
    __param(0, (0, parameters_1.Query)({
        destination: "code",
        schema: zod_1.z.string()
    }))
], FileManager.prototype, "getTaskStatus", null);
__decorate([
    (0, method_1.Post)("/tasks/status/many"),
    __param(0, (0, parameters_1.Body)({
        destination: "codes",
        schema: zod_1.z.array(zod_1.z.string())
    }))
], FileManager.prototype, "getTasksStatus", null);
__decorate([
    (0, method_1.Post)("tasks/checked"),
    __param(0, (0, parameters_1.Body)({
        destination: "tasks",
        schema: zod_1.z.array(controller_2.default.id)
    }))
], FileManager.prototype, "setTaskChecked", null);
__decorate([
    (0, method_1.Get)("/tasks/running"),
    __param(0, (0, parameters_1.Admin)())
], FileManager.prototype, "getRunningTask", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "files",
        schema: zod_1.z.array(zod_1.z.string())
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "rename",
        schema: zod_1.z.boolean()
    })),
    __param(2, (0, parameters_1.Admin)())
], FileManager.prototype, "restoreFromBackup", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "files",
        schema: zod_1.z.array(zod_1.z.string())
    })),
    __param(1, (0, parameters_1.Session)())
], FileManager.prototype, "validateBackup", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "directory",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Admin)()),
    __param(2, (0, parameters_1.Body)({
        destination: "code",
        schema: zod_1.z.string().optional()
    }))
], FileManager.prototype, "downloadFolder", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "files",
        schema: zod_1.z.array(zod_1.z.string())
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "dest",
        schema: zod_1.z.string()
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "cdn",
        schema: controller_2.default.id.optional()
    }))
], FileManager.prototype, "validateToCopy", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "directory",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Admin)()),
    __param(2, (0, parameters_1.Session)())
], FileManager.prototype, "findFolders", null);
__decorate([
    __param(0, (0, parameters_1.Query)({
        destination: "directory",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "rename",
        schema: zod_1.z.enum(["false", "true"]).default("false")
    })),
    __param(2, (0, parameters_1.Files)({
        skip: true,
        destination: "file",
        schema: zod_1.z.any(),
        config: {
            maxCount: 10,
            name: "file",
            size: 500000000
        },
    })),
    __param(3, (0, parameters_1.Body)({
        destination: "uploadWithState",
        schema: controller_2.default.booleanFromquery.default("false")
    }))
], FileManager.prototype, "upload", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_2.default.id.optional()
    })),
    __param(1, (0, parameters_1.Session)())
], FileManager.prototype, "setFileManager", null);
__decorate([
    __param(0, (0, parameters_1.Session)()),
    __param(1, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_2.default.id.optional()
    }))
], FileManager.prototype, "init", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "files",
        schema: zod_1.z.array(zod_1.z.string())
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "directory",
        schema: zod_1.z.string()
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "rename",
        schema: zod_1.z.boolean().default(true)
    })),
    __param(3, (0, parameters_1.Admin)())
], FileManager.prototype, "copy", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "term",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "directory",
        schema: zod_1.z.string()
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "searchType",
        schema: zod_1.z.enum(['any', 'file', 'folder']).default("any")
    })),
    __param(3, (0, parameters_1.Body)({
        destination: "nested",
        schema: zod_1.z.boolean().default(false)
    })),
    __param(4, (0, parameters_1.Admin)())
], FileManager.prototype, "search", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "files",
        schema: zod_1.z.array(zod_1.z.string())
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "name",
        schema: zod_1.z.string()
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "directory",
        schema: zod_1.z.string()
    })),
    __param(3, (0, parameters_1.Body)({
        destination: "rename",
        schema: zod_1.z.boolean().default(true)
    })),
    __param(4, (0, parameters_1.Admin)())
], FileManager.prototype, "zip", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "file",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "directory",
        schema: zod_1.z.string()
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "files",
        schema: zod_1.z.array(zod_1.z.string()).optional()
    })),
    __param(3, (0, parameters_1.Body)({
        destination: "rename",
        schema: zod_1.z.boolean().default(true)
    })),
    __param(4, (0, parameters_1.Admin)()),
    __param(5, (0, parameters_1.Body)({
        destination: "code",
        schema: zod_1.z.string().optional()
    }))
], FileManager.prototype, "unzip", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "file",
        schema: zod_1.z.string()
    }))
], FileManager.prototype, "getZipFileInfo", null);
__decorate([
    __param(0, (0, parameters_1.Session)())
], FileManager.prototype, "getCurentCdn", null);
__decorate([
    __param(0, (0, parameters_1.Admin)())
], FileManager.prototype, "getUploadConfig", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "moveToHidden",
        schema: zod_1.z.boolean().default(false)
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "files",
        schema: zod_1.z.array(zod_1.z.string())
    })),
    __param(2, (0, parameters_1.Admin)())
], FileManager.prototype, "deleteFiles", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "file",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "name",
        schema: zod_1.z.string()
    })),
    __param(2, (0, parameters_1.Admin)())
], FileManager.prototype, "rename", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "path",
        schema: zod_1.z.string()
    }))
], FileManager.prototype, "getOne", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "files",
        schema: zod_1.z.array(zod_1.z.string())
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "directory",
        schema: zod_1.z.string()
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "rename",
        schema: zod_1.z.boolean().default(false)
    })),
    __param(3, (0, parameters_1.Admin)())
], FileManager.prototype, "move", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "files",
        schema: zod_1.z.array(zod_1.z.string())
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "cdn",
        schema: controller_2.default.id
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "directory",
        schema: zod_1.z.string()
    })),
    __param(3, (0, parameters_1.Body)({
        destination: "rename",
        schema: zod_1.z.boolean().default(false)
    })),
    __param(4, (0, parameters_1.Admin)())
], FileManager.prototype, "copyToOther", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "files",
        schema: zod_1.z.array(zod_1.z.string())
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "cdn",
        schema: controller_2.default.id
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "directory",
        schema: zod_1.z.string()
    })),
    __param(3, (0, parameters_1.Body)({
        destination: "rename",
        schema: zod_1.z.boolean().default(false)
    })),
    __param(4, (0, parameters_1.Admin)())
], FileManager.prototype, "moveToOther", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "file",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "permission",
        schema: zod_1.z.string()
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "recursive",
        schema: zod_1.z.boolean()
    }))
], FileManager.prototype, "setPermission", null);
__decorate([
    (0, method_1.Get)("/upload/configs"),
    __param(0, (0, parameters_1.Query)({
        destination: "path",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Admin)()),
    __param(2, (0, parameters_1.Session)())
], FileManager.prototype, "getCurrentPermission", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "path",
        schema: zod_1.z.string()
    }))
], FileManager.prototype, "makeThumbNail", null);
