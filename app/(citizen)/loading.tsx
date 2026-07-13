export default function CitizenLoading() {
  return (
    <div className="flex-1 p-6 md:p-10 animate-pulse">
      <div className="h-10 w-64 bg-surface-container-high rounded-xl mb-4" />
      <div className="h-4 w-96 max-w-full bg-surface-container-low rounded-lg mb-10" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-72 bg-surface-container-low rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
