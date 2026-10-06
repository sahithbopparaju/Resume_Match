import { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowRight, Mail, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";

import { requestOtp, verifyOtp } from "../services/api";

const RESEND_COOLDOWN_SECONDS = 60;

function Login({ onAuthenticated }) {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setCooldown((previous) => {
        if (previous <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);
  };

  const handleSendCode = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }

    setSending(true);

    try {
      await requestOtp(email.trim());
      setStep("otp");
      startCooldown();
    } catch (err) {
      setError(err?.message || "Unable to send the verification code.");
    } finally {
      setSending(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || sending) return;

    setError("");
    setSending(true);

    try {
      await requestOtp(email.trim());
      startCooldown();
    } catch (err) {
      setError(err?.message || "Unable to resend the verification code.");
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    setError("");

    if (code.trim().length !== 8) {
      setError("Enter the 8-digit code from your email.");
      return;
    }

    setVerifying(true);

    try {
      const user = await verifyOtp(email.trim(), code.trim());
      onAuthenticated(user);
    } catch (err) {
      setError(err?.message || "Unable to verify that code.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 shadow-sm dark:bg-white">
            <Sparkles className="h-5 w-5 text-white dark:text-slate-950" />
          </div>

          <span className="mt-3 text-lg font-bold tracking-tight text-slate-950 dark:text-white">
            Resume<span className="text-slate-500 dark:text-slate-400">Match</span>
          </span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          {step === "email" ? (
            <>
              <h1 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
                Sign in
              </h1>

              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                Enter your email and we'll send you a one-time verification code.
              </p>

              <form onSubmit={handleSendCode} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Email address
                  </label>

                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 focus-within:border-slate-400 dark:border-slate-700 dark:bg-slate-800">
                    <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      autoFocus
                      className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                  {sending ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  {sending ? "Sending code..." : "Send verification code"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
                Enter verification code
              </h1>

              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                We sent an 8-digit code to <span className="font-semibold text-slate-700 dark:text-slate-200">{email}</span>.
                It expires in 5 minutes.
              </p>

              <form onSubmit={handleVerify} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Verification code
                  </label>

                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 focus-within:border-slate-400 dark:border-slate-700 dark:bg-slate-800">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-slate-400" />
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="one-time-code"
                      maxLength={8}
                      value={code}
                      onChange={(event) =>
                        setCode(event.target.value.replace(/\D/g, "").slice(0, 8))
                      }
                      placeholder="00000000"
                      autoFocus
                      className="w-full bg-transparent text-center text-lg font-semibold tracking-[0.4em] text-slate-900 outline-none placeholder:text-slate-300 dark:text-white"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={verifying}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                  {verifying ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  {verifying ? "Verifying..." : "Verify and sign in"}
                </button>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setCode("");
                      setError("");
                    }}
                    className="font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    Use a different email
                  </button>

                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={cooldown > 0 || sending}
                    className="font-semibold text-slate-500 hover:text-slate-900 disabled:opacity-50 disabled:hover:text-slate-500 dark:text-slate-400 dark:hover:text-white"
                  >
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
