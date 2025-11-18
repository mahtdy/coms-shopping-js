import { Document, Schema, Types, model } from "mongoose";
import { BaseAdmin } from "../admin/model";
import FakeComment from "../fakeComment/model";

export default interface Comment extends Document {
    text: string,
    page: Types.ObjectId | string,
    module: string, 
    level : number,
    language: string,
    user: Types.ObjectId | string,
    userInfo?: object,
    reply?: Types.ObjectId | string,
    userReplied?: Types.ObjectId | string,
    atachment ?: string[],
    userInfoReplied?: any,
    replies: number,
    admin?: BaseAdmin | Types.ObjectId | string,
    adminReplied ?: Types.ObjectId | string,
    adminReply ?: boolean,
    create: Date,
    status: "confirmed" | "rejected" | "proccessing",
    like: number,
    dislike: number,
    reported ?: boolean,
    manual: boolean,
    manualId: Types.ObjectId | string | FakeComment,
    commentInfo :{
        ip : string,
        geo : any,
        os : string,
        browser : string
    }
    type : "question" | "comment"
    
}

const commentSchema = new Schema({
    text: {
        type: String
    },
    page: {
        type: Types.ObjectId,
        refPath: "module"
    },
    module: {
        type: String
    }, 
    level : {
        type: Number,
        required : true,
        default : 1
    },
    language: {
        type: Types.ObjectId
    },
    user: {
        type: Types.ObjectId,
        required: false,
        ref: "user"
    },
    userInfo: {
        type: Object,
        required: false
    },
    reply: {
        type: Types.ObjectId,
        required: false,
        ref: "comment"
    },
    userReplied: {
        type: Types.ObjectId,
        required: false,
        ref: "user"
    },
    userInfoReplied: {
        type: Object,
        required: false
    },
    create: {
        type: Date,
        default: () => {
            return new Date()
        }
    },
    status: {
        type: String,
        enum: ["confirmed", "rejected", "proccessing"],
        required: true,
        default: "proccessing"
    },
    like: {
        type: Number,
        default: 0
    },
    dislike: {
        type: Number,
        default: 0
    },
    replies: {
        type: Number,
        required: true,
        default:0
    },
    admin: {
        type: Types.ObjectId,
        requimanoalred: false,
        ref: "admin"
    },
    adminReplied: {
        type: Types.ObjectId,
        required: false,
        ref: "admin"
    },
    adminReply  :{
        type: Boolean,
        required : false
    },
    reported : {
        type: Boolean,
        required : false
    },
    atachment :{
        type: [String],
        required: false
    },
    manual : {
        type: Boolean,
        required : true,
        default : false
    },
    manualId: {
        type : Types.ObjectId,
        required : false,
        ref : "fake-comment"
    },
    commentInfo :{
        type : new Schema({
            ip : String,
            geo : Object,
            os : String,
            browser : String
        }),
        required: false
    },
    type : {
        type : String,
        required : true,
        enum : [ "question" , "comment"],
        default :"comment"
    }
})


export const CommentModel = model<Comment>("comment", commentSchema)