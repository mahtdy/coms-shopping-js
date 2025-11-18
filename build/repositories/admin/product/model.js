"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductModel = void 0;
const mongoose_1 = require("mongoose");
const model_1 = require("../../../core/mongoose-controller/basePage/model");
let pschema = { ...model_1.basePageSchema };
const schema = Object.assign({
    title: String,
    price: Number,
    image: String,
    description: String,
    category: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "category",
    },
    addrresses: [
        new mongoose_1.Schema({
            f1: String,
        }, {
        // _id: false
        }),
    ],
    passportInfo: new mongoose_1.Schema({}, {
        _id: false,
    }),
    brand: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "brand",
    },
    features: {
        type: [
            new mongoose_1.Schema({
                id: mongoose_1.Types.ObjectId,
                values: [Object],
            }, {
                _id: false,
            }),
        ],
    },
}, pschema);
const productSchema = new mongoose_1.Schema(schema);
exports.ProductModel = (0, mongoose_1.model)("product", productSchema);
