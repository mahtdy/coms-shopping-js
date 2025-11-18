
import { Schema, model, Document, Types } from "mongoose";
import Author from "../author/model";
import Category from "../category/model";
import RandomGenarator from "../../../random";
var ObjectId = Types.ObjectId

interface Query {
    sourceType: "direct" | "indirect",
    source?: string,
    sourceKey?: string,
    sortKey?: string,
    havelimit?: boolean,
    getData?: Function,
    key: string,
    sourceQueryOpration?: "$eq" | "$reg" | "$in" | "$gt" | "$lt"
    queryOpration: "$eq" | "$reg" | "$in" | "$gt" | "$lt"
}
export default interface Content extends Document {
    originalUrl: string,
    url: string,
    typeOfUrl: "withSign" | "withoutSign" | "custom"
    type: "article" | "category" | "author" | "product" | "static" | "landing",
    id: any,
    seoTitle: string,
    metaDescription: string,
    metaKeyWords: string[],
    metaTags: string[],
    mainKeyWord: string,
    keyWords: string[],
    isMainLang: boolean,
    isStatic: boolean,
    language?: string,
    category?: string | Category | Types.ObjectId,
    author?: string | Author | Types.ObjectId,
    categoryInfo?: any,
    authorInfo?: any,
    mainArticle?: string,
    categoryLable: string,
    social: {
        socialName: "twitter" | "facebook",
        title: string,
        description: string,
        image?: string
    }[],
    "canoncialAddress"?: string,
    "oldAddress"?: string,
    redirecturl?: string,
    redirect_status?: string,
    changefreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never",
    priority: number,
    view: number
    absoluteUrl: string,
    robotsConfig: any


    // isTemplate: boolean,
    // dataType: "complex" | "simple" | "paginate",
    // paginateOptions?: any,
    // queryData?: {
    //     queryType: "simple" | "array"
    //     key: string,
    //     havePaginate: boolean,
    //     source: string,
    //     query: Query | Query[]
    // }

}

const contentSchema = new Schema(
    {
        originalUrl: {
            type: String,
            required: true,
            default: ""
        },
        url: {
            type: String,
            required: true,
            unique: true
        },
        typeOfUrl: {
            type: String,
            required: false,
            enum: ["withSign", "withoutSign", "custom"]
        },
        type: {
            type: String,
            required: true,
            default: "article"
        },
        id: {
            type: String,
            required: false
        },
        seoTitle: {
            type: String,
            required: true,
        },
        metaDescription: {
            type: String,
            required: true,
        },
        metaKeyWords: {
            type: [String],
            required: true,
        },
        metaTags: {
            type: [String],
            required: true,
        },
        mainKeyWord: {
            type: String,
            required: true,
            default: () => {
                return RandomGenarator.generateHashStr(30)
            },
            unique: true
        },
        keyWords: {
            type: [String],
            required: false,
            // unique: true
        },
        isMainLang: {
            type: Boolean,
            required: true,
            default: true
        },
        isStatic: {
            type: Boolean,
            required: true,
            default: false
        },
        language: {
            type: String,
            required: false,
        },
        category: {
            type: Types.ObjectId,
            required: false
        },
        author: {
            type: Types.ObjectId,
            required: false
        },
        categoryInfo: {
            type: Object,
            required: false
        },
        authorInfo: {
            type: Object,
            required: false
        },
        mainArticle: {
            type: ObjectId,
            required: false
        },
        categoryLable: {
            type: String,
            required: false,
            // enum: [
            //     "content",
            //     "shopping"
            //     // + ...
            // ]
        },
        social: {
            type: [new Schema({
                socialName: {
                    type: String,
                    required: true,
                    enum: ["twitter", "facebook"]
                },
                title: {
                    type: String,
                    required: true
                },
                description: {
                    type: String,
                    required: true
                },
                image: {
                    type: String,
                    required: false
                }
            })],
            required: true,
            default: []
        },
        "canoncialAddress": {
            type: String,
            required: false
        },
        "oldAddress": {
            type: String,
            required: false
        },
        redirecturl: {
            type: String,
            required: false
        },
        redirect_status: {
            type: String,
            required: false
        },

        changefreq: { // change frequensy for sitemap
            type: String,
            required: true,
            default: "never"
        },
        priority: {// priority for sitemap
            type: Number,
            required: true,
            default: 0.5
        },
        view: {
            type: Number,
            required: true,
            default: 0
        },
        absoluteUrl: {
            type: String,
            required: true,
        },

        robotsConfig: {
            type: Object,
            required: false
        }
    }
)


export const ContentModel = model<Content>('content', contentSchema)

