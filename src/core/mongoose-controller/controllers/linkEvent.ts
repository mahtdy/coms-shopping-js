import { Body } from "../../decorators/parameters";
import { Post } from "../../decorators/method";
import BaseController, { ControllerOptions } from "../controller";
import LinkEvent from "../repositories/linkEvent/model";
import LinkEventRepository from "../repositories/linkEvent/repository";
import { z } from "zod"
import { Response } from "../../controller";
import KeywordRepository from "../repositories/keyword/repository";
import LinkTagRepository from "../repositories/linkTag/repository";
import ContentRepository from "../repositories/content/repository";
import DomainRepository from "../repositories/domain/repository";
import LinkMapRepository from "../repositories/linkMap/repository";


export default class LinkEventController extends BaseController<LinkEvent>{
    keywordRepo: KeywordRepository
    linkTagRepo: LinkTagRepository
    contentRepo: ContentRepository
    domainRepo: DomainRepository
    linkMapRepo : LinkMapRepository

    constructor(baseRoute: string, repo: LinkEventRepository, options?: ControllerOptions) {
        super(baseRoute, repo, options);

        this.keywordRepo = new KeywordRepository()
        this.linkTagRepo = new LinkTagRepository()
        this.contentRepo = new ContentRepository()
        this.domainRepo = new DomainRepository()
        this.linkMapRepo =  new LinkMapRepository(this.keywordRepo)
    }



    @Post("/clicked")
    async clicked(
        @Body({
            schema: z.object({

                keyword: z.string(),

                page: BaseController.id,
                
                target: z.string(),

                part: z.enum(
                    [
                        "comment",
                        "content",
                        "summary",
                        "faq"
                    ]
                ),

                subPartId : BaseController.id.optional(),

            })
        }) data: {
            keyword: string,
            page: string,
            target: string,
            part:  "comment" | "content" | "summary" | "faq",
            subPartId ?: string
        },

    ): Promise<Response> {
        try {
            console.log("data", data)
            let keyword = await this.keywordRepo.findOne({
                text: data.keyword
            })
            if (keyword == null) {
                return {
                    status: 200
                }
            }

            let content = null

            if(data.target.startsWith("/tag_")){
                const linkTag = await this.linkTagRepo.findOne({
                    tag: data.target
                })
                if(linkTag != null){
                    content = await this.contentRepo.findById(linkTag.link as string)
                    if(content == null ){
                        return {
                            status : 200
                        }
                    }
                }
            }

            else {
                let u  = data.target
                if (data.target.startsWith("http")) {
                    let url = new URL(data.target)
                    // u =
                    let domain = await this.domainRepo.findOne({
                        domain: url.host
                    })

                    if (domain == null) {
                        return {
                            status: 200
                        }
                    }
                    u = domain.isDefault ? url.pathname : url.host + url.pathname
                }

                content = await this.contentRepo.findOne({
                    url: u
                })
            }




            if(content == null) {
                return {
                    status : 200
                }
            }


            const linkMap = await this.linkMapRepo.findOne({
                from : data.page,
                to : content.id,
                keyword : keyword._id
            })

            if(linkMap != null) {
                return  this.create({
                    keyword : keyword._id,

                    to : content.id,
                    toType : linkMap.toType,

                    from : linkMap.from,
                    fromType : linkMap.fromType,

                    part : data.part,
                    subPartId : data.subPartId
                } as  any)
            }


        }
        catch (error) {

        }

        return {
            status: 200,
            data: {}
        }
    }



    initApis() {

    }

}