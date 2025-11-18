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
// function addPublishLog(target: any,
//     propertyKey: string,
//     propertyDescriptor: PropertyDescriptor
// ): PropertyDescriptor {
//     propertyDescriptor = propertyDescriptor;
//     const originalMethod = propertyDescriptor.value;
//     propertyDescriptor.value = async function (...args: any[]) {
//         const self = this as BasePageRepository<BasePage>;
//         let content = ""
//         try {
//             var result = await originalMethod.apply(this, args);
//             let doc = await self.findOne({
//                 _id: args[0],
//                 "contents._id": args[1]
//             }, {
//                 projection : {
//                     contents: { $elemMatch: { _id: args[1] } } 
//                 }
//             })
//             if(doc == null) {
//                 return
//             }
//             content = doc.contents?.[0]?.content || ""
//             await self.contentPublishLogRepo.insert({
//                 pageType : this.typeName,
//                 page : args[0],
//                 subId : args[1],
//                 date : new Date(),
//                 webmasterUpdated : true,
//                 content 
//             } as any)
//             return result;
//         } catch (err :any) {
//             // // console.log(err)
//             // err.message
//             await self.contentPublishLogRepo.insert({
//                 pageType : this.typeName,
//                 page : args[0],
//                 subId : args[1],
//                 date : new Date(),
//                 webmasterUpdated : true,
//                 error : err.message,
//                 content
//             } as any)
//             throw err;
//         }
//     };
//     return propertyDescriptor;
// }
class BasePageRepository extends repository_1.default {
    constructor(options) {
        super(options.model, options);
        this.typeName = options.typeName;
        this.contentFunc = options.contentFunc;
        if (this.typeName != undefined && this.contentFunc) {
            repository_2.customUrlBuilder[this.typeName] = this.contentFunc;
        }
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
                    console.log(i, files[i].path);
                    let file = await fileManager_1.DiskFileManager.downloadFile(files[i].path);
                    console.log("file", file);
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
            // if (otherArticles[i].video) {
            //     videos?.push(otherArticles[i].video as string)
            // }
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
                        locked: true
                    }
                });
            }
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
                }
            }
            results.push({
                src: img.getAttribute('src'),
                width,
                original: img.getAttribute("original")
            });
        }
        return results;
    }
    ;
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
            customFunc: this.contentFunc
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
        if (doc != null)
            await this.checkFileUses(doc._id.toString());
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
                            customFunc: this.customFunc
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
    // public 
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
        let domain = language.domain != undefined ? await this.domainRepo.findById(language.domain) : this.domainRepo.findOne({
            isDefault: true
        });
        if (domain == null) {
            return null;
        }
        return domain;
    }
    // @addPublishLog
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
                    status: "confirmed",
                    type: "comment",
                    manual: true
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
            status: "confirmed",
            type: "comment",
            manual: true
        });
        if (comment.replyText != undefined && comment.replyAdmin != undefined && comment.replyPublishAt) {
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
        }
        // if(comment.ad)
        // if(doc == null || doc.comments == undefined || doc.comments.length == 0){
        //     return
        // }
        // let comment = doc.comments[0]
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
            //replace
            await this.deleteById(doc === null || doc === void 0 ? void 0 : doc._id);
            document._id = doc === null || doc === void 0 ? void 0 : doc._id;
            if (doc === null || doc === void 0 ? void 0 : doc.isPublished) {
                if (document.isPublished) {
                    document.publishDate = doc.publishDate;
                }
            }
            document.modifyDate = new Date();
            var newDoc = await this.collection.create(document);
            await this.refreshCache(query);
            await this.checkFileUses(newDoc === null || newDoc === void 0 ? void 0 : newDoc._id.toString());
            if (doc === null || doc === void 0 ? void 0 : doc.isPublished) {
                if (newDoc === null || newDoc === void 0 ? void 0 : newDoc.isPublished) {
                    this.refreshImageProccess(doc, newDoc);
                    let d = this.contentRepo.checkForEdit({
                        id: newDoc._id.toHexString(),
                        type: this.typeName
                    }, newDoc.seo, {
                        type: this.typeName,
                        category: newDoc === null || newDoc === void 0 ? void 0 : newDoc.category,
                        language: newDoc === null || newDoc === void 0 ? void 0 : newDoc.language,
                        customFunc: this.contentFunc
                    });
                    this.updateOne({
                        _id: doc._id
                    }, {
                        $set: {
                            seoContent: doc.seoContent || ((_a = (await d)) === null || _a === void 0 ? void 0 : _a._id)
                        }
                    });
                    this.doOnPublish(newDoc === null || newDoc === void 0 ? void 0 : newDoc._id);
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
                }
            }
            else {
                if (newDoc === null || newDoc === void 0 ? void 0 : newDoc.isPublished) {
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
    async doFindFiles(doc) {
        var _a, _b, _c, _d;
        let files = (doc === null || doc === void 0 ? void 0 : doc.fileUses) || [];
        // doc.mainImage ? files.push(doc.mainImage) : true
        // if (doc.files)
        //     files.push(...doc?.files)
        // if (doc.videos)
        //     files.push(... (doc.videos.map((elem: any) => {
        //         return elem.mainSrc
        //     })) as string[])
        if (doc.video != undefined) {
            try {
                const video = await this.videoRepo.findById(doc.video);
                // let paths= 
                if (video != null) {
                    // console.log("sec", video?.src)
                    files.push(video === null || video === void 0 ? void 0 : video.src);
                    let otherPaths = video.result.map((p) => p.path);
                    // console.log("otherPaths", otherPaths)
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
            // console.log("finaURL" , finaURL)
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
            // console.log(error)
            throw error;
        }
    }
    async findByIdAndUpdate(id, queryData) {
        try {
            // if(queryData)
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
                            customFunc: this.contentFunc
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
            for (let i = 0; i < images.length; i++) {
                if (images[i].src == null) {
                    continue;
                }
                if (images[i].width != null) {
                    try {
                        if (domainImage["nonConvert-Suffixs"].includes(path_1.default.extname(images[i].src || " ").substring(1))) {
                            let res = await imageProccessing_1.default.resizeAndRename("temp/", images[i].original || images[i].src, {
                                mobile: false,
                                q: domainImage["compress-quality"],
                                suffixs: [path_1.default.extname(images[i].src || " ").substring(1)],
                                x: parseInt(images[i].width),
                                watermark: domainImage["watermark-config"]
                            });
                            for (let z = 0; z < res.length; z++) {
                                var destinationPath = res[z].split("/");
                                let file = res[z];
                                res[z] = await this.cdn.upload(res[z], (await getPathResolver("image", savePath.path, domainImage["image-addressing"], contentNumber)()) +
                                    destinationPath[destinationPath.length - 1]);
                                try {
                                    await fileManager_1.DiskFileManager.removeFile(file);
                                }
                                catch (error) {
                                }
                            }
                            content = this.changeUrlSetting(content, {
                                mobile: false,
                                newSrc: res,
                                src: images[i].src || "",
                                original: images[i].original
                            });
                            let mobileRes;
                            if (domainImage["make-phone-image"]) {
                                mobileRes = await imageProccessing_1.default.resizeAndRename("temp/", images[i].original || images[i].src, {
                                    mobile: true,
                                    q: domainImage["compress-quality"],
                                    suffixs: [path_1.default.extname(images[i].src || " ").substring(1)],
                                    x: Math.min(parseInt(images[i].width), domainImage['phone-width']),
                                    watermark: domainImage["watermark-config"]
                                });
                                for (let z = 0; z < mobileRes.length; z++) {
                                    var destinationPath = mobileRes[z].split("/");
                                    let file = mobileRes[z];
                                    mobileRes[z] = await this.cdn.upload(mobileRes[z], (await getPathResolver("image", savePath.path, domainImage["image-addressing"], contentNumber)()) +
                                        destinationPath[destinationPath.length - 1]);
                                    try {
                                        await fileManager_1.DiskFileManager.removeFile(file);
                                    }
                                    catch (error) {
                                    }
                                }
                                content = this.changeUrlSetting(content, {
                                    mobile: true,
                                    newSrc: mobileRes,
                                    src: images[i].src || "",
                                    original: images[i].original
                                });
                            }
                        }
                        else {
                            let imageSuffix = domainImage["image-result-Suffixs"];
                            let res = await imageProccessing_1.default.resizeAndRename("temp/", images[i].original || images[i].src, {
                                mobile: false,
                                q: domainImage["compress-quality"],
                                suffixs: imageSuffix,
                                x: parseInt(images[i].width),
                                watermark: domainImage["watermark-config"]
                            });
                            for (let z = 0; z < res.length; z++) {
                                var destinationPath = res[z].split("/");
                                let file = res[z];
                                res[z] = await this.cdn.upload(res[z], (await getPathResolver("image", savePath.path, domainImage["image-addressing"], contentNumber)()) +
                                    destinationPath[destinationPath.length - 1]);
                                try {
                                    await fileManager_1.DiskFileManager.removeFile(file);
                                }
                                catch (error) {
                                }
                            }
                            content = this.changeUrlSetting(content, {
                                mobile: false,
                                newSrc: res,
                                src: images[i].src || "",
                                original: images[i].original
                            });
                            let mobileRes;
                            if (domainImage["make-phone-image"]) {
                                mobileRes = await imageProccessing_1.default.resizeAndRename("temp/", images[i].original || images[i].src, {
                                    mobile: true,
                                    q: domainImage["compress-quality"],
                                    suffixs: imageSuffix,
                                    x: Math.min(parseInt(images[i].width), domainImage['phone-width']),
                                    watermark: domainImage["watermark-config"]
                                });
                                for (let z = 0; z < mobileRes.length; z++) {
                                    var destinationPath = mobileRes[z].split("/");
                                    let file = mobileRes[z];
                                    mobileRes[z] = await this.cdn.upload(mobileRes[z], (await getPathResolver("image", savePath.path, domainImage["image-addressing"], contentNumber)()) +
                                        destinationPath[destinationPath.length - 1]);
                                    try {
                                        await fileManager_1.DiskFileManager.removeFile(file);
                                    }
                                    catch (error) {
                                    }
                                }
                                content = this.changeUrlSetting(content, {
                                    mobile: true,
                                    newSrc: mobileRes,
                                    src: images[i].src || "",
                                    original: images[i].original
                                });
                            }
                        }
                    }
                    catch (error) {
                        console.log(error);
                    }
                }
            }
            return content;
        }
        catch (error) {
            throw error;
        }
    }
    async changeMainImages(doc) {
        try {
            let lang = await this.langRepo.findById(doc.language);
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
            }, {}, [{
                    path: "watermark-config"
                }]);
            if (domainImage == null) {
                return;
            }
            let savePath = domainImage === null || domainImage === void 0 ? void 0 : domainImage["upload-path"];
            var conf = await this.cdnRepo.findById(savePath.fileManager);
            if (conf == null) {
                var conf = await this.cdnRepo.findOne({
                    isDefaultContent: true,
                });
            }
            if (doc === null || doc === void 0 ? void 0 : doc.resolutionConfig) {
                let config = await this.templateConfigRepo.findOne({
                    template: doc.template,
                    language: doc.language
                });
                if (config == null)
                    config = await this.templateConfigRepo.findOne({
                        template: doc.template
                    });
                if (config == null)
                    config = await this.templateConfigRepo.findOne({});
                let res = await imageProccessing_1.default.proccessFromConfig(config_1.default.getConfig("staticRoute"), doc.resolutionConfig.source, config === null || config === void 0 ? void 0 : config.imageConfig, doc.resolutionConfig.conf);
                var cdn = new fileManager_1.default();
                if (conf != null)
                    cdn.initFromConfig({
                        config: conf.config,
                        hostUrl: conf.hostUrl || "",
                        id: conf._id,
                        type: conf.type
                    });
                let c = [{
                        name: "main",
                        path: doc.resolutionConfig.source
                    }];
                c.push(...res);
                res = c;
                let temp_dir = "";
                if (domainImage["watermark-main"]) {
                    let temp_name = Date.now().toString();
                    await fileManager_1.DiskFileManager.mkdir("src/uploads/tmp/", temp_name);
                    temp_dir = `src/uploads/tmp/${temp_name}/`;
                    let wm = await this.watermarkConfigRepo.findById(domainImage["main-watermark-config"]);
                    if (wm != null) {
                        for (let i = 0; i < res.length; i++) {
                            res[i]["path"] = await imageProccessing_1.default.makeWatermarks(res[i]["path"], [...wm.configs], temp_dir);
                        }
                    }
                }
                for (let i = 0; i < res.length; i++) {
                    let name = path_1.default.basename(doc.resolutionConfig.source).split(".")[0];
                    const finalPath = getUploadDestination(domainImage["upload-path"].path, domainImage["image-addressing"], doc.contentNumber) + res[i].name + "_" + name + path_1.default.extname(res[i].path);
                    // res[i].path = await cdn.uploadMany(res[i].path, finalPath)
                    let r = await cdn.uploadMany([
                        {
                            path: res[i].path,
                            destination: finalPath
                        }
                    ], {
                        rename: true
                    });
                    res[i].path = r[0];
                }
                if (temp_dir != "") {
                    await fileManager_1.DiskFileManager.removeFolder(temp_dir);
                }
                await this.collection.updateOne({
                    _id: doc._id
                }, {
                    $set: {
                        imageConfig: res,
                        imageProccessed: true
                    },
                });
            }
        }
        catch (error) {
            console.log("error");
        }
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
                path: "watermark-config"
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
                        && imagesAfter[z].width != imagesBefore[j].width) {
                        exists = true;
                        if (imagesAfter[z].original != null) {
                            images.push({
                                original: imagesAfter[z].original,
                                src: imagesAfter[z].original,
                                width: imagesAfter[z].width
                            });
                        }
                        break;
                    }
                }
                if (exists == true) {
                    images.push({
                        src: imagesAfter[z].src,
                        width: imagesAfter[z].width
                    });
                }
                // if (newImage) {
                images.push({
                    src: imagesAfter[z].src,
                    width: imagesAfter[z].width
                });
                // }
            }
            contents[i].content = await this.proccessContentImages(contents[i].content || "", domainImage, savePath, images);
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
            console.log(error);
        }
    }
    changeUrlSetting(content, options) {
        var _a;
        // console.log(content, options)
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
}
exports.default = BasePageRepository;
