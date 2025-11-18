"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsConfigModel = exports.SmsServices = void 0;
const mongoose_1 = require("mongoose");
var ObjectId = mongoose_1.Types.ObjectId;
var SmsServices;
(function (SmsServices) {
    SmsServices["kasbarg"] = "kasbarg";
    SmsServices["sms"] = "sms";
    SmsServices["sabapayamak"] = "sabapayamak";
    SmsServices["farapayamak"] = "farapayamak";
    SmsServices["payam-resan"] = "payam-resan";
    SmsServices["mediapayamak"] = "mediapayamak";
    SmsServices["kavenegar"] = "kavenegar";
    SmsServices["parsgreen"] = "parsgreen";
    SmsServices["hiro-sms"] = "hiro-sms";
    SmsServices["niksms"] = "niksms";
    SmsServices["smspanel"] = "smspanel";
    SmsServices["mellipayamak"] = "mellipayamak";
})(SmsServices || (exports.SmsServices = SmsServices = {}));
const smsConfigSchema = new mongoose_1.Schema({
    status: {
        type: Boolean,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    config: {
        type: Object,
        required: true
    },
    lineNumber: {
        type: String,
        required: true
    },
    id: {
        type: String,
        required: true,
        enum: SmsServices
    },
    isDefault: {
        type: Boolean,
        required: true,
        default: false
    },
    isOTP: {
        type: Boolean,
        required: true,
        default: false
    }
});
exports.SmsConfigModel = (0, mongoose_1.model)('smsConfig', smsConfigSchema);
