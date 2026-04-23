import { Check } from "lucide-react";

interface Props {
  options: string[] | { value: string; label: string }[];
  value: string[];
  onChange: (next: string[]) => void;
  multi?: boolean;
  size?: "sm" | "md";
}

const ChipSelect = ({ options, value, onChange, multi = true, size = "md" }: Props) => {
  const items = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));

  function toggle(v: string) {
    if (!multi) return onChange(value[0] === v ? [] : [v]);
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  }

  const padding = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm";

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it) => {
        const selected = value.includes(it.value);
        return (
          <button
            key={it.value}
            type="button"
            onClick={() => toggle(it.value)}
            className={`inline-flex items-center gap-1 rounded-full border ${padding} transition-all ${
              selected
                ? "border-primary bg-primary text-primary-foreground shadow-soft"
                : "border-border bg-card hover:border-primary/40 text-foreground"
            }`}
          >
            {selected && <Check className="h-3 w-3" />}
            <span className="capitalize">{it.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ChipSelect;
