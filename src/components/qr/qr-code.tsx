"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrCode({ value, size = 180 }: { value: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!value) return;

    QRCode.toDataURL(value, { margin: 1, width: size }).then(
      (url: string) => {
        if (cancelled) return;
        setDataUrl(url);
      },
      (e: unknown) => {
        if (cancelled) return;
        setErr(e instanceof Error ? e.message : "Failed to generate QR");
      }
    );

    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (err) {
    return (
      <div className="login-form-error" role="alert">
        {err}
      </div>
    );
  }

  if (!dataUrl) {
    return <div style={{ padding: 12, color: "var(--text-tertiary)" }}>Generating QR…</div>;
  }

  return (
    <div style={{ display: "inline-flex", background: "transparent" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dataUrl} alt="TOTP QR code" width={size} height={size} />
    </div>
  );
}

