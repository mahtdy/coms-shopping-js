import BaseController, { ControllerOptions } from "../controller";
import KeywordRepository from "../repositories/keyword/repository";
import Keyword from "../repositories/keyword/model"
import { Get, Post, Put } from "../../decorators/method";
import z from "zod"
import { Admin, Body, Query } from "../../decorators/parameters";
import { Response } from "../../controller";
import { AdminInfo } from "../auth/admin/admin-logIn";
import ContentMaduleRegistry from "../contentRegistry";
import { Types } from "mongoose";
import DomainRepository from "../repositories/domain/repository";
import LinkTagRepository from "../repositories/linkTag/repository";


export class KeywordController extends BaseController<Keyword>{
    registry: ContentMaduleRegistry
    domainRepo: DomainRepository
    linkTagRepo: LinkTagRepository

    constructor(baseRoute: string, repo: KeywordRepository<Keyword>, options?: ControllerOptions) {
        super(baseRoute, repo, options)
        this.registry = ContentMaduleRegistry.getInstance()
        this.domainRepo = new DomainRepository()
        this.linkTagRepo = new LinkTagRepository()
    }

    @Get("")
    async getById(
        @Query({
            destination: "id",
            schema: BaseController.id
        }) id: string
    ) {
        try {
            var document: any = await this.repository.findOne({ _id: id }, {})

            if (document == null) {
                return {
                    status: 404,
                    message: "یافت نشد"
                }
            }
            const pageRepo = this.registry.getRegistry(document.pageType)?.repo

            if (pageRepo != undefined) {
                const page = await pageRepo.findOne({
                    _id: document.page
                }, {}, [
                    {
                        path: "categories"
                    }
                ])
                if (page != null) {

                    let language = await this.domainRepo.languageRepo.findById(page.language as string)
                    if (language == null) {
                        return null
                    }

                    let domain = language.domain != undefined ? await this.domainRepo.findById(language.domain as string) : await this.domainRepo.findOne({
                        isDefault: true
                    })
                    if (domain != null) {

                        page.seo["url"] = domain.sslType != "none" ? `https://${domain.domain}${page?.seo["url"]}` : `http://${domain.domain}${page?.seo["url"]}`
                    }

                }


                document = JSON.parse(JSON.stringify(document))
                document["page"] = page
            }

            return {
                status: 200,
                data: document,
                message: " عملیات موفق"
            }

        } catch (error) {
            console.log(error)
            throw error
        }
    }

    @Get("/by-text")
    async getKeywordByText(
        @Query({
            destination: "text",
            schema: z.string()
        }) text: string
    ): Promise<Response> {
        try {
            const keyword = await this.repository.findOne({
                text: {
                    $eq: text
                }
            })
            if (keyword == null) {
                return {
                    status: 404
                }
            }

            let data = await this.repository.getKeywordPosition(keyword._id as string, new Date(Date.now() - (1000 * 60 * 60 * 24)))
            let summray = await this.repository.getKeywordSummray(keyword._id as string, "3m")
            data["summray"] = summray
            return {
                status: 200,
                data: Object.assign(data, keyword)
            }


        } catch (error) {
            throw error
        }
    }

    @Put("")
    async changeKeyword(
        @Body({
            destination: "id",
            schema: BaseController.id
        }) id: string,
        @Body({
            destination: "pageType",
            schema: z.string()
        }) pageType: string,
        @Body({
            destination: "pageId",
            schema: BaseController.id
        }) pageId: string,
        @Admin() admin: AdminInfo
    ): Promise<Response> {
        try {
            await this.repository.changeKeywords(
                id,
                admin._id,
                pageType,
                pageId
            )
            return {
                status: 200,
                data: {}
            }
        } catch (error) {
            throw error
        }
    }

    @Get("/chart")
    async getKeywordChart(
        @Query({
            destination: "id",
            schema: BaseController.id
        }) id: string,
        @Query({
            destination: "dateRange",
            schema: z.enum(["1m", "3m", "6m", "1y"])
        }) dateRange: "1m" | "3m" | "6m" | "1y"
    ): Promise<Response> {

        try {
            const data = await this.repository.getKeywordChart(id, dateRange)
            return {
                status: 200,
                data
            }
        } catch (error) {
            throw error
        }
        return {

        }
    }

    @Get("/summary")
    async getSummary(
        @Query({
            destination: "id",
            schema: BaseController.id
        }) id: string,
        @Query({
            destination: "dateRange",
            schema: z.enum(["1m", "3m", "6m", "1y"])
        }) dateRange: "1m" | "3m" | "6m" | "1y"
    ) {
        try {
            const data = await this.repository.getKeywordSummray(id, dateRange)
            return {
                status: 200,
                data
            }
        } catch (error) {
            throw error
        }
    }

    @Get("/position")
    async getPosition(
        @Query({
            destination: "id",
            schema: BaseController.id
        }) id: string
    ) {
        try {
            const data = await this.repository.getKeywordPosition(id, new Date(Date.now() - (1000 * 60 * 60 * 24)))
            return {
                status: 200,
                data
            }
        } catch (error) {
            throw error
        }
    }

    @Post("/link/activate")
    async actiavateLink(
        @Body({
            destination: "id",
            schema: BaseController.id
        }) id: string,
        @Body({
            destination: "part",
            schema: z.enum(["content", "summary", "faq", "comment"])
        }) part: string,
        @Body({
            destination: "subPartId",
            schema: BaseController.id.optional()
        }) subPartId?: string,
        @Body({
            destination: "index",
            schema: z.coerce.number().int().min(0).optional()
        }) index?: number

    ): Promise<Response> {
        try {
            await this.repository.actiavateLink(id, part, this.registry, subPartId, index)

        } catch (error) {
            throw error
        }

        return {
            status: 200
        }
    }

    @Post("/link/deactivate")
    async deactivateLink(

        @Body({
            destination: "id",
            schema: BaseController.id
        }) id: string,
        @Body({
            destination: "part",
            schema: z.enum(["content", "summary", "faq", "comment"])
        }) part: string,

        @Body({
            destination: "subPartId",
            schema: BaseController.id.optional()
        }) subPartId?: string,
        @Body({
            destination: "index",
            schema: z.coerce.number().int().min(0).optional()
        }) index?: number
    ): Promise<Response> {
        try {
            await this.repository.deactivateLink(
                id,
                part,
                this.registry,
                subPartId,
                index
            )
        } catch (error) {
            throw error
        }
        return {
            status: 200
        }
    }


    @Post("/link/reject")
    async rejectLink(
        @Body({
            destination: "id",
            schema: BaseController.id
        }) id: string,
        @Body({
            destination: "part",
            schema: z.enum(["content", "summary", "faq", "comment"])
        }) part: string,
        @Body({
            destination: "subPartId",
            schema: BaseController.id.optional()
        }) subPartId?: string,

    ): Promise<Response> {
        try {
            await this.repository.rejectLink(id, part, this.registry, subPartId)
        } catch (error) {
            throw error
        }
        return {
            status: 200
        }
    }

    @Get("/links")
    async getLinks(
        @Query({
            destination: "keywordId",
            schema: BaseController.id
        }) keyword: string,
        @Query({
            destination: "page",
            schema: BaseController.page
        }) page: number,
        @Query({
            destination: "limit",
            schema: BaseController.limit
        }) limit: number,
    ): Promise<Response> {
        try {

            let data = await this.repository.keywordTaskRepo.linkMapRepo.paginate({
                keyword
            }, limit, page)
            for (let i = 0; i < data.list.length; i++) {
                const pageRepo = this.registry.getRegistry(data.list[i].fromType)?.repo

                if (pageRepo != undefined) {
                    const page = await pageRepo.findOne({
                        _id: data.list[i].from
                    }, {}, [
                        {
                            path: "categories"
                        }
                    ])
                    if (page != null) {

                        let language = await this.domainRepo.languageRepo.findById(page.language as string)
                        if (language == null) {
                            // return null
                            continue
                        }

                        let domain = language.domain != undefined ? await this.domainRepo.findById(language.domain as string) : await this.domainRepo.findOne({
                            isDefault: true
                        })
                        if (domain != null) {

                            page.seo["url"] = domain.sslType != "none" ? `https://${domain.domain}${page?.seo["url"]}` : `http://${domain.domain}${page?.seo["url"]}`
                        }
                        data.list[i].from = {
                            title: page.title,
                            seo: {
                                url: page.seo["url"]
                            },
                            categories: page.categories
                        }

                    }
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

    @Get("/links/with-detail")
    async getLinksWithDetails(
        @Query({
            destination: "keywordId",
            schema: BaseController.id
        }) keyword: string,
        @Query({
            destination: "page",
            schema: BaseController.page
        }) page: number,
        @Query({
            destination: "limit",
            schema: BaseController.limit
        }) limit: number,
        @Query({
            destination: "filter",
            schema: z.enum(["rejected" , "notProccessed" , "all"])
        }) filter: "rejected" | "notProccessed" | "all"
    ): Promise<Response> {
        try {

            let data = await this.repository.keywordTaskRepo.linkMapRepo.paginate({
                keyword
            }, limit, page, {
                population: [{
                    path: "keyword"
                }, {
                    path: "to"
                }]
            })
            for (let i = 0; i < data.list.length; i++) {
                const pageRepo = this.registry.getRegistry(data.list[i].fromType)?.repo

                if (pageRepo != undefined) {
                    const page = await pageRepo.findOne({
                        _id: data.list[i].from
                    }, {}, [
                        {
                            path: "category"
                        }
                    ])
                    if (page != null) {

                        let language = await this.domainRepo.languageRepo.findById(page.language as string)
                        if (language == null) {
                            // return null
                            continue
                        }

                        let domain = language.domain != undefined ? await this.domainRepo.findById(language.domain as string) : await this.domainRepo.findOne({
                            isDefault: true
                        })
                        if (domain != null) {
                            page.seo["url"] = domain.sslType != "none" ? `https://${domain.domain}${page?.seo["url"]}` : `http://${domain.domain}${page?.seo["url"]}`
                        }
                        data.list[i].from = page
                        let contentLinks = []
                        for (let j = 0; j < data.list[i].contentLinks.length; j++) {
                            data.list[i].contentLinks[j]["content"] = await pageRepo.findSubContent(page, data.list[i].contentLinks[j].subPartId)
                            if(filter == "all" && data.list[i].contentLinks[j].isRejected != true  ){
                                contentLinks.push(data.list[i].contentLinks[j])
                            }
                            else if(filter == "notProccessed" && data.list[i].contentLinks[j].isProccessed != true ){
                                contentLinks.push(data.list[i].contentLinks[j])
                            }
                            else if(filter == "rejected" && data.list[i].contentLinks[j].isRejected == true ){
                                contentLinks.push(data.list[i].contentLinks[j])
                            }
                        }
                        data.list[i].contentLinks = contentLinks

                    }
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


    initApis() {

        this.addRouteWithMeta("", "post", this.create.bind(this), {
            "1": {
                index: 0,
                source: "body",
                schema: this.insertSchema
            }
        })

        this.addRouteWithMeta("s", "get", this.search.bind(this), BaseController.searcheMeta)
    }

}

const keyword = new KeywordController("/keyword", new KeywordRepository({
    population: [{
        path: "page",
        select: ["title", "contentType", "type"]
    }]
}), {
    insertSchema: z.object({
        text: z.string(),
        pirority: z.coerce.number().int().min(1).max(10),
        page: BaseController.id,
        pageType: z.string()
    }),
    population: [{
        path: "page",
        select: ["title"]
    }]
})

export default keyword