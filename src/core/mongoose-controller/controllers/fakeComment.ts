import { Admin, Body, Files, Query } from "../../decorators/parameters";
import { Delete, Post, Put } from "../../decorators/method";
import BaseController, { ControllerOptions } from "../controller";
import FakeComment from "../repositories/fakeComment/model";
import FakeCommentRepository from "../repositories/fakeComment/repository";
import z from "zod"
import { Response } from "../../controller";
import { Types } from "mongoose";
import LanguageCommentRepository from "../repositories/languageComment/repository";
import FileManagerConfigRepository from "../repositories/fileManagerConfig/repository";
import CDN_Manager from "../../services/fileManager";
import { ArticleController } from "./article";
import path from "path";
import { AdminInfo } from "../auth/admin/admin-logIn";

export const insertSchema = z.object({
    pageType: z.string(),
    page: BaseController.id,
    status: z.enum(["waiting", "confirmed", "rejected"]).default("waiting"),
    text: z.string(),
    userInfo: z.any(),
    publishAt: z.coerce.date().optional(),
    cycle: BaseController.id.optional(),

    replyAdmin: BaseController.id.optional(),
    replyText: z.string().optional(),
    replyPublishAt: z.coerce.date().optional(),
    replyCycle: BaseController.id.optional(),

    info: z.any()
})


export class FakeCommentController extends BaseController<FakeComment>{
    languageCommentRepo: LanguageCommentRepository
    cdnRepo: FileManagerConfigRepository
    constructor(baseRoute: string, repo: FakeCommentRepository, options?: ControllerOptions) {
        super(baseRoute, repo, options)
        this.languageCommentRepo = new LanguageCommentRepository()
        this.cdnRepo = new FileManagerConfigRepository()
    }


    @Post("/attach")
    async attachFile(
        @Body({
            destination: "file",
            schema: z.string()
        }) file: string,
        @Files({
            config: {
                name: "file",
                maxCount: 5,
                // size : 5000000
            },
            mapToBody: true,
            destination: "file",
            // isArray: true,
            schema: z.any().optional(),


        }) files: any,
        @Body({
            destination: "language",
            schema: BaseController.id
        }) language: string
    ) {
        try {

            let lang = await this.languageCommentRepo.findOne({
                language
            })
            if (lang != null) {

                // if(captch)
                let savePath = lang["upload-path"]
                var conf = await this.cdnRepo.findById(savePath.fileManager)

                var cdn: CDN_Manager = new CDN_Manager()
                await cdn.init(true)
                let dest = ArticleController.getUploadDestination(savePath.path, "y-m-d") + path.basename(file)

                let data = await cdn.upload(file, dest)
                return {
                    status: 200,
                    data
                }
            }
            return {
                status: 400
            }


        } catch (error) {
            console.log(error)
            throw error
        }
    }



    @Put("")
    async updateOne(
        @Query({
            destination: "id",
            schema: BaseController.id
        }) id: string,
        @Body({
            schema: insertSchema
        }) data: any
    ) {
        try {
            return await this.editById(id, { $set: data })
        } catch (error) {
            throw error
        }
    }



    async create(data: FakeComment,@Admin() admin : AdminInfo): Promise<Response> {
        data.replyAdmin = admin._id
        return super.create(data)
    }

    delete(id: string | Types.ObjectId, ...params: any[]): Promise<Response> {
        return super.delete(id)
    }







    @Post("/confirm")
    async confirmFakeComment(
        @Query({
            destination: "id",
            schema: BaseController.id
        }) id: string
    ) {
        try {
            return await this.editById(id, {
                $set: {
                    status: "confirmed"
                }
            })
        } catch (error) {
            throw error
        }
    }

    @Post("/reject")
    async rejectFakeComment(
        @Query({
            destination: "id",
            schema: BaseController.id
        }) id: string
    ) {
        try {
            return await this.editById(id, {
                $set: {
                    status: "rejected"
                }
            })
        } catch (error) {
            throw error
        }
    }


    @Post("/publish")
    async publish(
        @Body({
            destination : "id",
            schema : BaseController.id
        }) id : string,
        @Body({
            destination : "language",
            schema : BaseController.id
        })language : string
    ): Promise<Response>{ 
        try {
            return {
                status : 200,
                data : await this.repository.publish(id, language)
            }
        } catch (error) {
            throw error
        }
    }

    @Post("/publish/all")
    async publishAll(
        @Body({
            destination : "page",
            schema : BaseController.id
        }) page : string,
        @Body({
            destination : "language",
            schema : BaseController.id
        })language : string
    ):Promise<Response>{
        try {
            return {
                status : 200,
                data : await this.repository.publishAll(page, language)
            }
        } catch (error) {
            throw error
        }
    }


    initApis(): void {
        // super.initApis()
        this.addRouteWithMeta("", "post", this.create.bind(this), {
            "1": {
                index: 0,
                source: "body",
                schema: this.insertSchema
            }
        })
        var pg = this.baseRoute.endsWith("e") ? "s" : "es"

        
        this.addRouteWithMeta(pg, "get", this. search.bind(this), Object.assign(BaseController.searcheMeta, { absolute: false }))


        this.addRouteWithMeta("", "delete", this.delete.bind(this), {
            "1": {
                index: 0,
                source: "query",
                destination: "id",
                schema: BaseController.id
            },
        })
    }



}

const fakeComment = new FakeCommentController("/manual-comment", new FakeCommentRepository(), {
    insertSchema,
    searchFilters : {
        page : ["eq" , "list"],
        pageType : ["eq" , "list"]
    }
})

export default fakeComment