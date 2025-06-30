(()=>{var e={};e.id=302,e.ids=[302],e.modules={3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},4722:(e,t,r)=>{"use strict";r.d(t,{m:()=>i});let s=null;if(process.env.OPENAI_API_KEY)try{(s=r(67312)).default&&(s=s.default),s=new s({apiKey:process.env.OPENAI_API_KEY})}catch(e){console.log("OpenAI not available, using demo mode for Chorbit:",e)}let o=`You are Chorbit, a friendly and encouraging AI assistant designed specifically for kids and families managing chores and responsibilities.

PERSONALITY:
- Enthusiastic and positive, but not overly childish
- Encouraging and supportive, especially when kids feel overwhelmed
- Respectful of family rules and parental authority
- Uses age-appropriate language and concepts
- Makes chores feel manageable and sometimes even fun

CAPABILITIES:
- Help kids prioritize and schedule their chores
- Break down overwhelming tasks into manageable steps
- Suggest time-saving tips and efficient workflows
- Generate personalized schedules that can be exported to iOS
- Provide motivational support and celebrate progress
- Teach time management and responsibility skills
- Answer questions about chores, cleaning, and organization

SAFETY GUIDELINES:
- Always suggest kids discuss major schedule changes with parents
- Never override parental rules or chore assignments
- Keep conversations focused on chores, time management, and productivity
- If asked about non-chore topics, politely redirect back to helping with tasks
- Encourage family communication and cooperation

RESPONSE STYLE:
- Keep responses helpful but concise (2-3 sentences usually)
- Use encouraging language ("Great question!", "You've got this!", "Smart thinking!")
- Offer specific, actionable advice
- When appropriate, break tasks into numbered steps
- Celebrate small wins and progress

Remember: You're here to help kids succeed with their responsibilities while building good habits and confidence!`;class a{async chat(e,t,r){let a={id:`user-${Date.now()}`,role:"user",content:e,timestamp:new Date,userId:t};this.conversationHistory.push(a);let i=o;r&&(i+=`

CURRENT USER CONTEXT:
- Name: ${r.userName}
- Role: ${r.userRole}
- Current chores: ${r.currentChores.length} tasks
- Weekly earnings: $${r.weeklyEarnings}
- Completion rate: ${r.completionRate}%
- Recent chores: ${r.currentChores.slice(0,3).map(e=>e.title).join(", ")}`);try{if(!s)throw Error("OpenAI not configured");let e=await s.chat.completions.create({model:process.env.OPENAI_MODEL||"gpt-3.5-turbo",messages:[{role:"system",content:i},...this.conversationHistory.slice(-10).map(e=>({role:e.role,content:e.content}))],max_tokens:300,temperature:.7}),r={id:`chorbit-${Date.now()}`,role:"assistant",content:e.choices[0]?.message?.content||"Sorry, I'm having trouble thinking right now. Try asking me again!",timestamp:new Date,userId:t};return this.conversationHistory.push(r),r}catch(s){console.error("Chorbit AI Error:",s);let r="Oops! I'm having a little tech hiccup. Can you try asking me that again? I'm here to help! \uD83E\uDD16";return e.toLowerCase().includes("schedule")||e.toLowerCase().includes("plan")?r="I'd love to help you plan your schedule! First, let's look at your chores and figure out when you have time. What chores do you need to do today? \uD83D\uDCDD":e.toLowerCase().includes("help")||e.toLowerCase().includes("stuck")?r="I'm here to help! Try breaking your task into smaller steps - that usually makes things feel less overwhelming. What specific part feels tricky? \uD83D\uDCAA":(e.toLowerCase().includes("motivation")||e.toLowerCase().includes("tired"))&&(r="You've got this! \uD83C\uDF1F Remember, every small step counts. Maybe take a quick break, grab some water, and then tackle just one small task. Progress is progress!"),{id:`error-${Date.now()}`,role:"assistant",content:r,timestamp:new Date,userId:t}}}async generateSchedule(e,t,r,a){let i=`Help create a personalized chore schedule based on this request: "${e}"

Available time: ${t} minutes
Current chores: ${r.map(e=>`${e.title} (${e.estimatedMinutes||15} min, reward: $${e.reward})`).join(", ")}
${a?`Preferences: ${JSON.stringify(a)}`:""}

Please respond with a JSON object containing:
- title: A motivating title for this schedule
- tasks: Array of scheduled tasks with name, duration, priority, scheduledTime, and helpful tips
- totalTime: Total estimated time
- aiRecommendations: Array of 2-3 helpful tips

Make it encouraging and realistic for a kid to follow!`;try{if(!s)throw Error("OpenAI not configured");let e=await s.chat.completions.create({model:process.env.OPENAI_MODEL||"gpt-3.5-turbo",messages:[{role:"system",content:o},{role:"user",content:i}],max_tokens:500,temperature:.8}),t=e.choices[0]?.message?.content||"";try{return JSON.parse(t)}catch{return{id:`schedule-${Date.now()}`,title:"Your Chorbit-Generated Schedule",tasks:r.slice(0,3).map((e,t)=>({name:e.title,duration:e.estimatedMinutes||15,priority:0===t?"high":"medium",tips:`Take your time and do your best! Remember, $${e.reward} awaits! 🌟`})),totalTime:r.slice(0,3).reduce((e,t)=>e+(t.estimatedMinutes||15),0),aiRecommendations:["Start with the hardest task when you have the most energy!","Take a 5-minute break between chores to stay fresh.","Put on your favorite music to make it more fun! \uD83C\uDFB5"]}}}catch(e){throw console.error("Schedule generation error:",e),Error("Chorbit had trouble creating your schedule. Try again!")}}generateiOSCalendarFile(e,t){let r=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//ChoreChart//Chorbit Schedule//EN","CALSCALE:GREGORIAN","METHOD:PUBLISH"];return e.tasks.forEach((s,o)=>{let a=new Date(t);a.setMinutes(a.getMinutes()+o*s.duration);let i=new Date(a);i.setMinutes(i.getMinutes()+s.duration),r.push("BEGIN:VEVENT",`UID:chorbit-${e.id}-${o}@chorechart.app`,`DTSTART:${a.toISOString().replace(/[-:]/g,"").split(".")[0]}Z`,`DTEND:${i.toISOString().replace(/[-:]/g,"").split(".")[0]}Z`,`SUMMARY:${s.name}`,`DESCRIPTION:Generated by Chorbit AI\\n${s.tips||"You've got this!"}`,"STATUS:CONFIRMED","END:VEVENT")}),r.push("END:VCALENDAR"),r.join("\r\n")}clearHistory(){this.conversationHistory=[]}getHistory(){return[...this.conversationHistory]}constructor(){this.conversationHistory=[]}}let i=new a},10846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},29294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},44870:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},63033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},67422:(e,t,r)=>{"use strict";r.r(t),r.d(t,{patchFetch:()=>m,routeModule:()=>u,serverHooks:()=>p,workAsyncStorage:()=>h,workUnitAsyncStorage:()=>d});var s={};r.r(s),r.d(s,{POST:()=>l});var o=r(96559),a=r(48088),i=r(37719),n=r(32190),c=r(4722);async function l(e){let t="unknown";try{let{message:r,userId:s,conversationHistory:o=[],userContext:a}=await e.json();if(t=s||"unknown",!r||!s)return n.NextResponse.json({error:"Missing required fields: message and userId"},{status:400});c.m.clearHistory(),o&&o.length>0&&o.filter(e=>"welcome"!==e.id).slice(-10).forEach(e=>{c.m.getHistory().push(e)});let i=await c.m.chat(r,s,a);return n.NextResponse.json(i)}catch(r){console.error("Chorbit chat error:",r);let e={id:`fallback-${Date.now()}`,role:"assistant",content:"I'm here to help with your chores and time management! What would you like to work on today? \uD83D\uDE0A",timestamp:new Date,userId:t};return n.NextResponse.json(e)}}let u=new o.AppRouteRouteModule({definition:{kind:a.RouteKind.APP_ROUTE,page:"/api/chorbit/chat/route",pathname:"/api/chorbit/chat",filename:"route",bundlePath:"app/api/chorbit/chat/route"},resolvedPagePath:"/codebuild/output/src3049652603/src/ChoreChart/web/src/app/api/chorbit/chat/route.ts",nextConfigOutput:"",userland:s}),{workAsyncStorage:h,workUnitAsyncStorage:d,serverHooks:p}=u;function m(){return(0,i.patchFetch)({workAsyncStorage:h,workUnitAsyncStorage:d})}},78335:()=>{},96487:()=>{}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[243,580,312],()=>r(67422));module.exports=s})();