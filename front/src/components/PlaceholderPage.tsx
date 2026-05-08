interface PlaceholderPageProps {
  title: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="bg-card border border-border rounded-lg p-8 text-center w-full max-w-sm">
        <h2 className="text-xl font-bold text-foreground mb-2">{title}</h2>
        <p className="text-sm text-muted-foreground">곧 업데이트 예정입니다</p>
      </div>
    </div>
  );
};

export default PlaceholderPage;
