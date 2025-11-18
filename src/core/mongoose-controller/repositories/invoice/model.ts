import { Document, model, Schema, Types } from "mongoose";
import { number } from "zod";
// import { AdsMonth } from "../ads/model";
import BaseUser from "../user/model";

export default interface Invoice extends Document {
    factorNumber : string,
    createdAt: Date,

    netPrice: number,
    totalPrice : number,
    finalPrice: number,
    tax: number ,
    paidPrice: number,

    totalPaidPrice : number,
    totalRemainedPrice : number,

    remainedPrice: number,
    waitForConfirmPrice : number,
    unrefinedPrice : number, 
    interest : number,
    penalty : number,

    paidAmount : number,
    shouldToPayAmount : number,
    
    
    
    discountId?: Types.ObjectId,
    discount?: Number
    paidAt?: Date,
    status: "expired" | "waiting" | "paid" | "canceled" | "paying",
    deadline ?: Date,
    paymentType ?: "installment" | "multi-stage" | "simple",
    attachments?: string[],
    prePay ?: number,
    ownerType : string,
    owner : Types.ObjectId | BaseUser
}
export const invoiceSchema = new Schema({
    factorNumber : {
        type: String,
        required : true,
    },
    createdAt: {
        type: Date,
        required: true,
        default:() => new Date(),
    },
    paymentType: {
        type: String,
        required : false,
        enum : ["installment" ,  "multi-stage", "simple" ]
    },
    netPrice: {
        type: Number,
        required: true,
    },
    totalPrice: {
        type: Number,
        required: true,
    },
    finalPrice: {
        type: Number,
        required: true,
    },
    tax: {
        type: Number,
        required: true,
    },
    paidPrice: {
        type: Number,
        required: true,
        default : 0
    },

    totalPaidPrice: {
        type: Number,
        required: true,
        default : 0
    },
    
    totalRemainedPrice: {
        type: Number,
        required: true
    },
    remainedPrice: {
        type: Number,
        required: true,
    },

    waitForConfirmPrice :{
        type : Number,
        required : true,
        default : 0
    },
    unrefinedPrice: {
        type: Number,
        required: true,
        default : 0
    },
    interest: {
        type: Number,
        required: true,
        default : 0
    },
    penalty: {
        type: Number,
        required: true,
        default : 0
    },
    discountId: {
        type: Types.ObjectId,
        required: false,
    },
    discount: {
        type: Number,
        required: false,
    },
    paidAt: {
        type: Date,
        required: false,
    },
    status: {
        type: String,
        required: true,
        enum: ["expired", "waiting", "paid", "canceled", "paying"],
        defualt : "waiting"
    },
    deadline : {
        type : Date,
        required: false
    },
    attachments: {
        type: [String],
        required: false,
    }, 
    ownerType:{
        type: String,
        required: true
    },
    owner: {
        type : Types.ObjectId,
        refPath : "ownerType"
    },

   
    

})

export const InvoiceModel = model<Invoice>("invoice", invoiceSchema)