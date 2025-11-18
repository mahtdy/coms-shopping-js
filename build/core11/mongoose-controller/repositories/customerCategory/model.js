"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerCategoryModel = void 0;
const mongoose_1 = require("mongoose");
var ObjectId = mongoose_1.Types.ObjectId;
const customerCategorySchema = new mongoose_1.Schema({
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
exports.CustomerCategoryModel = (0, mongoose_1.model)('customerCategory', customerCategorySchema);
