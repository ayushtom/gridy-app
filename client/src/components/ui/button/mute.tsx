"use client";

import { motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import useGameStore from "../../../store/gameStore";

export default function MuteButton() {
  const { audioEnabled, setAudioEnabled } = useGameStore();
  return (
    <motion.button
      onClick={() => setAudioEnabled(!audioEnabled)}
      className="relative w-14 h-14 bg-green-600 rounded-full flex items-center justify-center overflow-hidden"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        initial={false}
        animate={{ y: !audioEnabled ? 0 : 80 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="absolute inset-0 flex items-center justify-center text-primary-foreground"
      >
        <VolumeX size={24} className="text-white" />
      </motion.div>
      <motion.div
        initial={false}
        animate={{ y: !audioEnabled ? -80 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="absolute inset-0 flex items-center justify-center text-primary-foreground"
      >
        <Volume2 size={24} className="text-white" />
      </motion.div>
    </motion.button>
  );
}
