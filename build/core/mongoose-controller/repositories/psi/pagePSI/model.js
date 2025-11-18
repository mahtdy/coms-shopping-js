"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PagePSI_Model = void 0;
const mongoose_1 = require("mongoose");
const pagePSISchema = new mongoose_1.Schema({
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
    mobileJson: {
        type: Object,
        required: true
    },
    desktopJson: {
        type: Object,
        required: true
    }
});
exports.PagePSI_Model = (0, mongoose_1.model)("page-psi", pagePSISchema);
