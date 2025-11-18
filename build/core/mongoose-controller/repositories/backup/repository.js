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
const model_1 = require("./model");
const repository_1 = __importDefault(require("../../repository"));
// import schaduler from "../../services."
const queue_1 = __importDefault(require("../../../services/queue"));
const fileManager_1 = __importStar(require("../../../services/fileManager"));
const random_1 = __importDefault(require("../../../random"));
const backup_1 = __importDefault(require("../../../services/backup"));
const repository_2 = __importDefault(require("../backupLog/repository"));
const path_1 = __importDefault(require("path"));
const extract_zip_1 = __importDefault(require("extract-zip"));
const fs_1 = __importDefault(require("fs"));
const mongoose_1 = __importDefault(require("mongoose"));
const process_1 = require("process");
const config_1 = __importDefault(require("../../../services/config"));
// console.log("tts")
function convertIranTimeToUTC(hours, minutes) {
    // Create a date object in the Iran timezone (UTC+3:30)
    const iranDate = new Date();
    iranDate.setHours(hours - 3, minutes - 30); // Adjust to UTC
    // Format the output in UTC
    const hour = String(iranDate.getUTCHours()).padStart(2, '0');
    const minute = String(iranDate.getUTCMinutes()).padStart(2, '0');
    return {
        hour,
        minute
    };
}
class BackupRepository extends repository_1.default {
    constructor(options) {
        super(model_1.BackupModel, options);
        this.cdn = new fileManager_1.default();
        this.backupLogRepo = new repository_2.default();
        this.updateAllBackups();
        this.backService = new backup_1.default();
    }
    async doBackup(job) {
        var log;
        try {
            let backupId = job.attrs.data["backupId"];
            let backup = await this.findById(backupId);
            if (backup == null)
                return;
            log = await this.backupLogRepo.insert({
                backupId: backup._id,
                cdn: backup.cdn
            });
            let result = await this.backService.makeBackup(backup);
            this.cdn.CDN_id = backup.cdn;
            await this.cdn.init(true);
            let stats = await fileManager_1.DiskFileManager.stats(result.path);
            let file = await this.cdn.upload(result.path, backup.path + result.file.replace("/", ""));
            try {
                await fileManager_1.DiskFileManager.removeFile(result.path);
            }
            catch (error) {
            }
            const logs = await this.backupLogRepo.collection.find({
                backupId: backup._id,
                isDelete: false
            })
                .sort({
                _id: -1
            })
                .skip(backup.deletionSchedule);
            for (let i = 0; i < logs.length; i++) {
                try {
                    if (logs[i].files.length > 0) {
                        this.cdn.CDN_id = logs[i].cdn;
                        await this.cdn.init(true);
                    }
                    await this.backupLogRepo.findByIdAndUpdate(logs[i]._id, {
                        $set: {
                            isDelete: true
                        }
                    });
                }
                catch (error) {
                }
            }
            await this.backupLogRepo.updateOne({
                _id: log._id
            }, {
                $set: {
                    files: [file],
                    status: "proccessed",
                    end: new Date(),
                    fileSize: stats.size
                }
            });
        }
        catch (error) {
            console.log(error);
            if (log != undefined)
                this.backupLogRepo.updateOne({
                    _id: log._id
                }, {
                    $set: {
                        status: "failed",
                        end: new Date(),
                        err: error.message || ""
                    }
                });
        }
    }
    async updateAllBackups() {
        try {
            let backups = await this.findAll({});
            for (let i = 0; i < backups.length; i++) {
                await this.updateBackupJobs(backups[i]);
            }
        }
        catch (error) {
            // throw error
        }
    }
    async deleteBackupJobs(backupId) {
        await queue_1.default._collection.deleteMany({
            "data.backupId": backupId
        });
    }
    async updateBackupJobs(backup) {
        try {
            let schedules = this.getJobDefinition(backup);
            await this.deleteBackupJobs(backup._id);
            for (let j = 0; j < schedules.length; j++) {
                queue_1.default.define(schedules[j].name, this.doBackup.bind(this));
                let r = await queue_1.default.every(schedules[j].time, schedules[j].name, {
                    backupId: backup._id
                });
            }
        }
        catch (error) {
        }
    }
    async insert(document, options) {
        try {
            let doc = await super.insert(document);
            this.updateBackupJobs(doc);
            return doc;
        }
        catch (error) {
            throw error;
        }
    }
    async findByIdAndUpdate(id, query) {
        try {
            const r = await super.findByIdAndUpdate(id, query);
            const backup = await this.findById(id);
            if (backup != null) {
                this.updateBackupJobs(backup);
            }
            return r;
        }
        catch (error) {
            throw error;
        }
    }
    getJobDefinition(doc) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        let schedules = [];
        if (doc.periodType == "hourly") {
            let hourly = (_a = doc.periodConfig) === null || _a === void 0 ? void 0 : _a.hourly;
            if (hourly) {
                for (let i = 0; i < hourly.length; i++) {
                    // const element = array[i];
                    let utc = convertIranTimeToUTC(hourly[i].hour, hourly[i].minute);
                    schedules.push({
                        time: `${utc.minute} ${utc.hour} * * *`,
                        name: random_1.default.getUniqueId()
                    });
                }
            }
        }
        else if (doc.periodType == "daily") {
            if (((_b = doc.periodConfig) === null || _b === void 0 ? void 0 : _b.hour) != undefined && ((_c = doc.periodConfig) === null || _c === void 0 ? void 0 : _c.minute) != undefined) {
                let utc = convertIranTimeToUTC(doc.periodConfig.hour, doc.periodConfig.minute);
                schedules.push({
                    time: `${utc.minute} ${utc.hour} * * *`,
                    name: random_1.default.getUniqueId()
                });
            }
        }
        else if (doc.periodType == "weekly") {
            let weekDays = (_d = doc.periodConfig) === null || _d === void 0 ? void 0 : _d.weekDays;
            if (weekDays) {
                let utc = convertIranTimeToUTC(((_e = doc.periodConfig) === null || _e === void 0 ? void 0 : _e.hour) || 0, ((_f = doc.periodConfig) === null || _f === void 0 ? void 0 : _f.minute) || 0);
                for (let i = 0; i < weekDays.length; i++) {
                    schedules.push({
                        time: `${weekDays[i]} at ${utc.hour}:${utc.minute}`,
                        name: random_1.default.getUniqueId()
                    });
                }
            }
        }
        else {
            let monthly = (_g = doc.periodConfig) === null || _g === void 0 ? void 0 : _g.monthly;
            if (monthly) {
                for (let i = 0; i < monthly.length; i++) {
                    let utc;
                    utc = convertIranTimeToUTC(((_h = doc.periodConfig) === null || _h === void 0 ? void 0 : _h.hour) || 0, ((_j = doc.periodConfig) === null || _j === void 0 ? void 0 : _j.minute) || 0);
                    // }
                    schedules.push({
                        time: `${utc === null || utc === void 0 ? void 0 : utc.minute} ${utc === null || utc === void 0 ? void 0 : utc.hour} ${monthly[i].day} ${monthly[i].month} *`,
                        name: random_1.default.getUniqueId()
                    });
                }
            }
        }
        return schedules;
    }
    async getLog(logId) {
        return this.backupLogRepo.findById(logId);
    }
    async download(files, cdnConfig) {
        try {
            let dir_name = Date.now().toString();
            let temp_dir = `temp/${dir_name}/`;
            await fileManager_1.DiskFileManager.mkdir("temp/", dir_name);
            this.cdn.CDN_id = cdnConfig._id;
            await this.cdn.init(true);
            let finalFiles = [];
            for (let i = 0; i < files.length; i++) {
                let file = files[i].replace(cdnConfig.hostUrl, "");
                await this.cdn.downloadFile(file, `${temp_dir}${path_1.default.basename(file)}`);
                finalFiles.push(`${temp_dir}${path_1.default.basename(file)}`);
            }
            if (finalFiles.length > 0) {
                return finalFiles[0];
            }
        }
        catch (error) {
            throw error;
        }
    }
    async backupCurrentDatabase() {
        // console.log(`Backup created at ${backupFilePath}`);
        let dbPath = await this.backService.makeDataBaseBackup(this.backService.getDBConfig());
        return dbPath;
    }
    async backupAndReplaceData(zipFilePath, dir) {
        let folderName = path_1.default.basename(zipFilePath).split(".")[0];
        let extractPath = `${dir}${folderName}`;
        await fileManager_1.DiskFileManager.mkdir(dir, folderName);
        console.log(zipFilePath, { dir: (0, process_1.cwd)() + "/" + extractPath + "/" });
        await (0, extract_zip_1.default)(zipFilePath, { dir: (0, process_1.cwd)() + "/" + extractPath + "/" });
        let current_folder = Date.now().toString();
        let current_path = `${dir}${current_folder}/`;
        await fileManager_1.DiskFileManager.mkdir(dir, current_folder);
        const dbFolderPath = path_1.default.join(extractPath, "db");
        let dbConfig = this.backService.getDBConfig();
        if (fs_1.default.existsSync(dbFolderPath)) {
            await fileManager_1.DiskFileManager.mkdir(current_path, "db");
            let db_path = await this.backupCurrentDatabase();
            await fileManager_1.DiskFileManager.move(db_path, `${current_path}db/`);
            await this.makeDateBaseEmpty(`${dbFolderPath}/${dbConfig.database}/`, config_1.default.getConfig("excludeDBCollections") || []);
            await this.backService.restoreDatabase(dbConfig, `${dbFolderPath}/${dbConfig.database}/`);
        }
        else {
            throw new Error("No 'db' folder found in the zip file.");
        }
        // Cleanup
        await fileManager_1.DiskFileManager.removeFile(zipFilePath);
        let paths = zipFilePath.split("/");
        paths.pop();
        await fileManager_1.DiskFileManager.removeFolder(paths.join("/") + "/");
        await fileManager_1.DiskFileManager.removeFolder(extractPath);
        let result = await this.backService.zipFolder(current_path, `temp/${current_folder}.zip`);
        await fileManager_1.DiskFileManager.removeFolder(current_path);
        return result;
    }
    async makeDateBaseEmpty(dbFolderPath, collectionsToKeep) {
        const currentDb = mongoose_1.default.connection;
        const allCollections = await this.getCollections(currentDb);
        for (const collectionName of allCollections) {
            if (!collectionsToKeep.includes(collectionName)) {
                await currentDb.collection(collectionName).deleteMany({});
                console.log(`Deleted all data from collection: ${collectionName}`);
            }
            else {
                await fileManager_1.DiskFileManager.removeFile(`${dbFolderPath}${collectionName}.bson`);
                await fileManager_1.DiskFileManager.removeFile(`${dbFolderPath}${collectionName}.metadata.json`);
            }
        }
    }
    async getCollections(db) {
        const collections = await db.db.listCollections().toArray();
        return collections.map((col) => col.name);
    }
    async paginate(query, limit, page, options) {
        try {
            let data = await super.paginate(query, limit, page, options);
            let list = data.list;
            for (let i = 0; i < list.length; i++) {
                // console.log("id", list[i]._id)
                list[i]["lastLog"] = await this.backupLogRepo.findOne({
                    backupId: list[i]._id
                });
                let lst = await this.backupLogRepo.findAll({
                    backupId: list[i]._id
                });
            }
            return data;
        }
        catch (error) {
            throw error;
        }
    }
    async deleteById(id) {
        try {
            let res = await super.deleteById(id);
            this.deleteBackupJobs(id);
            return res;
        }
        catch (error) {
            throw error;
        }
    }
}
exports.default = BackupRepository;
