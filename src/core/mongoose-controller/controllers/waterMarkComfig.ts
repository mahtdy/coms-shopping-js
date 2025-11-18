import { Body, Files, Query, Session } from "../../decorators/parameters";
import { Response } from "../../controller";
import { Get, Post, Put } from "../../decorators/method";
import BaseController from "../controller";
import WaterMark from "../repositories/waterMarkConfig/model";
import WaterMarkRepository from "../repositories/waterMarkConfig/repository";
import { z } from "zod"
import ImageProccessesor from "../../services/imageProccessing";
import ConfigService from "../../services/config";
import { DiskFileManager } from "../../services/fileManager";
import fs from "fs"
import { FilterQuery, Types } from "mongoose";
import { QueryInfo } from "../repository";


var waterMarkConfig = z.object({
    name: z.string().optional(),
    type: z.enum([
        "text",
        "image"
    ]).optional(),
    gravity: z.enum([
        "NorthWest",
        "North",
        "NorthEast",
        "West",
        "Center",
        "East",
        "SouthWest",
        "South",
        "SouthEast"
    ]).optional(),
    imageAddress: z.string().optional(),
    text: z.string().optional(),
    textAlign: z.enum([
        "center",
        "right",
        "left"
    ]).optional(),
    lineSpacing: z.number().min(0).optional(),
    wordSpacing: z.number().min(0).optional(),
    position_x: z.number().min(0),
    position_y: z.number().min(0),
    x: z.coerce.number().int().min(0).optional(),
    y: z.coerce.number().int().min(0).optional(),
    transparency: z.coerce.number().int().max(100).min(0).optional(),
    fontSize: z.coerce.number().int().min(1).optional(),
    fontColor: z.string().optional(),
    fontName: z.string().optional(),
    waterMarkSizeType: z.enum([
        "relative",
        "fixed"
    ]).optional(),
    waterMarkSize: z.number().min(0).optional(),
    italic: z.boolean().optional(),
    bold: z.boolean().optional(),
    underline: z.boolean().optional(),
    shadowOffsetX: z.coerce.number().int().optional(),
    shadowOffsetY: z.coerce.number().int().optional(),
    shadowBlur: z.coerce.number().int().optional(),
    shadowColor: z.string().default("black").optional(),
    strokeWidths: z.coerce.number().int().optional(),
    strokeColor: z.string().default('black').optional(),
    angle: z.coerce.number().int().optional(),
    tile: z.coerce.number().optional(),
    diagonalLines: z.boolean().optional(),
    diagonalLinesColor: z.string().optional(),
    backgroundColor: z.string().optional(),
})


var insertSchema = z.object({
    lable: z.string(),
    configs: z.array(waterMarkConfig).optional(),
    resultAngle: z.coerce.number().int().optional(),
    resultQuality: z.coerce.number().int().max(100).min(0).optional(),
    resultSize: z.coerce.number().int().optional(),
    resultTypes: z.enum([
        "png",
        "jpg",
        "webp"
    ]).optional(),
    flipVertical: z.boolean(),
    flipHorizontal: z.boolean(),
    borderLeft: z.coerce.number().int().min(0).optional(),
    borderRight: z.coerce.number().int().min(0).optional(),
    borderTop: z.coerce.number().int().min(0).optional(),
    borderBotton: z.coerce.number().int().min(0).optional(),
    borderColor: z.string().optional(),
    contrast: z.coerce.number().int().max(100).min(-100).optional(),
    brightness: z.coerce.number().int().max(100).min(-100).optional(),
    grayscale: z.boolean().optional(),
    sepia: z.boolean().optional(),
    filter: z.enum([
        "amaro",
        "clarendon",
        "gingham",
        "moon",
        "lark",
        "reyes",
        "juno",
        "slumber",
        "crema",
        "ludwig",
        "aden",
        "perpetua",
        "mayfair",
        "rise",
        "hudson",
        "valencia",
        "x-pro2",
        "sierra",
        "willow",
        "lo-fi",
        "inkwell",
        "hefe",
        "nashville",
        "stinson",
        "vesper",
        "earlybird",
        "brannan",
        "sutro",
        "toaster",
        "walden",
        "1977",
        "kelvin",
        "maven",
        "ginza",
        "skyline",
        "dogpatch",
        "brooklyn",
        "helena",
        "ashby",
        "charmes"
    ]).optional()
})

export class WaterMarkController extends BaseController<WaterMark>{
    // @Post("")
    async create(data: WaterMark, @Session() session: any): Promise<Response> {
        if (data.configs == undefined) {
            data.configs = []
        }
        if (session.config?.configs) {
            let configs = session.config?.configs
            configs.push(...data.configs)
            data.configs = configs
        }
        var img : string = session['img']
        delete session['img']
        session['config'] = {}

        try {
            let res = await super.create(data)
           

           
            img = await ImageProccessesor.refresh("src/uploads/tmp/", img, data)
            let imgs = img.split("/")

            let Dimention =  await ImageProccessesor.calculateDimentions(img,128,true)

            const demoImgSmall : string= await ImageProccessesor.resize("src/uploads/filters/demo/",img,"jpg" ,Dimention.x , Dimention.y)

            await DiskFileManager.move(img,`src/uploads/filters/demo/`)
            img = `src/uploads/filters/demo/${imgs[imgs.length -1]}`

          
            await this.repository.updateOne({
                _id : res.data._id
            } , {
                $set : {
                    demoImg : img.replace("src",""),
                    demoImgSmall: demoImgSmall.replace("src","")
                }
            })
            
            res['session'] = session
            return res
        } catch (error) {
            throw error
        }
    }



    @Post("/test/submit")
    async submit(
        @Body({
            destination: "image"
        }) image: string,
        @Files({
            config: {
                name: "image",
                maxCount: 1,
                types: [
                    "jpeg",
                    "jpg",
                    "png",
                    "webp"
                ],
                dest: "src/uploads/tmp",

                // rename: true
            },
            destination: "image",
            mapToBody: true,
            isOptional: true,
            // skip :true
        }) files: any,
        @Session() session: any): Promise<Response> {
        try {
            if (image) {
                session['img'] = image
                session['config'] = {}
                image = ConfigService.getConfig("serverurl") + "/" + image.substring(4)
                // return new ApiResponse.SuccessResponse("succsess", {
                //     image
                // }).send(res)
                return {
                    status: 200,
                    data: {
                        image
                    },
                    session
                }
            }
            else {
                var name = Date.now() + ".jpg"
                DiskFileManager.wirteStream("src/uploads/tmp/" + name, fs.createReadStream("src/uploads/filters/sample.jpg"))
                // var image: string = req.body.image
                image = ConfigService.getConfig("serverurl") + "/" + "uploads/tmp/" + name

                session['img'] = "src/uploads/tmp/" + name
                session['config'] = {}


                return {
                    status: 200,
                    data: {
                        image
                    },
                    session
                }
            }
        } catch (error) {
            throw error
        }
    }

    @Post("/refresh")
    async refresh(@Session() session: any, @Body({
        schema: z.any()
    }) body: any): Promise<Response> {
        try {
            var img = session['img']
            var config = this.cleanConfig(body)
            if (config.configs) {
                for (let i = 0; i < config.configs.length; i++) {
                    config.configs[i] = this.cleanConfig(config.configs[i])
                }
            }

            img = await ImageProccessesor.refresh("src/uploads/tmp/", img, config)
            var ex = session['refreshd_image']
            if (ex != undefined) {
                try {
                    await DiskFileManager.removeFile(ex)
                } catch (error) {

                }

            }
            session['refreshd_image'] = img
            var image = ConfigService.getConfig("serverurl") + "/" + img.substring(4)


            return {
                status: 200,
                data: {
                    image
                },
                session
            }
        }
        catch (error) {
            console.log(error)
            throw error
        }

    }

    @Put("")
    async edit(
        @Query({
            destination: "id",
            schema: BaseController.id
        }) id: string,
        @Body({
            schema: insertSchema
        }) watermark: any,
        @Session() session: any,
    ): Promise<Response> {
        try {
            const exWatermark = await this.repository.findById(id)
            const doc = await this.repository.updateOne({
                _id: id
            }, {
                $set : watermark
            })  

            if(doc.modifiedCount != 0){
                await this.repository.updateOne({
                    _id : id
                } , {
                    $set : {
                        lastUpdate : new Date()
                    }
                })
            }
            
            var img : string = session['img']
            img = await ImageProccessesor.refresh("src/uploads/tmp/", img, watermark)
            let imgs = img.split("/")

            let Dimention =  await ImageProccessesor.calculateDimentions(img,128,true)

            const demoImgSmall : string= await ImageProccessesor.resize("src/uploads/filters/demo/",img,"jpg" ,Dimention.x , Dimention.y)

            await DiskFileManager.move(img,`src/uploads/filters/demo/`)
            img = `src/uploads/filters/demo/${imgs[imgs.length -1]}`


            await this.repository.updateOne({
                _id : id
            } , {
                $set : {
                    demoImg : img.replace("src",""),
                    demoImgSmall: demoImgSmall.replace("src","")
                }
            })
            
            try {
                await DiskFileManager.removeFile( "src" + exWatermark?.demoImg)
                await DiskFileManager.removeFile( "src" + exWatermark?.demoImgSmall)
            } catch (error) {
                
            }
            return {
                status : 200
            }
        } catch (error) {
            throw error   
        }
     
    }


    @Post("/reset")
    async reset(@Session() session: any): Promise<Response> {
        try {
            var name = Date.now() + ".jpg"
            DiskFileManager.wirteStream("src/uploads/tmp/" + name, fs.createReadStream("src/uploads/filters/sample.jpg"))
            let image = ConfigService.getConfig("serverurl") + "/" + "uploads/tmp/" + name

            let ex_img = session['img']

            session['img'] = "src/uploads/tmp/" + name
            session['config'] = {}

            if (ex_img != undefined) {
                try {
                    DiskFileManager.removeFile(ex_img)
                } catch (error) {

                }
            }


            return {
                status: 200,
                data: {
                    image
                },
                session
            }
        } catch (error) {
            throw error
        }
    }


    @Post("/apply")
    async apply(@Session() session: any, @Body({
        schema: z.any()
    }) body: any) {
        try {
            var img = session['img']
            var config = this.cleanConfig(body)
            if (config.configs) {
                for (let i = 0; i < config.configs.length; i++) {
                    config.configs[i] = this.cleanConfig(config.configs[i])
                }
            }
            let ex_img = session['img']


            img = await ImageProccessesor.refresh("src/uploads/tmp/", img, config)

            session['img'] = img
            if (session['config'] == undefined) {
                session['config'] = {}
            }
            if (session['config']['configs'] == undefined) {
                session['config']['configs'] = []
            }

            session['config']['configs'].push(config.configs)

            var image = ConfigService.getConfig("serverurl") + "/" + img.substring(4)
            // return new ApiResponse.SuccessResponse("succsess", {
            //     image
            // }).send(res)
            // console.log(session)
            if (ex_img != undefined)
                DiskFileManager.removeFile(ex_img)

            return {
                status: 200,
                data: {
                    image
                },
                session
            }
        }
        catch (error) {
            console.log(error)
            throw error
        }
    }

    cleanConfig(config: any) {
        var conf: any = {}
        for (const key in config) {
            if (config[key] != '') {
                conf[key] = config[key]
            }
        }
        return conf
    }


    @Get("/current")
    async getCurrent(@Session() session: any): Promise<Response> {
        var image = session['img']
        if (image == undefined) {
            var name = Date.now() + ".jpg"
            DiskFileManager.wirteStream("src/uploads/tmp/" + name, fs.createReadStream("src/uploads/filters/sample.jpg"))
            // var image: string = req.body.image
            image = ConfigService.getConfig("serverurl") + "/" + "uploads/tmp/" + name

            session['img'] = "src/uploads/tmp/" + name
            session['config'] = {}


            return {
                status: 200,
                data: {
                    image
                },
                session
            }
        }
        return {
            data: {
                image: ConfigService.getConfig("serverurl") + "/" + image.substring(4)
            },
            status: 200
        }
    }


    @Get("")
    findById(@Query({ destination: "id", schema: BaseController.id }) id: string | Types.ObjectId, queryInfo?: QueryInfo | undefined): Promise<Response> {
        return super.findById(id)
    }



    initApis(): void {
        super.initApis()
        this.addRouteWithMeta("/waterMarkes/search", "get", this.search.bind(this), BaseController.searcheMeta),
        this.addRoute("/search/list", "get", this.getSearchList.bind(this))
        
    }
}
const watermark = new WaterMarkController("/waterMark", new WaterMarkRepository(), {
    insertSchema,
    paginationConfig: {
        fields: {
            lable: {
                en_title: "lable",
                fa_title: "برچسب",
                isOptional: false,
                sortOrderKey: false,
                type: "string"
            },
            filter: {
                en_title: "filter",
                fa_title: "فیلتر",
                isOptional: true,
                sortOrderKey: false,
                type: "string",
                isSelect: true,
                selectList: [
                    "amaro",
                    "clarendon",
                    "gingham",
                    "moon",
                    "lark",
                    "reyes",
                    "juno",
                    "slumber",
                    "crema",
                    "ludwig",
                    "aden",
                    "perpetua",
                    "mayfair",
                    "rise",
                    "hudson",
                    "valencia",
                    "x-pro2",
                    "sierra",
                    "willow",
                    "lo-fi",
                    "inkwell",
                    "hefe",
                    "nashville",
                    "stinson",
                    "vesper",
                    "earlybird",
                    "brannan",
                    "sutro",
                    "toaster",
                    "walden",
                    "1977",
                    "kelvin",
                    "maven",
                    "ginza",
                    "skyline",
                    "dogpatch",
                    "brooklyn",
                    "helena",
                    "ashby",
                    "charmes"
                ]
            }
        },
        paginationUrl: "/waterMarkes/search",
        searchUrl: "/waterMarkes/search",
        serverType: "",
        tableLabel: "waterMark",
        actions: [
            {
                route: "panel/watermark/edit/$_id",
                type: "edit",
                api: "",
                queryName: "",
                fromData: ["_id"]
            },
            {
                route: "panel/watermark",
                type: "insert",
                api: "",
                queryName: "",
                text: "اضافه کردن مورد جدید"
            },

            {
                route: "panel/watermark/delete",
                type: "delete",
                api: "/watermark",
                queryName: ""
            }
        ]

    },
    searchFilters: {
        lable: ["reg"]
    },
    

})



export default watermark