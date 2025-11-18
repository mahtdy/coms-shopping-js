"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderModel = void 0;
const mongoose_1 = require("mongoose");
const orderSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Types.ObjectId, required: true, ref: "user" },
    orderList: [
        {
            product: { type: mongoose_1.Types.ObjectId, required: true, ref: "product" },
            productwarehouse: { type: mongoose_1.Types.ObjectId, required: true, ref: "Productwarehouse" },
            price: { type: Number, required: true },
            quantity: { type: Number, required: true },
        },
    ],
    totalCost: { type: Number, required: true, default: 0 },
    totalPriceProducts: { type: Number, required: true, default: 0 },
    createdAt: { type: Date, default: Date.now },
});
exports.OrderModel = (0, mongoose_1.model)("Order", orderSchema);
