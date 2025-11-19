import { Types, Schema, model, Document } from "mongoose";
import BaseUser from "../../../core/mongoose-controller/repositories/user/model";
import Product from "../product/model";
import Productwarehouse from "../productWarehouse/model";
import Basket from "../basket/model";
import Address from "../address/model";
import Package from "../package/model";
import { string } from "zod";

// const uniqueValidator = require("mongoose-unique-validator");
export default interface Order extends Document {
  user: string;
  orderList: {
    product: string | Product;
    productwarehouse: string | Productwarehouse;
    price: number;
    quantity: number;
  }[];
  totalCost: number;         // هزینه کل (خرید + جاری)
  totalPriceProducts: number; // قیمت کل محصولات
  address?: string | Address; // آدرس ارسال سفارش (اختیاری)
  package?: string | Package; // کامنت: بسته ارسالی (اختیاری)
  deliveryStatus?: "pending" | "preparing" | "assigned" | "in_transit" | "delivered" | "failed"; // کامنت: وضعیت ارسال
  createdAt: Date;
}

const orderSchema = new Schema({
  user: { type: Types.ObjectId, required: true, ref: "user" },
  orderList: [
    {
      product: { type: Types.ObjectId, required: true, ref: "product" },
      productwarehouse: { type: Types.ObjectId, required: true, ref: "Productwarehouse" },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
    },
  ],
  totalCost: { type: Number, required: true, default: 0 },
  totalPriceProducts: { type: Number, required: true, default: 0 },
  address: { type: Types.ObjectId, required: false, ref: "address" }, // آدرس ارسال سفارش
  package: { type: Types.ObjectId, required: false, ref: "package" }, // کامنت: بسته ارسالی
  deliveryStatus: { 
    type: String, 
    enum: ["pending", "preparing", "assigned", "in_transit", "delivered", "failed"],
    default: "pending"
  }, // کامنت: وضعیت ارسال
  createdAt: { type: Date, default: Date.now },
});

export const OrderModel = model<Order>("Order", orderSchema);