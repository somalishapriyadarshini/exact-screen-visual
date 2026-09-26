import { Link, useLocation } from '@tanstack/react-router';
import { ChevronDown, Command, LayoutGrid, Settings2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlan } from './store';
export function AppShell({children}:{children:React.ReactNode}) {
  const {projects}=usePlan(); const path=useLocation({select:l=>l.pathname});
  return <div className="min-h-screen bg-background"><header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background px-4 md:px-6">
    <div className="flex min-w-0 items-center gap-5"><Link to="/" className="flex shrink-0 items-center gap-2 text-sm font-bold text-foreground"><span className="flex size-7 items-center justify-center rounded-sm border border-border bg-secondary"><Command size={16}/></span>PlanPulse<span className="ml-2 hidden border-l border-border pl-3 text-[10px] font-medium uppercase text-muted-foreground sm:block">Mission control</span></Link><span className="hidden text-faint md:block">/</span><Link to="/p/$id" params={{id:'demo'}} className="hidden items-center gap-2 text-sm text-muted-foreground hover:text-foreground md:flex">{projects[0]?.name || 'Projects'} <ChevronDown size={14}/></Link></div>
    <nav aria-label="Main navigation" className="flex items-center gap-1"><Button asChild variant="ghost" size="sm" className={path==='/'?'text-foreground':'text-muted-foreground'}><Link to="/"><LayoutGrid/> <span className="hidden sm:inline">Projects</span></Link></Button><Button asChild variant="ghost" size="sm" className={path.includes('/intake')?'text-foreground':'text-muted-foreground'}><Link to="/p/$id/intake" params={{id:'demo'}}><Sparkles/><span className="hidden sm:inline">Intake</span></Link></Button><Button asChild variant="ghost" size="sm" className={path==='/settings'?'text-foreground':'text-muted-foreground'}><Link to="/settings"><Settings2/><span className="hidden sm:inline">Settings</span></Link></Button><span className="ml-2 flex size-8 items-center justify-center rounded-full border border-border bg-secondary text-[11px] font-bold">AM</span></nav>
  </header>{children}</div>;
}
