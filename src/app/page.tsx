import { LandingHero } from "@/components/landing/landing-hero";

type SearchParams = Promise<{ auth_error?: string }>;

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  return <LandingHero authError={params.auth_error === "1"} />;
}
