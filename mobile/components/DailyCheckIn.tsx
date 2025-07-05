import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Modal,
} from 'react-native';

interface Person {
  name: string;
  category: 'family' | 'friend' | 'classmate' | 'teacher' | 'other';
  relationship?: string;
}

interface CheckInData {
  morningEnergy: number; // 1-4
  overallMood: number; // 1-5
  activities: string[];
  peopleHungOutWith: Person[];
  socialTime: 'friends' | 'family' | 'solo' | 'mixed';
  screenTime: number; // minutes
  bedtimeLastNight: string;
  stressors: string[];
  homeworkStatus: Record<string, 'incomplete' | 'in_progress' | 'complete'>;
  specialEvents: string[];
}

interface DailyCheckInProps {
  onSubmit: (data: CheckInData) => void;
  onClose: () => void;
}

export function DailyCheckIn({ onSubmit, onClose }: DailyCheckInProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [checkInData, setCheckInData] = useState<Partial<CheckInData>>({
    activities: [],
    peopleHungOutWith: [],
    stressors: [],
    homeworkStatus: {},
    specialEvents: [],
  });

  const [newPersonName, setNewPersonName] = useState('');
  const [showPersonModal, setShowPersonModal] = useState(false);

  // Smart categorization for people
  const categorizePerson = (name: string): 'family' | 'friend' | 'classmate' | 'teacher' | 'other' => {
    const lowerName = name.toLowerCase();
    
    // Family indicators
    const familyKeywords = [
      'mom', 'mother', 'mama', 'mommy', 'mum', 'mamma',
      'dad', 'father', 'papa', 'daddy', 'pop', 'pops',
      'brother', 'sister', 'bro', 'sis', 'sibling',
      'grandma', 'grandpa', 'grandmother', 'grandfather', 'nana', 'granny', 'grampa',
      'aunt', 'uncle', 'cousin', 'nephew', 'niece',
      'stepmom', 'stepdad', 'stepbrother', 'stepsister'
    ];
    
    // Teacher indicators
    const teacherKeywords = [
      'teacher', 'mr.', 'mrs.', 'ms.', 'miss', 'professor', 'coach', 'instructor'
    ];
    
    // Check for family
    if (familyKeywords.some(keyword => lowerName.includes(keyword))) {
      return 'family';
    }
    
    // Check for teachers
    if (teacherKeywords.some(keyword => lowerName.includes(keyword))) {
      return 'teacher';
    }
    
    // Default to friend for now (could be enhanced with more context)
    return 'friend';
  };

  const addPerson = (name: string, customCategory?: Person['category']) => {
    if (!name.trim()) return;
    
    const category = customCategory || categorizePerson(name);
    const newPerson: Person = {
      name: name.trim(),
      category,
    };
    
    setCheckInData(prev => ({
      ...prev,
      peopleHungOutWith: [...(prev.peopleHungOutWith || []), newPerson]
    }));
    
    setNewPersonName('');
    setShowPersonModal(false);
  };

  const removePerson = (index: number) => {
    setCheckInData(prev => ({
      ...prev,
      peopleHungOutWith: prev.peopleHungOutWith?.filter((_, i) => i !== index) || []
    }));
  };

  const toggleActivity = (activity: string) => {
    setCheckInData(prev => {
      const activities = prev.activities || [];
      const newActivities = activities.includes(activity)
        ? activities.filter(a => a !== activity)
        : [...activities, activity];
      return { ...prev, activities: newActivities };
    });
  };

  const toggleStressor = (stressor: string) => {
    setCheckInData(prev => {
      const stressors = prev.stressors || [];
      const newStressors = stressors.includes(stressor)
        ? stressors.filter(s => s !== stressor)
        : [...stressors, stressor];
      return { ...prev, stressors: newStressors };
    });
  };

  const setHomeworkStatus = (subject: string, status: 'incomplete' | 'in_progress' | 'complete') => {
    setCheckInData(prev => ({
      ...prev,
      homeworkStatus: {
        ...prev.homeworkStatus,
        [subject]: status
      }
    }));
  };

  const energyLevels = [
    { value: 1, emoji: '😴', label: 'Sleepy' },
    { value: 2, emoji: '😐', label: 'Okay' },
    { value: 3, emoji: '😊', label: 'Good' },
    { value: 4, emoji: '🚀', label: 'Energized!' }
  ];

  const moodLevels = [
    { value: 1, emoji: '😤', label: 'Frustrated' },
    { value: 2, emoji: '😐', label: 'Meh' },
    { value: 3, emoji: '😊', label: 'Good' },
    { value: 4, emoji: '😇', label: 'Great' },
    { value: 5, emoji: '🤩', label: 'Amazing!' }
  ];

  const commonActivities = [
    { category: 'school', items: ['homework', 'test', 'project', 'presentation', 'study_group'] },
    { category: 'sports', items: ['soccer', 'basketball', 'swim', 'bike', 'run', 'gym'] },
    { category: 'hobbies', items: ['reading', 'gaming', 'music', 'art', 'cooking', 'coding'] },
    { category: 'family', items: ['family_dinner', 'movie_night', 'outing', 'helping_parent'] },
  ];

  const stressors = [
    'homework_pressure', 'friend_conflict', 'test_anxiety', 'schedule_change', 
    'family_tension', 'too_busy', 'tired', 'bored', 'overwhelmed'
  ];

  const steps = [
    // Step 1: How are you feeling?
    {
      title: "How are you feeling? 😊",
      component: (
        <ScrollView style={styles.stepContent}>
          <Text style={styles.stepDescription}>Let's check in on your energy and mood today!</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Morning Energy Level</Text>
            <View style={styles.buttonGrid}>
              {energyLevels.map((level) => (
                <TouchableOpacity
                  key={level.value}
                  style={[
                    styles.selectionButton,
                    checkInData.morningEnergy === level.value && styles.selectedButton
                  ]}
                  onPress={() => setCheckInData(prev => ({ ...prev, morningEnergy: level.value }))}
                >
                  <Text style={styles.selectionEmoji}>{level.emoji}</Text>
                  <Text style={styles.selectionLabel}>{level.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How's your day going overall?</Text>
            <View style={styles.buttonGrid}>
              {moodLevels.map((mood) => (
                <TouchableOpacity
                  key={mood.value}
                  style={[
                    styles.selectionButton,
                    checkInData.overallMood === mood.value && styles.selectedButton
                  ]}
                  onPress={() => setCheckInData(prev => ({ ...prev, overallMood: mood.value }))}
                >
                  <Text style={styles.selectionEmoji}>{mood.emoji}</Text>
                  <Text style={styles.selectionLabel}>{mood.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )
    },

    // Step 2: What did you do today?
    {
      title: "What did you do today? 📅",
      component: (
        <ScrollView style={styles.stepContent}>
          <Text style={styles.stepDescription}>Tell us about your activities!</Text>
          
          {commonActivities.map((category) => (
            <View key={category.category} style={styles.section}>
              <Text style={styles.sectionTitle}>{category.category.charAt(0).toUpperCase() + category.category.slice(1)}</Text>
              <View style={styles.tagContainer}>
                {category.items.map((activity) => (
                  <TouchableOpacity
                    key={activity}
                    style={[
                      styles.tag,
                      checkInData.activities?.includes(activity) && styles.selectedTag
                    ]}
                    onPress={() => toggleActivity(activity)}
                  >
                    <Text style={[
                      styles.tagText,
                      checkInData.activities?.includes(activity) && styles.selectedTagText
                    ]}>
                      {activity.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )
    },

    // Step 3: People & Social Time
    {
      title: "Who did you hang out with? 👫",
      component: (
        <ScrollView style={styles.stepContent}>
          <Text style={styles.stepDescription}>Tell us about the people in your day!</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add People You Spent Time With</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowPersonModal(true)}
            >
              <Text style={styles.addButtonText}>+ Add Person</Text>
            </TouchableOpacity>
          </View>

          {checkInData.peopleHungOutWith && checkInData.peopleHungOutWith.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your People Today</Text>
              {['family', 'friend', 'classmate', 'teacher', 'other'].map(category => {
                const peopleInCategory = checkInData.peopleHungOutWith?.filter(p => p.category === category) || [];
                if (peopleInCategory.length === 0) return null;
                
                return (
                  <View key={category} style={styles.categorySection}>
                    <Text style={styles.categoryTitle}>
                      {category === 'family' ? '👨‍👩‍👧‍👦 Family' :
                       category === 'friend' ? '👫 Friends' :
                       category === 'classmate' ? '🎓 Classmates' :
                       category === 'teacher' ? '👩‍🏫 Teachers' : '🤝 Others'}
                    </Text>
                    {peopleInCategory.map((person, index) => (
                      <View key={index} style={styles.personCard}>
                        <Text style={styles.personName}>{person.name}</Text>
                        <TouchableOpacity
                          onPress={() => removePerson(checkInData.peopleHungOutWith?.indexOf(person) || 0)}
                        >
                          <Text style={styles.removeButton}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overall Social Time</Text>
            <View style={styles.buttonGrid}>
              {['friends', 'family', 'solo', 'mixed'].map(social => (
                <TouchableOpacity
                  key={social}
                  style={[
                    styles.selectionButton,
                    checkInData.socialTime === social && styles.selectedButton
                  ]}
                  onPress={() => setCheckInData(prev => ({ ...prev, socialTime: social as any }))}
                >
                  <Text style={styles.selectionLabel}>{social}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )
    },

    // Step 4: Challenges & Screen Time
    {
      title: "Any challenges today? 🤔",
      component: (
        <ScrollView style={styles.stepContent}>
          <Text style={styles.stepDescription}>Let's talk about the tough parts and your habits.</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What made things tough today?</Text>
            <View style={styles.tagContainer}>
              {stressors.map((stressor) => (
                <TouchableOpacity
                  key={stressor}
                  style={[
                    styles.tag,
                    styles.stressorTag,
                    checkInData.stressors?.includes(stressor) && styles.selectedStressorTag
                  ]}
                  onPress={() => toggleStressor(stressor)}
                >
                  <Text style={[
                    styles.tagText,
                    checkInData.stressors?.includes(stressor) && styles.selectedTagText
                  ]}>
                    {stressor.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Screen time today (rough estimate)</Text>
            <View style={styles.buttonGrid}>
              {[30, 60, 120, 240, 360].map((minutes) => (
                <TouchableOpacity
                  key={minutes}
                  style={[
                    styles.selectionButton,
                    checkInData.screenTime === minutes && styles.selectedButton
                  ]}
                  onPress={() => setCheckInData(prev => ({ ...prev, screenTime: minutes }))}
                >
                  <Text style={styles.selectionLabel}>
                    {minutes < 60 ? `${minutes}m` : `${minutes/60}h`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>When did you go to bed last night?</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., 9:30 PM"
              value={checkInData.bedtimeLastNight || ''}
              onChangeText={(text) => setCheckInData(prev => ({ ...prev, bedtimeLastNight: text }))}
            />
          </View>
        </ScrollView>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onSubmit(checkInData as CheckInData);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepComplete = () => {
    switch (currentStep) {
      case 0: return checkInData.morningEnergy && checkInData.overallMood;
      case 1: return checkInData.activities && checkInData.activities.length > 0;
      case 2: return checkInData.socialTime;
      case 3: return checkInData.screenTime !== undefined && checkInData.bedtimeLastNight;
      default: return false;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Daily Check-In ✨</Text>
          <View style={styles.spacer} />
        </View>
        <Text style={styles.headerSubtitle}>
          Step {currentStep + 1} of {steps.length} • {steps[currentStep].title}
        </Text>
        
        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { width: `${((currentStep + 1) / steps.length) * 100}%` }
            ]}
          />
        </View>
      </View>

      <View style={styles.content}>
        {steps[currentStep].component}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.navButton, currentStep === 0 && styles.disabledButton]}
          onPress={handlePrevious}
          disabled={currentStep === 0}
        >
          <Text style={[styles.navButtonText, currentStep === 0 && styles.disabledButtonText]}>
            Previous
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navButton, styles.nextButton, !isStepComplete() && styles.disabledButton]}
          onPress={handleNext}
          disabled={!isStepComplete()}
        >
          <Text style={[styles.navButtonText, styles.nextButtonText]}>
            {currentStep === steps.length - 1 ? 'Complete Check-in 🎉' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Add Person Modal */}
      <Modal visible={showPersonModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Person</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter name (e.g., Johnny, Mom, Mrs. Smith)"
              value={newPersonName}
              onChangeText={setNewPersonName}
              autoFocus
            />
            <Text style={styles.modalHint}>
              I'll automatically categorize them as family, friend, classmate, or teacher!
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowPersonModal(false);
                  setNewPersonName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addModalButton]}
                onPress={() => addPerson(newPersonName)}
                disabled={!newPersonName.trim()}
              >
                <Text style={styles.addModalButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  closeButton: {
    fontSize: 20,
    color: '#6b7280',
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
    textAlign: 'center',
  },
  spacer: {
    width: 28,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  progressFill: {
    height: 4,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    padding: 20,
  },
  stepDescription: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectionButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 80,
    flex: 1,
    margin: 2,
  },
  selectedButton: {
    borderColor: '#3b82f6',
    backgroundColor: '#dbeafe',
  },
  selectionEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  selectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1f2937',
    textAlign: 'center',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectedTag: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  stressorTag: {
    borderColor: '#f87171',
  },
  selectedStressorTag: {
    backgroundColor: '#f87171',
    borderColor: '#f87171',
  },
  tagText: {
    fontSize: 14,
    color: '#1f2937',
    textTransform: 'capitalize',
  },
  selectedTagText: {
    color: 'white',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  personCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  personName: {
    fontSize: 16,
    color: '#1f2937',
  },
  removeButton: {
    fontSize: 18,
    color: '#ef4444',
    padding: 4,
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  navButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  nextButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  disabledButton: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  nextButtonText: {
    color: 'white',
  },
  disabledButtonText: {
    color: '#9ca3af',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  modalHint: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  addModalButton: {
    backgroundColor: '#3b82f6',
  },
  cancelButtonText: {
    color: '#1f2937',
    fontWeight: '500',
  },
  addModalButtonText: {
    color: 'white',
    fontWeight: '500',
  },
}); 