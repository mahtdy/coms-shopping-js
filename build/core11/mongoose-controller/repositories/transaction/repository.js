"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../../repository"));
const model_1 = require("./model");
class TransactionRepository extends repository_1.default {
    constructor(options) {
        super(model_1.TransactionModel, options);
    }
    async confirmTransaction(id) {
        try {
            // await this.findById(id)
            let transaction = await this.findByIdAndUpdate(id, {
                status: "success",
                paidAt: new Date(),
                ispaid: true
            });
        }
        catch (error) {
            throw error;
        }
    }
    async rejectTransaction(id) {
        try {
            // let transaction = await this.findById(id)
            let transaction = await this.findByIdAndUpdate(id, {
                $set: {
                    status: "rejected",
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async rejectPaymentAllTransaction(paymentConfigId, session) {
        try {
            await this.updateMany({
                // status: "waiting"
                paymentConfig: paymentConfigId,
            }, {
                $set: {
                    status: "rejected",
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async cancelTransaction(id) {
        try {
            // let transaction = await this.findById(id)
            let transaction = await this.findByIdAndUpdate(id, {
                $set: {
                    status: "canceled",
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    /////////////////////////// check //////////////////////////
    async acceptCheck(id, session) {
        try {
            return await this.findByIdAndUpdate(id, {
                $set: {
                    status: "confirmed",
                }
            }, {
                // session ,
                runValidators: true
            });
            // let transaction = await this.findById(id)
        }
        catch (error) {
            throw error;
        }
    }
    async rejectCheck(id, session) {
        try {
            return await this.findByIdAndUpdate(id, {
                $set: {
                    status: "rejected",
                }
            }, {
                // session ,
                runValidators: true
            });
            // let transaction = await this.findById(id)
        }
        catch (error) {
            throw error;
        }
    }
    async editCheck(id, data, session) {
        try {
            // let transaction = await this.findById(id)
            let transaction = await this.findByIdAndUpdate(id, {
                $set: {
                    amount: data.amount,
                    deadline: data.deadline,
                    "info.number": data.number,
                    "info.saiadNumber": data.saiadNumber,
                    "info.bank": data.bank,
                    "info.branch": data.branch,
                }
            }, {
                runValidators: true,
                // session,
            });
        }
        catch (error) {
            throw error;
        }
    }
    async updateInstallment(id, data, session) {
        try {
            // let transaction = await this.findById(id)
            let transaction = await this.findByIdAndUpdate(id, {
                $set: {
                    "info.number": data.number,
                    "info.saiadNumber": data.saiadNumber,
                    "info.bank": data.bank,
                    "info.branch": data.branch,
                }
            }, {
                runValidators: true,
                // session,
            });
        }
        catch (error) {
            throw error;
        }
    }
    async changeCheckPlace(id, data, session) {
        var _a, _b;
        try {
            let q = {
                $set: {
                    placeType: data.placeType
                }
            };
            if (data.placeType == "in-bank") {
                q["$set"]["bankInfo"] = data.bankInfo;
                q["$set"]["bankAccount"] = (_a = data.bankInfo) === null || _a === void 0 ? void 0 : _a.account;
                q["$unset"] = {
                    spendInfo: 1,
                    chest: 1,
                    dein: 1
                };
            }
            else if (data.placeType == "spend") {
                q["$set"]["spendInfo"] = data.spendInfo;
                q["$unset"] = {
                    bankInfo: 1,
                    bankAccount: 1,
                    chest: 1,
                    dein: 1
                };
            }
            else if (data.placeType == "in-chest") {
                q["$set"]["chest"] = data.chestId;
                q["$unset"] = {
                    bankInfo: 1,
                    bankAccount: 1,
                    spendInfo: 1,
                    dein: 1
                };
            }
            else if (data.placeType == "dein") {
                q["$set"]["dein"] = data.dein;
                q["$set"]["bankAccount"] = (_b = data.dein) === null || _b === void 0 ? void 0 : _b.account;
                q["$unset"] = {
                    bankInfo: 1,
                    spendInfo: 1,
                    chest: 1
                };
            }
            await this.findByIdAndUpdate(id, q);
        }
        catch (error) {
            throw error;
        }
    }
    async checkPassed(id) {
        try {
            await this.updateOne({
                _id: id
            }, {
                $set: {
                    status: "success",
                    paidAt: new Date(),
                    ispaid: true
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    //////////////////////////  check //////////////////////////    
    ///////////////////////// cash //////////////////////////
    async acceptCash(id, type, idd, session) {
        try {
            let query = {
                status: "success",
                paidAt: new Date(),
                ispaid: true,
            };
            if (type == "bank") {
                query["bankAccount"] = idd;
            }
            else {
                query["chest"] = idd;
            }
            await this.findByIdAndUpdate(id, {
                $set: query
            });
        }
        catch (error) {
            throw error;
        }
    }
    async rejectCash(id) {
        try {
            // let transaction = await this.findById(id)
            let transaction = await this.findByIdAndUpdate(id, {
                $set: {
                    status: "rejected",
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async editCash(id, data, session) {
        try {
            // let transaction = await this.findById(id)
            let transaction = await this.findByIdAndUpdate(id, {
                $set: {
                    amount: data.amount,
                    deadline: data.deadline,
                }
            }, {
                runValidators: true,
                // session,
            });
        }
        catch (error) {
            throw error;
        }
    }
    ///////////////////////// cash //////////////////////////
    /////////////////////////  pos //////////////////////////
    async acceptPOS(id, session) {
        try {
            // let transaction = await this.findById(id)
            let transaction = await this.findByIdAndUpdate(id, {
                $set: {
                    status: "success",
                    paidAt: new Date(),
                    ispaid: true
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async rejectPOS(id) {
        try {
            // let transaction = await this.findById(id)
            let transaction = await this.findByIdAndUpdate(id, {
                $set: {
                    status: "rejected",
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async editPOS(id, data, session) {
        try {
            let transaction = await this.findByIdAndUpdate(id, {
                $set: {
                    amount: data.amount,
                    deadline: data.deadline,
                    "info.pos": data.pos,
                    "info.account": data.bank
                }
            }, {
                runValidators: true,
                // session,
            });
        }
        catch (error) {
            throw error;
        }
    }
    /////////////////////////  pos //////////////////////////
    /////////////////////////  transfer //////////////////////////
    async acceptTransfer(id, session) {
        try {
            // let transaction = await this.findById(id)
            let transaction = await this.findByIdAndUpdate(id, {
                $set: {
                    status: "success",
                    paidAt: new Date(),
                    ispaid: true
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async rejectTransfer(id) {
        try {
            // let transaction = await this.findById(id)
            let transaction = await this.findByIdAndUpdate(id, {
                $set: {
                    status: "rejected",
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async editTransfer(id, data, session) {
        try {
            let transaction = await this.findByIdAndUpdate(id, {
                $set: {
                    amount: data.amount,
                    deadline: data.deadline,
                    "info.destination": data.destination,
                    "info.source": data.source,
                    "info.code": data.code
                }
            }, {
                runValidators: true,
                // session,
            });
        }
        catch (error) {
            throw error;
        }
    }
}
exports.default = TransactionRepository;
