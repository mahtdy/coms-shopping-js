"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PSI_LogModel = void 0;
const mongoose_1 = require("mongoose");
const psi_LogSchema = new mongoose_1.Schema({
    id: {
        type: mongoose_1.Types.ObjectId,
        required: true
    },
    module: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    mobileInfo: {
        type: Object,
        required: false
    },
    desktopInfo: {
        type: Object,
        required: false
    }
});
exports.PSI_LogModel = (0, mongoose_1.model)("psi-log", psi_LogSchema);
