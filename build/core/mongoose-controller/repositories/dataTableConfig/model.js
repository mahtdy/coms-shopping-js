"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataTableConfigModel = void 0;
const mongoose_1 = require("mongoose");
var ObjectId = mongoose_1.Types.ObjectId;
const dataTableConfigSchema = new mongoose_1.Schema({
    lable: {
        type: String,
        required: true
    },
    dataTable: {
        type: String,
        required: true
    },
    config: {
        type: Object,
        required: true
    },
    admin: {
        type: ObjectId,
        required: true,
        ref: "admin"
    },
});
exports.DataTableConfigModel = (0, mongoose_1.model)('dataTableConfig', dataTableConfigSchema);
