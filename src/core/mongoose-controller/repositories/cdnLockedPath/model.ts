import { Document, Schema, Types, model } from "mongoose";



export default interface CDN_LockedPath extends Document {
    cdn : Types.ObjectId | string,
    paths : string[] 
}

const CDN_LockedPathSchema = new Schema({
    cdn :{
        type : Types.ObjectId,
        required : true,
        ref : "fileManagerConfig"
    },
    paths: {
        type: [String],
        required: true,
        default : []
    }
})

export const CDN_LockedPathModel = model<CDN_LockedPath>("cdn_locked_path", CDN_LockedPathSchema)
