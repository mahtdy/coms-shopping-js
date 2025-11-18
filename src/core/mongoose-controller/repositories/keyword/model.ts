import { Document, Schema, Types, model } from "mongoose";
import { BasePage } from "../../basePage/model";


export default interface Keyword extends Document {

    text: string,

    pirority: number,
    position: number,
    linksCount: number,
    pagesCount: number,
    isProccessed: boolean
    activePagesCount: number


    textCount: number,
    imageCount: number,

    contentCount: number
    commentCount: number
    faqCount: number
    summaryCount: number
    footerCount: number
    sidBarCount: number
    navBarCount: number
    headerCount: number


    noFlowCount: number
    flowCount: number

    page: Types.ObjectId | BasePage | string,
    pageType: string,

}


export const keywordSchema = new Schema({
    text: {
        type: String,
        required: true,
        unique: true
    },
    pirority: {
        type: Number,
        required: false,
        min: 1,
        max: 10
    },
    position: {
        type: Number,
        required: false,
    },
    linksCount: {
        type: Number,
        required: false
    },
    pagesCount: {
        type: Number,
        required: false
    },
    isProccessed: {
        type: Boolean,
        required: true,
        default: false
    },


    activePagesCount: { type: Number, required: true, default: 0 },
    textCount: { type: Number, required: true, default: 0 },
    imageCount: { type: Number, required: true, default: 0 },
    contentCount: { type: Number, required: true, default: 0 },
    commentCount: { type: Number, required: true, default: 0 },
    faqCount: { type: Number, required: true, default: 0 },
    summaryCount: { type: Number, required: true, default: 0 },
    footerCount: { type: Number, required: true, default: 0 },
    sidBarCount: { type: Number, required: true, default: 0 },
    navBarCount: { type: Number, required: true, default: 0 },
    headerCount: { type: Number, required: true, default: 0 },
    noFlowCount: { type: Number, required: true, default: 0 },
    flowCount: { type: Number, required: true, default: 0 },

    page: {
        type: Types.ObjectId,
        required: true,
        refPath: "pageType"
    },
    pageType: {
        type: String,
        required: true
    },

})



export const KeywordModel = model<Keyword>("keyword", keywordSchema)