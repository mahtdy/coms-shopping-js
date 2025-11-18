
import BaseController, { ControllerOptions } from "../controller";
import LinkMap from "../repositories/linkMap/model";
import LinkMapRepository from "../repositories/linkMap/repository";
import { Get, Post } from "../../decorators/method";
import { Body } from "../../decorators/parameters";
import ContentMaduleRegistry from "../contentRegistry";
import { z } from "zod"
import LinkTagRepository from "../repositories/linkTag/repository";
import KeywordRepository from "../repositories/keyword/repository";

export class LinkMapController extends BaseController<LinkMap>{
    registry: ContentMaduleRegistry
    linkTagRepo : LinkTagRepository
    // keywordRepo :
    // keywordTaskRepo : KeywordTaskRepository
    constructor(baseRoute: string, repo: LinkMapRepository, options?: ControllerOptions) {
        super(baseRoute, repo, options)
        this.registry = ContentMaduleRegistry.getInstance()
        this.linkTagRepo = new LinkTagRepository()
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
        this.addRouteWithMeta("s" , "get" , this.search.bind(this) ,BaseController.searcheMeta)
    }
}

const linkMap = new LinkMapController("/link-map", new LinkMapRepository(new KeywordRepository()), {})

export default linkMap