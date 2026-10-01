import Roundtable from '@/components/Roundtable';
import {mockData,portfoliosFor} from '@/lib/mock';
import {buildSyndicate} from '@/lib/engine';
import {roundGraph} from '@/lib/graph';
export default function Page(){const round=buildSyndicate(mockData.companies[0],mockData.investors,{}, {rounds:mockData.rounds,portfolios:portfoliosFor(mockData),asOf:'2026-10-01'});return <Roundtable initial={{sessionId:'',round,graph:roundGraph(round),message:'',mode:'mock',agentMode:'scripted',changedSlots:[]}}/>}
