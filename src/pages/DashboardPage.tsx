import { useEffect, useState } from "react";
import PageContainer from "@/layouts/PageContainer";
import SectionHeader from "@/components/SectionHeader";
import GlassCard from "@/components/GlassCard";
import DatasetListCard from "@/components/DatasetListCard";
import { listDatasets } from "@/services/datasetService";
import type { DatasetListItem } from "@/services/datasetService";
import { Layers, HardDrive, Database, Activity } from "lucide-react";
import { Link } from "react-router-dom";

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const DashboardPage = () => {
  const [datasets, setDatasets] = useState<DatasetListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listDatasets()
      .then(setDatasets)
      .catch((err) => console.error("Dashboard load error:", err))
      .finally(() => setLoading(false));
  }, []);

  const totalSize = datasets.reduce((a, d) => a + d.total_size_bytes, 0);

  const stats = [
    { icon: Database, label: "Datasets", value: datasets.length },
    { icon: Layers, label: "Total Files", value: datasets.reduce((a, d) => a + d.file_count, 0) },
    { icon: HardDrive, label: "Total Data", value: formatBytes(totalSize) },
    { icon: Activity, label: "Downloads", value: 0 },
  ];

  return (
    <PageContainer>
      <SectionHeader title="Dashboard" subtitle="Overview of your robotics data platform." />

      {loading ? (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-muted/20 animate-pulse" />
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-muted/20 animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {stats.map(({ icon: Icon, label, value }) => (
              <GlassCard key={label} hover={false}>
                <Icon className="h-4 w-4 text-primary mb-2" />
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </GlassCard>
            ))}
          </div>

          {/* Datasets */}
          <SectionHeader title="Datasets" className="mb-6" />
          {datasets.length === 0 ? (
            <GlassCard hover={false} className="text-center py-12">
              <Database className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No datasets yet. Upload one using the CLI and an upload key from the{" "}
                <Link to="/keys" className="text-primary hover:underline">Keys</Link> page.
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {datasets.map((ds) => (
                <DatasetListCard key={ds.id} ds={ds} />
              ))}
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
};

export default DashboardPage;
