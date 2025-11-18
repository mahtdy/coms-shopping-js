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
exports.basePageZod = exports.contentZod = exports.seoSchema = exports.BasePageController = void 0;
const controller_1 = __importDefault(require("../controller"));
const parameters_1 = require("../../decorators/parameters");
const zod_1 = require("zod");
const method_1 = require("../../decorators/method");
const smsMessager_1 = __importDefault(require("../../messaging/smsMessager"));
const emailMessager_1 = __importDefault(require("../../messaging/emailMessager"));
const repository_1 = __importDefault(require("../repositories/system/repository"));
const confRepo = new repository_1.default();
class BasePageController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.adminRepo = options.adminRepo;
    }
    create(data, admin) {
        data.author = admin === null || admin === void 0 ? void 0 : admin._id;
        return super.create(data);
    }
    async publish(data, id, update, admin) {
        try {
            data.isDraft = false;
            var draft = await this.repository.findOne({
                author: admin._id,
                _id: id
            });
            if (draft == null) {
                if (data.author == undefined)
                    data.author = admin._id;
                // console.log("insert f")
                draft = await this.repository.insert(data);
                return {
                    status: 200,
                    data: draft
                };
            }
            else {
                data.author = draft.author;
                return {
                    status: 200,
                    data: await this.repository.replace({
                        _id: draft === null || draft === void 0 ? void 0 : draft._id
                    }, data)
                };
            }
        }
        catch (error) {
            throw error;
        }
    }
    async sendPublishConfirmation(admin, doc) {
        try {
            // send SMS
            if (await confRepo.getConfigValue("send-publish-confirmation-sms")) {
                smsMessager_1.default.send({
                    parameters: {
                        title: doc.title
                    },
                    receptor: admin.phoneNumber,
                    template: "publishConfirmation"
                });
            }
            // send Email
            if (await confRepo.getConfigValue("send-publish-confirmation-email")) {
                emailMessager_1.default.send({
                    parameters: {
                        title: doc.title
                    },
                    receptor: admin.email,
                    template: "publishConfirmation"
                });
            }
        }
        catch (error) {
            // console.log(error.message)
        }
    }
    async publishRequest(doc, admin, id) {
        var _a, _b, _c, _d;
        try {
            let data = await ((_a = this.adminRepo) === null || _a === void 0 ? void 0 : _a.getPermissionModuleAction("content", admin._id));
            if (((_b = data === null || data === void 0 ? void 0 : data.config['publisher']) === null || _b === void 0 ? void 0 : _b.value) != undefined) {
                doc.isPublished = false;
                doc.publisher = data === null || data === void 0 ? void 0 : data.config['publisher'].value;
                delete doc.publishDate;
                let publisher = await ((_c = this.adminRepo) === null || _c === void 0 ? void 0 : _c.findById((_d = data === null || data === void 0 ? void 0 : data.config['publisher']) === null || _d === void 0 ? void 0 : _d.value));
                if (publisher == null) {
                    return {
                        status: 400,
                        message: "انتشار دهنده یافت نشد"
                    };
                }
                if (id == undefined) {
                    var res = await this.create(doc, admin);
                }
                else {
                    var res = await this.replaceOne({
                        _id: id
                    }, doc, { ok: true });
                }
                await this.sendPublishConfirmation(publisher, doc);
                return res;
            }
            else {
                return {
                    status: 400,
                    message: "انتشار دهنده یافت نشد"
                };
            }
        }
        catch (error) {
            throw error;
        }
    }
    async publishConfirm(doc, admin, id) {
        try {
            let docs = await this.repository.findById(id);
            if ((docs === null || docs === void 0 ? void 0 : docs.publisher) != admin._id) {
                return {
                    status: 403,
                    data: {}
                };
            }
            doc.author = docs.author;
            return this.publish(doc, id, false, admin);
        }
        catch (error) {
            throw error;
        }
    }
    async addDraft(data, admin, id) {
        if (data.category == "") {
            delete data.category;
        }
        try {
            data.isDraft = true;
            data.author = admin._id;
            if (id != undefined) {
                var draft = await this.repository.findOne({
                    // isDraft: true,
                    author: admin._id,
                    _id: id
                });
            }
            else {
                draft = null;
            }
            if (draft != null) {
                await this.repository.replace({
                    _id: draft._id
                }, data);
                draft = await this.repository.findById(draft._id);
            }
            else {
                // console.log("insert d")
                draft = await this.repository.insert(data);
                // ftp.
            }
            return {
                status: 200,
                data: draft,
                message: " عملیات موفق"
            };
        }
        catch (error) {
            throw error;
        }
    }
    async isUrlExists(url, isStatic, category, language, id) {
        // isStatic = isStatic as any != "false"
        try {
            return {
                status: 200,
                data: await this.repository.isUrlExists(url, isStatic, {
                    category,
                    language
                }, id)
            };
        }
        catch (error) {
            throw error;
        }
    }
    // @Get("/draft")
    async getDraft(id, admin) {
        try {
            return this.findOne({
                isDraft: true,
                author: admin._id,
                _id: id
            });
        }
        catch (error) {
            throw error;
        }
    }
    // @Get("/drafts")
    async getDrafts(page, limit, admin) {
        return this.adminPaginate(page, limit, admin, {
            author: admin._id,
            isDraft: true
        });
    }
    async getURL(url, isStatic, language, category) {
        try {
            let domain = await this.repository.domainRepo.findOne({
                isDefault: true
            });
            let link = await this.repository.getURL(url, isStatic, language, category);
            if (link.startsWith("/")) {
                link = (domain === null || domain === void 0 ? void 0 : domain.domain) + link;
            }
            return {
                status: 200,
                data: link
            };
        }
        catch (error) {
            throw error;
        }
    }
    // @Get("/content/video")
    // async add
    async getPermissionData(admin) {
        var _a, _b;
        try {
            var isSuper = await ((_a = this.adminRepo) === null || _a === void 0 ? void 0 : _a.isExists({
                isSuperAdmin: true,
                _id: admin
            }));
            if (isSuper)
                return {
                    isSuperAdmin: true
                };
            return {
                permission: await ((_b = this.adminRepo) === null || _b === void 0 ? void 0 : _b.getPermissionModuleAction(this.subPart || "", admin))
            };
        }
        catch (error) {
            throw error;
        }
    }
    initApis() {
        super.initApis();
        this.addRouteWithMeta("/publish/request", "post", this.publishRequest.bind(this), {
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
                schema: controller_1.default.id.optional(),
            },
        });
        this.addRouteWithMeta("/publish/confirm", "post", this.publishConfirm.bind(this), {
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
                schema: controller_1.default.id,
            },
        });
        this.addRoute("/drafts", "get", this.getDrafts.bind(this));
        this.addRoute("/draft", "get", this.getDraft.bind(this));
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
                schema: controller_1.default.id.optional()
            }
        });
        this.addRouteWithMeta("/seo/url/exists", "get", this.isUrlExists.bind(this), {
            "1": {
                index: 0,
                source: "query",
                destination: "url",
                schema: zod_1.z.string()
            },
            "2": {
                index: 1,
                source: "query",
                destination: "isStatic",
                schema: controller_1.default.booleanFromquery
            },
            "3": {
                index: 2,
                source: "query",
                destination: "category",
                schema: controller_1.default.id.optional()
            },
            "4": {
                index: 3,
                source: "query",
                destination: "language",
                schema: controller_1.default.id.optional()
            },
            "5": {
                index: 4,
                source: "query",
                destination: "id",
                schema: controller_1.default.id.optional()
            }
        });
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
                schema: controller_1.default.id.optional()
            },
            "2": {
                index: 2,
                source: "query",
                destination: "update",
                schema: controller_1.default.booleanFromquery.optional()
            },
            "3": {
                index: 3,
                source: "admin"
            },
        });
        this.addRouteWithMeta("/url", "get", this.getURL.bind(this), {
            "0": {
                index: 0,
                destination: "url",
                schema: zod_1.z.string(),
                source: "query"
            },
            "1": {
                index: 1,
                destination: "isStatic",
                schema: controller_1.default.booleanFromquery.default("false"),
                source: "query"
            },
            "2": {
                index: 2,
                destination: "language",
                schema: controller_1.default.id,
                source: "query"
            },
            "3": {
                index: 3,
                destination: "category",
                schema: controller_1.default.id.optional(),
                source: "query"
            }
        });
    }
}
exports.BasePageController = BasePageController;
__decorate([
    __param(1, (0, parameters_1.Admin)())
], BasePageController.prototype, "create", null);
__decorate([
    __param(3, (0, parameters_1.Admin)())
], BasePageController.prototype, "publish", null);
__decorate([
    (0, method_1.Get)("/seo/url/exists")
], BasePageController.prototype, "isUrlExists", null);
__decorate([
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Admin)())
], BasePageController.prototype, "getDraft", null);
__decorate([
    __param(0, (0, parameters_1.Query)({
        destination: "page",
        schema: controller_1.default.page
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "limit",
        schema: controller_1.default.limit
    })),
    __param(2, (0, parameters_1.Admin)())
], BasePageController.prototype, "getDrafts", null);
var querySchema = zod_1.z.object({
    sourceType: zod_1.z.enum(["direct", "indirect"]),
    source: zod_1.z.string().optional(),
    sourceKey: zod_1.z.string().optional(),
    sortKey: zod_1.z.string().optional(),
    havelimit: zod_1.z.boolean().optional(),
    // getData?: Function,
    key: zod_1.z.string(),
    sourceQueryOpration: zod_1.z.enum(["$eq", "$reg", "$in", "$gt", "$lt"]).optional(),
    queryOpration: zod_1.z.enum(["$eq", "$reg", "$in", "$gt", "$lt"])
});
exports.seoSchema = zod_1.z.object({
    "url": zod_1.z.string(),
    "id": zod_1.z.any(),
    "mainKeyWord": zod_1.z.string(),
    "keyWords": zod_1.z.array(zod_1.z.string()).default([]),
    "seoAnkertexts": zod_1.z.array(zod_1.z.string()).default([]),
    "canoncialAddress": zod_1.z.string().optional(),
    "oldAddress": zod_1.z.string().optional(),
    "isStatic": zod_1.z.boolean().default(false),
    "seoTitle": zod_1.z.string(),
    "metaDescription": zod_1.z.string(),
    "redirectList": zod_1.z.array(zod_1.z.object({
        "target": zod_1.z.string(),
        "type": zod_1.z.enum(["301", "302", "303", "304", "307", "308"])
    })).optional(),
    "articleType": zod_1.z.enum(["content", "blog", "new"]).optional(),
    "categoryLable": zod_1.z.string().optional(),
    questionOppened: zod_1.z.enum(["yes", "no", "private"]).default("yes"),
    "redirecturl": zod_1.z.string().optional(),
    "redirect_status": zod_1.z.string().optional(),
    changefreq: zod_1.z.enum(["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"]).default("weekly"),
    priority: zod_1.z.number().min(0.0).max(1.0).default(0.5)
});
exports.contentZod = zod_1.z.object({
    status: zod_1.z.boolean(),
    type: zod_1.z.string(),
    content: zod_1.z.string().optional(),
    title: zod_1.z.string().optional(),
    publishAt: zod_1.z.coerce.date().optional(),
    cycle: controller_1.default.id.optional(),
    locked: zod_1.z.boolean().optional(),
    comments: zod_1.z.array(zod_1.z.object({
        text: zod_1.z.string(),
        admin: zod_1.z.any(),
        date: zod_1.z.coerce.date(),
        reply: controller_1.default.id.optional()
    })).optional(),
    _id: controller_1.default.id.optional()
});
exports.basePageZod = zod_1.z.object({
    commonQuestions: zod_1.z.array(zod_1.z.object({
        question: zod_1.z.string(),
        answer: zod_1.z.string(),
        publishAt: zod_1.z.coerce.date().optional(),
        cycle: controller_1.default.id.optional(),
    })),
    // comments: z.array(fakeCommentZod).optional(),
    fileUses: zod_1.z.array(zod_1.z.string()),
    commentStatus: zod_1.z.boolean(),
    commentImportant: zod_1.z.boolean(),
    category: controller_1.default.id.optional(),
    categories: zod_1.z.array(controller_1.default.id),
    ancestors: zod_1.z.array(controller_1.default.id).optional(),
    language: controller_1.default.id.optional(),
    isDraft: zod_1.z.boolean(),
    publishDate: zod_1.z.coerce.date().optional(),
    isPublished: zod_1.z.boolean().default(false),
    viewMode: zod_1.z.enum(["public", "forUsers", "private"]),
    viewCategory: controller_1.default.id.optional(),
    seo: exports.seoSchema,
    social: zod_1.z.array(zod_1.z.object({
        "socialName": zod_1.z.enum(["twitter", "facebook"]),
        "title": zod_1.z.string(),
        "description": zod_1.z.string(),
        "image": zod_1.z.string()
    })).optional(),
    videos: zod_1.z.array(controller_1.default.id).optional(),
    video: controller_1.default.id.optional(),
    Refrences: zod_1.z.array(zod_1.z.object({
        title: zod_1.z.string(),
        url: zod_1.z.string().url()
    })).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    contentNumber: zod_1.z.coerce.number().int().positive().optional(),
    contentLanguages: zod_1.z.array(zod_1.z.object({
        content: controller_1.default.id,
        language: controller_1.default.id
    })).default([]),
    content: zod_1.z.string().default("string"),
    contents: zod_1.z.array(exports.contentZod).optional()
});
