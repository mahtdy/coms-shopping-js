
import amqplib, { Channel } from "amqplib"
import { Plugin } from "../plugin";
import { Route } from "../application";


export default class RabbitMQ implements Plugin {
    private static instance: RabbitMQ;
    url: string | amqplib.Options.Connect
    socketOptions?: any
    client?: amqplib.Connection
    // channel?: amqplib.Channel
    consumedQueues: string[]
    assertedQueues: string[]
    constructor(
        url: string | amqplib.Options.Connect, socketOptions?: any
    ) {
        this.url = url
        this.socketOptions = socketOptions
        this.consumedQueues = []
        this.assertedQueues = []
    }
    

    public static getInstance(url: string | amqplib.Options.Connect, socketOptions?: any): RabbitMQ {
        if (!RabbitMQ.instance) {
            RabbitMQ.instance = new RabbitMQ(url, socketOptions);
        }
        return RabbitMQ.instance;
    }

    public static getInstance1(): RabbitMQ {
        return RabbitMQ.instance;
    }

    async init(): Promise<any> {
        try {
            this.client = await amqplib.connect(this.url, this.socketOptions)
            // this.channel = await this.client.createChannel()
        } catch (error) {
            throw error
        }
    }
    serve(...args: any[]): Route[] {
        return []
    }

    // async assertQueue(queue : string){
    //     if(
    //         !this.assertedQueues.includes(queue)
    //     ){
    //         const channel = await this.client?.createChannel()
    //         await channel?.assertQueue(queue)
    //         this.assertedQueues.push(queue)
    //     }

    // }

    async getChannel() {
        try {
            if(this.client == undefined){
                await this.init()
            }
            return  await this.client?.createChannel()
        } catch (error) {
            throw error
        }
    }

    async consume(queue: string, exec: any) {

        if (!this.consumedQueues.includes(queue)) {
            this.consumedQueues.push(queue)
            if (this.client == undefined) {
                await this.init()
            }
            const channel = await this.client?.createChannel()
            // console.log(channel, this.client)
            await channel?.assertQueue(queue)
            channel?.consume(queue, this.makeConsume(exec, channel))
            // 
        }
    }
    makeConsume(exec: any, channel: Channel) {
        return (async (msg: amqplib.ConsumeMessage) => {
            await exec(msg)
            channel.ack(msg)

        })
    }

}
