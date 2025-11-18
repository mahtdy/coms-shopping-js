"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseInvoiceModel = void 0;
const mongoose_1 = require("mongoose");
const purchaseInvoiceSchema = new mongoose_1.Schema({
    warehouse_id: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "warehouse",
    },
    supplier_id: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "supplier",
    },
    invoice_date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    total_amount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "canceled"],
        default: "pending",
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
});
exports.PurchaseInvoiceModel = (0, mongoose_1.model)("purchase_invoice", purchaseInvoiceSchema);
