import CDN_Manager from "../../services/fileManager"
import FileManagerConfigRepository from "../repositories/fileManagerConfig/repository"
// import upload from "../../middlewares/upload"
import path from 'path'
import FileManagerPermissionRepository from "../repositories/fileManagerPermission/repository"
import AdminCdnPermissionRepository from "../repositories/adminCdnPermission/repository"
import FileUsesRepository from "../repositories/fileUses/repository"
import BackupRepository from "../repositories/backup/repository"
import { Admin, Body, Files, Query, Session } from "../../decorators/parameters"
import Controller, { Response } from "../../controller"
import BaseController from "../controller"
import { z } from "zod"
import { AdminInfo } from "../auth/admin/admin-logIn"
import { Get, Post } from "../../decorators/method"
import RedisCache from "../../redis-cache"
import RandomGenarator from "../../random"
import CDN_OperationRepository from "../repositories/cdnOperations/repository"
import CDN_LockedPathRepository from "../repositories/cdnLockedPath/repository"
import BackupFileRepository from "../repositories/backupFile/repository"
import { Types } from "mongoose"

interface UniformData {
    allowedTypes?: string[],
    dataType?: 'any' | 'file' | 'folder'
}

type AccessType =
    'zip' |
    'unzip' |
    'view' |
    'copy' |
    'delete' |
    'upload' |
    'rename' |
    'directory' |
    'delete-directory' |
    'rename-directory' |
    'move' |
    'permission'

const cache = new RedisCache("file_managing")

const cdn_LockedPathRepository = new CDN_LockedPathRepository()
cdn_LockedPathRepository.clearProccesses()

async function validatePathOperationIsPossiblle(index: number) {
    return (target: any,
        propertyKey: string,
        propertyDescriptor: PropertyDescriptor
    ): PropertyDescriptor => {
        const originalMethod = propertyDescriptor.value;


        propertyDescriptor.value = async function (...args: any[]) {

            let files = args[index]
            let type = typeof files
            let self = this as FileManager
            try {
                // self.cdn_LockedPathRepository.

                if (type == "string") {
                    await cdn_LockedPathRepository.addPath(self.cdn.CDN_id as string, files)
                }
                else {
                    let q: string[] = []
                    for (let i = 0; i < files.length; i++) {
                        q.push(...getQueryForOperations(files[i]))
                    }

                    // await cdn_LockedPathRepository.isExists(self.cdn.CDN_id as string, files)
                }

                var result = await originalMethod.apply(this, args);
            } catch (error) {

                throw error
            }


            return result
        };


        return propertyDescriptor;
    }
}

function getQueryForOperations(dir: string): any {
    // let ors = []
    var qq: any = {}
    var paths: string[] = []
    if (dir.split("/").length > 2) {
        var dirs = dir.split("/")
        paths.push("/")
        for (let i = 0; i < dirs.length; i++) {
            var q = ""
            for (let j = 0; j < i; j++) {
                q += dirs[j] + "/"
            }
            if (q != "") {
                paths.push(q)
            }
        }

    }
    else {

        paths.push("/")
        paths.push(dir)

    }
    return paths
}

export class FileManager extends Controller {
    readonly fileManagerRepo: FileManagerConfigRepository;
    cdn: CDN_Manager
    private readonly fileManagerPermission: FileManagerPermissionRepository
    private readonly fileManagerAdminRepo: AdminCdnPermissionRepository
    private readonly fileUsesRepo: FileUsesRepository
    private readonly cdnOperationRepo: CDN_OperationRepository
    private readonly cdn_LockedPathRepository: CDN_LockedPathRepository
    private readonly backupFileRepo: BackupFileRepository
    private readonly backupRepo: BackupRepository
    verifyUpload: Function
    constructor(baseRoute: string) {
        super(baseRoute)
        this.fileManagerRepo = new FileManagerConfigRepository()
        this.cdn = new CDN_Manager()
        this.fileManagerPermission = new FileManagerPermissionRepository()
        this.fileManagerAdminRepo = new AdminCdnPermissionRepository()
        this.fileUsesRepo = new FileUsesRepository()
        this.cdnOperationRepo = new CDN_OperationRepository()
        this.cdn_LockedPathRepository = new CDN_LockedPathRepository()
        this.backupFileRepo = new BackupFileRepository()
        this.backupRepo = new BackupRepository()
        this.verifyUpload = () => { }
        // console.log(this.getQueryForOperations("0000/content/2131/screenshot from 2024-04-14 10-59-13.png"))
        this.initApis()
    }


    async validatePathOperationIsPossiblle(files: string | string[]) {
        let type = typeof files
        try {

            let q: string[] = []
            if (type == "string") {
                q = getQueryForOperations(files as string)
            }
            else {
                for (let i = 0; i < files.length; i++) {
                    q.push(...getQueryForOperations(files[i]))
                }
            }
            return await cdn_LockedPathRepository.isExists({
                cdn: this.cdn.CDN_id,
                paths: q
            })
        } catch (error) {

            throw error
        }
    };


    async checkFileManager(@Session() session: any): Promise<Response> {
        var fileManager = session["fileManager"]
        if (!fileManager) {
            return {
                status: 400,
                message: "درخواست نامعتبر",
                data: { setId: false }
            }
        }
        return await this.doCheckFileManager(fileManager._id as string || fileManager.id)
    }


    async checkOtherFileManager(@Body(
        {
            destination: "cdn",
            schema: BaseController.id
        }
    ) cdn: string) {
        try {
            return await this.doCheckFileManager(cdn)
        } catch (error) {
            throw error
        }
    }

    async doCheckFileManager(id: string): Promise<Response> {
        try {
            var isExists = await new BackupRepository().isExists({
                cdn: id,
                status: 'inProccess'
            })
            if (isExists) {
                return {
                    message: "این  سرور فایل فعلا در دسترس نیست",
                    status: 400
                }
            }
            return {
                next: true
            }
        } catch (error) {
            throw error
        }
    }

    async view(
        @Body({
            destination: "directory",
            schema: z.string()
        }) directory: string,
        @Query({
            destination: "sort",
            schema: z.string().default('default')
        }) sort: string,
        @Query({
            destination: "page",
            schema: BaseController.page.default(1)
        }) page: number,
        @Query({
            destination: "limit",
            schema: BaseController.limit.default(30)
        }) limit: number,
        @Admin() admin: AdminInfo,
        @Session() session: any
    ): Promise<Response> {
        try {
            var files = await this.cdn.getFiles(directory) as any
            var fileManager = session["fileManager"]
            var config
            let showType
            if (!admin.isSuperAdmin) {
                let or = this.getPathQuery(directory, "view")
                if (or['$or']) {
                    for (let i = 0; i < or['$or'].length; i++) {
                        let q: any = or['$or'][i]
                        config = await this.fileManagerPermission.findOne(Object.assign({
                            admin: admin._id,
                            cdn: fileManager._id
                        }, q), {
                            projection: {
                                "pathsPermission.$": 1
                            }
                        })

                        if (config?.pathsPermission[0]) {
                            if (config?.pathsPermission[0].showType?.length == 0) {
                                showType = ['xxxx']
                            }
                            else {
                                showType = config?.pathsPermission[0].showType
                            }
                            break
                        }

                    }

                }
                // console.log(or)
            }
            files = this.makeUniform(files, showType, directory)

            files = files.filter((file: any) => file.name != "")

            return {
                status: 200,
                data: this.trimAndSort(files, page, limit, sort)
            }
        } catch (error) {
            console.log(error)
            throw error
        }
    }


    async validatePath(
        @Body({
            destination: "paths",
            schema: z.array(z.string())
        }) paths: string[],

    ): Promise<Response> {
        try {
            return {
                status: 200,
                data: await this.cdn.isPathExists(paths)
            }
        } catch (error) {
            throw error
        }
    }

    getPermission(rights: any) {
        var user_p: string = rights['user']
        var userNumber = 0
        if (user_p.includes("r")) {
            userNumber += 4
        }
        if (user_p.includes("w")) {
            userNumber += 2

        }
        if (user_p.includes("x")) {
            userNumber += 1
        }


        var group_p: string = rights['group']
        var groupNumber = 0
        if (group_p.includes("r")) {
            groupNumber += 4
        }
        if (group_p.includes("w")) {
            groupNumber += 2

        }
        if (group_p.includes("x")) {
            groupNumber += 1
        }


        var public_p: string = rights['other']
        var publicNumber = 0
        if (public_p.includes("r")) {
            publicNumber += 4
        }
        if (public_p.includes("w")) {
            publicNumber += 2

        }
        if (public_p.includes("x")) {
            publicNumber += 1
        }
        return userNumber.toString() + groupNumber.toString() + publicNumber.toString()

    }

    makeUniform(files: any, allowedTypes: string[] = [], directory: string) {
        // console.log("files" , files)
        var results: any[] = []
        if (this.cdn.type == "ftp") {
            for (let i = 0; i < files.length; i++) {
                if (files[i].name.endsWith(".") || files[i].name.includes("---thumbnail")) {
                    continue
                }
                if (files[i].type != "d" && allowedTypes?.length && allowedTypes?.length > 0 && !allowedTypes.includes(path.extname(files[i].name).substring(1))) {
                    continue
                }
                var id = files[i].type == "d" ? directory + files[i].name + "/" : directory + files[i].name
                if (files[i].path) {
                    id = files[i].path
                    id += files[i].type == "d" && !files[i].path.endsWith("/") ? "/" : ""
                }
                if (id == "recycle_bin/") {
                    continue
                }
                if (files[i].type == "d") {
                    var subFolders = files[i].sub?.filter((f: any) => {
                        return f.type == "d" && !f.name.endsWith(".")
                    }).length
                    var subFiles = files[i].sub?.filter((f: any) => {
                        return f.type != "d" && !f.name?.endsWith(".") && !f.name?.includes("---thumbnail")
                    }).length

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

                })
            }

        }
        else {

            for (let i = 0; i < files.length; i++) {
                if (!files[i].prefix && allowedTypes?.length && allowedTypes?.length > 0 && !allowedTypes.includes(path.extname(files[i].name).substring(1))) {
                    continue
                }

                if (files[i].name && (files[i].name.includes("---thumbnail"))) {
                    continue
                }

                var names = (files[i].prefix || files[i].name).split("/")
                // var name = files[i].prefix || files[i].name
                var name = files[i].prefix ? names[names.length - 2] : names[names.length - 1]
                var id = files[i].prefix ? directory + name + "/" : directory + name

                if (id == "recycle_bin/") {
                    continue
                }
                if (files[i].path) {
                    id = files[i].path
                    id += files[i].prefix && !files[i].path.endsWith("/") ? "/" : ""
                }

                if (files[i].prefix != undefined) {
                    var subFolders = files[i].sub?.filter((f: any) => {
                        return f.prefix != undefined
                    }).length || 0
                    var subFiles = files[i].sub?.filter((f: any) => {
                        return f.prefix == undefined && !f.name.includes("---thumbnail")

                    }).length || 0

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
        // console.log("result" ,results)
        return results
    }

    trimAndSort(data: any[], page: number, limit: number, sort: string) {
        if (sort == 'default') {
            // console.log("files" , files)
            data.sort(function (a: any, b: any) {
                // console
                return b.type == 'dir' && a.type == 'file' ? 1 : -1
            }
            );
        }

        if (sort.includes("size")) {
            let sortInfo = sort.split(":")

            let folders = data.filter((a: any) => {
                return a.type == "dir"
            })
            let files = data.filter((a: any) => {
                return a.type == "file"
            })
            if (sortInfo[sortInfo.length - 1] == "-1") {
                files.sort(function (a: any, b: any) {
                    return b.size > a.size ? 1 : -1
                }
                );
            }
            else {
                files.sort(function (a: any, b: any) {
                    return b.size < a.size ? 1 : -1
                }
                );
            }
            data = folders
            data.push(...files)

        }

        if (sort.includes("name")) {
            let sortInfo = sort.split(":")

            let folders = data.filter((a: any) => {
                return a.type == "dir"
            })
            let files = data.filter((a: any) => {
                return a.type == "file"
            })
            if (sortInfo[sortInfo.length - 1] == "-1") {
                files.sort(function (a: any, b: any) {
                    return a.name.localeCompare(b.name)
                }
                );

                folders.sort(function (a: any, b: any) {
                    return a.name.localeCompare(b.name)
                }
                );
            }
            else {
                files.sort(function (a: any, b: any) {
                    return b.name.localeCompare(a.name)
                }
                );

                folders.sort(function (a: any, b: any) {
                    return b.name.localeCompare(a.name)
                }
                );
            }
            data = folders
            data.push(...files)

        }

        if (sort.includes("date")) {
            let sortInfo = sort.split(":")

            let folders = data.filter((a: any) => {
                return a.type == "dir"
            })
            let files = data.filter((a: any) => {
                return a.type == "file"
            })
            if (sortInfo[sortInfo.length - 1] == "-1") {
                files.sort(function (a: any, b: any) {
                    return new Date(b.date) > new Date(a.date) ? 1 : - 1
                }
                );

                folders.sort(function (a: any, b: any) {
                    return new Date(b.date) > new Date(a.date) ? 1 : - 1
                }
                );
            }
            else {
                files.sort(function (a: any, b: any) {
                    return new Date(a.date) > new Date(b.date) ? 1 : - 1
                }
                );

                folders.sort(function (a: any, b: any) {
                    return new Date(a.date) > new Date(b.date) ? 1 : - 1
                }
                );
            }
            data = folders
            data.push(...files)

        }

        return data.slice(((page - 1) * limit), page * limit)

    }


    async directory(
        @Body({
            destination: "directory",
            schema: z.string()
        }) directory: string,
        @Body({
            destination: "name",
            schema: z.string()
        }) name: string
    ): Promise<Response> {
        try {
            var date = new Date()
            await this.cdn.createDirectory(directory, name)

            return {
                status: 200,
                data: {
                    date,
                    id: directory + name + "/",
                    name: name,
                    size: 0,
                    type: "dir"
                }
            }
        } catch (error) {
            throw error
        }
    }

    @Post("/restore", {

    })
    async restore(
        @Body({
            destination: "path",
            schema: z.string()
        }) p: string
    ): Promise<Response> {
        try {
            return {
                status: 200,
                data: await this.cdn.restore(p)
            }
        } catch (error) {
            throw error
        }
    }

    // @Post("/restore/many")
    async restoreMany(
        @Body({
            destination: "paths",
            schema: z.array(z.string())
        }) files: string[],
        @Admin() admin: AdminInfo
    ): Promise<Response> {
        try {
            // ret
            let allFiles = 0
            var code = RandomGenarator.generateHashStr(32)


            for (let i = 0; i < files.length; i++) {
                allFiles += files[i].endsWith("/") && this.cdn.type != "ftp" ? (await this.cdn.getFolderAllFiles(files[i]))?.length || 0 : 1
            }


            console.log("allfiles", allFiles)

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
            } as any)

            await cache.set(code, {
                allFiles,
                uploaded: 0,
                percentage: 0
            })

            this.cdn.restoreMany(files, code)



            return {
                status: 200,
                data: code
            }

        } catch (error) {
            console.log(error)
            throw error
        }


    }


    // @Post("/recycle/empty")
    async emptyRecycle(): Promise<Response> {
        try {
            return {
                status: 200,
                data: await this.cdn.deleteRecycle()
            }
        } catch (error) {
            throw error
        }
    }



    @Post("/hard-delete")
    async deleteFromTrash(
        @Body({
            destination: "path",
            schema: z.string()
        }) p: string
    ) {
        try {
            return {
                status: 200,
                data: this.cdn.deleteFromTrash(p)
            }
        } catch (error) {
            throw error
        }
    }

    async deleteManyFromTrash(
        @Body({
            destination: "paths",
            schema: z.array(z.string())
        }) files: string[],
        @Admin() admin: AdminInfo
    ) {
        try {

            let allFiles = 0
            var code = RandomGenarator.generateHashStr(32)

            // console.log(this.cdn.type, this.cdn.cdn)

            for (let i = 0; i < files.length; i++) {
                allFiles += files[i].endsWith("/") && this.cdn.type != "ftp" ? (await this.cdn.getFolderAllFiles(files[i]))?.length || 0 : 1
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
            } as any)

            await cache.set(code, {
                allFiles,
                uploaded: 0,
                percentage: 0
            })

            this.cdn.deleteManyFromTrash(files, code)

            return {
                status: 200,
                data: code
            }
        } catch (error) {
            throw error
        }
    }

    async checkStorage(
        @Body({
            destination: "size",
            schema: z.number().int().positive()
        }) size: number
    ): Promise<Response> {
        try {
            let conf = await this.fileManagerRepo.findById(this.cdn.CDN_id || "")

            let totalSize = conf?.totalSize || 1
            let usedSize = conf?.usedSize || 0

            if (((usedSize + size) / totalSize) > 0.95) {
                if (((usedSize + size) / totalSize) > 0.95) {
                    return {
                        status: 400,
                        data: {}
                    }
                }
            }

            return {
                status: 200,
                data: {}
            }
        } catch (error) {
            throw error
        }


    }

    @Post("/abort")
    async abortFile(
        @Body({
            destination: "hash",
            schema: z.string()
        }) p: string
    ): Promise<Response> {
        try {

            let data = await cache.get(p)

            await cache.set("stop_" + p, "stop")
            return {
                status: 200,
                data
            }
        } catch (error) {
            throw error
        }
    }

    @Get("/tasks/status")
    async getTaskStatus(
        @Query({
            destination: "code",
            schema: z.string()
        }) code: string
    ): Promise<Response> {
        try {
            let data = await cache.get(code)
            if (data != null)
                data = JSON.parse(data)
            if (data != null && data.failed == true) {
                return {
                    status: 500,
                    data
                }
            }
            return {
                status: 200,
                data
            }
        } catch (error) {
            throw error
        }
    }

    @Post("/tasks/status/many")
    async getTasksStatus(
        @Body({
            destination: "codes",
            schema: z.array(z.string())
        }) codes: string[]
    ): Promise<Response> {
        try {
            let data = []
            for (let i = 0; i < codes.length; i++) {
                // let d = c
                let status: any = {
                    code: codes[i]
                }
                let d = await cache.get(codes[i])
                status['info'] = d
                if (d != null) {
                    status['info'] = JSON.parse(d)
                }
                data.push(status)
            }
            return {
                status: 200,
                data
            }

        } catch (error) {
            throw error
        }
    }

    @Post("tasks/checked")
    async setTaskChecked(
        @Body({
            destination: "tasks",
            schema: z.array(BaseController.id)
        }) tasks: string[]
    ) {
        try {
            await this.cdnOperationRepo.updateMany({
                _id: {
                    $in: tasks
                }
            }, {
                $set: {
                    checked: true
                }
            })
        } catch (error) {
            throw error
        }
    }

    @Get("/tasks/running")
    async getRunningTask(
        @Admin() admin: AdminInfo
    ): Promise<Response> {
        try {
            let query: any = {
                $or:
                    [
                        {
                            status: "running"
                        },
                        {
                            checked: false
                        }
                    ]
            }
            if (!admin.isSuperAdmin) {
                query['admin'] = admin._id
            }
            let tasks = await this.cdnOperationRepo.findAll(query)
            return {
                status: 200,
                data: tasks
            }

        } catch (error) {
            throw error
        }
    }


    async restoreFromBackup(
        @Body({
            destination: "files",
            schema: z.array(z.string())
        }) files: string[],
        @Body({
            destination: "rename",
            schema: z.boolean()
        }) rename: boolean,
        @Admin() admin: AdminInfo
    ): Promise<Response> {

        if (files.length == 0) {
            return {
                status: 400,
                message: "فایلی انتخاب نشده است"
            }
        }

        for (let i = 0; i < files.length; i++) {
            let file = await this.backupFileRepo.findOne({
                backFile: files[i]
            })
            if (file == null) {
                return {
                    status: 404,
                    message: "فایل یافت نشد"
                }
            }
        }


        let codes = []

        let info: any[] = []
        for (let i = 0; i < files.length; i++) {
            let allFiles = 0
            let toCdn: string | Types.ObjectId = ""
            var code = RandomGenarator.generateHashStr(32)

            codes.push(code)

            let file = await this.backupFileRepo.findOne({
                backFile: files[i]
            })
            if (file == null) {
                return {
                    status: 404,
                    message: "فایل یافت نشد"
                }
            }
            toCdn = file.cdn
            allFiles += files[i].endsWith("/") ? (await this.cdn.getFolderAllFiles(files[i]))?.length || 0 : 1


            let fileName = file.cdnFile
            let name = ""

            if (fileName.endsWith("/")) {
                name = path.basename(fileName)
                name += "/"
            }
            else {
                name = path.basename(fileName)
            }

            let directory = fileName.slice(0, name.length * -1)


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
            } as any)

            await cache.set(code, {
                allFiles,
                downloaded: 0,
                percentage: 0
            })

            info.push({
                files: [files[i]],
                cdn: file.cdn as string,
                directory: directory,
                rename,
                cacheStr: code
            })



        }





        // console.log("before move")
        this.restoreBackups(info)


        return {
            status: 200,
            data: codes
        }
    }


    async restoreBackups(info: {
        files: string[],
        cdn: string,
        directory: string,
        rename: boolean,
        cacheStr: string
    }[]) {
        try {


            for (let i = 0; i < info.length; i++) {
                await this.cdn.restoreToOther(info[i].files, info[i].cdn as string, info[i].directory, {
                    rename: info[i].rename,
                    cacheStr: info[i].cacheStr
                })
            }

        } catch (error) {

        }
    }

    // @Post("/backup/validate")
    async validateBackup(
        @Body({
            destination: "files",
            schema: z.array(z.string())
        }) files: string[],
        @Session() session: any
    ): Promise<Response> {

        try {

            var fileManager = session["fileManager"]

            let backupFiles = await this.backupFileRepo.findAll({
                backFile: {
                    $in: files
                },
                backCDN: fileManager._id as string || fileManager.id
            })


            if (backupFiles.length != files.length) {
                return {
                    status: 404,
                    message: "not found"
                }
            }

            let data: any[] = []
            for (let i = 0; i < backupFiles.length; i++) {
                let file = backupFiles[i].cdnFile
                let name = ""

                if (file.endsWith("/")) {
                    name = path.basename(file)
                    name += "/"
                }
                else {
                    name = path.basename(file)
                }

                let dest = file.slice(0, name.length * -1)
                let r = await this.cdn.validateToCopy([file], dest, backupFiles[i].cdn.toString())
                data.push(...r)
            }

            return {
                status: 200,
                data
            }
        } catch (error) {
            throw error
        }
    }

    async downloadFolder(
        @Body({
            destination: "directory",
            schema: z.string()
        }) directory: string,
        @Admin() admin: AdminInfo,
        @Body({
            destination: "code",
            schema: z.string().optional()
        }) code?: string
    ): Promise<Response> {
        try {
            if (code == undefined) {
                code = RandomGenarator.generateHashStr(32)
            }
            let files = await this.cdn?.getFolderAllFiles(directory)
            // console.log("files", files?.length)
            await cache.set(code, JSON.stringify({
                allFiles: files?.length,
                downloaded: 0,
                percentage: 0
            }))

            let operation = await this.cdnOperationRepo.insert({
                operation: "download-folder",
                cdn: this.cdn.CDN_id || "",
                code,
                admin: admin._id,
                status: "running",
                info: {
                    files: [directory]
                }
            } as any)


            this.cdn?.downloadAndZipFolder(directory, code)


            return {
                status: 200,
                data: code
            }
        } catch (error) {
            throw error
        }
    }

    async validateToCopy(
        @Body({
            destination: "files",
            schema: z.array(z.string())
        }) files: string[],
        @Body({
            destination: "dest",
            schema: z.string()
        }) dest: string,
        @Body({
            destination: "cdn",
            schema: BaseController.id.optional()
        }) id?: string
    ): Promise<Response> {
        try {
            // console.log("files", files)
            return {
                status: 200,
                data: await this.cdn.validateToCopy(files, dest, id)
            }
        } catch (error) {
            throw error
        }
    }

    async findFolders(
        @Body({
            destination: "directory",
            schema: z.string()
        }) directory: string,
        @Admin() admin: AdminInfo,
        @Session() session: any,

    ): Promise<Response> {
        try {
            var folders = (await this.cdn.findFolder(directory))?.folders
            if (!admin.isSuperAdmin) {

                var allowed = await this.fileManagerPermission.findOne({
                    admin: admin._id,
                    cdn: session["fileManager"]["_id"],
                    "pathsPermission.allowedActions": "view",
                    "pathsPermission.status": true
                })
                folders = this.filterFolders(allowed?.pathsPermission || [], folders || [], "")
            }
            folders = folders?.filter((folder) => folder.name != "")


            if (directory == "") {
                let c = folders?.length || 0

                for (let i = 0; i < (folders as any).length; i++) {
                    // console.log("ff", (folders as any)[i].name, (folders as any)[i].name == "recycle_bin")
                    if ((folders as any)[i].name == "recycle_bin") {
                        var recycle = (folders as any)[i]
                        folders?.splice(i, 1)
                    }
                }
                let data = [{
                    name: "root",
                    id: directory,
                    children: folders
                }]
                // console.log(recycle)
                if (recycle) {
                    data.push(recycle)
                }
                return {
                    status: 200,
                    data
                }
            }
            return {
                status: 200,
                data: folders
            }
        } catch (error) {
            throw error
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
    async upload(
        @Query({
            destination: "directory",
            schema: z.string()
        }) directory: string,
        @Body({
            destination: "rename",
            schema: z.enum(["false", "true"]).default("false")
        }) rename: "false" | "true",
        @Files({
            skip: true,
            destination: "file",
            schema: z.any(),
            config: {
                maxCount: 10,
                name: "file",
                size: 500000000
            },

        }) files: any[],
        @Body({
            destination: "uploadWithState",
            schema: BaseController.booleanFromquery.default("false")
        }) uploadWithState: boolean
    ): Promise<Response> {
        try {
            var paths: any[] = []
            for (let i = 0; i < files.length; i++) {
                paths.push({
                    path: files[i].path,
                    destination: directory + path.basename(files[i].path)
                })
            }


            if (uploadWithState) {
                let result = await this.cdn.uploadWithState(paths[0].path, paths[0].destination, true)
                // console.log("result" ,result)
                return {
                    status: 200,
                    data: result
                }
            }

            else {

                var result = await this.cdn.uploadMany(paths, {
                    rename: rename == "true",

                })
                return {
                    status: 200,
                    data: result
                }
            }

        } catch (error) {
            throw error
        }
    }

    async setFileManager(
        @Body({
            destination: "id",
            schema: BaseController.id.optional()
        }) id: string,
        @Session() session: any
    ): Promise<Response> {
        try {
            if (id) {
                var fileManager = await this.fileManagerRepo.findById(id)
            }
            else {
                var fileManager = await this.fileManagerRepo.getDefault()
            }
            if (fileManager == null) {
                return {
                    status: 500
                }
            }
            session["fileManager"] = fileManager

            return {
                status: 200,
                data: { ok: true },
                session
            }
        } catch (error) {
            throw error
        }
    }

    async init(
        @Session() session: any,
        @Query({
            destination: "id",
            schema: BaseController.id.optional()
        }) id?: string
    ): Promise<Response> {
        try {
            var fileManager = session["fileManager"]
            // console.log(fileManager)
            if (!fileManager) {
                return {
                    status: 400,
                    data: { setId: false }
                }
            }

            if (id) {
                this.cdn.CDN_id = id
                await this.cdn.init(true)
            }
            else
                this.cdn.initFromConfig({
                    type: fileManager.type,
                    config: fileManager.config,
                    hostUrl: fileManager.hostUrl,
                    id: fileManager._id as string || fileManager.id
                })
        } catch (error) {
            throw error
        }
        return {
            next: true
        }
    }

    filterFolders(allowed: any[], folders: any[], root: string = "") {
        for (let i = 0; i < folders.length; i++) {
            if (this.checkFolderAccess(allowed, root + folders[i].name + "/")) {
                folders[i].access = true
            }
            else if (folders[i].children?.length > 0) {
                folders[i].access = false
                folders[i].children = this.filterFolders(allowed, folders[i].children, root + folders[i].name + "/")
            }
            else {
                folders[i].access = false
            }
        }
        return folders
    }

    checkFolderAccess(allowed: any[], path: string) {
        var index = -1
        allowed.findIndex(function (item, i) {
            if (item.path == path) {
                index = i
                return i
            }
        })
        return index != -1
    }

    async copy(
        @Body({
            destination: "files",
            schema: z.array(z.string())
        }) files: string[],
        @Body({
            destination: "directory",
            schema: z.string()
        }) directory: string,
        @Body({
            destination: "rename",
            schema: z.boolean().default(true)
        }) rename: boolean,
        @Admin() admin: AdminInfo
    ): Promise<Response> {
        try {


            let allFiles = 0
            var code = RandomGenarator.generateHashStr(32)
            for (let i = 0; i < files.length; i++) {
                allFiles += files[i].endsWith("/") ? (await this.cdn.getFolderAllFiles(files[i]))?.length || 0 : 1
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
            } as any)

            await cache.set(code, {
                allFiles,
                uploaded: 0,
                percentage: 0
            })
            this.cdn.copy(files, directory, {
                rename,
                isConnected: false,
                cacheStr: code
            })
            return {
                status: 200,
                data: code
            }
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    async search(
        @Body({
            destination: "term",
            schema: z.string()
        }) term: string,
        @Body({
            destination: "directory",
            schema: z.string()
        }) directory: string,
        @Body({
            destination: "searchType",
            schema: z.enum(['any', 'file', 'folder']).default("any")
        }) searchType: "any" | "file" | "folder",
        @Body({
            destination: "nested",
            schema: z.boolean().default(false)
        }) nested: boolean,
        @Admin() admin: AdminInfo
    ): Promise<Response> {
        try {
            var files = await this.cdn.search(term, directory, {
                nested,
                searchType
            }) as any
            var config
            if (!admin.isSuperAdmin) {
                config = await this.fileManagerAdminRepo.findOne({
                    admin: admin._id
                })
            }
            return {
                status: 200,
                data: this.makeUniform(files, config?.showType, directory)
            }
        } catch (error) {
            console.log("error kiri", error)
            throw error
        }
    }

    async zip(
        @Body({
            destination: "files",
            schema: z.array(z.string())
        }) files: string[],
        @Body({
            destination: "name",
            schema: z.string()
        }) name: string,
        @Body({
            destination: "directory",
            schema: z.string()
        }) directory: string,
        @Body({
            destination: "rename",
            schema: z.boolean().default(true)
        }) rename: boolean,
        @Admin() admin: AdminInfo
    ): Promise<Response> {
        try {

            let allFiles = 0
            var code = RandomGenarator.generateHashStr(32)
            for (let i = 0; i < files.length; i++) {
                allFiles += files[i].endsWith("/") ? (await this.cdn.getFolderAllFiles(files[i]))?.length || 0 : 1
            }

            await cache.set(code, JSON.stringify({
                allFiles,
                downloaded: 0,
                percentage: 0
            }))

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
            } as any)

            this.cdn.zip(files, name, directory, {
                rename,
                cacheStr: code
            })
            return {
                status: 200,
                data: code
            }
        } catch (error) {
            throw error
        }
    }

    async unzip(
        @Body({
            destination: "file",
            schema: z.string()
        }) file: string,
        @Body({
            destination: "directory",
            schema: z.string()
        }) directory: string,
        @Body({
            destination: "files",
            schema: z.array(z.string()).optional()
        }) files: string[],
        @Body({
            destination: "rename",
            schema: z.boolean().default(true)
        }) rename: boolean,
        @Admin() admin: AdminInfo,
        @Body({
            destination: "code",
            schema: z.string().optional()
        }) code?: string
    ): Promise<Response> {
        try {
            if (code == undefined) {
                code = RandomGenarator.generateHashStr(32)
            }

            console.log(code)

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
            } as any)
            this.cdn.unzip(file, directory, {
                isConnected: false,
                files,
                rename,
                cacheStr: code
            })

            return {
                status: 200,
                data: code
            }
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    async getZipFileInfo(
        @Body({
            destination: "file",
            schema: z.string()
        }) file: string,
    ): Promise<Response> {
        try {
            return {
                status: 200,
                data: [{
                    name: "root",
                    id: "",
                    children: await this.cdn.getZipFileInfo(file)
                }]
            }
        } catch (error) {
            throw error
        }
    }

    async getCurentCdn(
        @Session() session: any
    ): Promise<Response> {
        try {
            var fileManager = session["fileManager"]
            if (!fileManager) {
                return {
                    status: 404
                }
            }
            return {
                status: 200,
                data: fileManager
            }
        }
        catch (error) {
            throw error
        }
    }

    async getUploadConfig(

        @Admin() admin: AdminInfo,
    ): Promise<Response> {


        try {
            var config = await this.fileManagerAdminRepo.findOne({
                admin: admin._id
            })
            if (config == null) {
                return {
                    status: 200,
                    data: {
                        size: 1.5,
                        uploadTypes: []
                    }
                }
            }
            return {
                status: 200,
                data: {
                    size: 1.5,
                    uploadTypes: config.uploadTypes
                }
            }

        } catch (error) {
            throw error
        }
    }

    async deleteFiles(
        @Body({
            destination: "moveToHidden",
            schema: z.boolean().default(false)
        }) moveToHidden: boolean,
        @Body({
            destination: "files",
            schema: z.array(z.string())
        }) files: string[],
        @Admin() admin: AdminInfo
    ): Promise<Response> {

        try {
            let allFiles = 0
            var code = RandomGenarator.generateHashStr(32)

            for (let i = 0; i < files.length; i++) {
                allFiles += files[i].endsWith("/") && this.cdn.type != "ftp" ? (await this.cdn.getFolderAllFiles(files[i]))?.length || 0 : 1
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
            } as any)


            await cache.set(code, {
                allFiles,
                uploaded: 0,
                percentage: 0
            })

            this.cdn?.removeFiles(files, moveToHidden, code)
            return {
                status: 200,
                data: code
            }
        } catch (error) {
            throw error
        }
    }

    async rename(
        @Body({
            destination: "file",
            schema: z.string()
        }) file: string,
        @Body({
            destination: "name",
            schema: z.string()
        }) name: string,
        @Admin() admin: AdminInfo
    ): Promise<Response> {

        var code = RandomGenarator.generateHashStr(32)
        var allFiles = file.endsWith("/") && this.cdn.type != "ftp" ? (await this.cdn.getFolderAllFiles(file))?.length || 0 : 1

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
        } as any)


        await cache.set(code, {
            allFiles,
            uploaded: 0,
            percentage: 0
        })



        if (file.endsWith("/")) {
            file = file.substring(0, file.length - 1)
        }

        this.cdn.rename(file, name, {
            cacheStr: code
        })
        try {
            return {
                status: 200,
                data: code
            }
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    async getOne(
        @Body({
            destination: "path",
            schema: z.string()
        }) path: string
    ): Promise<Response> {
        try {
            return {
                status: 200,
                data: {}
            }
        } catch (error) {
            throw error
        }
    }

    async move(
        @Body({
            destination: "files",
            schema: z.array(z.string())
        }) files: string[],
        @Body({
            destination: "directory",
            schema: z.string()
        }) directory: string,
        @Body({
            destination: "rename",
            schema: z.boolean().default(false)
        }) rename: boolean,
        @Admin() admin: AdminInfo
    ): Promise<Response> {
        try {
            let allFiles = 0
            var code = RandomGenarator.generateHashStr(32)

            for (let i = 0; i < files.length; i++) {
                allFiles += files[i].endsWith("/") && this.cdn.type != "ftp" ? (await this.cdn.getFolderAllFiles(files[i]))?.length || 0 : 1
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
            } as any)


            await cache.set(code, {
                allFiles,
                uploaded: 0,
                percentage: 0
            })

            this.cdn.move(files, directory, {
                isConnected: false,
                rename,
                cacheStr: code
            })

            return {
                status: 200,
                data: code
            }
        } catch (error) {
            throw error
        }
    }

    async copyToOther(
        @Body({
            destination: "files",
            schema: z.array(z.string())
        }) files: string[],
        @Body({
            destination: "cdn",
            schema: BaseController.id
        }) cdn: string,
        @Body({
            destination: "directory",
            schema: z.string()
        }) directory: string,
        @Body({
            destination: "rename",
            schema: z.boolean().default(false)
        }) rename: boolean,
        @Admin() admin: AdminInfo
    ): Promise<Response> {
        try {

            let allFiles = 0
            var code = RandomGenarator.generateHashStr(32)
            for (let i = 0; i < files.length; i++) {
                allFiles += files[i].endsWith("/") ? (await this.cdn.getFolderAllFiles(files[i]))?.length || 0 : 1
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
            } as any)

            await cache.set(code, {
                allFiles,
                downloaded: 0,
                percentage: 0
            })

            this.cdn.copyToOther(files, cdn, directory, false, {
                rename,
                cacheStr: code
            })

            return {
                status: 200,
                data: code
            }
        } catch (error) {
            throw error
        }
    }


    async checkOperationPossibile(
        files: string
    ) {

    }

    async moveToOther(
        @Body({
            destination: "files",
            schema: z.array(z.string())
        }) files: string[],
        @Body({
            destination: "cdn",
            schema: BaseController.id
        }) cdn: string,
        @Body({
            destination: "directory",
            schema: z.string()
        }) directory: string,
        @Body({
            destination: "rename",
            schema: z.boolean().default(false)
        }) rename: boolean,
        @Admin() admin: AdminInfo
    ): Promise<Response> {
        try {
            let allFiles = 0
            var code = RandomGenarator.generateHashStr(32)
            for (let i = 0; i < files.length; i++) {
                allFiles += files[i].endsWith("/") ? (await this.cdn.getFolderAllFiles(files[i]))?.length || 0 : 1
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
            } as any)

            await cache.set(code, {
                allFiles,
                downloaded: 0,
                percentage: 0
            })

            console.log("before move")
            this.cdn.moveToOther(files, cdn, directory, {
                rename,
                cacheStr: code
            })


            return {
                status: 200,
                data: code
            }
        } catch (error) {
            throw error
        }
    }

    async setPermission(
        @Body({
            destination: "file",
            schema: z.string()
        }) file: string,
        @Body({
            destination: "permission",
            schema: z.string()
        }) permission: string,
        @Body({
            destination: "recursive",
            schema: z.boolean()
        }) recursive: boolean,
    ) {
        try {
            return {
                status: 200,
                data: await this.cdn.setPermission(file, permission, {
                    recursive
                })
            }
        } catch (error) {
            throw error
        }
    }

    async restConctection(): Promise<Response> {
        try {
            return {
                status: 200,
                data: await this.cdn.reset()
            }
        } catch (error) {
            throw error
        }
    }

    async checkPermit(dir: string, accessType: string, extraQuery: any = {}) {
        if (dir == "") {
            dir = "/"
        }
        let exactExists = await this.fileManagerPermission.isExists(
            Object.assign({

                pathsPermission: {


                    $elemMatch: {
                        "path": dir,
                        "allowedActions": accessType,
                        "status": true
                    }
                }
            }, extraQuery)
        )
        if (exactExists) {
            return exactExists
        }
        // console.log("fileManagerPermission", this.getPathQuery(dir, accessType))
        return await this.fileManagerPermission.isExists(Object.assign(
            this.getPathQuery(dir, accessType), extraQuery))
        // return {}
    }

    @Get("/upload/configs")
    async getCurrentPermission(
        @Query({
            destination: "path",
            schema: z.string()
        }) path: string,
        @Admin() admin: AdminInfo,
        @Session() session: any
    ): Promise<Response> {
        // console.log(path)
        if (path != "" && !path.endsWith("/")) {
            path = path + "/"
        }
        let fileManager = session["fileManager"]
        if (!fileManager) {
            return {
                status: 500,
                message: "سرور فایل تنظیم نشده است"
            }
        }
        let fileManagerConfig = await this.fileManagerRepo.findById(fileManager._id)
        let size = Math.min(fileManagerConfig?.maxSize || 1000, admin.maxSize || 1000)
        try {
            let or = this.getPathQuery(path as string, "upload")
            if (or['$or']) {
                for (let i = 0; i < or['$or'].length; i++) {
                    let q: any = or['$or'][i]
                    var config = await this.fileManagerPermission.findOne(Object.assign({
                        admin: admin._id,
                        cdn: fileManager._id
                    }, q), {
                        projection: {
                            "pathsPermission.$": 1,
                            size: 1
                        }
                    })
                    if (config?.pathsPermission[0]) {
                        // console.log(config)
                        let data: any = config?.pathsPermission[0]
                        data["size"] = Math.min(size || 600000, config.size)
                        return {
                            status: 200,
                            data
                        }
                    }

                }

            }
            return {
                status: 400
            }
        } catch (error) {
            throw error
        }
    }

    async checkReadonly(
        accessType: AccessType,
        cdn: string
    ) {
        try {


            if (accessType == "view") {
                return false
            }
            let exists = await this.fileManagerRepo.isExists({
                _id: cdn,
                readonly: true
            })
            return exists
        } catch (error) {
            throw error
        }
    }


    async checkCanChangePath(
        @Query({
            destination: "path",
            schema: z.string()
        }) p: string
    ) {
        try {

            var url = this.makeFileQuery(p)
            var query = {
                file: {
                    $regex: url
                }
            }
            var fileUses = await this.fileUsesRepo.findOne(
                query
            )

            return {
                status: 200,
                data : fileUses != null
            }
        } catch (error) {
            throw error
        }
    }

    checkPathIsLocked(access: string) {
        // return
        return async (session: any, body: any, query: any): Promise<Response> => {
            // console.log("checkPathIsLocked", access, body, query)
            let files = []
            let toFiles = []

            let toCdn = ""

            if (['unzip', 'rename'].includes(access)) {
                files.push(body.file)
            }
            if (["copy", "zip", "move", "copyToOther", "moveToOther", "delete"].includes(access)) {
                files.push(...body.files)
            }

            if (["restore", "hard-delete"].includes(access)) {
                files.push(...body.paths)
            }

            if (["copy", "move", "unzip", "zip", "download-folder"].includes(access)) {
                files.push(body.directory)
            }

            if (["copyToOther", "moveToOther"].includes(access)) {
                toFiles.push(body.directory)
                toCdn = body.cdn
            }


            if (toFiles.length > 0) {
                let queryPaths: string[] = []
                for (let i = 0; i < toFiles.length; i++) {
                    let queryPath = this.getQueryForOperations(toFiles[i])
                    if (!toFiles[i].endsWith("/")) {
                        queryPath.push(toFiles[i])
                    }
                    for (let j = 0; j < queryPath.length; j++) {
                        if (!queryPaths.includes(queryPath[j])) {
                            queryPaths.push(queryPath[j])
                        }
                    }
                }

                let isExists = await this.cdn_LockedPathRepository.isExists({
                    cdn: toCdn,
                    paths: {
                        $in: queryPaths
                    }
                })

                if (isExists) {
                    var operation
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
                        }]
                        )
                    } catch (error) {

                    }
                    return {
                        status: 401,
                        data: {
                            pathLocked: true,
                            operation
                        }
                    }
                }
            }


            let queryPaths: string[] = []
            for (let i = 0; i < files.length; i++) {
                let queryPath = this.getQueryForOperations(files[i])
                if (!files[i].endsWith("/")) {
                    queryPath.push(files[i])
                }
                for (let j = 0; j < queryPath.length; j++) {
                    if (!queryPaths.includes(queryPath[j])) {
                        queryPaths.push(queryPath[j])
                    }
                }
            }




            var fileManager = session["fileManager"]
            let cdn = fileManager._id
            let isExists = await this.cdn_LockedPathRepository.isExists({
                cdn,
                paths: {
                    $in: queryPaths
                }
            })

            if (isExists) {
                var operation
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
                    }]
                    )
                } catch (error) {

                }
                return {
                    status: 401,
                    data: {
                        pathLocked: true,
                        operation
                    }
                }
            }
            return {
                next: true
            }
        }
    }

    async makeThumbNail(
        @Body({
            destination: "path",
            schema: z.string()
        }) file: string
    ): Promise<Response> {
        try {
            this.cdn.makeThumbNail(file)
            console.log("file", file)
            return {

            }
        } catch (error) {
            throw error
        }
    }

    checkAccess(
        accessType: AccessType
        , filesAddress?: string) {
        return async (session: any, body: any, query: any): Promise<Response> => {
            try {

                var admin = session['admin']
                if (!admin) {
                    return {
                        status: 401
                    }
                }

                var fileManager = session["fileManager"]
                if (!fileManager) {
                    return {
                        status: 400,
                    }
                }

                let readonly = await this.checkReadonly(accessType, fileManager._id)


                if (readonly) {
                    return {
                        status: 400,
                        data: {
                            readonly
                        },
                        message: "این سرور فایل در حال حاضر فقط خواندنی است "
                    }
                }


                let isBackup = await this.fileManagerRepo.isExists({
                    isBackup: true,
                    _id: fileManager._id
                })
                if (isBackup && accessType != "view") {
                    return {
                        status: 400,
                        data: {
                            backup: true
                        },
                        message: "عملیات در سرور بک آپ غیر مجاز"
                    }
                }




                if (admin.isSuperAdmin) {
                    return {
                        next: true
                    }
                }

                if (!['move', 'delete', 'copy', 'zip', 'unzip'].includes(accessType)) {
                    try {
                        let dir = accessType == "upload" ? query.directory : body.directory

                        var isExists = await this.checkPermit(dir, accessType, {
                            admin: admin._id,
                            cdn: fileManager._id
                        })

                        if (!isExists)
                            return {
                                status: 401
                            }

                        return {
                            next: true
                        }
                    } catch (error) {
                        throw error
                    }
                }

                else if (accessType == 'delete') {
                    var files: string[] = body.files
                    for (let i = 0; i < files.length; i++) {
                        var dirs = files[i].split("/")
                        dirs = dirs.slice(0, -1)
                        var dir = dirs.length > 0 ? dirs.join("/") + "/" : ""

                        var isExists = await this.checkPermit(dir, accessType, {
                            admin: admin._id,
                            cdn: fileManager._id
                        })

                        if (!isExists)
                            return {
                                status: 401
                            }
                    }
                    return {
                        next: true
                    }
                }

                else if (accessType == 'unzip') {
                    var isExists = await this.checkPermit(body.file, "view", {
                        admin: admin._id,
                        cdn: fileManager._id
                    })
                    if (!isExists)
                        return {
                            status: 401
                        }

                    isExists = await this.checkPermit(body.directory, accessType, {
                        admin: admin._id,
                        cdn: fileManager._id
                    })

                    if (!isExists)
                        return {
                            status: 401
                        }

                    return {
                        next: true
                    }
                }


                else {
                    var files: string[] = body.files
                    for (let i = 0; i < files.length; i++) {
                        var dirs = files[i].split("/")
                        dirs = dirs.slice(0, -1)
                        var dir = dirs.length > 0 ? dirs.join("/") + "/" : ""

                        var isExists = await this.checkPermit(dir, "view", {
                            admin: admin._id,
                            cdn: fileManager._id
                        })

                        if (!isExists)
                            return {
                                status: 401
                            }


                        isExists = await this.checkPermit(body.directory, accessType, {
                            admin: admin._id,
                            cdn: fileManager._id
                        })
                        if (!isExists)
                            return {
                                status: 401
                            }
                    }

                    return {
                        next: true
                    }

                }

            }
            catch (error) {
                throw error
            }
        }
    }

    checkCanDelete(key: string) {

        return async (body: any): Promise<Response> => {
            var files: any = typeof body[key] == "string" ? [body[key]] : body[key]

            var urls: any[] = []
            var querys: any[] = []
            for (let i = 0; i < files.length; i++) {
                var url = this.makeFileQuery(files[i])
                urls.push(url)
                querys.push({
                    file: {
                        $regex: url
                    }
                })
            }
            var fileUses = await this.fileUsesRepo.findOne(
                {
                    $or: querys
                }
            )
            if (fileUses != null) {
                return {
                    status: 401,
                    data: { access: false }
                }
            }
            return {
                next: true
            }
        }
    }

    makeFileQuery(file: string) {

        return this.cdn.getDefaultUrl() + file
    }

    getPathQuery(dir: string, accessType: string): any {
        let ors = []
        var qq: any = {}
        if (dir.split("/").length > 2) {
            var dirs = dir.split("/")
            var paths: string[] = []

            ors.push({

                pathsPermission: {


                    $elemMatch: {
                        "path": "/",
                        "allowedActions": accessType,
                        "status": true,
                        recurcive: true
                    }
                }
            })
            for (let i = 0; i < dirs.length; i++) {
                var q = ""
                for (let j = 0; j < i; j++) {
                    q += dirs[j] + "/"
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
                    })
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
            ]

        }
        ors = ors.reverse()
        qq = {
            $or: ors
        }
        return qq
    }

    getQueryForOperations(dir: string): string[] {
        // let ors = []
        var qq: any = {}
        var paths: string[] = []
        if (dir.split("/").length > 2) {
            var dirs = dir.split("/")
            paths.push("/")
            for (let i = 0; i < dirs.length; i++) {
                var q = ""
                for (let j = 0; j < i; j++) {
                    q += dirs[j] + "/"
                }
                if (q != "") {
                    paths.push(q)
                }
            }

        }
        else {

            paths.push("/")
            paths.push(dir)
            if (dir.includes("/")) {
                paths.push(dir.split("/")[0] + "/")
            }

        }
        return paths
    }

    getCheckAccsess(accessType: AccessType) {
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
        ]

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
        })

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
        })
        this.addRoute("/storage", "post", this.checkStorage.bind(this), {
            preExecs: [
                {
                    func: this.init.bind(this),
                },
            ],

        })
        this.addRoute("/copy/validate", "post", this.validateToCopy.bind(this), {
            preExecs: [{
                func: this.init.bind(this)
            }]
        })
        this.addRoute("/set", "post", this.setFileManager.bind(this))
        this.addRoute("/current", "get", this.getCurentCdn.bind(this))
        this.addRoute("/view", "post", this.view.bind(this), { preExecs: this.getCheckAccsess("view") })
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
        })
        this.addRoute("/recycle/empty", "post", this.emptyRecycle.bind(this), { preExecs: this.getCheckAccsess("view") })
        this.addRoute("/folders", "post", this.findFolders.bind(this), {
            preExecs: [
                {
                    func: this.init.bind(this)
                }
            ]
        })
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
        })
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
        })
        this.addRoute("/search", "post", this.search.bind(this), { preExecs: this.getCheckAccsess("view") })
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
        })
        this.addRoute("/unzip/info", "post", this.getZipFileInfo.bind(this), { preExecs: this.getCheckAccsess("view") })
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
        })
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
        })
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
        })
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
        })

        this.addRoute("/thumbnail", "post", this.makeThumbNail.bind(this), {
            preExecs: [{
                func: this.init.bind(this),
            }]
        })
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
        })

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
        })
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
        })
        this.addRoute("/path/exists", "post", this.validatePath.bind(this), {
            preExecs: [{
                func: this.init.bind(this),
            }]
        })     
        
        this.addRoute("/path/check", "get", this.checkCanChangePath.bind(this), { })

        this.addRoute("/path/exists", "post", this.validatePath.bind(this), {
            preExecs: [{
                func: this.init.bind(this),
            }]
        })

        this.addRoute("/backup/restore", "post", this.restoreFromBackup.bind(this), {
            preExecs: [{
                func: this.init.bind(this),
            }]
        })
        
        this.addRoute("/backup/validate", "post", this.validateBackup.bind(this), {
            preExecs: [{
                func: this.init.bind(this),
            }]
        })

        this.addRoute("/reset", "post", this.restConctection.bind(this))
    }

}
