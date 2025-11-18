"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCertificateExpiration = getCertificateExpiration;
const repository_1 = __importDefault(require("../../repository"));
const model_1 = require("./model");
const nginx_1 = require("../../../services/nginx/nginx");
const fs_1 = __importDefault(require("fs"));
const web_push_1 = __importDefault(require("web-push"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const repository_2 = __importDefault(require("../language/repository"));
const config_1 = __importDefault(require("../../../services/config"));
const execPromise = (0, util_1.promisify)(child_process_1.exec);
async function getCertificateExpiration(domain) {
    try {
        let res = await execPromise(`echo | openssl s_client -servername ${domain} -connect ${domain}:443 2>/dev/null | openssl x509 -noout -dates`);
        let stdout = res.stdout;
        const expirationLine = stdout.split('notAfter=')[1];
        return expirationLine;
    }
    catch (error) {
        // console.error('Error getting certificate expiration:', error);
    }
    return null;
}
class DomainRepository extends repository_1.default {
    constructor(options) {
        super(model_1.DomainModel, options);
        this.languageRepo = new repository_2.default();
    }
    async initDomainsNotification() {
        try {
            let domains = await this.findAll({});
            for (let i = 0; i < domains.length; i++) {
                if (domains[i].notificationConfig == undefined) {
                    const vapidKeys = web_push_1.default.generateVAPIDKeys();
                    await this.updateOne({
                        _id: domains[i]._id
                    }, {
                        $set: {
                            notificationConfig: {
                                publicKey: vapidKeys.publicKey,
                                privateKey: vapidKeys.privateKey,
                                email: config_1.default.getConfig("email")
                            }
                        }
                    });
                }
            }
        }
        catch (error) {
            throw error;
        }
    }
    insert(document, options) {
        let result = super.insert(document, options);
        if (document.adminDomain) {
            this.updateOne({
                _id: {
                    $ne: document._id
                },
                adminDomain: true
            }, {
                $set: {
                    adminDomain: false
                }
            });
        }
        if (document.sslType == "interim") {
            (0, nginx_1.addNewDomainSSL)(document.domain);
        }
        this.initDomainsNotification();
        return result;
    }
    async updateOne(query, update, options) {
        var _a, _b;
        let result = super.updateOne(query, update, options);
        if (((_a = update.$set) === null || _a === void 0 ? void 0 : _a.sslType) == "interim") {
            let domain = await this.findOne(query);
            (0, nginx_1.addNewDomainSSL)((domain === null || domain === void 0 ? void 0 : domain.domain) || "");
        }
        if (((_b = update.$set) === null || _b === void 0 ? void 0 : _b.sslType) == "none") {
            try {
                fs_1.default.unlinkSync(`/etc/nginx/conf.d/${query.domain}.conf`);
            }
            catch (error) {
                console.log(error);
            }
        }
        return result;
    }
    async updateById(id, update, options) {
        var _a, _b;
        let result = super.updateById(id, update, options);
        if (((_a = update.$set) === null || _a === void 0 ? void 0 : _a.sslType) == "interim") {
            let domain = await this.findById(id);
            (0, nginx_1.addNewDomainSSL)((domain === null || domain === void 0 ? void 0 : domain.domain) || "");
        }
        if (((_b = update.$set) === null || _b === void 0 ? void 0 : _b.sslType) == "none") {
            try {
                fs_1.default.unlinkSync(`/etc/nginx/conf.d/${id}.conf`);
            }
            catch (error) {
                console.log(error);
            }
        }
        return result;
    }
    async paginate(query, limit, page, options) {
        let res = await super.paginate(query, limit, page, options);
        for (let i = 0; i < res.list.length; i++) {
            if (res.list[i].sslType == "certificate" || res.list[i].sslType == "interim") {
                let expirationDate = await getCertificateExpiration(res.list[i].domain);
                if (expirationDate) {
                    res.list[i].certificateExpiration = new Date(expirationDate);
                }
                let language = await this.languageRepo.findOne({
                    domain: res.list[i]._id
                });
                if (language != null) {
                    res.list[i].language = language;
                }
                // console.log(res.list[i].domain , res.list[i].certificateExpiration)
            }
        }
        return res;
    }
}
exports.default = DomainRepository;
