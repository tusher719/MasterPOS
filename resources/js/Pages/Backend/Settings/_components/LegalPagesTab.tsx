import { router } from "@inertiajs/react";
import { Link, RichTextEditor } from "@mantine/tiptap";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import SubScript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
    ExternalLink,
    Eye,
    EyeOff,
    FileText,
    Loader2,
    Save,
    ShieldCheck,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LegalPage {
    id: number;
    type: "privacy_policy" | "terms_conditions";
    type_label: string;
    slug: string;
    title: string;
    content: string | null;
    is_visible: boolean;
    updated_by: string | null;
    updated_at: string | null;
}

// ---------------------------------------------------------------------------
// Color palette — matches project brand colors
// ---------------------------------------------------------------------------

const COLOR_PALETTE = [
    "#1e293b",
    "#475569",
    "#94a3b8",
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#14b8a6",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#ffffff",
];

// ---------------------------------------------------------------------------
// PageEditor
// ---------------------------------------------------------------------------

function PageEditor({ page, canEdit }: { page: LegalPage; canEdit: boolean }) {
    const [title, setTitle] = useState(page.title);
    const [isVisible, setIsVisible] = useState(page.is_visible);
    const [saving, setSaving] = useState(false);
    const [togglingVisibility, setTogglingVisibility] = useState(false);
    const [unsaved, setUnsaved] = useState(false);

    const originalTitle = useRef(page.title);
    const originalContent = useRef(page.content ?? "");

    const editor = useEditor({
        // Required for toolbar active states to update correctly
        shouldRerenderOnTransaction: true,
        extensions: [
            // link: false prevents duplicate Link extension with @mantine/tiptap's Link
            StarterKit.configure({ link: false }),
            Link,
            Superscript,
            SubScript,
            Highlight,
            TextAlign.configure({ types: ["heading", "paragraph"] }),
            // Color picker extensions
            TextStyle,
            Color,
        ],
        content: page.content ?? "",
        editable: canEdit,
        onUpdate: () => {
            setUnsaved(true);
        },
    });

    // Sync content when page data changes (e.g. after fetch completes)
    useEffect(() => {
        if (editor && page.content !== originalContent.current) {
            editor.commands.setContent(page.content ?? "");
            originalContent.current = page.content ?? "";
        }
        setTitle(page.title);
        setIsVisible(page.is_visible);
        setUnsaved(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page.id]);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
        setUnsaved(e.target.value !== originalTitle.current);
    };

    const handleSave = () => {
        if (!canEdit) return;
        setSaving(true);
        router.put(
            route("backend.legal-pages.update", { legalPage: page.id }),
            {
                title,
                content: editor?.getHTML() ?? "",
                is_visible: isVisible,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`${page.type_label} saved successfully.`);
                    originalTitle.current = title;
                    originalContent.current = editor?.getHTML() ?? "";
                    setUnsaved(false);
                },
                onError: (errs) => {
                    const first = Object.values(errs)[0];
                    if (first) toast.error(first as string);
                },
                onFinish: () => setSaving(false),
            },
        );
    };

    const handleToggleVisibility = () => {
        if (!canEdit) return;
        setTogglingVisibility(true);
        router.patch(
            route("backend.legal-pages.toggle-visibility", {
                legalPage: page.id,
            }),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    const next = !isVisible;
                    setIsVisible(next);
                    toast.success(
                        `${page.type_label} is now ${next ? "visible" : "hidden"}.`,
                    );
                },
                onError: () => toast.error("Failed to toggle visibility."),
                onFinish: () => setTogglingVisibility(false),
            },
        );
    };

    const Icon = page.type === "privacy_policy" ? ShieldCheck : FileText;

    const publicUrl =
        page.type === "privacy_policy"
            ? route("legal.privacy-policy")
            : route("legal.terms-conditions");

    return (
        <div className="rounded-lg border border-border bg-card">
            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-foreground">
                        {page.type_label}
                    </h3>
                    {isVisible ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            <Eye className="h-3 w-3" />
                            Public
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                            <EyeOff className="h-3 w-3" />
                            Hidden
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {isVisible && (
                        <a
                            href={publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-indigo-600 hover:bg-muted"
                        >
                            <ExternalLink className="h-3 w-3" />
                            View public
                        </a>
                    )}
                    {canEdit && (
                        <button
                            onClick={handleToggleVisibility}
                            disabled={togglingVisibility}
                            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
                                isVisible
                                    ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                    : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                            }`}
                        >
                            {togglingVisibility ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : isVisible ? (
                                <EyeOff className="h-3 w-3" />
                            ) : (
                                <Eye className="h-3 w-3" />
                            )}
                            {isVisible ? "Hide page" : "Make public"}
                        </button>
                    )}
                </div>
            </div>

            {/* ── Body ───────────────────────────────────────────────────── */}
            <div className="space-y-4 p-5">
                {/* Unsaved changes banner */}
                {unsaved && canEdit && (
                    <div className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
                        <span>You have unsaved changes.</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setTitle(originalTitle.current);
                                    editor?.commands.setContent(
                                        originalContent.current,
                                    );
                                    setUnsaved(false);
                                }}
                                className="rounded px-2 py-0.5 text-xs font-medium hover:bg-amber-100"
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="rounded bg-amber-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-60"
                            >
                                Save now
                            </button>
                        </div>
                    </div>
                )}

                {/* Page title */}
                <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Page Title
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={handleTitleChange}
                        disabled={!canEdit}
                        maxLength={255}
                        className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
                        placeholder="e.g. Privacy Policy"
                    />
                </div>

                {/* Rich text editor */}
                <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Content
                    </label>
                    <div className="overflow-hidden rounded-md border border-border">
                        <RichTextEditor editor={editor}>
                            {canEdit && (
                                <RichTextEditor.Toolbar>
                                    {/* Text formatting */}
                                    <RichTextEditor.ControlsGroup>
                                        <RichTextEditor.Bold />
                                        <RichTextEditor.Italic />
                                        <RichTextEditor.Underline />
                                        <RichTextEditor.Strikethrough />
                                        <RichTextEditor.ClearFormatting />
                                        <RichTextEditor.Highlight />
                                    </RichTextEditor.ControlsGroup>

                                    {/* Color picker */}
                                    <RichTextEditor.ControlsGroup>
                                        <RichTextEditor.ColorPicker
                                            colors={COLOR_PALETTE}
                                        />
                                        <RichTextEditor.UnsetColor />
                                    </RichTextEditor.ControlsGroup>

                                    {/* Headings */}
                                    <RichTextEditor.ControlsGroup>
                                        <RichTextEditor.H1 />
                                        <RichTextEditor.H2 />
                                        <RichTextEditor.H3 />
                                        <RichTextEditor.H4 />
                                    </RichTextEditor.ControlsGroup>

                                    {/* Lists + scripts */}
                                    <RichTextEditor.ControlsGroup>
                                        <RichTextEditor.BulletList />
                                        <RichTextEditor.OrderedList />
                                        <RichTextEditor.Subscript />
                                        <RichTextEditor.Superscript />
                                    </RichTextEditor.ControlsGroup>

                                    {/* Link */}
                                    <RichTextEditor.ControlsGroup>
                                        <RichTextEditor.Link />
                                        <RichTextEditor.Unlink />
                                    </RichTextEditor.ControlsGroup>

                                    {/* Text align */}
                                    <RichTextEditor.ControlsGroup>
                                        <RichTextEditor.AlignLeft />
                                        <RichTextEditor.AlignCenter />
                                        <RichTextEditor.AlignRight />
                                        <RichTextEditor.AlignJustify />
                                    </RichTextEditor.ControlsGroup>

                                    {/* History */}
                                    <RichTextEditor.ControlsGroup>
                                        <RichTextEditor.Undo />
                                        <RichTextEditor.Redo />
                                    </RichTextEditor.ControlsGroup>
                                </RichTextEditor.Toolbar>
                            )}
                            <RichTextEditor.Content />
                        </RichTextEditor>
                    </div>
                    {!canEdit && (
                        <p className="mt-1 text-xs text-muted-foreground">
                            You have view-only access. Contact an Admin to edit
                            this page.
                        </p>
                    )}
                </div>

                {/* Last updated meta */}
                {(page.updated_by || page.updated_at) && (
                    <p className="text-xs text-muted-foreground">
                        Last updated
                        {page.updated_by ? ` by ${page.updated_by}` : ""}
                        {page.updated_at ? ` — ${page.updated_at}` : ""}
                    </p>
                )}
            </div>

            {/* ── Footer ─────────────────────────────────────────────────── */}
            {canEdit && (
                <div className="flex justify-end border-t border-border px-5 py-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Save {page.type_label}
                    </button>
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main tab
// ---------------------------------------------------------------------------

interface Props {
    can: {
        edit: boolean;
    };
}

export default function LegalPagesTab({ can }: Props) {
    const [pages, setPages] = useState<LegalPage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        fetch(route("backend.legal-pages.index"))
            .then((res) => {
                if (!res.ok) throw new Error("Failed to load legal pages.");
                return res.json();
            })
            .then((data: LegalPage[]) => {
                setPages(data);
                setLoading(false);
            })
            .catch((err: Error) => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="ml-2 text-sm">Loading pages…</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-sm font-semibold text-foreground">
                    Privacy & Terms
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                    Manage your public Privacy Policy and Terms &amp; Conditions
                    pages. Toggle visibility to publish or hide each page.
                </p>
            </div>

            {pages.map((page) => (
                <PageEditor
                    key={`${page.id}-${page.content?.length ?? 0}`}
                    page={page}
                    canEdit={can.edit}
                />
            ))}
        </div>
    );
}
