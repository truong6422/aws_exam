import { apiClient } from '@/lib/api-client'

export interface CreditTransaction {
    id: number
    delta: number
    type: 'topup' | 'purchase' | 'admin_adjust' | 'refund'
    ref_id: string
    note: string
    created_at: string
}

export interface WalletData {
    balance: number
    transactions: CreditTransaction[]
}

export interface TopUpRequest {
    id: number
    transaction_code: string
    amount_credits: number
    amount_vnd: number
    status: 'pending' | 'approved' | 'rejected'
    admin_note: string
    created_at: string
}

export interface TopUpCreateResponse {
    id: number
    transaction_code: string
    amount_credits: number
    amount_vnd: number
    status: string
    telegram_template: string
    admin_telegram_url: string
    admin_zalo_url: string
    admin_zalo_phone: string
}

export const walletApi = {
    getWallet: () =>
        apiClient.get<WalletData>('/wallet/'),

    createTopUpRequest: (amount_credits: number) =>
        apiClient.post<TopUpCreateResponse>('/wallet/topup/', { amount_credits }),

    getTopUpHistory: () =>
        apiClient.list<TopUpRequest>('/wallet/topup-requests/'),
}
