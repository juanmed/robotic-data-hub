import { useAuth } from "@/hooks/useAuth";
import PageContainer from "@/layouts/PageContainer";
import SectionHeader from "@/components/SectionHeader";
import GlassCard from "@/components/GlassCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Shield } from "lucide-react";

const SettingsPage = () => {
  const { user } = useAuth();

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <PageContainer>
      <SectionHeader title="Settings" subtitle="Your personal information." />

      <GlassCard hover={false} className="max-w-xl">
        <div className="flex items-center gap-5 mb-6">
          <Avatar className="h-16 w-16 text-lg border-2 border-primary/30">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{user?.name || "—"}</h2>
            <p className="text-sm text-muted-foreground">{user?.email || "—"}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-border/30 bg-background/50 px-4 py-3">
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Name</p>
              <p className="text-sm text-foreground">{user?.name || "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border/30 bg-background/50 px-4 py-3">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Email</p>
              <p className="text-sm text-foreground">{user?.email || "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border/30 bg-background/50 px-4 py-3">
            <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Email Verified</p>
              <p className="text-sm text-foreground">{user?.email_verified ? "Yes" : "No"}</p>
            </div>
          </div>
        </div>
      </GlassCard>
    </PageContainer>
  );
};

export default SettingsPage;
