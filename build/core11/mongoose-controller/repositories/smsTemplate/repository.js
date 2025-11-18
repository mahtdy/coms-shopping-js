"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = require("./model");
const repository_1 = __importDefault(require("../../repository"));
const repository_2 = __importDefault(require("../smsConfig/repository"));
const smsMessager_1 = __importDefault(require("../../../messaging/smsMessager"));
class SmsTemplateRepository extends repository_1.default {
    constructor(options) {
        super(model_1.SmsTemplateModel, options);
        this.configRepo = new repository_2.default();
    }
    async disableDefaultConfig(id) {
        try {
            // var template = 
            await this.updateMany({
                defaultSmsConfig: id
            }, {
                $unset: {
                    defaultSmsConfig: 1
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async insert(document) {
        try {
            document.isCore = false;
            if (document.sendOTP) {
                document.id = await smsMessager_1.default.addTemplate({
                    template: document,
                    text: document.text
                });
            }
            if (document.defaultSmsConfig) {
                var otp = await this.configRepo.getOTP();
                if ((otp === null || otp === void 0 ? void 0 : otp._id) == document.defaultSmsConfig) {
                    document.id = await smsMessager_1.default.addTemplate({
                        template: document,
                        text: document.text
                    });
                }
            }
            document.status = "waiting";
        }
        catch (error) {
            throw error;
        }
        return super.insert(document);
    }
    async findByIdAndUpdate(id, query) {
        try {
            var template = await this.findById(id);
            var res = await super.findByIdAndUpdate(id, query);
            var templateAfter = await this.findById(id);
            if (templateAfter === null || templateAfter === void 0 ? void 0 : templateAfter.sendOTP) {
                if (templateAfter === null || templateAfter === void 0 ? void 0 : templateAfter.id) {
                    if ((template === null || template === void 0 ? void 0 : template.text) != templateAfter.text)
                        await smsMessager_1.default.editTemplate({
                            template: templateAfter,
                            text: templateAfter.text
                        });
                }
                else {
                    var tid = await smsMessager_1.default.addTemplate({
                        template: templateAfter,
                        text: templateAfter.text
                    });
                    await this.updateOne({
                        _id: id
                    }, {
                        $set: {
                            id: tid
                        }
                    });
                }
            }
            var otp = await this.configRepo.getOTP();
            if ((templateAfter === null || templateAfter === void 0 ? void 0 : templateAfter.defaultSmsConfig) && (templateAfter === null || templateAfter === void 0 ? void 0 : templateAfter.defaultSmsConfig) != (otp === null || otp === void 0 ? void 0 : otp._id)) {
                if (templateAfter === null || templateAfter === void 0 ? void 0 : templateAfter.id) {
                    if ((template === null || template === void 0 ? void 0 : template.text) != templateAfter.text)
                        await smsMessager_1.default.editTemplate({
                            template: templateAfter,
                            text: templateAfter.text
                        });
                }
                else {
                    var tid = await smsMessager_1.default.addTemplate({
                        template: templateAfter,
                        text: templateAfter.text
                    });
                    await this.updateOne({
                        _id: id
                    }, {
                        $set: {
                            id: tid
                        }
                    });
                }
            }
            return res;
        }
        catch (error) {
            throw error;
        }
    }
    async deleteById(id) {
        if (await this.isExists({
            _id: id,
            isCore: true
        })) {
            throw new Error("قالب اصلی قابل حذف نیست ");
        }
        return super.deleteById(id);
    }
    async confirmTemplate(id) {
        try {
            var template = await this.findById(id);
            let status;
            if (template === null || template === void 0 ? void 0 : template.sendOTP) {
                status = await smsMessager_1.default.getTemplateStatus((template === null || template === void 0 ? void 0 : template.id) || 0);
            }
            if (template === null || template === void 0 ? void 0 : template.defaultSmsConfig) {
                var otp = await this.configRepo.getOTP();
                if ((otp === null || otp === void 0 ? void 0 : otp._id) == template.defaultSmsConfig) {
                    status = await smsMessager_1.default.getTemplateStatus((template === null || template === void 0 ? void 0 : template.id) || 0);
                }
            }
            if (status !== undefined && status !== 1) {
                throw new Error("این الگو را نمی توان تایید کرد");
            }
            return this.updateOne({
                _id: id
            }, {
                $set: {
                    status: "active"
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async rejectedTemplate(id) {
        return this.updateOne({
            _id: id
        }, {
            $set: {
                status: "inactive"
            }
        });
    }
}
exports.default = SmsTemplateRepository;
