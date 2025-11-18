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
exports.DomainVideoController = void 0;
const zod_1 = require("zod");
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/domainVideoConfig/repository"));
const method_1 = require("../../decorators/method");
const parameters_1 = require("../../decorators/parameters");
const repository_2 = __importDefault(require("../repositories/domain/repository"));
const repository_3 = __importDefault(require("../repositories/language/repository"));
class DomainVideoController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.domainRepo = new repository_2.default();
        this.languageRepo = new repository_3.default();
    }
    async updateDomainVideoConfig(id, data) {
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
    async getById(id) {
        try {
            return await this.findById(id, {
                population: [{
                        path: "domain"
                    }]
            });
        }
        catch (error) {
            throw error;
        }
    }
    async validateCDN(cdn, domain) {
        try {
            return {
                data: await this.domainRepo.isExists({
                    _id: domain,
                    $or: [{
                            cdns: cdn
                        }, {
                            localCDN: cdn
                        }]
                })
            };
        }
        catch (error) {
            throw error;
        }
    }
    async paginate(page, limit, query, options, ...params) {
        var _a;
        // console.log("paginate")
        let domains = [];
        try {
            let defualtDomain = await this.domainRepo.findOne({ isDefault: true });
            let domainLang = await this.languageRepo.findAll({
                domain: {
                    $exists: true
                }
            });
            domains.push(defualtDomain === null || defualtDomain === void 0 ? void 0 : defualtDomain._id);
            for (let i = 0; i < domainLang.length; i++) {
                domains.push(domainLang[i].domain);
            }
        }
        catch (error) {
            throw error;
        }
        let res = await super.paginate(page, limit, {
            domain: {
                $in: domains
            }
        }, {
            population: [{
                    path: "domain"
                }]
        });
        let data = res.data;
        let notExistsDomains = [];
        try {
            for (let j = 0; j < domains.length; j++) {
                let exists = false;
                for (let i = 0; i < data.list.length; i++) {
                    if (data.list[i].domain != null && ((_a = data.list[i].domain._id) === null || _a === void 0 ? void 0 : _a.toHexString()) == domains[j].toHexString()) {
                        // console.log("domain ", data.list[i].domain._id)
                        exists = true;
                        break;
                    }
                }
                if (!exists) {
                    notExistsDomains.push(domains[j]);
                }
            }
        }
        catch (error) {
            console.log(error);
        }
        let sample = {
            "upload-path": {
                "fileManager": "",
                "path": ""
            },
            "editor-upload-size": {
                "unit": "GB",
                "value": 1
            },
            "download-size": {
                "unit": "GB",
                "value": 1
            },
            "upload-size": {
                "unit": "GB",
                "value": 1
            },
            "save-path": {
                "fileManager": "",
                "path": ""
            },
            "quality-persent": 80,
            "save-paths": [],
            "save-main-source": false,
            "video-result-Suffixs": [],
            "valid-Suffix": [], "save-quality": [],
            "auto-save-quality": false,
            "watermark": false,
            "watermark-config": ""
        };
        let nonexislist = JSON.parse(JSON.stringify(await this.domainRepo.findAll({
            _id: {
                $in: notExistsDomains
            }
        })));
        for (let i = 0; i < nonexislist.length; i++) {
            nonexislist[i] = Object.assign(nonexislist[i], sample);
        }
        res.data["notExistsDomains"] = nonexislist;
        return res;
    }
}
exports.DomainVideoController = DomainVideoController;
__decorate([
    (0, method_1.Put)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            "upload-path": zod_1.z.object({
                fileManager: controller_1.default.id,
                path: zod_1.z.string(),
            }),
            "editor-upload-size": zod_1.z.object({
                unit: zod_1.z.enum(["MB", "GB"]),
                value: zod_1.z.coerce.number().positive()
            }),
            "download-size": zod_1.z.object({
                unit: zod_1.z.enum(["MB", "GB"]),
                value: zod_1.z.coerce.number().positive()
            }),
            "upload-size": zod_1.z.object({
                unit: zod_1.z.enum(["MB", "GB"]),
                value: zod_1.z.coerce.number().positive()
            }),
            "save-path": zod_1.z.object({
                fileManager: controller_1.default.id,
                path: zod_1.z.string(),
            }),
            "quality-persent": zod_1.z.coerce.number().positive(),
            "save-paths": zod_1.z.array(zod_1.z.object({
                fileManager: controller_1.default.id,
                path: zod_1.z.string(),
                quality: zod_1.z.string()
            })),
            "save-main-source": zod_1.z.boolean(),
            "video-result-Suffixs": zod_1.z.array(zod_1.z.string()),
            "valid-Suffix": zod_1.z.array(zod_1.z.string()),
            "save-quality": zod_1.z.array(zod_1.z.string()),
            "auto-save-quality": zod_1.z.boolean(),
            "watermark": zod_1.z.boolean().default(false),
            "watermark-config": zod_1.z.string().optional()
        }),
    }))
], DomainVideoController.prototype, "updateDomainVideoConfig", null);
__decorate([
    (0, method_1.Get)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    }))
], DomainVideoController.prototype, "getById", null);
__decorate([
    (0, method_1.Get)("/validate/cdn"),
    __param(0, (0, parameters_1.Query)({
        destination: "cdn",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "domain",
        schema: zod_1.z.string()
    }))
], DomainVideoController.prototype, "validateCDN", null);
const domainVideoConfig = new DomainVideoController("/domainVideoConfig", new repository_1.default({
    population: [{
            source: "domain"
        }]
}), {
    insertSchema: zod_1.z.object({
        "upload-path": zod_1.z.object({
            fileManager: controller_1.default.id,
            path: zod_1.z.string(),
        }),
        "editor-upload-size": zod_1.z.object({
            unit: zod_1.z.enum(["MB", "GB"]),
            value: zod_1.z.coerce.number().positive()
        }),
        "download-size": zod_1.z.object({
            unit: zod_1.z.enum(["MB", "GB"]),
            value: zod_1.z.coerce.number().positive()
        }),
        "upload-size": zod_1.z.object({
            unit: zod_1.z.enum(["MB", "GB"]),
            value: zod_1.z.coerce.number().positive()
        }),
        "save-path": zod_1.z.object({
            fileManager: controller_1.default.id,
            path: zod_1.z.string(),
        }),
        "quality-persent": zod_1.z.coerce.number().positive(),
        "save-paths": zod_1.z.array(zod_1.z.object({
            fileManager: controller_1.default.id,
            path: zod_1.z.string(),
            quality: zod_1.z.string()
        })),
        "save-main-source": zod_1.z.boolean(),
        "video-result-Suffixs": zod_1.z.array(zod_1.z.string()),
        "valid-Suffix": zod_1.z.array(zod_1.z.string()),
        "save-quality": zod_1.z.array(zod_1.z.string()),
        "auto-save-quality": zod_1.z.boolean(),
        "watermark": zod_1.z.boolean().default(false),
        "watermark-config": zod_1.z.string().optional(),
        domain: controller_1.default.id
    })
});
exports.default = domainVideoConfig;
