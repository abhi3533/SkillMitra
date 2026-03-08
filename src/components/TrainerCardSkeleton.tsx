const TrainerCardSkeleton = ({ variant = "default" }: { variant?: "default" | "browse" }) => {
  const isDefault = variant === "default";
  return (
    <div className={`bg-background ${isDefault ? "rounded-2xl" : "rounded-xl"} border border-border overflow-hidden animate-pulse`}>
      <div className={isDefault ? "p-5" : "p-5"}>
        <div className="flex items-start gap-3">
          <div className={`${isDefault ? "w-14 h-14 rounded-2xl" : "w-12 h-12 rounded-xl"} bg-muted flex-shrink-0`} />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </div>
        {isDefault && <div className="h-3 bg-muted rounded w-2/5 mt-2" />}
        <div className="flex gap-1.5 mt-3">
          <div className="h-5 bg-muted rounded-full w-16" />
          <div className="h-5 bg-muted rounded-full w-14" />
          <div className="h-5 bg-muted rounded-full w-20" />
        </div>
        {!isDefault && <div className="h-3 bg-muted rounded w-2/5 mt-3" />}
      </div>
      <div className={`px-5 py-3 border-t border-border ${isDefault ? "" : "bg-secondary/30"} flex items-center justify-between`}>
        <div className="h-4 bg-muted rounded w-12" />
        <div className="h-4 bg-muted rounded w-16" />
      </div>
      {isDefault && (
        <div className="px-5 pb-4">
          <div className="h-8 bg-muted rounded-lg w-full" />
        </div>
      )}
    </div>
  );
};

export default TrainerCardSkeleton;
