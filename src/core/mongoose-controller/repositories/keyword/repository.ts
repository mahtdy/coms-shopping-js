import { NullExpression, Types } from "mongoose";
import BaseRepositoryService, { RepositoryConfigOptions } from "../../repository";
import KeywordTaskRepository from "../keywordTask/repository";
import Keyword, { KeywordModel } from "./model";
import SystemConfigRepository from "../system/repository";
import GoogleApiTokenRepository from "../googleApiToken/repository";
import DomainRepository from "../domain/repository";
import ContentMaduleRegistry from "../../contentRegistry";
import { BasePage } from "../../basePage/model";
import Content from "../content/model";
import Language from "../language/model";
import Domain from "../domain/model";
import axios from "axios";
import LinkTagRepository from "../linkTag/repository";
import LinkMapRepository from "../linkMap/repository";

import { JSDOM } from 'jsdom';

const days = 1000 * 60 * 60 * 24
const dateRanger = {
    "1m": () => {
        return {
            start: new Date(Date.now() - (days * 31)),
            end: new Date(Date.now() - days),
        }
    },
    "3m": () => {
        return {
            start: new Date(Date.now() - (days * 91)),
            end: new Date(Date.now() - days),
        }
    },
    "6m": () => {
        return {
            start: new Date(Date.now() - (days * 181)),
            end: new Date(Date.now() - days),
        }
    },
    "1y": () => {
        return {
            start: new Date(Date.now() - (days * 366)),
            end: new Date(Date.now() - days),
        }
    },
}

export default class KeywordRepository<T extends Keyword = Keyword> extends BaseRepositoryService<T> {
    keywordTaskRepo: KeywordTaskRepository
    systemConfigRepo: SystemConfigRepository
    googleApiTokenRepo: GoogleApiTokenRepository
    domainRepo: DomainRepository
    contentRegistry: ContentMaduleRegistry
    linkTagRepo: LinkTagRepository
    linkMapRepo: LinkMapRepository


    constructor(options?: RepositoryConfigOptions) {
        super(KeywordModel as any, options)
        this.keywordTaskRepo = new KeywordTaskRepository(this)
        this.systemConfigRepo = new SystemConfigRepository()
        this.googleApiTokenRepo = new GoogleApiTokenRepository()
        this.domainRepo = new DomainRepository()
        this.contentRegistry = ContentMaduleRegistry.getInstance()
        this.linkTagRepo = new LinkTagRepository()
        this.linkMapRepo = new LinkMapRepository(this)
    }

    async getKeywordChart(id: string, dateRange: "1m" | "3m" | "6m" | "1y") {
        try {
            const keyword = await this.findOne({
                _id: id
            }, {})

            if (keyword == null) {
                throw new Error("")
            }


            const repo = this.contentRegistry.getRegistry(keyword?.pageType)?.repo
            if (repo != undefined) {
                let page = await repo.findOne({
                    _id: (keyword.page as BasePage)._id
                }, {}, [
                    {
                        path: "seoContent"
                    },
                    {
                        path: "language"
                    }
                ])

                let domain = await this.getDomain(
                    page?.language as Language
                )
                let data: any = {}

                // data["siteUrl"] = domain.domain
                // data["keyword"] = keyword.text 

                data["siteUrl"] = "sc-domain:medirence.com"
                data["keyword"] = "شرکت تجهیزات پزشکی"


                let date = dateRanger[dateRange]()

                data["start"] = date.start
                data["end"] = date.end

                return await this.sendGoogleApiReq(domain.domainId,
                    data, "users/webmaster/keyword/query-performance-by-keyword")
            }

        } catch (error) {
            throw error
        }
    }

    async getKeywordSummray(id: string, dateRange: "1m" | "3m" | "6m" | "1y") {
        try {
            const keyword = await this.findOne({
                _id: id
            }, {})

            if (keyword == null) {
                throw new Error("")
            }


            const repo = this.contentRegistry.getRegistry(keyword?.pageType)?.repo
            if (repo != undefined) {
                let page = await repo.findOne({
                    _id: (keyword.page as BasePage)._id
                }, {}, [
                    {
                        path: "seoContent"
                    },
                    {
                        path: "language"
                    }
                ])

                let domain = await this.getDomain(
                    page?.language as Language
                )
                let data: any = {}
                // data["siteUrl"] = domain.domain
                // data["keyword"] = keyword.text 

                data["siteUrl"] = "sc-domain:medirence.com"
                data["keyword"] = "شرکت تجهیزات پزشکی"

                let date = dateRanger[dateRange]()

                data["start"] = date.start
                data["end"] = date.end

                return await this.sendGoogleApiReq(domain.domainId,
                    data, "users/webmaster/keyword/summary-by-keyword")
            }

        } catch (error) {
            throw error
        }
    }

    async getKeywordPosition(id: string, date: Date) {
        try {
            const keyword = await this.findOne({
                _id: id
            }, {})

            if (keyword == null) {
                throw new Error("")
            }


            const repo = this.contentRegistry.getRegistry(keyword?.pageType)?.repo
            if (repo != undefined) {
                let page = await repo.findOne({
                    _id: (keyword.page as BasePage)._id
                }, {}, [
                    {
                        path: "seoContent"
                    },
                    {
                        path: "language"
                    }
                ])

                let domain = await this.getDomain(
                    page?.language as Language
                )
                let data: any = {}
                // data["siteUrl"] = domain.domain
                // data["keyword"] = keyword.text 


                data["siteUrl"] = "sc-domain:medirence.com"
                data["keyword"] = "شرکت تجهیزات پزشکی"

                data["date"] = date

                return await this.sendGoogleApiReq(domain.domainId,
                    data, "users/webmaster/keyword/position")
            }

        } catch (error) {
            throw error
        }
    }

    async ensureKeywords(keywords: string[] = [], admin: Types.ObjectId, pageType: string, page: string) {
        // console.log("ensureKeywords",page)
        let newKeyIds: (Types.ObjectId)[] = []
        for (let i = 0; i < keywords.length; i++) {
            let exists = await this.isExists({
                text: {
                    $eq: keywords[i]
                }
            })

            if (!exists) {
                const keyword = await this.insert({
                    text: keywords[i],
                    page,
                    pageType
                } as any)
                newKeyIds.push(keyword._id)

            }

        }

        if (newKeyIds.length > 0) {
            await this.keywordTaskRepo.insert({
                admin,
                status: "waiting",
                tasksList: [
                    "checkKeywordsInContents",
                    "checkKeywordsInComments",
                    "checkKeywordsInContent"
                ],
                keywords: newKeyIds,
                page,
                pageType
            } as any)
        }

        else {
            await this.keywordTaskRepo.insert({
                admin,
                status: "waiting",
                tasksList: [
                    "checkKeywordsInContent"
                ],
                page,
                pageType
            } as any)
        }
        let deletedKeyWords = await this.findAll({
            text: {
                $nin: keywords
            },
            pageType,
            
            page,
        })
        if (deletedKeyWords.length > 0) {
            let deletedKeyIds = deletedKeyWords.map(t => t._id)
            await this.keywordTaskRepo.insert({
                admin,
                status: "waiting",
                tasksList: ["deleteKeywordLinkInComments", "deleteKeywordLinkInContents"],
                keywords: deletedKeyIds,
                page,
                pageType
            } as any)
        }
    }

    async changeKeywords(id: string, admin: Types.ObjectId, pageType: string, page: string) {
        try {
            const keyword = await this.findByIdAndUpdate(id, {
                $set: {
                    page,
                    pageType,
                    isProccessed: false
                }
            })
            if (keyword != null) {
                await this.keywordTaskRepo.insert({
                    admin,
                    status: "waiting",
                    tasksList: ["changeKeywordLinkInComments", "changeKeywordLinkInContents"],
                    keywords: [keyword._id],
                } as any)
            }
            return keyword

        } catch (error) {
            throw error
        }
    }

    async doDeleteKeyword(id: string, admin: Types.ObjectId) {
        try {
            const keyword = await this.findByIdAndUpdate(id, {
                $unset: {
                    page: 1,
                    pageType: 1,
                    isProccessed: false
                }
            })

            if (keyword != null) {
                await this.keywordTaskRepo.insert({
                    admin,
                    status: "waiting",
                    tasksList: ["deleteKeywordLinkInContents", "deleteKeywordLinkInContents"],
                    keywords: [keyword._id]
                } as any)
            }

        } catch (error) {
            throw error
        }
    }

    async getDomain(
        language: Language
    ) {
        try {
            var domain: Domain | null
            if (language.isDomain && language.domain) {
                domain = await this.domainRepo.findOne({
                    _id: language.domain
                })

            }
            else {
                domain = await this.domainRepo.findOne({
                    isDefault: true
                })
            }
            if (domain != null) {
                return {
                    domain: `sc-domain:${domain.domain}`,
                    domainId: domain._id
                }

            }

            return {
                domain: "",
                domainId: ""
            }
        } catch (error) {
            throw error
        }
    }

    async sendGoogleApiReq(
        domainId: string | Types.ObjectId,
        data: any,
        subUrl: string
    ) {
        try {
            const googleApiToken = await this.googleApiTokenRepo.findOne({
                domains: domainId
            })


            const googleCredential = await this.systemConfigRepo.getConfigValue("google_credential")
            const apiUrl = await this.systemConfigRepo.getConfigValue("google_api_server")
            const apiKey = await this.systemConfigRepo.getConfigValue("google_api_key")
            data["credential"] = googleCredential
            data["token"] = googleApiToken?.token


            const res = await axios.post(`${apiUrl}${subUrl}`, data, {
                headers: {
                    "x-api-key": apiKey
                }
            })
            
            return res.data

        } catch (error) {
            throw error
        }
    }


    


    async actiavateLink(
        id: string,
        part: string,
        registry: ContentMaduleRegistry,
        subPartId: string,
        index?: number
    ) {
        try {
            const linkMap = await this.linkMapRepo.findOne({
                _id: id
            }, {}, [{
                path: "keyword"
            }, {
                path: "to"
            }])



            if (linkMap != null && linkMap.keyword != null && linkMap.to != null) {

                const linkTag = await this.linkTagRepo.findOne({
                    link: (linkMap.to as any).seoContent
                })
                if (linkTag == null) {
                    throw ("لینک یافت نشد")
                }
                if (part == "content") {
                    const pageRepo = registry.getRegistry(linkMap.fromType)?.repo
                    if (pageRepo != undefined) {
                        const page = await pageRepo.findById(linkMap.from as string)
                        if (page != null) {
                            let content = await pageRepo.findSubContent(page, subPartId)

                            if (content != undefined) {
                                let newContent = this.addOrWrapLinkEverywhere(content, (linkMap.keyword as any).text, linkTag.tag, index)
                                await pageRepo.updateSubContentHTML(linkMap.from as string, subPartId, {}, newContent)
                                await this.linkMapRepo.updateOne({
                                    _id: linkMap._id,
                                    "contentLinks.subPartId": subPartId
                                }, {
                                    $set: {
                                        "contentLinks.$.isActive": true,
                                        "contentLinks.$.isProccessed": true
                                    }
                                })
                            }


                        }
                    }

                }
            }



        }
        catch (error) {
            console.log(error)
            throw error
        }
    }

    async deactivateLink(
        id: string,
        part: string,
        registry: ContentMaduleRegistry,
        subPartId: string,
        index?: number
    ) {
        try {
            const linkMap = await this.linkMapRepo.findOne({
                _id: id
            }, {}, [{
                path: "keyword"
            }, {
                path: "to"
            }])



            if (linkMap != null && linkMap.keyword != null && linkMap.to != null) {

                if (part == "content") {
                    const pageRepo = registry.getRegistry(linkMap.fromType)?.repo
                    if (pageRepo != undefined) {
                        const page = await pageRepo.findById(linkMap.from as string)
                        if (page != null) {
                            let content = await pageRepo.findSubContent(page, subPartId)

                            if (content != undefined) {
                                let newContent = this.removeLinkEverywhere(content, (linkMap.keyword as any).text, index)
                                await pageRepo.updateSubContentHTML(linkMap.from as string, subPartId, {}, newContent)
                                await this.linkMapRepo.updateOne({
                                    _id: linkMap._id,
                                    "contentLinks.subPartId": subPartId
                                }, {
                                    $set: {
                                        "contentLinks.$.isActive": false,
                                        "contentLinks.$.isProccessed": true
                                    }
                                })
                            }


                        }
                    }

                }
            }



        }
        catch (error) {
            console.log(error)
            throw error
        }
    }


    async rejectLink(
        id: string,
        part: string,
        registry: ContentMaduleRegistry,
        subPartId: string,
    ){
        try {
            await this.linkMapRepo.updateOne({
                _id: id,
                "contentLinks.subPartId": subPartId
            }, {
                $set: {
                    "contentLinks.$.isRejected":true,
                    "contentLinks.$.isProccessed": true
                }
            })
        } catch (error) {
            throw error
        }
    }



    addOrWrapLinkEverywhere(
        html: string,
        anchorText: string,
        newHref: string,
        index?: number
    ): string {
        const dom = new JSDOM(html);
        const document = dom.window.document;

        type Match = { type: 'a' | 'text' | 'img', node: Node };

        const matches: Match[] = [];

        // تابع کمکی برای traverse کردن DOM
        function traverse(node: Node) {
            if (node.nodeType === 1) {
                const el = node as HTMLElement;

                if (el.tagName.toLowerCase() === 'a' && el.textContent?.includes(anchorText)) {
                    matches.push({ type: 'a', node: el });
                } else if (el.tagName.toLowerCase() === 'img' && el.getAttribute('alt')?.includes(anchorText)) {
                    matches.push({ type: 'img', node: el });
                }

                // ادامه traverse روی بچه‌ها
                el.childNodes.forEach(traverse);
            } else if (node.nodeType === 3) { // Text node
                const textNode = node as Text;
                if (textNode.textContent?.includes(anchorText)) {
                    matches.push({ type: 'text', node: textNode });
                }
            }
        }

        traverse(document.body);

        // اعمال لینک
        if (index !== undefined) {
            const m = matches[index]; // index انسانی، اول = 1
            if (m) this.applyLink(m, newHref, anchorText, document);
        } else {
            matches.forEach(m => this.applyLink(m, newHref, anchorText, document));
        }

        return document.body.innerHTML;
    }

    applyLink(match: { type: 'a' | 'text' | 'img', node: Node }, newHref: string, anchorText: string, document: Document) {
        if (match.type === 'a') {
            (match.node as HTMLAnchorElement).setAttribute('href', newHref);
        } else if (match.type === 'text') {
            const textNode = match.node as Text;
            const parent = textNode.parentElement;
            if (parent) {
                const replaced = textNode.textContent!.replace(
                    new RegExp(anchorText, 'g'),
                    `<a href="${newHref}">${anchorText}</a>`
                );
                const frag = document.createRange().createContextualFragment(replaced);
                parent.replaceChild(frag, textNode);
            }
        } else if (match.type === 'img') {
            const img = match.node as HTMLImageElement;
            if (!img.parentElement || img.parentElement.tagName.toLowerCase() !== 'a') {
                const link = document.createElement('a');
                link.setAttribute('href', newHref);
                img.replaceWith(link);
                link.appendChild(img);
            }
        }
    }


    removeLinkEverywhere(
        html: string,
        anchorText: string,
        index?: number
    ): string 
    {
        const dom = new JSDOM(html);
        const document = dom.window.document;

        type Match = { type: 'a' | 'text' | 'img', node: Node };
        const matches: Match[] = [];

        // traverse برای پیدا کردن node ها
        function traverse(node: Node) {
            if (node.nodeType === 1) {
                const el = node as HTMLElement;

                if (el.tagName.toLowerCase() === 'a' && el.textContent?.includes(anchorText)) {
                    matches.push({ type: 'a', node: el });
                } else if (el.tagName.toLowerCase() === 'img' && el.getAttribute('alt')?.includes(anchorText)) {
                    matches.push({ type: 'img', node: el });
                }

                el.childNodes.forEach(traverse);
            } else if (node.nodeType === 3) { // Text node
                const textNode = node as Text;
                if (textNode.textContent?.includes(anchorText)) {
                    matches.push({ type: 'text', node: textNode });
                }
            }
        }

        traverse(document.body);

        // اعمال حذف لینک
        if (index !== undefined) {
            const m = matches[index - 1]; // index انسانی
            if (m) this.removeLink(m);
        } else {
            matches.forEach(m => this.removeLink(m));
        }

        return document.body.innerHTML;
    }

    private removeLink(match: { type: 'a' | 'text' | 'img', node: Node }) {
        if (match.type === 'a') {
            const a = match.node as HTMLAnchorElement;
            const parent = a.parentElement;
            if (parent) {
                while (a.firstChild) {
                    parent.insertBefore(a.firstChild, a);
                }
                parent.removeChild(a);
            }
        }

        else if (match.type === 'img') {
            const img = match.node as HTMLImageElement;
            const parent = img.parentElement;
            if (parent && parent.tagName.toLowerCase() === 'a') {
                parent.replaceWith(img);
            }
        }

        else if (match.type === 'text') {
            const parent = match.node.parentElement;
            if (parent && parent.tagName.toLowerCase() === 'a') {
                const grand = parent.parentElement;
                if (grand) {
                    while (parent.firstChild) {
                        grand.insertBefore(parent.firstChild, parent);
                    }
                    grand.removeChild(parent);
                }
            }
        }
    }
}