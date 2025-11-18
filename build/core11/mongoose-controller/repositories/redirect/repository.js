"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = require("./model");
const repository_1 = __importDefault(require("../../repository"));
class RedirectRepository extends repository_1.default {
    constructor(options) {
        super(model_1.RedirectModel, options);
    }
    async insertMany(documents) {
        try {
            var query = [];
            for (let i = 0; i < documents.length; i++) {
                query.push({
                    from: documents[i].from,
                    to: documents[i].to
                });
            }
            var docs = await this.findAll({
                $or: query
            }, {}, []);
            var repetitive = {};
            for (let i = 0; i < docs.length; i++) {
                repetitive[docs[i].from + "*" + docs[i].to] = true;
            }
            documents = documents.filter((doc, i) => {
                if (repetitive[doc.from + "*" + doc.to]) {
                    return false;
                }
                return true;
            });
        }
        catch (error) {
            throw error;
        }
        return super.insertMany(documents);
    }
    async getRedirectBySource(source, sourceId) {
        return this.findOne({
            $or: [
                {
                    from: source,
                    fromStatic: true
                },
                {
                    from: sourceId,
                    fromStatic: false
                }
            ],
            status: true
        });
    }
}
exports.default = RedirectRepository;
