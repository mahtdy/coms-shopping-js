"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeywordController = void 0;
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/keyword/repository"));
const method_1 = require("../../decorators/method");
const zod_1 = __importDefault(require("zod"));
const parameters_1 = require("../../decorators/parameters");
const contentRegistry_1 = __importDefault(require("../contentRegistry"));
const repository_2 = __importDefault(require("../repositories/domain/repository"));
const repository_3 = __importDefault(require("../repositories/linkTag/repository"));
class KeywordController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.registry = contentRegistry_1.default.getInstance();
        this.domainRepo = new repository_2.default();
        this.linkTagRepo = new repository_3.default();
    }
    async getById(id) {
        var _a;
        try {
            var document = await this.repository.findOne({ _id: id }, {});
            if (document == null) {
                return {
                    status: 404,
                    message: "یافت نشد"
                };
            }
            const pageRepo = (_a = this.registry.getRegistry(document.pageType)) === null || _a === void 0 ? void 0 : _a.repo;
            if (pageRepo != undefined) {
                const page = await pageRepo.findOne({
                    _id: document.page
                }, {}, [
                    {
                        path: "categories"
                    }
                ]);
                if (page != null) {
                    let language = await this.domainRepo.languageRepo.findById(page.language);
                    if (language == null) {
                        return null;
                    }
                    let domain = language.domain != undefined ? await this.domainRepo.findById(language.domain) : await this.domainRepo.findOne({
                        isDefault: true
                    });
                    if (domain != null) {
                        page.seo["url"] = domain.sslType != "none" ? `https://${domain.domain}${page === null || page === void 0 ? void 0 : page.seo["url"]}` : `http://${domain.domain}${page === null || page === void 0 ? void 0 : page.seo["url"]}`;
                    }
                }
                document = JSON.parse(JSON.stringify(document));
                document["page"] = page;
            }
            return {
                status: 200,
                data: document,
                message: " عملیات موفق"
            };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async getKeywordByText(text) {
        try {
            const keyword = await this.repository.findOne({
                text: {
                    $eq: text
                }
            });
            if (keyword == null) {
                return {
                    status: 404
                };
            }
            let data = await this.repository.getKeywordPosition(keyword._id, new Date(Date.now() - (1000 * 60 * 60 * 24)));
            let summray = await this.repository.getKeywordSummray(keyword._id, "3m");
            data["summray"] = summray;
            return {
                status: 200,
                data: Object.assign(data, keyword)
            };
        }
        catch (error) {
            throw error;
        }
    }
    async changeKeyword(id, pageType, pageId, admin) {
        try {
            await this.repository.changeKeywords(id, admin._id, pageType, pageId);
            return {
                status: 200,
                data: {}
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getKeywordChart(id, dateRange) {
        try {
            const data = await this.repository.getKeywordChart(id, dateRange);
            return {
                status: 200,
                data
            };
        }
        catch (error) {
            throw error;
        }
        return {};
    }
    async getSummary(id, dateRange) {
        try {
            const data = await this.repository.getKeywordSummray(id, dateRange);
            return {
                status: 200,
                data
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getPosition(id) {
        try {
            const data = await this.repository.getKeywordPosition(id, new Date(Date.now() - (1000 * 60 * 60 * 24)));
            return {
                status: 200,
                data
            };
        }
        catch (error) {
            throw error;
        }
    }
    async actiavateLink(id, part, subPartId, index) {
        try {
            await this.repository.actiavateLink(id, part, this.registry, subPartId, index);
        }
        catch (error) {
            throw error;
        }
        return {
            status: 200
        };
    }
    async deactivateLink(id, part, subPartId, index) {
        try {
            await this.repository.deactivateLink(id, part, this.registry, subPartId, index);
        }
        catch (error) {
            throw error;
        }
        return {
            status: 200
        };
    }
    async rejectLink(id, part, subPartId) {
        try {
            await this.repository.rejectLink(id, part, this.registry, subPartId);
        }
        catch (error) {
            throw error;
        }
        return {
            status: 200
        };
    }
    async getLinks(keyword, page, limit) {
        var _a;
        try {
            let data = await this.repository.keywordTaskRepo.linkMapRepo.paginate({
                keyword
            }, limit, page);
            for (let i = 0; i < data.list.length; i++) {
                const pageRepo = (_a = this.registry.getRegistry(data.list[i].fromType)) === null || _a === void 0 ? void 0 : _a.repo;
                if (pageRepo != undefined) {
                    const page = await pageRepo.findOne({
                        _id: data.list[i].from
                    }, {}, [
                        {
                            path: "categories"
                        }
                    ]);
                    if (page != null) {
                        let language = await this.domainRepo.languageRepo.findById(page.language);
                        if (language == null) {
                            // return null
                            continue;
                        }
                        let domain = language.domain != undefined ? await this.domainRepo.findById(language.domain) : await this.domainRepo.findOne({
                            isDefault: true
                        });
                        if (domain != null) {
                            page.seo["url"] = domain.sslType != "none" ? `https://${domain.domain}${page === null || page === void 0 ? void 0 : page.seo["url"]}` : `http://${domain.domain}${page === null || page === void 0 ? void 0 : page.seo["url"]}`;
                        }
                        data.list[i].from = {
                            title: page.title,
                            seo: {
                                url: page.seo["url"]
                            },
                            categories: page.categories
                        };
                    }
                }
            }
            return {
                status: 200,
                data
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getLinksWithDetails(keyword, page, limit, filter) {
        var _a;
        try {
            let data = await this.repository.keywordTaskRepo.linkMapRepo.paginate({
                keyword
            }, limit, page, {
                population: [{
                        path: "keyword"
                    }, {
                        path: "to"
                    }]
            });
            for (let i = 0; i < data.list.length; i++) {
                const pageRepo = (_a = this.registry.getRegistry(data.list[i].fromType)) === null || _a === void 0 ? void 0 : _a.repo;
                if (pageRepo != undefined) {
                    const page = await pageRepo.findOne({
                        _id: data.list[i].from
                    }, {}, [
                        {
                            path: "category"
                        }
                    ]);
                    if (page != null) {
                        let language = await this.domainRepo.languageRepo.findById(page.language);
                        if (language == null) {
                            // return null
                            continue;
                        }
                        let domain = language.domain != undefined ? await this.domainRepo.findById(language.domain) : await this.domainRepo.findOne({
                            isDefault: true
                        });
                        if (domain != null) {
                            page.seo["url"] = domain.sslType != "none" ? `https://${domain.domain}${page === null || page === void 0 ? void 0 : page.seo["url"]}` : `http://${domain.domain}${page === null || page === void 0 ? void 0 : page.seo["url"]}`;
                        }
                        data.list[i].from = page;
                        let contentLinks = [];
                        for (let j = 0; j < data.list[i].contentLinks.length; j++) {
                            data.list[i].contentLinks[j]["content"] = await pageRepo.findSubContent(page, data.list[i].contentLinks[j].subPartId);
                            if (filter == "all" && data.list[i].contentLinks[j].isRejected != true) {
                                contentLinks.push(data.list[i].contentLinks[j]);
                            }
                            else if (filter == "notProccessed" && data.list[i].contentLinks[j].isProccessed != true) {
                                contentLinks.push(data.list[i].contentLinks[j]);
                            }
                            else if (filter == "rejected" && data.list[i].contentLinks[j].isRejected == true) {
                                contentLinks.push(data.list[i].contentLinks[j]);
                            }
                        }
                        data.list[i].contentLinks = contentLinks;
                    }
                }
            }
            return {
                status: 200,
                data
            };
        }
        catch (error) {
            throw error;
        }
    }
    initApis() {
        this.addRouteWithMeta("", "post", this.create.bind(this), {
            "1": {
                index: 0,
                source: "body",
                schema: this.insertSchema
            }
        });
        this.addRouteWithMeta("s", "get", this.search.bind(this), controller_1.default.searcheMeta);
    }
}
exports.KeywordController = KeywordController;
__decorate([
    (0, method_1.Get)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    }))
], KeywordController.prototype, "getById", null);
__decorate([
    (0, method_1.Get)("/by-text"),
    __param(0, (0, parameters_1.Query)({
        destination: "text",
        schema: zod_1.default.string()
    }))
], KeywordController.prototype, "getKeywordByText", null);
__decorate([
    (0, method_1.Put)(""),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "pageType",
        schema: zod_1.default.string()
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "pageId",
        schema: controller_1.default.id
    })),
    __param(3, (0, parameters_1.Admin)())
], KeywordController.prototype, "changeKeyword", null);
__decorate([
    (0, method_1.Get)("/chart"),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "dateRange",
        schema: zod_1.default.enum(["1m", "3m", "6m", "1y"])
    }))
], KeywordController.prototype, "getKeywordChart", null);
__decorate([
    (0, method_1.Get)("/summary"),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "dateRange",
        schema: zod_1.default.enum(["1m", "3m", "6m", "1y"])
    }))
], KeywordController.prototype, "getSummary", null);
__decorate([
    (0, method_1.Get)("/position"),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    }))
], KeywordController.prototype, "getPosition", null);
__decorate([
    (0, method_1.Post)("/link/activate"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "part",
        schema: zod_1.default.enum(["content", "summary", "faq", "comment"])
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "subPartId",
        schema: controller_1.default.id.optional()
    })),
    __param(3, (0, parameters_1.Body)({
        destination: "index",
        schema: zod_1.default.coerce.number().int().min(0).optional()
    }))
], KeywordController.prototype, "actiavateLink", null);
__decorate([
    (0, method_1.Post)("/link/deactivate"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "part",
        schema: zod_1.default.enum(["content", "summary", "faq", "comment"])
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "subPartId",
        schema: controller_1.default.id.optional()
    })),
    __param(3, (0, parameters_1.Body)({
        destination: "index",
        schema: zod_1.default.coerce.number().int().min(0).optional()
    }))
], KeywordController.prototype, "deactivateLink", null);
__decorate([
    (0, method_1.Post)("/link/reject"),
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "part",
        schema: zod_1.default.enum(["content", "summary", "faq", "comment"])
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "subPartId",
        schema: controller_1.default.id.optional()
    }))
], KeywordController.prototype, "rejectLink", null);
__decorate([
    (0, method_1.Get)("/links"),
    __param(0, (0, parameters_1.Query)({
        destination: "keywordId",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "page",
        schema: controller_1.default.page
    })),
    __param(2, (0, parameters_1.Query)({
        destination: "limit",
        schema: controller_1.default.limit
    }))
], KeywordController.prototype, "getLinks", null);
__decorate([
    (0, method_1.Get)("/links/with-detail"),
    __param(0, (0, parameters_1.Query)({
        destination: "keywordId",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "page",
        schema: controller_1.default.page
    })),
    __param(2, (0, parameters_1.Query)({
        destination: "limit",
        schema: controller_1.default.limit
    })),
    __param(3, (0, parameters_1.Query)({
        destination: "filter",
        schema: zod_1.default.enum(["rejected", "notProccessed", "all"])
    }))
], KeywordController.prototype, "getLinksWithDetails", null);
const keyword = new KeywordController("/keyword", new repository_1.default({
    population: [{
            path: "page",
            select: ["title", "contentType", "type"]
        }]
}), {
    insertSchema: zod_1.default.object({
        text: zod_1.default.string(),
        pirority: zod_1.default.coerce.number().int().min(1).max(10),
        page: controller_1.default.id,
        pageType: zod_1.default.string()
    }),
    population: [{
            path: "page",
            select: ["title"]
        }]
});
exports.default = keyword;
