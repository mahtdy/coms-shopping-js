import { Document, model, Schema, Types } from "mongoose";
import Invoice from "../invoice/model";
import BaseUser from "../user/model";
import Installment from "../installment/model";
import PaymentGateway from "../paymentGateway/model";

export interface Check {
    number: string,
    saiadNumber: string,
    bank: string,
    branch: string,
}

export default interface PaymentConfig extends Document {
    invoice: Invoice | Types.ObjectId | string,
    type: "installment" | "simple",

    payFor: "invoice" | "chargeAccount" | "chashBack" | "withdrawal" | "loan" | "installment" |"penalty",
    replacedFrom: Types.ObjectId | string | PaymentConfig
    replacedBy: Types.ObjectId | string | PaymentConfig

    penaltyFor ?: string,
    penaltyForPayment ?: Types.ObjectId | string ,

    installmentConfig?: {
        prePay: number,
        prePayDeadline?: Date,
        prePayCheck?: {
            number: string,
            saiadNumber: string,
            bank: string,
            branch: string
        },

        hasLateness: boolean,
        paidCount: number,
        paidAmount: number,
        remainedPrice: number,
        totalPrice: number,
        formula: "banking" | "market",
        count: number,
        period: number,
        interestRate: number,
        payType: "check" | "payGateWay" | "other",
        payStart: Date,
        checks?: {
            number: string,
            saiadNumber: string,
            bank: string,
            branch: string,
        }[],

        warranties?: (Types.ObjectId | string)[]

        prePayTransaction?: Types.ObjectId,
        lastInstallmentDeadline: Date,
        prePayPaid: boolean,
        havePenalty: boolean,

        installmentConfirmed: boolean,
        bankFees: number,
        bankFeesPaid: boolean,
        loanTemplate: string | Types.ObjectId,
        loanPeriod: string | Types.ObjectId,

        overdueAmount: number,
        overdueCount: number,
        penalty: number,

        nextStep: | "initialApproval"
        | "documentSubmission"
        | "guarantors"
        | "checks"
        | "finalApproval"
        | "rejected"
        | "completed",

        restPeriod : number   //دوره تنفس


    },

    exLoan?: {
        prePay: number,
        prePayDeadline?: Date,
        prePayCheck?: {
            number: string,
            saiadNumber: string,
            bank: string,
            branch: string
        },
        hasLateness: boolean,
        paidCount: number,
        paidAmount: number,
        remainedPrice: number,
        totalPrice: number,
        formula: "banking" | "market",
        count: number,
        period: number,
        interestRate: number,
        payType: "check" | "payGateWay" | "other",
        payStart: Date,
        checks?: Check[],
        warranties?: (Types.ObjectId | string)[]

        prePayTransaction?: Types.ObjectId,
        lastInstallmentDeadline: Date,
        prePayPaid: boolean,
        havePenalty: boolean,


        installmentConfirmed: boolean,
        bankFees: number,
        bankFeesPaid: boolean,
        loanTemplate: string | Types.ObjectId,
        loanPeriod: string | Types.ObjectId,


    },

    loanDeposited?: boolean,

    loanAttchments?: any,
    attachmentConfirmed?: boolean,

    payPort ?: Types.ObjectId | string | PaymentGateway,

    transaction?: Types.ObjectId,
    payType?: "payGateWay" | "cash" | "chashBack" | "withdrawal" | "transfer" | "wallet" | "check" | "pos" ,
    info?: {
        interestRate?: number,
        havePenalty?: boolean,

        number: string,
        saiadNumber: string,
        bank: string,
        branch: string,

        source: string,
        destination: Types.ObjectId,
        code: string,

        account: Types.ObjectId,
        pos: Types.ObjectId,

    },
    deadline?: Date,
    amount: number,
    realAmount?: number,
    status: "inproccess" | "finished" | "returned" | "arrived" | "ended" | "rejected" | "waiting" | "waitingForCancle" | "readyForCancle",
    rejectMessage?: string,
    code: string,
    submitCode: string,
    codeConfirmed: boolean,
    cancelConfirmed: boolean,
    trakingCode: string,
    owner: Types.ObjectId | BaseUser | string,
    ownerType: string,


    paidAmount: number,
    paidAt?: Date,


    bankAccount?: Types.ObjectId | string,
    chest?: Types.ObjectId,
    placeType?: "spend" | "in-bank" | "in-chest" | "dein",
    spendInfo?: {
        type: string,
        id: Types.ObjectId | string
    },
    bankInfo: {
        account: string
    },
    dein?: {
        drodownType: "percentage" | "static",
        volume: number,
        account: Types.ObjectId | string
    }


    penalty?: number,
    penaltypaid?: boolean

    installment ?: Types.ObjectId | Installment | string

    penaltyForget ?: boolean


}



const paymentConfigSchema = new Schema({
    createAt: {
        type: Date,
        required: true,
        default: () => {
            return new Date()
        }
    },
    invoice: {
        type: Types.ObjectId,
        required: false,
        ref: "invoice"
    },
    type: {
        type: String,
        enum: [
            "installment",
            "simple"
        ],
        required: true
    },
    payFor: {
        type: String,
        enum: [
            "invoice",
            "chargeAccount",
            "chashBack",
            "withdrawal",
            "loan",
            "installment",
            "penalty",
            "chashBack"
        ],
        default: "invoice",
        required: true
    },
    replacedFrom: {
        type: Types.ObjectId,
        required: false,
        ref: "payment-config",
    },
    replacedBy: {
        type: Types.ObjectId,
        required: false,
        ref: "payment-config",
    },

    payment : {
        type : Types.ObjectId,
        ref : "payment-config",
        required : false
    },


    loanAttchments: {
        type: Object,
        required: false
    },
    attachmentConfirmed: {
        type: Boolean,
        required: false
    },

    payPort : {
        type : Types.ObjectId,
        required : false,
        ref  :"payment-gateway"
    },
    


    installmentConfig: {
        type: new Schema({
            prePay: {
                type: Number,
                required: true
            },
            prePayDeadline: {
                type: Date,
                required: false
            },
            prePayTransaction: {
                type: Types.ObjectId,
                required: false,
                ref: "transaction"
            },
            formula: {
                type: String,
                enum: [
                    "banking",
                    "market"
                ],
                required: true
            },
            paidCount: {
                type: Number,
                required: true,
                default: 0
            },
            paidAmount: {
                type: Number,
                required: true,
                default: 0
            },
            hasLateness: {
                type: Boolean,
                required: true,
                default: false
            },

            remainedPrice: {
                type: Number,
                required: true
            },
            totalPrice: {
                type: Number,
                required: true
            },
            count: {
                type: Number,
                required: true
            },
            period: {
                type: Number,
                required: true
            },
            interestRate: {
                type: Number,
                required: true
            },
            payType: {
                type: String,
                enum: [
                    "check",
                    "payGateWay",
                    "other"
                ],
                required: false
            },
            lastInstallmentDeadline: {
                type: Date,
                required: false
            },
            prePayPaid: {
                type: Boolean,
                required: true,
                default: false
            },
            havePenalty: {
                type: Boolean,
                required: false
            },
            warranties: {
                type: [Types.ObjectId],
                required: false,
                ref: "installment-warranty"
            },



            bankFees: {
                type: Number,
                required: true,
                default: 0
            },
            bankFeesPaid: {
                type: Boolean,
                required: true,
                default: false
            },
            installmentConfirmed: {
                type: Boolean,
                required: true,
                default: false
            },

            loanTemplate: {
                type: Types.ObjectId,
                ref: "loan-template",
                required: false
            },
            loanPeriod: {
                type: Types.ObjectId,
                required: false
            },

            overdueAmount: {
                type: Number,
                required: true,
                default: 0
            },
            overdueCount: {
                type: Number,
                required: true,
                default: 0
            },
            penalty: {
                type: Number,
                required: true,
                default: 0
            },
            nextStep: {
                type: String,
                required: true,
                enum: [
                    "initialApproval",
                    "documentSubmission",
                    "checks",
                    "guarantors",
                    "finalApproval",
                    "rejected",
                    "completed"
                ],
                default: "initialApproval"
            },

            restPeriod : {
                type: Number,
                required : true,
                default : 0
            },  

            confirmedAt: {
                type: Date,
                required: false
            },
            depositAt: {
                type: Date,
                required: false
            },
            payStart: {
                type: Date,
                required: false
            }

        }),
        required: false
    },

    exLoan: {
        type: new Schema({
            prePay: {
                type: Number,
                required: true
            },
            prePayDeadline: {
                type: Date,
                required: false
            },
            prePayTransaction: {
                type: Types.ObjectId,
                required: false,
                ref: "transaction"
            },
            formula: {
                type: String,
                enum: [
                    "banking",
                    "market"
                ],
                required: true
            },
            paidCount: {
                type: Number,
                required: true,
                default: 0
            },
            paidAmount: {
                type: Number,
                required: true,
                default: 0
            },
            hasLateness: {
                type: Boolean,
                required: true,
                default: false
            },

            remainedPrice: {
                type: Number,
                required: true
            },
            totalPrice: {
                type: Number,
                required: true
            },
            count: {
                type: Number,
                required: true
            },
            period: {
                type: Number,
                required: true
            },
            interestRate: {
                type: Number,
                required: true
            },
            payType: {
                type: String,
                enum: [
                    "check",
                    "payGateWay",
                    "other"
                ],
                required: false
            },
            lastInstallmentDeadline: {
                type: Date,
                required: false
            },
            prePayPaid: {
                type: Boolean,
                required: true,
                default: false
            },
            havePenalty: {
                type: Boolean,
                required: false
            },
            warranties: {
                type: [Types.ObjectId],
                required: false,
                ref: "installment-warranty"
            },



            bankFees: {
                type: Number,
                required: true,
                default: 0
            },
            bankFeesPaid: {
                type: Boolean,
                required: true,
                default: false
            },
            installmentConfirmed: {
                type: Boolean,
                required: true,
                default: false
            },

            loanTemplate: {
                type: Types.ObjectId,
                ref: "loan-template",
                required: false
            },
            loanPeriod: {
                type: Types.ObjectId,
                required: false
            },
        }),
        required: false
    },

    loanDeposited: {
        type: Boolean,
        required: false
    },

    status: {
        type: String,
        enum: [
            "inproccess",
            "finished",
            "returned",
            "arrived",
            "ended",
            "rejected",
            "waiting",
            "waitingForCancle",
            "readyForCancle"

        ],
        default: "waiting",
        required: true
    },
    code: {
        type: String,
        required: false
    },
    submitCode: {
        type: String,
        required: false
    },
    codeConfirmed: {
        type: Boolean,
        required: false
    },
    cancelConfirmed: {
        type: Boolean,
        required: false
    },
    trakingCode: {
        type: String,
        required: false
    },
    rejectMessage: {
        type: String,
        required: false
    },
    owner: {
        type: Types.ObjectId,
        required: true,
        refPath: "ownerType"
    },
    ownerType: {
        type: String,
        required: true
    },
    transaction: {
        type: Types.ObjectId,
        required: false,
        ref: "transaction"
    },
    payType: {
        type: String,
        enum: [
            "payGateWay",
            "cash",
            "transfer",
            "chashBack",
            "withdrawal",
            "check",
            "pos",
            "wallet"
        ],
        required: false
    },
    info: {
        type: new Schema({
            interestRate: Number,
            havePenalty: Boolean,

            number: String,
            saiadNumber: String,
            bank: String,
            branch: String,

            source: String,
            destination: {
                type: Types.ObjectId,
                required: false,
                ref: "bank-account"
            },
            code: String,

            account: {
                type: Types.ObjectId,
                required: false,
                ref: "bank-account"
            },
            pos: {
                type: Types.ObjectId,
                required: false,
                ref: "pos-device"
            },

        }),
        required: false
    },
    deadline: {
        type: Date,
        required: false
    },
    amount: {
        type: Number,
        required: true
    },
    realAmount: {
        type: Number,
        required: false
    },
    paidAmount: {
        type: Number,
        required: true,
        default: 0
    },
    paidAt: {
        type: Date,
        required: false
    },

    bankAccount: {
        type: Types.ObjectId,
        required: false,
        ref: "bank-account"
    },
    chest: {
        type: Types.ObjectId,
        required: false,
        ref: "chest"
    },
    placeType: {
        type: String,
        enum: [
            "spend",
            "in-bank",
            "in-chest",
            "dein"
        ],
        required: false
    },
    spendInfo: {
        type: new Schema({
            type: {
                type: String,
                required: true
            },
            id: {
                type: Types.ObjectId,
                required: true,
                refPath: "spendInfo.type"
            }
        }),
        required: false
    },
    bankInfo: {
        type: new Schema({
            account: {
                type: Types.ObjectId,
                required: true,
                ref: "bank-account"
            },
        }),
        required: false
    },
    dein: {
        type: new Schema({
            drodownType: {
                type: String,
                enum: [
                    "percentage",
                    "static"
                ],
                required: true
            },
            volume: {
                type: Number,
                required: true
            },
            account: {
                type: Types.ObjectId,
                required: true,
                ref: "bank-account"
            }
        }),
        required: false,
    },



    penalty: {
        type: Number,
        required: true,
        default: 0
    },
    penaltypaid: {
        type: Boolean,
        required: false
    },

    installment : {
        type: Types.ObjectId ,
        required : false,
        ref : "installment"
    },

    penaltyForget : {
        type :Boolean,
        required :false
    }
})




export const PaymentConfigModel = model<PaymentConfig>("payment-config", paymentConfigSchema)