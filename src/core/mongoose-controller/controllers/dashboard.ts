import { Get, Post } from "../../decorators/method";
import Controller, { Response } from "../../controller";
import { Admin, Body, Query } from "../../decorators/parameters";
import BaseController from "../controller";
import DomainRepository from "../repositories/domain/repository";
import GoogleApiTokenRepository from "../repositories/googleApiToken/repository";
import axios from "axios";
import SystemConfigRepository from "../repositories/system/repository";
import { z } from "zod"
import ArticleRepository from "../repositories/article/repository";
import LanguageRepository from "../repositories/language/repository";
import { AdminInfo } from "../auth/admin/admin-logIn";
import CommentRepository from "../repositories/comment/repository";


export class Dashboard extends Controller {
    domainRepo: DomainRepository
    googleApiTokenRepo: GoogleApiTokenRepository
    systemConfigRepo: SystemConfigRepository
    articleRepo: ArticleRepository
    languageRepo: LanguageRepository
    commentRepo: CommentRepository
    constructor(route: string, articleRepo: ArticleRepository) {
        super(route)
        this.domainRepo = new DomainRepository()
        this.googleApiTokenRepo = new GoogleApiTokenRepository()
        this.systemConfigRepo = new SystemConfigRepository()
        this.articleRepo = articleRepo
        this.languageRepo = new LanguageRepository()
        this.commentRepo = new CommentRepository()

    }

    @Get("/webmaster")
    async getWebMasterInfo(
        @Query({
            destination: "domain",
            schema: BaseController.id
        }) domainId: string,
        @Query({
            destination: "start",
            schema: z.coerce.date().optional()
        }) start?: Date,
        @Query({
            destination: "end",
            schema: z.coerce.date().optional()
        }) end?: Date,
        @Query({
            destination: "compareStart",
            schema: z.coerce.date().optional()
        }) compareStart?: Date,
        @Query({
            destination: "compareEnd",
            schema: z.coerce.date().optional()
        }) compareEnd?: Date,

    ): Promise<Response> {
        try {
            var google_conf = await this.systemConfigRepo.getConfigValue("google_credential")
            var apiServer = await this.systemConfigRepo.getConfigValue("google_api_server")
            var apikey = await this.systemConfigRepo.getConfigValue("google_api_key")

            if (!google_conf)
                return {
                    status: 400,
                    data: {
                        type: "auth",
                        googleNotSet: true
                    }
                }

            let webmasterToken = await this.googleApiTokenRepo.findOne({
                type: "webmaster",
                domains: domainId
            })
            if (webmasterToken == null) {
                return {
                    status: 400,
                    data: {
                        type: "auth",
                        notSet: true
                    }
                }
            }

            let domain = await this.domainRepo.findById(domainId)

            let webmaster_conf = webmasterToken.token

            if (!webmaster_conf || !google_conf) {
                if (!google_conf) {
                    return {
                        status: 400,
                        data: {
                            type: "auth",
                            googleNotSet: true
                        }
                    }
                }
                return {
                    status: 400,
                    data: {
                        type: "auth",
                        notSet: true
                    }
                }
            }

            let response = await axios({
                method: 'post',
                url: apiServer + "users/webmaster/info/today",
                headers: {
                    "x-api-key": apikey
                },
                data: {
                    credential: google_conf,
                    token: webmaster_conf,
                    siteUrl: domain?.domain,
                    start,
                    end,
                    compareStart,
                    compareEnd
                    // siteUrl : "aroncare.com"
                }
            })

            return {
                status: 200,
                data: response.data
            }
        } catch (error) {
            throw error
        }
    }


    @Get("/webmaster/cahrt")
    async getWebMasterChart(
        @Query({
            destination: "domain",
            schema: BaseController.id
        }) domainId: string,
        @Query({
            destination: "start",
            schema: z.coerce.date().optional()
        }) start?: Date,
        @Query({
            destination: "end",
            schema: z.coerce.date().optional()
        }) end?: Date,
        @Query({
            destination: "compareStart",
            schema: z.coerce.date().optional()
        }) compareStart?: Date,
        @Query({
            destination: "compareEnd",
            schema: z.coerce.date().optional()
        }) compareEnd?: Date,

    ): Promise<Response> {
        try {
            var conf = await this.systemConfigRepo.getConfigValue("google_credential")
            var apiServer = await this.systemConfigRepo.getConfigValue("google_api_server")
            var apikey = await this.systemConfigRepo.getConfigValue("google_api_key")

            if (!google_conf)
                return {
                    status: 400,
                    data: {
                        type: "auth",
                        googleNotSet: true
                    }
                }

            let webmasterToken = await this.googleApiTokenRepo.findOne({
                type: "webmaster",
                domains: domainId
            })
            if (webmasterToken == null) {
                return {
                    status: 400,
                    data: {
                        type: "auth",
                        notSet: true
                    }
                }
            }

            let domain = await this.domainRepo.findById(domainId)

            let webmaster_conf = webmasterToken.token

            var google_conf = await this.systemConfigRepo.getConfigValue("google_credential")
            if (!webmaster_conf || !google_conf) {
                if (!google_conf) {
                    return {
                        status: 400,
                        data: {
                            type: "auth",
                            googleNotSet: true
                        }
                    }
                }
                return {
                    status: 400,
                    data: {
                        type: "auth",
                        notSet: true
                    }
                }
            }

            let response = await axios({
                method: 'post',
                url: apiServer + "users/webmaster/chart",
                headers: {
                    "x-api-key": apikey
                },
                data: {
                    credential: conf,
                    token: webmaster_conf,
                    siteUrl: domain?.domain,
                    start,
                    end,
                    compareStart,
                    compareEnd
                    // siteUrl : "aroncare.com"
                }
            })

            return {
                status: 200,
                data: response.data
            }
        } catch (error) {
            console.log(error)
            throw error
        }
    }


    @Get("/webmaster/web-vital")
    async getWebVitalInfo(
        @Query({
            destination: "domain",
            schema: BaseController.id
        }) domainId: string

    ): Promise<Response> {
        try {
            // var conf = await this.systemConfigRepo.getConfigValue("google_credential")
            var apiServer = await this.systemConfigRepo.getConfigValue("google_api_server")
            var apikey = await this.systemConfigRepo.getConfigValue("google_api_key")


            let domain = await this.domainRepo.findById(domainId)

            // let webmaster_conf = webmasterToken.token

            var googleApikey = await this.systemConfigRepo.getConfigValue("google-apikey")
            if (!googleApikey) {
                return {
                    status: 400,
                    data: {
                        type: "auth",
                        notSet: true
                    }
                }
            }

            console.log(domainId, domain?.domain)
            let response = await axios({
                method: 'post',
                url: apiServer + "users/webmaster/core-web-vital",
                headers: {
                    "x-api-key": apikey
                },
                data: {
                    apikey: googleApikey,
                    siteUrl: (domain?.sslType == "none" ? "https://" : "https://") + domain?.domain
                }
            })

            return {
                status: 200,
                data: response.data
            }
        } catch (error) {
            throw error
        }
    }

    @Get("/webmaster/web-vital/historic")
    async getHistoricCoreWebVital(
        @Query({
            destination: "domain",
            schema: BaseController.id
        }) domainId: string

    ): Promise<Response> {
        try {


            var apiServer = await this.systemConfigRepo.getConfigValue("google_api_server")
            var apikey = await this.systemConfigRepo.getConfigValue("google_api_key")


            let domain = await this.domainRepo.findById(domainId)

            // let webmaster_conf = webmasterToken.token

            var googleApikey = await this.systemConfigRepo.getConfigValue("google-apikey")
            if (!googleApikey) {
                return {
                    status: 400,
                    data: {
                        type: "auth",
                        notSet: true
                    }
                }
            }

            let response = await axios({
                method: 'post',
                url: apiServer + "users/webmaster/core-web-vital/historic",
                headers: {
                    "x-api-key": apikey
                },
                data: {
                    apikey: googleApikey,
                    siteUrl: (domain?.sslType == "none" ? "https://" : "https://") + domain?.domain,
                }
            })

            return {
                status: 200,
                data: response.data
            }
        } catch (error) {
            throw error
        }
    }


    @Post("/webmaster/web-vital/apikey")
    async setApikey(
        @Body({
            destination: "apikey",
            schema: z.string()
        }) apikey: string,

        @Admin() admin: AdminInfo
    ) {
        try {
            if (!admin.isSuperAdmin) {
                return {
                    status: 403
                }
            }
            let googleApikey = await this.systemConfigRepo.getConfigValue("google-apikey")
            if (!googleApikey) {
                await this.systemConfigRepo.insert({
                    lable: "google_conf",
                    key: "google-apikey",
                    value: apikey,
                    type: "String"
                } as any)
            }
            return {
                status: 200,
                data: {}
            }
        } catch (error) {
            throw error
        }
    }


    @Get("/analytics")
    async getAnalyticsInfo(

        @Query({
            destination: "domain",
            schema: BaseController.id
        }) domainId: string
    ) {
        var conf = await this.systemConfigRepo.getConfigValue("google_credential")
        var apiServer = await this.systemConfigRepo.getConfigValue("google_api_server")
        var apikey = await this.systemConfigRepo.getConfigValue("google_api_key")

        if (!google_conf)
            return {
                status: 400,
                data: {
                    type: "auth",
                    googleNotSet: true
                }
            }


        let analyticsToken = await this.googleApiTokenRepo.findOne({
            type: "analytics",
            domains: domainId
        })
        if (analyticsToken == null) {
            return {
                status: 400,
                data: {
                    type: "auth",
                    notSet: true
                }
            }
        }

        let domain = await this.domainRepo.findById(domainId)
        let scripts: any[] = domain?.scripts || []
        let property = ""
        let measurementId = ""

        for (let i = 0; i < scripts.length; i++) {
            if (scripts[i].key == "analytics-measurementId") {
                measurementId = scripts[i].content

            }
            if (scripts[i].key == "analytics-property") {
                property = scripts[i].content
            }

        }

        let analytics_conf = analyticsToken.token

        var google_conf = await this.systemConfigRepo.getConfigValue("google_credential")
        if (!analytics_conf || !google_conf) {
            if (!google_conf) {
                return {
                    status: 400,
                    data: {
                        type: "auth",
                        googleNotSet: true
                    }
                }
            }
            return {
                status: 400,
                data: {
                    type: "auth",
                    notSet: true
                }
            }
        }

        let response = await axios({
            method: 'post',
            url: apiServer + "users/analytics/real-time",
            headers: {
                "x-api-key": apikey
            },
            data: {
                credential: conf,
                token: analytics_conf,
                property,
                measurementId
            }
        })

        return {
            status: 200,
            data: response.data
        }
    }

    @Get("/conetnts")
    async getContents(
        @Query({
            destination: "domain",
            schema: BaseController.id
        }) domainId: string,
        @Admin() admin: AdminInfo
    ): Promise<Response> {
        try {
            let domain = await this.domainRepo.findById(domainId)
            let langIds = []
            if (domain?.isDefault) {
                let languages = await this.languageRepo.findAll({
                    status: true,
                    domain: {
                        $exists: false
                    }
                })
                for (let i = 0; i < languages.length; i++) {
                    langIds.push(languages[i]._id)
                }
            }
            else {
                let language = await this.languageRepo.findOne({
                    domain: {
                        $eq: domainId
                    }
                })
                if (language != null)
                    langIds.push(language._id)

            }
            let count = await this.articleRepo.getcount({
                language: {
                    $in: langIds
                },
                isDraft: true,
                publisher: {
                    $exists: false
                }

            })
            let countProccess = await this.articleRepo.getcount({
                language: {
                    $in: langIds
                },
                isPublished: false,
                publisher: admin._id
            })
            return {
                status: 200,
                data: {
                    count,
                    countProccess
                }
            }

        }
        catch (error) {
            throw error
        }
    }


    @Get("/comments")
    async getCommentDashboard(
        @Query({
            destination: "domain",
            schema: BaseController.id
        }) domainId: string,
    ): Promise<Response> {
        try {

            let domain = await this.domainRepo.findById(domainId)
            let langIds = []
            if (domain?.isDefault) {
                let languages = await this.languageRepo.findAll({
                    status: true,
                    domain: {
                        $exists: false
                    }
                })
                for (let i = 0; i < languages.length; i++) {
                    langIds.push(languages[i]._id)
                }
            }
            else {
                let language = await this.languageRepo.findOne({
                    // status : true,
                    domain: {
                        $eq: domainId
                    }
                })
                if (language != null)
                    langIds.push(language._id)
            }


            let result = await this.commentRepo.collection.aggregate(
                [
                    {
                        $match: {
                            status: {
                                $ne: "confirmed"
                            },
                            language: {
                                $in: langIds
                            }

                        }
                    },
                    {
                        $group: {
                            _id: {
                                status: "$status",
                                type: "$type"
                            },
                            count: {
                                $sum: 1
                            }
                        }
                    }
                ]
            )
            let data: any = {
                question: {
                    rejected: 0,
                    proccessing: 0
                },
                comment: {
                    rejected: 0,
                    proccessing: 0
                }

            }
            try {
                for (let i = 0; i < result.length; i++) {
                    data[result[i]["_id"]["type"]][result[i]["_id"]["status"]] = result[i]["count"]
                }
            } catch (error) {

            }

            return {
                data
            }
        } catch (error) {
            throw error
        }
    }

    @Post("/google/cridential")
    async setGoogleCridential(
        @Body({
            destination: "cridential",
            schema: BaseController.search
        }) cridential: any,
        @Admin() admin: AdminInfo
    ) {
        try {
            if (!admin.isSuperAdmin) {
                return {
                    status: 403
                }
            }
            let googleApikey = await this.systemConfigRepo.getConfigValue("google_credential")
            if (!googleApikey) {
                await this.systemConfigRepo.insert({
                    lable: "google_conf",
                    key: "google_credential",
                    value: cridential,
                    type: "Object"
                } as any)
            }
            return {
                status: 200,
                data: {}
            }
        } catch (error) {
            throw error
        }
    }

    @Get("/api/admin/google/pagespeed", {
        absolute: true
    })
    async getPageSpeed(
        @Query({
            destination: "page",
            schema: z.string().url(),

        }) page: string,
        @Query({
            destination: "device",
            schema: z.enum(["desktop", "mobile"])
        }) device: string
    ): Promise<Response> {
        try {
            var apiServer = await this.systemConfigRepo.getConfigValue("google_api_server")
            var apikey = await this.systemConfigRepo.getConfigValue("google_api_key")

            let response = await axios({
                method: 'post',
                url: apiServer + "users/google/pagespeed",
                headers: {
                    "x-api-key": apikey
                },
                data: {
                    page,
                    device
                    // siteUrl : domain?.domain
                    // siteUrl : "aroncare.com"
                }
            })
            return {
                status: 200,
                data: response.data
            }

        } catch (error) {
            console.log(error)
            throw error
        }
    }

}


