/**
 * @file benefits.js
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

export async function seedBenefits(prisma, employees) {
  console.log('[BENEFITS] Generando Beneficios Legales y Corporativos Ecuatorianos...');

  const benefitsBatch = [];
  for (const emp of employees) {
    if (!emp.isActive) continue;
    benefitsBatch.push(
      {
        employeeId: emp.id,
        name: 'Seguro Médico Privado',
        amount: 150.0,
        type: 'HEALTH',
        frequency: 'RECURRING',
        status: 'ACTIVE',
      },
      {
        employeeId: emp.id,
        name: 'Incentivo Bienestar / Gimnasio',
        amount: 30.0,
        type: 'INCENTIVE',
        frequency: 'RECURRING',
        status: 'ACTIVE',
      },
      {
        employeeId: emp.id,
        name: 'Subsidio de Alimentación',
        amount: 60.0,
        type: 'MEAL',
        frequency: 'RECURRING',
        status: 'ACTIVE',
      },
      {
        employeeId: emp.id,
        name: 'Bono por Desempeño Operativo',
        amount: 100.0,
        type: 'BONUS',
        frequency: 'ONE_TIME',
        status: 'ACTIVE',
      }
    );
  }

  if (benefitsBatch.length > 0) {
    await prisma.employeeBenefit.createMany({ data: benefitsBatch, skipDuplicates: true });
  }
}
