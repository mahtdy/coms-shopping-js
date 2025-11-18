"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockListModel = void 0;
const mongoose_1 = require("mongoose");
const blockListSchema = new mongoose_1.Schema({
    ip: {
        type: String,
        required: false,
        validate: function (value) {
            // if (!IP.validateIP(value)) {
            //     throw new Error("آدرس آی پی نامعتبر است")
            // } 
        }
    },
    expireDate: {
        type: Date,
        required: true
    },
    id: {
        type: mongoose_1.Types.ObjectId,
        required: true
    },
    owner: {
        type: String,
        required: true,
        enum: ["user", "admin"]
    },
    step: {
        type: Number,
        required: true, default: 1
    }
});
exports.BlockListModel = (0, mongoose_1.model)("blockList", blockListSchema);
