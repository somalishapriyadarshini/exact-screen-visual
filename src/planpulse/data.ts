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
  {id:'alice',name:'Alice Morgan',role:'Product lead',capacity_hours:30},
  {id:'bob',name:'Bob Chen',role:'Engineer',capacity_hours:30},
  {id:'chloe',name:'Chloe Rivera',role:'Designer',capacity_hours:20},
  {id:'danielle',name:'Danielle Brooks',role:'Engineer',capacity_hours:30},
  {id:'ethan',name:'Ethan Park',role:'QA engineer',capacity_hours:15},
];
export const initialProjects: Project[] = [{id:'demo', name:'Atlas Commerce', target_date:dateFromNow(8)}];
const task = (id:string,title:string,status:Status,assignee_member_id:string,estimate_hours:number,due:number,age:number,dependencies:string[]=[],priority:Priority='medium',order_index=0):Task => ({id,title,status,assignee_member_id,estimate_hours,due_date:dateFromNow(due),status_changed_at:daysAgo(age),dependencies,priority,order_index,description:''});
export const initialTasks: Task[] = [
  task('t1','API authentication','in_progress','danielle',8,-7,9,[],'critical',0),
  task('t2','Checkout flow','in_progress','danielle',6,2,2,['t1'],'high',1),
  task('t3','Payment gateway','in_progress','bob',10,2,4,[],'high',2),
  task('t4','Mobile responsive','in_progress','chloe',12,5,1,[],'medium',3),
  task('t5','Email notifications','blocked','danielle',8,3,6,['t1'],'high',0),
  task('t6','Order confirmation','blocked','danielle',7,4,5,['t3','t5'],'high',1),
  task('t7','Analytics dashboard','todo','alice',8,9,0,[],'medium',0),
  task('t8','User profile page','todo','bob',5,6,0,[],'medium',1),
  task('t9','Subscription billing','todo','danielle',16,14,0,['t1'],'high',2),
  task('t10','Admin panel','todo','',12,12,0,[],'low',3),
  task('t11','Performance optimization','todo','ethan',6,11,0,[],'medium',4),
  task('t12','Design mockups','done','chloe',8,-10,15,[],'medium',0),
  task('t13','Set up CI/CD','done','ethan',6,-12,17,[],'medium',1),
  task('t14','Database schema','done','alice',10,-9,13,[],'medium',2),
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
  const S = task.status==='todo'?0:daysInStatus(task)/7;
  const B = tasks.length ? blockedCount(task,tasks)/tasks.length : 0;
  const L = member ? Math.max(0,assigned/Math.max(1,member.capacity_hours)-1) : 0;
  const D = Math.max(0,1-differenceInCalendarDays(new Date(task.due_date+'T12:00:00'),new Date())/(Math.max(1,task.estimate_hours)/6));
  return {staleness:30*S,blocked_depth:25*B,owner_overload:25*L,deadline:20*D};
}
export function taskRisk(t:Task,tasks:Task[],members:Member[]) { const b=riskBreakdown(t,tasks,members); return Math.max(0,Math.min(100,Math.round(Object.values(b).reduce((a,c)=>a+c,0)))); }
export function projectHealth(tasks:Task[],members:Member[]) { const risks=tasks.filter(t=>t.status!=='done').map(t=>taskRisk(t,tasks,members)); if(!risks.length)return 100; return Math.max(0,Math.round(100-(.6*Math.max(...risks)+.4*risks.reduce((a,b)=>a+b,0)/risks.length))); }
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
  const overloaded=members.flatMap(m=>{const load=loads()[m.id];return load>m.capacity_hours ? proposed.filter(t=>t.assignee_member_id===m.id&&t.status!=='done').sort((a,b)=>b.estimate_hours-a.estimate_hours).map(t=>({t,m})) : []});
  for(const {t,m} of overloaded){
    if(loads()[m.id]<=m.capacity_hours) continue;
    const target=members.filter(n=>n.id!==m.id && loads()[n.id]+t.estimate_hours<=n.capacity_hours).sort((a,b)=>(loads()[a.id]/a.capacity_hours)-(loads()[b.id]/b.capacity_hours))[0];
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
