
import { getMissingProfileFields } from "@/lib/profile-completion";
import ProfileCompletionPopup from "./ProfileCompletionPopup";
import { getUserInfo } from "@/service/auth/getUserInfo";

export default async function ProfileCompletionGate() {
  const user = await getUserInfo();
  const missingFields = getMissingProfileFields(user);

  if (missingFields.length === 0) return null;

  return <ProfileCompletionPopup missingFields={missingFields} />;
}