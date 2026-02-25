import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getIOLHistory, calculateIOL } from '@/lib/iol';
import type { IOLCalculationRequest, IOLCalculation } from '@/lib/iol';
import { useToast } from '@/contexts/toast-context';

export function useIOLCalculator(patientId: number) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ['iol-history', patientId],
    queryFn: async () => {
      const response = await getIOLHistory(patientId);
      return response.data;
    },
    enabled: !!patientId,
  });

  const calculateMutation = useMutation({
    mutationFn: async (calculationData: IOLCalculationRequest) => {
      const response = await calculateIOL(calculationData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iol-history', patientId] });
      showToast('Расчёт ИОЛ выполнен', 'success');
    },
    onError: (error: Error) => {
      showToast(error.message || 'Ошибка расчёта ИОЛ', 'error');
    },
  });

  const lastResult: IOLCalculation | undefined = data?.[0];

  return {
    history: data,
    calculate: calculateMutation.mutate,
    isCalculating: calculateMutation.isPending,
    lastResult,
    isLoading,
    error,
  };
}
