import { CompareFlow } from "@/components/compare-flow";

export const metadata = {
  title: "Compare · design.md/extractor",
  description:
    "Two design systems, side by side. Diff colours by perceptual distance, type roles by name, spacing by px.",
};

export default function ComparePage() {
  return <CompareFlow />;
}
