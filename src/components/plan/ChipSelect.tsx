import { Check } from "lucide-react";

interface Props {
  options: string[] | { value: string; label: string }[];
  value: string[];
  onChange: (next: string[]) => void;
  multi?: boolean;
  size?: "sm" | "md";
}

// Auto-prefix emojis for known tokens (only used when label === value, i.e. raw strings)
const emojiMap: Record<string, string> = {
  // vibes
  cozy: "🛋️", lively: "🎉", intimate: "🕯️", outdoors: "🌿", rooftop: "🏙️",
  fancy: "💎", casual: "👕", indoor: "🏠", active: "🏃", celebratory: "🥂",
  elegant: "🥀", fun: "🎈", serene: "🪷", reflective: "🌌", spiritual: "🛕",
  // cuisines
  Italian: "🍝", Asian: "🥡", Indian: "🍛", Continental: "🍽️", Japanese: "🍣",
  Mexican: "🌮", Cafe: "☕", "Street food": "🌯", Mediterranean: "🥙",
  Korean: "🍜", Thai: "🍤", Bakery: "🥐",
  // dietary
  Vegetarian: "🥗", Vegan: "🌱", "Gluten-free": "🌾", Halal: "🌙",
  Jain: "🪷", Pescatarian: "🐟",
  // occasions
  "First date": "🌸", Anniversary: "💍", Birthday: "🎂",
  "Just because": "💫", Reunion: "🤗", Proposal: "💍",
};

const ChipSelect = ({ options, value, onChange, multi = true, size = "md" }: Props) => {
  const items = options.map((o) => (typeof o === "string" ? { value: o, label: o, autoEmoji: emojiMap[o] } : { ...o, autoEmoji: undefined as string | undefined }));

  function toggle(v: string) {
    if (!multi) return onChange(value[0] === v ? [] : [v]);
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  }

  const padding = size === "sm" ? "px-3 py-1 text-xs" : "px-3.5 py-1.5 text-sm";

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it) => {
        const selected = value.includes(it.value);
        return (
          <button
            key={it.value}
            type="button"
            onClick={() => toggle(it.value)}
            className={`inline-flex items-center gap-1.5 rounded-full border ${padding} font-medium transition-all active:scale-95 ${
              selected
                ? "border-transparent bg-gradient-rose text-primary-foreground shadow-soft"
                : "border-border bg-card hover:border-primary/40 hover:bg-primary-soft/40 text-foreground"
            }`}
          >
            {selected ? (
              <Check className="h-3 w-3" />
            ) : it.autoEmoji ? (
              <span className="text-sm leading-none">{it.autoEmoji}</span>
            ) : null}
            <span className="capitalize">{it.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ChipSelect;
