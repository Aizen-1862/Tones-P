const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = Number(process.env.PORT || 3000);
app.disable("x-powered-by");
app.use(cors({ origin: true }));
app.use(express.json({ limit: "100kb" }));
const tracksPath = path.join(__dirname, "data", "tracks.json");
function readTracks() { try { const value=JSON.parse(fs.readFileSync(tracksPath,"utf8")); return Array.isArray(value)?value:[]; } catch(error) { console.error("Could not read tracks.json:",error.message); return []; } }
function safeTrack(track) { return { id:String(track.id||""),title:String(track.title||"Untitled track"),artist:String(track.artist||"Unknown artist"),audioUrl:String(track.audioUrl||""),artworkUrl:String(track.artworkUrl||""),mood:["auto","playful","emotional","hype","dreamy"].includes(track.mood)?track.mood:"auto",lyrics:typeof track.lyrics==="string"?track.lyrics:"" }; }
app.get("/api/health",(_req,res)=>res.json({ok:true,service:"tones-p-api",timestamp:new Date().toISOString()}));
app.get("/api/tracks",(_req,res)=>{const tracks=readTracks().map(safeTrack).filter(track=>track.audioUrl&&/^https?:\/\//i.test(track.audioUrl));res.set("Cache-Control","public, max-age=60");res.json({tracks});});
app.get("/api/catalog/search",async(req,res)=>{
 const query=String(req.query.q||"").trim().slice(0,100);if(!query)return res.status(400).json({error:"Enter a search term."});
 const clientId=process.env.JAMENDO_CLIENT_ID;if(!clientId)return res.status(503).json({error:"Online music is not configured yet. Add JAMENDO_CLIENT_ID to the Tones:P backend environment variables."});
 try {const url=new URL("https://api.jamendo.com/v3.0/tracks/");url.search=new URLSearchParams({client_id:clientId,format:"json",limit:"18",search:query,order:"popularity_total",audioformat:"mp32",imagesize:"300",include:"musicinfo"}).toString();
 const upstream=await fetch(url,{headers:{Accept:"application/json"},signal:AbortSignal.timeout(12000)});if(!upstream.ok)return res.status(502).json({error:"The music provider could not complete the search right now."});
 const payload=await upstream.json();if(payload.headers&&payload.headers.status==="failed")return res.status(502).json({error:"The music provider rejected the request. Check the Jamendo client ID."});
 const tracks=(Array.isArray(payload.results)?payload.results:[]).map(track=>({id:String(track.id||""),title:String(track.name||"Untitled track"),artist:String(track.artist_name||"Independent artist"),audioUrl:String(track.audio||""),artworkUrl:String(track.album_image||track.image||""),mood:"auto",lyrics:"",licenseUrl:String(track.license_ccurl||""),duration:Number(track.duration||0),provider:"Jamendo",providerUrl:String(track.shareurl||"")})).filter(track=>track.id&&/^https:\/\//i.test(track.audioUrl)&&/^https:\/\//i.test(track.licenseUrl));
 res.set("Cache-Control","no-store");res.json({provider:"Jamendo",tracks});
 } catch(error){console.error("Jamendo search failed:",error.message);res.status(502).json({error:"Could not reach the music provider. Please try again later."});}
});
app.get("/api/style/:mood",(req,res)=>{const recipes={playful:{name:"Playful Pop",palette:["#ff7ed3","#ffd568","#66e7e4"],typography:"bouncy",motion:"pop, bounce, rotate",intensity:.7},emotional:{name:"Emotional",palette:["#6899ff","#b57eff","#ff8fbe"],typography:"soft",motion:"fade, drift, blur",intensity:.25},hype:{name:"High Energy",palette:["#ff6b52","#ffc056","#66e0ff"],typography:"bold",motion:"slam, scale, pulse",intensity:1},dreamy:{name:"Dream State",palette:["#78eddc","#b09eff","#ffabe0"],typography:"fluid",motion:"float, wave, glow",intensity:.35}};const mood=String(req.params.mood||"").toLowerCase();if(!recipes[mood])return res.status(404).json({error:"Unknown mood",supported:Object.keys(recipes)});res.json({mood,recipe:recipes[mood]});});
app.get("/",(_req,res)=>res.type("text").send("Tones:P API is running. See /api/health and /api/catalog/search."));
app.listen(PORT,"0.0.0.0",()=>console.log("Tones:P API listening on 0.0.0.0:"+PORT));
