# Chore Quality Scoring System

## Overview

The new scoring system allows parents to evaluate the quality of their children's work and award partial rewards based on performance. This encourages better work habits and teaches the value of doing things right the first time.

## Features

### For Parents

1. **Quality Scoring**: Rate chore completion from 0-100%
2. **Partial Rewards**: Automatically calculate rewards based on quality score
3. **Feedback System**: Provide specific feedback for improvement
4. **Visual Interface**: Intuitive slider-based scoring with real-time calculations

### For Children

1. **Quality Feedback**: See detailed scoring breakdown
2. **Improvement Tips**: Get constructive suggestions for better work
3. **Transparent Rewards**: Understand exactly how rewards are calculated
4. **Motivational Design**: Encouraging feedback for good work

## How It Works

### Scoring Scale

- **90-100%**: 🌟 Excellent work - Full reward
- **70-89%**: 👍 Good job - Partial reward  
- **50-69%**: 🤔 Needs improvement - Reduced reward
- **0-49%**: 😞 Poor quality - Minimal or no reward

### Reward Calculation

```
Final Reward = (Quality Score / 100) × Original Reward
```

**Example**: A $10 chore with 75% quality score = $7.50 reward

### Parent Workflow

1. Child submits completed chore
2. Parent reviews submission in dashboard
3. Parent clicks "Score" button
4. Parent uses slider to rate quality (0-100%)
5. Parent provides optional feedback
6. System calculates partial reward
7. Parent approves with calculated reward

### Child Experience

1. Child completes chore and submits
2. Parent scores the work quality
3. Child receives detailed feedback showing:
   - Quality score with emoji indicator
   - Original vs. final reward
   - Parent's feedback
   - Tips for improvement
   - Positive reinforcement for good work

## Technical Implementation

### Database Changes

- Added `score` field to `ChoreSubmission` table
- Added `partialReward` field to `ChoreSubmission` table
- Added `score`, `partialReward`, `originalReward` fields to `ChoreApproval` table

### API Updates

- Enhanced `/api/chores/approve` endpoint to handle scoring
- Added score validation (0-100 range)
- Automatic partial reward calculation
- Enhanced response with scoring data

### UI Components

- `ChoreScoringDialog`: Parent scoring interface
- `ScoringFeedback`: Child feedback display
- Updated parent dashboard with scoring buttons
- Enhanced recent activity to show quality scores

## Benefits

1. **Encourages Quality**: Children learn to do things right the first time
2. **Fair System**: Rewards effort while maintaining standards
3. **Educational**: Provides constructive feedback for improvement
4. **Transparent**: Clear calculation of rewards
5. **Motivational**: Positive reinforcement for good work

## Demo

Visit `/scoring-demo` to see the scoring system in action with interactive examples.

## Future Enhancements

- Quality score history tracking
- Automated quality suggestions based on past performance
- Quality-based streaks and achievements
- Parent coaching tips for effective feedback
- Quality improvement goals and progress tracking