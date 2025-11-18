"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasketModel = void 0;
const mongoose_1 = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const basketSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Types.ObjectId,
        require: true,
        ref: "user",
    },
    basketList: {
        type: [
            new mongoose_1.Schema({
                product: {
                    type: mongoose_1.Types.ObjectId,
                    require: true,
                    ref: "product",
                },
                productwarehouse: {
                    type: mongoose_1.Types.ObjectId,
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
exports.BasketModel = (0, mongoose_1.model)("basket", basketSchema);
