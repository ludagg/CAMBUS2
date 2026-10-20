'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { Button, cx } from './admin/ui';

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
  // Bumped by every start, stop and unmount. Async work that started under an
  // older value must release its stream and must not start the scan loop.
  const sessionRef = useRef(0);
  // Always points at the latest onDecode so the scan loop never calls a stale closure.
  const onDecodeRef = useRef(onDecode);
  onDecodeRef.current = onDecode;

  const [status, setStatus] = useState<ScannerStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastValue, setLastValue] = useState<string | null>(null);

  const stopScan = useCallback(() => {
    sessionRef.current += 1;
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
        onDecodeRef.current(code.data);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [beep, debounceMs]);

  const startScan = useCallback(async () => {
    setErrorMessage(null);
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStatus('unsupported');
      setErrorMessage("Votre navigateur ne permet pas l'accès à la caméra.");
      return;
    }
    setStatus('starting');
    const session = ++sessionRef.current;
    const isCurrent = () => sessionRef.current === session;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: preferRearCamera
          ? { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : true,
        audio: false,
      });
      // Stopped or unmounted while the permission prompt was open: release the camera.
      if (!isCurrent()) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      await video.play();
      // stopScan() already stopped the tracks and cleared the video.
      if (!isCurrent()) return;
      runningRef.current = true;
      setStatus('scanning');
      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      if (!isCurrent()) return;
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
  const problem = status === 'denied' || status === 'unsupported' || status === 'error';
  const problemIcon = status === 'denied' ? 'no_photography' : status === 'unsupported' ? 'videocam_off' : 'error';
  const problemTitle =
    status === 'denied' ? 'Accès à la caméra refusé' : status === 'unsupported' ? 'Caméra non prise en charge' : 'Caméra indisponible';

  return (
    <div className={cx('w-full', className)}>
      <style>{`@keyframes qr-scan-line{0%{top:6%}50%{top:92%}100%{top:6%}}@media (prefers-reduced-motion:reduce){.qr-scan-line{animation:none!important;top:50%!important}}`}</style>
      <div className="relative w-full aspect-video bg-ink-950 rounded-2xl overflow-hidden border border-ink-100 dark:border-white/10 shadow-subtle">
        <video
          ref={videoRef}
          muted
          playsInline
          className={cx('w-full h-full object-cover', isLive ? 'opacity-100' : 'opacity-0')}
        />
        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

        {!isLive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3 p-6 text-center">
            <span
              className={cx(
                'inline-flex size-14 items-center justify-center rounded-2xl',
                problem ? 'bg-red-500/20 text-red-300' : 'bg-white/10 text-white/80',
              )}
            >
              <span className="material-symbols-outlined text-[28px]">{problem ? problemIcon : 'qr_code_scanner'}</span>
            </span>
            {problem && <h3 className="font-display text-base font-semibold">{problemTitle}</h3>}
            <p className="text-sm text-white/70 max-w-sm">
              {problem
                ? errorMessage
                : "Appuyez sur « Démarrer le scan » et autorisez l'accès à la caméra pour scanner les billets."}
            </p>
            {problem && status !== 'unsupported' && (
              <Button variant="primary" size="sm" icon="refresh" onClick={startScan}>
                Réessayer
              </Button>
            )}
          </div>
        )}

        {isLive && (
          <>
            {/* Viewfinder frame */}
            <div aria-hidden="true" className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-3/5 max-w-[280px] aspect-square">
                <span className="absolute inset-0 rounded-2xl ring-1 ring-white/25" />
                <span className="absolute top-0 left-0 w-9 h-9 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
                <span className="absolute top-0 right-0 w-9 h-9 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
                <span className="absolute bottom-0 left-0 w-9 h-9 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
                <span className="absolute bottom-0 right-0 w-9 h-9 border-b-4 border-r-4 border-primary rounded-br-2xl" />
                <span
                  className="qr-scan-line absolute left-2 right-2 h-0.5 rounded-full bg-primary shadow-[0_0_12px_2px_rgba(19,236,91,0.7)]"
                  style={{ animation: 'qr-scan-line 2.4s ease-in-out infinite' }}
                />
              </div>
            </div>
            <div
              role="status"
              className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur text-white text-[11px] font-semibold flex items-center gap-1.5"
            >
              <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
              {status === 'starting' ? 'Démarrage…' : 'En direct'}
            </div>
          </>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        {!isLive ? (
          <Button variant="primary" icon="videocam" onClick={startScan}>
            Démarrer le scan
          </Button>
        ) : (
          <Button variant="secondary" icon="stop_circle" onClick={stopScan}>
            Arrêter
          </Button>
        )}
        {lastValue && (
          <span className="text-[11px] font-mono text-text-muted truncate max-w-full">
            Dernier code : {lastValue.slice(0, 40)}
            {lastValue.length > 40 ? '…' : ''}
          </span>
        )}
      </div>

      {errorMessage && !isLive && (
        <p role="alert" className="sr-only">{errorMessage}</p>
      )}
    </div>
  );
}
