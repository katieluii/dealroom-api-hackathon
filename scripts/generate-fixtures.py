import json
from pathlib import Path
root=Path('data/mock')
def write(name,obj): (root/name).write_text(json.dumps(obj,indent=2,ensure_ascii=False)+'\n')
names=['Lumen Bridge','Vector Grove','Meridian Forge','Signal Harbour','Atlas Loom','Aperture Field','Mosaic Circuit','Helix Orchard','Copper Horizon','Pioneer Lens','Orbit Assembly','Tangent Vale','North Circuit','Keystone Light','Frontier Thread','Palisade Quantum','Summit Weave','Cobalt Passage','Aurora Beam','Parallax Bay','Nova Industrial','Prism Systems','Relay Instruments','Solstice Labs','Beacon Manufacturing']
investors=[]
for i,name in enumerate(names):
 country='United States' if i in [0,5,9,14,21] else ['United Kingdom','Germany','France','Netherlands','Sweden'][i%5]
 investors.append(dict(id='i'+str(i),name=name+' (mock)',type='corporate' if i>=20 else 'vc',hqCountry=country,hqRegion='North America' if country=='United States' else 'Europe',stages=['Seed','Series A'] if i%4 else ['Seed','Series A','Series B'],sectors=['Photonics','Semiconductors'] if i%3==0 else ['Photonics','Advanced materials'] if i%3==1 else ['Semiconductors','Deeptech'],typicalChequeMin=500000,typicalChequeMax=4000000 if i<20 else 2000000,lastInvestmentDate='2026-06-15'))
investors[15]['sectors']=['Quantum computing','Deeptech']
companies=[dict(id='demo-photonics',name='Lumina Photonics (mock)',description='Integrated photonic chips for low-power data-centre interconnects. A fictional deeptech company preparing its next round.',stage='Series A',sectors=['Photonics','Semiconductors'],country='United Kingdom',region='Europe',foundedYear=2021,totalRaised=4200000,investorIds=['i7','i12'])]
for i in range(30):
 sectors=['Photonics','Semiconductors'] if i in [0,1,2] else ['Photonics','Optical sensing'] if i%3 else ['Deeptech','Quantum computing']
 companies.append(dict(id='c'+str(i),name=['Mirrorwave','Beamworks','Opticraft'][i]+' (mock)' if i<3 else 'Lab '+str(i+1)+' (mock)',description='Fictional historical portfolio company.',stage='Series A' if i%2==0 else 'Seed',sectors=sectors,country='United Kingdom' if i%2==0 else 'United States',region='Europe' if i%2==0 else 'North America',foundedYear=2018+i%5,totalRaised=7000000,investorIds=[]))
rounds=[]
for i in range(60):
 c=companies[1+i//2]
 # i0 is a strong US lead; i1/i2 are non-US alternatives. i4/i6 conflict with same-region competitors.
 ids=([4,6,20] if i in [0,1,4,5] else [0,1,2,8,20] if i%5==0 else [0,1,8,22] if i%5==1 else [2,3,7,21] if i%5==2 else [0,8,12,23] if i%5==3 else [1,3,9,24])
 if i>20 and i%7==0: ids=[i%20,(i+3)%20,20+i%5]
 lead=ids[0]
 rounds.append(dict(id='r'+str(i),companyId=c['id'],companyName=c['name'],stage='Seed' if i%2==0 else 'Series A',date=('2023' if i%2==0 else '2025')+'-'+str(i%9+1).zfill(2)+'-15',amount=3000000 if i%2==0 else 9000000,investorIds=['i'+str(x) for x in ids],leadInvestorIds=[] if i%11==0 else ['i'+str(lead)],leadIsInferred=i%11==0))
write('companies.json',companies);write('investors.json',investors);write('rounds.json',rounds)
print('Mock fixtures:',len(companies),'companies,',len(investors),'investors,',len(rounds),'historical rounds')
