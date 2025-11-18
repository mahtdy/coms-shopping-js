"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureModel = void 0;
const mongoose_1 = require("mongoose");
const featureSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: false
    },
    values: {
        type: [Object],
        required: true,
        default: []
    }
});
exports.FeatureModel = (0, mongoose_1.model)("feature", featureSchema);
