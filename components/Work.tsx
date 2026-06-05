"use client";

import { useRef, useEffect, useLayoutEffect } from "react";

const projects = [
    {
        id: 1,
        title: "Social Media App",
        category: "MERN Stack Application",
        year: "2024",
        image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1974&auto=format&fit=crop",
    },
    {
        id: 2,
        title: "Live Landing Pages",
        category: "Next.js & Framer Motion",
        year: "2024",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop",
    },
    {
        id: 3,
        title: "Music Playlist App",
        category: "MERN Stack & Audio Streaming",
        year: "2024",
        image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop",
    },
];

export default function Work() {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const barRef = useRef<HTMLDivElement>(null);
    const counterRef = useRef<HTMLSpanElement>(null);

    // Hide below viewport before first paint
    useLayoutEffect(() => {
        if (panelRef.current) {
            panelRef.current.style.transform = `translateY(${window.innerHeight}px)`;
        }
    }, []);

    useEffect(() => {
        const wrapper = wrapperRef.current;
        const panel = panelRef.current;
        const track = trackRef.current;
        if (!wrapper || !panel || !track) return;

        let maxTranslate = 0;
        let wrapperH = 0;

        const measure = () => {
            track.style.transform = "translateX(0)";
            maxTranslate = Math.max(0, track.scrollWidth - window.innerWidth);
            /*
             * Wrapper height = IH + maxTranslate
             *
             * Entry starts 1 full screen (IH) before the wrapper reaches
             * the viewport top — the panel rises over TechStack with zero gap.
             * Horizontal scroll uses exactly maxTranslate px.
             * When horizontal ends, the wrapper bottom is exactly at the
             * viewport bottom so the footer (z-index:25) slides in immediately.
             */
            wrapperH = window.innerHeight + maxTranslate;
            wrapper.style.height = `${wrapperH}px`;
            update();
        };

        const update = () => {
            const IH = window.innerHeight;
            // scrolled < 0 means wrapper hasn't reached viewport top yet
            const scrolled = -wrapper.getBoundingClientRect().top;

            // Entry: begins IH/2 before wrapper reaches top, matching ScrollStack pinEnd
            const PRE = IH / 2;
            const entryP = Math.max(0, Math.min(1, (scrolled + PRE) / PRE));
            panel.style.transform = `translateY(${(1 - entryP) * IH}px)`;

            // Horizontal: scrolled 0 → maxTranslate (after entry finishes)
            const hP = maxTranslate > 0
                ? Math.max(0, Math.min(1, scrolled / maxTranslate))
                : 0;
            track.style.transform = `translateX(-${hP * maxTranslate}px)`;

            if (barRef.current) barRef.current.style.transform = `scaleX(${hP})`;
            if (counterRef.current) {
                const idx = Math.min(projects.length - 1, Math.floor(hP * projects.length));
                counterRef.current.textContent = `0${idx + 1} / 0${projects.length}`;
            }
        };

        measure();
        window.addEventListener("scroll", update, { passive: true });
        window.addEventListener("resize", measure);
        return () => {
            window.removeEventListener("scroll", update);
            window.removeEventListener("resize", measure);
        };
    }, []);

    return (
        <section id="work">
            <div ref={wrapperRef} style={{ height: "100vh" }}>
                <div
                    ref={panelRef}
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 20,
                        background: "var(--color-charcoal)",
                        overflow: "hidden",
                        willChange: "transform",
                    }}
                >
                    {/* Section title */}
                    <div
                        className="absolute top-8 left-0 right-0 z-10 pointer-events-none"
                        style={{ paddingLeft: "clamp(0.75rem, 2.5vw, 2.5rem)" }}
                    >
                        <div className="flex items-center gap-4 mb-3">
                            <div className="h-[1px] w-8 bg-gray-cool" />
                            <span className="text-gray-cool font-mono text-xs tracking-widest uppercase">
                                My Portfolio
                            </span>
                        </div>
                        <h2
                            className="font-display font-black text-ivory leading-none"
                            style={{ fontSize: "clamp(1.8rem, 4vw, 3.8rem)" }}
                        >
                            FEATURED
                            <br />
                            <span className="text-gray-cool opacity-40">PROJECTS</span>
                        </h2>
                    </div>

                    {/* Cards track */}
                    <div
                        ref={trackRef}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            height: "100%",
                            paddingLeft: "clamp(0.75rem, 2.5vw, 2.5rem)",
                            paddingRight: "clamp(0.75rem, 2.5vw, 2.5rem)",
                            gap: "28px",
                            willChange: "transform",
                        }}
                    >
                        {/* Left spacer — card-width on desktop, smaller on mobile */}
                        <div style={{ flexShrink: 0, width: "clamp(120px, 38vw, 680px)" }} />

                        {projects.map((project, index) => (
                            <div
                                key={project.id}
                                className="group relative overflow-hidden rounded-3xl bg-charcoal-light cursor-pointer"
                                style={{
                                    flexShrink: 0,
                                    width: "clamp(300px, 38vw, 680px)",
                                    height: "calc(100vh - 130px)",
                                }}
                            >
                                <div
                                    className="absolute inset-0 bg-cover bg-center transition-transform duration-[1200ms] group-hover:scale-105"
                                    style={{ backgroundImage: `url(${project.image})` }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent" />
                                <div className="absolute inset-0 bg-charcoal/10 group-hover:bg-charcoal/30 transition-colors duration-500" />

                                <div className="absolute top-7 left-7">
                                    <span className="font-mono text-[11px] text-ivory/40 tracking-[0.25em]">
                                        0{index + 1}
                                    </span>
                                </div>

                                <div className="absolute top-7 right-7 w-11 h-11 rounded-full border border-ivory/20 flex items-center justify-center opacity-0 group-hover:opacity-100 -rotate-45 group-hover:rotate-0 transition-all duration-500">
                                    <svg
                                        className="w-4 h-4 text-ivory"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17 8l4 4m0 0l-4 4m4-4H3"
                                        />
                                    </svg>
                                </div>

                                <div className="absolute bottom-7 left-7 right-7">
                                    <span className="font-mono text-[11px] sm:text-xs text-ivory/50 tracking-widest uppercase mb-2 block">
                                        {project.category} · {project.year}
                                    </span>
                                    <h3
                                        className="font-display font-bold text-ivory leading-tight"
                                        style={{ fontSize: "clamp(1.2rem, 2.8vw, 2.2rem)" }}
                                    >
                                        {project.title}
                                    </h3>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Progress bar */}
                    <div
                        className="absolute bottom-8 left-0 right-0 flex items-center gap-4"
                        style={{
                            paddingLeft: "clamp(0.75rem, 2.5vw, 2.5rem)",
                            paddingRight: "clamp(0.75rem, 2.5vw, 2.5rem)",
                        }}
                    >
                        <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-gray-cool">
                            Scroll
                        </span>
                        <div className="flex-1 h-[1px] bg-ivory/10 relative overflow-hidden">
                            <div
                                ref={barRef}
                                className="absolute inset-0 bg-ivory origin-left"
                                style={{ transform: "scaleX(0)" }}
                            />
                        </div>
                        <span
                            ref={counterRef}
                            className="font-mono text-[10px] tracking-[0.25em] text-gray-cool tabular-nums"
                        >
                            01 / 0{projects.length}
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
