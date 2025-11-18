import { Query } from "../../decorators/parameters";
import { Response } from "../../controller";
import { BasePageController, basePageZod, seoSchema } from "../basePage/controller";
import CategoryContent from "../repositories/categoryContent/model";
import CategoryContentRepository from "../repositories/categoryContent/repository";
import { z } from "zod"
import { Get } from "../../decorators/method";
import { AdminInfo } from "../auth/admin/admin-logIn";
import BaseController from "../controller";

let schema = z.object({}).merge(seoSchema)
    .omit({
        mainKeyWord: true
    })

const insertSchema = basePageZod.merge(z.object({
    catID: BasePageController.id,
    title: z.string(),
    mainImage: z.string(),
    summary: z.string(),
    content: z.string().optional(),
    seo: schema
})).omit({
    category: true,
    categories: true,
})


export class CategoryContentController extends BasePageController<CategoryContent> {

    @Get("/content")
    getCategoryContent(
        @Query(
            {
                destination: "language",
                schema: BasePageController.id
            }
        ) language: string,
        @Query({
            destination: "catID",
            schema: BasePageController.id
        }) catID: string,
        @Query({
            destination: "lable",
            schema: z.string().default("content")
        }) lable: string,


    ): Promise<Response> {
        return super.findOne({
            catID,
            lable,
            language

        })
    }
    async publish(data: CategoryContent, id: string, update: boolean, admin: AdminInfo): Promise<Response> {
        try {
            // console.log("data" , data)
            // console.log("id" , id)
            // console.log("update" , update)
            let r = await super.publish(data, id, update, admin)
            return r
        } catch (error) {
            //  console.log(error)
            throw error
        }
    }


    @Get("/summary-data")
    async getCategoryContentSummary(
        @Query({
            destination: "module",
            schema: z.string()
        }) module: string,
        @Query({
            destination: "catID",
            schema: BaseController.id
        }) catID: string
    ): Promise<Response> {
        try {
            const data = await this.repository.collection.findOne({
                catID,
                module
            }, {
                modifyDate: 1,
                useage: 1,
            })
            return {
                data,
                status: 200
            }
        } catch (error) {
            throw error
        }

    }


    initApis(): void {
        super.initApis()
        this.addRouteWithMeta(
            "/categoryContents/search",
            "get",
            this.search.bind(this),
            BaseController.searcheMeta
        );
        this.addRoute("/search/list", "get", this.getSearchList.bind(this));

    }
}
const categoryContent = new CategoryContentController("/categoryContent", new CategoryContentRepository(

    {
        population: [
            {
                path: "catID",
            },
            {
                path: "language",
            },
        ]
    }
), {
    insertSchema,
    searchFilters: {
        title: ["reg", "eq"],
        language: ["eq"],
    },

})

export default categoryContent