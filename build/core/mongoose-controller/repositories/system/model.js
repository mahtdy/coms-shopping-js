"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemConfigModel = void 0;
const mongoose_1 = require("mongoose");
const uniqueValidator = require('mongoose-unique-validator');
const systemConfigSchema = new mongoose_1.Schema({
    key: {
        type: String,
        required: true,
        unique: true
    },
    value: {
        type: Object,
        required: true,
        validate: function (value) {
            if (this.type === "Number") {
                if (typeof value != typeof 0) {
                    throw new Error("اطلاعات وارد شده نامعتبر است");
                }
                if (this.max && value > this.max) {
                    throw new Error("اطلاعات وارد شده نامعتبر است");
                }
                if (this.min != undefined && value < this.min) {
                    throw new Error("اطلاعات وارد شده نامعتبر است");
                }
            }
            else if (this.type === "String") {
                if (typeof value != typeof "") {
                    throw new Error("اطلاعات وارد شده نامعتبر است");
                }
            }
            else if (this.type === "Boolean") {
                if (typeof value != typeof true) {
                    throw new Error("اطلاعات وارد شده نامعتبر است");
                }
            }
            else if (this.type === "Time") {
                if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
                    throw new Error("اطلاعات وارد شده نامعتبر است");
                }
            }
            else if (this.type === "Duretion") {
                if (!/(^([0-1]?[0-9]|2[0-3])h$)|(^([1-2]?[0-9]|[3-9])d$)|(^[1-9]m$)/.test(value)) {
                    throw new Error("اطلاعات وارد شده نامعتبر است");
                }
            }
            else if (this.type === "ObjectId") {
                if (!mongoose_1.Types.ObjectId.isValid(value)) {
                    throw new Error("اطلاعات وارد شده نامعتبر است");
                }
            }
        }
    },
    lable: {
        type: String,
        required: false,
    },
    type: {
        type: String,
        required: true,
        enum: [
            "Number",
            "String",
            "Object",
            "Time",
            "Duretion",
            "Boolean",
            "Array",
            "ObjectId"
        ]
    },
    enum: {
        type: [String],
        required: false
    },
    max: {
        type: Number,
        required: false,
        validate: async function (value) {
            if (typeof value != typeof this.value) {
                throw new Error("مقدار بیشینه نادرست است");
            }
        }
    },
    min: {
        type: Number,
        required: false,
        validate: async function (value) {
            if (typeof value != typeof this.value) {
                throw new Error("مقدار کمینه نادرست است");
            }
        }
    },
    unit: {
        type: String,
        required: false
    },
    description: {
        type: String,
        required: false
    },
    options: {
        type: [String],
        required: false
    }
});
systemConfigSchema.plugin(uniqueValidator, { message: "تکراری است {PATH} فیلد" });
exports.SystemConfigModel = (0, mongoose_1.model)("systemConfig", systemConfigSchema);
