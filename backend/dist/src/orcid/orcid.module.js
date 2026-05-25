"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrcidModule = void 0;
const common_1 = require("@nestjs/common");
const orcid_service_1 = require("./orcid.service");
const orcid_controller_1 = require("./orcid.controller");
let OrcidModule = class OrcidModule {
};
exports.OrcidModule = OrcidModule;
exports.OrcidModule = OrcidModule = __decorate([
    (0, common_1.Module)({
        providers: [orcid_service_1.OrcidService],
        controllers: [orcid_controller_1.OrcidController],
        exports: [orcid_service_1.OrcidService],
    })
], OrcidModule);
//# sourceMappingURL=orcid.module.js.map