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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArticleController = exports.insertSchema = exports.pdfConfig = exports.csvConfig = exports.excelConfig = void 0;
const controller_1 = __importDefault(require("../controller"));
const model_1 = require("../repositories/article/model");
const repository_1 = __importDefault(require("../repositories/article/repository"));
const repository_2 = __importDefault(require("../repositories/category/repository"));
const repository_3 = __importStar(require("../repositories/content/repository"));
const repository_4 = __importDefault(require("../repositories/fileManagerConfig/repository"));
const repository_5 = __importDefault(require("../repositories/system/repository"));
const repository_6 = __importDefault(require("../repositories/seoTask/repository"));
const articleProccessing_1 = __importDefault(require("../../services/articleProccessing"));
const config_1 = __importDefault(require("../../services/config"));
const _ = __importStar(require("lodash"));
const parameters_1 = require("../../decorators/parameters");
const jsdom_1 = require("jsdom");
const zod_1 = require("zod");
const fileManager_1 = __importStar(require("../../services/fileManager"));
const path_1 = __importDefault(require("path"));
const videoProccessing_1 = __importDefault(require("../../services/videoProccessing"));
const imageProccessing_1 = __importDefault(require("../../services/imageProccessing"));
const method_1 = require("../../decorators/method");
const style_1 = require("../style");
const controller_2 = require("../basePage/controller");
const redis_cache_1 = __importDefault(require("../../redis-cache"));
const repository_7 = __importDefault(require("../repositories/templateConfig/repository"));
const repository_8 = __importDefault(require("../repositories/publishQueue/repository"));
const repository_9 = __importDefault(require("../repositories/language/repository"));
const repository_10 = __importDefault(require("../repositories/domain/repository"));
const repository_11 = __importDefault(require("../repositories/domainVideoConfig/repository"));
const repository_12 = __importDefault(require("../repositories/domainImageConfig/repository"));
const repository_13 = __importDefault(require("../repositories/languageComment/repository"));
// import { FileManager } from "./fileManager";
// import { Route } from "src/core/application";
// interface ArticelExtra extends Article {
//   mainKeyWord: string;
//   // content :Content
// }
exports.excelConfig = {
    title: {
        displayName: "Title",
        headerStyle: style_1.styles.headerOdd,
        cellStyle: style_1.styles.cellOdd,
        width: 120,
    },
    author: {
        displayName: "Author",
        headerStyle: style_1.styles.headerOdd,
        cellStyle: style_1.styles.cellOdd,
        width: 120,
    },
    category: {
        displayName: "Category",
        headerStyle: style_1.styles.headerEven,
        cellFormat: function (value, row) {
            return decodeURI(value);
        },
        cellStyle: style_1.styles.cellEven,
        width: 400,
    },
    type: {
        displayName: "Type",
        headerStyle: style_1.styles.headerOdd,
        cellStyle: style_1.styles.cellOdd,
        cellFormat: function (value, row) {
            return decodeURI(value);
        },
        width: 120,
    },
    comment: {
        displayName: "Comment",
        headerStyle: style_1.styles.headerEven,
        cellStyle: style_1.styles.cellEven,
        width: 120,
    },
    date: {
        displayName: "Date",
        headerStyle: style_1.styles.headerOdd,
        cellStyle: style_1.styles.cellOdd,
        width: 120,
    },
};
exports.csvConfig = {
    fields: ["title", "author", "category", "type", "comment", "date"],
    fieldNames: ["Title", "Author", "Category", "Type", "Comment", "Date"],
};
exports.pdfConfig = {
    path: "src/core/mongoose-controller/pdf.ejs",
    options: {
        height: "90.25in",
        width: "45.5in",
        header: {
            height: "20mm",
        },
        footer: {
            height: "20mm",
        },
        childProcessOptions: {
            env: {
                OPENSSL_CONF: "/dev/null",
            },
        },
    },
    titles: ["Title", "Author", "Category", "Type", "Comment", "Date"],
    dataMap: ["title", "author", "category", "type", "comment", "date"],
};
exports.insertSchema = zod_1.z.object({
    isLandingPage: zod_1.z.boolean().default(false),
    type: zod_1.z.enum([
        "general",
        "gallery",
        "video",
        "podcast",
        "category_faq",
        "increamental",
    ]),
    suggestArticles: zod_1.z.array(zod_1.z.object({
        status: zod_1.z.boolean(),
        content: controller_1.default.id
    })).default([]),
    contentType: zod_1.z.enum(["article", "page"]),
    language: controller_1.default.id.optional(),
    title: zod_1.z.string(),
    mainImage: zod_1.z.string().optional(),
    summary: zod_1.z.string(),
    content: zod_1.z.string().optional(),
    files: zod_1.z.array(zod_1.z.string()).default([]),
    fileUses: zod_1.z.array(zod_1.z.string()).default([]),
    viewMode: zod_1.z.enum(["public", "forUsers", "private"]),
    viewCategory: controller_1.default.id.optional(),
    category: controller_1.default.id.optional(),
    categories: zod_1.z.array(controller_1.default.id).default([]),
    isPublished: zod_1.z.boolean().default(false),
    istop: zod_1.z.boolean().default(false),
    topDate: zod_1.z.coerce.date().optional(),
    needProccess: zod_1.z.boolean().default(false),
    commentStatus: zod_1.z.boolean().default(false),
    commentImportant: zod_1.z.boolean().default(false),
    publishDate: zod_1.z.coerce.date().optional(),
    commonQuestions: zod_1.z.array(zod_1.z.object({
        question: zod_1.z.string(),
        answer: zod_1.z.string(),
        publishAt: zod_1.z.coerce.date().optional(),
        cycle: controller_1.default.id.optional(),
    })),
    noIndex: zod_1.z.boolean().default(false),
    seo: controller_2.seoSchema.optional(),
    social: zod_1.z
        .array(zod_1.z.object({
        socialName: zod_1.z.enum(["twitter", "facebook"]),
        title: zod_1.z.string(),
        description: zod_1.z.string(),
        image: zod_1.z.string(),
    }))
        .optional(),
    resolutionConfig: zod_1.z
        .object({
        source: zod_1.z.string().optional(),
        conf: controller_1.default.search.optional(),
    })
        .optional(),
    template: controller_1.default.id.optional(),
    videos: zod_1.z.array(controller_1.default.id).optional().default([]),
    video: controller_1.default.id.optional(),
    Refrences: zod_1.z.array(zod_1.z.object({
        title: zod_1.z.string(),
        url: zod_1.z.string().url()
    })).optional(),
    tags: zod_1.z.array(zod_1.z.string()),
    contentNumber: zod_1.z.coerce.number().int().positive().optional(),
    contentLanguages: zod_1.z.array(zod_1.z.object({
        content: controller_1.default.id,
        language: controller_1.default.id
    })).default([])
});
const confRepo = new repository_5.default();
const cdnRepo = new repository_4.default();
async function getContentCDN() {
    try {
        var conf = await cdnRepo.findOne({
            isDefaultContent: true
        });
        if (conf == null) {
            return config_1.default.getConfig("TEMP_FILEMANAGER");
        }
        return conf;
    }
    catch (error) {
        return config_1.default.getConfig("TEMP_FILEMANAGER");
    }
}
const categoryTranslate = {
    "مقاله": "general",
    "ویدیویی": "video",
    "گالری": "gallery",
    "پادکست": "podcast",
    "جامع": "increamental",
};
class ArticleController extends controller_2.BasePageController {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        // this.insertSchema = options.insertSchema
        this.subPart = "content";
        this.categoryRepo = new repository_2.default();
        this.contentRepo = new repository_3.default();
        this.confRepo = confRepo;
        this.cdnRepo = new repository_4.default();
        this.seoTaskRepo = new repository_6.default();
        this.types = {
            general: "عمومی",
            gallery: "گالری",
            video: "ویدیو",
            podcast: "پادکست",
            category_faq: "دسته بندی پرسش و پاسخ",
            increamental: "افزایشی",
        };
        this.cache = new redis_cache_1.default("file_managing");
        this.cdn = new fileManager_1.default();
        this.templateConfigRepo = new repository_7.default();
        this.publishQueueRepo = new repository_8.default();
        this.languageRepo = new repository_9.default();
        this.domainRepo = new repository_10.default();
        this.domainVideoRepo = new repository_11.default();
        this.domainImageRepo = new repository_12.default();
        this.languageCommentRepo = new repository_13.default();
    }
    translateCategory(lst) {
        let final = [];
        for (let i = 0; i < lst.length; i++) {
            // const element = array[i];
            let key = categoryTranslate[lst[i]];
            if (key) {
                final.push(key);
            }
        }
        return final;
    }
    async create(data, admin) {
        var _a, _b;
        try {
            var adminPermission = await this.getPermissionData(admin._id);
            if (adminPermission.isSuperAdmin != true) {
                var res = await this.validatePermission({
                    permissionData: adminPermission.permission.config,
                    dataCheck: [
                        {
                            compration: "eqaul",
                            key: "insert",
                            values: true,
                        },
                    ],
                });
                data = await this.transformData({
                    permissionData: adminPermission.permission.config,
                    data,
                    dataCheck: [
                        {
                            compration: "eqaul",
                            values: true,
                            key: "manageSeo",
                            targetKey: "seo",
                        },
                        {
                            compration: "eqaul",
                            values: true,
                            key: "questionManage",
                            targetKey: "commonQuestions",
                        },
                        {
                            compration: "eqaul",
                            values: true,
                            key: "socialManage",
                            targetKey: "social",
                        },
                    ],
                });
                // data[]
                if (adminPermission.permission.config['limitTypes']) {
                    let lst = this.translateCategory(adminPermission.permission.config['contentType'] || []);
                    if (!lst.includes(data.type)) {
                        return {
                            status: 401,
                            data: [],
                            message: "این نوع محتوا در دسترس نیست"
                        };
                    }
                }
                if (adminPermission.permission.config['limitLanguage']) {
                    let index = (_a = adminPermission.permission.config['manageLanguage']) === null || _a === void 0 ? void 0 : _a.findIndex((el) => {
                        return el._id == data.language;
                    });
                    if (!index || index == -1) {
                        return {
                            status: 401,
                            data: [],
                            message: "این زبان برای محتوا در دسترس نیست"
                        };
                    }
                }
                if (adminPermission.permission.config['limitCategory']) {
                    let index = (_b = adminPermission.permission.config['manageCategory']) === null || _b === void 0 ? void 0 : _b.findIndex((el) => {
                        return el._id == data.category;
                    });
                    if (!index || index == -1) {
                        return {
                            status: 401,
                            data: [],
                            message: "این دسته‌بندی برای محتوا در دسترس نیست"
                        };
                    }
                }
                data.author = admin._id;
                var content = data.content;
                // return super.create(data, admin)
            }
            var doc = await this.repository.insert(data);
        }
        catch (error) {
            throw error;
        }
        try {
            var videos = await articleProccessing_1.default.proccessVideo(new jsdom_1.JSDOM(data.content));
        }
        catch (error) {
            throw error;
        }
        if (videos.count > 0) {
            try {
                // var videosList: Video[] = await this.submitVideosList(videos.values);
                await this.repository.updateOne({
                    _id: doc._id,
                }, {
                    $set: {
                    // videos: videosList,
                    },
                });
            }
            catch (error) {
                throw error;
            }
            return {
                status: 200,
                data: doc,
            };
        }
        try {
            var ripository = new repository_1.default({
                model: model_1.ArticleModel,
                typeName: "article",
                selectData: {
                    type: 1,
                    title: 1,
                    mainImage: 1,
                    author: 1,
                    category: 1,
                    publishDate: 1,
                    insertDate: 1
                },
                sort: {
                    "publishDate": {
                        show: "زمان انتشار"
                    },
                    "insertDate": {
                        show: "زمان انتشار"
                    },
                    "view": {
                        show: "بازدید"
                    }
                }
            });
            await ripository.passVideoProccess(doc._id);
        }
        catch (error) {
            throw error;
        }
        return {
            status: 200,
            data: doc,
        };
    }
    async vlidateLanguage(language) {
        try {
            let lang = await this.languageRepo.findById(language);
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
            });
            let domainVideo = await this.domainVideoRepo.findOne({
                domain: domain === null || domain === void 0 ? void 0 : domain._id
            });
            var insertImage;
            if (domainImage == null) {
                insertImage = Object.assign(domain || {}, {
                    _id: domain === null || domain === void 0 ? void 0 : domain._id,
                    "upload-path": {
                        "fileManager": "",
                        "path": ""
                    },
                    "valid-Suffix": [],
                    "image-result-Suffixs": [],
                    "nonConvert-Suffixs": [],
                    "image-addressing": "",
                    "convert-main": false,
                    "compress-main": false,
                    "make-phone-image": true,
                    "phone-width": 300,
                    "compress-quality": 80,
                    "watermark-main": false,
                    "main-watermark-config": "",
                    "watermark": false,
                    "watermark-config": ""
                });
            }
            var insertVideo;
            if (domainVideo == null) {
                insertVideo = Object.assign(domain || {}, {
                    _id: domain === null || domain === void 0 ? void 0 : domain._id,
                    "upload-path": {
                        "fileManager": "",
                        "path": ""
                    },
                    "editor-upload-size": {
                        "unit": "GB",
                        "value": 1
                    },
                    "download-size": {
                        "unit": "GB",
                        "value": 1
                    },
                    "upload-size": {
                        "unit": "GB",
                        "value": 1
                    },
                    "save-path": {
                        "fileManager": "",
                        "path": ""
                    },
                    "quality-persent": 80,
                    "save-paths": [],
                    "save-main-source": false,
                    "video-result-Suffixs": [],
                    "valid-Suffix": [], "save-quality": [],
                    "auto-save-quality": false,
                    "watermark": false,
                    "watermark-config": ""
                });
            }
            return {
                status: 200,
                data: {
                    insertImage,
                    insertVideo
                }
            };
        }
        catch (error) {
            throw error;
        }
        // }
    }
    async validateCommentLanguage(language) {
        try {
            return {
                data: await this.languageCommentRepo.isExists({
                    language
                })
            };
        }
        catch (error) {
            throw error;
        }
    }
    // @Query({
    async edit(id, data, admin) {
        var _a, _b;
        var adminPermission = await this.getPermissionData(admin._id);
        if (adminPermission.isSuperAdmin != true) {
            var res = await this.validatePermission({
                permissionData: adminPermission.permission.config,
                dataCheck: [
                    {
                        compration: "eqaul",
                        key: "insert",
                        values: true,
                    },
                ],
            });
            if (res == false) {
                return {
                    status: 401,
                    data: [],
                    message: "دسترسی شما محدود می‌باشد"
                };
            }
            data = await this.transformData({
                permissionData: adminPermission.permission.config,
                data,
                dataCheck: [
                    {
                        compration: "eqaul",
                        values: true,
                        key: "manageSeo",
                        targetKey: "seo",
                    },
                    {
                        compration: "eqaul",
                        values: true,
                        key: "questionManage",
                        targetKey: "commonQuestions",
                    },
                    {
                        compration: "eqaul",
                        values: true,
                        key: "socialManage",
                        targetKey: "social",
                    },
                ],
            });
            // data[]
            if (adminPermission.permission.config['limitTypes'] && data.type) {
                let lst = this.translateCategory(adminPermission.permission.config['contentType'] || []);
                if (!lst.includes(data.type)) {
                    return {
                        status: 401,
                        data: [],
                        message: "این نوع محتوا در دسترس نیست"
                    };
                }
            }
            if (adminPermission.permission.config['limitLanguage'] && data.language) {
                let index = (_a = adminPermission.permission.config['manageLanguage']) === null || _a === void 0 ? void 0 : _a.findIndex((el) => {
                    return el._id == data.language;
                });
                if (!index || index == -1) {
                    return {
                        status: 401,
                        data: [],
                        message: "این زبان برای محتوا در دسترس نیست"
                    };
                }
            }
            if (adminPermission.permission.config['limitCategory'] && data.category) {
                let index = (_b = adminPermission.permission.config['manageCategory']) === null || _b === void 0 ? void 0 : _b.findIndex((el) => {
                    return el._id == data.category;
                });
                if (!index || index == -1) {
                    return {
                        status: 401,
                        data: [],
                        message: "این دسته‌بندی برای محتوا در دسترس نیست"
                    };
                }
            }
            data.author = admin._id;
            var content = data.content;
            // return super.create(data, admin)
        }
        return this.editById(id, {
            $set: data,
        });
    }
    // async submitVideosList(videos: []): Promise<Video[]> {
    //   var videoSrcs = videos.map((elem: { src: any }) => {
    //     return elem.src;
    //   });
    //   return new Promise(
    //     (
    //       resolve: (arg0: Video[]) => void | PromiseLike<void>,
    //       reject: (arg0: any) => void | PromiseLike<void>
    //     ) => {
    //       request.post(
    //         ConfigService.getConfig("videoServer") + "/videos/toQueue",
    //         {
    //           headers: {
    //             "Content-Type": "application/json",
    //           },
    //           body: JSON.stringify({
    //             srcList: videoSrcs,
    //           }),
    //         },
    //         async function (error, response) {
    //           if (error) {
    //             //error
    //             // throw error
    //             return reject(error);
    //           }
    //           var viedoList: Video[] = [];
    //           var data = JSON.parse(response.body).data;
    //           try {
    //             for (let i = 0; i < data.length; i++) {
    //               viedoList.push({
    //                 mainSrc: data[i].src as string,
    //                 _id: data[i]._id,
    //                 isProccessed: false,
    //                 result: [],
    //               } as unknown as Video);
    //             }
    //             return resolve(viedoList);
    //           } catch (error) {
    //             return reject(error);
    //           }
    //         }
    //       );
    //     }
    //   );
    // }
    async download(link) {
        try {
            link = decodeURI(link);
            var pp = (await fileManager_1.DiskFileManager.downloadFile(link));
            var conf = await this.cdnRepo.findOne({
                isDefaultContent: true,
            });
            if (conf == null)
                return {
                    status: 200,
                    data: { address: pp },
                };
            var cdn = new fileManager_1.default();
            cdn.initFromConfig({
                config: conf.config,
                hostUrl: conf.hostUrl || "",
                id: conf._id,
                type: conf.type,
            });
            var link = link;
            if (link.includes("?"))
                link = link.split("?")[0];
            var dest = "content/" + path_1.default.basename(link);
            var url = await cdn.upload(pp, dest);
            return {
                status: 200,
                data: url,
            };
        }
        catch (error) {
            throw error;
        }
    }
    async directDownload(link, contentType) {
        try {
            const directory = await ArticleController.getPathResolver(contentType)();
            var conf = await this.cdnRepo.findOne({
                isDefaultContent: true,
                // _id : "647db66e8d8c7c65dce35e18"
            });
            if (conf == null)
                return {
                    status: 500,
                    data: {},
                };
            var cdn = new fileManager_1.default();
            cdn.initFromConfig({
                config: conf.config,
                hostUrl: conf.hostUrl || "",
                id: conf._id,
                type: conf.type,
            });
            return {
                status: 200,
                data: {
                    link: await cdn.drirectDownload([decodeURI(link)], directory),
                    directory
                }
            };
        }
        catch (error) {
            throw error;
        }
    }
    async videoScreenshot(link, time) {
        try {
            var file = await videoProccessing_1.default.screenshot(link, [time]);
            var conf = await this.cdnRepo.findOne({
                isDefaultContent: true,
            });
            if (conf == null)
                return {
                    status: 200,
                    data: { address: file },
                };
            var cdn = new fileManager_1.default();
            cdn.initFromConfig({
                config: conf.config,
                hostUrl: conf.hostUrl || "",
                id: conf._id,
                type: conf.type,
            });
            var dest = (await ArticleController.getPathResolver("image")()) + path_1.default.basename(file);
            var url = await cdn.upload(config_1.default.getConfig("staticRoute") + "tmp/" + file, dest);
            try {
                await fileManager_1.DiskFileManager.removeFile(config_1.default.getConfig("staticRoute") + "tmp/" + file);
            }
            catch (error) {
            }
            return {
                status: 200,
                data: url,
            };
        }
        catch (error) {
            throw error;
        }
        //
    }
    async addPublishQueue(data, admin, id, isRequest = false) {
        try {
            const res = await this.addDraft(data, admin, id);
            data['author'] = admin._id;
            let categories = res.data.categories;
            categories.push(res.data.category);
            await this.publishQueueRepo.insert({
                language: res.data.language,
                categories,
                type: "content",
                draft: res.data._id,
                author: admin._id,
                isRequest
            });
            return res;
        }
        catch (error) {
            throw error;
        }
    }
    static getPathResolver(contentType, path = "content/", style, contentNumber) {
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
                return this.getUploadDestination(staticPath, style || dynamicPathStyle, contentNumber);
            }
            catch (error) {
                throw error;
            }
        };
    }
    async uploadVideo(video, files, language) {
        try {
            let lang = await this.languageRepo.findById(language);
            if (lang === null || lang === void 0 ? void 0 : lang.domain) {
                var domain = await this.domainRepo.findById(lang.domain);
            }
            else {
                var domain = await this.domainRepo.findOne({
                    isDefault: true
                });
            }
            let domainVideo = await this.domainVideoRepo.findOne({
                domain: domain === null || domain === void 0 ? void 0 : domain._id
            });
            if (domainVideo == null) {
                return {
                    status: 400,
                    data: {
                        setDomain: true
                    }
                };
            }
            let savePath = domainVideo === null || domainVideo === void 0 ? void 0 : domainVideo["upload-path"];
            var conf = await this.cdnRepo.findById(savePath.fileManager);
            if (conf == null) {
                var conf = await this.cdnRepo.findOne({
                    isDefaultContent: true,
                    // _id :  (await confRepo.getConfigValue("save-path"))?.fileManager
                });
            }
            if (conf == null)
                return {
                    status: 400,
                    // data: { "address": pp }
                };
            this.cdn.initFromConfig({
                config: conf.config,
                hostUrl: conf.hostUrl || "",
                id: conf._id,
                type: conf.type,
            });
            var destinationPath = files[0].path.split("/");
            return {
                status: 200,
                data: await this.cdn.uploadWithState(files[0].path, (await ArticleController.getPathResolver("video")()) +
                    destinationPath[destinationPath.length - 1]),
            };
        }
        catch (error) {
            throw error;
        }
    }
    async findById(id, queryInfo) {
        return super.findById(id, {
            fromDb: true
        });
    }
    async uploadSmallVideo(video, files) {
        try {
            return {
                status: 200,
                data: video
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getUploadType(language) {
        try {
            let lang = await this.languageRepo.findById(language);
            // if(lang != null){
            if (lang === null || lang === void 0 ? void 0 : lang.domain) {
                var domain = await this.domainRepo.findById(lang.domain);
            }
            else {
                var domain = await this.domainRepo.findOne({
                    isDefault: true
                });
            }
            // }
            let domainVideo = await this.domainVideoRepo.findOne({
                domain: domain === null || domain === void 0 ? void 0 : domain._id
            });
            if (domainVideo == null) {
                return {
                    status: 400,
                    data: {
                        setDomain: true
                    }
                };
            }
            let savePath = domainVideo === null || domainVideo === void 0 ? void 0 : domainVideo["upload-path"];
            var conf = await this.cdnRepo.findById(savePath.fileManager);
            if (conf == null) {
                var conf = await this.cdnRepo.findOne({
                    isDefaultContent: true
                });
            }
            if (conf == null)
                return {
                    status: 400
                };
            return {
                data: Object.assign(domainVideo, { type: conf.type })
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getImageUploadType(language) {
        try {
            let lang = await this.languageRepo.findById(language);
            // if(lang != null){
            if (lang === null || lang === void 0 ? void 0 : lang.domain) {
                var domain = await this.domainRepo.findById(lang.domain);
            }
            else {
                var domain = await this.domainRepo.findOne({
                    isDefault: true
                });
            }
            // }
            let domainImage = await this.domainImageRepo.findOne({
                domain: domain === null || domain === void 0 ? void 0 : domain._id
            });
            if (domainImage == null) {
                return {
                    status: 400,
                    data: {
                        setDomain: true
                    }
                };
            }
            return {
                data: domainImage["valid-Suffix"]
            };
        }
        catch (error) {
            throw error;
        }
    }
    async chunkedUpload(chunked, files) {
        try {
            let lang = await this.languageRepo.findById(chunked.language);
            if (lang === null || lang === void 0 ? void 0 : lang.domain) {
                var domain = await this.domainRepo.findById(lang.domain);
            }
            else {
                var domain = await this.domainRepo.findOne({
                    isDefault: true
                });
            }
            let domainVideo = await this.domainVideoRepo.findOne({
                domain: domain === null || domain === void 0 ? void 0 : domain._id
            });
            if (domainVideo == null) {
                return {
                    status: 400,
                    data: {
                        setDomain: true
                    }
                };
            }
            let savePath = domainVideo === null || domainVideo === void 0 ? void 0 : domainVideo["upload-path"];
            var conf = await this.cdnRepo.findById(savePath.fileManager);
            if (conf == null) {
                var conf = await this.cdnRepo.findOne({
                    isDefaultContent: true,
                    // _id :  (await confRepo.getConfigValue("save-path"))?.fileManager
                });
            }
            if (conf == null)
                return {
                    status: 400,
                    // data: { "address": pp }
                };
            this.cdn.initFromConfig({
                config: conf.config,
                hostUrl: conf.hostUrl || "",
                id: conf._id,
                type: conf.type,
            });
            // this.get
            return {
                status: 200,
                data: await this.cdn.append(files[0].path, (await ArticleController.getPathResolver("video", savePath.path)()) +
                    chunked.fileName, {
                    rename: false,
                    isFirst: chunked.chunkNumber == 1,
                    isfinished: chunked.isfinished
                }),
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getUploadStatus(key) {
        try {
            return {
                status: 200,
                data: JSON.parse(await this.cache.get(key)),
            };
        }
        catch (error) {
            throw error;
        }
    }
    // @Get("/category/validation-config")
    // async 
    async uploadDocumnet(document, files) {
        return {
            status: 200,
            data: document
        };
    }
    async deleteFile(file) {
        try {
            await this.cdn.findCdnFromUrl(file);
            await this.cdn.removeFiles([file]);
            return {
                status: 200,
                data: {
                    ok: true
                }
            };
        }
        catch (error) {
            throw error;
        }
    }
    async uploadSound(voice, files) {
        return {
            status: 200,
            data: voice
        };
    }
    async saveBase64(image, cdnId) {
        try {
            if (cdnId != undefined) {
                var conf = await this.cdnRepo.findOne({
                    _id: cdnId
                });
            }
            else {
                var conf = await this.cdnRepo.findOne({
                    isDefaultContent: true,
                });
            }
            if (conf == null)
                // return new ApiResponse.SuccessResponse("succsess", { "address": pp }).send(res)
                return {
                    status: 400,
                    message: "خطا",
                };
            var cdn = new fileManager_1.default();
            cdn.initFromConfig({
                config: conf.config,
                hostUrl: conf.hostUrl || "",
                id: conf._id,
                type: conf.type,
            });
            var image = await fileManager_1.DiskFileManager.saveBase64(image);
            var dest = "content/screenshot/" + path_1.default.basename(image);
            return {
                status: 200,
                data: await cdn.upload(image, dest),
            };
        }
        catch (error) {
            throw error;
        }
    }
    async addContentSeo(data) {
        try {
            var catId = "";
            if (data.type == "article") {
                var article = await this.repository.findById(data.id);
                if (article == null)
                    return {
                        status: 404,
                        message: "موردی یافت نشد",
                    };
                // data.url = await this.getUrl(req.body.url, req.body.type, article.category as string, article.language as string)
                if (typeof article.category == "string")
                    catId = article.category;
                else {
                    catId = article.category._id;
                }
            }
            else if (data.type == "category") {
                // var cat = await this.categoryRepo.findById(data.id)
                // if (cat == null)
                //     return new ApiResponse.NotFoundResponse("یافت نشد").send(res)
                // var category = cat.parentCategory
                // data.url = await this.getUrl(data.url, data.type, cat.parentCategory as string, data.language as string)
            }
            var doc = await this.contentRepo.insert(data, {
                type: data.type,
                category: catId,
                language: data.language,
            });
            return {
                status: 200,
                data: doc,
                message: " عملیات موفق",
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getUrl(url, type, catId, language) {
        try {
            var siteUrlStyle = await this.confRepo.getConf("content-url-style");
            var categoryUrlStyle = await this.confRepo.getConf("category-url-style");
            var content = siteUrlStyle === null || siteUrlStyle === void 0 ? void 0 : siteUrlStyle.value;
            var category = categoryUrlStyle === null || categoryUrlStyle === void 0 ? void 0 : categoryUrlStyle.value;
            if (type == "content") {
                return await repository_3.contentUrlBuilder[content](url, catId, language);
            }
            else if (type == "category") {
                return await repository_3.categoryUrlBuilder[category](url, catId, language);
            }
            else {
                return "/";
            }
        }
        catch (error) {
            throw error;
        }
    }
    async searchLanguage(q, admin, ids) {
        try {
            let data = await this.getPermissionData(admin._id);
            let isSuperAdmin = false;
            let langIds = [];
            if (data.isSuperAdmin) {
                isSuperAdmin = true;
            }
            else {
                try {
                    let manageLanguage = data.permission.config.manageLanguage.value;
                    for (let i = 0; i < manageLanguage.length; i++) {
                        langIds.push(manageLanguage[i]._id);
                    }
                }
                catch (error) {
                }
            }
            let langs = await this.languageRepo.findMany({
                title: {
                    $regex: new RegExp(q)
                },
            }, {}, 1, 10);
            for (let i = 0; i < langs.length; i++) {
                langs[i] = Object.assign({
                    "canUse": true
                }, langs[i]._doc);
                langs[i]["canUse"] = isSuperAdmin || langIds.includes(langs[i]._id.toHexString());
            }
            return {
                status: 200,
                data: langs
            };
        }
        catch (error) {
            throw error;
        }
    }
    async validateCategory(categories, language) {
        try {
            var checkExistsList = await this.doValidateCategory(categories, language);
            return {
                status: 200,
                data: checkExistsList,
            };
        }
        catch (error) {
            throw error;
        }
    }
    async doValidateCategory(categories, language) {
        try {
            var notExistsList = [];
            for (let i = 0; i < categories.length; i++) {
                var isExists = await this.contentRepo.isExists({
                    type: "category",
                    id: categories[i],
                    language,
                    categoryLable: "content"
                });
                if (!isExists)
                    notExistsList.push(categories[i]);
            }
            return notExistsList;
        }
        catch (error) {
            throw error;
        }
    }
    static getUploadDestination(staticPath, dynamicPathStyle, contentNumber) {
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
    async proccessImage(files, language, contentNumber, type) {
        var path = files[0].path;
        if (path == undefined) {
            return {
                status: 400,
                message: "فایل ضمیمه نشده است",
            };
        }
        let lang = await this.languageRepo.findById(language);
        if (lang === null || lang === void 0 ? void 0 : lang.domain) {
            var domain = await this.domainRepo.findById(lang.domain);
        }
        else {
            var domain = await this.domainRepo.findOne({
                isDefault: true
            });
        }
        let domainImage = null;
        if (type != undefined) {
            domainImage = await this.domainImageRepo.findOne({
                domain: domain === null || domain === void 0 ? void 0 : domain._id,
                type
            });
        }
        if (domainImage == null)
            domainImage = await this.domainImageRepo.findOne({
                domain: domain === null || domain === void 0 ? void 0 : domain._id
            });
        if (domainImage == null) {
            return {
                status: 400,
                data: {
                    setDomain: true
                }
            };
        }
        let savePath = domainImage === null || domainImage === void 0 ? void 0 : domainImage["upload-path"];
        var conf = await this.cdnRepo.findById(savePath.fileManager);
        if (conf == null) {
            var conf = await this.cdnRepo.findOne({
                isDefaultContent: true
            });
        }
        if (conf == null)
            return {
                status: 400,
                // data: { "address": pp }
            };
        this.cdn.initFromConfig({
            config: conf.config,
            hostUrl: conf.hostUrl || "",
            id: conf._id,
            type: conf.type,
        });
        // this.cdn.upload()
        var destinationPath = files[0].path.split("/");
        // console.log("image", savePath.path, domainImage["image-addressing"], contentNumber)
        try {
            return {
                status: 200,
                data: await this.cdn.upload(files[0].path, (await ArticleController.getPathResolver("image", savePath.path, domainImage["image-addressing"], contentNumber)()) +
                    destinationPath[destinationPath.length - 1]),
            };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async uploadImageWithLable(lable, files) {
        var path = files[0].path;
        if (path == undefined) {
            return {
                status: 400,
                message: "فایل ضمیمه نشده است",
            };
        }
        try {
            var result = await imageProccessing_1.default.proccess(config_1.default.getConfig("staticRoute"), path, lable);
        }
        catch (error) {
            throw error;
        }
        var finalPaths = [];
        var pathToRemove = [];
        for (let i = 0; i < result.length; i++) {
            var p = result[i].path.split("/");
            pathToRemove.push(result[i].path);
            finalPaths.push({
                path: result[i].path,
                destination: p[p.length - 1],
            });
        }
        var cdn = new fileManager_1.default("62259a7787a42e7b8476beb8");
        try {
            var paths = await cdn.uploadMany(finalPaths, {
                rename: false
            });
        }
        catch (error) {
            throw error;
        }
        return {
            status: 200,
            data: paths[0],
        };
    }
    async getMinimumResolution(template, language) {
        try {
            let config = await this.templateConfigRepo.findOne({
                template,
                language,
            });
            if (config == null)
                config = await this.templateConfigRepo.findOne({
                    template,
                });
            if (config == null) {
                return {
                    status: 400,
                    data: {
                        setConfig: true,
                    },
                };
            }
            for (let i = 0; i < (config === null || config === void 0 ? void 0 : config.imageConfig.length); i++) {
                if ((config === null || config === void 0 ? void 0 : config.imageConfig[i].name) == "main") {
                    return {
                        status: 200,
                        data: config === null || config === void 0 ? void 0 : config.imageConfig[i].resolotion,
                    };
                }
            }
            return {
                status: 404,
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getAllResolution(template, language) {
        try {
            let config = await this.templateConfigRepo.findOne({
                template,
                language,
            });
            if (config == null)
                config = await this.templateConfigRepo.findOne({
                    template,
                });
            if (config == null) {
                return {
                    status: 400,
                    data: {
                        setConfig: true,
                    },
                };
            }
            return {
                status: 200,
                data: config.imageConfig,
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getContentNumber() {
        try {
            let contentNumber = await this.confRepo.getConfigValue("content-number");
            if (contentNumber == undefined) {
                contentNumber = 100;
                await this.confRepo.insert({
                    key: "content-number",
                    lable: "server-config",
                    value: contentNumber,
                    type: "Number"
                });
            }
            await this.confRepo.updateOne({
                key: "content-number"
            }, {
                $set: {
                    value: contentNumber + 1
                }
            });
            return {
                status: 200,
                data: contentNumber
            };
        }
        catch (error) {
            throw error;
        }
    }
    async dataTransform(dataList) {
        dataList = JSON.parse(JSON.stringify(dataList));
        return dataList.map((elem, i) => {
            var _a, _b, _c;
            try {
                elem.author = `${(_a = elem.author) === null || _a === void 0 ? void 0 : _a.name} ${(_b = elem.author) === null || _b === void 0 ? void 0 : _b.family}`;
                elem.category = (_c = elem.category) === null || _c === void 0 ? void 0 : _c.title;
                elem.date = elem.insertDate.toLocaleString("fa-IR");
                elem.type = this.types[elem.type];
                elem.comment = 10;
            }
            catch (error) {
                console.log(error);
            }
            return elem;
        });
    }
    getSearchList() {
        return {
            status: 200,
            data: this.searchFilters,
        };
    }
    translatedataTableConfig() {
    }
    async getPaginationConfig(admin, session) {
        var _a;
        let config = _.cloneDeep(this.paginationConfig);
        var adminPermission = await this.getPermissionData(admin._id);
        if (config != undefined)
            config.fields = await this.adminRepo.translateLanguage(config === null || config === void 0 ? void 0 : config.fields, (_a = this.paginationConfig) === null || _a === void 0 ? void 0 : _a.tableLabel, session.language);
        if (adminPermission.isSuperAdmin == true) {
            return {
                status: 200,
                data: config,
            };
        }
        var permission = adminPermission.permission.config;
        if (permission.exportPDF != true) {
            config === null || config === void 0 ? true : delete config.exportpdfUrl;
        }
        if (permission.exportExcel != true) {
            config === null || config === void 0 ? true : delete config.exportexelUrl;
        }
        if (permission.exportCSV != true) {
            config === null || config === void 0 ? true : delete config.exportcsvUrl;
        }
        if (permission.datatableManage != true) {
            if (config) {
                config.canCustomizeTable = false;
            }
        }
        return {
            status: 200,
            data: config,
        };
    }
    search(page, limit, reqQuery, admin, session) {
        // console.log("searchg")
        if (session.language != undefined)
            reqQuery["language$eq"] = session.language;
        return super.search(page, limit, reqQuery, admin);
    }
    initApis() {
        // this.addRoute("")
        super.initApis();
        // this.addAbsoluteRoute("/draft", "post", this.addDraft.bind(this), {
        //     meta: {
        //         "0": {
        //             index: 0,
        //             source: "body",
        //             schema: z.any()
        //         },
        //         "1": {
        //           index : 1,
        //           source: "admin",
        //         //   schema: z.any()
        //         }
        //     }
        // })
        // this.addRoute("/publish", "post", this.publish.bind(this), {
        //     meta: {
        //         "0": {
        //             index: 0,
        //             source: "body",
        //             schema: this.insertSchema?.optional()
        //         }
        //     }
        // })
        this.addRouteWithMeta("s/search", "get", this.search.bind(this), controller_1.default.searcheMeta);
        this.addRoute("s/search/list", "get", this.getSearchList.bind(this));
        this.addRoute("s/exel", "get", this.exportExcel.bind(this));
        this.addRoute("s/csv", "get", this.exportCSV.bind(this));
        this.addRoute("s/pdf", "get", this.exportPDF.bind(this));
        this.addRouteWithMeta("", "get", this.findById.bind(this), controller_1.default.findByIdMeta);
    }
}
exports.ArticleController = ArticleController;
__decorate([
    __param(1, (0, parameters_1.Admin)())
], ArticleController.prototype, "create", null);
__decorate([
    (0, method_1.Get)("/language/validate"),
    __param(0, (0, parameters_1.Query)({
        destination: "language",
        schema: controller_1.default.id
    }))
], ArticleController.prototype, "vlidateLanguage", null);
__decorate([
    (0, method_1.Get)("/language/comment/validate"),
    __param(0, (0, parameters_1.Query)({
        destination: "language",
        schema: controller_1.default.id
    }))
], ArticleController.prototype, "validateCommentLanguage", null);
__decorate([
    (0, method_1.Put)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id,
    })),
    __param(1, (0, parameters_1.Body)({
        schema: zod_1.z.record(zod_1.z.string(), zod_1.z.any()),
    })),
    __param(2, (0, parameters_1.Admin)())
], ArticleController.prototype, "edit", null);
__decorate([
    (0, method_1.Post)("/api/admin/content/download", {
        absolute: true,
    }),
    __param(0, (0, parameters_1.Body)({
        destination: "link",
        schema: zod_1.z.string().url(),
    }))
], ArticleController.prototype, "download", null);
__decorate([
    (0, method_1.Post)("/api/admin/content/download/direct", {
        absolute: true
    }),
    __param(0, (0, parameters_1.Body)({
        destination: "link",
        schema: zod_1.z.string().url(),
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "contentType",
        schema: zod_1.z.enum(["video", "image", "document", "sound"])
    }))
], ArticleController.prototype, "directDownload", null);
__decorate([
    (0, method_1.Post)("/api/admin/content/video/screenshot", {
        absolute: true,
    }),
    __param(0, (0, parameters_1.Query)({
        destination: "link",
        schema: zod_1.z.string().url(),
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "time",
        schema: zod_1.z.string(),
    }))
], ArticleController.prototype, "videoScreenshot", null);
__decorate([
    (0, method_1.Post)("/draft/publish-queue"),
    __param(0, (0, parameters_1.Body)({
        schema: exports.insertSchema
    })),
    __param(1, (0, parameters_1.Admin)()),
    __param(2, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id.optional()
    })),
    __param(3, (0, parameters_1.Query)({
        destination: "isRequest",
        schema: zod_1.z.enum(["false", "true"]).optional()
    }))
], ArticleController.prototype, "addPublishQueue", null);
__decorate([
    (0, method_1.Post)("/api/admin/content/video", {
        absolute: true,
        contentType: "multipart/form-data"
    }),
    __param(0, (0, parameters_1.Body)({
        destination: "video"
    })),
    __param(1, (0, parameters_1.Files)({
        destination: "video",
        schema: zod_1.z.any().optional(),
        config: {
            maxCount: 1,
            name: "video"
        },
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "language",
        schema: controller_1.default.id.optional()
    }))
], ArticleController.prototype, "uploadVideo", null);
__decorate([
    (0, method_1.Post)("/api/admin/content/video/small", {
        absolute: true,
        contentType: "multipart/form-data"
    }),
    __param(0, (0, parameters_1.Body)({
        destination: "video"
    })),
    __param(1, (0, parameters_1.Files)({
        destination: "video",
        schema: zod_1.z.any().optional(),
        config: {
            maxCount: 1,
            name: "video"
        },
        moveFilesToCDN: {
            name: "video",
            config: {
                path: ArticleController.getPathResolver("video"),
                customServer: async function () {
                    try {
                        var cdnRepo = new repository_4.default();
                        var conf = await cdnRepo.findOne({
                            isDefaultContent: true
                        });
                        if (conf == null) {
                            return config_1.default.getConfig("TEMP_FILEMANAGER");
                        }
                        return conf;
                    }
                    catch (error) {
                        return config_1.default.getConfig("TEMP_FILEMANAGER");
                    }
                }
            }
        }
    }))
], ArticleController.prototype, "uploadSmallVideo", null);
__decorate([
    (0, method_1.Get)("/content/video/type"),
    __param(0, (0, parameters_1.Query)({
        destination: "language",
        schema: controller_1.default.id.optional()
    }))
], ArticleController.prototype, "getUploadType", null);
__decorate([
    (0, method_1.Get)("/content/image/type"),
    __param(0, (0, parameters_1.Query)({
        destination: "language",
        schema: controller_1.default.id.optional()
    }))
], ArticleController.prototype, "getImageUploadType", null);
__decorate([
    (0, method_1.Post)("/api/admin/content/video/chunked", {
        absolute: true,
        contentType: "multipart/form-data",
    }),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            chunk: zod_1.z.string().optional(),
            fileName: zod_1.z.string(),
            chunkNumber: controller_1.default.page,
            isfinished: controller_1.default.booleanFromquery.optional(),
            language: controller_1.default.id
        }),
    })),
    __param(1, (0, parameters_1.Files)({
        destination: "chunk",
        schema: zod_1.z.any().optional(),
        config: {
            maxCount: 1,
            name: "chunk",
        },
        mapToBody: true,
    }))
], ArticleController.prototype, "chunkedUpload", null);
__decorate([
    (0, method_1.Get)("/upload/status"),
    __param(0, (0, parameters_1.Query)({
        destination: "key",
        schema: zod_1.z.string(),
    }))
], ArticleController.prototype, "getUploadStatus", null);
__decorate([
    (0, method_1.Post)("/api/admin/content/document", {
        absolute: true,
        contentType: "multipart/form-data",
    }),
    __param(0, (0, parameters_1.Body)({ destination: "document" })),
    __param(1, (0, parameters_1.Files)({
        destination: "document",
        isArray: true,
        schema: zod_1.z.any().optional(),
        moveFilesToCDN: {
            name: "document",
            config: {
                customServer: getContentCDN,
                path: ArticleController.getPathResolver("document")
            },
        },
        isOptional: true,
        // skip: true,
        config: {
            maxCount: 1,
            name: "document",
            types: [
                "srt", // SubRip Subtitle
                "sub", // SubViewer
                "ssa", // SubStation Alpha
                "ass", // SubStation Alpha
                "vtt", // WebVTT
                "txt", // MicroDVD
                "mpl", // MPL2
                "stl", // DVD Studio Pro
                "dfxp" // DFXP
            ]
        }
    }))
], ArticleController.prototype, "uploadDocumnet", null);
__decorate([
    (0, method_1.Post)("/api/admin/content/delete", {
        absolute: true
    }),
    __param(0, (0, parameters_1.Body)({
        destination: "file",
        schema: zod_1.z.string().url()
    }))
], ArticleController.prototype, "deleteFile", null);
__decorate([
    (0, method_1.Post)("/api/admin/content/sound", {
        absolute: true,
        contentType: "multipart/form-data"
    }),
    __param(0, (0, parameters_1.Body)({ destination: "voice" })),
    __param(1, (0, parameters_1.Files)({
        destination: "voice",
        isArray: true,
        schema: zod_1.z.any().optional(),
        moveFilesToCDN: {
            name: "voice",
            config: {
                customServer: getContentCDN,
                path: ArticleController.getPathResolver("sound")
            },
        },
        isOptional: true,
        // skip: true,
        config: {
            maxCount: 1,
            name: "voice",
            types: [
                "mp3", // MP3
                "wav", // WAV
                "aiff", // AIFF
                "flac", // FLAC
                "aac", // AAC
                "ogg", // OGG
                "m4a", // M4A
                "wma", // WMA
                "opus" // Opus
            ]
        }
    }))
], ArticleController.prototype, "uploadSound", null);
__decorate([
    (0, method_1.Post)("/api/admin/content/base64/save", {
        absolute: true,
    }),
    __param(0, (0, parameters_1.Body)({
        destination: "image",
        schema: zod_1.z.string(),
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "cdn",
        schema: controller_1.default.id.optional()
    }))
], ArticleController.prototype, "saveBase64", null);
__decorate([
    (0, method_1.Post)("/seo"),
    __param(0, (0, parameters_1.Body)({
        schema: controller_2.seoSchema,
    }))
], ArticleController.prototype, "addContentSeo", null);
__decorate([
    (0, method_1.Get)("/language/search"),
    __param(0, (0, parameters_1.Query)({
        destination: "q",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Admin)()),
    __param(2, (0, parameters_1.Query)({
        destination: "id$nin",
        schema: zod_1.z.array(controller_1.default.id).optional()
    }))
], ArticleController.prototype, "searchLanguage", null);
__decorate([
    (0, method_1.Post)("/validate"),
    __param(0, (0, parameters_1.Body)({
        destination: "categories",
        schema: zod_1.z.array(controller_1.default.id),
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "language",
        schema: controller_1.default.id.optional(),
    }))
], ArticleController.prototype, "validateCategory", null);
__decorate([
    (0, method_1.Post)("/api/admin/content/image", {
        contentType: "multipart/form-data",
        absolute: true,
    }),
    __param(0, (0, parameters_1.Files)({
        destination: "upload",
        schema: zod_1.z.any().optional(),
        config: {
            maxCount: 1,
            name: "upload",
            types: ["jpg", "jpeg", "webp", "png", ""],
        },
        mapToBody: true,
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "language",
        schema: controller_1.default.id
            .default("61079639ab97fc52395831bf")
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "contentNumber",
        schema: zod_1.z.coerce.number().optional()
    })),
    __param(3, (0, parameters_1.Body)({
        destination: "type",
        schema: zod_1.z.string().optional()
    }))
], ArticleController.prototype, "proccessImage", null);
__decorate([
    (0, method_1.Post)("/api/admin/content/image/lable", {
        contentType: "multipart/form-data",
        absolute: true,
    }),
    __param(0, (0, parameters_1.Body)({
        destination: "lable",
        schema: zod_1.z.string(),
    })),
    __param(1, (0, parameters_1.Files)({
        destination: "upload",
        schema: zod_1.z.any().optional(),
        config: {
            maxCount: 1,
            name: "upload",
            types: ["jpg", "jpeg", "webp", "png"],
        },
        mapToBody: true,
    }))
], ArticleController.prototype, "uploadImageWithLable", null);
__decorate([
    (0, method_1.Get)("/api/admin/content/image/minimum-res", {
        absolute: true,
    }),
    __param(0, (0, parameters_1.Query)({
        destination: "template",
        schema: controller_1.default.id,
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "language",
        schema: controller_1.default.id,
    }))
], ArticleController.prototype, "getMinimumResolution", null);
__decorate([
    (0, method_1.Get)("/api/admin/content/image/minimum-res/all", {
        absolute: true,
    }),
    __param(0, (0, parameters_1.Query)({
        destination: "template",
        schema: controller_1.default.id,
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "language",
        schema: controller_1.default.id,
    }))
], ArticleController.prototype, "getAllResolution", null);
__decorate([
    (0, method_1.Get)("/api/admin/content/number", {
        absolute: true
    })
], ArticleController.prototype, "getContentNumber", null);
__decorate([
    __param(0, (0, parameters_1.Admin)()),
    __param(1, (0, parameters_1.Session)())
], ArticleController.prototype, "getPaginationConfig", null);
__decorate([
    __param(4, (0, parameters_1.Session)())
], ArticleController.prototype, "search", null);
