import financial from '../src/utils/financialUtils.js';

console.log('--- RNF-20: Financial Precision Verification ---');

// Test 1: Precisión de 2 decimales y sin errores de redondeo en sumas
// Scenario: 0.1 + 0.2 should be exactly 0.3, not 0.30000000000000004
const a = 0.1;
const b = 0.2;
const sumFloat = a + b;
const sumDecimal = financial.sum(a, b);

console.log(`Test 1 (0.1 + 0.2):`);
console.log(`  Floating Point: ${sumFloat}`);
console.log(`  Decimal: ${sumDecimal.toString()}`);
console.log(`  Result: ${sumDecimal.toString() === '0.3' ? 'PASS' : 'FAIL'}`);

// Test 2: Cálculos de nómina complejos
// Scenario: Base Salary 1234.56, 30 days. Worked 29 days. 
// salaryPerDay = 1234.56 / 30 = 41.152
// earnedSalary = 41.152 * 29 = 1193.408
// Rounded to 2 decimals = 1193.41
const baseSalary = 1234.56;
const workingDays = 30;
const workedDays = 29;

const salaryPerDayDec = financial.divide(baseSalary, workingDays);
const earnedSalaryDec = financial.multiply(salaryPerDayDec, workedDays);
const earnedSalaryRounded = financial.round(earnedSalaryDec);

console.log(`\nTest 2 (Complex Proportion):`);
console.log(`  Salary Per Day: ${salaryPerDayDec}`);
console.log(`  Earned Salary (Raw): ${earnedSalaryDec}`);
console.log(`  Earned Salary (Rounded): ${earnedSalaryRounded}`);
console.log(`  Result: ${earnedSalaryRounded === 1193.41 ? 'PASS' : 'FAIL'}`);

// Test 3: Porcentajes
// Scenario: IESS Deduction (9.45%) of 1193.41
// Expected: 1193.41 * 0.0945 = 112.777245 -> 112.78
const iessPercent = 9.45;
const iessDeductionDec = financial.percentage(earnedSalaryRounded, iessPercent);
const iessRounded = financial.round(iessDeductionDec);

console.log(`\nTest 3 (Percentage Case):`);
console.log(`  IESS %: ${iessPercent}`);
console.log(`  Deduction: ${iessDeductionDec}`);
console.log(`  Deduction (Rounded): ${iessRounded}`);
console.log(`  Result: ${iessRounded === 112.78 ? 'PASS' : 'FAIL'}`);

// Test 4: Suma de totales (Total Validation Emulation)
// Scenario: Multiple details net salaries
const details = [123.45, 678.90, 234.56, 11.22];
const storedTotal = 1048.13; // 123.45 + 678.90 + 234.56 + 11.22

const calculatedTotal = details.reduce((acc, val) => acc.plus(val), financial.from(0));
console.log(`\nTest 4 (Total Validation):`);
console.log(`  Calculated Sum: ${calculatedTotal}`);
console.log(`  Is Equal: ${calculatedTotal.equals(storedTotal) ? 'PASS' : 'FAIL'}`);

if (sumDecimal.toString() === '0.3' && earnedSalaryRounded === 1193.41 && iessRounded === 112.78 && calculatedTotal.equals(storedTotal)) {
    console.log('\n✅ ALL PRECISION TESTS PASSED');
    process.exit(0);
} else {
    console.log('\n❌ SOME TESTS FAILED');
    process.exit(1);
}
