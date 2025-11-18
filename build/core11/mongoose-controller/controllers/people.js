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
exports.PeopleController = void 0;
const method_1 = require("../../decorators/method");
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/people/repository"));
const repository_2 = __importDefault(require("../repositories/address/repository"));
const zod_1 = require("zod");
const parameters_1 = require("../../decorators/parameters");
const model_1 = require("../repositories/address/model");
class PeopleController extends controller_1.default {
    constructor(path, repository, options) {
        super(path, repository, options);
        this.addressRepo = new repository_2.default();
    }
    async insertNewPeople(data) {
        try {
            if (data.address != undefined) {
                Object.assign(data.address, {
                    type: "people"
                });
                let address = await this.addressRepo.insert(data.address);
                // console.log(address ,data.address)
                data.address = address._id;
            }
            return await this.create(data);
        }
        catch (error) {
            throw error;
        }
    }
    async updatePeople(id, data) {
        try {
            let people = await this.repository.findById(id);
            if (people == null) {
                return {
                    status: 404
                };
            }
            if (people.address != undefined) {
                await this.addressRepo.findByIdAndUpdate(data.address, {
                    $set: data.address
                });
                delete data.address;
            }
            else if (data.address != undefined) {
                let address = await this.addressRepo.insert(data.address);
                data.address = address._id;
            }
            return this.editById(id, {
                $set: data
            });
        }
        catch (error) {
            throw error;
        }
    }
    initApis() {
        this.addRouteWithMeta("/search", "get", this.search.bind(this), controller_1.default.searcheMeta);
        this.addRoute("/search/list", "get", this.getSearchList.bind(this));
    }
}
exports.PeopleController = PeopleController;
__decorate([
    (0, method_1.Post)(""),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            nameAndFamily: zod_1.z.string(),
            email: controller_1.default.email.optional(),
            phone: controller_1.default.phone,
            address: model_1.addressSchema.optional(),
            isReal: zod_1.z.boolean().default(true),
            info: zod_1.z.any()
        }),
    }))
], PeopleController.prototype, "insertNewPeople", null);
__decorate([
    (0, method_1.Put)(""),
    __param(0, (0, parameters_1.Query)({
        schema: controller_1.default.id,
        destination: "id"
    })),
    __param(1, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            nameAndFamily: zod_1.z.string().optional(),
            email: controller_1.default.email.optional(),
            phone: controller_1.default.phone.optional(),
            address: model_1.addressSchema.optional(),
            isReal: zod_1.z.boolean().optional(),
            info: zod_1.z.any().optional()
        }),
    }))
], PeopleController.prototype, "updatePeople", null);
const people = new PeopleController("/people", new repository_1.default({
    population: [{
            path: "address"
        }]
}), {
    searchFilters: {
        nameAndFamily: ["reg", "eq"],
        email: ["reg", "eq"],
        phone: ["reg", "eq"],
        address: ["list", "eq"]
    },
    population: [{
            path: "address"
        }]
});
exports.default = people;
