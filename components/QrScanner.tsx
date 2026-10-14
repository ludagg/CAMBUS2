'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';

interface QrScannerProps {
  /** Called with the decoded QR string when a code is successfully scanned. */
  onDecode: (value: string) => void;
  /** Minimum milliseconds between two successful decodes (dedup). Default 1500. */
  debounceMs?: number;
  /** Prefer the rear camera (environment facing). Default true. */
  preferRearCamera?: boolean;
  className?: string;
}

type ScannerStatus = 'idle' | 'starting' | 'scanning' | 'denied' | 'unsupported' | 'error';

/**
 * Live camera QR-code scanner.
 *
 * Uses getUserMedia + jsQR. Works in any modern browser that supports
 * MediaDevices API (Chrome, Edge, Firefox, Safari iOS 14+).
 *
 * The component is self-contained: start / stop buttons, error states,
 * viewfinder overlay, and a small audible beep on successful decode.
 */
export default function QrScanner({
  onDecode,
  debounceMs = 1500,
  preferRearCamera = true,
  className = '',
}: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastDecodeRef = useRef<{ value: string; at: number } | null>(null);
  const runningRef = useRef(false);

  const [status, setStatus] = useState<ScannerStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastValue, setLastValue] = useState<string | null>(null);

  const stopScan = useCallback(() => {
    runningRef.current = false;
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus((s) => (s === 'scanning' || s === 'starting' ? 'idle' : s));
  }, []);

  const beep = useCallback(() => {
    try {
      type AudioCtor = typeof AudioContext;
      type WithWebkit = Window & { webkitAudioContext?: AudioCtor };
      const AC: AudioCtor | undefined =
        window.AudioContext ?? (window as WithWebkit).webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.value = 0.1;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
      setTimeout(() => ctx.close(), 200);
    } catch {
      /* no-op */
    }
  }, []);

  const tick = useCallback(() => {
    if (!runningRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    ctx.drawImage(video, 0, 0, w, h);
    const img = ctx.getImageData(0, 0, w, h);
    const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
    if (code && code.data) {
      const now = Date.now();
      const last = lastDecodeRef.current;
      const isNew = !last || last.value !== code.data || now - last.at > debounceMs;
      // Refresh the timestamp on every sighting: a code held in front of the
      // camera only fires again after it has been out of view for debounceMs.
      lastDecodeRef.current = { value: code.data, at: now };
      if (isNew) {
        setLastValue(code.data);
        beep();
        onDecode(code.data);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [beep, debounceMs, onDecode]);

  const startScan = useCallback(async () => {
    setErrorMessage(null);
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStatus('unsupported');
      setErrorMessage("Votre navigateur ne permet pas l'accès à la caméra.");
      return;
    }
    setStatus('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: preferRearCamera
          ? { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : true,
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      await video.play();
      runningRef.current = true;
      setStatus('scanning');
      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      const e = err as DOMException;
      if (e?.name === 'NotAllowedError' || e?.name === 'PermissionDeniedError') {
        setStatus('denied');
        setErrorMessage("Accès à la caméra refusé. Autorisez la caméra dans les réglages du navigateur.");
      } else if (e?.name === 'NotFoundError' || e?.name === 'OverconstrainedError') {
        setStatus('error');
        setErrorMessage('Aucune caméra détectée.');
      } else {
        setStatus('error');
        setErrorMessage(e?.message || 'Impossible de démarrer la caméra.');
      }
      stopScan();
    }
  }, [preferRearCamera, stopScan, tick]);

  useEffect(() => {
    return () => {
      stopScan();
    };
  }, [stopScan]);

  const isLive = status === 'scanning' || status === 'starting';

  return (
    <div className={`w-full ${className}`}>
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
        <video
          ref={videoRef}
          muted
          playsInline
          className={`w-full h-full object-cover ${isLive ? 'opacity-100' : 'opacity-0'}`}
        />
        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

        {!isLive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3 p-6 text-center">
            <span className="material-symbols-outlined text-5xl opacity-70">qr_code_scanner</span>
            <p className="text-sm opacity-80 max-w-sm">
              {status === 'denied'
                ? errorMessage
                : status === 'unsupported' || status === 'error'
                ? errorMessage
                : "Appuyez sur « Démarrer » et autorisez l'accès à la caméra pour scanner les billets."}
            </p>
          </div>
        )}

        {isLive && (
          <>
            {/* Viewfinder frame */}
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none flex items-center justify-center"
            >
              <div className="relative w-3/5 max-w-[280px] aspect-square">
                <span className="absolute inset-0 rounded-2xl ring-2 ring-white/40" />
                <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
              </div>
            </div>
            <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-red-600/90 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-white animate-pulse" />
              Live
            </div>
          </>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        {!isLive ? (
          <button
            type="button"
            onClick={startScan}
            className="px-4 py-2 rounded-lg bg-primary text-text-main font-black text-sm flex items-center gap-2 hover:shadow-subtle transition-shadow"
          >
            <span className="material-symbols-outlined text-[18px]">videocam</span>
            Démarrer le scan
          </button>
        ) : (
          <button
            type="button"
            onClick={stopScan}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-text-main dark:text-white font-black text-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">stop_circle</span>
            Arrêter
          </button>
        )}
        {lastValue && (
          <span className="text-[11px] font-mono text-text-muted truncate max-w-full">
            Dernier code : {lastValue.slice(0, 40)}
            {lastValue.length > 40 ? '…' : ''}
          </span>
        )}
      </div>

      {errorMessage && status !== 'scanning' && status !== 'starting' && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{errorMessage}</p>
      )}
    </div>
  );
}
