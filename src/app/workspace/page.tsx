import { WorkspacePageView } from "@/features/workspace/workspace-page-view";
import { getWorkspaceDemoClients } from "@/features/workspace/workspace-demo-data";

export default async function WorkspacePage() {
  const clients = await getWorkspaceDemoClients();
  return <WorkspacePageView clients={clients} />;
}
