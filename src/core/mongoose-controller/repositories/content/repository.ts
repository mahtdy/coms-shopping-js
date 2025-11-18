import Content, { ContentModel } from "./model";
import BaseRepositoryService, { RepositoryConfigOptions } from "../../repository";
import SystemConfigRepository from "../system/repository"
import ConfigService from "../../../services/config";
import LinkTagRepository from "../linkTag/repository";
import { FilterQuery, Types } from "mongoose";
import { UpdateQuery } from "mongoose";
import PublishQueueRepository from "../publishQueue/repository";
import ContentQueueRepository from "../contentQueue/repository";
import DomainRepository from "../domain/repository";
import RedirectRepository from "../redirect/repository";
import Nginx from "../../../services/nginx/nginx";
import LanguageRepository from "../language/repository";
import KeywordRepository from "../keyword/repository";


export interface InsertOptions {
    category?: string,
    language?: string,
    type?: string,
    customFunc?: Function,
    domain?: string,
    isDomain?: boolean,
    admin?: Types.ObjectId
}

function syncNginx() {
    // nginx.init()
    // let nginx = new Nginx()
}

export var customUrlBuilder: {
    [key: string]: Function
} = {}


// const 


// async function test(contentData :any) {

// }
// const nginx = new Nginx()

export default class ContentRepository extends BaseRepositoryService<Content> {
    confRepo: SystemConfigRepository;
    linkTagRepo: LinkTagRepository;
    publishQueueRepo: PublishQueueRepository
    contentQueueRepo: ContentQueueRepository
    redirectRepo: RedirectRepository
    domainRepo: DomainRepository
    languageRepo: LanguageRepository
    keywordRepo: KeywordRepository
    // nginx : Nginx
    constructor(options?: RepositoryConfigOptions) {
        super(ContentModel)
        this.confRepo = new SystemConfigRepository()
        this.languageRepo = new LanguageRepository()
        this.linkTagRepo = new LinkTagRepository()
        this.publishQueueRepo = new PublishQueueRepository()
        this.contentQueueRepo = new ContentQueueRepository()
        this.redirectRepo = new RedirectRepository()
        this.domainRepo = new DomainRepository()
        this.nginx = new Nginx(this)
        this.keywordRepo = new KeywordRepository()


    }

    // @checkForCategory()
    async insert(document: Content, config: InsertOptions = {
        type: "content"
    }): Promise<Content> {

        document.originalUrl = document.url

        document.category = config.category
        document.language = config.language

        if (!document.isStatic) {
            if (config.customFunc) {
                document.url = await config.customFunc(document.url, config.category, config.language)
            }

            else if (config.type == "article") {
                var content = await this.confRepo.getConfigValue("content-url-style")
                document.url = await contentUrlBuilder[content](document.url, config.category, config.language)
            }
            else if (config.type == "category") {
                var category = await this.confRepo.getConfigValue("category-url-style")
                document.url = await categoryUrlBuilder[category](document.url, config.category, config.language)

            }
        }
        if (document.url != "" && !document.url.startsWith("/")) {
            document.url = "/" + document.url
        }

        if (document.keyWords) {
            var isExists = await this.isExists({
                $or: [
                    {
                        keyWords: {
                            $in: document.keyWords
                        }
                    },
                    {
                        mainKeyWord: {
                            $in: document.keyWords
                        }
                    }
                ]
            })
            if (isExists) {
                throw new Error("کلمه‌کلیدی تکراری")
            }
        }

        if(document.url.startsWith("/") ||document.url ==""){
            let domain = await this.domainRepo.findOne({
                isDefault: true
            })
            document.absoluteUrl = `https://${domain?.domain}${document.url}`
        }
        else{

            document.absoluteUrl = `https://${document.url}`
        }
        
        try {
            var d = await super.insert(document)

            let redirect = await this.redirectRepo.findOne({
                from: d.url,
                status: {
                    $ne: false
                }
            })
            if (redirect != null) {
                await this.redirectRepo.updateMany({
                    from: d.url,
                    status: {
                        $ne: false
                    }
                }, {
                    $set: {
                        status: false
                    }
                })
                this.nginx.init()
            }
            await this.linkTagRepo.insert({
                link: d._id
            } as any)
        } catch (error) {
            throw error
        }


        try {
            if (d.type == "category")
                await this.categoryPostCondition(d)
        } catch (error) {
            throw error
        }

        if(content?.keyWords != undefined)
            await this.keywordRepo.ensureKeywords(
                content.keyWords,
                config.admin as Types.ObjectId,
                config.type as string,
                document?.id)
        return d
    }

    async categoryPostCondition(contentData: any) {
        await this.publishQueueRepo.deleteCategoryFromList(contentData.id, contentData.language, "content")
        this.contentQueueRepo.insert({
            data: {
                id: contentData.id,
                url: contentData.url
            }
        } as any)
    }

    async editContent(query: FilterQuery<Content>, queryData: UpdateQuery<Content>, config: InsertOptions = {
        type: "content"
    }) {
        await super.findOneAndUpdate(query, queryData)
    }

    public async findOneAndUpdate(query: FilterQuery<Content>, queryData: UpdateQuery<Content>): Promise<Content | null> {
        return super.findOneAndUpdate(query, queryData)
    }

    async findOneAndDelete(query: FilterQuery<Content>): Promise<Content | null> {
        try {
            var c = await super.findOneAndDelete(query)
            this.linkTagRepo.findOneAndDelete({
                link: c?._id
            })

            // check for redirect
        } catch (error) {
            console.log(error)
            throw error
        }
        return c
    }

    async getContentByUrl(url: string) {
        return this.findOne({
            url
        })
    }


    public async checkForEdit(query: FilterQuery<Content>, content: any, config: InsertOptions = {
        type: "content"
    }) {
        try {
            var document = await this.findOne(query)
            if (document == null)
                return

            for (const key in content) {
                if (key == "mainKeyWord" && content['mainKeyWord'] == document.mainKeyWord) {
                    delete content["mainKeyWord"]
                }
                // console.log("key" , key)
                if (key == "url") {
                    if (!content.isStatic
                        && (content['url'] != document.url || document.category != config.category || document.language != config.language || document.isStatic != content.isStatic)) {
                        let url
                        if (content['originalUrl'] == undefined) {
                            content['originalUrl'] = content['url']
                        }
                        url = content['originalUrl']

                        if (config.customFunc) {
                            content.url = await config.customFunc(url, config.category, config.language)
                        }

                        else if (config.type == "article") {
                            var c = await this.confRepo.getConfigValue("content-url-style")
                            content.url = await contentUrlBuilder[c](url, config.category, config.language)
                        }
                        else if (config.type == "category") {
                            var category = await this.confRepo.getConfigValue("category-url-style")
                            content.url = await categoryUrlBuilder[category](url, config.category, config.language)
                        }

                    }
                    
                    else if(content.isStatic != true) {
                        delete content["url"]
                    }
                    
                    if( content["url"] != undefined && content["url"] != "" && !content["url"].includes(".") && !content["url"].startsWith("/"))
                    {
                        content["url"] = "/" + content["url"]
                    }


                    if(content.isStatic == true){
                        content["originalUrl"] = content["url"]
                    }

                }
            }

            content['language'] = config.language
            if(content.url != undefined){
                if(content.url.startsWith("/") ||content.url ==""){
                    let domain = await this.domainRepo.findOne({
                        isDefault: true
                    })
                    content.absoluteUrl = `https://${domain?.domain}${content.url}`
                }
                else{
                    content.absoluteUrl = `https://${content.url}`
                }
            }
            else {
                if(document.url.startsWith("/") ||document.url ==""){
                    let domain = await this.domainRepo.findOne({
                        isDefault: true
                    })
                    content.absoluteUrl = `https://${domain?.domain}${document.url}`
                }
                else{
        
                    content.absoluteUrl = `https://${document.url}`
                }
            }
            
            
            var updateQuery: any = {
                $set: content
            }

            if (document.redirecturl != undefined && !content.redirecturl) {
                updateQuery["$unset"] = {
                    redirecturl: 1,
                    redirect_status: 1
                }
            }

            await this.findByIdAndUpdate(document._id, updateQuery)
            var after = await this.findById(document._id)


            await this.ensureKeywords(content , config ,after)
            // await this.keywordRepo.ensureKeywords(
            //     content.keyWords,
            //     config.admin as Types.ObjectId,
            //     config?.type || "",
            //     after?.id
            // )

            if (after != null)
                this.updateRedirects(document, after)

            return document

        } catch (error) {
            console.log(error)
            throw error
        }
    }

    async ensureKeywords(content: any, config: InsertOptions = {
        type: "content"
    } , after : Content | null ){
        await this.keywordRepo.ensureKeywords(
            content.keyWords,
            config.admin as Types.ObjectId,
            config?.type || "",
            after?.id
        )
    }

    async updateRedirects(document: Content, afterDocument: Content) {


        let domain
        try {
            let lang = await this.domainRepo.languageRepo.findById(document.language as string)
            if (lang?.domain)
                domain = lang?.domain
            else {
                let defaultDomain = await this.domainRepo.findOne({
                    isDefault: true
                })
                domain = defaultDomain?._id
            }
        } catch (error) {

        }



        if (afterDocument.redirecturl) {

            let redirect = afterDocument.redirecturl
            let toStatic = true

            let to = await this.findOne({
                url: afterDocument.redirecturl
            })

            if (to != null) {
                redirect = to._id.toHexString()
                toStatic = false
            }




            await this.redirectRepo.updateMany({

                $or: [
                    {
                        from: document.url
                    },
                    {
                        from: document._id.toHexString()
                    }
                ]
            }, {
                $set: {
                    status: false
                }
            })

            await this.redirectRepo.insert({
                type: "update",
                from: afterDocument._id,
                to: redirect,
                code: "302",
                isAutomatic: true,
                domain,
                fromStatic: false,
                toStatic,
                language: afterDocument.language
            } as any)
            this.nginx.init()
        }

        else if (document.url != afterDocument.url) {


            let r = await this.redirectRepo.findOne({
                $or: [
                    {
                        from: document.url
                    },
                    {
                        from: document._id.toHexString()
                    }
                ],
                status: {
                    $ne: false
                }
            })
            if (r != null) {
                await this.redirectRepo.updateMany({
                    from: document.url
                }, {
                    $set: {
                        status: false
                    }
                })
            }
            await this.redirectRepo.insert({
                type: "update",
                from: document.url,
                to: afterDocument._id,
                code: "302",
                isAutomatic: true,
                domain,
                fromStatic: true,
                toStatic: false,
                language: document.language
            } as any)

            if (afterDocument.oldAddress) {
                await this.redirectRepo.insert({
                    type: "oldToNew",
                    from: afterDocument.oldAddress,
                    to: afterDocument._id,
                    code: "301",
                    isAutomatic: true,
                    domain,
                    fromStatic: true,
                    toStatic: false,
                    language: document.language
                } as any)
            }

            if(afterDocument.redirecturl == undefined){
                const beforeRedirect = await this.redirectRepo.deleteMany({
                    from : afterDocument.url
                })
                if(beforeRedirect != null){
                    this.nginx.init()
                }
            }

            this.nginx.init()
        }

        else if (document.redirecturl) {
            let r = await this.redirectRepo.findOne({
                $or: [
                    {
                        from: document.url
                    },
                    {
                        from: document._id.toHexString()
                    }
                ],
                status: {
                    $ne: false
                }
            })

            if (r != null) {
                await this.redirectRepo.updateMany({
                    $or: [
                        {
                            from: document.url
                        },
                        {
                            from: document._id.toHexString()
                        }
                    ],
                }, {
                    $set: {
                        status: false
                    }
                })
            }

            if (afterDocument.oldAddress) {
                await this.redirectRepo.updateMany({

                    from: afterDocument.oldAddress,
                    status: {
                        $ne: false
                    }
                }, {
                    $set: {
                        status: false
                    }
                })
                await this.redirectRepo.insert({
                    type: "oldToNew",
                    from: afterDocument.oldAddress,
                    to: afterDocument._id,
                    code: "301",
                    isAutomatic: true,
                    domain,
                    fromStatic: true,
                    toStatic: false,
                    language: document.language
                } as any)
            }
        }


        else {
            await this.redirectRepo.updateMany({

                from: afterDocument.oldAddress,
                status: {
                    $ne: false
                }
            }, {
                $set: {
                    status: false
                }
            })
            if (afterDocument.oldAddress) {
                await this.redirectRepo.insert({
                    type: "oldToNew",
                    from: afterDocument.oldAddress,
                    to: afterDocument._id,
                    code: "301",
                    isAutomatic: true,
                    domain,
                    fromStatic: true,
                    toStatic: false,
                    language: document.language
                } as any)
                this.nginx.init()
            }

            if(afterDocument.redirecturl == undefined){
                const beforeRedirect = await this.redirectRepo.deleteMany({
                    from : afterDocument.url
                })
                if(beforeRedirect != null){
                    this.nginx.init()
                }
            }
           
        }


    }

    async makeURL(url: string, isStatic: boolean = false, config: InsertOptions) {
        try {
            if (!isStatic) {
                if (config.customFunc) {
                    url = await config.customFunc(url, config.category, config.language)
                }

                else if (config.type == "article") {
                    var content = await this.confRepo.getConfigValue("content-url-style")
                    url = await contentUrlBuilder[content](url, config.category, config.language, config.domain, config.isDomain)
                }
                else if (config.type == "category") {
                    var category = await this.confRepo.getConfigValue("category-url-style")
                    url = await categoryUrlBuilder[category](url, config.category, config.language, config.domain, config.isDomain)
                }
                else if (config.type && customUrlBuilder[config.type]) {
                    url = await customUrlBuilder[config.type]?.(url, config.category, config.language)
                }
                return url
            }


            if (config.domain != undefined) {
                var ldomain = await domainRepo.findById(config.domain)
                if (ldomain != null) {
                    return ldomain.domain + "/" + url
                }
            }

            if (config.language != undefined) {
                var l = await languageRepo.findById(config.language)
                if (l != null && l.sign != ConfigService.getConfig("defaultLanguage")) {
                    if (l.domain) {
                        var ldomain = await domainRepo.findById(l.domain as string)

                        if (ldomain != null && config.isDomain != false) {
                            return ldomain.domain + "/" + url
                        }
                    }
                }
            }

            return url
        }
        catch (error) {
            throw error
        }
    }

    async isUrlExists(url: string, id?: string) {
        try {

            let q: any = {
                url: {
                    $eq: url
                }
            }
            if (id != undefined) {
                q["id"] = {
                    "$ne": id
                }
            }

            return await this.isExists(q)
        } catch (error) {
            throw error
        }
    }
}


const contentRepo = new ContentRepository()
const configRepo = new SystemConfigRepository()
const domainRepo = contentRepo.domainRepo
const languageRepo = contentRepo.domainRepo.languageRepo

export var contentUrlBuilder: any = {
    // url => cat1/cat2/.../catn/url
    // 1: async function (url: string, category: string, language?: string) {
    //     var contentRepo = new ContentRepository()
    //     var configRepo = new SystemConfigRepository()
    //     var languageRepo = new LanguageRepository()
    //     try {
    //         var catUrl = await contentRepo.findOn e({
    //             type: "category",
    //             id: category,
    //             isMainLang: true
    //         })
    //         var resUrl = catUrl?.url + "/" + url
    //         if (language != undefined) {
    //             var l = await languageRepo.findById(language)
    //             if (l != null && l.sign != ConfigService.getConfig("defaultLanguage")) {
    //                 return "/" + l.sign + resUrl
    //             }
    //         }
    //         return resUrl
    //     } catch (error) {
    //         throw error
    //     }
    // },
    // url => cat/url
    1: async function (url: string, category: string, language?: string, domain?: string, isDomain?: boolean) {
        try {
            var catUrl = await contentRepo.findOne({
                type: "category",
                id: category,
                isMainLang: true
            })
            var resUrl = catUrl?.url + "/" + url
            if (language != undefined) {
                var l = await languageRepo.findById(language)
                if (l != null && l.sign != ConfigService.getConfig("defaultLanguage")) {
                    if (l.domain) {
                        var ldomain = await domainRepo.findById(l.domain as string)
                        if (ldomain != null) {
                            return ldomain + "/" + resUrl
                        }
                    }
                    return "/" + l.sign + resUrl
                }
            }

            return resUrl
        } catch (error) {
            throw error
        }
    },
    // url => /url
    2: async function (url: string, category: string, language?: string, domain?: string, isDomain?: boolean) {
        try {
            var resUrl = "/" + url
            if (language != undefined) {
                var l = await languageRepo.findById(language)
                if (l != null && l.sign != ConfigService.getConfig("defaultLanguage")) {
                    if (l.domain) {
                        var ldomain = await domainRepo.findById(l.domain as string)
                        if (ldomain != null) {
                            return ldomain.domain + "/" + resUrl
                        }
                    }
                    return "/" + l.sign + resUrl
                }
            }
            return resUrl
        } catch (error) {
            throw error
        }
    },

    // url => blog/url
    3: async function (url: string, category: string, language?: string, domain?: string, isDomain?: boolean) {

        try {
            var seoPrefix = await configRepo.getConf("seo-prefix")
            var resUrl = "/" + seoPrefix?.value + "/" + url

            if (domain != undefined) {
                var ldomain = await domainRepo.findById(domain)
                if (ldomain != null) {
                    return ldomain.domain + "/" + seoPrefix?.value + "/" + url
                }
            }
            else if (language != undefined) {
                var l = await languageRepo.findById(language)
                if (l != null && l.sign != ConfigService.getConfig("defaultLanguage")) {
                    if (l.domain) {
                        var ldomain = await domainRepo.findById(l.domain as string)

                        if (l.isDomain && ldomain != null && isDomain != false) {
                            return ldomain.domain + "/" + seoPrefix?.value + "/" + url
                        }
                    }
                    return "/" + seoPrefix?.value + "/" + l.sign + "/" + url
                }
            }
            return resUrl
        } catch (error) {
            throw error
        }
    },
    // url => blog/cat/url
    4: async function (url: string, category: string, language?: string, domain?: string, isDomain?: boolean) {
        try {
            var catUrl = await contentRepo.findOne({
                type: "category",
                id: category,
                isMainLang: true
            })
            var seoPrefix = await configRepo.getConf("seo-prefix")
            var resUrl = catUrl?.url + "/" + url
            if (language != undefined) {
                var l = await languageRepo.findById(language)
                if (l != null && l.sign != ConfigService.getConfig("defaultLanguage")) {
                    if (l.domain) {
                        var ldomain = await domainRepo.findById(l.domain as string)
                        if (ldomain != null) {
                            var tpUrl = catUrl?.url.substring(seoPrefix?.value.length + 1, catUrl?.url.length)
                            return ldomain.domain + "/" + seoPrefix?.value + "/" + tpUrl + "/" + url
                        }
                    }

                    var tpUrl = catUrl?.url.substring(seoPrefix?.value.length + 1, catUrl?.url.length)
                    return "/" + seoPrefix?.value + "/" + l.sign + "/" + tpUrl + "/" + url
                }
            }
            return resUrl
        } catch (error) {
            throw error
        }
    },
    // url => blog/cat1/cat2/.../catn/url


}


export var categoryUrlBuilder: any = {
    // url => cat1/cat2/.../catn/url
    // 1: async function (url: string, category: string, language?: string) {
    //     var contentRepo = new ContentRepository()
    //     var configRepo = new SystemConfigRepository()
    //     var languageRepo = new LanguageRepository()
    //     try {
    //         var catUrl = await contentRepo.findOne({
    //             type: "category",
    //             id: category,
    //             isMainLang: true
    //         })
    //         var resUrl = catUrl?.url + "/" + url
    //         if (language != undefined) {
    //             var l = await languageRepo.findById(language)
    //             if (l != null && l.sign != ConfigService.getConfig("defaultLanguage")) {
    //                 return "/" + l.sign + resUrl
    //             }
    //         }
    //         return resUrl
    //     } catch (error) {
    //         throw error
    //     }
    // },

    // url => /url
    1: async function (url: string, category: string, language?: string, domain?: string, isDomain?: boolean) {
        try {

            var resUrl = "/" + url
            if (language != undefined) {
                var l = await languageRepo.findById(language)
                if (l != null && l.sign != ConfigService.getConfig("defaultLanguage")) {
                    if (l.domain) {
                        var ldomain = await domainRepo.findById(l.domain as string)
                        if (ldomain != null) {
                            return ldomain.domain + "/" + resUrl
                        }
                    }
                    return "/" + l.sign + resUrl
                }
            }
            return resUrl
        } catch (error) {
            throw error
        }
    },

    // url => /blog/category/url
    2: async function (url: string, category: string, language?: string, domain?: string, isDomain?: boolean) {
        try {
            var seoPrefix = await configRepo.getConf("seo-prefix")
            var resUrl = "/" + seoPrefix?.value + "/category/" + url



            if (domain != undefined) {
                var ldomain = await domainRepo.findById(domain)
                if (ldomain != null) {
                    return ldomain.domain + "/" + seoPrefix?.value + "/category/" + url
                }
            }
            if (language != undefined) {
                var l = await languageRepo.findById(language)
                if (l != null && l.sign != ConfigService.getConfig("defaultLanguage")) {

                    if (l.domain) {
                        var ldomain = await domainRepo.findById(l.domain as string)
                        if (l.isDomain && ldomain != null && isDomain != false) {
                            return ldomain.domain + "/" + seoPrefix?.value + "/category/" + url
                        }
                    }

                    return "/" + seoPrefix?.value + "/" + l.sign + "/category/" + url
                }
            }
            return resUrl
        } catch (error) {
            throw error
        }
    },

    // url => blog/url
    3: async function (url: string, category: string, language?: string) {
        try {
            var seoPrefix = await configRepo.getConf("seo-prefix")
            var resUrl = "/" + seoPrefix?.value + "/" + url
            if (language != undefined) {
                var l = await languageRepo.findById(language)
                if (l != null && l.sign != ConfigService.getConfig("defaultLanguage")) {
                    if (l.domain) {
                        var domain = await domainRepo.findById(l.domain as string)
                        if (domain != null) {
                            return domain.domain + "/" + seoPrefix?.value + "/" + url
                        }
                    }

                    return "/" + seoPrefix?.value + "/" + l.sign + "/" + url
                }
            }
            return resUrl
        } catch (error) {
            throw error
        }
    },

    // url => blog/cat1/cat2/.../catn/url
    // 5: async function (url: string, category: string, language?: string) {
    //     var contentRepo = new ContentRepository()
    //     var configRepo = new SystemConfigRepository()
    //     var languageRepo = new LanguageRepository()
    //     try {
    //         var catUrl = await contentRepo.findOne({
    //             type: "category",
    //             id: category,
    //             isMainLang: true
    //         })
    //         var seoPrefix = await configRepo.getConf("seo-prefix")
    //         var resUrl = catUrl?.url + "/" + url
    //         if (language != undefined) {
    //             var l = await languageRepo.findById(language)
    //             if (l != null && l.sign != ConfigService.getConfig("defaultLanguage")) {
    //                 var tpUrl = catUrl?.url.substring(seoPrefix?.value.length + 1, catUrl?.url.length)
    //                 return "/" + seoPrefix?.value + "/" + l.sign + "/" + tpUrl + "/" + url
    //             }
    //         }
    //         return resUrl
    //     } catch (error) {
    //         throw error
    //     }
    // }
}