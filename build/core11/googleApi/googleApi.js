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
const parameters_1 = require("../decorators/parameters");
const repository_1 = __importDefault(require("../mongoose-controller/repositories/system/repository"));
const googleapis_1 = require("googleapis");
const zod_1 = require("zod");
const repository_2 = __importDefault(require("../mongoose-controller/repositories/domain/repository"));
const axios_1 = __importDefault(require("axios"));
const repository_3 = __importDefault(require("../mongoose-controller/repositories/googleApiToken/repository"));
const controller_1 = __importDefault(require("../mongoose-controller/controller"));
class GoogleApi {
    constructor() {
        this.SCOPES_YOUTUBE = "https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/gmail.readonly";
        this.SCOPES_WEBMASTER = "https://www.googleapis.com/auth/indexing https://www.googleapis.com/auth/webmasters https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/gmail.readonly";
        this.SCOPES_ANALYTICS = 'https://www.googleapis.com/auth/analytics https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/gmail.readonly';
        this.systemConfigRepo = new repository_1.default();
        this.domainRepo = new repository_2.default();
        this.googleApiTokenRepo = new repository_3.default();
    }
    async init() {
        return;
    }
    serve(...args) {
        var routes = [];
        routes.push({
            execs: this.youtubeAuth.bind(this),
            method: "get",
            route: "/api/admin/youtube/auth",
            meta: Reflect.getMetadata("youtubeAuth" + this.constructor.name, this)
        });
        routes.push({
            execs: this.webmasterAuth.bind(this),
            method: "get",
            route: "/api/admin/webmaster/auth",
            meta: Reflect.getMetadata("webmasterAuth" + this.constructor.name, this)
        });
        routes.push({
            execs: this.testWebmaster.bind(this),
            method: "get",
            route: "/api/admin/webmaster/test",
            meta: Reflect.getMetadata("testWebmaster" + this.constructor.name, this)
        });
        routes.push({
            execs: this.analyticsAuth.bind(this),
            method: "get",
            route: "/api/admin/analytics/auth",
            meta: Reflect.getMetadata("analyticsAuth" + this.constructor.name, this)
        });
        routes.push({
            execs: this.googleCallBack.bind(this),
            method: "get",
            route: "/google/callback",
            meta: Reflect.getMetadata("googleCallBack" + this.constructor.name, this)
        });
        return routes;
    }
    async youtubeAuth(session, admin) {
        try {
            var conf = await this.systemConfigRepo.getConfigValue("google_credential");
            var redirectUri = await this.systemConfigRepo.getConfigValue("google_api_redirect_config");
            var oAuth2Client = new googleapis_1.google.auth.OAuth2({
                redirectUri: redirectUri || conf.web.redirect_uris[0],
                clientId: conf.web.client_id,
                clientSecret: conf.web.client_secret
            });
            var url = oAuth2Client.generateAuthUrl({
                access_type: "offline",
                scope: this.SCOPES_YOUTUBE,
            });
            session['google_type'] = "youtube";
            return {
                status: 300,
                redirect: url,
                session
            };
        }
        catch (error) {
            throw error;
        }
    }
    async webmasterAuth(session, admin) {
        try {
            var conf = await this.systemConfigRepo.getConfigValue("google_credential");
            var redirectUri = await this.systemConfigRepo.getConfigValue("google_api_redirect_config");
            var oAuth2Client = new googleapis_1.google.auth.OAuth2({
                redirectUri: redirectUri || conf.web.redirect_uris[0],
                clientId: conf.web.client_id,
                clientSecret: conf.web.client_secret
            });
            var url = oAuth2Client.generateAuthUrl({
                access_type: "offline",
                scope: this.SCOPES_WEBMASTER,
            });
            session['google_type'] = "webmaster";
            return {
                status: 300,
                redirect: url,
                session
            };
        }
        catch (error) {
            throw error;
        }
    }
    async analyticsAuth(session, admin) {
        try {
            if (admin == undefined) {
                return {
                    status: 403,
                };
            }
            var conf = await this.systemConfigRepo.getConfigValue("google_credential");
            var redirectUri = await this.systemConfigRepo.getConfigValue("google_api_redirect_config");
            var oAuth2Client = new googleapis_1.google.auth.OAuth2({
                redirectUri: redirectUri || conf.web.redirect_uris[0],
                clientId: conf.web.client_id,
                clientSecret: conf.web.client_secret
            });
            var url = oAuth2Client.generateAuthUrl({
                access_type: "offline",
                scope: this.SCOPES_ANALYTICS,
            });
            session['google_type'] = "analytics";
            return {
                status: 300,
                redirect: url,
                session
            };
        }
        catch (error) {
            throw error;
        }
    }
    async testWebmaster(domainId) {
        try {
            // var webmaster_conf = await this.systemConfigRepo.getConfigValue("webmaster_conf")
            var conf = await this.systemConfigRepo.getConfigValue("google_credential");
            var apiServer = await this.systemConfigRepo.getConfigValue("google_api_server");
            var apikey = await this.systemConfigRepo.getConfigValue("google_api_key");
            let webmasterToken = await this.googleApiTokenRepo.findOne({
                type: "webmaster",
                domains: domainId
            });
            if (webmasterToken == null) {
                return {
                    status: 400
                };
            }
            let domain = await this.domainRepo.findById(domainId);
            let webmaster_conf = webmasterToken.token;
            var google_conf = await this.systemConfigRepo.getConfigValue("google_credential");
            if (!webmaster_conf || !google_conf) {
                return {
                    status: 400
                };
            }
            let response = await (0, axios_1.default)({
                method: 'post',
                url: apiServer + "users/webmaster/domains",
                headers: {
                    "x-api-key": apikey
                },
                data: {
                    credential: conf,
                    token: webmaster_conf
                }
            });
            let domains = response.data.siteEntry;
            for (let i = 0; i < domains.length; i++) {
                if (domains[i].permissionLevel == "siteUnverifiedUser") {
                    continue;
                }
                let domainName = domains[i].siteUrl.replace("sc-domain:", "");
                if ((domain === null || domain === void 0 ? void 0 : domain.domain) == domainName) {
                    return {
                        status: 200,
                        data: {
                            ok: true
                        }
                    };
                }
            }
            return {
                status: 400
            };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async googleCallBack(code, session) {
        var _a, _b, _c, _d, _e, _f;
        try {
            var conf = await this.systemConfigRepo.getConfigValue("google_credential");
            var redirectUri = await this.systemConfigRepo.getConfigValue("google_api_redirect_config");
            var apiServer = await this.systemConfigRepo.getConfigValue("google_api_server");
            var apikey = await this.systemConfigRepo.getConfigValue("google_api_key");
            try {
                var res = await (0, axios_1.default)({
                    method: 'post',
                    url: apiServer + "users/callback",
                    headers: {
                        "x-api-key": apikey
                    },
                    data: {
                        conf,
                        redirect_url: redirectUri,
                        code
                    }
                });
                var data = res.data;
                let config = await this.googleApiTokenRepo.findOne({
                    type: session['google_type'],
                    "token.gmail": data.gmail,
                });
                if (config == null) {
                    config = await this.googleApiTokenRepo.insert({
                        type: session['google_type'],
                        token: data,
                    });
                }
                else {
                    if (((_a = data["token"]) === null || _a === void 0 ? void 0 : _a["refresh_token"]) == undefined) {
                        try {
                            data["token"]["refresh_token"] = (_c = (_b = config.token) === null || _b === void 0 ? void 0 : _b.token) === null || _c === void 0 ? void 0 : _c["refresh_token"];
                        }
                        catch (error) {
                        }
                    }
                    await this.googleApiTokenRepo.updateOne({
                        _id: config._id
                    }, {
                        $set: {
                            token: data
                        }
                    });
                    config = await this.googleApiTokenRepo.findById(config._id);
                }
                if (session['google_type'] == "webmaster") {
                    try {
                        let response = await (0, axios_1.default)({
                            method: 'post',
                            url: apiServer + "users/webmaster/domains",
                            headers: {
                                "x-api-key": apikey
                            },
                            data: {
                                credential: conf,
                                token: data
                            }
                        });
                        let domains = response.data.siteEntry;
                        let domainIds = [];
                        for (let i = 0; i < domains.length; i++) {
                            if (domains[i].permissionLevel == "siteUnverifiedUser") {
                                continue;
                            }
                            let domainName = domains[i].siteUrl.replace("sc-domain:", "");
                            let domain = await this.domainRepo.findOne({
                                domain: domainName
                            });
                            if (domain != null) {
                                domainIds.push(domain._id);
                            }
                        }
                        await this.googleApiTokenRepo.updateOne({
                            _id: config === null || config === void 0 ? void 0 : config._id
                        }, {
                            $addToSet: {
                                domains: domainIds
                            }
                        });
                    }
                    catch (error) {
                    }
                    return {
                        status: 301,
                        redirect: `/admin/panel/setting/webmaster?gmail=${data === null || data === void 0 ? void 0 : data.gmail}&expire=${data.token.expiry_date}`
                    };
                }
                else if (session['google_type'] == "analytics") {
                    try {
                        let response = await (0, axios_1.default)({
                            method: 'post',
                            url: apiServer + "users/analytics/domains",
                            headers: {
                                "x-api-key": apikey
                            },
                            data: {
                                credential: conf,
                                token: data
                            }
                        });
                        let domains = response.data;
                        let domainIds = [];
                        for (const key in domains) {
                            let u = new URL(key);
                            let domainName = u.host;
                            let domain = await this.domainRepo.findOne({
                                domain: domainName
                            });
                            if (domain != null) {
                                domainIds.push(domain._id);
                                let scripts = (domain === null || domain === void 0 ? void 0 : domain.scripts) || [];
                                let exists = false;
                                for (let i = 0; i < scripts.length; i++) {
                                    if (((_d = scripts[i]) === null || _d === void 0 ? void 0 : _d.key) == "analytics") {
                                        exists = true;
                                        scripts[i] = {
                                            key: "analytics",
                                            content: domains[key]["script"],
                                        };
                                    }
                                }
                                if (!exists) {
                                    scripts.push({
                                        key: "analytics",
                                        content: domains[key]["script"],
                                    });
                                }
                                exists = false;
                                for (let i = 0; i < scripts.length; i++) {
                                    if (((_e = scripts[i]) === null || _e === void 0 ? void 0 : _e.key) == "analytics-measurementId") {
                                        exists = true;
                                        scripts[i] = {
                                            key: "analytics-measurementId",
                                            content: domains[key]["measurementId"],
                                        };
                                    }
                                }
                                if (!exists) {
                                    scripts.push({
                                        key: "analytics-measurementId",
                                        content: domains[key]["measurementId"],
                                    });
                                }
                                exists = false;
                                for (let i = 0; i < scripts.length; i++) {
                                    if (((_f = scripts[i]) === null || _f === void 0 ? void 0 : _f.key) == "analytics-property") {
                                        exists = true;
                                        scripts[i] = {
                                            key: "analytics-property",
                                            content: domains[key]["property"],
                                        };
                                    }
                                }
                                if (!exists) {
                                    scripts.push({
                                        key: "analytics-property",
                                        content: domains[key]["property"],
                                    });
                                }
                                await this.domainRepo.updateOne({
                                    _id: domain === null || domain === void 0 ? void 0 : domain._id
                                }, {
                                    $set: {
                                        scripts
                                    }
                                });
                            }
                        }
                        await this.googleApiTokenRepo.updateOne({
                            _id: config === null || config === void 0 ? void 0 : config._id
                        }, {
                            $addToSet: {
                                domains: domainIds
                            }
                        });
                    }
                    catch (error) {
                        console.log(error);
                    }
                    return {
                        status: 301,
                        redirect: `/admin/panel/setting/analytics?gmail=${data === null || data === void 0 ? void 0 : data.gmail}&expire=${data.token.expiry_date}`
                    };
                }
                else {
                    var isExists = await this.systemConfigRepo.isExists({
                        key: "youtube_conf"
                    });
                    if (isExists) {
                        this.systemConfigRepo.updateOne({
                            key: "youtube_conf"
                        }, {
                            $set: {
                                value: data
                            }
                        });
                    }
                    else
                        var cc = await this.systemConfigRepo.insert({
                            key: "youtube_conf",
                            value: data,
                            lable: "google_conf",
                            type: "Object",
                        });
                }
                return {
                    status: 200,
                    session,
                    data: {
                        ok: true
                    }
                };
            }
            catch (error) {
                throw error;
            }
        }
        catch (error) {
            throw error;
        }
    }
}
exports.default = GoogleApi;
__decorate([
    __param(0, (0, parameters_1.Session)()),
    __param(1, (0, parameters_1.Admin)())
], GoogleApi.prototype, "youtubeAuth", null);
__decorate([
    __param(0, (0, parameters_1.Session)()),
    __param(1, (0, parameters_1.Admin)())
], GoogleApi.prototype, "webmasterAuth", null);
__decorate([
    __param(0, (0, parameters_1.Session)()),
    __param(1, (0, parameters_1.Admin)())
], GoogleApi.prototype, "analyticsAuth", null);
__decorate([
    __param(0, (0, parameters_1.Query)({
        destination: "domain",
        schema: controller_1.default.id
    }))
], GoogleApi.prototype, "testWebmaster", null);
__decorate([
    __param(0, (0, parameters_1.Query)({
        destination: "code",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Session)())
], GoogleApi.prototype, "googleCallBack", null);
