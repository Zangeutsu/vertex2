import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { KpiGrid } from './kpi-grid'

describe('KpiGrid Component', () => {
    const mockKpis = {
        active_workers: 10,
        contracts_expiring_7d: 5,
        compliance_pending: 2,
    }

    it('renders all KPI labels correctly', () => {
        render(<KpiGrid kpis={mockKpis} />)

        expect(screen.getByText('Missões Ativas')).toBeInTheDocument()
        expect(screen.getByText('Alertas de Risco')).toBeInTheDocument()
        expect(screen.getByText('Compliance Status')).toBeInTheDocument()
    })

    it('displays the correct values for each KPI', () => {
        render(<KpiGrid kpis={mockKpis} />)

        expect(screen.getByText('10')).toBeInTheDocument()
        expect(screen.getByText('5')).toBeInTheDocument()
        expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('displays the correct descriptions', () => {
        render(<KpiGrid kpis={mockKpis} />)

        expect(screen.getByText('Colaboradores em campo')).toBeInTheDocument()
        expect(screen.getByText('Expirações em 7 dias')).toBeInTheDocument()
        expect(screen.getByText('Pendentes de validação')).toBeInTheDocument()
    })
})
