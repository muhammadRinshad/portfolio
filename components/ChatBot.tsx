"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Role = "user" | "model";
interface Msg { role: Role; text: string; }

const SUGGESTIONS = [
    "What are his skills?",
    "Show me his projects",
    "How to contact him?",
];

export default function ChatBot() {
    const [open, setOpen] = useState(false);
    const [msgs, setMsgs] = useState<Msg[]>([
        { role: "model", text: "Hi! I'm Rinshad's AI assistant 👋\nAsk me anything about his work, skills, or how to get in touch." },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [speaking, setSpeaking] = useState<number | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [autoSpeak, setAutoSpeak] = useState(true);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);
    const prevMsgCountRef = useRef(1); // tracks when a new bot message arrives

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [msgs, loading]);

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 300);
    }, [open]);

    // Auto-speak new bot messages
    useEffect(() => {
        const last = msgs[msgs.length - 1];
        const isNew = msgs.length > prevMsgCountRef.current;
        prevMsgCountRef.current = msgs.length;
        if (isNew && autoSpeak && last?.role === "model") {
            window.speechSynthesis.cancel();
            const utt = new SpeechSynthesisUtterance(last.text);
            const idx = msgs.length - 1;
            utt.onend = () => setSpeaking(null);
            utt.onerror = () => setSpeaking(null);
            setSpeaking(idx);
            window.speechSynthesis.speak(utt);
        }
    }, [msgs, autoSpeak]);

    const buildHistory = (messages: Msg[]) => {
        const withoutLast = messages.slice(0, -1);
        const firstUser = withoutLast.findIndex((m) => m.role === "user");
        if (firstUser === -1) return [];
        return withoutLast.slice(firstUser).map((m) => ({
            role: m.role,
            parts: [{ text: m.text }],
        }));
    };

    const speakToggle = (text: string, idx: number) => {
        window.speechSynthesis.cancel();
        if (speaking === idx) { setSpeaking(null); return; }
        const utt = new SpeechSynthesisUtterance(text);
        utt.onend = () => setSpeaking(null);
        utt.onerror = () => setSpeaking(null);
        setSpeaking(idx);
        window.speechSynthesis.speak(utt);
    };

    const send = async (text: string) => {
        if (!text.trim() || loading) return;
        const userMsg: Msg = { role: "user", text: text.trim() };
        const next = [...msgs, userMsg];
        setMsgs(next);
        setInput("");
        setLoading(true);
        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text.trim(), history: buildHistory(next) }),
            });
            const data = await res.json();
            setMsgs((prev) => [...prev, { role: "model", text: data.reply }]);
        } catch {
            setMsgs((prev) => [...prev, { role: "model", text: "Something went wrong. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SR) {
            alert("Voice input isn't supported in this browser.\nPlease use Chrome or Edge.");
            return;
        }

        // Stop any ongoing speech so mic doesn't pick it up
        window.speechSynthesis.cancel();
        setSpeaking(null);

        const rec = new SR();
        rec.lang = "en-US";
        rec.interimResults = false;
        rec.maxAlternatives = 1;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rec.onresult = (e: any) => {
            const transcript: string = e.results[0][0].transcript;
            setIsListening(false);
            send(transcript);
        };
        rec.onend = () => setIsListening(false);
        rec.onerror = () => setIsListening(false);

        recognitionRef.current = rec;
        rec.start();
        setIsListening(true);
    };

    const closeChat = () => {
        setOpen(false);
        window.speechSynthesis.cancel();
        setSpeaking(null);
        recognitionRef.current?.stop();
        setIsListening(false);
    };

    return (
        <>
            {/* Floating button */}
            <motion.button
                onClick={() => { setOpen((v) => !v); window.speechSynthesis.cancel(); setSpeaking(null); }}
                className="cursor-target fixed bottom-8 right-8 z-[80] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl"
                style={{ background: "linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)" }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                aria-label="Open chat"
            >
                <AnimatePresence mode="wait" initial={false}>
                    {open ? (
                        <motion.svg key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }} className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </motion.svg>
                    ) : (
                        <motion.svg key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }} className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </motion.svg>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Chat window */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.97 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed bottom-28 right-8 z-[79] flex flex-col rounded-3xl overflow-hidden"
                        style={{
                            width: "min(400px, calc(100vw - 2rem))",
                            height: "min(580px, calc(100vh - 9rem))",
                            background: "#0e0e0e",
                            border: "1px solid rgba(255,255,255,0.1)",
                            boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
                        }}
                    >
                        {/* Header */}
                        <div
                            className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
                            style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "#111" }}
                        >
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: "linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)" }}>
                                    R
                                </div>
                                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-[#111]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-semibold leading-none mb-1">Rinshad AI</p>
                                <p className="text-green-400 text-[11px]">● Active now</p>
                            </div>

                            {/* Auto-speak toggle */}
                            <button
                                onClick={() => {
                                    setAutoSpeak((v) => !v);
                                    if (autoSpeak) { window.speechSynthesis.cancel(); setSpeaking(null); }
                                }}
                                title={autoSpeak ? "Auto-speak on — click to mute" : "Auto-speak off — click to enable"}
                                style={{
                                    width: "32px", height: "32px", borderRadius: "50%",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    background: "transparent", border: "none", cursor: "pointer",
                                    color: autoSpeak ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.22)",
                                    transition: "color 0.2s, background 0.2s",
                                }}
                                className="hover:bg-white/10"
                            >
                                {autoSpeak ? (
                                    /* Speaker with waves */
                                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M19.07 4.929a10 10 0 010 14.142M12 5L7 9H4a1 1 0 00-1 1v4a1 1 0 001 1h3l5 4V5z" />
                                    </svg>
                                ) : (
                                    /* Speaker muted */
                                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                    </svg>
                                )}
                            </button>

                            {/* Close */}
                            <button
                                onClick={closeChat}
                                style={{
                                    width: "32px", height: "32px", borderRadius: "50%",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    background: "transparent", border: "none", cursor: "pointer",
                                    color: "rgba(255,255,255,0.35)",
                                }}
                                className="hover:text-white hover:bg-white/10 transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Messages */}
                        <div
                            className="flex-1 overflow-y-auto flex flex-col"
                            style={{ padding: "20px 16px", gap: "8px" }}
                        >
                            {msgs.map((m, i) => {
                                const isUser = m.role === "user";
                                const isLastBot = !isUser && (i === msgs.length - 1 || msgs[i + 1]?.role === "user");
                                return (
                                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", gap: "4px" }}>
                                        <div style={{ display: "flex", flexDirection: isUser ? "row-reverse" : "row", alignItems: "flex-end", gap: "8px", width: "100%" }}>
                                            {!isUser && (
                                                <div style={{
                                                    width: "28px", height: "28px", borderRadius: "50%",
                                                    background: "linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    flexShrink: 0, fontSize: "10px", fontWeight: 700, color: "#fff",
                                                    opacity: isLastBot ? 1 : 0, marginBottom: "2px",
                                                }}>
                                                    R
                                                </div>
                                            )}
                                            <div style={{
                                                maxWidth: "72%",
                                                padding: "12px 16px",
                                                borderRadius: isUser ? "20px 20px 5px 20px" : "20px 20px 20px 5px",
                                                background: isUser ? "linear-gradient(135deg,#833ab4,#fd1d1d)" : "rgba(255,255,255,0.1)",
                                                color: "#fff",
                                                fontSize: "14px",
                                                lineHeight: "1.5",
                                                wordBreak: "break-word",
                                                whiteSpace: "pre-wrap",
                                            }}>
                                                {m.text}
                                            </div>
                                        </div>

                                        {/* Manual listen/stop button per bot message */}
                                        {!isUser && (
                                            <button
                                                onClick={() => speakToggle(m.text, i)}
                                                style={{
                                                    marginLeft: "36px",
                                                    display: "flex", alignItems: "center", gap: "4px",
                                                    color: speaking === i ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.28)",
                                                    fontSize: "10px", fontFamily: "monospace", letterSpacing: "0.08em",
                                                    background: "none", border: "none", cursor: "pointer",
                                                    transition: "color 0.2s",
                                                }}
                                                className="hover:!text-white/70"
                                            >
                                                {speaking === i ? (
                                                    <>
                                                        <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24">
                                                            <rect x="6" y="4" width="4" height="16" rx="1" />
                                                            <rect x="14" y="4" width="4" height="16" rx="1" />
                                                        </svg>
                                                        Stop
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 5L7 9H4a1 1 0 00-1 1v4a1 1 0 001 1h3l5 4V5z" />
                                                        </svg>
                                                        Listen
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Typing indicator */}
                            {loading && (
                                <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
                                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "10px", fontWeight: 700, color: "#fff" }}>R</div>
                                    <div style={{ padding: "14px 18px", borderRadius: "20px 20px 20px 5px", background: "rgba(255,255,255,0.1)", display: "flex", gap: "6px", alignItems: "center" }}>
                                        {[0, 1, 2].map((j) => (
                                            <motion.span key={j}
                                                style={{ width: "8px", height: "8px", borderRadius: "50%", background: "rgba(255,255,255,0.5)", display: "block" }}
                                                animate={{ y: [0, -6, 0] }}
                                                transition={{ repeat: Infinity, duration: 0.8, delay: j * 0.18 }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* Suggestions */}
                        {msgs.length === 1 && (
                            <div style={{ padding: "8px 16px 12px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                                {SUGGESTIONS.map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => send(s)}
                                        style={{
                                            width: "100%", padding: "10px 16px",
                                            borderRadius: "12px",
                                            border: "1px solid rgba(255,255,255,0.12)",
                                            background: "rgba(255,255,255,0.05)",
                                            color: "rgba(255,255,255,0.7)",
                                            fontSize: "13px", textAlign: "left",
                                            cursor: "pointer", transition: "all 0.2s",
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                                        onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input bar */}
                        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
                            <form
                                onSubmit={(e) => { e.preventDefault(); send(input); }}
                                style={{ display: "flex", alignItems: "center", gap: "8px" }}
                            >
                                {/* Mic button */}
                                <motion.button
                                    type="button"
                                    onClick={toggleListening}
                                    animate={isListening ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                                    transition={isListening ? { repeat: Infinity, duration: 0.9, ease: "easeInOut" } : { duration: 0.15 }}
                                    title={isListening ? "Stop recording" : "Speak your message"}
                                    style={{
                                        width: "38px", height: "38px", borderRadius: "50%",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        flexShrink: 0, border: "none", cursor: "pointer",
                                        background: isListening ? "rgba(255,60,60,0.2)" : "rgba(255,255,255,0.08)",
                                        color: isListening ? "#ff5555" : "rgba(255,255,255,0.45)",
                                        transition: "background 0.25s, color 0.25s",
                                        outline: isListening ? "1.5px solid rgba(255,60,60,0.4)" : "none",
                                    }}
                                >
                                    {isListening ? (
                                        /* Waveform icon — indicates active recording */
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <rect x="2"  y="9"  width="2.5" height="6"  rx="1.25" />
                                            <rect x="6"  y="5"  width="2.5" height="14" rx="1.25" />
                                            <rect x="10" y="7"  width="2.5" height="10" rx="1.25" />
                                            <rect x="14" y="3"  width="2.5" height="18" rx="1.25" />
                                            <rect x="18" y="7"  width="2.5" height="10" rx="1.25" />
                                        </svg>
                                    ) : (
                                        /* Mic icon — idle */
                                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
                                        </svg>
                                    )}
                                </motion.button>

                                <input
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={isListening ? "Listening…" : "Message…"}
                                    style={{
                                        flex: 1,
                                        background: "rgba(255,255,255,0.07)",
                                        color: "#fff",
                                        fontSize: "14px",
                                        outline: "none",
                                        border: "none",
                                        borderRadius: "24px",
                                        padding: "10px 18px",
                                    }}
                                    className="placeholder-white/30"
                                />

                                {/* Send button */}
                                <button
                                    type="submit"
                                    disabled={!input.trim() || loading}
                                    style={{
                                        width: "38px", height: "38px", borderRadius: "50%",
                                        background: "linear-gradient(135deg,#833ab4,#fd1d1d)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        flexShrink: 0,
                                        opacity: !input.trim() || loading ? 0.32 : 1,
                                        transition: "opacity 0.2s",
                                        border: "none",
                                        cursor: !input.trim() || loading ? "not-allowed" : "pointer",
                                    }}
                                >
                                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#fff" style={{ transform: "translateX(1px)" }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
