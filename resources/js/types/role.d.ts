export interface Permission {
    id: number;
    name: string;
}

export interface RoleItem {
    id: number;
    name: string;
    permissions: Permission[];
}

export type PermissionGroups = Record<string, Permission[]>;
