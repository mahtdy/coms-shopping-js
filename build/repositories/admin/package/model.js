"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageModel = void 0;
const mongoose_1 = require("mongoose");
const packageSchema = new mongoose_1.Schema({
    recipientName: String,
    recipientPhone: String,
    destination: {
        lat: Number,
        lng: Number,
        address: String,
    },
    status: {
        type: String,
        enum: ["pending", "assigned", "in_transit", "delivered"],
        default: "pending",
    },
    courier: { type: mongoose_1.Schema.Types.ObjectId, ref: "Courier" },
}, { timestamps: true });
// export default PackageModel = model<Package>("Package", packageSchema);
// export default PackageModel;
exports.PackageModel = (0, mongoose_1.model)("package", packageSchema);
