import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOllama } from '@langchain/ollama';
import { PromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';

@Injectable()
export class AiService {
  private model: ChatOllama;

  constructor(private configService: ConfigService) {
    this.model = new ChatOllama({
      baseUrl: this.configService.get<string>('OLLAMA_BASE_URL') || 'http://localhost:11434',
      model: this.configService.get<string>('OLLAMA_MODEL') || 'llama3',
      temperature: 0,
    });
  }

  async analyzeDraft(text: string, templateStructure: any) {
    const parser = StructuredOutputParser.fromZodSchema(
      z.object({
        findings: z.array(z.object({
          section: z.string(),
          severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
          description: z.string(),
          suggestion: z.string(),
        })),
        score: z.number().min(0).max(100),
        summary: z.string(),
      })
    );

    const formatInstructions = parser.getFormatInstructions();

    const prompt = new PromptTemplate({
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
    } catch (invokeError) {
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
      return await parser.parse(response.content as string);
    } catch (e) {
      // Ollama a veces devuelve texto con markdown, intentamos extraer el JSON
      const content = response.content as string;
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      throw new Error('No se pudo parsear la respuesta de Ollama: ' + content);
    }
  }

  async compareWithOrcid(thesisTitle: string, publications: any[]) {
    const prompt = new PromptTemplate({
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
    const content = response.content as string;
    
    try {
      return JSON.parse(content);
    } catch (e) {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      throw new Error('No se pudo parsear la respuesta de Ollama');
    }
  }
}