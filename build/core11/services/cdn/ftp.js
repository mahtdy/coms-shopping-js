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
exports.FTP = void 0;
const fs_1 = __importDefault(require("fs"));
// import ftp, { STATUSES } from "promise-ftp"
const ftp_1 = __importDefault(require("ftp"));
const path_1 = __importDefault(require("path"));
const zip_a_folder_1 = require("zip-a-folder");
const extract_zip_1 = __importDefault(require("extract-zip"));
const errorLogger_1 = __importDefault(require("../../errorLogger"));
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const fileManager_1 = require("../fileManager");
const redis_cache_1 = __importDefault(require("../../redis-cache"));
const imageProccessing_1 = __importDefault(require("../imageProccessing"));
const repository_1 = __importDefault(require("../../mongoose-controller/repositories/recycleBin/repository"));
const random_1 = __importDefault(require("../../random"));
const videoProccessing_1 = __importDefault(require("../videoProccessing"));
const config_1 = __importDefault(require("../config"));
const recycleBinRepo = new repository_1.default();
const cache = new redis_cache_1.default("file_managing");
class FTPConnectionProvider {
    constructor(host, user, password) {
        this.host = host;
        this.user = user;
        this.password = password;
    }
    static getInstance(host, user, password) {
        if (!FTPConnectionProvider.instance || FTPConnectionProvider.instance.host != host) {
            FTPConnectionProvider.instance = new FTPConnectionProvider(host, user, password);
        }
        return FTPConnectionProvider.instance;
    }
}
var ftp_co = {};
async function sleep(t) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve({});
        }, t);
    });
}
class FTP {
    constructor(host, user, password, baseDir, id, connection = 10) {
        this.connection = connection;
        this.id = id;
        this.baseDir = baseDir;
        this.host = host;
        this.user = user;
        this.password = password;
        this.extendedPath = "";
        var l = new URL(this.host);
        this.url = l.hostname;
        this.initConnection();
        this.extendedPath = l.pathname;
    }
    async initConnection() {
        if (!ftp_co[this.host]) {
            ftp_co[this.host] = [];
            for (let i = 0; i < this.connection; i++) {
                let client = new ftp_1.default();
                client.connect({
                    user: this.user,
                    host: this.url,
                    password: this.password,
                });
                client.on("ready", () => {
                    ftp_co[this.host].push(client);
                });
                client.on("error", (error) => {
                    console.log("err100", error);
                });
            }
        }
    }
    async getConnection() {
        try {
            while (ftp_co[this.host].length < 1) {
                await sleep(500);
            }
            return ftp_co[this.host].pop();
        }
        catch (error) {
            throw error;
        }
    }
    async addConnection(client) {
        ftp_co[this.host].push(client);
    }
    async makeBucket(name) {
    }
    async removeBucket(name) {
    }
    async getcli() {
        let client = await this.getConnection();
        try {
            await this.status(client);
            return client;
        }
        catch (error) {
            client.destroy();
            client = new ftp_1.default();
            try {
                await this.connect(client);
                return client;
            }
            catch (error) {
                throw error;
            }
            // throw error
        }
    }
    async listFiles(dest) {
        let client = await this.getcli();
        return new Promise((resolve, reject) => {
            client.list(dest, (err, list) => {
                if (err) {
                    this.addConnection(client);
                    return reject(err);
                }
                this.addConnection(client);
                return resolve(list);
            });
        });
    }
    async getFile(file, dest) {
        let client = await this.getcli();
        return new Promise((resolve, reject) => {
            client.get(file, (err, stream) => {
                if (err) {
                    this.addConnection(client);
                    return reject(err);
                }
                stream.on("close", () => {
                    this.addConnection(client);
                    resolve("");
                });
                stream.pipe(fs_1.default.createWriteStream(dest));
            });
        });
    }
    async appendFile(chunk, dest) {
        let client = await this.getcli();
        return new Promise((resolve, reject) => {
            client.append(chunk, dest, false, (err) => {
                if (err) {
                    this.addConnection(client);
                    return reject(err);
                }
                this.addConnection(client);
                return resolve({});
            });
        });
    }
    addNewConnection() {
        // console.log("addNewConnection")
    }
    async command(cmd) {
        try {
            let client = await this.getcli();
            // client. 
        }
        catch (error) {
            throw error;
        }
    }
    async put(stream, dest, cacheStr, totalSize) {
        let client = await this.getcli();
        return new Promise((resolve, reject) => {
            let resolved = false;
            if (cacheStr != undefined) {
                // const stats = fs.statSync(path);
                let uploaded = 0;
                stream.prependListener('data', async (chunk) => {
                    uploaded += chunk.length;
                    const percentage = (uploaded / (totalSize || 0)) * 100;
                    if (await cache.get("stop_" + cacheStr) == "stop") {
                        stream.destroy();
                        client.abort((err) => {
                            this.addConnection(client);
                            resolved = true;
                            reject(new Error("متوقف شد"));
                            return;
                        });
                        try {
                            await this.deleteFile(dest.replace("/public_html/", ""));
                        }
                        catch (error) {
                        }
                    }
                    cache.set(cacheStr, JSON.stringify({
                        p: percentage.toFixed(2),
                        totalSize,
                        uploaded
                    }));
                });
            }
            client.put(stream, dest, (err) => {
                if (resolved == true) {
                    return;
                }
                if (err) {
                    // this.addConnection(client)
                    this.addNewConnection();
                    return reject(err);
                }
                this.addConnection(client);
                return resolve({});
            });
        });
    }
    async renameFTP(oldPath, newPath) {
        let client = await this.getcli();
        return new Promise((resolve, reject) => {
            client.rename(oldPath, newPath, (err) => {
                if (err) {
                    this.addConnection(client);
                    return reject(err);
                }
                this.addConnection(client);
                return resolve({});
            });
        });
    }
    async get(p) {
        let client = await this.getcli();
        return new Promise((resolve, reject) => {
            client.get(p, (err, data) => {
                if (err) {
                    this.addConnection(client);
                    return reject(err);
                }
                this.addConnection(client);
                return resolve(data);
            });
        });
    }
    async rmdir(dir) {
        let client = await this.getcli();
        return new Promise((resolve, reject) => {
            client.rmdir(dir, true, (err) => {
                if (err) {
                    this.addConnection(client);
                    return reject(err);
                }
                this.addConnection(client);
                return resolve({});
            });
        });
    }
    async delete(file) {
        let client = await this.getcli();
        return new Promise((resolve, reject) => {
            client.delete(file, (err) => {
                if (err) {
                    this.addConnection(client);
                    return reject(err);
                }
                this.addConnection(client);
                return resolve({});
            });
        });
    }
    async mkdir(dir) {
        let client = await this.getcli();
        return new Promise((resolve, reject) => {
            client.mkdir(dir, (err) => {
                if (err) {
                    this.addConnection(client);
                    return reject(err);
                }
                this.addConnection(client);
                return resolve({});
            });
        });
    }
    async site(cmd) {
        let client = await this.getcli();
        return new Promise((resolve, reject) => {
            client.site(cmd, (err) => {
                if (err) {
                    this.addConnection(client);
                    return reject(err);
                }
                this.addConnection(client);
                return resolve({});
            });
        });
    }
    async size(p) {
        let client = await this.getcli();
        return new Promise((resolve, reject) => {
            client.size(p, (err, size) => {
                if (err) {
                    this.addConnection(client);
                    return reject(err);
                }
                this.addConnection(client);
                return resolve(size);
            });
        });
    }
    async status(cli) {
        return new Promise((resolve, reject) => {
            let isok = false;
            cli.status((err, status) => {
                if (err) {
                    isok = true;
                    return reject(err);
                }
                isok = true;
                return resolve(status);
            });
            setTimeout(() => {
                if (!isok)
                    return reject(new Error("خطای وضعیت"));
            }, 3000);
        });
    }
    async resetFTP() {
        var connectionProvider = FTPConnectionProvider.getInstance(this.host, this.user, this.password);
        connectionProvider.connection = new ftp_1.default();
    }
    async append(chunk, destination, options) {
        try {
            if (!(options === null || options === void 0 ? void 0 : options.rename) && options.isFirst)
                destination = await this.getValidPath(destination, false);
            var dest = this.extendedPath + destination;
            if (destination.startsWith("/")) {
                dest = this.extendedPath.substring(0, this.extendedPath.length - 1) + destination;
            }
            if (options.isFirst) {
                // await put(chunk, dest)
                // put
                await this.put(chunk, dest);
            }
            else
                await this.appendFile(chunk, dest);
            if (options.deleteFile != false)
                await fileManager_1.DiskFileManager.removeFile(chunk);
            return this.baseDir + destination;
        }
        catch (error) {
            throw error;
        }
    }
    async drirectDownload(url, directory, hash) {
        return new Promise((resolve, reject) => {
            var isResolved = false;
            const u = new URL(url);
            var options = {
                'method': 'GET',
                'hostname': u.hostname,
                'path': u.pathname,
                port: u.port,
                // href :url,
                'headers': {
                // 'Range': `bytes=0-${50000 - 1}`
                },
                'maxRedirects': 20
            };
            var name = directory + path_1.default.basename(url);
            const that = this;
            if (url.startsWith("https")) {
                var req = https.request(options, async function (res) {
                    const totalSize = parseInt(res.headers['content-length'], 10);
                    var chunks = [];
                    let uploaded = 0;
                    let isFirst = true;
                    let isEnd = false;
                    let tempChunks;
                    let b;
                    var b_count = 0;
                    res.on("data", async function (chunk) {
                        b_count += 1;
                        if (tempChunks == undefined) {
                            tempChunks = chunk;
                            return;
                        }
                        tempChunks = Buffer.concat([tempChunks, chunk]);
                        if (b_count == 100) {
                            b_count = 0;
                            chunks.push(tempChunks);
                            tempChunks = b;
                        }
                    });
                    res.on("end", function (chunk) {
                        if (tempChunks == undefined) {
                            tempChunks = chunk;
                        }
                        else {
                            // tempChunks = Buffer.concat([tempChunks, chunk]);
                        }
                        chunks.push(tempChunks);
                    });
                    res.on("close", function () {
                        isEnd = true;
                    });
                    res.on("error", function (error) {
                        console.error(error);
                        reject(error);
                    });
                    let inproccess = false;
                    var refreshIntervalId = setInterval(async () => {
                        if (inproccess) {
                            return;
                        }
                        if (isEnd && (chunks === null || chunks === void 0 ? void 0 : chunks.length) == 0) {
                            clearInterval(refreshIntervalId);
                            return;
                        }
                        if ((chunks === null || chunks === void 0 ? void 0 : chunks.length) != 0) {
                            inproccess = true;
                            let chunk = chunks.shift();
                            uploaded += chunk.length;
                            const progress = (uploaded / totalSize) * 100;
                            cache.set(hash, JSON.stringify({
                                p: progress.toFixed(2),
                                uploaded,
                                totalSize
                            }));
                            name = await that.append(chunk, name, {
                                isFirst,
                                rename: false,
                                deleteFile: false
                            });
                            isFirst = false;
                            if (!isResolved) {
                                resolve({
                                    url: name,
                                    hash
                                });
                                isResolved = true;
                            }
                            name = name.replace(that.baseDir, "");
                            inproccess = false;
                        }
                    }, 5);
                });
            }
            else {
                var req = http.request(options, async function (res) {
                    const totalSize = parseInt(res.headers['content-length'], 10);
                    var chunks = [];
                    let uploaded = 0;
                    let isFirst = true;
                    let isEnd = false;
                    let tempChunks;
                    let b;
                    var b_count = 0;
                    res.on("data", async function (chunk) {
                        b_count += 1;
                        if (tempChunks == undefined) {
                            tempChunks = chunk;
                            return;
                        }
                        tempChunks = Buffer.concat([tempChunks, chunk]);
                        if (b_count == 100) {
                            b_count = 0;
                            chunks.push(tempChunks);
                            tempChunks = b;
                        }
                    });
                    res.on("end", function (chunk) {
                        if (tempChunks == undefined) {
                            tempChunks = chunk;
                        }
                        else {
                            // tempChunks = Buffer.concat([tempChunks, chunk]);
                        }
                        chunks.push(tempChunks);
                    });
                    res.on("close", function () {
                        isEnd = true;
                    });
                    res.on("error", function (error) {
                        console.error(error);
                        reject(error);
                    });
                    let inproccess = false;
                    var refreshIntervalId = setInterval(async () => {
                        if (inproccess) {
                            return;
                        }
                        if (isEnd && (chunks === null || chunks === void 0 ? void 0 : chunks.length) == 0) {
                            clearInterval(refreshIntervalId);
                            return;
                        }
                        if ((chunks === null || chunks === void 0 ? void 0 : chunks.length) != 0) {
                            inproccess = true;
                            let chunk = chunks.shift();
                            uploaded += chunk.length;
                            const progress = (uploaded / totalSize) * 100;
                            cache.set(hash, JSON.stringify({
                                p: progress.toFixed(2),
                                uploaded,
                                totalSize
                            }));
                            name = await that.append(chunk, name, {
                                isFirst,
                                rename: false,
                                deleteFile: false
                            });
                            isFirst = false;
                            if (!isResolved) {
                                resolve({
                                    url: name,
                                    hash
                                });
                                isResolved = true;
                            }
                            name = name.replace(that.baseDir, "");
                            inproccess = false;
                        }
                    }, 5);
                });
            }
            req.end();
        });
    }
    async getFiles(path, options) {
        try {
            var destinationPath = this.extendedPath + path;
            if (path.startsWith("/") || path == "") {
                destinationPath = this.extendedPath.substring(0, this.extendedPath.length - 1) + path;
            }
            var files = await this.listFiles(destinationPath);
            if ((options === null || options === void 0 ? void 0 : options.extendFolders) == true) {
                for (let i = 0; i < files.length; i++) {
                    // const ele
                    if (files[i].type == "d" && !files[i].name.endsWith(".")) {
                        files[i].sub = await this.listFiles(destinationPath + "/" + files[i].name);
                    }
                }
            }
        }
        catch (error) {
            throw error;
        }
        return files;
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
    async makeThumbNail(path, destinationPath) {
        var extName;
        var thumbnailDestination;
        var thumbnail;
        if (path.includes("---thumbnail")) {
            return;
        }
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
            }
            thumbnailDestination = destinationPath.replace(".mp4", "---thumbnail.jpg");
            thumbnailDestination = thumbnailDestination.replace(".webm", "---thumbnail.jpg");
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
            await this.put(thumbnail, this.extendedPath + thumbnailDestination);
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
            if (!(options === null || options === void 0 ? void 0 : options.rename))
                destinationPath = await this.getValidPath(destinationPath, options === null || options === void 0 ? void 0 : options.isConnected);
            var dest = this.extendedPath + destinationPath;
            if (destinationPath.startsWith("/")) {
                dest = this.extendedPath.substring(0, this.extendedPath.length - 1) + destinationPath;
            }
            const stats = fs_1.default.statSync(path);
            const totalSize = stats.size;
            let stream = fs_1.default.createReadStream(path);
            var result = await this.put(stream, dest);
            if (path.endsWith(".png") || path.endsWith(".jpeg") || path.endsWith(".jpg") || path.endsWith(".webp") || path.endsWith(".mp4") || path.endsWith(".webm")) {
                await this.makeThumbNail(path, destinationPath);
            }
            if (options === null || options === void 0 ? void 0 : options.removeFile) {
                // DiskFileManager.removeFile(path)
            }
            if (destinationPath.startsWith("/")) {
                return this.baseDir.substring(0, this.baseDir.length - 1) + destinationPath;
            }
            return this.baseDir + destinationPath;
        }
        catch (error) {
            console.log("errr up ftp");
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
            if (!(options === null || options === void 0 ? void 0 : options.rename))
                destinationPath = await this.getValidPath(destinationPath, options === null || options === void 0 ? void 0 : options.isConnected);
            var dest = this.extendedPath + destinationPath;
            if (destinationPath.startsWith("/")) {
                dest = this.extendedPath.substring(0, this.extendedPath.length - 1) + destinationPath;
            }
            let stream = fs_1.default.createReadStream(path);
            const stats = fs_1.default.statSync(path);
            // stream.on("")
            var result = this.put(stream, dest, cacheStr, stats.size).then(async () => {
                if (path.endsWith(".png") || path.endsWith(".jpeg") || path.endsWith(".jpg") || path.endsWith(".webp") || path.endsWith(".webm") || path.endsWith(".mp4")) {
                    await this.makeThumbNail(path, destinationPath);
                }
            })
                .catch(err => console.log("err up ftp", err))
                .finally(() => {
                if (!isUrl) {
                    fileManager_1.DiskFileManager.removeFile(path);
                }
            });
            // }
            if (destinationPath.startsWith("/")) {
                return this.baseDir.substring(0, this.baseDir.length - 1) + destinationPath + "$$$" + cacheStr;
            }
            return this.baseDir + destinationPath + "$$$" + cacheStr;
        }
        catch (error) {
            throw error;
        }
    }
    async getValidPath(filePath, isConnected = false, num = 1) {
        var resultPath = filePath;
        try {
            // if (this.client.getConnectionStatus() != STATUSES.CONNECTED) {
            //     await this.connect()
            // }
            if (num > 1) {
                var newBaseName = filePath.split(".");
                newBaseName[newBaseName.length - 2] = newBaseName[newBaseName.length - 2] + num.toString();
                resultPath = newBaseName.join(".");
            }
            try {
                // this.client.destroy()
                // await this.connect()
                let r = await this.get(this.extendedPath + resultPath);
                return await this.getValidPath(filePath, true, num + 1);
            }
            catch (error) {
                return resultPath;
            }
        }
        catch (error) {
            return resultPath;
        }
    }
    async getValidDirPath(filePath, isConnected = false, num = 1) {
        // await sleep(5000)
        var resultPath = filePath;
        try {
            // if (this.client.getConnectionStatus() != STATUSES.CONNECTED) {
            //     await this.connect()
            // }
            if (num > 1) {
                var newBaseName = filePath.split("/");
                // if(filePath.endsWith)
                newBaseName[newBaseName.length - 2] = newBaseName[newBaseName.length - 2] + num.toString();
                resultPath = newBaseName.join("/");
            }
            try {
                // this.client.destroy()
                // await this.connect()
                if (filePath.endsWith("/")) {
                    let folders = resultPath.split("/");
                    folders.pop();
                    let folderName = folders.pop();
                    let files = await this.getFiles(folders.join("/") + "/");
                    let index = files.findIndex((value, index) => {
                        if (value.type == "d" && value.name == folderName) {
                            return true;
                        }
                    });
                    if (index == -1)
                        return resultPath;
                }
                else
                    await this.get(this.extendedPath + resultPath);
                return await this.getValidDirPath(filePath, true, num + 1);
            }
            catch (error) {
                return resultPath;
            }
        }
        catch (error) {
            return resultPath;
        }
    }
    async uploadMany(paths, options) {
        try {
            // if (this.client.getConnectionStatus() != STATUSES.CONNECTED) {
            //     await this.connect()
            // }
            // if (!options?.isConnected)
            //     await this.connect()
        }
        catch (error) {
            throw error;
        }
        var resPaths = [];
        try {
            for (let i = 0; i < paths.length; i++) {
                resPaths.push(await this.upload(paths[i].path, paths[i].destination, {
                    isConnected: true,
                    rename: options === null || options === void 0 ? void 0 : options.rename
                }));
            }
        }
        catch (error) {
            throw error;
        }
        return resPaths;
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
                let t = random_1.default.generateHashStr(15);
                await this.craeteDirectory("recycle_bin/", t);
                await this.move([f.path], "recycle_bin/" + t + "/", {});
                // if (pdire[pdire.length - 2] != odire[odire.length - 2])
                await this.rename("recycle_bin/" + t + "/" + pdire[pdire.length - 2], odire[odire.length - 2], {});
                odire.pop();
                let fname = odire.pop();
                let final = odire.join("/");
                if (final != "")
                    final = final + "/";
                await this.move(["recycle_bin/" + t + "/" + fname + "/"], final, {
                    rename: true
                });
                await this.deleteFile("recycle_bin/" + t + "/", false, false);
                if (cacheStr) {
                    let d = await cache.get(cacheStr);
                    if (d != null) {
                        d = JSON.parse(d);
                    }
                    var uploaded = d.uploaded + 1;
                    let percentage = uploaded / d.allFiles * 100;
                    await cache.set(cacheStr, JSON.stringify({
                        percentage: percentage.toFixed(2),
                        allFiles: d.allFiles,
                        uploaded
                    }));
                }
                // await this.deleteFile(p, false, false)
            }
            else {
                odire.pop();
                let final = odire.join("/");
                if (final != "")
                    final = final + "/";
                await this.move([f.path], final, {
                    rename: true
                });
                if (cacheStr) {
                    let d = await cache.get(cacheStr);
                    if (d != null) {
                        d = JSON.parse(d);
                    }
                    var uploaded = d.uploaded + 1;
                    let percentage = uploaded / d.allFiles * 100;
                    await cache.set(cacheStr, JSON.stringify({
                        percentage: percentage.toFixed(2),
                        allFiles: d.allFiles,
                        uploaded
                    }));
                }
            }
            recycleBinRepo.deleteById(f._id);
            return;
        }
        catch (error) {
            throw error;
        }
    }
    async moveToHidden(path) {
        if (this.isFolder(this.extendedPath + (path))) {
            let original = path;
            try {
                await this.craeteDirectory("", "recycle_bin");
            }
            catch (error) {
            }
            let d = path.split("/");
            let p = "recycle_bin/" + d[d.length - 2] + "/";
            p = await this.getValidDirPath(p);
            try {
                await this.renameFTP(this.extendedPath + path, this.extendedPath + p);
                recycleBinRepo.insert({
                    path: p,
                    config: this.id,
                    original
                });
                return;
            }
            catch (error) {
                try {
                    var newDirs = p.split("/").slice(0, -2);
                    let d = newDirs.slice(0, -1).join("/") + "/";
                    if (d == "/")
                        d = "";
                    await this.craeteDirectory(d, newDirs[newDirs.length - 1], {
                        isConnected: true
                    });
                    await this.renameFTP(this.extendedPath + path, this.extendedPath + p);
                    recycleBinRepo.insert({
                        path: p,
                        config: this.id,
                        original
                    });
                    return;
                }
                catch (error) {
                    try {
                        await this.rmdir(this.extendedPath + p);
                        await this.renameFTP(this.extendedPath + path, this.extendedPath + p);
                        recycleBinRepo.insert({
                            path: p,
                            config: this.id,
                            original
                        });
                        return;
                    }
                    catch (error) {
                        throw error;
                    }
                }
            }
        }
        else {
            var dires = path.split("/");
            try {
                await this.craeteDirectory("", "recycle_bin");
            }
            catch (error) {
            }
            let original = path;
            let d = path.split("/");
            let p = "recycle_bin/" + d[d.length - 1];
            p = await this.getValidPath(p);
            try {
                await this.renameFTP(this.extendedPath + path, this.extendedPath + p);
                recycleBinRepo.insert({
                    path: p,
                    config: this.id,
                    original
                });
                return;
            }
            catch (error) {
                try {
                    var newDirs = p.split("/").slice(0, -1);
                    await this.craeteDirectory(newDirs.slice(0, -1).join("/") + "/", newDirs[newDirs.length - 1], {
                        isConnected: true
                    });
                    await this.renameFTP(this.extendedPath + path, this.extendedPath + p);
                    recycleBinRepo.insert({
                        path: p,
                        config: this.id,
                        original
                    });
                    return;
                }
                catch (error) {
                    try {
                        await this.renameFTP(this.extendedPath + path, this.extendedPath + p);
                        recycleBinRepo.insert({
                            path: p,
                            config: this.id,
                            original
                        });
                        return;
                    }
                    catch (error) {
                        throw error;
                    }
                }
            }
        }
    }
    async deleteFile(url, isConnected = false, moveToHidden = true, cacheStr) {
        try {
            var path = url.split(this.baseDir)[1];
            if (this.isFolder(this.extendedPath + (path || url))) {
                try {
                    if (cacheStr) {
                        let d = await cache.get(cacheStr);
                        let info = JSON.parse(d);
                        let deleted = info.uploaded + 1;
                        info.uploaded = deleted;
                        info.percentage = (info.uploaded / info.allFiles * 100).toFixed(2);
                        await cache.set(cacheStr, JSON.stringify(info));
                    }
                }
                catch (error) {
                }
                if (moveToHidden) {
                    return await this.moveToHidden(path || url);
                }
                else {
                    return await this.rmdir(this.extendedPath + (path || url));
                }
            }
            else {
                try {
                    if (cacheStr && !url.includes("---thumbnail")) {
                        let d = await cache.get(cacheStr);
                        let info = JSON.parse(d);
                        let deleted = info.uploaded + 1;
                        info.uploaded = deleted;
                        info.percentage = (info.uploaded / info.allFiles * 100).toFixed(2);
                        await cache.set(cacheStr, JSON.stringify(info));
                    }
                }
                catch (error) {
                }
                if (moveToHidden) {
                    return await this.moveToHidden(path || url);
                }
                else {
                    return await this.delete(this.extendedPath + (path || url));
                }
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
        try {
            for (let i = 0; i < urls.length; i++) {
                await this.deleteFile(urls[i], true, options === null || options === void 0 ? void 0 : options.moveToHidden, options === null || options === void 0 ? void 0 : options.cacheStr);
            }
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async craeteDirectory(path, name, options) {
        try {
            // // if(this.client.get(path+))
            // if (this.client.getConnectionStatus() != STATUSES.CONNECTED) {
            //     await this.connect()
            // }
            var destinationPath = this.extendedPath + path + name;
            try {
                let list = await this.listFiles(this.extendedPath + path);
                const folderExists = list.some((entry) => entry.name === name);
                if (folderExists) {
                    return destinationPath;
                }
            }
            catch (error) {
            }
            if (path.startsWith("/")) {
                destinationPath = this.extendedPath.substring(0, this.extendedPath.length - 1) + path + name;
            }
            var result = await this.mkdir(destinationPath);
            return result;
        }
        catch (error) {
            throw error;
        }
    }
    async search(term, directory, options) {
        try {
            // if (this.client.getConnectionStatus() != STATUSES.CONNECTED) {
            //     await this.connect()
            // }
            var files = await this.getFiles(directory, { isConnected: true });
            var results = [];
            for (let i = 0; i < files.length; i++) {
                if (files[i].type == "-") {
                    if ((options === null || options === void 0 ? void 0 : options.searchType) != "folder" && files[i].name.includes(term)) {
                        var file = files[i];
                        file.path = directory + file.name;
                        results.push(file);
                    }
                }
                else if (![".", "..", ".hidden"].includes(files[i].name)) {
                    if ((options === null || options === void 0 ? void 0 : options.searchType) != "file" && files[i].name.includes(term)) {
                        var file = files[i];
                        file.path = directory + file.name;
                        results.push(file);
                    }
                    if (options === null || options === void 0 ? void 0 : options.nested)
                        results.push(...await this.search(term, directory + files[i].name + "/", {
                            isConnected: true
                        }));
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
            // if (this.client.getConnectionStatus() != STATUSES.CONNECTED) {
            //     await this.connect()
            // }
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
                    await fileManager_1.DiskFileManager.wirteStream(dirPath + "/" + path_1.default.basename(files[i]), await this.get(this.extendedPath + files[i]));
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
        }
        catch (error) {
            throw error;
        }
        try {
            await (0, zip_a_folder_1.zip)(dirPath, dirPath + ".zip", {});
            fileManager_1.DiskFileManager.removeFolder("temp" + "/" + name);
            var size = await fileManager_1.DiskFileManager.getFilesSize([dirPath + ".zip"]);
            return [await this.upload(dirPath + ".zip", directory + name + ".zip", {
                    isConnected: true,
                    rename: options === null || options === void 0 ? void 0 : options.rename
                }), size];
        }
        catch (error) {
            throw error;
        }
    }
    async uploadFolder(folder, directory, isConnected, options) {
        var _a, _b, _c, _d, _e;
        try {
            // return []
            var results = [];
            // if (this.client.getConnectionStatus() != STATUSES.CONNECTED)
            //     await this.connect()
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
                            if (options.cacheStr) {
                                try {
                                    let d = await cache.get(options.cacheStr);
                                    if (d != null) {
                                        d = JSON.parse(d);
                                    }
                                    if (d.allFiles) {
                                        // let uploaded = d.uploaded
                                        // d.uploaded = uploaded + 1
                                        // d.percentage = (d.uploaded / d.allFiles * 100).toFixed(2)
                                        // await cache.set(options?.cacheStr || "", JSON.stringify(d))
                                    }
                                    else {
                                        var uploaded = d.uploaded + 1;
                                        let percentage = uploaded / d.totalSize * 100;
                                        await cache.set(options.cacheStr, JSON.stringify({
                                            p: percentage.toFixed(2),
                                            totalSize: d.totalSize,
                                            uploaded
                                        }));
                                    }
                                }
                                catch (error) {
                                }
                            }
                            results.push(...await this.uploadFolder(folder + "/" + files[i] + "/", directory + files[i] + "/", true, {
                                all: true,
                                files: options.files,
                                path: options.path,
                                rename: options.rename,
                                cacheStr: options.cacheStr
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
                                var pp = folder.endsWith("/") ? folder + files[i] : folder + "/" + files[i];
                                results.push(...await this.uploadFolder(pp + "/", directory + files[i] + "/", true, options));
                            }
                        }
                    }
                    else {
                        var p = folder.substring(((_d = options.path) === null || _d === void 0 ? void 0 : _d.length) || 0) + files[i];
                        if (options.all || ((_e = options.files) === null || _e === void 0 ? void 0 : _e.includes(p))) {
                            paths.push({
                                path: folder.endsWith("/") ? folder + files[i] : folder + "/" + files[i],
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
                        results.push(...await this.uploadFolder(pp + "/", directory + files[i] + "/", true, options));
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
                let res = await this.upload(paths[i].path, paths[i].destination, {
                    rename: options === null || options === void 0 ? void 0 : options.rename
                });
                results.push(res);
                if ((options === null || options === void 0 ? void 0 : options.cacheStr) && !paths[i].path.includes("---thumbnail")) {
                    try {
                        let d = await cache.get(options.cacheStr);
                        if (d != null) {
                            d = JSON.parse(d);
                        }
                        if (d.allFiles) {
                            let uploaded = d.uploaded;
                            d.uploaded = uploaded + 1;
                            d.percentage = (d.uploaded / d.allFiles * 100).toFixed(2);
                            await cache.set((options === null || options === void 0 ? void 0 : options.cacheStr) || "", JSON.stringify(d));
                        }
                        else {
                            var uploaded = d.uploaded + 1;
                            let percentage = uploaded / d.totalSize * 100;
                            await cache.set(options.cacheStr, JSON.stringify({
                                p: percentage.toFixed(2),
                                totalSize: d.totalSize,
                                uploaded
                            }));
                        }
                    }
                    catch (error) {
                    }
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
            await fileManager_1.DiskFileManager.wirteStream(filePath, await this.get(this.extendedPath + file));
            var folderName = path_1.default.basename(filePath).split(".").slice(0, -1).join(".");
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
                cacheStr
            });
            fileManager_1.DiskFileManager.removeFolder(folder);
            fileManager_1.DiskFileManager.removeFile(filePath);
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
            await fileManager_1.DiskFileManager.wirteStream(filePath, await this.get(this.extendedPath + file));
            var folderName = path_1.default.basename(filePath).split(".").slice(0, -1).join(".");
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
    async copy(files, directory, options) {
        try {
            var dirPath = "temp" + "/" + Date.now();
            await fileManager_1.DiskFileManager.mkdir("", dirPath);
            for (let i = 0; i < files.length; i++) {
                if (this.isFolder(files[i])) {
                    var fname = files[i].split("/");
                    await fileManager_1.DiskFileManager.mkdir(dirPath + "/", fname[fname.length - 2]);
                    await this.downloadFolder(files[i], dirPath + "/" + fname[fname.length - 2], {
                        cacheStr: options.cacheStr
                    });
                }
                else {
                    if (files[i].endsWith(".png") || files[i].endsWith(".jpeg") || files[i].endsWith(".jpg") || files[i].endsWith(".webp") || files[i].endsWith(".webm") || files[i].endsWith(".mp4")) {
                        var filenames = files[i].split(".");
                        filenames[filenames.length - 2] = filenames[filenames.length - 2] + "---thumbnail";
                        try {
                            if (["mp4", "webm"].includes(filenames[filenames.length - 1])) {
                                filenames[filenames.length - 1] = "jpg";
                            }
                            await fileManager_1.DiskFileManager.wirteStream(dirPath + "/" + path_1.default.basename(files[i]), await this.get(this.extendedPath + filenames.join(".")));
                        }
                        catch (error) {
                            console.log("eee", error);
                        }
                    }
                    try {
                        if (options.cacheStr) {
                            let d = await cache.get(options.cacheStr);
                            if (d != null) {
                                d = JSON.parse(d);
                            }
                            var uploaded = d.uploaded + 1;
                            d.uploaded = uploaded;
                            d.percentage = (uploaded / d.allFiles * 100).toFixed(2);
                            await cache.set(options.cacheStr, JSON.stringify(d));
                        }
                    }
                    catch (error) {
                    }
                    await fileManager_1.DiskFileManager.wirteStream(dirPath + "/" + path_1.default.basename(files[i]), await this.get(this.extendedPath + files[i]));
                }
            }
            try {
                if (options.cacheStr) {
                    let d = await cache.get(options.cacheStr);
                    let info = JSON.parse(d);
                    info.uploading = true;
                    info.percentage = 0;
                    info.uploaded = 0;
                    await cache.set(options.cacheStr, JSON.stringify(info));
                }
            }
            catch (error) {
            }
            var result = await this.uploadFolder(dirPath + "/", directory, true, {
                rename: options.rename,
                all: true,
                cacheStr: options.cacheStr
            });
            fileManager_1.DiskFileManager.removeFolder(dirPath);
            return result;
        }
        catch (error) {
            throw error;
        }
    }
    async downloadFiles(files, options) {
        // var dirPath = "temp" + "/" + Date.now()
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
                if (options === null || options === void 0 ? void 0 : options.cacheStr) {
                    try {
                        var d = await cache.get(options.cacheStr);
                        info = JSON.parse(d);
                    }
                    catch (error) {
                    }
                }
            }
            else {
                let name = path_1.default.basename(files[i]);
                if (options === null || options === void 0 ? void 0 : options.renameTo) {
                    let ps = files[i].split(".");
                    ps[0] = options === null || options === void 0 ? void 0 : options.renameTo;
                    name = ps.join(".");
                }
                await fileManager_1.DiskFileManager.wirteStream(dirPath + "/" + name, await this.get(this.extendedPath + files[i]));
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
            if (["..", "."].includes(files[i].name)
                || files[i].name.includes("---thumbnail")) {
                continue;
            }
            if (files[i].type == "d") {
                var fname = files[i].name.split("/");
                await fileManager_1.DiskFileManager.mkdir(directory + "/", files[i].name);
                await this.downloadFolder(folder + "/" + files[i].name, directory + "/" + fname[fname.length - 1], options);
            }
            else {
                folder = folder.endsWith("/") ? folder : folder + "/";
                await fileManager_1.DiskFileManager.wirteStream(directory + "/" + path_1.default.basename(files[i].name), await this.get(this.extendedPath + folder + files[i].name));
                if (info.allFiles) {
                    let allFiles = info.allFiles;
                    if (info.uploaded != undefined) {
                        let uploaded = info.uploaded;
                        info.uploaded = uploaded + 1;
                        info.percentage = (info.uploaded / allFiles * 100).toFixed(2);
                        await cache.set((options === null || options === void 0 ? void 0 : options.cacheStr) || "", JSON.stringify(info));
                    }
                    else {
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
        }
    }
    async move1(files, directory, options) {
        var dirPath = "temp" + "/" + Date.now();
        await fileManager_1.DiskFileManager.mkdir("", dirPath);
        // if (this.client.getConnectionStatus() != STATUSES.CONNECTED) {
        //     await this.connect()
        // }
        for (let i = 0; i < files.length; i++) {
            if (this.isFolder(files[i])) {
                var fname = files[i].split("/");
                await fileManager_1.DiskFileManager.mkdir(dirPath + "/", fname[fname.length - 2]);
                await this.downloadFolder(files[i], dirPath + "/" + fname[fname.length - 2]);
            }
            else {
                if (files[i].endsWith(".png") || files[i].endsWith(".jpeg") || files[i].endsWith(".jpg") || files[i].endsWith(".webp") || files[i].endsWith(".mp4") || files[i].endsWith(".webm")) {
                    var filenames = files[i].split(".");
                    filenames[filenames.length - 2] = filenames[filenames.length - 2] + "---thumbnail";
                    try {
                        if (["webm", "mp4"].includes(filenames[filenames.length - 1])) {
                            filenames[filenames.length - 1] = "jpg";
                        }
                        await fileManager_1.DiskFileManager.wirteStream(dirPath + "/" + path_1.default.basename(files[i]), await this.get(this.extendedPath + filenames.join(".")));
                    }
                    catch (error) {
                    }
                }
                await fileManager_1.DiskFileManager.wirteStream(dirPath + "/" + path_1.default.basename(files[i]), await this.get(this.extendedPath + files[i]));
            }
        }
        var result = await this.uploadFolder(dirPath + "/", directory, true);
        this.deleteFiles(files, {
            isConnected: false,
            moveToHidden: false
        });
        fileManager_1.DiskFileManager.removeFolder(dirPath);
        return result;
    }
    async move(files, directory, options) {
        // var dirPath = "temp" + "/" + Date.now()
        // await DiskFileManager.mkdir("", dirPath)
        // if (this.client.getConnectionStatus() != STATUSES.CONNECTED) {
        //     await this.connect()
        // }
        for (let i = 0; i < files.length; i++) {
            if (this.isFolder(files[i])) {
                var dirs = files[i].split("/");
                await this.renameFTP(this.extendedPath + files[i], this.extendedPath + directory + dirs[dirs.length - 2] + "/");
                if (options.cacheStr) {
                    try {
                        let d = await cache.get(options.cacheStr);
                        let info = JSON.parse(d);
                        let uploaded = info.uploaded + 1;
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
            else {
                if (files[i].endsWith(".png") || files[i].endsWith(".jpeg") || files[i].endsWith(".jpg") || files[i].endsWith(".webp") || files[i].endsWith(".mp4") || files[i].endsWith(".webm")) {
                    var filenames = files[i].split(".");
                    filenames[filenames.length - 2] = filenames[filenames.length - 2] + "---thumbnail";
                    if (["webm", "mp4"].includes(filenames[filenames.length - 1])) {
                        filenames[filenames.length - 1] = "jpg";
                    }
                    var file = filenames.join(".");
                    var dirs = file.split("/");
                    try {
                        await this.renameFTP(this.extendedPath + file, this.extendedPath + directory + dirs[dirs.length - 1]);
                    }
                    catch (error) {
                    }
                }
                if (options.cacheStr) {
                    try {
                        let d = await cache.get(options.cacheStr);
                        let info = JSON.parse(d);
                        let uploaded = info.uploaded + 1;
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
                var dirs = files[i].split("/");
                await this.renameFTP(this.extendedPath + files[i], this.extendedPath + directory + dirs[dirs.length - 1]);
            }
        }
        return {};
    }
    async rename(file, name, options) {
        try {
            if (this.isFolder(file)) {
                var dires = file.split("/");
                dires[dires.length - 1] = name;
            }
            else {
                var dires = file.split("/");
                var basename = dires[dires.length - 1].split(".")[0];
                if (name.includes(".")) {
                    name = name.split(".")[0];
                }
                dires[dires.length - 1] = dires[dires.length - 1].replace(basename, name);
            }
            var newName = dires.join("/");
            // await this.connect()
            if (file.endsWith(".png") || file.endsWith(".jpeg") || file.endsWith(".jpg") || file.endsWith(".webp") || file.endsWith(".mp4") || file.endsWith(".webm")) {
                try {
                    var filenames = file.split(".");
                    filenames[filenames.length - 2] = filenames[filenames.length - 2] + "---thumbnail";
                    var newFileName = newName.split(".");
                    newFileName[newFileName.length - 2] = newFileName[newFileName.length - 2] + "---thumbnail";
                    if (["webm", "mp4"].includes(filenames[filenames.length - 1])) {
                        filenames[filenames.length - 1] = "jpg";
                        newFileName[newFileName.length - 1] = "jpg";
                    }
                    await this.renameFTP(this.extendedPath + filenames.join("."), this.extendedPath + newFileName.join("."));
                }
                catch (error) {
                }
            }
            const r = this.renameFTP(this.extendedPath + file, this.extendedPath + newName);
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
        catch (error) {
            throw error;
        }
    }
    async isPathExists(paths, isConnected = false) {
        // if (this.client.getConnectionStatus() != STATUSES.CONNECTED) {
        //     await this.connect()
        // }
        let results = [];
        for (let i = 0; i < paths.length; i++) {
            try {
                if (paths[i] == "") {
                    results.push(true);
                }
                else if (paths[i].endsWith("/")) {
                    try {
                        let ps = paths[i].split("/");
                        if (ps.length < 2) {
                            results.push(true);
                        }
                        else {
                            let flag = false;
                            ps.pop();
                            let name = ps.pop();
                            let parentDir = ps.join("/");
                            if (parentDir != "") {
                                parentDir = parentDir + "/";
                            }
                            let r = await this.getFiles(parentDir);
                            for (let i = 0; i < r.length; i++) {
                                if (r[i].type == "d" && r[i].name == name) {
                                    flag = true;
                                    break;
                                }
                            }
                            results.push(flag);
                        }
                    }
                    catch (error) {
                        console.log(error);
                        results.push(false);
                    }
                }
                else {
                    let data = await this.get(this.extendedPath + paths[i]);
                    results.push(true);
                }
            }
            catch (error) {
                results.push(false);
            }
        }
        return results;
    }
    async findFolder(directory = "", id = 1, options) {
        var folders = [];
        try {
            // if (this.client.getConnectionStatus() != STATUSES.CONNECTED) {
            //     await this.connect()
            // }
            var findedFolders = await this.getFiles(directory, { isConnected: true });
            for (let i = 0; i < findedFolders.length; i++) {
                if (findedFolders[i].type != "-" && ![".", ".."].includes(findedFolders[i].name)) {
                    var folder = {};
                    folder.access = true;
                    folder.date = findedFolders[i].date;
                    folder.id = directory + findedFolders[i].name + "/";
                    folder.name = findedFolders[i].name;
                    folder.haveChild = false;
                    if ((options === null || options === void 0 ? void 0 : options.checkSub) == true) {
                        folder.sub = (await this.findFolder(directory + findedFolders[i].name + "/", id + 1, {
                            isConnected: true
                        })).folders.length;
                    }
                    // id = chilFolders.id
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
            }
        }
        catch (err) {
            throw err;
        }
        return folders;
    }
    async setPermission(file, permission, options) {
        try {
            // if (this.client.getConnectionStatus() != STATUSES.CONNECTED) {
            //     await this.connect()
            // }
            if ((options === null || options === void 0 ? void 0 : options.recursive) && this.isFolder(file)) {
                var subfiles = await this.getFiles(file, {
                    isConnected: true
                });
                for (let i = 0; i < subfiles.length; i++) {
                    if ([".", "..", ".hidden"].includes(subfiles[i].name)) {
                        continue;
                    }
                    if (subfiles[i].type == "d") {
                        await this.setPermission(file + subfiles[i].name + "/", permission, options);
                    }
                    else {
                        await this.site(`chmod 0${permission} ${this.extendedPath + file + subfiles[i].name}`);
                    }
                }
            }
            var result = await this.site(`chmod 0${permission} ${this.extendedPath + file}`);
        }
        catch (error) {
            throw error;
        }
    }
    async connect(cli) {
        // var connectionProvider = FTPConnectionProvider.getInstance()
        // try {
        //     let before = this.client.getConnectionStatus()
        //     this.client.destroy()
        //     this.client = new ftp()
        //     await this.client.connect({
        //         host: this.url,
        //         password: this.password,
        //         user: this.user
        //     })
        //     FTPConnectionProvider.getInstance(this.host, this.user, this.password).connection = this.client
        //     // connectionProvider.connection = this.client
        // } catch (error) {
        // }
        // return
        return new Promise((resolve, reject) => {
            cli.connect({
                host: this.url,
                password: this.password,
                user: this.user
            });
            cli.on("ready", () => {
                resolve(true);
            });
            cli.on("error", (err) => {
                reject(err);
            });
        });
    }
    async getInfo() {
    }
    async getFilesSize(files, isConnected = false) {
        var totalSize = 0;
        try {
            // if (this.client.getConnectionStatus() != STATUSES.CONNECTED) {
            //     await this.connect()
            // }
            for (let i = 0; i < files.length; i++) {
                if (files[i].includes(this.baseDir))
                    files[i] = files[i].split(this.baseDir)[1];
                if (files[i].endsWith("/")) {
                    totalSize += await this.getFolderSize(files[i], true);
                }
                else {
                    totalSize += await this.size(this.extendedPath + files[i]);
                }
            }
        }
        catch (error) {
        }
        return totalSize;
    }
    async getFolderSize(folder, isConnected = false) {
        var totalSize = 0;
        try {
            // if (this.client.getConnectionStatus() != STATUSES.CONNECTED) {
            //     await this.connect()
            // }
            var files = await this.getFiles(folder);
            for (let i = 0; i < files.length; i++) {
                if (files[i].name == "." || files[i].name == "..")
                    continue;
                if (files[i].type == "d") {
                    var newFolder = folder + files[i].name;
                    if (!newFolder.endsWith("/")) {
                        newFolder += "/";
                    }
                    totalSize += await this.getFolderSize(newFolder, true);
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
    async getAllFiles(paths) {
        var files = [];
        try {
            for (let i = 0; i < paths.length; i++) {
                if (paths[i].includes("---thumbnail")) {
                    continue;
                }
                if (paths[i].endsWith("/")) {
                    files.push(...await this.getFolderAllFiles(paths[i]));
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
    async getFolderAllFiles(folder) {
        var files = [];
        try {
            var folderFiles = await this.getFiles(folder);
            for (let i = 0; i < folderFiles.length; i++) {
                if (folderFiles[i].name == "." || folderFiles[i].name == "..")
                    continue;
                if (folderFiles[i].name.includes("---thumbnail")) {
                    continue;
                }
                if (folderFiles[i].type == "d") {
                    var newFolder = folder + folderFiles[i].name;
                    if (!newFolder.endsWith("/")) {
                        newFolder += "/";
                    }
                    files.push(...await this.getFolderAllFiles(newFolder));
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
}
exports.FTP = FTP;
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "ftp",
                function: "getFiles"
            }
        };
    })
], FTP.prototype, "getFiles", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "ftp",
                function: "getFileManagerDirectory"
            }
        };
    })
], FTP.prototype, "getFileManagerDirectory", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "ftp",
                function: "readFiles"
            }
        };
    })
], FTP.prototype, "readFiles", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "ftp",
                function: "removeFiles"
            }
        };
    })
], FTP.prototype, "removeFiles", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "ftp",
                function: "removeFile"
            }
        };
    })
], FTP.prototype, "removeFile", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "ftp",
                function: "makeThumbNail"
            }
        };
    })
], FTP.prototype, "makeThumbNail", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "ftp",
                function: "upload"
            }
        };
    })
], FTP.prototype, "upload", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "ftp",
                function: "uploadMany"
            }
        };
    })
], FTP.prototype, "uploadMany", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "ftp",
                function: "deleteFile"
            }
        };
    })
], FTP.prototype, "deleteFile", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "ftp",
                function: "deleteFiles"
            }
        };
    })
], FTP.prototype, "deleteFiles", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "ftp",
                function: "craeteDirectory"
            }
        };
    })
], FTP.prototype, "craeteDirectory", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "ftp",
                function: "search"
            }
        };
    })
], FTP.prototype, "search", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "ftp",
                function: "search"
            }
        };
    })
], FTP.prototype, "zip", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "ftp",
                function: "uploadFolder"
            }
        };
    })
], FTP.prototype, "uploadFolder", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "ftp",
                function: "unzip"
            }
        };
    })
], FTP.prototype, "unzip", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "ftp",
                function: "getZipFileInfo"
            }
        };
    })
], FTP.prototype, "getZipFileInfo", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "ftp",
                function: "copy"
            }
        };
    })
], FTP.prototype, "copy", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "ftp",
                function: "move"
            }
        };
    })
], FTP.prototype, "move1", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "ftp",
                function: "move"
            }
        };
    })
], FTP.prototype, "move", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "ftp",
                function: "rename"
            }
        };
    })
], FTP.prototype, "rename", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "ftp",
                function: "findFolder"
            }
        };
    })
], FTP.prototype, "isPathExists", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "cdnManager",
            error: err.message,
            isCritical: false,
            otherInfo: {
                err: err,
                type: "ftp",
                function: "setPermission"
            }
        };
    })
], FTP.prototype, "setPermission", null);
