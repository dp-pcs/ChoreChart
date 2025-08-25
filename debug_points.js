// Quick debugging script to test decimal calculations
const { Decimal } = require('decimal.js')

console.log('Testing Decimal calculations:')

// Test basic operations
const chorePoints = new Decimal(1.5)
const roundTo = (val, places) => {
  const m = Math.pow(10, places)
  return Math.round(val * m) / m
}

const computePointsFromScore = (pct) => new Decimal(roundTo((pct / 100) * chorePoints.toNumber(), 1))

// Test with 100% score
const fullPoints = computePointsFromScore(100)
console.log('Full points (100%):', fullPoints.toNumber())

// Test with 80% score
const partialPoints = computePointsFromScore(80)
console.log('Partial points (80%):', partialPoints.toNumber())

// Test decimal precision and formatting
const testPoints = new Decimal('0.15')
console.log('Test points (0.15):', testPoints.toNumber())
console.log('Test points formatted:', Number(testPoints).toFixed(2))

// Test concatenation vs addition issue
const point1 = new Decimal('0.15')
const point2 = new Decimal('0.15')
const point3 = new Decimal('1.5')

console.log('Addition test:')
console.log('0.15 + 0.15 =', point1.plus(point2).toNumber())
console.log('Result + 1.5 =', point1.plus(point2).plus(point3).toNumber())

// Test potential string concatenation issue
const stringTest1 = '0.15'
const stringTest2 = '0.15'
console.log('String concatenation:', stringTest1 + stringTest2)

// Test increment with decimal
console.log('\nIncrement simulation:')
let availablePoints = new Decimal(0)
const increments = [0.15, 0.15, 1.5, 0.15, 1.5]

increments.forEach(inc => {
  availablePoints = availablePoints.plus(inc)
  console.log(`After adding ${inc}:`, availablePoints.toNumber())
})