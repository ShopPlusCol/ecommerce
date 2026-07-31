import { AdminMediaUrlField } from "@/components/admin/admin-media-url-field";

export function MediaSettingField({ name, label, value, assets }: { name: string; label: string; value: string | null; assets: Array<{ url: string; label: string }> }) {
  return <AdminMediaUrlField name={name} label={label} value={value ?? ""} assets={assets} />;
}
