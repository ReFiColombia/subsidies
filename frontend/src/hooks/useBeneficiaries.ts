import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface Beneficiary {
  id: string;
  address: string;
  name: string;
  phoneNumber: string | null;
  responsable: string | null;
  createdAt: string;
  updatedAt: string;
}

// Fetch all beneficiaries
export const useBeneficiaries = () => {
  return useQuery({
    queryKey: ['beneficiaries'],
    queryFn: async (): Promise<Beneficiary[]> => {
      const response = await fetch(`${API_BASE_URL}/api/beneficiaries`);
      if (!response.ok) throw new Error('Failed to fetch beneficiaries');
      return response.json();
    },
  });
};

// Fetch single beneficiary by address
export const useBeneficiary = (address: string | undefined) => {
  return useQuery({
    queryKey: ['beneficiary', address?.toLowerCase()],
    queryFn: async (): Promise<Beneficiary> => {
      if (!address) throw new Error('Address is required');
      const response = await fetch(`${API_BASE_URL}/api/beneficiaries/${address}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Beneficiary not found');
        }
        throw new Error('Failed to fetch beneficiary');
      }
      return response.json();
    },
    enabled: !!address,
  });
};

// Fetch multiple beneficiaries by addresses
export const useBeneficiariesByAddresses = (addresses: string[]) => {
  return useQuery({
    queryKey: ['beneficiaries', 'batch', addresses],
    queryFn: async (): Promise<Beneficiary[]> => {
      const response = await fetch(`${API_BASE_URL}/api/beneficiaries/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresses }),
      });
      if (!response.ok) throw new Error('Failed to fetch beneficiaries');
      return response.json();
    },
    enabled: addresses.length > 0,
  });
};

// Create beneficiary
export const useCreateBeneficiary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      address: string;
      name: string;
      phoneNumber?: string;
      responsable?: string;
    }) => {
      const response = await fetch(`${API_BASE_URL}/api/beneficiaries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create beneficiary');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
    },
  });
};

// Update beneficiary
export const useUpdateBeneficiary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      address: string;
      name?: string;
      phoneNumber?: string | null;
      responsable?: string | null;
    }) => {
      const { address, ...updateData } = data;
      const response = await fetch(`${API_BASE_URL}/api/beneficiaries/${address}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update beneficiary');
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      queryClient.invalidateQueries({ queryKey: ['beneficiary', variables.address.toLowerCase()] });
    },
  });
};

// Delete beneficiary
export const useDeleteBeneficiary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (address: string) => {
      const response = await fetch(`${API_BASE_URL}/api/beneficiaries/${address}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete beneficiary');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
    },
  });
};

// Helper function to get beneficiary name by address
export const getBeneficiaryName = (beneficiaries: Beneficiary[] | undefined, address: string): string => {
  if (!beneficiaries) return address;
  const beneficiary = beneficiaries.find(
    b => b.address.toLowerCase() === address.toLowerCase()
  );
  return beneficiary?.name || address;
};
