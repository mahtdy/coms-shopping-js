"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaleInvoiceItemModel = void 0;
const mongoose_1 = require("mongoose");
const saleInvoiceItemSchema = new mongoose_1.Schema({
    sale_invoice_id: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "sale_invoice",
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
    unit_sale_price: {
        type: Number,
        required: true,
    },
    batch_number: {
        type: String,
        required: true,
    },
});
exports.SaleInvoiceItemModel = (0, mongoose_1.model)("saleInvoiceItem", saleInvoiceItemSchema);
