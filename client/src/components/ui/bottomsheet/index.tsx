import { motion } from "framer-motion";
import { useEffect } from "react";

export default function BottomSheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    // listen for escape key
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, []);
  return (
    <motion.div
      style={{
        pointerEvents: open ? "auto" : "none",
      }}
      className=" fixed h-screen w-screen flex justify-center items-center bg-black bg-opacity-10 shadow-lg z-20"
      onClick={onClose}
      background-color="rgba(0,0,0,0.3)"
      initial={{ opacity: 0 }}
      animate={{ opacity: open ? 1 : 0 }}
    >
      <motion.div
        className="bg-white w-auto p-2 py-3 h-auto absolute bottom-2 rounded-3xl"
        initial={{
          y: innerHeight / 2,
        }}
        animate={{
          y: open ? 0 : innerHeight / 2,
        }}
        transition={{
          type: "spring",
          stiffness: 210,
          damping: 22,
        }}
        exit={{
          y: innerHeight / 2,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
