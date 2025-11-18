"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PSI_Model = void 0;
const mongoose_1 = require("mongoose");
const psi_Schema = new mongoose_1.Schema({
    enabled: {
        type: Boolean,
        required: true
    },
    periodType: {
        type: String,
        required: false,
        enum: ["daily", "weekly", "monthly", "custom"]
    },
    periodConfig: {
        type: Object,
        required: false
    },
});
exports.PSI_Model = (0, mongoose_1.model)("psi", psi_Schema);
