import { motion } from "framer-motion";

interface TabProps {
  text: string;
  selected: boolean;
  setSelected: (text: string) => void;
}

const Tab = ({ text, selected, setSelected }: TabProps) => {
  return (
    <button
      onClick={() => setSelected(text)}
      className={`${
        selected ? "text-white" : "text-gray-500 hover:text-gray-900"
      } relative rounded-3xl px-4 py-2 text-sm font-medium transition-colors`}
    >
      <span className="relative z-10 text-md">{text}</span>
      {selected && (
        <motion.span
          layoutId="tab"
          transition={{ type: "spring", duration: 0.4 }}
          className="absolute inset-0 z-0 rounded-3xl bg-green-600"
        ></motion.span>
      )}
    </button>
  );
};

const ButtonShapeTabs = (props: {
  tabs: string[];
  selected: string;
  setSelected: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const { tabs, selected, setSelected } = props;
  return (
    <div className="flex w-auto justify-center">
      <div className="flex flex-wrap items-center sm:gap-2 gap-0 border-[1px] rounded-3xl p-1 mx-1">
        {tabs.map((tab) => (
          <Tab
            text={tab}
            selected={selected === tab}
            setSelected={setSelected}
            key={tab}
          />
        ))}
      </div>
    </div>
  );
};

export default ButtonShapeTabs;
