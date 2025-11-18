"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.incrementalBackUp = incrementalBackUp;
const fileManager_1 = require("./fileManager");
const { PostgreSql, MongoDb } = require('@shagital/db-dumper');
const child_process_1 = require("child_process");
const zip_a_folder_1 = require("zip-a-folder");
// import SmsMessager from "../messaging/smsMessager"
const config_1 = __importDefault(require("./config"));
const path_1 = __importDefault(require("path"));
function incrementalBackUp(name) {
}
class BackUpService {
    constructor() {
        ;
    }
    async makeFullBackUp() {
    }
    getDBConfig() {
        let baseurl = config_1.default.getConfig("DB_URL");
        let url = new URL(baseurl);
        // console.log(url)
        return {
            type: "mongodb",
            database: url.pathname.replace("/", ""),
            username: config_1.default.getConfig("DB_USER"),
            password: config_1.default.getConfig("DB_PASSWORD"),
            host: url.hostname,
            port: url.port,
            auth_db: "admin"
        };
    }
    removeDBDump(DB_Name) {
        try {
            fileManager_1.DiskFileManager.removeFolder(`dump/${DB_Name}`);
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async makeBackup(backup) {
        try {
            let dir_name = Date.now().toString();
            let temp_dir = `temp/${dir_name}/`;
            await fileManager_1.DiskFileManager.mkdir("temp/", dir_name);
            if (backup.backupType == "database" || backup.backupType == "full") {
                let config = backup.isInternalDB ? this.getDBConfig() : backup.dbConfig;
                let db_path = await this.makeDataBaseBackup(config);
                await fileManager_1.DiskFileManager.mkdir(temp_dir, "db");
                await fileManager_1.DiskFileManager.move(db_path, `${temp_dir}db/`);
            }
            if (backup.backupType == "full" || backup.backupType == "source") {
                await fileManager_1.DiskFileManager.mkdir(temp_dir, "source");
                await this.copySource(`${temp_dir}source/`);
            }
            let result = await this.zipFolder(temp_dir, `temp/${dir_name}.zip`);
            await fileManager_1.DiskFileManager.removeFolder(temp_dir);
            return result;
        }
        catch (error) {
            throw error;
        }
    }
    async copySource(destination) {
        try {
            await fileManager_1.DiskFileManager.copyFolder("src/", destination);
            await fileManager_1.DiskFileManager.copyFolder("sitemap/", destination);
            await fileManager_1.DiskFileManager.copyFolder("build/", destination);
            await fileManager_1.DiskFileManager.copyFolder("cms-show/", destination);
            await fileManager_1.DiskFileManager.copyFolder("angular/", destination);
            await fileManager_1.DiskFileManager.copy(".env", destination);
        }
        catch (error) {
            throw error;
        }
    }
    async makeDataBaseBackup(dbConfig) {
        try {
            if (dbConfig.type == 'mongodb') {
                var cmd = [
                    "'mongodump'",
                    '--db ' + dbConfig.database,
                    "--username '" + dbConfig.username + "'",
                    "--password '" + dbConfig.password + "'",
                    '--host ' + dbConfig.host,
                    '--port ' + dbConfig.port,
                    '--authenticationDatabase ' + dbConfig.auth_db
                ].join(" ");
                await this.executeCommand(cmd);
                return `dump/${dbConfig.database}/`;
            }
            else if (dbConfig.type == 'postgresql') {
                var cmd = [
                    `export PGPASSWORD='${dbConfig.password}';`,
                    "pg_dump",
                    '-E UTF8',
                    '-d ' + dbConfig.database,
                    '-h ' + dbConfig.host,
                    '-p ' + dbConfig.port,
                    "-U '" + dbConfig.username + "'",
                    "-f dump/" + dbConfig.database + ".sql"
                ].join(" ");
                await this.executeCommand(cmd);
                return `dump/${dbConfig.database}.sql`;
            }
            throw new Error("invalid db");
        }
        catch (error) {
            console.log("error backup");
            throw error;
            // console.log(error)
        }
    }
    async restoreDatabase(dbConfig, backupPath) {
        try {
            if (dbConfig.type == 'mongodb') {
                const cmd = [
                    "'mongorestore'",
                    '--db ' + dbConfig.database,
                    "--username '" + dbConfig.username + "'",
                    "--password '" + dbConfig.password + "'",
                    '--host ' + dbConfig.host,
                    '--port ' + dbConfig.port,
                    '--authenticationDatabase ' + dbConfig.auth_db,
                    // '--drop',
                    backupPath // Path to the backup
                ].join(" ");
                await this.executeCommand(cmd);
                console.log(`MongoDB database ${dbConfig.database} restored successfully from ${backupPath}`);
                return true;
            }
            else if (dbConfig.type == 'postgresql') {
                const cmd = [
                    `export PGPASSWORD='${dbConfig.password}';`,
                    "psql",
                    '-d ' + dbConfig.database,
                    '-h ' + dbConfig.host,
                    '-p ' + dbConfig.port,
                    '-U ' + dbConfig.username,
                    '-f ' + backupPath
                ].join(" ");
                await this.executeCommand(cmd);
                console.log(`PostgreSQL database ${dbConfig.database} restored successfully from ${backupPath}`);
                return true;
            }
            throw new Error("invalid db type for restore");
        }
        catch (error) {
            console.log("error during restore");
            throw error;
        }
    }
    async zipFolder(folder, name) {
        // var password = RandomGenarator.generateHashStr(25)
        // let cmd = [
        //     "'zip'",
        //     // '--password ' + password,
        //     "-r " + name,
        //     folder
        // ].join(" ")
        // await this.executeCommand(cmd)
        await (0, zip_a_folder_1.zip)(folder, name);
        return {
            path: name,
            // password,
            file: path_1.default.basename(name)
        };
    }
    async executeCommand(command) {
        return new Promise((resolve, reject) => {
            console.log(command);
            (0, child_process_1.exec)(command, (err, stdout, stderr) => {
                if (err) {
                    console.log(err);
                    console.log("reject");
                    reject();
                }
                else
                    resolve(true);
            });
        });
    }
}
exports.default = BackUpService;
