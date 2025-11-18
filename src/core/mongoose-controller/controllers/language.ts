import ConfigService from "../../services/config";
import { Get, Post, PreExec, Put } from "../../decorators/method";
import BaseController, { ControllerOptions } from "../controller";
import Language from "../repositories/language/model";
import LanguageRepository from "../repositories/language/repository";
import { Admin, Body, Files, Query } from "../../decorators/parameters";
import { Response } from "../../controller";
import { promisify } from "util";
import { z } from "zod"
import fs from "fs"

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

import app from "../../../app"
import ContentRepository from "../repositories/content/repository";
import { AdminInfo } from "../auth/admin/admin-logIn";
import DomainRepository from "../repositories/domain/repository";
import Nginx from "../../services/nginx/nginx";
import { Types } from "mongoose";
import RedirectRepository from "../repositories/redirect/repository";
import FileManagerConfigRepository from "../repositories/fileManagerConfig/repository";
import CDN_Manager from "../../services/fileManager";
import RandomGenarator from "../../random";
export class LanguageController extends BaseController<Language> {
    contentRepo: ContentRepository
    domainRepo: DomainRepository
    nginx: Nginx
    redirectRepo: RedirectRepository
    cdnConfigRepo: FileManagerConfigRepository
    cdn: CDN_Manager
    constructor(baseRoute: string, repo: LanguageRepository, options?: ControllerOptions) {
        super(baseRoute, repo, options)
        this.contentRepo = new ContentRepository()
        this.domainRepo = new DomainRepository()
        this.nginx = new Nginx(this.contentRepo)
        this.redirectRepo = new RedirectRepository()
        this.cdnConfigRepo = new FileManagerConfigRepository()
        this.cdn = new CDN_Manager()
    }

    @Get("/default")
    getDefault() {
        try {
            let sign = ConfigService.getConfig("defaultLanguage")
            return this.findOne({
                sign
            })
        } catch (error) {
            throw error
        }
    }

    async restartAdminPart() {
        app.getPart(ConfigService.getConfig("adminAPI"))?.initLanguages()
    }

    @Post("/file")
    async setLangugaeFile(
        @Files({
            destination: "file",
            config: {
                name: "file",
                maxCount: 1,
                types: ["json"],
                dest: "src/uploads/languages/"
            }
        }) f: any[],
        @Body({
            destination: "language",
            schema: BaseController.id
        }) language: string
    ): Promise<Response> {
        let fileURL = ConfigService.getConfig("serverurl") + f[0].path.replace("src/", "/")
        this.restartAdminPart()
        return this.editById(language, {
            $set: {
                fileURL,
                filePath: f[0].path
            }
        })
    }

    @Get("/domain/cdn")
    async getDomainLocalCDN(
        @Query({
            destination: "domain",
            schema: BaseController.id
        }) domainID: string
    ): Promise<Response> {
        try {
            let domain = await this.domainRepo.findById(domainID)
            if (domain == null) {
                return {
                    status: 404
                }
            }
            if (domain.localCDN) {
                let cdn = await this.cdnConfigRepo.findById(domain.localCDN)
                return {
                    status: 200,
                    data: cdn
                }
            }
            return {
                status: 404
            }

        } catch (error) {
            throw error
        }
    }


    mergeJsons(json1: any, json2: any): string {

        function mergeValues(value1: any, value2: any): any {
            if (typeof value2 === 'string') {
                return value1;
            } else if (typeof value2 === 'object') {
                const mergedDict: any = {};
                for (const key in value1) {
                    if (key in value2) {
                        mergedDict[key] = mergeValues(value1[key], value2[key]);
                    }
                }
                for (const key in value2) {
                    if (!(key in mergedDict)) {
                        mergedDict[key] = value2[key];
                    }
                }
                return mergedDict;
            } else {
                return value1;
            }
        }

        const mergedDict = mergeValues(json1, json2);

        return mergedDict;
    }

    @Post("/panel/update")
    async editPanelUpdate(
        @Body({
            destination: "language",
            schema: BaseController.id
        }) id: string,
        @Body({
            destination: "json",
            schema: BaseController.search
        }) json: any
    ): Promise<Response> {
        const language = await this.repository.findById(id)
        if (language == null) {
            return {
                status: 404,
                data: {}
            }
        }

        try {
            let currentJSON = JSON.parse((await readFile(language.panelFilePath)).toString())
            await writeFile(language.panelFilePath, JSON.stringify(this.mergeJsons(json, currentJSON)))
            this.restartAdminPart()

            return {
                status: 200
            }
        } catch (error) {
            throw error
        }


    }


    @Get("/panel/file")
    async getPanelFile(@Query({
        destination: "language",
        schema: BaseController.id
    }) id: string
    ): Promise<Response> {
        const language = await this.repository.findById(id)
        if (language == null) {
            return {
                status: 404,
                data: {}
            }
        }
        try {
            let currentJSON = JSON.parse((await readFile(language.panelFilePath)).toString())


            return {
                status: 200,
                data: currentJSON
            }
        } catch (error) {
            console.log(error)
            throw error
        }

    }

    @Put("")
    async updateLanguage(
        @Query({
            destination: "id",
            schema: BaseController.id
        }) id: string,
        @Body({
            schema: z.object({
                title: z.string(),
                panelTitle: z.string(),
                direction: z.enum(["ltr", "rtl"]),
                status: z.boolean(),
                isDefault: z.boolean().default(false),
                showInLangList: z.boolean().default(false),
                index: z.boolean(),
                isDomain: z.boolean(),
                domainCDN: z.boolean().optional(),
                countries: z.array(z.string()),
                domain: BaseController.id.optional(),
            })
        }) data: any
    ): Promise<Response> {
        try {
            // console.log("data" , data)
            let lang = await this.repository.findById(id)
            let changeMap = []
            let staticChangeMap = []
            if (lang == null) {
                return {
                    status: 404
                }
            }
            var contents = await this.contentRepo.findAll({
                language: id
            })

            let urls: string[] = []
            if (lang.domain) {
                if (!data.isDomain) {
                    for (let i = 0; i < contents.length; i++) {
                        let u = await this.contentRepo.makeURL(contents[i].originalUrl, contents[i].isStatic, {
                            type: contents[i].type,
                            language: contents[i].language,
                            category: contents[i].category?.toString(),
                            // domain: data.domain,
                            isDomain: data.isDomain
                        })
                        if (contents[i].isStatic) {
                            staticChangeMap.push({
                                from: contents[i].url,
                                to: u,
                                id: contents[i]._id,
                            })
                        }

                        else {
                            changeMap.push({
                                from: contents[i].url,
                                to: u,
                                id: contents[i]._id,
                                type: contents[i].type
                            })
                        }



                        urls.push(u)

                    }
                }
                else if (lang.domain != data.domain) {
                    for (let i = 0; i < contents.length; i++) {
                        let u = await this.contentRepo.makeURL(contents[i].originalUrl, contents[i].isStatic, {
                            type: contents[i].type,
                            language: contents[i].language,
                            category: contents[i].category?.toString(),
                            domain: data.domain,
                            isDomain: data.isDomain
                        })

                        changeMap.push({
                            from: contents[i].url,
                            to: u,
                            id: contents[i]._id,
                            type: contents[i].type
                        })
                        urls.push(u)
                    }
                }
            }
            else {
                if (data.isDomain) {
                    for (let i = 0; i < contents.length; i++) {


                        let u = await this.contentRepo.makeURL(contents[i].originalUrl, contents[i].isStatic, {
                            type: contents[i].type,
                            language: contents[i].language,
                            category: contents[i].category?.toString(),
                            domain: data.domain,
                            isDomain: data.isDomain
                        })

                        if (contents[i].isStatic) {
                            staticChangeMap.push({
                                from: contents[i].url,
                                to: u,
                                id: contents[i]._id
                            })
                        }

                        else {
                            changeMap.push({
                                from: contents[i].url,
                                to: u,
                                id: contents[i]._id,
                                type: contents[i].type
                            })
                        }

                        urls.push(u)
                    }
                }
            }

            if (data.domain != undefined) {
                let domain = await this.domainRepo.findById(data.domain)
                if (domain != null && data.domainCDN) {
                    if (domain.localCDN == undefined) {
                        let localCDN = await this.cdnConfigRepo.getInertnal()
                        if (localCDN != null) {
                            try {
                                this.cdn.CDN_id = localCDN._id
                                await this.cdn.init()
                                let bucketName = RandomGenarator.generateHashStr(6)
                                await this.cdn.makeBucket(bucketName)
                                let insertData: any = JSON.parse(JSON.stringify(localCDN))
                                delete insertData["_id"]
                                insertData['config']['bucket'] = bucketName
                                insertData["filesInfo"] = {}
                                insertData["usedSize"] = 0
                                insertData.title = domain.domain
                                insertData.hostUrl = (domain.sslType == "none" ? "http://" : "https://") + domain.domain + "/files/"
                                let newCDN = await this.cdnConfigRepo.insert(insertData)

                                await this.domainRepo.updateOne({
                                    _id: domain._id
                                }, {
                                    $set: {
                                        localCDN: newCDN._id,
                                        bucketName
                                    }
                                })

                                await this.nginx.init()

                            } catch (error) {
                                console.log(error)
                            }
                        }
                    }
                }
            }

            let existsUrl = await this.contentRepo.findAll({
                url: {
                    $in: urls
                }
            })
            await this.repository.updateOne({
                _id: id
            }, {
                $set: data
            })
            for (let i = 0; i < changeMap.length; i++) {
                this.contentRepo.updateOne({
                    _id: changeMap[i].id
                }, {
                    $set: {
                        url: changeMap[i].to
                    }
                })
                await this.redirectRepo.updateOne({
                    status: {
                        $ne: false
                    },
                    $or: [{
                        to: changeMap[i].id.toHexString(),
                    },
                    {
                        to: changeMap[i].from,
                    },
                    ],
                    type: "language"
                }, {
                    $set: {
                        status: false
                    }
                })

                await this.redirectRepo.insert({
                    type: "language",
                    from: changeMap[i].from,
                    to: changeMap[i].id,
                    code: "302",
                    isAutomatic: true,
                    domain: lang?.domain,
                    fromStatic: true,
                    toStatic: false,
                    language: id
                } as any)
            }

            for (let i = 0; i < staticChangeMap.length; i++) {
                this.contentRepo.updateOne({
                    _id: staticChangeMap[i].id
                }, {
                    $set: {
                        url: staticChangeMap[i].to
                    }
                })

                await this.redirectRepo.updateOne({
                    status: {
                        $ne: false
                    },

                    $or: [{
                        to: changeMap[i].id.toHexString(),
                    },
                    {
                        to: changeMap[i].from,
                    }
                    ],
                    type: "language"
                }, {
                    $set: {
                        status: false
                    }
                })


                await this.redirectRepo.insert({
                    type: "language",
                    from: changeMap[i].from,
                    to: changeMap[i].id,
                    code: "302",
                    isAutomatic: true,
                    domain: lang?.domain,
                    fromStatic: true,
                    toStatic: false,
                    language: id
                } as any)
            }
            this.nginx.init()

            return {
                status: 200
            }

        } catch (error) {
            console.log(error)
            throw error
        }

    }

    getDynamicRedirects(changeMap: {
        from: string,
        to: string,
        id: Types.ObjectId,
        type: string
    }[], languageSign: string, domain?: string) {
        let result: any = {}
        let sign = `/${language}/`
        for (let i = 0; i < changeMap.length; i++) {
        }
    }

    @Post("/count")
    async getLanguageContents(
        @Query({
            destination: "language",
            schema: BaseController.id
        }) language: string
    ): Promise<Response> {
        try {
            let contents = await this.contentRepo.getcount({
                language
            })
            return {
                data: contents
            }
        } catch (error) {
            throw error
        }
        return {}
    }


    @PreExec({
        method: "post",
        route: "/validate"
    })
    async validate(
        @Admin() admin: AdminInfo
    ): Promise<Response> {
        // console.log("admin")
        return {
            next: true
        }
    }

    @Post("/validate")
    async validateChangeDomain(
        @Body({
            schema: z.object({
                id: BaseController.id,
                isDomain: z.boolean(),
                domain: BaseController.id.optional()
            })
        }) data: any
    ): Promise<Response> {
        try {
            let lang = await this.repository.findById(data.id)
            let changeMap = []
            if (lang == null) {
                return {
                    status: 404
                }
            }
            var contents = await this.contentRepo.findAll({
                language: data.id
            })

            let urls: string[] = []
            if (lang.domain) {
                if (!data.isDomain) {
                    for (let i = 0; i < contents.length; i++) {
                        let u = await this.contentRepo.makeURL(contents[i].originalUrl, contents[i].isStatic, {
                            type: contents[i].type,
                            language: contents[i].language,
                            category: contents[i].category?.toString(),
                            domain: data.domain,
                            isDomain: data.isDomain
                        })

                        changeMap.push({
                            from: contents[i].url,
                            to: u
                        })

                        urls.push(u)

                    }
                }
                else if (lang.domain != data.domain) {

                }
            }
            else {
                if (data.isDomain) {
                    for (let i = 0; i < contents.length; i++) {


                        let u = await this.contentRepo.makeURL(contents[i].originalUrl, contents[i].isStatic, {
                            type: contents[i].type,
                            language: contents[i].language,
                            category: contents[i].category?.toString(),
                            domain: data.domain,
                            isDomain: data.isDomain
                        })

                        changeMap.push({
                            from: contents[i].url,
                            to: u,
                        })
                        urls.push(u)
                    }
                }
            }

            let existsUrl = await this.contentRepo.findAll({
                url: {
                    $in: urls
                }
            })

            return {
                data: {
                    isOk: existsUrl.length == 0,
                    existsUrl: existsUrl,
                    total: contents.length,
                    changeMap
                }
            }
        } catch (error) {
            throw error
        }
    }


    @Get("/domain/search")
    async checkDomainExists(
        @Query({
            destination: "language",
            schema: BaseController.id.optional()
        }) language: string

    ): Promise<Response> {
        try {
            let langDomains = await this.repository.findAll({
                _id: {
                    $ne: language
                },
                domain: {
                    $exists: true
                }
            })
            let domains = []
            for (let i = 0; i < langDomains.length; i++) {
                domains.push(langDomains[i].domain)
            }

            return {
                data: await this.domainRepo.paginate({
                    _id: {
                        $nin: domains
                    },
                    isDefault: {
                        $ne: true
                    },
                    adminDomain: {
                        $ne: true
                    }
                }, 200, 1)
            }

        } catch (error) {
            throw error
        }
    }


    async create(data: Language, ...params: [...any]): Promise<Response> {
        try {
            let r = await super.create(data)
            if (r.status == 200) {
                if (data.domain != undefined) {
                    let domain = await this.domainRepo.findById(data.domain as string)
                    if (domain != null && data.domainCDN) {
                        if (domain.localCDN == undefined) {
                            let localCDN = await this.cdnConfigRepo.getInertnal()
                            if (localCDN != null) {
                                try {
                                    this.cdn.CDN_id = localCDN._id
                                    await this.cdn.init()
                                    let bucketName = RandomGenarator.generateHashStr(6)
                                    await this.cdn.makeBucket(bucketName)
                                    let insertData: any = JSON.parse(JSON.stringify(localCDN))
                                    delete insertData._id
                                    insertData['config']['bucket'] = bucketName
                                    insertData.title = domain.domain
                                    insertData.hostUrl = (domain.sslType == "none" ? "http://" : "https://") + domain.domain + "/files/"
                                    let newCDN = await this.cdnConfigRepo.insert(insertData)

                                    await this.domainRepo.updateOne({
                                        _id: domain._id
                                    }, {
                                        $set: {
                                            localCDN: newCDN._id,
                                            bucketName
                                        }
                                    })

                                    await this.nginx.init()

                                } catch (error) {

                                }
                            }
                        }
                    }
                }
            }
            return r
        } catch (error) {
            throw error
        }
    }

    @Get("/domain/clear")
    async clearDomain(
        @Query({
            destination: "domainID",
            schema: BaseController.id
        }) domainID: string
    ): Promise<Response> {
        try {
            let domain = await this.domainRepo.findById(domainID)
            if (domain?.localCDN) {
                let localCDN = await this.cdnConfigRepo.findById(domain.localCDN)
                if (localCDN == null) {
                    return {
                        status: 200
                    }
                }
                this.cdn.CDN_id = localCDN._id

                await this.cdn.init()
                await this.cdn.removeBucket(domain.bucketName as string)
                await this.domainRepo.updateOne({
                    _id : domain._id
                }, {
                    $unset : {
                        localCDN : 1,
                        bucketName: 1
                    }
                })
                await this.cdnConfigRepo.deleteById(localCDN._id)



            }

            return { 
                status : 200
            }
        } catch (error) {
            throw error
        }
    }


    async searchHelper(queryParam?: any): Promise<any> {
        let q = await super.searchHelper(queryParam)
        if (queryParam["_id$nin"]) {
            if (q["_id"]) {
                q["_id"]["$nin"] = queryParam["_id$nin"]
            }
            else {
                q["_id"] = {
                    $nin: queryParam["_id$nin"]
                }
            }
        }
        return q
    }

    initApis(): void {
        super.initApis()
        this.addRouteWithMeta("/language/search", "get", this.search.bind(this), BaseController.searcheMeta)
        this.addRoute("s/search/list", "get", this.getSearchList.bind(this))
        this.addRouteWithMeta("", "get", this.findById.bind(this), {
            "1": {
                index: 0,
                source: "query",
                destination: "id",
                schema: BaseController.id
            },
            absolute: false
        })
    }
}

const language = new LanguageController("/language", new LanguageRepository(), {
    searchFilters: {
        title: ["eq", "reg"],
        _id: ["eq", "list", "nin"],
        status: ["eq"]
    },
    insertSchema: z.object({
        title: z.string(),
        panelTitle: z.string(),
        sign: z.string(),
        direction: z.enum(["ltr", "rtl"]),
        status: z.boolean(),
        isDefault: z.boolean().default(false),
        domainCDN: z.boolean().optional(),
        showInLangList: z.boolean().default(false),
        index: z.boolean(),
        isDomain: z.boolean(),
        countries: z.array(z.string()),
        domain: BaseController.id.optional()
    })
})

export default language