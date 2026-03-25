import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PageContainer from "@/layouts/PageContainer";
import SectionHeader from "@/components/SectionHeader";
import GlassCard from "@/components/GlassCard";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Mail, Shield, Camera, Check, X } from "lucide-react";

const SettingsPage = () => {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || "");
  const [isSavingName, setIsSavingName] = useState(false);

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // Upload to avatars/{user_id}/avatar.{ext}
      const ext = file.name.split(".").pop();
      const path = `${user?.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      // Update profiles table
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user?.id);

      if (updateError) throw updateError;

      // Refresh user state
      await refreshUser();
      toast.success("Avatar updated successfully");
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSaveName = async () => {
    if (!editedName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    if (editedName === user?.name) {
      setIsEditingName(false);
      return;
    }

    setIsSavingName(true);
    try {
      // Update profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ name: editedName })
        .eq("id", user?.id);

      if (profileError) throw profileError;

      // Update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { name: editedName },
      });

      if (authError) throw authError;

      // Refresh user state
      await refreshUser();
      setIsEditingName(false);
      toast.success("Name updated successfully");
    } catch (error) {
      console.error("Name update error:", error);
      toast.error("Failed to update name");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedName(user?.name || "");
    setIsEditingName(false);
  };

  return (
    <PageContainer>
      <SectionHeader title="Settings" subtitle="Manage your account." />

      <Tabs defaultValue="information" className="w-full max-w-2xl">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="information">Information</TabsTrigger>
          <TabsTrigger value="payment">Payment Information</TabsTrigger>
        </TabsList>

        <TabsContent value="information">
          <GlassCard hover={false}>
            {/* Avatar Section */}
            <div className="mb-8">
              <div className="relative inline-block">
                <Avatar className="h-20 w-20 border-2 border-primary/30">
                  {user?.avatar_url && (
                    <AvatarImage src={user.avatar_url} alt={user?.name} />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  title="Upload avatar"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground mt-2">Max 2MB, JPG/PNG</p>
            </div>

            {/* Name Section */}
            <div className="mb-6 pb-6 border-b border-border/30">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                Name
              </p>
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="flex-1 bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="default"
                    onClick={handleSaveName}
                    disabled={isSavingName}
                    className="gap-1"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancelEdit}
                    disabled={isSavingName}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-foreground">{user?.name || "—"}</p>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            {/* Email Section */}
            <div className="mb-6 pb-6 border-b border-border/30">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Email
                  </p>
                  <p className="text-sm text-foreground">{user?.email || "—"}</p>
                </div>
              </div>
            </div>

            {/* Email Verified Section */}
            <div>
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Email Verified
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        user?.email_verified
                          ? "text-green-500"
                          : "text-yellow-500"
                      }`}
                    >
                      {user?.email_verified ? "Yes" : "No"}
                    </span>
                    {!user?.email_verified && (
                      <span className="text-xs text-muted-foreground">
                        Check your inbox for verification link
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="payment">
          <GlassCard hover={false}>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground text-sm">
                Payment information coming soon.
              </p>
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default SettingsPage;
