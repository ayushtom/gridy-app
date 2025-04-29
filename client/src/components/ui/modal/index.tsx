import { useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function Modal({
  children,
  onClose,
  open,
}: {
  children: React.ReactNode;
  onClose: () => void;
  open: boolean;
}) {
  useEffect(() => {
    // listen for esc key
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  const onBackgroundClick = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <AnimatePresence mode="wait">
      {open && (
        <div className="fixed inset-0 flex justify-center items-center z-20">
          <motion.div
            onClick={onBackgroundClick}
            style={{
              pointerEvents: open ? "auto" : "none",
            }}
            className="absolute inset-0 h-screen w-screen flex justify-center items-center bg-black bg-opacity-10 "
            background-color="rgba(0,0,0,0.3)"
            initial={{ opacity: 0 }}
            animate={{ opacity: open ? 1 : 0 }}
          ></motion.div>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              transition: { ease: "easeInOut", duration: 0.2 },
            }}
            exit={{
              scale: 0.75,
              opacity: 0,
              transition: { ease: "easeInOut", duration: 0.1 },
            }}
            className="fixed w-full h-full flex justify-center items-center"
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
