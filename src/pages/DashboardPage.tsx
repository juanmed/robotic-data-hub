import { useEffect, useState } from "react";
import PageContainer from "@/layouts/PageContainer";
import SectionHeader from "@/components/SectionHeader";
import GlassCard from "@/components/GlassCard";
import { sessionService } from "@/services/sessionService";
import { listingService } from "@/services/listingService";
import type { Session, Listing } from "@/types";
import { Layers, ShoppingBag, HardDrive, Activity } from "lucide-react";

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const DashboardPage = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([sessionService.list(), listingService.list()]).then(([s, l]) => {
      setSessions(s);
      setListings(l);
      setLoading(false);
    });
  }, []);

  const totalSize = sessions.reduce((a, s) => a + s.total_size_bytes, 0);
  const totalDownloads = listings.reduce((a, l) => a + l.download_count, 0);

  const stats = [
    { icon: Layers, label: "Sessions", value: sessions.length },
    { icon: HardDrive, label: "Total Data", value: formatBytes(totalSize) },
    { icon: ShoppingBag, label: "Listings", value: listings.length },
    { icon: Activity, label: "Downloads", value: totalDownloads },
  ];

  return (
    <PageContainer>
      <SectionHeader title="Dashboard" subtitle="Overview of your robotics data platform." />

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted/20 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {stats.map(({ icon: Icon, label, value }) => (
              <GlassCard key={label} hover={false}>
                <Icon className="h-4 w-4 text-primary mb-2" />
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </GlassCard>
            ))}
          </div>

          <SectionHeader title="Recent Sessions" />
          <div className="grid gap-3">
            {sessions.slice(0, 3).map((session) => (
              <GlassCard key={session.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{session.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{session.description}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{session.stream_count} streams</span>
                  <span>{formatBytes(session.total_size_bytes)}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    session.status === "completed" ? "bg-primary/10 text-primary" :
                    session.status === "recording" ? "bg-secondary/10 text-secondary" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {session.status}
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>
        </>
      )}
    </PageContainer>
  );
};

export default DashboardPage;
