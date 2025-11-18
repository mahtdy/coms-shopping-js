import { Types, Schema, Document, model } from "mongoose";
import { BasePage } from "../../basePage/model";
import Keyword from "../keyword/model";

export interface LinkData {
    subPartId?: Types.ObjectId | string
    extraInfo: any;
    isActive: boolean;
    isWrong: boolean;
    isRejected ?: boolean,
    isProccessed ?: boolean
}
export default interface LinkMap extends Document {

    from: Types.ObjectId | string | BasePage;
    fromType: string;

    to: Types.ObjectId | string | BasePage;
    toType: string;

    keyword: string | Types.ObjectId | Keyword;


    contentLinks:LinkData[],
    summaryLinks:LinkData[]
    faqLinks: LinkData[]
    commentLinks: LinkData[]


}

const linkDataSchema = new Schema({
    subPartId: {
        type: Types.ObjectId,
        required: false,
    },
    extraInfo: {
        type: Schema.Types.Mixed,
        required: false
    },
    isActive: {
        type: Boolean,
        required: true,
        default: false
    },
    isWrong: {
        type: Boolean,
        required: true,
        default: false
    },
    isRejected: {
        type: Boolean,
        required: true,
        default: false
    },
    isProccessed : {
        type: Boolean,
        required : true,
        default : false
    }
})

const linkMapSchema = new Schema({
    from: {
        type: Types.ObjectId,
        required: true,
        refPath: "fromType"
    },
    fromType: {
        type: String,
        required: true
    },

    to: {
        type: Types.ObjectId,
        required: false,
        refPath: "toType"
    },
    toType: {
        type: String,
        required: false
    },

    keyword: {
        type: Types.ObjectId,
        required: true,
        ref: "keyword"
    },


    contentLinks: {
        type: [linkDataSchema],
        required: true,
        default: []
    },

    summaryLinks: {
        type: [linkDataSchema],
        required: true,
        default: []
    },
    faqLinks: {
        type: [linkDataSchema],
        required: true,
        default: []
    },
    commentLinks: {
        type: [linkDataSchema],
        required: true,
        default: []
    },


})


export const LinkMapModel = model<LinkMap>("linkMap", linkMapSchema);