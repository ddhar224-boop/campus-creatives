import {useQuery} from '@tanstack/react-query';
import {supabase} from '@/integrations/supabase/client';
import {useAccount} from '@/components/auth-provider';
export function useSessions(){const {user}=useAccount();return useQuery({queryKey:['sessions',user?.id],enabled:!!user,queryFn:async()=>{const {data,error}=await supabase.from('team_sessions').select('*,team_generations(*)').order('created_at',{ascending:false});if(error)throw error;return data??[];}});}