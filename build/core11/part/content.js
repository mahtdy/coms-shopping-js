"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentPart = void 0;
const repository_1 = __importDefault(require("../mongoose-controller/repositories/content/repository"));
const contentRegistry_1 = __importDefault(require("../mongoose-controller/contentRegistry"));
const content_1 = __importDefault(require("../../apps/user/controllers/content"));
const controller_1 = __importDefault(require("../mongoose-controller/controller"));
const part_1 = __importDefault(require("../part"));
const repository_2 = __importDefault(require("../mongoose-controller/repositories/categoryContent/repository"));
const mongoose_1 = require("mongoose");
class ContentPart extends part_1.default {
    constructor(app) {
        super("", { controllers: [] });
        this.app = app;
        this.contentRepo = new repository_1.default();
        this.contentRegistry = contentRegistry_1.default.getInstance();
        this.categoryContentRepo = new repository_2.default();
    }
    static getInstance() {
        return ContentPart.instance;
    }
    static setInstance(app) {
        if (!ContentPart.instance) {
            ContentPart.instance = new ContentPart(app);
        }
        else {
            console.log(this.instance);
        }
        return ContentPart.instance;
    }
    async init() {
        setInterval(async () => {
            // console.log("interval")
            let conf = await this.contentRepo.contentQueueRepo.findOne({});
            // console.log(conf)
            if (conf != null) {
                this.addCategoryPagination(conf.data);
                await this.contentRepo.contentQueueRepo.deleteById(conf._id);
            }
        }, 2000);
        // setTimeout(async () => {
        try {
            const contents = await this.contentRepo.findAll({});
            for (let i = 0; i < contents.length; i++) {
                // console.log(contents[i].url, contents[i].type, contents[i].id);
                if (contents[i].type == "category") {
                    await this.addCategoryPagination(contents[i]);
                }
            }
        }
        catch (error) {
            throw error;
        }
        this.app.addRoute({
            execs: content_1.default.getTagContent.bind(content_1.default),
            method: "get",
            route: "/tag_*",
            meta: {
                params: {
                    "0": {
                        index: 0,
                        source: "fromReq",
                        destination: "url"
                    },
                    "1": {
                        index: 1,
                        source: "header",
                        destination: "host"
                    },
                }
            }
        });
        this.app.addRoute({
            execs: content_1.default.getHeaderScripts.bind(content_1.default),
            method: "get",
            route: "/api/scripts",
            meta: {
                params: {
                    "0": {
                        index: 0,
                        source: "header",
                        destination: "host"
                    },
                }
            }
        });
        this.app.addRoute({
            execs: content_1.default.getBlock.bind(content_1.default),
            method: "get",
            route: "/block-content/:name",
            meta: {
                params: {
                    "0": {
                        index: 0,
                        source: "param",
                        destination: "name",
                        // schema: BaseController.page
                    },
                    "1": {
                        index: 0,
                        source: "res"
                        // schema: BaseController.page
                    },
                    "2": {
                        index: 1,
                        source: "user",
                        required: false
                    }
                }
            }
        });
        this.app.addRoute({
            execs: content_1.default.getContent.bind(content_1.default),
            method: "use",
            route: "*",
            meta: {
                params: {
                    "0": {
                        index: 0,
                        source: "fromReq",
                        destination: "baseUrl"
                    },
                    "1": {
                        index: 1,
                        source: "header",
                        destination: "host"
                    },
                    "2": {
                        index: 2,
                        source: "user",
                        required: false
                    }
                }
            }
        });
        // }, 1000)
        return;
    }
    async getCategoryContents(page, category, language, contentRegistry, user) {
        var _a;
        // console.log(page,category,language,contentRegistry,user)
        let rep = this.contentRegistry.getRegistry(contentRegistry);
        let categoryContent = await this.categoryContentRepo.findOne({
            catID: category,
            language
        });
        let content = await this.contentRepo.findOne({
            id: category,
            language
        });
        categoryContent.seo = content;
        let paginate = await ((_a = rep === null || rep === void 0 ? void 0 : rep.repo) === null || _a === void 0 ? void 0 : _a.paginate({
            language: new mongoose_1.Types.ObjectId(language),
            $or: [{
                    category: new mongoose_1.Types.ObjectId(category)
                }, {
                    categories: new mongoose_1.Types.ObjectId(category)
                }]
        }, 12, page, {}));
        categoryContent.paginate = paginate;
        return {
            status: 200,
            data: categoryContent
        };
    }
    async addCategoryPagination(contentData) {
        // k("page", "host")
        this.app.addRoute({
            execs: this.getCategoryContents.bind(this),
            method: "get",
            route: "/api" + contentData.url + "/:page",
            meta: {
                params: {
                    "0": {
                        index: 0,
                        source: "param",
                        destination: "page",
                        schema: controller_1.default.page
                    },
                    "1": {
                        index: 1,
                        source: "fromOwn",
                        destination: "category",
                        data: contentData.id
                    },
                    "2": {
                        index: 2,
                        source: "fromOwn",
                        destination: "language",
                        data: contentData.language
                    },
                    "3": {
                        index: 3,
                        source: "fromOwn",
                        data: "article"
                    },
                    "4": {
                        index: 4,
                        source: "user",
                        required: false
                    },
                }
            }
        });
    }
    getCategoryContent(category, baseUrl) {
        return async function (page, host, user) {
            console.log(page, user, baseUrl);
            return await content_1.default.getContent(baseUrl, host, user);
        };
    }
    serve() {
        this.init();
        return [];
    }
}
exports.ContentPart = ContentPart;
// export  const contentPart = new ContentPart()
