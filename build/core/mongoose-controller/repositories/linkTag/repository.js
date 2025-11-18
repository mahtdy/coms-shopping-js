"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = require("./model");
const random_1 = __importDefault(require("../../../random"));
const repository_1 = __importDefault(require("../../repository"));
class LinkTagRepository extends repository_1.default {
    constructor(options) {
        super(model_1.LinkTagModel, options);
    }
    async insert(document) {
        // await
        document.tag = await this.getValidTag();
        return super.insert(document);
    }
    async getValidTag() {
        try {
            var tag = "/tag_" + random_1.default.getUniqueId();
            var isExists = await this.isExists({
                tag
            });
            if (isExists) {
                return await this.getValidTag();
            }
            return tag;
        }
        catch (error) {
            throw error;
        }
    }
    async getLinkByTag(tag) {
        try {
            return this.findOne({
                tag
            });
        }
        catch (error) {
            throw error;
        }
    }
    async getLinksByTags(tags) {
        try {
            return this.findAll({
                tag: {
                    $in: tags
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async changeTagLink(tag, link) {
        try {
            return await this.findOneAndUpdate({
                tag
            }, {
                $set: {
                    link
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
}
exports.default = LinkTagRepository;
