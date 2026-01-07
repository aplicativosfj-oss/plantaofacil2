import { supabase } from '@/integrations/supabase/client';

interface FreightSettings {
  fuel_price: number;
  platform_fee_percentage: number;
  platform_fee_fixed: number;
  min_distance_km: number;
  helper_rate_per_hour: number;
  urgent_multiplier: number;
}

interface FreightEstimateParams {
  distanceKm: number;
  vehicleFuelConsumption?: number; // km/L
  vehicleBaseRatePerKm?: number;
  vehicleMinRate?: number;
  helpersCount?: number;
  estimatedHours?: number;
  isUrgent?: boolean;
}

interface FreightEstimateResult {
  fuelCost: number;
  vehicleRate: number;
  helpersCost: number;
  platformFee: number;
  subtotal: number;
  urgentFee: number;
  totalEstimate: number;
  breakdown: {
    label: string;
    value: number;
  }[];
}

// Cache para configurações
let settingsCache: FreightSettings | null = null;
let settingsCacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Busca as configurações de frete do banco de dados
 */
export async function getFreightSettings(): Promise<FreightSettings> {
  const now = Date.now();
  
  // Retorna do cache se ainda válido
  if (settingsCache && (now - settingsCacheTime) < CACHE_DURATION) {
    return settingsCache;
  }

  const { data, error } = await supabase
    .from('freight_settings')
    .select('setting_key, setting_value');

  if (error) {
    console.error('Erro ao buscar configurações de frete:', error);
    // Retorna valores padrão se houver erro
    return {
      fuel_price: 7.78,
      platform_fee_percentage: 10,
      platform_fee_fixed: 5,
      min_distance_km: 1,
      helper_rate_per_hour: 30,
      urgent_multiplier: 1.5,
    };
  }

  const settings: FreightSettings = {
    fuel_price: 7.78,
    platform_fee_percentage: 10,
    platform_fee_fixed: 5,
    min_distance_km: 1,
    helper_rate_per_hour: 30,
    urgent_multiplier: 1.5,
  };

  data?.forEach(row => {
    if (row.setting_key in settings) {
      (settings as any)[row.setting_key] = Number(row.setting_value);
    }
  });

  // Atualiza cache
  settingsCache = settings;
  settingsCacheTime = now;

  return settings;
}

/**
 * Calcula a estimativa de valor do frete
 * 
 * Fórmula:
 * custo_combustivel = (distancia_km ÷ consumo_km_l) × preco_combustivel
 * valor_veiculo = distancia_km × taxa_por_km (mínimo = min_rate)
 * custo_ajudantes = quantidade × horas × taxa_hora
 * subtotal = custo_combustivel + valor_veiculo + custo_ajudantes
 * taxa_plataforma = (subtotal × porcentagem / 100) + taxa_fixa
 * taxa_urgencia = subtotal × (multiplicador - 1) se urgente
 * total = subtotal + taxa_plataforma + taxa_urgencia
 */
export async function calculateFreightEstimate(
  params: FreightEstimateParams
): Promise<FreightEstimateResult> {
  const settings = await getFreightSettings();
  
  const {
    distanceKm,
    vehicleFuelConsumption = 10, // Padrão: carro comum
    vehicleBaseRatePerKm = 2.50,
    vehicleMinRate = 30,
    helpersCount = 0,
    estimatedHours = 1,
    isUrgent = false,
  } = params;

  // Garante distância mínima
  const effectiveDistance = Math.max(distanceKm, settings.min_distance_km);

  // Custo de combustível (ida e volta considerando que volta vazio = 50% do custo)
  const fuelCost = vehicleFuelConsumption > 0
    ? (effectiveDistance * 1.5 / vehicleFuelConsumption) * settings.fuel_price
    : 0;

  // Valor do veículo baseado na distância
  const vehicleRateByDistance = effectiveDistance * vehicleBaseRatePerKm;
  const vehicleRate = Math.max(vehicleRateByDistance, vehicleMinRate);

  // Custo dos ajudantes
  const helpersCost = helpersCount * estimatedHours * settings.helper_rate_per_hour;

  // Subtotal
  const subtotal = fuelCost + vehicleRate + helpersCost;

  // Taxa da plataforma
  const platformFee = (subtotal * settings.platform_fee_percentage / 100) + settings.platform_fee_fixed;

  // Taxa de urgência
  const urgentFee = isUrgent ? subtotal * (settings.urgent_multiplier - 1) : 0;

  // Total
  const totalEstimate = subtotal + platformFee + urgentFee;

  return {
    fuelCost: Math.round(fuelCost * 100) / 100,
    vehicleRate: Math.round(vehicleRate * 100) / 100,
    helpersCost: Math.round(helpersCost * 100) / 100,
    platformFee: Math.round(platformFee * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    urgentFee: Math.round(urgentFee * 100) / 100,
    totalEstimate: Math.round(totalEstimate * 100) / 100,
    breakdown: [
      { label: 'Custo combustível', value: Math.round(fuelCost * 100) / 100 },
      { label: 'Valor do frete', value: Math.round(vehicleRate * 100) / 100 },
      ...(helpersCost > 0 ? [{ label: 'Ajudantes', value: Math.round(helpersCost * 100) / 100 }] : []),
      { label: 'Taxa de serviço', value: Math.round(platformFee * 100) / 100 },
      ...(urgentFee > 0 ? [{ label: 'Taxa de urgência', value: Math.round(urgentFee * 100) / 100 }] : []),
    ],
  };
}

/**
 * Estimativa simples baseada apenas na distância
 * Útil para quando não se sabe o veículo ainda
 */
export async function estimateByDistance(
  distanceKm: number,
  isUrgent: boolean = false,
  helpersCount: number = 0
): Promise<number> {
  const result = await calculateFreightEstimate({
    distanceKm,
    isUrgent,
    helpersCount,
    estimatedHours: Math.ceil(distanceKm / 30), // ~30km/h de média
  });
  
  return result.totalEstimate;
}

/**
 * Consumo médio por tipo de veículo (km/L)
 */
export const vehicleConsumptionDefaults: Record<string, number> = {
  carro_pequeno: 12,
  utilitario: 10,
  van: 8,
  caminhao_pequeno: 6,
  caminhao_grande: 4,
  carroceiro: 0, // Não usa combustível
  moto: 35,
};

/**
 * Taxa base por km por tipo de veículo (R$)
 */
export const vehicleBaseRateDefaults: Record<string, number> = {
  carro_pequeno: 2.00,
  utilitario: 2.50,
  van: 3.00,
  caminhao_pequeno: 4.00,
  caminhao_grande: 5.00,
  carroceiro: 1.50,
  moto: 1.50,
};

/**
 * Valor mínimo por tipo de veículo (R$)
 */
export const vehicleMinRateDefaults: Record<string, number> = {
  carro_pequeno: 25,
  utilitario: 35,
  van: 50,
  caminhao_pequeno: 80,
  caminhao_grande: 120,
  carroceiro: 20,
  moto: 15,
};
