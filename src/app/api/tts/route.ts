import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL = process.env.TTS_MODEL ?? "gemini-2.5-flash-preview-tts";
// A natural prebuilt Gemini voice. Speaks whatever language the text is in.
const VOICE = process.env.TTS_VOICE ?? "Kore";

interface TtsBody {
  text: string;
}

function parseRate(mime: string): number {
  const m = mime.match(/rate=(\d+)/);
  return m ? parseInt(m[1], 10) : 24000;
}

/** Wraps raw 16-bit mono PCM in a minimal WAV container the browser can play. */
function pcmToWav(pcm: Buffer, sampleRate: number): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;

  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);

  return Buffer.concat([header, pcm]);
}

export async function POST(request: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    // Not configured — the client falls back to the browser voice.
    return NextResponse.json({ error: "TTS not configured" }, { status: 503 });
  }

  let text = "";
  try {
    ({ text } = (await request.json()) as TtsBody);
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  text = (text ?? "").trim();
  if (!text) return NextResponse.json({ error: "No text" }, { status: 400 });
  // Guard against very long inputs.
  if (text.length > 1200) text = text.slice(0, 1200);

  try {
    const res = await fetch(`${ENDPOINT}/${MODEL}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } },
          },
        },
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json(
        { error: `TTS failed (${res.status}): ${detail.slice(0, 200)}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    const part = data?.candidates?.[0]?.content?.parts?.[0];
    const b64: string | undefined = part?.inlineData?.data;
    const mime: string = part?.inlineData?.mimeType ?? "audio/L16;rate=24000";
    if (!b64) {
      return NextResponse.json({ error: "No audio returned" }, { status: 502 });
    }

    const wav = pcmToWav(Buffer.from(b64, "base64"), parseRate(mime));
    return new Response(new Uint8Array(wav), {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
