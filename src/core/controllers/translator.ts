import { Get, Post } from "../decorators/method";
import { Body, Query } from "../decorators/parameters";
import Controller, { Response } from "../controller";
import { z } from "zod"
import translatorFunc from "../translator";
import fs from "fs"
import { DiskFileManager } from "../services/fileManager";
import RoleRepository from "../mongoose-controller/repositories/role/repository";
import DBSchemaRepository from "../mongoose-controller/repositories/dbSchema/repository";
import ActionRepository from "../mongoose-controller/repositories/action/repository";
import BaseController, { paginationConfigs } from "../mongoose-controller/controller";
import TranslationLogRepository from "../mongoose-controller/repositories/translationLog/repository";



export class Translator extends Controller {
    roleRepo: RoleRepository
    dbSchemaRepo: DBSchemaRepository
    actionRepo: ActionRepository
    translationLogRepo: TranslationLogRepository
    constructor(baseRoute: string, roleRepo: RoleRepository) {
        super(baseRoute)
        this.roleRepo = roleRepo
        this.dbSchemaRepo = new DBSchemaRepository()
        this.actionRepo = new ActionRepository()
        this.translationLogRepo = new TranslationLogRepository()

    }

    @Get("")
    async translate(
        @Query({
            destination: "texts",
            schema: z.array(z.string()).or(z.string())
        }) texts: string[] | string,
        @Query({
            destination: "source",
            schema: z.string().default("en")
        }) source: string,
        @Query({
            destination: "destination",
            schema: z.string().default("fa")
        }) destination: string
    ): Promise<Response> {
        try {
            if (typeof texts == "string") {
                texts = [texts]
            }
            let response: any = {}
            for (let i = 0; i < texts.length; i++) {
                response[texts[i]] = await translatorFunc( texts[i].replace(/-/g, " "), source, destination)
                if (i % 5 == 0) {
                    await this.sleep()
                }
            }
            return {
                status: 200,
                data: response
            }
        } catch (error: any) {
            console.log("err", error)
            throw error
        }
    }


    @Post("/async")
    async asyncTranslate(
        @Body({
            destination: "texts",
            schema: BaseController.search
        }) texts: any,
        @Body({
            destination: "fileLocate",
            schema: z.enum(["panel", "server"]).default("panel")
        }) fileLocate: string,
        @Body({
            destination: "source",
            schema: z.string().default("en")
        }) source: string,
        @Body({
            destination: "destination",
            schema: z.string().default("fa")
        }) destination: string
    ): Promise<Response> {
        try {
            let data = await this.translationLogRepo.insert({
                source,
                destination,
                fileLocate,
                all: Object.keys(texts).length,
                translated: 0,
                translation: {}
            } as any)
            this.doAsyncTranslate(data._id, texts, source, destination)
            return {
                data
            }
        } catch (error) {
            throw error
        }
        return {}
    }


    async doAsyncTranslate(logId: string, data: any, source: string, destination: string) {
        try {
            let texts: string[] = []
            let response: any = {}
            let result: any = {}
            // for (let i = 0; i < texts.length; i++) {

            let i = 1
            for (const key in data) {
                result[key] = await translatorFunc(data[key], source, destination)
                if (i % 5 == 0) {
                    await this.sleep()
                }
                await this.translationLogRepo.findByIdAndUpdate(logId, {
                    $set: {
                        translation: result,
                        translated: i
                    }
                })
                i+=1
            }
            await this.translationLogRepo.findByIdAndUpdate(logId, {
                $set: {
                    status: "success"
                }
            })
        } catch (error: any) {
            await this.translationLogRepo.findByIdAndUpdate(logId, {
                $set: {
                    status: "error"
                }
            })
        }

    }

    @Get("/async")
    async getAsyncTranslate(
        @Query({
            destination : "id",
            schema : BaseController.id
        }) id : string
    ) { 
        try {
            return {
                data : await this.translationLogRepo.findById(id)
            }
        } catch (error) {
            throw error
        }
    }

    @Get("/async/runnig")
    async getRunningAsyncTranslate(
        
    ) {
        try {
            return {
                data : await this.translationLogRepo.findAll({
                    // status : "pending"
                })
            }
        } catch (error) {
            throw error
        }
    }

    async sleep() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve({})
            }, 3000)
        })
    }

    @Get("/texts")
    async getTexts(): Promise<Response> {
        try {
            let paginations: any = {}
            for (let i = 0; i < paginationConfigs.length; i++) {
                paginations[paginationConfigs[i].tableLabel] = {}

                for (const key in paginationConfigs[i].fields) {
                    paginations[paginationConfigs[i].tableLabel][key] = paginationConfigs[i].fields[key].fa_title
                }
            }


            let actions = this.roleRepo.actions

            let resActions: any = {}
            for (const key in actions) {
                resActions[key] = {}
                let moduleActions = actions[key]
                for (let i = 0; i < moduleActions.length; i++) {
                    resActions[key][moduleActions[i].name] = moduleActions[i].showTitle
                }
            }

            let schemas: any = {}
            const dbSchemas = await this.dbSchemaRepo.findAll({})

            for (let i = 0; i < dbSchemas.length; i++) {
                // console.log(dbSchemas[i].collectionSchema)
                schemas[dbSchemas[i].collectionName] = this.getCollectionSchema(dbSchemas[i].collectionSchema.toJSON())
            }

            const dbactions = await this.actionRepo.findAll({})
            let actionsTexts: any = {}
            for (let i = 0; i < dbactions.length; i++) {
                actionsTexts[dbactions[i].url + "&" + dbactions[i].method] = dbactions[i].title
            }
            return {
                data: {
                    msgs: this.controllersTextsArrayToJson((await this.getControllersTexts()).concat(... await this.getServicesTexts())),
                    moduleActions: resActions,
                    schemas,
                    actions: actionsTexts,
                    paginations
                }

            }
        } catch (error) {
            throw error
        }
    }

    controllersTextsArrayToJson(texts: string[]) {
        var json: any = {}
        for (let i = 0; i < texts.length; i++) {
            json[texts[i]] = texts[i]
        }
        return json
    }


    getCollectionSchema(collectionSchema: any, schema: any = {}, name: string = "") {
        for (const key in collectionSchema) {
            schema[name + key] = collectionSchema[key]["persianName"]
            if (collectionSchema[key].sub) {
                schema = this.getCollectionSchema(collectionSchema[key].sub, schema, name + key + ".")
            }
        }

        return schema

    }

    async getControllersTexts() {
        let folders = [
            "build/core/mongoose-controller/",
            "build/core/mongoose-controller/controllers/",
            "build/core/mongoose-controller/auth/admin/",
            "build/core/mongoose-controller/basePage/",
            "build/apps/admin/controllers/"
        ]
        let results: string[] = []
        let texts: string[] = []
        // fs.red
        for (let i = 0; i < folders.length; i++) {
            // const element = folders[i];
            //    results.push( ... await this.findFolderFiles(folders[i]))
            let files = await this.findFolderFiles(folders[i])
            for (let j = 0; j < files.length; j++) {
                let res = await this.findControllerTexts(files[j])
                for (let z = 0; z < res.length; z++) {
                    if (!texts.includes(res[z]) && res[z] != "") {
                        texts.push(res[z])
                    }
                }
            }


        }
        return texts
    }

    async getServicesTexts() {
        let folders = [
            "build/core/mongoose-controller/repositories/",
            "build/repositories/",
            "build/core/services/",
            "build/core/messaging/"
        ]
        let results: string[] = []
        let texts: string[] = []
        // fs.red
        for (let i = 0; i < folders.length; i++) {
            // const element = folders[i];
            //    results.push( ... await this.findFolderFiles(folders[i]))
            let files = await this.findFolderFiles(folders[i])
            for (let j = 0; j < files.length; j++) {
                let res = await this.findServiceTexts(files[j])
                for (let z = 0; z < res.length; z++) {
                    // const element = array[z];
                    if (!texts.includes(res[z]) && res[z] != "") {
                        texts.push(res[z])
                    }

                }
            }


        }
        return texts
    }

    async findControllerTexts(file: string) {
        let texts: string[] = []
        let fileContent = await DiskFileManager.readFile(file)
        for (let i = 0; i < fileContent.length; i++) {
            if (fileContent[i].includes("message:")) {
                let lineData = fileContent[i].split("\"")
                if (lineData.length > 2) {

                    texts.push(lineData[1])
                }
            }
        }
        return texts
    }

    async findServiceTexts(file: string) {
        let texts: string[] = []
        let fileContent = await DiskFileManager.readFile(file)
        for (let i = 0; i < fileContent.length; i++) {
            if (fileContent[i].includes("new Error(")) {
                let lineData = fileContent[i].split("\"")
                if (lineData.length > 2) {

                    texts.push(lineData[1])
                }
            }
        }
        return texts
    }

    async findFolderFiles(folder: string) {
        let files = await DiskFileManager.scanDir(folder)
        let res: string[] = []
        for (let i = 0; i < files.length; i++) {
            if (files[i].type == "file") {
                // console.log(i, files[i], files[i].children?.length)
                res.push(folder + files[i].id)
            }
            if (files[i].type == "dir") {
                res.push(... await this.findFolderFiles(folder + files[i].id))
            }
        }
        return res
    }


}


// const translator = new Translator("/translator")
// export default translator