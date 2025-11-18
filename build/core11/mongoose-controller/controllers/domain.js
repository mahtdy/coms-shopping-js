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
exports.DomainController = void 0;
const zod_1 = require("zod");
const controller_1 = __importDefault(require("../controller"));
const method_1 = require("../../decorators/method");
const parameters_1 = require("../../decorators/parameters");
const repository_1 = __importDefault(require("../repositories/language/repository"));
const nginx_1 = __importDefault(require("../../services/nginx/nginx"));
const repository_2 = __importDefault(require("../repositories/content/repository"));
const repository_3 = __importDefault(require("../repositories/domainRedirect/repository"));
const repository_4 = __importDefault(require("../repositories/googleApiToken/repository"));
const repository_5 = __importDefault(require("../repositories/system/repository"));
class DomainController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.langRepo = new repository_1.default();
        this.nginx = new nginx_1.default(new repository_2.default());
        this.domainRedirectRepo = new repository_3.default();
        this.adminRepo = options.adminRepo;
        this.initNginx();
        this.repository.initDomainsNotification();
        this.googleApiTokenRepo = new repository_4.default();
        this.systemConfigRepo = new repository_5.default();
    }
    async getConfig(domain) {
        try {
            let config = await this.googleApiTokenRepo.findOne({
                domains: domain
            });
            var conf = await this.systemConfigRepo.getConfigValue("google_credential");
            var apiServer = await this.systemConfigRepo.getConfigValue("google_api_server");
            var apikey = await this.systemConfigRepo.getConfigValue("google_api_key");
            if (config == null || config == null) {
                return {
                    status: 200,
                    data: {
                        exists: false
                    }
                };
            }
            return {};
        }
        catch (error) {
            throw error;
        }
    }
    async setJsScript(data, domainId) {
        try {
            let domain = await this.repository.findOne({
                _id: domainId
            });
            if (domain == null) {
                return {
                    status: 404,
                    message: "not found"
                };
            }
            let scripts = (domain === null || domain === void 0 ? void 0 : domain.scripts) || [];
            let exists = false;
            for (let i = 0; i < scripts.length; i++) {
                if (scripts[i].key == data.key) {
                    exists = true;
                    scripts[i] = data;
                }
            }
            if (!exists) {
                scripts.push(data);
            }
            return this.editById(domainId, {
                $set: {
                    scripts
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async getJsScripts(domainId) {
        try {
            let domain = await this.repository.findOne({
                _id: domainId
            });
            if (domain == null) {
                return {
                    status: 404,
                    message: "not found"
                };
            }
            return {
                data: (domain === null || domain === void 0 ? void 0 : domain.scripts) || []
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getDomainToolsToken(domainId) {
        try {
            let tools = await this.googleApiTokenRepo.findAll({
                domains: domainId
            });
            return {
                data: tools,
                status: 200
            };
        }
        catch (error) {
            throw error;
        }
    }
    async initNginx() {
        try {
            // await this.nginx.init()
        }
        catch (error) {
            throw error;
        }
    }
    async setPaswword(password, admin, session) {
        try {
            if (!admin.isSuperAdmin) {
                return {
                    status: 400,
                    message: "این قسمت مخصوص ادمین اصلی است"
                };
            }
            var verifed = await this.adminRepo.comparePassword(admin, password);
            if (verifed) {
                var expired = Date.now() + (1000 * 300);
                session["domain_expired"] = expired;
                return {
                    status: 200,
                    data: { expired },
                    message: "موفق",
                    session
                };
            }
            else {
                return {
                    status: 400,
                    message: "رمز غلط"
                };
            }
        }
        catch (error) {
            throw error;
        }
    }
    checkPasswordExpired(session) {
        var expired = session["domain_expired"];
        if (!expired || expired < Date.now()) {
            return {
                status: 403,
                data: { sendPassword: true },
                message: "عدم دسترسی"
            };
        }
        return {
            next: true
        };
    }
    getPasswordExpire(session) {
        var expired = session["domain_expired"];
        if (!expired || expired < Date.now()) {
            return {
                status: 403,
                data: { sendPassword: true },
                message: "عدم دسترسی"
            };
        }
        return {
            // next: true
            status: 200,
            data: { expired }
        };
    }
    expirePassword(session) {
        session["domain_expired"] = Date.now() - 10000;
        return {
            session,
            status: 200
        };
    }
    async changeDomain(source, destination) {
        try {
        }
        catch (error) {
        }
        return {};
    }
    async getDefaultDomain() {
        try {
            return this.findOne({
                isDefault: true
            });
        }
        catch (error) {
            throw error;
        }
    }
    async getAdminDomain() {
        try {
            return this.findOne({
                adminDomain: true
            });
        }
        catch (error) {
            throw error;
        }
    }
    async updateDomain(id, data) {
        try {
            if (data.public) {
                data.certificate = {
                    public: data.public,
                    private: data.private,
                    "options-ssl": data["options-ssl"],
                    "ssl-dhparams": data["ssl-dhparams"],
                };
            }
            const domain = await this.repository.findById(id);
            if (domain == null) {
                return {
                    status: 404
                };
            }
            if (data.isDefault == true && data.adminDomain == true) {
                return {
                    status: 400,
                    message: "دامنه نمیتواند همزمان برای سایت و پنل ادمین استفاده شود"
                };
            }
            if (data.adminDomain == true) {
                await this.repository.updateOne({
                    adminDomain: true
                }, {
                    $set: {
                        adminDomain: false
                    }
                });
            }
            if (data.cptchaInfo) {
                await this.repository.updateOne({
                    _id: id
                }, {
                    $set: {
                        cptchaInfo: data.cptchaInfo
                    }
                });
            }
            if (data.isDefault && domain.isDefault != true) {
                let language = await this.langRepo.findOne({
                    domain: id
                });
                if (language != null) {
                    return {
                        status: 400,
                        message: "این دامنه برای یک زبان اختصاصی است و نمیتوان ب عنوان دامنه پیشفرض از آن استفاده کرد",
                        data: {
                            language
                        }
                    };
                }
                let exDefualt = await this.repository.findOneAndUpdate({
                    isDefault: true
                }, {
                    $set: {
                        isDefault: false
                    }
                });
                await this.repository.updateOne({
                    _id: id
                }, {
                    $set: data
                });
                await this.domainRedirectRepo.updateMany({
                    status: true,
                    from: id
                }, {
                    $set: {
                        status: false
                    }
                });
                if (exDefualt != null) {
                    let r = await this.domainRedirectRepo.insert({
                        from: exDefualt._id,
                        to: id,
                    });
                }
                this.nginx.init();
            }
            else if (domain.isDefault && data.isDefault == false) {
                return {
                    status: 400,
                    message: "دامنه پیشفرض قابل تغییر نیست( ابتدا دامنه پیشفرض جدید را مشخص کنید)",
                    data: {
                        isDefault: true
                    }
                };
            }
            else {
                await this.repository.updateOne({
                    _id: id
                }, {
                    $set: data
                });
            }
            return {
                status: 200
            };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async deleteDomain(id) {
        try {
            const domain = await this.repository.findById(id);
            if (domain == null) {
                return {
                    status: 404
                };
            }
            if (domain.isDefault) {
                return {
                    status: 400,
                    message: "دامنه پیش‌فرض قابل حذف نیست",
                };
            }
            if (domain.adminDomain) {
                return {
                    status: 400,
                    message: "دامنه پیش‌فرض ادمین قابل حذف نیست",
                };
            }
            let language = await this.langRepo.findOne({
                domain
            });
            if (language != null) {
                return {
                    status: 400,
                    message: "این دامنه متصل به یک زبان است و قابل حذف نیست"
                };
            }
            return this.delete(id);
        }
        catch (error) {
            throw error;
        }
    }
    async getDomains(id) {
        return this.findById(id);
    }
    async create(data, ...params) {
        var _a;
        if (data.public) {
            data.certificate = {
                public: data.public,
                private: data.private,
                "options-ssl": data["options-ssl"],
                "ssl-dhparams": data["ssl-dhparams1"],
            };
        }
        if (data.isDefault == true && data.adminDomain == true) {
            return {
                status: 400,
                message: "دامنه نمیتواند همزمان برای سایت و پنل ادمین استفاده شود"
            };
        }
        if (data.isDefault) {
            let exDefualt = await this.repository.findOneAndUpdate({
                isDefault: true
            }, {
                $set: {
                    isDefault: false
                }
            });
            let r = await super.create(data);
            if (!((_a = r.status) === null || _a === void 0 ? void 0 : _a.toString().startsWith("2"))) {
                this.repository.updateOne({
                    _id: exDefualt === null || exDefualt === void 0 ? void 0 : exDefualt._id
                }, {
                    $set: {
                        isDefault: true
                    }
                });
                return r;
            }
            await this.domainRedirectRepo.updateMany({
                status: true,
                from: r.data._id
            }, {
                $set: {
                    status: false
                }
            });
            if (exDefualt != null) {
                await this.domainRedirectRepo.insert({
                    from: exDefualt._id,
                    to: r.data._id,
                });
            }
            this.nginx.init();
            return r;
        }
        return super.create(data);
    }
    async search(page, limit, reqQuery, admin, ...params) {
        return super.search(page, limit, reqQuery, admin);
    }
    initApis() {
        // super.initApis()
        this.addRouteWithMeta("/search", "get", this.search.bind(this), Object.assign(controller_1.default.searcheMeta, {
            absolute: false
        }));
    }
    serve() {
        return super.serve();
    }
    async validateCanBeDefault() {
    }
}
exports.DomainController = DomainController;
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "domain",
        schema: controller_1.default.id
    }))
], DomainController.prototype, "getConfig", null);
__decorate([
    (0, method_1.Post)("/script", {
        contentType: "application/x-www-form-urlencoded"
    }),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            key: zod_1.z.string(),
            content: zod_1.z.string()
        })
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "domain",
        schema: controller_1.default.id
    }))
], DomainController.prototype, "setJsScript", null);
__decorate([
    (0, method_1.Get)("/script"),
    __param(0, (0, parameters_1.Query)({
        schema: controller_1.default.id,
        destination: "domain"
    }))
], DomainController.prototype, "getJsScripts", null);
__decorate([
    (0, method_1.Get)("/tools"),
    __param(0, (0, parameters_1.Query)({
        destination: "domain",
        schema: controller_1.default.id
    }))
], DomainController.prototype, "getDomainToolsToken", null);
__decorate([
    (0, method_1.Post)("/password"),
    __param(0, (0, parameters_1.Body)({
        destination: "password",
        schema: zod_1.z.string().min(8)
    })),
    __param(1, (0, parameters_1.Admin)()),
    __param(2, (0, parameters_1.Session)())
], DomainController.prototype, "setPaswword", null);
__decorate([
    (0, method_1.PreExec)({
        method: "post",
        route: ""
    }),
    (0, method_1.PreExec)({
        method: "put",
        route: ""
    }),
    (0, method_1.PreExec)({
        method: "delete",
        route: ""
    }),
    (0, method_1.PreExec)({
        method: "get",
        route: ""
    }),
    (0, method_1.PreExec)({
        method: "post",
        route: "/change"
    }),
    __param(0, (0, parameters_1.Session)())
], DomainController.prototype, "checkPasswordExpired", null);
__decorate([
    (0, method_1.Get)("/password/expire"),
    __param(0, (0, parameters_1.Session)())
], DomainController.prototype, "getPasswordExpire", null);
__decorate([
    (0, method_1.Post)("/password/expire"),
    __param(0, (0, parameters_1.Session)())
], DomainController.prototype, "expirePassword", null);
__decorate([
    (0, method_1.Post)("/change"),
    __param(0, (0, parameters_1.Body)({
        destination: "source",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "destination",
        schema: controller_1.default.id
    }))
], DomainController.prototype, "changeDomain", null);
__decorate([
    (0, method_1.Get)("/default")
], DomainController.prototype, "getDefaultDomain", null);
__decorate([
    (0, method_1.Get)("/admin")
], DomainController.prototype, "getAdminDomain", null);
__decorate([
    (0, method_1.Put)(""),
    __param(0, (0, parameters_1.Query)({
        schema: controller_1.default.id,
        destination: "id"
    })),
    __param(1, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            isDefault: controller_1.default.booleanFromquery.default("false"),
            sslType: zod_1.z.enum([
                "none",
                "certificate",
                "interim"
            ]),
            public: zod_1.z.string().optional(),
            private: zod_1.z.string().optional(),
            "options-ssl": zod_1.z.string().optional(),
            "ssl-dhparams": zod_1.z.string().optional(),
            adminDomain: controller_1.default.booleanFromquery.default("false"),
            cptchaInfo: zod_1.z.object({
                site_key: zod_1.z.string().optional(),
                secret_key: zod_1.z.string().optional()
            }).optional()
        })
    }))
], DomainController.prototype, "updateDomain", null);
__decorate([
    (0, method_1.Delete)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    }))
], DomainController.prototype, "deleteDomain", null);
__decorate([
    (0, method_1.Get)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    }))
], DomainController.prototype, "getDomains", null);
__decorate([
    (0, method_1.Post)("", {
        contentType: "application/x-www-form-urlencoded"
    }),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            domain: zod_1.z.string(),
            sslType: zod_1.z.enum([
                "none",
                "certificate",
                "interim"
            ]),
            public: zod_1.z.string().optional(),
            private: zod_1.z.string().optional(),
            "options-ssl": zod_1.z.string().optional(),
            "ssl-dhparams": zod_1.z.string().optional(),
            isDefault: controller_1.default.booleanFromquery.default("false"),
            config: zod_1.z.any(),
            adminDomain: controller_1.default.booleanFromquery.default("false"),
            cptchaInfo: zod_1.z.object({
                site_key: zod_1.z.string().optional(),
                secret_key: zod_1.z.string().optional()
            }).optional()
        }),
    }))
], DomainController.prototype, "create", null);
// export default domain
