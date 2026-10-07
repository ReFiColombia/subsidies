import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useAccount, useSignMessage } from 'wagmi'

import { clearAdminProof, getAdminHeaders } from '@/lib/adminAuth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export interface Beneficiary {
  id: string
  address: string
  name: string
  phoneNumber: string | null
  responsable: string | null
  createdAt: string
  updatedAt: string
}


// fetch for the beneficiaries API. Adds the admin proof to every request and
// drops a rejected proof so the next request asks the wallet again.
const useAdminFetch = () => {
  const { address } = useAccount()
  const { signMessageAsync } = useSignMessage()

  const adminFetch = useCallback(
    async (url: string, init: RequestInit = {}): Promise<Response> => {
      if (!address) throw new Error('Connect the admin wallet first')
      const adminHeaders = await getAdminHeaders(address, signMessageAsync)
      const response = await fetch(url, {
        ...init,
        headers: { ...(init.headers as Record<string, string>), ...adminHeaders },
      })
      if (response.status === 401) clearAdminProof()
      return response
    },
    [address, signMessageAsync]
  )

  return { adminFetch, address }
}

// Fetch all beneficiaries
export const useBeneficiaries = () => {
  const { adminFetch, address } = useAdminFetch()
  return useQuery({
    queryKey: ['beneficiaries', address?.toLowerCase()],
    queryFn: async (): Promise<Beneficiary[]> => {
      const response = await adminFetch(`${API_BASE_URL}/api/beneficiaries`)
      if (!response.ok) throw new Error('Failed to fetch beneficiaries')
      return response.json()
    },
    enabled: !!address,
    retry: false,
  })
}

// Fetch single beneficiary by address
export const useBeneficiary = (address: string | undefined) => {
  const { adminFetch, address: admin } = useAdminFetch()
  return useQuery({
    queryKey: ['beneficiary', address?.toLowerCase()],
    queryFn: async (): Promise<Beneficiary> => {
      if (!address) throw new Error('Address is required')
      const response = await adminFetch(
        `${API_BASE_URL}/api/beneficiaries/${address}`
      )
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Beneficiary not found')
        }
        throw new Error('Failed to fetch beneficiary')
      }
      return response.json()
    },
    enabled: !!address && !!admin,
    retry: false,
  })
}

// Fetch multiple beneficiaries by addresses
export const useBeneficiariesByAddresses = (addresses: string[]) => {
  const { adminFetch, address: admin } = useAdminFetch()
  return useQuery({
    queryKey: ['beneficiaries', 'batch', addresses],
    queryFn: async (): Promise<Beneficiary[]> => {
      const response = await adminFetch(`${API_BASE_URL}/api/beneficiaries/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresses }),
      })
      if (!response.ok) throw new Error('Failed to fetch beneficiaries')
      return response.json()
    },
    enabled: addresses.length > 0 && !!admin,
    retry: false,
  })
}

// Create beneficiary
export const useCreateBeneficiary = () => {
  const queryClient = useQueryClient()
  const { adminFetch } = useAdminFetch()

  return useMutation({
    mutationFn: async (data: {
      address: string
      name: string
      phoneNumber?: string
      responsable?: string
    }) => {
      const response = await adminFetch(`${API_BASE_URL}/api/beneficiaries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create beneficiary')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] })
    },
  })
}

// Update beneficiary
export const useUpdateBeneficiary = () => {
  const queryClient = useQueryClient()
  const { adminFetch } = useAdminFetch()

  return useMutation({
    mutationFn: async (data: {
      address: string
      name?: string
      phoneNumber?: string | null
      responsable?: string | null
    }) => {
      const { address, ...updateData } = data
      const response = await adminFetch(
        `${API_BASE_URL}/api/beneficiaries/${address}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        }
      )
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update beneficiary')
      }
      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] })
      queryClient.invalidateQueries({
        queryKey: ['beneficiary', variables.address.toLowerCase()],
      })
    },
  })
}

// Delete beneficiary
export const useDeleteBeneficiary = () => {
  const queryClient = useQueryClient()
  const { adminFetch } = useAdminFetch()

  return useMutation({
    mutationFn: async (address: string) => {
      const response = await adminFetch(
        `${API_BASE_URL}/api/beneficiaries/${address}`,
        {
          method: 'DELETE',
        }
      )
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete beneficiary')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] })
    },
  })
}

// Helper function to get beneficiary name by address
export const getBeneficiaryName = (
  beneficiaries: Beneficiary[] | undefined,
  address: string
): string => {
  if (!beneficiaries) return address
  const beneficiary = beneficiaries.find(
    (b) => b.address.toLowerCase() === address.toLowerCase()
  )
  return beneficiary?.name || address
}
