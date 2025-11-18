"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../../repository"));
const repository_2 = __importDefault(require("../keywordTask/repository"));
const model_1 = require("./model");
const repository_3 = __importDefault(require("../system/repository"));
const repository_4 = __importDefault(require("../googleApiToken/repository"));
const repository_5 = __importDefault(require("../domain/repository"));
const contentRegistry_1 = __importDefault(require("../../contentRegistry"));
const axios_1 = __importDefault(require("axios"));
const repository_6 = __importDefault(require("../linkTag/repository"));
const repository_7 = __importDefault(require("../linkMap/repository"));
const jsdom_1 = require("jsdom");
const days = 1000 * 60 * 60 * 24;
const dateRanger = {
    "1m": () => {
        return {
            start: new Date(Date.now() - (days * 31)),
            end: new Date(Date.now() - days),
        };
    },
    "3m": () => {
        return {
            start: new Date(Date.now() - (days * 91)),
            end: new Date(Date.now() - days),
        };
    },
    "6m": () => {
        return {
            start: new Date(Date.now() - (days * 181)),
            end: new Date(Date.now() - days),
        };
    },
    "1y": () => {
        return {
            start: new Date(Date.now() - (days * 366)),
            end: new Date(Date.now() - days),
        };
    },
};
class KeywordRepository extends repository_1.default {
    constructor(options) {
        super(model_1.KeywordModel, options);
        this.keywordTaskRepo = new repository_2.default(this);
        this.systemConfigRepo = new repository_3.default();
        this.googleApiTokenRepo = new repository_4.default();
        this.domainRepo = new repository_5.default();
        this.contentRegistry = contentRegistry_1.default.getInstance();
        this.linkTagRepo = new repository_6.default();
        this.linkMapRepo = new repository_7.default(this);
    }
    async getKeywordChart(id, dateRange) {
        var _a;
        try {
            const keyword = await this.findOne({
                _id: id
            }, {});
            if (keyword == null) {
                throw new Error("");
            }
            const repo = (_a = this.contentRegistry.getRegistry(keyword === null || keyword === void 0 ? void 0 : keyword.pageType)) === null || _a === void 0 ? void 0 : _a.repo;
            if (repo != undefined) {
                let page = await repo.findOne({
                    _id: keyword.page._id
                }, {}, [
                    {
                        path: "seoContent"
                    },
                    {
                        path: "language"
                    }
                ]);
                let domain = await this.getDomain(page === null || page === void 0 ? void 0 : page.language);
                let data = {};
                // data["siteUrl"] = domain.domain
                // data["keyword"] = keyword.text 
                data["siteUrl"] = "sc-domain:medirence.com";
                data["keyword"] = "شرکت تجهیزات پزشکی";
                let date = dateRanger[dateRange]();
                data["start"] = date.start;
                data["end"] = date.end;
                return await this.sendGoogleApiReq(domain.domainId, data, "users/webmaster/keyword/query-performance-by-keyword");
            }
        }
        catch (error) {
            throw error;
        }
    }
    async getKeywordSummray(id, dateRange) {
        var _a;
        try {
            const keyword = await this.findOne({
                _id: id
            }, {});
            if (keyword == null) {
                throw new Error("");
            }
            const repo = (_a = this.contentRegistry.getRegistry(keyword === null || keyword === void 0 ? void 0 : keyword.pageType)) === null || _a === void 0 ? void 0 : _a.repo;
            if (repo != undefined) {
                let page = await repo.findOne({
                    _id: keyword.page._id
                }, {}, [
                    {
                        path: "seoContent"
                    },
                    {
                        path: "language"
                    }
                ]);
                let domain = await this.getDomain(page === null || page === void 0 ? void 0 : page.language);
                let data = {};
                // data["siteUrl"] = domain.domain
                // data["keyword"] = keyword.text 
                data["siteUrl"] = "sc-domain:medirence.com";
                data["keyword"] = "شرکت تجهیزات پزشکی";
                let date = dateRanger[dateRange]();
                data["start"] = date.start;
                data["end"] = date.end;
                return await this.sendGoogleApiReq(domain.domainId, data, "users/webmaster/keyword/summary-by-keyword");
            }
        }
        catch (error) {
            throw error;
        }
    }
    async getKeywordPosition(id, date) {
        var _a;
        try {
            const keyword = await this.findOne({
                _id: id
            }, {});
            if (keyword == null) {
                throw new Error("");
            }
            const repo = (_a = this.contentRegistry.getRegistry(keyword === null || keyword === void 0 ? void 0 : keyword.pageType)) === null || _a === void 0 ? void 0 : _a.repo;
            if (repo != undefined) {
                let page = await repo.findOne({
                    _id: keyword.page._id
                }, {}, [
                    {
                        path: "seoContent"
                    },
                    {
                        path: "language"
                    }
                ]);
                let domain = await this.getDomain(page === null || page === void 0 ? void 0 : page.language);
                let data = {};
                // data["siteUrl"] = domain.domain
                // data["keyword"] = keyword.text 
                data["siteUrl"] = "sc-domain:medirence.com";
                data["keyword"] = "شرکت تجهیزات پزشکی";
                data["date"] = date;
                return await this.sendGoogleApiReq(domain.domainId, data, "users/webmaster/keyword/position");
            }
        }
        catch (error) {
            throw error;
        }
    }
    async ensureKeywords(keywords = [], admin, pageType, page) {
        // console.log("ensureKeywords",page)
        let newKeyIds = [];
        for (let i = 0; i < keywords.length; i++) {
            let exists = await this.isExists({
                text: {
                    $eq: keywords[i]
                }
            });
            if (!exists) {
                const keyword = await this.insert({
                    text: keywords[i],
                    page,
                    pageType
                });
                newKeyIds.push(keyword._id);
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
            });
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
            });
        }
        let deletedKeyWords = await this.findAll({
            text: {
                $nin: keywords
            },
            pageType,
            page,
        });
        if (deletedKeyWords.length > 0) {
            let deletedKeyIds = deletedKeyWords.map(t => t._id);
            await this.keywordTaskRepo.insert({
                admin,
                status: "waiting",
                tasksList: ["deleteKeywordLinkInComments", "deleteKeywordLinkInContents"],
                keywords: deletedKeyIds,
                page,
                pageType
            });
        }
    }
    async changeKeywords(id, admin, pageType, page) {
        try {
            const keyword = await this.findByIdAndUpdate(id, {
                $set: {
                    page,
                    pageType,
                    isProccessed: false
                }
            });
            if (keyword != null) {
                await this.keywordTaskRepo.insert({
                    admin,
                    status: "waiting",
                    tasksList: ["changeKeywordLinkInComments", "changeKeywordLinkInContents"],
                    keywords: [keyword._id],
                });
            }
            return keyword;
        }
        catch (error) {
            throw error;
        }
    }
    async doDeleteKeyword(id, admin) {
        try {
            const keyword = await this.findByIdAndUpdate(id, {
                $unset: {
                    page: 1,
                    pageType: 1,
                    isProccessed: false
                }
            });
            if (keyword != null) {
                await this.keywordTaskRepo.insert({
                    admin,
                    status: "waiting",
                    tasksList: ["deleteKeywordLinkInContents", "deleteKeywordLinkInContents"],
                    keywords: [keyword._id]
                });
            }
        }
        catch (error) {
            throw error;
        }
    }
    async getDomain(language) {
        try {
            var domain;
            if (language.isDomain && language.domain) {
                domain = await this.domainRepo.findOne({
                    _id: language.domain
                });
            }
            else {
                domain = await this.domainRepo.findOne({
                    isDefault: true
                });
            }
            if (domain != null) {
                return {
                    domain: `sc-domain:${domain.domain}`,
                    domainId: domain._id
                };
            }
            return {
                domain: "",
                domainId: ""
            };
        }
        catch (error) {
            throw error;
        }
    }
    async sendGoogleApiReq(domainId, data, subUrl) {
        try {
            const googleApiToken = await this.googleApiTokenRepo.findOne({
                domains: domainId
            });
            const googleCredential = await this.systemConfigRepo.getConfigValue("google_credential");
            const apiUrl = await this.systemConfigRepo.getConfigValue("google_api_server");
            const apiKey = await this.systemConfigRepo.getConfigValue("google_api_key");
            data["credential"] = googleCredential;
            data["token"] = googleApiToken === null || googleApiToken === void 0 ? void 0 : googleApiToken.token;
            const res = await axios_1.default.post(`${apiUrl}${subUrl}`, data, {
                headers: {
                    "x-api-key": apiKey
                }
            });
            return res.data;
        }
        catch (error) {
            throw error;
        }
    }
    async actiavateLink(id, part, registry, subPartId, index) {
        var _a;
        try {
            const linkMap = await this.linkMapRepo.findOne({
                _id: id
            }, {}, [{
                    path: "keyword"
                }, {
                    path: "to"
                }]);
            if (linkMap != null && linkMap.keyword != null && linkMap.to != null) {
                const linkTag = await this.linkTagRepo.findOne({
                    link: linkMap.to.seoContent
                });
                if (linkTag == null) {
                    throw ("لینک یافت نشد");
                }
                if (part == "content") {
                    const pageRepo = (_a = registry.getRegistry(linkMap.fromType)) === null || _a === void 0 ? void 0 : _a.repo;
                    if (pageRepo != undefined) {
                        const page = await pageRepo.findById(linkMap.from);
                        if (page != null) {
                            let content = await pageRepo.findSubContent(page, subPartId);
                            if (content != undefined) {
                                let newContent = this.addOrWrapLinkEverywhere(content, linkMap.keyword.text, linkTag.tag, index);
                                await pageRepo.updateSubContentHTML(linkMap.from, subPartId, {}, newContent);
                                await this.linkMapRepo.updateOne({
                                    _id: linkMap._id,
                                    "contentLinks.subPartId": subPartId
                                }, {
                                    $set: {
                                        "contentLinks.$.isActive": true,
                                        "contentLinks.$.isProccessed": true
                                    }
                                });
                            }
                        }
                    }
                }
            }
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async deactivateLink(id, part, registry, subPartId, index) {
        var _a;
        try {
            const linkMap = await this.linkMapRepo.findOne({
                _id: id
            }, {}, [{
                    path: "keyword"
                }, {
                    path: "to"
                }]);
            if (linkMap != null && linkMap.keyword != null && linkMap.to != null) {
                if (part == "content") {
                    const pageRepo = (_a = registry.getRegistry(linkMap.fromType)) === null || _a === void 0 ? void 0 : _a.repo;
                    if (pageRepo != undefined) {
                        const page = await pageRepo.findById(linkMap.from);
                        if (page != null) {
                            let content = await pageRepo.findSubContent(page, subPartId);
                            if (content != undefined) {
                                let newContent = this.removeLinkEverywhere(content, linkMap.keyword.text, index);
                                await pageRepo.updateSubContentHTML(linkMap.from, subPartId, {}, newContent);
                                await this.linkMapRepo.updateOne({
                                    _id: linkMap._id,
                                    "contentLinks.subPartId": subPartId
                                }, {
                                    $set: {
                                        "contentLinks.$.isActive": false,
                                        "contentLinks.$.isProccessed": true
                                    }
                                });
                            }
                        }
                    }
                }
            }
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async rejectLink(id, part, registry, subPartId) {
        try {
            await this.linkMapRepo.updateOne({
                _id: id,
                "contentLinks.subPartId": subPartId
            }, {
                $set: {
                    "contentLinks.$.isRejected": true,
                    "contentLinks.$.isProccessed": true
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    addOrWrapLinkEverywhere(html, anchorText, newHref, index) {
        const dom = new jsdom_1.JSDOM(html);
        const document = dom.window.document;
        const matches = [];
        // تابع کمکی برای traverse کردن DOM
        function traverse(node) {
            var _a, _b, _c;
            if (node.nodeType === 1) {
                const el = node;
                if (el.tagName.toLowerCase() === 'a' && ((_a = el.textContent) === null || _a === void 0 ? void 0 : _a.includes(anchorText))) {
                    matches.push({ type: 'a', node: el });
                }
                else if (el.tagName.toLowerCase() === 'img' && ((_b = el.getAttribute('alt')) === null || _b === void 0 ? void 0 : _b.includes(anchorText))) {
                    matches.push({ type: 'img', node: el });
                }
                // ادامه traverse روی بچه‌ها
                el.childNodes.forEach(traverse);
            }
            else if (node.nodeType === 3) { // Text node
                const textNode = node;
                if ((_c = textNode.textContent) === null || _c === void 0 ? void 0 : _c.includes(anchorText)) {
                    matches.push({ type: 'text', node: textNode });
                }
            }
        }
        traverse(document.body);
        // اعمال لینک
        if (index !== undefined) {
            const m = matches[index]; // index انسانی، اول = 1
            if (m)
                this.applyLink(m, newHref, anchorText, document);
        }
        else {
            matches.forEach(m => this.applyLink(m, newHref, anchorText, document));
        }
        return document.body.innerHTML;
    }
    applyLink(match, newHref, anchorText, document) {
        if (match.type === 'a') {
            match.node.setAttribute('href', newHref);
        }
        else if (match.type === 'text') {
            const textNode = match.node;
            const parent = textNode.parentElement;
            if (parent) {
                const replaced = textNode.textContent.replace(new RegExp(anchorText, 'g'), `<a href="${newHref}">${anchorText}</a>`);
                const frag = document.createRange().createContextualFragment(replaced);
                parent.replaceChild(frag, textNode);
            }
        }
        else if (match.type === 'img') {
            const img = match.node;
            if (!img.parentElement || img.parentElement.tagName.toLowerCase() !== 'a') {
                const link = document.createElement('a');
                link.setAttribute('href', newHref);
                img.replaceWith(link);
                link.appendChild(img);
            }
        }
    }
    removeLinkEverywhere(html, anchorText, index) {
        const dom = new jsdom_1.JSDOM(html);
        const document = dom.window.document;
        const matches = [];
        // traverse برای پیدا کردن node ها
        function traverse(node) {
            var _a, _b, _c;
            if (node.nodeType === 1) {
                const el = node;
                if (el.tagName.toLowerCase() === 'a' && ((_a = el.textContent) === null || _a === void 0 ? void 0 : _a.includes(anchorText))) {
                    matches.push({ type: 'a', node: el });
                }
                else if (el.tagName.toLowerCase() === 'img' && ((_b = el.getAttribute('alt')) === null || _b === void 0 ? void 0 : _b.includes(anchorText))) {
                    matches.push({ type: 'img', node: el });
                }
                el.childNodes.forEach(traverse);
            }
            else if (node.nodeType === 3) { // Text node
                const textNode = node;
                if ((_c = textNode.textContent) === null || _c === void 0 ? void 0 : _c.includes(anchorText)) {
                    matches.push({ type: 'text', node: textNode });
                }
            }
        }
        traverse(document.body);
        // اعمال حذف لینک
        if (index !== undefined) {
            const m = matches[index - 1]; // index انسانی
            if (m)
                this.removeLink(m);
        }
        else {
            matches.forEach(m => this.removeLink(m));
        }
        return document.body.innerHTML;
    }
    removeLink(match) {
        if (match.type === 'a') {
            const a = match.node;
            const parent = a.parentElement;
            if (parent) {
                while (a.firstChild) {
                    parent.insertBefore(a.firstChild, a);
                }
                parent.removeChild(a);
            }
        }
        else if (match.type === 'img') {
            const img = match.node;
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
exports.default = KeywordRepository;
