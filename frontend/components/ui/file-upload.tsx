"use client";

import { useState, useRef } from "react";
import { Upload, File as FileIcon, X, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "./button";

interface FileUploadProps {
    onUpload: (file: File) => Promise<void>;
    label?: string;
    accept?: string;
    maxSizeMB?: number;
}

export function FileUpload({ onUpload, label = "Upload Documento", accept = ".pdf,.jpg,.jpeg,.png", maxSizeMB = 5 }: FileUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            if (selected.size > maxSizeMB * 1024 * 1024) {
                setStatus("error");
                setMessage(`Arquivo muito grande (máx ${maxSizeMB}MB)`);
                return;
            }
            setFile(selected);
            setStatus("idle");
            setMessage("");
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setStatus("uploading");
        try {
            await onUpload(file);
            setStatus("success");
            setMessage("Upload concluído com sucesso!");
            setFile(null);
        } catch (err) {
            setStatus("error");
            setMessage("Erro ao fazer upload. Tente novamente.");
        }
    };

    return (
        <div className="flex flex-col gap-2 p-3 border rounded-lg bg-slate-50 border-slate-200">
            <div className="flex items-center justify-between gap-2">
                <label className="text-sm font-medium text-slate-700">{label}</label>
                {file && (
                    <button
                        onClick={() => setFile(null)}
                        className="text-slate-400 hover:text-red-500"
                        title="Remover arquivo selecionado"
                        aria-label="Remover arquivo"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {!file ? (
                <label
                    htmlFor={`file-upload-${label.replace(/\s+/g, '-').toLowerCase()}`}
                    className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-md border-slate-300 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                    <Upload className="text-slate-400 mb-1" size={24} aria-hidden="true" />
                    <span className="text-xs text-slate-500 text-center">
                        Clique para selecionar ou arraste o arquivo
                    </span>
                    <input
                        type="file"
                        id={`file-upload-${label.replace(/\s+/g, '-').toLowerCase()}`}
                        ref={inputRef}
                        onChange={handleFileChange}
                        accept={accept}
                        className="hidden"
                        aria-label={label || "Upload de arquivo"}
                    />
                </label>
            ) : (
                <div className="flex items-center gap-2 p-2 bg-white border rounded border-slate-200">
                    <FileIcon size={20} className="text-blue-500 shrink-0" aria-hidden="true" />
                    <span className="text-sm truncate flex-1">{file.name}</span>
                    <Button
                        onClick={handleUpload}
                        disabled={status === "uploading"}
                    >
                        {status === "uploading" ? "Enviando..." : "Enviar"}
                    </Button>
                </div>
            )}

            {status === "success" && (
                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                    <CheckCircle size={14} />
                    <span>{message}</span>
                </div>
            )}
            {status === "error" && (
                <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                    <AlertCircle size={14} />
                    <span>{message}</span>
                </div>
            )}
        </div>
    );
}
