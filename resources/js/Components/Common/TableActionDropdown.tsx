import { Menu } from "@mantine/core";
import { MoreVertical } from "lucide-react";
import React from "react";
import { Link } from "@inertiajs/react";

export interface TableActionItem {
    label: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    href?: string;
    danger?: boolean;
    disabled?: boolean;
    dividerBefore?: boolean;
}

interface Props {
    actions?: TableActionItem[];
    items?: TableActionItem[];
    triggerSize?: "xs" | "sm" | "md";
    className?: string;
}

export default function TableActionDropdown({
    actions,
    items,
    triggerSize = "sm",
    className = "",
}: Props) {
    const actionList = actions || items || [];
    const sizeClasses = {
        xs: "p-1 rounded-md",
        sm: "p-1.5 rounded-lg",
        md: "p-2 rounded-xl",
    };

    return (
        <Menu shadow="md" width={180} position="bottom-end" transitionProps={{ transition: "pop", duration: 150 }}>
            <Menu.Target>
                <button
                    type="button"
                    className={`inline-flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150 active:scale-95 border border-transparent hover:border-border ${sizeClasses[triggerSize]} ${className}`}
                    title="More actions"
                >
                    <MoreVertical size={16} />
                </button>
            </Menu.Target>

            <Menu.Dropdown className="border border-border bg-card shadow-lg p-1">
                {actionList.map((act, idx) => (
                    <React.Fragment key={idx}>
                        {act.dividerBefore && <Menu.Divider className="my-1 border-border/80" />}
                        {act.href ? (
                            <Menu.Item
                                component={Link}
                                href={act.href}
                                leftSection={act.icon}
                                disabled={act.disabled}
                                color={act.danger ? "red" : undefined}
                                className={`text-xs font-medium rounded-md transition-colors ${
                                    act.danger
                                        ? "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                        : "text-foreground hover:bg-muted"
                                }`}
                            >
                                {act.label}
                            </Menu.Item>
                        ) : (
                            <Menu.Item
                                onClick={act.onClick}
                                leftSection={act.icon}
                                disabled={act.disabled}
                                color={act.danger ? "red" : undefined}
                                className={`text-xs font-medium rounded-md transition-colors ${
                                    act.danger
                                        ? "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                        : "text-foreground hover:bg-muted"
                                }`}
                            >
                                {act.label}
                            </Menu.Item>
                        )}
                    </React.Fragment>
                ))}
            </Menu.Dropdown>
        </Menu>
    );
}
