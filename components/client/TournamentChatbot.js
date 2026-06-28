"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { readUser } from "./localStore";

const starterPrompts = [
  "When is my next match?",
  "What is the points table?",
  "How do I pay?",
  "Show open tournaments"
];

const welcomeMessage = {
  id: "welcome",
  role: "bot",
  text: "Hi, I am the Sports Arena assistant. Ask me about your next match, points table, payment, registration, fixtures, rules, or live scores.",
  links: [
    { label: "Live Scores", href: "/live" },
    { label: "My Tournament", href: "/my-tournament" }
  ],
  suggestions: starterPrompts
};

function MessageBubble({ message, onPrompt }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[92%] rounded-lg px-4 py-3 text-sm leading-6 shadow-sm ${isUser ? "bg-pitch text-white" : "bg-white text-pitch"}`}>
        <p className="whitespace-pre-line font-semibold">{message.text}</p>
        {message.links?.length ? (
          <div className="mt-3 grid gap-2">
            {message.links.map((link) => (
              <Link key={`${message.id}-${link.href}-${link.label}`} href={link.href} className={`tap-target flex items-center justify-center rounded-md px-3 py-2 text-xs font-black ${isUser ? "bg-white/12 text-white" : "bg-floodlight text-pitch"}`}>
                {link.label}
              </Link>
            ))}
          </div>
        ) : null}
        {message.suggestions?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.suggestions.slice(0, 4).map((suggestion) => (
              <button
                key={`${message.id}-${suggestion}`}
                onClick={() => onPrompt(suggestion)}
                className={`rounded-md border px-2.5 py-1.5 text-left text-xs font-black ${isUser ? "border-white/20 text-white" : "border-graphite/12 text-turf"}`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function TournamentChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([welcomeMessage]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  async function askBot(text) {
    const value = String(text || "").trim();
    if (!value || busy) {
      return;
    }

    const userMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: value
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setBusy(true);

    try {
      const savedUser = readUser();
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: value,
          profile: savedUser ? { name: savedUser.name, email: savedUser.email } : {}
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not answer.");
      }

      setMessages((current) => [
        ...current,
        {
          id: `b-${Date.now()}`,
          role: "bot",
          text: data.reply,
          links: data.links || [],
          suggestions: data.suggestions || starterPrompts
        }
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `b-${Date.now()}`,
          role: "bot",
          text: "I could not reach the assistant right now. Try Live Scores, My Tournament, or Payment from the links below.",
          links: [
            { label: "Live Scores", href: "/live" },
            { label: "Payment", href: "/payment" },
            { label: "My Tournament", href: "/my-tournament" }
          ],
          suggestions: starterPrompts
        }
      ]);
    } finally {
      setBusy(false);
    }
  }

  function submit(event) {
    event.preventDefault();
    askBot(input);
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-[80] sm:inset-x-auto sm:right-5 sm:bottom-5">
      {open ? (
        <section className="motion-card mx-auto flex h-[min(76svh,620px)] max-w-md flex-col overflow-hidden rounded-lg border border-graphite/12 bg-floodlight shadow-lift sm:w-[390px]">
          <div className="flex items-center justify-between gap-3 bg-pitch px-4 py-3 text-white">
            <div>
              <p className="text-sm font-black uppercase text-crease">Tournament Bot</p>
              <h2 className="text-lg font-black">Sports Arena Assistant</h2>
            </div>
            <button onClick={() => setOpen(false)} className="tap-target rounded-md border border-white/15 px-3 py-2 text-sm font-black text-white">
              Close
            </button>
          </div>

          <div ref={scrollRef} className="mobile-scroll flex-1 space-y-3 overflow-y-auto px-3 py-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} onPrompt={askBot} />
            ))}
            {busy ? (
              <div className="flex justify-start">
                <div className="rounded-lg bg-white px-4 py-3 text-sm font-black text-pitch shadow-sm">Thinking...</div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-graphite/10 bg-white p-3">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1 mobile-scroll">
              {starterPrompts.map((prompt) => (
                <button key={prompt} onClick={() => askBot(prompt)} className="shrink-0 rounded-md bg-floodlight px-3 py-2 text-xs font-black text-pitch">
                  {prompt}
                </button>
              ))}
            </div>
            <form onSubmit={submit} className="grid grid-cols-[1fr_auto] gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about match, points, payment..."
                className="min-w-0 rounded-md border border-graphite/15 px-3 py-2 text-sm font-semibold outline-none focus:border-turf"
              />
              <button disabled={busy || !input.trim()} className="tap-target rounded-md bg-pitch px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">
                Send
              </button>
            </form>
          </div>
        </section>
      ) : null}

      <button
        onClick={() => setOpen((value) => !value)}
        className="shine-button tap-target ml-auto flex items-center gap-2 rounded-full bg-pitch px-5 py-3 text-sm font-black text-white shadow-lift ring-2 ring-crease/35"
        aria-expanded={open}
      >
        <span className="grid h-3 w-3 place-items-center rounded-full bg-crease pulse-live" />
        Ask Bot
      </button>
    </div>
  );
}
