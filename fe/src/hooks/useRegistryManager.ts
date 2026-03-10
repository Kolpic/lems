import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchRegistry, createPM } from '../api/registry';
import type { CreatePMPayload } from '../types/registry';

const REGISTRY_KEY = ['registry'] as const;

/** Hook that provides registry data fetching and PM creation via TanStack Query. */
export function useRegistryManager() {
  const queryClient = useQueryClient();

  const registryQuery = useQuery({
    queryKey: REGISTRY_KEY,
    queryFn: fetchRegistry,
  });

  const addPMMutation = useMutation({
    mutationFn: (payload: CreatePMPayload) => createPM(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: REGISTRY_KEY });
    },
  });

  return {
    pms: registryQuery.data ?? [],
    isLoading: registryQuery.isLoading,
    error: registryQuery.error,
    addPM: addPMMutation.mutateAsync,
    isAdding: addPMMutation.isPending,
    addError: addPMMutation.error,
  };
}
