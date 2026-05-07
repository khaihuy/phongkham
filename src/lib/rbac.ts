import type { Role } from "@prisma/client"

type Permission =
  | "users:manage"
  | "patients:view"
  | "patients:edit"
  | "patients:delete"
  | "appointments:view"
  | "appointments:manage"
  | "medical-records:view"
  | "medical-records:edit"
  | "prescriptions:view"
  | "prescriptions:manage"
  | "pharmacy:view"
  | "pharmacy:manage"
  | "billing:view"
  | "billing:manage"
  | "reports:view"
  | "reports:export"
  | "settings:manage"

const rolePermissions: Record<Role, Permission[]> = {
  ADMIN: [
    "users:manage",
    "patients:view", "patients:edit", "patients:delete",
    "appointments:view", "appointments:manage",
    "medical-records:view", "medical-records:edit",
    "prescriptions:view", "prescriptions:manage",
    "pharmacy:view", "pharmacy:manage",
    "billing:view", "billing:manage",
    "reports:view", "reports:export",
    "settings:manage",
  ],
  DOCTOR: [
    "patients:view", "patients:edit",
    "appointments:view", "appointments:manage",
    "medical-records:view", "medical-records:edit",
    "prescriptions:view", "prescriptions:manage",
    "reports:view",
  ],
  RECEPTIONIST: [
    "patients:view", "patients:edit",
    "appointments:view", "appointments:manage",
    "billing:view", "billing:manage",
  ],
  PHARMACIST: [
    "patients:view",
    "prescriptions:view", "prescriptions:manage",
    "pharmacy:view", "pharmacy:manage",
    "reports:view",
  ],
  ACCOUNTANT: [
    "billing:view", "billing:manage",
    "reports:view", "reports:export",
  ],
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false
}

export function requirePermission(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Permission denied: ${permission}`)
  }
}
