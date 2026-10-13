import { describe, expect, it } from 'vitest';
import { generateTeams, type Settings } from './team-engine';
const roster = (n: number) => Array.from({length:n},(_,i)=>({id:String(i),name:`Student ${i}`,roll:String(i)}));
const settings: Settings = {mode:'size',value:4,min:1,max:4,names:false};
describe('balanced team allocation',()=>{
  for (const [n,sizes] of [[20,[4,4,4,4,4]],[18,[4,4,4,3,3]],[22,[4,4,4,4,3,3]],[7,[4,3]],[3,[3]]] as [number,number[]][]) it(`allocates ${n} students once`,()=>{const teams=generateTeams(roster(n),settings); expect(teams.map(t=>t.members.length)).toEqual(sizes);expect(new Set(teams.flatMap(t=>t.members.map(s=>s.id))).size).toBe(n);});
  it('preserves fixed count',()=>expect(generateTeams(roster(10),{...settings,mode:'count',value:3}).length).toBe(3));
  it('enforces same-team and separation rules',()=>{const teams=generateTeams(roster(8),settings,[{type:'together',ids:['0','1']},{type:'separate',ids:['0','2']}]);expect(teams.find(t=>t.members.some(s=>s.id==='0'))?.members.map(s=>s.id)).toContain('1');expect(teams.find(t=>t.members.some(s=>s.id==='0'))?.members.map(s=>s.id)).not.toContain('2');});
  it('rejects conflicts',()=>expect(()=>generateTeams(roster(8),settings,[{type:'together',ids:['0','1']},{type:'separate',ids:['0','1']}])).toThrow());
  it('handles missing constraint members and same names',()=>expect(generateTeams(roster(3).map(s=>({...s,name:'Same name'})),settings,[{type:'together',ids:['0','absent']}]).flatMap(t=>t.members).length).toBe(3));
  it('rejects duplicate records and impossible minimums',()=>{expect(()=>generateTeams([roster(1)[0],roster(1)[0]].filter(s=>s!==undefined),settings)).toThrow();expect(()=>generateTeams(roster(7),{...settings,min:4})).toThrow();});
});