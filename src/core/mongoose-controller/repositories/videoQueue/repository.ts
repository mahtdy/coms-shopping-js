import VideoQueue, { VideoQueueModel, VideoQueueStatus, ProccessResult } from "./model";
import BaseRepositoryService, { RepositoryConfigOptions } from "../../repository";
import { Types } from "mongoose";
import RabbitMQ from "../../../rabbitmq/rabbitmq";
import ConfigService from "../../../services/config";
import VideoConfigRepository from "../videoConfig/repository";
import SystemConfigRepository from "../system/repository";
import DomainVideoConfigRepository from "../domainVideoConfig/repository";
import LanguageRepository from "../language/repository";
import DomainRepository from "../domain/repository";


export default class VideoQueueRepository extends BaseRepositoryService<VideoQueue> {
    rabbitmq: RabbitMQ;
    configRepo: VideoConfigRepository;
    systemConfigRepo: SystemConfigRepository
    domainVideoRepo: DomainVideoConfigRepository
    languageRepo: LanguageRepository
    domainRepo: DomainRepository
    constructor(options?: RepositoryConfigOptions) {
        super(VideoQueueModel, options)
        this.rabbitmq = RabbitMQ.getInstance(
            {
                protocol: 'amqp',
                hostname: ConfigService.getConfig("RABBITMQ_SERVER"),
                port: 5672,
                username: ConfigService.getConfig("RABBITMQ_USER"),
                password: ConfigService.getConfig("RABBITMQ_PASSWORD"),
                locale: 'fa_IR',
                frameMax: 0,
                heartbeat: 0,
                vhost: "vhost",
            }
        );

        this.domainVideoRepo = new DomainVideoConfigRepository()
        this.configRepo = new VideoConfigRepository()
        this.systemConfigRepo = new SystemConfigRepository()
        this.domainRepo = new DomainRepository()
        this.languageRepo = new LanguageRepository()
    }



    async getInProccessVideo(): Promise<VideoQueue | null> {
        return await this.findOne({
            status: VideoQueueStatus.inQueue
        })

    }

    async getFirsInQueue(): Promise<VideoQueue | null> {
        return this.findOneAndUpdate({
            status: VideoQueueStatus.inQueue
        }, {
            $set: {
                status: VideoQueueStatus.inQueue
            }
        })
    }

    async finishProccess(id: Types.ObjectId, result: ProccessResult[], mainSrc: string) {
        return this.findByIdAndUpdate(id, {
            $set: {
                status: VideoQueueStatus.done,
                result: result,
                src: mainSrc
            }
        })
    }

    async proccessed(src: string, result: ProccessResult[]) {
        await this.updateOne({
            src
        },
            {
                $set: {
                    result,
                    status: VideoQueueStatus.done
                }
            })
    }

    async failedProccess(id: Types.ObjectId) {
        return this.findByIdAndUpdate(id, {
            $set: {
                status: VideoQueueStatus.failed
            }
        })
    }


    async startProccess(id: string | Types.ObjectId, language: string) {
        try {
            const video = await this.findById(id)
            if (video == null || video.status == VideoQueueStatus.done ||video.status == VideoQueueStatus.inQueue )
                return

            const channel = await this.rabbitmq.client?.createChannel()
            await channel?.assertQueue("video")
            var conf: any = {}

            let dimensions = []

            let lang = await this.languageRepo.findById(language)
            
            let type = video.type

            if (lang?.domain) {

                var domain = await this.domainRepo.findById(lang.domain as string)
            }
            else {
                var domain = await this.domainRepo.findOne({
                    isDefault: true
                })
            }

            let q: any = {
                domain: domain?._id
            }

            var domainVideo: any = null
            if (type != undefined) {
                q["type"] = type
                domainVideo = await this.domainVideoRepo.findOne(q)
            }

            if (domainVideo == null)
                domainVideo = await this.domainVideoRepo.findOne({
                    domain: domain?._id
                })



            if (domainVideo == null) {
                return
            }


            let auto_quality = domainVideo?.["auto-save-quality"]
            let dimensionConfigs = domainVideo?.["save-quality"]

            if (auto_quality && dimensionConfigs) {
                try {
                    for (let i = 0; i < dimensionConfigs.length; i++) {
                        // const element = array[i];
                        let hieght = parseInt(dimensionConfigs[i].split("p")[0])
                        let width = Math.floor((hieght * 1280) / 720)
                        dimensions.push(width.toString() + "x" + hieght.toString())

                    }
                } catch (error) {
                    console.log(error)
                }

            }
            if (dimensions.length == 0) {
                dimensions = [
                    "1280x720",
                    "1920x1080",
                    "853x480"
                ]
            }

            let formats = []

            let resultFormats = domainVideo["video-result-Suffixs"]
            if (resultFormats) {
                try {

                    for (let i = 0; i < resultFormats.length; i++) {
                        //
                        formats.push("av_" + resultFormats[i])

                    }
                } catch (error) {

                }
            }

            if (video.config == undefined)
                conf["hb_conf"] = {
                    dimensions,
                    "rate": 24,
                    "sharpen_filter": "unsharp",
                    "denoise_preset": "medium",
                    "unsharp_tune": "fine",
                    "nlmeans_tune": "highmotion",
                    "detelecine": "",
                    "lapsharp_tune": "film",
                    "unsharp_preset": "light",
                    "lapsharp_preset": "stronger",
                    "format": formats,
                    // "encoder" : "x265_10bit",
                    "denoise_filter": "hqdn3d",
                    "quality": Math.floor(domainVideo["quality-persent"] / 2),
                    // "preset": "Fast 1080p30",
                    configs: []
                }
            else {
                const config = await this.configRepo.findById(video.config as string)
                conf["hb_conf"] = {
                    dimensions,
                    "rate": 24,
                    "sharpen_filter": "unsharp",
                    "denoise_preset": "medium",
                    "unsharp_tune": "fine",
                    "nlmeans_tune": "highmotion",
                    "detelecine": "",
                    "lapsharp_tune": "film",
                    "unsharp_preset": "light",
                    "lapsharp_preset": "stronger",
                    "format": formats,
                    // "encoder" : "x265_10bit",
                    "denoise_filter": "hqdn3d",
                    "quality": Math.floor(domainVideo["quality-persent"] / 2),
                    // "preset": "Fast 1080p30",
                    configs: config?.configs
                }
            }
            conf['video'] = video.src
            conf["type"] = type

            const res = channel?.sendToQueue("video", Buffer.from(JSON.stringify(
                conf
            )), {

            })

            

            await channel?.close()

            await this.updateOne({
                _id : id
            } , {
                $set : {
                    status : VideoQueueStatus.inQueue
                }
            })
        }
        catch (error: any) {
            console.log("e", error.message)
            return

        }
    }


    insert(document: VideoQueue, options?: any): Promise<any> {
        return super.insert(document, options)
    }
}