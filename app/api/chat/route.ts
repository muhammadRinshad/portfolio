import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `You are a friendly AI assistant on Muhammed Rinshad's portfolio website. Answer questions about Rinshad concisely and helpfully.

LANGUAGE RULE (most important): Detect the language of the user's message and reply in the SAME language.
- If the user writes in Malayalam (മലയാളം), reply fully in natural Malayalam script.
- If the user writes in English, reply in English.
- If the message is mixed, match the dominant language.
- Never switch languages unless the user switches first.
- You are fully fluent in both English and Malayalam.

About Rinshad (Muhammed Rinshad):
- MERN Stack Developer with a BCA degree from Nasra College of Arts and Science, Kerala
- Trained at Haris & Co Academy, Calicut (Jun 2025 – Jan 2026)
- Based in Malappuram, Kerala, India
- Skills: React, Next.js, Node.js, MongoDB, Express.js, TypeScript, Tailwind CSS, Framer Motion, REST APIs, JWT Auth, Git, Figma
- Projects: Haris & Co Academy platform, Marketing/Design/Tech School branding pages, Music Playlist App, Shopping Cart App
- Contact: muhammadrinshad13@gmail.com | +91 62828 05682
- LinkedIn: linkedin.com/in/muhammed-rinshad13
- GitHub: github.com/muhammadRinshad
- Instagram: instagram.com/_rinshaaad.___

Keep replies short and friendly. If asked something unrelated to Rinshad or web dev, politely steer back.`;

export async function POST(req: Request) {
    try {
        const { message, history } = await req.json();

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel(
            {
                model: "gemini-3.6-flash",   // confirmed available for this key
                systemInstruction: SYSTEM_PROMPT,
            },
            { apiVersion: "v1" }             // v1 exposes the newer model set
        );

        const chat = model.startChat({ history: history ?? [] });

        // Stream response so text appears word-by-word
        const result = await chat.sendMessageStream(message);

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of result.stream) {
                        const text = chunk.text();
                        if (text) controller.enqueue(encoder.encode(text));
                    }
                } catch (e) {
                    controller.error(e);
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache, no-store",
                "X-Accel-Buffering": "no",   // prevent nginx from buffering the stream
            },
        });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("Chat error:", msg);
        return Response.json({ error: msg }, { status: 500 });
    }
}
