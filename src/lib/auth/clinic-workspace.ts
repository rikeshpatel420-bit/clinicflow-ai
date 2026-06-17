import type { User } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppUser, ClinicUser } from "@/types/database";

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

function userDisplayName(user: Pick<User, "email" | "user_metadata">) {
  const metadataName = user.user_metadata?.full_name ?? user.user_metadata?.name;
  return typeof metadataName === "string" && metadataName.trim() ? metadataName.trim() : null;
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

export async function getOrCreateAppUserForAuthUser(
  user: Pick<User, "email" | "id" | "user_metadata">,
): Promise<AppUser | null> {
  const now = new Date().toISOString();
  const email = user.email?.toLowerCase() ?? null;

  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("users")
      .upsert(
        {
          auth_user_id: user.id,
          email,
          full_name: userDisplayName(user),
          last_seen_at: now,
          status: "active",
          updated_at: now,
        },
        { onConflict: "auth_user_id" },
      )
      .select("*")
      .single<AppUser>();

    return data ?? null;
  } catch {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("users")
      .upsert(
        {
          auth_user_id: user.id,
          email,
          full_name: userDisplayName(user),
          last_seen_at: now,
          status: "active",
          updated_at: now,
        },
        { onConflict: "auth_user_id" },
      )
      .select("*")
      .single<AppUser>();

    return data ?? null;
  }
}

export async function getActiveClinicMembershipForUser(
  user: Pick<User, "email" | "id" | "user_metadata">,
): Promise<ClinicUser | null> {
  const appUser = await getOrCreateAppUserForAuthUser(user);

  try {
    const admin = createSupabaseAdminClient();

    let query = admin
      .from("clinic_users")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: true });

    if (appUser?.id) {
      query = query.or(`auth_user_id.eq.${user.id},user_id.eq.${appUser.id}`);
    } else {
      query = query.eq("auth_user_id", user.id);
    }

    const { data: directMembership } = await query.limit(1).maybeSingle<ClinicUser>();

    if (directMembership) {
      if (!directMembership.auth_user_id || !directMembership.user_id) {
        await admin
          .from("clinic_users")
          .update({
            auth_user_id: directMembership.auth_user_id ?? user.id,
            user_id: directMembership.user_id ?? appUser?.id ?? null,
          })
          .eq("id", directMembership.id);
      }

      return {
        ...directMembership,
        auth_user_id: directMembership.auth_user_id ?? user.id,
        user_id: directMembership.user_id ?? appUser?.id ?? null,
      };
    }

    if (user.email && appUser?.id) {
      const { data: invitedMembership } = await admin
        .from("clinic_users")
        .select("*")
        .ilike("invited_email", user.email)
        .in("status", ["active", "invited"])
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle<ClinicUser>();

      if (invitedMembership) {
        const { data: linkedMembership } = await admin
          .from("clinic_users")
          .update({
            auth_user_id: user.id,
            joined_at: invitedMembership.joined_at ?? new Date().toISOString(),
            status: "active",
            user_id: appUser.id,
          })
          .eq("id", invitedMembership.id)
          .select("*")
          .single<ClinicUser>();

        return linkedMembership ?? invitedMembership;
      }
    }
  } catch {
    // Fall back to the authenticated RLS path below.
  }

  const directMembership = await getActiveClinicMembership(user.id);

  if (directMembership) {
    return directMembership;
  }

  if (!appUser?.id) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("clinic_users")
    .select("*")
    .eq("user_id", appUser.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<ClinicUser>();

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
