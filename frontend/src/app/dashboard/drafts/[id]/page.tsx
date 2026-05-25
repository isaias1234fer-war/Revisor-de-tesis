"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  MessageSquare, 
  Download,
  ShieldCheck,
  AlertTriangle,
  Info
} from "lucide-react";
import Link from "next/link";

interface Finding {
  section: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  suggestion: string;
}

interface AiReview {
  id: string;
  findings: Finding[];
  score: number;
  summary: string;
  createdAt: string;
}

interface DraftDetails {
  id: string;
  title: string;
  version: number;
  status: string;
  score: number | null;
  createdAt: string;
  aiReviews: AiReview[];
  humanReviews: any[];
}

export default function DraftDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [draft, setDraft] = useState<DraftDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // ORCID Affinity States
  const [orcidMatch, setOrcidMatch] = useState<{ match: boolean; score: number; reason: string } | null>(null);
  const [fetchingOrcid, setFetchingOrcid] = useState(false);

  // Advisor Review Form States
  const [comments, setComments] = useState("");
  const [statusVal, setStatusVal] = useState("CHANGES_REQUESTED"); // CHANGES_REQUESTED, APPROVED, REJECTED
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (params.id && session?.user) {
      fetchDraftDetails();
      fetchOrcidMatch();
    }
  }, [params.id, session]);

  const fetchDraftDetails = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/drafts/${params.id}`, {
        headers: {
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setDraft(data);
      }
    } catch (error) {
      console.error("Error fetching draft details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrcidMatch = async () => {
    setFetchingOrcid(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/drafts/${params.id}/orcid-match`, {
        headers: {
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setOrcidMatch(data);
      }
    } catch (error) {
      console.error("Error fetching ORCID match:", error);
    } finally {
      setFetchingOrcid(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comments.trim()) {
      alert("Por favor escribe comentarios para tu revisión.");
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/drafts/${params.id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
        body: JSON.stringify({
          comments: { general: comments },
          status: statusVal,
        }),
      });

      if (res.ok) {
        alert("Evaluación enviada con éxito");
        setComments("");
        fetchDraftDetails(); // Reload data
      } else {
        alert("Error al enviar la evaluación.");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Error de conexión con el servidor");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/drafts/${params.id}/report`, {
        headers: {
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-tesis-${draft?.title || 'analisis'}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        alert("Error al generar el PDF. Asegúrate de que el análisis de IA haya terminado.");
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Error de conexión al descargar el PDF");
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center">Cargando detalles...</div>;
  if (!draft) return <div className="flex min-h-screen items-center justify-center text-red-600">No se encontró el borrador.</div>;

  const latestAiReview = draft.aiReviews[0];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'text-red-600 bg-red-50 border-red-100';
      case 'MEDIUM': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'LOW': return 'text-blue-600 bg-blue-50 border-blue-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'ALTA';
      case 'MEDIUM': return 'MEDIA';
      case 'LOW': return 'BAJA';
      default: return severity;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'HIGH': return <AlertCircle className="h-5 w-5" />;
      case 'MEDIUM': return <AlertTriangle className="h-5 w-5" />;
      case 'LOW': return <Info className="h-5 w-5" />;
      default: return <AlertCircle className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Mis Borradores
        </button>

        {/* Header Card */}
        <div className="bg-white rounded-2xl border shadow-sm p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
              <FileText className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{draft.title}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-gray-500 font-medium">Versión {draft.version}</span>
                <span className="text-gray-300">•</span>
                <span className="text-sm text-gray-500">Subido el {new Date(draft.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleDownloadPdf}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
            >
              <Download className="h-4 w-4" />
              Descargar PDF
            </button>
            <div className="h-10 w-[1px] bg-gray-200 mx-2 hidden md:block" />
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Puntaje IA</p>
              <p className={`text-2xl font-black ${draft.score && draft.score >= 70 ? 'text-green-600' : 'text-orange-600'}`}>
                {draft.score ? `${draft.score.toFixed(1)}/100` : '--'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content: Findings */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Hallazgos de la IA</h2>
              </div>

              {!latestAiReview ? (
                <div className="bg-white p-12 rounded-xl border text-center">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">El análisis de IA aún está en proceso...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {latestAiReview.findings.map((finding, idx) => (
                    <div key={idx} className={`p-6 rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase border ${getSeverityColor(finding.severity)}`}>
                            {getSeverityIcon(finding.severity)}
                            Prioridad {getSeverityLabel(finding.severity)}
                          </span>
                          <span className="text-sm font-bold text-gray-400 uppercase tracking-tighter">{finding.section}</span>
                        </div>
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2">{finding.description}</h3>
                      <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                        <p className="text-sm font-semibold text-blue-700 mb-1 flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" /> Sugerencia de mejora:
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">{finding.suggestion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar: Summary and Advisor */}
          <div className="space-y-8">
            {/* AI Summary */}
            <section className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Resumen Ejecutivo
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed italic">
                "{latestAiReview?.summary || 'No hay resumen disponible.'}"
              </p>
            </section>

            {/* Advisor Section */}
            <section className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-600" />
                Comentarios del Asesor
              </h2>
              {draft.humanReviews.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Tu asesor aún no ha revisado esta versión.</p>
              ) : (
                <div className="space-y-4">
                  {draft.humanReviews.map((review, idx) => (
                    <div key={review.id || idx} className="p-4 bg-gray-50 rounded-lg border">
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          review.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          review.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {review.status === 'APPROVED' ? 'APROBADO' :
                           review.status === 'REJECTED' ? 'RECHAZADO' : 'CAMBIOS SOLICITADOS'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 font-semibold mb-1">Comentarios Generales:</p>
                      <p className="text-sm text-gray-600 italic whitespace-pre-wrap">
                        "{typeof review.comments === 'string' ? review.comments : review.comments?.general || JSON.stringify(review.comments)}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ORCID Affinity Card */}
            <section className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-purple-600" />
                Afinidad con Línea del Asesor
              </h2>
              {fetchingOrcid ? (
                <div className="flex items-center justify-center py-6 text-sm text-gray-500 gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent" />
                  Evaluando coincidencia semántica...
                </div>
              ) : orcidMatch ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative flex items-center justify-center">
                      <svg className="w-16 h-16">
                        <circle
                          className="text-gray-200"
                          strokeWidth="6"
                          stroke="currentColor"
                          fill="transparent"
                          r="26"
                          cx="32"
                          cy="32"
                        />
                        <circle
                          className={`${
                            orcidMatch.score >= 70 ? 'text-green-500' :
                            orcidMatch.score >= 40 ? 'text-orange-500' : 'text-red-500'
                          }`}
                          strokeWidth="6"
                          strokeDasharray={2 * Math.PI * 26}
                          strokeDashoffset={2 * Math.PI * 26 * (1 - orcidMatch.score / 100)}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          r="26"
                          cx="32"
                          cy="32"
                        />
                      </svg>
                      <span className="absolute font-black text-sm text-gray-800">
                        {orcidMatch.score}%
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">
                        {orcidMatch.match ? "Línea Coincidente" : "Línea No Coincidente"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Afinidad de tesis con publicaciones ORCID
                      </p>
                    </div>
                  </div>
                  <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg text-xs text-purple-800 leading-relaxed">
                    {orcidMatch.reason}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 py-2">No se pudo realizar el análisis de afinidad.</p>
              )}
            </section>

            {/* Advisor Evaluation Form */}
            {((session?.user as any)?.role === "ADVISOR") && (
              <section className="bg-white rounded-xl border-2 border-blue-500 shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  Formulario de Evaluación
                </h2>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                      Estado de la Revisión
                    </label>
                    <select
                      value={statusVal}
                      onChange={(e) => setStatusVal(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                    >
                      <option value="APPROVED">Aprobar Borrador</option>
                      <option value="CHANGES_REQUESTED">Solicitar Cambios</option>
                      <option value="REJECTED">Rechazar Borrador</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                      Comentarios y Retroalimentación
                    </label>
                    <textarea
                      required
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      placeholder="Escribe aquí tus comentarios detallados por sección..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                  >
                    {submittingReview ? "Enviando..." : "Enviar Evaluación"}
                  </button>
                </form>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
