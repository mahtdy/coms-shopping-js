"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = require("./model");
const repository_1 = __importDefault(require("../../repository"));
const repository_2 = __importDefault(require("../content/repository"));
class CategoryRepository extends repository_1.default {
    constructor(options) {
        super(model_1.CategoryModel, options);
        this.contentRepo = new repository_2.default();
    }
    async paginate(query, limit, page, options) {
        try {
            if (options != undefined) {
                options = {};
                options.population = [{
                        path: "language",
                        select: ["title", "panelTitle", "sign"]
                    }];
            }
            let res = await super.paginate(query, limit, page, options);
            let lst = res.list;
            for (let i = 0; i < lst.length; i++) {
                lst[i].useage = await this.contentRepo.getcount({
                    category: lst[i]._id
                });
            }
            return res;
        }
        catch (error) {
            throw error;
        }
    }
}
exports.default = CategoryRepository;
