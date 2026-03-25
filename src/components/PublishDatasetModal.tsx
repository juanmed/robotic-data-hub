import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Store, Loader2, Info } from "lucide-react";
import {
  SUPPORTED_CURRENCIES, LICENSE_OPTIONS, DEFAULT_PLATFORM_FEE_BPS,
  DEFAULT_CURRENCY, formatPrice, calcSellerReceives, getCurrency,
} from "@/lib/marketplace";
import type { CurrencyCode, LicenseValue } from "@/lib/marketplace";

interface PublishDatasetModalProps {
  open: boolean;
  onClose: () => void;
  onPublish: (data: {
    title: string;
    description: string;
    price_amount: number;
    currency: CurrencyCode;
    license: LicenseValue;
    tags: string[];
  }) => Promise<void>;
  datasetName: string;
  /** Pass existing listing data when editing */
  initial?: {
    title: string;
    description: string;
    price_amount: number;
    currency: string;
    license: string;
    tags: string[];
  };
}

const PublishDatasetModal = ({ open, onClose, onPublish, datasetName, initial }: PublishDatasetModalProps) => {
  const [title, setTitle] = useState(initial?.title ?? datasetName);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isFree, setIsFree] = useState(initial ? initial.price_amount === 0 : true);
  const [priceInput, setPriceInput] = useState(() => {
    if (!initial || initial.price_amount === 0) return "";
    const c = getCurrency(initial.currency);
    return c.decimals > 0
      ? (initial.price_amount / Math.pow(10, c.decimals)).toFixed(c.decimals)
      : initial.price_amount.toString();
  });
  const [currency, setCurrency] = useState<CurrencyCode>((initial?.currency as CurrencyCode) ?? DEFAULT_CURRENCY);
  const [license, setLicense] = useState<LicenseValue>((initial?.license as LicenseValue) ?? "CC-BY-4.0");
  const [tagInput, setTagInput] = useState(initial?.tags?.join(", ") ?? "");
  const [submitting, setSubmitting] = useState(false);

  const currencyInfo = getCurrency(currency);
  const priceAmount = isFree
    ? 0
    : Math.round(parseFloat(priceInput || "0") * Math.pow(10, currencyInfo.decimals));
  const sellerReceives = calcSellerReceives(priceAmount, DEFAULT_PLATFORM_FEE_BPS);
  const feePercent = DEFAULT_PLATFORM_FEE_BPS / 100;

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const tags = tagInput.split(",").map((t) => t.trim()).filter(Boolean);
      await onPublish({ title: title.trim(), description: description.trim(), price_amount: priceAmount, currency, license, tags });
      onClose();
    } catch {
      // error handled by parent
    } finally {
      setSubmitting(false);
    }
  };

  const isEditing = !!initial;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg border-border/50 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            {isEditing ? "Edit Listing" : "Publish to Marketplace"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditing
              ? "Update your listing details. Price changes apply to future purchases only."
              : `List "${datasetName}" on the marketplace for others to discover and purchase.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="listing-title" className="text-xs">Title</Label>
            <Input
              id="listing-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Dataset title"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="listing-desc" className="text-xs">Description</Label>
            <Textarea
              id="listing-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your dataset — what's included, quality, use cases..."
              rows={3}
            />
          </div>

          {/* Pricing */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Pricing</Label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">Free</span>
                <Switch checked={isFree} onCheckedChange={setIsFree} />
              </div>
            </div>

            {!isFree && (
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <div className="space-y-1">
                  <Input
                    type="number"
                    min="0"
                    step={currencyInfo.decimals > 0 ? "0.01" : "1"}
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    placeholder="0.00"
                    className="font-mono"
                  />
                </div>
                <Select value={currency} onValueChange={(v) => setCurrency(v as CurrencyCode)}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.symbol} {c.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {!isFree && priceAmount > 0 && (
              <div className="rounded-xl border border-border/40 bg-background/40 p-3 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Buyer pays</span>
                  <span className="text-foreground font-medium">{formatPrice(priceAmount, currency)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Platform fee ({feePercent}%)</span>
                  <span className="text-muted-foreground">−{formatPrice(priceAmount - sellerReceives, currency)}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-border/30">
                  <span className="text-foreground font-semibold">You receive</span>
                  <span className="text-primary font-bold">{formatPrice(sellerReceives, currency)}</span>
                </div>
              </div>
            )}
          </div>

          {/* License */}
          <div className="space-y-1.5">
            <Label className="text-xs">License</Label>
            <Select value={license} onValueChange={(v) => setLicense(v as LicenseValue)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LICENSE_OPTIONS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    <div>
                      <span>{l.label}</span>
                      <span className="ml-2 text-[10px] text-muted-foreground">{l.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label htmlFor="listing-tags" className="text-xs">Tags</Label>
            <Input
              id="listing-tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="robot, manipulation, depth (comma-separated)"
            />
          </div>

          {isEditing && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" />
              Price changes only apply to future purchases — existing buyers keep their original price.
            </p>
          )}

          <Button
            variant="neon"
            className="w-full gap-2"
            onClick={handleSubmit}
            disabled={submitting || !title.trim()}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Store className="h-4 w-4" />
            )}
            {submitting ? "Publishing..." : isEditing ? "Save Changes" : "Publish"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PublishDatasetModal;
