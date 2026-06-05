"use client";

import { motion } from "framer-motion";
import { useState, useRef } from "react";
import emailjs from "@emailjs/browser";

const socials = [
    {
        name: "LinkedIn",
        href: "https://linkedin.com/in/muhammed-rinshad13",
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
        ),
    },
    {
        name: "GitHub",
        href: "https://github.com/muhammed-rinshad",
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
        ),
    },
    {
        name: "Twitter",
        href: "#",
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        ),
    },
    {
        name: "Instagram",
        href: "#",
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
        ),
    },
];

export default function Footer() {
    const formRef = useRef<HTMLFormElement>(null);
    const [formData, setFormData] = useState({ name: "", email: "", message: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!formRef.current) return;
        setIsSubmitting(true);
        setSubmitStatus("idle");
        try {
            await emailjs.sendForm(
                "service_1j03ky8",
                "template_j5y1phz",
                formRef.current,
                "IyX1SsUxJw3qUSVyP"
            );
            setSubmitStatus("success");
            setFormData({ name: "", email: "", message: "" });
        } catch {
            setSubmitStatus("error");
        } finally {
            setIsSubmitting(false);
            setTimeout(() => setSubmitStatus("idle"), 5000);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const inputBase =
        "w-full bg-transparent border-0 border-b border-ivory/20 text-ivory placeholder-ivory/30 py-3 text-sm sm:text-base focus:outline-none focus:border-ivory/70 transition-colors duration-300 resize-none";

    return (
        <footer
            id="contact"
            className="bg-charcoal w-full relative overflow-hidden"
            style={{ zIndex: 25, paddingTop: "clamp(3rem, 6vw, 6rem)" }}
        >
            <div className="section-content">

                {/* ── Header ── */}
                <motion.div
                    initial={{ opacity: 0, y: 32 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="mb-14 sm:mb-20"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-[1px] w-10 bg-gray-cool" />
                        <span className="font-mono text-[10px] tracking-widest uppercase text-gray-cool">
                            Contact
                        </span>
                    </div>
                    <h2
                        className="font-display font-black text-ivory leading-none"
                        style={{ fontSize: "clamp(2.6rem, 6vw, 6rem)" }}
                    >
                        LET&apos;S WORK
                        <br />
                        <span className="text-gray-cool opacity-50">TOGETHER</span>
                    </h2>
                </motion.div>

                {/* ── Two-column grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-14 lg:gap-20 pb-16 sm:pb-24">

                    {/* Left — contact info */}
                    <motion.div
                        initial={{ opacity: 0, x: -24 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                        className="flex flex-col gap-8"
                    >
                        {/* Email */}
                        <div>
                            <p className="font-mono text-[10px] tracking-widest uppercase text-gray-cool mb-2">
                                Email
                            </p>
                            <a
                                href="mailto:muhammadrinshad13@gmail.com"
                                className="group inline-flex items-center gap-2 text-ivory font-medium text-sm sm:text-base hover:text-gray-cool transition-colors duration-300 break-all"
                            >
                                muhammadrinshad13@gmail.com
                                <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-y-0.5 transition-all duration-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        </div>

                        {/* Phone */}
                        <div>
                            <p className="font-mono text-[10px] tracking-widest uppercase text-gray-cool mb-2">
                                Phone
                            </p>
                            <a
                                href="tel:+916282805682"
                                className="text-ivory font-medium text-sm sm:text-base hover:text-gray-cool transition-colors duration-300"
                            >
                                +91 62828 05682
                            </a>
                        </div>

                        {/* Location */}
                        <div>
                            <p className="font-mono text-[10px] tracking-widest uppercase text-gray-cool mb-2">
                                Based In
                            </p>
                            <p className="text-ivory font-medium text-sm sm:text-base">
                                Malappuram, Kerala, India
                            </p>
                        </div>

                        {/* Social icons */}
                        <div>
                            <p className="font-mono text-[10px] tracking-widest uppercase text-gray-cool mb-4">
                                Find me on
                            </p>
                            <div className="flex items-center gap-3">
                                {socials.map((s) => (
                                    <a
                                        key={s.name}
                                        href={s.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={s.name}
                                        className="w-9 h-9 rounded-full border border-ivory/15 flex items-center justify-center text-ivory/60 hover:text-ivory hover:border-ivory/50 hover:bg-ivory/8 transition-all duration-300"
                                    >
                                        {s.icon}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Right — form */}
                    <motion.div
                        initial={{ opacity: 0, x: 24 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                    >
                        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-8">
                            <input type="hidden" name="title" value="Portfolio Contact" />
                            <input type="hidden" name="time" value={new Date().toLocaleString()} />

                            {/* Name + Email row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="name" className="font-mono text-[10px] tracking-widest uppercase text-gray-cool">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="Your name"
                                        className={inputBase}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="email" className="font-mono text-[10px] tracking-widest uppercase text-gray-cool">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        placeholder="your@email.com"
                                        className={inputBase}
                                    />
                                </div>
                            </div>

                            {/* Message */}
                            <div className="flex flex-col gap-2">
                                <label htmlFor="message" className="font-mono text-[10px] tracking-widest uppercase text-gray-cool">
                                    Message
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    rows={5}
                                    placeholder="Tell me about your project..."
                                    className={inputBase}
                                />
                            </div>

                            {/* Submit row */}
                            <div className="flex flex-wrap items-center gap-4 pt-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`group relative inline-flex items-center gap-3 px-8 py-3.5 rounded-full font-bold text-sm tracking-wide overflow-hidden transition-all duration-300 ${
                                        isSubmitting
                                            ? "bg-gray-cool/20 text-gray-cool cursor-not-allowed"
                                            : "bg-ivory text-charcoal hover:scale-[1.03] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-ivory/15"
                                    }`}
                                >
                                    {/* shine sweep */}
                                    {!isSubmitting && (
                                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                    )}
                                    <span className="relative flex items-center gap-2.5">
                                        {isSubmitting ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Sending…
                                            </>
                                        ) : (
                                            <>
                                                Send Message
                                                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                </svg>
                                            </>
                                        )}
                                    </span>
                                </button>

                                {submitStatus === "success" && (
                                    <motion.span
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="inline-flex items-center gap-2 text-green-400 text-sm font-medium"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Message sent!
                                    </motion.span>
                                )}
                                {submitStatus === "error" && (
                                    <motion.span
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="inline-flex items-center gap-2 text-red-400 text-sm font-medium"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Failed. Try again.
                                    </motion.span>
                                )}
                            </div>
                        </form>
                    </motion.div>
                </div>

                {/* ── Bottom bar ── */}
                <div className="border-t border-ivory/8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="font-mono text-[10px] tracking-widest uppercase text-gray-cool/50">
                        © {new Date().getFullYear()} Muhammed Rinshad. All rights reserved.
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                        </span>
                        <span className="font-mono text-[10px] tracking-widest uppercase text-green-400/80">
                            Available for work
                        </span>
                    </div>
                </div>

            </div>
        </footer>
    );
}
