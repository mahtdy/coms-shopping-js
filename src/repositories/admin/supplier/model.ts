import { Document, model, Schema } from "mongoose";

export interface Supplier extends Document {
    name: string;
    contact_info: string;
    address: string;
}

const supplierSchema = new Schema({
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

export const SupplierModel = model<Supplier>("supplier", supplierSchema);