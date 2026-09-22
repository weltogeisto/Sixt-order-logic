import { createFileRoute } from "@tanstack/react-router";
import { App } from "@/components/game/App";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <App />;
}
