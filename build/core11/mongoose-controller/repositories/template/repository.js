"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../../repository"));
const model_1 = require("./model");
class TemplateRepository extends repository_1.default {
    constructor(options) {
        super(model_1.TemplateModel, options);
    }
    async insert(document, options) {
        try {
            const doc = await super.insert(document);
            if (doc.isDefault) {
                await this.updateMany({
                    isDefault: true,
                    _id: {
                        $ne: doc._id
                    }
                }, {
                    $set: {
                        isDefault: false
                    }
                });
            }
            return doc;
        }
        catch (error) {
            throw error;
        }
    }
    async findByIdAndUpdate(id, query) {
        try {
            const res = await super.findByIdAndUpdate(id, query);
            const curentDoc = await this.findById(id);
            if (curentDoc === null || curentDoc === void 0 ? void 0 : curentDoc.isDefault) {
                await this.updateMany({
                    isDefault: true,
                    _id: {
                        $ne: curentDoc._id
                    }
                }, {
                    $set: {
                        isDefault: false
                    }
                });
            }
            return res;
        }
        catch (error) {
            throw error;
        }
    }
    async findOneAndUpdate(query, queryData) {
        try {
            let res = await super.findOneAndUpdate(query, queryData);
            const curentDoc = await this.findById(res === null || res === void 0 ? void 0 : res._id);
            if (curentDoc === null || curentDoc === void 0 ? void 0 : curentDoc.isDefault) {
                await this.updateMany({
                    isDefault: true,
                    _id: {
                        $ne: curentDoc._id
                    }
                }, {
                    $set: {
                        isDefault: false
                    }
                });
            }
            return res;
        }
        catch (error) {
            throw error;
        }
    }
}
exports.default = TemplateRepository;
