"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUploadDestination = getUploadDestination;
const model_1 = require("./model");
// import schaduler from "../../../services/queue"
const repository_1 = __importDefault(require("../../basePage/repository"));
const articleProccessing_1 = __importDefault(require("../../../services/articleProccessing"));
const repository_2 = __importDefault(require("../templateConfig/repository"));
const fileManager_1 = __importDefault(require("../../../services/fileManager"));
const repository_3 = __importDefault(require("../system/repository"));
const repository_4 = __importDefault(require("../fileManagerConfig/repository"));
const repository_5 = __importDefault(require("../category/repository"));
const repository_6 = __importDefault(require("../language/repository"));
const repository_7 = __importDefault(require("../videoQueue/repository"));
const repository_8 = __importDefault(require("../waterMarkConfig/repository"));
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
class ArticleRepository extends repository_1.default {
    constructor(options) {
        super(options);
        // this
        this.cdn = new fileManager_1.default();
        this.cdnRepo = new repository_4.default();
        this.templateConfigRepo = new repository_2.default();
        this.confRepo = new repository_3.default();
        this.watermarkConfig = new repository_8.default();
        this.joinedCollection = [{
                name: "category",
                repo: new repository_5.default()
            }, {
                name: "language",
                repo: new repository_6.default()
            },
            {
                name: "video",
                repo: new repository_7.default()
            },
            {
                name: "videos",
                repo: new repository_7.default()
            }
        ];
        // this.cacheService = new RedisCache("article")
        // this.addTestData()
        // this.getAll()
        // this.syncData()
        this.watermarkConfigRepo = new repository_8.default();
    }
    insert(document) {
        // document.type = "cost"
        // console.log("insert1" , document._id)
        return super.insert(document);
    }
    async addTestData() {
        for (let i = 20351; i < 100000; i++) {
            let data = {
                "isLandingPage": false,
                "type": "general",
                "suggestArticles": [],
                "contentType": "article",
                "title": "fffffffffffffff" + (i + 1),
                "mainImage": "http://shirazent.ir:9000/hassan/samplhdd.jpeg",
                "summary": "<p><a class=\"ck-link_selected\" href=\"/tag_ahtu7i\">fffffffffffffffffff</a></p>",
                "content": "<p>fffffffffffffffffffffffffffffffffffffff</p>",
                "files": [],
                "status": "",
                "istop": false,
                "needProccess": false,
                "language": "61079639ab97fc52395831bf",
                "category": "64d9e3bc48be97cc8d2b30e3",
                "categories": [
                    "64d9e3bc48be97cc8d2b30e3"
                ],
                "ancestors": [],
                "author": "60a209e04dd1fb466672b4da",
                "isPublished": true,
                "commentStatus": false,
                "noIndex": false,
                "isDraft": false,
                "fileUses": [],
                "commonQuestions": [],
                "view": 0,
                "viewMode": "public",
                "seo": {
                    "url": "fffd" + (i + 1),
                    "mainKeyWord": "ggggggggggggggggggg" + (i + 1),
                    "keyWords": ["ggggggggggggggggggg" + (i + 1)],
                    "seoAnkertexts": [],
                    "canoncialAddress": "",
                    "oldAddress": "",
                    "isStatic": false,
                    "seoTitle": "fffffffffffffffffff" + (i + 1),
                    "metaDescription": "fffffffffffffffffffff" + (i + 1),
                    "redirectList": [],
                    "articleType": "blog",
                    "questionOppened": "yes"
                },
                "social": [
                    {
                        "socialName": "facebook",
                        "title": "",
                        "description": "",
                        "image": ""
                    },
                    {
                        "socialName": "twitter",
                        "title": "",
                        "description": "",
                        "image": ""
                    }
                ],
                "questionOppened": "yes",
                "imageProccessed": false,
                "videoProccessed": false,
                "videos": [],
                "proccesses": [
                    {
                        "status": 1,
                        "problems": [],
                        "_id": "66863fc07716a3983e2e0d86",
                        "name": "content",
                        "persianName": "پردازش محتوا"
                    },
                    {
                        "status": 1,
                        "problems": [],
                        "_id": "66863fc07716a3983e2e0d87",
                        "name": "videos",
                        "persianName": "پردازش ویدیو"
                    },
                    {
                        "status": 1,
                        "problems": [],
                        "_id": "66863fc07716a3983e2e0d88",
                        "name": "images",
                        "persianName": "پردازش عکس‌ها"
                    }
                ],
                "insertDate": "2024-07-04T10:52:56.238+04:30",
                "Refrences": [],
            };
            await this.insert(data);
            // console.log("i" , i)
        }
    }
    async syncData() {
        let as = await this.findAll({
            seoContent: {
                $exists: false
            },
            isPublished: true
        });
        for (let i = 0; i < as.length; i++) {
            let c = await this.contentRepo.findOne({
                id: as[i]._id.toHexString(),
                // language : 
            });
            await this.updateOne({
                _id: as[i]._id
            }, {
                $set: {
                    seoContent: c === null || c === void 0 ? void 0 : c._id
                }
            });
        }
    }
    async paginate(query, limit, page, options) {
        try {
            let r = await super.paginate(query, limit, page, options);
            return r;
        }
        catch (error) {
            throw error;
        }
    }
    async publish(id) {
        try {
            const doc = await this.findById(id);
            const url = await super.publish(id);
            if ((doc === null || doc === void 0 ? void 0 : doc.type) == "video") {
                // do for video
            }
            return url;
        }
        catch (error) {
            throw error;
        }
    }
    async getPath(contentType) {
        try {
            let staticPath = await this.confRepo.getConfigValue(`${contentType}-folder`);
            let dynamicPathStyle = await this.confRepo.getConfigValue(`${contentType}-folder-dynamic-style`);
            return this.getUploadDestination(staticPath, dynamicPathStyle);
        }
        catch (error) {
            throw error;
        }
    }
    getUploadDestination(staticPath, dynamicPathStyle) {
        let secondPart = "";
        let today = new Date();
        switch (dynamicPathStyle) {
            case "y":
                secondPart = today.getFullYear().toString() + "/";
                break;
            case "y-m":
                secondPart = today.getFullYear().toString() + "/" + today.getMonth().toString() + "/";
                break;
            case "y-m-d":
                secondPart = today.getFullYear().toString() + "/" + today.getMonth().toString() + "/" + today.getDate().toString() + "/";
                break;
            default:
                break;
        }
        return staticPath + secondPart;
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
    async doFindFiles(doc) {
        var files = await super.doFindFiles(doc);
        doc.mainImage ? files.push(doc.mainImage) : true;
        if (doc.files)
            files.push(...doc === null || doc === void 0 ? void 0 : doc.files);
        if (doc.videos)
            files.push(...(doc.videos.map((elem) => {
                return elem.mainSrc;
            })));
        if (doc.imageConfig) {
            for (let i = 0; i < doc.imageConfig.length; i++) {
                files.push(doc.imageConfig[i].path);
            }
        }
        let content = doc.content;
        files.push(...articleProccessing_1.default.getContentFiles(content || ""));
        files.push(...articleProccessing_1.default.getContentFiles(doc.summary || ""));
        return files;
    }
}
exports.default = ArticleRepository;
