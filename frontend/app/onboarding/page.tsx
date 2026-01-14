"use client";

import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import {
    User,
    Camera,
    FileText,
    CheckCircle2,
    ChevronRight,
    ChevronLeft,
    Upload,
    Loader2
} from "lucide-react";
import { cn } from "../../lib/utils";

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        dob: "",
        languages: "",
    });

    const [selfie, setSelfie] = useState<File | null>(null);
    const [idDoc, setIdDoc] = useState<File | null>(null);
    const [contractDoc, setContractDoc] = useState<File | null>(null);

    const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

    const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelfie(file);
            setSelfiePreview(URL.createObjectURL(file));
        }
    };

    const handleOnboarding = async () => {
        setLoading(true);
        try {
            // 1. Create Profile (Mocking Auth - we'll just insert into profiles/workers directly since we disabled FK for MVP)
            const workerId = crypto.randomUUID();

            // 2. Upload Files
            let avatarUrl = "";
            if (selfie) {
                const { data: uploadData } = await supabase.storage
                    .from('avatars')
                    .upload(`${workerId}/selfie.jpg`, selfie);
                if (uploadData) {
                    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(uploadData.path);
                    avatarUrl = urlData.publicUrl;
                }
            }

            // 3. Insert into profiles
            await supabase.from('profiles').insert({
                id: workerId,
                email: formData.email,
                full_name: `${formData.first_name} ${formData.last_name}`,
                avatar_url: avatarUrl,
                role: 'worker'
            });

            // 4. Insert into workers
            await supabase.from('workers').insert({
                id: workerId,
                first_name: formData.first_name,
                last_name: formData.last_name,
                status: 'active',
                date_of_birth: formData.dob || null,
                languages: formData.languages.split(',').map(s => s.trim())
            });

            // 5. Success
            setStep(4);
        } catch (err) {
            console.error("Onboarding failed:", err);
            alert("Ocorreu um erro ao processar a sua inscrição.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
            <div className="max-w-xl w-full">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="bg-slate-900 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-slate-200">
                        <div className="w-6 h-0.5 bg-white rotate-45 translate-y-0.5"></div>
                        <div className="w-6 h-0.5 bg-white -rotate-45 -translate-y-0.5 -translate-x-6"></div>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">V E R T E X</h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Inscrição de Colaborador</p>
                </div>

                {/* Progress Bar */}
                {step < 4 && (
                    <div className="flex gap-2 mb-8 px-4">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={cn(
                                    "h-1.5 flex-1 rounded-full transition-all duration-500",
                                    step >= s ? "bg-slate-900" : "bg-slate-200"
                                )}
                            />
                        ))}
                    </div>
                )}

                {/* Form Card */}
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl shadow-slate-200/50 p-8 md:p-12 relative overflow-hidden transition-all">

                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-slate-900">Olá! Vamos começar.</h2>
                                <p className="text-slate-500 text-sm font-medium">Preencha os seus dados básicos para criarmos a sua ficha.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Primeiro Nome</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border-none ring-1 ring-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900 outline-none transition-all font-bold"
                                        placeholder="Ex: Manuel"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Apelido</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border-none ring-1 ring-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900 outline-none transition-all font-bold"
                                        placeholder="Ex: Silva"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Email</label>
                                <input
                                    type="email"
                                    className="w-full bg-slate-50 border-none ring-1 ring-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900 outline-none transition-all font-bold"
                                    placeholder="manuel.silva@email.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Data de Nascimento</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 border-none ring-1 ring-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900 outline-none transition-all font-bold"
                                        value={formData.dob}
                                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Línguas (separadas por vírgula)</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border-none ring-1 ring-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900 outline-none transition-all font-bold"
                                        placeholder="Português, Inglês"
                                        value={formData.languages}
                                        onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => setStep(2)}
                                disabled={!formData.first_name || !formData.email}
                                className="w-full bg-slate-900 text-white rounded-2xl py-4 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-slate-800 disabled:bg-slate-200 transition-all shadow-xl shadow-slate-200 mt-4"
                            >
                                Continuar <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="space-y-2">
                                <button onClick={() => setStep(1)} className="text-slate-400 hover:text-slate-900 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest mb-4">
                                    <ChevronLeft className="h-3 w-3" /> Voltar
                                </button>
                                <h2 className="text-2xl font-black text-slate-900">Gostávamos de te ver!</h2>
                                <p className="text-slate-500 text-sm font-medium">Tira uma selfie ou faz upload de uma foto de rosto clara.</p>
                            </div>

                            <div className="flex flex-col items-center justify-center py-8">
                                <div className="relative group">
                                    <div className={cn(
                                        "w-48 h-48 rounded-[2.5rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all",
                                        selfiePreview && "border-slate-900 border-solid ring-8 ring-slate-50"
                                    )}>
                                        {selfiePreview ? (
                                            <img src={selfiePreview} className="w-full h-full object-cover" alt="Preview" />
                                        ) : (
                                            <Camera className="h-12 w-12 text-slate-300" />
                                        )}
                                    </div>
                                    <label
                                        aria-label="Tira uma selfie ou faz upload"
                                        className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white p-4 rounded-2xl shadow-xl cursor-pointer hover:scale-105 transition-transform"
                                    >
                                        <Camera className="h-5 w-5" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="user"
                                            className="hidden"
                                            onChange={handleSelfieChange}
                                            aria-label="Upload de Selfie"
                                        />
                                    </label>
                                </div>
                            </div>

                            <button
                                onClick={() => setStep(3)}
                                disabled={!selfie}
                                className="w-full bg-slate-900 text-white rounded-2xl py-4 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-slate-800 disabled:bg-slate-200 transition-all shadow-xl shadow-slate-200"
                            >
                                Próximo: Documentos <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="space-y-2">
                                <button onClick={() => setStep(2)} className="text-slate-400 hover:text-slate-900 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest mb-4">
                                    <ChevronLeft className="h-3 w-3" /> Voltar
                                </button>
                                <h2 className="text-2xl font-black text-slate-900">Quase lá!</h2>
                                <p className="text-slate-500 text-sm font-medium">Precisamos de alguns documentos para validar o teu perfil.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-slate-300 transition-all cursor-pointer relative">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm text-slate-400">
                                            <FileText className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900">Documento de Identificação</div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                {idDoc ? idDoc.name : "Nenhum ficheiro selecionado"}
                                            </div>
                                        </div>
                                    </div>
                                    <Upload className={cn("h-5 w-5 transition-all", idDoc ? "text-emerald-500" : "text-slate-300")} />
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => setIdDoc(e.target.files?.[0] || null)}
                                        aria-label="Upload de Identificação"
                                    />
                                </div>

                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-slate-300 transition-all cursor-pointer relative">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm text-slate-400">
                                            <FileText className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900">Contrato de Trabalho (Opcional)</div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                {contractDoc ? contractDoc.name : "Nenhum ficheiro selecionado"}
                                            </div>
                                        </div>
                                    </div>
                                    <Upload className={cn("h-5 w-5 transition-all text-slate-300", contractDoc && "text-emerald-500")} />
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => setContractDoc(e.target.files?.[0] || null)}
                                        aria-label="Upload de Contrato"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleOnboarding}
                                disabled={!idDoc || loading}
                                className="w-full bg-slate-900 text-white rounded-2xl py-4 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-slate-800 disabled:bg-slate-200 transition-all shadow-xl shadow-slate-200"
                            >
                                {loading ? (
                                    <>A processar... <Loader2 className="h-4 w-4 animate-spin" /></>
                                ) : (
                                    <>Finalizar Inscrição <CheckCircle2 className="h-4 w-4" /></>
                                )}
                            </button>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="text-center space-y-6 py-8 animate-in zoom-in duration-500">
                            <div className="w-24 h-24 bg-emerald-100 rounded-[2.5rem] flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-3xl font-black text-slate-900">Já está!</h2>
                                <p className="text-slate-500 text-sm font-medium px-8">Recebemos os teus dados com sucesso. A nossa equipa irá validar o teu perfil em breve.</p>
                            </div>
                            <button
                                onClick={() => router.push("/")}
                                className="w-full bg-slate-900 text-white rounded-2xl py-4 font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                            >
                                Ir para o Dashboard
                            </button>
                        </div>
                    )}
                </div>

                <p className="text-center mt-8 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    &copy; 2026 Vertex Human Resources. Todos os direitos reservados.
                </p>
            </div>
        </div>
    );
}
