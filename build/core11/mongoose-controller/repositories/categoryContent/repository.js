"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../../basePage/repository"));
const model_1 = require("./model");
class CategoryContentRepository extends repository_1.default {
    constructor(options) {
        super({
            model: model_1.CategoryContentModel,
            typeName: "category",
            selectData: {
                type: 1,
                title: 1,
                mainImage: 1,
                author: 1,
                category: 1,
                publishDate: 1,
                insertDate: 1
            },
            sort: {
                "publishDate": {
                    show: "زمان انتشار"
                },
                "insertDate": {
                    show: "زمان انتشار"
                },
                "view": {
                    show: "بازدید"
                }
            },
            population: [
                {
                    path: "catID",
                },
                {
                    path: "language",
                },
            ]
        });
    }
}
exports.default = CategoryContentRepository;
