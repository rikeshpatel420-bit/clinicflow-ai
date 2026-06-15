import type { ClinicRole, PermissionKey } from "@/lib/permissions/roles";
import { permissionLabels, rolePermissions } from "@/lib/permissions/roles";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: ClinicRole;
  status: "active" | "invited" | "suspended";
  location: string;
  lastActive: string;
};

export type Invitation = {
  id: string;
  email: string;
  role: ClinicRole;
  expiresIn: string;
  invitedBy: string;
};

export type OnboardingStep = {
  id: string;
  label: string;
  description: string;
  status: "complete" | "current" | "pending";
};

export type ActivityItem = {
  id: string;
  actor: string;
  action: string;
  area: string;
  createdAt: string;
};

export const enterpriseSettingsDemo = {
  account: {
    name: "Rikesh Patel",
    email: "owner@clinicflow-demo.co.uk",
    role: "owner" as ClinicRole,
    securityPosture: "Strong",
  },
  clinic: {
    name: "Harbour Dental Group",
    activeClinic: "Marylebone",
    locations: ["Marylebone", "Canary Wharf", "Richmond"],
    timezone: "Europe/London",
    phone: "+44 20 7946 1020",
    completion: 78,
  },
  onboarding: [
    {
      id: "profile",
      label: "Clinic profile",
      description: "Core group identity, location details, and operating timezone.",
      status: "complete",
    },
    {
      id: "team",
      label: "Invite team",
      description: "Add owners, admins, reception, and clinical staff.",
      status: "current",
    },
    {
      id: "security",
      label: "Secure workspace",
      description: "Review access controls, audit history, and notification defaults.",
      status: "pending",
    },
    {
      id: "automation",
      label: "Prepare automations",
      description: "Connect recovery workflows after auth, Twilio, and approvals are live.",
      status: "pending",
    },
  ] satisfies OnboardingStep[],
  team: [
    {
      id: "tm-1",
      name: "Rikesh Patel",
      email: "owner@clinicflow-demo.co.uk",
      role: "owner",
      status: "active",
      location: "Group",
      lastActive: "Today, 09:15",
    },
    {
      id: "tm-2",
      name: "Maya Shah",
      email: "maya@clinicflow-demo.co.uk",
      role: "admin",
      status: "active",
      location: "Marylebone",
      lastActive: "Today, 08:42",
    },
    {
      id: "tm-3",
      name: "James Carter",
      email: "james@clinicflow-demo.co.uk",
      role: "receptionist",
      status: "active",
      location: "Canary Wharf",
      lastActive: "Yesterday, 17:20",
    },
    {
      id: "tm-4",
      name: "Priya Nair",
      email: "priya@clinicflow-demo.co.uk",
      role: "clinician",
      status: "invited",
      location: "Richmond",
      lastActive: "Pending invite",
    },
  ] satisfies TeamMember[],
  invitations: [
    {
      id: "inv-1",
      email: "ops@clinicflow-demo.co.uk",
      role: "manager",
      expiresIn: "6 days",
      invitedBy: "Rikesh Patel",
    },
  ] satisfies Invitation[],
  notificationPreferences: [
    { label: "High-value missed calls", channel: "Email and in-app", enabled: true },
    { label: "Workflow failures", channel: "In-app", enabled: true },
    { label: "Weekly owner report", channel: "Email", enabled: true },
    { label: "Low-priority patient replies", channel: "In-app digest", enabled: false },
  ],
  security: [
    { label: "Two-factor authentication", value: "Required for owners and admins" },
    { label: "Session timeout", value: "12 hours" },
    { label: "Audit retention", value: "365 days" },
    { label: "Allowed automation mode", value: "Staff approval required" },
  ],
  activity: [
    {
      id: "act-1",
      actor: "Maya Shah",
      action: "updated recovery workflow permissions",
      area: "Team access",
      createdAt: "Today, 09:02",
    },
    {
      id: "act-2",
      actor: "Rikesh Patel",
      action: "invited ops@clinicflow-demo.co.uk",
      area: "Invitations",
      createdAt: "Yesterday, 16:31",
    },
    {
      id: "act-3",
      actor: "System",
      action: "logged security policy review",
      area: "Audit trail",
      createdAt: "Yesterday, 08:14",
    },
  ] satisfies ActivityItem[],
  permissionMatrix: Object.entries(rolePermissions).map(([role, permissions]) => ({
    role: role as ClinicRole,
    permissions: permissions.map((permission) => ({
      key: permission,
      label: permissionLabels[permission as PermissionKey],
    })),
  })),
};

