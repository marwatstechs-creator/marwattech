"use client";

import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Row = Record<string, string>;

/**
 * Generic editor for JSON arrays of objects with text fields
 * (e.g. benefits, process steps, FAQs).
 */
export function JsonEditor({
  label,
  fields,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  fields: { key: string; label: string; textarea?: boolean }[];
  value: Row[];
  onChange: (rows: Row[]) => void;
  placeholder?: string;
}) {
  const update = (index: number, key: string, val: string) => {
    const next = value.map((r, i) => (i === index ? { ...r, [key]: val } : r));
    onChange(next);
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const add = () => {
    const row: Row = {};
    for (const f of fields) row[f.key] = "";
    onChange([...value, row]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <AppIcon name="plus" size={14} />
          Add
        </Button>
      </div>

      {value.length === 0 && (
        <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
          {placeholder ?? `No ${label.toLowerCase()} added yet.`}
        </p>
      )}

      {value.map((row, i) => (
        <div key={i} className="space-y-2 rounded-md border bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Item {i + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 text-destructive"
              onClick={() => remove(i)}
              aria-label={`Remove item ${i + 1}`}
            >
              <AppIcon name="delete" size={14} />
            </Button>
          </div>
          {fields.map((f) => (
            <div key={f.key} className="space-y-1">
              <label className="text-xs text-muted-foreground">{f.label}</label>
              {f.textarea ? (
                <Textarea
                  rows={2}
                  value={row[f.key] ?? ""}
                  onChange={(e) => update(i, f.key, e.target.value)}
                />
              ) : (
                <Input
                  value={row[f.key] ?? ""}
                  onChange={(e) => update(i, f.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
