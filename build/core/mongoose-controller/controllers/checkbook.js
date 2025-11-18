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
exports.CheckbookController = void 0;
const method_1 = require("../../decorators/method");
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/checkbook/repository"));
const zod_1 = require("zod");
const parameters_1 = require("../../decorators/parameters");
const insertSchema = zod_1.z.object({
    startNumber: zod_1.z.coerce.number(),
    endNumber: zod_1.z.coerce.number(),
    account: controller_1.default.id,
    pageCount: zod_1.z.coerce.number().int().positive(),
});
class CheckbookController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
    }
    async edit(id, data) {
        try {
            return this.editById(id, {
                $set: data
            });
        }
        catch (error) {
            throw error;
        }
    }
    async create(data) {
        return await super.create(data);
    }
    findById(id, queryInfo) {
        try {
            return this.findOne({
                _id: id,
            });
        }
        catch (error) {
            throw error;
        }
    }
}
exports.CheckbookController = CheckbookController;
__decorate([
    (0, method_1.Put)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        schema: insertSchema
    }))
], CheckbookController.prototype, "edit", null);
__decorate([
    (0, method_1.Post)("")
], CheckbookController.prototype, "create", null);
__decorate([
    (0, method_1.Get)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    }))
], CheckbookController.prototype, "findById", null);
const checkbook = new CheckbookController("/checkbook", new repository_1.default({
    population: [
        {
            path: "account",
            select: ["title"]
        }
    ]
}), {
    population: [{
            path: "account"
        }],
    insertSchema,
});
exports.default = checkbook;
