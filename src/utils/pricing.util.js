/**
 * Server-Side Pricing Calculation Engine
 * Single source of truth for pricing calculations across products, configurator, cart, checkout, and reorders.
 */
export const calculateProductPrice = (pricingRule, attributeSchema, configuration, quantity = 100) => {
  if (!pricingRule) {
    throw new Error('Pricing rules not found for this product');
  }

  // 1. Determine unit base price based on quantity tiers
  let unitPrice = pricingRule.basePrice;
  if (pricingRule.quantityBreaks && pricingRule.quantityBreaks.length > 0) {
    // Sort descending by minQty to find the highest applicable break
    const sortedBreaks = [...pricingRule.quantityBreaks].sort((a, b) => b.minQty - a.minQty);
    const applicableBreak = sortedBreaks.find((qb) => quantity >= qb.minQty);
    if (applicableBreak) {
      unitPrice = applicableBreak.pricePerUnit;
    } else {
      // Fallback to lowest break if quantity is less than smallest tier
      const lowestBreak = [...pricingRule.quantityBreaks].sort((a, b) => a.minQty - b.minQty)[0];
      if (lowestBreak) {
        unitPrice = lowestBreak.pricePerUnit;
      }
    }
  }

  // 2. Calculate option modifiers from configuration
  let flatModifiersPerUnit = 0;
  let sqFtMultiplier = 0;

  // For numeric range items (like banners), check if width/height exist in configuration
  let customWidth = Number(configuration.width) || 0;
  let customHeight = Number(configuration.height) || 0;
  const areaSqFt = customWidth && customHeight ? customWidth * customHeight : 1;

  if (configuration && typeof configuration === 'object') {
    Object.entries(configuration).forEach(([key, value]) => {
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
      }
    });
  }

  // 3. Final calculation
  let finalUnitPrice = unitPrice + flatModifiersPerUnit;
  if (sqFtMultiplier > 0 && areaSqFt > 1) {
    finalUnitPrice += sqFtMultiplier * areaSqFt;
  } else if (sqFtMultiplier > 0) {
    finalUnitPrice += sqFtMultiplier;
  }

  // Round unit price to 2 decimal places
  finalUnitPrice = Math.round(finalUnitPrice * 100) / 100;
  const totalPrice = Math.round(finalUnitPrice * quantity * 100) / 100;

  return {
    unitPrice,
    modifiersPerUnit: flatModifiersPerUnit + (sqFtMultiplier > 0 ? sqFtMultiplier * areaSqFt : 0),
    finalUnitPrice,
    quantity,
    totalPrice,
    areaSqFt: areaSqFt > 1 ? areaSqFt : undefined,
    isDemoPrice: Boolean(pricingRule.isDemoData),
  };
};
