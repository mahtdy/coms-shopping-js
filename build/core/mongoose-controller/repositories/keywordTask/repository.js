"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../../repository"));
const model_1 = require("./model");
const jsdom_1 = require("jsdom");
const contentRegistry_1 = __importDefault(require("../../contentRegistry"));
const repository_2 = __importDefault(require("../comment/repository"));
const repository_3 = __importDefault(require("../linkMap/repository"));
const repository_4 = __importDefault(require("../linkTag/repository"));
let started = false;
// const contentRepo = new ContentRepository()
class KeywordTaskRepository extends repository_1.default {
    constructor(keywordRepo, options) {
        super(model_1.KeywordTaskModel, options);
        this.registry = contentRegistry_1.default.getInstance();
        this.commentRepo = new repository_2.default();
        this.keywordRepo = keywordRepo;
        this.linkMapRepo = new repository_3.default(keywordRepo);
        this.linkTagRepo = new repository_4.default();
        if (started == false) {
            started = true;
            this.runTasks();
        }
    }
    async updateTaskInfo(id, type, module, count) {
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
            });
        }
        catch (error) {
            throw error;
        }
    }
    async taskFinished(id, type, module) {
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
            });
        }
        catch (error) {
            throw error;
        }
    }
    async taskStarted(id, type, module) {
        try {
            await this.updateOne({
                _id: id,
                "tasks.type": type,
                "tasks.module": module
            }, {
                $set: {
                    "tasks.$.status": "running"
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    removeLinksByAnchorText(html, anchorText) {
        const dom = new jsdom_1.JSDOM(html);
        const document = dom.window.document;
        const links = document.querySelectorAll('a');
        links.forEach((link) => {
            var _a;
            if (((_a = link.textContent) === null || _a === void 0 ? void 0 : _a.trim()) === anchorText) {
                const textNode = document.createTextNode(link.textContent || '');
                link.replaceWith(textNode);
            }
        });
        return document.body.innerHTML;
    }
    updateLinkHrefByAnchorText(html, anchorText, newHref, allowedLinks) {
        var _a, _b, _c;
        const dom = new jsdom_1.JSDOM(html);
        const document = dom.window.document;
        const links = document.querySelectorAll('a');
        const images = document.querySelectorAll('img');
        let foundInAnchor = false;
        let foundInImageAlt = false;
        let haveActive = false;
        let updated = false;
        const invalidLinks = [];
        for (const link of links) {
            const text = (_a = link.textContent) === null || _a === void 0 ? void 0 : _a.trim();
            const href = ((_b = link.getAttribute('href')) === null || _b === void 0 ? void 0 : _b.trim()) || '';
            if (text === anchorText) {
                foundInAnchor = true;
                if (!allowedLinks.includes(href)) {
                    link.setAttribute('href', newHref);
                    haveActive = true;
                    updated = true;
                }
                else {
                    invalidLinks.push(href);
                }
            }
        }
        for (const img of images) {
            const alt = (_c = img.getAttribute('alt')) === null || _c === void 0 ? void 0 : _c.trim();
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
    checkAnchorTextAndLinks(html, anchorText, allowedLinks) {
        var _a, _b, _c;
        const dom = new jsdom_1.JSDOM(html);
        const document = dom.window.document;
        const links = document.querySelectorAll('a');
        const images = document.querySelectorAll('img');
        let foundInAnchor = false;
        let foundInImageAlt = false;
        let foundInPlainText = false;
        let haveActive = false;
        const invalidLinks = [];
        for (const link of links) {
            const text = (_a = link.textContent) === null || _a === void 0 ? void 0 : _a.trim();
            const href = ((_b = link.getAttribute('href')) === null || _b === void 0 ? void 0 : _b.trim()) || '';
            if (text === anchorText) {
                foundInAnchor = true;
                if (!allowedLinks.includes(href)) {
                    invalidLinks.push(href);
                }
                else {
                    haveActive = true;
                }
            }
        }
        for (const img of images) {
            const alt = (_c = img.getAttribute('alt')) === null || _c === void 0 ? void 0 : _c.trim();
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
    async proccess(keywordTask) {
        let tasksList = keywordTask.tasksList;
        let tasks = keywordTask.tasks;
        for (let i = 0; i < tasksList.length; i++) {
            if (tasksList[i] == "checkKeywordInContents" && keywordTask.keyword != undefined) {
                let keyword = await this.keywordRepo.findById(keywordTask.keyword);
                if (keyword != null) {
                    await this.proccessKeyWordInContents(keyword, keywordTask, tasksList[i]);
                }
            }
            if (tasksList[i] == "checkKeywordsInContent" && keywordTask.page != undefined && keywordTask.pageType != undefined) {
                await this.proccessKeyWordsInContent(keywordTask, keywordTask.page, keywordTask.pageType, tasksList[i]);
            }
            if (tasksList[i] == "checkKeywordsInContents" && keywordTask.keywords) {
                const keywords = await this.keywordRepo.findAll({
                    _id: {
                        $in: keywordTask.keywords
                    }
                });
                await this.proccessKeyWordsInContents(keywords, keywordTask, tasksList[i]);
            }
            if (tasksList[i] == "checkKeywordInComments" && keywordTask.keyword != undefined) {
                let keyword = await this.keywordRepo.findById(keywordTask.keyword);
                if (keyword != null) {
                    await this.proccessKeyWordInComments(keyword, keywordTask, tasksList[i]);
                }
            }
            if (tasksList[i] == "checkKeywordsInComments") {
                const keywords = await this.keywordRepo.findAll({
                    _id: {
                        $in: keywordTask.keywords
                    }
                });
                await this.proccessKeyWordsInComments(keywords, keywordTask, tasksList[i]);
            }
            if (tasksList[i] == "checkAllKeyWordsInComments") {
                await this.proccessAllKeyWordsInComments(keywordTask, tasksList[i]);
            }
            if (tasksList[i] == "changeKeywordLinkInContents" && keywordTask.keywords != undefined) {
                const keywords = await this.keywordRepo.findAll({
                    _id: {
                        $in: keywordTask.keywords
                    }
                });
                await this.changeKeywordLinkInContents(keywords, keywordTask, tasksList[i]);
            }
            if (tasksList[i] == "changeKeywordLinkInComments" && keywordTask.keywords != undefined) {
                const keywords = await this.keywordRepo.findAll({
                    _id: {
                        $in: keywordTask.keywords
                    }
                });
                await this.changeKeywordLinkInComments(keywords, keywordTask, tasksList[i]);
            }
            if (tasksList[i] == "deleteKeywordLinkInContents" && keywordTask.keywords != undefined) {
                const keywords = await this.keywordRepo.findAll({
                    _id: {
                        $in: keywordTask.keywords
                    }
                });
                await this.deleteKeywordLinkInContents(keywords, keywordTask, tasksList[i]);
            }
            if (tasksList[i] == "deleteKeywordLinkInComments" && keywordTask.keywords != undefined) {
                const keywords = await this.keywordRepo.findAll({
                    _id: {
                        $in: keywordTask.keywords
                    }
                });
                await this.deleteKeywordLinkInComments(keywords, keywordTask, tasksList[i]);
            }
        }
    }
    async proccessKeyWordInContents(keyword, task, taskName) {
        var _a, _b, _c, _d;
        let modules = this.registry.getAllRegistriesName();
        let data = {};
        let links = [];
        const keywordRepo = (_a = this.registry.getRegistry(keyword.pageType)) === null || _a === void 0 ? void 0 : _a.repo;
        if (keywordRepo != undefined) {
            const keywordPage = await keywordRepo.findOne({
                _id: keyword.page
            }, {}, [{
                    path: "seoContent",
                    select: ["url"]
                }]);
            if (keywordPage != null && keywordPage.seoContent != null && keywordPage.seoContent != undefined) {
                links.push(keywordPage.seoContent.url);
                let linkTag = await this.linkTagRepo.findOne({
                    link: keywordPage.seoContent._id
                });
                if (linkTag != null) {
                    links.push(linkTag.tag);
                }
            }
        }
        for (let i = 0; i < modules.length; i++) {
            let name = modules[i];
            await this.taskStarted(task._id, taskName, name);
            let repo = (_b = this.registry.getRegistry(name)) === null || _b === void 0 ? void 0 : _b.repo;
            let count = await (repo === null || repo === void 0 ? void 0 : repo.getcount({})) || 0;
            let limit = 10;
            for (let j = 0; j <= count / limit; j++) {
                let pageData = await (repo === null || repo === void 0 ? void 0 : repo.findMany({}, {
                    population: [{
                            path: "seoContent"
                        }]
                }, j + 1, limit)) || [];
                for (let k = 0; k < pageData.length; k++) {
                    let doc = pageData[k];
                    if (doc._id.toHexString() == keyword.page.toHexString()
                        && keyword.pageType == name) {
                        continue;
                    }
                    let contents = (repo === null || repo === void 0 ? void 0 : repo.extractContents(doc)) || [];
                    let linkMap = await this.linkMapRepo.findOne({
                        keyword: keyword._id,
                        from: doc._id,
                        fromType: name,
                    });
                    for (let z = 0; z < contents.length; z++) {
                        let result = this.checkAnchorTextAndLinks(contents[z].text, keyword.text, links);
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
                                });
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
                                });
                            }
                        }
                        else {
                            if (linkMap != null) {
                                await this.linkMapRepo.deleteLinkFromMap(linkMap._id, "contentLinks", contents[z].id);
                            }
                        }
                    }
                    let sumrray = doc.summary || "";
                    let result = this.checkAnchorTextAndLinks(sumrray, keyword.text, links);
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
                    };
                    if (result.foundAnchorText) {
                        if (linkMap == null) {
                            linkMap = await this.linkMapRepo.insert({
                                from: doc._id,
                                fromType: name,
                                keyword: keyword._id,
                                to: keyword.page,
                                toType: keyword.pageType,
                                summaryLinks: [finalLink]
                            });
                        }
                        else {
                            finalLink.isRejected = ((_d = (_c = linkMap.summaryLinks) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.isRejected) || false;
                            await this.linkMapRepo.updateOne({
                                _id: linkMap._id
                            }, {
                                $set: {
                                    summaryLinks: [finalLink]
                                }
                            });
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
                            });
                        }
                    }
                    let faq = doc.commonQuestions || [];
                    for (let z = 0; z < faq.length; z++) {
                        let result = this.checkAnchorTextAndLinks(faq[z].answer, keyword.text, links);
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
                        };
                        if (result.foundAnchorText) {
                            if (linkMap == null) {
                                linkMap = await this.linkMapRepo.insert({
                                    from: doc._id,
                                    fromType: name,
                                    keyword: keyword._id,
                                    to: keyword.page,
                                    toType: keyword.pageType,
                                    faqLinks: [finalLink]
                                });
                            }
                            else {
                                await this.linkMapRepo.updateLinkIfNotExists(linkMap, "faqLinks", finalLink);
                            }
                        }
                        else {
                            if (linkMap != null) {
                                await this.linkMapRepo.deleteLinkFromMap(linkMap._id, "faqLinks", faq[z]._id);
                            }
                        }
                    }
                }
                await this.updateTaskInfo(task._id, taskName, name, pageData.length);
            }
            await this.taskFinished(task._id, taskName, name);
        }
        return data;
    }
    async proccessKeyWordsInContents(keywords, task, taskName) {
        var _a, _b, _c, _d;
        let modules = this.registry.getAllRegistriesName();
        let data = {};
        for (let i = 0; i < modules.length; i++) {
            let name = modules[i];
            await this.taskStarted(task._id, taskName, name);
            let repo = (_a = this.registry.getRegistry(name)) === null || _a === void 0 ? void 0 : _a.repo;
            let count = await (repo === null || repo === void 0 ? void 0 : repo.getcount({})) || 0;
            let limit = 10;
            for (let j = 0; j <= count / limit; j++) {
                let pageData = await (repo === null || repo === void 0 ? void 0 : repo.findMany({}, {
                    population: [{
                            path: "seoContent"
                        }]
                }, j + 1, limit)) || [];
                for (let k = 0; k < pageData.length; k++) {
                    let doc = pageData[k];
                    for (let n = 0; n < keywords.length; n++) {
                        const keyword = keywords[n];
                        if (doc._id.toHexString() == keyword.page.toHexString()
                            && keyword.pageType == name) {
                            continue;
                        }
                        let links = [];
                        const keywordRepo = (_b = this.registry.getRegistry(keyword.pageType)) === null || _b === void 0 ? void 0 : _b.repo;
                        if (keywordRepo != undefined) {
                            const keywordPage = await keywordRepo.findOne({
                                _id: keyword.page
                            }, {}, [{
                                    path: "seoContent",
                                    select: ["url"]
                                }]);
                            if (keywordPage != null && keywordPage.seoContent != null && keywordPage.seoContent != undefined) {
                                links.push(keywordPage.seoContent.url);
                                let linkTag = await this.linkTagRepo.findOne({
                                    link: keywordPage.seoContent._id
                                });
                                if (linkTag != null) {
                                    links.push(linkTag.tag);
                                }
                            }
                        }
                        let contents = (repo === null || repo === void 0 ? void 0 : repo.extractContents(doc)) || [];
                        let linkMap = await this.linkMapRepo.findOne({
                            keyword: keyword._id,
                            from: doc._id,
                            fromType: name,
                        });
                        for (let z = 0; z < contents.length; z++) {
                            let result = this.checkAnchorTextAndLinks(contents[z].text, keyword.text, links);
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
                                    });
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
                                    });
                                }
                            }
                            else {
                                if (linkMap != null) {
                                    await this.linkMapRepo.deleteLinkFromMap(linkMap._id, "contentLinks", contents[z].id);
                                }
                            }
                        }
                        let sumrray = doc.summary || "";
                        let result = this.checkAnchorTextAndLinks(sumrray, keyword.text, links);
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
                        };
                        if (result.foundAnchorText) {
                            if (linkMap == null) {
                                linkMap = await this.linkMapRepo.insert({
                                    from: doc._id,
                                    fromType: name,
                                    keyword: keyword._id,
                                    to: keyword.page,
                                    toType: keyword.pageType,
                                    summaryLinks: [finalLink]
                                });
                            }
                            else {
                                finalLink.isRejected = ((_d = (_c = linkMap.summaryLinks) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.isRejected) || false;
                                await this.linkMapRepo.updateOne({
                                    _id: linkMap._id
                                }, {
                                    $set: {
                                        summaryLinks: [finalLink]
                                    }
                                });
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
                                });
                            }
                        }
                        let faq = doc.commonQuestions || [];
                        for (let z = 0; z < faq.length; z++) {
                            let result = this.checkAnchorTextAndLinks(faq[z].answer, keyword.text, links);
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
                            };
                            if (result.foundAnchorText) {
                                if (linkMap == null) {
                                    linkMap = await this.linkMapRepo.insert({
                                        from: doc._id,
                                        fromType: name,
                                        keyword: keyword._id,
                                        to: keyword.page,
                                        toType: keyword.pageType,
                                        faqLinks: [finalLink]
                                    });
                                }
                                else {
                                    await this.linkMapRepo.updateLinkIfNotExists(linkMap, "faqLinks", finalLink);
                                }
                            }
                            else {
                                if (linkMap != null) {
                                    await this.linkMapRepo.deleteLinkFromMap(linkMap._id, "faqLinks", faq[z]._id);
                                }
                            }
                        }
                    }
                }
                await this.updateTaskInfo(task._id, taskName, name, pageData.length);
            }
            await this.taskFinished(task._id, taskName, name);
        }
        return data;
    }
    async proccessKeyWordsInContent(task, page, pageType, taskName) {
        var _a, _b, _c, _d;
        const repo = (_a = this.registry.getRegistry(pageType)) === null || _a === void 0 ? void 0 : _a.repo;
        if (repo == undefined) {
            return;
        }
        let doc = await repo.findById(page);
        if (doc == null) {
            return;
        }
        let limit = 10;
        let count = await this.keywordRepo.getcount({}) || 0;
        await this.taskStarted(task._id, taskName, pageType);
        for (let j = 0; j <= count / limit; j++) {
            let pageData = await this.keywordRepo.findMany({}, {}, j + 1, limit) || [];
            for (let k = 0; k < pageData.length; k++) {
                let keyword = pageData[k];
                if (doc._id == keyword.page.toHexString()
                    && keyword.pageType == pageType) {
                    continue;
                }
                let links = [];
                const keywordRepo = (_b = this.registry.getRegistry(keyword.pageType)) === null || _b === void 0 ? void 0 : _b.repo;
                if (keywordRepo != undefined) {
                    const keywordPage = await keywordRepo.findOne({
                        _id: keyword.page
                    }, {}, [{
                            path: "seoContent",
                            select: ["url"]
                        }]);
                    if (keywordPage != null && keywordPage.seoContent != null && keywordPage.seoContent != undefined) {
                        links.push(keywordPage.seoContent.url);
                        let linkTag = await this.linkTagRepo.findOne({
                            link: keywordPage.seoContent._id
                        });
                        if (linkTag != null) {
                            links.push(linkTag.tag);
                        }
                    }
                }
                let contents = (repo === null || repo === void 0 ? void 0 : repo.extractContents(doc)) || [];
                let linkMap = await this.linkMapRepo.findOne({
                    keyword: keyword._id,
                    from: doc._id,
                    fromType: pageType,
                });
                for (let z = 0; z < contents.length; z++) {
                    let result = this.checkAnchorTextAndLinks(contents[z].text, keyword.text, []);
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
                            });
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
                            });
                        }
                    }
                    else {
                        if (linkMap != null) {
                            await this.linkMapRepo.deleteLinkFromMap(linkMap._id, "contentLinks", contents[z].id);
                        }
                    }
                }
                let sumrray = doc.summary || "";
                let result = this.checkAnchorTextAndLinks(sumrray, keyword.text, links);
                let finalLink = {
                    extraInfo: {
                        foundInPlainText: result.foundInPlainText,
                        foundInAnchor: result.foundInAnchor,
                        foundInImageAlt: result.foundInImageAlt,
                        allLinksValid: result.allLinksValid,
                        invalidLinks: result.invalidLinks
                    },
                    isActive: result.haveActive,
                    isRejected: ((_d = (_c = linkMap === null || linkMap === void 0 ? void 0 : linkMap.summaryLinks) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.isRejected) || false,
                    isWrong: !result.allLinksValid
                };
                if (result.foundAnchorText) {
                    if (linkMap == null) {
                        linkMap = await this.linkMapRepo.insert({
                            from: doc._id,
                            fromType: pageType,
                            keyword: keyword._id,
                            to: keyword.page,
                            toType: keyword.pageType,
                            summaryLinks: [finalLink]
                        });
                    }
                    else {
                        await this.linkMapRepo.updateOne({
                            _id: linkMap._id
                        }, {
                            $set: {
                                summaryLinks: [finalLink]
                            }
                        });
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
                        });
                    }
                }
                let faq = doc.commonQuestions || [];
                for (let z = 0; z < faq.length; z++) {
                    let result = this.checkAnchorTextAndLinks(faq[z].answer, keyword.text, links);
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
                    };
                    if (result.foundAnchorText) {
                        if (linkMap == null) {
                            linkMap = await this.linkMapRepo.insert({
                                from: doc._id,
                                fromType: pageType,
                                keyword: keyword._id,
                                to: keyword.page,
                                toType: keyword.pageType,
                                faqLinks: [finalLink]
                            });
                        }
                        else {
                            await this.linkMapRepo.updateLinkIfNotExists(linkMap, "faqLinks", finalLink);
                        }
                    }
                    else {
                        if (linkMap != null) {
                            await this.linkMapRepo.deleteLinkFromMap(linkMap._id, "faqLinks", faq[z]._id);
                        }
                    }
                }
            }
            await this.updateTaskInfo(task._id, taskName, pageType, pageData.length);
        }
        await this.taskFinished(task._id, taskName, pageType);
    }
    async proccessKeyWordInComments(keyword, task, taskName) {
        var _a, _b;
        let links = [];
        const keywordRepo = (_a = this.registry.getRegistry(keyword.pageType)) === null || _a === void 0 ? void 0 : _a.repo;
        if (keywordRepo != undefined) {
            const keywordPage = await keywordRepo.findOne({
                _id: keyword.page
            }, {}, [{
                    path: "seoContent",
                    select: ["url"]
                }]);
            if (keywordPage != null && keywordPage.seoContent != null && keywordPage.seoContent != undefined) {
                links.push(keywordPage.seoContent.url);
                let linkTag = await this.linkTagRepo.findOne({
                    link: keywordPage.seoContent._id
                });
                if (linkTag != null) {
                    links.push(linkTag.tag);
                }
            }
        }
        let limit = 10;
        let count = await this.commentRepo.getcount({}) || 0;
        await this.taskStarted(task._id, taskName, "comment");
        const repo = (_b = this.registry.getRegistry(keyword.pageType)) === null || _b === void 0 ? void 0 : _b.repo;
        const doc = await (repo === null || repo === void 0 ? void 0 : repo.findOne({
            _id: keyword.page
        }, {}, [{
                path: "seoContent",
                select: ["url"]
            }]));
        for (let j = 0; j <= count / limit; j++) {
            let pageData = await this.commentRepo.findMany({}, {}, j + 1, limit) || [];
            for (let k = 0; k < pageData.length; k++) {
                let comment = pageData[k];
                if (comment.page.toHexString() == keyword.page.toHexString()
                    && comment.module == keyword.pageType) {
                    continue;
                }
                let linkMap = await this.linkMapRepo.findOne({
                    keyword: keyword._id,
                    from: comment.page,
                    fromType: comment.module,
                });
                let result = this.checkAnchorTextAndLinks(comment.text, keyword.text, links);
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
                    };
                    if (linkMap == null) {
                        linkMap = await this.linkMapRepo.insert({
                            from: comment.page,
                            fromType: comment.module,
                            keyword: keyword._id,
                            to: keyword.page,
                            toType: keyword.pageType,
                            commentLinks: [finalLink]
                        });
                    }
                    else {
                        await this.linkMapRepo.updateLinkIfNotExists(linkMap, "commentLinks", finalLink);
                    }
                }
                else {
                    if (linkMap != null) {
                        await this.linkMapRepo.deleteLinkFromMap(linkMap._id, "commentLinks", comment._id);
                    }
                }
            }
            await this.updateTaskInfo(task._id, taskName, "comment", pageData.length);
        }
        await this.taskFinished(task._id, taskName, "comment");
    }
    async proccessKeyWordsInComments(keywords, task, taskName) {
        var _a, _b, _c;
        let limit = 10;
        let count = await this.commentRepo.getcount({}) || 0;
        await this.taskStarted(task._id, taskName, "comment");
        const repo = (_b = this.registry.getRegistry(((_a = keywords[0]) === null || _a === void 0 ? void 0 : _a.pageType) || "article")) === null || _b === void 0 ? void 0 : _b.repo;
        const doc = await (repo === null || repo === void 0 ? void 0 : repo.findOne({
            _id: keywords[0].page || ""
        }, {}, [{
                path: "seoContent",
                select: ["url"]
            }]));
        for (let j = 0; j <= count / limit; j++) {
            let pageData = await this.commentRepo.findMany({}, {}, j + 1, limit) || [];
            for (let k = 0; k < pageData.length; k++) {
                let comment = pageData[k];
                for (let m = 0; m < keywords.length; m++) {
                    const keyword = keywords[m];
                    let links = [];
                    const keywordRepo = (_c = this.registry.getRegistry(keyword.pageType)) === null || _c === void 0 ? void 0 : _c.repo;
                    if (keywordRepo != undefined) {
                        const keywordPage = await keywordRepo.findOne({
                            _id: keyword.page
                        }, {}, [{
                                path: "seoContent",
                                select: ["url"]
                            }]);
                        if (keywordPage != null && keywordPage.seoContent != null && keywordPage.seoContent != undefined) {
                            links.push(keywordPage.seoContent.url);
                            let linkTag = await this.linkTagRepo.findOne({
                                link: keywordPage.seoContent._id
                            });
                            if (linkTag != null) {
                                links.push(linkTag.tag);
                            }
                        }
                    }
                    if (comment.page.toHexString() == keyword.page.toHexString()
                        && comment.module == keyword.pageType) {
                        continue;
                    }
                    let linkMap = await this.linkMapRepo.findOne({
                        keyword: keyword._id,
                        from: comment.page,
                        fromType: comment.module,
                    });
                    let result = this.checkAnchorTextAndLinks(comment.text, keyword.text, links);
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
                        };
                        if (linkMap == null) {
                            linkMap = await this.linkMapRepo.insert({
                                from: comment.page,
                                fromType: comment.module,
                                keyword: keyword._id,
                                to: keyword.page,
                                toType: keyword.pageType,
                                commentLinks: [finalLink]
                            });
                        }
                        else {
                            await this.linkMapRepo.updateLinkIfNotExists(linkMap, "commentLinks", finalLink);
                        }
                    }
                    else {
                        if (linkMap != null) {
                            await this.linkMapRepo.deleteLinkFromMap(linkMap._id, "commentLinks", comment._id);
                        }
                    }
                }
            }
            await this.updateTaskInfo(task._id, taskName, "comment", pageData.length);
        }
        await this.taskFinished(task._id, taskName, "comment");
    }
    async proccessAllKeyWordsInComments(task, taskName) {
        var _a, _b;
        let limit = 10;
        let count = await this.commentRepo.getcount({}) || 0;
        await this.taskStarted(task._id, taskName, "comment");
        for (let j = 0; j <= count / limit; j++) {
            let pageData = await this.commentRepo.findMany({}, {}, j + 1, limit) || [];
            for (let k = 0; k < pageData.length; k++) {
                let comment = pageData[k];
                let Keywordcount = await this.keywordRepo.getcount({}) || 0;
                for (let z = 0; z <= Keywordcount / limit; z++) {
                    const keywords = await this.keywordRepo.findMany({}, {}, z + 1, limit) || [];
                    for (let l = 0; l < keywords.length; l++) {
                        const keyword = keywords[l];
                        let links = [];
                        const keywordRepo = (_a = this.registry.getRegistry(keyword.pageType)) === null || _a === void 0 ? void 0 : _a.repo;
                        if (keywordRepo != undefined) {
                            const keywordPage = await keywordRepo.findOne({
                                _id: keyword.page
                            }, {}, [{
                                    path: "seoContent",
                                    select: ["url"]
                                }]);
                            if (keywordPage != null && keywordPage.seoContent != null && keywordPage.seoContent != undefined) {
                                links.push(keywordPage.seoContent.url);
                                let linkTag = await this.linkTagRepo.findOne({
                                    link: keywordPage.seoContent._id
                                });
                                if (linkTag != null) {
                                    links.push(linkTag.tag);
                                }
                            }
                        }
                        const repo = (_b = this.registry.getRegistry(keyword.pageType)) === null || _b === void 0 ? void 0 : _b.repo;
                        const doc = await (repo === null || repo === void 0 ? void 0 : repo.findOne({
                            _id: keyword.page
                        }, {}, [{
                                path: "seoContent",
                                select: ["url"]
                            }]));
                        if (comment.page.toHexString() == keyword.page.toHexString()
                            && comment.module == keyword.pageType) {
                            continue;
                        }
                        let linkMap = await this.linkMapRepo.findOne({
                            keyword: keyword._id,
                            from: comment.page,
                            fromType: comment.module,
                        });
                        let result = this.checkAnchorTextAndLinks(comment.text, keyword.text, links);
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
                            };
                            if (linkMap == null) {
                                linkMap = await this.linkMapRepo.insert({
                                    from: comment.page,
                                    fromType: comment.module,
                                    keyword: keyword._id,
                                    to: keyword.page,
                                    toType: keyword.pageType,
                                    commentLinks: [finalLink]
                                });
                            }
                            else {
                                await this.linkMapRepo.updateLinkIfNotExists(linkMap, "contentLinks", finalLink);
                            }
                        }
                        else {
                            if (linkMap != null) {
                                await this.linkMapRepo.deleteLinkFromMap(linkMap._id, "commentLinks", comment._id);
                            }
                        }
                    }
                }
            }
            await this.updateTaskInfo(task._id, taskName, "comment", pageData.length);
        }
        await this.taskFinished(task._id, taskName, "comment");
    }
    async changeKeywordLinkInContents(keywords, task, taskName) {
        var _a, _b, _c, _d;
        try {
            let modules = this.registry.getAllRegistriesName();
            let data = {};
            let keyword = keywords[0];
            const keywordRepo = (_a = this.registry.getRegistry(keyword.pageType)) === null || _a === void 0 ? void 0 : _a.repo;
            let link = "";
            if (keywordRepo != undefined) {
                const keywordPage = await keywordRepo.findOne({
                    _id: keyword.page
                }, {}, [{
                        path: "seoContent",
                        select: ["url"]
                    }]);
                if (keywordPage != null && keywordPage.seoContent != null && keywordPage.seoContent != undefined) {
                    let linkTag = await this.linkTagRepo.findOne({
                        link: keywordPage.seoContent._id
                    });
                    if (linkTag != null) {
                        link = linkTag.tag;
                    }
                }
            }
            for (let i = 0; i < modules.length; i++) {
                let name = modules[i];
                await this.taskStarted(task._id, taskName, name);
                let repo = (_b = this.registry.getRegistry(name)) === null || _b === void 0 ? void 0 : _b.repo;
                let count = await (repo === null || repo === void 0 ? void 0 : repo.getcount({})) || 0;
                let limit = 10;
                for (let j = 0; j <= count / limit; j++) {
                    let pageData = await (repo === null || repo === void 0 ? void 0 : repo.findMany({}, {}, j + 1, limit)) || [];
                    for (let k = 0; k < pageData.length; k++) {
                        let doc = pageData[k];
                        for (let m = 0; m < keywords.length; m++) {
                            const keyword = keywords[m];
                            if (doc._id.toHexString() == keyword.page.toHexString()
                                && keyword.pageType == name) {
                                continue;
                            }
                            let contents = (repo === null || repo === void 0 ? void 0 : repo.extractContents(doc)) || [];
                            let linkMap = await this.linkMapRepo.findOne({
                                keyword: keyword._id,
                                from: doc._id,
                                fromType: name,
                            });
                            for (let z = 0; z < contents.length; z++) {
                                const newContent = this.updateLinkHrefByAnchorText(contents[z].text, keyword.text, link, [link]);
                                if (newContent.updated) {
                                    await (repo === null || repo === void 0 ? void 0 : repo.updateSubContentHTML(doc._id, ((_c = contents[z]) === null || _c === void 0 ? void 0 : _c.id) || "", contents[z].extra || {}, newContent.updatedHtml));
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
                                        });
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
                                        });
                                    }
                                }
                                else {
                                    if (linkMap != null) {
                                        await this.linkMapRepo.deleteLinkFromMap(linkMap._id, "contentLinks", contents[z].id);
                                    }
                                }
                            }
                            let sumrray = doc.summary || "";
                            const newContent = this.updateLinkHrefByAnchorText(sumrray, keyword.text, link, [link]);
                            let finalLink = {
                                extraInfo: {
                                    foundInAnchor: newContent.foundInAnchor,
                                    foundInImageAlt: newContent.foundInImageAlt,
                                    allLinksValid: newContent.invalidLinks == undefined,
                                    invalidLinks: newContent.invalidLinks
                                },
                                isActive: newContent.haveActive,
                                isRejected: ((_d = linkMap === null || linkMap === void 0 ? void 0 : linkMap.summaryLinks) === null || _d === void 0 ? void 0 : _d[0].isRejected) || false,
                                isWrong: newContent.invalidLinks != undefined
                            };
                            if (newContent.updated) {
                                this.updateDocSummrary(doc._id, newContent.updatedHtml);
                                if (linkMap == null) {
                                    linkMap = await this.linkMapRepo.insert({
                                        from: doc._id,
                                        fromType: name,
                                        keyword: keyword._id,
                                        to: keyword.page,
                                        toType: keyword.pageType,
                                        summaryLinks: [{
                                                extraInfo: Object.assign({}, {
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
                                    });
                                }
                            }
                            else {
                            }
                            let faq = doc.commonQuestions || [];
                            for (let z = 0; z < faq.length; z++) {
                                const newContent = this.updateLinkHrefByAnchorText(faq[z].answer, keyword.text, link, [link]);
                                if (newContent.updated) {
                                    await (repo === null || repo === void 0 ? void 0 : repo.updateFAQAnswer(doc._id, faq[z]._id, newContent.updatedHtml));
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
                    await this.updateTaskInfo(task._id, taskName, name, pageData.length);
                }
                await this.taskFinished(task._id, taskName, name);
            }
            return data;
        }
        catch (error) {
            console.log("errrrrrr");
            throw error;
        }
    }
    async changeKeywordLinkInComments(keywords, task, taskName) {
        var _a;
        try {
            let limit = 10;
            let count = await this.commentRepo.getcount({}) || 0;
            let keyword = keywords[0];
            const keywordRepo = (_a = this.registry.getRegistry(keyword.pageType)) === null || _a === void 0 ? void 0 : _a.repo;
            let link = "";
            if (keywordRepo != undefined) {
                const keywordPage = await keywordRepo.findOne({
                    _id: keyword.page
                }, {}, [{
                        path: "seoContent",
                        select: ["url"]
                    }]);
                if (keywordPage != null && keywordPage.seoContent != null && keywordPage.seoContent != undefined) {
                    let linkTag = await this.linkTagRepo.findOne({
                        link: keywordPage.seoContent._id
                    });
                    if (linkTag != null) {
                        link = linkTag.tag;
                    }
                }
            }
            await this.taskStarted(task._id, taskName, "comment");
            for (let j = 0; j <= count / limit; j++) {
                let pageData = await this.commentRepo.findMany({}, {}, j + 1, limit) || [];
                for (let k = 0; k < pageData.length; k++) {
                    for (let m = 0; m < keywords.length; m++) {
                        const keyword = keywords[m];
                        let comment = pageData[k];
                        if (comment.page.toHexString() == keyword.page.toHexString()
                            && comment.module == keyword.pageType) {
                            continue;
                        }
                        let linkMap = await this.linkMapRepo.findOne({
                            keyword: keyword._id,
                            from: comment.page,
                            fromType: comment.module,
                        });
                        let result = this.updateLinkHrefByAnchorText(comment.text, keyword.text, link, [link]);
                        await this.commentRepo.updateOne({
                            _id: comment._id
                        }, {
                            $set: {
                                text: result.updatedHtml
                            }
                        });
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
                            };
                            if (linkMap == null) {
                                linkMap = await this.linkMapRepo.insert({
                                    from: comment.page,
                                    fromType: comment.module,
                                    keyword: keyword._id,
                                    to: keyword.page,
                                    toType: keyword.pageType,
                                    commentLinks: [finalLink]
                                });
                            }
                            else {
                                await this.linkMapRepo.updateLinkIfNotExists(linkMap, "commentLinks", finalLink);
                            }
                        }
                        else {
                            if (linkMap != null) {
                                await this.linkMapRepo.deleteLinkFromMap(linkMap._id, "commentLinks", comment._id);
                            }
                        }
                    }
                }
                await this.updateTaskInfo(task._id, taskName, "comment", pageData.length);
            }
            await this.taskFinished(task._id, taskName, "comment");
        }
        catch (error) {
        }
    }
    async deleteKeywordLinkInContents(keywords, task, taskName) {
        var _a;
        try {
            let modules = this.registry.getAllRegistriesName();
            let data = {};
            for (let i = 0; i < modules.length; i++) {
                let name = modules[i];
                await this.taskStarted(task._id, taskName, name);
                let repo = (_a = this.registry.getRegistry(name)) === null || _a === void 0 ? void 0 : _a.repo;
                let count = await (repo === null || repo === void 0 ? void 0 : repo.getcount({})) || 0;
                let limit = 10;
                for (let j = 0; j <= count / limit; j++) {
                    let pageData = await (repo === null || repo === void 0 ? void 0 : repo.findMany({}, {}, j + 1, limit)) || [];
                    for (let k = 0; k < pageData.length; k++) {
                        let doc = pageData[k];
                        for (let m = 0; m < keywords.length; m++) {
                            const keyword = keywords[m];
                            if (doc._id.toHexString() == keyword.page.toHexString()
                                && keyword.pageType == name) {
                                continue;
                            }
                            let contents = (repo === null || repo === void 0 ? void 0 : repo.extractContents(doc)) || [];
                            let linkMap = await this.linkMapRepo.findOne({
                                keyword: keyword._id,
                                from: doc._id,
                                fromType: name,
                            });
                            for (let z = 0; z < contents.length; z++) {
                                let newContent = this.removeLinksByAnchorText(contents[z].text, keyword.text);
                                await (repo === null || repo === void 0 ? void 0 : repo.updateSubContentHTML(doc._id, contents[z].id || "", contents[z].extra || {}, newContent));
                                if (linkMap != null) {
                                    await this.linkMapRepo.deleteById(linkMap._id);
                                }
                            }
                            let sumrray = doc.summary || "";
                            let newContent = this.removeLinksByAnchorText(sumrray, keyword.text);
                            await (repo === null || repo === void 0 ? void 0 : repo.updateDocSummrary(doc._id, newContent));
                            let faq = doc.commonQuestions || [];
                            for (let z = 0; z < faq.length; z++) {
                                let newContent = this.removeLinksByAnchorText(faq[z].answer, keyword.text);
                                await (repo === null || repo === void 0 ? void 0 : repo.updateFAQAnswer(doc._id, faq[z]._id, newContent));
                            }
                        }
                    }
                    await this.updateTaskInfo(task._id, taskName, name, pageData.length);
                }
                await this.taskFinished(task._id, taskName, name);
            }
        }
        catch (error) {
            throw error;
        }
    }
    async deleteKeywordLinkInComments(keywords, task, taskName) {
        try {
            let limit = 10;
            let count = await this.commentRepo.getcount({}) || 0;
            await this.taskStarted(task._id, taskName, "comment");
            for (let j = 0; j <= count / limit; j++) {
                let pageData = await this.commentRepo.findMany({}, {}, j + 1, limit) || [];
                for (let k = 0; k < pageData.length; k++) {
                    let comment = pageData[k];
                    for (let m = 0; m < keywords.length; m++) {
                        const keyword = keywords[m];
                        if (comment.page.toHexString() == keyword.page.toHexString()
                            && comment.module == keyword.pageType) {
                            continue;
                        }
                        let linkMap = await this.linkMapRepo.findOne({
                            keyword: keyword._id,
                            from: comment.page,
                            fromType: comment.module,
                        });
                        let newContent = this.removeLinksByAnchorText(comment.text, keyword.text);
                        await this.commentRepo.updateOne({
                            _id: comment._id
                        }, {
                            $set: {
                                text: newContent
                            }
                        });
                        if (linkMap != null) {
                            await this.linkMapRepo.deleteById(linkMap._id);
                        }
                    }
                }
                await this.updateTaskInfo(task._id, taskName, "comment", pageData.length);
            }
            await this.taskFinished(task._id, taskName, "comment");
        }
        catch (error) {
            throw error;
        }
    }
    async startProccess(keywordTask) {
        try {
            let tasksList = keywordTask.tasksList;
            let tasks = [];
            for (let i = 0; i < tasksList.length; i++) {
                if (tasksList[i] == "checkKeywordInContents" &&
                    keywordTask.keyword != undefined) {
                    let data = await this.getMudulesPageCount();
                    for (const key in data) {
                        tasks.push({
                            module: key,
                            type: tasksList[i],
                            status: "pending",
                            count: data[key].count,
                            proccessed: 0
                        });
                    }
                }
                if (tasksList[i] == "checkKeywordsInContent") {
                    tasks.push({
                        type: tasksList[i],
                        module: "keyword",
                        status: "pending",
                        count: await this.keywordRepo.getcount({}),
                        proccessed: 0
                    });
                }
                if (tasksList[i] == "checkKeywordsInContents" && keywordTask.keywords) {
                    let data = await this.getMudulesPageCount();
                    for (const key in data) {
                        tasks.push({
                            module: key,
                            type: tasksList[i],
                            status: "pending",
                            count: data[key].count,
                            proccessed: 0
                        });
                    }
                }
                if (tasksList[i] == "checkAllKeyWordsInComments" || tasksList[i] == "checkKeywordInComments") {
                    tasks.push({
                        type: tasksList[i],
                        module: "comment",
                        status: "pending",
                        count: await this.commentRepo.getcount({}),
                        proccessed: 0
                    });
                }
                if (tasksList[i] == "checkKeywordsInComments") {
                    tasks.push({
                        type: tasksList[i],
                        module: "comment",
                        status: "pending",
                        count: await this.commentRepo.getcount({}),
                        proccessed: 0
                    });
                }
                if (tasksList[i] == "changeKeywordLinkInContents") {
                    let data = await this.getMudulesPageCount();
                    for (const key in data) {
                        tasks.push({
                            module: key,
                            type: tasksList[i],
                            status: "pending",
                            count: data[key].count,
                            proccessed: 0
                        });
                    }
                }
                if (tasksList[i] == "changeKeywordLinkInComments") {
                    tasks.push({
                        type: tasksList[i],
                        module: "comment",
                        status: "pending",
                        count: await this.commentRepo.getcount({}),
                        proccessed: 0
                    });
                }
                if (tasksList[i] == "deleteKeywordLinkInContents") {
                    let data = await this.getMudulesPageCount();
                    for (const key in data) {
                        tasks.push({
                            module: key,
                            type: tasksList[i],
                            status: "pending",
                            count: data[key].count,
                            proccessed: 0
                        });
                    }
                }
                if (tasksList[i] == "deleteKeywordLinkInComments") {
                    tasks.push({
                        type: tasksList[i],
                        module: "comment",
                        status: "pending",
                        count: await this.commentRepo.getcount({}),
                        proccessed: 0
                    });
                }
            }
            await this.updateOne({
                _id: keywordTask._id
            }, {
                tasks
            });
            try {
                keywordTask = await this.findById(keywordTask._id);
                await this.proccess(keywordTask);
                await this.updateOne({
                    _id: keywordTask._id
                }, {
                    status: "finished"
                });
            }
            catch (error) {
                console.log("error", error);
            }
        }
        catch (error) {
        }
    }
    async getMudulesPageCount() {
        var _a;
        let modules = this.registry.getAllRegistriesName();
        let data = {};
        for (let i = 0; i < modules.length; i++) {
            let name = modules[i];
            let repo = (_a = this.registry.getRegistry(name)) === null || _a === void 0 ? void 0 : _a.repo;
            let count = await (repo === null || repo === void 0 ? void 0 : repo.getcount({}));
            data[name] = {
                repo,
                count
            };
        }
        return data;
    }
    async runTasks() {
        setInterval(async () => {
            try {
                const keywordTask = await this.findOne({
                    status: "waiting"
                });
                if (keywordTask != null) {
                    this.updateOne({
                        _id: keywordTask._id
                    }, {
                        $set: {
                            status: "loading"
                        }
                    });
                    await this.startProccess(keywordTask);
                }
            }
            catch (error) {
                console.log("error", error);
            }
        }, 10000);
    }
}
exports.default = KeywordTaskRepository;
