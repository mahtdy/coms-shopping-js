import { Document, Types } from "mongoose"
import Language from "../repositories/language/model"
import Category from "../repositories/category/model"
import Author from "../repositories/author/model"
import UserCategory from "../repositories/userCategory/model"
import VideoQueue, { VideoQueueModel } from "../repositories/videoQueue/model"
import { BaseAdmin } from "../repositories/admin/model"
import Template from "../repositories/template/model"
import { Schema } from "mongoose"
import SeoContent from "../repositories/content/model"
import PagePSI from "../repositories/psi/pagePSI/model"

export interface BasePage extends Document {
    id: Types.ObjectId,//
    title: string,//
    content?: string,
    summary?: string
    contents?: Content[]
    language?: Language | string,
    category: Category | string,
    categories: Category[] | string[],
    ancestors?: Category[] | string[],
    author?: Author | Types.ObjectId | string, //
    isPublished: boolean,
    publishDate?: Date,
    modifyDate: Date,
    insertDate: Date,
    commentStatus: boolean,
    commentShow: boolean,
    commentImportant: boolean,
    isDraft: boolean,
    fileUses: string[],
    commonQuestions: CommonQuestion[],
    // comments ?: FakeComment[],
    view: number,
    viewMode: "public" | "forUsers" | "private"
    viewCategory?: UserCategory | string,
    seo?: any,
    feedBack?: {
        yes?: number,
        no?: number,
        avrage_point?: number,
        total_feed?: number
    },

    resolutionConfig: {
        source: string,
        conf: any,
        deletePrevious ?: boolean,
        srcChanged ?: boolean
    },
    imageConfig?: any

    videos?: VideoQueue[] | string[],
    video?: VideoQueue | string,
    files?: string[],

    noIndex: boolean,

    questionOppened: "yes" | "no" | "private",
    question: any,
    imageProccessed: boolean,
    videoProccessed: boolean,
    publisher?: string | BaseAdmin,
    template?: string | Template,
    seoContent?: SeoContent | string,
    url?: string,
    social: {
        socialName: "twitter" | "facebook",
        title: string,
        description: string,
        image?: string
    }[],
    Refrences?: {
        title: string,
        url: string
    }[],
    contentNumber?: number,
    tags?: string[],
    contentLanguages?: {
        content: Types.ObjectId,
        language: Types.ObjectId
    }[],

    pagePsi?: Types.ObjectId | string | PagePSI,
    psiMobile?: number,
    psiDesktop?: number,
    psiAvreage?: number,

    contetnUpdateStart?: Date
    contetnUpdateEnd?: Date

    commentUpdateStart?: Date
    commentUpdateEnd?: Date

    commonQuestionUpdateStart?: Date
    commonQuestionUpdateEnd?: Date


    inboundInternalLinks: number,
    inboundExternalLinks: number,
    internalLinks: number,
    externalLinks: number,

    isCoreWebVitalPassed : boolean

    wordCount : number

}


export interface CommonQuestion {
    question: string,
    answer: string,
    publishAt: Date,
    cycle?: Types.ObjectId,
    _id: Types.ObjectId
}


export interface Content {
    status: boolean,
    type: string,
    content?: string,
    title?: string,
    publishAt?: Date,
    cycle?: Types.ObjectId,
    locked?: boolean,
    comments?: {
        text: string,
        admin: any,
        date: Date,
        reply?: Types.ObjectId
    }[],
    _id: Types.ObjectId,
    visible?: boolean,
    tem_items ?: any
}



const proccessedVideoSchema = new Schema({
    path: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    dimension: {
        type: String,
        required: false
    },
    size: {
        type: Number,
        required: true
    },
    basePath: {
        type: String,
        required: true
    }
})

const VideosSchema = new Schema({
    mainSrc: {
        type: String,
        required: true
    },
    result: {
        type: [proccessedVideoSchema],
        required: false
    },
    isProccessed: {
        type: Boolean,
        required: true,
        default: false
    },
    subTitles: {
        type: [new Schema({
            hard: {
                type: Boolean,
                required: false
            },
            src: {
                type: String,
                required: true
            },
            info: {
                type: Object,
                required: false
            }
        })],
        required: false
    },
})


export const contentSchema = {
    status: {
        type: Boolean,
        required: true,
        default: true
    },
    type: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: false
    },
    title: {
        type: String,
        required: false
    },
    publishAt: {
        type: Date,
        required: false
    },

    cycle: {
        type: Types.ObjectId,
        required: false,
        ref: "publish-cycle"
    },
    locked: {
        type: Boolean,
        required: false
    },
    comments: {
        type: [
            new Schema({
                text: {
                    type: String,
                    required: true
                },
                admin: {
                    type: Object,
                    required: true,
                },
                date: {
                    type: Date,
                    required: true
                },
                reply: {
                    type: String,
                    required: false
                }
            }),]
    },

    tem: {
        type: String
    },

    doc_subtitle: {
        type: String
    },

    doc_title: {
        type: String
    },
    tem_items : {
        type : Object,
        required : false
    },
    tem_title:{ 
        type : String
    },
    template_type :{
        type : String
    },
    temid : {
        type : String,
        required : false
    },
    imgsrc : {
        type : String
    },
    map_address:{
        type : String
    },
    map_lat:{
        type : Number
    },
    map_long:{
        type : Number
    },


}



export var basePageSchema = {
    content: {
        type: String,
        required: false,
        default: ""
    },
    summary: {
        type: String,
        required: false,
        default: ""
    },
    contents: {
        type: [new Schema(contentSchema)],
        required: false
    },

    language: {
        type: Types.ObjectId,
        required: false,
        ref: "language"
    },
    category: {
        type: Types.ObjectId,
        required: false,
        ref: "category"
    },
    categories: {
        type: [Types.ObjectId],
        required: true,
        ref: "category",
        default: []
    },
    ancestors: {
        type: [Types.ObjectId],
        required: false,
        ref: "category"
    },
    author: {
        type: Types.ObjectId,
        required: false,
        ref: "author"
    },
    isPublished: {
        type: Boolean,
        required: true,
        default: false
    },
    modifyDate: {
        type: Date,
        required: true,
        default: () => {
            return new Date()
        }
    },
    publishDate: {
        type: Date,
        required: false
    },
    insertDate: {
        type: Date,
        required: true,
        default: () => {
            return new Date()
        }
    },
    commentStatus: {
        type: Boolean,
        required: true,
        default: true
    },
    commentShow : {
        type: Boolean,
        required: true,
        default: false
    },
    commentImportant: {
        type: Boolean,
        required: true,
        default: false
    },
    noIndex: {
        type: Boolean,
        required: true,
        default: false
    },
    isDraft: {
        type: Boolean,
        required: true,
        default: true
    },
    fileUses: {
        type: [String],
        required: true,
        default: []
    },
    commonQuestions: {
        type: [new Schema({
            question: {
                type: String,
                required: true,
            },
            answer: {
                type: String,
                requierd: true
            },
            publishAt: {
                type: Date,
                required: false
            },
            cycle: {
                type: Types.ObjectId,
                required: false,
                ref: "publish-cycle"
            },

        })],
        required: false
    },
    view: {
        type: Number,
        required: true,
        default: false
    },
    viewMode: {
        type: String,
        required: true,
        enum: ["public", "forUsers", "private"],
        default: "public"
    },
    viewCategory: {
        type: Types.ObjectId,
        required: function () {
            return this.viewMode == "private"
        },
        ref: "userCategory"
    },
    seo: {
        type: Object,
        required: false
    },
    social: {
        type: Object,
        required: false
    },
    feedBack: {
        type: new Schema({
            yes: {
                type: Number,
                required: false
            },
            no: {
                type: Number,
                required: false
            },
            avrage_point: {
                type: Number,
                required: false
            },
            total_feed: {
                type: Number,
                required: false
            }
        }),

        required: false

    },
    questionOppened: {
        type: String,
        required: true,
        enum: ["yes", "no", "private"],
        default: "yes"
    },
    questions: {
        type: new Schema({
            question: {
                type: String,
                required: false
            },
            answer: {
                type: String,
                required: false
            },
            asker: {
                type: Types.ObjectId,
                ref: "user"
            }
        })
    },
    template: {
        type: Types.ObjectId,
        required: false,
        ref: "template"
    },
    imageProccessed: {
        type: Boolean,
        required: true,
        default: false
    },
    videoProccessed: {
        type: Boolean,
        required: true,
        default: false
    },
    publisher: {
        type: Types.ObjectId,
        required: false,
        ref: "admin"
    },
    videos: {
        type: [Types.ObjectId],
        required: false,
        ref: "videoQueue"
    },
    video: {
        type: Types.ObjectId,
        required: false,
        ref: "videoQueue"
    },
    seoContent: {
        type: Types.ObjectId,
        required: false,
        ref: "content"
    },
    url: {
        type: String,
        required: false
    },
    Refrences: {
        type: [new Schema({
            title: String,
            url: String
        })],
        required: false
    },
    tags: {
        type: [String],
        required: false
    },
    contentNumber: {
        type: Number,
        required: false
    },
    contentLanguages: {
        type: [new Schema({
            content: {
                type: Types.ObjectId,
                required: true,
                ref: "article"
            },
            language: {
                type: Types.ObjectId,
                required: true,
                ref: "language"
            }
        })],
        default: []
    },


    pagePsi: {
        type: Types.ObjectId,
        required: false,
        ref: "page-psi"
    },
    psiMobile: {
        type: Number,
        required: false
    },
    psiDesktop: {
        type: Number,
        required: false
    },
    psiAvreage: {
        type: Number,
        required: false
    },


    contetnUpdateStart: {
        type: Date,
        required: false
    },
    contetnUpdateEnd: {
        type: Date,
        required: false
    },

    commentUpdateStart: {
        type: Date,
        required: false
    },
    commentUpdateEnd: {
        type: Date,
        required: false
    },

    commonQuestionUpdateStart: {
        type: Date,
        required: false
    },
    commonQuestionUpdateEnd: {
        type: Date,
        required: false
    },


    resolutionConfig: {
        type: new Schema({
            source: {
                type: String,
                required: false
            },
            conf: {
                type: Object,
                required: false
            },
            // deletePrevious : {
            //     type: Boolean,
            //     required : false
            // },
            // srcChanged : {
            //     type: Boolean,
            //     required : false
            // }
            
        }, {
            _id: false
        }),
        required: true,
        default: {}
    },
    imageConfig: {
        type: Object,
        required: false,
        default: {}
    },



    inboundInternalLinks: {
        type: Number,
        required: true,
        default: 0
    },
    inboundExternalLinks: {
        type: Number,
        required: true,
        default: 0
    },
    internalLinks: {
        type: Number,
        required: true,
        default: 0
    },
    externalLinks: {
        type: Number,
        required: true,
        default: 0
    },
    isCoreWebVitalPassed : {
        type : Boolean,
        required : true,
        default : false
    },
    wordCount: {
        type: Number,
        required : false
    },

}

