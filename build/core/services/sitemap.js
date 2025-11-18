"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SiteMapPlugin = void 0;
const sitemap_1 = require("sitemap");
const repository_1 = __importDefault(require("../mongoose-controller/repositories/content/repository"));
const contentRegistry_1 = __importDefault(require("../mongoose-controller/contentRegistry"));
const articleProccessing_1 = __importDefault(require("./articleProccessing"));
const fileManager_1 = require("./fileManager");
const path_1 = __importDefault(require("path"));
const repository_2 = __importDefault(require("../mongoose-controller/repositories/googleApiToken/repository"));
const repository_3 = __importDefault(require("../mongoose-controller/repositories/system/repository"));
const axios_1 = __importDefault(require("axios"));
class SiteMap {
    constructor() {
        // this.domainRepo = new DomainRepository()
        this.googleApiTokenRepo = new repository_2.default();
        this.systemConfigRepo = new repository_3.default();
        this.contentRepo = new repository_1.default();
        this.contentRegistry = contentRegistry_1.default.getInstance();
    }
    async generateDomainSiteMap(domain, domainId, languages) {
        var _a, _b, _c, _d;
        // console.log(domain, domainId, languages)
        try {
            let stream = new sitemap_1.SitemapStream({ hostname: `https://${domain}` });
            let contents = await this.contentRepo.findAll({
                language: {
                    $in: languages
                }
            }, {
                sort: {
                    _id: -1
                }
            });
            let streams = [];
            let contentcount = 0;
            for (let i = 0; i < contents.length; i++) {
                let urlInfo = {
                    url: contents[i].url.replace(domain, "")
                };
                let repo = this.contentRegistry.getRegistry(contents[i].type);
                if (repo == undefined)
                    continue;
                if (contents[i].type == "category") {
                    var contentData = await ((_a = repo.repo) === null || _a === void 0 ? void 0 : _a.findOne({
                        catID: contents[i].id,
                        language: contents[i].language,
                        lable: contents[i].categoryLable
                    }));
                }
                else {
                    var contentData = await ((_b = repo.repo) === null || _b === void 0 ? void 0 : _b.findOne({
                        _id: contents[i].id
                    }));
                }
                if (contentData != null) {
                    if (contentData.modifyDate) {
                        urlInfo["lastmod"] = contentData.modifyDate.toISOString().split('T')[0];
                    }
                    urlInfo["img"] = articleProccessing_1.default.getImages(contentData.content || "");
                    try {
                        let videos = await ((_c = repo.repo) === null || _c === void 0 ? void 0 : _c.getVideosDoc(contentData));
                        if (videos != undefined && (videos === null || videos === void 0 ? void 0 : videos.length) != 0) {
                            let videoResult = [];
                            videoResult.push({
                                player_loc: videos[0].src,
                                thumbnail_loc: (_d = videos[0].screenshots) === null || _d === void 0 ? void 0 : _d[0],
                                title: contentData.title,
                                description: contents[i].metaDescription
                            });
                            if (videoResult.length > 0) {
                                urlInfo["video"] = videoResult;
                            }
                        }
                    }
                    catch (error) {
                    }
                }
                if (contents[i].changefreq) {
                    urlInfo["changefreq"] = contents[i].changefreq;
                }
                if (contents[i].priority) {
                    urlInfo["priority"] = contents[i].priority;
                }
                stream.write(urlInfo);
                contentcount += 1;
                if (contentcount == 1000) {
                    streams.push(stream);
                    stream = new sitemap_1.SitemapStream({ hostname: `https://${domain}` });
                    contentcount = 0;
                }
            }
            if (contentcount != 0) {
                streams.push(stream);
            }
            let isExists = await fileManager_1.DiskFileManager.isExists(`sitemap/${domain}/`);
            if (!isExists) {
                await fileManager_1.DiskFileManager.mkdir("sitemap/", domain);
            }
            else {
                await fileManager_1.DiskFileManager.removeFolderFiles(`sitemap/${domain}/`);
            }
            if (streams.length == 1) {
                let sitemapStream = streams[0];
                sitemapStream.end();
                var sitemap = await (0, sitemap_1.streamToPromise)(sitemapStream).then(data => data.toString());
                await fileManager_1.DiskFileManager.writeFile(`sitemap/${domain}/sitemap.xml`, sitemap);
                return;
            }
            const sitemapIndexStream = new sitemap_1.SitemapIndexStream();
            for (let i = 0; i < streams.length; i++) {
                // const element = array[i];
                let sitemapStream = streams[i];
                sitemapStream.end();
                const sitemap = await (0, sitemap_1.streamToPromise)(sitemapStream).then(data => data.toString());
                // Save sitemap to a file
                console.log("befor", domain);
                await fileManager_1.DiskFileManager.writeFile(`sitemap/${domain}/sitemap-${i + 1}.xml`, sitemap);
                console.log("after", domain);
                sitemapIndexStream.write({ url: `https://${domain}/sitemap-${i + 1}.xml`, lastmod: new Date().toISOString() });
            }
            sitemapIndexStream.end();
            var sitemap = await (0, sitemap_1.streamToPromise)(sitemapIndexStream).then(data => data.toString());
            await fileManager_1.DiskFileManager.writeFile(`sitemap/${domain}/sitemap.xml`, sitemap);
            // console.log(count)
            // )
        }
        catch (error) {
            console.log(error);
        }
    }
    async generateSiteMap() {
        var _a;
        try {
            var apiServer = await this.systemConfigRepo.getConfigValue("google_api_server");
            var apikey = await this.systemConfigRepo.getConfigValue("google_api_key");
            var google_conf = await this.systemConfigRepo.getConfigValue("google_credential");
            var languages = await this.contentRepo.domainRepo.languageRepo.findAll({
                status: true,
                domain: {
                    $exists: false
                }
            });
            let languageIds = [];
            for (let i = 0; i < languages.length; i++) {
                languageIds.push(languages[i]._id.toHexString());
            }
            let domain = await this.contentRepo.domainRepo.findOne({
                isDefault: true
            });
            if (domain != null) {
                try {
                    await this.generateDomainSiteMap(domain === null || domain === void 0 ? void 0 : domain.domain, domain === null || domain === void 0 ? void 0 : domain._id, languageIds);
                    let webmasterToken = await this.googleApiTokenRepo.findOne({
                        type: "webmaster",
                        domains: domain._id
                    });
                    if (webmasterToken != null) {
                        let webmaster_conf = webmasterToken.token;
                        if (webmaster_conf != undefined && google_conf != undefined) {
                            let response = await (0, axios_1.default)({
                                method: 'post',
                                url: apiServer + "users/sitemap/add",
                                headers: {
                                    "x-api-key": apikey
                                },
                                data: {
                                    credential: google_conf,
                                    token: webmaster_conf,
                                    siteUrl: domain === null || domain === void 0 ? void 0 : domain.domain,
                                    // siteUrl : "aroncare.com"
                                }
                            });
                        }
                    }
                }
                catch (error) {
                }
            }
            var languages = await this.contentRepo.domainRepo.languageRepo.findAll({
                status: true,
                domain: {
                    $exists: true
                }
            });
            languageIds = [];
            for (let i = 0; i < languages.length; i++) {
                let domain = await this.contentRepo.domainRepo.findOne({
                    _id: (_a = languages[i].domain) === null || _a === void 0 ? void 0 : _a.toHexString()
                });
                if (domain != null) {
                    try {
                        await this.generateDomainSiteMap(domain === null || domain === void 0 ? void 0 : domain.domain, domain === null || domain === void 0 ? void 0 : domain._id, languages[i]._id.toHexString());
                        let webmasterToken = await this.googleApiTokenRepo.findOne({
                            type: "webmaster",
                            domains: domain._id
                        });
                        if (webmasterToken != null) {
                            let webmaster_conf = webmasterToken.token;
                            if (webmaster_conf != undefined && google_conf != undefined) {
                                let response = await (0, axios_1.default)({
                                    method: 'post',
                                    url: apiServer + "users/sitemap/add",
                                    headers: {
                                        "x-api-key": apikey
                                    },
                                    data: {
                                        credential: google_conf,
                                        token: webmaster_conf,
                                        siteUrl: domain === null || domain === void 0 ? void 0 : domain.domain
                                    }
                                });
                            }
                        }
                    }
                    catch (error) {
                    }
                }
            }
        }
        catch (error) {
            console.log(error);
        }
    }
    static getInstance() {
        if (!SiteMap.instance) {
            SiteMap.instance = new SiteMap();
        }
        else {
            console.log(this.instance);
        }
        return SiteMap.instance;
    }
}
exports.default = SiteMap;
class SiteMapPlugin {
    constructor() {
    }
    async init() {
        // console.log(this._config)
    }
    async getSitmap(host, index) {
        // console.log(host, index)
        try {
            let data = path_1.default.join(process.cwd(), `./sitemap/${host}/sitemap${index != undefined ? "-" + index : ""}.xml`);
            let exists = await fileManager_1.DiskFileManager.isFileExists(data);
            if (!exists) {
                return {
                    status: 404,
                    json: false,
                    data: "not found"
                };
            }
            return {
                status: 200,
                json: false,
                data,
                isFilePath: true
            };
        }
        catch (error) {
            console.log(error);
            return {
                status: 404
            };
        }
    }
    serve() {
        var routes = [];
        routes.push({
            execs: this.getSitmap.bind(this),
            method: "get",
            route: "/sitemap.xml",
            meta: {
                params: {
                    "0": {
                        index: 0,
                        source: "header",
                        destination: "host"
                    }
                }
            }
        });
        routes.push({
            execs: this.getSitmap.bind(this),
            method: "get",
            route: "/sitemap-:index.xml/",
            meta: {
                params: {
                    "0": {
                        index: 0,
                        source: "header",
                        destination: "host"
                    },
                    "1": {
                        index: 1,
                        source: "param",
                        destination: "index"
                    }
                }
            }
        });
        return routes;
    }
}
exports.SiteMapPlugin = SiteMapPlugin;
