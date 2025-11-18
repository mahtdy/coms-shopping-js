"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryUrlBuilder = exports.contentUrlBuilder = exports.customUrlBuilder = void 0;
const model_1 = require("./model");
const repository_1 = __importDefault(require("../../repository"));
const repository_2 = __importDefault(require("../system/repository"));
const config_1 = __importDefault(require("../../../services/config"));
const repository_3 = __importDefault(require("../linkTag/repository"));
const repository_4 = __importDefault(require("../publishQueue/repository"));
const repository_5 = __importDefault(require("../contentQueue/repository"));
const repository_6 = __importDefault(require("../domain/repository"));
const repository_7 = __importDefault(require("../redirect/repository"));
const nginx_1 = __importDefault(require("../../../services/nginx/nginx"));
const repository_8 = __importDefault(require("../language/repository"));
const repository_9 = __importDefault(require("../keyword/repository"));
function syncNginx() {
    // nginx.init()
    // let nginx = new Nginx()
}
exports.customUrlBuilder = {};
// const 
// async function test(contentData :any) {
// }
// const nginx = new Nginx()
class ContentRepository extends repository_1.default {
    // nginx : Nginx
    constructor(options) {
        super(model_1.ContentModel);
        this.confRepo = new repository_2.default();
        this.languageRepo = new repository_8.default();
        this.linkTagRepo = new repository_3.default();
        this.publishQueueRepo = new repository_4.default();
        this.contentQueueRepo = new repository_5.default();
        this.redirectRepo = new repository_7.default();
        this.domainRepo = new repository_6.default();
        this.nginx = new nginx_1.default(this);
        this.keywordRepo = new repository_9.default();
    }
    // @checkForCategory()
    async insert(document, config = {
        type: "content"
    }) {
        document.originalUrl = document.url;
        document.category = config.category;
        document.language = config.language;
        if (!document.isStatic) {
            if (config.customFunc) {
                document.url = await config.customFunc(document.url, config.category, config.language);
            }
            else if (config.type == "article") {
                var content = await this.confRepo.getConfigValue("content-url-style");
                document.url = await exports.contentUrlBuilder[content](document.url, config.category, config.language);
            }
            else if (config.type == "category") {
                var category = await this.confRepo.getConfigValue("category-url-style");
                document.url = await exports.categoryUrlBuilder[category](document.url, config.category, config.language);
            }
        }
        if (document.url != "" && !document.url.startsWith("/")) {
            document.url = "/" + document.url;
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
            });
            if (isExists) {
                throw new Error("کلمه‌کلیدی تکراری");
            }
        }
        if (document.url.startsWith("/") || document.url == "") {
            let domain = await this.domainRepo.findOne({
                isDefault: true
            });
            document.absoluteUrl = `https://${domain === null || domain === void 0 ? void 0 : domain.domain}${document.url}`;
        }
        else {
            document.absoluteUrl = `https://${document.url}`;
        }
        try {
            var d = await super.insert(document);
            let redirect = await this.redirectRepo.findOne({
                from: d.url,
                status: {
                    $ne: false
                }
            });
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
                });
                this.nginx.init();
            }
            await this.linkTagRepo.insert({
                link: d._id
            });
        }
        catch (error) {
            throw error;
        }
        try {
            if (d.type == "category")
                await this.categoryPostCondition(d);
        }
        catch (error) {
            throw error;
        }
        if ((content === null || content === void 0 ? void 0 : content.keyWords) != undefined)
            await this.keywordRepo.ensureKeywords(content.keyWords, config.admin, config.type, document === null || document === void 0 ? void 0 : document.id);
        return d;
    }
    async categoryPostCondition(contentData) {
        await this.publishQueueRepo.deleteCategoryFromList(contentData.id, contentData.language, "content");
        this.contentQueueRepo.insert({
            data: {
                id: contentData.id,
                url: contentData.url
            }
        });
    }
    async editContent(query, queryData, config = {
        type: "content"
    }) {
        await super.findOneAndUpdate(query, queryData);
    }
    async findOneAndUpdate(query, queryData) {
        return super.findOneAndUpdate(query, queryData);
    }
    async findOneAndDelete(query) {
        try {
            var c = await super.findOneAndDelete(query);
            this.linkTagRepo.findOneAndDelete({
                link: c === null || c === void 0 ? void 0 : c._id
            });
            // check for redirect
        }
        catch (error) {
            console.log(error);
            throw error;
        }
        return c;
    }
    async getContentByUrl(url) {
        return this.findOne({
            url
        });
    }
    async checkForEdit(query, content, config = {
        type: "content"
    }) {
        try {
            var document = await this.findOne(query);
            if (document == null)
                return;
            for (const key in content) {
                if (key == "mainKeyWord" && content['mainKeyWord'] == document.mainKeyWord) {
                    delete content["mainKeyWord"];
                }
                // console.log("key" , key)
                if (key == "url") {
                    if (!content.isStatic
                        && (content['url'] != document.url || document.category != config.category || document.language != config.language || document.isStatic != content.isStatic)) {
                        let url;
                        if (content['originalUrl'] == undefined) {
                            content['originalUrl'] = content['url'];
                        }
                        url = content['originalUrl'];
                        if (config.customFunc) {
                            content.url = await config.customFunc(url, config.category, config.language);
                        }
                        else if (config.type == "article") {
                            var c = await this.confRepo.getConfigValue("content-url-style");
                            content.url = await exports.contentUrlBuilder[c](url, config.category, config.language);
                        }
                        else if (config.type == "category") {
                            var category = await this.confRepo.getConfigValue("category-url-style");
                            content.url = await exports.categoryUrlBuilder[category](url, config.category, config.language);
                        }
                    }
                    else if (content.isStatic != true) {
                        delete content["url"];
                    }
                    if (content["url"] != undefined && content["url"] != "" && !content["url"].includes(".") && !content["url"].startsWith("/")) {
                        content["url"] = "/" + content["url"];
                    }
                    if (content.isStatic == true) {
                        content["originalUrl"] = content["url"];
                    }
                }
            }
            content['language'] = config.language;
            if (content.url != undefined) {
                if (content.url.startsWith("/") || content.url == "") {
                    let domain = await this.domainRepo.findOne({
                        isDefault: true
                    });
                    content.absoluteUrl = `https://${domain === null || domain === void 0 ? void 0 : domain.domain}${content.url}`;
                }
                else {
                    content.absoluteUrl = `https://${content.url}`;
                }
            }
            else {
                if (document.url.startsWith("/") || document.url == "") {
                    let domain = await this.domainRepo.findOne({
                        isDefault: true
                    });
                    content.absoluteUrl = `https://${domain === null || domain === void 0 ? void 0 : domain.domain}${document.url}`;
                }
                else {
                    content.absoluteUrl = `https://${document.url}`;
                }
            }
            var updateQuery = {
                $set: content
            };
            if (document.redirecturl != undefined && !content.redirecturl) {
                updateQuery["$unset"] = {
                    redirecturl: 1,
                    redirect_status: 1
                };
            }
            await this.findByIdAndUpdate(document._id, updateQuery);
            var after = await this.findById(document._id);
            await this.ensureKeywords(content, config, after);
            // await this.keywordRepo.ensureKeywords(
            //     content.keyWords,
            //     config.admin as Types.ObjectId,
            //     config?.type || "",
            //     after?.id
            // )
            if (after != null)
                this.updateRedirects(document, after);
            return document;
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async ensureKeywords(content, config = {
        type: "content"
    }, after) {
        await this.keywordRepo.ensureKeywords(content.keyWords, config.admin, (config === null || config === void 0 ? void 0 : config.type) || "", after === null || after === void 0 ? void 0 : after.id);
    }
    async updateRedirects(document, afterDocument) {
        let domain;
        try {
            let lang = await this.domainRepo.languageRepo.findById(document.language);
            if (lang === null || lang === void 0 ? void 0 : lang.domain)
                domain = lang === null || lang === void 0 ? void 0 : lang.domain;
            else {
                let defaultDomain = await this.domainRepo.findOne({
                    isDefault: true
                });
                domain = defaultDomain === null || defaultDomain === void 0 ? void 0 : defaultDomain._id;
            }
        }
        catch (error) {
        }
        if (afterDocument.redirecturl) {
            let redirect = afterDocument.redirecturl;
            let toStatic = true;
            let to = await this.findOne({
                url: afterDocument.redirecturl
            });
            if (to != null) {
                redirect = to._id.toHexString();
                toStatic = false;
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
            });
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
            });
            this.nginx.init();
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
            });
            if (r != null) {
                await this.redirectRepo.updateMany({
                    from: document.url
                }, {
                    $set: {
                        status: false
                    }
                });
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
            });
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
                });
            }
            if (afterDocument.redirecturl == undefined) {
                const beforeRedirect = await this.redirectRepo.deleteMany({
                    from: afterDocument.url
                });
                if (beforeRedirect != null) {
                    this.nginx.init();
                }
            }
            this.nginx.init();
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
            });
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
                });
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
                });
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
                });
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
            });
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
                });
                this.nginx.init();
            }
            if (afterDocument.redirecturl == undefined) {
                const beforeRedirect = await this.redirectRepo.deleteMany({
                    from: afterDocument.url
                });
                if (beforeRedirect != null) {
                    this.nginx.init();
                }
            }
        }
    }
    async makeURL(url, isStatic = false, config) {
        var _a;
        try {
            if (!isStatic) {
                if (config.customFunc) {
                    url = await config.customFunc(url, config.category, config.language);
                }
                else if (config.type == "article") {
                    var content = await this.confRepo.getConfigValue("content-url-style");
                    url = await exports.contentUrlBuilder[content](url, config.category, config.language, config.domain, config.isDomain);
                }
                else if (config.type == "category") {
                    var category = await this.confRepo.getConfigValue("category-url-style");
                    url = await exports.categoryUrlBuilder[category](url, config.category, config.language, config.domain, config.isDomain);
                }
                else if (config.type && exports.customUrlBuilder[config.type]) {
                    url = await ((_a = exports.customUrlBuilder[config.type]) === null || _a === void 0 ? void 0 : _a.call(exports.customUrlBuilder, url, config.category, config.language));
                }
                return url;
            }
            if (config.domain != undefined) {
                var ldomain = await domainRepo.findById(config.domain);
                if (ldomain != null) {
                    return ldomain.domain + "/" + url;
                }
            }
            if (config.language != undefined) {
                var l = await languageRepo.findById(config.language);
                if (l != null && l.sign != config_1.default.getConfig("defaultLanguage")) {
                    if (l.domain) {
                        var ldomain = await domainRepo.findById(l.domain);
                        if (ldomain != null && config.isDomain != false) {
                            return ldomain.domain + "/" + url;
                        }
                    }
                }
            }
            return url;
        }
        catch (error) {
            throw error;
        }
    }
    async isUrlExists(url, id) {
        try {
            let q = {
                url: {
                    $eq: url
                }
            };
            if (id != undefined) {
                q["id"] = {
                    "$ne": id
                };
            }
            return await this.isExists(q);
        }
        catch (error) {
            throw error;
        }
    }
}
exports.default = ContentRepository;
const contentRepo = new ContentRepository();
const configRepo = new repository_2.default();
const domainRepo = contentRepo.domainRepo;
const languageRepo = contentRepo.domainRepo.languageRepo;
exports.contentUrlBuilder = {
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
    1: async function (url, category, language, domain, isDomain) {
        try {
            var catUrl = await contentRepo.findOne({
                type: "category",
                id: category,
                isMainLang: true
            });
            var resUrl = (catUrl === null || catUrl === void 0 ? void 0 : catUrl.url) + "/" + url;
            if (language != undefined) {
                var l = await languageRepo.findById(language);
                if (l != null && l.sign != config_1.default.getConfig("defaultLanguage")) {
                    if (l.domain) {
                        var ldomain = await domainRepo.findById(l.domain);
                        if (ldomain != null) {
                            return ldomain + "/" + resUrl;
                        }
                    }
                    return "/" + l.sign + resUrl;
                }
            }
            return resUrl;
        }
        catch (error) {
            throw error;
        }
    },
    // url => /url
    2: async function (url, category, language, domain, isDomain) {
        try {
            var resUrl = "/" + url;
            if (language != undefined) {
                var l = await languageRepo.findById(language);
                if (l != null && l.sign != config_1.default.getConfig("defaultLanguage")) {
                    if (l.domain) {
                        var ldomain = await domainRepo.findById(l.domain);
                        if (ldomain != null) {
                            return ldomain.domain + "/" + resUrl;
                        }
                    }
                    return "/" + l.sign + resUrl;
                }
            }
            return resUrl;
        }
        catch (error) {
            throw error;
        }
    },
    // url => blog/url
    3: async function (url, category, language, domain, isDomain) {
        try {
            var seoPrefix = await configRepo.getConf("seo-prefix");
            var resUrl = "/" + (seoPrefix === null || seoPrefix === void 0 ? void 0 : seoPrefix.value) + "/" + url;
            if (domain != undefined) {
                var ldomain = await domainRepo.findById(domain);
                if (ldomain != null) {
                    return ldomain.domain + "/" + (seoPrefix === null || seoPrefix === void 0 ? void 0 : seoPrefix.value) + "/" + url;
                }
            }
            else if (language != undefined) {
                var l = await languageRepo.findById(language);
                if (l != null && l.sign != config_1.default.getConfig("defaultLanguage")) {
                    if (l.domain) {
                        var ldomain = await domainRepo.findById(l.domain);
                        if (l.isDomain && ldomain != null && isDomain != false) {
                            return ldomain.domain + "/" + (seoPrefix === null || seoPrefix === void 0 ? void 0 : seoPrefix.value) + "/" + url;
                        }
                    }
                    return "/" + (seoPrefix === null || seoPrefix === void 0 ? void 0 : seoPrefix.value) + "/" + l.sign + "/" + url;
                }
            }
            return resUrl;
        }
        catch (error) {
            throw error;
        }
    },
    // url => blog/cat/url
    4: async function (url, category, language, domain, isDomain) {
        try {
            var catUrl = await contentRepo.findOne({
                type: "category",
                id: category,
                isMainLang: true
            });
            var seoPrefix = await configRepo.getConf("seo-prefix");
            var resUrl = (catUrl === null || catUrl === void 0 ? void 0 : catUrl.url) + "/" + url;
            if (language != undefined) {
                var l = await languageRepo.findById(language);
                if (l != null && l.sign != config_1.default.getConfig("defaultLanguage")) {
                    if (l.domain) {
                        var ldomain = await domainRepo.findById(l.domain);
                        if (ldomain != null) {
                            var tpUrl = catUrl === null || catUrl === void 0 ? void 0 : catUrl.url.substring((seoPrefix === null || seoPrefix === void 0 ? void 0 : seoPrefix.value.length) + 1, catUrl === null || catUrl === void 0 ? void 0 : catUrl.url.length);
                            return ldomain.domain + "/" + (seoPrefix === null || seoPrefix === void 0 ? void 0 : seoPrefix.value) + "/" + tpUrl + "/" + url;
                        }
                    }
                    var tpUrl = catUrl === null || catUrl === void 0 ? void 0 : catUrl.url.substring((seoPrefix === null || seoPrefix === void 0 ? void 0 : seoPrefix.value.length) + 1, catUrl === null || catUrl === void 0 ? void 0 : catUrl.url.length);
                    return "/" + (seoPrefix === null || seoPrefix === void 0 ? void 0 : seoPrefix.value) + "/" + l.sign + "/" + tpUrl + "/" + url;
                }
            }
            return resUrl;
        }
        catch (error) {
            throw error;
        }
    },
    // url => blog/cat1/cat2/.../catn/url
};
exports.categoryUrlBuilder = {
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
    1: async function (url, category, language, domain, isDomain) {
        try {
            var resUrl = "/" + url;
            if (language != undefined) {
                var l = await languageRepo.findById(language);
                if (l != null && l.sign != config_1.default.getConfig("defaultLanguage")) {
                    if (l.domain) {
                        var ldomain = await domainRepo.findById(l.domain);
                        if (ldomain != null) {
                            return ldomain.domain + "/" + resUrl;
                        }
                    }
                    return "/" + l.sign + resUrl;
                }
            }
            return resUrl;
        }
        catch (error) {
            throw error;
        }
    },
    // url => /blog/category/url
    2: async function (url, category, language, domain, isDomain) {
        try {
            var seoPrefix = await configRepo.getConf("seo-prefix");
            var resUrl = "/" + (seoPrefix === null || seoPrefix === void 0 ? void 0 : seoPrefix.value) + "/category/" + url;
            if (domain != undefined) {
                var ldomain = await domainRepo.findById(domain);
                if (ldomain != null) {
                    return ldomain.domain + "/" + (seoPrefix === null || seoPrefix === void 0 ? void 0 : seoPrefix.value) + "/category/" + url;
                }
            }
            if (language != undefined) {
                var l = await languageRepo.findById(language);
                if (l != null && l.sign != config_1.default.getConfig("defaultLanguage")) {
                    if (l.domain) {
                        var ldomain = await domainRepo.findById(l.domain);
                        if (l.isDomain && ldomain != null && isDomain != false) {
                            return ldomain.domain + "/" + (seoPrefix === null || seoPrefix === void 0 ? void 0 : seoPrefix.value) + "/category/" + url;
                        }
                    }
                    return "/" + (seoPrefix === null || seoPrefix === void 0 ? void 0 : seoPrefix.value) + "/" + l.sign + "/category/" + url;
                }
            }
            return resUrl;
        }
        catch (error) {
            throw error;
        }
    },
    // url => blog/url
    3: async function (url, category, language) {
        try {
            var seoPrefix = await configRepo.getConf("seo-prefix");
            var resUrl = "/" + (seoPrefix === null || seoPrefix === void 0 ? void 0 : seoPrefix.value) + "/" + url;
            if (language != undefined) {
                var l = await languageRepo.findById(language);
                if (l != null && l.sign != config_1.default.getConfig("defaultLanguage")) {
                    if (l.domain) {
                        var domain = await domainRepo.findById(l.domain);
                        if (domain != null) {
                            return domain.domain + "/" + (seoPrefix === null || seoPrefix === void 0 ? void 0 : seoPrefix.value) + "/" + url;
                        }
                    }
                    return "/" + (seoPrefix === null || seoPrefix === void 0 ? void 0 : seoPrefix.value) + "/" + l.sign + "/" + url;
                }
            }
            return resUrl;
        }
        catch (error) {
            throw error;
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
};
