"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../../repository"));
const repository_2 = __importDefault(require("../notificationConfig/repository"));
const model_1 = require("./model");
class NotificationTemplateRepository extends repository_1.default {
    constructor(options) {
        super(model_1.NotificationTemplateModel, options);
        this.configRepo = new repository_2.default();
    }
    async disableDefaultConfig(id) {
        try {
            // var template = 
            await this.updateMany({
                defaultNotificationConfig: id
            }, {
                $unset: {
                    defaultNotificationConfig: 1
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
            document.status = "waiting";
        }
        catch (error) {
            throw error;
        }
        return super.insert(document);
    }
    // async findByIdAndUpdate(id: string | Types.ObjectId, query: UpdateQuery<NotificationTemplate>): Promise<NotificationTemplate | null> {
    //     try {
    //         var template = await this.findById(id)
    //         var res = await this.findByIdAndUpdate(id, query)
    //         var templateAfter = await this.findById(id)
    //         return res
    //     } catch (error) {
    //         throw error
    //     }
    // }
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
exports.default = NotificationTemplateRepository;
