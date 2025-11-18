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
const imageProccessing_1 = __importDefault(require("../../services/imageProccessing"));
const fileManager_1 = require("../../services/fileManager");
const random_1 = __importDefault(require("../../random"));
class DomainImageController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.domainRepo = new repository_2.default();
        this.languageRepo = new repository_3.default();
    }
    async updateDomainImageConfig(id, data) {
        try {
            // return await this.editById(id, {
            //     $set: {
            //         ...data
            //     }
            // })
            let result = await this.repository.updateOne({
                _id: id
            }, {
                $set: data
            });
            // console.log("result", result.modifiedCount)
            if (result.modifiedCount != 0) {
                let result = await this.repository.updateOne({
                    _id: id
                }, {
                    $set: {
                        lastUpdate: new Date()
                    }
                });
            }
        }
        catch (error) {
            throw error;
        }
        return {
            status: 200
        };
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
            "valid-Suffix": ["jpg", "png", "webp", "jpeg"],
            "image-result-Suffixs": ["webp", "jpg", "jpeg"],
            "nonConvert-Suffixs": ["jpg", "webp"],
            "image-addressing": "y-n",
            "convert-main": true,
            "compress-main": true,
            "make-phone-image": true,
            "compress-quality": 85,
            "phone-width": 300,
            "watermark-main": true,
            "watermark": true,
            "__v": 0,
            "watermark-config": "",
            "main-watermark-config": "",
            "auto-submit-removal-image": false,
            "auto-translate-image-name": false,
            // "change-main-image-resolution": true,
            // "change-main-image-width": 900,
            "in-content-compress": true,
            "in-content-compress-quality": 85,
            "in-content-image-result-Suffixs": ["png", "tiff"],
            "in-content-watermark": true,
            "in-content-watermark-config": "",
            "in-content-compress-main": true,
            "in-content-compress-main-quality": 80,
            "main-compress-quality": 85,
            "main-image-result-Suffixs": ["webp", "jpg", "jpeg"],
            "main-remaked-compress": true,
            "main-remaked-compress-quality": 85,
            "remove-in-content-main-image-src": false,
            "remove-main-image-src": true,
            "show-big-image": false,
            "show-in-content-main-image": true,
            "tempalte-image-result-Suffixs": ["webp", "jpg"],
            "template-compress": true,
            "template-compress-quality": 85
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
    async getCompressResult(percent, p) {
        try {
            p = p == undefined ? "src/uploads/filters/sample.jpg" : await fileManager_1.DiskFileManager.downloadFile(p);
            let paths = p.split(".");
            const newName = `src/uploads/tmp/${random_1.default.generateHashStr(15)}.${paths[paths.length - 1]}`;
            await imageProccessing_1.default.compress(p, newName, percent);
            const resultStats = await fileManager_1.DiskFileManager.stats(newName);
            const stats = await fileManager_1.DiskFileManager.stats(p);
            return {
                status: 200,
                data: {
                    size: stats.size,
                    resultSize: resultStats.size,
                    result: newName.replace("src", "")
                }
            };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
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
            //  watermark: z.boolean(),
            // "watermark-config": BaseController.id.optional(),
            // type: z.string().optional(),
            "upload-path": zod_1.z.object({
                fileManager: controller_1.default.id,
                path: zod_1.z.string()
            }),
            "valid-Suffix": zod_1.z.array(zod_1.z.string()),
            "nonConvert-Suffixs": zod_1.z.array(zod_1.z.string()).default([]),
            "image-addressing": zod_1.z.enum(["y-m-d", "y-m", "y", "y-n", "n", "y-m-n"]),
            "make-phone-image": zod_1.z.boolean().optional(),
            "phone-width": zod_1.z.number(),
            "auto-translate-image-name": zod_1.z.boolean(),
            "show-big-image": zod_1.z.boolean(),
            "auto-submit-removal-image": zod_1.z.boolean(),
            "main-image-result-Suffixs": zod_1.z.array(zod_1.z.string()),
            "watermark-main": zod_1.z.boolean(),
            "main-watermark-config": controller_1.default.id.optional(),
            "main-remaked-compress": zod_1.z.boolean().optional(),
            "main-remaked-compress-quality": zod_1.z.coerce.number().int().optional(),
            "remove-main-image-src": zod_1.z.boolean().optional(),
            "compress-main": zod_1.z.boolean().optional(),
            "main-compress-quality": zod_1.z.coerce.number().int().optional(),
            "in-content-image-result-Suffixs": zod_1.z.array(zod_1.z.string()),
            "in-content-watermark": zod_1.z.boolean(),
            "in-content-watermark-config": controller_1.default.id.optional(),
            "in-content-compress": zod_1.z.boolean(),
            "in-content-compress-quality": zod_1.z.coerce.number().int().optional(),
            "remove-in-content-main-image-src": zod_1.z.boolean(),
            "show-in-content-main-image": zod_1.z.boolean(),
            "in-content-compress-main": zod_1.z.boolean().optional(),
            "in-content-compress-main-quality": zod_1.z.coerce.number().int().optional(),
            "tempalte-image-result-Suffixs": zod_1.z.array(zod_1.z.string()),
            "template-compress": zod_1.z.boolean(),
            "template-compress-quality": zod_1.z.coerce.number().int().optional(),
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
__decorate([
    (0, method_1.Get)("/compress/result"),
    __param(0, (0, parameters_1.Query)({
        destination: "percent",
        schema: zod_1.z.coerce.number().int().min(0).max(100).optional()
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "path",
        schema: zod_1.z.string().optional()
    }))
], DomainImageController.prototype, "getCompressResult", null);
const domainImageConfig = new DomainImageController("/domainImageConfig", new repository_1.default({
    population: [{
            source: "domain"
        }]
}), {
    insertSchema: zod_1.z.object({
        "domain": controller_1.default.id,
        "upload-path": zod_1.z.object({
            fileManager: controller_1.default.id,
            path: zod_1.z.string()
        }),
        "valid-Suffix": zod_1.z.array(zod_1.z.string()),
        "nonConvert-Suffixs": zod_1.z.array(zod_1.z.string()).default([]),
        "image-addressing": zod_1.z.enum(["y-m-d", "y-m", "y", "y-n", "n", "y-m-n"]),
        "make-phone-image": zod_1.z.boolean().optional(),
        "phone-width": zod_1.z.number(),
        "auto-translate-image-name": zod_1.z.boolean(),
        "auto-submit-removal-image": zod_1.z.boolean(),
        "main-image-result-Suffixs": zod_1.z.array(zod_1.z.string()),
        "watermark-main": zod_1.z.boolean(),
        "main-watermark-config": controller_1.default.id.optional(),
        "main-remaked-compress": zod_1.z.boolean().optional(),
        "main-remaked-compress-quality": zod_1.z.coerce.number().int().optional(),
        "remove-main-image-src": zod_1.z.boolean().optional(),
        "compress-main": zod_1.z.boolean().optional(),
        "main-compress-quality": zod_1.z.coerce.number().int().optional(),
        "change-main-image-resolution": zod_1.z.boolean().optional(),
        "change-main-image-width": zod_1.z.coerce.number().int().optional(),
        "in-content-image-result-Suffixs": zod_1.z.array(zod_1.z.string()),
        "in-content-watermark": zod_1.z.boolean(),
        "in-content-watermark-config": controller_1.default.id.optional(),
        "in-content-compress": zod_1.z.boolean(),
        "in-content-compress-quality": zod_1.z.coerce.number().int().optional(),
        "remove-in-content-main-image-src": zod_1.z.boolean(),
        "show-in-content-main-image": zod_1.z.boolean(),
        "show-big-image": zod_1.z.boolean(),
        "tempalte-image-result-Suffixs": zod_1.z.array(zod_1.z.string()),
        "template-compress": zod_1.z.boolean(),
        "template-compress-quality": zod_1.z.coerce.number().int().optional(),
    })
});
exports.default = domainImageConfig;
