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
exports.LanguageCommentConfigController = void 0;
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/languageComment/repository"));
const zod_1 = __importDefault(require("zod"));
const method_1 = require("../../decorators/method");
const parameters_1 = require("../../decorators/parameters");
const repository_2 = __importDefault(require("../repositories/language/repository"));
const repository_3 = __importDefault(require("../repositories/domain/repository"));
class LanguageCommentConfigController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.languageRepo = new repository_2.default();
        this.domainRepo = new repository_3.default();
    }
    async updateLanguageCommentConfig(id, data) {
        try {
            return await this.editOne({
                _id: id
            }, {
                $set: {
                    ...data
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async findById(id, queryInfo) {
        return super.findOne({
            _id: id
        }, {
            population: [{
                    path: "language"
                }]
        });
    }
    async getLanguageDomain(language) {
        try {
            let lang = await this.languageRepo.findById(language);
            if (lang == null) {
                return {
                    status: 404
                };
            }
            if (lang.domain) {
                return {
                    data: await this.domainRepo.findById(lang.domain)
                };
            }
            return {
                data: await this.domainRepo.findOne({
                    isDefault: true
                })
            };
        }
        catch (error) {
            throw error;
        }
    }
    async checkLanguageDomain(language) {
        try {
            let lang = await this.languageRepo.findById(language);
            if (lang == null) {
                return {
                    status: 404
                };
            }
            let domain;
            if (lang.domain) {
                domain = await this.domainRepo.findById(lang.domain);
            }
            else {
                domain = await this.domainRepo.findOne({
                    isDefault: true
                });
            }
            return {
                data: (domain === null || domain === void 0 ? void 0 : domain.cptchaInfo) != undefined
            };
        }
        catch (error) {
            throw error;
        }
    }
    async paginate(page, limit = 100, query, options, ...params) {
        var _a;
        // console.log("paginate")
        // let domains = []
        let langIds = [];
        try {
            let langs = await this.languageRepo.findAll({
                status: true
            });
            for (let i = 0; i < langs.length; i++) {
                langIds.push(langs[i]._id);
            }
        }
        catch (error) {
            throw error;
        }
        let res = await super.paginate(page, limit, {
            language: {
                $in: langIds
            }
        }, {
            population: [{
                    path: "language"
                }]
        });
        let data = res.data;
        let notExistsLangs = [];
        try {
            for (let j = 0; j < langIds.length; j++) {
                let exists = false;
                for (let i = 0; i < data.list.length; i++) {
                    if (data.list[i].language != null && ((_a = data.list[i].language._id) === null || _a === void 0 ? void 0 : _a.toHexString()) == langIds[j].toHexString()) {
                        // console.log("domain ", data.list[i].domain._id)
                        exists = true;
                        break;
                    }
                }
                if (!exists) {
                    notExistsLangs.push(langIds[j]);
                }
            }
        }
        catch (error) {
            console.log(error);
        }
        let sample = {
            "ungegistered-user-comment": true,
            "min-comment-delay": 1,
            "min-comment-delay-unit": "minute",
            "max-comment-character": 1,
            "max-comment-show-limit": 1,
            "template": "string",
            "captcha": true,
            "captcha-type": "system",
            "comment-reply": true,
            "comment-rate": true,
            "comment-submit-without-confirm": true,
            "comment-show-sort": "oldest",
            "comment-policy": "string",
            "validate-phone": true,
            "show-auto-signup": true,
            "email": true,
            "atach": true,
            "allowd-file-types": [],
            "atach-size": 50,
            "atach-size-unit": "KB",
            "atach-count": 2,
            "upload-path": {
                fileManager: "08f1af38fcd0df71852f15af",
                path: "test/"
            },
            "like-type": "like",
            "editor": true,
            "external-link-type": "nofollow",
            "editor-upload-types": [],
            "editor-upload-unit": "KB",
            "editor-upload-size": 500,
            "editor-upload-path": {
                fileManager: "08f1af38fcd0df71852f15af",
                path: "test/"
            },
            "image-width": 350
        };
        let nonexislist = JSON.parse(JSON.stringify(await this.languageRepo.findAll({
            _id: {
                $in: notExistsLangs
            }
        })));
        for (let i = 0; i < nonexislist.length; i++) {
            nonexislist[i] = Object.assign(nonexislist[i], sample);
        }
        res.data["notExistsDomains"] = nonexislist;
        return res;
    }
}
exports.LanguageCommentConfigController = LanguageCommentConfigController;
__decorate([
    (0, method_1.Put)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        schema: zod_1.default.object({
            "ungegistered-user-comment": zod_1.default.boolean(),
            "min-comment-delay": zod_1.default.coerce.number().int().positive(),
            "min-comment-delay-unit": zod_1.default.enum(["minute", "second", "hour"]),
            "max-comment-character": zod_1.default.coerce.number().int().positive(),
            "max-comment-show-limit": zod_1.default.coerce.number().int().positive(),
            "template": zod_1.default.string(),
            "captcha": zod_1.default.boolean(),
            // captchaInfo: 
            "captcha-type": zod_1.default.enum(["google", "cload", "system"]),
            "comment-reply": zod_1.default.boolean(),
            "comment-rate": zod_1.default.boolean(),
            "comment-submit-without-confirm": zod_1.default.boolean(),
            "comment-show-sort": zod_1.default.enum(["oldest", "latest"]),
            "comment-policy": zod_1.default.string(),
            "validate-phone": zod_1.default.boolean().optional(),
            "show-auto-signup": zod_1.default.boolean().optional(),
            "email": zod_1.default.boolean().optional(),
            "atach": zod_1.default.boolean().optional(),
            "allowd-file-types": zod_1.default.array(zod_1.default.string()).default([]),
            "atach-size": zod_1.default.coerce.number().positive().optional(),
            "atach-size-unit": zod_1.default.enum(["MB", "KB"]).optional(),
            "atach-count": zod_1.default.coerce.number().positive().optional(),
            "upload-path": zod_1.default.object({
                fileManager: controller_1.default.id,
                path: zod_1.default.string()
            }).optional(),
            "like-type": zod_1.default.enum(["like-dislike", "like"]).default("like"),
            //editor
            "editor": zod_1.default.boolean().optional(),
            "external-link-type": zod_1.default.enum(["follow", "nofollow"]).optional(),
            "editor-upload-path": zod_1.default.object({
                fileManager: controller_1.default.id,
                path: zod_1.default.string()
            }).optional(),
            "editor-upload-types": zod_1.default.array(zod_1.default.string()).optional(),
            "editor-upload-size": zod_1.default.coerce.number().int().positive(),
            "editor-upload-unit": zod_1.default.enum(["MB", "KB"]).optional(),
            "image-width": zod_1.default.coerce.number().int().min(300).max(500).optional()
        }),
    }))
], LanguageCommentConfigController.prototype, "updateLanguageCommentConfig", null);
__decorate([
    (0, method_1.Get)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    }))
], LanguageCommentConfigController.prototype, "findById", null);
__decorate([
    (0, method_1.Get)("/domain"),
    __param(0, (0, parameters_1.Query)({
        destination: "language",
        schema: controller_1.default.id
    }))
], LanguageCommentConfigController.prototype, "getLanguageDomain", null);
__decorate([
    (0, method_1.Get)("/domain/check"),
    __param(0, (0, parameters_1.Query)({
        destination: "language",
        schema: controller_1.default.id
    }))
], LanguageCommentConfigController.prototype, "checkLanguageDomain", null);
const languageComment = new LanguageCommentConfigController("/languageCommentConfig", new repository_1.default(), {
    population: [{
            path: "language"
        }],
    insertSchema: zod_1.default.object({
        "ungegistered-user-comment": zod_1.default.boolean(),
        "min-comment-delay": zod_1.default.coerce.number().int().positive(),
        "min-comment-delay-unit": zod_1.default.enum(["minute", "second", "hour"]),
        "max-comment-character": zod_1.default.coerce.number().int().positive(),
        "max-comment-show-limit": zod_1.default.coerce.number().int().positive(),
        "template": zod_1.default.string(),
        "captcha": zod_1.default.boolean(),
        "captcha-type": zod_1.default.enum(["google", "cload", "system"]),
        "comment-reply": zod_1.default.boolean(),
        "comment-rate": zod_1.default.boolean(),
        "comment-submit-without-confirm": zod_1.default.boolean(),
        "comment-show-sort": zod_1.default.enum(["oldest", "latest"]),
        "comment-policy": zod_1.default.string(),
        language: controller_1.default.id,
        "validate-phone": zod_1.default.boolean().optional(),
        "show-auto-signup": zod_1.default.boolean().optional(),
        "email": zod_1.default.boolean().optional(),
        "atach": zod_1.default.boolean().optional(),
        "allowd-file-types": zod_1.default.array(zod_1.default.string()).default([]),
        "atach-size": zod_1.default.coerce.number().positive().optional(),
        "atach-size-unit": zod_1.default.enum(["MB", "KB"]).optional(),
        "atach-count": zod_1.default.coerce.number().positive().optional(),
        "upload-path": zod_1.default.object({
            fileManager: controller_1.default.id,
            path: zod_1.default.string()
        }).optional(),
        "like-type": zod_1.default.enum(["like-dislike", "like"]).default("like"),
        //editor
        "editor": zod_1.default.boolean().optional(),
        "external-link-type": zod_1.default.enum(["follow", "nofollow"]).optional(),
        "editor-upload-path": zod_1.default.object({
            fileManager: controller_1.default.id,
            path: zod_1.default.string()
        }).optional(),
        "editor-upload-types": zod_1.default.array(zod_1.default.string()).optional(),
        "editor-upload-size": zod_1.default.coerce.number().int().positive(),
        "editor-upload-unit": zod_1.default.enum(["MB", "KB"]).optional(),
        "image-width": zod_1.default.coerce.number().int().min(300).max(500).optional()
    })
});
languageComment.loginRequired = true;
exports.default = languageComment;
