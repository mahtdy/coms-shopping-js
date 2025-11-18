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
exports.DomainImageController = void 0;
const zod_1 = require("zod");
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/domainImageConfig/repository"));
const method_1 = require("../../decorators/method");
const parameters_1 = require("../../decorators/parameters");
const repository_2 = __importDefault(require("../repositories/domain/repository"));
const repository_3 = __importDefault(require("../repositories/language/repository"));
class DomainImageController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.domainRepo = new repository_2.default();
        this.languageRepo = new repository_3.default();
    }
    async updateDomainImageConfig(id, data) {
        try {
            return await this.editById(id, {
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
            "valid-Suffix": [],
            "image-result-Suffixs": [],
            "nonConvert-Suffixs": [],
            "image-addressing": "",
            "convert-main": false,
            "compress-main": false,
            "make-phone-image": true,
            "phone-width": 300,
            "compress-quality": 80,
            "watermark-main": false,
            "main-watermark-config": "",
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
exports.DomainImageController = DomainImageController;
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
                path: zod_1.z.string()
            }),
            "valid-Suffix": zod_1.z.array(zod_1.z.string()),
            "image-result-Suffixs": zod_1.z.array(zod_1.z.string()),
            "nonConvert-Suffixs": zod_1.z.array(zod_1.z.string()),
            "image-addressing": zod_1.z.string(),
            "convert-main": zod_1.z.boolean(),
            "compress-main": zod_1.z.boolean(),
            "compress-quality": zod_1.z.coerce.number().int().min(0).max(100),
            "make-phone-image": zod_1.z.boolean().default(false),
            "phone-width": zod_1.z.coerce.number().int().min(300).max(500),
            "watermark-main": zod_1.z.boolean().default(false),
            "main-watermark-config": zod_1.z.string().optional(),
            watermark: zod_1.z.boolean().default(false),
            "watermark-config": zod_1.z.string().optional()
        }),
    }))
], DomainImageController.prototype, "updateDomainImageConfig", null);
__decorate([
    (0, method_1.Get)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    }))
], DomainImageController.prototype, "getById", null);
const domainImageConfig = new DomainImageController("/domainImageConfig", new repository_1.default({
    population: [{
            source: "domain"
        }]
}), {
    insertSchema: zod_1.z.object({
        "upload-path": zod_1.z.object({
            fileManager: controller_1.default.id,
            path: zod_1.z.string()
        }),
        "valid-Suffix": zod_1.z.array(zod_1.z.string()),
        "image-result-Suffixs": zod_1.z.array(zod_1.z.string()),
        "nonConvert-Suffixs": zod_1.z.array(zod_1.z.string()),
        "image-addressing": zod_1.z.string(),
        "convert-main": zod_1.z.boolean(),
        "compress-main": zod_1.z.boolean(),
        "compress-quality": zod_1.z.coerce.number().int().min(0).max(100).default(80),
        "make-phone-image": zod_1.z.boolean().default(false),
        "phone-width": zod_1.z.coerce.number().int().min(300).max(500).optional(),
        domain: controller_1.default.id,
        "watermark-main": zod_1.z.boolean().default(false),
        "main-watermark-config": zod_1.z.string().optional(),
        "watermark": zod_1.z.boolean().default(false),
        "watermark-config": zod_1.z.string().optional()
    })
});
exports.default = domainImageConfig;
