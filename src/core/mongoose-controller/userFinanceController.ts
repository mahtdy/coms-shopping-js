import Controller from "../controller";
import { Get, Post } from "../decorators/method";
import { Body, Query, User } from "../decorators/parameters";
import { UserInfo } from "./auth/user/userAuthenticator";
import BaseController from "./controller";
import FinanceService from "./financeService";
import Invoice from "./repositories/invoice/model";
import PaymentConfig from "./repositories/paymentConfig/model";
import { checkConfig, transferSchema } from "./controllers/invoice";
import PaymentConfigPreTextRepository from "./repositories/paymentConfigPreText/repository";

import { ZodSchema, z } from "zod";

const walletPayment = z.object({
    type: z.enum(["simple"]).default("simple"),

    amount: z.coerce.number().int().min(0),
    info: z.union([z.object({
        account: BaseController.id,
        pos: BaseController.id
    }), checkConfig, transferSchema
    ]).optional(),

    deadline: z.coerce.date().optional(),
    payType: z.enum(["payGateWay", "transfer"]).optional(),
})


export default class UserFinanceController<T extends Invoice> extends Controller {
    financeService: FinanceService<T>
    paymentConfigPreTextRepo: PaymentConfigPreTextRepository
    ownerType : string 


    constructor(financeService: FinanceService<T> ,ownerType: string = "user") {
        super('/finance', {
            apiDoc: {

            }
        })
        this.financeService = financeService
        this.paymentConfigPreTextRepo = new PaymentConfigPreTextRepository()
        this.ownerType = ownerType
    }


    @Post("/invoice/pay/wallet", {
        apiDoc: {
            security: [{
                BasicAuth: []
            }]
        }
    })
    async payFromWallet(
        @Body({
            schema: z.object({
                id: BaseController.id,
                amount: z.coerce.number().int().positive()
            })
        }) data: {
            id: string,
            amount: number
        },
        @User() user: UserInfo
    ) {
        try {
            return await this.financeService.addPaymentConfig({
                invoice: data.id,
                payFor: "invoice",
                type: "simple",
                payType: "wallet",
                amount: data.amount,
                owner: user.id,
                ownerType: "user",

            } as any)

        } catch (error) {
            throw error
        }
    }

    @Post("/invoice/pay/transfer", {
        apiDoc: {
            security: [{
                BasicAuth: []
            }]
        }
    })
    async payFromTransfer(
        @Body({
            schema: z.object({
                id: BaseController.id,
                code: z.string(),
                payDate: z.coerce.date().default(() => new Date()),
                amount: z.coerce.number().int().positive(),
                source: z.string(),
                destination: z.string()
            })
        }) transferData: {
            id: string,
            code: string,
            payDate: Date,
            amount: number,
            source: string,
            destination: string
        },
        @User() user: UserInfo
    ) {
        try {
            return await this.financeService.addPaymentConfig({
                invoice: transferData.id,
                payFor: "invoice",
                type: "simple",
                payType: "transfer",
                amount: transferData.amount,
                info: {
                    source: transferData.source,
                    destination: transferData.destination,
                    code: transferData.code
                },
                deadline: transferData.payDate,
                owner: user.id,
                ownerType: "user"
            } as any)

        } catch (error) {
            throw error
        }
    }



    @Post("/invoice/pay/gateWay", {
        apiDoc: {
            security: [{
                BasicAuth: []
            }]
        }
    })
    async payFromGateway() {

    }


    @Get("/payments")
    async getPayments(
        @Query({
            destination: "page",
            schema: BaseController.page
        }) page: number,
        @Query({
            destination: "limit",
            schema: BaseController.limit
        }) limit: number,
        @User() user: UserInfo,
        @Query({
            destination: "q",
            schema: z.string().optional()
        }) q?: string,
        @Query({
            destination: "payFors",
            schema: z.array(z.enum(["invoice", "chargeAccount", "chashBack"])).optional()
        }) payFors?: string[],
        @Query({
            destination: "payFor",
            schema: z.enum(["invoice", "chargeAccount", "chashBack"]).optional()
        }) payFor?: string
    ) {
        let query: any = {
            owner: {
                $eq: user.id
            },
            status: {
                $in: ["finished", "ended"]
            }
        }
        if (q != undefined) {
            query["trakingCode"] = {
                $regex: new RegExp(q)
            }
        }
        if (payFors != undefined && payFors.length > 0) {
            query["payFor"] = {
                $in: payFors
            }
        }
        else if (payFor != undefined) {
            query["payFor"] = payFor
        }

        return this.financeService.repos.paymentConfigRepo.paginate(query, limit, page)
    }


    @Post("/wallet/charge")
    async addWalletPaymentConfig(
        @Body({
            schema: walletPayment
        }) data: PaymentConfig,
        @User() user : UserInfo,

    ) {
        try {
            data.owner = user.id
            data.ownerType = this.ownerType
            return {
                status: 200,
                data: await this.financeService.addWalletPaymentConfig(data)
            }
        } catch (error) {
            throw error
        }
    }


}



