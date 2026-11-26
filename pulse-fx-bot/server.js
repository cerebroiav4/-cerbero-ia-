require("dotenv").config();
const express=require("express"), Database=require("better-sqlite3"), path=require("path"), fs=require("fs");
const app=express(); app.use(express.json()); app.use(express.static(path.join(__dirname,"public")));
const dataDir=process.env.DATA_DIR||"./data"; fs.mkdirSync(dataDir,{recursive:true});
const db=new Database(path.join(dataDir,"signals.db"));
db.exec("CREATE TABLE IF NOT EXISTS signals(id INTEGER PRIMARY KEY, symbol TEXT, action TEXT, score INTEGER, m1 TEXT, m5 TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)");
const save=db.prepare("INSERT INTO signals(symbol,action,score,m1,m5) VALUES(?,?,?,?,?)");
async function candles(symbol,interval){
 const key=process.env.TWELVEDATA_API_KEY;if(!key) throw Error("Configure TWELVEDATA_API_KEY no Render.");
 const url=new URL("https://api.twelvedata.com/time_series");url.search=new URLSearchParams({symbol,interval,outputsize:"60",apikey:key});
 const r=await fetch(url);const j=await r.json();if(!r.ok||j.status==="error"||!j.values)throw Error(j.message||"Falha na fonte de cotações.");
 return j.values.reverse().map(x=>({c:+x.close,h:+x.high,l:+x.low,t:x.datetime}));
}
function calc(a){const closes=a.map(x=>x.c);const ema=(p)=>{let k=2/(p+1),v=closes.slice(0,p).reduce((s,x)=>s+x,0)/p;for(let x of closes.slice(p))v=x*k+v*(1-k);return v};
 let gains=0,loss=0;for(let i=closes.length-14;i<closes.length;i++){let d=closes[i]-closes[i-1];if(d>0)gains+=d;else loss-=d}
 const rs=loss===0?100:gains/loss;const rsi=100-100/(1+rs);const fast=ema(9),slow=ema(21),last=closes.at(-1);
 return {trend:fast>slow&&last>fast?"ALTA":fast<slow&&last<fast?"BAIXA":"LATERAL",rsi,last,ema9:fast,ema21:slow};}
app.get("/api/health",(q,s)=>s.json({ok:true,provider:"Twelve Data",keyConfigured:!!process.env.TWELVEDATA_API_KEY}));
app.get("/api/history",(q,s)=>s.json(db.prepare("SELECT * FROM signals ORDER BY id DESC LIMIT 100").all()));
app.get("/api/analyze",async(q,s)=>{try{const symbol=(q.query.symbol||"EUR/USD").toUpperCase();const [a,b]=await Promise.all([candles(symbol,"1min"),candles(symbol,"5min")]);const m1=calc(a),m5=calc(b);let action="AGUARDAR",score=0;
 if(m1.trend==="ALTA"&&m5.trend==="ALTA"&&m1.rsi<70&&m5.rsi<70){action="COMPRA";score=80}
 else if(m1.trend==="BAIXA"&&m5.trend==="BAIXA"&&m1.rsi>30&&m5.rsi>30){action="VENDA";score=80}
 else score=35;
 const info={symbol,action,score,m1,m5,price:m1.last,updatedAt:new Date().toISOString(),note:"Pontuação de confluência técnica, não é probabilidade de lucro."};
 if(action!=="AGUARDAR")save.run(symbol,action,score,m1.trend,m5.trend);
 s.json(info);
 }catch(e){s.status(503).json({error:e.message});}});
app.get("/api/events",(q,s)=>s.json([]));
const port=process.env.PORT||3000;app.listen(port,"0.0.0.0",()=>console.log("PULSE FX BOT listening on "+port));
