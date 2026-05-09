const req = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + process.env.GEMINI_API_KEY, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ role: "user", parts: [{ text: "Write a p5.js script for a visually stunning simulation about solar system" }] }],
    generationConfig: { maxOutputTokens: 4000 }
  })
});
const res = await req.json();
console.log(JSON.stringify(res.candidates[0].finishReason));
