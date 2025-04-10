import { ProjectContainer } from "@/components/ProjectContainer";

export default function Page(props: any) {
  return <ProjectContainer transcriptId={props.params.transcriptId} />;
}
