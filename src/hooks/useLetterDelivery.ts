/**
 * LETTER DELIVERY HOOK
 * 
 * Handles triggering letter delivery via the Supabase function.
 * Supports both scheduling and immediate sending of letters.
 */

import { useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useToast } from '@/components/ui/use-toast';

interface TriggerDeliveryRequest {
  letterId: string;
  action: 'schedule' | 'send';
}

interface TriggerDeliveryResponse {
  message: string;
  newStatus: string;
  emailSent: boolean;
}

export function useLetterDelivery() {
  const { toast } = useToast();

  const triggerDeliveryMutation = useMutation({
    mutationFn: async (data: TriggerDeliveryRequest): Promise<TriggerDeliveryResponse> => {
      const { data: response, error } = await supabase.functions.invoke('trigger-letter-delivery', {
        body: data,
      });

      if (error) {
        console.error('Letter delivery error:', error);
        throw error;
      }
      
      return response.data;
    },
    onSuccess: (data, variables) => {
      toast({
        title: variables.action === 'send' ? 'Letter sent!' : 'Letter scheduled!',
        description: data.message,
        variant: 'default',
      });
    },
    onError: (error: any) => {
      console.error('Letter delivery failed:', error);
      toast({
        title: 'Delivery failed',
        description: error.message || 'Failed to process letter delivery',
        variant: 'destructive',
      });
    },
  });

  return {
    triggerDelivery: triggerDeliveryMutation.mutateAsync,
    isDelivering: triggerDeliveryMutation.isPending,
  };
}
