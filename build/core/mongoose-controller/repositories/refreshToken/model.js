"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenModel = void 0;
const mongoose_1 = require("mongoose");
const refreshToken = new mongoose_1.Schema({
    refresh: {
        type: String,
        required: true
    },
    expire: {
        type: Date,
        required: true
    },
    admin: {
        type: mongoose_1.Types.ObjectId,
        required: true
    },
    tries: {
        type: Number,
        required: true,
        default: 0
    }
});
exports.RefreshTokenModel = (0, mongoose_1.model)("refreshToken", refreshToken);
