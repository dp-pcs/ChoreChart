import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { DailyCheckIn } from '../../components/DailyCheckIn';
import { ChoreManagement } from '../../components/ChoreManagement';

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const isChild = user.role === 'CHILD';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {isChild ? '👋 Hey ' : '👨‍👩‍👧‍👦 Welcome back, '}
            {user.name}!
          </Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>

        {isChild ? <ChildDashboard router={router} /> : <ParentDashboard />}
      </ScrollView>
    </SafeAreaView>
  );
}

function ChildDashboard({ router }: { router: any }) {
  const [chores, setChores] = React.useState([
    { id: 1, title: "Make your bed", points: 2.00, reward: "$2.00", status: "pending" as const },
    { id: 2, title: "Feed the dog", points: 3.00, reward: "$3.00", status: "completed" as const },
    { id: 3, title: "Take out trash", points: 5.00, reward: "$5.00", status: "pending" as const },
  ]);
  const [pointRate, setPointRate] = React.useState(1.00); // 1 point = $1.00 default
  const [availablePoints, setAvailablePoints] = React.useState(12.50);
  const [bankedMoney, setBankedMoney] = React.useState(5.00);
  const [showBankingModal, setShowBankingModal] = React.useState(false);
  const [showCheckIn, setShowCheckIn] = React.useState(false);
  const [showSubmitTask, setShowSubmitTask] = React.useState(false);

  const handleChatPress = () => {
    router.push('/chat');
  };

  const handleCheckInPress = () => {
    setShowCheckIn(true);
  };

  const handleSubmitTaskPress = () => {
    setShowSubmitTask(true);
  };

  const handleCheckInSubmit = (data: any) => {
    console.log('📊 Daily Check-in submitted:', data);
    
    // Show success message
    Alert.alert(
      "Check-in Complete! 🎉",
      "Thanks for sharing about your day! This helps us understand you better.",
      [{ text: "Awesome!", onPress: () => setShowCheckIn(false) }]
    );
    
    // Here you would typically save the data to the backend
  };

  const handleCheckInClose = () => {
    setShowCheckIn(false);
  };

  const handleChoreComplete = (choreId: number) => {
    setChores(prevChores => 
      prevChores.map(chore => 
        chore.id === choreId 
          ? { ...chore, status: 'completed' as const }
          : chore
      )
    );
  };

  return (
    <>
      {/* Points-to-Currency Conversion Header */}
      <View style={styles.section}>
        <View style={styles.pointsConversionCard}>
          <Text style={styles.conversionTitle}>🏦 Your Points Value</Text>
          <Text style={styles.conversionSubtitle}>
            {availablePoints.toFixed(2)} Points = ${(availablePoints * pointRate).toFixed(2)} Value
          </Text>
          {bankedMoney > 0 && (
            <Text style={styles.bankedAmount}>
              💰 ${bankedMoney.toFixed(2)} Banked
            </Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 My Progress</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{availablePoints.toFixed(1)} pts</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>85%</Text>
            <Text style={styles.statLabel}>Completion</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>7</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Today's Chores</Text>
        <View style={styles.choresList}>
          {chores.map(chore => (
            <ChoreCard 
              key={chore.id}
              id={chore.id}
              title={chore.title} 
              points={chore.points}
              reward={chore.reward} 
              pointRate={pointRate}
              status={chore.status}
              onComplete={handleChoreComplete}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <ActionButton 
            title="Chat with Chorbit" 
            subtitle="Get help with planning"
            emoji="🤖"
            onPress={handleChatPress}
          />
          <ActionButton 
            title="Daily Check-in" 
            subtitle="How are you feeling?"
            emoji="💭"
            onPress={handleCheckInPress}
          />
          <ActionButton 
            title="Bank Points" 
            subtitle="Convert points to money"
            emoji="🏦"
            onPress={() => setShowBankingModal(true)}
          />
          <ActionButton 
            title="Submit Task" 
            subtitle="I did something extra!"
            emoji="⭐"
            onPress={handleSubmitTaskPress}
          />
        </View>
      </View>

      {/* Daily Check-in Modal */}
      <Modal visible={showCheckIn} transparent animationType="slide">
        <DailyCheckIn 
          onSubmit={handleCheckInSubmit} 
          onClose={handleCheckInClose} 
        />
      </Modal>

      {/* Submit Task Modal */}
      {showSubmitTask && (
        <SubmitTaskModal 
          onSubmit={() => setShowSubmitTask(false)}
          onClose={() => setShowSubmitTask(false)} 
        />
      )}

      {/* Banking Modal */}
      {showBankingModal && (
        <BankingModal
          availablePoints={availablePoints}
          pointRate={pointRate}
          onSubmit={(amount) => {
            console.log('Banking request:', amount);
            setShowBankingModal(false);
            // In real app, this would make API call
          }}
          onClose={() => setShowBankingModal(false)}
        />
      )}
    </>
  );
}

function SubmitTaskModal({ onSubmit, onClose }: { 
  onSubmit: () => void; 
  onClose: () => void; 
}) {
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    suggestedPoints: '',
  });

  const handleSubmit = () => {
    if (!taskData.title.trim()) {
      Alert.alert('Missing Info', 'Please tell us what you did!');
      return;
    }

    console.log('🌟 Spontaneous task submitted:', taskData);
    
    Alert.alert(
      'Task Submitted! 🎉',
      'Your parents will review your task and decide if you should be rewarded. Great job taking initiative!',
      [{ text: 'Awesome!', onPress: onSubmit }]
    );
  };

  const QUICK_TASKS = [
    { title: 'Cleaned my room thoroughly', points: 5.0 },
    { title: 'Helped with groceries', points: 3.0 },
    { title: 'Organized my backpack', points: 2.0 },
    { title: 'Helped with laundry', points: 4.0 },
    { title: 'Cleaned up common area', points: 3.0 },
    { title: 'Helped sibling with something', points: 2.0 },
  ];

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ScrollView 
            style={styles.modalContent}
            contentContainerStyle={styles.modalContentContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⭐ Submit a Task</Text>
              <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Did you do something helpful that wasn't on your regular chore list? Tell your parents about it!
            </Text>

            {/* Quick Task Buttons */}
            <View style={styles.quickTasksSection}>
              <Text style={styles.quickTasksTitle}>Quick Options:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.quickTasksGrid}>
                  {QUICK_TASKS.map((task, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.quickTaskButton}
                      onPress={() => setTaskData({
                        title: task.title,
                        description: '',
                        suggestedPoints: task.points.toString()
                      })}
                    >
                      <Text style={styles.quickTaskText}>{task.title}</Text>
                      <Text style={styles.quickTaskReward}>{task.points} pts</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Custom Task Form */}
            <View style={styles.customTaskSection}>
              <Text style={styles.customTaskTitle}>Or describe what you did:</Text>
              
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>What did you do? *</Text>
                <TextInput
                  style={styles.formInput}
                  value={taskData.title}
                  onChangeText={(text) => setTaskData(prev => ({ ...prev, title: text }))}
                  placeholder="e.g., I organized my closet"
                  multiline={true}
                  textAlignVertical="top"
                  autoCorrect={true}
                  autoCapitalize="sentences"
                  blurOnSubmit={false}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Tell us more (optional)</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={taskData.description}
                  onChangeText={(text) => setTaskData(prev => ({ ...prev, description: text }))}
                  placeholder="Add more details about what you did..."
                  multiline={true}
                  numberOfLines={3}
                  textAlignVertical="top"
                  autoCorrect={true}
                  autoCapitalize="sentences"
                  blurOnSubmit={false}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>How many points do you think it's worth?</Text>
                <TextInput
                  style={styles.formInput}
                  value={taskData.suggestedPoints}
                  onChangeText={(text) => setTaskData(prev => ({ ...prev, suggestedPoints: text }))}
                  placeholder="e.g., 3.0"
                  keyboardType="decimal-pad"
                  autoCorrect={false}
                  returnKeyType="done"
                />
                <Text style={styles.helpText}>
                  Your parents will decide the final points amount
                </Text>
              </View>
            </View>

            {/* Submit Button */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>Submit Task</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ParentDashboard() {
  const [showChoreManagement, setShowChoreManagement] = useState(false);
  
  // Mock children data - replace with real data
  const children = [
    { id: 'child-1', name: 'Noah', age: 10 },
    { id: 'child-2', name: 'Emma', age: 8 }
  ];

  const handleManageChores = () => {
    setShowChoreManagement(true);
  };

  return (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👨‍👩‍👧‍👦 Family Overview</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Pending Approvals</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>47.5 pts</Text>
            <Text style={styles.statLabel}>Weekly Points</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>92%</Text>
            <Text style={styles.statLabel}>Family Rate</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⏳ Needs Your Approval</Text>
        <View style={styles.choresList}>
          <ApprovalCard 
            child="Noah" 
            chore="Made bed" 
            time="8:30 AM" 
            points={2.0}
            reward="$2.00" 
          />
          <ApprovalCard 
            child="Noah" 
            chore="Fed the dog" 
            time="7:45 AM" 
            points={3.0}
            reward="$3.00" 
          />
        </View>
      </View>

      {/* New Section for Spontaneous Task Submissions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⭐ Task Submissions</Text>
        <View style={styles.choresList}>
          <TaskSubmissionCard 
            child="Noah" 
            task="Organized my closet" 
            description="I sorted all my clothes and put everything away neatly"
            time="2 hours ago" 
            suggestedPoints={5.0}
            suggestedReward="$5.00" 
          />
          <TaskSubmissionCard 
            child="Emma" 
            task="Helped with groceries" 
            description="I carried bags and put things away in the kitchen"
            time="4 hours ago" 
            suggestedPoints={3.0}
            suggestedReward="$3.00" 
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <ActionButton 
            title="Manage Chores" 
            subtitle="Add, edit, and organize chores"
            emoji="📋"
            onPress={handleManageChores}
          />
          <ActionButton 
            title="Manage Expectations" 
            subtitle="Set standards and track compliance"
            emoji="⭐"
            onPress={handleManageChores}
          />
          <ActionButton 
            title="View Schedule" 
            subtitle="See weekly chore calendar"
            emoji="📅"
            onPress={() => Alert.alert('Schedule View', 'Coming soon!')}
          />
          <ActionButton 
            title="Family Settings" 
            subtitle="Rewards, children, preferences"
            emoji="⚙️"
            onPress={() => Alert.alert('Settings', 'Coming soon!')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Family Insights</Text>
        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>🎯 This Week's Highlights</Text>
          <Text style={styles.insightText}>
            Noah has been consistently completing morning chores! 
            Consider discussing his interest in basketball for motivation.
          </Text>
        </View>
      </View>

      {/* Chore Management Modal */}
      {showChoreManagement && (
        <ChoreManagement 
          children={children}
          onClose={() => setShowChoreManagement(false)}
        />
      )}
    </>
  );
}

function TaskSubmissionCard({ child, task, description, time, suggestedPoints, suggestedReward }: { 
  child: string; 
  task: string; 
  description: string;
  time: string; 
  suggestedPoints: number;
  suggestedReward: string; 
}) {
  const handleApprove = () => {
    Alert.alert(
      "Set Points Amount",
      `How many points should ${child} earn for "${task}"?`,
      [
        { 
          text: `Use Suggested (${suggestedPoints} pts)`, 
          onPress: () => {
            console.log(`Approved: ${child} - ${task} - ${suggestedPoints} points`);
            Alert.alert('Task Approved! 🎉', `${child} will earn ${suggestedPoints} points for "${task}"`);
          }
        },
        { 
          text: "Custom Amount", 
          onPress: () => showCustomAmountInput()
        },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const showCustomAmountInput = () => {
    Alert.prompt(
      "Enter Custom Points",
      `How many points should ${child} earn for "${task}"?`,
      (customAmount) => {
        if (customAmount && !isNaN(parseFloat(customAmount))) {
          const amount = parseFloat(customAmount).toFixed(2);
          console.log(`Approved: ${child} - ${task} - ${amount} points`);
          Alert.alert('Task Approved! 🎉', `${child} will earn ${amount} points for "${task}"`);
        } else {
          Alert.alert('Invalid Amount', 'Please enter a valid number');
        }
      },
      'plain-text',
      suggestedPoints.toString(),
      'numeric'
    );
  };

  const handleDeny = () => {
    Alert.alert(
      "Deny Task Submission",
      `Why are you denying "${task}"?`,
      [
        { text: "Already rewarded", onPress: () => console.log(`Denied: Already rewarded`) },
        { text: "Not worth rewarding", onPress: () => console.log(`Denied: Not worth it`) },
        { text: "Should be expectation", onPress: () => console.log(`Denied: Should be expectation`) },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  return (
    <View style={styles.taskSubmissionCard}>
      <View style={styles.taskSubmissionInfo}>
        <Text style={styles.taskSubmissionChild}>⭐ {child}</Text>
        <Text style={styles.taskSubmissionTitle}>{task}</Text>
        <Text style={styles.taskDescription}>{description}</Text>
        <Text style={styles.taskSubmissionTime}>{time}</Text>
      </View>
      <View style={styles.taskSubmissionActions}>
        <Text style={styles.taskSubmissionReward}>Suggested: {suggestedPoints} pts</Text>
        <View style={styles.taskSubmissionButtons}>
          <TouchableOpacity style={styles.taskDenyButton} onPress={handleDeny}>
            <Text style={styles.taskDenyButtonText}>❌</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.taskApproveButton} onPress={handleApprove}>
            <Text style={styles.taskApproveButtonText}>✅</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function ChoreCard({ id, title, points, reward, pointRate, status, onComplete }: { id: number; title: string; points: number; reward: string; pointRate: number; status: 'pending' | 'completed'; onComplete: (choreId: number) => void }) {
  const handleChorePress = () => {
    if (status === 'pending') {
      Alert.alert(
        "Complete Chore",
        `Mark "${title}" as completed?`,
        [
          { text: "Yes, I did it!", onPress: () => onComplete(id) },
          { text: "Cancel", style: "cancel" }
        ]
      );
    } else {
      Alert.alert("Chore Completed", `You already completed "${title}" - great job! 🎉`);
    }
  };

  return (
    <TouchableOpacity style={styles.choreCard} onPress={handleChorePress}>
      <View style={styles.choreInfo}>
        <Text style={styles.choreTitle}>{title}</Text>
        <Text style={styles.choreReward}>{points} pts</Text>
        <Text style={styles.choreRewardDollar}>${(points * pointRate).toFixed(2)}</Text>
      </View>
      <View style={[styles.statusBadge, status === 'completed' && styles.completedBadge]}>
        <Text style={[styles.statusText, status === 'completed' && styles.completedText]}>
          {status === 'completed' ? '✅ Done' : '⏳ Todo'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function ApprovalCard({ child, chore, time, points, reward }: { child: string; chore: string; time: string; points: number; reward: string }) {
  const handleApprove = () => {
    Alert.alert(
      "Approve Chore",
      `Approve ${child}'s completion of "${chore}" for ${points} points?`,
      [
        { text: "Yes, approve!", onPress: () => console.log(`Approved: ${child} - ${chore} - ${points} points`) },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const handleDeny = () => {
    Alert.alert(
      "Deny Chore",
      `Deny ${child}'s completion of "${chore}"?`,
      [
        { text: "Yes, deny", onPress: () => console.log(`Denied: ${child} - ${chore}`) },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  return (
    <View style={styles.approvalCard}>
      <View style={styles.approvalInfo}>
        <Text style={styles.approvalChild}>{child}</Text>
        <Text style={styles.approvalChore}>{chore}</Text>
        <Text style={styles.approvalTime}>{time}</Text>
      </View>
      <View style={styles.approvalActions}>
        <Text style={styles.approvalReward}>{points} pts</Text>
        <View style={styles.approvalButtons}>
          <TouchableOpacity style={styles.approveButton} onPress={handleApprove}>
            <Text style={styles.approveButtonText}>✅</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.denyButton} onPress={handleDeny}>
            <Text style={styles.denyButtonText}>❌</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function BankingModal({ availablePoints, pointRate, onSubmit, onClose }: {
  availablePoints: number;
  pointRate: number;
  onSubmit: (amount: number) => void;
  onClose: () => void;
}) {
  const [requestAmount, setRequestAmount] = useState('');
  const maxValue = (availablePoints * pointRate).toFixed(2);

  const handleSubmit = () => {
    const amount = parseFloat(requestAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }
    if (amount > parseFloat(maxValue)) {
      Alert.alert('Too Much!', `You can only request up to $${maxValue} (${availablePoints} points)`);
      return;
    }
    
    const pointsToBank = amount / pointRate;
    Alert.alert(
      'Banking Request Submitted! 🏦',
      `You've requested to bank ${pointsToBank.toFixed(2)} points for $${amount.toFixed(2)}. Your parents will review this request.`,
      [{ text: 'Great!', onPress: () => onSubmit(amount) }]
    );
  };

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🏦 Bank Your Points</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.modalDescription}>
            Convert your points to money that your parents can give you!
          </Text>

          <View style={styles.bankingInfo}>
            <Text style={styles.bankingInfoText}>
              💰 Available: {availablePoints.toFixed(2)} points (${maxValue})
            </Text>
            <Text style={styles.bankingInfoText}>
              📊 Rate: 1 point = ${pointRate.toFixed(2)}
            </Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>How much money do you want?</Text>
            <TextInput
              style={styles.formInput}
              value={requestAmount}
              onChangeText={setRequestAmount}
              placeholder={`$0.00 (max $${maxValue})`}
              keyboardType="decimal-pad"
              autoCorrect={false}
            />
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Request Banking</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ActionButton({ title, subtitle, emoji, onPress }: { title: string; subtitle: string; emoji: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      <Text style={styles.actionEmoji}>{emoji}</Text>
      <View style={styles.actionText}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  choresList: {
    gap: 8,
  },
  choreCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  choreInfo: {
    flex: 1,
  },
  choreTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  choreReward: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  completedBadge: {
    backgroundColor: '#d1fae5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#92400e',
  },
  completedText: {
    color: '#065f46',
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  approvalCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  approvalInfo: {
    flex: 1,
  },
  approvalChild: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 2,
  },
  approvalChore: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  approvalTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  approvalActions: {
    alignItems: 'flex-end',
  },
  approvalReward: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 8,
  },
  approvalButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#10b981',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  denyButton: {
    backgroundColor: '#ef4444',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButtonText: {
    color: 'white',
    fontSize: 14,
  },
  denyButtonText: {
    color: 'white',
    fontSize: 14,
  },
  insightCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    width: '100%',
    maxHeight: '85%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  modalDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  quickTasksSection: {
    marginBottom: 20,
  },
  quickTasksTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  quickTasksGrid: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  quickTaskButton: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    height: 80,
  },
  quickTaskText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  quickTaskReward: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    textAlign: 'center',
  },
  customTaskSection: {
    marginBottom: 20,
  },
  customTaskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  formSection: {
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  formInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 12,
    borderRadius: 8,
    color: '#1f2937',
    fontSize: 16,
    minHeight: 44,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 12,
    color: '#6b7280',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  taskSubmissionCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskSubmissionInfo: {
    flex: 1,
  },
  taskSubmissionChild: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 2,
  },
  taskSubmissionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  taskDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  taskSubmissionTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  taskSubmissionActions: {
    alignItems: 'flex-end',
  },
  taskSubmissionReward: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 8,
  },
  taskSubmissionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  taskDenyButton: {
    backgroundColor: '#ef4444',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskApproveButton: {
    backgroundColor: '#10b981',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskApproveButtonText: {
    color: 'white',
    fontSize: 14,
  },
  taskDenyButtonText: {
    color: 'white',
    fontSize: 14,
  },
  pointsConversionCard: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  conversionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  conversionSubtitle: {
    fontSize: 14,
    color: '#e0e7ff',
    textAlign: 'center',
  },
  bankedAmount: {
    fontSize: 12,
    color: '#fbbf24',
    marginTop: 4,
    fontWeight: '600',
  },
  choreRewardDollar: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  bankingInfo: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  bankingInfoText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
    textAlign: 'center',
  },
}); 