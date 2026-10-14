/**
 * Server-Side Pricing Calculation Engine
 * Single source of truth for pricing calculations across products, configurator, cart, checkout, and reorders.
 */
export const calculateProductPrice = (pricingRule, attributeSchema, configuration = {}, quantity = 100) => {
  if (!pricingRule) {
    throw new Error('Pricing rules not found for this product');
  }

  const safeConfig = configuration && typeof configuration === 'object' ? configuration : {};
  const numQuantity = Number(quantity) || 100;

  // Normalize base unit price and quantity breaks
  let breaks = pricingRule.quantityBreaks && pricingRule.quantityBreaks.length > 0
    ? [...pricingRule.quantityBreaks]
    : [];

  const rawBase = pricingRule.basePrice || 200;
  const unitBase = rawBase > 50 ? rawBase / 100 : rawBase;

  if (breaks.length === 0) {
    breaks = [
      { minQty: 100, pricePerUnit: unitBase },
      { minQty: 250, pricePerUnit: Math.round(unitBase * 0.90 * 100) / 100 },
      { minQty: 500, pricePerUnit: Math.round(unitBase * 0.80 * 100) / 100 },
      { minQty: 1000, pricePerUnit: Math.round(unitBase * 0.65 * 100) / 100 },
      { minQty: 2500, pricePerUnit: Math.round(unitBase * 0.52 * 100) / 100 },
    ];
  }

  // 1. Determine unit base price based on quantity tiers
  const getBreakUnitPrice = (qty) => {
    const sortedBreaks = [...breaks].sort((a, b) => b.minQty - a.minQty);
    const applicableBreak = sortedBreaks.find((qb) => qty >= qb.minQty);
    if (applicableBreak) {
      return applicableBreak.pricePerUnit;
    }
    const lowestBreak = [...breaks].sort((a, b) => a.minQty - b.minQty)[0];
    return lowestBreak ? lowestBreak.pricePerUnit : unitBase;
  };

  let unitPrice = getBreakUnitPrice(numQuantity);

  // 2. Calculate option modifiers from configuration
  let flatModifiersPerUnit = 0;
  let sqFtMultiplier = 0;

  // For numeric range items (like banners), check if width/height exist in configuration
  let customWidth = Number(safeConfig.width) || 0;
  let customHeight = Number(safeConfig.height) || 0;
  const areaSqFt = customWidth && customHeight ? customWidth * customHeight : 1;

  Object.entries(safeConfig).forEach(([key, value]) => {
    // Find matching rule in attributeModifiers
    const mod = pricingRule.attributeModifiers?.find(
      (m) => m.attributeKey === key && String(m.optionValue) === String(value)
    );
    if (mod) {
      if (mod.modifierType === 'PER_SQ_FT') {
        sqFtMultiplier += mod.priceModifier;
      } else if (mod.modifierType === 'PERCENTAGE') {
        flatModifiersPerUnit += unitPrice * (mod.priceModifier / 100);
      } else {
        // FLAT default
        flatModifiersPerUnit += mod.priceModifier;
      }
    } else if (key === 'corners' && value === 'rounded') {
      // Standard rounded corner finishing add-on (+₹0.50 per card) if not explicitly customized
      flatModifiersPerUnit += 0.5;
    }
  });

  // 3. Final calculation for requested quantity
  let finalUnitPrice = unitPrice + flatModifiersPerUnit;
  if (sqFtMultiplier > 0 && areaSqFt > 1) {
    finalUnitPrice += sqFtMultiplier * areaSqFt;
  } else if (sqFtMultiplier > 0) {
    finalUnitPrice += sqFtMultiplier;
  }

  // Round unit price to 2 decimal places
  finalUnitPrice = Math.round(finalUnitPrice * 100) / 100;
  const totalPrice = Math.round(finalUnitPrice * numQuantity * 100) / 100;

  // 4. Authoritative Volume Tiers Ladder
  const candidateTiers = new Set([100, 250, 500, 1000, 2500]);
  if (attributeSchema?.quantityTiers && Array.isArray(attributeSchema.quantityTiers)) {
    attributeSchema.quantityTiers.forEach((q) => {
      const n = Number(q);
      if (Number.isFinite(n) && n > 0) candidateTiers.add(n);
    });
  }
  breaks.forEach((qb) => {
    const n = Number(qb.minQty);
    if (Number.isFinite(n) && n > 0) candidateTiers.add(n);
  });

  const sortedTierQuantities = Array.from(candidateTiers).sort((a, b) => a - b);
  const baseTierQty = sortedTierQuantities[0] || 100;
  const baseTierUnit = getBreakUnitPrice(baseTierQty);
  const baseTierFinalUnitPrice = Math.round((baseTierUnit + flatModifiersPerUnit + (sqFtMultiplier > 0 ? sqFtMultiplier * areaSqFt : 0)) * 100) / 100;

  const tiers = sortedTierQuantities.map((tQty) => {
    const tBasePrice = getBreakUnitPrice(tQty);
    let tFinalUnit = tBasePrice + flatModifiersPerUnit;
    if (sqFtMultiplier > 0 && areaSqFt > 1) {
      tFinalUnit += sqFtMultiplier * areaSqFt;
    } else if (sqFtMultiplier > 0) {
      tFinalUnit += sqFtMultiplier;
    }
    tFinalUnit = Math.round(tFinalUnit * 100) / 100;
    const tTotal = Math.round(tFinalUnit * tQty * 100) / 100;
    const discountPercent = baseTierFinalUnitPrice > 0
      ? Math.max(0, Math.round((1 - tFinalUnit / baseTierFinalUnitPrice) * 100))
      : 0;

    return {
      quantity: tQty,
      unitPrice: tFinalUnit,
      totalPrice: tTotal,
      discountPercent,
      popular: tQty === 500,
      bestValue: tQty === 1000,
    };
  });

  return {
    unitPrice,
    modifiersPerUnit: flatModifiersPerUnit + (sqFtMultiplier > 0 ? sqFtMultiplier * areaSqFt : 0),
    finalUnitPrice,
    quantity: numQuantity,
    totalPrice,
    areaSqFt: areaSqFt > 1 ? areaSqFt : undefined,
    isDemoPrice: Boolean(pricingRule.isDemoData),
    tiers,
  };
};
