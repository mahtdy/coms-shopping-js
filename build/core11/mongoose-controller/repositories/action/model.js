"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionModel = void 0;
const mongoose_1 = require("mongoose");
var actionSchema = new mongoose_1.Schema({
    url: {
        type: String,
        required: true
    },
    method: {
        type: String,
        enum: ["POST", "GET", "PUT", "DELETE"],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    partName: {
        type: String,
        required: true
    },
    subPartName: {
        type: String,
        required: false
    },
    partPersion: {
        type: String,
        required: true
    },
    subPartPersion: {
        type: String,
        required: false
    },
    description: {
        type: String,
        required: false
    },
    isMainGet: {
        type: Boolean,
        required: false
    }
});
exports.ActionModel = (0, mongoose_1.model)("action", actionSchema);
