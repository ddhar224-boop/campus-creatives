import {createServerFn} from '@tanstack/react-start';
import {requireSupabaseAuth} from '@/integrations/supabase/auth-middleware';
import {z} from 'zod';
export const adminWorkspace=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async({context})=>{
 const {data:allowed}=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'});if(!allowed)throw new Error('Administrator access required.');
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
 const [rules,profiles,options]=await Promise.all([context.supabase.from('confidential_team_rules').select('*'),supabaseAdmin.from('profiles').select('*'),context.supabase.from('academic_options').select('*')]);
 if(rules.error||profiles.error||options.error)throw new Error('Administration could not be loaded.');
 return {rules:rules.data??[],profiles:profiles.data??[],options:options.data??[]};
});
export const approveTeacher=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({userId:z.string().uuid()})).handler(async({data,context})=>{
 const {data:allowed}=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'});if(!allowed)throw new Error('Administrator access required.');
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');const {error}=await supabaseAdmin.from('user_roles').upsert({user_id:data.userId,role:'teacher'},{onConflict:'user_id,role'});if(error)throw new Error('Approval failed.');return {ok:true};
});