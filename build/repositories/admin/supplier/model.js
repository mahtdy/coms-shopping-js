"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplierModel = void 0;
const mongoose_1 = require("mongoose");
const supplierSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    contact_info: {
        type: String,
        required: false,
    },
    address: {
        type: String,
        required: false,
    },
});
exports.SupplierModel = (0, mongoose_1.model)("supplier", supplierSchema);
