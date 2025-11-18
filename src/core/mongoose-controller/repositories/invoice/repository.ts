import SystemConfigRepository from "../system/repository";
import BaseRepositoryService, { RepositoryConfigOptions } from "../../repository";
import Invoice, { InvoiceModel } from "./model";
import { ClientSession, Model, Types } from "mongoose";
import Transaction from "../transaction/model";
import PaymentConfigRepository from "../paymentConfig/repository";
import ConfigService from "../../../services/config";


export default class InvoiceRepository<T extends Invoice> extends BaseRepositoryService<T>{
    systemConfigRepo: SystemConfigRepository
    // paymentConfigRepo : PaymentConfigRepository
    constructor( collection : Model<T> ,options?: RepositoryConfigOptions) {
        super(collection, options)
        this.systemConfigRepo = new SystemConfigRepository()
        this.paymentConfigRepo = new PaymentConfigRepository()
  
    }

    //////////////////////////// paidFrom wallet //////////////////////////
    async payFromWallet(id : string , amount : number, session: ClientSession){
        try {
            await this.findByIdAndUpdate(id, {
                $inc : {
                    totalRemainedPrice : -amount,
                    remainedPrice: -amount,
                    paidPrice: amount,
                    totalPaidPrice: amount,
                }
            }, {
                
                // session,
                runValidators : true
            })
        } catch (error) {
            throw error
        }
    }


    async acceptInstallments(id : string , amount : number , session : ClientSession){
        try {
            await this.findByIdAndUpdate(id, {
                $inc : {
                    unrefinedPrice: amount,
                    waitForConfirmPrice: -amount
                }
            }, {
                // session,
                runValidators : true
            })
        } catch (error) {
            throw error
        }
    }


    ////////////////////////// check ///////////////////////////
    async acceptCheck(id : string , amount : number , session : ClientSession) {
        try {
            await this.findByIdAndUpdate(id, {
                $inc : {
                    unrefinedPrice: amount,
                    waitForConfirmPrice: -amount
                }
            }, {
                // session,
                runValidators : true
            })
        } catch (error) {
            throw error
        }
    }
    async rejectCheck(
        id : string , amount : number, session : ClientSession
    ){
        try {
            await this.findByIdAndUpdate(id, {
                $inc : {
                    waitForConfirmPrice: -amount
                }
            }, {
                // session,
                runValidators : true
            })
        } catch (error) {
            throw error
        }
    }

    async editCheck(id: string ,amountDiff : number , session : ClientSession){
        try {
            await this.findByIdAndUpdate(id, {
                $inc : {
                    waitForConfirmPrice: amountDiff
                }
            })
        } catch (error) {
            throw error
        }
    }


    async checkPassed(id : string ,amount : number , session : ClientSession){
        try {
            await this.findByIdAndUpdate(id , {
                $inc : {

                    unrefinedPrice: -amount,
                }
            })
        } catch (error) {
            throw error
        }
    }


    async checkReplaced(id : string ,amount : number , session : ClientSession){
        await this.updateOne({
            _id: id
        }, {
            $inc: {
                unrefinedPrice : - amount,
                waitForConfirmPrice : amount
            }
        })
    }
    ///////////////////////// check ///////////////////////////


    ///////////////////////// cash //////////////////////////
    async acceptCash(id : string , amount : number, session: ClientSession){
        try {
            await this.findByIdAndUpdate(id, {
                $inc : {
                    totalRemainedPrice : -amount,
                    remainedPrice: -amount,
                    paidPrice: amount,
                    totalPaidPrice: amount,
                    waitForConfirmPrice: -amount
                }
            }, {
                // session,
                runValidators : true
            })
        } catch (error) {
            throw error
        }
    }

    async rejectCash(
        id : string , amount : number
    ){
        try {
            await this.findByIdAndUpdate(id, {
                $inc : {
                    waitForConfirmPrice: -amount
                }
            }, {
                // session,
                runValidators : true
            })
        } catch (error) {
            throw error
        }
    }


    async editCash(id: string ,amountDiff : number , session : ClientSession){
        try {
            await this.findByIdAndUpdate(id, {
                $inc : {
                    waitForConfirmPrice: amountDiff
                }
            })
        } catch (error) {
            throw error
        }
    }
    ///////////////////////// cash ///////////////////////////  


    //////////////////////////  pos //////////////////////////
    async acceptPOS(id : string ,amount : number ,session: ClientSession){
        try {
            await this.findByIdAndUpdate(id, {
                $inc : {
                    totalRemainedPrice : -amount,
                    remainedPrice: -amount,
                    paidPrice: amount,
                    totalPaidPrice: amount,
                    waitForConfirmPrice: -amount
                }
            }, {
                // session,
                runValidators : true
            })
        } catch (error) {
            throw error
        }
    }

    async rejectPOS(id : string , amount : number){
        try {
            await this.findByIdAndUpdate(id, {
                $inc : {
                    waitForConfirmPrice: -amount
                }
            }, {
                // session,
                runValidators : true
            })
        } catch (error) {
            throw error
        }
    }

    async editPOS(id: string ,amountDiff : number , session : ClientSession){
        try {
            await this.findByIdAndUpdate(id, {
                $inc : {
                    waitForConfirmPrice: amountDiff
                }
            })
        } catch (error) {
            throw error
        }
    }

    ///////////////////////// pos //////////////////////////


    ///////////////////////// transfer /////////////////////////
    async acceptTransfer(
        id: string,
        amount : number,
        session : ClientSession
    ){
        try {
            await this.findByIdAndUpdate(id, {
                $inc : {
                    totalRemainedPrice : -amount,
                    remainedPrice: -amount,
                    paidPrice: amount,
                    totalPaidPrice: amount,
                    waitForConfirmPrice: -amount
                }
            }, {
                // session,
                runValidators : true
            })
        } catch (error) {
            throw error
        }
    }

    async rejectTransfer(
        id : string,
        amount : number
    ){
        try {
            await this.findByIdAndUpdate(id, {
                $inc : {
                    waitForConfirmPrice: -amount
                }
            }, {
                runValidators : true
            })
        } catch (error) {
            throw error
        }
    }

    async editTransfer(id: string ,amountDiff : number , session : ClientSession){
        try {
            await this.findByIdAndUpdate(id, {
                $inc : {
                    waitForConfirmPrice: amountDiff
                }
            })
        } catch (error) {
            throw error
        }
    }

    ///////////////////////// transfer ///////////////////////////////



    // async transactionPaid(id : string | Types.ObjectId ,transaction : Transaction){
    //     try {
    //         let invoice = await this.findById(
    //             id
    //         )
    //         if(invoice == null){
    //             return
    //         }
    //         if(transaction.installmentId != undefined){
    //            let additionalPrice = await this.installmentRepo.installmentPaid(transaction.installmentId,transaction.amount,transaction._id)
                
    //         }
    //         else if(transaction.paymentConfig) {
    //            await this.paymentConfigRepo.transactionPaid(
    //             transaction.paymentConfig,
    //             transaction.amount,
    //             transaction._id
    //            )
    //         }
            
            
    //     } catch (error) {
    //         throw error
    //     }
    // }
    
    async getFactorNumber(){
        let number = await this.systemConfigRepo.getConfigValue("invoice-number")
        if (number == undefined) {
            await this.systemConfigRepo.insert({
                key: "invoice-number",
                value: 1001,
                lable: ConfigService.getConfig("projectName"),
                type: "Number"
            } as any)
            number = 1000
        }
        else {
            await this.systemConfigRepo.updateOne({
                key: "invoice-number",
            } , {
                $set : {
                    value : number +1
                }
            })
        }
        return number + 1
    }

 


    async insert(document: T, options?: any): Promise<any> {
    
        try {
            let number = await this.getFactorNumber()
            document.factorNumber = number + 1
            let r = await super.insert(document) 
            await this.emitInvoice(r._id)
            return r
        } catch (error) {
            throw error
        }
        
    }


    async emitInvoice(id : string){
        try {
            
        } catch (error) {
            
        }
    }
}