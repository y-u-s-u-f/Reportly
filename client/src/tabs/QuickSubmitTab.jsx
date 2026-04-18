import { useEffect, useRef, useState } from "react";
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
} from "lucide-react";
import MiniMap from "../components/MiniMap.jsx";
import { SeverityBadge, DepartmentBadge } from "../components/Badges.jsx";
import { useToast } from "../components/Toast.jsx";
import {
  forwardGeocode,
  reverseGeocode,
  submitReport,
  transcribeAudio,
} from "../lib/api.js";
import { enqueueReport } from "../lib/offlineQueue.js";

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

export default function QuickSubmitTab({
  online,
  onQueueChange,
  onSubmitted,
  initialCapture,
  onCaptureConsumed,
}) {
  const toast = useToast();
  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [description, setDescription] = useState("");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  const [coords, setCoords] = useState(null);
  const [address, setAddress] = useState("");
  const [geoError, setGeoError] = useState(null);
  const [editingLocation, setEditingLocation] = useState(false);
  const [addressDraft, setAddressDraft] = useState("");
  const [searching, setSearching] = useState(false);
  const reverseTimerRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  function detectLocation() {
    if (!navigator.geolocation) {
      setGeoError("Geolocation not supported");
      return;
    }
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lon: longitude });
        const addr = await reverseGeocode(latitude, longitude);
        if (addr) {
          setAddress(addr);
          setAddressDraft(addr);
        }
      },
      (err) => setGeoError(err.message || "Location unavailable"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  useEffect(() => {
    detectLocation();
  }, []);

  useEffect(() => {
    if (!initialCapture) return;
    setPhotos((prev) => [...prev, initialCapture].slice(0, MAX_PHOTOS));
    onCaptureConsumed?.();
  }, [initialCapture, onCaptureConsumed]);

  function handleMapMove(lat, lon) {
    setCoords({ lat, lon });
    if (reverseTimerRef.current) clearTimeout(reverseTimerRef.current);
    reverseTimerRef.current = setTimeout(async () => {
      const addr = await reverseGeocode(lat, lon);
      if (addr) {
        setAddress(addr);
        setAddressDraft(addr);
      }
    }, 500);
  }

  async function handleAddressSearch() {
    const q = addressDraft.trim();
    if (!q) return;
    setSearching(true);
    try {
      const hit = await forwardGeocode(q);
      if (!hit) {
        toast.show("No match for that address", "error");
        return;
      }
      setCoords({ lat: hit.lat, lon: hit.lon });
      setAddress(hit.address);
      setAddressDraft(hit.address);
    } catch {
      toast.show("Address lookup failed", "error");
    } finally {
      setSearching(false);
    }
  }

  function useMyLocation() {
    detectLocation();
  }

  useEffect(() => {
    const urls = photos.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [photos]);

  function handleFileChange(e) {
    const newFiles = Array.from(e.target.files || []);
    setPhotos((prev) => [...prev, ...newFiles].slice(0, MAX_PHOTOS));
    e.target.value = "";
  }

  function removePhoto(idx) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMime = pickAudioMime();
      const mr = new MediaRecorder(
        stream,
        preferredMime ? { mimeType: preferredMime } : undefined,
      );
      chunksRef.current = [];
      mr.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const actualType = mr.mimeType || preferredMime || "audio/webm";
        const ext = mimeToExt(actualType);
        const blob = new Blob(chunksRef.current, { type: actualType });
        setRecording(false);
        setTranscribing(true);
        try {
          const { text } = await transcribeAudio(blob, `voice.${ext}`);
          if (text) setDescription((d) => (d ? `${d} ${text}` : text));
        } catch (err) {
          toast.show(err.message || "Transcription failed", "error");
        } finally {
          setTranscribing(false);
        }
      };
      recorderRef.current = mr;
      mr.start();
      setRecording(true);
    } catch {
      toast.show("Microphone access denied", "error");
    }
  }

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  }

  async function handleSubmit() {
    if (!coords) {
      toast.show("Waiting for location…", "error");
      return;
    }
    if (!description.trim() && photos.length === 0) {
      toast.show("Add a description or photo first", "error");
      return;
    }
    setSubmitting(true);
    setResult(null);

    const payload = {
      description: description.trim(),
      latitude: coords.lat,
      longitude: coords.lon,
      address,
      photos,
    };

    try {
      if (!online) {
        await enqueueReport(payload);
        onQueueChange?.();
        toast.show("Saved offline — will sync when online", "info");
        resetForm();
        return;
      }
      const data = await submitReport(payload);
      setResult(data);
      toast.show("Report submitted!", "success");
      onSubmitted?.();
      resetForm({ keepResult: true });
    } catch {
      try {
        await enqueueReport(payload);
        onQueueChange?.();
        toast.show("Network error — saved offline", "info");
        resetForm();
      } catch {
        toast.show("Failed to submit report", "error");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm({ keepResult = false } = {}) {
    setPhotos([]);
    setDescription("");
    if (!keepResult) setResult(null);
  }

  const locationLabel = coords
    ? address || `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`
    : geoError || "Detecting location…";

  return (
    <div className="px-4 py-5 space-y-5">
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Photos
          </h2>
          <span className="text-xs text-zinc-500">{photos.length}/{MAX_PHOTOS}</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {previews.map((src, i) => (
            <div
              key={src}
              className="relative h-20 w-20 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                aria-label="Remove photo"
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-zinc-900/80 text-white inline-flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-20 w-20 rounded-xl border-2 border-dashed border-teal-500 text-teal-500 dark:text-teal-300 inline-flex flex-col items-center justify-center gap-1 text-xs font-medium hover:bg-teal-50 dark:hover:bg-teal-900/20"
            >
              <Camera size={22} />
              Add photo
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
          Describe the Issue
        </h2>
        <button
          type="button"
          onClick={recording ? stopRecording : startRecording}
          disabled={transcribing}
          aria-label={recording ? "Stop recording" : "Start voice dictation"}
          className={`w-full min-h-[84px] rounded-2xl inline-flex flex-col items-center justify-center gap-1.5 text-white font-semibold shadow-md transition disabled:opacity-60 ${
            recording
              ? "bg-red-600 recording-pulse"
              : "bg-teal-500 hover:bg-teal-600 active:scale-[0.99]"
          }`}
        >
          {transcribing ? (
            <>
              <Loader2 size={28} className="animate-spin" />
              <span className="text-sm">Transcribing…</span>
            </>
          ) : recording ? (
            <>
              <Square size={28} />
              <span className="text-sm">Tap to stop recording</span>
            </>
          ) : (
            <>
              <Mic size={28} />
              <span className="text-sm">Tap to dictate</span>
            </>
          )}
        </button>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Or type here — your dictation will also land here."
          rows={3}
          className="mt-3 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </section>

      <section>
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            <MapPin size={16} className="mt-0.5 text-teal-500 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">
                Location
              </div>
              <div className="text-sm font-medium truncate">{locationLabel}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!coords) setCoords({ lat: 0, lon: 0 });
              setEditingLocation(true);
            }}
            className="shrink-0 min-h-[36px] inline-flex items-center gap-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 text-xs font-semibold px-3 py-1.5"
          >
            Change
          </button>
        </div>
      </section>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full min-h-[56px] rounded-2xl bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-bold text-base inline-flex items-center justify-center gap-2 transition shadow-md"
      >
        {submitting ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Classifying…
          </>
        ) : (
          <>
            <Send size={20} />
            Submit Report
          </>
        )}
      </button>

      {result && <ResultCard result={result} />}

      {editingLocation && coords && (
        <LocationModal
          coords={coords}
          addressDraft={addressDraft}
          setAddressDraft={setAddressDraft}
          onSearch={handleAddressSearch}
          searching={searching}
          onMapMove={handleMapMove}
          onUseMyLocation={useMyLocation}
          onClose={() => setEditingLocation(false)}
        />
      )}
    </div>
  );
}

function LocationModal({
  coords,
  addressDraft,
  setAddressDraft,
  onSearch,
  searching,
  onMapMove,
  onUseMyLocation,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-[1100] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white dark:bg-zinc-900 p-5 shadow-xl space-y-3 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Change location</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="h-9 w-9 inline-flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={addressDraft}
            onChange={(e) => setAddressDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            placeholder="Type an address or place"
            className="flex-1 min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            type="button"
            onClick={onSearch}
            disabled={searching || !addressDraft.trim()}
            aria-label="Search address"
            className="h-11 w-11 shrink-0 rounded-lg bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white inline-flex items-center justify-center"
          >
            {searching ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Search size={16} />
            )}
          </button>
        </div>
        <p className="text-xs text-zinc-500">
          Tap or drag the pin on the map to fine-tune.
        </p>
        <MiniMap
          lat={coords.lat}
          lon={coords.lon}
          interactive
          onChange={onMapMove}
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-zinc-500">
            {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}
          </span>
          <button
            type="button"
            onClick={onUseMyLocation}
            className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-300 font-semibold hover:underline min-h-[36px] px-2 text-sm"
          >
            <LocateFixed size={14} />
            Use my location
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-full min-h-[44px] rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function ResultCard({ result }) {
  const r = result.report;
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
      {result.duplicate ? (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 p-3 text-sm">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <span>
            A similar issue was already reported nearby. Your report has been added to it.
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-teal-600 dark:text-teal-300">
          <CheckCircle2 size={18} />
          <span className="text-sm font-semibold">Report received</span>
        </div>
      )}
      <div>
        <div className="text-xs uppercase tracking-wider text-zinc-500">Issue</div>
        <div className="font-semibold">{r.issueType || "—"}</div>
      </div>
      <div className="flex flex-wrap gap-2">
        <DepartmentBadge department={r.department} />
        <SeverityBadge severity={r.severity} />
      </div>
      {r.summary && (
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{r.summary}</p>
      )}
      <p className="text-xs text-zinc-500">
        {r.affectedCount} {r.affectedCount === 1 ? "person" : "people"} affected
      </p>
    </div>
  );
}
