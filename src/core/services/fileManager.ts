import fs, { stat } from 'fs';
import * as minio from "minio"
import ftps from "ftp"
import ftp, { STATUSES } from "promise-ftp"
import got from "got"
import path from 'path';
import { zip } from 'zip-a-folder'
import { Readable } from 'stream';
import request from 'request';
import { promisify } from 'util';
import extract from 'extract-zip'
var rimraf = require("rimraf");
import logSystemError from "../errorLogger"
import FileManagerConfigRepository from '../mongoose-controller/repositories/fileManagerConfig/repository';
import { FileManagerType } from '../mongoose-controller/repositories/fileManagerConfig/model';
import CdnLogRepository from '../mongoose-controller/repositories/cdnLog/repository';
import CdnLog from '../mongoose-controller/repositories/cdnLog/model';
import filesType from '../fileTypes';
import BackupRepository from '../mongoose-controller/repositories/backup/repository';
import BackUpService from './backup';
import axios from 'axios';
import RedisCache from '../redis-cache';
import RandomGenarator from '../random';

import { FTP } from './cdn/ftp';
import { S3 } from './cdn/objectStorage';
import RecycleBinRepository from '../mongoose-controller/repositories/recycleBin/repository';
import CDN_OperationRepository from '../mongoose-controller/repositories/cdnOperations/repository';
import ConfigService from './config';
import CDN_LockedPathRepository from '../mongoose-controller/repositories/cdnLockedPath/repository';
import BackupFileRepository from '../mongoose-controller/repositories/backupFile/repository';
import { exec } from 'child_process';
import { dir } from 'console';

// let cacheService = new CacheStorage()
const cache = new RedisCache("file_managing")

const recycleBinRepo = new RecycleBinRepository()
const fileManagerConfigRepo = new FileManagerConfigRepository()

export interface SystemErrorLog {

}



export interface FileMager {
    baseDir: string;

    removeFiles(paths: string[]): Promise<boolean>;

    removeFile(path: string[]): Promise<boolean>;

}


export interface FileView {
    isConnected?: boolean,
    extendFolders?: boolean
}

export interface CreateDirectory {
    isConnected?: boolean
}

export interface SearchFile {
    isConnected?: boolean,
    searchType?: 'any' | 'file' | 'folder',
    nested?: boolean
}

export interface ZipFiles {
    isConnected?: boolean,
    rename?: boolean,
    cacheStr?: string
}

export interface UnZipFile {
    isConnected?: boolean,
    files?: string[],
    path?: string,
    rename?: boolean,
    cacheStr?: string
}

export interface CopyFiles {
    moveHidden?: boolean,
    isConnected?: boolean,
    rename?: boolean,
    renameFolder?: boolean
    cacheStr?: string,
}


export interface DownloadOptions {
    allcounts?: number,
    cacheStr?: string,
    folder?: string,
    restore?: boolean,
    renameTo?: string
}

export interface MoveFiles {
    moveHidden?: boolean,
    isConnected?: boolean,
    rename?: boolean,
    renameFolder?: boolean,
    cacheStr?: string,
    resetCache?: boolean
}

export interface RenameFile {
    cacheStr?: string

}

export interface FindFolders {
    isConnected?: boolean,
    checkSub?: boolean
}

export interface DeleteFiles {
    isConnected?: boolean,
    moveToHidden?: boolean,
    cacheStr?: string,
    moveHidden?: boolean,
}

export interface UploadFolder {
    files?: string[]
    path?: string,
    all?: boolean,
    rename?: boolean,
    inBackground?: boolean,
    cacheStr?: string,
    restore?: boolean
}

export interface UploadFiles {
    rename?: boolean,
    isConnected?: boolean,
    cache?: string,
    caches?: string[],
    tocache?: boolean,
    removeFile ?: boolean
}

export interface SetPermission {
    recursive?: boolean,
    isConnected?: boolean
}

export interface Append {
    isFirst: boolean,
    rename: boolean,
    deleteFile?: boolean,
    isfinished? :boolean
}

export interface CdnLog_I {
    cdn: string,
    files: string[],
    type: string,
    operation: string,
    info: any
}

export async function urlToStream(fileUrl: string): Promise<
    string
> {
    var filename = fileUrl.split("/");
    var path = "src/uploads/" + filename[filename.length - 1]
    var tempFile = fs.createWriteStream(path);

    try {
        return new Promise(async (resolve, reject) => {
            tempFile.on("open", async (fd) => {
                await got.stream(fileUrl).pipe(tempFile).on("close", () => {
                    return resolve(path)
                })
            })

        })
    } catch (error) {
        return ""
    }



}




export class DiskFileManager implements FileMager {
    baseDir: string;
    constructor(baseDir: string) {
        this.baseDir = baseDir;
    }

    async removeFiles(paths: string[]): Promise<boolean> {
        return false
    }

    async removeFile(path: string[]): Promise<boolean> {
        return false
    }

    async move(path: string, destination: string): Promise<boolean> {
        return false
    }

    static async removeFiles(paths: string[]): Promise<boolean> {
        for (let i = 0; i < paths.length; i++) {
            try {
                await this.removeFile(paths[i])
            } catch (error) {
                throw error
            }
        }
        return true;
    }

    static async urlStat(url : string){
        try {
            const file = await DiskFileManager.downloadFile(url , "temp/")
            // console.log("file" , file)
            const stats = await this.stats(file)
            await this.removeFile(file)
            return stats
        } catch (error) {
            throw error
        }
    

    }

    static async stats(file: string) {
        try {
            return new Promise<fs.Stats>((resolve, reject) => {
                fs.stat(file, (err, stat) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    resolve(stat)
                })
            })
        } catch (error) {
            throw error
        }
    }

    static async rename(file: string, newFile: string) {
        try {
            return new Promise((resolve, reject) => {
                fs.rename(file, newFile, (err) => {
                    if (err) {
                        return reject(err)
                    }

                    resolve(newFile)
                });
            })
        } catch (error) {
            throw error
        }
    }

    static removeFile(path: string): Promise<boolean> {

        return new Promise((resolve, reject) => {

            fs.unlink(path, function (err) {
                if (err) {
                    return reject(err)
                }
                return resolve(true)
            })
        })
    }

    static async removeFolderFiles(folder: string) {
        let files = fs.readdirSync(folder)
        for (let i = 0; i < files.length; i++) {
            await this.removeFile(folder + files[i])
        }
    }

    static async readFile(file: string) {
        return new Promise<string[]>((resolve, reject) => {
            fs.readFile(file, 'utf8', (err, data) => {
                if (err) {
                    reject(err)
                    return
                }

                const lines = data.split('\n');

                resolve(lines)
            });
        })
    }

    static removeFileSync(path: string) {
        try {
            fs.unlinkSync(path)
        } catch (error) {
            throw error
        }
    }

    static removeFolder(path: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            rimraf(path, function (err: any) {
                if (err) {
                    // return reject(err)
                }
                return resolve(true)
            })
        })
    }

    static writeFile(path: string, data: string | Buffer) {
        return new Promise((resolve, reject) => {
            fs.writeFile(path, data, function (err) {
                if (err) {
                    return reject(err)
                }
                return resolve(true)
            })
        })
    }



    static async wirteStream(path: string, stream: NodeJS.ReadableStream | Readable | any)  {
        var ws = fs.createWriteStream(path)
        stream.pipe(ws);
        
        return new Promise((resolve, reject) => {
            stream.on("end", function () {
                resolve(true)
            })
            stream.on("error", (error :any) => {
                reject(error)
            })
        })
    }

    static async isExists(p: string) {
        return new Promise<boolean>((resolve, reject) => {

            fs.stat(p, (err, stats) => {
                // // console.log("stat", stats)
                if (err) {
                    if (err.code === 'ENOENT') {
                        resolve(false)
                    } else {
                        reject(err)
                    }
                } else {
                    if (stats.isDirectory()) {
                        resolve(true)
                    } else {
                        resolve(false)
                    }
                }
            });

        })
    }

    static async isFileExists(p: string) {
        return new Promise((resolve, reject) => {

            fs.stat(p, (err, stats) => {
                // // console.log("stat", stats)
                if (err) {
                    if (err.code === 'ENOENT') {
                        resolve(false)
                    } else {
                        reject(err)
                    }
                } else {
                    if (stats.isDirectory()) {
                        resolve(false)
                    } else {
                        resolve(true)
                    }
                }
            });

        })
    }

    static async moveFolder(p: string, destination: string): Promise<boolean> {
        // return new 
        let exists = await DiskFileManager.isExists(p)
        if (exists == false) {
            return true
        }
        let names = p.split("/")
        fs.renameSync(p, `${destination}${names[names.length - 2]}/`)
        return true
    }

    static async move(p: string, destination: string): Promise<boolean> {
        // return new 
        if (p.endsWith("/"))
            return DiskFileManager.moveFolder(p, destination)

        fs.renameSync(p, destination + path.basename(p))
        return true
    }

    static async copyFolder(p: string, destination: string): Promise<string> {
        let exists = await DiskFileManager.isExists(p)
        if (exists == false) {
            return ""
        }
        return new Promise((resolve, reject) => {
            exec(`cp -r ${p} ${destination}`, (err, stdout, stderr) => {
                if (err) {
                    console.log("reject")
                    reject()
                }
                else
                    resolve("")
            })
        })

    }

    static async copy(p: string, destination: string): Promise<string> {
        if (p.endsWith("/")) {
            return DiskFileManager.copyFolder(p, destination)
        }
        const newName = destination + path.basename(p)
        fs.copyFileSync(p, destination + path.basename(p))
        return newName
    }

    static async mkdir(path: string, name: string) {
        return new Promise((resolve, reject) => {
            rimraf(path + name, function (err: any) {
                fs.mkdir(path + name, function (err) {
                    if (err) {
                        // console.log("errk")
                        return reject(err)
                    }
                    return resolve({})
                })
            })

        })
    }

    static async scanDir(path: string, id: string = "", removeThumbnails?: boolean) {
        try {
            var files: string[] = await new Promise(function (resolve, reject) {
                fs.readdir(path, function (err, files) {
                    if (err) {
                        return reject(err)
                    }
                    return resolve(files)

                })
            })
            var result: any[] = []
            for (let i = 0; i < files.length; i++) {
                if (removeThumbnails == true && files[i].includes("---thumbnail")) {
                    continue
                }
                if (await this.isFolder(path + "/" + files[i])) {
                    result.push({
                        checked: true,
                        type: "dir",
                        name: files[i],
                        id: id + files[i] + "/",
                        children: await this.scanDir(path + "/" + files[i], id + files[i] + "/")
                    })
                }
                else {
                    result.push({
                        checked: true,
                        type: "file",
                        name: files[i],
                        id: id + files[i],
                    })
                }
            }
        } catch (error) {
            throw error
        }
        return result
    }

    static async isFolder(path: string) {
        return new Promise((resolve, reject) => {
            fs.lstat(path, function (err, stats) {
                if (err) {
                    // console.log(err)
                    return reject(err)
                }
                return resolve(stats.isDirectory())
            })
        })
    }

    // responseType: 'stream',
    static async getFilesSize(paths: string[]) {
        var totalSize = 0
        try {
            var stat = promisify(fs.stat)
            for (let i = 0; i < paths.length; i++) {
                if (await this.isFolder(paths[i])) {
                    totalSize += await this.getFolderSize(paths[i])
                }
                else {
                    var stats = await stat(paths[i])
                    totalSize += stats.size
                }

            }
        } catch (error) {
            throw error
        }
        return totalSize
    }

    static async getFolderSize(folder: string) {
        var readdir = promisify(fs.readdir)
        var stat = promisify(fs.stat)
        var totalSize = 0
        try {
            var files = await readdir(folder)
            for (let i = 0; i < files.length; i++) {
                var p = folder.endsWith("/") ? folder + files[i] : folder + "/" + files[i]
                if (await this.isFolder(folder + "/" + files[i])) {
                    totalSize += await this.getFolderSize(p)
                }
                else {
                    var stats = await stat(p)
                    totalSize += stats.size
                }

            }
        } catch (error) {
            throw error
        }
        return totalSize
    }

    static getCommands(files: any[], id: string = "") {
        var cmd: any[] = []
        for (let i = 0; i < files.length; i++) {
            if (files[i].type == "dir") {
                cmd.push({
                    type: "dir",
                    directory: id,
                    name: files[i].name
                })
                cmd.push(
                    ... this.getCommands(files[i].children, files[i].id)
                )
            }
            else {
                cmd.push({
                    type: "file",
                    directory: id,
                    path: files[i].id
                })
            }
        }
        return cmd
    }

    static async downloadFiles(files: string[], directory?: string) {
        for (let i = 0; i < files.length; i++) {
            await this.downloadFile(files[i], directory)
        }

    }

    static async downloadFile(fileUrl: string, directory?: string): Promise<string> {
        try {
            if (fileUrl.includes("?")) {
                fileUrl = fileUrl.split("?")[0]
            }
            var p = directory != undefined ? directory + path.basename(fileUrl) : "src/uploads/tmp/" + path.basename(fileUrl)



            var writer = fs.createWriteStream(p)
            var response = await axios({
                method: 'get',
                url: fileUrl,
                responseType: 'stream',
                proxy: false,
                timeout: 10000
            })
            return new Promise((resolve, reject) => {
                response.data.pipe(writer);
                var er: any = null;
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
                        reject(er)
                    }
                });
            });
        } catch (error) {
            
            throw error
        }

        //ensure that the user can call `then()` only when the file has
        //been downloaded entirely.


    }

    static async toBase64(source: string) {
        try {
            return await new Promise((resolve, reject) => {
                fs.readFile(source, function (err, data) {
                    if (err) {
                        reject(err)
                        return
                    }
                    resolve(data.toString("base64"))
                });
            })
        } catch (error) {

        }
    }

    static async saveBase64(image: string): Promise<string> {
        return new Promise((resolve, reject) => {

            if (image.startsWith("data:image/jpeg")) {
                var base64Data = image.replace(/^data:image\/jpeg;base64,/, "");
                var fileName = `src/uploads/tmp/screen_${Date.now()}.jpeg`
            }
            else {
                var base64Data = image.replace(/^data:image\/png;base64,/, "");
                var fileName = `src/uploads/tmp/screen_${Date.now()}.png`
            }
            fs.writeFile(fileName, base64Data, 'base64', function (err) {
                if (err)
                    return reject(err)
                resolve(fileName)
            });
        })
    }

    // static zipFolder(folder: string, target: string) {
    //    exec({} , )
    // }

}

export interface CDN_File_Path {
    path: string,
    destination: string,
    showState?: boolean
}






interface ConfigOptions {
    type: "objectStorage" | "ftp",
    config: any,
    hostUrl: string,
    id: string,
    backup?: boolean
}

async function addCdnLog(options: CdnLog_I) {
    try {
        await new CdnLogRepository().insert({
            cdn: options.cdn,
            type: options.type,
            files: options.files,
            operation: options.operation,
            info: options.info
        } as unknown as CdnLog)
    } catch (error) {
        // // console.log("error")
        return
        throw error
    }
}


function addFilesInfo(filesInfo: any, files: string[]) {
    for (let i = 0; i < files.length; i++) {
        var type = path.extname(files[i]).substring(1)
        if (filesInfo[type]) {
            try {
                filesInfo[type].count += 1
            } catch (error) { }

            continue
        }
        filesInfo[type] = {
            count: 1,
            mimetype: filesType[type] || type
        }
    }
    return filesInfo
}


function deleteFilesInfo(filesInfo: any, files: string[]) {
    for (let i = 0; i < files.length; i++) {
        var type = path.extname(files[i]).substring(1)
        if (filesInfo[type] && filesInfo[type].count && filesInfo[type].count > 0) {
            try {
                filesInfo[type].count -= 1
            } catch (error) { }
        }

    }
    return filesInfo
}

async function UpdateCdnConfig(cdnMg: CDN_Manager, query: any, files?: string[]) {
    try {
        let cdn = await cdnMg.fileManagerRepo.findByIdAndUpdate(cdnMg.CDN_id as string
            , query)
        if (cdn?.isInternal == true) {
            await cdnMg.fileManagerRepo.updateMany({
                isInternal: true,
                _id: {
                    $ne: cdn._id
                }
            }, query)
        }

        if (files) {
            try {
                var fileManager = await cdnMg.fileManagerRepo.findById(cdnMg.CDN_id as string)
                if (fileManager != null) {
                    var info: any = fileManager.filesInfo || {}

                    if (query['$inc']?.usedSize > 0) {
                        info = addFilesInfo(info, files)
                    }
                    else {
                        info = deleteFilesInfo(info, files)
                    }
                    await cdnMg.fileManagerRepo.updateOne({
                        _id: cdnMg.CDN_id
                    }, {
                        $set: {
                            filesInfo: info
                        }
                    })
                }
            } catch (error) {

            }

        }
    } catch (error) {

    }
}



function processCDN_Upload(target: any,
    propertyKey: string,
    propertyDescriptor: PropertyDescriptor
): PropertyDescriptor {
    propertyDescriptor = propertyDescriptor;
    const originalMethod = propertyDescriptor.value;


    propertyDescriptor.value = async function (...args: any[]) {
        const self = this as CDN_Manager;

        try {
            if (typeof args[0] == 'string') {
                var paths = [args[0]]
            }
            else {
                var paths = args[0] as string[]
            }
            try {

                var totalSize = await DiskFileManager.getFilesSize(paths.map((elem: any, i: any) => {
                    return elem.path
                }))
                totalSize = Math.round(totalSize / Math.pow(1024, 2) * 100) / 100
            } catch (error) {
                totalSize = 0
            }
            var result = await originalMethod.apply(this, args);
            var newFiles: string[] = []
            try {
                if (typeof result == "string") {
                    var newFiles = [result.substring(self.cdn?.baseDir?.length || 9, result.length)]
                }
                else
                    newFiles = result.map((elem: string, i: any) => {
                        return elem.substring(self.cdn?.baseDir?.length || 9, elem.length)
                    })
            } catch (error) {
                // // console.log(error)
                // // console.log("error", error, result)

            }

            try {
                await UpdateCdnConfig(self, {
                    $inc: {
                        usedSize: totalSize
                    }
                }, newFiles)
                await addCdnLog({
                    cdn: self.CDN_id as string,
                    files: newFiles,
                    operation: 'upload',
                    type: self.storageType as string,
                    info: {}
                })
            } catch (error) {
                // console.log(error)
                // throw error
                // // console.log(error)
            }


            return result;
        } catch (err) {
            // console.log(err)
            throw err;
        }
    };
    return propertyDescriptor;
}


function processCDN_Direct_Download(target: any,
    propertyKey: string,
    propertyDescriptor: PropertyDescriptor
): PropertyDescriptor {
    propertyDescriptor = propertyDescriptor;
    const originalMethod = propertyDescriptor.value;


    propertyDescriptor.value = async function (...args: any[]) {
        const self = this as CDN_Manager;

        try {

            var result = await originalMethod.apply(this, args);
            let interval = setInterval(async () => {
                let d = await cache.get(result.hash)
                if (d != null) {
                    // // console.log(JSON.parse(d))
                    let status = JSON.parse(d)

                    if (status.p?.includes("100")) {
                        // co
                        clearInterval(interval)
                        await UpdateCdnConfig(self, {
                            $inc: {
                                usedSize: (status.totalSize / (1024 * 1024))
                            }
                        }, [result.url])
                        await addCdnLog({
                            cdn: self.CDN_id as string,
                            files: result.url,
                            operation: 'directDownload',
                            type: self.storageType as string,
                            info: {}
                        })
                    }

                }
                else {
                    clearInterval(interval)
                }
            }, 500)


            return result;
        } catch (error) {
            throw error
        }





    };
    return propertyDescriptor;
}

function processCDN_Upload_Width_State(target: any,
    propertyKey: string,
    propertyDescriptor: PropertyDescriptor
): PropertyDescriptor {
    propertyDescriptor = propertyDescriptor;
    const originalMethod = propertyDescriptor.value;

    propertyDescriptor.value = async function (...args: any[]) {

        // // console.log("processCDN_Upload_Width_State")
        const self = this as CDN_Manager;

        try {

            var f = await originalMethod.apply(this, args);
            // // console.log("result" ,result)
            try {

                var result = f.split("$$$")
                let url = result[0]
                let hash = result[1]
                let interval = setInterval(async () => {
                    let d = await cache.get(hash)
                    if (d != null) {
                        try {
                            var status = JSON.parse(d)
                        } catch (error) {

                        }
                        if (d.toString() == "100" || d.toString() == "100.00" || status?.p.includes("100")) {

                            // console.log("status", status)

                            clearInterval(interval)
                            await UpdateCdnConfig(self, {
                                $inc: {
                                    usedSize: (status.totalSize / (1024 * 1024))
                                }
                            }, [url])
                            await addCdnLog({
                                cdn: self.CDN_id as string,
                                files: url,
                                operation: 'uploadWhith',
                                type: self.storageType as string,
                                info: {}
                            })
                        }

                    }
                    else {
                        clearInterval(interval)
                    }
                }, 500)
            } catch (error) {
                // console.log("dd")
            }

            // // console.log("f", f)

            return f;
        } catch (error) {
            throw error
        }





    };
    return propertyDescriptor;
}

function processCDN_Append(target: any,
    propertyKey: string,
    propertyDescriptor: PropertyDescriptor
): PropertyDescriptor {
    propertyDescriptor = propertyDescriptor;
    const originalMethod = propertyDescriptor.value;


    propertyDescriptor.value = async function (...args: any[]) {
        const self = this as CDN_Manager;

        try {
            if (typeof args[0] == 'string') {
                var paths = [args[0]]
            }
            else {
                var paths = args[0] as string[]
            }
            try {
                var totalSize = await DiskFileManager.getFilesSize(paths)
                totalSize = Math.round(totalSize / Math.pow(1024, 2) * 100) / 100
            } catch (error) {
                // console.log(error)
                totalSize = 0
            }
            var result = await originalMethod.apply(this, args);
            try {
                // // console.log(result)
                var newFiles = [result.substring(self.cdn?.baseDir?.length || 9, result.length)]
                // })
                // // console.log("newFiles", newFiles, result)
            } catch (error) {
                // console.log("err", error, result)
                newFiles = []
            }

            try {
                await UpdateCdnConfig(self, {
                    $inc: {
                        usedSize: totalSize
                    }
                }, args[2]?.isFirst ? newFiles : [])
                // if(args[2]?.isFirst ){
                await addCdnLog({
                    cdn: self.CDN_id as string,
                    files: newFiles,
                    operation: 'append',
                    type: self.storageType as string,
                    info: {}
                })
                // }


            } catch (error) {
                // console.log(error)
                // throw error
                // // console.log(error)
            }


            return result;
        } catch (err) {
            // console.log(err)
            throw err;
        }
    };
    return propertyDescriptor;
}


function processCDN_Directory(target: any,
    propertyKey: string,
    propertyDescriptor: PropertyDescriptor
): PropertyDescriptor {
    propertyDescriptor = propertyDescriptor;
    const originalMethod = propertyDescriptor.value;


    propertyDescriptor.value = async function (...args: any[]) {
        const self = this as CDN_Manager;

        try {
            var result = await originalMethod.apply(this, args);

            if (typeof args[0] == 'string') {
                var paths = [args[0]]
            }
            else {
                var paths = args[0] as string[]
            }

            try {


                await addCdnLog({
                    cdn: self.CDN_id as string,
                    files: [args[0] + args[1]],
                    operation: 'createDirectory',
                    type: self.storageType as string,
                    info: {}
                })
            } catch (error) {
                // console.log(error)
                // throw error
                // // console.log(error)
            }


            return result;
        } catch (err) {
            throw err;
        }
    };
    return propertyDescriptor;
}

function processCDN_Delete(target: any,
    propertyKey: string,
    propertyDescriptor: PropertyDescriptor
): PropertyDescriptor {
    propertyDescriptor = propertyDescriptor;
    const originalMethod = propertyDescriptor.value;


    propertyDescriptor.value = async function (...args: any[]) {
        const self = this as CDN_Manager;

        try {
            var folderPath = args[0]
            var info: any = {}
            if (args[1] != false) {
                info['moveToHidden'] = true
                var result = await originalMethod.apply(this, args);
                await addCdnLog({
                    cdn: self.CDN_id as string,
                    files: folderPath,
                    operation: 'delete',
                    type: self.storageType as string,
                    info
                })
                return result

            }
            var totalSize = await self.cdn?.getFilesSize(folderPath) as number
            var totalFiles = await self.cdn?.getAllFiles(folderPath)



            totalSize = Math.round(totalSize / Math.pow(1024, 2) * 100) / 100

            var allFiles = []

            var result = await originalMethod.apply(this, args);



            try {
                await UpdateCdnConfig(self, {
                    $inc: {
                        usedSize: -totalSize
                    }
                }, totalFiles)

                await addCdnLog({
                    cdn: self.CDN_id as string,
                    files: folderPath,
                    operation: 'delete',
                    type: self.storageType as string,
                    info: {}
                })
            } catch (error) {

                // // console.log(error)
            }
            return result;
        } catch (err) {
            // // console.log(err)
            throw err;
        }
    };
    return propertyDescriptor;
}


function processCDN_Copy_Move(target: any,
    propertyKey: string,
    propertyDescriptor: PropertyDescriptor
): PropertyDescriptor {
    propertyDescriptor = propertyDescriptor;
    const originalMethod = propertyDescriptor.value;


    propertyDescriptor.value = async function (...args: any[]) {
        const self = this as CDN_Manager;

        try {
            var folderPath = args[0]


            var totalSize = propertyKey != 'move' ? await self.cdn?.getFilesSize(folderPath) as number : 0
            var totalfiles = propertyKey != 'move' ? await self.cdn?.getAllFiles(folderPath) as string[] : []

            totalSize = Math.round(totalSize / Math.pow(1024, 2) * 100) / 100
            var currentCDN = self.CDN_id
            var result = await originalMethod.apply(this, args);

            var info: any = {}

            var operation
            if (propertyKey == 'copy') {
                operation = 'copy'
                info['directory'] = args[1]
                await UpdateCdnConfig(self, {
                    $inc: {
                        usedSize: totalSize
                    }
                }, totalfiles)
            }
            else if (propertyKey == 'move') {
                operation = 'move'
                info['directory'] = args[1]
            }
            else if (propertyKey == 'copyToOther') {
                operation = 'copyToOther'
                info['directory'] = args[2]
                info['toCdn'] = args[1]

                await UpdateCdnConfig(self, {
                    $inc: {
                        usedSize: totalSize
                    }
                }, totalfiles)
                var cdn_id = self.CDN_id
                // self.CDN_id = currentCDN
            }
            else if (propertyKey == 'restoreToOther') {
                operation = 'restoreToOther'
                info['directory'] = args[2]
                info['toCdn'] = args[1]

                await UpdateCdnConfig(self, {
                    $inc: {
                        usedSize: totalSize
                    }
                }, totalfiles)
                self.CDN_id = currentCDN
                await self.init(true)
                await UpdateCdnConfig(self, {
                    $inc: {
                        usedSize: -totalSize
                    }
                }, totalfiles)
                // self.CDN_id = currentCDN
            }
            else {
                operation = 'moveToOther'
                info['directory'] = args[2]
                info['toCdn'] = args[1]

                await UpdateCdnConfig(self, {
                    $inc: {
                        usedSize: totalSize
                    }
                }, totalfiles)
                self.CDN_id = currentCDN
                await self.init(true)
                await UpdateCdnConfig(self, {
                    $inc: {
                        usedSize: -totalSize
                    }
                }, totalfiles)
            }

            try {
                await addCdnLog({
                    cdn: cdn_id || self.CDN_id as string,
                    files: folderPath,
                    operation,
                    type: self.storageType as string,
                    info
                })
            } catch (error) {
                // throw error
                // // console.log(error)
            }
            return result;
        } catch (err) {
            // // console.log(err)
            throw err;
        }
    };
    return propertyDescriptor;
}


function processCDN_Zip(target: any,
    propertyKey: string,
    propertyDescriptor: PropertyDescriptor
): PropertyDescriptor {
    propertyDescriptor = propertyDescriptor;
    const originalMethod = propertyDescriptor.value;


    propertyDescriptor.value = async function (...args: any[]) {
        const self = this as CDN_Manager;

        try {
            var files = args[0]



            var result = await originalMethod.apply(this, args);
            try {
                await UpdateCdnConfig(self, {
                    $inc: {
                        usedSize: Math.round(result[1] / Math.pow(1024, 2) * 100) / 100
                    }
                }, [result[0].substring(self.cdn?.baseDir.length || 0, result[0].length)])

                await addCdnLog({
                    cdn: self.CDN_id as string,
                    files: [result[0].substring(self.cdn?.baseDir.length || 0, result[0].length)],
                    operation: "zip",
                    type: self.storageType as string,
                    info: {
                        files
                    }
                })

            } catch (error) {
                // throw error
                // // console.log(error)
            }
            return result;
        } catch (err) {
            // // console.log(err)
            throw err;
        }
    };
    return propertyDescriptor;
}

function processCDN_UnZip(target: any,
    propertyKey: string,
    propertyDescriptor: PropertyDescriptor
): PropertyDescriptor {
    propertyDescriptor = propertyDescriptor;
    const originalMethod = propertyDescriptor.value;


    propertyDescriptor.value = async function (...args: any[]) {
        const self = this as CDN_Manager;


        try {
            var file = args[0]
            var directory = args[1]
            var result = await originalMethod.apply(this, args);
            // // console.log("result", result, args)
            var newFiles = result[0].map((elem: string, i: any) => {
                return elem.substring(self.cdn?.baseDir.length || 0, elem.length)
            })
            try {

                await UpdateCdnConfig(self, {
                    $inc: {
                        usedSize: Math.round(result[1] / Math.pow(1024, 2) * 100) / 100
                    }
                }, newFiles)

                await addCdnLog({
                    cdn: self.CDN_id as string,
                    files: newFiles,
                    operation: "unzip",
                    type: self.storageType as string,
                    info: {
                        file,
                        directory
                    }
                })
            } catch (error) {
                // throw error
                // // console.log(error)
            }
            return result;
        } catch (err) {
            // // console.log(err)
            throw err;
        }
    };
    return propertyDescriptor;
}

const backupFileRepo = new BackupFileRepository()


export class FileManagerBackup {

    static uploadToBackup(target: any,
        propertyKey: string,
        propertyDescriptor: PropertyDescriptor
    ): PropertyDescriptor {
        const originalMethod = propertyDescriptor.value;


        propertyDescriptor.value = async function (...args: any[]) {

            const self = this as CDN_Manager;
            var backUpRepo = new BackupRepository()
            var backupService = new BackUpService()
            try {
                var result = await originalMethod.apply(this, args);
            } catch (error) {
                throw error
            }

            var backups = await fileManagerConfigRepo.findAll({
                mirrorCDN: self.CDN_id,
                status: true,
                isBackup: true
            })
            for (let i = 0; i < backups.length; i++) {
                try {
                    self.initFromConfig(backups[i] as any)
                    await originalMethod.apply(self, args)

                } catch (error) {

                }
            }
            return result
        };
        return propertyDescriptor;
    }


    static doToMirror(target: any,
        propertyKey: string,
        propertyDescriptor: PropertyDescriptor
    ): PropertyDescriptor {
        const originalMethod = propertyDescriptor.value;


        propertyDescriptor.value = async function (...args: any[]) {
            const self = this as CDN_Manager;
            try {
                var result = await originalMethod.apply(this, args);
            } catch (error) {
                throw error
            }
            let backups = await fileManagerConfigRepo.findAll({
                mirrorCDN: self.CDN_id,
                isBackup: true,
                status: true
            })

            // // console.log(backups, self.config, self)

            let currentConf = { ...self.config }
            for (let i = 0; i < backups.length; i++) {
                try {
                    let backup = await fileManagerConfigRepo.findById(backups[i]._id)
                    // // console.log( " backup" , backup)

                    self.initFromConfig(Object.assign(
                        backup as any, {
                        id: backup?._id
                    }
                    ))
                    await originalMethod.apply(self, args)

                } catch (error) {
                    // console.log(error)
                }
            }
            if (currentConf._doc) {
                currentConf = currentConf._doc
            }
            if (self.config != undefined) {
                self.initFromConfig(Object.assign(
                    currentConf as any, {
                    id: currentConf?.id
                }
                ))
            }

            if(propertyKey == "upload" || propertyKey ==  "uploadWithState"){
                try {
                    await DiskFileManager.removeFile(args[0])
                } catch (error) {
                    
                }
            }
            

            return result
        };
        return propertyDescriptor;
    }


    static async getValidFolderPath(cdn: CDN_Manager, directory: string, count: number = 0): Promise<string> {
        try {
            let paths = directory.split("/")
            if (count > 0) {
                paths[paths.length - 2] = paths[paths.length - 2] + count.toString()
            }
            let finalDirectory = paths.join("/")

            let isExists: boolean[] = (await cdn.isPathExists([finalDirectory]) as boolean[])
            if (isExists[0] != true) {
                paths.pop()
                let direName = paths.pop()
                await cdn.createDirectory(paths.join("/") + "/", direName as string)
                return finalDirectory
            }
            return await FileManagerBackup.getValidFolderPath(cdn, directory, count + 1)

        } catch (error) {
            throw error
        }
    }


    static findObjectData(
        files: string[],
        objectInfo: any
    ) {
        let endSign = ""
        if (objectInfo.type == "dir") {
            endSign = "/"
        }
        for (let i = 0; i < files.length; i++) {
            if (files[i].endsWith(`${objectInfo.name}${endSign}`)) {
                return files[i]
            }
        }
    }



    static doToBackup(target: any,
        propertyKey: string,
        propertyDescriptor: PropertyDescriptor
    ): PropertyDescriptor {
        const originalMethod = propertyDescriptor.value;


        propertyDescriptor.value = async function (...args: any[]) {
            const self = this as CDN_Manager;

            let backups = await fileManagerConfigRepo.findAll({
                backups: self.CDN_id,
                isBackup: true,
                status: true
            })



            let currentConf = { ...self.config }
            let dir = ""
            if (backups.length > 0) {
                let dirName = Date.now()
                dir = `temp/${dirName}/`
                if (args[1] == false) {
                    await self.cdn?.downloadFiles(args[0], {
                        folder: dir,
                        cacheStr: args[2]
                    })
                }
            }
            var cdn
            try {
                var result = await originalMethod.apply(this, args);
                if (self.CDN_id != undefined)
                    cdn = await fileManagerConfigRepo.findById(self.CDN_id)
            } catch (error) {
                if (dir != "") {
                    DiskFileManager.removeFolder(dir)
                }
                throw error
            }


            for (let i = 0; i < backups.length; i++) {
                try {

                    const backCDN = new CDN_Manager(
                        backups[i]._id
                    )
                    await backCDN.init()
                    if (dir != "") {
                        let paths = []
                        let backupBase = `backup/${cdn?.title || "data"}/`
                        await backCDN.checkDirectoryIsExists(backupBase)

                        let files = await DiskFileManager.scanDir(dir, "", true)
                        let results = []
                        for (let j = 0; j < files.length; j++) {
                            if (files[j].type == "dir") {

                                let dirPath = backupBase + files[j].name + "/"
                                let finalDir = await FileManagerBackup.getValidFolderPath(backCDN, dirPath)
                                await backCDN.cdn?.uploadFolder(dir + files[j].name + "/", finalDir)

                                results.push({
                                    file: FileManagerBackup.findObjectData(args[0], files[j]),
                                    backPath: finalDir
                                })
                            }
                            else {
                                let fileDest = backupBase + files[j].name
                                let finalFile = await backCDN.cdn?.upload(dir + files[j].name, fileDest, {
                                    rename: false
                                })

                                results.push({
                                    file: FileManagerBackup.findObjectData(args[0], files[j]),
                                    backPath: finalFile?.replace(backups[i].hostUrl, "")
                                })

                            }
                        }

                        for (let j = 0; j < results.length; j++) {
                            await backupFileRepo.insert({
                                backCDN: backups[i]._id,
                                cdn: cdn?._id,
                                backFile: results[j].backPath,
                                cdnFile: results[j].file
                            } as any)
                        }
                    }

                } catch (error) {
                    console.log(error)

                }
            }


            if (currentConf._doc) {
                currentConf = currentConf._doc
            }
            if (self.config != undefined) {
                self.initFromConfig(Object.assign(
                    currentConf as any, {
                    id: currentConf?.id
                }
                ))
            }
            try {
                if (dir != "") {
                    DiskFileManager.removeFolder(dir)
                }
            } catch (error) {

            }

            return result
        };
        return propertyDescriptor;
    }


    static copyfromOther(target: any,
        propertyKey: string,
        propertyDescriptor: PropertyDescriptor
    ): PropertyDescriptor {
        const originalMethod = propertyDescriptor.value;


        propertyDescriptor.value = async function (...args: any[]) {

            const self = this as CDN_Manager;
            var backUpRepo = new BackupRepository()
            var backupService = new BackUpService()
            try {
                var cdnId = self.CDN_id
                var result = await originalMethod.apply(self, args);

            } catch (error) {
                throw error
            }

            try {
                var backups = await fileManagerConfigRepo.findAll({
                    isBackup: true,
                    mirrorCDN: self.CDN_id,
                    status: true
                })
            } catch (error) {
                return result
            }
            if (backups.length == 0) {
                return result

            }
            self.CDN_id = cdnId
            await self.init(true)


            for (let i = 0; i < backups.length; i++) {
                try {
                    self.copyToOther(args[0], backups[i], args[2]).then((result) => {

                    }).catch(err => console.log(err))


                } catch (error) {

                }
            }
            return result
        };
        return propertyDescriptor;
    }

    static movefromOther(target: any,
        propertyKey: string,
        propertyDescriptor: PropertyDescriptor
    ): PropertyDescriptor {
        const originalMethod = propertyDescriptor.value;

        propertyDescriptor.value = async function (...args: any[]) {

            const self = this as CDN_Manager;
            var backUpRepo = new BackupRepository()
            var backupService = new BackUpService()


            try {
                var cdnId = self.CDN_id
                var dirPath = await originalMethod.apply(self, args);

            } catch (error) {
                // console.log(error)
                throw error
            }

            try {
                var backups = await fileManagerConfigRepo.findAll({
                    mirrorCDN: args[1],
                    status: true,
                    isBackup: true
                })
            } catch (error) {
                try {
                    DiskFileManager.removeFolder(dirPath)
                } catch (error) {

                }
                return dirPath
            }
            if (backups.length == 0) {
                try {
                    DiskFileManager.removeFolder(dirPath)
                } catch (error) {

                }
                return dirPath

            }
            self.CDN_id = cdnId
            await self.init(true)

            var allinfo = DiskFileManager.getCommands(await DiskFileManager.scanDir(dirPath)).map((elem: any, i: any) => {
                elem.directory = args[2] + elem.directory
                // elem.path = elem.path ? dirPath + "/" + elem.path : undefined
                if (elem.type == "file") {
                    elem.destination = elem.directory + path.basename(elem.path)

                    elem.path = dirPath + "/" + elem.path
                }
                return elem
            })

            var dirCmd = allinfo.filter((value: any, i: any) => {
                return value.type == "dir"
            })

            var fileCmd = allinfo.filter((value: any, i: any) => {
                return value.type == "file"
            })


            for (let i = 0; i < backups.length; i++) {
                try {
                    self.initFromConfig(backups[i] as any)
                    // new Promise(async (resolve, reject) => {
                    for (let j = 0; j < dirCmd.length; j++) {
                        await self.cdn?.craeteDirectory(dirCmd[j].directory, dirCmd[j].name, {})
                    }
                    await self.cdn?.uploadMany(fileCmd)
                    // })


                } catch (error) {

                }
            }
            try {
                DiskFileManager.removeFolder(dirPath)
            } catch (error) {

            }
            return dirPath
        };
        return propertyDescriptor;
    }


}


export default class CDN_Manager {
    cdn?: FTP | S3
    fileManagerRepo: FileManagerConfigRepository
    cdnOperationRepo: CDN_OperationRepository
    cdn_LockedPathRepository: CDN_LockedPathRepository

    type?: string
    storageType?: 'cdn' | 'backup'
    config?: any
    CDN_id?: string
    // backupFileRepo : BackupFileRepository
    constructor(CDN_id?: string) {
        this.CDN_id = CDN_id
        this.fileManagerRepo = new FileManagerConfigRepository()
        this.cdnOperationRepo = new CDN_OperationRepository()
        this.cdn_LockedPathRepository = new CDN_LockedPathRepository()
    }


    static addFilesToLockedPaths(index: number) {
        return (target: any,
            propertyKey: string,
            propertyDescriptor: PropertyDescriptor
        ): PropertyDescriptor => {
            const originalMethod = propertyDescriptor.value;


            propertyDescriptor.value = async function (...args: any[]) {
                const self = this as CDN_Manager;
                let files = args[index]
                let type = typeof files
                try {
                    // self.cdn_LockedPathRepository.

                    if (type == "string") {
                        await self.cdn_LockedPathRepository.addPath(self.CDN_id as string, files)
                    }
                    else {
                        await self.cdn_LockedPathRepository.addPaths(self.CDN_id as string, files)
                    }

                    var result = await originalMethod.apply(this, args);
                } catch (error) {
                    if (type == "string") {
                        await self.cdn_LockedPathRepository.deletePath(self.CDN_id as string, files)
                    }
                    else {
                        await self.cdn_LockedPathRepository.deletePaths(self.CDN_id as string, files)
                    }
                    throw error
                }

                if (type == "string") {
                    await self.cdn_LockedPathRepository.deletePath(self.CDN_id as string, files)
                }
                else {
                    await self.cdn_LockedPathRepository.deletePaths(self.CDN_id as string, files)
                }

                return result
            };


            return propertyDescriptor;
        }
    }


    static addRenameLockedPaths(target: any,
        propertyKey: string,
        propertyDescriptor: PropertyDescriptor
    ): PropertyDescriptor {
        const originalMethod = propertyDescriptor.value;


        propertyDescriptor.value = async function (...args: any[]) {
            const self = this as CDN_Manager;
            let newFile = ""

            let file: string = args[0]
            let newName = args[1]
            let code = args[2].cacheStr


            if (file.endsWith("/") || !file.includes(".")) {
                let filePaths = file.split("/")
                filePaths[filePaths.length - 1] = newName
                newFile = filePaths.join("/") + "/"
                self.cdnOperationRepo.updateOne({
                    code
                }, {
                    $set: {
                        name: newFile
                    }
                })
            }


            try {
                await self.cdn_LockedPathRepository.addPath(self.CDN_id as string, newFile)
                var result = await originalMethod.apply(this, args);


            } catch (error) {
                await self.cdn_LockedPathRepository.deletePath(self.CDN_id as string, newFile)

                throw error
            }

            await self.cdn_LockedPathRepository.deletePath(self.CDN_id as string, newFile)


            return result
        };


        return propertyDescriptor;
    }

    static addCrossLockedPaths(target: any,
        propertyKey: string,
        propertyDescriptor: PropertyDescriptor
    ): PropertyDescriptor {
        const originalMethod = propertyDescriptor.value;



        propertyDescriptor.value = async function (...args: any[]) {
            const self = this as CDN_Manager;


            let cdn = args[1]
            let directory = args[2]
            if (typeof cdn != "string")
                cdn = cdn.id || cdn._id
            let cdn_id = self.CDN_id
            try {
                await self.cdn_LockedPathRepository.addPath(cdn, directory)
                var result = await originalMethod.apply(this, args);


            } catch (error) {
                await self.cdn_LockedPathRepository.deletePath(cdn, directory)
                await self.cdn_LockedPathRepository.deletePaths(cdn_id as string, args[0])

                
                throw error
            }


            await self.cdn_LockedPathRepository.deletePath(cdn, directory)
            await self.cdn_LockedPathRepository.deletePaths(cdn_id as string, args[0])


            return result
        };


        return propertyDescriptor;
    }

    async makeThumbNail(path: string) {
        // await this.init()
        try {
            let dires = path.split("/")
            // let baseName =
            // // // console.log("config" , this.config.hostUrl)
            // let baseName = path.split
            this.cdn?.makeThumbNail(this.config.hostUrl + path, path)

        } catch (error) {

        }
    }

    async init(change: boolean = false) {
        if (this.cdn != undefined && !change) {
            return
        }

        if (this.CDN_id) {

            try {
                var config = await this.fileManagerRepo.findById(this.CDN_id, {
                    fromDb: true
                })
            } catch (error) {
                throw error
            }
            if (config == null) {
                throw new Error("کانفیگ یافت نشد")
            }
        }


        else {
            try {
                var config = await this.fileManagerRepo.getDefault()
            } catch (error) {
                throw error
            }
            if (config == null) {
                throw new Error("کانفیگ یافت نشد")
            }
            // // console.log(config)
            this.config = { ...config }
            this.CDN_id = config._id
        }

        if (config.type == FileManagerType.ftp) {
            this.cdn = new FTP(
                config.config.url,
                config.config.user,
                config.config.pass,
                config.hostUrl,
                config._id,
            )
        }
        else {
            this.cdn = new S3(
                config.config.accessKey,
                config.config.secretKey,
                config.config.serviceUrl,
                config.config.bucket,
                config.hostUrl,
                config._id
            )
        }
        this.type = config.type
        this.storageType = 'cdn'
    }

    async getCDN(id: string) {
        try {
            var config = await this.fileManagerRepo.findById(id, {
                fromDb: true
            })
        } catch (error) {
            throw error
        }
        if (config == null) {
            throw new Error("کانفیگ یافت نشد")
        }

        if (config.type == FileManagerType.ftp) {
            return new FTP(
                config.config.url,
                config.config.user,
                config.config.pass,
                config.hostUrl,
                config._id,
            )
        }
        else {
            return new S3(
                config.config.accessKey,
                config.config.secretKey,
                config.config.serviceUrl,
                config.config.bucket,
                config.hostUrl,
                config._id
            )
        }
    }

    initFromConfig(config: ConfigOptions) {

        this.config = config
        this.storageType = config.backup ? 'backup' : 'cdn'

        this.CDN_id = config.id
        // console.log("config", config)
        this.type = config.type

        if (config.type == FileManagerType.ftp) {
            this.cdn = new FTP(
                config.config.url,
                config.config.user,
                config.config.pass,
                config.hostUrl,
                config.id
            )
        }
        else {
            this.cdn = new S3(
                config.config.accessKey,
                config.config.secretKey,
                config.config.serviceUrl,
                config.config.bucket,

                config.hostUrl,
                config.id
            )
        }
    }

    getConfig() {
        return this.config
    }


    async checkDirectoryIsExists(path: string) {
        try {
            if (path == "")
                return
            // // console.log(path)
            if (path == "/") {
                return
            }
            // // console.log(path)
            var res = await this.cdn?.isPathExists([path]) as boolean[]
            if (res[0]) {
                return
            }
            let paths = path.split("/")
            let current = paths.shift() + "/"
            await this.createDirectories(current, paths)

        } catch (error) {
            // console.log("err", 4255)
            throw error
        }
    }

    async getFile(file: string) {
        return this.cdn?.getFilesSize([file])
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
    @FileManagerBackup.doToMirror
    async createDirectories(current: string, paths: string[]) {

        var res = await this.cdn?.isPathExists([current]) as boolean[]

        if (!res[0]) {
            let ps = current.split("/")
            let path = ""
            let name = ""
            if (ps.length == 2) {
                name = ps[0]
            }
            else {
                ps.pop()
                name = ps.pop() as string
                path = ps.join("/") + "/"
            }
            await this.createDirectory(path, name)
        }
        if (paths.length == 1) {
            return
        }
        current = current + paths.shift() + "/"

        await this.createDirectories(current, paths)

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
    @FileManagerBackup.doToMirror
    @processCDN_Direct_Download
    async drirectDownload(paths: string[], directory: string) {
        try {


            // console.log(paths, directory)
            await this.checkDirectoryIsExists(directory)
            const hach = RandomGenarator.generateHash()
            let data = await this.cdn?.drirectDownload(paths[0], directory, hach)


            return data
        } catch (error) {
            throw error
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
    @FileManagerBackup.doToMirror
    @processCDN_Upload
    async upload(path: string, destinationPath: string, id?: string): Promise<string> {
        // return destinationPath
        try {
            let ps = destinationPath.split("/")
            ps.pop()
            await this.init()

            await this.checkDirectoryIsExists(ps.join("/") + "/")

            return await this.cdn?.upload(path, destinationPath) as string
        } catch (error) {
            // console.log("err up")
            console.log(error)
            throw error
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
    @processCDN_Append
    async append(chunk: string, destinationPath: string, options: Append) {
        try {

            let ps = destinationPath.split("/")
            let name = ps.pop()
            name = name?.toLocaleLowerCase()
            await this.init()
            await this.checkDirectoryIsExists(ps.join("/") + "/")
            if (name)
                ps.push(name)
            destinationPath = ps.join("/")
            let r =  await this.cdn?.append(chunk, destinationPath, options) as string

            if(options.isfinished == true){
                this.uploadAppendVideo(destinationPath)
            }

            return r
        } catch (error) {
            console.log(error)
            throw error
        }
    }


    async uploadAppendVideo(destinationPath : string ){
        // let backCDNs = await cdn
        let backups = await fileManagerConfigRepo.findAll({
            mirrorCDN: this.CDN_id,
            isBackup: true,
            status: true
        })


        // // console.log(backups, self.config, self)

        // let currentConf = { ...this.config }
        for (let i = 0; i < backups.length; i++) {
            try {
                let paths = destinationPath.split("/")
                paths.pop()

                await this.copyToOther([destinationPath], backups[i]._id.toHexString(),paths.join("/")+"/")
              
                // await originalMethod.apply(self, args)


            } catch (error) {
                console.log(error)
            }
                // console.log(error)
        }
    }

    @FileManagerBackup.doToMirror
    @processCDN_Upload_Width_State
    async uploadWithState(path: string, destinationPath: string , removeFile ?: boolean): Promise<string> {
        // return destinationPath
        try {
            let ps = destinationPath.split("/")
            let name = ps.pop()
            name = name?.toLocaleLowerCase()
            await this.init()
            await this.checkDirectoryIsExists(ps.join("/") + "/")
            const hach = RandomGenarator.generateHash()

            if (name)
                ps.push(name)
            destinationPath = ps.join("/")
            let r = await this.cdn?.uploadWithState(path, destinationPath, hach,{
                removeFile
            })

            return r
        } catch (error) {
            // console.log("err", "up")
            throw error
        }
    }


    async isPathExists(paths: string[]) {
        return this.cdn?.isPathExists(paths)
    }



    @FileManagerBackup.doToMirror
    @processCDN_Upload
    async uploadMany(paths: CDN_File_Path[], options?: UploadFiles): Promise<string[]> {

        try {
            await this.init()

            for (let i = 0; i < paths.length; i++) {
                let ps = paths[i].destination.split("/")
                let name = ps.pop()
                await this.init()
                await this.checkDirectoryIsExists(ps.join("/") + "/")
                if (name)
                    ps.push(name)
                paths[i].destination = ps.join("/")
            }


            var result = await this.cdn?.uploadMany(paths, options) as string[]
            return result
        } catch (error) {
            throw error
        }

    }



    async removeFile(path: string) {

    }


    async downloadFile(file: string, dest: string) {
        return this.cdn?.getFile(file, dest)
    }

    @FileManagerBackup.doToMirror
    @processCDN_Delete
    @CDN_Manager.addFilesToLockedPaths(0)
    @FileManagerBackup.doToBackup
    async removeFiles(urls: string[], moveToHidden: boolean = true, code?: string) {
        // // console.log("removeFiles", urls, moveToHidden)
        try {
            // // console.log("cdn", this.cdn)
            let r = await this.cdn?.deleteFiles(urls, {
                moveToHidden,
                cacheStr: code
            })

            try {
                if (code) {
                    let d = await cache.get(code)
                    if (d != null) {
                        var info = JSON.parse(d)
                        // console.log("info", info)
                        info.percentage = 100.00
                        await cache.set(code, JSON.stringify(info))
                    }
                }
            } catch (error) {

            }
            if (code != undefined) {
                this.cdnOperationRepo.updateOne({
                    code,
                    status: "running"
                }, {
                    $set: {
                        status: "successed"
                    }
                })
            }
        } catch (error) {
            if (code != undefined) {

                try {
                    let d = await cache.get(code)
                    if (d != null) {
                        var info = JSON.parse(d)
                        info.failed = true
                        await cache.set(code, JSON.stringify(info))
                    }
                } catch (error) {

                }

                let operation = await this.cdnOperationRepo.findOneAndUpdate({
                    code,
                    status: "running"
                }, {
                    $set: {
                        status: "failed",
                    }
                })
                if (operation != null)
                    this.cdnOperationRepo.updateOne({
                        _id: operation?._id
                    }, {
                        $set: {
                            err: error
                        }
                    })
            }
            throw error
        }

    }

    async findCdnFromUrl(url: string) {
        var l = new URL(url)
        try {
            var config = await this.fileManagerRepo.findOne({
                hostUrl: {
                    $regex: l.hostname
                }
            })
            if (config == null) {
                throw new Error("یافت نشد")
            }
            if (config.type == FileManagerType.ftp) {
                this.cdn = new FTP(
                    config.config.url,
                    config.config.user,
                    config.config.pass,
                    config.hostUrl,
                    config.id
                )
            }
            else {
                this.cdn = new S3(
                    config.config.accessKey,
                    config.config.secretKey,
                    config.config.serviceUrl,
                    config.config.bucket,
                    config.hostUrl,
                    config._id
                )
            }
            this.config = config
        } catch (error) {

        }
    }

    findUrlDirectory(url : string){
        // console.log("url")
        if(this.cdn == undefined)
            return false

        let directory = url.replace(this.cdn?.baseDir , "")
        let dirs = directory.split("/")
        if(dirs.length == 1){
            return ""
        }
        dirs.pop()
        return dirs.join("/")

    }

    async getFiles(path: string, options?: FileView) {
        try {
            return await this.cdn?.getFiles(path, {
                extendFolders: true
            })
        } catch (error) {
            throw error
        }
    }

    async test() {
        try {
            return await this.cdn?.getFiles("", {
                extendFolders: false
            })
        } catch (error) {
            throw error
        }
    }

    async validateToCopy(files: string[], dest: string, id?: string) {
        var temp_cdn = undefined
        if (id) {
            try {
                temp_cdn = await this.getCDN(id)
            } catch (error) {
                throw error
            }
        }

        try {
            let result: any = []
            for (let i = 0; i < files.length; i++) {
                // console.log(this.cdn)
                if (this.cdn?.isFolder(files[i])) {
                    let dires = files[i].split("/")
                    if (files[i].endsWith("/"))
                        var fileName = dires[dires.length - 2]
                    else {
                        var fileName = dires[dires.length - 1]
                    }
                    let isExists = await (temp_cdn || this.cdn)?.isPathExists([dest + fileName + "/"])
                    if (isExists[0]) {

                        let subFiles = await this.getFiles(files[i] as string)

                        let subs = subFiles.map((elem: any) => {
                            if (elem.name) {
                                return files[i] + elem.name
                            }
                            else {
                                return files[i] + elem.prefix
                            }
                        })

                        let info: any = {}

                        info['file'] = files[i]
                        info['sub'] = await this.validateToCopy(subs, dest + fileName + "/")

                        result.push(info)

                    }

                }
                else {
                    let dires = files[i].split("/")
                    let fileName = dires[dires.length - 1]


                    let isExists = await (temp_cdn || this.cdn)?.isPathExists([dest + fileName])
                    if (isExists && isExists[0]) {
                        let info: any = {}
                        info['file'] = files[i]
                        result.push(info)
                    }
                }
            }
            return result
        } catch (error) {
            throw error
        }

    }


    @FileManagerBackup.doToMirror
    // @CDN_Manager.addFilesToLockedPaths(0)
    async restore(p: string, code?: string) {
        try {

            await this.init()
            return await this.cdn?.restore(p, code)

        } catch (error) {
            // console.log("error")
            throw error
        }
    }


    @CDN_Manager.addFilesToLockedPaths(0)
    async restoreMany(files: string[], code: string) {
        try {

            await this.init()
            for (let i = 0; i < files.length; i++) {
                await this.restore(files[i], code)
            }
            this.cdnOperationRepo.updateOne({
                code,
                status: "running"
            }, {
                $set: {
                    status: "successed"
                }
            })
        }
        catch (error) {
            // console.log(error)
            try {
                let d = await cache.get(code)
                if (d != null) {
                    var info = JSON.parse(d)
                    info.failed = true
                    await cache.set(code, JSON.stringify(info))
                }
            } catch (err) {

            }

            let operation = await this.cdnOperationRepo.findOneAndUpdate({
                code,
                status: "running"
            }, {
                $set: {
                    status: "failed",
                }
            })
            if (operation != null)
                this.cdnOperationRepo.updateOne({
                    _id: operation?._id
                }, {
                    $set: {
                        err: error
                    }
                })
            // console.log("ee")
            // throw error
        }

    }


    @FileManagerBackup.doToMirror
    async deleteRecycle() {
        await this.init()
        let files = await this.cdn?.getFiles("recycle_bin/")
        // // console.log(this.CDN_id)
        // // console.log("f" , files)
        if (this.type == "ftp") {
            let toDelete = []
            for (let i = 0; i < files.length; i++) {
                // "e".endsWith
                // console.log(files[i].name.endsWith("."), files[i].type)

                if (!files[i].name.endsWith(".")) {
                    if (files[i].type == "d") {
                        toDelete.push("recycle_bin/" + files[i].name + "/")
                    }
                    else {

                        toDelete.push("recycle_bin/" + files[i].name)
                    }

                }

            }
            await this.removeFiles(toDelete, false)
            await recycleBinRepo.deleteMany({
                config: this.CDN_id
            })
            return toDelete
        }
        return files
    }


    @FileManagerBackup.doToMirror
    async deleteFromTrash(p: string) {
        try {
            await this.removeFiles([p], false)
            try {
                await recycleBinRepo.findOneAndDelete({
                    path: p,
                    config: this.CDN_id
                })
            } catch (error) {

            }
        } catch (error) {

        }
    }



    @FileManagerBackup.doToMirror
    @CDN_Manager.addFilesToLockedPaths(0)
    async deleteManyFromTrash(paths: string[], cacheStr?: string) {
        try {

            await this.removeFiles(paths, false, cacheStr)
            try {
                await recycleBinRepo.deleteMany({
                    path: {
                        $in: paths
                    },
                    config: this.CDN_id
                })
            } catch (error) {

            }
        } catch (error) {

        }
    }




    makUniform(directory: string, files: any[]) {
        var results: any[] = []
        if (this.type == "ftp") {
            for (let i = 0; i < files.length; i++) {
                if (files[i].name.includes(".hidden") || files[i].name.endsWith(".") || files[i].name.includes("---thumbnail")) {
                    continue
                }

                var id = files[i].type == "d" ? directory + files[i].name + "/" : directory + files[i].name
                if (files[i].path) {
                    id = files[i].path
                    id += files[i].type == "d" && !files[i].path.endsWith("/") ? "/" : ""
                }
                results.push({
                    id,
                    type: files[i].type == "d" ? "dir" : "file",
                    name: files[i].name,
                    size: files[i].size,
                    date: files[i].date,
                    path: files[i].path
                })
            }

        }
        else {

            for (let i = 0; i < files.length; i++) {


                if (files[i].name && (files[i].name.includes("---thumbnail"))) {
                    continue
                }

                var names = (files[i].prefix || files[i].name).split("/")
                // var name = files[i].prefix || files[i].name
                var name = files[i].prefix ? names[names.length - 2] : names[names.length - 1]
                var id = files[i].prefix ? directory + name + "/" : directory + name
                if (files[i].path) {
                    id = files[i].path
                    id += files[i].prefix && !files[i].path.endsWith("/") ? "/" : ""
                }
                results.push({
                    id,
                    type: files[i].prefix ? "dir" : "file",
                    name,
                    size: files[i].size,
                    date: files[i].lastModified,
                    path: files[i].path
                })
            }
        }
        return results
    }

    @FileManagerBackup.doToMirror
    @processCDN_Directory
    async createDirectory(path: string, name: string, options?: CreateDirectory) {
        try {
            name = name.toLocaleLowerCase()
            return this.cdn?.craeteDirectory(path, name, options)
        } catch (error) {
            throw error
        }
    }

    async search(term: string, directory: string, options?: SearchFile) {
        return this.cdn?.search(term, directory, options)
    }

    @processCDN_Zip
    @FileManagerBackup.doToMirror
    @CDN_Manager.addFilesToLockedPaths(0)
    async zip(files: string[], name: string, directory: string, options?: ZipFiles) {
        try {
            let r = await this.cdn?.zip(files, name, directory, options)

            if (options?.cacheStr != undefined) {
                let d = await cache.get(options?.cacheStr)
                if (d != null) {
                    var info = JSON.parse(d)
                    // console.log("info", info)
                    info.percentage = 100.00
                    await cache.set(options?.cacheStr, JSON.stringify(info))
                }
                this.cdnOperationRepo.updateOne({
                    code: options?.cacheStr,
                    status: "running"
                }, {
                    $set: {
                        status: "successed",
                    }
                })
            }


        } catch (error) {

            if (options?.cacheStr != undefined) {

                try {
                    let d = await cache.get(options?.cacheStr)
                    if (d != null) {
                        var info = JSON.parse(d)
                        info.failed = true
                        await cache.set(options?.cacheStr, JSON.stringify(info))
                    }
                } catch (error) {

                }

                let operation = await this.cdnOperationRepo.findOneAndUpdate({
                    code: options?.cacheStr,
                    status: "running"
                }, {
                    $set: {
                        status: "failed",
                    }
                })
                if (operation != null)
                    this.cdnOperationRepo.updateOne({
                        _id: operation?._id
                    }, {
                        $set: {
                            err: error
                        }
                    })
            }
            throw error
        }
    }

    @processCDN_UnZip
    @FileManagerBackup.doToMirror
    @CDN_Manager.addFilesToLockedPaths(1)
    @CDN_Manager.addFilesToLockedPaths(0)
    async unzip(file: string, directory: string, options?: UnZipFile) {
        try {
            console.log("options" , options?.files?.length)

            let r = await this.cdn?.unzip(file, directory, options)
            if (options?.cacheStr) {
                this.cdnOperationRepo.updateOne({
                    code: options.cacheStr,
                    status: "running"
                }, {
                    $set: {
                        status: "successed"
                    }
                })
            }
            return r
        } catch (error) {
            if (options?.cacheStr) {
                try {
                    let d = await cache.get(options.cacheStr)
                    if (d != null) {
                        var info = JSON.parse(d)
                        info.failed = true
                        await cache.set(options.cacheStr, JSON.stringify(info))
                    }
                } catch (error) {

                }

                let operation = await this.cdnOperationRepo.findOneAndUpdate({
                    code: options.cacheStr,
                    status: "running"
                }, {
                    $set: {
                        status: "failed",
                    }
                })
                if (operation != null)
                    this.cdnOperationRepo.updateOne({
                        _id: operation?._id
                    }, {
                        $set: {
                            err: error
                        }
                    })
            }
            throw error
        }
    }

    async getZipFileInfo(file: string) {
        return this.cdn?.getZipFileInfo(file)
    }


    @FileManagerBackup.doToMirror
    @processCDN_Copy_Move
    @CDN_Manager.addFilesToLockedPaths(1)
    @CDN_Manager.addFilesToLockedPaths(0)
    async copy(files: string[], directory: string, options: CopyFiles) {
        try {
            let r = await this.cdn?.copy(files, directory, options)

            try {
                if (options.cacheStr) {
                    let d = await cache.get(options.cacheStr)
                    if (d != null) {
                        var info = JSON.parse(d)
                        // console.log("info", info)
                        info.percentage = 100.00
                        await cache.set(options.cacheStr, JSON.stringify(info))
                    }
                }
            } catch (error) {

            }
            if (options.cacheStr != undefined) {
                this.cdnOperationRepo.updateOne({
                    code: options.cacheStr,
                    status: "running"
                }, {
                    $set: {
                        status: "successed"
                    }
                })
            }
            return r
        } catch (error) {

            if (options.cacheStr != undefined) {

                try {
                    let d = await cache.get(options.cacheStr)
                    if (d != null) {
                        var info = JSON.parse(d)
                        info.failed = true
                        await cache.set(options.cacheStr, JSON.stringify(info))
                    }
                } catch (error) {

                }

                let operation = await this.cdnOperationRepo.findOneAndUpdate({
                    code: options.cacheStr,
                    status: "running"
                }, {
                    $set: {
                        status: "failed",
                    }
                })
                if (operation != null)
                    this.cdnOperationRepo.updateOne({
                        _id: operation?._id
                    }, {
                        $set: {
                            err: error
                        }
                    })
            }
            throw error
        }
    }

    @FileManagerBackup.doToMirror
    @processCDN_Copy_Move
    @CDN_Manager.addFilesToLockedPaths(1)
    @CDN_Manager.addFilesToLockedPaths(0)
    async move(files: string[], directory: string, options: MoveFiles) {
        try {
            let r = await this.cdn?.move(files, directory, options)
            try {
                if (options.cacheStr) {
                    let d = await cache.get(options.cacheStr)
                    if (d != null) {
                        var info = JSON.parse(d)
                        // console.log("info", info)
                        info.percentage = 100.00
                        await cache.set(options.cacheStr, JSON.stringify(info))
                    }
                }
            } catch (error) {

            }
            if (options.cacheStr != undefined) {
                this.cdnOperationRepo.updateOne({
                    code: options.cacheStr,
                    status: "running"
                }, {
                    $set: {
                        status: "successed"
                    }
                })
            }
            return r
        } catch (error) {
            if (options.cacheStr != undefined) {

                try {
                    let d = await cache.get(options.cacheStr)
                    if (d != null) {
                        var info = JSON.parse(d)
                        info.failed = true
                        await cache.set(options.cacheStr, JSON.stringify(info))
                    }
                } catch (error) {

                }

                let operation = await this.cdnOperationRepo.findOneAndUpdate({
                    code: options.cacheStr,
                    status: "running"
                }, {
                    $set: {
                        status: "failed",
                    }
                })
                if (operation != null)
                    this.cdnOperationRepo.updateOne({
                        _id: operation?._id
                    }, {
                        $set: {
                            err: error
                        }
                    })
            }
            throw error
        }
    }

    @FileManagerBackup.doToMirror
    @CDN_Manager.addFilesToLockedPaths(0)
    @CDN_Manager.addRenameLockedPaths
    async rename(file: string, name: string, options: RenameFile) {
        try {
            await this.cdn?.rename(file, name, options)

            try {
                if (options.cacheStr) {
                    let d = await cache.get(options.cacheStr)
                    if (d != null) {
                        var info = JSON.parse(d)
                        info.percentage = 100.00
                        await cache.set(options.cacheStr, JSON.stringify(info))
                    }

                    this.cdnOperationRepo.updateOne({
                        code: options.cacheStr,
                        status: "running"
                    }, {
                        $set: {
                            status: "successed"
                        }
                    })
                }
            } catch (error) {

            }
        } catch (error) {
            if (options.cacheStr != undefined) {

                try {
                    let d = await cache.get(options.cacheStr)
                    if (d != null) {
                        var info = JSON.parse(d)
                        info.failed = true
                        await cache.set(options.cacheStr, JSON.stringify(info))
                    }
                } catch (error) {

                }

                let operation = await this.cdnOperationRepo.findOneAndUpdate({
                    code: options.cacheStr,
                    status: "running"
                }, {
                    $set: {
                        status: "failed",
                    }
                })
                if (operation != null)
                    this.cdnOperationRepo.updateOne({
                        _id: operation?._id
                    }, {
                        $set: {
                            err: error
                        }
                    })
            }
            throw error
        }
        return
    }

    async findFolder(directory: string = "") {
        return await this.cdn?.findFolder(directory, 1, {
            checkSub: true
        })
    }

    @CDN_Manager.addFilesToLockedPaths(0)
    async downloadAndZipFolder(folder: string, code?: string) {
        try {
            let dirs = folder.split("/")
            await this.init()


            let p = await this.cdn?.downloadFiles([folder], {
                cacheStr: code,
                folder: "temp/" + Date.now()
            })
            await zip(p + "/" + dirs[dirs.length - 2], p + "/" + dirs[dirs.length - 2] + ".zip", {

            })

            let atachment = p + "/" + dirs[dirs.length - 2] + ".zip"
            // // console.log("ppppp", p, dirs[dirs.length - 2])
            await DiskFileManager.move(p + "/" + dirs[dirs.length - 2] + ".zip", "src/uploads/tmp/")
            if (p)
                await DiskFileManager.removeFolder(p)

            atachment = ConfigService.getConfig("serverurl") + "/uploads/tmp/" + dirs[dirs.length - 2] + ".zip"
            try {
                if (code) {
                    let d = await cache.get(code)
                    if (d != null) {
                        var info = JSON.parse(d)
                        info['atachment'] = atachment
                        // console.log("info", info)
                        info.percentage = 100.00
                        // console.log("atachment", atachment)
                        await cache.set(code, JSON.stringify(info))
                    }
                }
            } catch (error) {

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
                })
            }



        } catch (error) {


            if (code != undefined) {

                try {
                    let d = await cache.get(code)
                    if (d != null) {
                        var info = JSON.parse(d)
                        info.failed = true
                        await cache.set(code, JSON.stringify(info))
                    }
                } catch (error) {

                }

                let operation = await this.cdnOperationRepo.findOneAndUpdate({
                    code,
                    status: "running"
                }, {
                    $set: {
                        status: "failed",
                    }
                })
                if (operation != null)
                    this.cdnOperationRepo.updateOne({
                        _id: operation?._id
                    }, {
                        $set: {
                            err: error
                        }
                    })
            }
            throw error
        }
    }

    @FileManagerBackup.copyfromOther
    @processCDN_Copy_Move
    @CDN_Manager.addCrossLockedPaths
    @CDN_Manager.addFilesToLockedPaths(0)
    async copyToOther(files: string[], toCdn: string | any, directory: string, fromLink: boolean = false, options?: CopyFiles) {
        try {
            var resFiles: string[] = []
            if (fromLink) {
                var dirName = Date.now().toString()
                await DiskFileManager.mkdir("src/uploads/", dirName)
                var dirPath = "src/uploads/" + dirName + "/"
                await DiskFileManager.downloadFiles(files, dirPath)
            }
            else {
                console.log("files" , files)
                var dirPath = await this.cdn?.downloadFiles(files, {
                    cacheStr: options?.cacheStr
                }) as string
                if (dirPath == undefined) {
                    throw new Error("")
                }
            }

            if (typeof toCdn == "string") {
                this.CDN_id = toCdn
                await this.init(true)

            }
            else {
                this.initFromConfig(toCdn)
            }

            try {
                if (options?.cacheStr) {
                    let d = await cache.get(options.cacheStr)
                    let info = JSON.parse(d)
                    info.copying = true
                    info.percentage = 0
                    info.uploaded = 0
                    await cache.set(options.cacheStr, JSON.stringify(info))

                }
            } catch (error) {

            }


            var result = await this.cdn?.uploadFolder(dirPath, directory, false, {
                cacheStr: options?.cacheStr,
                rename: options?.rename,
                all: true
            })

            if (options?.cacheStr != undefined) {
                this.cdnOperationRepo.updateOne({
                    code: options.cacheStr,
                    status: "running"
                }, {
                    $set: {
                        status: "successed"
                    }
                })
            }

            await DiskFileManager.removeFolder(dirPath)
            return result
        } catch (error) {
            if (options?.cacheStr != undefined) {

                try {
                    let d = await cache.get(options.cacheStr)
                    if (d != null) {
                        var info = JSON.parse(d)
                        info.failed = true
                        await cache.set(options.cacheStr, JSON.stringify(info))
                    }
                } catch (error) {

                }

                let operation = await this.cdnOperationRepo.findOneAndUpdate({
                    code: options.cacheStr,
                    status: "running"
                }, {
                    $set: {
                        status: "failed",
                    }
                })
                if (operation != null)
                    this.cdnOperationRepo.updateOne({
                        _id: operation?._id
                    }, {
                        $set: {
                            err: error
                        }
                    })
            }
            throw error
        }
    }

    async backUpToOther(files: string[], toCdn: string | any, directory: string, ttl: Date) {
        var dirPath = ""
        try {
            var results: string[] = []
            for (let i = 0; i < files.length; i++) {
                // console.log(i, files[i])
                dirPath = await this.cdn?.downloadFiles([files[i]]) as string

                if (dirPath == undefined) {
                    throw new Error("")
                }
                if (!dirPath.endsWith("/")) {
                    dirPath += "/"
                }
                if (typeof toCdn == "string") {
                    this.CDN_id = toCdn
                    await this.init()
                }
                else {
                    this.initFromConfig(toCdn)
                }
                var result = await this.cdn?.uploadFolder(dirPath, directory, false)

                await DiskFileManager.removeFolder(dirPath)
                results.push(files[i])
                // if (new Date() > ttl)
                //     return results
            }
            return results
        } catch (error) {
            try {
                await DiskFileManager.removeFolder(dirPath)
            } catch (error) {

            }
            throw error
        }
    }


    async backup(dir: string, backup: FTP | S3) {
        let files = this.makeUniform(await this.getFiles(dir), dir)
        for (let i = 0; i < files.length; i++) {

            if (files[i].id.endsWith("/")) {
                let dirs = files[i].id.split("/")
                let cdn = this.cdn
                this.cdn = backup
                this.CDN_id = backup.id
                await this.createDirectory(dir, dirs[dirs.length - 2])
                this.cdn = cdn
                await this.backup(files[i].id, backup)
            }
            else {
                let dirs = files[i].id.split("/")
                // // console.log(files[i].id)
                let file = await DiskFileManager.downloadFile(this.cdn?.baseDir + files[i].id)
                let cdn = this.cdn
                this.cdn = backup
                this.CDN_id = backup.id
                await fileManagerConfigRepo.updateOne({
                    _id: backup.id
                }, {
                    $inc: {
                        transfered: 1
                    }
                })
                await this.uploadMany([{
                    destination: dir + path.basename(file),
                    path: file
                }], {
                    rename: false
                })
                this.cdn = cdn
            }
        }

    }


    makeUniform(files: any, directory: string) {
        // // console.log("files" , files)
        var results: any[] = []
        if (this.type == "ftp") {
            for (let i = 0; i < files.length; i++) {
                if (files[i].name.endsWith(".") || files[i].name.includes("---thumbnail")) {
                    continue
                }
                var id = files[i].type == "d" ? directory + files[i].name + "/" : directory + files[i].name
                if (files[i].path) {
                    id = files[i].path
                    id += files[i].type == "d" && !files[i].path.endsWith("/") ? "/" : ""
                }
                if (files[i].type == "d") {
                    var subFolders = files[i].sub?.filter((f: any) => {
                        return f.type == "d" && !f.name.endsWith(".")
                    }).length
                    var subFiles = files[i].sub?.filter((f: any) => {
                        return f.type != "d" && !f.name.endsWith(".") && !f.name.includes("---thumbnail")
                    }).length

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

                })
            }

        }
        else {

            for (let i = 0; i < files.length; i++) {

                if (files[i].name && (files[i].name.includes("---thumbnail"))) {
                    continue
                }

                var names = (files[i].prefix || files[i].name).split("/")
                // var name = files[i].prefix || files[i].name
                var name = files[i].prefix ? names[names.length - 2] : names[names.length - 1]
                var id = files[i].prefix ? directory + name + "/" : directory + name

                if (files[i].path) {
                    id = files[i].path
                    id += files[i].prefix && !files[i].path.endsWith("/") ? "/" : ""
                }

                if (files[i].prefix != undefined) {
                    var subFolders = files[i].sub.filter((f: any) => {
                        return f.prefix != undefined
                    }).length
                    var subFiles = files[i].sub.filter((f: any) => {
                        return f.prefix == undefined && !f.name.includes("---thumbnail")

                    }).length

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
                })
            }
        }
        return results
    }


    @FileManagerBackup.movefromOther
    @processCDN_Copy_Move
    @CDN_Manager.addCrossLockedPaths
    @CDN_Manager.addFilesToLockedPaths(0)
    async moveToOther(files: string[], toCdn: string, directory: string, options?: CopyFiles) {
        try {
            var dirPath = await this.cdn?.downloadFiles(files, {
                cacheStr: options?.cacheStr
            })

            if (dirPath == undefined) {
                throw new Error("")
            }
            var cdn: any = this.cdn
            var currentCDN = this.CDN_id
            this.CDN_id = toCdn
            await this.init(true)


            try {
                if (options?.cacheStr) {
                    let d = await cache.get(options.cacheStr)
                    let info = JSON.parse(d)
                    info.copying = true
                    info.percentage = 0
                    info.uploaded = 0
                    await cache.set(options.cacheStr, JSON.stringify(info))

                }
            } catch (error) {

            }


            var result = await this.cdn?.uploadFolder(dirPath, directory, false, {
                rename: options?.rename,
                all: true,
                cacheStr: options?.cacheStr
            })


            try {
                if (options?.cacheStr) {
                    let d = await cache.get(options.cacheStr)
                    let info = JSON.parse(d)
                    info.deleting = true
                    info.percentage = 0
                    info.uploaded = 0
                    await cache.set(options.cacheStr, JSON.stringify(info))

                }
            } catch (error) {

            }

            this.cdn = cdn
            this.CDN_id = currentCDN
            await this.removeFiles(files, false, options?.cacheStr)
            // try {
            //     DiskFileManager.removeFolder(dirPath)
            // } catch (error) {

            // }
            return dirPath
        } catch (error) {
            if (options?.cacheStr != undefined) {

                try {
                    let d = await cache.get(options.cacheStr)
                    if (d != null) {
                        var info = JSON.parse(d)
                        info.failed = true
                        await cache.set(options.cacheStr, JSON.stringify(info))
                    }
                } catch (error) {

                }

                let operation = await this.cdnOperationRepo.findOneAndUpdate({
                    code: options.cacheStr,
                    status: "running"
                }, {
                    $set: {
                        status: "failed",
                    }
                })
                if (operation != null)
                    this.cdnOperationRepo.updateOne({
                        _id: operation?._id
                    }, {
                        $set: {
                            err: error
                        }
                    })
            }


            try {
                if (dirPath)
                    DiskFileManager.removeFolder(dirPath)
            } catch (error) {

            }
            throw error
        }
    }



    @FileManagerBackup.movefromOther
    @processCDN_Copy_Move
    @CDN_Manager.addCrossLockedPaths
    @CDN_Manager.addFilesToLockedPaths(0)
    async restoreToOther(files: string[], toCdn: string, directory: string, options?: CopyFiles, renameTo?: string) {
        try {
            var dirPath = await this.cdn?.downloadFiles(files, {
                cacheStr: options?.cacheStr,
                renameTo
            })

            if (dirPath == undefined) {
                throw new Error("")
            }
            var cdn: any = this.cdn
            var currentCDN = this.CDN_id
            this.CDN_id = toCdn
            await this.init(true)


            try {
                if (options?.cacheStr) {
                    let d = await cache.get(options.cacheStr)
                    let info = JSON.parse(d)
                    info.copying = true
                    info.percentage = 0
                    info.uploaded = 0
                    await cache.set(options.cacheStr, JSON.stringify(info))

                }
            } catch (error) {

            }


            var result = await this.cdn?.uploadFolder(dirPath, directory, false, {
                rename: options?.rename,
                all: true,
                cacheStr: options?.cacheStr
            })


            try {
                if (options?.cacheStr) {
                    let d = await cache.get(options.cacheStr)
                    let info = JSON.parse(d)
                    info.deleting = true
                    info.percentage = 0
                    info.uploaded = 0
                    await cache.set(options.cacheStr, JSON.stringify(info))

                }
            } catch (error) {

            }

            this.cdn = cdn
            this.CDN_id = currentCDN
            await this.removeFiles(files, false, options?.cacheStr)

            backupFileRepo.deleteMany({
                backCDN: {
                    $eq: this.CDN_id
                },
                backFile: {
                    $in: files
                }
            })

            return dirPath

        } catch (error) {
            if (options?.cacheStr != undefined) {

                try {
                    let d = await cache.get(options.cacheStr)
                    if (d != null) {
                        var info = JSON.parse(d)
                        info.failed = true
                        await cache.set(options.cacheStr, JSON.stringify(info))
                    }
                } catch (error) {

                }

                let operation = await this.cdnOperationRepo.findOneAndUpdate({
                    code: options.cacheStr,
                    status: "running"
                }, {
                    $set: {
                        status: "failed",
                    }
                })
                if (operation != null)
                    this.cdnOperationRepo.updateOne({
                        _id: operation?._id
                    }, {
                        $set: {
                            err: error
                        }
                    })
            }


            try {
                if (dirPath)
                    DiskFileManager.removeFolder(dirPath)
            } catch (error) {

            }
            throw error
        }
    }

    @FileManagerBackup.doToMirror
    async setPermission(file: string, permission: string, options?: SetPermission) {
        try {
            if (this.type == "ftp")
                return this.cdn?.setPermission(file, permission, options)
            return true
        }
        catch (error) {
            throw error
        }
    }


    async getInfo() {
        try {
            return this.cdn?.getInfo()
        } catch (error) {
            throw error
        }
    }

    getDefaultUrl(): string {
        return this.cdn?.baseDir as string
    }


    async reset() {
        if (this.type == "ftp") {
            // await this.cdn?.resetFTP()
        }
        return {}
    }


    async removeAll() {
        let files = this.makeUniform(await this.getFiles(""), "")
        for (let i = 0; i < files.length; i++) {
            await this.removeFiles([files[i].id], false)
        }
    }


    async getFolderAllFiles(folder: string) {
        try {
            await this.init()
            return this.cdn?.getFolderAllFiles(folder)
        } catch (error) {
            throw error
        }
    }

    async makeBucket(name: string) {
        try {
            await this.cdn?.makeBucket(name)
        } catch (error) {
            throw error
        }
    }

    async removeBucket(name: string) {
        return this.cdn?.removeBucket(name)
    }

}
