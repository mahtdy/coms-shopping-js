import { Document, Types,Schema, model } from "mongoose";



export default interface FakeComment extends Document {
    pageType : string,
    page : Types.ObjectId,
    status: "waiting" | "confirmed" | "rejected"
    text: string,
    userInfo: any,
    publishAt: Date,
    isPublished : boolean,
    cycle ?: Types.ObjectId,
    replies : number,

    replyAdmin?: Types.ObjectId | string,
    replyText?: string,
    replyPublishAt?: Date,
    replyCycle ?: Types.ObjectId,

    info : any
}


const fakeCommentSchema = new Schema({
    pageType : {
        type : String,
        required : true
    },
    page:{
        type : Types.ObjectId,
        required : true,
        refPath : "pageType"
    },
    status: {
        type : String,
        enum : ["waiting" , "confirmed" , "rejected"],
        default : "waiting"
    },
    text: {
        type: String,
        required: true
    },
    userInfo: {
        type: Schema.Types.Mixed, // To store any type of data
        required: true
    },
    publishAt: {
        type: Date,
        required: true
    },
    isPublished : {
        type : Boolean,
        required: false
    },
    cycle : {
        type: Types.ObjectId,
        required : false  
    },

    replies: {
        type: Number,
        required: true,
        default:0
    },

    replyAdmin: {
        type: Types.ObjectId, // Can be either ObjectId or string
        required: false
    },
    replyText: {
        type: String,
        required: false
    },
    replyPublishAt: {
        type: Date,
        required: false
    },
    replyCycle : {
        type: Types.ObjectId,
        required : false  
    },

    info : {
        type: Object,
        required : false
    }
})

export const FakeCommentModel = model<FakeComment>("fake-comment" , fakeCommentSchema)