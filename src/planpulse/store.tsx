import { createContext, useContext, useState, type ReactNode } from 'react';
import { initialMembers, initialProjects, initialTasks, type Member, type Project, type Task } from './data';
type State = { tasks:Task[]; setTasks:React.Dispatch<React.SetStateAction<Task[]>>; members:Member[]; setMembers:React.Dispatch<React.SetStateAction<Member[]>>; projects:Project[]; setProjects:React.Dispatch<React.SetStateAction<Project[]>> };
const Context=createContext<State | null>(null);
export function PlanProvider({children}:{children:ReactNode}) { const [tasks,setTasks]=useState(initialTasks);const [members,setMembers]=useState(initialMembers);const [projects,setProjects]=useState(initialProjects);return <Context.Provider value={{tasks,setTasks,members,setMembers,projects,setProjects}}>{children}</Context.Provider>; }
export function usePlan(){const value=useContext(Context);if(!value)throw new Error('PlanProvider is missing');return value;}
