
import BaseController, { ControllerOptions } from "../controller"
import { AdminInfo } from "../auth/admin/admin-logIn"
import { Response } from "../../controller"
import { Query, Admin, Body } from "../../decorators/parameters"
import { Schema, z } from "zod"
import AdminRepository from "../repositories/admin/repository"
import { BaseAdmin } from "../repositories/admin/model"
import { Get } from "../../decorators/method"
import SmsMessager from "../../messaging/smsMessager"
import EmailMessager from "../../messaging/emailMessager"
import { BasePage } from "./model"
import BasePageRepository from "./repository"
import SystemConfigRepository from "../repositories/system/repository"



const confRepo = new SystemConfigRepository()





export class BasePageController<T extends BasePage> extends BaseController<T>{

    // repository : BasePageRepository<T>
    adminRepo?: AdminRepository<BaseAdmin>
    subPart?: string

    constructor(baseRoute: string, repo: BasePageRepository<T>, options: ControllerOptions & {
        adminRepo?: AdminRepository<BaseAdmin>
    }) {
        super(baseRoute, repo, options)
        this.adminRepo = options.adminRepo
    }



    create(data: T, @Admin() admin: AdminInfo): Promise<Response> {
        data.author = admin?._id
        return super.create(data)
    }


    async publish(
        data: T,
        id: string,
        update: boolean,
        @Admin() admin: AdminInfo,
        ...params: [...any]
    ): Promise<Response> {
        try {

            data.isDraft = false
            var draft = await this.repository.findOne({
                // author: admin._id,
                _id: id
            })

            if (draft == null) {
                if (data.author == undefined)
                    data.author = admin._id

                draft = await this.repository.insert(data)
                return {
                    status: 200,
                    data: draft
                }
            }
            else {

                data.author = draft.author != null ? draft.author : admin._id

                return {
                    status: 200,
                    data: await this.repository.replace({
                        _id: draft?._id
                    }, data)
                }
            }


        } catch (error) {

            throw error
        }
    }

    async sendPublishConfirmation(admin: BaseAdmin, doc: T) {
        try {


            // send SMS
            if (await confRepo.getConfigValue("send-publish-confirmation-sms")) {
                SmsMessager.send({
                    parameters: {
                        title: doc.title
                    },
                    receptor: admin.phoneNumber,
                    template: "publishConfirmation"
                })
            }


            // send Email
            if (await confRepo.getConfigValue("send-publish-confirmation-email")) {
                EmailMessager.send({
                    parameters: {
                        title: doc.title
                    },
                    receptor: admin.email,
                    template: "publishConfirmation"
                })
            }
        }
        catch (error: any) {
            // console.log(error.message)
        }

    }

    async publishRequest(
        doc: T,
        admin: AdminInfo,
        id?: string
    ): Promise<Response> {
        try {
            let data = await this.adminRepo?.getPermissionModuleAction(
                "content",
                admin._id
            );

            if (data?.config['publisher']?.value != undefined) {
                doc.isPublished = false
                doc.publisher = data?.config['publisher'].value
                delete doc.publishDate

                let publisher = await this.adminRepo?.findById(data?.config['publisher']?.value)
                if (publisher == null) {
                    return {
                        status: 400,
                        message: "انتشار دهنده یافت نشد"
                    }
                }


                if (id == undefined) {
                    var res = await this.create(doc, admin)
                }
                else {
                    var res = await this.replaceOne({
                        _id: id
                    }, doc, { ok: true })
                }
                await this.sendPublishConfirmation(publisher, doc)
                return res
            }

            else {
                return {
                    status: 400,
                    message: "انتشار دهنده یافت نشد"
                }
            }
        } catch (error) {
            throw error;
        }
    }

    async publishConfirm(
        doc: T,
        admin: AdminInfo,
        id: string
    ): Promise<Response> {
        try {
            let docs = await this.repository.findById(id)

            if (docs?.publisher != admin._id) {
                return {
                    status: 403,
                    data: {}
                }
            }
            doc.author = docs.author
            return this.publish(doc, id, false, admin)
        } catch (error) {
            throw error
        }
    }

    async addDraft(
        data: any,
        admin: AdminInfo,
        id?: string
    ): Promise<Response> {
        if (data.category == "") {
            delete data.category
        }
        try {
            data.isDraft = true
            data.author = admin._id

            if (id != undefined) {
                var draft = await this.repository.findOne({
                    // isDraft: true,
                    author: admin._id,
                    _id: id
                })
            }
            else {
                draft = null
            }



            if (draft != null) {
                await this.repository.replace({
                    _id: draft._id
                },
                    data
                )
                draft = await this.repository.findById(draft._id)
            }
            else {
                draft = await this.repository.insert(data)
            }

            return {
                status: 200,
                data: draft,
                message: " عملیات موفق"
            }
        } catch (error) {
            throw error
        }
    }

    @Get("/seo/url/exists")
    async isUrlExists(url: string, isStatic: boolean, category?: string, language?: string, id?: string
    ): Promise<Response> {
        // isStatic = isStatic as any != "false"
        try {
            return {
                status: 200,
                data: await this.repository.isUrlExists(url, isStatic, {
                    category,
                    language
                }, id)
            }
        } catch (error) {
            throw error
        }
    }

    // @Get("/draft")
    async getDraft(
        @Query({
            destination: "id",
            schema: BaseController.id
        }) id: string,
        @Admin() admin: AdminInfo
    ): Promise<Response> {
        try {
            return this.findOne({
                isDraft: true,
                author: admin._id,
                _id: id
            })
        } catch (error) {
            throw error
        }

    }

    // @Get("/drafts")
    async getDrafts(
        @Query({
            destination: "page",
            schema: BaseController.page
        }) page: number,
        @Query({
            destination: "limit",
            schema: BaseController.limit
        }) limit: number,
        @Admin() admin: AdminInfo
    ): Promise<Response> {
        return this.adminPaginate(page, limit, admin, {
            author: admin._id,
            isDraft: true
        })
    }

    async getURL(url: string, isStatic: boolean, language: string, category?: string): Promise<Response> {
        try {
            let domain = await this.repository.domainRepo.findOne({
                isDefault: true
            })
            let link = await this.repository.getURL(url, isStatic, language, category)

            if (link.startsWith("/")) {
                link = domain?.domain + link
            }
            else if (isStatic == true) {

                link = domain?.domain + "/" + link
            }
            return {
                status: 200,
                data: link
            }
        } catch (error) {
            throw error
        }
    }


    // @Get("/content/video")


    // async add

    async getPermissionData(admin: string): Promise<{
        isSuperAdmin?: boolean,
        permission?: any
    }> {
        try {
            var isSuper = await this.adminRepo?.isExists({
                isSuperAdmin: true,
                _id: admin
            })
            if (isSuper)
                return {
                    isSuperAdmin: true
                }
            return {
                permission: await this.adminRepo?.getPermissionModuleAction(this.subPart || "", admin)
            }
        } catch (error) {
            throw error
        }
    }


    initApis(): void {
        super.initApis()

        this.addRouteWithMeta(
            "/publish/request",
            "post",
            this.publishRequest.bind(this),
            {
                "0": {
                    index: 0,
                    source: "body",
                    schema: this.insertSchema,
                },
                "1": {
                    index: 1,
                    source: "admin",
                },
                "2": {
                    index: 2,
                    source: "query",
                    destination: "id",
                    schema: BaseController.id.optional(),
                },
            }
        )
        this.addRouteWithMeta(
            "/publish/confirm",
            "post",
            this.publishConfirm.bind(this),
            {
                "0": {
                    index: 0,
                    source: "body",
                    schema: this.insertSchema,
                },
                "1": {
                    index: 1,
                    source: "admin",
                },
                "2": {
                    index: 2,
                    source: "query",
                    destination: "id",
                    schema: BaseController.id,
                },
            }
        )
        this.addRoute("/drafts", "get", this.getDrafts.bind(this))
        this.addRoute("/draft", "get", this.getDraft.bind(this))
        this.addRouteWithMeta("/draft", "post", this.addDraft.bind(this), {
            "1": {
                index: 0,
                source: "body",
                schema: this.insertSchema
            },
            "2": {
                index: 1,
                source: "admin"
            },
            "3": {
                index: 2,
                source: "query",
                destination: "id",
                schema: BaseController.id.optional()
            }
        })
        this.addRouteWithMeta("/seo/url/exists", "get", this.isUrlExists.bind(this), {
            "1": {
                index: 0,
                source: "query",
                destination: "url",
                schema: z.string()
            },
            "2": {
                index: 1,
                source: "query",
                destination: "isStatic",
                schema: BaseController.booleanFromquery
            },
            "3": {
                index: 2,
                source: "query",
                destination: "category",
                schema: BaseController.id.optional()
            },
            "4": {
                index: 3,
                source: "query",
                destination: "language",
                schema: BaseController.id.optional()
            },
            "5": {
                index: 4,
                source: "query",
                destination: "id",
                schema: BaseController.id.optional()
            }
        })
        this.addRouteWithMeta("/publish", "post", this.publish.bind(this), {
            "0": {
                index: 0,
                source: "body",
                schema: this.insertSchema
            },
            "1": {
                index: 1,
                source: "query",
                destination: "id",
                schema: BaseController.id.optional()
            },
            "2": {
                index: 2,
                source: "query",
                destination: "update",
                schema: BaseController.booleanFromquery.optional()
            },
            "3": {
                index: 3,
                source: "admin"
            },
        })
        this.addRouteWithMeta("/url", "get", this.getURL.bind(this), {
            "0": {
                index: 0,
                destination: "url",
                schema: z.string(),
                source: "query"
            },
            "1": {
                index: 1,
                destination: "isStatic",
                schema: BaseController.booleanFromquery.default("false"),
                source: "query"
            },
            "2": {
                index: 2,
                destination: "language",
                schema: BaseController.id,
                source: "query"
            },
            "3": {
                index: 3,
                destination: "category",
                schema: BaseController.id.optional(),
                source: "query"
            }
        })
        this.addRouteWithMeta(
            "s/search",
            "get",
            this.search.bind(this),
            BaseController.searcheMeta
        );
        this.addRoute("s/search/list", "get", this.getSearchList.bind(this));
    }

}



var querySchema = z.object({
    sourceType: z.enum(["direct", "indirect"]),
    source: z.string().optional(),
    sourceKey: z.string().optional(),
    sortKey: z.string().optional(),
    havelimit: z.boolean().optional(),
    // getData?: Function,
    key: z.string(),
    sourceQueryOpration: z.enum(["$eq", "$reg", "$in", "$gt", "$lt"]).optional(),
    queryOpration: z.enum(["$eq", "$reg", "$in", "$gt", "$lt"])
})

export var seoSchema = z.object({
    "url": z.string(),
    "typeOfUrl": z.enum(["withSign", "withoutSign", "custom"]).default("withSign"),
    "id": z.any(),
    "mainKeyWord": z.string(),
    "keyWords": z.array(z.string()).default([]),
    "seoAnkertexts": z.array(z.string()).default([]),
    "canoncialAddress": z.string().optional(),
    "oldAddress": z.string().optional(),
    "isStatic": z.boolean().default(false),
    "seoTitle": z.string(),
    "metaDescription": z.string(),
    "redirectList": z.array(z.object(
        {
            "target": z.string(),
            "type": z.enum(["301", "302", "303", "304", "307", "308"])
        }
    )).optional(),
    "articleType": z.enum(["content", "blog", "new"]).optional(),
    "categoryLable": z.string().optional(),
    questionOppened: z.enum(["yes", "no", "private"]).default("yes"),
    "redirecturl": z.string().optional(),
    "redirect_status": z.string().optional(),

    changefreq: z.enum(["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"]).default("weekly"),
    priority: z.number().min(0.0).max(1.0).default(0.5),
    robotsConfig: BaseController.search.optional()

})

export var contentZod = z.object({
    status: z.boolean(),
    type: z.string(),
    content: z.string().optional(),
    title: z.string().optional(),
    publishAt: z.coerce.date().optional(),
    cycle: BaseController.id.optional(),
    locked: z.boolean().optional(),
    comments: z.array(
        z.object({
            text: z.string(),
            admin: z.any(),
            date: z.coerce.date(),
            reply: BaseController.id.optional()
        })).optional(),
    _id: BaseController.id.optional()
})




export var basePageZod = z.object({
    commonQuestions: z.array(z.object({
        question: z.string(),
        answer: z.string(),
        publishAt: z.coerce.date().optional(),
        cycle: BaseController.id.optional(),
    })),
    // comments: z.array(fakeCommentZod).optional(),
    fileUses: z.array(z.string()),
    commentStatus: z.boolean(),
    commentImportant: z.boolean(),
    category: BaseController.id.optional(),
    categories: z.array(BaseController.id),
    ancestors: z.array(BaseController.id).optional(),
    language: BaseController.id.optional(),
    isDraft: z.boolean(),
    publishDate: z.coerce.date().optional(),
    isPublished: z.boolean().default(false),
    viewMode: z.enum(["public", "forUsers", "private"]),
    viewCategory: BaseController.id.optional(),
    seo: seoSchema,
    resolutionConfig: z
        .object({
            source: z.string().optional(),
            conf: BaseController.search.optional(),
            deletePrevious : z.boolean().optional(),
            srcChanged: z.boolean().optional(),
        })
        .optional(),
    social: z.array(z.object({
        "socialName": z.enum(["twitter", "facebook"]),
        "title": z.string(),
        "description": z.string(),
        "image": z.string()
    })).optional(),
    videos: z.array(BaseController.id).optional(),
    video: BaseController.id.optional(),
    Refrences: z.array(z.object({
        title: z.string(),
        url: z.string().url()
    })).optional(),
    tags: z.array(z.string()).optional(),
    contentNumber: z.coerce.number().int().positive().optional(),
    contentLanguages: z.array(z.object({
        content: BaseController.id,
        language: BaseController.id
    })).default([]),
    content: z.string().default("string"),
    contents: z.array(contentZod).optional(),

    wordCount: z.coerce.number().int().min(0).default(0)
})