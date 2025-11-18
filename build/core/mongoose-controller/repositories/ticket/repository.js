"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = require("./model");
const repository_1 = __importDefault(require("../../repository"));
const config_1 = __importDefault(require("../../../../core/services/config"));
const repository_2 = __importDefault(require("../system/repository"));
class TicketRepository extends repository_1.default {
    constructor(options) {
        super(model_1.TicketModel, options);
        this.systemConfigRepo = new repository_2.default();
    }
    async insert(document, options) {
        let number = await this.getTicketNumber();
        document.ticketNumber = number + 1;
        return super.insert(document);
    }
    async getCountByState(query = {}) {
        try {
            return await this.collection.aggregate([{
                    $match: query
                },
                {
                    $group: {
                        _id: "$state",
                        count: {
                            $sum: 1
                        }
                    }
                }
            ]);
        }
        catch (error) {
            throw error;
        }
    }
    async getTicketNumber() {
        let number = await this.systemConfigRepo.getConfigValue("ticket-number");
        if (number == undefined) {
            await this.systemConfigRepo.insert({
                key: "ticket-number",
                value: 1001,
                lable: config_1.default.getConfig("projectName"),
                type: "Number"
            });
            number = 1000;
        }
        else {
            await this.systemConfigRepo.updateOne({
                key: "ticket-number",
            }, {
                $set: {
                    value: number + 1
                }
            });
        }
        return number + 1;
    }
}
exports.default = TicketRepository;
