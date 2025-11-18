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
exports.Dashboard = void 0;
const method_1 = require("../../decorators/method");
const controller_1 = __importDefault(require("../../controller"));
const parameters_1 = require("../../decorators/parameters");
const controller_2 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/domain/repository"));
const repository_2 = __importDefault(require("../repositories/googleApiToken/repository"));
const axios_1 = __importDefault(require("axios"));
const repository_3 = __importDefault(require("../repositories/system/repository"));
const zod_1 = require("zod");
const repository_4 = __importDefault(require("../repositories/language/repository"));
const repository_5 = __importDefault(require("../repositories/comment/repository"));
class Dashboard extends controller_1.default {
    constructor(route, articleRepo) {
        super(route);
        this.domainRepo = new repository_1.default();
        this.googleApiTokenRepo = new repository_2.default();
        this.systemConfigRepo = new repository_3.default();
        this.articleRepo = articleRepo;
        this.languageRepo = new repository_4.default();
        this.commentRepo = new repository_5.default();
    }
    async getWebMasterInfo(domainId, start, end, compareStart, compareEnd) {
        try {
            var google_conf = await this.systemConfigRepo.getConfigValue("google_credential");
            var apiServer = await this.systemConfigRepo.getConfigValue("google_api_server");
            var apikey = await this.systemConfigRepo.getConfigValue("google_api_key");
            if (!google_conf)
                return {
                    status: 400,
                    data: {
                        type: "auth",
                        googleNotSet: true
                    }
                };
            let webmasterToken = await this.googleApiTokenRepo.findOne({
                type: "webmaster",
                domains: domainId
            });
            if (webmasterToken == null) {
                return {
                    status: 400,
                    data: {
                        type: "auth",
                        notSet: true
                    }
                };
            }
            let domain = await this.domainRepo.findById(domainId);
            let webmaster_conf = webmasterToken.token;
            // var google_conf = await this.systemConfigRepo.getConfigValue("google_credential")
            if (!webmaster_conf || !google_conf) {
                if (!google_conf) {
                    return {
                        status: 400,
                        data: {
                            type: "auth",
                            googleNotSet: true
                        }
                    };
                }
                return {
                    status: 400,
                    data: {
                        type: "auth",
                        notSet: true
                    }
                };
            }
            let response = await (0, axios_1.default)({
                method: 'post',
                url: apiServer + "users/webmaster/info/today",
                headers: {
                    "x-api-key": apikey
                },
                data: {
                    credential: google_conf,
                    token: webmaster_conf,
                    siteUrl: domain === null || domain === void 0 ? void 0 : domain.domain,
                    start,
                    end,
                    compareStart,
                    compareEnd
                    // siteUrl : "aroncare.com"
                }
            });
            return {
                status: 200,
                data: response.data
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getWebMasterChart(domainId, start, end, compareStart, compareEnd) {
        try {
            var conf = await this.systemConfigRepo.getConfigValue("google_credential");
            var apiServer = await this.systemConfigRepo.getConfigValue("google_api_server");
            var apikey = await this.systemConfigRepo.getConfigValue("google_api_key");
            if (!google_conf)
                return {
                    status: 400,
                    data: {
                        type: "auth",
                        googleNotSet: true
                    }
                };
            let webmasterToken = await this.googleApiTokenRepo.findOne({
                type: "webmaster",
                domains: domainId
            });
            if (webmasterToken == null) {
                return {
                    status: 400,
                    data: {
                        type: "auth",
                        notSet: true
                    }
                };
            }
            let domain = await this.domainRepo.findById(domainId);
            let webmaster_conf = webmasterToken.token;
            var google_conf = await this.systemConfigRepo.getConfigValue("google_credential");
            if (!webmaster_conf || !google_conf) {
                if (!google_conf) {
                    return {
                        status: 400,
                        data: {
                            type: "auth",
                            googleNotSet: true
                        }
                    };
                }
                return {
                    status: 400,
                    data: {
                        type: "auth",
                        notSet: true
                    }
                };
            }
            let response = await (0, axios_1.default)({
                method: 'post',
                url: apiServer + "users/webmaster/chart",
                headers: {
                    "x-api-key": apikey
                },
                data: {
                    credential: conf,
                    token: webmaster_conf,
                    siteUrl: domain === null || domain === void 0 ? void 0 : domain.domain,
                    start,
                    end,
                    compareStart,
                    compareEnd
                    // siteUrl : "aroncare.com"
                }
            });
            return {
                status: 200,
                data: response.data
            };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async getWebVitalInfo(domainId) {
        try {
            // var conf = await this.systemConfigRepo.getConfigValue("google_credential")
            var apiServer = await this.systemConfigRepo.getConfigValue("google_api_server");
            var apikey = await this.systemConfigRepo.getConfigValue("google_api_key");
            let domain = await this.domainRepo.findById(domainId);
            // let webmaster_conf = webmasterToken.token
            var googleApikey = await this.systemConfigRepo.getConfigValue("google-apikey");
            if (!googleApikey) {
                return {
                    status: 400,
                    data: {
                        type: "auth",
                        notSet: true
                    }
                };
            }
            console.log(domainId, domain === null || domain === void 0 ? void 0 : domain.domain);
            let response = await (0, axios_1.default)({
                method: 'post',
                url: apiServer + "users/webmaster/core-web-vital",
                headers: {
                    "x-api-key": apikey
                },
                data: {
                    apikey: googleApikey,
                    siteUrl: ((domain === null || domain === void 0 ? void 0 : domain.sslType) == "none" ? "https://" : "https://") + (domain === null || domain === void 0 ? void 0 : domain.domain)
                }
            });
            return {
                status: 200,
                data: response.data
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getHistoricCoreWebVital(domainId) {
        try {
            var apiServer = await this.systemConfigRepo.getConfigValue("google_api_server");
            var apikey = await this.systemConfigRepo.getConfigValue("google_api_key");
            let domain = await this.domainRepo.findById(domainId);
            // let webmaster_conf = webmasterToken.token
            var googleApikey = await this.systemConfigRepo.getConfigValue("google-apikey");
            if (!googleApikey) {
                return {
                    status: 400,
                    data: {
                        type: "auth",
                        notSet: true
                    }
                };
            }
            let response = await (0, axios_1.default)({
                method: 'post',
                url: apiServer + "users/webmaster/core-web-vital/historic",
                headers: {
                    "x-api-key": apikey
                },
                data: {
                    apikey: googleApikey,
                    siteUrl: ((domain === null || domain === void 0 ? void 0 : domain.sslType) == "none" ? "https://" : "https://") + (domain === null || domain === void 0 ? void 0 : domain.domain),
                }
            });
            return {
                status: 200,
                data: response.data
            };
        }
        catch (error) {
            throw error;
        }
    }
    async setApikey(apikey, admin) {
        try {
            if (!admin.isSuperAdmin) {
                return {
                    status: 403
                };
            }
            let googleApikey = await this.systemConfigRepo.getConfigValue("google-apikey");
            if (!googleApikey) {
                await this.systemConfigRepo.insert({
                    lable: "google_conf",
                    key: "google-apikey",
                    value: apikey,
                    type: "String"
                });
            }
            return {
                status: 200,
                data: {}
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getAnalyticsInfo(domainId) {
        var conf = await this.systemConfigRepo.getConfigValue("google_credential");
        var apiServer = await this.systemConfigRepo.getConfigValue("google_api_server");
        var apikey = await this.systemConfigRepo.getConfigValue("google_api_key");
        if (!google_conf)
            return {
                status: 400,
                data: {
                    type: "auth",
                    googleNotSet: true
                }
            };
        let analyticsToken = await this.googleApiTokenRepo.findOne({
            type: "analytics",
            domains: domainId
        });
        if (analyticsToken == null) {
            return {
                status: 400,
                data: {
                    type: "auth",
                    notSet: true
                }
            };
        }
        let domain = await this.domainRepo.findById(domainId);
        let scripts = (domain === null || domain === void 0 ? void 0 : domain.scripts) || [];
        let property = "";
        let measurementId = "";
        for (let i = 0; i < scripts.length; i++) {
            if (scripts[i].key == "analytics-measurementId") {
                measurementId = scripts[i].content;
            }
            if (scripts[i].key == "analytics-property") {
                property = scripts[i].content;
            }
        }
        let analytics_conf = analyticsToken.token;
        var google_conf = await this.systemConfigRepo.getConfigValue("google_credential");
        if (!analytics_conf || !google_conf) {
            if (!google_conf) {
                return {
                    status: 400,
                    data: {
                        type: "auth",
                        googleNotSet: true
                    }
                };
            }
            return {
                status: 400,
                data: {
                    type: "auth",
                    notSet: true
                }
            };
        }
        let response = await (0, axios_1.default)({
            method: 'post',
            url: apiServer + "users/analytics/real-time",
            headers: {
                "x-api-key": apikey
            },
            data: {
                credential: conf,
                token: analytics_conf,
                property,
                measurementId
            }
        });
        return {
            status: 200,
            data: response.data
        };
    }
    async getContents(domainId, admin) {
        try {
            let domain = await this.domainRepo.findById(domainId);
            let langIds = [];
            if (domain === null || domain === void 0 ? void 0 : domain.isDefault) {
                let languages = await this.languageRepo.findAll({
                    status: true,
                    domain: {
                        $exists: false
                    }
                });
                for (let i = 0; i < languages.length; i++) {
                    langIds.push(languages[i]._id);
                }
            }
            else {
                let language = await this.languageRepo.findOne({
                    domain: {
                        $eq: domainId
                    }
                });
                if (language != null)
                    langIds.push(language._id);
            }
            let count = await this.articleRepo.getcount({
                language: {
                    $in: langIds
                },
                isDraft: true,
                publisher: {
                    $exists: false
                }
            });
            let countProccess = await this.articleRepo.getcount({
                language: {
                    $in: langIds
                },
                isPublished: false,
                publisher: admin._id
            });
            return {
                status: 200,
                data: {
                    count,
                    countProccess
                }
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getCommentDashboard(domainId) {
        try {
            let domain = await this.domainRepo.findById(domainId);
            let langIds = [];
            if (domain === null || domain === void 0 ? void 0 : domain.isDefault) {
                let languages = await this.languageRepo.findAll({
                    status: true,
                    domain: {
                        $exists: false
                    }
                });
                for (let i = 0; i < languages.length; i++) {
                    langIds.push(languages[i]._id);
                }
            }
            else {
                let language = await this.languageRepo.findOne({
                    // status : true,
                    domain: {
                        $eq: domainId
                    }
                });
                if (language != null)
                    langIds.push(language._id);
            }
            let result = await this.commentRepo.collection.aggregate([
                {
                    $match: {
                        status: {
                            $ne: "confirmed"
                        },
                        language: {
                            $in: langIds
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            status: "$status",
                            type: "$type"
                        },
                        count: {
                            $sum: 1
                        }
                    }
                }
            ]);
            let data = {
                question: {
                    rejected: 0,
                    proccessing: 0
                },
                comment: {
                    rejected: 0,
                    proccessing: 0
                }
            };
            try {
                for (let i = 0; i < result.length; i++) {
                    data[result[i]["_id"]["type"]][result[i]["_id"]["status"]] = result[i]["count"];
                }
            }
            catch (error) {
            }
            return {
                data
            };
        }
        catch (error) {
            throw error;
        }
    }
    async setGoogleCridential(cridential, admin) {
        try {
            if (!admin.isSuperAdmin) {
                return {
                    status: 403
                };
            }
            let googleApikey = await this.systemConfigRepo.getConfigValue("google_credential");
            if (!googleApikey) {
                await this.systemConfigRepo.insert({
                    lable: "google_conf",
                    key: "google_credential",
                    value: cridential,
                    type: "Object"
                });
            }
            return {
                status: 200,
                data: {}
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getPageSpeed(page, device) {
        try {
            var apiServer = await this.systemConfigRepo.getConfigValue("google_api_server");
            var apikey = await this.systemConfigRepo.getConfigValue("google_api_key");
            let response = await (0, axios_1.default)({
                method: 'post',
                url: apiServer + "users/google/pagespeed",
                headers: {
                    "x-api-key": apikey
                },
                data: {
                    page,
                    device
                    // siteUrl : domain?.domain
                    // siteUrl : "aroncare.com"
                }
            });
            return {
                status: 200,
                data: response.data
            };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
}
exports.Dashboard = Dashboard;
__decorate([
    (0, method_1.Get)("/webmaster"),
    __param(0, (0, parameters_1.Query)({
        destination: "domain",
        schema: controller_2.default.id
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "start",
        schema: zod_1.z.coerce.date().optional()
    })),
    __param(2, (0, parameters_1.Query)({
        destination: "end",
        schema: zod_1.z.coerce.date().optional()
    })),
    __param(3, (0, parameters_1.Query)({
        destination: "compareStart",
        schema: zod_1.z.coerce.date().optional()
    })),
    __param(4, (0, parameters_1.Query)({
        destination: "compareEnd",
        schema: zod_1.z.coerce.date().optional()
    }))
], Dashboard.prototype, "getWebMasterInfo", null);
__decorate([
    (0, method_1.Get)("/webmaster/cahrt"),
    __param(0, (0, parameters_1.Query)({
        destination: "domain",
        schema: controller_2.default.id
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "start",
        schema: zod_1.z.coerce.date().optional()
    })),
    __param(2, (0, parameters_1.Query)({
        destination: "end",
        schema: zod_1.z.coerce.date().optional()
    })),
    __param(3, (0, parameters_1.Query)({
        destination: "compareStart",
        schema: zod_1.z.coerce.date().optional()
    })),
    __param(4, (0, parameters_1.Query)({
        destination: "compareEnd",
        schema: zod_1.z.coerce.date().optional()
    }))
], Dashboard.prototype, "getWebMasterChart", null);
__decorate([
    (0, method_1.Get)("/webmaster/web-vital"),
    __param(0, (0, parameters_1.Query)({
        destination: "domain",
        schema: controller_2.default.id
    }))
], Dashboard.prototype, "getWebVitalInfo", null);
__decorate([
    (0, method_1.Get)("/webmaster/web-vital/historic"),
    __param(0, (0, parameters_1.Query)({
        destination: "domain",
        schema: controller_2.default.id
    }))
], Dashboard.prototype, "getHistoricCoreWebVital", null);
__decorate([
    (0, method_1.Post)("/webmaster/web-vital/apikey"),
    __param(0, (0, parameters_1.Body)({
        destination: "apikey",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Admin)())
], Dashboard.prototype, "setApikey", null);
__decorate([
    (0, method_1.Get)("/analytics"),
    __param(0, (0, parameters_1.Query)({
        destination: "domain",
        schema: controller_2.default.id
    }))
], Dashboard.prototype, "getAnalyticsInfo", null);
__decorate([
    (0, method_1.Get)("/conetnts"),
    __param(0, (0, parameters_1.Query)({
        destination: "domain",
        schema: controller_2.default.id
    })),
    __param(1, (0, parameters_1.Admin)())
], Dashboard.prototype, "getContents", null);
__decorate([
    (0, method_1.Get)("/comments"),
    __param(0, (0, parameters_1.Query)({
        destination: "domain",
        schema: controller_2.default.id
    }))
], Dashboard.prototype, "getCommentDashboard", null);
__decorate([
    (0, method_1.Post)("/google/cridential"),
    __param(0, (0, parameters_1.Body)({
        destination: "cridential",
        schema: controller_2.default.search
    })),
    __param(1, (0, parameters_1.Admin)())
], Dashboard.prototype, "setGoogleCridential", null);
__decorate([
    (0, method_1.Get)("/api/admin/google/pagespeed", {
        absolute: true
    }),
    __param(0, (0, parameters_1.Query)({
        destination: "page",
        schema: zod_1.z.string().url(),
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "device",
        schema: zod_1.z.enum(["desktop", "mobile"])
    }))
], Dashboard.prototype, "getPageSpeed", null);
