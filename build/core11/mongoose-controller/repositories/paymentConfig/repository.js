"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../../repository"));
const model_1 = require("./model");
const moment_jalaali_1 = __importDefault(require("moment-jalaali"));
const jalaali_js_1 = __importStar(require("jalaali-js"));
class PaymentConfigRepository extends repository_1.default {
    // invoiceRepo : InvoiceRepository
    constructor(options) {
        super(model_1.PaymentConfigModel, options);
        // this.invoiceRepo = new InvoiceRepository(options)
        // this.invoiceRepo = new InvoiceRepository(
    }
    convertToJalali(date) {
        return (0, moment_jalaali_1.default)(date, 'YYYY-MM-DD').format('jYYYY/jMM/jDD');
    }
    shamsiToMiladi(year, month, day) {
        const { gy, gm, gd } = jalaali_js_1.default.toGregorian(year, month, day);
        return new Date(gy, gm - 1, gd);
    }
    addDays(date, days, t) {
        let m = (0, moment_jalaali_1.default)(date, 'YYYY-MM-DD');
        m.add(days, t);
        return m.format('YYYY-MM-DD');
    }
    insert(document, options) {
        return super.insert(document, options);
    }
    updatePaymentConfig(id) {
    }
    calculateEMIMarket(principal, annualRate, months, prePayment, paymentIntervalDays, startDate, period = 0) {
        const coefficient = 30 / paymentIntervalDays;
        // const monthlyRate = (annualRate / 100) / (12 * coefficient);
        if (annualRate == 0) {
            var monthlyRate = 0;
        }
        else
            var monthlyRate = (annualRate / 100) / (12 * coefficient);
        principal -= prePayment;
        const monthlyInterest = principal * monthlyRate;
        const emi = principal / months + monthlyInterest;
        let remainingPrincipal = principal;
        const schedule = [];
        for (let i = 1; i <= months; i++) {
            let interest = monthlyInterest;
            let principalPayment = emi - interest;
            remainingPrincipal -= principalPayment;
            let dueDate = "";
            let currentDate = this.convertToJalali(startDate);
            if (paymentIntervalDays % 30 === 0 && paymentIntervalDays >= 30) {
                dueDate = addJalali(currentDate, (paymentIntervalDays / 30) * (i + period), "months");
            }
            else {
                var now = new Date(startDate);
                now.setDate(now.getDate() + paymentIntervalDays * (i + period));
                dueDate = (0, moment_jalaali_1.default)(now).format('jYYYY/jMM/jDD');
            }
            dueDate = dueDate.replace("-", "/");
            dueDate = dueDate.replace("-", "/");
            let dateObjects = dueDate.split("/");
            let dueDateGregorian = this.shamsiToMiladi(parseInt(dateObjects[0]), parseInt(dateObjects[1]), parseInt(dateObjects[2]));
            dueDateGregorian.setDate(dueDateGregorian.getDate() + 1);
            dueDateGregorian.setSeconds(dueDateGregorian.getSeconds() - 1);
            schedule.push({
                paymentNumber: i,
                emi: emi.toFixed(0),
                interest: interest.toFixed(0),
                principalPayment: principalPayment.toFixed(0),
                remainingPrincipal: remainingPrincipal.toFixed(0),
                dueDate: dueDate,
                dueDateGregorian,
                number: i
            });
            currentDate = dueDate;
        }
        return schedule;
    }
    calculateEMI(principal, annualRate, months, prePayment, paymentIntervalDays, startDate, period = 0) {
        const coefficient = 30 / paymentIntervalDays;
        if (annualRate == 0) {
            var monthlyRate = 0;
        }
        else
            var monthlyRate = (annualRate / 100) / (12 * coefficient);
        principal -= prePayment;
        if (monthlyRate == 0)
            var emi = principal;
        else
            var emi = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
        let remainingPrincipal = principal;
        const schedule = [];
        for (let i = 1; i <= months; i++) {
            const interest = remainingPrincipal * monthlyRate;
            const principalPayment = emi - interest;
            remainingPrincipal -= principalPayment;
            let dueDate = "";
            let currentDate = this.convertToJalali(startDate);
            if (paymentIntervalDays % 30 === 0 && paymentIntervalDays >= 30) {
                dueDate = addJalali(currentDate, (paymentIntervalDays / 30) * (i + period), "months");
            }
            else {
                var now = new Date(startDate);
                now.setDate(now.getDate() + paymentIntervalDays * (i + period));
                dueDate = (0, moment_jalaali_1.default)(now).format('jYYYY/jMM/jDD');
            }
            dueDate = dueDate.replace("-", "/");
            dueDate = dueDate.replace("-", "/");
            let dateObjects = dueDate.split("/");
            let dueDateGregorian = this.shamsiToMiladi(parseInt(dateObjects[0]), parseInt(dateObjects[1]), parseInt(dateObjects[2]));
            dueDateGregorian.setDate(dueDateGregorian.getDate() + 1);
            dueDateGregorian.setSeconds(dueDateGregorian.getSeconds() - 1);
            schedule.push({
                paymentNumber: i,
                emi: emi.toFixed(0),
                interest: interest.toFixed(0),
                principalPayment: principalPayment.toFixed(0),
                remainingPrincipal: remainingPrincipal.toFixed(0),
                dueDate: dueDate,
                dueDateGregorian,
                number: i
            });
            currentDate = dueDate;
        }
        return schedule;
    }
    roundUpToPlace(value, places) {
        const factor = Math.pow(10, places);
        return Math.ceil(value / factor) * factor;
    }
    async installmentPaid(id, paidAmount, fullPaid) {
        try {
            let paymentConfig = await this.findById(id);
            if (paymentConfig == null) {
                return;
            }
            let query = {
                $inc: {
                    "installmentConfig.paidAmount": paidAmount
                }
            };
            if (fullPaid) {
                query["$inc"]["installmentConfig.paidCount"] = 1;
                query["$inc"]["installmentConfig.remainedPrice"] = -paidAmount;
            }
            if (paymentConfig.installmentConfig.paidCount + 1 == paymentConfig.installmentConfig.count) {
                query["$set"] = {
                    status: "finished"
                };
            }
            await this.updateOne({
                _id: id,
            }, query);
        }
        catch (error) {
            throw error;
        }
    }
    async forgetPenalty(id) {
        try {
            await this.updateOne({
                _id: id
            }, {
                $set: {
                    penalty: 0,
                    penaltyForget: true
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async transactionPaid(id, transactionAmount, transactionId) {
        try {
        }
        catch (error) {
            throw error;
        }
    }
    async cancelPayment(id) {
        try {
            await this.updateOne({
                _id: id
            }, {
                $set: {
                    status: "canceled"
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async confirmPayment(id, session) {
        try {
            await this.updateOne({
                _id: id
            }, {
                $set: {
                    status: "finished",
                    "installmentConfig.nextStep": "completed",
                    "installmentConfig.confirmedAt": new Date()
                }
            }, {
                // session,
                runValidators: true
            });
        }
        catch (error) {
            throw error;
        }
    }
    async confirmWarranty(id) {
        var _a;
        try {
            const payment = await this.findById(id);
            if (payment == null) {
                throw new Error("پرداخت یافت نشد");
            }
            let nextStep = "finalApproval";
            if (((_a = payment.installmentConfig) === null || _a === void 0 ? void 0 : _a.payType) == "check") {
                nextStep = "checks";
            }
            await this.updateOne({
                _id: id
            }, {
                $set: {
                    "installmentConfig.nextStep": nextStep
                }
            }, {
                runValidators: true
            });
        }
        catch (error) {
            throw error;
        }
    }
    /////////////////////// installment //////////////////////
    async rejectInstallment(id, rejectMessage) {
        try {
            await this.updateOne({
                _id: id
            }, {
                $set: {
                    status: "rejected",
                    "installmentConfig.nextStep": "completed",
                    rejectMessage
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    /////////////////////// installment //////////////////////
    /////////////////////// check //////////////////////
    async makCheckReadyForCancel(id) {
        try {
            await this.updateOne({
                _id: id
            }, {
                $set: {
                    status: "readyForCancle"
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async acceptCheck(id, session) {
        try {
            let payment = await this.findByIdAndUpdate(id, {
                $set: {
                    status: "inproccess",
                }
            }, {
                // session,
                runValidators: true
            });
            if ((payment === null || payment === void 0 ? void 0 : payment.replacedFrom) != undefined) {
                await this.makCheckReadyForCancel(payment === null || payment === void 0 ? void 0 : payment.replacedFrom);
            }
        }
        catch (error) {
            throw error;
        }
    }
    async rejectCheck(id, rejectMessage, session) {
        try {
            await this.updateOne({
                _id: id
            }, {
                $set: {
                    status: "rejected",
                    rejectMessage
                }
            }, {
                // session,
                runValidators: true
            });
        }
        catch (error) {
            throw error;
        }
    }
    async editCheck(id, data, session) {
        try {
            await this.updateOne({
                _id: id
            }, {
                $set: {
                    deadline: data.deadline,
                    amount: data.amount,
                    "info.number": data.number,
                    "info.saiadNumber": data.saiadNumber,
                    "info.bank": data.bank,
                    "info.branch": data.branch,
                }
            }, {
                // session,
                runValidators: true
            });
        }
        catch (error) {
            throw error;
        }
    }
    async changeCheckPlace(data, session) {
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
            await this.findByIdAndUpdate(data.id, q);
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
                    status: "finished",
                    paidAt: new Date(),
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async checkReturned(id) {
        try {
            await this.updateOne({
                _id: id
            }, {
                $set: {
                    status: "returned",
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async confirmCancleAndChangeCheck(id) {
        try {
            await this.updateOne({
                _id: id
            }, {
                $set: {
                    codeConfirmed: true
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async checkChanged(id, paymentConfig, session) {
        try {
            await this.updateOne({
                _id: id
            }, {
                $set: {
                    replacedBy: paymentConfig,
                    status: "waitingForCancle",
                    // trakingCode‍
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async submitCheckCancel(id) {
        try {
            await this.updateOne({
                _id: id
            }, {
                $set: {
                    status: "ended"
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    /////////////////////// check //////////////////////
    //////////////////////// cash /////////////////////////
    async acceptCash(id, session) {
        try {
            let payment = await this.findByIdAndUpdate(id, {
                $set: {
                    status: "finished",
                    paidAt: new Date()
                }
            }, {
                // session,
                runValidators: true
            });
            if ((payment === null || payment === void 0 ? void 0 : payment.replacedFrom) != undefined) {
                await this.makCheckReadyForCancel(payment === null || payment === void 0 ? void 0 : payment.replacedFrom);
            }
        }
        catch (error) {
            throw error;
        }
    }
    async rejectCash(id, rejectMessage) {
        try {
            await this.updateOne({
                _id: id
            }, {
                $set: {
                    status: "rejected",
                    rejectMessage
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async editCash(id, data, session) {
        try {
            await this.updateOne({
                _id: id
            }, {
                $set: {
                    deadline: data.deadline,
                    amount: data.amount,
                }
            }, {
                // session,
                runValidators: true
            });
        }
        catch (error) {
            throw error;
        }
    }
    /////////////////////// cash //////////////////////////
    ////////////////////// pos /////////////////////////
    async acceptPOS(id, session) {
        try {
            let payment = await this.findByIdAndUpdate(id, {
                $set: {
                    status: "finished",
                    paidAt: new Date()
                }
            }, {
                // session,
                runValidators: true
            });
            if ((payment === null || payment === void 0 ? void 0 : payment.replacedFrom) != undefined) {
                await this.makCheckReadyForCancel(payment === null || payment === void 0 ? void 0 : payment.replacedFrom);
            }
        }
        catch (error) {
            throw error;
        }
    }
    async rejectPOS(id, rejectMessage) {
        try {
            await this.updateOne({
                _id: id
            }, {
                $set: {
                    status: "rejected",
                    rejectMessage
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async editPOS(id, data, session) {
        try {
            await this.updateOne({
                _id: id
            }, {
                $set: {
                    deadline: data.deadline,
                    amount: data.amount,
                    "info.pos": data.pos,
                    "info.account": data.bank
                }
            }, {
                // session,
                runValidators: true
            });
        }
        catch (error) {
            throw error;
        }
    }
    ///////////////////// pos /////////////////////////
    ////////////////////// transfer /////////////////////
    async acceptTransfer(id, session) {
        try {
            let payment = await this.findByIdAndUpdate(id, {
                $set: {
                    status: "finished",
                    paidAt: new Date()
                }
            }, {
                // session,
                runValidators: true
            });
            if ((payment === null || payment === void 0 ? void 0 : payment.replacedFrom) != undefined) {
                await this.makCheckReadyForCancel(payment === null || payment === void 0 ? void 0 : payment.replacedFrom);
            }
        }
        catch (error) {
            throw error;
        }
    }
    async rejectTransfer(id, rejectMessage) {
        try {
            await this.updateOne({
                _id: id
            }, {
                $set: {
                    status: "rejected",
                    rejectMessage
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async editTransfer(id, data, session) {
        try {
            await this.updateOne({
                _id: id
            }, {
                $set: {
                    deadline: data.deadline,
                    amount: data.amount,
                    "info.destination": data.destination,
                    "info.code": data.code,
                    "info.source": data.source,
                }
            }, {
                // session,
                runValidators: true
            });
        }
        catch (error) {
            throw error;
        }
    }
}
exports.default = PaymentConfigRepository;
function getJalaliMonthLength(jy, jm) {
    if (jm <= 6)
        return 31;
    if (jm <= 11)
        return 30;
    return (0, jalaali_js_1.isLeapJalaaliYear)(jy) ? 30 : 29;
}
function addJalaliDays(jy, jm, jd, daysToAdd) {
    let year = jy;
    let month = jm;
    let day = jd + daysToAdd;
    while (day > getJalaliMonthLength(year, month)) {
        day -= getJalaliMonthLength(year, month);
        month++;
        if (month > 12) {
            month = 1;
            year++;
        }
    }
    while (day < 1) {
        month--;
        if (month < 1) {
            month = 12;
            year--;
        }
        day += getJalaliMonthLength(year, month);
    }
    return [year, month, day];
}
function addJalaliMonths(jy, jm, jd, monthsToAdd) {
    let year = jy + Math.floor((jm - 1 + monthsToAdd) / 12);
    let month = ((jm - 1 + monthsToAdd) % 12) + 1;
    let day = jd;
    const monthLength = getJalaliMonthLength(year, month);
    if (day > monthLength) {
        day = monthLength;
    }
    return [year, month, day];
}
function addJalaliYears(jy, jm, jd, yearsToAdd) {
    let year = jy + yearsToAdd;
    let month = jm;
    let day = jd;
    const monthLength = getJalaliMonthLength(year, month);
    if (day > monthLength) {
        day = monthLength;
    }
    return [year, month, day];
}
function pad(n) {
    return n.toString().padStart(2, '0');
}
function addJalali(date, value, unit) {
    const [jy, jm, jd] = date.split(/[-/]/).map(Number);
    if (jm < 1 || jm > 12) {
        console.error('ماه نامعتبر:', jm);
        return '';
    }
    const monthLength = getJalaliMonthLength(jy, jm);
    if (jd < 1 || jd > monthLength) {
        console.error('روز نامعتبر:', jd);
        return '';
    }
    let newDate;
    if (unit === 'days') {
        newDate = addJalaliDays(jy, jm, jd, value);
    }
    else if (unit === 'months') {
        newDate = addJalaliMonths(jy, jm, jd, value);
    }
    else if (unit === 'years') {
        newDate = addJalaliYears(jy, jm, jd, value);
    }
    else {
        console.error('واحد نامعتبر:', unit);
        return '';
    }
    return `${newDate[0]}-${pad(newDate[1])}-${pad(newDate[2])}`;
}
