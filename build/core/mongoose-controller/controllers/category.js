"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = void 0;
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/category/repository"));
const cache_1 = __importDefault(require("../../cache"));
const zod_1 = require("zod");
const repository_2 = __importDefault(require("../repositories/categoryMap/repository"));
const mongoose_1 = require("mongoose");
const parameters_1 = require("../../decorators/parameters");
class CategoryController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.catMapRepo = new repository_2.default();
    }
    async createByInfo(data, lable, parent, language) {
        var _a;
        try {
            if (language == undefined) {
                language = data.language;
            }
            var d = await super.create(data);
            if (lable) {
                var category = (_a = d.data) === null || _a === void 0 ? void 0 : _a._id;
                var ancestors = [];
                if (parent) {
                    var p = await this.catMapRepo.findOne({
                        category: parent
                    });
                    if (p != null) {
                        ancestors = [...p === null || p === void 0 ? void 0 : p.ancestors];
                        ancestors.push(parent);
                        parent = parent;
                    }
                }
                this.catMapRepo.insert({
                    lable,
                    category,
                    parent,
                    language,
                    ancestors
                });
            }
        }
        catch (error) {
            throw error;
        }
        return d;
    }
    async edit(id, update) {
        var dd = await this.editById(id, {
            $set: update
        });
        try {
            if (update.parent) {
                var parent = await this.catMapRepo.findOne({
                    _id: update.parent
                });
                if (parent != null) {
                    var parentlist = parent.ancestors;
                    parentlist.push(update.parent);
                    var category = await this.catMapRepo.findByIdAndUpdate(new mongoose_1.Types.ObjectId(update.parent), {
                        $set: {
                            ancestors: parentlist
                        }
                    });
                    if (category != null) {
                        var result = await this.repository.updateCategoryTree(update.parent, category.ancestors, parentlist);
                    }
                }
            }
        }
        catch (error) {
            console.log(error);
        }
        return dd;
    }
    search(page, limit, reqQuery, admin, ...params) {
        // console.log("search")
        return super.search(page, limit, reqQuery, admin);
    }
    initApis() {
        this.addRouteWithMeta("", "post", this.createByInfo.bind(this), {
            "1": {
                index: 0,
                source: "body",
                schema: this.insertSchema
            },
            "2": {
                index: 1,
                source: "query",
                schema: zod_1.z.string().optional(),
                destination: "lable"
            },
            "3": {
                index: 2,
                source: "query",
                schema: controller_1.default.id.optional(),
                destination: "parent"
            },
            "4": {
                index: 3,
                source: "query",
                schema: controller_1.default.id.optional(),
                destination: "language"
            },
        });
        this.addRouteWithMeta("s", "get", this.search.bind(this), controller_1.default.adminPaginateMeta);
        this.addRouteWithMeta("", "delete", this.delete.bind(this), {
            "1": {
                index: 0,
                source: "query",
                destination: "id",
                schema: controller_1.default.id
            },
        });
        this.addRoute("", "put", this.edit.bind(this));
        this.addRouteWithMeta("s/search", "get", this.search.bind(this), controller_1.default.searcheMeta);
        this.addRoute("s/search/list", "get", this.getSearchList.bind(this));
    }
}
exports.CategoryController = CategoryController;
__decorate([
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            title: zod_1.z.string().optional(),
            parent: controller_1.default.id.optional()
        })
    }))
], CategoryController.prototype, "edit", null);
var category = new CategoryController("/category", new repository_1.default({
    cacheService: new cache_1.default("backup")
}), {
    insertSchema: zod_1.z.object({
        title: zod_1.z.string(),
        language: controller_1.default.id
    }),
    searchFilters: {
        title: ["eq", "reg"],
        _id: ["eq", "list"],
        language: ["eq", "list"]
    },
    paginationConfig: {
        fields: {
            title: {
                en_title: "title",
                fa_title: "عنوان",
                isOptional: false,
                type: "string",
                filters: ["reg"],
                sortOrderKey: true
            },
            useage: {
                en_title: "useage",
                fa_title: "تعداد استفاده",
                isOptional: false,
                sortOrderKey: false,
                type: "number",
                filters: [],
            },
            language: {
                en_title: "language",
                fa_title: "زبان",
                isOptional: false,
                sortOrderKey: false,
                type: "number",
                filters: [],
                object_value: ["panelTitle"],
                target_func: "v1",
            }
        },
        paginationUrl: "/categorys",
        searchUrl: "/categorys",
        serverType: "",
        tableLabel: "category",
        actions: [
            {
                api: "/category",
                type: "delete",
                route: "/panel/permission/adminrole/$_id",
                queryName: "id",
                text: "حذف",
                fromData: ["_id"]
            },
            {
                api: "",
                type: "insert",
                route: "/panel/content/category-list",
                queryName: "adminid",
                text: "دسته‌بندی جدید"
            },
            {
                api: "",
                type: "edit_modal",
                route: "/panel/content/category-list",
                queryName: "",
            }
        ],
        auto_filter_name: "title",
        auto_search_title: "عنوان",
        auto_search_key: "title$reg",
        auto_search_url: "/categorys?",
        auto_filter_idKey: "_id",
        auto_search_submit: "_id$list"
    }
});
exports.default = category;
