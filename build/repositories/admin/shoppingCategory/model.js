"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const model_1 = require("../../../core/mongoose-controller/basePage/model");
let schema = { ...model_1.basePageSchema };
const shoppingCategorySchema = new mongoose_1.Schema(Object.assign({
    features: {
        type: [
            new mongoose_1.Schema({
                featureId: {
                    type: mongoose_1.Types.ObjectId,
                    required: true,
                    ref: "feature",
                },
                isFilter: {
                    type: Boolean,
                    required: true,
                },
            }),
        ],
        required: true,
        default: [],
    },
    catId: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "category",
        unique: true,
    },
}, schema));
