import { CancelAndChangeCheckData, ChangeCheckPlaceData, EditCashData, EditCheckData, EditPOSData, EditTransferData, InternalTransferData, LoanInput } from "./financeController";
import BankAccountRepository from "./repositories/bankAccount/repository";
import InstallmentRepository from "./repositories/installment/repository";
import Invoice from "./repositories/invoice/model";
import InvoiceRepository from "./repositories/invoice/repository";
import PaymentConfigRepository, { Schedule } from "./repositories/paymentConfig/repository";
import POS_DeviceRepository from "./repositories/posDevice/repository";
import TransactionRepository from "./repositories/transaction/repository";
import TaxLogRepository from "./repositories/taxLog/repository";
import mongoose, { Types } from "mongoose"
import ChestRepository from "./repositories/chest/repository";
import PaymentConfig, { Check } from "./repositories/paymentConfig/model";
import { AdminInfo } from "./auth/admin/admin-logIn";
import UserRepository from "./repositories/user/repository";
import RandomGenarator from "../random";
import SmsMessager from "../messaging/smsMessager";
import LoanSettingRepository from "./repositories/loanSetting/repository";
import LoanTemplateRepository from "./repositories/loanTemplate/repository";
import SystemConfigRepository from "./repositories/system/repository";
import WarrantyRepository from "./repositories/warranty/repository";
import DomainRepository from "./repositories/domain/repository";
import BaseUser from "./repositories/user/model";
import PaymentGatewayRepository from "./repositories/paymentGateway/repository";

interface FinanceServiceOptions<T extends Invoice> {
    invoiceRepo: InvoiceRepository<T>,
    paymentConfigRepo: PaymentConfigRepository,
    transactionRepo: TransactionRepository,
    bankAccountRepo: BankAccountRepository,
    chestRepo: ChestRepository,
    installmentRepo: InstallmentRepository,
    posRepo: POS_DeviceRepository,
    loanSettingRepo: LoanSettingRepository,
    loanTemplateRepo: LoanTemplateRepository,
    systemConfigRepo: SystemConfigRepository,
    warrantyRepo: WarrantyRepository,
    paymentGatewayRepo: PaymentGatewayRepository

    taxLogRepo: TaxLogRepository,

    accounts: {
        [key: string]: UserRepository<any>
    }

    //taxLogRepo
    //ta
}

function validate(
    payType: string
) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        const originalMethod = descriptor.value; // Save the original method



        descriptor.value = async function (...args: any[]) {
            const self = this as FinanceService<any>;
            try {
                await self.validatePayement(args[0], payType)
                const result = await originalMethod.apply(this, args);
                return result;
            } catch (error) {
                throw error
            }
        };

        return descriptor;
    }
}

export default class FinanceService<T extends Invoice> {
    repos: FinanceServiceOptions<T>
    domainRepo: DomainRepository

    constructor(options: FinanceServiceOptions<T>) {
        this.repos = options
        this.domainRepo = new DomainRepository()
    }

    ///////////////////////// wallet //////////////////////////
    async addWalletPaymentConfig(
        data: PaymentConfig,
        admin ?: AdminInfo
    ) {

        let configId = new Types.ObjectId()

        let transaction = await this.repos.transactionRepo.insert({
            _id: new Types.ObjectId(),
            type: "chargeAccount",
            amount: data.amount,
            status: "waiting",
            payType: data.payType || "payGateWay",
            ispaid: false,
            invoice: data.invoice as Types.ObjectId,
            info: data.info,
            owner: data.owner as Types.ObjectId,
            ownerType: data.ownerType,
            paymentConfig: configId,
            deadline: data.deadline
        } as any)


        let trakingCode = RandomGenarator.generateHashStr(10)

        const repo = this.repos.accounts[data.ownerType]
        if (repo == undefined) {
            throw new Error("اکانت یافت نشد")
        }

        let account = await repo.findById(data.owner as Types.ObjectId, {
            projection: {
                name: 1,
                family: 1,
                wallet: 1,
                email: 1,
                _id: 1,
                phoneNumber: 1
            }
        })
        if (account == null) {
            throw new Error("اکانت یافت نشد")
        }

        let paymentConfig = await this.repos.paymentConfigRepo.insert({
            _id: configId,
            invoice: data.invoice as Types.ObjectId,
            type: "simple",
            amount: data.amount,
            payFor: "chargeAccount",
            owner: data.owner as Types.ObjectId,
            ownerType: data.ownerType,
            transaction: transaction._id,
            deadline: data.deadline,
            payType: data.payType,
            info: data.info,
            trakingCode
        } as any)



        // smser

        try {
            await SmsMessager.send({
                parameters: {
                    trackingCode: trakingCode
                },
                receptor: account.phoneNumber,
                template: "increaseWalletReqAdded"
            })
        } catch (error) {

        }




        return {
            paymentConfig: paymentConfig,
            transaction

        }


    }

    async confirmLoan(
        id: string,
        data: LoanInput,
        admin: AdminInfo
    ) {
        try {
            let loanEnabled = await this.repos.systemConfigRepo.getConfigValue("loanEnabled")
            let loanTemplateEnabled = await this.repos.systemConfigRepo.getConfigValue("loanTemplateEnabled")
            let bankFeesEnabled = await this.repos.systemConfigRepo.getConfigValue("bankFeesEnabled")
            let exLoan = await this.repos.paymentConfigRepo.findOne({
                _id: id,
                type: "installment",
                payFor: "chargeAccount"
            })



            if (exLoan == null) {
                throw new Error("وام یفت نشد")
            }


            if (exLoan?.installmentConfig?.installmentConfirmed != false) {
                throw new Error("امکان تایید مجدد وام وجود ندارد")
            }

            if (loanEnabled != true) {
                throw new Error("امکان اعطای وام وجود ندارد‌(وام غیرفعال است)")
            }

            const repo = this.repos.accounts[exLoan.ownerType]
            if (repo == undefined) {
                throw new Error("اکانت یافت نشد")
            }

            let account = await repo.findById(exLoan.owner as Types.ObjectId, {
                projection: {
                    name: 1,
                    family: 1,
                    wallet: 1,
                    email: 1,
                    _id: 1,
                    phoneNumber: 1
                }
            })
            if (account == null) {
                throw new Error("اکانت یافت نشد")
            }

            if ("loanTemplate" in data.data) {
                if (loanTemplateEnabled != true) {
                    throw new Error("امکان اعطای وام وجود ندارد‌(طرح های وام غیرفعال است)")
                }
                let loanTemplate = await this.repos.loanTemplateRepo.findById(data.data.loanTemplate)


                if (loanTemplate == null) {
                    throw new Error("طرح وام یافت نشد ")
                }

                let dueDate = new Date(loanTemplate.dueDate)
                dueDate.setDate(dueDate.getDate() + 1)
                dueDate.setHours(3);
                dueDate.setMinutes(30)


                if (new Date() > dueDate) {
                    throw new Error("اعتبار این طرح ب پایان رسیده است")
                }

                let templatePeriod = undefined
                for (let i = 0; i < loanTemplate.periodes.length; i++) {

                    if (loanTemplate.periodes[i]._id.toHexString() == data.data.loanPeriod) {
                        templatePeriod = loanTemplate.periodes[i]
                        break
                    }
                }

                if (templatePeriod == undefined) {
                    throw Error("دوره وام یافت نشد")
                }

                let exLoanInstallmentConfig = undefined
                if (data.data.loanTemplate != (exLoan.installmentConfig.loanTemplate as Types.ObjectId).toHexString()
                    || data.data.loanPeriod != (exLoan.installmentConfig.loanPeriod as Types.ObjectId).toHexString()
                ) {
                    exLoanInstallmentConfig = exLoan.installmentConfig
                }
                else if (exLoan.exLoan != undefined) {
                    exLoanInstallmentConfig = exLoan.exLoan
                }


                let payment: PaymentConfig = {
                    type: "installment",
                    payFor: "chargeAccount",
                    amount: loanTemplate.amount,
                    status: "inproccess",
                    owner: data.owner,
                    ownerType: data.ownerType,
                    installmentConfig: {
                        prePay: 0,
                        formula: templatePeriod.formula,
                        remainedPrice: loanTemplate.amount,
                        totalPrice: loanTemplate.amount,
                        bankFees: templatePeriod.bankFees || 0,
                        loanTemplate: data.data.loanTemplate,
                        loanPeriod: data.data.loanPeriod,
                        interestRate: templatePeriod.interestRate,
                        period: 30,
                        count: templatePeriod.months,

                        installmentConfirmed: true,
                        nextStep: "documentSubmission",

                        exLoan: exLoanInstallmentConfig,

                        payType: data.payType
                    } as any

                } as any

                await this.repos.paymentConfigRepo.updateOne({ _id: id }, {
                    $set: payment
                })

            }


            else {
                let loanSetting = await this.repos.loanSettingRepo.findOne({
                    from: {
                        $lte: data.data.amount
                    },
                    to: {
                        $gte: data.data.amount
                    }
                }
                )
                if (loanSetting == null) {
                    throw new Error("تنظیمات وام برا مبلغ مورد نظر یافت نشد")
                }
                if (loanSetting.enabled != true) {
                    throw new Error("وام با مبلغ درخواستی در دسترس نیست")
                }

                let exLoanInstallmentConfig = undefined
                if (data.data.amount != exLoan.amount
                    || data.data.bankFees != exLoan.installmentConfig?.bankFees
                    || data.data.count != exLoan.installmentConfig?.count
                    || data.data.period != exLoan.installmentConfig?.period
                    || data.payType != exLoan.installmentConfig.payType

                    || data.data.formula != exLoan.installmentConfig.formula
                    || data.data.interestRate != exLoan.installmentConfig.interestRate
                ) {
                    exLoanInstallmentConfig = exLoan.installmentConfig
                }
                else if (exLoan.exLoan != undefined) {
                    exLoanInstallmentConfig = exLoan.exLoan
                }

                let payment: PaymentConfig = {
                    type: "installment",
                    payFor: "chargeAccount",
                    amount: data.data.amount,
                    status: "inproccess",
                    owner: data.owner,
                    ownerType: data.ownerType,
                    installmentConfig: {
                        prePay: 0,
                        formula: data.data.formula,
                        remainedPrice: data.data.amount,
                        totalPrice: data.data.amount,
                        bankFees: data.data.bankFees || 0,
                        interestRate: data.data.interestRate,
                        period: data.data.period || 30,
                        count: data.data.count,


                        installmentConfirmed: true,
                        nextStep: "documentSubmission",
                        exLoan: exLoanInstallmentConfig,
                        payType: data.payType

                    } as any

                } as any

                await this.repos.paymentConfigRepo.updateOne({ _id: id }, {
                    $set: payment
                })

            }

            try {
                await SmsMessager.send({
                    parameters: {
                        trackingCode: exLoan.trakingCode,
                        processTitle: "تایید‌اولیه"
                    },
                    receptor: account.phoneNumber,
                    template: "notifyLoanStatus"
                })
            } catch (error) {

            }




        } catch (error) {
            throw error
        }

    }

    async confirmLoanAtachement(
        id: string
    ) {
        try {
            let payment = await this.repos.paymentConfigRepo.findById(id)
            if (payment == null) {
                throw new Error("پرداخت یافت نشد")
            }
            let attachements = payment.loanAttchments || {}

            let array = ["birthCertificate", "nationalCard", "jobQualifications", "residenceInfo"]
            for (let i = 0; i < array.length; i++) {
                let files = attachements[array[i]]
                if (files == undefined || files.length == 0) {
                    throw new Error("مدارک تکمیل نشده است")
                }
            }

            let nextStep = "guarantors"


            await this.repos.paymentConfigRepo.updateOne({
                _id: id
            }, {
                $set: {
                    attachmentConfirmed: true,
                    "installmentConfig.nextStep": "guarantors"
                }
            })
        } catch (error) {
            throw error
        }
    }

    async addChecks(
        id: string,
        checks: Check[],
        payStart: Date,
        admin: AdminInfo,
        period?: number,
    ) {
        try {
            let paymentConfig = await this.repos.paymentConfigRepo.findOne({
                _id: id,
                type: "installment",
                payFor: "chargeAccount",
            })


            if (paymentConfig == null) {
                throw new Error("کانفیگ پرداخت یافت نشد")
            }

            if (paymentConfig.status != "inproccess") {
                throw new Error("وضعیت قابل تغییر نیست")
            }

            if (paymentConfig.installmentConfig == undefined) {

                throw new Error("اطلاعات پرداخت وارد نشده است")

            }

            if (paymentConfig.installmentConfig?.installmentConfirmed != true) {
                throw new Error("این وام قابل تغییر نیست")
            }

            if (paymentConfig.installmentConfig.payType == "check"
                && (checks.length != paymentConfig.installmentConfig.count)) {
                throw new Error("اطلاعات چک وارد نشده است")
            }

            const repo = this.repos.accounts[paymentConfig.ownerType]
            if (repo == undefined) {
                throw new Error("اکانت یافت نشد")
            }

            let account = await repo.findById(paymentConfig.owner as Types.ObjectId, {
                projection: {
                    name: 1,
                    family: 1,
                    wallet: 1,
                    email: 1,
                    _id: 1,
                    phoneNumber: 1
                }
            })
            if (account == null) {
                throw new Error("اکانت یافت نشد")
            }



            let schedules: Schedule[]
            if (paymentConfig.installmentConfig.formula == "banking") {
                schedules = this.repos.paymentConfigRepo.calculateEMI(
                    paymentConfig.amount,
                    paymentConfig.installmentConfig.interestRate,
                    paymentConfig.installmentConfig.count,
                    paymentConfig.installmentConfig.prePay,
                    paymentConfig.installmentConfig.period,
                    payStart.toISOString(),
                    period
                );
            }
            else {
                schedules = this.repos.paymentConfigRepo.calculateEMIMarket(
                    paymentConfig.amount,
                    paymentConfig.installmentConfig.interestRate,
                    paymentConfig.installmentConfig.count,
                    paymentConfig.installmentConfig.prePay,
                    paymentConfig.installmentConfig.period,
                    payStart.toISOString(),
                    period
                );
            }


            let delInstallments = await this.repos.installmentRepo.findAll({
                paymentConfig: paymentConfig._id
            })
            for (let i = 0; i < delInstallments.length; i++) {
                await this.repos.transactionRepo.findOneAndDelete({
                    installmentId: delInstallments[i]._id
                })
            }
            await this.repos.installmentRepo.deleteMany({
                paymentConfig: paymentConfig._id
            })



            const configId = paymentConfig._id




            paymentConfig.installmentConfig.lastInstallmentDeadline = schedules[schedules.length - 1].dueDateGregorian


            await this.repos.paymentConfigRepo.updateOne({
                _id: id
            }, {
                $set: {
                    "installmentConfig.lastInstallmentDeadline": schedules[schedules.length - 1].dueDateGregorian,
                    "installmentConfig.remainedPrice": paymentConfig.installmentConfig.totalPrice,
                    "installmentConfig.payStart": payStart,
                    "installmentConfig.nextStep": "finalApproval",
                    "installmentConfig.restPeriod": period
                }
            })


            let installments: any[] = []

            let allNotes = (paymentConfig.installmentConfig as any).notes || []
            let prePayTransactionId = undefined

            if (paymentConfig.installmentConfig.prePay > 0) {
                if (paymentConfig.installmentConfig.prePayCheck != undefined) {
                    prePayTransactionId = new Types.ObjectId()
                    this.repos.transactionRepo.insert({
                        _id: prePayTransactionId,
                        type: "prePay",
                        amount: paymentConfig.installmentConfig.prePay,
                        payType: "check",
                        status: "waiting",
                        ispaid: false,
                        attachments: [],
                        paymentConfig: configId,
                        info: {
                            number: paymentConfig.installmentConfig.prePayCheck?.number,
                            saiadNumber: paymentConfig.installmentConfig.prePayCheck?.saiadNumber,
                            bank: paymentConfig.installmentConfig.prePayCheck?.bank,
                            branch: paymentConfig.installmentConfig.prePayCheck?.branch
                        },
                        owner: paymentConfig.owner as Types.ObjectId,
                        ownerType: paymentConfig.ownerType,

                    } as any, {})
                }
            }



            for (let i = 0; i < schedules.length; i++) {
                let notes = allNotes[i] || []
                let resNotes = []
                for (let j = 0; j < notes.length; j++) {
                    resNotes.push({
                        note: notes[j],
                        admin: admin._id,
                        date: new Date()
                    })

                }
                let transactionId = undefined
                let installmentId = new Types.ObjectId()
                if (paymentConfig.installmentConfig.payType == "check") {
                    transactionId = new Types.ObjectId()
                    let checkinfo = checks[i]

                    this.repos.transactionRepo.insert(
                        {
                            _id: transactionId,
                            type: "chargeAccountInstallment",
                            amount: parseInt(schedules[i].emi),
                            invoice: paymentConfig.invoice as Types.ObjectId,
                            payType: "check",
                            status: "waiting",
                            ispaid: false,
                            attachments: [],
                            installmentId,
                            info: checkinfo,
                        } as any, {}
                    )

                }
                let installment = await this.repos.installmentRepo.collection.create([{
                    _id: installmentId,
                    transactions: transactionId != undefined ? [transactionId] : [],
                    transactionId,
                    number: schedules[i].number,
                    netPrice: parseInt(schedules[i].principalPayment),
                    interest: parseInt(schedules[i].interest),
                    penalty: 0,
                    finalPrice: parseInt(schedules[i].emi),
                    deadline: schedules[i].dueDateGregorian,
                    notes: resNotes,
                    owner: paymentConfig.owner as Types.ObjectId,
                    ownerType: paymentConfig.ownerType,
                    paymentConfig: configId
                } as any], {
                })

                installments.push(installment)
            }


            try {
                await SmsMessager.send({
                    template: "checksAdded",
                    parameters: {
                        trackingCode: paymentConfig.trakingCode
                    },
                    receptor: account.phoneNumber
                })
            } catch (error) {

            }

            return {
                paymentConfig,
                installments
            }



        } catch (error) {
            throw error
        }
    }

    async getWarrantyConfig(id: string) {
        try {
            let loan = await this.repos.paymentConfigRepo.findOne({
                _id: id,
                installmentConfig: {
                    $exists: true
                }
            })
            if (loan == null) {
                throw new Error("وام یافت نشد")
            }
            if (loan.installmentConfig?.loanTemplate) {
                let loanTemplate = await this.repos.loanTemplateRepo.findById(loan.installmentConfig?.loanTemplate)

                if (loanTemplate == null) {
                    throw new Error("طرح وام یافت نشد")
                }
                let loanPeriod = undefined
                for (let i = 0; i < loanTemplate.periodes.length; i++) {
                    if (loanTemplate.periodes[i]._id.toHexString() == (loan.installmentConfig.loanPeriod as Types.ObjectId).toHexString()) {
                        loanPeriod = loanTemplate.periodes[i]
                        break
                    }
                }
                if (loanPeriod == undefined) {
                    throw new Error("دوره طرح وام مشخص نشده است")
                }

                let deed = Math.floor(loan.amount * (1 + (loanPeriod.warranty.deed.min / 100)))
                let deedEnable = loanPeriod.warranty.deed.enabled

                let personal = Math.floor(loan.amount * (1 + (loanPeriod.warranty.personal.min / 100)))
                let personalCount = loanPeriod.warranty.personal.guarantorsCount

                return {
                    deed,
                    deedEnable,
                    personal,
                    personalCount
                }


            }

            else {
                let loanSetting = await this.repos.loanSettingRepo.findOne({
                    from: {
                        $lte: loan.amount
                    },
                    to: {
                        $gte: loan.amount
                    }
                })
                if (loanSetting == null) {
                    throw new Error("تنظیمات وام یافت نشد")
                }

                let deed = Math.floor(loan.amount * (1 + (loanSetting.deed.min / 100)))
                let deedEnable = loanSetting.deed.enabled

                let personal = Math.floor(loan.amount * (1 + (loanSetting.personal.min / 100)))
                let personalCount = loanSetting.personal.guarantorsCount

                return {
                    deed,
                    deedEnable,
                    personal,
                    personalCount
                }

            }
        } catch (error) {
            throw error
        }
    }

    async addInstallmentsPayments(paymentId: string, payType: string, payFor: string) {
        try {
            let installments = await this.repos.installmentRepo.findAll({
                paymentConfig: paymentId
            }, {}, [{
                path: "transactions"
            }])
            for (let i = 0; i < installments.length; i++) {
                const trakingCode = RandomGenarator.generateHashStr(8)
                let paymentId = new Types.ObjectId()
                await this.repos.paymentConfigRepo.insert({
                    _id: paymentId,
                    type: "simple",
                    payFor,
                    payType,
                    info: (installments[i].transactions as any)[0]?.info || {},
                    deadline: installments[i].deadline,
                    amount: installments[i].finalPrice,
                    status: "inproccess",
                    trakingCode,
                    owner: installments[i].owner,
                    ownerType: installments[i].ownerType,
                    installment: installments[i]._id
                } as any)

                await this.repos.installmentRepo.addInstallmentPayment(
                    installments[i]._id,
                    paymentId.toHexString()
                )
                await this.repos.transactionRepo.updateOne({
                    installmentId: installments[i]._id
                }, {
                    $set: {
                        status: "confirmed"
                    }
                })
            }
        } catch (error) {
            console.log("error")
            throw error
        }
    }



    async validateLoan(data: LoanInput) {


    }

    async createLoan(
        data: LoanInput,
        admin: AdminInfo
    ) {
        try {
            let loanEnabled = await this.repos.systemConfigRepo.getConfigValue("loanEnabled")
            let loanTemplateEnabled = await this.repos.systemConfigRepo.getConfigValue("loanTemplateEnabled")
            let bankFeesEnabled = await this.repos.systemConfigRepo.getConfigValue("bankFeesEnabled")

            if (loanEnabled != true) {
                throw new Error("امکان اعطای وام وجود ندارد‌(وام غیرفعال است)")
            }

            const repo = this.repos.accounts[data.ownerType]
            if (repo == undefined) {
                throw new Error("اکانت یافت نشد")
            }

            let account = await repo.getInfo(data.owner as string)
            if (account == null) {
                throw new Error("اکانت یافت نشد")
            }

            if ("loanTemplate" in data.data) {
                if (loanTemplateEnabled != true) {
                    throw new Error("امکان اعطای وام وجود ندارد‌(طرح های وام غیرفعال است)")
                }
                let loanTemplate = await this.repos.loanTemplateRepo.findById(data.data.loanTemplate)


                if (loanTemplate == null) {
                    throw new Error("طرح وام یافت نشد ")
                }

                let dueDate = new Date(loanTemplate.dueDate)
                dueDate.setDate(dueDate.getDate() + 1)
                dueDate.setHours(3);
                dueDate.setMinutes(30);

                if (new Date() > dueDate) {
                    throw new Error("اعتبار این طرح ب پایان رسیده است")
                }

                let templatePeriod = undefined
                for (let i = 0; i < loanTemplate.periodes.length; i++) {

                    if (loanTemplate.periodes[i]._id.toHexString() == data.data.loanPeriod) {
                        templatePeriod = loanTemplate.periodes[i]
                        break
                    }
                }

                if (templatePeriod == undefined) {
                    throw Error("دوره وام یافت نشد")
                }


                let trakingCode = RandomGenarator.generateHashStr(10)
                let payment: PaymentConfig = {
                    type: "installment",
                    payFor: "chargeAccount",
                    amount: loanTemplate.amount,
                    status: "inproccess",
                    trakingCode,
                    owner: data.owner,
                    ownerType: data.ownerType,
                    installmentConfig: {
                        prePay: 0,
                        formula: templatePeriod.formula,
                        remainedPrice: loanTemplate.amount,
                        totalPrice: loanTemplate.amount,
                        bankFees: templatePeriod.bankFees || 0,
                        loanTemplate: data.data.loanTemplate,
                        loanPeriod: data.data.loanPeriod,
                        interestRate: templatePeriod.interestRate,
                        period: 30,
                        count: templatePeriod.months,

                    } as any

                } as any

                let paymentConfig = await this.repos.paymentConfigRepo.insert(payment)

                try {
                    await this.repos.warrantyRepo.insert({
                        paymentConfig: paymentConfig._id,
                        isOwn: true,
                        warrantor: {
                            nameAndFamily: account.name + " " + account.family,
                            fatherName: " ",
                            birthCertificateNumber: " ",

                            gender: account.gender || "male",

                            email: account.email,
                            emailVirified : true,
                            phone: account.phoneNumber,
                            phoneVirified: true,
                            address: account.address?._id,

                            telephone: account.phoneNumber,
                            workAddrress: account.workAddress._id,
                            workTelephone: account.workPhone,
                            jobTitle: account.job,

                            nationalCode: account.nationalCode || " ",

                        }
                    } as any)
                } catch (error) {
                    // console.log(error)
                }

                // smser loan

                try {
                    await SmsMessager.send({
                        receptor: account.phoneNumber,
                        parameters: {
                            trackingCode: trakingCode
                        },
                        template: "createLoan"
                    })
                } catch (error) {

                }


                return paymentConfig




            }


            else {
                let loanSetting = await this.repos.loanSettingRepo.findOne({
                    from: {
                        $lte: data.data.amount
                    },
                    to: {
                        $gte: data.data.amount
                    }
                }
                )
                if (loanSetting == null) {
                    throw new Error("تنظیمات وام برا مبلغ مورد نظر یافت نشد")
                }
                if (loanSetting.enabled != true) {
                    throw new Error("وام با مبلغ درخواستی در دسترس نیست")
                }

                let trakingCode = RandomGenarator.generateHashStr(10)
                let payment: PaymentConfig = {
                    type: "installment",
                    payFor: "chargeAccount",
                    amount: data.data.amount,
                    status: "inproccess",
                    trakingCode,
                    owner: data.owner,
                    ownerType: data.ownerType,
                    installmentConfig: {
                        prePay: 0,
                        formula: data.data.formula,
                        remainedPrice: data.data.amount,
                        totalPrice: data.data.amount,
                        bankFees: data.data.bankFees || 0,
                        // loanTemplate: data.data.loanTemplate,
                        // loanPeriod: data.data.loanPeriod,
                        interestRate: data.data.interestRate,
                        period: data.data.period || 30,
                        count: data.data.count,

                    } as any

                } as any

                let paymentConfig = await this.repos.paymentConfigRepo.insert(payment)

                //smser loan
                try {
                    await SmsMessager.send({
                        parameters: {
                            trackingCode: trakingCode
                        },
                        receptor: account.phoneNumber,
                        template: "createLoan"
                    })
                } catch (error) {

                }

                try {
                    await this.repos.warrantyRepo.insert({
                        paymentConfig: paymentConfig._id,
                        isOwn: true,
                        warrantor: {
                            nameAndFamily: account.name + " " + account.family,
                            fatherName: " ",
                            birthCertificateNumber: " ",

                            gender: account.gender || "male",

                            email: account.email,
                            emailVirified : true,
                            phone: account.phoneNumber,
                            phoneVirified: true,
                            address: account.address?._id,

                            telephone: account.phoneNumber,
                            workAddrress: account.workAddress._id,
                            workTelephone: account.workPhone,
                            jobTitle: account.job,

                            nationalCode: account.nationalCode || " ",

                        }
                    } as any)
                } catch (error) {

                    console.log(error)
                }

                return paymentConfig
            }

        } catch (error) {
            throw error
        }
    }

    async editLoan(
        id: string,
        data: LoanInput,
        admin: AdminInfo
    ) {
        try {
            let loanEnabled = await this.repos.systemConfigRepo.getConfigValue("loanEnabled")
            let loanTemplateEnabled = await this.repos.systemConfigRepo.getConfigValue("loanTemplateEnabled")
            let bankFeesEnabled = await this.repos.systemConfigRepo.getConfigValue("bankFeesEnabled")

            if (loanEnabled != true) {
                throw new Error("امکان اعطای وام وجود ندارد‌(وام غیرفعال است)")
            }

            const loan = await this.repos.paymentConfigRepo.findById(id)

            if (loan == null) {
                throw Error("وام یافت نشد")
            }

            if (loan.payFor != "chargeAccount") {
                throw Error("وام یافت نشد")
            }

            if (loan.installmentConfig?.installmentConfirmed != false) {
                throw Error("این وام قبلا تایید شده است")
            }

            const repo = this.repos.accounts[data.ownerType]
            if (repo == undefined) {
                throw new Error("اکانت یافت نشد")
            }

            let account = await repo.findById(data.owner as string, {
                projection: {
                    name: 1,
                    family: 1,
                    wallet: 1,
                    email: 1,
                    _id: 1,
                    phoneNumber: 1
                }
            })
            if (account == null) {
                throw new Error("اکانت یافت نشد")
            }

            if ("loanTemplate" in data.data) {
                if (loanTemplateEnabled != true) {
                    throw new Error("امکان اعطای وام وجود ندارد‌(طرح های وام غیرفعال است)")
                }
                let loanTemplate = await this.repos.loanTemplateRepo.findById(data.data.loanTemplate)


                if (loanTemplate == null) {
                    throw new Error("طرح وام یافت نشد ")
                }

                let dueDate = new Date(loanTemplate.dueDate)
                dueDate.setDate(dueDate.getDate() + 1)
                dueDate.setHours(3);
                dueDate.setMinutes(30)

                if (new Date() > dueDate) {
                    throw new Error("اعتبار این طرح ب پایان رسیده است")
                }

                let templatePeriod = undefined
                for (let i = 0; i < loanTemplate.periodes.length; i++) {

                    if (loanTemplate.periodes[i]._id.toHexString() == data.data.loanPeriod) {
                        templatePeriod = loanTemplate.periodes[i]
                        break
                    }
                }

                if (templatePeriod == undefined) {
                    throw Error("دوره وام یافت نشد")
                }


                let exLoanInstallmentConfig = undefined
                if (data.data.loanTemplate != (loan.installmentConfig.loanTemplate as Types.ObjectId).toHexString()
                    || data.data.loanPeriod != (loan.installmentConfig.loanPeriod as Types.ObjectId).toHexString()
                ) {
                    exLoanInstallmentConfig = loan.installmentConfig
                }
                else if (loan.exLoan != undefined) {
                    exLoanInstallmentConfig = loan.exLoan
                }

                let payment: PaymentConfig = {
                    amount: loanTemplate.amount,
                    installmentConfig: {
                        prePay: 0,
                        formula: templatePeriod.formula,
                        remainedPrice: loanTemplate.amount,
                        totalPrice: loanTemplate.amount,
                        bankFees: templatePeriod.bankFees || 0,
                        loanTemplate: data.data.loanTemplate,
                        loanPeriod: data.data.loanPeriod,
                        interestRate: templatePeriod.interestRate,
                        period: 30,
                        count: templatePeriod.months,

                    },
                    exLoan: exLoanInstallmentConfig


                } as any

                await this.repos.paymentConfigRepo.updateOne({
                    _id: id
                }, {
                    $set: payment,
                })


                try {
                    await SmsMessager.send({
                        receptor: account.phoneNumber,
                        parameters: {
                            trackingCode: loan.trakingCode
                        },
                        template: "loanEdited"
                    })
                } catch (error) {

                }




            }


            else {
                let loanSetting = await this.repos.loanSettingRepo.findOne({
                    from: {
                        $lte: data.data.amount
                    },
                    to: {
                        $gte: data.data.amount
                    }
                }
                )
                if (loanSetting == null) {
                    throw new Error("تنظیمات وام برا مبلغ مورد نظر یافت نشد")
                }
                if (loanSetting.enabled != true) {
                    throw new Error("وام با مبلغ درخواستی در دسترس نیست")
                }

                let exLoanInstallmentConfig = undefined
                if (data.data.amount != loan.amount
                    || data.data.bankFees != loan.installmentConfig?.bankFees
                    || data.data.count != loan.installmentConfig?.count
                    || data.data.period != loan.installmentConfig?.period
                    || data.payType != loan.installmentConfig.payType

                    || data.data.formula != loan.installmentConfig.formula
                    || data.data.interestRate != loan.installmentConfig.interestRate
                ) {
                    exLoanInstallmentConfig = loan.installmentConfig
                }
                else if (loan.exLoan != undefined) {
                    exLoanInstallmentConfig = loan.exLoan
                }

                let payment: PaymentConfig = {
                    amount: data.data.amount,
                    installmentConfig: {
                        prePay: 0,
                        formula: data.data.formula,
                        remainedPrice: data.data.amount,
                        totalPrice: data.data.amount,
                        bankFees: data.data.bankFees || 0,
                        interestRate: data.data.interestRate,
                        period: data.data.period || 30,
                        count: data.data.count,

                    } as any,
                    exLoan: exLoanInstallmentConfig

                } as any


                await this.repos.paymentConfigRepo.updateOne({
                    _id: id
                }, {
                    $set: payment,
                })

                try {
                    await SmsMessager.send({
                        receptor: account.phoneNumber,
                        parameters: {
                            trackingCode: loan.trakingCode
                        },
                        template: "loanEdited"
                    })
                } catch (error) {

                }


            }


        } catch (error) {
            throw error
        }
    }

    async changeLoanPayType(id: string, type: "check" | "payGateWay") {
        try {
            const payment = await this.repos.paymentConfigRepo.findById(id)
            if (payment == null) {
                throw new Error("این پرداخت یافت نشد")
            }

            if (payment.payFor != "chargeAccount" || payment.type != "installment" || payment.installmentConfig == undefined) {
                throw new Error("پرداخت نامعتبر")
            }

            let installments = await this.repos.installmentRepo.findAll({
                paymentConfig: payment._id
            })

            if (installments.length > 0) {
                throw new Error("امکان تغییر شیوه پرداخت وجود ندارد")
            }

            let q: any = {
                "installmentConfig.payType": type
            }

            if (payment.installmentConfig.payType == "check" && type == "payGateWay") {
                if (payment.installmentConfig.nextStep == "checks") {
                    q["installmentConfig.nextStep"] = "finalApproval"
                }
            }
            else if (payment.installmentConfig.payType == "payGateWay" && type == "check") {
                if (payment.installmentConfig.nextStep == "finalApproval") {
                    q["installmentConfig.nextStep"] = "checks"
                }
            }
            return await this.repos.paymentConfigRepo.updateOne({
                _id: id
            }, {
                $set: q
            })
            // if(paymen)
            // this.repos.installmentRepo.insert({

            // })
        } catch (error) {
            throw error
        }
    }

    async depositLoan(id: string, startDate?: Date, period?: number) {
        const session = await mongoose.startSession();
        session.startTransaction({

        });
        try {


            let payment = await this.repos.paymentConfigRepo.findById(id)
            if (payment == null) {
                throw new Error("وام یافت نشد")
            }
            if (payment.payFor != "chargeAccount") {
                throw new Error("وام یافت نشد")

            }
            if (payment.type != "installment") {
                throw new Error("وام یافت نشد")
            }

            if (payment.status != "finished") {
                throw new Error("امکان واریز وجه وجود ندارد")
            }

            if (payment.loanDeposited == true) {
                throw new Error("این وام قبلا واریز شده است")
            }


            const repo = this.repos.accounts[payment.ownerType]
            if (repo == undefined) {
                throw new Error("اکانت یافت نشد")
            }

            let account = await repo.findById(payment.owner as string, {

            })

            if (account == null) {
                throw new Error("اکانت یافت نشد")
            }

            let q: any = {
                loanDeposited: true,
                "installmentConfig.depositAt": new Date()
            }

            if (payment.installmentConfig?.payType == "payGateWay") {


                if (startDate == undefined) {
                    throw new Error("زمان شروع اقساط وارد نشده است")
                }

                let schedules: Schedule[]
              
                if (payment.installmentConfig.formula == "banking") {
                    schedules = this.repos.paymentConfigRepo.calculateEMI(
                        payment.amount,
                        payment.installmentConfig.interestRate,
                        payment.installmentConfig.count,
                        payment.installmentConfig.prePay,
                        payment.installmentConfig.period,
                        startDate.toISOString(),
                        period
                    );
                }
                else {
                    schedules = this.repos.paymentConfigRepo.calculateEMIMarket(
                        payment.amount,
                        payment.installmentConfig.interestRate,
                        payment.installmentConfig.count,
                        payment.installmentConfig.prePay,
                        payment.installmentConfig.period,
                        startDate.toISOString(),
                        period
                    );
                }



                let delInstallments = await this.repos.installmentRepo.findAll({
                    paymentConfig: payment._id
                })

                for (let i = 0; i < delInstallments.length; i++) {
                    await this.repos.transactionRepo.findOneAndDelete({
                        installmentId: delInstallments[i]._id
                    })
                }
                await this.repos.installmentRepo.deleteMany({
                    paymentConfig: payment._id
                })

                for (let i = 0; i < schedules.length; i++) {
                    let notes = []

                    let transactionId = undefined
                    let installmentId = new Types.ObjectId()

                    let installment = await this.repos.installmentRepo.collection.create([{
                        _id: installmentId,
                        transactions: transactionId != undefined ? [transactionId] : [],
                        transactionId,
                        number: schedules[i].number,
                        netPrice: parseInt(schedules[i].principalPayment),
                        interest: parseInt(schedules[i].interest),
                        penalty: 0,
                        finalPrice: parseInt(schedules[i].emi),
                        deadline: schedules[i].dueDateGregorian,
                        notes: [],
                        owner: payment.owner as Types.ObjectId,
                        ownerType: payment.ownerType,
                        paymentConfig: payment._id,
                        status: "duringPayment"
                    } as any], {
                    })

                    // installments.push(installment)
                }

                q["installmentConfig.restPeriod"] = period
            }

            await this.addInstallmentsPayments(id, payment.installmentConfig?.payType || "payGateWay", "loan")



            let res = await this.repos.paymentConfigRepo.updateOne({
                _id: payment._id,
                loanDeposited: {
                    $ne: true
                }
            }, {
                $set: q
            })
            if (res.modifiedCount == 1) {
                await repo?.increaseWallet(account._id, payment.amount, session)
            }



        } catch (error) {
            await session.abortTransaction();
            throw error
        }
    }

    async rejectLoan() {

    }

    async getOwnerWallet(
        owner: string,
        ownerType: string
    ) {
        try {
            const repo = this.repos.accounts[ownerType]
            if (repo == undefined) {
                throw new Error("اکانت یافت نشد")
            }
            let account = await repo.findById(owner, {
                projection: {
                    name: 1,
                    family: 1,
                    wallet: 1,
                    email: 1,
                    _id: 1,
                    phoneNumber: 1
                }
            })
            if (account == null) {
                throw new Error("اکانت یافت نشد")
            }

            return account.wallet || 0
        } catch (error) {
            console.log(error)
            throw error
        }
    }


    ////////////////////////  wallet //////////////////////////



    ////////////////////////  invoice /////////////////////////

    async sendPenaltyPayLink(id: string) {
        const session = await mongoose.startSession();
        session.startTransaction({

        });

        try {
            const payment = await this.repos.paymentConfigRepo.findOne({
                $or: [
                    {
                        _id: id,
                    },
                    {
                        installment: id
                    }
                ]
            }, {}, [{
                path: "owner"
            }])

            if (payment == null) {
                throw new Error("کانفیگ پرداخت یافت نشد")
            }
            if (payment.owner == null || payment.owner != undefined) {
                throw new Error("کانفیگ پرداخت یافت نشد")
            }

            if (payment.installment != undefined) {
                let installment = await this.repos.installmentRepo.findById(payment.installment as string)
                if (installment == null) {
                    throw new Error("قسط یافت نشد")
                }
                const account = payment.owner as BaseUser

                const accountRepo = this.repos.accounts[payment.ownerType]

                if (accountRepo == undefined) {
                    throw new Error("قسط یافت نشد")
                }


                let status = installment.status == "paidWithoutPenalty" ? "paidWithDelay" : installment.status

                await this.repos.installmentRepo.updateOne({
                    _id: payment.installment
                }, {
                    $set: {
                        penalty: 0,
                        penaltypaid: true,
                        status
                    }
                })

                await this.repos.paymentConfigRepo.updateOne({
                    _id: payment._id
                }, {
                    $set: {
                        penalty: 0,
                        penaltypaid: true
                    }
                })
                const trakingCode = RandomGenarator.generateHashStr(10)
                await this.repos.paymentConfigRepo.insert({
                    payFor: "penalty",
                    type: "simple",
                    payType: "payGateWay",
                    invoice: payment.invoice,
                    amount: installment.penalty,
                    status: "inproccess",
                    trakingCode,
                    owner: payment.owner,
                    ownerType: payment.ownerType,
                    installment: installment._id,
                    paidAmount: installment.penalty,
                    paidAt: new Date(),
                } as any)

                const domain = await this.domainRepo.findOne({
                    isDefault: true
                })
                if (domain != null) {
                    const link = `https://${domain.domain}/pay/${trakingCode}`
                    await SmsMessager.send({
                        parameters: {
                            paymentLink: link
                        },
                        receptor: account.phoneNumber,
                        template: "paymentLink"
                    })
                    return link


                }


            }

            else {
                const account = payment.owner as BaseUser

                const accountRepo = this.repos.accounts[payment.ownerType]

                if (accountRepo == undefined) {
                    throw new Error("قسط یافت نشد")
                }



                await accountRepo?.increaseWallet(account._id, payment.penalty || 0, session)

                await this.repos.paymentConfigRepo.updateOne({
                    _id: payment._id
                }, {
                    $set: {
                        penalty: 0,
                        penaltypaid: true
                    }
                })

                const trakingCode = RandomGenarator.generateHashStr(10)

                await this.repos.paymentConfigRepo.insert({
                    payFor: "penalty",
                    type: "simple",
                    payType: "payGateWay",
                    invoice: payment.invoice,
                    amount: payment.penalty,
                    status: "inproccess",
                    trakingCode,
                    owner: payment.owner,
                    ownerType: payment.ownerType,
                    payment: payment._id,
                    paidAmount: payment.penalty,
                    paidAt: new Date(),


                } as any)



                const domain = await this.domainRepo.findOne({
                    isDefault: true
                })
                if (domain != null) {
                    const link = `https://${domain.domain}/pay/${trakingCode}`
                    await SmsMessager.send({
                        parameters: {
                            paymentLink: link
                        },
                        receptor: account.phoneNumber,
                        template: "paymentLink"
                    })
                    return link

                }

            }
        } catch (error) {
            throw error
        }
    }

    async payPenaltyFromWallet(id: string) {
        const session = await mongoose.startSession();
        session.startTransaction({

        });

        try {
            const payment = await this.repos.paymentConfigRepo.findOne({
                $or: [
                    {
                        _id: id,
                    },
                    {
                        installment: id
                    }
                ]
            }, {}, [{
                path: "owner"
            }])

            if (payment == null) {
                throw new Error("کانفیگ پرداخت یافت نشد")
            }
            if (payment.owner == null || payment.owner != undefined) {
                throw new Error("کانفیگ پرداخت یافت نشد")
            }

            if (payment.installment != undefined) {
                let installment = await this.repos.installmentRepo.findById(payment.installment as string)
                if (installment == null) {
                    throw new Error("قسط یافت نشد")
                }
                const account = payment.owner as BaseUser

                const accountRepo = this.repos.accounts[payment.ownerType]

                if (accountRepo == undefined) {
                    throw new Error("قسط یافت نشد")
                }

                if (account.wallet == undefined || account.wallet == 0 || account.wallet < installment.penalty) {
                    throw new Error("موجودی ناکافی")
                }

                await accountRepo?.increaseWallet(account._id, installment.penalty, session)
                let status = installment.status == "paidWithoutPenalty" ? "paidWithDelay" : installment.status

                await this.repos.installmentRepo.updateOne({
                    _id: payment.installment
                }, {
                    $set: {
                        penalty: 0,
                        penaltypaid: true,
                        status
                    }
                })

                await this.repos.paymentConfigRepo.updateOne({
                    _id: payment._id
                }, {
                    $set: {
                        penalty: 0,
                        penaltypaid: true
                    }
                })

                await this.repos.paymentConfigRepo.insert({
                    payFor: "penalty",
                    type: "simple",
                    payType: "wallet",
                    invoice: payment.invoice,
                    amount: installment.penalty,
                    status: "finished",
                    trakingCode: RandomGenarator.generateHashStr(10),
                    owner: payment.owner,
                    ownerType: payment.ownerType,
                    installment: installment._id,
                    paidAmount: installment.penalty,
                    paidAt: new Date(),


                } as any)


            }

            else {
                const account = payment.owner as BaseUser

                const accountRepo = this.repos.accounts[payment.ownerType]

                if (accountRepo == undefined) {
                    throw new Error("قسط یافت نشد")
                }

                if (account.wallet == undefined || account.wallet == 0 || account.wallet < (payment.penalty || 0)) {
                    throw new Error("موجودی ناکافی")
                }

                await accountRepo?.increaseWallet(account._id, payment.penalty || 0, session)

                await this.repos.paymentConfigRepo.updateOne({
                    _id: payment._id
                }, {
                    $set: {
                        penalty: 0,
                        penaltypaid: true
                    }
                })

                await this.repos.paymentConfigRepo.insert({
                    payFor: "penalty",
                    type: "simple",
                    payType: "wallet",
                    invoice: payment.invoice,
                    amount: payment.penalty,
                    status: "finished",
                    trakingCode: RandomGenarator.generateHashStr(10),
                    owner: payment.owner,
                    ownerType: payment.ownerType,
                    payment: payment._id,
                    paidAmount: payment.penalty,
                    paidAt: new Date(),


                } as any)
            }

        } catch (error) {
            throw error
        }
    }

    async addPaymentConfig(data: PaymentConfig, admin?: AdminInfo) {
        const session = await mongoose.startSession();
        session.startTransaction({

        });
        try {


            let trakingCode = RandomGenarator.generateHashStr(10)


            let invoice = await this.repos.invoiceRepo.findById(data.invoice as string)
            if (invoice == null) {
                return {
                    status: 404,
                }
            }

            const repo = this.repos.accounts[invoice.ownerType]
            if (repo == undefined) {
                throw new Error("اکانت یافت نشد")
            }

            let account = await repo.findById(invoice.owner as Types.ObjectId, {
                projection: {
                    name: 1,
                    family: 1,
                    wallet: 1,
                    email: 1,
                    _id: 1,
                    phoneNumber: 1
                }
            })
            if (account == null) {
                throw new Error("اکانت یافت نشد")
            }

            let paymentConfig = await this.repos.paymentConfigRepo.findOne({
                invoice: data.invoice,
                status: "inproccess"
            })

            if (invoice.status == "paid") {
                return {
                    status: 400,
                    message: "این فاکتور پرداخت شده است"
                }
            }

            if (invoice.status == "canceled") {
                return {
                    status: 400,
                    message: "این فاکتور لغو شده است"
                }
            }
            if (invoice.status == "expired") {
                return {
                    status: 400,
                    message: "این فاکتور منقضی شده است"
                }
            }
            if (invoice.remainedPrice - (invoice.waitForConfirmPrice + invoice.unrefinedPrice) < data.amount) {
                return {
                    status: 400,
                    message: "مبلغ وارد شده بیشتر از مبلغ باقیمانده است"
                }
            }



            if (data.type == "installment") {
                if (data.installmentConfig == undefined) {
                    return {
                        status: 400,
                        message: "اطلاعات پرداخت وارد نشده است"
                    }
                }
                if (data.installmentConfig.payType == "check"
                    && (data.installmentConfig.checks == undefined || data.installmentConfig.checks.length != data.installmentConfig.count)
                ) {
                    return {
                        status: 400,
                        message: "اطلاعات چک وارد نشده است"
                    }
                }
                let schedules: Schedule[]
                if (data.installmentConfig.formula == "banking") {
                    schedules = this.repos.paymentConfigRepo.calculateEMI(
                        data.amount,
                        data.installmentConfig.interestRate,
                        data.installmentConfig.count,
                        data.installmentConfig.prePay,
                        data.installmentConfig.period,
                        data.installmentConfig.payStart.toISOString()
                    );
                }
                else {
                    schedules = this.repos.paymentConfigRepo.calculateEMIMarket(
                        data.amount,
                        data.installmentConfig.interestRate,
                        data.installmentConfig.count,
                        data.installmentConfig.prePay,
                        data.installmentConfig.period,
                        data.installmentConfig.payStart.toISOString(),
                    );
                }


                // session.startTransaction()
                const configId = new Types.ObjectId()
                data._id = configId
                data.status = "waiting"
                data.installmentConfig.totalPrice = parseInt(schedules[0].emi) * schedules.length
                data.installmentConfig.remainedPrice = data.installmentConfig.totalPrice
                data.owner = invoice.owner
                data.ownerType = invoice.ownerType

                data.trakingCode = trakingCode


                data.installmentConfig.lastInstallmentDeadline = schedules[schedules.length - 1].dueDateGregorian

                const paymentConfig = await this.repos.paymentConfigRepo.collection.create([data as any], {
                    // session
                })

                // smser    
                try {
                    await SmsMessager.send({
                        template: "invoicePayment",
                        receptor: account.phoneNumber,
                        parameters: {
                            trackingCode: trakingCode,
                            facorNumber: invoice.factorNumber,
                            remainingAmount: invoice.remainedPrice - (invoice.waitForConfirmPrice + invoice.unrefinedPrice + data.amount)
                        }
                    })
                } catch (error) {

                }



                let installments: any[] = []

                let allNotes = (data.installmentConfig as any).notes

                let prePayTransactionId = undefined
                if (data.installmentConfig.prePay > 0) {
                    if (data.installmentConfig.prePayCheck != undefined) {
                        prePayTransactionId = new Types.ObjectId()
                        this.repos.transactionRepo.insert({
                            _id: prePayTransactionId,
                            type: "prePay",
                            amount: data.installmentConfig.prePay,
                            invoice: data.invoice as Types.ObjectId,
                            payType: "check",
                            status: "waiting",
                            ispaid: false,
                            attachments: [],
                            paymentConfig: configId,
                            info: {
                                number: data.installmentConfig.prePayCheck?.number,
                                saiadNumber: data.installmentConfig.prePayCheck?.saiadNumber,
                                bank: data.installmentConfig.prePayCheck?.bank,
                                branch: data.installmentConfig.prePayCheck?.branch
                            },
                            owner: invoice.owner as Types.ObjectId,
                            ownerType: invoice.ownerType,

                        } as any, {

                        })
                    }
                }


                for (let i = 0; i < schedules.length; i++) {
                    let notes = allNotes[i] || []
                    let resNotes = []
                    for (let j = 0; j < notes.length; j++) {
                        resNotes.push({
                            note: notes[j],
                            admin: admin?._id,
                            date: new Date()
                        })
                    }

                    let transactionId = undefined
                    let installmentId = new Types.ObjectId()
                    // if (data.installmentConfig.payType == "check") {
                    transactionId = new Types.ObjectId()
                    let checkinfo = data.installmentConfig.checks?.[i]
                    this.repos.transactionRepo.insert(
                        {
                            _id: transactionId,
                            type: "installment",
                            amount: parseInt(schedules[i].emi),
                            invoice: data.invoice as Types.ObjectId,
                            payType: data.installmentConfig.payType,
                            status: "waiting",
                            ispaid: false,
                            attachments: [],
                            installmentId,
                            info: checkinfo,
                        } as any, {
                    })
                    // }

                    let installment = await this.repos.installmentRepo.collection.create([{
                        _id: installmentId,
                        transactions: transactionId != undefined ? [transactionId] : [],
                        transactionId,
                        number: schedules[i].number,
                        netPrice: parseInt(schedules[i].principalPayment),
                        interest: parseInt(schedules[i].interest),
                        penalty: 0,
                        finalPrice: parseInt(schedules[i].emi),
                        invoice: data.invoice,
                        deadline: schedules[i].dueDateGregorian,
                        notes: resNotes,
                        owner: invoice.owner as Types.ObjectId,
                        ownerType: invoice.ownerType,
                        paymentConfig: configId
                    } as any], {
                        // session
                    })

                    installments.push(installment)
                }






                await this.repos.invoiceRepo.updateOne({
                    _id: data.invoice
                }, {
                    $inc: {
                        waitForConfirmPrice: data.amount
                    }
                })


                return {
                    paymentConfig,
                    installments

                }
            }

            else {

                let ispaid = false
                let status = "waiting"
                let transactionStatus = "waiting"

                if (data.payType == "wallet") {


                    let wallet: number = account.wallet || 0
                    if (data.amount > wallet) {
                        throw new Error("موجودی ناکافی")
                    }


                    status = "finished"
                    transactionStatus = "success"
                    ispaid = true
                }




                let configId = new Types.ObjectId()

                let transaction = await this.repos.transactionRepo.insert({
                    _id: new Types.ObjectId(),
                    type: "pay",
                    amount: data.amount,
                    status: transactionStatus,
                    payType: data.payType || "payGateWay",
                    ispaid: false,
                    invoice: data.invoice as Types.ObjectId,
                    info: data.info,
                    owner: invoice.owner as Types.ObjectId,
                    ownerType: invoice.ownerType,
                    paymentConfig: configId,
                    deadline: data.deadline
                } as any)

                let paymentConfig = await this.repos.paymentConfigRepo.insert({
                    _id: configId,
                    invoice: data.invoice as Types.ObjectId,
                    type: "simple",
                    amount: data.amount,
                    status,
                    ispaid,
                    owner: invoice.owner as Types.ObjectId,
                    ownerType: invoice.ownerType,
                    transaction: transaction._id,
                    deadline: data.deadline,
                    payType: data.payType,
                    info: data.info,
                    trakingCode
                } as any)

                if (ispaid) {
                    await this.repos.invoiceRepo.payFromWallet(data.invoice as string, data.amount, session)
                    repo?.decreaseWallet(invoice.owner as Types.ObjectId, data.amount, session)
                }
                else {
                    await this.repos.invoiceRepo.updateOne({
                        _id: data.invoice
                    }, {
                        $inc: {
                            waitForConfirmPrice: data.amount
                        }
                    })
                }

                // smser

                try {
                    await SmsMessager.send({
                        template: "invoicePayment",
                        receptor: account.phoneNumber,
                        parameters: {
                            trackingCode: trakingCode,
                            facorNumber: invoice.factorNumber,
                            remainingAmount: invoice.remainedPrice - (invoice.waitForConfirmPrice + invoice.unrefinedPrice + data.amount)
                        }
                    })
                } catch (error) {

                }

                return {
                    paymentConfig,
                    transaction

                }


            }

        }
        catch (error) {
            await session.abortTransaction();
       
            console.log(error);
            throw error
        }
    }

    async cancelWalletPaymentConfig(paymentId: string) {
        try {



            let paymentConfig = await this.repos.paymentConfigRepo.findOne({
                payFor: "chargeAccount",
                status: {
                    $in: ["inproccess", "waiting"]
                },
                _id: paymentId
            })
            if (paymentConfig == null) {
                return {
                    status: 404,
                    message: "پرداختی وجود ندارد"
                }
            }

            const repo = this.repos.accounts[paymentConfig.ownerType]
            if (repo == undefined) {
                throw new Error("اکانت یافت نشد")
            }

            let account = await repo.findById(paymentConfig.owner as Types.ObjectId, {
                projection: {
                    name: 1,
                    family: 1,
                    wallet: 1,
                    email: 1,
                    _id: 1,
                    phoneNumber: 1
                }
            })
            if (account == null) {
                throw new Error("اکانت یافت نشد")
            }



            let installments = await this.repos.installmentRepo.findAll({
                paymentConfig: paymentConfig._id
            })

            let paidPrice = 0
            if (paymentConfig.type == "simple") {
                paidPrice = paymentConfig.paidAmount
            }
            else if (paymentConfig.installmentConfig != undefined && paymentConfig.installmentConfig!.prePay > 0 && paymentConfig.installmentConfig!.prePayPaid == true) {
                paidPrice += paymentConfig.installmentConfig!.prePay
            }


            for (let i = 0; i < installments.length; i++) {
                paidPrice += installments[i].paidPrice
            }

            let notPaidInstallments = await this.repos.installmentRepo.findAll({
                paymentConfig: paymentConfig._id,
                iscanceled: false,
                paid: false
            })
            for (let i = 0; i < notPaidInstallments.length; i++) {

                await this.repos.installmentRepo.updateOne({
                    _id: notPaidInstallments[i]._id
                }, {
                    $set: {
                        iscanceled: true
                    }
                })

                await this.repos.transactionRepo.updateMany({
                    installmentId: notPaidInstallments[i]._id,
                    status: {
                        $nin: ["success", "failed", "confirmed"]
                    }
                }, {
                    $set: {
                        status: "canceled"
                    }
                })
            }

            if (paymentConfig.type == "simple") {
                const transaction = await this.repos.transactionRepo.findOne({
                    paymentConfig: paymentConfig._id
                })
                if (transaction != null)
                    await this.repos.transactionRepo.cancelTransaction(transaction?._id)
            }

            await this.repos.paymentConfigRepo.updateOne({
                _id: paymentConfig._id
            }, {
                $set: {
                    status: "canceled"
                }
            })

            try {
                await SmsMessager.send({
                    template: "increaseWalletRequestCanceled",
                    parameters: {
                        trackingCode: paymentConfig.trakingCode
                    },
                    receptor: account.phoneNumber
                })
            } catch (error) {

            }



            return
        }
        catch (error) {
            throw error
        }
    }

    async getWalletPaymentConfig(id: string) {
        try {
            let paymentConfig = await this.repos.paymentConfigRepo.findOne({
                _id: id,
                payFor: "chargeAccount"
            }, {},
                [
                    {
                        path: "installmentConfig.loanTemplate"
                    },
                    {
                        path: "exLoan.loanTemplate"
                    }
                ])


            let installments = []
            if (paymentConfig != null) {
                let account = await this.repos.accounts[paymentConfig.ownerType].getInfo(paymentConfig.owner as string)
                installments = await this.repos.installmentRepo.findAll({
                    paymentConfig: paymentConfig._id
                },
                    {},
                    [{
                        path: "owner",
                        select: ["name", "family"]
                    }, {
                        path: "transactions",
                        select: ["type", "payType", "number", "amount", "status", "ispaid", "info"]
                    },
                    {
                        path: "payment"
                    }
                        , {
                        path: "notes.admin",
                        select: ["name", "familyName", "phoneNumber", "email", "profile"]
                    }],
                )

                const warranty = await this.repos.warrantyRepo.findAll({
                    paymentConfig: id
                }, {}, [{
                    path: "warrantor.address"
                }, {
                    path: "warrantor.workAddrress"
                }])

                return {
                    paymentConfig,
                    installments,
                    account,
                    warranty

                }

            }
            else {
                null
            }


        } catch (error) {
            throw error
        }

    }
    async canclePaymentConfig(id: string, paymentId: string) {
        try {

            let invoice = await this.repos.invoiceRepo.findOne({
                _id: id
            })


            if (invoice == null) {
                return {
                    status: 404
                }
            }
            if (invoice.status == "expired") {
                return {
                    status: 400,
                    message: "فاکتور منقضی شده است"
                }
            }
            if (invoice.status == "paid") {
                return {
                    status: 400,
                    message: "فاکتور پرداخت شده است"
                }
            }
            if (invoice.status == "canceled") {
                return {
                    status: 400,
                    message: "فاکتور لغو شده است"
                }
            }

            let paymentConfig = await this.repos.paymentConfigRepo.findOne({
                invoice: id,
                status: {
                    $in: ["inproccess", "waiting"]
                },
                _id: paymentId
            })

            if (paymentConfig == null) {
                return {
                    status: 404,
                    message: "پرداختی وجود ندارد"
                }
            }

            const repo = this.repos.accounts[paymentConfig.ownerType]
            if (repo == undefined) {
                throw new Error("اکانت یافت نشد")
            }

            let account = await repo.findById(paymentConfig.owner as Types.ObjectId, {
                projection: {
                    name: 1,
                    family: 1,
                    wallet: 1,
                    email: 1,
                    _id: 1,
                    phoneNumber: 1
                }
            })
            if (account == null) {
                throw new Error("اکانت یافت نشد")
            }


            let notPaidInstallments = await this.repos.installmentRepo.findAll({
                paymentConfig: paymentConfig._id,
                iscanceled: false,
                paid: false
            })
            for (let i = 0; i < notPaidInstallments.length; i++) {

                await this.repos.installmentRepo.updateOne({
                    _id: notPaidInstallments[i]._id
                }, {
                    $set: {
                        iscanceled: true
                    }
                })

                await this.repos.transactionRepo.updateMany({
                    installmentId: notPaidInstallments[i]._id,
                    status: {
                        $nin: ["success", "failed", "confirmed"]
                    }
                }, {
                    $set: {
                        status: "canceled"
                    }
                })
            }

            let installments = await this.repos.installmentRepo.findAll({
                paymentConfig: paymentConfig._id
            })

            let paidPrice = 0
            if (paymentConfig.type == "simple") {
                paidPrice = paymentConfig.paidAmount
            }
            else if (paymentConfig.installmentConfig != undefined && paymentConfig.installmentConfig!.prePay > 0 && paymentConfig.installmentConfig!.prePayPaid == true) {
                paidPrice += paymentConfig.installmentConfig!.prePay
            }


            for (let i = 0; i < installments.length; i++) {
                paidPrice += installments[i].paidPrice
            }


            await this.repos.invoiceRepo.updateMany({
                _id: id
            }, {
                $inc: {
                    waitForConfirmPrice: -(paymentConfig.amount - paidPrice)
                }
            })

            await this.repos.paymentConfigRepo.cancelPayment(paymentConfig._id)


            try {
                await SmsMessager.send({
                    template: "invoicePaymentCanceled",
                    parameters: {
                        trackingCode: paymentConfig.trakingCode,
                        factorNumber: invoice.factorNumber
                    },
                    receptor: account.phoneNumber
                })
            } catch (error) {

            }



            return
        }
        catch (error) {
            throw error
        }
    }

    async addInstallmentNote(data: { installmentId: string, note: string }, admin: AdminInfo) {
        try {
            await this.repos.installmentRepo.updateMany({
                _id: data.installmentId
            }, {
                $push: {
                    notes: {
                        date: new Date(),
                        note: data.note,
                        admin: admin._id
                    }
                }
            })

        } catch (error) {
            throw error
        }
    }

    async deleteInstallmentNote(
        data: {
            installmentId: string,
            noteId: string
        },
        admin: AdminInfo
    ) {
        try {
            await this.repos.installmentRepo.updateOne({
                _id: data.installmentId
            }, {
                $pull: {
                    notes: {
                        _id: data.noteId,
                        admin: admin._id
                    }
                }
            })
            return {
                status: 200
            }
        } catch (error) {
            throw error
        }
    }

    async getInstallmentNotes(installmentId: string) {
        try {
            const installment = await this.repos.installmentRepo.findOne({
                _id: installmentId
            }, {
                projection: {
                    notes: 1
                }
            }, [
                {
                    path: "notes.admin",
                    select: ["name", "familyName", "phoneNumber", "email", "profile"]
                }
            ])
            return installment?.notes

        } catch (error) {
            throw error
        }
    }

    async updateInstallment(installmentId: string, data: any) {
        const session = await mongoose.startSession();
        session.startTransaction({

        });
        try {

            const installment = await this.repos.installmentRepo.findOne({
                _id: installmentId
            })
            if (installment == null) {
                throw new Error()
            }
            let transactionId = installment.transactions?.[0]
            if (transactionId == undefined) {
                throw new Error()
            }

            await this.repos.installmentRepo.installmentUpdated(installmentId)

            const transaction = await this.repos.transactionRepo.updateInstallment(transactionId as any, data, session)
        } catch (error) {
            await session.abortTransaction();
            throw error
        }
    }

    async confirmInstallment(
        installmentId: string,
        admin: AdminInfo
    ) {
        const session = await mongoose.startSession();
        session.startTransaction({

        });
        try {
            const installment = await this.repos.installmentRepo.findOne({
                _id: installmentId
            })
            if (installment == null) {
                throw new Error()
            }

            let paymentConfig = await this.repos.paymentConfigRepo.findOne({
                _id: installment.paymentConfig
            })
            if (paymentConfig == null) {
                throw new Error()
            }


            const repo = this.repos.accounts[paymentConfig.ownerType]
            if (repo == undefined) {
                throw new Error("اکانت یافت نشد")
            }

            let account = await repo.findById(paymentConfig.owner as Types.ObjectId, {
                projection: {
                    name: 1,
                    family: 1,
                    wallet: 1,
                    email: 1,
                    _id: 1,
                    phoneNumber: 1
                }
            })
            if (account == null) {
                throw new Error("اکانت یافت نشد")
            }

            if (paymentConfig.installmentConfig?.payType == "payGateWay") {
                throw new Error("نوع پرداخت آنلاین نیازی ب تایید ندارد")
            }

            let transactionId = installment.transactions?.[0]
            if (transactionId == undefined) {
                throw new Error()
            }
            let transaction = await this.repos.transactionRepo.findOne({
                _id: transactionId
            })

            await this.repos.transactionRepo.acceptCheck(transaction?._id, session)
            if (transaction == null) {
                throw new Error()
            }

            await this.repos.installmentRepo.confirmInstallment(installmentId, session)

            try {
                await SmsMessager.send({
                    template: "chequePaymentApproved",
                    receptor: account.phoneNumber,
                    parameters: {
                        trackingCode: paymentConfig.trakingCode,
                        chequeNumber: transaction.info?.number || "",
                        paymentType: paymentConfig.payFor == "invoice" ? "اقساط" : "وام"

                    }
                })
            } catch (error) {

            }

            // transaction.
        } catch (error) {
            await session.abortTransaction();
            throw error

        }
    }

    async changeInstallment(installmentId: string, admin: AdminInfo) {
        const session = await mongoose.startSession();
        session.startTransaction({

        });
        try {

        } catch (error) {
            await session.abortTransaction();
            throw error

        }
    }

    async rejectInstallment(
        installmentId: string,
        rejectMessage: string,
        admin: AdminInfo
    ) {
        const session = await mongoose.startSession();
        session.startTransaction({
        });
        try {
            const installment = await this.repos.installmentRepo.findOne({
                _id: installmentId,

            })
            if (installment == null) {
                throw new Error()
            }

            let paymentConfig = await this.repos.paymentConfigRepo.findOne({
                _id: installment.paymentConfig
            })
            if (paymentConfig == null) {
                throw new Error()
            }
            if (paymentConfig.installmentConfig?.payType == "payGateWay") {
                throw new Error("نوع پرداخت آنلاین نیازی به رد ندارد")
            }


            const repo = this.repos.accounts[paymentConfig.ownerType]
            if (repo == undefined) {
                throw new Error("اکانت یافت نشد")
            }

            let account = await repo.findById(paymentConfig.owner as Types.ObjectId, {
                projection: {
                    name: 1,
                    family: 1,
                    wallet: 1,
                    email: 1,
                    _id: 1,
                    phoneNumber: 1
                }
            })
            if (account == null) {
                throw new Error("اکانت یافت نشد")
            }

            let transactionId = installment.transactions?.[0]
            if (transactionId == undefined) {
                throw new Error()
            }
            let transaction = await this.repos.transactionRepo.findOne({
                _id: transactionId
            })

            await this.repos.transactionRepo.rejectCheck(transaction?._id, session)
            if (transaction == null) {
                throw new Error()
            }

            await this.repos.installmentRepo.rejectInstallment(installmentId, rejectMessage, session)

            try {
                await SmsMessager.send({
                    template: "chequePaymentRejected",
                    parameters: {
                        "trackingCode": paymentConfig.trakingCode,
                        "chequeNumber": transaction.info.number,
                        "paymentType": paymentConfig.payFor == "invoice" ? "اقساط" : "وام",
                        "rejectionReason": rejectMessage.replace(" ", "‌")
                    },
                    receptor: account.phoneNumber
                })
            } catch (error) {


            }


        } catch (error) {
            await session.abortTransaction();
            throw error

        }
    }

    async forgetPenalty(id: string) {
        try {
            let payment = await this.repos.paymentConfigRepo.findOne({
                $or: [
                    {
                        _id: id
                    }, {
                        installment: id
                    }
                ]
            })
            if (payment == null) {
                throw new Error("پرداخت یافت نشد")
            }
            await this.repos.paymentConfigRepo.forgetPenalty(payment._id)

            if (payment.installment != undefined) {
                await this.repos.installmentRepo.penaltyPaid(payment.installment as string)
            }
        } catch (error) {
            throw error
        }
    }

    async confirmInstallments(id: string) {
        const session = await mongoose.startSession();
        session.startTransaction({

        });
        try {
            const paymentConfig = await this.repos.paymentConfigRepo.findOne({
                _id: id
            })
            var invoice
            let accountRepo
            let account
            // var 
            if (paymentConfig == null) {
                throw new Error()
            }
            if (paymentConfig.payFor == "chargeAccount") {
                accountRepo = this.repos.accounts[paymentConfig.ownerType]
                account = await accountRepo.findById(paymentConfig.owner as Types.ObjectId)
                if (account == null) {
                    throw new Error()
                }
            }
            else if (paymentConfig.payFor == "invoice") {
                invoice = await this.repos.invoiceRepo.findById(paymentConfig?.invoice as string);
                if (invoice == null) {
                    throw new Error()
                }
            }

            const installments = await this.repos.installmentRepo.findAll({
                paymentConfig: id
            })
            for (let i = 0; i < installments.length; i++) {
                if (installments[i].status != "confirmed") {
                    throw new Error("همه اقساط تایید نشده است")
                }
            }

            await this.repos.paymentConfigRepo.confirmPayment(id, session)


            await this.repos.installmentRepo.confirmInstallments(id)


            if (invoice != undefined) {
                await this.repos.invoiceRepo.acceptInstallments(invoice._id, paymentConfig.amount, session)

                await this.addInstallmentsPayments(id, paymentConfig.installmentConfig?.payType || "payGateWay", "installment")
            }
            else if (account != undefined && paymentConfig.replacedFrom != undefined && paymentConfig.type != "installment") {
                await accountRepo?.increaseWallet(account._id, paymentConfig.amount, session)
            }



            try {
                await SmsMessager.send({
                    template: "installmentsApproved",
                    receptor: account.phoneNumber,
                    parameters: {
                        trackingCode: paymentConfig.trakingCode,
                        paymentType: paymentConfig.payFor == "invoice" ? "اقساط" : "وام",
                    }
                })
            } catch (error) {

            }




        } catch (error) {
            await session.abortTransaction();
            throw error
        }
    }

    async rejectInstallments(id: string, rejectMessage: string) {
        const session = await mongoose.startSession();
        session.startTransaction({});

        try {
            const paymentConfig = await this.repos.paymentConfigRepo.findOne({
                _id: id
            })

            var invoice
            let accountRepo
            let account


            if (paymentConfig == null) {
                throw new Error()
            }

            accountRepo = this.repos.accounts[paymentConfig.ownerType]
            account = await accountRepo.findById(paymentConfig.owner as Types.ObjectId)
            if (account == null) {
                throw new Error()
            }

            if (paymentConfig.status == "inproccess") {
                throw new Error("این پرداخت قبلا تایید شده است")
            }
            if (paymentConfig.status == "rejected") {
                throw new Error("این پرداخت قبلا رد شده است")
            }

            if (paymentConfig.payFor == "chargeAccount") {

                if (account == null) {
                    throw new Error()
                }
            }
            else if (paymentConfig.payFor == "invoice") {
                invoice = await this.repos.invoiceRepo.findById(paymentConfig?.invoice as string);
                if (invoice == null) {
                    throw new Error()
                }
            }

            const installments = await this.repos.installmentRepo.rejectInstallments(id, session)

            await this.repos.transactionRepo.rejectPaymentAllTransaction(id, session)

            await this.repos.paymentConfigRepo.rejectInstallment(id, rejectMessage)

            try {
                await SmsMessager.send({
                    parameters: {
                        "trackingCode": paymentConfig.trakingCode,
                        "paymentType": paymentConfig.payFor == "invoice" ? "اقساط" : "وام",
                        "rejectionReason": rejectMessage
                    },
                    receptor: account.phoneNumber,
                    template: "installmentsRejected"
                })
            } catch (error) {

            }

        } catch (error) {
            await session.abortTransaction();
            throw error
        }
    }

    async getInvoiceById(id: string) {
        try {
            const invoice = await this.repos.invoiceRepo.findOne({
                _id: id
            }, {

            }, [
                {
                    path: "owner",
                    select: ["name", "family"]
                },
            ])
            if (invoice == null) {
                return {
                    status: 404,
                }
            }
            let paymentConfigs = await this.repos.paymentConfigRepo.findAll({
                invoice: id,
                // status:{

                // } "inproccess"
            }, {}, [{
                path: "transaction",
            }])

            return {
                invoice,
                paymentConfigs
            }
        } catch (error) {
            throw error
        }
    }


    async getPaymentInstallments(
        id: string
    ) {
        try {

            let paymentConfig = await this.repos.paymentConfigRepo.findOne({
                _id: id,
                // status: {
                //     $in: ["inproccess", "waiting"]
                // },
                type: "installment"
            })

            let invoice
            if (paymentConfig?.invoice != undefined) {
                invoice = await this.repos.invoiceRepo.findOne({
                    _id: paymentConfig?.invoice
                }, {

                }, [
                    {
                        path: "owner",
                        select: ["name", "family"]
                    },
                ])

                if (invoice == null) {
                    return {
                        status: 404,
                    }
                }
            }




            let installments = []
            if (paymentConfig != null) {
                installments = await this.repos.installmentRepo.findAll({
                    paymentConfig: paymentConfig._id
                },
                    {},
                    [{
                        path: "owner",
                        select: ["name", "family"]
                    }, {
                        path: "transactions",
                        select: ["type", "payType", "number", "amount", "status", "ispaid", "info"]
                    }, {
                        path: "notes.admin",
                        select: ["name", "familyName", "phoneNumber", "email", "profile"]
                    }],
                )

                return {
                    invoice,
                    paymentConfig,
                    installments

                }

            }
            else {
                return {
                    invoice
                }
            }


        } catch (error) {
            throw error
        }
    }


    ///////////////////////   invoice  ///////////////////////

    async validatePayement(id: string, payType: string) {
        const paymentConfig = await this.repos.paymentConfigRepo.findById(id)
        if (paymentConfig == null) {
            throw new Error("کانفیگ پرداخت یافت نشد")
        }
        if (paymentConfig.payType != payType) {
            throw new Error("کانفیگ پرداخت نامعتبر است")
        }
        if (paymentConfig.status != "waiting") {
            throw new Error("وضعیت کانفیگ پرداخت نامعتبر است")
        }

        return
    }

    async getMinimumAmount(
        id: string,
    ) {

        try {
            const paymentConfig = await this.repos.paymentConfigRepo.findById(id);
            if (paymentConfig == null) {
                throw new Error()
            }
            const invoice = await this.repos.invoiceRepo.findById(paymentConfig?.invoice as string);
            if (invoice == null) {
                throw new Error()
            }

            return invoice.remainedPrice - (invoice.waitForConfirmPrice + invoice.unrefinedPrice) - paymentConfig?.amount
            // const amount = paymentConfig.amount
            // const newAmount = data.amount
            // const amountDiff = newAmount - amount

            // if (invoice.remainedPrice - (invoice.waitForConfirmPrice + invoice.unrefinedPrice) < amountDiff) {
            //     throw new Error("مبلغ وارد شده بیشتر از مبلغ باقیمانده است")
            // }
        } catch (error) {
            throw error
        }
    }

    ///////////////////////// check ////////////////////////////

    @validate("check")
    async confirmCheck(id: string) {
        const session = await mongoose.startSession();
        session.startTransaction({

        });
        try {
            const paymentConfig = await this.repos.paymentConfigRepo.findById(id);
            var invoice
            let accountRepo
            let account
            // var 
            if (paymentConfig == null) {
                throw new Error()
            }

            accountRepo = this.repos.accounts[paymentConfig.ownerType]
            account = await accountRepo.findById(paymentConfig.owner as Types.ObjectId)
            if (account == null) {
                throw new Error()
            }

            if (paymentConfig.payFor == "chargeAccount") {
                // accountRepo = this.repos.accounts[paymentConfig.ownerType]
                // account = await accountRepo.findById(paymentConfig.owner as Types.ObjectId)
                // if (account == null) {
                //     throw new Error()
                // }
            }
            else if (paymentConfig.payFor == "invoice") {
                invoice = await this.repos.invoiceRepo.findById(paymentConfig?.invoice as string);
                if (invoice == null) {
                    throw new Error()
                }


            }
            const transaction = await this.repos.transactionRepo.findOne({
                paymentConfig: id
            })
            if (transaction == null) {
                throw new Error()
            }


            await this.repos.transactionRepo.acceptCheck(transaction._id, session)

            if (invoice != undefined) {
                await this.repos.invoiceRepo.acceptCheck(invoice._id, paymentConfig.amount, session)
            }
            else if (account != undefined && ( paymentConfig.replacedFrom != undefined || paymentConfig.payFor == "chargeAccount")) {
                await accountRepo?.increaseWallet(account._id, paymentConfig.amount, session)
            }


            await this.repos.paymentConfigRepo.acceptCheck(id, session)

            try {
                await SmsMessager.send({
                    parameters: {
                        checkNumber: transaction.info.number,
                        trackingCode: paymentConfig.trakingCode
                    },
                    receptor: account.phoneNumber,
                    template: "checkApproved"
                })
            } catch (error) {

            }



        } catch (error) {
            await session.abortTransaction();
            throw error
        }
    }

    async rejectCheck(
        id: string,
        rejectMessage: string
    ) {
        const session = await mongoose.startSession();
        session.startTransaction({

        });
        try {
            var invoice
            const paymentConfig = await this.repos.paymentConfigRepo.findById(id);
            if (paymentConfig == null) {
                throw new Error()
            }




            if (paymentConfig.payFor == "invoice") {
                invoice = await this.repos.invoiceRepo.findById(paymentConfig?.invoice as string);
                if (invoice == null) {
                    throw new Error()
                }
            }

            const accountRepo = this.repos.accounts[paymentConfig.ownerType]
            const account = await accountRepo.findById(paymentConfig.owner as Types.ObjectId)
            if (account == null) {
                throw new Error()
            }


            const transaction = await this.repos.transactionRepo.findOne({
                paymentConfig: id
            })
            if (transaction == null) {
                throw new Error()
            }

            await this.repos.transactionRepo.rejectCheck(transaction._id, session)

            if (invoice != undefined) {
                await this.repos.invoiceRepo.rejectCheck(invoice._id, paymentConfig.amount, session)
            }

            await this.repos.paymentConfigRepo.rejectCheck(id, rejectMessage, session)

            try {
                await SmsMessager.send({
                    parameters: {
                        checkNumber: transaction.info.number,
                        rejectionReason: rejectMessage.replace(" ", "‌"),
                        trackingCode: paymentConfig.trakingCode
                    },
                    receptor: account.phoneNumber,
                    template: "checkRejected"
                })
            } catch (error) {

            }


        } catch (error) {
            await session.abortTransaction();
            throw error
        }
    }

    async editCheck(
        data: EditCheckData
    ) {
        const session = await mongoose.startSession();
        session.startTransaction({

        });
        try {
            var invoice
            const paymentConfig = await this.repos.paymentConfigRepo.findById(data.id);
            if (paymentConfig == null) {
                throw new Error()
            }
            if (paymentConfig.payFor == "invoice") {
                invoice = await this.repos.invoiceRepo.findById(paymentConfig.invoice as string || "");
                if (invoice == null) {
                    throw new Error();
                }
            }

            const accountRepo = this.repos.accounts[paymentConfig.ownerType]
            const account = await accountRepo.findById(paymentConfig.owner as Types.ObjectId)
            if (account == null) {
                throw new Error()
            }


            const transaction = await this.repos.transactionRepo.findOne({
                paymentConfig: data.id
            })
            if (transaction == null) {
                throw new Error()
            }

            const amount = paymentConfig.amount
            const newAmount = data.amount
            const amountDiff = newAmount - amount
            if (invoice != undefined) {
                if (invoice.remainedPrice - (invoice.waitForConfirmPrice + invoice.unrefinedPrice) < amountDiff) {
                    throw new Error("مبلغ وارد شده بیشتر از مبلغ باقیمانده است")
                }
                await this.repos.invoiceRepo.editCheck(invoice._id, amountDiff, session)
            }


            await this.repos.paymentConfigRepo.editCheck(data.id, data, session)
            await this.repos.transactionRepo.editCheck(transaction._id, data, session)


            try {
                await SmsMessager.send({
                    parameters: {
                        checkNumber: transaction.info.number,
                        trackingCode: paymentConfig.trakingCode
                    },
                    receptor: account.phoneNumber,
                    template: "checkEdited"
                })
            } catch (error) {

            }

        } catch (error) {
            await session.abortTransaction();
            throw error
        }
    }

    async changeCheckPlace(data: ChangeCheckPlaceData) {
        const session = await mongoose.startSession();
        session.startTransaction({

        });
        try {
            const paymentConfig = await this.repos.paymentConfigRepo.findById(data.id);
            if (paymentConfig == null) {
                throw new Error()
            }
            const transaction = await this.repos.transactionRepo.findOne({
                paymentConfig: data.id
            })
            if (transaction == null) {
                throw new Error()
            }
            await this.repos.transactionRepo.changeCheckPlace(transaction._id, data, session)
            await this.repos.paymentConfigRepo.changeCheckPlace(data, session)
            const newPayment = await this.repos.paymentConfigRepo.findById(data.id)
        } catch (error) {
            await session.abortTransaction();
            throw error
        }
    }

    async checkPassed(id: string, bankId?: string) {
        const session = await mongoose.startSession();
        session.startTransaction({

        });
        try {
            const paymentConfig = await this.repos.paymentConfigRepo.findById(id);

            if (paymentConfig == null) {
                throw new Error()
            }

            const transaction = await this.repos.transactionRepo.findOne({
                _id: paymentConfig.transaction
            })
            if (transaction == null) {
                throw new Error()
            }


            if (bankId == undefined && paymentConfig.placeType != "spend") {

                if (paymentConfig.bankAccount == undefined) {
                    throw new Error();
                }
                bankId = paymentConfig.bankAccount as string
            }

            var bank
            var invoice

            if (bankId != undefined) {
                bank = await this.repos.bankAccountRepo.findOne({
                    _id: bankId,
                    isTankhah: false,
                    enabled: true,
                })
                if (bank == null) {
                    throw new Error();
                }
            }


            if (paymentConfig.payFor == "invoice") {
                invoice = await this.repos.invoiceRepo.findById(paymentConfig?.invoice as string);
                if (invoice == null) {
                    throw new Error()
                }
            }

            // if (paymentConfig.placeType != "dein" && paymentConfig.placeType != "spend") {
            if (bank != undefined)
                await this.repos.bankAccountRepo.addMoney(bank._id, paymentConfig.realAmount || paymentConfig.amount, session)
            if (invoice != undefined)
                await this.repos.invoiceRepo.checkPassed(invoice._id, paymentConfig.amount, session)
            // }

            await this.repos.paymentConfigRepo.checkPassed(id)

            await this.repos.transactionRepo.checkPassed(transaction._id)

            if (paymentConfig.installment != undefined) {
                let fullPaid = true
                let havePenalty = false
                let installment = await this.repos.installmentRepo.findById(paymentConfig.installment as string)
                if (installment == null) {
                    return
                }

                if (installment.status == "arrived") {
                    havePenalty = true
                    if (installment.penalty != undefined && installment.penalty > 0) {
                        fullPaid = false
                    }
                }


                await this.installmentPaid(paymentConfig.installment as string, fullPaid, havePenalty, paymentConfig._id, paymentConfig.amount)
            }

        } catch (error) {

            await session.abortTransaction();
            throw error
        }
    }


    async checkReturned(id: string) {
        try {
            const paymentConfig = await this.repos.paymentConfigRepo.findById(id);
            if (paymentConfig == null) {
                throw new Error()
            }


            const accountRepo = this.repos.accounts[paymentConfig.ownerType]
            const account = await accountRepo.findById(paymentConfig.owner as Types.ObjectId)
            if (account == null) {
                throw new Error()
            }


            try {
                await SmsMessager.send({
                    parameters: {
                        checkNumber: paymentConfig.info?.number,
                        trackingCode: paymentConfig.trakingCode
                    },
                    receptor: account.phoneNumber,
                    template: "checkReturned"
                })
            } catch (error) {

            }

            await this.repos.paymentConfigRepo.checkReturned(id)
        } catch (error) {
            throw error
        }
    }

    async cancleAndChangeCheckReq(
        id: string,
        reSend: boolean = false,
        isInstallmentId?: boolean
    ) {
        const session = await mongoose.startSession();
        session.startTransaction({

        });

        try {


            const paymentConfig = await this.repos.paymentConfigRepo.findOne({
                $or: [
                    {
                        _id: id
                    },
                    {
                        installment: id
                    }
                ]
            }, {}, [{
                path: "owner"
            }]);


            if (paymentConfig == null) {
                throw new Error()
            }

            if (paymentConfig.code == undefined || reSend) {
                const random = RandomGenarator.randomNumber()
                const checkNumber = paymentConfig.info?.["number"]
                await SmsMessager.send({
                    template: "confirmReturnCheck",
                    receptor: (paymentConfig.owner as any).phoneNumber,
                    parameters: {
                        code: random,
                        checkNumber
                    }
                })
                await this.repos.paymentConfigRepo.updateOne({
                    $or: [
                        {
                            _id: id
                        },
                        {
                            installment: id
                        }
                    ]
                }, {
                    code: random
                })
            }



        } catch (error) {
            await session.abortTransaction();
            throw error
        }
    }


    async confirmCancleAndChangeCheck(
        id: string,
        code: string
    ) {
        try {
            const paymentConfig = await this.repos.paymentConfigRepo.findOne({
                $or: [
                    {
                        _id: id
                    },
                    {
                        installment: id
                    }
                ]
            })
            if (paymentConfig == null) {
                throw new Error()
            }
            if (paymentConfig.code != code) {
                throw new Error("کد وارد شده اشتباه است")
            }
            await this.repos.paymentConfigRepo.confirmCancleAndChangeCheck(id)
        } catch (error) {
            throw error
        }

    }

    async cancleAndChangeCheck(data: CancelAndChangeCheckData) {
        const session = await mongoose.startSession();
        session.startTransaction({

        });
        try {
            const paymentConfig = await this.repos.paymentConfigRepo.findOne({

                $or: [
                    {
                        _id: data.paymentId
                    },
                    {
                        installment: data.paymentId
                    }
                ]
            }, {}, [{
                path: "owner"
            }]);
            var invoice
            let accountRepo
            let account
            if (paymentConfig == null) {
                throw new Error()
            }


            if (paymentConfig.payFor == "invoice") {
                await this.repos.invoiceRepo.checkReplaced(paymentConfig.invoice as any, paymentConfig.amount, session)

                accountRepo = this.repos.accounts[paymentConfig.ownerType]
                account = paymentConfig.owner as BaseUser
                if (account == null) {
                    throw new Error()
                }
                await accountRepo?.increaseWallet(account._id, -paymentConfig.amount, session)
            }
            else if (paymentConfig.payFor == "chargeAccount") {
                if (account != null) {
                    accountRepo = this.repos.accounts[paymentConfig.ownerType]
                    account = paymentConfig.owner as BaseUser
                    if (account == null) {
                        throw new Error()
                    }
                    await accountRepo?.increaseWallet(account._id, -paymentConfig.amount, session)
                }

            }

            else {
                accountRepo = this.repos.accounts[paymentConfig.ownerType]

                account = paymentConfig.owner as BaseUser
                if (account == null) {
                    throw new Error()
                }
            }


            let configId = new Types.ObjectId()
            const trakingCode = RandomGenarator.generateHashStr(8)


            let status = "waiting"
            let paymentStatus = "waiting"


            let havePenalty = false

            if (data.payType == "wallet") {
                if (paymentConfig.payFor == "loan") {

                    let installment = await this.repos.installmentRepo.findOne({
                        _id: paymentConfig.installment
                    })


                    if (installment == null || account == undefined || account.wallet == undefined) {
                        throw new Error("error")
                    }
                    if (account.wallet < installment?.finalPrice) {
                        throw new Error("عدم موجودی کافی")
                    }

                    if (installment?.penalty > 0 || installment?.status == "arrived") {
                        havePenalty = true
                    }

                    else {
                        await accountRepo?.increaseWallet(account._id, -installment.finalPrice, session)
                    }

                    paymentStatus = "finished"
                    status = "success"

                }
            }

            let transaction = await this.repos.transactionRepo.insert({
                _id: new Types.ObjectId(),
                type: "pay",
                amount: paymentConfig.amount + (paymentConfig.penalty || 0),
                status,
                payType: data.payType || "payGateWay",
                ispaid: false,
                invoice: paymentConfig.invoice as Types.ObjectId,
                info: data.info,
                owner: (paymentConfig.owner as any)._id as Types.ObjectId,
                ownerType: paymentConfig.ownerType,
                paymentConfig: configId,
                deadline: data.deadline,
            } as any)

            let newPaymentConfig = await this.repos.paymentConfigRepo.insert({
                _id: configId,
                invoice: paymentConfig.invoice as Types.ObjectId,
                type: "simple",
                amount: paymentConfig.amount + (paymentConfig.penalty || 0),
                owner: (paymentConfig.owner as any)._id as Types.ObjectId,
                ownerType: paymentConfig.ownerType,
                transaction: transaction._id,
                deadline: data.deadline,
                payType: data.payType,
                info: data.info,
                payFor: paymentConfig.payFor,
                replacedFrom: paymentConfig._id,
                installment: paymentConfig.installment,
                trakingCode,
                status: paymentStatus
            } as any)





            if(paymentStatus == "finished"){
                await this.repos.paymentConfigRepo.makCheckReadyForCancel(paymentConfig._id as string)
            }   
            else{
                await this.repos.paymentConfigRepo.checkChanged(paymentConfig._id,
                    configId, session)
            }

            if (paymentConfig.payFor == "loan") {
                if (data.payType == "wallet") {
                    await this.installmentPaid(data.paymentId, true, havePenalty, newPaymentConfig._id, newPaymentConfig.amount, transaction._id)
                }
                else {
                    await this.repos.installmentRepo.chageInstallment(data.paymentId, transaction._id, configId.toHexString())
                }
            }

            else if (paymentConfig.payFor == "installment") {

            }

            try {
                await SmsMessager.send({
                    template: "returnCheckTrakingCode",
                    receptor: (paymentConfig.owner as any).phoneNumber,
                    parameters: {
                        trackingCode: paymentConfig.trakingCode || "",
                    }
                })
            } catch (error) {

            }

            if (data.payType == "payGateWay") {
                const domain = await this.domainRepo.findOne({
                    isDefault: true
                })
                if (domain != null) {
                    return {
                        link: `https://${domain.domain}/pay/${trakingCode}`,
                        id: configId
                    }
                }
            }

            //rrrr



        } catch (error) {
            await session.abortTransaction();
            throw error
        }
    }


    async installmentPaid(
        id: string,
        fullPaid: boolean,
        havePenalty: boolean,
        payment: string,
        amount: number,
        transaction?: string
    ) {
        try {

            let status = "paid"
            let paid = true
            let penaltypaid
            if (havePenalty == true) {
                if (fullPaid) {
                    penaltypaid = true
                    status = "paidWithDelay"
                }
                else {
                    penaltypaid = false
                    status = "paidWithoutPenalty"
                }

            }



            let installment = await this.repos.installmentRepo.findByIdAndUpdate(id, {
                $set: {
                    status,
                    paidAt: new Date(),
                    paidPrice: amount,
                    paid,
                    penaltypaid,
                    payment
                },
                $push: {
                    transactions: {
                        $each: [transaction],
                        $position: 0
                    }
                }
            })

            if (installment == null) {
                return
            }
            await this.repos.paymentConfigRepo.installmentPaid(installment.paymentConfig, amount, fullPaid)

        } catch (error) {
            throw error
        }
    }

    async submitCheckCancel(id: string, code: string) {
        try {
            const paymentConfig = await this.repos.paymentConfigRepo.findById(id)
            if (paymentConfig == null) {
                throw new Error("پرداخت یافت نشد")
            }
            if (paymentConfig.submitCode == undefined || paymentConfig.submitCode != code) {
                throw new Error("عملیات نامعتبر")
            }


            await this.repos.paymentConfigRepo.submitCheckCancel(id)
        } catch (error) {
            throw error
        }
    }


    async requestSubmitCheckCancel(id: string, reSend: boolean = false) {
        const session = await mongoose.startSession();
        session.startTransaction({

        });

        try {
            const paymentConfig = await this.repos.paymentConfigRepo.findOne({
                _id: id
            }, {}, [{
                path: "owner"
            }]);

            if (paymentConfig == null) {
                throw new Error()
            }

            if (paymentConfig.codeConfirmed != true || paymentConfig.status != "readyForCancle") {
                throw new Error("عملیات قابل انجام نیست")
            }

            if (paymentConfig.code == undefined || reSend) {
                const random = RandomGenarator.randomNumber()
                const checkNumber = paymentConfig.info?.["number"]
                await SmsMessager.send({
                    template: "requestSubmitReturnCheck",
                    receptor: (paymentConfig.owner as any).phoneNumber,
                    parameters: {
                        code: random,
                        checkNumber
                    }
                })
                await this.repos.paymentConfigRepo.updateOne({
                    _id: id
                }, {
                    submitCode: random
                })
            }



        } catch (error) {
            await session.abortTransaction();
            throw error
        }
    }




    ///////////////////////// check ////////////////////////////


    ////////////////////////  cash /////////////////////////////

    @validate("cash")
    async confirmCash(id: string, type: string, idd: string) {
        const session = await mongoose.startSession();
        session.startTransaction({

        });
        try {
            const paymentConfig = await this.repos.paymentConfigRepo.findById(id);
            var invoice
            let accountRepo
            let account
            if (paymentConfig == null) {
                throw new Error()
            }


            if (paymentConfig.payFor == "chargeAccount") {
                accountRepo = this.repos.accounts[paymentConfig.ownerType]
                account = await accountRepo.findById(paymentConfig.owner as Types.ObjectId)
                if (account == null) {
                    throw new Error()
                }
            }
            else if (paymentConfig.payFor == "invoice") {
                accountRepo = this.repos.accounts[paymentConfig.ownerType]
                account = await accountRepo.findById(paymentConfig.owner as Types.ObjectId)
                if (account == null) {
                    throw new Error()
                }

                invoice = await this.repos.invoiceRepo.findById(paymentConfig?.invoice as string);
                if (invoice == null) {
                    throw new Error()
                }
            }
            const transaction = await this.repos.transactionRepo.findOne({
                paymentConfig: id
            })
            if (transaction == null) {
                throw new Error()
            }

            let repo
            if (type == "bank") {
                const bankAccount = await this.repos.bankAccountRepo.findOne({
                    _id: idd,
                    isTankhah: false,
                    enabled: true
                })
                if (bankAccount == null) {
                    throw new Error("")
                }
                repo = this.repos.bankAccountRepo
            }
            else {
                const chest = await this.repos.chestRepo.findOne({
                    _id: idd,
                    isTankhah: false,
                    enabled: true
                })
                if (chest == null) {
                    throw new Error("")
                }
                repo = this.repos.chestRepo
            }




            await this.repos.paymentConfigRepo.acceptCash(id, session)
            await this.repos.transactionRepo.acceptCash(transaction._id, type, idd, session)

            console.log(account != undefined , paymentConfig.replacedFrom != undefined)
            if (invoice != undefined) {
                await this.repos.invoiceRepo.acceptCash(invoice._id, paymentConfig.amount, session)
                await this.repos.taxLogRepo.increaseTax(invoice._id, invoice.tax, session)
            }

            else if (account != undefined && ( paymentConfig.replacedFrom != undefined || paymentConfig.payFor == "chargeAccount")) {
                await accountRepo?.increaseWallet(account._id, paymentConfig.amount, session)
            }

            await repo.addMoney(id, paymentConfig.amount, session)

            try {
                await SmsMessager.send({
                    parameters: {
                        paymentType: "نقدی",
                        trackingCode: paymentConfig.trakingCode
                    },
                    receptor: account.phoneNumber,
                    template: "paymentConfirmed"
                })
            } catch (error) {

            }




            // await this.repos.transactionRepo.acceptCheck(transaction._id, session)
            // await this.repos.invoiceRepo.acceptCheck(invoice._id, paymentConfig.amount, session)
            // await this.repos.paymentConfigRepo.acceptCheck(id, session)


        } catch (error) {

            await session.abortTransaction();
            throw error
        }
    }
    async rejectCash(
        id: string,
        rejectMessage: string
    ) {
        try {
            var invoice
            const paymentConfig = await this.repos.paymentConfigRepo.findById(id);
            if (paymentConfig == null) {
                throw new Error()
            }

            const accountRepo = this.repos.accounts[paymentConfig.ownerType]
            const account = await accountRepo.findById(paymentConfig.owner as Types.ObjectId)
            if (account == null) {
                throw new Error()
            }

            if (paymentConfig.payFor == "invoice") {
                invoice = await this.repos.invoiceRepo.findById(paymentConfig?.invoice as string);
                if (invoice == null) {
                    throw new Error()
                }
            }

            const transaction = await this.repos.transactionRepo.findOne({
                paymentConfig: id
            })
            if (transaction == null) {
                throw new Error()
            }


            await this.repos.paymentConfigRepo.rejectCash(id, rejectMessage)
            if (invoice != undefined)
                await this.repos.invoiceRepo.rejectCash(invoice._id, paymentConfig.amount)
            await this.repos.transactionRepo.rejectCash(transaction._id)

            try {
                await SmsMessager.send({
                    parameters: {
                        paymentType: "نقدی",
                        trackingCode: paymentConfig.trakingCode,
                        rejectionReason: rejectMessage.replace(" ", "‌")
                    },
                    receptor: account.phoneNumber,
                    template: "paymentRejected"
                })
            } catch (error) {

            }



        } catch (error) {
            throw error
        }
    }
    async editCash(
        data: EditCashData
    ) {
        const session = await mongoose.startSession();
        session.startTransaction({

        });
        try {
            const paymentConfig = await this.repos.paymentConfigRepo.findById(data.id);
            var invoice
            if (paymentConfig == null) {
                throw new Error()
            }

            const accountRepo = this.repos.accounts[paymentConfig.ownerType]
            const account = await accountRepo.findById(paymentConfig.owner as Types.ObjectId)
            if (account == null) {
                throw new Error()
            }

            if (paymentConfig.payFor == "invoice") {
                invoice = await this.repos.invoiceRepo.findById(paymentConfig.invoice as string || "");
                if (invoice == null) {
                    throw new Error();
                }
            }


            const transaction = await this.repos.transactionRepo.findOne({
                paymentConfig: data.id
            })
            if (transaction == null) {
                throw new Error()
            }

            const amount = paymentConfig.amount
            const newAmount = data.amount
            const amountDiff = newAmount - amount

            if (invoice != undefined) {
                if (invoice.remainedPrice - (invoice.waitForConfirmPrice + invoice.unrefinedPrice) < amountDiff) {
                    throw new Error("مبلغ وارد شده بیشتر از مبلغ باقیمانده است")
                }
                await this.repos.invoiceRepo.editCash(invoice._id, amountDiff, session)
            }


            await this.repos.paymentConfigRepo.editCash(data.id, data, session)
            await this.repos.transactionRepo.editCash(transaction._id, data, session)


            try {
                await SmsMessager.send({
                    parameters: {
                        paymentType: "نقدی",
                        trackingCode: paymentConfig.trakingCode
                    },
                    receptor: account.phoneNumber,
                    template: "paymentRejected"
                })
            } catch (error) {

            }


        } catch (error) {
            await session.abortTransaction();
            throw error
        }
    }

    ////////////////////////  cash /////////////////////////////



    ////////////////////////  pos /////////////////////////////
    @validate("pos")
    async confirmPOS(id: string) {
        const session = await mongoose.startSession();
        session.startTransaction({

        });
        try {
            const paymentConfig = await this.repos.paymentConfigRepo.findById(id);
            var invoice
            let accountRepo
            let account

            if (paymentConfig == null) {
                throw new Error()
            }

            if (paymentConfig.info?.pos == undefined) {
                throw new Error()
            }

            if (paymentConfig.payFor == "chargeAccount") {
                accountRepo = this.repos.accounts[paymentConfig.ownerType]
                account = await accountRepo.findById(paymentConfig.owner as Types.ObjectId)
                if (account == null) {
                    throw new Error()
                }
            }
            else if (paymentConfig.payFor == "invoice") {
                invoice = await this.repos.invoiceRepo.findById(paymentConfig?.invoice as string);
                if (invoice == null) {
                    throw new Error()
                }
            }

            const transaction = await this.repos.transactionRepo.findOne({
                paymentConfig: id
            })
            if (transaction == null) {
                throw new Error()
            }

            const pos = await this.repos.posRepo.findById(paymentConfig.info.pos)
            if (pos == null) {
                throw new Error()
            }

            const bank = await this.repos.bankAccountRepo.findOne({
                _id: pos.bankAccount
            })
            if (bank == null) {
                throw new Error()
            }

            await this.repos.paymentConfigRepo.acceptPOS(id, session)
            await this.repos.transactionRepo.acceptPOS(transaction._id, session)
            if (invoice != undefined) {
                await this.repos.invoiceRepo.acceptPOS(invoice._id, paymentConfig.amount, session)
                await this.repos.taxLogRepo.increaseTax(invoice._id, invoice.tax, session)
            }
            else if (account != undefined && ( paymentConfig.replacedFrom != undefined || paymentConfig.payFor == "chargeAccount")) {
                await accountRepo?.increaseWallet(account._id, paymentConfig.amount, session)
            }

            await this.repos.bankAccountRepo.addMoney(bank._id, paymentConfig.amount, session)

            try {
                await SmsMessager.send({
                    parameters: {
                        paymentType: "دستگاه‌پز",
                        trackingCode: paymentConfig.trakingCode
                    },
                    receptor: account.phoneNumber,
                    template: "paymentConfirmed"
                })

            } catch (error) {

            }



        } catch (error) {

            await session.abortTransaction();
            throw error;

        }
    }
    async rejectPOS(
        id: string,
        rejectMessage: string
    ) {
        try {
            var invoice
            const paymentConfig = await this.repos.paymentConfigRepo.findById(id);
            if (paymentConfig == null) {
                throw new Error()
            }

            const accountRepo = this.repos.accounts[paymentConfig.ownerType]
            const account = await accountRepo.findById(paymentConfig.owner as Types.ObjectId)
            if (account == null) {
                throw new Error()
            }

            if (paymentConfig.payFor == "invoice") {
                invoice = await this.repos.invoiceRepo.findById(paymentConfig?.invoice as string);
                if (invoice == null) {
                    throw new Error()
                }
            }
            const transaction = await this.repos.transactionRepo.findOne({
                paymentConfig: id
            })
            if (transaction == null) {
                throw new Error()
            }

            await this.repos.paymentConfigRepo.rejectPOS(id, rejectMessage)
            if (invoice != undefined)
                await this.repos.invoiceRepo.rejectPOS(invoice._id, paymentConfig.amount)
            await this.repos.transactionRepo.rejectPOS(transaction._id)

            try {
                await SmsMessager.send({
                    parameters: {
                        paymentType: "دستگاه‌پز",
                        trackingCode: paymentConfig.trakingCode,
                        rejectionReason: rejectMessage.replace(" ", "‌")
                    },
                    receptor: account.phoneNumber,
                    template: "paymentRejected"
                })
            } catch (error) {

            }


        } catch (error) {
            throw error
        }
    }
    async editPOS(
        data: EditPOSData
    ) {
        const session = await mongoose.startSession();
        session.startTransaction({

        });
        try {
            const paymentConfig = await this.repos.paymentConfigRepo.findById(data.id);
            var invoice

            if (paymentConfig == null) {
                throw new Error()
            }
            if (paymentConfig.payFor == "invoice") {
                invoice = await this.repos.invoiceRepo.findById(paymentConfig.invoice as string || "");
                if (invoice == null) {
                    throw new Error();
                }
            }
            const transaction = await this.repos.transactionRepo.findOne({
                paymentConfig: data.id
            })
            if (transaction == null) {
                throw new Error()
            }

            const pos = await this.repos.posRepo.findById(data.pos)
            if (pos == null) {
                throw new Error()
            }

            const bank = await this.repos.bankAccountRepo.findOne({
                _id: pos.bankAccount
            })
            if (bank == null) {
                throw new Error()
            }
            data["bank"] = bank._id

            const amount = paymentConfig.amount
            const newAmount = data.amount
            const amountDiff = newAmount - amount


            if (invoice != undefined) {
                if (invoice.remainedPrice - (invoice.waitForConfirmPrice + invoice.unrefinedPrice) < amountDiff) {
                    throw new Error("مبلغ وارد شده بیشتر از مبلغ باقیمانده است")
                }
                await this.repos.invoiceRepo.editPOS(invoice._id, amountDiff, session)
            }



            await this.repos.paymentConfigRepo.editPOS(data.id, data, session)
            await this.repos.transactionRepo.editPOS(transaction._id, data, session)


        } catch (error) {
            await session.abortTransaction();
            throw error
        }
    }
    ////////////////////////  pos /////////////////////////////


    ////////////////////////  transfer /////////////////////////////
    @validate("transfer")
    async confirmTransfer(
        id: string
    ) {
        const session = await mongoose.startSession();
        session.startTransaction({

        });
        try {
            const paymentConfig = await this.repos.paymentConfigRepo.findById(id);
            var invoice
            let accountRepo
            let account

            if (paymentConfig == null) {
                throw new Error()
            }

            if (paymentConfig.info?.destination == undefined) {
                throw new Error()
            }

            accountRepo = this.repos.accounts[paymentConfig.ownerType]
            account = await accountRepo.findById(paymentConfig.owner as Types.ObjectId)
            if (account == null) {
                throw new Error()
            }

            if (paymentConfig.payFor == "chargeAccount") {
                accountRepo = this.repos.accounts[paymentConfig.ownerType]

            }
            else if (paymentConfig.payFor == "invoice") {
                invoice = await this.repos.invoiceRepo.findById(paymentConfig?.invoice as string);
                if (invoice == null) {
                    throw new Error()
                }
            }

            const transaction = await this.repos.transactionRepo.findOne({
                paymentConfig: id
            })
            if (transaction == null) {
                throw new Error()
            }


            const bank = await this.repos.bankAccountRepo.findOne({
                _id: paymentConfig.info.destination
            })
            if (bank == null) {
                throw new Error()
            }

            await this.repos.paymentConfigRepo.acceptTransfer(id, session)
            await this.repos.transactionRepo.acceptTransfer(transaction._id, session)
            if (invoice != undefined) {
                await this.repos.invoiceRepo.acceptTransfer(invoice._id, paymentConfig.amount, session)
                await this.repos.taxLogRepo.increaseTax(invoice._id, invoice.tax, session)
            }
            else if (account != undefined && ( paymentConfig.replacedFrom != undefined || paymentConfig.payFor == "chargeAccount")) {
                await accountRepo?.increaseWallet(account._id, paymentConfig.amount, session)
            }
            await this.repos.bankAccountRepo.addMoney(bank._id, paymentConfig.amount, session)

            try {
                await SmsMessager.send({
                    parameters: {
                        paymentType: "انتقال",
                        trackingCode: paymentConfig.trakingCode
                    },
                    receptor: account.phoneNumber,
                    template: "paymentConfirmed"
                })
            } catch (error) {

            }




        } catch (error) {

            await session.abortTransaction();
            throw error
        }
    }
    async rejectTransfer(
        id: string,
        rejectMessage: string
    ) {
        try {
            var invoice
            const paymentConfig = await this.repos.paymentConfigRepo.findById(id);
            if (paymentConfig == null) {
                throw new Error()
            }

            if (paymentConfig.payFor == "invoice") {
                invoice = await this.repos.invoiceRepo.findById(paymentConfig?.invoice as string);
                if (invoice == null) {
                    throw new Error()
                }
            }

            const transaction = await this.repos.transactionRepo.findOne({
                paymentConfig: id
            })
            if (transaction == null) {
                throw new Error()
            }

            const accountRepo = this.repos.accounts[paymentConfig.ownerType]
            const account = await accountRepo.findById(paymentConfig.owner as Types.ObjectId)
            if (account == null) {
                throw new Error()
            }


            await this.repos.paymentConfigRepo.rejectTransfer(id, rejectMessage)
            if (invoice != undefined)
                await this.repos.invoiceRepo.rejectTransfer(invoice._id, paymentConfig.amount)
            await this.repos.transactionRepo.rejectTransfer(transaction._id)


            try {
                await SmsMessager.send({
                    parameters: {
                        paymentType: "نقدی",
                        trackingCode: paymentConfig.trakingCode,
                        rejectionReason: rejectMessage.replace(" ", "‌")
                    },
                    receptor: account.phoneNumber,
                    template: "paymentRejected"
                })
            } catch (error) {

            }


        } catch (error) {
            throw error
        }
    }
    async editTransfer(data: EditTransferData) {
        const session = await mongoose.startSession();
        session.startTransaction({

        });
        try {
            const paymentConfig = await this.repos.paymentConfigRepo.findById(data.id);
            var invoice
            if (paymentConfig == null) {
                throw new Error()
            }

            if (paymentConfig.payFor == "invoice") {
                invoice = await this.repos.invoiceRepo.findById(paymentConfig.invoice as string || "");
                if (invoice == null) {
                    throw new Error();
                }
            }

            const transaction = await this.repos.transactionRepo.findOne({
                paymentConfig: data.id
            })
            if (transaction == null) {
                throw new Error()
            }


            const bank = await this.repos.bankAccountRepo.findOne({
                _id: data.destination
            })
            if (bank == null) {
                throw new Error()
            }

            const amount = paymentConfig.amount
            const newAmount = data.amount
            const amountDiff = newAmount - amount

            if (invoice != undefined) {
                if (invoice.remainedPrice - (invoice.waitForConfirmPrice + invoice.unrefinedPrice) < amountDiff) {
                    throw new Error("مبلغ وارد شده بیشتر از مبلغ باقیمانده است")
                }
                await this.repos.invoiceRepo.editPOS(invoice._id, amountDiff, session)
            }



            await this.repos.paymentConfigRepo.editTransfer(data.id, data, session)
            await this.repos.transactionRepo.editTransfer(transaction._id, data, session)


        } catch (error) {
            await session.abortTransaction();
            throw error
        }
    }
    ////////////////////////  transfer /////////////////////////////




    //////////////////////// internal transfer /////////////////////////////
    async internalTransfer(data: InternalTransferData) {


    }

    async sendPayLink(id: string) {
        try {
            let payment = await this.repos.paymentConfigRepo.findOne({
                $or: [
                    {
                        _id: id
                    },
                    {
                        installment: id
                    }
                ]
            }, {})

            if (payment == null) {
                throw new Error("پرداخت یافت نشد")
            }
            if (payment.payType != "payGateWay") {
                throw new Error("لینک پرداخت یافت نشد")
            }

            const repo = this.repos.accounts[payment.ownerType]
            let account = await repo.findById(payment.owner as Types.ObjectId, {
                projection: {
                    name: 1,
                    family: 1,
                    wallet: 1,
                    email: 1,
                    _id: 1,
                    phoneNumber: 1
                }
            })
            if (account == null) {
                throw new Error("اکانت یافت نشد")
            }



            const domain = await this.domainRepo.findOne({
                isDefault: true
            })
            if (domain != null) {
                let link = `https://${domain.domain}/pay/${payment.trakingCode}`
          

                await SmsMessager.send({
                    parameters: {
                        paymentLink: link
                    },
                    receptor: account.phoneNumber,
                    template: "paymentLink"
                })
            }

            return
        } catch (error) {
            throw error
        }
    }


    //////////////////////   payGateway /////////////////////////

    async getPayPort() {
        try {
            let payGateWay = await this.repos.paymentGatewayRepo.findOne({

            })
            if (payGateWay != null) {
                return payGateWay
            }
            throw new Error("درگاه پرداخت یافت نشد")
        } catch (error) {
            throw error
        }
    }


    async getPaymentLink(trakingCode: string, paymentId?: string) {
        try {
            let payment = await this.repos.paymentConfigRepo.findOne({
                trakingCode: {
                    $eq: trakingCode
                }
            })
            if (payment == null) {
                throw new Error("پرداخت یافت نشد")
            }
            if (payment.status == "finished") {
                throw new Error("این پرداخت قبلا پرداخت شده است")
            }

            if (payment.payType != "payGateWay") {
                throw new Error("پرداخت نامعتبر")
            }

            if (payment.payPort != undefined) {
                let payGateWay = await this.repos.paymentGatewayRepo.findById(payment.payPort as string)
            }
            else {
                if (paymentId != undefined) {
                    let payGateWay = await this.repos.paymentGatewayRepo.findById(paymentId)
                    if (payGateWay == null) {
                        payGateWay = await this.getPayPort()
                    }
                }
                else {

                }
            }



        } catch (error) {
            throw error
        }
        return ""
    }


    async validatePayment() {

    }

}