"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserCategoryModel = void 0;
const mongoose_1 = require("mongoose");
var ObjectId = mongoose_1.Types.ObjectId;
const userCategorySchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true
    },
    isBasic: {
        type: Boolean,
        required: true,
        default: false
    }
});
exports.UserCategoryModel = (0, mongoose_1.model)('userCategory', userCategorySchema);
