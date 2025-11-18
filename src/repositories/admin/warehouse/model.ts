import { Document, model, Schema, Types } from "mongoose";
import BaseUser from "../../../core/mongoose-controller/repositories/user/model";
const uniqueValidator = require("mongoose-unique-validator");

export default interface Warehouse extends Document {
  title: string;
  description?: string;
  address?: string;
  phone: string;
  manager: string | BaseUser;
  capacity: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const warehouseSchema = new Schema({
  title: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: false,
    maxLength: 250,
    default: "digital warehouse",
  },
  address: {
    type: String,
    required: false,
    maxLength: 500,
    default: "tehran",
  },
  phone: {
    type: String,
    required: true,
    maxLength: 11,
    default: "09123334444",
  },
  manager: {
    type: Types.ObjectId,
    required: true,
    ref: "user",
  },
  capacity: {
    type: Number,
    required: true,
    default: 1000,
  },
  is_active: {
    type: Boolean,
    required: false,
    default: true,
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


warehouseSchema.plugin(uniqueValidator, { message: "{PATH} is duplicated" });
export const WarehouseModel = model<Warehouse>("warehouse", warehouseSchema);
