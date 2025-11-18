import { z } from "zod";
import BaseController, { ControllerOptions } from "../controller";
import DomainImageConfig from "../repositories/domainImageConfig/model";
import DomainImageConfigRepository from "../repositories/domainImageConfig/repository";
import { Delete, Get, Post, Put } from "../../decorators/method";
import { Body, Query } from "../../decorators/parameters";
import { Response } from "../../controller";
import { FilterQuery } from "mongoose";
import { QueryInfo } from "../repository";
import DomainRepository from "../repositories/domain/repository";
import LanguageRepository from "../repositories/language/repository";
import ImageProccessesor from "../../services/imageProccessing";
import { DiskFileManager } from "../../services/fileManager";
import RandomGenarator from "../../random";



export class DomainImageController extends BaseController<DomainImageConfig> {
    domainRepo: DomainRepository
    languageRepo: LanguageRepository
    constructor(baseRoute: string, repo: DomainImageConfigRepository, options?: ControllerOptions) {
        super(baseRoute, repo, options)
        this.domainRepo = new DomainRepository()
        this.languageRepo = new LanguageRepository()
    }


    @Put("")
    async updateDomainImageConfig(
        @Query({
            destination: "id",
            schema: BaseController.id
        }) id: string,
        @Body({
            schema: z.object(
                {
                    //  watermark: z.boolean(),
                    // "watermark-config": BaseController.id.optional(),

                    // type: z.string().optional(),
                    "upload-path": z.object({
                        fileManager: BaseController.id,
                        path: z.string()
                    }),
                    "valid-Suffix": z.array(z.string()),
                    "nonConvert-Suffixs": z.array(z.string()).default([]),
                    "image-addressing": z.enum(["y-m-d", "y-m", "y", "y-n", "n", "y-m-n"]),
                    "make-phone-image": z.boolean().optional(),
                    "phone-width": z.number(),
                    "auto-translate-image-name": z.boolean(),
                    "show-big-image": z.boolean(),
                    "auto-submit-removal-image": z.boolean(),


                    "main-image-result-Suffixs": z.array(z.string()),
                    "watermark-main": z.boolean(),
                    "main-watermark-config": BaseController.id.optional(),
                    "main-remaked-compress": z.boolean().optional(),
                    "main-remaked-compress-quality": z.coerce.number().int().optional(),
                    "remove-main-image-src": z.boolean().optional(),
                    "compress-main": z.boolean().optional(),
                    "main-compress-quality": z.coerce.number().int().optional(),
                  


                    "in-content-image-result-Suffixs": z.array(z.string()),
                    "in-content-watermark": z.boolean(),
                    "in-content-watermark-config": BaseController.id.optional(),
                    "in-content-compress": z.boolean(),
                    "in-content-compress-quality": z.coerce.number().int().optional(),
                    "remove-in-content-main-image-src": z.boolean(),
                    "show-in-content-main-image": z.boolean(),
                    "in-content-compress-main" : z.boolean().optional(),
                    "in-content-compress-main-quality" : z.coerce.number().int().optional(),

                    "tempalte-image-result-Suffixs": z.array(z.string()),
                    "template-compress": z.boolean(),
                    "template-compress-quality": z.coerce.number().int().optional(),
                    
                }
            ),
        }) data: any
    ): Promise<Response> {
        try {
            // return await this.editById(id, {
            //     $set: {
            //         ...data
            //     }
            // })
  
            let result = await this.repository.updateOne({
                _id : id
            } , {
                $set : data
            })
            // console.log("result", result.modifiedCount)
            if(result.modifiedCount != 0){
                let result = await this.repository.updateOne({
                    _id : id
                } , {
                    $set : {
                        lastUpdate : new Date()
                    }
                })
            }
        } catch (error) {
            throw error
        }
        return {
            status : 200
        }

    }

    @Get("")
    async getById(
        @Query({
            destination: "id",
            schema: BaseController.id
        }) id: string
    ): Promise<Response> {
        try {
            return await this.findById(id, {
                population: [{
                    path: "domain"
                }]
            })
        } catch (error) {
            throw error
        }

    }

    async paginate(page: number, limit: number, query?: FilterQuery<DomainImageConfig>, options?: QueryInfo, ...params: [...any]): Promise<Response> {
        // console.log("paginate")
        let domains = []
        try {
            let defualtDomain = await this.domainRepo.findOne({ isDefault: true })
            let domainLang = await this.languageRepo.findAll({
                domain: {
                    $exists: true
                }
            })
            domains.push(defualtDomain?._id)
            for (let i = 0; i < domainLang.length; i++) {
                domains.push(domainLang[i].domain)
            }
        } catch (error) {
            throw error
        }

        let res = await super.paginate(page, limit, {
            domain: {
                $in: domains
            }
        }, {
            population: [{
                path: "domain"
            }]
        })
        let data = res.data

        let notExistsDomains = []
        try {
            for (let j = 0; j < domains.length; j++) {
                let exists = false
                for (let i = 0; i < data.list.length; i++) {
                    if (data.list[i].domain != null && data.list[i].domain._id?.toHexString() == domains[j].toHexString()) {
                        // console.log("domain ", data.list[i].domain._id)
                        exists = true
                        break
                    }
                }
                if (!exists) {
                    notExistsDomains.push(domains[j])
                }

            }
        } catch (error) {
            console.log(error)
        }
        let sample: any = {
            "upload-path": {
                "fileManager": "",
                "path": ""
            },
            "valid-Suffix": ["jpg", "png", "webp", "jpeg"],
            "image-result-Suffixs": ["webp", "jpg", "jpeg"],
            "nonConvert-Suffixs": ["jpg", "webp"],
            "image-addressing": "y-n",
            "convert-main": true,
            "compress-main": true,
            "make-phone-image": true,
            "compress-quality": 85,
            "phone-width": 300,
            "watermark-main": true,
            "watermark": true,
            "__v": 0,
            "watermark-config": "",
            "main-watermark-config": "",
            "auto-submit-removal-image": false,
            "auto-translate-image-name": false,
            // "change-main-image-resolution": true,
            // "change-main-image-width": 900,
            "in-content-compress": true,
            "in-content-compress-quality": 85,
            "in-content-image-result-Suffixs": ["png", "tiff"],
            "in-content-watermark": true,
            "in-content-watermark-config": "",
            "in-content-compress-main" : true,
            "in-content-compress-main-quality" : 80,
            "main-compress-quality": 85,
            "main-image-result-Suffixs": ["webp", "jpg", "jpeg"],
            "main-remaked-compress": true,
            "main-remaked-compress-quality": 85,
            "remove-in-content-main-image-src": false,
            "remove-main-image-src": true,
            "show-big-image": false,
            "show-in-content-main-image": true,
            "tempalte-image-result-Suffixs": ["webp", "jpg"],
            "template-compress": true,
            "template-compress-quality": 85
        }
        let nonexislist: any[] = JSON.parse(JSON.stringify(await this.domainRepo.findAll(
            {
                _id: {
                    $in: notExistsDomains
                }
            }
        )))
        for (let i = 0; i < nonexislist.length; i++) {
            nonexislist[i] = Object.assign(nonexislist[i], sample)

        }
        res.data["notExistsDomains"] = nonexislist
        return res

    }

    @Get("/compress/result")
    async getCompressResult(

        @Query({
            destination: "percent",
            schema: z.coerce.number().int().min(0).max(100).optional()
        }) percent: number,
        @Query({
            destination: "path",
            schema: z.string().optional()
        }) p?: string
    ): Promise<Response> {
        try {
            p = p == undefined ? "src/uploads/filters/sample.jpg" : await DiskFileManager.downloadFile(p)
            let paths = p.split(".")


            const newName = `src/uploads/tmp/${RandomGenarator.generateHashStr(15)}.${paths[paths.length - 1]}`
            await ImageProccessesor.compress(p, newName, percent)
            const resultStats = await DiskFileManager.stats(newName)
            const stats = await DiskFileManager.stats(p)
            return {
                status: 200,
                data: {
                    size: stats.size,
                    resultSize: resultStats.size,
                    result: newName.replace("src", "")
                }
            }
        } catch (error) {
            console.log(error)
            throw error
        }

    }
}

const domainImageConfig = new DomainImageController("/domainImageConfig", new DomainImageConfigRepository({
    population: [{
        source: "domain"
    }]
}), {
    insertSchema: z.object({
        "domain": BaseController.id,
      
        "upload-path": z.object({
            fileManager: BaseController.id,
            path: z.string()
        }),
        "valid-Suffix": z.array(z.string()),
        "nonConvert-Suffixs": z.array(z.string()).default([]),
        "image-addressing": z.enum(["y-m-d", "y-m", "y", "y-n", "n", "y-m-n"]),
        "make-phone-image": z.boolean().optional(),
        "phone-width": z.number(),
        "auto-translate-image-name": z.boolean(),
       
        "auto-submit-removal-image": z.boolean(),


        "main-image-result-Suffixs": z.array(z.string()),
        "watermark-main": z.boolean(),
        "main-watermark-config": BaseController.id.optional(),
        "main-remaked-compress": z.boolean().optional(),
        "main-remaked-compress-quality": z.coerce.number().int().optional(),
        "remove-main-image-src": z.boolean().optional(),
        "compress-main": z.boolean().optional(),
        "main-compress-quality": z.coerce.number().int().optional(),
        "change-main-image-resolution": z.boolean().optional(),
        "change-main-image-width": z.coerce.number().int().optional(),


        "in-content-image-result-Suffixs": z.array(z.string()),
        "in-content-watermark": z.boolean(),
        "in-content-watermark-config": BaseController.id.optional(),
        "in-content-compress": z.boolean(),
        "in-content-compress-quality": z.coerce.number().int().optional(),
        "remove-in-content-main-image-src": z.boolean(),
        "show-in-content-main-image": z.boolean(),
        "show-big-image": z.boolean(),

        "tempalte-image-result-Suffixs": z.array(z.string()),
        "template-compress": z.boolean(),
        "template-compress-quality": z.coerce.number().int().optional(),
    })
})

export default domainImageConfig