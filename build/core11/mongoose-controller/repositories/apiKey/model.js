"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIKeyModel = exports.apiKeySchema = void 0;
const mongoose_1 = require("mongoose");
exports.apiKeySchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: true
    },
    creator: {
        type: String,
        required: true
    },
    expire: {
        type: Date,
        required: false
    },
    status: {
        type: Boolean,
        required: true
    },
    email: {
        type: String,
        required: false,
        unique: true
    },
    phone: {
        type: String,
        required: false,
        unique: true
    },
    ips: {
        type: [String],
        required: true,
        default: []
    },
    permission: {
        type: [
            new mongoose_1.Schema({
                partition: {
                    type: String,
                    required: false
                },
                type: {
                    type: String,
                    enum: ["any", "semi"],
                },
                ips: {
                    type: [String],
                    required: true,
                    default: []
                },
                permissionData: {
                    type: Object,
                    required: false
                }
            })
        ],
        default: false
    }
});
exports.APIKeyModel = (0, mongoose_1.model)("apikey", exports.apiKeySchema);
