import json
from pathlib import Path
from datetime import datetime, timedelta
root = Path('data/mock')
root.mkdir(parents=True, exist_ok=True)
sectors = ['Photonics', 'Quantum computing', 'Robotics', 'Advanced materials', 'Fusion', 'Space']
company_names = ['Luma Photonics', 'Qubit Loom', 'Field Robotics', 'Matterkind', 'Helio Fusion', 'Orbit Fabric']
partners = [{'id': 'p'+str(i), 'name': n, 'email': e+'@example.test'} for i, (n, e) in enumerate([('Maya Chen','maya'),('Alex Morgan','alex'),('Sam Okafor','sam'),('Jo Rivera','jo')])]
companies = [{'id':'pc'+str(i),'name':n,'domain':n.lower().replace(' ','')+'.example','pitch':['Optical chips that reduce data-centre power consumption.','Quantum sensors for industrial inspection.','Autonomous robots for dangerous field work.','Recyclable composites for high-performance manufacturing.','Compact fusion components for clean energy.','Satellite servicing systems that extend spacecraft life.'][i],'sectors':[sectors[i]],'nextRound':'Series A' if i<4 else 'Seed','dealroomId':'dr-company-'+str(i),'matchMethod':'domain','matchStatus':'confirmed'} for i,n in enumerate(company_names)]
orgs=['Aster Photon Ventures','Kite Quantum Ventures','Forge Robotics Ventures','Meridian Materials Ventures','Sol Fusion Ventures','Atlas Orbital Ventures','Prism Corporate Ventures','Lattice Industrial Ventures','Terrain Automation Ventures','Element Works Ventures','Ember Energy Ventures','Skybridge Space Ventures','Beamline Strategic Capital','Waveform Corporate Capital','North Circuit Ventures']
investors=[{'id':'dr-investor-'+str(i),'name':n,'domain':'strategic'+str(i)+'.example','type':'corporate','hqCountry':['United Kingdom','Germany','France'][i%3],'sectors':[sectors[i%6]],'stages':['Seed','Series A'],'recentInvestments':[{'companyName':sectors[i%6]+' Example '+str(j+1),'sectors':[sectors[i%6]],'date':'2025-0'+str(j+2)+'-01','stage':'Seed'} for j in range(2)] if i<12 else []} for i,n in enumerate(orgs)]
first=['Ari','Robin','Noor','Casey','Ellis','Rory','Avery','Sky','Drew','Morgan','Taylor','Sasha','Lee','Jamie','Reese']
last=['Park','Lane','Shah','Reed']
contacts=[]; interactions=[]; matches=[]
asof=datetime(2026,10,1,12)
for i in range(60):
 inv=investors[i%15];owner='p'+str(i%4);cid='contact-'+str(i)
 contacts.append({'id':cid,'crmId':'hs-'+str(i),'name':first[i%15]+' '+last[i//15],'jobTitle':'Investment Director' if i%3 else 'Partner','orgName':inv['name'],'emailDomain':inv['domain'],'ownerUserId':owner})
 matches.append({'id':'match-'+str(i),'contactId':cid,'dealroomInvestorId':inv['id'],'method':'name' if i in [12,27,42] else 'domain','status':'unconfirmed'})
 for j in range(7 if i<40 else 6):
  weak=i%15%6 in [4,5]
  kind='note' if weak else ['meeting','meeting','call','email','email','meeting','email'][j]
  days=240+j*12 if weak else 7+(i%3)*4+j*9
  interactions.append({'id':'event-'+str(i)+'-'+str(j),'crmId':'activity-'+str(i)+'-'+str(j),'contactId':cid,'userId':owner,'type':kind,'date':(asof-timedelta(days=days)).isoformat()+'Z',**({'direction':'inbound' if j==4 else 'outbound'} if kind=='email' else {})})
fixture={'asOf':asof.isoformat()+'Z','partners':partners,'companies':companies,'investors':investors,'contacts':contacts,'interactions':interactions,'matches':matches}
(root/'crm.json').write_text(json.dumps(fixture,indent=2,ensure_ascii=False)+'\n')
print({k:len(fixture[k]) for k in ['partners','companies','investors','contacts','interactions']})
