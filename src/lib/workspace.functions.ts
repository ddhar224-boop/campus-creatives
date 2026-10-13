import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { generateTeams, type Constraint } from './team-engine';

const student = z.object({id:z.string(),name:z.string().trim().min(1).max(150),roll:z.string().max(50)});
const settings = z.object({mode:z.enum(['size','count']),value:z.number().int().min(1).max(500),min:z.number().int().min(1),max:z.number().int().min(1).max(500),names:z.boolean()});
export const generateArrangement = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({students:z.array(student).min(1).max(500),settings})).handler(async({data,context})=>{
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const {data:rules,error} = await supabaseAdmin.from('confidential_team_rules').select('rule_type,members').eq('enabled',true);
  if(error) throw new Error('Team generation is temporarily unavailable.');
  const constraints: Constraint[] = [];
  for(const rule of rules ?? []) {
    const members = z.array(z.object({name:z.string().optional(),id:z.string().optional(),roll:z.string().optional()})).parse(rule.members);
    const ids: string[] = [];
    for(const member of members){
      const matches = data.students.filter(s=>member.id ? s.id===member.id : member.roll ? s.roll===member.roll : s.name.trim().toLocaleLowerCase()===member.name?.trim().toLocaleLowerCase());
      if(matches.length>1) throw new Error('Some student records need administrator verification before this session can be generated.');
      if(matches[0]) ids.push(matches[0].id);
    }
    if(ids.length>1) constraints.push({type:rule.rule_type==='separate'?'separate':'together',ids});
  }
  return generateTeams(data.students,data.settings,constraints);
});

export const saveSession = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({id:z.string().uuid().optional(),title:z.string().trim().min(1).max(200),academic:z.record(z.string(),z.string()),students:z.array(student).min(1).max(500),settings,teams:z.array(z.object({name:z.string().max(100),members:z.array(student)})).max(500)})).handler(async({data,context})=>{
  // Validate the exact displayed arrangement against the trusted roster and rules.
  const {supabaseAdmin} = await import('@/integrations/supabase/client.server');
  const {data:rules,error:ruleError}=await supabaseAdmin.from('confidential_team_rules').select('rule_type,members').eq('enabled',true);
  if(ruleError) throw new Error('Saving is temporarily unavailable.');
  const constraints: Constraint[]=[];
  for(const r of rules ?? []){ const members=z.array(z.object({name:z.string().optional(),id:z.string().optional(),roll:z.string().optional()})).parse(r.members); const ids:string[]=[];for(const m of members){const matches=data.students.filter(s=>m.id?s.id===m.id:m.roll?s.roll===m.roll:s.name.toLocaleLowerCase()===m.name?.toLocaleLowerCase());if(matches.length>1)throw new Error('Student records need verification.');if(matches[0])ids.push(matches[0].id);}if(ids.length>1)constraints.push({type:r.rule_type==='separate'?'separate':'together',ids}); }
  generateTeams(data.students,data.settings,constraints);
  const assigned=data.teams.flatMap(t=>t.members);
  const expected=new Map(data.students.map(s=>[s.id,s]));
  const count=data.settings.mode==='size'?Math.ceil(data.students.length/Math.min(data.settings.value,data.settings.max)):data.settings.value;
  if(data.teams.length!==count || assigned.length!==data.students.length || new Set(assigned.map(s=>s.id)).size!==expected.size || assigned.some(s=>{const r=expected.get(s.id);return !r||r.name!==s.name||r.roll!==s.roll;}) || data.teams.some(t=>t.members.length<data.settings.min||t.members.length>Math.min(data.settings.max,data.settings.mode==='size'?data.settings.value:data.settings.max)))throw new Error('This arrangement is invalid. Generate teams again.');
  for(const c of constraints){const found=data.teams.filter(t=>t.members.some(s=>c.ids.includes(s.id)));if(c.type==='together'?found.length!==1:found.some(t=>t.members.filter(s=>c.ids.includes(s.id)).length>1))throw new Error('This arrangement cannot be saved. Generate teams again.');}
  const teams=data.teams;
  let id=data.id;
  if(id){ const {data:owned}=await context.supabase.from('team_sessions').select('id').eq('id',id).eq('owner_id',context.userId).maybeSingle();if(!owned)throw new Error('You cannot modify this session.'); }
  const payload={owner_id:context.userId,activity_title:data.title,academic_details:data.academic,students:data.students,settings:data.settings};
  const result=id?await context.supabase.from('team_sessions').update(payload).eq('id',id).select('id').single():await context.supabase.from('team_sessions').insert(payload).select('id').single();
  if(result.error || !result.data)throw new Error('The session could not be saved.');id=result.data.id;
  const {error}=await supabaseAdmin.from('team_generations').insert({session_id:id,teams,settings:data.settings});
  if(error)throw new Error('The arrangement could not be saved. Please retry.');
  return {id,teams};
});