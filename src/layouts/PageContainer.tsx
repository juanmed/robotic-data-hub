import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

const PageContainer = ({ children, className = "" }: PageContainerProps) => {
  return (
    <main className={`min-h-screen pt-20 pb-16 bg-background ${className}`}>
      <div className="container mx-auto px-6">{children}</div>
    </main>
  );
};

export default PageContainer;
