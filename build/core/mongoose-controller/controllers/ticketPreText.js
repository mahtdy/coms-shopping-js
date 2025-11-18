"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketPreTextController = void 0;
const controller_1 = __importDefault(require("../controller"));
const repository_1 = __importDefault(require("../repositories/ticketPreText/repository"));
const zod_1 = require("zod");
class TicketPreTextController extends controller_1.default {
}
exports.TicketPreTextController = TicketPreTextController;
var ticketPreText = new TicketPreTextController("/ticketPreText", new repository_1.default(), {
    insertSchema: zod_1.z.object({
        text: zod_1.z.string(),
        category: controller_1.default.id,
    }),
});
exports.default = ticketPreText;
