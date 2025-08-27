import { useEffect, useMemo, useState } from "react";
import StarToggle from "../components/StarToggle";

const STORAGE_KEY = "hayday-progress-v1";

/* ====== Datos base ====== */
// Sección 2: Main Buildings (contadores 0..total)
const mainMaster = [
  { name: "Town Hall", total: 12 },
  { name: "Train Station", total: 12 },
  { name: "Personal Train", total: 19 },
];

// Sección 3: Service Buildings (4 contadores por fila)
const serviceMaster = [
  // name, slots, coins(12), xp(12), time(8)
  { name: "Grocery Store",        slots: 6, coins: 12, xp: 12, time: 8 },
  { name: "Cinema",               slots: 6, coins: 12, xp: 12, time: 8 },
  { name: "Diner",                slots: 6, coins: 12, xp: 12, time: 8 },
  { name: "Bed and Breakfast",    slots: 6, coins: 12, xp: 12, time: 8 },
  { name: "Spa",                  slots: 6, coins: 12, xp: 12, time: 8 },
  { name: "Gift Shop",            slots: 6, coins: 12, xp: 12, time: 8 },
  { name: "Beach Café",           slots: 6, coins: 12, xp: 12, time: 8 },
];

// Sección 4: Sanctuary Animals (4 checks con estrellas)
const sanctuaryAnimals = [
  "Elephants","Hippos","Giraffes","Zebras","Gorillas","Reindeers",
  "Cheetah","Artic Fox","Walrus","Meerkat","Penguins","Ostrich","Capybara",
];

/* ====== Helpers ====== */
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function pctFromCounters(items) {
  // items: [{current,total},...]
  if (!Array.isArray(items) || !items.length) return 0;
  const total = items.reduce((a,r)=>a+(+r.total||0),0);
  const curr  = items.reduce((a,r)=>a+(+r.current||0),0);
  if (!total) return 0;
  return +((curr/total)*100).toFixed(2);
}

function pctFromService(rows) {
  // rows: [{vals:{slots,coins,xp,time}, max:{slots,coins,xp,time}}]
  if (!Array.isArray(rows) || !rows.length) return 0;
  let num=0, den=0;
  rows.forEach(r=>{
    num += (+r.vals.slots||0)+(+r.vals.coins||0)+(+r.vals.xp||0)+(+r.vals.time||0);
    den += (+r.max.slots||0)+(+r.max.coins||0)+(+r.max.xp||0)+(+r.max.time||0);
  });
  if (!den) return 0;
  return +((num/den)*100).toFixed(2);
}

function pctFromLevels(rows, levelsPerRow=4) {
  // rows: [{levels:[0/1,...]}]
  if (!Array.isArray(rows) || !rows.length) return 0;
  const done = rows.reduce((a,r)=>a+(Array.isArray(r.levels)?r.levels.reduce((x,y)=>x+(y?1:0),0):0),0);
  const total = rows.length*levelsPerRow;
  if (!total) return 0;
  return +((done/total)*100).toFixed(2);
}

/* ====== Componente ====== */
export default function Town() {
  const base = import.meta.env.BASE_URL;

  // Carga inicial y normalización
  const load = useMemo(()=>()=> {
    let all = {};
    try { all = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { all = {}; }

    // main
    let main = all?.town?.main;
    if (!Array.isArray(main) || !main.length) {
      main = mainMaster.map(m=>({name:m.name, current:0, total:m.total}));
    } else {
      const byName = new Map(main.map(x=>[String(x?.name??""), x]));
      main = mainMaster.map(m=>{
        const r = byName.get(m.name);
        const current = clamp(+r?.current||0, 0, +m.total||0);
        return { name:m.name, current, total:+m.total||0 };
      });
    }

    // services
    let services = all?.town?.services;
    if (!Array.isArray(services) || !services.length) {
      services = serviceMaster.map(s=>({
        name:s.name,
        vals:{ slots:0, coins:0, xp:0, time:0 },
        max: { slots:s.slots, coins:s.coins, xp:s.xp, time:s.time },
      }));
    } else {
      const byName = new Map(services.map(x=>[String(x?.name??""), x]));
      services = serviceMaster.map(s=>{
        const r = byName.get(s.name);
        const vals = {
          slots: clamp(+r?.vals?.slots||0, 0, s.slots),
          coins: clamp(+r?.vals?.coins||0, 0, s.coins),
          xp:    clamp(+r?.vals?.xp   ||0, 0, s.xp),
          time:  clamp(+r?.vals?.time ||0, 0, s.time),
        };
        return { name:s.name, vals, max:{slots:s.slots, coins:s.coins, xp:s.xp, time:s.time} };
      });
    }

    // sanctuary
    let sanctuary = all?.town?.sanctuary;
    if (!Array.isArray(sanctuary) || !sanctuary.length) {
      sanctuary = sanctuaryAnimals.map(n=>({ name:n, levels:[0,0,0,0] }));
    } else {
      const byName = new Map(sanctuary.map(x=>[String(x?.name??""), x]));
      sanctuary = sanctuaryAnimals.map(n=>{
        const r = byName.get(n);
        let lv = Array.isArray(r?.levels) ? r.levels.slice(0,4) : [];
        while (lv.length<4) lv.push(0);
        lv = lv.map(x=>x?1:0);
        return { name:n, levels: lv };
      });
    }

    return { main, services, sanctuary };
  },[]);

  const [state, setState] = useState(load);

  // Persistir
  useEffect(()=>{
    const all = (()=>{ try {return JSON.parse(localStorage.getItem(STORAGE_KEY))||{};} catch{ return {}; }})();
    all.town = { ...state, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }, [state]);

  /* === Acciones === */
  const decrMain = (i)=> setState(prev=>{
    const copy = { ...prev, main: prev.main.map(r=>({...r})) };
    copy.main[i].current = clamp(copy.main[i].current-1, 0, copy.main[i].total);
    return copy;
  });
  const incrMain = (i)=> setState(prev=>{
    const copy = { ...prev, main: prev.main.map(r=>({...r})) };
    copy.main[i].current = clamp(copy.main[i].current+1, 0, copy.main[i].total);
    return copy;
  });

  const decrService = (i, key)=> setState(prev=>{
    const copy = { ...prev, services: prev.services.map(r=>({ name:r.name, vals:{...r.vals}, max:{...r.max} })) };
    copy.services[i].vals[key] = clamp(copy.services[i].vals[key]-1, 0, copy.services[i].max[key]);
    return copy;
  });
  const incrService = (i, key)=> setState(prev=>{
    const copy = { ...prev, services: prev.services.map(r=>({ name:r.name, vals:{...r.vals}, max:{...r.max} })) };
    copy.services[i].vals[key] = clamp(copy.services[i].vals[key]+1, 0, copy.services[i].max[key]);
    return copy;
  });

  const toggleSanctuary = (i, j)=> setState(prev=>{
    const copy = { ...prev, sanctuary: prev.sanctuary.map(r=>({ name:r.name, levels:[...r.levels] })) };
    copy.sanctuary[i].levels[j] = copy.sanctuary[i].levels[j] ? 0 : 1;
    return copy;
  });

  /* === Progresos === */
  const mainPct      = pctFromCounters(state.main);
  const servicesPct  = pctFromService(state.services);
  const sanctuaryPct = pctFromLevels(state.sanctuary, 4);
  const totalPct     = ((mainPct + servicesPct + sanctuaryPct)/3).toFixed(2);

  /* === Render helpers === */
  const SectionProgress = ({ title, pct }) => (
    <>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <div className="progress" style={{ marginBottom: 12 }}>
        <div className="done" style={{ width: `${pct}%` }} />
        <div className="todo" style={{ width: `${100 - pct}%` }} />
      </div>
      <div className="progress-note">{pct.toFixed(2)}% completed</div>
    </>
  );

  return (
    <main className="container">
      {/* ===== Sección 1: Progreso total ===== */}
      <section className="card">
        <SectionProgress title="Town — Overall Progress" pct={+totalPct} />
      </section>

      {/* ===== Sección 2: Main Buildings ===== */}
      <section className="card" style={{ marginTop: 20 }}>
        <SectionProgress title="Main Buildings" pct={mainPct} />

        <div className="table-wrap" style={{ marginTop: 16 }}>
          <table className="hd-table" aria-label="Main Buildings">
            <thead>
              <tr>
                <th>Building</th>
                <th className="center">Current</th>
                <th className="center">Total</th>
                <th className="center">Adjust</th>
              </tr>
            </thead>
            <tbody>
              {state.main.map((r,i)=>(
                <tr key={r.name+i}>
                  <td className="name-cell">{r.name}</td>
                  <td className="center">{r.current}</td>
                  <td className="center">{r.total}</td>
                  <td className="center">
                    <div className="counter">
                      <button className="btn-small" onClick={()=>decrMain(i)}>-</button>
                      <button className="btn-small" onClick={()=>incrMain(i)}>+</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== Sección 3: Service Buildings ===== */}
      <section className="card" style={{ marginTop: 20 }}>
        <SectionProgress title="Service Buildings" pct={servicesPct} />

        <div className="table-wrap" style={{ marginTop: 16 }}>
          <table className="hd-table" aria-label="Service Buildings">
            <thead>
              <tr>
                <th>Building</th>
                <th className="center">Slots</th>
                <th className="center">Coins</th>
                <th className="center">XP & Rep</th>
                <th className="center">Time</th>
                <th className="center">Level</th>
              </tr>
            </thead>
            <tbody>
              {state.services.map((r,i)=>{
                const lvl = (+r.vals.slots||0)+(+r.vals.coins||0)+(+r.vals.xp||0)+(+r.vals.time||0);
                return (
                  <tr key={r.name+i}>
                    <td className="name-cell">{r.name}</td>
                    <td className="center">
                      <div className="svc-counter">
                        <button className="btn-small" onClick={() => decrService(i, "slots")}>-</button>
                        <span>{r.vals.slots}/{r.max.slots}</span>
                        <button className="btn-small" onClick={() => incrService(i, "slots")}>+</button>
                      </div>
                    </td>

                    <td className="center">
                      <div className="svc-counter">
                        <button className="btn-small" onClick={() => decrService(i, "coins")}>-</button>
                        <span>{r.vals.coins}/{r.max.coins}</span>
                        <button className="btn-small" onClick={() => incrService(i, "coins")}>+</button>
                      </div>
                    </td>

                    <td className="center">
                      <div className="svc-counter">
                        <button className="btn-small" onClick={() => decrService(i, "xp")}>-</button>
                        <span>{r.vals.xp}/{r.max.xp}</span>
                        <button className="btn-small" onClick={() => incrService(i, "xp")}>+</button>
                      </div>
                    </td>

                    <td className="center">
                      <div className="svc-counter">
                        <button className="btn-small" onClick={() => decrService(i, "time")}>-</button>
                        <span>{r.vals.time}/{r.max.time}</span>
                        <button className="btn-small" onClick={() => incrService(i, "time")}>+</button>
                      </div>
                    </td>


                    <td className="center"><strong>{lvl}</strong></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== Sección 4: Sanctuary Animals ===== */}
      <section className="card" style={{ marginTop: 20 }}>
        <SectionProgress title="Sanctuary Animals" pct={sanctuaryPct} />

        <div className="table-wrap" style={{ marginTop: 16 }}>
          <table className="hd-table" aria-label="Sanctuary Animals">
            <thead>
              <tr>
                <th style={{width:"40%"}}>Animal</th>
                <th className="center">Adult 1</th>
                <th className="center">Adult 2</th>
                <th className="center">Baby 1</th>
                <th className="center">Baby 2</th>
              </tr>
            </thead>
            <tbody>
              {state.sanctuary.map((r,i)=>(
                <tr key={r.name+i}>
                  <td className="name-cell">{r.name}</td>
                  {r.levels.map((v,j)=>(
                    <td key={j} className="center">
                      <StarToggle
                        checked={!!v}
                        onChange={()=>toggleSanctuary(i,j)}
                        label={`${r.name} – Level ${j+1}`}
                        // usa tus estrellas por defecto
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
