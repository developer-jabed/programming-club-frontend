import LoginForm from "@/components/modules/auth/login";
import LoginIllustration from "@/components/modules/auth/LoginIllustration";

export const dynamic = "force-dynamic";

const LoginPage = async ({
  searchParams,
}: {
  searchParams?: Promise<{ redirect?: string }>;
}) => {
  const params = (await searchParams) || {};

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#060d0c] p-4 sm:p-8">
      {/* dot-grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />

      {/* ambient glows */}
      <div className="pointer-events-none absolute -left-32 -top-32 -z-10 h-[26rem] w-[26rem] rounded-full bg-emerald-500/15 blur-[110px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 -z-10 h-[28rem] w-[28rem] rounded-full bg-amber-400/[0.07] blur-[120px]" />
      <div className="pointer-events-none absolute left-1/3 top-1/2 -z-10 h-64 w-64 -translate-y-1/2 rounded-full bg-teal-400/10 blur-[110px]" />

      {/* floating particles */}
      <div className="pointer-events-none absolute right-24 top-20 h-2 w-2 rounded-full bg-emerald-300/50 animate-float-dot" />
      <div
        className="pointer-events-none absolute bottom-28 left-20 h-1.5 w-1.5 rounded-full bg-amber-300/50 animate-float-dot"
        style={{ animationDelay: "1s" }}
      />

      {/* card */}
      <div className="relative z-10 grid w-full max-w-4xl overflow-hidden rounded-3xl bg-[#0b1714]/80 shadow-2xl shadow-black/60 ring-1 ring-white/10 backdrop-blur-xl lg:grid-cols-2">
        {/* top hairline accent */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent"
        />

        {/* left: brand + illustration */}
        <div className="relative hidden flex-col justify-between border-r border-white/[0.06] bg-gradient-to-br from-emerald-400/[0.09] via-transparent to-amber-400/[0.05] p-10 lg:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-300 to-teal-500 font-mono text-sm font-bold text-[#04110d] shadow-[0_0_24px_-4px_rgba(52,211,153,0.55)]">
              {"</>"}
            </div>
            <div className="leading-tight">
              <p className="font-syne text-sm font-bold tracking-tight text-white">
                DPI Programming Club
              </p>
              <p className="text-[11px] text-amber-300/90">
                Dinajpur Polytechnic Institute
              </p>
            </div>
          </div>

          <LoginIllustration />

          <div className="space-y-2">
            <h2 className="font-syne text-xl font-extrabold leading-snug text-white">
              Learn together.
              <br />
              <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                Build. Ship. Grow.
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              Join sectors, work on real projects, complete tasks and earn
              badges — your whole club journey in one place.
            </p>
          </div>
        </div>

        {/* right: form */}
        <div className="flex flex-col justify-center p-8 sm:p-12">
          {/* mobile brand */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-300 to-teal-500 font-mono text-xs font-bold text-[#04110d]">
              {"</>"}
            </div>
            <div className="leading-tight">
              <p className="font-syne text-sm font-bold text-white">
                DPI Programming Club
              </p>
              <p className="text-[11px] text-amber-300/90">
                Dinajpur Polytechnic Institute
              </p>
            </div>
          </div>

          <div className="mb-8 space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 font-mono text-[11px] font-medium text-emerald-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              members only
            </span>
            <h1 className="font-syne text-2xl font-extrabold tracking-tight text-white">
              Welcome back
            </h1>
            <p className="text-sm text-slate-400">
              Sign in to continue to your club workspace.
            </p>
          </div>

          <LoginForm redirect={params.redirect} />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;