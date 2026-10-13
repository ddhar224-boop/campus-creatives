export type Student = { id: string; name: string; roll: string };
export type Team = { name: string; members: Student[] };
export type Settings = { mode: 'size' | 'count'; value: number; min: number; max: number; names: boolean };
export type Constraint = { type: 'together' | 'separate'; ids: string[] };

export function generateTeams(students: Student[], settings: Settings, constraints: Constraint[] = []): Team[] {
  if (!students.length) throw new Error('Add at least one student before generating teams.');
  if (new Set(students.map(s => s.id)).size !== students.length) throw new Error('Duplicate student records must be corrected.');
  if (students.some(s => !s.name.trim())) throw new Error('Every student needs a name.');
  const rolls = students.filter(s => s.roll).map(s => s.roll.trim());
  if (new Set(rolls).size !== rolls.length) throw new Error('Please correct duplicate roll numbers.');
  const { value, min, max } = settings;
  if (![value, min, max].every(n => Number.isInteger(n) && n > 0) || min > max) throw new Error('Choose valid team sizes.');
  const limit = settings.mode === 'size' ? Math.min(value, max) : max;
  const count = settings.mode === 'size' ? Math.ceil(students.length / limit) : value;
  if (count > students.length || count * min > students.length || count * limit < students.length) throw new Error('These team sizes cannot fit your class. Adjust the team count or size limits.');
  const parent = new Map(students.map(s => [s.id, s.id]));
  const root = (id: string): string => { const p = parent.get(id); return p && p !== id ? root(p) : id; };
  for (const rule of constraints.filter(c => c.type === 'together')) {
    const ids = rule.ids.filter(id => parent.has(id));
    for (const id of ids.slice(1)) parent.set(root(id), root(ids[0] ?? id));
  }
  const groups = new Map<string, Student[]>();
  for (const s of students) { const key = root(s.id); groups.set(key, [...(groups.get(key) ?? []), s]); }
  const units = [...groups.values()];
  const separates = constraints.filter(c => c.type === 'separate');
  const conflict = (members: Student[]) => separates.some(c => members.filter(s => c.ids.includes(s.id)).length > 1);
  if (units.some(u => u.length > limit || conflict(u))) throw new Error('This configuration cannot produce valid teams. Adjust your settings or contact an administrator.');
  const random = (n: number) => { const values = new Uint32Array(1); crypto.getRandomValues(values); return Math.floor(((values[0] ?? 0) / 4294967296) * n); };
  const shuffle = <T,>(array: T[]) => { for (let i = array.length - 1; i > 0; i--) { const j = random(i + 1); const a = array[i]; const b = array[j]; if (a !== undefined && b !== undefined) { array[i] = b; array[j] = a; } } return array; };
  const capacities = Array.from({length: count}, (_, i) => Math.floor(students.length / count) + (i < students.length % count ? 1 : 0));
  shuffle(units); units.sort((a,b) => b.length - a.length);
  const result: Student[][] = Array.from({length: count}, () => []);
  let attempts = 0;
  const assign = (index: number): boolean => {
    if (index === units.length) return result.every(t => t.length >= min);
    if (++attempts > 150000) return false;
    const unit = units[index]; if (!unit) return false;
    for (const i of shuffle(Array.from({length: count}, (_, k) => k))) {
      const team = result[i]; if (!team) continue;
      if (team.length + unit.length > (capacities[i] ?? 0) || conflict([...team, ...unit])) continue;
      team.push(...unit); if (assign(index + 1)) return true; team.splice(team.length - unit.length, unit.length);
    }
    return false;
  };
  if (!assign(0)) throw new Error('These settings cannot produce a balanced valid arrangement. Try a different team size.');
  const names = ['Orchids','Hornbills','Pioneers','Explorers','Innovators','Trailblazers','Scholars','Achievers'];
  return result.map((members,i) => ({name: settings.names ? `${names[i % names.length]} ${i + 1}` : `Team ${i + 1}`, members: shuffle(members)}));
}