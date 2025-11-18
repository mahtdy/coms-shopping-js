"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../../repository"));
const model_1 = require("./model");
class SeoDraftRepository extends repository_1.default {
    constructor(options) {
        super(model_1.SeoDraftModel);
    }
    async upsert(doc) {
        try {
            var query = {
                id: doc.id,
                type: doc.type,
                language: doc.language
            };
            if (doc.type == "category") {
                query['categoryLable'] = doc.categoryLable;
            }
            const current = await this.findOne(query);
            if (current != null)
                await this.replace({
                    _id: current._id
                }, doc);
            else
                await this.insert(doc, {
                    validateBeforeSave: false
                });
        }
        catch (error) {
            throw error;
        }
    }
}
exports.default = SeoDraftRepository;
