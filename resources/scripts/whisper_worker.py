#!/usr/bin/env python3
"""
ULTRON v1.0.2 — Persistent OpenAI Whisper Worker
Company: UPAI Technologies (Founder: Sukesh D.)

Provides ultra-low-latency local Speech-to-Text inference via faster-whisper (CTranslate2).
The process stays resident in RAM/VRAM to eliminate interpreter startup overhead,
communicating with the Electron main process via standard JSON-RPC over stdin/stdout.
"""

import sys
import os
import json
import time
import base64
import tempfile
import io

# Flush stdout immediately on every print
def send_response(data):
    sys.stdout.write(json.dumps(data) + '\n')
    sys.stdout.flush()

model = None
current_model_name = None

def load_whisper_model(model_name="tiny.en", device="cpu", compute_type="int8"):
    global model, current_model_name
    t0 = time.perf_counter()
    try:
        from faster_whisper import WhisperModel
        # Disable symlink warnings on Windows
        os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
        model = WhisperModel(model_name, device=device, compute_type=compute_type)
        current_model_name = model_name
        duration_ms = round((time.perf_counter() - t0) * 1000, 2)
        return {"status": "ok", "model": model_name, "duration_ms": duration_ms}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def transcribe_audio(audio_source, language=None):
    global model
    if model is None:
        # Auto-load default tiny.en if not loaded
        res = load_whisper_model("tiny.en")
        if res.get("status") != "ok":
            return res

    t0 = time.perf_counter()
    try:
        segments, info = model.transcribe(
            audio_source,
            beam_size=1,
            language=language if language and language != "auto" else None,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=250)
        )
        
        text_parts = []
        seg_list = []
        for segment in segments:
            text_parts.append(segment.text)
            seg_list.append({
                "start": segment.start,
                "end": segment.end,
                "text": segment.text
            })
        
        full_text = " ".join(text_parts).strip()
        duration_ms = round((time.perf_counter() - t0) * 1000, 2)
        detected_lang = getattr(info, "language", language or "en")
        prob = getattr(info, "language_probability", 1.0)

        return {
            "status": "ok",
            "text": full_text,
            "language": detected_lang,
            "language_prob": round(prob, 4),
            "duration_ms": duration_ms,
            "segments": seg_list
        }
    except Exception as e:
        return {"status": "error", "message": str(e), "duration_ms": round((time.perf_counter() - t0) * 1000, 2)}

def main():
    # Notify ready
    send_response({"status": "ready", "version": "1.0.2", "engine": "faster-whisper"})

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
        except Exception as e:
            send_response({"status": "error", "message": f"Invalid JSON: {str(e)}"})
            continue

        cmd = req.get("command", "")

        if cmd == "ping":
            send_response({"status": "ok", "pong": True, "time": time.time()})

        elif cmd == "load_model":
            m_name = req.get("model", "tiny.en")
            dev = req.get("device", "cpu")
            c_type = req.get("compute_type", "int8")
            res = load_whisper_model(m_name, dev, c_type)
            send_response(res)

        elif cmd == "get_status":
            send_response({
                "status": "ok",
                "loaded": model is not None,
                "model": current_model_name,
                "engine": "faster-whisper (CTranslate2)"
            })

        elif cmd == "transcribe_file":
            audio_path = req.get("audio_path")
            lang = req.get("language")
            if not audio_path or not os.path.exists(audio_path):
                send_response({"status": "error", "message": f"Audio file not found: {audio_path}"})
            else:
                res = transcribe_audio(audio_path, lang)
                send_response(res)

        elif cmd == "transcribe_base64":
            audio_b64 = req.get("audio_base64", "")
            lang = req.get("language")
            try:
                raw_bytes = base64.b64decode(audio_b64)
                # Write to temporary wav file for faster-whisper ingestion
                with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                    tmp.write(raw_bytes)
                    tmp_path = tmp.name
                
                try:
                    res = transcribe_audio(tmp_path, lang)
                    send_response(res)
                finally:
                    if os.path.exists(tmp_path):
                        os.unlink(tmp_path)
            except Exception as e:
                send_response({"status": "error", "message": f"Decode error: {str(e)}"})

        elif cmd == "quit" or cmd == "exit":
            send_response({"status": "ok", "message": "shutting down"})
            break
        else:
            send_response({"status": "error", "message": f"Unknown command '{cmd}'"})

if __name__ == "__main__":
    main()
