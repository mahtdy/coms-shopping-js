"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../repository"));
const repository_2 = __importStar(require("../repositories/content/repository"));
const repository_3 = __importDefault(require("../repositories/fileUses/repository"));
const contentRegistry_1 = __importDefault(require("../contentRegistry"));
const queue_1 = __importDefault(require("../../services/queue"));
const model_1 = require("../repositories/article/model");
const repository_4 = __importDefault(require("../repositories/seoDraft/repository"));
const repository_5 = __importDefault(require("../repositories/videoQueue/repository"));
const fileManager_1 = __importStar(require("../../services/fileManager"));
const path_1 = __importDefault(require("path"));
const model_2 = require("../repositories/videoQueue/model");
const repository_6 = __importDefault(require("../repositories/system/repository"));
const repository_7 = __importDefault(require("../repositories/language/repository"));
const repository_8 = __importDefault(require("../repositories/domain/repository"));
const repository_9 = __importDefault(require("../repositories/domainVideoConfig/repository"));
const jsdom_1 = require("jsdom");
const repository_10 = __importDefault(require("../repositories/domainImageConfig/repository"));
const imageProccessing_1 = __importDefault(require("../../services/imageProccessing"));
const videoRegistry_1 = __importDefault(require("../videoRegistry"));
const repository_11 = __importDefault(require("../repositories/contentPublishQueue/repository"));
const axios_1 = __importDefault(require("axios"));
const repository_12 = __importDefault(require("../repositories/googleApiToken/repository"));
const repository_13 = __importDefault(require("../repositories/publishCycle/repository"));
const articleProccessing_1 = __importDefault(require("../../services/articleProccessing"));
const repository_14 = __importDefault(require("../repositories/comment/repository"));
const repository_15 = __importDefault(require("../repositories/fakeComment/repository"));
const config_1 = __importDefault(require("../../services/config"));
const repository_16 = __importDefault(require("../repositories/imageResult/repository"));
const repository_17 = __importDefault(require("../repositories/fileManagerConfig/repository"));
const confRepo = new repository_6.default();
function getUploadDestination(staticPath, dynamicPathStyle, contentNumber) {
    let secondPart = "";
    let today = new Date();
    switch (dynamicPathStyle) {
        case "y":
            secondPart = today.getFullYear().toString() + "/";
            break;
        case "y-m":
            secondPart =
                today.getFullYear().toString() +
                    "/" +
                    today.getMonth().toString() +
                    "/";
            break;
        case "y-m-d":
            secondPart =
                today.getFullYear().toString() +
                    "/" +
                    today.getMonth().toString() +
                    "/" +
                    today.getDate().toString() +
                    "/";
            break;
        case "y-n":
            secondPart = today.getFullYear().toString() +
                "/" +
                (contentNumber === null || contentNumber === void 0 ? void 0 : contentNumber.toString()) +
                "/";
            break;
        case "n":
            secondPart = (contentNumber === null || contentNumber === void 0 ? void 0 : contentNumber.toString()) + "/";
            break;
        case "y-m-n":
            secondPart =
                today.getFullYear().toString() +
                    "/" +
                    today.getMonth().toString() +
                    "/" +
                    (contentNumber === null || contentNumber === void 0 ? void 0 : contentNumber.toString()) +
                    "/";
            break;
        default:
            break;
    }
    return staticPath + secondPart;
}
function getPathResolver(contentType, path = "content/", style, contentNumber) {
    return async () => {
        try {
            if (contentType === "video") {
                var staticPath = path;
            }
            else if (contentType == "image" && style != undefined) {
                var staticPath = path;
            }
            else
                var staticPath = await confRepo.getConfigValue(`${contentType}-folder`);
            let dynamicPathStyle = await confRepo.getConfigValue(`${contentType}-folder-dynamic-style`);
            return getUploadDestination(staticPath, style || dynamicPathStyle, contentNumber);
        }
        catch (error) {
            throw error;
        }
    };
}
class BasePageRepository extends repository_1.default {
    constructor(options) {
        super(options.model, options);
        this.typeName = options.typeName;
        this.contentFunc = options.contentFunc;
        if (this.typeName != undefined && this.contentFunc) {
            repository_2.customUrlBuilder[this.typeName] = this.contentFunc;
        }
        this.imageResultRepo = new repository_16.default();
        this.fileUsesRepo = new repository_3.default();
        this.contentRepo = new repository_2.default();
        var contentMaduleRegistry = contentRegistry_1.default.getInstance();
        contentMaduleRegistry.add({
            name: options.typeName,
            repo: this,
            fromOwn: options.fromOwn,
            queryData: options.queryData,
            defaultExact: options.defaultExact,
            selectData: options.selectData,
            sort: options.sort
        });
        this.videoRegistry = videoRegistry_1.default.getInstance();
        this.seoDraftRepo = new repository_4.default();
        this.videoRepo = new repository_5.default();
        this.cdn = new fileManager_1.default();
        this.systemConfigRepo = new repository_6.default();
        this.waitToConsume();
        this.domainRepo = new repository_8.default();
        this.langRepo = new repository_7.default();
        this.domainVideoRepo = new repository_9.default();
        this.domainImageRepo = new repository_10.default();
        this.contentPublishQueueRepo = new repository_11.default();
        this.publishCycleRepo = new repository_13.default();
        this.googleApiTokenRepo = new repository_12.default();
        this.commentRepo = new repository_14.default();
        this.fakeCommentRepo = new repository_15.default();
        this.cdnRepo = new repository_17.default();
        this.defineScheduler();
    }
    defineScheduler() {
        queue_1.default.define(`publishSubContent-${this.typeName}`, this.publishSubContentTask.bind(this));
        queue_1.default.define(`publishContent-${this.typeName}`, this.publishContentTask.bind(this));
        queue_1.default.define(`publisCommonQuestion-${this.typeName}`, this.publishCommonQuestionTask.bind(this));
        queue_1.default.define(`publishComment-${this.typeName}`, this.publishCommentTask.bind(this));
        queue_1.default.define(`publishCommentReply-${this.typeName}`, this.publishCommentReplyTask.bind(this));
    }
    async publishSubContentTask(job) {
        return await this.publishSubContent(job.attrs.data.id, job.attrs.data.subId);
    }
    async publishContentTask(job) {
        return await this.publish(job.attrs.data.id);
    }
    async publishCommonQuestionTask(job) {
        return await this.publishSubContent(job.attrs.data.id, job.attrs.data.subId);
    }
    async publishCommentTask(job) {
        return await this.publishCommnet(job.attrs.data.commentId);
    }
    async publishCommentReplyTask(job) {
        return await this.publishCommentReply(job.attrs.data.commentId, job.attrs.data.replyId);
    }
    async getUploadFolders(langId, type) {
        let lang = await this.langRepo.findById(langId);
        if (lang === null || lang === void 0 ? void 0 : lang.domain) {
            var domain = await this.domainRepo.findById(lang.domain);
        }
        else {
            var domain = await this.domainRepo.findOne({
                isDefault: true
            });
        }
        let q = {
            domain: domain === null || domain === void 0 ? void 0 : domain._id
        };
        var domainVideo = null;
        if (type != undefined) {
            q["type"] = type;
            domainVideo = await this.domainVideoRepo.findOne(q);
        }
        if (domainVideo == null)
            domainVideo = await this.domainVideoRepo.findOne({
                domain: domain === null || domain === void 0 ? void 0 : domain._id
            });
        let savePaths = (domainVideo === null || domainVideo === void 0 ? void 0 : domainVideo["save-paths"]) || [];
        let data = {};
        for (let i = 0; i < savePaths.length; i++) {
            data[savePaths[i].quality] = {
                path: savePaths[i].path,
                fileManager: savePaths[i].fileManager,
            };
        }
        return data;
    }
    async getUploadInfo(dimension, uploadConfig) {
        let l = dimension.split("x")[1] + "p";
        if (uploadConfig[l]) {
            return uploadConfig[l];
        }
        if (uploadConfig["all"]) {
            return uploadConfig["all"];
        }
        return await this.systemConfigRepo.getConfigValue("save-path");
    }
    async waitToConsume() {
        this.videoRepo.rabbitmq.consume("videoResult", async (msg) => {
            var content = ((msg === null || msg === void 0 ? void 0 : msg.content.toString()) || "");
            try {
                var jsonData = JSON.parse(content);
                await this.cdn.findCdnFromUrl(jsonData['src']);
                const video = await this.videoRepo.findOne({
                    src: jsonData['src']
                });
                const article = await this.findOne({
                    video: video === null || video === void 0 ? void 0 : video._id
                });
                let files = jsonData.result;
                const dirName = Date.now().toString();
                let todeletePath = [];
                let type = video === null || video === void 0 ? void 0 : video.type;
                let uploadConfig = await this.getUploadFolders(article === null || article === void 0 ? void 0 : article._id, type);
                for (let i = 0; i < files.length; i++) {
                    let file = await fileManager_1.DiskFileManager.downloadFile(files[i].path);
                    let uploadInfo = await this.getUploadInfo(files[i].dimension, uploadConfig);
                    let dynamicPathStyle = await this.systemConfigRepo.getConfigValue("video-folder-dynamic-style");
                    let p = getUploadDestination(uploadInfo.path, dynamicPathStyle);
                    this.cdn.CDN_id = uploadInfo.fileManager;
                    await this.cdn.init(true);
                    const fileURL = await this.cdn.upload(file, p + path_1.default.basename(file));
                    todeletePath.push(files[i].path);
                    files[i].path = fileURL;
                }
                try {
                    const channel = await this.videoRepo.rabbitmq.getChannel();
                    channel === null || channel === void 0 ? void 0 : channel.assertQueue("delete-video");
                    channel === null || channel === void 0 ? void 0 : channel.sendToQueue("delete-video", Buffer.from(JSON.stringify({
                        "delete-files": todeletePath
                    })));
                }
                catch (error) {
                }
                await this.videoRepo.proccessed(jsonData['src'], files);
                await this.chackForVideoProccessd(video === null || video === void 0 ? void 0 : video._id);
                if (type != undefined) {
                    let repo = this.videoRegistry.get(type);
                    if (repo != undefined) {
                        await repo.repo.proccessVideo(video === null || video === void 0 ? void 0 : video._id);
                    }
                }
            }
            catch (error) {
                console.log(error);
                return true;
            }
        });
    }
    async chackForVideoProccessd(video) {
        const article = await this.findOne({
            video
        });
        if (article != null) {
            await this.checkFileUses(article._id);
            // check for other videos of this article is ok 
            if (article === null || article === void 0 ? void 0 : article.videos) {
                let isExists = await this.videoRepo.isExists({
                    _id: {
                        $in: article === null || article === void 0 ? void 0 : article.videos
                    },
                    status: {
                        $ne: model_2.VideoQueueStatus.done
                    }
                });
                if (isExists) {
                    return;
                }
            }
            this.proccessedVideo(article._id);
        }
        const otherArticles = await this.findAll({
            videos: video
        });
        for (let i = 0; i < otherArticles.length; i++) {
            let videos = this.getVideos(otherArticles[i]);
            await this.checkFileUses(otherArticles[i]._id);
            let isExists = await this.videoRepo.isExists({
                _id: {
                    $in: videos
                },
                status: {
                    $ne: model_2.VideoQueueStatus.done
                }
            });
            if (!isExists) {
                this.proccessedVideo(otherArticles[i]._id);
            }
        }
    }
    getVideos(article, justMain = false) {
        let videos = [];
        if (article != null) {
            if (article.videos && article.videos.length > 0 && justMain == false) {
                if (typeof article.videos[0] != "string") {
                    for (let i = 0; i < article.videos.length; i++) {
                        let id = article.videos[i]._id || article.videos[i].toHexString();
                        videos.push(id);
                    }
                }
                else {
                    for (let i = 0; i < article.videos.length; i++) {
                        videos.push(article.videos[i]);
                    }
                }
            }
            if (article.video) {
                if (typeof article.video != "string") {
                    let id = article.video._id || article.video.toHexString();
                    videos.push(id);
                }
                else {
                    videos.push(article.video);
                }
            }
        }
        return videos;
    }
    findContentVideos(doc) {
        let totalLinks = [];
        totalLinks.push(...this.extractVideoLinksFromHtml(doc.content || ""));
        if (doc.contents != undefined) {
            for (let i = 0; i < doc.contents.length; i++) {
                totalLinks.push(...this.extractVideoLinksFromHtml(doc.contents[i].content || ""));
            }
        }
        return totalLinks;
    }
    async updateContentVideos(doc) {
        let links = this.findContentVideos(doc);
        // console.log(links)
        let videos = [];
        for (let i = 0; i < links.length; i++) {
            let vid = await this.videoRepo.findOne({
                $or: [
                    {
                        src: links[i],
                    },
                    {
                        "result.path": links[i]
                    }
                ],
            });
            if (vid != null) {
                videos.push(vid._id);
            }
            else {
                vid = await this.videoRepo.insert({
                    src: links[i],
                    page: doc._id,
                    pageType: this.collection.modelName,
                    type: this.typeName,
                    locked: true,
                });
                videos.push(vid === null || vid === void 0 ? void 0 : vid._id);
            }
        }
        try {
            await this.updateOne({
                _id: doc._id
            }, {
                $addToSet: {
                    videos: {
                        $each: videos
                    }
                }
            });
        }
        catch (error) {
        }
    }
    async proccessedVideo(id) {
        try {
            await this.updateOne({
                _id: id
            }, {
                $set: {
                    videoProccessed: true
                }
            });
        }
        catch (error) {
        }
    }
    async insert(document) {
        var _a;
        try {
            let options = {};
            if (document.isDraft)
                options["validateBeforeSave"] = true;
            var res = await super.insert(document);
            if (res.video) {
                await this.videoRepo.updateOne({
                    _id: res.video
                }, {
                    $set: {
                        id: res._id,
                        type: this.typeName,
                        locked: true,
                        page: res === null || res === void 0 ? void 0 : res._id,
                        pageType: this.collection.modelName
                    }
                });
            }
            await this.updateContentVideos(res);
            await this.checkFileUses(res._id.toString());
            if (!document.isDraft && document.publishDate != undefined) {
                await queue_1.default.schedule(document.publishDate, `publishContent-${this.typeName}`, {
                    id: res._id.toString(),
                    publish: this.publish.bind(this)
                });
            }
            else if (document.isPublished) {
                try {
                    await this.publish(res._id, {
                        category: this.typeName == "category" ? document.catID : undefined
                    });
                }
                catch (error) {
                    throw error;
                }
            }
            else {
                this.insertToSeoDraft(res);
            }
            if (document.contentLanguages && ((_a = document.contentLanguages) === null || _a === void 0 ? void 0 : _a.length) > 0) {
                for (let i = 0; i < document.contentLanguages.length; i++) {
                    try {
                        let lst = [...document.contentLanguages || []];
                        lst[i].content = document._id;
                        await super.updateOne({
                            _id: document === null || document === void 0 ? void 0 : document.contentLanguages[i].content
                        }, {
                            $set: {
                                contentLanguages: lst
                            }
                        });
                    }
                    catch (error) {
                    }
                }
            }
            return res;
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async getURL(url, isStatic, language, category) {
        try {
            return await this.contentRepo.makeURL(url, isStatic, {
                type: this.typeName,
                customFunc: this.contentFunc,
                category: category,
                language: language
            });
        }
        catch (error) {
            throw error;
        }
    }
    async insertToSeoDraft(res) {
        let data = {
            id: res._id,
            type: res.seo.type,
            language: res.language,
            seoTitle: res.seo.seoTitle,
            title: res.title,
            mainKeyWord: res.seo.mainKeyWord,
            keyWords: res.seo.keyWords,
        };
        if (res.seo.type == "category") {
            data["categoryLable"] = res.seo.categoryLable;
        }
        if (res.seo.url != "") {
            data["url"] = await this.contentRepo.makeURL(res.seo.url, res.seo.isStatic, {
                type: this.typeName,
                customFunc: this.contentFunc,
                category: res.category,
                language: res.language
            });
        }
        try {
            await this.seoDraftRepo.upsert(data);
        }
        catch (error) {
        }
    }
    async paginate(query, limit, page, options) {
        try {
            let res = await super.paginate(query, limit, page, options);
            let lst = res.list;
            try {
                let defaultDomain = await this.domainRepo.findOne({
                    isDefault: true
                });
                for (let i = 0; i < lst.length; i++) {
                    if (lst[i].seoContent && lst[i].seoContent.url != undefined) {
                        lst[i].psi = encodeURI(lst[i].seoContent.url.startsWith("/") ? `https://${defaultDomain === null || defaultDomain === void 0 ? void 0 : defaultDomain.domain}${lst[i].seoContent.url}` : `https://${lst[i].seoContent.url}`);
                    }
                }
                res.list = lst;
            }
            catch (error) {
            }
            return res;
        }
        catch (error) {
            throw error;
        }
    }
    async getBlockData(query, limit, page, options) {
        return super.findMany(query, options, page, limit);
    }
    async findById(id, queryInfo, population) {
        var d = await super.findById(id, queryInfo, population || (queryInfo === null || queryInfo === void 0 ? void 0 : queryInfo.population));
        if (d != null) {
            var c = await this.contentRepo.findOne({
                id,
                type: this.typeName
            });
            if (c != null)
                d.seo = c;
            // let contentLanguages: any = d.contentLanguages || []
            // for (let i = 0; i < contentLanguages.length; i++) {
            //     contentLanguages[i].content = await this.findOne({
            //         _id : contentLanguages[i].content
            //     },{
            //         projection : {
            //             seoContent : 1,
            //             title : 1
            //         }
            //     },[
            //         {      
            //             path: "seoContent",
            //             select: ["url" , "absoluteUrl"]
            //         }, 
            //     ])
            // }
            // d.contentLanguages = contentLanguages
        }
        return d;
    }
    async findOne(query, queryInfo, population) {
        var d = await super.findOne(query, queryInfo, population);
        if (d != null) {
            var c = await this.contentRepo.findOne({
                id: d._id,
                type: this.typeName
            });
            if (c != null)
                d.seo = c;
        }
        return d;
    }
    async passVideoProccess(id) {
        return await this.findOneAndUpdate({
            _id: id,
            "proccesses.name": model_1.ProccessName.videos
        }, {
            $set: {
                "proccesses.$.status": model_1.ProccessStatus.finished
            }
        });
    }
    async view(query) {
        var data = await this.findOne(query, {}, [
            {
                path: "author",
                select: ["name", "familyName"]
            },
            {
                path: "category"
            },
            {
                path: "language"
            }
        ]);
        this.updateOne(query, {
            $inc: {
                view: 1
            }
        });
        return data;
    }
    async extractImageUrls(html) {
        const { window } = new jsdom_1.JSDOM(html);
        const { document } = window;
        const imgElements = document.querySelectorAll('img');
        let results = [];
        for (let i = 0; i < imgElements.length; i++) {
            let img = imgElements[i];
            let width = img.getAttribute("width");
            if (width == null) {
                try {
                    let r = await imageProccessing_1.default.getDimensions(img.getAttribute("src"));
                    width = r.width.toString();
                }
                catch (error) {
                    console.log("err", img.getAttribute("src"), error);
                }
            }
            const isMapImg = img.getAttribute("ismap-img") == "true";
            const r = {
                src: img.getAttribute('src'),
                width,
                isMapImg,
                original: img.getAttribute("original"),
            };
            results.push(r);
        }
        return results;
    }
    ;
    extractVideoLinksFromHtml(html) {
        const dom = new jsdom_1.JSDOM(html);
        const document = dom.window.document;
        const links = [];
        const videoElements = Array.from(document.getElementsByTagName("video"));
        videoElements.forEach(video => {
            const videoSrc = video.getAttribute("src");
            if (videoSrc) {
                links.push(videoSrc);
            }
            const sourceElements = Array.from(video.getElementsByTagName("source"));
            sourceElements.forEach(source => {
                const src = source.getAttribute("src");
                if (src) {
                    links.push(src);
                }
            });
        });
        return links;
    }
    async processImage(id) {
    }
    async publish(id, options) {
        let updateQuery = {
            $set: {
                publishDate: new Date(),
                isPublished: true,
                isDraft: false
            }
        };
        if (options === null || options === void 0 ? void 0 : options.videoProccessed) {
            updateQuery['$set']['videoProccessed'] = true;
        }
        if (options === null || options === void 0 ? void 0 : options.imageProccessed) {
            updateQuery['$set']['imageProccessed'] = true;
        }
        var doc = await this.findOneAndUpdate({
            _id: id
        }, updateQuery);
        if (doc === null || doc === void 0 ? void 0 : doc.video) {
            await this.videoRepo.startProccess(doc === null || doc === void 0 ? void 0 : doc.video, doc === null || doc === void 0 ? void 0 : doc.language);
        }
        if ((doc === null || doc === void 0 ? void 0 : doc.videos) != undefined) {
            for (let i = 0; i < (doc === null || doc === void 0 ? void 0 : doc.videos.length); i++) {
                await this.videoRepo.startProccess(doc === null || doc === void 0 ? void 0 : doc.videos[i], doc === null || doc === void 0 ? void 0 : doc.language);
            }
        }
        await queue_1.default.cancel({
            name: `publishContent-${this.typeName}`,
            "data.id": id
        });
        var content = await this.contentRepo.insert(Object.assign(doc === null || doc === void 0 ? void 0 : doc.seo, {
            _id: options === null || options === void 0 ? void 0 : options._id,
            type: this.typeName,
            id: (options === null || options === void 0 ? void 0 : options.category) || (doc === null || doc === void 0 ? void 0 : doc._id)
        }), {
            type: this.typeName,
            category: doc === null || doc === void 0 ? void 0 : doc.category,
            language: doc === null || doc === void 0 ? void 0 : doc.language,
            customFunc: this.contentFunc,
            admin: doc === null || doc === void 0 ? void 0 : doc.author
        });
        await this.findByIdAndUpdate(id, {
            $set: {
                seoContent: content._id
            }
        });
        var query = {
            id: doc === null || doc === void 0 ? void 0 : doc._id,
            type: this.typeName,
            language: doc === null || doc === void 0 ? void 0 : doc.language
        };
        if ((doc === null || doc === void 0 ? void 0 : doc.seo.type) == "category") {
            query['categoryLable'] = doc === null || doc === void 0 ? void 0 : doc.seo.categoryLable;
        }
        await this.seoDraftRepo.findOneAndDelete(query);
        await this.updateOne({
            _id: id
        }, {
            $set: {
                url: content.url
            }
        });
        await this.proccessImageAfterPublish(doc);
        this.doOnPublish(id).then(() => { }).catch((error) => {
        });
        return content.url;
    }
    async updateOne(query, data, options) {
        let res = await super.updateOne(query, data, options);
        var doc = await this.findOne(query);
        if (doc != null) {
            // await this.checkFileUses(doc._id.toString())
        }
        return res;
    }
    async unPublish(id) {
        var doc = await this.findOneAndUpdate({
            _id: id
        }, {
            $set: {
                // publishDate: new Date(),
                isPublished: false,
                modifyDate: new Date()
                // isDraft: false
            },
            $unset: {
                publishDate: 1
            }
        });
        await queue_1.default.cancel({
            name: `publishContent-${this.typeName}`,
            "data.id": id
        });
        await this.contentRepo.findOneAndDelete({
            id,
            type: this.typeName
        });
        this.doOnUnPublish(id);
        return true;
    }
    async checkForChangeUrl(id, content) {
        this.contentRepo;
    }
    async findOneAndUpdate(query, queryData) {
        try {
            var before = await this.findOne(query, { fromDb: true });
            var res = await super.findOneAndUpdate(query, queryData);
            var after = await this.collection.findOne(query);
            if (before != null && after != null) {
                if (before.isPublished) {
                    if (!after.isPublished) {
                        await this.unPublish(after._id);
                        if (after.publishDate != undefined) {
                            await queue_1.default.schedule(after.publishDate, `publishContent-${this.typeName}`, {
                                id: after._id.toString(),
                                publish: this.publish.bind(this)
                            });
                        }
                    }
                    else {
                        await this.contentRepo.checkForEdit({
                            id: after._id.toHexString(),
                            type: this.typeName
                        }, after.seo, {
                            type: this.typeName,
                            category: after === null || after === void 0 ? void 0 : after.category,
                            language: after === null || after === void 0 ? void 0 : after.language,
                            customFunc: this.customFunc,
                            admin: after.author
                        });
                    }
                }
                else {
                    if (after.isPublished) {
                        await this.publish(after._id, {
                            category: this.typeName == "category" ? after.catID : undefined
                        });
                    }
                    else if (after.publishDate != undefined) {
                        await queue_1.default.cancel({
                            name: `publishContent-${this.typeName}`,
                            "data.id": before._id.toString()
                        });
                        if (after.publishDate != undefined) {
                            await queue_1.default.schedule(after.publishDate, `publishContent-${this.typeName}`, {
                                id: after._id.toString(),
                                publish: this.publish.bind(this)
                            });
                        }
                    }
                }
            }
            return res;
        }
        catch (error) {
            throw error;
        }
    }
    async findOneAndDelete(query) {
        try {
            const res = await super.findOneAndDelete(query);
            await this.contentRepo.findOneAndDelete({
                id: res === null || res === void 0 ? void 0 : res.id,
                type: this.typeName
            });
            return res;
        }
        catch (error) {
            throw error;
        }
    }
    async refreshVideoProccess(before, after) {
    }
    async refreshImageProccess(before, after) {
        try {
            await this.changeMainImages(after);
            await this.proccessIncontentImages(after, before);
            await this.checkFileUses(after === null || after === void 0 ? void 0 : after._id.toString());
        }
        catch (error) {
            console.log(error);
        }
        return;
    }
    async getContentDomian(id) {
        let doc = await this.findById(id);
        if (doc == null) {
            return null;
        }
        let language = await this.langRepo.findById(doc.language);
        if (language == null) {
            return null;
        }
        let domain = language.domain != undefined ? await this.domainRepo.findById(language.domain) : await this.domainRepo.findOne({
            isDefault: true
        });
        if (domain == null) {
            return null;
        }
        return domain;
    }
    async publishSubContent(id, subId) {
        try {
            let domain = await this.getContentDomian(id);
            if (domain == null) {
                throw new Error("دامنه یافت نشد");
            }
            let content = await this.contentRepo.findOne({
                type: this.typeName,
                id
            });
            if (content == null)
                throw new Error("محتوا یافت نشد");
            let url = "";
            var google_conf = await this.systemConfigRepo.getConfigValue("google_credential");
            var apiServer = await this.systemConfigRepo.getConfigValue("google_api_server");
            var apikey = await this.systemConfigRepo.getConfigValue("google_api_key");
            let webmasterToken = await this.googleApiTokenRepo.findOne({
                type: "webmaster",
                domains: domain._id
            });
            if (webmasterToken == null || google_conf == null || apiServer == null) {
                throw new Error("وب مستر متصل نشده است");
            }
            let webmaster_conf = webmasterToken.token;
            if (content.url == "" || content.url.startsWith("/")) {
                url = `https://${domain.domain}${content.url}`;
            }
            else {
                url = `https://${content.url}`;
            }
            let response = await (0, axios_1.default)({
                method: 'post',
                url: apiServer + "users/webmaster/index",
                headers: {
                    "x-api-key": apikey
                },
                data: {
                    credential: google_conf,
                    token: webmaster_conf,
                    url
                }
            });
            return;
        }
        catch (error) {
            throw error;
        }
    }
    async updateSubContentHTML(id, subId, extra, content) {
        if (subId == undefined || subId == "") {
            await this.updateOne({
                _id: id
            }, {
                $set: {
                    content
                }
            });
        }
        else {
            await this.updateOne({
                _id: id,
                "contents._id": subId
            }, {
                $set: {
                    "contents.$.content": content
                }
            });
        }
    }
    async findSubContent(doc, subId) {
        var _a;
        if (!subId || subId == "") {
            return doc.content;
        }
        const subContent = (_a = doc.contents) === null || _a === void 0 ? void 0 : _a.find((item) => { var _a; return ((_a = item._id) === null || _a === void 0 ? void 0 : _a.toString()) === subId.toString(); });
        return subContent === null || subContent === void 0 ? void 0 : subContent.content;
    }
    async updateFAQAnswer(id, subId, answer) {
        try {
            await this.updateOne({
                _id: id,
                "commonQuestions._id": subId
            }, {
                $set: {
                    "commonQuestions.$.answer": answer
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async updateDocSummrary(id, summary) {
        try {
            await this.updateOne({
                _id: id
            }, {
                $set: {
                    summary: summary
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async publishCommentReply(commentId, replyId) {
        let fakeComment = await this.fakeCommentRepo.findById(commentId);
        if (fakeComment == null) {
            return;
        }
        let doc = await this.findById(fakeComment.page);
        if (doc == null) {
            return;
        }
        let comment = await this.commentRepo.findById(replyId);
        if (comment == null) {
            return;
        }
        try {
            if (fakeComment.replyText != undefined && fakeComment.replyAdmin != undefined) {
                let newCommnet = await this.commentRepo.insert({
                    text: fakeComment.replyText,
                    page: fakeComment.page,
                    module: this.typeName,
                    level: 1,
                    language: doc.language,
                    adminReplied: fakeComment.replyAdmin,
                    reply: comment._id,
                    status: fakeComment.status == "waiting" ? "proccessing" : fakeComment.status,
                    type: "comment",
                    manual: true,
                    manualId: commentId
                });
                await this.fakeCommentRepo.updateOne({
                    _id: commentId
                }, {
                    $set: {
                        isPublished: true
                    }
                });
                await this.contentPublishQueueRepo.findOneAndDelete({
                    pageType: fakeComment.pageType,
                    page: fakeComment.page,
                    type: "commentReply",
                    subId: fakeComment._id,
                });
            }
        }
        catch (error) {
            throw error;
        }
    }
    async publishCommnet(commentId) {
        let comment = await this.fakeCommentRepo.findById(commentId);
        if (comment == null) {
            return;
        }
        let doc = await this.findById(comment.page);
        if (doc == null) {
            return;
        }
        let newCommnet = await this.commentRepo.insert({
            text: comment.text,
            page: comment.page,
            module: this.typeName,
            level: 1,
            language: doc.language,
            userInfo: comment.userInfo,
            status: comment.status == "waiting" ? "proccessing" : comment.status,
            type: "comment",
            manual: true,
            manualId: commentId
        });
        await this.fakeCommentRepo.updateOne({
            _id: commentId
        }, {
            $set: {
                isPublished: true,
                publishAt: new Date()
            }
        });
        if (comment.replyText != undefined && comment.replyAdmin != undefined) {
            if (comment.replyPublishAt) {
                let publishAt = comment.replyPublishAt;
                let cycle = null;
                if (comment.replyCycle != undefined) {
                    cycle = await this.publishCycleRepo.findById(comment.replyCycle);
                    if (cycle != null) {
                        let times = cycle.time.split(":");
                        try {
                            publishAt.setHours(parseInt(times[0]));
                            publishAt.setMinutes(parseInt(times[1]));
                        }
                        catch (error) {
                        }
                    }
                }
                queue_1.default.schedule(publishAt, `publishCommentReply-${this.typeName}`, {
                    replyId: newCommnet._id,
                    commentId: commentId
                });
                let content = `
            <div>
                ${comment.replyText}
            </div>
            `;
                await this.contentPublishQueueRepo.insert({
                    pageType: comment.pageType,
                    page: comment.page,
                    type: "commentReply",
                    subId: comment._id,
                    content,
                    contentLength: articleProccessing_1.default.getWordCount(content),
                    date: publishAt,
                    cycle: comment.cycle
                });
                await this.contentPublishQueueRepo.findOneAndDelete({
                    pageType: comment.pageType,
                    page: comment.page,
                    type: "comment",
                    subId: comment._id,
                });
            }
            else {
                await this.publishCommentReply(commentId, newCommnet._id);
            }
        }
    }
    async publishCommnetReply(id, commentId) {
    }
    async publishCommonQuestion(id, subId) {
    }
    async checkSubContentUpdate(doc) {
        let contents = doc.contents || [];
        let id = doc._id;
        let now = new Date();
        await this.contentPublishQueueRepo.deleteMany({
            page: id,
            pageType: this.typeName,
            type: "content",
            publishAt: {
                $gt: now
            }
        });
        let start;
        let end;
        for (let i = 0; i < contents.length; i++) {
            if (contents[i].type == "content") {
                let date = new Date();
                let publishAt = contents[i].publishAt;
                if (publishAt != undefined && date < publishAt) {
                    let cycle = null;
                    if (contents[i].cycle != undefined) {
                        cycle = await this.publishCycleRepo.findById(contents[i].cycle);
                        if (cycle != null) {
                            let times = cycle.time.split(":");
                            try {
                                publishAt.setHours(parseInt(times[0]));
                                publishAt.setMinutes(parseInt(times[1]));
                            }
                            catch (error) {
                            }
                        }
                    }
                    await this.contentPublishQueueRepo.insert({
                        pageType: this.typeName,
                        page: id,
                        type: "content",
                        subId: contents[i]._id,
                        content: contents[i].content || "",
                        contentLength: articleProccessing_1.default.getWordCount(contents[i].content || ""),
                        date: publishAt,
                        cycle: contents[i].cycle,
                    });
                    if (start == undefined || start > publishAt) {
                        start = publishAt;
                    }
                    if (end == undefined || end < publishAt) {
                        end = publishAt;
                    }
                }
            }
        }
        await this.updateOne({
            _id: id
        }, {
            $set: {
                contetnUpdateStart: start,
                contetnUpdateEnd: end
            }
        });
    }
    extractContents(doc) {
        let data = [];
        data.push({
            text: doc.content || "",
            extra: {}
        });
        let contents = doc.contents || [];
        for (let i = 0; i < contents.length; i++) {
            data.push({
                text: contents[i].content || "",
                id: contents[i]._id,
                extra: {
                    status: contents[i].status,
                    publishAt: contents[i].publishAt
                }
            });
        }
        return data;
    }
    async checkCommentUpdate(doc) {
        let comments = [];
        let id = doc._id;
        let now = new Date();
        await this.contentPublishQueueRepo.deleteMany({
            page: id,
            pageType: this.typeName,
            type: "comment",
            publishAt: {
                $gt: now
            }
        });
        await queue_1.default.cancel({
            name: `publishComment-${this.typeName}`,
            "data.id": doc._id.toString()
        });
        let start;
        let end;
        for (let i = 0; i < comments.length; i++) {
            let date = new Date();
            let publishAt = comments[i].publishAt;
            if (publishAt != undefined && date < publishAt) {
                let cycle = null;
                if (comments[i].cycle != undefined) {
                    cycle = await this.publishCycleRepo.findById(comments[i].cycle);
                    if (cycle != null) {
                        let times = cycle.time.split(":");
                        try {
                            publishAt.setHours(parseInt(times[0]));
                            publishAt.setMinutes(parseInt(times[1]));
                        }
                        catch (error) {
                        }
                    }
                }
                if (start == undefined || start > publishAt) {
                    start = publishAt;
                }
                if (end == undefined || end < publishAt) {
                    end = publishAt;
                }
                queue_1.default.schedule(publishAt, `publishComment-${this.typeName}`, {
                    id: doc._id,
                    commentId: comments[i]._id
                });
                let content = `
                <div>
                    ${comments[i].text}
                </div>

                `;
                await this.contentPublishQueueRepo.insert({
                    pageType: this.typeName,
                    page: id,
                    type: "comment",
                    subId: comments[i]._id,
                    content: content,
                    contentLength: articleProccessing_1.default.getWordCount(content),
                    date: publishAt,
                    cycle: comments[i].cycle,
                });
            }
        }
        await this.updateOne({
            _id: id
        }, {
            $set: {
                commentUpdateStart: start,
                commentUpdateEnd: end
            }
        });
    }
    async checkCommonQuestionUpdate(doc) {
        let contents = doc.commonQuestions || [];
        let id = doc._id;
        let now = new Date();
        await this.contentPublishQueueRepo.deleteMany({
            page: id,
            pageType: this.typeName,
            type: "commonQuestions",
            publishAt: {
                $gt: now
            }
        });
        let start;
        let end;
        for (let i = 0; i < contents.length; i++) {
            let date = new Date();
            let publishAt = contents[i].publishAt;
            if (publishAt != undefined && date < publishAt) {
                let cycle = null;
                if (contents[i].cycle != undefined) {
                    cycle = await this.publishCycleRepo.findById(contents[i].cycle);
                    if (cycle != null) {
                        let times = cycle.time.split(":");
                        try {
                            publishAt.setHours(parseInt(times[0]));
                            publishAt.setMinutes(parseInt(times[1]));
                        }
                        catch (error) {
                        }
                    }
                }
                let content = `
                <div >

                <div >
                ${contents[i].question} 
                </div>
                ${contents[i].answer}
                </div>
                `;
                await this.contentPublishQueueRepo.insert({
                    pageType: this.typeName,
                    page: id,
                    type: "commonQuestions",
                    subId: contents[i]._id,
                    content: content,
                    contentLength: articleProccessing_1.default.getWordCount(content),
                    date: publishAt,
                    cycle: contents[i].cycle,
                });
                if (start == undefined || start > publishAt) {
                    start = publishAt;
                }
                if (end == undefined || end < publishAt) {
                    end = publishAt;
                }
            }
        }
        await this.updateOne({
            _id: id
        }, {
            $set: {
                commonQuestionUpdateStart: start,
                commonQuestionUpdateEnd: end
            }
        });
    }
    async doOnPublish(id) {
        let doc = await this.findById(id);
        if (doc == null || doc.contents == undefined || doc.contents.length == 0) {
            return;
        }
        try {
            this.checkSubContentUpdate(doc);
            // schaduler.cancel({
            //     name: `publishSubContent-${this.typeName}`,
            //     "data.id": doc._id.toString()
            // })
            // await this.contentPublishQueueRepo.findOneAndDelete({
            //     page : id ,
            //     pageType : this.typeName
            // })
            // let toPublish :any[]=[]
            // for (let i = 0; i < contents.length; i++) {
            //     if (
            //         contents[i].type == "content"
            //     ) {
            //         let date = new Date()
            //         let publishAt = contents[i].publishAt
            //         if (publishAt != undefined && date < publishAt) {
            //             schaduler.schedule(publishAt, `publishSubContent-${this.typeName}`, {
            //                 id: id.toString(),
            //                 subId: contents[i]._id.toString(),
            //             })
            //             toPublish.push({
            //                 date : publishAt,
            //                 subId : contents[i]._id
            //             })
            //         }
            //     }
            // }
            // await this.contentPublishQueueRepo.insert({
            //     page : id ,
            //     pageType : this.typeName,
            //     toPublish
            // } as any)
        }
        catch (error) {
            throw error;
        }
        // await schaduler.schedule(after.publishDate as Date, `publishContent-${this.typeName}`, {
        //     id: after._id.toString(),
        //     publish: this.publish.bind(this)
        // })
    }
    async doOnUnPublish(id) {
    }
    async replace(query, document) {
        var _a;
        try {
            var doc = await this.findOne(query);
            if (document.video) {
                await this.videoRepo.updateOne({
                    _id: document.video
                }, {
                    $set: {
                        page: doc === null || doc === void 0 ? void 0 : doc._id,
                        locked: true,
                        pageType: this.collection.modelName
                    }
                });
            }
            document._id = doc === null || doc === void 0 ? void 0 : doc._id;
            if (doc === null || doc === void 0 ? void 0 : doc.isPublished) {
                if (document.isPublished) {
                    document.publishDate = doc.publishDate;
                }
            }
            document.modifyDate = new Date();
            document.imageConfig = doc === null || doc === void 0 ? void 0 : doc.imageConfig;
            await this.collection.findOneAndReplace({
                _id: doc === null || doc === void 0 ? void 0 : doc._id
            }, document);
            var newDoc = await this.collection.findOne({
                _id: doc === null || doc === void 0 ? void 0 : doc._id
            });
            await this.updateContentVideos(newDoc);
            await this.refreshCache(query);
            if (doc === null || doc === void 0 ? void 0 : doc.isPublished) {
                if (newDoc === null || newDoc === void 0 ? void 0 : newDoc.isPublished) {
                    await this.checkFileUses(doc === null || doc === void 0 ? void 0 : doc._id);
                    setTimeout(async () => {
                        try {
                            await this.refreshImageProccess(doc, newDoc);
                        }
                        catch (error) {
                            console.log("er refreshImageProccess");
                        }
                    }, 1000);
                    let d = this.contentRepo.checkForEdit({
                        id: newDoc._id.toHexString(),
                        type: this.typeName,
                    }, document.seo, {
                        type: this.typeName,
                        category: newDoc === null || newDoc === void 0 ? void 0 : newDoc.category,
                        language: newDoc === null || newDoc === void 0 ? void 0 : newDoc.language,
                        customFunc: this.contentFunc,
                        admin: newDoc === null || newDoc === void 0 ? void 0 : newDoc.author
                    });
                    await this.updateOne({
                        _id: doc._id
                    }, {
                        $set: {
                            seoContent: doc.seoContent || ((_a = (await d)) === null || _a === void 0 ? void 0 : _a._id)
                        }
                    });
                    newDoc = await this.collection.findOne(query);
                    if ((newDoc === null || newDoc === void 0 ? void 0 : newDoc.video) != undefined)
                        await this.videoRepo.startProccess(doc === null || doc === void 0 ? void 0 : doc.video, doc === null || doc === void 0 ? void 0 : doc.language);
                    if ((newDoc === null || newDoc === void 0 ? void 0 : newDoc.videos) != undefined) {
                        for (let i = 0; i < (newDoc === null || newDoc === void 0 ? void 0 : newDoc.videos.length); i++) {
                            await this.videoRepo.startProccess(newDoc === null || newDoc === void 0 ? void 0 : newDoc.videos[i], doc === null || doc === void 0 ? void 0 : doc.language);
                        }
                    }
                    setTimeout(async () => {
                        try {
                            await this.doOnPublish(newDoc === null || newDoc === void 0 ? void 0 : newDoc._id);
                        }
                        catch (error) {
                        }
                    }, 1000);
                }
                else {
                    await this.unPublish(newDoc === null || newDoc === void 0 ? void 0 : newDoc._id);
                    await this.insertToSeoDraft(newDoc);
                    if ((newDoc === null || newDoc === void 0 ? void 0 : newDoc.publishDate) != undefined) {
                        await queue_1.default.schedule(document.publishDate, `publishContent-${this.typeName}`, {
                            id: newDoc === null || newDoc === void 0 ? void 0 : newDoc._id.toString(),
                            publish: this.publish.bind(this)
                        });
                    }
                    setTimeout(async () => {
                        try {
                            await this.checkFileUses(newDoc === null || newDoc === void 0 ? void 0 : newDoc._id.toString());
                        }
                        catch (error) {
                            console.log("");
                        }
                    }, 1000);
                }
            }
            else {
                if (newDoc === null || newDoc === void 0 ? void 0 : newDoc.isPublished) {
                    await this.checkFileUses(doc === null || doc === void 0 ? void 0 : doc._id);
                    await this.publish(doc === null || doc === void 0 ? void 0 : doc._id, {
                        category: this.typeName == "category" ? newDoc.catID : undefined
                    });
                }
                else {
                    await this.insertToSeoDraft(newDoc);
                    if ((newDoc === null || newDoc === void 0 ? void 0 : newDoc.publishDate) != undefined) {
                        await queue_1.default.cancel({
                            name: `publishContent-${this.typeName}`,
                            "data.id": doc === null || doc === void 0 ? void 0 : doc._id
                        });
                        await queue_1.default.schedule(document.publishDate, `publishContent-${this.typeName}`, {
                            id: newDoc === null || newDoc === void 0 ? void 0 : newDoc._id.toString(),
                            publish: this.publish.bind(this)
                        });
                    }
                    setTimeout(async () => {
                        try {
                            await this.checkFileUses(newDoc === null || newDoc === void 0 ? void 0 : newDoc._id.toString());
                        }
                        catch (error) {
                            console.log("");
                        }
                    }, 1000);
                }
            }
            return newDoc;
            // if (doc != null) {
            //     await this.checkFileUses(doc?._id.toString())
            //     if (doc?.publishDate != document.publishDate) {
            //         await schaduler.cancel({
            //             name: `publishContent-${this.typeName}`,
            //             "data.id": doc?._id
            //         })
            //         if(doc.isPublished ==  true){
            //             await this.unPublish(doc._id)
            //             this.insertToSeoDraft(newDoc)
            //         }
            //         if (document.publishDate != undefined) {
            //             await schaduler.schedule(document.publishDate as Date, `publishContent-${this.typeName}`, {
            //                 id: doc?._id.toString(),
            //                 publish: this.publish.bind(this)
            //             })
            //         } 
            //     }
            //     if (document.publishDate == undefined && document.isPublished == true) {
            //         return await this.publish(doc?._id,{
            //             category: this.typeName == "category" ? (newDoc as any).catID : undefined
            //         })
            //     }
            //     else {
            //         this.insertToSeoDraft(newDoc)
            //     }
            // }
            // return
        }
        catch (error) {
            console.log("eeee");
            console.log(error);
            throw error;
        }
    }
    async getVideosDoc(doc) {
        try {
            let videoIds = this.getVideos(doc, true);
            let videos = await this.videoRepo.findAll({
                _id: videoIds
            });
            return videos;
        }
        catch (error) {
            throw error;
        }
    }
    extractUrlsFromSrcset(srcset) {
        return srcset
            .split(",")
            .map(s => s.trim().split(/\s+/)[0])
            .filter(Boolean);
    }
    isValidFileUrl(url) {
        if (!url)
            return false;
        if (url === "#" || url.startsWith("#"))
            return false;
        if (url.startsWith("javascript:"))
            return false;
        // اگر فقط آدرس صفحه بدون فایل باشه
        try {
            const u = new URL(url, "https://dummy-base.com");
            if (!u.pathname || u.pathname === "/")
                return false;
        }
        catch (_a) {
            return false;
        }
        // فقط پسوند فایل‌های رسانه‌ای
        const mediaExt = /\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|ogg|mp3|wav|m4a|flac)$/i;
        if (mediaExt.test(url) || url.startsWith("data:"))
            return true;
        return false;
    }
    extractFileLinks(html) {
        const dom = new jsdom_1.JSDOM(html);
        const { document } = dom.window;
        const urls = new Set();
        // همه‌ی تگ‌هایی که attribute های src یا href دارند
        const allElements = Array.from(document.querySelectorAll("*"));
        allElements.forEach(el => {
            // همه‌ی attribute های احتمالی
            ["src", "href", "poster", "data-src", "data-href"].forEach(attr => {
                const val = el.getAttribute(attr);
                if (val)
                    urls.add(val);
            });
            // srcset مخصوصاً برای <img> و <source>
            const srcset = el.getAttribute("srcset");
            if (srcset) {
                this.extractUrlsFromSrcset(srcset).forEach(u => urls.add(u));
            }
            // inline style: background-image: url(...)
            const style = el.getAttribute("style");
            if (style) {
                const regex = /url\(([^)]+)\)/ig;
                let m;
                while ((m = regex.exec(style)) !== null) {
                    let u = m[1].trim().replace(/^['"]|['"]$/g, "");
                    if (u)
                        urls.add(u);
                }
            }
        });
        return Array.from(urls).filter(this.isValidFileUrl);
    }
    async doFindFiles(doc) {
        var _a, _b, _c, _d;
        let files = (doc === null || doc === void 0 ? void 0 : doc.fileUses) || [];
        if (doc.video != undefined) {
            try {
                const video = await this.videoRepo.findById(doc.video);
                // let paths= 
                if (video != null) {
                    files.push(video === null || video === void 0 ? void 0 : video.src);
                    let otherPaths = video.result.map((p) => p.path);
                    files.push(...otherPaths);
                }
            }
            catch (error) {
            }
        }
        if ((_a = doc.seo) === null || _a === void 0 ? void 0 : _a.social) {
            try {
                for (let i = 0; i < ((_b = doc.seo) === null || _b === void 0 ? void 0 : _b.social.length); i++) {
                    if ((_c = doc.seo) === null || _c === void 0 ? void 0 : _c.social[i].image) {
                        files.push((_d = doc.seo) === null || _d === void 0 ? void 0 : _d.social[i].image);
                    }
                }
            }
            catch (error) {
            }
        }
        let contents = this.fetchContents(doc);
        for (let i = 0; i < contents.length; i++) {
            files.push(...this.extractFileLinks(contents[i]));
        }
        files = files.filter(item => item !== undefined && item !== null);
        return files;
    }
    async checkFileUses(id) {
        var doc = await this.findById(id);
        if (doc == null)
            return;
        var files = await this.doFindFiles(doc);
        return this.fileUsesRepo.makeChangeFileUses(id, files, this.typeName);
    }
    async isUrlExists(url, isStatic = false, config, id) {
        try {
            config.type = this.typeName;
            config.customFunc = this.contentFunc;
            const finaURL = await this.contentRepo.makeURL(url, isStatic, config);
            let q = {
                url: finaURL
            };
            if (id != undefined) {
                q["id"] = {
                    "$ne": id
                };
            }
            return await this.contentRepo.isUrlExists(finaURL, id) || this.seoDraftRepo.isExists(q);
        }
        catch (error) {
            throw error;
        }
    }
    async findByIdAndUpdate(id, queryData) {
        try {
            var before = await this.findById(id, { fromDb: true });
            var res = await super.findByIdAndUpdate(id, queryData);
            var after = await this.collection.findById(id);
            if (before != null && after != null) {
                if (before.isPublished) {
                    if (!after.isPublished) {
                        await this.unPublish(after._id);
                        if (after.publishDate != undefined) {
                            await queue_1.default.schedule(after.publishDate, `publishContent-${this.typeName}`, {
                                id: after._id.toString(),
                                publish: this.publish.bind(this)
                            });
                        }
                        else {
                            await this.insertToSeoDraft(after);
                        }
                    }
                    else {
                        after.seo["id"] = after._id.toHexString();
                        await this.contentRepo.checkForEdit({
                            id: after._id.toHexString(),
                            type: this.typeName
                        }, after.seo, {
                            type: this.typeName,
                            category: after === null || after === void 0 ? void 0 : after.category,
                            language: after === null || after === void 0 ? void 0 : after.language,
                            customFunc: this.contentFunc,
                            admin: after.author
                        });
                    }
                }
                else {
                    if (after.isPublished) {
                        await this.publish(after._id, {
                            category: this.typeName == "category" ? after.catID : undefined
                        });
                    }
                    else if (after.publishDate != undefined) {
                        await queue_1.default.cancel({
                            name: `publishContent-${this.typeName}`,
                            "data.id": before._id.toString()
                        });
                        if (after.publishDate != undefined) {
                            await queue_1.default.schedule(after.publishDate, `publishContent-${this.typeName}`, {
                                id: after._id.toString(),
                                publish: this.publish.bind(this)
                            });
                        }
                    }
                    else {
                        await this.insertToSeoDraft(after);
                    }
                }
            }
            return res;
        }
        catch (error) {
            throw error;
        }
    }
    async getExtra(doc) {
        return doc;
    }
    fetchContents(doc) {
        let contents = [];
        if (doc.contents == undefined) {
            return [];
        }
        for (let i = 0; i < doc.contents.length; i++) {
            contents.push(doc.contents[i].content || "");
        }
        return contents;
    }
    async proccessContentImages(content, domainImage, savePath, images, contentNumber) {
        try {
            for (const img of images) {
                if (!img.src || !img.width)
                    continue;
                try {
                    content = await this.processSingleImage(content, img, domainImage, savePath, contentNumber);
                }
                catch (error) {
                    console.log("❌ Error processing image:", img.src, error);
                }
            }
            return content;
        }
        catch (error) {
            throw error;
        }
    }
    async processSingleImage(content, img, domainImage, savePath, contentNumber) {
        const isNonConvert = domainImage["nonConvert-Suffixs"]
            .includes(path_1.default.extname(img.src).substring(1));
        if (isNonConvert) {
            return content;
        }
        const imageSuffix = isNonConvert
            ? [path_1.default.extname(img.src).substring(1)]
            : domainImage["in-content-image-result-Suffixs"];
        const quality = isNonConvert
            ? domainImage["in-content-compress-quality"]
            : 100;
        const watermark = domainImage["in-content-watermark"] ? domainImage["in-content-watermark-config"] : undefined;
        // 🖼 نسخه دسکتاپ
        const resized = await imageProccessing_1.default.resizeAndRename("temp/", img.original || img.src, {
            mobile: false,
            q: quality,
            suffixs: imageSuffix,
            x: parseInt(img.width),
            watermark,
            isMapImg: img.isMapImg
        });
        const uploaded = await this.uploadAndClean(resized, savePath, domainImage, contentNumber);
        content = this.changeUrlSetting(content, {
            mobile: false,
            newSrc: uploaded,
            src: img.src,
            original: img.original
        });
        // 📱 نسخه موبایل
        if (domainImage["make-phone-image"]) {
            const mobileRes = await this.processForMobile(img, domainImage, savePath, watermark, contentNumber, imageSuffix);
            content = this.changeUrlSetting(content, {
                mobile: true,
                newSrc: mobileRes,
                src: img.src,
                original: img.original
            });
        }
        //
        return content;
    }
    async uploadAndClean(resizedFiles, savePath, domainImage, contentNumber) {
        const uploaded = [];
        for (const filePath of resizedFiles) {
            const parts = filePath.split("/");
            const destination = (await getPathResolver("image", savePath.path, domainImage["image-addressing"], contentNumber)())
                + parts[parts.length - 1];
            const uploadedUrl = await this.cdn.upload(filePath, destination);
            uploaded.push(uploadedUrl);
            try {
                await fileManager_1.DiskFileManager.removeFile(filePath);
            }
            catch (_a) { }
        }
        return uploaded;
    }
    async processForMobile(img, domainImage, savePath, watermark, contentNumber, suffixs = []) {
        const resized = await imageProccessing_1.default.resizeAndRename("temp/", img.original || img.src, {
            mobile: true,
            q: domainImage["compress-quality"],
            suffixs,
            x: Math.min(parseInt(img.width), domainImage['phone-width']),
            watermark,
            isMapImg: img.isMapImg
        });
        return this.uploadAndClean(resized, savePath, domainImage, contentNumber);
    }
    async isMainImageChanged(config, domainImageConfig) {
        try {
            let query = {
                source: config.source,
                imageLocation: config.imageLocation,
                // page: config.page
            };
            const imgRes = await this.imageResultRepo.findOne(query);
            if (imgRes == null) {
                if (config.imageLocation != "main") {
                    return {
                        changed: true
                    };
                }
                const imageRes = await this.imageResultRepo.findOne({
                    imageLocation: config.imageLocation,
                    page: config.page
                });
                if (imageRes != null) {
                    return {
                        changed: true,
                        imageRes
                    };
                }
                return {
                    changed: true,
                };
            }
            if (imgRes.isDeleted == true) {
                return {
                    changed: false
                };
            }
            if (imgRes.size != config.size ||
                imgRes.resolution.width != config.resolution.width ||
                imgRes.resolution.height != config.resolution.height) {
                return {
                    changed: true,
                    imageRes: imgRes
                };
            }
            if (config.cropingData != undefined) {
                if (imgRes.cropingData == undefined)
                    return {
                        changed: true,
                        imageRes: imgRes
                    };
                for (const key in config.cropingData) {
                    if (imgRes.cropingData[key] == undefined ||
                        config.cropingData[key].x != imgRes.cropingData[key].x ||
                        config.cropingData[key].y != imgRes.cropingData[key].y) {
                        return {
                            changed: true,
                            imageRes: imgRes
                        };
                    }
                }
            }
            if (domainImageConfig.lastUpdate && imgRes.lastBuild < domainImageConfig.lastUpdate) {
                return {
                    changed: true,
                    imageRes: imgRes
                };
            }
            if (domainImageConfig["watermark-main"] && domainImageConfig["main-watermark-config"] != null
                && imgRes.lastBuild < domainImageConfig["main-watermark-config"].lastUpdate) {
                return {
                    changed: true,
                    imageRes: imgRes
                };
            }
            return {
                changed: false
            };
        }
        catch (error) {
            throw error;
        }
    }
    getMainRemakeInfo(domainImageConfig) {
        let result = {
            "resultQuality": 100,
            "resultTypes": domainImageConfig["main-image-result-Suffixs"]
        };
        if (domainImageConfig["main-remaked-compress"] && domainImageConfig["main-remaked-compress-quality"]) {
            result["resultQuality"] = domainImageConfig["main-remaked-compress-quality"];
        }
        return result;
    }
    async deleteMainImageSrc(src) {
        try {
            await this.cdn.findCdnFromUrl(src);
            await this.cdn.removeFiles([src]);
        }
        catch (error) {
            throw error;
        }
    }
    async compressMainImage(src, quality) {
        try {
            await this.cdn.findCdnFromUrl(src);
            const file = await fileManager_1.DiskFileManager.downloadFile(src);
            await imageProccessing_1.default.compress(file, file, quality);
            // await this.cdn.
        }
        catch (error) {
            return false;
        }
    }
    async deleteImageResultsIfPossibble(imgRes, pageId) {
        // this.fileUsesRepo.
        try {
            let canDelete = await this.fileUsesRepo.canDelete(imgRes.source, pageId);
            if (canDelete) {
                await this.cdn.findCdnFromUrl(imgRes.source);
                await this.cdn.removeFiles([imgRes.source]);
            }
            if (imgRes.results.length > 0) {
                // await this.cdn.findCdnFromUrl(imgRes.results[0].src)
                for (let i = 0; i < imgRes.results.length; i++) {
                    await this.cdn.findCdnFromUrl(imgRes.results[i].src);
                    await this.cdn.removeFiles([imgRes.results[i].src]);
                }
            }
        }
        catch (error) {
            throw error;
        }
    }
    async changeMainImages(doc) {
        var _a, _b;
        try {
            const domainImage = await this.getDomainImage(doc);
            if (!domainImage)
                return;
            const conf = await this.getCDNConfig(domainImage["upload-path"]);
            if (!conf)
                return;
            const canEdit = await this.canEditMainImage(doc, domainImage);
            if (canEdit.changed == false)
                return;
            const config = await this.getTemplateConfig(doc, domainImage);
            const processedImages = await this.processImages(doc, config);
            const finalImages = await this.applyWatermarkAndUpload(processedImages, domainImage, doc, conf);
            let isDeleted = false;
            let isCompressed = false;
            if (domainImage["remove-main-image-src"]) {
                isDeleted = true;
            }
            else if (domainImage["compress-main"] == true && domainImage["main-compress-quality"] != undefined
                && (doc.resolutionConfig.srcChanged || ((_a = canEdit.imageRes) === null || _a === void 0 ? void 0 : _a.isCompressed) != true)) {
                try {
                    await this.compressMainImage(doc.resolutionConfig.source, domainImage["main-compress-quality"]);
                    isCompressed = true;
                }
                catch (error) {
                }
            }
            if (isDeleted) {
                try {
                    await this.deleteMainImageSrc(doc.resolutionConfig.source);
                }
                catch (error) {
                    isDeleted = false;
                }
            }
            let results = finalImages.map(function (elem, index) {
                return {
                    type: elem.name.split("$")[0],
                    template: elem.name.split("$")[1],
                    src: elem.path
                };
            });
            if (canEdit.imageRes != undefined) {
                if (canEdit.imageRes.source != doc.resolutionConfig.source && doc.resolutionConfig.deletePrevious == true) {
                    await this.deleteImageResultsIfPossibble(canEdit.imageRes, doc._id);
                    await this.imageResultRepo.deleteById(canEdit.imageRes._id);
                    await this.imageResultRepo.insert({
                        page: doc._id,
                        pageType: this.typeName,
                        source: doc.resolutionConfig.source,
                        imageLocation: "main",
                        isCompressed,
                        isDeleted,
                        size: (await fileManager_1.DiskFileManager.urlStat(doc.resolutionConfig.source)).size,
                        resolution: await imageProccessing_1.default.getDimensions(doc.resolutionConfig.source),
                        cropingData: doc.resolutionConfig.conf,
                        lastBuild: new Date(),
                        results
                    });
                }
                else {
                    await this.imageResultRepo.updateOne({
                        _id: (_b = canEdit.imageRes) === null || _b === void 0 ? void 0 : _b._id
                    }, {
                        $set: {
                            isCompressed,
                            pageType: this.typeName,
                            isDeleted,
                            size: (await fileManager_1.DiskFileManager.urlStat(doc.resolutionConfig.source)).size,
                            resolution: await imageProccessing_1.default.getDimensions(doc.resolutionConfig.source),
                            cropingData: doc.resolutionConfig.conf,
                            lastBuild: new Date(),
                            results
                        }
                    });
                }
            }
            else {
                await this.imageResultRepo.insert({
                    page: doc._id,
                    source: doc.resolutionConfig.source,
                    imageLocation: "main",
                    isCompressed,
                    pageType: this.typeName,
                    isDeleted,
                    size: (await fileManager_1.DiskFileManager.urlStat(doc.resolutionConfig.source)).size,
                    resolution: await imageProccessing_1.default.getDimensions(doc.resolutionConfig.source),
                    cropingData: doc.resolutionConfig.conf,
                    lastBuild: new Date(),
                    results
                    // results : ?
                });
            }
            await this.updateDocumentMainImage(doc, finalImages);
        }
        catch (error) {
            console.error("Error in changeMainImages:", error);
        }
    }
    async getDomainImage(doc) {
        let lang = await this.langRepo.findById(doc.language);
        let domain = (lang === null || lang === void 0 ? void 0 : lang.domain)
            ? await this.domainRepo.findById(lang.domain)
            : await this.domainRepo.findOne({ isDefault: true });
        if (!domain)
            return null;
        return this.domainImageRepo.findOne({ domain: domain._id }, {}, [{ path: "main-watermark-config" }]);
    }
    async getCDNConfig(uploadPath) {
        let conf = uploadPath ? await this.cdnRepo.findById(uploadPath.fileManager) : null;
        if (!conf) {
            conf = await this.cdnRepo.findOne({ isDefaultContent: true });
        }
        return conf;
    }
    async canEditMainImage(doc, domainImage) {
        return this.isMainImageChanged({
            imageLocation: "main",
            page: doc._id,
            source: doc.resolutionConfig.source,
            size: (await fileManager_1.DiskFileManager.urlStat(doc.resolutionConfig.source)).size,
            resolution: await imageProccessing_1.default.getDimensions(doc.resolutionConfig.source),
            cropingData: doc.resolutionConfig.conf,
        }, domainImage);
    }
    async getTemplateConfig(doc, domainImage) {
        let config = await this.templateConfigRepo.findOne({ template: doc.template, language: doc.language });
        if (!config)
            config = await this.templateConfigRepo.findOne({ template: doc.template });
        if (!config)
            config = await this.templateConfigRepo.findOne({});
        if (config === null || config === void 0 ? void 0 : config.imageConfig) {
            const remakeInfo = this.getMainRemakeInfo(domainImage);
            config.imageConfig = config.imageConfig.map((ic) => ({
                ...ic,
                compersionConfig: remakeInfo
            }));
        }
        return config;
    }
    async processImages(doc, config) {
        return imageProccessing_1.default.proccessFromConfig(config_1.default.getConfig("staticRoute"), doc.resolutionConfig.source, config === null || config === void 0 ? void 0 : config.imageConfig, doc.resolutionConfig.conf);
    }
    async applyWatermarkAndUpload(images, domainImage, doc, conf) {
        const cdn = new fileManager_1.default();
        if (conf)
            cdn.initFromConfig({
                config: conf.config,
                hostUrl: conf.hostUrl || "",
                id: conf._id,
                type: conf.type
            });
        let tempDir = "";
        if (domainImage["main-watermark-config"]) {
            const tempName = Date.now().toString();
            await fileManager_1.DiskFileManager.mkdir("temp/", tempName);
            tempDir = `temp/${tempName}/`;
            const wm = domainImage["main-watermark-config"];
            if (wm) {
                const results = [];
                for (const img of images) {
                    try {
                        const newPath = await imageProccessing_1.default.makeWatermarks(img.path, [...wm.configs], tempDir);
                        results.push({ ...img, path: newPath });
                    }
                    catch (err) {
                        // results.push({ status: "rejected", reason: err });
                    }
                }
                images = results;
            }
        }
        const finalImages = [];
        const name = path_1.default.basename(doc.resolutionConfig.source).split(".")[0];
        for (const img of images) {
            const finalPath = getUploadDestination(domainImage["upload-path"].path, domainImage["image-addressing"], doc.contentNumber)
                + img.name + "_" + name + path_1.default.extname(img.path);
            const uploaded = await cdn.uploadMany([{ path: img.path, destination: finalPath }], { rename: true });
            finalImages.push({ ...img, path: uploaded[0] });
        }
        if (tempDir)
            await fileManager_1.DiskFileManager.removeFolder(tempDir);
        return finalImages;
    }
    async updateDocumentMainImage(doc, images) {
        await this.collection.updateOne({ _id: doc._id }, { $set: { imageConfig: images, imageProccessed: true } });
    }
    async proccessIncontentImages(after, before) {
        let lang = await this.langRepo.findById(after.language);
        if (lang === null || lang === void 0 ? void 0 : lang.domain) {
            var domain = await this.domainRepo.findById(lang.domain);
        }
        else {
            var domain = await this.domainRepo.findOne({
                isDefault: true
            });
        }
        let domainImage = await this.domainImageRepo.findOne({
            domain: domain === null || domain === void 0 ? void 0 : domain._id
        }, {}, [
            {
                path: "in-content-watermark-config"
            }
        ]);
        if (domainImage == null) {
            return;
        }
        let savePath = domainImage === null || domainImage === void 0 ? void 0 : domainImage["upload-path"];
        var conf = await this.cdnRepo.findById(savePath.fileManager);
        if (conf == null) {
            var conf = await this.cdnRepo.findOne({
                isDefaultContent: true
            });
        }
        if (conf == null)
            return;
        let contentsBefore = before ? this.fetchContents(before) : [];
        let imagesBefore = [];
        for (let i = 0; i < contentsBefore.length; i++) {
            imagesBefore.push(...await this.extractImageUrls(contentsBefore[i]));
        }
        let contents = after.contents || [];
        for (let i = 0; i < contents.length; i++) {
            let imagesAfter = await this.extractImageUrls(contents[i].content || "");
            let images = [];
            for (let z = 0; z < imagesAfter.length; z++) {
                let exists = false;
                let newImage = true;
                for (let j = 0; j < imagesBefore.length; j++) {
                    if (imagesAfter[z].src == imagesBefore[j].src && newImage) {
                        newImage = false;
                    }
                    if (imagesAfter[z].src == imagesBefore[j].src &&
                        imagesAfter[z].width != null && imagesBefore[j].width != null
                    // && imagesAfter[z].width != imagesBefore[j].width
                    ) {
                        exists = true;
                        if (imagesAfter[z].original != null) {
                            images.push({
                                original: imagesAfter[z].original,
                                src: imagesAfter[z].original,
                                width: imagesAfter[z].width,
                                isMapImg: imagesAfter[z].isMapImg
                            });
                        }
                        break;
                    }
                }
                if (exists == true) {
                    images.push({
                        src: imagesAfter[z].src,
                        width: imagesAfter[z].width,
                        isMapImg: imagesAfter[z].isMapImg
                    });
                }
                if (newImage) {
                    images.push({
                        src: imagesAfter[z].src,
                        width: imagesAfter[z].width,
                        isMapImg: imagesAfter[z].isMapImg
                    });
                }
            }
            contents[i].content = await this.proccessContentImages(contents[i].content || "", domainImage, savePath, images, after.contentNumber);
        }
        await this.updateOne({
            _id: after._id
        }, {
            $set: {
                contents
            }
        });
    }
    async proccessImageAfterPublish(doc) {
        try {
            await this.changeMainImages(doc);
            await this.proccessIncontentImages(doc);
            await this.checkFileUses(doc === null || doc === void 0 ? void 0 : doc._id.toString());
        }
        catch (error) {
            // console.log(error)
        }
    }
    changeUrlSetting(content, options) {
        var _a;
        let html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document</title>
        </head>
        <body>
            <div id="content"></div>
        </body>
        </html>
`;
        const { window } = new jsdom_1.JSDOM(html);
        const { document } = window;
        let contentElem = document.getElementById("content");
        if (contentElem != null)
            contentElem.innerHTML = content;
        let sorts = ["jpg", "webp"];
        let mainIndex = 0;
        let b = false;
        for (let i = 0; i < sorts.length; i++) {
            for (let j = 0; j < options.newSrc.length; j++) {
                if (options.newSrc[j].endsWith(sorts[i])) {
                    mainIndex = j;
                    b = true;
                    break;
                }
            }
            if (b) {
                break;
            }
        }
        let imgs = document.querySelectorAll('img');
        for (let i = 0; i < imgs.length; i++) {
            let img = imgs[i];
            if (img.src == options.src || (options.mobile && img.getAttribute("original") == options.src)) {
                if (options.mobile) {
                    for (let j = 0; j < options.newSrc.length; j++) {
                        if (j == mainIndex) {
                            img.setAttribute('main-mb', options.newSrc[j]);
                        }
                        else {
                            img.setAttribute(path_1.default.extname(options.newSrc[j]).substring(1) + "-mb", options.newSrc[j]);
                        }
                    }
                }
                else {
                    img.setAttribute('original', options.original || options.src);
                    for (let j = 0; j < options.newSrc.length; j++) {
                        if (j == mainIndex) {
                            img.src = options.newSrc[j];
                        }
                        else {
                            img.setAttribute(path_1.default.extname(options.newSrc[j]).substring(1), options.newSrc[j]);
                        }
                    }
                }
            }
        }
        ;
        return ((_a = document.getElementById("content")) === null || _a === void 0 ? void 0 : _a.innerHTML) || "";
    }
    async insureVideoScreenshot(link, img) {
        try {
            let vid = await this.videoRepo.findOne({
                $or: [
                    {
                        src: link,
                    },
                    {
                        "result.path": link
                    }
                ],
            });
            if (vid == null) {
                await this.videoRepo.insert({
                    src: link,
                    screenshots: [img]
                });
            }
            else if (vid.screenshots == undefined || vid.screenshots.length == 0) {
                await this.videoRepo.updateOne({
                    _id: vid._id
                }, {
                    $set: {
                        screenshots: [img]
                    }
                });
            }
        }
        catch (error) {
            throw error;
        }
    }
}
exports.default = BasePageRepository;
