"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailConfigModel = void 0;
const mongoose_1 = require("mongoose");
var ObjectId = mongoose_1.Types.ObjectId;
var emailType;
(function (emailType) {
    emailType["smtp"] = "smtp";
    emailType["other"] = "other";
})(emailType || (emailType = {}));
const emailConfigSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true
    },
    host: {
        type: String,
        required: true
    },
    port: {
        type: Number,
        required: false
    },
    config: {
        type: Object,
        required: true
    },
    status: {
        type: Boolean,
        required: true
    },
    maker: {
        type: ObjectId,
        required: true,
        ref: "admin"
    },
    isDefault: {
        type: Boolean,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: emailType
    },
    protocolType: {
        type: String,
        required: true,
        enum: [
            "TLS", "SSL", "NonSecure"
        ]
    }
});
exports.EmailConfigModel = (0, mongoose_1.model)('emailConfig', emailConfigSchema);
