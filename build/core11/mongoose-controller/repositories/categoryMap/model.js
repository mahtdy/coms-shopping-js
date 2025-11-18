"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryMapModel = void 0;
const mongoose_1 = require("mongoose");
var ObjectId = mongoose_1.Types.ObjectId;
const categoryMapSchema = new mongoose_1.Schema({
    lable: {
        type: String,
        required: true
    },
    language: {
        type: mongoose_1.Types.ObjectId,
        required: false
    },
    showTitle: {
        type: String,
        required: false
    },
    category: {
        type: ObjectId,
        required: true,
        ref: "category"
    },
    parent: {
        type: ObjectId,
        required: false,
        ref: "category"
    },
    ancestors: {
        type: [ObjectId],
        required: true,
        ref: "category"
    }
});
exports.CategoryMapModel = (0, mongoose_1.model)('categoryMap', categoryMapSchema);
