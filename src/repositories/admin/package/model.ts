import { Schema, model, Document, Types } from "mongoose";
import Courier from "../courier/model";

export default interface Package extends Document {
    recipientName: string;
    recipientPhone: string;
    destination: { lat: number; lng: number; address: string };
    status: "pending" | "assigned" | "in_transit" | "delivered";
    courier?: Types.ObjectId;
}

const packageSchema = new Schema<Package>(
    {
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
        courier: { type: Schema.Types.ObjectId, ref: "Courier" },
    },
    { timestamps: true }
);

// export default PackageModel = model<Package>("Package", packageSchema);
// export default PackageModel;
export const PackageModel = model<Package>("package", packageSchema);
