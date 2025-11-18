import { Schema, Document, model, Types } from "mongoose";
import Keyword from "../keyword/model";
import { BasePage } from "../../basePage/model";


export default interface LinkEvent extends Document {
    date: Date,

    keyword: Types.ObjectId | string | Keyword,

    from: Types.ObjectId | string | BasePage;
    fromType: string;

    to: Types.ObjectId | string | BasePage;
    toType: string;

    part: "comment" | "content" | "summary" | "faq"
    subPartId ?: Types.ObjectId | string;

}

const linkEventSchema = new Schema({
    date: {
        type: Date,
        required: true,
        default: () => new Date()
    },

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
        required: true,
        refPath: "toType"
    },
    toType: {
        type: String,
        required: true
    },  

    part: {
        type: String,
        enum: [
            "comment",
            "content",
            "summary",
            "faq"
        ],
        required: true
    },
    subPartId:{
        type : Types.ObjectId,
        required : false,
    }
})


export const LinkEventModel = model<LinkEvent>("link-event", linkEventSchema)