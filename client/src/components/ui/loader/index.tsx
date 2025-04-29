const Loader = (props: { color?: string }) => {
  const { color = "#000" } = props;
  return (
    <div
      style={{
        width: "1.5rem",
        height: "1.5rem",
        borderTopColor: color,
      }}
      className="h-6 w-6 animate-spin rounded-full border-4 border-gray-200"
    />
  );
};

export default Loader;
