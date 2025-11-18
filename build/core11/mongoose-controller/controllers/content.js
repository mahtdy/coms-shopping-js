"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentController = void 0;
const controller_1 = require("../basePage/controller");
const controller_2 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/content/repository"));
const repository_2 = __importDefault(require("../repositories/seoDraft/repository"));
const method_1 = require("../../decorators/method");
class ContentController extends controller_2.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.seoDraftRepo = new repository_2.default();
    }
    async searchHelper(queryParam) {
        // console.log(queryParam)
        // queryParam[key + "$" + this.searchFilters[key][i]]
        var query = {};
        if (queryParam['url_title$reg'] != undefined) {
            query["$or"] = [
                {
                    url: {
                        "$regex": new RegExp(queryParam['url_title$reg'])
                    }
                },
                {
                    "seo.seoTitle": {
                        "$regex": new RegExp(queryParam['url_title$reg'])
                    }
                }
            ];
        }
        try {
            delete queryParam['url_title$reg'];
        }
        catch (error) {
        }
        query = Object.assign(await super.searchHelper(queryParam), query);
        if (queryParam['keyWords$reg']) {
            query['$or'] = [
                { keyWords: { "$regex": query['keyWords']["$regex"] } },
                { mainKeyWord: { "$regex": query['keyWords']["$regex"] } }
            ];
            delete query['keyWords'];
        }
        if (query['seo.seoTitle']) {
            query['seoTitle'] = query['seo.seoTitle'];
            delete query['seo.seoTitle'];
        }
        if (queryParam["_id$ne"]) {
            query["id"] = {
                $ne: queryParam["_id$ne"]
            };
        }
        return query;
    }
    async search(page, limit, reqQuery, admin, ...params) {
        // console.log(reqQuery)
        let response = await super.search(page, limit, reqQuery, admin);
        if (response.data.count == 0) {
            const query = await this.searchHelper(reqQuery);
            return {
                status: 200,
                data: Object.assign(await this.seoDraftRepo.paginate(query, limit, page), {
                    draft: true
                })
            };
        }
        // console.log(response)
        // console.log(response.data.count)
        // if()
        // if(response.data.count < 2){
        // }
        return response;
    }
    async getUrlBlacklist() {
        let data = ["/google", "/api", "/uploads", "/apis", "/socket.io", "/admin"];
        return {
            status: 200,
            data
        };
    }
    initApis() {
        super.initApis();
        this.addRouteWithMeta("/article/seo/search", "get", this.search.bind(this), Object.assign(controller_2.default.searcheMeta, { absolute: true }));
        this.addRouteWithMeta("/article/seo/search/list", "get", this.getSearchList.bind(this), {});
        this.addRouteWithMeta("/article/seos", "get", this.paginate.bind(this), Object.assign(controller_2.default.paginateMeta, { absolute: true }));
    }
}
exports.ContentController = ContentController;
__decorate([
    (0, method_1.Get)("/url/black-list")
], ContentController.prototype, "getUrlBlacklist", null);
var seoContentController = new ContentController("/content", new repository_1.default(), {
    searchFilters: {
        mainKeyWord: ["eq", "list", "reg"],
        keyWords: ["eq", "list", "reg"],
        "seo.seoTitle": ["eq", "reg"],
        url: ["eq", "list", "reg"],
        url_title: ["reg"],
        // type: ["eq" , "list"]
    },
    insertSchema: controller_1.seoSchema
});
// seoContentController.tag = "/admin/article"
exports.default = seoContentController;
