"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addDomainSSL = addDomainSSL;
exports.addNewDomainSSL = addNewDomainSSL;
const util_1 = require("util");
const repository_1 = __importDefault(require("../../mongoose-controller/repositories/domain/repository"));
const repository_2 = __importDefault(require("../../mongoose-controller/repositories/redirect/repository"));
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
const repository_3 = __importDefault(require("../../mongoose-controller/repositories/content/repository"));
const config_1 = __importDefault(require("../config"));
const repository_4 = __importDefault(require("../../mongoose-controller/repositories/domainRedirect/repository"));
const writeFile = (0, util_1.promisify)(fs_1.default.writeFile);
const mkdir = (0, util_1.promisify)(fs_1.default.mkdir);
const unlink = (0, util_1.promisify)(fs_1.default.unlink);
const checkExists = (0, util_1.promisify)(fs_1.default.exists);
async function addDomainSSL(domain) {
    return new Promise((resolve, reject) => {
        (0, child_process_1.exec)(`certbot --nginx -d ${domain}`, (err, stdout, stderr) => {
            if (err) {
                console.log("reject", err);
                reject();
            }
            else
                resolve(true);
        });
    });
}
async function addNewDomainSSL(domain) {
    try {
        let domainConfig = `server {


            server_name ${domain}; # managed by Certbot
    
         
            
            location * {
                return 404;
            }
            
            listen 80 ;
            listen [::]:80 ;
            server_name ${domain};
            return 404; 
    }
  `;
        let config = await fs_1.default.promises.readFile("/etc/nginx/sites-enabled/default", 'utf-8');
        if (!config.includes(`server_name ${domain};`)) {
            config += domainConfig;
            await writeFile(config_1.default.getConfig("nginxPath") + "sites-available/default", config);
            await writeFile(config_1.default.getConfig("nginxPath") + "sites-enabled/default", config);
            await new Promise((resolve, reject) => {
                (0, child_process_1.exec)("service nginx restart", (err, stdout, stderr) => {
                    resolve({});
                });
            });
        }
        //check domain ssl already exists 
        let exists = await checkExists("/etc/letsencrypt/live/" + domain + "/");
        if (!exists) {
            //add domain ssl
            await addDomainSSL(domain);
        }
        // add 
        //update nginx config
        let nginx = new Nginx(new repository_3.default());
        await nginx.init();
    }
    catch (error) {
        console.log(error);
    }
}
async function renewDomainSSL() {
    return new Promise((resolve, reject) => {
        console.log("running");
        (0, child_process_1.exec)("certbot renew --nginx ", (err, stdout, stderr) => {
            if (err) {
                console.log("reject", err);
                reject();
            }
            else
                resolve(true);
            console.log(stderr, stdout);
        });
    });
}
async function test() {
    try {
        await renewDomainSSL();
    }
    catch (error) {
    }
}
// test()
// const contentRepo: ContentRepository = new ContentRepository()
class Nginx {
    constructor(contentRepo) {
        this.domainRepo = new repository_1.default();
        this.langRepo = this.domainRepo.languageRepo;
        this.redirectRepo = new repository_2.default();
        this.domainRedirectRepo = new repository_4.default();
        this.contentRepo = contentRepo;
    }
    /*
           This function is responsible for generating the nginx configuration file.
    */
    async init() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        try {
            let languages = await this.langRepo.findAll({});
            let domainIDs = [];
            for (let i = 0; i < languages.length; i++) {
                if (languages[i].domain)
                    domainIDs.push(languages[i].domain);
            }
            let redirectDomains = await this.redirectRepo.findAll({
                status: {
                    $ne: false
                },
                domain: {
                    $exists: true
                }
            });
            let otherDomainsID = [];
            for (let i = 0; i < redirectDomains.length; i++) {
                if (!(otherDomainsID.includes(redirectDomains[i].domain.toHexString())
                    && !domainIDs.includes(redirectDomains[i].domain.toHexString()))) {
                    otherDomainsID.push(redirectDomains[i].domain.toHexString());
                }
            }
            let domainRedirects = await this.domainRedirectRepo.findAll({
                status: true
            });
            for (let i = 0; i < domainRedirects.length; i++) {
                if (!(otherDomainsID.includes(domainRedirects[i].from.toHexString())
                    && !domainIDs.includes(domainRedirects[i].from.toHexString()))) {
                    otherDomainsID.push(domainRedirects[i].from.toHexString());
                }
            }
            let domains = await this.domainRepo.findAll({
                $or: [{
                        isDefault: true
                    }, {
                        _id: {
                            $in: domainIDs
                        }
                    }]
            });
            let resultConfig = "";
            const adminDomain = await this.domainRepo.findOne({
                adminDomain: true
            });
            if (adminDomain != null) {
                let certificate;
                if (adminDomain.sslType == "certificate") {
                    certificate = await this.createSSLs(((_a = adminDomain.certificate) === null || _a === void 0 ? void 0 : _a.public) || "", ((_b = adminDomain.certificate) === null || _b === void 0 ? void 0 : _b.private) || "", ((_c = adminDomain.certificate) === null || _c === void 0 ? void 0 : _c["options-ssl"]) || "", ((_d = adminDomain.certificate) === null || _d === void 0 ? void 0 : _d["ssl-dhparams"]) || "", adminDomain.domain);
                }
                if (adminDomain.sslType == "interim") {
                    let exists = await checkExists("/etc/letsencrypt/live/" + adminDomain.domain + "/");
                    if (!exists) {
                        try {
                            console.log("adminDomain", adminDomain);
                            await addDomainSSL(adminDomain.domain);
                            exists = await checkExists("/etc/letsencrypt/live/" + adminDomain.domain + "/");
                            if (exists) {
                                certificate = {
                                    fullchain: "/etc/letsencrypt/live/" + adminDomain.domain + "/fullchain.pem",
                                    private: "/etc/letsencrypt/live/" + adminDomain.domain + "/privkey.pem",
                                    "options-ssl": "/etc/letsencrypt/options-ssl-nginx.conf",
                                    "ssl-dhparams": "/etc/letsencrypt/ssl-dhparams.pem",
                                };
                            }
                        }
                        catch (error) {
                        }
                    }
                    else {
                        certificate = {
                            fullchain: "/etc/letsencrypt/live/" + adminDomain.domain + "/fullchain.pem",
                            private: "/etc/letsencrypt/live/" + adminDomain.domain + "/privkey.pem",
                            "options-ssl": "/etc/letsencrypt/options-ssl-nginx.conf",
                            "ssl-dhparams": "/etc/letsencrypt/ssl-dhparams.pem",
                        };
                    }
                }
                resultConfig += await this.getAdminDomainNginx(adminDomain.domain, {
                    type: adminDomain.sslType,
                    certificate
                });
            }
            // console.log("adminDomain", adminDomain?.domain)
            for (let i = 0; i < domains.length; i++) {
                let redirects = await this.getRedirects(domains[i]._id);
                // console.log(i, domains[i].domain, redirects.length)
                let certificate;
                if (domains[i].sslType == "certificate") {
                    certificate = await this.createSSLs(((_e = domains[i].certificate) === null || _e === void 0 ? void 0 : _e.public) || "", ((_f = domains[i].certificate) === null || _f === void 0 ? void 0 : _f.private) || "", ((_g = domains[i].certificate) === null || _g === void 0 ? void 0 : _g["options-ssl"]) || "", ((_h = domains[i].certificate) === null || _h === void 0 ? void 0 : _h["ssl-dhparams"]) || "", domains[i].domain);
                }
                else if (domains[i].sslType == "interim") {
                    let exists = await checkExists("/etc/letsencrypt/live/" + domains[i].domain + "/");
                    if (!exists) {
                        try {
                            await addDomainSSL(domains[i].domain);
                            exists = await checkExists("/etc/letsencrypt/live/" + domains[i].domain + "/");
                            if (exists) {
                                certificate = {
                                    fullchain: "/etc/letsencrypt/live/" + domains[i].domain + "/fullchain.pem",
                                    private: "/etc/letsencrypt/live/" + domains[i].domain + "/privkey.pem",
                                    "options-ssl": "/etc/letsencrypt/options-ssl-nginx.conf",
                                    "ssl-dhparams": "/etc/letsencrypt/ssl-dhparams.pem",
                                };
                            }
                        }
                        catch (error) {
                        }
                    }
                    else {
                        certificate = {
                            fullchain: "/etc/letsencrypt/live/" + domains[i].domain + "/fullchain.pem",
                            private: "/etc/letsencrypt/live/" + domains[i].domain + "/privkey.pem",
                            "options-ssl": "/etc/letsencrypt/options-ssl-nginx.conf",
                            "ssl-dhparams": "/etc/letsencrypt/ssl-dhparams.pem",
                        };
                    }
                }
                resultConfig += await this.getNginxConfig(domains[i].domain, redirects, {
                    type: domains[i].sslType,
                    certificate
                }, domains[i].isDefault && adminDomain == null, domains[i]._id, domains[i].bucketName);
            }
            // console.log("otherDomainsID" , otherDomainsID)
            let otherDomains = await this.domainRepo.findAll({
                _id: {
                    $in: otherDomainsID
                }
            });
            for (let i = 0; i < otherDomains.length; i++) {
                let redirects = await this.getRedirects(otherDomains[i]._id);
                // console.log(i, otherDomains[i].domain, redirects.length)
                let certificate;
                if (otherDomains[i].sslType == "certificate") {
                    certificate = await this.createSSLs(((_j = otherDomains[i].certificate) === null || _j === void 0 ? void 0 : _j.public) || "", ((_k = otherDomains[i].certificate) === null || _k === void 0 ? void 0 : _k.private) || "", ((_l = otherDomains[i].certificate) === null || _l === void 0 ? void 0 : _l["options-ssl"]) || "", ((_m = otherDomains[i].certificate) === null || _m === void 0 ? void 0 : _m["ssl-dhparams"]) || "", otherDomains[i].domain);
                }
                else if (otherDomains[i].sslType == "interim") {
                    let exists = await checkExists("/etc/letsencrypt/live/" + otherDomains[i].domain + "/");
                    if (!exists) {
                        try {
                            await addDomainSSL(otherDomains[i].domain);
                            exists = await checkExists("/etc/letsencrypt/live/" + otherDomains[i].domain + "/");
                            if (exists) {
                                certificate = {
                                    fullchain: "/etc/letsencrypt/live/" + otherDomains[i].domain + "/fullchain.pem",
                                    private: "/etc/letsencrypt/live/" + otherDomains[i].domain + "/privkey.pem",
                                    "options-ssl": "/etc/letsencrypt/options-ssl-nginx.conf",
                                    "ssl-dhparams": "/etc/letsencrypt/ssl-dhparams.pem",
                                };
                            }
                        }
                        catch (error) {
                        }
                    }
                    else {
                        certificate = {
                            fullchain: "/etc/letsencrypt/live/" + otherDomains[i].domain + "/fullchain.pem",
                            private: "/etc/letsencrypt/live/" + otherDomains[i].domain + "/privkey.pem",
                            "options-ssl": "/etc/letsencrypt/options-ssl-nginx.conf",
                            "ssl-dhparams": "/etc/letsencrypt/ssl-dhparams.pem",
                        };
                    }
                }
                resultConfig += await this.getNginxConfig(otherDomains[i].domain, redirects, {
                    type: otherDomains[i].sslType,
                    certificate
                }, otherDomains[i].isDefault && adminDomain == null, otherDomains[i]._id, otherDomains[i].bucketName);
            }
            await writeFile(config_1.default.getConfig("nginxPath") + "sites-available/default", resultConfig);
            await writeFile(config_1.default.getConfig("nginxPath") + "sites-enabled/default", resultConfig);
            (0, child_process_1.exec)("service nginx restart");
        }
        catch (error) {
            console.log("error", error);
        }
    }
    async createSSLs(public_key, private_key, options_ssl, ssl_dhparams, domainName) {
        let res = {};
        let configPath = config_1.default.getConfig("nginxPath");
        try {
            await mkdir(configPath + domainName);
        }
        catch (error) {
        }
        const domainPath = configPath + domainName + "/";
        await writeFile(domainPath + "fullchain.pem", public_key);
        res["fullchain"] = domainPath + "fullchain.pem";
        await writeFile(domainPath + "privkey.pem", private_key);
        res["private"] = domainPath + "privkey.pem";
        await writeFile(domainPath + "options-ssl-nginx.conf", options_ssl);
        res["options-ssl"] = domainPath + "options-ssl-nginx.conf";
        await writeFile(domainPath + "ssl-dhparams.pem", ssl_dhparams);
        res["ssl-dhparams"] = domainPath + "ssl-dhparams.pem";
        return res;
    }
    async getRedirects(domain) {
        let redirect = "";
        try {
            redirect += await this.getOneToOneRedirects(domain, "update");
            redirect += await this.getOneToOneRedirects(domain, "language");
            redirect += await this.getOneToOneRedirects(domain, "oldToNew");
            redirect += await this.getOneToOneRedirects(domain, "important");
            redirect += await this.getRegexRedirects(domain);
            redirect += await this.getOneToOneRedirects(domain);
        }
        catch (error) {
        }
        return redirect;
    }
    async getOneToOneRedirects(domain, type) {
        const domainDoc = await this.domainRepo.findById(domain);
        let redirect = "";
        let q = {
            domain,
            status: {
                $ne: false
            },
            type: type || "1To1"
        };
        if (domainDoc === null || domainDoc === void 0 ? void 0 : domainDoc.isDefault) {
            q = {
                $or: [
                    {
                        domain
                    },
                    {
                        domain: {
                            $exists: false
                        }
                    },
                ],
                status: {
                    $ne: false
                },
                type: type || "1To1"
            };
        }
        const redirects = await this.redirectRepo.findAll(q);
        let defaultDomain = await this.domainRepo.findOne({
            isDefault: true
        });
        for (let i = 0; i < redirects.length; i++) {
            let from = "";
            let to = "";
            if (redirects[i].fromStatic == false) {
                let c = await this.contentRepo.findById(redirects[i].from);
                if (c == null) {
                    continue;
                }
                from = c.url;
            }
            else {
                from = redirects[i].from;
            }
            if (redirects[i].toStatic == false) {
                let c = await this.contentRepo.findById(redirects[i].to);
                if (c == null) {
                    continue;
                }
                to = c.url;
            }
            else {
                to = redirects[i].to;
            }
            if ((domainDoc === null || domainDoc === void 0 ? void 0 : domainDoc._id) != (defaultDomain === null || defaultDomain === void 0 ? void 0 : defaultDomain._id)
                && to.startsWith("/")) {
                // await this
                to = ((defaultDomain === null || defaultDomain === void 0 ? void 0 : defaultDomain.sslType) == "none" ? "http://" : "https://") + (defaultDomain === null || defaultDomain === void 0 ? void 0 : defaultDomain.domain) + to;
            }
            else if (!to.startsWith("/")) {
                let d = to.split("/")[0];
                let domain = await this.domainRepo.findOne({ domain: d });
                if (domain != null) {
                    to = ((domain === null || domain === void 0 ? void 0 : domain.sslType) == "none" ? "http://" : "https://") + to;
                }
            }
            redirect += `
            location = ${from.replace((domainDoc === null || domainDoc === void 0 ? void 0 : domainDoc.domain) || "", "")} {
                return ${redirects[i].code} ${to};
            }
            `;
        }
        return redirect;
    }
    async getRegexRedirects(domain) {
        let redirect = "";
        let redirects = await this.redirectRepo.findAll({
            $or: [
                {
                    domain
                },
                {
                    domain: {
                        $exists: false
                    }
                }
            ],
            status: {
                $ne: false
            },
            type: "regex"
        });
        for (let i = 0; i < redirects.length; i++) {
            redirect += this.getRegexRedirect(redirects[i]);
        }
        return redirect;
    }
    getRegexRedirect(redirect) {
        let words = redirect.from.split("{");
        words.shift();
        for (let i = 0; i < words.length; i++) {
            if (words[i].includes("}")) {
                words[i] = words[i].split("}")[0];
            }
        }
        let from = `${redirect.from}`;
        let to = redirect.to;
        for (let i = 0; i < words.length; i++) {
            if (redirect.regexConfig[words[i]] == "number") {
                from = from.replace(`{${words[i]}}`, "([0-9]+)");
            }
            else if (redirect.regexConfig[words[i]] == "word") {
                from = from.replace(`{${words[i]}}`, `(\\w+)`);
            }
            else {
                from = from.replace(`{${words[i]}}`, "(.+)");
            }
            to = to.replace(`{${words[i]}}`, `$${i + 1}`);
        }
        return `
            location ~* ^${from}$ {
                return ${redirect.code} ${to};
            }
        `;
    }
    async getAdminDomainNginx(domainName, ssl) {
        var _a, _b;
        let sslConfig = "";
        let extraConfig = "";
        if (ssl.type == "certificate" || (ssl.type == "interim" && ssl.certificate != undefined)) {
            sslConfig = `
            listen [::]:443 ssl; 
            listen 443 ssl;
            ssl_certificate ${(_a = ssl.certificate) === null || _a === void 0 ? void 0 : _a.fullchain}; 
            ssl_certificate_key ${(_b = ssl.certificate) === null || _b === void 0 ? void 0 : _b.private};`;
            extraConfig = `
            server {
                if ($host = ${domainName}) {
                    return 301 https://$host$request_uri;
                }
                listen 80 ;
                listen [::]:80 ;
                server_name ${domainName};
                return 404; 
            }
            `;
        }
        else {
            sslConfig = `
            listen 80 ;
            listen [::]:80 ;
            server_name ${domainName};
            return 404; 
            `;
        }
        let result = `server {
    
    
            server_name ${domainName}; # managed by Certbot
    
            location /google {
                client_max_body_size 1000M;
                proxy_pass http://localhost:7000;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
             } 

            location /api {
                client_max_body_size 1000M;
                proxy_pass http://localhost:7000;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
             }
             location /uploads {
                client_max_body_size 1000M;
                proxy_pass http://localhost:7000;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
             }
             location /apis {
     
                 client_max_body_size 1000M;
                proxy_pass http://localhost:7000;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
             }


            location /docs {
    
                client_max_body_size 1000M;
               proxy_pass http://localhost:7000;
               proxy_set_header Host $host;
               proxy_set_header X-Real-IP $remote_addr;
            }
             location /socket.io {
                client_max_body_size 1000M;
                proxy_pass http://localhost:7000;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
             }

               
             location /admin/template {
                client_max_body_size 1000M;
                proxy_pass http://localhost:4200;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
            }
             
            location /admin {
                root /var/www/html;
                try_files $uri $uri/ /admin/index.html;
            }

            location /files {
                client_max_body_size 1000M;
                proxy_pass http://localhost:9000;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
             }




            
            location * {
                return 404;
            }
            ${sslConfig}
    }
    ${extraConfig}
  `;
        return result;
    }
    async getNginxConfig(domainName, redirects, ssl, adminDomain = false, domainId, bucketName) {
        var _a, _b, _c, _d;
        let localfiles = "";
        if (bucketName != undefined) {
            localfiles = `
            location /files/ {
                rewrite ^/files/(.*)$ /${bucketName}/$1 break; 
                proxy_pass http://127.0.0.1:9000; 
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
            }
            `;
        }
        let adminRouting = "";
        if (adminDomain) {
            adminRouting = `
            location /admin {
                root /var/www/html;
                try_files $uri $uri/ /admin/index.html;
            }

                
            location /google {
                client_max_body_size 1000M;
                proxy_pass http://localhost:7000;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
             } 

            
            `;
        }
        let sslConfig = "";
        let extraConfig = "";
        if (ssl.type == "certificate" || (ssl.type == "interim" && ssl.certificate != undefined)) {
            sslConfig = `
            listen [::]:443 ssl; 
            listen 443 ssl;
            ssl_certificate ${(_a = ssl.certificate) === null || _a === void 0 ? void 0 : _a.fullchain}; 
            ssl_certificate_key ${(_b = ssl.certificate) === null || _b === void 0 ? void 0 : _b.private};
            include ${(_c = ssl.certificate) === null || _c === void 0 ? void 0 : _c["options-ssl"]};
            ssl_dhparam ${(_d = ssl.certificate) === null || _d === void 0 ? void 0 : _d["ssl-dhparams"]};`;
            extraConfig = `
            server {
                if ($host = ${domainName}) {
                    return 301 https://$host$request_uri;
                }
                listen 80 ;
                listen [::]:80 ;
                server_name ${domainName};
                return 404; 
            }
            `;
        }
        else {
            sslConfig = `
            listen 80 ;
            listen [::]:80 ;
            server_name ${domainName};
            return 404; 
            `;
        }
        var domainRedirect = "";
        let r = await this.domainRedirectRepo.findOne({
            from: domainId,
            status: true
        });
        if (r != null) {
            let domainLang = await this.langRepo.isExists({
                domain: domainId,
                status: true
            });
            let toDomain = await this.domainRepo.findById(r.to);
            if (toDomain != null && !domainLang) {
                if (toDomain.sslType == "certificate" || toDomain.sslType == "interim")
                    domainRedirect = `return 301 https://${toDomain.domain}$request_uri;`;
                else
                    domainRedirect = `return 301 http://${toDomain.domain}$request_uri;`;
            }
        }
        let result = `server {
    
    
            server_name ${domainName}; # managed by Certbot

            ${localfiles}

            ${domainRedirect}

            ${redirects}


            
            location /api {
               client_max_body_size 1000M;
               proxy_pass http://localhost:7000;
               proxy_set_header Host $host;
               proxy_set_header X-Real-IP $remote_addr;
            }
            location /tag_ {
                client_max_body_size 1000M;
                proxy_pass http://localhost:7000;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
            }
            location /sitemap {
                client_max_body_size 1000M;
                proxy_pass http://localhost:7000;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
            }
            location /uploads {
               client_max_body_size 1000M;
               proxy_pass http://localhost:7000;
               proxy_set_header Host $host;
               proxy_set_header X-Real-IP $remote_addr;
            }
            location /apis {
    
                client_max_body_size 1000M;
               proxy_pass http://localhost:7000;
               proxy_set_header Host $host;
               proxy_set_header X-Real-IP $remote_addr;
            } 
            location /docs {
    
                client_max_body_size 1000M;
               proxy_pass http://localhost:7000;
               proxy_set_header Host $host;
               proxy_set_header X-Real-IP $remote_addr;
            }
            location /socket.io {
               client_max_body_size 1000M;
               proxy_pass http://localhost:7000;
               proxy_set_header Host $host;
               proxy_set_header X-Real-IP $remote_addr;
            }

            ${adminRouting}
            
            location /hassan {
                client_max_body_size 1000M;
                proxy_pass http://localhost:9000;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
             }


            location / {
                client_max_body_size 1000M;
                proxy_pass http://${config_1.default.getConfig("client")}:3000;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
             }
 

            ${sslConfig}
    }
    ${extraConfig}
  `;
        return result;
    }
    async updateDomainSSL(domain) {
        try {
            //delete domain ssl
            await unlink(config_1.default.getConfig("nginxPath") + "sites-available/" + domain + ".conf");
            await unlink(config_1.default.getConfig("nginxPath") + "sites-enabled/" + domain + ".conf");
            //add domain ssl
            await addDomainSSL(domain);
            await this.init();
        }
        catch (error) {
            console.log(error);
        }
    }
    async renewSSL() {
        try {
            await renewDomainSSL();
            await this.init();
        }
        catch (error) {
            console.log(error);
        }
    }
    async deleteDomainSSL(domain) {
        try {
            await unlink(config_1.default.getConfig("nginxPath") + "sites-available/" + domain + ".conf");
            await unlink(config_1.default.getConfig("nginxPath") + "sites-enabled/" + domain + ".conf");
            (0, child_process_1.exec)("service nginx restart");
        }
        catch (error) {
            console.log(error);
        }
    }
}
exports.default = Nginx;
