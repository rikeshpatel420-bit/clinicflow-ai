import { NextResponse, type NextRequest } from "next/server";
import { logAuthCallback } from "@/lib/auth/diagnostics";
import { exchangeAuthCode } from "@/lib/auth/flows";
import { setPasswordRecoveryContext } from "@/lib/auth/recovery-context";
import { safeNextPath } from "@/lib/auth/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function noStoreRedirect(request: NextRequest, pathname: string) {
  const response = NextResponse.redirect(new URL(pathname, request.url));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const requestedNext = safeNextPath(request.nextUrl.searchParams.get("next"), "/dashboard");
  const isRecovery = request.nextUrl.searchParams.get("type") === "recovery" || requestedNext === "/update-password";
  const nextPath = isRecovery ? "/update-password" : requestedNext;
  const supabase = await createSupabaseServerClient();
  const exchange = await exchangeAuthCode(supabase, code);

  if (!exchange.userId) {
    logAuthCallback({ errorCode: exchange.errorCode, nextPath, success: false });
    return noStoreRedirect(
      request,
      "/forgot-password?error=This+password-reset+link+is+invalid+or+has+expired.+Request+a+new+link.",
    );
  }

  try {
    if (isRecovery) {
      await setPasswordRecoveryContext(exchange.userId);
    }
  } catch {
    logAuthCallback({ errorCode: "recovery_context_unavailable", nextPath, success: false });
    await supabase.auth.signOut();
    return noStoreRedirect(
      request,
      "/forgot-password?error=Password+recovery+is+temporarily+unavailable.+Please+try+again+shortly.",
    );
  }

  logAuthCallback({ errorCode: null, nextPath, success: true });
  return noStoreRedirect(request, nextPath);
}
