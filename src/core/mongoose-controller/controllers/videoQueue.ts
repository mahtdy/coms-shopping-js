import { Body, Query } from "../../decorators/parameters";
import { Delete, Get, Post, Put } from "../../decorators/method";
import BaseController from "../controller";
import VideoQueue, { VideoQueueStatus } from "../repositories/videoQueue/model";
import VideoQueueRepository from "../repositories/videoQueue/repository";
import { z } from "zod";
import { Types } from "mongoose";
import { Response } from "../../controller";
import { QueryInfo } from "../repository";


export class VideoQueueController extends BaseController<VideoQueue>{

    @Get("/validate")
    async validateVideo(
        @Query({
            destination: "video",
            schema: z.string()
        }) video: string
    ) {
        return this.findOne({
            $or: [
                {
                    src: video,
                },
                {
                    "result.path": video
                }
            ],
            locked: true
        })
    }

    @Post("/start")
    async startQueue(
        @Body({
            destination : "id",
            schema : BaseController.id
        }) id :string
    ):Promise<Response>{
        try {
            await this.repository.startProccess(id)
            return {
                status : 200,
                message: "در حال پردازش"
            }
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    async create(data: VideoQueue, ...params: any[]): Promise<Response> {
        try {
            const doc = await this.repository.findOne({
                $or: [
                    {
                        src: data.src,
                    },
                    {
                        "result.path": data.src
                    }
                ],
            })
            if (doc != null)
                return {
                    status: 200,
                    data: doc
                }

        } catch (error) {
            throw error
        }
        return super.create(data)
    }

    @Get("")
    findById(@Query({
        destination: "id",
        schema: BaseController.id
    }) id: string | Types.ObjectId, queryInfo?: QueryInfo | undefined): Promise<Response> {
        return super.findById(id)
    }

    @Post("/subTitle")
    async addSubTitle(
        @Body({
            destination: "id",
            schema: BaseController.id
        }) id: string,
        @Body({
            destination: "sub",
            schema: z.object({
                sign: z.string().default("en"),
                source: z.string().url(),
                title: z.string(),
                character : z.string(),
                offset : z.number().optional(),
                isdefault : z.boolean().optional()
            })
        }) sub: any
    ) {
        return this.editById(id, {
            $push: {
                subTitles: sub
            }
        })
    }

    @Put("/subTitle")
    async editSubTitle(
        @Body({
            destination : "id" , 
            schema : BaseController.id
        }) id : string,
        @Body({
            destination : "subID",
            schema : BaseController.id
        }) subID : string ,
        @Body({
            destination: "sub",
            schema: z.object({
                sign: z.string().default("en"),
                source: z.string().url(),
                title: z.string(),
                character : z.string(),
                offset : z.number().optional(),
                isdefault : z.boolean().optional()
            })
        }) sub: any
    ){
        sub["_id"] = subID
        try {
            return this.editOne({
                _id : id,
                "subTitles._id" : subID
            }, {
                $set: {
                    "subTitles.$": sub
                }
            })
        } catch (error) {
            throw error
        }
    }


    @Post("/subTiltle/hard")
    async addHardSubTitle(
        @Body({
            destination: "id",
            schema: BaseController.id
        }) id: string,
        @Body({
            destination: "sub",
            schema: z.object({
                sign: z.string().default("en"),
                source: z.string().url(),
                title: z.string(),
                character : z.string(),
                offset : z.number().optional()
            })
        }) sub: any
    ){
        return this.editById(id, {
            $set: {
                hardSub: sub,
                subTitles : [],
                status : VideoQueueStatus.ready
            },
        })
    }



    @Post("/config")
    async addConfig(
        @Body({
            destination: "id",
            schema: BaseController.id
        }) id: string,
        @Body({
            destination : "config",
            schema : BaseController.id
        }) config : string
    ){
        try {
            return this.editById(id,{
                $set : {
                    config,
                    status : VideoQueueStatus.ready
                }
            })
        } catch (error) {
            throw error
        }
    }

    @Post("/screen-shots")
    async addScreenshots(
        @Body({
            destination: "id",
            schema: BaseController.id
        }) id: string,
        @Body({
            destination : "screenshots",
            schema : z.array(z.string().url())
        }) screenshots : string[]
    ){
        return this.editById(id,{
            $set : {
                screenshots
            }
        }) 
    }

    @Delete("/subTitle")
    async deleteSubTitle(
        @Query({
            destination: "id",
            schema: BaseController.id
        }) id: string,
        @Query({
            destination: "subID",
            schema: BaseController.id
        }) subID: string,
        
    ) {
        return this.editById(
            id
            , {
                $pull: {
                    subTitles: {
                        _id: subID
                    }
                }
            })
    }

    @Post("/lock")
    lockVideo(
        @Body({
            destination: "videoID",
            schema: BaseController.id
        }) videoID: string,
        @Body({
            destination: "id",
            schema: BaseController.id
        }) id: string,
        @Body({
            destination: "type",
            schema: z.string()
        }) type: string
    ) {
        return this.editById(
            videoID
            , {
                $set: {
                    id,
                    type,
                    locked: true
                }
            })
    }


    @Post("/unlock")
    unlockVideo(
        @Body({
            destination: "videoID",
            schema: BaseController.id
        }) videoID: string,
        @Body({
            destination: "id",
            schema: BaseController.id
        }) id: string,
        @Body({
            destination: "type",
            schema: z.string()
        }) type: string) {
        return this.editOne({
            _id: videoID,
            id,
            type
        }, {
            $set: {
                locked: false
            },
            $unset: {
                id: 1,
                type: 1
            }
        })
    }


    // @Post("/sound")
    // async addSound(
    //     @Body({
    //         destination: "id",
    //         schema: BaseController.id
    //     }) id: string,
    //     @Body({
    //         destination: "sound",
    //         schema: z.object({
    //             sign: z.string().default("en"),
    //             source: z.string().url()
    //         })
    //     }) sound: any
    // ) {
    //     return this.editById(id, {
    //         $push: {
    //             sounds: sound
    //         }
    //     })
    // }


    // @Delete("/sound")
    // async deleteSound(
    //     @Body({
    //         destination: "id",
    //         schema: BaseController.id
    //     }) id: string,
    //     @Body({
    //         destination: "soundID",
    //         schema: BaseController.id
    //     }) soundID: string,
    // ) {
    //     return this.editById(
    //         id
    //         , {
    //             $pull: {
    //                 sounds: {
    //                     _id: soundID
    //                 }
    //             }
    //         })
    // }

}

const videoQueue = new VideoQueueController("/videoQueue", new VideoQueueRepository(), {
    insertSchema: z.object({
        src: BaseController.url,
        type : z.string().optional()
    })
})

export default videoQueue