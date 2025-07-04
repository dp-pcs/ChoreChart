#!/bin/bash

# Handle Prisma migration with P3005 error recovery
# This script attempts to deploy migrations, and if they fail with P3005,
# it marks the migration as applied and continues.

echo "🔄 Starting migration deployment..."

# Attempt to deploy migrations
if npx prisma migrate deploy 2>&1 | tee migration_output.log; then
    echo "✅ Migration deployment successful"
    rm -f migration_output.log
    exit 0
else
    echo "⚠️  Migration deployment failed, checking for P3005 error..."
    
    # Check if the error is P3005 (database schema not empty)
    if grep -q "P3005" migration_output.log || grep -q "not empty" migration_output.log; then
        echo "🔧 P3005 error detected - database schema is not empty"
        echo "📋 Marking migration as applied..."
        
        # Mark the migration as applied
        if npx prisma migrate resolve --applied "20250703035636_init_with_multiple_parents"; then
            echo "✅ Migration marked as applied successfully"
            
            # Verify migration status
            echo "📊 Checking migration status..."
            npx prisma migrate status || true
            
            rm -f migration_output.log
            exit 0
        else
            echo "❌ Failed to mark migration as applied"
            rm -f migration_output.log
            exit 1
        fi
    else
        echo "❌ Migration failed with a different error:"
        cat migration_output.log
        rm -f migration_output.log
        exit 1
    fi
fi