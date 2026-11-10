/**
 * @file SustainabilityKPIGrid.jsx
 * @description Cuadrícula ejecutiva con las 5 métricas troncales del ODS 8
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import SustainabilityKPICard from './SustainabilityKPICard.jsx';

export default function SustainabilityKPIGrid({ indicators = {} }) {
  const {
    formalContractRate,
    socialSecurityCoverage,
    salaryEquitabilityIndex,
    overtimeCompensationRatio,
    verifiedLegalSettlements,
  } = indicators;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
      {formalContractRate && <SustainabilityKPICard {...formalContractRate} />}
      {socialSecurityCoverage && <SustainabilityKPICard {...socialSecurityCoverage} />}
      {salaryEquitabilityIndex && <SustainabilityKPICard {...salaryEquitabilityIndex} />}
      {overtimeCompensationRatio && <SustainabilityKPICard {...overtimeCompensationRatio} />}
      {verifiedLegalSettlements && <SustainabilityKPICard {...verifiedLegalSettlements} />}
    </div>
  );
}
