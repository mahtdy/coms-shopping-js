
import fs from "fs"
import { promisify } from "util"
import SmsTemplateRepository from "../mongoose-controller/repositories/smsTemplate/repository"
import SmsMessager from "../messaging/smsMessager"
import SmsConfigRepository from "../mongoose-controller/repositories/smsConfig/repository"
import * as templates from "./sms/core.json"
import ConfigService from "../services/config"



export default async function init() {

    const smsTemplateRepo = new SmsTemplateRepository()
    const smsConfigRepo = new SmsConfigRepository()

    try {
        const otpConfig = await smsConfigRepo.getOTP()
        for (let i = 0; i < templates.length; i++) {
            
            let isExists = await smsTemplateRepo.isExists({
                title: templates[i].title
            })
            let template = templates[i]
            template.text = templates[i].text.replace("سیستم مدیریت محتوای کامز", ConfigService.getConfig("projectFaFullName"))
   

            if (isExists != true) {
                // if (otpConfig != null) {
                //     var id  = await SmsMessager.addTemplate({
                //         template : template as any,
                //         text  : template.text
                //     })
                //     console.log('id' , id)
                //     template.id = id
                // }
                await smsTemplateRepo.insert(template as any)
            }

        }
    } catch (error) {
        console.log("error")
    }
}

// init()