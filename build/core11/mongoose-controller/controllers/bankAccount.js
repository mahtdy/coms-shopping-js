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
exports.BankAccountController = void 0;
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/bankAccount/repository"));
const zod_1 = require("zod");
const method_1 = require("../../decorators/method");
const parameters_1 = require("../../decorators/parameters");
const repository_2 = __importDefault(require("../repositories/address/repository"));
class BankAccountController extends controller_1.default {
    constructor(path, repository, options) {
        super(path, repository, options);
        this.addressRepo = new repository_2.default();
    }
    async create(data, ...params) {
        try {
            let address = data.address;
            address.type = "bank";
            const newAddress = await this.addressRepo.insert(address);
            data.address = newAddress._id;
            return await super.create(data);
        }
        catch (error) {
            throw error;
        }
        return {
            status: 200,
        };
    }
    findById(id, queryInfo) {
        if (queryInfo == undefined) {
            queryInfo = {};
        }
        if (queryInfo.population == undefined) {
            queryInfo.population = [];
        }
        queryInfo.population.push({
            path: 'address'
        });
        return super.findOne({
            _id: id,
        }, queryInfo);
    }
    async edit(id, bankAccountData) {
        try {
            let addressId = bankAccountData.address._id;
            console.log(addressId);
            if (addressId == undefined) {
                let address = bankAccountData.address;
                address.type = "bank";
                const newAddress = await this.addressRepo.insert(bankAccountData.address);
                bankAccountData.address = newAddress._id;
                console.log(newAddress, bankAccountData);
            }
            else {
                let address = bankAccountData.address;
                address.type = "bank";
                await this.addressRepo.updateOne({
                    _id: addressId
                }, {
                    $set: address
                });
                bankAccountData.address = addressId;
            }
            return await this.editById(id, {
                $set: bankAccountData
            }, {
                ok: true
            });
        }
        catch (error) {
            throw error;
        }
    }
    async delete(id, ...params) {
        try {
            let account = await this.repository.findById(id);
            if ((account === null || account === void 0 ? void 0 : account.canDelete) == false) {
                return {
                    status: 400,
                    message: "حذف امکان پذیر نمی باشد"
                };
            }
        }
        catch (error) {
            throw error;
        }
        return super.delete(id);
    }
    initApis() {
        super.initApis();
        this.addRouteWithMeta("/search", "get", this.search.bind(this), controller_1.default.searcheMeta);
        this.addRoute("es/search/list", "get", this.getSearchList.bind(this));
    }
}
exports.BankAccountController = BankAccountController;
__decorate([
    (0, method_1.Get)(""),
    __param(0, (0, parameters_1.Query)({ destination: "id", schema: controller_1.default.id }))
], BankAccountController.prototype, "findById", null);
__decorate([
    (0, method_1.Put)(""),
    __param(0, (0, parameters_1.Query)({ destination: "id", schema: controller_1.default.id })),
    __param(1, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            title: zod_1.z.string().optional(),
            isReal: zod_1.z.boolean().optional(),
            isOfficial: zod_1.z.boolean().optional(),
            enabled: zod_1.z.boolean().optional(),
            shaba: controller_1.default.shaba.optional(),
            card: controller_1.default.card.optional(),
            number: zod_1.z.string().optional(),
            address: controller_1.default.address,
            deinPossible: zod_1.z.boolean().default(false),
            maxDein: zod_1.z.coerce.number().int().positive().optional(),
            deinDrodown: zod_1.z.coerce.number().positive().optional(),
            deinExprie: zod_1.z.coerce.date().optional()
        })
    }))
], BankAccountController.prototype, "edit", null);
const bankAccount = new BankAccountController("/bank-account", new repository_1.default({
    population: [
        {
            path: 'address'
        }
    ]
}), {
    insertSchema: zod_1.z.object({
        title: zod_1.z.string(),
        isReal: zod_1.z.boolean().default(true),
        isOfficial: zod_1.z.boolean().default(true),
        shaba: controller_1.default.shaba,
        card: controller_1.default.card,
        number: zod_1.z.string(),
        type: zod_1.z.enum(["sell", "buy", "wallet"]).default("sell"),
        // createdAt : BaseController.date,
        bank: zod_1.z.string(),
        enabled: zod_1.z.boolean().default(true),
        owner: zod_1.z.string(),
        isTankhah: zod_1.z.boolean().default(false),
        address: controller_1.default.address,
        deinPossible: zod_1.z.boolean().default(false),
        maxDein: zod_1.z.number().optional(),
        deinDrodown: zod_1.z.number().optional(),
        deinExprie: zod_1.z.coerce.date()
    }),
    searchFilters: {
        title: ["reg", "eq"],
        enabled: ["eq"],
        isReal: ["eq"],
        isOfficial: ["eq"],
        isTankhah: ["eq"],
        _id: ["eq", "list"]
    }
});
exports.default = bankAccount;
