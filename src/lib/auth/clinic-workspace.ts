import type { User } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ClinicUser } from "@/types/database";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function createClinicSlug(clinicName: string) {
  const base = slugify(clinicName) || "clinic";
  return `${base}-${Date.now().toString(36)}`;
}

export async function getActiveClinicMembership(authUserId: string): Promise<ClinicUser | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clinic_users")
    .select("*")
    .eq("auth_user_id", authUserId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<ClinicUser>();

  if (error) {
    return null;
  }

  return data ?? null;
}

export async function createClinicWorkspaceForUser({
  clinicName,
  fullName,
  phone,
  timezone = "Europe/London",
  user,
}: {
  clinicName: string;
  fullName: string;
  phone?: string | null;
  timezone?: string;
  user: Pick<User, "email" | "id" | "user_metadata">;
}) {
  let admin: ReturnType<typeof createSupabaseAdminClient>;

  try {
    admin = createSupabaseAdminClient();
  } catch {
    return { error: "Server-side Supabase service role configuration is missing." };
  }

  const now = new Date().toISOString();

  const { data: appUser, error: userError } = await admin
    .from("users")
    .upsert(
      {
        auth_user_id: user.id,
        email: user.email ?? null,
        full_name: fullName || String(user.user_metadata?.full_name ?? "") || null,
        status: "active",
        updated_at: now,
      },
      { onConflict: "auth_user_id" },
    )
    .select("id")
    .single();

  if (userError || !appUser) {
    return { error: "Could not create the user profile." };
  }

  const { data: clinic, error: clinicError } = await admin
    .from("clinics")
    .insert({
      created_by: user.id,
      name: clinicName,
      phone: phone || null,
      slug: createClinicSlug(clinicName),
      timezone: timezone || "Europe/London",
    })
    .select("id")
    .single();

  if (clinicError || !clinic) {
    return { error: "Could not create the clinic workspace." };
  }

  const { error: membershipError } = await admin.from("clinic_users").insert({
    auth_user_id: user.id,
    clinic_id: clinic.id,
    joined_at: now,
    role: "owner",
    status: "active",
    user_id: appUser.id,
  });

  if (membershipError) {
    return { error: "Could not create the owner membership." };
  }

  return { clinicId: clinic.id, error: null };
}
