"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../../repository"));
const model_1 = require("./model");
class PublishQueueRepository extends repository_1.default {
    constructor(options) {
        super(model_1.PublishQueueModel, options);
    }
    async deleteCategoryFromList(category, language, type) {
        // await this.
        await this.updateMany({
            language,
            type,
            categories: category
        }, {
            $pull: {
                categories: category
            }
        });
        let toPublishArticles = await this.findAll({
            $where: "this.categories.length == 0"
        });
    }
}
exports.default = PublishQueueRepository;
