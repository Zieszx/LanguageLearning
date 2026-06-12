"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { getLanguage } from "@/lib/languages";
import { getScenario } from "@/lib/scenarios";
import { genId } from "@/lib/storage";
import { extractPartialReply, parseReply } from "@/lib/parseReply";
import { useAccount } from "@/lib/account";
import {
  loadCharacters,
  loadConversation,
  loadSettings,
  loadSharedScenarios,
  loadVocab,
  logPractice,
  storeConversation,
} from "@/lib/data";
import type {
  AssistantReply,
  ChatMessage,
  Conversation,
} from "@/lib/types";
import { MessageBubble } from "@/components/MessageBubble";
import { VoiceInputButton } from "@/components/VoiceInputButton";

function ChatInner() {
  const params = useSearchParams();
  const { signedIn } = useAccount();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Calls the API for the next assistant turn and appends it.
  const requestAssistant = useCallback(
    async (convo: Conversation) => {
      setLoading(true);
      setError(null);
      setStreamingText("");
      try {
        const vocab = await loadVocab(signedIn);
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            languageCode: convo.languageCode,
            level: convo.level,
            scenarioId: convo.scenarioId,
            scenario: convo.scenario ?? null,
            stream: true,
            vocab: vocab
              .filter((v) => v.language === convo.languageCode)
              .map((v) => ({ word: v.word })),
            messages: convo.messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        let reply: AssistantReply;
        const contentType = res.headers.get("Content-Type") ?? "";
        if (res.ok && res.body && contentType.includes("text/plain")) {
          // Streamed raw model text: show the reply as it arrives.
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let raw = "";
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            raw += decoder.decode(value, { stream: true });
            setStreamingText(extractPartialReply(raw));
          }
          reply = parseReply(raw);
        } else {
          // Non-stream response: parse defensively so an HTML error page
          // doesn't surface as a cryptic "Unexpected token '<'".
          const text = await res.text();
          let data: { error?: string } & Partial<AssistantReply> = {};
          try {
            data = JSON.parse(text);
          } catch {
            throw new Error(
              res.ok
                ? "The server returned an unexpected response. Please try again."
                : `Request failed (${res.status}). Please try again.`,
            );
          }
          if (!res.ok) throw new Error(data.error ?? "Request failed");
          reply = data as AssistantReply;
        }

        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: reply.reply,
          translation: reply.reply_translation,
          romanization: reply.reply_romanization,
          corrections: reply.corrections ?? [],
          vocabSuggestions: reply.vocab_suggestions ?? [],
        };
        const updated: Conversation = {
          ...convo,
          messages: [...convo.messages, assistantMsg],
          updatedAt: Date.now(),
        };
        setConversation(updated);
        void storeConversation(signedIn, updated);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
        setStreamingText("");
      }
    },
    [signedIn],
  );

  // Load an existing conversation or create a new one from the URL params.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    void (async () => {
      const existingId = params.get("c");
      if (existingId) {
        const found = await loadConversation(signedIn, existingId);
        if (found) {
          setConversation(found);
          return;
        }
      }

      const settings = await loadSettings(signedIn);
      const scenarioId = params.get("scenario");
      // Resolve a built-in scenario, or a user-created custom character.
      let scenario = getScenario(scenarioId);
      if (!scenario && scenarioId) {
        const [characters, shared] = await Promise.all([
          loadCharacters(signedIn),
          loadSharedScenarios(signedIn),
        ]);
        scenario =
          characters.find((s) => s.id === scenarioId) ??
          shared.find((s) => s.id === scenarioId) ??
          null;
      }
      const convo: Conversation = {
        id: genId(),
        title: scenario ? scenario.title : "Free chat",
        // A custom character can pin its own language; else use the active one.
        languageCode: scenario?.languageCode ?? settings.activeLanguage,
        scenarioId: scenario ? scenario.id : null,
        scenario: scenario
          ? { character: scenario.character, situation: scenario.situation }
          : null,
        level: settings.level,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setConversation(convo);
      void requestAssistant(convo);
    })();
  }, [params, requestAssistant, signedIn]);

  // Keep the view scrolled to the latest message.
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages.length, loading, streamingText]);

  function handleSend() {
    const text = input.trim();
    if (!text || !conversation || loading) return;
    const updated: Conversation = {
      ...conversation,
      messages: [...conversation.messages, { role: "user", content: text }],
      updatedAt: Date.now(),
    };
    setConversation(updated);
    void storeConversation(signedIn, updated);
    void logPractice(signedIn, "message", updated.languageCode);
    setInput("");
    void requestAssistant(updated);
  }

  if (!conversation) {
    return <div className="clay h-40 animate-pulse rounded-3xl" />;
  }

  const lang = getLanguage(conversation.languageCode);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          aria-label="Back to home"
          className="clay clay-press flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-display text-lg text-foreground">
            {conversation.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {lang.flag} {lang.name} · {conversation.level}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {conversation.messages.map((m, i) => (
          <MessageBubble
            key={i}
            message={m}
            language={conversation.languageCode}
            showRomanization
          />
        ))}

        {loading && streamingText && (
          <div className="clay max-w-[92%] rounded-3xl rounded-bl-md px-5 py-3">
            <p className="whitespace-pre-wrap text-foreground">
              {streamingText}
              <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-muted-foreground align-middle" />
            </p>
          </div>
        )}

        {loading && !streamingText && (
          <div className="clay flex w-fit items-center gap-1 rounded-3xl px-5 py-4">
            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-300">
            {error}
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Composer */}
      <div className="sticky bottom-4 z-20">
        <div className="clay flex items-end gap-2 p-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            placeholder={`Type or speak in ${lang.name}…`}
            aria-label="Your message"
            className="max-h-32 flex-1 resize-none bg-transparent px-3 py-2 text-foreground outline-none placeholder:text-muted-foreground"
          />
          <VoiceInputButton
            lang={lang.speechCode}
            onText={(text) =>
              setInput((prev) => (prev ? `${prev} ${text}` : text))
            }
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={loading || !input.trim()}
            aria-label="Send message"
            className="clay-press flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-primary text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={<div className="clay h-40 animate-pulse rounded-3xl" />}
    >
      <ChatInner />
    </Suspense>
  );
}
