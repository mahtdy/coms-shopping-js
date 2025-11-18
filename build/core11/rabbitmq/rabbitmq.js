"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const amqplib_1 = __importDefault(require("amqplib"));
class RabbitMQ {
    constructor(url, socketOptions) {
        this.url = url;
        this.socketOptions = socketOptions;
        this.consumedQueues = [];
        this.assertedQueues = [];
    }
    static getInstance(url, socketOptions) {
        if (!RabbitMQ.instance) {
            RabbitMQ.instance = new RabbitMQ(url, socketOptions);
        }
        return RabbitMQ.instance;
    }
    static getInstance1() {
        return RabbitMQ.instance;
    }
    async init() {
        try {
            this.client = await amqplib_1.default.connect(this.url, this.socketOptions);
            // this.channel = await this.client.createChannel()
        }
        catch (error) {
            throw error;
        }
    }
    serve(...args) {
        return [];
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
        var _a;
        try {
            if (this.client == undefined) {
                await this.init();
            }
            return await ((_a = this.client) === null || _a === void 0 ? void 0 : _a.createChannel());
        }
        catch (error) {
            throw error;
        }
    }
    async consume(queue, exec) {
        var _a;
        if (!this.consumedQueues.includes(queue)) {
            this.consumedQueues.push(queue);
            if (this.client == undefined) {
                await this.init();
            }
            const channel = await ((_a = this.client) === null || _a === void 0 ? void 0 : _a.createChannel());
            // console.log(channel, this.client)
            await (channel === null || channel === void 0 ? void 0 : channel.assertQueue(queue));
            channel === null || channel === void 0 ? void 0 : channel.consume(queue, this.makeConsume(exec, channel));
            // 
        }
    }
    makeConsume(exec, channel) {
        return (async (msg) => {
            await exec(msg);
            channel.ack(msg);
        });
    }
}
exports.default = RabbitMQ;
