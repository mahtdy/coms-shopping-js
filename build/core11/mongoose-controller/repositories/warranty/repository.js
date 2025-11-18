"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../../repository"));
const repository_2 = __importDefault(require("../address/repository"));
const model_1 = require("./model");
class WarrantyRepository extends repository_1.default {
    constructor(options) {
        super(model_1.WarrantyModel, options);
        this.addressRepo = new repository_2.default();
    }
    async addWarrantor(warrantor, paymentId) {
        try {
            let address = await this.addressRepo.insert(warrantor.address);
            warrantor.address = address._id;
            let workAddrress = await this.addressRepo.insert(warrantor.workAddrress);
            warrantor.workAddrress = workAddrress._id;
            return this.insert({
                warrantor,
                paymentConfig: paymentId
            });
        }
        catch (error) {
            throw error;
        }
    }
    async editWarrantor(id, warrantor) {
        try {
            let currentwarrantor = await this.findById(id);
            if (currentwarrantor == null) {
                return;
            }
            if (currentwarrantor.warrantor.workAddrress == undefined) {
                let workAddrress = await this.addressRepo.insert(warrantor.workAddrress);
                warrantor.workAddrress = workAddrress._id;
            }
            else {
                await this.addressRepo.updateOne({
                    _id: currentwarrantor.warrantor.workAddrress
                }, {
                    $set: warrantor.workAddrress
                });
                warrantor.workAddrress = currentwarrantor.warrantor.workAddrress;
            }
            await this.addressRepo.updateOne({
                _id: currentwarrantor.warrantor.address
            }, {
                $set: warrantor.address
            });
            warrantor.address = currentwarrantor.warrantor.address;
            return this.updateOne({
                _id: id
            }, {
                $set: {
                    warrantor
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async addWarranty(id, data) {
        if (data.deedAddress != undefined) {
            if (data.deedAddress._id) {
                await this.addressRepo.updateOne({
                    _id: data.deedAddress._id
                }, {
                    $set: data.deedAddress
                });
                data.deedAddress = data.deedAddress._id;
            }
            else {
                let address = await this.addressRepo.insert(data.deedAddress);
                data.deedAddress = address._id;
            }
        }
        data.confirmed = false;
        return this.updateOne({
            _id: id
        }, {
            $set: data
        });
    }
    async rejectWarranty(id, rejectMessage) {
        try {
            await this.updateOne({
                _id: id
            }, {
                $set: {
                    isReject: true,
                    rejectMessage,
                    confirmed: false
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
}
exports.default = WarrantyRepository;
