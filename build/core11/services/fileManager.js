"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileManagerBackup = exports.DiskFileManager = void 0;
exports.urlToStream = urlToStream;
const fs_1 = __importDefault(require("fs"));
const got_1 = __importDefault(require("got"));
const path_1 = __importDefault(require("path"));
const zip_a_folder_1 = require("zip-a-folder");
const util_1 = require("util");
var rimraf = require("rimraf");
const repository_1 = __importDefault(require("../mongoose-controller/repositories/fileManagerConfig/repository"));
const model_1 = require("../mongoose-controller/repositories/fileManagerConfig/model");
const repository_2 = __importDefault(require("../mongoose-controller/repositories/cdnLog/repository"));
const fileTypes_1 = __importDefault(require("../fileTypes"));
const repository_3 = __importDefault(require("../mongoose-controller/repositories/backup/repository"));
const backup_1 = __importDefault(require("./backup"));
const axios_1 = __importDefault(require("axios"));
const redis_cache_1 = __importDefault(require("../redis-cache"));
const random_1 = __importDefault(require("../random"));
const ftp_1 = require("./cdn/ftp");
const objectStorage_1 = require("./cdn/objectStorage");
const repository_4 = __importDefault(require("../mongoose-controller/repositories/recycleBin/repository"));
const repository_5 = __importDefault(require("../mongoose-controller/repositories/cdnOperations/repository"));
const config_1 = __importDefault(require("./config"));
const repository_6 = __importDefault(require("../mongoose-controller/repositories/cdnLockedPath/repository"));
const repository_7 = __importDefault(require("../mongoose-controller/repositories/backupFile/repository"));
const child_process_1 = require("child_process");
// let cacheService = new CacheStorage()
const cache = new redis_cache_1.default("file_managing");
const recycleBinRepo = new repository_4.default();
const fileManagerConfigRepo = new repository_1.default();
async function urlToStream(fileUrl) {
    var filename = fileUrl.split("/");
    var path = "src/uploads/" + filename[filename.length - 1];
    var tempFile = fs_1.default.createWriteStream(path);
    try {
        return new Promise(async (resolve, reject) => {
            tempFile.on("open", async (fd) => {
                await got_1.default.stream(fileUrl).pipe(tempFile).on("close", () => {
                    return resolve(path);
                });
            });
        });
    }
    catch (error) {
        return "";
    }
}
class DiskFileManager {
    constructor(baseDir) {
        this.baseDir = baseDir;
    }
    async removeFiles(paths) {
        return false;
    }
    async removeFile(path) {
        return false;
    }
    async move(path, destination) {
        return false;
    }
    static async removeFiles(paths) {
        for (let i = 0; i < paths.length; i++) {
            try {
                await this.removeFile(paths[i]);
            }
            catch (error) {
                throw error;
            }
        }
        return true;
    }
    static async stats(file) {
        try {
            return new Promise((resolve, reject) => {
                fs_1.default.stat(file, (err, stat) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(stat);
                });
            });
        }
        catch (error) {
            throw error;
        }
    }
    static async rename(file, newFile) {
        try {
            return new Promise((resolve, reject) => {
                fs_1.default.rename(file, newFile, (err) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(newFile);
                });
            });
        }
        catch (error) {
            throw error;
        }
    }
    static removeFile(path) {
        return new Promise((resolve, reject) => {
            fs_1.default.unlink(path, function (err) {
                if (err) {
                    return reject(err);
                }
                return resolve(true);
            });
        });
    }
    static async removeFolderFiles(folder) {
        let files = fs_1.default.readdirSync(folder);
        for (let i = 0; i < files.length; i++) {
            await this.removeFile(folder + files[i]);
        }
    }
    static async readFile(file) {
        return new Promise((resolve, reject) => {
            fs_1.default.readFile(file, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                const lines = data.split('\n');
                resolve(lines);
            });
        });
    }
    static removeFileSync(path) {
        try {
            fs_1.default.unlinkSync(path);
        }
        catch (error) {
            throw error;
        }
    }
    static removeFolder(path) {
        return new Promise((resolve, reject) => {
            rimraf(path, function (err) {
                if (err) {
                    // return reject(err)
                }
                return resolve(true);
            });
        });
    }
    static writeFile(path, data) {
        return new Promise((resolve, reject) => {
            fs_1.default.writeFile(path, data, function (err) {
                if (err) {
                    return reject(err);
                }
                return resolve(true);
            });
        });
    }
    static async wirteStream(path, stream) {
        var ws = fs_1.default.createWriteStream(path);
        stream.pipe(ws);
        return new Promise((resolve, reject) => {
            stream.on("end", function () {
                resolve(true);
            });
            stream.on("error", (error) => {
                reject(error);
            });
        });
    }
    static async isExists(p) {
        return new Promise((resolve, reject) => {
            fs_1.default.stat(p, (err, stats) => {
                // // console.log("stat", stats)
                if (err) {
                    if (err.code === 'ENOENT') {
                        resolve(false);
                    }
                    else {
                        reject(err);
                    }
                }
                else {
                    if (stats.isDirectory()) {
                        resolve(true);
                    }
                    else {
                        resolve(false);
                    }
                }
            });
        });
    }
    static async isFileExists(p) {
        return new Promise((resolve, reject) => {
            fs_1.default.stat(p, (err, stats) => {
                // // console.log("stat", stats)
                if (err) {
                    if (err.code === 'ENOENT') {
                        resolve(false);
                    }
                    else {
                        reject(err);
                    }
                }
                else {
                    if (stats.isDirectory()) {
                        resolve(false);
                    }
                    else {
                        resolve(true);
                    }
                }
            });
        });
    }
    static async moveFolder(p, destination) {
        // return new 
        let exists = await DiskFileManager.isExists(p);
        if (exists == false) {
            return true;
        }
        let names = p.split("/");
        fs_1.default.renameSync(p, `${destination}${names[names.length - 2]}/`);
        return true;
    }
    static async move(p, destination) {
        // return new 
        if (p.endsWith("/"))
            return DiskFileManager.moveFolder(p, destination);
        fs_1.default.renameSync(p, destination + path_1.default.basename(p));
        return true;
    }
    static async copyFolder(p, destination) {
        let exists = await DiskFileManager.isExists(p);
        if (exists == false) {
            return "";
        }
        return new Promise((resolve, reject) => {
            (0, child_process_1.exec)(`cp -r ${p} ${destination}`, (err, stdout, stderr) => {
                if (err) {
                    console.log("reject");
                    reject();
                }
                else
                    resolve("");
            });
        });
    }
    static async copy(p, destination) {
        if (p.endsWith("/")) {
            return DiskFileManager.copyFolder(p, destination);
        }
        const newName = destination + path_1.default.basename(p);
        fs_1.default.copyFileSync(p, destination + path_1.default.basename(p));
        return newName;
    }
    static async mkdir(path, name) {
        return new Promise((resolve, reject) => {
            rimraf(path + name, function (err) {
                fs_1.default.mkdir(path + name, function (err) {
                    if (err) {
                        // console.log("errk")
                        return reject(err);
                    }
                    return resolve({});
                });
            });
        });
    }
    static async scanDir(path, id = "", removeThumbnails) {
        try {
            var files = await new Promise(function (resolve, reject) {
                fs_1.default.readdir(path, function (err, files) {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(files);
                });
            });
            var result = [];
            for (let i = 0; i < files.length; i++) {
                if (removeThumbnails == true && files[i].includes("---thumbnail")) {
                    continue;
                }
                if (await this.isFolder(path + "/" + files[i])) {
                    result.push({
                        checked: true,
                        type: "dir",
                        name: files[i],
                        id: id + files[i] + "/",
                        children: await this.scanDir(path + "/" + files[i], id + files[i] + "/")
                    });
                }
                else {
                    result.push({
                        checked: true,
                        type: "file",
                        name: files[i],
                        id: id + files[i],
                    });
                }
            }
        }
        catch (error) {
            throw error;
        }
        return result;
    }
    static async isFolder(path) {
        return new Promise((resolve, reject) => {
            fs_1.default.lstat(path, function (err, stats) {
                if (err) {
                    // console.log(err)
                    return reject(err);
                }
                return resolve(stats.isDirectory());
            });
        });
    }
    // responseType: 'stream',
    static async getFilesSize(paths) {
        var totalSize = 0;
        try {
            var stat = (0, util_1.promisify)(fs_1.default.stat);
            for (let i = 0; i < paths.length; i++) {
                if (await this.isFolder(paths[i])) {
                    totalSize += await this.getFolderSize(paths[i]);
                }
                else {
                    var stats = await stat(paths[i]);
                    totalSize += stats.size;
                }
            }
        }
        catch (error) {
            throw error;
        }
        return totalSize;
    }
    static async getFolderSize(folder) {
        var readdir = (0, util_1.promisify)(fs_1.default.readdir);
        var stat = (0, util_1.promisify)(fs_1.default.stat);
        var totalSize = 0;
        try {
            var files = await readdir(folder);
            for (let i = 0; i < files.length; i++) {
                var p = folder.endsWith("/") ? folder + files[i] : folder + "/" + files[i];
                if (await this.isFolder(folder + "/" + files[i])) {
                    totalSize += await this.getFolderSize(p);
                }
                else {
                    var stats = await stat(p);
                    totalSize += stats.size;
                }
            }
        }
        catch (error) {
            throw error;
        }
        return totalSize;
    }
    static getCommands(files, id = "") {
        var cmd = [];
        for (let i = 0; i < files.length; i++) {
            if (files[i].type == "dir") {
                cmd.push({
                    type: "dir",
                    directory: id,
                    name: files[i].name
                });
                cmd.push(...this.getCommands(files[i].children, files[i].id));
            }
            else {
                cmd.push({
                    type: "file",
                    directory: id,
                    path: files[i].id
                });
            }
        }
        return cmd;
    }
    static async downloadFiles(files, directory) {
        for (let i = 0; i < files.length; i++) {
            await this.downloadFile(files[i], directory);
        }
    }
    static async downloadFile(fileUrl, directory) {
        try {
            if (fileUrl.includes("?")) {
                fileUrl = fileUrl.split("?")[0];
            }
            var p = directory != undefined ? directory + path_1.default.basename(fileUrl) : "src/uploads/tmp/" + path_1.default.basename(fileUrl);
            var writer = fs_1.default.createWriteStream(p);
            var response = await (0, axios_1.default)({
                method: 'get',
                url: fileUrl,
                responseType: 'stream',
                proxy: false
            });
            return new Promise((resolve, reject) => {
                response.data.pipe(writer);
                var er = null;
                writer.on('error', err => {
                    er = err;
                    writer.close();
                    // console.log("err")
                    reject(err);
                });
                writer.on('close', () => {
                    if (er == null) {
                        resolve(p);
                    }
                    else {
                        reject(er);
                    }
                });
            });
        }
        catch (error) {
            throw error;
        }
        //ensure that the user can call `then()` only when the file has
        //been downloaded entirely.
    }
    static async toBase64(source) {
        try {
            return await new Promise((resolve, reject) => {
                fs_1.default.readFile(source, function (err, data) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(data.toString("base64"));
                });
            });
        }
        catch (error) {
        }
    }
    static async saveBase64(image) {
        return new Promise((resolve, reject) => {
            if (image.startsWith("data:image/jpeg")) {
                var base64Data = image.replace(/^data:image\/jpeg;base64,/, "");
                var fileName = `src/uploads/tmp/screen_${Date.now()}.jpeg`;
            }
            else {
                var base64Data = image.replace(/^data:image\/png;base64,/, "");
                var fileName = `src/uploads/tmp/screen_${Date.now()}.png`;
            }
            fs_1.default.writeFile(fileName, base64Data, 'base64', function (err) {
                if (err)
                    return reject(err);
                resolve(fileName);
            });
        });
    }
}
exports.DiskFileManager = DiskFileManager;
async function addCdnLog(options) {
    try {
        await new repository_2.default().insert({
            cdn: options.cdn,
            type: options.type,
            files: options.files,
            operation: options.operation,
            info: options.info
        });
    }
    catch (error) {
        // // console.log("error")
        return;
        throw error;
    }
}
function addFilesInfo(filesInfo, files) {
    for (let i = 0; i < files.length; i++) {
        var type = path_1.default.extname(files[i]).substring(1);
        if (filesInfo[type]) {
            try {
                filesInfo[type].count += 1;
            }
            catch (error) { }
            continue;
        }
        filesInfo[type] = {
            count: 1,
            mimetype: fileTypes_1.default[type] || type
        };
    }
    return filesInfo;
}
function deleteFilesInfo(filesInfo, files) {
    for (let i = 0; i < files.length; i++) {
        var type = path_1.default.extname(files[i]).substring(1);
        if (filesInfo[type] && filesInfo[type].count && filesInfo[type].count > 0) {
            try {
                filesInfo[type].count -= 1;
            }
            catch (error) { }
        }
    }
    return filesInfo;
}
async function UpdateCdnConfig(cdnMg, query, files) {
    var _a;
    try {
        let cdn = await cdnMg.fileManagerRepo.findByIdAndUpdate(cdnMg.CDN_id, query);
        if ((cdn === null || cdn === void 0 ? void 0 : cdn.isInternal) == true) {
            await cdnMg.fileManagerRepo.updateMany({
                isInternal: true,
                _id: {
                    $ne: cdn._id
                }
            }, query);
        }
        if (files) {
            try {
                var fileManager = await cdnMg.fileManagerRepo.findById(cdnMg.CDN_id);
                if (fileManager != null) {
                    var info = fileManager.filesInfo || {};
                    if (((_a = query['$inc']) === null || _a === void 0 ? void 0 : _a.usedSize) > 0) {
                        info = addFilesInfo(info, files);
                    }
                    else {
                        info = deleteFilesInfo(info, files);
                    }
                    await cdnMg.fileManagerRepo.updateOne({
                        _id: cdnMg.CDN_id
                    }, {
                        $set: {
                            filesInfo: info
                        }
                    });
                }
            }
            catch (error) {
            }
        }
    }
    catch (error) {
    }
}
function processCDN_Upload(target, propertyKey, propertyDescriptor) {
    propertyDescriptor = propertyDescriptor;
    const originalMethod = propertyDescriptor.value;
    propertyDescriptor.value = async function (...args) {
        var _a, _b;
        const self = this;
        try {
            if (typeof args[0] == 'string') {
                var paths = [args[0]];
            }
            else {
                var paths = args[0];
            }
            try {
                var totalSize = await DiskFileManager.getFilesSize(paths.map((elem, i) => {
                    return elem.path;
                }));
                totalSize = Math.round(totalSize / Math.pow(1024, 2) * 100) / 100;
            }
            catch (error) {
                totalSize = 0;
            }
            var result = await originalMethod.apply(this, args);
            var newFiles = [];
            try {
                if (typeof result == "string") {
                    var newFiles = [result.substring(((_b = (_a = self.cdn) === null || _a === void 0 ? void 0 : _a.baseDir) === null || _b === void 0 ? void 0 : _b.length) || 9, result.length)];
                }
                else
                    newFiles = result.map((elem, i) => {
                        var _a, _b;
                        return elem.substring(((_b = (_a = self.cdn) === null || _a === void 0 ? void 0 : _a.baseDir) === null || _b === void 0 ? void 0 : _b.length) || 9, elem.length);
                    });
            }
            catch (error) {
                // // console.log(error)
                // // console.log("error", error, result)
            }
            try {
                await UpdateCdnConfig(self, {
                    $inc: {
                        usedSize: totalSize
                    }
                }, newFiles);
                await addCdnLog({
                    cdn: self.CDN_id,
                    files: newFiles,
                    operation: 'upload',
                    type: self.storageType,
                    info: {}
                });
            }
            catch (error) {
                // console.log(error)
                // throw error
                // // console.log(error)
            }
            return result;
        }
        catch (err) {
            // console.log(err)
            throw err;
        }
    };
    return propertyDescriptor;
}
function processCDN_Direct_Download(target, propertyKey, propertyDescriptor) {
    propertyDescriptor = propertyDescriptor;
    const originalMethod = propertyDescriptor.value;
    propertyDescriptor.value = async function (...args) {
        const self = this;
        try {
            var result = await originalMethod.apply(this, args);
            let interval = setInterval(async () => {
                let d = await cache.get(result.hash);
                if (d != null) {
                    // // console.log(JSON.parse(d))
                    let status = JSON.parse(d);
                    if (status.p.includes("100")) {
                        // co
                        clearInterval(interval);
                        await UpdateCdnConfig(self, {
                            $inc: {
                                usedSize: (status.totalSize / (1024 * 1024))
                            }
                        }, [result.url]);
                        await addCdnLog({
                            cdn: self.CDN_id,
                            files: result.url,
                            operation: 'directDownload',
                            type: self.storageType,
                            info: {}
                        });
                    }
                }
                else {
                    clearInterval(interval);
                }
            }, 500);
            return result;
        }
        catch (error) {
            throw error;
        }
    };
    return propertyDescriptor;
}
function processCDN_Upload_Width_State(target, propertyKey, propertyDescriptor) {
    propertyDescriptor = propertyDescriptor;
    const originalMethod = propertyDescriptor.value;
    propertyDescriptor.value = async function (...args) {
        // // console.log("processCDN_Upload_Width_State")
        const self = this;
        try {
            var f = await originalMethod.apply(this, args);
            // // console.log("result" ,result)
            try {
                var result = f.split("$$$");
                let url = result[0];
                let hash = result[1];
                let interval = setInterval(async () => {
                    let d = await cache.get(hash);
                    if (d != null) {
                        try {
                            var status = JSON.parse(d);
                        }
                        catch (error) {
                        }
                        if (d.toString() == "100" || d.toString() == "100.00" || (status === null || status === void 0 ? void 0 : status.p.includes("100"))) {
                            // console.log("status", status)
                            clearInterval(interval);
                            await UpdateCdnConfig(self, {
                                $inc: {
                                    usedSize: (status.totalSize / (1024 * 1024))
                                }
                            }, [url]);
                            await addCdnLog({
                                cdn: self.CDN_id,
                                files: url,
                                operation: 'uploadWhith',
                                type: self.storageType,
                                info: {}
                            });
                        }
                    }
                    else {
                        clearInterval(interval);
                    }
                }, 500);
            }
            catch (error) {
                // console.log("dd")
            }
            // // console.log("f", f)
            return f;
        }
        catch (error) {
            throw error;
        }
    };
    return propertyDescriptor;
}
function processCDN_Append(target, propertyKey, propertyDescriptor) {
    propertyDescriptor = propertyDescriptor;
    const originalMethod = propertyDescriptor.value;
    propertyDescriptor.value = async function (...args) {
        var _a, _b, _c;
        const self = this;
        try {
            if (typeof args[0] == 'string') {
                var paths = [args[0]];
            }
            else {
                var paths = args[0];
            }
            try {
                var totalSize = await DiskFileManager.getFilesSize(paths);
                totalSize = Math.round(totalSize / Math.pow(1024, 2) * 100) / 100;
            }
            catch (error) {
                // console.log(error)
                totalSize = 0;
            }
            var result = await originalMethod.apply(this, args);
            try {
                // // console.log(result)
                var newFiles = [result.substring(((_b = (_a = self.cdn) === null || _a === void 0 ? void 0 : _a.baseDir) === null || _b === void 0 ? void 0 : _b.length) || 9, result.length)];
                // })
                // // console.log("newFiles", newFiles, result)
            }
            catch (error) {
                // console.log("err", error, result)
                newFiles = [];
            }
            try {
                await UpdateCdnConfig(self, {
                    $inc: {
                        usedSize: totalSize
                    }
                }, ((_c = args[2]) === null || _c === void 0 ? void 0 : _c.isFirst) ? newFiles : []);
                // if(args[2]?.isFirst ){
                await addCdnLog({
                    cdn: self.CDN_id,
                    files: newFiles,
                    operation: 'append',
                    type: self.storageType,
                    info: {}
                });
                // }
            }
            catch (error) {
                // console.log(error)
                // throw error
                // // console.log(error)
            }
            return result;
        }
        catch (err) {
            // console.log(err)
            throw err;
        }
    };
    return propertyDescriptor;
}
function processCDN_Directory(target, propertyKey, propertyDescriptor) {
    propertyDescriptor = propertyDescriptor;
    const originalMethod = propertyDescriptor.value;
    propertyDescriptor.value = async function (...args) {
        const self = this;
        try {
            var result = await originalMethod.apply(this, args);
            if (typeof args[0] == 'string') {
                var paths = [args[0]];
            }
            else {
                var paths = args[0];
            }
            try {
                await addCdnLog({
                    cdn: self.CDN_id,
                    files: [args[0] + args[1]],
                    operation: 'createDirectory',
                    type: self.storageType,
                    info: {}
                });
            }
            catch (error) {
                // console.log(error)
                // throw error
                // // console.log(error)
            }
            return result;
        }
        catch (err) {
            throw err;
        }
    };
    return propertyDescriptor;
}
function processCDN_Delete(target, propertyKey, propertyDescriptor) {
    propertyDescriptor = propertyDescriptor;
    const originalMethod = propertyDescriptor.value;
    propertyDescriptor.value = async function (...args) {
        var _a, _b;
        const self = this;
        try {
            var folderPath = args[0];
            var info = {};
            if (args[1] != false) {
                info['moveToHidden'] = true;
                var result = await originalMethod.apply(this, args);
                await addCdnLog({
                    cdn: self.CDN_id,
                    files: folderPath,
                    operation: 'delete',
                    type: self.storageType,
                    info
                });
                return result;
            }
            var totalSize = await ((_a = self.cdn) === null || _a === void 0 ? void 0 : _a.getFilesSize(folderPath));
            var totalFiles = await ((_b = self.cdn) === null || _b === void 0 ? void 0 : _b.getAllFiles(folderPath));
            totalSize = Math.round(totalSize / Math.pow(1024, 2) * 100) / 100;
            var allFiles = [];
            var result = await originalMethod.apply(this, args);
            try {
                await UpdateCdnConfig(self, {
                    $inc: {
                        usedSize: -totalSize
                    }
                }, totalFiles);
                await addCdnLog({
                    cdn: self.CDN_id,
                    files: folderPath,
                    operation: 'delete',
                    type: self.storageType,
                    info: {}
                });
            }
            catch (error) {
                // // console.log(error)
            }
            return result;
        }
        catch (err) {
            // // console.log(err)
            throw err;
        }
    };
    return propertyDescriptor;
}
function processCDN_Copy_Move(target, propertyKey, propertyDescriptor) {
    propertyDescriptor = propertyDescriptor;
    const originalMethod = propertyDescriptor.value;
    propertyDescriptor.value = async function (...args) {
        var _a, _b;
        const self = this;
        try {
            var folderPath = args[0];
            var totalSize = propertyKey != 'move' ? await ((_a = self.cdn) === null || _a === void 0 ? void 0 : _a.getFilesSize(folderPath)) : 0;
            var totalfiles = propertyKey != 'move' ? await ((_b = self.cdn) === null || _b === void 0 ? void 0 : _b.getAllFiles(folderPath)) : [];
            totalSize = Math.round(totalSize / Math.pow(1024, 2) * 100) / 100;
            var currentCDN = self.CDN_id;
            var result = await originalMethod.apply(this, args);
            var info = {};
            var operation;
            if (propertyKey == 'copy') {
                operation = 'copy';
                info['directory'] = args[1];
                await UpdateCdnConfig(self, {
                    $inc: {
                        usedSize: totalSize
                    }
                }, totalfiles);
            }
            else if (propertyKey == 'move') {
                operation = 'move';
                info['directory'] = args[1];
            }
            else if (propertyKey == 'copyToOther') {
                operation = 'copyToOther';
                info['directory'] = args[2];
                info['toCdn'] = args[1];
                await UpdateCdnConfig(self, {
                    $inc: {
                        usedSize: totalSize
                    }
                }, totalfiles);
                var cdn_id = self.CDN_id;
                // self.CDN_id = currentCDN
            }
            else if (propertyKey == 'restoreToOther') {
                operation = 'restoreToOther';
                info['directory'] = args[2];
                info['toCdn'] = args[1];
                await UpdateCdnConfig(self, {
                    $inc: {
                        usedSize: totalSize
                    }
                }, totalfiles);
                self.CDN_id = currentCDN;
                await self.init(true);
                await UpdateCdnConfig(self, {
                    $inc: {
                        usedSize: -totalSize
                    }
                }, totalfiles);
                // self.CDN_id = currentCDN
            }
            else {
                operation = 'moveToOther';
                info['directory'] = args[2];
                info['toCdn'] = args[1];
                await UpdateCdnConfig(self, {
                    $inc: {
                        usedSize: totalSize
                    }
                }, totalfiles);
                self.CDN_id = currentCDN;
                await self.init(true);
                await UpdateCdnConfig(self, {
                    $inc: {
                        usedSize: -totalSize
                    }
                }, totalfiles);
            }
            try {
                await addCdnLog({
                    cdn: cdn_id || self.CDN_id,
                    files: folderPath,
                    operation,
                    type: self.storageType,
                    info
                });
            }
            catch (error) {
                // throw error
                // // console.log(error)
            }
            return result;
        }
        catch (err) {
            // // console.log(err)
            throw err;
        }
    };
    return propertyDescriptor;
}
function processCDN_Zip(target, propertyKey, propertyDescriptor) {
    propertyDescriptor = propertyDescriptor;
    const originalMethod = propertyDescriptor.value;
    propertyDescriptor.value = async function (...args) {
        var _a, _b;
        const self = this;
        try {
            var files = args[0];
            var result = await originalMethod.apply(this, args);
            try {
                await UpdateCdnConfig(self, {
                    $inc: {
                        usedSize: Math.round(result[1] / Math.pow(1024, 2) * 100) / 100
                    }
                }, [result[0].substring(((_a = self.cdn) === null || _a === void 0 ? void 0 : _a.baseDir.length) || 0, result[0].length)]);
                await addCdnLog({
                    cdn: self.CDN_id,
                    files: [result[0].substring(((_b = self.cdn) === null || _b === void 0 ? void 0 : _b.baseDir.length) || 0, result[0].length)],
                    operation: "zip",
                    type: self.storageType,
                    info: {
                        files
                    }
                });
            }
            catch (error) {
                // throw error
                // // console.log(error)
            }
            return result;
        }
        catch (err) {
            // // console.log(err)
            throw err;
        }
    };
    return propertyDescriptor;
}
function processCDN_UnZip(target, propertyKey, propertyDescriptor) {
    propertyDescriptor = propertyDescriptor;
    const originalMethod = propertyDescriptor.value;
    propertyDescriptor.value = async function (...args) {
        const self = this;
        try {
            var file = args[0];
            var directory = args[1];
            var result = await originalMethod.apply(this, args);
            // // console.log("result", result, args)
            var newFiles = result[0].map((elem, i) => {
                var _a;
                return elem.substring(((_a = self.cdn) === null || _a === void 0 ? void 0 : _a.baseDir.length) || 0, elem.length);
            });
            try {
                await UpdateCdnConfig(self, {
                    $inc: {
                        usedSize: Math.round(result[1] / Math.pow(1024, 2) * 100) / 100
                    }
                }, newFiles);
                await addCdnLog({
                    cdn: self.CDN_id,
                    files: newFiles,
                    operation: "unzip",
                    type: self.storageType,
                    info: {
                        file,
                        directory
                    }
                });
            }
            catch (error) {
                // throw error
                // // console.log(error)
            }
            return result;
        }
        catch (err) {
            // // console.log(err)
            throw err;
        }
    };
    return propertyDescriptor;
}
const backupFileRepo = new repository_7.default();
class FileManagerBackup {
    static uploadToBackup(target, propertyKey, propertyDescriptor) {
        const originalMethod = propertyDescriptor.value;
        propertyDescriptor.value = async function (...args) {
            const self = this;
            var backUpRepo = new repository_3.default();
            var backupService = new backup_1.default();
            try {
                var result = await originalMethod.apply(this, args);
            }
            catch (error) {
                throw error;
            }
            var backups = await fileManagerConfigRepo.findAll({
                mirrorCDN: self.CDN_id,
                status: true,
                isBackup: true
            });
            for (let i = 0; i < backups.length; i++) {
                try {
                    self.initFromConfig(backups[i]);
                    await originalMethod.apply(self, args);
                }
                catch (error) {
                }
            }
            return result;
        };
        return propertyDescriptor;
    }
    static doToMirror(target, propertyKey, propertyDescriptor) {
        const originalMethod = propertyDescriptor.value;
        propertyDescriptor.value = async function (...args) {
            const self = this;
            try {
                var result = await originalMethod.apply(this, args);
            }
            catch (error) {
                throw error;
            }
            let backups = await fileManagerConfigRepo.findAll({
                mirrorCDN: self.CDN_id,
                isBackup: true,
                status: true
            });
            // // console.log(backups, self.config, self)
            let currentConf = { ...self.config };
            for (let i = 0; i < backups.length; i++) {
                try {
                    let backup = await fileManagerConfigRepo.findById(backups[i]._id);
                    // // console.log( " backup" , backup)
                    self.initFromConfig(Object.assign(backup, {
                        id: backup === null || backup === void 0 ? void 0 : backup._id
                    }));
                    await originalMethod.apply(self, args);
                }
                catch (error) {
                    // console.log(error)
                }
            }
            if (currentConf._doc) {
                currentConf = currentConf._doc;
            }
            if (self.config != undefined) {
                self.initFromConfig(Object.assign(currentConf, {
                    id: currentConf === null || currentConf === void 0 ? void 0 : currentConf.id
                }));
            }
            if (propertyKey == "upload" || propertyKey == "uploadWithState") {
                try {
                    await DiskFileManager.removeFile(args[0]);
                }
                catch (error) {
                }
            }
            return result;
        };
        return propertyDescriptor;
    }
    static async getValidFolderPath(cdn, directory, count = 0) {
        try {
            let paths = directory.split("/");
            if (count > 0) {
                paths[paths.length - 2] = paths[paths.length - 2] + count.toString();
            }
            let finalDirectory = paths.join("/");
            let isExists = await cdn.isPathExists([finalDirectory]);
            if (isExists[0] != true) {
                paths.pop();
                let direName = paths.pop();
                await cdn.createDirectory(paths.join("/") + "/", direName);
                return finalDirectory;
            }
            return await FileManagerBackup.getValidFolderPath(cdn, directory, count + 1);
        }
        catch (error) {
            throw error;
        }
    }
    static findObjectData(files, objectInfo) {
        let endSign = "";
        if (objectInfo.type == "dir") {
            endSign = "/";
        }
        for (let i = 0; i < files.length; i++) {
            if (files[i].endsWith(`${objectInfo.name}${endSign}`)) {
                return files[i];
            }
        }
    }
    static doToBackup(target, propertyKey, propertyDescriptor) {
        const originalMethod = propertyDescriptor.value;
        propertyDescriptor.value = async function (...args) {
            var _a, _b, _c;
            const self = this;
            let backups = await fileManagerConfigRepo.findAll({
                backups: self.CDN_id,
                isBackup: true,
                status: true
            });
            let currentConf = { ...self.config };
            let dir = "";
            if (backups.length > 0) {
                let dirName = Date.now();
                dir = `temp/${dirName}/`;
                if (args[1] == false) {
                    await ((_a = self.cdn) === null || _a === void 0 ? void 0 : _a.downloadFiles(args[0], {
                        folder: dir,
                        cacheStr: args[2]
                    }));
                }
            }
            var cdn;
            try {
                var result = await originalMethod.apply(this, args);
                if (self.CDN_id != undefined)
                    cdn = await fileManagerConfigRepo.findById(self.CDN_id);
            }
            catch (error) {
                if (dir != "") {
                    DiskFileManager.removeFolder(dir);
                }
                throw error;
            }
            for (let i = 0; i < backups.length; i++) {
                try {
                    const backCDN = new CDN_Manager(backups[i]._id);
                    await backCDN.init();
                    if (dir != "") {
                        let paths = [];
                        let backupBase = `backup/${(cdn === null || cdn === void 0 ? void 0 : cdn.title) || "data"}/`;
                        await backCDN.checkDirectoryIsExists(backupBase);
                        let files = await DiskFileManager.scanDir(dir, "", true);
                        let results = [];
                        for (let j = 0; j < files.length; j++) {
                            if (files[j].type == "dir") {
                                let dirPath = backupBase + files[j].name + "/";
                                let finalDir = await FileManagerBackup.getValidFolderPath(backCDN, dirPath);
                                await ((_b = backCDN.cdn) === null || _b === void 0 ? void 0 : _b.uploadFolder(dir + files[j].name + "/", finalDir));
                                results.push({
                                    file: FileManagerBackup.findObjectData(args[0], files[j]),
                                    backPath: finalDir
                                });
                            }
                            else {
                                let fileDest = backupBase + files[j].name;
                                let finalFile = await ((_c = backCDN.cdn) === null || _c === void 0 ? void 0 : _c.upload(dir + files[j].name, fileDest, {
                                    rename: false
                                }));
                                results.push({
                                    file: FileManagerBackup.findObjectData(args[0], files[j]),
                                    backPath: finalFile === null || finalFile === void 0 ? void 0 : finalFile.replace(backups[i].hostUrl, "")
                                });
                            }
                        }
                        for (let j = 0; j < results.length; j++) {
                            await backupFileRepo.insert({
                                backCDN: backups[i]._id,
                                cdn: cdn === null || cdn === void 0 ? void 0 : cdn._id,
                                backFile: results[j].backPath,
                                cdnFile: results[j].file
                            });
                        }
                    }
                }
                catch (error) {
                    console.log(error);
                }
            }
            if (currentConf._doc) {
                currentConf = currentConf._doc;
            }
            if (self.config != undefined) {
                self.initFromConfig(Object.assign(currentConf, {
                    id: currentConf === null || currentConf === void 0 ? void 0 : currentConf.id
                }));
            }
            try {
                if (dir != "") {
                    DiskFileManager.removeFolder(dir);
                }
            }
            catch (error) {
            }
            return result;
        };
        return propertyDescriptor;
    }
    static copyfromOther(target, propertyKey, propertyDescriptor) {
        const originalMethod = propertyDescriptor.value;
        propertyDescriptor.value = async function (...args) {
            const self = this;
            var backUpRepo = new repository_3.default();
            var backupService = new backup_1.default();
            try {
                var cdnId = self.CDN_id;
                var result = await originalMethod.apply(self, args);
            }
            catch (error) {
                throw error;
            }
            try {
                var backups = await fileManagerConfigRepo.findAll({
                    isBackup: true,
                    mirrorCDN: self.CDN_id,
                    status: true
                });
            }
            catch (error) {
                return result;
            }
            if (backups.length == 0) {
                return result;
            }
            self.CDN_id = cdnId;
            await self.init(true);
            for (let i = 0; i < backups.length; i++) {
                try {
                    self.copyToOther(args[0], backups[i], args[2]).then((result) => {
                    }).catch(err => console.log(err));
                }
                catch (error) {
                }
            }
            return result;
        };
        return propertyDescriptor;
    }
    static movefromOther(target, propertyKey, propertyDescriptor) {
        const originalMethod = propertyDescriptor.value;
        propertyDescriptor.value = async function (...args) {
            var _a, _b;
            const self = this;
            var backUpRepo = new repository_3.default();
            var backupService = new backup_1.default();
            try {
                var cdnId = self.CDN_id;
                var dirPath = await originalMethod.apply(self, args);
            }
            catch (error) {
                // console.log(error)
                throw error;
            }
            try {
                var backups = await fileManagerConfigRepo.findAll({
                    mirrorCDN: args[1],
                    status: true,
                    isBackup: true
                });
            }
            catch (error) {
                try {
                    DiskFileManager.removeFolder(dirPath);
                }
                catch (error) {
                }
                return dirPath;
            }
            if (backups.length == 0) {
                try {
                    DiskFileManager.removeFolder(dirPath);
                }
                catch (error) {
                }
                return dirPath;
            }
            self.CDN_id = cdnId;
            await self.init(true);
            var allinfo = DiskFileManager.getCommands(await DiskFileManager.scanDir(dirPath)).map((elem, i) => {
                elem.directory = args[2] + elem.directory;
                // elem.path = elem.path ? dirPath + "/" + elem.path : undefined
                if (elem.type == "file") {
                    elem.destination = elem.directory + path_1.default.basename(elem.path);
                    elem.path = dirPath + "/" + elem.path;
                }
                return elem;
            });
            var dirCmd = allinfo.filter((value, i) => {
                return value.type == "dir";
            });
            var fileCmd = allinfo.filter((value, i) => {
                return value.type == "file";
            });
            for (let i = 0; i < backups.length; i++) {
                try {
                    self.initFromConfig(backups[i]);
                    // new Promise(async (resolve, reject) => {
                    for (let j = 0; j < dirCmd.length; j++) {
                        await ((_a = self.cdn) === null || _a === void 0 ? void 0 : _a.craeteDirectory(dirCmd[j].directory, dirCmd[j].name, {}));
                    }
                    await ((_b = self.cdn) === null || _b === void 0 ? void 0 : _b.uploadMany(fileCmd));
                    // })
                }
                catch (error) {
                }
            }
            try {
                DiskFileManager.removeFolder(dirPath);
            }
            catch (error) {
            }
            return dirPath;
        };
        return propertyDescriptor;
    }
}
exports.FileManagerBackup = FileManagerBackup;
class CDN_Manager {
    // backupFileRepo : BackupFileRepository
    constructor(CDN_id) {
        this.CDN_id = CDN_id;
        this.fileManagerRepo = new repository_1.default();
        this.cdnOperationRepo = new repository_5.default();
        this.cdn_LockedPathRepository = new repository_6.default();
    }
    static addFilesToLockedPaths(index) {
        return (target, propertyKey, propertyDescriptor) => {
            const originalMethod = propertyDescriptor.value;
            propertyDescriptor.value = async function (...args) {
                const self = this;
                let files = args[index];
                let type = typeof files;
                try {
                    // self.cdn_LockedPathRepository.
                    if (type == "string") {
                        await self.cdn_LockedPathRepository.addPath(self.CDN_id, files);
                    }
                    else {
                        await self.cdn_LockedPathRepository.addPaths(self.CDN_id, files);
                    }
                    var result = await originalMethod.apply(this, args);
                }
                catch (error) {
                    if (type == "string") {
                        await self.cdn_LockedPathRepository.deletePath(self.CDN_id, files);
                    }
                    else {
                        await self.cdn_LockedPathRepository.deletePaths(self.CDN_id, files);
                    }
                    throw error;
                }
                if (type == "string") {
                    await self.cdn_LockedPathRepository.deletePath(self.CDN_id, files);
                }
                else {
                    await self.cdn_LockedPathRepository.deletePaths(self.CDN_id, files);
                }
                return result;
            };
            return propertyDescriptor;
        };
    }
    static addRenameLockedPaths(target, propertyKey, propertyDescriptor) {
        const originalMethod = propertyDescriptor.value;
        propertyDescriptor.value = async function (...args) {
            const self = this;
            let newFile = "";
            let file = args[0];
            let newName = args[1];
            let code = args[2].cacheStr;
            if (file.endsWith("/") || !file.includes(".")) {
                let filePaths = file.split("/");
                filePaths[filePaths.length - 1] = newName;
                newFile = filePaths.join("/") + "/";
                self.cdnOperationRepo.updateOne({
                    code
                }, {
                    $set: {
                        name: newFile
                    }
                });
            }
            try {
                await self.cdn_LockedPathRepository.addPath(self.CDN_id, newFile);
                var result = await originalMethod.apply(this, args);
            }
            catch (error) {
                await self.cdn_LockedPathRepository.deletePath(self.CDN_id, newFile);
                throw error;
            }
            await self.cdn_LockedPathRepository.deletePath(self.CDN_id, newFile);
            return result;
        };
        return propertyDescriptor;
    }
    static addCrossLockedPaths(target, propertyKey, propertyDescriptor) {
        const originalMethod = propertyDescriptor.value;
        propertyDescriptor.value = async function (...args) {
            const self = this;
            let cdn = args[1];
            let directory = args[2];
            if (typeof cdn != "string")
                cdn = cdn.id || cdn._id;
            let cdn_id = self.CDN_id;
            try {
                await self.cdn_LockedPathRepository.addPath(cdn, directory);
                var result = await originalMethod.apply(this, args);
            }
            catch (error) {
                await self.cdn_LockedPathRepository.deletePath(cdn, directory);
                await self.cdn_LockedPathRepository.deletePaths(cdn_id, args[0]);
                throw error;
            }
            await self.cdn_LockedPathRepository.deletePath(cdn, directory);
            await self.cdn_LockedPathRepository.deletePaths(cdn_id, args[0]);
            return result;
        };
        return propertyDescriptor;
    }
    async makeThumbNail(path) {
        var _a;
        // await this.init()
        try {
            let dires = path.split("/");
            // let baseName =
            // // // console.log("config" , this.config.hostUrl)
            // let baseName = path.split
            (_a = this.cdn) === null || _a === void 0 ? void 0 : _a.makeThumbNail(this.config.hostUrl + path, path);
        }
        catch (error) {
        }
    }
    async init(change = false) {
        if (this.cdn != undefined && !change) {
            return;
        }
        if (this.CDN_id) {
            try {
                var config = await this.fileManagerRepo.findById(this.CDN_id, {
                    fromDb: true
                });
            }
            catch (error) {
                throw error;
            }
            if (config == null) {
                throw new Error("کانفیگ یافت نشد");
            }
        }
        else {
            try {
                var config = await this.fileManagerRepo.getDefault();
            }
            catch (error) {
                throw error;
            }
            if (config == null) {
                throw new Error("کانفیگ یافت نشد");
            }
            // // console.log(config)
            this.config = { ...config };
            this.CDN_id = config._id;
        }
        if (config.type == model_1.FileManagerType.ftp) {
            this.cdn = new ftp_1.FTP(config.config.url, config.config.user, config.config.pass, config.hostUrl, config._id);
        }
        else {
            this.cdn = new objectStorage_1.S3(config.config.accessKey, config.config.secretKey, config.config.serviceUrl, config.config.bucket, config.hostUrl, config._id);
        }
        this.type = config.type;
        this.storageType = 'cdn';
    }
    async getCDN(id) {
        try {
            var config = await this.fileManagerRepo.findById(id, {
                fromDb: true
            });
        }
        catch (error) {
            throw error;
        }
        if (config == null) {
            throw new Error("کانفیگ یافت نشد");
        }
        if (config.type == model_1.FileManagerType.ftp) {
            return new ftp_1.FTP(config.config.url, config.config.user, config.config.pass, config.hostUrl, config._id);
        }
        else {
            return new objectStorage_1.S3(config.config.accessKey, config.config.secretKey, config.config.serviceUrl, config.config.bucket, config.hostUrl, config._id);
        }
    }
    initFromConfig(config) {
        this.config = config;
        this.storageType = config.backup ? 'backup' : 'cdn';
        this.CDN_id = config.id;
        // console.log("config", config)
        this.type = config.type;
        if (config.type == model_1.FileManagerType.ftp) {
            this.cdn = new ftp_1.FTP(config.config.url, config.config.user, config.config.pass, config.hostUrl, config.id);
        }
        else {
            this.cdn = new objectStorage_1.S3(config.config.accessKey, config.config.secretKey, config.config.serviceUrl, config.config.bucket, config.hostUrl, config.id);
        }
    }
    getConfig() {
        return this.config;
    }
    async checkDirectoryIsExists(path) {
        var _a;
        try {
            if (path == "")
                return;
            // // console.log(path)
            if (path == "/") {
                return;
            }
            // // console.log(path)
            var res = await ((_a = this.cdn) === null || _a === void 0 ? void 0 : _a.isPathExists([path]));
            if (res[0]) {
                return;
            }
            let paths = path.split("/");
            let current = paths.shift() + "/";
            await this.createDirectories(current, paths);
        }
        catch (error) {
            // console.log("err", 4255)
            throw error;
        }
    }
    async getFile(file) {
        var _a;
        return (_a = this.cdn) === null || _a === void 0 ? void 0 : _a.getFilesSize([file]);
    }
    /**
     * This function is used to create directories in the connected CDN.
     * It recursively creates directories based on the provided paths.
     *
     * @param current - The current directory path being processed.
     * @param paths - An array of directory paths that still need to be created.
     *
     * @returns {Promise<void>} - The function does not return any value.
     *
     * @throws {Error} - If an error occurs during the process of creating directories.
     */
    async createDirectories(current, paths) {
        var _a;
        var res = await ((_a = this.cdn) === null || _a === void 0 ? void 0 : _a.isPathExists([current]));
        if (!res[0]) {
            let ps = current.split("/");
            let path = "";
            let name = "";
            if (ps.length == 2) {
                name = ps[0];
            }
            else {
                ps.pop();
                name = ps.pop();
                path = ps.join("/") + "/";
            }
            await this.createDirectory(path, name);
        }
        if (paths.length == 1) {
            return;
        }
        current = current + paths.shift() + "/";
        await this.createDirectories(current, paths);
    }
    /**
     * This function is used to download files directly from the connected CDN.
     * It checks if the specified directory exists and then calls the CDN's direct download method.
     *
     * @param paths - An array of file paths to be downloaded.
     * @param directory - The directory path where the downloaded files will be saved.
     *
     * @returns {Promise<void>} - The function does not return any value.
     *
     * @throws {Error} - If an error occurs during the process of downloading files.
     */
    async drirectDownload(paths, directory) {
        var _a;
        try {
            // console.log(paths, directory)
            await this.checkDirectoryIsExists(directory);
            const hach = random_1.default.generateHash();
            let data = await ((_a = this.cdn) === null || _a === void 0 ? void 0 : _a.drirectDownload(paths[0], directory, hach));
            return data;
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * This function is used to upload files to the connected CDN.
     * It checks if the destination directory exists and then calls the CDN's upload method.
     *
     * @param path - The local file path to be uploaded.
     * @param destinationPath - The destination path on the CDN where the file will be saved.
     * @param id - An optional parameter to specify the CDN configuration ID.
     *
     * @returns {Promise<string>} - The function returns a Promise that resolves with the uploaded file's URL.
     *
     * @throws {Error} - If an error occurs during the process of uploading the file.
     */
    async upload(path, destinationPath, id) {
        var _a;
        // return destinationPath
        try {
            let ps = destinationPath.split("/");
            ps.pop();
            await this.init();
            await this.checkDirectoryIsExists(ps.join("/") + "/");
            return await ((_a = this.cdn) === null || _a === void 0 ? void 0 : _a.upload(path, destinationPath));
        }
        catch (error) {
            // console.log("err up")
            console.log(error);
            throw error;
        }
    }
    /**
     * This function is used to append a chunk of data to a file on the connected CDN.
     * It first checks if the destination directory exists and then calls the CDN's append method.
     *
     * @param chunk - The chunk of data to be appended to the file.
     * @param destinationPath - The destination path on the CDN where the chunk will be appended.
     * @param options - Additional options for appending the chunk.
     *
     * @returns {Promise<string>} - The function returns a Promise that resolves with the appended file's URL.
     *
     * @throws {Error} - If an error occurs during the process of appending the chunk.
     */
    // @FileManagerBackup.doToMirror
    async append(chunk, destinationPath, options) {
        var _a;
        try {
            let ps = destinationPath.split("/");
            let name = ps.pop();
            name = name === null || name === void 0 ? void 0 : name.toLocaleLowerCase();
            await this.init();
            await this.checkDirectoryIsExists(ps.join("/") + "/");
            if (name)
                ps.push(name);
            destinationPath = ps.join("/");
            let r = await ((_a = this.cdn) === null || _a === void 0 ? void 0 : _a.append(chunk, destinationPath, options));
            if (options.isfinished == true) {
                this.uploadAppendVideo(destinationPath);
            }
            return r;
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async uploadAppendVideo(destinationPath) {
        // let backCDNs = await cdn
        let backups = await fileManagerConfigRepo.findAll({
            mirrorCDN: this.CDN_id,
            isBackup: true,
            status: true
        });
        // // console.log(backups, self.config, self)
        // let currentConf = { ...this.config }
        for (let i = 0; i < backups.length; i++) {
            try {
                let paths = destinationPath.split("/");
                paths.pop();
                await this.copyToOther([destinationPath], backups[i]._id.toHexString(), paths.join("/") + "/");
                // await originalMethod.apply(self, args)
            }
            catch (error) {
                console.log(error);
            }
            // console.log(error)
        }
    }
    async uploadWithState(path, destinationPath, removeFile) {
        var _a;
        // return destinationPath
        try {
            let ps = destinationPath.split("/");
            let name = ps.pop();
            name = name === null || name === void 0 ? void 0 : name.toLocaleLowerCase();
            await this.init();
            await this.checkDirectoryIsExists(ps.join("/") + "/");
            const hach = random_1.default.generateHash();
            if (name)
                ps.push(name);
            destinationPath = ps.join("/");
            let r = await ((_a = this.cdn) === null || _a === void 0 ? void 0 : _a.uploadWithState(path, destinationPath, hach, {
                removeFile
            }));
            return r;
        }
        catch (error) {
            // console.log("err", "up")
            throw error;
        }
    }
    async isPathExists(paths) {
        var _a;
        return (_a = this.cdn) === null || _a === void 0 ? void 0 : _a.isPathExists(paths);
    }
    async uploadMany(paths, options) {
        var _a;
        try {
            await this.init();
            for (let i = 0; i < paths.length; i++) {
                let ps = paths[i].destination.split("/");
                let name = ps.pop();
                await this.init();
                await this.checkDirectoryIsExists(ps.join("/") + "/");
                if (name)
                    ps.push(name);
                paths[i].destination = ps.join("/");
            }
            var result = await ((_a = this.cdn) === null || _a === void 0 ? void 0 : _a.uploadMany(paths, options));
            return result;
        }
        catch (error) {
            throw error;
        }
    }
    async removeFile(path) {
    }
    async downloadFile(file, dest) {
        var _a;
        return (_a = this.cdn) === null || _a === void 0 ? void 0 : _a.getFile(file, dest);
    }
    async removeFiles(urls, moveToHidden = true, code) {
        var _a;
        // // console.log("removeFiles", urls, moveToHidden)
        try {
            // // console.log("cdn", this.cdn)
            let r = await ((_a = this.cdn) === null || _a === void 0 ? void 0 : _a.deleteFiles(urls, {
                moveToHidden,
                cacheStr: code
            }));
            try {
                if (code) {
                    let d = await cache.get(code);
                    if (d != null) {
                        var info = JSON.parse(d);
                        // console.log("info", info)
                        info.percentage = 100.00;
                        await cache.set(code, JSON.stringify(info));
                    }
                }
            }
            catch (error) {
            }
            if (code != undefined) {
                this.cdnOperationRepo.updateOne({
                    code,
                    status: "running"
                }, {
                    $set: {
                        status: "successed"
                    }
                });
            }
        }
        catch (error) {
            if (code != undefined) {
                try {
                    let d = await cache.get(code);
                    if (d != null) {
                        var info = JSON.parse(d);
                        info.failed = true;
                        await cache.set(code, JSON.stringify(info));
                    }
                }
                catch (error) {
                }
                let operation = await this.cdnOperationRepo.findOneAndUpdate({
                    code,
                    status: "running"
                }, {
                    $set: {
                        status: "failed",
                    }
                });
                if (operation != null)
                    this.cdnOperationRepo.updateOne({
                        _id: operation === null || operation === void 0 ? void 0 : operation._id
                    }, {
                        $set: {
                            err: error
                        }
                    });
            }
            throw error;
        }
    }
    async findCdnFromUrl(url) {
        var l = new URL(url);
        try {
            var config = await this.fileManagerRepo.findOne({
                hostUrl: {
                    $regex: l.hostname
                }
            });
            if (config == null) {
                throw new Error("یافت نشد");
            }
            if (config.type == model_1.FileManagerType.ftp) {
                this.cdn = new ftp_1.FTP(config.config.url, config.config.user, config.config.pass, config.hostUrl, config.id);
            }
            else {
                this.cdn = new objectStorage_1.S3(config.config.accessKey, config.config.secretKey, config.config.serviceUrl, config.config.bucket, config.hostUrl, config._id);
            }
            this.config = config;
        }
        catch (error) {
        }
    }
    async getFiles(path, options) {
        var _a;
        try {
            return await ((_a = this.cdn) === null || _a === void 0 ? void 0 : _a.getFiles(path, {
                extendFolders: true
            }));
        }
        catch (error) {
            throw error;
        }
    }
    async test() {
        var _a;
        try {
            return await ((_a = this.cdn) === null || _a === void 0 ? void 0 : _a.getFiles("", {
                extendFolders: false
            }));
        }
        catch (error) {
            throw error;
        }
    }
    async validateToCopy(files, dest, id) {
        var _a, _b, _c;
        var temp_cdn = undefined;
        if (id) {
            try {
                temp_cdn = await this.getCDN(id);
            }
            catch (error) {
                throw error;
            }
        }
        try {
            let result = [];
            for (let i = 0; i < files.length; i++) {
                // console.log(this.cdn)
                if ((_a = this.cdn) === null || _a === void 0 ? void 0 : _a.isFolder(files[i])) {
                    let dires = files[i].split("/");
                    if (files[i].endsWith("/"))
                        var fileName = dires[dires.length - 2];
                    else {
                        var fileName = dires[dires.length - 1];
                    }
                    let isExists = await ((_b = (temp_cdn || this.cdn)) === null || _b === void 0 ? void 0 : _b.isPathExists([dest + fileName + "/"]));
                    if (isExists[0]) {
                        let subFiles = await this.getFiles(files[i]);
                        let subs = subFiles.map((elem) => {
                            if (elem.name) {
                                return files[i] + elem.name;
                            }
                            else {
                                return files[i] + elem.prefix;
                            }
                        });
                        let info = {};
                        info['file'] = files[i];
                        info['sub'] = await this.validateToCopy(subs, dest + fileName + "/");
                        result.push(info);
                    }
                }
                else {
                    let dires = files[i].split("/");
                    let fileName = dires[dires.length - 1];
                    let isExists = await ((_c = (temp_cdn || this.cdn)) === null || _c === void 0 ? void 0 : _c.isPathExists([dest + fileName]));
                    if (isExists && isExists[0]) {
                        let info = {};
                        info['file'] = files[i];
                        result.push(info);
                    }
                }
            }
            return result;
        }
        catch (error) {
            throw error;
        }
    }
    // @CDN_Manager.addFilesToLockedPaths(0)
    async restore(p, code) {
        var _a;
        try {
            await this.init();
            return await ((_a = this.cdn) === null || _a === void 0 ? void 0 : _a.restore(p, code));
        }
        catch (error) {
            // console.log("error")
            throw error;
        }
    }
    async restoreMany(files, code) {
        try {
            await this.init();
            for (let i = 0; i < files.length; i++) {
                await this.restore(files[i], code);
            }
            this.cdnOperationRepo.updateOne({
                code,
                status: "running"
            }, {
                $set: {
                    status: "successed"
                }
            });
        }
        catch (error) {
            // console.log(error)
            try {
                let d = await cache.get(code);
                if (d != null) {
                    var info = JSON.parse(d);
                    info.failed = true;
                    await cache.set(code, JSON.stringify(info));
                }
            }
            catch (err) {
            }
            let operation = await this.cdnOperationRepo.findOneAndUpdate({
                code,
                status: "running"
            }, {
                $set: {
                    status: "failed",
                }
            });
            if (operation != null)
                this.cdnOperationRepo.updateOne({
                    _id: operation === null || operation === void 0 ? void 0 : operation._id
                }, {
                    $set: {
                        err: error
                    }
                });
            // console.log("ee")
            // throw error
        }
    }
    async deleteRecycle() {
        var _a;
        await this.init();
        let files = await ((_a = this.cdn) === null || _a === void 0 ? void 0 : _a.getFiles("recycle_bin/"));
        // // console.log(this.CDN_id)
        // // console.log("f" , files)
        if (this.type == "ftp") {
            let toDelete = [];
            for (let i = 0; i < files.length; i++) {
                // "e".endsWith
                // console.log(files[i].name.endsWith("."), files[i].type)
                if (!files[i].name.endsWith(".")) {
                    if (files[i].type == "d") {
                        toDelete.push("recycle_bin/" + files[i].name + "/");
                    }
                    else {
                        toDelete.push("recycle_bin/" + files[i].name);
                    }
                }
            }
            await this.removeFiles(toDelete, false);
            await recycleBinRepo.deleteMany({
                config: this.CDN_id
            });
            return toDelete;
        }
        return files;
    }
    async deleteFromTrash(p) {
        try {
            await this.removeFiles([p], false);
            try {
                await recycleBinRepo.findOneAndDelete({
                    path: p,
                    config: this.CDN_id
                });
            }
            catch (error) {
            }
        }
        catch (error) {
        }
    }
    async deleteManyFromTrash(paths, cacheStr) {
        try {
            await this.removeFiles(paths, false, cacheStr);
            try {
                await recycleBinRepo.deleteMany({
                    path: {
                        $in: paths
                    },
                    config: this.CDN_id
                });
            }
            catch (error) {
            }
        }
        catch (error) {
        }
    }
    makUniform(directory, files) {
        var results = [];
        if (this.type == "ftp") {
            for (let i = 0; i < files.length; i++) {
                if (files[i].name.includes(".hidden") || files[i].name.endsWith(".") || files[i].name.includes("---thumbnail")) {
                    continue;
                }
                var id = files[i].type == "d" ? directory + files[i].name + "/" : directory + files[i].name;
                if (files[i].path) {
                    id = files[i].path;
                    id += files[i].type == "d" && !files[i].path.endsWith("/") ? "/" : "";
                }
                results.push({
                    id,
                    type: files[i].type == "d" ? "dir" : "file",
                    name: files[i].name,
                    size: files[i].size,
                    date: files[i].date,
                    path: files[i].path
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
                results.push({
                    id,
                    type: files[i].prefix ? "dir" : "file",
                    name,
                    size: files[i].size,
                    date: files[i].lastModified,
                    path: files[i].path
                });
            }
        }
        return results;
    }
    async createDirectory(path, name, options) {
        var _a;
        try {
            name = name.toLocaleLowerCase();
            return (_a = this.cdn) === null || _a === void 0 ? void 0 : _a.craeteDirectory(path, name, options);
        }
        catch (error) {
            throw error;
        }
    }
    async search(term, directory, options) {
        var _a;
        return (_a = this.cdn) === null || _a === void 0 ? void 0 : _a.search(term, directory, options);
    }
    async zip(files, name, directory, options) {
        var _a;
        try {
            let r = await ((_a = this.cdn) === null || _a === void 0 ? void 0 : _a.zip(files, name, directory, options));
            if ((options === null || options === void 0 ? void 0 : options.cacheStr) != undefined) {
                let d = await cache.get(options === null || options === void 0 ? void 0 : options.cacheStr);
                if (d != null) {
                    var info = JSON.parse(d);
                    // console.log("info", info)
                    info.percentage = 100.00;
                    await cache.set(options === null || options === void 0 ? void 0 : options.cacheStr, JSON.stringify(info));
                }
                this.cdnOperationRepo.updateOne({
                    code: options === null || options === void 0 ? void 0 : options.cacheStr,
                    status: "running"
                }, {
                    $set: {
                        status: "successed",
                    }
                });
            }
        }
        catch (error) {
            if ((options === null || options === void 0 ? void 0 : options.cacheStr) != undefined) {
                try {
                    let d = await cache.get(options === null || options === void 0 ? void 0 : options.cacheStr);
                    if (d != null) {
                        var info = JSON.parse(d);
                        info.failed = true;
                        await cache.set(options === null || options === void 0 ? void 0 : options.cacheStr, JSON.stringify(info));
                    }
                }
                catch (error) {
                }
                let operation = await this.cdnOperationRepo.findOneAndUpdate({
                    code: options === null || options === void 0 ? void 0 : options.cacheStr,
                    status: "running"
                }, {
                    $set: {
                        status: "failed",
                    }
                });
                if (operation != null)
                    this.cdnOperationRepo.updateOne({
                        _id: operation === null || operation === void 0 ? void 0 : operation._id
                    }, {
                        $set: {
                            err: error
                        }
                    });
            }
            throw error;
        }
    }
    async unzip(file, directory, options) {
        var _a;
        try {
            let r = await ((_a = this.cdn) === null || _a === void 0 ? void 0 : _a.unzip(file, directory, options));
            if (options === null || options === void 0 ? void 0 : options.cacheStr) {
                this.cdnOperationRepo.updateOne({
                    code: options.cacheStr,
                    status: "running"
                }, {
                    $set: {
                        status: "successed"
                    }
                });
            }
            return r;
        }
        catch (error) {
            if (options === null || options === void 0 ? void 0 : options.cacheStr) {
                try {
                    let d = await cache.get(options.cacheStr);
                    if (d != null) {
                        var info = JSON.parse(d);
                        info.failed = true;
                        await cache.set(options.cacheStr, JSON.stringify(info));
                    }
                }
                catch (error) {
                }
                let operation = await this.cdnOperationRepo.findOneAndUpdate({
                    code: options.cacheStr,
                    status: "running"
                }, {
                    $set: {
                        status: "failed",
                    }
                });
                if (operation != null)
                    this.cdnOperationRepo.updateOne({
                        _id: operation === null || operation === void 0 ? void 0 : operation._id
                    }, {
                        $set: {
                            err: error
                        }
                    });
            }
            throw error;
        }
    }
    async getZipFileInfo(file) {
        var _a;
        return (_a = this.cdn) === null || _a === void 0 ? void 0 : _a.getZipFileInfo(file);
    }
    async copy(files, directory, options) {
        var _a;
        try {
            let r = await ((_a = this.cdn) === null || _a === void 0 ? void 0 : _a.copy(files, directory, options));
            try {
                if (options.cacheStr) {
                    let d = await cache.get(options.cacheStr);
                    if (d != null) {
                        var info = JSON.parse(d);
                        // console.log("info", info)
                        info.percentage = 100.00;
                        await cache.set(options.cacheStr, JSON.stringify(info));
                    }
                }
            }
            catch (error) {
            }
            if (options.cacheStr != undefined) {
                this.cdnOperationRepo.updateOne({
                    code: options.cacheStr,
                    status: "running"
                }, {
                    $set: {
                        status: "successed"
                    }
                });
            }
            return r;
        }
        catch (error) {
            if (options.cacheStr != undefined) {
                try {
                    let d = await cache.get(options.cacheStr);
                    if (d != null) {
                        var info = JSON.parse(d);
                        info.failed = true;
                        await cache.set(options.cacheStr, JSON.stringify(info));
                    }
                }
                catch (error) {
                }
                let operation = await this.cdnOperationRepo.findOneAndUpdate({
                    code: options.cacheStr,
                    status: "running"
                }, {
                    $set: {
                        status: "failed",
                    }
                });
                if (operation != null)
                    this.cdnOperationRepo.updateOne({
                        _id: operation === null || operation === void 0 ? void 0 : operation._id
                    }, {
                        $set: {
                            err: error
                        }
                    });
            }
            throw error;
        }
    }
    async move(files, directory, options) {
        var _a;
        try {
            let r = await ((_a = this.cdn) === null || _a === void 0 ? void 0 : _a.move(files, directory, options));
            try {
                if (options.cacheStr) {
                    let d = await cache.get(options.cacheStr);
                    if (d != null) {
                        var info = JSON.parse(d);
                        // console.log("info", info)
                        info.percentage = 100.00;
                        await cache.set(options.cacheStr, JSON.stringify(info));
                    }
                }
            }
            catch (error) {
            }
            if (options.cacheStr != undefined) {
                this.cdnOperationRepo.updateOne({
                    code: options.cacheStr,
                    status: "running"
                }, {
                    $set: {
                        status: "successed"
                    }
                });
            }
            return r;
        }
        catch (error) {
            if (options.cacheStr != undefined) {
                try {
                    let d = await cache.get(options.cacheStr);
                    if (d != null) {
                        var info = JSON.parse(d);
                        info.failed = true;
                        await cache.set(options.cacheStr, JSON.stringify(info));
                    }
                }
                catch (error) {
                }
                let operation = await this.cdnOperationRepo.findOneAndUpdate({
                    code: options.cacheStr,
                    status: "running"
                }, {
                    $set: {
                        status: "failed",
                    }
                });
                if (operation != null)
                    this.cdnOperationRepo.updateOne({
                        _id: operation === null || operation === void 0 ? void 0 : operation._id
                    }, {
                        $set: {
                            err: error
                        }
                    });
            }
            throw error;
        }
    }
    async rename(file, name, options) {
        var _a;
        try {
            await ((_a = this.cdn) === null || _a === void 0 ? void 0 : _a.rename(file, name, options));
            try {
                if (options.cacheStr) {
                    let d = await cache.get(options.cacheStr);
                    if (d != null) {
                        var info = JSON.parse(d);
                        // // console.log("info", info)
                        info.percentage = 100.00;
                        await cache.set(options.cacheStr, JSON.stringify(info));
                    }
                    this.cdnOperationRepo.updateOne({
                        code: options.cacheStr,
                        status: "running"
                    }, {
                        $set: {
                            status: "successed"
                        }
                    });
                }
            }
            catch (error) {
            }
        }
        catch (error) {
            if (options.cacheStr != undefined) {
                try {
                    let d = await cache.get(options.cacheStr);
                    if (d != null) {
                        var info = JSON.parse(d);
                        info.failed = true;
                        await cache.set(options.cacheStr, JSON.stringify(info));
                    }
                }
                catch (error) {
                }
                let operation = await this.cdnOperationRepo.findOneAndUpdate({
                    code: options.cacheStr,
                    status: "running"
                }, {
                    $set: {
                        status: "failed",
                    }
                });
                if (operation != null)
                    this.cdnOperationRepo.updateOne({
                        _id: operation === null || operation === void 0 ? void 0 : operation._id
                    }, {
                        $set: {
                            err: error
                        }
                    });
            }
            throw error;
        }
        return;
    }
    async findFolder(directory = "") {
        var _a;
        return await ((_a = this.cdn) === null || _a === void 0 ? void 0 : _a.findFolder(directory, 1, {
            checkSub: true
        }));
    }
    async downloadAndZipFolder(folder, code) {
        var _a;
        try {
            let dirs = folder.split("/");
            await this.init();
            let p = await ((_a = this.cdn) === null || _a === void 0 ? void 0 : _a.downloadFiles([folder], {
                cacheStr: code,
                folder: "temp/" + Date.now()
            }));
            await (0, zip_a_folder_1.zip)(p + "/" + dirs[dirs.length - 2], p + "/" + dirs[dirs.length - 2] + ".zip", {});
            let atachment = p + "/" + dirs[dirs.length - 2] + ".zip";
            // // console.log("ppppp", p, dirs[dirs.length - 2])
            await DiskFileManager.move(p + "/" + dirs[dirs.length - 2] + ".zip", "src/uploads/tmp/");
            if (p)
                await DiskFileManager.removeFolder(p);
            atachment = config_1.default.getConfig("serverurl") + "/uploads/tmp/" + dirs[dirs.length - 2] + ".zip";
            try {
                if (code) {
                    let d = await cache.get(code);
                    if (d != null) {
                        var info = JSON.parse(d);
                        info['atachment'] = atachment;
                        // console.log("info", info)
                        info.percentage = 100.00;
                        // console.log("atachment", atachment)
                        await cache.set(code, JSON.stringify(info));
                    }
                }
            }
            catch (error) {
            }
            if (code != undefined) {
                this.cdnOperationRepo.updateOne({
                    code,
                    status: "running"
                }, {
                    $set: {
                        status: "successed",
                        atachment
                    }
                });
            }
        }
        catch (error) {
            if (code != undefined) {
                try {
                    let d = await cache.get(code);
                    if (d != null) {
                        var info = JSON.parse(d);
                        info.failed = true;
                        await cache.set(code, JSON.stringify(info));
                    }
                }
                catch (error) {
                }
                let operation = await this.cdnOperationRepo.findOneAndUpdate({
                    code,
                    status: "running"
                }, {
                    $set: {
                        status: "failed",
                    }
                });
                if (operation != null)
                    this.cdnOperationRepo.updateOne({
                        _id: operation === null || operation === void 0 ? void 0 : operation._id
                    }, {
                        $set: {
                            err: error
                        }
                    });
            }
            throw error;
        }
    }
    async copyToOther(files, toCdn, directory, fromLink = false, options) {
        var _a, _b;
        try {
            var resFiles = [];
            if (fromLink) {
                var dirName = Date.now().toString();
                await DiskFileManager.mkdir("src/uploads/", dirName);
                var dirPath = "src/uploads/" + dirName + "/";
                await DiskFileManager.downloadFiles(files, dirPath);
            }
            else {
                var dirPath = await ((_a = this.cdn) === null || _a === void 0 ? void 0 : _a.downloadFiles(files, {
                    cacheStr: options === null || options === void 0 ? void 0 : options.cacheStr
                }));
                if (dirPath == undefined) {
                    throw new Error("");
                }
            }
            if (typeof toCdn == "string") {
                this.CDN_id = toCdn;
                await this.init(true);
            }
            else {
                this.initFromConfig(toCdn);
            }
            try {
                if (options === null || options === void 0 ? void 0 : options.cacheStr) {
                    let d = await cache.get(options.cacheStr);
                    let info = JSON.parse(d);
                    info.copying = true;
                    info.percentage = 0;
                    info.uploaded = 0;
                    await cache.set(options.cacheStr, JSON.stringify(info));
                }
            }
            catch (error) {
            }
            var result = await ((_b = this.cdn) === null || _b === void 0 ? void 0 : _b.uploadFolder(dirPath, directory, false, {
                cacheStr: options === null || options === void 0 ? void 0 : options.cacheStr,
                rename: options === null || options === void 0 ? void 0 : options.rename,
                all: true
            }));
            if ((options === null || options === void 0 ? void 0 : options.cacheStr) != undefined) {
                this.cdnOperationRepo.updateOne({
                    code: options.cacheStr,
                    status: "running"
                }, {
                    $set: {
                        status: "successed"
                    }
                });
            }
            await DiskFileManager.removeFolder(dirPath);
            return result;
        }
        catch (error) {
            if ((options === null || options === void 0 ? void 0 : options.cacheStr) != undefined) {
                try {
                    let d = await cache.get(options.cacheStr);
                    if (d != null) {
                        var info = JSON.parse(d);
                        info.failed = true;
                        await cache.set(options.cacheStr, JSON.stringify(info));
                    }
                }
                catch (error) {
                }
                let operation = await this.cdnOperationRepo.findOneAndUpdate({
                    code: options.cacheStr,
                    status: "running"
                }, {
                    $set: {
                        status: "failed",
                    }
                });
                if (operation != null)
                    this.cdnOperationRepo.updateOne({
                        _id: operation === null || operation === void 0 ? void 0 : operation._id
                    }, {
                        $set: {
                            err: error
                        }
                    });
            }
            throw error;
        }
    }
    async backUpToOther(files, toCdn, directory, ttl) {
        var _a, _b;
        var dirPath = "";
        try {
            var results = [];
            for (let i = 0; i < files.length; i++) {
                // console.log(i, files[i])
                dirPath = await ((_a = this.cdn) === null || _a === void 0 ? void 0 : _a.downloadFiles([files[i]]));
                if (dirPath == undefined) {
                    throw new Error("");
                }
                if (!dirPath.endsWith("/")) {
                    dirPath += "/";
                }
                if (typeof toCdn == "string") {
                    this.CDN_id = toCdn;
                    await this.init();
                }
                else {
                    this.initFromConfig(toCdn);
                }
                var result = await ((_b = this.cdn) === null || _b === void 0 ? void 0 : _b.uploadFolder(dirPath, directory, false));
                await DiskFileManager.removeFolder(dirPath);
                results.push(files[i]);
                // if (new Date() > ttl)
                //     return results
            }
            return results;
        }
        catch (error) {
            try {
                await DiskFileManager.removeFolder(dirPath);
            }
            catch (error) {
            }
            throw error;
        }
    }
    async backup(dir, backup) {
        var _a;
        let files = this.makeUniform(await this.getFiles(dir), dir);
        for (let i = 0; i < files.length; i++) {
            if (files[i].id.endsWith("/")) {
                let dirs = files[i].id.split("/");
                let cdn = this.cdn;
                this.cdn = backup;
                this.CDN_id = backup.id;
                await this.createDirectory(dir, dirs[dirs.length - 2]);
                this.cdn = cdn;
                await this.backup(files[i].id, backup);
            }
            else {
                let dirs = files[i].id.split("/");
                // // console.log(files[i].id)
                let file = await DiskFileManager.downloadFile(((_a = this.cdn) === null || _a === void 0 ? void 0 : _a.baseDir) + files[i].id);
                let cdn = this.cdn;
                this.cdn = backup;
                this.CDN_id = backup.id;
                await fileManagerConfigRepo.updateOne({
                    _id: backup.id
                }, {
                    $inc: {
                        transfered: 1
                    }
                });
                await this.uploadMany([{
                        destination: dir + path_1.default.basename(file),
                        path: file
                    }], {
                    rename: false
                });
                this.cdn = cdn;
            }
        }
    }
    makeUniform(files, directory) {
        var _a, _b;
        // // console.log("files" , files)
        var results = [];
        if (this.type == "ftp") {
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
    async moveToOther(files, toCdn, directory, options) {
        var _a, _b;
        try {
            var dirPath = await ((_a = this.cdn) === null || _a === void 0 ? void 0 : _a.downloadFiles(files, {
                cacheStr: options === null || options === void 0 ? void 0 : options.cacheStr
            }));
            if (dirPath == undefined) {
                throw new Error("");
            }
            var cdn = this.cdn;
            var currentCDN = this.CDN_id;
            this.CDN_id = toCdn;
            await this.init(true);
            try {
                if (options === null || options === void 0 ? void 0 : options.cacheStr) {
                    let d = await cache.get(options.cacheStr);
                    let info = JSON.parse(d);
                    info.copying = true;
                    info.percentage = 0;
                    info.uploaded = 0;
                    await cache.set(options.cacheStr, JSON.stringify(info));
                }
            }
            catch (error) {
            }
            var result = await ((_b = this.cdn) === null || _b === void 0 ? void 0 : _b.uploadFolder(dirPath, directory, false, {
                rename: options === null || options === void 0 ? void 0 : options.rename,
                all: true,
                cacheStr: options === null || options === void 0 ? void 0 : options.cacheStr
            }));
            try {
                if (options === null || options === void 0 ? void 0 : options.cacheStr) {
                    let d = await cache.get(options.cacheStr);
                    let info = JSON.parse(d);
                    info.deleting = true;
                    info.percentage = 0;
                    info.uploaded = 0;
                    await cache.set(options.cacheStr, JSON.stringify(info));
                }
            }
            catch (error) {
            }
            this.cdn = cdn;
            this.CDN_id = currentCDN;
            await this.removeFiles(files, false, options === null || options === void 0 ? void 0 : options.cacheStr);
            // try {
            //     DiskFileManager.removeFolder(dirPath)
            // } catch (error) {
            // }
            return dirPath;
        }
        catch (error) {
            if ((options === null || options === void 0 ? void 0 : options.cacheStr) != undefined) {
                try {
                    let d = await cache.get(options.cacheStr);
                    if (d != null) {
                        var info = JSON.parse(d);
                        info.failed = true;
                        await cache.set(options.cacheStr, JSON.stringify(info));
                    }
                }
                catch (error) {
                }
                let operation = await this.cdnOperationRepo.findOneAndUpdate({
                    code: options.cacheStr,
                    status: "running"
                }, {
                    $set: {
                        status: "failed",
                    }
                });
                if (operation != null)
                    this.cdnOperationRepo.updateOne({
                        _id: operation === null || operation === void 0 ? void 0 : operation._id
                    }, {
                        $set: {
                            err: error
                        }
                    });
            }
            try {
                if (dirPath)
                    DiskFileManager.removeFolder(dirPath);
            }
            catch (error) {
            }
            throw error;
        }
    }
    async restoreToOther(files, toCdn, directory, options, renameTo) {
        var _a, _b;
        try {
            var dirPath = await ((_a = this.cdn) === null || _a === void 0 ? void 0 : _a.downloadFiles(files, {
                cacheStr: options === null || options === void 0 ? void 0 : options.cacheStr,
                renameTo
            }));
            if (dirPath == undefined) {
                throw new Error("");
            }
            var cdn = this.cdn;
            var currentCDN = this.CDN_id;
            this.CDN_id = toCdn;
            await this.init(true);
            try {
                if (options === null || options === void 0 ? void 0 : options.cacheStr) {
                    let d = await cache.get(options.cacheStr);
                    let info = JSON.parse(d);
                    info.copying = true;
                    info.percentage = 0;
                    info.uploaded = 0;
                    await cache.set(options.cacheStr, JSON.stringify(info));
                }
            }
            catch (error) {
            }
            var result = await ((_b = this.cdn) === null || _b === void 0 ? void 0 : _b.uploadFolder(dirPath, directory, false, {
                rename: options === null || options === void 0 ? void 0 : options.rename,
                all: true,
                cacheStr: options === null || options === void 0 ? void 0 : options.cacheStr
            }));
            try {
                if (options === null || options === void 0 ? void 0 : options.cacheStr) {
                    let d = await cache.get(options.cacheStr);
                    let info = JSON.parse(d);
                    info.deleting = true;
                    info.percentage = 0;
                    info.uploaded = 0;
                    await cache.set(options.cacheStr, JSON.stringify(info));
                }
            }
            catch (error) {
            }
            this.cdn = cdn;
            this.CDN_id = currentCDN;
            await this.removeFiles(files, false, options === null || options === void 0 ? void 0 : options.cacheStr);
            backupFileRepo.deleteMany({
                backCDN: {
                    $eq: this.CDN_id
                },
                backFile: {
                    $in: files
                }
            });
            return dirPath;
        }
        catch (error) {
            if ((options === null || options === void 0 ? void 0 : options.cacheStr) != undefined) {
                try {
                    let d = await cache.get(options.cacheStr);
                    if (d != null) {
                        var info = JSON.parse(d);
                        info.failed = true;
                        await cache.set(options.cacheStr, JSON.stringify(info));
                    }
                }
                catch (error) {
                }
                let operation = await this.cdnOperationRepo.findOneAndUpdate({
                    code: options.cacheStr,
                    status: "running"
                }, {
                    $set: {
                        status: "failed",
                    }
                });
                if (operation != null)
                    this.cdnOperationRepo.updateOne({
                        _id: operation === null || operation === void 0 ? void 0 : operation._id
                    }, {
                        $set: {
                            err: error
                        }
                    });
            }
            try {
                if (dirPath)
                    DiskFileManager.removeFolder(dirPath);
            }
            catch (error) {
            }
            throw error;
        }
    }
    async setPermission(file, permission, options) {
        var _a;
        try {
            if (this.type == "ftp")
                return (_a = this.cdn) === null || _a === void 0 ? void 0 : _a.setPermission(file, permission, options);
            return true;
        }
        catch (error) {
            throw error;
        }
    }
    async getInfo() {
        var _a;
        try {
            return (_a = this.cdn) === null || _a === void 0 ? void 0 : _a.getInfo();
        }
        catch (error) {
            throw error;
        }
    }
    getDefaultUrl() {
        var _a;
        return (_a = this.cdn) === null || _a === void 0 ? void 0 : _a.baseDir;
    }
    async reset() {
        if (this.type == "ftp") {
            // await this.cdn?.resetFTP()
        }
        return {};
    }
    async removeAll() {
        let files = this.makeUniform(await this.getFiles(""), "");
        for (let i = 0; i < files.length; i++) {
            await this.removeFiles([files[i].id], false);
        }
    }
    async getFolderAllFiles(folder) {
        var _a;
        try {
            await this.init();
            return (_a = this.cdn) === null || _a === void 0 ? void 0 : _a.getFolderAllFiles(folder);
        }
        catch (error) {
            throw error;
        }
    }
    async makeBucket(name) {
        var _a;
        try {
            await ((_a = this.cdn) === null || _a === void 0 ? void 0 : _a.makeBucket(name));
        }
        catch (error) {
            throw error;
        }
    }
    async removeBucket(name) {
        var _a;
        return (_a = this.cdn) === null || _a === void 0 ? void 0 : _a.removeBucket(name);
    }
}
exports.default = CDN_Manager;
__decorate([
    FileManagerBackup.doToMirror
], CDN_Manager.prototype, "createDirectories", null);
__decorate([
    FileManagerBackup.doToMirror,
    processCDN_Direct_Download
], CDN_Manager.prototype, "drirectDownload", null);
__decorate([
    FileManagerBackup.doToMirror,
    processCDN_Upload
], CDN_Manager.prototype, "upload", null);
__decorate([
    processCDN_Append
], CDN_Manager.prototype, "append", null);
__decorate([
    FileManagerBackup.doToMirror,
    processCDN_Upload_Width_State
], CDN_Manager.prototype, "uploadWithState", null);
__decorate([
    FileManagerBackup.doToMirror,
    processCDN_Upload
], CDN_Manager.prototype, "uploadMany", null);
__decorate([
    FileManagerBackup.doToMirror,
    processCDN_Delete,
    CDN_Manager.addFilesToLockedPaths(0),
    FileManagerBackup.doToBackup
], CDN_Manager.prototype, "removeFiles", null);
__decorate([
    FileManagerBackup.doToMirror
    // @CDN_Manager.addFilesToLockedPaths(0)
], CDN_Manager.prototype, "restore", null);
__decorate([
    CDN_Manager.addFilesToLockedPaths(0)
], CDN_Manager.prototype, "restoreMany", null);
__decorate([
    FileManagerBackup.doToMirror
], CDN_Manager.prototype, "deleteRecycle", null);
__decorate([
    FileManagerBackup.doToMirror
], CDN_Manager.prototype, "deleteFromTrash", null);
__decorate([
    FileManagerBackup.doToMirror,
    CDN_Manager.addFilesToLockedPaths(0)
], CDN_Manager.prototype, "deleteManyFromTrash", null);
__decorate([
    FileManagerBackup.doToMirror,
    processCDN_Directory
], CDN_Manager.prototype, "createDirectory", null);
__decorate([
    processCDN_Zip,
    FileManagerBackup.doToMirror,
    CDN_Manager.addFilesToLockedPaths(0)
], CDN_Manager.prototype, "zip", null);
__decorate([
    processCDN_UnZip,
    FileManagerBackup.doToMirror,
    CDN_Manager.addFilesToLockedPaths(1),
    CDN_Manager.addFilesToLockedPaths(0)
], CDN_Manager.prototype, "unzip", null);
__decorate([
    FileManagerBackup.doToMirror,
    processCDN_Copy_Move,
    CDN_Manager.addFilesToLockedPaths(1),
    CDN_Manager.addFilesToLockedPaths(0)
], CDN_Manager.prototype, "copy", null);
__decorate([
    FileManagerBackup.doToMirror,
    processCDN_Copy_Move,
    CDN_Manager.addFilesToLockedPaths(1),
    CDN_Manager.addFilesToLockedPaths(0)
], CDN_Manager.prototype, "move", null);
__decorate([
    FileManagerBackup.doToMirror,
    CDN_Manager.addFilesToLockedPaths(0),
    CDN_Manager.addRenameLockedPaths
], CDN_Manager.prototype, "rename", null);
__decorate([
    CDN_Manager.addFilesToLockedPaths(0)
], CDN_Manager.prototype, "downloadAndZipFolder", null);
__decorate([
    FileManagerBackup.copyfromOther,
    processCDN_Copy_Move,
    CDN_Manager.addCrossLockedPaths,
    CDN_Manager.addFilesToLockedPaths(0)
], CDN_Manager.prototype, "copyToOther", null);
__decorate([
    FileManagerBackup.movefromOther,
    processCDN_Copy_Move,
    CDN_Manager.addCrossLockedPaths,
    CDN_Manager.addFilesToLockedPaths(0)
], CDN_Manager.prototype, "moveToOther", null);
__decorate([
    FileManagerBackup.movefromOther,
    processCDN_Copy_Move,
    CDN_Manager.addCrossLockedPaths,
    CDN_Manager.addFilesToLockedPaths(0)
], CDN_Manager.prototype, "restoreToOther", null);
__decorate([
    FileManagerBackup.doToMirror
], CDN_Manager.prototype, "setPermission", null);
