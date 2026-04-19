import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  Mic,
  Square,
  X,
  Send,
  MapPin,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  LocateFixed,
  Search,
  ChevronLeft,
  Sparkles,
  Image as ImageIcon,
  Pencil,
} from "lucide-react";
import {
  forwardGeocode,
  reverseGeocode,
  submitReport,
  transcribeAudio,
} from "../../lib/api.js";
import { enqueueReport } from "../../lib/offlineQueue.js";
import { useAppStore } from "../../store/index.js";
import { queueSize } from "../../lib/offlineQueue.js";
import { ipGeolocate } from "../../lib/geo.js";
import BottomSheet, { SheetBody, SheetFooter } from "../../components/ui/BottomSheet.jsx";
import Button from "../../components/ui/Button.jsx";
import { SeverityBadge, DepartmentBadge } from "../../components/ui/Badge.jsx";
import MiniMap from "../../components/MiniMap.jsx";
import { pressTap, spring } from "../../design/motion.js";

const MAX_PHOTOS = 3;
const AUDIO_MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
];
function pickAudioMime() {
  if (typeof MediaRecorder === "undefined") return "";
  for (const c of AUDIO_MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported?.(c)) return c;
  }
  return "";
}
function mimeToExt(type = "") {
  if (type.includes("webm")) return "webm";
  if (type.includes("mp4")) return "mp4";
  if (type.includes("mpeg")) return "mp3";
  if (type.includes("wav")) return "wav";
  if (type.includes("ogg")) return "ogg";
  return "webm";
}

export default function SubmitSheet() {
  const navigate = useNavigate();
  const location = useLocation();
  const background = location.state?.background;
  const pushToast = useAppStore((s) => s.pushToast);
  const online = useAppStore((s) => s.online);
  const setPending = useAppStore((s) => s.setPending);
  const refresh = useAppStore((s) => s.refresh);

  const [open, setOpen] = useState(true);
  const [step, setStep] = useState(1);
  const [result, setResult] = useState(null);

  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [coords, setCoords] = useState(null);
  const [address, setAddress] = useState("");
  const [geoError, setGeoError] = useState(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [describeMode, setDescribeMode] = useState("text");

  useEffect(() => {
    return () => previews.forEach((p) => URL.revokeObjectURL(p));
  }, [previews]);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      ipGeolocate().then((c) => c && setCoordsFrom(c));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        setCoordsFrom({ lat: p.coords.latitude, lon: p.coords.longitude });
      },
      () => ipGeolocate().then((c) => (c ? setCoordsFrom(c) : setGeoError("Couldn't get your location"))),
      { enableHighAccuracy: true, timeout: 8000 },
    );
    async function setCoordsFrom({ lat, lon }) {
      setCoords({ lat, lon });
      const addr = await reverseGeocode(lat, lon);
      if (addr) setAddress(addr);
    }
  }, []);

  function close() {
    setOpen(false);
    setTimeout(() => {
      if (background) navigate(background.pathname || "/", { replace: true });
      else navigate("/", { replace: true });
    }, 260);
  }

  function addPhotos(files) {
    const list = Array.from(files || []).slice(0, MAX_PHOTOS - photos.length);
    setPhotos((p) => [...p, ...list]);
    setPreviews((p) => [...p, ...list.map((f) => URL.createObjectURL(f))]);
  }
  function removePhoto(i) {
    setPhotos((p) => p.filter((_, idx) => idx !== i));
    setPreviews((p) => {
      URL.revokeObjectURL(p[i]);
      return p.filter((_, idx) => idx !== i);
    });
  }

  const canAdvance = {
    1: true, // photos optional
    2: coords != null,
    3: description.trim().length >= 3 || photos.length > 0,
    4: true,
  };

  async function handleSubmit() {
    if (!coords) return;
    setSubmitting(true);
    const payload = {
      description,
      latitude: coords.lat,
      longitude: coords.lon,
      address,
      photos,
    };
    try {
      if (!online) {
        await enqueueReport(payload);
        setPending(queueSize());
        setResult({ queued: true });
      } else {
        const res = await submitReport(payload);
        setResult(res);
        refresh();
      }
      pushToast(online ? "Report filed" : "Queued — will send when online", "success");
    } catch (err) {
      pushToast(err.message || "Submit failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const title = result ? "Filed" : `Step ${step} of 4`;
  const subtitle = result
    ? online
      ? "Thanks — it's on its way."
      : "Queued — we'll send it when you're back online."
    : SUBTITLES[step];

  return (
    <BottomSheet
      open={open}
      onClose={close}
      size="lg"
      aria-label="File a report"
      title={title}
      subtitle={subtitle}
    >
      {!result && (
        <div className="px-5 pt-3">
          <StepBar step={step} />
        </div>
      )}

      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={result ? "done" : step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={spring}
          >
            {result ? (
              <SuccessPanel result={result} onClose={close} />
            ) : step === 1 ? (
              <StepCapture
                photos={photos}
                previews={previews}
                addPhotos={addPhotos}
                removePhoto={removePhoto}
              />
            ) : step === 2 ? (
              <StepLocate
                coords={coords}
                address={address}
                setCoords={setCoords}
                setAddress={setAddress}
                geoError={geoError}
                setGeoError={setGeoError}
              />
            ) : step === 3 ? (
              <StepDescribe
                mode={describeMode}
                setMode={setDescribeMode}
                description={description}
                setDescription={setDescription}
              />
            ) : (
              <StepReview
                photos={photos}
                previews={previews}
                coords={coords}
                address={address}
                description={description}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {!result && (
        <SheetFooter>
          <div className="flex gap-2">
            {step > 1 && (
              <Button
                variant="secondary"
                size="lg"
                icon={<ChevronLeft size={16} />}
                onClick={() => setStep(step - 1)}
              >
                Back
              </Button>
            )}
            {step < 4 ? (
              <Button
                size="lg"
                fullWidth
                disabled={!canAdvance[step]}
                onClick={() => setStep(step + 1)}
              >
                Continue
              </Button>
            ) : (
              <Button
                size="lg"
                fullWidth
                disabled={submitting || !coords}
                onClick={handleSubmit}
                icon={submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              >
                {online ? "Submit report" : "Queue for sending"}
              </Button>
            )}
          </div>
        </SheetFooter>
      )}
    </BottomSheet>
  );
}

const SUBTITLES = {
  1: "Add photos so officials can see what's going on.",
  2: "We auto-detect your location — adjust if needed.",
  3: "Describe what's happening. Voice or text — your call.",
  4: "One last look before we file it.",
};

function StepBar({ step }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`flex-1 h-1.5 rounded-full transition-colors ${
            i <= step
              ? "bg-[color:var(--color-primary-600)]"
              : "bg-[color:var(--color-line)]"
          }`}
        />
      ))}
    </div>
  );
}

function StepCapture({ photos, previews, addPhotos, removePhoto }) {
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  return (
    <SheetBody>
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          whileTap={pressTap}
          transition={spring}
          type="button"
          onClick={() => cameraRef.current?.click()}
          disabled={photos.length >= MAX_PHOTOS}
          className="aspect-[4/3] rounded-2xl bg-[color:var(--color-primary-600)] text-white flex flex-col items-center justify-center gap-2 font-medium shadow-[var(--elev-2)] disabled:opacity-50"
        >
          <Camera size={32} />
          <span className="text-[13px]">Take photo</span>
        </motion.button>
        <motion.button
          whileTap={pressTap}
          transition={spring}
          type="button"
          onClick={() => galleryRef.current?.click()}
          disabled={photos.length >= MAX_PHOTOS}
          className="aspect-[4/3] rounded-2xl surface-2 ink flex flex-col items-center justify-center gap-2 font-medium border line disabled:opacity-50"
        >
          <ImageIcon size={28} />
          <span className="text-[13px]">Upload photo</span>
        </motion.button>
      </div>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          addPhotos(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          addPhotos(e.target.files);
          e.target.value = "";
        }}
      />

      {previews.length > 0 && (
        <div className="mt-4">
          <div className="text-[12px] uppercase tracking-wider ink-subtle font-semibold mb-2">
            {photos.length} of {MAX_PHOTOS}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {previews.map((src, i) => (
              <div
                key={src}
                className="relative aspect-square rounded-xl overflow-hidden surface-2"
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  aria-label="Remove photo"
                  className="absolute top-1.5 right-1.5 h-7 w-7 rounded-full bg-black/60 text-white inline-flex items-center justify-center hover:bg-black/80"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-5 text-[13px] ink-subtle leading-relaxed">
        A clear photo helps city staff dispatch the right crew faster. You can skip this if it's a non-visual issue.
      </p>
    </SheetBody>
  );
}

function StepLocate({ coords, address, setCoords, setAddress, geoError, setGeoError }) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);

  async function handleSearch(e) {
    e?.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const hit = await forwardGeocode(query.trim());
      if (hit) {
        setCoords({ lat: hit.lat, lon: hit.lon });
        setAddress(hit.address);
        setGeoError(null);
      } else {
        setGeoError("No match — try a different address");
      }
    } finally {
      setSearching(false);
    }
  }

  async function handleLocateMe() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const lat = p.coords.latitude;
        const lon = p.coords.longitude;
        setCoords({ lat, lon });
        const addr = await reverseGeocode(lat, lon);
        if (addr) setAddress(addr);
        setGeoError(null);
      },
      () => setGeoError("Couldn't get your location"),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  return (
    <SheetBody>
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 rounded-xl border line surface-1 pl-4 pr-2 h-11">
          <Search size={16} className="ink-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search address or place"
            className="flex-1 bg-transparent text-[14px] focus:outline-none"
          />
        </div>
        <Button type="submit" size="md" disabled={searching || !query.trim()}>
          {searching ? <Loader2 size={16} className="animate-spin" /> : "Find"}
        </Button>
      </form>

      <div className="mt-4">
        {coords ? (
          <MiniMap
            lat={coords.lat}
            lon={coords.lon}
            interactive
            onChange={async (lat, lon) => {
              setCoords({ lat, lon });
              const addr = await reverseGeocode(lat, lon);
              if (addr) setAddress(addr);
            }}
          />
        ) : (
          <div className="h-56 rounded-2xl surface-2 border line flex items-center justify-center">
            {geoError ? (
              <div className="text-center px-6">
                <AlertTriangle size={22} className="text-[color:var(--color-sev-med)] mx-auto mb-2" />
                <p className="text-[13px] ink-muted">{geoError}</p>
              </div>
            ) : (
              <Loader2 size={22} className="animate-spin text-[color:var(--color-primary-500)]" />
            )}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={handleLocateMe}
          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full surface-2 text-[13px] font-medium ink hover:surface-3 transition"
        >
          <LocateFixed size={14} /> Use current location
        </button>
      </div>

      {address && (
        <div className="mt-3 rounded-2xl surface-2 p-3 flex items-start gap-2">
          <MapPin size={15} className="ink-muted mt-0.5 flex-shrink-0" />
          <p className="text-[13px] ink leading-relaxed">{address}</p>
        </div>
      )}
    </SheetBody>
  );
}

function StepDescribe({ mode, setMode, description, setDescription }) {
  const pushToast = useAppStore((s) => s.pushToast);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = pickAudioMime();
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        setRecording(false);
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mime || "audio/webm" });
        if (blob.size < 1024) {
          pushToast("Recording too short", "error");
          return;
        }
        setTranscribing(true);
        try {
          const { text } = await transcribeAudio(blob, `voice.${mimeToExt(mime)}`);
          if (text) {
            setDescription((d) => (d ? `${d}\n${text}` : text));
            setMode("text");
            pushToast("Transcribed", "success");
          }
        } catch (e) {
          pushToast(e.message || "Transcription failed", "error");
        } finally {
          setTranscribing(false);
        }
      };
      recorder.start();
      setRecording(true);
    } catch (e) {
      pushToast(e.message || "Microphone unavailable", "error");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
  }

  return (
    <SheetBody>
      <div className="flex justify-center mb-4">
        <div className="inline-flex p-1 rounded-full surface-2">
          {["text", "voice"].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-4 h-9 text-sm font-medium rounded-full transition ${
                mode === m
                  ? "surface-0 ink shadow-[var(--elev-1)]"
                  : "ink-muted"
              }`}
            >
              {m === "text" ? (
                <span className="inline-flex items-center gap-1.5"><Pencil size={13} /> Text</span>
              ) : (
                <span className="inline-flex items-center gap-1.5"><Mic size={13} /> Voice</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {mode === "voice" ? (
        <div className="flex flex-col items-center py-6">
          <motion.button
            whileTap={pressTap}
            transition={spring}
            type="button"
            onClick={recording ? stopRecording : startRecording}
            disabled={transcribing}
            aria-label={recording ? "Stop recording" : "Start recording"}
            className={`h-28 w-28 rounded-full inline-flex items-center justify-center text-white shadow-[var(--elev-3)] transition ${
              recording
                ? "bg-[color:var(--color-sev-high)] recording-pulse"
                : "bg-[color:var(--color-primary-600)]"
            }`}
          >
            {transcribing ? <Loader2 size={32} className="animate-spin" /> : recording ? <Square size={28} /> : <Mic size={36} />}
          </motion.button>
          <p className="mt-4 text-[13px] ink-muted text-center max-w-xs">
            {transcribing
              ? "Transcribing…"
              : recording
                ? "Recording — tap to stop."
                : "Tap to describe the issue out loud."}
          </p>
        </div>
      ) : (
        <textarea
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's the issue? Include anything useful — severity, how long it's been there, nearby landmarks."
          className="w-full rounded-2xl border line bg-[color:var(--color-surface-1)] p-3.5 text-[15px] leading-relaxed focus:outline-none focus:border-[color:var(--color-primary-500)]"
        />
      )}

      {mode === "text" && description.length > 0 && (
        <div className="mt-2 text-right text-[11px] ink-subtle tabular">
          {description.length} characters
        </div>
      )}
    </SheetBody>
  );
}

function StepReview({ photos, previews, coords, address, description }) {
  return (
    <SheetBody>
      <div className="rounded-2xl surface-2 p-4 mb-3">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={14} className="text-[color:var(--color-primary-600)]" />
          <span className="text-[12px] uppercase tracking-wider ink-muted font-semibold">
            AI classification
          </span>
        </div>
        <p className="text-[13px] ink">
          Once you submit, we'll analyze the photo + description to route this to the right department.
          You'll see the result in a moment.
        </p>
      </div>

      {previews.length > 0 && (
        <Section title={`Photos · ${photos.length}`}>
          <div className="grid grid-cols-3 gap-2">
            {previews.map((src) => (
              <div key={src} className="aspect-square rounded-xl overflow-hidden surface-2">
                <img src={src} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </Section>
      )}

      {coords && (
        <Section title="Location">
          <div className="rounded-2xl surface-2 p-3 flex items-start gap-2">
            <MapPin size={15} className="ink-muted mt-0.5 flex-shrink-0" />
            <p className="text-[13px] ink leading-relaxed">
              {address || `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`}
            </p>
          </div>
        </Section>
      )}

      {description && (
        <Section title="Description">
          <p className="text-[14px] ink leading-relaxed whitespace-pre-wrap">
            {description}
          </p>
        </Section>
      )}

      {!photos.length && !description && (
        <div className="rounded-2xl border border-[color:var(--color-sev-med-soft)] bg-[color:var(--color-sev-med-soft)] text-[color:var(--color-sev-med)] p-3 text-[13px] flex items-start gap-2">
          <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
          <span>Add a photo or description so officials can understand the issue.</span>
        </div>
      )}
    </SheetBody>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-4">
      <h3 className="text-[12px] uppercase tracking-wider ink-subtle font-semibold mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

function SuccessPanel({ result, onClose }) {
  return (
    <SheetBody className="text-center py-8">
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ ...spring, delay: 0.05 }}
        className="h-20 w-20 mx-auto rounded-full bg-[color:var(--color-accent-400)] text-[color:var(--color-primary-950)] inline-flex items-center justify-center"
      >
        <CheckCircle2 size={40} strokeWidth={2.4} />
      </motion.div>
      <h3 className="font-display text-[28px] mt-5 ink">
        {result.queued ? "Queued" : "Filed"}
      </h3>
      <p className="ink-muted mt-2 text-[14px] leading-relaxed max-w-xs mx-auto">
        {result.queued
          ? "We'll send this when you're back online."
          : "Thanks for reporting — the right department has been notified."}
      </p>

      {!result.queued && (result.issueType || result.department || result.severity) && (
        <div className="mt-5 rounded-2xl surface-2 p-4 inline-flex flex-col gap-2 items-center">
          <div className="flex gap-1.5 flex-wrap justify-center">
            {result.severity && <SeverityBadge level={result.severity} />}
            {result.department && <DepartmentBadge department={result.department} />}
          </div>
          {result.issueType && (
            <div className="text-[14px] ink font-medium mt-1">{result.issueType}</div>
          )}
          {result.summary && (
            <p className="text-[12px] ink-muted leading-relaxed max-w-xs">
              {result.summary}
            </p>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2 max-w-xs mx-auto">
        {result.id && (
          <Button
            as="a"
            href={`/r/${result.id}`}
            size="lg"
            fullWidth
          >
            View report
          </Button>
        )}
        <Button variant="secondary" size="md" fullWidth onClick={onClose}>
          Done
        </Button>
      </div>
    </SheetBody>
  );
}
