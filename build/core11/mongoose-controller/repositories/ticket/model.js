"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketModel = exports.TicketState = exports.Owner = void 0;
const mongoose_1 = require("mongoose");
var ObjectId = mongoose_1.Types.ObjectId;
// const autoIncrement = require("mongoose-auto-increment")
var Owner;
(function (Owner) {
    Owner["user"] = "user";
    Owner["admin"] = "admin";
})(Owner || (exports.Owner = Owner = {}));
var TicketState;
(function (TicketState) {
    TicketState["open"] = "\u0628\u0627\u0632";
    TicketState["inProccess"] = "\u062F\u0631 \u062D\u0627\u0644 \u0627\u0646\u062C\u0627\u0645";
    TicketState["assigned"] = "\u0627\u0631\u062C\u0627\u0621 \u0634\u062F\u0647";
    TicketState["answered"] = "\u067E\u0627\u0633\u062E \u062F\u0627\u062F\u0647 \u0634\u062F\u0647";
    TicketState["closed"] = "\u0628\u0633\u062A\u0647 \u0634\u062F\u0647";
    TicketState["userAnswered"] = "\u067E\u0627\u0633\u062E \u0645\u0634\u062A\u0631\u06CC";
})(TicketState || (exports.TicketState = TicketState = {}));
const ticketSchema = new mongoose_1.Schema({
    notes: {
        type: String,
        required: false
    },
    importance: {
        type: "Number",
        required: true,
        max: 3,
        min: 1
    },
    subject: {
        type: String,
        required: true
    },
    ticketNumber: {
        type: "Number",
        required: true
    },
    owner: {
        type: String,
        required: true,
        // enum: Owner
    },
    date: {
        type: Date,
        required: true,
        default: () => {
            return Date.now();
        }
    },
    lastModified: {
        type: String,
        required: true,
        default: () => {
            return Date.now();
        }
    },
    closeDate: {
        type: String,
        required: false
    },
    user: {
        type: ObjectId,
        required: true,
        ref: "user"
    },
    department: {
        type: ObjectId,
        required: true,
        ref: "department"
    },
    state: {
        type: String,
        required: true,
        enum: TicketState,
        default: TicketState.open
    },
    stateNumber: {
        type: "Number",
        required: true,
        default: () => {
            return 1;
        }
    },
    messages: {
        type: [
            new mongoose_1.Schema({
                text: {
                    type: String,
                    required: false
                },
                files: {
                    type: [new mongoose_1.Schema({
                            path: {
                                type: String,
                                required: true
                            }, size: {
                                type: "Number",
                                required: true
                            },
                        }, { _id: false })],
                    required: false
                },
                from: {
                    type: String,
                    required: true,
                    // enum: Owner
                },
                date: {
                    type: Date,
                    required: true,
                    default: () => {
                        return Date.now();
                    }
                },
                admin: {
                    type: ObjectId,
                    required: false,
                    ref: "admin"
                },
                assignedAdmin: {
                    type: ObjectId,
                    required: false,
                    ref: "admin"
                },
                assigner: {
                    type: ObjectId,
                    required: false,
                    ref: "admin"
                },
                assignerDepartment: {
                    type: ObjectId,
                    required: false,
                    ref: "department"
                },
                isAssigned: {
                    type: Boolean,
                    required: false
                },
                isNote: {
                    type: Boolean,
                    required: false
                },
                department: {
                    type: ObjectId,
                    required: false,
                    ref: "department"
                },
            })
        ],
        required: true
    },
    lastMessage: {
        type: String,
        required: true,
        // enum: Owner
    },
    starter: {
        type: String,
        required: true,
        // enum: Owner
    },
    starterAdmin: {
        type: ObjectId,
        required: false,
        ref: "admin"
    },
    admin: {
        type: ObjectId,
        required: false,
        ref: "admin"
    },
    admins: {
        type: [ObjectId],
        required: true,
        ref: "admin"
    },
});
// autoIncrement.initialize(connection);
// ticketSchema.plugin(autoIncrement.plugin, { model: 'ticket', field: 'ticketNumber', startAt: 100 })
exports.TicketModel = (0, mongoose_1.model)('ticket', ticketSchema);
