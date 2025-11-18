"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../../../core/mongoose-controller/repositories/admin/repository"));
const article_1 = require("../../../core/mongoose-controller/controllers/article");
const model_1 = require("../../../core/mongoose-controller/repositories/article/model");
const repository_2 = __importDefault(require("../../../core/mongoose-controller/repositories/article/repository"));
const login_1 = require("../login");
var article = new article_1.ArticleController("/article", new repository_2.default({
    model: model_1.ArticleModel,
    typeName: "article",
    population: [
        {
            path: "category",
        },
        {
            path: "author",
        },
        {
            path: "seoContent",
            select: ["url"],
        },
    ],
    queryData: [
        {
            field: "_id",
            filters: ["eq", "list"],
            showField: "آیدی",
            search: true,
        },
        {
            field: "type",
            filters: ["eq", "list"],
            showField: "نوع",
            options: [
                "general",
                "gallery",
                "video",
                "podcast",
                "category_faq",
                "increamental",
            ],
        },
        {
            field: "title",
            filters: ["eq", "reg"],
            showField: "عنوان",
        },
        {
            field: "viewMode",
            filters: ["eq", "list"],
            showField: "نوع نمایش",
            options: ["public", "forUsers", "private"],
        },
    ],
    fromOwn: [
        {
            field: "category",
            target: "category",
            filters: ["eq", "list"],
            showField: "دسته بندی",
            element: "_id",
        },
        {
            field: "author",
            target: "author",
            filters: ["eq"],
            showField: "نویسننده",
            element: "_id",
        },
        {
            field: "suggestArticles",
            target: "_id",
            filters: ["list"],
            showField: "مقالات پیشنهادی",
        },
        {
            field: "language",
            target: "language",
            filters: ["eq"],
            showField: "زبان",
            isDefault: true,
        },
    ],
    defaultExact: "_id",
    selectData: {
        type: 1,
        title: 1,
        mainImage: 1,
        author: 1,
        category: 1,
        publishDate: 1,
        insertDate: 1,
    },
    sort: {
        publishDate: {
            show: "زمان انتشار",
        },
        insertDate: {
            show: "زمان انتشار",
        },
        view: {
            show: "بازدید",
        },
    },
}), {
    insertSchema: article_1.insertSchema,
    excelConfig: article_1.excelConfig,
    csvConfig: article_1.csvConfig,
    pdfConfig: article_1.pdfConfig,
    adminRepo: new repository_1.default({
        model: login_1.AdminModel,
    }),
    isAdminPaginate: true,
    paginationConfig: {
        fields: {
            title: {
                en_title: "title",
                sideImage: "mainImage",
                fa_title: "عنوان",
                isOptional: false,
                sortOrderKey: false,
                type: "string",
                filters: ["reg"],
            },
            type: {
                en_title: "type",
                fa_title: "نوع",
                isOptional: false,
                sortOrderKey: false,
                type: "string",
                filters: ["list"],
                isSelect: true,
                selectList: [
                    "general",
                    "gallery",
                    "video",
                    "podcast",
                    "increamental",
                ],
            },
            insertDate: {
                en_title: "insertDate",
                fa_title: "زمان ثبت",
                isOptional: false,
                sortOrderKey: false,
                type: "date",
                filters: ["gte", "lte"],
            },
            category: {
                fa_title: "دسته بندی",
                en_title: "category",
                isOptional: false,
                sortOrderKey: false,
                type: "string",
                object_value: ["title"],
                target_func: "v1",
                isAutoComplate: true,
                filters: ["reg"],
                autoComplete: {
                    key: "title$reg",
                    target_idKey: "_id",
                    target_func: "v1",
                    url: "/categorys/search?",
                    isopen_sub: false,
                    values: [],
                    target_value: "title",
                    fields: ["title"],
                },
            },
            isDraft: {
                en_title: "isDraft",
                fa_title: "پیشنویس",
                isOptional: false,
                sortOrderKey: false,
                type: "boolean",
                filters: ["eq"],
            },
            viewMode: {
                en_title: "viewMode",
                fa_title: "نوع نمایش",
                isOptional: false,
                sortOrderKey: false,
                type: "string",
                filters: ["list"],
                isSelect: true,
                selectList: ["public", "forUsers", "private"],
            },
            author: {
                en_title: "author",
                fa_title: "نویسنده",
                isOptional: false,
                sortOrderKey: false,
                type: "string",
                object_value: ["name", "family"],
                target_func: "v1",
                isAutoComplate: true,
                filters: ["reg"],
                autoComplete: {
                    key: "name$reg",
                    target_idKey: "_id",
                    target_func: "v1",
                    url: "/authores/search?",
                    isopen_sub: false,
                    values: [],
                    target_value: "name",
                    fields: ["name", "family"],
                },
            },
        },
        paginationUrl: "/articles/search",
        searchUrl: "/articles/search",
        serverType: "",
        tableLabel: "article",
        auto_search_url: "/articles/search?",
        auto_search_key: "title$reg",
        auto_search_title: "عنوان مقاله",
        auto_filter_name: "title",
        auto_search_submit: "_id$list",
        auto_filter_idKey: "_id",
        exportcsvUrl: "/articles/csv",
        exportexelUrl: "/articles/exel",
        exportpdfUrl: "/articles/pdf",
        actions: [
            {
                route: "panel/content/index/",
                type: "setting",
                queryName: "",
                api: "",
            },
            {
                route: "panel/content/insert-content",
                type: "insert",
                text: "ایجاد مقاله جدید",
                api: "",
                queryName: "",
            },
            {
                route: "panel/content/index/$_id",
                type: "edit",
                api: "",
                queryName: "",
                fromData: ["_id"],
            },
            {
                route: "panel/content/delete",
                type: "delete",
                api: "/article",
                queryName: "",
            },
        ],
    },
    searchFilters: {
        title: ["reg", "eq"],
        _id: ["list", "eq"],
        category: ["list", "eq"],
        type: ["list", "eq"],
        viewMode: ["list", "eq"],
    },
});
exports.default = article;
