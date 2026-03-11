import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchRegistry, fetchCurrencies, fetchProjects, createPM } from '../api/registry';
import type { CreatePMPayload } from '../types/registry';

const REGISTRY_KEY = ['registry'] as const;
const CURRENCIES_KEY = ['currencies'] as const;
const PROJECTS_KEY = ['projects'] as const;

/** Hook that provides registry data fetching and PM creation via TanStack Query. */
export function useRegistryManager() {
  const queryClient = useQueryClient();

  const registryQuery = useQuery({
    queryKey: REGISTRY_KEY,
    queryFn: fetchRegistry,
  });

  const currenciesQuery = useQuery({
    queryKey: CURRENCIES_KEY,
    queryFn: fetchCurrencies,
  });

  const projectsQuery = useQuery({
    queryKey: PROJECTS_KEY,
    queryFn: fetchProjects,
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
    currencies: currenciesQuery.data ?? [],
    projects: projectsQuery.data ?? [],
    addPM: addPMMutation.mutateAsync,
    isAdding: addPMMutation.isPending,
    addError: addPMMutation.error,
  };
}
