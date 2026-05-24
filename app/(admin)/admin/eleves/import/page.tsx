"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle, X, Download } from "lucide-react";

interface RowPreview {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  dateNaissance: string;
  ceinture: string;
  _valid: boolean;
  _error?: string;
}

type ColKey = "prenom" | "nom" | "email" | "telephone" | "dateNaissance" | "ceinture" | "__ignore__";

const COL_OPTIONS: { value: ColKey; label: string }[] = [
  { value: "__ignore__", label: "— Ignorer —" },
  { value: "prenom", label: "Prénom *" },
  { value: "nom", label: "Nom *" },
  { value: "email", label: "Email" },
  { value: "telephone", label: "Téléphone" },
  { value: "dateNaissance", label: "Date de naissance" },
  { value: "ceinture", label: "Ceinture" },
];

const EXAMPLE_CSV = `Prénom,Nom,Email,Téléphone,Date naissance,Ceinture
Jean,Dupont,jean.dupont@email.com,0612345678,1995-03-15,BLANCHE
Marie,Martin,marie.martin@email.com,0698765432,,BLEUE
Ahmed,Benali,,,1990-07-22,BLANCHE`;

function parseCsv(text: string): string[][] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) =>
      line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""))
    );
}

export default function ImportElevesPage() {
  const [step, setStep] = useState<"upload" | "map" | "preview" | "done">("upload");
  const [raw, setRaw] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColKey[]>([]);
  const [rows, setRows] = useState<RowPreview[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ ok: number; skipped: number; errors: string[] } | null>(null);
  const [csvText, setCsvText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleText = (text: string) => {
    setCsvText(text);
    const parsed = parseCsv(text);
    if (parsed.length < 2) return;
    const h = parsed[0];
    setHeaders(h);

    const guessMapping = h.map((col): ColKey => {
      const lower = col.toLowerCase();
      if (lower.includes("prénom") || lower.includes("prenom") || lower === "first name") return "prenom";
      if (lower.includes("nom") || lower === "last name") return "nom";
      if (lower.includes("email") || lower.includes("mail")) return "email";
      if (lower.includes("tel") || lower.includes("phone") || lower.includes("mobile")) return "telephone";
      if (lower.includes("naissance") || lower.includes("birth")) return "dateNaissance";
      if (lower.includes("ceinture") || lower.includes("belt")) return "ceinture";
      return "__ignore__";
    });
    setMapping(guessMapping);
    setRaw(parsed);
    setStep("map");
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => handleText((e.target?.result as string) ?? "");
    reader.readAsText(file, "utf-8");
  };

  const buildPreview = () => {
    const dataRows = raw.slice(1);
    const previews: RowPreview[] = dataRows.map((row) => {
      const obj: Record<string, string> = {};
      mapping.forEach((key, i) => {
        if (key !== "__ignore__") obj[key] = row[i] ?? "";
      });
      const valid = !!(obj.prenom?.trim() && obj.nom?.trim());
      return {
        prenom: obj.prenom ?? "",
        nom: obj.nom ?? "",
        email: obj.email ?? "",
        telephone: obj.telephone ?? "",
        dateNaissance: obj.dateNaissance ?? "",
        ceinture: obj.ceinture ?? "",
        _valid: valid,
        _error: !valid ? "Prénom et nom requis" : undefined,
      };
    });
    setRows(previews);
    setStep("preview");
  };

  const importer = async () => {
    setImporting(true);
    const toImport = rows.filter((r) => r._valid).map(({ prenom, nom, email, telephone, dateNaissance, ceinture }) => ({
      prenom, nom, email: email || undefined, telephone: telephone || undefined,
      dateNaissance: dateNaissance || undefined, ceinture: ceinture || undefined,
    }));
    const res = await fetch("/api/eleves/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eleves: toImport }),
    });
    const data = await res.json();
    setResult(data);
    setStep("done");
    setImporting(false);
  };

  const reset = () => {
    setStep("upload"); setRaw([]); setHeaders([]); setMapping([]);
    setRows([]); setResult(null); setCsvText("");
  };

  const inputClass = "border border-[#e5e5e5] rounded-[8px] px-2.5 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)] bg-white";

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/eleves" className="text-[#666666] hover:text-[#1a1a1a]">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Import CSV</h1>
      </div>

      {/* Étape 1 — Upload */}
      {step === "upload" && (
        <div className="max-w-2xl space-y-4">
          <div className="bg-white rounded-[12px] shadow-sm p-6">
            <h2 className="font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
              <Upload size={17} style={{ color: "var(--color-primary)" }} />
              Importer depuis Google Sheets / CSV
            </h2>
            <p className="text-sm text-[#666666] mb-4">
              Exporte ton Google Sheets au format CSV (Fichier → Télécharger → CSV), puis colle ou dépose le fichier ci-dessous.
            </p>

            <div
              className="border-2 border-dashed border-[#e5e5e5] rounded-[12px] p-8 text-center hover:border-[var(--color-primary)] transition-colors cursor-pointer"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            >
              <FileText size={32} className="mx-auto mb-3 text-[#cccccc]" />
              <p className="text-sm font-medium text-[#666666]">Déposer un fichier CSV ici</p>
              <p className="text-xs text-[#aaaaaa] mt-1">ou cliquer pour sélectionner</p>
              <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>

            <div className="mt-4">
              <p className="text-xs font-medium text-[#666666] mb-2">Ou coller directement le contenu CSV :</p>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Prénom,Nom,Email,Téléphone..."
                rows={5}
                className="w-full border border-[#e5e5e5] rounded-[8px] px-3 py-2 text-sm font-mono focus:outline-none focus:border-[var(--color-primary)] resize-none placeholder:text-[#aaaaaa]"
              />
              <button
                onClick={() => csvText.trim() && handleText(csvText)}
                disabled={!csvText.trim()}
                className="mt-2 bg-[var(--color-primary)] text-white rounded-[8px] px-4 py-2 text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-40"
              >
                Analyser
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[12px] shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-[#1a1a1a]">Exemple de format</p>
              <button
                onClick={() => { const b = new Blob([EXAMPLE_CSV], { type: "text/csv" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "exemple_eleves.csv"; a.click(); }}
                className="flex items-center gap-1.5 text-xs text-[var(--color-primary)] hover:underline"
              >
                <Download size={13} />
                Télécharger l&apos;exemple
              </button>
            </div>
            <pre className="text-xs text-[#666666] bg-[#f9f9f9] rounded-[8px] p-3 overflow-x-auto font-mono">{EXAMPLE_CSV}</pre>
          </div>
        </div>
      )}

      {/* Étape 2 — Mapping */}
      {step === "map" && (
        <div className="max-w-3xl">
          <div className="bg-white rounded-[12px] shadow-sm p-6">
            <h2 className="font-semibold text-[#1a1a1a] mb-1">Correspondance des colonnes</h2>
            <p className="text-sm text-[#666666] mb-4">{raw.length - 1} lignes détectées. Associe chaque colonne au bon champ.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e5e5e5]">
                    <th className="text-left text-xs font-semibold text-[#666666] px-3 py-2">Colonne CSV</th>
                    <th className="text-left text-xs font-semibold text-[#666666] px-3 py-2">Aperçu</th>
                    <th className="text-left text-xs font-semibold text-[#666666] px-3 py-2">Champ</th>
                  </tr>
                </thead>
                <tbody>
                  {headers.map((h, i) => (
                    <tr key={i} className="border-b border-[#f5f5f5]">
                      <td className="px-3 py-2 font-medium text-[#1a1a1a] text-sm">{h}</td>
                      <td className="px-3 py-2 text-xs text-[#999999] font-mono">
                        {raw.slice(1, 3).map((row) => row[i] ?? "").filter(Boolean).join(" / ")}
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={mapping[i]}
                          onChange={(e) => setMapping((m) => { const n = [...m]; n[i] = e.target.value as ColKey; return n; })}
                          className={inputClass}
                        >
                          {COL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={buildPreview} className="bg-[var(--color-primary)] text-white rounded-[8px] px-5 py-2.5 text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors">
                Prévisualiser l&apos;import
              </button>
              <button onClick={reset} className="border border-[#e5e5e5] text-[#666666] rounded-[8px] px-4 py-2.5 text-sm hover:bg-[#f9f9f9] transition-colors">
                Recommencer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Étape 3 — Prévisualisation */}
      {step === "preview" && (
        <div className="max-w-4xl">
          <div className="bg-white rounded-[12px] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e5e5]">
              <div>
                <h2 className="font-semibold text-[#1a1a1a]">Prévisualisation</h2>
                <p className="text-xs text-[#999999] mt-0.5">
                  {rows.filter((r) => r._valid).length} élèves valides ·{" "}
                  {rows.filter((r) => !r._valid).length} ignorés
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep("map")} className="border border-[#e5e5e5] text-[#666666] rounded-[8px] px-4 py-2 text-sm hover:bg-[#f9f9f9] transition-colors">
                  Modifier le mapping
                </button>
                <button
                  onClick={importer}
                  disabled={importing || rows.filter((r) => r._valid).length === 0}
                  className="bg-[var(--color-primary)] text-white rounded-[8px] px-5 py-2 text-sm font-medium hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-colors"
                >
                  {importing ? "Import en cours..." : `Importer ${rows.filter((r) => r._valid).length} élèves`}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e5e5e5] bg-[#fafafa]">
                    <th className="text-left text-xs font-semibold text-[#666666] px-4 py-2">Statut</th>
                    <th className="text-left text-xs font-semibold text-[#666666] px-4 py-2">Prénom</th>
                    <th className="text-left text-xs font-semibold text-[#666666] px-4 py-2">Nom</th>
                    <th className="text-left text-xs font-semibold text-[#666666] px-4 py-2">Email</th>
                    <th className="text-left text-xs font-semibold text-[#666666] px-4 py-2 hidden md:table-cell">Téléphone</th>
                    <th className="text-left text-xs font-semibold text-[#666666] px-4 py-2 hidden md:table-cell">Ceinture</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className={`border-b border-[#f5f5f5] ${!row._valid ? "opacity-50" : ""}`}>
                      <td className="px-4 py-2.5">
                        {row._valid
                          ? <CheckCircle size={14} className="text-green-500" />
                          : (
                            <div className="flex items-center gap-1.5">
                              <X size={14} className="text-red-500 flex-shrink-0" />
                              <span className="text-[10px] text-red-500">{row._error}</span>
                            </div>
                          )}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-[#1a1a1a]">{row.prenom || "—"}</td>
                      <td className="px-4 py-2.5 text-[#1a1a1a]">{row.nom || "—"}</td>
                      <td className="px-4 py-2.5 text-[#666666] text-xs">{row.email || "—"}</td>
                      <td className="px-4 py-2.5 text-[#666666] text-xs hidden md:table-cell">{row.telephone || "—"}</td>
                      <td className="px-4 py-2.5 text-[#666666] text-xs hidden md:table-cell capitalize">{row.ceinture?.toLowerCase() || "blanche"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Étape 4 — Résultat */}
      {step === "done" && result && (
        <div className="max-w-lg">
          <div className="bg-white rounded-[12px] shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle size={20} className="text-green-600" />
              </div>
              <div>
                <h2 className="font-semibold text-[#1a1a1a]">Import terminé</h2>
                <p className="text-xs text-[#666666]">{result.ok} élève{result.ok !== 1 ? "s" : ""} importé{result.ok !== 1 ? "s" : ""} avec succès</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-green-50 rounded-[10px] p-3 text-center">
                <p className="text-2xl font-bold text-green-700">{result.ok}</p>
                <p className="text-xs text-green-600 mt-0.5">Importés</p>
              </div>
              <div className="bg-gray-50 rounded-[10px] p-3 text-center">
                <p className="text-2xl font-bold text-gray-600">{result.skipped}</p>
                <p className="text-xs text-gray-500 mt-0.5">Ignorés</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="bg-red-50 rounded-[10px] p-3 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                  <p className="text-xs font-semibold text-red-700">Erreurs détectées</p>
                </div>
                <ul className="space-y-1">
                  {result.errors.slice(0, 5).map((e, i) => (
                    <li key={i} className="text-xs text-red-600">{e}</li>
                  ))}
                  {result.errors.length > 5 && (
                    <li className="text-xs text-red-400">... et {result.errors.length - 5} autre{result.errors.length - 5 > 1 ? "s" : ""}</li>
                  )}
                </ul>
              </div>
            )}

            <div className="flex gap-3">
              <Link
                href="/admin/eleves"
                className="flex-1 bg-[var(--color-primary)] text-white rounded-[8px] px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors text-center"
              >
                Voir les élèves
              </Link>
              <button onClick={reset} className="flex-1 border border-[#e5e5e5] text-[#666666] rounded-[8px] px-4 py-2.5 text-sm hover:bg-[#f9f9f9] transition-colors">
                Nouvel import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
