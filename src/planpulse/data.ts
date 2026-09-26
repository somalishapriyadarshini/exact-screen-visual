import { addDays, differenceInCalendarDays, format, subDays } from 'date-fns';

export type Status = 'todo' | 'in_progress' | 'blocked' | 'done';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Member = { id: string; name: string; role: string; capacity_hours: number };
export type Task = { id: string; title: string; description: string; status: Status; priority: Priority; assignee_member_id: string; estimate_hours: number; due_date: string; status_changed_at: string; dependencies: string[]; order_index: number };
export type Project = { id: string; name: string; target_date: string };
export const statuses: { id: Status; label: string }[] = [{id:'todo',label:'To do'},{id:'in_progress',label:'In progress'},{id:'blocked',label:'Blocked'},{id:'done',label:'Done'}];
export const dateFromNow = (days: number) => format(addDays(new Date(), days), 'yyyy-MM-dd');
const daysAgo = (days: number) => subDays(new Date(),days).toISOString();
export const initialMembers: Member[] = [
  {id:'zaheer',name:'Zaheer',role:'Owner',capacity_hours:30},
  {id:'priya',name:'Priya',role:'Member',capacity_hours:30},
  {id:'rahul',name:'Rahul',role:'Member',capacity_hours:20},
  {id:'sneha',name:'Sneha',role:'Member',capacity_hours:30},
  {id:'arjun',name:'Arjun',role:'Member',capacity_hours:15},
];
export const initialProjects: Project[] = [{id:'demo', name:'Mobile App v2 Launch', target_date:dateFromNow(10)}];
const task = (id:string,title:string,status:Status,assignee_member_id:string,estimate_hours:number,due:number,age:number,dependencies:string[]=[],priority:Priority='medium',order_index=0):Task => ({id,title,status,assignee_member_id,estimate_hours,due_date:dateFromNow(due),status_changed_at:daysAgo(age),dependencies,priority,order_index,description:''});
export const initialTasks: Task[] = [
  task('t01','Design system audit','done','sneha',8,-6,6,[],'medium',0),
  task('t02','Set up CI pipeline','done','zaheer',6,-4,4,[],'high',1),
  task('t03','Wireframe onboarding','done','sneha',5,-3,3,[],'low',2),
  task('t04','API authentication service','in_progress','priya',16,-2,9,[],'critical',0),
  task('t05','Payment gateway integration','in_progress','priya',14,-1,5,[],'critical',1),
  task('t06','Push notification service','in_progress','rahul',10,0,2,[],'high',2),
  task('t07','Profile screen','in_progress','arjun',8,5,1,['t08'],'medium',3),
  task('t08','Session management','blocked','priya',12,-1,4,['t04'],'high',0),
  task('t09','Checkout flow','blocked','rahul',10,1,3,['t05'],'critical',1),
  task('t10','Biometric login','todo','priya',8,2,2,['t04'],'medium',0),
  task('t11','Order history screen','todo','rahul',6,3,2,['t09'],'medium',1),
  task('t12','Refund handling','todo','arjun',7,4,1,['t05'],'high',2),
  task('t13','Analytics events','todo','sneha',5,6,1,[],'low',3),
  task('t14','Release checklist and store submit','todo','zaheer',6,8,1,['t04','t06'],'critical',4),
];
export function initials(name:string) { return name.split(' ').map(s=>s[0]).slice(0,2).join(''); }
export function memberName(id:string,members:Member[]) { return members.find(m=>m.id===id)?.name ?? 'Unassigned'; }
export function daysInStatus(t:Task) { return Math.max(0,differenceInCalendarDays(new Date(),new Date(t.status_changed_at))); }
export function blockedCount(task:Task,tasks:Task[]) {
  const seen = new Set<string>();
  function visit(id:string) { tasks.filter(t=>t.dependencies.includes(id) && t.status!=='done').forEach(t=>{if(!seen.has(t.id)){seen.add(t.id);visit(t.id)}}); }
  visit(task.id); return seen.size;
}
export function riskBreakdown(task:Task,tasks:Task[],members:Member[]) {
  if(task.status==='done') return {staleness:0,blocked_depth:0,owner_overload:0,deadline:0};
  const member = members.find(m=>m.id===task.assignee_member_id);
  const assigned = member ? tasks.filter(t=>t.assignee_member_id===member.id && t.status!=='done').reduce((sum,t)=>sum+t.estimate_hours,0) : 0;
  const S = task.status==='todo'?0:Math.min(1,daysInStatus(task)/7);
  const B = tasks.length ? Math.min(1,blockedCount(task,tasks)/tasks.length) : 0;
  const L = member ? Math.min(1,Math.max(0,assigned/Math.max(1,member.capacity_hours)-1)) : 0;
  const D = Math.min(1,Math.max(0,1-differenceInCalendarDays(new Date(task.due_date+'T12:00:00'),new Date())/Math.max(.5,task.estimate_hours/6)));
  return {staleness:30*S,blocked_depth:25*B,owner_overload:25*L,deadline:20*D};
}
export function taskRisk(t:Task,tasks:Task[],members:Member[]) { const b=riskBreakdown(t,tasks,members); return Math.max(0,Math.min(100,Math.round(Object.values(b).reduce((a,c)=>a+c,0)))); }
export function projectHealth(tasks:Task[],members:Member[]) { const live=tasks.filter(t=>t.status!=='done'); if(!live.length)return 100; const risks=live.map(t=>taskRisk(t,tasks,members)); const hours=live.reduce((sum,t)=>sum+t.estimate_hours,0);const average=live.reduce((sum,t,i)=>sum+(risks[i]??0)*t.estimate_hours,0)/Math.max(1,hours); return Math.max(0,Math.round(100-(.6*Math.max(...risks)+.4*average))); }
export function riskBand(score:number) { return score>=85?'severe':score>=65?'high':score>=45?'med':score>=25?'low':'none'; }
export function riskReason(t:Task,tasks:Task[],members:Member[]) {
  const b=riskBreakdown(t,tasks,members); const max=Object.entries(b).sort((a,c)=>c[1]-a[1])[0]?.[0];
  if(max==='staleness') return `${daysInStatus(t)} days in ${statuses.find(s=>s.id===t.status)?.label.toLowerCase()}`;
  if(max==='owner_overload') return `${memberName(t.assignee_member_id,members).split(' ')[0]} is over capacity`;
  if(max==='deadline') return differenceInCalendarDays(new Date(t.due_date+'T12:00:00'),new Date())<0?'Past due date':'Deadline approaching';
  return `${blockedCount(t,tasks)} downstream tasks waiting`;
}
export type PlanChange = {taskId:string; type:'reassigned'|'rescheduled'; from:string; to:string; reason:string};
export function makeReplan(tasks:Task[],members:Member[]) {
  let proposed=tasks.map(t=>({...t})); const changes:PlanChange[]=[];
  const loads=()=>Object.fromEntries(members.map(m=>[m.id,proposed.filter(t=>t.assignee_member_id===m.id&&t.status!=='done').reduce((a,t)=>a+t.estimate_hours,0)]));
  const overloaded=members.flatMap(m=>{const load=loads()[m.id] ?? 0;return load>m.capacity_hours ? proposed.filter(t=>t.assignee_member_id===m.id&&t.status!=='done').sort((a,b)=>b.estimate_hours-a.estimate_hours).map(t=>({t,m})) : []});
  for(const {t,m} of overloaded){
    if((loads()[m.id] ?? 0)<=m.capacity_hours) continue;
    const target=members.filter(n=>n.id!==m.id && (loads()[n.id] ?? 0)+t.estimate_hours<=n.capacity_hours).sort((a,b)=>((loads()[a.id] ?? 0)/a.capacity_hours)-((loads()[b.id] ?? 0)/b.capacity_hours))[0];
    if(!target) continue;
    changes.push({taskId:t.id,type:'reassigned',from:m.name,to:target.name,reason:`${m.name.split(' ')[0]} is over capacity; ${target.name.split(' ')[0]} has room this week`});
    proposed=proposed.map(p=>p.id===t.id?{...p,assignee_member_id:target.id}:p);
  }
  const urgent=proposed.filter(t=>t.status!=='done' && (differenceInCalendarDays(new Date(t.due_date+'T12:00:00'),new Date())<0 || taskRisk(t,proposed,members)>=65));
  for(const t of urgent){
    const newDate=dateFromNow(Math.max(5,Math.ceil(t.estimate_hours/6)+3));
    if(newDate<=t.due_date) continue;
    changes.push({taskId:t.id,type:'rescheduled',from:t.due_date,to:newDate,reason:'More realistic delivery window with the current workload'});
    proposed=proposed.map(p=>p.id===t.id?{...p,due_date:newDate,status_changed_at:new Date().toISOString()}:p);
  }
  return {tasks:proposed,changes};
}
