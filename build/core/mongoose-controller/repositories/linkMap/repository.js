"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../../repository"));
const model_1 = require("./model");
class LinkMapRepository extends repository_1.default {
    constructor(keywordRepo, options) {
        super(model_1.LinkMapModel, options);
        this.keywordRepo = keywordRepo;
    }
    async insert(document, options) {
        const newLinkMap = await super.insert(document);
        return newLinkMap;
    }
    async updateLinkIfNotExists(linkMap, part, linkData) {
        let c = linkMap[part];
        let finded = false;
        for (let i = 0; i < c.length; i++) {
            if (c[i].subPartId == linkData.subPartId) {
                linkData.isRejected = c[i].isRejected;
                c[i] == linkData;
                finded = true;
                break;
            }
        }
        if (!finded) {
            c.push(linkData);
        }
        let upQuery = {};
        upQuery[part] = c;
        await this.updateOne({
            _id: linkMap._id
        }, {
            $set: upQuery
        });
    }
    async deleteLinkFromMap(id, part, subPartId) {
        try {
            let upQuery = {};
            upQuery[part] =
                {
                    subPartId
                };
            await this.updateOne({
                _id: id
            }, {
                $pull: upQuery
            });
        }
        catch (error) {
            throw error;
        }
    }
}
exports.default = LinkMapRepository;
