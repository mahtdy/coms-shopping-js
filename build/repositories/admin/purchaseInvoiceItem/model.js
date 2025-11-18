"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseInvoiceItemModel = void 0;
const mongoose_1 = require("mongoose");
const purchaseInvoiceItemSchema = new mongoose_1.Schema({
    purchase_invoice_id: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "purchase_invoice",
    },
    variant_id: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "product_variant",
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    unit_purchase_price: {
        type: Number,
        required: true,
    },
    batch_number: {
        type: String,
        required: true,
    },
});
exports.PurchaseInvoiceItemModel = (0, mongoose_1.model)("purchase_invoice_item", purchaseInvoiceItemSchema);
