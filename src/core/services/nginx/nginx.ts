import { promisify } from "util";
import DomainRepository from "../../mongoose-controller/repositories/domain/repository";
import LanguageRepository from "../../mongoose-controller/repositories/language/repository";
import RedirectRepository from "../../mongoose-controller/repositories/redirect/repository";
import fs from "fs"
import { exec } from "child_process";
import Redirect from "../../mongoose-controller/repositories/redirect/model";
import ContentRepository from "../../mongoose-controller/repositories/content/repository";
import ConfigService from "../config";
import DomainRedirectRepository from "../../mongoose-controller/repositories/domainRedirect/repository";
import { Types } from "mongoose";

const writeFile = promisify(fs.writeFile)
const mkdir = promisify(fs.mkdir)
const unlink = promisify(fs.unlink)
const checkExists = promisify(fs.exists)


export async function addDomainSSL(domain: string) {
    return new Promise((resolve, reject) => {
        exec(`certbot --nginx -d ${domain}`, (err, stdout, stderr) => {
            if (err) {
                // console.log("reject", err)
                reject()
            }
            else
                resolve(true)
        })
    })

}

export async function addNewDomainSSL(
    domain: string
) {
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
  `


        let config = await fs.promises.readFile("/etc/nginx/sites-enabled/default", 'utf-8')
        if (!config.includes(`server_name ${domain};`)) {
            config += domainConfig

            await writeFile(ConfigService.getConfig("nginxPath") + "sites-available/default", config)
            await writeFile(ConfigService.getConfig("nginxPath") + "sites-enabled/default", config)
            await new Promise((resolve, reject) => {
                exec("service nginx restart", (err, stdout, stderr) => {
                    resolve({})
                })
            })
        }
        //check domain ssl already exists 
        let exists = await checkExists("/etc/letsencrypt/live/" + domain + "/")
        if (!exists) {
            //add domain ssl
            await addDomainSSL(domain)
        }

        // add 

        //update nginx config

        let nginx = new Nginx(new ContentRepository())
        await nginx.init()
    } catch (error) {
        // console.log(error)
    }
}

async function renewDomainSSL() {
    return new Promise((resolve, reject) => {
        exec("certbot renew --nginx ", (err, stdout, stderr) => {
            if (err) {
                // console.log("reject", err)
                reject()
            }
            else
                resolve(true)

        })
    })

}
async function test() {
    try {

        await renewDomainSSL()
    } catch (error) {

    }
}
// test()

// const contentRepo: ContentRepository = new ContentRepository()
export default class Nginx {
    langRepo: LanguageRepository
    domainRepo: DomainRepository
    redirectRepo: RedirectRepository
    contentRepo: ContentRepository
    domainRedirectRepo: DomainRedirectRepository
    constructor(contentRepo: ContentRepository) {
        
        this.domainRepo = new DomainRepository()
        this.langRepo = this.domainRepo.languageRepo
        this.redirectRepo = new RedirectRepository()
        this.domainRedirectRepo = new DomainRedirectRepository()
        this.contentRepo = contentRepo
    }

    /*
           This function is responsible for generating the nginx configuration file.
    */
    async init() {
        try {
            let languages = await this.langRepo.findAll({})
            let domainIDs = []

            for (let i = 0; i < languages.length; i++) {
                if (languages[i].domain)
                    domainIDs.push(languages[i].domain)
            }
            let redirectDomains = await this.redirectRepo.findAll({
                status: {
                    $ne: false
                },
                domain: {
                    $exists: true
                }
            })



            let otherDomainsID: string[] = []
            for (let i = 0; i < redirectDomains.length; i++) {
                if (
                    !(otherDomainsID.includes((redirectDomains[i].domain as Types.ObjectId).toHexString())
                        && !domainIDs.includes((redirectDomains[i].domain as Types.ObjectId).toHexString()))
                ) {
                    otherDomainsID.push((redirectDomains[i].domain as Types.ObjectId).toHexString())
                }
            }

            let domainRedirects = await this.domainRedirectRepo.findAll({
                status: true
            })

            for (let i = 0; i < domainRedirects.length; i++) {
                if (
                    !(otherDomainsID.includes((domainRedirects[i].from as Types.ObjectId).toHexString())
                        && !domainIDs.includes((domainRedirects[i].from as Types.ObjectId).toHexString()))
                ) {
                    otherDomainsID.push((domainRedirects[i].from as Types.ObjectId).toHexString())
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
            })
            let resultConfig = ""
            const adminDomain = await this.domainRepo.findOne({
                adminDomain: true
            })

            if (adminDomain != null) {
                let certificate



                if (adminDomain.sslType == "certificate") {

                    certificate = await this.createSSLs(
                        adminDomain.certificate?.public || "",
                        adminDomain.certificate?.private || "",
                        adminDomain.certificate?.["options-ssl"] || "",
                        adminDomain.certificate?.["ssl-dhparams"] || "",
                        adminDomain.domain
                    )
                }

                if (adminDomain.sslType == "interim") {
                    let exists = await checkExists("/etc/letsencrypt/live/" + adminDomain.domain + "/")
                    if (!exists) {
                        try {
                            await addDomainSSL(adminDomain.domain)
                            exists = await checkExists("/etc/letsencrypt/live/" + adminDomain.domain + "/")
                            if (exists) {
                                certificate = {
                                    fullchain: "/etc/letsencrypt/live/" + adminDomain.domain + "/fullchain.pem",
                                    private: "/etc/letsencrypt/live/" + adminDomain.domain + "/privkey.pem",
                                    "options-ssl": "/etc/letsencrypt/options-ssl-nginx.conf",
                                    "ssl-dhparams": "/etc/letsencrypt/ssl-dhparams.pem",
                                }
                            }
                        } catch (error) {

                        }

                    }

                    else {
                        certificate = {
                            fullchain: "/etc/letsencrypt/live/" + adminDomain.domain + "/fullchain.pem",
                            private: "/etc/letsencrypt/live/" + adminDomain.domain + "/privkey.pem",
                            "options-ssl": "/etc/letsencrypt/options-ssl-nginx.conf",
                            "ssl-dhparams": "/etc/letsencrypt/ssl-dhparams.pem",
                        }
                    }
                }


                resultConfig += await this.getAdminDomainNginx(adminDomain.domain, {
                    type: adminDomain.sslType,
                    certificate
                }

                )
            }

            for (let i = 0; i < domains.length; i++) {
                let redirects = await this.getRedirects(domains[i]._id)


                let certificate
                if (domains[i].sslType == "certificate") {
                    certificate = await this.createSSLs(
                        domains[i].certificate?.public || "",
                        domains[i].certificate?.private || "",
                        domains[i].certificate?.["options-ssl"] || "",
                        domains[i].certificate?.["ssl-dhparams"] || "",
                        domains[i].domain
                    )
                }


                else if (domains[i].sslType == "interim") {
                    let exists = await checkExists("/etc/letsencrypt/live/" + domains[i].domain + "/")
                    if (!exists) {
                        try {
                            await addDomainSSL(domains[i].domain)
                            exists = await checkExists("/etc/letsencrypt/live/" + domains[i].domain + "/")
                            if (exists) {
                                certificate = {
                                    fullchain: "/etc/letsencrypt/live/" + domains[i].domain + "/fullchain.pem",
                                    private: "/etc/letsencrypt/live/" + domains[i].domain + "/privkey.pem",
                                    "options-ssl": "/etc/letsencrypt/options-ssl-nginx.conf",
                                    "ssl-dhparams": "/etc/letsencrypt/ssl-dhparams.pem",
                                }
                            }
                        } catch (error) {

                        }
                    }
                    

                    else {
                        certificate = {
                            fullchain: "/etc/letsencrypt/live/" + domains[i].domain + "/fullchain.pem",
                            private: "/etc/letsencrypt/live/" + domains[i].domain + "/privkey.pem",
                            "options-ssl": "/etc/letsencrypt/options-ssl-nginx.conf",
                            "ssl-dhparams": "/etc/letsencrypt/ssl-dhparams.pem",
                        }
                    }
                }

                resultConfig += await this.getNginxConfig(domains[i].domain, redirects, {
                    type: domains[i].sslType,
                    certificate
                }, domains[i].isDefault && adminDomain == null, domains[i]._id, domains[i].bucketName)
            }


            let otherDomains = await this.domainRepo.findAll({
                _id: {
                    $in: otherDomainsID
                }
            })
            for (let i = 0; i < otherDomains.length; i++) {
                let redirects = await this.getRedirects(otherDomains[i]._id)
                let certificate
                if (otherDomains[i].sslType == "certificate") {
                    certificate = await this.createSSLs(
                        otherDomains[i].certificate?.public || "",
                        otherDomains[i].certificate?.private || "",
                        otherDomains[i].certificate?.["options-ssl"] || "",
                        otherDomains[i].certificate?.["ssl-dhparams"] || "",
                        otherDomains[i].domain
                    )
                }


                else if (otherDomains[i].sslType == "interim") {
                    let exists = await checkExists("/etc/letsencrypt/live/" + otherDomains[i].domain + "/")
                    if (!exists) {
                        try {
                            await addDomainSSL(otherDomains[i].domain)
                            exists = await checkExists("/etc/letsencrypt/live/" + otherDomains[i].domain + "/")
                            if (exists) {
                                certificate = {
                                    fullchain: "/etc/letsencrypt/live/" + otherDomains[i].domain + "/fullchain.pem",
                                    private: "/etc/letsencrypt/live/" + otherDomains[i].domain + "/privkey.pem",
                                    "options-ssl": "/etc/letsencrypt/options-ssl-nginx.conf",
                                    "ssl-dhparams": "/etc/letsencrypt/ssl-dhparams.pem",
                                }
                            }
                        } catch (error) {

                        }
                    }
                    else {
                        certificate = {
                            fullchain: "/etc/letsencrypt/live/" + otherDomains[i].domain + "/fullchain.pem",
                            private: "/etc/letsencrypt/live/" + otherDomains[i].domain + "/privkey.pem",
                            "options-ssl": "/etc/letsencrypt/options-ssl-nginx.conf",
                            "ssl-dhparams": "/etc/letsencrypt/ssl-dhparams.pem",
                        }
                    }
                }


                resultConfig += await this.getNginxConfig(otherDomains[i].domain, redirects, {
                    type: otherDomains[i].sslType,
                    certificate
                }, otherDomains[i].isDefault && adminDomain == null, otherDomains[i]._id, otherDomains[i].bucketName)
            }


            await writeFile(ConfigService.getConfig("nginxPath") + "sites-available/default", resultConfig)
            await writeFile(ConfigService.getConfig("nginxPath") + "sites-enabled/default", resultConfig)
            exec("service nginx restart")
        } catch (error) {
            // console.log("error", error)
        }
    }


    async createSSLs(
        public_key: string,
        private_key: string,
        options_ssl: string,
        ssl_dhparams: string,
        domainName: string
    ) {
        let res: any = {}
        let configPath = ConfigService.getConfig("nginxPath")
        try {
            await mkdir(configPath + domainName)
        } catch (error) {

        }


        const domainPath = configPath + domainName + "/"

        await writeFile(domainPath + "fullchain.pem", public_key)
        res["fullchain"] = domainPath + "fullchain.pem"

        await writeFile(domainPath + "privkey.pem", private_key)
        res["private"] = domainPath + "privkey.pem"

        await writeFile(domainPath + "options-ssl-nginx.conf", options_ssl)
        res["options-ssl"] = domainPath + "options-ssl-nginx.conf"

        await writeFile(domainPath + "ssl-dhparams.pem", ssl_dhparams)
        res["ssl-dhparams"] = domainPath + "ssl-dhparams.pem"

        return res
    }



    async getRedirects(domain: string) {
        let redirect = ""
        try {
            redirect += await this.getOneToOneRedirects(domain, "update")
            redirect += await this.getOneToOneRedirects(domain, "language")
            redirect += await this.getOneToOneRedirects(domain, "oldToNew")
            redirect += await this.getOneToOneRedirects(domain, "important")
            redirect += await this.getRegexRedirects(domain)
            redirect += await this.getOneToOneRedirects(domain)
        } catch (error) {

        }
        return redirect
    }



    async getOneToOneRedirects(domain: string, type?: string) {
        const domainDoc = await this.domainRepo.findById(domain)
        let redirect = ""
        let q: any = {
            domain,

            status: {
                $ne: false
            },
            type: type || "1To1"
        }


        if (domainDoc?.isDefault) {
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
            }
        }
        const redirects = await this.redirectRepo.findAll(q)
        let defaultDomain = await this.domainRepo.findOne({
            isDefault: true
        })

        for (let i = 0; i < redirects.length; i++) {
            let from = ""
            let to = ""

            if (redirects[i].fromStatic == false) {
                let c = await this.contentRepo.findById(redirects[i].from)
                if (c == null) {
                    continue
                }
                from = c.url
            }
            else {
                from = redirects[i].from
            }


            if (redirects[i].toStatic == false) {
                let c = await this.contentRepo.findById(redirects[i].to)
                if (c == null) {
                    continue
                }
                to = c.url
            }

            else {
                to = redirects[i].to
            }


            if (
                domainDoc?._id != defaultDomain?._id
                && to.startsWith("/")
            ) {
                // await this
                to = (defaultDomain?.sslType == "none" ? "http://" : "https://") + defaultDomain?.domain + to
            }
            else if (!to.startsWith("/")) {
                let d = to.split("/")[0]
                let domain = await this.domainRepo.findOne({ domain: d })
                if (domain != null) {
                    to = (domain?.sslType == "none" ? "http://" : "https://") + to
                }
            }
            redirect += `
            location = ${from.replace(domainDoc?.domain || "", "")} {
                return ${redirects[i].code} ${to};
            }
            `

        }
        return redirect

    }

    async getRegexRedirects(domain: string) {
        let redirect = ""
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
        })
        for (let i = 0; i < redirects.length; i++) {

            redirect += this.getRegexRedirect(redirects[i])
        }
        return redirect
    }

    getRegexRedirect(redirect: Redirect) {
        let words = redirect.from.split("{")
        words.shift()
        for (let i = 0; i < words.length; i++) {
            if (words[i].includes("}")) {
                words[i] = words[i].split("}")[0]
            }
        }
        let from = `${redirect.from}`
        let to = redirect.to

        for (let i = 0; i < words.length; i++) {
            if (redirect.regexConfig[words[i]] == "number") {
                from = from.replace(`{${words[i]}}`, "([0-9]+)")

            }

            else if (redirect.regexConfig[words[i]] == "word") {
                from = from.replace(`{${words[i]}}`, `(\\w+)`)
            }
            else {
                from = from.replace(`{${words[i]}}`, "(.+)")
            }
            to = to.replace(`{${words[i]}}`, `$${i + 1}`)
        }
        return `
            location ~* ^${from}$ {
                return ${redirect.code} ${to};
            }
        `
    }

    async getAdminDomainNginx(
        domainName: string,
        ssl: {
            type: "none" | "certificate" | "interim",
            certificate?: {
                fullchain: string,
                private: string,
                "options-ssl": string
                "ssl-dhparams": string
            }
        }
    ) {
        let sslConfig = ""
        let extraConfig = ""
        if (ssl.type == "certificate" || (ssl.type == "interim" && ssl.certificate != undefined)) {
            sslConfig = `
            listen [::]:443 ssl; 
            listen 443 ssl;
            ssl_certificate ${ssl.certificate?.fullchain}; 
            ssl_certificate_key ${ssl.certificate?.private};`

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
            `
        }
        else {
            sslConfig = `
            listen 80 ;
            listen [::]:80 ;
            server_name ${domainName};
            return 404; 
            `
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
            ${sslConfig
            }
    }
    ${extraConfig}
  `
        return result
    }


    async getNginxConfig(
        domainName: string,
        redirects: any,
        ssl: {
            type: "none" | "certificate" | "interim",
            certificate?: {
                fullchain: string,
                private: string,
                "options-ssl": string
                "ssl-dhparams": string
            }
        },
        adminDomain: boolean = false,
        domainId: Types.ObjectId | string,
        bucketName?: string
    ) {
        let localfiles = ""
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
            `
        }
        let adminRouting = ""
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

            
            `
        }

        let sslConfig = ""
        let extraConfig = ""
        if (ssl.type == "certificate" || (ssl.type == "interim" && ssl.certificate != undefined)) {
            sslConfig = `
            listen [::]:443 ssl; 
            listen 443 ssl;
            ssl_certificate ${ssl.certificate?.fullchain}; 
            ssl_certificate_key ${ssl.certificate?.private};
            include ${ssl.certificate?.["options-ssl"]};
            ssl_dhparam ${ssl.certificate?.["ssl-dhparams"]};`

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
            `
        }
        else {
            sslConfig = `
            listen 80 ;
            listen [::]:80 ;
            server_name ${domainName};
            return 404; 
            `
        }


        var domainRedirect = ""

        let r = await this.domainRedirectRepo.findOne({
            from: domainId,
            status: true
        })


        let front = `
        location / {
            client_max_body_size 1000M;
            proxy_pass http://${ConfigService.getConfig("client")}:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
         }
         `

        if (r != null) {
            let domainLang = await this.langRepo.isExists({
                domain: domainId,
                status: true
            })
            let toDomain = await this.domainRepo.findById(r.to)
            if (toDomain != null && !domainLang) {
                if (toDomain.sslType == "certificate" || toDomain.sslType == "interim")
                    domainRedirect = `
                    location / {
                        return 301 https://${toDomain.domain}$request_uri;
                    }
                `
                else
                    domainRedirect = `
                    location / {
                        return 301 http://${toDomain.domain}$request_uri;
                    }
                    `
                front = ""
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


            ${front}
             
 

            ${sslConfig
            }
    }
    ${extraConfig}
  `
        return result
    }


    async updateDomainSSL(
        domain: string
    ) {
        try {
            //delete domain ssl
            await unlink(ConfigService.getConfig("nginxPath") + "sites-available/" + domain + ".conf")
            await unlink(ConfigService.getConfig("nginxPath") + "sites-enabled/" + domain + ".conf")
            //add domain ssl
            await addDomainSSL(domain)
            await this.init()
        } catch (error) {
            // console.log(error)
        }
    }

    async renewSSL() {
        try {
            await renewDomainSSL()
            await this.init()
        } catch (error) {
            // console.log(error)
        }
    }

    async deleteDomainSSL(domain: string) {
        try {
            await unlink(ConfigService.getConfig("nginxPath") + "sites-available/" + domain + ".conf")
            await unlink(ConfigService.getConfig("nginxPath") + "sites-enabled/" + domain + ".conf")
            exec("service nginx restart")
        } catch (error) {
            // console.log(error)
        }
    }


}



