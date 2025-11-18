import Application, { Route } from "../application";
import ContentRepository from "../mongoose-controller/repositories/content/repository";
import ContentMaduleRegistry from "../mongoose-controller/contentRegistry";
import content from "../../apps/user/controllers/content";
import BaseController from "../mongoose-controller/controller";
import { UserInfo } from "../mongoose-controller/auth/user/userAuthenticator";
import Content from "../mongoose-controller/repositories/content/model";
import Part from "../part";
import CategoryContentRepository from "../mongoose-controller/repositories/categoryContent/repository";
import { Types } from "mongoose";
import { z } from "zod"


export class ContentPart extends Part {
    contentRepo: ContentRepository
    contentRegistry: ContentMaduleRegistry
    app: Application
    private static instance: ContentPart;
    categoryContentRepo: CategoryContentRepository
    constructor(app: Application) {
        super("", { controllers: [] })
        this.app = app
        this.contentRepo = new ContentRepository()
        this.contentRegistry = ContentMaduleRegistry.getInstance()
        this.categoryContentRepo = new CategoryContentRepository()
    }

    public static getInstance(): ContentPart {

        return ContentPart.instance;
    }

    public static setInstance(app: Application): ContentPart {
        if (!ContentPart.instance) {
            ContentPart.instance = new ContentPart(app);

        }
        else {
            console.log(this.instance)
        }
        return ContentPart.instance;
    }



    async init(): Promise<any> {
        setInterval(async () => {
            // console.log("interval")
            let conf = await this.contentRepo.contentQueueRepo.findOne({})
            // console.log(conf)
            if (conf != null) {
                this.addCategoryPagination(conf.data)
                await this.contentRepo.contentQueueRepo.deleteById(conf._id)
            }
        }, 2000)
        // setTimeout(async () => {
        try {
            const contents = await this.contentRepo.findAll({})
            for (let i = 0; i < contents.length; i++) {
                // console.log(contents[i].url, contents[i].type, contents[i].id);
                if (contents[i].type == "category") {
                    await this.addCategoryPagination(contents[i])
                }

            }

        } catch (error) {
            throw error
        }

        this.app.addRoute({
            execs: content.getTagContent.bind(content),
            method: "get",
            route: "/tag_*",
            meta: {
                params: {
                    "0": {
                        index: 0,
                        source: "fromReq",
                        destination: "url"
                    },
                    "1": {
                        index: 1,
                        source: "header",
                        destination: "host"
                    },
                }
            }
        })

        this.app.addRoute({
            execs: content.getHeaderScripts.bind(content),
            method: "get",
            route: "/api/scripts",
            meta: {
                params: {
                    "0": {
                        index: 0,
                        source: "header",
                        destination: "host"
                    },
                }
            }
        })



        this.app.addRoute({
            execs: content.getBlock.bind(content),
            method: "get",
            route: "/block-content/:name",
            meta: {
                params: {
                    "0": {
                        index: 0,
                        source: "param",
                        destination: "name",
                        // schema: BaseController.page
                    },
                    "1": {
                        index: 0,
                        source: "res"
                        // schema: BaseController.page
                    },
                    "2": {
                        index: 1,
                        source: "user",
                        required: false
                    }
                }
            }
        })

        this.app.addRoute({
            execs: content.getContents.bind(content),
            method: "get",
            route: "/api/contents",
            meta: {
                params: {
                    "0": {
                        index: 0,
                        source: "query",
                        destination: "category",
                        schema: BaseController.id.optional()
                    },
                    "1": {
                        index: 1,
                        source: "query",
                        destination: "type",
                        schema: z.string().optional()
                    },
                    "2": {
                        index: 2,
                        source: "query",
                        destination: "language",
                        schema: BaseController.id.optional()
                    },
                    "3": {
                        index: 3,
                        source: "query",
                        destination: "sortKey",
                        schema: z.string().optional()
                    },
                    "4": {
                        index: 4,
                        source: "query",
                        destination: "sortOrder",
                        schema: z.enum(["1" , "-1"]).optional()
                    } ,
                    "5" : {
                        index : 5,
                        source : "query",
                        destination : "id",
                        schema : BaseController.id.optional()
                    },
                    "6" : {
                        index : 6,
                        source : "query",
                        destination : "page",
                        schema : z.coerce.number().int().min(1).default(1)
                    },
                    "7" : {
                        index : 7,
                        source : "query",
                        destination : "limit",
                        schema : z.coerce.number().int().min(1).default(10)
                    }
                    
                }
            }
        })


        this.app.addRoute({
            execs: content.getContent.bind(content),
            method: "use",
            route: "*",
            meta: {
                params: {
                    "0": {
                        index: 0,
                        source: "fromReq",
                        destination: "baseUrl"
                    },
                    "1": {
                        index: 1,
                        source: "header",
                        destination: "host"
                    },
                    "2": {
                        index: 2,
                        source: "user",
                        required: false
                    }
                }
            }
        })
        return
    }

    async getCategoryContents(page: number, category: string, language: string, contentRegistry: string, user: UserInfo) {

        let rep = this.contentRegistry.getRegistry(contentRegistry)

        let categoryContent: any = await this.categoryContentRepo.findOne({
            catID: category,
            language
        })

        let content = await this.contentRepo.findOne({
            id: category,
            language
        })
        categoryContent.seo = content



        let paginate = await rep?.repo?.paginate({
            language: new Types.ObjectId(language),
            $or: [{
                category: new Types.ObjectId(category)
            }, {
                categories: new Types.ObjectId(category)
            }]
        }, 12, page, {})

        categoryContent.paginate = paginate
        return {
            status: 200,
            data: categoryContent
        }
    }

    async addCategoryPagination(contentData: Content) {

        this.app.addRoute({
            execs: this.getCategoryContents.bind(this),
            method: "get",
            route: "/api" + contentData.url + "/:page",
            meta: {
                params: {
                    "0": {
                        index: 0,
                        source: "param",
                        destination: "page",
                        schema: BaseController.page
                    },
                    "1": {
                        index: 1,
                        source: "fromOwn",
                        destination: "category",
                        data: contentData.id
                    },
                    "2": {
                        index: 2,
                        source: "fromOwn",
                        destination: "language",
                        data: contentData.language
                    },
                    "3": {
                        index: 3,
                        source: "fromOwn",
                        data: "article"
                    },
                    "4": {
                        index: 4,
                        source: "user",
                        required: false
                    },
                }
            }
        })

    }


    getCategoryContent(category: string, baseUrl: string) {

        return async function (page: string, host: string, user?: UserInfo) {
            console.log(page, user, baseUrl)
            return await content.getContent(baseUrl, host, user)
        }
    }

    serve(): Route[] {
        this.init()
        return []
    }

}

// export  const contentPart = new ContentPart()
