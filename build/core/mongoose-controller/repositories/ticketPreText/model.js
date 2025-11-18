"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketPreTextModel = void 0;
const mongoose_1 = require("mongoose");
var ObjectId = mongoose_1.Types.ObjectId;
const ticketPreTextSchema = new mongoose_1.Schema({
    text: {
        type: String,
        required: true
    },
    category: {
        type: ObjectId,
        required: true,
        ref: "ticketPreTextCategory"
    },
});
exports.TicketPreTextModel = (0, mongoose_1.model)('ticketPreText', ticketPreTextSchema);
