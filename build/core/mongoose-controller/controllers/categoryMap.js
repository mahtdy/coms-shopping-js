"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryMapController = void 0;
const repository_1 = __importDefault(require("../repositories/categoryMap/repository"));
const controller_1 = __importDefault(require("../controller"));
const parameters_1 = require("../../decorators/parameters");
const zod_1 = require("zod");
const method_1 = require("../../decorators/method");
const cache_1 = __importDefault(require("../../cache"));
const repository_2 = __importDefault(require("../repositories/language/repository"));
class CategoryMapController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.languageRepo = new repository_2.default();
    }
    initApis() {
    }
    async editByLable(lable, map, language) {
        try {
            return {
                status: 200,
                data: await this.repository.changeByLable(lable, map, language)
            };
        }
        catch (error) {
            throw error;
        }
    }
    async createByLable(lable, map, language) {
        try {
            // console.log("language",map )
            return {
                status: 200,
                data: await this.repository.changeByLable(lable, map, language)
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getByLable(lable, language) {
        try {
            // console.log("lable", lable)
            if (lable == "article") {
                lable = "content";
            }
            return {
                status: 200,
                data: await this.repository.getByLable(lable, language)
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getAllMaps(lable) {
        let data = await this.languageRepo.findAll({}, {
            projection: {
                title: 1,
                panelTitle: 1,
                sign: 1
            }
        });
        data = JSON.parse(JSON.stringify(data));
        for (let i = 0; i < data.length; i++) {
            data[i]["map"] = await this.repository.getByLable(lable, data[i]._id);
            // console.log(data[i]["map"] )
        }
        return {
            status: 200,
            data
        };
    }
    async searchInMap(lable, showTitle) {
        try {
            let r = await this.paginate(1, 10, {
                lable,
                showTitle: {
                    $regex: new RegExp(showTitle)
                }
            });
            return r;
        }
        catch (error) {
            console.log(error);
        }
    }
}
exports.CategoryMapController = CategoryMapController;
__decorate([
    (0, method_1.Put)(""),
    __param(0, (0, parameters_1.Body)({
        destination: "lable",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "map",
        schema: zod_1.z.array(controller_1.default.search)
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "language",
        schema: controller_1.default.id
    }))
], CategoryMapController.prototype, "editByLable", null);
__decorate([
    method_1.Log,
    (0, method_1.Post)(""),
    __param(0, (0, parameters_1.Body)({
        destination: "lable",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "map",
        schema: zod_1.z.array(controller_1.default.search)
    })),
    __param(2, (0, parameters_1.Body)({
        destination: "language",
        schema: controller_1.default.id
    }))
], CategoryMapController.prototype, "createByLable", null);
__decorate([
    method_1.Log,
    (0, method_1.Get)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "lable",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "language",
        schema: controller_1.default.id.optional()
    }))
], CategoryMapController.prototype, "getByLable", null);
__decorate([
    (0, method_1.Get)("es"),
    __param(0, (0, parameters_1.Query)({
        destination: "lable",
        schema: zod_1.z.string()
    }))
], CategoryMapController.prototype, "getAllMaps", null);
__decorate([
    (0, method_1.Get)("/search"),
    __param(0, (0, parameters_1.Query)({
        destination: "lable",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "showTitle",
        schema: zod_1.z.string()
    }))
], CategoryMapController.prototype, "searchInMap", null);
var categoryMap = new CategoryMapController("/categoryMap", new repository_1.default({
    cacheService: new cache_1.default("categoryMap")
}), {});
exports.default = categoryMap;
