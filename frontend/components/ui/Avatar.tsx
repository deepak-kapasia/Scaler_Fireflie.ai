import { getInitials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  color?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  xs: "w-5 h-5 text-[9px]",
  sm: "w-7 h-7 text-xs",
  md: "w-8 h-8 text-sm",
  lg: "w-10 h-10 text-base",
};

export default function Avatar({ name, color = "#6366f1", size = "md", className = "" }: AvatarProps) {
  return (
    <div
      className={`${sizeMap[size]} rounded-xl shadow-sm flex items-center justify-center font-bold text-white select-none flex-shrink-0 ${className}`}
      style={{ backgroundColor: color }}
      title={name}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
}
