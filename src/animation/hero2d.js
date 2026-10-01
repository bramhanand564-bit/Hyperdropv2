import { HERO_2D_CLIPS, clipPose } from './hero2dClips.js';

const DEFAULT_STYLE = { body:'#e9f0f9', suit:'#5e88bd', accent:'#b8d8ff', dark:'#0c1420', metal:'#c4d2df' };
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export class Hero2DRenderer {
  constructor(canvas) {
    this.canvas=canvas;
    this.ctx=canvas?.getContext('2d');
    this.dpr=Math.min(globalThis.devicePixelRatio||1,2);
    this.w=0; this.h=0; this.time=0; this.state='IDLE'; this.prevState='IDLE'; this.stateAge=0;
    this.style={...DEFAULT_STYLE}; this.enabled=!!this.ctx;
    this.resizeObserver=globalThis.ResizeObserver?new ResizeObserver(()=>this.resize()):null;
    this.resizeObserver?.observe(canvas);
    this.resize();
  }
  setStyle(style={}) { this.style={...DEFAULT_STYLE,...style}; }
  setState(next='IDLE') {
    if(next===this.state)return;
    this.prevState=this.state; this.state=HERO_2D_CLIPS[next]?next:'IDLE'; this.stateAge=0;
  }
  resize() {
    if(!this.enabled)return;
    const rect=this.canvas.getBoundingClientRect();
    this.w=Math.max(1,Math.round(rect.width||260)); this.h=Math.max(1,Math.round(rect.height||300));
    this.canvas.width=Math.round(this.w*this.dpr); this.canvas.height=Math.round(this.h*this.dpr);
    this.ctx.setTransform(this.dpr,0,0,this.dpr,0,0);
  }
  update(dt, state='IDLE') {
    if(!this.enabled || document.hidden)return;
    this.setState(state);
    this.time+=Math.min(0.05,Math.max(0,dt)); this.stateAge+=Math.min(0.05,Math.max(0,dt));
    this.draw();
  }
  draw() {
    const ctx=this.ctx, W=this.w, H=this.h, s=Math.min(W/260,H/320);
    ctx.clearRect(0,0,W,H);
    const clip=HERO_2D_CLIPS[this.state]||HERO_2D_CLIPS.IDLE;
    const pose=clipPose(this.state,clip.loop?this.stateAge%clip.duration:this.stateAge,this.prevState,Math.min(1,this.stateAge/0.12));
    const groundY=H*0.83, cx=W*0.5;
    ctx.save(); ctx.translate(cx,groundY-(pose.jumpY||0)*H*0.28); ctx.scale(s,s*(pose.squash||1));
    this.shadow(ctx,0,8); this.backGlow(ctx,pose);
    const hipY=-92, torsoY=-142, headY=-198;
    this.leg(ctx,-22,hipY,pose.leg||0,false); this.leg(ctx,22,hipY,pose.legR||0,true);
    this.coat(ctx,torsoY); this.torso(ctx,torsoY,pose); 
    this.arm(ctx,-53,torsoY+18,pose.arm||0,false); this.arm(ctx,53,torsoY+18,pose.armR??-(pose.arm||0),true);
    this.neckHead(ctx,headY,pose.look||0); this.backpack(ctx,torsoY); this.sword(ctx,pose);
    ctx.restore();
    this.fx(ctx,cx,groundY,s,pose);
  }
  shadow(ctx,x,y){const g=ctx.createRadialGradient(x,y,2,x,y,52);g.addColorStop(0,'rgba(0,0,0,.42)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(x,y,54,16,0,0,Math.PI*2);ctx.fill();}
  backGlow(ctx,pose){ctx.globalAlpha=0.18+0.05*Math.sin(this.time*4);ctx.fillStyle=this.style.accent;ctx.beginPath();ctx.arc(0,-152,72,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
  rounded(ctx,x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
  torso(ctx,y,pose){ctx.save();ctx.translate(0,y);ctx.rotate(pose.lean||0);this.rounded(ctx,-38,0,76,78,18,this.style.suit,this.style.dark);this.rounded(ctx,-24,14,48,30,10,this.style.metal,'transparent');ctx.fillStyle=this.style.accent;ctx.shadowBlur=14;ctx.shadowColor=this.style.accent;ctx.beginPath();ctx.arc(0,30,8+Math.sin(this.time*5)*1.4,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;for(let i=0;i<6;i++){ctx.strokeStyle=this.style.accent;ctx.globalAlpha=.18;ctx.beginPath();ctx.moveTo(-27+i*11,52);ctx.lineTo(-20+i*11,69);ctx.stroke();}ctx.globalAlpha=1;ctx.restore();}
  coat(ctx,y){ctx.fillStyle=this.style.dark;ctx.globalAlpha=.95;ctx.beginPath();ctx.moveTo(-31,y+65);ctx.lineTo(-10,y+145);ctx.lineTo(-2,y+112);ctx.lineTo(-39,y+84);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(31,y+65);ctx.lineTo(10,y+145);ctx.lineTo(2,y+112);ctx.lineTo(39,y+84);ctx.closePath();ctx.fill();ctx.globalAlpha=1;}
  arm(ctx,x,y,ang,right){ctx.save();ctx.translate(x,y);ctx.rotate(ang);this.rounded(ctx,-11,0,22,53,8,this.style.metal,this.style.dark);ctx.translate(0,50);ctx.rotate(ang*.35);this.rounded(ctx,-10,0,20,48,8,this.style.suit,this.style.dark);ctx.fillStyle=this.style.body;ctx.beginPath();ctx.arc(0,52,10,0,Math.PI*2);ctx.fill();for(let i=-2;i<=2;i++){ctx.strokeStyle=this.style.dark;ctx.beginPath();ctx.moveTo(i*3,58);ctx.lineTo(i*3,68);ctx.stroke();}ctx.restore();}
  leg(ctx,x,y,ang,right){ctx.save();ctx.translate(x,y);ctx.rotate(ang);this.rounded(ctx,-13,0,26,58,9,this.style.dark,this.style.metal);ctx.translate(0,56);this.rounded(ctx,-12,0,24,60,8,this.style.dark,this.style.dark);ctx.fillStyle=this.style.accent;ctx.shadowBlur=8;ctx.shadowColor=this.style.accent;ctx.fillRect(-11,36,22,5);ctx.shadowBlur=0;ctx.translate(0,54);this.rounded(ctx,-17,0,34,17,6,this.style.dark,this.style.metal);ctx.restore();}
  neckHead(ctx,y,look){ctx.save();ctx.translate(look*5,y);this.rounded(ctx,-10,0,20,22,7,this.style.metal);ctx.fillStyle=this.style.body;ctx.beginPath();ctx.arc(0,40,31,0,Math.PI*2);ctx.fill();ctx.fillStyle=this.style.dark;ctx.beginPath();ctx.arc(0,28,33,Math.PI,Math.PI*2);ctx.fill();for(let i=0;i<9;i++){const a=-Math.PI+.12+i*.22;ctx.fillStyle=this.style.dark;ctx.beginPath();ctx.moveTo(Math.cos(a)*25,29+Math.sin(a)*25);ctx.lineTo(Math.cos(a)*39,16+Math.sin(a)*30);ctx.lineTo(Math.cos(a)*26,17+Math.sin(a)*25);ctx.closePath();ctx.fill();}ctx.fillStyle='#07111b';ctx.fillRect(-24,43,48,9);ctx.fillStyle=this.style.accent;ctx.shadowBlur=10;ctx.shadowColor=this.style.accent;ctx.fillRect(-17,46,34,3);ctx.shadowBlur=0;ctx.fillStyle=this.style.accent;ctx.fillRect(-10,53,6,3);ctx.fillRect(4,53,6,3);ctx.restore();}
  backpack(ctx,y){ctx.fillStyle=this.style.dark;ctx.globalAlpha=.9;ctx.fillRect(-44,y+20,10,48);ctx.fillRect(34,y+20,10,48);ctx.globalAlpha=1;}
  sword(ctx,pose){ctx.save();ctx.translate(48,-118);ctx.rotate(-.22+(pose.lean||0)*.7);ctx.fillStyle=this.style.dark;ctx.fillRect(-5,0,10,112);ctx.fillStyle=this.style.accent;ctx.shadowBlur=12;ctx.shadowColor=this.style.accent;ctx.fillRect(-3,4,6,96);ctx.shadowBlur=0;ctx.fillStyle=this.style.metal;ctx.fillRect(-18,112,36,7);ctx.restore();}
  fx(ctx,cx,gy,s,pose){const pulse=pose.pulse||0;for(let i=0;i<10;i++){const a=this.time*1.7+i*.63,r=32+(i%4)*11;ctx.globalAlpha=.05+.06*Math.abs(Math.sin(this.time*2+i));ctx.fillStyle=this.style.accent;ctx.beginPath();ctx.arc(cx+Math.cos(a)*r*s,gy-145*s+Math.sin(a)*r*s*.4,1.3*s,0,Math.PI*2);ctx.fill();}if(pulse){ctx.globalAlpha=.25*pulse;ctx.strokeStyle=this.style.accent;ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,gy-150*s,(45+30*pulse)*s,0,Math.PI*2);ctx.stroke();}ctx.globalAlpha=1;}
  destroy(){this.resizeObserver?.disconnect();this.enabled=false;}
}
