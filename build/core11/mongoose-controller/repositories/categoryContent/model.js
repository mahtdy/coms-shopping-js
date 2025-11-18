"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryContentModel = void 0;
const mongoose_1 = require("mongoose");
const model_1 = require("../../basePage/model");
let schema = { ...model_1.basePageSchema };
const categoryContentSchema = new mongoose_1.Schema(Object.assign(schema, {
    catID: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "category"
    },
    title: {
        type: String,
        required: true
    },
    mainImage: {
        type: String,
        required: false
    },
    summary: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: false
    },
    module: {
        type: String,
        default: "categoryContent"
    }
}));
exports.CategoryContentModel = (0, mongoose_1.model)("categoryContent", categoryContentSchema);
