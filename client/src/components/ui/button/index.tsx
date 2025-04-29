import { motion } from "framer-motion";

interface IButtonProps {
  text: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "tertiary";
  disabled?: boolean;
  loading?: boolean;
  size?: "sm" | "md" | "lg";
  wiggle?: boolean;
}

const pulseVariants = {
  initial: { scale: 1, opacity: 0 },
  animate: {
    scale: 1.5,
    opacity: [0.5, 0.1, 0],
    transition: {
      duration: 1,
      repeat: Infinity,
      repeatDelay: 1,
    },
  },
};

const ButtonLoader = (props: { size: "sm" | "md" | "lg" }) => {
  const { size } = props;
  return (
    <div
      style={{
        width: size === "sm" ? "1rem" : size === "md" ? "1.5rem" : "2rem",
        height: size === "sm" ? "1rem" : size === "md" ? "1.5rem" : "2rem",
      }}
      className="h-6 w-6 animate-spin rounded-full border-4 border-gray-200 border-t-[#59b56e]"
    />
  );
};

export default function Button(props: IButtonProps) {
  const {
    text,
    onClick,
    variant = "primary",
    loading = false,
    disabled = false,
    size = "md",
    wiggle = false,
  } = props;

  return (
    <div className=" relative w-full">
      {wiggle ? (
        <>
          {[...Array(3)].map((_, index) => (
            <motion.div
              key={index}
              className="absolute inset-0 rounded-3xl bg-green-600"
              variants={pulseVariants}
              initial="initial"
              animate="animate"
              transition={{
                delay: index * 0.6, // Stagger the animations
              }}
            />
          ))}
        </>
      ) : null}
      <motion.button
        className=" relative flex justify-center z-20 px-12 py-2 rounded-3xl font-semibold shadow-sm border-1 w-full"
        style={{
          background: disabled
            ? "#f8fafc"
            : variant === "primary"
            ? "#16a34a"
            : variant === "secondary"
            ? "#F7F8F9"
            : "#000",
          cursor: loading || disabled ? "not-allowed" : "pointer",
          fontSize:
            size === "sm" ? "0.75rem" : size === "md" ? "1rem" : "1.25rem",
        }}
        initial={{
          scale: 1,
          boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
        }}
        onClick={onClick}
        whileTap={{ scale: 0.93 }}
      >
        {loading ? (
          <ButtonLoader size={size} />
        ) : (
          <motion.span
            id={text}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            style={{
              color: disabled
                ? "#9ca3af"
                : variant === "primary" || variant === "tertiary"
                ? "#fff"
                : "#000",
            }}
            className="text-md font-bold "
          >
            {text}
          </motion.span>
        )}
      </motion.button>
    </div>
  );
}
