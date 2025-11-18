import { z } from "zod";
import BaseController, { ControllerOptions } from "../controller";
import Domain from "../repositories/domain/model";
import DomainRepository from "../repositories/domain/repository";
import { Delete, Get, Post, PreExec, Put } from "../../decorators/method";
import { Admin, Body, Query, Session } from "../../decorators/parameters";
import LanguageRepository from "../repositories/language/repository";
import { Response } from "../../controller";
import Nginx from "../../services/nginx/nginx";
import { Route } from "../../application";
import ContentRepository from "../repositories/content/repository";
import { AdminInfo } from "../auth/admin/admin-logIn";
import AdminRepository from "../repositories/admin/repository";
import { BaseAdmin } from "../repositories/admin/model";
import DomainRedirectRepository from "../repositories/domainRedirect/repository";
import GoogleApiTokenRepository from "../repositories/googleApiToken/repository";
import SystemConfigRepository from "../repositories/system/repository";
import axios from "axios";
import FileManagerConfigRepository from "../repositories/fileManagerConfig/repository";
import RandomGenarator from "../../random";
import CDN_Manager from "../../services/fileManager";


export class DomainController extends BaseController<Domain> {
    langRepo: LanguageRepository
    nginx: Nginx
    domainRedirectRepo: DomainRedirectRepository
    adminRepo: AdminRepository<BaseAdmin>
    googleApiTokenRepo: GoogleApiTokenRepository
    systemConfigRepo: SystemConfigRepository
    cdnConfigRepo : FileManagerConfigRepository
    cdn: CDN_Manager
    constructor(baseRoute: string, repo: DomainRepository, options: ControllerOptions & {
        adminRepo: AdminRepository<BaseAdmin>
    }) {
        super(baseRoute, repo, options)
        this.langRepo = new LanguageRepository()
        this.nginx = new Nginx(new ContentRepository())
        this.domainRedirectRepo = new DomainRedirectRepository()
        this.adminRepo = options.adminRepo
        this.initNginx()
        this.repository.initDomainsNotification()
        this.googleApiTokenRepo = new GoogleApiTokenRepository()
        this.systemConfigRepo = new SystemConfigRepository()
        this.cdnConfigRepo = new FileManagerConfigRepository()
        this.cdn = new CDN_Manager()
    }

    async getConfig(
        @Body({
            destination: "domain",
            schema: BaseController.id
        }) domain: string
    ): Promise<Response> {
        try {
            let config = await this.googleApiTokenRepo.findOne({
                domains: domain
            })
            var conf = await this.systemConfigRepo.getConfigValue("google_credential")
            var apiServer = await this.systemConfigRepo.getConfigValue("google_api_server")
            var apikey = await this.systemConfigRepo.getConfigValue("google_api_key")

            if (config == null || config == null) {
                return {
                    status: 200,
                    data: {
                        exists: false
                    }
                }
            }





            return {

            }

        } catch (error) {
            throw error
        }
    }


    @Post("/script", {
        contentType: "application/x-www-form-urlencoded"
    })
    async setJsScript(
        @Body({
            schema: z.object({
                key: z.string(),
                content: z.string()
            })
        }) data: any,
        @Body({
            destination: "domain",
            schema: BaseController.id
        }) domainId: string
    ): Promise<Response> {
        try {
            let domain = await this.repository.findOne({
                _id: domainId
            })
            if (domain == null) {
                return {
                    status: 404,
                    message: "not found"
                }
            }

            let scripts: any[] = domain?.scripts as any[] || []

            let exists = false
            for (let i = 0; i < scripts.length; i++) {
                if (scripts[i].key == data.key) {
                    exists = true
                    scripts[i] = data
                }
            }
            if (!exists) {
                scripts.push(data)
            }

            return this.editById(domainId, {
                $set: {
                    scripts
                }
            })

        } catch (error) {
            throw error
        }
    }


    @Get("/script")
    async getJsScripts(
        @Query({
            schema: BaseController.id,
            destination: "domain"
        }) domainId: string
    ): Promise<Response> {
        try {
            let domain = await this.repository.findOne({
                _id: domainId
            })
            if (domain == null) {
                return {
                    status: 404,
                    message: "not found"
                }
            }

            return {
                data: domain?.scripts || []
            }

        } catch (error) {
            throw error
        }
    }

    @Get("/tools")
    async getDomainToolsToken(
        @Query({
            destination: "domain",
            schema: BaseController.id
        }) domainId: string
    ): Promise<Response> {
        try {
            let tools = await this.googleApiTokenRepo.findAll({
                domains: domainId
            })
            return {
                data: tools,
                status: 200
            }
        } catch (error) {
            throw error
        }
    }

    async initNginx() {
        try {
            await this.nginx.init()
        } catch (error) {
            throw error
        }
    }

    @Post("/password")
    async setPaswword(
        @Body({
            destination: "password",
            schema: z.string().min(8)
        }) password: string,
        @Admin() admin: AdminInfo,
        @Session() session: any
    ): Promise<Response | undefined> {
        try {
            if (!admin.isSuperAdmin) {
                return {
                    status: 400,
                    message: "این قسمت مخصوص ادمین اصلی است"
                }
            }
            var verifed = await this.adminRepo.comparePassword(admin, password)
            if (verifed) {

                var expired = Date.now() + (1000 * 300)
                session["domain_expired"] = expired
                return {
                    status: 200,
                    data: { expired },
                    message: "موفق",
                    session
                }
            }
            else {
                return {
                    status: 400,
                    message: "رمز غلط"
                }
            }
        } catch (error) {
            throw error
        }
    }


    @PreExec({
        method: "post",
        route: ""
    })
    @PreExec({
        method: "put",
        route: ""
    })
    @PreExec({
        method: "delete",
        route: ""
    })
    @PreExec({
        method: "get",
        route: ""
    })
    @PreExec({
        method: "post",
        route: "/change"
    })
    checkPasswordExpired(@Session() session: any): Response {
        var expired = session["domain_expired"]
        if (!expired || expired < Date.now()) {
            return {
                status: 403,
                data: { sendPassword: true },
                message: "عدم دسترسی"
            }
        }
        return {
            next: true
        }
    }


    @Get("/password/expire")
    getPasswordExpire(
        @Session() session: any
    ): Response {
        var expired = session["domain_expired"]
        if (!expired || expired < Date.now()) {
            return {
                status: 403,
                data: { sendPassword: true },
                message: "عدم دسترسی"
            }
        }
        return {
            // next: true
            status: 200,
            data: { expired }
        }
    }



    @Post("/password/expire")
    expirePassword(
        @Session() session: any
    ): Response {
        session["domain_expired"] = Date.now() - 10000
        return {
            session,
            status: 200
        }
    }

    @Post("/change")
    async changeDomain(
        @Body({
            destination: "source",
            schema: BaseController.id
        }) source: string,
        @Body({
            destination: "destination",
            schema: BaseController.id
        }) destination: string
    ): Promise<Response> {
        try {

        } catch (error) {

        }

        return {

        }
    }


    @Get("/default")
    async getDefaultDomain(): Promise<Response> {
        try {
            return this.findOne({
                isDefault: true
            })
        } catch (error) {
            throw error
        }
    }

    @Get("/admin")
    async getAdminDomain(): Promise<Response> {
        try {
            return this.findOne({
                adminDomain: true
            })
        } catch (error) {
            throw error
        }
    }

    @Put("")
    async updateDomain(
        @Query({
            schema: BaseController.id,
            destination: "id"
        }) id: string,
        @Body({
            schema: z.object({
                isDefault: BaseController.booleanFromquery.default("false"),
                sslType: z.enum([
                    "none",
                    "certificate",
                    "interim"
                ]),
                public: z.string().optional(),
                private: z.string().optional(),
                "options-ssl": z.string().optional(),
                "ssl-dhparams": z.string().optional(),
                adminDomain: BaseController.booleanFromquery.default("false"),
                cptchaInfo: z.object({
                    site_key: z.string().optional(),
                    secret_key: z.string().optional()
                }).optional()
            })
        }) data: any
    ): Promise<Response> {
        try {

            if (data.public) {
                data.certificate = {
                    public: data.public,
                    private: data.private,
                    "options-ssl": data["options-ssl"],
                    "ssl-dhparams": data["ssl-dhparams"],

                }
            }
            const domain = await this.repository.findById(id)
            if (domain == null) {
                return {
                    status: 404
                }
            }

            if (data.isDefault == true && data.adminDomain == true) {
                return {
                    status: 400,
                    message: "دامنه نمیتواند همزمان برای سایت و پنل ادمین استفاده شود"
                }
            }

            if (data.adminDomain == true) {
                await this.repository.updateOne({
                    adminDomain: true
                }, {
                    $set: {
                        adminDomain: false
                    }
                })
            }

            if (data.cptchaInfo) {
                await this.repository.updateOne({
                    _id: id
                }, {
                    $set: {
                        cptchaInfo: data.cptchaInfo
                    }
                })
            }

            if (data.isDefault && domain.isDefault != true) {
                let language = await this.langRepo.findOne({
                    domain: id
                })

                if (language != null) {
                    return {
                        status: 400,
                        message: "این دامنه برای یک زبان اختصاصی است و نمیتوان ب عنوان دامنه پیشفرض از آن استفاده کرد",
                        data: {
                            language
                        }
                    }
                }

                let exDefualt = await this.repository.findOneAndUpdate({
                    isDefault: true
                }, {
                    $set: {
                        isDefault: false
                    }
                })
                await this.repository.updateOne({
                    _id: id
                }, {
                    $set: data
                })

                await this.domainRedirectRepo.updateMany({
                    status: true,
                    from: id
                }, {
                    $set: {
                        status: false
                    }
                })

                if (exDefualt != null) {
                    let r = await this.domainRedirectRepo.insert({
                        from: exDefualt._id,
                        to: id,
                    } as any)
                }
                this.nginx.init()

            }
            else if (domain.isDefault && data.isDefault == false) {
                return {
                    status: 400,
                    message: "دامنه پیشفرض قابل تغییر نیست( ابتدا دامنه پیشفرض جدید را مشخص کنید)",
                    data: {
                        isDefault: true
                    }
                }
            }
            else {
                await this.repository.updateOne({
                    _id: id
                }, {
                    $set: data
                })
            }

            return {
                status: 200
            }


        } catch (error) {
            console.log(error)
            throw error
        }
    }

    @Delete("")
    async deleteDomain(
        @Query({
            destination: "id",
            schema: BaseController.id
        }) id: string
    )
        : Promise<Response> {
        try {
            const domain = await this.repository.findById(id)
            if (domain == null) {
                return {
                    status: 404
                }
            }
            if (domain.isDefault) {
                return {
                    status: 400,
                    message: "دامنه پیش‌فرض قابل حذف نیست",
                }
            }

            if (domain.adminDomain) {
                return {
                    status: 400,
                    message: "دامنه پیش‌فرض ادمین قابل حذف نیست",
                }
            }

            let language = await this.langRepo.findOne({
                domain
            })
            if (language != null) {
                return {
                    status: 400,
                    message: "این دامنه متصل به یک زبان است و قابل حذف نیست"
                }
            }

            return this.delete(id)
        } catch (error) {
            throw error
        }
    }

    @Get("")
    async getDomains(
        @Query({
            destination: "id",
            schema: BaseController.id
        }) id: string
    ): Promise<Response> {
        return this.findById(id)
    }


    @Post("", {
        contentType: "application/x-www-form-urlencoded"
    })
    async create(@Body({
        schema: z.object({
            domain: z.string(),
            sslType: z.enum([
                "none",
                "certificate",
                "interim"
            ]),
            public: z.string().optional(),
            private: z.string().optional(),
            "options-ssl": z.string().optional(),
            "ssl-dhparams": z.string().optional(),
            isDefault: BaseController.booleanFromquery.default("false"),
            config: z.any(),
            adminDomain: BaseController.booleanFromquery.default("false"),
            cptchaInfo: z.object({
                site_key: z.string().optional(),
                secret_key: z.string().optional()
            }).optional()
        }),
    }) data: any, ...params: any[]): Promise<Response> {
        if (data.public) {
            data.certificate = {
                public: data.public,
                private: data.private,
                "options-ssl": data["options-ssl"],
                "ssl-dhparams": data["ssl-dhparams1"],

            }
        }
        if (data.isDefault == true && data.adminDomain == true) {
            return {
                status: 400,
                message: "دامنه نمیتواند همزمان برای سایت و پنل ادمین استفاده شود"
            }
        }

        if (data.isDefault) {


            let exDefualt = await this.repository.findOneAndUpdate({
                isDefault: true
            }, {
                $set: {
                    isDefault: false
                }
            })


            let r = await super.create(data)

            if (!r.status?.toString().startsWith("2")) {
                this.repository.updateOne({
                    _id: exDefualt?._id
                }, {
                    $set: {
                        isDefault: true
                    }
                })
                return r
            }



            await this.domainRedirectRepo.updateMany({
                status: true,
                from: r.data._id
            }, {
                $set: {
                    status: false
                }
            })
            if (exDefualt != null) {
                await this.domainRedirectRepo.insert({
                    from: exDefualt._id,
                    to: r.data._id,
                } as any)
            }
            this.nginx.init()
            return r
        }

        return super.create(data)

    }

    @Post("/local-cdn")
    async creteLocalCdn(
        @Body({
            destination: "id",
            schema: BaseController.id
        }) id: string
    ): Promise<Response> {
        try {
            const domain = await this.repository.findById(id)
            if(domain == null){
                return {
                    status : 404
                }
            }
            if(domain.localCDN != undefined){
                return {
                    status : 400,
                    message :  "فایل منیجر وجود دارد"
                }
            }
            await this.addLocalCDN(domain)

        } catch (error) {
            throw error
        }
        return {
            status : 200
        }
    }


    async addLocalCDN(domain : Domain){

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

                await this.repository.updateOne({
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


    async search(page: number, limit: number, reqQuery: any, admin?: any, ...params: [...any]): Promise<Response> {

        return super.search(page, limit, reqQuery, admin)
    }


    initApis(): void {
        // super.initApis()
        this.addRouteWithMeta("/search", "get", this.search.bind(this), Object.assign(BaseController.searcheMeta, {
            absolute: false
        }))
    }


    serve(): Route[] {
        return super.serve()
    }

    async validateCanBeDefault() {

    }
}


// export default domain

