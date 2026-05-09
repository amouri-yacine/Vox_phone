import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

export function DPad({
  onPress,
  disabled,
}: {
  onPress: (dir: "UP" | "DOWN" | "LEFT" | "RIGHT" | "OK") => void;
  disabled?: boolean;
}) {
  const btn =
    "grid place-items-center bg-muted active:bg-primary/30 active:scale-95 transition disabled:opacity-30";
  return (
    <div
      className="grid grid-cols-3 grid-rows-3 gap-2 w-64 h-64 mx-auto"
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <div />
      <button disabled={disabled} className={`${btn} rounded-t-3xl`} onClick={() => onPress("UP")}>
        <ChevronUp className="w-8 h-8" />
      </button>
      <div />
      <button disabled={disabled} className={`${btn} rounded-l-3xl`} onClick={() => onPress("LEFT")}>
        <ChevronLeft className="w-8 h-8" />
      </button>
      <button
        disabled={disabled}
        className="grid place-items-center rounded-2xl active:scale-95 transition font-bold"
        style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}
        onClick={() => onPress("OK")}
      >
        OK
      </button>
      <button disabled={disabled} className={`${btn} rounded-r-3xl`} onClick={() => onPress("RIGHT")}>
        <ChevronRight className="w-8 h-8" />
      </button>
      <div />
      <button disabled={disabled} className={`${btn} rounded-b-3xl`} onClick={() => onPress("DOWN")}>
        <ChevronDown className="w-8 h-8" />
      </button>
      <div />
    </div>
  );
}
