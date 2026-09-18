/* eslint-disable */
// @ts-nocheck
// Prototype logic class extracted verbatim from "SVBL Planung.dc.html" (the binding
// specification of the planning rules). Only the font variable was changed so the
// self-hosted next/font families are used. Demo data is hardcoded on purpose.
import { DCLogic } from "./dc-runtime";
export class Component extends DCLogic {
  constructor(p){
    super(p);
    const D = this.data();
    this.D = D;
    this.state = {
      authed:false, email:'', pw:'', loginError:'', role:'Planung', userName:'', screen:'dashboard',
      assistantOpen:false, messages:[{who:'bot',text:'Fragen Sie nach Ersatz, Alternativterminen, Kandidaten, Kontaktdaten, Zertifikaten, offenen Kursen, Konflikten, Auslastung oder Geräten. Ich antworte mit Karten – Aktionen darin führen Sie aus.',card:null}], draft:'', thinking:false,
      filterLoc:'', filterStatus:'', instrSearch:'', filterSkill:'', filterLang:'', filterSchool:'', filterTrack:'',
      coursesTab:'runs', selCourse:null, instrId:null, instrTab:'skills', expandedAppr:null,
      importStep:1, importSource:'school', importBatch:null, newCourse:null, toast:'',
      warnDays:60, leadWeeks:4, accent:'Blau', radius:6, density:'normal', font:'Plex', vacKw:44, vacMsg:'', calView:'week', calKw:38, calMonth:8,
      courses:D.courses, devices:D.devices, apprentices:D.apprentices, instrData:D.instructors, apprId:null, apprTab:'plan', roomDialog:null, skillDialog:null, certDialog:null, contactDialog:null, noteDraft:null, noteSaved:false, autoLog:[], fixDialog:null, propDialog:null, runs:[{id:'r1',period:'HS26',created:'15.9.2026',stage:1,demand:null,courses:null,committed:false}], activeRun:null, runDialog:null, boardView:'week', boardMonth:8, newSkill:'', newTeach:'', noShows:D.apprentices.filter(a=>a.missed).map(a=>({id:'n'+a.id,appr:a.id,module:a.missed,course:'ÜK 3 Rümlang KW 36'})), taskFilter:'', absDialog:null, noShowDialog:null, doneTasks:[], locId:null, locTab:'rooms', locKw:38, devFilterType:'', devFilterLoc:'', devFilterMob:'', devDialog:null, newRoom:'', absences:D.absences, dups:D.dups, audit:D.audit, dragId:null
    };
  }
  data(){
    const R=(name,kind,cap)=>({name,kind,cap});
    const locs=[
      {id:'RUP',name:'Rupperswil',region:'D',uk:true,cap:3,address:'Industriestrasse 12, 5102 Rupperswil',contact:'Sandra Meier',rooms:[R('Raum 1.01','Theorieraum',16),R('Raum 1.04','Theorieraum',12),R('Halle A','Praxishalle',8),R('Halle B','Praxishalle',8),R('Aussenplatz','Aussenfläche',6)]},
      {id:'ZOF',name:'Zofingen',region:'D',uk:false,cap:2,address:'Hintere Hauptgasse 3, 4800 Zofingen',contact:'Peter Lang',rooms:[R('Raum 1','Theorieraum',14),R('Aussenplatz','Aussenfläche',6)]},
      {id:'MUT',name:'Muttenz',region:'D',uk:false,cap:2,address:'Rheinstrasse 40, 4132 Muttenz',contact:'Nadia Rossi',rooms:[R('Raum 1','Theorieraum',12),R('Halle 1','Praxishalle',6)]},
      {id:'BER',name:'Bern',region:'D',uk:true,cap:3,address:'Wankdorffeldstrasse 100, 3014 Bern',contact:'Thomas Graf',rooms:[R('Raum 2.01','Theorieraum',16),R('Raum 3.02','Theorieraum',12),R('Halle 1','Praxishalle',8),R('Halle 2','Praxishalle',8)]},
      {id:'GOL',name:'Goldach',region:'D',uk:false,cap:1,address:'Hafenstrasse 7, 9403 Goldach',contact:'Rita Kunz',rooms:[R('Raum 1','Theorieraum',12),R('Halle 1','Praxishalle',6)]},
      {id:'GUN',name:'Gunzgen',region:'D',uk:false,cap:1,address:'Logistikpark 2, 4617 Gunzgen',contact:'Urs Baumann',rooms:[R('Raum 1','Theorieraum',12)]},
      {id:'RUM',name:'Rümlang',region:'D',uk:true,cap:2,address:'Riedmattstrasse 9, 8153 Rümlang',contact:'Karin Frey',rooms:[R('Raum 1.04','Theorieraum',14),R('Raum 2.03','Theorieraum',12),R('Halle 2','Praxishalle',8)]},
      {id:'MAR',name:'Marly',region:'F',uk:true,cap:2,address:'Route de la Gruyère 1, 1723 Marly',contact:'Luc Bovet',rooms:[R('Salle 1','Theorieraum',14),R('Halle A','Praxishalle',8)]},
      {id:'CHA',name:'Chavornay',region:'F',uk:false,cap:1,address:'Zone industrielle 4, 1373 Chavornay',contact:'Anne Dubois',rooms:[R('Salle 1','Theorieraum',12)]},
      {id:'GIU',name:'Giubiasco',region:'I',uk:true,cap:2,address:'Via Industria 5, 6512 Giubiasco',contact:'Marco Bianchi',rooms:[R('Aula','Theorieraum',16),R('Halle 1','Praxishalle',8)]},
      {id:'RIA',name:'Riazzino',region:'I',uk:false,cap:1,address:'Via Cantonale 22, 6595 Riazzino',contact:'Elena Conti',rooms:[R('Aula','Theorieraum',12)]}];
    const skills=['Lagerlogistik','Kommissionieren','Stapler','Hebebühne','Gefahrgut','Arbeitssicherheit'];
    const certTypes={SUVA:{name:'SUVA Staplerinstruktor',issuer:'SUVA',years:5},IPAF:{name:'IPAF Instruktor',issuer:'IPAF',years:5,maint:{min:5,types:['UK07'],label:'Hebebühnen-Kurse (ÜK 7 / IPAF) pro Kalenderjahr'}},SDR:{name:'Gefahrgut SDR/ADR',issuer:'ASTAG',years:3,maint:{min:2,types:['UK09'],label:'Gefahrgut-Kurse (ÜK 9) pro Kalenderjahr'}},EH:{name:'Erste Hilfe BLS-AED',issuer:'intern',years:2}};
    const devTypes={STS:{name:'Stapler Kat. S',cert:'SUVA'},STR1:{name:'Stapler Kat. R1',cert:'SUVA'},HB:{name:'Hebebühne',cert:'IPAF'}};
    const instructors=[
      {id:'i1',name:'Roger Federer',email:'roger.federer@svbl.ch',phone:'+41 62 123 45 01',emp:'Angestellt',loc:'RUP',langs:['D','F'],skills:['Lagerlogistik','Stapler','Hebebühne'],certs:[{t:'SUVA',issued:'2023-03-31',until:'2028-03-31'},{t:'IPAF',issued:'2021-10-05',until:'2026-10-05'},{t:'EH',issued:'2025-05-01',until:'2027-05-01'}],notes:'Übernimmt gern Kurse in Rupperswil und Zofingen. Sehr gut mit jungen Lernenden.',taught:{UK07:2},teach:['UK01','UK05','UK07'],maxTravel:'60 min',pref:'Rupperswil, Zofingen'},
      {id:'i2',name:'Martina Hingis',email:'martina.hingis@freelance.ch',phone:'+41 79 220 11 44',emp:'Freelancer',loc:'RUM',langs:['D'],skills:['Lagerlogistik','Gefahrgut'],certs:[{t:'SDR',issued:'2025-01-15',until:'2028-01-15'}],notes:'Nur Di–Do verfügbar, Freitag nach Absprache.',taught:{UK09:1},teach:['UK01','UK09'],maxTravel:'45 min',pref:'Rümlang'},
      {id:'i3',name:'Bruno Ganz',email:'bruno.ganz@svbl.ch',phone:'+41 31 123 45 02',emp:'Angestellt',loc:'BER',langs:['D','F'],skills:['Stapler','Hebebühne'],certs:[{t:'SUVA',issued:'2022-06-01',until:'2027-06-01'},{t:'IPAF',issued:'2021-08-01',until:'2026-08-01'}],notes:'IPAF-Auffrischung ist beantragt, Termin offen.',taught:{UK07:1},teach:['UK05','UK07'],maxTravel:'90 min',pref:'Bern'},
      {id:'i4',name:'Ursula Andress',email:'ursula.andress@freelance.ch',phone:'+41 79 441 08 23',emp:'Freelancer',loc:'BER',langs:['D','F','I'],skills:['Lagerlogistik','Kommissionieren'],certs:[{t:'EH',issued:'2025-02-01',until:'2027-02-01'}],notes:'Dreisprachig; ideal für Marly und Giubiasco.',maxTravel:'120 min',pref:'Bern, Marly'},
      {id:'i5',name:'Stan Wawrinka',email:'stan.wawrinka@svbl.ch',phone:'+41 26 123 45 03',emp:'Angestellt',loc:'MAR',langs:['F','D'],skills:['Stapler','Lagerlogistik'],certs:[{t:'SUVA',issued:'2024-02-01',until:'2029-02-01'}],notes:'',maxTravel:'60 min',pref:'Marly, Chavornay'},
      {id:'i6',name:'Lara Gut-Behrami',email:'lara.gut@freelance.ch',phone:'+41 79 512 76 90',emp:'Freelancer',loc:'GIU',langs:['I','D'],skills:['Lagerlogistik','Stapler'],certs:[{t:'SUVA',issued:'2023-09-01',until:'2028-09-01'}],notes:'Einzige Staplerinstruktorin im Tessin.',maxTravel:'30 min',pref:'Giubiasco, Riazzino'},
      {id:'i7',name:'Simone Niggli-Luder',email:'simone.niggli@svbl.ch',phone:'+41 31 123 45 04',emp:'Angestellt',loc:'BER',langs:['D'],skills:['Lagerlogistik','Gefahrgut','Kommissionieren'],certs:[{t:'SDR',issued:'2024-06-01',until:'2027-06-01'},{t:'EH',issued:'2026-01-10',until:'2028-01-10'}],notes:'Möchte nicht mit Ganz im selben Kurs eingesetzt werden.',taught:{UK09:3},teach:['UK01','UK03','UK09'],maxTravel:'60 min',pref:'Bern'},
      {id:'i8',name:'Xherdan Shaqiri',email:'xherdan.shaqiri@freelance.ch',phone:'+41 79 883 21 05',emp:'Freelancer',loc:'RUM',langs:['D'],skills:['Stapler'],certs:[{t:'SUVA',issued:'2022-11-01',until:'2027-11-01'}],notes:'Samstagskurse bevorzugt.',maxTravel:'45 min',pref:'Rümlang, Zofingen'},
      {id:'i9',name:'Beat Feuz',email:'beat.feuz@svbl.ch',phone:'+41 62 123 45 05',emp:'Angestellt',loc:'RUP',langs:['D'],skills:['Hebebühne','Stapler'],certs:[{t:'IPAF',issued:'2024-04-01',until:'2029-04-01'},{t:'SUVA',issued:'2023-01-01',until:'2028-01-01'}],notes:'',taught:{UK07:4},teach:['UK05','UK07','WPST'],maxTravel:'90 min',pref:'Rupperswil, Bern'},
      {id:'i10',name:'Emil Steinberger',email:'emil.steinberger@freelance.ch',phone:'+41 79 604 33 17',emp:'Freelancer',loc:'ZOF',langs:['D','F'],skills:['Lagerlogistik','Arbeitssicherheit'],certs:[],notes:'Nur 1-Tages- und 2-Tages-Kurse.',maxTravel:'30 min',pref:'Zofingen, Rupperswil'},
      {id:'i11',name:'Belinda Bencic',email:'belinda.bencic@svbl.ch',phone:'+41 44 123 45 06',emp:'Angestellt',loc:'RUM',langs:['D'],skills:['Lagerlogistik','Kommissionieren'],certs:[{t:'EH',issued:'2024-09-01',until:'2026-09-01'}],notes:'',maxTravel:'60 min',pref:'Rümlang'},
      {id:'i12',name:'Marco Odermatt',email:'marco.odermatt@freelance.ch',phone:'+41 79 771 55 28',emp:'Freelancer',loc:'GOL',langs:['D'],skills:['Stapler','Hebebühne'],certs:[{t:'IPAF',issued:'2025-03-01',until:'2030-03-01'},{t:'SUVA',issued:'2021-11-20',until:'2026-11-20'}],notes:'Reist ungern über 1 h.',taught:{UK07:5},teach:['UK05','UK07'],maxTravel:'60 min',pref:'Goldach, Rümlang'}
    ];
    const types={
      UK01:{code:'ÜK 1',name:'Grundlagen Lagerlogistik',kind:'ÜK',track:'EFZ',days:2,skills:['Lagerlogistik'],certs:[],devs:[],max:12,sem:1},
      UK03:{code:'ÜK 3',name:'Kommissionieren & Lagertechnik',kind:'ÜK',track:'EFZ',days:2,skills:['Kommissionieren'],certs:[],devs:[],max:12,sem:2},
      UK05:{code:'ÜK 5',name:'Flurförderzeuge Kat. S',kind:'ÜK',track:'EFZ',days:4,skills:['Stapler'],certs:['SUVA'],devs:[{t:'STS',n:4}],max:8,sem:3,prereq:'ÜK 1'},
      UK07:{code:'ÜK 7',name:'Hebebühnen (IPAF)',kind:'ÜK',track:'EFZ',days:2,skills:['Hebebühne'],certs:['IPAF'],devs:[{t:'HB',n:2}],max:8,sem:4,prereq:'ÜK 5'},
      UK09:{code:'ÜK 9',name:'Gefahrgut & Arbeitssicherheit',kind:'ÜK',track:'EFZ',days:1,skills:['Gefahrgut'],certs:['SDR'],devs:[],max:12,sem:5},
      EBA2:{code:'ÜK 2 EBA',name:'Lager & Kommissionieren',kind:'ÜK',track:'EBA',days:2,skills:['Lagerlogistik'],certs:[],devs:[],max:10,sem:2},
      STR1:{code:'ST-R1',name:'Staplerkurs R1 Grundkurs',kind:'Erwachsene',track:'–',days:4,sat:true,skills:['Stapler'],certs:['SUVA'],devs:[{t:'STR1',n:3}],max:6},
      UK02:{code:'ÜK 2',name:'Wareneingang & Kontrolle',kind:'ÜK',track:'EFZ',days:2,skills:['Lagerlogistik'],certs:[],devs:[],max:12,sem:1},
      UK04:{code:'ÜK 4',name:'Verpackung & Warenausgang',kind:'ÜK',track:'EFZ',days:2,skills:['Kommissionieren'],certs:[],devs:[],max:12,sem:2},
      UK06:{code:'ÜK 6',name:'Lagerbewirtschaftung & IT',kind:'ÜK',track:'EFZ',days:2,skills:['Lagerlogistik'],certs:[],devs:[],max:12,sem:3},
      UK08:{code:'ÜK 8',name:'Transportwesen',kind:'ÜK',track:'EFZ',days:2,skills:['Lagerlogistik'],certs:[],devs:[],max:12,sem:4},
      UK10:{code:'ÜK 10',name:'Materialwirtschaft',kind:'ÜK',track:'EFZ',days:2,skills:['Kommissionieren'],certs:[],devs:[],max:12,sem:5},
      UK11:{code:'ÜK 11',name:'Qualität & Prozesse',kind:'ÜK',track:'EFZ',days:2,skills:['Arbeitssicherheit'],certs:[],devs:[],max:12,sem:6},
      UK12:{code:'ÜK 12',name:'Repetition & Kompetenznachweis',kind:'ÜK',track:'EFZ',days:2,skills:['Lagerlogistik'],certs:[],devs:[],max:12,sem:6},
      EBA1:{code:'ÜK 1 EBA',name:'Grundlagen Lager',kind:'ÜK',track:'EBA',days:2,skills:['Lagerlogistik'],certs:[],devs:[],max:10,sem:1},
      EBA3:{code:'ÜK 3 EBA',name:'Warenausgang & Transport',kind:'ÜK',track:'EBA',days:2,skills:['Lagerlogistik'],certs:[],devs:[],max:10,sem:3},
      EBA4:{code:'ÜK 4 EBA',name:'Repetition & Kompetenznachweis',kind:'ÜK',track:'EBA',days:2,skills:['Lagerlogistik'],certs:[],devs:[],max:10,sem:4},
      WPST:{code:'WP-ST',name:'Wiederholungsprüfung Stapler',kind:'Prüfung',track:'–',days:1,skills:['Stapler'],certs:['SUVA'],devs:[{t:'STS',n:2}],max:6}
    };
    const courses=[
      {id:'c1',type:'UK05',loc:'RUP',kw:38,off:0,lang:'D',status:'laufend',instr:'i1',enrolled:8,room:'Halle B',blocks:[{time:'08:00–09:30',label:'Theorie & Sicherheit',room:'Raum 1.04'},{time:'09:45–16:30',label:'Praxis Stapler Kat. S',room:'Halle B'}],cohort:'2025 EFZ'},
      {id:'c2',type:'UK01',loc:'BER',kw:38,off:2,lang:'D',status:'bestätigt',instr:'i7',enrolled:11,room:'Raum 2.01',backup:'i11',cohort:'2026 EFZ'},
      {id:'c3',type:'UK07',loc:'BER',kw:39,off:0,lang:'D',status:'bestätigt',instr:'i3',enrolled:7,room:'Halle 1',blocks:[{time:'08:00–10:00',label:'Theorie IPAF',room:'Raum 3.02'},{time:'10:15–16:30',label:'Praxis Hebebühne',room:'Halle 1'}],backup:'i1',cohort:'2025 EFZ'},
      {id:'c4',type:'UK03',loc:'RUM',kw:39,off:2,lang:'D',status:'geplant',instr:null,enrolled:10,room:'Raum 1.04',cohort:'2026 EFZ'},
      {id:'c5',type:'UK05',loc:'MAR',kw:40,off:0,lang:'F',status:'bestätigt',instr:'i5',enrolled:8,room:'Halle A',backup:'i4',cohort:'2025 EFZ'},
      {id:'c6',type:'UK07',loc:'RUP',kw:40,off:3,lang:'D',status:'geplant',instr:'i1',enrolled:6,room:'Halle A',cohort:'2025 EFZ'},
      {id:'c7',type:'EBA2',loc:'GIU',kw:41,off:0,lang:'I',status:'geplant',instr:'i6',enrolled:9,room:'Aula',cohort:'2026 EBA'},
      {id:'c8',type:'UK09',loc:'BER',kw:41,off:1,lang:'D',status:'offen',instr:null,enrolled:12,room:'Raum 3.02',cohort:'2025 EFZ'},
      {id:'c9',type:'STR1',loc:'ZOF',kw:41,off:5,lang:'D',status:'bestätigt',instr:'i8',enrolled:6,room:'Aussenplatz',cohort:null},
      {id:'c10',type:'UK05',loc:'RUM',kw:42,off:0,lang:'D',status:'offen',instr:null,enrolled:8,room:'Halle 2',cohort:'2025 EFZ'},
      {id:'c11',type:'UK01',loc:'MAR',kw:42,off:0,lang:'F',status:'geplant',instr:'i4',enrolled:12,room:'Salle 1',cohort:'2026 EFZ'},
      {id:'c12',type:'WPST',loc:'RUP',kw:43,off:4,lang:'D',status:'geplant',instr:null,enrolled:5,room:'Halle B',blocks:[{time:'08:00–09:00',label:'Theorieprüfung',room:'Raum 1.04'},{time:'09:15–12:00',label:'Praxisprüfung',room:'Halle B'}],backup:'i1',cohort:null},
      {id:'c13',type:'UK07',loc:'GIU',kw:44,off:0,lang:'I',status:'offen',instr:null,enrolled:4,room:'Halle 1',cohort:'2025 EFZ'},
      {id:'c14',type:'UK03',loc:'BER',kw:44,off:2,lang:'D',status:'geplant',instr:'i11',enrolled:11,room:'Raum 2.03',cohort:'2026 EFZ'},
      {id:'c15',type:'UK01',loc:'RUP',kw:45,off:0,lang:'D',status:'geplant',instr:'i10',enrolled:12,room:'Raum 1.01',cohort:'2026 EFZ'}
    ];
    const absences=[
      {id:'a1',instr:'i8',kw:41,kind:'Ferien',status:'genehmigt'},
      {id:'a2',instr:'i11',kw:43,kind:'Ferien',status:'beantragt'},
      {id:'a3',instr:'i1',kw:44,kind:'Weiterbildung',status:'blockiert'},
      {id:'a4',instr:'i3',kw:42,kind:'Ferien',status:'genehmigt'}
    ];
    const devices=[
      ...[1,2,3,4,5].map(n=>({id:'RUP-S'+n,type:'STS',loc:'RUP',status:n===5?'Wartung':'verfügbar',mobility:'fest'})),
      {id:'RUP-H1',type:'HB',loc:'RUP',status:'verfügbar',mobility:'mobil'},{id:'RUP-H2',type:'HB',loc:'RUP',status:'verfügbar',mobility:'mobil',moves:[{kw:41,to:'BER'}]},
      {id:'MIETE-H1',type:'HB',loc:'GIU',status:'verfügbar',mobility:'miete',from:45,until:46,vendor:'Rent-a-Lift AG'},
      {id:'BER-S1',type:'STS',loc:'BER',status:'verfügbar'},{id:'BER-S2',type:'STS',loc:'BER',status:'verfügbar'},{id:'BER-S3',type:'STS',loc:'BER',status:'verfügbar'},{id:'BER-H1',type:'HB',loc:'BER',status:'verfügbar',mobility:'mobil'},{id:'BER-H2',type:'HB',loc:'BER',status:'verfügbar',mobility:'mobil'},
      ...[1,2,3,4].map(n=>({id:'RUM-S'+n,type:'STS',loc:'RUM',status:'verfügbar'})),
      ...[1,2,3].map(n=>({id:'MAR-S'+n,type:'STS',loc:'MAR',status:'verfügbar'})),
      {id:'GIU-S1',type:'STS',loc:'GIU',status:'verfügbar'},{id:'GIU-S2',type:'STS',loc:'GIU',status:'verfügbar'},{id:'GIU-H1',type:'HB',loc:'GIU',status:'verfügbar',mobility:'mobil'},
      ...[1,2,3].map(n=>({id:'ZOF-R'+n,type:'STR1',loc:'ZOF',status:'verfügbar'}))
    ];
    const curriculum={EFZ:[
      {code:'ÜK 1',name:'Grundlagen Lagerlogistik',sem:1,days:2,window:'Sep–Nov'},
      {code:'ÜK 2',name:'Wareneingang & Kontrolle',sem:1,days:2,window:'Nov–Jan'},
      {code:'ÜK 3',name:'Kommissionieren & Lagertechnik',sem:2,days:2,window:'Feb–Apr',prereq:'ÜK 1'},
      {code:'ÜK 4',name:'Verpackung & Warenausgang',sem:2,days:2,window:'Apr–Jun'},
      {code:'ÜK 5',name:'Flurförderzeuge Kat. S',sem:3,days:4,window:'Sep–Dez',prereq:'ÜK 1'},
      {code:'ÜK 6',name:'Lagerbewirtschaftung & IT',sem:3,days:2,window:'Nov–Jan'},
      {code:'ÜK 7',name:'Hebebühnen (IPAF)',sem:4,days:2,window:'Feb–Apr',prereq:'ÜK 5'},
      {code:'ÜK 8',name:'Transportwesen',sem:4,days:2,window:'Apr–Jun'},
      {code:'ÜK 9',name:'Gefahrgut & Arbeitssicherheit',sem:5,days:1,window:'Sep–Dez'},
      {code:'ÜK 10',name:'Materialwirtschaft',sem:5,days:2,window:'Nov–Jan'},
      {code:'ÜK 11',name:'Qualität & Prozesse',sem:6,days:2,window:'Feb–Apr'},
      {code:'ÜK 12',name:'Repetition & Kompetenznachweis',sem:6,days:2,window:'Apr–Jun',prereq:'ÜK 11'}],
      EBA:[{code:'ÜK 1 EBA',name:'Grundlagen Lager',sem:1,days:2,window:'Sep–Nov'},{code:'ÜK 2 EBA',name:'Lager & Kommissionieren',sem:2,days:2,window:'Feb–Apr'},{code:'ÜK 3 EBA',name:'Warenausgang & Transport',sem:3,days:2,window:'Sep–Dez'},{code:'ÜK 4 EBA',name:'Repetition & Kompetenznachweis',sem:4,days:2,window:'Feb–Apr',prereq:'ÜK 3 EBA'}]};
    const schools=[
      {name:'BBZ Aarau',imports:{'2026/27':{date:'12.9.2026',rows:34,newCount:34},'2025/26':{date:'11.9.2025',rows:28,newCount:28}},loc:'RUP',day:1,counts:{'2025 EFZ':28,'2026 EFZ':34,'2026 EBA':6}},
      {name:'BBZ Olten',imports:{'2026/27':{date:'15.9.2026',rows:22,newCount:22},'2025/26':{date:'14.9.2025',rows:16,newCount:16}},loc:'RUP',day:4,counts:{'2025 EFZ':16,'2026 EFZ':22,'2026 EBA':4}},
      {name:'GIBB Bern',imports:{'2026/27':{date:'16.9.2026',rows:24,newCount:24},'2025/26':{date:'12.9.2025',rows:19,newCount:19}},loc:'BER',day:3,counts:{'2025 EFZ':19,'2026 EFZ':24}},
      {name:'BZ Zürich',imports:{'2025/26':{date:'18.9.2025',rows:24,newCount:24}},loc:'RUM',day:2,counts:{'2025 EFZ':24,'2026 EFZ':30,'2026 EBA':5}},
      {name:'EPAC Fribourg',imports:{'2026/27':{date:'17.9.2026',rows:14,newCount:14},'2025/26':{date:'15.9.2025',rows:11,newCount:11}},loc:'MAR',day:5,counts:{'2025 EFZ':11,'2026 EFZ':14}},
      {name:'CPT Bellinzona',imports:{'2025/26':{date:'22.9.2025',rows:9,newCount:9}},loc:'GIU',day:2,counts:{'2025 EFZ':9,'2026 EFZ':11,'2026 EBA':4}}];
    const periods=[
      {id:'HS26',label:'Herbstsemester 2026',year:'2026/27',months:'Sep 2026 – Jan 2027',kwFrom:38,kwTo:52,sem:{'2025':3,'2026':1}},
      {id:'FS27',label:'Frühlingssemester 2027',year:'2026/27',months:'Feb – Jun 2027',kwFrom:58,kwTo:76,sem:{'2025':4,'2026':2}},
      {id:'HS27',label:'Herbstsemester 2027',year:'2027/28',months:'Sep 2027 – Jan 2028',kwFrom:90,kwTo:104,sem:{'2025':5,'2026':3}},
      {id:'FS28',label:'Frühlingssemester 2028',year:'2027/28',months:'Feb – Jun 2028',kwFrom:110,kwTo:128,sem:{'2025':6,'2026':4}}];
    const apprentices=[
      {id:'2025-EFZ-0412',name:'Albert Einstein',track:'EFZ',cohort:'2025',school:'BBZ Aarau',company:'Galliker Transport AG',lang:'D',done:['ÜK 1','ÜK 3'],cur:'ÜK 5',open:['ÜK 7','ÜK 9']},
      {id:'2025-EFZ-0418',name:'Marie Curie',track:'EFZ',cohort:'2025',school:'GIBB Bern',company:'Planzer Transport AG',lang:'D',done:['ÜK 1','ÜK 3'],cur:'ÜK 5',open:['ÜK 7','ÜK 9']},
      {id:'2025-EFZ-0533',name:'Ada Lovelace',track:'EFZ',cohort:'2025',school:'BZ Zürich',company:'Coop Logistik',lang:'D',done:['ÜK 1'],cur:null,open:['ÜK 5','ÜK 7','ÜK 9'],missed:'ÜK 3'},
      {id:'2026-EFZ-0021',name:'Alan Turing',track:'EFZ',cohort:'2026',school:'GIBB Bern',company:'Die Post CH AG',lang:'D',done:[],cur:'ÜK 1',open:['ÜK 3','ÜK 5','ÜK 7','ÜK 9']},
      {id:'2026-EFZ-0104',name:'Nikola Tesla',track:'EFZ',cohort:'2026',school:'BBZ Olten',company:'Migros Verteilbetrieb',lang:'D',done:[],cur:null,open:['ÜK 1','ÜK 3','ÜK 5','ÜK 7','ÜK 9']},
      {id:'2026-EFZ-0187',name:'Rosa Parks',track:'EFZ',cohort:'2026',school:'EPAC Fribourg',company:'Nestlé Suisse SA',lang:'F',done:[],cur:null,open:['ÜK 1','ÜK 3','ÜK 5','ÜK 7','ÜK 9']},
      {id:'2026-EBA-0009',name:'Frida Kahlo',track:'EBA',cohort:'2026',school:'CPT Bellinzona',company:'Camion Transport SA',lang:'I',done:[],cur:'ÜK 2 EBA',open:['ÜK 4 EBA']},
      {id:'2025-EFZ-0602',name:'Nelson Mandela',track:'EFZ',cohort:'2025',school:'BZ Zürich',company:'Digitec Galaxus AG',lang:'D',done:['ÜK 1','ÜK 3'],cur:null,open:['ÜK 5','ÜK 7','ÜK 9']},
      {id:'2026-EFZ-0233',name:'Leonardo da Vinci',track:'EFZ',cohort:'2026',school:'BBZ Aarau',company:'Rhenus Logistics',lang:'D',done:[],cur:null,open:['ÜK 1','ÜK 3','ÜK 5','ÜK 7','ÜK 9']},
      {id:'2026-EBA-0014',name:'Greta Thunberg',track:'EBA',cohort:'2026',school:'BBZ Olten',company:'Lidl Schweiz',lang:'D',done:[],cur:null,open:['ÜK 2 EBA','ÜK 4 EBA']}
    ];
    const history={
      '2025-EFZ-0412':[{code:'ÜK 1',date:'22.09.2025',loc:'Rupperswil',instr:'Roger Federer',status:'besucht'},{code:'ÜK 2',date:'01.12.2025',loc:'Rupperswil',instr:'Emil Steinberger',status:'besucht'},{code:'ÜK 3',date:'03.03.2026',loc:'Rupperswil',instr:'Belinda Bencic',status:'besucht'},{code:'ÜK 4',date:'12.05.2026',loc:'Rupperswil',instr:'Emil Steinberger',status:'besucht'},{code:'ÜK 5',date:'15.09.2026',loc:'Rupperswil',instr:'Roger Federer',status:'eingeteilt'}],
      '2025-EFZ-0418':[{code:'ÜK 1',date:'29.09.2025',loc:'Bern',instr:'Simone Niggli-Luder',status:'besucht'},{code:'ÜK 2',date:'08.12.2025',loc:'Bern',instr:'Simone Niggli-Luder',status:'besucht'},{code:'ÜK 3',date:'10.03.2026',loc:'Bern',instr:'Belinda Bencic',status:'besucht'},{code:'ÜK 4',date:'19.05.2026',loc:'Bern',instr:'Ursula Andress',status:'besucht'},{code:'ÜK 5',date:'15.09.2026',loc:'Rupperswil',instr:'Roger Federer',status:'eingeteilt'}],
      '2025-EFZ-0533':[{code:'ÜK 1',date:'22.09.2025',loc:'Rümlang',instr:'Belinda Bencic',status:'besucht'},{code:'ÜK 2',date:'01.12.2025',loc:'Rümlang',instr:'Martina Hingis',status:'besucht'},{code:'ÜK 3',date:'02.03.2026',loc:'Rümlang',instr:'Belinda Bencic',status:'nicht erschienen'},{code:'ÜK 4',date:'11.05.2026',loc:'Rümlang',instr:'Martina Hingis',status:'besucht'}],
      '2026-EFZ-0021':[{code:'ÜK 1',date:'16.09.2026',loc:'Bern',instr:'Simone Niggli-Luder',status:'eingeteilt'}],
      '2026-EBA-0009':[{code:'ÜK 1 EBA',date:'23.09.2026',loc:'Giubiasco',instr:'Lara Gut-Behrami',status:'eingeteilt'}],
      '2025-EFZ-0602':[{code:'ÜK 1',date:'22.09.2025',loc:'Rümlang',instr:'Belinda Bencic',status:'besucht'},{code:'ÜK 2',date:'01.12.2025',loc:'Rümlang',instr:'Martina Hingis',status:'besucht'},{code:'ÜK 3',date:'02.03.2026',loc:'Rümlang',instr:'Belinda Bencic',status:'besucht'},{code:'ÜK 4',date:'11.05.2026',loc:'Rümlang',instr:'Martina Hingis',status:'abgesagt'}]};
    const dups=[
      {id:'d1',score:'0.91',rule:'Name + Geburtsdatum gleich, ID abweichend',a:{name:'Albert Einstein',id:'2025-EFZ-0412',school:'BBZ Aarau'},b:{name:'A. Einstein',id:'2025-EFZ-412',school:'BBZ Olten'}},
      {id:'d2',score:'0.78',rule:'Name ähnlich, gleicher Lehrbetrieb',a:{name:'Marie Curie',id:'2025-EFZ-0418',school:'GIBB Bern'},b:{name:'Maria Curie',id:'2025-EFZ-0481',school:'GIBB Bern'}}
    ];
    const demand=[
      {cohort:'2025 EFZ',type:'UK05',region:'D',window:'Sep–Dez 2026',n:63},
      {cohort:'2025 EFZ',type:'UK07',region:'D',window:'Okt 2026–Jan 2027',n:63},
      {cohort:'2025 EFZ',type:'UK07',region:'I',window:'Okt 2026–Jan 2027',n:9},
      {cohort:'2025 EFZ',type:'UK09',region:'D',window:'Okt–Dez 2026',n:63},
      {cohort:'2026 EFZ',type:'UK01',region:'D',window:'Sep–Nov 2026',n:92},
      {cohort:'2026 EFZ',type:'UK01',region:'F',window:'Sep–Nov 2026',n:24},
      {cohort:'2026 EFZ',type:'UK03',region:'D',window:'Okt 2026–Jan 2027',n:92},
      {cohort:'2026 EBA',type:'EBA2',region:'I',window:'Okt–Nov 2026',n:9}
    ];
    const audit={c3:[{when:'02.09. 10:12',who:'M. Keller',what:'hat Bruno Ganz zugewiesen (Prüfung damals: machbar – IPAF-Zertifikat inzwischen abgelaufen).'}],c9:[{when:'28.08. 15:40',who:'M. Keller',what:'hat Xherdan Shaqiri zugewiesen.'},{when:'10.09. 09:03',who:'System',what:'Ferienantrag KW 41 genehmigt durch M. Keller – Konflikt mit diesem Kurs.'}]};
    return {locs,skills,certTypes,devTypes,instructors,types,courses,absences,devices,schools,apprentices,dups,demand,audit,curriculum,history,periods};
  }
  monday(kw){ return new Date(2026,8,14+(kw-38)*7); }
  addDays(d,n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }
  fmt(d){ return d.getDate()+'.'+(d.getMonth()+1)+'.'; }
  courseDays(c){ const t=this.D.types[c.type]; const m=this.monday(c.kw); const out=[]; for(let i=0;i<t.days;i++){ out.push(this.addDays(m, t.sat? 5+7*i : c.off+i)); } return out; }
  fmtY(d){ return d.getDate()+'.'+(d.getMonth()+1)+'.'+d.getFullYear(); }
  dayRange(c){ const ds=this.courseDays(c); const t=this.D.types[c.type]; const last=ds[ds.length-1]; if(t.sat) return 'Sa '+this.fmt(ds[0])+'–'+this.fmtY(last); const wd=['So','Mo','Di','Mi','Do','Fr','Sa']; return ds.length===1? wd[ds[0].getDay()]+' '+this.fmtY(ds[0]) : wd[ds[0].getDay()]+'–'+wd[last.getDay()]+' '+this.fmt(ds[0])+'–'+this.fmtY(last); }
  kwOfDate(d){ return 38+Math.floor((d-this.monday(38))/(7*864e5)); }
  loc(id){ return this.D.locs.find(l=>l.id===id); }
  instr(id){ return (this.state&&this.state.instrData?this.state.instrData:this.D.instructors).find(i=>i.id===id); }
  initials(n){ return n.split(/[\s-]+/).map(s=>s[0]).slice(0,2).join(''); }
  fmtIso(s){ const [y,m,d]=s.split('-'); return +d+'.'+(+m)+'.'+y; }
  certStatus(cert){ const today=new Date(2026,8,17); const until=new Date(cert.until); const days=(until-today)/864e5; if(days<0) return 'bad'; if(days<this.state.warnDays) return 'warn'; return 'ok'; }
  col(s){ return s==='ok'?'var(--ok)':s==='warn'?'var(--warn)':'var(--bad)'; }
  statusColor(c){ if(this.hasConflict(c)) return 'var(--bad)'; if(!c.instr) return 'var(--warn)'; if(c.status==='geplant') return 'var(--accent)'; return 'var(--ok)'; }
  statusLabel(c){ if(this.hasConflict(c)) return 'Konflikt'; if(!c.instr) return 'offen'; return c.status; }
  hasConflict(c){ if(!c.instr) return false; return !this.check(c,this.instr(c.instr)).ok; }
  check(c,ins,coursesOverride){
    const t=this.D.types[c.type]; const days=this.courseDays(c); const courses=coursesOverride||this.state.courses;
    const hard=[]; const soft=[]; let score=50; const L={D:'Deutsch',F:'Französisch',I:'Italienisch'};
    const missing=t.skills.filter(s=>!ins.skills.includes(s));
    hard.push({label:'Skills',ok:missing.length===0,reason:missing.length? 'fehlt: '+missing.join(', ') : t.skills.join(', ')});
    const needCerts=[...new Set([...t.certs,...t.devs.map(d=>this.D.devTypes[d.t].cert)])];
    const last=days[days.length-1];
    needCerts.forEach(ct=>{ const cert=ins.certs.find(x=>x.t===ct); const name=this.D.certTypes[ct].name; if(!cert){ hard.push({label:'Zertifikat',ok:false,reason:name+' nicht vorhanden'}); return; } const until=new Date(cert.until); if(until<last){ const firstBad=days.find(d=>d>until); hard.push({label:'Zertifikat',ok:false,reason:name+(until<new Date(2026,8,17)?' abgelaufen am ':' läuft ab am ')+this.fmtIso(cert.until)+' – Kurstag '+this.fmt(firstBad)+' nicht gedeckt'}); } else { const rest=(until-last)/864e5; hard.push({label:'Zertifikat',ok:true,reason:name+' gültig bis '+this.fmtIso(cert.until)+(rest<this.state.warnDays?' (läuft bald ab)':'')}); } });
    if(t.devs.length) hard.push({label:'Gerätequalifikation',ok:needCerts.every(ct=>{const cert=ins.certs.find(x=>x.t===ct); return cert && new Date(cert.until)>=last;}),reason:t.devs.map(d=>this.D.devTypes[d.t].name).join(', ')});
    hard.push({label:'Sprache',ok:ins.langs.includes(c.lang),reason:ins.langs.includes(c.lang)? 'spricht '+L[c.lang] : 'spricht kein '+L[c.lang]+' ('+ins.langs.join('/')+')'});
    const kws=[...new Set(days.map(d=>this.kwOfDate(d)))];
    const clash=courses.filter(o=>o.id!==c.id&&o.instr===ins.id&&o.status!=='abgesagt').find(o=>{ const od=this.courseDays(o).map(d=>+d); return days.some(d=>od.includes(+d)); });
    const abs=this.state.absences.find(a=>a.instr===ins.id&&kws.includes(a.kw)&&a.status!=='abgelehnt');
    if(clash){ hard.push({label:'Verfügbarkeit',ok:false,reason:'bereits eingesetzt: '+this.D.types[clash.type].code+' '+this.loc(clash.loc).name+' KW '+this.kwLabel(clash.kw)}); }
    else if(abs&&abs.status!=='beantragt'){ hard.push({label:'Verfügbarkeit',ok:false,reason:abs.kind+' KW '+abs.kw+' ('+abs.status+')'}); }
    else { hard.push({label:'Verfügbarkeit',ok:true,reason:abs? 'frei – offener Ferienantrag KW '+abs.kw : 'frei an allen Kurstagen'}); if(abs){ score-=15; soft.push({text:'Offener Ferienantrag KW '+abs.kw+' (−15)',color:'var(--warn)'}); } }
    const il=this.loc(ins.loc); const cl=this.loc(c.loc);
    if(ins.loc===c.loc){ score+=30; soft.push({text:'Heimstandort '+cl.name+' (+30)',color:'var(--ok)'}); } else if(il.region===cl.region){ score+=12; soft.push({text:'Gleiche Sprachregion, Reise '+il.name+' → '+cl.name+' (+12)',color:'var(--ok)'}); } else { score-=10; soft.push({text:'Andere Region, lange Reise '+il.name+' → '+cl.name+' (−10)',color:'var(--warn)'}); }
    if(ins.pref&&ins.pref.includes(cl.name)){ score+=8; soft.push({text:'Bevorzugter Standort laut Präferenzen (+8)',color:'var(--ok)'}); }
    if(c.cohort&&courses.some(o=>o.id!==c.id&&o.instr===ins.id&&o.cohort===c.cohort)){ score+=10; soft.push({text:'Kontinuität: kennt Jahrgang '+c.cohort+' (+10)',color:'var(--ok)'}); }
    const mt=this.maintenance(ins).find(m=>m.types.includes(c.type)); if(mt&&mt.open>0){ score+=10; soft.push({text:'Qualifikationspflege: braucht noch '+mt.open+' Kurs'+(mt.open>1?'e':'')+' dieses Typs in 2026 (+10)',color:'var(--ok)'}); }
    if(ins.emp==='Angestellt'){ score+=5; soft.push({text:'Festangestellt, keine Zusatzkosten (+5)',color:'var(--ok)'}); } else { soft.push({text:'Freelancer, Honorar fällt an (±0)',color:'var(--muted)'}); }
    return {ok:hard.every(h=>h.ok),hard,soft,score:Math.max(0,Math.min(100,score))};
  }
  blocksOf(c){ if(c.blocks) return c.blocks; const t=this.D.types[c.type]; return [{time:t.kind==='Prüfung'?'08:00–12:00':'08:00–16:30',label:t.kind==='Prüfung'?'Prüfung':'Kurstag',room:c.room||'Raum n. n.'}]; }
  maintenance(ins){ return ins.certs.map(c=>this.D.certTypes[c.t]).filter(ct=>ct.maint).map(ct=>{ const m=ct.maint; const hist=m.types.reduce((s,t)=>s+((ins.taught||{})[t]||0),0); const planned=this.state.courses.filter(c=>c.instr===ins.id&&m.types.includes(c.type)).length; const count=hist+planned; const open=Math.max(0,m.min-count); return {cert:ct.name,label:m.label,min:m.min,hist,planned,count,open,ok:open===0,pct:Math.min(100,Math.round(100*count/m.min)),types:m.types}; }); }
  candidates(c){ return this.state.instrData.map(i=>({i,r:this.check(c,i)})).sort((a,b)=>(b.r.ok-a.r.ok)||(b.r.score-a.r.score)); }
  deviceAt(dev,kw){ if(dev.from&&kw<dev.from) return null; if(dev.until&&kw>dev.until) return null; let loc=dev.loc; (dev.moves||[]).filter(m=>m.kw<=kw).sort((a,b)=>a.kw-b.kw).forEach(m=>loc=m.to); return loc; }
  deviceCheck(c){ const t=this.D.types[c.type]; const days=this.courseDays(c).map(d=>+d); return t.devs.map(d=>{ const here=this.state.devices.filter(x=>x.type===d.t&&this.deviceAt(x,c.kw)===c.loc); const maint=here.filter(x=>x.status!=='verfügbar').length; const reservedBy=this.state.courses.filter(o=>o.id!==c.id&&o.loc===c.loc&&this.D.types[o.type].devs.some(x=>x.t===d.t)&&this.courseDays(o).some(x=>days.includes(+x))); const reserved=reservedBy.reduce((s,o)=>s+this.D.types[o.type].devs.find(x=>x.t===d.t).n,0); const free=here.length-maint-reserved; return {n:d.n,type:this.D.devTypes[d.t].name,free,total:here.length,maint,reserved,ok:free>=d.n}; }); }
  done(msg){ this.setState({doneTasks:[msg,...this.state.doneTasks]}); this.toast(msg); }
  followUp(a,module){ const sch=this.D.schools.find(s=>s.name===a.school); const home=sch?this.loc(sch.loc):null; return this.state.courses.filter(c=>this.D.types[c.type].code===module&&c.kw>=38&&c.enrolled<this.D.types[c.type].max&&c.lang===a.lang).sort((x,y)=>((home&&x.loc===home.id)?0:1)-((home&&y.loc===home.id)?0:1)||x.kw-y.kw)[0]||null; }
  kwLabel(kw){ return ((kw-1)%52)+1; }
  WDN(d){ return ['','Mo','Di','Mi','Do','Fr'][d]||''; }
  genDemand(periodId){
    const D=this.D, p=D.periods.find(x=>x.id===periodId), rows=[];
    const cohorts=[{key:'2025 EFZ',year:'2025',track:'EFZ'},{key:'2026 EFZ',year:'2026',track:'EFZ'},{key:'2026 EBA',year:'2026',track:'EBA'}];
    cohorts.forEach(co=>{
      const sem=p.sem[co.year]; if(!sem) return;
      (D.curriculum[co.track]||[]).filter(m=>m.sem===sem).forEach(m=>{
        const typeKey=Object.keys(D.types).find(k=>D.types[k].code===m.code);
        const max=typeKey?D.types[typeKey].max:12;
        const groups={};
        D.schools.filter(s=>s.counts&&s.counts[co.key]).forEach(s=>{ const k=s.loc+'|'+s.day; groups[k]=groups[k]||{loc:s.loc,day:s.day,schools:[],n:0}; groups[k].schools.push(s.name); groups[k].n+=s.counts[co.key]; });
        Object.values(groups).forEach(g=>rows.push({id:co.key+'-'+m.code+'-'+g.loc+'-'+g.day,cohort:co.key,track:co.track,code:m.code,name:m.name,typeKey,days:m.days,window:m.window,sem,loc:g.loc,day:g.day,schools:g.schools,n:g.n,max,need:Math.ceil(g.n/max)}));
      });
    });
    return rows;
  }
  proposeCourses(demand,periodId){
    const D=this.D, p=D.periods.find(x=>x.id===periodId), out=[];
    const startKw=(p.kwFrom<=38&&p.kwTo>=38)?Math.max(p.kwFrom,39):p.kwFrom;
    const weeksAll=[]; for(let kw=startKw;kw<=p.kwTo;kw++) weeksAll.push(kw);
    const loadWeek={}, roomUse={}, devUse={}, pending=[];
    this.state.courses.forEach(c=>{ const k=c.loc+'|'+c.kw; loadWeek[k]=(loadWeek[k]||0)+1; if(c.room) roomUse[c.loc+'|'+c.kw+'|'+c.room]=true; (D.types[c.type].devs||[]).forEach(d=>{ const dk=c.loc+'|'+c.kw+'|'+d.t; devUse[dk]=(devUse[dk]||0)+d.n; }); });
    const devStock=(loc,t)=>this.state.devices.filter(x=>x.type===t&&x.status==='verfügbar'&&this.deviceAt(x,39)===loc).length;
    demand.forEach(d=>{
      for(let i=0;i<d.need;i++){
        const l=this.loc(d.loc); const type=d.typeKey?D.types[d.typeKey]:null;
        const needsPraxis=!!(type&&type.devs.length);
        const rooms=l.rooms.filter(r=>needsPraxis?r.kind==='Praxishalle':r.kind==='Theorieraum');
        // Wochentage ohne Schultag: zusammenhängend, sonst nicht planbar
        let off=null; for(let o=0;o+d.days<=5;o++){ const days=[]; for(let k=0;k<d.days;k++) days.push(o+k+1); if(!days.includes(d.day)){ off=o; break; } }
        let chosen=null, blocked=null;
        if(off===null){ blocked='Schultag '+this.WDN(d.day)+' lässt keinen zusammenhängenden Block von '+d.days+' Tagen zu – Kurs muss geteilt oder die Gruppe aufgeteilt werden'; }
        else if(!rooms.length){ blocked='Kein passender Raum am Standort ('+(needsPraxis?'Praxishalle':'Theorieraum')+')'; }
        else {
          for(const kw of weeksAll){
            if((loadWeek[d.loc+'|'+kw]||0)>=l.cap) continue;
            const room=rooms.find(r=>!roomUse[d.loc+'|'+kw+'|'+r.name]); if(!room) continue;
            if(type&&type.devs.some(x=>(devUse[d.loc+'|'+kw+'|'+x.t]||0)+x.n>devStock(d.loc,x.t))) continue;
            chosen={kw,room:room.name,off};
            loadWeek[d.loc+'|'+kw]=(loadWeek[d.loc+'|'+kw]||0)+1; roomUse[d.loc+'|'+kw+'|'+room.name]=true;
            if(type) type.devs.forEach(x=>{ const dk=d.loc+'|'+kw+'|'+x.t; devUse[dk]=(devUse[dk]||0)+x.n; });
            break;
          }
          if(!chosen) blocked='Keine Woche im Zeitfenster frei – Kapazität, Raum oder Geräte fehlen';
        }
        const seats=Math.min(d.max,d.n-i*d.max);
        const c={id:'p'+d.id+'-'+i,demandId:d.id,type:d.typeKey,code:d.code,name:d.name,loc:d.loc,kw:chosen?chosen.kw:null,off:chosen?chosen.off:0,room:chosen?chosen.room:null,days:d.days,lang:l.region,cohort:d.cohort,seats,day:d.day,schools:d.schools,noType:!d.typeKey,blocked};
        if(c.type&&c.kw){
          const ledger=[...this.state.courses,...pending.map(x=>({id:x.id,type:x.type,loc:x.loc,kw:x.kw,off:x.off,status:'geplant',instr:x.cand?x.cand.id:null,cohort:x.cohort}))];
          const cands=this.state.instrData.map(ins=>({i:ins,r:this.check({...c,instr:null},ins,ledger)})).filter(x=>x.r.ok).sort((a,b)=>b.r.score-a.r.score);
          c.cand=cands[0]?{id:cands[0].i.id,name:cands[0].i.name,score:cands[0].r.score,why:cands[0].r.soft.filter(s=>s.color==='var(--ok)').slice(0,2).map(s=>s.text.replace(/\s\(.*\)/,'')).join(' · ')}:null;
          c.candCount=cands.length;
          pending.push(c);
        }
        out.push(c);
      }
    });
    return out;
  }

  bestCand(c,pending){
    const ledger=[...this.state.courses,...(pending||[]).filter(x=>x.kw&&x.cand&&x.id!==c.id).map(x=>({id:x.id,type:x.type,loc:x.loc,kw:x.kw,off:x.off,status:'geplant',instr:x.cand.id,cohort:x.cohort}))];
    const cands=this.state.instrData.map(i=>({i,r:this.check({...c,instr:null},i,ledger)})).filter(x=>x.r.ok).sort((a,b)=>b.r.score-a.r.score);
    return {best:cands[0],count:cands.length};
  }
  freeSlot(c,loc,fromKw,toKw,opt){
    const ignoreDev=!!(opt&&opt.ignoreDevices);
    const D=this.D, l=this.loc(loc), type=c.type?D.types[c.type]:null, needsPraxis=!!(type&&type.devs.length);
    const rooms=l.rooms.filter(r=>needsPraxis?r.kind==='Praxishalle':r.kind==='Theorieraum');
    let off=null; for(let o=0;o+c.days<=5;o++){ const days=[]; for(let k=0;k<c.days;k++) days.push(o+k+1); if(!days.includes(c.day)){ off=o; break; } }
    if(off===null||!rooms.length) return null;
    for(let kw=fromKw;kw<=toKw;kw++){
      const load=this.state.courses.filter(x=>x.loc===loc&&x.kw===kw).length;
      if(load>=l.cap) continue;
      const room=rooms.find(r=>!this.state.courses.some(x=>x.loc===loc&&x.kw===kw&&x.room===r.name));
      if(!room) continue;
      if(!ignoreDev&&type&&type.devs.some(d=>{ const stock=this.state.devices.filter(v=>v.type===d.t&&v.status==='verfügbar'&&this.deviceAt(v,kw)===loc).length; const used=this.state.courses.filter(x=>x.loc===loc&&x.kw===kw).reduce((s,x)=>s+((D.types[x.type].devs.find(y=>y.t===d.t)||{n:0}).n),0); return used+d.n>stock; })) continue;
      return {kw,off,room:room.name};
    }
    return null;
  }
  fixOptions(c,pending){
    const D=this.D, L={D:'Deutsch',F:'Französisch',I:'Italienisch'}, out=[];
    const per=D.periods.find(p=>p.id===(this.state.runs.find(r=>r.id===this.state.activeRun)||{}).period)||D.periods[0];
    if(!c.kw||c.blocked){
      // a) anderer Standort
      D.locs.filter(l=>l.id!==c.loc&&l.uk).forEach(l=>{ const slot=this.freeSlot(c,l.id,per.kwFrom,per.kwTo); if(slot&&out.length<6) out.push({title:'Standort wechseln: '+l.name,why:'In '+this.loc(c.loc).name+' ist im ganzen Zeitfenster keine Woche mit freiem Raum und Gerät verfügbar.',effect:['Kurs läuft in '+l.name+', KW '+this.kwLabel(slot.kw),'Raum '+slot.room,'Reisezeit für die Gruppe steigt'],patch:{loc:l.id,kw:slot.kw,off:slot.off,room:slot.room,blocked:null,lang:l.region}}); });
      // b) Fenster überschreiten
      const ext=this.freeSlot(c,c.loc,per.kwTo+1,per.kwTo+8); if(ext) out.push({title:'Zeitfenster um '+(ext.kw-per.kwTo)+' Wochen überschreiten',why:'Innerhalb des Semesterfensters ist am Standort nichts frei.',effect:['Kurs läuft in KW '+this.kwLabel(ext.kw)+', Raum '+ext.room,'Modul liegt ausserhalb des vorgesehenen Semesters','Braucht Freigabe der Bildungsverantwortlichen'],patch:{kw:ext.kw,off:ext.off,room:ext.room,blocked:null}});
      // c) Kurs teilen
      if(c.days>2){ const a=Math.ceil(c.days/2), b=c.days-a;
        const sa=this.freeSlot({...c,days:a},c.loc,per.kwFrom,per.kwTo);
        const sb=sa?this.freeSlot({...c,days:b},c.loc,sa.kw+1,per.kwTo):null;
        if(sa&&sb) out.push({title:'Kurs teilen: '+a+' + '+b+' Tage über zwei Wochen',why:'Der Schultag '+this.WDN(c.day)+' lässt keinen zusammenhängenden Block von '+c.days+' Tagen zu.',effect:['Teil 1: KW '+this.kwLabel(sa.kw)+', '+sa.room+', '+a+' Tage','Teil 2: KW '+this.kwLabel(sb.kw)+', '+sb.room+', '+b+' Tage','Gleiche Gruppe, Schultag bleibt in beiden Wochen frei'],split:{a,b,sa,sb}}); }
      // d) Mietgerät
      const type=c.type?D.types[c.type]:null;
      if(type&&type.devs.length){ const withRent=this.freeSlot(c,c.loc,per.kwFrom,per.kwTo,{ignoreDevices:true});
        if(withRent) out.push({title:'Mietgerät für '+this.loc(c.loc).name+' beschaffen',why:'Woche und Raum wären frei – nur die Geräte sind in jeder Woche belegt oder in Wartung.',effect:[type.devs.map(d=>d.n+' × '+D.devTypes[d.t].name).join(', ')+' für KW '+this.kwLabel(withRent.kw)+' zumieten','Kurs läuft in '+withRent.room+', Schultag '+this.WDN(c.day)+' bleibt frei','Zusatzkosten beim Anbieter'],patch:{rentDevice:true,blocked:null,kw:withRent.kw,off:withRent.off,room:withRent.room}}); }
      if(c.noType) out.unshift({title:'Kurstyp im Katalog ergänzen',why:'Für das Modul '+c.code+' existiert kein Kurstyp mit Skills, Zertifikaten und Geräten.',effect:['Kurstyp '+c.code+' anlegen','Anforderungen aus dem Bildungsplan übernehmen','Danach ist das Modul planbar'],patch:null});
    } else {
      // Stufe 3: kein machbarer Ausbilder
      ['D','F','I'].filter(x=>x!==c.lang).forEach(lg=>{ const r=this.bestCand({...c,lang:lg},pending); if(r.best&&out.length<6) out.push({title:'Kurssprache auf '+L[lg]+' wechseln',why:'Kein Ausbilder mit '+L[c.lang]+' ist an diesen Tagen verfügbar und qualifiziert.',effect:[r.best.i.name+' übernimmt (Score '+r.best.r.score+')','Kurs wird auf '+L[lg]+' geführt','Nur sinnvoll, wenn die Gruppe die Sprache versteht'],patch:{lang:lg,cand:{id:r.best.i.id,name:r.best.i.name,score:r.best.r.score,why:'Sprachwechsel'}}}); });
      D.locs.filter(l=>l.id!==c.loc&&l.uk).forEach(l=>{ const slot=this.freeSlot(c,l.id,per.kwFrom,per.kwTo); if(!slot||out.length>=6) return; const r=this.bestCand({...c,loc:l.id,kw:slot.kw,off:slot.off},pending); if(r.best) out.push({title:'Standort wechseln: '+l.name,why:'Am bisherigen Standort ist niemand qualifiziert und frei.',effect:[r.best.i.name+' übernimmt (Score '+r.best.r.score+')','KW '+this.kwLabel(slot.kw)+', Raum '+slot.room,'Reisezeit für die Gruppe steigt'],patch:{loc:l.id,kw:slot.kw,off:slot.off,room:slot.room,cand:{id:r.best.i.id,name:r.best.i.name,score:r.best.r.score,why:'Standortwechsel'}}}); });
      const alt=this.freeSlot(c,c.loc,per.kwFrom,per.kwTo); 
      for(let kw=per.kwFrom;kw<=per.kwTo&&out.length<6;kw++){ if(kw===c.kw) continue; const slot=this.freeSlot(c,c.loc,kw,kw); if(!slot) continue; const r=this.bestCand({...c,kw:slot.kw,off:slot.off},pending); if(r.best){ out.push({title:'Woche verschieben: KW '+this.kwLabel(slot.kw),why:'In KW '+this.kwLabel(c.kw)+' ist kein qualifizierter Ausbilder frei.',effect:[r.best.i.name+' übernimmt (Score '+r.best.r.score+')','Raum '+slot.room+' am selben Standort','Modul bleibt im Zeitfenster'],patch:{kw:slot.kw,off:slot.off,room:slot.room,cand:{id:r.best.i.id,name:r.best.i.name,score:r.best.r.score,why:'Terminverschiebung'}}}); break; } }
      const type=c.type?D.types[c.type]:null;
      if(type){ const needCerts=[...new Set([...type.certs,...type.devs.map(d=>D.devTypes[d.t].cert)])];
        this.state.instrData.filter(i=>type.skills.every(s=>i.skills.includes(s))&&i.langs.includes(c.lang)).forEach(i=>{ const expired=needCerts.filter(ct=>{ const cert=i.certs.find(x=>x.t===ct); return !cert||this.certStatus(cert)==='bad'; }); if(expired.length&&out.length<6) out.push({title:'Zertifikat auffrischen: '+i.name,why:i.name+' hat alle Skills und die Sprache, aber '+expired.map(ct=>D.certTypes[ct].name).join(', ')+' ist abgelaufen.',effect:['Auffrischung vor KW '+this.kwLabel(c.kw)+' terminieren','Danach ist der Kurs regelkonform besetzbar','Kein Standort- oder Sprachwechsel nötig'],patch:null}); });
      }
    }
    if(!out.length) out.push({title:'Kein automatischer Ausweg',why:'Weder Standort, Woche, Sprache noch Geräte lösen den Konflikt im Rahmen der harten Regeln.',effect:['Bedarf reduzieren oder Gruppe aufteilen','Externen Ausbilder beauftragen','Modul ins nächste Semester schieben'],patch:null});
    return out;
  }
  autoResolve(courses,absences,noShows,apprentices,entries){
    // 1) Einsätze umbesetzen, die durch Absenzen unmöglich wurden
    let cs=courses.slice();
    cs.forEach((c,idx)=>{ if(!c.instr) return; const ins=this.instr(c.instr); const save=this.state.absences; this.state.absences=absences;
      const bad=!this.check(c,ins,cs).ok;
      if(bad){ const alt=this.state.instrData.map(i=>({i,r:this.check({...c,instr:null},i,cs)})).filter(x=>x.r.ok&&x.i.id!==c.instr).sort((a,b)=>b.r.score-a.r.score)[0];
        if(alt){ cs[idx]={...c,instr:alt.i.id}; entries.push({kind:'Umbesetzt',text:this.D.types[c.type].code+' '+this.loc(c.loc).name+' KW '+this.kwLabel(c.kw)+': '+alt.i.name+' statt '+ins.name,why:'Score '+alt.r.score+' · '+alt.r.soft.filter(s=>s.color==='var(--ok)').slice(0,2).map(s=>s.text.replace(/\s\(.*\)/,'')).join(' · '),color:'var(--ok)'}); }
        else entries.push({kind:'Entscheidung nötig',text:this.D.types[c.type].code+' '+this.loc(c.loc).name+' KW '+this.kwLabel(c.kw)+' ist unbesetzt',why:'Kein Ausbilder erfüllt die harten Regeln – Kurs verschieben, Sprache ändern oder Zertifikat auffrischen',color:'var(--bad)',courseId:c.id}); }
      this.state.absences=save; });
    // 2) Nichterscheinen: Folgetermin automatisch belegen
    const rest=[];
    noShows.forEach(n=>{ const a=apprentices.find(x=>x.id===n.appr); if(!a){ return; }
      const f=cs.filter(c=>this.D.types[c.type].code===n.module&&c.enrolled<this.D.types[c.type].max&&c.lang===a.lang).sort((x,y)=>x.kw-y.kw)[0];
      if(f){ cs=cs.map(c=>c.id===f.id?{...c,enrolled:c.enrolled+1}:c); entries.push({kind:'Folgetermin',text:a.name+' → '+n.module+' in '+this.loc(f.loc).name+', KW '+this.kwLabel(f.kw),why:'Nächster Kurs mit freiem Platz in der Sprache des Lernenden',color:'var(--ok)'}); }
      else { rest.push(n); entries.push({kind:'Entscheidung nötig',text:a.name+' braucht '+n.module+', kein Kurs mit freiem Platz',why:'Zusätzliche Durchführung nötig',color:'var(--bad)',module:n.module,appr:a.id}); }
    });
    return {courses:cs,noShows:rest};
  }
  go(screen){ this.setState({screen,instrId:null,selCourse:null,locId:null,apprId:null}); }
  toast(msg){ this.setState({toast:msg}); clearTimeout(this._t); this._t=setTimeout(()=>this.setState({toast:''}),2600); }
  addAudit(cid,what){ const a={...this.state.audit}; a[cid]=[...(a[cid]||[]),{when:'18.9. '+new Date().toTimeString().slice(0,5),who:this.state.userName,what}]; return a; }
  assign(cid,iid){ const courses=this.state.courses.map(c=>c.id===cid?{...c,instr:iid,status:c.status==='offen'?'geplant':c.status}:c); this.setState({courses,audit:this.addAudit(cid,'hat '+this.instr(iid).name+' zugewiesen (Engine: machbar).')}); this.toast(this.instr(iid).name+' zugewiesen'); }
  moveCourse(cid,kw,loc){ const c=this.state.courses.find(x=>x.id===cid); if(!c||(c.kw===kw&&c.loc===loc)) return; const courses=this.state.courses.map(x=>x.id===cid?{...x,kw,loc}:x); const nc=courses.find(x=>x.id===cid); let msg='Kurs nach KW '+this.kwLabel(kw)+' · '+this.loc(loc).name+' verschoben'; if(nc.instr){ const r=this.check(nc,this.instr(nc.instr),courses); if(!r.ok) msg+=' – Konflikt: '+r.hard.find(h=>!h.ok).reason; } this.setState({courses,audit:this.addAudit(cid,'hat den Kurs von KW '+this.kwLabel(c.kw)+' '+this.loc(c.loc).name+' nach KW '+this.kwLabel(kw)+' '+this.loc(loc).name+' verschoben.'),dragId:null}); this.toast(msg); }
  ask(q){ this.setState({messages:[...this.state.messages,{who:'me',text:q,card:null}],draft:'',thinking:true,assistantOpen:true}); setTimeout(()=>{ const a=this.answer(q); this.setState({messages:[...this.state.messages,{who:'bot',...a}],thinking:false}); },600); }
  answer(q){
    const S=this.state, D=this.D, T=D.types, s=q.toLowerCase();
    const norm=x=>x.toLowerCase().replace(/[^a-zäöüéèà ]/g,'');
    const typeKey=Object.keys(T).find(k=>s.includes(T[k].code.toLowerCase()));
    const locHit=D.locs.find(l=>s.includes(l.name.toLowerCase()));
    const kwHit=(s.match(/kw\s?(\d{1,2})/)||[])[1];
    const insHit=S.instrData.find(i=>norm(s).includes(norm(i.name.split(' ').pop().split('-')[0])));
    const apprHit=S.apprentices.find(a=>{ const ln=norm(a.name.split(' ').pop()); return ln.length>3&&norm(s).includes(ln); });
    const openInstr=i=>({label:'Profil öffnen',run:()=>this.setState({screen:'instructors',instrId:i.id,instrTab:'skills',assistantOpen:true})});
    const openCourse=c=>({label:'Kurs öffnen',run:()=>this.setState({selCourse:c.id})});
    const fmtCourse=c=>T[c.type].code+' · '+this.loc(c.loc).name+' · KW '+this.kwLabel(c.kw);

    // 1) Kontakt
    if(insHit&&/kontakt|erreich|telefon|nummer|mail|anrufen/.test(s)){
      const m=this.maintenance(insHit);
      return {text:insHit.name+' erreichen Sie so:',card:{title:insHit.name,subtitle:insHit.emp+' · Heimstandort '+this.loc(insHit.loc).name+' · Sprachen '+insHit.langs.join('/'),
        rows:[{label:'E-Mail',value:insHit.email},{label:'Telefon',value:insHit.phone},{label:'Max. Reise',value:insHit.maxTravel},{label:'Bevorzugt',value:insHit.pref||'–'},
          {label:'Einsätze KW 38–45',value:String(S.courses.filter(c=>c.instr===insHit.id).length)},...(m.length?[{label:'Qualifikationspflege',value:m.map(x=>x.count+'/'+x.min+' '+x.cert).join(' · '),color:m.some(x=>!x.ok)?'var(--warn)':'var(--ok)'}]:[])],
        chips:insHit.skills,actions:[openInstr(insHit)]}};
    }
    // 2) Ersatz für einen Ausbilder
    if(insHit&&/ersatz|ersetzen|vertret|ausfall|krank|springt/.test(s)){
      const t0=new Date(2026,8,18);
      const mine=S.courses.filter(c=>c.instr===insHit.id&&this.courseDays(c)[this.courseDays(c).length-1]>=t0&&(!kwHit||this.kwLabel(c.kw)===+kwHit)&&(!locHit||c.loc===locHit.id)).sort((a,b)=>a.kw-b.kw);
      if(!mine.length) return {text:insHit.name+' hat '+(kwHit?'in KW '+kwHit:'künftig')+(locHit?' in '+locHit.name:'')+' keinen Einsatz – es ist kein Ersatz nötig.',card:null};
      const c=mine[0]; const cands=this.candidates({...c,instr:null}).filter(x=>x.r.ok&&x.i.id!==insHit.id);
      return {text:'Ersatz für '+insHit.name+' bei '+fmtCourse(c)+' ('+this.dayRange(c)+'):'+(mine.length>1?' Weitere Einsätze in KW '+mine.slice(1).map(x=>this.kwLabel(x.kw)).join(', ')+'.':''),
        card:{title:cands.length+' machbare Ausbilder',subtitle:T[c.type].name+' · '+c.enrolled+'/'+T[c.type].max+' Teilnehmende',
          list:cands.slice(0,4).map(x=>({title:x.i.name,sub:x.i.emp+' · '+this.loc(x.i.loc).name+' · '+x.r.soft.filter(y=>y.color==='var(--ok)').slice(0,2).map(y=>y.text.replace(/\s\(.*\)/,'')).join(' · '),meta:'Score '+x.r.score,metaColor:'var(--ok)',action:{label:'Zuweisen',run:()=>this.assign(c.id,x.i.id)}})),
          empty:cands.length?null:'Kein Ausbilder erfüllt Skills, Zertifikate, Sprache und Verfügbarkeit an diesen Tagen.',actions:[openCourse(c)]}};
    }
    // 3) Alternativtermin für Lernende
    if(apprHit&&(typeKey||/nachhol|alternativ|wann|termin/.test(s))){
      const mod=typeKey?T[typeKey].code:(apprHit.missed||apprHit.cur||'ÜK 1');
      const today=new Date(2026,8,18); const home=(D.schools.find(x=>x.name===apprHit.school)||{}).loc;
      const list=S.courses.filter(c=>T[c.type].code===mod&&c.lang===apprHit.lang&&this.courseDays(c)[0]>today).sort((a,b)=>a.kw-b.kw);
      const free=list.filter(c=>c.enrolled<T[c.type].max).length;
      return {text:free?apprHit.name+' kann '+mod+' an diesen Terminen nachholen:':'Kein künftiger '+mod+' mit freiem Platz für '+apprHit.name+' – eine zusätzliche Durchführung ist nötig.',
        card:{title:mod+' · '+(free===1?'1 Termin mit Platz':free+' Termine mit Platz')+(list.length>free?' ('+list.length+' insgesamt)':''),subtitle:apprHit.track+' '+apprHit.cohort+' · '+apprHit.school+' · Sprache '+apprHit.lang,
          list:list.slice(0,4).map(c=>({title:this.loc(c.loc).name+' · KW '+this.kwLabel(c.kw),sub:this.dayRange(c)+' · '+(c.instr?this.instr(c.instr).name:'Ausbilder offen')+(c.loc===home?' · Standort nächst der Berufsschule':''),meta:c.enrolled+'/'+T[c.type].max,metaColor:c.enrolled<T[c.type].max?'var(--ok)':'var(--bad)',action:c.enrolled<T[c.type].max?{label:'Einschreiben',run:()=>{ this.setState({courses:S.courses.map(y=>y.id===c.id?{...y,enrolled:y.enrolled+1}:y),apprentices:S.apprentices.map(x=>x.id===apprHit.id?{...x,cur:mod,missed:null}:x),autoLog:[{kind:'Folgetermin',text:apprHit.name+' → '+mod+' in '+this.loc(c.loc).name+', KW '+this.kwLabel(c.kw),why:'Über den Assistenten eingeschrieben',color:'var(--ok)'},...S.autoLog]}); this.toast('Eingeschrieben'); }}:null})),
          empty:list.length?(free?null:'Alle gelisteten Termine sind ausgebucht – zusätzliche Durchführung anlegen oder Platz freigeben.'):'Kein künftiger '+mod+' in der Sprache des Lernenden – eine zusätzliche Durchführung ist nötig.',
          actions:[{label:'Lernenden öffnen',run:()=>this.setState({screen:'apprentices',apprId:apprHit.id,apprTab:'plan'})}]}};
    }
    // 4) Kandidaten für einen Kurs
    if(typeKey||/wer kann|besetz|übernehmen|kandidat/.test(s)){
      let c=null;
      if(typeKey){ const cs=S.courses.filter(x=>x.type===typeKey&&(!locHit||x.loc===locHit.id)&&(!kwHit||this.kwLabel(x.kw)===+kwHit)); c=cs.find(x=>!x.instr)||cs[0]; }
      if(!c&&S.selCourse) c=S.courses.find(x=>x.id===S.selCourse);
      if(!c&&locHit) c=S.courses.find(x=>x.loc===locHit.id&&!x.instr);
      if(c){ const cands=this.candidates({...c,instr:null}).filter(x=>x.r.ok&&x.i.id!==c.instr);
        return {text:fmtCourse(c)+' · '+this.dayRange(c)+(c.instr?' · aktuell '+this.instr(c.instr).name:' · noch ohne Ausbilder'),
          card:{title:cands.length+' machbare Ausbilder',subtitle:T[c.type].name+' · Sprache '+c.lang+' · '+c.enrolled+'/'+T[c.type].max+' Teilnehmende'+(c.room?' · '+c.room:''),
            list:cands.slice(0,4).map(x=>({title:x.i.name,sub:x.i.emp+' · '+this.loc(x.i.loc).name+' · '+x.r.soft.filter(y=>y.color==='var(--ok)').slice(0,2).map(y=>y.text.replace(/\s\(.*\)/,'')).join(' · '),meta:'Score '+x.r.score,metaColor:'var(--ok)',action:{label:'Zuweisen',run:()=>this.assign(c.id,x.i.id)}})),
            empty:cands.length?null:'Kein Ausbilder ist machbar – im Kurs finden Sie Alternativen (Standort, Woche, Sprache).',actions:[openCourse(c)]}};
      }
    }
    // 5) Zertifikate
    if(/zertifikat|abläuft|ablaufen|ampel|ipaf|suva|gültig/.test(s)){
      const rows=[]; S.instrData.forEach(i=>i.certs.forEach(c=>{ const st=this.certStatus(c); if(st!=='ok') rows.push({i,c,st}); }));
      rows.sort((a,b)=>new Date(a.c.until)-new Date(b.c.until));
      return {text:'Zertifikate mit Handlungsbedarf, Warnfrist '+S.warnDays+' Tage:',
        card:{title:rows.length+' Zertifikate kritisch',subtitle:'abgelaufen oder innerhalb der Warnfrist',
          list:rows.map(r=>({title:r.i.name,sub:D.certTypes[r.c.t].name+' · '+D.certTypes[r.c.t].issuer,meta:(r.st==='bad'?'abgelaufen ':'bis ')+this.fmtIso(r.c.until),metaColor:this.col(r.st),action:openInstr(r.i)})),
          empty:rows.length?null:'Alle Zertifikate sind gültig.'}};
    }
    // 6) Unbesetzte Kurse
    if(/unbesetzt|ohne ausbilder|offen|lücke/.test(s)){
      const oc=S.courses.filter(c=>!c.instr).sort((a,b)=>a.kw-b.kw);
      return {text:'Kurse ohne Ausbilder:',
        card:{title:oc.length+' offene Kurse',subtitle:'sortiert nach Kalenderwoche',
          list:oc.slice(0,6).map(c=>{ const n=this.candidates(c).filter(x=>x.r.ok).length; return {title:T[c.type].code+' · '+this.loc(c.loc).name,sub:T[c.type].name+' · KW '+this.kwLabel(c.kw)+' · '+this.dayRange(c),meta:n+' Kandidaten',metaColor:n?'var(--ok)':'var(--bad)',action:openCourse(c)}; }),
          empty:oc.length?null:'Alle Kurse haben einen Ausbilder.'}};
    }
    // 7) Konflikte
    if(/konflikt|problem|kritisch|regel/.test(s)){
      const cc=S.courses.filter(c=>this.hasConflict(c));
      return {text:'Zuweisungen, die eine harte Regel verletzen:',
        card:{title:cc.length+' Konflikte',subtitle:'Skills, Zertifikat, Gerät, Sprache oder Verfügbarkeit',
          list:cc.map(c=>({title:T[c.type].code+' · '+this.loc(c.loc).name+' · KW '+this.kwLabel(c.kw),sub:this.instr(c.instr).name+': '+this.check(c,this.instr(c.instr)).hard.find(x=>!x.ok).reason,meta:'prüfen',metaColor:'var(--bad)',action:openCourse(c)})),
          empty:cc.length?null:'Keine Zuweisung verletzt eine harte Regel.'}};
    }
    // 8) Auslastung
    if(/auslastung|kapazit|voll|frei/.test(s)){
      const u=this.utilization();
      return {text:'Auslastung der ÜK-Standorte, KW 38–45:',card:{title:'Kurstage gegen Kapazität',subtitle:'Kapazität = parallele Kurse × 5 Tage × 8 Wochen',bars:u}};
    }
    // 9) Geräte
    if(/\b(gerät|geräte|geräten|engpass|engpässe|stapler|hebebühne|hebebühnen|maschine|maschinen)\b/.test(s)){
      const b=[]; S.courses.forEach(c=>this.deviceCheck(c).forEach(d=>{ if(!d.ok) b.push({title:this.loc(c.loc).name+' · KW '+this.kwLabel(c.kw),sub:T[c.type].code+': '+d.n+' × '+d.type+' nötig, '+d.free+' frei',meta:'Engpass',metaColor:'var(--bad)',action:openCourse(c)}); }));
      return {text:'Geräte-Engpässe:',card:{title:b.length+' Engpässe',subtitle:'Gerät muss am Standort, frei und nicht in Wartung sein',list:b,empty:b.length?null:'Keine Geräte-Engpässe im Zeitraum.'}};
    }
    return {text:'Dafür habe ich kein Werkzeug. Ich kann Ersatz suchen, Alternativtermine für Lernende finden, Kandidaten für einen Kurs ranken, Kontaktdaten zeigen, Zertifikate, offene Kurse, Konflikte, Auslastung und Geräte-Engpässe prüfen.',card:null};
  }

  utilization(){ return this.D.locs.filter(l=>l.uk).map(l=>{ const days=this.state.courses.filter(c=>c.loc===l.id).reduce((s,c)=>s+this.D.types[c.type].days,0); const pct=Math.round(100*days/(l.cap*5*8)); return {name:l.name,pct,color:pct>85?'var(--bad)':pct>60?'var(--warn)':'var(--accent)'}; }); }
  applyTheme(){
    const hue={Blau:250,Rot:25,Grün:150,Anthrazit:80}[this.props.accent??this.state.accent]??250; const chroma=(this.props.accent??this.state.accent)==='Anthrazit'?0.02:0.13;
    const r=this.props.radius??this.state.radius; const dens=this.props.density??this.state.density; const font=this.props.font??this.state.font;
    const st=document.documentElement.style;
    st.setProperty('--accent',`oklch(0.45 ${chroma} ${hue})`); st.setProperty('--accent-soft',`oklch(0.93 ${chroma/3.5} ${hue})`);
    st.setProperty('--r',r+'px'); st.setProperty('--r2',(r+4)+'px'); st.setProperty('--pad',dens==='kompakt'?'6px':'10px');
    st.setProperty('--font',font==='Helvetica'?"Helvetica,Arial,sans-serif":"var(--font-plex-sans),Helvetica,Arial,sans-serif");
  }
  componentDidMount(){ this.applyTheme(); }
  componentDidUpdate(){ this.applyTheme(); }
  renderVals(){
    const S=this.state, D=this.D, T=D.types;
    const canEdit=S.role==='Planung';
    const weeks=[38,39,40,41,42,43,44,45].map(kw=>({kw,range:this.fmt(this.monday(kw))+'–'+this.fmt(this.addDays(this.monday(kw),4)),bg:kw===38?'var(--accent-soft)':'transparent'}));
    const courseView=c=>{ const t=T[c.type]; return {...c,kwRaw:c.kw,kw:this.kwLabel(c.kw),code:t.code,name:t.name,max:t.max,locName:this.loc(c.loc).name,dayRange:this.dayRange(c),color:this.statusColor(c),statusLabel:this.statusLabel(c),instrLabel:c.instr?this.instr(c.instr).name.split(' ').pop():'— offen',instrColor:c.instr?(this.hasConflict(c)?'var(--bad)':'var(--ink)'):'var(--warn)',open:()=>this.setState({selCourse:c.id}),drag:e=>{e.dataTransfer.setData('text/plain',c.id); this.setState({dragId:c.id});},key:e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); this.setState({selCourse:c.id}); } }}; };
    const navAll=[{id:'dashboard',label:'Dashboard',roles:['Planung'],group:'Planung'},{id:'demand',label:'Planungslauf',roles:['Planung'],group:'Planung'},{id:'board',label:'Zeitplan',roles:['Planung'],group:'Planung'},{id:'courses',label:'Kurse',roles:['Planung'],group:'Stammdaten'},{id:'instructors',label:'Ausbilder',roles:['Planung'],group:'Stammdaten'},{id:'apprentices',label:'Lernende',roles:['Planung'],group:'Stammdaten'},{id:'schools',label:'Berufsschulen',roles:['Planung'],group:'Stammdaten'},{id:'locations',label:'Standorte',roles:['Planung'],group:'Stammdaten'},{id:'devices',label:'Geräte',roles:['Planung'],group:'Stammdaten'},{id:'assignments',label:'Meine Einsätze',roles:['Ausbilder'],group:'Mein Bereich'},{id:'myProfile',label:'Profil & Zertifikate',roles:['Ausbilder'],group:'Mein Bereich'},{id:'myVacation',label:'Ferien',roles:['Ausbilder'],group:'Mein Bereich'},{id:'import',label:'Import',roles:['Planung'],group:'System'},{id:'settings',label:'Einstellungen',roles:['Planung'],group:'System'}];
    const visible=navAll.filter(n=>n.roles.includes(S.role));
    const screen=visible.some(n=>n.id===S.screen)?S.screen:visible[0].id;
    const openCount=S.courses.filter(c=>!c.instr||this.hasConflict(c)).length;
    const navActive=screen;
    const nav=visible.map((n,i)=>({...n,current:n.id===navActive?'page':undefined,bg:n.id===navActive?'var(--accent-soft)':'transparent',color:n.id===navActive?'var(--accent)':'var(--ink)',weight:n.id===navActive?500:400,dot:n.id===navActive?'var(--accent)':'var(--line2)',badge:n.id==='board'&&openCount?openCount:null,go:()=>this.go(n.id),groupLabel:(i===0||visible[i-1].group!==n.group)&&n.group?n.group:null}));
    const show={}; show[screen]=true;
    const titles={dashboard:'Dashboard',board:'Zeitplan',courses:'Kurse',demand:'Planungslauf',instructors:'Ausbilder',apprentices:'Lernende',schools:'Berufsschulen',locations:'Standorte',devices:'Geräte',import:'Datenimport',myProfile:'Profil & Zertifikate',assignments:'Einsätze',myVacation:'Ferien',settings:'Einstellungen'};
    // certs
    const certRowsAll=[]; S.instrData.forEach(i=>i.certs.forEach(c=>certRowsAll.push({i,c,st:this.certStatus(c)})));
    const certStats={ok:certRowsAll.filter(x=>x.st==='ok').length,warn:certRowsAll.filter(x=>x.st==='warn').length,bad:certRowsAll.filter(x=>x.st==='bad').length};
    const certIssues=certRowsAll.filter(x=>x.st!=='ok').sort((a,b)=>new Date(a.c.until)-new Date(b.c.until)).map(x=>({name:x.i.name,cert:D.certTypes[x.c.t].name,until:this.fmtIso(x.c.until),color:this.col(x.st),go:()=>this.setState({screen:'instructors',instrId:x.i.id,instrTab:'certs'})}));
    // alerts
    const alerts=[];
    S.courses.filter(c=>this.hasConflict(c)).forEach(c=>alerts.push({color:'var(--bad)',title:T[c.type].code+' '+this.loc(c.loc).name+': Zuweisung verletzt harte Regel',detail:this.instr(c.instr).name+' – '+this.check(c,this.instr(c.instr)).hard.find(h=>!h.ok).reason,when:'KW '+this.kwLabel(c.kw),go:()=>this.setState({selCourse:c.id})}));
    S.courses.filter(c=>!c.instr&&c.kw<38+S.leadWeeks).forEach(c=>alerts.push({color:'var(--warn)',title:T[c.type].code+' '+this.loc(c.loc).name+' ohne Ausbilder',detail:'Beginn in '+(c.kw-38)+' Wochen · '+this.candidates(c).filter(x=>x.r.ok).length+' machbare Kandidaten',when:'KW '+this.kwLabel(c.kw),go:()=>this.setState({selCourse:c.id})}));
    S.courses.forEach(c=>this.deviceCheck(c).forEach(d=>{ if(!d.ok) alerts.push({color:'var(--bad)',title:'Geräte-Engpass '+this.loc(c.loc).name,detail:T[c.type].code+': '+d.n+' × '+d.type+' benötigt, '+d.free+' frei',when:'KW '+this.kwLabel(c.kw),go:()=>this.setState({selCourse:c.id})}); }));
    S.absences.filter(a=>a.status==='beantragt').forEach(a=>alerts.push({color:'var(--accent)',title:'Ferienantrag '+this.instr(a.instr).name,detail:a.kind+' KW '+a.kw+' wartet auf Genehmigung',when:'KW '+a.kw,go:()=>this.setState({screen:'instructors',instrId:a.instr,instrTab:'avail'})}));
    const openCoursesRaw=S.courses.filter(c=>!c.instr).sort((a,b)=>a.kw-b.kw);
    const quickActions=[{label:'Planungslauf',desc:'Semester planen: Bedarf, Kurse und Termine, Ausbilder.',go:()=>this.setState({screen:'demand',activeRun:null})},{label:'Absenz erfassen',desc:'Ausbilder krank oder abwesend – für jeden betroffenen Kurs wird ein Ersatz vorgeschlagen.',go:()=>this.setState({absDialog:{instr:'i7',kw:38,kind:'Krankheit'}})},{label:'Nichterscheinen erfassen',desc:'Lernende/r hat einen ÜK verpasst – passende Folgetermine werden vorgeschlagen.',go:()=>this.setState({noShowDialog:{appr:S.apprentices[0].id,module:''}})},];
    const instrOptions=S.instrData.map(i=>({id:i.id,name:i.name}));
    const apprOptions=S.apprentices.map(a=>({id:a.id,label:a.name+' · '+a.track+' '+a.cohort+' · '+a.school}));
    let absDialog=null; if(S.absDialog){ const d=S.absDialog; const i=this.instr(d.instr); const hit=S.courses.filter(c=>c.instr===i.id&&this.courseDays(c).some(x=>this.kwOfDate(x)===+d.kw)); absDialog={...d,preview:hit.length?hit.length+' Einsatz'+(hit.length>1?'e':'')+' betroffen: '+hit.map(c=>T[c.type].code+' '+this.loc(c.loc).name+' ('+this.candidates({...c,instr:null}).filter(x=>x.r.ok&&x.i.id!==i.id).length+' Ersatzkandidaten)').join(', '):i.name+' hat in KW '+d.kw+' keinen Einsatz.',previewColor:hit.length?'var(--warn)':'var(--muted)'}; }
    let noShowDialog=null; if(S.noShowDialog){ const d=S.noShowDialog; const a=S.apprentices.find(x=>x.id===d.appr)||S.apprentices[0]; const mods=[...(a.cur?[a.cur]:[]),...a.done]; const mod=d.module&&mods.includes(d.module)?d.module:mods[0]||'ÜK 1'; const f=this.followUp(a,mod); noShowDialog={...d,module:mod,modules:mods.length?mods:['ÜK 1'],preview:f?'Vorschlag: '+mod+' in '+this.loc(f.loc).name+', KW '+this.kwLabel(f.kw)+' ('+f.enrolled+'/'+T[f.type].max+' Plätze)':'Kein freier '+mod+' im Zeitraum – ein neuer Kurs wäre nötig.'}; }
    const openCourses=openCoursesRaw.map(c=>({...courseView(c),candCount:this.candidates(c).filter(x=>x.r.ok).length}));
    const utilization=this.utilization();
    const kpis=[{label:'Kurse ohne Ausbilder',value:openCoursesRaw.length,unit:'KW 38–45',color:openCoursesRaw.length?'var(--warn)':'var(--ink)',go:()=>this.go('board')},{label:'Zuweisungen mit Konflikt',value:S.courses.filter(c=>this.hasConflict(c)).length,unit:'harte Regel verletzt',color:'var(--bad)',go:()=>this.go('board')},{label:'Zertifikate kritisch',value:certStats.warn+certStats.bad,unit:'von '+certRowsAll.length,color:'var(--warn)',go:()=>this.go('instructors')},{label:'Ø Auslastung ÜK',value:Math.round(utilization.reduce((s,u)=>s+u.pct,0)/utilization.length)+'%',unit:'5 Standorte',color:'var(--ink)',go:()=>this.go('demand')}];
    // board
    const boardLocs=D.locs.filter(l=>S.filterLoc===''?true:S.filterLoc==='UK'?l.uk:l.id===S.filterLoc);
    const boardRows=boardLocs.map(l=>({name:l.name,meta:l.region+' · '+l.cap+' parallel',cells:weeks.map(w=>{ const cs=S.courses.filter(c=>c.loc===l.id&&c.kw===w.kw&&(S.filterStatus===''||this.statusLabel(c)===S.filterStatus)).map(courseView); return {courses:cs,bg:cs.length>=l.cap?'var(--warn-soft)':'transparent',over:e=>{ if(canEdit) e.preventDefault(); },drop:e=>{ e.preventDefault(); const id=e.dataTransfer.getData('text/plain')||S.dragId; if(id&&canEdit) this.moveCourse(id,w.kw,l.id); }}; })}));
    // courses
    const courseRows=[...S.courses].sort((a,b)=>a.kw-b.kw||a.off-b.off).map(courseView);
    const typeCards=Object.entries(T).map(([id,t])=>({id,code:t.code,name:t.name,kind:t.kind,track:t.track,duration:t.days+(t.days===1?' Tag':' Tage')+(t.sat?', samstags, wochenübergreifend':''),skills:t.skills.join(', '),certs:t.certs.length?t.certs.map(c=>D.certTypes[c].name).join(', '):'–',devs:t.devs.length?t.devs.map(d=>d.n+' × '+D.devTypes[d.t].name).join(', '):'–',tn:'max. '+t.max+(t.prereq?' · setzt '+t.prereq+' voraus':'')}));
    // demand
    // ---- Planungsläufe
    const run=S.activeRun?S.runs.find(r=>r.id===S.activeRun):null;
    const per=run?D.periods.find(p=>p.id===run.period):D.periods[0];
    const pd=run?run.demand:null;
    const pc=run?run.courses:null;
    const stage=run?run.stage:1;
    const patchRun=(patch)=>this.setState({runs:S.runs.map(r=>r.id===S.activeRun?{...r,...patch}:r)});
    const runRows=S.runs.map(r=>{ const p=D.periods.find(x=>x.id===r.period); const done=r.committed?4:r.courses?3:r.demand?2:1;
      return {label:p.label,months:p.months,year:p.year,created:r.created,dots:[1,2,3,4].map(n=>({color:n<=done?(r.committed?'var(--ok)':'var(--accent)'):'var(--line)',title:['Bedarf','Kurse & Termine','Ausbilder','Übernahme'][n-1]})),
        status:r.committed?'übernommen':r.demand?'in Arbeit':'neu',color:r.committed?'var(--ok)':r.demand?'var(--accent)':'var(--muted)',cta:r.committed?'Ansehen':'Fortsetzen',
        open:()=>this.setState({activeRun:r.id}),remove:()=>{ if(!window.confirm(p.label+' verwerfen? Bereits übernommene Kurse bleiben im Zeitplan.')) return; this.setState({runs:S.runs.filter(x=>x.id!==r.id),activeRun:null}); this.toast('Planungslauf verworfen'); }}; });
    const demandRows=(pd||[]).map(d=>({...d,locName:this.loc(d.loc).name,dayLabel:this.WDN(d.day),schools:d.schools.join(', ')}));
    const demandKpis=pd?[{label:'Lernende',value:pd.reduce((s,d)=>s+d.n,0)},{label:'Module',value:[...new Set(pd.map(d=>d.code))].length},{label:'Kurse nötig',value:pd.reduce((s,d)=>s+d.need,0)},{label:'Kurstage',value:pd.reduce((s,d)=>s+d.need*d.days,0)}]:[];
    const planCourseRows=(pc||[]).map(c=>{ const wd=[]; for(let k=0;k<c.days;k++) wd.push(this.WDN(c.off+k+1)); const bad=c.noType?'Kein Kurstyp hinterlegt – Katalog ergänzen':c.blocked||null;
      return {...c,needsFix:!!bad||!c.kw,fix:()=>this.setState({fixDialog:{id:c.id,idx:0}}),locName:this.loc(c.loc).name,kwLabel:c.kw?'KW '+this.kwLabel(c.kw):'–',dayLabel:wd.filter(Boolean).join('–')||'–',room:c.room||'–',schools:c.schools.join(', '),note:bad||('Raum reserviert, Schultag '+this.WDN(c.day)+' ausgespart'),noteColor:bad?'var(--bad)':'var(--muted)',bg:bad?'var(--bad-soft)':'transparent'}; });
    const planStaffRows=(pc||[]).filter(c=>c.kw&&!c.noType&&!c.blocked).map(c=>({needsFix:!c.cand,fix:()=>this.setState({fixDialog:{id:c.id,idx:0}}),code:c.code,name:c.name,locName:this.loc(c.loc).name,kwLabel:'KW '+this.kwLabel(c.kw),candName:c.cand?c.cand.name:'kein machbarer Ausbilder',candColor:c.cand?'var(--ink)':'var(--bad)',candCountLabel:c.cand?c.candCount+' machbare Kandidaten':'harte Regeln verletzt',score:c.cand?c.cand.score:'–',why:c.cand?c.cand.why:'Skills, Zertifikate, Sprache oder Verfügbarkeit passen bei keinem Ausbilder',bg:c.cand?'transparent':'var(--bad-soft)'}));
    const okCourses=(pc||[]).filter(c=>c.kw&&!c.noType&&!c.blocked);
    const planSummary=pc?[{label:'Kurse anlegen',value:okCourses.length,color:'var(--accent)'},{label:'davon mit Ausbilder',value:okCourses.filter(c=>c.cand).length,color:'var(--ok)'},{label:'ohne Ausbilder',value:okCourses.filter(c=>!c.cand).length,color:'var(--warn)'},{label:'nicht planbar',value:(pc||[]).length-okCourses.length,color:'var(--bad)'}]:[];
    const planSteps=[[1,'Bedarf',pd?pd.reduce((s,d)=>s+d.need,0)+' Kurse nötig':'noch nicht erzeugt'],[2,'Kurse & Termine',pc?okCourses.length+' vorgeschlagen':'offen'],[3,'Ausbilder',pc?okCourses.filter(c=>c.cand).length+' zugeteilt':'offen'],[4,'Übernahme',run&&run.committed?'übernommen':'offen']].map(([n,label,meta])=>({n,label,meta,bg:stage===n?'var(--accent-soft)':'transparent',dotBg:stage>n?'var(--ok)':stage===n?'var(--accent)':'var(--surface2)',dotColor:stage>=n?'#fff':'var(--muted)',color:stage===n?'var(--accent)':'var(--ink)',go:()=>{ if(n===1||pd) patchRun({stage:n}); }}));

    // instructors
    const instrView=i=>({...i,initials:this.initials(i.name),employment:i.emp,locName:this.loc(i.loc).name,langs:i.langs.join('/'),skillList:i.skills,skills:i.skills.join(', '),assignCount:S.courses.filter(c=>c.instr===i.id).length,certDots:i.certs.map(c=>({color:this.col(this.certStatus(c)),title:D.certTypes[c.t].name+' bis '+this.fmtIso(c.until)})),open:()=>this.setState({instrId:i.id,instrTab:'skills',noteDraft:null,noteSaved:false})});
    const instrRows=S.instrData.filter(i=>(!S.instrSearch||i.name.toLowerCase().includes(S.instrSearch.toLowerCase()))&&(!S.filterSkill||i.skills.includes(S.filterSkill))&&(!S.filterLang||i.langs.includes(S.filterLang))).map(instrView);
    let instrDetail=null; const iSel=S.instrId?S.instrData.find(x=>x.id===S.instrId):null;
    if(iSel&&screen==='instructors'){ const v=instrView(iSel); const certRows=iSel.certs.map(c=>{const st=this.certStatus(c); return {name:D.certTypes[c.t].name,issuer:D.certTypes[c.t].issuer,issued:this.fmtIso(c.issued),until:this.fmtIso(c.until),color:this.col(st),status:st==='ok'?'gültig':st==='warn'?'läuft bald ab':'abgelaufen'};});
      const devQuals=Object.entries(D.devTypes).map(([k,d])=>{ const c=iSel.certs.find(x=>x.t===d.cert); const ok=c&&this.certStatus(c)!=='bad'; return {label:d.name,bg:ok?'var(--ok-soft)':'var(--surface2)',color:ok?'var(--ok)':'var(--muted)'}; });
      const weekCells=weeks.map(w=>{ const cs=S.courses.filter(c=>c.instr===iSel.id&&this.courseDays(c).some(d=>this.kwOfDate(d)===w.kw)); const ab=S.absences.find(a=>a.instr===iSel.id&&a.kw===w.kw&&a.status!=='abgelehnt'); if(cs.length&&ab&&ab.status!=='beantragt') return {kw:w.kw,label:'Konflikt: '+T[cs[0].type].code+' + '+ab.kind,bg:'var(--bad-soft)',color:'var(--bad)'}; if(cs.length) return {kw:w.kw,label:cs.map(c=>T[c.type].code+' '+this.loc(c.loc).name).join(', '),bg:'var(--accent-soft)',color:'var(--accent)'}; if(ab) return {kw:w.kw,label:ab.kind+' ('+ab.status+')',bg:ab.status==='beantragt'?'var(--warn-soft)':'var(--surface2)',color:ab.status==='beantragt'?'var(--warn)':'var(--muted)'}; return {kw:w.kw,label:'frei',bg:'var(--ok-soft)',color:'var(--ok)'}; });
      const absRows=S.absences.filter(a=>a.instr===iSel.id).map(a=>({kind:a.kind,range:'KW '+a.kw,status:a.status,pending:canEdit&&a.status==='beantragt',color:a.status==='beantragt'?'var(--warn)':a.status==='abgelehnt'?'var(--bad)':'var(--muted)',approve:()=>{this.setState({absences:S.absences.map(x=>x.id===a.id?{...x,status:'genehmigt'}:x)}); this.toast('Ferien genehmigt');},reject:()=>{this.setState({absences:S.absences.map(x=>x.id===a.id?{...x,status:'abgelehnt'}:x)}); this.toast('Antrag abgelehnt');}}));
      const assignRows=S.courses.filter(c=>c.instr===iSel.id).sort((a,b)=>a.kw-b.kw).map(courseView);
      const maint=this.maintenance(iSel).map(m=>({...m,color:m.ok?'var(--ok)':'var(--warn)',openLabel:m.ok?'erfüllt':m.open+' offen'}));
      const skillChips=iSel.skills.map(s=>({name:s,remove:()=>{ this.setState({instrData:S.instrData.map(x=>x.id===iSel.id?{...x,skills:x.skills.filter(y=>y!==s)}:x)}); this.toast('Skill «'+s+'» entfernt'); }}));
      const skillOptions=D.skills.filter(s=>!iSel.skills.includes(s));
      const teachIds=iSel.teach||[];
      const qualifies=k=>{ const t=T[k]; const needCerts=[...new Set([...t.certs,...t.devs.map(d=>D.devTypes[d.t].cert)])]; const missSkill=t.skills.filter(s=>!iSel.skills.includes(s)); const missCert=needCerts.filter(c=>{ const cert=iSel.certs.find(x=>x.t===c); return !cert||this.certStatus(cert)==='bad'; }); return {ok:!missSkill.length&&!missCert.length,missSkill,missCert}; };
      const teachRows=teachIds.map(k=>{ const q=qualifies(k); return {code:T[k].code,name:T[k].name,color:q.ok?'var(--ok)':'var(--bad)',note:q.ok?'Skills und Zertifikate erfüllt':[...q.missSkill.map(s=>'Skill fehlt: '+s),...q.missCert.map(c=>'Zertifikat fehlt oder abgelaufen: '+D.certTypes[c].name)].join(' · '),remove:()=>{ this.setState({instrData:S.instrData.map(x=>x.id===iSel.id?{...x,teach:teachIds.filter(y=>y!==k)}:x)}); this.toast(T[k].code+' entfernt'); }}; });
      const teachSuggestions=Object.keys(T).filter(k=>!teachIds.includes(k)&&qualifies(k).ok).map(k=>({code:T[k].code,name:T[k].name,why:'Alle Skills und gültigen Zertifikate vorhanden',add:()=>{ this.setState({instrData:S.instrData.map(x=>x.id===iSel.id?{...x,teach:[...teachIds,k]}:x)}); this.toast(T[k].code+' freigegeben'); }}));
      const nLead=S.courses.filter(c=>c.instr===iSel.id).length, nBack=S.courses.filter(c=>c.backup===iSel.id).length, nTot=nLead+nBack;
      instrDetail={...v,email:iSel.email,phone:iSel.phone,mailto:'mailto:'+iSel.email,telHref:'tel:'+iSel.phone.replace(/\s/g,''),skillChips,skillOptions,teachRows,teachCount:teachIds.length,teachSuggestions,hasSuggestions:!!teachSuggestions.length,assignLabel:nTot===1?'1 Einsatz KW 38–45':nTot+' Einsätze KW 38–45',maint,notes:iSel.notes||'Keine Notizen hinterlegt.',maxTravel:iSel.maxTravel,prefLocs:iSel.pref,certRows,noCerts:!certRows.length,devQuals,weekCells,absRows,noAbs:!absRows.length,assignRows,noAssign:!assignRows.length}; }
    const instrTabs=[['skills','Skills & Wissen'],['certs','Zertifikate'],['avail','Verfügbarkeit'],['assign','Einsätze']].map(([id,label])=>({label,go:()=>this.setState({instrTab:id}),color:S.instrTab===id?'var(--accent)':'var(--muted)',weight:S.instrTab===id?500:400,line:S.instrTab===id?'var(--accent)':'transparent'}));
    const instrTab={}; instrTab[S.instrTab]=true;
    // apprentices
    const allMods=['ÜK 1','ÜK 3','ÜK 5','ÜK 7','ÜK 9'];
    const cohortOptions=[...new Set(S.apprentices.map(a=>a.cohort))].sort();
    const apprRows=S.apprentices.filter(a=>(!S.filterSchool||a.school===S.filterSchool)&&(!S.filterTrack||a.track===S.filterTrack)&&(!S.filterCohort||a.cohort===S.filterCohort)).map(a=>{ const mods=a.track==='EBA'?['ÜK 2 EBA','ÜK 4 EBA']:allMods; return {...a,expanded:S.expandedAppr===a.id,bg:S.expandedAppr===a.id?'var(--surface2)':'transparent',extId:a.id,defaultLoc:this.loc(D.schools.find(s=>s.name===a.school).loc).name,batch:'IMP-2026-09-'+a.school.replace(/\s/g,'').slice(0,5).toUpperCase(),progress:mods.map(m=>({title:m+(a.done.includes(m)?' – besucht':a.cur===m?' – eingeteilt':a.missed===m?' – Nichterscheinen, Folgetermin offen':' – offen'),color:a.done.includes(m)?'var(--ok)':a.cur===m?'var(--accent)':a.missed===m?'var(--bad)':'var(--line2)'})),open:()=>this.setState({apprId:a.id,apprTab:'plan'})}; });
    let apprDetail=null; const aSel=S.apprId?S.apprentices.find(x=>x.id===S.apprId):null;
    if(aSel&&screen==='apprentices'){ const plan=D.curriculum[aSel.track]||[]; const hist=D.history[aSel.id]||[];
      const codeOf=c=>Object.keys(T).find(k=>T[k].code===c);
      const modules=plan.map(m=>{ const hx=hist.find(x=>x.code===m.code); const missingPre=m.prereq&&!hist.some(x=>x.code===m.prereq&&x.status==='besucht'); let status='offen',color='var(--muted)',run='–';
        if(hx){ run=hx.date+' · '+hx.loc+' · '+hx.instr; if(hx.status==='besucht'){status='besucht';color='var(--ok)';} else if(hx.status==='eingeteilt'){status='eingeteilt';color='var(--accent)';} else if(hx.status==='nicht erschienen'){status='Nichterscheinen';color='var(--bad)';} else {status='abgesagt';color='var(--warn)';} }
        const needFollow=hx&&(hx.status==='nicht erschienen'||hx.status==='abgesagt');
        return {code:m.code,name:m.name,semLabel:m.sem+'. Sem.',days:m.days,window:m.window,run,status,color,bg:needFollow?'var(--bad-soft)':status==='eingeteilt'?'var(--accent-soft)':'transparent',prereqNote:missingPre?'Voraussetzung '+m.prereq+' fehlt':null,canPlan:canEdit&&(status==='offen'||needFollow)&&!missingPre&&!!codeOf(m.code),noType:!codeOf(m.code)&&(status==='offen'||needFollow)&&!missingPre,plan:()=>{ const k=codeOf(m.code); this.setState({newCourse:{type:k,loc:this.loc((D.schools.find(s=>s.name===aSel.school)||{loc:'RUP'}).loc).id,kw:41,lang:aSel.lang,cohort:aSel.cohort+' '+aSel.track}}); }}; });
      const doneN=modules.filter(m=>m.status==='besucht').length; const daysDone=plan.filter(m=>modules.find(x=>x.code===m.code).status==='besucht').reduce((s,m)=>s+m.days,0); const daysTotal=plan.reduce((s,m)=>s+m.days,0);
      const openN=modules.filter(m=>m.status==='offen').length; const issues=modules.filter(m=>m.status==='Nichterscheinen'||m.status==='abgesagt').length;
      apprDetail={...aSel,initials:this.initials(aSel.name),defaultLoc:this.loc((D.schools.find(s=>s.name===aSel.school)||{loc:'RUP'}).loc).name+' (nächste Berufsschule)',batch:'IMP-2026-09-'+aSel.school.replace(/\s/g,'').slice(0,5).toUpperCase(),updated:'18.9.2026',
        progressLabel:daysDone+' von '+daysTotal+' ÜK-Tagen',statusLabel:issues?issues+' Nachholtermin'+(issues>1?'e':'')+' offen':openN?openN+' Module offen':'Bildungsplan erfüllt',statusColor:issues?'var(--bad)':openN?'var(--muted)':'var(--ok)',
        kpis:[{label:'Module besucht',value:doneN+' / '+plan.length,color:'var(--ok)'},{label:'ÜK-Tage',value:daysDone+' / '+daysTotal,color:'var(--ink)'},{label:'Offen',value:openN,color:'var(--muted)'},{label:'Nachholen',value:issues,color:issues?'var(--bad)':'var(--ink)'}],
        modules,historyRows:hist.map(x=>({...x,name:(plan.find(m=>m.code===x.code)||{}).name||'',color:x.status==='besucht'?'var(--ok)':x.status==='eingeteilt'?'var(--accent)':x.status==='nicht erschienen'?'var(--bad)':'var(--warn)'})),noHistory:!hist.length,
        docs:[{label:'Kompetenznachweis Semester 1–2',color:doneN>=4?'var(--ok)':'var(--muted)',state:doneN>=4?'vollständig':'in Arbeit'},{label:'Kompetenznachweis Semester 3–4',color:doneN>=8?'var(--ok)':'var(--muted)',state:doneN>=8?'vollständig':'offen'}]}; }
    const apprTabs=[['plan','Bildungsplan'],['history','Kursteilnahmen'],['data','Stammdaten']].map(([id,label])=>({label,go:()=>this.setState({apprTab:id}),color:S.apprTab===id?'var(--accent)':'var(--muted)',weight:S.apprTab===id?500:400,line:S.apprTab===id?'var(--accent)':'transparent'}));
    const apprTab={}; apprTab[S.apprTab]=true;
    const dupRows=S.dups.map(d=>({...d,aName:d.a.name,aId:d.a.id,aSchool:d.a.school,bName:d.b.name,bId:d.b.id,bSchool:d.b.school,merge:()=>{this.setState({dups:S.dups.filter(x=>x.id!==d.id)}); this.toast('Zusammengeführt – Herkunft beider Zeilen gespeichert');},dismiss:()=>{this.setState({dups:S.dups.filter(x=>x.id!==d.id)}); this.toast('Als eigenständig markiert');}}));
    const ukLocs=D.locs.filter(l=>l.uk);
    const weekdayOptions=[1,2,3,4,5].map(n=>({n,label:['','Montag','Dienstag','Mittwoch','Donnerstag','Freitag'][n]}));
    const schoolRows=D.schools.map(s=>({name:s.name,loc:s.loc,day:s.day,count:Object.values(s.counts||{}).reduce((a,b)=>a+b,0),
      setLoc:e=>{ s.loc=e.target.value; this.forceUpdate(); this.toast(s.name+' → '+this.loc(s.loc).name); },
      setDay:e=>{ s.day=+e.target.value; this.forceUpdate(); this.toast(s.name+': Schultag '+['','Montag','Dienstag','Mittwoch','Donnerstag','Freitag'][s.day]); }}));
    // locations
    const MOB={fest:{label:'fest',soft:'var(--surface2)',color:'var(--muted)'},mobil:{label:'mobil',soft:'var(--accent-soft)',color:'var(--accent)'},miete:{label:'Miete',soft:'var(--alt-soft)',color:'var(--alt)'}};
    const devView=d=>{ const mob=MOB[d.mobility||'fest']; const cur=this.deviceAt(d,38); const resv=S.courses.filter(c=>T[c.type].devs.some(x=>x.t===d.type)&&this.deviceAt(d,c.kw)===c.loc).length; let timeline=''; if(d.mobility==='miete') timeline='KW '+d.from+'–'+d.until+(d.vendor?' · '+d.vendor:''); else if(d.moves&&d.moves.length) timeline=d.moves.map(m=>'ab KW '+m.kw+' → '+this.loc(m.to).name).join(', '); else timeline='dauerhaft in '+this.loc(d.loc).name; return {inv:d.id,type:D.devTypes[d.type].name,typeId:d.type,locName:cur?this.loc(cur).name:'noch nicht geliefert',mobility:mob.label,mobSoft:mob.soft,mobColor:mob.color,status:d.status,color:d.status==='verfügbar'?'var(--ok)':'var(--warn)',timeline,reservations:resv,canMove:canEdit&&d.mobility==='mobil',canReturn:canEdit&&d.mobility==='miete',move:()=>this.setState({devDialog:{kind:'move',dev:d.id,loc:d.loc,from:39}}),ret:()=>{ this.setState({devices:S.devices.filter(x=>x.id!==d.id)}); this.toast('Mietgerät '+d.id+' zurückgegeben'); }}; };
    const bottleneckOf=l=>{ let b=null; S.courses.filter(c=>c.loc===l.id).forEach(c=>this.deviceCheck(c).forEach(d=>{ if(!d.ok) b={long:'Engpass KW '+this.kwLabel(c.kw)+': '+T[c.type].code+' braucht '+d.n+' × '+d.type+', '+d.free+' frei.',short:'Engpass KW '+this.kwLabel(c.kw)+' · '+d.type}; })); return b; };
    const locRows=D.locs.filter(l=>!S.locSearch||(l.name+' '+l.address).toLowerCase().includes(S.locSearch.toLowerCase())).map(l=>{ const b=bottleneckOf(l); return {...l,region:{D:'Deutschschweiz',F:'Romandie',I:'Tessin'}[l.region],kind:l.uk?'ÜK + Kurse':'Kurse',roomCount:l.rooms.length,devCount:S.devices.filter(d=>this.deviceAt(d,38)===l.id).length,courseCount:S.courses.filter(c=>c.loc===l.id).length,schools:D.schools.filter(s=>s.loc===l.id).map(s=>s.name).join(', ')||'–',bottleneckShort:b?b.short:'',open:()=>this.setState({locId:l.id,locTab:'rooms'})}; });
    let locDetail=null, locCal=null; const lSel=S.locId?this.loc(S.locId):null; const WD2=['So','Mo','Di','Mi','Do','Fr','Sa'];
    if(lSel&&screen==='locations'){ const lmon=this.monday(S.locKw); const ldays=[0,1,2,3,4,5].map(i=>this.addDays(lmon,i)); const sameD=(a,b)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
      const itemsFor=(room,d)=>S.courses.filter(c=>c.loc===lSel.id).flatMap(c=>{ if(!this.courseDays(c).some(x=>sameD(x,d))) return []; return this.blocksOf(c).filter(b=>b.room===room.name).map(b=>({time:b.time,code:T[c.type].code,label:b.label,instr:c.instr?this.instr(c.instr).name.split(' ').pop():'– offen',color:this.statusColor(c),open:()=>this.setState({selCourse:c.id})})); });
      const roomRows=lSel.rooms.map(r=>{ const week=ldays.map(d=>{ const it=itemsFor(r,d); return {color:it.length?'var(--accent)':'var(--line)',title:WD2[d.getDay()]+' '+this.fmt(d)+': '+(it.length?it.map(x=>x.code+' '+x.time).join(', '):'frei')}; }); let next='frei in KW 38–45'; outer: for(let kw=38;kw<=45;kw++){ for(let i=0;i<6;i++){ const d=this.addDays(this.monday(kw),i); const it=itemsFor(r,d); if(it.length){ next=it[0].code+' · '+WD2[d.getDay()]+' '+this.fmt(d)+' · '+it[0].time; break outer; } } } return {...r,week,next}; });
      const devRows=S.devices.filter(d=>this.deviceAt(d,S.locKw)===lSel.id||(d.loc===lSel.id&&!d.from)).map(d=>{ const v=devView(d); let avail='ganzjährig'; if(d.mobility==='miete') avail='KW '+d.from+'–'+d.until; else if(d.moves&&d.moves.length){ const mv=d.moves.find(m=>m.to!==lSel.id); avail=mv?'bis KW '+(mv.kw-1)+', dann '+this.loc(mv.to).name:'ab KW '+d.moves[0].kw; } return {...v,avail}; });
      const rows=lSel.rooms.map(r=>({...r,cells:ldays.map(d=>({items:itemsFor(r,d),bg:sameD(d,new Date(2026,8,18))?'var(--accent-soft)':'transparent'}))}));
      const devSummary=Object.keys(D.devTypes).map(t=>{ const here=S.devices.filter(d=>d.type===t&&this.deviceAt(d,S.locKw)===lSel.id); if(!here.length) return null; const need=S.courses.filter(c=>c.loc===lSel.id&&c.kw===S.locKw).reduce((s,c)=>s+(T[c.type].devs.find(x=>x.t===t)||{n:0}).n,0); return {label:D.devTypes[t].name+' '+need+'/'+here.length,color:need>here.length?'var(--bad)':'var(--ink)'}; }).filter(Boolean);
      locDetail={...lSel,region:{D:'Deutschschweiz',F:'Romandie',I:'Tessin'}[lSel.region],roomRows,devRows,noDevices:!devRows.length};
      locCal={range:this.fmt(lmon)+' – '+this.fmt(this.addDays(lmon,5))+'2026',days:ldays.map(d=>({wd:WD2[d.getDay()],date:this.fmt(d),bg:sameD(d,new Date(2026,8,18))?'var(--accent-soft)':'transparent'})),rows,devSummary,prev:()=>this.setState({locKw:Math.max(36,S.locKw-1)}),next:()=>this.setState({locKw:Math.min(52,S.locKw+1)}),today:()=>this.setState({locKw:38})}; }
    const locTabs=[['rooms','Räume'],['devices','Geräte'],['occupancy','Belegung']].map(([id,label])=>({label,go:()=>this.setState({locTab:id}),color:S.locTab===id?'var(--accent)':'var(--muted)',weight:S.locTab===id?500:400,line:S.locTab===id?'var(--accent)':'transparent'}));
    const locTab={}; locTab[S.locTab]=true;
    const devRows=S.devices.filter(d=>(!S.devFilterType||d.type===S.devFilterType)&&(!S.devFilterLoc||this.deviceAt(d,38)===S.devFilterLoc||d.loc===S.devFilterLoc)&&(!S.devFilterMob||(d.mobility||'fest')===S.devFilterMob)).map(devView);
    const devKpis=[{label:'Geräte gesamt',value:S.devices.length,color:'var(--ink)'},{label:'davon mobil',value:S.devices.filter(d=>d.mobility==='mobil').length,color:'var(--accent)'},{label:'Miete / Zukauf',value:S.devices.filter(d=>d.mobility==='miete').length,color:'var(--alt)'},{label:'in Wartung',value:S.devices.filter(d=>d.status!=='verfügbar').length,color:'var(--warn)'},{label:'Engpässe KW 38–45',value:D.locs.filter(l=>bottleneckOf(l)).length,color:'var(--bad)'}];
    const devTypeOptions=Object.entries(D.devTypes).map(([id,t])=>({id,name:t.name}));
    let devDialog=null; if(S.devDialog){ const dd=S.devDialog; const isRent=dd.kind==='rent'; let preview=''; if(isRent){ const tmp={id:'tmp',type:dd.type,loc:dd.loc,from:+dd.from,until:+dd.until,mobility:'miete'}; const helps=S.courses.filter(c=>c.loc===dd.loc&&c.kw>=+dd.from&&c.kw<=+dd.until&&T[c.type].devs.some(x=>x.t===dd.type)); preview=helps.length?'Deckt '+helps.map(c=>T[c.type].code+' KW '+this.kwLabel(c.kw)).join(', ')+' in '+this.loc(dd.loc).name+'.':'Kein Kurs in '+this.loc(dd.loc).name+' braucht diesen Gerätetyp in KW '+dd.from+'–'+dd.until+'.'; } else { const dev=S.devices.find(x=>x.id===dd.dev); const affected=S.courses.filter(c=>c.kw>=+dd.from&&c.loc===this.deviceAt(dev,+dd.from)&&T[c.type].devs.some(x=>x.t===dev.type)); preview=affected.length?'Achtung: '+affected.map(c=>T[c.type].code+' KW '+this.kwLabel(c.kw)+' '+this.loc(c.loc).name).join(', ')+' verliert dieses Gerät.':'Kein Kurs am bisherigen Standort ist ab KW '+dd.from+' betroffen.'; }
      devDialog={...dd,isRent,title:isRent?'Mietgerät hinzufügen':'Gerät '+dd.dev+' verschieben',desc:isRent?'Temporär zugekauftes oder gemietetes Gerät. Es zählt nur im gewählten Zeitraum am Standort zur Verfügbarkeit.':'Mobile Geräte wechseln mit Datum den Standort; die Verfügbarkeit folgt ab dieser Woche.',locLabel:isRent?'Standort':'Neuer Standort',fromLabel:isRent?'Ab KW':'Ab KW',cta:isRent?'Hinzufügen':'Verschieben',preview}; }

    // import
    const importSteps=[[1,'Quelle & Datei'],[2,'Spaltenzuordnung'],[3,'Vorschau & Import']].map(([n,label])=>({n,label,bg:S.importStep===n?'var(--accent-soft)':'transparent',dotBg:S.importStep>n?'var(--ok)':S.importStep===n?'var(--accent)':'var(--surface2)',dotColor:S.importStep>=n?'#fff':'var(--muted)',color:S.importStep===n?'var(--accent)':'var(--ink)'}));
    const importSources=[{id:'school',label:'Berufsschul-CSV',desc:'Lernende pro Schule. Quelle der Wahrheit, wird nie im Tool editiert.',file:'lernende_bbz_olten_2026-09.csv'},{id:'excel',label:'Planungs-Excel',desc:'Einmalige Übernahme der bisherigen Planung mit Bereinigungsbericht.',file:'Kursplanung_2026.xlsx'},{id:'certs',label:'Zertifikatsliste',desc:'Zertifikate der Ausbilder mit Ausstell- und Ablaufdatum.',file:'zertifikate_export.xlsx'}].map(s=>({...s,border:S.importSource===s.id?'var(--accent)':'var(--line)',pick:()=>this.setState({importSource:s.id})}));
    const mappingRows=[{src:'SchuelerNr',sample:'2026-EFZ-0104',target:'Externe ID'},{src:'Vorname',sample:'Nikola',target:'Vorname'},{src:'Name',sample:'Tesla',target:'Nachname'},{src:'Geb',sample:'10.07.2008',target:'Geburtsdatum'},{src:'Ausbildung',sample:'Logistiker EFZ',target:'Track'},{src:'Lehrbeginn',sample:'2026',target:'Jahrgang'},{src:'Betrieb',sample:'Migros Verteilbetrieb',target:'Lehrbetrieb'},{src:'Klasse',sample:'LO26a',target:'— ignorieren —'}];
    const importIssues=[{row:17,msg:'Geburtsdatum «31.02.2008» ungültig – Zeile wird ohne Datum übernommen',kind:'Warnung',color:'var(--warn)'},{row:44,msg:'Zeile entspricht 2025-EFZ-0412 Albert Einstein – Datensatz wird aktualisiert, nicht dupliziert',kind:'Hinweis',color:'var(--muted)'},{row:98,msg:'Ausbildung «Logistiker EFZ/EBA» nicht eindeutig – Track manuell wählen',kind:'Fehler',color:'var(--bad)'}];
    // settings
    const hardRules=['Ausbilder hält alle vom Kurstyp geforderten Skills','Alle geforderten Zertifikate an jedem Kurstag gültig','Qualifikation für jeden benötigten Gerätetyp','Ausbilder spricht die Kurssprache','Verfügbar an allen Kurstagen – keine Überschneidung, keine Abwesenheit','Gerät am Standort, nicht reserviert, nicht in Wartung','Kurs liegt im Zeitfenster seines ÜK-Moduls'];
    const softRules=[{label:'Heimstandort / gleiche Sprachregion / andere Region',weight:'+30 / +12 / −10'},{label:'Bevorzugter Standort laut Präferenzen',weight:'+8'},{label:'Kontinuität mit dem Jahrgang',weight:'+10'},{label:'Festangestellt statt Freelancer',weight:'+5'},{label:'Offener Ferienantrag in der Kurswoche',weight:'−15'}];
    const accentCur=this.props.accent??S.accent;
    const accentOptions=[['Blau','oklch(0.45 0.13 250)'],['Rot','oklch(0.45 0.13 25)'],['Grün','oklch(0.45 0.13 150)'],['Anthrazit','oklch(0.45 0.02 80)']].map(([label,color])=>({label,color,active:accentCur===label,ring:accentCur===label?'var(--ink)':'transparent',pick:()=>this.setState({accent:label})}));
    const densCur=this.props.density??S.density; const fontCur=this.props.font??S.font;
    const seg=(cur,list,key)=>list.map(v=>({label:v,active:cur===v,bg:cur===v?'var(--accent)':'var(--surface)',color:cur===v?'var(--accent-ink)':'var(--ink)',pick:()=>this.setState({[key]:v})}));
    const roleRows=[{role:'Planung',sees:'Alles',edits:'Kurse, Zuweisungen, Geräte, Ferienfreigaben, Importe, Stammdaten, Regelkonfiguration, Nutzer und Rollen'},{role:'Sales',sees:'Kurse, Kapazität, Kunden, Teilnehmer',edits:'Bedarf Erwachsenenkurse, Kundenbuchungen'},{role:'Ausbilder',sees:'Eigene Einsätze, Zertifikate, Verfügbarkeit',edits:'eigene Ferienanträge'},{role:'Lehrmeister (extern)',sees:'Eigene Lernende und deren Kurse',edits:'Anmeldung eigener Lernender'}];
    // portal
    const me=S.role==='Ausbilder'?this.instr('i1'):(S.instrId?this.instr(S.instrId):null);
    const roleOf=c=>c.instr===me.id?'lead':(c.backup===me.id?'backup':null);
    const roleMeta={lead:{roleLabel:'Leitung',color:'var(--accent)',soft:'var(--accent-soft)'},backup:{roleLabel:'Stellvertretung',color:'var(--alt)',soft:'var(--alt-soft)'}};
    const fmtLong=d=>d.getDate()+'.'+(d.getMonth()+1)+'.'+d.getFullYear();
    const myCourses=me?S.courses.filter(c=>roleOf(c)).sort((a,b)=>a.kw-b.kw||a.off-b.off):[];
    const myAssignments=myCourses.map(c=>{ const ds=this.courseDays(c); const rm=roleMeta[roleOf(c)]; const bl=this.blocksOf(c); return {...courseView(c),room:c.room||'Raum n. n.',roomsLabel:[...new Set(bl.map(b=>b.room))].join(' + ')+(bl.length>1?' ('+bl.length+' Blöcke)':''),dateRange:ds.length>1?this.fmt(ds[0])+' – '+fmtLong(ds[ds.length-1]):fmtLong(ds[0]),roleLabel:rm.roleLabel,roleColor:rm.color,roleSoft:rm.soft}; });
    const today=new Date(2026,8,18);
    const myMaint=me?this.maintenance(me).map(m=>{ const monthsLeft=12-today.getMonth(); const color=m.ok?'var(--ok)':m.open>monthsLeft?'var(--bad)':'var(--warn)'; return {...m,color,soft:m.ok?'var(--ok-soft)':m.open>monthsLeft?'var(--bad-soft)':'var(--warn-soft)',statusLabel:m.ok?'erfüllt':m.open+' offen · '+monthsLeft+' Monate',histPct:Math.min(100,Math.round(100*m.hist/m.min)),plannedPct:Math.min(100-Math.min(100,Math.round(100*m.hist/m.min)),Math.round(100*m.planned/m.min)),openLabel:m.ok?'Pflicht erfüllt':m.open+' noch offen bis 31.12.2026',showAsk:!m.ok,ask:()=>this.toast('Anfrage an die Planung gesendet: '+m.open+' × '+m.types.map(t=>T[t].code).join('/')+' bis Jahresende')}; }):[];
    const myAssignCount=myCourses.filter(c=>roleOf(c)==='lead').length, myBackupCount=myCourses.filter(c=>roleOf(c)==='backup').length;
    const sameDay=(a,b)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
    const eventsOn=d=>myCourses.flatMap(c=>{ const ds=this.courseDays(c); const idx=ds.findIndex(x=>sameDay(x,d)); if(idx<0) return []; const t=T[c.type]; const rm=roleMeta[roleOf(c)]; const bl=this.blocksOf(c); return [{code:t.code,name:t.name,locName:this.loc(c.loc).name,room:c.room||'Raum n. n.',blocks:bl,time:bl[0].time.split('–')[0]+'–'+bl[bl.length-1].time.split('–')[1],dayNo:idx+1,dayTotal:ds.length,enrolled:c.enrolled,...rm,title:t.code+' '+t.name+' · '+this.loc(c.loc).name+' '+(c.room||''),goWeek:()=>this.setState({calView:'week',calKw:this.kwOfDate(d)})}]; });
    const absOn=d=>{ const a=me?S.absences.find(x=>x.instr===me.id&&x.kw===this.kwOfDate(d)&&x.status!=='abgelehnt'):null; return a?a.kind+' ('+a.status+')':null; };
    const WD=['So','Mo','Di','Mi','Do','Fr','Sa'];
    const mon=this.monday(S.calKw);
    const days=[0,1,2,3,4,5].map(i=>{ const d=this.addDays(mon,i); const isToday=sameDay(d,today); return {wd:WD[d.getDay()],date:this.fmt(d),isToday,bg:isToday?'var(--accent-soft)':'transparent',color:isToday?'var(--accent)':'var(--ink)',events:eventsOn(d),absence:absOn(d)}; });
    const mStart=new Date(2026,S.calMonth,1); const gridStart=this.addDays(mStart,-((mStart.getDay()+6)%7)); const cells=[];
    for(let i=0;i<42;i++){ const d=this.addDays(gridStart,i); if(i>=35&&d.getMonth()!==S.calMonth) break; const inM=d.getMonth()===S.calMonth; const isToday=sameDay(d,today); const kw=this.kwOfDate(d); cells.push({day:d.getDate(),opacity:inM?1:0.45,weight:isToday?600:400,color:isToday?'var(--accent)':'var(--ink)',bg:isToday?'var(--accent-soft)':d.getDay()===0||d.getDay()===6?'var(--bg)':'transparent',kwLabel:d.getDay()===1?'KW '+kw:null,goWeek:()=>this.setState({calView:'week',calKw:kw}),events:eventsOn(d),absence:d.getDay()>=1&&d.getDay()<=5?absOn(d):null}); }
    const MON=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
    const isWeek=S.calView==='week';
    const cal={isWeek,isMonth:!isWeek,days,cells,weekdays:['Mo','Di','Mi','Do','Fr','Sa','So'],
      title:isWeek?'KW '+S.calKw:MON[S.calMonth]+' 2026',subtitle:isWeek?this.fmt(mon)+' – '+fmtLong(this.addDays(mon,5)):'KW '+this.kwOfDate(mStart)+' – KW '+this.kwOfDate(new Date(2026,S.calMonth+1,0)),
      prev:()=>isWeek?this.setState({calKw:Math.max(36,S.calKw-1)}):this.setState({calMonth:Math.max(8,S.calMonth-1)}),next:()=>isWeek?this.setState({calKw:Math.min(52,S.calKw+1)}):this.setState({calMonth:Math.min(11,S.calMonth+1)}),today:()=>this.setState({calKw:38,calMonth:8}),
      setWeek:()=>this.setState({calView:'week'}),setMonth:()=>this.setState({calView:'month',calMonth:this.monday(S.calKw).getMonth()}),weekBg:isWeek?'var(--accent)':'var(--surface)',weekColor:isWeek?'var(--accent-ink)':'var(--ink)',monthBg:!isWeek?'var(--accent)':'var(--surface)',monthColor:!isWeek?'var(--accent-ink)':'var(--ink)'};
    const meV=me?{...instrView(me),prefLocs:me.pref,maxTravel:me.maxTravel}:null;
    const myCerts=me?me.certs.map(c=>{const st=this.certStatus(c); return {name:D.certTypes[c.t].name,issuer:D.certTypes[c.t].issuer,until:this.fmtIso(c.until),color:this.col(st),status:st==='ok'?'gültig':st==='warn'?'läuft bald ab':'abgelaufen',renew:()=>this.toast('Erneuerung gemeldet – die Planung prüft den Nachweis')};}):[];
    const myAbs=me?S.absences.filter(a=>a.instr===me.id).map(a=>({kind:a.kind,range:'KW '+a.kw,status:a.status,pending:a.status==='beantragt',color:a.status==='beantragt'?'var(--warn)':a.status==='abgelehnt'?'var(--bad)':'var(--muted)',withdraw:()=>{ this.setState({absences:S.absences.filter(x=>x.id!==a.id),vacMsg:''}); this.toast('Antrag zurückgezogen'); }})):[];
    const myWeekCells=me?weeks.map(w=>{ const cs=S.courses.filter(c=>c.instr===me.id&&this.courseDays(c).some(d=>this.kwOfDate(d)===w.kw)); const ab=S.absences.find(a=>a.instr===me.id&&a.kw===w.kw&&a.status!=='abgelehnt'); if(cs.length) return {kw:w.kw,label:cs.map(c=>T[c.type].code+' '+this.loc(c.loc).name).join(', '),bg:'var(--accent-soft)',color:'var(--accent)'}; if(ab) return {kw:w.kw,label:ab.kind+' ('+ab.status+')',bg:ab.status==='beantragt'?'var(--warn-soft)':'var(--surface2)',color:ab.status==='beantragt'?'var(--warn)':'var(--muted)'}; return {kw:w.kw,label:'frei',bg:'var(--ok-soft)',color:'var(--ok)'}; }):[];
    const vacClash=me?S.courses.find(c=>c.instr===me.id&&this.courseDays(c).some(d=>this.kwOfDate(d)===S.vacKw)):null;
    const vacHint=vacClash?'Achtung: In KW '+S.vacKw+' bist du für '+T[vacClash.type].code+' '+this.loc(vacClash.loc).name+' eingeplant. Die Planung muss den Kurs umbesetzen.':'KW '+S.vacKw+' ist frei von Einsätzen.';
    // drawer
    let sel=null; const sc=S.selCourse?S.courses.find(c=>c.id===S.selCourse):null;
    if(sc){ const v=courseView(sc); const t=T[sc.type]; const cands=this.candidates(sc); const feasible=cands.filter(x=>x.r.ok);
      const devRows=this.deviceCheck(sc).map(d=>({n:d.n,type:d.type,avail:d.free+' von '+d.total+' frei'+(d.maint?' · '+d.maint+' in Wartung':'')+(d.reserved?' · '+d.reserved+' reserviert':''),color:d.ok?'var(--ok)':'var(--bad)'}));
      const devOk=devRows.every(d=>d.color==='var(--ok)');
      let instrV=null; if(sc.instr){ const i=this.instr(sc.instr); const r=this.check(sc,i); instrV={...instrView(i),verdict:r.ok?'machbar · Score '+r.score:'nicht machbar',verdictColor:r.ok?'var(--ok)':'var(--bad)',checks:r.hard.map(h=>({label:h.label,reason:h.reason,color:h.ok?'var(--ok)':'var(--bad)'}))}; }
      const alternatives=[]; if(!feasible.length){ D.locs.filter(l=>l.uk&&l.id!==sc.loc).forEach(l=>{ const alt={...sc,loc:l.id}; const n=this.candidates(alt).filter(x=>x.r.ok).length; if(n) alternatives.push({label:'Nach '+l.name+' verschieben – '+n+' machbare Ausbilder',action:'Verschieben',apply:()=>this.moveCourse(sc.id,sc.kw,l.id)}); }); ['D','F','I'].filter(x=>x!==sc.lang).forEach(lg=>{ const alt={...sc,lang:lg}; const n=this.candidates(alt).filter(x=>x.r.ok).length; if(n) alternatives.push({label:'Kurssprache '+({D:'Deutsch',F:'Französisch',I:'Italienisch'})[lg]+' – '+n+' machbare Ausbilder',action:'Sprache ändern',apply:()=>{ this.setState({courses:S.courses.map(c=>c.id===sc.id?{...c,lang:lg}:c),audit:this.addAudit(sc.id,'hat die Kurssprache auf '+lg+' geändert.')}); this.toast('Kurssprache geändert'); }}); }); }
      sel={...v,days:this.dayRange(sc),timeWindow:sc.cohort?sc.cohort+' · Semester '+t.sem:null,instr:instrV,noInstr:!sc.instr,devRows,noDevs:!devRows.length,devSummary:devRows.length?(devOk?'alle verfügbar':'Engpass'):'',devColor:devOk?'var(--ok)':'var(--bad)',feasibleCount:feasible.length,candTotal:cands.length,noFeasible:!feasible.length,alternatives:alternatives.slice(0,3),
        cands:cands.filter(x=>x.i.id!==sc.instr).slice(0,6).map(x=>({...instrView(x.i),feasible:x.r.ok,infeasible:!x.r.ok,score:x.r.score,opacity:x.r.ok?1:0.7,reasons:x.r.ok?x.r.soft.slice(0,3):x.r.hard.filter(h=>!h.ok).map(h=>({text:h.label+': '+h.reason,color:'var(--bad)'})),assign:()=>this.assign(sc.id,x.i.id)})),
        audit:(S.audit[sc.id]||[]).slice().reverse(),unassign:()=>{ this.setState({courses:S.courses.map(c=>c.id===sc.id?{...c,instr:null}:c),audit:this.addAudit(sc.id,'hat die Zuweisung aufgehoben.')}); this.toast('Zuweisung aufgehoben'); },
        canConfirm:sc.instr&&sc.status==='geplant'&&!this.hasConflict(sc),confirm:()=>{ this.setState({courses:S.courses.map(c=>c.id===sc.id?{...c,status:'bestätigt'}:c),audit:this.addAudit(sc.id,'hat den Kurs bestätigt.')}); this.toast('Kurs bestätigt'); },
        askAssistant:()=>this.ask('Wer kann '+t.code+' in '+this.loc(sc.loc).name+' KW '+this.kwLabel(sc.kw)+' übernehmen?'),cancelLabel:'Kurs absagen',cancel:()=>{ if(!window.confirm('Kurs '+t.code+' '+this.loc(sc.loc).name+' KW '+this.kwLabel(sc.kw)+' absagen? '+sc.enrolled+' Teilnehmende erhalten einen Folgetermin, Ressourcen werden freigegeben.')) return; this.setState({courses:S.courses.filter(c=>c.id!==sc.id),selCourse:null}); this.toast('Kurs abgesagt – '+sc.enrolled+' Folgeanmeldungen erstellt'); }}; }
    // new course
    let newCourse=null; if(S.newCourse){ const n=S.newCourse; const t=T[n.type]; const tmp={id:'tmp',type:n.type,loc:n.loc,kw:+n.kw,off:0,lang:n.lang,status:'geplant',instr:null,enrolled:0,cohort:n.cohort||null}; const feas=this.candidates(tmp).filter(x=>x.r.ok).length; const dev=this.deviceCheck(tmp); newCourse={...n,preview:t.days+(t.days===1?' Kurstag':' Kurstage')+' · '+feas+' machbare Ausbilder · Geräte: '+(dev.length?(dev.every(d=>d.ok)?'verfügbar':'Engpass'):'keine nötig')}; }
    const messages=S.messages.map(m=>({...m,align:m.who==='me'?'flex-end':'flex-start',bg:m.who==='me'?'var(--accent)':'var(--surface2)',color:m.who==='me'?'var(--accent-ink)':'var(--ink)',card:m.card?{...m.card,chipsShown:!!(m.card.chips&&m.card.chips.length),actionsShown:!!(m.card.actions&&m.card.actions.length)}:null}));
    const suggestions=['Ersatz für Roger Federer','Wer kann ÜK 7 in Rupperswil übernehmen?','Wann kann Ada Lovelace ÜK 3 nachholen?','Kontakt von Lara Gut-Behrami','Welche Zertifikate laufen ab?','Welche Kurse sind unbesetzt?','Wo sind Geräte-Engpässe?'].map(q=>({label:q,ask:()=>this.ask(q)}));
    const accounts=[{role:'Planung',email:'planung@svbl.ch',name:'Mia Keller'},{role:'Ausbilder',email:'roger.federer@svbl.ch',name:'Roger Federer'}];
    const doLogin=(email)=>{ const a=accounts.find(x=>x.email===email.trim().toLowerCase()); if(!a){ this.setState({loginError:'Kein Konto mit dieser E-Mail. Nutze eines der Demo-Konten.'}); return; } this.setState({authed:true,role:a.role,userName:a.name,loginError:'',screen:a.role==='Ausbilder'?'assignments':'dashboard'}); };
    return {
      notAuthed:!S.authed, authed:S.authed, email:S.email, pw:S.pw, loginError:S.loginError,
      setEmail:e=>this.setState({email:e.target.value}), setPw:e=>this.setState({pw:e.target.value}),
      login:e=>{ e.preventDefault(); if(!S.email){ this.setState({loginError:'Bitte E-Mail eingeben.'}); return; } doLogin(S.email); },
      demoAccounts:accounts.map(a=>({...a,pick:()=>this.setState({email:a.email,pw:'demo-2026',loginError:''})})),
      logout:()=>this.setState({authed:false,email:'',pw:'',selCourse:null,assistantOpen:false}),
      role:S.role, setRole:e=>{ const r=e.target.value; const a=accounts.find(x=>x.role===r); this.setState({role:r,userName:a.name,instrId:null,selCourse:null}); }, userName:S.userName, userInitials:this.initials(S.userName||'SV'),
      nav, screen, screenTitle:titles[screen], todayLabel:'Do 18.9.2026 · KW 38', readOnly:!canEdit, canEdit, show,
      assistantOpen:S.assistantOpen, assistantVisible:S.assistantOpen&&canEdit, assistantBtnBg:S.assistantOpen?'var(--accent-soft)':'var(--surface)', toggleAssistant:()=>this.setState({assistantOpen:!S.assistantOpen}),
      quickActions, warnDays:S.warnDays, doneTasks:S.doneTasks, hasDone:!!S.doneTasks.length,
      dashRuns:S.runs.map(r=>{ const p=D.periods.find(x=>x.id===r.period); const done=r.committed?4:r.courses?3:r.demand?2:1; const planned=r.courses?r.courses.filter(c=>c.kw&&!c.noType&&!c.blocked).length:0;
        return {label:p.label,status:r.committed?'übernommen':r.demand?'in Arbeit':'neu',color:r.committed?'var(--ok)':r.demand?'var(--accent)':'var(--muted)',
          meta:r.demand?(r.demand.reduce((s,d)=>s+d.need,0)+' Kurse nötig'+(r.courses?' · '+planned+' terminiert':'')):p.months,
          dots:[1,2,3,4].map(n=>({color:n<=done?(r.committed?'var(--ok)':'var(--accent)'):'var(--line)',title:['Bedarf','Kurse & Termine','Ausbilder','Übernahme'][n-1]})),
          open:()=>this.setState({screen:'demand',activeRun:r.id})}; }),
      autoRows:S.autoLog.filter(x=>x.kind!=='Entscheidung nötig').slice(0,8), noAuto:!S.autoLog.filter(x=>x.kind!=='Entscheidung nötig').length,
      decisionRows:S.autoLog.filter(x=>x.kind==='Entscheidung nötig').map(d=>({text:d.text,why:d.why,label:d.courseId?'Kurs öffnen':'Kurs anlegen',run:()=>{ if(d.courseId) this.setState({selCourse:d.courseId}); else { const k=Object.keys(T).find(x=>T[x].code===d.module); this.setState({newCourse:{type:k||'UK01',loc:'RUP',kw:42,lang:'D',cohort:null}}); } }})),
      hasDecisions:!!S.autoLog.filter(x=>x.kind==='Entscheidung nötig').length,
      instrOptions, apprOptions, absDialog, closeAbs:()=>this.setState({absDialog:null}), setAbsInstr:e=>this.setState({absDialog:{...S.absDialog,instr:e.target.value}}), setAbsKw:e=>this.setState({absDialog:{...S.absDialog,kw:+e.target.value}}), setAbsKind:e=>this.setState({absDialog:{...S.absDialog,kind:e.target.value}}),
      submitAbs:e=>{ e.preventDefault(); const d=S.absDialog; const abs={id:'a'+Date.now(),instr:d.instr,kw:+d.kw,kind:d.kind,status:'blockiert'}; const absences=[...S.absences,abs];
        const affected=S.courses.filter(c=>c.instr===d.instr&&this.courseDays(c).some(x=>this.kwOfDate(x)===+d.kw)).map(c=>c.id);
        const log=[{kind:'Absenz',text:this.instr(d.instr).name+': '+d.kind+' in KW '+this.kwLabel(+d.kw),why:affected.length?affected.length+' Einsatz'+(affected.length>1?'e':'')+' betroffen – Ersatz wird vorgeschlagen':'Keine Einsätze in dieser Woche',color:'var(--accent)'}];
        this.setState({absences,absDialog:null,autoLog:[...log,...S.autoLog],propDialog:affected.length?{kind:'absence',queue:affected,qi:0,opt:0,instr:d.instr}:null});
        if(!affected.length) this.toast('Absenz erfasst – keine Einsätze betroffen'); },
      noShowDialog, closeNoShow:()=>this.setState({noShowDialog:null}), setNoShowAppr:e=>this.setState({noShowDialog:{appr:e.target.value,module:''}}), setNoShowModule:e=>this.setState({noShowDialog:{...S.noShowDialog,module:e.target.value}}),
      submitNoShow:e=>{ e.preventDefault(); const d=noShowDialog; const a=S.apprentices.find(x=>x.id===d.appr);
        const log=[{kind:'Nichterscheinen',text:a.name+' hat '+d.module+' verpasst',why:'Folgetermin wird vorgeschlagen',color:'var(--accent)'}];
        this.setState({apprentices:S.apprentices.map(x=>x.id===d.appr?{...x,missed:d.module}:x),noShowDialog:null,autoLog:[...log,...S.autoLog],propDialog:{kind:'noshow',appr:d.appr,module:d.module,opt:0}}); },
      boardIsWeek:S.boardView==='week', boardIsMonth:S.boardView==='month', boardSetWeek:()=>this.setState({boardView:'week'}), boardSetMonth:()=>this.setState({boardView:'month'}),
      boardWeekBg:S.boardView==='week'?'var(--accent)':'var(--surface)', boardWeekColor:S.boardView==='week'?'var(--accent-ink)':'var(--ink)', boardMonthBg:S.boardView==='month'?'var(--accent)':'var(--surface)', boardMonthColor:S.boardView==='month'?'var(--accent-ink)':'var(--ink)',
      boardWeekdays:['Mo','Di','Mi','Do','Fr','Sa','So'], boardMonthLabel:['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'][S.boardMonth%12]+' '+(2026+Math.floor(S.boardMonth/12)),
      boardPrev:()=>this.setState({boardMonth:Math.max(8,S.boardMonth-1)}), boardNext:()=>this.setState({boardMonth:Math.min(29,S.boardMonth+1)}),
      boardCells:(()=>{ const mStart=new Date(2026,S.boardMonth,1); const gs=this.addDays(mStart,-((mStart.getDay()+6)%7)); const out=[]; const sd=(a,b)=>a.toDateString()===b.toDateString(); const today=new Date(2026,8,18);
        for(let i=0;i<42;i++){ const d=this.addDays(gs,i); if(i>=35&&d.getMonth()!==S.boardMonth) break; const inM=d.getMonth()===S.boardMonth; const items=S.courses.filter(c=>(S.filterLoc===''||(S.filterLoc==='UK'?this.loc(c.loc).uk:c.loc===S.filterLoc))&&this.courseDays(c).some(x=>sd(x,d))).map(c=>({code:T[c.type].code,locName:this.loc(c.loc).name,color:this.statusColor(c),title:T[c.type].code+' '+T[c.type].name+' · '+this.loc(c.loc).name+' · '+(c.instr?this.instr(c.instr).name:'ohne Ausbilder'),open:()=>this.setState({selCourse:c.id})}));
          out.push({day:d.getDate(),opacity:inM?1:0.45,weight:sd(d,today)?600:400,color:sd(d,today)?'var(--accent)':'var(--ink)',bg:sd(d,today)?'var(--accent-soft)':(d.getDay()===0||d.getDay()===6?'var(--bg)':'transparent'),kwLabel:d.getDay()===1?'KW '+this.kwOfDate(d):null,items}); }
        return out; })(),
      intakeKpis:(()=>{ const year=per.year;
        const withData=D.schools.filter(s=>s.imports&&s.imports[year]); const newCount=withData.reduce((a,s)=>a+s.imports[year].newCount,0);
        const plannedCodes=S.courses.map(c=>T[c.type].code);
        const unassigned=S.apprentices.filter(a=>!a.cur).length;
        const openC=S.courses.filter(c=>!c.instr).length;
        return [
          {label:'Neue Lernende gemeldet',value:newCount,unit:'Schuljahr '+year,color:'var(--ink)'},
          {label:'Schulen mit neuen Daten',value:withData.length+' / '+D.schools.length,unit:(D.schools.length-withData.length)+' ausstehend',color:withData.length<D.schools.length?'var(--warn)':'var(--ok)',action:{label:'Zum Import',run:()=>this.go('import')}},
          {label:'Lernende ohne eingeteiltes ÜK',value:unassigned,unit:'von '+S.apprentices.length+' im System',color:unassigned?'var(--warn)':'var(--ok)'},
          {label:'Kurse ohne Ausbilder',value:openC,unit:'im Zeitplan',color:openC?'var(--warn)':'var(--ok)',action:openC?{label:'Zum Zeitplan',run:()=>this.go('board')}:null}]; })(),
      runRows, noRuns:!S.runs.length, activeRun:!!run, noActiveRun:!run, closeRun:()=>this.setState({activeRun:null}),
      planPeriodLabel:per.label, planPeriodMonths:per.months, planRunCreated:run?run.created:'',
      openRunDialog:()=>{ const years=[...new Set(D.periods.map(p=>p.year))]; const y=years[0]; this.setState({runDialog:{year:y,period:D.periods.find(p=>p.year===y).id,years}}); },
      runDialog:S.runDialog&&(()=>{ const years=[...new Set(D.periods.map(p=>p.year))]; const ps=D.periods.filter(p=>p.year===S.runDialog.year); const dup=S.runs.some(r=>r.period===S.runDialog.period); const p=D.periods.find(x=>x.id===S.runDialog.period);
        return {...S.runDialog,years,periods:ps,hint:dup?'Für '+p.label+' existiert bereits ein Lauf – er wird nicht überschrieben.':'Der Bedarf wird im ersten Schritt aus den Jahrgängen und dem Bildungsplan erzeugt. Zeitfenster: '+p.months+'.',hintColor:dup?'var(--warn)':'var(--muted)'}; })(),
      closeRunDialog:()=>this.setState({runDialog:null}), setRunYear:e=>{ const y=e.target.value; this.setState({runDialog:{...S.runDialog,year:y,period:D.periods.find(p=>p.year===y).id}}); }, setRunPeriod:e=>this.setState({runDialog:{...S.runDialog,period:e.target.value}}),
      submitRun:e=>{ e.preventDefault(); const id='r'+Date.now(); const p=D.periods.find(x=>x.id===S.runDialog.period); this.setState({runs:[...S.runs,{id,period:S.runDialog.period,created:'18.9.2026',stage:1,demand:null,courses:null,committed:false}],activeRun:id,runDialog:null}); this.toast('Planungslauf '+p.label+' angelegt'); },
      planSteps, planStep1:stage===1, planStep2:stage===2, planStep3:stage===3, planStep4:stage===4,
      planGenerate:()=>{ const rows=this.genDemand(run.period); patchRun({demand:rows,courses:null}); this.toast(rows.reduce((s,d)=>s+d.need,0)+' Kurse nötig für '+per.label); },
      hasDemand:!!pd, noDemand:!pd, demandRows, demandKpis,
      planNext:()=>{ if(stage===1){ const rows=this.proposeCourses(pd,run.period); patchRun({courses:rows,stage:2}); } else patchRun({stage:stage+1}); },
      planBack:()=>patchRun({stage:Math.max(1,stage-1)}),
      fixDialog:(()=>{ if(!S.fixDialog||!pc) return null; const c=pc.find(x=>x.id===S.fixDialog.id); if(!c) return null;
        const opts=this.fixOptions(c,pc); const i=Math.min(S.fixDialog.idx,opts.length-1); const o=opts[i];
        const subject=c.code+' · '+this.loc(c.loc).name+(c.kw?' · KW '+this.kwLabel(c.kw):'')+' · '+c.cohort;
        const problem=c.noType?'Für dieses Modul ist kein Kurstyp hinterlegt.':(c.blocked||(!c.cand?'Kein Ausbilder erfüllt alle harten Regeln für diesen Kurs.':'Konflikt gelöst.'));
        return {subject,problem,title:o.title,why:o.why,effect:o.effect,n:i+1,total:opts.length,canApply:!!(o.patch||o.split),manualOnly:!(o.patch||o.split),
          other:()=>this.setState({fixDialog:{...S.fixDialog,idx:(i+1)%opts.length}}),
          apply:()=>{ if(!o.patch&&!o.split) return; let rows;
            if(o.split){ const s=o.split;
              const partA={...c,days:s.a,kw:s.sa.kw,off:s.sa.off,room:s.sa.room,blocked:null,code:c.code+' (1/2)'};
              const partB={...c,id:c.id+'-b',days:s.b,kw:s.sb.kw,off:s.sb.off,room:s.sb.room,blocked:null,code:c.code+' (2/2)'};
              rows=pc.flatMap(x=>x.id===c.id?[partA,partB]:[x]);
              rows=rows.map(x=>{ if(x.id!==partA.id&&x.id!==partB.id) return x; const r=this.bestCand(x,rows); return {...x,cand:r.best?{id:r.best.i.id,name:r.best.i.name,score:r.best.r.score,why:'Teilblock'}:null,candCount:r.count}; });
              patchRun({courses:rows}); this.setState({fixDialog:null}); this.toast('Kurs in zwei Blöcke geteilt'); return; }
            rows=pc.map(x=>x.id===c.id?{...x,...o.patch,blocked:null}:x);
            if(o.patch.rentDevice){ const type=T[c.type]; const add=type.devs.map((d,k)=>({id:'MIETE-'+c.loc+'-'+Date.now()+k,type:d.t,loc:c.loc,status:'verfügbar',mobility:'miete',from:o.patch.kw,until:o.patch.kw,vendor:'Rent-a-Lift AG'})); this.setState({devices:[...S.devices,...add]}); }
            const target=rows.find(x=>x.id===c.id);
            if(!target.cand&&target.kw&&target.type){ const r=this.bestCand(target,rows); rows=rows.map(x=>x.id===c.id?{...x,cand:r.best?{id:r.best.i.id,name:r.best.i.name,score:r.best.r.score,why:r.best.r.soft.filter(s=>s.color==='var(--ok)').slice(0,2).map(s=>s.text.replace(/\s\(.*\)/,'')).join(' · ')}:null,candCount:r.count}:x); }
            patchRun({courses:rows}); this.setState({fixDialog:null}); this.toast('Vorschlag übernommen: '+o.title); }}; })(),
      closeProp:()=>this.setState({propDialog:null}),
      propDialog:(()=>{ const p=S.propDialog; if(!p) return null;
        if(p.kind==='absence'){
          const cid=p.queue[p.qi]; const c=S.courses.find(x=>x.id===cid); if(!c) return null; const t=T[c.type]; const old=this.instr(p.instr);
          const cands=this.candidates({...c,instr:null}).filter(x=>x.r.ok&&x.i.id!==p.instr);
          const topScore=cands.length?cands[0].r.score:0;
          const opts=cands.slice(0,4).map((x,xi)=>({title:x.i.name+' übernimmt',why:xi===0?'Erfüllt alle harten Regeln an den Kurstagen und hat den höchsten Score.':'Alternative mit Score '+x.r.score+', '+(topScore-x.r.score)+' Punkte unter dem Bestvorschlag – alle harten Regeln sind erfüllt.',effect:['Score '+x.r.score+' · '+x.i.emp+' · Heimstandort '+this.loc(x.i.loc).name,...x.r.soft.filter(s=>s.color==='var(--ok)').slice(0,2).map(s=>s.text)],run:()=>{ this.setState({courses:S.courses.map(y=>y.id===c.id?{...y,instr:x.i.id}:y),autoLog:[{kind:'Umbesetzt',text:t.code+' '+this.loc(c.loc).name+' KW '+this.kwLabel(c.kw)+': '+x.i.name+' statt '+old.name,why:'Score '+x.r.score,color:'var(--ok)'},...S.autoLog]}); }}));
          const o=opts.length?opts[Math.min(p.opt,opts.length-1)]:null;
          const advance=()=>{ if(p.qi+1<p.queue.length) this.setState({propDialog:{...p,qi:p.qi+1,opt:0}}); else { this.setState({propDialog:null}); this.toast('Absenz eingeplant'); } };
          return {kindLabel:'Absenz',kindColor:'var(--warn)',subject:t.code+' · '+this.loc(c.loc).name+' · KW '+this.kwLabel(c.kw),queueLabel:p.queue.length>1?'Einsatz '+(p.qi+1)+' von '+p.queue.length:null,
            problem:old.name+' fällt aus: '+this.dayRange(c)+' · '+c.enrolled+' Teilnehmende betroffen',
            n:opts.length?Math.min(p.opt,opts.length-1)+1:0,total:opts.length,hasMore:opts.length>1,canApply:!!o,noOption:!opts.length,
            title:o?o.title:'Kein machbarer Ersatz',why:o?o.why:'Kein Ausbilder erfüllt Skills, Zertifikate, Sprache und Verfügbarkeit an diesen Tagen.',
            effect:o?o.effect:['Kurs bleibt unbesetzt und erscheint unter «Braucht eine Entscheidung»','Kurs verschieben oder Sprache ändern','Externen Ausbilder beauftragen'],
            other:()=>this.setState({propDialog:{...p,opt:(p.opt+1)%Math.max(1,opts.length)}}), skipLabel:'Offen lassen',
            skip:()=>{ this.setState({autoLog:[{kind:'Entscheidung nötig',text:t.code+' '+this.loc(c.loc).name+' KW '+this.kwLabel(c.kw)+' ist unbesetzt',why:'Ersatz wurde offen gelassen',color:'var(--bad)',courseId:c.id},...S.autoLog],courses:S.courses.map(y=>y.id===c.id?{...y,instr:null}:y)}); advance(); },
            apply:()=>{ if(!o) return; o.run(); advance(); }};
        }
        const a=S.apprentices.find(x=>x.id===p.appr); if(!a) return null;
        const today0=new Date(2026,8,18); const list=S.courses.filter(c=>T[c.type].code===p.module&&c.enrolled<T[c.type].max&&c.lang===a.lang&&this.courseDays(c)[0]>today0).sort((x,y)=>x.kw-y.kw).slice(0,4);
        const home=(D.schools.find(s=>s.name===a.school)||{}).loc;
        const opts=list.map(c=>({title:p.module+' in '+this.loc(c.loc).name+', KW '+this.kwLabel(c.kw),why:c.loc===home?'Standort nächst der Berufsschule, freier Platz, passende Sprache.':'Freier Platz und passende Sprache; Standort weiter entfernt als die nächste Berufsschule.',effect:[this.dayRange(c),'Belegung '+c.enrolled+'/'+T[c.type].max+' · Ausbilder '+(c.instr?this.instr(c.instr).name:'noch offen'),c.loc===home?'Kein Mehrweg für den Lernenden':'Anfahrt nach '+this.loc(c.loc).name],run:()=>{ this.setState({courses:S.courses.map(y=>y.id===c.id?{...y,enrolled:y.enrolled+1}:y),apprentices:S.apprentices.map(x=>x.id===a.id?{...x,cur:p.module,missed:null}:x),autoLog:[{kind:'Folgetermin',text:a.name+' → '+p.module+' in '+this.loc(c.loc).name+', KW '+this.kwLabel(c.kw),why:'Freier Platz, passende Sprache'+(c.loc===home?', Standort nächst der Berufsschule':''),color:'var(--ok)'},...S.autoLog],propDialog:null}); this.toast('Folgetermin vergeben'); }}));
        const o=opts.length?opts[Math.min(p.opt,opts.length-1)]:null;
        return {kindLabel:'Nichterscheinen',kindColor:'var(--alt)',subject:a.name+' · '+a.track+' '+a.cohort+' · '+a.school,queueLabel:null,
          problem:p.module+' verpasst · Sprache '+a.lang+' · Standard-Standort '+(home?this.loc(home).name:'–'),
          n:opts.length?Math.min(p.opt,opts.length-1)+1:0,total:opts.length,hasMore:opts.length>1,canApply:!!o,noOption:!opts.length,
          title:o?o.title:'Kein Kurs mit freiem Platz',why:o?o.why:'Für dieses Modul gibt es im Zeitraum keinen Kurs mit freiem Platz in der Sprache des Lernenden.',
          effect:o?o.effect:['Zusätzliche Durchführung anlegen','Oder Platz in einem bestehenden Kurs freigeben','Fall erscheint unter «Braucht eine Entscheidung»'],
          other:()=>this.setState({propDialog:{...p,opt:(p.opt+1)%Math.max(1,opts.length)}}), skipLabel:'Später',
          skip:()=>{ this.setState({noShows:[...S.noShows,{id:'n'+Date.now(),appr:a.id,module:p.module,course:'manuell erfasst'}],autoLog:[{kind:'Entscheidung nötig',text:a.name+' braucht '+p.module+', kein Kurs gewählt',why:'Zusätzliche Durchführung nötig',color:'var(--bad)',module:p.module,appr:a.id},...S.autoLog],propDialog:null}); this.toast('Fall zurückgestellt'); },
          apply:()=>{ if(o) o.run(); }};
      })(),
      closeFix:()=>this.setState({fixDialog:null}),
      planCourseRows, planCourseSummary:pc?okCourses.length+' von '+pc.length+' Kursen planbar · '+(pc.length-okCourses.length)+' brauchen eine Entscheidung':'',
      planStaffRows, planStaffSummary:pc?okCourses.filter(c=>c.cand).length+' von '+okCourses.length+' Kursen haben einen machbaren Ausbilder':'',
      planSummary, planCommitLabel:run&&run.committed?'Bereits übernommen':'Übernehmen: '+okCourses.length+' Kurse',
      planCommitDisabled:!!(run&&run.committed), planCommitBg:run&&run.committed?'var(--line2)':'var(--accent)', planCommitCursor:run&&run.committed?'default':'pointer',
      planCommitted:run&&run.committed?okCourses.length+' Kurse für '+per.label+' angelegt, '+okCourses.filter(c=>c.cand).length+' mit zugewiesenem Ausbilder.':null,
      planCommit:()=>{ if(!run||run.committed) return; const add=okCourses.map((c,i)=>({id:'pc'+Date.now()+i,type:c.type,loc:c.loc,kw:c.kw,off:c.off,lang:c.lang,status:c.cand?'geplant':'offen',instr:c.cand?c.cand.id:null,enrolled:c.seats,cohort:c.cohort,room:c.room})); this.setState({courses:[...S.courses,...add],runs:S.runs.map(r=>r.id===run.id?{...r,committed:true,stage:4}:r)}); this.toast(add.length+' Kurse in den Zeitplan übernommen'); },
      weeks, locs:D.locs, boardRows, filterLoc:S.filterLoc, setFilterLoc:e=>this.setState({filterLoc:e.target.value}), filterStatus:S.filterStatus, setFilterStatus:e=>this.setState({filterStatus:e.target.value}),
      coursesTabRuns:S.coursesTab==='runs', coursesTabTypes:S.coursesTab==='types', tabCoursesRuns:()=>this.setState({coursesTab:'runs'}), tabCoursesTypes:()=>this.setState({coursesTab:'types'}),
      coursesTabRunsBg:S.coursesTab==='runs'?'var(--accent)':'var(--surface)', coursesTabRunsColor:S.coursesTab==='runs'?'var(--accent-ink)':'var(--ink)', coursesTabTypesBg:S.coursesTab==='types'?'var(--accent)':'var(--surface)', coursesTabTypesColor:S.coursesTab==='types'?'var(--accent-ink)':'var(--ink)',
      courseRows, typeCards, openNewCourse:()=>this.setState({newCourse:{type:'UK05',loc:'RUP',kw:41,lang:'D',cohort:'2025 EFZ'}}),
      demandRows,
      instrSearch:S.instrSearch, setInstrSearch:e=>this.setState({instrSearch:e.target.value}), filterSkill:S.filterSkill, setFilterSkill:e=>this.setState({filterSkill:e.target.value}), filterLang:S.filterLang, setFilterLang:e=>this.setState({filterLang:e.target.value}), skills:D.skills, instrRows, instrCount:instrRows.length,
      instrDetail, noInstrDetail:!instrDetail, closeInstr:()=>this.setState({instrId:null,noteDraft:null,noteSaved:false}), instrTabs, instrTab,
      apprDetail, noApprDetail:!apprDetail, closeAppr:()=>this.setState({apprId:null}), apprTabs, apprTab,
      noteDraft:S.noteDraft!==null?S.noteDraft:(iSel?iSel.notes:''), setNoteDraft:e=>this.setState({noteDraft:e.target.value,noteSaved:false}),
      noteState:S.noteSaved?'gespeichert':(S.noteDraft!==null&&iSel&&S.noteDraft!==iSel.notes?'nicht gespeichert':''),
      saveNote:()=>{ if(!iSel||S.noteDraft===null||S.noteDraft===iSel.notes) return; this.setState({instrData:S.instrData.map(x=>x.id===iSel.id?{...x,notes:S.noteDraft}:x),noteSaved:true}); this.toast('Notiz gespeichert'); },
      readOnlyNote:!canEdit,
      openContactDialog:()=>this.setState({contactDialog:{id:iSel.id,name:iSel.name,email:iSel.email,phone:iSel.phone,travel:iSel.maxTravel,pref:iSel.pref}}), contactDialog:S.contactDialog, closeContactDialog:()=>this.setState({contactDialog:null}),
      setContactEmail:e=>this.setState({contactDialog:{...S.contactDialog,email:e.target.value}}), setContactPhone:e=>this.setState({contactDialog:{...S.contactDialog,phone:e.target.value}}), setContactTravel:e=>this.setState({contactDialog:{...S.contactDialog,travel:e.target.value}}), setContactPref:e=>this.setState({contactDialog:{...S.contactDialog,pref:e.target.value}}),
      submitContact:e=>{ e.preventDefault(); const d=S.contactDialog; this.setState({instrData:S.instrData.map(x=>x.id===d.id?{...x,email:d.email,phone:d.phone,maxTravel:d.travel,pref:d.pref}:x),contactDialog:null}); this.toast('Kontakt aktualisiert'); },
      openSkillDialog:()=>{ const opts=D.skills.filter(s=>!iSel.skills.includes(s)); this.setState({skillDialog:{id:iSel.id,name:iSel.name,skill:opts[0]||'',options:opts}}); },
      skillDialog:S.skillDialog&&{...S.skillDialog,unlocks:(()=>{ const ins=S.instrData.find(x=>x.id===S.skillDialog.id); if(!ins||!S.skillDialog.skill) return null; const after=[...ins.skills,S.skillDialog.skill]; const nw=Object.keys(T).filter(k=>T[k].skills.every(s=>after.includes(s))&&!T[k].skills.every(s=>ins.skills.includes(s))); return nw.length?'Ermöglicht zusätzlich: '+nw.map(k=>T[k].code).join(', '):null; })()},
      closeSkillDialog:()=>this.setState({skillDialog:null}), setSkillValue:e=>this.setState({skillDialog:{...S.skillDialog,skill:e.target.value}}),
      submitSkill:e=>{ e.preventDefault(); const d=S.skillDialog; if(!d.skill) return; this.setState({instrData:S.instrData.map(x=>x.id===d.id?{...x,skills:[...x.skills,d.skill]}:x),skillDialog:null}); this.toast('Skill «'+d.skill+'» hinzugefügt'); },
      openCertDialog:()=>{ const opts=Object.entries(D.certTypes).map(([id,c])=>({id,label:c.name+' · '+c.issuer})); this.setState({certDialog:{id:iSel.id,name:iSel.name,type:opts[0].id,issued:'2026-09-18',until:'2031-09-18',options:opts}}); },
      certDialog:S.certDialog&&{...S.certDialog,hint:(()=>{ const ct=D.certTypes[S.certDialog.type]; return ct.years?'Übliche Gültigkeit '+ct.years+' Jahre. Die Gültigkeit wird an jedem Kurstag geprüft.':'Ohne Ablaufdatum.'; })()},
      closeCertDialog:()=>this.setState({certDialog:null}), setCertType:e=>this.setState({certDialog:{...S.certDialog,type:e.target.value}}), setCertIssued:e=>this.setState({certDialog:{...S.certDialog,issued:e.target.value}}), setCertUntil:e=>this.setState({certDialog:{...S.certDialog,until:e.target.value}}),
      submitCert:e=>{ e.preventDefault(); const d=S.certDialog; this.setState({instrData:S.instrData.map(x=>x.id===d.id?{...x,certs:[...x.certs,{t:d.type,issued:d.issued,until:d.until}]}:x),certDialog:null}); this.toast(D.certTypes[d.type].name+' erfasst'); },
      schools:D.schools, filterSchool:S.filterSchool, setFilterSchool:e=>this.setState({filterSchool:e.target.value}), filterTrack:S.filterTrack, setFilterTrack:e=>this.setState({filterTrack:e.target.value}), filterCohort:S.filterCohort||'', setFilterCohort:e=>this.setState({filterCohort:e.target.value}), cohortOptions, apprRows, dupRows, dupCount:dupRows.length, noDups:!dupRows.length,
      schoolRows, ukLocs, weekdayOptions,
      locRows, noLocRows:!locRows.length, locSearch:S.locSearch||'', setLocSearch:e=>this.setState({locSearch:e.target.value}), locDetail, noLocDetail:!locDetail, closeLoc:()=>this.setState({locId:null}), locTabs, locTab, locKw:S.locKw, locCal, goDevices:()=>this.go('devices'),
      openRoomDialog:()=>this.setState({roomDialog:{loc:lSel.id,locName:lSel.name,name:'',kind:'Theorieraum',cap:12}}), roomDialog:S.roomDialog, closeRoomDialog:()=>this.setState({roomDialog:null}),
      setRoomName:e=>this.setState({roomDialog:{...S.roomDialog,name:e.target.value}}), setRoomKind:e=>this.setState({roomDialog:{...S.roomDialog,kind:e.target.value}}), setRoomCap:e=>this.setState({roomDialog:{...S.roomDialog,cap:+e.target.value}}),
      submitRoom:e=>{ e.preventDefault(); const d=S.roomDialog; if(!d.name.trim()) return; this.loc(d.loc).rooms.push({name:d.name.trim(),kind:d.kind,cap:+d.cap||12}); this.setState({roomDialog:null}); this.toast('Raum «'+d.name.trim()+'» hinzugefügt'); },
      devRows, devKpis, devTypeOptions, devFilterType:S.devFilterType, setDevFilterType:e=>this.setState({devFilterType:e.target.value}), devFilterLoc:S.devFilterLoc, setDevFilterLoc:e=>this.setState({devFilterLoc:e.target.value}), devFilterMob:S.devFilterMob, setDevFilterMob:e=>this.setState({devFilterMob:e.target.value}),
      openRent:()=>this.setState({devDialog:{kind:'rent',type:'HB',loc:'GIU',from:44,until:44,vendor:'Rent-a-Lift AG'}}), devDialog, closeDevDialog:()=>this.setState({devDialog:null}),
      setDevDialogType:e=>this.setState({devDialog:{...S.devDialog,type:e.target.value}}), setDevDialogVendor:e=>this.setState({devDialog:{...S.devDialog,vendor:e.target.value}}), setDevDialogLoc:e=>this.setState({devDialog:{...S.devDialog,loc:e.target.value}}), setDevDialogFrom:e=>this.setState({devDialog:{...S.devDialog,from:+e.target.value}}), setDevDialogUntil:e=>this.setState({devDialog:{...S.devDialog,until:+e.target.value}}),
      submitDevDialog:e=>{ e.preventDefault(); const dd=S.devDialog; if(dd.kind==='rent'){ const n=S.devices.filter(d=>d.mobility==='miete').length+1; this.setState({devices:[...S.devices,{id:'MIETE-'+dd.type.slice(0,1)+n,type:dd.type,loc:dd.loc,status:'verfügbar',mobility:'miete',from:+dd.from,until:Math.max(+dd.from,+dd.until),vendor:dd.vendor}],devDialog:null}); this.toast('Mietgerät für '+this.loc(dd.loc).name+' KW '+dd.from+'–'+Math.max(+dd.from,+dd.until)+' hinzugefügt'); } else { this.setState({devices:S.devices.map(d=>d.id===dd.dev?{...d,moves:[...(d.moves||[]),{kw:+dd.from,to:dd.loc}]}:d),devDialog:null}); this.toast(dd.dev+' ab KW '+dd.from+' in '+this.loc(dd.loc).name); } },
      importIsSchool:S.importSource==='school', importYear:S.importYear||'2026/27', importYears:['2026/27','2025/26'], setImportYear:e=>this.setState({importYear:e.target.value}),
      schoolImportRows:D.schools.map(s=>{ const y=S.importYear||'2026/27'; const im=s.imports&&s.imports[y]; return {name:s.name,locName:this.loc(s.loc).name,date:im?im.date:'–',rows:im?im.rows:'–',status:im?'importiert':'ausstehend',color:im?'var(--ok)':'var(--warn)',bg:im?'transparent':'var(--warn-soft)',canImport:!im&&canEdit,start:()=>{ this.setState({importStep:2,importSource:'school'}); this.toast('Datei von '+s.name+' erfassen'); }}; }),
      importYearSummary:(()=>{ const y=S.importYear||'2026/27'; const miss=D.schools.filter(s=>!(s.imports&&s.imports[y])); const n=D.schools.length-miss.length; return n+' von '+D.schools.length+' Schulen gemeldet'+(miss.length?' · offen: '+miss.map(s=>s.name).join(', '):' · alle Daten eingegangen'); })(),
      importSteps, importStep1:S.importStep===1, importStep2:S.importStep===2, importStep3:S.importStep===3, importDone:S.importStep===4, importSources, mappingRows, importIssues, importBatchId:S.importBatch,
      importNext:()=>this.setState({importStep:S.importStep+1}), importBack:()=>this.setState({importStep:S.importStep-1}), importRun:()=>{ this.setState({importStep:4,importBatch:'IMP-2026-09-18-07'}); this.toast('Import ausgeführt'); }, goApprentices:()=>this.setState({screen:'apprentices',importStep:1}),
      leadWeeks:S.leadWeeks, setWarnDays:e=>this.setState({warnDays:+e.target.value}), setLeadWeeks:e=>this.setState({leadWeeks:+e.target.value}), hardRules, softRules,
      accentOptions, radius:this.props.radius??S.radius, setRadius:e=>this.setState({radius:+e.target.value}), densityOptions:seg(densCur,['normal','kompakt'],'density'), fontOptions:seg(fontCur,['Plex','Helvetica'],'font'), roleRows,
      me:meV, cal, myMaint, noMyMaint:!myMaint.length, myAssignments, myAssignCount, myBackupCount, noMyAssignments:!myAssignments.length, myCerts, myAbs, noMyAbs:!myAbs.length, myWeekCells, vacHint, vacHintColor:vacClash?'var(--warn)':'var(--muted)', vacKw:S.vacKw, setVacKw:e=>this.setState({vacKw:+e.target.value}), vacMsg:S.vacMsg,
      requestVacation:e=>{ e.preventDefault(); const clash=S.courses.some(c=>c.instr==='i1'&&this.courseDays(c).some(d=>this.kwOfDate(d)===S.vacKw));
        const status=clash?'beantragt':'genehmigt'; const entries=clash?[]:[{kind:'Ferien',text:this.instr('i1').name+': Ferien KW '+this.kwLabel(S.vacKw)+' automatisch genehmigt',why:'Kein Einsatz in dieser Woche – keine Freigabe nötig',color:'var(--ok)'}];
        this.setState({absences:[...S.absences,{id:'a'+Date.now(),instr:'i1',kw:S.vacKw,kind:'Ferien',status}],autoLog:[...entries,...S.autoLog],vacMsg:clash?'Antrag für KW '+S.vacKw+' gesendet – Einsatz in dieser Woche, die Planung entscheidet.':'Ferien für KW '+S.vacKw+' genehmigt.'}); },
      messages, thinking:S.thinking, suggestions, draft:S.draft, setDraft:e=>this.setState({draft:e.target.value}), sendMessage:e=>{ e.preventDefault(); if(S.draft.trim()) this.ask(S.draft.trim()); },
      sel, closeCourse:()=>this.setState({selCourse:null}),
      newCourse, closeNewCourse:()=>this.setState({newCourse:null}), setNewType:e=>this.setState({newCourse:{...S.newCourse,type:e.target.value}}), setNewLoc:e=>this.setState({newCourse:{...S.newCourse,loc:e.target.value}}), setNewKw:e=>this.setState({newCourse:{...S.newCourse,kw:+e.target.value}}), setNewLang:e=>this.setState({newCourse:{...S.newCourse,lang:e.target.value}}),
      createCourse:e=>{ e.preventDefault(); const n=S.newCourse; const id='c'+Date.now(); const c={id,type:n.type,loc:n.loc,kw:+n.kw,off:0,lang:n.lang,status:'offen',instr:null,enrolled:0,cohort:n.cohort||null}; const a={...S.audit}; a[id]=[{when:'18.9. '+new Date().toTimeString().slice(0,5),who:S.userName,what:'hat den Kurs angelegt.'}]; this.setState({courses:[...S.courses,c],newCourse:null,selCourse:id,audit:a,screen:'board'}); this.toast('Kurs angelegt'); },
      toast:S.toast
    };
  }
}
