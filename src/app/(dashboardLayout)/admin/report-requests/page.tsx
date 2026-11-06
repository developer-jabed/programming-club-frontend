import FeatureAdminClient from "@/components/modules/Features/FeatureAdminClient";
import {
  getFeatureRequests,
  getFeatureUpdates,
} from "@/service/features/features.service";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const REQUEST_KEYS = ["page", "limit", "search", "status", "priority"];
const UPDATE_KEYS = ["page", "limit", "type", "visibility"];

export default async function AdminFeaturesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  const get = (key: string) => {
    const v = sp[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const tab = get("tab") === "updates" ? "updates" : "requests";

  const buildQuery = (keys: string[]) => {
    const qs = new URLSearchParams();
    keys.forEach((k) => {
      const v = get(k);
      if (v) qs.set(k, v);
    });
    return qs.toString();
  };

  // শুধু active tab এর data আনা হচ্ছে
  const requests =
    tab === "requests"
      ? await getFeatureRequests(buildQuery(REQUEST_KEYS))
      : null;

  const updates =
    tab === "updates"
      ? await getFeatureUpdates(buildQuery(UPDATE_KEYS))
      : null;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Feature Management</h1>
        <p className="text-sm text-gray-400">
          Manage feature requests, replies, updates and technical reports.
        </p>
      </div>

      <FeatureAdminClient tab={tab} requests={requests} updates={updates} />
    </div>
  );
}