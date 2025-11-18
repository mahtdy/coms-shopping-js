"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = require("./model");
const repository_1 = __importDefault(require("../../repository"));
const contentRegistry_1 = __importDefault(require("../../contentRegistry"));
const repository_2 = __importDefault(require("../categoryContent/repository"));
const repository_3 = __importDefault(require("../content/repository"));
const lableMap = {
    "content": "categoryContent"
};
const lableModuleMap = {
    "content": "article"
};
class CategoryMapRepository extends repository_1.default {
    constructor(options) {
        super(model_1.CategoryMapModel, options);
        this.categoryContentRepo = new repository_2.default();
        this.contentRegistry = contentRegistry_1.default.getInstance();
        this.contentRepo = new repository_3.default();
    }
    getCategoryAnsectors(map) {
    }
    async changeByLable(lable, map, language) {
        var _a, _b;
        let beforeMap = await this.getByLable(lable, language);
        var data = this.extractMap(map);
        let before = this.extractMap2(beforeMap);
        let inf = [];
        data.map((elem, i) => {
            elem['lable'] = lable;
            elem['language'] = language;
        });
        for (let i = 0; i < data.length; i++) {
            inf.push(data[i]);
            data[i] = {
                "insertOne": {
                    "document": data[i]
                }
            };
        }
        var ops = [
            {
                deleteMany: {
                    filter: {
                        lable: {
                            $eq: lable
                        },
                        language: {
                            $eq: language
                        }
                    }
                }
            }
        ];
        ops.push(...data);
        let res = await this.collection.bulkWrite(ops);
        let categories = await this.findAll({
            lable,
            language
        });
        let moduleName = lableModuleMap[lable] || lable;
        let module = this.contentRegistry.getRegistry(moduleName);
        try {
            for (let i = 0; i < inf.length; i++) {
                let ansectors = this.findCategoryAnsectors(before, inf[i].category);
                await ((_a = module === null || module === void 0 ? void 0 : module.repo) === null || _a === void 0 ? void 0 : _a.updateMany({
                    category: inf[i].category,
                    language
                }, {
                    $pull: {
                        categories: {
                            $in: ansectors
                        }
                    }
                }));
                let r = await ((_b = module === null || module === void 0 ? void 0 : module.repo) === null || _b === void 0 ? void 0 : _b.updateMany({
                    category: inf[i].category,
                    language
                }, {
                    $addToSet: {
                        categories: {
                            $each: inf[i].ancestors || []
                        }
                    }
                }));
            }
        }
        catch (error) {
            console.log(error);
        }
        return res;
    }
    findCategoryAnsectors(data, id) {
        for (let i = 0; i < data.length; i++) {
            if (data[i].category.toString() == id) {
                data[i].ancestors || [];
            }
        }
        return [];
    }
    async insertMap(lable, map, language) {
        var exists = await this.isExists({
            lable: {
                $eq: lable
            },
            language
        });
        if (exists) {
            throw new Error("برچسب تکراری");
        }
        var data = this.extractMap(map);
        data.map((elem, i) => {
            elem['lable'] = lable;
            elem['language'] = language;
        });
        return this.insertMany(data);
    }
    extractMap(map, ancestors = [], parent) {
        var _a;
        var list = [];
        for (let i = 0; i < map.length; i++) {
            var elem = {};
            elem['category'] = map[i].category;
            elem['ancestors'] = ancestors;
            elem["parent"] = parent;
            list.push(elem);
            elem["showTitle"] = map[i].showTitle || map[i].title;
            if (((_a = map[i].children) === null || _a === void 0 ? void 0 : _a.length) != 0) {
                var tmp_ancestors = [...ancestors];
                tmp_ancestors.push(map[i].category);
                list.push(...this.extractMap(map[i].children, tmp_ancestors, map[i].category));
            }
        }
        return list;
    }
    extractMap2(map, ancestors = [], parent) {
        var _a;
        var list = [];
        for (let i = 0; i < map.length; i++) {
            var elem = {};
            elem['category'] = map[i].id;
            elem['ancestors'] = ancestors;
            elem["parent"] = parent;
            list.push(elem);
            elem["showTitle"] = map[i].showTitle || map[i].title;
            if (((_a = map[i].children) === null || _a === void 0 ? void 0 : _a.length) != 0) {
                var tmp_ancestors = [...ancestors];
                tmp_ancestors.push(map[i].category);
                list.push(...this.extractMap2(map[i].children, tmp_ancestors, map[i].id));
            }
        }
        return list;
    }
    async getByLable(lable, language) {
        var _a, _b;
        try {
            var data = await this.findAll({
                lable: {
                    $eq: lable
                },
                language
            }, {}, [
                "category", "ancestors", "parent"
            ]);
            let moduleName = lableModuleMap[lable] || lable;
            let module = this.contentRegistry.getRegistry(moduleName);
            let defaultDomain = await this.contentRepo.domainRepo.findOne({
                isDefault: true
            });
            for (let i = 0; i < data.length; i++) {
                if (module != undefined) {
                    data[i].useage = await ((_a = module.repo) === null || _a === void 0 ? void 0 : _a.getcount({
                        $or: [{
                                category: data[i].category._id
                            }, {
                                categories: data[i].category._id
                            }],
                        isPublished: true,
                        language
                    }));
                    data[i].draftUseage = await ((_b = module.repo) === null || _b === void 0 ? void 0 : _b.getcount({
                        $or: [{
                                category: data[i].category._id
                            }, {
                                categories: data[i].category._id
                            }],
                        isDraft: true,
                        language
                    }));
                }
                let catLabale = lableMap[lable] || lable;
                let catContent = await this.contentRepo.findOne({
                    categoryLable: lable,
                    language: language,
                    id: data[i].category._id
                });
                if (catContent != null) {
                    data[i].url = catContent.url.startsWith("/") ? `https://${defaultDomain === null || defaultDomain === void 0 ? void 0 : defaultDomain.domain}${catContent.url}` : `https://${catContent.url}`;
                }
            }
            data = this.convertData(data, undefined, language);
            return data;
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    convertData(data, id, language) {
        // console.log(id)
        var _a, _b, _c, _d, _e;
        var results = [];
        for (let i = 0; i < data.length; i++) {
            if (id == undefined && data[i].parent == undefined) {
                var item = {};
                item['id'] = data[i].category._id || "";
                item = Object.assign(item, data[i].category["_doc"]);
                delete item["_id"];
                delete item["_v"];
                if (item.showTitle == undefined) {
                    item["showTitle"] = language ? ((_a = item.translation) === null || _a === void 0 ? void 0 : _a[language]) || item.title : item.title;
                }
                item.useage = data[i].useage || 0;
                item.url = data[i].url;
                item.draftUseage = data[i].draftUseage || 0;
                item.children = this.convertData(data, data[i].category._id || "", language);
                results.push(item);
            }
            if (data[i].parent != undefined && data[i].parent._id.toString() == id) {
                var item = {};
                item['id'] = ((_b = data[i].category) === null || _b === void 0 ? void 0 : _b._id) || "";
                item = Object.assign(item, (_c = data[i].category) === null || _c === void 0 ? void 0 : _c["_doc"]);
                delete item["_id"];
                delete item["_v"];
                item["showTitle"] = language ? ((_d = item.translation) === null || _d === void 0 ? void 0 : _d[language]) || item.title : item.title;
                item.useage = data[i].useage || 0;
                item.url = data[i].url;
                item.draftUseage = data[i].draftUseage || 0;
                item.children = this.convertData(data, ((_e = data[i].category) === null || _e === void 0 ? void 0 : _e._id) || "", language);
                item['parent'] = data[i].parent._id.toString();
                results.push(item);
            }
        }
        return results;
    }
}
exports.default = CategoryMapRepository;
