import { Document, model, Schema, Types } from "mongoose";
import Product from "../product/model";
import Warehouse from "../warehouse/model";
import Variant from "../productVariant/model";
const uniqueValidator = require("mongoose-unique-validator");
import ProductWarehouse from "../productWarehouse/model";
import productwarehouse from "../../../apps/admin/controllers/productwarehouse";
import {date} from "zod";
import {time} from "speakeasy";

export default interface Productwarehouse extends Document {
  warehouse: string | Warehouse;
  variant: string | Variant;
  product: string | Product;
  quantity: number;
  variantPrice: number;
  purchasePrice: number;
  price: number;
  minStockThreshold: number;
  batchNumber: string;
  lastUpdated: Date;
  config: object;
  // cost: number;
}

const productwarehouseSchema = new Schema({
  warehouse: {
    type: Types.ObjectId,
    require: true,
    ref: "warehouse",
  },
  variant: {
    type: Types.ObjectId,
    required: false,
    ref: "productVariant",
  },
  product: {
    type: Types.ObjectId,
    require: true,
    ref: "product",
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  variantPrice: {
    type: Number,
    required: true,
  },
  purchasePrice: {
    type: Number,
    required: true,
  },
  minStockThreshold: {
    type: Number,
    required: false,
    default: 10,
  },
  batchNumber: {
    type: String,
    required: true,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },

  config: {
    type: Object,
    require: false,
  },
  // cost: {
  //   type: Number,
  //   required: true,
  //   default: 0
  // },
});

productwarehouseSchema.plugin(uniqueValidator, {
  message: "{PATH} is duplicated",
});
export const ProductwarehouseModel = model<Productwarehouse>(
  "productwarehouse",
  productwarehouseSchema
);
