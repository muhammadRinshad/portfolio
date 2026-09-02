"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Portfolio palette
const C = {
    charcoal:      "#1A1A1D",
    charcoalLight: "#2D2D30",
    charcoalDark:  "#0F0F10",
    grayCool:      "#6E7C7C",
    grayDarker:    "#4A5454",
    grayLighter:   "#B8C5C5",
    ivory:         "#F5F5F0",
};

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
    const [streaming, setStreaming] = useState(false);   // true while chunks are flowing in
    const [slowHint, setSlowHint] = useState(false);    // "Still thinking…" after 8s
    const [autoSpeak, setAutoSpeak] = useState(false);
    const [speakHintDismissed, setSpeakHintDismissed] = useState(false);
    const [recLang, setRecLang] = useState<"en-US" | "ml-IN">("en-US");
    const [voiceError, setVoiceError] = useState("");
    const voiceErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /* ─── Daily client-side message limit ────────────
       20 messages per day per browser. Soft guard on top of server rate limit. */
    const DAILY_LIMIT = 20;
    const getLimitData = () => {
        try {
            const raw = localStorage.getItem("chat_limit");
            if (!raw) return { count: 0, day: "" };
            return JSON.parse(raw) as { count: number; day: string };
        } catch { return { count: 0, day: "" }; }
    };
    const today = () => new Date().toISOString().slice(0, 10);
    const getMsgCount = () => {
        const d = getLimitData();
        return d.day === today() ? d.count : 0;
    };
    const incrementMsgCount = () => {
        const d = getLimitData();
        const count = d.day === today() ? d.count + 1 : 1;
        try { localStorage.setItem("chat_limit", JSON.stringify({ count, day: today() })); } catch { /* ignore */ }
        return count;
    };
    const [msgCount, setMsgCount] = useState(0);
    const isLimitReached = msgCount >= DAILY_LIMIT;

    const bottomRef    = useRef<HTMLDivElement>(null);
    const inputRef     = useRef<HTMLInputElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef  = useRef<any>(null);
    const abortRef        = useRef<AbortController | null>(null);
    const slowTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
    const voicesRef       = useRef<SpeechSynthesisVoice[]>([]);
    // Ref mirrors for use inside async send() without stale closures
    const autoSpeakRef    = useRef(false);
    const latestBotIdxRef = useRef(-1);

    useEffect(() => { autoSpeakRef.current = autoSpeak; }, [autoSpeak]);

    // Initialise daily counter from localStorage on mount
    useEffect(() => { setMsgCount(getMsgCount()); }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [msgs, loading]);

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 300);
    }, [open]);

    useEffect(() => {
        const load = () => { voicesRef.current = window.speechSynthesis.getVoices(); };
        load();
        window.speechSynthesis.addEventListener("voiceschanged", load);
        return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
    }, []);

    useEffect(() => {
        return () => { if (voiceErrorTimerRef.current) clearTimeout(voiceErrorTimerRef.current); };
    }, []);

    /* ─── Voice error helper ──────────────────────── */
    const showVoiceError = (msg: string) => {
        setVoiceError(msg);
        if (voiceErrorTimerRef.current) clearTimeout(voiceErrorTimerRef.current);
        voiceErrorTimerRef.current = setTimeout(() => setVoiceError(""), 6000);
    };

    /* ─── TTS ─────────────────────────────────────── */
    const isMalayalamText = (text: string) => /[ഀ-ൿ]/.test(text);

    const buildAndSpeak = (text: string, idx: number) => {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(text);
        const ml = isMalayalamText(text);
        utt.lang = ml ? "ml-IN" : "en-US";
        const lp = ml ? "ml" : "en";
        const voice =
            voicesRef.current.find(v => v.lang === utt.lang) ||
            voicesRef.current.find(v => v.lang.startsWith(lp)) || null;

        // If text is Malayalam but no Malayalam TTS voice is installed, bail gracefully
        if (ml && !voice) {
            showVoiceError("No Malayalam voice installed on this device. Go to System Settings → Language & Speech → add a Malayalam voice to hear audio playback.");
            return;
        }

        if (voice) utt.voice = voice;
        utt.onend = () => setSpeaking(null);
        utt.onerror = () => setSpeaking(null);
        setSpeaking(idx);
        window.speechSynthesis.speak(utt);
    };

    const speakToggle = (text: string, idx: number) => {
        if (speaking === idx) { window.speechSynthesis.cancel(); setSpeaking(null); return; }
        buildAndSpeak(text, idx);
    };

    /* ─── History builder ──────────────────────────── */
    const buildHistory = (messages: Msg[]) => {
        const withoutLast = messages.slice(0, -1);
        const firstUser = withoutLast.findIndex(m => m.role === "user");
        if (firstUser === -1) return [];
        return withoutLast.slice(firstUser).map(m => ({ role: m.role, parts: [{ text: m.text }] }));
    };

    /* ─── Send with streaming ──────────────────────── */
    const stopGeneration = () => {
        abortRef.current?.abort();
    };

    const send = async (text: string, forceSpeak = false) => {
        if (!text.trim() || loading || streaming) return;
        if (isLimitReached) return;   // hard stop — UI already shows the wall
        const userMsg: Msg = { role: "user", text: text.trim() };
        const next = [...msgs, userMsg];
        setMsgs(next);
        setInput("");
        setLoading(true);
        // Increment and sync daily counter
        const newCount = incrementMsgCount();
        setMsgCount(newCount);
        setStreaming(false);
        setSlowHint(false);

        // Fresh abort controller for this request
        const controller = new AbortController();
        abortRef.current = controller;

        // Show "Still thinking…" hint after 8 s; hard-abort after 45 s
        if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
        slowTimerRef.current = setTimeout(() => setSlowHint(true), 8000);
        const hardTimeout = setTimeout(() => controller.abort("timeout"), 45000);

        let accumulated = "";
        let firstChunk = true;
        let aborted = false;
        let timedOut = false;

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text.trim(), history: buildHistory(next) }),
                signal: controller.signal,
            });

            if (res.status === 429) {
                const data = await res.json().catch(() => ({}));
                const mins = data.resetInMin ?? 60;
                setMsgs(prev => [...prev, { role: "model", text: `🚫 You've sent too many messages. Please wait about ${mins} minute${mins !== 1 ? "s" : ""} and try again.` }]);
                return;
            }
            if (!res.ok || !res.body) throw new Error("Request failed");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                if (!chunk) continue;
                accumulated += chunk;

                if (firstChunk) {
                    firstChunk = false;
                    setLoading(false);
                    setStreaming(true);
                    setSlowHint(false);
                    if (slowTimerRef.current) { clearTimeout(slowTimerRef.current); slowTimerRef.current = null; }
                    setMsgs(prev => {
                        latestBotIdxRef.current = prev.length;   // index of new bot msg
                        return [...prev, { role: "model", text: chunk }];
                    });
                } else {
                    setMsgs(prev => {
                        const updated = [...prev];
                        const last = updated[updated.length - 1];
                        if (last?.role === "model") {
                            updated[updated.length - 1] = { role: "model", text: last.text + chunk };
                        }
                        return updated;
                    });
                }
            }

            // Auto-speak the COMPLETE reply (not chunk-by-chunk)
            // forceSpeak = true when message was sent via mic (always speak the reply)
            if ((autoSpeakRef.current || forceSpeak) && accumulated && latestBotIdxRef.current >= 0) {
                buildAndSpeak(accumulated, latestBotIdxRef.current);
            }

        } catch (err: unknown) {
            if (err instanceof Error && err.name === "AbortError") {
                // Distinguish hard timeout from user pressing stop
                timedOut = (controller.signal.reason === "timeout");
                aborted = !timedOut;

                if (timedOut) {
                    setMsgs(prev => [...prev, { role: "model", text: "⏱ The AI is taking too long to respond. Please try again in a moment." }]);
                } else {
                    // User pressed stop — keep any partial text; only add "Stopped." if nothing arrived yet
                    if (firstChunk) {
                        setMsgs(prev => [...prev, { role: "model", text: "Stopped." }]);
                    }
                }
            } else {
                setMsgs(prev => [...prev, { role: "model", text: "Something went wrong. Please try again." }]);
            }
        } finally {
            clearTimeout(hardTimeout);
            if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
            setLoading(false);
            setStreaming(false);
            setSlowHint(false);
            if (!aborted) abortRef.current = null;
        }
    };

    /* ─── Voice: hold-to-speak ────────────────────── */
    const startListening = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SR) {
            showVoiceError("Voice input isn't supported in this browser. Use Chrome or Edge.");
            return;
        }

        window.speechSynthesis.cancel();
        setSpeaking(null);
        setInput("");
        setVoiceError("");

        const rec = new SR();
        rec.lang = recLang;
        rec.interimResults = true;
        rec.maxAlternatives = 1;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rec.onresult = (e: any) => {
            let interim = "", finalText = "";
            for (let i = 0; i < e.results.length; i++) {
                const t = e.results[i][0].transcript;
                if (e.results[i].isFinal) finalText += t; else interim += t;
            }
            setInput(finalText || interim);
            if (finalText) { setIsListening(false); setInput(""); send(finalText, true); }
        };
        rec.onend = () => setIsListening(false);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rec.onerror = (e: any) => {
            setIsListening(false);
            setInput("");
            const err = e?.error ?? "";
            if (err === "language-not-supported") {
                showVoiceError("Malayalam voice isn't supported on this browser. Type in Malayalam — AI will still reply in Malayalam. 🌐");
            } else if (err === "not-allowed") {
                showVoiceError("Microphone access denied. Allow mic permissions and try again.");
            } else if (err !== "no-speech" && err !== "aborted") {
                showVoiceError("Voice input failed. Please try again.");
            }
        };

        recognitionRef.current = rec;

        // iOS Safari may throw synchronously if language is not supported
        try {
            rec.start();
            setIsListening(true);
        } catch {
            setIsListening(false);
            if (recLang === "ml-IN") {
                showVoiceError("Malayalam voice isn't supported on this browser. Type in Malayalam — AI will still reply in Malayalam. 🌐");
            } else {
                showVoiceError("Voice input failed. Please try again.");
            }
        }
    };

    const stopListening = () => {
        recognitionRef.current?.stop();
        // onresult fires with isFinal after stop() — if interim text is in input, send it
        setTimeout(() => {
            setInput(prev => {
                if (prev.trim()) { send(prev.trim(), true); return ""; }
                return prev;
            });
        }, 400);
    };

    // Hold-to-speak: pointer events (works for both mouse and touch)
    const handleMicPointerDown = (e: React.PointerEvent) => {
        e.currentTarget.setPointerCapture(e.pointerId);   // keep capture even if finger moves off
        startListening();
    };

    const handleMicPointerUp = () => {
        if (isListening) stopListening();
    };

    const closeChat = () => {
        setOpen(false);
        window.speechSynthesis.cancel();
        setSpeaking(null);
        recognitionRef.current?.stop();
        setIsListening(false);
    };

    /* ─── Icon helpers ─────────────────────────────── */
    const IconSpeakerOn = () => (
        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.536 8.464a5 5 0 010 7.072M19.07 4.929a10 10 0 010 14.142M12 5L7 9H4a1 1 0 00-1 1v4a1 1 0 001 1h3l5 4V5z" />
        </svg>
    );
    const IconSpeakerOff = () => (
        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
        </svg>
    );

    return (
        <>
            {/* ── Floating button ──────────────────────────── */}
            <motion.button
                onClick={() => { setOpen(v => !v); window.speechSynthesis.cancel(); setSpeaking(null); }}
                className="cursor-target fixed bottom-5 right-4 sm:bottom-8 sm:right-8 z-[80] w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center"
                style={{
                    background: C.ivory,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3)",
                }}
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.93 }}
                aria-label="Open chat"
            >
                <AnimatePresence mode="wait" initial={false}>
                    {open ? (
                        <motion.svg key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.16 }} width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={C.charcoal} strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </motion.svg>
                    ) : (
                        <motion.svg key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.16 }} width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={C.charcoal} strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </motion.svg>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* ── Chat window ───────────────────────────────── */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.97 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        // Mobile: stretch edge-to-edge with 12px margins on both sides
                        // sm+: fixed 390px wide, anchored to right
                        className="fixed z-[79] flex flex-col overflow-hidden
                                   bottom-28 left-3 right-3
                                   sm:left-auto sm:right-8 sm:w-[390px]"
                        style={{
                            height: "calc(100vh - 10rem)",   // full height minus button + spacing
                            maxHeight: "560px",              // cap on large screens
                            minHeight: "300px",              // floor for tiny phones
                            background: C.charcoalDark,
                            border: "1px solid rgba(245,245,240,0.07)",
                            borderRadius: "20px",
                            boxShadow: "0 40px 100px rgba(0,0,0,0.75), 0 8px 24px rgba(0,0,0,0.5)",
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            display: "flex", alignItems: "center", gap: "12px",
                            padding: "14px 18px",
                            background: C.charcoal,
                            borderBottom: "1px solid rgba(245,245,240,0.06)",
                            flexShrink: 0,
                        }}>
                            <div style={{ position: "relative", flexShrink: 0 }}>
                                <div style={{
                                    width: "38px", height: "38px", borderRadius: "50%",
                                    background: C.ivory,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: "13px", fontWeight: 700, color: C.charcoal,
                                    fontFamily: "var(--font-display)",
                                }}>R</div>
                                <span style={{
                                    position: "absolute", bottom: 0, right: 0,
                                    width: "10px", height: "10px", borderRadius: "50%",
                                    background: C.grayCool,
                                    border: `2px solid ${C.charcoal}`,
                                }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ color: C.ivory, fontSize: "13px", fontWeight: 600, lineHeight: 1, marginBottom: "4px", fontFamily: "var(--font-display)" }}>
                                    Rinshad AI
                                </p>
                                <p style={{ color: C.grayCool, fontSize: "10px", fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>
                                    ● ONLINE
                                </p>
                            </div>

                            {/* Auto-speak toggle */}
                            <button
                                onClick={() => { setAutoSpeak(v => !v); if (autoSpeak) { window.speechSynthesis.cancel(); setSpeaking(null); } }}
                                title={autoSpeak ? "Voice replies on" : "Voice replies off"}
                                style={{
                                    width: "30px", height: "30px", borderRadius: "50%",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    background: "transparent", border: "none", cursor: "pointer",
                                    color: autoSpeak ? C.grayLighter : C.grayDarker,
                                    transition: "color 0.2s",
                                }}
                            >
                                {autoSpeak ? <IconSpeakerOn /> : <IconSpeakerOff />}
                            </button>

                            {/* Close */}
                            <button onClick={closeChat} style={{
                                width: "30px", height: "30px", borderRadius: "50%",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                background: "transparent", border: "none", cursor: "pointer",
                                color: C.grayDarker, transition: "color 0.2s",
                            }}
                                onMouseEnter={e => (e.currentTarget.style.color = C.grayLighter)}
                                onMouseLeave={e => (e.currentTarget.style.color = C.grayDarker)}
                            >
                                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Voice hint banner */}
                        <AnimatePresence>
                            {!autoSpeak && !speakHintDismissed && (
                                <motion.button
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    type="button"
                                    onClick={() => { setAutoSpeak(true); setSpeakHintDismissed(true); }}
                                    style={{
                                        width: "100%", flexShrink: 0,
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                                        padding: "6px 16px",
                                        background: "rgba(110,124,124,0.1)",
                                        border: "none",
                                        borderBottom: "1px solid rgba(245,245,240,0.05)",
                                        cursor: "pointer",
                                        color: C.grayCool,
                                        fontSize: "10px",
                                        fontFamily: "var(--font-mono)",
                                        letterSpacing: "0.06em",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M19.07 4.929a10 10 0 010 14.142M12 5L7 9H4a1 1 0 00-1 1v4a1 1 0 001 1h3l5 4V5z" />
                                    </svg>
                                    Tap to enable voice replies
                                    <span style={{ opacity: 0.4, marginLeft: "4px" }}>✕</span>
                                </motion.button>
                            )}
                        </AnimatePresence>

                        {/* Messages */}
                        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px", padding: "14px 12px" }}>
                            {msgs.map((m, i) => {
                                const isUser = m.role === "user";
                                const isLastBot = !isUser && (i === msgs.length - 1 || msgs[i + 1]?.role === "user");
                                return (
                                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", gap: "3px" }}>
                                        <div style={{ display: "flex", flexDirection: isUser ? "row-reverse" : "row", alignItems: "flex-end", gap: "8px", width: "100%" }}>
                                            {!isUser && (
                                                <div style={{
                                                    width: "26px", height: "26px", borderRadius: "50%",
                                                    background: C.ivory, color: C.charcoal,
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    flexShrink: 0, fontSize: "9px", fontWeight: 700,
                                                    fontFamily: "var(--font-display)",
                                                    opacity: isLastBot ? 1 : 0, marginBottom: "2px",
                                                }}>R</div>
                                            )}
                                            <div style={{
                                                maxWidth: "72%",
                                                padding: "11px 15px",
                                                borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                                                background: isUser ? C.ivory : "rgba(245,245,240,0.05)",
                                                border: isUser ? "none" : "1px solid rgba(245,245,240,0.07)",
                                                color: isUser ? C.charcoal : C.grayLighter,
                                                fontSize: "13.5px",
                                                lineHeight: "1.55",
                                                wordBreak: "break-word",
                                                whiteSpace: "pre-wrap",
                                                fontFamily: "var(--font-sans)",
                                            }}>
                                                {m.text}
                                            </div>
                                        </div>

                                        {!isUser && (
                                            <button onClick={() => speakToggle(m.text, i)}
                                                style={{
                                                    marginLeft: "34px",
                                                    display: "flex", alignItems: "center", gap: "4px",
                                                    color: speaking === i ? C.grayLighter : C.grayDarker,
                                                    fontSize: "9px", fontFamily: "var(--font-mono)",
                                                    letterSpacing: "0.1em", textTransform: "uppercase",
                                                    background: "none", border: "none", cursor: "pointer",
                                                    transition: "color 0.2s",
                                                }}
                                                onMouseEnter={e => (e.currentTarget.style.color = C.grayLighter)}
                                                onMouseLeave={e => (e.currentTarget.style.color = speaking === i ? C.grayLighter : C.grayDarker)}
                                            >
                                                {speaking === i ? (
                                                    <><svg width="9" height="9" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg> Stop</>
                                                ) : (
                                                    <><svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 5L7 9H4a1 1 0 00-1 1v4a1 1 0 001 1h3l5 4V5z" /></svg> Listen</>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Typing dots */}
                            {loading && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
                                        <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: C.ivory, color: C.charcoal, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "9px", fontWeight: 700 }}>R</div>
                                        <div style={{ padding: "13px 16px", borderRadius: "18px 18px 18px 4px", background: "rgba(245,245,240,0.05)", border: "1px solid rgba(245,245,240,0.07)", display: "flex", gap: "5px", alignItems: "center" }}>
                                            {[0, 1, 2].map(j => (
                                                <motion.span key={j}
                                                    style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.grayCool, display: "block" }}
                                                    animate={{ y: [0, -5, 0] }}
                                                    transition={{ repeat: Infinity, duration: 0.85, delay: j * 0.18 }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    {/* "Still thinking" hint after 8 s */}
                                    <AnimatePresence>
                                        {slowHint && (
                                            <motion.p
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                                style={{
                                                    marginLeft: "34px",
                                                    color: C.grayDarker,
                                                    fontSize: "10px",
                                                    fontFamily: "var(--font-mono)",
                                                    letterSpacing: "0.06em",
                                                    margin: "0 0 0 34px",
                                                }}
                                            >
                                                Still thinking… tap ■ to stop
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* Suggestions */}
                        {msgs.length === 1 && (
                            <div style={{ padding: "6px 12px 10px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
                                {SUGGESTIONS.map(s => (
                                    <button key={s} onClick={() => send(s)}
                                        style={{
                                            width: "100%", padding: "9px 14px",
                                            borderRadius: "10px",
                                            border: "1px solid rgba(245,245,240,0.09)",
                                            background: "transparent",
                                            color: C.grayCool,
                                            fontSize: "12px", textAlign: "left", cursor: "pointer",
                                            fontFamily: "var(--font-sans)",
                                            transition: "border-color 0.2s, color 0.2s",
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(245,245,240,0.2)"; e.currentTarget.style.color = C.grayLighter; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(245,245,240,0.09)"; e.currentTarget.style.color = C.grayCool; }}
                                    >{s}</button>
                                ))}
                            </div>
                        )}

                        {/* Voice error banner */}
                        <AnimatePresence>
                            {voiceError && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    style={{
                                        flexShrink: 0,
                                        display: "flex", alignItems: "flex-start", gap: "8px",
                                        padding: "8px 14px",
                                        background: "rgba(184,197,197,0.07)",
                                        borderTop: "1px solid rgba(245,245,240,0.05)",
                                    }}
                                >
                                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke={C.grayCool} strokeWidth={2} style={{ flexShrink: 0, marginTop: "1px" }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                    </svg>
                                    <p style={{ flex: 1, color: C.grayCool, fontSize: "11px", lineHeight: "1.5", fontFamily: "var(--font-sans)", margin: 0 }}>
                                        {voiceError}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setVoiceError("")}
                                        style={{ background: "none", border: "none", cursor: "pointer", color: C.grayDarker, padding: "0 0 0 4px", flexShrink: 0 }}
                                    >
                                        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Input bar */}
                        <div style={{ padding: "8px 12px 12px", borderTop: "1px solid rgba(245,245,240,0.06)", flexShrink: 0 }}>

                            {/* Daily limit wall */}
                            {isLimitReached ? (
                                <div style={{
                                    display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
                                    padding: "14px 16px",
                                    borderRadius: "12px",
                                    background: "rgba(245,245,240,0.04)",
                                    border: "1px solid rgba(245,245,240,0.09)",
                                    textAlign: "center",
                                }}>
                                    <span style={{ fontSize: "18px" }}>🚫</span>
                                    <p style={{ color: C.grayLighter, fontSize: "12px", lineHeight: "1.5", margin: 0, fontFamily: "var(--font-sans)" }}>
                                        You&apos;ve reached today&apos;s limit of <strong>{DAILY_LIMIT} messages</strong>.<br />
                                        Come back tomorrow or reach Rinshad directly.
                                    </p>
                                    <a href="mailto:muhammadrinshad13@gmail.com"
                                        style={{
                                            color: C.ivory, fontSize: "11px",
                                            fontFamily: "var(--font-mono)", letterSpacing: "0.06em",
                                            textDecoration: "none", opacity: 0.7,
                                        }}>
                                        muhammadrinshad13@gmail.com →
                                    </a>
                                </div>
                            ) : (
                            <form onSubmit={e => { e.preventDefault(); send(input); }}
                                style={{ display: "flex", alignItems: "center", gap: "8px" }}>

                                {/* EN / ML toggle */}
                                <button type="button"
                                    onClick={() => setRecLang(l => l === "en-US" ? "ml-IN" : "en-US")}
                                    title={recLang === "en-US" ? "Switch to Malayalam" : "Switch to English"}
                                    style={{
                                        flexShrink: 0,
                                        height: "30px", padding: "0 9px",
                                        borderRadius: "8px",
                                        border: `1px solid ${recLang === "ml-IN" ? "rgba(245,245,240,0.2)" : "rgba(245,245,240,0.09)"}`,
                                        background: recLang === "ml-IN" ? "rgba(245,245,240,0.1)" : "transparent",
                                        color: recLang === "ml-IN" ? C.ivory : C.grayCool,
                                        fontSize: "9px", fontWeight: 700,
                                        fontFamily: "var(--font-mono)",
                                        letterSpacing: "0.08em",
                                        cursor: "pointer", transition: "all 0.2s",
                                    }}
                                >{recLang === "ml-IN" ? "ML" : "EN"}</button>

                                {/* Mic — hold to speak */}
                                <div style={{ position: "relative", flexShrink: 0 }}>
                                    <motion.button
                                        type="button"
                                        onPointerDown={handleMicPointerDown}
                                        onPointerUp={handleMicPointerUp}
                                        onPointerCancel={handleMicPointerUp}
                                        animate={isListening ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                                        transition={isListening ? { repeat: Infinity, duration: 0.9, ease: "easeInOut" } : { duration: 0.15 }}
                                        title={isListening ? "Release to send" : "Hold to speak"}
                                        style={{
                                            width: "36px", height: "36px", borderRadius: "50%",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            border: `1px solid ${isListening ? "rgba(245,245,240,0.25)" : "rgba(245,245,240,0.09)"}`,
                                            cursor: "pointer",
                                            background: isListening ? "rgba(245,245,240,0.12)" : "transparent",
                                            color: isListening ? C.ivory : C.grayDarker,
                                            transition: "all 0.2s",
                                            userSelect: "none",
                                            WebkitUserSelect: "none",
                                            touchAction: "none",   // prevent scroll interference on mobile
                                        }}
                                    >
                                        {isListening ? (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                <rect x="2"  y="9"  width="2.5" height="6"  rx="1.25" />
                                                <rect x="6"  y="5"  width="2.5" height="14" rx="1.25" />
                                                <rect x="10" y="7"  width="2.5" height="10" rx="1.25" />
                                                <rect x="14" y="3"  width="2.5" height="18" rx="1.25" />
                                                <rect x="18" y="7"  width="2.5" height="10" rx="1.25" />
                                            </svg>
                                        ) : (
                                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
                                            </svg>
                                        )}
                                    </motion.button>
                                    {/* "Hold" label under mic — only when idle */}
                                    {!isListening && (
                                        <span style={{
                                            position: "absolute", bottom: "-13px", left: "50%",
                                            transform: "translateX(-50%)",
                                            fontSize: "7px", color: C.grayDarker,
                                            fontFamily: "var(--font-mono)",
                                            letterSpacing: "0.05em",
                                            whiteSpace: "nowrap",
                                            pointerEvents: "none",
                                        }}>HOLD</span>
                                    )}
                                    {isListening && (
                                        <span style={{
                                            position: "absolute", bottom: "-13px", left: "50%",
                                            transform: "translateX(-50%)",
                                            fontSize: "7px", color: C.grayLighter,
                                            fontFamily: "var(--font-mono)",
                                            letterSpacing: "0.05em",
                                            whiteSpace: "nowrap",
                                            pointerEvents: "none",
                                        }}>RELEASE</span>
                                    )}
                                </div>

                                {/* Text input */}
                                <input
                                    ref={inputRef}
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    placeholder={isListening
                                        ? (recLang === "ml-IN" ? "സംസാരിക്കൂ…" : "Listening…")
                                        : "Message…"
                                    }
                                    readOnly={isListening && !input}
                                    style={{
                                        flex: 1,
                                        background: isListening ? "rgba(245,245,240,0.05)" : "rgba(245,245,240,0.04)",
                                        color: C.ivory,
                                        fontSize: "13px",
                                        outline: "none",
                                        border: `1px solid ${isListening ? "rgba(245,245,240,0.18)" : "rgba(245,245,240,0.09)"}`,
                                        borderRadius: "20px",
                                        padding: "9px 16px",
                                        fontFamily: "var(--font-sans)",
                                        transition: "border 0.25s",
                                        marginBottom: "2px",   // room for HOLD label
                                    }}
                                    className="placeholder-[#4A5454]"
                                />

                                {/* Stop button (visible while loading or streaming) */}
                                <AnimatePresence mode="wait" initial={false}>
                                    {(loading || streaming) ? (
                                        <motion.button
                                            key="stop"
                                            type="button"
                                            onClick={stopGeneration}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ duration: 0.15 }}
                                            title="Stop generating"
                                            style={{
                                                width: "36px", height: "36px", borderRadius: "50%",
                                                background: "rgba(245,245,240,0.1)",
                                                border: "1px solid rgba(245,245,240,0.2)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                flexShrink: 0, cursor: "pointer",
                                                color: C.grayLighter,
                                                marginBottom: "2px",
                                            }}
                                        >
                                            {/* Stop square icon */}
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                                                <rect x="4" y="4" width="16" height="16" rx="2" />
                                            </svg>
                                        </motion.button>
                                    ) : (
                                        <motion.button
                                            key="send"
                                            type="submit"
                                            disabled={!input.trim()}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ duration: 0.15 }}
                                            title="Send"
                                            style={{
                                                width: "36px", height: "36px", borderRadius: "50%",
                                                background: C.ivory,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                flexShrink: 0, border: "none",
                                                opacity: !input.trim() ? 0.22 : 1,
                                                transition: "opacity 0.2s",
                                                cursor: !input.trim() ? "not-allowed" : "pointer",
                                                marginBottom: "2px",
                                            }}
                                        >
                                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={C.charcoal} strokeWidth={2.5} style={{ transform: "translateX(1px)" }}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                            </svg>
                                        </motion.button>
                                    )}
                                </AnimatePresence>
                            </form>
                            )} {/* end isLimitReached ternary */}

                            {/* Remaining count — shown when not yet limited */}
                            {!isLimitReached && msgCount > 0 && (
                                <p style={{
                                    textAlign: "right", marginTop: "4px",
                                    color: msgCount >= DAILY_LIMIT - 5 ? "rgba(184,197,197,0.55)" : "transparent",
                                    fontSize: "9px", fontFamily: "var(--font-mono)",
                                    letterSpacing: "0.05em", pointerEvents: "none",
                                    transition: "color 0.3s",
                                }}>
                                    {DAILY_LIMIT - msgCount} messages left today
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
