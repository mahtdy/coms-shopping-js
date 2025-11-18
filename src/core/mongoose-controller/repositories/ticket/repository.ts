
import Ticket, { TicketModel } from "./model";
import BaseRepositoryService, { RepositoryConfigOptions } from "../../repository";
import { FilterQuery } from "mongoose"
import ConfigService from "../../../../core/services/config";
import SystemConfigRepository from "../system/repository";


export default class TicketRepository extends BaseRepositoryService<Ticket> {
    systemConfigRepo : SystemConfigRepository
    constructor(options?: RepositoryConfigOptions) {
        super(TicketModel, options)
        this.systemConfigRepo = new SystemConfigRepository()

    }

    async insert(document: Ticket, options?: any): Promise<any> {
        let number = await this.getTicketNumber()
        document.ticketNumber = number + 1
        return super.insert(document)
    }

    async getCountByState(
        query: FilterQuery<Ticket> = {}
    ) {
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
            ])
        } catch (error) {
            throw error
        }
    }

    async getTicketNumber() {
        let number = await this.systemConfigRepo.getConfigValue("ticket-number")
        if (number == undefined) {
            await this.systemConfigRepo.insert({
                key: "ticket-number",
                value: 1001,
                lable: ConfigService.getConfig("projectName"),
                type: "Number"
            } as any)
            number = 1000
        }
        else {
            await this.systemConfigRepo.updateOne({
                key: "ticket-number",
            }, {
                $set: {
                    value: number + 1
                }
            })
        }
        return number + 1
    }
}
