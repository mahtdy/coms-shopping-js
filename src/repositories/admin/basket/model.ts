import { Types, Schema, model, Document } from "mongoose";
import BaseUser from "../../../core/mongoose-controller/repositories/user/model";
import Product from "../product/model";
import Productwarehouse from "../productWarehouse/model";

const uniqueValidator = require("mongoose-unique-validator");

export default interface Basket extends Document {
  user: string | BaseUser;
  basketList: {
    price: number;
    product: string | Product;
    productwarehouse: string | Productwarehouse;
    quantity: number;
  }[];

  // config: object;
}
const basketSchema = new Schema({
  user: {
    type: Types.ObjectId,
    require: true,
    ref: "user",
  },
  basketList: {
    type: [
      new Schema({
        product: {
          type: Types.ObjectId,
          require: true,
          ref: "product",
        },
        productwarehouse: {
          type: Types.ObjectId,
          require: true,
          ref: "Productwarehouse",
        },

        price: {
          type: Number,
          require: true,
        },
        quantity: {
          type: Number,
          require: true,
        },
      }),
    ],
  },
});
//
export const BasketModel = model<Basket>("basket", basketSchema);
