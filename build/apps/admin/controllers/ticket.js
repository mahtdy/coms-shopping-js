"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../../../core/mongoose-controller/repositories/ticket/repository"));
const ticket_1 = require("../../../core/mongoose-controller/controllers/ticket");
var ticket = new ticket_1.TicketController("/ticket", new repository_1.default());
