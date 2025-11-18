"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleApiTokenModel = void 0;
const mongoose_1 = require("mongoose");
const googleApiSchema = new mongoose_1.Schema({
    type: {
        type: String,
        required: true,
    },
    token: {
        type: Object,
        required: false
    },
    domains: {
        type: [mongoose_1.Types.ObjectId],
        required: true,
        default: []
    }
});
exports.GoogleApiTokenModel = (0, mongoose_1.model)("google-api-token", googleApiSchema);
