import { Admin, Body, Files } from "../../decorators/parameters"
import { Response } from "../../controller"
import BaseController, { ControllerOptions } from "../controller"
import Ticket, { TicketState } from "../repositories/ticket/model"
import TicketRepository from "../repositories/ticket/repository"
import { AdminInfo } from "../auth/admin/admin-logIn"
import z from "zod"
import UserRepository from "../repositories/user/repository"
import BaseUser from "../repositories/user/model"
import CDN_Manager from "../../services/fileManager"
import { Delete, Get, Post, Put } from "../../decorators/method"
import FileManagerConfigRepository from "../repositories/fileManagerConfig/repository"
import ConfigService from "../../services/config"

export class TicketController extends BaseController<Ticket>{
    userRepo?: UserRepository<BaseUser>
    constructor(baseRoute: string, repo: TicketRepository, options?: ControllerOptions & {
        userRepo?: UserRepository<BaseUser>
    }) {
        super(baseRoute, repo, options)
        if (options?.userRepo)
            this.userRepo = options.userRepo
    }


    async create(
        data: Ticket, 
        @Admin() admin: AdminInfo,
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
        }) files?: any,): Promise<Response> {
        if (data.messages) {
            for (let i = 0; i < data.messages.length; i++) {
                data.messages[i].from = 'admin'
                data.messages[i].admin = admin._id
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
        data.owner = "admin"
        data.admin = admin._id
        data.starterAdmin = admin._id
        data.starter = 'admin'
        return await super.create(data)
    }

    @Put("/close" ,)
    async closeTicket(
        @Body({
            destination: "id",
            schema: BaseController.id
        }) id: string): Promise<Response> {
        return this.editById(id, {
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
        }) id: string
    ): Promise<Response> {
        return this.editById(id, {
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


    @Put("/assign")
    async assignTicket(
        @Body({
            destination: "adminId",
            schema: BaseController.id
        }) adminId: string,
        @Body({
            destination: "ticketId",
            schema: BaseController.id
        }) ticketId: string,
        @Admin() admin: AdminInfo,
        @Body({
            destination: "departmentId",
            schema: BaseController.id.optional()
        }) departmentId?: string
    ): Promise<Response> {

        let query: any = {
            $set: {
                "admin": adminId,
                "state": "assigned"
            }
        }

        if (departmentId) {
            query['$set']['department'] = departmentId
        }

        query["$push"] = {
            messages: {
                department: departmentId,
                from: "admin",
                admin: adminId,
                isAssigned: true,
                assigner: admin._id
            },
            admins: admin._id
        }


        if (admin.department) {
            query["$push"]["messages"]["assignerDepartment"] = admin.department
        }

        return this.editById(ticketId, query)
    }


    @Post("/message", {
        contentType: "multipart/form-data"
    })
    async addMessage(
        @Body({
            destination: "messages",
            schema: z.array(z.object({
                text: z.string(),
                files: z.array(z.string())
            }).omit({
                "files": true
            })),
            parseJson: true,
            isArray: true
        }) messages: any,
        @Body({
            destination: "id",
            schema: BaseController.id
        }) id: string,
        @Admin() admin: AdminInfo,
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
                messages[i].from = 'admin'
                messages[i].admin = admin._id
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
                lastMessage: 'admin',
                lastModified: new Date(),
                stateNumber: 1,
                admin: admin._id
            },
            $unset: {
                closeDate: 1
            }
        }
        if (state) {
            query["$set"]["state"] = state
        }
        return await this.editById(id, query)
    }

    @Post("/note")
    async addNote(
        @Body({
            destination: "id",
            schema: BaseController.id
        }) id: string,
        @Body({
            destination: "note",
            schema: z.string()
        }) note: string,
        @Admin() admin: AdminInfo

    ): Promise<Response> {
        return this.editById(id, {
            $set: {
                notes: note
            },
            $push: {
                messages: {
                    from: 'admin',
                    admin: admin._id,
                    isNote: true,
                    text: note
                } as any
            }
        })
    }

    @Get("s/count")
    async getCountByState(): Promise<Response> {
        try {
            return {
                status: 200,
                data: await this.repository.getCountByState({})
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

    public async searchHelper(queryParam: any): Promise<any> {
        var q = await super.searchHelper(queryParam)
        if (queryParam["user$eq"]) {
            try {
                var user = await this.userRepo?.findOne({
                    phoneNumber: queryParam["user$eq"] as string
                })
            } catch (error) {
                throw error
            }
            if (user != null) {
                q["user"] = user._id
            }
        }
        return q
    }

    @Put("/message")
    public async editMessage(
        @Body({
            destination: "ticketId",
            schema: BaseController.id
        }) ticketId: string,
        @Body({
            destination: "messageId",
            schema: BaseController.id
        }) messageId: string,
        @Body({
            destination: "text",
            schema: z.string()
        }) text: string,
    ): Promise<Response> {
        try {
            return this.editOne({
                _id: ticketId,
                $expr: {
                    $eq: [{ "$indexOfArray": ["$messages._id", messageId] }, {
                        $subtract: [{ $size: "$messages" }, 1]
                    }]
                },
                "messages._id": messageId
            }, {
                $set: {
                    "messages.$.text": text
                }
            })
        } catch (error) {
            throw error
        }
    }

    @Delete("/message")
    public async deleteMessage(@Body({
        destination: "ticketId",
        schema: BaseController.id
    }) ticketId: string,
        @Body({
            destination: "messageId",
            schema: BaseController.id
        }) messageId: string,): Promise<Response> {
        try {
            var response = await this.editOne({
                _id: ticketId,
                $expr: {
                    $eq: [{ $indexOfArray: ["$messages._id", messageId] }, {
                        $subtract: [{ $size: "$messages" }, 1]
                    }]
                }

            }, {
                $pop: {
                    messages: 1
                }
            })

            //delete data from cdn
            if (response?.status == 200) {
                var messages: any[] = response.data?.messages
                var lastMessage = messages[messages.length - 1]
                if (lastMessage.files) {
                    var cdn = new CDN_Manager()
                    if (lastMessage.files[0]) {
                        await cdn.findCdnFromUrl(lastMessage.files[0].path)
                        await cdn.removeFiles(lastMessage.files.map((elem: any) => {
                            return elem.path
                        }))
                    }
                }

            }
            return response
        } catch (error) {
            throw error
        }
    }

    initApis(): void {
        super.initApis()
        this.addRouteWithMeta("/search" , "get", this.search.bind(this), BaseController.searcheMeta)
    }
}



var ticket = new TicketController("/ticket", new TicketRepository(), {
    insertSchema: z.object({
        "notes": z.string(),
        "importance": z.number().default(1),
        "subject": z.string(),
        "owner": z.string().default("admin"),
        "user": BaseController.id,
        "department": BaseController.id,
        "messages": z.array(z.object({
            text: z.string(),
            files: z.array(z.string())
        }).omit({
            "files": true
        })),
        "lastMessage": z.string().default("admin"),
        "starter": z.string().default("admin")
    }),
    searchFilters : {
        department: ["eq"],
        state: ["eq", "list"],
        importance: ["eq", "lte", "gte", "list"],
        subject: ["reg", "eq"],
        ticketNumber: ["eq", "lte", "gte"],
        lastModified: ["gte", "lte"]
    }
})
export default ticket