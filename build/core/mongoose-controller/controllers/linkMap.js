"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkMapController = void 0;
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/linkMap/repository"));
const contentRegistry_1 = __importDefault(require("../contentRegistry"));
const repository_2 = __importDefault(require("../repositories/linkTag/repository"));
const repository_3 = __importDefault(require("../repositories/keyword/repository"));
class LinkMapController extends controller_1.default {
    // keywordRepo :
    // keywordTaskRepo : KeywordTaskRepository
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.registry = contentRegistry_1.default.getInstance();
        this.linkTagRepo = new repository_2.default();
    }
    // @Post("/actiavate")
    // async actiavateLink(
    //     @Body({
    //         destination: "keyword",
    //         schema: BaseController.id
    //     }) id: string,
    //     @Body({
    //         destination: "from",
    //         schema: BaseController.id
    //     }) from: string,
    //     @Body({
    //         destination : "fromType",
    //         schema : z.string()
    //     })fromType : string,
    //     @Body({
    //         destination: "part",
    //         schema: z.enum(["content" , "summary" , "faq" , "comment"])
    //     })part : string,
    //     @Body({
    //         destination: "subPartId",
    //         schema: BaseController.id
    //     }) subPartId: string,
    // ) {
    //     part = `${part}Links`
    //     let repo = this.registry.getRegistry(fromType)?.repo
    // }
    // @Post("/deactivate")
    // async deactivateLink(
    //     @Body({
    //         destination: "keyword",
    //         schema: BaseController.id
    //     }) id: string,
    //     @Body({
    //         destination: "from",
    //         schema: BaseController.id
    //     }) from: string,
    //     @Body({
    //         destination: "part",
    //         schema: z.enum(["content" , "summary" , "faq" , "comment"])
    //     })part : string,
    //     @Body({
    //         destination : "fromType",
    //         schema : z.string()
    //     })fromType : string,
    //     @Body({
    //         destination: "subPartId",
    //         schema: BaseController.id
    //     }) subPartId: string,
    // ) {
    // }
    initApis() {
        this.addRouteWithMeta("s", "get", this.search.bind(this), controller_1.default.searcheMeta);
    }
}
exports.LinkMapController = LinkMapController;
const linkMap = new LinkMapController("/link-map", new repository_1.default(new repository_3.default()), {});
exports.default = linkMap;
