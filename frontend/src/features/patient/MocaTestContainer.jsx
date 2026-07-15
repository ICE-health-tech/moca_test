import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Volume2, VolumeX, Undo2, Eraser, ChevronRight, ChevronLeft,
  Mic, Square, Play, Lock, CheckCircle2, AlertCircle, Clock, Lightbulb,
} from "lucide-react";
import { ATTENTION, QUESTION_BANK, pickRandomSetId } from "../../data/mocaQuestionBank";
import { useAuthStore } from "../../stores/authStore";
import { useSubmitSession } from "./usePatientQueries";
import "./mocaExam.css";
import {
  hasRecording,
  recordingBlobUrl,
  scoreSentenceRepetition,
  startParallelAsr,
} from "../../shared/lib/sentenceAsr";

/* =============================================================================
   MoCA PLATFORM — 9-Section Test Workflow (patient exam experience)
   -----------------------------------------------------------------------------
   This file is intentionally self-contained so the end-to-end exam can be run
   and tested in isolation (auth + dashboards bypassed, per the brief).

   For the production project, extract the marked blocks into:
     • src/data/questionBank.js      → `QUESTION_BANK`
     • src/components/moca/*.jsx      → each Section* component
     • src/hooks/useSpeech.js         → `useSpeech`
   The container API and the `raw_answers` schema match CLAUDE.md §8.
   ========================================================================== */

/* Set low (e.g. 10) while testing the delay-lock; 300 is the clinical value. */
const DELAY_LOCK_SECONDS = 300;

/* =============================================================================
   UTILITIES
   ========================================================================== */
// Forgiving comparison: lowercase, trim, collapse spaces, strip diacritics + đ.
function normalize(s = "") {
  return s
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, " ")
    .trim();
}

function fmtMMSS(totalSeconds) {
  const m = Math.floor(Math.max(0, totalSeconds) / 60);
  const s = Math.max(0, totalSeconds) % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* =============================================================================
   useSpeech — defensive Web Speech (TTS) wrapper (CLAUDE.md §2)
   -----------------------------------------------------------------------------
   Selects a NATIVE Vietnamese system voice so cues are read with a natural
   Vietnamese accent instead of being spelled out by a foreign default voice.
   Voices load asynchronously in Chrome, so we (re)resolve the voice both on
   mount and on the `voiceschanged` event.
   ========================================================================== */
function pickVietnameseVoice(voices) {
  if (!voices || !voices.length) return null;
  const viList = voices.filter((v) => {
    const l = (v.lang || "").toLowerCase().replace("_", "-");
    return l === "vi-vn" || l.startsWith("vi");
  });
  if (!viList.length) return null;
  // Prefer an exact vi-VN match, then a local (offline) voice, then anything vi.
  return (
    viList.find((v) => (v.lang || "").toLowerCase().replace("_", "-") === "vi-vn") ||
    viList.find((v) => v.localService) ||
    viList[0]
  );
}

function useSpeech(lang = "vi-VN") {
  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window;
  const [speaking, setSpeaking] = useState(false);
  // Tracks whether a Vietnamese voice is actually installed on this device,
  // so the UI can warn caregivers if the OS has none available.
  const [vietnameseVoiceAvailable, setVietnameseVoiceAvailable] = useState(true);
  const viVoiceRef = useRef(null);

  // (Re)load the system voice list and resolve the best Vietnamese voice.
  const loadVoices = useCallback(() => {
    if (!supported) return;
    let voices = [];
    try {
      voices = window.speechSynthesis.getVoices();
    } catch (_) {
      voices = [];
    }
    if (!voices.length) return; // not ready yet — will fire again via event
    const vi = pickVietnameseVoice(voices);
    viVoiceRef.current = vi;
    setVietnameseVoiceAvailable(Boolean(vi));
  }, [supported]);

  useEffect(() => {
    if (!supported) return;
    loadVoices(); // some browsers have voices ready immediately
    // Chrome populates voices asynchronously and fires this event when ready.
    const synth = window.speechSynthesis;
    synth.addEventListener
      ? synth.addEventListener("voiceschanged", loadVoices)
      : (synth.onvoiceschanged = loadVoices);
    return () => {
      synth.removeEventListener
        ? synth.removeEventListener("voiceschanged", loadVoices)
        : (synth.onvoiceschanged = null);
    };
  }, [supported, loadVoices]);

  const cancel = useCallback(() => {
    if (!supported) return;
    try {
      window.speechSynthesis.cancel();
    } catch (_) {}
    setSpeaking(false);
  }, [supported]);

  // Speak a single string, or an array of {text, delayBeforeMs} for paced reads.
  const speak = useCallback(
    (input, rate = 0.9) => {
      if (!supported) return;
      cancel();
      // Voices may not have loaded on the very first interaction — try once more.
      if (!viVoiceRef.current) loadVoices();

      const items = Array.isArray(input)
        ? input
        : [{ text: String(input), delayBeforeMs: 0 }];

      const runItem = (idx) => {
        if (idx >= items.length) {
          setSpeaking(false);
          return;
        }
        const { text, delayBeforeMs = 0 } = items[idx];
        const fire = () => {
          const u = new SpeechSynthesisUtterance(text);
          // Primary: assign the resolved native Vietnamese voice if present.
          if (viVoiceRef.current) u.voice = viVoiceRef.current;
          // Secondary safety fallback so the engine still targets Vietnamese.
          u.lang = lang;
          u.rate = rate;
          u.onend = () => runItem(idx + 1);
          u.onerror = () => runItem(idx + 1);
          try {
            window.speechSynthesis.speak(u);
          } catch (_) {
            runItem(idx + 1);
          }
        };
        if (delayBeforeMs > 0) setTimeout(fire, delayBeforeMs);
        else fire();
      };

      setSpeaking(true);
      runItem(0);
    },
    [supported, cancel, lang, loadVoices]
  );

  useEffect(() => () => cancel(), [cancel]); // cleanup on unmount
  return { supported, speaking, speak, cancel, vietnameseVoiceAvailable };
}

/* =============================================================================
   SHARED UI — calm Apple-like shell (large type, one clear action)
   ========================================================================== */
function ProgressBar({ value, currentStep, totalSteps = 9 }) {
  return (
    <header className="moca-progress" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps}>
      <p className="moca-progress__label">
        Phần {currentStep} trên {totalSteps}
      </p>
      <div className="moca-progress__track">
        <div className="moca-progress__fill" style={{ width: `${value}%` }} />
      </div>
    </header>
  );
}

function AudioGuide({ text, speech, autoLines }) {
  const lines = autoLines || text;
  return (
    <div className="moca-guide">
      <p className="moca-guide__text">{text}</p>
      <button
        type="button"
        onClick={() => (speech.speaking ? speech.cancel() : speech.speak(lines))}
        className={
          "moca-btn-primary " +
          (speech.speaking ? "!bg-red-400 hover:!bg-red-500" : "!bg-blue-600 hover:!bg-blue-700")
        }
        style={{ minHeight: 34, fontSize: "0.8125rem" }}
        disabled={!speech.supported || !speech.vietnameseVoiceAvailable}
        aria-label="Phát hướng dẫn bằng giọng nói"
      >
        {speech.speaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
        {speech.speaking ? "Dừng nghe" : "Nghe hướng dẫn"}
      </button>
      {(!speech.supported || !speech.vietnameseVoiceAvailable) && (
        <p className="mt-3 text-base text-[var(--moca-muted)]">
          Thiết bị chưa cài giọng đọc tiếng Việt — vui lòng đọc hướng dẫn phía trên.
        </p>
      )}
    </div>
  );
}

function StepShell({ title, badge, instruction, autoLines, speech, children, footer }) {
  useEffect(() => {
    // LOGIC: only auto-read when a real Vietnamese voice exists — otherwise the
    // browser falls back to an English voice, which confuses elderly patients.
    if (instruction && speech.supported && speech.vietnameseVoiceAvailable)
      speech.speak(autoLines || instruction);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  return (
    <div className="moca-shell">
      <article className="moca-card">
        {badge && <p className="moca-badge">{badge}</p>}
        <h1 className="moca-title">{title}</h1>
        {instruction && (
          <AudioGuide text={instruction} autoLines={autoLines} speech={speech} />
        )}
        {children}
      </article>
      {footer}
    </div>
  );
}

function NavFooter({ onBack, onNext, nextLabel = "Tiếp tục", nextDisabled, backDisabled }) {
  return (
    <nav className="moca-nav" aria-label="Điều hướng bài test">
      <button type="button" onClick={onNext} disabled={nextDisabled} className="moca-btn-primary">
        {nextLabel} <ChevronRight size={18} />
      </button>
      <button type="button" onClick={onBack} disabled={backDisabled} className="moca-btn-ghost">
        <ChevronLeft size={16} /> Quay lại
      </button>
    </nav>
  );
}

function TextField(props) {
  return <input {...props} className={"moca-field " + (props.className || "")} />;
}

function TextFieldWithRecording({ value, onChange, placeholder, label, inputMode, type, recordingKey, recordingValue, onRecordingSaved }) {
  return (
    <div className="flex gap-2 items-start">
      <TextField
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="flex-1"
      />
      <RecorderButton
        label={label || `Ghi âm: ${placeholder || ""}`}
        value={recordingValue}
        onSaved={onRecordingSaved}
        compact={true}
        showPlayback={true}
      />
    </div>
  );
}

/* =============================================================================
   DrawingCanvas — stroke-history engine with Undo / Clear (CLAUDE.md §6.1)
   ========================================================================== */
function DrawingCanvas({ width = 560, height = 360, backgroundDraw, onStrokesChange }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const strokesRef = useRef([]); // array of strokes; each stroke = [{x,y}, ...]
  const currentRef = useRef(null);
  const drawingRef = useRef(false);
  const [strokeCount, setStrokeCount] = useState(0);

  const repaint = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    if (backgroundDraw) backgroundDraw(ctx, width, height);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";
    for (const stroke of strokesRef.current) {
      if (stroke.length < 1) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i].x, stroke[i].y);
      ctx.stroke();
    }
  }, [backgroundDraw, width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    ctxRef.current = canvas.getContext("2d");
    repaint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repaint]);

  const commit = () => {
    setStrokeCount(strokesRef.current.length);
    if (onStrokesChange) {
      const canvas = canvasRef.current;
      onStrokesChange({
        count: strokesRef.current.length,
        dataUrl: canvas ? canvas.toDataURL("image/png") : null,
      });
    }
  };

  const pointFromEvent = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return {
      x: ((t.clientX - rect.left) / rect.width) * width,
      y: ((t.clientY - rect.top) / rect.height) * height,
    };
  };

  const start = (e) => {
    e.preventDefault();
    drawingRef.current = true;
    currentRef.current = [pointFromEvent(e)];
  };
  const move = (e) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    currentRef.current.push(pointFromEvent(e));
    // live preview without committing to history yet
    repaint();
    const ctx = ctxRef.current;
    const s = currentRef.current;
    ctx.beginPath();
    ctx.moveTo(s[0].x, s[0].y);
    for (let i = 1; i < s.length; i++) ctx.lineTo(s[i].x, s[i].y);
    ctx.stroke();
  };
  const end = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (currentRef.current && currentRef.current.length > 0) {
      strokesRef.current.push(currentRef.current);
    }
    currentRef.current = null;
    repaint();
    commit();
  };

  const undo = () => {
    strokesRef.current.pop();
    repaint();
    commit();
  };
  const clear = () => {
    strokesRef.current = [];
    repaint();
    commit();
  };

  return (
    <div>
      <div className="rounded-2xl border-2 border-gray-200 overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full touch-none block cursor-crosshair"
          style={{ aspectRatio: `${width} / ${height}` }}
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        <button
          type="button"
          onClick={undo}
          disabled={strokeCount === 0}
          className="moca-tool-btn flex-1 min-h-[56px] inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-gray-300 px-5 py-4 text-xl font-bold hover:bg-gray-50 disabled:border-gray-200 disabled:bg-gray-50"
        >
          <Undo2 size={24} /> Hoàn tác
        </button>
        <button
          type="button"
          onClick={clear}
          disabled={strokeCount === 0}
          className="moca-tool-btn flex-1 min-h-[56px] inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-gray-300 px-5 py-4 text-xl font-bold hover:bg-gray-50 disabled:border-gray-200 disabled:bg-gray-50"
        >
          <Eraser size={24} /> Xóa hết
        </button>
      </div>
    </div>
  );
}

/* Background renderers for the canvas tasks ------------------------------- */
function drawTrailTargets(ctx, w, h) {
  // Positions mirror the vietnamesemoca_1.pdf "Nối theo mẫu" layout.
  const nodes = [
    { label: "E", x: 0.44 * w, y: 0.14 * h, tag: "Kết thúc" },
    { label: "A", x: 0.66 * w, y: 0.18 * h, tag: "" },
    { label: "5", x: 0.13 * w, y: 0.26 * h, tag: "" },
    { label: "1", x: 0.30 * w, y: 0.50 * h, tag: "Bắt đầu" },
    { label: "B", x: 0.52 * w, y: 0.46 * h, tag: "" },
    { label: "2", x: 0.80 * w, y: 0.44 * h, tag: "" },
    { label: "D", x: 0.15 * w, y: 0.70 * h, tag: "" },
    { label: "4", x: 0.46 * w, y: 0.74 * h, tag: "" },
    { label: "3", x: 0.73 * w, y: 0.80 * h, tag: "" },
    { label: "C", x: 0.40 * w, y: 0.92 * h, tag: "" },
  ];
  ctx.font = "bold 20px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const n of nodes) {
    ctx.beginPath();
    ctx.arc(n.x, n.y, 22, 0, Math.PI * 2);
    ctx.fillStyle = "#eff6ff";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#2563eb";
    ctx.stroke();
    ctx.fillStyle = "#1e3a8a";
    ctx.fillText(n.label, n.x, n.y);
    if (n.tag) {
      ctx.font = "12px system-ui, sans-serif";
      ctx.fillStyle = "#6b7280";
      ctx.fillText(n.tag, n.x, n.y + 34);
      ctx.font = "bold 20px system-ui, sans-serif";
    }
  }
}

function CubeReference() {
  // Static reference cube (SVG) shown beside the blank drawing canvas.
  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[220px]" aria-label="Hình khối vuông mẫu">
      <g fill="none" stroke="#111827" strokeWidth="3" strokeLinejoin="round">
        <polygon points="40,70 120,70 120,150 40,150" />
        <polygon points="40,70 80,40 160,40 120,70" />
        <polygon points="120,70 160,40 160,120 120,150" />
        <line x1="40" y1="150" x2="80" y2="120" strokeDasharray="5 5" opacity="0.4" />
        <line x1="80" y1="120" x2="160" y2="120" strokeDasharray="5 5" opacity="0.4" />
        <line x1="80" y1="120" x2="80" y2="40" strokeDasharray="5 5" opacity="0.4" />
      </g>
    </svg>
  );
}

/* =============================================================================
   SECTION 1 — Visuospatial / Executive (3 canvas sub-tasks)
   ========================================================================== */
function Section1Visuospatial({ speech, answers, setAnswer, onNext, onBack }) {
  const sub = [
    {
      key: "section_1a_trail_canvas",
      title: "1A · Nối theo mẫu",
      instr:
        "Hãy dùng bút vẽ nối các vòng tròn theo thứ tự xen kẽ số và chữ: 1 → A → 2 → B → 3 → C → 4 → D → 5 → E.",
      bg: drawTrailTargets,
      ref: null,
    },
    {
      key: "section_1b_cube_canvas",
      title: "1B · Vẽ lại hình khối vuông",
      instr: "Hãy nhìn hình khối vuông mẫu bên cạnh và vẽ lại cho thật giống vào khung trắng.",
      bg: null,
      ref: <CubeReference />,
    },
    {
      key: "section_1c_clock_canvas",
      title: "1C · Vẽ đồng hồ (11 giờ 10 phút)",
      instr:
        "Hãy tự vẽ một chiếc đồng hồ: vẽ vòng tròn mặt đồng hồ, điền đầy đủ các số từ 1 đến 12 đúng vị trí, và vẽ hai kim chỉ đúng 11 giờ 10 phút.",
      bg: null, // completely BLANK canvas — patient draws the whole frame
      ref: null,
    },
  ];
  const [i, setI] = useState(0);
  const current = sub[i];

  const handleNext = () => {
    if (i < sub.length - 1) setI(i + 1);
    else onNext();
  };
  const handleBack = () => {
    if (i > 0) setI(i - 1);
    else onBack();
  };

  return (
    <>
      <StepShell
        badge="Phần 1 / 9 · Thị giác – không gian"
        title={current.title}
        instruction={current.instr}
        speech={speech}
      >
        {current.ref ? (
          <div className="grid sm:grid-cols-2 gap-4 items-start">
            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 flex flex-col items-center">
              <span className="text-sm font-semibold text-gray-500 mb-2">Hình mẫu</span>
              {current.ref}
            </div>
            <DrawingCanvas
              key={current.key}
              width={420}
              height={360}
              onStrokesChange={(s) => setAnswer(current.key, s.dataUrl)}
            />
          </div>
        ) : (
          <DrawingCanvas
            key={current.key} 
            width={560}
            height={360}
            backgroundDraw={current.bg}
            onStrokesChange={(s) => setAnswer(current.key, s.dataUrl)}
          />
        )}
        <p className="mt-4 text-sm text-gray-500">
          Phần vẽ sẽ được bác sĩ chấm điểm khi duyệt kết quả (tối đa 5 điểm).
        </p>
      </StepShell>
      <NavFooter onBack={handleBack} onNext={handleNext} nextLabel={i < sub.length - 1 ? "Câu tiếp" : "Phần tiếp theo"} />
    </>
  );
}

/* Section 2 — Naming animals (PDF line drawings: lion, rhino, camel) */
function Section2Naming({ set, speech, answers, setAnswer, onNext, onBack }) {
  const value = answers.section_2_naming || {};
  const update = (id, text) =>
    setAnswer("section_2_naming", { ...value, [id]: { text, mode: "text" } });

  return (
    <>
      <StepShell
        badge="Phần 2 / 9 · Gọi tên con vật"
        title="Con vật này tên là gì?"
        instruction="Hãy nhìn từng hình và cho biết tên con vật. Bạn có thể gõ tên hoặc ghi âm và nghe lại."
        speech={speech}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
          {set.naming.map((animal, idx) => (
              <div key={animal.id} className="rounded-2xl border border-gray-200 p-5">
                <div className="flex flex-col gap-4">
                  <div className="rounded-2xl bg-white border border-gray-200 p-4 flex flex-col items-center justify-center min-h-[120px]">
                    <img
                      src={animal.image}
                      alt={`Con vật ${idx + 1}`}
                      className="max-h-[80px] w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <label className="block text-base font-bold text-gray-700 mb-2">
                      Tên con vật {idx + 1}
                    </label>
                    <div className="space-y-3">
                      <TextField
                        value={value[animal.id]?.text || ""}
                        onChange={(e) => update(animal.id, e.target.value)}
                        placeholder="Nhập tên con vật…"
                      />
                      <RecorderButton
                        label="Ghi âm tên con vật"
                        value={value[animal.id]?.recording}
                        onSaved={(u) =>
                          setAnswer("section_2_naming", {
                            ...value,
                            [animal.id]: { ...value[animal.id], recording: u },
                          })
                        }
                        compact={true}
                        showPlayback={true}
                      />
                    </div>
                  </div>
                </div>
              </div>
          ))}
        </div>
      </StepShell>
      <NavFooter onBack={onBack} onNext={onNext} />
    </>
  );
}

/* =============================================================================
   SECTION 3 — Memory (read 5 words ×2 trials, record via MediaRecorder)
   ========================================================================== */
function useMockRecorder() {
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const stop = useCallback(() => {
    try {
      if (recorderRef.current && recorderRef.current.state !== "inactive")
        recorderRef.current.stop();
    } catch (_) {}
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    setRecording(false);
  }, []);

  const start = useCallback(async (onComplete) => {
    // LOGIC: stop any instruction being read aloud first, so the speaker's TTS
    // does not bleed into the microphone recording.
    try { window.speechSynthesis?.cancel(); } catch (_) {}
    // Try a real recording; gracefully simulate if mic/API unavailable.
    try {
      if (!navigator.mediaDevices || !window.MediaRecorder) throw new Error("unsupported");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        onComplete({ blobUrl: URL.createObjectURL(blob), simulated: false });
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch (_) {
      // Simulated fallback so the flow is fully testable without a mic.
      setRecording(true);
      recorderRef.current = null;
      setTimeout(() => {
        setRecording(false);
        onComplete({ blobUrl: null, simulated: true });
      }, 1200);
    }
  }, []);

  useEffect(() => () => stop(), [stop]);
  return { recording, start, stop };
}

/** MediaRecorder + Web Speech API (vi-VN) for sentence repetition scoring */
function useSentenceRecorder() {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const asrRef = useRef(null);

  const stop = useCallback(() => {
    try {
      if (recorderRef.current && recorderRef.current.state !== "inactive")
        recorderRef.current.stop();
    } catch (_) {}
  }, []);

  const start = useCallback(async (onComplete) => {
    try { window.speechSynthesis?.cancel(); } catch (_) {}
    try {
      if (!navigator.mediaDevices || !window.MediaRecorder) throw new Error("unsupported");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      asrRef.current = startParallelAsr(stream, "vi-VN");

      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        setProcessing(true);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const blobUrl = URL.createObjectURL(blob);
        let transcript = "";
        let asrSupported = false;
        if (asrRef.current?.supported) {
          asrSupported = true;
          transcript = await asrRef.current.stop();
        }
        if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
        setRecording(false);
        setProcessing(false);
        onComplete({ blobUrl, transcript, asrSupported, simulated: false });
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch (_) {
      setRecording(true);
      setTimeout(() => {
        setRecording(false);
        onComplete({ blobUrl: null, transcript: "", asrSupported: false, simulated: true });
      }, 1200);
    }
  }, []);

  useEffect(() => () => {
    stop();
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
  }, [stop]);

  return { recording, processing, start, stop };
}

function SentenceRecorder({ label, expectedSentence, value, onSaved }) {
  const rec = useSentenceRecorder();
  const [playing, setPlaying] = useState(false);
  const audioUrl = recordingBlobUrl(value);
  const scored = value && typeof value === "object" && value.score != null;

  const handleComplete = (payload) => {
    const score =
      payload.asrSupported && payload.transcript
        ? scoreSentenceRepetition(expectedSentence, payload.transcript)
        : 0;
    onSaved({
      blobUrl: payload.blobUrl,
      transcript: payload.transcript || "",
      asrSupported: payload.asrSupported,
      score,
      simulated: payload.simulated,
    });
  };

  return (
    <div className="moca-panel p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-lg font-semibold text-[var(--moca-text)]">{label}</span>
        {hasRecording(value) && !rec.recording && !rec.processing && (
          <span className="inline-flex items-center gap-2 text-base font-medium text-[#15803d]">
            <CheckCircle2 size={20} /> Đã ghi
          </span>
        )}
      </div>

      {!rec.recording && !rec.processing ? (
        <button type="button" onClick={() => rec.start(handleComplete)} className="moca-btn-primary">
          <Mic size={18} /> Bấm để ghi âm
        </button>
      ) : (
        <button type="button" onClick={rec.stop} className="moca-btn-primary !bg-[#dc2626] hover:!bg-[#b91c1c] animate-pulse">
            <Square size={20} /> {rec.processing ? "Đang nhận giọng…" : "Dừng ghi"}
        </button>
      )}

      {scored && value.transcript && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-[var(--moca-muted)]">Máy nghe được:</p>
          <p className="text-base leading-relaxed text-[var(--moca-text)]">"{value.transcript}"</p>
          <p
            className={
              "text-base font-semibold " + (value.score === 1 ? "text-[#15803d]" : "text-[#b45309]")
            }
          >
            {value.score === 1 ? "✓ Khớp câu mẫu — 1 điểm" : "Chưa khớp đủ — 0 điểm (bác sĩ có thể xem lại)"}
          </p>
        </div>
      )}

      {hasRecording(value) && !value.asrSupported && !rec.processing && (
        <p className="mt-3 text-sm text-[var(--moca-muted)]">
          Trình duyệt không hỗ trợ nhận giọng — bác sĩ chấm từ file ghi âm.
        </p>
      )}

      {audioUrl && (
        <button
          type="button"
          onClick={() => setPlaying(!playing)}
          className="moca-btn-ghost mt-3 !w-auto !min-h-0 px-4 py-2"
        >
          <Play size={18} /> Nghe lại
        </button>
      )}
      {playing && audioUrl && (
        <audio key={audioUrl} src={audioUrl} autoPlay onEnded={() => setPlaying(false)} className="h-0 w-0" />
      )}
    </div>
  );
}

function RecorderButton({ label, value, onSaved, onStart, compact = false, showPlayback = true, variant = "default" }) {
  const rec = useMockRecorder();
  const [playing, setPlaying] = useState(false);

  // LOGIC: sections like Fluency need their countdown to begin the moment the
  // patient starts recording — onStart lets the parent hook into that moment.
  const beginRecording = () => {
    if (onStart) onStart();
    rec.start((r) => onSaved(r.blobUrl || `recorded:${label}`));
  };

  const variantStyles = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "border-2 border-gray-300 bg-blue-500 text-gray-800 hover:bg-gray-50",
  };

  const buttonClass = variantStyles[variant] || variantStyles.default;

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {!rec.recording ? (
          <button
            type="button"
            onClick={beginRecording}
            className="min-h-[42px] min-w-[42px] rounded-2xl bg-red-600 !text-white hover:bg-red-700 p-3"
            title={label}
            aria-label={label}
          >
            <Mic size={20} />
          </button>
        ) : (
          <button
            type="button"
            onClick={rec.stop}
            className="min-h-[42px] min-w-[42px] rounded-2xl bg-red-700 !text-white hover:bg-red-800 animate-pulse p-3"
            title="Dừng ghi"
          >
            <Square size={20} />
          </button>
        )}
        {value && showPlayback && (
          <button
            type="button"
            onClick={() => setPlaying(!playing)}
            className="min-h-[42px] min-w-[42px] rounded-2xl bg-green-600 !text-white hover:bg-green-700 p-3"
            title="Nghe lại"
            aria-label="Nghe lại bản ghi"
          >
            <Play size={20} />
          </button>
        )}
        {value && playing && value.startsWith && value.startsWith("blob:") && (
          <audio
            key={value}
            src={value}
            autoPlay
            onEnded={() => setPlaying(false)}
            className="h-0 w-0"
          />
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-gray-200 p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xl font-bold text-gray-800">{label}</span>
        {value && (
          <span className="inline-flex items-center gap-2 text-lg text-green-700 font-semibold">
            <CheckCircle2 size={22} /> Đã ghi
          </span>
        )}
      </div>
      <div className="mt-4 flex flex-col sm:flex-row items-stretch gap-3">
        {!rec.recording ? (
          <button
            type="button"
            onClick={beginRecording}
            className={`min-h-[60px] flex-1 inline-flex items-center justify-center gap-3 rounded-2xl px-6 py-4 text-xl font-bold ${buttonClass}`}
          >
            <Mic size={20} /> {value ? "Ghi lại" : "Bấm để ghi âm"}
          </button>
        ) : (
          <button
            type="button"
            onClick={rec.stop}
            className="min-h-[60px] flex-1 inline-flex items-center justify-center gap-3 rounded-2xl bg-red-600 px-6 py-4 text-white text-xl font-bold hover:bg-red-700 animate-pulse"
          >
            <Square size={26} /> Dừng ghi
          </button>
        )}
        {value && showPlayback && (
          <>
            <button
              type="button"
              onClick={() => setPlaying(!playing)}
              className="min-h-[60px] flex-1 inline-flex items-center justify-center gap-3 rounded-2xl border-2 border-green-600 bg-green-50 px-6 py-4 text-green-800 text-xl font-bold hover:bg-green-100"
            >
              <Play size={26} /> Nghe lại
            </button>
            {playing && value.startsWith && value.startsWith("blob:") && (
              <audio
                key={value}
                src={value}
                autoPlay
                onEnded={() => setPlaying(false)}
                className="h-0 w-0"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Section3Memory({ set, speech, answers, setAnswer, onNext, onBack, markSection3End }) {
  const words = set.memory_words.map((w) => w.word);
  const [revealed, setRevealed] = useState(-1);
  const timersRef = useRef([]);

  const playWords = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setRevealed(-1);
    speech.cancel();
    speech.speak("Hãy lắng nghe và ghi nhớ năm từ sau.");
    words.forEach((w, idx) => {
      const t = setTimeout(() => {
        setRevealed(idx);
        speech.speak(w); // paced ~1 word / second
      }, 1500 + idx * 1200);
      timersRef.current.push(t);
    });
  };

  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  const v1 = answers.section_3_audio_v1;
  const v2 = answers.section_3_audio_v2;

  return (
    <>
      <StepShell
        badge="Phần 3 / 9 · Trí nhớ"
        title="Lắng nghe và nhắc lại 5 từ"
        instruction="Tôi sẽ đọc 5 từ. Hãy chú ý lắng nghe rồi nhắc lại ngay tất cả các từ. Chúng ta làm 2 lần. Hãy nhớ kỹ — lát nữa sẽ được hỏi lại."
        speech={speech}
      >
        <button
          type="button"
          onClick={playWords}
          className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-white font-bold hover:bg-blue-700"
        >
          <Play size={20} /> Nghe 5 từ
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mt-6">
          {words.map((w, idx) => (
            <div
              key={w}
              className={
                "rounded-2xl py-5 text-center font-bold text-xl border-2 transition-colors " +
                (revealed >= idx
                  ? "bg-blue-50 border-blue-300 text-blue-900"
                  : "bg-gray-50 border-gray-200 text-gray-300")
              }
            >
              {revealed >= idx ? w : "•••"}
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          <RecorderButton label="Lần 1" value={v1} onSaved={(u) => setAnswer("section_3_audio_v1", u)} />
          <RecorderButton label="Lần 2" value={v2} onSaved={(u) => setAnswer("section_3_audio_v2", u)} />
        </div>
        <p className="mt-4 text-lg text-gray-600">
          Phần này không tính điểm — sẽ hỏi lại ở bước sau.
        </p>
      </StepShell>
      <NavFooter
        onBack={onBack}
        onNext={() => {
          markSection3End(); // start the 5-minute delay clock
          onNext();
        }}
      />
    </>
  );
}

/* =============================================================================
   SECTION 4 — Attention (digit spans, letter-A vigilance, serial 7s)
   ========================================================================== */
function LetterAVigilance({ speech, onComplete }) {
  const [phase, setPhase] = useState("idle"); // idle | running | done
  const [shown, setShown] = useState("");
  const [idx, setIdx] = useState(-1);
  const [flashA, setFlashA] = useState(false); // visual feedback for correct press
  const pressedRef = useRef(new Set()); // indices the user pressed on
  const idxRef = useRef(-1);
  const timerRef = useRef(null);

  const start = () => {
    pressedRef.current = new Set();
    setPhase("running");
    let i = 0;
    const tick = () => {
      if (i >= ATTENTION.letterStream.length) {
        setPhase("done");
        evaluate();
        return;
      }
      idxRef.current = i;
      setIdx(i);
      setShown(ATTENTION.letterStream[i]);
      i++;
      timerRef.current = setTimeout(tick, 1000);
    };
    tick();
  };

  const evaluate = () => {
    let omissions = 0;
    let falseAlarms = 0;
    ATTENTION.letterStream.forEach((ch, i) => {
      const isTarget = ch === ATTENTION.targetLetter;
      const pressed = pressedRef.current.has(i);
      if (isTarget && !pressed) omissions++;
      if (!isTarget && pressed) falseAlarms++;
    });
    const errors = omissions + falseAlarms;
    onComplete({ errors, omissions, falseAlarms, score: errors <= 1 ? 1 : 0 });
  };

  const registerPress = useCallback(() => {
    if (idxRef.current >= 0) {
      pressedRef.current.add(idxRef.current);
      // Visual feedback: flash the display green if it's an "A"
      if (ATTENTION.letterStream[idxRef.current] === ATTENTION.targetLetter) {
        setFlashA(true);
        setTimeout(() => setFlashA(false), 200);
      }
    }
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space" && phase === "running") {
        e.preventDefault();
        registerPress();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, registerPress]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div className="rounded-2xl border-2 border-gray-200 p-6">
      <p className="text-xl font-bold text-gray-800 mb-4">
        Nhấn nút bên dưới mỗi khi thấy chữ <b>A</b>
      </p>
      <div className="flex flex-col items-center gap-5">
        <div
          className={`h-36 w-36 rounded-3xl flex items-center justify-center text-7xl font-bold transition-all ${
            flashA
              ? "bg-green-500 text-white scale-110"
              : "bg-gray-900 text-white"
          }`}
        >
          {phase === "running" ? shown : phase === "done" ? "✓" : "—"}
        </div>
        {phase === "idle" && (
          <button
            onClick={start}
            className="w-full min-h-[64px] rounded-2xl bg-blue-600 px-6 py-5 text-white text-2xl font-bold hover:bg-blue-700"
          >
            Bắt đầu
          </button>
        )}
        {phase === "running" && (
          <button
            onMouseDown={registerPress}
            onTouchStart={(e) => {
              e.preventDefault();
              registerPress();
            }}
            className="w-full min-h-[56px] rounded-2xl bg-blue-600 px-4 py-4 text-white font-bold hover:bg-blue-700 select-none active:scale-[0.98]"
          >
            BẤM khi thấy chữ A
          </button>
        )}
        {phase === "done" && (
          <span className="inline-flex items-center gap-2 text-xl text-green-700 font-bold">
            <CheckCircle2 size={26} /> Xong
          </span>
        )}
      </div>
    </div>
  );
}

function Section4Attention({ speech, answers, setAnswer, onNext, onBack }) {
  const [sub, setSub] = useState(0);
  const fwd = answers.section_4a_forward || "";
  const bwd = answers.section_4a_backward || "";
  const serial = answers.section_4c || ["", "", "", "", ""];
  const letterA = answers.section_4b;
  const imageTestIndex=[1,2];
  const setSerial = (i, val) => {
    const next = [...serial];
    next[i] = val;
    setAnswer("section_4c", next);
  };

  const handleNext = () => {
    if (sub < 2) setSub(sub + 1);
    else onNext();
  };
  const handleBack = () => {
    if (sub > 0) setSub(sub - 1);
    else onBack();
  };

  const subSteps = [
    {
      title: "4A · Nhắc lại dãy số",
      instruction:
        "Nghe dãy số rồi nhắc lại theo chiều xuôi. Sau đó nghe dãy thứ hai và nhắc lại theo chiều ngược.",
    },
    {
      title: "4B · Phản xạ chữ A",
      instruction: "Nhấn nút bên dưới mỗi khi thấy chữ A trên màn hình.",
    },
    {
      title: "4C · Trừ 7 liên tiếp từ 100",
      instruction:
        "Bắt đầu từ 100, lấy 100 trừ 7, rồi tiếp tục trừ 7 cho mỗi ô.",
    },
  ];
  const current = subSteps[sub];

  return (
    <>
      <StepShell
        badge={`Phần 4 / 9 · Sự chú ý (${sub + 1}/3)`}
        title={current.title}
        instruction={current.instruction}
        speech={speech}
      >
        {sub === 0 && (
          <div className="rounded-2xl border border-gray-200 p-5">
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-500">Nhắc lại theo chiều xuôi</span>
                  <button
                    type="button"
                    onClick={() => speech.speak(ATTENTION.digitsForward.join(" ... "))}
                    className="inline-flex items-center gap-1 text-blue-600 font-medium text-xs"
                  >
                    <Volume2 size={14} /> Nghe dãy số
                  </button>
                </div>
                <div className="rounded-2xl bg-gray-50 border border-gray-200 px-4 py-3 mb-3 text-center font-mono text-xl font-bold text-gray-900 spacing-loose">
                  {ATTENTION.digitsForward.join("  —  ")}
                </div>
                <TextFieldWithRecording
                  value={fwd}
                  inputMode="numeric"
                  onChange={(e) => setAnswer("section_4a_forward", e.target.value)}
                  placeholder="Nhập dãy số vừa nghe…"
                  label="Ghi âm dãy số xuôi"
                  recordingValue={answers.section_4a_forward_recording}
                  onRecordingSaved={(u) => setAnswer("section_4a_forward_recording", u)}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500">Nhắc lại theo chiều ngược</span>
                  <button
                    type="button"
                    onClick={() => speech.speak(ATTENTION.digitsBackwardRead.join(" ... "))}
                    className="inline-flex items-center gap-1 text-blue-600 font-medium text-xs"
                  >
                    <Volume2 size={14} /> Nghe dãy số
                  </button>
                </div>
                <div className="rounded-2xl bg-gray-50 border border-gray-200 px-4 py-3 mb-3 text-center font-mono text-xl font-bold text-gray-900">
                  {ATTENTION.digitsBackwardRead.join("  —  ")}
                </div>
                <TextFieldWithRecording
                  value={bwd}
                  inputMode="numeric"
                  onChange={(e) => setAnswer("section_4a_backward", e.target.value)}
                  placeholder="Nhập theo thứ tự ngược lại…"
                  label="Ghi âm dãy số ngược"
                  recordingValue={answers.section_4a_backward_recording}
                  onRecordingSaved={(u) => setAnswer("section_4a_backward_recording", u)}
                />
              </div>
            </div>
          </div>
        )}

        {sub === 1 && (
          <div>
            <LetterAVigilance speech={speech} onComplete={(r) => setAnswer("section_4b", r)} />
            {letterA && (
              <p className="mt-2 text-sm text-gray-500">
                Số lỗi ghi nhận: {letterA.errors} (bỏ sót {letterA.omissions}, nhấn nhầm{" "}
                {letterA.falseAlarms}).
              </p>
            )}
          </div>
        )}

        {sub === 2 && (
          <div className="rounded-2xl border border-gray-200 p-5">
            <div className="grid grid-cols-5 gap-2">
              {serial.map((val, i) => (
                <input
                  key={i}
                  value={val}
                  inputMode="numeric"
                  onChange={(e) => setSerial(i, e.target.value)}
                  className="rounded-xl border-2 border-gray-200 py-3 text-center text-xl font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none"
                  placeholder={i === 0 ? "−7" : ""}
                />
              ))}
            </div>
          </div>
        )}
      </StepShell>
      <NavFooter
        onBack={handleBack}
        onNext={handleNext}
        nextLabel={sub < 2 ? "Câu tiếp" : "Phần tiếp theo"}
      />
    </>
  );
}

/* =============================================================================
   SECTION 5 — Sentence Repetition (set-driven, voice)
   ========================================================================== */
function Section5Sentences({ set, speech, answers, setAnswer, onNext, onBack }) {
  const value = answers.section_5 || {};
  const autoScore = set.sentences.reduce((sum, _, idx) => {
    const entry = value[idx];
    return sum + (entry && typeof entry === "object" ? entry.score || 0 : 0);
  }, 0);

  return (
    <>
      <StepShell
        badge="Phần 5 / 9 · Ngôn ngữ"
        title="Nhắc lại câu nói"
        instruction="Tôi sẽ đọc một câu. Hãy nghe rồi nhắc lại thật chính xác từng từ. Sau đó làm tương tự với câu thứ hai."
        speech={speech}
      >
        <div className="space-y-5">
          {set.sentences.map((sentence, idx) => (
            <div key={idx} className="moca-panel p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <p className="text-lg font-medium text-[var(--moca-text)] flex-1 leading-relaxed">
                  "{sentence}"
                </p>
                <button
                  type="button"
                  onClick={() => speech.speak(sentence)}
                  className="shrink-0 rounded-full border border-[var(--moca-separator)] p-3 text-[var(--moca-muted)] hover:bg-[var(--moca-fill)]"
                  aria-label="Nghe câu"
                >
                  <Volume2 size={22} />
                </button>
              </div>
              <SentenceRecorder
                label={`Ghi âm câu ${idx + 1}`}
                expectedSentence={sentence}
                value={value[idx]}
                onSaved={(entry) => setAnswer("section_5", { ...value, [idx]: entry })}
              />
            </div>
          ))}
        </div>
        <p className="mt-5 text-base text-[var(--moca-muted)]">
          Điểm tự động từ giọng nói: <b className="text-[var(--moca-text)]">{autoScore}/2</b>
          {autoScore < 2 && " · Bác sĩ có thể điều chỉnh khi duyệt."}
        </p>
      </StepShell>
      <NavFooter onBack={onBack} onNext={onNext} />
    </>
  );
}

/* =============================================================================
   SECTION 6 — Verbal Fluency (60s timer, word counting)
   ========================================================================== */
function Section6Fluency({ set, speech, answers, setAnswer, onNext, onBack }) {
  const { letter, threshold } = set.fluency;
  const [seconds, setSeconds] = useState(60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const text = answers.section_6_text || "";
  const intervalRef = useRef(null);

  const countWords = (str) =>
    str
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0 && normalize(w).startsWith(normalize(letter))).length;

  const validWords = countWords(text);

  const runningRef = useRef(false);

  const start = () => {
    // LOGIC: guard so pressing the record button after "Bắt đầu" (or twice)
    // never spawns a second interval racing the first one.
    if (runningRef.current) return;
    runningRef.current = true;
    setRunning(true);
    setFinished(false);
    setSeconds(60);
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          runningRef.current = false;
          setRunning(false);
          setFinished(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    setAnswer("section_6", { letter, count: validWords, score: validWords >= threshold ? 1 : 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validWords]);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  return (
    <>
      <StepShell
        badge="Phần 6 / 9 · Sự lưu loát"
        title={`Kể các từ bắt đầu bằng chữ "${letter}"`}
        instruction={`Trong vòng 60 giây, hãy gõ càng nhiều từ bắt đầu bằng chữ "${letter}" càng tốt. Mỗi từ cách nhau bằng dấu cách. Bạn cũng có thể ghi âm giọng nói của mình.`}
        speech={speech}
      >
        <div className="flex items-center justify-between rounded-2xl bg-gray-50 border border-gray-200 px-5 py-4 mb-4">
          <div className="flex items-center gap-2 text-gray-700">
            <Clock size={22} />
            <span className="text-3xl font-bold tabular-nums">{fmtMMSS(seconds)}</span>
          </div>
          {!running && !finished && (
            <button onClick={start} className="rounded-xl bg-blue-600 px-4 py-2 text-white font-bold hover:bg-blue-700" style={{ fontSize: "0.875rem" }}>
              Bắt đầu
            </button>
          )}
          {(running || finished) && (
            <span className="text-lg font-bold text-blue-700">{validWords} từ hợp lệ</span>
          )}
        </div>
        <textarea
          value={text}
          disabled={!running}
          onChange={(e) => setAnswer("section_6_text", e.target.value)}
          rows={4}
          placeholder={running ? `Ví dụ: ${letter}an, ${letter}úa, ...` : "Nhấn Bắt đầu để mở khung nhập"}
          className="w-full rounded-2xl border-2 border-gray-200 px-4 py-4 text-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none disabled:bg-gray-50"
        />
        {finished && (
          <p className={"mt-3 font-semibold " + (validWords >= threshold ? "text-green-700" : "text-gray-600")}>
            {validWords >= threshold
              ? `Đạt yêu cầu (≥ ${threshold} từ) → 1 điểm.`
              : `Chưa đạt ${threshold} từ → 0 điểm.`}
          </p>
        )}
        <div className="mt-5">
          <p className="text-sm font-semibold text-gray-600 mb-3">
            Hoặc bấm ghi âm — đồng hồ 60 giây sẽ tự chạy:
          </p>
          <RecorderButton
            label="Ghi âm lưu loát"
            value={answers.section_6_recording}
            onSaved={(u) => setAnswer("section_6_recording", u)}
            onStart={start}
            showPlayback={true}
            variant="secondary"
          />
        </div>
      </StepShell>
      <NavFooter onBack={onBack} onNext={onNext} nextDisabled={running} />
    </>
  );
}

/* =============================================================================
   SECTION 7 — Abstraction (category pairing)
   ========================================================================== */
function Section7Abstraction({ set, speech, answers, setAnswer, onNext, onBack }) {
  const value = answers.section_7 || {};
  const { example, pairs } = set.abstraction;
  return (
    <>
      <StepShell
        badge="Phần 7 / 9 · Tư duy trừu tượng"
        title="Hai vật này giống nhau ở điểm nào?"
        instruction="Hãy cho biết hai vật trong mỗi cặp cùng thuộc nhóm nào. Ví dụ mẫu: quả chuối và quả cam đều là hoa quả."
        speech={speech}
      >
        {/* Worked example from the file — shown for guidance, not scored */}
        <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 mb-5">
          <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Ví dụ mẫu</span>
          <p className="text-gray-800 mt-1">
            <b>{example.pair}</b> → {example.answer}
          </p>
        </div>

        <div className="space-y-5">
          {pairs.map((item, idx) => (
            <div key={idx} className="rounded-2xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <p className="text-xl font-bold text-gray-900">{item.pair}</p>
                <button
                  type="button"
                  onClick={() =>
                    speech.speaking
                      ? speech.cancel()
                      : speech.speak(`${item.pair} giống nhau ở điểm nào?`)
                  }
                  className="shrink-0 rounded-xl border-2 border-gray-200 p-3 text-gray-600 hover:bg-gray-50"
                  aria-label={speech.speaking ? "Dừng nghe" : "Nghe câu hỏi"}
                >
                  {speech.speaking ? <VolumeX size={22} /> : <Volume2 size={22} />}
                </button>
              </div>
              <TextFieldWithRecording
                value={value[idx]?.text || ""}
                onChange={(e) =>
                  setAnswer("section_7", { ...value, [idx]: { pair: item.pair, text: e.target.value, recording: value[idx]?.recording } })
                }
                placeholder="Cùng thuộc nhóm…"
                label={`Ghi âm cặp: ${item.pair}`}
                recordingValue={value[idx]?.recording}
                onRecordingSaved={(u) =>
                  setAnswer("section_7", { ...value, [idx]: { ...value[idx], recording: u } })
                }
              />
            </div>
          ))}
        </div>
      </StepShell>
      <NavFooter onBack={onBack} onNext={onNext} />
    </>
  );
}

/* =============================================================================
   SECTION 8 — Delayed Recall (5-minute lock + category cues)
   ========================================================================== */
function Section8Recall({ set, speech, answers, setAnswer, onNext, onBack, section3EndTime }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const elapsed = section3EndTime ? Math.floor((now - section3EndTime) / 1000) : DELAY_LOCK_SECONDS;
  const remaining = DELAY_LOCK_SECONDS - elapsed;
  const locked = section3EndTime != null && remaining > 0;

  const inputs = answers.section_8_inputs || {};
  const words = set.memory_words;

  const setWord = (i, patch) => {
    const key = `word_${i + 1}`;
    setAnswer("section_8_inputs", {
      ...inputs,
      [key]: { text: "", used_cue: false, ...inputs[key], ...patch },
    });
  };

  if (locked) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="mx-auto mb-5 h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center">
            <Lock size={30} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Vui lòng chờ trong giây lát</h1>
          <p className="text-gray-600 mb-6">
            Cần chờ đủ 5 phút sau phần ghi nhớ trước khi làm phần nhớ lại. Màn hình sẽ tự mở khóa.
          </p>
          <div className="text-6xl font-bold tabular-nums text-blue-700">{fmtMMSS(remaining)}</div>
          <div className="mt-6 h-3 w-full rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-[width] duration-1000"
              style={{ width: `${(elapsed / DELAY_LOCK_SECONDS) * 100}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <StepShell
        badge="Phần 8 / 9 · Nhớ lại có trì hoãn"
        title="Hãy nhớ lại 5 từ lúc nãy"
        instruction="Hãy nhớ lại 5 từ mà tôi đã đọc ở phần đầu bài kiểm tra. Nếu không nhớ được, bạn có thể bấm nút gợi ý."
        speech={speech}
      >
        <div className="space-y-3">
          {words.map((w, i) => {
            const key = `word_${i + 1}`;
            const cur = inputs[key] || { text: "", used_cue: false };
            return (
              <div key={key} className="rounded-2xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-gray-500">Từ {i + 1}</span>
                  {cur.used_cue && (
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                      Đã dùng gợi ý (0 điểm)
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <TextField
                    value={cur.text}
                    onChange={(e) => setWord(i, { text: e.target.value, used_cue: cur.used_cue, recording: cur.recording })}
                    placeholder="Nhập từ bạn nhớ…"
                  />
                  <RecorderButton
                    label={`Ghi âm từ ${i + 1}`}
                    value={cur.recording}
                    onSaved={(u) => setWord(i, { ...cur, recording: u })}
                    compact={true}
                    showPlayback={true}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setWord(i, { text: cur.text, used_cue: true, recording: cur.recording });
                      speech.speak(w.cue);
                    }}
                    className="shrink-0 inline-flex items-center gap-1 rounded-xl border-2 border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 font-semibold hover:bg-amber-100"
                  >
                    <Lightbulb size={18} /> Gợi ý
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Nhớ tự do: 1 điểm/từ. Nhớ có gợi ý: 0 điểm (lưu lại cho bác sĩ phân tích).
        </p>
      </StepShell>
      <NavFooter onBack={onBack} onNext={onNext} />
    </>
  );
}

/* =============================================================================
   SECTION 9 — Orientation
   ========================================================================== */
function Section9Orientation({ speech, answers, setAnswer, onNext, onBack }) {
  const v = answers.section_9 || {};
  const set = (k, val) => setAnswer("section_9", { ...v, [k]: val });
  const days = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];

  const fields = [
    { k: "date", label: "Hôm nay là ngày mấy?", type: "number", placeholder: "Ngày (1–31)" },
    { k: "month", label: "Tháng mấy?", type: "number", placeholder: "Tháng (1–12)" },
    { k: "year", label: "Năm bao nhiêu?", type: "number", placeholder: "Năm" },
    { k: "place", label: "Đây là nơi nào? (bệnh viện / phòng khám)", type: "text", placeholder: "Tên địa điểm" },
    { k: "city", label: "Thành phố / tỉnh nào?", type: "text", placeholder: "Tên thành phố" },
  ];

  return (
    <>
      <StepShell
        badge="Phần 9 / 9 · Định hướng"
        title="Định hướng thời gian và không gian"
        instruction="Hãy cho biết ngày, tháng, năm, thứ trong tuần, nơi đang ở và thành phố hiện tại. Bạn có thể gõ câu trả lời hoặc ghi âm giọng của mình."
        speech={speech}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-2">Hôm nay là thứ mấy?</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {days.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => set("day", d)}
                  className={
                    "rounded-xl py-3 font-semibold border-2 " +
                    (v.day === d
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50")
                  }
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          {fields.map((f) => (
            <div key={f.k}>
              <label className="block text-base font-semibold text-gray-700 mb-2">{f.label}</label>
              <div className="flex gap-2">
                <TextField
                  type={f.type}
                  inputMode={f.type === "number" ? "numeric" : "text"}
                  value={v[f.k] || ""}
                  onChange={(e) => set(f.k, e.target.value)}
                  placeholder={f.placeholder}
                  className="flex-1"
                />
                <RecorderButton
                  label={`Ghi âm: ${f.label.replace("?", "")}`}
                  value={v[`${f.k}_recording`]}
                  onSaved={(u) => set(`${f.k}_recording`, u)}
                  compact={true}
                  showPlayback={true}
                />
              </div>
            </div>
          ))}
        </div>
      </StepShell>
      <NavFooter onBack={onBack} onNext={onNext} nextLabel="Hoàn tất bài kiểm tra" />
    </>
  );
}

/* =============================================================================
   GRADING ENGINE  (CLAUDE.md §7) — provisional auto-score
   Objective items auto-graded; drawing & voice items → clinician review.
   ========================================================================== */
function gradeTest(set, answers, educationYears) {
  const rows = [];
  const push = (label, max, points, status) => rows.push({ label, max, points, status });

  // Section 1 — drawings → clinician review
  push("Phần 1 · Thị giác – không gian", 5, 0, "review");

  // Section 2 — naming (text)
  const naming = answers.section_2_naming || {};
  let s2 = 0;
  set.naming.forEach((a) => {
    const ans = normalize(naming[a.id]?.text || "");
    if (!ans) return;
    if (ans === normalize(a.answer) || a.accept.some((x) => ans.includes(normalize(x)))) s2++;
  });
  push("Phần 2 · Gọi tên con vật", 3, s2, "auto");

  // Section 3 — 0 points
  push("Phần 3 · Trí nhớ (ghi nhận)", 0, 0, "auto");

  // Section 4 — attention
  const fwd = normalize(answers.section_4a_forward || "").replace(/\D/g, "");
  const bwd = normalize(answers.section_4a_backward || "").replace(/\D/g, "");
  const fwdOk = fwd === ATTENTION.digitsForward.join("") ? 1 : 0;
  const bwdOk = bwd === [...ATTENTION.digitsBackwardRead].reverse().join("") ? 1 : 0;
  const s4a = fwdOk + bwdOk;
  const s4b = answers.section_4b?.score ?? 0;
  const serial = answers.section_4c || [];
  let correctSerial = 0;
  ATTENTION.serial7.forEach((expected, i) => {
    if (parseInt(serial[i], 10) === expected) correctSerial++;
  });
  const s4c = correctSerial >= 4 ? 3 : correctSerial >= 2 ? 2 : correctSerial >= 1 ? 1 : 0;
  push("Phần 4 · Sự chú ý", 6, s4a + s4b + s4c, "auto");

  // Section 5 — sentence repetition (ASR auto-score when transcript available)
  const s5data = answers.section_5 || {};
  let s5 = 0;
  set.sentences.forEach((sentence, idx) => {
    const entry = s5data[idx];
    if (entry && typeof entry === "object" && entry.score != null) {
      s5 += entry.score;
    } else if (entry?.transcript) {
      s5 += scoreSentenceRepetition(sentence, entry.transcript);
    }
  });
  const s5HasAsr = set.sentences.some((_, idx) => {
    const e = s5data[idx];
    return e && typeof e === "object" && e.asrSupported && e.transcript;
  });
  push("Phần 5 · Nhắc lại câu", 2, s5, s5HasAsr ? "auto" : "review");

  // Section 6 — fluency
  const s6 = answers.section_6?.score ?? 0;
  push("Phần 6 · Sự lưu loát", 1, s6, "auto");

  // Section 7 — abstraction (keyword match; AI/doctor may recalibrate)
  const abs = answers.section_7 || {};
  let s7 = 0;
  set.abstraction.pairs.forEach((item, idx) => {
    const ans = normalize(abs[idx]?.text || "");
    if (ans && item.accept.some((x) => ans.includes(normalize(x)))) s7++;
  });
  push("Phần 7 · Tư duy trừu tượng", 2, s7, "auto");

  // Section 8 — delayed recall (free recall; order does not matter)
  const recall = answers.section_8_inputs || {};
  const recalled = new Set(
    Object.values(recall)
      .filter((cur) => cur && !cur.used_cue && (cur.text || "").trim())
      .map((cur) => normalize(cur.text)),
  );
  let s8 = 0;
  set.memory_words.forEach((w) => {
    if (recalled.has(normalize(w.word))) s8++;
  });
  push("Phần 8 · Nhớ lại có trì hoãn", 5, s8, "auto");

  // Section 9 — orientation
  const o = answers.section_9 || {};
  const real = new Date();
  let s9 = 0;
  if (parseInt(o.date, 10) === real.getDate()) s9++;
  if (parseInt(o.month, 10) === real.getMonth() + 1) s9++;
  if (parseInt(o.year, 10) === real.getFullYear()) s9++;
  const dayNames = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  if (o.day === dayNames[real.getDay()]) s9++;
  if ((o.place || "").trim()) s9++; // self-reported — clinician verifies
  if ((o.city || "").trim()) s9++;
  push("Phần 9 · Định hướng", 6, s9, "auto");

  const autoTotal = rows.filter((r) => r.status === "auto").reduce((a, r) => a + r.points, 0);
  const reviewMax = rows.filter((r) => r.status === "review").reduce((a, r) => a + r.max, 0);

  // Education correction: +1 if ≤ 12 years, capped at 30 (CLAUDE.md §7).
  const bonus = educationYears <= 12 ? 1 : 0;
  const provisional = Math.min(30, autoTotal + bonus);

  let classification, tone;
  if (provisional >= 26) { classification = "Nhận thức bình thường"; tone = "green"; }
  else if (provisional >= 18) { classification = "Suy giảm nhận thức nhẹ (MCI)"; tone = "amber"; }
  else { classification = "Suy giảm nhận thức nặng / Sa sút trí tuệ"; tone = "red"; }

  return { rows, autoTotal, bonus, provisional, reviewMax, classification, tone };
}

function ResultsSummary({ set, answers, profile, onRestart, submitStatus, onRetrySubmit }) {
  const result = useMemo(
    () => gradeTest(set, answers, profile.education_years),
    [set, answers, profile.education_years]
  );
  const toneMap = {
    green: "bg-[#f0fdf4] text-[#166534]",
    amber: "bg-[#fffbeb] text-[#92400e]",
    red: "bg-[#fef2f2] text-[#991b1b]",
  };

  return (
    <div className="moca-shell py-8 pb-12">
      <div className="moca-card">
        {submitStatus === "success" && (
          <div className="mb-6 rounded-2xl bg-[#fefce8] border border-[#fde047] px-5 py-4 text-center">
            <p className="text-xl font-bold text-[#a16207]">Cảm ơn bạn đã tham gia bài kiểm tra!</p>
            <p className="mt-1 text-base text-[#ca8a04]">
              Bài làm đã được gửi — bác sĩ sẽ duyệt và thông báo kết quả chính thức.
            </p>
          </div>
        )}
        <p className="moca-badge">Hoàn thành</p>
        <h1 className="moca-title mb-1">Kết quả tạm tính</h1>
        <p className="mb-8 text-base text-[var(--moca-muted)]">
          {profile.patient_name || "Người bệnh"} · {set.label}
        </p>

        <div className="flex items-end gap-2 mb-4">
          <span className="moca-score">{result.provisional}</span>
          <span className="mb-2 text-2xl font-medium text-[var(--moca-muted)]">/ 30</span>
        </div>
        <div className={"rounded-2xl px-4 py-3.5 text-lg font-semibold mb-4 " + toneMap[result.tone]}>
          {result.classification}
        </div>
        <p className="text-base text-[var(--moca-muted)] mb-6 leading-relaxed">
          Đã chấm tự động {result.autoTotal} điểm{result.bonus ? " (+1 học vấn)" : ""}. Còn {result.reviewMax}{" "}
          điểm (vẽ, ghi âm) chờ bác sĩ duyệt.
        </p>

        <div className="moca-panel divide-y divide-[var(--moca-separator)] overflow-hidden">
          {result.rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-4 px-4 py-3.5">
              <span className="text-base text-[var(--moca-text)]">{r.label}</span>
              <span className="shrink-0">
                {r.status === "review" ? (
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-[#b45309]">
                    <AlertCircle size={16} /> Chờ bác sĩ
                  </span>
                ) : (
                  <span className="text-lg font-semibold tabular-nums">
                    {r.points}
                    <span className="text-[var(--moca-muted)] font-normal">/{r.max}</span>
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl bg-[var(--moca-fill)] px-4 py-3.5 text-base text-[var(--moca-muted)] leading-relaxed">
          {submitStatus === "idle" && "Đang chuẩn bị gửi bài làm…"}
          {submitStatus === "pending" && "Đang gửi bài làm…"}
          {submitStatus === "success" && "Bài làm đã gửi · chờ bác sĩ duyệt."}
          {submitStatus === "error" && (
            <span className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-[#b91c1c]">Không gửi được — kiểm tra kết nối máy chủ.</span>
              <button
                type="button"
                onClick={onRetrySubmit}
                className="shrink-0 rounded-xl border-2 border-[var(--moca-primary)] px-4 py-2 font-semibold text-[var(--moca-primary)] hover:bg-blue-50"
              >
                Gửi lại
              </button>
            </span>
          )}
          {submitStatus === "skipped" && "Đăng nhập để lưu bài làm."}
        </div>

        <button type="button" onClick={onRestart} className="moca-btn-primary mt-6">
          Làm bài mới
        </button>
      </div>
    </div>
  );
}

/* =============================================================================
   START / PROFILE  (auth bypassed — captures fields needed for grading)
   ========================================================================== */
function StartScreen({ profile, setProfile, onStart, onHome }) {
  return (
    <div className="moca-setup-screen">
      <div className="moca-card">
        <button
          type="button"
          onClick={onHome}
          className="mb-4 flex items-center gap-1 text-sm font-medium text-[var(--moca-primary)] hover:underline"
        >
          <ArrowLeft size={16} />
          Trang chủ
        </button>
        <p className="moca-badge">Kiểm tra nhận thức</p>
        <h1 className="moca-title mb-2">Bài kiểm tra MoCA</h1>
        <p className="mb-5 text-base text-[var(--moca-muted)] leading-snug">
          15–20 phút · Hướng dẫn giọng nói · Một câu mỗi màn hình.
        </p>

        <div className="space-y-4">
          <div>
            <label className="moca-label">Họ và tên</label>
            <TextField
              value={profile.patient_name}
              onChange={(e) => setProfile({ ...profile, patient_name: e.target.value })}
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div>
            <label className="moca-label">Số năm đi học</label>
            <TextField
              type="number"
              inputMode="numeric"
              value={profile.education_years}
              onChange={(e) =>
                setProfile({ ...profile, education_years: parseInt(e.target.value, 10) || 0 })
              }
              placeholder="11"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <button type="button" onClick={onStart} className="moca-btn-primary">
            Bắt đầu
          </button>
        </div>
      </div>
    </div>
  );
}

/* =============================================================================
   CONTAINER — wizard + progress + state management
   ========================================================================== */
export default function MocaTestContainer() {
  const navigate = useNavigate();
  const speech = useSpeech("vi-VN");
  const authUser = useAuthStore((s) => s.user);
  const submitSession = useSubmitSession();
  const submitStarted = useRef(false);
  const [submitStatus, setSubmitStatus] = useState("idle");

  const [profile, setProfile] = useState({
    phone: authUser?.id ?? "",
    email: authUser?.email ?? "",
    patient_name: authUser?.fullName ?? "",
    education_years: 11,
    selected_set_id: Object.keys(QUESTION_BANK)[0],
  });
  const [phase, setPhase] = useState("start");
  const [currentStep, setCurrentStep] = useState(1); // 1..9
  const [answers, setAnswers] = useState({});
  const [section3EndTime, setSection3EndTime] = useState(null);

  const set = QUESTION_BANK[profile.selected_set_id];
  const setAnswer = useCallback((key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }, []);

  const next = () => {
    speech.cancel();
    if (currentStep >= 9) setPhase("results");
    else setCurrentStep((s) => s + 1);
  };
  const back = () => {
    speech.cancel();
    if (currentStep <= 1) setPhase("start");
    else setCurrentStep((s) => s - 1);
  };

  const restart = () => {
    speech.cancel();
    setAnswers({});
    setSection3EndTime(null);
    setCurrentStep(1);
    setPhase("start");
    submitStarted.current = false;
    setSubmitStatus("idle");
  };

  const doSubmit = useCallback(() => {
    setSubmitStatus("pending");
    submitSession.mutate(
      {
        setId: profile.selected_set_id,
        rawAnswers: answers,
        educationYears: profile.education_years,
      },
      {
        onSuccess: () => setSubmitStatus("success"),
        onError: () => setSubmitStatus("error"),
      },
    );
  }, [profile.selected_set_id, profile.education_years, answers, submitSession]);

  useEffect(() => {
    if (phase !== "results" || submitStarted.current) return;
    if (!authUser?.id) {
      setSubmitStatus("skipped");
      return;
    }
    submitStarted.current = true;
    doSubmit();
  }, [phase, authUser?.id, doSubmit]);

  const progress = phase === "results" ? 100 : ((currentStep - 1) / 9) * 100;

  const sectionProps = { set, speech, answers, setAnswer, onNext: next, onBack: back };

  return (
    <div className="moca-exam">
      {phase === "exam" && <ProgressBar value={progress} currentStep={currentStep} />}

      {phase === "start" && (
        <StartScreen
          profile={profile}
          setProfile={setProfile}
          onHome={() => navigate('/patient')}
          onStart={() => {
            // Randomly assign the test set — the patient never chooses it.
            setProfile((p) => ({ ...p, selected_set_id: pickRandomSetId() }));
            setCurrentStep(1);
            setAnswers({});
            setSection3EndTime(null);
            setPhase("exam");
          }}
        />
      )}

      {phase === "exam" && (
        <div className="moca-exam-body">
          <button
            type="button"
            onClick={() => { if (confirm('Thoát bài kiểm tra? Dữ liệu sẽ không được lưu.')) navigate('/patient'); }}
            className="mb-3 flex items-center gap-1 text-sm font-medium text-[var(--moca-muted)] hover:text-[var(--moca-primary)]"
          >
            <ArrowLeft size={16} />
            Thoát
          </button>
          {currentStep === 1 && <Section1Visuospatial {...sectionProps} />}
          {currentStep === 2 && <Section2Naming {...sectionProps} />}
          {currentStep === 3 && (
            <Section3Memory {...sectionProps} markSection3End={() => setSection3EndTime(Date.now())} />
          )}
          {currentStep === 4 && <Section4Attention {...sectionProps} />}
          {currentStep === 5 && <Section5Sentences {...sectionProps} />}
          {currentStep === 6 && <Section6Fluency {...sectionProps} />} 
          {currentStep === 7 && <Section7Abstraction {...sectionProps} />}
          {currentStep === 8 && (
            <Section8Recall {...sectionProps} section3EndTime={section3EndTime} />
          )}
          {currentStep === 9 && <Section9Orientation {...sectionProps} />}
        </div>
      )}

      {phase === "results" && (
        <div className="moca-exam-body">
          <button
            type="button"
            onClick={() => navigate('/patient')}
            className="mb-3 flex items-center gap-1 text-sm font-medium text-[var(--moca-primary)] hover:underline"
          >
            <ArrowLeft size={16} />
            Trang chủ
          </button>
          <ResultsSummary
            set={set}
            answers={answers}
            profile={profile}
            onRestart={restart}
            submitStatus={submitStatus}
            onRetrySubmit={doSubmit}
          />
        </div>
      )}
    </div>
  );
}
