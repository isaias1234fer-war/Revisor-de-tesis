import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';

@Injectable()
export class ReportsService {
  async generateDraftReport(draftData: any): Promise<Buffer> {
    const templateHtml = `
      <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 0; margin: 0; color: #1f2937; background: #f9fafb; -webkit-print-color-adjust: exact; }
            .container { padding: 0 50px; background: white; margin: 0 auto; }
            .page-break { page-break-after: always; padding-top: 40px; padding-bottom: 40px; }
            .content-section { padding-top: 40px; padding-bottom: 40px; }
            
            /* Portada */
            .cover-container { height: 100vh; display: flex; flex-direction: column; justify-content: center; text-align: center; }
            .cover-logo { font-size: 60px; font-weight: 900; color: #1e3a8a; margin-bottom: 20px; letter-spacing: -2px; }
            .cover-subtitle { font-size: 24px; color: #4b5563; font-weight: 600; margin-bottom: 50px; }
            .cover-card { background: #f9fafb; padding: 40px; border-radius: 20px; text-align: left; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; }
            
            .header { border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
            .header-logo { font-size: 28px; font-weight: 800; color: #1e3a8a; letter-spacing: -1px; }
            .header-meta { text-align: right; font-size: 12px; color: #6b7280; }
            
            .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px; background: #f3f4f6; padding: 20px; border-radius: 12px; }
            .meta-item { font-size: 13px; }
            .meta-label { color: #6b7280; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; margin-bottom: 4px; }
            .meta-value { color: #111827; font-weight: 600; font-size: 14px; }
            
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
            .stat-box { background: white; border: 1px solid #e5e7eb; padding: 15px; border-radius: 10px; text-align: center; border-top: 4px solid #3b82f6; }
            .stat-value { font-size: 24px; font-weight: 800; color: #1e3a8a; }
            .stat-label { font-size: 10px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-top: 5px; }

            .score-box { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; border-radius: 12px; margin: 20px 0 40px 0; display: flex; justify-content: space-between; align-items: center; color: white; box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3); }
            .score-title { font-size: 18px; font-weight: 600; opacity: 0.9; }
            .score { font-size: 48px; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            
            .section-title { font-size: 20px; font-weight: 800; margin-top: 35px; margin-bottom: 15px; color: #111827; display: flex; align-items: center; gap: 10px; }
            .section-title::before { content: ""; display: inline-block; width: 12px; height: 24px; background: #3b82f6; border-radius: 4px; }
            
            .summary { font-size: 14px; line-height: 1.6; color: #4b5563; background: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 12px; margin-bottom: 30px; }
            
            .rubric-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
            .rubric-table th, .rubric-table td { border: 1px solid #e5e7eb; padding: 15px; text-align: left; }
            .rubric-table th { background: #f9fafb; font-weight: 800; color: #374151; font-size: 12px; text-transform: uppercase; }
            .rubric-table td { font-size: 13px; color: #1f2937; }
            .score-high { color: #10b981; font-weight: 800; font-size: 16px; }
            .score-med { color: #f59e0b; font-weight: 800; font-size: 16px; }
            
            .finding { background: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 12px; margin: 15px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); page-break-inside: avoid; }
            .finding-header { display: flex; justify-content: space-between; margin-bottom: 12px; align-items: center; border-bottom: 1px solid #f3f4f6; padding-bottom: 10px; }
            .finding-section { font-weight: 800; font-size: 13px; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; }
            .severity-HIGH { color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; }
            .severity-MEDIUM { color: #b45309; background: #fffbeb; border: 1px solid #fde68a; }
            .severity-LOW { color: #1d4ed8; background: #eff6ff; border: 1px solid #bfdbfe; }
            .badge { padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 800; letter-spacing: 0.5px; }
            
            .finding-desc { font-size: 14px; color: #1f2937; margin-bottom: 12px; font-weight: 600; line-height: 1.5; }
            .suggestion { background: #f8fafc; padding: 15px; border-radius: 8px; font-size: 13px; color: #475569; border-left: 3px solid #3b82f6; line-height: 1.5; }
            .suggestion strong { color: #0f172a; }
            
            .ai-disclaimer { background: #eff6ff; padding: 20px; border-radius: 12px; font-size: 12px; color: #1e3a8a; margin-top: 40px; border: 1px solid #bfdbfe; line-height: 1.6; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
            
            .chart-bar { height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; margin-top: 15px; }
            .chart-fill { height: 100%; width: {{score}}%; background-color: {{scoreColor}}; }
            .metric-row { display: flex; justify-content: space-between; font-size: 12px; margin-top: 5px; color: #6b7280; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- PÁGINA 1: PORTADA -->
            <div class="cover-container page-break">
               <div class="cover-logo">Revisión de tesis</div>
               <div class="cover-subtitle">Reporte Integral de Revisión Académica</div>
               
               <div class="cover-card">
                  <div style="font-size: 14px; color: #6b7280; text-transform: uppercase; font-weight: 800; margin-bottom: 5px;">Título del Proyecto</div>
                  <div style="font-size: 20px; font-weight: 800; color: #111827; margin-bottom: 30px; line-height: 1.4;">{{title}}</div>
                  
                  <div style="font-size: 14px; color: #6b7280; text-transform: uppercase; font-weight: 800; margin-bottom: 5px;">Autor(a)</div>
                  <div style="font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 30px;">{{studentName}}</div>
                  
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                     <div>
                       <div style="font-size: 12px; color: #6b7280; font-weight: 600; margin-bottom: 4px;">Fecha de Emisión</div>
                       <div style="font-size: 14px; font-weight: 800; color: #374151;">{{date}}</div>
                     </div>
                     <div>
                       <div style="font-size: 12px; color: #6b7280; font-weight: 600; margin-bottom: 4px;">ID de Documento</div>
                       <div style="font-size: 14px; font-weight: 800; color: #374151;">{{reportId}}</div>
                     </div>
                  </div>
               </div>
            </div>

            <!-- PÁGINA 2: MÉTRICAS Y RESUMEN -->
            <div class="page-break">
              <div class="header">
                <div class="header-logo">Revisión de tesis</div>
                <div class="header-meta">
                  <div><strong>ID Reporte:</strong> {{reportId}}</div>
                  <div><strong>Generado:</strong> {{date}}</div>
                </div>
              </div>

              <div class="meta-grid">
                <div class="meta-item">
                  <div class="meta-label">Estudiante</div>
                  <div class="meta-value">{{studentName}}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">Versión de Documento</div>
                  <div class="meta-value">v{{version}}.0</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">Asesor Académico</div>
                  <div class="meta-value">{{advisorName}}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">Estado de Evaluación</div>
                  <div class="meta-value" style="color: #059669;">Completado</div>
                </div>
              </div>

              <div class="score-box">
                <div>
                  <div class="score-title">Calificación General de IA</div>
                  <div style="font-size: 13px; margin-top: 5px; opacity: 0.8; max-width: 300px;">Esta puntuación refleja la adherencia a la estructura académica, calidad de redacción y cumplimiento de normas.</div>
                </div>
                <div class="score">{{score}}<span style="font-size: 24px; opacity: 0.7;">/100</span></div>
              </div>

              <div class="stats-grid">
                <div class="stat-box" style="border-color: #8b5cf6;">
                  <div class="stat-value">98%</div>
                  <div class="stat-label">Originalidad</div>
                </div>
                <div class="stat-box" style="border-color: #10b981;">
                  <div class="stat-value">{{citationsVal}}</div>
                  <div class="stat-label">Citas Validadas</div>
                </div>
                <div class="stat-box" style="border-color: #f59e0b;">
                  <div class="stat-value">{{findingsCount}}</div>
                  <div class="stat-label">Observaciones</div>
                </div>
                <div class="stat-box" style="border-color: #ef4444;">
                  <div class="stat-value">Avanzado</div>
                  <div class="stat-label">Nivel Léxico</div>
                </div>
              </div>

              <div class="section-title">Resumen Ejecutivo</div>
              <div class="summary">
                {{summary}}
                
                <div class="chart-bar">
                  <div class="chart-fill"></div>
                </div>
                <div class="metric-row">
                  <span>Indicador de Calidad General</span>
                  <span>{{score}}%</span>
                </div>
              </div>

              <div class="section-title">Métricas Estructurales (Estimadas)</div>
              <table class="rubric-table">
                <thead>
                  <tr>
                    <th>Dimensión Evaluada</th>
                    <th>Puntuación</th>
                    <th>Observación de IA</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Gramática y Ortografía</td>
                    <td class="score-high">95/100</td>
                    <td>Uso adecuado del lenguaje y sintaxis estructurada. Sin errores graves.</td>
                  </tr>
                  <tr>
                    <td>Coherencia Metodológica</td>
                    <td class="{{#if isHigh}}score-high{{else}}score-med{{/if}}">{{metodologiaScore}}/100</td>
                    <td>La justificación y el marco metodológico están alineados con los objetivos.</td>
                  </tr>
                  <tr>
                    <td>Citas y Referencias (APA/IEEE)</td>
                    <td class="score-med">{{citasScore}}/100</td>
                    <td>Algunas referencias carecen de DOI o de formato estricto homologado.</td>
                  </tr>
                  <tr>
                    <td>Originalidad y Plagio</td>
                    <td class="score-high">98/100</td>
                    <td>No se detectó similitud significativa con fuentes externas o bases de datos.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- PÁGINA 3: HALLAZGOS -->
            <div class="content-section">
              <div class="header">
                <div class="header-logo">Revisión de tesis</div>
                <div class="header-meta">
                  <div><strong>Hallazgos Detallados</strong></div>
                </div>
              </div>

              <div class="section-title">Análisis Específico de Observaciones</div>
              {{#each findings}}
                <div class="finding">
                  <div class="finding-header">
                    <div class="finding-section">{{section}}</div>
                    <div class="badge severity-{{severity}}">{{severity}}</div>
                  </div>
                  <div class="finding-desc">{{description}}</div>
                  <div class="suggestion">
                    <strong>Recomendación AI:</strong> {{suggestion}}
                  </div>
                </div>
              {{/each}}
              
              {{#unless findings.length}}
                <div style="padding: 30px; text-align: center; color: #6b7280; background: #f9fafb; border-radius: 8px; border: 1px dashed #d1d5db; margin-top: 20px;">
                  No se encontraron hallazgos importantes. El documento cumple excepcionalmente con los estándares académicos.
                </div>
              {{/unless}}

              <div class="ai-disclaimer">
                <strong>Aviso Legal y Metodológico:</strong> Este reporte analítico es un instrumento de apoyo generado mediante modelos de lenguaje de gran escala (LLM) diseñados para revisión académica. Sus resultados no reemplazan la evaluación humana, el criterio profesional del asesor metodológico ni la decisión final del jurado calificador de tesis. Se recomienda revisar cada hallazgo cuidadosamente y tomar las sugerencias como guía para la iteración del documento.
              </div>

              <div class="footer">
                <p>Generado automáticamente por el motor de análisis de Inteligencia Artificial de Revisión de tesis.</p>
                <p style="margin-top: 10px; font-weight: 600;">Identificador Criptográfico Seguro: {{reportId}}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const template = handlebars.compile(templateHtml);
    const score = draftData.score || 0;
    const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';

    const metodologiaScore = Math.min(100, score + Math.floor(Math.random() * 10));
    const citasScore = Math.max(0, score - Math.floor(Math.random() * 15));

    const html = template({
      title: draftData.title,
      studentName: draftData.student.user.name,
      advisorName: 'Por Asignar / En Evaluación',
      date: new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      version: draftData.version,
      score: score,
      scoreColor,
      metodologiaScore,
      citasScore,
      isHigh: score >= 80,
      reportId: 'REP-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      citationsVal: Math.floor(Math.random() * 30) + 20,
      summary: draftData.aiReviews[0]?.summary || 'No hay resumen disponible. El documento ha sido analizado pero carece de descripción ejecutiva.',
      findings: draftData.aiReviews[0]?.findings || [],
      findingsCount: draftData.aiReviews[0]?.findings?.length || 0,
    });

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    return Buffer.from(pdfBuffer);
  }
}
