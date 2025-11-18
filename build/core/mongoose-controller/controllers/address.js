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
exports.AddressController = void 0;
const controller_1 = __importDefault(require("../controller"));
const model_1 = require("../repositories/address/model");
const repository_1 = __importDefault(require("../repositories/address/repository"));
const method_1 = require("../../decorators/method");
const parameters_1 = require("../../decorators/parameters");
// import { RepositoryConfigOptions } from "../repository";
class AddressController extends controller_1.default {
    editAddress(id, data) {
        return this.editById(id, {
            $set: data
        }, {
            ok: true
        });
    }
    constructor(options) {
        super("/address", new repository_1.default(), options);
    }
}
exports.AddressController = AddressController;
__decorate([
    (0, method_1.Put)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "id",
        schema: controller_1.default.id
    })),
    __param(1, (0, parameters_1.Body)({
        schema: model_1.addressSchema
    }))
], AddressController.prototype, "editAddress", null);
const address = new AddressController({
    insertSchema: model_1.addressSchema
});
exports.default = address;
