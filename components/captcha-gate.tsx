"use client";

import { useState, useEffect, useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { Button } from "@/components/ui/button";
import { Shield, Loader2 } from "lucide-react";

interface CaptchaGateProps {
  onVerified: () => void;
  pageName?: string;
}

export function CaptchaGate({ onVerified, pageName = "هذه الصفحة" }: CaptchaGateProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA | null>(null);

  // Check if already verified in this session
  useEffect(() => {
    const verified = sessionStorage.getItem("captcha_verified");
    if (verified === "true") {
      onVerified();
    }
  }, [onVerified]);

  const handleRecaptchaChange = async (token: string | null) => {
    if (!token) {
      setError(null);
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch("/api/captcha/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success) {
        // Store verification in sessionStorage (expires when browser closes)
        sessionStorage.setItem("captcha_verified", "true");
        onVerified();
      } else {
        setError("فشل التحقق. يرجى المحاولة مرة أخرى");
        if (recaptchaRef.current) {
          recaptchaRef.current.reset();
        }
      }
    } catch (err) {
      setError("حدث خطأ أثناء التحقق. يرجى المحاولة مرة أخرى");
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  if (!siteKey) {
    // If no CAPTCHA key is configured, allow access
    useEffect(() => {
      onVerified();
    }, [onVerified]);
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 p-8 bg-card rounded-lg shadow-lg border">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-full">
              <Shield className="h-12 w-12 text-primary" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">التحقق من الأمان</h2>
            <p className="text-sm text-muted-foreground">
              يرجى التحقق من أنك لست روبوت للوصول إلى {pageName}
            </p>
          </div>

          <div className="flex justify-center">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={siteKey}
              onChange={handleRecaptchaChange}
              theme="light"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {isVerifying && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>جاري التحقق...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
