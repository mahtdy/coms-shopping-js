
import { Schema, model, Document, Types, connection } from "mongoose";
var ObjectId = Types.ObjectId
import BaseUser from '../user/model'
import Department from '../department/model'
import { BaseAdmin } from '../admin/model'
// const autoIncrement = require("mongoose-auto-increment")

export enum Owner {
    "user" = "user",
    "admin" = "admin"
}

export enum TicketState {

    "open" = "باز",
    "inProccess" = "در حال انجام",
    "assigned" = "ارجاء شده",
    "answered" = "پاسخ داده شده",
    "closed" = "بسته شده",
    "userAnswered" = "پاسخ مشتری"

}

export default interface Ticket extends Document {
    notes?: string,
    importance: number,
    subject: string,
    ticketNumber: number,
    owner: string,
    date: Date,
    lastModified: Date,
    closeDate?: Date,
    user: BaseUser | string | Types.ObjectId,
    department: Department | string,
    state: "open" | "inProccess" | "assigned" | "answered" | "closed" | "userAnswered",
    stateNumber: number,
    messages: {
        text?: string,
        files?: {
            path: string,
            size: number,
        }[],
        from: string,
        date: Date,
        admin?: BaseAdmin | string,
        user?: BaseUser | string
        assignedAdmin?: BaseAdmin | string,
        assigner?: BaseAdmin | string,
        assignerDepartment?: Department | string,
        isAssigned?: boolean,
        isNote?: boolean,
        department?: Department | string,
    }[],
    lastMessage: string,
    starter: string,
    starterAdmin: BaseAdmin | string,
    admin?: BaseAdmin | string,
    admins: BaseAdmin[] | string[],
    feedback?: string,
    feedbackStar?: number
}

const ticketSchema = new Schema({
    notes: {
        type: String,
        required: false
    },
    importance: {
        type: "Number",
        required: true,
        max: 3,
        min: 1
    },
    subject: {
        type: String,
        required: true
    },
    ticketNumber: {
        type: "Number",
        required: false
    },
    owner: {
        type: String,
        required: true,
        // enum: Owner
    },
    date: {
        type: Date,
        required: true,
        default: () => {
            return Date.now()
        }
    },
    lastModified: {
        type: String,
        required: true,
        default: () => {
            return Date.now()
        }
    },
    closeDate: {
        type: String,
        required: false
    },
    user: {
        type: ObjectId,
        required: true,
        ref: "user"
    },
    department: {
        type: ObjectId,
        required: true,
        ref: "department"
    },
    state: {
        type: String,
        required: true,
        enum: ["open", "inProccess", "assigned", "answered", "closed", "userAnswered"],
        default: "open"
    },
    stateNumber: {
        type: "Number",
        required: true,
        default: () => {
            return 1
        }
    },
    messages: {
        type: [
            new Schema(
                {
                    text: {
                        type: String,
                        required: false
                    },
                    files: {
                        type: [new Schema(
                            {
                                path: {
                                    type: String,
                                    required: true
                                }, size: {
                                    type: "Number",
                                    required: true
                                },
                            }, { _id: false }
                        )],
                        required: false
                    },
                    from: {
                        type: String,
                        required: true,
                        // enum: Owner
                    },
                    date: {
                        type: Date,
                        required: true,
                        default: () => {
                            return Date.now()
                        }
                    },
                    admin: {
                        type: ObjectId,
                        required: false,
                        ref: "admin"
                    },
                    assignedAdmin: {
                        type: ObjectId,
                        required: false,
                        ref: "admin"
                    },
                    assigner: {
                        type: ObjectId,
                        required: false,
                        ref: "admin"
                    },
                    assignerDepartment: {
                        type: ObjectId,
                        required: false,
                        ref: "department"
                    },
                    isAssigned: {
                        type: Boolean,
                        required: false
                    },
                    isNote: {
                        type: Boolean,
                        required: false
                    },
                    department: {
                        type: ObjectId,
                        required: false,
                        ref: "department"
                    },
                }
            )],
        required: true
    },
    lastMessage: {
        type: String,
        required: true,
        // enum: Owner
    },
    starter: {
        type: String,
        required: true,
        // enum: Owner
    },
    starterAdmin: {
        type: ObjectId,
        required: false,
        ref: "admin"
    },
    admin: {
        type: ObjectId,
        required: false,
        ref: "admin"
    },
    admins: {
        type: [ObjectId],
        required: true,
        ref: "admin"
    },

    feedback: {
        type: String,
        required : false
    },
    feedbackStar: {
        type : Number,
        required : false,
        max : 5,
        min : 0
    }

})

// autoIncrement.initialize(connection);
// ticketSchema.plugin(autoIncrement.plugin, { model: 'ticket', field: 'ticketNumber', startAt: 100 })

export const TicketModel = model<Ticket>('ticket', ticketSchema)

