
import { Schema, Document, model, Types } from "mongoose";
import { BasePage } from "../../basePage/model";

export default interface ImageResult extends Document {
    source: string,
    isDeleted : boolean,
    isCompressed : boolean,
    imageLocation :  "main" | "in-content" | "in-content-template" |string,
    size: number,
    resolution: {
        width: number,
        height: number
    },
    cropingData?: { [x: string]: {
        x : number,
        y : number
    } },
    lastBuild: Date,
    results: {
        type: string,
        template: string,
        src: string
    }[],
    pageType: string,
    page: Types.ObjectId | string | BasePage,

}

const positionSchema = new Schema({
    x: { type: Number, required: true },
    y: { type: Number, required: true },
});

const imageResultSchema = new Schema({
    source: {
        type: String,
        required: true
    },
    isDeleted : {
        type : Boolean,
        required : true,
        default : false
    },
    isMainCompressed : {

    },
    imageLocation : {
        type : String,
        required : true
    },
    size: {
        type: Number,
        required: true
    },
    resolution: {
        type: new Schema({
            width: {
                type: Number
            },
            height: {
                type: Number
            }
        })
    },
    cropingData: {
        type: Map,
        of: positionSchema,
        required: false,
    },
    lastBuild: { type: Date, required: true, default: () => new Date() },
    results: {
        type: [new Schema({
            type: {
                type: String,
                required: true,
            },
            template: {
                type: String,
                required: true,
            },
            src: {
                type: String,
                required: true,
            },
        })],
    },
    pageType: { type: String, required: true },
    page: {
        type: Schema.Types.Mixed, // چون می‌تونه ObjectId یا BasePage یا string باشه
        required: true,
    },
})

export const ImageResultModel = model<ImageResult>("image-result", imageResultSchema)
