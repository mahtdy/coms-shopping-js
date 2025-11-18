import { Document, model, Schema, Types } from "mongoose";
import Domain from "../domain/model";
import WaterMark from "../waterMarkConfig/model";


export default interface DomainImageConfig extends Document {
    domain: Types.ObjectId | Domain | string;
    lastUpdate: Date;

    "upload-path": {
        fileManager: string;
        path: string;
    };

    "valid-Suffix": string[];
    "nonConvert-Suffixs": string[];
    "image-addressing": "y-m-d" | "y-m" | "y" | "y-n" | "n" | "y-m-n";
    "make-phone-image": boolean;
    "phone-width": number;
    "auto-translate-image-name": boolean;
    "auto-submit-removal-image": boolean;


    "main-image-result-Suffixs": string[];
    "watermark-main": boolean;
    "main-watermark-config"?: Types.ObjectId | string | WaterMark;
    "main-remaked-compress": boolean;
    "main-remaked-compress-quality"?: number;
    "remove-main-image-src": boolean;
    "compress-main"?: boolean;
    "main-compress-quality"?: number;

    "show-big-image": boolean;

    "in-content-image-result-Suffixs": string[];
    "in-content-watermark": boolean;
    "in-content-watermark-config"?: Types.ObjectId | string | WaterMark;
    "in-content-compress": boolean;
    "in-content-compress-quality"?: number;
    "remove-in-content-main-image-src": boolean;
    "in-content-compress-main" : boolean;
    "in-content-compress-main-quality" : number;
    "show-in-content-main-image": boolean;

    "tempalte-image-result-Suffixs": string[];
    "template-compress": boolean;
    "template-compress-quality"?: number;

}

const domainImageSchema = new Schema({
    domain: {
        type: Types.ObjectId,
        required: true,
        ref: "domain"
    },
    lastUpdate : {
        type : Date,
        required : true,
        default : () => new Date()
    },


    "upload-path": {
        type: new Schema({
            fileManager: { type: String, required: true },
            path: { type: String, required: true },
        },{
            _id : false
        })
        , required: true
    },
    "valid-Suffix": [{ type: String, required: true }],
    // "image-result-Suffixs": [{ type: String, required: true }],
    "nonConvert-Suffixs": [{ type: String, required: true }],
    "image-addressing": {
        type: String,
        enum: ["y-m-d", "y-m", "y", "y-n", "n", "y-m-n"],
        required: true,
    },
    "make-phone-image": { type: Boolean, default: false },
    "phone-width": { type: Number, required: true },
    "auto-translate-image-name": { type: Boolean, required: true },

    "auto-submit-removal-image": { type: Boolean, required: true },





    // watermark: { type: Boolean, required: true },
    // "watermark-config": {
    //     type: Types.ObjectId,
    //     required: false,
    //     ref: "waterMark"
    // },
    // type: { type: String },
    "main-image-result-Suffixs": [{ type: String, required: true }],
    "watermark-main": { type: Boolean, required: true },
    "main-watermark-config": {
        type: Types.ObjectId,
        required: false,
        ref: "waterMark"
    },
    "main-remaked-compress": { type: Boolean, required: true },
    "main-remaked-compress-quality": { type: Number },
    "remove-main-image-src": { type: Boolean, required: true },
    "compress-main": { type: Boolean },
    "main-compress-quality": { type: Number },
    "show-big-image": { type: Boolean, required: true },


    // "in-content-remove-main-image-src" : {
    //     type : Boolean
    // }, 
    "in-content-image-result-Suffixs": [{ type: String, required: true }],
    "in-content-watermark": { type: Boolean, required: true },
    "in-content-watermark-config": {
        type: Types.ObjectId,
        required: false,
        ref: "waterMark"
    },
    "in-content-compress": {
        type: Boolean,
        required: true
    },
    "in-content-compress-quality": {
        type: Number
    },
    "remove-in-content-main-image-src": {
        type: Boolean,
        required: true
    },
    "in-content-compress-main" : {
        type : Boolean,
        required : false
    },
    "in-content-compress-main-quality" : {
        type : Number,
        required : false
    },
    "show-in-content-main-image": {
        type: Boolean,
        required: true
    },


    "tempalte-image-result-Suffixs": [{ type: String, required: true }],
    "template-compress": {
        type: Boolean,
        required: true
    },
    "template-compress-quality": {
        type: Number
    },
})


export const DomainImageConfigModel = model<DomainImageConfig>("domain-image-config", domainImageSchema)