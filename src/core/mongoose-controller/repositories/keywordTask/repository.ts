import BaseRepositoryService, { RepositoryConfigOptions } from "../../repository";
import KeywordTask, { KeywordTaskModel, Task } from "./model";
import { JSDOM } from 'jsdom';
import ContentMaduleRegistry from "../../contentRegistry"
import CommentRepository from "../comment/repository";
import KeywordRepository from "../keyword/repository";
import Keyword from "../keyword/model";
import LinkMapRepository from "../linkMap/repository";
import { Types } from "mongoose";
import LinkTagRepository from "../linkTag/repository";
import Content from "../content/model"


type CheckResult = {
    foundAnchorText: boolean;
    foundInAnchor: boolean;
    foundInImageAlt: boolean;
    foundInPlainText: boolean;
    allLinksValid: boolean;
    invalidLinks: string[];
    haveActive: boolean
};

type UpdateResult = {
    updatedHtml: string;
    foundInAnchor: boolean;
    foundInImageAlt: boolean;
    haveActive: boolean;
    updated: boolean;
    invalidLinks?: string[];
};

let started = false

// const contentRepo = new ContentRepository()


export default class KeywordTaskRepository extends BaseRepositoryService<KeywordTask> {
    registry: ContentMaduleRegistry
    commentRepo: CommentRepository
    keywordRepo: KeywordRepository
    linkMapRepo: LinkMapRepository
    linkTagRepo: LinkTagRepository

    constructor(keywordRepo: KeywordRepository, options?: RepositoryConfigOptions) {
        super(KeywordTaskModel, options);
        this.registry = ContentMaduleRegistry.getInstance()
        this.commentRepo = new CommentRepository()
        this.keywordRepo = keywordRepo
        this.linkMapRepo = new LinkMapRepository(keywordRepo)
        this.linkTagRepo = new LinkTagRepository()

        if (started == false) {
            started = true
            this.runTasks()
        }
    }

    async updateTaskInfo(id: string, type: string, module: string, count: number) {
        try {
            await this.updateOne({
                _id: id,

            }, {
                $inc: {
                    "tasks.$[task].proccessed": count
                },

            }, {
                arrayFilters: [{
                    "task.type": type,
                    "task.module": module
                }]
            })
        } catch (error) {
            throw error
        }
    }

    async taskFinished(id: string, type: string, module: string) {
        try {
            await this.updateOne({
                _id: id,
            }, {
                $set: {
                    "tasks.$[task].status": "compeleted"
                }
            }, {
                arrayFilters: [{
                    "task.type": type,
                    "task.module": module
                }]
            })
        } catch (error) {
            throw error
        }
    }

    async taskStarted(id: string, type: string, module: string) {
        try {
            await this.updateOne({
                _id: id,
                "tasks.type": type,
                "tasks.module": module
            }, {
                $set: {
                    "tasks.$.status": "running"
                }
            })
        } catch (error) {
            throw error
        }
    }

    removeLinksByAnchorText(html: string, anchorText: string): string {
        const dom = new JSDOM(html);
        const document = dom.window.document;

        const links = document.querySelectorAll('a');

        links.forEach((link) => {
            if (link.textContent?.trim() === anchorText) {
                const textNode = document.createTextNode(link.textContent || '');
                link.replaceWith(textNode);
            }
        });

        return document.body.innerHTML
    }

    updateLinkHrefByAnchorText(
        html: string,
        anchorText: string,
        newHref: string,
        allowedLinks: string[]
    ): UpdateResult {
        const dom = new JSDOM(html);
        const document = dom.window.document;

        const links = document.querySelectorAll('a');
        const images = document.querySelectorAll('img');

        let foundInAnchor = false;
        let foundInImageAlt = false;
        let haveActive = false;
        let updated = false;
        const invalidLinks: string[] = [];

        for (const link of links) {
            const text = link.textContent?.trim();
            const href = link.getAttribute('href')?.trim() || '';
           
            if (text === anchorText) {
                foundInAnchor = true;
                if (!allowedLinks.includes(href)) {
                    link.setAttribute('href', newHref);
                    haveActive = true;
                    updated = true;
                } else {
                    invalidLinks.push(href);
                }
            }
        }

        for (const img of images) {
            const alt = img.getAttribute('alt')?.trim();
            if (alt === anchorText) {
                foundInImageAlt = true;
            }
        }

        return {
            updatedHtml: document.body.innerHTML,
            foundInAnchor,
            foundInImageAlt,
            haveActive,
            updated,
            invalidLinks,
        };
    }

    checkAnchorTextAndLinks(
        html: string,
        anchorText: string,
        allowedLinks: string[]
    ): CheckResult {
        const dom = new JSDOM(html);
        const document = dom.window.document;

        const links = document.querySelectorAll('a');
        const images = document.querySelectorAll('img');

        let foundInAnchor = false;
        let foundInImageAlt = false;
        let foundInPlainText = false;
        let haveActive = false

        const invalidLinks: string[] = [];

        for (const link of links) {
            const text = link.textContent?.trim();
            const href = link.getAttribute('href')?.trim() || '';

            if (text === anchorText) {
                foundInAnchor = true;
                if (!allowedLinks.includes(href)) {
                    invalidLinks.push(href);
                }
                else {
                    haveActive = true
                }
            }
        }

        for (const img of images) {
            const alt = img.getAttribute('alt')?.trim();
            if (alt === anchorText) {
                foundInImageAlt = true;
            }
        }

        const bodyText = document.body.textContent || '';
        if (bodyText.includes(anchorText)) {
            foundInPlainText = true;
        }

        return {
            foundAnchorText: foundInAnchor || foundInImageAlt || foundInPlainText,
            foundInAnchor,
            foundInImageAlt,
            foundInPlainText,
            allLinksValid: invalidLinks.length === 0,
            invalidLinks,
            haveActive
        };
    }

    async proccess(keywordTask: KeywordTask) {
        let tasksList = keywordTask.tasksList
        let tasks = keywordTask.tasks

        for (let i = 0; i < tasksList.length; i++) {
            if (tasksList[i] == "checkKeywordInContents" && keywordTask.keyword != undefined) {
                let keyword = await this.keywordRepo.findById(keywordTask.keyword as string)
                if (keyword != null) {
                    await this.proccessKeyWordInContents(keyword, keywordTask, tasksList[i])
                }
            }


            if (tasksList[i] == "checkKeywordsInContent" && keywordTask.page != undefined && keywordTask.pageType != undefined) {
                await this.proccessKeyWordsInContent(
                    keywordTask,
                    keywordTask.page as Types.ObjectId,
                    keywordTask.pageType,
                    tasksList[i]
                )
            }

            if (tasksList[i] == "checkKeywordsInContents" && keywordTask.keywords) {
                const keywords = await this.keywordRepo.findAll({
                    _id: {
                        $in: keywordTask.keywords
                    }
                })
                await this.proccessKeyWordsInContents(keywords, keywordTask, tasksList[i])
            }

            if (tasksList[i] == "checkKeywordInComments" && keywordTask.keyword != undefined) {
                let keyword = await this.keywordRepo.findById(keywordTask.keyword as string)
                if (keyword != null) {
                    await this.proccessKeyWordInComments(keyword, keywordTask, tasksList[i])
                }
            }

            if (tasksList[i] == "checkKeywordsInComments") {
                const keywords = await this.keywordRepo.findAll({
                    _id: {
                        $in: keywordTask.keywords
                    }
                })
                await this.proccessKeyWordsInComments(keywords, keywordTask, tasksList[i])
            }

            if (tasksList[i] == "checkAllKeyWordsInComments") {
                await this.proccessAllKeyWordsInComments(keywordTask, tasksList[i])
            }

            if (tasksList[i] == "changeKeywordLinkInContents" && keywordTask.keywords != undefined) {
                const keywords = await this.keywordRepo.findAll({
                    _id: {
                        $in: keywordTask.keywords
                    }
                })
                await this.changeKeywordLinkInContents(keywords, keywordTask, tasksList[i])
            }

            if (tasksList[i] == "changeKeywordLinkInComments" && keywordTask.keywords != undefined) {
                const keywords = await this.keywordRepo.findAll({
                    _id: {
                        $in: keywordTask.keywords
                    }
                })
                await this.changeKeywordLinkInComments(keywords, keywordTask, tasksList[i])

            }

            if (tasksList[i] == "deleteKeywordLinkInContents" && keywordTask.keywords != undefined) {

                const keywords = await this.keywordRepo.findAll({
                    _id: {
                        $in: keywordTask.keywords
                    }
                })

                await this.deleteKeywordLinkInContents(keywords, keywordTask, tasksList[i])
            }

            if (tasksList[i] == "deleteKeywordLinkInComments" && keywordTask.keywords != undefined) {
                const keywords = await this.keywordRepo.findAll({
                    _id: {
                        $in: keywordTask.keywords
                    }
                })

                await this.deleteKeywordLinkInComments(keywords, keywordTask, tasksList[i])
            }
        }
    }

    async proccessKeyWordInContents(
        keyword: Keyword,
        task: KeywordTask,
        taskName: string

    ) {
        let modules: string[] = this.registry.getAllRegistriesName()

        let data: {
            [k: string]: any
        } = {}

        let links: string[] = []

        const keywordRepo = this.registry.getRegistry(keyword.pageType)?.repo
        if (keywordRepo != undefined) {
            const keywordPage = await keywordRepo.findOne({
                _id: keyword.page
            }, {}, [{
                path: "seoContent",
                select: ["url"]
            }])

            if (keywordPage != null && keywordPage.seoContent != null && keywordPage.seoContent != undefined) {
                links.push((keywordPage.seoContent as Content).url)

                let linkTag = await this.linkTagRepo.findOne({
                    link: (keywordPage.seoContent as Content)._id
                })

                if (linkTag != null) {
                    links.push(linkTag.tag)
                }
            }


        }



        for (let i = 0; i < modules.length; i++) {
            let name: string = modules[i]

            await this.taskStarted(task._id, taskName, name)
            let repo = this.registry.getRegistry(name)?.repo
            let count = await repo?.getcount({}) || 0
            let limit = 10


            for (let j = 0; j <= count / limit; j++) {
                let pageData = await repo?.findMany({}, {
                    population: [{
                        path: "seoContent"
                    }]
                }, j + 1, limit) || []

                for (let k = 0; k < pageData.length; k++) {
                    let doc = pageData[k]
                    if (doc._id.toHexString() == (keyword.page as Types.ObjectId).toHexString()
                        && keyword.pageType == name
                    ) {
                        continue
                    }

                    let contents = repo?.extractContents(doc) || []

                    let linkMap = await this.linkMapRepo.findOne({
                        keyword: keyword._id,
                        from: doc._id,
                        fromType: name,
                    })




                    for (let z = 0; z < contents.length; z++) {
                        let result = this.checkAnchorTextAndLinks(contents[z].text, keyword.text, links)

                        if (result.foundAnchorText) {

                            if (linkMap == null) {
                                linkMap = await this.linkMapRepo.insert({
                                    from: doc._id,
                                    fromType: name,
                                    keyword: keyword._id,

                                    to: keyword.page,
                                    toType: keyword.pageType,

                                    contentLinks: [{
                                        subPartId: contents[z].id,
                                        extraInfo: Object.assign(contents[z].extra, {
                                            foundInPlainText: result.foundInPlainText,
                                            foundInAnchor: result.foundInAnchor,
                                            foundInImageAlt: result.foundInImageAlt,
                                            allLinksValid: result.allLinksValid,
                                            invalidLinks: result.invalidLinks
                                        }),
                                        isActive: result.haveActive,
                                        isRejected: false,
                                        isWrong: !result.allLinksValid
                                    }]
                                } as any)
                            }

                            else {
                                await this.linkMapRepo.updateLinkIfNotExists(linkMap, "contentLinks", {
                                    subPartId: contents[z].id,
                                    extraInfo: Object.assign(contents[z].extra, {
                                        foundInPlainText: result.foundInPlainText,
                                        foundInAnchor: result.foundInAnchor,
                                        foundInImageAlt: result.foundInImageAlt,
                                        allLinksValid: result.allLinksValid,
                                        invalidLinks: result.invalidLinks
                                    }),
                                    isActive: result.haveActive,
                                    isRejected: false,
                                    isWrong: !result.allLinksValid
                                })
                            }
                        }

                        else {
                            if (linkMap != null) {
                                await this.linkMapRepo.deleteLinkFromMap(linkMap._id, "contentLinks", contents[z].id)
                            }
                        }
                    }

                    let sumrray = doc.summary || ""
                    let result = this.checkAnchorTextAndLinks(sumrray, keyword.text, links)
                    let finalLink = {
                        extraInfo: {
                            foundInPlainText: result.foundInPlainText,
                            foundInAnchor: result.foundInAnchor,
                            foundInImageAlt: result.foundInImageAlt,
                            allLinksValid: result.allLinksValid,
                            invalidLinks: result.invalidLinks
                        },
                        isActive: result.haveActive,
                        isRejected: false,
                        isWrong: !result.allLinksValid
                    }
                    if (result.foundAnchorText) {

                        if (linkMap == null) {
                            linkMap = await this.linkMapRepo.insert({
                                from: doc._id,
                                fromType: name,
                                keyword: keyword._id,

                                to: keyword.page,
                                toType: keyword.pageType,

                                summaryLinks: [finalLink]
                            } as any)
                        }

                        else {
                            finalLink.isRejected = linkMap.summaryLinks?.[0]?.isRejected || false

                            await this.linkMapRepo.updateOne({
                                _id: linkMap._id
                            }, {
                                $set: {
                                    summaryLinks: [finalLink]
                                }
                            })
                        }
                    }
                    else {
                        if (linkMap != null) {
                            await this.linkMapRepo.updateOne({
                                _id: linkMap._id
                            }, {
                                $set: {
                                    summaryLinks: []
                                }
                            })
                        }
                    }

                    let faq = doc.commonQuestions || []
                    for (let z = 0; z < faq.length; z++) {
                        let result = this.checkAnchorTextAndLinks(faq[z].answer, keyword.text, links)

                        let finalLink = {
                            subPartId: faq[z]._id,
                            extraInfo: Object.assign({
                                status: faq[z].publishAt < new Date(),
                                publishAt: faq[z].publishAt
                            }, {
                                foundInPlainText: result.foundInPlainText,
                                foundInAnchor: result.foundInAnchor,
                                foundInImageAlt: result.foundInImageAlt,
                                allLinksValid: result.allLinksValid,
                                invalidLinks: result.invalidLinks
                            }),
                            isActive: result.haveActive,
                            isRejected: false,
                            isWrong: !result.allLinksValid
                        }

                        if (result.foundAnchorText) {

                            if (linkMap == null) {
                                linkMap = await this.linkMapRepo.insert({
                                    from: doc._id,
                                    fromType: name,
                                    keyword: keyword._id,

                                    to: keyword.page,
                                    toType: keyword.pageType,

                                    faqLinks: [finalLink]
                                } as any)
                            }

                            else {
                                await this.linkMapRepo.updateLinkIfNotExists(linkMap, "faqLinks", finalLink)
                            }
                        }

                        else {
                            if (linkMap != null) {
                                await this.linkMapRepo.deleteLinkFromMap(linkMap._id, "faqLinks", faq[z]._id)
                            }
                        }
                    }

                }
                await this.updateTaskInfo(task._id, taskName, name, pageData.length)
            }
            await this.taskFinished(task._id, taskName, name)
        }

        return data
    }

    async proccessKeyWordsInContents(
        keywords: Keyword[],
        task: KeywordTask,
        taskName: string
    ) {

        let modules: string[] = this.registry.getAllRegistriesName()

        let data: {
            [k: string]: any
        } = {}

        for (let i = 0; i < modules.length; i++) {
            let name: string = modules[i]



            await this.taskStarted(task._id, taskName, name)

            let repo = this.registry.getRegistry(name)?.repo
            let count = await repo?.getcount({}) || 0
            let limit = 10


            for (let j = 0; j <= count / limit; j++) {
                let pageData = await repo?.findMany({}, {
                    population: [{
                        path: "seoContent"
                    }]
                }, j + 1, limit) || []

                for (let k = 0; k < pageData.length; k++) {
                    let doc = pageData[k]
                    for (let n = 0; n < keywords.length; n++) {

                        const keyword = keywords[n]



                        if (doc._id.toHexString() == (keyword.page as Types.ObjectId).toHexString()
                            && keyword.pageType == name
                        ) {
                            continue
                        }


                        let links: string[] = []

                        const keywordRepo = this.registry.getRegistry(keyword.pageType)?.repo
                        if (keywordRepo != undefined) {
                            const keywordPage = await keywordRepo.findOne({
                                _id: keyword.page
                            }, {}, [{
                                path: "seoContent",
                                select: ["url"]
                            }])

                            if (keywordPage != null && keywordPage.seoContent != null && keywordPage.seoContent != undefined) {
                                links.push((keywordPage.seoContent as Content).url)

                                let linkTag = await this.linkTagRepo.findOne({
                                    link: (keywordPage.seoContent as Content)._id
                                })

                                if (linkTag != null) {
                                    links.push(linkTag.tag)
                                }
                            }
                        }

                        let contents = repo?.extractContents(doc) || []

                        let linkMap = await this.linkMapRepo.findOne({
                            keyword: keyword._id,
                            from: doc._id,
                            fromType: name,
                        })


                        for (let z = 0; z < contents.length; z++) {
                            let result = this.checkAnchorTextAndLinks(contents[z].text, keyword.text, links)

                            if (result.foundAnchorText) {
                                if (linkMap == null) {
                                    linkMap = await this.linkMapRepo.insert({
                                        from: doc._id,
                                        fromType: name,
                                        keyword: keyword._id,

                                        to: keyword.page,
                                        toType: keyword.pageType,

                                        contentLinks: [{
                                            subPartId: contents[z].id,
                                            extraInfo: Object.assign(contents[z].extra, {
                                                foundInPlainText: result.foundInPlainText,
                                                foundInAnchor: result.foundInAnchor,
                                                foundInImageAlt: result.foundInImageAlt,
                                                allLinksValid: result.allLinksValid,
                                                invalidLinks: result.invalidLinks
                                            }),
                                            isActive: result.haveActive,
                                            isRejected: false,
                                            isWrong: !result.allLinksValid
                                        }]
                                    } as any)
                                }

                                else {
                                    await this.linkMapRepo.updateLinkIfNotExists(linkMap, "contentLinks", {
                                        subPartId: contents[z].id,
                                        extraInfo: Object.assign(contents[z].extra, {
                                            foundInPlainText: result.foundInPlainText,
                                            foundInAnchor: result.foundInAnchor,
                                            foundInImageAlt: result.foundInImageAlt,
                                            allLinksValid: result.allLinksValid,
                                            invalidLinks: result.invalidLinks
                                        }),
                                        isActive: result.haveActive,
                                        isRejected: false,
                                        isWrong: !result.allLinksValid
                                    })
                                }
                            }

                            else {

                                if (linkMap != null) {
                                    await this.linkMapRepo.deleteLinkFromMap(linkMap._id, "contentLinks", contents[z].id)
                                }
                            }
                        }

                        let sumrray = doc.summary || ""
                        let result = this.checkAnchorTextAndLinks(sumrray, keyword.text, links)
                        let finalLink = {
                            extraInfo: {
                                foundInPlainText: result.foundInPlainText,
                                foundInAnchor: result.foundInAnchor,
                                foundInImageAlt: result.foundInImageAlt,
                                allLinksValid: result.allLinksValid,
                                invalidLinks: result.invalidLinks
                            },
                            isActive: result.haveActive,
                            isRejected: false,
                            isWrong: !result.allLinksValid
                        }
                        if (result.foundAnchorText) {

                            if (linkMap == null) {
                                linkMap = await this.linkMapRepo.insert({
                                    from: doc._id,
                                    fromType: name,
                                    keyword: keyword._id,

                                    to: keyword.page,
                                    toType: keyword.pageType,

                                    summaryLinks: [finalLink]
                                } as any)
                            }

                            else {
                                finalLink.isRejected = linkMap.summaryLinks?.[0]?.isRejected || false

                                await this.linkMapRepo.updateOne({
                                    _id: linkMap._id
                                }, {
                                    $set: {
                                        summaryLinks: [finalLink]
                                    }
                                })
                            }
                        }
                        else {
                            if (linkMap != null) {
                                await this.linkMapRepo.updateOne({
                                    _id: linkMap._id
                                }, {
                                    $set: {
                                        summaryLinks: []
                                    }
                                })
                            }
                        }


                        let faq = doc.commonQuestions || []
                        for (let z = 0; z < faq.length; z++) {
                            let result = this.checkAnchorTextAndLinks(faq[z].answer, keyword.text, links)

                            let finalLink = {
                                subPartId: faq[z]._id,
                                extraInfo: Object.assign({
                                    status: faq[z].publishAt < new Date(),
                                    publishAt: faq[z].publishAt
                                }, {
                                    foundInPlainText: result.foundInPlainText,
                                    foundInAnchor: result.foundInAnchor,
                                    foundInImageAlt: result.foundInImageAlt,
                                    allLinksValid: result.allLinksValid,
                                    invalidLinks: result.invalidLinks
                                }),
                                isActive: result.haveActive,
                                isRejected: false,
                                isWrong: !result.allLinksValid
                            }

                            if (result.foundAnchorText) {

                                if (linkMap == null) {
                                    linkMap = await this.linkMapRepo.insert({
                                        from: doc._id,
                                        fromType: name,
                                        keyword: keyword._id,

                                        to: keyword.page,
                                        toType: keyword.pageType,

                                        faqLinks: [finalLink]
                                    } as any)
                                }

                                else {
                                    await this.linkMapRepo.updateLinkIfNotExists(linkMap, "faqLinks", finalLink)
                                }
                            }

                            else {
                                if (linkMap != null) {
                                    await this.linkMapRepo.deleteLinkFromMap(linkMap._id, "faqLinks", faq[z]._id)
                                }
                            }
                        }

                    }

                }
                await this.updateTaskInfo(task._id, taskName, name, pageData.length)
            }
            await this.taskFinished(task._id, taskName, name)
        }

        return data
    }

    async proccessKeyWordsInContent(
        task: KeywordTask,
        page: Types.ObjectId,
        pageType: string,
        taskName: string
    ) {
        const repo = this.registry.getRegistry(pageType)?.repo
        if (repo == undefined) {
            return
        }

        let doc = await repo.findById(page)
        if (doc == null) {
            return
        }
        let limit = 10
        let count = await this.keywordRepo.getcount({}) || 0
        await this.taskStarted(task._id, taskName, pageType)

        for (let j = 0; j <= count / limit; j++) {
            let pageData = await this.keywordRepo.findMany({}, {}, j + 1, limit) || []
            for (let k = 0; k < pageData.length; k++) {
                let keyword = pageData[k]



                if (doc._id == (keyword.page as Types.ObjectId).toHexString()
                    && keyword.pageType == pageType
                ) {
                    continue
                }


                let links: string[] = []

                const keywordRepo = this.registry.getRegistry(keyword.pageType)?.repo
                if (keywordRepo != undefined) {
                    const keywordPage = await keywordRepo.findOne({
                        _id: keyword.page
                    }, {}, [{
                        path: "seoContent",
                        select: ["url"]
                    }])

                    if (keywordPage != null && keywordPage.seoContent != null && keywordPage.seoContent != undefined) {
                        links.push((keywordPage.seoContent as Content).url)

                        let linkTag = await this.linkTagRepo.findOne({
                            link: (keywordPage.seoContent as Content)._id
                        })

                        if (linkTag != null) {
                            links.push(linkTag.tag)
                        }
                    }
                }

                let contents = repo?.extractContents(doc) || []

                let linkMap = await this.linkMapRepo.findOne({
                    keyword: keyword._id,
                    from: doc._id,
                    fromType: pageType,
                })

                for (let z = 0; z < contents.length; z++) {
                    let result = this.checkAnchorTextAndLinks(contents[z].text, keyword.text, [])

                    if (result.foundAnchorText) {

                        if (linkMap == null) {
                            linkMap = await this.linkMapRepo.insert({
                                from: doc._id,
                                fromType: pageType,
                                keyword: keyword._id,

                                to: keyword.page,
                                toType: keyword.pageType,

                                contentLinks: [{
                                    subPartId: contents[z].id,
                                    extraInfo: Object.assign(contents[z].extra, {
                                        foundInPlainText: result.foundInPlainText,
                                        foundInAnchor: result.foundInAnchor,
                                        foundInImageAlt: result.foundInImageAlt,
                                        allLinksValid: result.allLinksValid,
                                        invalidLinks: result.invalidLinks
                                    }),
                                    isActive: result.haveActive,
                                    isRejected: false,
                                    isWrong: !result.allLinksValid
                                }]
                            } as any)
                        }

                        else {
                            await this.linkMapRepo.updateLinkIfNotExists(linkMap, "contentLinks", {
                                subPartId: contents[z].id,
                                extraInfo: Object.assign(contents[z].extra, {
                                    foundInPlainText: result.foundInPlainText,
                                    foundInAnchor: result.foundInAnchor,
                                    foundInImageAlt: result.foundInImageAlt,
                                    allLinksValid: result.allLinksValid,
                                    invalidLinks: result.invalidLinks
                                }),
                                isActive: result.haveActive,
                                isRejected: false,
                                isWrong: !result.allLinksValid
                            })
                        }
                    }

                    else {
                        if (linkMap != null) {
                            await this.linkMapRepo.deleteLinkFromMap(linkMap._id, "contentLinks", contents[z].id)
                        }
                    }
                }

                let sumrray = doc.summary || ""
                let result = this.checkAnchorTextAndLinks(sumrray, keyword.text, links)
                let finalLink = {
                    extraInfo: {
                        foundInPlainText: result.foundInPlainText,
                        foundInAnchor: result.foundInAnchor,
                        foundInImageAlt: result.foundInImageAlt,
                        allLinksValid: result.allLinksValid,
                        invalidLinks: result.invalidLinks
                    },
                    isActive: result.haveActive,
                    isRejected: linkMap?.summaryLinks?.[0]?.isRejected || false,
                    isWrong: !result.allLinksValid
                }
                if (result.foundAnchorText) {

                    if (linkMap == null) {
                        linkMap = await this.linkMapRepo.insert({
                            from: doc._id,
                            fromType: pageType,
                            keyword: keyword._id,

                            to: keyword.page,
                            toType: keyword.pageType,

                            summaryLinks: [finalLink]
                        } as any)
                    }

                    else {

                        await this.linkMapRepo.updateOne({
                            _id: linkMap._id
                        }, {
                            $set: {
                                summaryLinks: [finalLink]
                            }
                        })
                    }
                }
                else {
                    if (linkMap != null) {
                        await this.linkMapRepo.updateOne({
                            _id: linkMap._id
                        }, {
                            $set: {
                                summaryLinks: []
                            }
                        })
                    }
                }


                let faq = doc.commonQuestions || []
                for (let z = 0; z < faq.length; z++) {
                    let result = this.checkAnchorTextAndLinks(faq[z].answer, keyword.text, links)

                    let finalLink = {
                        subPartId: faq[z]._id,
                        extraInfo: Object.assign({
                            status: faq[z].publishAt < new Date(),
                            publishAt: faq[z].publishAt
                        }, {
                            foundInPlainText: result.foundInPlainText,
                            foundInAnchor: result.foundInAnchor,
                            foundInImageAlt: result.foundInImageAlt,
                            allLinksValid: result.allLinksValid,
                            invalidLinks: result.invalidLinks
                        }),
                        isActive: result.haveActive,
                        isRejected: false,
                        isWrong: !result.allLinksValid
                    }

                    if (result.foundAnchorText) {

                        if (linkMap == null) {
                            linkMap = await this.linkMapRepo.insert({
                                from: doc._id,
                                fromType: pageType,
                                keyword: keyword._id,

                                to: keyword.page,
                                toType: keyword.pageType,

                                faqLinks: [finalLink]
                            } as any)
                        }

                        else {
                            await this.linkMapRepo.updateLinkIfNotExists(linkMap, "faqLinks", finalLink)
                        }
                    }

                    else {
                        if (linkMap != null) {
                            await this.linkMapRepo.deleteLinkFromMap(linkMap._id, "faqLinks", faq[z]._id)
                        }
                    }
                }

            }
            await this.updateTaskInfo(task._id, taskName, pageType, pageData.length)
        }
        await this.taskFinished(task._id, taskName, pageType)
    }

    async proccessKeyWordInComments(
        keyword: Keyword,
        task: KeywordTask,
        taskName: string
    ) {
        let links: string[] = []

        const keywordRepo = this.registry.getRegistry(keyword.pageType)?.repo
        if (keywordRepo != undefined) {
            const keywordPage = await keywordRepo.findOne({
                _id: keyword.page
            }, {}, [{
                path: "seoContent",
                select: ["url"]
            }])

            if (keywordPage != null && keywordPage.seoContent != null && keywordPage.seoContent != undefined) {
                links.push((keywordPage.seoContent as Content).url)

                let linkTag = await this.linkTagRepo.findOne({
                    link: (keywordPage.seoContent as Content)._id
                })

                if (linkTag != null) {
                    links.push(linkTag.tag)
                }
            }
        }

        let limit = 10
        let count = await this.commentRepo.getcount({}) || 0

        await this.taskStarted(task._id, taskName, "comment")

        const repo = this.registry.getRegistry(keyword.pageType)?.repo

        const doc = await repo?.findOne({
            _id: keyword.page
        },
            {}, [{
                path: "seoContent",
                select: ["url"]
            }])

        for (let j = 0; j <= count / limit; j++) {

            let pageData = await this.commentRepo.findMany({}, {}, j + 1, limit) || []
            for (let k = 0; k < pageData.length; k++) {
                let comment = pageData[k]


                if ((comment.page as Types.ObjectId).toHexString() == (keyword.page as Types.ObjectId).toHexString()
                    && comment.module == keyword.pageType
                ) {
                    continue
                }


                let linkMap = await this.linkMapRepo.findOne({
                    keyword: keyword._id,
                    from: comment.page,
                    fromType: comment.module,
                })



                let result = this.checkAnchorTextAndLinks(comment.text, keyword.text, links)

                if (result.foundAnchorText) {

                    let finalLink = {
                        subPartId: comment._id,
                        extraInfo: Object.assign({
                            satatus: comment.status == "confirmed"
                        }, {
                            foundInPlainText: result.foundInPlainText,
                            foundInAnchor: result.foundInAnchor,
                            foundInImageAlt: result.foundInImageAlt,
                            allLinksValid: result.allLinksValid,
                            invalidLinks: result.invalidLinks
                        }),
                        isActive: result.haveActive,
                        isRejected: false,
                        isWrong: !result.allLinksValid
                    }

                    if (linkMap == null) {
                        linkMap = await this.linkMapRepo.insert({
                            from: comment.page,
                            fromType: comment.module,
                            keyword: keyword._id,

                            to: keyword.page,
                            toType: keyword.pageType,

                            commentLinks: [finalLink]
                        } as any)
                    }

                    else {
                        await this.linkMapRepo.updateLinkIfNotExists(linkMap, "commentLinks", finalLink)
                    }

                }

                else {
                    if (linkMap != null) {
                        await this.linkMapRepo.deleteLinkFromMap(linkMap._id, "commentLinks", comment._id)
                    }
                }

            }

            await this.updateTaskInfo(task._id, taskName, "comment", pageData.length)

        }
        await this.taskFinished(task._id, taskName, "comment")
    }

    async proccessKeyWordsInComments(
        keywords: Keyword[],
        task: KeywordTask,
        taskName: string
    ) {

        let limit = 10
        let count = await this.commentRepo.getcount({}) || 0

        await this.taskStarted(task._id, taskName, "comment")


        const repo = this.registry.getRegistry(keywords[0]?.pageType || "article")?.repo

        const doc = await repo?.findOne({
            _id: keywords[0].page || ""
        },
            {}, [{
                path: "seoContent",
                select: ["url"]
            }])

        for (let j = 0; j <= count / limit; j++) {

            let pageData = await this.commentRepo.findMany({}, {}, j + 1, limit) || []
            for (let k = 0; k < pageData.length; k++) {
                let comment = pageData[k]

                for (let m = 0; m < keywords.length; m++) {
                    const keyword = keywords[m]

                    let links: string[] = []

                    const keywordRepo = this.registry.getRegistry(keyword.pageType)?.repo
                    if (keywordRepo != undefined) {
                        const keywordPage = await keywordRepo.findOne({
                            _id: keyword.page
                        }, {}, [{
                            path: "seoContent",
                            select: ["url"]
                        }])

                        if (keywordPage != null && keywordPage.seoContent != null && keywordPage.seoContent != undefined) {
                            links.push((keywordPage.seoContent as Content).url)

                            let linkTag = await this.linkTagRepo.findOne({
                                link: (keywordPage.seoContent as Content)._id
                            })

                            if (linkTag != null) {
                                links.push(linkTag.tag)
                            }
                        }
                    }

                    if ((comment.page as Types.ObjectId).toHexString() == (keyword.page as Types.ObjectId).toHexString()
                        && comment.module == keyword.pageType
                    ) {
                        continue
                    }

                    let linkMap = await this.linkMapRepo.findOne({
                        keyword: keyword._id,
                        from: comment.page,
                        fromType: comment.module,
                    })

                    let result = this.checkAnchorTextAndLinks(comment.text, keyword.text, links)

                    if (result.foundAnchorText) {

                        let finalLink = {
                            subPartId: comment._id,
                            extraInfo: Object.assign({
                                satatus: comment.status == "confirmed"
                            }, {
                                foundInPlainText: result.foundInPlainText,
                                foundInAnchor: result.foundInAnchor,
                                foundInImageAlt: result.foundInImageAlt,
                                allLinksValid: result.allLinksValid,
                                invalidLinks: result.invalidLinks
                            }),
                            isActive: result.haveActive,
                            isRejected: false,
                            isWrong: !result.allLinksValid
                        }

                        if (linkMap == null) {
                            linkMap = await this.linkMapRepo.insert({
                                from: comment.page,
                                fromType: comment.module,
                                keyword: keyword._id,

                                to: keyword.page,
                                toType: keyword.pageType,

                                commentLinks: [finalLink]
                            } as any)
                        }

                        else {
                            await this.linkMapRepo.updateLinkIfNotExists(linkMap, "commentLinks", finalLink)
                        }

                    }

                    else {
                        if (linkMap != null) {
                            await this.linkMapRepo.deleteLinkFromMap(linkMap._id, "commentLinks", comment._id)
                        }
                    }
                }

            }

            await this.updateTaskInfo(task._id, taskName, "comment", pageData.length)

        }
        await this.taskFinished(task._id, taskName, "comment")
    }

    async proccessAllKeyWordsInComments(
        task: KeywordTask,
        taskName: string
    ) {
        let limit = 10
        let count = await this.commentRepo.getcount({}) || 0

        await this.taskStarted(task._id, taskName, "comment")



        for (let j = 0; j <= count / limit; j++) {

            let pageData = await this.commentRepo.findMany({}, {}, j + 1, limit) || []
            for (let k = 0; k < pageData.length; k++) {
                let comment = pageData[k]

                let Keywordcount = await this.keywordRepo.getcount({}) || 0
                for (let z = 0; z <= Keywordcount / limit; z++) {

                    const keywords = await this.keywordRepo.findMany({}, {}, z + 1, limit) || []
                    for (let l = 0; l < keywords.length; l++) {
                        const keyword = keywords[l]

                        let links: string[] = []

                        const keywordRepo = this.registry.getRegistry(keyword.pageType)?.repo
                        if (keywordRepo != undefined) {
                            const keywordPage = await keywordRepo.findOne({
                                _id: keyword.page
                            }, {}, [{
                                path: "seoContent",
                                select: ["url"]
                            }])

                            if (keywordPage != null && keywordPage.seoContent != null && keywordPage.seoContent != undefined) {
                                links.push((keywordPage.seoContent as Content).url)

                                let linkTag = await this.linkTagRepo.findOne({
                                    link: (keywordPage.seoContent as Content)._id
                                })

                                if (linkTag != null) {
                                    links.push(linkTag.tag)
                                }
                            }
                        }

                        const repo = this.registry.getRegistry(keyword.pageType)?.repo

                        const doc = await repo?.findOne({
                            _id: keyword.page
                        },
                            {}, [{
                                path: "seoContent",
                                select: ["url"]
                            }])

                        if ((comment.page as Types.ObjectId).toHexString() == (keyword.page as Types.ObjectId).toHexString()
                            && comment.module == keyword.pageType
                        ) {
                            continue
                        }


                        let linkMap = await this.linkMapRepo.findOne({
                            keyword: keyword._id,
                            from: comment.page,
                            fromType: comment.module,
                        })



                        let result = this.checkAnchorTextAndLinks(comment.text, keyword.text, links)

                        if (result.foundAnchorText) {

                            let finalLink = {
                                subPartId: comment._id,
                                extraInfo: Object.assign({
                                    satatus: comment.status == "confirmed"
                                }, {
                                    foundInPlainText: result.foundInPlainText,
                                    foundInAnchor: result.foundInAnchor,
                                    foundInImageAlt: result.foundInImageAlt,
                                    allLinksValid: result.allLinksValid,
                                    invalidLinks: result.invalidLinks
                                }),
                                isActive: result.haveActive,
                                isRejected: false,
                                isWrong: !result.allLinksValid
                            }

                            if (linkMap == null) {
                                linkMap = await this.linkMapRepo.insert({
                                    from: comment.page,
                                    fromType: comment.module,
                                    keyword: keyword._id,

                                    to: keyword.page,
                                    toType: keyword.pageType,

                                    commentLinks: [finalLink]
                                } as any)
                            }

                            else {
                                await this.linkMapRepo.updateLinkIfNotExists(linkMap, "contentLinks", finalLink)
                            }

                        }

                        else {
                            if (linkMap != null) {
                                await this.linkMapRepo.deleteLinkFromMap(linkMap._id, "commentLinks", comment._id)
                            }
                        }
                    }
                }
            }
            await this.updateTaskInfo(task._id, taskName, "comment", pageData.length)

        }
        await this.taskFinished(task._id, taskName, "comment")
    }

    async changeKeywordLinkInContents(
        keywords: Keyword[],
        task: KeywordTask,
        taskName: string
    ) {
        try {
            let modules: string[] = this.registry.getAllRegistriesName()
            let data: {
                [k: string]: any
            } = {}

            let keyword = keywords[0]


            const keywordRepo = this.registry.getRegistry(keyword.pageType)?.repo
            let link = ""
            if (keywordRepo != undefined) {
                const keywordPage = await keywordRepo.findOne({
                    _id: keyword.page
                }, {}, [{
                    path: "seoContent",
                    select: ["url"]
                }])

                if (keywordPage != null && keywordPage.seoContent != null && keywordPage.seoContent != undefined) {
                    let linkTag = await this.linkTagRepo.findOne({
                        link: (keywordPage.seoContent as Content)._id
                    })

                    if (linkTag != null) {
                        link = linkTag.tag
                    }
                }
            }


            for (let i = 0; i < modules.length; i++) {
                let name: string = modules[i]

                await this.taskStarted(task._id, taskName, name)
                let repo = this.registry.getRegistry(name)?.repo
                let count = await repo?.getcount({}) || 0
                
                let limit = 10

                for (let j = 0; j <= count / limit; j++) {
                    let pageData = await repo?.findMany({}, {}, j + 1, limit) || []
                    for (let k = 0; k < pageData.length; k++) {
                        let doc = pageData[k]

                        for (let m = 0; m < keywords.length; m++) {
                            const keyword = keywords[m]

                            if (doc._id.toHexString() == (keyword.page as Types.ObjectId).toHexString()
                                && keyword.pageType == name
                            ) {
                                continue
                            }
                            let contents = repo?.extractContents(doc) || []

                            let linkMap = await this.linkMapRepo.findOne({
                                keyword: keyword._id,
                                from: doc._id,
                                fromType: name,
                            })

                            for (let z = 0; z < contents.length; z++) {
  
                                const newContent = this.updateLinkHrefByAnchorText(contents[z].text, keyword.text, link, [link])
                            
                              
                                if (newContent.updated) {

                                    await repo?.updateSubContentHTML(doc._id, contents[z]?.id || "",
                                        contents[z].extra || {}, newContent.updatedHtml)

                                    if (linkMap == null) {
                                        linkMap = await this.linkMapRepo.insert({
                                            from: doc._id,
                                            fromType: name,
                                            keyword: keyword._id,

                                            to: keyword.page,
                                            toType: keyword.pageType,

                                            contentLinks: [{
                                                subPartId: contents[z].id,
                                                extraInfo: Object.assign(contents[z].extra, {
                                                    foundInAnchor: newContent.foundInAnchor,
                                                    foundInImageAlt: newContent.foundInImageAlt,
                                                    allLinksValid: newContent.invalidLinks,
                                                    invalidLinks: []
                                                }),
                                                isActive: true,
                                                isRejected: false,
                                                isWrong: false
                                            }]
                                        } as any)
                                    }

                                    else {
                                        await this.linkMapRepo.updateLinkIfNotExists(linkMap, "contentLinks", {
                                            subPartId: contents[z].id,
                                            extraInfo: Object.assign(contents[z].extra, {
                                                foundInPlainText: true,
                                                foundInAnchor: true,
                                                foundInImageAlt: false,
                                                allLinksValid: true,
                                                invalidLinks: []
                                            }),
                                            isActive: true,
                                            isRejected: false,
                                            isWrong: false
                                        })
                                    }
                                }

                                else {

                                    if (linkMap != null) {
                                        await this.linkMapRepo.deleteLinkFromMap(linkMap._id, "contentLinks", contents[z].id)
                                    }
                                }
                            }

                            let sumrray = doc.summary || ""
                            const newContent = this.updateLinkHrefByAnchorText(sumrray, keyword.text, link, [link])

                            let finalLink = {
                                extraInfo: {
                                    foundInAnchor: newContent.foundInAnchor,
                                    foundInImageAlt: newContent.foundInImageAlt,
                                    allLinksValid: newContent.invalidLinks == undefined,
                                    invalidLinks: newContent.invalidLinks
                                },
                                isActive: newContent.haveActive,
                                isRejected: linkMap?.summaryLinks?.[0].isRejected || false,
                                isWrong: newContent.invalidLinks != undefined
                            }

                            if (newContent.updated) {
                                this.updateDocSummrary(doc._id, newContent.updatedHtml)
                                if (linkMap == null) {
                                    linkMap = await this.linkMapRepo.insert({
                                        from: doc._id,
                                        fromType: name,
                                        keyword: keyword._id,

                                        to: keyword.page,
                                        toType: keyword.pageType,

                                        summaryLinks: [{
                                            extraInfo: Object.assign({

                                            }, {
                                                // foundInPlainText: newContent.,
                                                foundInAnchor: newContent.foundInAnchor,
                                                foundInImageAlt: newContent.foundInImageAlt,
                                                allLinksValid: newContent.invalidLinks,
                                                invalidLinks: []
                                            }),
                                            isActive: true,
                                            isRejected: false,
                                            isWrong: false
                                        }]
                                    } as any)
                                }
                            }
                            else {

                            }

                            let faq = doc.commonQuestions || []
                            for (let z = 0; z < faq.length; z++) {
                                const newContent = this.updateLinkHrefByAnchorText(faq[z].answer, keyword.text, link, [link])
                                if (newContent.updated) {
                                    await repo?.updateFAQAnswer(doc._id, faq[z]._id, newContent.updatedHtml)
                                    if (linkMap == null) {

                                    }
                                    else {

                                    }
                                }
                                else {

                                }
                            }
                        }

                    }
                    await this.updateTaskInfo(task._id, taskName, name, pageData.length)
                }

                await this.taskFinished(task._id, taskName, name)
            }

            return data
        } catch (error) {
            console.log("errrrrrr")
            throw error
        }
    }

    async changeKeywordLinkInComments(
        keywords: Keyword[],
        task: KeywordTask,
        taskName: string) {
        try {
            let limit = 10
            let count = await this.commentRepo.getcount({}) || 0

            let keyword = keywords[0]
           

            const keywordRepo = this.registry.getRegistry(keyword.pageType)?.repo
            let link = ""
            if (keywordRepo != undefined) {
                const keywordPage = await keywordRepo.findOne({
                    _id: keyword.page
                }, {}, [{
                    path: "seoContent",
                    select: ["url"]
                }])

                if (keywordPage != null && keywordPage.seoContent != null && keywordPage.seoContent != undefined) {
                    let linkTag = await this.linkTagRepo.findOne({
                        link: (keywordPage.seoContent as Content)._id
                    })

                    if (linkTag != null) {
                        link = linkTag.tag
                    }
                }
            }
            await this.taskStarted(task._id, taskName, "comment")

            for (let j = 0; j <= count / limit; j++) {

                let pageData = await this.commentRepo.findMany({}, {}, j + 1, limit) || []
                for (let k = 0; k < pageData.length; k++) {
                    for (let m = 0; m < keywords.length; m++) {
                        
                        const keyword = keywords[m]
                        let comment = pageData[k]

                        if ((comment.page as Types.ObjectId).toHexString() == (keyword.page as Types.ObjectId).toHexString()
                            && comment.module == keyword.pageType
                        ) {
                            continue
                        }


                        let linkMap = await this.linkMapRepo.findOne({
                            keyword: keyword._id,
                            from: comment.page,
                            fromType: comment.module,
                        })

                        let result = this.updateLinkHrefByAnchorText(comment.text, keyword.text, link, [link])

                        await this.commentRepo.updateOne({
                            _id: comment._id
                        }, {
                            $set: {
                                text: result.updatedHtml
                            }
                        })

                        if (result.updated) {

                            let finalLink = {
                                subPartId: comment._id,
                                extraInfo: Object.assign({
                                    satatus: comment.status == "confirmed"
                                }, {
                                    foundInAnchor: result.foundInAnchor,
                                    foundInImageAlt: result.foundInImageAlt,
                                    allLinksValid: result.invalidLinks == undefined,
                                    invalidLinks: result.invalidLinks
                                }),
                                isActive: result.haveActive,
                                isRejected: false,
                                isWrong: !result.invalidLinks
                            }

                            if (linkMap == null) {
                                linkMap = await this.linkMapRepo.insert({
                                    from: comment.page,
                                    fromType: comment.module,
                                    keyword: keyword._id,

                                    to: keyword.page,
                                    toType: keyword.pageType,

                                    commentLinks: [finalLink]
                                } as any)
                            }

                            else {
                                await this.linkMapRepo.updateLinkIfNotExists(linkMap, "commentLinks", finalLink)
                            }

                        }

                        else {
                            if (linkMap != null) {
                                await this.linkMapRepo.deleteLinkFromMap(linkMap._id, "commentLinks", comment._id)
                            }
                        }
                    }

                }

                await this.updateTaskInfo(task._id, taskName, "comment", pageData.length)

            }
            await this.taskFinished(task._id, taskName, "comment")

        } catch (error) {

        }
    }

    async deleteKeywordLinkInContents(
        keywords: Keyword[],
        task: KeywordTask,
        taskName: string
    ) {
        try {
            let modules: string[] = this.registry.getAllRegistriesName()
            let data: {
                [k: string]: any
            } = {}

            for (let i = 0; i < modules.length; i++) {
                let name: string = modules[i]

                await this.taskStarted(task._id, taskName, name)
                let repo = this.registry.getRegistry(name)?.repo
                let count = await repo?.getcount({}) || 0
                let limit = 10
                

                for (let j = 0; j <= count / limit; j++) {
                    let pageData = await repo?.findMany({}, {}, j + 1, limit) || []
                    for (let k = 0; k < pageData.length; k++) {
                        let doc = pageData[k]
                        for (let m = 0; m < keywords.length; m++) {
                            const keyword = keywords[m]

                            if (doc._id.toHexString() == (keyword.page as Types.ObjectId).toHexString()
                                && keyword.pageType == name
                            ) {
                                continue
                            }
                            let contents = repo?.extractContents(doc) || []

                            let linkMap = await this.linkMapRepo.findOne({
                                keyword: keyword._id,
                                from: doc._id,
                                fromType: name,

                            })

                            for (let z = 0; z < contents.length; z++) {
                                let newContent = this.removeLinksByAnchorText(contents[z].text, keyword.text)

                                await repo?.updateSubContentHTML(doc._id, contents[z].id || "", contents[z].extra || {}, newContent)

                                if (linkMap != null) {
                                    await this.linkMapRepo.deleteById(linkMap._id)
                                }
                            }

                            let sumrray = doc.summary || ""
                            let newContent = this.removeLinksByAnchorText(sumrray, keyword.text)
                            await repo?.updateDocSummrary(doc._id, newContent)



                            let faq = doc.commonQuestions || []
                            for (let z = 0; z < faq.length; z++) {
                                let newContent = this.removeLinksByAnchorText(faq[z].answer, keyword.text)
                                await repo?.updateFAQAnswer(doc._id, faq[z]._id, newContent)
                            }

                        }

                    }
                    await this.updateTaskInfo(task._id, taskName, name, pageData.length)

                }
                await this.taskFinished(task._id, taskName, name)

            }
        } catch (error) {
            throw error
        }
    }

    async deleteKeywordLinkInComments(
        keywords: Keyword[],
        task: KeywordTask,
        taskName: string
    ) {
        try {
            let limit = 10
            let count = await this.commentRepo.getcount({}) || 0

            await this.taskStarted(task._id, taskName, "comment")

            for (let j = 0; j <= count / limit; j++) {

                let pageData = await this.commentRepo.findMany({}, {}, j + 1, limit) || []
                for (let k = 0; k < pageData.length; k++) {
                    let comment = pageData[k]
                    for (let m = 0; m < keywords.length; m++) {
                        const keyword = keywords[m]



                        if ((comment.page as Types.ObjectId).toHexString() == (keyword.page as Types.ObjectId).toHexString()
                            && comment.module == keyword.pageType
                        ) {
                            continue
                        }

                        let linkMap = await this.linkMapRepo.findOne({
                            keyword: keyword._id,
                            from: comment.page,
                            fromType: comment.module,
                        })

                        let newContent = this.removeLinksByAnchorText(comment.text, keyword.text)

                        await this.commentRepo.updateOne({
                            _id: comment._id
                        }, {
                            $set: {
                                text: newContent
                            }
                        })

                        if (linkMap != null) {
                            await this.linkMapRepo.deleteById(linkMap._id)
                        }
                    }

                }

                await this.updateTaskInfo(task._id, taskName, "comment", pageData.length)

            }
            await this.taskFinished(task._id, taskName, "comment")
        } catch (error) {
            throw error
        }
    }


    async startProccess(keywordTask: KeywordTask) {
        try {

            let tasksList = keywordTask.tasksList;
            let tasks: Task[] = []

            for (let i = 0; i < tasksList.length; i++) {
                if (tasksList[i] == "checkKeywordInContents" &&
                    keywordTask.keyword != undefined) {
                    let data = await this.getMudulesPageCount()
                    for (const key in data) {
                        tasks.push(
                            {
                                module: key,
                                type: tasksList[i],
                                status: "pending",
                                count: data[key].count,
                                proccessed: 0
                            }
                        )
                    }
                }

                if (tasksList[i] == "checkKeywordsInContent") {
                    tasks.push({
                        type: tasksList[i],

                        module: "keyword",
                        status: "pending",
                        count: await this.keywordRepo.getcount({

                        }),
                        proccessed: 0

                    })
                }

                if (tasksList[i] == "checkKeywordsInContents" && keywordTask.keywords) {

                    let data = await this.getMudulesPageCount()
                    for (const key in data) {
                        tasks.push(
                            {
                                module: key,
                                type: tasksList[i],
                                status: "pending",
                                count: data[key].count,
                                proccessed: 0
                            }
                        )
                    }
                }

                if (tasksList[i] == "checkAllKeyWordsInComments" || tasksList[i] == "checkKeywordInComments") {
                    tasks.push({
                        type: tasksList[i],
                        module: "comment",
                        status: "pending",
                        count: await this.commentRepo.getcount({}),
                        proccessed: 0
                    })
                }


                if (tasksList[i] == "checkKeywordsInComments") {
                    tasks.push({
                        type: tasksList[i],
                        module: "comment",
                        status: "pending",
                        count: await this.commentRepo.getcount({}),
                        proccessed: 0
                    })
                }

                if (tasksList[i] == "changeKeywordLinkInContents") {
                    let data = await this.getMudulesPageCount()
                    for (const key in data) {
                        tasks.push(
                            {
                                module: key,
                                type: tasksList[i],
                                status: "pending",
                                count: data[key].count,
                                proccessed: 0
                            }
                        )
                    }
                }


                if (tasksList[i] == "changeKeywordLinkInComments") {
                    tasks.push({
                        type: tasksList[i],
                        module: "comment",
                        status: "pending",
                        count: await this.commentRepo.getcount({}),
                        proccessed: 0
                    })
                }

                if (tasksList[i] == "deleteKeywordLinkInContents") {
                    let data = await this.getMudulesPageCount()
                    for (const key in data) {
                        tasks.push(
                            {
                                module: key,
                                type: tasksList[i],
                                status: "pending",
                                count: data[key].count,
                                proccessed: 0
                            }
                        )
                    }
                }

                if (tasksList[i] == "deleteKeywordLinkInComments") {
                    tasks.push({
                        type: tasksList[i],
                        module: "comment",
                        status: "pending",
                        count: await this.commentRepo.getcount({}),
                        proccessed: 0
                    })
                }
            }

            await this.updateOne({
                _id: keywordTask._id
            }, {
                tasks
            })

            try {
                keywordTask = await this.findById(keywordTask._id) as KeywordTask
                await this.proccess(keywordTask)
                await this.updateOne({
                    _id: keywordTask._id
                }, {
                    status: "finished"
                })
            } catch (error) {
                console.log("error", error)
            }

        } catch (error) {

        }
    }

    async getMudulesPageCount() {
        let modules: string[] = this.registry.getAllRegistriesName()

        let data: {
            [k: string]: any
        } = {}

        for (let i = 0; i < modules.length; i++) {
            let name: string = modules[i]
            let repo = this.registry.getRegistry(name)?.repo
            let count = await repo?.getcount({})

            data[name] = {
                repo,
                count
            }
        }

        return data
    }

    async runTasks() {
        setInterval(async () => {
            try {
                const keywordTask = await this.findOne({
                    status: "waiting"
                })
                if (keywordTask != null) {
                    this.updateOne({
                        _id: keywordTask._id
                    }, {
                        $set: {
                            status: "loading"
                        }
                    })
                    await this.startProccess(keywordTask)
                }

            } catch (error) {
                console.log("error", error)
            }

        }, 10000)

    }
}

