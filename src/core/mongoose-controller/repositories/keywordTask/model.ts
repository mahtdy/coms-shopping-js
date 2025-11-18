import { Document, Schema, Types, model } from "mongoose";
import { BaseAdmin } from "../admin/model";
import Keyword from "../keyword/model";
import { BasePage } from "../../basePage/model";


export interface Task {
    module: string,
    type: "checkKeywordInContents" | "checkKeywordsInContent" | "checkKeywordsInContents" |
    "checkKeywordsInComments" | "checkAllKeyWordsInComments" | "checkKeywordInComments" |
    "changeKeywordLinkInContents" | "changeKeywordLinkInComments" |
    "deleteKeywordLinkInContents" | "deleteKeywordLinkInComments"
    status: "pending" | "running" | "compeleted"
    count: number,
    proccessed: number,

}

export default interface KeywordTask extends Document {
    admin: BaseAdmin | Types.ObjectId | string,
    status: "waiting" | "running" | "loading" | "finished",
    tasks: Task[],

    tasksList: (
        "checkKeywordInContents" | "checkKeywordsInContent" | "checkKeywordsInContents" |
        "checkKeywordsInComments" | "checkAllKeyWordsInComments" | "checkKeywordInComments" |
        "changeKeywordLinkInContents" | "changeKeywordLinkInComments" |
        "deleteKeywordLinkInContents" | "deleteKeywordLinkInComments"
    )[]

    keyword?: Keyword | string | Types.ObjectId,
    keywords ?: (Keyword | string | Types.ObjectId)[],
    page?: BasePage | Types.ObjectId | string
    pageType?: string

}

const keywordTaskSchema = new Schema({
    admin: {
        type: Types.ObjectId,
        required: true,
        ref: "admin"
    },
    status: {
        type: String,
        required: true,
        enum: [
            "waiting",
            "loading",
            "running",
            "finished",
        ]
    },
    tasks: {
        type: [new Schema({
            module: {
                type: String,
                required: true
            },
            type: {
                type: String,
                enum: [
                    "checkKeywordInContents",
                    "checkKeywordsInContent",
                    "checkKeywordsInContents",
                    "checkKeywordInComments",
                    "checkKeywordsInComments",
                    "checkAllKeyWordsInComments",
                    "changeKeywordLinkInContents",
                    "changeKeywordLinkInComments",
                    "deleteKeywordLinkInContents",
                    "deleteKeywordLinkInComments"
                ],
                required: true
            },
            status: {
                type: String,
                enum: ["pending", "running", "compeleted"],
                required: true
            },
            count: {
                type: Number,
                required: true
            },
            proccessed: {
                type: Number,
                required: true
            }
        })],
        required: true,
        default: []
    },

    tasksList: {
        type: [String],
        enum: [
            "checkKeywordInContents",
            "checkKeywordsInContent",
            "checkKeywordsInContents",
            "checkKeywordInComments",
            "checkKeywordsInComments",
            "checkAllKeyWordsInComments",
            "changeKeywordLinkInContents",
            "changeKeywordLinkInComments",
            "deleteKeywordLinkInContents",
            "deleteKeywordLinkInComments"
        ],
        required: true
    },

    keyword: {
        type: Types.ObjectId,
        required: false,
        ref: "keyword"
    },
    keywords : {
        type: [Types.ObjectId],
        required: false,
        ref: "keyword"
    },
    page: {
        type: Types.ObjectId,
        required: false,
        refPath: "pageType"
    },
    pageType: {
        type: String,
        required: false
    }


})

export const KeywordTaskModel = model<KeywordTask>("keyword-task", keywordTaskSchema)