import { Body, Files, Query, User } from "../../../decorators/parameters"
import { Response } from "../../../controller"
import BaseController, { ControllerOptions } from "../../controller"
import Ticket, { TicketState } from "../../repositories/ticket/model"
import TicketRepository from "../../repositories/ticket/repository"
import z from "zod"
import { Get, Post, Put } from "../../../decorators/method"
import { FilterQuery } from "mongoose"
import { QueryInfo } from "../../repository"
import { UserInfo } from "../../auth/user/userAuthenticator"
import FileManagerConfigRepository from "../../repositories/fileManagerConfig/repository"
import ConfigService from "../../../services/config"
import DepartmentRepository from "../../repositories/department/repository"
// import { UserInfo } from 

export class TicketController extends BaseController<Ticket>{
    departmentRepo: DepartmentRepository

    constructor(baseRoute: string, repo: TicketRepository, options?: ControllerOptions) {
        super(baseRoute, repo, options)
        this.departmentRepo = new DepartmentRepository()
        // this.loginRequired = true
        this.apiDoc = {
            security: [{
                BasicAuth: []
            }]
        }
    }

    @Post("")
    create(
        data: any,
        @User() user: UserInfo,
        @Body({
            destination: "file"
        }) file?: string,
        @Files({
            config: {
                name: "file",
                maxCount: 1,
                types: ["jpg", "pdf", "png", "zip"]
            },
            schema: z.any().optional(),
            destination: "file",
            mapToBody: true,
            moveFilesToCDN: {
                name: "file",
                config: {
                    path: "ticketing/",
                    customServer: async function () {
                        try {
                            var cdnRepo = new FileManagerConfigRepository()
                            var conf = await cdnRepo.findOne({
                                isDefaultContent: true
                            })
                            var conf = await cdnRepo.findOne({
                                isDefault: true
                            })

                            if (conf == null) {
                                return ConfigService.getConfig("TEMP_FILEMANAGER")
                            }
                            return conf

                        } catch (error) {
                            return ConfigService.getConfig("TEMP_FILEMANAGER")
                        }
                    }
                }
            },
            isOptional: true
        }) files?: any,
    ): Promise<Response> {
        data.messages = JSON.parse(data.messages as string)
        if (data.messages) {
            for (let i = 0; i < data.messages.length; i++) {
                data.messages[i].from = 'user'
                data.messages[i].user = user.id
            }
            if (file && file != "") {
                try {
                    data.messages[0]['files'] = [{
                        path: file,
                        size: files[0].size / 1000
                    }]
                } catch (error) {

                }
            }
        }
        data.owner = "user"
        data.user = user.id
        data.starter = "user"
        data.lastMessage = "user"

        return super.create(data)
    }

    @Get("")
    async getTicket(
        @Query({
            destination: "id",
            schema: BaseController.id
        }) id: string,
        @User() user: UserInfo,
    ) {
        return this.findOne({
            _id: id,
            user: user.id
        },)
    }



    @Put("/close")
    async closeTicket(
        @Body({
            destination: "id",
            schema: BaseController.id
        }) id: string,
        @User() user : UserInfo
        ): Promise<Response> {
        return this.editOne({
            user : user.id,
            _id : id
        }, {
            $set: {
                state: "closed",
                lastModified: new Date(),
                stateNumber: 0,
                closeDate: new Date()
            }
        })
    }

    @Put("/open")
    async openTicket(
        @Body({
            destination: "id",
            schema: BaseController.id
        }) id: string,
        @User() user : UserInfo
    ): Promise<Response> {
        return this.editOne({
            user : user.id,
            _id : id
        }, {
            $set:
            {
                state: "open",
                stateNumber: 1,
                lastModified: new Date()
            },
            $unset:
            {
                closeDate: 1
            }
        })
    }

    @Post("/message", {
        contentType: "multipart/form-data",

    })
    async addMessage(
        @Body({
            destination: "messages",
            schema: z.array(z.object({
                text: z.string(),
                files: z.array(z.string()).default([])
            }).omit({ "files": true })),
            parseJson: true,
            isArray: true
        }) messages: any[],
        @Body({
            destination: "id",
            schema: BaseController.id
        }) id: string,
        @User() user: UserInfo,
        @Body({
            destination: "file"
        }) file?: string,
        @Files({
            config: {
                name: "file",
                maxCount: 5,
                types: ["jpg", "pdf", "png", "zip"]
            },
            schema: z.any().optional(),
            destination: "file",
            mapToBody: true,
            moveFilesToCDN: {
                name: "file",
                config: {
                    path: "ticketing/",
                    customServer: async function () {
                        try {
                            var cdnRepo = new FileManagerConfigRepository()
                            var conf = await cdnRepo.findOne({
                                isDefaultContent: true
                            })
                            if (conf == null) {
                                return ConfigService.getConfig("TEMP_FILEMANAGER")
                            }
                            return conf

                        } catch (error) {
                            return ConfigService.getConfig("TEMP_FILEMANAGER")
                        }
                    }
                }
            },
            isOptional: true
        }) files?: any,

        state?: any
    ): Promise<Response> {

        if (messages) {
            for (let i = 0; i < messages.length; i++) {
                messages[i].from = 'user'
                messages[i].user = user.id
            }
            if (file != "") {
                try {
                    messages[0]['files'] = [{
                        path: file,
                        size: files[0].size / 1000
                    }]
                } catch (error) {

                }
            }
        }
        var query: any = {
            $push: { messages: messages },
            $set: {
                lastMessage: 'user',
                lastModified: new Date(),
                stateNumber: 1,
                user: user.id
            },
            $unset: {
                closeDate: 1
            }
        }
        if (state) {
            query["$set"]["state"] = state
        }
        return this.editOne({
            user : user.id,
            _id : id
        }, query)
    }

    @Get("s/count")
    async getCountByState(@User() user: UserInfo): Promise<Response> {
        try {
            return {
                status: 200,
                data: await this.repository.getCountByState({
                    user: user.id
                })
            }
        } catch (error) {
            throw error
        }
    }

    @Get("/search/list")
    public getSearchList(): Response {
        return {
            status: 200,
            data: Object.assign(this.searchFilters, {
                user: ["eq"]
            })
        }
    }

    @Get("/department/search")
    async searchDepartment(
    ): Promise<Response> {
        try {

            return {
                data: await this.departmentRepo.paginate({}, 20, 1),
                status: 200
            }
        } catch (error) {
            throw error
        }
    }

    @Get("/search")
    public async search(
        @Query({
            destination: "page",
            schema: BaseController.page
        }) page: number,
        @Query({
            destination: "limit",
            schema: BaseController.limit
        }) limit: number,
        @Query({
            schema: BaseController.search
        }) reqQuery: any,
        @User() user: UserInfo): Promise<Response> {

        var query = await this.searchHelper(reqQuery)
        query["user"] = user.id
        return await this.paginate(page, limit, query, {
            sort: this.getSort(reqQuery),
            population: [{
                path: "department",
                select: ["name"]
            }]
        }, user)
    }

    @Post("/feedback")
    async submitFeedback(
        @Body({
            schema: z.object({
                id: BaseController.id,
                feedback: z.string(),
                feedbackStar: z.coerce.number().int().min(0).max(5).optional()
            })
        }) data: {
            id: string,
            feedback: string
            feedbackStar: number
        },
        @User() user : UserInfo
    ) { 
        return this.editOne({
            user : user.id,
            _id : data.id
        }, {
            $set : {
                feedback : data.feedback,
                feedbackStar : data.feedbackStar
            }
        })
    }


    async moveFilesToCDN(): Promise<Response> {
        // console.log("here")
        return {
            next: true
        }

    }

    initApis(): void {
        this.addRouteWithMeta("", "post", this.create.bind(this), {
            "1": {
                index: 0,
                source: "body",
                schema: this.insertSchema
            }
        })

        this.addPreExecs("/message", "post", this.moveFilesToCDN.bind(this))
    }
}



var ticket = new TicketController("/ticket", new TicketRepository(), {
    insertSchema: z.object({
        "importance": BaseController.numberFromForm.default("1"),
        "subject": z.string(),
        "department": BaseController.id,
        "messages": z.string()
    }),
    searchFilters: {
        _id: ["list", "eq"],
        department: ["eq"],
        state: ["eq", "list"],
        importance: ["eq", "lte", "gte", "list"],
        subject: ["reg", "eq"],
        ticketNumber: ["eq", "lte", "gte"],
        lastModified: ["gte", "lte"]
    },
    population: [
        {
            path: "messages.admin",
            select: ["name", "familyName"]
        },
        {
            path: "messages.assignedAdmin",
            select: ["name", "familyName"]
        },
        {
            path: "messages.assigner",
            select: ["name", "familyName"]
        },
        {
            path: "department",
            select: ["name"]
        },
        {
            path: "messages.department",
            select: ["name"]
        },
        {
            path: "messages.assignerDepartment",
            select: ["name"]
        }
    ],
    apiDoc: {
        security: [{
            BasicAuth: []
        }]
    }
})
export default ticket