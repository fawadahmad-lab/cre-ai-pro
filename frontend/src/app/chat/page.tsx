"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  LandPlot,
  MapPin,
  Send,
  Sparkles,
  Store,
  Briefcase,
  Home,
  Building2,
  CalendarPlus,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { getLead, sendChatMessage } from "@/lib/api";
import type { ChatResponse, Lead, Property } from "@/lib/types";
import { formatPKR, titleCase } from "@/lib/format";
import { Badge, PROPERTY_STATUS_TONES } from "@/components/badges";
import { BookingDialog } from "@/components/booking-dialog";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  properties?: Property[];
}

const SUGGESTIONS = [
  "I'm looking for an office in Lahore",
  "Show me shops for rent in Karachi",
  "Commercial plots in Islamabad under 15 crore",
];

const TYPE_ICONS: Record<string, LucideIcon> = {
  office: Briefcase,
  shop: Store,
  house: Home,
  apartment: Building2,
  plot: LandPlot,
};

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("cre_chat_conversation_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("cre_chat_conversation_id", id);
  }
  return id;
}

export default function ChatPage() {
  return (
    <React.Suspense>
      <ChatInner />
    </React.Suspense>
  );
}

function ChatInner() {
  const searchParams = useSearchParams();
  const paramConv = searchParams.get("c");

  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [lead, setLead] = React.useState<Lead | null>(null);
  const [bookTarget, setBookTarget] = React.useState<Property | null>(null);
  const [conversationId, setConversationId] = React.useState("");

  const bottomRef = React.useRef<HTMLDivElement>(null);

  // Initialise conversation (deep-link ?c= wins over stored session)
  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      const id = paramConv || getSessionId();
      if (paramConv) localStorage.setItem("cre_chat_conversation_id", paramConv);

      try {
        const res = await fetch(
          `http://localhost:8001/api/v1/conversations/${id}`
        );
        if (!cancelled && res.ok) {
          const data = await res.json();
          setConversationId(id);
          setMessages(
            (data.messages || []).map((m: { role: string; content: string }) => ({
              role: m.role === "user" ? "user" : "assistant",
              content: m.content,
            }))
          );
          return;
        }
      } catch {
        /* offline backend -> start fresh */
      }
      if (!cancelled) {
        setConversationId(id);
        setMessages([
          {
            role: "assistant",
            content:
              "**Assalam-o-Alaikum! I'm Ayesha** 🏢\n\nYour AI sales assistant for commercial real estate. Tell me what you're looking for — city, property type and budget — and I'll find matching options from our live inventory.",
          },
        ]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [paramConv]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;

    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content }]);
    setSending(true);

    try {
      const data: ChatResponse = await sendChatMessage(content, conversationId || undefined);
      setConversationId(data.conversation_id);
      localStorage.setItem("cre_chat_conversation_id", data.conversation_id);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply, properties: data.properties },
      ]);
      if (data.lead_id) {
        getLead(data.lead_id)
          .then(setLead)
          .catch(() => undefined);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection failed — is the backend running?");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-6">
      {/* ------------------------------------------------ chat pane */}
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 shadow-card">
        {/* Header */}
        <header className="flex items-center justify-between border-b px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-teal-700 shadow-sm">
                <Sparkles className="size-4 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-card bg-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">Ayesha</p>
              <p className="text-[11px] text-muted-foreground">
                AI Sales Agent · online 24/7
              </p>
            </div>
          </div>
          <Badge tone="accent" className="gap-1">
            <ShieldCheck className="size-3" />
            Verified inventory only
          </Badge>
        </header>

        {/* Messages */}
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-6">
          {messages.map((msg, i) =>
            msg.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[78%] rounded-2xl rounded-br-md bg-gradient-to-br from-primary to-teal-700 px-4 py-2.5 text-sm text-white shadow-sm">
                  {msg.content}
                </div>
              </div>
            ) : (
              <div key={i} className="flex items-start gap-2.5">
                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-teal-700/80">
                  <Sparkles className="size-3.5 text-white" />
                </div>
                <div className="max-w-[82%] space-y-3">
                  <div className="prose prose-sm prose-neutral max-w-none rounded-2xl rounded-tl-md bg-muted px-4 py-3 text-sm leading-relaxed [&_p]:my-0 [&_strong]:font-semibold">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>

                  {/* Inline real-inventory mini cards */}
                  {msg.properties && msg.properties.length > 0 && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {msg.properties.slice(0, 4).map((p) => (
                        <MiniPropertyCard
                          key={p.id}
                          property={p}
                          onBook={() => setBookTarget(p)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          )}

          {sending && (
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-teal-700/80">
                <Sparkles className="size-3.5 text-white" />
              </div>
              <div className="rounded-2xl rounded-tl-md bg-muted px-4 py-3">
                <TypingDots />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && !sending && (
          <div className="flex flex-wrap gap-2 px-5 pb-3">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-all hover:border-primary/40 hover:bg-accent hover:text-accent-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {error && (
          <p className="mx-5 mb-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive ring-1 ring-destructive/20">
            {error}
          </p>
        )}

        {/* Composer */}
        <footer className="border-t p-4">
          <div className="flex items-end gap-2 rounded-xl border border-input bg-background p-2 shadow-sm transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/25">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Ask about any property — city, budget, type..."
              className="max-h-32 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground/60"
            />
            <button
              onClick={() => send()}
              disabled={sending || !input.trim()}
              aria-label="Send message"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white shadow-sm transition-all hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-40"
            >
              <Send className="size-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground/70">
            Ayesha only recommends properties from our verified database.
          </p>
        </footer>
      </section>

      {/* --------------------------------------- context pane (xl+) */}
      <aside className="hidden w-72 shrink-0 flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 shadow-card xl:flex">
        <header className="border-b px-4 py-3.5">
          <h2 className="text-sm font-semibold">This Conversation</h2>
          <p className="text-[11px] text-muted-foreground">Live session context</p>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {/* Captured lead */}
          <div>
            <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Captured Lead
            </h3>
            {lead ? (
              <div className="rounded-xl bg-muted/60 p-3 ring-1 ring-foreground/5">
                <p className="text-[13px] font-semibold">{lead.name || "Visitor"}</p>
                <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                  {lead.email && <li className="truncate">{lead.email}</li>}
                  {lead.phone && <li>{lead.phone}</li>}
                  {(lead.city || lead.property_type) && (
                    <li>
                      {[titleCase(lead.property_type), lead.city].filter(Boolean).join(" · ")}
                    </li>
                  )}
                  {lead.budget ? <li>Budget {formatPKR(lead.budget)}</li> : null}
                </ul>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Lead score</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold tabular text-primary">
                    {lead.score}/100
                  </span>
                </div>
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">
                When the visitor shares their name or contact details they appear here.
              </p>
            )}
          </div>

          {/* Matched inventory */}
          <div>
            <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Matched From Inventory
            </h3>
            {(() => {
              const lastWithProps = [...messages]
                .reverse()
                .find((m) => m.properties && m.properties.length > 0);
              if (!lastWithProps?.properties?.length) {
                return (
                  <p className="rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">
                    Matching properties will appear here as Ayesha finds them.
                  </p>
                );
              }
              return (
                <div className="space-y-2">
                  {lastWithProps.properties.map((p) => (
                    <MiniPropertyCard key={p.id} property={p} onBook={() => setBookTarget(p)} />
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </aside>

      <BookingDialog
        open={!!bookTarget}
        onClose={() => setBookTarget(null)}
        property={bookTarget}
        lead={lead}
        conversationId={conversationId}
      />
    </div>
  );
}

/* ---------------------------------------------------------- mini card */

function MiniPropertyCard({
  property,
  onBook,
}: {
  property: Property;
  onBook: () => void;
}) {
  const Icon = TYPE_ICONS[property.property_type] ?? LandPlot;
  return (
    <div className="group flex items-center gap-3 rounded-xl border border-border bg-background p-2.5 transition-all hover:border-primary/30 hover:shadow-sm">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/15 to-teal-600/15 text-primary">
        <Icon className="size-4.5" strokeWidth={1.6} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-semibold">{property.title}</p>
        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="size-2.5" />
          {property.area}, {property.city}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="text-[11px] font-semibold tabular text-primary">
            {formatPKR(property.price, property.price_type)}
          </span>
          <Badge tone={PROPERTY_STATUS_TONES[property.status] ?? "neutral"} className="scale-90">
            {property.listing_type === "rent" ? "Rent" : "Sale"}
          </Badge>
        </div>
      </div>
      <button
        onClick={onBook}
        title="Schedule viewing"
        className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-all hover:border-primary hover:bg-primary hover:text-white"
      >
        <CalendarPlus className="size-4" />
      </button>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="size-1.5 animate-bounce rounded-full bg-muted-foreground/50"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
}
