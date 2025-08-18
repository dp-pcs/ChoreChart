// Safe Prisma loader that avoids crashing builds when prisma is not generated
let PrismaClientConstructor: any
try {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	PrismaClientConstructor = require('@prisma/client').PrismaClient
} catch {
	PrismaClientConstructor = null
}

let Decimal: any
try {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	Decimal = require('@prisma/client/runtime/library').Decimal
} catch {
	Decimal = class {}
}

const globalForPrisma = globalThis as unknown as {
	prisma: any
}

let prismaInstance: any = undefined
if (PrismaClientConstructor && process.env.DATABASE_URL) {
	prismaInstance = globalForPrisma.prisma ?? new PrismaClientConstructor({
		datasources: {
			db: { url: process.env.DATABASE_URL }
		}
	})
	if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaInstance
}

export const prisma = prismaInstance
export { Decimal } 