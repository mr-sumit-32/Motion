interface PagePlaceholderProps {
  title: string;
}

export default function PagePlaceholder({ title }: PagePlaceholderProps) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-bold tracking-tight mb-6">{title}</h1>
      <div className="border border-dashed border-border rounded-lg h-96 flex flex-col items-center justify-center text-muted-foreground bg-muted/10">
        <p className="mb-2 text-lg">This is the {title} page.</p>
        <p className="text-sm">Content and features will be implemented here.</p>
      </div>
    </div>
  );
}