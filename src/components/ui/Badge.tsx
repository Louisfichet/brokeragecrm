interface BadgeProps {
  children: React.ReactNode;
  variant?: "blue" | "green" | "orange" | "red" | "gray";
  size?: "sm" | "md";
}

const variantClasses = {
  blue: "bg-primary-50 text-primary-700 border-primary-200",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  orange: "bg-amber-50 text-amber-700 border-amber-200",
  red: "bg-red-50 text-red-700 border-red-200",
  gray: "bg-navy-50 text-navy-600 border-navy-200",
};

const sizeClasses = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
};

export default function Badge({
  children,
  variant = "blue",
  size = "sm",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      {children}
    </span>
  );
}
