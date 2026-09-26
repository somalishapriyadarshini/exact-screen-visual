import { createFileRoute } from '@tanstack/react-router';
import { BoardPage } from '@/planpulse/board';
export const Route=createFileRoute('/p/$id')({head:()=>({meta:[{title:'Delivery Board — PlanPulse'},{name:'description',content:'See the work, identify delivery risk, and replan the week in PlanPulse.'},{property:'og:title',content:'Delivery Board — PlanPulse'},{property:'og:description',content:'See the work, identify delivery risk, and replan the week in PlanPulse.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),component:BoardPage});
