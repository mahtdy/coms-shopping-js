"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const parameters_1 = require("../../../core/decorators/parameters");
const controller_1 = __importDefault(require("../../../core/controller"));
const dto_1 = require("./dto");
const zod_1 = require("zod");
const method_1 = require("../../../core/decorators/method");
class NoteController extends controller_1.default {
    constructor(baseRoute) {
        super(baseRoute);
        this.notes = [];
    }
    addNote(note) {
        this.notes.push(note.title);
        return {
            status: 200,
            data: {}
        };
    }
    getNotes(note) {
        return {
            status: 200,
            data: this.notes
        };
    }
    getNote(note, ss) {
        return {
            status: 200,
            data: this.notes
        };
    }
}
__decorate([
    (0, method_1.Post)("/", {
        contentType: "multipart/form-data"
    }),
    __param(0, (0, parameters_1.Body)({
        schema: dto_1.noteSchema
    }))
], NoteController.prototype, "addNote", null);
__decorate([
    (0, method_1.Get)("s"),
    __param(0, (0, parameters_1.Query)({
        destination: "name",
        schema: zod_1.z.string()
    }))
], NoteController.prototype, "getNotes", null);
__decorate([
    (0, method_1.Get)(""),
    __param(0, (0, parameters_1.Query)({
        destination: "name",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Param)({
        destination: "ss",
        schema: zod_1.z.string()
    }))
], NoteController.prototype, "getNote", null);
var noteController = new NoteController("/note");
noteController.loginRequired = true;
// noteController.addRoute("/",
//     "post",
//     noteController.addNote.bind(noteController))
// noteController.addRoute("s",
//     "get",
//     noteController.getNotes.bind(noteController))
// noteController.addRoute("",
//     "get",
//     noteController.getNote.bind(noteController))
exports.default = noteController;
