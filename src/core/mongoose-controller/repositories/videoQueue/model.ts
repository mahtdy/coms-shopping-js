import { Schema, model, Document, Types } from "mongoose"
import VideoConfig from "../videoConfig/model"
import { BasePage } from "../../basePage/model"

export interface ProccessResult extends Document {
    path: string,
    dimension: string,
    type: string
}

export default interface VideoQueue extends Document {
    src: string,
    result: ProccessResult[],
    status: VideoQueueStatus,
    error: any,
    subTitles: {
        title: string,
        sign: string,
        source: string,
        character: string,
        offset?: number,
        isdefault?: boolean
    }[],
    hardSub?: {
        title: string,
        sign: string,
        source: string,
        character: string,
        offset?: number,
    },
    locked?: boolean,
    id?: any,
    type?: string,
    aparat?: object,
    aparat_url?: string,
    youtube?: object,
    youtube_url?: string,
    config? :string | VideoConfig,
    screenshots? : string[],

    page ?: BasePage | string | Types.ObjectId,
    pageType ?: string


}

const proccessResultSchema = new Schema({
    path: {
        type: String,
        required: true
    },
    dimension: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    }
})

export enum VideoQueueStatus {
    "ready" = 0,
    "inQueue" = 1,
    "done" = 2,
    "failed" = 3,

}


const videoQueueSchema = new Schema({
    src: {
        type: String,
        required: true,
        unique: true
    },
    result: {
        type: [proccessResultSchema],
        required: true,
        default: []
    },
    error: {
        type: Object,
        required: true,
        default: {}
    },
    status: {
        type: Number,
        required: true,
        enum: VideoQueueStatus,
        default: VideoQueueStatus.ready
    },
    subTitles: {
        type: [
            new Schema({
                sign: {
                    type: String,
                    required: true
                },
                source: {
                    type: String,
                    required: true
                },
                hardSub: {
                    type: Boolean,
                    required: false
                },
                title: {
                    type: String,
                    required: true
                },
                character: {
                    type: String,
                    required: false,
                    default: "false"
                },
                offset: {
                    type: Number,
                    required: false
                },
                isdefault: {
                    type: Boolean,
                    required: false
                }
            })
        ],
        required: true,
        default: []
    },
    hardSub: {
        type: new Schema({
            sign: {
                type: String,
                required: true
            },
            source: {
                type: String,
                required: true
            },
            hardSub: {
                type: Boolean,
                required: false
            },
            title: {
                type: String,
                required: true
            },
            character: {
                type: String,
                required: false,
                default: "false"
            },
            offset: {
                type: Number,
                required: false
            },
        }),
    
        required: false,
    },
    screenshots: {
        type :[String],
        required : true,
        default :[]
    },
    aparat: {
        type: Object,
        required: false
    },
    aparat_url: {
        type: String,
        required: false
    },
    youtube: {
        type: Object,
        required: false
    },
    youtube_url: {
        type: String,
        required: false
    },

    config :{
        type: Types.ObjectId,
        required : false
    },

    type : {
        type: String,
        required : false
    },
    page : {
        type : Types.ObjectId,
        required : false,
        refPath : "pageType"
    },
    pageType : {
        type : String,
        required : false
    }
})



export const VideoQueueModel = model<VideoQueue>("videoQueue", videoQueueSchema)