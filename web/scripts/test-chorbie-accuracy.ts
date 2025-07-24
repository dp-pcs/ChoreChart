#!/usr/bin/env tsx

/**
 * Test Chorbie's Improved Accuracy
 * This script tests factual questions to ensure Chorbie provides specific, accurate answers
 */

import { ChorbitAI } from '../src/lib/chorbit'

const chorbie = new ChorbitAI()

async function testChorbieAccuracy() {
  console.log('🧪 Testing Chorbie\'s Improved Accuracy...\n')

  const testQuestions = [
    {
      question: "When does the Washington Commanders training camp start?",
      type: "Current Sports Event",
      expectedBehavior: "Should provide specific dates if known, or state knowledge cutoff"
    },
    {
      question: "What time is it in Tokyo right now?",
      type: "Real-time Information",
      expectedBehavior: "Should explain it can't provide real-time data but offer general guidance"
    },
    {
      question: "When was the iPhone first released?",
      type: "Historical Fact",
      expectedBehavior: "Should provide exact date: June 29, 2007"
    },
    {
      question: "How many days are in February 2024?",
      type: "Calendar/Math Fact",
      expectedBehavior: "Should answer 29 days (leap year)"
    },
    {
      question: "What's the capital of Australia?",
      type: "Geography Fact",
      expectedBehavior: "Should answer Canberra (not Sydney)"
    },
    {
      question: "Hey Chorbie, how are you today?",
      type: "Casual Chat",
      expectedBehavior: "Should be friendly and engaging without unnecessary detail"
    }
  ]

  for (const test of testQuestions) {
    console.log(`\n📋 Testing: ${test.type}`)
    console.log(`❓ Question: "${test.question}"`)
    console.log(`🎯 Expected: ${test.expectedBehavior}`)
    
    try {
      const response = await chorbie.chat(
        test.question, 
        'test-user', 
        {
          userRole: 'CHILD',
          userName: 'Alex',
          currentChores: [],
          weeklyEarnings: 0,
          completionRate: 0
        }
      )
      
      console.log(`🤖 Chorbie: "${response.content}"`)
      
      // Analyze response quality
      const isFactual = response.content.includes('specific') || 
                       response.content.match(/\d{4}/) || // Contains year
                       response.content.match(/\d{1,2}:\d{2}/) || // Contains time
                       response.content.includes('exactly') ||
                       response.content.includes('precisely')
      
      const isVague = response.content.includes('around') ||
                     response.content.includes('approximately') ||
                     response.content.includes('usually') ||
                     response.content.includes('typically') ||
                     response.content.includes('generally')
      
      if (test.type.includes('Fact') || test.type.includes('Event')) {
        if (isFactual && !isVague) {
          console.log(`✅ Good: Response appears specific and factual`)
        } else if (response.content.includes('knowledge cutoff') || response.content.includes('not have current')) {
          console.log(`✅ Good: Appropriately states knowledge limitations`)
        } else {
          console.log(`⚠️  Warning: Response may be too vague for factual question`)
        }
      } else {
        console.log(`✅ Response recorded for casual chat`)
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error}`)
    }
    
    console.log(`${'─'.repeat(80)}`)
  }

  console.log('\n🎉 Chorbie Accuracy Test Complete!')
  console.log('\n📊 Summary:')
  console.log('- Factual questions should now use GPT-4o with higher accuracy')
  console.log('- Casual chat uses GPT-4o-mini for efficiency')
  console.log('- Responses should be specific rather than vague when facts are requested')
  console.log('- If knowledge cutoff prevents current info, Chorbie should state this clearly')
}

// Run the test
if (require.main === module) {
  testChorbieAccuracy().catch(console.error)
}

export { testChorbieAccuracy } 