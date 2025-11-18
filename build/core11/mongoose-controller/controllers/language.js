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
exports.LanguageController = void 0;
const config_1 = __importDefault(require("../../services/config"));
const method_1 = require("../../decorators/method");
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/language/repository"));
const parameters_1 = require("../../decorators/parameters");
const util_1 = require("util");
const zod_1 = require("zod");
const fs_1 = __importDefault(require("fs"));
const readFile = (0, util_1.promisify)(fs_1.default.readFile);
const writeFile = (0, util_1.promisify)(fs_1.default.writeFile);
const app_1 = __importDefault(require("../../../app"));
const repository_2 = __importDefault(require("../repositories/content/repository"));
const repository_3 = __importDefault(require("../repositories/domain/repository"));
const nginx_1 = __importDefault(require("../../services/nginx/nginx"));
const repository_4 = __importDefault(require("../repositories/redirect/repository"));
const repository_5 = __importDefault(require("../repositories/fileManagerConfig/repository"));
const fileManager_1 = __importDefault(require("../../services/fileManager"));
const random_1 = __importDefault(require("../../random"));
class LanguageController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.contentRepo = new repository_2.default();
        this.domainRepo = new repository_3.default();
        this.nginx = new nginx_1.default(this.contentRepo);
        this.redirectRepo = new repository_4.default();
        this.cdnConfigRepo = new repository_5.default();
        this.cdn = new fileManager_1.default();
    }
    getDefault() {
        try {
            let sign = config_1.default.getConfig("defaultLanguage");
            return this.findOne({
                sign
            });
        }
        catch (error) {
            throw error;
        }
    }
    async restartAdminPart() {
        var _a;
        (_a = app_1.default.getPart(config_1.default.getConfig("adminAPI"))) === null || _a === void 0 ? void 0 : _a.initLanguages();
    }
    async setLangugaeFile(f, language) {
        let fileURL = config_1.default.getConfig("serverurl") + f[0].path.replace("src/", "/");
        this.restartAdminPart();
        return this.editById(language, {
            $set: {
                fileURL,
                filePath: f[0].path
            }
        });
    }
    async getDomainLocalCDN(domainID) {
        try {
            let domain = await this.domainRepo.findById(domainID);
            if (domain == null) {
                return {
                    status: 404
                };
            }
            if (domain.localCDN) {
                let cdn = await this.cdnConfigRepo.findById(domain.localCDN);
                return {
                    status: 200,
                    data: cdn
                };
            }
            return {
                status: 404
            };
        }
        catch (error) {
            throw error;
        }
    }
    mergeJsons(json1, json2) {
        function mergeValues(value1, value2) {
            if (typeof value2 === 'string') {
                return value1;
            }
            else if (typeof value2 === 'object') {
                const mergedDict = {};
                for (const key in value1) {
                    if (key in value2) {
                        mergedDict[key] = mergeValues(value1[key], value2[key]);
                    }
                }
                for (const key in value2) {
                    if (!(key in mergedDict)) {
                        mergedDict[key] = value2[key];
                    }
                }
                return mergedDict;
            }
            else {
                return value1;
            }
        }
        const mergedDict = mergeValues(json1, json2);
        return mergedDict;
    }
    async editPanelUpdate(id, json) {
        const language = await this.repository.findById(id);
        if (language == null) {
            return {
                status: 404,
                data: {}
            };
        }
        try {
            let currentJSON = JSON.parse((await readFile(language.panelFilePath)).toString());
            await writeFile(language.panelFilePath, JSON.stringify(this.mergeJsons(json, currentJSON)));
            this.restartAdminPart();
            return {
                status: 200
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getPanelFile(id) {
        const language = await this.repository.findById(id);
        if (language == null) {
            return {
                status: 404,
                data: {}
            };
        }
        try {
            let currentJSON = JSON.parse((await readFile(language.panelFilePath)).toString());
            return {
                status: 200,
                data: currentJSON
            };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async updateLanguage(id, data) {
        var _a, _b, _c;
        try {
            // console.log("data" , data)
            let lang = await this.repository.findById(id);
            let changeMap = [];
            let staticChangeMap = [];
            if (lang == null) {
                return {
                    status: 404
                };
            }
            var contents = await this.contentRepo.findAll({
                language: id
            });
            let urls = [];
            if (lang.domain) {
                if (!data.isDomain) {
                    for (let i = 0; i < contents.length; i++) {
                        let u = await this.contentRepo.makeURL(contents[i].originalUrl, contents[i].isStatic, {
                            type: contents[i].type,
                            language: contents[i].language,
                            category: (_a = contents[i].category) === null || _a === void 0 ? void 0 : _a.toString(),
                            // domain: data.domain,
                            isDomain: data.isDomain
                        });
                        if (contents[i].isStatic) {
                            staticChangeMap.push({
                                from: contents[i].url,
                                to: u,
                                id: contents[i]._id,
                            });
                        }
                        else {
                            changeMap.push({
                                from: contents[i].url,
                                to: u,
                                id: contents[i]._id,
                                type: contents[i].type
                            });
                        }
                        urls.push(u);
                    }
                }
                else if (lang.domain != data.domain) {
                    for (let i = 0; i < contents.length; i++) {
                        let u = await this.contentRepo.makeURL(contents[i].originalUrl, contents[i].isStatic, {
                            type: contents[i].type,
                            language: contents[i].language,
                            category: (_b = contents[i].category) === null || _b === void 0 ? void 0 : _b.toString(),
                            domain: data.domain,
                            isDomain: data.isDomain
                        });
                        changeMap.push({
                            from: contents[i].url,
                            to: u,
                            id: contents[i]._id,
                            type: contents[i].type
                        });
                        urls.push(u);
                    }
                }
            }
            else {
                if (data.isDomain) {
                    for (let i = 0; i < contents.length; i++) {
                        let u = await this.contentRepo.makeURL(contents[i].originalUrl, contents[i].isStatic, {
                            type: contents[i].type,
                            language: contents[i].language,
                            category: (_c = contents[i].category) === null || _c === void 0 ? void 0 : _c.toString(),
                            domain: data.domain,
                            isDomain: data.isDomain
                        });
                        if (contents[i].isStatic) {
                            staticChangeMap.push({
                                from: contents[i].url,
                                to: u,
                                id: contents[i]._id
                            });
                        }
                        else {
                            changeMap.push({
                                from: contents[i].url,
                                to: u,
                                id: contents[i]._id,
                                type: contents[i].type
                            });
                        }
                        urls.push(u);
                    }
                }
            }
            if (data.domain != undefined) {
                let domain = await this.domainRepo.findById(data.domain);
                if (domain != null && data.domainCDN) {
                    if (domain.localCDN == undefined) {
                        let localCDN = await this.cdnConfigRepo.getInertnal();
                        if (localCDN != null) {
                            try {
                                this.cdn.CDN_id = localCDN._id;
                                await this.cdn.init();
                                let bucketName = random_1.default.generateHashStr(6);
                                await this.cdn.makeBucket(bucketName);
                                let insertData = JSON.parse(JSON.stringify(localCDN));
                                delete insertData["_id"];
                                insertData['config']['bucket'] = bucketName;
                                insertData.title = domain.domain;
                                insertData.hostUrl = (domain.sslType == "none" ? "http://" : "https://") + domain.domain + "/files/";
                                let newCDN = await this.cdnConfigRepo.insert(insertData);
                                await this.domainRepo.updateOne({
                                    _id: domain._id
                                }, {
                                    $set: {
                                        localCDN: newCDN._id,
                                        bucketName
                                    }
                                });
                                await this.nginx.init();
                            }
                            catch (error) {
                                console.log(error);
                            }
                        }
                    }
                }
            }
            let existsUrl = await this.contentRepo.findAll({
                url: {
                    $in: urls
                }
            });
            await this.repository.updateOne({
                _id: id
            }, {
                $set: data
            });
            for (let i = 0; i < changeMap.length; i++) {
                this.contentRepo.updateOne({
                    _id: changeMap[i].id
                }, {
                    $set: {
                        url: changeMap[i].to
                    }
                });
                await this.redirectRepo.updateOne({
                    status: {
                        $ne: false
                    },
                    $or: [{
                            to: changeMap[i].id.toHexString(),
                        },
                        {
                            to: changeMap[i].from,
                        },
                    ],
                    type: "language"
                }, {
                    $set: {
                        status: false
                    }
                });
                await this.redirectRepo.insert({
                    type: "language",
                    from: changeMap[i].from,
                    to: changeMap[i].id,
                    code: "302",
                    isAutomatic: true,
                    domain: lang === null || lang === void 0 ? void 0 : lang.domain,
                    fromStatic: true,
                    toStatic: false,
                    language: id
                });
            }
            for (let i = 0; i < staticChangeMap.length; i++) {
                this.contentRepo.updateOne({
                    _id: staticChangeMap[i].id
                }, {
                    $set: {
                        url: staticChangeMap[i].to
                    }
                });
                await this.redirectRepo.updateOne({
                    status: {
                        $ne: false
                    },
                    $or: [{
                            to: changeMap[i].id.toHexString(),
                        },
                        {
                            to: changeMap[i].from,
                        }
                    ],
                    type: "language"
                }, {
                    $set: {
                        status: false
                    }
                });
                await this.redirectRepo.insert({
                    type: "language",
                    from: changeMap[i].from,
                    to: changeMap[i].id,
                    code: "302",
                    isAutomatic: true,
                    domain: lang === null || lang === void 0 ? void 0 : lang.domain,
                    fromStatic: true,
                    toStatic: false,
                    language: id
                });
            }
            this.nginx.init();
            return {
                status: 200
            };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    getDynamicRedirects(changeMap, languageSign, domain) {
        let result = {};
        let sign = `/${language}/`;
        for (let i = 0; i < changeMap.length; i++) {
        }
    }
    async getLanguageContents(language) {
        try {
            let contents = await this.contentRepo.getcount({
                language
            });
            return {
                data: contents
            };
        }
        catch (error) {
            throw error;
        }
        return {};
    }
    async validate(admin) {
        // console.log("admin")
        return {
            next: true
        };
    }
    async validateChangeDomain(data) {
        var _a, _b;
        try {
            let lang = await this.repository.findById(data.id);
            let changeMap = [];
            if (lang == null) {
                return {
                    status: 404
                };
            }
            var contents = await this.contentRepo.findAll({
                language: data.id
            });
            let urls = [];
            if (lang.domain) {
                if (!data.isDomain) {
                    for (let i = 0; i < contents.length; i++) {
                        let u = await this.contentRepo.makeURL(contents[i].originalUrl, contents[i].isStatic, {
                            type: contents[i].type,
                            language: contents[i].language,
                            category: (_a = contents[i].category) === null || _a === void 0 ? void 0 : _a.toString(),
                            domain: data.domain,
                            isDomain: data.isDomain
                        });
                        changeMap.push({
                            from: contents[i].url,
                            to: u
                        });
                        urls.push(u);
                    }
                }
                else if (lang.domain != data.domain) {
                }
            }
            else {
                if (data.isDomain) {
                    for (let i = 0; i < contents.length; i++) {
                        let u = await this.contentRepo.makeURL(contents[i].originalUrl, contents[i].isStatic, {
                            type: contents[i].type,
                            language: contents[i].language,
                            category: (_b = contents[i].category) === null || _b === void 0 ? void 0 : _b.toString(),
                            domain: data.domain,
                            isDomain: data.isDomain
                        });
                        changeMap.push({
                            from: contents[i].url,
                            to: u,
                        });
                        urls.push(u);
                    }
                }
            }
            let existsUrl = await this.contentRepo.findAll({
                url: {
                    $in: urls
                }
            });
            return {
                data: {
                    isOk: existsUrl.length == 0,
                    existsUrl: existsUrl,
                    total: contents.length,
                    changeMap
                }
            };
        }
        catch (error) {
            throw error;
        }
    }
    async checkDomainExists(language) {
        try {
            let langDomains = await this.repository.findAll({
                _id: {
                    $ne: language
                },
                domain: {
                    $exists: true
                }
            });
            let domains = [];
            for (let i = 0; i < langDomains.length; i++) {
                domains.push(langDomains[i].domain);
            }
            return {
                data: await this.domainRepo.paginate({
                    _id: {
                        $nin: domains
                    },
                    isDefault: {
                        $ne: true
                    },
                    adminDomain: {
                        $ne: true
                    }
                }, 200, 1)
            };
        }
        catch (error) {
            throw error;
        }
    }
    async create(data, ...params) {
        try {
            let r = await super.create(data);
            if (r.status == 200) {
                if (data.domain != undefined) {
                    let domain = await this.domainRepo.findById(data.domain);
                    if (domain != null && data.domainCDN) {
                        if (domain.localCDN == undefined) {
                            let localCDN = await this.cdnConfigRepo.getInertnal();
                            if (localCDN != null) {
                                try {
                                    this.cdn.CDN_id = localCDN._id;
                                    await this.cdn.init();
                                    let bucketName = random_1.default.generateHashStr(6);
                                    await this.cdn.makeBucket(bucketName);
                                    let insertData = JSON.parse(JSON.stringify(localCDN));
                                    delete insertData._id;
                                    insertData['config']['bucket'] = bucketName;
                                    insertData.title = domain.domain;
                                    insertData.hostUrl = (domain.sslType == "none" ? "http://" : "https://") + domain.domain + "/files/";
                                    let newCDN = await this.cdnConfigRepo.insert(insertData);
                                    await this.domainRepo.updateOne({
                                        _id: domain._id
                                    }, {
                                        $set: {
                                            localCDN: newCDN._id,
                                            bucketName
                                        }
                                    });
                                    await this.nginx.init();
                                }
                                catch (error) {
                                }
                            }
                        }
                    }
                }
            }
            return r;
        }
        catch (error) {
            throw error;
        }
    }
    async clearDomain(domainID) {
        try {
            let domain = await this.domainRepo.findById(domainID);
            if (domain === null || domain === void 0 ? void 0 : domain.localCDN) {
                let localCDN = await this.cdnConfigRepo.findById(domain.localCDN);
                if (localCDN == null) {
                    return {
                        status: 200
                    };
                }
                this.cdn.CDN_id = localCDN._id;
                await this.cdn.init();
                await this.cdn.removeBucket(domain.bucketName);
                await this.domainRepo.updateOne({
                    _id: domain._id
                }, {
                    $unset: {
                        localCDN: 1,
                        bucketName: 1
                    }
                });
                await this.cdnConfigRepo.deleteById(localCDN._id);
            }
            return {
                status: 200
            };
        }
        catch (error) {
            throw error;
        }
    }
    async searchHelper(queryParam) {
        let q = await super.searchHelper(queryParam);
        if (queryParam["_id$nin"]) {
            if (q["_id"]) {
                q["_id"]["$nin"] = queryParam["_id$nin"];
            }
            else {
                q["_id"] = {
                    $nin: queryParam["_id$nin"]
                };
            }
        }
        return q;
    }
    initApis() {
        super.initApis();
        this.addRouteWithMeta("/language/search", "get", this.search.bind(this), controller_1.default.searcheMeta);
        this.addRoute("s/search/list", "get", this.getSearchList.bind(this));
        this.addRouteWithMeta("", "get", this.findById.bind(this), {
            "1": {
                index: 0,
                source: "query",
                destination: "id",
                schema: controller_1.default.id
            },
            absolute: false
        });
    }
}
exports.LanguageController = LanguageController;
__decorate([
    (0, method_1.Get)("/default")
], LanguageController.prototype, "getDefault", null);
__decorate([
    (0, method_1.Post)("/file"),
    __param(0, (0, parameters_1.Files)({
        destination: "file",
        config: {
            name: "file",
            maxCount: 1,
            types: ["json"],
            dest: "src/uploads/languages/"
        }
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "language",
        schema: controller_1.default.id
    }))
], LanguageController.prototype, "setLangugaeFile", null);
__decorate([
    (0, method_1.Get)("/domain/cdn"),
    __param(0, (0, parameters_1.Query)({
        destination: "domain",
        schema: controller_1.default.id
    }))
], LanguageController.prototype, "getDomainLocalCDN", null);
__decorate([
    (0, method_1.Post)("/panel/update"),
    __param(0, (0, parameters_1.Body)({
        destination: "language",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "json",
        schema: controller_1.default.search
    }))
], LanguageController.prototype, "editPanelUpdate", null);
__decorate([
    (0, method_1.Get)("/panel/file"),
    __param(0, (0, parameters_1.Query)({
        destination: "language",
        schema: controller_1.default.id
    }))
], LanguageController.prototype, "getPanelFile", null);
__decorate([
    (0, method_1.Put)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            title: zod_1.z.string(),
            panelTitle: zod_1.z.string(),
            direction: zod_1.z.enum(["ltr", "rtl"]),
            status: zod_1.z.boolean(),
            isDefault: zod_1.z.boolean().default(false),
            showInLangList: zod_1.z.boolean().default(false),
            index: zod_1.z.boolean(),
            isDomain: zod_1.z.boolean(),
            domainCDN: zod_1.z.boolean().optional(),
            countries: zod_1.z.array(zod_1.z.string()),
            domain: controller_1.default.id.optional(),
        })
    }))
], LanguageController.prototype, "updateLanguage", null);
__decorate([
    (0, method_1.Post)("/count"),
    __param(0, (0, parameters_1.Query)({
        destination: "language",
        schema: controller_1.default.id
    }))
], LanguageController.prototype, "getLanguageContents", null);
__decorate([
    (0, method_1.PreExec)({
        method: "post",
        route: "/validate"
    }),
    __param(0, (0, parameters_1.Admin)())
], LanguageController.prototype, "validate", null);
__decorate([
    (0, method_1.Post)("/validate"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            id: controller_1.default.id,
            isDomain: zod_1.z.boolean(),
            domain: controller_1.default.id.optional()
        })
    }))
], LanguageController.prototype, "validateChangeDomain", null);
__decorate([
    (0, method_1.Get)("/domain/search"),
    __param(0, (0, parameters_1.Query)({
        destination: "language",
        schema: controller_1.default.id.optional()
    }))
], LanguageController.prototype, "checkDomainExists", null);
__decorate([
    (0, method_1.Get)("/domain/clear"),
    __param(0, (0, parameters_1.Query)({
        destination: "domainID",
        schema: controller_1.default.id
    }))
], LanguageController.prototype, "clearDomain", null);
const language = new LanguageController("/language", new repository_1.default(), {
    searchFilters: {
        title: ["eq", "reg"],
        _id: ["eq", "list", "nin"],
        status: ["eq"]
    },
    insertSchema: zod_1.z.object({
        title: zod_1.z.string(),
        panelTitle: zod_1.z.string(),
        sign: zod_1.z.string(),
        direction: zod_1.z.enum(["ltr", "rtl"]),
        status: zod_1.z.boolean(),
        isDefault: zod_1.z.boolean().default(false),
        domainCDN: zod_1.z.boolean().optional(),
        showInLangList: zod_1.z.boolean().default(false),
        index: zod_1.z.boolean(),
        isDomain: zod_1.z.boolean(),
        countries: zod_1.z.array(zod_1.z.string()),
        domain: controller_1.default.id.optional()
    })
});
exports.default = language;
