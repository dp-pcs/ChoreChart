import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Switch,
} from 'react-native';

interface Child {
  id: string;
  name: string;
  age?: number;
}

interface Chore {
  id: string;
  title: string;
  description?: string;
  assignedTo: string[];
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom' | 'once';
  reward: number;
  estimatedMinutes: number;
  category: string;
  isRequired: boolean;
  scheduledDays?: number[];
  createdBy: string;
  createdAt: string;
  isActive: boolean;
}

interface Expectation {
  id: string;
  title: string;
  description?: string;
  assignedTo: string[];
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  deduction: number;
  category: string;
  scheduledDays?: number[];
  createdBy: string;
  createdAt: string;
  isActive: boolean;
}

interface ChoreManagementProps {
  children: Child[];
  onClose: () => void;
}

const CATEGORIES = [
  { id: 'bedroom', name: 'Bedroom', emoji: '🛏️' },
  { id: 'kitchen', name: 'Kitchen', emoji: '🍽️' },
  { id: 'bathroom', name: 'Bathroom', emoji: '🚿' },
  { id: 'household', name: 'Household', emoji: '🏠' },
  { id: 'outdoor', name: 'Outdoor', emoji: '🌳' },
  { id: 'pets', name: 'Pets', emoji: '🐕' },
  { id: 'behavior', name: 'Behavior', emoji: '🤝' },
  { id: 'general', name: 'General', emoji: '📋' },
];

const FREQUENCIES = [
  { id: 'daily', name: 'Daily', description: 'Every day' },
  { id: 'weekly', name: 'Weekly', description: 'Once a week' },
  { id: 'biweekly', name: 'Bi-weekly', description: 'Every two weeks' },
  { id: 'monthly', name: 'Monthly', description: 'Once a month' },
  { id: 'once', name: 'One-time', description: 'Just once' },
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function ChoreManagement({ children, onClose }: ChoreManagementProps) {
  const [activeView, setActiveView] = useState<'chores' | 'expectations' | 'rewards'>('chores');
  const [showAddChoreModal, setShowAddChoreModal] = useState(false);
  const [showAddExpectationModal, setShowAddExpectationModal] = useState(false);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);
  const [editingExpectation, setEditingExpectation] = useState<Expectation | null>(null);
  const [selectedChild, setSelectedChild] = useState<string>('all');
  
  // Mock chores data - replace with real data
  const [chores, setChores] = useState<Chore[]>([
    {
      id: '1',
      title: 'Make Bed',
      description: 'Make your bed neatly every morning',
      assignedTo: ['child-1'],
      frequency: 'daily',
      reward: 2.00,
      estimatedMinutes: 5,
      category: 'bedroom',
      isRequired: true,
      scheduledDays: [1, 2, 3, 4, 5],
      createdBy: 'parent-1',
      createdAt: new Date().toISOString(),
      isActive: true
    },
    {
      id: '2',
      title: 'Clean Room',
      description: 'Tidy up bedroom and put clothes away',
      assignedTo: ['child-1'],
      frequency: 'weekly',
      reward: 5.00,
      estimatedMinutes: 30,
      category: 'bedroom',
      isRequired: false,
      scheduledDays: [6],
      createdBy: 'parent-1',
      createdAt: new Date().toISOString(),
      isActive: true
    },
  ]);

  // Mock expectations data
  const [expectations, setExpectations] = useState<Expectation[]>([
    {
      id: 'exp1',
      title: 'Keep room reasonably tidy',
      description: 'Room should be neat with clothes put away',
      assignedTo: ['child-1'],
      frequency: 'daily',
      deduction: 1.00,
      category: 'bedroom',
      createdBy: 'parent-1',
      createdAt: new Date().toISOString(),
      isActive: true
    },
    {
      id: 'exp2',
      title: 'Put dishes in dishwasher after eating',
      description: 'Clean up after yourself in kitchen',
      assignedTo: ['child-1', 'child-2'],
      frequency: 'daily',
      deduction: 0.50,
      category: 'kitchen',
      createdBy: 'parent-1',
      createdAt: new Date().toISOString(),
      isActive: true
    },
    {
      id: 'exp3',
      title: 'Be respectful to siblings',
      description: 'No fighting, name-calling, or mean behavior',
      assignedTo: ['child-1', 'child-2'],
      frequency: 'daily',
      deduction: 2.00,
      category: 'behavior',
      createdBy: 'parent-1',
      createdAt: new Date().toISOString(),
      isActive: true
    },
  ]);

  // Reward management state
  const [rewardMode, setRewardMode] = useState<'individual' | 'total'>('individual');
  const [totalBudget, setTotalBudget] = useState<number>(50);

  const filteredChores = selectedChild === 'all' 
    ? chores 
    : chores.filter(chore => chore.assignedTo.includes(selectedChild));

  const filteredExpectations = selectedChild === 'all' 
    ? expectations 
    : expectations.filter(expectation => expectation.assignedTo.includes(selectedChild));

  const totalWeeklyEarnings = chores.reduce((total, chore) => {
    const multiplier = chore.frequency === 'daily' ? 7 : 
                     chore.frequency === 'weekly' ? 1 :
                     chore.frequency === 'biweekly' ? 0.5 : 1;
    return total + (chore.reward * multiplier);
  }, 0);

  const totalWeeklyDeductions = expectations.reduce((total, expectation) => {
    const multiplier = expectation.frequency === 'daily' ? 7 : 
                     expectation.frequency === 'weekly' ? 1 :
                     expectation.frequency === 'biweekly' ? 0.5 : 1;
    return total + (expectation.deduction * multiplier);
  }, 0);

  const handleAddChore = () => {
    setEditingChore(null);
    setShowAddChoreModal(true);
  };

  const handleAddExpectation = () => {
    setEditingExpectation(null);
    setShowAddExpectationModal(true);
  };

  const handleEditChore = (chore: Chore) => {
    setEditingChore(chore);
    setShowAddChoreModal(true);
  };

  const handleEditExpectation = (expectation: Expectation) => {
    setEditingExpectation(expectation);
    setShowAddExpectationModal(true);
  };

  const handleSaveChore = (choreData: Partial<Chore>) => {
    if (editingChore) {
      // Edit existing chore
      setChores(prev => prev.map(chore => 
        chore.id === editingChore.id 
          ? { ...chore, ...choreData }
          : chore
      ));
    } else {
      // Add new chore
      const newChore: Chore = {
        id: Date.now().toString(),
        title: choreData.title || '',
        description: choreData.description || '',
        assignedTo: choreData.assignedTo || [],
        frequency: choreData.frequency || 'weekly',
        reward: choreData.reward || 0,
        estimatedMinutes: choreData.estimatedMinutes || 15,
        category: choreData.category || 'general',
        isRequired: choreData.isRequired || false,
        scheduledDays: choreData.scheduledDays || [],
        createdBy: 'parent-1',
        createdAt: new Date().toISOString(),
        isActive: true,
      };
      setChores(prev => [...prev, newChore]);
    }
    setShowAddChoreModal(false);
  };

  const handleSaveExpectation = (expectationData: Partial<Expectation>) => {
    if (editingExpectation) {
      // Edit existing expectation
      setExpectations(prev => prev.map(expectation => 
        expectation.id === editingExpectation.id 
          ? { ...expectation, ...expectationData }
          : expectation
      ));
    } else {
      // Add new expectation
      const newExpectation: Expectation = {
        id: 'exp' + Date.now().toString(),
        title: expectationData.title || '',
        description: expectationData.description || '',
        assignedTo: expectationData.assignedTo || [],
        frequency: expectationData.frequency || 'daily',
        deduction: expectationData.deduction || 1,
        category: expectationData.category || 'general',
        scheduledDays: expectationData.scheduledDays || [],
        createdBy: 'parent-1',
        createdAt: new Date().toISOString(),
        isActive: true,
      };
      setExpectations(prev => [...prev, newExpectation]);
    }
    setShowAddExpectationModal(false);
  };

  const handleDeleteChore = (choreId: string) => {
    Alert.alert(
      'Delete Chore',
      'Are you sure you want to delete this chore?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => setChores(prev => prev.filter(c => c.id !== choreId))
        }
      ]
    );
  };

  const handleDeleteExpectation = (expectationId: string) => {
    Alert.alert(
      'Delete Expectation',
      'Are you sure you want to delete this expectation?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => setExpectations(prev => prev.filter(e => e.id !== expectationId))
        }
      ]
    );
  };

  const handleMarkExpectationNotMet = (expectation: Expectation, childId: string) => {
    const child = children.find(c => c.id === childId);
    Alert.alert(
      'Mark Expectation Not Met',
      `Deduct $${expectation.deduction.toFixed(2)} from ${child?.name} for not meeting "${expectation.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: `Deduct $${expectation.deduction.toFixed(2)}`, 
          style: 'destructive',
          onPress: () => {
            console.log(`Deducted $${expectation.deduction} from ${child?.name} for ${expectation.title}`);
            Alert.alert('Deduction Applied', `$${expectation.deduction.toFixed(2)} deducted from ${child?.name}'s earnings.`);
          }
        }
      ]
    );
  };

  const handleAutoDistribute = () => {
    const totalChores = chores.length;
    if (totalChores === 0) return;
    
    const perChoreReward = totalBudget / totalChores;
    setChores(prev => prev.map(chore => ({
      ...chore,
      reward: parseFloat(perChoreReward.toFixed(2))
    })));
    
    Alert.alert('Success', `Distributed $${totalBudget} evenly across ${totalChores} chores ($${perChoreReward.toFixed(2)} each)`);
  };

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📋 Family Management</Text>
          <TouchableOpacity 
            onPress={activeView === 'chores' ? handleAddChore : activeView === 'expectations' ? handleAddExpectation : undefined} 
            style={[styles.addButton, activeView === 'rewards' && styles.disabledButton]}
          >
            <Text style={styles.addButtonText}>➕</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeView === 'chores' && styles.activeTab]}
            onPress={() => setActiveView('chores')}
          >
            <Text style={[styles.tabText, activeView === 'chores' && styles.activeTabText]}>
              📋 Chores
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeView === 'expectations' && styles.activeTab]}
            onPress={() => setActiveView('expectations')}
          >
            <Text style={[styles.tabText, activeView === 'expectations' && styles.activeTabText]}>
              ⭐ Expectations
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeView === 'rewards' && styles.activeTab]}
            onPress={() => setActiveView('rewards')}
          >
            <Text style={[styles.tabText, activeView === 'rewards' && styles.activeTabText]}>
              💰 Rewards
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Child Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Filter by Child</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
              <TouchableOpacity 
                style={[styles.filterButton, selectedChild === 'all' && styles.activeFilter]}
                onPress={() => setSelectedChild('all')}
              >
                <Text style={[styles.filterText, selectedChild === 'all' && styles.activeFilterText]}>
                  All Children
                </Text>
              </TouchableOpacity>
              {children.map(child => (
                <TouchableOpacity 
                  key={child.id}
                  style={[styles.filterButton, selectedChild === child.id && styles.activeFilter]}
                  onPress={() => setSelectedChild(child.id)}
                >
                  <Text style={[styles.filterText, selectedChild === child.id && styles.activeFilterText]}>
                    {child.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {activeView === 'chores' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Chores ({filteredChores.length})
              </Text>
              {filteredChores.map(chore => (
                <ChoreCard 
                  key={chore.id}
                  chore={chore}
                  children={children}
                  onEdit={() => handleEditChore(chore)}
                  onDelete={() => handleDeleteChore(chore.id)}
                />
              ))}
              {filteredChores.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>📋 No chores found</Text>
                  <Text style={styles.emptySubtext}>
                    {selectedChild === 'all' 
                      ? 'Add your first chore to get started!'
                      : `No chores assigned to ${children.find(c => c.id === selectedChild)?.name}`
                    }
                  </Text>
                </View>
              )}
            </View>
          )}

          {activeView === 'expectations' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Expectations ({filteredExpectations.length})
              </Text>
              <Text style={styles.expectationsDescription}>
                Basic standards that are expected without reward. Money is deducted when not met.
              </Text>
              {filteredExpectations.map(expectation => (
                <ExpectationCard 
                  key={expectation.id}
                  expectation={expectation}
                  children={children}
                  onEdit={() => handleEditExpectation(expectation)}
                  onDelete={() => handleDeleteExpectation(expectation.id)}
                  onMarkNotMet={handleMarkExpectationNotMet}
                />
              ))}
              {filteredExpectations.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>⭐ No expectations found</Text>
                  <Text style={styles.emptySubtext}>
                    {selectedChild === 'all' 
                      ? 'Add your first expectation to set standards!'
                      : `No expectations set for ${children.find(c => c.id === selectedChild)?.name}`
                    }
                  </Text>
                </View>
              )}
            </View>
          )}

          {activeView === 'rewards' && (
            <RewardManagement 
              chores={chores}
              expectations={expectations}
              rewardMode={rewardMode}
              setRewardMode={setRewardMode}
              totalBudget={totalBudget}
              setTotalBudget={setTotalBudget}
              totalWeeklyEarnings={totalWeeklyEarnings}
              totalWeeklyDeductions={totalWeeklyDeductions}
              onAutoDistribute={handleAutoDistribute}
            />
          )}
        </ScrollView>

        {/* Add/Edit Chore Modal */}
        {showAddChoreModal && (
          <AddChoreModal
            chore={editingChore}
            children={children}
            onSave={handleSaveChore}
            onClose={() => setShowAddChoreModal(false)}
          />
        )}

        {/* Add/Edit Expectation Modal */}
        {showAddExpectationModal && (
          <AddExpectationModal
            expectation={editingExpectation}
            children={children}
            onSave={handleSaveExpectation}
            onClose={() => setShowAddExpectationModal(false)}
          />
        )}
      </View>
    </Modal>
  );
}

function ChoreCard({ chore, children, onEdit, onDelete }: {
  chore: Chore;
  children: Child[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const category = CATEGORIES.find(c => c.id === chore.category);
  const assignedChildren = children.filter(c => chore.assignedTo.includes(c.id));

  return (
    <View style={styles.choreCard}>
      <View style={styles.choreHeader}>
        <View style={styles.choreInfo}>
          <Text style={styles.choreTitle}>{category?.emoji} {chore.title}</Text>
          <Text style={styles.choreDescription}>{chore.description}</Text>
        </View>
        <View style={styles.choreActions}>
          <TouchableOpacity onPress={onEdit} style={styles.editButton}>
            <Text style={styles.actionButtonText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
            <Text style={styles.actionButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.choreDetails}>
        <Text style={styles.choreDetailText}>
          👨‍👩‍👧‍👦 {assignedChildren.map(c => c.name).join(', ') || 'Unassigned'}
        </Text>
        <Text style={styles.choreDetailText}>
          📅 {chore.frequency} • ⏱️ {chore.estimatedMinutes}min • 💰 ${chore.reward.toFixed(2)}
        </Text>
      </View>
    </View>
  );
}

function RewardManagement({ 
  chores, 
  expectations, 
  rewardMode, 
  setRewardMode, 
  totalBudget, 
  setTotalBudget, 
  totalWeeklyEarnings,
  totalWeeklyDeductions,
  onAutoDistribute 
}: {
  chores: Chore[];
  expectations: Expectation[];
  rewardMode: 'individual' | 'total';
  setRewardMode: (mode: 'individual' | 'total') => void;
  totalBudget: number;
  setTotalBudget: (budget: number) => void;
  totalWeeklyEarnings: number;
  totalWeeklyDeductions: number;
  onAutoDistribute: () => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>💰 Reward System</Text>
      
      {/* Mode Selection */}
      <View style={styles.rewardModeContainer}>
        <TouchableOpacity 
          style={[styles.modeButton, rewardMode === 'individual' && styles.activeModeButton]}
          onPress={() => setRewardMode('individual')}
        >
          <Text style={[styles.modeButtonText, rewardMode === 'individual' && styles.activeModeText]}>
            Individual Pricing
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.modeButton, rewardMode === 'total' && styles.activeModeButton]}
          onPress={() => setRewardMode('total')}
        >
          <Text style={[styles.modeButtonText, rewardMode === 'total' && styles.activeModeText]}>
            Total Allowance
          </Text>
        </TouchableOpacity>
      </View>

      {rewardMode === 'total' && (
        <View style={styles.budgetContainer}>
          <Text style={styles.budgetLabel}>Weekly Budget</Text>
          <TextInput
            style={styles.budgetInput}
            value={totalBudget.toString()}
            onChangeText={(text) => setTotalBudget(parseFloat(text) || 0)}
            keyboardType="numeric"
            placeholder="50.00"
          />
          <TouchableOpacity style={styles.distributeButton} onPress={onAutoDistribute}>
            <Text style={styles.distributeButtonText}>Auto-Distribute</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Current Status */}
      <View style={styles.statusContainer}>
        <View style={styles.statusCard}>
          <Text style={styles.statusValue}>{chores.length}</Text>
          <Text style={styles.statusLabel}>Total Chores</Text>
        </View>
        <View style={styles.statusCard}>
          <Text style={styles.statusValue}>${totalWeeklyEarnings.toFixed(2)}</Text>
          <Text style={styles.statusLabel}>Weekly Total</Text>
        </View>
        <View style={styles.statusCard}>
          <Text style={styles.statusValue}>
            ${(totalWeeklyEarnings / (chores.length || 1)).toFixed(2)}
          </Text>
          <Text style={styles.statusLabel}>Avg per Chore</Text>
        </View>
      </View>

      {rewardMode === 'total' && (
        <View style={styles.budgetSummary}>
          <Text style={styles.budgetSummaryText}>
            Budget: ${totalBudget} • Current: ${totalWeeklyEarnings.toFixed(2)} • 
            {totalWeeklyEarnings > totalBudget ? ' ⚠️ Over budget' : ' ✅ Under budget'}
          </Text>
        </View>
      )}
    </View>
  );
}

function AddChoreModal({ chore, children, onSave, onClose }: {
  chore: Chore | null;
  children: Child[];
  onSave: (chore: Partial<Chore>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    title: chore?.title || '',
    description: chore?.description || '',
    category: chore?.category || 'general',
    frequency: chore?.frequency || 'weekly',
    reward: chore?.reward?.toString() || '5.00',
    estimatedMinutes: chore?.estimatedMinutes?.toString() || '15',
    isRequired: chore?.isRequired || false,
    assignedTo: chore?.assignedTo || [],
    scheduledDays: chore?.scheduledDays || [],
  });

  const handleSave = () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a chore title');
      return;
    }

    onSave({
      ...formData,
      reward: parseFloat(formData.reward) || 0,
      estimatedMinutes: parseInt(formData.estimatedMinutes) || 15,
    });
  };

  const toggleChildAssignment = (childId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(childId)
        ? prev.assignedTo.filter(id => id !== childId)
        : [...prev.assignedTo, childId]
    }));
  };

  const toggleScheduledDay = (dayIndex: number) => {
    setFormData(prev => ({
      ...prev,
      scheduledDays: prev.scheduledDays.includes(dayIndex)
        ? prev.scheduledDays.filter(d => d !== dayIndex)
        : [...prev.scheduledDays, dayIndex]
    }));
  };

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {chore ? 'Edit Chore' : 'Add New Chore'}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Title */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Chore Title *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.title}
                onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                placeholder="e.g., Make bed, Take out trash"
              />
            </View>

            {/* Description */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Optional: Add more details..."
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Category */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoryContainer}>
                  {CATEGORIES.map(category => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryButton,
                        formData.category === category.id && styles.activeCategoryButton
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, category: category.id }))}
                    >
                      <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                      <Text style={[
                        styles.categoryText,
                        formData.category === category.id && styles.activeCategoryText
                      ]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Frequency */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Frequency</Text>
              {FREQUENCIES.map(freq => (
                <TouchableOpacity
                  key={freq.id}
                  style={[
                    styles.frequencyButton,
                    formData.frequency === freq.id && styles.activeFrequencyButton
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, frequency: freq.id as any }))}
                >
                  <View style={styles.frequencyInfo}>
                    <Text style={[
                      styles.frequencyName,
                      formData.frequency === freq.id && styles.activeFrequencyText
                    ]}>
                      {freq.name}
                    </Text>
                    <Text style={styles.frequencyDescription}>{freq.description}</Text>
                  </View>
                  <View style={[
                    styles.radioButton,
                    formData.frequency === freq.id && styles.activeRadioButton
                  ]} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Scheduled Days (for daily frequency) */}
            {formData.frequency === 'daily' && (
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Which days?</Text>
                <View style={styles.weekdaysContainer}>
                  {WEEKDAYS.map((day, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.weekdayButton,
                        formData.scheduledDays.includes(index) && styles.activeWeekdayButton
                      ]}
                      onPress={() => toggleScheduledDay(index)}
                    >
                      <Text style={[
                        styles.weekdayText,
                        formData.scheduledDays.includes(index) && styles.activeWeekdayText
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Assign to Children */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Assign to</Text>
              {children.map(child => (
                <TouchableOpacity
                  key={child.id}
                  style={styles.childAssignButton}
                  onPress={() => toggleChildAssignment(child.id)}
                >
                  <Text style={styles.childName}>{child.name}</Text>
                  <View style={[
                    styles.checkbox,
                    formData.assignedTo.includes(child.id) && styles.activeCheckbox
                  ]}>
                    {formData.assignedTo.includes(child.id) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Reward and Time */}
            <View style={styles.formRow}>
              <View style={styles.formHalf}>
                <Text style={styles.formLabel}>Reward ($)</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.reward}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, reward: text }))}
                  keyboardType="decimal-pad"
                  placeholder="5.00"
                />
              </View>
              <View style={styles.formHalf}>
                <Text style={styles.formLabel}>Est. Time (min)</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.estimatedMinutes}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, estimatedMinutes: text }))}
                  keyboardType="numeric"
                  placeholder="15"
                />
              </View>
            </View>

            {/* Required Toggle */}
            <View style={styles.formSection}>
              <View style={styles.toggleRow}>
                <Text style={styles.formLabel}>Required chore?</Text>
                <Switch
                  value={formData.isRequired}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, isRequired: value }))}
                />
              </View>
              <Text style={styles.helpText}>
                Required chores must be completed for allowance
              </Text>
            </View>

            {/* Save/Cancel Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>
                  {chore ? 'Update Chore' : 'Add Chore'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function AddExpectationModal({ expectation, children, onSave, onClose }: {
  expectation: Expectation | null;
  children: Child[];
  onSave: (expectation: Partial<Expectation>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    title: expectation?.title || '',
    description: expectation?.description || '',
    category: expectation?.category || 'general',
    frequency: expectation?.frequency || 'daily',
    deduction: expectation?.deduction?.toString() || '1.00',
    assignedTo: expectation?.assignedTo || [],
    scheduledDays: expectation?.scheduledDays || [],
  });

  const handleSave = () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter an expectation title');
      return;
    }

    onSave({
      ...formData,
      deduction: parseFloat(formData.deduction) || 1,
    });
  };

  const toggleChildAssignment = (childId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(childId)
        ? prev.assignedTo.filter(id => id !== childId)
        : [...prev.assignedTo, childId]
    }));
  };

  const toggleScheduledDay = (dayIndex: number) => {
    setFormData(prev => ({
      ...prev,
      scheduledDays: prev.scheduledDays.includes(dayIndex)
        ? prev.scheduledDays.filter(d => d !== dayIndex)
        : [...prev.scheduledDays, dayIndex]
    }));
  };

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {expectation ? 'Edit Expectation' : 'Add New Expectation'}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Title */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Expectation Title *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.title}
                onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                placeholder="e.g., Keep room tidy, Clean kitchen"
              />
            </View>

            {/* Description */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Optional: Add more details..."
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Category */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoryContainer}>
                  {CATEGORIES.map(category => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryButton,
                        formData.category === category.id && styles.activeCategoryButton
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, category: category.id }))}
                    >
                      <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                      <Text style={[
                        styles.categoryText,
                        formData.category === category.id && styles.activeCategoryText
                      ]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Frequency */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Frequency</Text>
              {FREQUENCIES.map(freq => (
                <TouchableOpacity
                  key={freq.id}
                  style={[
                    styles.frequencyButton,
                    formData.frequency === freq.id && styles.activeFrequencyButton
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, frequency: freq.id as any }))}
                >
                  <View style={styles.frequencyInfo}>
                    <Text style={[
                      styles.frequencyName,
                      formData.frequency === freq.id && styles.activeFrequencyText
                    ]}>
                      {freq.name}
                    </Text>
                    <Text style={styles.frequencyDescription}>{freq.description}</Text>
                  </View>
                  <View style={[
                    styles.radioButton,
                    formData.frequency === freq.id && styles.activeRadioButton
                  ]} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Scheduled Days (for daily frequency) */}
            {formData.frequency === 'daily' && (
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Which days?</Text>
                <View style={styles.weekdaysContainer}>
                  {WEEKDAYS.map((day, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.weekdayButton,
                        formData.scheduledDays.includes(index) && styles.activeWeekdayButton
                      ]}
                      onPress={() => toggleScheduledDay(index)}
                    >
                      <Text style={[
                        styles.weekdayText,
                        formData.scheduledDays.includes(index) && styles.activeWeekdayText
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Assign to Children */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Assign to</Text>
              {children.map(child => (
                <TouchableOpacity
                  key={child.id}
                  style={styles.childAssignButton}
                  onPress={() => toggleChildAssignment(child.id)}
                >
                  <Text style={styles.childName}>{child.name}</Text>
                  <View style={[
                    styles.checkbox,
                    formData.assignedTo.includes(child.id) && styles.activeCheckbox
                  ]}>
                    {formData.assignedTo.includes(child.id) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Deduction */}
            <View style={styles.formRow}>
              <View style={styles.formHalf}>
                <Text style={styles.formLabel}>Deduction ($)</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.deduction}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, deduction: text }))}
                  keyboardType="decimal-pad"
                  placeholder="1.00"
                />
              </View>
            </View>

            {/* Save/Cancel Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>
                  {expectation ? 'Update Expectation' : 'Add Expectation'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ExpectationCard({ expectation, children, onEdit, onDelete, onMarkNotMet }: {
  expectation: Expectation;
  children: Child[];
  onEdit: () => void;
  onDelete: () => void;
  onMarkNotMet: (expectation: Expectation, childId: string) => void;
}) {
  const assignedChildren = children.filter(child => 
    expectation.assignedTo.includes(child.id)
  );

  const category = CATEGORIES.find(c => c.id === expectation.category) || CATEGORIES.find(c => c.id === 'general')!;

  const handleMarkNotMet = (child: Child) => {
    onMarkNotMet(expectation, child.id);
  };

  return (
    <View style={styles.choreCard}>
      <View style={styles.choreHeader}>
        <View style={styles.choreMainInfo}>
          <View style={styles.choreTitleRow}>
            <Text style={styles.categoryEmoji}>{category.emoji}</Text>
            <Text style={styles.choreTitle}>{expectation.title}</Text>
          </View>
          {expectation.description && (
            <Text style={styles.choreDescription}>{expectation.description}</Text>
          )}
          <View style={styles.choreMetadata}>
            <Text style={styles.choreFrequency}>
              {expectation.frequency === 'daily' ? '📅 Daily' :
               expectation.frequency === 'weekly' ? '📅 Weekly' :
               expectation.frequency === 'biweekly' ? '📅 Bi-weekly' :
               expectation.frequency === 'monthly' ? '📅 Monthly' : '📅 Custom'}
            </Text>
            <Text style={styles.choreDeduction}>-${expectation.deduction.toFixed(2)}</Text>
          </View>
        </View>
        
        <View style={styles.choreActions}>
          <TouchableOpacity style={styles.editButton} onPress={onEdit}>
            <Text style={styles.editButtonText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
            <Text style={styles.deleteButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Assigned Children & Mark Not Met Actions */}
      <View style={styles.choreFooter}>
        <View style={styles.assignedChildren}>
          <Text style={styles.assignedLabel}>Assigned to:</Text>
          {assignedChildren.map(child => (
            <View key={child.id} style={styles.childAssignment}>
              <Text style={styles.childName}>{child.name}</Text>
              <TouchableOpacity 
                style={styles.markNotMetButton}
                onPress={() => handleMarkNotMet(child)}
              >
                <Text style={styles.markNotMetButtonText}>Mark Not Met</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  addButtonText: {
    fontSize: 16,
    color: 'white',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  expectationsDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activeFilter: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterText: {
    fontSize: 14,
    color: '#6b7280',
  },
  activeFilterText: {
    color: 'white',
    fontWeight: '500',
  },
  choreCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  choreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  choreInfo: {
    flex: 1,
  },
  choreMainInfo: {
    flex: 1,
  },
  choreTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  choreTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
    flex: 1,
  },
  choreDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  choreMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  choreFrequency: {
    fontSize: 12,
    color: '#6b7280',
  },
  choreReward: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  choreDeduction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  choreActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
    fontSize: 16,
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  actionButtonText: {
    fontSize: 14,
  },
  choreDetails: {
    gap: 4,
  },
  choreDetailText: {
    fontSize: 12,
    color: '#6b7280',
  },
  choreFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  assignedChildren: {
    gap: 8,
  },
  assignedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  childAssignment: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 8,
    borderRadius: 6,
  },
  childName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  markNotMetButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  markNotMetButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  rewardModeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeModeButton: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeModeText: {
    color: '#1f2937',
    fontWeight: '600',
  },
  budgetContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  budgetLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 8,
  },
  budgetInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  distributeButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  distributeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statusCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  budgetSummary: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
  },
  budgetSummaryText: {
    fontSize: 14,
    color: '#1f2937',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
  },
  modalContent: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formHalf: {
    flex: 1,
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    minWidth: 80,
  },
  activeCategoryButton: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  categoryEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeCategoryText: {
    color: '#3b82f6',
  },
  frequencyButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    marginBottom: 8,
  },
  activeFrequencyButton: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  frequencyInfo: {
    flex: 1,
  },
  frequencyName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  activeFrequencyText: {
    color: '#3b82f6',
  },
  frequencyDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  activeRadioButton: {
    borderColor: '#3b82f6',
    backgroundColor: '#3b82f6',
  },
  weekdaysContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  weekdayButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    alignItems: 'center',
  },
  activeWeekdayButton: {
    borderColor: '#3b82f6',
    backgroundColor: '#3b82f6',
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeWeekdayText: {
    color: 'white',
  },
  childAssignButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCheckbox: {
    borderColor: '#3b82f6',
    backgroundColor: '#3b82f6',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#6b7280',
  },
}); 