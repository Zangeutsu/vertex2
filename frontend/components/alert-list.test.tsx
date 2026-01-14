import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AlertList } from './alert-list'
import { Alert } from '../lib/types'

describe('AlertList Component', () => {
    const mockAlerts: Alert[] = [
        {
            title: 'Contrato a expirar',
            entity: 'contract',
            reference_id: '1',
            priority: 10,
            due_date: '2026-02-01',
        },
        {
            title: 'Compliance em falta',
            entity: 'compliance',
            reference_id: '2',
            priority: 5,
        },
    ]

    it('renders "Sem alertas críticos" when list is empty', () => {
        render(<AlertList alerts={[]} />)
        expect(screen.getByText('Sem alertas críticos')).toBeInTheDocument()
    })

    it('renders correctly when there are alerts', () => {
        render(<AlertList alerts={mockAlerts} />)
        expect(screen.getByText('Contrato a expirar')).toBeInTheDocument()
        expect(screen.getByText('Compliance em falta')).toBeInTheDocument()
    })

    it('displays the correct priority badges', () => {
        render(<AlertList alerts={mockAlerts} />)
        expect(screen.getByText('Prioridade 10')).toBeInTheDocument()
        expect(screen.getByText('Prioridade 5')).toBeInTheDocument()
    })

    it('renders correct date formatting', () => {
        render(<AlertList alerts={mockAlerts} />)
        // 2026-02-01 formatted locale date
        const expectedDate = new Date('2026-02-01').toLocaleDateString()
        expect(screen.getByText(new RegExp(expectedDate))).toBeInTheDocument()
    })
})
