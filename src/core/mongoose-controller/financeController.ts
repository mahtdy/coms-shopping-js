import Controller, { Response } from "../controller";
import { Delete, Get, Post, Put } from "../decorators/method";
import { Admin, Body, Files, Query } from "../decorators/parameters";
import BaseController, { PaginationConfig } from "./controller";
import { checkConfig, transferSchema } from "./controllers/invoice";
import FinanceService from "./financeService";
import Invoice from "./repositories/invoice/model";
import { z } from "zod"
import PaymentConfigPreTextRepository from "./repositories/paymentConfigPreText/repository";
import PaymentConfig, { Check } from "./repositories/paymentConfig/model";
import { AdminInfo } from "./auth/admin/admin-logIn";
import { Types } from "mongoose";


export interface EditCheckData {
    number: string,
    saiadNumber: string,
    bank: string,
    branch: string,

    deadline: Date,
    amount: number,
    id: string,
}


export interface EditCashData {
    id: string,
    amount: number,
    deadline: Date,
}

export interface EditPOSData {
    id: string,
    amount: number,
    deadline: Date,
    pos: string,
    bank: string
}


export interface EditTransferData {
    source: string,
    destination: string,
    code: string,
    id: string,
    deadline: Date,
    amount: number
}

export interface ChangeCheckPlaceData {
    id: string,
    placeType: "spend" | "in-bank" | "in-chest" | "dein",
    chestId?: string,
    spendInfo?: {
        type: string,
        id: string
    },
    bankInfo?: {
        bankName: string,
        address: string,
        account: string
    },
    dein?: {
        droDownType: "percentage" | "static",
        volume: number,
        account: string
    }

}

export interface InternalTransferData {
    fromId: string | Types.ObjectId,
    fromType: "bank" | "chest" | "",
    //     toId : BaseController.id,
    //     toType: z.enum([""]),

    //     amount : z.coerce.number().positive(),
    //     fee : z.coerce.number().positive(),
    //     date: z.coerce.date(),
    //     description: z.string(),
    //     referral : z.string().optional()
}

export interface CancelAndChangeCheckData {
    paymentId: string,
    type: "simple",

    info: {
        interestRate?: number,
        havePenalty?: boolean,

        number: string,
        saiadNumber: string,
        bank: string,
        branch: string,

        source: string,
        destination: Types.ObjectId,
        code: string,

        account: Types.ObjectId,
        pos: Types.ObjectId,
    },

    deadline: Date,
    payType: "payGateWay" | "cash" | "pos" | "transfer" | "check" | "wallet",
}

interface LoanTemplateData {
    loanTemplate: string;
    loanPeriod: string;
}

type PeriodType = 10 | 15 | 20 | 30 | 45 | 60 | 90 | 120 | 150 | 180;
interface CustomLoanData {
    amount: number;
    formula: "banking" | "market";
    count: number;
    interestRate: number;
    bankFees: number,
    period?: PeriodType;
}

export interface LoanInput {
    ownerType: string;
    owner: string;
    payType: "check" | "payGateWay",
    data: LoanTemplateData | CustomLoanData;
}

export const walletPayment = z.object({
    type: z.enum(["multi-stage", "simple"]),

    amount: z.coerce.number().int().min(0),
    info: z.union([z.object({
        account: BaseController.id,
        pos: BaseController.id
    }), checkConfig, transferSchema
    ]).optional(),

    deadline: z.coerce.date().optional(),
    payType: z.enum(["payGateWay", "cash", "pos", "transfer", "check"]).optional(),
    ownerType: z.string(),
    owner: BaseController.id
})



const loanPayment = z.object({

    ownerType: z.string(),
    owner: BaseController.id,
    payType: z.enum(["check",
        "payGateWay"]).optional(),
    data: z.union([
        z.object({
            loanTemplate: BaseController.id,
            loanPeriod: BaseController.id,
        }),
        z.object({
            amount: z.coerce.number().int().min(0),
            formula: z.enum(["banking", "market"]),
            count: z.coerce.number().int().min(1),
            interestRate: z.coerce.number().int().min(0).max(100),
            period: z.union([
                z.literal(10),
                z.literal(15),
                z.literal(20),
                z.literal(30),
                z.literal(45),
                z.literal(60),
                z.literal(90),
                z.literal(120),
                z.literal(150),
                z.literal(180),
            ]).default(30),
            bankFees: z.number().min(0).optional(),
        })
    ])
})

const paymentConfig = z.object({
    invoice: BaseController.id,
    type: z.enum(["multi-stage", "installment", "simple"]),
    installmentConfig: z.object({
        prePay: z.coerce.number().int().min(0).optional(),
        prePayDeadline: z.coerce.date().optional(),
        prePayCheck: checkConfig.optional(),
        formula: z.enum(["banking", "market"]).optional(),
        count: z.coerce.number().int().min(1).optional(),
        period: z.union([
            z.literal(10),
            z.literal(15),
            z.literal(20),
            z.literal(30),
            z.literal(45),
            z.literal(60),
            z.literal(90),
            z.literal(120),
            z.literal(150),
            z.literal(180),
        ]),
        interestRate: z.coerce.number().int().min(0).max(100).optional(),
        payType: z.enum(["check", "payGateWay", "other"]).optional(),
        checks: z.array(checkConfig).optional(),
        notes: z.array(z.array(z.string())),
        payStart: z.coerce.date(),
        havePenalty: z.boolean().optional(),
    }
    ).optional(),
    amount: z.coerce.number().int().min(0),
    info: z.union([z.object({
        account: BaseController.id,
        pos: BaseController.id
    }), checkConfig, transferSchema
    ]).optional(),

    deadline: z.coerce.date().optional(),
    payType: z.enum(["payGateWay", "cash", "pos", "transfer", "check", "wallet"]).optional(),
})

const cancleAndChangeCheck = z.object({
    paymentId: BaseController.id,
    type: z.enum(["simple"]),

    info: z.union([z.object({
        account: BaseController.id,
        pos: BaseController.id
    }), checkConfig, transferSchema
    ]).optional(),

    deadline: z.coerce.date().optional(),
    payType: z.enum(["payGateWay", "cash", "pos", "transfer", "check", "wallet"]).optional(),
})

export default class FinanceController<T extends Invoice> extends Controller {
    financeService: FinanceService<T>
    paymentConfigPreTextRepo: PaymentConfigPreTextRepository

    constructor(financeService: FinanceService<T>) {
        super('/finance', {
            apiDoc: {
                summary: 'Finance API',
                description: 'Finance API for managing finance data',
                tags: ['finance'],
                consumes: ['application/json'],
                produces: ['application/json']
            }
        })
        this.financeService = financeService
        this.paymentConfigPreTextRepo = new PaymentConfigPreTextRepository()

    }

    //////////////////////   invoice    ////////////////////
    @Post("/payment/config/wallet")
    async addWalletPaymentConfig(
        @Body({
            schema: walletPayment
        }) data: PaymentConfig,
        @Admin() admin: AdminInfo
    ) {
        try {
            return {
                status: 200,
                data: await this.financeService.addWalletPaymentConfig(data, admin)
            }
        } catch (error) {
            throw error
        }
    }

    @Post("/payment/config/loan")
    async createLoan(
        @Body({
            schema: loanPayment
        }) data: LoanInput,
        @Admin() admin: AdminInfo
    ): Promise<Response> {
        try {
            return {
                status: 200,
                data: await this.financeService.createLoan(data, admin)
            }
        } catch (error) {
            throw error
        }
    }

    @Post("/payment/config/loan/deposit")
    async depositLoan(
        @Body({
            destination: "id",
            schema: BaseController.id
        }) id: string,
        @Body({
            destination: "period",
            schema: z.coerce.number().int().min(0).default(0)
        }) period?: number,

        @Body({
            destination: "payStart",
            schema: z.coerce.date().optional()
        }) payStart?: Date

    ): Promise<Response> {
        try {

            return {
                data: await this.financeService.depositLoan(id, payStart, period),
                status: 200
            }

        } catch (error) {
            console.log(error)
            throw error
        }
    }


    @Post("/payment/config/loan/confirm")
    async confirmLoan(
        @Query({
            destination: "id",
            schema: BaseController.id
        }) id: string,
        @Body({
            schema: loanPayment
        }) data: LoanInput,
        @Admin() admin: AdminInfo
    ): Promise<Response> {
        try {
            return {
                status: 200,
                data: await this.financeService.confirmLoan(id, data, admin)
            }
        } catch (error) {
            throw error
        }
    }

    @Post("/payment/config/loan/check")
    async addChecks(
        @Query({
            destination: "id",
            schema: BaseController.id
        }) id: string,
        @Body({
            schema: z.array(checkConfig),
            destination: "checks"
        }) checks: Check[],
        @Admin() admin: AdminInfo,
        @Body({
            destination: "payStart",
            schema: z.coerce.date()
        }) payStart: Date,
        @Body({
            destination: "period",
            schema: z.coerce.number().int().min(0).default(0)
        }) period?: number,

    ): Promise<Response> {
        try {
            return {
                status: 200,
                data: await this.financeService.addChecks(id, checks, payStart, admin, period)
            }
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    @Post("/payment/config/loan/attachments", {
        contentType: "multipart/form-data"
    })
    async addAttachments(
        @Body({
            destination: "id",
            schema: BaseController.id
        }) id: string,



        @Body({
            destination: "name",
            schema: z.enum(["birthCertificate", "nationalCard", "jobQualifications", "residenceInfo", "financeInfo", "sanaInfo", "otherInfo"])
        }) name: string,

        @Body({
            destination: "attachement"
        }) attachement: string[],


        @Files({
            config: {
                name: "attachement",
                maxCount: 5,
                types: ["jpg", "png", "webp", "jpeg"],
                dest: "src/uploads/waranty/",
                rename: true,

            },
            schema: z.any().optional(),
            destination: "attachement",
            isArray: true,
            mapToBody: true,
            isOptional: true,
            moveFilesToCDN: {
                name: "attachement",
                config: {
                    path: "loan/",

                },


            },


        }) files?: any,

    ): Promise<Response> {
        try {
            const payment = await this.financeService.repos.paymentConfigRepo.findById(id);

            if (payment == null) {
                return {
                    status: 404
                }
            }
            if (payment.loanAttchments == undefined) {
                payment.loanAttchments = {}
            }

            let attachment = payment.loanAttchments[name]

            if (attachment) {
                // attachment.files = attachement;
                payment.loanAttchments[name].push({
                    url: attachement
                })
            } else {
                payment.loanAttchments[name] = [{ url: attachement }]
            }

            this.financeService.repos.paymentConfigRepo.updateOne({
                _id: id
            }
                , {
                    $set: payment
                })

            return {
                status: 200,
                data: attachement
            }
        } catch (error) {
            throw error
        }
    }


    @Get("/payment/config/loan/warranty/config")
    async getWarrantyConfig(
        @Query({
            destination: "id",
            schema: BaseController.id
        }) id: string
    ): Promise<Response> {
        try {
            return {
                status: 200,
                data: await this.financeService.getWarrantyConfig(id)
            }
        } catch (error) {
            throw error
        }
    }

    @Post("/payment/config/loan/attachments/remove")
    async deleteAttachment(
        @Body({
            destination: "id",
            schema: BaseController.id
        }) id: string,

        @Body({
            destination: "name",
            schema: z.enum(["birthCertificate", "nationalCard", "jobQualifications", "residenceInfo", "financeInfo", "sanaInfo", "otherInfo"])
        }) name: string,

        @Body({
            destination: "link",
            schema: z.string()
        }) link: string,
    ): Promise<Response> {
        try {
            const payment = await this.financeService.repos.paymentConfigRepo.findById(id);

            if (payment == null) {
                return {
                    status: 404
                }
            }
            if (payment.loanAttchments == undefined) {
                payment.loanAttchments = {}
            }

            let attachment = payment.loanAttchments[name]

            if (attachment) {
                payment.loanAttchments[name] = payment.loanAttchments[name].filter((item: any) => item.url !== link)
            }

            await this.financeService.repos.paymentConfigRepo.updateOne({
                _id: id
            }
                , {
                    $set: payment
                })

            return {
                status: 200,
                data: payment.loanAttchments
            }

        } catch (error) {
            throw error
        }
    }

    @Post("/payment/config/loan/attachments/confirm",)
    async confirmAttachment(
        @Body({
            destination: "id",
            schema: BaseController.id
        }) id: string,

    ): Promise<Response> {
        try {
            return {
                status: 200,
                data: await this.financeService.confirmLoanAtachement(id)
            }
        } catch (error) {
            throw error
        }
    }




    @Post("/payment/config/loan/reject")
    async rejectLoan(
        @Query({
            destination: "id",
            schema: BaseController.id
        }) id: string
    ) { }

    @Put("/payment/config/loan")
    async editLoan(
        @Query({
            destination: "id",
            schema: BaseController.id
        }) id: string,
        @Body({
            schema: loanPayment
        }) data: LoanInput,
        @Admin() admin: AdminInfo
    ): Promise<Response> {
        try {
            return {
                status: 200,
                data: await this.financeService.editLoan(id, data, admin)
            }

        } catch (error) {
            throw error
        }
        return {

        }
    }

    @Put("/payment/loan/pay-type")
    async changeLoanPayType(
        @Body({
            schema: BaseController.id,
            destination: "id"
        }) id: string,
        @Body({
            schema: z.enum(["check", "payGateWay"]),
            destination: "type"
        }) type: "check" | "payGateWay"
    ): Promise<Response> {
        try {
            return {
                data: await this.financeService.changeLoanPayType(id, type),
                status: 200
            }
        } catch (error) {
            throw error
        }
    }

    @Delete("/payment/config/loan")
    async deleteLoan(
        @Body({
            destination: "id",
            schema: BaseController.id
        }) id: string
    ): Promise<Response> {
        try {

        } catch (error) {

        }
        return {

        }
    }


    @Get("/owner/wallet")
    async getOwnerWallet(
        @Query({
            destination: "owner",
            schema: BaseController.id
        }) id: string,
        @Query({
            destination: "ownerType",
            schema: z.string()
        }) ownerType: string,
    ): Promise<Response> {
        try {
            return {
                data: await this.financeService.getOwnerWallet(id, ownerType)
            }
        } catch (error) {
            throw error
        }
    }


    @Post("/payment/config/wallet/cancel")
    async cancelWalletPaymentConfig(
        @Body({
            schema: z.object({
                paymentId: BaseController.id
            })
        }) data: { paymentId: string }) {

        try {
            await this.financeService.cancelWalletPaymentConfig(data.paymentId)
            return {
                status: 200,
                data: {}
            }

        } catch (error) {
            throw error
        }
    }

    @Get("/payment/config/wallet")
    async getWalletPaymentConfig(
        @Query({
            destination: "id",
            schema: BaseController.id
        }) id: string
    ) {
        try {
            let data = await this.financeService.getWalletPaymentConfig(id)
            if (data == null) {
                return {
                    status: 404,
                    data: {}
                }
            }
            return {
                data,
                status: 200
            }
        } catch (error) {
            throw error
        }
    }


    @Post("/payment/config")
    async addPaymentConfig(
        @Body(
            {
                schema: paymentConfig
            }) data: PaymentConfig,
        @Admin() admin: AdminInfo,
    ): Promise<Response> {
        try {
            return {
                status: 200,
                data: await this.financeService.addPaymentConfig(data, admin)
            }
        } catch (error) {
            console.log(error)
            throw error
        }
    }


    @Post("/payment/config/cancel")
    async cancelPaymentConfig(
        @Body({
            schema: z.object({
                id: BaseController.id,
                paymentId: BaseController.id
            })
        }) data: { id: string, paymentId: string }) {

        try {
            await this.financeService.canclePaymentConfig(data.id, data.paymentId)
            return {
                status: 200,
                data: {}
            }

        } catch (error) {
            throw error
        }
    }

    @Post("/installment/note")
    async addInstallmentNote(
        @Body(
            {
                schema: z.object({
                    installmentId: BaseController.id,
                    note: z.string()
                })
            }) data: { installmentId: string, note: string },
        @Admin() admin: AdminInfo
    ): Promise<Response> {
        try {
            await this.financeService.addInstallmentNote(data, admin)
            return {
                status: 200
            }
        } catch (error) {
            throw error
        }
    }

    @Post("/installment/note/remove")
    async deleteInstallmentNote(
        @Body({
            schema: z.object({
                installmentId: BaseController.id,
                noteId: BaseController.id
            })
        }) data: {
            installmentId: string,
            noteId: string
        },
        @Admin() admin: AdminInfo

    ): Promise<Response> {
        try {
            await this.deleteInstallmentNote(data, admin)
            return {
                status: 200

            }
        } catch (error) {
            throw error
        }
    }


    @Get("/installment/note")
    async getInstallmentNotes(
        @Query({
            destination: "installmentId",
            schema: BaseController.id
        }) installmentId: string
    ): Promise<Response> {
        try {

            return {
                status: 200,
                data: await this.financeService.getInstallmentNotes(installmentId)
            }
        } catch (error) {
            throw error
        }
    }

    @Post("/installment")
    async updateInstallment(
        @Body({
            destination: "id",
            schema: BaseController.id
        }) id: string,
        @Body({
            schema: z.object({
                number: z.string(),
                saiadNumber: z.string(),
                bank: z.string(),
                branch: z.string(),
            })
        }) data: any
    ): Promise<Response> {
        try {
            await this.financeService.updateInstallment(id, data)
        } catch (error) {
            throw error
        }

        return {
            status: 200
        }
    }

    @Post("/installments/confirm")
    async confirmInstallments(
        @Body({
            destination: "id",
            schema: BaseController.id,
        }) id: string
    ) {
        try {
            await this.financeService.confirmInstallments(id)
            return {
                status: 200,
                data: {}
            }
        } catch (error) {
            throw error
        }
    }

    @Post("/installments/reject")
    async rejectInstallments(
        @Body({
            schema: z.object({
                id: BaseController.id,
                paymentId: BaseController.id,
                rejectMessage: z.string()
            })
        }) data: { id: string, paymentId: string, rejectMessage: string },
    ) {
        try {
            await this.financeService.rejectInstallments(data.paymentId, data.rejectMessage)
            return {
                status: 200,
                data: {}
            }
        } catch (error) {
            throw error
        }
    }


    @Post("/installment/confirm")
    async confirmInstallment(
        @Body({
            destination: "id",
            schema: BaseController.id
        }) id: string,
        @Admin() admin: AdminInfo
    ) {
        try {
            await this.financeService.confirmInstallment(id, admin)
            return {
                status: 200,
                data: {}
            }
        } catch (error) {
            throw error;
        }
    }

    @Post("/installment/reject")
    async rejectInstallment(
        @Body({
            schema: z.object({
                id: BaseController.id,
                // paymentId :BaseController.id,
                rejectMessage: z.string()
            })
        }) data: { id: string, rejectMessage: string },
        @Admin() admin: AdminInfo): Promise<Response> {
        try {
            await this.financeService.rejectInstallment(data.id, data.rejectMessage, admin)
            return {
                status: 200,
                data: {}
            }
        } catch (error) {
            throw error
        }
    }

    @Post("/installment/penalty/forget")
    async forgetPenalty(
        @Body({
            destination: "id",
            schema: BaseController.id
        }) id: string
    ) {
        try {

        } catch (error) {
            throw error
        }
        return {

        }
    }


    @Post("/installment/penalty/link/send")
    async sendPenaltyPayLink(
        @Body({
            destination: "id",
            schema: BaseController.id
        }) id: string
    ) {
        try {
            return {
                data: await this.financeService.sendPenaltyPayLink(id),
                status: 200
            }
        } catch (error) {
            throw error
        }
    }


    @Post("/installment/penalty/pay/wallet")
    async payPenaltyFromWallet(
        @Body({
            schema: BaseController.id,
            destination: "id"
        }) id: string
    ): Promise<Response> {
        try {
            return {
                data: await this.financeService.payPenaltyFromWallet(id),
                status: 200
            }

        } catch (error) {
            throw error
        }
    }


    @Post("/installment/check/change")
    async changeInstallment(
        @Body({
            schema: z.object({
                id: BaseController.id,
                installmentId: BaseController.id,
            })
        }) data: any) {

    }


    @Get("/invoice")
    async getInvoiceById(
        @Query({
            destination: "id",
            schema: BaseController.id
        }) id: string
    ): Promise<Response> {
        try {


            return {
                data: await this.financeService.getInvoiceById(id)
            }
        } catch (error) {
            throw error
        }
    }

    @Get("/invoice/installment")
    async getPaymentInstallments(
        @Query({
            destination: "id",
            schema: BaseController.id
        }) id: string
    ) {
        try {
            return {
                data: await this.financeService.getPaymentInstallments(id),
                status: 200
            }
        } catch (error) {
            throw error
        }
    }


    /////////////////////    invoice    //////////////////


    @Get("/pretext/search")
    async searchPreText(
        @Query({
            destination: "q",
            schema: z.string()
        }) q: string
    ) {
        try {
            let query: any = {}
            if (q) {
                query["text"] = {
                    $regex: new RegExp(q)
                }
            }
            let data = await this.paymentConfigPreTextRepo.paginate(query, 10, 1)
            return {
                status: 200,
                data
            }
        } catch (error) {
            throw error
        }

    }

    @Post("/pretext")
    async addPreText(
        @Body({
            destination: "text",
            schema: z.string()
        }) text: string
    ) {
        try {
            await this.paymentConfigPreTextRepo.insert({
                text
            } as any)
            return {
                status: 200,
                data: {}
            }
        } catch (error) {
            throw error
        }

    }

    @Delete("/pretext")
    async deletePreText(
        @Query({
            destination: "id",
            schema: BaseController.id
        }) id: string
    ) {
        try {
            await this.paymentConfigPreTextRepo.deleteById(id)
            return {
                status: 200,
                data: {}
            }
        } catch (error) {
            throw error
        }
    }

    @Get("/amount/minimum")
    async getMinimumAmount(
        @Query({
            destination: "id",
            schema: BaseController.id
        }) id: string
    ) {
        try {
            return {
                status: 200,
                data: await this.financeService.getMinimumAmount(id)
            }
        } catch (error) {
            throw error
        }
    }




    @Post("/check/confirm")
    async confirmCheck(
        @Body({
            schema: z.object({ id: BaseController.id })
        }) data: { id: string }
    ): Promise<Response> {
        try {
            await this.financeService.confirmCheck(data.id)
            return {
                status: 200,
                data: {}
            }
        } catch (error) {
            throw error
        }

    }

    @Post("/check/reject")
    async rejectCheck(
        @Body({
            schema: z.object({
                id: BaseController.id,
                rejectMessage: z.string()
            })
        }) data: {
            id: string,
            rejectMessage: string
        }
    ): Promise<Response> {
        try {
            await this.financeService.rejectCheck(data.id, data.rejectMessage)
            return {
                status: 200,
                data: {}
            }
        } catch (error) {
            throw error
        }
    }

    @Post("/check/edit")
    async editCheck(
        @Body({
            schema: checkConfig.and(z.object({
                id: BaseController.id,
                amount: z.coerce.number().int().positive(),
                deadline: z.coerce.date(),
            }))
        }) data: EditCheckData
    ): Promise<Response> {
        try {
            await this.financeService.editCheck(data)
            return {
                status: 200,
                data: {}
            }
        } catch (error) {
            throw error
        }
    }

    @Post("/check/passed")
    async checkPassed(
        @Body({
            schema: z.object({
                id: BaseController.id,
                account: BaseController.id.optional()
            })
        }) data: {
            id: string
            account?: string
        }
    ): Promise<Response> {
        try {
            let check = await this.financeService.checkPassed(data.id, data.account)
        } catch (error) {
            throw error
        }
        return {
            status: 200
        }
    }

    @Post("/check/returned")
    async checkReturned(
        @Body({
            schema: z.object({
                id: BaseController.id,
            })
        }) data: {
            id: string
        }
    ): Promise<Response> {

        try {

            await this.financeService.checkReturned(data.id)
            return {
                status: 200,
                data: {}
            }
        } catch (error) {
            throw error
        }
    }

    @Get("/checkes")
    async getAllChecks(
        @Query({
            destination: "page",
            schema: BaseController.page
        }) page: number,
        @Query({
            destination: "limit",
            schema: BaseController.limit
        }) limit: number,
        @Query({
            destination: "status",
            schema: z.enum([
                "inproccess",
                "returned",
                "arrived",
                "finished",
                "ended",
                "waitingForCancle",
                "readyForCancle"

            ]).optional()
        }) status?: string
    ) {

        try {
            let q: any = {}
            if (status) {
                q["status"] = status
            }
            else {
                q["status"] = {
                    $in:
                        ["inproccess", "returned", "arrived", "finished", "ended", "waitingForCancle", "readyForCancle"]
                }
            }

            q["payType"] = "check"
            return {
                status: 200,
                data: await this.financeService.repos.paymentConfigRepo.paginate(q, limit, page, {
                    population: [
                        {
                            path: "owner",
                            select: ["name", "family"]
                        },
                        {
                            path: "spendInfo.id",
                            select: ["nameAndFamily", "isReal", "name", "family"]
                        },
                        {
                            path: "dein.account",
                            select: ["title"]
                        },
                        {
                            path: "bankAccount",
                            select: ["title"]
                        },
                        {
                            path: "chest",
                            select: ["title"]
                        },
                        {
                            path: "invoice",
                            select: ["tax"]
                        },
                    ]
                })
            }
        } catch (error) {
            throw error;
        }

    }



    @Post("/check/cancle/request")
    async cancleAndChangeCheckReq(
        @Body({
            schema: z.object({
                id: BaseController.id,
                reSend: z.boolean().optional(),
                isInstallmentId: z.boolean().optional()
            })
        }) data: {
            id: string
            reSend: boolean,
            isInstallmentId: boolean
        }
    )
        : Promise<Response> {
        try {
            await this.financeService.cancleAndChangeCheckReq(data.id, data.reSend, data.isInstallmentId)
        } catch (error) {
            throw error
        }
        return {
            status: 200,
            data: {}
        }
    }

    @Post("/check/cancle/confirm")
    async confirmCancleAndChangeCheck(
        @Body({
            schema: z.object({
                id: BaseController.id,
                code: z.string()
            })
        })
        data: {
            id: string,
            code: string
        }
    ) {
        try {
            await this.financeService.confirmCancleAndChangeCheck(data.id, data.code)
            return {
                status: 200,
                data: {}
            }
        } catch (error) {
            throw error
        }
    }


    @Post("/check/cancle/submit")
    async submitCheckCancel(
        @Body({
            schema: z.object({
                id: BaseController.id,
                code: z.string()
            })
        }) data: {
            id: string,
            code: string
        }
    ) {
        try {
            await this.financeService.submitCheckCancel(data.id, data.code)
        } catch (error) {
            throw error
        }
        return {
            status: 200,
            data: {}
        }
    }


    @Post("/check/cancle/submit/request")
    async requestSubmitCheckCancel(
        @Body({
            schema: z.object({
                id: BaseController.id,
                reSend: z.boolean().optional()
            })
        }) data: {
            id: string,
            reSend: boolean
        }
    ) {
        try {
            await this.financeService.requestSubmitCheckCancel(data.id, data.reSend)
        } catch (error) {
            throw error
        }
        return {
            status: 200,
            data: {}
        }
    }

    @Post("/check/cancle")
    async cancleAndChangeCheck(
        @Body({
            schema: cancleAndChangeCheck
        }) data: CancelAndChangeCheckData
    ): Promise<Response> {
        try {
            // console.log(data)
            return {
                data: await this.financeService.cancleAndChangeCheck(data),
                status: 200
            }
        } catch (error) {
            console.log("err", error)
            throw error
        }
    }


    @Post("/check/cancle/reject")
    async cancleAndChangeReject() {

    }

    @Post("/check/place/change")
    async changeCheckPlace(
        @Body({
            schema: z.object({
                id: BaseController.id,
                placeType: z.enum([
                    "spend",
                    "in-bank",
                    "in-chest",
                    "dein"
                ]),
                chestId: BaseController.id.optional(),
                spendInfo: z.object({
                    type: z.string(),
                    id: BaseController.id,
                }).optional(),
                bankInfo: z.object({
                    account: BaseController.id
                }).optional(),
                dein: z.object({
                    drodownType: z.enum(["percentage", "static"]),
                    volume: z.coerce.number().positive(),
                    account: BaseController.id
                }).optional()
            })
        }) data: ChangeCheckPlaceData
    ): Promise<Response> {
        try {
            await this.financeService.changeCheckPlace(data)
            return {
                status: 200,
                data: {}
            }
        } catch (error) {
            throw error;
        }
    }

    @Post("/cash/confirm")
    async confirmCash(
        @Body({
            schema: z.object({
                id: BaseController.id,
                to: z.enum([
                    "chest",
                    "bank"
                ]).default("bank"),
                bank: BaseController.id.optional(),
                chest: BaseController.id.optional(),
            })
        }) data: {
            id: string
            to: "bank" | "chest",
            bank?: string,
            chest?: string
        }
    ): Promise<Response> {
        try {
            let id
            if ((data.to == "bank" && data.bank != undefined)) {
                id = data.bank
            }
            else if ((data.to == "chest" && data.chest != undefined)) {
                id = data.chest
            }
            else {
                return {
                    status: 400,
                    message: "to and bank or chest should be provided"
                }
            }
            await this.financeService.confirmCash(
                data.id,
                data.to,
                id
            )
            return {
                status: 200,
                data: {}
            }
        } catch (error) {
            throw error
        }
    }



    @Post("/cash/reject")
    async rejectCash(
        @Body({
            schema: z.object({
                id: BaseController.id,
                rejectMessage: z.string()
            })
        }) data: {
            id: string,
            rejectMessage: string
        }
    ): Promise<Response> {
        try {
            await this.financeService.rejectCash(data.id, data.rejectMessage)
            return {
                status: 200,
                data: {}
            }
        } catch (error) {
            throw error
        }
    }

    @Post("/cash/edit")
    async editCash(
        @Body({
            schema: z.object({
                id: BaseController.id,
                amount: z.coerce.number().int().positive(),
                deadline: z.coerce.date()
            })
        }) data: EditCashData
    ): Promise<Response> {
        try {
            await this.financeService.editCash(data)
            return {
                status: 200,
                data: {}
            }
        } catch (error) {
            throw error
        }
    }


    @Post("/pos/confirm")
    async confirmPOS(
        @Body({
            schema: z.object({
                id: BaseController.id
            })
        }) data: { id: string }
    ): Promise<Response> {
        try {
            await this.financeService.confirmPOS(data.id)
            return {
                status: 200,
                data: {}
            }
        } catch (error) {
            throw error;
        }
    }

    @Post("/pos/reject")
    async rejectPOS(
        @Body({
            schema: z.object({
                id: BaseController.id,
                rejectMessage: z.string()
            })
        }) data: {
            id: string,
            rejectMessage: string
        }
    ): Promise<Response> {
        try {
            await this.financeService.rejectPOS(data.id, data.rejectMessage)
            return {
                status: 200,
                data: {}
            }
        } catch (error) {
            throw error
        }
    }

    @Post("/pos/edit")
    async editPOS(
        @Body({
            schema: z.object({
                id: BaseController.id,
                pos: BaseController.id,
                amount: z.coerce.number().int().positive(),
                deadline: z.coerce.date(),
            })
        }) data: EditPOSData
    ): Promise<Response> {
        try {
            await this.financeService.editPOS(data)
            return {
                status: 200,
                data: {}
            }
        } catch (error) {
            throw error
        }
    }


    @Post("/transfer/confirm")
    async confirmTransfer(
        @Body({
            schema: z.object({ id: BaseController.id })
        }) data: { id: string }
    ): Promise<Response> {
        try {
            await this.financeService.confirmTransfer(data.id)
            return {
                status: 200,
                data: {}
            }
        } catch (error) {
            throw error;
        }
    }
    @Post("/transfer/reject")
    async rejectTransfer(
        @Body({
            schema: z.object({
                id: BaseController.id,
                rejectMessage: z.string()
            })
        }) data: {
            id: string,
            rejectMessage: string
        }
    ): Promise<Response> {
        try {
            await this.financeService.rejectTransfer(data.id, data.rejectMessage)
            return {
                status: 200,
                data: {}
            }
        } catch (error) {
            throw error;
        }
    }

    @Post("/transfer/edit")
    async editTransfer(
        @Body({
            schema: transferSchema.and(
                z.object({
                    id: BaseController.id,
                    deadline: z.coerce.date(),
                    amount: z.coerce.number().positive().int()
                })
            )

        }) data: EditTransferData
    ): Promise<Response> {
        try {
            this.financeService.editTransfer(data)
            return {
                status: 200,
                data: {}
            }
        } catch (error) {
            throw error;
        }
    }



    @Post("/transfer/internal")
    async internalTransfer(
        @Body({
            schema: z.object({
                fromId: BaseController.id,
                fromType: z.enum([""]),
                toId: BaseController.id,
                toType: z.enum([""]),

                amount: z.coerce.number().positive(),
                fee: z.coerce.number().positive(),
                date: z.coerce.date(),
                description: z.string(),
                referral: z.string().optional()
            })
        }) data: InternalTransferData): Promise<Response> {
        try {
            await this.financeService.internalTransfer(data)
            return {
                status: 200,
                data: {}
            }
        } catch (error) {
            throw error;
        }
    }


    @Post("/payGateWay/link/sms")
    async sendPayLink(
        @Body({
            destination: "id",
            schema: BaseController.id.optional()
        }) id: string
    ): Promise<Response> {
        try {
            await this.financeService.sendPayLink(id)
        } catch (error) {
            throw error
        }
        return {

        }
    }

}

