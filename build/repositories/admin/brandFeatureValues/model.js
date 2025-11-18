"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrandFeatureValueModel = void 0;
const mongoose_1 = require("mongoose");
const brandFeatureValueSchema = new mongoose_1.Schema({
    title: {
        typee: String,
        reqired: true,
    },
    description: {
        type: String,
        required: false,
    },
    values: {
        type: [Object],
        required: true,
        default: [],
    },
});
exports.BrandFeatureValueModel = (0, mongoose_1.model)("brandFeatureValue", brandFeatureValueSchema);
