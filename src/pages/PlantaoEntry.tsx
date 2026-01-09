import PlantaoHome from "./PlantaoHome";

export default function PlantaoEntry() {
  // FORÇA BRUTA: removido lazy import e qualquer intro/splash que dependa de chunks.
  // Isso evita travar em dispositivos com cache antigo/PWA.
  return <PlantaoHome />;
}
