"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3 = void 0;
const fs_1 = __importDefault(require("fs"));
const minio = __importStar(require("minio"));
const path_1 = __importDefault(require("path"));
const zip_a_folder_1 = require("zip-a-folder");
const extract_zip_1 = __importDefault(require("extract-zip"));
const errorLogger_1 = __importDefault(require("../../errorLogger"));
const redis_cache_1 = __importDefault(require("../../redis-cache"));
const imageProccessing_1 = __importDefault(require("../imageProccessing"));
const fileManager_1 = require("../fileManager");
const repository_1 = __importDefault(require("../../mongoose-controller/repositories/recycleBin/repository"));
const random_1 = __importDefault(require("../../random"));
const videoProccessing_1 = __importDefault(require("../videoProccessing"));
const config_1 = __importDefault(require("../config"));
const mime_types_1 = __importDefault(require("mime-types"));
// const mime = dynamic('mime')
const recycleBinRepo = new repository_1.default();
const cache = new redis_cache_1.default("file_managing");
class S3 {
    constructor(accsessKey, secretKey, endPoint, bucketName, baseDir, id) {
        this.id = id;
        this.baseDir = baseDir;
        var l = new URL(endPoint);
        l.href = endPoint;
        this.extendedPath = l.pathname;
        this.s3 = new minio.Client({
            accessKey: accsessKey,
            secretKey: secretKey,
            endPoint: l.hostname,
            useSSL: false,
            port: parseInt(l.port),
            region: 'default',
        });
        this.bucketName = bucketName;
        this.rootName = "";
        this.isminio = endPoint.includes("arvanstorage");
        // this.mimeType = new mime.Mime()
    }
    async resetFTP() {
        // var connectionProvider = FTPConnectionProvider.getInstance(this.host, this.user ,this.password)
        // connectionProvider.connection = new ftp()
    }
    async drirectDownload(url, directory, hach) {
        // this.cdn.drirectDownload(paths,directory)
        try {
            var file = await fileManager_1.DiskFileManager.downloadFile(url);
            return this.uploadWithState(file, directory + path_1.default.basename(file), hach);
        }
        catch (error) {
        }
    }
    async append(chunk, destination, options) {
        console.log("append");
    }
    async makeBucket(name) {
        try {
            let r = await this.s3.makeBucket(name, 'default');
            const policy = {
                Version: "2012-10-17",
                Statement: [
                    {
                        Effect: "Allow",
                        Principal: "*",
                        Action: ["s3:GetBucketLocation", "s3:ListBucket"],
                        Resource: [`arn:aws:s3:::${name}`]
                    },
                    {
                        Effect: "Allow",
                        Principal: "*",
                        Action: "s3:GetObject",
                        Resource: [`arn:aws:s3:::${name}/*`]
                    }
                ]
            };
            await this.s3.setBucketPolicy(name, JSON.stringify(policy));
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async removeBucket(name) {
        try {
            await this.s3.removeBucket(name);
        }
        catch (error) {
            console.log(error);
        }
    }
    async getFile(file, dest) {
        try {
            return new Promise((resolve, reject) => {
                this.s3.getObject(this.bucketName, file, (err, stream) => {
                    if (err) {
                        return reject(err);
                    }
                    stream.on("close", () => {
                        resolve("");
                    });
                    stream.pipe(fs_1.default.createWriteStream(dest));
                });
            });
        }
        catch (error) {
            throw error;
        }
    }
    async getBucketList() {
        try {
            var buckets = await this.s3.listBuckets();
        }
        catch (error) {
            throw error;
        }
        this.rootName = buckets[0].name;
    }
    async getFiles(path, options) {
        try {
            var filesStream = this.s3.listObjectsV2(this.bucketName, path, false);
            var files = await new Promise((resolve, reject) => {
                var files = [];
                filesStream.read();
                filesStream.on('data', function (obj) {
                    if (obj.name != path)
                        files.push(obj);
                });
                filesStream.on("end", function () {
                    for (let i = 0; i < files.length; i++) {
                        if (files[i].prefix) {
                            files[i].prefix = files[i].prefix.replace(path, "");
                        }
                        else {
                            files[i].name = files[i].name.replace(path, "");
                        }
                    }
                    resolve(files);
                });
                filesStream.on("error", (error) => {
                    reject(error);
                });
            });
            if ((options === null || options === void 0 ? void 0 : options.extendFolders) == true) {
                for (let i = 0; i < files.length; i++) {
                    if (files[i].prefix != undefined) {
                        files[i].sub = await this.getFiles(path + files[i].prefix);
                    }
                }
            }
            return files;
        }
        catch (error) {
            throw error;
        }
    }
    async getFileManagerDirectory() {
    }
    async readFiles(path) {
        try {
            var files = await this.getFiles(path);
        }
        catch (error) {
            throw error;
        }
    }
    async removeFiles(paths) {
        return false;
    }
    async removeFile(path) {
        return false;
    }
    async move(files, directory, options) {
        try {
            var result = await this.copy(files, directory, options);
            try {
                if (options.cacheStr && options.moveHidden != true) {
                    let d = await cache.get(options.cacheStr);
                    let info = JSON.parse(d);
                    info.deleteting = true;
                    info.percentage = 0;
                    info.uploaded = 0;
                    await cache.set(options.cacheStr, JSON.stringify(info));
                }
            }
            catch (error) {
            }
            await this.deleteFiles(files, {
                moveToHidden: false,
                cacheStr: options.cacheStr,
                moveHidden: options.moveHidden
            });
            return result;
        }
        catch (error) {
            throw error;
        }
    }
    async restore(p, cacheStr) {
        let f = await recycleBinRepo.findOne({
            path: p,
            config: this.id
        });
        if (f == null)
            throw new Error("خطا در بازیابی");
        try {
            let original = f.original;
            let odire = original.split("/");
            let pdire = f.path.split("/");
            if (f.path.endsWith("/")) {
                if (odire[odire.length - 2] == pdire[pdire.length - 2]) {
                    odire.pop();
                    odire.pop();
                    let final = odire.join("/");
                    if (final != "")
                        final = final + "/";
                    await this.move([f.path], final, {
                        rename: true,
                        cacheStr,
                        moveHidden: true
                    });
                    recycleBinRepo.deleteById(f._id);
                    return;
                }
                //
                odire.pop();
                let fname = odire.pop();
                let final = odire.join("/");
                if (final != "")
                    final = final + "/";
                await this.craeteDirectory(final, fname);
                let files = await this.getAllFiles([f.path], true);
                await this.move(files, f.original, {
                    rename: true,
                    cacheStr,
                    moveHidden: true
                });
                await this.deleteFile(f.path, false);
                recycleBinRepo.deleteById(f._id);
                return;
            }
            else {
                odire.pop();
                //  odire.pop()
                let final = odire.join("/");
                if (final != "")
                    final = final + "/";
                await this.move([f.path], final, {
                    rename: true
                });
                recycleBinRepo.deleteById(f._id);
                return;
            }
        }
        catch (error) {
            throw error;
        }
    }
    async makeThumbNail(path, destinationPath) {
        var extName;
        var thumbnailDestination;
        if (path.includes("---thumbnail")) {
            return;
        }
        var thumbnail;
        if (path.endsWith(".mp4") || path.endsWith(".webm")) {
            let f = await videoProccessing_1.default.screenshot(path, ["0.5"]);
            extName = "jpg";
            var res;
            try {
                res = await imageProccessing_1.default.proccessFromConfig(config_1.default.getConfig("staticRoute"), config_1.default.getConfig("staticRoute") + "tmp/" + f, [{
                        "name": "main",
                        "resolotion": {
                            "h": 100,
                            "w": 100
                        },
                        "compersionConfig": {
                            "resultQuality": 80,
                            "resultTypes": ["jpg"]
                        }
                    }], {
                    main: {
                        "h": 100,
                        "w": 100
                    }
                });
                thumbnail = res[0]['path'];
            }
            catch (error) {
                console.log("ee", error);
            }
            thumbnailDestination = destinationPath.replace(".mp4", "---thumbnail.jpg");
            thumbnailDestination = thumbnailDestination.replace(".webm", "---thumbnail.jpg");
            // return
        }
        else if (path.endsWith(".jpg")) {
            extName = "jpg";
            thumbnailDestination = destinationPath.replace(".jpg", "---thumbnail.jpg");
        }
        else if (path.endsWith(".png")) {
            extName = "png";
            thumbnailDestination = destinationPath.replace(".png", "---thumbnail.png");
        }
        else if (path.endsWith(".webp")) {
            extName = "webp";
            thumbnailDestination = destinationPath.replace(".webp", "---thumbnail.webp");
        }
        else {
            extName = "jpeg";
            thumbnailDestination = destinationPath.replace(".jpeg", "---thumbnail.jpeg");
        }
        try {
            if (!(path.endsWith(".mp4") || path.endsWith(".webm")))
                thumbnail = await imageProccessing_1.default.resize("src/uploads/", path, extName);
            var result = await this.s3.putObject(this.bucketName, thumbnailDestination, fs_1.default.createReadStream(thumbnail), {
                'Content-Type': mime_types_1.default.lookup(thumbnail)
            });
            fileManager_1.DiskFileManager.removeFile(thumbnail);
        }
        catch (error) {
        }
    }
    async upload(path, destinationPath, options) {
        var re = /https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,}/;
        var isUrl = false;
        if (re.test(path)) {
            path = await (0, fileManager_1.urlToStream)(path);
            isUrl = true;
        }
        try {
            var name = !(options === null || options === void 0 ? void 0 : options.rename) ? await this.getValidPath(destinationPath) : destinationPath;
            if (path.endsWith(".png") || path.endsWith(".jpeg") || path.endsWith(".jpg") || path.endsWith(".webp") || path.endsWith(".mp4") || path.endsWith(".webm")) {
                await this.makeThumbNail(path, name);
            }
            try {
                let stream = fs_1.default.createReadStream(path);
                var result = await this.s3.putObject(this.bucketName, name, stream, {
                    'Content-Type': mime_types_1.default.lookup(path)
                });
            }
            catch (error) {
                throw error;
            }
            if (isUrl || (options === null || options === void 0 ? void 0 : options.removeFile) == true) {
                try {
                    // DiskFileManager.removeFile(path)
                }
                catch (error) {
                }
            }
            return this.baseDir + name;
        }
        catch (error) {
            throw error;
        }
    }
    async uploadWithState(path, destinationPath, cacheStr, options) {
        var re = /https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,}/;
        var isUrl = false;
        if (re.test(path)) {
            path = await (0, fileManager_1.urlToStream)(path);
            isUrl = true;
        }
        try {
            var name = !(options === null || options === void 0 ? void 0 : options.rename) ? await this.getValidPath(destinationPath) : destinationPath;
            if (path.endsWith(".png") || path.endsWith(".jpeg") || path.endsWith(".jpg") || path.endsWith(".webp") || path.endsWith(".mp4") || path.endsWith(".webm")) {
                await this.makeThumbNail(path, name);
            }
            try {
                const stats = fs_1.default.statSync(path);
                const totalSize = stats.size;
                let stream = fs_1.default.createReadStream(path);
                stream.readable = true;
                let uploaded = 0;
                stream.prependListener('data', async (chunk) => {
                    uploaded += chunk.length;
                    const percentage = (uploaded / totalSize) * 100;
                    if (await cache.get("stop_" + cacheStr) == "stop") {
                        stream.close();
                    }
                    cache.set(cacheStr, JSON.stringify({
                        p: percentage.toFixed(2),
                        totalSize,
                        uploaded
                    }));
                });
                var result = this.s3.putObject(this.bucketName, name, stream, fs_1.default.statSync(path).size, {
                    'Content-Type': mime_types_1.default.lookup(path)
                }).then(data => data)
                    .catch(err => console.log("err up ftp", err))
                    .finally(() => {
                    if (isUrl || (options === null || options === void 0 ? void 0 : options.removeFile) == true) {
                        try {
                            // DiskFileManager.removeFile(path)
                        }
                        catch (error) {
                        }
                    }
                });
                return this.baseDir + name + "$$$" + cacheStr;
                // this.s3.putObject
            }
            catch (error) {
                throw error;
            }
        }
        catch (error) {
            throw error;
        }
    }
    async getValidPath(filePath, num = 1) {
        var resultPath = filePath;
        try {
            if (num > 1) {
                var newBaseName = filePath.split(".");
                newBaseName[newBaseName.length - 2] = newBaseName[newBaseName.length - 2] + num.toString();
                resultPath = newBaseName.join(".");
                await this.s3.getObject(this.bucketName, resultPath);
            }
            else
                await this.s3.getObject(this.bucketName, resultPath);
            return this.getValidPath(filePath, num + 1);
        }
        catch (error) {
            return resultPath;
        }
    }
    async getValidDirPath(filePath, num = 1) {
        var resultPath = filePath;
        try {
            if (num > 1) {
                var newBaseName = filePath.split("/");
                newBaseName[newBaseName.length - 2] = newBaseName[newBaseName.length - 2] + num.toString();
                resultPath = newBaseName.join("/");
                await this.s3.getObject(this.bucketName, resultPath);
            }
            else
                await this.s3.getObject(this.bucketName, resultPath);
            return await this.getValidDirPath(filePath, num + 1);
        }
        catch (error) {
            return resultPath;
        }
    }
    // async removeDirect
    async removeFolderObjects(folder, cacheStr, moveHidden) {
        var files = await this.getFiles(folder);
        for (let i = 0; i < files.length; i++) {
            if (files[i].prefix) {
                await this.removeFolderObjects(folder + files[i].prefix.replace("/", "") + "/", cacheStr, moveHidden);
                await this.s3.removeObject(this.bucketName, folder + files[i].prefix.replace("/", "") + "/");
            }
            else {
                try {
                    if (cacheStr && !files[i].name.includes("---thumbnail")) {
                        let d = await cache.get(cacheStr);
                        let info = JSON.parse(d);
                        let deleted = moveHidden == true ? info.uploaded + 0.5 : info.uploaded + 1;
                        info.uploaded = deleted;
                        info.percentage = (info.uploaded / info.allFiles * 100).toFixed(2);
                        await cache.set(cacheStr, JSON.stringify(info));
                        // if(moveHidden != true)
                    }
                }
                catch (error) {
                }
                await this.s3.removeObject(this.bucketName, folder + files[i].name);
            }
        }
        return;
    }
    async moveToHidden(path, cacheStr) {
        if (this.isFolder(path)) {
            try {
                await this.craeteDirectory("", "recycle_bin");
            }
            catch (error) {
            }
            let temp = random_1.default.generateHashStr(15);
            // var dires = path.split("/")
            try {
                let r = await this.move([path], "recycle_bin/", {
                    renameFolder: true,
                    cacheStr,
                    resetCache: false,
                    moveHidden: true
                });
                recycleBinRepo.insert({
                    path: r[0],
                    config: this.id,
                    original: path
                });
                return r;
            }
            catch (error) {
            }
        }
        else {
            try {
                await this.craeteDirectory("", "recycle_bin");
            }
            catch (error) {
            }
            var dires = path.split("/");
            try {
                // var pp = path.split("/")
                let r = await this.move([path], "recycle_bin/", {
                    cacheStr,
                    resetCache: false,
                    moveHidden: true
                });
                recycleBinRepo.insert({
                    path: r[0],
                    config: this.id,
                    original: path
                });
                return r;
            }
            catch (error) {
            }
        }
    }
    async deleteFile(url, moveToHidden = true, cacheStr, moveHidden) {
        try {
            var path = url.split(this.baseDir)[1];
            if (this.isFolder((path || url))) {
                if (moveToHidden) {
                    return await this.moveToHidden((path || url), cacheStr);
                }
                else {
                    await this.removeFolderObjects((path || url), cacheStr, moveHidden);
                    var result = await this.s3.removeObject(this.bucketName, (path || url));
                    return result;
                }
            }
            if (moveToHidden) {
                return await this.moveToHidden((path || url), cacheStr);
            }
            else {
                try {
                    if (cacheStr && !(path || url).includes("---thumbnail")) {
                        let d = await cache.get(cacheStr);
                        let info = JSON.parse(d);
                        let deleted = moveHidden ? info.uploaded + 0.5 : info.uploaded + 1;
                        info.uploaded = deleted;
                        info.percentage = (info.uploaded / info.allFiles * 100).toFixed(2);
                        await cache.set(cacheStr, JSON.stringify(info));
                    }
                }
                catch (error) {
                }
                return await this.s3.removeObject(this.bucketName, (path || url));
            }
        }
        catch (error) {
            throw error;
        }
    }
    isFolder(p) {
        var dires = p.split("/");
        if (dires.length == 0)
            return false;
        return !dires[dires.length - 1].includes(".");
    }
    async deleteFiles(urls, options) {
        // return ""
        try {
            let count = 0;
            for (let i = 0; i < urls.length; i++) {
                count = await this.deleteFile(urls[i], options === null || options === void 0 ? void 0 : options.moveToHidden, options === null || options === void 0 ? void 0 : options.cacheStr, options === null || options === void 0 ? void 0 : options.moveHidden);
            }
        }
        catch (error) {
            throw error;
        }
    }
    async uploadMany(paths, options) {
        var resPaths = [];
        try {
            for (let i = 0; i < paths.length; i++) {
                // if()
                resPaths.push(await this.upload(paths[i].path, paths[i].destination, options));
            }
        }
        catch (error) {
            throw error;
        }
        return resPaths;
    }
    connectToS3() {
    }
    async craeteDirectory(path, name, options) {
        var result = await this.s3.putObject(this.bucketName, path + name + "/", "");
        return result;
    }
    async search(term, directory, options) {
        var _a;
        try {
            var files = await this.getFiles(directory, {
            //  isConnected: true 
            });
            var results = [];
            for (let i = 0; i < files.length; i++) {
                if (files[i].prefix && !files[i].prefix.includes(".hidden") && (options === null || options === void 0 ? void 0 : options.searchType) != "file") {
                    if (files[i].prefix.includes(term)) {
                        var file = files[i];
                        file.path = directory + file.prefix;
                        results.push(file);
                    }
                    if (options === null || options === void 0 ? void 0 : options.nested)
                        results.push(...await this.search(term, directory + files[i].prefix, {
                            isConnected: true
                        }));
                }
                else {
                    if ((options === null || options === void 0 ? void 0 : options.searchType) != "folder" && ((_a = files[i].name) === null || _a === void 0 ? void 0 : _a.includes(term))) {
                        var file = files[i];
                        file.path = directory + file.name;
                        results.push(file);
                    }
                }
            }
        }
        catch (error) {
            throw error;
        }
        return results;
    }
    async zip(files, name, directory, options) {
        try {
            var dirPath = "temp" + "/" + name;
            await fileManager_1.DiskFileManager.mkdir("", dirPath);
            for (let i = 0; i < files.length; i++) {
                if (this.isFolder(files[i])) {
                    var fname = files[i].split("/");
                    await fileManager_1.DiskFileManager.mkdir(dirPath + "/", fname[fname.length - 2]);
                    await this.downloadFolder(files[i], dirPath + "/" + fname[fname.length - 2], {
                        cacheStr: options === null || options === void 0 ? void 0 : options.cacheStr
                    });
                }
                else {
                    var readable = await this.s3.getObject(this.bucketName, files[i]);
                    await fileManager_1.DiskFileManager.wirteStream(dirPath + "/" + path_1.default.basename(files[i]), readable);
                    if (options === null || options === void 0 ? void 0 : options.cacheStr) {
                        try {
                            let d = await cache.get(options.cacheStr);
                            let info = JSON.parse(d);
                            let allFiles = info.allFiles;
                            let downloaded = info.downloaded;
                            info.downloaded = downloaded + 1;
                            info.percentage = (info.downloaded / allFiles * 100).toFixed(2);
                            if (info.percentage == 100.00) {
                                info.percentage = 99.99;
                            }
                            await cache.set((options === null || options === void 0 ? void 0 : options.cacheStr) || "", JSON.stringify(info));
                        }
                        catch (error) {
                        }
                    }
                }
            }
            await (0, zip_a_folder_1.zip)(dirPath, dirPath + ".zip");
            fileManager_1.DiskFileManager.removeFolder("temp" + "/" + name);
            var size = await fileManager_1.DiskFileManager.getFilesSize([dirPath + ".zip"]);
            return [await this.upload(dirPath + ".zip", directory + name + ".zip", {
                    rename: options === null || options === void 0 ? void 0 : options.rename
                }), size,];
        }
        catch (error) {
            throw error;
        }
    }
    async uploadFolderWhithState(folder, directory, isConnected, options) {
        var _a, _b, _c, _d, _e;
        try {
            var paths = [];
            var files = await new Promise((resolve, reject) => {
                fs_1.default.readdir(folder, function (err, files) {
                    if (err) {
                        reject(err);
                    }
                    resolve(files);
                });
            });
            for (let i = 0; i < files.length; i++) {
                if (options) {
                    var pp = folder.endsWith("/") ? folder + files[i] : folder + "/" + files[i];
                    if (await fileManager_1.DiskFileManager.isFolder(pp)) {
                        var p = folder.substring(((_a = options.path) === null || _a === void 0 ? void 0 : _a.length) || 0) + files[i] + "/";
                        if (options.all || ((_b = options.files) === null || _b === void 0 ? void 0 : _b.includes(p))) {
                            await this.craeteDirectory(directory, files[i], {
                                isConnected: true
                            });
                            await this.uploadFolder(pp + "/", directory + files[i] + "/", true, options);
                        }
                        else {
                            var index = -1;
                            (_c = options.files) === null || _c === void 0 ? void 0 : _c.findIndex((value, j) => {
                                if (value.startsWith(p)) {
                                    index = j;
                                    return j;
                                }
                            });
                            if (index != -1) {
                                await this.craeteDirectory(directory, files[i], {
                                    isConnected: true
                                });
                                await this.uploadFolder(pp + "/", directory + files[i] + "/", true, options);
                            }
                        }
                    }
                    else {
                        var p = folder.substring(((_d = options.path) === null || _d === void 0 ? void 0 : _d.length) || 0) + files[i];
                        if (options.all || ((_e = options.files) === null || _e === void 0 ? void 0 : _e.includes(p))) {
                            paths.push({
                                path: pp,
                                destination: directory + path_1.default.basename(files[i])
                            });
                        }
                    }
                }
                else {
                    var pp = folder.endsWith("/") ? folder + files[i] : folder + "/" + files[i];
                    if (await fileManager_1.DiskFileManager.isFolder(pp)) {
                        await this.craeteDirectory(directory, files[i], {
                            isConnected: true
                        });
                        await this.uploadFolder(pp, directory + files[i] + "/", true, options);
                    }
                    else {
                        paths.push({
                            path: pp,
                            destination: directory + path_1.default.basename(files[i])
                        });
                    }
                }
            }
            return await this.uploadMany(paths, {
                rename: options === null || options === void 0 ? void 0 : options.rename
            });
        }
        catch (error) {
            throw error;
        }
    }
    async uploadFolder(folder, directory, isConnected, options) {
        var _a, _b, _c, _d, _e;
        try {
            var results = [];
            var paths = [];
            var files = await new Promise((resolve, reject) => {
                fs_1.default.readdir(folder, function (err, files) {
                    if (err) {
                        reject(err);
                    }
                    resolve(files);
                });
            });
            for (let i = 0; i < files.length; i++) {
                if (options) {
                    var pp = folder.endsWith("/") ? folder + files[i] : folder + "/" + files[i];
                    if (await fileManager_1.DiskFileManager.isFolder(pp)) {
                        var p = folder.substring(((_a = options.path) === null || _a === void 0 ? void 0 : _a.length) || 0) + files[i] + "/";
                        if (options.all || ((_b = options.files) === null || _b === void 0 ? void 0 : _b.includes(p))) {
                            await this.craeteDirectory(directory, files[i], {
                                isConnected: true
                            });
                            // if (options.cacheStr) {
                            //     let d = await cache.get(options.cacheStr)
                            //     if (d != null) {
                            //         d = JSON.parse(d)
                            //     }
                            //     var uploaded = d.uploaded + 1
                            //     let percentage = uploaded / d.totalSize * 100
                            //     await cache.set(options.cacheStr, JSON.stringify({
                            //         p: percentage.toFixed(2),
                            //         totalSize: d.totalSize,
                            //         uploaded
                            //     }))
                            // }
                            results.push(...await this.uploadFolder(pp + "/", directory + files[i] + "/", true, {
                                all: options.all,
                                files: options.files,
                                path: options.path,
                                rename: options.rename,
                                cacheStr: options.cacheStr,
                                restore: options.restore
                            }));
                        }
                        else {
                            var index = -1;
                            (_c = options.files) === null || _c === void 0 ? void 0 : _c.findIndex((value, j) => {
                                if (value.startsWith(p)) {
                                    index = j;
                                    return j;
                                }
                            });
                            if (index != -1) {
                                await this.craeteDirectory(directory, files[i], {
                                    isConnected: true
                                });
                                results.push(...await this.uploadFolder(pp + "/", directory + files[i] + "/", true, options));
                            }
                        }
                    }
                    else {
                        var p = folder.substring(((_d = options.path) === null || _d === void 0 ? void 0 : _d.length) || 0) + files[i];
                        if (options.all || ((_e = options.files) === null || _e === void 0 ? void 0 : _e.includes(p))) {
                            paths.push({
                                path: pp,
                                destination: directory + path_1.default.basename(files[i])
                            });
                        }
                    }
                }
                else {
                    var pp = folder.endsWith("/") ? folder + files[i] : folder + "/" + files[i];
                    if (await fileManager_1.DiskFileManager.isFolder(pp)) {
                        await this.craeteDirectory(directory, files[i], {
                            isConnected: true
                        });
                        results.push(...await this.uploadFolder(pp, directory + files[i] + "/", true, options));
                    }
                    else {
                        paths.push({
                            path: pp,
                            destination: directory + path_1.default.basename(files[i])
                        });
                    }
                }
            }
            for (let i = 0; i < paths.length; i++) {
                // let r = await this.uploadMany(paths, {
                //     rename: options?.rename
                // })
                // for (let i = 0; i < paths.length; i++) {
                //     // if()
                //     resPaths.push(await this.upload(paths[i].path, paths[i].destination, options))
                // }
                let res = await this.upload(paths[i].path, paths[i].destination, {
                    rename: options === null || options === void 0 ? void 0 : options.rename
                });
                results.push(res);
                if (options === null || options === void 0 ? void 0 : options.cacheStr) {
                    let d = await cache.get(options.cacheStr);
                    if (d != null) {
                        d = JSON.parse(d);
                    }
                    var uploaded = options.restore ? d.uploaded + 0.25 : d.uploaded + 1;
                    let percentage = uploaded / d.totalSize * 100;
                    await cache.set(options.cacheStr, JSON.stringify({
                        p: percentage.toFixed(2),
                        totalSize: d.totalSize,
                        uploaded
                    }));
                }
            }
            return results;
        }
        catch (error) {
            throw error;
        }
    }
    async unzip(file, directory, options) {
        var _a, _b;
        try {
            var dirPath = "temp" + "/";
            var filePath = dirPath + path_1.default.basename(file);
            var readable = await this.s3.getObject(this.bucketName, file);
            await fileManager_1.DiskFileManager.wirteStream(filePath, readable);
            var folderName = path_1.default.basename(filePath).split(".").slice(0, -1).join(".") + Date.now();
            var folder = "temp/" + folderName;
            await fileManager_1.DiskFileManager.mkdir("", folder);
            await (0, extract_zip_1.default)(filePath, {
                dir: process.cwd() + "/" + folder
            });
            let files = [];
            if (options === null || options === void 0 ? void 0 : options.files) {
                for (let i = 0; i < (options === null || options === void 0 ? void 0 : options.files.length); i++) {
                    if (!files.includes(options.files[i])) {
                        files.push(options.files[i]);
                    }
                }
            }
            if (files.length > 0) {
                if (options != undefined)
                    options.files = files;
            }
            var size = await fileManager_1.DiskFileManager.getFilesSize(((_a = options === null || options === void 0 ? void 0 : options.files) === null || _a === void 0 ? void 0 : _a.map((elem, i) => folder + "/" + elem)) || [folder + "/"]);
            let cacheStr = (options === null || options === void 0 ? void 0 : options.cacheStr) || random_1.default.generateHashStr(32);
            await cache.set(cacheStr, JSON.stringify({
                p: 0,
                totalSize: (_b = options === null || options === void 0 ? void 0 : options.files) === null || _b === void 0 ? void 0 : _b.length,
                uploaded: 0
            }));
            var result = await this.uploadFolder(folder + "/", directory, true, {
                files: options === null || options === void 0 ? void 0 : options.files,
                path: folder + "/",
                rename: options === null || options === void 0 ? void 0 : options.rename,
                inBackground: true,
                cacheStr: options === null || options === void 0 ? void 0 : options.cacheStr
            });
            fileManager_1.DiskFileManager.removeFile(filePath);
            fileManager_1.DiskFileManager.removeFolder(folder);
            return [result, size];
        }
        catch (error) {
            throw error;
        }
    }
    async getZipFileInfo(file) {
        try {
            var dirPath = "temp" + "/";
            var filePath = dirPath + path_1.default.basename(file);
            var readable = await this.s3.getObject(this.bucketName, file);
            await fileManager_1.DiskFileManager.wirteStream(filePath, readable);
            // await DiskFileManager.mkdir("", path.na)
            var folderName = path_1.default.basename(filePath).split(".").slice(0, -1).join(".") + Date.now();
            var folder = "temp/" + folderName;
            await fileManager_1.DiskFileManager.mkdir("", folder);
            await (0, extract_zip_1.default)(filePath, {
                dir: process.cwd() + "/" + folder
            });
            await fileManager_1.DiskFileManager.removeFile(filePath);
            var result = await fileManager_1.DiskFileManager.scanDir(folder);
            await fileManager_1.DiskFileManager.removeFolder(folder);
            return result;
        }
        catch (error) {
            throw error;
        }
    }
    async copyFolderObjects(folder, directory, code, rename, moveHidden) {
        var _a, _b;
        if (this.isminio) {
            var dirName = Date.now();
            await fileManager_1.DiskFileManager.mkdir("temp/", dirName.toString());
            var folderNames = folder.split("/");
            var folderName = folderNames[folderNames.length - 2];
            await fileManager_1.DiskFileManager.mkdir("temp/" + dirName.toString() + "/", folderName);
            await this.downloadFolder(folder, "temp/" + dirName.toString() + "/" + folderName + "/");
            var res = await this.uploadFolder("temp/" + dirName.toString() + "/" + folderName + "/", directory, true, {
                all: true,
                rename
            });
            await fileManager_1.DiskFileManager.removeFolder("temp/" + dirName.toString() + "/" + folderName + "/");
            await fileManager_1.DiskFileManager.removeFolder("temp/" + dirName.toString() + "/");
            return;
            // await this.uploadFolder(fol)
        }
        var files = await this.getFiles(folder);
        try {
            for (let i = 0; i < files.length; i++) {
                if (files[i].prefix) {
                    await this.craeteDirectory(directory, files[i].prefix.replace("/", ""));
                    await this.copyFolderObjects(folder + files[i].prefix.replace("/", "") + "/", directory + files[i].prefix.replace("/", "") + "/", code, rename, moveHidden);
                }
                else {
                    var dires = files[i].name.split("/");
                    var newName = directory + dires[dires.length - 1];
                    var file = `/${this.bucketName}/${folder}${files[i].name}`;
                    var newName = !rename ? await this.getValidPath(newName) : newName;
                    try {
                        var result = await this.s3.copyObject(this.bucketName, newName, file, new minio.CopyConditions());
                        if (code != "" && !((_a = files[i].name) === null || _a === void 0 ? void 0 : _a.includes("---thumbnail"))) {
                            try {
                                let d = await cache.get(code);
                                let info = JSON.parse(d);
                                let uploaded = moveHidden ? info.uploaded + 0.5 : info.uploaded + 1;
                                info.uploaded = uploaded;
                                info.percentage = (uploaded / info.allFiles * 100).toFixed(2);
                                if (info.percentage == 100.00) {
                                    info.percentage = 99.99;
                                }
                                await cache.set(code, JSON.stringify(info));
                            }
                            catch (error) {
                            }
                        }
                    }
                    catch (error) {
                        try {
                            var newName = !rename ? await this.getValidPath(directory + files[i].name) : directory + files[i].name;
                            result = await this.s3.copyObject(this.bucketName, newName, folder + files[i].name, new minio.CopyConditions());
                            if (code != "" && ((_b = files[i].name) === null || _b === void 0 ? void 0 : _b.includes("---thumbnail"))) {
                                try {
                                    let d = await cache.get(code);
                                    let info = JSON.parse(d);
                                    let uploaded = moveHidden ? info.uploaded + 0.5 : info.uploaded + 1;
                                    info.uploaded = uploaded;
                                    info.percentage = (uploaded / info.allFiles * 100).toFixed(2);
                                    if (info.percentage == 100.00) {
                                        info.percentage = 99.99;
                                    }
                                    await cache.set(code, JSON.stringify(info));
                                }
                                catch (error) {
                                }
                            }
                        }
                        catch (error) {
                            throw error;
                        }
                    }
                }
            }
        }
        catch (error) {
            throw error;
        }
    }
    async copy(files, directory, options) {
        let r = [];
        try {
            for (let i = 0; i < files.length; i++) {
                if (this.isFolder(files[i])) {
                    var dires = files[i].split("/");
                    var newName = directory + dires[dires.length - 2] + "/";
                    if (options.renameFolder) {
                        var newName = await this.getValidDirPath(newName);
                    }
                    let DName = newName.split("/");
                    await this.craeteDirectory(directory, DName[DName.length - 2], {});
                    r.push(newName);
                    await this.copyFolderObjects(files[i], newName, options.cacheStr || "", options.rename, options.moveHidden);
                }
                else {
                    if (files[i].endsWith(".png") || files[i].endsWith(".jpeg") || files[i].endsWith(".jpg") || files[i].endsWith(".webp")
                        || files[i].endsWith(".mp4") || files[i].endsWith(".webm")) {
                        var filenames = files[i].split(".");
                        filenames[filenames.length - 2] = filenames[filenames.length - 2] + "---thumbnail";
                        if (["mp4", "webm"].includes(filenames[filenames.length - 1])) {
                            filenames[filenames.length - 1] = "jpg";
                        }
                        var dires = filenames.join(".").split("/");
                        var newName = directory + dires[dires.length - 1];
                        var file = `/${this.bucketName}/${filenames.join(".")}`;
                        var newName = !options.rename ? await this.getValidPath(newName) : newName;
                        try {
                            var result = await this.s3.copyObject(this.bucketName, newName, file, new minio.CopyConditions());
                        }
                        catch (error) {
                        }
                    }
                    var dires = files[i].split("/");
                    var newName = directory + dires[dires.length - 1];
                    var file = `/${this.bucketName}/${files[i]}`;
                    var newName = !options.rename ? await this.getValidPath(newName) : newName;
                    r.push(newName);
                    var result = await this.s3.copyObject(this.bucketName, newName, file, new minio.CopyConditions());
                    if (options.cacheStr) {
                        try {
                            let d = await cache.get(options.cacheStr);
                            let info = JSON.parse(d);
                            let uploaded = options.moveHidden ? info.uploaded + 0.5 : info.uploaded + 1;
                            info.uploaded = uploaded;
                            info.percentage = (uploaded / info.allFiles * 100).toFixed(2);
                            if (info.percentage == 100.00) {
                                info.percentage = 99.99;
                            }
                            await cache.set(options.cacheStr, JSON.stringify(info));
                        }
                        catch (error) {
                        }
                    }
                }
            }
            return r;
        }
        catch (error) {
            throw error;
        }
    }
    async downloadFiles(files, options) {
        var dirPath = (options === null || options === void 0 ? void 0 : options.folder) ? options.folder : "temp" + "/" + Date.now();
        await fileManager_1.DiskFileManager.mkdir("", dirPath);
        var info = {};
        if (options === null || options === void 0 ? void 0 : options.cacheStr) {
            try {
                var d = await cache.get(options.cacheStr);
                info = JSON.parse(d);
            }
            catch (error) {
            }
        }
        for (let i = 0; i < files.length; i++) {
            if (this.isFolder(files[i])) {
                var fname = files[i].split("/");
                await fileManager_1.DiskFileManager.mkdir(dirPath + "/", fname[fname.length - 2]);
                await this.downloadFolder(files[i], dirPath + "/" + fname[fname.length - 2], options);
                if (options === null || options === void 0 ? void 0 : options.renameTo) {
                    await fileManager_1.DiskFileManager.rename(dirPath + "/" + fname[fname.length - 2], dirPath + "/" + (options === null || options === void 0 ? void 0 : options.renameTo));
                }
            }
            else {
                let name = path_1.default.basename(files[i]);
                if (options === null || options === void 0 ? void 0 : options.renameTo) {
                    let ps = files[i].split(".");
                    ps[0] = options === null || options === void 0 ? void 0 : options.renameTo;
                    name = ps.join(".");
                }
                var readable = await this.s3.getObject(this.bucketName, files[i]);
                await fileManager_1.DiskFileManager.wirteStream(dirPath + "/" + name, readable);
                if (info.allFiles) {
                    let allFiles = info.allFiles;
                    let downloaded = info.downloaded;
                    info.downloaded = downloaded + 1;
                    info.percentage = (info.downloaded / allFiles * 100).toFixed(2);
                    if (info.percentage == 100.00) {
                        info.percentage = 99.99;
                    }
                    await cache.set((options === null || options === void 0 ? void 0 : options.cacheStr) || "", JSON.stringify(info));
                }
            }
        }
        return dirPath;
    }
    async downloadFolder(folder, directory, options) {
        var files = await this.getFiles(folder, { isConnected: true });
        var info = {};
        if (options === null || options === void 0 ? void 0 : options.cacheStr) {
            try {
                var d = await cache.get(options.cacheStr);
                info = JSON.parse(d);
            }
            catch (error) {
            }
        }
        for (let i = 0; i < files.length; i++) {
            if (["..", ".", ""].includes(files[i].name)
            // || files[i].name.includes("---thumbnail")
            ) {
                continue;
            }
            if (files[i].prefix) {
                var fname = files[i].prefix.split("/");
                await fileManager_1.DiskFileManager.mkdir(directory + "/", files[i].prefix);
                if (!folder.endsWith("/")) {
                    folder += "/";
                }
                else {
                }
                var p = fname[fname.length - 1] == '' ? fname[fname.length - 2] : fname[fname.length - 1];
                await this.downloadFolder(folder + files[i].prefix, directory + "/" + p, options);
            }
            else {
                folder = folder.endsWith("/") ? folder : folder + "/";
                var readable = await this.s3.getObject(this.bucketName, folder + files[i].name);
                await fileManager_1.DiskFileManager.wirteStream(directory + "/" + path_1.default.basename(files[i].name), readable);
                if (info.allFiles && !files[i].name.includes("---thumbnail")) {
                    let allFiles = info.allFiles;
                    let downloaded = info.downloaded;
                    info.downloaded = (options === null || options === void 0 ? void 0 : options.restore) ? downloaded + 0.25 : downloaded + 1;
                    info.percentage = (info.downloaded / allFiles * 100).toFixed(2);
                    if (info.percentage == 100.00) {
                        info.percentage = 99.99;
                    }
                    await cache.set((options === null || options === void 0 ? void 0 : options.cacheStr) || "", JSON.stringify(info));
                }
            }
        }
    }
    async rename(file, name, options) {
        try {
            var delfile = file;
            if (this.isFolder(file)) {
                if (!file.endsWith("/")) {
                    file += "/";
                }
                var dires = file.split("/");
                dires = dires.slice(0, dires.length - 2);
                await this.craeteDirectory(dires.join("/") + "/", name);
                await this.copyFolderObjects(file, dires.join("/") + "/" + name + "/", options.cacheStr || "", undefined, true);
                await this.deleteFile(file, false, options.cacheStr, true);
            }
            else {
                var dires = file.split("/");
                var basename = dires[dires.length - 1].split(".")[0];
                if (name.includes(".") && !name.startsWith(".hidden")) {
                    name = name.split(".")[0];
                }
                if (name.startsWith(".hidden")) {
                    var tname = name.split(".");
                    name = tname[0] + "." + tname[1];
                }
                dires[dires.length - 1] = dires[dires.length - 1].replace(basename, name);
                var newName = dires.join("/");
                file = `/${this.bucketName}/${file}`;
                await this.s3.copyObject(this.bucketName, newName, file, new minio.CopyConditions());
                if (file.endsWith(".png") || file.endsWith(".jpeg") || file.endsWith(".jpg") || file.endsWith(".webp") || file.endsWith(".mp4") || file.endsWith(".webm")) {
                    var filenames = file.split(".");
                    filenames[filenames.length - 2] += "---thumbnail";
                    var dires = file.split("/");
                    let baseNames = dires[dires.length - 1].split(".");
                    baseNames[0] = name + "---thumbnail";
                    dires.pop();
                    if (dires.length > 1) {
                        dires.shift();
                        dires.shift();
                    }
                    if (["mp4", "webm"].includes(filenames[filenames.length - 1])) {
                        filenames[filenames.length - 1] = "jpg";
                        baseNames[baseNames.length - 1] = "jpg";
                    }
                    var newName = dires.join("/") + "/" + baseNames.join(".");
                    var file = `${filenames.join(".")}`;
                    try {
                        var result = await this.s3.copyObject(this.bucketName, newName, file, new minio.CopyConditions());
                        let delPath = file.split("/");
                        delPath.shift();
                        delPath.shift();
                        const r = await this.s3.removeObject(this.bucketName, delPath.join("/"));
                    }
                    catch (error) {
                    }
                }
                const r = await this.s3.removeObject(this.bucketName, delfile);
                try {
                    if (options.cacheStr) {
                        let d = await cache.get(options.cacheStr);
                        let info = JSON.parse(d);
                        let deleted = info.uploaded + 1;
                        info.uploaded = deleted;
                        info.percentage = (info.uploaded / info.allFiles * 100).toFixed(2);
                        await cache.set(options.cacheStr, JSON.stringify(info));
                    }
                }
                catch (error) {
                }
                return r;
            }
        }
        catch (error) {
            throw error;
        }
    }
    async findFolder(directory = "", id = 1, options) {
        var folders = [];
        try {
            var findedFolders = await this.getFiles(directory);
            for (let i = 0; i < findedFolders.length; i++) {
                if (findedFolders[i].prefix && ![".", "..", ".hidden/"].includes(findedFolders[i].prefix)) {
                    var folder = {};
                    folder.access = true;
                    folder.id = directory + findedFolders[i].prefix.replace("/", "") + "/";
                    folder.name = findedFolders[i].prefix.replace("/", "");
                    // var chilFolders = await this.findFolder(directory + findedFolders[i].prefix.replace("/", "") + "/", id + 1, {
                    // })
                    folder.children = [];
                    folders.push(folder);
                }
            }
            if (id != 0)
                return {
                    id,
                    folders: await this.checkFolderChild(folders),
                    directory
                };
        }
        catch (error) {
            throw error;
        }
        return {
            id,
            folders,
            directory
        };
    }
    async checkFolderChild(folders) {
        var requests = folders.map((folder) => {
            return this.findFolder(folder.id, 0, {
                isConnected: true
            });
        });
        try {
            var results = await Promise.all(requests.map(p => p.catch(e => e)));
            var validResults = results.filter(result => !(result instanceof Error));
            for (let i = 0; i < validResults.length; i++) {
                if (validResults[i].folders.length > 0) {
                    var index = -1;
                    folders.findIndex(function (elem, j) {
                        if (elem.id == validResults[i].directory) {
                            index = j;
                            return j;
                        }
                    });
                    if (index != -1) {
                        folders[index]['haveChild'] = true;
                    }
                }
                validResults[i].directory;
            }
            var errors = results.filter(result => (result instanceof Error));
            for (let i = 0; i < errors.length; i++) {
                console.log("error");
            }
        }
        catch (err) {
            throw err;
        }
        return folders;
    }
    async status() {
    }
    async setPermission(file, permission, options) {
    }
    async getInfo() {
        this.s3.statObject(this.bucketName, "A/");
        // return this.s3.
        // return await this.s3.listObjectsV2(this.bucketName)
        // return await this.s3.getBucketPolicy(this.bucketName)
    }
    async getFilesSize(files) {
        var totalSize = 0;
        try {
            for (let i = 0; i < files.length; i++) {
                if (files[i].includes(this.baseDir))
                    files[i] = files[i].split(this.baseDir)[1];
                if (files[i].endsWith("/")) {
                    totalSize += await this.getFolderSize(files[i]);
                }
                else {
                    var file = await this.s3.statObject(this.bucketName, files[i]);
                    totalSize += file.size;
                }
            }
        }
        catch (error) {
            throw error;
        }
        return totalSize;
    }
    async getFolderSize(folder) {
        var totalSize = 0;
        try {
            var files = await this.getFiles(folder);
            for (let i = 0; i < files.length; i++) {
                if (files[i].prefix) {
                    var newFolder = folder + files[i].prefix;
                    if (!newFolder.endsWith("/")) {
                        newFolder += "/";
                    }
                    totalSize += await this.getFolderSize(newFolder);
                }
                else {
                    totalSize += files[i].size;
                }
            }
        }
        catch (error) {
            return totalSize;
            // throw error
        }
        return totalSize;
    }
    async getAllFiles(paths, withFolders) {
        var files = [];
        try {
            for (let i = 0; i < paths.length; i++) {
                if (paths[i].includes("---thumbnail")) {
                    continue;
                }
                if (paths[i].endsWith("/")) {
                    files.push(...await this.getFolderAllFiles(paths[i], withFolders));
                }
                else {
                    files.push(paths[i]);
                }
            }
        }
        catch (error) {
        }
        return files;
    }
    async getFolderAllFiles(folder, withFolders) {
        var files = [];
        try {
            var folderFiles = await this.getFiles(folder);
            for (let i = 0; i < folderFiles.length; i++) {
                if (folderFiles[i].prefix) {
                    var newFolder = folder + folderFiles[i].prefix;
                    if (!newFolder.endsWith("/")) {
                        newFolder += "/";
                    }
                    if (withFolders) {
                        files.push(newFolder);
                    }
                    else {
                        files.push(...await this.getFolderAllFiles(newFolder));
                    }
                    // totalSize += await this.getFolderSize(newFolder)
                }
                else if (folderFiles[i].name.includes("---thumbnail")) {
                    continue;
                }
                else {
                    files.push(folder + folderFiles[i].name);
                }
            }
        }
        catch (error) {
            return files;
        }
        return files;
    }
    async isPathExists(paths) {
        let results = [];
        for (let i = 0; i < paths.length; i++) {
            try {
                var result = await this.s3.statObject(this.bucketName, paths[i]);
                results.push(true);
            }
            catch (error) {
                results.push(false);
            }
        }
        return results;
    }
}
exports.S3 = S3;
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "objectStorage",
                function: "getBucketList"
            }
        };
    })
], S3.prototype, "getBucketList", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "objectStorage",
                function: "getFiles"
            }
        };
    })
], S3.prototype, "getFiles", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "objectStorage",
                function: "getFileManagerDirectory"
            }
        };
    })
], S3.prototype, "getFileManagerDirectory", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "objectStorage",
                function: "readFiles"
            }
        };
    })
], S3.prototype, "readFiles", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "objectStorage",
                function: "removeFiles"
            }
        };
    })
], S3.prototype, "removeFiles", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "objectStorage",
                function: "removeFile"
            }
        };
    })
], S3.prototype, "removeFile", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "objectStorage",
                function: "move"
            }
        };
    })
], S3.prototype, "move", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "objectStorage",
                function: "makeThumbNail"
            }
        };
    })
], S3.prototype, "makeThumbNail", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "objectStorage",
                function: "upload"
            }
        };
    })
], S3.prototype, "upload", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "deleteFile",
                function: "upload"
            }
        };
    })
], S3.prototype, "deleteFile", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "deleteFiles",
                function: "upload"
            }
        };
    })
], S3.prototype, "deleteFiles", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "uploadMany",
                function: "upload"
            }
        };
    })
], S3.prototype, "uploadMany", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "uploadMany",
                function: "craeteDirectory"
            }
        };
    })
], S3.prototype, "craeteDirectory", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "Obje",
                function: "search"
            }
        };
    })
], S3.prototype, "search", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "objectStorage",
                function: "zip"
            }
        };
    })
], S3.prototype, "zip", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "objectStorage",
                function: "uploadFolder"
            }
        };
    })
], S3.prototype, "uploadFolderWhithState", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "objectStorage",
                function: "uploadFolder"
            }
        };
    })
], S3.prototype, "uploadFolder", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "objectStorage",
                function: "unzip"
            }
        };
    })
], S3.prototype, "unzip", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "objectStorage",
                function: "getZipFileInfo"
            }
        };
    })
], S3.prototype, "getZipFileInfo", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "objectStorage",
                function: "unzip"
            }
        };
    })
], S3.prototype, "copy", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "objectStorage",
                function: "rename"
            }
        };
    })
], S3.prototype, "rename", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "objectStorage",
                function: "findFolder"
            }
        };
    })
], S3.prototype, "findFolder", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "objectStorage",
                function: "isPathExists"
            }
        };
    })
], S3.prototype, "isPathExists", null);
