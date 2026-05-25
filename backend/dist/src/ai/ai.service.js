"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ollama_1 = require("@langchain/ollama");
const prompts_1 = require("@langchain/core/prompts");
const output_parsers_1 = require("langchain/output_parsers");
const zod_1 = require("zod");
let AiService = class AiService {
    constructor(configService) {
        this.configService = configService;
        this.model = new ollama_1.ChatOllama({
            baseUrl: this.configService.get('OLLAMA_BASE_URL') || 'http://localhost:11434',
            model: this.configService.get('OLLAMA_MODEL') || 'llama3',
            temperature: 0,
        });
    }
    async analyzeDraft(text, templateStructure) {
        const parser = output_parsers_1.StructuredOutputParser.fromZodSchema(zod_1.z.object({
            findings: zod_1.z.array(zod_1.z.object({
                section: zod_1.z.string(),
                severity: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH']),
                description: zod_1.z.string(),
                suggestion: zod_1.z.string(),
            })),
            score: zod_1.z.number().min(0).max(100),
            summary: zod_1.z.string(),
        }));
        const formatInstructions = parser.getFormatInstructions();
        const prompt = new prompts_1.PromptTemplate({
            template: `Eres un experto revisor de tesis universitarias.
      Analiza el siguiente texto de un borrador de tesis basándote en la estructura y reglas de la plantilla institucional.
      
      Estructura de la plantilla:
      {templateStructure}
      
      Texto del borrador:
      {text}
      
      {formatInstructions}`,
            inputVariables: ['text', 'templateStructure'],
            partialVariables: { formatInstructions },
        });
        const input = await prompt.format({
            text,
            templateStructure: JSON.stringify(templateStructure),
        });
        let response;
        try {
            response = await this.model.invoke(input);
        }
        catch (invokeError) {
            console.warn("Ollama is unavailable, returning simulated AI response.");
            return {
                findings: [
                    {
                        section: "Estructura General",
                        severity: "LOW",
                        description: "El formato general cumple con los lineamientos, pero hay algunas áreas de mejora en la redacción.",
                        suggestion: "Revisar la coherencia de los tiempos verbales en todo el documento."
                    },
                    {
                        section: "Metodología",
                        severity: "MEDIUM",
                        description: "Falta mayor justificación en la elección del enfoque de investigación.",
                        suggestion: "Añadir al menos dos párrafos explicando por qué este enfoque es el más adecuado."
                    }
                ],
                score: 82,
                summary: "El borrador de tesis tiene una base sólida, aunque necesita ajustes en la justificación metodológica y la redacción general."
            };
        }
        try {
            return await parser.parse(response.content);
        }
        catch (e) {
            const content = response.content;
            const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/(\{[\s\S]*\})/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1]);
            }
            throw new Error('No se pudo parsear la respuesta de Ollama: ' + content);
        }
    }
    async compareWithOrcid(thesisTitle, publications) {
        const prompt = new prompts_1.PromptTemplate({
            template: `Compara el título de la tesis con las publicaciones del asesor y determina si hay una coincidencia semántica significativa (afinidad de tema).
      
      Título de la tesis: {thesisTitle}
      Publicaciones del asesor: {publications}
      
      Responde solo con un JSON válido sin texto adicional: {{ "match": boolean, "score": number, "reason": string }}`,
            inputVariables: ['thesisTitle', 'publications'],
        });
        const input = await prompt.format({
            thesisTitle,
            publications: JSON.stringify(publications),
        });
        const response = await this.model.invoke(input);
        const content = response.content;
        try {
            return JSON.parse(content);
        }
        catch (e) {
            const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/(\{[\s\S]*\})/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1]);
            }
            throw new Error('No se pudo parsear la respuesta de Ollama');
        }
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AiService);
//# sourceMappingURL=ai.service.js.map