"use client";

import { Invoice, Client } from "../lib/types";
import { Badge } from "./ui/badge";

interface Props {
    invoice: Invoice;
    client?: Client;
}

export function PrintableInvoice({ invoice, client }: Props) {
    return (
        <div className="print-container p-8 bg-white text-slate-900 font-sans max-w-4xl mx-auto border sm:border-0 rounded-lg shadow-sm sm:shadow-none print:p-0">
            {/* Header */}
            <div className="flex justify-between items-start border-b pb-8 mb-8 border-slate-100">
                <div>
                    <h1 className="text-3xl font-black text-emerald-700 tracking-tighter mb-1">VERTEX ETT</h1>
                    <p className="text-xs text-slate-500 font-medium">Empresa de Trabalho Temporário, Lda.</p>
                    <div className="mt-4 text-sm text-slate-600 space-y-0.5">
                        <p>Rua da Indústria, 123</p>
                        <p>4400-000 Porto, Portugal</p>
                        <p>NIF: 500 000 000</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold text-slate-900 mb-1 uppercase tracking-widest">Fatura</h2>
                    <p className="text-lg font-mono font-bold text-emerald-600">#{invoice.number}</p>
                    <div className="mt-4 text-sm text-slate-600">
                        <p><span className="font-semibold text-slate-400 uppercase text-[10px] mr-2">Emissão:</span> {new Date(invoice.issue_date).toLocaleDateString()}</p>
                        <p><span className="font-semibold text-slate-400 uppercase text-[10px] mr-2">Vencimento:</span> {new Date(invoice.due_date).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            {/* Client Info */}
            <div className="mb-12">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Faturar a:</h3>
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                    <p className="font-bold text-lg text-slate-900">{client?.name || "Cliente ID: " + invoice.client_id}</p>
                    <div className="mt-2 text-sm text-slate-600 space-y-1">
                        <p>{client?.address || "Morada não especificada"}</p>
                        <p>{client?.contact_email}</p>
                        {client?.phone && <p>Tel: {client.phone}</p>}
                    </div>
                </div>
            </div>

            {/* Items */}
            <div className="mb-12">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b-2 border-slate-900 text-xs uppercase tracking-widest text-slate-400">
                            <th className="py-3 font-bold">Data</th>
                            <th className="py-3 font-bold">Descrição</th>
                            <th className="py-3 font-bold text-right">Horas</th>
                            <th className="py-3 font-bold text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {invoice.timesheets && invoice.timesheets.length > 0 ? (
                            invoice.timesheets.map((ts) => (
                                <tr key={ts.id} className="border-b border-slate-50">
                                    <td className="py-4 text-slate-500 font-mono text-xs">
                                        {new Date(ts.date).toLocaleDateString()}
                                    </td>
                                    <td className="py-4 pr-4">
                                        <p className="font-bold text-slate-900">Prestação de Serviços</p>
                                        <p className="text-xs text-slate-500 mt-1">{ts.notes || "Serviço operacional"}</p>
                                    </td>
                                    <td className="py-4 text-right text-slate-600 font-medium">{ts.hours}h</td>
                                    <td className="py-4 text-right font-bold text-slate-900">
                                        {/* Since we don't have the rate per timesheet here easily without recalculating, 
                                            we can just show hours if we wanted, but for a professional look 
                                            we should ideally show the subtotal for that day. 
                                            In this simplified logic, we'll just show the hours and the total at the bottom. 
                                            Alternatively, we can show (hours * rate) if we pass the rate. */}
                                        -
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr className="border-b border-slate-50 italic text-slate-400">
                                <td className="py-10 text-center" colSpan={4}>
                                    Agrupamento consolidado de serviços prestados.
                                </td>
                            </tr>
                        )}
                        {!invoice.timesheets || invoice.timesheets.length === 0 && (
                            <tr className="border-b border-slate-100 italic text-slate-500">
                                <td className="py-6 pr-4">
                                    <p className="font-bold text-slate-900 not-italic">Prestação de Serviços de Trabalho Temporário</p>
                                    <p className="text-xs mt-1">Serviços operacionais prestados conforme registos de horas no período de faturação.</p>
                                </td>
                                <td className="py-6 text-right">-</td>
                                <td className="py-6 text-right">-</td>
                                <td className="py-6 text-right font-bold text-slate-900">
                                    {new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(invoice.total_amount)}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-12">
                <div className="w-64 space-y-3">
                    <div className="flex justify-between text-sm text-slate-500">
                        <span>Subtotal</span>
                        <span>{new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(invoice.total_amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-500">
                        <span>IVA (Exento Art. 9º)</span>
                        <span>0,00 €</span>
                    </div>
                    <div className="flex justify-between items-center bg-emerald-700 text-white p-4 rounded-xl shadow-lg mt-4">
                        <span className="font-bold">TOTAL</span>
                        <span className="text-xl font-black">
                            {new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(invoice.total_amount)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 pt-8 mt-12 text-[10px] text-slate-400 text-center uppercase tracking-widest leading-loose">
                <p>IVA - Regime de Isenção [Artigo 9.º do CIVA]</p>
                <p>Processado por computador • VERTEX ETT Manager v1.0</p>
            </div>
        </div>
    );
}
