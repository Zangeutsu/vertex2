"use client";

import { useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { Loader2, LogIn, UserPlus, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { cn } from "../../lib/utils";

export default function LoginPage() {
    const { signIn, signUp, loading: authLoading } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (isLogin) {
                const { error } = await signIn(email, password);
                if (error) throw error;
            } else {
                const { error } = await signUp(email, password, fullName);
                if (error) throw error;
                setSuccess("Conta criada! Verifique o seu email para confirmar.");
                setIsLogin(true);
            }
        } catch (err: any) {
            setError(err.message || "Ocorreu um erro");
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-slate-900">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                        <CheckCircle2 className="h-7 w-7 text-slate-900" />
                    </div>
                    <div>
                        <span className="text-2xl font-black tracking-tighter text-white">Vertex</span>
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] block">Workforce</span>
                    </div>
                </div>

                <div className="space-y-6">
                    <h1 className="text-5xl font-black text-white leading-tight">
                        Gestão de<br />
                        <span className="text-slate-400">Trabalho Temporário</span>
                    </h1>
                    <p className="text-lg text-white/60 max-w-md">
                        Plataforma completa para gestores de ETT. Aloque trabalhadores, gira clientes e pedidos de forma eficiente.
                    </p>
                </div>

                <div className="text-sm text-white/30">
                    © 2026 Vertex Workforce. Todos os direitos reservados.
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-white lg:rounded-l-[48px]">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-black text-slate-900">
                            {isLogin ? "Bem-vindo de volta" : "Criar conta"}
                        </h2>
                        <p className="mt-2 text-slate-500">
                            {isLogin
                                ? "Entre com as suas credenciais para continuar"
                                : "Registe-se para começar a usar a plataforma"}
                        </p>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {!isLogin && (
                            <div className="space-y-2">
                                <label htmlFor="fullName" className="text-sm font-bold text-slate-700">Nome Completo</label>
                                <input
                                    id="fullName"
                                    type="text"
                                    required={!isLogin}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                                    placeholder="Ex: João Silva"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-bold text-slate-700">Email</label>
                            <input
                                id="email"
                                type="email"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-bold text-slate-700">Palavra-passe</label>
                            <input
                                id="password"
                                type="password"
                                required
                                minLength={6}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 disabled:bg-slate-300 transition-all"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : isLogin ? (
                                <>
                                    <LogIn className="h-5 w-5" />
                                    Entrar
                                </>
                            ) : (
                                <>
                                    <UserPlus className="h-5 w-5" />
                                    Criar Conta
                                </>
                            )}
                        </button>
                    </form>

                    <div className="text-center">
                        <button
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError(null);
                                setSuccess(null);
                            }}
                            className="text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors"
                        >
                            {isLogin ? "Não tem conta? Registe-se" : "Já tem conta? Entre"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
